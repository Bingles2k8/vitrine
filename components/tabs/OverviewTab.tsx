'use client'

import { useRouter } from 'next/navigation'
import { inputCls, labelCls, sectionTitle, MEDIUMS, STATUSES, EMOJIS, OBJECT_TYPES, CULTURES, CONDITION_STYLES, DATE_QUALIFIERS, DIMENSION_UNITS, WEIGHT_UNITS } from '@/components/tabs/shared'
import { COLLECTION_CATEGORIES } from '@/lib/categories'
import AutocompleteInput from '@/components/AutocompleteInput'
import ImageUpload from '@/components/ImageUpload'
import ImageGallery from '@/components/ImageGallery'
import ObjectComponents from '@/components/ObjectComponents'
import { getPlan } from '@/lib/plans'

interface OverviewTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  saving: boolean
  object: any
  museum: any
  latestValuation: any
  setActiveTab: (tab: string) => void
}

const publicLabel = <span className="ml-1 text-xs font-mono text-emerald-600 dark:text-emerald-500 normal-case tracking-normal">(Public)</span>

function SaveBar({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
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
    </div>
  )
}

const textareaCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'

export default function OverviewTab({ form, set, canEdit, saving, object, museum, latestValuation, setActiveTab }: OverviewTabProps) {
  const router = useRouter()
  const fullMode = getPlan(museum.plan).fullMode

  return (
    <>
      {/* Hazard alert */}
      {form.hazard_note && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 font-medium mb-0.5">Hazard Note</div>
            <div className="text-sm text-amber-800 dark:text-amber-300">{form.hazard_note}</div>
          </div>
        </div>
      )}

      {/* Images */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
        <div className="flex flex-row gap-2 overflow-x-auto">
          <div className="w-40 h-40 shrink-0">
            <ImageUpload currentUrl={form.image_url} onUpload={(url: string) => set('image_url', url)} />
          </div>
          <ImageGallery objectId={object.id} museumId={museum.id} onPrimaryChange={(url: string) => set('image_url', url)} canEdit={canEdit} imageLimit={getPlan(museum.plan).imagesPerObject} currentPrimaryUrl={form.image_url} hidePrimary />
        </div>
      </div>

      {/* Icon */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
        <label className={labelCls} data-learn="objects.icon">Icon</label>
        <div className="flex gap-2 flex-wrap">
          {/* No icon option */}
          <button
            key="none"
            type="button"
            onClick={() => set('emoji', null)}
            className={`w-10 h-10 rounded-lg border text-xs font-mono transition-all ${!form.emoji ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-stone-700 text-stone-900 dark:text-white' : 'border-stone-200 dark:border-stone-700 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
          >
            —
          </button>
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => set('emoji', e)}
              className={`w-10 h-10 rounded-lg border text-xl transition-all ${form.emoji === e ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-stone-700' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Object Information */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Object Information</div>

        {/* Title */}
        <div>
          <label className={labelCls} data-learn="objects.title">Title * {publicLabel}</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} />
        </div>

        {/* Artist + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} data-learn="objects.artist">Artist / Maker {publicLabel}</label>
            <input value={form.artist} onChange={e => set('artist', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} data-learn="objects.production_date">Date {publicLabel}</label>
            <input value={form.production_date || ''} onChange={e => set('production_date', e.target.value)} placeholder="e.g. 1850, c.1920–1930" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} data-learn="objects.production_date_qualifier">Date Qualifier {publicLabel}</label>
            <select value={form.production_date_qualifier} onChange={e => set('production_date_qualifier', e.target.value)} className={inputCls}>
              <option value="">{'\u2014'} Select {'\u2014'}</option>
              {DATE_QUALIFIERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
        </div>

        {/* Medium + Object Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="objects.medium">Medium {publicLabel}</label>
            <AutocompleteInput
              value={form.medium}
              onChange={v => set('medium', v)}
              museumId={museum.id}
              field="medium"
              staticList={MEDIUMS}
              placeholder="Search or type a medium…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} data-learn="objects.object_type">Object Type {publicLabel}</label>
            <AutocompleteInput
              value={form.object_type}
              onChange={v => set('object_type', v)}
              museumId={museum.id}
              field="object_type"
              staticList={OBJECT_TYPES}
              placeholder="e.g. Painting, Sculpture…"
              className={inputCls}
            />
          </div>
        </div>

        {/* Culture/Origin */}
        <div>
          <label className={labelCls} data-learn="objects.culture">Culture / Origin {publicLabel}</label>
          <AutocompleteInput
            value={form.culture}
            onChange={v => set('culture', v)}
            museumId={museum.id}
            field="culture"
            staticList={CULTURES}
            placeholder="e.g. British, French, Japanese…"
            className={inputCls}
          />
        </div>

        {/* Accession No. + Rarity + Number of Parts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} data-learn="objects.accession_no">
              {form.accession_no ? <>Accession Number {publicLabel}</> : 'Provisional Object Number'}
            </label>
            <input value={form.accession_no} onChange={e => set('accession_no', e.target.value)} className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label className={labelCls} data-learn="objects.rarity">Edition / Rarity {publicLabel}</label>
            <input value={form.rarity || ''} onChange={e => set('rarity', e.target.value)} placeholder="e.g. 1 of 500, First Edition" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} data-learn="objects.number_of_parts">Number of Parts {publicLabel}</label>
            <input type="number" min="1" value={form.number_of_parts} onChange={e => set('number_of_parts', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Accession distinction */}
        {fullMode && (
          <div className="space-y-2">
            <label className={labelCls} data-learn="objects.formally_accessioned">Accession Status</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Formally accessioned', value: true },
                { label: 'Not formally accessioned', value: false },
              ].map(opt => {
                const isActive = form.formally_accessioned === opt.value || (opt.value === true && form.formally_accessioned == null)
                return (
                  <button key={String(opt.value)} type="button" onClick={() => set('formally_accessioned', opt.value)}
                    className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${isActive ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {form.formally_accessioned === false && (
              <div className="mt-2">
                <label className={labelCls}>Reason not formally accessioned</label>
                <textarea value={form.non_accession_reason || ''} onChange={e => set('non_accession_reason', e.target.value)} rows={2}
                  placeholder="e.g. Found in collection, transferred informally, pre-accession object…"
                  className={textareaCls} />
              </div>
            )}
          </div>
        )}

        {/* Object Components (sub-parts) */}
        {parseInt(form.number_of_parts) > 1 && object?.id && (
          <div>
            <label className={labelCls}>Parts and Notes {publicLabel}</label>
            <ObjectComponents objectId={object.id} accessionNo={form.accession_no} canEdit={canEdit} />
          </div>
        )}

        {/* Status */}
        <div>
          <label className={labelCls} data-learn="objects.status">Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} type="button" onClick={() => set('status', s)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${form.status === s ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls} data-learn="objects.description">Description {publicLabel}</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className={textareaCls} />
        </div>

        {/* Other Names — moved above Historical Context */}
        {fullMode && (
          <div>
            <label className={labelCls} data-learn="objects.other_names">Other Names / Also Known As {publicLabel}</label>
            <input value={form.other_names || ''} onChange={e => set('other_names', e.target.value)}
              placeholder="Alternative titles, former names, popular names…"
              className={inputCls} />
          </div>
        )}

        {/* Historical Context */}
        <div>
          <label className={labelCls} data-learn="objects.historical_context">Historical Context {publicLabel}</label>
          <textarea value={form.historical_context || ''} onChange={e => set('historical_context', e.target.value)} rows={3}
            placeholder="Historical background, significance, or context of the object…"
            className={textareaCls} />
        </div>

        {/* Marks and Inscriptions */}
        <div>
          <label className={labelCls} data-learn="objects.inscription">Marks and Inscriptions {publicLabel}</label>
          <textarea value={form.inscription} onChange={e => set('inscription', e.target.value)} rows={3}
            placeholder="Inscriptions, hallmarks, maker's marks, stamps, signatures…"
            className={textareaCls} />
        </div>

        {/* Physical Description — merged colour/shape/surface_treatment */}
        <div>
          <label className={labelCls} data-learn="objects.physical_description">Physical Description {publicLabel}</label>
          <textarea value={form.physical_description || ''} onChange={e => set('physical_description', e.target.value)} rows={3}
            placeholder="Colour, shape, surface treatment, and other physical characteristics…"
            className={textareaCls} />
        </div>

        {/* Materials & Techniques */}
        {fullMode && (
          <div>
            <label className={labelCls} data-learn="objects.physical_materials">Materials &amp; Techniques {publicLabel}</label>
            <input value={form.physical_materials} onChange={e => set('physical_materials', e.target.value)} placeholder="e.g. oil on canvas, gilt wood frame; hand-thrown" className={inputCls} />
          </div>
        )}

        {/* Dimensions */}
        <div>
          <label className={labelCls} data-learn="objects.dimensions">Dimensions {publicLabel}</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <div><input type="number" step="0.1" min="0" value={form.dimension_height} onChange={e => set('dimension_height', e.target.value)} placeholder="H" className={inputCls} /></div>
            <div><input type="number" step="0.1" min="0" value={form.dimension_width} onChange={e => set('dimension_width', e.target.value)} placeholder="W" className={inputCls} /></div>
            <div><input type="number" step="0.1" min="0" value={form.dimension_depth} onChange={e => set('dimension_depth', e.target.value)} placeholder="D" className={inputCls} /></div>
            <div>
              <select value={form.dimension_unit} onChange={e => set('dimension_unit', e.target.value)} className={inputCls}>
                {DIMENSION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><input type="number" step="0.01" min="0" value={form.dimension_weight} onChange={e => set('dimension_weight', e.target.value)} placeholder="Weight" className={inputCls} /></div>
            <div>
              <select value={form.dimension_weight_unit} onChange={e => set('dimension_weight_unit', e.target.value)} className={inputCls}>
                {WEIGHT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <input value={form.dimension_notes} onChange={e => set('dimension_notes', e.target.value)} placeholder="Dimension notes (e.g. framed, with base)" className={`${inputCls} mt-2`} />
        </div>



        {/* Credit Line — directly below Acquisition Source */}
        {fullMode && (
          <div>
            <label className={labelCls} data-learn="objects.credit_line">Credit Line {publicLabel}</label>
            <input value={form.credit_line || ''} onChange={e => set('credit_line', e.target.value)} placeholder="How the donor wishes to be credited. Leave blank if they don't require credit." className={inputCls} />
          </div>
        )}

        {/* Further Information (renamed from Full Description Internal) */}
        {fullMode && (
          <div>
            <label className={labelCls} data-learn="objects.full_description">Further Information</label>
            <textarea value={form.full_description} onChange={e => set('full_description', e.target.value)} rows={3}
              placeholder="Detailed internal catalogue description…"
              className={textareaCls} />
          </div>
        )}

        {/* Provenance */}
        {fullMode && (
          <div className="space-y-3">
            <div>
              <label className={labelCls} data-learn="objects.provenance">Provenance</label>
              <textarea value={form.provenance} onChange={e => set('provenance', e.target.value)} rows={3}
                placeholder="Known ownership history prior to acquisition…"
                className={textareaCls} />
            </div>
          </div>
        )}

        {/* Condition + Location */}
        {form.condition_grade && (
          <div>
            <label className={labelCls} data-learn="objects.condition_grade">Condition</label>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[form.condition_grade] || 'bg-stone-100 text-stone-500'}`}>{form.condition_grade}</span>
              {form.condition_date && <span className="text-xs text-stone-400 dark:text-stone-500">Assessed {new Date(form.condition_date).toLocaleDateString('en-GB')}</span>}
              <button type="button" onClick={() => setActiveTab('condition')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Update in Condition tab {'\u2192'}</button>
            </div>
          </div>
        )}
        <div>
          <label className={labelCls} data-learn="objects.current_location">Current Location</label>
          <p className="text-sm text-stone-900 dark:text-stone-100 py-2">{form.current_location || <span className="text-stone-400">{'\u2014'}</span>}</p>
          <button type="button" onClick={() => setActiveTab('location')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Update in Location tab {'\u2192'}</button>
        </div>

        {/* Insured Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="objects.insured_value">Insured Value</label>
            <input type="number" step="0.01" min="0" value={form.insured_value || ''} onChange={e => set('insured_value', e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select value={form.insured_value_currency || 'GBP'} onChange={e => set('insured_value_currency', e.target.value)} className={inputCls}>
              {['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

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

        {/* Purchase or Gift */}
        {fullMode && (
          <div>
            <label className={labelCls} data-learn="objects.is_gift">Purchase or Gift</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Not specified', value: null },
                { label: 'Gift', value: true },
                { label: 'Purchase', value: false },
              ].map(opt => {
                const isActive = form.is_gift === opt.value
                return (
                  <button key={String(opt.value)} type="button" onClick={() => set('is_gift', opt.value)}
                    className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${isActive ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Associations */}
        <div className={sectionTitle} style={{marginTop: '1.5rem'}}>Associations</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className={labelCls}>Associated Person</label><input value={form.associated_person} onChange={e => set('associated_person', e.target.value)} placeholder="e.g. previous owner, subject" className={inputCls} /></div>
          <div><label className={labelCls}>Associated Organisation</label><input value={form.associated_organisation} onChange={e => set('associated_organisation', e.target.value)} placeholder="e.g. commission, guild" className={inputCls} /></div>
          <div><label className={labelCls}>Associated Place</label><input value={form.associated_place} onChange={e => set('associated_place', e.target.value)} placeholder="e.g. depicted location" className={inputCls} /></div>
        </div>

        {/* Record Attribution (incl. donor/GDPR info from former Entry tab) */}
        {fullMode && (
          <>
            <div className={sectionTitle} style={{marginTop: '1.5rem'}}>Record Attribution</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Donor Name</label>
                <input value={form.acquisition_source || ''} onChange={e => set('acquisition_source', e.target.value)}
                  placeholder="Donor, seller, or source name"
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Donor Contact</label>
                <input value={form.acquisition_source_contact || ''} onChange={e => set('acquisition_source_contact', e.target.value)}
                  placeholder="Email, phone, or address"
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acknowledgement_sent_to_donor ?? false}
                    onChange={e => set('acknowledgement_sent_to_donor', e.target.checked)}
                    className="rounded border-stone-300 dark:border-stone-600"
                  />
                  <span className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">Receipt / Acknowledgement Sent</span>
                </label>
              </div>
            </div>
            <div>
              <label className={labelCls}>Attribution Notes</label>
              <textarea value={form.attribution_notes || ''} onChange={e => set('attribution_notes', e.target.value)} rows={2}
                placeholder="Uncertainty, conflicting sources, research still required…"
                className={textareaCls} />
            </div>
          </>
        )}

        {/* Public Site Visibility — moved to bottom */}
        <div className={sectionTitle} style={{marginTop: '1.5rem'}}>Visibility</div>
        <div>
          <label className={labelCls} data-learn="objects.show_on_site">Public Site Visibility</label>
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

        {/* Feature on homepage toggle */}
        {form.show_on_site && getPlan(museum.plan).advancedCustomisation && (
          <div>
            <button
              type="button"
              onClick={() => set('is_featured', !form.is_featured)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded border text-xs font-mono transition-all ${
                form.is_featured
                  ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400'
                  : 'bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-500'
              }`}
            >
              <span className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${form.is_featured ? 'bg-amber-400 dark:bg-amber-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${form.is_featured ? 'left-4' : 'left-0.5'}`} />
              </span>
              {form.is_featured ? 'Featured on homepage' : 'Feature on homepage'}
            </button>
            {!form.is_featured && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">Show this work in a highlighted section above the collection grid.</p>
            )}
          </div>
        )}

        {/* Discovery Category — moved to bottom */}
        <div>
          <label className={labelCls} data-learn="objects.category">Discovery Category</label>
          <select
            value={form.category || ''}
            onChange={e => set('category', e.target.value || null)}
            className={inputCls}
          >
            <option value="">— Inherit from collection —</option>
            {COLLECTION_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">Overrides your collection's primary category in the Vitrine discovery directory.</p>
        </div>
      </div>

      {canEdit && <SaveBar saving={saving} onCancel={() => router.push('/dashboard')} />}
    </>
  )
}
