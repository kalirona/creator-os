import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/auth/middleware'
import { authConfig } from '@/lib/auth/config'

function primaryHosts(): Set<string> {
  const set = new Set<string>(['creatoros.io', 'www.creatoros.io', 'localhost', 'os.sitenexai.com', 'www.sitenexai.com'])
  const extra = process.env.PRIMARY_HOSTS
  if (extra) {
    for (const h of extra.split(',')) {
      const clean = h.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '')
      if (clean) set.add(clean)
    }
  }
  return set
}

function isCustomDomainHost(host: string) {
  const h = host.replace(/:\d+$/, '').toLowerCase()
  const hosts = primaryHosts()
  if (hosts.has(h)) return false
  if (h.endsWith('.creatoros.io')) return false
  if (h.endsWith('.sitenexai.com')) return false
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Custom domain -> route through /d/[domain] resolver (public)
  if (isCustomDomainHost(host)) {
    const domain = encodeURIComponent(host.replace(/:\d+$/, '').toLowerCase())
    const url = request.nextUrl.clone()
    url.pathname = `/d/${domain}`
    url.search = ''
    return NextResponse.rewrite(url)
  }

  const publicRoutes = ['/login', '/register', '/api/auth', '/p/', '/f/', '/d/']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api/')

  if (isPublicRoute) return NextResponse.next()

  // For API routes, don't redirect to login - let handlers return 401 JSON
  // For page routes, redirect to login if not authenticated
  if (!isApiRoute) {
    return updateSession(request)
  }

  // For API routes, only refresh token if present, don't redirect
  const sessionToken = request.cookies.get(authConfig.cookieName)?.value
  if (!sessionToken) {
    return NextResponse.next()
  }

  // Try to refresh the session token silently
  try {
    return await updateSession(request)
  } catch {
    // If updateSession throws (invalid token), delete cookie and continue
    const response = NextResponse.next()
    response.cookies.delete(authConfig.cookieName)
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
