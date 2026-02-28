import imageCompression from 'browser-image-compression'

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
