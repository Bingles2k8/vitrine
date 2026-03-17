'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function fuzzyMatch(input: string, list: string[]): string | null {
  const norm = (s: string) => s.toLowerCase().trim()
  const s = norm(input)
  if (!s) return null
  const exact = list.find(x => norm(x) === s)
  if (exact) return exact
  const sw = list.find(x => norm(x).startsWith(s))
  if (sw) return sw
  if (s.length >= 4) {
    let best: string | null = null
    let bestDist = 3
    for (const x of list) {
      const d = levenshtein(s, norm(x))
      if (d < bestDist) { bestDist = d; best = x }
    }
    if (best) return best
  }
  return null
}

interface Props {
  value: string
  onChange: (val: string) => void
  museumId: string
  field: string
  staticList: string[]
  placeholder?: string
  className?: string
}

export default function AutocompleteInput({
  value,
  onChange,
  museumId,
  field,
  staticList,
  placeholder,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const typedRef = useRef<string>(value)
  const suppressRef = useRef(false)
  const [corrected, setCorrected] = useState(false)
  const [collectionValues, setCollectionValues] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('objects')
      .select(field)
      .eq('museum_id', museumId)
      .not(field, 'is', null)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((r: Record<string, unknown>) => r[field]).filter(Boolean))] as string[]
          setCollectionValues(unique)
        }
      })
  }, [museumId, field])

  const allSuggestions = useMemo(
    () => [...new Set([...staticList, ...collectionValues])].sort(),
    [staticList, collectionValues]
  )

  // Sync typedRef when value changes externally
  useEffect(() => {
    typedRef.current = value
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const input = inputRef.current
    if (!input) return

    if (e.key === 'Tab' || e.key === 'ArrowRight') {
      // Accept the ghost text
      if (input.selectionStart !== input.selectionEnd) {
        e.preventDefault()
        const accepted = input.value
        typedRef.current = accepted
        onChange(accepted)
        // Move cursor to end
        requestAnimationFrame(() => {
          input.setSelectionRange(accepted.length, accepted.length)
        })
      }
      return
    }

    if (e.key === 'Escape') {
      // Clear ghost — revert to what user typed
      const typed = typedRef.current
      onChange(typed)
      requestAnimationFrame(() => {
        input.setSelectionRange(typed.length, typed.length)
      })
      return
    }

    if (e.key === 'Backspace') {
      suppressRef.current = true
      // Update typedRef to reflect deletion on next tick
      requestAnimationFrame(() => {
        if (input) typedRef.current = input.value
        suppressRef.current = false
      })
      return
    }

    // For printable keys the browser replaces the selection naturally,
    // so we just need to update typedRef after the change settles.
    if (e.key.length === 1) {
      requestAnimationFrame(() => {
        if (input) typedRef.current = input.value
      })
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (suppressRef.current) {
      typedRef.current = e.target.value
      onChange(e.target.value)
      return
    }

    const typed = e.target.value
    typedRef.current = typed

    const match = allSuggestions.find(s =>
      s.toLowerCase().startsWith(typed.toLowerCase()) && s.toLowerCase() !== typed.toLowerCase()
    )

    if (match && typed.length > 0) {
      onChange(match)
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(typed.length, match.length)
        }
      })
    } else {
      onChange(typed)
    }
  }

  function handleBlur() {
    const current = typedRef.current || value
    const match = fuzzyMatch(current, allSuggestions)
    if (match && match !== value) {
      onChange(match)
      typedRef.current = match
      setCorrected(true)
      setTimeout(() => setCorrected(false), 1200)
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`${className ?? ''} ${corrected ? 'glow-correct' : ''}`}
      autoComplete="off"
      spellCheck={false}
    />
  )
}
