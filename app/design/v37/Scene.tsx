'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { SHAPE_COUNT } from '../_gl/shapes'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/**
 * No room at all. A seamless sweep, one big soft source, one rim, and the
 * object at most of the frame height. The whole scene is two surfaces, so this
 * is by far the cheapest of the concepts to render.
 */
const FRAG = `${CORE}
/* Where each shape's lowest point sits, so every object stands on the sweep
   rather than hovering or sinking through it. */
float baseY(float id){
  if (id < 0.5) return 0.155;
  if (id < 1.5) return 0.205;
  if (id < 2.5) return 0.157;
  return 0.111;
}

const float S = 2.6;   // objects are ~0.4 units across; this fills the frame

vec2 map(vec3 p){
  // Floor curving into a back wall with no visible join — a paper sweep.
  float sweep = smin(p.y, p.z + 2.7, 1.6);
  vec2 res = vec2(sweep, 1.0);

  vec3 q = p - vec3(0.0, baseY(uP.x) * S, 0.0);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q / S, uP.x) * S;
  if (obj < res.x) res = vec2(obj, 2.0);
  return res;
}

vec3 KEY  = vec3(1.00, 0.98, 0.95);
vec3 RIM  = vec3(0.62, 0.74, 0.95);
vec3 VOID = vec3(0.021, 0.022, 0.026);

vec3 keyDir(){ return normalize(vec3(-0.62, 0.86, 0.52)); }
vec3 rimDir(){ return normalize(vec3( 0.85, 0.30, -0.55)); }

vec3 shade(vec3 p, vec3 n, vec3 rd, float m, float bounce){
  vec3 alb; float rough; float f0;
  if (m < 1.5) { alb = vec3(0.055, 0.057, 0.062); rough = 0.42; f0 = 0.05; }  // sweep
  else         { alb = vec3(0.72,  0.72,  0.70 ); rough = 0.22; f0 = 0.09; }  // object

  vec3 k = keyDir();
  vec3 r = rimDir();

  // A big source: soft-edged shadow that stays soft, the way a metre-wide
  // scrim behaves a foot from the subject.
  float sh = bounce > 0.5 ? 1.0 : penumbra(p + n * 0.006, k, 0.30, 7.0);
  float occ = bounce > 0.5 ? 1.0 : ao(p, n);

  vec3 col = alb * KEY * clamp(dot(n, k), 0.0, 1.0) * sh * 1.05;
  col += satinSpec(n, rd, k, KEY, rough, f0) * sh * 1.6;

  // Rim from behind, tight, unshadowed — it draws the silhouette off the black.
  float rl = pow(clamp(dot(n, r), 0.0, 1.0), 2.2);
  col += alb * RIM * rl * 0.55;
  col += satinSpec(n, rd, r, RIM, rough, f0) * 0.9;

  float hemi = 0.5 + 0.5 * n.y;
  col += alb * mix(vec3(0.010, 0.011, 0.014), vec3(0.048, 0.052, 0.062), hemi) * occ;
  col += envSheen(n, rd, vec3(0.10, 0.11, 0.13), vec3(0.020, 0.020, 0.024), f0)
         * mix(0.20, 0.90, 1.0 - rough) * occ;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float ar = uRes.x / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, ar > 1.0 ? 1.45 : 1.10);

  vec2 hit = march(uCam, rd);
  vec3 col = VOID;

  if (hit.x <= 36.0) {
    vec3 p = uCam + rd * hit.x;
    vec3 n = normal(p);
    col = shade(p, n, rd, hit.y, 0.0);

    // The traced bounce is the whole look here: the object sitting in its own
    // reflection is what separates a product shot from a cut-out.
    vec3 ro = p + n * 0.02;
    vec3 rr = reflect(rd, n);
    vec2 h2 = march(ro, rr);
    vec3 q  = ro + rr * h2.x;
    vec3 rc = h2.x > 13.0 ? VOID : shade(q, normal(q), rr, h2.y, 1.0);
    float gloss = hit.y < 1.5 ? 1.0 : 0.45;
    col += rc * gloss * fresnel(n, rd, 0.05) * exp(-h2.x * 0.55);
  }

  col = gradeRT(col, 1.14, 1.18);
  col *= 1.0 - 0.16 * length(uv * vec2(0.72, 1.0));
  gl_FragColor = vec4(grain(col, 0.004), 1.0);
}
`

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
  const s = useRef({ mx: 0, tx: 0, spin: 0.4, shape: null as number | null })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (st.shape === null) st.shape = pickShape()
      st.mx += (st.tx - st.mx) * 0.045
      if (!reduced) st.spin += 0.0032
      return {
        uTime: t,
        uCam: [st.mx * 0.85, 0.95, 3.45],
        uTarget: [0, 0.66, 0],
        uLight: [0, 3, 2],
        uP: [st.shape, 0, st.spin, 0],
      }
    },
    [reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 1.0)

  if (failed) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(52% 44% at 50% 46%, #23242a 0%, #08080a 74%)' }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      onPointerMove={e => {
        const r = (e.target as HTMLElement).getBoundingClientRect()
        s.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
      }}
      aria-label="A single object turning slowly on a seamless dark sweep"
    />
  )
}
