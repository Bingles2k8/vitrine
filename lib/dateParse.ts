// Tolerant year extractor for timeline view. Accepts free-text like
// "c.1850", "1920s", "2024-03-15", "circa 1600", and returns the first
// 4-digit year found, or null.

export function extractYear(input: string | null | undefined): number | null {
  if (!input) return null
  const match = String(input).match(/(\d{4})/)
  if (!match) return null
  const year = parseInt(match[1], 10)
  if (!Number.isFinite(year)) return null
  if (year < 0 || year > 3000) return null
  return year
}
