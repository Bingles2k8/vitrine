'use client'

import ImageUpload from '@/components/ImageUpload'
import ImageGallery from '@/components/ImageGallery'
import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getMuseumForUser } from '@/lib/get-museum'

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
  'Excellent': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Good':      'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  'Fair':      'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Poor':      'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  'Critical':  'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

const VALUATION_METHODS = ['Market value', 'Insurance value', 'Replacement cost', 'Expert opinion', 'Auction estimate']
const VALUATION_PURPOSES = ['Insurance', 'Sale', 'Estate', 'Grant', 'Other']
const CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY']

const EXIT_REASONS = ['Return to depositor', 'Outgoing loan', 'Transfer', 'Disposal', 'Conservation', 'Photography', 'Sale']
const TEMP_REASONS = new Set(['Outgoing loan', 'Conservation', 'Photography'])
const RISK_TYPES = ['Theft', 'Fire', 'Flood', 'Pest', 'Light damage', 'Handling damage', 'Environmental', 'Provenance', 'Legal', 'Other']
const RISK_SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
const RISK_LIKELIHOODS = ['Low', 'Medium', 'High']
const DAMAGE_TYPES = ['Accidental', 'Environmental', 'Theft', 'Vandalism', 'Pest', 'Handling', 'Transit', 'Unknown']
const DAMAGE_SEVERITIES = ['Minor', 'Moderate', 'Significant', 'Severe', 'Total Loss']

const RISK_SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  High:     'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Medium:   'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  Low:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
}

const DAMAGE_SEVERITY_STYLES: Record<string, string> = {
  'Total Loss':  'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  Severe:        'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  Significant:   'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Moderate:      'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  Minor:         'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
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
  { id: 'valuation',    label: 'Valuation' },
  { id: 'risk',         label: 'Risk' },
  { id: 'damage',       label: 'Damage' },
  { id: 'exits',        label: 'Exits' },
]

const SIMPLE_TABS = ['overview', 'entry', 'location', 'condition']

const inputCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5'
const sectionTitle = 'text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4'

export default function ArtifactDetail() {
  const [artifact, setArtifact] = useState<any>(null)
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
  const [valuations, setValuations] = useState<any[]>([])
  const [valuationsLoaded, setValuationsLoaded] = useState(false)
  const [valuationForm, setValuationForm] = useState({ value: '', currency: 'GBP', valuation_date: '', valuer: '', method: '', purpose: '', notes: '' })
  const [latestValuation, setLatestValuation] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [reproductionRequests, setReproductionRequests] = useState<any[]>([])
  const [reproductionRequestsLoaded, setReproductionRequestsLoaded] = useState(false)
  const [reproductionForm, setReproductionForm] = useState({ requester_name: '', requester_org: '', request_date: new Date().toISOString().slice(0, 10), purpose: '', status: 'Pending', decision_date: '', decision_by: '', notes: '' })

  // Risk
  const [riskHistory, setRiskHistory] = useState<any[]>([])
  const [riskLoaded, setRiskLoaded] = useState(false)
  const [riskForm, setRiskForm] = useState({ risk_type: '', description: '', severity: 'Medium', likelihood: 'Medium', mitigation: '', review_date: '', responsible_person: '', notes: '' })

  // Damage
  const [damageHistory, setDamageHistory] = useState<any[]>([])
  const [damageLoaded, setDamageLoaded] = useState(false)
  const [damageForm, setDamageForm] = useState({ incident_date: '', discovered_date: '', discovered_by: '', damage_type: 'Accidental', severity: 'Minor', description: '', cause: '', location_at_incident: '', repair_estimate: '', repair_currency: 'GBP', insurance_claim_ref: '', insurance_notified: false, action_taken: '', notes: '' })

  // Exits
  const [exitHistory, setExitHistory] = useState<any[]>([])
  const [exitLoaded, setExitLoaded] = useState(false)
  const [exitForm, setExitForm] = useState({ exit_date: new Date().toISOString().slice(0, 10), exit_reason: 'Return to depositor', recipient_name: '', recipient_contact: '', destination_address: '', exit_condition: '', signed_receipt: false, signed_receipt_date: '', expected_return_date: '', exit_authorised_by: '', notes: '' })

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

  // Locations (controlled vocabulary)
  const [locations, setLocations] = useState<any[]>([])
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [newLocation, setNewLocation] = useState({ name: '', building: '', floor: '', room: '', unit: '', position: '', location_type: 'Storage', environmental_notes: '' })

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
    copyright_status: '', rights_holder: '', rights_notes: '',
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
      setCurrentUserId(user.id)

      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result

      const { data: artifact } = await supabase
        .from('artifacts').select('*')
        .eq('id', params.id).eq('museum_id', museum.id).single()

      if (!artifact) { router.push('/dashboard'); return }

      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
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
        rights_notes: artifact.rights_notes || '',
        disposal_method: artifact.disposal_method || '',
        disposal_date: artifact.disposal_date || '',
        disposal_note: artifact.disposal_note || '',
        disposal_authorization: artifact.disposal_authorization || '',
        disposal_recipient: artifact.disposal_recipient || '',
        last_inventoried: artifact.last_inventoried || '',
        inventoried_by: artifact.inventoried_by || '',
        show_on_site: artifact.show_on_site ?? true,
      })
      const [{ data: lv }, { data: locs }] = await Promise.all([
        supabase.from('valuations').select('value, currency, valuation_date')
          .eq('artifact_id', artifact.id).order('valuation_date', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('locations').select('*').eq('museum_id', museum.id).eq('status', 'Active').order('name'),
      ])
      setLatestValuation(lv || null)
      setLocations(locs || [])
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
    if (activeTab === 'valuation' && !valuationsLoaded) {
      supabase.from('valuations').select('*').eq('artifact_id', artifact.id).order('valuation_date', { ascending: false })
        .then(({ data }) => { setValuations(data || []); setValuationsLoaded(true) })
    }
    if (activeTab === 'rights' && !reproductionRequestsLoaded) {
      supabase.from('reproduction_requests').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
        .then(({ data }) => { setReproductionRequests(data || []); setReproductionRequestsLoaded(true) })
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
    if (activeTab === 'risk' && !riskLoaded) {
      supabase.from('risk_register').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
        .then(({ data }) => { setRiskHistory(data || []); setRiskLoaded(true) })
    }
    if (activeTab === 'damage' && !damageLoaded) {
      supabase.from('damage_reports').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
        .then(({ data }) => { setDamageHistory(data || []); setDamageLoaded(true) })
    }
    if (activeTab === 'exits' && !exitLoaded) {
      supabase.from('object_exits').select('*').eq('artifact_id', artifact.id).order('exit_date', { ascending: false })
        .then(({ data }) => { setExitHistory(data || []); setExitLoaded(true) })
    }
  }, [activeTab, artifact])

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!isOwner && staffAccess !== 'Admin' && staffAccess !== 'Editor') return
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    // Exclude condition fields — they are only updated via addCondition() to prevent overwrites
    const { condition_grade, condition_date, condition_assessor, ...formToSave } = form
    const { error } = await supabase.from('artifacts').update({
      ...formToSave,
      acquisition_date: formToSave.acquisition_date || null,
      legal_transfer_date: formToSave.legal_transfer_date || null,
      acquisition_authority_date: formToSave.acquisition_authority_date || null,
      acquisition_object_count: formToSave.acquisition_object_count ? parseInt(formToSave.acquisition_object_count, 10) || 1 : 1,
      disposal_date: formToSave.disposal_date || null,
      last_inventoried: formToSave.last_inventoried || null,
    }).eq('id', params.id)

    if (error) { setError(error.message) } else {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
      logActivity('saved', `Updated "${form.title}"`)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!artifact || !canEdit) return
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
    const { error: entryError } = await supabase.from('entry_records').update({
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
    if (entryError) { setError(entryError.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Location history
  async function addLocation() {
    if (!locationForm.location || submitting) return
    setSubmitting(true)
    const { error: locErr } = await supabase.from('location_history').insert({ ...locationForm, artifact_id: artifact.id, museum_id: museum.id })
    if (locErr) { setError(locErr.message); setSubmitting(false); return }
    await supabase.from('artifacts').update({ current_location: locationForm.location }).eq('id', artifact.id)
    setForm(f => ({ ...f, current_location: locationForm.location }))
    setLocationForm({ location: '', reason: '', moved_by: '', authorised_by: '' })
    const { data } = await supabase.from('location_history').select('*').eq('artifact_id', artifact.id).order('moved_at', { ascending: false })
    setLocationHistory(data || [])
    logActivity('location_recorded', `Moved "${artifact.title}" to ${locationForm.location}`)
    setSubmitting(false)
  }

  // Condition assessment
  async function addCondition() {
    if (!conditionForm.grade || !conditionForm.assessed_at || submitting) return
    setSubmitting(true)
    const { error: condErr } = await supabase.from('condition_assessments').insert({ ...conditionForm, artifact_id: artifact.id, museum_id: museum.id })
    if (condErr) { setError(condErr.message); setSubmitting(false); return }
    await supabase.from('artifacts').update({ condition_grade: conditionForm.grade, condition_date: conditionForm.assessed_at, condition_assessor: conditionForm.assessor }).eq('id', artifact.id)
    setForm(f => ({ ...f, condition_grade: conditionForm.grade, condition_date: conditionForm.assessed_at, condition_assessor: conditionForm.assessor }))
    setConditionForm({ grade: '', assessed_at: '', assessor: '', notes: '' })
    const { data } = await supabase.from('condition_assessments').select('*').eq('artifact_id', artifact.id).order('assessed_at', { ascending: false })
    setConditionHistory(data || [])
    logActivity('condition_added', `Recorded condition "${conditionForm.grade}" for "${artifact.title}"`)
    setSubmitting(false)
  }

  // Conservation treatment
  async function addConservation() {
    if (!conservationForm.treatment_type || submitting) return
    setSubmitting(true)
    const { error: consErr } = await supabase.from('conservation_treatments').insert({ ...conservationForm, artifact_id: artifact.id, museum_id: museum.id, start_date: conservationForm.start_date || null, end_date: conservationForm.end_date || null })
    if (consErr) { setError(consErr.message); setSubmitting(false); return }
    setConservationForm({ treatment_type: '', conservator: '', start_date: '', end_date: '', description: '', outcome: '' })
    const { data } = await supabase.from('conservation_treatments').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setConservationHistory(data || [])
    logActivity('conservation_added', `Added ${conservationForm.treatment_type} treatment for "${artifact.title}"`)
    setSubmitting(false)
  }

  async function updateConservationStatus(id: string, status: string) {
    const { error } = await supabase.from('conservation_treatments').update({ status }).eq('id', id)
    if (error) { setError(error.message); return }
    setConservationHistory(h => h.map(t => t.id === id ? { ...t, status } : t))
  }

  // Loans
  async function addLoan() {
    if (!loanForm.borrowing_institution || submitting) return
    setSubmitting(true)
    const { error: loanErr } = await supabase.from('loans').insert({ ...loanForm, artifact_id: artifact.id, museum_id: museum.id, loan_start_date: loanForm.loan_start_date || null, loan_end_date: loanForm.loan_end_date || null, insurance_value: loanForm.insurance_value ? parseFloat(loanForm.insurance_value) : null, agreement_signed_date: loanForm.agreement_signed_date || null, lender_object_ref: loanForm.direction === 'In' ? (loanForm.lender_object_ref || null) : null })
    if (loanErr) { setError(loanErr.message); setSubmitting(false); return }
    await supabase.from('artifacts').update({ status: 'On Loan' }).eq('id', artifact.id)
    setForm(f => ({ ...f, status: 'On Loan' }))
    setLoanForm({ direction: 'Out', borrowing_institution: '', contact_name: '', contact_email: '', loan_start_date: '', loan_end_date: '', purpose: '', conditions: '', insurance_value: '', notes: '', agreement_reference: '', agreement_signed_date: '', lender_object_ref: '', condition_arrival: '', insurance_type: '', loan_coordinator: '', approved_by: '' })
    const { data } = await supabase.from('loans').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setLoanHistory(data || [])
    router.refresh()
    logActivity('loan_added', `Recorded loan for "${artifact.title}" to ${loanForm.borrowing_institution}`)
    setSubmitting(false)
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
    if (!auditForm.inventoried_at || submitting) return
    setSubmitting(true)
    const { error: auditErr } = await supabase.from('audit_records').insert({
      ...auditForm,
      artifact_id: artifact.id, museum_id: museum.id,
      action_completed_date: auditForm.action_completed && auditForm.action_completed_date ? auditForm.action_completed_date : null,
    })
    if (auditErr) { setError(auditErr.message); setSubmitting(false); return }
    await supabase.from('artifacts').update({ last_inventoried: auditForm.inventoried_at, inventoried_by: auditForm.inventoried_by }).eq('id', artifact.id)
    setForm(f => ({ ...f, last_inventoried: auditForm.inventoried_at, inventoried_by: auditForm.inventoried_by }))
    setAuditForm({ inventoried_at: new Date().toISOString().slice(0,10), inventoried_by: '', location_confirmed: '', condition_confirmed: '', inventory_outcome: '', action_required: '', action_completed: false, action_completed_date: '', discrepancy: '', notes: '' })
    const { data } = await supabase.from('audit_records').select('*').eq('artifact_id', artifact.id).order('inventoried_at', { ascending: false })
    setAuditHistory(data || [])
    logActivity('audit_recorded', `Audited "${artifact.title}"${auditForm.inventory_outcome ? ` — ${auditForm.inventory_outcome}` : ''}`)
    setSubmitting(false)
  }

  async function logActivity(actionType: string, description: string) {
    if (!museum || !artifact) return
    await supabase.from('activity_log').insert({
      museum_id: museum.id,
      artifact_id: artifact.id,
      user_id: currentUserId,
      user_name: isOwner ? 'Owner' : staffAccess || 'Staff',
      action_type: actionType,
      description,
    })
  }

  // Valuation
  async function addValuation() {
    if (!valuationForm.value || !valuationForm.valuation_date || submitting) return
    setSubmitting(true)
    const { error: valErr } = await supabase.from('valuations').insert({
      ...valuationForm,
      value: parseFloat(valuationForm.value),
      artifact_id: artifact.id,
      museum_id: museum.id,
    })
    if (valErr) { setError(valErr.message); setSubmitting(false); return }
    const lv = { value: valuationForm.value, currency: valuationForm.currency, valuation_date: valuationForm.valuation_date }
    setLatestValuation(lv)
    setValuationForm({ value: '', currency: 'GBP', valuation_date: '', valuer: '', method: '', purpose: '', notes: '' })
    const { data } = await supabase.from('valuations').select('*').eq('artifact_id', artifact.id).order('valuation_date', { ascending: false })
    setValuations(data || [])
    logActivity('valuation_added', `Recorded valuation of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: valuationForm.currency || 'GBP', minimumFractionDigits: 0 }).format(parseFloat(valuationForm.value))} for "${artifact.title}"`)
    setSubmitting(false)
  }

  // Reproduction Requests
  async function addReproductionRequest() {
    if (!reproductionForm.requester_name || !reproductionForm.request_date || submitting) return
    setSubmitting(true)
    const { error: repErr } = await supabase.from('reproduction_requests').insert({
      ...reproductionForm,
      artifact_id: artifact.id,
      museum_id: museum.id,
      decision_date: reproductionForm.decision_date || null,
    })
    if (repErr) { setError(repErr.message); setSubmitting(false); return }
    setReproductionForm({ requester_name: '', requester_org: '', request_date: new Date().toISOString().slice(0, 10), purpose: '', status: 'Pending', decision_date: '', decision_by: '', notes: '' })
    const { data } = await supabase.from('reproduction_requests').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setReproductionRequests(data || [])
    setSubmitting(false)
  }

  async function updateRequestStatus(id: string, status: string) {
    const { error } = await supabase.from('reproduction_requests').update({ status, decision_date: new Date().toISOString().slice(0, 10) }).eq('id', id)
    if (error) { setError(error.message); return }
    const { data } = await supabase.from('reproduction_requests').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setReproductionRequests(data || [])
  }

  // Risk
  async function addRisk() {
    if (!riskForm.risk_type || !riskForm.description || submitting) return
    setSubmitting(true)
    const { error } = await supabase.from('risk_register').insert({
      ...riskForm, review_date: riskForm.review_date || null,
      artifact_id: artifact.id, museum_id: museum.id,
    })
    if (error) { setError(error.message); setSubmitting(false); return }
    setRiskForm({ risk_type: '', description: '', severity: 'Medium', likelihood: 'Medium', mitigation: '', review_date: '', responsible_person: '', notes: '' })
    const { data } = await supabase.from('risk_register').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setRiskHistory(data || [])
    logActivity('risk_added', `Recorded ${riskForm.risk_type} risk for "${artifact.title}"`)
    setSubmitting(false)
  }

  async function updateRiskStatus(id: string, status: string) {
    const { error } = await supabase.from('risk_register').update({ status }).eq('id', id)
    if (error) { setError(error.message); return }
    setRiskHistory(h => h.map(r => r.id === id ? { ...r, status } : r))
  }

  // Damage
  async function addDamage() {
    if (!damageForm.incident_date || !damageForm.discovered_by || !damageForm.description || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const existingCount = damageHistory.filter(r => r.report_number?.startsWith(`DR-${year}-`)).length
    const reportNumber = `DR-${year}-${String(existingCount + 1).padStart(3, '0')}`
    const { error } = await supabase.from('damage_reports').insert({
      ...damageForm, report_number: reportNumber,
      repair_estimate: damageForm.repair_estimate ? Number(damageForm.repair_estimate) : null,
      artifact_id: artifact.id, museum_id: museum.id,
    })
    if (error) { setError(error.message); setSubmitting(false); return }
    setDamageForm({ incident_date: '', discovered_date: '', discovered_by: '', damage_type: 'Accidental', severity: 'Minor', description: '', cause: '', location_at_incident: '', repair_estimate: '', repair_currency: 'GBP', insurance_claim_ref: '', insurance_notified: false, action_taken: '', notes: '' })
    const { data } = await supabase.from('damage_reports').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setDamageHistory(data || [])
    logActivity('damage_reported', `Reported ${damageForm.damage_type} damage to "${artifact.title}"`)
    setSubmitting(false)
  }

  async function updateDamageStatus(id: string, status: string) {
    const { error } = await supabase.from('damage_reports').update({ status }).eq('id', id)
    if (error) { setError(error.message); return }
    setDamageHistory(h => h.map(r => r.id === id ? { ...r, status } : r))
  }

  // Exits
  async function addExit() {
    if (!exitForm.recipient_name.trim() || !exitForm.exit_authorised_by.trim() || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const exitNumber = `EX-${year}-${String(exitHistory.length + 1).padStart(3, '0')}`
    const isTemp = TEMP_REASONS.has(exitForm.exit_reason)
    const { error } = await supabase.from('object_exits').insert({
      museum_id: museum.id, artifact_id: artifact.id, exit_number: exitNumber,
      exit_date: exitForm.exit_date, exit_reason: exitForm.exit_reason,
      recipient_name: exitForm.recipient_name, recipient_contact: exitForm.recipient_contact || null,
      destination_address: exitForm.destination_address || null, exit_condition: exitForm.exit_condition || null,
      signed_receipt: exitForm.signed_receipt,
      signed_receipt_date: exitForm.signed_receipt ? (exitForm.signed_receipt_date || today) : null,
      expected_return_date: isTemp && exitForm.expected_return_date ? exitForm.expected_return_date : null,
      exit_authorised_by: exitForm.exit_authorised_by, notes: exitForm.notes || null,
    })
    if (error) { setError(error.message); setSubmitting(false); return }
    setExitForm({ exit_date: new Date().toISOString().slice(0, 10), exit_reason: 'Return to depositor', recipient_name: '', recipient_contact: '', destination_address: '', exit_condition: '', signed_receipt: false, signed_receipt_date: '', expected_return_date: '', exit_authorised_by: '', notes: '' })
    const { data } = await supabase.from('object_exits').select('*').eq('artifact_id', artifact.id).order('exit_date', { ascending: false })
    setExitHistory(data || [])
    logActivity('exit_created', `Exit record ${exitNumber} created for "${artifact.title}" (${exitForm.exit_reason})`)
    setSubmitting(false)
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  if (loading || !artifact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="font-mono text-sm text-stone-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">

      <aside className="w-56 bg-white dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 flex flex-col fixed top-0 left-0 bottom-0">
        <div className="p-5 border-b border-stone-200 dark:border-stone-800">
          <span className="font-serif text-xl italic text-stone-900 dark:text-stone-100">Vitrine<span className="text-amber-600">.</span></span>
        </div>
        <nav className="p-3 flex-1">
          <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2">Collections</div>
          <div onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 dark:text-stone-400 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800">
            <span>⬡</span> Objects
          </div>
        </nav>
      </aside>

      <main className="ml-56 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              ← Collection
            </button>
            <span className="text-stone-200 dark:text-stone-700">/</span>
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{artifact.title}</span>
          </div>
          <div className="flex items-center gap-4">
            {saved && <span className="text-xs font-mono text-emerald-600">✓ Saved</span>}
            {error && <span className="text-xs font-mono text-red-500">{error}</span>}
            {canEdit && (
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete object'}
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-8 flex gap-1 overflow-x-auto">
          {(museum?.ui_mode === 'simple' ? TABS.filter(t => SIMPLE_TABS.includes(t.id)) : TABS).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-stone-900 dark:border-white text-stone-900 dark:text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="p-8 max-w-3xl space-y-6">

          {!canEdit && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
              View only — contact an Editor or Admin to make changes.
            </div>
          )}

          {/* ── OVERVIEW ─────────────────────────────────── */}
          {activeTab === 'overview' && <>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-6">
              <ImageUpload currentUrl={form.image_url} onUpload={(url) => set('image_url', url)} />
              <ImageGallery artifactId={artifact.id} museumId={museum.id} onPrimaryChange={(url) => set('image_url', url)} canEdit={canEdit} />
            </div>

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
                    <option value="">— Select —</option>
                    {OBJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Current Location</label>
                  <p className="text-sm text-stone-900 dark:text-stone-100 py-2">{form.current_location || <span className="text-stone-400">—</span>}</p>
                  <button type="button" onClick={() => setActiveTab('location')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Update in Location tab →</button>
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
                    <button type="button" onClick={() => setActiveTab('condition')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Update in Condition tab →</button>
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
                    <button type="button" onClick={() => setActiveTab('valuation')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Update in Valuation tab →</button>
                  </div>
                </div>
              )}

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
                  placeholder="Text inscribed on the object…"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </div>

              <div>
                <label className={labelCls}>Marks & Stamps</label>
                <textarea value={form.marks} onChange={e => set('marks', e.target.value)} rows={2}
                  placeholder="Hallmarks, maker's marks, stamps, signatures on reverse…"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </div>

              <div>
                <label className={labelCls}>Provenance</label>
                <textarea value={form.provenance} onChange={e => set('provenance', e.target.value)} rows={3}
                  placeholder="Known ownership history prior to acquisition…"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </div>
            </div>

            {canEdit && <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />}
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
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
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

                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
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

                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
                  <div className={sectionTitle}>Receipt & Terms</div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="e_terms" checked={entryForm.terms_accepted} onChange={e => setE('terms_accepted', e.target.checked)} className="w-4 h-4 rounded border-stone-300" />
                        <label htmlFor="e_terms" className="text-sm text-stone-700 dark:text-stone-300">Terms &amp; conditions accepted</label>
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
                        <label htmlFor="e_receipt" className="text-sm text-stone-700 dark:text-stone-300">Receipt issued to depositor</label>
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

                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
                  <div className={sectionTitle}>Risk</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Risk Notes</label>
                      <textarea rows={2} value={entryForm.risk_notes} onChange={e => setE('risk_notes', e.target.value)} className={inputCls} placeholder="Pest, hazardous materials, fragility…" />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input type="checkbox" id="e_quarantine" checked={entryForm.quarantine_required} onChange={e => setE('quarantine_required', e.target.checked)} className="w-4 h-4 rounded border-stone-300" />
                      <label htmlFor="e_quarantine" className="text-sm text-stone-700 dark:text-stone-300">Quarantine required</label>
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
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
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
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">The date legal title formally passed to the museum</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Acquisition Notes</label>
                <textarea value={form.acquisition_note} onChange={e => set('acquisition_note', e.target.value)} rows={4}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
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
                <label htmlFor="accession_confirmed" className="text-sm text-stone-700 dark:text-stone-300">Formally entered in accession register</label>
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
                  <label htmlFor={field} className="text-sm text-stone-700 dark:text-stone-300">{label}</label>
                </div>
              ))}
            </div>

            {canEdit && <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />}
          </>}

          {/* ── LOCATION ─────────────────────────────────── */}
          {activeTab === 'location' && <>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Current Location (Spectrum Procedure 3)</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Current Location</label>
                  <select value={form.current_location} onChange={e => set('current_location', e.target.value)} className={inputCls}>
                    <option value="">— Select location —</option>
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}{l.location_type ? ` (${l.location_type})` : ''}</option>)}
                    <option value="__other">Other (type manually)</option>
                  </select>
                  {form.current_location === '__other' && (
                    <input value="" onChange={e => set('current_location', e.target.value)} placeholder="Type location…" className={`${inputCls} mt-2`} />
                  )}
                  {form.current_location && form.current_location !== '__other' && !locations.find(l => l.name === form.current_location) && form.current_location !== '' && (
                    <input value={form.current_location} onChange={e => set('current_location', e.target.value)} placeholder="Type location…" className={`${inputCls} mt-2`} />
                  )}
                </div>
                <div><label className={labelCls}>Location Note</label><input value={form.location_note} onChange={e => set('location_note', e.target.value)} placeholder="Additional context" className={inputCls} /></div>
              </div>
              {!showAddLocation ? (
                <button type="button" onClick={() => setShowAddLocation(true)}
                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                  + Add new location to registry
                </button>
              ) : (
                <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-4 space-y-3 bg-stone-50 dark:bg-stone-800/50">
                  <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">New location</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Name *</label><input value={newLocation.name} onChange={e => setNewLocation(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Gallery A — Shelf 3" className={inputCls} /></div>
                    <div>
                      <label className={labelCls}>Type</label>
                      <select value={newLocation.location_type} onChange={e => setNewLocation(f => ({ ...f, location_type: e.target.value }))} className={inputCls}>
                        {['Display', 'Storage', 'Quarantine', 'Transit', 'Conservation Lab', 'Office'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div><label className={labelCls}>Building</label><input value={newLocation.building} onChange={e => setNewLocation(f => ({ ...f, building: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Floor</label><input value={newLocation.floor} onChange={e => setNewLocation(f => ({ ...f, floor: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Room</label><input value={newLocation.room} onChange={e => setNewLocation(f => ({ ...f, room: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Unit / Position</label><input value={newLocation.unit} onChange={e => setNewLocation(f => ({ ...f, unit: e.target.value }))} className={inputCls} /></div>
                  </div>
                  <div>
                    <label className={labelCls}>Environmental Notes</label>
                    <input value={newLocation.environmental_notes} onChange={e => setNewLocation(f => ({ ...f, environmental_notes: e.target.value }))} placeholder="Temperature, humidity, light conditions" className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={async () => {
                      if (!newLocation.name) return
                      const { data, error: locError } = await supabase.from('locations').insert({ ...newLocation, museum_id: museum.id }).select().single()
                      if (locError) { setError(locError.message); return }
                      if (data) {
                        setLocations(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
                        set('current_location', data.name)
                      }
                      setNewLocation({ name: '', building: '', floor: '', room: '', unit: '', position: '', location_type: 'Storage', environmental_notes: '' })
                      setShowAddLocation(false)
                    }} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-100 transition-colors">
                      Save location
                    </button>
                    <button type="button" onClick={() => setShowAddLocation(false)}
                      className="text-xs font-mono text-stone-400 hover:text-stone-700 px-3 py-2">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Record a Movement</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>New Location *</label>
                  <select value={locations.find(l => l.name === locationForm.location) ? locationForm.location : ''} onChange={e => setLocationForm(f => ({ ...f, location: e.target.value }))} className={inputCls}>
                    <option value="">— Select location —</option>
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}{l.location_type ? ` (${l.location_type})` : ''}</option>)}
                  </select>
                  {!locations.find(l => l.name === locationForm.location) && locationForm.location && (
                    <input value={locationForm.location} onChange={e => setLocationForm(f => ({ ...f, location: e.target.value }))} placeholder="Or type a location…" className={`${inputCls} mt-2`} />
                  )}
                  {!locationForm.location && (
                    <input value="" onChange={e => setLocationForm(f => ({ ...f, location: e.target.value }))} placeholder="Or type a location…" className={`${inputCls} mt-2`} />
                  )}
                </div>
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
              <button type="button" onClick={addLocation} disabled={submitting}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                {submitting ? 'Saving…' : 'Save movement →'}
              </button>
            </div>

            {locationLoaded && locationHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Movement History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Location</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Reason</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Moved By</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Authorised By</th>
                  </tr></thead>
                  <tbody>
                    {locationHistory.map(h => (
                      <tr key={h.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-6 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(h.moved_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-sm text-stone-900 dark:text-stone-100">{h.location}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.reason}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.moved_by}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.authorised_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {canEdit && <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />}
          </>}

          {/* ── CONDITION ────────────────────────────────── */}
          {activeTab === 'condition' && <>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Log Condition Assessment (Spectrum Procedure 4)</div>
              <div>
                <label className={labelCls}>Condition Grade *</label>
                <div className="flex gap-2 flex-wrap">
                  {CONDITION_GRADES.map(g => (
                    <button key={g} type="button" onClick={() => setConditionForm(f => ({ ...f, grade: g }))}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${conditionForm.grade === g ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
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
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </div>
              <button type="button" onClick={addCondition} disabled={submitting}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                {submitting ? 'Saving…' : 'Log assessment →'}
              </button>
            </div>

            {form.condition_grade && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
                <div className={sectionTitle}>Current Condition (snapshot)</div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[form.condition_grade] || 'bg-stone-100 text-stone-500'}`}>{form.condition_grade}</span>
                  {form.condition_date && <span className="text-xs text-stone-400">Assessed {new Date(form.condition_date).toLocaleDateString('en-GB')}</span>}
                  {form.condition_assessor && <span className="text-xs text-stone-400">by {form.condition_assessor}</span>}
                </div>
              </div>
            )}

            {conditionLoaded && conditionHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Assessment History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Grade</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Assessor</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Notes</th>
                  </tr></thead>
                  <tbody>
                    {conditionHistory.map(h => (
                      <tr key={h.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-6 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(h.assessed_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[h.grade] || 'bg-stone-100 text-stone-500'}`}>{h.grade}</span></td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.assessor}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.notes}</td>
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

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
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
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </div>
              <button type="button" onClick={addConservation} disabled={submitting}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                {submitting ? 'Saving…' : 'Save treatment →'}
              </button>
            </div>

            {conservationLoaded && conservationHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Treatment History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Conservator</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Dates</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {conservationHistory.map(t => (
                      <tr key={t.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-6 py-3 text-sm text-stone-900">{t.treatment_type}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{t.conservator}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
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

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Add Loan Record (Spectrum Procedures 4 & 5)</div>
              <div>
                <label className={labelCls}>Direction</label>
                <div className="flex gap-2">
                  {['Out','In'].map(d => (
                    <button key={d} type="button" onClick={() => setLoanForm(f => ({ ...f, direction: d }))}
                      className={`px-4 py-1.5 rounded text-xs font-mono border transition-all ${loanForm.direction === d ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                      Loan {d}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{loanForm.direction === 'Out' ? 'We lend this object to another institution' : 'Another institution lends this object to us'}</p>
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
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${loanForm.insurance_type === t ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Loan Coordinator</label><input value={loanForm.loan_coordinator} onChange={e => setLoanForm(f => ({ ...f, loan_coordinator: e.target.value }))} placeholder="Staff member managing this loan" className={inputCls} /></div>
                <div><label className={labelCls}>Approved By</label><input value={loanForm.approved_by} onChange={e => setLoanForm(f => ({ ...f, approved_by: e.target.value }))} placeholder="Authorising person or body" className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Condition at {loanForm.direction === 'In' ? 'Arrival' : 'Exit'}</label><textarea value={loanForm.condition_arrival} onChange={e => setLoanForm(f => ({ ...f, condition_arrival: e.target.value }))} rows={2} placeholder="Record condition when object left / arrived" className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" /></div>
              <div><label className={labelCls}>Special Conditions</label><textarea value={loanForm.conditions} onChange={e => setLoanForm(f => ({ ...f, conditions: e.target.value }))} rows={2} className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" /></div>
              <button type="button" onClick={addLoan} disabled={submitting}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                {submitting ? 'Saving…' : 'Save loan record →'}
              </button>
            </div>

            {loanLoaded && loanHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Loan History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Direction</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Institution</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Dates</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {loanHistory.map(l => (
                      <Fragment key={l.id}>
                        <tr className={`border-b border-stone-100 dark:border-stone-800 ${l.status === 'Active' ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}`}>
                          <td className="px-6 py-3"><span className="text-xs font-mono px-2 py-1 rounded bg-stone-100 text-stone-600">Loan {l.direction}</span></td>
                          <td className="px-4 py-3 text-sm text-stone-900 dark:text-stone-100">{l.borrowing_institution}</td>
                          <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
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
                                ? <button type="button" onClick={() => setEndingLoanId(null)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">Cancel</button>
                                : <button type="button" onClick={() => promptEndLoan(l.id)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">End loan →</button>
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
                                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-stone-400 mb-1">Condition on return</label>
                                  <input
                                    type="text"
                                    value={returnCondition}
                                    onChange={e => setReturnCondition(e.target.value)}
                                    placeholder="e.g. Good — minor surface dust"
                                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
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
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Rights Management (Spectrum — Use of Collections)</div>
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
              <div>
                <label className={labelCls}>Use & Reproduction Restrictions</label>
                <textarea rows={3} value={form.rights_notes} onChange={e => set('rights_notes', e.target.value)} className={inputCls} placeholder="e.g. Permission required for commercial reproduction. Attribution must include artist name and museum. Not available for advertising use." />
              </div>
            </div>

            {/* Reproduction Requests */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Reproduction Requests Log</div>
              {canEdit && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Requester Name *</label><input value={reproductionForm.requester_name} onChange={e => setReproductionForm(f => ({ ...f, requester_name: e.target.value }))} placeholder="Name of person or organisation" className={inputCls} /></div>
                  <div><label className={labelCls}>Organisation</label><input value={reproductionForm.requester_org} onChange={e => setReproductionForm(f => ({ ...f, requester_org: e.target.value }))} placeholder="Publisher, university, etc." className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Purpose</label>
                    <select value={reproductionForm.purpose} onChange={e => setReproductionForm(f => ({ ...f, purpose: e.target.value }))} className={inputCls}>
                      <option value="">— Select —</option>
                      {['Editorial', 'Academic', 'Commercial', 'Personal', 'Exhibition', 'Other'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Request Date *</label><input type="date" value={reproductionForm.request_date} onChange={e => setReproductionForm(f => ({ ...f, request_date: e.target.value }))} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={reproductionForm.status} onChange={e => setReproductionForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                      {['Pending', 'Approved', 'Declined'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Decision By</label><input value={reproductionForm.decision_by} onChange={e => setReproductionForm(f => ({ ...f, decision_by: e.target.value }))} placeholder="Staff member name" className={inputCls} /></div>
                  <div className="col-span-2"><label className={labelCls}>Notes</label><input value={reproductionForm.notes} onChange={e => setReproductionForm(f => ({ ...f, notes: e.target.value }))} placeholder="Usage terms, conditions, fees…" className={inputCls} /></div>
                  <div className="col-span-2">
                    <button type="button" onClick={addReproductionRequest} disabled={!reproductionForm.requester_name || !reproductionForm.request_date || submitting} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                      Log Request
                    </button>
                  </div>
                </div>
              )}

              {reproductionRequestsLoaded && reproductionRequests.length > 0 && (
                <div className="mt-4 space-y-2">
                  {reproductionRequests.map(req => (
                    <div key={req.id} className="border border-stone-100 dark:border-stone-800 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{req.requester_name}{req.requester_org && <span className="font-normal text-stone-400 dark:text-stone-500"> — {req.requester_org}</span>}</div>
                        <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                          {req.purpose && <span>{req.purpose} · </span>}
                          {new Date(req.request_date + 'T00:00:00').toLocaleDateString('en-GB')}
                          {req.notes && <span> · {req.notes}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : req.status === 'Declined' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{req.status}</span>
                        {canEdit && req.status === 'Pending' && (
                          <>
                            <button onClick={() => updateRequestStatus(req.id, 'Approved')} className="text-xs font-mono text-emerald-600 hover:text-emerald-700 transition-colors">Approve</button>
                            <button onClick={() => updateRequestStatus(req.id, 'Declined')} className="text-xs font-mono text-red-500 hover:text-red-700 transition-colors">Decline</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {reproductionRequestsLoaded && reproductionRequests.length === 0 && (
                <p className="text-xs text-stone-400 dark:text-stone-500">No reproduction requests logged.</p>
              )}
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
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
                </div>
              </div>
            )}

            {canEdit && <SaveBar saving={saving} saved={saved} onCancel={() => router.push('/dashboard')} />}
          </>}

          {/* ── AUDIT ────────────────────────────────────── */}
          {activeTab === 'audit' && <>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
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
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${auditForm.inventory_outcome === o ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              {auditForm.inventory_outcome && auditForm.inventory_outcome !== 'Present and correct' && (
                <div className="space-y-3 border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50/30 dark:bg-amber-950/20">
                  <div className="text-xs uppercase tracking-widest text-amber-600">Action Required</div>
                  <div>
                    <label className={labelCls}>Action Required</label>
                    <input value={auditForm.action_required} onChange={e => setAuditForm(f => ({ ...f, action_required: e.target.value }))} placeholder="Describe action needed (e.g. update location, further investigation)" className={inputCls} />
                  </div>
                  {auditForm.action_required && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="action_completed" checked={auditForm.action_completed} onChange={e => setAuditForm(f => ({ ...f, action_completed: e.target.checked }))} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                        <label htmlFor="action_completed" className="text-sm text-stone-700 dark:text-stone-300">Action completed</label>
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
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={auditForm.notes} onChange={e => setAuditForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </div>
              <button type="button" onClick={addAudit} disabled={submitting}
                className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                {submitting ? 'Saving…' : 'Save audit record →'}
              </button>
            </div>

            {form.last_inventoried && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
                <div className={sectionTitle}>Last Inventoried</div>
                <p className="text-sm text-stone-900">{new Date(form.last_inventoried).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}{form.inventoried_by && ` by ${form.inventoried_by}`}</p>
              </div>
            )}

            {auditLoaded && auditHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Audit History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">By</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Outcome</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Location Found</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Condition</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Action</th>
                  </tr></thead>
                  <tbody>
                    {auditHistory.map(h => (
                      <tr key={h.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-6 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(h.inventoried_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.inventoried_by}</td>
                        <td className="px-4 py-3">
                          {h.inventory_outcome && (
                            <span className={`text-xs font-mono px-2 py-1 rounded-full ${h.inventory_outcome === 'Present and correct' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{h.inventory_outcome}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.location_confirmed}</td>
                        <td className="px-4 py-3">{h.condition_confirmed && <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[h.condition_confirmed] || 'bg-stone-100 text-stone-500'}`}>{h.condition_confirmed}</span>}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
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

          {/* ── VALUATION ─────────────────────────────────── */}
          {activeTab === 'valuation' && <>
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
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea value={valuationForm.notes} onChange={e => setValuationForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
                </div>
                <button type="button" onClick={addValuation} disabled={!valuationForm.value || !valuationForm.valuation_date || submitting}
                  className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
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
          </>}

          {/* ── RISK ─────────────────────────────────── */}
          {activeTab === 'risk' && <>
            {canEdit && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
                <div className={sectionTitle}>Add Risk</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Risk Type *</label>
                    <select value={riskForm.risk_type} onChange={e => setRiskForm(f => ({ ...f, risk_type: e.target.value }))} className={inputCls}>
                      <option value="">Select type…</option>
                      {RISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Responsible Person</label>
                    <input value={riskForm.responsible_person} onChange={e => setRiskForm(f => ({ ...f, responsible_person: e.target.value }))} placeholder="Name" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description *</label>
                  <textarea value={riskForm.description} onChange={e => setRiskForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the risk…" className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Severity</label>
                    <select value={riskForm.severity} onChange={e => setRiskForm(f => ({ ...f, severity: e.target.value }))} className={inputCls}>
                      {RISK_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Likelihood</label>
                    <select value={riskForm.likelihood} onChange={e => setRiskForm(f => ({ ...f, likelihood: e.target.value }))} className={inputCls}>
                      {RISK_LIKELIHOODS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Review Date</label>
                    <input type="date" value={riskForm.review_date} onChange={e => setRiskForm(f => ({ ...f, review_date: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mitigation</label>
                  <textarea value={riskForm.mitigation} onChange={e => setRiskForm(f => ({ ...f, mitigation: e.target.value }))} rows={2} placeholder="Steps taken or planned to mitigate…" className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea value={riskForm.notes} onChange={e => setRiskForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <button type="button" onClick={addRisk} disabled={!riskForm.risk_type || !riskForm.description || submitting}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                  {submitting ? 'Saving…' : 'Add risk →'}
                </button>
              </div>
            )}

            {riskLoaded && riskHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Risk History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Severity</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Likelihood</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Review Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3"></th>}
                  </tr></thead>
                  <tbody>
                    {riskHistory.map(r => (
                      <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{r.risk_type}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${RISK_SEVERITY_STYLES[r.severity] || RISK_SEVERITY_STYLES.Medium}`}>{r.severity}</span></td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.likelihood}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{r.review_date ? new Date(r.review_date).toLocaleDateString('en-GB') : '—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${r.status === 'Closed' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' : r.status === 'Mitigated' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{r.status}</span></td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {r.status === 'Open' && <button type="button" onClick={() => updateRiskStatus(r.id, 'Mitigated')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Mitigate</button>}
                              {r.status !== 'Closed' && <button type="button" onClick={() => updateRiskStatus(r.id, 'Closed')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Close</button>}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {riskLoaded && riskHistory.length === 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-3">⚑</div>
                <p className="text-sm text-stone-400 dark:text-stone-500">No risks recorded for this object.</p>
              </div>
            )}
          </>}

          {/* ── DAMAGE ─────────────────────────────────── */}
          {activeTab === 'damage' && <>
            {canEdit && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
                <div className={sectionTitle}>Report Damage</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Incident Date *</label>
                    <input type="date" value={damageForm.incident_date} onChange={e => setDamageForm(f => ({ ...f, incident_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Discovered Date</label>
                    <input type="date" value={damageForm.discovered_date} onChange={e => setDamageForm(f => ({ ...f, discovered_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Discovered By *</label>
                    <input value={damageForm.discovered_by} onChange={e => setDamageForm(f => ({ ...f, discovered_by: e.target.value }))} placeholder="Name" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Damage Type</label>
                    <select value={damageForm.damage_type} onChange={e => setDamageForm(f => ({ ...f, damage_type: e.target.value }))} className={inputCls}>
                      {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Severity</label>
                    <select value={damageForm.severity} onChange={e => setDamageForm(f => ({ ...f, severity: e.target.value }))} className={inputCls}>
                      {DAMAGE_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description *</label>
                  <textarea value={damageForm.description} onChange={e => setDamageForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the damage or loss…" className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Cause</label>
                    <input value={damageForm.cause} onChange={e => setDamageForm(f => ({ ...f, cause: e.target.value }))} placeholder="Known or suspected cause" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Location at Time of Incident</label>
                    <input value={damageForm.location_at_incident} onChange={e => setDamageForm(f => ({ ...f, location_at_incident: e.target.value }))} placeholder="Where the object was" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Repair Estimate</label>
                    <input type="number" step="0.01" min="0" value={damageForm.repair_estimate} onChange={e => setDamageForm(f => ({ ...f, repair_estimate: e.target.value }))} placeholder="0.00" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Currency</label>
                    <select value={damageForm.repair_currency} onChange={e => setDamageForm(f => ({ ...f, repair_currency: e.target.value }))} className={inputCls}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Insurance Claim Ref</label>
                    <input value={damageForm.insurance_claim_ref} onChange={e => setDamageForm(f => ({ ...f, insurance_claim_ref: e.target.value }))} placeholder="Claim reference" className={inputCls} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <input type="checkbox" checked={damageForm.insurance_notified} onChange={e => setDamageForm(f => ({ ...f, insurance_notified: e.target.checked }))} className="rounded border-stone-300" />
                  Insurance provider notified
                </label>
                <div>
                  <label className={labelCls}>Action Taken</label>
                  <textarea value={damageForm.action_taken} onChange={e => setDamageForm(f => ({ ...f, action_taken: e.target.value }))} rows={2} placeholder="Immediate steps taken…" className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea value={damageForm.notes} onChange={e => setDamageForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <button type="button" onClick={addDamage} disabled={!damageForm.incident_date || !damageForm.discovered_by || !damageForm.description || submitting}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                  {submitting ? 'Saving…' : 'Add report →'}
                </button>
              </div>
            )}

            {damageLoaded && damageHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Damage History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Report</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Severity</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3"></th>}
                  </tr></thead>
                  <tbody>
                    {damageHistory.map(r => (
                      <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium font-mono text-stone-900 dark:text-stone-100">{r.report_number}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.damage_type}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${DAMAGE_SEVERITY_STYLES[r.severity] || DAMAGE_SEVERITY_STYLES.Minor}`}>{r.severity}</span></td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{r.incident_date ? new Date(r.incident_date).toLocaleDateString('en-GB') : '—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${r.status === 'Closed' || r.status === 'Write-off' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' : r.status === 'Repaired' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : r.status === 'Under Investigation' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{r.status}</span></td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {r.status === 'Open' && <button type="button" onClick={() => updateDamageStatus(r.id, 'Under Investigation')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Investigate</button>}
                              {(r.status === 'Open' || r.status === 'Under Investigation') && <button type="button" onClick={() => updateDamageStatus(r.id, 'Repaired')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Repaired</button>}
                              {r.status !== 'Closed' && r.status !== 'Write-off' && <button type="button" onClick={() => updateDamageStatus(r.id, 'Closed')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Close</button>}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {damageLoaded && damageHistory.length === 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-3">⚠</div>
                <p className="text-sm text-stone-400 dark:text-stone-500">No damage reports for this object.</p>
              </div>
            )}
          </>}

          {/* ── EXITS ─────────────────────────────────── */}
          {activeTab === 'exits' && <>
            {canEdit && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
                <div className={sectionTitle}>Record Exit</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Exit Date *</label>
                    <input type="date" value={exitForm.exit_date} onChange={e => setExitForm(f => ({ ...f, exit_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Exit Reason *</label>
                    <select value={exitForm.exit_reason} onChange={e => setExitForm(f => ({ ...f, exit_reason: e.target.value }))} className={inputCls}>
                      {EXIT_REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Exit Authorised By *</label>
                    <input value={exitForm.exit_authorised_by} onChange={e => setExitForm(f => ({ ...f, exit_authorised_by: e.target.value }))} placeholder="Staff member or governing body" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Recipient Name *</label>
                    <input value={exitForm.recipient_name} onChange={e => setExitForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="Who received the object" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Recipient Contact</label>
                    <input value={exitForm.recipient_contact} onChange={e => setExitForm(f => ({ ...f, recipient_contact: e.target.value }))} placeholder="Email, phone" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Destination Address</label>
                  <input value={exitForm.destination_address} onChange={e => setExitForm(f => ({ ...f, destination_address: e.target.value }))} placeholder="Where the object is going" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Condition at Exit</label>
                  <textarea rows={2} value={exitForm.exit_condition} onChange={e => setExitForm(f => ({ ...f, exit_condition: e.target.value }))} placeholder="Brief condition note" className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                      <input type="checkbox" checked={exitForm.signed_receipt} onChange={e => setExitForm(f => ({ ...f, signed_receipt: e.target.checked }))} className="rounded border-stone-300" />
                      Signed receipt obtained
                    </label>
                    {exitForm.signed_receipt && (
                      <div>
                        <label className={labelCls}>Receipt date</label>
                        <input type="date" value={exitForm.signed_receipt_date} onChange={e => setExitForm(f => ({ ...f, signed_receipt_date: e.target.value }))} className={inputCls} />
                      </div>
                    )}
                  </div>
                  {TEMP_REASONS.has(exitForm.exit_reason) && (
                    <div>
                      <label className={labelCls}>Expected Return Date</label>
                      <input type="date" value={exitForm.expected_return_date} onChange={e => setExitForm(f => ({ ...f, expected_return_date: e.target.value }))} className={inputCls} />
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea rows={2} value={exitForm.notes} onChange={e => setExitForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
                </div>
                <button type="button" onClick={addExit} disabled={!exitForm.recipient_name || !exitForm.exit_authorised_by || submitting}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                  {submitting ? 'Saving…' : 'Save exit record →'}
                </button>
              </div>
            )}

            {exitLoaded && exitHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Exit History</div></div>
                <table className="w-full">
                  <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Exit No.</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Reason</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Recipient</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Receipt</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Return</th>
                  </tr></thead>
                  <tbody>
                    {exitHistory.map(e => (
                      <tr key={e.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{e.exit_number}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(e.exit_date + 'T00:00:00').toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{e.exit_reason}</td>
                        <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{e.recipient_name}</td>
                        <td className="px-4 py-3">{e.signed_receipt ? <span className="text-xs font-mono text-emerald-600">✓ Signed</span> : <span className="text-xs font-mono text-amber-600">Pending</span>}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{e.expected_return_date ? new Date(e.expected_return_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {exitLoaded && exitHistory.length === 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-3">↗</div>
                <p className="text-sm text-stone-400 dark:text-stone-500">No exit records for this object.</p>
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
        className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
        {saving ? 'Saving…' : 'Save changes →'}
      </button>
      <button type="button" onClick={onCancel}
        className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800">
        Cancel
      </button>
      {saved && <span className="text-xs font-mono text-emerald-600">✓ Saved</span>}
    </div>
  )
}
