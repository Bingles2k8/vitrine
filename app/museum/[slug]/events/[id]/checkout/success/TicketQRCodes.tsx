'use client'

import QRCode from 'react-qr-code'
import { useState, useEffect } from 'react'

interface Ticket {
  ticket_code: string
  status: string
}

export default function TicketQRCodes({ tickets }: { tickets: Ticket[] }) {
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])

  if (!origin) return null

  return (
    <>
      {tickets.map(t => (
        <div key={t.ticket_code} className="flex flex-col items-center gap-2 pt-3">
          <div className="bg-white p-3 rounded-lg" style={{ border: '1px solid #e7e5e4' }}>
            <QRCode value={`${origin}/verify/${t.ticket_code}`} size={120} />
          </div>
          <p className="text-xs text-center" style={{ color: '#9ca3af', fontFamily: 'monospace' }}>Scan at entry</p>
        </div>
      ))}
    </>
  )
}
