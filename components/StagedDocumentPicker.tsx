'use client'

import { useRef } from 'react'

const DOC_TYPES: Record<string, string[]> = {
  loan:                   ['Loan Agreement', 'Insurance Certificate', 'Facility Report', 'Condition Report', 'Courier Instructions', 'Other'],
  conservation_treatment: ['Treatment Report', 'Condition Survey', 'Materials Safety Sheet', 'Specification', 'Other'],
  condition_assessment:   ['Condition Report', 'Hazard Assessment', 'Photography Record', 'Other'],
  entry_record:           ['Entry Form', 'Depositor Agreement', 'Receipt', 'Correspondence', 'Other'],
}

const ACCEPTED = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.csv'
const MAX_BYTES = 20 * 1024 * 1024

export interface StagedDoc {
  id: string
  file: File
  label: string
  docType: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface Props {
  relatedToType: string
  value: StagedDoc[]
  onChange: (docs: StagedDoc[]) => void
}

export default function StagedDocumentPicker({ relatedToType, value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typeOptions = DOC_TYPES[relatedToType] ?? ['Other']

  function addFile(file: File) {
    if (file.size > MAX_BYTES) return
    onChange([...value, {
      id: crypto.randomUUID(),
      file,
      label: file.name.replace(/\.[^.]+$/, ''),
      docType: '',
    }])
  }

  function updateDoc(id: string, patch: Partial<Pick<StagedDoc, 'label' | 'docType'>>) {
    onChange(value.map(d => d.id === id ? { ...d, ...patch } : d))
  }

  return (
    <div className="space-y-2">
      {value.map(doc => (
        <div key={doc.id} className="border border-stone-200 dark:border-stone-700 rounded p-3 space-y-2 bg-stone-50 dark:bg-stone-800/50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-stone-400 dark:text-stone-500 mb-1">Label *</label>
              <input
                value={doc.label}
                onChange={e => updateDoc(doc.id, { label: e.target.value })}
                placeholder="e.g. Loan Agreement 2024"
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-400 dark:text-stone-500 mb-1">Type</label>
              <select
                value={doc.docType}
                onChange={e => updateDoc(doc.id, { docType: e.target.value })}
                className="w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              >
                <option value="">— Optional —</option>
                {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate">
              📎 {doc.file.name} <span className="text-stone-300 dark:text-stone-600">({formatSize(doc.file.size)})</span>
            </span>
            <button
              type="button"
              onClick={() => onChange(value.filter(d => d.id !== doc.id))}
              className="text-xs font-mono text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0 ml-2"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) addFile(f)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-600 hover:border-stone-900 dark:hover:border-stone-300 rounded px-2 py-0.5 transition-colors"
      >
        + Attach file
      </button>
    </div>
  )
}
