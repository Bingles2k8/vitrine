/**
 * Shared GLSL for the raymarched gallery variants (v21–v25).
 *
 * PRELUDE declares the uniforms, SDF primitives, the collection objects and the
 * lighting/render pipeline. Each variant appends its own `map()` — the scene
 * layout — and a `main()` that positions the camera. `map` is forward-declared
 * so the shared marcher can call it before the variant defines it.
 */
export const PRELUDE = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;
uniform vec3  uCam;
uniform vec3  uTarget;
uniform vec3  uLight;
uniform vec4  uP;      // per-variant parameters
uniform vec4  uQ;      // per-variant parameters

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }

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

/* Four things off a shelf: a rangefinder, a vase, a wristwatch, a record. */
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
    float caseB = sdCyl(q, 0.035, 0.13);
    float bezel = sdTorus(q - vec3(0.0, 0.036, 0.0), vec2(0.125, 0.014));
    float strap = sdBox(q - vec3(0.0, 0.0, 0.0), vec3(0.055, 0.30, 0.018)) - 0.012;
    float crown = sdCyl((q - vec3(0.145, 0.0, 0.0)).yxz, 0.022, 0.022);
    return min(min(caseB, bezel), min(strap, crown));
  }
  float disc  = sdCyl(q, 0.006, 0.245);
  float hole  = sdCyl(q, 0.02, 0.018);
  return max(disc, -hole);
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
  for (int i = 0; i < 92; i++){
    vec2 h = map(ro + rd * t);
    if (h.x < 0.0016 * t || t > 34.0) { m = h.y; break; }
    t += h.x * 0.86;
    m = h.y;
  }
  return vec2(t, m);
}

float shadow(vec3 ro, vec3 rd){
  float res = 1.0;
  float t = 0.06;
  for (int i = 0; i < 30; i++){
    float h = map(ro + rd * t).x;
    if (h < 0.0018) return 0.0;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.02, 0.36);
    if (t > 9.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

/* uQ.x widens the beam, uQ.y scales its brightness, uQ.z tints it cool→warm. */
vec3 beamColour(){
  return mix(vec3(0.78, 0.86, 1.0), vec3(1.0, 0.84, 0.62), clamp(uQ.z, 0.0, 1.0));
}

float coneAt(vec3 p, vec3 lp, float tight){
  vec3 ld   = normalize(lp - p);
  vec3 sdir = normalize(uTarget - lp);
  float edge = mix(0.80, 0.94, clamp(tight, 0.0, 1.0)) - uQ.x * 0.12;
  float c = clamp((dot(-ld, sdir) - edge) / 0.16, 0.0, 1.0);
  return pow(c, mix(1.6, 4.0, clamp(tight, 0.0, 1.0)));
}

vec3 shade(vec3 p, vec3 rd, float m, vec3 lp){
  vec3 n  = normal(p);
  vec3 ld = normalize(lp - p);

  vec3 albedo = vec3(0.06);
  float spec  = 0.05;
  if (m < 1.5)      { albedo = vec3(0.045, 0.043, 0.040); spec = 0.35; }  // floor
  else if (m < 2.5) { albedo = vec3(0.072, 0.068, 0.062); spec = 0.02; }  // walls
  else if (m < 3.5) { albedo = vec3(0.105, 0.098, 0.088); spec = 0.05; }  // plinth
  else if (m < 4.5) { albedo = vec3(0.62, 0.60, 0.57);    spec = 0.75; }  // object
  else              { albedo = vec3(0.78, 0.56, 0.24);    spec = 0.90; }  // brass

  float dif   = clamp(dot(n, ld), 0.0, 1.0);
  float sh    = shadow(p + n * 0.006, ld);
  float cone  = coneAt(p, lp, 0.0);
  float atten = 1.0 / (1.0 + 0.10 * dot(lp - p, lp - p));
  vec3  warm  = beamColour();
  float gain  = 6.2 * max(uQ.y, 0.0);

  vec3 col = albedo * (0.018 + gain * dif * sh * cone * atten) * warm;
  vec3 h   = normalize(ld - rd);
  col += warm * spec * pow(clamp(dot(n, h), 0.0, 1.0), 52.0) * sh * cone * 2.0 * max(uQ.y, 0.0);
  col += albedo * vec3(0.075, 0.085, 0.115) * (0.30 + 0.55 * clamp(n.y, 0.0, 1.0));
  return col;
}

vec3 render(vec3 ro, vec3 rd, vec2 uv){
  vec3 lp  = uLight;
  vec2 hit = march(ro, rd);
  float t  = hit.x;

  vec3 col;
  if (t > 34.0) {
    col = vec3(0.011, 0.012, 0.015);
  } else {
    vec3 p = ro + rd * t;
    col = shade(p, rd, hit.y, lp);
    if (hit.y < 1.5) {                       // floor reflection
      vec3 n  = normal(p);
      vec3 r  = reflect(rd, n);
      vec2 h2 = march(p + n * 0.02, r);
      vec3 rc = h2.x > 34.0 ? vec3(0.011, 0.012, 0.015) : shade(p + n * 0.02 + r * h2.x, r, h2.y, lp);
      col = mix(col, rc, 0.46);
    }
  }

  float maxT = min(t, 13.0);
  for (int i = 0; i < 24; i++){
    float fi = float(i);
    float st = (fi + hash(vec3(gl_FragCoord.xy, fi))) / 24.0 * maxT;
    vec3  sp = ro + rd * st;
    float c  = coneAt(sp, lp, 1.0);
    float at = 1.0 / (1.0 + 0.20 * dot(lp - sp, lp - sp));
    float dust = 0.8 + 1.6 * step(0.9982, hash(floor(sp * 46.0)));
    col += beamColour() * c * at * dust * 0.018 * max(uQ.y, 0.0);
  }

  col *= 1.0 - 0.42 * length(uv * vec2(0.72, 1.0));
  col  = col / (col + 0.85);
  col  = pow(col, vec3(0.4545));
  col += (hash(vec3(gl_FragCoord.xy, uTime)) - 0.5) * 0.022;
  return col;
}

vec3 camRay(vec3 ro, vec3 ta, vec2 uv, float fov){
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  return normalize(uv.x * rt + uv.y * up + fov * fw);
}
`
