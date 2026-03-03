'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getMuseumForUser } from '@/lib/get-museum'
import DashboardShell from '@/components/DashboardShell'

import OverviewTab from '@/components/tabs/OverviewTab'
import EntryTab from '@/components/tabs/EntryTab'
import AcquisitionTab from '@/components/tabs/AcquisitionTab'
import LocationTab from '@/components/tabs/LocationTab'
import ConditionTab from '@/components/tabs/ConditionTab'
import ConservationTab from '@/components/tabs/ConservationTab'
import LoansTab from '@/components/tabs/LoansTab'
import RightsTab from '@/components/tabs/RightsTab'
import AuditTab from '@/components/tabs/AuditTab'
import ValuationTab from '@/components/tabs/ValuationTab'
import RiskTab from '@/components/tabs/RiskTab'
import DamageTab from '@/components/tabs/DamageTab'
import ExitsTab from '@/components/tabs/ExitsTab'

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

export default function ArtifactDetail() {
  const [artifact, setArtifact] = useState<any>(null)
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [latestValuation, setLatestValuation] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])

  const [form, setForm] = useState<Record<string, any>>({
    title: '', artist: '', year: '', medium: 'Oil on canvas', culture: '',
    accession_no: '', dimensions: '', description: '', emoji: '🖼️',
    status: 'On Display', image_url: '',
    object_type: '', inscription: '', marks: '', provenance: '',
    acquisition_method: '', acquisition_date: '', acquisition_source: '',
    acquisition_note: '', legal_transfer_date: '',
    acquisition_source_contact: '', acquisition_authorised_by: '',
    acquisition_authority_date: '', acquisition_title_guarantee: '',
    acquisition_object_count: 1,
    accession_register_confirmed: false,
    accession_date: '', conditions_attached_to_acquisition: '',
    location_after_accessioning: '', acknowledgement_sent_to_donor: false,
    ethics_art_loss_register: false, ethics_cites: false,
    ethics_dealing_act: false, ethics_human_remains: false,
    current_location: '', location_note: '',
    condition_grade: '', condition_date: '', condition_assessor: '',
    copyright_status: '', rights_holder: '', rights_notes: '',
    disposal_method: '', disposal_date: '', disposal_note: '',
    disposal_authorization: '', disposal_recipient: '',
    last_inventoried: '', inventoried_by: '',
    insured_value: '', insured_value_currency: 'GBP',
    // Cataloguing (Proc 5)
    maker_name: '', maker_role: '',
    production_date_early: '', production_date_late: '', production_date_qualifier: '',
    production_place: '', physical_materials: '', technique: '',
    school_style_period: '', subject_depicted: '', number_of_parts: 1,
    distinguishing_features: '', full_description: '',
    associated_concept: '', associated_event: '', associated_person: '',
    associated_place: '', associated_organisation: '',
    dimension_height: '', dimension_width: '', dimension_depth: '', dimension_weight: '',
    dimension_unit: 'cm', dimension_weight_unit: 'kg', dimension_notes: '',
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
        accession_date: artifact.accession_date || '',
        conditions_attached_to_acquisition: artifact.conditions_attached_to_acquisition || '',
        location_after_accessioning: artifact.location_after_accessioning || '',
        acknowledgement_sent_to_donor: artifact.acknowledgement_sent_to_donor ?? false,
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
        insured_value: artifact.insured_value ?? '',
        insured_value_currency: artifact.insured_value_currency || 'GBP',
        // Cataloguing (Proc 5)
        maker_name: artifact.maker_name || '',
        maker_role: artifact.maker_role || '',
        production_date_early: artifact.production_date_early || '',
        production_date_late: artifact.production_date_late || '',
        production_date_qualifier: artifact.production_date_qualifier || '',
        production_place: artifact.production_place || '',
        physical_materials: artifact.physical_materials || '',
        technique: artifact.technique || '',
        school_style_period: artifact.school_style_period || '',
        subject_depicted: artifact.subject_depicted || '',
        number_of_parts: artifact.number_of_parts ?? 1,
        distinguishing_features: artifact.distinguishing_features || '',
        full_description: artifact.full_description || '',
        associated_concept: artifact.associated_concept || '',
        associated_event: artifact.associated_event || '',
        associated_person: artifact.associated_person || '',
        associated_place: artifact.associated_place || '',
        associated_organisation: artifact.associated_organisation || '',
        dimension_height: artifact.dimension_height ?? '',
        dimension_width: artifact.dimension_width ?? '',
        dimension_depth: artifact.dimension_depth ?? '',
        dimension_weight: artifact.dimension_weight ?? '',
        dimension_unit: artifact.dimension_unit || 'cm',
        dimension_weight_unit: artifact.dimension_weight_unit || 'kg',
        dimension_notes: artifact.dimension_notes || '',
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

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!isOwner && staffAccess !== 'Admin' && staffAccess !== 'Editor') return
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    const { condition_grade, condition_date, condition_assessor, ...formToSave } = form
    const { error } = await supabase.from('artifacts').update({
      ...formToSave,
      acquisition_date: formToSave.acquisition_date || null,
      legal_transfer_date: formToSave.legal_transfer_date || null,
      acquisition_authority_date: formToSave.acquisition_authority_date || null,
      acquisition_object_count: formToSave.acquisition_object_count ? parseInt(formToSave.acquisition_object_count, 10) || 1 : 1,
      accession_date: formToSave.accession_date || null,
      disposal_date: formToSave.disposal_date || null,
      last_inventoried: formToSave.last_inventoried || null,
      // Cataloguing numerics
      number_of_parts: formToSave.number_of_parts ? parseInt(formToSave.number_of_parts, 10) || 1 : 1,
      dimension_height: formToSave.dimension_height ? parseFloat(formToSave.dimension_height) : null,
      dimension_width: formToSave.dimension_width ? parseFloat(formToSave.dimension_width) : null,
      dimension_depth: formToSave.dimension_depth ? parseFloat(formToSave.dimension_depth) : null,
      dimension_weight: formToSave.dimension_weight ? parseFloat(formToSave.dimension_weight) : null,
      // Insurance
      insured_value: formToSave.insured_value ? parseFloat(formToSave.insured_value) : null,
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
    if (artifact.deaccession_protected || artifact.status === 'Deaccessioned') {
      setError('Deaccessioned objects cannot be deleted. Use the Disposal register instead.')
      return
    }
    if (!confirm('Delete "' + artifact.title + '"? This cannot be undone.')) return
    setDeleting(true)
    const { error } = await supabase.from('artifacts').delete().eq('id', params.id)
    if (error) { setError(error.message); setDeleting(false) } else { router.push('/dashboard') }
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

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  if (loading || !artifact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="font-mono text-sm text-stone-400">Loading…</p>
      </div>
    )
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard" onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }} isOwner={isOwner} staffAccess={staffAccess}>
        {/* Top bar */}
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
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

          {activeTab === 'overview' && (
            <OverviewTab form={form} set={set} canEdit={canEdit} saving={saving} saved={saved} artifact={artifact} museum={museum} latestValuation={latestValuation} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'entry' && (
            <EntryTab artifact={artifact} museum={museum} canEdit={canEdit} supabase={supabase} saved={saved} setSaved={setSaved} setError={setError} />
          )}

          {activeTab === 'acquisition' && (
            <AcquisitionTab form={form} set={set} canEdit={canEdit} saving={saving} saved={saved} />
          )}

          {activeTab === 'location' && (
            <LocationTab form={form} set={set} canEdit={canEdit} saving={saving} saved={saved} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} locations={locations} setLocations={setLocations} />
          )}

          {activeTab === 'condition' && (
            <ConditionTab form={form} set={set} canEdit={canEdit} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'conservation' && (
            <ConservationTab form={form} canEdit={canEdit} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'loans' && (
            <LoansTab form={form} set={set} canEdit={canEdit} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} locationLoaded={false} setLocationHistory={() => {}} />
          )}

          {activeTab === 'rights' && (
            <RightsTab form={form} set={set} canEdit={canEdit} saving={saving} saved={saved} artifact={artifact} museum={museum} supabase={supabase} setError={setError} logActivity={logActivity} />
          )}

          {activeTab === 'audit' && (
            <AuditTab form={form} set={set} canEdit={canEdit} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'valuation' && (
            <ValuationTab canEdit={canEdit} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} setLatestValuation={setLatestValuation} />
          )}

          {activeTab === 'risk' && (
            <RiskTab canEdit={canEdit} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'damage' && (
            <DamageTab canEdit={canEdit} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'exits' && (
            <ExitsTab canEdit={canEdit} artifact={artifact} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

        </form>
    </DashboardShell>
  )
}
