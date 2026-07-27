import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  const products = await db.product.findMany({ orderBy: { salesCount: 'desc' } })
  return NextResponse.json(products.map((p) => ({
    id: p.id, name: p.name, description: p.description, type: p.type, price: p.price,
    compareAt: p.compareAt, salesCount: p.salesCount, rating: p.rating, status: p.status, coverUrl: p.coverUrl,
    revenue: p.salesCount * p.price,
  })))
}
