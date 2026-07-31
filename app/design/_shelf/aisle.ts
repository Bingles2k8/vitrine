import { CORE } from '../_gl/core'

/**
 * The aisle scene, with every colour and light level pulled out as a parameter.
 * Geometry, camera and the scroll mechanic are identical across looks — only the
 * palette and the lighting move, which is the whole point of the exercise.
 *
 * All colours here are LINEAR, not sRGB. Divide an 8-bit channel by 255 and
 * raise it to 2.2 to convert (there is a helper for that below).
 */
export type Look = {
  /** Colour of the overhead lamps. */
  lamp: [number, number, number]
  /** The page background, as a hex string. The aisle fades into exactly this. */
  page: string
  floor: [number, number, number]
  rack: [number, number, number]
  object: [number, number, number]
  /** Flat ambient term, multiplied by albedo and occlusion. */
  ambient: [number, number, number]
  /** Two-tone environment the satin surfaces reflect. */
  sheenSky: [number, number, number]
  sheenGround: [number, number, number]
  floorRough: number
  rackRough: number
  objectRough: number
  key: number
  spec: number
  /** Angular size of a lamp — bigger is softer-edged shadows. */
  lampSize: number
  /**
   * An optional directional source on top of the lamps. Omit it and not a line
   * of it reaches the shader — the block is only emitted when a Look asks for
   * one, so the bands without sun pay nothing for it.
   */
  sun?: {
    /** Direction *toward* the source; normalised in the shader. */
    dir: [number, number, number]
    colour: [number, number, number]
    intensity: number
    spec: number
    /** Angular radius. Small is a hard edge — the sun is about 0.005. */
    size: number
  }
  /**
   * Distance the air stays completely clear for. Everything nearer than this
   * is rendered untouched.
   */
  fogStart: number
  /**
   * Density beyond fogStart, applied squared — so haze builds slowly at first
   * and then quickly, which is how depth actually reads. A plain exp(-d) starts
   * fogging at the camera's nose and greys the whole scene evenly.
   */
  fog: number
  exposure: number
  contrast: number
  vignette: number
  grain: number
}

const rgb255 = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const round5 = (v: number) => Math.round(v * 1e5) / 1e5

/** sRGB hex to the linear triplet lighting maths needs. */
export function linear(hex: string): [number, number, number] {
  return rgb255(hex).map(v => round5(Math.pow(v / 255, 2.2))) as [number, number, number]
}

/** sRGB hex to 0-1 display values, for anything applied after the tone curve. */
export function display(hex: string): [number, number, number] {
  return rgb255(hex).map(v => round5(v / 255)) as [number, number, number]
}

/**
 * GLSL ES 1.0 has no implicit int-to-float conversion, and JS prints 1.0 as
 * "1" — which turns vec3(1, 0.9, 0.7) into a compile error and drops the whole
 * scene to the CSS fallback. Every number that reaches the shader goes through
 * here.
 */
const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))
const v3 = (c: [number, number, number]) => `vec3(${f(c[0])}, ${f(c[1])}, ${f(c[2])})`

const FRAG_CACHE = new Map<Look, string>()

/**
 * Built once per Look and cached by object identity, because useShader keys its
 * GL program on the shader string — handing it a fresh string every render
 * would recompile the program on every frame.
 */
export function aisleFrag(look: Look): string {
  const cached = FRAG_CACHE.get(look)
  if (cached) return cached

  const sun = look.sun
  const sunBlock = sun
    ? `
  // A directional source with no falloff and a nearly point-sized penumbra:
  // parallel rays, so the uprights throw hard bars across the floor rather
  // than the soft pools the overhead lamps give. This is the whole difference
  // between "the lights are on" and "the sun is out".
  vec3  sdir = normalize(${v3(sun.dir)});
  float sndl = clamp(dot(n, sdir), 0.0, 1.0);
  float ssh  = 1.0;
  if (sndl > 0.001 && bounce < 0.5) ssh = penumbra(p + n * 0.006, sdir, ${f(sun.size)}, 14.0);
  col += alb * ${v3(sun.colour)} * (sndl * ssh * ${f(sun.intensity)});
  col += satinSpec(n, rd, sdir, ${v3(sun.colour)}, rough, f0) * ssh * ${f(sun.spec)};`
    : ''

  const frag = `${CORE}
float baseY(float id){
  if (id < 0.5) return 0.155;
  if (id < 1.5) return 0.205;
  if (id < 2.5) return 0.157;
  return 0.111;
}

const float BAY = 2.4;

vec2 map(vec3 p){
  vec2 res = vec2(p.y, 1.0);

  float bay = floor(p.z / BAY + 0.5);

  vec3 r = p;
  r.x = abs(r.x) - 2.35;
  r.z = p.z - bay * BAY;

  vec3 up = r; up.z = abs(up.z) - 1.16;
  float uprights = sdBox(up, vec3(0.055, 2.1, 0.055));
  vec3 shv = r; shv.y = mod(p.y + 0.55, 1.15) - 0.575;
  float shelves = sdBox(shv, vec3(0.62, 0.026, 1.16));
  float rack = min(uprights, shelves);
  if (rack < res.x) res = vec2(rack, 3.0);

  // One object per bay: which shape, which side, which shelf, all from the bay
  // index. Deterministic, so nothing shimmers as the camera travels.
  float h    = hash2(vec2(bay, 1.0));
  float id   = floor(hash2(vec2(bay, 7.0)) * 3.999);
  float side = h < 0.5 ? -1.0 : 1.0;
  float lvl  = (fract(h * 4.0) < 0.5 ? 1.201 : 2.351) + baseY(id);

  vec3 q = p - vec3(side * 2.35, lvl, bay * BAY);
  q.xz = rot(hash2(vec2(bay, 3.0)) * 6.2831) * q.xz;
  float obj = shapeAt(q, id);
  if (obj < res.x) res = vec2(obj, 4.0);
  return res;
}

vec3 LAMP = ${v3(look.lamp)};
/* The page background twice over: linear, for the reflection ray that leaves
   the scene, and display-space, for the haze applied after the tone curve.
   Fading after the curve is what makes the far end land on the page colour
   exactly — grade a colour and then match it by eye and you get a faintly
   visible rectangle where the canvas ends. */
vec3 FAR  = ${v3(linear(look.page))};
vec3 PAGE = ${v3(display(look.page))};

vec3 shade(vec3 p, vec3 n, vec3 rd, float m, float bounce){
  vec3 alb; float rough; float f0;
  if (m < 1.5)      { alb = ${v3(look.floor)};  rough = ${f(look.floorRough)};  f0 = 0.05; }
  else if (m < 3.5) { alb = ${v3(look.rack)};   rough = ${f(look.rackRough)};   f0 = 0.10; }
  else              { alb = ${v3(look.object)}; rough = ${f(look.objectRough)}; f0 = 0.09; }

  // Lamps every other bay, so the aisle runs pool, dark, pool, dark.
  vec3  lp  = vec3(0.0, 2.85, floor(p.z / (BAY * 2.0) + 0.5) * BAY * 2.0);
  vec3  lv  = lp - p;
  float d2  = dot(lv, lv);
  float dl  = sqrt(d2);
  vec3  ld  = lv / dl;
  float att = 1.0 / max(d2, 0.25);
  float ndl = clamp(dot(n, ld), 0.0, 1.0);

  // A surface facing away from the lamp is already black; marching a shadow ray
  // to prove it costs 48 map() calls for a result that gets multiplied by zero.
  // Roughly a third of the pixels in this scene fall into that case.
  float sh = 1.0;
  if (ndl > 0.001 && bounce < 0.5) sh = penumbra(p + n * 0.006, ld, ${f(look.lampSize)}, dl - 0.03);
  float occ = bounce > 0.5 ? 1.0 : ao(p, n);

  vec3 col = alb * LAMP * (ndl * sh * att * ${f(look.key)});
  col += satinSpec(n, rd, ld, LAMP, rough, f0) * sh * att * ${f(look.spec)};
${sunBlock}

  col += alb * ${v3(look.ambient)} * occ;
  col += envSheen(n, rd, ${v3(look.sheenSky)}, ${v3(look.sheenGround)}, f0)
         * mix(0.20, 0.85, 1.0 - rough) * occ;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float ar = uRes.x / uRes.y;
  bool wide = ar > 1.0;

  // On a phone the copy owns the bottom third, so the vanishing point is lifted
  // clear of it and the lens opened up to keep both walls of racking in frame.
  vec2 suv = wide ? uv : uv - vec2(0.0, 0.13);
  vec3 rd = camRay(uCam, uTarget, suv, wide ? 1.35 : 1.00);

  vec2 hit = march(uCam, rd);
  vec3 col = FAR;
  bool miss = hit.x > 36.0;

  if (!miss) {
    vec3 p = uCam + rd * hit.x;
    vec3 n = normal(p);
    col = shade(p, n, rd, hit.y, 0.0);

    // The floor bounce, but only where it is worth a second ray. Head-on, a
    // dielectric reflects about 4% and the result is invisible; at a grazing
    // angle it reflects most of what it sees. Gating on the Fresnel term skips
    // the trace for the near floor and keeps it down the aisle, where it is the
    // whole reason the floor reads as sealed concrete.
    float fr = hit.y < 1.5 ? fresnel(n, rd, 0.05) : 0.0;
    if (fr > 0.10) {
      vec3 ro = p + n * 0.02;
      vec3 rr = reflect(rd, n);
      vec2 h2 = march(ro, rr);
      vec3 q  = ro + rr * h2.x;
      vec3 rc = h2.x > 12.0 ? FAR : shade(q, normal(q), rr, h2.y, 1.0);
      col += rc * fr * exp(-h2.x * 0.30);
    }
  }

  col = gradeRT(col, ${f(look.exposure)}, ${f(look.contrast)});

  // The aisle runs out of light, not out of geometry. Nothing inside
  // fogStart is touched at all; past it the haze squares up and closes in
  // fast, so the near bays stay crisp and the far end still disappears into
  // exactly the page colour.
  float fd = max(hit.x - ${f(look.fogStart)}, 0.0) * ${f(look.fog)};
  col = mix(PAGE, col, miss ? 0.0 : exp(-fd * fd));
  col *= 1.0 - ${f(look.vignette)} * length(uv * vec2(0.72, 1.0));
  gl_FragColor = vec4(grain(col, ${f(look.grain)}), 1.0);
}
`
  FRAG_CACHE.set(look, frag)
  return frag
}
