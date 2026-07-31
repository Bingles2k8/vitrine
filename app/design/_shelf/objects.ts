/**
 * The shelf dressing: a small library of object SDFs and the cluster placer
 * that arranges them per bay.
 *
 * These are modelled on classic public-domain forms — a Greek amphora, an
 * apothecary bottle, a footed bowl, a Brown-Betty-ish teapot, book stacks,
 * archive boxes, a plate on a stand — because those silhouettes read instantly
 * without a texture. They are modelled, not loaded: a raymarcher has no meshes,
 * so "use public domain objects" here means public-domain *shapes* built from
 * primitives.
 *
 * Everything sits with its base at y = 0 so placement is just an offset to the
 * shelf top. Requires CORE (sdBox/sdCyl/sdTorus/smin/rot/hash2/shapeAt) to be
 * in the shader before it.
 */
export const OBJECTS = `
/* Greek amphora: egg body, narrow neck, flared lip, two vertical handles. */
float oAmphora(vec3 q){
  float belly = length((q - vec3(0.0, 0.165, 0.0)) * vec3(1.0, 0.80, 1.0)) - 0.115;
  float neck  = sdCyl(q - vec3(0.0, 0.30, 0.0), 0.05, 0.034);
  float lip   = sdTorus(q - vec3(0.0, 0.35, 0.0), vec2(0.046, 0.012));
  float foot  = sdCyl(q - vec3(0.0, 0.02, 0.0), 0.02, 0.048);
  float pot   = min(min(smin(belly, neck, 0.05), lip), foot);
  vec3 hc = vec3(q.x, q.y, abs(q.z)) - vec3(0.0, 0.26, 0.112);
  float handle = sdTorus(hc.zxy, vec2(0.05, 0.011));
  return min(pot, handle);
}

/* Round-bellied jug with one loop handle. */
float oJug(vec3 q){
  float body = length((q - vec3(0.0, 0.115, 0.0)) * vec3(1.0, 0.95, 1.0)) - 0.105;
  float neck = sdCyl(q - vec3(0.0, 0.225, 0.0), 0.035, 0.05);
  float jug  = smin(body, neck, 0.05);
  vec3 hc = q - vec3(0.0, 0.155, 0.105);
  return min(jug, sdTorus(hc.zxy, vec2(0.055, 0.011)));
}

/* Footed bowl: a hollow sphere cut at the rim. */
float oBowl(vec3 q){
  vec3 c = q - vec3(0.0, 0.13, 0.0);
  float shell = max(length(c) - 0.13, -(length(c - vec3(0.0, 0.015, 0.0)) - 0.117));
  return max(shell, c.y - 0.02);
}

/* Apothecary bottle: straight body, round shoulder, thin neck. */
float oBottle(vec3 q){
  float body     = sdCyl(q - vec3(0.0, 0.11, 0.0), 0.11, 0.055);
  float shoulder = length(q - vec3(0.0, 0.22, 0.0)) - 0.055;
  float neck     = sdCyl(q - vec3(0.0, 0.285, 0.0), 0.05, 0.017);
  return smin(min(body, shoulder), neck, 0.035);
}

/* Three books, stacked slightly askew. */
float oBooks(vec3 q){
  float b1 = sdBox(q - vec3(0.0, 0.022, 0.0), vec3(0.10, 0.020, 0.075)) - 0.004;
  vec3 q2 = q; q2.xz = rot(0.26) * q2.xz;
  float b2 = sdBox(q2 - vec3(0.010, 0.064, 0.0), vec3(0.092, 0.018, 0.070)) - 0.004;
  vec3 q3 = q; q3.xz = rot(-0.19) * q3.xz;
  float b3 = sdBox(q3 - vec3(-0.008, 0.102, 0.010), vec3(0.085, 0.016, 0.065)) - 0.004;
  return min(b1, min(b2, b3));
}

/* Archive box with an overhanging lid — the storeroom staple. */
float oArchive(vec3 q){
  float body = sdBox(q - vec3(0.0, 0.095, 0.0), vec3(0.13, 0.095, 0.10)) - 0.006;
  float lid  = sdBox(q - vec3(0.0, 0.185, 0.0), vec3(0.138, 0.016, 0.108)) - 0.006;
  return min(body, lid);
}

/* Picture frame leaning back a few degrees, recessed panel. */
float oFrame(vec3 q){
  vec3 r = q - vec3(0.0, 0.15, 0.0);
  r.xy = rot(0.10) * r.xy;
  float slab  = sdBox(r, vec3(0.012, 0.145, 0.115));
  float inset = sdBox(r - vec3(0.014, 0.0, 0.0), vec3(0.012, 0.112, 0.084));
  return max(slab, -inset);
}

/* Display plate stood upright on a small foot. */
float oPlate(vec3 q){
  vec3 r = q - vec3(0.0, 0.13, 0.0);
  r.xy = rot(1.5708) * r.xy;
  float disc = sdCyl(r, 0.011, 0.115);
  float foot = sdBox(q - vec3(0.0, 0.02, 0.0), vec3(0.045, 0.02, 0.06));
  return min(disc, foot);
}

/* Squat teapot: body, lid knob, angled spout, loop handle. */
float oTeapot(vec3 q){
  float body = length((q - vec3(0.0, 0.10, 0.0)) * vec3(1.0, 1.2, 1.0)) - 0.105;
  float knob = length(q - vec3(0.0, 0.205, 0.0)) - 0.022;
  vec3 s = q - vec3(0.0, 0.12, 0.10);
  s.zy = rot(-0.7) * s.zy;
  float spout = sdCyl(s, 0.05, 0.019);
  vec3 hc = q - vec3(0.0, 0.115, -0.105);
  float handle = sdTorus(hc.zxy, vec2(0.05, 0.011));
  return min(min(smin(body, spout, 0.02), knob), handle);
}

/* Ten forms and one dispatcher. 9 and 10 borrow the rangefinder and vase from
   CORE's shapeAt, re-based so they sit on the shelf rather than float. */
float objectAt(vec3 q, float id){
  if (id < 0.5)      return oAmphora(q);
  else if (id < 1.5) return oJug(q);
  else if (id < 2.5) return oBowl(q);
  else if (id < 3.5) return oBottle(q);
  else if (id < 4.5) return oBooks(q);
  else if (id < 5.5) return oArchive(q);
  else if (id < 6.5) return oFrame(q);
  else if (id < 7.5) return oPlate(q);
  else if (id < 8.5) return oTeapot(q);
  else if (id < 9.5) return shapeAt(q - vec3(0.0, 0.16, 0.0), 0.0);
  return shapeAt(q - vec3(0.0, 0.205, 0.0), 1.0);
}

/* One shelf's worth: one to three objects, chosen, spread, turned and scaled
   by the seed. Returns distance and a material in [4.0, 4.9); the fraction is
   a per-object albedo variance so a row of white ceramics is not one flat
   value. Two hashes per object — everything else is derived by fract-mixing,
   because this runs inside map() and hash2 is a sin(). */
vec2 clusterAt(vec3 q, float seed, float sx){
  vec2 best = vec2(1e9, 4.0);
  float n = 1.0 + floor(hash2(vec2(seed, 11.0)) * 2.999);
  for (int i = 0; i < 3; i++){
    if (float(i) >= n) break;
    float fi = float(i);
    float h1 = hash2(vec2(seed, 21.0 + fi));
    float h2 = hash2(vec2(seed, 61.0 + fi));
    float id = floor(h1 * 10.999);
    // Biased toward the wall side of the shelf. Objects parked on the aisle
    // lip end up inches from the lens as the camera passes, where the wide
    // FOV smears them across the frame edge as huge cropped blobs.
    vec3 c = q - vec3(
      sx * mix(-0.06, 0.20, h2),
      0.0,
      (fi - (n - 1.0) * 0.5) * 0.55 + (fract(h2 * 7.31) - 0.5) * 0.18
    );
    c.xz = rot(fract(h1 * 13.7) * 6.2831) * c.xz;
    float sc = mix(0.78, 1.05, fract(h2 * 3.17));
    float d = objectAt(c / sc, id) * sc;
    if (d < best.x) best = vec2(d, 4.0 + 0.9 * fract(h1 * 5.13));
  }
  return best;
}
`
