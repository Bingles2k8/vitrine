/**
 * Geometry-only GLSL core for the museum scenes.
 *
 * Unlike PRELUDE in scene.ts (which also bakes in one opinionated spotlit
 * look), CORE stops at primitives and the marcher. Each variant supplies its
 * own `map()`, its own `shade()` and its own tone curve — so the rooms can
 * differ in architecture, lighting model, materials and grade, not just camera.
 */
export const CORE = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCam;
uniform vec3  uTarget;
uniform vec3  uLight;
uniform vec4  uP;
uniform vec4  uQ;

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float hash2(vec2 p){ return fract(sin(dot(p, vec2(41.7, 289.1))) * 43758.5453); }

float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdBox(vec3 p, vec3 b){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCyl(vec3 p, float h, float r){
  vec2 d = vec2(length(p.xz) - r, abs(p.y) - h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdTorus(vec3 p, vec2 t){
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdFrame(vec3 p, vec3 b, float t){
  vec3 q = abs(p);
  float x = sdBox(vec3(q.x, q.y - b.y, q.z - b.z), vec3(b.x, t, t));
  float y = sdBox(vec3(q.x - b.x, q.y, q.z - b.z), vec3(t, b.y, t));
  float z = sdBox(vec3(q.x - b.x, q.y - b.y, q.z), vec3(t, t, b.z));
  return min(x, min(y, z));
}

/* Four things off a shelf: rangefinder, vase, record, teacup. A wristwatch
   and a book were tried and dropped — neither read at this scale without a
   texture, and untextured they were just a ring and a slab.
   Only shapes I can model convincingly from primitives — nothing that needs a
   texture to be legible. */
float shapeAt(vec3 q, float id){
  if (id < 0.5) {
    float body = sdBox(q, vec3(0.20, 0.125, 0.075)) - 0.03;
    float lens = length((q - vec3(0.0, -0.01, 0.115)) * vec3(1.0, 1.0, 0.55)) - 0.075;
    float knob = length(q - vec3(0.13, 0.14, 0.0)) - 0.04;
    return min(body, min(lens, knob));
  } else if (id < 1.5) {
    float belly = length(q - vec3(0.0, -0.02, 0.0)) - 0.17;
    float neck  = sdCyl(q - vec3(0.0, 0.19, 0.0), 0.09, 0.055);
    float lip   = sdTorus(q - vec3(0.0, 0.27, 0.0), vec2(0.062, 0.016));
    float foot  = sdCyl(q - vec3(0.0, -0.19, 0.0), 0.015, 0.09);
    return min(smin(belly, neck, 0.06), min(lip, foot));
  } else if (id < 2.5) {
    vec3 r = q - vec3(0.0, 0.10, 0.0);
    r.yz = rot(1.5708) * r.yz;          // stood on edge
    r.xz = rot(0.42) * r.xz;            // turned off-square
    float disc = sdCyl(r, 0.007, 0.245);
    float hole = sdCyl(r, 0.03, 0.017);
    float foot = sdBox(q - vec3(0.0, -0.145, 0.0), vec3(0.075, 0.012, 0.055));
    return min(max(disc, -hole), foot);
  }
    float cup    = sdCyl(q - vec3(0.0, 0.02, 0.0), 0.095, 0.125);
    float hollow = sdCyl(q - vec3(0.0, 0.075, 0.0), 0.075, 0.105);
    cup = max(cup, -hollow);
    float handle = sdTorus((q - vec3(0.155, 0.02, 0.0)).yxz, vec2(0.058, 0.015));
    float saucer = sdCyl(q - vec3(0.0, -0.10, 0.0), 0.011, 0.205);
  return min(min(cup, handle), saucer);
}

vec2 map(vec3 p);

vec3 normal(vec3 p){
  vec2 e = vec2(0.0014, 0.0);
  return normalize(vec3(
    map(p + e.xyy).x - map(p - e.xyy).x,
    map(p + e.yxy).x - map(p - e.yxy).x,
    map(p + e.yyx).x - map(p - e.yyx).x
  ));
}

vec2 march(vec3 ro, vec3 rd){
  float t = 0.0;
  float m = 0.0;
  for (int i = 0; i < 90; i++){
    vec2 h = map(ro + rd * t);
    if (h.x < 0.0016 * t || t > 36.0) { m = h.y; break; }
    t += h.x * 0.86;
    m = h.y;
  }
  return vec2(t, m);
}

float softShadow(vec3 ro, vec3 rd, float sharp){
  float res = 1.0;
  float t = 0.03;
  for (int i = 0; i < 36; i++){
    float h = map(ro + rd * t).x;
    if (h < 0.0012) return 0.0;
    res = min(res, sharp * h / t);
    t += clamp(h, 0.012, 0.18);        // small steps: no banding, no mush
    if (t > 9.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res); // firm up the penumbra
}

/* Area-light shadow. Unlike softShadow's fixed sharpness, the penumbra here
   widens with the distance the shadow is thrown, because "size" is the angular
   radius of the source: crisp where an object meets the floor, soft ten feet
   away. That single behaviour is most of what reads as "ray traced" — a
   constant-width edge always looks like a shader trick.
   (The y/d correction is iq's: it measures the true closest approach of the
   ray to the occluder rather than the sample distance, which kills the banding
   you otherwise get on shallow contacts.) */
float penumbra(vec3 ro, vec3 rd, float size, float maxT){
  float res = 1.0;
  float t = 0.02;
  float ph = 1e10;
  for (int i = 0; i < 48; i++){
    float h = map(ro + rd * t).x;
    if (h < 0.0008) return 0.0;
    float y = h * h / (2.0 * ph);
    float d = sqrt(max(h * h - y * y, 0.0));
    res = min(res, d / (size * max(t - y, 0.001)));
    ph = h;
    t += clamp(h, 0.008, 0.22);
    if (t > maxT) break;
  }
  return clamp(res, 0.0, 1.0);
}

/* Contact occlusion. The radius is deliberately small (~0.12 units against
   objects ~0.25 across) so this reads as a tight seam where things meet,
   never as a broad grey halo across a flat surface. Apply it to ambient and
   indirect only — never to the key light, or the render looks dirty. */
float ao(vec3 p, vec3 n){
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++){
    float hr = 0.010 + 0.110 * float(i) / 4.0;
    float dd = map(p + n * hr).x;
    occ += (hr - dd) * sca;
    sca *= 0.75;
  }
  return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

/* Satin specular: a GGX lobe with a Schlick fresnel. Broad enough to travel
   across the form as it turns, which is what stops a surface reading as flat
   plastic — a single tight Phong dot never does that. */
vec3 satinSpec(vec3 n, vec3 rd, vec3 l, vec3 tint, float rough, float f0){
  vec3  h  = normalize(l - rd);
  float nh = clamp(dot(n, h), 0.0, 1.0);
  float nv = clamp(dot(n, -rd), 0.0, 1.0);
  float nl = clamp(dot(n, l), 0.0, 1.0);
  float a  = max(rough * rough, 0.002);
  float den = nh * nh * (a * a - 1.0) + 1.0;
  float d  = (a * a) / (3.14159265 * den * den);
  float f  = f0 + (1.0 - f0) * pow(1.0 - nv, 5.0);
  return tint * d * f * nl;
}

/* A two-tone environment sampled by the reflection vector. No extra marching —
   just enough sky-above / floor-below variation to read as a real material. */
vec3 envSheen(vec3 n, vec3 rd, vec3 skyCol, vec3 groundCol, float f0){
  vec3  r  = reflect(rd, n);
  float t  = clamp(r.y * 0.5 + 0.5, 0.0, 1.0);
  float nv = clamp(dot(n, -rd), 0.0, 1.0);
  float f  = f0 + (1.0 - f0) * pow(1.0 - nv, 5.0);
  return mix(groundCol, skyCol, smoothstep(0.0, 1.0, t)) * f;
}

vec3 camRay(vec3 ro, vec3 ta, vec2 uv, float fov){
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  return normalize(uv.x * rt + uv.y * up + fov * fw);
}

vec3 grain(vec3 col, float amt){
  return col + (hash(vec3(gl_FragCoord.xy, uTime)) - 0.5) * amt;
}

/* Filmic curve (ACES fit). Unlike x/(x+k) this keeps blacks genuinely black
   and rolls highlights off cleanly, instead of pushing everything to grey. */
vec3 filmic(vec3 x){
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 gradeClean(vec3 col, float exposure){
  return pow(filmic(col * exposure), vec3(0.4545));
}

/* As above, with an S-curve pivoted on mid grey. Applied after gamma so it
   moves perceived contrast rather than crushing linear values — shadows sit
   down, highlights hold, nothing clips to a flat black or white plate. */
vec3 gradeRT(vec3 col, float exposure, float contrast){
  vec3 c = pow(filmic(col * exposure), vec3(0.4545));
  return clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0);
}

/* Fresnel for a dielectric, by viewing angle. Grazing rays reflect almost
   everything — the reason a floor mirrors the room at a distance but barely
   at your feet. */
float fresnel(vec3 n, vec3 rd, float f0){
  return f0 + (1.0 - f0) * pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 5.0);
}
`
