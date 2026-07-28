'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { ATLAS_COLS, ATLAS_ROWS, PHOTO_GLSL, usePhotoAtlas } from '../_gl/photo'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** Step 4 of 5 — a bright showroom. Pale walls, blocks for plinths, big prints. */
const FRAG = `${CORE}${PHOTO_GLSL}
vec3 printCentre(float i){ return vec3(-1.95 + i * 1.42, 1.46, -3.0); }

vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.8, -0.4), vec3(5.0, 2.8, 4.6));
  if (room < res.x) res = vec2(room, 2.0);

  for (int i = 0; i < 4; i++){
    float fi = float(i);
    float pr = sdBox(p - printCentre(fi), vec3(0.56, 0.56, 0.03));
    if (pr < res.x) res = vec2(pr, 10.0 + fi);
  }

  // low blocks instead of plinths
  vec3 b = p;
  b.x = mod(p.x + 1.5, 3.0) - 1.5;
  float block = sdBox(b - vec3(0.0, 0.28, -0.2), vec3(0.62, 0.28, 0.52));
  if (block < res.x) res = vec2(block, 3.0);

  vec3 q = p - vec3(0.0, 0.86, -0.2);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, 1.0);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 shade(vec3 p, vec3 rd, float m){
  vec3 n = normal(p);

  vec3 alb = vec3(0.86);
  float spec = 0.05;
  if (m > 9.5) {
    vec3 c = printCentre(m - 10.0);
    alb = vec3(0.97);
    if (n.z > 0.6 && uPhoto.x > 0.5) {
      vec2 uv = (p.xy - c.xy) / vec2(0.48, 0.48) * 0.5 + 0.5;
      uv.x = 1.0 - uv.x;
      if (uv.x > 0.02 && uv.x < 0.98 && uv.y > 0.02 && uv.y < 0.98) alb = atlasSample(m - 10.0, uv);
    }
    spec = 0.10;
  }
  else if (m < 1.5) { alb = vec3(0.74, 0.73, 0.71); spec = 0.16; }
  else if (m < 2.5) { alb = vec3(0.90, 0.89, 0.87); spec = 0.02; }
  else if (m < 3.5) { alb = vec3(0.82, 0.80, 0.76); spec = 0.05; }
  else              { alb = vec3(0.55, 0.42, 0.30); spec = 0.45; }   // warm object

  vec3  ld  = normalize(uLight - p);
  float dif = clamp(dot(n, ld), 0.0, 1.0);
  float sh  = softShadow(p + n * 0.006, ld, 4.0);
  float occ = ao(p, n);

  float hemi = 0.5 + 0.5 * n.y;
  vec3  amb  = mix(vec3(0.60, 0.60, 0.63), vec3(0.96, 0.97, 1.0), hemi);

  vec3 col = alb * amb * occ * 0.88;
  col += alb * vec3(1.0, 0.98, 0.94) * dif * sh * 0.62;

  vec3 h = normalize(ld - rd);
  col += vec3(1.0) * spec * pow(clamp(dot(n, h), 0.0, 1.0), 40.0) * sh;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = camRay(uCam, uTarget, uv, 1.5);
  vec2 hit = march(uCam, rd);

  vec3 col;
  if (hit.x > 36.0) col = vec3(0.94);
  else {
    vec3 p = uCam + rd * hit.x;
    col = shade(p, rd, hit.y);
    if (hit.y < 1.5) {
      vec3 n = normal(p);
      vec3 r = reflect(rd, n);
      vec2 h2 = march(p + n * 0.02, r);
      vec3 rc = h2.x > 36.0 ? vec3(0.94) : shade(p + n * 0.02 + r * h2.x, r, h2.y);
      col = mix(col, rc, 0.14);
    }
  }

  col = 1.0 - exp(-col * 1.45);
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.14 * length(uv * vec2(0.7, 1.0));
  gl_FragColor = vec4(grain(col, 0.010), 1.0);
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
      if (!reduced) st.spin += 0.0032
      return {
        uTime: t,
        uCam: [0.1 + st.mx * 0.7, 1.48 + st.my * 0.2, 3.6],
        uTarget: [0.05, 0.95, -0.4],
        uLight: [2.4, 4.4, 2.6],
        uP: [0, 0, st.spin, 0],
        uPhoto: [count, ATLAS_COLS, ATLAS_ROWS, 0],
      }
    },
    [count, reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 0.72, atlasRef)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#f2f1ee,#d8d6d1)' }} />
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
      aria-label="A bright showroom with prints on the wall and objects on low blocks"
    />
  )
}
