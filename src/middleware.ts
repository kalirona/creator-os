import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/auth/middleware'

const PRIMARY_HOSTS = new Set(['creatoros.io', 'www.creatoros.io', 'localhost'])

function isCustomDomainHost(host: string) {
  const h = host.replace(/:\d+$/, '').toLowerCase()
  if (PRIMARY_HOSTS.has(h)) return false
  if (h.endsWith('.creatoros.io')) return false
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

  if (isPublicRoute) return NextResponse.next()

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
