// Compose a human-readable dimensions string from the structured
// dimension_* columns, falling back to the legacy free-text `dimensions`
// column for objects catalogued before the structured fields existed.
// Shared by the public object page, the printable object record, and the
// CSV export so all three agree (the print/export paths previously read
// only the legacy column, which the current editor never writes).
export function formatDimensions(object: {
  dimension_height?: number | string | null
  dimension_width?: number | string | null
  dimension_depth?: number | string | null
  dimension_unit?: string | null
  dimension_weight?: number | string | null
  dimension_weight_unit?: string | null
  dimension_notes?: string | null
  dimensions?: string | null
}): string | null {
  const dims: string[] = []
  if (object.dimension_height) dims.push(`H ${object.dimension_height}`)
  if (object.dimension_width) dims.push(`W ${object.dimension_width}`)
  if (object.dimension_depth) dims.push(`D ${object.dimension_depth}`)
  const parts: string[] = []
  if (dims.length > 0) {
    parts.push(dims.join(' × ') + (object.dimension_unit ? ` ${object.dimension_unit}` : ''))
  }
  if (object.dimension_weight) {
    parts.push(`${object.dimension_weight}${object.dimension_weight_unit ? ` ${object.dimension_weight_unit}` : ''}`)
  }
  if (object.dimension_notes) parts.push(object.dimension_notes)
  return parts.length > 0 ? parts.join(' · ') : (object.dimensions || null)
}
