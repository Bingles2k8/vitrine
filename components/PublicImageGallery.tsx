'use client'

import { useState } from 'react'

interface GalleryImage {
  url: string
  caption?: string | null
}

/**
 * How the viewer is presented. The gallery used to be a fixed
 * `aspect-square rounded-xl border` box on every template, which made an
 * object page read the same whether it sat inside a white cube or a magazine
 * spread — so the frame is now the template's decision.
 */
export type GalleryFrame =
  | 'hairline'  // thin border, rounded to the template radius
  | 'none'      // the work floats on the page ground
  | 'matted'    // accent rule with a mat inside it, like a framed plate

export type GalleryAspect = 'square' | 'wide' | 'tall' | 'natural'

interface Props {
  images: GalleryImage[]
  title: string
  emoji: string
  cardBg: string
  border: string
  frame?: GalleryFrame
  aspect?: GalleryAspect
  radius?: number
  /** Rule colour for the matted frame and the active thumbnail. */
  accent?: string
  /** `cover` fills the frame; `contain` mats the work inside it. */
  fit?: 'cover' | 'contain'
}

const ASPECT_CLASS: Record<GalleryAspect, string> = {
  square: 'aspect-square',
  wide: 'aspect-[16/9]',
  tall: 'aspect-[3/4]',
  natural: '',
}

export default function PublicImageGallery({
  images, title, emoji, cardBg, border,
  frame = 'hairline', aspect = 'square', radius = 12, accent, fit = 'contain',
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex]

  const matted = frame === 'matted'
  const ruleColor = accent || border

  const viewerStyle: React.CSSProperties = {
    background: cardBg,
    borderRadius: matted ? 0 : radius,
    ...(frame === 'hairline' ? { border: `1px solid ${border}` } : {}),
    ...(matted
      ? { border: `1px solid ${ruleColor}`, outline: `1px solid ${border}`, outlineOffset: '6px', padding: '18px' }
      : {}),
  }

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain'

  return (
    // The outer margin keeps a matted frame's outline from being clipped by
    // whatever grid cell the layout drops the gallery into.
    <div className={matted ? 'space-y-4 m-2' : 'space-y-3'}>
      <div
        className={`${ASPECT_CLASS[aspect]} flex items-center justify-center text-[120px] overflow-hidden`}
        style={viewerStyle}
      >
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.url}
            alt={active.caption || title}
            className={
              aspect === 'natural'
                ? 'w-full h-auto max-h-[70vh] object-contain'
                : `w-full h-full ${fitClass}`
            }
          />
        ) : (
          <span className={aspect === 'natural' ? 'py-24' : ''}>{emoji || '🖼️'}</span>
        )}
      </div>

      {/* Colour is inherited so each layout sets it from its own palette. */}
      {active?.caption && (
        <p className="text-xs leading-relaxed opacity-70">{active.caption}</p>
      )}

      {/* Thumbnails — only show when there's more than one image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === activeIndex}
              className="flex-shrink-0 w-16 h-16 border-2 overflow-hidden transition-all focus:outline-none"
              style={{
                borderColor: i === activeIndex ? ruleColor : 'transparent',
                borderRadius: matted ? 0 : Math.min(radius, 8),
                opacity: i === activeIndex ? 1 : 0.55,
                background: cardBg,
              }}
              title={img.caption || undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption || `${title} — image ${i + 1}`} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
