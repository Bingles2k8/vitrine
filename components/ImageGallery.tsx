'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  artifactId: string
  museumId: string
  onPrimaryChange: (url: string) => void
  canEdit: boolean
}

export default function ImageGallery({ artifactId, museumId, onPrimaryChange, canEdit }: Props) {
  const [images, setImages] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('artifact_images').select('*').eq('artifact_id', artifactId).order('sort_order').order('created_at')
      .then(({ data }) => setImages(data || []))
  }, [artifactId])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('artifact-images').upload(filename, file, { upsert: true })
    if (error) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('artifact-images').getPublicUrl(data.path)
    const isPrimary = images.length === 0
    const { data: newImage } = await supabase.from('artifact_images').insert({
      artifact_id: artifactId,
      museum_id: museumId,
      url: publicUrl,
      is_primary: isPrimary,
      sort_order: images.length,
    }).select().single()
    if (isPrimary) {
      await supabase.from('artifacts').update({ image_url: publicUrl }).eq('id', artifactId)
      onPrimaryChange(publicUrl)
    }
    if (newImage) setImages(imgs => [...imgs, newImage])
    setUploading(false)
    // Reset input
    e.target.value = ''
  }

  async function setPrimary(image: any) {
    await supabase.from('artifact_images').update({ is_primary: false }).eq('artifact_id', artifactId)
    await supabase.from('artifact_images').update({ is_primary: true }).eq('id', image.id)
    await supabase.from('artifacts').update({ image_url: image.url }).eq('id', artifactId)
    setImages(imgs => imgs.map(i => ({ ...i, is_primary: i.id === image.id })))
    onPrimaryChange(image.url)
  }

  async function deleteImage(image: any) {
    await supabase.from('artifact_images').delete().eq('id', image.id)
    const remaining = images.filter(i => i.id !== image.id)
    setImages(remaining)
    // If we deleted the primary, promote the first remaining image
    if (image.is_primary && remaining.length > 0) {
      await setPrimary(remaining[0])
    } else if (image.is_primary && remaining.length === 0) {
      await supabase.from('artifacts').update({ image_url: null }).eq('id', artifactId)
      onPrimaryChange('')
    }
  }

  if (images.length === 0 && !canEdit) return null

  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
        Image Gallery
      </label>

      <div className="grid grid-cols-3 gap-3">
        {images.map(image => (
          <div key={image.id} className="relative group rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700">
            <img src={image.url} alt="" className="w-full aspect-square object-cover" />
            {canEdit && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {!image.is_primary && (
                  <button type="button" onClick={() => setPrimary(image)}
                    className="text-xs font-mono bg-white text-stone-900 px-2 py-1 rounded w-full text-center hover:bg-stone-100 transition-colors">
                    Set as primary
                  </button>
                )}
                {image.is_primary && (
                  <span className="text-xs font-mono bg-amber-500 text-white px-2 py-1 rounded w-full text-center">
                    Primary ★
                  </span>
                )}
                <button type="button" onClick={() => deleteImage(image)}
                  className="text-xs font-mono bg-red-600 text-white px-2 py-1 rounded w-full text-center hover:bg-red-700 transition-colors">
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}

        {canEdit && (
          <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-stone-500 transition-colors bg-stone-50 dark:bg-stone-900">
            <div className="text-2xl mb-1">📷</div>
            <div className="text-xs text-stone-400 dark:text-stone-500">{uploading ? 'Uploading…' : '+ Add image'}</div>
            <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>
    </div>
  )
}
