import { db } from '@/lib/db'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = CACHE_TTL
): Promise<T> {
  const cached = await db.cache.findFirst({
    where: {
      key,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { value: true },
  })

  if (cached) {
    try {
      return JSON.parse(cached.value) as T
    } catch {
      // Invalid JSON, fall through to fetch
    }
  }

  const value = await fetcher()

  await db.cache.upsert({
    where: { key },
    update: {
      value: JSON.stringify(value),
      expiresAt: new Date(Date.now() + ttlMs),
    },
    create: {
      key,
      value: JSON.stringify(value),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  })

  return value
}

export async function invalidateCache(key: string): Promise<void> {
  await db.cache.delete({ where: { key } }).catch(() => {})
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  await db.cache.deleteMany({
    where: { key: { contains: pattern } },
  })
}

export async function clearCache(): Promise<void> {
  await db.cache.deleteMany()
}

export class Cache {
  static async get<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    return getCached(key, fetcher, ttlMs)
  }

  static async invalidate(key: string): Promise<void> {
    return invalidateCache(key)
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    return invalidateCachePattern(pattern)
  }

  static async clear(): Promise<void> {
    return clearCache()
  }
}
