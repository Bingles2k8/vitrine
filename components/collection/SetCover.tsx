import type { GridObject } from './types'

/**
 * A set's cover image, resolved down a ladder so nothing has to be uploaded.
 *
 *   1. an uploaded cover
 *   2. a nominated member's image
 *   3. a mosaic of the first four member images   ← the useful default
 *   4. a single member's image
 *   5. accent-tinted ground with the collection's emoji
 *
 * Rung 3 is the reason the whole feature can ship without an upload step: an
 * untouched set still reads as deliberate. It also keeps uploaded covers rare
 * enough to charge against the storage quota without that biting anyone.
 *
 * Composition is deterministic — first four in resolved order, never shuffled
 * — so a cover does not change between renders or cache states.
 */

export interface SetCoverProps {
  members: GridObject[]
  coverImageUrl?: string | null
  coverObjectId?: string | null
  /** Tailwind aspect class, from the museum's image_ratio. */
  aspect: string
  radius: number
  imageBg: string
  border: string
  accent: string
  emoji?: string | null
  /** Landscape covers get a 1-large-plus-3 mosaic instead of a 2×2. */
  wide?: boolean
  className?: string
}

function Img({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  )
}

function Tile({ item, bg }: { item: GridObject; bg: string }) {
  return (
    <div className="relative overflow-hidden" style={{ background: bg }}>
      {item.image_url
        ? <Img src={item.image_url} alt={item.title} />
        : (
          <span className="absolute inset-0 flex items-center justify-center text-2xl">
            {item.emoji || '🖼️'}
          </span>
        )}
    </div>
  )
}

export default function SetCover({
  members, coverImageUrl, coverObjectId,
  aspect, radius, imageBg, border, accent, emoji, wide = false, className = '',
}: SetCoverProps) {
  const shell = `${aspect} relative overflow-hidden ${className}`
  const shellStyle = { borderRadius: radius, background: imageBg }

  // 1 — uploaded
  if (coverImageUrl) {
    return (
      <div className={shell} style={shellStyle}>
        <Img src={coverImageUrl} alt="" />
      </div>
    )
  }

  // 2 — nominated member
  const nominated = coverObjectId ? members.find(m => m.id === coverObjectId) : null
  if (nominated?.image_url) {
    return (
      <div className={shell} style={shellStyle}>
        <Img src={nominated.image_url} alt={nominated.title} />
      </div>
    )
  }

  const withImages = members.filter(m => m.image_url)

  // 3 — mosaic of four
  if (withImages.length >= 4) {
    const four = withImages.slice(0, 4)
    return (
      <div className={shell} style={shellStyle}>
        <div
          className={`group absolute inset-0 grid gap-px ${wide ? 'grid-cols-3 grid-rows-3' : 'grid-cols-2 grid-rows-2'}`}
          style={{ background: border }}
        >
          {wide ? (
            <>
              <div className="col-span-2 row-span-3 relative overflow-hidden" style={{ background: imageBg }}>
                {four[0].image_url && <Img src={four[0].image_url} alt={four[0].title} />}
              </div>
              {four.slice(1, 4).map(item => <Tile key={item.id} item={item} bg={imageBg} />)}
            </>
          ) : (
            four.map(item => <Tile key={item.id} item={item} bg={imageBg} />)
          )}
        </div>
      </div>
    )
  }

  // 4 — a single image
  if (withImages.length > 0) {
    return (
      <div className={shell} style={shellStyle}>
        <Img src={withImages[0].image_url!} alt={withImages[0].title} />
      </div>
    )
  }

  // 5 — emoji on an accent-tinted ground
  return (
    <div className={shell} style={{ ...shellStyle, background: `${accent}14` }}>
      <span
        className="absolute inset-0 flex items-center justify-center text-5xl"
        style={{ opacity: 0.4 }}
      >
        {members[0]?.emoji || emoji || '🗂️'}
      </span>
    </div>
  )
}
