'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  currentUrl?: string
  onUpload: (url: string) => void
}

export default function ImageUpload({ currentUrl, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || '')
  const supabase = createClient()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('artifact-images')
      .upload(filename, file, { upsert: true })

    if (error) {
      console.error(error)
      setUploading(false)
      return
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('artifact-images')
      .getPublicUrl(data.path)

    onUpload(publicUrl)
    setPreview(publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
        Photo
      </label>

      <div className="relative">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Artifact"
              className="w-full aspect-square object-cover rounded-lg border border-stone-200 dark:border-stone-700"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
              <span className="text-white text-xs font-mono bg-black/60 px-3 py-1.5 rounded">
                {uploading ? 'Uploading...' : 'Change photo'}
              </span>
              <input
                type="file"
                accept="image/*"
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
              accept="image/*"
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
    </div>
  )
}
