'use client'

import { useState, useRef } from 'react'

const EXPECTED_COLS = ['title', 'artist', 'year', 'medium', 'dimensions', 'description', 'accession_no', 'acquisition_method', 'acquisition_date', 'acquisition_source', 'status']

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map(line => {
    // Simple CSV parse (handles quoted fields)
    const values: string[] = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQ = !inQ; continue }
      if (c === ',' && !inQ) { values.push(cur); cur = ''; continue }
      cur += c
    }
    values.push(cur)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim() })
    return row
  }).filter(r => r.title || r.accession_no)
}

interface CSVImportModalProps {
  onClose: () => void
  onSuccess: (count: number) => void
}

export default function CSVImportModal({ onClose, onSuccess }: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) { setError('No valid rows found. Make sure the CSV has a header row and a "title" or "accession_no" column.'); return }
      setError('')
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    setImporting(true)
    setError('')
    try {
      const res = await fetch('/api/import/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Import failed'); setImporting(false); return }
      onSuccess(json.imported)
      onClose()
    } catch {
      setError('Network error. Please try again.')
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl italic text-stone-900 dark:text-stone-100">Import from CSV</h2>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              {step === 'upload' ? 'Upload a CSV file to bulk-import objects' : `${rows.length} row${rows.length === 1 ? '' : 's'} ready to import`}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-300 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-100 text-lg leading-none transition-colors">×</button>
        </div>

        <div className="px-6 py-5">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg p-8 text-center">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                  Upload a CSV file with columns: <span className="font-mono text-xs">{EXPECTED_COLS.slice(0, 4).join(', ')}</span> and more
                </p>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded">
                  Choose CSV file
                </button>
              </div>
              <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4 text-xs font-mono text-stone-500 dark:text-stone-400 space-y-1">
                <div className="font-medium text-stone-700 dark:text-stone-300 mb-2">Expected columns (header row required):</div>
                <div className="grid grid-cols-3 gap-1">
                  {EXPECTED_COLS.map(c => <div key={c}>{c}</div>)}
                </div>
                <div className="mt-2 text-stone-400 dark:text-stone-500">All columns optional except title or accession_no. Status values: Entry, On Display, Storage, On Loan, Restoration.</div>
              </div>
              {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-stone-50 dark:bg-stone-800">
                    <tr>
                      {['title', 'artist', 'year', 'medium', 'status', 'accession_no'].map(h => (
                        <th key={h} className="text-left font-mono text-stone-400 dark:text-stone-500 px-3 py-2 border-b border-stone-200 dark:border-stone-700 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-3 py-2 text-stone-700 dark:text-stone-300 max-w-[160px] truncate">{row.title || '—'}</td>
                        <td className="px-3 py-2 text-stone-500 dark:text-stone-400">{row.artist || '—'}</td>
                        <td className="px-3 py-2 text-stone-500 dark:text-stone-400">{row.year || '—'}</td>
                        <td className="px-3 py-2 text-stone-500 dark:text-stone-400">{row.medium || '—'}</td>
                        <td className="px-3 py-2 text-stone-500 dark:text-stone-400">{row.status || 'Entry'}</td>
                        <td className="px-3 py-2 font-mono text-stone-400 dark:text-stone-500">{row.accession_no || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <div className="px-3 py-2 text-xs text-stone-400 dark:text-stone-500 font-mono text-center border-t border-stone-100 dark:border-stone-800">
                    + {rows.length - 20} more rows
                  </div>
                )}
              </div>
              {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
          {step === 'preview' ? (
            <>
              <button onClick={() => { setStep('upload'); setRows([]); if (fileRef.current) fileRef.current.value = '' }}
                className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-xs font-mono px-4 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                ← Choose different file
              </button>
              <button onClick={handleImport} disabled={importing}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded disabled:opacity-50 transition-colors">
                {importing ? 'Importing…' : `Import ${rows.length} object${rows.length === 1 ? '' : 's'} →`}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-xs font-mono px-4 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ml-auto">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
