'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import 'leaflet/dist/leaflet.css'

interface MapObject {
  id: string
  title: string
  emoji?: string | null
  image_url?: string | null
  origin_country?: string | null
  origin_place?: string | null
  // Postgres numeric(9,6) round-trips through PostgREST as a string, so accept both.
  origin_lat?: number | string | null
  origin_lng?: number | string | null
}

type PinnedObject = MapObject & { lat: number; lng: number }

function toFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseFloat(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

interface CollectionMapProps {
  objects: MapObject[]
}

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

export default function CollectionMap({ objects }: CollectionMapProps) {
  const router = useRouter()
  const [leafletReady, setLeafletReady] = useState(false)

  useEffect(() => {
    import('leaflet').then(L => {
      // Workaround for default marker icon paths with bundlers.
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
      ;(L.Marker.prototype as any).options.icon = DefaultIcon
      setLeafletReady(true)
    })
  }, [])

  const pinned: PinnedObject[] = objects.flatMap(o => {
    const lat = toFiniteNumber(o.origin_lat)
    const lng = toFiniteNumber(o.origin_lng)
    if (lat === null || lng === null) return []
    return [{ ...o, lat, lng }]
  })

  if (pinned.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-12 text-center">
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-2">
          No objects have been placed on the map yet.
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          Add coordinates on the object&apos;s Origin field to pin it here.
        </p>
      </div>
    )
  }

  if (!leafletReady) {
    return (
      <div className="bg-stone-100 dark:bg-stone-800 rounded-lg h-96 flex items-center justify-center">
        <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">Loading map…</span>
      </div>
    )
  }

  const center: [number, number] = [pinned[0].lat, pinned[0].lng]

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden" style={{ height: 500 }}>
      <MapContainer center={center} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pinned.map(o => (
          <Marker key={o.id} position={[o.lat, o.lng]}>
            <Popup>
              <div className="flex items-center gap-2 mb-1">
                {o.image_url ? (
                  <img src={o.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <span style={{ fontSize: 24 }}>{o.emoji || '◯'}</span>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{o.title}</div>
                  {o.origin_place && <div style={{ fontSize: 11, color: '#78716c' }}>{o.origin_place}</div>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/objects/${o.id}`)}
                style={{ fontSize: 11, color: '#92400e', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Open →
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
