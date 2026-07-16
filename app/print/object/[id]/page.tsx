import { createReadOnlyServerClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getPlan } from '@/lib/plans'
import { formatDimensions } from '@/lib/formatDimensions'
import PrintButtons from './PrintButtons'

export default async function PrintObjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createReadOnlyServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: object } = await serviceClient
    .from('objects')
    .select('*, museums!inner(name, slug, owner_id, plan)')
    .eq('id', id)
    .single()

  if (!object) redirect('/dashboard')

  const museum = object.museums as any
  if (!getPlan(museum.plan).fullMode) redirect('/dashboard/plan')

  const isOwner = museum.owner_id === user.id
  if (!isOwner) {
    const { data: staffMember } = await serviceClient
      .from('staff_members')
      .select('access')
      .eq('museum_id', object.museum_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!staffMember) redirect('/dashboard')
  }

  const [
    { data: valuations },
    { data: conditions },
    { data: locationHistory },
    { data: loans },
    { data: conservation },
    { data: exits },
    { data: damage },
    { data: risks },
    { data: rightsRecords },
    { data: reproductions },
  ] = await Promise.all([
    serviceClient.from('valuations').select('*').eq('object_id', id).order('valuation_date', { ascending: false }),
    serviceClient.from('condition_assessments').select('*').eq('object_id', id).order('assessed_at', { ascending: false }),
    serviceClient.from('location_history').select('*').eq('object_id', id).order('moved_at', { ascending: false }),
    serviceClient.from('loans').select('*').eq('object_id', id).order('loan_start_date', { ascending: false }),
    serviceClient.from('conservation_treatments').select('*').eq('object_id', id).order('start_date', { ascending: false }),
    serviceClient.from('object_exits').select('*').eq('object_id', id).order('exit_date', { ascending: false }),
    serviceClient.from('damage_reports').select('*').eq('object_id', id).order('incident_date', { ascending: false }),
    serviceClient.from('risk_register').select('*').eq('object_id', id).order('created_at', { ascending: false }),
    serviceClient.from('rights_records').select('*').eq('object_id', id).order('created_at', { ascending: false }),
    serviceClient.from('reproduction_requests').select('*').eq('object_id', id).order('created_at', { ascending: false }),
  ])

  const fmt = (d: string | null | undefined) => d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB') : '—'
  const val = (v: any) => v || '—'

  return (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: '11pt', color: '#1a1a1a', background: 'white', padding: '2cm', maxWidth: '21cm', margin: '0 auto' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body > * > * > *:not([data-print-content]) { display: none !important; }
        }
        .pr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt 20pt; margin-bottom: 6pt; }
        .pr-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #888; font-family: monospace; display: block; margin-bottom: 1pt; }
        .pr-value { font-size: 10pt; }
        .pr-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 4pt; }
        .pr-table th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; color: #888; font-family: monospace; font-weight: normal; padding: 4pt 6pt; border-bottom: 1px solid #ddd; }
        .pr-table td { padding: 4pt 6pt; border-bottom: 1px solid #eee; vertical-align: top; }
        .pr-h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.1em; color: #666; font-family: monospace; font-weight: normal; margin: 20pt 0 8pt; border-top: 1px solid #ccc; padding-top: 8pt; }
        .pr-tag { display: inline-block; font-size: 8pt; font-family: monospace; border: 1px solid #ccc; padding: 1pt 4pt; border-radius: 3pt; }
      `}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print">
        <PrintButtons />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16pt', paddingBottom: '12pt', borderBottom: '2px solid #1a1a1a' }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '9pt', color: '#666', marginBottom: '2pt' }}>{val(object.accession_no)}</div>
          <h1 style={{ fontSize: '20pt', fontStyle: 'italic', fontWeight: 'normal', marginBottom: '4pt' }}>{object.emoji} {object.title}</h1>
          <div style={{ fontFamily: 'monospace', fontSize: '9pt', color: '#999' }}>Generated {new Date().toLocaleDateString('en-GB')}</div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '9pt', color: '#666', textAlign: 'right' }}>
          {museum.name}<br />Object Record
        </div>
      </div>

      {/* Object Information */}
      <div className="pr-h2">Object Information</div>
      <div className="pr-grid">
        {/* maker_name is the structured Production & Attribution field; artist is
            the older free-text one. Prefer the structured value, fall back. */}
        <div><span className="pr-label">Artist / Maker</span><span className="pr-value">{val(object.maker_name || object.artist)}{object.maker_role ? ` (${object.maker_role})` : ''}</span></div>
        <div><span className="pr-label">Year</span><span className="pr-value">{val(object.production_date || object.year)}</span></div>
        <div><span className="pr-label">Medium</span><span className="pr-value">{val(object.medium)}</span></div>
        <div><span className="pr-label">Object Type</span><span className="pr-value">{val(object.object_type)}</span></div>
        <div><span className="pr-label">Culture / Origin</span><span className="pr-value">{val(object.culture)}</span></div>
        <div><span className="pr-label">Status</span><span className="pr-value"><span className="pr-tag">{object.status}</span></span></div>
        <div><span className="pr-label">Dimensions</span><span className="pr-value">{val(formatDimensions(object))}</span></div>
        <div><span className="pr-label">Current Location</span><span className="pr-value">{val(object.current_location)}</span></div>
        {object.production_place && <div><span className="pr-label">Production Place</span><span className="pr-value">{object.production_place}</span></div>}
        {object.technique && <div><span className="pr-label">Technique</span><span className="pr-value">{object.technique}</span></div>}
        {object.school_style_period && <div><span className="pr-label">School / Style / Period</span><span className="pr-value">{object.school_style_period}</span></div>}
        {object.subject_depicted && <div><span className="pr-label">Subject Depicted</span><span className="pr-value">{object.subject_depicted}</span></div>}
      </div>
      {object.description && <div style={{ marginTop: '6pt' }}><span className="pr-label">Description</span><p className="pr-value">{object.description}</p></div>}

      {/* Acquisition */}
      <div className="pr-h2">Acquisition</div>
      <div className="pr-grid">
        <div><span className="pr-label">Method</span><span className="pr-value">{val(object.acquisition_method)}</span></div>
        <div><span className="pr-label">Date</span><span className="pr-value">{fmt(object.acquisition_date)}</span></div>
        <div><span className="pr-label">Source</span><span className="pr-value">{val(object.acquisition_source)}</span></div>
        <div><span className="pr-label">Authorised By</span><span className="pr-value">{val(object.acquisition_authorised_by)}</span></div>
        <div><span className="pr-label">Legal Transfer</span><span className="pr-value">{fmt(object.legal_transfer_date)}</span></div>
        <div><span className="pr-label">Register Confirmed</span><span className="pr-value">{object.accession_register_confirmed ? 'Yes' : 'No'}</span></div>
      </div>

      {/* Condition History */}
      {conditions && conditions.length > 0 && (
        <>
          <div className="pr-h2">Condition History</div>
          <table className="pr-table">
            <thead><tr><th>Date</th><th>Grade</th><th>Assessor</th><th>Notes</th></tr></thead>
            <tbody>
              {conditions.map((c: any) => (
                <tr key={c.id}><td>{fmt(c.assessed_at)}</td><td>{val(c.grade)}</td><td>{val(c.assessor)}</td><td>{val(c.notes)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Location History */}
      {locationHistory && locationHistory.length > 0 && (
        <>
          <div className="pr-h2">Location History</div>
          <table className="pr-table">
            <thead><tr><th>Date</th><th>Location</th><th>Reason</th><th>Moved By</th></tr></thead>
            <tbody>
              {locationHistory.map((l: any) => (
                <tr key={l.id}><td>{fmt(l.moved_at)}</td><td>{val(l.location)}</td><td>{val(l.reason)}</td><td>{val(l.moved_by)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Loans */}
      {loans && loans.length > 0 && (
        <>
          <div className="pr-h2">Loan History</div>
          <table className="pr-table">
            <thead><tr><th>Direction</th><th>Institution</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {loans.map((l: any) => (
                <tr key={l.id}><td>{val(l.direction)}</td><td>{val(l.borrowing_institution)}</td><td>{fmt(l.loan_start_date)}</td><td>{fmt(l.loan_end_date)}</td><td>{val(l.status)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Conservation */}
      {conservation && conservation.length > 0 && (
        <>
          <div className="pr-h2">Conservation Treatments</div>
          <table className="pr-table">
            <thead><tr><th>Date</th><th>Type</th><th>Conservator</th><th>Description</th></tr></thead>
            <tbody>
              {conservation.map((c: any) => (
                <tr key={c.id}><td>{fmt(c.start_date)}</td><td>{val(c.treatment_type)}</td><td>{val(c.conservator)}</td><td>{val(c.description)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Valuations */}
      {valuations && valuations.length > 0 && (
        <>
          <div className="pr-h2">Valuations</div>
          <table className="pr-table">
            <thead><tr><th>Date</th><th>Value</th><th>Currency</th><th>Valuer</th><th>Purpose</th></tr></thead>
            <tbody>
              {valuations.map((v: any) => (
                <tr key={v.id}><td>{fmt(v.valuation_date)}</td><td>{val(v.value)}</td><td>{val(v.currency)}</td><td>{val(v.valuer)}</td><td>{val(v.purpose)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Exit history */}
      {exits && exits.length > 0 && (
        <>
          <div className="pr-h2">Exit History</div>
          <table className="pr-table">
            <thead><tr><th>Date</th><th>Reason</th><th>Recipient</th><th>Authorised By</th><th>Returned</th></tr></thead>
            <tbody>
              {exits.map((e: any) => (
                <tr key={e.id}><td>{fmt(e.exit_date)}</td><td>{val(e.exit_reason)}</td><td>{val(e.recipient_name)}</td><td>{val(e.exit_authorised_by)}</td><td>{e.returned_date ? fmt(e.returned_date) : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Damage & loss */}
      {damage && damage.length > 0 && (
        <>
          <div className="pr-h2">Damage & Loss</div>
          <table className="pr-table">
            <thead><tr><th>Incident</th><th>Type</th><th>Severity</th><th>Status</th><th>Description</th></tr></thead>
            <tbody>
              {damage.map((d: any) => (
                <tr key={d.id}><td>{fmt(d.incident_date)}</td><td>{val(d.damage_type)}</td><td>{val(d.severity)}</td><td>{val(d.status)}</td><td>{val(d.description)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Deaccession — shown when the object has been disposed */}
      {(object.status === 'Deaccessioned' || object.disposal_method || object.disposal_date) && (
        <>
          <div className="pr-h2">Deaccession & Disposal</div>
          <div className="pr-grid">
            <div><span className="pr-label">Method</span><span className="pr-value">{val(object.disposal_method)}</span></div>
            <div><span className="pr-label">Date</span><span className="pr-value">{fmt(object.disposal_date)}</span></div>
            <div><span className="pr-label">Recipient</span><span className="pr-value">{val(object.disposal_recipient)}</span></div>
            <div><span className="pr-label">Authorised By</span><span className="pr-value">{val(object.disposal_authorization)}</span></div>
          </div>
          {object.disposal_note && <div style={{ marginTop: '6pt' }}><span className="pr-label">Note</span><p className="pr-value">{object.disposal_note}</p></div>}
        </>
      )}

      {/* Risk */}
      {risks && risks.length > 0 && (
        <>
          <div className="pr-h2">Risk History</div>
          <table className="pr-table">
            <thead><tr><th>Type</th><th>Severity</th><th>Likelihood</th><th>Status</th><th>Review Due</th><th>Mitigation</th></tr></thead>
            <tbody>
              {risks.map((r: any) => (
                <tr key={r.id}><td>{val(r.risk_type)}</td><td>{val(r.severity)}</td><td>{val(r.likelihood)}</td><td>{val(r.status)}</td><td>{r.review_date ? fmt(r.review_date) : '—'}</td><td>{val(r.mitigation)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Rights */}
      <div className="pr-h2">Rights & Legal</div>
      <div className="pr-grid">
        <div><span className="pr-label">Copyright Status</span><span className="pr-value">{val(object.copyright_status)}</span></div>
        <div><span className="pr-label">Rights Holder</span><span className="pr-value">{val(object.rights_holder)}</span></div>
      </div>
      {object.rights_notes && <div><span className="pr-label">Notes</span><p className="pr-value">{object.rights_notes}</p></div>}

      {/* Rights records — the object-level fields above are a summary; these are
          the actual licences and their terms. */}
      {rightsRecords && rightsRecords.length > 0 && (
        <table className="pr-table">
          <thead><tr><th>Reference</th><th>Type</th><th>Status</th><th>Holder</th><th>Expires</th><th>Terms</th><th>Restrictions</th></tr></thead>
          <tbody>
            {rightsRecords.map((r: any) => (
              <tr key={r.id}><td>{val(r.rights_reference)}</td><td>{val(r.rights_type)}</td><td>{val(r.rights_status)}</td><td>{val(r.rights_holder)}</td><td>{r.expiry_date ? fmt(r.expiry_date) : '—'}</td><td>{val(r.licence_terms)}</td><td>{val(r.restrictions)}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Reproduction */}
      {reproductions && reproductions.length > 0 && (
        <>
          <div className="pr-h2">Reproduction Requests</div>
          <table className="pr-table">
            <thead><tr><th>Requested</th><th>Requester</th><th>Purpose</th><th>Type</th><th>Status</th><th>Fee</th></tr></thead>
            <tbody>
              {reproductions.map((r: any) => (
                <tr key={r.id}><td>{fmt(r.request_date || r.created_at)}</td><td>{val(r.requester_name)}</td><td>{val(r.purpose)}</td><td>{val(r.reproduction_type)}</td><td>{val(r.status)}</td><td>{r.fee != null ? `${r.fee_currency || ''} ${r.fee}`.trim() : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ marginTop: '24pt', paddingTop: '8pt', borderTop: '1px solid #eee', fontSize: '8pt', color: '#aaa', fontFamily: 'monospace' }}>
        Printed from Vitrine Collection Management — {museum.name} — {new Date().toLocaleDateString('en-GB')}
      </div>
    </div>
  )
}
