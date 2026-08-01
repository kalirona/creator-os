import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class EmailService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'email_campaign', 'read')
    return db.emailCampaign.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const emailService = new EmailService()
