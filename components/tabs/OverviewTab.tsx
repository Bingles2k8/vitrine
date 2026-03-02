'use client'

import { useRouter } from 'next/navigation'
import { inputCls, labelCls, sectionTitle, MEDIUMS, STATUSES, EMOJIS, OBJECT_TYPES, CONDITION_STYLES, MAKER_ROLES, DATE_QUALIFIERS, DIMENSION_UNITS, WEIGHT_UNITS } from '@/components/tabs/shared'
import ImageUpload from '@/components/ImageUpload'
import ImageGallery from '@/components/ImageGallery'

interface OverviewTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  saving: boolean
  saved: boolean
  artifact: any
  museum: any
  latestValuation: any
  setActiveTab: (tab: string) => void
}

function SaveBar({ saving, saved, onCancel }: { saving: boolean; saved: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-3 items-center">
      <button type="submit" disabled={saving}
        className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
        {saving ? 'Saving\u2026' : 'Save changes \u2192'}
      </button>
      <button type="button" onClick={onCancel}
        className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800">
        Cancel
      </button>
      {saved && <span className="text-xs font-mono text-emerald-600">{'\u2713'} Saved</span>}
    </div>
  )
}

export default function OverviewTab({ form, set, canEdit, saving, saved, artifact, museum, latestValuation, setActiveTab }: OverviewTabProps) {
  const router = useRouter()

  return (
    <>
      {/* Image section */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-6">
        <ImageUpload currentUrl={form.image_url} onUpload={(url: string) => set('image_url', url)} />
        <ImageGallery artifactId={artifact.id} museumId={museum.id} onPrimaryChange={(url: string) => set('image_url', url)} canEdit={canEdit} />
      </div>

      {/* Icon selector */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
        <label className={labelCls}>Icon</label>
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => set('emoji', e)}
              className={`w-10 h-10 rounded-lg border text-xl transition-all ${form.emoji === e ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-stone-700' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Core Details card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Core Details</div>

        <div>
          <label className={labelCls}>Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Artist / Maker</label><input value={form.artist} onChange={e => set('artist', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Date / Year</label><input value={form.year} onChange={e => set('year', e.target.value)} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Medium</label>
            <select value={form.medium} onChange={e => set('medium', e.target.value)} className={inputCls}>
              {MEDIUMS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Culture / Origin</label><input value={form.culture} onChange={e => set('culture', e.target.value)} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Accession No.</label><input value={form.accession_no} onChange={e => set('accession_no', e.target.value)} className={`${inputCls} font-mono`} /></div>
          <div><label className={labelCls}>Dimensions</label><input value={form.dimensions} onChange={e => set('dimensions', e.target.value)} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Object Type</label>
            <select value={form.object_type} onChange={e => set('object_type', e.target.value)} className={inputCls}>
              <option value="">{'\u2014'} Select {'\u2014'}</option>
              {OBJECT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Current Location</label>
            <p className="text-sm text-stone-900 dark:text-stone-100 py-2">{form.current_location || <span className="text-stone-400">{'\u2014'}</span>}</p>
            <button type="button" onClick={() => setActiveTab('location')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Update in Location tab {'\u2192'}</button>
          </div>
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} type="button" onClick={() => set('status', s)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${form.status === s ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {form.condition_grade && (
          <div>
            <label className={labelCls}>Condition</label>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[form.condition_grade] || 'bg-stone-100 text-stone-500'}`}>{form.condition_grade}</span>
              {form.condition_date && <span className="text-xs text-stone-400 dark:text-stone-500">Assessed {new Date(form.condition_date).toLocaleDateString('en-GB')}</span>}
              <button type="button" onClick={() => setActiveTab('condition')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Update in Condition tab {'\u2192'}</button>
            </div>
          </div>
        )}

        {latestValuation && (
          <div>
            <label className={labelCls}>Latest Valuation</label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-stone-900 dark:text-stone-100">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: latestValuation.currency || 'GBP', minimumFractionDigits: 0 }).format(parseFloat(latestValuation.value))}
              </span>
              {latestValuation.valuation_date && <span className="text-xs text-stone-400 dark:text-stone-500">{new Date(latestValuation.valuation_date).toLocaleDateString('en-GB')}</span>}
              <button type="button" onClick={() => setActiveTab('valuation')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Update in Valuation tab {'\u2192'}</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Insured Value</label>
            <input type="number" step="0.01" min="0" value={form.insured_value || ''} onChange={e => set('insured_value', e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Insured Currency</label>
            <select value={form.insured_value_currency || 'GBP'} onChange={e => set('insured_value_currency', e.target.value)} className={inputCls}>
              {['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Public Site</label>
          <button
            type="button"
            onClick={() => set('show_on_site', !form.show_on_site)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded border text-xs font-mono transition-all ${
              form.show_on_site
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                : 'bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-500'
            }`}
          >
            <span className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${form.show_on_site ? 'bg-emerald-500 dark:bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${form.show_on_site ? 'left-4' : 'left-0.5'}`} />
            </span>
            {form.show_on_site ? 'Visible on public site' : 'Hidden from public site'}
          </button>
        </div>

        <div>
          <label className={labelCls}>Description (public)</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>

        <div>
          <label className={labelCls}>Inscription</label>
          <textarea value={form.inscription} onChange={e => set('inscription', e.target.value)} rows={2}
            placeholder="Text inscribed on the object\u2026"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>

        <div>
          <label className={labelCls}>Marks & Stamps</label>
          <textarea value={form.marks} onChange={e => set('marks', e.target.value)} rows={2}
            placeholder="Hallmarks, maker's marks, stamps, signatures on reverse\u2026"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>

        <div>
          <label className={labelCls}>Provenance</label>
          <textarea value={form.provenance} onChange={e => set('provenance', e.target.value)} rows={3}
            placeholder="Known ownership history prior to acquisition\u2026"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>
      </div>

      {/* Cataloguing (Spectrum Proc 5) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Cataloguing</div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Maker Name</label><input value={form.maker_name} onChange={e => set('maker_name', e.target.value)} placeholder="Full name" className={inputCls} /></div>
          <div>
            <label className={labelCls}>Maker Role</label>
            <select value={form.maker_role} onChange={e => set('maker_role', e.target.value)} className={inputCls}>
              <option value="">{'\u2014'} Select {'\u2014'}</option>
              {MAKER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div><label className={labelCls}>Date (Early)</label><input value={form.production_date_early} onChange={e => set('production_date_early', e.target.value)} placeholder="e.g. 1850" className={inputCls} /></div>
          <div><label className={labelCls}>Date (Late)</label><input value={form.production_date_late} onChange={e => set('production_date_late', e.target.value)} placeholder="e.g. 1860" className={inputCls} /></div>
          <div>
            <label className={labelCls}>Date Qualifier</label>
            <select value={form.production_date_qualifier} onChange={e => set('production_date_qualifier', e.target.value)} className={inputCls}>
              <option value="">{'\u2014'} Select {'\u2014'}</option>
              {DATE_QUALIFIERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Production Place</label><input value={form.production_place} onChange={e => set('production_place', e.target.value)} placeholder="City, region, country" className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Physical Materials</label><input value={form.physical_materials} onChange={e => set('physical_materials', e.target.value)} placeholder="e.g. oil, canvas, gilt wood" className={inputCls} /></div>
          <div><label className={labelCls}>Technique</label><input value={form.technique} onChange={e => set('technique', e.target.value)} placeholder="e.g. hand-thrown, woven" className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div><label className={labelCls}>School / Style / Period</label><input value={form.school_style_period} onChange={e => set('school_style_period', e.target.value)} placeholder="e.g. Impressionist" className={inputCls} /></div>
          <div><label className={labelCls}>Subject Depicted</label><input value={form.subject_depicted} onChange={e => set('subject_depicted', e.target.value)} placeholder="e.g. landscape, portrait" className={inputCls} /></div>
          <div><label className={labelCls}>Number of Parts</label><input type="number" min="1" value={form.number_of_parts} onChange={e => set('number_of_parts', e.target.value)} className={inputCls} /></div>
        </div>

        {/* Structured dimensions */}
        <div>
          <label className={labelCls}>Structured Dimensions</label>
          <div className="grid grid-cols-5 gap-3">
            <div><input type="number" step="0.1" min="0" value={form.dimension_height} onChange={e => set('dimension_height', e.target.value)} placeholder="H" className={inputCls} /></div>
            <div><input type="number" step="0.1" min="0" value={form.dimension_width} onChange={e => set('dimension_width', e.target.value)} placeholder="W" className={inputCls} /></div>
            <div><input type="number" step="0.1" min="0" value={form.dimension_depth} onChange={e => set('dimension_depth', e.target.value)} placeholder="D" className={inputCls} /></div>
            <div>
              <select value={form.dimension_unit} onChange={e => set('dimension_unit', e.target.value)} className={inputCls}>
                {DIMENSION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input type="number" step="0.01" min="0" value={form.dimension_weight} onChange={e => set('dimension_weight', e.target.value)} placeholder="Weight" className={inputCls} />
              <select value={form.dimension_weight_unit} onChange={e => set('dimension_weight_unit', e.target.value)} className={`${inputCls} w-20 flex-shrink-0`}>
                {WEIGHT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <input value={form.dimension_notes} onChange={e => set('dimension_notes', e.target.value)} placeholder="Dimension notes (e.g. framed, with base)" className={`${inputCls} mt-2`} />
        </div>

        <div>
          <label className={labelCls}>Distinguishing Features</label>
          <textarea value={form.distinguishing_features} onChange={e => set('distinguishing_features', e.target.value)} rows={2}
            placeholder="Features that distinguish this from similar objects\u2026"
            className={`${inputCls} resize-none`} />
        </div>

        <div>
          <label className={labelCls}>Full Description (internal)</label>
          <textarea value={form.full_description} onChange={e => set('full_description', e.target.value)} rows={3}
            placeholder="Detailed internal catalogue description\u2026"
            className={`${inputCls} resize-none`} />
        </div>

        <div className={sectionTitle} style={{marginTop: '1.5rem'}}>Associations</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Associated Person</label><input value={form.associated_person} onChange={e => set('associated_person', e.target.value)} placeholder="e.g. previous owner, subject" className={inputCls} /></div>
          <div><label className={labelCls}>Associated Organisation</label><input value={form.associated_organisation} onChange={e => set('associated_organisation', e.target.value)} placeholder="e.g. commission, guild" className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className={labelCls}>Associated Place</label><input value={form.associated_place} onChange={e => set('associated_place', e.target.value)} placeholder="e.g. depicted location" className={inputCls} /></div>
          <div><label className={labelCls}>Associated Event</label><input value={form.associated_event} onChange={e => set('associated_event', e.target.value)} placeholder="e.g. exhibition, war" className={inputCls} /></div>
          <div><label className={labelCls}>Associated Concept</label><input value={form.associated_concept} onChange={e => set('associated_concept', e.target.value)} placeholder="e.g. mourning, trade" className={inputCls} /></div>
        </div>
      </div>

      {canEdit && <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />}
    </>
  )
}
