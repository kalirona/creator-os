'use server'

import { loginSchema, validatedAction } from '@/lib/validations/auth'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'
import { cookies } from 'next/headers'

export const login = validatedAction(loginSchema, async (data) => {
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

  const { token, session } = await createSession(user.id)

  const cookieStore = await cookies()
  cookieStore.set(authConfig.cookieName, token, {
    maxAge: authConfig.sessionMaxAge,
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: 'lax',
  })

  return { success: true, redirectTo: '/' }
})
