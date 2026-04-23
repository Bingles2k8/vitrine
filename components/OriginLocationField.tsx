'use client'

import { useState } from 'react'
import { inputCls, labelCls } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'

interface OriginLocationFieldProps {
  // Falls back to this (usually the Culture/Origin field) when override is empty.
  originFallback: string
  placeValue: string
  countryValue: string
  lat: number | string | null
  lng: number | string | null
  mapPublic: boolean
  onChange: (patch: Partial<{
    origin_place: string
    origin_country: string | null
    origin_lat: number | null
    origin_lng: number | null
    origin_map_public: boolean
  }>) => void
}

type GeocodeResult = {
  display_name: string
  lat: number
  lng: number
  country_code: string | null
}

function toNum(v: number | string | null): number | null {
  if (v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : null
}

export default function OriginLocationField({
  originFallback,
  placeValue,
  countryValue,
  lat,
  lng,
  mapPublic,
  onChange,
}: OriginLocationFieldProps) {
  const { toast } = useToast()
  const [looking, setLooking] = useState(false)
  const [results, setResults] = useState<GeocodeResult[] | null>(null)

  const resolvedLat = toNum(lat)
  const resolvedLng = toNum(lng)
  const hasPin = resolvedLat !== null && resolvedLng !== null

  const activeQuery = (placeValue || originFallback || '').trim()

  async function findLocation() {
    if (!activeQuery) {
      toast('Enter a place, or fill in Origin above', 'error')
      return
    }
    setLooking(true)
    setResults(null)
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(activeQuery)}`)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(payload.error || 'Lookup failed', 'error')
        setLooking(false)
        return
      }
      const rs: GeocodeResult[] = Array.isArray(payload.results) ? payload.results : []
      if (rs.length === 0) {
        toast('No match — try a more specific place', 'error')
      } else if (rs.length === 1) {
        pick(rs[0])
      } else {
        setResults(rs)
      }
    } catch {
      toast('Lookup failed', 'error')
    }
    setLooking(false)
  }

  function pick(r: GeocodeResult) {
    onChange({
      origin_place: r.display_name,
      origin_country: r.country_code ?? null,
      origin_lat: r.lat,
      origin_lng: r.lng,
    })
    setResults(null)
  }

  function clearPin() {
    onChange({
      origin_place: '',
      origin_country: null,
      origin_lat: null,
      origin_lng: null,
    })
    setResults(null)
  }

  return (
    <div>
      <label className={labelCls}>
        Map location
        {mapPublic && (
          <span className="ml-1 text-xs font-mono text-emerald-600 dark:text-amber-600 normal-case tracking-normal">(Public)</span>
        )}
      </label>
      <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
        Defaults to the Origin above. Type a specific place here to override where this object is pinned on the map.
      </p>

      <label className="flex items-center gap-2 mb-3 text-xs text-stone-600 dark:text-stone-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={mapPublic}
          onChange={e => onChange({ origin_map_public: e.target.checked })}
          className="accent-stone-900 dark:accent-stone-100"
        />
        Show this map on the public site
      </label>

      <div className="flex gap-2">
        <input
          value={placeValue}
          onChange={e => onChange({ origin_place: e.target.value })}
          placeholder={originFallback ? `Override (e.g. Kyoto, Japan) — else uses “${originFallback}”` : 'e.g. Kyoto, Japan'}
          className={inputCls}
        />
        <button
          type="button"
          onClick={findLocation}
          disabled={looking || !activeQuery}
          className="shrink-0 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-mono px-4 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50"
        >
          {looking ? 'Finding…' : 'Find on map'}
        </button>
      </div>

      {results && results.length > 0 && (
        <div className="mt-2 border border-stone-200 dark:border-stone-700 rounded overflow-hidden">
          {results.map((r, i) => (
            <button
              key={`${r.lat},${r.lng},${i}`}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 border-b last:border-b-0 border-stone-100 dark:border-stone-800"
            >
              {r.display_name}
              <span className="ml-2 font-mono text-stone-400 dark:text-stone-500">{r.lat.toFixed(3)}, {r.lng.toFixed(3)}</span>
            </button>
          ))}
        </div>
      )}

      {hasPin && (
        <div className="mt-2 flex items-center justify-between gap-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded px-3 py-2">
          <span className="min-w-0 truncate">
            📍 <span className="font-mono">{resolvedLat!.toFixed(4)}, {resolvedLng!.toFixed(4)}</span>
            {countryValue ? <span className="ml-2 uppercase">{countryValue}</span> : null}
          </span>
          <button
            type="button"
            onClick={clearPin}
            className="shrink-0 font-mono text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
