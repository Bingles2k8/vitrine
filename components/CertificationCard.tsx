'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { inputCls, labelCls, sectionTitle } from '@/components/tabs/shared'
import {
  gradesForAuthority, buildVerifyUrl, findAuthority, deriveCertificationFields,
} from '@/lib/collectionProfiles'
import type { CertificationConfig } from '@/lib/collectionProfiles'

/** Only the fields this card reads. The parent form holds far more. */
interface CertificationForm {
  cert_authority?: string | null
  cert_number?: string | null
  cert_grade?: string | null
  cert_date?: string | null
  cert_subgrades?: Record<string, number> | null
  cert_notes?: string | null
}

type CertFieldValue = string | number | Record<string, number> | null

interface Props {
  config: CertificationConfig
  form: CertificationForm
  set: (field: string, value: CertFieldValue) => void
  canEdit: boolean
  museumId: string
  objectId: string
}

interface DuplicateHit {
  id: string
  title: string
  emoji: string | null
}

/**
 * Tier A — certification & grading.
 * See docs/collection-profiles-plan.md §5.5.
 *
 * Writes cert_authority / cert_number / cert_grade / cert_date / cert_subgrades
 * and derives cert_grade_numeric, cert_grade_scale and (when the profile opts
 * in) condition_grade. The derivation lives in lib/collectionProfiles so the
 * CSV importer and the API use the same implementation.
 */
export default function CertificationCard({
  config, form, set, canEdit, museumId, objectId,
}: Props) {
  const [duplicate, setDuplicate] = useState<DuplicateHit | null>(null)
  const [checking, setChecking] = useState(false)
  const lastChecked = useRef<string>('')

  const authorityId: string | null = form.cert_authority || null
  const authority = findAuthority(config, authorityId)
  const grades = gradesForAuthority(config, authorityId)
  const verifyUrl = buildVerifyUrl(config, authorityId, form.cert_number)

  const labels = {
    authority: config.labels?.authority ?? 'Grading Company',
    number: config.labels?.number ?? 'Cert Number',
    grade: config.labels?.grade ?? 'Grade',
    date: config.labels?.date ?? 'Graded',
  }

  /** Applies an authority/grade change and everything derived from it. */
  function applyCertification(nextAuthority: string | null, nextGrade: string | null) {
    set('cert_authority', nextAuthority)
    set('cert_grade', nextGrade)

    const derived = deriveCertificationFields(config, nextAuthority, nextGrade)
    set('cert_grade_numeric', derived.cert_grade_numeric)
    set('cert_grade_scale', derived.cert_grade_scale)
    if (derived.condition_grade) set('condition_grade', derived.condition_grade)
  }

  function onAuthorityChange(next: string) {
    const value = next || null
    // Changing authority invalidates the grade — a PSA 9 is not a PCGS grade.
    const currentGrade = form.cert_grade ?? null
    const keepGrade = currentGrade && gradesForAuthority(config, value).includes(currentGrade)
      ? currentGrade
      : null
    applyCertification(value, keepGrade)

    if (!value) {
      set('cert_number', null)
      set('cert_date', null)
      set('cert_subgrades', null)
      setDuplicate(null)
    }
  }

  // A cert number is a globally unique identifier, so it catches the most
  // common real-world error in graded collecting: logging the same slab twice
  // from two different photos. Far stronger than a fuzzy title match.
  useEffect(() => {
    const number = (form.cert_number ?? '').trim()
    const key = `${authorityId ?? ''}::${number}`
    if (key === lastChecked.current) return

    // Clearing happens inside the timer alongside every other state update, so
    // the effect body never sets state synchronously.
    const timer = setTimeout(async () => {
      lastChecked.current = key
      if (!number || !authorityId) { setDuplicate(null); return }
      setChecking(true)
      try {
        const params = new URLSearchParams({
          museum_id: museumId,
          cert_authority: authorityId,
          cert_number: number,
          exclude: objectId,
        })
        const res = await fetch(`/api/objects/cert-lookup?${params}`)
        const body = await res.json().catch(() => ({}))
        setDuplicate(res.ok && body.match ? body.match : null)
      } catch {
        setDuplicate(null)
      } finally {
        setChecking(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [form.cert_number, authorityId, museumId, objectId])

  const subgrades: Record<string, number> = form.cert_subgrades ?? {}

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
      <div className={sectionTitle}>{config.title}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} data-learn="objects.cert_authority">{labels.authority}</label>
          <select
            value={authorityId ?? ''}
            onChange={e => onAuthorityChange(e.target.value)}
            disabled={!canEdit}
            className={inputCls}
          >
            <option value="">{'—'} Not recorded {'—'}</option>
            {config.authorities.map(a => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} data-learn="objects.cert_grade">{labels.grade}</label>
          <select
            value={form.cert_grade ?? ''}
            onChange={e => applyCertification(authorityId, e.target.value || null)}
            disabled={!canEdit || grades.length === 0}
            className={inputCls}
          >
            <option value="">
              {grades.length === 0 ? '— Not applicable —' : '— Select —'}
            </option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} data-learn="objects.cert_number">{labels.number}</label>
          <input
            value={form.cert_number ?? ''}
            onChange={e => set('cert_number', e.target.value || null)}
            disabled={!canEdit || !authorityId}
            placeholder={authorityId ? 'As printed on the label' : 'Choose a company first'}
            className={`${inputCls} font-mono`}
          />
          {verifyUrl && (
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-mono text-amber-600 dark:text-amber-500 hover:underline mt-1.5"
            >
              Verify this certificate {'→'}
            </a>
          )}
        </div>

        <div>
          <label className={labelCls}>{labels.date}</label>
          <input
            type="date"
            value={form.cert_date ?? ''}
            onChange={e => set('cert_date', e.target.value || null)}
            disabled={!canEdit || !authorityId}
            className={inputCls}
          />
        </div>
      </div>

      {checking && (
        <p className="text-xs font-mono text-stone-400 dark:text-stone-500">Checking your collection{'…'}</p>
      )}

      {duplicate && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded px-4 py-3 flex items-start gap-3">
          <span className="text-base shrink-0">{'⚠'}</span>
          <div className="text-sm text-amber-800 dark:text-amber-300">
            You already have an item with {authority?.label ?? authorityId} certificate{' '}
            <span className="font-mono">{form.cert_number}</span> —{' '}
            <Link href={`/dashboard/objects/${duplicate.id}`} className="underline hover:no-underline">
              {duplicate.emoji ? `${duplicate.emoji} ` : ''}{duplicate.title}
            </Link>
            . Certificate numbers are unique, so this is very likely the same item entered twice.
          </div>
        </div>
      )}

      {authority?.subgrades && authority.subgrades.length > 0 && (
        <div>
          <label className={labelCls}>Subgrades</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {authority.subgrades.map(name => (
              <div key={name}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={subgrades[name] ?? ''}
                  placeholder={name}
                  onChange={e => {
                    const next = { ...subgrades }
                    if (e.target.value === '') delete next[name]
                    else next[name] = Number(e.target.value)
                    set('cert_subgrades', Object.keys(next).length > 0 ? next : null)
                  }}
                  disabled={!canEdit}
                  className={inputCls}
                />
                <span className="text-xs text-stone-400 dark:text-stone-500 mt-1 block">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Notes</label>
        <input
          value={form.cert_notes ?? ''}
          onChange={e => set('cert_notes', e.target.value || null)}
          disabled={!canEdit}
          placeholder="Anything else worth recording about the certificate"
          className={inputCls}
        />
      </div>
    </div>
  )
}
