import { NextRequest, NextResponse } from 'next/server'
import { refreshSession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'

export async function POST(request: NextRequest) {
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

  const response = NextResponse.json({
    success: true,
    user: { id: result.user.id, email: result.user.email, name: result.user.name },
  })
  
  response.cookies.set(authConfig.cookieName, result.token, {
    maxAge: authConfig.sessionMaxAge,
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: 'lax',
  })

  return response
}