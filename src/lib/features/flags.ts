import { db } from '@/lib/db'

export async function isFeatureEnabled(key: string, workspaceId?: string): Promise<boolean> {
  const flag = await db.featureFlag.findFirst({
    where: { key, workspaceId: workspaceId || null },
    select: { enabled: true },
  })

  if (!flag) return false
  return flag.enabled
}

export async function getFeatureFlags(workspaceId?: string): Promise<Record<string, boolean>> {
  const flags = await db.featureFlag.findMany({
    where: { workspaceId: workspaceId || null },
    select: { key: true, enabled: true },
  })

  return Object.fromEntries(flags.map((f) => [f.key, f.enabled]))
}

export async function setFeatureFlag(
  key: string,
  enabled: boolean,
  workspaceId?: string
): Promise<void> {
  await db.featureFlag.upsert({
    where: { key },
    update: { enabled, workspaceId: workspaceId || null },
    create: { key, enabled, workspaceId: workspaceId || null, name: key },
  })
}

export async function getAllFeatureFlags(): Promise<Array<{
  id: string
  key: string
  name: string
  description: string
  enabled: boolean
  workspaceId: string | null
}>> {
  return db.featureFlag.findMany({
    orderBy: { key: 'asc' },
  })
}

export const FeatureFlags = {
  AI_STUDIO: 'ai_studio',
  COLLABORATION: 'collaboration',
  WEBHOOKS: 'webhooks',
  CUSTOM_DOMAINS: 'custom_domains',
  WHITELABEL: 'whitelabel',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  MULTI_TENANCY: 'multi_tenancy',
  API_ACCESS: 'api_access',
} as const
