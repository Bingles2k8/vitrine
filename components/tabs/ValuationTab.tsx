'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls, sectionTitle, CURRENCIES } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'
import { getPlan } from '@/lib/plans'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'

const VALUATION_BASES = ['Fair market value', 'Replacement value', 'Insurance value', 'Salvage value', 'Nominal', 'Other']

interface ValuationTabProps {
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
  setLatestValuation: (v: any) => void
  form: Record<string, any>
  set: (field: string, value: any) => void
  saving: boolean
}

export default function ValuationTab({ canEdit, object, museum, supabase, logActivity, setLatestValuation, form, set, saving }: ValuationTabProps) {
  const [valuations, setValuations] = useState<any[]>([])
  const [valuationsLoaded, setValuationsLoaded] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [valuationForm, setValuationForm] = useState({ value: '', currency: 'GBP', valuation_date: today, valuer: '', notes: '', validity_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const { toast } = useToast()
  const canAttach = canEdit && getPlan(museum.plan).compliance

  useEffect(() => {
    supabase.from('valuations').select('*').eq('object_id', object.id).order('valuation_date', { ascending: false })
      .then(({ data }: any) => { setValuations(data || []); setValuationsLoaded(true) })
  }, [object.id])

  async function addValuation() {
    if (!valuationForm.value || submitting) return
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
      valuation_basis: null,
      validity_date: valuationForm.validity_date || null,
    })
    if (valErr) { toast(valErr.message, 'error'); setSubmitting(false); return }
    const newValuation = await supabase.from('valuations').select('id').eq('valuation_reference', valRef).single()
    if (stagedDocs.length > 0 && newValuation.data) {
      const failed = await uploadStagedDocs(supabase, stagedDocs, object.id, museum.id, 'valuation', newValuation.data.id)
      if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
      setStagedDocs([])
    }
    const lv = { value: valuationForm.value, currency: valuationForm.currency, valuation_date: valuationForm.valuation_date }
    setLatestValuation(lv)
    setValuationForm({ value: '', currency: 'GBP', valuation_date: today, valuer: '', notes: '', validity_date: '' })
    const { data } = await supabase.from('valuations').select('*').eq('object_id', object.id).order('valuation_date', { ascending: false })
    setValuations(data || [])
    logActivity('valuation_added', `Recorded valuation of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: valuationForm.currency || 'GBP', minimumFractionDigits: 0 }).format(parseFloat(valuationForm.value))} for "${object.title}"`)
    setSubmitting(false)
  }

  const fmtCurrency = (value: any, currency: string) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP', minimumFractionDigits: 0 }).format(parseFloat(value))

  return (
    <>
      {/* Purchase Price */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Purchase Price</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Value</label>
            <input type="number" step="0.01" min="0" value={form.acquisition_value}
              onChange={e => set('acquisition_value', e.target.value)}
              placeholder="0.00" className={inputCls} disabled={!canEdit || saving} />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">What you paid, or the agreed value at acquisition.</p>
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select value={form.acquisition_currency} onChange={e => set('acquisition_currency', e.target.value)} className={inputCls} disabled={!canEdit || saving}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {canEdit && (
          <button type="submit" disabled={saving}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
            {saving ? 'Saving\u2026' : 'Save \u2192'}
          </button>
        )}
      </div>

      {/* Estimated Current Value — Community / Hobbyist tiers only */}
      {!getPlan(museum.plan).fullMode && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
          <div className={sectionTitle}>Estimated Current Value</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Estimated value</label>
              <input type="number" step="0.01" min="0" value={form.estimated_value}
                onChange={e => set('estimated_value', e.target.value)}
                placeholder="0.00" className={inputCls} disabled={!canEdit || saving} />
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Your own estimate — update it any time. <span className="italic">(Internal — never shown publicly.)</span></p>
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select value={form.estimated_value_currency} onChange={e => set('estimated_value_currency', e.target.value)} className={inputCls} disabled={!canEdit || saving}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {canEdit && (
            <button type="submit" disabled={saving}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
              {saving ? 'Saving\u2026' : 'Save \u2192'}
            </button>
          )}
        </div>
      )}

      {canEdit && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
          <div className={sectionTitle}>Official Recorded Valuation</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelCls} data-learn="valuation.value">Value <span className="text-red-400">*</span></label>
              <input type="number" step="0.01" min="0" value={valuationForm.value} onChange={e => setValuationForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} data-learn="valuation.currency">Currency</label>
              <select value={valuationForm.currency} onChange={e => setValuationForm(f => ({ ...f, currency: e.target.value }))} className={inputCls}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} data-learn="valuation.valuer">Valuer</label>
              <input value={valuationForm.valuer} onChange={e => setValuationForm(f => ({ ...f, valuer: e.target.value }))} placeholder="Name or organisation" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} data-learn="valuation.validity_date">Validity Date</label>
              <input type="date" value={valuationForm.validity_date} onChange={e => setValuationForm(f => ({ ...f, validity_date: e.target.value }))} className={inputCls} />
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Date until which this valuation is valid</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={valuationForm.notes} onChange={e => setValuationForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
          </div>
          {canAttach && (
            <div>
              <label className={labelCls}>Supporting Documents</label>
              <StagedDocumentPicker relatedToType="valuation" value={stagedDocs} onChange={setStagedDocs} />
            </div>
          )}
          <button type="button" onClick={addValuation} disabled={!valuationForm.value || submitting}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
            {submitting ? 'Saving\u2026' : 'Save valuation \u2192'}
          </button>
        </div>
      )}

      {valuationsLoaded && valuations.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{ marginBottom: 0 }}>Valuation History</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Date</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Value</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Method</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Purpose</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Valuer</th>
            </tr></thead>
            <tbody>
              {valuations.map(v => (
                <tr key={v.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer" onClick={() => setSelectedRecord(v)}>
                  <td className="px-6 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(v.valuation_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-sm font-mono text-stone-900 dark:text-stone-100">{fmtCurrency(v.value, v.currency)}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.method || '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.purpose || '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.valuer || '—'}</td>
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

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{fmtCurrency(selectedRecord.value, selectedRecord.currency)}</div>
                <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-0.5">{selectedRecord.valuation_reference}</div>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Date</div>
                  <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRecord.valuation_date).toLocaleDateString('en-GB')}</div>
                </div>
                {selectedRecord.valuer && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Valuer</div>
                    <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.valuer}</div>
                  </div>
                )}
              </div>
              {(selectedRecord.method || selectedRecord.purpose) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRecord.method && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Method</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.method}</div>
                    </div>
                  )}
                  {selectedRecord.purpose && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Purpose</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.purpose}</div>
                    </div>
                  )}
                </div>
              )}
              {selectedRecord.valuation_basis && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Basis</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.valuation_basis}</div>
                </div>
              )}
              {selectedRecord.validity_date && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Valid Until</div>
                  <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRecord.validity_date).toLocaleDateString('en-GB')}</div>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.notes}</div>
                </div>
              )}
              {canAttach && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Documents</div>
                  <DocumentAttachments objectId={object.id} museumId={museum.id} relatedToType="valuation" relatedToId={selectedRecord.id} canEdit={canEdit} canAttach={canAttach} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
