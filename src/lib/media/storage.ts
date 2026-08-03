import { mkdirSync, readdirSync, statSync, unlinkSync, renameSync, existsSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'

export interface StorageProvider {
  name: string
  upload(file: Buffer, path: string): Promise<{ url: string; size: number }>
  delete(url: string): Promise<void>
  rename(oldUrl: string, newName: string): Promise<string>
  getSignedUrl(assetId: string, fileName: string): Promise<string>
  list(prefix: string): Promise<string[]>
}

export interface StorageConfig {
  provider: 'local' | 's3' | 'r2' | 'minio'
  baseUrl: string
  bucket?: string
  region?: string
  accessKey?: string
  secretKey?: string
  endpoint?: string
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
  'image/x-icon', 'image/vnd.microsoft.icon',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv', 'application/json',
])

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export function validateFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds 100 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)` }
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` }
  }
  return { valid: true }
}

export function getAssetFolder(asset: { mimeType: string; fileName: string }): string {
  if (asset.mimeType.startsWith('image/')) return 'images'
  if (asset.mimeType.startsWith('video/')) return 'videos'
  if (asset.mimeType.startsWith('audio/')) return 'audio'
  if (asset.mimeType === 'application/pdf') return 'documents'
  if (asset.mimeType.includes('zip') || asset.mimeType.includes('compressed')) return 'archives'
  return 'files'
}

export class LocalStorageProvider implements StorageProvider {
  name = 'local'
  private baseDir: string
  private baseUrl: string

  constructor(config: StorageConfig) {
    this.baseDir = join(process.cwd(), 'public', 'media')
    this.baseUrl = config.baseUrl || '/media'
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true })
    }
  }

  async upload(buffer: Buffer, path: string): Promise<{ url: string; size: number }> {
    const fullPath = join(this.baseDir, path)
    const dir = dirname(fullPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(fullPath, buffer)
    return { url: `${this.baseUrl}/${path}`, size: buffer.length }
  }

  async delete(url: string): Promise<void> {
    const filePath = join(this.baseDir, url.replace(this.baseUrl + '/', ''))
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }

  async rename(oldUrl: string, newName: string): Promise<string> {
    const oldPath = join(this.baseDir, oldUrl.replace(this.baseUrl + '/', ''))
    const dir = dirname(oldPath)
    const newPath = join(dir, newName)
    renameSync(oldPath, newPath)
    return `${this.baseUrl}/${newPath.replace(this.baseDir + '/', '')}`
  }

  async getSignedUrl(assetId: string, fileName: string): Promise<string> {
    return `${this.baseUrl}/${assetId}/${fileName}`
  }

  async list(prefix: string): Promise<string[]> {
    const dir = join(this.baseDir, prefix)
    if (!existsSync(dir)) return []
    const results: string[] = []
    const walk = (d: string, rel: string) => {
      for (const entry of readdirSync(d)) {
        const full = join(d, entry)
        const r = rel ? `${rel}/${entry}` : entry
        if (statSync(full).isDirectory()) {
          walk(full, r)
        } else {
          results.push(r)
        }
      }
    }
    walk(dir, prefix)
    return results
  }
}

export function getStorageProvider(config: StorageConfig): StorageProvider {
  switch (config.provider) {
    case 'local':
      return new LocalStorageProvider(config)
    default:
      return new LocalStorageProvider(config)
  }
}