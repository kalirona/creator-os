import { db } from '@/lib/db'
import { createRequestContext } from '@/lib/context'
import { getStorageProvider, validateFile, getAssetFolder } from './storage'

export interface MediaAssetData {
  id?: string
  workspaceId: string
  folderId?: string
  userId: string
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  duration?: number
  thumbnailUrl?: string
  url: string
  altText?: string
  caption?: string
  description?: string
}

export interface MediaFolderData {
  workspaceId: string
  parentId?: string
  name: string
  slug: string
  description?: string
}

export interface MediaUsageData {
  assetId: string
  workspaceId: string
  resourceType: string
  resourceId: string
  field: string
}

export class MediaService {
  private storage: ReturnType<typeof getStorageProvider>

  constructor() {
    this.storage = getStorageProvider({
      provider: 'local',
      baseUrl: process.env.MEDIA_BASE_URL || '/media',
    })
  }

  async listAssets(ctx: Awaited<ReturnType<typeof createRequestContext>>, folderId?: string, search?: string, page = 1, perPage = 48) {
    const where: Record<string, unknown> = { workspaceId: ctx.workspace.id }
    if (folderId) where.folderId = folderId
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const assets = await db.mediaAsset.findMany({
      where,
      include: { folder: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    const total = await db.mediaAsset.count({ where })

    return { assets, total, page, perPage, totalPages: Math.ceil(total / perPage) }
  }

  async getAsset(ctx: Awaited<ReturnType<typeof createRequestContext>>, id: string) {
    const asset = await db.mediaAsset.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
      include: { folder: true, usages: { orderBy: { createdAt: 'desc' } } },
    })
    if (!asset) throw new Error('Asset not found')
    return asset
  }

  async uploadAsset(ctx: Awaited<ReturnType<typeof createRequestContext>>, file: { name: string; size: number; type: string; buffer: Buffer }, folderId?: string, altText?: string) {
    const validation = validateFile(file)
    if (!validation.valid) throw new Error(validation.error)

    const folder = folderId ? await db.mediaFolder.findFirst({ where: { id: folderId, workspaceId: ctx.workspace.id } }) : null
    const folderPath = folder ? folder.slug : getAssetFolder({ mimeType: file.type, fileName: file.name })
    const ext = extname(file.name) || '.bin'
    const safeName = `${randomUUID()}${ext}`
    const path = `${folderPath}/${safeName}`

    const { url, size } = await this.storage.upload(file.buffer, path)

    let width: number | undefined
    let height: number | undefined
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        const dimensions = await getImageDimensions(file.buffer)
        width = dimensions.width
        height = dimensions.height
      } catch { /* ignore */ }
    }

    const asset = await db.mediaAsset.create({
      data: {
        workspaceId: ctx.workspace.id,
        folderId: folderId || null,
        userId: ctx.user.id,
        fileName: safeName,
        originalName: file.name,
        mimeType: file.type,
        fileSize: size,
        width,
        height,
        thumbnailUrl: file.type.startsWith('image/') ? url : undefined,
        url,
        altText: altText || '',
        caption: '',
        description: '',
      },
    })

    return asset
  }

  async updateAsset(ctx: Awaited<ReturnType<typeof createRequestContext>>, id: string, data: Partial<Pick<MediaAssetData, 'altText' | 'caption' | 'description' | 'folderId'>>) {
    const asset = await db.mediaAsset.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!asset) throw new Error('Asset not found')

    const updated = await db.mediaAsset.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    })
    return updated
  }

  async deleteAsset(ctx: Awaited<ReturnType<typeof createRequestContext>>, id: string) {
    const asset = await db.mediaAsset.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
      include: { usages: true },
    })
    if (!asset) throw new Error('Asset not found')

    if (asset.usages.length > 0) {
      const usageSummary = asset.usages.map((u) => `${u.resourceType} ${u.resourceId}`).join(', ')
      throw new Error(`Cannot delete asset — it is used in: ${usageSummary}`)
    }

    await this.storage.delete(asset.url)
    await db.mediaAsset.delete({ where: { id } })
    return { success: true }
  }

  async moveAsset(ctx: Awaited<ReturnType<typeof createRequestContext>>, assetId: string, folderId: string | null) {
    const asset = await db.mediaAsset.findFirst({ where: { id: assetId, workspaceId: ctx.workspace.id } })
    if (!asset) throw new Error('Asset not found')

    const updated = await db.mediaAsset.update({
      where: { id: assetId },
      data: { folderId, updatedAt: new Date() },
    })
    return updated
  }

  async replaceAsset(ctx: Awaited<ReturnType<typeof createRequestContext>>, id: string, file: { name: string; size: number; type: string; buffer: Buffer }) {
    const asset = await db.mediaAsset.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!asset) throw new Error('Asset not found')

    const validation = validateFile(file)
    if (!validation.valid) throw new Error(validation.error)

    const oldUrl = asset.url
    const ext = extname(file.name) || extname(asset.originalName) || '.bin'
    const safeName = `${randomUUID()}${ext}`
    const folderPath = getAssetFolder({ mimeType: file.type, fileName: file.name })
    const path = `${folderPath}/${safeName}`

    const { url, size } = await this.storage.upload(file.buffer, path)

    let width: number | undefined
    let height: number | undefined
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        const dimensions = await getImageDimensions(file.buffer)
        width = dimensions.width
        height = dimensions.height
      } catch { /* ignore */ }
    }

    await this.storage.delete(oldUrl)

    const updated = await db.mediaAsset.update({
      where: { id },
      data: {
        fileName: safeName,
        originalName: file.name,
        mimeType: file.type,
        fileSize: size,
        width,
        height,
        thumbnailUrl: file.type.startsWith('image/') ? url : asset.thumbnailUrl,
        url,
        updatedAt: new Date(),
      },
    })
    return updated
  }

  async listFolders(ctx: Awaited<ReturnType<typeof createRequestContext>>, parentId?: string) {
    const folders = await db.mediaFolder.findMany({
      where: { workspaceId: ctx.workspace.id, parentId: parentId || null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { assets: true } } },
    })
    return folders
  }

  async createFolder(ctx: Awaited<ReturnType<typeof createRequestContext>>, name: string, parentId?: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'folder'
    const folder = await db.mediaFolder.create({
      data: {
        workspaceId: ctx.workspace.id,
        parentId: parentId || null,
        name,
        slug,
      },
    })
    return folder
  }

  async updateFolder(ctx: Awaited<ReturnType<typeof createRequestContext>>, id: string, name: string) {
    const folder = await db.mediaFolder.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!folder) throw new Error('Folder not found')

    const updated = await db.mediaFolder.update({
      where: { id },
      data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'folder', updatedAt: new Date() },
    })
    return updated
  }

  async deleteFolder(ctx: Awaited<ReturnType<typeof createRequestContext>>, id: string) {
    const folder = await db.mediaFolder.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
      include: { assets: true, children: true },
    })
    if (!folder) throw new Error('Folder not found')

    if (folder.assets.length > 0) throw new Error('Cannot delete folder with assets')
    if (folder.children.length > 0) throw new Error('Cannot delete folder with subfolders')

    await db.mediaFolder.delete({ where: { id } })
    return { success: true }
  }

  async getUsage(ctx: Awaited<ReturnType<typeof createRequestContext>>, assetId: string) {
    const usages = await db.mediaUsage.findMany({
      where: { assetId, workspaceId: ctx.workspace.id },
      include: { asset: { select: { id: true, fileName: true, originalName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return usages
  }
}

function randomUUID(): string {
  return crypto.randomUUID()
}

function extname(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i) : ''
}

async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  // Minimal PNG/JPEG dimension parser — no external dependency
  const b = buffer
  if (b[0] === 0xff && b[1] === 0xd8) {
    // JPEG: find SOF marker
    let offset = 2
    while (offset < b.length - 4) {
      if (b[offset] === 0xff && b[offset + 1] === 0xc0) {
        const height = (b[offset + 5] << 8) | b[offset + 6]
        const width = (b[offset + 7] << 8) | b[offset + 8]
        return { width, height }
      }
      if (b[offset] === 0xff && b[offset + 1] === 0xd9) break
      if (b[offset] === 0xff) {
        const len = (b[offset + 2] << 8) | b[offset + 3]
        offset += 2 + len
      } else {
        offset++
      }
    }
  } else if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    // PNG: IHDR chunk at offset 16
    const width = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]
    const height = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]
    return { width, height }
  }
  return { width: 0, height: 0 }
}