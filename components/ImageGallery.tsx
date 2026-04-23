'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { compressImage, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_ACCEPT } from '@/lib/image-compression'
import { uploadToR2, deleteFromR2 } from '@/lib/r2-upload'
import { computeDHash } from '@/lib/phash'
import SimilarImagesWarning, { type SimilarMatch } from '@/components/SimilarImagesWarning'

const PLAN_LIMIT_ERROR = 'Image limit reached for your plan'

type PendingImage = {
  id: string
  localUrl: string
}

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
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [similarWarning, setSimilarWarning] = useState<{ matches: SimilarMatch[]; proceed: () => void; cancel: () => void } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('object_images').select('*').eq('object_id', objectId).eq('museum_id', museumId).order('sort_order').order('created_at')
      .then(({ data, error }) => { if (!error) setImages(data || []) })
  }, [objectId])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const invalid = files.find(f => !ALLOWED_IMAGE_TYPES.includes(f.type))
    if (invalid) {
      setUploadError('Please upload JPG, PNG, WEBP, GIF, or AVIF files only.')
      e.target.value = ''
      return
    }

    setUploadError(null)

    // Create blob previews immediately for all files (up to remaining slots)
    const slots = imageLimit - images.length
    const filesToUpload = files.slice(0, slots)
    const newPending: PendingImage[] = filesToUpload.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      localUrl: URL.createObjectURL(file),
    }))
    setPendingImages(prev => [...prev, ...newPending])

    // Pre-flight: compute phash for the first file and check for near-duplicates.
    // If matches exist in other objects, let the user bail before we upload.
    const firstPhash = await computeDHash(filesToUpload[0]).catch(() => null)
    if (firstPhash) {
      try {
        const res = await fetch('/api/objects/similar-by-phash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ museum_id: museumId, phash: firstPhash, exclude_object_id: objectId, threshold: 8, limit: 5 }),
        })
        if (res.ok) {
          const { matches } = await res.json() as { matches: SimilarMatch[] }
          if (matches && matches.length > 0) {
            const proceed = await new Promise<boolean>(resolve => {
              setSimilarWarning({
                matches,
                proceed: () => { setSimilarWarning(null); resolve(true) },
                cancel: () => { setSimilarWarning(null); resolve(false) },
              })
            })
            if (!proceed) {
              newPending.forEach(p => URL.revokeObjectURL(p.localUrl))
              setPendingImages(prev => prev.filter(p => !newPending.some(np => np.id === p.id)))
              e.target.value = ''
              return
            }
          }
        }
      } catch {
        // silently fall through — duplicate check is best-effort
      }
    }

    setUploadProgress({ done: 0, total: filesToUpload.length })

    let currentImages = images
    let done = 0

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const pending = newPending[i]

      const compressed = await compressImage(file)
      const ext = compressed.type === 'image/webp' ? 'webp' : compressed.name.split('.').pop()
      const filename = `${museumId}/${objectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      // Reuse first file's phash; compute for subsequent files.
      const phash = i === 0 ? firstPhash : await computeDHash(file).catch(() => null)

      let publicUrl: string
      try {
        publicUrl = await uploadToR2('object-images', filename, compressed)
      } catch {
        URL.revokeObjectURL(pending.localUrl)
        setPendingImages(prev => prev.filter(p => p.id !== pending.id))
        done++
        setUploadProgress({ done, total: filesToUpload.length })
        continue
      }

      const isPrimary = currentImages.length === 0 && !currentPrimaryUrl
      const res = await fetch(`/api/objects/${objectId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: publicUrl, is_primary: isPrimary, sort_order: currentImages.length, phash }),
      })

      URL.revokeObjectURL(pending.localUrl)
      setPendingImages(prev => prev.filter(p => p.id !== pending.id))
      done++
      setUploadProgress({ done, total: filesToUpload.length })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setUploadError(body.error === PLAN_LIMIT_ERROR ? PLAN_LIMIT_ERROR : 'Upload failed')
        break
      }

      const newImage = await res.json()
      if (isPrimary) onPrimaryChange(publicUrl)
      currentImages = [...currentImages, newImage]
      setImages(currentImages)
    }

    setUploadProgress(null)
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
    await deleteFromR2('object-images', image.url)
    const { error } = await supabase.from('object_images').delete().eq('id', image.id)
    if (error) return
    const remaining = images.filter(i => i.id !== image.id)
    setImages(remaining)
    if (image.is_primary && remaining.length > 0) {
      await setPrimary(remaining[0])
    } else if (image.is_primary && remaining.length === 0) {
      await supabase.from('objects').update({ image_url: null }).eq('id', objectId)
      onPrimaryChange('')
    }
  }

  if (images.length === 0 && pendingImages.length === 0 && !canEdit) return null

  const displayedImages = hidePrimary ? images.filter(i => i.url !== currentPrimaryUrl) : images
  const uploading = pendingImages.length > 0

  return (
    <div>
      {similarWarning && (
        <SimilarImagesWarning
          matches={similarWarning.matches}
          onContinue={similarWarning.proceed}
          onCancel={similarWarning.cancel}
        />
      )}
      {!hidePrimary && (
        <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
          Image Gallery
        </label>
      )}

      {uploadProgress && (
        <div className="mb-3">
          <div className="flex justify-between text-xs font-mono text-stone-400 dark:text-stone-500 mb-1">
            <span>Uploading images…</span>
            <span>{uploadProgress.done} / {uploadProgress.total}</span>
          </div>
          <div className="h-1 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-900 dark:bg-white rounded-full transition-all duration-300"
              style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
            />
          </div>
        </div>
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

        {pendingImages.map(p => (
          <div key={p.id} className="relative rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 shrink-0 w-40 h-40">
            <img src={p.localUrl} alt="" className="w-full h-full object-contain opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
              <span className="text-white text-xs font-mono bg-black/40 px-2 py-1 rounded">Uploading…</span>
            </div>
          </div>
        ))}

        {canEdit && (images.length + pendingImages.length) < imageLimit && (
          <label className="flex flex-col items-center justify-center w-40 h-40 shrink-0 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-stone-500 transition-colors bg-stone-50 dark:bg-stone-900">
            <div className="text-lg mb-1">📷</div>
            <div className="text-xs text-stone-400 dark:text-stone-500">{uploading ? 'Uploading…' : '+ Add image'}</div>
            {uploadError && (
              <div className="text-xs text-red-500 mt-1 text-center px-1">{uploadError}</div>
            )}
            <input type="file" accept={ALLOWED_IMAGE_ACCEPT} onChange={handleFile} disabled={uploading} multiple className="hidden" />
          </label>
        )}
        {canEdit && (images.length + pendingImages.length) >= imageLimit && (
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
