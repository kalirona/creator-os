'use server'

import { db } from '@/lib/db'
import { authConfig } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/logging/audit'
import { validatedAction, ActionState } from '@/lib/validations/auth'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const forgotPassword = validatedAction(forgotPasswordSchema, async (data) => {
  const ip = await getClientIp()
  const rateLimit = checkRateLimit(ip, 'forgot-password')
  if (!rateLimit.allowed) {
    return { error: 'Too many requests. Please try again later.' } as ActionState
  }

  const user = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, name: true },
  })

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true, message: 'If an account exists, a reset email has been sent.' }
  }

  // Invalidate any existing unused reset tokens
  await db.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  // Create reset token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  // TODO: Send email with reset link
  // In production, integrate with email service
  // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
  // await sendEmail(user.email, 'Reset your password', `Click here: ${resetUrl}`)

  await logAuditEvent('user.password_reset_request', {
    userId: user.id,
    resource: 'User',
    resourceId: user.id,
    ipAddress: ip,
  })

  return { success: true, message: 'If an account exists, a reset email has been sent.' }
})