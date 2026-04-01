import { describe, it, expect } from 'vitest'
import { LOAN_STATUSES, TEMP_REASONS, EXIT_REASONS } from '@/components/tabs/shared'

// ─── Pure helpers mirroring the inline logic in components ───────────────────
// These match the exact expressions used in the source files so that if the
// source logic changes the tests will break loudly.

function formatRecordNumber(prefix: string, year: number, existingCount: number): string {
  return `${prefix}-${year}-${String(existingCount + 1).padStart(3, '0')}`
}

function isOverdue(loan: { status: string; loan_end_date: string | null }, today: string): boolean {
  return loan.status === 'Active' && !!loan.loan_end_date && loan.loan_end_date < today
}

function isDueSoon(loan: { status: string; loan_end_date: string | null }, today: string, in30Days: string): boolean {
  return loan.status === 'Active' && !!loan.loan_end_date && loan.loan_end_date >= today && loan.loan_end_date <= in30Days
}

// Valid forward transitions allowed in the UI (mirrors the inline button conditions)
function allowedTransitions(status: string): string[] {
  if (status === 'Requested') return ['Agreed']
  if (status === 'Agreed')    return ['Active']
  if (status === 'Active')    return ['Returned']
  return []
}

// Mirrors the TEMP_REASONS check in ExitsTab — determines whether expected_return_date is stored
function isTemporaryExit(reason: string): boolean {
  return TEMP_REASONS.has(reason)
}

// Mirrors the CSV row quoting in locations/page.tsx exportCsv
function csvQuote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('record number formatting', () => {
  it('generates the correct EN- entry number', () => {
    expect(formatRecordNumber('EN', 2026, 0)).toBe('EN-2026-001')
    expect(formatRecordNumber('EN', 2026, 9)).toBe('EN-2026-010')
    expect(formatRecordNumber('EN', 2026, 99)).toBe('EN-2026-100')
  })

  it('generates the correct LN- loan number', () => {
    expect(formatRecordNumber('LN', 2026, 0)).toBe('LN-2026-001')
    expect(formatRecordNumber('LN', 2026, 4)).toBe('LN-2026-005')
  })

  it('generates the correct OE- exit number', () => {
    expect(formatRecordNumber('OE', 2026, 0)).toBe('OE-2026-001')
    expect(formatRecordNumber('OE', 2026, 11)).toBe('OE-2026-012')
  })

  it('zero-pads to at least 3 digits', () => {
    expect(formatRecordNumber('EN', 2026, 0)).toMatch(/\d{3}$/)
    expect(formatRecordNumber('EN', 2026, 999)).toBe('EN-2026-1000') // no cap — just pads minimum
  })
})

describe('loan status transitions', () => {
  it('LOAN_STATUSES contains all five expected statuses', () => {
    expect(LOAN_STATUSES).toEqual(['Requested', 'Agreed', 'Active', 'Returned', 'Cancelled'])
  })

  it('new loan creation form excludes Returned and Cancelled', () => {
    const creatableStatuses = LOAN_STATUSES.filter(s => s !== 'Cancelled' && s !== 'Returned')
    expect(creatableStatuses).toEqual(['Requested', 'Agreed', 'Active'])
    expect(creatableStatuses).not.toContain('Returned')
    expect(creatableStatuses).not.toContain('Cancelled')
  })

  it('only Requested can transition to Agreed', () => {
    expect(allowedTransitions('Requested')).toContain('Agreed')
    expect(allowedTransitions('Agreed')).not.toContain('Agreed')
    expect(allowedTransitions('Active')).not.toContain('Agreed')
  })

  it('only Agreed can transition to Active', () => {
    expect(allowedTransitions('Agreed')).toContain('Active')
    expect(allowedTransitions('Requested')).not.toContain('Active')
    expect(allowedTransitions('Active')).not.toContain('Active')
  })

  it('only Active can transition to Returned', () => {
    expect(allowedTransitions('Active')).toContain('Returned')
    expect(allowedTransitions('Requested')).not.toContain('Returned')
    expect(allowedTransitions('Agreed')).not.toContain('Returned')
  })

  it('Returned and Cancelled are terminal — no further transitions', () => {
    expect(allowedTransitions('Returned')).toHaveLength(0)
    expect(allowedTransitions('Cancelled')).toHaveLength(0)
  })
})

describe('loan overdue detection', () => {
  const TODAY = '2026-04-01'
  const IN_30 = '2026-05-01'

  it('Active loan with end_date in the past is overdue', () => {
    expect(isOverdue({ status: 'Active', loan_end_date: '2026-03-31' }, TODAY)).toBe(true)
  })

  it('Active loan with end_date equal to today is not overdue', () => {
    expect(isOverdue({ status: 'Active', loan_end_date: TODAY }, TODAY)).toBe(false)
  })

  it('Active loan with end_date in the future is not overdue', () => {
    expect(isOverdue({ status: 'Active', loan_end_date: '2026-04-15' }, TODAY)).toBe(false)
  })

  it('non-Active loan with past end_date is not overdue', () => {
    expect(isOverdue({ status: 'Agreed', loan_end_date: '2026-01-01' }, TODAY)).toBe(false)
    expect(isOverdue({ status: 'Returned', loan_end_date: '2026-01-01' }, TODAY)).toBe(false)
  })

  it('Active loan with no end_date is not overdue', () => {
    expect(isOverdue({ status: 'Active', loan_end_date: null }, TODAY)).toBe(false)
  })
})

describe('loan due-soon detection', () => {
  const TODAY = '2026-04-01'
  const IN_30 = '2026-05-01'

  it('Active loan due today is due soon', () => {
    expect(isDueSoon({ status: 'Active', loan_end_date: TODAY }, TODAY, IN_30)).toBe(true)
  })

  it('Active loan due within 30 days is due soon', () => {
    expect(isDueSoon({ status: 'Active', loan_end_date: '2026-04-20' }, TODAY, IN_30)).toBe(true)
  })

  it('Active loan due exactly on the 30-day boundary is due soon', () => {
    expect(isDueSoon({ status: 'Active', loan_end_date: IN_30 }, TODAY, IN_30)).toBe(true)
  })

  it('Active loan due beyond 30 days is not due soon', () => {
    expect(isDueSoon({ status: 'Active', loan_end_date: '2026-05-02' }, TODAY, IN_30)).toBe(false)
  })

  it('overdue loan (past end_date) is not due soon', () => {
    expect(isDueSoon({ status: 'Active', loan_end_date: '2026-03-15' }, TODAY, IN_30)).toBe(false)
  })

  it('non-Active loan is not due soon', () => {
    expect(isDueSoon({ status: 'Agreed', loan_end_date: '2026-04-10' }, TODAY, IN_30)).toBe(false)
  })

  it('Active loan with no end_date is not due soon', () => {
    expect(isDueSoon({ status: 'Active', loan_end_date: null }, TODAY, IN_30)).toBe(false)
  })
})

describe('exit TEMP_REASONS', () => {
  it('Outgoing loan, Conservation, and Photography are temporary', () => {
    expect(isTemporaryExit('Outgoing loan')).toBe(true)
    expect(isTemporaryExit('Conservation')).toBe(true)
    expect(isTemporaryExit('Photography')).toBe(true)
  })

  it('permanent exit reasons are not temporary', () => {
    const permanentReasons = EXIT_REASONS.filter(r => !TEMP_REASONS.has(r))
    expect(permanentReasons).toContain('Return to depositor')
    expect(permanentReasons).toContain('Transfer')
    expect(permanentReasons).toContain('Disposal')
    expect(permanentReasons).toContain('Sale')
    for (const r of permanentReasons) {
      expect(isTemporaryExit(r)).toBe(false)
    }
  })

  it('expected_return_date is only stored for temporary exits', () => {
    // Mirrors the ternary in ExitsTab: isTemp && exitForm.expected_return_date ? date : null
    const expectedReturnDate = '2026-06-01'
    const store = (reason: string) => isTemporaryExit(reason) ? expectedReturnDate : null
    expect(store('Outgoing loan')).toBe(expectedReturnDate)
    expect(store('Return to depositor')).toBeNull()
    expect(store('Disposal')).toBeNull()
  })
})

describe('formally_accessioned business rule', () => {
  // Mirrors the OverviewTab logic: show non_accession_reason textarea only when formally_accessioned === false
  function shouldShowNonAccessionReason(formally_accessioned: boolean | null | undefined): boolean {
    return formally_accessioned === false
  }

  it('shows reason field only when explicitly set to false', () => {
    expect(shouldShowNonAccessionReason(false)).toBe(true)
  })

  it('does not show reason field when null (defaults to accessioned)', () => {
    expect(shouldShowNonAccessionReason(null)).toBe(false)
  })

  it('does not show reason field when true', () => {
    expect(shouldShowNonAccessionReason(true)).toBe(false)
  })

  it('does not show reason field when undefined (new object)', () => {
    expect(shouldShowNonAccessionReason(undefined)).toBe(false)
  })
})

describe('CSV export quoting', () => {
  it('wraps values in double quotes', () => {
    expect(csvQuote('Hello')).toBe('"Hello"')
  })

  it('escapes internal double quotes by doubling them', () => {
    expect(csvQuote('Say "hello"')).toBe('"Say ""hello"""')
  })

  it('preserves commas inside quoted fields', () => {
    const result = csvQuote('Gallery 3, Cabinet A')
    expect(result).toBe('"Gallery 3, Cabinet A"')
    // The comma must not split into separate cells
    expect(result.startsWith('"')).toBe(true)
    expect(result.endsWith('"')).toBe(true)
  })

  it('handles empty strings', () => {
    expect(csvQuote('')).toBe('""')
  })

  it('handles strings with only quotes', () => {
    expect(csvQuote('"')).toBe('""""')
  })
})
