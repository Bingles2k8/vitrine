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

export { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand }
