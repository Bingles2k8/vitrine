// Client-side image metadata computed at upload time, in one decode.
//
//  · dHash      — 64-bit perceptual hash for near-duplicate detection,
//                 a '0'/'1' string compatible with Postgres bit(64).
//  · matte      — the modal colour of the picture's own border ring.
//  · aspect     — natural width / height.
//
// The matte and the aspect are what let the object-led templates put a
// photograph into a fixed frame without cropping it and without a hard seam
// against the page. Both are cheap: they read a bitmap that has already been
// decoded for the hash, so no second load and no image library.

export interface ImageMeta {
  /** 64-char '0'/'1' dHash, or null if the image could not be read. */
  hash: string | null
  /** '#rrggbb' sampled from the border, or null when the border is not uniform enough to be worth using. */
  matte: string | null
  /** Natural width / height, rounded to three places. */
  aspect: number | null
}

const EMPTY: ImageMeta = { hash: null, matte: null, aspect: null }

/**
 * Read a file once and return everything we want to know about it.
 *
 * A failure anywhere returns nulls rather than throwing: none of these values
 * is worth failing an upload over, and every consumer has to cope with their
 * absence anyway for images uploaded before this existed.
 */
export async function computeImageMeta(file: File | Blob): Promise<ImageMeta> {
  if (typeof window === 'undefined') return EMPTY
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await new Promise<void>((ok, err) => {
      img.onload = () => ok()
      img.onerror = () => err(new Error('image load failed'))
    })

    const aspect = img.naturalWidth && img.naturalHeight
      ? Math.round((img.naturalWidth / img.naturalHeight) * 1000) / 1000
      : null

    return {
      hash: dHash(img),
      matte: borderColour(img),
      aspect,
    }
  } catch {
    return EMPTY
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Kept for callers that only want the hash. */
export async function computeDHash(file: File | Blob): Promise<string | null> {
  return (await computeImageMeta(file)).hash
}

function dHash(img: HTMLImageElement): string | null {
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
}

/** Quantisation step. Coarse enough that a lightly graded studio backdrop
 *  still reads as one colour, fine enough not to merge distinct grounds. */
const STEP = 24
/** Below this the border is busy — an object shot in situ rather than on a
 *  ground — and a matte drawn from it would be a guess. Better to say so. */
const MIN_AGREEMENT = 0.55

function borderColour(img: HTMLImageElement): string | null {
  const N = 32
  const canvas = document.createElement('canvas')
  canvas.width = N
  canvas.height = N
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, N, N)
  const { data } = ctx.getImageData(0, 0, N, N)

  const at = (x: number, y: number) => {
    const i = (y * N + x) * 4
    return [data[i], data[i + 1], data[i + 2]] as const
  }

  const ring: (readonly [number, number, number])[] = []
  for (let x = 0; x < N; x++) { ring.push(at(x, 0)); ring.push(at(x, N - 1)) }
  for (let y = 1; y < N - 1; y++) { ring.push(at(0, y)); ring.push(at(N - 1, y)) }

  const votes = new Map<string, { n: number; r: number; g: number; b: number }>()
  for (const [r, g, b] of ring) {
    const key = `${Math.round(r / STEP)}|${Math.round(g / STEP)}|${Math.round(b / STEP)}`
    const seen = votes.get(key)
    if (seen) { seen.n++; seen.r += r; seen.g += g; seen.b += b }
    else votes.set(key, { n: 1, r, g, b })
  }

  let best: { n: number; r: number; g: number; b: number } | null = null
  for (const v of votes.values()) if (!best || v.n > best.n) best = v
  if (!best || best.n / ring.length < MIN_AGREEMENT) return null

  // Average the pixels that voted for the winning bucket, so the result is the
  // real colour rather than the middle of the bucket.
  const hex = (v: number) => Math.max(0, Math.min(255, Math.round(v / best!.n))).toString(16).padStart(2, '0')
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`
}

export function isValidPhash(s: unknown): s is string {
  return typeof s === 'string' && /^[01]{64}$/.test(s)
}

export function isValidMatte(s: unknown): s is string {
  return typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s)
}

export function isValidAspect(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 20
}
