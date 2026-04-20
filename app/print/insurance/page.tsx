import { createReadOnlyServerClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getPlan } from '@/lib/plans'
import PrintButtons from '@/app/print/object/[id]/PrintButtons'
import { getCollectionValue, formatCollectionValue } from '@/lib/collectionValue'

export default async function InsurancePackPage() {
  const supabase = await createReadOnlyServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: museum } = await serviceClient
    .from('museums')
    .select('id, name, slug, owner_id, plan')
    .eq('owner_id', user.id)
    .maybeSingle()

  let resolvedMuseum = museum
  if (!resolvedMuseum) {
    const { data: staffRow } = await serviceClient
      .from('staff_members')
      .select('museum_id, access')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!staffRow) redirect('/dashboard')
    const { data: staffMuseum } = await serviceClient
      .from('museums')
      .select('id, name, slug, owner_id, plan')
      .eq('id', staffRow.museum_id)
      .single()
    if (!staffMuseum) redirect('/dashboard')
    resolvedMuseum = staffMuseum
  }

  if (!getPlan(resolvedMuseum.plan).analytics) redirect('/dashboard/plan')

  const { data: objects } = await serviceClient
    .from('objects')
    .select('id, title, artist, year, medium, object_type, dimensions, condition_grade, acquisition_date, acquisition_value, acquisition_currency, estimated_value, estimated_value_currency, insured_value, insured_value_currency, current_location, accession_no, emoji, image_url')
    .eq('museum_id', resolvedMuseum.id)
    .is('deleted_at', null)
    .order('title')

  const allObjects = objects || []
  const objectIds = allObjects.map(o => o.id)

  const { data: primaryImages } = objectIds.length > 0
    ? await serviceClient
        .from('object_images')
        .select('object_id, url')
        .in('object_id', objectIds)
        .eq('is_primary', true)
    : { data: [] }

  const imageByObject: Record<string, string> = {}
  for (const img of primaryImages || []) {
    imageByObject[img.object_id] = img.url
  }

  const collectionValue = getCollectionValue(allObjects)
  const formattedValue = formatCollectionValue(collectionValue)

  const fmt = (d: string | null | undefined) =>
    d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB') : '—'

  const fmtMoney = (value: number | null, currency: string | null) => {
    if (!value) return '—'
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP', maximumFractionDigits: 0 }).format(value)
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: '11pt', color: '#1a1a1a', background: 'white', padding: '2cm', maxWidth: '21cm', margin: '0 auto' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body > * > * > *:not([data-print-content]) { display: none !important; }
          tr { page-break-inside: avoid; }
        }
        .pr-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #888; font-family: monospace; display: block; margin-bottom: 1pt; }
        .pr-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 4pt; }
        .pr-table th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; color: #888; font-family: monospace; font-weight: normal; padding: 5pt 6pt; border-bottom: 1px solid #ddd; }
        .pr-table td { padding: 6pt 6pt; border-bottom: 1px solid #eee; vertical-align: top; }
        .ins-thumb { width: 40pt; height: 40pt; object-fit: cover; border-radius: 2pt; display: block; }
        .ins-placeholder { width: 40pt; height: 40pt; background: #f0f0f0; border-radius: 2pt; display: flex; align-items: center; justify-content: center; font-size: 16pt; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12pt; margin: 16pt 0; }
        .summary-card { border: 1px solid #e5e7eb; border-radius: 4pt; padding: 10pt; }
        .summary-card .val { font-size: 14pt; font-weight: normal; margin-top: 2pt; }
      `}</style>

      <div className="no-print">
        <PrintButtons />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16pt', paddingBottom: '12pt', borderBottom: '2px solid #1a1a1a' }}>
        <div>
          <h1 style={{ fontSize: '20pt', fontStyle: 'italic', fontWeight: 'normal', marginBottom: '4pt' }}>{resolvedMuseum.name}</h1>
          <div style={{ fontFamily: 'monospace', fontSize: '9pt', color: '#666' }}>Collection Insurance Schedule</div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '9pt', color: '#666', textAlign: 'right' }}>
          Generated {today}<br />
          vitrinecms.com
        </div>
      </div>

      {/* Summary */}
      <div className="summary-grid">
        <div className="summary-card">
          <span className="pr-label">Total Items</span>
          <div className="val">{allObjects.length}</div>
        </div>
        <div className="summary-card">
          <span className="pr-label">Estimated Collection Value</span>
          <div className="val">{collectionValue ? formattedValue : '—'}</div>
        </div>
        <div className="summary-card">
          <span className="pr-label">Insured Items</span>
          <div className="val">{allObjects.filter(o => o.insured_value).length}</div>
        </div>
      </div>

      {/* Schedule */}
      <div style={{ fontFamily: 'monospace', fontSize: '9pt', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8pt', marginTop: '20pt', borderTop: '1px solid #ccc', paddingTop: '8pt' }}>
        Collection Schedule
      </div>

      {allObjects.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>No objects in collection.</p>
      ) : (
        <table className="pr-table">
          <thead>
            <tr>
              <th style={{ width: '44pt' }}></th>
              <th>Item</th>
              <th>Type / Medium</th>
              <th>Condition</th>
              <th>Purchased</th>
              <th>Estimated Value</th>
              <th>Insured Value</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {allObjects.map(o => {
              const imgUrl = imageByObject[o.id] || o.image_url
              return (
                <tr key={o.id}>
                  <td>
                    {imgUrl
                      ? <img src={imgUrl} alt="" className="ins-thumb" />
                      : <div className="ins-placeholder">{o.emoji || '🖼️'}</div>
                    }
                  </td>
                  <td>
                    <div style={{ fontWeight: 'normal', marginBottom: '2pt' }}>{o.title}</div>
                    {o.artist && <div style={{ color: '#666', fontSize: '8pt', fontFamily: 'monospace' }}>{o.artist}{o.year ? `, ${o.year}` : ''}</div>}
                    {o.dimensions && <div style={{ color: '#999', fontSize: '8pt', fontFamily: 'monospace' }}>{o.dimensions}</div>}
                    <div style={{ color: '#bbb', fontSize: '7pt', fontFamily: 'monospace', marginTop: '2pt' }}>{o.accession_no}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '8pt', color: '#555' }}>
                    {[o.object_type, o.medium].filter(Boolean).join('\n') || '—'}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '8pt', color: '#555' }}>{o.condition_grade || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '8pt', color: '#555' }}>
                    {fmt(o.acquisition_date)}
                    {o.acquisition_value && <div style={{ marginTop: '2pt' }}>{fmtMoney(o.acquisition_value, o.acquisition_currency)}</div>}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '9pt' }}>{fmtMoney(o.estimated_value, o.estimated_value_currency)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '9pt' }}>{fmtMoney(o.insured_value, o.insured_value_currency)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '8pt', color: '#555' }}>{o.current_location || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Footer */}
      <div style={{ marginTop: '24pt', paddingTop: '8pt', borderTop: '1px solid #ddd', fontFamily: 'monospace', fontSize: '8pt', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
        <span>Generated by Vitrine · vitrinecms.com</span>
        <span>{today}</span>
      </div>
    </div>
  )
}
