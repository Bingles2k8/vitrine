'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SetNavStyle } from '@/lib/collectionGroups/types'
import {
  CatalogueList, EditorialGrid, MosaicGrid, PlateGrid,
  SalonGrid, SpotlightGrid, StackGrid, UniformGrid,
} from './grids'
import type { GridObject, GridTheme } from './types'
import { objectHref } from './types'
import type { GridVariant } from '@/lib/templates'

/**
 * How visitors move through the items in a set.
 *
 * The collection page has one layout per template; a set page lets the owner
 * pick a way of *moving through* the items on top of that — a cover flow for a
 * run of album sleeves, a contact sheet for negatives, a timeline for a series
 * that spans decades, shelves for a cabinet of objects.
 *
 * Every style draws from GridTheme alone, so all nine templates and dark mode
 * work without a per-style palette (invariant V). None of them fetch, and all
 * of them fall back to the grid when they have too little to work with — see
 * `effectiveNavStyle`.
 */

interface Props {
  items: GridObject[]
  slug: string
  setSlug: string
  theme: GridTheme
  navStyle: SetNavStyle
  gridVariant: GridVariant
}

const GRIDS: Record<GridVariant, typeof UniformGrid> = {
  uniform: UniformGrid,
  plate: PlateGrid,
  catalogue: CatalogueList,
  spotlight: SpotlightGrid,
  mosaic: MosaicGrid,
  salon: SalonGrid,
  editorial: EditorialGrid,
  stack: StackGrid,
}

// ── Shared ───────────────────────────────────────────────────────────────

function ItemImage({
  item, theme, fit = 'cover', emojiSize = 'text-5xl',
}: { item: GridObject; theme: GridTheme; fit?: 'cover' | 'contain'; emojiSize?: string }) {
  if (!item.image_url) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: theme.imageBg }}>
        <span className={emojiSize}>{item.emoji || '🖼️'}</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.image_url}
      alt={item.title}
      loading="lazy"
      draggable={false}
      className={`absolute inset-0 w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
    />
  )
}

function itemYear(item: GridObject): string {
  return (item.year || item.production_date || '').trim()
}

/** Chevron used by every style that steps. One shape, one weight. */
function Chevron({ dir, size = 22 }: { dir: 'left' | 'right'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  )
}

function StepButton({
  dir, onClick, disabled, theme, label,
}: { dir: 'left' | 'right'; onClick: () => void; disabled?: boolean; theme: GridTheme; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-105 active:scale-95"
      style={{ border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.heading }}
    >
      <Chevron dir={dir} />
    </button>
  )
}

/** Caption shared by the single-item styles. */
function StageCaption({ item, theme, align = 'center' }: { item: GridObject; theme: GridTheme; align?: 'center' | 'left' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <div className="text-xl leading-snug" style={{ ...theme.headingStyle, color: theme.heading }}>
        {item.title}
      </div>
      {(item.artist || itemYear(item)) && (
        <div className="text-sm mt-1" style={{ color: theme.body }}>
          {[item.artist, itemYear(item)].filter(Boolean).join(' · ')}
        </div>
      )}
      {item.note && (
        <div className="text-sm mt-2 italic max-w-xl mx-auto leading-relaxed" style={{ color: theme.muted }}>
          {item.note}
        </div>
      )}
    </div>
  )
}

/** Index state plus wrap-around stepping and arrow-key handling. */
function useStepper(count: number) {
  const [index, setIndex] = useState(0)
  const clamp = useCallback((n: number) => ((n % count) + count) % count, [count])
  const step = useCallback((d: number) => setIndex(i => clamp(i + d)), [clamp])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  return { index, setIndex, step }
}

/** Horizontal drag / swipe, shared by cover flow and the carousel. */
function useDragStep(step: (d: number) => void, threshold = 60) {
  const start = useRef<number | null>(null)
  return {
    onPointerDown: (e: React.PointerEvent) => { start.current = e.clientX },
    onPointerUp: (e: React.PointerEvent) => {
      if (start.current === null) return
      const dx = e.clientX - start.current
      start.current = null
      if (Math.abs(dx) > threshold) step(dx > 0 ? -1 : 1)
    },
    onPointerCancel: () => { start.current = null },
  }
}

// ─── cover flow ─────────────────────────────────────────────────────────────
// Items angle away on both sides and swing forward as you move through them.
// Drag, scroll, arrow keys, or click a neighbour to bring it to the front.

const FLOW_VISIBLE = 4

function CoverFlow({ items, slug, setSlug, theme }: Omit<Props, 'navStyle' | 'gridVariant'>) {
  const { index, setIndex, step } = useStepper(items.length)
  const drag = useDragStep(step)
  const wheelLock = useRef(0)

  const onWheel = useCallback((e: React.WheelEvent) => {
    const now = Date.now()
    if (now - wheelLock.current < 260) return
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (Math.abs(d) < 12) return
    wheelLock.current = now
    step(d > 0 ? 1 : -1)
  }, [step])

  const active = items[index]

  return (
    <div className="select-none">
      <div
        className="relative h-[300px] sm:h-[400px] md:h-[460px] overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ perspective: '1200px' }}
        onWheel={onWheel}
        {...drag}
        role="group"
        aria-label="Cover flow"
      >
        {items.map((item, i) => {
          const offset = i - index
          const distance = Math.abs(offset)
          if (distance > FLOW_VISIBLE) return null
          const sign = Math.sign(offset)
          const x = offset === 0 ? 0 : sign * (34 + (distance - 1) * 13)
          const rotate = offset === 0 ? 0 : -sign * 48
          const z = offset === 0 ? 0 : -140 - (distance - 1) * 50
          const isActive = offset === 0

          return (
            <div
              key={item.id}
              className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out"
              style={{
                width: 'min(58vw, 300px)',
                transform: `translate(-50%, -50%) translateX(${x}%) translateZ(${z}px) rotateY(${rotate}deg) scale(${isActive ? 1 : 0.88})`,
                zIndex: 100 - distance,
                opacity: distance >= FLOW_VISIBLE ? 0 : 1,
                transformStyle: 'preserve-3d',
              }}
            >
              {isActive ? (
                <Link href={objectHref(slug, item.id, setSlug)} className="block" draggable={false}>
                  <FlowFace item={item} theme={theme} active />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  className="block w-full"
                  aria-label={`Show ${item.title}`}
                >
                  <FlowFace item={item} theme={theme} active={false} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-6">
        <StepButton dir="left" onClick={() => step(-1)} theme={theme} label="Previous item" />
        <div className="text-xs font-mono tabular-nums w-20 text-center" style={{ color: theme.muted }}>
          {index + 1} / {items.length}
        </div>
        <StepButton dir="right" onClick={() => step(1)} theme={theme} label="Next item" />
      </div>

      {active && (
        <div className="mt-6">
          <StageCaption item={active} theme={theme} />
        </div>
      )}
    </div>
  )
}

function FlowFace({ item, theme, active }: { item: GridObject; theme: GridTheme; active: boolean }) {
  return (
    <div
      className="relative aspect-square overflow-hidden"
      style={{
        borderRadius: theme.radius,
        background: theme.imageBg,
        boxShadow: active ? '0 24px 48px -12px rgba(0,0,0,0.45)' : '0 12px 24px -12px rgba(0,0,0,0.35)',
        // Cover Flow's mirrored deck. Chromium and WebKit only; elsewhere it
        // is simply absent, which costs nothing.
        ...({ WebkitBoxReflect: 'below 3px linear-gradient(transparent 55%, rgba(0,0,0,0.28))' } as React.CSSProperties),
      }}
    >
      <ItemImage item={item} theme={theme} />
      {!active && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.18)' }} />}
    </div>
  )
}

// ─── carousel ───────────────────────────────────────────────────────────────
// One item, full width, arrows either side. The plainest of the stepping
// styles and the right default for a set of large, detailed images.

function Carousel({ items, slug, setSlug, theme }: Omit<Props, 'navStyle' | 'gridVariant'>) {
  const { index, setIndex, step } = useStepper(items.length)
  const drag = useDragStep(step)
  const item = items[index]

  return (
    <div className="select-none">
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden sm:block shrink-0">
          <StepButton dir="left" onClick={() => step(-1)} theme={theme} label="Previous item" />
        </div>

        <Link
          href={objectHref(slug, item.id, setSlug)}
          className="group relative flex-1 min-w-0 overflow-hidden aspect-[4/3]"
          style={{ borderRadius: theme.radius, background: theme.imageBg }}
          {...drag}
        >
          <ItemImage item={item} theme={theme} fit="contain" emojiSize="text-7xl" />
        </Link>

        <div className="hidden sm:block shrink-0">
          <StepButton dir="right" onClick={() => step(1)} theme={theme} label="Next item" />
        </div>
      </div>

      <div className="mt-6">
        <StageCaption item={item} theme={theme} />
      </div>

      <div className="flex items-center justify-center gap-4 mt-5">
        <div className="sm:hidden">
          <StepButton dir="left" onClick={() => step(-1)} theme={theme} label="Previous item" />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${it.title}`}
              aria-current={i === index}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 22 : 6,
                background: i === index ? theme.accent : theme.border,
              }}
            />
          ))}
        </div>

        <div className="sm:hidden">
          <StepButton dir="right" onClick={() => step(1)} theme={theme} label="Next item" />
        </div>
      </div>
    </div>
  )
}

// ─── filmstrip ──────────────────────────────────────────────────────────────
// A large stage above, a scrolling strip of thumbnails beneath. The active
// thumbnail scrolls itself into view so the strip follows the keyboard.

function Filmstrip({ items, slug, setSlug, theme }: Omit<Props, 'navStyle' | 'gridVariant'>) {
  const { index, setIndex } = useStepper(items.length)
  const stripRef = useRef<HTMLDivElement>(null)
  const item = items[index]

  useEffect(() => {
    const strip = stripRef.current
    const active = strip?.children[index] as HTMLElement | undefined
    if (!strip || !active) return
    const target = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2
    strip.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [index])

  return (
    <div>
      <Link
        href={objectHref(slug, item.id, setSlug)}
        className="group relative block overflow-hidden aspect-[16/10]"
        style={{ borderRadius: theme.radius, background: theme.imageBg }}
      >
        <ItemImage item={item} theme={theme} fit="contain" emojiSize="text-7xl" />
      </Link>

      <div className="mt-5">
        <StageCaption item={item} theme={theme} align="left" />
      </div>

      <div
        ref={stripRef}
        className="flex gap-2 mt-6 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${it.title}`}
            aria-current={i === index}
            className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 overflow-hidden transition-all"
            style={{
              borderRadius: theme.radius,
              background: theme.imageBg,
              outline: i === index ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
              outlineOffset: i === index ? 2 : 0,
              opacity: i === index ? 1 : 0.6,
            }}
          >
            <ItemImage item={it} theme={theme} emojiSize="text-2xl" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── shelves ────────────────────────────────────────────────────────────────
// Items stood in rows on drawn shelves, bases aligned, with a soft contact
// shadow. Reads as a cabinet rather than a grid — apt for objects that
// actually sit on shelves.

const SHELF_PER_ROW = 5

function Shelves({ items, slug, setSlug, theme }: Omit<Props, 'navStyle' | 'gridVariant'>) {
  const rows: GridObject[][] = []
  for (let i = 0; i < items.length; i += SHELF_PER_ROW) {
    rows.push(items.slice(i, i + SHELF_PER_ROW))
  }

  return (
    <div className="space-y-10 sm:space-y-14">
      {rows.map((row, r) => (
        <div key={r}>
          <div className="flex items-end justify-center gap-4 sm:gap-8 px-2">
            {row.map(item => (
              <Link
                key={item.id}
                href={objectHref(slug, item.id, setSlug)}
                className="group relative flex-1 max-w-[170px] transition-transform duration-300 hover:-translate-y-1.5"
                style={{ minWidth: 0 }}
              >
                <div
                  className="relative aspect-[3/4] overflow-hidden"
                  style={{
                    borderRadius: theme.radius,
                    background: theme.imageBg,
                    boxShadow: '0 10px 18px -10px rgba(0,0,0,0.5)',
                  }}
                >
                  <ItemImage item={item} theme={theme} fit="contain" emojiSize="text-4xl" />
                </div>
                <div
                  className="text-[11px] mt-2 text-center leading-tight line-clamp-2"
                  style={{ color: theme.body }}
                >
                  {item.title}
                </div>
              </Link>
            ))}
            {/* Keep a short final row's items at the same width as a full one. */}
            {row.length < SHELF_PER_ROW &&
              Array.from({ length: SHELF_PER_ROW - row.length }).map((_, i) => (
                <div key={`gap-${i}`} className="flex-1 max-w-[170px]" aria-hidden />
              ))}
          </div>

          {/* The shelf itself: a board with a front edge. */}
          <div
            className="mt-1 h-[6px] rounded-sm"
            style={{
              background: `linear-gradient(to bottom, ${theme.border}, ${theme.imageBg})`,
              boxShadow: `0 3px 8px -3px rgba(0,0,0,0.35)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── contact sheet ──────────────────────────────────────────────────────────
// A darkroom proof: dense numbered frames butted together on a dark ground,
// each one edge-marked. Deliberately uniform — the point is scanning many at
// once, not admiring one.

function ContactSheet({ items, slug, setSlug, theme }: Omit<Props, 'navStyle' | 'gridVariant'>) {
  return (
    <div
      className="p-3 sm:p-5"
      style={{ background: theme.heading, borderRadius: theme.radius }}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
        {items.map((item, i) => (
          <Link
            key={item.id}
            href={objectHref(slug, item.id, setSlug)}
            className="group relative block"
          >
            <div className="relative aspect-square overflow-hidden" style={{ background: '#000' }}>
              <ItemImage item={item} theme={theme} emojiSize="text-xl" />
              <div className="absolute inset-0 transition-opacity opacity-0 group-hover:opacity-100" style={{ background: `${theme.accent}33` }} />
            </div>
            <div
              className="text-[10px] font-mono mt-1 tabular-nums truncate"
              style={{ color: theme.cardBg }}
            >
              {String(i + 1).padStart(2, '0')} · {item.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── timeline ───────────────────────────────────────────────────────────────
// Laid along a rail, earliest first, with the year beneath each tick. Scrolls
// horizontally with snap points, so it reads as a run through time rather
// than a grid that happens to be sorted.

function Timeline({ items, slug, setSlug, theme }: Omit<Props, 'navStyle' | 'gridVariant'>) {
  const ordered = useMemo(() => {
    const year = (o: GridObject) => {
      const m = itemYear(o).match(/-?\d{1,4}/)
      return m ? Number(m[0]) : Number.POSITIVE_INFINITY
    }
    return [...items].sort((a, b) => year(a) - year(b))
  }, [items])

  return (
    <div className="relative">
      <div
        className="flex gap-8 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin' }}
      >
        {ordered.map(item => (
          <div key={item.id} className="snap-center shrink-0 w-40 sm:w-48">
            <Link href={objectHref(slug, item.id, setSlug)} className="group block">
              <div
                className="relative aspect-[3/4] overflow-hidden transition-transform duration-300 group-hover:-translate-y-1"
                style={{ borderRadius: theme.radius, background: theme.imageBg, border: `1px solid ${theme.border}` }}
              >
                <ItemImage item={item} theme={theme} fit="contain" emojiSize="text-4xl" />
              </div>

              {/* Tick down to the rail. The rail is drawn per item rather than
                  as one absolutely-positioned line: its vertical offset depends
                  on the image height, which varies with the card width, and a
                  single positioned line only lines up at one size. Each segment
                  overhangs by half the gap on both sides so they meet. */}
              <div className="flex flex-col items-center">
                <div className="w-px h-5" style={{ background: theme.border }} />
                <div className="relative w-full flex justify-center">
                  <div
                    className="absolute top-1/2 -left-4 -right-4 h-px -translate-y-1/2"
                    style={{ background: theme.border }}
                    aria-hidden
                  />
                  <div className="relative w-2.5 h-2.5 rounded-full" style={{ background: theme.accent }} />
                </div>
              </div>

              <div className="text-center mt-2">
                <div className="text-sm font-mono tabular-nums" style={{ color: theme.heading }}>
                  {itemYear(item) || '—'}
                </div>
                <div className="text-xs mt-1 leading-tight line-clamp-2" style={{ color: theme.muted }}>
                  {item.title}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── reel ───────────────────────────────────────────────────────────────────
// One item per screen, snapping as you scroll. Built for a phone, and kept to
// a fixed viewport on desktop so it never runs away with the page.

function Reel({ items, slug, setSlug, theme }: Omit<Props, 'navStyle' | 'gridVariant'>) {
  return (
    <div
      className="h-[70vh] sm:h-[78vh] overflow-y-auto snap-y snap-mandatory rounded-lg"
      style={{ borderRadius: theme.radius, background: theme.imageBg, scrollbarWidth: 'none' }}
    >
      {items.map((item, i) => (
        <Link
          key={item.id}
          href={objectHref(slug, item.id, setSlug)}
          className="group relative flex h-full w-full snap-start items-center justify-center overflow-hidden"
        >
          <ItemImage item={item} theme={theme} fit="contain" emojiSize="text-7xl" />

          <div
            className="absolute inset-x-0 bottom-0 p-6 pt-16"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
          >
            <div className="text-2xl leading-snug text-white" style={theme.headingStyle}>{item.title}</div>
            {(item.artist || itemYear(item)) && (
              <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {[item.artist, itemYear(item)].filter(Boolean).join(' · ')}
              </div>
            )}
            {item.note && (
              <div className="text-sm mt-2 italic max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {item.note}
              </div>
            )}
          </div>

          <div
            className="absolute top-4 right-4 text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
          >
            {i + 1} / {items.length}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Switch ───────────────────────────────────────────────────────────────

export default function SetItems({ items, slug, setSlug, theme, navStyle, gridVariant }: Props) {
  if (items.length === 0) return null

  const inner = { items, slug, setSlug, theme }

  switch (navStyle) {
    case 'coverflow':     return <CoverFlow {...inner} />
    case 'carousel':      return <Carousel {...inner} />
    case 'filmstrip':     return <Filmstrip {...inner} />
    case 'shelf':         return <Shelves {...inner} />
    case 'contact-sheet': return <ContactSheet {...inner} />
    case 'timeline':      return <Timeline {...inner} />
    case 'reel':          return <Reel {...inner} />
    case 'grid':
    default: {
      const Grid = GRIDS[gridVariant] ?? UniformGrid
      // A short set at four columns reads as broken, so the grid narrows to fit.
      const narrowed: GridTheme = { ...theme, columns: Math.min(theme.columns, Math.max(items.length, 2)) }
      return <Grid items={items} slug={slug} theme={narrowed} setSlug={setSlug} />
    }
  }
}
