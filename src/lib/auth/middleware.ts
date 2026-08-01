import { NextRequest, NextResponse } from 'next/server'
import { decryptSession, encryptSession } from './session'
import { authConfig } from './config'

export async function updateSession(request: NextRequest) {
  const sessionToken = request.cookies.get(authConfig.cookieName)?.value

  if (!sessionToken) return NextResponse.next()

  const payload = await decryptSession(sessionToken)
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete(authConfig.cookieName)
    return response
  }

  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = (payload.exp as number) - now

  if (timeUntilExpiry < authConfig.sessionMaxAge / 4) {
    const newToken = await encryptSession({
      userId: payload.userId,
      sessionId: payload.sessionId,
      workspaceId: payload.workspaceId,
    })

    const response = NextResponse.next()
    response.cookies.set(authConfig.cookieName, newToken, {
      maxAge: authConfig.sessionMaxAge,
      httpOnly: true,
      secure: authConfig.cookieSecure,
      sameSite: 'lax',
    })
    return response
  }

  return NextResponse.next()
}
