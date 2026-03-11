'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls, sectionTitle, VALUATION_METHODS, VALUATION_PURPOSES, CURRENCIES } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'

const VALUATION_BASES = ['Fair market value', 'Replacement value', 'Insurance value', 'Salvage value', 'Nominal', 'Other']

interface ValuationTabProps {
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
  setLatestValuation: (v: any) => void
}

export default function ValuationTab({ canEdit, object, museum, supabase, logActivity, setLatestValuation }: ValuationTabProps) {
  const [valuations, setValuations] = useState<any[]>([])
  const [valuationsLoaded, setValuationsLoaded] = useState(false)
  const [valuationForm, setValuationForm] = useState({ value: '', currency: 'GBP', valuation_date: '', valuer: '', method: '', purpose: '', notes: '', valuation_basis: '', validity_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    supabase.from('valuations').select('*').eq('object_id', object.id).order('valuation_date', { ascending: false })
      .then(({ data }: any) => { setValuations(data || []); setValuationsLoaded(true) })
  }, [object.id])

  async function addValuation() {
    if (!valuationForm.value || !valuationForm.valuation_date || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const count = valuations.filter(v => v.valuation_reference?.startsWith(`VL-${year}-`)).length
    const valRef = `VL-${year}-${String(count + 1).padStart(3, '0')}`
    const { error: valErr } = await supabase.from('valuations').insert({
      ...valuationForm,
      value: parseFloat(valuationForm.value),
      object_id: object.id,
      museum_id: museum.id,
      valuation_reference: valRef,
      valuation_basis: valuationForm.valuation_basis || null,
      validity_date: valuationForm.validity_date || null,
    })
    if (valErr) { toast(valErr.message, 'error'); setSubmitting(false); return }
    const lv = { value: valuationForm.value, currency: valuationForm.currency, valuation_date: valuationForm.valuation_date }
    setLatestValuation(lv)
    setValuationForm({ value: '', currency: 'GBP', valuation_date: '', valuer: '', method: '', purpose: '', notes: '', valuation_basis: '', validity_date: '' })
    const { data } = await supabase.from('valuations').select('*').eq('object_id', object.id).order('valuation_date', { ascending: false })
    setValuations(data || [])
    logActivity('valuation_added', `Recorded valuation of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: valuationForm.currency || 'GBP', minimumFractionDigits: 0 }).format(parseFloat(valuationForm.value))} for "${object.title}"`)
    setSubmitting(false)
  }

  return (
    <>

      {canEdit && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
          <div className={sectionTitle}>Record Valuation</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Value *</label>
              <input type="number" step="0.01" min="0" value={valuationForm.value} onChange={e => setValuationForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select value={valuationForm.currency} onChange={e => setValuationForm(f => ({ ...f, currency: e.target.value }))} className={inputCls}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Valuation Date *</label>
              <input type="date" value={valuationForm.valuation_date} onChange={e => setValuationForm(f => ({ ...f, valuation_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Valuer</label>
              <input value={valuationForm.valuer} onChange={e => setValuationForm(f => ({ ...f, valuer: e.target.value }))} placeholder="Name or organisation" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Method</label>
              <select value={valuationForm.method} onChange={e => setValuationForm(f => ({ ...f, method: e.target.value }))} className={inputCls}>
                <option value="">— Select —</option>
                {VALUATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Purpose</label>
              <select value={valuationForm.purpose} onChange={e => setValuationForm(f => ({ ...f, purpose: e.target.value }))} className={inputCls}>
                <option value="">— Select —</option>
                {VALUATION_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Valuation Basis</label>
              <select value={valuationForm.valuation_basis} onChange={e => setValuationForm(f => ({ ...f, valuation_basis: e.target.value }))} className={inputCls}>
                <option value="">— Select —</option>
                {VALUATION_BASES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Validity Date</label>
              <input type="date" value={valuationForm.validity_date} onChange={e => setValuationForm(f => ({ ...f, validity_date: e.target.value }))} className={inputCls} />
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Date until which this valuation is valid</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={valuationForm.notes} onChange={e => setValuationForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
          </div>
          <button type="button" onClick={addValuation} disabled={!valuationForm.value || !valuationForm.valuation_date || submitting}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
            {submitting ? 'Saving…' : 'Save valuation →'}
          </button>
        </div>
      )}

      {valuationsLoaded && valuations.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Valuation History</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Date</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Value</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Method</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Purpose</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Valuer</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Notes</th>
            </tr></thead>
            <tbody>
              {valuations.map(v => (
                <tr key={v.id} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="px-6 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(v.valuation_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-sm font-mono text-stone-900 dark:text-stone-100">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: v.currency || 'GBP', minimumFractionDigits: 0 }).format(parseFloat(v.value))}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.method || '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.purpose || '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.valuer || '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {valuationsLoaded && valuations.length === 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">◈</div>
          <p className="text-sm text-stone-400 dark:text-stone-500">No valuations recorded for this object.</p>
        </div>
      )}
    </>
  )
}
