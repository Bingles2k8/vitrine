'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { inputCls, labelCls, sectionTitle, LOCATION_REASONS } from '@/components/tabs/shared'

interface LocationTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  saving: boolean
  artifact: any
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

export default function LocationTab({ form, set, canEdit, saving, artifact, museum, supabase, logActivity, locations, setLocations }: LocationTabProps) {
  const router = useRouter()

  const [locationHistory, setLocationHistory] = useState<any[]>([])
  const [locationLoaded, setLocationLoaded] = useState(false)
  const MOVE_TYPES = ['Permanent', 'Temporary']
  const [locationForm, setLocationForm] = useState({ location: '', reason: '', moved_by: '', authorised_by: '', move_type: 'Permanent', expected_return_date: '', expected_return_location: '' })
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [newLocation, setNewLocation] = useState({ name: '', location_code: '', building: '', floor: '', room: '', unit: '', position: '', location_type: 'Storage', environmental_notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!artifact.id) return
    supabase
      .from('location_history')
      .select('*')
      .eq('artifact_id', artifact.id)
      .order('moved_at', { ascending: false })
      .then(({ data }: any) => {
        setLocationHistory(data || [])
        setLocationLoaded(true)
      })
  }, [artifact.id])

  async function addLocation() {
    if (!locationForm.location) return
    setSubmitting(true)
    try {
      await supabase.from('location_history').insert({
        location: locationForm.location,
        reason: locationForm.reason,
        moved_by: locationForm.moved_by,
        authorised_by: locationForm.authorised_by,
        move_type: locationForm.move_type,
        expected_return_date: locationForm.move_type === 'Temporary' && locationForm.expected_return_date ? locationForm.expected_return_date : null,
        expected_return_location: locationForm.move_type === 'Temporary' ? (locationForm.expected_return_location || null) : null,
        artifact_id: artifact.id,
        museum_id: museum.id,
      })

      await supabase.from('artifacts').update({ current_location: locationForm.location }).eq('id', artifact.id)

      set('current_location', locationForm.location)
      setLocationForm({ location: '', reason: '', moved_by: '', authorised_by: '', move_type: 'Permanent', expected_return_date: '', expected_return_location: '' })

      const { data } = await supabase
        .from('location_history')
        .select('*')
        .eq('artifact_id', artifact.id)
        .order('moved_at', { ascending: false })
      setLocationHistory(data || [])

      await logActivity('movement', `Moved to ${locationForm.location}${locationForm.reason ? ` (${locationForm.reason})` : ''}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function saveNewLocation() {
    if (!newLocation.name) return
    setSubmitting(true)
    try {
      const { data } = await supabase
        .from('locations')
        .insert({
          name: newLocation.name,
          location_code: newLocation.location_code || null,
          building: newLocation.building,
          floor: newLocation.floor,
          room: newLocation.room,
          unit: newLocation.unit,
          position: newLocation.position,
          location_type: newLocation.location_type,
          environmental_notes: newLocation.environmental_notes,
          museum_id: museum.id,
        })
        .select()
        .single()

      if (data) {
        setLocations((prev: any[]) => [...prev, data])
        set('current_location', data.name)
      }

      setNewLocation({ name: '', location_code: '', building: '', floor: '', room: '', unit: '', position: '', location_type: 'Storage', environmental_notes: '' })
      setShowAddLocation(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Current Location */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Current Location (Procedure 3)</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Current Location</label>
            <select
              value={locations.find(l => l.name === form.current_location) ? form.current_location : ''}
              onChange={e => set('current_location', e.target.value)}
              className={inputCls}
              disabled={!canEdit}
            >
              <option value="">{'\u2014'} Select location {'\u2014'}</option>
              {locations.map(l => (
                <option key={l.id} value={l.name}>{l.name}{l.location_type ? ` (${l.location_type})` : ''}</option>
              ))}
            </select>
            {!locations.find(l => l.name === form.current_location) && (
              <input
                value={form.current_location || ''}
                onChange={e => set('current_location', e.target.value)}
                placeholder="Enter location manually"
                className={`${inputCls} mt-2`}
                disabled={!canEdit}
              />
            )}
          </div>
          <div>
            <label className={labelCls}>Location Note</label>
            <input value={form.location_note || ''} onChange={e => set('location_note', e.target.value)} className={inputCls} disabled={!canEdit} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddLocation(!showAddLocation)}
          className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          {showAddLocation ? 'Cancel' : 'Add new location to registry \u2192'}
        </button>

        {showAddLocation && (
          <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-4 space-y-4 bg-stone-50 dark:bg-stone-800/50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Name *</label>
                <input value={newLocation.name} onChange={e => setNewLocation({ ...newLocation, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Location Code <span className="text-red-400">*</span></label>
                <input value={newLocation.location_code} onChange={e => setNewLocation({ ...newLocation, location_code: e.target.value })}
                  placeholder="e.g. STORE-A-BAY3-SHELF2" className={inputCls} />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Unique code (Mandatory — Spectrum Proc 3)</p>
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={newLocation.location_type} onChange={e => setNewLocation({ ...newLocation, location_type: e.target.value })} className={inputCls}>
                  {['Display', 'Storage', 'Quarantine', 'Transit', 'Conservation Lab', 'Office'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Building</label>
                <input value={newLocation.building} onChange={e => setNewLocation({ ...newLocation, building: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Floor</label>
                <input value={newLocation.floor} onChange={e => setNewLocation({ ...newLocation, floor: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Room</label>
                <input value={newLocation.room} onChange={e => setNewLocation({ ...newLocation, room: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Unit / Position</label>
                <input value={newLocation.position} onChange={e => setNewLocation({ ...newLocation, position: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Environmental Notes</label>
              <input
                value={newLocation.environmental_notes}
                onChange={e => setNewLocation({ ...newLocation, environmental_notes: e.target.value })}
                placeholder="Temperature, humidity, light conditions"
                className={inputCls}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveNewLocation}
                disabled={submitting || !newLocation.name}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-4 py-2 rounded disabled:opacity-50"
              >
                {submitting ? 'Saving\u2026' : 'Save location'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddLocation(false)}
                className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono px-4 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record a Movement */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Record a Movement</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>New Location *</label>
            <select
              value={locations.find(l => l.name === locationForm.location) ? locationForm.location : ''}
              onChange={e => setLocationForm({ ...locationForm, location: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            >
              <option value="">{'\u2014'} Select location {'\u2014'}</option>
              {locations.map(l => (
                <option key={l.id} value={l.name}>{l.name}{l.location_type ? ` (${l.location_type})` : ''}</option>
              ))}
            </select>
            {!locations.find(l => l.name === locationForm.location) && (
              <input
                value={locationForm.location}
                onChange={e => setLocationForm({ ...locationForm, location: e.target.value })}
                placeholder="Enter location manually"
                className={`${inputCls} mt-2`}
                disabled={!canEdit}
              />
            )}
          </div>
          <div>
            <label className={labelCls}>Reason</label>
            <select
              value={locationForm.reason}
              onChange={e => setLocationForm({ ...locationForm, reason: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            >
              <option value="">{'\u2014'} Select reason {'\u2014'}</option>
              {LOCATION_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Moved By</label>
            <input
              value={locationForm.moved_by}
              onChange={e => setLocationForm({ ...locationForm, moved_by: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className={labelCls}>Authorised By</label>
            <input
              value={locationForm.authorised_by}
              onChange={e => setLocationForm({ ...locationForm, authorised_by: e.target.value })}
              placeholder="Staff member or governing body"
              className={inputCls}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Move Type</label>
          <div className="flex gap-2">
            {MOVE_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setLocationForm({ ...locationForm, move_type: t })}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${locationForm.move_type === t ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {locationForm.move_type === 'Temporary' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Expected Return Date</label>
              <input type="date" value={locationForm.expected_return_date} onChange={e => setLocationForm({ ...locationForm, expected_return_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expected Return Location</label>
              <input value={locationForm.expected_return_location} onChange={e => setLocationForm({ ...locationForm, expected_return_location: e.target.value })} placeholder="Where the object should return to" className={inputCls} />
            </div>
          </div>
        )}

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
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Location</th>
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Reason</th>
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Moved By</th>
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Authorised By</th>
                  <th className="text-left py-2 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Type</th>
                </tr>
              </thead>
              <tbody>
                {locationHistory.map((h: any) => (
                  <tr key={h.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0">
                    <td className="py-2 pr-4 text-stone-500 dark:text-stone-400 font-mono text-xs">{new Date(h.moved_at).toLocaleDateString('en-GB')}</td>
                    <td className="py-2 pr-4 text-stone-900 dark:text-stone-100">{h.location}</td>
                    <td className="py-2 pr-4 text-stone-500 dark:text-stone-400">{h.reason}</td>
                    <td className="py-2 pr-4 text-stone-500 dark:text-stone-400">{h.moved_by}</td>
                    <td className="py-2 pr-4 text-stone-500 dark:text-stone-400">{h.authorised_by}</td>
                    <td className="py-2 text-stone-500 dark:text-stone-400 text-xs">{h.move_type || 'Permanent'}</td>
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
