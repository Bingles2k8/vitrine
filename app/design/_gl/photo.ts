'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Local stand-ins so the frames/labels are never blank when no published
 * photographs are available (dev without credentials, or a fresh install).
 */
export const PLACEHOLDER_PHOTOS = ['/og-default.jpg', '/logo.png']

export const ATLAS_COLS = 4
export const ATLAS_ROWS = 2
export const ATLAS_MAX = ATLAS_COLS * ATLAS_ROWS
const CELL = 256

/**
 * Packs real published object photographs into a single canvas atlas so the
 * raymarcher can hang them in the scene with one texture unit.
 *
 * Images are requested with CORS so the canvas stays untainted; any that fail
 * are simply skipped, and if none load the caller falls back to flat colour.
 */
export function usePhotoAtlas(urls: string[]) {
  const atlasRef = useRef<HTMLCanvasElement | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const wanted = urls.filter(Boolean).slice(0, ATLAS_MAX)
    if (!wanted.length) return

    let cancelled = false
    const canvas = document.createElement('canvas')
    canvas.width = ATLAS_COLS * CELL
    canvas.height = ATLAS_ROWS * CELL
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#3a3a38'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const load = (url: string) =>
      new Promise<HTMLImageElement | null>(resolve => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = url
      })

    Promise.all(wanted.map(load)).then(images => {
      if (cancelled) return
      let n = 0
      images.forEach(img => {
        if (!img) return
        const col = n % ATLAS_COLS
        const row = Math.floor(n / ATLAS_COLS)
        // cover-fit into the cell
        const scale = Math.max(CELL / img.width, CELL / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.save()
        ctx.beginPath()
        ctx.rect(col * CELL, row * CELL, CELL, CELL)
        ctx.clip()
        ctx.drawImage(img, col * CELL + (CELL - w) / 2, row * CELL + (CELL - h) / 2, w, h)
        ctx.restore()
        n += 1
      })
      if (!n) return
      atlasRef.current = canvas
      setCount(n)
    })

    return () => {
      cancelled = true
    }
  }, [urls])

  return { atlasRef, count }
}

/**
 * GLSL for sampling the atlas. Append after CORE.
 *
 * `uPhoto.x` is how many cells actually hold a photograph; when it is zero the
 * caller should shade the panel as flat board instead.
 */
export const PHOTO_GLSL = `
uniform sampler2D uTex;
uniform vec4 uPhoto;   // x = count, y = cols, z = rows

vec3 atlasSample(float idx, vec2 uv){
  float count = max(uPhoto.x, 1.0);
  float i = mod(floor(idx), count);
  float cols = uPhoto.y;
  float rows = uPhoto.z;
  float col = mod(i, cols);
  float row = floor(i / cols);
  vec2 cell = clamp(uv, 0.004, 0.996);
  vec2 t = (vec2(col, rows - 1.0 - row) + cell) / vec2(cols, rows);
  return texture2D(uTex, t).rgb;
}
`
