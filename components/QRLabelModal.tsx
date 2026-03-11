'use client'

import QRCode from 'react-qr-code'

interface QRLabelModalProps {
  object: { id: string; title: string; accession_no?: string; show_on_site?: boolean }
  museum: { slug: string; name: string }
  onClose: () => void
}

export default function QRLabelModal({ object, museum, onClose }: QRLabelModalProps) {
  const url = `${window.location.origin}/museum/${museum.slug}/object/${object.id}`

  function downloadQR() {
    const svg = document.getElementById('qr-label-svg')
    if (!svg) return
    const canvas = document.createElement('canvas')
    const size = 400
    canvas.width = size
    canvas.height = size + 80
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const svgString = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size)
      ctx.fillStyle = '#1a1a1a'
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(object.title.length > 40 ? object.title.slice(0, 40) + '…' : object.title, size / 2, size + 24)
      if (object.accession_no) {
        ctx.font = '12px monospace'
        ctx.fillStyle = '#666'
        ctx.fillText(object.accession_no, size / 2, size + 48)
      }
      const link = document.createElement('a')
      link.download = `qr-${object.accession_no || object.id}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h2 className="font-serif text-xl italic text-stone-900 dark:text-stone-100">QR Label</h2>
          <button onClick={onClose} className="text-stone-300 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-lg leading-none">×</button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          {!object.show_on_site && (
            <div className="w-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              This object is not published — the QR code will show a 404 until it is published on your site.
            </div>
          )}

          <div className="bg-white p-4 rounded-lg border border-stone-200">
            <QRCode id="qr-label-svg" value={url} size={180} />
          </div>

          <div className="text-center">
            <div className="font-medium text-stone-900 dark:text-stone-100 text-sm">{object.title}</div>
            {object.accession_no && <div className="font-mono text-xs text-stone-400 mt-0.5">{object.accession_no}</div>}
          </div>

          <div className="text-xs font-mono text-stone-400 dark:text-stone-500 text-center break-all">{url}</div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
          <button onClick={() => window.print()} className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-xs font-mono px-4 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800">
            Print label
          </button>
          <button onClick={downloadQR} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded">
            Download PNG
          </button>
        </div>
      </div>
    </div>
  )
}
