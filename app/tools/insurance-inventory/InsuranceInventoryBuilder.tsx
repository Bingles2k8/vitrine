'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Niche } from './niches'
import {
  CONDITION_GRADES, CURRENCIES, ACQ_METHODS,
} from '@/lib/tools/constants'
import {
  type InventoryItem, emptyItem, fmtMoney, totalsByCurrency,
  generateInsurancePdf, downloadCsv,
} from '@/lib/tools/insurance-pdf'

const inputCls =
  'w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-100 placeholder-stone-600 outline-none focus:border-amber-500/60 transition-colors'
const labelCls = 'block text-[11px] uppercase tracking-widest text-stone-500 mb-1.5'

async function fileToCompressedDataUrl(file: File, max = 1400, quality = 0.72): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = dataUrl
  })
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

export default function InsuranceInventoryBuilder({ niche }: { niche: Niche }) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [draft, setDraft] = useState<InventoryItem>(() => emptyItem())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [ownerName, setOwnerName] = useState('')
  const [busy, setBusy] = useState<'pdf' | 'csv' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totals = useMemo(() => totalsByCurrency(items), [items])
  const set = (field: keyof InventoryItem, value: string) =>
    setDraft((d) => ({ ...d, [field]: value }))

  function resetDraft() {
    setDraft(emptyItem(draft.currency))
    setEditingId(null)
  }

  function saveDraft() {
    if (!draft.title.trim()) {
      setError('Give the item a name first.')
      return
    }
    setError(null)
    if (editingId) {
      setItems((prev) => prev.map((it) => (it.id === editingId ? { ...draft, id: editingId } : it)))
    } else {
      setItems((prev) => [...prev, draft])
    }
    resetDraft()
  }

  function editItem(it: InventoryItem) {
    setDraft(it)
    setEditingId(it.id)
    setError(null)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (editingId === id) resetDraft()
  }

  async function addPhotos(files: FileList | null) {
    if (!files) return
    const dataUrls: string[] = []
    for (const file of Array.from(files).slice(0, 6)) {
      if (!file.type.startsWith('image/')) continue
      try { dataUrls.push(await fileToCompressedDataUrl(file)) } catch { /* skip */ }
    }
    setDraft((d) => ({ ...d, photos: [...d.photos, ...dataUrls].slice(0, 6) }))
  }

  async function handlePdf() {
    if (items.length === 0) return
    setBusy('pdf')
    setError(null)
    try {
      await generateInsurancePdf(items, {
        ownerName: ownerName.trim(),
        collectionLabel: niche.collectionNoun.replace(/^\w/, (c) => c.toUpperCase()),
        dateStr: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      })
    } catch (e) {
      setError('Sorry — the PDF could not be generated. Try removing very large photos and retry.')
      console.error(e)
    } finally {
      setBusy(null)
    }
  }

  function handleCsv() {
    if (items.length === 0) return
    setBusy('csv')
    try { downloadCsv(items) } finally { setBusy(null) }
  }

  return (
    <div className="space-y-8">
      {/* Summary + actions bar */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-8">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-stone-500">Items</div>
            <div className="text-2xl font-semibold text-stone-100">{items.length}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-stone-500">Declared value</div>
            <div className="text-2xl font-semibold text-stone-100">
              {Object.keys(totals).length
                ? Object.entries(totals).map(([c, a]) => fmtMoney(a, c)).join(' · ')
                : '—'}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCsv}
            disabled={items.length === 0 || busy !== null}
            className="rounded border border-white/15 px-4 py-2.5 text-sm font-mono text-stone-200 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy === 'csv' ? 'Exporting…' : 'Download CSV'}
          </button>
          <button
            onClick={handlePdf}
            disabled={items.length === 0 || busy !== null}
            className="rounded bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-mono text-stone-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy === 'pdf' ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Owner name */}
      <div className="max-w-sm">
        <label className={labelCls}>Your name (appears on the report)</label>
        <input
          className={inputCls}
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="e.g. Jane Smith"
        />
      </div>

      {/* Add / edit item form */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="text-sm uppercase tracking-widest text-stone-400 mb-5">
          {editingId ? 'Edit item' : 'Add an item'}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Name / title *</label>
            <input className={inputCls} value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder={niche.examples.title} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={draft.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select…</option>
              {niche.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Maker / origin</label>
            <input className={inputCls} value={draft.maker} onChange={(e) => set('maker', e.target.value)} placeholder={niche.examples.maker} />
          </div>
          <div>
            <label className={labelCls}>Year / date</label>
            <input className={inputCls} value={draft.year} onChange={(e) => set('year', e.target.value)} placeholder={niche.examples.year} />
          </div>
          <div>
            <label className={labelCls}>Size / grade / ref.</label>
            <input className={inputCls} value={draft.dimensions} onChange={(e) => set('dimensions', e.target.value)} placeholder={niche.examples.dimensions} />
          </div>
          <div>
            <label className={labelCls}>Condition</label>
            <select className={inputCls} value={draft.condition} onChange={(e) => set('condition', e.target.value)}>
              <option value="">Select…</option>
              {CONDITION_GRADES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Serial / identifying no.</label>
            <input className={inputCls} value={draft.serial} onChange={(e) => set('serial', e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className={labelCls}>Estimated value</label>
              <input className={inputCls} inputMode="decimal" value={draft.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select className={inputCls} value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>How acquired</label>
            <select className={inputCls} value={draft.acquisitionMethod} onChange={(e) => set('acquisitionMethod', e.target.value)}>
              <option value="">Select…</option>
              {ACQ_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Purchase date</label>
            <input className={inputCls} type="date" value={draft.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Purchase price</label>
            <input className={inputCls} inputMode="decimal" value={draft.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Acquired from</label>
            <input className={inputCls} value={draft.acquiredFrom} onChange={(e) => set('acquiredFrom', e.target.value)} placeholder="Dealer, auction, etc." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description / notes</label>
            <textarea className={inputCls + ' min-h-[72px] resize-y'} value={draft.description} onChange={(e) => set('description', e.target.value)} placeholder="Distinguishing marks, provenance, anything an insurer should know." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Photos (recommended — capture every angle and any damage)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)} className="block w-full text-sm text-stone-400 file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-stone-200 hover:file:bg-white/15" />
            {draft.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.photos.map((p, idx) => (
                  <div key={idx} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="" className="h-16 w-16 rounded object-cover border border-white/10" />
                    <button
                      onClick={() => setDraft((d) => ({ ...d, photos: d.photos.filter((_, i) => i !== idx) }))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-stone-900 border border-white/20 text-xs text-stone-300 hover:text-white"
                      aria-label="Remove photo"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-xs text-stone-600">Photos stay in your browser — they are embedded into the PDF on your device and never uploaded.</p>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button onClick={saveDraft} className="rounded bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-mono text-stone-100 transition-colors">
            {editingId ? 'Save changes' : '+ Add item'}
          </button>
          {editingId && (
            <button onClick={resetDraft} className="rounded border border-white/10 px-4 py-2.5 text-sm font-mono text-stone-400 hover:text-stone-200 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-4">
              <span className="text-stone-600 font-mono text-sm w-6 text-right">{i + 1}</span>
              {it.photos[0]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={it.photos[0]} alt="" className="h-11 w-11 rounded object-cover border border-white/10 shrink-0" />
                : <div className="h-11 w-11 rounded bg-white/5 border border-white/10 shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="text-stone-100 text-sm font-medium truncate">{it.title || 'Untitled'}</div>
                <div className="text-stone-500 text-xs truncate">
                  {[it.category, it.maker, it.condition].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <div className="text-stone-300 text-sm font-mono shrink-0">
                {it.estimatedValue ? fmtMoney(parseFloat(it.estimatedValue) || 0, it.currency) : '—'}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => editItem(it)} className="text-xs text-stone-400 hover:text-amber-400 px-2 py-1" aria-label="Edit">Edit</button>
                <button onClick={() => removeItem(it.id)} className="text-xs text-stone-500 hover:text-red-400 px-2 py-1" aria-label="Remove">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vitrine CTA */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-stone-100">Want this to stay up to date — automatically?</h2>
        <p className="mt-2 text-sm text-stone-400 leading-relaxed max-w-2xl">
          This tool gives you a one-off snapshot. <span className="text-stone-200">Vitrine</span> keeps a living catalogue of your
          {' '}{niche.collectionNoun}: store photos and receipts securely, track value over time, re-generate insurance
          documentation any time, and never rebuild this list from scratch. Your <span className="text-stone-200">CSV download imports straight in</span>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-mono text-stone-950 transition-colors">
            Start free on Vitrine →
          </Link>
          <Link href="/plans" className="rounded border border-white/15 px-5 py-2.5 text-sm font-mono text-stone-200 hover:bg-white/5 transition-colors">
            See plans
          </Link>
        </div>
      </div>
    </div>
  )
}
