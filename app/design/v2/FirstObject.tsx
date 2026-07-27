'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const KINDS = ['📷', '💿', '📻', '⌚', '🪖', '🏺', '🖼️', '🪙', '📗', '🦴']
const CONDITIONS = ['Mint', 'Excellent', 'Good', 'Fair', 'Restoration project']

/**
 * The hero of v2: visitors catalogue one object before they are asked for
 * anything. The draft is kept locally and handed to signup, so the work
 * already done is the reason to finish the account.
 */
export default function FirstObject() {
  const [kind, setKind] = useState('📷')
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [paid, setPaid] = useState('')
  const [condition, setCondition] = useState('Excellent')
  const [saved, setSaved] = useState(false)

  const filled = useMemo(
    () => [name, year, paid].filter(Boolean).length + 2,
    [name, year, paid]
  )

  function save() {
    try {
      localStorage.setItem(
        'vitrine.draft-object',
        JSON.stringify({ kind, name, year, paid, condition, at: Date.now() })
      )
    } catch {
      /* private browsing — the draft just does not persist */
    }
    setSaved(true)
  }

  const displayName = name.trim() || 'Untitled object'

  return (
    <div className="grid gap-px overflow-hidden border border-[#14150f]/20 bg-[#14150f]/20 lg:grid-cols-2">
      {/* Entry side */}
      <div className="bg-[#f7f5f0] p-7 sm:p-9">
        <div className="mb-7 flex items-baseline justify-between">
          <h2 className="type-mono text-[11px] uppercase tracking-[0.18em] text-[#14150f]">
            New object
          </h2>
          <span className="type-mono text-[11px] text-[#8a8377]">{filled}/5 fields</span>
        </div>

        <label className="type-mono mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#8a8377]">
          What is it?
        </label>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {KINDS.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-label={`Object type ${k}`}
              aria-pressed={kind === k}
              className={`h-10 w-10 border text-lg transition-colors ${
                kind === k
                  ? 'border-[#14150f] bg-[#14150f]/[0.06]'
                  : 'border-[#14150f]/15 hover:border-[#14150f]/40'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <Field label="Name it" value={name} onChange={setName} placeholder="Leica M3, chrome" />

        <div className="grid grid-cols-2 gap-5">
          <Field label="Year made" value={year} onChange={setYear} placeholder="1954" />
          <Field label="What you paid" value={paid} onChange={setPaid} placeholder="£620" />
        </div>

        <label className="type-mono mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#8a8377]">
          Condition
        </label>
        <div className="mb-8 flex flex-wrap gap-1.5">
          {CONDITIONS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCondition(c)}
              aria-pressed={condition === c}
              className={`type-mono border px-3 py-1.5 text-[11px] transition-colors ${
                condition === c
                  ? 'border-[#14150f] bg-[#14150f] text-[#f7f5f0]'
                  : 'border-[#14150f]/15 text-[#4c483e] hover:border-[#14150f]/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {saved ? (
          <div className="border border-[#14150f] bg-[#14150f] p-5 text-[#f7f5f0]">
            <p className="type-mono mb-2 text-[10px] uppercase tracking-[0.18em] text-[#b8b2a4]">
              Object 1 of 100 · kept on this device
            </p>
            <p className="mb-5 text-[15px] leading-relaxed">
              That is a real catalogue record. Make an account and it moves into your collection —
              with the other ninety-nine free slots, and a public page if you want one.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="type-mono bg-[#f7f5f0] px-6 py-3 text-[11px] uppercase tracking-[0.16em] text-[#14150f] hover:bg-white"
              >
                Keep it — free account
              </Link>
              <button
                type="button"
                onClick={() => setSaved(false)}
                className="type-mono text-[11px] uppercase tracking-[0.14em] text-[#b8b2a4] underline underline-offset-4 hover:text-white"
              >
                Edit it
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={save}
              className="type-mono w-full bg-[#14150f] px-6 py-4 text-[12px] uppercase tracking-[0.16em] text-[#f7f5f0] transition-opacity hover:opacity-90"
            >
              Save this object
            </button>
            <p className="type-mono mt-3 text-[11px] text-[#8a8377]">
              No account needed to try it. Nothing is sent anywhere yet.
            </p>
          </>
        )}
      </div>

      {/* Live record side */}
      <div className="bg-[#14150f] p-7 text-[#e9e6dd] sm:p-9">
        <div className="mb-7 flex items-baseline justify-between">
          <span className="type-mono text-[11px] uppercase tracking-[0.18em] text-[#8a8377]">
            Your record, live
          </span>
          <span className="type-mono text-[11px] text-[#8a8377]">vitrine.app</span>
        </div>

        <div className="mb-8 flex items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-white/15 text-3xl">
            {kind}
          </div>
          <div className="min-w-0">
            <h3 className="type-book text-2xl leading-tight">{displayName}</h3>
            <p className="type-mono mt-1.5 text-[11px] text-[#8a8377]">
              {year ? `Made ${year}` : 'Year unrecorded'} · {condition}
            </p>
          </div>
        </div>

        <dl className="space-y-0 border-t border-white/10">
          {[
            ['Object no.', '0001'],
            ['Condition', condition],
            ['Year', year || '—'],
            ['Paid', paid || '—'],
            ['Added', new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
            ['Visibility', 'Private until you say otherwise'],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-4 border-b border-white/10 py-3">
              <dt className="type-mono text-[10px] uppercase tracking-[0.12em] text-[#8a8377]">{k}</dt>
              <dd className="col-span-2 text-[14px] text-[#e9e6dd]">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="type-mono mt-7 text-[11px] leading-relaxed text-[#8a8377]">
          On a real account this record also carries photographs, provenance, valuation history,
          documents and where the thing physically lives — and can be published to your collection
          site with one switch.
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="mb-6">
      <label className="type-mono mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#8a8377]">
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-[#14150f]/25 bg-transparent pb-2 text-[17px] text-[#14150f] outline-none placeholder:text-[#b5ae9e] focus:border-[#14150f]"
      />
    </div>
  )
}
