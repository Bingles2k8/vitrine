'use client'

import { useState } from 'react'
import Link from 'next/link'
import DamageMap from './DamageMap'
import {
  type ConditionReport, type DamagePin, emptyReport, generateConditionPdf,
} from '@/lib/tools/condition-pdf'
import { CONDITION_GRADES, CONDITION_REASONS, CONDITION_PRIORITIES } from '@/lib/tools/constants'
import { fileToCompressedDataUrl } from '@/lib/tools/image'

const inputCls =
  'w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-100 placeholder-stone-600 outline-none focus:border-amber-500/60 transition-colors'
const labelCls = 'block text-[11px] uppercase tracking-widest text-stone-500 mb-1.5'
const sectionCls = 'rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6'
const headingCls = 'text-sm uppercase tracking-widest text-stone-400 mb-5'

export default function ConditionReportBuilder() {
  const [report, setReport] = useState<ConditionReport>(() => emptyReport())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof ConditionReport, value: string) =>
    setReport((r) => ({ ...r, [field]: value }))

  async function addExtraPhotos(files: FileList | null) {
    if (!files) return
    const urls: string[] = []
    for (const f of Array.from(files).slice(0, 6)) {
      if (!f.type.startsWith('image/')) continue
      try { urls.push(await fileToCompressedDataUrl(f)) } catch { /* skip */ }
    }
    setReport((r) => ({ ...r, extraPhotos: [...r.extraPhotos, ...urls].slice(0, 8) }))
  }

  async function handlePdf() {
    if (!report.title.trim() && !report.accessionNo.trim()) {
      setError('Add at least an object name or accession number first.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await generateConditionPdf(report)
    } catch (e) {
      setError('Sorry — the report could not be generated. Try a smaller photo and retry.')
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Report header details */}
      <div className={sectionCls}>
        <h2 className={headingCls}>Report details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Institution / collection name</label>
            <input className={inputCls} value={report.institution} onChange={(e) => set('institution', e.target.value)} placeholder="e.g. Ashford Town Museum" />
          </div>
          <div>
            <label className={labelCls}>Report reference</label>
            <input className={inputCls} value={report.reference} onChange={(e) => set('reference', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Object / tombstone */}
      <div className={sectionCls}>
        <h2 className={headingCls}>The object</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Object name / title</label>
            <input className={inputCls} value={report.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Earthenware storage jar" />
          </div>
          <div>
            <label className={labelCls}>Accession number</label>
            <input className={inputCls} value={report.accessionNo} onChange={(e) => set('accessionNo', e.target.value)} placeholder="e.g. 2024.14.1" />
          </div>
          <div>
            <label className={labelCls}>Maker / origin</label>
            <input className={inputCls} value={report.maker} onChange={(e) => set('maker', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Object type</label>
            <input className={inputCls} value={report.objectType} onChange={(e) => set('objectType', e.target.value)} placeholder="e.g. Ceramic" />
          </div>
          <div>
            <label className={labelCls}>Medium / materials</label>
            <input className={inputCls} value={report.medium} onChange={(e) => set('medium', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Dimensions</label>
            <input className={inputCls} value={report.dimensions} onChange={(e) => set('dimensions', e.target.value)} placeholder="H × W × D" />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input className={inputCls} value={report.dateMade} onChange={(e) => set('dateMade', e.target.value)} placeholder="e.g. c. 1880" />
          </div>
        </div>
      </div>

      {/* Assessment */}
      <div className={sectionCls}>
        <h2 className={headingCls}>Assessment</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Overall condition</label>
            <select className={inputCls} value={report.grade} onChange={(e) => set('grade', e.target.value)}>
              <option value="">Select…</option>
              {CONDITION_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Reason for check</label>
            <select className={inputCls} value={report.reason} onChange={(e) => set('reason', e.target.value)}>
              <option value="">Select…</option>
              {CONDITION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Assessed by</label>
            <input className={inputCls} value={report.assessor} onChange={(e) => set('assessor', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Date assessed</label>
            <input className={inputCls} type="date" value={report.assessedAt} onChange={(e) => set('assessedAt', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={report.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="">Select…</option>
              {CONDITION_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Next check due</label>
            <input className={inputCls} value={report.nextCheck} onChange={(e) => set('nextCheck', e.target.value)} placeholder="e.g. 12 months" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Hazards / handling notes</label>
            <input className={inputCls} value={report.hazard} onChange={(e) => set('hazard', e.target.value)} placeholder="e.g. fragile handle, active mould, sharp edge" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description of condition</label>
            <textarea className={inputCls + ' min-h-[88px] resize-y'} value={report.description} onChange={(e) => set('description', e.target.value)} placeholder="Overall state, materials, surface, structural condition…" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Recommendations</label>
            <textarea className={inputCls + ' min-h-[72px] resize-y'} value={report.recommendations} onChange={(e) => set('recommendations', e.target.value)} placeholder="Conservation, handling, environment, monitoring…" />
          </div>
        </div>
      </div>

      {/* Damage map */}
      <div className={sectionCls}>
        <h2 className={headingCls}>Condition / damage map</h2>
        <DamageMap
          basePhoto={report.basePhoto}
          pins={report.pins}
          onSetBasePhoto={(dataUrl) => setReport((r) => ({ ...r, basePhoto: dataUrl }))}
          onSetPins={(pins: DamagePin[]) => setReport((r) => ({ ...r, pins }))}
        />
      </div>

      {/* Additional photos */}
      <div className={sectionCls}>
        <h2 className={headingCls}>Additional photographs</h2>
        <input type="file" accept="image/*" multiple onChange={(e) => addExtraPhotos(e.target.files)} className="block w-full text-sm text-stone-400 file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-stone-200 hover:file:bg-white/15" />
        {report.extraPhotos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {report.extraPhotos.map((p, idx) => (
              <div key={idx} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-16 w-16 rounded object-cover border border-white/10" />
                <button
                  onClick={() => setReport((r) => ({ ...r, extraPhotos: r.extraPhotos.filter((_, i) => i !== idx) }))}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-stone-900 border border-white/20 text-xs text-stone-300 hover:text-white"
                  aria-label="Remove photo"
                >×</button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-stone-600">Everything stays in your browser — photos are embedded into the PDF on your device and never uploaded.</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex">
        <button
          onClick={handlePdf}
          disabled={busy}
          className="rounded bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-mono text-stone-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? 'Generating…' : 'Download condition report PDF'}
        </button>
      </div>

      {/* Vitrine CTA */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-stone-100">Reporting on a whole collection?</h2>
        <p className="mt-2 text-sm text-stone-400 leading-relaxed max-w-2xl">
          One-off reports are fine for a single object. <span className="text-stone-200">Vitrine</span> keeps condition
          reporting connected to your whole collection: track condition over time, link reports to objects, loans and
          conservation records, and keep every check on one documented history.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-mono text-stone-950 transition-colors">
            Try Vitrine free →
          </Link>
          <Link href="/plans" className="rounded border border-white/15 px-5 py-2.5 text-sm font-mono text-stone-200 hover:bg-white/5 transition-colors">
            See plans
          </Link>
        </div>
      </div>
    </div>
  )
}
