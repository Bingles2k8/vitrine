'use client'

import { useState } from 'react'

// ── Steps ─────────────────────────────────────────────────────────────────────

export function Steps({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-sm font-mono text-stone-200">{title}</span>
        <span className={`text-stone-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="border-t border-white/8 px-5 py-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

export function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-mono flex items-center justify-center">
        {number}
      </div>
      <div className="text-sm text-stone-300 leading-relaxed pt-0.5">{children}</div>
    </div>
  )
}

// ── Callout ───────────────────────────────────────────────────────────────────

const CALLOUT_STYLES = {
  tip: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', icon: '💡', label: 'Tip', text: 'text-emerald-300' },
  warning: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', icon: '⚠️', label: 'Note', text: 'text-amber-300' },
  info: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', icon: 'ℹ️', label: 'Info', text: 'text-blue-300' },
}

export function Callout({ type = 'info', children }: { type?: 'tip' | 'warning' | 'info'; children: React.ReactNode }) {
  const s = CALLOUT_STYLES[type]
  return (
    <div className={`border ${s.border} ${s.bg} rounded-lg px-4 py-3 flex gap-3 my-4`}>
      <span className="flex-shrink-0 text-sm">{s.icon}</span>
      <div className={`text-sm ${s.text} leading-relaxed`}>{children}</div>
    </div>
  )
}

// ── FeatureNote ───────────────────────────────────────────────────────────────

export function FeatureNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-amber-500/15 bg-amber-500/5 rounded-lg px-4 py-2.5 flex items-center gap-2.5 my-4">
      <span className="text-amber-400 text-xs font-mono flex-shrink-0">★</span>
      <span className="text-xs text-amber-300/80">{children}</span>
    </div>
  )
}

// ── FeatureGrid ───────────────────────────────────────────────────────────────

export function FeatureGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
      {children}
    </div>
  )
}

export function FeatureCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-900/60 border border-white/8 rounded-xl p-4">
      <div className="text-xl mb-2">{icon}</div>
      <div className="text-sm font-mono text-stone-200 mb-1">{title}</div>
      <div className="text-xs text-stone-500 leading-relaxed">{children}</div>
    </div>
  )
}
