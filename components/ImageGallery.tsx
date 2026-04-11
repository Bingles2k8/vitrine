'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { compressImage, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_ACCEPT } from '@/lib/image-compression'
import { uploadToR2 } from '@/lib/r2-upload'

const PLAN_LIMIT_ERROR = 'Image limit reached for your plan'

interface Props {
  objectId: string
  museumId: string
  onPrimaryChange: (url: string) => void
  canEdit: boolean
  imageLimit: number
  currentPrimaryUrl?: string
  hidePrimary?: boolean
}

export default function ImageGallery({ objectId, museumId, onPrimaryChange, canEdit, imageLimit, currentPrimaryUrl, hidePrimary }: Props) {
  const [images, setImages] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('object_images').select('*').eq('object_id', objectId).eq('museum_id', museumId).order('sort_order').order('created_at')
      .then(({ data, error }) => { if (!error) setImages(data || []) })
  }, [objectId])

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
    const compressed = await compressImage(file)
    const ext = compressed.type === 'image/webp' ? 'webp' : compressed.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    let publicUrl: string
    try {
      publicUrl = await uploadToR2('object-images', filename, compressed)
    } catch { setUploading(false); return }
    // Only set as primary if there are no gallery images AND no existing primary on the object
    const isPrimary = images.length === 0 && !currentPrimaryUrl
    const res = await fetch(`/api/objects/${objectId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: publicUrl, is_primary: isPrimary, sort_order: images.length }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setUploadError(body.error === PLAN_LIMIT_ERROR ? PLAN_LIMIT_ERROR : 'Upload failed')
      setUploading(false)
      e.target.value = ''
      return
    }
    const newImage = await res.json()
    if (isPrimary) onPrimaryChange(publicUrl)
    setImages(imgs => [...imgs, newImage])
    setUploading(false)
    // Reset input
    e.target.value = ''
  }

  async function setPrimary(image: any) {
    const { error: e1 } = await supabase.from('object_images').update({ is_primary: false }).eq('object_id', objectId)
    if (e1) return
    const { error: e2 } = await supabase.from('object_images').update({ is_primary: true }).eq('id', image.id)
    if (e2) return
    await supabase.from('objects').update({ image_url: image.url }).eq('id', objectId)
    setImages(imgs => imgs.map(i => ({ ...i, is_primary: i.id === image.id })))
    onPrimaryChange(image.url)
  }

  async function deleteImage(image: any) {
    const { error } = await supabase.from('object_images').delete().eq('id', image.id)
    if (error) return
    const remaining = images.filter(i => i.id !== image.id)
    setImages(remaining)
    // If we deleted the primary, promote the first remaining image
    if (image.is_primary && remaining.length > 0) {
      await setPrimary(remaining[0])
    } else if (image.is_primary && remaining.length === 0) {
      await supabase.from('objects').update({ image_url: null }).eq('id', objectId)
      onPrimaryChange('')
    }
  }

  if (images.length === 0 && !canEdit) return null

  const displayedImages = hidePrimary ? images.filter(i => i.url !== currentPrimaryUrl) : images

  return (
    <div>
      {!hidePrimary && (
        <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
          Image Gallery
        </label>
      )}

      <div className="flex flex-row gap-2 overflow-x-auto">
        {displayedImages.map(image => (
          <div key={image.id} className="relative group rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 shrink-0 w-40 h-40">
            <img src={image.url} alt="" className="w-full h-full object-contain" />
            {canEdit && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {!hidePrimary && image.is_primary && (
                  <span className="text-xs font-mono bg-amber-500 text-white px-2 py-1 rounded w-full text-center">
                    Primary ★
                  </span>
                )}
                {(hidePrimary || !image.is_primary) && (
                  <button type="button" onClick={() => setPrimary(image)}
                    className="text-xs font-mono bg-white text-stone-900 px-2 py-1 rounded w-full text-center hover:bg-stone-100 transition-colors">
                    Set as primary
                  </button>
                )}
                <button type="button" onClick={() => deleteImage(image)}
                  className="text-xs font-mono bg-red-600 text-white px-2 py-1 rounded w-full text-center hover:bg-red-700 transition-colors">
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}

        {canEdit && images.length < imageLimit && (
          <label className="flex flex-col items-center justify-center w-40 h-40 shrink-0 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-stone-500 transition-colors bg-stone-50 dark:bg-stone-900">
            <div className="text-lg mb-1">📷</div>
            <div className="text-xs text-stone-400 dark:text-stone-500">{uploading ? 'Uploading…' : '+ Add image'}</div>
            {uploadError && (
              <div className="text-xs text-red-500 mt-1 text-center px-1">{uploadError}</div>
            )}
            <input type="file" accept={ALLOWED_IMAGE_ACCEPT} onChange={handleFile} disabled={uploading} className="hidden" />
          </label>
        )}
        {canEdit && images.length >= imageLimit && (
          <div className="flex flex-col items-center justify-center w-40 h-40 shrink-0 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-900 text-center p-2 gap-1">
            <div className="text-xs text-stone-400 dark:text-stone-500">
              {imageLimit === 1 ? 'Image limit reached' : `${imageLimit} image limit reached`}
            </div>
            {imageLimit === 1 && (
              <a href="/dashboard/plan" className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline">
                Upgrade for more images →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
