import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  const campaigns = await db.emailCampaign.findMany({ orderBy: { createdAt: 'desc' } })
  const subscribers = 12400
  const sent = campaigns.filter((c) => c.status === 'SENT')
  const totalSent = sent.reduce((s, c) => s + c.recipients, 0)
  const avgOpen = sent.length ? sent.reduce((s, c) => s + c.openRate, 0) / sent.length : 0
  const avgClick = sent.length ? sent.reduce((s, c) => s + c.clickRate, 0) / sent.length : 0
  return NextResponse.json({
    stats: { subscribers, campaigns: campaigns.length, totalSent, avgOpen, avgClick },
    campaigns: campaigns.map((c) => ({
      id: c.id, name: c.name, subject: c.subject, type: c.type, status: c.status,
      recipients: c.recipients, openRate: c.openRate, clickRate: c.clickRate, date: c.createdAt,
    })),
  })
}
