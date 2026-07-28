'use client'

import { useCallback, useRef } from 'react'
import { CORE } from '../_gl/core'
import { SHAPE_COUNT } from '../_gl/shapes'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'

/** The dark store: racking, crates, one bulb on a flex. Geometry only. */
const FRAG = `${CORE}
vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);
  float room = -sdBox(p - vec3(0.0, 2.6, 0.0), vec3(6.0, 2.6, 9.0));
  if (room < res.x) res = vec2(room, 2.0);

  // racking down both sides
  vec3 r = p;
  r.x = abs(r.x) - 3.3;
  r.z = mod(p.z + 2.2, 4.4) - 2.2;
  vec3 up = r; up.z = abs(up.z) - 1.45;
  float uprights = sdBox(up, vec3(0.05, 2.2, 0.05));
  vec3 shv = r; shv.y = mod(p.y + 0.55, 1.45) - 0.725;
  float shelves = sdBox(shv, vec3(0.55, 0.028, 1.45));
  float rack = min(uprights, shelves);
  if (rack < res.x) res = vec2(rack, 3.0);

  // two crates stacked clear of the copy, with the object standing on top
  for (int i = 0; i < 2; i++){
    float crate = sdBox(p - vec3(1.05, 0.30 + float(i) * 0.60, 0.55), vec3(0.42, 0.30, 0.34)) - 0.012;
    if (crate < res.x) res = vec2(crate, 5.0);
  }
  // one more stack, well back — enough to say "store room", not enough to shout
  for (int i = 0; i < 2; i++){
    float crate = sdBox(p - vec3(-1.95, 0.30 + float(i) * 0.60, -2.4), vec3(0.42, 0.30, 0.34)) - 0.012;
    if (crate < res.x) res = vec2(crate, 5.0);
  }

  vec3 q = p - vec3(1.05, 1.38, 0.55);
  q.xz = rot(uP.z) * q.xz;
  float obj = shapeAt(q, uP.x);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 BULB = vec3(1.0, 0.91, 0.74);
vec3 DARK = vec3(0.005, 0.006, 0.006);

void mat(float m, out vec3 alb, out float rough, out float f0){
  if (m < 1.5)      { alb = vec3(0.14, 0.15, 0.14); rough = 0.30; f0 = 0.05; }  // polished screed
  else if (m < 2.5) { alb = vec3(0.20, 0.23, 0.20); rough = 0.85; f0 = 0.03; }  // block wall
  else if (m < 3.5) { alb = vec3(0.30, 0.33, 0.31); rough = 0.28; f0 = 0.10; }  // galvanised steel
  else if (m < 4.5) { alb = vec3(0.68, 0.67, 0.64); rough = 0.24; f0 = 0.09; }  // the object — satin
  else              { alb = vec3(0.33, 0.28, 0.21); rough = 0.70; f0 = 0.04; }  // plywood
}

/* The bulb drawn as something the ray can see, not a sprite pasted on at the
   end — so it turns up in the floor reflection too. */
vec3 bulbGlow(vec3 ro, vec3 rd, float tmax){
  vec3  toL   = uLight - ro;
  float along = clamp(dot(toL, rd), 0.0, 40.0);
  if (along >= tmax) return vec3(0.0);
  float d = length(toL - rd * along);
  // A tight filament and a small bloom. The wide halo this used to carry was
  // the last of the fog — a bare bulb does not veil half a room.
  return BULB * (2.8 * smoothstep(0.085, 0.0, d) + 0.16 * smoothstep(0.55, 0.0, d));
}

/* bounce = 1 on the second ray: no AO, a slightly cheaper shadow. Nobody can
   read contact occlusion in a reflection, and it halves the cost. */
vec3 shade(vec3 p, vec3 n, vec3 rd, float m, float bounce){
  vec3 alb; float rough; float f0;
  mat(m, alb, rough, f0);

  vec3  lv  = uLight - p;
  float d2  = dot(lv, lv);
  vec3  ld  = lv * inversesqrt(d2);
  float dif = clamp(dot(n, ld), 0.0, 1.0);

  // True inverse square. This is where the contrast comes from: the crates
  // under the bulb blaze, the back of the room falls off a cliff. A gentle
  // 1/(1+kd²) rolloff is what made the old render look painted.
  float att = 1.0 / max(d2, 0.10);
  float sh  = bounce > 0.5 ? penumbra(p + n * 0.006, ld, 0.10, 6.0)
                           : penumbra(p + n * 0.006, ld, 0.045, 9.0);
  float occ = bounce > 0.5 ? 1.0 : ao(p, n);

  // Key light: no AO here. Occlusion belongs to indirect light only.
  vec3 col = alb * BULB * (3.1 * dif * sh * att);
  col += satinSpec(n, rd, ld, BULB, rough, f0) * sh * att * 11.0;

  // Indirect: a tight cool rim, a sliver of bounce — both occluded. Kept
  // deliberately mean so shadow interiors stay properly black.
  vec3 rimDir = normalize(vec3(-1.4, 1.6, 2.6) - p);
  float rim = pow(clamp(dot(n, rimDir), 0.0, 1.0), 3.0);
  col += alb * vec3(0.30, 0.38, 0.50) * rim * occ * (m > 3.5 && m < 4.5 ? 0.85 : 0.16);
  col += alb * vec3(0.009, 0.011, 0.015) * occ;

  // Floor bounce. In a room lit by one bulb this is the only indirect path
  // that carries any energy: the hot pool of light under the bulb, thrown
  // back up. Without it the crate fronts go to absolute black and the
  // silhouette stops reading — which is a lighting failure, not contrast.
  float near = exp(-length(p.xz - uLight.xz) * 0.55) * exp(-max(p.y, 0.0) * 0.85);
  col += alb * BULB * (0.40 * near * clamp(0.55 - 0.55 * n.y, 0.0, 1.0)) * occ;

  col += envSheen(n, rd, vec3(0.07, 0.085, 0.115), vec3(0.020, 0.017, 0.013), f0)
         * mix(0.20, 0.85, 1.0 - rough) * occ;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  // Lens shift: the camera stays aimed at the object, but the frame is offset
  // so the object sits in the right-hand third and the copy gets clear space.
  // uv.x only spans ±0.5·aspect, so on a phone a fixed 0.34 pushes the object
  // clean off the side of the screen — hence the shift follows the aspect, and
  // on a narrow screen it goes up instead of across, above the copy.
  float ar = uRes.x / uRes.y;
  bool wide = ar > 1.0;
  vec2 suv = uv - vec2(wide ? clamp(ar * 0.22, 0.09, 0.34) : 0.05, wide ? 0.02 : 0.33);
  // Wider angle on a phone, or the object crops against the top of the frame.
  vec3 rd = camRay(uCam, uTarget, suv, wide ? 1.45 : 1.00);

  vec2 hit = march(uCam, rd);
  vec3 col = DARK;

  if (hit.x <= 36.0) {
    vec3 p = uCam + rd * hit.x;
    vec3 n = normal(p);
    col = shade(p, n, rd, hit.y, 0.0);

    // One real bounce, traced. Floor and object only — the block walls and the
    // ply are matt enough that a second ray would cost frames and show nothing.
    float gloss = hit.y < 1.5 ? 1.0 : (hit.y > 3.5 && hit.y < 4.5 ? 0.5 : 0.0);
    if (gloss > 0.0) {
      vec3 ro = p + n * 0.02;
      vec3 rr = reflect(rd, n);
      vec2 h2 = march(ro, rr);
      vec3 q  = ro + rr * h2.x;
      // Capped short: past this the marcher runs out of steps on a grazing ray
      // and an unconverged hit gives a garbage normal — visible as speckle.
      vec3 rc = h2.x > 13.0 ? DARK : shade(q, normal(q), rr, h2.y, 1.0);
      rc += bulbGlow(ro, rr, min(h2.x, 36.0));
      // Energy off with the length of the bounce — the stand-in for the blur a
      // real rough floor puts on anything more than a stride away.
      col += rc * gloss * fresnel(n, rd, 0.05) * exp(-h2.x * 0.30);
    }
  }

  col += bulbGlow(uCam, rd, hit.x);

  col = gradeRT(col, 1.05, 1.14);
  col *= 1.0 - 0.10 * length(uv * vec2(0.7, 1.0));
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
  const s = useRef({
    swing: 0.3, vel: 0, spin: 0,
    shape: null as number | null,
    drag: null as null | { x: number },
  })

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      // Picked once, on the client, in the render loop — a different object each
      // page load without risking a server/client mismatch.
      if (st.shape === null) st.shape = pickShape()

      if (!reduced) {
        st.vel += -st.swing * 0.0042
        st.vel *= 0.995
        st.swing += st.vel
        st.spin += 0.002
      }
      const a = st.swing
      return {
        uTime: t,
        uCam: [0.10, 1.52, 3.15],
        uTarget: [1.05, 1.34, 0.55],
        uLight: [1.05 + Math.sin(a) * 0.85, 2.25 - Math.abs(Math.sin(a)) * 0.15, 0.85 + Math.cos(a) * 0.2],
        uP: [st.shape, 0, st.spin, 0],
      }
    },
    [reduced]
  )

  const failed = useShader(canvasRef, FRAG, onFrame, 1.0)

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
      aria-label="A dark store room with racking and crates; drag to swing the light"
    />
  )
}
