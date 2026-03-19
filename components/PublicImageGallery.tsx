'use client'

import { useState } from 'react'

interface GalleryImage {
  url: string
  caption?: string | null
}

interface Props {
  images: GalleryImage[]
  title: string
  emoji: string
  cardBg: string
  border: string
}

export default function PublicImageGallery({ images, title, emoji, cardBg, border }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex]

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      <div
        className="aspect-square rounded-xl flex items-center justify-center text-[120px] overflow-hidden border"
        style={{ background: cardBg, borderColor: border }}
      >
        {active ? (
          <img src={active.url} alt={active.caption || title} className="w-full h-full object-cover" />
        ) : (
          <span>{emoji}</span>
        )}
      </div>

      {/* Thumbnails — only show when there's more than one image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all focus:outline-none"
              style={{
                borderColor: i === activeIndex ? border : 'transparent',
                opacity: i === activeIndex ? 1 : 0.55,
                background: cardBg,
              }}
              title={img.caption || undefined}
            >
              <img src={img.url} alt={img.caption || `${title} — image ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
