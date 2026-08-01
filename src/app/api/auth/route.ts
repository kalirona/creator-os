import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword, validatePasswordStrength, createSession, refreshSession, destroySession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body

  if (action === 'login') {
    const { email, password } = body

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true, role: true },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const { token, session } = await createSession(user.id)

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    response.cookies.set(authConfig.cookieName, token, {
      maxAge: authConfig.sessionMaxAge,
      httpOnly: true,
      secure: authConfig.cookieSecure,
      sameSite: 'lax',
    })

    return response
  }

  if (action === 'register') {
    const { name, email, password, workspaceName } = body

    const { valid, errors } = validatePasswordStrength(password)
    if (!valid) {
      return NextResponse.json({ error: errors[0] }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const result = await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: workspaceName, slug: workspaceName.toLowerCase().replace(/\s+/g, '-') },
      })

      const user = await tx.user.create({
        data: { email, name, passwordHash },
      })

      await tx.workspaceMember.create({
        data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
      })

      return { user, workspace }
    })

    const { token } = await createSession(result.user.id, result.workspace.id)

    const response = NextResponse.json({ success: true, user: { id: result.user.id, email: result.user.email } })
    response.cookies.set(authConfig.cookieName, token, {
      maxAge: authConfig.sessionMaxAge,
      httpOnly: true,
      secure: authConfig.cookieSecure,
      sameSite: 'lax',
    })

    return response
  }

  if (action === 'logout') {
    const sessionToken = request.cookies.get(authConfig.cookieName)?.value
    if (sessionToken) {
      const { decryptSession } = await import('@/lib/auth')
      const payload = await decryptSession(sessionToken)
      if (payload) {
        await destroySession(payload.sessionId)
      }
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete(authConfig.cookieName)
    return response
  }

  if (action === 'refresh') {
    const sessionToken = request.cookies.get(authConfig.cookieName)?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const result = await refreshSession(sessionToken)
    if (!result) {
      const response = NextResponse.json({ error: 'Session expired' }, { status: 401 })
      response.cookies.delete(authConfig.cookieName)
      return response
    }

    const response = NextResponse.json({ success: true, user: { id: result.user.id, email: result.user.email } })
    response.cookies.set(authConfig.cookieName, result.token, {
      maxAge: authConfig.sessionMaxAge,
      httpOnly: true,
      secure: authConfig.cookieSecure,
      sameSite: 'lax',
    })

    return response
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
