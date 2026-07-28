'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { SHAPE_COUNT } from '../_gl/shapes'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** The same store with the strip lights on. Bare walls — geometry only. */
const FRAG = `${CORE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.4, -0.5), vec3(5.2, 2.4, 4.8));
  if (room < res.x) res = vec2(room, 2.0);

  vec3 r = p;
  r.x = abs(r.x) - 3.9;
  r.z = mod(p.z + 1.9, 3.8) - 1.9;
  vec3 up = r; up.z = abs(up.z) - 1.25;
  float uprights = sdBox(up, vec3(0.05, 2.0, 0.05));
  vec3 shv = r; shv.y = mod(p.y + 0.65, 1.35) - 0.675;
  float shelves = sdBox(shv, vec3(0.50, 0.026, 1.25));
  float rack = min(uprights, shelves);
  if (rack < res.x) res = vec2(rack, 3.0);

  float bench = sdBox(p - vec3(0.35, 0.85, 0.2), vec3(1.15, 0.04, 0.55));
  vec3 lq = p - vec3(0.35, 0.0, 0.2); lq.xz = abs(lq.xz) - vec2(1.02, 0.42);
  float legs = sdBox(lq, vec3(0.04, 0.43, 0.04));
  float table = min(bench, legs);
  if (table < res.x) res = vec2(table, 3.0);

  // one crate at the end of the bench — the story, without the clutter
  float crate = sdBox(p - vec3(-1.55, 0.26, -0.35), vec3(0.40, 0.26, 0.32)) - 0.012;
  if (crate < res.x) res = vec2(crate, 5.0);

  vec3 q = p - vec3(0.35, 1.10, 0.2);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 TUBE = vec3(0.90, 0.97, 0.95);   // cool fluorescent

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb; float rough; float f0;
  if (m < 1.5)      { alb = vec3(0.52, 0.54, 0.54); rough = 0.34; f0 = 0.06; }  // sealed floor
  else if (m < 2.5) { alb = vec3(0.82, 0.85, 0.83); rough = 0.88; f0 = 0.03; }  // painted block
  else if (m < 3.5) { alb = vec3(0.68, 0.72, 0.70); rough = 0.28; f0 = 0.10; }  // steel
  else if (m < 4.5) { alb = vec3(0.29, 0.30, 0.32); rough = 0.22; f0 = 0.10; }  // the object — satin
  else              { alb = vec3(0.62, 0.52, 0.36); rough = 0.72; f0 = 0.04; }  // ply crate

  vec3 l1 = vec3(-1.6, 2.28, p.z);
  vec3 l2 = vec3( 1.6, 2.28, p.z);
  float occ = ao(p, n);

  vec3 d1 = normalize(l1 - p);
  vec3 d2 = normalize(l2 - p);
  float s1 = softShadow(p + n * 0.005, d1, 38.0);
  float s2 = softShadow(p + n * 0.005, d2, 38.0);

  // Key lights: unoccluded, so flats stay perfectly even.
  vec3 col = alb * TUBE * clamp(dot(n, d1), 0.0, 1.0) * s1 * 1.75;
  col     += alb * TUBE * clamp(dot(n, d2), 0.0, 1.0) * s2 * 1.75;

  col += satinSpec(n, rd, d1, TUBE, rough, f0) * s1 * 1.5;
  col += satinSpec(n, rd, d2, TUBE, rough, f0) * s2 * 0.9;

  // Ambient bounce — this is the only term AO touches.
  float hemi = 0.5 + 0.5 * n.y;
  col += alb * mix(vec3(0.26, 0.29, 0.29), vec3(0.60, 0.66, 0.66), hemi) * occ;

  col += envSheen(n, rd, vec3(0.62, 0.66, 0.68), vec3(0.26, 0.27, 0.27), f0)
         * mix(0.15, 0.55, 1.0 - rough) * occ;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.45);
  vec2 hit = march(uCam, rd);
  vec3 col = hit.x > 36.0 ? vec3(0.86, 0.88, 0.88) : shade(uCam + rd * hit.x, rd, hit.y);

  col = gradeClean(col, 1.02);
  col *= 1.0 - 0.06 * length(uv * vec2(0.7, 1.0));
  gl_FragColor = vec4(grain(col, 0.004), 1.0);
}
`


/** Random per load, or pinned with ?shape=N so each model can be reviewed. */
function pickShape() {
  try {
    const forced = new URLSearchParams(window.location.search).get('shape')
    if (forced !== null) {
      const n = Number(forced)
      if (Number.isFinite(n)) return ((n % SHAPE_COUNT) + SHAPE_COUNT) % SHAPE_COUNT
    }
  } catch {
    /* no window search params — fall through to random */
  }
  return Math.floor(Math.random() * SHAPE_COUNT)
}

export default function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({ mx: 0, tx: 0, spin: 0, shape: null as number | null })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (st.shape === null) st.shape = pickShape()
      st.mx += (st.tx - st.mx) * 0.05
      if (!reduced) st.spin += 0.0028
      return {
        uTime: t,
        uCam: [0.2 + st.mx * 0.5, 1.62, 3.5],
        uTarget: [0.35, 1.05, 0.1],
        uLight: [0, 2.28, 0],
        uP: [st.shape, 0, st.spin, 0],
      }
    },
    [reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 1.0)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#f2f4f2,#cfd4d1)' }} />
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      onPointerMove={e => {
        const r = (e.target as HTMLElement).getBoundingClientRect()
        s.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
      }}
      aria-label="A store room with the strip lights on, racking and a work bench"
    />
  )
}
