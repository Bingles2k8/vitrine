'use client'

import { useState } from 'react'
import { compressImage, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_ACCEPT } from '@/lib/image-compression'
import { uploadToR2 } from '@/lib/r2-upload'

interface Props {
  currentUrl?: string
  onUpload: (url: string) => void
}

export default function ImageUpload({ currentUrl, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || '')
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, WEBP, GIF, or AVIF file.')
      e.target.value = ''
      return
    }

    setUploading(true)
    setUploadError(null)

    // Compress before upload
    const compressed = await compressImage(file)

    const ext = compressed.type === 'image/webp' ? 'webp' : compressed.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    let publicUrl: string
    try {
      publicUrl = await uploadToR2('object-images', filename, compressed)
    } catch {
      setUploadError('Upload failed — please try again')
      setUploading(false)
      return
    }

    onUpload(publicUrl)
    setPreview(publicUrl)
    setUploadError(null)
    setUploading(false)
  }

  return (
    <div>
      <div className="relative">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Object"
              className="w-full aspect-square object-contain rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
              <span className="text-white text-xs font-mono bg-black/60 px-3 py-1.5 rounded">
                {uploading ? 'Uploading...' : 'Change photo'}
              </span>
              <input
                type="file"
                accept={ALLOWED_IMAGE_ACCEPT}
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer hover:border-stone-400 transition-colors bg-stone-50 dark:bg-stone-900">
            <div className="text-3xl mb-3">📷</div>
            <div className="text-sm text-stone-400 dark:text-stone-500 mb-1">
              {uploading ? 'Uploading...' : 'Upload a photo'}
            </div>
            <div className="text-xs text-stone-300 dark:text-stone-600">JPG, PNG, WEBP up to 10MB</div>
            <input
              type="file"
              accept={ALLOWED_IMAGE_ACCEPT}
              onChange={handleFile}
              className="hidden"
            />
          </label>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-stone-900/70 rounded-lg">
            <div className="text-xs font-mono text-stone-500 dark:text-stone-400">Uploading...</div>
          </div>
        )}
      </div>
      {uploadError && (
        <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>
      )}
    </div>
  )
}
