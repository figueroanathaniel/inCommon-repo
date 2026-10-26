/* body-globes.js: EVERY BODY, SEEN UP CLOSE.

   The owner, 19 October 2026: "Generate appropriate images for each astral
   body as they are encroached upon." From across the chart a body is the
   small lit orb it has always been. As the reader closes on it, this file
   puts the body itself in its place: a globe whose surface is generated on
   the graphics card, every pixel, from noise, so it holds its detail however
   near the reader comes and costs nothing to download.

   WHAT EACH ONE IS, AND WHY. The images are the bodies' own, not the app's
   palette: Mars is rust, Neptune is blue, and a theme does not repaint a
   planet. They are drawn from what is known of each, not invented:
     the Sun        granulation, sunspots, limb darkening and a corona;
     the Moon       maria and craters;     Mercury  cratered and grey;
     Venus          sulphur cloud in long swirls;   Mars rust, dark albedo and polar caps;
     Jupiter        belts, zones and the Great Red Spot;
     Saturn         pale belts and the ring system with the Cassini Division;
     Uranus         a cyan haze, tipped on its side, with narrow rings;
     Neptune        deep blue bands and a dark spot;
     Pluto          tan and cream with its bright heart;
     Ceres          its bright spot; Vesta its great basin; Psyche metal;
     Haumea         stretched long, ringed; Chariklo and Chiron ringed;
     Arrokoth       two lobes touching; Eros and Varuna elongated;
     the comets     a dark nucleus, a coma and two tails pointing from the Sun;
     everything else a rock or an ice of its own colour and seed.
   The points that are not bodies (the nodes, Lilith, Selena, the Vertex, the
   Parts, the Aries Point, the midpoint and the Hamburg hypotheticals) are not
   drawn as worlds, because they are not worlds: each is a lattice of light, a
   calculated place, and Lilith is a dark one, a rim round nothing. None of
   them is solid, so none can stand in front of a world and hide it. Their pages already say they
   are not bodies, and their image says it too.

   LIGHT COMES FROM THE SUN IN THE CHART. Every globe is lit from wherever the
   chart's own Sun stands, so a terminator crosses each world and a ring takes
   its planet's shadow.

   It reads three.js from the scene that calls it (create(T)), and computes no
   position: the scene places each globe on its orb. */
(function (root) {
  'use strict';

  /* ---- Noise: 3D simplex (Ashima Arts, MIT) and a cellular field ---------- */
  var NOISE = [
    'vec3 m289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 m289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 perm(vec4 x){ return m289(((x * 34.0) + 1.0) * x); }',
    'vec4 tis(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }',
    'float snoise(vec3 v){',
    ' const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);',
    ' vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);',
    ' vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);',
    ' vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;',
    ' i = m289(i);',
    ' vec4 p = perm(perm(perm(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));',
    ' float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;',
    ' vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);',
    ' vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);',
    ' vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw); vec4 s0 = floor(b0) * 2.0 + 1.0; vec4 s1 = floor(b1) * 2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));',
    ' vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;',
    ' vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);',
    ' vec4 norm = tis(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3))); p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;',
    ' vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;',
    ' return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3))); }',
    'float fbm(vec3 p, int oct, float det){ float a = 0.5, s = 0.0; for (int i = 0; i < 7; i++) { if (i >= oct) break; float w = i < 3 ? 1.0 : det; s += a * snoise(p) * w; p = p * 2.03 + vec3(17.1, 9.2, 4.3); a *= 0.5; } return s; }',
    'vec3 hash3(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }',
    /* the distance to the nearest cell point, and that point's own random value */
    'vec2 cells(vec3 p){ vec3 b = floor(p); vec3 f = fract(p); float d = 8.0; float id = 0.0;',
    ' for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {',
    '  vec3 g = vec3(float(x), float(y), float(z)); vec3 o = hash3(b + g); vec3 r = g + o - f; float dd = dot(r, r);',
    '  if (dd < d) { d = dd; id = o.x; } }',
    ' return vec2(sqrt(d), id); }',
    /* a crater from a cell: a bowl darkened inside, a raised rim lit on one
       side. Small enough that it has faded to nothing before the edge of its
       cell, or the cell boundary would show as a seam. */
    'float crater(vec3 p, float scale, float amt){ vec2 c = cells(p * scale); float rad = 0.1 + 0.2 * c.y; float r = c.x / rad; float on = smoothstep(0.42, 0.5, c.y);',
    ' float bowl = (1.0 - smoothstep(0.0, 0.9, r)) * 0.7; float rim = exp(-pow((r - 1.0) * 5.0, 2.0)) * (1.0 - smoothstep(1.2, 1.6, r)); return (rim * 0.32 - bowl * 0.42) * on * amt; }'
  ].join('\n');

  var V_GLOBE = [
    'uniform float uLump; uniform float uSeed;',
    'varying vec3 vP; varying vec3 vW; varying vec3 vNw;',
    NOISE,
    'void main(){ vec3 p = position;',
    ' if (uLump > 0.0) { float l = snoise(p * 1.3 + uSeed) * 0.6 + snoise(p * 2.7 - uSeed) * 0.3; p *= 1.0 + uLump * l; }',
    ' vP = position; vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vNw = normalize(mat3(modelMatrix) * normal);',
    ' gl_Position = projectionMatrix * viewMatrix * w; }'].join('\n');

  /* kinds: 0 rock, 1 gas, 2 star, 4 cloud, 5 ice */
  var F_GLOBE = [
    'uniform float uKind; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uAtm; uniform float uAtmK;',
    'uniform float uSeed; uniform float uBands; uniform float uCap; uniform float uMaria; uniform float uCrater; uniform float uLump;',
    'uniform float uTurb; uniform vec4 uSpot; uniform vec3 uSpotC; uniform float uTime; uniform float uOp; uniform float uDetail; uniform vec3 uSun; uniform vec3 uCamW;',
    'varying vec3 vP; varying vec3 vW; varying vec3 vNw;',
    NOISE,
    'void main(){',
    ' vec3 p = normalize(vP); vec3 V = normalize(uCamW - vW);',
    ' vec3 n = uLump > 0.0 ? normalize(cross(dFdx(vW), dFdy(vW))) : normalize(vNw);',
    ' if (dot(n, V) < 0.0 && uLump > 0.0) n = -n;',
    ' vec3 L = normalize(uSun - vW); float lat = p.y; vec3 s = p * 1.0 + vec3(uSeed);',
    ' vec3 col; float self = 0.0; float bump = 0.0;',
    ' if (uKind < 0.5) {',
    /* rock: two albedo scales, maria, two sizes of crater, and caps */
    '  float h = fbm(s * 2.2, 6, uDetail);',
    '  col = mix(uC1, uC2, smoothstep(-0.45, 0.55, h));',
    '  float mar = smoothstep(0.08, 0.42, fbm(s * 1.1 + 3.7, 4, 1.0)); col = mix(col, uC3, mar * uMaria);',
    '  bump = crater(s, 3.2, uCrater) + crater(s + 11.0, 7.5, uCrater * 0.7) + crater(s - 5.0, 16.0, uCrater * 0.45 * uDetail);',
    '  col *= 1.0 + bump * 0.9;',
    '  float cap = smoothstep(0.9 - 0.05 * h, 0.95, abs(lat)); col = mix(col, vec3(0.93, 0.94, 0.96), cap * uCap);',
    ' } else if (uKind < 1.5) {',
    /* gas: zonal bands warped by turbulence, fine streaks, and a storm */
    /* belts and zones: noise stretched along the lines of latitude, so the
       turbulence runs with the bands and frays their edges, as the jets do */
    '  float w = fbm(vec3(p.x * 3.2, p.y * 16.0, p.z * 3.2) + uSeed + vec3(uTime * 0.012, 0.0, 0.0), 5, uDetail);',
    '  float w2 = fbm(vec3(p.x * 7.0, p.y * 40.0, p.z * 7.0) - uSeed, 3, uDetail);',
    '  float y = lat + w * 0.045 * uTurb + w2 * 0.012 * uTurb;',
    '  float b = sin(y * uBands + uSeed * 3.0); float b2 = sin(y * uBands * 2.3 + 1.7); float b3 = sin(y * uBands * 5.1 + 0.4);',
    '  col = mix(uC1, uC2, smoothstep(-0.35, 0.45, b)); col = mix(col, uC3, smoothstep(0.4, 1.0, b2) * 0.4); col *= 0.94 + 0.08 * b3;',
    '  col *= 0.93 + 0.14 * w2;',
    '  if (uSpot.w > 0.0) { vec3 sc = normalize(vec3(cos(uSpot.y) * cos(uSpot.x), sin(uSpot.x), sin(uSpot.y) * cos(uSpot.x)));',
    '   float sd = distance(p, sc) / uSpot.z; float sw = snoise(p * 9.0 + uSeed) * 0.15;',
    '   float k = (1.0 - smoothstep(0.55 + sw, 1.0 + sw, sd)); col = mix(col, uSpotC, k * uSpot.w); col = mix(col, uC1, exp(-pow((sd - 1.0) * 5.0, 2.0)) * 0.35 * uSpot.w); }',
    '  col *= 0.75 + 0.25 * pow(max(dot(n, V), 0.0), 0.5);',
    ' } else if (uKind < 2.5) {',
    /* the Sun: granulation moving, faculae, a few spots, limb darkening */
    '  vec2 g = cells(p * 26.0 + vec3(0.0, uTime * 0.02, 0.0)); float gran = smoothstep(0.0, 0.75, g.x);',
    '  float big = fbm(p * 3.0 + uTime * 0.01, 4, 1.0);',
    '  col = mix(uC1, uC2, gran * 0.55 + big * 0.25);',
    '  float spots = smoothstep(0.62, 0.72, fbm(p * 4.0 + uSeed, 3, 1.0)) * smoothstep(0.55, 0.15, abs(lat));',
    '  col = mix(col, uC3, spots * 0.85);',
    '  float mu = max(dot(n, V), 0.0); col *= 0.38 + 0.62 * pow(mu, 0.45); self = 1.0;',
    ' } else if (uKind < 4.5) {',
    /* cloud: long warped swirls */
    '  vec3 q = vec3(fbm(s * 1.5, 4, 1.0), fbm(s * 1.5 + 5.2, 4, 1.0), 0.0);',
    '  float c = fbm(vec3(p.x * 1.6, p.y * 4.0, p.z * 1.6) + q * 2.2 + uTime * 0.004, 6, uDetail);',
    '  col = mix(uC2, uC1, smoothstep(-0.5, 0.6, c)); col = mix(col, uC3, smoothstep(0.35, 0.8, abs(lat)) * 0.3);',
    ' } else {',
    /* ice: bright plains, darker reddish ground, a bright region, small craters */
    '  float h = fbm(s * 1.8, 6, uDetail);',
    '  col = mix(uC3, uC1, smoothstep(-0.55, 0.35, h)); col = mix(col, uC2, smoothstep(0.2, 0.7, fbm(s * 3.1 + 2.0, 4, uDetail)) * 0.6);',
    '  if (uSpot.w > 0.0) { vec3 sc = normalize(vec3(cos(uSpot.y) * cos(uSpot.x), sin(uSpot.x), sin(uSpot.y) * cos(uSpot.x)));',
    '   float sd = distance(p, sc) / uSpot.z + snoise(p * 5.0 + uSeed) * 0.18; col = mix(col, uSpotC, (1.0 - smoothstep(0.75, 1.0, sd)) * uSpot.w); }',
    '  bump = crater(s, 5.0, uCrater) + crater(s + 7.0, 12.0, uCrater * 0.5 * uDetail); col *= 1.0 + bump * 0.7;',
    ' }',
    /* lighting: a soft terminator, a faint night side, and an atmosphere at the limb */
    ' float d = dot(n, L); float lit = smoothstep(-0.12, 0.3, d) * (0.35 + 0.65 * max(d, 0.0));',
    ' vec3 c = self > 0.5 ? col * 1.55 : col * (0.025 + 1.15 * lit);',
    ' float fr = pow(1.0 - max(dot(n, V), 0.0), 3.0);',
    ' c += uAtm * fr * uAtmK * (self > 0.5 ? 1.2 : 0.18 + 1.0 * smoothstep(-0.35, 0.5, d));',
    ' gl_FragColor = vec4(c * uOp, uOp); }'].join('\n');

  /* An atmosphere shell, seen from outside, brightest on the lit limb. */
  var V_SHELL = 'varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }';
  var F_SHELL = [
    'uniform vec3 uC; uniform float uK; uniform float uOp; uniform vec3 uSun; uniform vec3 uCamW; uniform float uSelf; varying vec3 vW; varying vec3 vN;',
    'void main(){ vec3 n = normalize(vN); vec3 V = normalize(uCamW - vW); float f = 1.0 - abs(dot(n, V)); float a = pow(f, 2.4) * smoothstep(1.0, 0.82, f);',
    ' float l = uSelf > 0.5 ? 1.0 : smoothstep(-0.4, 0.6, dot(n, normalize(uSun - vW)));',
    ' gl_FragColor = vec4(uC * a * uK * l * uOp, 1.0); }'].join('\n');

  /* Rings: bands from radius, a gap where the body has one, lit from the Sun,
     dark where the planet stands between them and it. */
  var V_RING = 'varying vec3 vL; varying vec3 vW; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
  var F_RING = [
    'uniform vec3 uC1; uniform vec3 uC2; uniform float uIn; uniform float uOut; uniform float uGap; uniform float uSeed; uniform float uOp; uniform float uDens;',
    'uniform vec3 uSun; uniform vec3 uCen; uniform float uR; uniform vec3 uN; varying vec3 vL; varying vec3 vW;',
    'float h1(float x){ return fract(sin(x * 91.3 + uSeed) * 43758.5453); }',
    'float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }',
    'void main(){ float r = length(vL.xy); float t = (r - uIn) / (uOut - uIn); if (t < 0.0 || t > 1.0) discard;',
    ' float d = 0.45 + 0.35 * n1(t * 38.0) + 0.2 * n1(t * 140.0); d *= smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.9, t);',
    ' if (uGap > 0.0) d *= 1.0 - (1.0 - smoothstep(0.0, 0.025, abs(t - uGap))) * 0.92;',
    ' vec3 L = normalize(uSun - vW); vec3 oc = uCen - vW; float along = dot(oc, L); float miss = length(oc - L * along);',
    ' float shadow = along > 0.0 ? smoothstep(uR * 0.92, uR * 1.02, miss) : 1.0;',
    ' float lit = (0.3 + 0.7 * abs(dot(normalize(uN), L))) * (0.15 + 0.85 * shadow);',
    ' vec3 c = mix(uC2, uC1, n1(t * 21.0 + 3.0)) * lit; float a = d * uDens * uOp;',
    ' gl_FragColor = vec4(c * a, a); }'].join('\n');

  /* The points that are not worlds: a lattice of light, and Lilith dark. */
  var F_SIGIL = [
    'uniform vec3 uC; uniform float uOp; uniform float uDark; uniform float uDash; uniform float uTime; uniform vec3 uCamW; varying vec3 vP; varying vec3 vW; varying vec3 vNw;',
    'void main(){ vec3 p = normalize(vP); vec3 n = normalize(vNw); vec3 V = normalize(uCamW - vW);',
    ' float lat = asin(clamp(p.y, -1.0, 1.0)); float lon = atan(p.z, p.x);',
    ' float gl = abs(fract(lat / 0.2618 + 0.5) - 0.5) * 0.2618; float go = abs(fract(lon / 0.2618 + 0.5) - 0.5) * 0.2618 * cos(lat);',
    ' float w = fwidth(lat) * 1.4 + 0.004; float line = max(1.0 - smoothstep(0.0, w, gl), 1.0 - smoothstep(0.0, w, go));',
    ' if (uDash > 0.5) line *= step(0.5, fract((lon + lat) * 6.0 + uTime * 0.1));',
    ' float eq = 1.0 - smoothstep(0.0, w * 1.6, abs(lat)); float f = pow(1.0 - max(dot(n, V), 0.0), 2.0);',
    ' float pulse = 0.75 + 0.25 * sin(uTime * 1.3);',
    ' vec3 c = uC * (line * 0.55 + eq * 0.8 + f * 0.9) * pulse;',
    ' if (uDark > 0.5) { c = uC * f * 1.4 + uC * eq * 0.4; }',
    ' gl_FragColor = vec4(c * uOp, 1.0); }'].join('\n');

  var F_TAIL = [
    'uniform vec3 uC; uniform float uOp; uniform float uTime; varying vec2 vUv;',
    'void main(){ float x = (vUv.x - 0.5) * 2.0; float v = vUv.y; float wdt = 0.25 + v * 0.75; float a = exp(-x * x / (wdt * wdt) * 3.0) * pow(1.0 - v, 1.4) * smoothstep(0.0, 0.05, v);',
    ' a *= 0.8 + 0.2 * sin(v * 30.0 - uTime * 2.0 + x * 4.0); gl_FragColor = vec4(uC * a * uOp, 1.0); }'].join('\n');

  /* ---- What each body is ---------------------------------------------------- */
  function rgb(r, g, b) { return [r, g, b]; }
  var ROCK = 0, GAS = 1, STAR = 2, CLOUD = 4, ICE = 5, SIGIL = 6, COMET = 7;
  var D = { kind: ROCK, c1: rgb(0.34, 0.32, 0.3), c2: rgb(0.6, 0.57, 0.53), c3: rgb(0.27, 0.26, 0.25), maria: 0.2, crater: 1, cap: 0, lump: 0, atm: null, atmK: 0, bands: 12, spot: null, tilt: 0, spin: 0.08 };
  function spec(o) { var s = {}; for (var k in D) s[k] = D[k]; for (var j in o) s[j] = o[j]; return s; }
  var BY = {
    sun: spec({ kind: STAR, c1: rgb(1.0, 0.93, 0.72), c2: rgb(1.0, 0.58, 0.2), c3: rgb(0.42, 0.16, 0.05), atm: rgb(1.0, 0.72, 0.36), atmK: 1.3, corona: true, spin: 0.04 }),
    moon: spec({ c1: rgb(0.42, 0.41, 0.4), c2: rgb(0.74, 0.72, 0.69), c3: rgb(0.2, 0.2, 0.21), maria: 0.85, crater: 1.1, spin: 0.03 }),
    mercury: spec({ c1: rgb(0.36, 0.33, 0.3), c2: rgb(0.64, 0.59, 0.53), c3: rgb(0.3, 0.27, 0.25), maria: 0.25, crater: 1.3, spin: 0.02 }),
    venus: spec({ kind: CLOUD, c1: rgb(0.96, 0.88, 0.64), c2: rgb(0.8, 0.63, 0.36), c3: rgb(0.9, 0.82, 0.62), atm: rgb(1.0, 0.9, 0.62), atmK: 0.9, tilt: 177, spin: -0.02 }),
    mars: spec({ c1: rgb(0.56, 0.24, 0.12), c2: rgb(0.83, 0.47, 0.26), c3: rgb(0.3, 0.15, 0.09), maria: 0.65, crater: 0.45, cap: 0.95, atm: rgb(0.95, 0.62, 0.42), atmK: 0.35, tilt: 25, spin: 0.12 }),
    jupiter: spec({ kind: GAS, c1: rgb(0.9, 0.84, 0.71), c2: rgb(0.66, 0.47, 0.31), c3: rgb(0.55, 0.38, 0.27), bands: 19, turb: 1, spot: [-0.38, 1.2, 0.2, 1], spotC: rgb(0.78, 0.36, 0.22), atm: rgb(0.95, 0.85, 0.7), atmK: 0.4, tilt: 3, spin: 0.25 }),
    saturn: spec({ kind: GAS, c1: rgb(0.93, 0.86, 0.66), c2: rgb(0.79, 0.67, 0.45), c3: rgb(0.86, 0.79, 0.6), bands: 26, turb: 0.3, atm: rgb(0.98, 0.9, 0.7), atmK: 0.35, tilt: 26.7, spin: 0.22,
      rings: { inner: 1.24, outer: 2.32, gap: 0.62, c1: rgb(0.92, 0.85, 0.7), c2: rgb(0.62, 0.55, 0.45), dens: 0.95 } }),
    uranus: spec({ kind: GAS, c1: rgb(0.66, 0.88, 0.9), c2: rgb(0.55, 0.8, 0.84), c3: rgb(0.74, 0.92, 0.93), bands: 7, turb: 0.15, atm: rgb(0.6, 0.9, 0.95), atmK: 0.75, tilt: 97.8, spin: -0.16,
      rings: { inner: 1.6, outer: 2.0, gap: 0, c1: rgb(0.62, 0.66, 0.7), c2: rgb(0.3, 0.32, 0.34), dens: 0.35 } }),
    neptune: spec({ kind: GAS, c1: rgb(0.29, 0.46, 0.92), c2: rgb(0.18, 0.31, 0.78), c3: rgb(0.45, 0.62, 0.98), bands: 11, turb: 0.55, spot: [-0.32, 2.4, 0.16, 1], spotC: rgb(0.08, 0.12, 0.34), atm: rgb(0.45, 0.62, 1.0), atmK: 0.85, tilt: 28, spin: 0.18 }),
    pluto: spec({ kind: ICE, c1: rgb(0.86, 0.76, 0.62), c2: rgb(0.95, 0.91, 0.84), c3: rgb(0.45, 0.27, 0.18), crater: 0.12, spot: [0.1, 0.4, 0.42, 1], spotC: rgb(0.96, 0.94, 0.9), tilt: 120, spin: 0.03 }),
    ceres: spec({ c1: rgb(0.3, 0.3, 0.3), c2: rgb(0.48, 0.47, 0.46), crater: 1.1, maria: 0.1, spotBright: true, lump: 0.05 }),
    pallas: spec({ c1: rgb(0.36, 0.35, 0.34), c2: rgb(0.55, 0.53, 0.5), lump: 0.16 }),
    juno: spec({ c1: rgb(0.44, 0.38, 0.32), c2: rgb(0.66, 0.6, 0.52), lump: 0.18 }),
    vesta: spec({ c1: rgb(0.5, 0.46, 0.42), c2: rgb(0.74, 0.69, 0.62), c3: rgb(0.36, 0.33, 0.3), maria: 0.4, crater: 1.3, lump: 0.12 }),
    psyche: spec({ c1: rgb(0.42, 0.44, 0.48), c2: rgb(0.7, 0.72, 0.76), c3: rgb(0.32, 0.33, 0.36), crater: 0.9, lump: 0.2, metal: true }),
    eros: spec({ c1: rgb(0.5, 0.43, 0.36), c2: rgb(0.7, 0.63, 0.54), lump: 0.22, stretch: [2.3, 0.85, 0.85] }),
    chiron: spec({ c1: rgb(0.27, 0.26, 0.25), c2: rgb(0.45, 0.43, 0.41), crater: 0.7, lump: 0.1, rings: { inner: 1.5, outer: 1.75, gap: 0, c1: rgb(0.5, 0.48, 0.45), c2: rgb(0.25, 0.24, 0.23), dens: 0.5 } }),
    chariklo: spec({ c1: rgb(0.3, 0.28, 0.27), c2: rgb(0.46, 0.43, 0.4), lump: 0.1, rings: { inner: 1.55, outer: 1.85, gap: 0.55, c1: rgb(0.55, 0.52, 0.48), c2: rgb(0.28, 0.27, 0.26), dens: 0.6 } }),
    pholus: spec({ c1: rgb(0.5, 0.25, 0.17), c2: rgb(0.7, 0.4, 0.28), lump: 0.14 }),
    nessus: spec({ c1: rgb(0.48, 0.28, 0.2), c2: rgb(0.66, 0.42, 0.3), lump: 0.14 }),
    eris: spec({ kind: ICE, c1: rgb(0.88, 0.88, 0.88), c2: rgb(0.97, 0.97, 0.97), c3: rgb(0.66, 0.64, 0.62), crater: 0.4 }),
    sedna: spec({ kind: ICE, c1: rgb(0.72, 0.33, 0.22), c2: rgb(0.84, 0.48, 0.34), c3: rgb(0.5, 0.2, 0.13), crater: 0.3 }),
    makemake: spec({ kind: ICE, c1: rgb(0.78, 0.6, 0.48), c2: rgb(0.9, 0.78, 0.66), c3: rgb(0.55, 0.36, 0.26) }),
    haumea: spec({ kind: ICE, c1: rgb(0.86, 0.86, 0.88), c2: rgb(0.96, 0.96, 0.98), c3: rgb(0.62, 0.55, 0.55), stretch: [1.65, 0.65, 1.05], spot: [0.0, 0.0, 0.3, 0.8], spotC: rgb(0.62, 0.3, 0.3), spin: 0.6,
      rings: { inner: 2.0, outer: 2.25, gap: 0, c1: rgb(0.7, 0.7, 0.72), c2: rgb(0.35, 0.35, 0.36), dens: 0.45 } }),
    quaoar: spec({ kind: ICE, c1: rgb(0.6, 0.4, 0.32), c2: rgb(0.72, 0.55, 0.45), c3: rgb(0.42, 0.26, 0.2) }),
    orcus: spec({ kind: ICE, c1: rgb(0.6, 0.6, 0.62), c2: rgb(0.76, 0.76, 0.78), c3: rgb(0.42, 0.42, 0.44) }),
    ixion: spec({ kind: ICE, c1: rgb(0.62, 0.38, 0.28), c2: rgb(0.74, 0.52, 0.4), c3: rgb(0.44, 0.24, 0.17) }),
    varuna: spec({ kind: ICE, c1: rgb(0.6, 0.42, 0.33), c2: rgb(0.72, 0.56, 0.45), c3: rgb(0.42, 0.28, 0.22), stretch: [1.55, 0.85, 1.0] }),
    albion: spec({ kind: ICE, c1: rgb(0.62, 0.42, 0.32), c2: rgb(0.74, 0.58, 0.46), c3: rgb(0.44, 0.28, 0.2) }),
    arrokoth: spec({ c1: rgb(0.56, 0.3, 0.2), c2: rgb(0.72, 0.46, 0.33), crater: 0.25, lobes: true }),
    halley: spec({ kind: COMET, c1: rgb(0.14, 0.13, 0.12), c2: rgb(0.26, 0.24, 0.22), lump: 0.32, stretch: [1.6, 0.8, 0.9] }),
    halebopp: spec({ kind: COMET, c1: rgb(0.15, 0.14, 0.13), c2: rgb(0.28, 0.26, 0.24), lump: 0.26 }),
    hyakutake: spec({ kind: COMET, c1: rgb(0.13, 0.12, 0.12), c2: rgb(0.25, 0.24, 0.23), lump: 0.3 })
  };
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function keyOf(b) {
    var k = String(b.key || b.name || '').toLowerCase(), n = String(b.name || '').toLowerCase();
    if (BY[k]) return k;
    if (BY[n]) return n;
    if (n === 'chiron') return 'chiron';
    return null;
  }
  /* The spec for one body of the chart model. */
  function specOf(b) {
    var k = keyOf(b), sd = hash(b.key || b.name);
    if (k) { var s = spec(BY[k]); s.seed = sd * 50; s.id = k; return s; }
    var cat = b.cat || '';
    if (cat === 'node' || cat === 'derived' || cat === 'hypothetical' || cat === 'angle' || /node|lilith|selena|vertex|part of|aries point|midpoint/i.test(b.name || '')) {
      var nm = String(b.name || '');
      return { kind: SIGIL, seed: sd * 50, dark: /lilith/i.test(nm) ? 1 : 0, dash: cat === 'hypothetical' ? 1 : 0, nodes: /node/i.test(nm), id: 'sigil' };
    }
    /* everything else: a rock or an ice of its own colour and seed */
    var h1 = hash((b.key || b.name) + 'a'), h2 = hash((b.key || b.name) + 'b');
    if (cat === 'tno') return spec({ kind: ICE, c1: rgb(0.55 + h1 * 0.25, 0.45 + h1 * 0.2, 0.38 + h2 * 0.2), c2: rgb(0.78 + h2 * 0.15, 0.7 + h2 * 0.15, 0.62 + h1 * 0.15), c3: rgb(0.4, 0.28, 0.22), seed: sd * 50, id: 'tno' });
    if (cat === 'centaur') return spec({ c1: rgb(0.3 + h1 * 0.2, 0.24 + h1 * 0.1, 0.2), c2: rgb(0.5 + h2 * 0.2, 0.4 + h2 * 0.12, 0.33), lump: 0.12 + h2 * 0.1, seed: sd * 50, id: 'centaur' });
    if (cat === 'comet') return spec({ kind: COMET, c1: rgb(0.14, 0.13, 0.12), c2: rgb(0.27, 0.25, 0.23), lump: 0.28, seed: sd * 50, id: 'comet' });
    return spec({ c1: rgb(0.32 + h1 * 0.14, 0.3 + h1 * 0.1, 0.27 + h2 * 0.08), c2: rgb(0.55 + h2 * 0.18, 0.5 + h2 * 0.14, 0.45 + h1 * 0.12), lump: 0.1 + h1 * 0.18, crater: 0.8 + h2 * 0.5, seed: sd * 50, id: 'rock' });
  }

  /* ---- Building one ---------------------------------------------------------- */
  function Globes(T) {
    this.T = T;
    this.geo = new T.SphereGeometry(1, 112, 72);
    this.shellGeo = new T.SphereGeometry(1.045, 64, 40);
    this.tailGeo = new T.PlaneGeometry(1, 1); this.tailGeo.translate(0, 0.5, 0);
    this.coronaTex = null;
  }
  var G = Globes.prototype;
  G.corona = function (c) {
    var T = this.T;
    if (this.coronaTex) return this.coronaTex;
    var cv = document.createElement('canvas'); cv.width = cv.height = 256;
    var g = cv.getContext('2d'), gr = g.createRadialGradient(128, 128, 30, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,240,200,0.9)'); gr.addColorStop(0.25, 'rgba(255,190,110,0.45)'); gr.addColorStop(0.55, 'rgba(255,150,70,0.12)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    /* streamers */
    g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 14; i++) {
      var a = i / 14 * Math.PI * 2 + Math.random() * 0.3, l = 80 + Math.random() * 46;
      var lg = g.createLinearGradient(128, 128, 128 + Math.cos(a) * l, 128 + Math.sin(a) * l);
      lg.addColorStop(0, 'rgba(255,220,160,0.18)'); lg.addColorStop(1, 'rgba(255,200,140,0)');
      g.strokeStyle = lg; g.lineWidth = 6 + Math.random() * 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * l, 128 + Math.sin(a) * l); g.stroke();
    }
    var tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter;
    this.coronaTex = tex;
    return tex;
  };
  G.glow = function () {
    var T = this.T;
    if (this.glowTex) return this.glowTex;
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 2, 64, 64, 64);
    gr.addColorStop(0, 'rgba(225,240,255,0.95)'); gr.addColorStop(0.18, 'rgba(170,210,250,0.45)'); gr.addColorStop(0.5, 'rgba(120,170,230,0.12)'); gr.addColorStop(1, 'rgba(90,140,210,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    this.glowTex = new T.CanvasTexture(cv); this.glowTex.minFilter = T.LinearFilter;
    return this.glowTex;
  };
  /* make(b, shared): a group whose children are drawn at radius 1, for the
     scene to scale to the body's size. shared holds the uniforms every globe
     reads (uTime, uSun, uCamW). */
  G.make = function (b, shared, color) {
    var T = this.T, s = specOf(b), grp = new T.Group(), parts = [];
    var V3 = function (a) { return new T.Vector3(a[0], a[1], a[2]); };
    grp.userData.spec = s; grp.userData.spin = s.spin == null ? 0.08 : s.spin;
    var tilt = new T.Group(); tilt.rotation.z = (s.tilt || 0) * Math.PI / 180; grp.add(tilt);
    var spinG = new T.Group(); tilt.add(spinG); grp.userData.spinG = spinG; grp.userData.tilt = tilt;
    if (s.kind === SIGIL) {
      var c = color || [0.72, 0.6, 1];
      var mat = new T.ShaderMaterial({ vertexShader: V_GLOBE, fragmentShader: F_SIGIL, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        extensions: { derivatives: true },
        uniforms: { uLump: { value: 0 }, uSeed: { value: s.seed }, uC: { value: V3(c) }, uOp: { value: 1 }, uDark: { value: s.dark }, uDash: { value: s.dash }, uTime: shared.uTime, uCamW: shared.uCamW } });
      var m = new T.Mesh(this.geo, mat); spinG.add(m); parts.push(mat);
      if (s.nodes) {
        /* a node is where two planes cross: draw both */
        for (var q = 0; q < 2; q++) {
          var rm = new T.ShaderMaterial({ vertexShader: V_RING, fragmentShader: F_RING, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
            uniforms: { uC1: { value: V3(c) }, uC2: { value: V3(c) }, uIn: { value: 1.7 }, uOut: { value: 1.78 }, uGap: { value: 0 }, uSeed: { value: s.seed + q }, uOp: { value: 1 }, uDens: { value: 0.9 },
              uSun: shared.uSun, uCen: { value: new T.Vector3() }, uR: { value: 0 }, uN: { value: new T.Vector3(0, 1, 0) } } });
          var ring = new T.Mesh(new T.RingGeometry(1.7, 1.78, 128, 1), rm);
          ring.rotation.x = Math.PI / 2 + (q ? 0.32 : -0.06); ring.rotation.y = q ? 0.25 : 0;
          grp.add(ring); parts.push(rm);
        }
      }
      grp.userData.parts = parts; grp.userData.kind = 'sigil';
      return grp;
    }
    var kind = s.kind === COMET ? ROCK : s.kind;
    var u = {
      uKind: { value: kind }, uC1: { value: V3(s.c1) }, uC2: { value: V3(s.c2) }, uC3: { value: V3(s.c3 || s.c1) },
      uAtm: { value: V3(s.atm || [0, 0, 0]) }, uAtmK: { value: s.atm ? s.atmK : 0 }, uSeed: { value: s.seed }, uBands: { value: s.bands || 12 },
      uTurb: { value: s.turb == null ? 1 : s.turb }, uCap: { value: s.cap || 0 }, uMaria: { value: s.maria || 0 }, uCrater: { value: s.crater == null ? 1 : s.crater }, uLump: { value: s.lump || 0 },
      uSpot: { value: new T.Vector4(0, 0, 1, 0) }, uSpotC: { value: V3(s.spotC || [1, 1, 1]) },
      uTime: shared.uTime, uOp: { value: 1 }, uDetail: { value: 1 }, uSun: shared.uSun, uCamW: shared.uCamW
    };
    if (s.spot) u.uSpot.value.set(s.spot[0], s.spot[1], s.spot[2], s.spot[3]);
    if (s.spotBright) { u.uSpot.value.set(0.35, 0.8, 0.09, 1); u.uSpotC.value.set(0.95, 0.95, 0.97); u.uKind.value = ICE; u.uC3.value.set(0.26, 0.26, 0.26); }
    var gm = new T.ShaderMaterial({ vertexShader: V_GLOBE, fragmentShader: F_GLOBE, transparent: true, depthWrite: true, uniforms: u, extensions: { derivatives: true } });
    var body = new T.Mesh(this.geo, gm);
    if (s.stretch) body.scale.set(s.stretch[0], s.stretch[1], s.stretch[2]);
    spinG.add(body); parts.push(gm);
    if (s.lobes) {
      body.scale.set(0.82, 0.62, 0.66); body.position.x = -0.42;
      var b2 = new T.Mesh(this.geo, gm); b2.scale.set(0.6, 0.5, 0.52); b2.position.x = 0.62; spinG.add(b2);
    }
    if (s.atm && s.atmK > 0) {
      var sm = new T.ShaderMaterial({ vertexShader: V_SHELL, fragmentShader: F_SHELL, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.BackSide,
        uniforms: { uC: { value: V3(s.atm) }, uK: { value: s.kind === STAR ? 1.4 : s.atmK }, uOp: { value: 1 }, uSun: shared.uSun, uCamW: shared.uCamW, uSelf: { value: s.kind === STAR ? 1 : 0 } } });
      var shell = new T.Mesh(this.shellGeo, sm); shell.scale.setScalar(s.kind === STAR ? 1.08 : 1.0); tilt.add(shell); parts.push(sm);
    }
    if (s.corona) {
      var cm = new T.SpriteMaterial({ map: this.corona(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 1 });
      var cs = new T.Sprite(cm); cs.scale.set(5.2, 5.2, 1); grp.add(cs); parts.push(cm);
      grp.userData.corona = cs;
    }
    if (s.rings) {
      var R = s.rings;
      var rmat = new T.ShaderMaterial({ vertexShader: V_RING, fragmentShader: F_RING, transparent: true, depthWrite: false, side: T.DoubleSide,
        uniforms: { uC1: { value: V3(R.c1) }, uC2: { value: V3(R.c2) }, uIn: { value: R.inner }, uOut: { value: R.outer }, uGap: { value: R.gap || 0 }, uSeed: { value: s.seed }, uOp: { value: 1 }, uDens: { value: R.dens || 0.8 },
          uSun: shared.uSun, uCen: { value: new T.Vector3() }, uR: { value: 1 }, uN: { value: new T.Vector3(0, 1, 0) } } });
      var rg = new T.Mesh(new T.RingGeometry(R.inner, R.outer, 192, 1), rmat);
      rg.rotation.x = -Math.PI / 2; tilt.add(rg); parts.push(rmat);
      grp.userData.ring = rg;
    }
    if (s.kind === COMET) {
      /* the coma: a soft glow round the nucleus, not a shell */
      var coma = new T.Sprite(new T.SpriteMaterial({ map: this.glow(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 1 }));
      coma.scale.set(6, 6, 1); grp.add(coma); parts.push(coma.material);
      var tails = [];
      [[0.55, 0.72, 0.98, 9, 0.9], [0.98, 0.86, 0.6, 6, 1.9]].forEach(function (t) {
        var tm = new T.ShaderMaterial({ vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: F_TAIL,
          transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, uniforms: { uC: { value: V3(t.slice(0, 3)) }, uOp: { value: 1 }, uTime: shared.uTime } });
        var tail = new T.Mesh(this.tailGeo, tm); tail.scale.set(t[4], t[3], 1); tail.userData.bend = t[4] > 1 ? 0.18 : 0;
        grp.add(tail); tails.push(tail); parts.push(tm);
      }, this);
      grp.userData.tails = tails;
    }
    grp.userData.parts = parts; grp.userData.kind = s.kind === STAR ? 'star' : 'world';
    return grp;
  };
  /* Per frame: spin, the opacity it is faded to, and the parts that face or
     follow the Sun. pos is the globe's world centre, radius its scale. */
  G.update = function (grp, dt, op, sunPos, camPos, radius) {
    var T = this.T, ud = grp.userData;
    if (ud.spinG) ud.spinG.rotation.y += (ud.spin || 0) * dt;
    ud.parts.forEach(function (m) { if (m.uniforms && m.uniforms.uOp) m.uniforms.uOp.value = op; else if ('opacity' in m) m.opacity = op; });
    if (ud.ring) {
      var ru = ud.ring.material.uniforms; ru.uCen.value.copy(grp.position); ru.uR.value = radius;
      var nrm = new T.Vector3(0, 0, 1).applyQuaternion(ud.ring.getWorldQuaternion(new T.Quaternion())); ru.uN.value.copy(nrm);
    }
    if (ud.tails && sunPos) {
      var away = new T.Vector3().subVectors(grp.position, sunPos); if (away.lengthSq() < 1e-6) away.set(1, 0, 0); away.normalize();
      ud.tails.forEach(function (t) {
        var dir = away.clone(); if (t.userData.bend) { dir.x += t.userData.bend; dir.normalize(); }
        var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
        t.quaternion.copy(q);
        /* turn the tail about its own axis so its face meets the camera */
        var toCam = new T.Vector3().subVectors(camPos, grp.position).normalize();
        var side = new T.Vector3(1, 0, 0).applyQuaternion(q), up = dir;
        var flat = toCam.clone().sub(up.clone().multiplyScalar(toCam.dot(up)));
        if (flat.lengthSq() > 1e-6) { flat.normalize(); var normal = new T.Vector3(0, 0, 1).applyQuaternion(q); var ang = Math.atan2(side.dot(flat), normal.dot(flat)); t.rotateOnAxis(new T.Vector3(0, 1, 0), ang); }
      });
    }
  };
  G.dispose = function (grp) {
    grp.traverse(function (o) {
      if (o.geometry && o.geometry.type === 'RingGeometry') o.geometry.dispose();
      if (o.material) { if (o.material.map && o.material.map !== this.coronaTex && o.material.map !== this.glowTex) o.material.map.dispose(); o.material.dispose(); }
    }.bind(this));
  };
  /* The meshes above share these geometries and textures. Releasing a single
     globe must not break its neighbours; releasing the scene must free them. */
  G.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;
    [this.geo, this.shellGeo, this.tailGeo, this.coronaTex, this.glowTex].forEach(function (asset) {
      if (asset) asset.dispose();
    });
    this.geo = this.shellGeo = this.tailGeo = this.coronaTex = this.glowTex = null;
  };
  G.kindOf = function (b) { var s = specOf(b); return s.kind === SIGIL ? 'point' : s.kind === STAR ? 'star' : s.kind === GAS ? 'giant' : s.kind === COMET ? 'comet' : s.kind === ICE ? 'ice' : s.kind === CLOUD ? 'clouded' : 'rock'; };

  root.BodyGlobes = {
    create: function (T) { return new Globes(T); },
    kindOf: function (b) { var s = specOf(b); return s.kind === SIGIL ? 'point' : s.kind === STAR ? 'star' : s.kind === GAS ? 'giant' : s.kind === COMET ? 'comet' : s.kind === ICE ? 'ice' : s.kind === CLOUD ? 'clouded' : 'rock'; }
  };
})(typeof window !== 'undefined' ? window : this);
