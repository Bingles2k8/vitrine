'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { SHAPE_COUNT } from '../_gl/shapes'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/**
 * An actual vitrine. The steel frame is marched like everything else, but the
 * glass is an analytic box: a ray-box intersection gives an exact entry point
 * and normal, which is far more stable than trying to march four thin panels —
 * and it makes room for a real refracted ray through the case.
 */
const FRAG = `${CORE}
float baseY(float id){
  if (id < 0.5) return 0.155;
  if (id < 1.5) return 0.205;
  if (id < 2.5) return 0.157;
  return 0.111;
}

const float S = 1.30;
const vec3 CASE_C = vec3(0.0, 1.54, 0.0);
const vec3 CASE_B = vec3(0.44, 0.64, 0.44);

vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.9, -0.5), vec3(6.0, 2.9, 7.0));
  if (room < res.x) res = vec2(room, 2.0);

  float plinth = sdBox(p - vec3(0.0, 0.45, 0.0), vec3(0.46, 0.45, 0.46)) - 0.012;
  if (plinth < res.x) res = vec2(plinth, 3.0);

  // The case frame is real geometry, so it casts a real shadow. The glass is
  // handled analytically in main().
  float frame = sdFrame(p - CASE_C, CASE_B, 0.016);
  if (frame < res.x) res = vec2(frame, 5.0);

  vec3 q = p - vec3(0.0, 0.90 + baseY(uP.x) * S, 0.0);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q / S, uP.x) * S;
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 LAMP = vec3(1.00, 0.96, 0.88);
vec3 VOID = vec3(0.006, 0.007, 0.009);

/* Slab intersection. Returns entry/exit distance and the outward normal at the
   entry face; negative x means the ray misses. */
vec2 boxHit(vec3 ro, vec3 rd, vec3 c, vec3 b, out vec3 nrm){
  vec3 m  = 1.0 / rd;
  vec3 nn = m * (ro - c);
  vec3 k  = abs(m) * b;
  vec3 t1 = -nn - k;
  vec3 t2 = -nn + k;
  float tN = max(max(t1.x, t1.y), t1.z);
  float tF = min(min(t2.x, t2.y), t2.z);
  nrm = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
  if (tN > tF || tF < 0.0) return vec2(-1.0, -1.0);
  return vec2(tN, tF);
}

/* What the glass sees when it reflects. No second scene trace — a gradient
   plus the lamp is all a reflection this sharp actually shows. */
vec3 envCol(vec3 d){
  float t = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 c = mix(vec3(0.008, 0.009, 0.011), vec3(0.060, 0.064, 0.074), t);

  // A soft strip across the ceiling. Glass at a steep angle reflects most of
  // what it sees, and in a gallery what it sees is the lighting track — that
  // long soft streak down a pane is the cue that says "there is glass here".
  float bar = smoothstep(0.35, 0.92, d.y) * smoothstep(0.72, 0.10, abs(d.x));
  c += LAMP * bar * 0.85;

  vec3 toLamp = normalize(uLight - CASE_C);
  c += LAMP * 1.6 * pow(clamp(dot(d, toLamp), 0.0, 1.0), 90.0);
  return c;
}

vec3 shade(vec3 p, vec3 n, vec3 rd, float m){
  vec3 alb; float rough; float f0;
  if (m < 1.5)      { alb = vec3(0.105, 0.107, 0.115); rough = 0.26; f0 = 0.05; }  // floor
  else if (m < 2.5) { alb = vec3(0.115, 0.12,  0.13 ); rough = 0.90; f0 = 0.03; }  // walls
  else if (m < 3.5) { alb = vec3(0.15,  0.155, 0.16 ); rough = 0.70; f0 = 0.04; }  // plinth
  else if (m < 4.5) { alb = vec3(0.70,  0.69,  0.66 ); rough = 0.22; f0 = 0.09; }  // the object
  else              { alb = vec3(0.42,  0.44,  0.46 ); rough = 0.18; f0 = 0.16; }  // case frame

  vec3  lv  = uLight - p;
  float d2  = dot(lv, lv);
  float dl  = sqrt(d2);
  vec3  ld  = lv / dl;
  float att = 1.0 / max(d2, 0.25);
  float sh  = penumbra(p + n * 0.006, ld, 0.045, dl - 0.03);
  float occ = ao(p, n);

  vec3 col = alb * LAMP * (clamp(dot(n, ld), 0.0, 1.0) * sh * att * 4.0);
  col += satinSpec(n, rd, ld, LAMP, rough, f0) * sh * att * 12.0;

  col += alb * vec3(0.017, 0.019, 0.024) * occ;
  col += envSheen(n, rd, vec3(0.055, 0.058, 0.070), vec3(0.014, 0.014, 0.016), f0)
         * mix(0.20, 0.95, 1.0 - rough) * occ;
  return col;
}

vec3 traceScene(vec3 ro, vec3 rd){
  vec2 h = march(ro, rd);
  if (h.x > 36.0) return VOID;
  vec3 p = ro + rd * h.x;
  return shade(p, normal(p), rd, h.y);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float ar = uRes.x / uRes.y;
  bool wide = ar > 1.0;
  vec2 suv = uv - vec2(wide ? 0.27 : 0.0, wide ? 0.03 : 0.22);
  vec3 rd = camRay(uCam, uTarget, suv, wide ? 1.45 : 1.05);

  vec2 hit = march(uCam, rd);
  vec3 col = VOID;
  if (hit.x <= 36.0) {
    vec3 p = uCam + rd * hit.x;
    vec3 n = normal(p);
    col = shade(p, n, rd, hit.y);

    if (hit.y < 1.5) {   // the gallery floor, and only the floor, reflects
      vec3 ro = p + n * 0.02;
      vec3 rr = reflect(rd, n);
      vec2 h2 = march(ro, rr);
      vec3 q  = ro + rr * h2.x;
      vec3 rc = h2.x > 12.0 ? VOID : shade(q, normal(q), rr, h2.y);
      col += rc * fresnel(n, rd, 0.05) * exp(-h2.x * 0.26);
    }
  }

  vec3 gn;
  vec2 g = boxHit(uCam, rd, CASE_C, CASE_B, gn);
  if (g.x > 0.0 && g.x < hit.x) {
    vec3 pe = uCam + rd * g.x;

    // A vitrine is parallel panels, not a solid block, so the net bend is
    // small — an ior of 1.5 here would warp the object like a paperweight.
    vec3 refr = refract(rd, gn, 1.0 / 1.055);
    if (dot(refr, refr) < 0.0001) refr = reflect(rd, gn);

    vec3 inner = traceScene(pe + refr * 0.05, refr);
    inner *= mix(vec3(1.0), vec3(0.78, 0.93, 0.85), 0.45);   // float glass is green

    float F = fresnel(gn, rd, 0.045);
    col = mix(inner, envCol(reflect(rd, gn)), F);

    // Edge kick: light piping along the arrises is most of what makes a pane
    // read as glass rather than as a slightly hazy hole.
    vec3 d = CASE_B - abs(pe - CASE_C);
    vec3 tg = 1.0 - abs(gn);
    float ed = min(mix(9.0, d.x, tg.x), min(mix(9.0, d.y, tg.y), mix(9.0, d.z, tg.z)));
    col += LAMP * (1.0 - smoothstep(0.0, 0.05, ed)) * 0.30;

    // The lamp mirrored in the pane. At 4% reflectance a sheet of glass shows
    // almost nothing except the brightest thing in the room — so that is the
    // one thing worth drawing, and it is what says "there is a pane here".
    vec3 mirrored = reflect(rd, gn);
    col += LAMP * pow(clamp(dot(mirrored, normalize(uLight - pe)), 0.0, 1.0), 260.0) * 2.2;
  }

  col = gradeRT(col, 0.88, 1.16);
  col *= 1.0 - 0.13 * length(uv * vec2(0.72, 1.0));
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
  const s = useRef({
    ang: 0.22, vel: 0.0016, spin: 0.6,
    shape: null as number | null,
    drag: null as null | { x: number },
  })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      if (st.shape === null) st.shape = pickShape()

      if (!reduced) {
        st.ang += st.vel
        st.spin += 0.0014
      }
      st.vel += (0.0016 - st.vel) * 0.02   // drift back to a slow drift
      st.vel *= 0.97

      const r = 3.5
      const cx = Math.sin(st.ang) * r
      const cz = Math.cos(st.ang) * r
      return {
        uTime: t,
        uCam: [cx, 1.72, cz],
        uTarget: [0, 1.44, 0],
        uLight: [0.55, 2.75, 0.95],
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
        style={{ background: 'radial-gradient(34% 32% at 60% 44%, #3d4443 0%, #060708 74%)' }}
      />
    )
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
        s.current.vel += (e.clientX - d.x) * 0.00006
        d.x = e.clientX
      }}
      onPointerUp={() => { s.current.drag = null }}
      onPointerCancel={() => { s.current.drag = null }}
      aria-label="A glass display case on a plinth; drag to walk around it"
    />
  )
}
