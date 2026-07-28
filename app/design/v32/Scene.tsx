'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { ATLAS_COLS, ATLAS_ROWS, PHOTO_GLSL, usePhotoAtlas } from '../_gl/photo'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** Step 2 of 5 — same store, strip lights on. Prints hung along the end wall. */
const FRAG = `${CORE}${PHOTO_GLSL}
vec3 printCentre(float i){ return vec3(-2.55 + i * 1.28, 1.62, -3.9); }

vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.4, -0.5), vec3(5.2, 2.4, 4.8));
  if (room < res.x) res = vec2(room, 2.0);

  vec3 r = p;
  r.x = abs(r.x) - 3.1;
  r.z = mod(p.z + 1.4, 2.8) - 1.4;
  vec3 up = r; up.z = abs(up.z) - 1.25;
  float uprights = sdBox(up, vec3(0.05, 2.0, 0.05));
  vec3 shv = r; shv.y = mod(p.y + 0.30, 0.95) - 0.475;
  float shelves = sdBox(shv, vec3(0.50, 0.026, 1.25));
  float rack = min(uprights, shelves);
  if (rack < res.x) res = vec2(rack, 3.0);

  float bench = sdBox(p - vec3(0.35, 0.85, 0.2), vec3(1.15, 0.04, 0.55));
  vec3 lq = p - vec3(0.35, 0.0, 0.2); lq.xz = abs(lq.xz) - vec2(1.02, 0.42);
  float legs = sdBox(lq, vec3(0.04, 0.43, 0.04));
  float table = min(bench, legs);
  if (table < res.x) res = vec2(table, 3.0);

  for (int i = 0; i < 5; i++){
    float fi = float(i);
    float pr = sdBox(p - printCentre(fi), vec3(0.44, 0.44, 0.025));
    if (pr < res.x) res = vec2(pr, 10.0 + fi);
  }

  vec3 q = p - vec3(0.35, 1.10, 0.2);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, 1.0);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 TUBE = vec3(0.90, 0.97, 0.95);   // cool fluorescent

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.32);
  float spec = 0.05;
  if (m > 9.5) {
    vec3 c = printCentre(m - 10.0);
    alb = vec3(0.10, 0.11, 0.11);                       // frame
    if (n.z > 0.6 && uPhoto.x > 0.5) {
      vec2 uv = (p.xy - c.xy) / vec2(0.38, 0.38) * 0.5 + 0.5;
      uv.x = 1.0 - uv.x;
      if (uv.x > 0.02 && uv.x < 0.98 && uv.y > 0.02 && uv.y < 0.98) alb = atlasSample(m - 10.0, uv);
    }
    spec = 0.08;
  }
  else if (m < 1.5) { alb = vec3(0.26, 0.28, 0.27); spec = 0.22; }
  else if (m < 2.5) { alb = vec3(0.42, 0.46, 0.44); spec = 0.02; }
  else if (m < 3.5) { alb = vec3(0.40, 0.44, 0.42); spec = 0.25; }
  else              { alb = vec3(0.70, 0.69, 0.66); spec = 0.55; }

  // two strip lights running down the room
  vec3 l1 = vec3(-1.6, 2.28, p.z);
  vec3 l2 = vec3( 1.6, 2.28, p.z);
  float occ = ao(p, n);
  vec3 col = vec3(0.0);

  vec3 d1 = normalize(l1 - p);
  vec3 d2 = normalize(l2 - p);
  float s1 = softShadow(p + n * 0.006, d1, 7.0);
  float s2 = softShadow(p + n * 0.006, d2, 7.0);
  col += alb * TUBE * clamp(dot(n, d1), 0.0, 1.0) * s1 * 1.25;
  col += alb * TUBE * clamp(dot(n, d2), 0.0, 1.0) * s2 * 1.25;

  float hemi = 0.5 + 0.5 * n.y;
  col += alb * mix(vec3(0.16, 0.18, 0.17), vec3(0.30, 0.34, 0.33), hemi) * occ;

  vec3 h = normalize(d1 - rd);
  col += TUBE * spec * pow(clamp(dot(n, h), 0.0, 1.0), 42.0) * s1;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.45);
  vec2 hit = march(uCam, rd);
  vec3 col = hit.x > 36.0 ? vec3(0.05, 0.06, 0.06) : shade(uCam + rd * hit.x, rd, hit.y);

  col = 1.0 - exp(-col * 1.30);
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.30 * length(uv * vec2(0.7, 1.0));
  gl_FragColor = vec4(grain(col, 0.020), 1.0);
}
`

export default function Scene({ photos }: { photos: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const { atlasRef, count } = usePhotoAtlas(photos)
  const s = useRef({ mx: 0, tx: 0, spin: 0 })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      st.mx += (st.tx - st.mx) * 0.05
      if (!reduced) st.spin += 0.0028
      return {
        uTime: t,
        uCam: [0.2 + st.mx * 0.5, 1.62, 3.5],
        uTarget: [0.35, 1.05, 0.1],
        uLight: [0, 2.28, 0],
        uP: [0, 0, st.spin, 0],
        uPhoto: [count, ATLAS_COLS, ATLAS_ROWS, 0],
      }
    },
    [count, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 0.72, atlasRef)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#5c6260,#222624)' }} />
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      onPointerMove={e => {
        const r = (e.target as HTMLElement).getBoundingClientRect()
        s.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
      }}
      aria-label="A store room with the strip lights on and prints on the wall"
    />
  )
}
