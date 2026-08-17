import type { CSSProperties, ReactNode } from 'react'
import type { ChromeStyle, ObjectOptions, ObjectVariant } from '@/lib/templates'

export interface MetaRow { label: string; value: string }
export interface ProseSection { label: string; value: string }

export interface ObjectTheme {
  accent: string
  heading: string
  body: string
  muted: string
  border: string
  cardBg: string
  headingStyle: CSSProperties
  chrome: ChromeStyle
  radius: number
  options: ObjectOptions
}

/**
 * The pieces of an object page, handed to whichever layout the template picks.
 *
 * The page assembles the data; the layout decides only where things sit. That
 * split is what keeps seven arrangements from becoming seven copies of the
 * fetching, profile-label and schema logic.
 */
export interface ObjectLayoutProps {
  theme: ObjectTheme
  back: ReactNode
  gallery: ReactNode
  eyebrow: string | null
  title: string
  maker: string | null
  rarity: { label: string; value: string } | null
  certification: ReactNode | null
  actions: ReactNode | null
  meta: MetaRow[]
  description: string | null
  prose: ProseSection[]
  extras: ReactNode | null
  footer: ReactNode | null
}

// ─── Shared pieces ──────────────────────────────────────────────────────────

function Label({ children, theme, className = '' }: { children: ReactNode; theme: ObjectTheme; className?: string }) {
  return (
    <div className={`text-[11px] uppercase tracking-[0.18em] font-mono ${className}`} style={{ color: theme.muted }}>
      {children}
    </div>
  )
}

/** Boxed two-column cells — the original treatment. */
function MetaGrid({ meta, theme }: { meta: MetaRow[]; theme: ObjectTheme }) {
  if (meta.length === 0) return null
  return (
    <div
      className="grid grid-cols-2 border overflow-hidden mb-8"
      style={{ borderColor: theme.border, borderRadius: theme.chrome === 'hard' ? 0 : 8 }}
    >
      {meta.map((row, i) => (
        <div
          key={row.label}
          className={'p-4 ' + (i % 2 === 0 ? 'border-r ' : '') + 'border-b last:border-b-0'}
          style={{ borderColor: theme.border }}
        >
          <Label theme={theme} className="mb-1">{row.label}</Label>
          <div className="text-sm" style={{ color: theme.heading }}>{row.value}</div>
        </div>
      ))}
    </div>
  )
}

/** Ruled definition rows — a catalogue record rather than a table of boxes. */
function MetaList({ meta, theme, dense = false }: { meta: MetaRow[]; theme: ObjectTheme; dense?: boolean }) {
  if (meta.length === 0) return null
  return (
    <dl className="mb-8" style={{ borderTop: `1px solid ${theme.border}` }}>
      {meta.map(row => (
        <div
          key={row.label}
          className={`flex flex-wrap gap-x-6 gap-y-1 ${dense ? 'py-2' : 'py-3'}`}
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <dt className="w-40 shrink-0 text-[11px] uppercase tracking-[0.18em] font-mono pt-0.5" style={{ color: theme.muted }}>
            {row.label}
          </dt>
          <dd className="text-sm flex-1 min-w-0" style={{ color: theme.heading }}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Tight metadata columns for the magazine spread. */
function MetaColumns({ meta, theme }: { meta: MetaRow[]; theme: ObjectTheme }) {
  if (meta.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8 pt-4" style={{ borderTop: `2px solid ${theme.heading}` }}>
      {meta.map(row => (
        <div key={row.label}>
          <Label theme={theme} className="mb-1">{row.label}</Label>
          <div className="text-sm font-medium" style={{ color: theme.heading }}>{row.value}</div>
        </div>
      ))}
    </div>
  )
}

/** Bordered panel with alternating row tint, for the formal templates. */
function MetaPanel({ meta, theme }: { meta: MetaRow[]; theme: ObjectTheme }) {
  if (meta.length === 0) return null
  return (
    <div className="mb-8 overflow-hidden" style={{ border: `1px solid ${theme.border}`, borderRadius: theme.radius }}>
      {meta.map((row, i) => (
        <div
          key={row.label}
          className="flex flex-wrap gap-x-4 px-4 py-2.5"
          style={{ background: i % 2 === 1 ? `${theme.accent}0d` : 'transparent' }}
        >
          <div className="w-36 shrink-0 text-[11px] uppercase tracking-[0.18em] font-mono pt-0.5" style={{ color: theme.muted }}>
            {row.label}
          </div>
          <div className="text-sm flex-1 min-w-0" style={{ color: theme.heading }}>{row.value}</div>
        </div>
      ))}
    </div>
  )
}

function Prose({ description, prose, theme, size = 'sm' }: {
  description: string | null
  prose: ProseSection[]
  theme: ObjectTheme
  size?: 'sm' | 'base'
}) {
  const text = size === 'base' ? 'text-base leading-[1.75]' : 'text-sm leading-relaxed'
  return (
    <>
      {description && (
        <p className={`${text} font-light mb-8`} style={{ color: theme.body }}>{description}</p>
      )}
      {prose.map(section => (
        <div key={section.label} className="mb-6">
          <Label theme={theme} className="mb-2">{section.label}</Label>
          <p className={`${text} font-light`} style={{ color: theme.body }}>{section.value}</p>
        </div>
      ))}
    </>
  )
}

/** Accent rule with a centred lozenge — the formal templates' separator. */
function Ornament({ theme }: { theme: ObjectTheme }) {
  return (
    <div className="flex items-center justify-center gap-3 my-4">
      <div className="h-px w-12" style={{ background: theme.accent }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ background: theme.accent }} />
      <div className="h-px w-12" style={{ background: theme.accent }} />
    </div>
  )
}

function Rarity({ rarity, theme }: { rarity: ObjectLayoutProps['rarity']; theme: ObjectTheme }) {
  if (!rarity) return null
  return (
    <p className="text-sm font-mono mb-6" style={{ color: theme.accent }}>
      <span style={{ color: theme.muted }}>{rarity.label}: </span>{rarity.value}
    </p>
  )
}

// ─── standard ───────────────────────────────────────────────────────────────
// Two columns with a sticky gallery. The original arrangement, kept as the
// fallback and used by Salon, whose sidebar already frames the page.

export function StandardObject(p: ObjectLayoutProps) {
  const { theme } = p
  return (
    <div className="max-w-5xl mx-auto px-6 pt-6 pb-16 md:py-16">
      {p.back}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div className="md:sticky md:top-24" style={{ color: theme.muted }}>{p.gallery}</div>
        <div>
          {p.eyebrow && <Label theme={theme} className="mb-3">{p.eyebrow}</Label>}
          <h1 className="text-4xl font-normal leading-tight mb-2" style={{ ...theme.headingStyle, color: theme.heading }}>
            {p.title}
          </h1>
          {p.maker && (
            <p className="text-xl mb-6" style={{ ...theme.headingStyle, color: theme.muted }}>{p.maker}</p>
          )}
          <Rarity rarity={p.rarity} theme={theme} />
          {p.certification}
          {p.actions && <div className="mb-8">{p.actions}</div>}
          <MetaGrid meta={p.meta} theme={theme} />
          <Prose description={p.description} prose={p.prose} theme={theme} />
          {p.extras}
          {p.footer}
        </div>
      </div>
    </div>
  )
}

// ─── plate ──────────────────────────────────────────────────────────────────
// White cube. The work hangs alone with air around it, and everything else is
// a wall label set beneath — nothing competes with the object.

export function PlateObject(p: ObjectLayoutProps) {
  const { theme } = p
  return (
    <div className="max-w-4xl mx-auto px-6 pt-6 pb-24 md:pt-10 md:pb-32">
      {p.back}

      <div className="mb-14 md:mb-20" style={{ color: theme.muted }}>{p.gallery}</div>

      {/* Wall label — narrow, left-aligned, sitting under the work. */}
      <div className="max-w-xl">
        {p.eyebrow && <Label theme={theme} className="mb-3">{p.eyebrow}</Label>}
        <h1 className="text-3xl md:text-4xl leading-tight mb-2" style={{ ...theme.headingStyle, color: theme.heading }}>
          {p.title}
        </h1>
        {p.maker && (
          <p className="text-lg mb-5" style={{ ...theme.headingStyle, color: theme.muted }}>{p.maker}</p>
        )}
        <Rarity rarity={p.rarity} theme={theme} />
        {p.certification}
        <Prose description={p.description} prose={p.prose} theme={theme} />
        <MetaList meta={p.meta} theme={theme} dense />
        {p.actions && <div className="mb-8">{p.actions}</div>}
        {p.extras}
        {p.footer}
      </div>
    </div>
  )
}

// ─── catalogue ──────────────────────────────────────────────────────────────
// A formal catalogue record: ruled masthead, then the work beside its entry.

export function CatalogueObject(p: ObjectLayoutProps) {
  const { theme } = p
  return (
    <div className="max-w-5xl mx-auto px-6 pt-6 pb-16 md:py-12">
      {p.back}

      <div
        className="text-center py-8 px-6 mb-10"
        style={{ border: `1px solid ${theme.border}`, outline: `4px solid ${theme.border}`, outlineOffset: '-8px' }}
      >
        {p.eyebrow && <Label theme={theme} className="mb-3">{p.eyebrow}</Label>}
        <h1 className="text-3xl md:text-4xl leading-tight" style={{ ...theme.headingStyle, color: theme.heading }}>
          {p.title}
        </h1>
        <Ornament theme={theme} />
        {p.maker && <p className="text-base" style={{ color: theme.body }}>{p.maker}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-start">
        <div className="md:col-span-2 md:sticky md:top-24" style={{ color: theme.muted }}>{p.gallery}</div>
        <div className="md:col-span-3">
          <Rarity rarity={p.rarity} theme={theme} />
          {p.certification}
          <MetaList meta={p.meta} theme={theme} />
          <Prose description={p.description} prose={p.prose} theme={theme} />
          {p.actions && <div className="mb-8">{p.actions}</div>}
          {p.extras}
          {p.footer}
        </div>
      </div>
    </div>
  )
}

// ─── cinematic ──────────────────────────────────────────────────────────────
// The image leads at full width; the record follows as a sidebar beside the
// prose. Built for the dark templates, where a boxed grid kills the mood.

export function CinematicObject(p: ObjectLayoutProps) {
  const { theme } = p
  const overlay = theme.options.overlayTitle === true

  const titleBlock = (
    <>
      {p.eyebrow && <Label theme={theme} className="mb-3">{p.eyebrow}</Label>}
      <h1
        className="text-4xl md:text-5xl leading-[1.05] mb-2"
        style={{ ...theme.headingStyle, color: overlay ? '#ffffff' : theme.heading, overflowWrap: 'break-word' }}
      >
        {p.title}
      </h1>
      {p.maker && (
        <p className="text-lg" style={{ ...theme.headingStyle, color: overlay ? 'rgba(255,255,255,0.7)' : theme.muted }}>
          {p.maker}
        </p>
      )}
    </>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 pt-6 pb-16 md:pb-24">
      {p.back}

      <div className="relative mb-10" style={{ color: theme.muted }}>
        {p.gallery}
        {overlay && (
          <div
            className="absolute inset-x-0 bottom-0 p-6 md:p-10 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
          >
            {titleBlock}
          </div>
        )}
      </div>

      {!overlay && (
        <>
          <div className="mb-6">{titleBlock}</div>
          <div className="h-px w-full mb-10" style={{ background: theme.accent }} />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-7">
          <Rarity rarity={p.rarity} theme={theme} />
          <Prose description={p.description} prose={p.prose} theme={theme} />
          {p.extras}
        </div>
        <div className="md:col-span-5">
          {p.certification}
          <MetaList meta={p.meta} theme={theme} dense />
          {p.actions && <div className="mb-8">{p.actions}</div>}
          {p.footer}
        </div>
      </div>
    </div>
  )
}

// ─── editorial ──────────────────────────────────────────────────────────────
// A magazine spread: heavy rule, kicker, oversized title across the measure,
// then the work beside its details.

export function EditorialObject(p: ObjectLayoutProps) {
  const { theme } = p
  const kicker = [
    theme.options.numbered ? 'Catalogue entry' : null,
    p.eyebrow,
  ].filter(Boolean).join(' — ')

  return (
    <div className="max-w-6xl mx-auto px-6 pt-6 pb-16 md:pb-24">
      {p.back}

      <div style={{ borderTop: `4px solid ${theme.heading}` }} className="pt-5 mb-8">
        {kicker && (
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] mb-4" style={{ color: theme.accent }}>
            {kicker}
          </div>
        )}
        <h1
          className="text-4xl md:text-6xl font-bold uppercase leading-[0.95] tracking-tight mb-4"
          style={{ fontFamily: theme.headingStyle.fontFamily, color: theme.heading, overflowWrap: 'break-word' }}
        >
          {p.title}
        </h1>
        {p.maker && <p className="text-lg" style={{ color: theme.body }}>{p.maker}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-start mb-10">
        <div className="md:col-span-3" style={{ color: theme.muted }}>{p.gallery}</div>
        <div className="md:col-span-2">
          <Rarity rarity={p.rarity} theme={theme} />
          {p.certification}
          <MetaColumns meta={p.meta} theme={theme} />
          {p.actions && <div className="mb-8">{p.actions}</div>}
        </div>
      </div>

      {/* Body text runs in columns on wide screens, as a spread would. */}
      <div className="md:columns-2 md:gap-10 [&>*]:break-inside-avoid">
        <Prose description={p.description} prose={p.prose} theme={theme} />
      </div>

      {p.extras}
      {p.footer}
    </div>
  )
}

// ─── essay ──────────────────────────────────────────────────────────────────
// Text-first. One narrow reading measure, the work set in it as a figure, and
// the record kept back until the end.

export function EssayObject(p: ObjectLayoutProps) {
  const { theme } = p
  return (
    <div className="max-w-2xl mx-auto px-6 pt-6 pb-24">
      {p.back}

      <div className="mb-10">
        {p.eyebrow && <Label theme={theme} className="mb-4">{p.eyebrow}</Label>}
        <h1 className="text-3xl md:text-4xl leading-tight mb-3" style={{ ...theme.headingStyle, color: theme.heading }}>
          {p.title}
        </h1>
        {p.maker && (
          <p className="text-lg" style={{ ...theme.headingStyle, color: theme.muted }}>{p.maker}</p>
        )}
      </div>

      <figure className="mb-10" style={{ color: theme.muted }}>{p.gallery}</figure>

      <Rarity rarity={p.rarity} theme={theme} />
      {p.certification}

      {/* The reading size is a step up here — this is the template that
          expects visitors to actually read the entry. */}
      <Prose description={p.description} prose={p.prose} theme={theme} size="base" />

      {p.extras}

      {p.meta.length > 0 && (
        <div className="mt-12 pt-2">
          <Label theme={theme} className="mb-4">Details</Label>
          <MetaList meta={p.meta} theme={theme} dense />
        </div>
      )}

      {p.actions && <div className="mb-8">{p.actions}</div>}
      {p.footer}
    </div>
  )
}

// ─── panel ──────────────────────────────────────────────────────────────────
// Symmetrical and formal: a centred masthead, the work framed and matted, and
// the record in a bordered panel beside it.

export function PanelObject(p: ObjectLayoutProps) {
  const { theme } = p
  return (
    <div className="max-w-5xl mx-auto px-6 pt-6 pb-16 md:py-12">
      {p.back}

      <div className="text-center mb-10">
        {p.eyebrow && <Label theme={theme} className="mb-3">{p.eyebrow}</Label>}
        <h1 className="text-3xl md:text-4xl leading-tight" style={{ ...theme.headingStyle, color: theme.heading }}>
          {p.title}
        </h1>
        <Ornament theme={theme} />
        {p.maker && <p className="text-base" style={{ color: theme.body }}>{p.maker}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="md:sticky md:top-24" style={{ color: theme.muted }}>{p.gallery}</div>
        <div>
          <Rarity rarity={p.rarity} theme={theme} />
          {p.certification}
          <MetaPanel meta={p.meta} theme={theme} />
          <Prose description={p.description} prose={p.prose} theme={theme} />
          {p.actions && <div className="mb-8">{p.actions}</div>}
          {p.extras}
          {p.footer}
        </div>
      </div>
    </div>
  )
}

export const OBJECT_LAYOUTS: Record<ObjectVariant, (p: ObjectLayoutProps) => React.ReactElement> = {
  standard: StandardObject,
  plate: PlateObject,
  catalogue: CatalogueObject,
  cinematic: CinematicObject,
  editorial: EditorialObject,
  essay: EssayObject,
  panel: PanelObject,
}

/** How each layout wants its gallery framed. */
export const GALLERY_PRESET: Record<ObjectVariant, {
  frame: 'hairline' | 'none' | 'matted'
  aspect: 'square' | 'wide' | 'tall' | 'natural'
  fit?: 'cover' | 'contain'
}> = {
  standard:  { frame: 'hairline', aspect: 'square' },
  plate:     { frame: 'none', aspect: 'natural' },
  catalogue: { frame: 'hairline', aspect: 'square' },
  cinematic: { frame: 'none', aspect: 'wide', fit: 'cover' },
  editorial: { frame: 'hairline', aspect: 'square' },
  essay:     { frame: 'none', aspect: 'natural' },
  panel:     { frame: 'matted', aspect: 'square' },
}
