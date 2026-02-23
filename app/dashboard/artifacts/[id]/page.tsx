'use client'

import ImageUpload from '@/components/ImageUpload'
import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

const MEDIUMS = ['Oil on canvas','Watercolour','Sculpture','Photography','Ceramics','Textiles','Metalwork','Mixed media','Wood','Glass','Print']
const STATUSES = ['Entry','On Display','Storage','On Loan','Restoration','Deaccessioned']
const EMOJIS = ['🖼️','🏺','🗿','💎','📜','👗','🏮','🗡️','🪞','🧣','⚗️','🌿','📷','🎨']
const OBJECT_TYPES = ['Painting','Drawing','Print','Photograph','Sculpture','Ceramic','Textile','Furniture','Metalwork','Glass','Archaeological','Natural History','Document / Archive','Other']
const ACQ_METHODS = ['Purchase','Gift','Bequest','Transfer','Found','Fieldwork','Exchange','Unknown']
const CONDITION_GRADES = ['Excellent','Good','Fair','Poor','Critical']
const TREATMENT_TYPES = ['Cleaning','Stabilisation','Restoration','Rehousing','Examination','Other']
const COPYRIGHT_OPTIONS = ['In Copyright','Out of Copyright','Public Domain','Unknown','CC BY','CC BY-SA','CC BY-NC']
const DISPOSAL_METHODS = ['Sale','Transfer','Destruction','Return to Owner','Exchange','Unknown']
const LOCATION_REASONS = ['Display change','Conservation','Loan','Inventory','Security','Other']
const TITLE_GUARANTEE_OPTIONS = ['Deed of Gift','Bill of Sale','Transfer document','Found in collection','Unknown','Other']
const INSURANCE_TYPES = ['Own policy','Borrower\'s policy','Government Indemnity Scheme','None']
const INVENTORY_OUTCOMES = ['Present and correct','Present — location differs','Not found','Found in collection','No prior record']

const ENTRY_REASONS = ['Potential acquisition', 'Loan in', 'Enquiry', 'Return from loan', 'Found in collection']
const ENTRY_OUTCOMES = ['Pending', 'Acquired', 'Returned to depositor', 'Transferred to loan', 'Disposed']

const CONDITION_STYLES: Record<string, string> = {
  'Excellent': 'bg-emerald-50 text-emerald-700',
  'Good':      'bg-green-50 text-green-700',
  'Fair':      'bg-amber-50 text-amber-700',
  'Poor':      'bg-orange-50 text-orange-700',
  'Critical':  'bg-red-50 text-red-600',
}

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'entry',        label: 'Object Entry' },
  { id: 'acquisition',  label: 'Acquisition' },
  { id: 'location',     label: 'Location' },
  { id: 'condition',    label: 'Condition' },
  { id: 'conservation', label: 'Conservation' },
  { id: 'loans',        label: 'Loans' },
  { id: 'rights',       label: 'Rights & Legal' },
  { id: 'audit',        label: 'Audit' },
]

const SIMPLE_TABS = ['overview', 'entry', 'location', 'condition']

const inputCls = 'w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors bg-white'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 mb-1.5'
const sectionTitle = 'text-xs uppercase tracking-widest text-stone-400 mb-4'

export default function ArtifactDetail() {
  const [artifact, setArtifact] = useState<any>(null)
  const [museum, setMuseum] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')

  // History data — lazy loaded per tab
  const [locationHistory, setLocationHistory] = useState<any[]>([])
  const [locationLoaded, setLocationLoaded] = useState(false)
  const [conditionHistory, setConditionHistory] = useState<any[]>([])
  const [conditionLoaded, setConditionLoaded] = useState(false)
  const [conservationHistory, setConservationHistory] = useState<any[]>([])
  const [conservationLoaded, setConservationLoaded] = useState(false)
  const [loanHistory, setLoanHistory] = useState<any[]>([])
  const [loanLoaded, setLoanLoaded] = useState(false)
  const [auditHistory, setAuditHistory] = useState<any[]>([])
  const [auditLoaded, setAuditLoaded] = useState(false)

  // Object Entry record
  const [entryRecord, setEntryRecord] = useState<any>(null)
  const [entryLoaded, setEntryLoaded] = useState(false)
  const [savingEntry, setSavingEntry] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [entryForm, setEntryForm] = useState<Record<string, any>>({
    entry_number: '', entry_date: '', depositor_name: '', depositor_contact: '',
    entry_reason: 'Potential acquisition', object_description: '', object_count: 1,
    legal_owner: '', terms_accepted: false, terms_accepted_date: '',
    liability_statement: '', receipt_issued: false, receipt_date: '',
    outcome: 'Pending', received_by: '', risk_notes: '', quarantine_required: false, notes: '',
  })

  // Inline add-record forms
  const [locationForm, setLocationForm] = useState({ location: '', reason: '', moved_by: '', authorised_by: '' })
  const [conditionForm, setConditionForm] = useState({ grade: '', assessed_at: '', assessor: '', notes: '' })
  const [conservationForm, setConservationForm] = useState({ treatment_type: '', conservator: '', start_date: '', end_date: '', description: '', outcome: '' })
  const [loanForm, setLoanForm] = useState({ direction: 'Out', borrowing_institution: '', contact_name: '', contact_email: '', loan_start_date: '', loan_end_date: '', purpose: '', conditions: '', insurance_value: '', notes: '', agreement_reference: '', agreement_signed_date: '', lender_object_ref: '', condition_arrival: '', insurance_type: '', loan_coordinator: '', approved_by: '' })
  const [auditForm, setAuditForm] = useState({ inventoried_at: new Date().toISOString().slice(0,10), inventoried_by: '', location_confirmed: '', condition_confirmed: '', inventory_outcome: '', action_required: '', action_completed: false, action_completed_date: '', discrepancy: '', notes: '' })

  const [form, setForm] = useState<Record<string, any>>({
    title: '', artist: '', year: '', medium: 'Oil on canvas', culture: '',
    accession_no: '', dimensions: '', description: '', emoji: '🖼️',
    status: 'On Display', image_url: '',
    // Cataloguing
    object_type: '', inscription: '', marks: '', provenance: '',
    // Acquisition
    acquisition_method: '', acquisition_date: '', acquisition_source: '',
    acquisition_note: '', legal_transfer_date: '',
    // Acquisition governance (Spectrum 2 mandatory)
    acquisition_source_contact: '', acquisition_authorised_by: '',
    acquisition_authority_date: '', acquisition_title_guarantee: '',
    acquisition_object_count: 1,
    accession_register_confirmed: false,
    // Ethics checks
    ethics_art_loss_register: false, ethics_cites: false,
    ethics_dealing_act: false, ethics_human_remains: false,
    // Location
    current_location: '', location_note: '',
    // Condition
    condition_grade: '', condition_date: '', condition_assessor: '',
    // Rights
    copyright_status: '', rights_holder: '',
    // Deaccession
    disposal_method: '', disposal_date: '', disposal_note: '',
    disposal_authorization: '', disposal_recipient: '',
    // Audit
    last_inventoried: '', inventoried_by: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: museum } = await supabase.from('museums').select('*').eq('owner_id', user.id).single()
      if (!museum) { router.push('/onboarding'); return }

      const { data: artifact } = await supabase
        .from('artifacts').select('*')
        .eq('id', params.id).eq('museum_id', museum.id).single()

      if (!artifact) { router.push('/dashboard'); return }

      setMuseum(museum)
      setArtifact(artifact)
      setForm({
        title: artifact.title || '',
        artist: artifact.artist || '',
        year: artifact.year || '',
        medium: artifact.medium || 'Oil on canvas',
        culture: artifact.culture || '',
        accession_no: artifact.accession_no || '',
        dimensions: artifact.dimensions || '',
        description: artifact.description || '',
        emoji: artifact.emoji || '🖼️',
        status: artifact.status || 'On Display',
        image_url: artifact.image_url || '',
        object_type: artifact.object_type || '',
        inscription: artifact.inscription || '',
        marks: artifact.marks || '',
        provenance: artifact.provenance || '',
        acquisition_method: artifact.acquisition_method || '',
        acquisition_date: artifact.acquisition_date || '',
        acquisition_source: artifact.acquisition_source || '',
        acquisition_note: artifact.acquisition_note || '',
        legal_transfer_date: artifact.legal_transfer_date || '',
        acquisition_source_contact: artifact.acquisition_source_contact || '',
        acquisition_authorised_by: artifact.acquisition_authorised_by || '',
        acquisition_authority_date: artifact.acquisition_authority_date || '',
        acquisition_title_guarantee: artifact.acquisition_title_guarantee || '',
        acquisition_object_count: artifact.acquisition_object_count ?? 1,
        accession_register_confirmed: artifact.accession_register_confirmed ?? false,
        ethics_art_loss_register: artifact.ethics_art_loss_register ?? false,
        ethics_cites: artifact.ethics_cites ?? false,
        ethics_dealing_act: artifact.ethics_dealing_act ?? false,
        ethics_human_remains: artifact.ethics_human_remains ?? false,
        current_location: artifact.current_location || '',
        location_note: artifact.location_note || '',
        condition_grade: artifact.condition_grade || '',
        condition_date: artifact.condition_date || '',
        condition_assessor: artifact.condition_assessor || '',
        copyright_status: artifact.copyright_status || '',
        rights_holder: artifact.rights_holder || '',
        disposal_method: artifact.disposal_method || '',
        disposal_date: artifact.disposal_date || '',
        disposal_note: artifact.disposal_note || '',
        disposal_authorization: artifact.disposal_authorization || '',
        disposal_recipient: artifact.disposal_recipient || '',
        last_inventoried: artifact.last_inventoried || '',
        inventoried_by: artifact.inventoried_by || '',
      })
      setLoading(false)
    }
    load()
  }, [])

  // Lazy load history per tab
  useEffect(() => {
    if (!artifact) return
    if (activeTab === 'location' && !locationLoaded) {
      supabase.from('location_history').select('*').eq('artifact_id', artifact.id).order('moved_at', { ascending: false })
        .then(({ data }) => { setLocationHistory(data || []); setLocationLoaded(true) })
    }
    if (activeTab === 'condition' && !conditionLoaded) {
      supabase.from('condition_assessments').select('*').eq('artifact_id', artifact.id).order('assessed_at', { ascending: false })
        .then(({ data }) => { setConditionHistory(data || []); setConditionLoaded(true) })
    }
    if (activeTab === 'conservation' && !conservationLoaded) {
      supabase.from('conservation_treatments').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
        .then(({ data }) => { setConservationHistory(data || []); setConservationLoaded(true) })
    }
    if (activeTab === 'loans' && !loanLoaded) {
      supabase.from('loans').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
        .then(({ data }) => { setLoanHistory(data || []); setLoanLoaded(true) })
    }
    if (activeTab === 'audit' && !auditLoaded) {
      supabase.from('audit_records').select('*').eq('artifact_id', artifact.id).order('inventoried_at', { ascending: false })
        .then(({ data }) => { setAuditHistory(data || []); setAuditLoaded(true) })
    }
    if (activeTab === 'entry' && !entryLoaded) {
      supabase.from('entry_records').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false }).limit(1)
        .then(({ data }) => {
          const record = data?.[0] || null
          setEntryRecord(record)
          if (record) {
            setEntryForm({
              entry_number: record.entry_number || '',
              entry_date: record.entry_date || '',
              depositor_name: record.depositor_name || '',
              depositor_contact: record.depositor_contact || '',
              entry_reason: record.entry_reason || 'Potential acquisition',
              object_description: record.object_description || '',
              object_count: record.object_count || 1,
              legal_owner: record.legal_owner || '',
              terms_accepted: record.terms_accepted || false,
              terms_accepted_date: record.terms_accepted_date || '',
              liability_statement: record.liability_statement || '',
              receipt_issued: record.receipt_issued || false,
              receipt_date: record.receipt_date || '',
              outcome: record.outcome || 'Pending',
              received_by: record.received_by || '',
              risk_notes: record.risk_notes || '',
              quarantine_required: record.quarantine_required || false,
              notes: record.notes || '',
            })
          }
          setEntryLoaded(true)
        })
    }
  }, [activeTab, artifact])

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    const { error } = await supabase.from('artifacts').update({
      ...form,
      acquisition_date: form.acquisition_date || null,
      legal_transfer_date: form.legal_transfer_date || null,
      acquisition_authority_date: form.acquisition_authority_date || null,
      acquisition_object_count: form.acquisition_object_count ? parseInt(form.acquisition_object_count) : 1,
      condition_date: form.condition_date || null,
      disposal_date: form.disposal_date || null,
      last_inventoried: form.last_inventoried || null,
    }).eq('id', params.id)

    if (error) { setError(error.message) } else { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!artifact) return
    if (!confirm('Delete "' + artifact.title + '"? This cannot be undone.')) return
    setDeleting(true)
    const { error } = await supabase.from('artifacts').delete().eq('id', params.id)
    if (error) { setError(error.message); setDeleting(false) } else { router.push('/dashboard') }
  }

  function setE(field: string, value: any) {
    setEntryForm(f => ({ ...f, [field]: value }))
  }

  async function saveEntry() {
    if (!entryRecord) return
    setSavingEntry(true)
    await supabase.from('entry_records').update({
      entry_number: entryForm.entry_number || entryRecord.entry_number,
      entry_date: entryForm.entry_date,
      depositor_name: entryForm.depositor_name,
      depositor_contact: entryForm.depositor_contact || null,
      entry_reason: entryForm.entry_reason,
      object_description: entryForm.object_description,
      object_count: entryForm.object_count,
      legal_owner: entryForm.legal_owner || null,
      terms_accepted: entryForm.terms_accepted,
      terms_accepted_date: entryForm.terms_accepted ? (entryForm.terms_accepted_date || today) : null,
      liability_statement: entryForm.liability_statement || null,
      receipt_issued: entryForm.receipt_issued,
      receipt_date: entryForm.receipt_issued ? (entryForm.receipt_date || today) : null,
      outcome: entryForm.outcome,
      received_by: entryForm.received_by,
      risk_notes: entryForm.risk_notes || null,
      quarantine_required: entryForm.quarantine_required,
      notes: entryForm.notes || null,
    }).eq('id', entryRecord.id)
    setSavingEntry(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Location history
  async function addLocation() {
    if (!locationForm.location) return
    await supabase.from('location_history').insert({ ...locationForm, artifact_id: artifact.id, museum_id: museum.id })
    await supabase.from('artifacts').update({ current_location: locationForm.location }).eq('id', artifact.id)
    setForm(f => ({ ...f, current_location: locationForm.location }))
    setLocationForm({ location: '', reason: '', moved_by: '', authorised_by: '' })
    const { data } = await supabase.from('location_history').select('*').eq('artifact_id', artifact.id).order('moved_at', { ascending: false })
    setLocationHistory(data || [])
  }

  // Condition assessment
  async function addCondition() {
    if (!conditionForm.grade || !conditionForm.assessed_at) return
    await supabase.from('condition_assessments').insert({ ...conditionForm, artifact_id: artifact.id, museum_id: museum.id })
    await supabase.from('artifacts').update({ condition_grade: conditionForm.grade, condition_date: conditionForm.assessed_at, condition_assessor: conditionForm.assessor }).eq('id', artifact.id)
    setForm(f => ({ ...f, condition_grade: conditionForm.grade, condition_date: conditionForm.assessed_at, condition_assessor: conditionForm.assessor }))
    setConditionForm({ grade: '', assessed_at: '', assessor: '', notes: '' })
    const { data } = await supabase.from('condition_assessments').select('*').eq('artifact_id', artifact.id).order('assessed_at', { ascending: false })
    setConditionHistory(data || [])
  }

  // Conservation treatment
  async function addConservation() {
    if (!conservationForm.treatment_type) return
    await supabase.from('conservation_treatments').insert({ ...conservationForm, artifact_id: artifact.id, museum_id: museum.id, start_date: conservationForm.start_date || null, end_date: conservationForm.end_date || null })
    setConservationForm({ treatment_type: '', conservator: '', start_date: '', end_date: '', description: '', outcome: '' })
    const { data } = await supabase.from('conservation_treatments').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setConservationHistory(data || [])
  }

  async function updateConservationStatus(id: string, status: string) {
    await supabase.from('conservation_treatments').update({ status }).eq('id', id)
    setConservationHistory(h => h.map(t => t.id === id ? { ...t, status } : t))
  }

  // Loans
  async function addLoan() {
    if (!loanForm.borrowing_institution) return
    await supabase.from('loans').insert({ ...loanForm, artifact_id: artifact.id, museum_id: museum.id, loan_start_date: loanForm.loan_start_date || null, loan_end_date: loanForm.loan_end_date || null, insurance_value: loanForm.insurance_value ? parseFloat(loanForm.insurance_value) : null, agreement_signed_date: loanForm.agreement_signed_date || null, lender_object_ref: loanForm.direction === 'In' ? (loanForm.lender_object_ref || null) : null })
    await supabase.from('artifacts').update({ status: 'On Loan' }).eq('id', artifact.id)
    setForm(f => ({ ...f, status: 'On Loan' }))
    setLoanForm({ direction: 'Out', borrowing_institution: '', contact_name: '', contact_email: '', loan_start_date: '', loan_end_date: '', purpose: '', conditions: '', insurance_value: '', notes: '', agreement_reference: '', agreement_signed_date: '', lender_object_ref: '', condition_arrival: '', insurance_type: '', loan_coordinator: '', approved_by: '' })
    const { data } = await supabase.from('loans').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setLoanHistory(data || [])
    router.refresh()
  }

  const [endingLoanId, setEndingLoanId] = useState<string | null>(null)
  const [returnLocation, setReturnLocation] = useState('')
  const [returnCondition, setReturnCondition] = useState('')

  function promptEndLoan(loanId: string) {
    setEndingLoanId(loanId)
    setReturnLocation(form.current_location || '')
    setReturnCondition('')
  }

  async function confirmEndLoan(loanId: string) {
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('loans').update({ status: 'Returned', condition_return: returnCondition || null, return_confirmed: true, return_confirmed_date: today }).eq('id', loanId)
    await supabase.from('artifacts').update({ status: 'Storage', current_location: returnLocation }).eq('id', artifact.id)
    if (returnLocation) {
      await supabase.from('location_history').insert({
        artifact_id: artifact.id, museum_id: museum.id,
        location: returnLocation, reason: 'Loan', moved_by: '',
      })
      if (locationLoaded) {
        const { data } = await supabase.from('location_history').select('*').eq('artifact_id', artifact.id).order('moved_at', { ascending: false })
        setLocationHistory(data || [])
      }
    }
    setForm(f => ({ ...f, status: 'Storage', current_location: returnLocation }))
    setLoanHistory(h => h.map(l => l.id === loanId ? { ...l, status: 'Returned' } : l))
    setEndingLoanId(null)
    router.refresh()
  }

  // Audit
  async function addAudit() {
    if (!auditForm.inventoried_at) return
    await supabase.from('audit_records').insert({
      ...auditForm,
      artifact_id: artifact.id, museum_id: museum.id,
      action_completed_date: auditForm.action_completed && auditForm.action_completed_date ? auditForm.action_completed_date : null,
    })
    await supabase.from('artifacts').update({ last_inventoried: auditForm.inventoried_at, inventoried_by: auditForm.inventoried_by }).eq('id', artifact.id)
    setForm(f => ({ ...f, last_inventoried: auditForm.inventoried_at, inventoried_by: auditForm.inventoried_by }))
    setAuditForm({ inventoried_at: new Date().toISOString().slice(0,10), inventoried_by: '', location_confirmed: '', condition_confirmed: '', inventory_outcome: '', action_required: '', action_completed: false, action_completed_date: '', discrepancy: '', notes: '' })
    const { data } = await supabase.from('audit_records').select('*').eq('artifact_id', artifact.id).order('inventoried_at', { ascending: false })
    setAuditHistory(data || [])
  }

  if (loading || !artifact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="font-mono text-sm text-stone-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">

      <aside className="w-56 bg-white border-r border-stone-200 flex flex-col fixed top-0 left-0 bottom-0">
        <div className="p-5 border-b border-stone-200">
          <span className="font-serif text-xl italic text-stone-900">Vitrine<span className="text-amber-600">.</span></span>
        </div>
        <nav className="p-3 flex-1">
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2">Collections</div>
          <div onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50">
            <span>⬡</span> Objects
          </div>
        </nav>
      </aside>

      <main className="ml-56 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors">
              ← Collection
            </button>
            <span className="text-stone-200">/</span>
            <span className="font-serif text-lg italic text-stone-900">{artifact.title}</span>
          </div>
          <div className="flex items-center gap-4">
            {saved && <span className="text-xs font-mono text-emerald-600">✓ Saved</span>}
            {error && <span className="text-xs font-mono text-red-500">{error}</span>}
            <button onClick={handleDelete} disabled={deleting}
              className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Delete object'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-stone-200 px-8 flex gap-1 overflow-x-auto">
          {(museum?.ui_mode === 'simple' ? TABS.filter(t => SIMPLE_TABS.includes(t.id)) : TABS).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="p-8 max-w-3xl space-y-6">

          {/* ── OVERVIEW ─────────────────────────────────── */}
          {activeTab === 'overview' && <>
            <div className="bg-white border border-stone-200 rounded-lg p-6">
              <ImageUpload currentUrl={form.image_url} onUpload={(url) => set('image_url', url)} />
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6">
              <label className={labelCls}>Icon</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => set('emoji', e)}
                    className={`w-10 h-10 rounded-lg border text-xl transition-all ${form.emoji === e ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:bg-stone-50'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
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
                    <option value="">— Select —</option>
                    {OBJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Current Location</label><input value={form.current_location} onChange={e => set('current_location', e.target.value)} placeholder="Gallery A, Case 3" className={inputCls} /></div>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map(s => (
                    <button key={s} type="button" onClick={() => set('status', s)}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${form.status === s ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Description (public)</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>

              <div>
                <label className={labelCls}>Inscription</label>
                <textarea value={form.inscription} onChange={e => set('inscription', e.target.value)} rows={2}
                  placeholder="Text inscribed on the object…"
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>

              <div>
                <label className={labelCls}>Marks & Stamps</label>
                <textarea value={form.marks} onChange={e => set('marks', e.target.value)} rows={2}
                  placeholder="Hallmarks, maker's marks, stamps, signatures on reverse…"
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>

              <div>
                <label className={labelCls}>Provenance</label>
                <textarea value={form.provenance} onChange={e => set('provenance', e.target.value)} rows={3}
                  placeholder="Known ownership history prior to acquisition…"
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>
            </div>

            <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />
          </>}

          {/* ── OBJECT ENTRY ─────────────────────────────── */}
          {activeTab === 'entry' && <>
            {!entryLoaded ? (
              <div className="bg-white border border-stone-200 rounded-lg p-8 text-center">
                <p className="text-sm font-mono text-stone-400">Loading…</p>
              </div>
            ) : !entryRecord ? (
              <div className="bg-white border border-stone-200 rounded-lg p-8 text-center">
                <div className="text-4xl mb-3">🗂</div>
                <div className="text-sm font-medium text-stone-700 mb-1">No entry record linked</div>
                <p className="text-xs text-stone-400">This object was added directly to the collection. Entry records are created in the Object Entry Register.</p>
              </div>
            ) : (
              <>
                <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
                  <div className={sectionTitle}>Entry Record — {entryRecord.entry_number}</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Entry Number</label>
                      <input type="text" value={entryForm.entry_number} onChange={e => setE('entry_number', e.target.value)} className={`${inputCls} font-mono`} />
                    </div>
                    <div>
                      <label className={labelCls}>Entry Date</label>
                      <input type="date" value={entryForm.entry_date} onChange={e => setE('entry_date', e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Entry Reason</label>
                      <select value={entryForm.entry_reason} onChange={e => setE('entry_reason', e.target.value)} className={inputCls}>
                        {ENTRY_REASONS.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Outcome</label>
                      <select value={entryForm.outcome} onChange={e => setE('outcome', e.target.value)} className={inputCls}>
                        {ENTRY_OUTCOMES.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Number of Objects</label>
                      <input type="number" min={1} value={entryForm.object_count} onChange={e => setE('object_count', parseInt(e.target.value) || 1)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Received By</label>
                      <input type="text" value={entryForm.received_by} onChange={e => setE('received_by', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
                  <div className={sectionTitle}>Depositor</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Depositor Name</label>
                      <input type="text" value={entryForm.depositor_name} onChange={e => setE('depositor_name', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Depositor Contact</label>
                      <input type="text" value={entryForm.depositor_contact} onChange={e => setE('depositor_contact', e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Legal Owner / Title Holder</label>
                      <input type="text" value={entryForm.legal_owner} onChange={e => setE('legal_owner', e.target.value)} className={inputCls} placeholder="If different from depositor" />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Object Description</label>
                    <textarea rows={3} value={entryForm.object_description} onChange={e => setE('object_description', e.target.value)} className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Liability Statement</label>
                    <textarea rows={2} value={entryForm.liability_statement} onChange={e => setE('liability_statement', e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
                  <div className={sectionTitle}>Receipt & Terms</div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="e_terms" checked={entryForm.terms_accepted} onChange={e => setE('terms_accepted', e.target.checked)} className="w-4 h-4 rounded border-stone-300" />
                        <label htmlFor="e_terms" className="text-sm text-stone-700">Terms &amp; conditions accepted</label>
                      </div>
                      {entryForm.terms_accepted && (
                        <div>
                          <label className={labelCls}>Date accepted</label>
                          <input type="date" value={entryForm.terms_accepted_date} onChange={e => setE('terms_accepted_date', e.target.value)} className={inputCls} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="e_receipt" checked={entryForm.receipt_issued} onChange={e => setE('receipt_issued', e.target.checked)} className="w-4 h-4 rounded border-stone-300" />
                        <label htmlFor="e_receipt" className="text-sm text-stone-700">Receipt issued to depositor</label>
                      </div>
                      {entryForm.receipt_issued && (
                        <div>
                          <label className={labelCls}>Receipt date</label>
                          <input type="date" value={entryForm.receipt_date} onChange={e => setE('receipt_date', e.target.value)} className={inputCls} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
                  <div className={sectionTitle}>Risk</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Risk Notes</label>
                      <textarea rows={2} value={entryForm.risk_notes} onChange={e => setE('risk_notes', e.target.value)} className={inputCls} placeholder="Pest, hazardous materials, fragility…" />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input type="checkbox" id="e_quarantine" checked={entryForm.quarantine_required} onChange={e => setE('quarantine_required', e.target.checked)} className="w-4 h-4 rounded border-stone-300" />
                      <label htmlFor="e_quarantine" className="text-sm text-stone-700">Quarantine required</label>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Notes</label>
                    <textarea rows={2} value={entryForm.notes} onChange={e => setE('notes', e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <button type="button" onClick={saveEntry} disabled={savingEntry}
                    className="bg-stone-900 text-white text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
                    {savingEntry ? 'Saving…' : 'Save entry record →'}
                  </button>
                  {saved && <span className="text-xs font-mono text-emerald-600">✓ Saved</span>}
                </div>
              </>
            )}
          </>}

          {/* ── ACQUISITION ──────────────────────────────── */}
          {activeTab === 'acquisition' && <>
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Acquisition (Spectrum Procedure 2)</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Acquisition Method</label>
                  <select value={form.acquisition_method} onChange={e => set('acquisition_method', e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {ACQ_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Acquisition Date</label><input type="date" value={form.acquisition_date} onChange={e => set('acquisition_date', e.target.value)} className={inputCls} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Acquisition Source</label><input value={form.acquisition_source} onChange={e => set('acquisition_source', e.target.value)} placeholder="Donor name, auction house…" className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Legal Transfer Date</label>
                  <input type="date" value={form.legal_transfer_date} onChange={e => set('legal_transfer_date', e.target.value)} className={inputCls} />
                  <p className="text-xs text-stone-400 mt-1">The date legal title formally passed to the museum</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Acquisition Notes</label>
                <textarea value={form.acquisition_note} onChange={e => set('acquisition_note', e.target.value)} rows={4}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Governance (Spectrum 2 — Mandatory)</div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Source Contact Details</label><input value={form.acquisition_source_contact} onChange={e => set('acquisition_source_contact', e.target.value)} placeholder="Email, phone or address of donor / vendor" className={inputCls} /></div>
                <div><label className={labelCls}>Authorised By</label><input value={form.acquisition_authorised_by} onChange={e => set('acquisition_authorised_by', e.target.value)} placeholder="Name and role of authorising person or body" className={inputCls} /></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Authority Date</label>
                  <input type="date" value={form.acquisition_authority_date} onChange={e => set('acquisition_authority_date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Title / Legal Basis</label>
                  <select value={form.acquisition_title_guarantee} onChange={e => set('acquisition_title_guarantee', e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {TITLE_GUARANTEE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Number of Objects</label>
                  <input type="number" min={1} value={form.acquisition_object_count} onChange={e => set('acquisition_object_count', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input type="checkbox" id="accession_confirmed" checked={!!form.accession_register_confirmed} onChange={e => set('accession_register_confirmed', e.target.checked)} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                <label htmlFor="accession_confirmed" className="text-sm text-stone-700">Formally entered in accession register</label>
                {form.accession_register_confirmed && <span className="text-xs font-mono text-emerald-600">✓ Confirmed</span>}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-3">
              <div className={sectionTitle}>Legal & Ethics Checks (Spectrum 2 — Mandatory)</div>
              <p className="text-xs text-stone-400 -mt-2">Tick each check once completed. All must be considered for acquisitions made after 2005.</p>

              {[
                { field: 'ethics_art_loss_register', label: 'Art Loss Register — checked that object is not listed as stolen' },
                { field: 'ethics_cites', label: 'CITES — no endangered species materials (ivory, tortoiseshell, feathers, etc.)' },
                { field: 'ethics_dealing_act', label: 'Dealing in Cultural Objects (Offences) Act 2003 — checked country of origin' },
                { field: 'ethics_human_remains', label: 'Human Remains — guidance followed if object contains human material' },
              ].map(({ field, label }) => (
                <div key={field} className="flex items-center gap-3">
                  <input type="checkbox" id={field} checked={!!form[field]} onChange={e => set(field, e.target.checked)} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                  <label htmlFor={field} className="text-sm text-stone-700">{label}</label>
                </div>
              ))}
            </div>

            <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />
          </>}

          {/* ── LOCATION ─────────────────────────────────── */}
          {activeTab === 'location' && <>
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Current Location (Spectrum Procedure 3)</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Current Location</label><input value={form.current_location} onChange={e => set('current_location', e.target.value)} placeholder="Gallery A, Case 3" className={inputCls} /></div>
                <div><label className={labelCls}>Location Note</label><input value={form.location_note} onChange={e => set('location_note', e.target.value)} placeholder="Additional context" className={inputCls} /></div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Record a Movement</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>New Location *</label><input value={locationForm.location} onChange={e => setLocationForm(f => ({ ...f, location: e.target.value }))} placeholder="Gallery B, Case 1" className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Reason</label>
                  <select value={locationForm.reason} onChange={e => setLocationForm(f => ({ ...f, reason: e.target.value }))} className={inputCls}>
                    <option value="">— Select —</option>
                    {LOCATION_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Moved By</label><input value={locationForm.moved_by} onChange={e => setLocationForm(f => ({ ...f, moved_by: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Authorised By</label><input value={locationForm.authorised_by} onChange={e => setLocationForm(f => ({ ...f, authorised_by: e.target.value }))} placeholder="Staff member or governing body" className={inputCls} /></div>
              </div>
              <button type="button" onClick={addLocation}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-50">
                Save movement →
              </button>
            </div>

            {locationLoaded && locationHistory.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100"><div className={sectionTitle} style={{marginBottom:0}}>Movement History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-6 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Location</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Reason</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Moved By</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Authorised By</th>
                  </tr></thead>
                  <tbody>
                    {locationHistory.map(h => (
                      <tr key={h.id} className="border-b border-stone-100">
                        <td className="px-6 py-3 text-xs font-mono text-stone-500">{new Date(h.moved_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-sm text-stone-900">{h.location}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">{h.reason}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">{h.moved_by}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">{h.authorised_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />
          </>}

          {/* ── CONDITION ────────────────────────────────── */}
          {activeTab === 'condition' && <>
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Log Condition Assessment (Spectrum Procedure 4)</div>
              <div>
                <label className={labelCls}>Condition Grade *</label>
                <div className="flex gap-2 flex-wrap">
                  {CONDITION_GRADES.map(g => (
                    <button key={g} type="button" onClick={() => setConditionForm(f => ({ ...f, grade: g }))}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${conditionForm.grade === g ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Assessment Date *</label><input type="date" value={conditionForm.assessed_at} onChange={e => setConditionForm(f => ({ ...f, assessed_at: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Assessor</label><input value={conditionForm.assessor} onChange={e => setConditionForm(f => ({ ...f, assessor: e.target.value }))} className={inputCls} /></div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={conditionForm.notes} onChange={e => setConditionForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>
              <button type="button" onClick={addCondition}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded">
                Log assessment →
              </button>
            </div>

            {form.condition_grade && (
              <div className="bg-white border border-stone-200 rounded-lg p-6">
                <div className={sectionTitle}>Current Condition (snapshot)</div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[form.condition_grade] || 'bg-stone-100 text-stone-500'}`}>{form.condition_grade}</span>
                  {form.condition_date && <span className="text-xs text-stone-400">Assessed {new Date(form.condition_date).toLocaleDateString('en-GB')}</span>}
                  {form.condition_assessor && <span className="text-xs text-stone-400">by {form.condition_assessor}</span>}
                </div>
              </div>
            )}

            {conditionLoaded && conditionHistory.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100"><div className={sectionTitle} style={{marginBottom:0}}>Assessment History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-6 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Grade</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Assessor</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Notes</th>
                  </tr></thead>
                  <tbody>
                    {conditionHistory.map(h => (
                      <tr key={h.id} className="border-b border-stone-100">
                        <td className="px-6 py-3 text-xs font-mono text-stone-500">{new Date(h.assessed_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[h.grade] || 'bg-stone-100 text-stone-500'}`}>{h.grade}</span></td>
                        <td className="px-4 py-3 text-xs text-stone-500">{h.assessor}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">{h.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>}

          {/* ── CONSERVATION ─────────────────────────────── */}
          {activeTab === 'conservation' && <>
            {form.status !== 'Restoration' && conservationHistory.some(t => t.status === 'Active') && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                This object has an active treatment — consider setting status to <strong>Restoration</strong> on the Overview tab.
              </div>
            )}

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Add Conservation Treatment (Spectrum Procedure 5)</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Treatment Type *</label>
                  <select value={conservationForm.treatment_type} onChange={e => setConservationForm(f => ({ ...f, treatment_type: e.target.value }))} className={inputCls}>
                    <option value="">— Select —</option>
                    {TREATMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Conservator</label><input value={conservationForm.conservator} onChange={e => setConservationForm(f => ({ ...f, conservator: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Start Date</label><input type="date" value={conservationForm.start_date} onChange={e => setConservationForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>End Date (leave blank if ongoing)</label><input type="date" value={conservationForm.end_date} onChange={e => setConservationForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} /></div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={conservationForm.description} onChange={e => setConservationForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>
              <button type="button" onClick={addConservation}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded">
                Save treatment →
              </button>
            </div>

            {conservationLoaded && conservationHistory.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100"><div className={sectionTitle} style={{marginBottom:0}}>Treatment History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-6 py-3">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Conservator</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Dates</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {conservationHistory.map(t => (
                      <tr key={t.id} className="border-b border-stone-100">
                        <td className="px-6 py-3 text-sm text-stone-900">{t.treatment_type}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">{t.conservator}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500">
                          {t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB') : '—'}
                          {' → '}
                          {t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : <span className="text-amber-600">Ongoing</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${t.status === 'Active' ? 'bg-amber-50 text-amber-700' : t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{t.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {t.status === 'Active' && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => updateConservationStatus(t.id, 'Completed')} className="text-xs font-mono text-stone-400 hover:text-emerald-700">Complete</button>
                              <button type="button" onClick={() => updateConservationStatus(t.id, 'Cancelled')} className="text-xs font-mono text-stone-400 hover:text-red-500">Cancel</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>}

          {/* ── LOANS ────────────────────────────────────── */}
          {activeTab === 'loans' && <>
            {form.status === 'On Loan' && loanHistory.some(l => l.status === 'Active') && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                This object is currently on loan — the active loan record is highlighted below.
              </div>
            )}

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Add Loan Record (Spectrum Procedures 4 & 5)</div>
              <div>
                <label className={labelCls}>Direction</label>
                <div className="flex gap-2">
                  {['Out','In'].map(d => (
                    <button key={d} type="button" onClick={() => setLoanForm(f => ({ ...f, direction: d }))}
                      className={`px-4 py-1.5 rounded text-xs font-mono border transition-all ${loanForm.direction === d ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
                      Loan {d}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-1">{loanForm.direction === 'Out' ? 'We lend this object to another institution' : 'Another institution lends this object to us'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Institution *</label><input value={loanForm.borrowing_institution} onChange={e => setLoanForm(f => ({ ...f, borrowing_institution: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Contact Name</label><input value={loanForm.contact_name} onChange={e => setLoanForm(f => ({ ...f, contact_name: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Contact Email</label><input type="email" value={loanForm.contact_email} onChange={e => setLoanForm(f => ({ ...f, contact_email: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Insurance Value (£)</label><input type="number" value={loanForm.insurance_value} onChange={e => setLoanForm(f => ({ ...f, insurance_value: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Loan Start</label><input type="date" value={loanForm.loan_start_date} onChange={e => setLoanForm(f => ({ ...f, loan_start_date: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Expected Return</label><input type="date" value={loanForm.loan_end_date} onChange={e => setLoanForm(f => ({ ...f, loan_end_date: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Agreement Reference</label><input value={loanForm.agreement_reference} onChange={e => setLoanForm(f => ({ ...f, agreement_reference: e.target.value }))} placeholder="Loan agreement document ref" className={inputCls} /></div>
                <div><label className={labelCls}>Agreement Signed Date</label><input type="date" value={loanForm.agreement_signed_date} onChange={e => setLoanForm(f => ({ ...f, agreement_signed_date: e.target.value }))} className={inputCls} /></div>
              </div>
              {loanForm.direction === 'In' && (
                <div><label className={labelCls}>Lender's Object Reference</label><input value={loanForm.lender_object_ref} onChange={e => setLoanForm(f => ({ ...f, lender_object_ref: e.target.value }))} placeholder="Lender's own catalogue or accession number" className={inputCls} /></div>
              )}
              <div>
                <label className={labelCls}>Insurance Type</label>
                <div className="flex gap-2 flex-wrap">
                  {INSURANCE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setLoanForm(f => ({ ...f, insurance_type: t }))}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${loanForm.insurance_type === t ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Loan Coordinator</label><input value={loanForm.loan_coordinator} onChange={e => setLoanForm(f => ({ ...f, loan_coordinator: e.target.value }))} placeholder="Staff member managing this loan" className={inputCls} /></div>
                <div><label className={labelCls}>Approved By</label><input value={loanForm.approved_by} onChange={e => setLoanForm(f => ({ ...f, approved_by: e.target.value }))} placeholder="Authorising person or body" className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Condition at {loanForm.direction === 'In' ? 'Arrival' : 'Exit'}</label><textarea value={loanForm.condition_arrival} onChange={e => setLoanForm(f => ({ ...f, condition_arrival: e.target.value }))} rows={2} placeholder="Record condition when object left / arrived" className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" /></div>
              <div><label className={labelCls}>Special Conditions</label><textarea value={loanForm.conditions} onChange={e => setLoanForm(f => ({ ...f, conditions: e.target.value }))} rows={2} className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" /></div>
              <button type="button" onClick={addLoan}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded">
                Save loan record →
              </button>
            </div>

            {loanLoaded && loanHistory.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100"><div className={sectionTitle} style={{marginBottom:0}}>Loan History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-6 py-3">Direction</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Institution</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Dates</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {loanHistory.map(l => (
                      <Fragment key={l.id}>
                        <tr className={`border-b border-stone-100 ${l.status === 'Active' ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-6 py-3"><span className="text-xs font-mono px-2 py-1 rounded bg-stone-100 text-stone-600">Loan {l.direction}</span></td>
                          <td className="px-4 py-3 text-sm text-stone-900">{l.borrowing_institution}</td>
                          <td className="px-4 py-3 text-xs font-mono text-stone-500">
                            {l.loan_start_date ? new Date(l.loan_start_date).toLocaleDateString('en-GB') : '—'}
                            {' → '}
                            {l.loan_end_date ? new Date(l.loan_end_date).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-mono px-2 py-1 rounded-full ${l.status === 'Active' ? 'bg-amber-50 text-amber-700' : l.status === 'Returned' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{l.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {l.status === 'Active' && (
                              endingLoanId === l.id
                                ? <button type="button" onClick={() => setEndingLoanId(null)} className="text-xs font-mono text-stone-400 hover:text-stone-900">Cancel</button>
                                : <button type="button" onClick={() => promptEndLoan(l.id)} className="text-xs font-mono text-stone-400 hover:text-stone-900">End loan →</button>
                            )}
                          </td>
                        </tr>
                        {endingLoanId === l.id && (
                          <tr className="border-b border-stone-200 bg-stone-50">
                            <td colSpan={5} className="px-6 py-4 space-y-3">
                              <div className="text-xs uppercase tracking-widest text-stone-400">Confirm Return</div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-stone-400 mb-1">Return location</label>
                                  <input
                                    type="text"
                                    value={returnLocation}
                                    onChange={e => setReturnLocation(e.target.value)}
                                    placeholder="e.g. Gallery 3, Cabinet A"
                                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-stone-400 mb-1">Condition on return</label>
                                  <input
                                    type="text"
                                    value={returnCondition}
                                    onChange={e => setReturnCondition(e.target.value)}
                                    placeholder="e.g. Good — minor surface dust"
                                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors bg-white"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => confirmEndLoan(l.id)}
                                  className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded whitespace-nowrap"
                                >
                                  Confirm return
                                </button>
                                <p className="text-xs text-stone-400">Marks the loan returned, sets status to Storage, and logs a location change.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>}

          {/* ── RIGHTS & LEGAL ───────────────────────────── */}
          {activeTab === 'rights' && <>
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Rights Management (Spectrum Procedure 9)</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Copyright Status</label>
                  <select value={form.copyright_status} onChange={e => set('copyright_status', e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {COPYRIGHT_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Rights Holder</label><input value={form.rights_holder} onChange={e => set('rights_holder', e.target.value)} placeholder="Name of copyright owner" className={inputCls} /></div>
              </div>
            </div>

            {form.status === 'Deaccessioned' && (
              <div className="bg-white border border-amber-200 rounded-lg p-6 space-y-4">
                <div className="text-xs uppercase tracking-widest text-amber-600 mb-4">Deaccession Record (Spectrum Procedure 8)</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Disposal Method</label>
                    <select value={form.disposal_method} onChange={e => set('disposal_method', e.target.value)} className={inputCls}>
                      <option value="">— Select —</option>
                      {DISPOSAL_METHODS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Disposal Date</label><input type="date" value={form.disposal_date} onChange={e => set('disposal_date', e.target.value)} className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Authorised By</label><input value={form.disposal_authorization} onChange={e => set('disposal_authorization', e.target.value)} placeholder="Name and role of authorising person" className={inputCls} /></div>
                  <div><label className={labelCls}>Recipient</label><input value={form.disposal_recipient} onChange={e => set('disposal_recipient', e.target.value)} placeholder="Name of receiving party" className={inputCls} /></div>
                </div>
                <div>
                  <label className={labelCls}>Disposal Notes</label>
                  <textarea value={form.disposal_note} onChange={e => set('disposal_note', e.target.value)} rows={4}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
                </div>
              </div>
            )}

            <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />
          </>}

          {/* ── AUDIT ────────────────────────────────────── */}
          {activeTab === 'audit' && <>
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Record Inventory Check (Spectrum Procedure 7)</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Date *</label><input type="date" value={auditForm.inventoried_at} onChange={e => setAuditForm(f => ({ ...f, inventoried_at: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Inventoried By</label><input value={auditForm.inventoried_by} onChange={e => setAuditForm(f => ({ ...f, inventoried_by: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Location Confirmed</label><input value={auditForm.location_confirmed} onChange={e => setAuditForm(f => ({ ...f, location_confirmed: e.target.value }))} placeholder="Actual location found" className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Condition Confirmed</label>
                  <select value={auditForm.condition_confirmed} onChange={e => setAuditForm(f => ({ ...f, condition_confirmed: e.target.value }))} className={inputCls}>
                    <option value="">— Not assessed —</option>
                    {CONDITION_GRADES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Inventory Outcome *</label>
                <div className="flex gap-2 flex-wrap">
                  {INVENTORY_OUTCOMES.map(o => (
                    <button key={o} type="button" onClick={() => setAuditForm(f => ({ ...f, inventory_outcome: o }))}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${auditForm.inventory_outcome === o ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              {auditForm.inventory_outcome && auditForm.inventory_outcome !== 'Present and correct' && (
                <div className="space-y-3 border border-amber-200 rounded-lg p-4 bg-amber-50/30">
                  <div className="text-xs uppercase tracking-widest text-amber-600">Action Required</div>
                  <div>
                    <label className={labelCls}>Action Required</label>
                    <input value={auditForm.action_required} onChange={e => setAuditForm(f => ({ ...f, action_required: e.target.value }))} placeholder="Describe action needed (e.g. update location, further investigation)" className={inputCls} />
                  </div>
                  {auditForm.action_required && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="action_completed" checked={auditForm.action_completed} onChange={e => setAuditForm(f => ({ ...f, action_completed: e.target.checked }))} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                        <label htmlFor="action_completed" className="text-sm text-stone-700">Action completed</label>
                      </div>
                      {auditForm.action_completed && (
                        <div>
                          <label className={labelCls}>Completed Date</label>
                          <input type="date" value={auditForm.action_completed_date} onChange={e => setAuditForm(f => ({ ...f, action_completed_date: e.target.value }))} className={inputCls} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className={labelCls}>Discrepancy</label>
                <textarea value={auditForm.discrepancy} onChange={e => setAuditForm(f => ({ ...f, discrepancy: e.target.value }))} rows={2}
                  placeholder="Note any discrepancy from the catalogue record…"
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={auditForm.notes} onChange={e => setAuditForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none" />
              </div>
              <button type="button" onClick={addAudit}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded">
                Save audit record →
              </button>
            </div>

            {form.last_inventoried && (
              <div className="bg-white border border-stone-200 rounded-lg p-6">
                <div className={sectionTitle}>Last Inventoried</div>
                <p className="text-sm text-stone-900">{new Date(form.last_inventoried).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}{form.inventoried_by && ` by ${form.inventoried_by}`}</p>
              </div>
            )}

            {auditLoaded && auditHistory.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100"><div className={sectionTitle} style={{marginBottom:0}}>Audit History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-6 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">By</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Outcome</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Location Found</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Condition</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Action</th>
                  </tr></thead>
                  <tbody>
                    {auditHistory.map(h => (
                      <tr key={h.id} className="border-b border-stone-100">
                        <td className="px-6 py-3 text-xs font-mono text-stone-500">{new Date(h.inventoried_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">{h.inventoried_by}</td>
                        <td className="px-4 py-3">
                          {h.inventory_outcome && (
                            <span className={`text-xs font-mono px-2 py-1 rounded-full ${h.inventory_outcome === 'Present and correct' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{h.inventory_outcome}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500">{h.location_confirmed}</td>
                        <td className="px-4 py-3">{h.condition_confirmed && <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[h.condition_confirmed] || 'bg-stone-100 text-stone-500'}`}>{h.condition_confirmed}</span>}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">
                          {h.action_required && (
                            <span className={h.action_completed ? 'text-emerald-600 line-through' : 'text-amber-600'}>{h.action_required}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>}

        </form>
      </main>
    </div>
  )
}

function SaveBar({ saving, saved, onCancel }: { saving: boolean; saved: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-3 items-center">
      <button type="submit" disabled={saving}
        className="bg-stone-900 text-white text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
        {saving ? 'Saving…' : 'Save changes →'}
      </button>
      <button type="button" onClick={onCancel}
        className="border border-stone-200 text-stone-500 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50">
        Cancel
      </button>
      {saved && <span className="text-xs font-mono text-emerald-600">✓ Saved</span>}
    </div>
  )
}
