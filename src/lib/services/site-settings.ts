import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class SiteSettingService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'workspace_setting', 'read')
    return db.siteSetting.findMany({
      orderBy: { category: 'asc' },
    })
  }
}

export const siteSettingService = new SiteSettingService()
