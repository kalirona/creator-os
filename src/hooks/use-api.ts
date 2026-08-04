'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(url: string | null, deps: unknown[] = []): UseApiState<T> {
  const router = useRouter()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!url) {
      setData(null)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    fetch(url, { credentials: 'include' })
      .then(async (r) => {
        if (r.status === 401) {
          // Session invalid/missing — bounce to login so the user can re-authenticate
          // instead of surfacing "Request failed (401)".
          if (active) router.replace('/login')
          throw new Error('Authentication required')
        }
        if (!r.ok) throw new Error(`Request failed (${r.status})`)
        const json = await r.json()
        if (active) setData(json)
      })
      .catch((e) => {
        if (e instanceof Error && e.message === 'Authentication required') return
        if (active) setError(e.message)
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [url, tick, ...deps, router])

  return { data, loading, error, refetch }
}

export function formatCurrency(n: number, opts: { compact?: boolean } = {}) {
  if (opts.compact && n >= 1000) {
    return '$' + Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  }
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function formatNumber(n: number, compact = false) {
  if (compact && n >= 1000) return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  return Intl.NumberFormat('en').format(n)
}

export function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
