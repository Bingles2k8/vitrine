// Client-side 64-bit perceptual hash (dHash) for near-duplicate image detection.
// Returns a 64-char '0'/'1' string compatible with Postgres bit(64).

export async function computeDHash(file: File | Blob): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await new Promise<void>((ok, err) => {
      img.onload = () => ok()
      img.onerror = () => err(new Error('image load failed'))
    })
    const canvas = document.createElement('canvas')
    canvas.width = 9
    canvas.height = 8
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, 9, 8)
    const { data } = ctx.getImageData(0, 0, 9, 8)
    let bits = ''
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const iA = (y * 9 + x) * 4
        const iB = (y * 9 + x + 1) * 4
        const a = 0.299 * data[iA] + 0.587 * data[iA + 1] + 0.114 * data[iA + 2]
        const b = 0.299 * data[iB] + 0.587 * data[iB + 1] + 0.114 * data[iB + 2]
        bits += a > b ? '1' : '0'
      }
    }
    return bits
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function isValidPhash(s: unknown): s is string {
  return typeof s === 'string' && /^[01]{64}$/.test(s)
}
