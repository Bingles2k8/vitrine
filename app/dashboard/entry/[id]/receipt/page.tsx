'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { getMuseumForUser } from '@/lib/get-museum'

export default function EntryReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const [entry, setEntry] = useState<any>(null)
  const [museum, setMuseum] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum } = result
      const { data: entry } = await supabase
        .from('entry_records')
        .select('*, objects(title, accession_no)')
        .eq('id', id)
        .eq('museum_id', museum.id)
        .maybeSingle()
      setMuseum(museum)
      setEntry(entry)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!loading && entry) {
      setTimeout(() => window.print(), 300)
    }
  }, [loading, entry])

  if (loading) return <div className="p-8 text-sm text-stone-500">Loading receipt…</div>
  if (!entry) return <div className="p-8 text-sm text-stone-500">Entry record not found.</div>

  const today = new Date().toLocaleDateString('en-GB')
  const entryDate = entry.entry_date ? new Date(entry.entry_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'
  const receiptDate = entry.receipt_date ? new Date(entry.receipt_date + 'T00:00:00').toLocaleDateString('en-GB') : today

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        body { font-family: Georgia, serif; }
      `}</style>

      <div className="no-print bg-stone-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-stone-600 hover:text-stone-900">← Back</button>
        <button onClick={() => window.print()} className="text-sm font-mono bg-stone-900 text-white px-4 py-2 rounded">Print Receipt</button>
      </div>

      <div className="max-w-2xl mx-auto p-12 bg-white min-h-screen">
        {/* Header */}
        <div className="border-b-2 border-stone-900 pb-6 mb-8">
          <div className="text-2xl font-serif italic text-stone-900 mb-1">{museum?.name || 'Museum'}</div>
          {museum?.contact_email && (
            <div className="text-sm text-stone-600">{museum.contact_email}</div>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-xl font-serif tracking-wide text-stone-900 uppercase mb-1">Object Entry Receipt</h1>
          <div className="text-sm text-stone-500 font-mono">{entry.entry_number}</div>
        </div>

        {/* Receipt body */}
        <div className="space-y-6 text-sm text-stone-800">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Entry Date</div>
              <div className="font-mono">{entryDate}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Receipt Date</div>
              <div className="font-mono">{receiptDate}</div>
            </div>
          </div>

          {entry.depositor_name && (
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Depositor</div>
              <div>{entry.depositor_name}</div>
              {entry.depositor_contact && <div className="text-stone-500 text-xs mt-0.5">{entry.depositor_contact}</div>}
            </div>
          )}

          <div>
            <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Object Description</div>
            <div className="whitespace-pre-wrap">{entry.object_description || entry.objects?.title || '—'}</div>
            {entry.object_count > 1 && (
              <div className="text-stone-500 text-xs mt-1">{entry.object_count} items</div>
            )}
          </div>

          {entry.entry_reason && (
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Reason for Entry</div>
              <div>{entry.entry_reason}</div>
            </div>
          )}

          {(entry.received_by) && (
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Received By</div>
              <div>{entry.received_by}</div>
            </div>
          )}

          {entry.condition_on_entry && (
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Condition on Entry</div>
              <div>{entry.condition_on_entry}</div>
            </div>
          )}
        </div>

        {/* Acknowledgement statement */}
        <div className="mt-10 pt-6 border-t border-stone-200 text-sm text-stone-600 leading-relaxed">
          This receipt confirms that the above object(s) have been received into the care of {museum?.name || 'this museum'} on the date shown above. The museum accepts responsibility for the safekeeping of the object(s) in accordance with its collections management policy.
        </div>

        {/* Signatures */}
        <div className="mt-12 grid grid-cols-2 gap-12">
          <div>
            {entry.depositor_signed && entry.depositor_signed_date ? (
              <div className="pt-2">
                <div className="text-xs text-stone-500 mb-1">Signed by museum staff</div>
                <div className="text-sm font-mono text-stone-700">
                  {new Date(entry.depositor_signed_date + 'T00:00:00').toLocaleDateString('en-GB')}
                </div>
              </div>
            ) : (
              <div className="border-t border-stone-400 pt-2">
                <div className="text-xs text-stone-500">Received by (museum staff)</div>
              </div>
            )}
          </div>
          <div>
            {entry.digital_acknowledgement ? (
              <div className="pt-2">
                <div className="text-xs text-stone-500 mb-1">Depositor acknowledged digitally</div>
                {entry.digital_acknowledgement_date && (
                  <div className="text-sm font-mono text-stone-700">
                    {new Date(entry.digital_acknowledgement_date + 'T00:00:00').toLocaleDateString('en-GB')}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-stone-400 pt-2">
                <div className="text-xs text-stone-500">Depositor signature</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-xs text-stone-400 text-center font-mono">
          {entry.entry_number} · {museum?.name} · {receiptDate}
        </div>
      </div>
    </>
  )
}
