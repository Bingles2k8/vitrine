'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

interface PublicObjectMapProps {
  lat: number
  lng: number
  label?: string | null
  accent?: string
  borderColor?: string
}

export default function PublicObjectMap({ lat, lng, label, borderColor }: PublicObjectMapProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    import('leaflet').then(L => {
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
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div
        className="rounded-lg h-64 flex items-center justify-center border"
        style={{ borderColor, background: 'rgba(0,0,0,0.04)' }}
      >
        <span className="text-xs font-mono opacity-60">Loading map…</span>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ height: 260, borderColor }}
    >
      <MapContainer center={[lat, lng]} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          {label ? <Popup>{label}</Popup> : null}
        </Marker>
      </MapContainer>
    </div>
  )
}
