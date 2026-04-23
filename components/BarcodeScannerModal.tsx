'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/Toast'

interface BarcodeScannerModalProps {
  onClose: () => void
  onDetected: (code: string, format: string) => void
}

type ScanState = 'requesting' | 'scanning' | 'denied' | 'unsupported' | 'manual'

export default function BarcodeScannerModal({ onClose, onDetected }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<any>(null)
  const onDetectedRef = useRef(onDetected)
  const [state, setState] = useState<ScanState>('requesting')
  const [manualCode, setManualCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mirror, setMirror] = useState(true)
  const { toast } = useToast()

  useEffect(() => { onDetectedRef.current = onDetected }, [onDetected])

  useEffect(() => {
    let cancelled = false
    async function start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setState('unsupported')
        return
      }
      try {
        const [{ BrowserMultiFormatReader }, zxingLibrary] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])
        if (cancelled) return
        const BarcodeFormat = (zxingLibrary as any).BarcodeFormat
        const reader = new BrowserMultiFormatReader()
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (cancelled) return
          if (result) {
            const text = result.getText()
            const rawFormat = result.getBarcodeFormat?.()
            const formatName = typeof rawFormat === 'number' && BarcodeFormat ? BarcodeFormat[rawFormat] : String(rawFormat ?? '')
            const format = formatName ? formatName.toLowerCase().replace(/_/g, '-') : 'other'
            controlsRef.current?.stop()
            onDetectedRef.current(text, format)
          }
        })
        if (cancelled) { controls.stop(); return }
        controlsRef.current = controls
        const stream = videoRef.current?.srcObject as MediaStream | null
        const track = stream?.getVideoTracks?.()[0]
        const facing = track?.getSettings?.().facingMode
        if (facing === 'environment') setMirror(false)
        setState('scanning')
      } catch (err: any) {
        if (cancelled) return
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setState('denied')
        } else {
          setState('unsupported')
        }
      }
    }
    start()
    return () => {
      cancelled = true
      try { controlsRef.current?.stop() } catch {}
    }
  }, [])

  async function handleManual(e: React.FormEvent) {
    e.preventDefault()
    const code = manualCode.trim()
    if (!code) { toast('Enter a barcode', 'error'); return }
    setSubmitting(true)
    onDetectedRef.current(code, 'other')
  }

  const videoHidden = state !== 'scanning'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-medium text-stone-900 dark:text-stone-100">Scan barcode</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {state === 'requesting' && (
            <div className="text-xs text-stone-400 dark:text-stone-500 text-center py-8">Requesting camera…</div>
          )}

          <div className={`relative rounded-lg overflow-hidden bg-black aspect-video ${videoHidden ? 'hidden' : ''}`}>
            <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: mirror ? 'scaleX(-1)' : undefined }} playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/70 rounded-lg w-4/5 h-16" />
            </div>
          </div>

          {state === 'scanning' && (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
              Point the camera at a barcode. It will detect automatically.
            </p>
          )}

          {(state === 'denied' || state === 'unsupported' || state === 'manual') && (
            <div className="space-y-3">
              {state === 'denied' && (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Camera access was blocked. Enter the barcode below to continue.
                </p>
              )}
              {state === 'unsupported' && (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Your device doesn&apos;t support in-browser scanning. Enter the barcode below.
                </p>
              )}
              <form onSubmit={handleManual} className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  inputMode="numeric"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="e.g. 9780140449136"
                  className="flex-1 border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
                <button
                  type="submit"
                  disabled={submitting || !manualCode.trim()}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-50"
                >
                  {submitting ? '…' : 'Look up'}
                </button>
              </form>
            </div>
          )}

          {state === 'scanning' && (
            <button
              type="button"
              onClick={() => { try { controlsRef.current?.stop() } catch {}; setState('manual') }}
              className="w-full text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 underline"
            >
              Enter barcode manually
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
