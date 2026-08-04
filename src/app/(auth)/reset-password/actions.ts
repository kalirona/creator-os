'use server'

import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { logAuditEvent } from '@/lib/logging/audit'
import { validatedAction, ActionState } from '@/lib/validations/auth'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ResetPasswordState = ActionState

export const resetPassword = validatedAction(resetPasswordSchema, async (data): Promise<ActionState> => {
  if (!data.token || !data.password) {
    return { error: 'Token and password are required' } as ActionState
  }

  const resetRecord = await db.passwordReset.findUnique({
    where: { token: data.token },
    include: { user: true },
  })

  if (!resetRecord || resetRecord.expiresAt < new Date() || resetRecord.usedAt) {
    return { error: 'Invalid or expired reset token' } as ActionState
  }

  const passwordHash = await hashPassword(data.password)

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    })

    await tx.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    })

    await tx.session.deleteMany({
      where: { userId: resetRecord.userId },
    })
  })

  await logAuditEvent('user.password_reset', {
    userId: resetRecord.userId,
    resource: 'User',
    resourceId: resetRecord.userId,
  })

  return { success: true, message: 'Password has been reset. Please log in.' }
})