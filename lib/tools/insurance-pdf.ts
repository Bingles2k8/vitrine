// Client-side generation of the insurance inventory outputs (CSV + PDF).
// Everything runs in the browser — nothing is uploaded or stored server-side.
// jsPDF is imported dynamically so it never ships in the main app bundle.

import { VITRINE_CSV_COLUMNS, CURRENCY_SYMBOLS } from './constants'

export type InventoryItem = {
  id: string
  title: string
  category: string
  maker: string
  year: string
  dimensions: string
  condition: string
  acquisitionMethod: string
  purchaseDate: string
  purchasePrice: string
  acquiredFrom: string
  estimatedValue: string
  currency: string
  serial: string
  description: string
  photos: string[] // data URLs
}

export function emptyItem(currency = 'GBP'): InventoryItem {
  return {
    id: Math.random().toString(36).slice(2),
    title: '', category: '', maker: '', year: '', dimensions: '',
    condition: '', acquisitionMethod: '', purchaseDate: '', purchasePrice: '',
    acquiredFrom: '', estimatedValue: '', currency, serial: '', description: '',
    photos: [],
  }
}

export function fmtMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? ''
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// Totals, grouped by currency (a collection may mix currencies).
export function totalsByCurrency(items: InventoryItem[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const it of items) {
    const v = parseFloat(it.estimatedValue || it.purchasePrice || '0')
    if (!isNaN(v) && v > 0) totals[it.currency] = (totals[it.currency] ?? 0) + v
  }
  return totals
}

function csvEscape(value: string): string {
  const v = value ?? ''
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

// CSV with headers that map 1:1 onto Vitrine's importer so it imports cleanly.
export function buildCsv(items: InventoryItem[]): string {
  const header = VITRINE_CSV_COLUMNS.join(',')
  const lines = items.map((it) => {
    const descParts: string[] = []
    if (it.category) descParts.push(`Category: ${it.category}`)
    if (it.serial) descParts.push(`Serial/Ref: ${it.serial}`)
    if (it.estimatedValue) descParts.push(`Estimated value: ${fmtMoney(parseFloat(it.estimatedValue) || 0, it.currency)}`)
    if (it.description) descParts.push(it.description)
    const row: Record<(typeof VITRINE_CSV_COLUMNS)[number], string> = {
      title: it.title,
      artist: it.maker,
      year: it.year,
      medium: '',
      dimensions: it.dimensions,
      condition: it.condition,
      purchase_date: it.purchaseDate,
      purchase_price: it.purchasePrice || it.estimatedValue || '',
      acquired_from: it.acquiredFrom,
      acquisition_method: it.acquisitionMethod,
      description: descParts.join('. '),
    }
    return VITRINE_CSV_COLUMNS.map((c) => csvEscape(row[c])).join(',')
  })
  return [header, ...lines].join('\n')
}

export function downloadCsv(items: InventoryItem[], filename = 'collection-inventory.csv') {
  const blob = new Blob([buildCsv(items)], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function loadImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 1, h: 1 })
    img.src = dataUrl
  })
}

export type InventoryMeta = {
  ownerName: string
  collectionLabel: string // e.g. "Coin collection" or "Collection"
  dateStr: string
}

// Builds and triggers download of the inventory PDF entirely in the browser.
export async function generateInsurancePdf(items: InventoryItem[], meta: InventoryMeta) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin

  // ── Header ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(20, 20, 20)
  doc.text('Collection Insurance Inventory', margin, y + 6)
  y += 26
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(110, 110, 110)
  const sub: string[] = []
  if (meta.ownerName) sub.push(meta.ownerName)
  sub.push(meta.collectionLabel)
  sub.push(`Generated ${meta.dateStr}`)
  doc.text(sub.join('  ·  '), margin, y)
  y += 22

  // ── Summary box ─────────────────────────────────────────
  const totals = totalsByCurrency(items)
  const totalLines = Object.entries(totals).map(([cur, amt]) => `${fmtMoney(amt, cur)}`)
  doc.setDrawColor(225, 225, 225)
  doc.setFillColor(248, 248, 246)
  const boxH = 46
  doc.roundedRect(margin, y, pageW - margin * 2, boxH, 4, 4, 'FD')
  doc.setTextColor(90, 90, 90)
  doc.setFontSize(9)
  doc.text('ITEMS', margin + 16, y + 18)
  doc.text('TOTAL DECLARED VALUE', margin + 120, y + 18)
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(String(items.length), margin + 16, y + 36)
  doc.text(totalLines.length ? totalLines.join('   ') : '—', margin + 120, y + 36)
  doc.setFont('helvetica', 'normal')
  y += boxH + 20

  // ── Schedule of values table ────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'Category', 'Condition', 'Acquired', 'Declared value']],
    body: items.map((it, i) => [
      String(i + 1),
      [it.title || 'Untitled', [it.maker, it.year].filter(Boolean).join(', ')].filter(Boolean).join('\n'),
      it.category || '—',
      it.condition || '—',
      [it.purchaseDate, it.acquiredFrom].filter(Boolean).join('\n') || '—',
      it.estimatedValue ? fmtMoney(parseFloat(it.estimatedValue) || 0, it.currency) : '—',
    ]),
    styles: { fontSize: 9, cellPadding: 5, valign: 'top', textColor: [40, 40, 40] },
    headStyles: { fillColor: [38, 38, 35], textColor: [255, 255, 255], fontSize: 9 },
    alternateRowStyles: { fillColor: [250, 250, 249] },
    columnStyles: {
      0: { cellWidth: 24 },
      5: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })
  // @ts-expect-error lastAutoTable is added by the plugin at runtime
  y = (doc.lastAutoTable?.finalY ?? y) + 28

  // ── Photographs / details ───────────────────────────────
  const withPhotos = items.filter((it) => it.photos.length > 0)
  if (withPhotos.length > 0) {
    if (y > pageH - 120) { doc.addPage(); y = margin }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(20, 20, 20)
    doc.text('Photographs', margin, y)
    y += 18

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.photos.length === 0) continue
      if (y > pageH - 140) { doc.addPage(); y = margin }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text(`${i + 1}. ${it.title || 'Untitled'}`, margin, y)
      y += 10
      const thumbMax = 150
      let x = margin
      let rowH = 0
      for (const photo of it.photos.slice(0, 4)) {
        const { w, h } = await loadImageSize(photo)
        const scale = Math.min(thumbMax / w, thumbMax / h, 1)
        const dw = w * scale
        const dh = h * scale
        if (x + dw > pageW - margin) { x = margin; y += rowH + 8; rowH = 0 }
        if (y + dh > pageH - margin) { doc.addPage(); y = margin; x = margin }
        try {
          doc.addImage(photo, 'JPEG', x, y + 4, dw, dh)
        } catch { /* skip unreadable image */ }
        x += dw + 8
        rowH = Math.max(rowH, dh)
      }
      y += rowH + 18
    }
  }

  // ── Footer on every page ────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      'Generated free with Vitrine — vitrinecms.com/tools  ·  This document was produced from self-reported information.',
      margin,
      pageH - 18,
    )
    doc.text(`${p} / ${pageCount}`, pageW - margin, pageH - 18, { align: 'right' })
  }

  doc.save('collection-insurance-inventory.pdf')
}
