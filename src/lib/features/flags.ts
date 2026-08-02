import { db } from '@/lib/db'

export async function getFeatureFlags(workspaceId?: string): Promise<Record<string, boolean>> {
  const flags = await db.featureFlag.findMany({
    where: { workspaceId: workspaceId || null },
    select: { key: true, enabled: true },
  })

  return Object.fromEntries(flags.map((f) => [f.key, f.enabled]))
}