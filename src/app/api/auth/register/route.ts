import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePasswordStrength, createSession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'
import { checkRateLimit, clearRateLimit, getClientIpFromRequest } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/logging/audit'
import { logActivity } from '@/lib/logging/activity'

export async function POST(request: NextRequest) {
  const ip = getClientIpFromRequest(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip')
  )
  const body = await request.json()
  const { name, email, password, workspaceName, workspaceSlug, country, timezone, acceptTerms, newsletter } = body

  const rateLimit = checkRateLimit(ip, 'register')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    )
  }

  if (!acceptTerms) {
    return NextResponse.json({ error: 'You must accept the terms and conditions' }, { status: 400 })
  }

  const { valid, errors } = validatePasswordStrength(password)
  if (!valid) {
    return NextResponse.json({ error: errors[0] }, { status: 400 })
  }

  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
  }

  const slug = workspaceSlug || workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const existingWorkspace = await db.workspace.findUnique({ where: { slug } })
  if (existingWorkspace) {
    return NextResponse.json({ error: 'Workspace slug already taken' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  const result = await db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug,
      },
    })

    const user = await tx.user.create({
      data: {
        email,
        name,
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

  const response = NextResponse.json({
    success: true,
    user: { id: result.user.id, email: result.user.email, name: result.user.name },
    workspaceId: result.workspace.id,
  })
  
  response.cookies.set(authConfig.cookieName, token, {
    maxAge: authConfig.sessionMaxAge,
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: 'lax',
  })

  clearRateLimit(ip)

  await logAuditEvent('user.register', {
    userId: result.user.id,
    workspaceId: result.workspace.id,
    resource: 'User',
    resourceId: result.user.id,
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') || undefined,
  })
  await logActivity('user.register' as any, {
    userId: result.user.id,
    workspaceId: result.workspace.id,
    description: 'User registered and created workspace',
  })

  return response
}