'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import DashboardShell from '@/components/DashboardShell'
import { useToast } from '@/components/Toast'
import { Skeleton, FormSkeleton } from '@/components/Skeleton'

import QRLabelModal from '@/components/QRLabelModal'
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
import DuplicateSearchModal from '@/components/DuplicateSearchModal'
import DamageTab from '@/components/tabs/DamageTab'
import ExitsTab from '@/components/tabs/ExitsTab'
import ObjectProgressSidebar from '@/components/ObjectProgressSidebar'

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'entry',        label: 'Object Entry' },
  { id: 'acquisition',  label: 'Acquisition' },
  { id: 'location',     label: 'Location' },
  { id: 'condition',    label: 'Condition' },
  { id: 'rights',       label: 'Rights & Legal' },
  { id: 'valuation',    label: 'Valuation' },
  { id: 'conservation', label: 'Conservation' },
  { id: 'loans',        label: 'Loans' },
  { id: 'audit',        label: 'Audit' },
  { id: 'risk',         label: 'Risk' },
  { id: 'damage',       label: 'Damage' },
  { id: 'exits',        label: 'Exits' },
]

const SIMPLE_TABS = ['overview', 'entry', 'location', 'condition', 'valuation']

export default function ObjectDetail() {
  const [object, setObject] = useState<any>(null)
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [linkedDuplicates, setLinkedDuplicates] = useState<any[]>([])
  const { toast } = useToast()
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
    credit_line: '', historical_context: '', is_gift: null,
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
    condition_grade: '', condition_date: '', condition_assessor: '', hazard_note: '',
    copyright_status: '', rights_holder: '', rights_notes: '',
    disposal_method: '', disposal_date: '', disposal_note: '',
    disposal_authorization: '', disposal_recipient: '',
    last_inventoried: '', inventoried_by: '',
    insured_value: '', insured_value_currency: 'GBP',
    // Cataloguing (Proc 5)
    production_date: '', production_date_qualifier: '',
    production_place: '', physical_materials: '', technique: '',
    school_style_period: '', subject_depicted: '', number_of_parts: 1,
    distinguishing_features: '', full_description: '',
    associated_concept: '', associated_event: '', associated_person: '',
    associated_place: '', associated_organisation: '',
    dimension_height: '', dimension_width: '', dimension_depth: '', dimension_weight: '',
    dimension_unit: 'cm', dimension_weight_unit: 'kg', dimension_notes: '',
    show_on_site: true,
    is_featured: false,
    acquisition_justification: '', acquisition_documentation_ref: '',
    acquisition_value: '', acquisition_currency: 'GBP',
    estimated_value: '', estimated_value_currency: 'GBP',
    category: '',
    // Gap 2: Accession distinction
    formally_accessioned: true,
    non_accession_reason: '',
    // Gap 5: Cataloguing attribution
    record_source: '', attributed_to: '', attribution_notes: '', record_completeness: '',
    // Proc 5 visual description fields
    colour: '', shape: '', surface_treatment: '',
    other_names: '', provenance_date_range: '', field_collection_info: '',
    rarity: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result

      const { data: object } = await supabase
        .from('objects').select('*')
        .eq('id', params.id).eq('museum_id', museum.id).single()

      if (!object) { router.push('/dashboard'); return }

      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setObject(object)
      setForm({
        title: object.title || '',
        artist: object.artist || '',
        year: object.year || '',
        medium: object.medium || 'Oil on canvas',
        culture: object.culture || '',
        accession_no: object.accession_no || '',
        dimensions: object.dimensions || '',
        description: object.description || '',
        emoji: object.emoji || '🖼️',
        status: object.status || 'On Display',
        image_url: object.image_url || '',
        object_type: object.object_type || '',
        // Combine inscription and marks into one field for the UI
        inscription: [object.inscription, object.marks].filter(Boolean).join('\n\n') || '',
        marks: '',
        provenance: object.provenance || '',
        credit_line: object.credit_line || '',
        historical_context: object.historical_context || '',
        is_gift: object.is_gift ?? null,
        acquisition_method: object.acquisition_method || '',
        acquisition_date: object.acquisition_date || '',
        acquisition_source: object.acquisition_source || '',
        acquisition_note: object.acquisition_note || '',
        legal_transfer_date: object.legal_transfer_date || '',
        acquisition_source_contact: object.acquisition_source_contact || '',
        acquisition_authorised_by: object.acquisition_authorised_by || '',
        acquisition_authority_date: object.acquisition_authority_date || '',
        acquisition_title_guarantee: object.acquisition_title_guarantee || '',
        acquisition_object_count: object.acquisition_object_count ?? 1,
        accession_register_confirmed: object.accession_register_confirmed ?? false,
        accession_date: object.accession_date || '',
        conditions_attached_to_acquisition: object.conditions_attached_to_acquisition || '',
        location_after_accessioning: object.location_after_accessioning || '',
        acknowledgement_sent_to_donor: object.acknowledgement_sent_to_donor ?? false,
        ethics_art_loss_register: object.ethics_art_loss_register ?? false,
        ethics_cites: object.ethics_cites ?? false,
        ethics_dealing_act: object.ethics_dealing_act ?? false,
        ethics_human_remains: object.ethics_human_remains ?? false,
        current_location: object.current_location || '',
        location_note: object.location_note || '',
        condition_grade: object.condition_grade || '',
        condition_date: object.condition_date || '',
        condition_assessor: object.condition_assessor || '',
        hazard_note: object.hazard_note || '',
        copyright_status: object.copyright_status || '',
        rights_holder: object.rights_holder || '',
        rights_notes: object.rights_notes || '',
        disposal_method: object.disposal_method || '',
        disposal_date: object.disposal_date || '',
        disposal_note: object.disposal_note || '',
        disposal_authorization: object.disposal_authorization || '',
        disposal_recipient: object.disposal_recipient || '',
        last_inventoried: object.last_inventoried || '',
        inventoried_by: object.inventoried_by || '',
        show_on_site: object.show_on_site ?? true,
        is_featured: object.is_featured ?? false,
        insured_value: object.insured_value ?? '',
        insured_value_currency: object.insured_value_currency || 'GBP',
        // Cataloguing (Proc 5)
        production_date: object.production_date || object.production_date_early || '',
        production_date_qualifier: object.production_date_qualifier || '',
        production_place: object.production_place || '',
        physical_materials: object.physical_materials || '',
        technique: object.technique || '',
        school_style_period: object.school_style_period || '',
        subject_depicted: object.subject_depicted || '',
        number_of_parts: object.number_of_parts ?? 1,
        distinguishing_features: object.distinguishing_features || '',
        full_description: object.full_description || '',
        associated_concept: object.associated_concept || '',
        associated_event: object.associated_event || '',
        associated_person: object.associated_person || '',
        associated_place: object.associated_place || '',
        associated_organisation: object.associated_organisation || '',
        dimension_height: object.dimension_height ?? '',
        dimension_width: object.dimension_width ?? '',
        dimension_depth: object.dimension_depth ?? '',
        dimension_weight: object.dimension_weight ?? '',
        dimension_unit: object.dimension_unit || 'cm',
        dimension_weight_unit: object.dimension_weight_unit || 'kg',
        dimension_notes: object.dimension_notes || '',
        acquisition_justification: object.acquisition_justification || '',
        acquisition_documentation_ref: object.acquisition_documentation_ref || '',
        acquisition_value: object.acquisition_value ?? '',
        acquisition_currency: object.acquisition_currency || 'GBP',
        estimated_value: object.estimated_value ?? '',
        estimated_value_currency: object.estimated_value_currency || 'GBP',
        category: object.category || '',
        // Gap 2: Accession distinction
        formally_accessioned: object.formally_accessioned ?? true,
        non_accession_reason: object.non_accession_reason || '',
        // Gap 5: Cataloguing attribution
        record_source: object.record_source || '',
        attributed_to: object.attributed_to || '',
        attribution_notes: object.attribution_notes || '',
        record_completeness: object.record_completeness || '',
        // Proc 5 visual description fields
        colour: object.colour || '',
        shape: object.shape || '',
        surface_treatment: object.surface_treatment || '',
        other_names: object.other_names || '',
        provenance_date_range: object.provenance_date_range || '',
        field_collection_info: object.field_collection_info || '',
        rarity: object.rarity || '',
      })
      const [{ data: lv }, { data: locs }, { data: dupes }] = await Promise.all([
        supabase.from('valuations').select('value, currency, valuation_date')
          .eq('object_id', object.id).order('valuation_date', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('locations').select('*').eq('museum_id', museum.id).eq('status', 'Active').order('name'),
        supabase.from('object_duplicates')
          .select('id, duplicate_of_id, objects!object_duplicates_duplicate_of_id_fkey(id, title, emoji)')
          .eq('object_id', object.id).eq('museum_id', museum.id),
      ])
      setLatestValuation(lv || null)
      setLocations(locs || [])
      setLinkedDuplicates(dupes || [])
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
    if (!form.title.trim()) { toast('Title is required', 'error'); return }
    setSaving(true)

    const { condition_grade, condition_date, condition_assessor, hazard_note, ...formToSave } = form
    const { error } = await supabase.from('objects').update({
      ...formToSave,
      // marks is now merged into inscription in the UI — clear marks to avoid duplication
      marks: '',
      // keep legacy year column in sync with the production_date field
      year: formToSave.production_date || formToSave.year || null,
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
      // Insurance & acquisition value
      insured_value: formToSave.insured_value ? parseFloat(formToSave.insured_value) : null,
      acquisition_value: formToSave.acquisition_value ? parseFloat(formToSave.acquisition_value) : null,
      estimated_value: formToSave.estimated_value ? parseFloat(formToSave.estimated_value) : null,
    }).eq('id', params.id)

    if (error) { toast(error.message, 'error') } else {
      toast('Changes saved')
      router.refresh()
      logActivity('saved', `Updated "${form.title}"`)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!object || !canEdit) return
    if (object.deaccession_protected || object.status === 'Deaccessioned') {
      toast('Deaccessioned objects cannot be deleted. Use the Disposal register instead.', 'error')
      return
    }
    if (!confirm('Move "' + object.title + '" to bin?\n\nItems in the bin are permanently deleted after 90 days.')) return
    setDeleting(true)
    const { error } = await supabase.from('objects').update({ deleted_at: new Date().toISOString() }).eq('id', params.id)
    if (error) { toast(error.message, 'error'); setDeleting(false) } else {
      toast('Moved to bin')
      router.push('/dashboard')
    }
  }

  async function handleDuplicate() {
    if (!canEdit || !object) return
    setDuplicating(true)
    const { condition_grade, condition_date, condition_assessor, hazard_note: _hz, ...formToSave } = form
    const { data: newObject, error } = await supabase.from('objects').insert({
      ...formToSave,
      museum_id: museum.id,
      owner_id: museum.owner_id,
      created_by: currentUserId,
      updated_by: currentUserId,
      title: `${form.title} (copy)`,
      accession_no: null,
      accession_register_confirmed: false,
      show_on_site: false,
      image_url: null,
      acquisition_date: formToSave.acquisition_date || null,
      legal_transfer_date: formToSave.legal_transfer_date || null,
      acquisition_authority_date: formToSave.acquisition_authority_date || null,
      acquisition_object_count: formToSave.acquisition_object_count ? parseInt(formToSave.acquisition_object_count, 10) || 1 : 1,
      accession_date: formToSave.accession_date || null,
      disposal_date: formToSave.disposal_date || null,
      last_inventoried: null,
      number_of_parts: formToSave.number_of_parts ? parseInt(formToSave.number_of_parts, 10) || 1 : 1,
      dimension_height: formToSave.dimension_height ? parseFloat(formToSave.dimension_height) : null,
      dimension_width: formToSave.dimension_width ? parseFloat(formToSave.dimension_width) : null,
      dimension_depth: formToSave.dimension_depth ? parseFloat(formToSave.dimension_depth) : null,
      dimension_weight: formToSave.dimension_weight ? parseFloat(formToSave.dimension_weight) : null,
      insured_value: formToSave.insured_value ? parseFloat(formToSave.insured_value) : null,
    }).select('id').single()
    if (error) { toast(error.message, 'error'); setDuplicating(false) } else {
      toast('Object duplicated')
      router.push(`/dashboard/objects/${newObject.id}`)
    }
  }

  async function logActivity(actionType: string, description: string) {
    if (!museum || !object) return
    await supabase.from('activity_log').insert({
      museum_id: museum.id,
      object_id: object.id,
      user_id: currentUserId,
      user_name: isOwner ? 'Owner' : staffAccess || 'Staff',
      action_type: actionType,
      description,
    })
  }

  async function handleUnlinkDuplicate(duplicateObjectId: string) {
    const res = await fetch(`/api/objects/${params.id}/duplicates/${duplicateObjectId}`, { method: 'DELETE' })
    if (res.ok) {
      setLinkedDuplicates(prev => prev.filter(d => d.duplicate_of_id !== duplicateObjectId))
      toast('Duplicate link removed')
    } else {
      toast('Failed to unlink', 'error')
    }
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'
  const fullMode = getPlan(museum?.plan).fullMode

  if (loading || !object) {
    return (
      <DashboardShell museum={null} activePath="/dashboard" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-8 flex gap-1 py-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-20" />)}
        </div>
        <div className="p-8 space-y-6">
          <FormSkeleton fields={8} />
          <FormSkeleton fields={4} />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard" onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }} isOwner={isOwner} staffAccess={staffAccess}>
        {/* Top bar */}
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard')}
              className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors shrink-0">
              ← Collection
            </button>
            <span className="text-stone-200 dark:text-stone-700 shrink-0">/</span>
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100 truncate max-w-[160px] sm:max-w-none">{object.title}</span>
          </div>
          <div className="flex items-center gap-4">
            {fullMode && museum?.slug && (
              <button onClick={() => setQrModalOpen(true)}
                className="hidden sm:inline text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                QR label
              </button>
            )}
            {fullMode && (
              <button onClick={() => window.open(`/print/object/${params.id}`, '_blank')}
                className="hidden sm:inline text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                Print record
              </button>
            )}
            {canEdit && fullMode && (
              <button onClick={handleDuplicate} disabled={duplicating}
                className="hidden sm:inline text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors disabled:opacity-50">
                {duplicating ? 'Duplicating…' : 'Duplicate'}
              </button>
            )}
            {canEdit && (
              <button onClick={() => setDuplicateModalOpen(true)}
                className="hidden sm:inline text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                Link duplicate
              </button>
            )}
            {canEdit && (
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
                {deleting ? 'Moving…' : 'Move to bin'}
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-4 md:px-8 flex gap-1 overflow-x-auto">
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

        <div className="flex gap-8 p-8">
        <form onSubmit={handleSave} className="flex-1 min-w-0 max-w-3xl space-y-6">

          {!canEdit && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
              View only — contact an Editor or Admin to make changes.
            </div>
          )}

          {/* Duplicate links */}
          {linkedDuplicates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {linkedDuplicates.map(d => {
                const linked = d.objects as any
                return (
                  <div key={d.id} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded px-3 py-1.5 text-xs">
                    <span className="text-amber-600 dark:text-amber-400 font-mono">Duplicate of:</span>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/objects/${linked.id}`)}
                      className="text-amber-700 dark:text-amber-300 hover:underline font-medium"
                    >
                      {linked.emoji} {linked.title}
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleUnlinkDuplicate(d.duplicate_of_id)}
                        className="ml-1 text-amber-400 hover:text-amber-700 dark:hover:text-amber-200 leading-none"
                        title="Unlink"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewTab form={form} set={set} canEdit={canEdit} saving={saving} object={object} museum={museum} latestValuation={latestValuation} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'entry' && (
            <EntryTab object={object} museum={museum} canEdit={canEdit} supabase={supabase} />
          )}

          {activeTab === 'acquisition' && (
            <AcquisitionTab form={form} set={set} canEdit={canEdit} saving={saving} objectId={object?.id} museumId={museum?.id} canAttach={getPlan(museum?.plan).compliance} />
          )}

          {activeTab === 'location' && (
            <LocationTab form={form} set={set} canEdit={canEdit} saving={saving} object={object} museum={museum} supabase={supabase} logActivity={logActivity} locations={locations} setLocations={setLocations} />
          )}

          {activeTab === 'condition' && (
            <ConditionTab form={form} set={set} canEdit={canEdit} object={object} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'conservation' && (
            <ConservationTab form={form} canEdit={canEdit} object={object} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'loans' && (
            <LoansTab form={form} set={set} canEdit={canEdit} object={object} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'rights' && (
            <RightsTab form={form} set={set} canEdit={canEdit} saving={saving} object={object} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'audit' && (
            <AuditTab form={form} set={set} canEdit={canEdit} object={object} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'valuation' && (
            <ValuationTab canEdit={canEdit} object={object} museum={museum} supabase={supabase} logActivity={logActivity} setLatestValuation={setLatestValuation} form={form} set={set} saving={saving} />
          )}

          {activeTab === 'risk' && (
            <RiskTab canEdit={canEdit} object={object} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'damage' && (
            <DamageTab canEdit={canEdit} object={object} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

          {activeTab === 'exits' && (
            <ExitsTab canEdit={canEdit} object={object} museum={museum} supabase={supabase} logActivity={logActivity} />
          )}

        </form>
        {getPlan(museum?.plan).fullMode && <div className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-20">
            <ObjectProgressSidebar
              sections={[
                { id: 'overview',    label: 'Overview',       complete: !!form.title,
                  fields: [{ label: 'Title', complete: !!form.title }] },
                { id: 'entry',       label: 'Entry',
                  complete: !!(object?.entry_number && object?.entry_date && object?.received_by),
                  fields: [
                    { label: 'Entry number', complete: !!object?.entry_number },
                    { label: 'Entry date',   complete: !!object?.entry_date },
                    { label: 'Entry by',     complete: !!object?.received_by },
                  ] },
                { id: 'acquisition', label: 'Acquisition',
                  complete: !!(form.acquisition_method && form.acquisition_date && form.acquisition_justification && (form.ethics_art_loss_register || form.ethics_cites || form.ethics_dealing_act || form.ethics_human_remains)),
                  fields: [
                    { label: 'Acquisition method',        complete: !!form.acquisition_method },
                    { label: 'Acquisition date',          complete: !!form.acquisition_date },
                    { label: 'Acquisition justification', complete: !!form.acquisition_justification },
                    { label: 'Legal & ethics checks',     complete: !!(form.ethics_art_loss_register || form.ethics_cites || form.ethics_dealing_act || form.ethics_human_remains) },
                  ] },
                { id: 'location',    label: 'Location',       complete: !!form.current_location,
                  fields: [{ label: 'Location', complete: !!form.current_location }] },
                { id: 'condition',   label: 'Condition',
                  complete: !!(form.condition_grade && form.condition_date),
                  fields: [
                    { label: 'Condition grade',   complete: !!form.condition_grade },
                    { label: 'Assessment date',   complete: !!form.condition_date },
                  ] },
                { id: 'rights',      label: 'Rights & Legal', complete: !!(form.copyright_status || form.rights_holder),
                  fields: [
                    { label: 'Rights status', complete: !!form.copyright_status },
                    { label: 'Rights holder', complete: !!form.rights_holder },
                  ] },
                { id: 'valuation',   label: 'Valuation',      complete: !!latestValuation,
                  fields: [{ label: 'Valuation recorded', complete: !!latestValuation }] },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>}
        </div>
        {qrModalOpen && museum && (
          <QRLabelModal
            object={{ id: params.id as string, title: form.title, accession_no: form.accession_no, show_on_site: form.show_on_site }}
            museum={{ slug: museum.slug, name: museum.name }}
            onClose={() => setQrModalOpen(false)}
          />
        )}
        {duplicateModalOpen && museum && (
          <DuplicateSearchModal
            objectId={params.id as string}
            museumId={museum.id}
            existingDuplicateIds={linkedDuplicates.map(d => d.duplicate_of_id)}
            onClose={() => setDuplicateModalOpen(false)}
            onLinked={(linked) => {
              setLinkedDuplicates(prev => [...prev, {
                id: `${params.id}-${linked.id}`,
                duplicate_of_id: linked.id,
                objects: linked,
              }])
              setDuplicateModalOpen(false)
            }}
          />
        )}
    </DashboardShell>
  )
}
