import { S3Client, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: async () => ({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  }),
})

const PUBLIC_URLS: Record<string, string> = {
  'object-documents': process.env.R2_OBJECT_DOCUMENTS_PUBLIC_URL!,
  'object-images': process.env.R2_OBJECT_IMAGES_PUBLIC_URL!,
  'museum-assets': process.env.R2_MUSEUM_ASSETS_PUBLIC_URL!,
}

export function r2PublicUrl(bucket: string, path: string): string {
  return `${PUBLIC_URLS[bucket]}/${path}`
}

export function r2PathFromUrl(bucket: string, url: string): string {
  return url.replace(`${PUBLIC_URLS[bucket]}/`, '')
}

/**
 * Which bucket a stored public URL points into, and its key there. Null for a
 * URL that is not one of ours (an external image link, say), which callers
 * must leave alone rather than guess at.
 */
export function r2Locate(url: string | null | undefined): { bucket: string; key: string } | null {
  if (!url) return null
  for (const [bucket, base] of Object.entries(PUBLIC_URLS)) {
    if (base && url.startsWith(`${base}/`)) {
      const key = url.slice(base.length + 1)
      return key ? { bucket, key } : null
    }
  }
  return null
}

export { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand }
