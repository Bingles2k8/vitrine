'use client'

import type { DamagePin } from '@/lib/tools/condition-pdf'
import { DAMAGE_SEVERITIES } from '@/lib/tools/constants'
import { fileToCompressedDataUrl } from '@/lib/tools/image'

const inputCls =
  'w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-100 placeholder-stone-600 outline-none focus:border-amber-500/60 transition-colors'
const labelCls = 'block text-[11px] uppercase tracking-widest text-stone-500 mb-1.5'

export default function DamageMap({
  basePhoto,
  pins,
  onSetBasePhoto,
  onSetPins,
}: {
  basePhoto: string | null
  pins: DamagePin[]
  onSetBasePhoto: (dataUrl: string | null) => void
  onSetPins: (pins: DamagePin[]) => void
}) {
  async function handleFile(files: FileList | null) {
    if (!files || !files[0]) return
    try {
      const dataUrl = await fileToCompressedDataUrl(files[0])
      onSetBasePhoto(dataUrl)
    } catch { /* ignore */ }
  }

  function addPin(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width
    const yPct = (e.clientY - rect.top) / rect.height
    if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) return
    const n = pins.length ? Math.max(...pins.map((p) => p.n)) + 1 : 1
    onSetPins([
      ...pins,
      { id: Math.random().toString(36).slice(2), n, xPct, yPct, location: '', issue: '', severity: '' },
    ])
  }

  function updatePin(id: string, patch: Partial<DamagePin>) {
    onSetPins(pins.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function removePin(id: string) {
    // Remove and renumber so the key stays sequential.
    const next = pins.filter((p) => p.id !== id).map((p, i) => ({ ...p, n: i + 1 }))
    onSetPins(next)
  }

  return (
    <div className="space-y-4">
      {!basePhoto ? (
        <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-stone-400 mb-3">
            Upload a photo of the object, then click on it to mark each area of damage.
          </p>
          <label className="inline-block rounded bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-mono text-stone-100 cursor-pointer transition-colors">
            Upload object photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />
          </label>
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-500">Click on the image to drop a numbered marker for each issue.</p>
          <div className="relative inline-block max-w-full select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={basePhoto}
              alt="Object"
              onClick={addPin}
              className="max-w-full rounded-lg border border-white/10 cursor-crosshair"
              draggable={false}
            />
            {pins.map((p) => (
              <span
                key={p.id}
                className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${p.xPct * 100}%`, top: `${p.yPct * 100}%` }}
              >
                {p.n}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <label className="inline-block rounded border border-white/10 px-3 py-2 text-xs font-mono text-stone-400 hover:text-stone-200 cursor-pointer transition-colors">
              Replace photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />
            </label>
            <button
              onClick={() => { onSetBasePhoto(null); onSetPins([]) }}
              className="rounded border border-white/10 px-3 py-2 text-xs font-mono text-stone-500 hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </div>
        </>
      )}

      {/* Pin detail rows */}
      {pins.length > 0 && (
        <div className="space-y-3 pt-2">
          {pins.map((p) => (
            <div key={p.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">{p.n}</span>
                <button onClick={() => removePin(p.id)} className="text-xs text-stone-500 hover:text-red-400">Remove</button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Location on object</label>
                  <input className={inputCls} value={p.location} onChange={(e) => updatePin(p.id, { location: e.target.value })} placeholder="e.g. lower left corner" />
                </div>
                <div>
                  <label className={labelCls}>Issue</label>
                  <input className={inputCls} value={p.issue} onChange={(e) => updatePin(p.id, { issue: e.target.value })} placeholder="e.g. chip, crack, stain" />
                </div>
                <div>
                  <label className={labelCls}>Severity</label>
                  <select className={inputCls} value={p.severity} onChange={(e) => updatePin(p.id, { severity: e.target.value })}>
                    <option value="">Select…</option>
                    {DAMAGE_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
