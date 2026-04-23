import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { r2, ListObjectsV2Command } from '@/lib/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import archiver from 'archiver'
import { Readable } from 'node:stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Every museum-scoped table with a museum_id column. Kept alphabetical.
// `event_time_slots` and `tickets` aren't here — they have no museum_id; we
// export them below via a join on their parent's museum_id.
const EXPORT_TABLES = [
  'activity_log',
  'audit_exercises',
  'audit_records',
  'collection_reviews',
  'collection_use_records',
  'condition_assessments',
  'conservation_treatments',
  'damage_reports',
  'disposal_record_documents',
  'disposal_records',
  'documentation_plan_backlogs',
  'documentation_plan_documents',
  'documentation_plans',
  'emergency_event_objects',
  'emergency_events',
  'emergency_plan_documents',
  'emergency_plans',
  'emergency_salvage_priorities',
  'entry_records',
  'events',
  'insurance_policies',
  'insurance_policy_documents',
  'insurance_policy_objects',
  'loans',
  'location_history',
  'locations',
  'object_components',
  'object_documents',
  'object_duplicates',
  'object_exits',
  'object_images',
  'object_share_links',
  'objects',
  'page_views',
  'personal_loans',
  'reproduction_requests',
  'rights_records',
  'risk_register',
  'staff',
  'staff_members',
  'ticket_orders',
  'valuations',
  'wanted_items',
] as const

const R2_BUCKET_MAP: Array<{ bucket: string; folder: string }> = [
  { bucket: 'object-images', folder: 'images' },
  { bucket: 'object-documents', folder: 'documents' },
  { bucket: 'museum-assets', folder: 'assets' },
]

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const headerLine = headers.map(h => `"${h}"`).join(',')
  const dataLines = rows.map(r => headers.map(h => escapeCsv(r[h])).join(','))
  return [headerLine, ...dataLines].join('\n')
}

export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  // Owner-only — staff can't export the whole account.
  const { data: museum } = await supabase
    .from('museums')
    .select('id, name, slug')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // store-only: museum media is already compressed. Re-deflating wastes CPU
  // for no gain and would slow the stream.
  const archive = archiver('zip', { store: true })

  archive.on('warning', err => console.error('[export] archive warning:', err))
  archive.on('error', err => console.error('[export] archive error:', err))

  // Populate the archive asynchronously. Archiver buffers & streams internally
  // as data is appended, so the response starts sending bytes immediately.
  ;(async () => {
    try {
      // CSVs — one per table.
      for (const table of EXPORT_TABLES) {
        const { data, error } = await admin.from(table).select('*').eq('museum_id', museum.id)
        if (error) {
          console.error(`[export] ${table}: ${error.message}`)
          continue
        }
        archive.append(rowsToCsv(data ?? []), { name: `${table}.csv` })
      }

      // Museum row itself (no museum_id FK to self).
      const { data: museumRow } = await admin.from('museums').select('*').eq('id', museum.id).maybeSingle()
      if (museumRow) archive.append(rowsToCsv([museumRow]), { name: 'museum.csv' })

      // event_time_slots and tickets have no museum_id — join via parent IDs.
      const { data: events } = await admin.from('events').select('id').eq('museum_id', museum.id)
      const eventIds = (events ?? []).map(e => e.id)
      if (eventIds.length > 0) {
        const { data: slots } = await admin.from('event_time_slots').select('*').in('event_id', eventIds)
        archive.append(rowsToCsv(slots ?? []), { name: 'event_time_slots.csv' })
      } else {
        archive.append('', { name: 'event_time_slots.csv' })
      }

      const { data: orders } = await admin.from('ticket_orders').select('id').eq('museum_id', museum.id)
      const orderIds = (orders ?? []).map(o => o.id)
      if (orderIds.length > 0) {
        const { data: tickets } = await admin.from('tickets').select('*').in('order_id', orderIds)
        archive.append(rowsToCsv(tickets ?? []), { name: 'tickets.csv' })
      } else {
        archive.append('', { name: 'tickets.csv' })
      }

      // R2 media — stream each file into the archive one at a time so we
      // only hold one connection + one file's bytes in memory at any moment.
      for (const { bucket, folder } of R2_BUCKET_MAP) {
        const prefix = `${museum.id}/`
        let token: string | undefined
        do {
          const list = await r2.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: token,
          }))
          for (const obj of list.Contents ?? []) {
            if (!obj.Key) continue
            const get = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: obj.Key }))
            const body = get.Body as Readable | undefined
            if (!body) continue
            const relative = obj.Key.startsWith(prefix) ? obj.Key.slice(prefix.length) : obj.Key
            archive.append(body, { name: `${folder}/${relative}` })
            // Wait for this entry to finish before opening the next R2 stream,
            // otherwise AWS SDK connections pile up and archiver back-pressures.
            await new Promise<void>((resolve, reject) => {
              const onEntry = () => { cleanup(); resolve() }
              const onError = (err: Error) => { cleanup(); reject(err) }
              const cleanup = () => {
                archive.off('entry', onEntry)
                archive.off('error', onError)
              }
              archive.once('entry', onEntry)
              archive.once('error', onError)
            })
          }
          token = list.IsTruncated ? list.NextContinuationToken : undefined
        } while (token)
      }

      await archive.finalize()
    } catch (err) {
      console.error('[export] failed', err)
      archive.abort()
    }
  })()

  const webStream = Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>
  const filename = `${museum.slug || 'museum'}-export-${new Date().toISOString().slice(0, 10)}.zip`
  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
