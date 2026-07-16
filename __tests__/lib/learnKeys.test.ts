import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { learnDescriptions } from '@/lib/learn-descriptions'

/**
 * Learn Mode resolves a data-learn="key" attribute against learnDescriptions
 * (see components/LearnTooltipOverlay.tsx). A key with no entry renders nothing
 * at all — no error, no fallback, just a field that silently refuses to explain
 * itself.
 *
 * That has happened twice: three keys in the July 2026 audit (N7), then sixteen
 * more introduced by the remediation that fixed those three, when new fields
 * shipped with tags but without copy. It is invisible unless you hover every
 * field in the app, so it gets a test instead.
 */

const ROOTS = ['app', 'components']
// data-learn="objects.title"
const STATIC_KEY = /data-learn="([^"]+)"/g
// Register stat cards render data-learn={s.learn} from a literal declared in the
// same file: { label: 'Open Risks', learn: 'register.risk.open_risks', … }.
// The attribute is computed, but the key itself is still statically checkable.
const LITERAL_KEY = /\blearn(?:Key)?: '([^']+)'/g

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

const files = ROOTS.flatMap(r => walk(r))

function usedKeys(): { key: string; file: string }[] {
  const found: { key: string; file: string }[] = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(STATIC_KEY)) found.push({ key: m[1], file })
    for (const m of src.matchAll(LITERAL_KEY)) found.push({ key: m[1], file })
  }
  return found
}

describe('Learn Mode keys', () => {
  it('finds data-learn usage to check (guards against the regex silently breaking)', () => {
    expect(usedKeys().length).toBeGreaterThan(50)
  })

  it('has a description for every data-learn key used in the app', () => {
    const dangling = usedKeys()
      .filter(({ key }) => !learnDescriptions[key])
      .map(({ key, file }) => `${key} (${file})`)

    expect(dangling, `Learn Mode keys with no entry in lib/learn-descriptions.ts:\n  ${dangling.join('\n  ')}`).toEqual([])
  })

  it('gives every description a label and a description', () => {
    const incomplete = Object.entries(learnDescriptions)
      .filter(([, v]) => !v.label?.trim() || !v.description?.trim())
      .map(([k]) => k)

    expect(incomplete, `Entries missing label or description: ${incomplete.join(', ')}`).toEqual([])
  })

  it('checks the register stat-card keys, not just the inline attributes', () => {
    // Guards the LITERAL_KEY half of the scan: if the card shape changes and
    // these stop being found, the check above would pass without testing them.
    const cardKeys = usedKeys().filter(({ key }) => key.startsWith('register.'))
    expect(cardKeys.length).toBeGreaterThan(0)
  })
})
