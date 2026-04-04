'use client'

import { useEffect, useState } from 'react'
import { formatSize } from '@/lib/formatSize'

const DOC_TYPES = [
  'Deed of Gift', 'Bill of Sale', 'Export Licence', 'Ethics Approval', 'Accession Form',
  'Loan Agreement', 'Insurance Certificate', 'Facility Report', 'Condition Report',
  'Treatment Report', 'Valuation Certificate', 'Survey Report', 'Insurance Schedule',
  'Provenance Research', 'Ownership Document', 'Licence Agreement', 'Copyright Certificate',
  'Correspondence', 'Photograph', 'Other',
]

const ACCEPTED = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.csv'
const MAX_BYTES = 20 * 1024 * 1024

function fileIcon(mime: string | null) {
  if (!mime) return '📄'
  if (mime.startsWith('image/')) return '🖼'
  if (mime === 'application/pdf') return '📋'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.endsWith('.csv')) return '📊'
  return '📄'
}

interface Props {
  canEdit: boolean
  object: any
  museum: any
  supabase: any
}

export default function DocumentsTab({ canEdit, object, museum, supabase }: Props) {
  const [docs, setDocs] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [docType, setDocType] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canAttach = canEdit && museum?.plan && true // compliance docs enabled

  useEffect(() => {
    supabase
      .from('object_documents')
      .select('*')
      .eq('object_id', object.id)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => {
        setDocs(data || [])
        setLoaded(true)
      })
  }, [object.id])

  async function upload() {
    if (!file) return
    if (file.size > MAX_BYTES) { setError('File exceeds 20 MB limit'); return }
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `${museum.id}/${object.id}/documents/${Date.now()}.${ext}`
    const { error: storageError } = await supabase.storage.from('object-documents').upload(path, file)
    if (storageError) { setError(storageError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('object-documents').getPublicUrl(path)
    const { data: doc, error: dbError } = await supabase.from('object_documents').insert({
      object_id: object.id,
      museum_id: museum.id,
      related_to_type: 'general',
      related_to_id: null,
      label: label || file.name,
      document_type: docType || 'Other',
      notes: notes || null,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    }).select().single()

    if (dbError) { setError(dbError.message); setUploading(false); return }
    setDocs(prev => [doc, ...prev])
    setLabel('')
    setDocType('')
    setNotes('')
    setFile(null)
    setShowForm(false)
    setUploading(false)
  }

  async function deleteDoc(doc: any) {
    if (!confirm(`Remove "${doc.label || doc.file_name}"?`)) return
    const path = doc.file_url.split('/object-documents/')[1]
    if (path) await supabase.storage.from('object-documents').remove([path])
    await supabase.from('object_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">Supporting Documents</h3>
          {canAttach && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 transition-colors"
            >
              + Add document
            </button>
          )}
        </div>

        {!loaded && (
          <p className="text-xs text-stone-400 dark:text-stone-500">Loading…</p>
        )}

        {loaded && docs.length === 0 && !showForm && (
          <p className="text-xs text-stone-400 dark:text-stone-500">No documents attached yet.</p>
        )}

        {docs.length > 0 && (
          <div className="space-y-2 mb-4">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-start gap-3 p-3 border border-stone-100 dark:border-stone-800 rounded-lg">
                <span className="text-lg mt-0.5 shrink-0">{fileIcon(doc.mime_type)}</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-stone-900 dark:text-stone-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate block"
                  >
                    {doc.label || doc.file_name}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    {doc.document_type && (
                      <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{doc.document_type}</span>
                    )}
                    {doc.file_size && (
                      <span className="text-xs text-stone-400 dark:text-stone-500">{formatSize(doc.file_size)}</span>
                    )}
                  </div>
                  {doc.notes && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{doc.notes}</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => deleteDoc(doc)}
                    className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="border border-stone-100 dark:border-stone-800 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Label</label>
                <input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Deed of Gift — Smith family"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Document Type</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                >
                  <option value="">— Select type —</option>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Notes</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes about this document…"
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">File</label>
              <input
                type="file"
                accept={ACCEPTED}
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="text-xs text-stone-600 dark:text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-stone-200 dark:file:border-stone-700 file:text-xs file:font-mono file:bg-white dark:file:bg-stone-900 file:text-stone-700 dark:file:text-stone-300 hover:file:bg-stone-50 dark:hover:file:bg-stone-800 file:transition-colors"
              />
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">PDF, Word, Excel, CSV, or images. Max 20 MB.</p>
            </div>
            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={upload}
                disabled={!file || uploading}
                className="text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded px-4 py-1.5 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <button
                onClick={() => { setShowForm(false); setLabel(''); setDocType(''); setNotes(''); setFile(null); setError(null) }}
                className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
