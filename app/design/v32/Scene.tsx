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
vec3 SKY  = vec3(0.62, 0.65, 0.65);

/* Albedos are a stop lower than they were. Painted block is not a white card,
   and when every surface reflects 80% of what hits it there is nowhere for a
   dark to live — which is why the room used to read as a lightbox. */
void mat(float m, out vec3 alb, out float rough, out float f0){
  if (m < 1.5)      { alb = vec3(0.30, 0.31, 0.31); rough = 0.22; f0 = 0.06; }  // polished floor
  else if (m < 2.5) { alb = vec3(0.52, 0.55, 0.53); rough = 0.88; f0 = 0.03; }  // painted block
  else if (m < 3.5) { alb = vec3(0.55, 0.58, 0.57); rough = 0.26; f0 = 0.10; }  // steel
  else if (m < 4.5) { alb = vec3(0.33, 0.34, 0.36); rough = 0.19; f0 = 0.10; }  // the object — satin
  else              { alb = vec3(0.48, 0.40, 0.27); rough = 0.72; f0 = 0.04; }  // ply crate
}

/* bounce = 1 on the second ray: no AO, cheaper shadows. */
vec3 shade(vec3 p, vec3 n, vec3 rd, float m, float bounce){
  vec3 alb; float rough; float f0;
  mat(m, alb, rough, f0);

  // Two tubes running the length of the room, so the nearest point on each is
  // always at the fragment's own z. Falloff is inverse square to that point —
  // gentle, as a line source really is, but no longer flat.
  vec3 l1 = vec3(-1.6, 2.28, p.z);
  vec3 l2 = vec3( 1.6, 2.28, p.z);
  vec3 v1 = l1 - p, v2 = l2 - p;
  vec3 d1 = normalize(v1), d2 = normalize(v2);
  float a1 = 1.0 / max(dot(v1, v1), 0.6);
  float a2 = 1.0 / max(dot(v2, v2), 0.6);

  float sm = bounce > 0.5 ? 0.26 : 0.16;   // angular size of a 6ft tube
  float s1 = penumbra(p + n * 0.006, d1, sm, length(v1) - 0.03);
  float s2 = penumbra(p + n * 0.006, d2, sm, length(v2) - 0.03);
  float occ = bounce > 0.5 ? 1.0 : ao(p, n);

  // Key lights: unoccluded, so flats stay perfectly even. With falloff in play
  // the bench top now sits a stop and a half above the floor and two above the
  // far wall, which is the whole point — a lit room, not a lightbox.
  vec3 col = alb * TUBE * clamp(dot(n, d1), 0.0, 1.0) * s1 * a1 * 2.9;
  col     += alb * TUBE * clamp(dot(n, d2), 0.0, 1.0) * s2 * a2 * 2.9;

  col += satinSpec(n, rd, d1, TUBE, rough, f0) * s1 * a1 * 4.0;
  col += satinSpec(n, rd, d2, TUBE, rough, f0) * s2 * a2 * 2.5;

  // Ambient bounce — the only term AO touches. Tighter than before: the room
  // is lit by two tubes, not by a softbox the size of the ceiling.
  float hemi = 0.5 + 0.5 * n.y;
  col += alb * mix(vec3(0.055, 0.065, 0.065), vec3(0.19, 0.21, 0.21), hemi) * occ;

  col += envSheen(n, rd, vec3(0.50, 0.54, 0.56), vec3(0.13, 0.14, 0.14), f0)
         * mix(0.15, 0.55, 1.0 - rough) * occ;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  // On a phone the copy fills the frame and the object ends up behind the
  // headline, so lift it above the type with a lens shift. Wide screens keep
  // the composition they already had.
  float ar = uRes.x / uRes.y;
  bool wide = ar > 1.0;
  vec2 suv = wide ? uv : uv - vec2(0.02, 0.26);
  vec3 rd = camRay(uCam, uTarget, suv, wide ? 1.45 : 1.15);
  vec2 hit = march(uCam, rd);
  vec3 col = SKY;

  if (hit.x <= 36.0) {
    vec3 p = uCam + rd * hit.x;
    vec3 n = normal(p);
    col = shade(p, n, rd, hit.y, 0.0);

    // One traced bounce off the floor and the object. On a sealed floor this
    // is the whole difference between a render and a photograph.
    float gloss = hit.y < 1.5 ? 1.0 : (hit.y > 3.5 && hit.y < 4.5 ? 0.5 : 0.0);
    if (gloss > 0.0) {
      vec3 ro = p + n * 0.02;
      vec3 rr = reflect(rd, n);
      vec2 h2 = march(ro, rr);
      vec3 q  = ro + rr * h2.x;
      // Cap the bounce short. Past this the marcher runs out of steps on a
      // grazing ray, and an unconverged hit gives a garbage normal — which
      // shows up as speckle across the floor.
      vec3 rc = h2.x > 13.0 ? SKY : shade(q, normal(q), rr, h2.y, 1.0);
      col += rc * gloss * fresnel(n, rd, 0.06) * exp(-h2.x * 0.34) * 0.75;
    }
  }

  col = gradeRT(col, 0.88, 1.20);
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
