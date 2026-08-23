'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { GridObject, GridProps, GridTheme } from './types'
import { captionParts, conditionText, objectHref } from './types'

/**
 * Object-led collection layouts.
 *
 * The eight variants in `grids.tsx` all arrange images in a rhythm and differ
 * in the rhythm. These five differ in kind: they treat the collection as a set
 * of things you handle, and selection happens in place rather than by
 * navigating. Three consequences follow, and they shape every component here.
 *
 *  1. Frames are sized from each picture's own `aspect`, and the surround is
 *     that picture's own `matte`. That is what lets an inconsistent set of
 *     photographs sit together without cropping and without a hard seam.
 *     Both are null for images uploaded before they were recorded, so every
 *     use falls back.
 *
 *  2. Clicking an object selects it. That breaks the contract the other eight
 *     keep — every item wrapped in a link to its object page — so each of
 *     these carries an explicit `ShareLink`, which is a real anchor. Losing
 *     that would quietly stop a collection linking to its own objects.
 *
 *  3. They need a plural collection. `minItems` on each template says how
 *     many, and the picker warns below it; nothing here enforces it, but the
 *     layouts degrade rather than break.
 */

// ── shared ─────────────────────────────────────────────────────────────────

/** The colour to put behind and around a picture. */
function matteOf(item: GridObject, theme: GridTheme): string {
  return item.matte || theme.imageBg
}

/** A frame's height for a given width, from the picture's own proportions. */
function frameHeight(item: GridObject, width: number, fallback = 1): number {
  const a = item.aspect && item.aspect > 0 ? item.aspect : fallback
  return Math.round(width / a)
}

function Picture({ item, style }: { item: GridObject; style?: CSSProperties }) {
  if (!item.image_url) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl">{item.emoji || '🖼️'}</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.image_url}
      alt={item.title}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-contain"
      style={style}
    />
  )
}

/**
 * The route out to the object page.
 *
 * A real anchor, deliberately: it is the only crawlable link to the object
 * from these layouts, and it is what makes middle-click, open-in-new-tab and
 * keyboard navigation work. A button with a copy handler would do none of that.
 */
function ShareLink({
  item, slug, setSlug, theme, tone = 'light',
}: {
  item: GridObject
  slug: string
  setSlug?: string | null
  theme: GridTheme
  tone?: 'light' | 'dark'
}) {
  const ink = tone === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.62)'
  return (
    <a
      href={objectHref(slug, item.id, setSlug)}
      onClick={e => e.stopPropagation()}
      title={`Open ${item.title}`}
      aria-label={`Open ${item.title} on its own page`}
      className="inline-flex items-center justify-center w-7 h-7 rounded-sm transition-colors focus-visible:outline focus-visible:outline-2"
      style={{ color: ink, outlineColor: theme.accent }}
      onMouseEnter={e => { e.currentTarget.style.color = theme.accent }}
      onMouseLeave={e => { e.currentTarget.style.color = ink }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6.5 2.5H3a1 1 0 0 0-1 1V13a1 1 0 0 0 1 1h9.5a1 1 0 0 0 1-1V9.5"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 2.5H13.5V6.5M13.5 2.5 7 9" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

/**
 * Every object in the collection, as a real anchor.
 *
 * These layouts select in place, so only the object currently held gets a
 * visible link. On its own that leaves a collection with no crawlable route to
 * most of its own objects and no keyboard route either — the quiet regression
 * the eight grid variants never had, because each wraps every item in a link.
 *
 * This list restores both. It is not decoration: remove it and the collection
 * stops linking to itself, which is invisible in testing and shows up months
 * later in a crawl.
 */
function ObjectIndex({
  items, slug, setSlug,
}: { items: GridObject[]; slug: string; setSlug?: string | null }) {
  return (
    <nav className="sr-only" aria-label="All items in this collection">
      <ul>
        {items.map(i => (
          <li key={i.id}><a href={objectHref(slug, i.id, setSlug)}>{i.title}</a></li>
        ))}
      </ul>
    </nav>
  )
}

function Caption({ item, theme }: { item: GridObject; theme: GridTheme }) {
  if (theme.metadata === 'none') return null
  const sub = captionParts(item, theme).join(' \u00b7 ')
  return (
    <>
      <div className="text-[19px] leading-tight" style={{ ...theme.headingStyle, color: theme.heading }}>{item.title}</div>
      {sub && <div className="text-[13.5px] mt-1.5" style={{ color: theme.muted }}>{sub}</div>}
    </>
  )
}

function opt(theme: GridTheme, key: string, fallback: string | boolean): string | boolean {
  const v = theme.templateOptions?.[key]
  return v === undefined ? fallback : v
}

// ── Flip ───────────────────────────────────────────────────────────────────

/** A rack seen at an angle: one plate square on, the rest raked away and
 *  packing tighter the further out they sit. */
export function FlipRack({ items, slug, theme, setSlug }: GridProps) {
  const [sel, setSel] = useState(0)
  if (!items.length) return null
  const at = Math.min(sel, items.length - 1)
  const rake = Number(opt(theme, 'rake', '60')) || 60
  const cur = items[at]

  return (
    <div>
      <ObjectIndex items={items} slug={slug} setSlug={setSlug} />
      <div className="relative h-[440px] overflow-hidden" style={{ perspective: '1500px' }}>
        <div className="absolute inset-x-0 top-4 bottom-0" style={{ transformStyle: 'preserve-3d' }}>
          {items.map((item, i) => {
            const k = i - at
            const a = Math.abs(k)
            const sign = k < 0 ? -1 : 1
            const x = k === 0 ? 0 : sign * (176 + (a - 1) * 62)
            const z = k === 0 ? 180 : -a * 54
            const ry = k === 0 ? 0 : -sign * rake
            if (a > 4) return null
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSel(i)}
                aria-label={item.title}
                aria-current={k === 0}
                className="absolute left-1/2 top-0 w-[220px] -ml-[110px] cursor-pointer"
                style={{
                  transformOrigin: '50% 42%',
                  transform: `translateX(${x}px) translateZ(${z}px) rotateY(${ry}deg) scale(${k === 0 ? 1 : 1 - a * 0.03})`,
                  opacity: k === 0 ? 1 : 1 - (a - 1) * 0.17,
                  zIndex: 100 - a,
                  transition: 'transform 420ms cubic-bezier(0.22,0.8,0.24,1), opacity 340ms ease',
                }}
              >
                <div
                  className="relative w-[220px] h-[290px] overflow-hidden"
                  style={{
                    background: matteOf(item, theme),
                    border: `1px solid ${k === 0 ? theme.accent : theme.border}`,
                    boxShadow: '0 24px 56px rgba(0,0,0,0.55)',
                    borderRadius: theme.radius,
                  }}
                >
                  <Picture item={item} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-start justify-between gap-8 mt-8">
        <div className="min-w-0">
          <Caption item={cur} theme={theme} />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => setSel(at === 0 ? items.length - 1 : at - 1)}
            aria-label="Previous" className="w-9 h-9 flex items-center justify-center"
            style={{ border: `1px solid ${theme.border}`, color: theme.body }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 2 4 8l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => setSel(at === items.length - 1 ? 0 : at + 1)}
            aria-label="Next" className="w-9 h-9 flex items-center justify-center"
            style={{ border: `1px solid ${theme.border}`, color: theme.body }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <ShareLink item={cur} slug={slug} setSlug={setSlug} theme={theme} />
        </div>
      </div>

      <div className="flex items-end gap-1 mt-6 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
        {items.map((item, i) => (
          <button key={item.id} type="button" onClick={() => setSel(i)} aria-label={item.title}
            className="flex-1 min-w-0" style={{ height: i === at ? 22 : 8, background: i === at ? theme.accent : theme.border, transition: 'height 200ms ease' }} />
        ))}
      </div>
    </div>
  )
}

// ── Foil ───────────────────────────────────────────────────────────────────

/** A fanned hand, with the chosen card held up in its mount. */
export function FoilFan({ items, slug, theme, setSlug }: GridProps) {
  const [sel, setSel] = useState(0)
  if (!items.length) return null
  const at = Math.min(sel, items.length - 1)
  const cur = items[at]
  const shine = opt(theme, 'shine', true) === true
  const mounted = opt(theme, 'holder', 'mounted') === 'mounted'
  const n = items.length

  const heroW = 250
  const heroH = frameHeight(cur, heroW, 0.72)

  return (
    <div>
      <ObjectIndex items={items} slug={slug} setSlug={setSlug} />
      <div className="flex flex-wrap items-start justify-center gap-10">
        <div className="flex-shrink-0" style={{ width: 320 }}>
          <div style={mounted ? {
            background: 'linear-gradient(160deg, #f4f1ea, #ddd6cc)',
            borderRadius: 10,
            boxShadow: '0 26px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.9)',
          } : undefined}>
            {mounted && (
              <div className="flex items-stretch gap-3 px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid rgba(10,8,18,0.16)' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold leading-tight" style={{ color: '#14101e' }}>{cur.title}</div>
                  {cur.artist && <div className="text-[10px] mt-0.5" style={{ color: '#4a4458' }}>{cur.artist}</div>}
                </div>
                <div className="w-[86px] flex-shrink-0 pl-3 flex flex-col justify-center" style={{ borderLeft: '1px solid rgba(10,8,18,0.16)' }}>
                  <div className="text-[7px] tracking-[0.14em] uppercase" style={{ color: '#a8455f' }}>
                    {cur.conditionCanonical ? 'Condition' : 'Ungraded'}
                  </div>
                  <div className="text-[13px] font-bold leading-tight mt-0.5" style={{ color: '#14101e' }}>
                    {cur.condition_grade ? conditionText(theme, cur.condition_grade) : 'Not set'}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-center items-center" style={{ padding: mounted ? '18px 18px 12px' : 0, background: mounted ? 'rgba(10,8,18,0.05)' : undefined }}>
              <div className="relative overflow-hidden" style={{ width: heroW, height: heroH, background: matteOf(cur, theme), borderRadius: 4, boxShadow: '0 14px 36px rgba(0,0,0,0.45)' }}>
                <Picture item={cur} />
                {shine && <span aria-hidden className="ol-foil absolute inset-0 pointer-events-none" />}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[260px]">
          <Caption item={cur} theme={theme} />
          {cur.description && <p className="text-[14px] leading-relaxed mt-3 max-w-[52ch]" style={{ color: theme.body }}>{cur.description}</p>}
          <div className="mt-4"><ShareLink item={cur} slug={slug} setSlug={setSlug} theme={theme} /></div>
        </div>
      </div>

      <div className="relative mt-10" style={{ height: 210 }}>
        {items.map((item, i) => {
          const t = n === 1 ? 0 : (i - (n - 1) / 2) / ((n - 1) / 2)
          const on = i === at
          const w = 92
          const h = frameHeight(item, w, 0.72)
          return (
            <button
              key={item.id} type="button" onClick={() => setSel(i)} aria-label={item.title} aria-current={on}
              className="absolute ol-foil-card"
              style={{
                width: w, left: `calc(50% - ${w / 2}px + ${t * 320}px)`, top: 26 + t * t * 40 - (on ? 24 : 0),
                transformOrigin: '50% 190%', transform: `rotate(${(t * 15).toFixed(1)}deg) scale(${on ? 1.08 : 1})`,
                zIndex: on ? 99 : 10 + i,
                filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))',
                transition: 'top 240ms cubic-bezier(0.22,0.8,0.24,1), transform 240ms cubic-bezier(0.22,0.8,0.24,1)',
                outline: on ? `2px solid ${theme.accent}` : undefined, outlineOffset: 4, borderRadius: 4,
              }}
            >
              <div className="relative overflow-hidden" style={{ width: w, height: h, background: matteOf(item, theme), borderRadius: 4, border: `1px solid ${theme.border}` }}>
                <Picture item={item} />
                {shine && <span aria-hidden className="ol-foil absolute inset-0 pointer-events-none" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Northlight ─────────────────────────────────────────────────────────────

/** A lit case. Pieces stand on glass shelves; the chosen one steps forward. */
export function NorthlightCase({ items, slug, theme, setSlug }: GridProps) {
  const [sel, setSel] = useState(0)
  if (!items.length) return null
  const at = Math.min(sel, items.length - 1)
  const cur = items[at]
  const night = opt(theme, 'lighting', 'gallery') === 'night'
  const perShelf = Number(opt(theme, 'perShelf', '5')) || 5

  const beam = night ? 'rgba(150,196,224,' : 'rgba(255,238,204,'
  const shelves: GridObject[][] = []
  for (let i = 0; i < items.length; i += perShelf) shelves.push(items.slice(i, i + perShelf))

  return (
    <div className="flex flex-wrap gap-10 items-start">
      <ObjectIndex items={items} slug={slug} setSlug={setSlug} />
      <div className="flex-shrink-0 w-full max-w-[560px]">
        <div className="relative p-2.5" style={{ background: theme.cardBg, boxShadow: '0 40px 90px rgba(0,0,0,0.6)' }}>
          <div className="relative" style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.7)' }}>
            {shelves.map((row, s) => (
              <div key={s} className="relative" style={{ height: 200 }}>
                <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: 190, background: `radial-gradient(ellipse 62% 84% at 50% 0%, ${beam}${night ? '0.18' : '0.14'}) 0%, transparent 72%)` }} />
                <div className="absolute inset-x-4 bottom-3 flex items-end justify-around gap-2" style={{ height: 168 }}>
                  {row.map(item => {
                    const i = items.indexOf(item)
                    const on = i === at
                    const h = Math.max(70, Math.min(150, frameHeight(item, 100, 1)))
                    const w = Math.round(Math.min(100, h * (item.aspect || 1)))
                    return (
                      <button key={item.id} type="button" onClick={() => setSel(i)} aria-label={item.title} aria-current={on}
                        className="relative" style={{ opacity: on ? 1 : (night ? 0.5 : 0.7), transform: `translateY(${on ? -8 : 0}px)`, transition: 'transform 300ms ease, opacity 300ms ease' }}>
                        <div className="relative overflow-hidden" style={{ width: w, height: h, background: matteOf(item, theme), border: `1px solid ${on ? theme.accent : theme.border}`, boxShadow: '0 6px 16px rgba(0,0,0,0.55)' }}>
                          <Picture item={item} />
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="absolute inset-x-2 bottom-0 pointer-events-none" style={{ height: 9, background: 'linear-gradient(180deg, rgba(200,224,240,0.28), rgba(200,224,240,0.05) 42%, rgba(0,0,0,0.45))' }} />
              </div>
            ))}
          </div>
          <div className="absolute inset-2.5 pointer-events-none" style={{ background: `linear-gradient(107deg, transparent 26%, rgba(214,236,248,${night ? '0.05' : '0.085'}) 38%, transparent 58%)`, boxShadow: 'inset 0 1px 0 rgba(220,240,252,0.26)' }} />
        </div>
      </div>

      <div className="flex-1 min-w-[260px]">
        <div className="relative overflow-hidden" style={{ height: 300, background: `radial-gradient(ellipse 58% 70% at 50% 8%, ${beam}${night ? '0.10' : '0.13'}) 0%, transparent 68%)` }}>
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="relative overflow-hidden" style={{ width: Math.round(Math.min(360, 250 * (cur.aspect || 1))), height: 250, background: matteOf(cur, theme), border: `1px solid ${theme.border}`, boxShadow: '0 20px 50px rgba(0,0,0,0.55)' }}>
              <Picture item={cur} />
            </div>
          </div>
        </div>
        <div className="mt-6"><Caption item={cur} theme={theme} /></div>
        {cur.description && <p className="text-[14px] leading-relaxed mt-3 max-w-[56ch]" style={{ color: theme.body }}>{cur.description}</p>}
        <div className="mt-4"><ShareLink item={cur} slug={slug} setSlug={setSlug} theme={theme} /></div>
      </div>
    </div>
  )
}

// ── Verso ──────────────────────────────────────────────────────────────────

/** The object on one card face, its record on the other. */
export function VersoTray({ items, slug, theme, setSlug }: GridProps) {
  const openOn = opt(theme, 'face', 'object') === 'record'
  const [sel, setSel] = useState(0)
  const [flipped, setFlipped] = useState(openOn)
  const [trayFlipped, setTrayFlipped] = useState(openOn)
  if (!items.length) return null
  const at = Math.min(sel, items.length - 1)
  const cur = items[at]
  const slate = opt(theme, 'paper', 'bone') === 'slate'
  const paper = slate ? { bg: '#e4e6e9', ink: '#14171a' } : { bg: '#efe9da', ink: '#17140f' }
  const L = theme.labels

  const rows: [string, string | null][] = [
    [L.maker, cur.artist || null],
    [L.date, cur.production_date || cur.year || null],
    [L.medium, cur.medium || null],
    [L.origin, cur.culture || null],
    [L.condition, cur.condition_grade ? conditionText(theme, cur.condition_grade) : null],
  ]

  const face: CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }

  return (
    <div className="flex flex-wrap gap-12 items-start">
      <ObjectIndex items={items} slug={slug} setSlug={setSlug} />
      <div className="flex-shrink-0">
        <div style={{ perspective: '1600px', width: 340, height: 340 }}>
          <button type="button" onClick={() => setFlipped(f => !f)} aria-label={flipped ? `Show ${cur.title}` : `Show the record for ${cur.title}`}
            className="relative w-full h-full text-left" style={{ transformStyle: 'preserve-3d', transition: 'transform 700ms cubic-bezier(0.3,0.8,0.25,1)', transform: `rotateY(${flipped ? 180 : 0}deg)` }}>
            <div style={{ ...face, background: matteOf(cur, theme), border: `1px solid ${theme.border}`, boxShadow: '0 26px 60px rgba(0,0,0,0.55)' }}>
              <Picture item={cur} />
            </div>
            <div style={{ ...face, transform: 'rotateY(180deg)', background: paper.bg, color: paper.ink, padding: 22, boxShadow: '0 26px 60px rgba(0,0,0,0.55)', border: `1px solid ${theme.border}` }}>
              <div className="text-[19px] leading-tight mb-3" style={{ ...theme.headingStyle, color: paper.ink }}>{cur.title}</div>
              <dl className="m-0">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex gap-3 py-1.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                    <dt className="w-[92px] flex-shrink-0 text-[8px] tracking-[0.1em] uppercase pt-0.5" style={{ opacity: 0.55 }}>{k}</dt>
                    <dd className="flex-1 m-0 text-[12px] leading-snug" style={{ opacity: v ? 1 : 0.45, fontStyle: v ? 'normal' : 'italic' }}>{v || 'not recorded'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <button type="button" onClick={() => setFlipped(f => !f)}
            className="px-4 h-9 text-[11px] tracking-[0.1em] uppercase" style={{ border: `1px solid ${theme.accent}`, color: theme.accent }}>
            {flipped ? 'Show the object' : 'Turn it over'}
          </button>
          <ShareLink item={cur} slug={slug} setSlug={setSlug} theme={theme} />
        </div>
      </div>

      <div className="flex-1 min-w-[260px]">
        <Caption item={cur} theme={theme} />
        <button type="button"
          onClick={() => { const v = !trayFlipped; setTrayFlipped(v); setFlipped(v) }}
          className="mt-5 px-3 h-8 text-[11px] tracking-[0.08em] uppercase"
          style={{ border: `1px solid ${theme.border}`, color: theme.body }}>
          {trayFlipped ? 'Show the objects' : 'Turn the whole tray'}
        </button>

        <div className="flex flex-wrap gap-2 mt-6">
          {items.map((item, i) => {
            const on = i === at
            return (
              <button key={item.id} type="button" onClick={() => { setSel(i); setFlipped(trayFlipped) }} aria-label={item.title} aria-current={on}
                style={{ perspective: '900px', width: 78 }}>
                <div className="relative" style={{ height: 78, transformStyle: 'preserve-3d', transition: 'transform 600ms cubic-bezier(0.3,0.8,0.25,1)', transform: `rotateY(${trayFlipped ? 180 : 0}deg)` }}>
                  <div style={{ ...face, background: matteOf(item, theme), border: `1px solid ${on ? theme.accent : theme.border}`, overflow: 'hidden' }}>
                    <Picture item={item} />
                  </div>
                  <div style={{ ...face, transform: 'rotateY(180deg)', background: paper.bg, border: `1px solid ${on ? theme.accent : theme.border}`, padding: 7 }}>
                    <div className="text-[15px] leading-none" style={{ ...theme.headingStyle, color: paper.ink }}>{item.production_date || item.year || '—'}</div>
                    <div className="text-[8px] leading-tight mt-1" style={{ color: paper.ink, opacity: 0.6 }}>{item.medium || ''}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Viewfinder ─────────────────────────────────────────────────────────────

const LADDER = ['Poor', 'Fair', 'Good', 'Excellent']

/** The collection seen through a finder, one frame at a time. */
export function ViewfinderStage({ items, slug, theme, setSlug }: GridProps) {
  const [sel, setSel] = useState(0)
  if (!items.length) return null
  const at = Math.min(sel, items.length - 1)
  const cur = items[at]
  const meter = opt(theme, 'meter', true) === true
  const rank = cur.conditionCanonical ? LADDER.indexOf(cur.conditionCanonical) : -1

  return (
    <div>
      <ObjectIndex items={items} slug={slug} setSlug={setSlug} />
      <div className="relative w-full overflow-hidden" style={{ height: 480, borderRadius: 20, background: '#0e1011', boxShadow: '0 34px 80px rgba(0,0,0,0.6)' }}>
        <div className="absolute inset-0" style={{ background: matteOf(cur, theme), opacity: 0.5 }} />
        <div className="absolute z-10 flex items-center justify-center" style={{ inset: '48px 68px' }}>
          <div className="relative w-full h-full">
            <Picture item={cur} />
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none z-30" style={{ boxShadow: 'inset 0 0 110px 54px rgba(0,0,0,0.8)' }} />
        <svg className="absolute inset-0 z-20 w-full h-full" viewBox="0 0 848 480" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <rect x="62" y="44" width="724" height="392" stroke="rgba(255,255,255,0.62)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          <g stroke="rgba(255,255,255,0.32)" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
            <path d="M96 72h34M96 72v22M752 72h-34M752 72v22" />
          </g>
        </svg>
        <svg className="absolute z-20" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} width="170" height="170" viewBox="0 0 170 170" fill="none" aria-hidden="true">
          <circle cx="85" cy="85" r="82" stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />
          <circle cx="85" cy="85" r="82" stroke="rgba(255,255,255,0.1)" strokeWidth="6" strokeDasharray="2 4" />
          <circle cx="85" cy="85" r="42" stroke="rgba(255,255,255,0.42)" strokeWidth="1.3" />
          <path d="M43 85h84" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        </svg>

        {meter && (
          <div className="absolute z-30 left-5 top-12 bottom-12 w-8" aria-hidden="true">
            <div className="absolute left-[15px] inset-y-0 w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
            {LADDER.slice().reverse().map((label, i) => (
              <div key={label} className="absolute left-1.5 flex items-center gap-1.5" style={{ top: `${10 + i * 25}%` }}>
                <span className="block w-2 h-px" style={{ background: 'rgba(255,255,255,0.3)' }} />
                <span className="text-[6.5px] tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>{label.slice(0, 4).toUpperCase()}</span>
              </div>
            ))}
            <div className="absolute left-0.5" style={{ top: `${10 + (LADDER.length - 1 - (rank < 0 ? 0 : rank)) * 25}%`, opacity: rank < 0 ? 0.28 : 1, transition: 'top 320ms ease' }}>
              <svg width="28" height="11" viewBox="0 0 30 12" fill="none"><path d="M0 6h22l8-5v10z" fill={theme.accent} /></svg>
            </div>
          </div>
        )}

        <div className="absolute z-30 right-5 top-12 text-right">
          <div className="text-[6.5px] tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.34)' }}>FRAME</div>
          <div className="text-[20px] leading-tight tabular-nums" style={{ color: theme.accent }}>{String(at + 1).padStart(2, '0')}</div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-8 mt-6">
        <div className="min-w-0"><Caption item={cur} theme={theme} /></div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => setSel(at === 0 ? items.length - 1 : at - 1)} aria-label="Previous"
            className="w-9 h-9 flex items-center justify-center" style={{ border: `1px solid ${theme.border}`, color: theme.body }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 2 4 8l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => setSel(at === items.length - 1 ? 0 : at + 1)} aria-label="Next"
            className="w-9 h-9 flex items-center justify-center" style={{ border: `1px solid ${theme.border}`, color: theme.body }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <ShareLink item={cur} slug={slug} setSlug={setSlug} theme={theme} />
        </div>
      </div>

      <div className="flex gap-1 mt-5 pt-4 overflow-x-auto" style={{ borderTop: `1px solid ${theme.border}` }}>
        {items.map((item, i) => (
          <button key={item.id} type="button" onClick={() => setSel(i)} aria-label={item.title} aria-current={i === at}
            className="flex-1 min-w-[64px] p-1" style={{ background: i === at ? theme.cardBg : 'transparent', border: `1px solid ${i === at ? theme.accent : 'transparent'}` }}>
            <div className="relative w-full" style={{ height: 54, background: matteOf(item, theme) }}>
              <Picture item={item} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
