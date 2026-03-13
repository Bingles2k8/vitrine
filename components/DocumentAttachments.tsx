'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const DOC_TYPES: Record<string, string[]> = {
  acquisition:            ['Deed of Gift', 'Bill of Sale', 'Export Licence', 'Ethics Approval', 'Accession Form', 'Other'],
  loan:                   ['Loan Agreement', 'Insurance Certificate', 'Facility Report', 'Condition Report', 'Courier Instructions', 'Other'],
  conservation_treatment: ['Treatment Report', 'Condition Survey', 'Materials Safety Sheet', 'Specification', 'Other'],
  condition_assessment:   ['Condition Report', 'Hazard Assessment', 'Photography Record', 'Other'],
  entry_record:           ['Entry Form', 'Depositor Agreement', 'Receipt', 'Correspondence', 'Other'],
}

const ACCEPTED = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.csv'
const MAX_BYTES = 20 * 1024 * 1024

interface Props {
  objectId: string
  museumId: string
  relatedToType: string
  relatedToId: string | null
  canEdit: boolean
  canAttach?: boolean
}

function fileIcon(mime: string | null) {
  if (!mime) return '📄'
  if (mime.startsWith('image/')) return '🖼'
  if (mime === 'application/pdf') return '📋'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.endsWith('.csv')) return '📊'
  return '📄'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentAttachments({ objectId, museumId, relatedToType, relatedToId, canEdit, canAttach }: Props) {
  const uploadEnabled = canAttach ?? canEdit
  const [docs, setDocs] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const typeOptions = DOC_TYPES[relatedToType] ?? ['Other']

  useEffect(() => {
    let q = supabase
      .from('object_documents')
      .select('*')
      .eq('object_id', objectId)
      .eq('related_to_type', relatedToType)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (relatedToId) {
      q = q.eq('related_to_id', relatedToId)
    } else {
      q = q.is('related_to_id', null)
    }

    q.then(({ data }) => { setDocs(data || []); setLoaded(true) })
  }, [objectId, relatedToType, relatedToId])

  function resetForm() {
    setShowForm(false)
    setLabel('')
    setDocType('')
    setFile(null)
    setError(null)
  }

  async function handleUpload() {
    if (!file || !label.trim() || uploading) return
    if (file.size > MAX_BYTES) { setError('File too large (max 20 MB)'); return }
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `${museumId}/${objectId}/${relatedToType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data: storageData, error: storageErr } = await supabase.storage
      .from('object-documents')
      .upload(path, file, { upsert: false })

    if (storageErr) { setError(storageErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('object-documents').getPublicUrl(storageData.path)

    const res = await fetch(`/api/objects/${objectId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        related_to_type: relatedToType,
        related_to_id: relatedToId,
        label: label.trim(),
        document_type: docType || null,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Upload failed')
      await supabase.storage.from('object-documents').remove([storageData.path])
      setUploading(false)
      return
    }

    const newDoc = await res.json()
    setDocs(d => [newDoc, ...d])
    resetForm()
    setUploading(false)
  }

  async function deleteDoc(doc: any) {
    await fetch(`/api/objects/${objectId}/documents/${doc.id}`, { method: 'DELETE' })
    setDocs(d => d.filter(x => x.id !== doc.id))
  }

  if (!loaded) return null
  if (docs.length === 0 && !canEdit) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-stone-600 dark:text-stone-400">
          📎 Supporting Documents{docs.length > 0 && <span className="ml-1 normal-case tracking-normal font-mono text-stone-400 dark:text-stone-500">({docs.length})</span>}
        </span>
        {uploadEnabled && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-600 hover:border-stone-900 dark:hover:border-stone-300 rounded px-2 py-0.5 transition-colors"
          >
            + Attach file
          </button>
        )}
      </div>

      {docs.length > 0 && (
        <div className="space-y-1 mb-3">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-2 py-1.5 px-3 bg-stone-50 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 group">
              <span className="text-sm shrink-0">{fileIcon(doc.mime_type)}</span>
              <div className="flex-1 min-w-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-900 dark:text-stone-100 hover:underline truncate block"
                >
                  {doc.label}
                </a>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {doc.document_type && (
                    <span className="text-xs font-mono text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                      {doc.document_type}
                    </span>
                  )}
                  <span className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate">{doc.file_name}</span>
                  {doc.file_size && (
                    <span className="text-xs font-mono text-stone-300 dark:text-stone-600 shrink-0">{formatSize(doc.file_size)}</span>
                  )}
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => deleteDoc(doc)}
                  className="text-xs font-mono text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadEnabled && showForm && (
        <div className="border border-stone-200 dark:border-stone-700 rounded p-3 space-y-2 bg-stone-50 dark:bg-stone-800/50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-stone-400 dark:text-stone-500 mb-1">Label *</label>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Deed of Gift 2024"
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-400 dark:text-stone-500 mb-1">Type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              >
                <option value="">— Optional —</option>
                {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-stone-400 dark:text-stone-500 mb-1">File * (PDF, Word, image, spreadsheet — max 20 MB)</label>
            <input
              type="file"
              accept={ACCEPTED}
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-xs text-stone-500 dark:text-stone-400 w-full file:mr-2 file:text-xs file:font-mono file:border file:border-stone-200 dark:file:border-stone-700 file:rounded file:px-2 file:py-1 file:bg-stone-100 dark:file:bg-stone-800 file:text-stone-600 dark:file:text-stone-300"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !file || !label.trim()}
              className="text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-3 py-1.5 rounded disabled:opacity-40"
            >
              {uploading ? 'Uploading…' : 'Upload →'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 px-3 py-1.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
