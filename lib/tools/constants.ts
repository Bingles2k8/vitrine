// Self-contained constants for the public /tools pages.
// Deliberately NOT imported from components/tabs/shared.ts so the public tool
// bundle stays free of dashboard/supabase code. Keep values in sync with shared.ts.

export const CONDITION_GRADES = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'] as const
export const DAMAGE_SEVERITIES = ['Minor', 'Moderate', 'Significant', 'Severe', 'Total Loss'] as const
export const CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY'] as const
export const ACQ_METHODS = ['Purchase', 'Gift', 'Bequest', 'Transfer', 'Found', 'Exchange', 'Inherited', 'Unknown'] as const

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', CHF: 'CHF ', AUD: 'A$', CAD: 'C$', JPY: '¥',
}

export const CONDITION_REASONS = [
  'Acquisition', 'Loan out', 'Loan return', 'Display change',
  'Routine', 'Damage suspected', 'Conservation', 'Insurance', 'Other',
] as const

export const CONDITION_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const

// Column order for the exported CSV. These header names map 1:1 onto Vitrine's
// CSV importer (lib/validations.ts → csvImportRowSchema), so the file imports cleanly.
export const VITRINE_CSV_COLUMNS = [
  'title',
  'artist',
  'year',
  'medium',
  'dimensions',
  'condition',
  'purchase_date',
  'purchase_price',
  'acquired_from',
  'acquisition_method',
  'description',
] as const
