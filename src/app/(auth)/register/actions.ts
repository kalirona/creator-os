'use server'

import { registerSchema, validatedAction } from '@/lib/validations/auth'
import { db } from '@/lib/db'
import { hashPassword, validatePasswordStrength, createSession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

export const register = validatedAction(registerSchema, async (data) => {
  const ip = await getClientIp()
  const rateLimit = checkRateLimit(ip, 'register')
  if (!rateLimit.allowed) {
    return { error: 'Too many registration attempts. Please try again later.' }
  }

  const { valid, errors } = validatePasswordStrength(data.password)
  if (!valid) {
    return { error: errors[0] }
  }

  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    return { error: 'This email is already in use' }
  }

  const slug = data.workspaceSlug || data.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const existingWorkspace = await db.workspace.findUnique({ where: { slug } })
  if (existingWorkspace) {
    return { error: 'Workspace slug already taken' }
  }

  const passwordHash = await hashPassword(data.password)

  const result = await db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: data.workspaceName,
        slug,
      },
    })

    const user = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
      },
    })

    await tx.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    })

    return { user, workspace }
  })

  const { token } = await createSession(result.user.id, result.workspace.id)

  const cookieStore = await cookies()
  cookieStore.set(authConfig.cookieName, token, {
    maxAge: authConfig.sessionMaxAge,
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: 'lax',
  })

  return { success: true, redirectTo: '/' }
})
