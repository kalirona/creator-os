'use server'

import { loginSchema, validatedAction } from '@/lib/validations/auth'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

export const login = validatedAction(loginSchema, async (data) => {
  const ip = await getClientIp()
  const rateLimit = checkRateLimit(ip, 'login')
  if (!rateLimit.allowed) {
    return { error: 'Too many login attempts. Please try again later.' }
  }

  const user = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, name: true, passwordHash: true, role: true },
  })

  if (!user || !user.passwordHash) {
    return { error: 'Invalid email or password' }
  }

  const isValid = await verifyPassword(data.password, user.passwordHash)
  if (!isValid) {
    return { error: 'Invalid email or password' }
  }

  const { token } = await createSession(user.id)

  const cookieStore = await cookies()
  cookieStore.set(authConfig.cookieName, token, {
    maxAge: authConfig.sessionMaxAge,
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: 'lax',
  })

  return { success: true, redirectTo: '/' }
})
