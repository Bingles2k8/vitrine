'use client'

import { useCallback, useRef, useState } from 'react'
import { CORE } from '../_gl/core'
import { ATLAS_COLS, ATLAS_ROWS, PHOTO_GLSL, usePhotoAtlas } from '../_gl/photo'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** Step 5 of 5 — the clean end. Cyclorama, colour, one big print leaning behind. */
const FRAG = `${CORE}${PHOTO_GLSL}
vec2 map(vec3 p){
  vec2 res = vec2(smin(p.y, p.z + 3.2, 1.5), 1.0);

  // a large print, leaning against the sweep
  vec3 lp = p - vec3(-1.05, 0.92, -1.55);
  lp.yz = rot(-0.14) * lp.yz;
  float print = sdBox(lp, vec3(0.78, 0.92, 0.025));
  if (print < res.x) res = vec2(print, 10.0);

  vec3 q = p - vec3(0.62, 1.05, 0.0);
  q.xz = rot(uP.z) * q.xz;
  q.yz = rot(uP.w) * q.yz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 KEY  = vec3(1.0, 0.99, 0.97);
vec3 FILL = vec3(0.88, 0.91, 1.0);

vec3 soft(vec3 n, vec3 rd, vec3 lp, vec3 tint, float power, float size){
  vec3 ld = normalize(lp);
  float dif = clamp(dot(n, ld) * 0.5 + 0.5, 0.0, 1.0);
  vec3 h = normalize(ld - rd);
  return tint * dif * power + tint * pow(clamp(dot(n, h), 0.0, 1.0), size) * 0.5;
}

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.93);
  float gloss = 26.0;
  if (m > 9.5) {
    alb = vec3(0.96);
    if (n.z > 0.4 && uPhoto.x > 0.5) {
      vec3 lp = p - vec3(-1.05, 0.92, -1.55);
      lp.yz = rot(-0.14) * lp.yz;
      vec2 uv = lp.xy / vec2(0.70, 0.84) * 0.5 + 0.5;
      uv.x = 1.0 - uv.x;
      if (uv.x > 0.02 && uv.x < 0.98 && uv.y > 0.02 && uv.y < 0.98) alb = atlasSample(uPhoto.w, uv);
    }
    gloss = 40.0;
  } else if (m > 3.5) {
    alb = vec3(uQ.x, uQ.y, uQ.z);
    gloss = 90.0;
  }

  float occ = ao(p, n);
  float sh  = softShadow(p + n * 0.008, normalize(uLight), 3.0);

  vec3 col = alb * soft(n, rd, uLight, KEY, 0.95, gloss) * mix(0.58, 1.0, sh);
  col += alb * soft(n, rd, vec3(-2.2, 1.4, 2.0), FILL, 0.36, gloss * 0.6);
  col *= mix(0.74, 1.0, occ);

  if (m < 1.5) {
    float d = length(p.xz - vec2(0.62, 0.0));
    col *= mix(0.58, 1.0, clamp((d - 0.3) * 1.5, 0.0, 1.0));
  }
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.65);
  vec2 hit = march(uCam, rd);
  vec3 col = hit.x > 36.0 ? vec3(0.97) : shade(uCam + rd * hit.x, rd, hit.y);

  col = 1.0 - exp(-col * 1.7);
  col = pow(col, vec3(0.4545));
  gl_FragColor = vec4(grain(col, 0.008), 1.0);
}
`

const SWATCHES: [string, [number, number, number]][] = [
  ['Vermilion', [0.86, 0.22, 0.10]],
  ['Cobalt', [0.16, 0.30, 0.80]],
  ['Chrome', [0.72, 0.74, 0.78]],
  ['Moss', [0.24, 0.42, 0.26]],
]

export default function Scene({ photos }: { photos: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const { atlasRef, count } = usePhotoAtlas(photos)
  const [colour, setColour] = useState(0)
  const [print, setPrint] = useState(0)

  const s = useRef({
    yaw: 0.5, pitch: 0.08,
    drag: null as null | { x: number; y: number; yaw: number; pitch: number },
  })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (!st.drag && !reduced) st.yaw += 0.005
      const c = SWATCHES[colour][1]
      return {
        uTime: t,
        uCam: [0.35, 1.18, 2.95],
        uTarget: [0.15, 1.0, 0],
        uLight: [1.6, 2.2, 1.8],
        uP: [1, 0, st.yaw, st.pitch],
        uQ: [c[0], c[1], c[2], 0],
        uPhoto: [count, ATLAS_COLS, ATLAS_ROWS, print],
      }
    },
    [colour, print, count, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 0.72, atlasRef)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#fff,#eae9e6)' }} />
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={e => {
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          s.current.drag = { x: e.clientX, y: e.clientY, yaw: s.current.yaw, pitch: s.current.pitch }
        }}
        onPointerMove={e => {
          const d = s.current.drag
          if (!d) return
          s.current.yaw = d.yaw + (e.clientX - d.x) * 0.012
          s.current.pitch = Math.max(-0.6, Math.min(0.6, d.pitch + (e.clientY - d.y) * 0.007))
        }}
        onPointerUp={() => { s.current.drag = null }}
        onPointerCancel={() => { s.current.drag = null }}
        aria-label="A studio sweep with a coloured object and a large print behind it"
      />

      <div className="absolute bottom-6 left-6 z-20 flex flex-col items-start gap-3 sm:left-10">
        <div className="flex gap-2">
          {SWATCHES.map(([name, c], i) => (
            <button
              key={name}
              onClick={() => setColour(i)}
              aria-label={name}
              className={`h-6 w-6 rounded-full transition-transform ${colour === i ? 'scale-110 ring-2 ring-black ring-offset-2' : 'hover:scale-105'}`}
              style={{ background: `rgb(${c.map(v => Math.round(v * 255)).join(',')})` }}
            />
          ))}
        </div>
        {count > 1 && (
          <button
            onClick={() => setPrint(p => (p + 1) % count)}
            className="type-grotesk bg-black/[0.06] px-3.5 py-1.5 text-[11px] font-medium text-black/60 hover:bg-black/10"
          >
            Change the print →
          </button>
        )}
      </div>
    </>
  )
}
