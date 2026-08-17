'use client'

import Link from 'next/link'
import type { GridObject, GridProps, GridTheme } from './types'
import { captionParts, conditionText, objectHref, statusText } from './types'

// ─── Shared bits ────────────────────────────────────────────────────────────

const COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
}

function colClass(columns: number): string {
  return COLS[columns] ?? COLS[4]
}

/** The work itself, or its emoji stand-in. `fit` matters: a plate mats the
 *  work rather than cropping it, a tile fills its frame.
 *  Both fit classes are written out in full — Tailwind cannot see a class
 *  assembled at runtime, so `object-${fit}` would be purged from the build. */
function Artwork({
  item,
  fit = 'cover',
  emojiSize = 'text-5xl',
}: {
  item: GridObject
  fit?: 'cover' | 'contain'
  emojiSize?: string
}) {
  if (!item.image_url) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${emojiSize} transition-transform duration-500 group-hover:scale-105`}>
          {item.emoji || '🖼️'}
        </span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.image_url}
      alt={item.title}
      loading="lazy"
      className={`absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-[1.03] ${
        fit === 'contain' ? 'object-contain' : 'object-cover'
      }`}
    />
  )
}

/** "On Loan" and condition markers, positioned over the image. */
function Markers({ item, theme, dark = false }: { item: GridObject; theme: GridTheme; dark?: boolean }) {
  const chip = dark
    ? 'bg-white/15 text-white backdrop-blur-sm'
    : 'bg-black/55 text-white backdrop-blur-sm'
  return (
    <>
      {item.status === 'On Loan' && (
        <span className={`absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded-full ${chip}`}>
          {statusText(theme, 'On Loan')}
        </span>
      )}
      {item.condition_grade && (
        <span className={`absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded-full ${chip}`}>
          {conditionText(theme, item.condition_grade)}
        </span>
      )}
    </>
  )
}

function Caption({ item, theme, align = 'left' }: { item: GridObject; theme: GridTheme; align?: 'left' | 'center' }) {
  if (theme.metadata === 'none') return null
  const parts = captionParts(item, theme)
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <div className="text-sm leading-snug" style={{ ...theme.headingStyle, color: theme.heading }}>
        {item.title}
      </div>
      {parts.length > 0 && (
        <div className="text-xs mt-1" style={{ color: theme.muted }}>
          {parts.join(' · ')}
        </div>
      )}
      {theme.metadata === 'full' && item.rarity && (
        <div className="text-[11px] font-mono mt-1" style={{ color: theme.muted }}>
          {item.rarity}
        </div>
      )}
    </div>
  )
}

// ─── uniform ────────────────────────────────────────────────────────────────
// The original card grid, kept as the fallback for any template without a
// variant of its own.

export function UniformGrid({ items, slug, theme }: GridProps) {
  return (
    <div className={`grid ${colClass(theme.columns)} gap-6`}>
      {items.map(item => (
        <Link
          key={item.id}
          href={objectHref(slug, item.id)}
          className="group overflow-hidden transition-all duration-200 hover:-translate-y-1 border"
          style={{ borderRadius: theme.radius, background: theme.cardBg, borderColor: theme.border }}
        >
          <div className={`${theme.imageAspect} relative overflow-hidden`} style={{ background: theme.imageBg }}>
            <Artwork item={item} />
            <Markers item={item} theme={theme} />
          </div>
          {theme.metadata !== 'none' && (
            <div className={theme.padding}>
              <Caption item={item} theme={theme} />
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}

// ─── plate ──────────────────────────────────────────────────────────────────
// Gallery plate. No card chrome: the work is matted on the page ground with a
// generous margin and captioned beneath, the way a hang label sits under a
// picture. `frame` adds an accent rule for the formal templates.

export function PlateGrid({ items, slug, theme }: GridProps) {
  const framed = theme.options.frame === true
  return (
    <div className={`grid ${colClass(theme.columns)} gap-x-8 gap-y-14 md:gap-x-12`}>
      {items.map(item => (
        <Link key={item.id} href={objectHref(slug, item.id)} className="group block">
          <div
            className={`${theme.imageAspect} relative overflow-hidden mb-4`}
            style={{
              background: theme.imageBg,
              borderRadius: theme.radius,
              ...(framed
                ? { border: `1px solid ${theme.accent}`, outline: `1px solid ${theme.border}`, outlineOffset: '5px' }
                : {}),
              padding: framed ? '10px' : '0',
            }}
          >
            <div className="absolute inset-0" style={{ margin: framed ? '10px' : 0 }}>
              <div className="relative w-full h-full overflow-hidden">
                <Artwork item={item} fit={framed ? 'cover' : 'contain'} />
              </div>
            </div>
            <Markers item={item} theme={theme} />
          </div>
          <Caption item={item} theme={theme} align={framed ? 'center' : 'left'} />
        </Link>
      ))}
    </div>
  )
}

// ─── catalogue ──────────────────────────────────────────────────────────────
// Catalogue rows separated by hairline rules. `numbered` prefixes each entry
// with its catalogue number; `lead` carries an excerpt of the description for
// text-forward templates.

export function CatalogueList({ items, slug, theme }: GridProps) {
  const { numbered, lead } = theme.options
  return (
    <div style={{ borderTop: `1px solid ${theme.border}` }}>
      {items.map((item, i) => (
        <Link
          key={item.id}
          href={objectHref(slug, item.id)}
          className="group flex items-start gap-5 py-5 px-2 -mx-2 transition-colors"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          {numbered && (
            <div
              className="text-xs font-mono pt-1 w-10 shrink-0 tabular-nums"
              style={{ color: theme.muted }}
            >
              {String(i + 1).padStart(3, '0')}
            </div>
          )}

          <div
            className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 overflow-hidden"
            style={{ background: theme.imageBg, borderRadius: theme.radius }}
          >
            <Artwork item={item} emojiSize="text-2xl" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-lg leading-snug" style={{ ...theme.headingStyle, color: theme.heading }}>
              {item.title}
            </div>
            {item.artist && (
              <div className="text-sm mt-0.5" style={{ color: theme.body }}>{item.artist}</div>
            )}
            <div className="text-xs font-mono mt-1.5" style={{ color: theme.muted }}>
              {[
                item.medium,
                item.culture,
                item.condition_grade ? conditionText(theme, item.condition_grade) : null,
                item.status === 'On Loan' ? statusText(theme, 'On Loan') : null,
              ].filter(Boolean).join('  ·  ')}
            </div>
            {lead && item.description && (
              <p className="text-sm mt-2.5 leading-relaxed max-w-2xl line-clamp-2" style={{ color: theme.body }}>
                {item.description}
              </p>
            )}
          </div>

          <div className="text-xs font-mono shrink-0 pt-1 text-right hidden sm:block" style={{ color: theme.muted }}>
            {item.year}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── spotlight ──────────────────────────────────────────────────────────────
// Full-bleed tiles butted against each other with no card chrome, captions
// held back until hover. Built for the dark templates, where a border around
// every work fights the atmosphere.

export function SpotlightGrid({ items, slug, theme }: GridProps) {
  return (
    <div className={`grid ${colClass(theme.columns)} gap-px`} style={{ background: theme.border }}>
      {items.map(item => (
        <Link
          key={item.id}
          href={objectHref(slug, item.id)}
          className={`group relative overflow-hidden ${theme.imageAspect}`}
          style={{ background: theme.imageBg }}
        >
          <Artwork item={item} />

          {/* Caption plate rises on hover; always present for touch/keyboard. */}
          {theme.metadata !== 'none' && (
            <div
              className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 transition-all duration-300
                         group-hover:translate-y-0 group-hover:opacity-100
                         group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
            >
              <div className="text-sm leading-snug text-white" style={theme.headingStyle}>{item.title}</div>
              {item.artist && (
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{item.artist}</div>
              )}
            </div>
          )}

          {item.status === 'On Loan' && (
            <span
              className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: theme.accent, color: '#000' }}
            >
              {statusText(theme, 'On Loan')}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}

// ─── mosaic ─────────────────────────────────────────────────────────────────
// Asymmetric tiles on a repeating six-slot rhythm, so the page never settles
// into a regular pulse. Captions overlay the image, magazine-style.

/** Column/row spans on a 6-item cycle. Index 0 and 3 are the anchors. */
const MOSAIC_RHYTHM = [
  'md:col-span-2 md:row-span-2',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-2',
  'md:col-span-2 md:row-span-1',
  'md:col-span-1 md:row-span-1',
]

export function MosaicGrid({ items, slug, theme }: GridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[minmax(150px,auto)] md:auto-rows-[190px] gap-2">
      {items.map((item, i) => (
        <Link
          key={item.id}
          href={objectHref(slug, item.id)}
          className={`group relative overflow-hidden ${MOSAIC_RHYTHM[i % MOSAIC_RHYTHM.length]}`}
          style={{ background: theme.imageBg, borderRadius: theme.radius }}
        >
          <Artwork item={item} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {theme.metadata !== 'none' && (
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div
                className="text-sm font-bold leading-tight text-white uppercase tracking-tight"
                style={{ fontFamily: theme.headingStyle.fontFamily }}
              >
                {item.title}
              </div>
              {item.artist && (
                <div className="text-[11px] font-mono uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {item.artist}
                </div>
              )}
            </div>
          )}
          <Markers item={item} theme={theme} dark />
        </Link>
      ))}
    </div>
  )
}

// ─── salon ──────────────────────────────────────────────────────────────────
// Salon hang. CSS columns keep every work at its natural aspect ratio, so the
// wall has the uneven rhythm of a densely hung room rather than a grid.

export function SalonGrid({ items, slug, theme }: GridProps) {
  const columnClass = theme.columns >= 4
    ? 'columns-2 md:columns-3 lg:columns-4'
    : theme.columns === 3
      ? 'columns-2 md:columns-3'
      : 'columns-2'

  return (
    <div className={`${columnClass} gap-5`}>
      {items.map(item => (
        <Link
          key={item.id}
          href={objectHref(slug, item.id)}
          className="group block mb-5 break-inside-avoid"
        >
          <div
            className="relative overflow-hidden mb-2"
            style={{ background: theme.imageBg, borderRadius: theme.radius }}
          >
            {item.image_url ? (
              // Natural height is the point of a salon hang — no aspect box.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center">
                <span className="text-4xl">{item.emoji || '🖼️'}</span>
              </div>
            )}
            <Markers item={item} theme={theme} />
          </div>
          <Caption item={item} theme={theme} />
        </Link>
      ))}
    </div>
  )
}

// ─── editorial ──────────────────────────────────────────────────────────────
// Alternating figure/text rows under heavy rules. Each work gets a spread of
// its own rather than a cell in a grid.

export function EditorialGrid({ items, slug, theme }: GridProps) {
  return (
    <div className="flex flex-col">
      {items.map((item, i) => {
        const flip = i % 2 === 1
        return (
          <Link
            key={item.id}
            href={objectHref(slug, item.id)}
            className="group grid grid-cols-1 md:grid-cols-5 gap-5 md:gap-8 py-8 items-center"
            style={{ borderTop: `2px solid ${theme.heading}` }}
          >
            <div
              className={`relative md:col-span-3 aspect-[16/10] overflow-hidden ${flip ? 'md:order-2' : ''}`}
              style={{ background: theme.imageBg, borderRadius: theme.radius }}
            >
              <Artwork item={item} emojiSize="text-6xl" />
              <Markers item={item} theme={theme} />
            </div>

            <div className={`md:col-span-2 ${flip ? 'md:order-1' : ''}`}>
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] mb-3" style={{ color: theme.accent }}>
                {String(i + 1).padStart(2, '0')}
                {item.medium ? ` — ${item.medium}` : ''}
              </div>
              <div
                className="text-2xl md:text-3xl font-bold leading-[1.1] uppercase tracking-tight mb-3"
                style={{ fontFamily: theme.headingStyle.fontFamily, color: theme.heading }}
              >
                {item.title}
              </div>
              {item.artist && (
                <div className="text-sm mb-2" style={{ color: theme.body }}>{item.artist}</div>
              )}
              {item.description && (
                <p className="text-sm leading-relaxed line-clamp-3 mb-3" style={{ color: theme.body }}>
                  {item.description}
                </p>
              )}
              <div className="text-xs font-mono" style={{ color: theme.muted }}>
                {[item.year, item.culture].filter(Boolean).join('  ·  ')}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ─── stack ──────────────────────────────────────────────────────────────────
// One wide band per work, captioned over the image. Pairs with the Cover
// template, whose whole idea is that the collection reveals as you scroll.

export function StackGrid({ items, slug, theme }: GridProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <Link
          key={item.id}
          href={objectHref(slug, item.id)}
          className="group relative block overflow-hidden aspect-[16/10] sm:aspect-[16/7]"
          style={{ background: theme.imageBg, borderRadius: theme.radius }}
        >
          <Artwork item={item} emojiSize="text-6xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: theme.accent }}>
              {String(i + 1).padStart(2, '0')}
              {item.culture ? ` — ${item.culture}` : ''}
            </div>
            <div
              className="text-2xl md:text-4xl leading-tight text-white mb-1"
              style={theme.headingStyle}
            >
              {item.title}
            </div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {[item.artist, item.year].filter(Boolean).join('  ·  ')}
            </div>
          </div>

          {item.status === 'On Loan' && (
            <span
              className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: theme.accent, color: '#000' }}
            >
              {statusText(theme, 'On Loan')}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
