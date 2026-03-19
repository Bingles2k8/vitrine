import imageCompression from 'browser-image-compression'

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
export const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',')

const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp']

const DEFAULT_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  fileType: 'image/webp' as const,
}

export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.includes(file.type)) {
    return file
  }

  return imageCompression(file, DEFAULT_OPTIONS)
}
