import Link from 'next/link'
import type { Template } from '@/lib/templates'
import TemplateThumb from './TemplateThumb'

/**
 * Building blocks for the two About tracks.
 *
 * Everything here is a server component and deliberately static — the page
 * carries two JSON-LD blocks and per-track metadata, and nothing on it needs
 * to react to a click. The audience switch is two links, not state.
 */

export function Section({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children?: React.ReactNode
}) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-medium text-white mb-4">{title}</h2>
      {lead && <p className="text-stone-300 leading-relaxed mb-5 text-lg font-light">{lead}</p>}
      <div className="space-y-4 text-stone-400 leading-relaxed">{children}</div>
    </section>
  )
}

/** A named sub-point inside a section. */
export function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-medium text-stone-200 mb-1.5">{title}</h3>
      <div className="text-stone-400 leading-relaxed">{children}</div>
    </div>
  )
}

/**
 * A template, shown with its own palette rather than described in the page's.
 * previewBg/previewText/previewAccent already exist on every template for the
 * site editor's picker, so this costs nothing and no images.
 */
export function TemplateCard({ t, locked }: { t: Template; locked?: boolean }) {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden flex flex-col">
      <TemplateThumb t={t} />
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <h3 className="text-base font-medium text-white">{t.name}</h3>
          {locked && (
            <span className="text-[10px] font-mono uppercase tracking-wide text-amber-500/80 whitespace-nowrap">
              Professional
            </span>
          )}
        </div>
        <p className="text-sm text-stone-400 leading-relaxed flex-1">{t.description}</p>
        <p className="mt-3 text-[11px] font-mono text-stone-600">
          {t.grid_variant} grid · {t.chrome} chrome
          {t.minItems ? ` · from ${t.minItems} items` : ''}
        </p>
      </div>
    </div>
  )
}

/** Limits, never prices. Prices live on /plans and nowhere else. */
export function LimitsTable({
  columns,
  rows,
  footnote,
}: {
  columns: string[]
  rows: [string, ...string[]][]
  footnote?: string
}) {
  return (
    <div className="mt-6">
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm border-collapse min-w-[30rem]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left font-normal text-stone-500 py-2.5 pr-4" />
              {columns.map((c) => (
                <th key={c} className="text-left font-medium text-stone-200 py-2.5 pr-4 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-white/5">
                <td className="py-2.5 pr-4 text-stone-400">{row[0]}</td>
                {row.slice(1).map((cell, i) => (
                  <td key={i} className="py-2.5 pr-4 text-stone-300 whitespace-nowrap">
                    {cell === '—' ? <span className="text-stone-600">—</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && <p className="mt-4 text-sm text-stone-500">{footnote}</p>}
      <p className="mt-4 text-sm font-mono">
        <Link href="/plans" className="text-amber-500 hover:text-amber-400 transition-colors">
          See what each plan costs →
        </Link>
      </p>
    </div>
  )
}
