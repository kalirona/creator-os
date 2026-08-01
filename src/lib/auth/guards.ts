import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { decryptSession, encryptSession } from './session'
import { authConfig } from './config'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(authConfig.cookieName)?.value

  if (!sessionToken) return null

  const payload = await decryptSession(sessionToken)
  if (!payload) return null

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      credits: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) return null

  return { ...user, sessionId: payload.sessionId, workspaceId: payload.workspaceId }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }
  return user
}

export async function requireWorkspaceMember(workspaceId: string) {
  const user = await requireUser()
  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId },
  })
  if (!membership) redirect('/unauthorized')
  return { ...user, membership }
}

export async function createSession(userId: string, workspaceId?: string) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + authConfig.sessionMaxAge * 1000)

  const session = await db.session.create({
    data: {
      userId,
      refreshToken: crypto.randomUUID(),
      expiresAt,
      lastSeenAt: now,
      workspaceId: workspaceId || undefined,
    },
  })

  const token = await encryptSession({
    userId,
    sessionId: session.id,
    workspaceId: workspaceId || undefined,
  })

  return { token, session }
}

export async function destroySession(sessionId: string) {
  await db.session.delete({ where: { id: sessionId } }).catch(() => {})
}

export async function refreshSession(sessionToken: string) {
  const payload = await decryptSession(sessionToken)
  if (!payload) return null

  const session = await db.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: payload.sessionId } }).catch(() => {})
    return null
  }

  await db.session.update({
    where: { id: payload.sessionId },
    data: { lastSeenAt: new Date() },
  })

  const newToken = await encryptSession({
    userId: payload.userId,
    sessionId: payload.sessionId,
    workspaceId: payload.workspaceId,
  })

  return { token: newToken, user: session.user }
}
