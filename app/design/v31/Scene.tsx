'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { ATLAS_COLS, ATLAS_ROWS, PHOTO_GLSL, usePhotoAtlas } from '../_gl/photo'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** Step 1 of 5 — the darkest end. Racking, one bulb, photos as crate labels. */
const FRAG = `${CORE}${PHOTO_GLSL}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.6, 0.0), vec3(6.0, 2.6, 9.0));
  if (room < res.x) res = vec2(room, 2.0);

  // racking down both sides
  vec3 r = p;
  r.x = abs(r.x) - 2.5;
  r.z = mod(p.z + 1.6, 3.2) - 1.6;
  vec3 up = r; up.z = abs(up.z) - 1.45;
  float uprights = sdBox(up, vec3(0.05, 2.2, 0.05));
  vec3 shv = r; shv.y = mod(p.y + 0.35, 1.05) - 0.525;
  float shelves = sdBox(shv, vec3(0.55, 0.028, 1.45));
  float rack = min(uprights, shelves);
  if (rack < res.x) res = vec2(rack, 3.0);

  // stacked crates in the aisle, each with a label facing the camera
  for (int i = 0; i < 5; i++){
    float fi = float(i);
    vec3 c = vec3(-1.25 + mod(fi, 3.0) * 1.25, 0.30 + floor(fi / 3.0) * 0.62, 0.9 - floor(fi / 3.0) * 0.5);
    float crate = sdBox(p - c, vec3(0.44, 0.30, 0.34));
    if (crate < res.x) res = vec2(crate, 10.0 + fi);
  }

  vec3 q = p - vec3(0.55, 1.30, 0.55);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, 0.0);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 BULB = vec3(1.0, 0.88, 0.66);

vec3 crateCentre(float i){
  return vec3(-1.25 + mod(i, 3.0) * 1.25, 0.30 + floor(i / 3.0) * 0.62, 0.9 - floor(i / 3.0) * 0.5);
}

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.20);
  float spec = 0.05;
  if (m > 9.5) {
    vec3 c = crateCentre(m - 10.0);
    alb = vec3(0.34, 0.27, 0.17);                       // plywood
    if (n.z > 0.6 && uPhoto.x > 0.5) {
      vec2 uv = (p.xy - c.xy) / vec2(0.36, 0.22) * 0.5 + 0.5;
      uv.x = 1.0 - uv.x;
      if (uv.x > 0.02 && uv.x < 0.98 && uv.y > 0.02 && uv.y < 0.98) {
        alb = atlasSample(m - 10.0, uv) * 0.85;         // the label
      }
    }
    spec = 0.05;
  }
  else if (m < 1.5)      { alb = vec3(0.15, 0.16, 0.15); spec = 0.20; }
  else if (m < 2.5)      { alb = vec3(0.21, 0.24, 0.21); spec = 0.02; }
  else if (m < 3.5)      { alb = vec3(0.28, 0.31, 0.29); spec = 0.30; }
  else                   { alb = vec3(0.66, 0.64, 0.60); spec = 0.55; }

  vec3  ld  = normalize(uLight - p);
  float dif = clamp(dot(n, ld), 0.0, 1.0);
  float sh  = softShadow(p + n * 0.006, ld, 10.0);
  float occ = ao(p, n);
  float att = 1.0 / (1.0 + 0.24 * dot(uLight - p, uLight - p));

  vec3 col = alb * BULB * (3.8 * dif * sh * att) * occ;
  col += alb * vec3(0.026, 0.032, 0.030) * occ;
  vec3 h = normalize(ld - rd);
  col += BULB * spec * pow(clamp(dot(n, h), 0.0, 1.0), 36.0) * sh * att * 1.4;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.45);

  vec2 hit = march(uCam, rd);
  vec3 col = hit.x > 36.0 ? vec3(0.009, 0.011, 0.010) : shade(uCam + rd * hit.x, rd, hit.y);

  vec3 toL = uLight - uCam;
  float along = clamp(dot(toL, rd), 0.0, 40.0);
  float d = length(toL - rd * along);
  if (along < hit.x) {
    col += BULB * 2.4 * smoothstep(0.085, 0.0, d);
    col += BULB * 0.26 * smoothstep(1.3, 0.0, d);
  }

  col = col / (col + 0.85);
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.46 * length(uv * vec2(0.7, 1.0));
  gl_FragColor = vec4(grain(col, 0.026), 1.0);
}
`

export default function Scene({ photos }: { photos: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const { atlasRef, count } = usePhotoAtlas(photos)
  const s = useRef({ swing: 0.3, vel: 0, spin: 0, drag: null as null | { x: number } })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (!reduced) {
        st.vel += -st.swing * 0.0042
        st.vel *= 0.995
        st.swing += st.vel
        st.spin += 0.002
      }
      const a = st.swing
      return {
        uTime: t,
        uCam: [0.15, 1.55, 3.6],
        uTarget: [0.3, 0.9, 0.5],
        uLight: [Math.sin(a) * 1.4, 2.2 - Math.abs(Math.sin(a)) * 0.2, 0.8 + Math.cos(a) * 0.22],
        uP: [0, 0, st.spin, 0],
        uPhoto: [count, ATLAS_COLS, ATLAS_ROWS, 0],
      }
    },
    [count, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 0.72, atlasRef)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: 'radial-gradient(40% 36% at 46% 28%, #6b6350 0%, #0b0d0b 72%)' }} />
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
      onPointerDown={e => {
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        s.current.drag = { x: e.clientX }
      }}
      onPointerMove={e => {
        const d = s.current.drag
        if (!d) return
        s.current.vel += (e.clientX - d.x) * 0.00022
        d.x = e.clientX
      }}
      onPointerUp={() => { s.current.drag = null }}
      onPointerCancel={() => { s.current.drag = null }}
      aria-label="A dark store room with crates; drag to swing the light"
    />
  )
}
