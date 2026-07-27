import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

// GET blocks for a page
export async function GET(req: NextRequest) {
  const pageId = req.nextUrl.searchParams.get('pageId')
  if (!pageId) return NextResponse.json({ blocks: [] })
  const blocks = await db.webPageBlock.findMany({ where: { pageId }, orderBy: { position: 'asc' } })
  return NextResponse.json({ blocks: blocks.map((b) => ({ ...b, content: JSON.parse(b.content || '{}') })) })
}

// PUT — update a block's content
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, content } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const block = await db.webPageBlock.update({ where: { id }, data: { content: JSON.stringify(content) } })
    return NextResponse.json({ success: true, block })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

// POST — create a new block on a page
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pageId, type, content, position } = body
    if (!pageId || !type) return NextResponse.json({ error: 'pageId and type required' }, { status: 400 })
    const count = await db.webPageBlock.count({ where: { pageId } })
    const block = await db.webPageBlock.create({ data: { pageId, type, content: JSON.stringify(content || {}), position: position ?? count } })
    return NextResponse.json({ success: true, block })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

// DELETE a block
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.webPageBlock.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
