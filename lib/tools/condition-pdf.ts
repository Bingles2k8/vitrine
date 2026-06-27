// Client-side generation of the museum condition report PDF.
// Runs entirely in the browser — nothing uploaded or stored. jsPDF imported
// dynamically so it stays out of the main bundle.

export type DamagePin = {
  id: string
  n: number
  xPct: number // 0..1 position on the base photo
  yPct: number
  location: string
  issue: string
  severity: string
}

export type ConditionReport = {
  institution: string
  reference: string
  // Object / tombstone
  title: string
  accessionNo: string
  maker: string
  objectType: string
  medium: string
  dimensions: string
  dateMade: string
  // Assessment
  grade: string
  assessor: string
  assessedAt: string
  reason: string
  priority: string
  nextCheck: string
  hazard: string
  description: string
  recommendations: string
  // Visuals
  basePhoto: string | null
  pins: DamagePin[]
  extraPhotos: string[]
}

export function emptyReport(): ConditionReport {
  const year = new Date().getFullYear()
  return {
    institution: '', reference: `CC-${year}-001`,
    title: '', accessionNo: '', maker: '', objectType: '', medium: '', dimensions: '', dateMade: '',
    grade: '', assessor: '', assessedAt: new Date().toISOString().slice(0, 10),
    reason: '', priority: '', nextCheck: '', hazard: '', description: '', recommendations: '',
    basePhoto: null, pins: [], extraPhotos: [],
  }
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

// Composite the base photo + numbered damage pins into a single JPEG data URL.
export async function renderAnnotatedImage(basePhoto: string, pins: DamagePin[]): Promise<string> {
  const img = await loadImage(basePhoto)
  const maxW = 1400
  const scale = Math.min(1, maxW / img.naturalWidth)
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return basePhoto
  ctx.drawImage(img, 0, 0, w, h)

  const r = Math.max(12, Math.round(Math.min(w, h) * 0.025))
  ctx.font = `bold ${Math.round(r * 1.2)}px Helvetica, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const pin of pins) {
    const x = pin.xPct * w
    const y = pin.yPct * h
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(220, 38, 38, 0.92)'
    ctx.fill()
    ctx.lineWidth = Math.max(2, r * 0.18)
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(String(pin.n), x, y + 1)
  }
  return canvas.toDataURL('image/jpeg', 0.82)
}

export async function generateConditionPdf(report: ConditionReport) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  const contentW = pageW - margin * 2
  let y = margin

  const dateLabel = report.assessedAt
    ? new Date(report.assessedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  // ── Header ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(40, 40, 40)
  doc.text(report.institution || 'Condition Report', margin, y + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(
    [report.reference, dateLabel].filter(Boolean).join('  ·  '),
    pageW - margin,
    y + 4,
    { align: 'right' },
  )
  y += 18
  doc.setDrawColor(40, 40, 40)
  doc.setLineWidth(1.2)
  doc.line(margin, y, pageW - margin, y)
  y += 18
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(20, 20, 20)
  doc.text('Condition Report', margin, y + 6)
  y += 24

  // ── Object / tombstone ──────────────────────────────────
  const tomb: [string, string][] = [
    ['Object', report.title],
    ['Accession no.', report.accessionNo],
    ['Maker / origin', report.maker],
    ['Type', report.objectType],
    ['Medium / materials', report.medium],
    ['Dimensions', report.dimensions],
    ['Date', report.dateMade],
  ].filter(([, v]) => v) as [string, string][]
  if (tomb.length) {
    autoTable(doc, {
      startY: y,
      body: tomb,
      theme: 'plain',
      styles: { fontSize: 9.5, cellPadding: 3, textColor: [40, 40, 40] },
      columnStyles: { 0: { cellWidth: 130, textColor: [120, 120, 120], fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
    })
    // @ts-expect-error plugin runtime field
    y = (doc.lastAutoTable?.finalY ?? y) + 16
  }

  // ── Assessment ──────────────────────────────────────────
  const assess: [string, string][] = [
    ['Overall condition', report.grade],
    ['Assessed by', report.assessor],
    ['Date assessed', dateLabel],
    ['Reason for check', report.reason],
    ['Priority', report.priority],
    ['Next check due', report.nextCheck],
    ['Hazards', report.hazard],
  ].filter(([, v]) => v) as [string, string][]
  if (assess.length) {
    sectionHeading(doc, 'Assessment', margin, y)
    y += 8
    autoTable(doc, {
      startY: y,
      body: assess,
      theme: 'plain',
      styles: { fontSize: 9.5, cellPadding: 3, textColor: [40, 40, 40] },
      columnStyles: { 0: { cellWidth: 130, textColor: [120, 120, 120], fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
    })
    // @ts-expect-error plugin runtime field
    y = (doc.lastAutoTable?.finalY ?? y) + 14
  }

  y = paragraph(doc, 'Description', report.description, margin, y, contentW, pageH)
  y = paragraph(doc, 'Recommendations', report.recommendations, margin, y, contentW, pageH)

  // ── Damage map ──────────────────────────────────────────
  if (report.basePhoto) {
    const annotated = await renderAnnotatedImage(report.basePhoto, report.pins)
    const img = await loadImage(annotated)
    const dispW = Math.min(contentW, 360)
    const dispH = (img.naturalHeight / img.naturalWidth) * dispW
    if (y + dispH + 30 > pageH - margin) { doc.addPage(); y = margin }
    sectionHeading(doc, 'Condition / damage map', margin, y)
    y += 12
    try { doc.addImage(annotated, 'JPEG', margin, y, dispW, dispH) } catch { /* skip */ }
    y += dispH + 14

    if (report.pins.length) {
      autoTable(doc, {
        startY: y,
        head: [['#', 'Location', 'Issue', 'Severity']],
        body: report.pins.map((p) => [String(p.n), p.location || '—', p.issue || '—', p.severity || '—']),
        styles: { fontSize: 9, cellPadding: 4, valign: 'top', textColor: [40, 40, 40] },
        headStyles: { fillColor: [38, 38, 35], textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 24 } },
        margin: { left: margin, right: margin },
      })
      // @ts-expect-error plugin runtime field
      y = (doc.lastAutoTable?.finalY ?? y) + 16
    }
  }

  // ── Additional photos ───────────────────────────────────
  if (report.extraPhotos.length) {
    if (y > pageH - 140) { doc.addPage(); y = margin }
    sectionHeading(doc, 'Photographs', margin, y)
    y += 14
    let x = margin
    let rowH = 0
    for (const photo of report.extraPhotos) {
      const im = await loadImage(photo)
      const max = 160
      const sc = Math.min(max / im.naturalWidth, max / im.naturalHeight, 1)
      const dw = im.naturalWidth * sc
      const dh = im.naturalHeight * sc
      if (x + dw > pageW - margin) { x = margin; y += rowH + 8; rowH = 0 }
      if (y + dh > pageH - margin) { doc.addPage(); y = margin; x = margin }
      try { doc.addImage(photo, 'JPEG', x, y, dw, dh) } catch { /* skip */ }
      x += dw + 8
      rowH = Math.max(rowH, dh)
    }
    y += rowH + 16
  }

  // ── Signature line ──────────────────────────────────────
  if (y > pageH - 80) { doc.addPage(); y = margin }
  y += 10
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.6)
  doc.line(margin, y + 24, margin + 200, y + 24)
  doc.line(pageW - margin - 160, y + 24, pageW - margin, y + 24)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Signed', margin, y + 36)
  doc.text('Date', pageW - margin - 160, y + 36)

  // ── Footer on every page ────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Generated free with Vitrine — vitrinecms.com/tools', margin, pageH - 18)
    doc.text(`${p} / ${pageCount}`, pageW - margin, pageH - 18, { align: 'right' })
  }

  doc.save(`condition-report-${(report.reference || 'object').replace(/[^\w-]+/g, '_')}.pdf`)
}

function sectionHeading(doc: import('jspdf').jsPDF, label: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(20, 20, 20)
  doc.text(label, x, y + 6)
}

function paragraph(
  doc: import('jspdf').jsPDF,
  label: string,
  text: string,
  margin: number,
  y: number,
  contentW: number,
  pageH: number,
): number {
  if (!text || !text.trim()) return y
  if (y > pageH - 80) { doc.addPage(); y = margin }
  sectionHeading(doc, label, margin, y)
  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(50, 50, 50)
  const lines = doc.splitTextToSize(text.trim(), contentW)
  for (const line of lines) {
    if (y > pageH - margin) { doc.addPage(); y = margin }
    doc.text(line, margin, y)
    y += 13
  }
  return y + 8
}
