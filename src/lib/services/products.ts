import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/logging'
import { type RequestContext, requirePermission } from '@/lib/context'

export class ProductService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'product', 'read')
    const products = await db.product.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
    })

    return products.map((p) => ({
      id: p.id, name: p.name, description: p.description, type: p.type, price: p.price,
      compareAt: p.compareAt, salesCount: p.salesCount, rating: p.rating, status: p.status,
      coverUrl: p.coverUrl, fileUrl: p.fileUrl, createdAt: p.createdAt,
      revenue: p.salesCount * p.price,
    }))
  }

  async create(ctx: RequestContext, data: {
    name: string
    description?: string
    type?: string
    price: number
    compareAt?: number
    coverUrl?: string
    fileUrl?: string
    status?: string
  }) {
    await requirePermission(ctx, 'product', 'create')

    if (!data.name || !data.name.trim()) throw new Error('Product name is required')

    const product = await db.product.create({
      data: {
        workspaceId: ctx.workspace.id,
        name: data.name.trim(),
        description: data.description || '',
        type: data.type || 'DIGITAL',
        price: data.price || 0,
        compareAt: data.compareAt || null,
        coverUrl: data.coverUrl || null,
        fileUrl: data.fileUrl || null,
        status: data.status || 'DRAFT',
      },
    })

    await logAuditEvent('product.create', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Product',
      resourceId: product.id,
    })

    return { id: product.id, name: product.name, status: product.status }
  }

  async update(ctx: RequestContext, id: string, data: Record<string, unknown>) {
    await requirePermission(ctx, 'product', 'update')

    const existing = await db.product.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
    })
    if (!existing) throw new Error('Product not found')

    const product = await db.product.update({ where: { id }, data })

    await logAuditEvent('product.update', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Product',
      resourceId: product.id,
    })

    return { id: product.id, name: product.name, status: product.status }
  }

  async delete(ctx: RequestContext, id: string) {
    await requirePermission(ctx, 'product', 'delete')

    const existing = await db.product.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
    })
    if (!existing) throw new Error('Product not found')

    await db.product.delete({ where: { id } })

    await logAuditEvent('product.delete', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Product',
      resourceId: id,
    })

    return { success: true }
  }
}

export const productService = new ProductService()
