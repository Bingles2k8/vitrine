'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { inputCls, labelCls, sectionTitle } from '@/components/tabs/shared'
import AutocompleteInput from '@/components/AutocompleteInput'
import { getPlan } from '@/lib/plans'

interface LocationTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  saving: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
  locations: any[]
  setLocations: (fn: (prev: any[]) => any[]) => void
}

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

const LOCATION_TYPES = ['Display', 'Storage', 'Quarantine', 'Transit', 'Conservation Lab', 'Office']
const today = new Date().toISOString().split('T')[0]

export default function LocationTab({ form, set, canEdit, saving, object, museum, supabase, logActivity, locations, setLocations }: LocationTabProps) {
  const router = useRouter()

  const [locationHistory, setLocationHistory] = useState<any[]>([])
  const [locationLoaded, setLocationLoaded] = useState(false)
  const [locationForm, setLocationForm] = useState({
    location: '',
    location_code: '',
    building: '',
    floor: '',
    room: '',
    unit: '',
    location_type: 'Storage',
    moved_by: '',
    moved_at: today,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!object.id) return
    supabase
      .from('location_history')
      .select('*')
      .eq('object_id', object.id)
      .order('moved_at', { ascending: false })
      .then(({ data }: any) => {
        setLocationHistory(data || [])
        setLocationLoaded(true)
      })
  }, [object.id])

  // Derived suggestion lists from the locations registry
  const locationNames = useMemo(() => [...new Set(locations.map((l: any) => l.name))].sort() as string[], [locations])
  const locationCodes = useMemo(() => [...new Set(locations.map((l: any) => l.location_code).filter(Boolean))].sort() as string[], [locations])
  const buildings = useMemo(() => [...new Set(locations.map((l: any) => l.building).filter(Boolean))].sort() as string[], [locations])
  const floors = useMemo(() => [...new Set(locations.map((l: any) => l.floor).filter(Boolean))].sort() as string[], [locations])
  const rooms = useMemo(() => [...new Set(locations.map((l: any) => l.room).filter(Boolean))].sort() as string[], [locations])
  const units = useMemo(() => [...new Set(locations.map((l: any) => l.unit || l.position).filter(Boolean))].sort() as string[], [locations])

  // When a known location name is typed, auto-fill the other fields
  function handleLocationNameChange(name: string) {
    const match = locations.find((l: any) => l.name.toLowerCase() === name.toLowerCase())
    if (match) {
      setLocationForm(f => ({
        ...f,
        location: name,
        location_code: match.location_code || '',
        building: match.building || '',
        floor: match.floor || '',
        room: match.room || '',
        unit: match.unit || match.position || '',
        location_type: match.location_type || 'Storage',
      }))
    } else {
      setLocationForm(f => ({ ...f, location: name }))
    }
  }

  async function addLocation() {
    if (!locationForm.location) return
    setSubmitting(true)
    try {
      // Upsert to locations registry if name is new
      const existing = locations.find((l: any) => l.name.toLowerCase() === locationForm.location.toLowerCase())
      if (!existing) {
        const { data: newLoc } = await supabase
          .from('locations')
          .insert({
            name: locationForm.location,
            location_code: locationForm.location_code || null,
            building: locationForm.building || null,
            floor: locationForm.floor || null,
            room: locationForm.room || null,
            unit: locationForm.unit || null,
            location_type: locationForm.location_type,
            museum_id: museum.id,
          })
          .select()
          .single()
        if (newLoc) setLocations((prev: any[]) => [...prev, newLoc])
      }

      // Record the movement — use current timestamp to avoid same-day ordering collisions
      const movedAtIso = locationForm.moved_at === today
        ? new Date().toISOString()
        : `${locationForm.moved_at}T12:00:00`
      await supabase.from('location_history').insert({
        location: locationForm.location,
        location_code: locationForm.location_code || null,
        moved_by: locationForm.moved_by || null,
        moved_at: movedAtIso,
        object_id: object.id,
        museum_id: museum.id,
      })

      // Update current location on the object
      await supabase.from('objects').update({ current_location: locationForm.location }).eq('id', object.id)
      set('current_location', locationForm.location)

      setLocationForm({ location: '', location_code: '', building: '', floor: '', room: '', unit: '', location_type: 'Storage', moved_by: '', moved_at: today })

      const { data } = await supabase
        .from('location_history')
        .select('*')
        .eq('object_id', object.id)
        .order('moved_at', { ascending: false })
      setLocationHistory(data || [])

      await logActivity('movement', `Moved to ${locationForm.location}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!getPlan(museum.plan).fullMode) {
    return (
      <>
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
        {canEdit && <SaveBar saving={saving} onCancel={() => router.push('/dashboard')} />}
      </>
    )
  }

  return (
    <>
      {/* Current Location */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Current Location</div>
        {(() => {
          const loc = locations.find((l: any) => l.name === form.current_location)
          if (!form.current_location) {
            return <p className="text-sm text-stone-400 dark:text-stone-500">No location recorded yet.</p>
          }
          return (
            <div className="space-y-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Name</div>
                <div className="text-sm text-stone-900 dark:text-stone-100 font-medium">{form.current_location}</div>
              </div>
              {loc && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {loc.location_code && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Code</div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{loc.location_code}</div>
                    </div>
                  )}
                  {loc.location_type && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Type</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{loc.location_type}</div>
                    </div>
                  )}
                  {loc.building && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Building</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{loc.building}</div>
                    </div>
                  )}
                  {loc.floor && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Floor</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{loc.floor}</div>
                    </div>
                  )}
                  {loc.room && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Room</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{loc.room}</div>
                    </div>
                  )}
                  {(loc.unit || loc.position) && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Unit / Position</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{loc.unit || loc.position}</div>
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
          )
        })()}
      </div>

      {/* Record a Movement */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Record a Movement</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="location.new_location">New Location <span className="text-red-400">*</span></label>
            <AutocompleteInput
              value={locationForm.location}
              onChange={handleLocationNameChange}
              staticList={locationNames}
              placeholder="e.g. Gallery 2, Store B"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} data-learn="location.code">Location Code <span className="text-red-400">*</span></label>
            <AutocompleteInput
              value={locationForm.location_code}
              onChange={v => setLocationForm(f => ({ ...f, location_code: v }))}
              staticList={locationCodes}
              placeholder="e.g. STORE-A-BAY3-SHELF2"
              className={inputCls}
            />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Unique location code — required for Accreditation</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelCls} data-learn="location.building">Building</label>
            <AutocompleteInput
              value={locationForm.building}
              onChange={v => setLocationForm(f => ({ ...f, building: v }))}
              staticList={buildings}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} data-learn="location.floor">Floor</label>
            <AutocompleteInput
              value={locationForm.floor}
              onChange={v => setLocationForm(f => ({ ...f, floor: v }))}
              staticList={floors}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} data-learn="location.room">Room</label>
            <AutocompleteInput
              value={locationForm.room}
              onChange={v => setLocationForm(f => ({ ...f, room: v }))}
              staticList={rooms}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} data-learn="location.unit">Unit / Position</label>
            <AutocompleteInput
              value={locationForm.unit}
              onChange={v => setLocationForm(f => ({ ...f, unit: v }))}
              staticList={units}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} data-learn="location.type">Type</label>
            <select value={locationForm.location_type} onChange={e => setLocationForm(f => ({ ...f, location_type: e.target.value }))} className={inputCls}>
              {LOCATION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} data-learn="location.moved_by">Moved By</label>
            <input value={locationForm.moved_by} onChange={e => setLocationForm(f => ({ ...f, moved_by: e.target.value }))} className={inputCls} disabled={!canEdit} />
          </div>
          <div>
            <label className={labelCls} data-learn="location.moved_at">Date of Move</label>
            <input type="date" value={locationForm.moved_at} onChange={e => setLocationForm(f => ({ ...f, moved_at: e.target.value }))} className={inputCls} max={today} disabled={!canEdit} />
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={addLocation}
            disabled={submitting || !locationForm.location}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50"
          >
            {submitting ? 'Saving\u2026' : 'Save movement \u2192'}
          </button>
        )}
      </div>

      {/* Movement History */}
      {locationLoaded && locationHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle}>Movement History</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Date</th>
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">New Location</th>
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Location Code</th>
                  <th className="text-left py-2 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Moved By</th>
                </tr>
              </thead>
              <tbody>
                {locationHistory.map((h: any) => (
                  <tr key={h.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0">
                    <td className="py-2 pr-4 text-stone-500 dark:text-stone-400 font-mono text-xs">{new Date(h.moved_at).toLocaleDateString('en-GB')}</td>
                    <td className="py-2 pr-4 text-stone-900 dark:text-stone-100">{h.location}</td>
                    <td className="py-2 pr-4 text-stone-500 dark:text-stone-400 font-mono text-xs">{h.location_code || '—'}</td>
                    <td className="py-2 text-stone-500 dark:text-stone-400">{h.moved_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canEdit && <SaveBar saving={saving} onCancel={() => router.push('/dashboard')} />}
    </>
  )
}
