/**
 * The shelf dressing: a small library of object SDFs and the cluster placer
 * that arranges them per bay.
 *
 * These are modelled on classic public-domain forms — a Greek amphora, an
 * apothecary bottle, a footed bowl, a Brown-Betty-ish teapot, book stacks,
 * archive boxes, a plate on a stand, a lidded urn, a classical bust, a mantel
 * clock, a candlestick, a globe, a specimen jar, an ammonite, a column drum, a
 * shipping crate and a tray of small finds — because those silhouettes read
 * instantly without a texture. They are modelled, not loaded: a raymarcher has
 * no meshes, so "use public domain objects" here means public-domain *shapes*
 * built from primitives.
 *
 * Cost is the constraint, not imagination. Every one of these is evaluated
 * inside map(), so each is held to a handful of primitives and none of them
 * loops. Anything needing a texture to be legible is not worth its distance
 * evaluation and has been left out.
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

/* Slatted shipping crate. Recessed panels inside raised corner battens, which
   is what makes a crate read as a crate — cutting grooves out of a solid box
   would have left a distance field the march can overstep. */
float oCrate(vec3 q){
  vec3 c = q - vec3(0.0, 0.105, 0.0);
  float panel  = sdBox(c, vec3(0.122, 0.095, 0.092));
  float batten = sdFrame(c, vec3(0.132, 0.105, 0.102), 0.014);
  return min(panel, batten);
}

/* Lidded urn on a stem foot, finial on top. */
float oUrn(vec3 q){
  float foot = sdCyl(q - vec3(0.0, 0.018, 0.0), 0.018, 0.058);
  float stem = sdCyl(q - vec3(0.0, 0.050, 0.0), 0.030, 0.028);
  float body = length((q - vec3(0.0, 0.170, 0.0)) * vec3(1.0, 0.85, 1.0)) - 0.105;
  float lid  = length((q - vec3(0.0, 0.255, 0.0)) * vec3(1.0, 1.60, 1.0)) - 0.085;
  float fin  = length(q - vec3(0.0, 0.315, 0.0)) - 0.022;
  return min(min(smin(body, stem, 0.04), foot), min(lid, fin));
}

/* Classical bust on a plinth. The shoulders are stretched in x rather than
   scaled up, so it reads as a torso cut off at the chest and not a snowman. */
float oBust(vec3 q){
  float plinth = sdBox(q - vec3(0.0, 0.035, 0.0), vec3(0.072, 0.035, 0.062)) - 0.006;
  float chest  = length((q - vec3(0.0, 0.130, 0.0)) * vec3(0.75, 1.0, 1.0)) - 0.085;
  float neck   = sdCyl(q - vec3(0.0, 0.190, 0.0), 0.030, 0.026);
  float head   = length((q - vec3(0.0, 0.245, 0.005)) * vec3(1.0, 0.82, 0.92)) - 0.055;
  return min(plinth, smin(smin(chest, neck, 0.03), head, 0.03));
}

/* Mantel clock: rounded case on a plinth, raised bezel where the dial goes. */
float oClock(vec3 q){
  vec3 c = q - vec3(0.0, 0.145, 0.0);
  float shell = sdBox(c, vec3(0.100, 0.115, 0.045)) - 0.022;
  float bezel = sdTorus((c - vec3(0.0, 0.020, 0.052)).xzy, vec2(0.062, 0.012));
  float feet  = sdBox(q - vec3(0.0, 0.014, 0.0), vec3(0.095, 0.014, 0.050));
  return min(min(shell, bezel), feet);
}

/* Candlestick with a spent candle in it. */
float oCandle(vec3 q){
  float base = sdCyl(q - vec3(0.0, 0.014, 0.0), 0.014, 0.062);
  float stem = sdCyl(q - vec3(0.0, 0.110, 0.0), 0.100, 0.015);
  float knop = length(q - vec3(0.0, 0.100, 0.0)) - 0.030;
  float pan  = sdCyl(q - vec3(0.0, 0.215, 0.0), 0.008, 0.045);
  float cup  = sdCyl(q - vec3(0.0, 0.235, 0.0), 0.022, 0.021);
  float wax  = sdCyl(q - vec3(0.0, 0.315, 0.0), 0.060, 0.016);
  return min(min(min(base, stem), min(knop, pan)), min(cup, wax));
}

/* Terrestrial globe in a tilted meridian ring. */
float oGlobe(vec3 q){
  float base = sdCyl(q - vec3(0.0, 0.016, 0.0), 0.016, 0.070);
  float post = sdCyl(q - vec3(0.0, 0.060, 0.0), 0.045, 0.012);
  vec3 c = q - vec3(0.0, 0.190, 0.0);
  float ball = length(c) - 0.098;
  vec3 r = c; r.xy = rot(0.35) * r.xy;
  float ring = sdTorus(r.zyx, vec2(0.118, 0.010));
  return min(min(base, post), min(ball, ring));
}

/* Specimen jar: straight sides, heavy rim, domed lid with a knob. */
float oJar(vec3 q){
  float body = sdCyl(q - vec3(0.0, 0.115, 0.0), 0.115, 0.082);
  float rim  = sdTorus(q - vec3(0.0, 0.232, 0.0), vec2(0.080, 0.011));
  float lid  = length((q - vec3(0.0, 0.238, 0.0)) * vec3(1.0, 1.5, 1.0)) - 0.078;
  float knob = length(q - vec3(0.0, 0.292, 0.0)) - 0.020;
  return min(min(body, rim), min(lid, knob));
}

/* Ammonite stood upright on a block. Nested rings rather than a true spiral —
   a real logarithmic coil costs a loop, and at this distance two tubes and a
   core read as the same thing. */
float oFossil(vec3 q){
  float stand = sdBox(q - vec3(0.0, 0.016, 0.0), vec3(0.070, 0.016, 0.045)) - 0.006;
  vec3 c = q - vec3(0.0, 0.135, 0.0);
  c.yz = rot(1.5708) * c.yz;
  float outer = sdTorus(c, vec2(0.078, 0.036));
  float inner = sdTorus(c, vec2(0.036, 0.026));
  float core  = length(c) - 0.022;
  return min(stand, min(min(outer, inner), core));
}

/* A column drum off a broken classical order: square base, shaft, collar,
   square capital. */
float oColumn(vec3 q){
  float base  = sdBox(q - vec3(0.0, 0.020, 0.0), vec3(0.068, 0.020, 0.068)) - 0.006;
  float shaft = sdCyl(q - vec3(0.0, 0.155, 0.0), 0.135, 0.050);
  float coll  = sdTorus(q - vec3(0.0, 0.283, 0.0), vec2(0.050, 0.010));
  float cap   = sdBox(q - vec3(0.0, 0.305, 0.0), vec3(0.066, 0.014, 0.066)) - 0.005;
  return min(min(base, shaft), min(coll, cap));
}

/* Tray of small finds. Almost everything else here stands up; the shelves need
   something that lies flat or every bay reads as the same row of silhouettes. */
float oTray(vec3 q){
  float pan = sdBox(q - vec3(0.0, 0.022, 0.0), vec3(0.135, 0.016, 0.095)) - 0.008;
  float rim = sdFrame(q - vec3(0.0, 0.032, 0.0), vec3(0.138, 0.020, 0.098), 0.009);
  float c1  = sdCyl(q - vec3(-0.060, 0.046, 0.020), 0.008, 0.026);
  float c2  = sdCyl(q - vec3(0.020, 0.042, -0.030), 0.004, 0.022);
  float c3  = sdCyl(q - vec3(0.070, 0.050, 0.030), 0.012, 0.024);
  return min(min(pan, rim), min(c1, min(c2, c3)));
}

/* Twenty-one forms and one dispatcher. 9 and 10 borrow the rangefinder and
   vase from CORE's shapeAt, re-based so they sit on the shelf rather than
   float. Split in two halves rather than one long chain: the compiler emits
   the comparisons in order, and a bay of tall pots should not have to test its
   way past the trays to find itself. */
float objectAt(vec3 q, float id){
  if (id < 10.5){
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
  if (id < 11.5)      return oCrate(q);
  else if (id < 12.5) return oUrn(q);
  else if (id < 13.5) return oBust(q);
  else if (id < 14.5) return oClock(q);
  else if (id < 15.5) return oCandle(q);
  else if (id < 16.5) return oGlobe(q);
  else if (id < 17.5) return oJar(q);
  else if (id < 18.5) return oFossil(q);
  else if (id < 19.5) return oColumn(q);
  return oTray(q);
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
    float id = floor(h1 * 20.999);
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
