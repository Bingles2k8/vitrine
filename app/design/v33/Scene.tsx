'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { ATLAS_COLS, ATLAS_ROWS, PHOTO_GLSL, usePhotoAtlas } from '../_gl/photo'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** Step 3 of 5 — the midpoint. A working room: daylight, task lamp, pinboard. */
const FRAG = `${CORE}${PHOTO_GLSL}
vec3 pinCentre(float i){
  float col = mod(i, 4.0);
  float row = floor(i / 4.0);
  return vec3(-1.32 + col * 0.88, 2.02 - row * 0.80, -2.55);
}

vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.3, -0.3), vec3(4.2, 2.3, 2.6));
  if (room < res.x) res = vec2(room, 2.0);

  // pinboard behind the bench
  float board = sdBox(p - vec3(-0.22, 1.62, -2.58), vec3(1.95, 1.02, 0.04));
  if (board < res.x) res = vec2(board, 5.0);

  for (int i = 0; i < 8; i++){
    float fi = float(i);
    float pin = sdBox(p - pinCentre(fi), vec3(0.34, 0.30, 0.012));
    if (pin < res.x) res = vec2(pin, 10.0 + fi);
  }

  // work bench
  float top = sdBox(p - vec3(0.0, 0.86, -1.35), vec3(2.0, 0.045, 0.75));
  vec3 lq = p - vec3(0.0, 0.0, -1.35); lq.xz = abs(lq.xz) - vec2(1.86, 0.62);
  float legs = sdBox(lq, vec3(0.045, 0.43, 0.045));
  float bench = min(top, legs);
  if (bench < res.x) res = vec2(bench, 3.0);

  vec3 q = p - vec3(0.5, 1.10, -1.2);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, 2.0);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 DAY  = vec3(0.92, 0.95, 1.0);
vec3 LAMP = vec3(1.0, 0.86, 0.62);

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.5);
  float spec = 0.05;
  if (m > 9.5) {
    vec3 c = pinCentre(m - 10.0);
    alb = vec3(0.88, 0.86, 0.82);
    if (n.z > 0.6 && uPhoto.x > 0.5) {
      vec2 uv = (p.xy - c.xy) / vec2(0.30, 0.26) * 0.5 + 0.5;
      uv.x = 1.0 - uv.x;
      if (uv.x > 0.02 && uv.x < 0.98 && uv.y > 0.02 && uv.y < 0.98) alb = atlasSample(m - 10.0, uv);
    }
  }
  else if (m < 1.5) { alb = vec3(0.34, 0.33, 0.31); spec = 0.14; }   // boards
  else if (m < 2.5) { alb = vec3(0.66, 0.65, 0.62); spec = 0.02; }   // plaster
  else if (m < 3.5) { alb = vec3(0.46, 0.36, 0.24); spec = 0.12; }   // beech bench
  else if (m < 4.5) { alb = vec3(0.72, 0.71, 0.68); spec = 0.55; }   // object
  else              { alb = vec3(0.32, 0.29, 0.24); spec = 0.03; }   // cork board

  float occ = ao(p, n);

  // soft daylight from a high window on the right
  vec3  dl  = normalize(vec3(3.4, 3.2, 1.4) - p);
  float dd  = clamp(dot(n, dl), 0.0, 1.0);
  float ds  = softShadow(p + n * 0.006, dl, 4.0);

  // warm task lamp over the bench
  vec3  ll  = normalize(uLight - p);
  float ld  = clamp(dot(n, ll), 0.0, 1.0);
  float ls  = softShadow(p + n * 0.006, ll, 9.0);
  float la  = 1.0 / (1.0 + 0.5 * dot(uLight - p, uLight - p));

  float hemi = 0.5 + 0.5 * n.y;
  vec3 amb = mix(vec3(0.20, 0.19, 0.18), vec3(0.42, 0.45, 0.50), hemi);

  vec3 col = alb * amb * occ;
  col += alb * DAY * dd * ds * 0.95;
  col += alb * LAMP * ld * ls * la * 3.0;

  vec3 h = normalize(dl - rd);
  col += DAY * spec * pow(clamp(dot(n, h), 0.0, 1.0), 44.0) * ds;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.5);
  vec2 hit = march(uCam, rd);
  vec3 col = hit.x > 36.0 ? vec3(0.30, 0.31, 0.32) : shade(uCam + rd * hit.x, rd, hit.y);

  col = 1.0 - exp(-col * 1.35);
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.22 * length(uv * vec2(0.7, 1.0));
  gl_FragColor = vec4(grain(col, 0.014), 1.0);
}
`

export default function Scene({ photos }: { photos: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const { atlasRef, count } = usePhotoAtlas(photos)
  const s = useRef({ mx: 0, my: 0, tx: 0, ty: 0, spin: 0 })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      st.mx += (st.tx - st.mx) * 0.05
      st.my += (st.ty - st.my) * 0.05
      if (!reduced) st.spin += 0.003
      return {
        uTime: t,
        uCam: [0.55 + st.mx * 0.55, 1.62 + st.my * 0.18, 2.65],
        uTarget: [0.15, 1.05, -1.7],
        uLight: [0.95, 1.95, -0.85],
        uP: [0, 0, st.spin, 0],
        uPhoto: [count, ATLAS_COLS, ATLAS_ROWS, 0],
      }
    },
    [count, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 0.72, atlasRef)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#b7b2a8,#4a463f)' }} />
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      onPointerMove={e => {
        const r = (e.target as HTMLElement).getBoundingClientRect()
        s.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
        s.current.ty = ((e.clientY - r.top) / r.height - 0.5) * 2
      }}
      aria-label="A working room with a bench, task lamp and a pinboard of object photographs"
    />
  )
}
