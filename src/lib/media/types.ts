export interface MediaAsset {
  id: string
  originalName: string
  mimeType: string
  fileSize: number
  url: string
  thumbnailUrl: string | null
  altText: string | null
  caption: string | null
  description: string | null
  folderId: string | null
  folder: { id: string; name: string } | null
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface MediaFolder {
  id: string
  name: string
  parentId: string | null
  parent: { id: string; name: string } | null
  _count?: { assets: number }
  createdAt: string
}