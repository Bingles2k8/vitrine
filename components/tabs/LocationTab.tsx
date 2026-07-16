'use client'

import { useState, useEffect, useMemo } from 'react'
import { inputCls, labelCls, sectionTitle } from '@/components/tabs/shared'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import type { SupabaseClient } from '@supabase/supabase-js'

interface LocationRow {
  building: string | null
  room_gallery: string | null
  position1: string | null
  position2: string | null
  position3: string | null
  location_code: string | null
  name: string | null
}

interface LocationHistoryRow {
  id: string
  location: string | null
  location_code: string | null
  moved_by: string | null
  moved_at: string
}

interface AuditRecordRow {
  id: string
  inventoried_at: string
  inventoried_by: string | null
  inventory_outcome: string | null
  location_confirmed: string | null
  action_required: string | null
  action_completed: boolean | null
  action_completed_date: string | null
  discrepancy: string | null
  notes: string | null
}

interface AuditDocRow {
  id: string
  file_url: string
  file_name: string | null
  label: string | null
  document_type: string | null
}

interface ObjectFormValues {
  current_location?: string | null
  location_note?: string | null
  last_inventoried?: string | null
  inventoried_by?: string | null
  [key: string]: unknown
}

interface LocationTabProps {
  form: ObjectFormValues
  set: (field: string, value: string) => void
  canEdit: boolean
  saving: boolean
  object: { id: string; title?: string | null }
  museum: { id: string; plan: string }
  supabase: SupabaseClient
  logActivity: (actionType: string, description: string) => Promise<void>
  locations: LocationRow[]
  setLocations: (fn: (prev: LocationRow[]) => LocationRow[]) => void
  currentUserName?: string
}

const today = new Date().toISOString().split('T')[0]

function generateCode(...parts: string[]): string {
  const abbrev = (s: string) => s.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase()
  return parts.filter(Boolean).map(abbrev).join('-')
}

const ADD_NEW = '__ADD_NEW__'

const FIELD_LABELS: Record<string, string> = {
  building: 'building',
  room_gallery: 'room / gallery',
  position1: 'Position 1',
  position2: 'Position 2',
  position3: 'Position 3',
}

const FIELD_PLACEHOLDERS: Record<string, string> = {
  building: 'e.g. Main Building',
  room_gallery: 'e.g. Gallery 2',
  position1: 'e.g. Case A',
  position2: 'e.g. Shelf 1',
  position3: 'e.g. Bay 3',
}

type CascadeField = 'building' | 'room_gallery' | 'position1' | 'position2' | 'position3'

// Module-level so React keeps the same component identity across LocationTab
// re-renders — defining this inside LocationTab remounted all five selects
// (and dropped focus) on every state change.
function CascadeSelect({
  field,
  label,
  options,
  extras,
  required,
  disabled,
  value,
  onChange,
}: {
  field: CascadeField
  label: string
  options: string[]
  extras: string[]
  required?: boolean
  disabled?: boolean
  value: string
  onChange: (field: CascadeField, value: string) => void
}) {
  const allOptions = [...new Set([...options, ...extras])].sort()
  return (
    <div>
      <label className={labelCls}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(field, e.target.value)}
        className={inputCls}
        disabled={disabled}
      >
        <option value="">— Select —</option>
        {allOptions.map(o => <option key={o} value={o}>{o}</option>)}
        <option value={ADD_NEW}>— Add New —</option>
      </select>
    </div>
  )
}

export default function LocationTab({ form, set, canEdit, saving, object, museum, supabase, logActivity, locations, setLocations, currentUserName }: LocationTabProps) {
  const { toast } = useToast()

  const [locationHistory, setLocationHistory] = useState<LocationHistoryRow[]>([])
  const [locationLoaded, setLocationLoaded] = useState(false)
  const [locationForm, setLocationForm] = useState({
    building: '',
    room_gallery: '',
    position1: '',
    position2: '',
    position3: '',
    location_code: '',
    moved_by: currentUserName || '',
    moved_at: today,
    move_type: 'Permanent',
    expected_return_date: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const [addNewModal, setAddNewModal] = useState<{
    open: boolean
    field: 'building' | 'room_gallery' | 'position1' | 'position2' | 'position3'
    value: string
  }>({ open: false, field: 'building', value: '' })

  // Audit state
  const [auditHistory, setAuditHistory] = useState<AuditRecordRow[]>([])
  const [auditLoaded, setAuditLoaded] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AuditRecordRow | null>(null)
  const [selectedRecordDocs, setSelectedRecordDocs] = useState<AuditDocRow[]>([])

  useEffect(() => {
    if (!object.id) return
    supabase.from('location_history').select('*').eq('object_id', object.id).order('moved_at', { ascending: false })
      .then(({ data }) => { setLocationHistory(data || []); setLocationLoaded(true) })
    supabase.from('audit_records').select('*').eq('object_id', object.id).order('inventoried_at', { ascending: false })
      .then(({ data }) => { setAuditHistory(data || []); setAuditLoaded(true) })
  }, [object.id])

  useEffect(() => {
    if (!selectedRecord) { setSelectedRecordDocs([]); return }
    supabase.from('object_documents').select('*')
      .eq('related_to_type', 'audit_record')
      .eq('related_to_id', selectedRecord.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSelectedRecordDocs(data || []))
  }, [selectedRecord?.id])

  // Auto-generate location code whenever hierarchy fields change
  useEffect(() => {
    const code = generateCode(locationForm.building, locationForm.room_gallery, locationForm.position1, locationForm.position2, locationForm.position3)
    setLocationForm(f => ({ ...f, location_code: code }))
  }, [locationForm.building, locationForm.room_gallery, locationForm.position1, locationForm.position2, locationForm.position3])

  // --- Cascading option lists ---
  const buildings = useMemo(() =>
    [...new Set(locations.map(l => l.building).filter(Boolean))].sort() as string[],
    [locations])

  const roomGalleries = useMemo(() =>
    [...new Set(
      locations
        .filter(l => !locationForm.building || l.building === locationForm.building)
        .map(l => l.room_gallery).filter(Boolean)
    )].sort() as string[],
    [locations, locationForm.building])

  const positions1 = useMemo(() =>
    [...new Set(
      locations
        .filter(l =>
          (!locationForm.building || l.building === locationForm.building) &&
          (!locationForm.room_gallery || l.room_gallery === locationForm.room_gallery)
        )
        .map(l => l.position1).filter(Boolean)
    )].sort() as string[],
    [locations, locationForm.building, locationForm.room_gallery])

  const positions2 = useMemo(() =>
    [...new Set(
      locations
        .filter(l =>
          (!locationForm.building || l.building === locationForm.building) &&
          (!locationForm.room_gallery || l.room_gallery === locationForm.room_gallery) &&
          (!locationForm.position1 || l.position1 === locationForm.position1)
        )
        .map(l => l.position2).filter(Boolean)
    )].sort() as string[],
    [locations, locationForm.building, locationForm.room_gallery, locationForm.position1])

  const positions3 = useMemo(() =>
    [...new Set(
      locations
        .filter(l =>
          (!locationForm.building || l.building === locationForm.building) &&
          (!locationForm.room_gallery || l.room_gallery === locationForm.room_gallery) &&
          (!locationForm.position1 || l.position1 === locationForm.position1) &&
          (!locationForm.position2 || l.position2 === locationForm.position2)
        )
        .map(l => l.position3).filter(Boolean)
    )].sort() as string[],
    [locations, locationForm.building, locationForm.room_gallery, locationForm.position1, locationForm.position2])

  // "Add New" modal — extra option added to local lists
  const [extraBuildings, setExtraBuildings] = useState<string[]>([])
  const [extraRoomGalleries, setExtraRoomGalleries] = useState<string[]>([])
  const [extraPositions1, setExtraPositions1] = useState<string[]>([])
  const [extraPositions2, setExtraPositions2] = useState<string[]>([])
  const [extraPositions3, setExtraPositions3] = useState<string[]>([])

  function handleDropdownChange(field: 'building' | 'room_gallery' | 'position1' | 'position2' | 'position3', value: string) {
    if (value === ADD_NEW) {
      setAddNewModal({ open: true, field, value: '' })
      return
    }
    // Reset downstream fields when a parent changes
    const downstream: Record<string, string[]> = {
      building: ['room_gallery', 'position1', 'position2', 'position3'],
      room_gallery: ['position1', 'position2', 'position3'],
      position1: ['position2', 'position3'],
      position2: ['position3'],
      position3: [],
    }
    const reset: Record<string, string> = {}
    downstream[field].forEach(f => { reset[f] = '' })
    setLocationForm(prev => ({ ...prev, [field]: value, ...reset }))
  }

  function confirmAddNew() {
    const val = addNewModal.value.trim()
    if (!val) return
    const { field } = addNewModal
    // Add to extra lists so it appears selected in the dropdown
    if (field === 'building') setExtraBuildings(prev => [...new Set([...prev, val])])
    if (field === 'room_gallery') setExtraRoomGalleries(prev => [...new Set([...prev, val])])
    if (field === 'position1') setExtraPositions1(prev => [...new Set([...prev, val])])
    if (field === 'position2') setExtraPositions2(prev => [...new Set([...prev, val])])
    if (field === 'position3') setExtraPositions3(prev => [...new Set([...prev, val])])
    handleDropdownChange(field, val)
    setAddNewModal({ open: false, field: 'building', value: '' })
  }

  async function addLocation() {
    if (!locationForm.building || !locationForm.room_gallery || !locationForm.position1) {
      toast('Building, Room/Gallery, and Position 1 are required', 'error')
      return
    }
    setSubmitting(true)
    try {
      // Find or create location in registry
      const existing = locations.find(l =>
        l.building === locationForm.building &&
        l.room_gallery === locationForm.room_gallery &&
        l.position1 === locationForm.position1 &&
        (l.position2 || '') === locationForm.position2 &&
        (l.position3 || '') === locationForm.position3
      )
      if (!existing) {
        const { data: newLoc } = await supabase.from('locations').insert({
          name: locationForm.location_code,
          location_code: locationForm.location_code,
          building: locationForm.building,
          room_gallery: locationForm.room_gallery,
          position1: locationForm.position1,
          position2: locationForm.position2 || null,
          position3: locationForm.position3 || null,
          museum_id: museum.id,
        }).select().single()
        if (newLoc) setLocations(prev => [...prev, newLoc])
      }

      const movedAtIso = locationForm.moved_at === today
        ? new Date().toISOString()
        : `${locationForm.moved_at}T12:00:00`

      // move_type / expected_return_date / reason are columns the Location
      // register displays and computes its overdue-returns stat from. Until now
      // only exits ever wrote them, so a temporary internal move — the core
      // case for location control — could not be recorded (O10).
      const isTemporary = locationForm.move_type === 'Temporary'
      await supabase.from('location_history').insert({
        location: locationForm.location_code,
        location_code: locationForm.location_code,
        moved_by: locationForm.moved_by || null,
        moved_at: movedAtIso,
        move_type: locationForm.move_type || 'Permanent',
        expected_return_date: isTemporary && locationForm.expected_return_date ? locationForm.expected_return_date : null,
        reason: locationForm.reason || null,
        object_id: object.id,
        museum_id: museum.id,
      })

      await supabase.from('objects').update({ current_location: locationForm.location_code }).eq('id', object.id)
      set('current_location', locationForm.location_code)

      setLocationForm({
        building: '',
        room_gallery: '',
        position1: '',
        position2: '',
        position3: '',
        location_code: '',
        moved_by: currentUserName || '',
        moved_at: today,
        move_type: 'Permanent',
        expected_return_date: '',
        reason: '',
      })
      // Clear extra lists since they're now in the registry
      setExtraBuildings([])
      setExtraRoomGalleries([])
      setExtraPositions1([])
      setExtraPositions2([])
      setExtraPositions3([])

      const { data } = await supabase.from('location_history').select('*').eq('object_id', object.id).order('moved_at', { ascending: false })
      setLocationHistory(data || [])

      await logActivity('movement', `Moved to ${locationForm.location_code}`)
      toast('Movement recorded')
    } finally {
      setSubmitting(false)
    }
  }


  // Simple mode (Hobbyist / non-fullMode plans)
  if (!getPlan(museum.plan).fullMode) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Current Location</div>
        <div>
          <label className={labelCls}>Where is this item kept?</label>
          <input
            value={form.current_location || ''}
            onChange={e => set('current_location', e.target.value)}
            placeholder="e.g. Living room shelf, Study cabinet, Attic box 3…"
            className={inputCls}
            disabled={!canEdit}
          />
        </div>
      </div>
    )
  }

  // Lookup current location record
  const currentLoc = locations.find(l => l.location_code === form.current_location || l.name === form.current_location)

  return (
    <>
      {/* Current Location */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Current Location</div>
        {!form.current_location ? (
          <p className="text-sm text-stone-400 dark:text-stone-500">No location recorded yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{form.current_location}</span>
            </div>
            {currentLoc && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {currentLoc.building && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Building</div>
                    <div className="text-sm text-stone-700 dark:text-stone-300">{currentLoc.building}</div>
                  </div>
                )}
                {currentLoc.room_gallery && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Room / Gallery</div>
                    <div className="text-sm text-stone-700 dark:text-stone-300">{currentLoc.room_gallery}</div>
                  </div>
                )}
                {currentLoc.position1 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Position 1</div>
                    <div className="text-sm text-stone-700 dark:text-stone-300">{currentLoc.position1}</div>
                  </div>
                )}
                {currentLoc.position2 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Position 2</div>
                    <div className="text-sm text-stone-700 dark:text-stone-300">{currentLoc.position2}</div>
                  </div>
                )}
                {currentLoc.position3 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Position 3</div>
                    <div className="text-sm text-stone-700 dark:text-stone-300">{currentLoc.position3}</div>
                  </div>
                )}
              </div>
            )}
            {form.location_note && (
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Note</div>
                <div className="text-sm text-stone-700 dark:text-stone-300">{form.location_note}</div>
              </div>
            )}
            {locationHistory[0] && (
              <div className="text-xs text-stone-400 dark:text-stone-500">
                Last moved {new Date(locationHistory[0].moved_at).toLocaleDateString('en-GB')}
                {locationHistory[0].moved_by ? ` by ${locationHistory[0].moved_by}` : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record a Movement */}
      {canEdit && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
          <div className={sectionTitle}>Record a Movement</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CascadeSelect field="building" label="Building" options={buildings} extras={extraBuildings} required disabled={!canEdit} value={locationForm.building} onChange={handleDropdownChange} />
            <CascadeSelect field="room_gallery" label="Room / Gallery" options={roomGalleries} extras={extraRoomGalleries} required disabled={!locationForm.building || !canEdit} value={locationForm.room_gallery} onChange={handleDropdownChange} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CascadeSelect field="position1" label="Position 1" options={positions1} extras={extraPositions1} required disabled={!locationForm.room_gallery || !canEdit} value={locationForm.position1} onChange={handleDropdownChange} />
            <CascadeSelect field="position2" label="Position 2" options={positions2} extras={extraPositions2} disabled={!locationForm.position1 || !canEdit} value={locationForm.position2} onChange={handleDropdownChange} />
            <CascadeSelect field="position3" label="Position 3" options={positions3} extras={extraPositions3} disabled={!locationForm.position2 || !canEdit} value={locationForm.position3} onChange={handleDropdownChange} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Location Code</label>
              <input
                value={locationForm.location_code}
                onChange={e => setLocationForm(f => ({ ...f, location_code: e.target.value }))}
                placeholder="Auto-generated"
                className={inputCls}
              />
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Auto-generated from selections — editable if needed</p>
            </div>
            <div>
              <label className={labelCls}>Date of Move</label>
              <input type="date" value={locationForm.moved_at} onChange={e => setLocationForm(f => ({ ...f, moved_at: e.target.value }))} className={inputCls} max={today} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Moved By</label>
              <input value={locationForm.moved_by} onChange={e => setLocationForm(f => ({ ...f, moved_by: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Move Type</label>
              <select value={locationForm.move_type} onChange={e => setLocationForm(f => ({ ...f, move_type: e.target.value }))} className={inputCls}>
                <option value="Permanent">Permanent</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Reason</label>
              <input value={locationForm.reason} onChange={e => setLocationForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Gallery rotation, Photography, Storage reorganisation" className={inputCls} />
            </div>
            {locationForm.move_type === 'Temporary' && (
              <div>
                <label className={labelCls}>Expected Return</label>
                <input type="date" value={locationForm.expected_return_date} onChange={e => setLocationForm(f => ({ ...f, expected_return_date: e.target.value }))} className={inputCls} />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Overdue returns are flagged on the Location register</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={addLocation}
            disabled={submitting || !locationForm.building || !locationForm.room_gallery || !locationForm.position1}
            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save movement →'}
          </button>
        </div>
      )}

      {/* The per-object inventory-check form lives on the Audit tab, which is the
          register's own home. It used to be duplicated here as well — and below
          Professional it could only ever fail, since audit_records INSERT is
          gated on museum_has_compliance_plan() in RLS. */}

      {/* Last Inventoried */}
      {form.last_inventoried && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle}>Last Inventoried</div>
          <p className="text-sm text-stone-900 dark:text-stone-100">
            {new Date(form.last_inventoried).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {form.inventoried_by && ` by ${form.inventoried_by}`}
          </p>
        </div>
      )}

      {/* History — side by side */}
      {(locationLoaded || auditLoaded) && (locationHistory.length > 0 || auditHistory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Movement History */}
          {locationHistory.length > 0 && (
            <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                <div className={sectionTitle} style={{ marginBottom: 0 }}>Movement History</div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4 w-16">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-2 py-4">Location</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-3 py-4">Moved By</th>
                  </tr>
                </thead>
                <tbody>
                  {locationHistory.map(h => (
                    <tr key={h.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0">
                      <td className="px-4 py-4 text-xs font-mono text-stone-500 dark:text-stone-400 whitespace-nowrap">{(() => { const d = new Date(h.moved_at); return `${d.getDate()}/${d.getMonth()+1}/${String(d.getFullYear()).slice(2)}` })()}</td>
                      <td className="px-2 py-4 text-xs font-mono text-stone-700 dark:text-stone-300">{h.location_code || h.location}</td>
                      <td className="px-3 py-4 text-xs text-stone-500 dark:text-stone-400">{h.moved_by || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit History */}
          {auditHistory.length > 0 && (
            <div className="lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                <div className={sectionTitle} style={{ marginBottom: 0 }}>Audit History</div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Outcome</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">By</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map(h => (
                    <tr key={h.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer" onClick={() => setSelectedRecord(h)}>
                      <td className="px-6 py-4 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(h.inventoried_at).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-4">
                        {h.inventory_outcome ? (
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${h.inventory_outcome === 'Present and correct' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>
                            {h.inventory_outcome}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-500 dark:text-stone-400">{h.inventoried_by || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Audit record detail modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{new Date(selectedRecord.inventoried_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                {selectedRecord.inventoried_by && <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-0.5">By {selectedRecord.inventoried_by}</div>}
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4">×</button>
            </div>
            <div className="p-6 space-y-4">
              {selectedRecord.inventory_outcome && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Outcome</div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${selectedRecord.inventory_outcome === 'Present and correct' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{selectedRecord.inventory_outcome}</span>
                </div>
              )}
              {selectedRecord.location_confirmed && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Location Found</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.location_confirmed}</div>
                </div>
              )}
              {selectedRecord.action_required && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Action Required</div>
                  <div className={`text-sm ${selectedRecord.action_completed ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-amber-700 dark:text-amber-400'}`}>{selectedRecord.action_required}</div>
                  {selectedRecord.action_completed && selectedRecord.action_completed_date && (
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">Completed {new Date(selectedRecord.action_completed_date).toLocaleDateString('en-GB')}</div>
                  )}
                </div>
              )}
              {selectedRecord.discrepancy && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Discrepancy</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.discrepancy}</div>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.notes}</div>
                </div>
              )}
              {selectedRecordDocs.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Supporting Documents</div>
                  <div className="space-y-1.5">
                    {selectedRecordDocs.map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-2.5 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <span className="text-stone-400">📎</span>
                        <span className="truncate">{doc.label || doc.file_name}</span>
                        {doc.document_type && <span className="ml-auto text-stone-300 dark:text-stone-600 shrink-0">{doc.document_type}</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New modal */}
      {addNewModal.open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setAddNewModal(m => ({ ...m, open: false, value: '' }))}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-xs p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100 capitalize">
              Add new {FIELD_LABELS[addNewModal.field]}
            </div>
            <input
              autoFocus
              value={addNewModal.value}
              onChange={e => setAddNewModal(m => ({ ...m, value: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && confirmAddNew()}
              placeholder={FIELD_PLACEHOLDERS[addNewModal.field]}
              className={inputCls}
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setAddNewModal(m => ({ ...m, open: false, value: '' }))}
                className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono px-4 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddNew}
                disabled={!addNewModal.value.trim()}
                className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono px-4 py-2 rounded disabled:opacity-50"
              >
                Add →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
