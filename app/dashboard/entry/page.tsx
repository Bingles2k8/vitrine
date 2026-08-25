'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'
import { useToast } from '@/components/Toast'
import { CardGridSkeleton, TableSkeleton } from '@/components/Skeleton'
import SearchFilterBar, { FilterState, EMPTY_FILTERS, SortBy } from '@/components/SearchFilterBar'
import { inputCls, labelCls, ENTRY_REASONS, CONDITION_GRADES, CURRENCIES } from '@/components/tabs/shared'
import {
  resolveCollectionProfile, resolveAppNouns, fieldLabel, fieldPlaceholder,
  fieldVisible, conditionLabel, gradesForAuthority,
} from '@/lib/collectionProfiles'
import { compressImage } from '@/lib/image-compression'
import { uploadToR2 } from '@/lib/r2-upload'
import CSVImportModal from '@/components/CSVImportModal'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'
import SimpleSelect from '@/components/simple/Select'
import DashboardTopBar, { TopBarButton } from '@/components/DashboardTopBar'

const OUTCOME_STYLES: Record<string, string> = {
  'Pending':                 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Acquired':                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Returned to depositor':   'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  'Transferred to loan':     'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'Disposed':                'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

interface MuseumRow {
  id: string
  plan: string
  ui_mode: string | null
  [key: string]: unknown
}

interface EntryObjectRow {
  title: string | null
  accession_no: string | null
  deleted_at: string | null
  description: string | null
  medium: string | null
  physical_materials: string | null
  artist: string | null
  maker_name: string | null
  object_type: string | null
  status: string | null
  created_at: string | null
  production_date: string | null
  acquisition_method: string | null
  accession_register_confirmed: boolean | null
  insured_value?: number | null
}

interface EntryRow {
  id: string
  entry_number: string | null
  entry_date: string
  depositor_name: string | null
  depositor_contact: string | null
  entry_reason: string | null
  object_description: string | null
  object_count: number | null
  received_by: string | null
  outcome: string
  receipt_issued?: boolean | null
  object_id: string | null
  objects: EntryObjectRow | null
}

interface ObjectOption {
  id: string
  title: string | null
  accession_no: string | null
}

export default function EntryRegisterPage() {
  const [museum, setMuseum] = useState<MuseumRow | null>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [entries, setEntries] = useState<EntryRow[]>([])
  const [objects, setObjects] = useState<ObjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState<SortBy>('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const defaultEntry = () => ({
    entry_date: new Date().toISOString().slice(0, 10),
    entry_number: '',
    object_title: '',
    depositor_name: '',
    depositor_contact: '',
    gdpr_consent: false,
    gdpr_consent_date: '',
    entry_reason: '',
    object_description: '',
    object_count: 1,
    received_by: '',
    entry_method: '',
    accession_no: '',
    condition_grade: '',
    // Everything below is optional and lives behind "More details". None of it
    // is required — the required set is exactly what it was before.
    artist: '',
    production_date: '',
    object_type: '',
    medium: '',
    rarity: '',
    cert_authority: '',
    cert_grade: '',
    cert_number: '',
    cert_date: '',
    purchase_price: '',
    purchase_currency: 'GBP',
    purchase_date: '',
  })
  const [newEntry, setNewEntry] = useState(defaultEntry)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [addAnother, setAddAnother] = useState(false)
  // Staged photos, held until the object exists — the storage path is keyed on
  // its id, so they cannot be uploaded before it is created.
  const [entryPhotos, setEntryPhotos] = useState<{ file: File; url: string }[]>([])
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [lookupSource, setLookupSource] = useState<string | null>(null)
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'looking' | 'matched' | 'nomatch' | 'error'>('idle')
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('newEntry') === 'true') {
      setShowForm(true)
    }
  }, [])

  // Simple mode opens straight into the form: someone who clicked "Add a
  // record" has already said what they want to do.
  useEffect(() => {
    if (museum && !getPlan(museum.plan).fullMode) setShowForm(true)
  }, [museum])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      try {
        const [{ data: entries }, { data: objects }] = await Promise.all([
          supabase.from('entry_records').select('*, objects(title, accession_no, deleted_at, description, medium, physical_materials, artist, maker_name, object_type, status, created_at, production_date, acquisition_method, accession_register_confirmed)').eq('museum_id', museum!.id).order('entry_date', { ascending: false }),
          supabase.from('objects').select('id, title, accession_no').eq('museum_id', museum!.id).is('deleted_at', null).order('title'),
        ])
        setMuseum(museum)
        setIsOwner(isOwner)
        setStaffAccess(staffAccess)
        setEntries(entries || [])
        setObjects(objects || [])
      } catch {
        // Queries failed — show empty state rather than infinite loading
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function clearEntryPhoto() {
    entryPhotos.forEach(p => URL.revokeObjectURL(p.url))
    setEntryPhotos([])
  }

  /** Stage files, refusing anything past the plan's per-record image limit. */
  function addEntryPhotos(files: FileList | null) {
    if (!files || files.length === 0) return
    const limit = getPlan(museum?.plan ?? '').imagesPerObject
    setEntryPhotos(prev => {
      const room = limit - prev.length
      if (room <= 0) {
        toast(
          limit === 1
            ? 'Your plan allows one photo per item.'
            : `Your plan allows ${limit} photos per item.`,
          'error',
        )
        return prev
      }
      const taken = Array.from(files).slice(0, room)
      return [...prev, ...taken.map(file => ({ file, url: URL.createObjectURL(file) }))]
    })
  }

  function removeEntryPhoto(url: string) {
    URL.revokeObjectURL(url)
    setEntryPhotos(prev => prev.filter(p => p.url !== url))
  }

  /**
   * Uploads the staged photo once the object exists — the storage path is keyed
   * on the object id, so this can't happen before creation. Failure is not
   * fatal: the object is already saved, so we keep it and let the user retry
   * from the object's own gallery.
   */
  async function uploadEntryPhoto(objectId: string): Promise<void> {
    if (entryPhotos.length === 0 || !museum) return
    let failed = 0
    for (const [i, staged] of entryPhotos.entries()) {
      try {
        const compressed = await compressImage(staged.file)
        const ext = compressed.type === 'image/webp' ? 'webp' : (compressed.name.split('.').pop() || 'jpg')
        const filename = `${museum.id}/${objectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const publicUrl = await uploadToR2('object-images', filename, compressed)
        await fetch(`/api/objects/${objectId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // The first one is primary, which mirrors onto objects.image_url —
          // the column Discover filters on and the "no photo" flag reads.
          body: JSON.stringify({ url: publicUrl, is_primary: i === 0, sort_order: i, phash: null }),
        })
      } catch {
        failed++
      }
    }
    if (failed > 0) {
      // The record is already saved; losing it would be worse than saving it
      // without its picture. Say plainly that it needs one, since a record with
      // no photo stays out of Discover.
      toast(
        failed === entryPhotos.length
          ? 'Saved, but the photo did not upload. Add one from its own page — without it, it stays out of Discover.'
          : `Saved, but ${failed} photo${failed === 1 ? '' : 's'} did not upload. Add them from its own page.`,
        'error',
      )
    }
  }

  async function generateAccessionNo(): Promise<string> {
    const today = new Date()
    const yy = String(today.getFullYear()).slice(-2)
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const prefix = `${yy}${mm}${dd}`
    const { data: sameDay } = await supabase
      .from('objects')
      .select('accession_no')
      .eq('museum_id', museum!.id)
      .like('accession_no', `${prefix}-%`)
    const next = (sameDay?.length ?? 0) + 1
    return `${prefix}-${String(next).padStart(3, '0')}`
  }

  async function handlePromote(entry: EntryRow) {
        const planInfo = getPlan(museum?.plan ?? '')
    const limit = planInfo.objects
    if (limit !== null) {
      const { count } = await supabase
        .from('objects').select('*', { count: 'exact', head: true })
        .eq('museum_id', museum!.id)
        .is('deleted_at', null)
      if (count !== null && count >= limit) {
        toast(`Your ${planInfo.label} plan allows up to ${limit.toLocaleString()} objects. Upgrade your plan to add more.`, 'error')
        return
      }
    }
    const res = await fetch('/api/objects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: entry.objects?.title || entry.object_description || 'Untitled',
        description: entry.object_description || null,
        acquisition_source: entry.depositor_name,
        acquisition_source_contact: entry.depositor_contact,
        acquisition_object_count: entry.object_count,
        number_of_parts: entry.object_count,
        status: 'Entry',
        emoji: '🖼️',
      }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) { toast(payload.error || 'Failed to create object', 'error'); return }
    const newObject = payload.object

    const { error: updateError } = await supabase.from('entry_records').update({ object_id: newObject.id }).eq('id', entry.id)
    if (updateError) { toast(updateError.message, 'error'); return }

    setEntries(entries.map(e => e.id === entry.id ? { ...e, object_id: newObject.id } : e))
    router.push(`/dashboard/objects/${newObject.id}?tab=entry`)
  }

  async function handleBarcodeDetected(code: string, format: string) {
    setScannerOpen(false)

    if (museum?.id) {
      const { data: existing } = await supabase
        .from('objects')
        .select('id, title')
        .eq('museum_id', museum!.id)
        .eq('barcode', code)
        .is('deleted_at', null)
        .maybeSingle()
      if (existing) {
        if (confirm(`You already have this item: "${existing.title}". Open it?`)) {
          router.push(`/dashboard/objects/${existing.id}`)
          return
        }
      }
    }

    setScannedBarcode(code)
    setLookupSource(null)
    setLookupStatus('looking')

    try {
      const res = await fetch('/api/lookup/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, format }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) { setLookupStatus('error'); return }
      if (!payload.match) { setLookupStatus('nomatch'); return }
      const m = payload.match
      setNewEntry(v => ({
        ...v,
        object_title: v.object_title || m.title || '',
        object_description: v.object_description || [m.artist, m.year, m.description].filter(Boolean).join(' · ') || '',
      }))
      setLookupSource(m.source || null)
      setLookupStatus('matched')
    } catch {
      setLookupStatus('error')
    }
  }

  async function handleCreateEntry(mode: 'stay' | 'continue' | 'again') {
    const { entry_date, object_title, depositor_name, entry_reason, object_description, received_by, accession_no } = newEntry
    const trackDepositor = getPlan(museum?.plan ?? '').depositorTracking
    // Simple mode asks for a title and nothing else. The date is set to today
    // behind the scenes, the reference number generates itself, and the
    // description is optional — entry_records (where it is NOT NULL) is only
    // written on compliance plans, and objects.description is nullable.
    const requiredMissing = fullMode
      ? (!entry_date || !object_title || !entry_reason || !object_description || !accession_no ||
         (trackDepositor && (!depositor_name || !received_by)))
      : !object_title
    if (requiredMissing) {
      toast(
        fullMode ? 'Please fill in all required fields.' : `Give it a name first — everything else can wait.`,
        'error',
      )
      return
    }
    // A photo is required in simple mode. Records without one look empty on a
    // public page and are kept out of Discover, so the form asks up front
    // rather than letting someone find out weeks later.
    if (!fullMode && entryPhotos.length === 0) {
      toast('Add a photo before saving — records without one stay out of Discover.', 'error')
      return
    }
    // Check plan limits
    const planInfo = getPlan(museum?.plan ?? '')
    const limit = planInfo.objects
    if (limit !== null) {
      const { count } = await supabase.from('objects').select('*', { count: 'exact', head: true }).eq('museum_id', museum!.id).is('deleted_at', null)
      if (count !== null && count >= limit) {
        toast(`Your ${planInfo.label} plan allows up to ${limit.toLocaleString()} objects. Upgrade your plan to add more.`, 'error')
        return
      }
    }
    setSubmitting(true)
    const year = new Date(entry_date).getFullYear()
    const yearEntries = entries.filter(e => e.entry_number?.startsWith(`EN-${year}-`))
    const entryNumber = newEntry.entry_number.trim() || `EN-${year}-${String(yearEntries.length + 1).padStart(3, '0')}`
    // An entry record is the Spectrum "Object Entry" procedure — a compliance
    // artefact, and the database deliberately restricts INSERTs on it to
    // compliance plans (supabase/compliance-rls-plan-gate.sql).
    //
    // Simple-mode collectors reach this same screen as their "Add item" flow,
    // so writing an entry record for them hit that policy and failed the whole
    // add with "new row violates row-level security policy". They don't need
    // one: create the object and skip the register.
    const keepsEntryRegister = getPlan(museum?.plan ?? '').compliance
    let created: EntryRow | null = null

    if (keepsEntryRegister) {
      const { data, error } = await supabase.from('entry_records').insert({
        museum_id: museum!.id,
        entry_number: entryNumber,
        entry_date: newEntry.entry_date,
        depositor_name: newEntry.depositor_name,
        depositor_contact: newEntry.depositor_contact || null,
        gdpr_consent: newEntry.gdpr_consent,
        gdpr_consent_date: newEntry.gdpr_consent && newEntry.gdpr_consent_date ? newEntry.gdpr_consent_date : newEntry.gdpr_consent ? new Date().toISOString().slice(0, 10) : null,
        entry_reason: newEntry.entry_reason,
        object_description: newEntry.object_description,
        object_count: newEntry.object_count,
        received_by: newEntry.received_by,
        entry_method: newEntry.entry_method || null,
        outcome: 'Pending',
      }).select('*').single()
      if (error) { toast(error.message, 'error'); setSubmitting(false); return }
      created = data as EntryRow
    }
    // Create the object — auto-generate accession_no for simple mode if blank
    const finalAccessionNo = newEntry.accession_no.trim() || (!fullMode ? await generateAccessionNo() : null)
    const res = await fetch('/api/objects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newEntry.object_title,
        description: newEntry.object_description || null,
        acquisition_source: newEntry.depositor_name,
        acquisition_source_contact: newEntry.depositor_contact || null,
        acquisition_object_count: newEntry.object_count,
        number_of_parts: newEntry.object_count,
        accession_no: finalAccessionNo,
        status: 'Entry',
        emoji: '🖼️',
        condition_grade: newEntry.condition_grade || null,
        barcode: scannedBarcode || null,
        // Everything from "More details". Optional, but whatever was typed has
        // to land on the object — otherwise the user types it twice.
        artist: newEntry.artist || null,
        production_date: newEntry.production_date || null,
        year: newEntry.production_date || null,
        object_type: newEntry.object_type || null,
        medium: newEntry.medium || null,
        rarity: newEntry.rarity || null,
        cert_authority: newEntry.cert_authority || null,
        cert_grade: newEntry.cert_grade || null,
        cert_number: newEntry.cert_number || null,
        cert_date: newEntry.cert_date || null,
        acquisition_value: newEntry.purchase_price === '' ? null : Number(newEntry.purchase_price),
        acquisition_currency: newEntry.purchase_currency || null,
        acquisition_date: newEntry.purchase_date || newEntry.entry_date || null,
        // cert_grade_numeric / cert_grade_scale / derived condition are the
        // server's job — see /api/objects and invariant G2.
      }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) { toast(payload.error || 'Failed to create object', 'error'); setSubmitting(false); return }
    const newObject = payload.object
    await uploadEntryPhoto(newObject.id)
    if (created) {
      await supabase.from('entry_records').update({ object_id: newObject.id }).eq('id', created.id)
    }
    if (mode === 'continue') {
      router.push(`/dashboard/objects/${newObject.id}`)
    } else {
      if (created) {
        setEntries([{
          ...created,
          object_id: newObject.id,
          // finalAccessionNo, not the raw form field — simple mode generates it,
          // so the form value is blank and the optimistic row showed no number.
          objects: {
            title: newEntry.object_title,
            accession_no: finalAccessionNo,
            deleted_at: null,
            description: newEntry.object_description || null,
            medium: null,
            physical_materials: null,
            artist: null,
            maker_name: null,
            object_type: null,
            status: 'Entry',
            created_at: new Date().toISOString(),
            production_date: null,
            acquisition_method: null,
            accession_register_confirmed: null,
          },
        }, ...entries])
      }
      setNewEntry(defaultEntry())
      clearEntryPhoto()
      setShowMoreDetails(false)
      // 'again' leaves the form open and empty so a run of additions never
      // needs a round trip through the list.
      setShowForm(mode === 'again')
      setSubmitting(false)
      setScannedBarcode(null)
      setLookupSource(null)
      setLookupStatus('idle')
      // Without an entry record there's no new row to see, so the toast is the
      // only confirmation a simple-mode collector gets — name the item.
      toast(
        created ? `Entry ${entryNumber} recorded.` : `"${newEntry.object_title}" added.`,
        'success',
      )
    }
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/entry" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <CardGridSkeleton cards={4} />
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'
  const simple = museum?.ui_mode === 'simple'
  const fullMode = getPlan(museum?.plan ?? '').fullMode
  const photoLimit = getPlan(museum?.plan ?? '').imagesPerObject

  // Collection-wide profile, so the entry form speaks the same language as the
  // object form and the nav. Full mode resolves to the museum vocabulary and a
  // mixed collection resolves to neutral — see plan §6.3.
  const entryProfile = resolveCollectionProfile(museum)
  const nouns = resolveAppNouns(museum)
  const ef = (key: Parameters<typeof fieldLabel>[1], fallback: string) => fieldLabel(entryProfile, key, fallback)
  const eph = (key: Parameters<typeof fieldPlaceholder>[1], fallback?: string) => fieldPlaceholder(entryProfile, key, fallback)
  const eshown = (key: Parameters<typeof fieldVisible>[1]) => fieldVisible(entryProfile, key)
  const certConfig = entryProfile.certification
  const certGrades = gradesForAuthority(certConfig, newEntry.cert_authority || null)
  const trackDepositor = getPlan(museum?.plan ?? '').depositorTracking
  const pending = entries.filter(e => e.outcome === 'Pending').length

  const mediumOptions = Array.from(new Set(entries.map(e => e.objects?.medium).filter(Boolean))).sort() as string[]
  const objectTypeOptions = Array.from(new Set(entries.map(e => e.objects?.object_type).filter(Boolean))).sort() as string[]
  const artistOptions = Array.from(new Set(
    entries.flatMap(e => [e.objects?.artist, e.objects?.maker_name]).filter(Boolean)
  )).sort() as string[]

  const q = searchQuery.trim().toLowerCase()
  const filteredEntries = entries
    .filter(e => {
      if (filters.dateFrom && (e.entry_date || '') < filters.dateFrom) return false
      if (filters.dateTo && (e.entry_date || '') > filters.dateTo) return false
      if (filters.medium && e.objects?.medium !== filters.medium) return false
      if (filters.objectType && e.objects?.object_type !== filters.objectType) return false
      if (fullMode) {
        if (filters.status && e.objects?.status !== filters.status) return false
        if (filters.accessionStatus === 'confirmed' && !e.objects?.accession_register_confirmed) return false
        if (filters.accessionStatus === 'unconfirmed' && e.objects?.accession_register_confirmed) return false
        if (filters.acquisitionMethod && e.objects?.acquisition_method !== filters.acquisitionMethod) return false
      } else {
        if (filters.artist && e.objects?.artist !== filters.artist && e.objects?.maker_name !== filters.artist) return false
      }
      if (!q) return true
      return (
        e.objects?.title?.toLowerCase().includes(q) ||
        e.objects?.accession_no?.toLowerCase().includes(q) ||
        e.object_description?.toLowerCase().includes(q) ||
        e.entry_number?.toLowerCase().includes(q) ||
        e.objects?.description?.toLowerCase().includes(q) ||
        e.objects?.medium?.toLowerCase().includes(q) ||
        e.objects?.physical_materials?.toLowerCase().includes(q) ||
        e.objects?.artist?.toLowerCase().includes(q) ||
        e.objects?.maker_name?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') return (a.objects?.title || a.object_description || '').localeCompare(b.objects?.title || b.object_description || '')
      if (sortBy === 'date_added') return (b.objects?.created_at || '').localeCompare(a.objects?.created_at || '')
      if (sortBy === 'date_made') return (b.objects?.production_date || '').localeCompare(a.objects?.production_date || '')
      if (sortBy === 'insured_value') return (b.objects?.insured_value ?? 0) - (a.objects?.insured_value ?? 0)
      return 0
    })
  const acquired = entries.filter(e => e.outcome === 'Acquired').length
  const returned = entries.filter(e => e.outcome === 'Returned to depositor').length

  return (
    <DashboardShell museum={museum} activePath="/dashboard/entry" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <DashboardTopBar
          title={fullMode ? 'Object Entry Register' : nouns.addItem}
          actions={canEdit && (
            <>
              {getPlan(museum?.plan ?? '').analytics && (
                <TopBarButton variant="primary" onClick={() => setShowImport(true)}>
                  Import CSV
                </TopBarButton>
              )}
              {fullMode && (
              <TopBarButton variant="primary" onClick={() => setShowForm(v => !v)}>
                {showForm ? 'Cancel' : '+ New Entry'}
              </TopBarButton>
              )}
            </>
          )}
          subRow={
            <SearchFilterBar
              searchQuery={searchQuery} onSearchChange={setSearchQuery}
              filters={filters} onFiltersChange={setFilters}
              sortBy={sortBy} onSortChange={setSortBy}
              isFullMode={fullMode}
              mediumOptions={mediumOptions} objectTypeOptions={objectTypeOptions} artistOptions={artistOptions}
              placeholder={fullMode ? 'Search entries…' : `Search your ${nouns.collection.toLowerCase()}…`}
            />
          }
        />

        <div className="p-6 md:p-10 space-y-6">
          {/* Stats — entry-record counts only mean something in full mode */}
          {fullMode && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Entries', value: entries.length },
              ...(fullMode ? [
                { label: 'Pending Outcome', value: pending },
                { label: 'Acquired', value: acquired },
                { label: 'Returned', value: returned },
              ] : []),
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.label === 'Pending Outcome' && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>
          )}

          {/* Object usage bar */}
          {(() => {
            const planInfo = getPlan(museum?.plan ?? '')
            const limit = planInfo.objects
            if (limit === null) return null
            const count = objects.length
            const pct = Math.min(100, Math.round((count / limit) * 100))
            const barColor = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-stone-400 dark:bg-stone-500'
            const textColor = pct >= 95 ? 'text-red-600 dark:text-red-400' : pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
            return (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Collection usage</span>
                    <span className={`text-xs font-mono ${textColor}`}>{count.toLocaleString()} / {limit.toLocaleString()} objects</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {pct >= 80 && (
                  <button
                    onClick={() => router.push('/dashboard/plan')}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors"
                  >
                    Upgrade →
                  </button>
                )}
              </div>
            )
          })()}


          {/* Info banner */}
          {fullMode && (
            <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
              <p className="text-xs text-stone-500 dark:text-stone-400">Entry details are edited on each object&apos;s page. Click an entry below to open it, or create a new object to begin.</p>
            </div>
          )}

          {/* New Entry Form */}
          {showForm && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{fullMode ? 'New Entry Record' : nouns.addItem}</div>

              {(() => {
                const clearBarcode = () => { setScannedBarcode(null); setLookupSource(null); setLookupStatus('idle') }
                const panelBase = 'w-full flex items-center gap-4 px-4 py-4 rounded-lg border-2 transition-colors text-left'
                const stateClass =
                  lookupStatus === 'matched'  ? 'border-solid border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700' :
                  lookupStatus === 'nomatch'  ? 'border-solid border-stone-300 bg-stone-50 dark:bg-stone-800/40 dark:border-stone-700' :
                  lookupStatus === 'error'    ? 'border-solid border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800' :
                  lookupStatus === 'looking'  ? 'border-solid border-stone-300 bg-stone-50 dark:bg-stone-800/40 dark:border-stone-700 cursor-wait' :
                  'border-dashed border-stone-300 dark:border-stone-700 hover:border-stone-900 dark:hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                const icon =
                  lookupStatus === 'matched'  ? '✓' :
                  lookupStatus === 'nomatch'  ? 'ℹ' :
                  lookupStatus === 'error'    ? '⚠' :
                  lookupStatus === 'looking'  ? '⏳' :
                  '📷'
                const title =
                  lookupStatus === 'matched'  ? `Filled from ${lookupSource || 'lookup'}` :
                  lookupStatus === 'nomatch'  ? 'No match found — enter manually' :
                  lookupStatus === 'error'    ? 'Lookup failed — tap to try again' :
                  lookupStatus === 'looking'  ? `Looking up ${scannedBarcode}…` :
                  (fullMode ? 'Scan a barcode to auto-fill' : 'Got a barcode? Scan it and we\u2019ll fill the rest in')
                const subtitle =
                  lookupStatus === 'idle'     ? (fullMode ? 'Books (ISBN), music, or retail items (UPC / EAN)' : 'Works for most records, books and games with a barcode on the back') :
                  scannedBarcode              ? `Barcode: ${scannedBarcode}` :
                  null
                return (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      disabled={lookupStatus === 'looking'}
                      className={`${panelBase} ${stateClass}`}
                    >
                      <span className="text-2xl flex-shrink-0" aria-hidden>{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{title}</div>
                        {subtitle && <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mt-0.5 truncate">{subtitle}</div>}
                      </div>
                      {lookupStatus === 'idle' && (
                        <span className="text-xs font-mono text-stone-400 dark:text-stone-500 flex-shrink-0">Tap to scan →</span>
                      )}
                    </button>
                    {scannedBarcode && lookupStatus !== 'looking' && (
                      <button
                        type="button"
                        onClick={clearBarcode}
                        className="absolute top-2 right-2 text-xs font-mono underline text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                      >
                        clear
                      </button>
                    )}
                  </div>
                )
              })()}

              {/* Photos lead the form and are required. A record without one
                  shows as a grey tile with an emoji in it, and is left out of
                  the public Discover directory — so the form asks for one
                  rather than letting people find that out later.
                  `capture` opens the camera straight away on a phone, which is
                  where most things get added, with a plain picker beside it. */}
              <div>
                <label className={labelCls}>
                  {entryPhotos.length > 1 ? 'Photos' : 'Photo'} <span className="text-red-400">*</span>
                </label>

                {entryPhotos.length === 0 ? (
                  <div className="border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg px-5 py-7 flex flex-col items-center gap-3 text-center bg-stone-50 dark:bg-stone-800/40">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 dark:text-stone-500">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-stone-800 dark:text-stone-200">
                        Take a photo of it
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                        {photoLimit === 1
                          ? 'One photo per item on your plan'
                          : `Up to ${photoLimit} per item`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                      <label className="inline-flex items-center justify-center min-h-11 gap-2 text-sm font-mono bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white rounded px-5 cursor-pointer transition-colors">
                        <input type="file" accept="image/*" capture="environment" multiple={photoLimit > 1} className="hidden"
                          onChange={e => { addEntryPhotos(e.target.files); e.currentTarget.value = '' }} />
                        Take a photo
                      </label>
                      <label className="inline-flex items-center justify-center min-h-11 text-sm font-mono text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600 rounded px-4 cursor-pointer hover:bg-white dark:hover:bg-stone-800 transition-colors">
                        <input type="file" accept="image/*" multiple={photoLimit > 1} className="hidden"
                          onChange={e => { addEntryPhotos(e.target.files); e.currentTarget.value = '' }} />
                        Choose an existing one
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    {entryPhotos.map(ph => (
                      <div key={ph.url} className="relative">
                        <img src={ph.url} alt="" className="w-24 h-24 object-cover rounded border border-stone-200 dark:border-stone-700" />
                        <button
                          type="button"
                          onClick={() => removeEntryPhoto(ph.url)}
                          aria-label="Remove this photo"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center shadow hover:bg-stone-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {entryPhotos.length < photoLimit && (
                      <label className="w-24 h-24 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded text-stone-500 dark:text-stone-400 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <input type="file" accept="image/*" capture="environment" multiple className="hidden"
                          onChange={e => { addEntryPhotos(e.target.files); e.currentTarget.value = '' }} />
                        <span className="text-lg leading-none">+</span>
                        <span className="text-[10px] font-mono">Add another</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Simple mode asks two things. The date is today, the reference
                  number generates itself, and everything else waits behind
                  "More details" — which is now a panel you can see, not a text
                  link. Labels come from the collection profile, so a vinyl
                  collection reads "Album / Title" and "Artist". */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{ef('title', 'What is it?')} <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    className={inputCls}
                    autoFocus
                    placeholder={eph('title', `Name of the ${nouns.item.toLowerCase()}`)}
                    value={newEntry.object_title}
                    onChange={e => setNewEntry(v => ({ ...v, object_title: e.target.value }))}
                  />
                </div>
                {eshown('artist') && (
                  <div>
                    <label className={labelCls}>{ef('artist', 'Who\u2019s it by?')}</label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder={eph('artist', 'Leave blank if you\u2019re not sure')}
                      value={newEntry.artist}
                      onChange={e => setNewEntry(v => ({ ...v, artist: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {fullMode && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>{ef('title', 'Object Title')} <span className="text-red-400">*</span></label>
                  <input type="text" className={inputCls} placeholder={eph('title', 'Name or title of the object')} value={newEntry.object_title} onChange={e => setNewEntry(v => ({ ...v, object_title: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Entry Date <span className="text-red-400">*</span></label>
                  <input type="date" className={inputCls} value={newEntry.entry_date} onChange={e => setNewEntry(v => ({ ...v, entry_date: e.target.value }))} />
                </div>
                {fullMode && (
                  <div>
                    <label className={labelCls}>Entry Number</label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder={(() => {
                        const year = new Date(newEntry.entry_date).getFullYear()
                        const yearEntries = entries.filter(e => e.entry_number?.startsWith(`EN-${year}-`))
                        return `EN-${year}-${String(yearEntries.length + 1).padStart(3, '0')} (auto)`
                      })()}
                      value={newEntry.entry_number}
                      onChange={e => setNewEntry(v => ({ ...v, entry_number: e.target.value }))}
                    />
                  </div>
                )}
                {trackDepositor && (
                  <div>
                    <label className={labelCls}>Donor Name <span className="text-red-400">*</span></label>
                    <input type="text" className={inputCls} placeholder="Name of donor" value={newEntry.depositor_name} onChange={e => setNewEntry(v => ({ ...v, depositor_name: e.target.value }))} />
                  </div>
                )}
                {trackDepositor && (
                  <div>
                    <label className={labelCls}>Donor Contact</label>
                    <input type="text" className={inputCls} placeholder="Email or phone" value={newEntry.depositor_contact} onChange={e => setNewEntry(v => ({ ...v, depositor_contact: e.target.value }))} />
                  </div>
                )}
                {trackDepositor && (
                  <div className="flex flex-col justify-end gap-2 pt-1">
                    <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input type="checkbox" checked={newEntry.gdpr_consent} onChange={e => setNewEntry(v => ({ ...v, gdpr_consent: e.target.checked }))} className="rounded border-stone-300 dark:border-stone-600 accent-stone-900" />
                      <span className="text-xs font-mono text-stone-500 dark:text-stone-400">GDPR consent obtained</span>
                    </label>
                    {newEntry.gdpr_consent && (
                      <div>
                        <label className={labelCls}>Consent Date</label>
                        <input type="date" className={inputCls} value={newEntry.gdpr_consent_date} onChange={e => setNewEntry(v => ({ ...v, gdpr_consent_date: e.target.value }))} />
                      </div>
                    )}
                  </div>
                )}
                {fullMode && (
                  <div>
                    <label className={labelCls}>Entry Reason <span className="text-red-400">*</span></label>
                    <select className={inputCls} value={newEntry.entry_reason} onChange={e => setNewEntry(v => ({ ...v, entry_reason: e.target.value }))}>
                      <option value="">Select reason…</option>
                      {ENTRY_REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}
                {fullMode && (
                  <div>
                    <label className={labelCls}>Entry Method</label>
                    <select className={inputCls} value={newEntry.entry_method} onChange={e => setNewEntry(v => ({ ...v, entry_method: e.target.value }))}>
                      <option value="">Select method…</option>
                      {['In person', 'Courier', 'Post / carrier', 'Found in collection', 'Digital transfer'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                )}
                {trackDepositor && (
                  <div>
                    <label className={labelCls}>Entry By <span className="text-red-400">*</span></label>
                    <input type="text" className={inputCls} placeholder="Staff member name" value={newEntry.received_by} onChange={e => setNewEntry(v => ({ ...v, received_by: e.target.value }))} />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={labelCls}>{ef('description', fullMode ? 'Object Description' : 'Description')} <span className="text-red-400">*</span></label>
                  <textarea className={inputCls} rows={2} placeholder={eph('description', fullMode ? 'Brief description of the object(s)' : `Brief description of the ${nouns.item.toLowerCase()}`)} value={newEntry.object_description} onChange={e => setNewEntry(v => ({ ...v, object_description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className={labelCls}>{fullMode ? 'Object Count' : `Number of ${nouns.itemPlural}`}</label>
                    <input type="number" min={1} className={inputCls} value={newEntry.object_count} onChange={e => setNewEntry(v => ({ ...v, object_count: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <div>
                    <label className={labelCls + ' flex items-center gap-1.5'}>
                      {fullMode ? 'Object Number' : `${nouns.item} Number`} {fullMode && <span className="text-red-400">*</span>}
                      {!fullMode && (
                        <span className="relative group/tip inline-flex items-center">
                          <span className="cursor-help text-stone-400 dark:text-stone-500 text-[10px] border border-stone-300 dark:border-stone-600 rounded-full w-3.5 h-3.5 flex items-center justify-center">?</span>
                          <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-60 max-w-[calc(100vw-2rem)] p-2.5 bg-stone-900 text-white text-[11px] normal-case tracking-normal rounded shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 pointer-events-none leading-relaxed">
                            Optional — we&apos;ll generate one automatically (YYMMDD-001). Set your own if you want to distinguish multiple objects with the same name.
                          </span>
                        </span>
                      )}
                    </label>
                    <input type="text" className={inputCls} placeholder={fullMode ? 'e.g. 2026.001' : 'Auto — leave blank to generate'} value={newEntry.accession_no} onChange={e => setNewEntry(v => ({ ...v, accession_no: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>{ef('condition_grade', 'Condition Grade')}</label>
                    <select className={inputCls} value={newEntry.condition_grade} onChange={e => setNewEntry(v => ({ ...v, condition_grade: e.target.value }))}>
                      <option value="">— Select —</option>
                      {/* Stored value stays canonical; only the label changes. */}
                      {CONDITION_GRADES.map(g => <option key={g} value={g}>{conditionLabel(entryProfile, g)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              )}

              {/*
                Optional cataloguing detail. Collapsed by default so the quick
                path — title, description, done — stays quick for someone adding
                forty things in a row. Nothing in here is required.
              */}
              <div className={fullMode ? 'border-t border-stone-200 dark:border-stone-700 pt-4' : ''}>
                {fullMode ? (
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails(v => !v)}
                    className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    <span className={`inline-block transition-transform ${showMoreDetails ? 'rotate-90' : ''}`}>›</span>
                    {showMoreDetails ? 'Hide extra details' : 'More details — optional'}
                  </button>
                ) : (
                  /* A bordered panel with its own header bar, a chevron that
                     turns and a Show/Hide word. The old text link read as
                     decoration, so nobody opened it. */
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails(v => !v)}
                    aria-expanded={showMoreDetails}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-left hover:bg-stone-200/70 dark:hover:bg-stone-700/60 transition-colors ${showMoreDetails ? 'rounded-t-md border-b-0' : 'rounded-md'}`}
                  >
                    <svg
                      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-stone-700 dark:text-stone-300 flex-shrink-0 transition-transform ${showMoreDetails ? '' : '-rotate-90'}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">More details</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
                      — every one of these is optional
                    </span>
                    <span className="ml-auto text-xs font-mono text-stone-500 dark:text-stone-400 flex-shrink-0">
                      {showMoreDetails ? 'Hide' : 'Show'}
                    </span>
                  </button>
                )}

                {showMoreDetails && (
                  <div className={fullMode
                    ? 'mt-4 space-y-5'
                    : 'space-y-5 p-4 border border-stone-300 dark:border-stone-600 border-t-0 rounded-b-md bg-white dark:bg-stone-900'}>
                    {/* The fields simple mode moved out of the main form: what
                        it is worth remembering, how many, its reference number
                        and its condition. All optional. */}
                    {!fullMode && (
                      <div className="space-y-4">
                        <div>
                          <label className={labelCls}>Anything you want to remember</label>
                          <textarea
                            className={inputCls} rows={2}
                            placeholder={eph('description', `Where you found it, what condition it\u2019s really in, why you wanted it\u2026`)}
                            value={newEntry.object_description}
                            onChange={e => setNewEntry(v => ({ ...v, object_description: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className={labelCls}>{ef('condition_grade', 'Condition')}</label>
                            <SimpleSelect
                              value={newEntry.condition_grade}
                              onChange={next => setNewEntry(v => ({ ...v, condition_grade: next }))}
                              options={CONDITION_GRADES}
                              labelFor={g => conditionLabel(entryProfile, g)}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>How many</label>
                            <input type="number" min={1} className={inputCls} value={newEntry.object_count}
                              onChange={e => setNewEntry(v => ({ ...v, object_count: parseInt(e.target.value) || 1 }))} />
                          </div>
                          <div>
                            <label className={labelCls}>Reference number</label>
                            <input type="text" className={inputCls} placeholder="We&rsquo;ll make one up"
                              value={newEntry.accession_no}
                              onChange={e => setNewEntry(v => ({ ...v, accession_no: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cataloguing basics, in the collection's own words */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {fullMode && eshown('artist') && (
                        <div>
                          <label className={labelCls}>{ef('artist', 'Artist / Maker')}</label>
                          <input type="text" className={inputCls} placeholder={eph('artist')}
                            value={newEntry.artist} onChange={e => setNewEntry(v => ({ ...v, artist: e.target.value }))} />
                        </div>
                      )}
                      {eshown('production_date') && (
                        <div>
                          <label className={labelCls}>{ef('production_date', 'Date')}</label>
                          <input type="text" className={inputCls} placeholder={eph('production_date', 'e.g. 1850, c.1920–1930')}
                            value={newEntry.production_date} onChange={e => setNewEntry(v => ({ ...v, production_date: e.target.value }))} />
                        </div>
                      )}
                      {eshown('object_type') && (
                        <div>
                          <label className={labelCls}>{ef('object_type', 'Object Type')}</label>
                          {/* A dropdown when the collection profile knows the
                              options — a vinyl collection picks LP or 7" rather
                              than typing it. Free text otherwise. */}
                          {!fullMode && (entryProfile.vocab.objectTypes?.length ?? 0) > 0 ? (
                            <SimpleSelect
                              value={newEntry.object_type}
                              onChange={next => setNewEntry(v => ({ ...v, object_type: next }))}
                              options={entryProfile.vocab.objectTypes ?? []}
                            />
                          ) : (
                            <input type="text" className={inputCls} placeholder={eph('object_type', 'e.g. Painting, Sculpture…')}
                              value={newEntry.object_type} onChange={e => setNewEntry(v => ({ ...v, object_type: e.target.value }))} />
                          )}
                        </div>
                      )}
                      {eshown('medium') && (
                        <div>
                          <label className={labelCls}>{ef('medium', 'Medium / Material')}</label>
                          <input type="text" className={inputCls} placeholder={eph('medium', 'e.g. oak, silver, oil on canvas…')}
                            value={newEntry.medium} onChange={e => setNewEntry(v => ({ ...v, medium: e.target.value }))} />
                        </div>
                      )}
                      {eshown('rarity') && (
                        <div>
                          <label className={labelCls}>{ef('rarity', 'Edition / Rarity')}</label>
                          <input type="text" className={inputCls} placeholder={eph('rarity', 'e.g. 1 of 500, First Edition')}
                            value={newEntry.rarity} onChange={e => setNewEntry(v => ({ ...v, rarity: e.target.value }))} />
                        </div>
                      )}
                    </div>

                    {/* Grading — only for collections where it's a thing. The
                        slab is in the user's hand at this moment, so this is
                        the cheapest time to capture it. */}
                    {certConfig && (
                      <div>
                        <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">{certConfig.title}</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className={labelCls}>{certConfig.labels?.authority ?? 'Grading Company'}</label>
                            <select className={inputCls} value={newEntry.cert_authority}
                              onChange={e => {
                                const next = e.target.value
                                // A PSA 9 is not a PCGS grade — drop an incompatible one.
                                const keep = gradesForAuthority(certConfig, next || null).includes(newEntry.cert_grade)
                                setNewEntry(v => ({ ...v, cert_authority: next, cert_grade: keep ? v.cert_grade : '' }))
                              }}>
                              <option value="">— Not recorded —</option>
                              {certConfig.authorities.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>{certConfig.labels?.grade ?? 'Grade'}</label>
                            <select className={inputCls} value={newEntry.cert_grade} disabled={certGrades.length === 0}
                              onChange={e => setNewEntry(v => ({ ...v, cert_grade: e.target.value }))}>
                              <option value="">{certGrades.length === 0 ? '— Not applicable —' : '— Select —'}</option>
                              {certGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>{certConfig.labels?.number ?? 'Cert Number'}</label>
                            <input type="text" className={`${inputCls} font-mono`} disabled={!newEntry.cert_authority}
                              placeholder={newEntry.cert_authority ? 'As printed on the label' : 'Choose a company first'}
                              value={newEntry.cert_number} onChange={e => setNewEntry(v => ({ ...v, cert_number: e.target.value }))} />
                          </div>
                          <div>
                            <label className={labelCls}>{certConfig.labels?.date ?? 'Graded'}</label>
                            <input type="date" className={inputCls} disabled={!newEntry.cert_authority}
                              value={newEntry.cert_date} onChange={e => setNewEntry(v => ({ ...v, cert_date: e.target.value }))} />
                          </div>
                        </div>
                        {certConfig.derivesCondition && newEntry.cert_grade && (
                          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
                            Condition will be set from the grade automatically.
                          </p>
                        )}
                      </div>
                    )}

                    {/* What you paid */}
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">What you paid</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelCls}>Price</label>
                          <input type="number" step="0.01" min="0" className={inputCls} placeholder="0.00"
                            value={newEntry.purchase_price} onChange={e => setNewEntry(v => ({ ...v, purchase_price: e.target.value }))} />
                        </div>
                        <div>
                          <label className={labelCls}>Currency</label>
                          {fullMode ? (
                            <select className={inputCls} value={newEntry.purchase_currency}
                              onChange={e => setNewEntry(v => ({ ...v, purchase_currency: e.target.value }))}>
                              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          ) : (
                            <SimpleSelect
                              value={newEntry.purchase_currency}
                              onChange={next => setNewEntry(v => ({ ...v, purchase_currency: next }))}
                              options={CURRENCIES}
                              placeholder="GBP"
                            />
                          )}
                        </div>
                        <div>
                          <label className={labelCls}>Date bought</label>
                          <input type="date" className={inputCls}
                            value={newEntry.purchase_date} onChange={e => setNewEntry(v => ({ ...v, purchase_date: e.target.value }))} />
                        </div>
                      </div>
                    </div>

                    {/* Full mode keeps its optional photo here. Simple mode's
                        photos moved to the top of the form, where they are
                        required — see PhotoField. */}
                    {fullMode && (
                      <div>
                        <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Photo</div>
                        {entryPhotos[0] ? (
                          <div className="flex items-center gap-4">
                            <img src={entryPhotos[0].url} alt="" className="w-24 h-24 object-cover rounded border border-stone-200 dark:border-stone-700" />
                            <button type="button" onClick={clearEntryPhoto}
                              className="text-xs font-mono underline text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-stone-400 border border-dashed border-stone-300 dark:border-stone-600 rounded px-4 py-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => addEntryPhotos(e.target.files)} />
                            + Add a photo
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {fullMode ? (
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleCreateEntry('stay')}
                    disabled={submitting}
                    className="text-sm font-mono border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Saving…' : 'Record Entry'}
                  </button>
                </div>
              ) : (
                /* One primary action. The old pair — "Save Record" beside
                   "Save & open record →" — asked a first-time user to choose
                   between two things that both looked like saving. Adding
                   several in a row is now a preference, not a second button. */
                <div className="flex items-center gap-4 flex-wrap pt-2">
                  <button
                    onClick={() => handleCreateEntry(addAnother ? 'again' : 'stay')}
                    disabled={submitting || entryPhotos.length === 0 || !newEntry.object_title.trim()}
                    title={entryPhotos.length === 0 ? 'Add a photo first' : undefined}
                    className="text-sm font-mono bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white rounded px-6 py-2.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving…' : `Save ${nouns.item.toLowerCase()}`}
                  </button>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addAnother}
                      onChange={e => setAddAnother(e.target.checked)}
                      className="rounded border-stone-300 dark:border-stone-600 accent-amber-600 w-4 h-4"
                    />
                    <span className="text-sm text-stone-700 dark:text-stone-300">Start another one straight after</span>
                  </label>

                  <button
                    onClick={() => { setNewEntry(defaultEntry()); clearEntryPhoto() }}
                    disabled={submitting}
                    className="text-sm font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors ml-auto disabled:opacity-50"
                  >
                    Clear this form
                  </button>
                </div>
              )}

              {!fullMode && (
                <p className="text-xs font-mono text-stone-400 dark:text-stone-500 leading-relaxed pt-1">
                  Saved {nouns.itemPlural.toLowerCase()} get today&rsquo;s date and a reference number
                  automatically, and stay private until you choose to show them.
                </p>
              )}
            </div>
          )}

          {/*
            The entry register is the Spectrum Object Entry procedure and only
            compliance plans write to it, so a simple-mode collection with no
            legacy entries has nothing to show here — an empty compliance
            register under a screen titled "Add Card" is just confusing. Their
            items live in the collection list instead.
          */}
          {entries.length === 0 && !fullMode ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">{'\u{1F5C2}'}</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">
                Add to your {nouns.collection.toLowerCase()}
              </div>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">
                Everything you add with the form above appears in your {nouns.collection.toLowerCase()}.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline underline-offset-2 transition-colors"
              >
                View {nouns.collection.toLowerCase()} {'\u2192'}
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">{'\u{1F5C2}'}</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No entry records yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Record every object that comes into your care, before any decision is made.</p>
              {canEdit && (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-sm font-mono text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  + New Entry
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Entry No.</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Date</th>
                    {trackDepositor && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Donor</th>}
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Entry Reason</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Objects</th>
                    {trackDepositor && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Entry By</th>}
                    {fullMode && <th data-learn="entry.outcome" className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Outcome</th>}
                    {!simple && trackDepositor && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Receipt</th>}
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Object</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(e => (
                    <tr key={e.id}
                      className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${e.objects?.deleted_at ? 'cursor-default' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (e.objects?.deleted_at) return
                        if (e.object_id) { router.push(`/dashboard/objects/${e.object_id}`); return }
                        if (canEdit) handlePromote(e)
                      }}
                    >
                      <td className="px-6 py-4 text-xs font-mono text-stone-600 dark:text-stone-400">{e.entry_number}</td>
                      <td className="px-4 py-4 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {new Date(e.entry_date + 'T00:00:00').toLocaleDateString('en-GB')}
                      </td>
                      {trackDepositor && (
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{e.depositor_name}</div>
                          {e.objects && <div className="text-xs text-stone-400 dark:text-stone-500">{e.objects.accession_no || e.objects.title}</div>}
                        </td>
                      )}
                      <td className="px-4 py-4 text-xs text-stone-600 dark:text-stone-400">{e.entry_reason}</td>
                      <td className="px-4 py-4 text-xs font-mono text-stone-500 dark:text-stone-400">{e.object_count}</td>
                      {trackDepositor && <td className="px-4 py-4 text-xs text-stone-500 dark:text-stone-400">{e.received_by}</td>}
                      {fullMode && (
                        <td className="px-4 py-4">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${OUTCOME_STYLES[e.outcome] || 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                            {e.outcome || 'Pending'}
                          </span>
                        </td>
                      )}
                      {!simple && trackDepositor && (
                        <td className="px-4 py-4">
                          {e.receipt_issued
                            ? <span className="text-xs font-mono text-emerald-600">✓ Issued</span>
                            : <span className="text-xs font-mono text-amber-600">Pending</span>
                          }
                        </td>
                      )}
                      <td className="px-4 py-4 text-right" onClick={ev => ev.stopPropagation()}>
                        {e.object_id && e.objects?.deleted_at ? (
                          <button
                            onClick={() => router.push('/dashboard/trash')}
                            className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors"
                            title="This object has been moved to bin"
                          >
                            Removed — view bin →
                          </button>
                        ) : e.object_id ? (
                          (() => {
                            const incomplete = e.outcome === 'Pending' && !e.objects?.accession_no
                            return (
                              <span className={`text-xs font-mono ${incomplete ? 'text-amber-600' : 'text-stone-400 dark:text-stone-500'}`}>
                                {incomplete ? 'Incomplete →' : 'View object →'}
                              </span>
                            )
                          })()
                        ) : (
                          e.outcome === 'Acquired' && canEdit ? (
                            <button
                              onClick={() => handlePromote(e)}
                              className="text-xs font-mono text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              Create object →
                            </button>
                          ) : (
                            <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      {showImport && museum && (
        <CSVImportModal
          profile={entryProfile}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); window.location.reload() }}
          titleOnly={!getPlan(museum?.plan ?? '').fullMode}
        />
      )}
      {scannerOpen && (
        <BarcodeScannerModal
          onClose={() => setScannerOpen(false)}
          onDetected={handleBarcodeDetected}
        />
      )}
    </DashboardShell>
  )
}
