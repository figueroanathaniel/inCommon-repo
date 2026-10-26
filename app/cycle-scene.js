/* cycle-scene.js: THE CYCLE AUDIT AS A PLACE.

   The owner, 19 October 2026: "make the audit cycle completely interactive
   like it was made on Unreal Engines. It should breathe with the reader's
   curiosity." So the long weather is drawn as a landscape in real depth rather
   than as bars: the years run left to right across a dark floor, the Stars lane
   at the back carries every passage as an arch of light whose height is its
   weight, the exact dates stand in it as pillars, the Design lane is a band of
   lit slabs where a slow body sits on the reader's gates, and the Numbers lane
   at the front is a row of tiles, one per year, as tall as the Personal Year.
   Now is a column of light through all three. In the full view a wheel of the
   sky hangs in the upper corner and turns with the time the reader is looking
   at, with a line drawn from each slow body to the natal point it is touching.

   WHAT IT DRAWS IS THE APP'S, NEVER ITS OWN. Every passage, stay, year and
   pinnacle arrives in the model the app builds (cycleSceneModel), from the
   same scan the lists and the widget read, and the two positions this file
   asks for (the slow bodies at the probed instant) come through opts.lonAt,
   the app's own cyLon. Nothing here computes a chart, and nothing here is
   sent anywhere.

   BREATHING. One number, curiosity, rises with what the reader does (moving
   the pointer, hovering a passage, dragging through time, the keys) and
   decays over about eight seconds. It brightens the glow and the bloom,
   quickens the light running along the arches, stirs the dust toward the
   pointer, and leans the camera in. At rest the scene breathes on a slow
   clock. Under reduced motion all of that holds still: the scene draws a
   frame when something changes and never animates on its own, because the
   setting asks for stillness, and the camera cuts rather than flies.

   ORBITAL IS THE SAME TWENTY YEARS AS A SKY (owner, 20 October 2026). The
   landscape's content gives way to a polar chart on the same floor: the natal
   wheel in the middle, one band per slow body around it, and in each band the
   body's path with time running outward and longitude running round, so a
   retrograde is the path doubling back and a passage that is exact five times
   is the path crossing one bearing five times. The zodiac and the sixty four
   gates ring the outside, a stay on a gate is a lit sector in its body's band,
   the path alternates tone year by year with a master year in violet, and
   the Personal Year of the instant sits in the middle of the wheel. The two layouts
   are one scene: the camera moves between their rigs and the landscape fogs
   out as the sky comes up, so the reader keeps the probe, the card and the
   readout. setLayout() chooses; the paths arrive in the model.

   THE FALLBACK IS THE APP'S CHART. Without WebGL 2, or when three.js does not
   load, or when the context is lost, opts.onFail tells the app, which puts its
   own flat chart back. The scene never paints a broken frame in its place.

   THE LOOP IS ONLY WHERE IT IS SEEN. It runs while its host is in the
   document, on screen (an IntersectionObserver, because the phone draws every
   section at once) and the page is visible, at up to 60 frames a second while
   the reader is doing something and 30 at rest; a quality ladder drops the
   pixel ratio and then the bloom when frames run long, and never climbs back
   inside a session.

   three.js is the copy the cover already vendors, imported on first use with
   import('./three.module.js'), so a reader who never sees the widget never
   downloads it. ColorManagement is switched off and the output is written as
   is: every colour here is a token read off the page, and a conversion would
   move it off the palette it was read from. */
(function (root) {
  'use strict';

  var T = null, loading = null, okGL = null;
  var DAY = 864e5, YEAR = 365.2425 * DAY, U = 2;
  var STAR_Z0 = -2.5, STAR_DZ = 0.9, DES_Z0 = -0.55, DES_DZ = 0.62, TILE_Z = 1.95, PIN_Z = 3.0, YEAR_Z = 3.7;
  var TARGET_Z = -1.2, TARGET_Y = 0.35;
  /* The Orbital layout: one band per slow body, time outward across it. */
  var OB = { Saturn: [3.3, 4.75], Uranus: [5.05, 6.35], Neptune: [6.65, 7.9], Pluto: [8.2, 9.6] };
  var OB_ORDER = ['Saturn', 'Uranus', 'Neptune', 'Pluto'], OB_GLYPH = { Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
  var R_NAT = 2.6, R_ZOD0 = 10.0, R_ZOD1 = 10.7, R_GATE0 = 10.9, R_GATE1 = 11.4, R_FIT = 12.2;

  /* iOS. On the owner's iPhone (Chrome, so WebKit: every browser there is)
     the offscreen chain drew with tiles missing, hard edged black squares
     that took about a minute to fill in (20 October 2026). There the scene is
     drawn straight to the canvas, with the canvas's own antialiasing and no
     bloom, which is the path the quality ladder already falls to. ?gfx= tries
     the others on any device without a build: post (the chain as it was),
     nomsaa (the chain without its multisampled target) or direct. */
  var GFX = (function () {
    var q = '', ios = false;
    try { q = ((/[?&]gfx=([a-z]+)/.exec(location.search) || [])[1]) || ''; } catch (e) { q = ''; }
    try { ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); } catch (e) { ios = false; }
    return { ios: ios, direct: q === 'direct' || (ios && q !== 'post' && q !== 'nomsaa'), nomsaa: q === 'nomsaa' };
  })();
  function supported() {
    if (okGL !== null) return okGL;
    try { var c = document.createElement('canvas'); okGL = !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch (e) { okGL = false; }
    return okGL;
  }
  function load() {
    if (T) return Promise.resolve(T);
    if (!loading) loading = import('./three.module.js').then(function (m) { T = m; return m; }, function (e) { loading = null; throw e; });
    return loading;
  }

  /* LOADING, FAST. The faces the scene draws its labels in are waited for by
     name, not through document.fonts.ready: that waits on every face the page
     is fetching, and a theme preview elsewhere on the page asking for Petrona
     held the scene behind Loading for two seconds it never needed. */
  function waitFaces(tok) {
    var fs = document.fonts;
    if (!fs || !fs.load) return Promise.resolve();
    var want = ['400 16px ' + tok.fu, '600 16px ' + tok.fu, '700 16px ' + tok.fu, '400 16px ' + tok.fd];
    return Promise.all(want.map(function (f) { return fs.load(f).catch(function () { return null; }); }));
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function damp(cur, goal, k) { return cur + (goal - cur) * k; }

  /* ---- Shaders. GLSL 1 shaped; three.js carries them to WebGL 2. ---------- */
  var FOG = 'uniform vec3 uCam; uniform float uFog;\nfloat fogK(vec3 w){ float d = distance(w, uCam); return exp(-pow(d * uFog, 2.0)); }\n';
  var V_ARCH = [
    'varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vW;',
    'void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;',
    ' vec4 mv = viewMatrix * w; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);',
    ' gl_Position = projectionMatrix * mv; }'].join('\n');
  var F_ARCH = FOG + [
    'uniform vec3 uA; uniform vec3 uB; uniform float uTime; uniform float uHover; uniform float uLive; uniform float uGlow;',
    'uniform float uMirror; uniform float uShell; uniform float uDim;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vW;',
    'void main(){',
    ' float f = abs(dot(normalize(vN), normalize(vV)));',
    ' vec3 c = mix(uA, uB, smoothstep(0.0, 1.0, vUv.x));',
    ' float ends = smoothstep(0.0, 0.025, vUv.x) * smoothstep(1.0, 0.975, vUv.x);',
    ' float e;',
    ' if (uShell > 0.5) { e = pow(f, 2.4) * 0.22; }',
    ' else { float fl = pow(0.5 + 0.5 * sin((vUv.x * 4.0 - uTime * (0.16 + 0.42 * uLive)) * 6.2832), 12.0);',
    '  e = 0.34 + 0.62 * pow(f, 1.5) + fl * (0.4 + 0.6 * uLive); }',
    ' e *= (0.72 + 0.75 * uHover + 0.3 * uLive) * uGlow * uDim;',
    ' if (uMirror > 0.5) e *= 0.2 * exp(vW.y * 1.4);',
    ' gl_FragColor = vec4(c * e * ends * fogK(vW), 1.0); }'].join('\n');
  var V_UV = 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
  var F_PILLAR = FOG + [
    'uniform vec3 uC; uniform float uI; uniform float uCore; varying vec2 vUv; varying vec3 vW;',
    'void main(){ float x = (vUv.x - 0.5) * 2.0; float core = exp(-x * x * uCore); float halo = exp(-x * x * 3.5) * 0.24;',
    ' float v = vUv.y; float fade = smoothstep(0.0, 0.05, v) * pow(1.0 - v, 1.3);',
    ' gl_FragColor = vec4(uC * (core + halo) * fade * uI * fogK(vW), 1.0); }'].join('\n');
  var F_SLAB = FOG + [
    'uniform vec3 uC; uniform float uFill; uniform float uHover; uniform float uLive; uniform float uDim; uniform float uGlow;',
    'varying vec2 vUv; varying vec3 vW;',
    'void main(){ float m = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)); float edge = 1.0 - smoothstep(0.0, 0.09, m);',
    ' float e = (edge * 0.8 + uFill * 0.32) * (0.7 + 0.7 * uHover + 0.3 * uLive) * uDim * uGlow;',
    ' gl_FragColor = vec4(uC * e * fogK(vW), 1.0); }'].join('\n');
  var F_CURTAIN = FOG + [
    'uniform vec3 uC; uniform float uI; uniform float uHover; uniform float uTime; varying vec2 vUv; varying vec3 vW;',
    'void main(){ float sx = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);',
    ' float rise = pow(1.0 - vUv.y, 2.2); float sh = 0.75 + 0.25 * sin(vUv.x * 40.0 + uTime * 0.7 - vUv.y * 6.0);',
    ' gl_FragColor = vec4(uC * sx * rise * sh * uI * (1.0 + uHover) * fogK(vW), 1.0); }'].join('\n');
  var V_TILE = 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normal; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
  var F_TILE = FOG + [
    'uniform vec3 uBase; uniform vec3 uC; uniform vec3 uBg; uniform float uHover; uniform float uOn; uniform float uBreath; uniform float uGlow;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vW;',
    'void main(){ float m = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)); float edge = 1.0 - smoothstep(0.0, 0.08, m);',
    ' float top = step(0.5, vN.y); float side = 1.0 - top;',
    ' float lift = 0.5 + 0.5 * uHover + 0.45 * uOn * (0.75 + 0.25 * uBreath);',
    ' vec3 c = uBase * (0.85 + 0.3 * top) + uC * (edge * lift + top * (0.08 + 0.2 * uOn + 0.14 * uHover) + side * 0.03) * uGlow;',
    ' c = mix(uBg, c, fogK(vW)); gl_FragColor = vec4(c, 1.0); }'].join('\n');
  var F_FLOOR = FOG + [
    'uniform vec3 uBg; uniform vec3 uLine; uniform vec3 uA; uniform vec3 uHi; uniform vec3 uBlue;',
    'uniform float uX0; uniform float uU; uniform float uNowX; uniform float uProbeX; uniform float uProbeOn;',
    'uniform vec2 uPtr; uniform float uPtrOn; uniform float uBreath; uniform vec4 uLanes;',
    'varying vec2 vUv; varying vec3 vW;',
    'float band(float z, float a, float b){ return smoothstep(a - 0.35, a, z) * smoothstep(b + 0.35, b, z); }',
    'void main(){ vec2 p = vW.xz; float fw = fwidth(p.x) * 1.3 + 0.004;',
    ' float gx = abs(fract((p.x - uX0) / uU + 0.5) - 0.5) * uU; float yl = 1.0 - smoothstep(0.0, fw, gx);',
    ' float mu = uU / 12.0; float hx = abs(fract((p.x - uX0) / mu + 0.5) - 0.5) * mu; float ml = 1.0 - smoothstep(0.0, fw * 0.8, hx);',
    ' float inLanes = band(p.y, uLanes.x, uLanes.w);',
    ' vec3 c = uBg + uLine * (yl * 0.16 + ml * 0.035) * inLanes;',
    ' c += uA * 0.05 * band(p.y, uLanes.x, uLanes.y) + uBlue * 0.03 * band(p.y, uLanes.y + 0.1, uLanes.z) + uHi * 0.025 * band(p.y, uLanes.z + 0.1, uLanes.w);',
    ' c += uHi * (0.17 + 0.05 * uBreath) * exp(-pow((p.x - uNowX) * 2.4, 2.0)) * inLanes;',
    ' c += uLine * 0.11 * uProbeOn * exp(-pow((p.x - uProbeX) * 3.2, 2.0)) * inLanes;',
    ' vec2 dp = p - uPtr; c += uA * 0.2 * uPtrOn * exp(-dot(dp, dp) * 0.28);',
    ' c = mix(uBg, c, fogK(vW)); gl_FragColor = vec4(c, 1.0); }'].join('\n');
  var V_SKY = 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  var F_SKY = [
    'uniform vec3 uBg; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC3; uniform float uAtmo; uniform float uTime; varying vec3 vD;',
    'void main(){ float e = vD.y; vec3 c = uBg;',
    ' c += uA * uAtmo * 0.34 * exp(-pow((e - 0.30) * 2.4, 2.0));',
    ' c += uB * uAtmo * 0.15 * exp(-pow((e - 0.02) * 8.0, 2.0));',
    ' float n = sin(vD.x * 5.0 + uTime * 0.012) * sin(vD.z * 4.0 - uTime * 0.009) * 0.5 + 0.5;',
    ' c += uC3 * uAtmo * 0.07 * n * smoothstep(0.0, 0.5, e);',
    ' gl_FragColor = vec4(c, 1.0); }'].join('\n');
  var V_POINTS = [
    'attribute float aSize; attribute vec3 aCol; uniform float uPR; uniform float uScale; uniform float uTime; varying vec3 vC; varying float vTw;',
    'void main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    ' vTw = 0.75 + 0.25 * sin(uTime * (0.6 + fract(aSize * 7.13) * 1.8) + position.x * 3.0);',
    ' gl_PointSize = aSize * uPR * uScale / max(0.2, -mv.z); gl_Position = projectionMatrix * mv; }'].join('\n');
  var F_POINTS = [
    'uniform float uI; varying vec3 vC; varying float vTw;',
    'void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p) * 2.0; if (d > 1.0) discard;',
    ' float a = exp(-d * d * 4.0) * 0.8 + exp(-d * d * 36.0); gl_FragColor = vec4(vC * a * uI * vTw, 1.0); }'].join('\n');
  var V_DUST = [
    'attribute float aR; uniform float uDrift; uniform float uTime; uniform vec3 uPtr; uniform float uAttract; uniform float uPR;',
    'varying float vA; varying float vR;',
    'void main(){ vec3 p = position; p.y = mod(p.y + uDrift * (0.25 + aR), 5.5);',
    ' p.x += sin(uTime * 0.13 + aR * 40.0) * 0.35; p.z += cos(uTime * 0.11 + aR * 30.0) * 0.25;',
    ' vec2 d = uPtr.xz - p.xz; float k = uAttract * exp(-dot(d, d) * 0.16); p.xz += d * k * 0.45; p.y += k * 0.6;',
    ' vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    ' gl_PointSize = (1.1 + aR * 2.4) * uPR * (9.0 / max(0.5, -mv.z)) * (1.0 + k * 1.4);',
    ' vA = (0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * (0.7 + aR * 2.0) + aR * 20.0))) * smoothstep(0.0, 0.6, p.y) * smoothstep(5.5, 4.0, p.y) * (1.0 + k * 2.0);',
    ' vR = aR; gl_Position = projectionMatrix * mv; }'].join('\n');
  var F_DUST = [
    'uniform vec3 uC1; uniform vec3 uC2; uniform float uAlpha; varying float vA; varying float vR;',
    'void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q) * 2.0; if (d > 1.0) discard;',
    ' gl_FragColor = vec4(mix(uC1, uC2, vR) * exp(-d * d * 5.0) * vA * uAlpha, 1.0); }'].join('\n');
  /* Orbital: drawn flat on the floor and never fogged, because the fog is
     what takes the landscape away while this comes up. */
  var V_OSTRIP = 'attribute vec3 aCol; attribute vec2 aP; varying vec3 vC; varying vec2 vP; void main(){ vC = aCol; vP = aP; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  var F_OBASE = 'uniform float uOrb; uniform float uI; varying vec3 vC; varying vec2 vP; void main(){ gl_FragColor = vec4(vC * (1.0 - vP.y * vP.y * 0.75) * uI * uOrb, 1.0); }';
  var F_OPASS = [
    'uniform vec3 uA; uniform vec3 uB; uniform float uTime; uniform float uHover; uniform float uLive; uniform float uGlow; uniform float uDim; uniform float uOrb;',
    'varying vec3 vC; varying vec2 vP;',
    'void main(){ vec3 c = mix(uA, uB, smoothstep(0.0, 1.0, vP.x));',
    ' float ends = smoothstep(0.0, 0.03, vP.x) * smoothstep(1.0, 0.97, vP.x);',
    ' float fl = pow(0.5 + 0.5 * sin((vP.x * 4.0 - uTime * (0.16 + 0.42 * uLive)) * 6.2832), 12.0);',
    ' float core = 1.0 - smoothstep(0.1, 1.0, abs(vP.y));',
    ' float e = (0.6 + 0.4 * core + fl * (0.35 + 0.55 * uLive)) * (0.75 + 0.8 * uHover + 0.3 * uLive) * uGlow * uDim * uOrb;',
    ' gl_FragColor = vec4(c * e * ends * (0.3 + 0.7 * core), 1.0); }'].join('\n');
  var V_OSEC = 'attribute vec2 aP; varying vec2 vP; void main(){ vP = aP; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  var F_OSEC = [
    'uniform vec3 uC; uniform vec2 uSize; uniform float uFill; uniform float uEdge; uniform float uHover; uniform float uLive; uniform float uDim; uniform float uOrb;',
    'varying vec2 vP;',
    'void main(){ vec2 f = vec2(fract(vP.x), vP.y); float m = min(min(f.x, 1.0 - f.x) * uSize.x, min(f.y, 1.0 - f.y) * uSize.y);',
    ' float edge = 1.0 - smoothstep(0.0, 0.05, m);',
    ' float e = (edge * uEdge + uFill) * (0.7 + 0.8 * uHover + 0.7 * uLive) * uDim * uOrb;',
    ' gl_FragColor = vec4(uC * e, 1.0); }'].join('\n');
  var V_POST = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  var F_BRIGHT = 'uniform sampler2D tIn; uniform float uThr; varying vec2 vUv; void main(){ vec3 c = texture2D(tIn, vUv).rgb; float l = max(max(c.r, c.g), c.b); gl_FragColor = vec4(c * smoothstep(uThr, uThr + 0.4, l), 1.0); }';
  var F_BLUR = [
    'uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;',
    'void main(){ vec3 c = texture2D(tIn, vUv).rgb * 0.2270;',
    ' c += (texture2D(tIn, vUv + uDir * 1.3846).rgb + texture2D(tIn, vUv - uDir * 1.3846).rgb) * 0.3162;',
    ' c += (texture2D(tIn, vUv + uDir * 3.2308).rgb + texture2D(tIn, vUv - uDir * 3.2308).rgb) * 0.0703;',
    ' gl_FragColor = vec4(c, 1.0); }'].join('\n');
  var F_COMP = [
    'uniform sampler2D tScene; uniform sampler2D tB1; uniform sampler2D tB2; uniform float uStr; uniform float uVig; varying vec2 vUv;',
    'void main(){ vec3 c = texture2D(tScene, vUv).rgb + (texture2D(tB1, vUv).rgb * 0.7 + texture2D(tB2, vUv).rgb * 0.9) * uStr;',
    ' float v = smoothstep(1.15, 0.35, length((vUv - 0.5) * vec2(1.25, 1.6))); c *= mix(1.0, v, uVig);',
    ' c = c / (1.0 + max(vec3(0.0), c - 0.85) * 0.9); gl_FragColor = vec4(c, 1.0); }'].join('\n');

  /* ---- Reading the palette off the page ----------------------------------- */
  /* Deep Field, as numbers, for the one frame where the page cannot be read
     yet (the root not in the document). Replaced the moment it can be. */
  var DEFAULT_TOK = {
    bg: [0.02, 0.024, 0.04], tx: [0.933, 0.941, 0.973], ac2: [0.545, 0.361, 0.965], hi: [0.718, 0.608, 1], blue: [0.49, 0.608, 1],
    atm: [0.184, 0.31, 0.839], atm2: [0.949, 0.839, 0.62], atm3: [0.184, 0.31, 0.839], tax: [0.878, 0.643, 0.345], div: [0.31, 0.722, 0.769],
    cTx: 'rgb(238, 240, 248)', cMut: 'rgba(238, 240, 248, 0.58)', cHi: 'rgb(183, 155, 255)', cBlue: 'rgb(125, 155, 255)', cBg: 'rgb(5, 6, 10)',
    atmo: 0.85, fd: 'serif', fu: 'sans-serif'
  };
  function readTokens(el) {
    if (!el || !el.isConnected) return null;
    var cs = getComputedStyle(el), pr = document.createElement('span');
    if (!cs.getPropertyValue('--tx').trim()) return null;
    pr.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
    el.appendChild(pr);
    function css(name, fb) {
      var v = cs.getPropertyValue(name).trim();
      if (/^\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?$/.test(v)) v = 'rgb(' + v + ')';
      pr.style.color = fb || 'rgb(128,128,128)';
      if (v) pr.style.color = v;
      return getComputedStyle(pr).color || 'rgb(128,128,128)';
    }
    function vec(name, fb) {
      var m = /rgba?\(([^)]+)\)/.exec(css(name, fb));
      var p = m ? m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat) : [128, 128, 128];
      return [p[0] / 255, p[1] / 255, p[2] / 255];
    }
    var out = {
      bg: vec('--bg', 'rgb(5,6,10)'), tx: vec('--tx'), ac2: vec('--ac2'), hi: vec('--ac2-hi'), blue: vec('--blue'),
      atm: vec('--atmc'), atm2: vec('--atmc2'), atm3: vec('--atmc3'), tax: vec('--ledger-tax'), div: vec('--ledger-div'),
      cTx: css('--tx'), cMut: css('--mut'), cHi: css('--ac2-hi'), cBlue: css('--blue'), cBg: css('--bg'),
      atmo: parseFloat(cs.getPropertyValue('--atmo')) || 0.6,
      fd: cs.getPropertyValue('--fd').trim() || 'serif', fu: cs.getPropertyValue('--fu').trim() || 'sans-serif'
    };
    el.removeChild(pr);
    return out;
  }
  function mix3(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function v3(a) { return new T.Vector3(a[0], a[1], a[2]); }

  /* ---- The scene ----------------------------------------------------------- */
  function Scene(opts) {
    this.o = opts || {};
    this.mode = null; this.host = null; this.model = null;
    this.ready = false; this.failed = false; this.building = false;
    this.running = false; this.visible = true; this.raf = 0; this.last = 0; this.lastDraw = 0;
    this.c = 0; this.cur = 0; this.time = 0; this.drift = 0;
    this.probeT = null; this.probeShow = 0; this.probeHold = 0;
    this.ptr = { x: 0, y: 0, on: false, moved: false, world: null };
    this.down = null; this.pinch = null; this.hover = null; this.focusId = null; this.card = null;
    this.rig = null; this.goal = null; this.user = { center: null, dist: null, elev: null };
    this.level = 0; this.frames = []; this.labels = [];
    this.layout = 'land'; this.morph = 0; this.orbI = 0; this.landI = 1;
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.dom();
  }
  var P = Scene.prototype;

  P.dom = function () {
    var self = this, r = document.createElement('div');
    r.setAttribute('data-cy-scene-root', '1');
    r.style.cssText = 'position:absolute;inset:0;overflow:hidden;border-radius:inherit;background:var(--bg)';
    var s = document.createElement('div');
    s.setAttribute('role', 'slider');
    s.setAttribute('tabindex', '0');
    s.setAttribute('aria-roledescription', 'timeline');
    s.style.cssText = 'position:absolute;inset:0;outline:none;cursor:grab;touch-action:pan-y;-webkit-tap-highlight-color:transparent';
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%;opacity:0;transition:opacity 1.2s cubic-bezier(.22,.61,.36,1)';
    s.appendChild(cv);
    r.appendChild(s);
    var tip = document.createElement('div');
    tip.setAttribute('aria-hidden', 'true');
    tip.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;opacity:0;transition:opacity .18s ease;max-width:240px;padding:7px 10px;border-radius:10px;background:var(--bg);border:1px solid var(--ac2);font:600 12px/1.35 var(--fu);color:var(--tx);box-shadow:0 6px 24px rgba(0,0,0,.45)';
    r.appendChild(tip);
    var rd = document.createElement('div');
    rd.setAttribute('aria-hidden', 'true');
    rd.style.cssText = 'position:absolute;left:12px;bottom:12px;max-width:calc(100% - 24px);pointer-events:none;opacity:0;transition:opacity .25s ease;display:flex;flex-direction:column;gap:2px;padding:8px 12px;border-radius:12px;background:var(--bg);border:1px solid var(--bd)';
    r.appendChild(rd);
    var cd = document.createElement('div');
    cd.setAttribute('aria-live', 'polite');
    cd.style.cssText = 'position:absolute;left:12px;bottom:12px;width:min(360px,calc(100% - 84px));display:none;flex-direction:column;gap:6px;padding:14px 14px 10px;border-radius:16px;background:var(--bg);border:1px solid var(--ac2);box-shadow:0 12px 40px rgba(0,0,0,.55)';
    r.appendChild(cd);
    this.el = { root: r, slider: s, canvas: cv, tip: tip, read: rd, card: cd };
    this._on = {
      down: function (e) { self.onDown(e); }, move: function (e) { self.onMove(e); }, up: function (e) { self.onUp(e); },
      cancel: function (e) { self.onCancel(e); },
      leave: function () {
        self.ptr.on = false; self.ptr.moved = true; self.setHover(null); self.hideTip();
        if (self.reduced && self.mode !== 'full' && document.activeElement !== s) { self.probeT = null; self.showRead(false); }
        self.kick();
      },
      wheel: function (e) { self.onWheel(e); }, key: function (e) { self.onKey(e); },
      focus: function () {
        var kb = false; try { kb = s.matches(':focus-visible'); } catch (e) { kb = true; }
        if (kb) { self.keyed = true; s.style.boxShadow = 'inset 0 0 0 2px var(--ac2-hi)'; self.showRead(true); }
      },
      blur: function () { s.style.boxShadow = 'none'; self.keyed = false; self.probeHold = performance.now(); },
      vis: function () { self.updateRun(); }
    };
    s.addEventListener('pointerdown', this._on.down);
    s.addEventListener('pointermove', this._on.move);
    s.addEventListener('pointerup', this._on.up);
    s.addEventListener('pointercancel', this._on.cancel);
    s.addEventListener('pointerleave', this._on.leave);
    s.addEventListener('wheel', this._on.wheel, { passive: false });
    s.addEventListener('keydown', this._on.key);
    s.addEventListener('keyup', function (e) { if (self.flyOk()) self.flyKeyUp(e); });
    this._onBlur = function () { if (self.fly) self.fly.blur(); };
    window.addEventListener('blur', this._onBlur);
    s.addEventListener('focus', this._on.focus);
    s.addEventListener('blur', this._on.blur);
    document.addEventListener('visibilitychange', this._on.vis);
  };

  /* ---- Attaching to a host, and the lazy build ----------------------------- */
  P.attach = function (host, mode) {
    if (this.failed || !host) return;
    var moved = this.host !== host || this.el.root.parentNode !== host;
    var modeChanged = this.mode !== mode;
    if (moved) host.appendChild(this.el.root);
    this.host = host;
    this.mode = mode;
    this.el.slider.style.touchAction = mode === 'full' ? 'none' : 'pan-y';
    this.el.slider.style.cursor = mode === 'full' ? 'crosshair' : 'grab';
    this.el.read.style.maxWidth = mode === 'full' ? 'calc(100% - 84px)' : 'calc(100% - 24px)';
    if (!this.io && window.IntersectionObserver) {
      var self = this;
      this.io = new IntersectionObserver(function (es) { self.visible = es.some(function (x) { return x.isIntersecting; }); self.updateRun(); });
    }
    /* unseen until the observer says otherwise, so a stage moved into the
       lot is never revealed there before its first report */
    if (moved && this.io) { this.visible = false; this.io.disconnect(); this.io.observe(this.el.root); }
    if (!this.ro && window.ResizeObserver) { var me = this; this.ro = new ResizeObserver(function () { me.resize(); }); }
    if (moved && this.ro) { this.ro.disconnect(); this.ro.observe(this.el.root); }
    if (!this.ready) { this.buildNear(); return; }
    if (!this.tokOk) this.setTheme();
    this.resize();
    if (modeChanged) this.enterMode(moved);
    this.updateRun();
  };
  P.detach = function () {
    this.host = null;
    this.stop();
  };
  P.setModel = function (m) {
    if (!m) return;
    if (this.model && this.model.key === m.key) return;
    this.model = m;
    this.el.slider.setAttribute('aria-label', m.aria || 'The long weather');
    if (this.ready) { this.buildContent(); this.enterMode(false); this.kick(); }
  };
  P.setTheme = function () {
    if (!this.ready) return;
    var tk = readTokens(this.el.root);
    if (!tk) { this.tokOk = false; return; }
    this.tok = tk; this.tokOk = true;
    this.applyTheme();
    this.buildContent();
    this.kick();
  };
  P.fail = function (why) {
    if (this.failed) return;
    this.failed = true;
    try { this.destroy(); } catch (e) {
      this.stop();
      if (this.el.root.parentNode) this.el.root.parentNode.removeChild(this.el.root);
    }
    if (this.o.onFail) this.o.onFail(why || 'failed');
  };
  /* A stage is built when it is about to be seen, not when it is mounted: the
     phone mounts every section at once, and three scenes compiling together
     held every one of them behind Loading. The margin reaches one page to
     either side, so the chart beside the one in view is ready before a
     swipe gets there. */
  P.buildNear = function () {
    if (this.ready || this.building) return;
    if (!window.IntersectionObserver) { this.build(); return; }
    var self = this;
    if (!this.nio) {
      this.nio = new IntersectionObserver(function (es) {
        if (!es.some(function (x) { return x.isIntersecting; })) return;
        self.nio.disconnect(); self.nio = null;
        self.build();
      }, { rootMargin: '25% 100%' });
    }
    this.nio.disconnect();
    this.nio.observe(this.el.root);
  };
  /* The shaders are compiled before the first frame, in parallel where the
     browser offers KHR_parallel_shader_compile, rather than on the first
     render, which linked every program on the main thread and froze the page
     for seconds with the stage dark behind its veil. */
  P.warmUp = function () {
    if (this._warming) return;
    this._warming = true;
    var self = this, r = this.r, jobs = [];
    var done = function () { self._warming = false; self.warm = true; if (!self.failed) self.kick(); };
    /* compile() walks only what is visible, and the layout not showing is
       hidden: shown for the call, so its programs are linked now too */
    var hid = [];
    [this.content, this.orb].forEach(function (g) { if (g) g.traverse(function (x) { if (!x.visible) { hid.push(x); x.visible = true; } }); });
    try {
      jobs.push(r.compileAsync(this.scene, this.cam));
      if (this.post && this.quad) [this.mBright, this.mBlur, this.mComp].forEach(function (m) { self.quad.material = m; jobs.push(r.compileAsync(self.postScene, self.postCam)); });
    } catch (e) { hid.forEach(function (x) { x.visible = false; }); done(); return; }
    hid.forEach(function (x) { x.visible = false; });
    this._warmJobs = Promise.all(jobs);
    this._warmJobs.then(done, done);
  };
  /* Built now, wherever it is: the app builds the stage in its offscreen lot
     before the reader asks for 3D, which buildNear() would wait on forever. */
  P.prebuild = function () {
    if (this.ready || this.building || this.failed) return;
    if (this.nio) { this.nio.disconnect(); this.nio = null; }
    this.build();
  };
  P.build = function () {
    if (this.building || this.ready) return;
    this.building = true;
    var self = this;
    /* The faces are asked for beside three.js, not after it, so when they are
       in first the content is built once, in them, rather than once in the
       fallback face and again when they land. */
    var early = readTokens(this.el.root);
    if (early) waitFaces(early).then(function () { if (!self.ready && !self.failed) self.fontsOk = true; });
    load().then(function () {
      self.building = false;
      if (self.failed) return;
      try { self.init(); } catch (e) { self.fail('init'); return; }
      if (self.host) {
        if (!self.tokOk) self.setTheme();
        self.resize();
        self.enterMode(true);
        self.updateRun();
        self.kick();
      }
      /* Shown only once the faces are in, so its labels never jump. */
      var faces = function () { if (self.fontsOk || self.failed) return; self.fontsOk = true; if (self.ready) { self.buildContent(); self.kick(); } };
      waitFaces(self.tok).then(faces); setTimeout(faces, 3000);
    }, function () { self.building = false; self.fail('load'); });
  };

  P.init = function () {
    if (T.ColorManagement) T.ColorManagement.enabled = false;
    var cv = this.el.canvas, self = this;
    var r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'default' });
    r.outputColorSpace = T.LinearSRGBColorSpace;
    r.toneMapping = T.NoToneMapping;
    /* Reading a program's link status and logs is a round trip that waits for
       the compile, so on WebKit every program queued behind the last one. */
    if (GFX.ios && r.debug) r.debug.checkShaderErrors = false;
    this.r = r;
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); self.fail('lost'); });
    this.half = r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float');
    var phone = Math.min(window.innerWidth || 1440, window.innerHeight || 900) < 600;
    this.level = phone ? 1 : 0;
    this.tok = readTokens(this.el.root);
    this.tokOk = !!this.tok;
    if (!this.tok) this.tok = DEFAULT_TOK;

    this.scene = new T.Scene();
    this.cam = new T.PerspectiveCamera(34, 2, 0.1, 400);
    this.scene.add(this.cam);
    this.U = {
      uCam: { value: new T.Vector3() }, uFog: { value: 0.03 }, uTime: { value: 0 }, uGlow: { value: 1 }, uBreath: { value: 0 },
      uPR: { value: 1 }, uOrb: { value: 0 }
    };
    this.world = new T.Group(); this.scene.add(this.world);
    this.content = null;

    /* The sky dome follows the camera, so it reads as infinitely far. */
    this.skyMat = new T.ShaderMaterial({ vertexShader: V_SKY, fragmentShader: F_SKY, side: T.BackSide, depthWrite: false,
      uniforms: { uBg: { value: new T.Vector3() }, uA: { value: new T.Vector3() }, uB: { value: new T.Vector3() }, uC3: { value: new T.Vector3() }, uAtmo: { value: 0.6 }, uTime: this.U.uTime } });
    this.sky = new T.Mesh(new T.SphereGeometry(150, 32, 16), this.skyMat);
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);

    /* A field of distant stars on the dome. */
    var n = phone ? 700 : 1300, pos = new Float32Array(n * 3), sz = new Float32Array(n), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var u = Math.random(), v = Math.random() * 0.9 + 0.05, th = u * Math.PI * 2, ph = Math.acos(1 - v);
      pos[i * 3] = Math.sin(ph) * Math.cos(th) * 120; pos[i * 3 + 1] = Math.cos(ph) * 120 - 6; pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 120;
      sz[i] = 6 + Math.pow(Math.random(), 3) * 26;
    }
    var sg = new T.BufferGeometry();
    sg.setAttribute('position', new T.BufferAttribute(pos, 3));
    sg.setAttribute('aSize', new T.BufferAttribute(sz, 1));
    sg.setAttribute('aCol', new T.BufferAttribute(col, 3));
    this.starCol = col;
    this.stars = new T.Points(sg, new T.ShaderMaterial({ vertexShader: V_POINTS, fragmentShader: F_POINTS, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uPR: this.U.uPR, uScale: { value: 60 }, uTime: this.U.uTime, uI: { value: 0.8 } } }));
    this.stars.renderOrder = -9;
    this.scene.add(this.stars);

    /* The floor. It writes no depth, so the arches' reflections show in it. */
    this.floorMat = new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_FLOOR, depthWrite: false,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uBreath: this.U.uBreath, uBg: { value: new T.Vector3() }, uLine: { value: new T.Vector3() }, uA: { value: new T.Vector3() },
        uHi: { value: new T.Vector3() }, uBlue: { value: new T.Vector3() }, uX0: { value: 0 }, uU: { value: U }, uNowX: { value: 0 }, uProbeX: { value: 0 },
        uProbeOn: { value: 0 }, uPtr: { value: new T.Vector2(0, 0) }, uPtrOn: { value: 0 }, uLanes: { value: new T.Vector4(-6.5, -1.3, 1.4, 4.2) } } });
    var fl = new T.Mesh(new T.PlaneGeometry(400, 120), this.floorMat);
    fl.rotation.x = -Math.PI / 2;
    fl.renderOrder = -5;
    this.floor = fl;
    this.scene.add(fl);

    /* Dust in the air above the lanes, drifting up and leaning toward the
       pointer as curiosity rises. */
    var dn = phone ? 380 : 700, dp = new Float32Array(dn * 3), dr = new Float32Array(dn);
    for (var j = 0; j < dn; j++) { dp[j * 3] = (Math.random() - 0.5) * 70; dp[j * 3 + 1] = Math.random() * 5.5; dp[j * 3 + 2] = -8 + Math.random() * 13; dr[j] = Math.random(); }
    var dg = new T.BufferGeometry();
    dg.setAttribute('position', new T.BufferAttribute(dp, 3));
    dg.setAttribute('aR', new T.BufferAttribute(dr, 1));
    this.dustMat = new T.ShaderMaterial({ vertexShader: V_DUST, fragmentShader: F_DUST, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uDrift: { value: 0 }, uTime: this.U.uTime, uPtr: { value: new T.Vector3(0, 0, -30) }, uAttract: { value: 0 }, uPR: this.U.uPR,
        uC1: { value: new T.Vector3() }, uC2: { value: new T.Vector3() }, uAlpha: { value: 0.55 } } });
    this.dust = new T.Points(dg, this.dustMat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);

    /* Now, and the probe the reader drags. */
    var pg = new T.PlaneGeometry(1, 1); pg.translate(0, 0.5, 0);
    this.pillarGeo = pg;
    this.nowMat = this.pillarMat(this.tok.hi, 1.0, 26);
    this.now = new T.Mesh(pg, this.nowMat); this.now.scale.set(1.1, 4.2, 1); this.now.position.z = TARGET_Z + 0.4;
    this.scene.add(this.now);
    this.probeMat = this.pillarMat(this.tok.tx, 0, 60);
    this.probe = new T.Mesh(pg, this.probeMat); this.probe.scale.set(0.8, 3.6, 1); this.probe.position.z = TARGET_Z + 0.4;
    this.scene.add(this.probe);

    this.ray = new T.Raycaster();
    this.post = null;
    this.buildOrrery();
    this.applyTheme();
    this.buildContent();
    this.ready = true;
  };

  P.pillarMat = function (c, i, core) {
    return new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_PILLAR, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uC: { value: v3(c) }, uI: { value: i }, uCore: { value: core } } });
  };

  P.applyTheme = function () {
    var t = this.tok;
    this.r.setClearColor(new T.Color(t.bg[0], t.bg[1], t.bg[2]), 1);
    var sk = this.skyMat.uniforms;
    sk.uBg.value.set(t.bg[0], t.bg[1], t.bg[2]); sk.uA.value.set(t.atm[0], t.atm[1], t.atm[2]);
    sk.uB.value.set(t.atm2[0], t.atm2[1], t.atm2[2]); sk.uC3.value.set(t.atm3[0], t.atm3[1], t.atm3[2]); sk.uAtmo.value = t.atmo;
    var fu = this.floorMat.uniforms, lift = mix3(t.bg, t.atm, 0.06);
    fu.uBg.value.set(lift[0], lift[1], lift[2]); fu.uLine.value.set(t.tx[0], t.tx[1], t.tx[2]); fu.uA.value.set(t.atm[0], t.atm[1], t.atm[2]);
    fu.uHi.value.set(t.hi[0], t.hi[1], t.hi[2]); fu.uBlue.value.set(t.blue[0], t.blue[1], t.blue[2]);
    var du = this.dustMat.uniforms; du.uC1.value.set(t.tx[0], t.tx[1], t.tx[2]); du.uC2.value.set(t.atm2[0], t.atm2[1], t.atm2[2]);
    this.nowMat.uniforms.uC.value.set(t.hi[0], t.hi[1], t.hi[2]);
    this.probeMat.uniforms.uC.value.set(t.tx[0], t.tx[1], t.tx[2]);
    var c = this.starCol;
    for (var i = 0; i < c.length / 3; i++) { var k = (i * 0.61803) % 1, a = k < 0.7 ? t.tx : k < 0.88 ? t.atm2 : t.hi; c[i * 3] = a[0] * 0.8; c[i * 3 + 1] = a[1] * 0.8; c[i * 3 + 2] = a[2] * 0.8; }
    this.stars.geometry.attributes.aCol.needsUpdate = true;
    this.orreryTheme();
  };

  /* ---- Labels: text drawn once to a canvas, held at a fixed pixel size ---- */
  P.label = function (text, o) {
    var c = document.createElement('canvas'), g = c.getContext('2d'), k = 2;
    var px = o.px || 12, font = (o.weight || 400) + ' ' + Math.round(px * k) + 'px ' + (o.font || this.tok.fu);
    g.font = font;
    if (o.caps) text = String(text).toUpperCase();
    var w = Math.max(4, Math.ceil(g.measureText(text).width + px * k * (o.glow ? 1.4 : 0.6))), h = Math.ceil(px * k * 1.6);
    c.width = w; c.height = h;
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = px * k * 0.7; }
    g.fillStyle = o.color || this.tok.cTx;
    g.fillText(text, w / 2, h / 2 + px * k * 0.04);
    var tex = new T.CanvasTexture(c); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
    var mat = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: o.depthTest !== false, sizeAttenuation: false, opacity: o.opacity == null ? 1 : o.opacity });
    var s = new T.Sprite(mat);
    s.center.set(0.5, o.anchorY == null ? 0.5 : o.anchorY);
    s.userData.lab = { px: px * 1.6, aspect: w / h };
    s.userData.op0 = mat.opacity;
    s.renderOrder = 5;
    this.labels.push(s);
    this.sizeLabel(s);
    return s;
  };
  P.sizeLabel = function (s) {
    var L = s.userData.lab, H = this.H || 300, f = 2 * Math.tan(this.cam ? this.cam.fov * Math.PI / 360 : 0.3);
    var h = L.px / H * f * (L.k || 1);
    s.scale.set(h * L.aspect, h, 1);
  };

  /* ---- The landscape, rebuilt when the model or the palette changes ------- */
  P.x = function (t) { return (t - this.model.now) / YEAR * U; };
  P.t = function (x) { return this.model.now + x / U * YEAR; };
  /* Materials wait for a warm-up still in flight: compileAsync() polls each
     one's program until it reports ready, and a material disposed under that
     poll makes three.js throw an uncaught TypeError ("reading 'isReady'").
     A rebuild of the content while the stage is still warming is one way in,
     a shell swap destroying the stage is the other (see destroy). Geometry
     is not polled, so it goes at once. */
  P.dispose = function (obj) {
    var labels = this.labels, mats = [];
    obj.traverse(function (o) {
      if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
      if (o.material) mats.push(o.material);
      if (o.isSprite) { var i = labels.indexOf(o); if (i !== -1) labels.splice(i, 1); }
    });
    var free = function () { mats.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); };
    if (this._warming && this._warmJobs) this._warmJobs.then(free, free); else free();
  };
  function pack(items, max) {
    var ends = [], rows = {};
    items.slice().sort(function (a, b) { return a.from - b.from; }).forEach(function (it) {
      var r = -1;
      for (var i = 0; i < ends.length; i++) if (ends[i] < it.from - 20 * DAY) { r = i; break; }
      if (r === -1) r = ends.length < max ? ends.length : max - 1;
      ends[r] = Math.max(ends[r] || 0, it.to);
      rows[it.id] = r;
    });
    return rows;
  }
  P.buildContent = function () {
    if (!this.model || !this.r) return;
    if (this.content) { this.world.remove(this.content); this.dispose(this.content); }
    [this._slabGeo, this._curGeo, this._tileGeo].forEach(function (x) { if (x) x.dispose(); });
    var m = this.model, tk = this.tok, g = new T.Group(), self = this, now = m.now;
    this.content = g; this.picks = []; this.items = {};
    this.world.add(g);
    var miniStars = m.stars.filter(function (s) { return s.mini; }), miniDes = m.design.filter(function (d) { return d.mini; });
    var rowS = { mini: pack(miniStars, 3), full: pack(m.stars, 5) }, rowD = { mini: pack(miniDes, 2), full: pack(m.design, 3) };
    var fullRows = 1, fullDRows = 1;
    Object.keys(rowS.full).forEach(function (k) { fullRows = Math.max(fullRows, rowS.full[k] + 1); });
    Object.keys(rowD.full).forEach(function (k) { fullDRows = Math.max(fullDRows, rowD.full[k] + 1); });
    this.laneBack = STAR_Z0 - STAR_DZ * (fullRows - 1) - 0.6;
    this.floorMat.uniforms.uLanes.value.set(this.laneBack, DES_Z0 - 0.45, DES_Z0 + DES_DZ * (fullDRows - 1) + 0.45, YEAR_Z + 0.4);
    var jan = new Date(new Date(now).getFullYear(), 0, 1).getTime();
    this.floorMat.uniforms.uX0.value = this.x(jan);

    /* Stars: one arch per passage. */
    m.stars.forEach(function (s) {
      var x0 = self.x(s.from), x1 = self.x(Math.max(s.to, s.from + 25 * DAY)), w = x1 - x0;
      var h = 0.55 + Math.min(1.7, s.weight * 0.15);
      var shape = function (u) { return h * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * u - 1), 2.6)), 0.6); };
      var pts = [];
      for (var i = 0; i <= 40; i++) { var u = i / 40; pts.push(new T.Vector3(u * w, shape(u), 0)); }
      var curve = new T.CatmullRomCurve3(pts);
      var segs = Math.max(24, Math.min(140, Math.round(w * 22)));
      var cA = s.hard ? tk.ac2 : tk.atm, cB = s.hard ? tk.hi : tk.ac2;
      /* The passages the audit reads, and any under way, are the ones lit; the
         rest of the twenty years stand behind them, quieter, in the full view. */
      var dim = s.past ? 0.3 : s.mini ? 1 : 0.4;
      var grp = new T.Group(); grp.position.x = x0;
      var mk = function (radius, shell, mirror) {
        var mat = new T.ShaderMaterial({ vertexShader: V_ARCH, fragmentShader: F_ARCH, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
          uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uTime: self.U.uTime, uGlow: self.U.uGlow, uA: { value: v3(cA) }, uB: { value: v3(cB) },
            uHover: { value: 0 }, uLive: { value: s.now ? 1 : 0 }, uMirror: { value: mirror ? 1 : 0 }, uShell: { value: shell ? 1 : 0 }, uDim: { value: dim } } });
        var mesh = new T.Mesh(new T.TubeGeometry(curve, segs, radius, shell ? 10 : 7, false), mat);
        if (mirror) mesh.scale.y = -1;
        grp.add(mesh);
        return mesh;
      };
      var core = mk(0.04, false, false), shell = mk(0.2, true, false), mir = mk(0.04, false, true);
      shell.userData.pick = { kind: 'star', id: s.id };
      self.picks.push(shell);
      (s.passes || []).forEach(function (p) {
        var px = self.x(p) - x0, u = clamp(px / w, 0, 1), y = shape(u);
        var pil = new T.Mesh(self.pillarGeo, self.pillarMat(tk.tx, 0.85 * dim, 48));
        pil.userData.sharedGeo = true;
        pil.position.set(px, 0, 0); pil.scale.set(0.42, y + 0.55, 1);
        pil.userData.bill = true;
        grp.add(pil);
      });
      if (s.passes && s.passes.length) {
        var np = new Float32Array(s.passes.length * 3), ns = new Float32Array(s.passes.length), nc = new Float32Array(s.passes.length * 3);
        s.passes.forEach(function (p, k) {
          var px = self.x(p) - x0; np[k * 3] = px; np[k * 3 + 1] = shape(clamp(px / w, 0, 1)); np[k * 3 + 2] = 0; ns[k] = 34;
          nc[k * 3] = tk.tx[0] * dim; nc[k * 3 + 1] = tk.tx[1] * dim; nc[k * 3 + 2] = tk.tx[2] * dim;
        });
        var ng = new T.BufferGeometry();
        ng.setAttribute('position', new T.BufferAttribute(np, 3)); ng.setAttribute('aSize', new T.BufferAttribute(ns, 1)); ng.setAttribute('aCol', new T.BufferAttribute(nc, 3));
        grp.add(new T.Points(ng, new T.ShaderMaterial({ vertexShader: V_POINTS, fragmentShader: F_POINTS, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
          uniforms: { uPR: self.U.uPR, uScale: { value: 3.2 }, uTime: self.U.uTime, uI: { value: 1 } } })));
      }
      var gl = self.label(s.glyph, { px: 15, font: tk.fd, color: dim < 1 ? tk.cMut : tk.cHi, glow: tk.cBg, anchorY: 0, opacity: dim < 1 ? 0.6 : 1 });
      gl.position.set(w / 2, h + 0.18, 0);
      grp.add(gl);
      grp.userData = { kind: 'star', item: s, z: { mini: STAR_Z0 - STAR_DZ * (rowS.mini[s.id] || 0), full: STAR_Z0 - STAR_DZ * rowS.full[s.id] }, mini: !!s.mini, core: core, shell: shell, mirror: mir, hover: 0 };
      grp.position.z = grp.userData.z.full;
      g.add(grp);
      self.items[s.id] = grp;
    });

    /* Design: a lit slab where a slow body sits on one of the reader's gates,
       an outline where it completes a channel with one. */
    var slabGeo = new T.BoxGeometry(1, 1, 1); slabGeo.translate(0.5, 0.5, 0);
    var curGeo = new T.PlaneGeometry(1, 1); curGeo.translate(0.5, 0.5, 0);
    m.design.forEach(function (d) {
      var x0 = self.x(d.from), w = Math.max(0.12, self.x(d.to) - x0), dim = d.past ? 0.4 : 1;
      var grp = new T.Group(); grp.position.x = x0;
      var mat = new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_SLAB, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uGlow: self.U.uGlow, uC: { value: v3(tk.blue) }, uFill: { value: d.own ? 1 : 0.06 }, uHover: { value: 0 }, uLive: { value: d.now ? 1 : 0 }, uDim: { value: dim } } });
      var slab = new T.Mesh(slabGeo, mat); slab.userData.sharedGeo = true;
      slab.scale.set(w, 0.07, 0.36); slab.position.z = -0.18;
      slab.userData.pick = { kind: 'design', id: d.id };
      self.picks.push(slab);
      grp.add(slab);
      var cm = new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_CURTAIN, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
        uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uTime: self.U.uTime, uC: { value: v3(tk.blue) }, uI: { value: (d.own ? 0.2 : 0.08) * dim }, uHover: { value: 0 } } });
      var cur = new T.Mesh(curGeo, cm); cur.userData.sharedGeo = true;
      cur.scale.set(w, d.own ? 1.1 : 0.7, 1);
      grp.add(cur);
      var lb = self.label(String(d.gate), { px: 10.5, weight: 600, color: d.past ? tk.cMut : tk.cBlue, glow: tk.cBg, anchorY: 0 });
      lb.position.set(Math.min(w / 2, 0.5), 0.12, 0.2);
      lb.userData.fullOnly = true;
      grp.add(lb);
      grp.userData = { kind: 'design', item: d, z: { mini: DES_Z0 + DES_DZ * (rowD.mini[d.id] || 0), full: DES_Z0 + DES_DZ * rowD.full[d.id] }, mini: !!d.mini, slab: slab, curtain: cur, hover: 0 };
      grp.position.z = grp.userData.z.full;
      g.add(grp);
      self.items[d.id] = grp;
    });
    this._slabGeo = slabGeo; this._curGeo = curGeo;

    /* Numbers: one tile per year, as tall as its Personal Year; the pinnacles
       as a band on the floor in front of them. */
    var tileGeo = new T.BoxGeometry(1, 1, 1); tileGeo.translate(0, 0.5, 0);
    var base = mix3(tk.bg, tk.atm, 0.18);
    var yearNow = new Date(now).getFullYear();
    m.years.forEach(function (y) {
      var a = new Date(y.y, 0, 1).getTime(), b = new Date(y.y + 1, 0, 1).getTime(), xc = (self.x(a) + self.x(b)) / 2;
      var v = y.v, hgt = v == null ? 0.06 : y.master ? 0.95 : 0.12 + Math.min(9, v) / 9 * 0.6;
      var mat = new T.ShaderMaterial({ vertexShader: V_TILE, fragmentShader: F_TILE,
        uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uBreath: self.U.uBreath, uGlow: self.U.uGlow, uBase: { value: v3(base) }, uBg: { value: v3(tk.bg) },
          uC: { value: v3(y.master ? tk.hi : mix3(tk.ac2, tk.atm, 0.35)) }, uHover: { value: 0 }, uOn: { value: y.y === yearNow ? 1 : 0 } } });
      var tile = new T.Mesh(tileGeo, mat); tile.userData.sharedGeo = true;
      tile.scale.set(U * 0.84, hgt, 0.9);
      tile.position.set(xc, 0, TILE_Z);
      tile.userData.pick = { kind: 'year', id: 'y' + y.y };
      self.picks.push(tile);
      g.add(tile);
      if (v != null) {
        var dl = self.label(String(v), { px: y.y === yearNow ? 17 : 14, font: tk.fd, color: y.master || y.y === yearNow ? tk.cHi : tk.cTx, glow: tk.cBg, anchorY: 0 });
        dl.position.set(xc, hgt + 0.08, TILE_Z);
        g.add(dl);
      }
      var yl = self.label(String(y.y), { px: 10.5, weight: y.y === yearNow ? 700 : 500, color: y.y === yearNow ? tk.cHi : tk.cMut });
      yl.position.set(xc, 0.02, YEAR_Z);
      yl.userData.year = y.y;
      g.add(yl);
      self.items['y' + y.y] = { userData: { kind: 'year', item: y, tile: tile, hover: 0 }, position: tile.position };
    });
    this._tileGeo = tileGeo;
    (m.pins || []).forEach(function (p, i) {
      var x0 = self.x(Math.max(p.from, m.span.from)), x1 = self.x(Math.min(p.to, m.span.to));
      if (x1 <= x0) return;
      var mat = new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_SLAB, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uGlow: self.U.uGlow, uC: { value: v3(tk.atm) }, uFill: { value: i % 2 ? 0.55 : 0.3 }, uHover: { value: 0 }, uLive: { value: 0 }, uDim: { value: 0.55 } } });
      var band = new T.Mesh(slabGeo, mat); band.userData.sharedGeo = true;
      band.scale.set(x1 - x0 - 0.06, 0.02, 0.34); band.position.set(x0 + 0.03, 0, PIN_Z - 0.17);
      g.add(band);
      var pl = self.label('Pinnacle ' + p.v, { px: 10, weight: 600, color: tk.cTx, glow: tk.cBg, anchorY: 0 });
      pl.position.set(x0 + 0.9, 0.05, PIN_Z);
      g.add(pl);
    });
    var nl = this.label('Now', { px: 10, weight: 700, caps: true, color: tk.cHi, glow: tk.cBg, anchorY: 0 });
    nl.position.set(0, 4.3, TARGET_Z + 0.4);
    g.add(nl);
    this.nowLabel = nl;
    if (this.probeLabel) { this.scene.remove(this.probeLabel); this.dispose(this.probeLabel); this.probeLabel = null; this._probeTxt = null; }
    this.now.position.x = 0;
    this.floorMat.uniforms.uNowX.value = 0;
    this.buildOrbit();
    this.applyModeVisibility();
    this.orreryNatal();
  };

  P.applyModeVisibility = function () {
    if (!this.content) return;
    var full = this.mode === 'full';
    this.content.traverse(function (o) {
      if (o.userData && o.userData.fullOnly) o.visible = full;
      if (o.userData && (o.userData.kind === 'star' || o.userData.kind === 'design')) o.visible = full || o.userData.mini;
    });
    if (this.orrery) this.orrery.visible = full;
    if (this.orb) this.orb.traverse(function (o) {
      if (o.userData && o.userData.fullOnly) o.visible = full;
      if (o.userData && o.userData.ob) o.visible = full || o.userData.ob.mini;
    });
  };

  /* ---- The sky wheel, in the full view ------------------------------------ */
  P.buildOrrery = function () {
    var o = new T.Group(), R = 1;
    this.orrery = o; this.orR = R;
    var mk = function (r, w) { return new T.Mesh(new T.RingGeometry(r - w, r + w, 160), new T.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, side: T.DoubleSide })); };
    this.orRingA = mk(R, 0.008); this.orRingB = mk(R * 0.84, 0.005);
    o.add(this.orRingA); o.add(this.orRingB);
    var tp = new Float32Array(12 * 6);
    for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; tp.set([Math.cos(a) * R * 0.84, Math.sin(a) * R * 0.84, 0, Math.cos(a) * R, Math.sin(a) * R, 0], i * 6); }
    var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.BufferAttribute(tp, 3));
    this.orTicks = new T.LineSegments(tg, new T.LineBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    o.add(this.orTicks);
    var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(8 * 6), 3)); lg.setAttribute('color', new T.BufferAttribute(new Float32Array(8 * 6), 3));
    lg.setDrawRange(0, 0);
    this.orLines = new T.LineSegments(lg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    o.add(this.orLines);
    var mg = new T.BufferGeometry(); mg.setAttribute('position', new T.BufferAttribute(new Float32Array(4 * 3), 3));
    mg.setAttribute('aSize', new T.BufferAttribute(new Float32Array([30, 30, 30, 30]), 1)); mg.setAttribute('aCol', new T.BufferAttribute(new Float32Array(12), 3));
    this.orMovers = new T.Points(mg, new T.ShaderMaterial({ vertexShader: V_POINTS, fragmentShader: F_POINTS, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending,
      uniforms: { uPR: this.U.uPR, uScale: { value: 7 }, uTime: this.U.uTime, uI: { value: 1 } } }));
    this.orMovers.frustumCulled = false;
    o.add(this.orMovers);
    o.renderOrder = 20;
    o.traverse(function (x) { x.renderOrder = 20; });
    o.visible = false;
    this.cam.add(o);
    this.orNatal = new T.Group(); o.add(this.orNatal);
    this.orGlyphs = new T.Group(); o.add(this.orGlyphs);
  };
  P.orreryTheme = function () {
    var t = this.tok;
    this.orRingA.material.color.setRGB(t.ac2[0] * 0.9, t.ac2[1] * 0.9, t.ac2[2] * 0.9);
    this.orRingB.material.color.setRGB(t.atm[0] * 0.6, t.atm[1] * 0.6, t.atm[2] * 0.6);
    this.orTicks.material.color.setRGB(t.tx[0] * 0.28, t.tx[1] * 0.28, t.tx[2] * 0.28);
    var mc = this.orMovers.geometry.attributes.aCol;
    for (var i = 0; i < 4; i++) mc.setXYZ(i, t.hi[0], t.hi[1], t.hi[2]);
    mc.needsUpdate = true;
  };
  P.orAngle = function (lon) {
    var asc = this.model && this.model.asc != null ? this.model.asc : 0;
    return Math.PI + (lon - asc) * Math.PI / 180;
  };
  P.orreryNatal = function () {
    if (!this.orrery || !this.model) return;
    var self = this, R = this.orR, tk = this.tok;
    this._orScale = null;
    [this.orNatal, this.orGlyphs].forEach(function (grp) { while (grp.children.length) { var c = grp.children.pop(); self.dispose(c); } });
    var nat = this.model.natal || [];
    if (nat.length) {
      var np = new Float32Array(nat.length * 3), ns = new Float32Array(nat.length), nc = new Float32Array(nat.length * 3);
      nat.forEach(function (n, i) {
        var a = self.orAngle(n.lon);
        np.set([Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72, 0], i * 3); ns[i] = 20; nc.set([tk.tx[0] * 0.8, tk.tx[1] * 0.8, tk.tx[2] * 0.8], i * 3);
        var gl = self.label(n.glyph, { px: n.glyph.length > 1 ? 8.5 : 11, font: n.glyph.length > 1 ? tk.fu : tk.fd, weight: n.glyph.length > 1 ? 700 : 400, color: tk.cTx, depthTest: false });
        gl.position.set(Math.cos(a) * R * 0.58, Math.sin(a) * R * 0.58, 0); gl.renderOrder = 21;
        self.orNatal.add(gl);
      });
      var ng = new T.BufferGeometry();
      ng.setAttribute('position', new T.BufferAttribute(np, 3)); ng.setAttribute('aSize', new T.BufferAttribute(ns, 1)); ng.setAttribute('aCol', new T.BufferAttribute(nc, 3));
      var pts = new T.Points(ng, new T.ShaderMaterial({ vertexShader: V_POINTS, fragmentShader: F_POINTS, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending,
        uniforms: { uPR: this.U.uPR, uScale: { value: 7 }, uTime: this.U.uTime, uI: { value: 0.9 } } }));
      pts.renderOrder = 20; pts.frustumCulled = false;
      this.orNatal.add(pts);
    }
    var SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    SIGNS.forEach(function (sg, i) {
      var a = self.orAngle(i * 30 + 15), l = self.label(sg + '︎', { px: 8.5, font: tk.fd, color: tk.cMut, depthTest: false });
      l.position.set(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92, 0); l.renderOrder = 21;
      self.orNatal.add(l);
    });
    this.orMoverLabels = ['Saturn', 'Uranus', 'Neptune', 'Pluto'].map(function (nm) {
      var gly = { Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' }[nm];
      var l = self.label(gly + '︎', { px: 13, font: tk.fd, color: tk.cHi, glow: tk.cBg, depthTest: false });
      l.renderOrder = 22; self.orGlyphs.add(l); return { name: nm, label: l };
    });
    this._orT = null;
  };
  P.orreryAt = function (t) {
    if (!this.orrery || !this.model || !this.o.lonAt || this.mode !== 'full') return;
    var day = Math.round(t / DAY);
    if (this._orT === day) return;
    this._orT = day;
    var self = this, R = this.orR, pos = this.orMovers.geometry.attributes.position, lon = {};
    this.orMoverLabels.forEach(function (m, i) {
      var L = null;
      try { L = self.o.lonAt(m.name, t); } catch (e) { L = null; }
      if (L == null || !isFinite(L)) { pos.setXYZ(i, 0, 0, -50); m.label.visible = false; return; }
      lon[m.name] = L;
      var a = self.orAngle(L);
      pos.setXYZ(i, Math.cos(a) * R, Math.sin(a) * R, 0);
      m.label.visible = true;
      m.label.position.set(Math.cos(a) * R * 1.16, Math.sin(a) * R * 1.16, 0);
    });
    pos.needsUpdate = true;
    var act = this.model.stars.filter(function (s) { return s.from <= t && t <= s.to; }), lp = this.orLines.geometry.attributes.position, lc = this.orLines.geometry.attributes.color, n = 0, tk = this.tok;
    act.slice(0, 8).forEach(function (s) {
      var nat = (self.model.natal || []).find(function (x) { return x.name === s.natal; });
      if (!nat || lon[s.mover] == null) return;
      var a = self.orAngle(lon[s.mover]), b = self.orAngle(nat.lon), c = s.hard ? tk.hi : tk.atm2;
      lp.setXYZ(n * 2, Math.cos(a) * R, Math.sin(a) * R, 0); lp.setXYZ(n * 2 + 1, Math.cos(b) * R * 0.72, Math.sin(b) * R * 0.72, 0);
      lc.setXYZ(n * 2, c[0], c[1], c[2]); lc.setXYZ(n * 2 + 1, c[0] * 0.6, c[1] * 0.6, c[2] * 0.6);
      n++;
    });
    this.orLines.geometry.setDrawRange(0, n * 2);
    lp.needsUpdate = true; lc.needsUpdate = true;
  };
  P.placeOrrery = function () {
    if (!this.orrery || this.mode !== 'full') return;
    var hgt = 2 * 8 * Math.tan(this.cam.fov * Math.PI / 360), wid = hgt * this.cam.aspect;
    var small = wid < hgt * 1.15, R = small ? Math.min(0.62, wid * 0.17) : Math.min(1.15, hgt * 0.2);
    this.orrery.scale.setScalar(R);
    if (R !== this._orScale) {
      this._orScale = R;
      var self = this;
      this.orrery.traverse(function (x) { if (x.isSprite && x.userData.lab) { x.userData.lab.k = 1 / R; self.sizeLabel(x); } });
    }
    var px = small ? wid / 2 - R * 1.3 : wid / 2 - R * 1.45, py = small ? hgt / 2 - R * 2.6 : hgt / 2 - R * 1.5;
    this.orrery.position.set(px, py, -8);
    var yaw = this.ptr.on ? this.ptr.x * 0.12 : 0, pitch = this.ptr.on ? -this.ptr.y * 0.1 : 0;
    this.orrery.rotation.set(pitch, yaw, 0);
  };

  /* ---- Orbital: the same years as a sky ----------------------------------- */
  function sectorInto(A, r0, r1, a0, a1, segs, x0) {
    var base = A.pos.length / 3;
    for (var i = 0; i <= segs; i++) {
      var u = i / segs, a = a0 + (a1 - a0) * u, c = Math.cos(a), sn = -Math.sin(a);
      A.pos.push(c * r0, 0, sn * r0, c * r1, 0, sn * r1);
      A.ap.push(x0 + u, 0, x0 + u, 1);
      if (i) { var b = base + (i - 1) * 2; A.idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    }
  }
  function stripInto(A, pts, cols, u, w) {
    var n = pts.length / 2, base = A.pos.length / 3;
    for (var i = 0; i < n; i++) {
      var i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
      var tx = pts[i1 * 2] - pts[i0 * 2], tz = pts[i1 * 2 + 1] - pts[i0 * 2 + 1], L = Math.hypot(tx, tz) || 1;
      var nx = -tz / L * w / 2, nz = tx / L * w / 2, x = pts[i * 2], z = pts[i * 2 + 1];
      A.pos.push(x + nx, 0, z + nz, x - nx, 0, z - nz);
      if (cols) A.col.push(cols[i * 3], cols[i * 3 + 1], cols[i * 3 + 2], cols[i * 3], cols[i * 3 + 1], cols[i * 3 + 2]);
      A.ap.push(u[i], 1, u[i], -1);
      if (i) { var b = base + (i - 1) * 2; A.idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
  }
  function geoOf(A) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(A.pos, 3));
    g.setAttribute('aP', new T.Float32BufferAttribute(A.ap, 2));
    if (A.col && A.col.length) g.setAttribute('aCol', new T.Float32BufferAttribute(A.col, 3));
    g.setIndex(A.idx);
    return g;
  }
  function circleInto(pos, col, r, c, segs) {
    for (var i = 0; i < segs; i++) {
      var a = i / segs * Math.PI * 2, b = (i + 1) / segs * Math.PI * 2;
      pos.push(Math.cos(a) * r, 0, -Math.sin(a) * r, Math.cos(b) * r, 0, -Math.sin(b) * r);
      col.push(c[0], c[1], c[2], c[0], c[1], c[2]);
    }
  }
  /* Time runs outward across a body's band, the whole span from its inner
     edge to its outer one; longitude runs round, from the app's own path. */
  P.obR = function (mv, t) {
    var b = OB[mv], sp = this.model.span;
    return b[0] + (b[1] - b[0]) * clamp((t - sp.from) / (sp.to - sp.from), 0, 1);
  };
  P.obLon = function (mv, t) {
    var p = this.model.paths && this.model.paths[mv];
    if (!p || !p.lon || p.lon.length < 2) return null;
    var x = clamp((t - p.t0) / p.dt, 0, p.lon.length - 1.0001), i = Math.floor(x), u = x - i;
    return p.lon[i] + (p.lon[i + 1] - p.lon[i]) * u;
  };
  P.obPt = function (mv, t) {
    var L = this.obLon(mv, t);
    if (L == null) return null;
    var a = this.orAngle(L), r = this.obR(mv, t);
    return [Math.cos(a) * r, -Math.sin(a) * r];
  };
  /* A year's tint, as the Rings view paints it: alternate years in two tones
     of the sky, so the path reads in years like tree rings, and a master
     year in violet. A number is a category, so no tint grows with it. */
  P.pyCol = function (y) {
    var tk = this.tok, yr = this._py && this._py[y];
    if (yr && yr.master) return tk.hi;
    var c = mix3(tk.atm, tk.tx, 0.3), k = y % 2 ? 1 : 0.55;
    return [c[0] * k, c[1] * k, c[2] * k];
  };
  P.secMat = function (c, size, fill, edge, dim) {
    return new T.ShaderMaterial({ vertexShader: V_OSEC, fragmentShader: F_OSEC, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { uC: { value: v3(c) }, uSize: { value: new T.Vector2(size[0], size[1]) }, uFill: { value: fill }, uEdge: { value: edge },
        uHover: { value: 0 }, uLive: { value: 0 }, uDim: { value: dim == null ? 1 : dim }, uOrb: this.U.uOrb } });
  };
  P.obLines = function (pos, col, op) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    var mt = new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, opacity: 0 });
    mt.userData.op0 = op == null ? 1 : op;
    this.obLineMats.push(mt);
    var l = new T.LineSegments(g, mt);
    l.frustumCulled = false; l.renderOrder = 3;
    return l;
  };
  P.obPoints = function (n) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aSize', new T.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('aCol', new T.BufferAttribute(new Float32Array(n * 3), 3));
    var p = new T.Points(g, new T.ShaderMaterial({ vertexShader: V_POINTS, fragmentShader: F_POINTS, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending,
      uniforms: { uPR: this.U.uPR, uScale: { value: 14 }, uTime: this.U.uTime, uI: this.U.uOrb } }));
    p.frustumCulled = false; p.renderOrder = 4;
    return p;
  };
  P.buildOrbit = function () {
    if (this.orb) { this.world.remove(this.orb); this.dispose(this.orb); this.orb = null; }
    var m = this.model;
    if (!m) return;
    var tk = this.tok, self = this, TAU = Math.PI * 2, span = m.span, o = new T.Group();
    this.orb = o; this.world.add(o);
    this.obLineMats = []; this.obItems = []; this.obLive = []; this._obT = null; this._obYr = null; this.obYrLab = null; this._fadeK = null;
    this.orbX = (this.x(m.mini.from) + this.x(m.mini.to)) / 2;
    o.position.set(this.orbX, 0.02, TARGET_Z);
    o.visible = this.orbI > 0.001;
    this._py = {};
    m.years.forEach(function (y) { self._py[y.y] = y; });
    var dimTx = function (k) { return [tk.tx[0] * k, tk.tx[1] * k, tk.tx[2] * k]; };
    var lab = function (text, opt, x, z, flag, parent) {
      var l = self.label(text, opt);
      l.position.set(x, 0.05, z); l.renderOrder = 6;
      if (flag) l.userData[flag] = true;
      (parent || o).add(l);
      return l;
    };
    var A;

    /* The bands, one per slow body, and a faint ring at every New Year. */
    OB_ORDER.forEach(function (mv) {
      var b = OB[mv], B = { pos: [], ap: [], idx: [] };
      sectorInto(B, b[0], b[1], 0, TAU, 180, 0);
      var bm = new T.Mesh(geoOf(B), self.secMat(tk.atm, [1e4, b[1] - b[0]], 0.035, 0.28, 1));
      bm.renderOrder = 1; o.add(bm);
    });
    var yp = [], yc = [], y0 = new Date(span.from).getFullYear(), y1 = new Date(span.to).getFullYear(), y, t;
    for (y = y0 + 1; y <= y1; y++) {
      t = new Date(y, 0, 1).getTime();
      if (t >= span.to) break;
      OB_ORDER.forEach(function (mv) { circleInto(yp, yc, self.obR(mv, t), dimTx(y % 5 === 0 ? 0.2 : 0.085), 128); });
    }
    o.add(this.obLines(yp, yc, 1));

    /* The natal wheel: a ring, a dot for every point and a spoke from it out
       to the zodiac, so a path crossing a natal bearing is seen to cross it. */
    var nat = m.natal || [], np = [], nc = [], targets = {};
    m.stars.forEach(function (st) { if (st.mini) targets[st.natal] = true; });
    circleInto(np, nc, R_NAT, dimTx(0.24), 96);
    nat.forEach(function (n) {
      var a = self.orAngle(n.lon), c = dimTx(n.name === 'Ascendant' || n.name === 'Midheaven' ? 0.2 : 0.11);
      np.push(Math.cos(a) * (R_NAT + 0.15), 0, -Math.sin(a) * (R_NAT + 0.15), Math.cos(a) * R_ZOD0, 0, -Math.sin(a) * R_ZOD0);
      nc.push(c[0], c[1], c[2], c[0], c[1], c[2]);
    });
    o.add(this.obLines(np, nc, 1));
    if (nat.length) {
      var nd = this.obPoints(nat.length), na = nd.geometry.attributes;
      nat.forEach(function (n, i) {
        var a = self.orAngle(n.lon), g = n.glyph || '', small = g.replace(/︎/g, '').length > 1;
        na.position.setXYZ(i, Math.cos(a) * R_NAT, 0, -Math.sin(a) * R_NAT); na.aSize.setX(i, 18); na.aCol.setXYZ(i, tk.tx[0] * 0.85, tk.tx[1] * 0.85, tk.tx[2] * 0.85);
        lab(g, { px: small ? 8.5 : 11, font: small ? tk.fu : tk.fd, weight: small ? 700 : 400, color: tk.cTx, glow: tk.cBg, depthTest: false },
          Math.cos(a) * (R_NAT - 0.62), -Math.sin(a) * (R_NAT - 0.62), targets[n.name] ? null : 'fullOnly');
      });
      o.add(nd);
    }

    /* The zodiac, and the sixty four gates outside it in the wheel's order. */
    A = { pos: [], ap: [], idx: [] };
    sectorInto(A, R_ZOD0, R_ZOD1, 0, TAU, 240, 0);
    var zm = new T.Mesh(geoOf(A), this.secMat(tk.ac2, [1e4, R_ZOD1 - R_ZOD0], 0.06, 0.55, 1));
    zm.renderOrder = 1; o.add(zm);
    var SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'], zp = [], zc = [], zk = dimTx(0.32), rz = (R_ZOD0 + R_ZOD1) / 2;
    SIGNS.forEach(function (sg, i) {
      var a = self.orAngle(i * 30), am = self.orAngle(i * 30 + 15);
      zp.push(Math.cos(a) * R_ZOD0, 0, -Math.sin(a) * R_ZOD0, Math.cos(a) * R_ZOD1, 0, -Math.sin(a) * R_ZOD1);
      zc.push(zk[0], zk[1], zk[2], zk[0], zk[1], zk[2]);
      lab(sg + '︎', { px: 11, font: tk.fd, color: tk.cMut, depthTest: false }, Math.cos(am) * rz, -Math.sin(am) * rz);
    });
    o.add(this.obLines(zp, zc, 1));
    var G = m.gates;
    if (G && G.order && G.order.length === 64) {
      var gArc = (R_GATE0 + R_GATE1) / 2 * G.deg * Math.PI / 180;
      A = { pos: [], ap: [], idx: [] };
      G.order.forEach(function (g, i) { var l0 = G.start + i * G.deg; sectorInto(A, R_GATE0, R_GATE1, self.orAngle(l0), self.orAngle(l0 + G.deg), 6, i); });
      var gm = new T.Mesh(geoOf(A), this.secMat(tk.atm, [gArc, R_GATE1 - R_GATE0], 0.02, 0.32, 1));
      gm.renderOrder = 1; o.add(gm);
      /* A stay on a gate: the gate lit in the ring, and a sector of the body's
         own band across the gate's arc for as long as it stays. */
      var byGate = {};
      m.design.forEach(function (d) { (byGate[d.gate] || (byGate[d.gate] = [])).push(d); });
      Object.keys(byGate).forEach(function (gk) {
        var list = byGate[gk].slice().sort(function (a, b) { return a.from - b.from; }), i = G.order.indexOf(+gk);
        if (i === -1) return;
        var l0 = G.start + i * G.deg, a0 = self.orAngle(l0), a1 = self.orAngle(l0 + G.deg), own = list.some(function (x) { return x.own; });
        var B = { pos: [], ap: [], idx: [] };
        sectorInto(B, R_GATE0, R_GATE1, a0, a1, 6, 0);
        var gmat = self.secMat(tk.blue, [gArc, R_GATE1 - R_GATE0], own ? 0.45 : 0.04, 1, 1), seg = new T.Mesh(geoOf(B), gmat);
        seg.renderOrder = 2;
        seg.userData.pick = { kind: 'design', id: list[0].id }; seg.userData.orb = true;
        var gg = new T.Group(); gg.userData.ob = { mini: list.some(function (x) { return x.mini; }) };
        gg.add(seg); o.add(gg); self.picks.push(seg);
        self.obItems.push({ id: list[0].id, u: gmat.uniforms.uHover, h: 0 });
        self.obLive.push({ u: gmat.uniforms.uLive, spans: list.map(function (x) { return [x.from, x.to]; }) });
        var am = (a0 + a1) / 2, rr = R_GATE1 + 0.42;
        lab(String(+gk), { px: 10, weight: 600, color: tk.cBlue, glow: tk.cBg, depthTest: false }, Math.cos(am) * rr, -Math.sin(am) * rr, 'fullOnly', gg);
        list.forEach(function (d) {
          var b = OB[d.mover];
          if (!b) return;
          var r0 = self.obR(d.mover, d.from), r1 = Math.min(b[1], Math.max(r0 + 0.08, self.obR(d.mover, d.to))), C = { pos: [], ap: [], idx: [] };
          sectorInto(C, r0, r1, a0, a1, 6, 0);
          var dm = self.secMat(tk.blue, [(r0 + r1) / 2 * G.deg * Math.PI / 180, r1 - r0], d.own ? 0.4 : 0.05, 0.9, d.past ? 0.4 : 1), sm = new T.Mesh(geoOf(C), dm);
          sm.renderOrder = 2;
          sm.userData.pick = { kind: 'design', id: d.id }; sm.userData.orb = true;
          var sg = new T.Group(); sg.userData.ob = { mini: !!d.mini };
          sg.add(sm); o.add(sg); self.picks.push(sm);
          self.obItems.push({ id: d.id, u: dm.uniforms.uHover, h: 0 });
          self.obLive.push({ u: dm.uniforms.uLive, spans: [[d.from, d.to]] });
        });
      });
    }

    /* Each body's path across the span, tinted year by year. */
    OB_ORDER.forEach(function (mv) {
      var p = m.paths && m.paths[mv];
      if (!p || !p.lon || p.lon.length < 2) return;
      var n = p.lon.length, pts = new Float32Array(n * 2), cols = new Float32Array(n * 3), u = new Float32Array(n), yLast = null, c = null;
      for (var i = 0; i < n; i++) {
        var ti = p.t0 + i * p.dt, a = self.orAngle(p.lon[i]), r = self.obR(mv, ti), yi = new Date(ti).getFullYear();
        if (yi !== yLast) { yLast = yi; c = self.pyCol(yi); }
        pts[i * 2] = Math.cos(a) * r; pts[i * 2 + 1] = -Math.sin(a) * r;
        cols[i * 3] = c[0]; cols[i * 3 + 1] = c[1]; cols[i * 3 + 2] = c[2]; u[i] = i / (n - 1);
      }
      var R = { pos: [], ap: [], idx: [], col: [] };
      stripInto(R, pts, cols, u, 0.09);
      var rm = new T.Mesh(geoOf(R), new T.ShaderMaterial({ vertexShader: V_OSTRIP, fragmentShader: F_OBASE, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, side: T.DoubleSide,
        uniforms: { uOrb: self.U.uOrb, uI: { value: 0.85 } } }));
      rm.renderOrder = 2; o.add(rm);
    });

    /* The passages, lit along the stretch of path they cover, with a point at
       every exact date. The wide strip beneath each is what a pointer finds. */
    m.stars.forEach(function (st) {
      if (!(m.paths && m.paths[st.mover])) return;
      var a = st.from, b = Math.max(st.to, st.from + 25 * DAY), n = Math.max(8, Math.ceil((b - a) / (2 * DAY)));
      var pts = new Float32Array((n + 1) * 2), u = new Float32Array(n + 1);
      for (var i = 0; i <= n; i++) { var q = self.obPt(st.mover, a + (b - a) * i / n); pts[i * 2] = q[0]; pts[i * 2 + 1] = q[1]; u[i] = i / n; }
      var dim = st.past ? 0.3 : st.mini ? 1 : 0.45, cA = st.hard ? tk.ac2 : tk.atm, cB = st.hard ? tk.hi : tk.ac2;
      var S = { pos: [], ap: [], idx: [] }, K = { pos: [], ap: [], idx: [] };
      stripInto(S, pts, null, u, 0.2); stripInto(K, pts, null, u, 0.55);
      var mat = new T.ShaderMaterial({ vertexShader: V_OSTRIP, fragmentShader: F_OPASS, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, side: T.DoubleSide,
        uniforms: { uA: { value: v3(cA) }, uB: { value: v3(cB) }, uTime: self.U.uTime, uHover: { value: 0 }, uLive: { value: st.now ? 1 : 0 }, uGlow: self.U.uGlow, uDim: { value: dim }, uOrb: self.U.uOrb } });
      var mesh = new T.Mesh(geoOf(S), mat), pick = new T.Mesh(geoOf(K), new T.MeshBasicMaterial({ visible: false }));
      mesh.renderOrder = 3;
      pick.userData.pick = { kind: 'star', id: st.id }; pick.userData.orb = true;
      var g = new T.Group(); g.userData.ob = { mini: !!st.mini };
      g.add(mesh); g.add(pick);
      if (st.passes && st.passes.length) {
        var pp = self.obPoints(st.passes.length), pa = pp.geometry.attributes;
        st.passes.forEach(function (tp, k) {
          var q = self.obPt(st.mover, tp);
          pa.position.setXYZ(k, q[0], 0, q[1]); pa.aSize.setX(k, 22); pa.aCol.setXYZ(k, tk.tx[0] * dim, tk.tx[1] * dim, tk.tx[2] * dim);
        });
        g.add(pp);
      }
      o.add(g); self.picks.push(pick);
      self.obItems.push({ id: st.id, u: mat.uniforms.uHover, h: 0 });
    });

    /* Now as a ring across every band, the probe as another, and the four
       bodies where they stand at the instant the reader is looking at. */
    var cp = [], cc = [], pp2 = [], pc2 = [];
    OB_ORDER.forEach(function (mv) { circleInto(cp, cc, self.obR(mv, m.now), tk.hi, 160); circleInto(pp2, pc2, OB[mv][0], tk.tx, 160); });
    o.add(this.obLines(cp, cc, 0.5));
    this.obProbe = this.obLines(pp2, pc2, 0);
    this.obProbe.material.userData.probe = true;
    o.add(this.obProbe);
    this.obMovers = this.obPoints(4);
    var mc = this.obMovers.geometry.attributes;
    for (var i = 0; i < 4; i++) { mc.aSize.setX(i, 54); mc.aCol.setXYZ(i, tk.hi[0], tk.hi[1], tk.hi[2]); }
    o.add(this.obMovers);
    this.obMoverLabs = OB_ORDER.map(function (mv) { var l = lab(OB_GLYPH[mv] + '︎', { px: 14, font: tk.fd, color: tk.cHi, glow: tk.cBg, depthTest: false }, 0, 0); l.renderOrder = 7; return l; });
    var lg = new T.BufferGeometry();
    lg.setAttribute('position', new T.BufferAttribute(new Float32Array(16 * 6), 3));
    lg.setAttribute('color', new T.BufferAttribute(new Float32Array(16 * 6), 3));
    lg.setDrawRange(0, 0);
    var lmt = new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending, opacity: 0 });
    lmt.userData.op0 = 1; this.obLineMats.push(lmt);
    this.obAct = new T.LineSegments(lg, lmt);
    this.obAct.frustumCulled = false; this.obAct.renderOrder = 4;
    o.add(this.obAct);
    /* The years along the near side of the outermost band, in the full view. */
    for (y = y0; y <= y1; y++) {
      if (y !== y0 && y % 5) continue;
      t = Math.max(span.from, new Date(y, 0, 1).getTime());
      if (t >= span.to) continue;
      lab(String(y), { px: 9.5, weight: 600, color: tk.cMut, glow: tk.cBg, depthTest: false }, 0, this.obR('Pluto', t), 'fullOnly');
    }
  };
  P.orbitAt = function (T0) {
    if (!this.orb || !this.model || !this.obMovers) return;
    var day = Math.round(T0 / DAY);
    if (this._obT === day) return;
    this._obT = day;
    var self = this, m = this.model, tk = this.tok, TAU = Math.PI * 2, mp = this.obMovers.geometry.attributes.position, lonAt = {};
    OB_ORDER.forEach(function (mv, i) {
      var L = self.obLon(mv, T0), lb = self.obMoverLabs[i];
      if (L == null) { mp.setXYZ(i, 0, -50, 0); lb.visible = false; return; }
      lonAt[mv] = L;
      var a = self.orAngle(L), r = self.obR(mv, T0), rl = r + 0.62;
      mp.setXYZ(i, Math.cos(a) * r, 0, -Math.sin(a) * r);
      lb.visible = true; lb.position.set(Math.cos(a) * rl, 0.05, -Math.sin(a) * rl);
    });
    mp.needsUpdate = true;
    var lp = this.obAct.geometry.attributes.position, lc = this.obAct.geometry.attributes.color, n = 0, full = this.mode === 'full';
    m.stars.filter(function (st) { return st.from <= T0 && T0 <= st.to && (full || st.mini); }).slice(0, 16).forEach(function (st) {
      var nat = (m.natal || []).find(function (x) { return x.name === st.natal; });
      if (!nat || lonAt[st.mover] == null) return;
      var a = self.orAngle(lonAt[st.mover]), r = self.obR(st.mover, T0), b = self.orAngle(nat.lon), c = st.hard ? tk.hi : tk.atm2;
      lp.setXYZ(n * 2, Math.cos(a) * r, 0, -Math.sin(a) * r); lp.setXYZ(n * 2 + 1, Math.cos(b) * R_NAT, 0, -Math.sin(b) * R_NAT);
      lc.setXYZ(n * 2, c[0], c[1], c[2]); lc.setXYZ(n * 2 + 1, c[0] * 0.5, c[1] * 0.5, c[2] * 0.5);
      n++;
    });
    this.obAct.geometry.setDrawRange(0, n * 2);
    lp.needsUpdate = true; lc.needsUpdate = true;
    var pp = this.obProbe.geometry.attributes.position, k = 0;
    OB_ORDER.forEach(function (mv) {
      var r = self.obR(mv, T0);
      for (var i = 0; i < 160; i++) {
        var a0 = i / 160 * TAU, a1 = (i + 1) / 160 * TAU;
        pp.setXYZ(k++, Math.cos(a0) * r, 0, -Math.sin(a0) * r); pp.setXYZ(k++, Math.cos(a1) * r, 0, -Math.sin(a1) * r);
      }
    });
    pp.needsUpdate = true;
    this.obLive.forEach(function (x) { x.u.value = x.spans.some(function (sp) { return sp[0] <= T0 && T0 <= sp[1]; }) ? 1 : 0; });
    /* The Personal Year of the instant, in the middle of the wheel. */
    var yr = new Date(T0).getFullYear();
    if (this._obYr !== yr) {
      this._obYr = yr;
      if (this.obYrLab) { this.orb.remove(this.obYrLab); this.dispose(this.obYrLab); this.obYrLab = null; }
      var py = this._py && this._py[yr];
      if (py && py.v != null) {
        var l = this.label(String(py.v), { px: 22, font: tk.fd, color: py.master ? tk.cHi : tk.cTx, glow: tk.cBg, depthTest: false });
        l.position.set(0, 0.05, 0); l.renderOrder = 7; l.material.opacity = l.userData.op0 * this.orbI;
        this.orb.add(l); this.obYrLab = l;
      }
    }
  };
  /* The two layouts share one stage: what fades and by how much. */
  P.applyFade = function () {
    var L = this.landI, O = this.orbI;
    if (this.content) this.content.traverse(function (x) { if (x.isSprite && x.userData.op0 != null) x.material.opacity = x.userData.op0 * L; });
    if (this.orb) this.orb.traverse(function (x) { if (x.isSprite && x.userData.op0 != null) x.material.opacity = x.userData.op0 * O; });
    (this.obLineMats || []).forEach(function (mt) { if (!mt.userData.probe) mt.opacity = mt.userData.op0 * O; });
  };
  /* The distance at which the whole rim sits inside the frame, found by
     projecting it: at a low camera the near side is much the larger, and a
     fit from the radius alone cut it off. It fits the rim's height rather than
     its distance from the middle, and keeps how far off centre that height
     sits (_fitY), which placeCamera takes out with a view offset. */
  P.fitDisc = function (el) {
    var tv = Math.tan(this.cam.fov * Math.PI / 360), asp = this.cam.aspect, key = el.toFixed(3) + '|' + tv.toFixed(4) + '|' + asp.toFixed(3);
    if (this._fitK === key) return this._fitD;
    var ce = Math.cos(el), se = Math.sin(el);
    var span = null;
    var fits = function (d) {
      var cy = TARGET_Y + se * d, cz = ce * d, fy = TARGET_Y - cy, fz = -cz, fl = Math.hypot(fy, fz);
      fy /= fl; fz /= fl;
      /* right is +x, so up is right x forward */
      var uy = -fz, uz = fy;
      var y0 = 9, y1 = -9;
      for (var i = 0; i < 32; i++) {
        var a = i / 32 * Math.PI * 2, px = Math.cos(a) * R_FIT, py = -cy, pz = Math.sin(a) * R_FIT - cz;
        var z = py * fy + pz * fz, y = py * uy + pz * uz;
        if (z <= 0.1 || Math.abs(px / (z * tv * asp)) > 0.94) return false;
        y /= z * tv; y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      span = [y0, y1];
      return y1 - y0 <= 1.84;
    };
    var lo = 6, hi = 160;
    for (var k = 0; k < 24; k++) { var mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
    fits(hi);
    this._fitK = key; this._fitD = hi; this._fitY = span ? (span[0] + span[1]) / 2 : 0;
    return hi;
  };
  P.obElev = function () { return this.mode === 'full' ? (this.user.oElev != null ? this.user.oElev : 0.98) : clamp(Math.asin(clamp(1 / (this.cam ? this.cam.aspect : 2), 0, 1)) * 0.95, 0.4, 0.9); };
  P.setLayout = function (l) {
    l = l === 'orbit' ? 'orbit' : 'land';
    if (this.layout === l) return;
    this.layout = l;
    if (!this.ready) return;
    if (this.isFlying()) this.flyRelease();
    this.hideCard(); this.setHover(null); this.hideTip();
    if (this.reduced) this.morph = l === 'orbit' ? 1 : 0;
    this._obT = null; this._fadeK = null;
    this.lift(0.3);
    this.kick();
  };

  /* ---- The camera ---------------------------------------------------------- */
  P.win = function () {
    var m = this.model, nar = this.cam.aspect < 1.9;
    return this.mode === 'full' ? m.span : (nar && m.miniNarrow ? m.miniNarrow : m.mini);
  };
  P.fit = function (width) {
    var half = width / 2 * 1.06, tv = Math.tan(this.cam.fov * Math.PI / 360);
    return clamp(half / (tv * this.cam.aspect) * 1.02, 6, 80);
  };
  P.enterMode = function (moved) {
    if (!this.model || !this.cam) return;
    var full = this.mode === 'full', w = this.win();
    this.user.oDist = null; this.user.oElev = null;
    this.applyModeVisibility();
    this.el.card.style.display = 'none';
    this.card = null;
    if (full) {
      var span = Math.min(this.x(w.to) - this.x(w.from), (this.cam.aspect < 1.2 ? 6 : 10) * U);
      this.user.center = this.x(this.model.now) + span / 2 - U * 1.2;
      this.user.dist = Math.max(14, this.fit(span));
      this.user.elev = 0.6;
      this._orT = null;
      this.setProbe(this.probeT == null ? this.model.now : this.probeT);
      this.showRead(true);
    } else {
      this.user.center = null; this.user.dist = null; this.user.elev = null;
      this.probeT = null; this.probeShow = 0; this.showRead(false);
    }
    this.goals();
    if (!this.rig || moved) {
      var g = this.goal;
      /* it opens where it rests: no fly-in (owner, 19 October 2026) */
      this.rig = { x: g.x, dist: g.dist, elev: g.elev, yaw: g.yaw };
      this.morph = this.layout === 'orbit' ? 1 : 0;
      this._fadeK = null;
    }
    this.lift(0.35);
    if (this.focusId && full) this.focus(this.focusId);
    this.kick();
  };
  P.goals = function () {
    var m = this.model, c = this.c, full = this.mode === 'full', w = this.win();
    var x0 = this.x(w.from), x1 = this.x(w.to), cx = (x0 + x1) / 2;
    var g = this.goal || (this.goal = {});
    if (this.layout === 'orbit' && this.orb) {
      var el = this.obElev();
      g.x = this.orbX;
      g.dist = (full && this.user.oDist != null ? this.user.oDist : this.fitDisc(el)) * (1 - 0.05 * c);
      g.elev = el - 0.04 * c;
      g.yaw = (this.reduced ? 0 : Math.sin(this.time * 0.045) * 0.06) + (this.ptr.on ? this.ptr.x * 0.14 : 0);
      return g;
    }
    if (full) {
      g.x = this.user.center; g.dist = this.user.dist * (1 - 0.06 * c); g.elev = clamp(this.user.elev - 0.05 * c, 0.2, 1.1);
    } else {
      var px = this.probeT != null ? this.x(this.probeT) : null;
      g.x = cx + (px != null ? clamp((px - cx) * 0.35, -U * 2, U * 2) : 0);
      g.dist = this.fit(x1 - x0) * (1 - 0.08 * c);
      g.elev = 0.5 - 0.08 * c;
    }
    var drift = this.reduced ? 0 : Math.sin(this.time * 0.045) * 0.045;
    g.yaw = drift + (this.ptr.on ? this.ptr.x * (full ? 0.08 : 0.05) : 0);
    return g;
  };
  /* FLIGHT (flight.js, owner 19 October 2026: "omni directional motion, on
     every chart"). The move keys on the timeline take off, a drag looks while
     flying, and Escape or 0 lands back on the timeline's rig. Installed on
     first use, because flight.js may arrive after this file. */
  P.flyOk = function () { if (!P.flyer && root.Flight && root.Flight.mixin) root.Flight.mixin(P); return !!P.flyer; };
  P.isFlying = function () { return this.flyOk() && this.flying(); };
  P.placeCamera = function (k) {
    if (this.isFlying() && this.flyPose(this._dt)) {
      this.viewShift(0);
      this.U.uCam.value.copy(this.cam.position);
      this.U.uFog.value = 1 / (Math.abs(this.cam.position.z - TARGET_Z) * 2.6 + 30) + this.fogAdd();
      this.sky.position.copy(this.cam.position);
      this.stars.position.copy(this.cam.position);
      return;
    }
    var r = this.rig, g = this.goal;
    r.x = damp(r.x, g.x, k); r.dist = damp(r.dist, g.dist, k); r.elev = damp(r.elev, g.elev, k); r.yaw = damp(r.yaw, g.yaw, k);
    var ce = Math.cos(r.elev);
    this.cam.position.set(r.x + Math.sin(r.yaw) * ce * r.dist, TARGET_Y + Math.sin(r.elev) * r.dist, TARGET_Z + Math.cos(r.yaw) * ce * r.dist);
    this.cam.lookAt(r.x, TARGET_Y, TARGET_Z);
    this.cam.updateMatrixWorld();
    this.viewShift(this.layout === 'orbit' && !this.user.oDist ? this.morph : 0);
    if (this.flyOk()) this.flyBlend(this._dt);
    this.U.uCam.value.copy(this.cam.position);
    this.U.uFog.value = 1 / (r.dist * 2.6 + 18) + this.fogAdd();
    this.sky.position.copy(this.cam.position);
    this.stars.position.copy(this.cam.position);
  };
 /* The landscape leaves by fog: everything in it is drawn through fogK, so
     thickening the fog takes it to the background while the sky, the stars
     and the Orbital layout, which are not fogged, stay. */
  P.fogAdd = function () { var k = 1 - this.landI; return k * k * 0.5; };
  /* Centres the sky's rim in the frame; nothing in the landscape. */
  P.viewShift = function (k) {
    var dy = Math.round(-(this._fitY || 0) * (this.H || 300) / 2 * k);
    if (dy === (this._vsY || 0)) return;
    this._vsY = dy;
    if (dy) this.cam.setViewOffset(this.W || 300, this.H || 300, 0, dy, this.W || 300, this.H || 300);
    else this.cam.clearViewOffset();
  };
  P.settled = function () {
    var r = this.rig, g = this.goal;
    if (!r || !g) return true;
    if (Math.abs(this.morph - (this.layout === 'orbit' ? 1 : 0)) > 0.002) return false;
    return Math.abs(r.x - g.x) < 0.002 && Math.abs(r.dist - g.dist) < 0.004 && Math.abs(r.elev - g.elev) < 0.0005 && Math.abs(r.yaw - g.yaw) < 0.0005;
  };

  /* ---- Public moves --------------------------------------------------------- */
  P.focus = function (id) {
    if (!this.ready || this.mode !== 'full' || !this.model) { this.focusId = id; return; }
    this.focusId = null;
    var it = this.items && this.items[id];
    if (!it) return;
    var d = it.userData.item, x0 = this.x(d.from), x1 = this.x(Math.max(d.to, d.from + 25 * DAY));
    this.user.center = (x0 + x1) / 2;
    this.user.dist = Math.max(14, this.fit(Math.max(x1 - x0 + U * 2, U * 5)));
    this.setProbe(clamp(this.model.now, d.from, d.to) === this.model.now ? this.model.now : (d.passes && d.passes.length ? d.passes[0] : (d.from + d.to) / 2));
    this.showCard(it.userData.kind, d);
    this.lift(0.3);
    this.kick();
  };
  P.toNow = function () {
    if (this.isFlying()) this.flyRelease();
    if (!this.model) return;
    this.setProbe(this.model.now);
    if (this.mode === 'full') { this.user.center = this.x(this.model.now) + U * 2.5; }
    this.hideCard();
    this.lift(0.2);
    this.kick();
  };
  P.zoom = function (dir) {
    if (this.isFlying()) { if (dir === 0) this.flyRelease(); else this.flyNudge([0, 0, dir < 0 ? 1.2 : -1.2]); this.kick(); return; }
    if (this.mode !== 'full') return;
    if (this.layout === 'orbit') {
      this.user.oDist = clamp((this.user.oDist != null ? this.user.oDist : this.fitDisc(this.obElev())) * (dir < 0 ? 0.8 : 1.25), 8, 90);
      this.lift(0.15); this.kick(); return;
    }
    if (!this.user.dist) return;
    this.user.dist = clamp(this.user.dist * (dir < 0 ? 0.8 : 1.25), 7, 90);
    this.lift(0.15);
    this.kick();
  };

  /* ---- The probe and the readout ------------------------------------------- */
  P.setProbe = function (t) {
    var m = this.model;
    if (!m) return;
    t = clamp(t, m.span.from, m.span.to);
    this.probeT = t;
    this.probeHold = performance.now();
    if (this.mode === 'full' && this.layout !== 'orbit') {
      var px = this.x(t), half = this.user.dist * Math.tan(this.cam.fov * Math.PI / 360) * this.cam.aspect * 0.8;
      if (Math.abs(px - this.user.center) > half) this.user.center = px - Math.sign(px - this.user.center) * half;
    }
    this.readout(t);
  };
  P.readout = function (t) {
    var m = this.model, fmt = this.o.fmt || function (x) { return new Date(x).toDateString(); };
    var act = m.stars.filter(function (s) { return s.from <= t && t <= s.to && (this.mode === 'full' || s.mini); }, this);
    var dAct = m.design.filter(function (d) { return d.from <= t && t <= d.to && (this.mode === 'full' || d.mini); }, this);
    var yr = new Date(t).getFullYear(), y = m.years.find(function (x) { return x.y === yr; });
    var pin = (m.pins || []).find(function (p) { return p.from <= t && t < p.to; });
    var date = fmt(t, 'month');
    var sLine = act.length ? act.slice(0, 2).map(function (s) { return s.label; }).join(' · ') + (act.length > 2 ? ' · ' + (act.length - 2) + ' more' : '') : 'No long passage under way';
    var dLine = dAct.length ? dAct[0].label : '';
    var nLine = y && y.v != null ? 'Personal Year ' + y.v + (pin ? ' · Pinnacle ' + pin.v : '') : '';
    var rd = this.el.read;
    rd.textContent = '';
    var mk = function (txt, css) { if (!txt) return; var s = document.createElement('span'); s.textContent = txt; s.style.cssText = css; rd.appendChild(s); };
    mk(date, 'font:600 10.5px var(--fu);letter-spacing:.14em;text-transform:uppercase;color:var(--ac2-hi)');
    mk(sLine, 'font:600 13px/1.35 var(--fu);color:var(--tx)');
    mk(dLine, 'font:400 12px/1.35 var(--fu);color:var(--blue)');
    mk(nLine, 'font:400 12px/1.35 var(--fu);color:var(--mut)');
    this.el.slider.setAttribute('aria-valuetext', [date, sLine, dLine, nLine].filter(Boolean).join('. '));
    this.el.slider.setAttribute('aria-valuemin', String(new Date(m.span.from).getFullYear()));
    this.el.slider.setAttribute('aria-valuemax', String(new Date(m.span.to).getFullYear()));
    this.el.slider.setAttribute('aria-valuenow', (yr + (t - new Date(yr, 0, 1).getTime()) / YEAR).toFixed(2));
    var month = fmt(t, 'month');
    if (this._probeTxt !== month && this.content) {
      if (this.probeLabel) { this.scene.remove(this.probeLabel); this.dispose(this.probeLabel); }
      this.probeLabel = this.label(month, { px: 10.5, weight: 700, caps: true, color: this.tok.cTx, glow: this.tok.cBg, anchorY: 0 });
      this.scene.add(this.probeLabel);
      this._probeTxt = month;
    }
    if (this.probeLabel) this.probeLabel.position.set(this.x(t), 3.85, TARGET_Z + 0.4);
    this.orreryAt(t);
  };
  P.showRead = function (on) {
    if (on && this.probeT == null && this.model) this.setProbe(this.model.now);
    if (on && this.card && (this.W || 0) < 560) on = false;
    /* a readout is a unit of the scene: it waits for the reveal (render) */
    this._readOn = on;
    this.el.read.style.opacity = on && this.shown ? '1' : '0';
    this.el.read.style.bottom = this.card ? (this.el.card.offsetHeight + 22) + 'px' : '12px';
  };

  /* ---- The card a picked passage opens, in the full view -------------------- */
  P.showCard = function (kind, d) {
    var cd = this.el.card, self = this;
    cd.textContent = '';
    this.card = { kind: kind, id: d.id };
    var head = document.createElement('div'); head.style.cssText = 'display:flex;align-items:flex-start;gap:10px';
    var gly = document.createElement('span'); gly.setAttribute('aria-hidden', 'true');
    gly.style.cssText = 'flex:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:400 18px/1 var(--fd);color:var(--tx);border:1px solid ' + (kind === 'design' ? 'var(--blue)' : 'var(--ac2)') + ';background:rgba(var(--atmc),.18)';
    gly.textContent = kind === 'year' ? String(d.v == null ? '' : d.v) : (d.glyph || '');
    head.appendChild(gly);
    var col = document.createElement('div'); col.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:3px';
    var add = function (txt, css, tag) { if (!txt) return; var e = document.createElement(tag || 'span'); e.textContent = txt; e.style.cssText = css; col.appendChild(e); };
    if (kind === 'year') {
      add(String(d.y), 'font:600 10.5px var(--fu);letter-spacing:.14em;color:var(--ac2-hi)');
      add(d.v == null ? 'Personal Year' : 'Personal Year ' + d.v, 'margin:0;font:400 18px/1.25 var(--fd);color:var(--tx)', 'h3');
      var pin = (this.model.pins || []).find(function (p) { var t = new Date(d.y, 6, 1).getTime(); return p.from <= t && t < p.to; });
      if (pin) add('Pinnacle ' + pin.v, 'font:400 12.5px/1.4 var(--fu);color:var(--mut)');
    } else {
      add(d.now ? 'Under way' : d.past ? 'Behind you' : 'Ahead', 'font:600 10.5px var(--fu);letter-spacing:.14em;text-transform:uppercase;color:' + (kind === 'design' ? 'var(--blue)' : 'var(--ac2-hi)'));
      add(d.label, 'margin:0;font:400 18px/1.25 var(--fd);color:var(--tx);text-wrap:balance', 'h3');
      add(d.range, 'font:400 12.5px/1.4 var(--fu);color:var(--mut)');
      if ((this.W || 0) >= 560) add(kind === 'design' ? d.sub : [d.pass, d.house].filter(Boolean).join(' · '), 'font:400 12.5px/1.4 var(--fu);color:var(--mut)');
    }
    head.appendChild(col);
    var x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Close the card'); x.textContent = '×';
    x.style.cssText = 'all:unset;cursor:pointer;box-sizing:border-box;flex:none;width:44px;height:44px;margin:-8px -8px 0 0;display:flex;align-items:center;justify-content:center;border-radius:50%;font:400 20px/1 var(--fu);color:var(--tx)';
    x.addEventListener('click', function () { self.hideCard(); self.el.slider.focus(); });
    head.appendChild(x);
    cd.appendChild(head);
    var lab = kind !== 'year' && this.o.readLabel ? this.o.readLabel(d.id) : null;
    if (lab) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = lab + ' ↓';
      b.style.cssText = 'all:unset;cursor:pointer;box-sizing:border-box;align-self:flex-start;min-height:44px;display:flex;align-items:center;padding:0 16px;border:1px solid var(--ac2);border-radius:999px;font:600 12.5px var(--fu);color:var(--tx);background:rgba(var(--atmc),.14)';
      b.addEventListener('click', function () { if (self.o.onRead) self.o.onRead(d.id); });
      cd.appendChild(b);
    }
    cd.style.display = 'flex';
    this.showRead(true);
  };
  P.hideCard = function () {
    this.card = null;
    this.el.card.style.display = 'none';
    this.showRead(this.mode === 'full');
  };

  /* ---- Input ----------------------------------------------------------------- */
  P.ndc = function (e) {
    var b = this.el.slider.getBoundingClientRect();
    return { x: (e.clientX - b.left) / b.width * 2 - 1, y: -((e.clientY - b.top) / b.height * 2 - 1), px: e.clientX - b.left, py: e.clientY - b.top };
  };
  P.floorAt = function (n) {
    if (!this.cam) return null;
    this.ray.setFromCamera(new T.Vector2(n.x, n.y), this.cam);
    var o = this.ray.ray.origin, d = this.ray.ray.direction;
    if (d.y > -1e-4) return null;
    var k = -o.y / d.y;
    return new T.Vector3(o.x + d.x * k, 0, o.z + d.z * k);
  };
  P.pickAt = function (n) {
    if (!this.cam || !this.picks) return null;
    this.ray.setFromCamera(new T.Vector2(n.x, n.y), this.cam);
    var full = this.mode === 'full', orb = this.layout === 'orbit';
    var hits = this.ray.intersectObjects(this.picks.filter(function (p) { return !!p.userData.orb === orb && p.parent && (full || p.parent.visible !== false) && p.visible !== false && (!p.parent.parent || p.parent.visible); }), false);
    for (var i = 0; i < hits.length; i++) { var pk = hits[i].object.userData.pick; if (pk) return pk; }
    return null;
  };
  P.lift = function (v) { this.c = Math.min(1, this.c + v); };
  P.onDown = function (e) {
    if (!this.ready || (e.button != null && e.button > 0)) return;
    this.pts = this.pts || {};
    this.pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(this.pts);
    if (ids.length === 2 && this.mode === 'full') {
      var a = this.pts[ids[0]], b = this.pts[ids[1]];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: this.layout === 'orbit' ? (this.user.oDist != null ? this.user.oDist : this.fitDisc(this.obElev())) : this.user.dist };
      this.down = null;
      return;
    }
    this.keyed = false;
    this.el.slider.style.boxShadow = 'none';
    this.down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, id: e.pointerId, axis: null, type: e.pointerType, elev: this.user.elev, center: this.user.center,
      t0: this.probeT == null ? (this.model ? this.model.now : 0) : this.probeT, oElev: this.obElev() };
    this.lift(0.08);
  };
  P.onMove = function (e) {
    if (!this.ready) return;
    var n = this.ndc(e);
    var dx0 = n.x - this.ptr.x, dy0 = n.y - this.ptr.y;
    this.ptrType = e.pointerType;
    this.ptr.x = n.x; this.ptr.y = n.y; this.ptr.px = n.px; this.ptr.py = n.py; this.ptr.on = true; this.ptr.moved = true;
    this.lift(Math.min(0.03, Math.hypot(dx0, dy0) * 0.25));
    if (this.pts && this.pts[e.pointerId]) this.pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (this.pinch && this.pts) {
      var ids = Object.keys(this.pts);
      if (ids.length === 2) {
        var a = this.pts[ids[0]], b = this.pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.isFlying()) { this.flyNudge([0, 0, (d - (this.pinch.ld || this.pinch.d)) / (this.H || 300) * 3.2], 0.9); this.pinch.ld = d; }
        else if (this.layout === 'orbit') this.user.oDist = clamp(this.pinch.dist * this.pinch.d / Math.max(20, d), 8, 90);
        else this.user.dist = clamp(this.pinch.dist * this.pinch.d / Math.max(20, d), 7, 90);
      }
      this.kick();
      return;
    }
    var dn = this.down;
    if (dn && dn.id === e.pointerId) {
      var dx = e.clientX - dn.x, dy = e.clientY - dn.y;
      if (!dn.axis && Math.hypot(dx, dy) > 7) {
        dn.axis = this.isFlying() && (dn.type === 'mouse' || this.mode === 'full') ? 'look' : Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        if (dn.axis === 'x' || this.mode === 'full') { try { this.el.slider.setPointerCapture(e.pointerId); } catch (er) { /* not capturable */ } }
        if (dn.axis === 'x') this.el.slider.style.cursor = 'grabbing';
      }
      if (dn.axis === 'look') { this.flyLook(e.clientX - dn.lx, e.clientY - dn.ly); dn.lx = e.clientX; dn.ly = e.clientY; }
      else if (dn.axis === 'x' && this.layout === 'orbit') {
        /* the sky has no floor to point at: a sideways drag runs time */
        var mm = this.model, win = this.mode === 'full' ? (mm.span.to - mm.span.from) * 0.5 : (mm.mini.to - mm.mini.from) * 0.8;
        this.setProbe(dn.t0 + dx / (this.W || 300) * win); this.probeShow = 1; this.showRead(true); this.hideTip();
        this.lift(0.02);
      } else if (dn.axis === 'x') {
        var f = this.floorAt(n);
        if (f) { this.setProbe(this.t(f.x)); this.probeShow = 1; this.showRead(true); this.hideTip(); }
        this.lift(0.02);
      } else if (dn.axis === 'y' && this.mode === 'full') {
        if (this.layout === 'orbit') this.user.oElev = clamp(dn.oElev + dy * 0.004, 0.35, 1.45);
        else this.user.elev = clamp(dn.elev + dy * 0.004, 0.2, 1.1);
      }
    }
    this.kick();
  };
  P.onUp = function (e) {
    if (this.pts) delete this.pts[e.pointerId];
    if (this.pinch) { if (!this.pts || Object.keys(this.pts).length < 2) this.pinch = null; return; }
    var dn = this.down;
    this.down = null;
    this.el.slider.style.cursor = this.mode === 'full' ? 'crosshair' : 'grab';
    if (!dn || dn.id !== e.pointerId) return;
    if (dn.axis) { this.probeHold = performance.now(); return; }
    var n = this.ndc(e), pk = this.pickAt(n);
    if (e.pointerType !== 'mouse') { this.ptr.on = false; this.hideTip(); }
    this.lift(0.2);
    if (this.mode !== 'full') {
      if (this.o.onOpen) this.o.onOpen({ focus: pk && pk.kind !== 'year' ? pk.id : null });
      return;
    }
    if (pk) {
      var it = this.items[pk.id];
      if (it) { this.showCard(pk.kind, it.userData.item); if (pk.kind !== 'year') this.setProbe(clamp(this.probeT || this.model.now, it.userData.item.from, it.userData.item.to)); }
    } else {
      var f = this.layout === 'orbit' ? null : this.floorAt(n);
      if (f) this.setProbe(this.t(f.x));
      this.hideCard();
    }
    this.kick();
  };
  P.onCancel = function (e) {
    if (this.pts) delete this.pts[e.pointerId];
    this.pinch = null; this.down = null;
  };
  P.onWheel = function (e) {
    if (this.isFlying()) { e.preventDefault(); this.flyNudge([0, 0, clamp(-e.deltaY * 0.004, -1.5, 1.5)], 0.8); this.lift(0.03); this.kick(); return; }
    if (this.mode !== 'full' || !this.ready) return;
    e.preventDefault();
    if (this.layout === 'orbit') {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) this.setProbe((this.probeT == null ? this.model.now : this.probeT) + e.deltaX * DAY * 3);
      else this.user.oDist = clamp((this.user.oDist != null ? this.user.oDist : this.fitDisc(this.obElev())) * Math.exp(e.deltaY * 0.0012), 8, 90);
      this.lift(0.04); this.kick(); return;
    }
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      this.user.center += e.deltaX * 0.01 * (this.user.dist / 20);
    } else {
      this.user.dist = clamp(this.user.dist * Math.exp(e.deltaY * 0.0012), 7, 90);
    }
    this.lift(0.04);
    this.kick();
  };
  P.onKey = function (e) {
    if (!this.ready || !this.model) return;
    if (this.flyOk() && this.flyKey(e)) return;
    if (!this.keyed) { this.keyed = true; this.el.slider.style.boxShadow = 'inset 0 0 0 2px var(--ac2-hi)'; }
    var t = this.probeT == null ? this.model.now : this.probeT, k = e.key, step = e.shiftKey ? YEAR : 30.4375 * DAY, done = true;
    if (k === 'ArrowRight' || k === 'ArrowUp') this.setProbe(t + step);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') this.setProbe(t - step);
    else if (k === 'PageUp') this.setProbe(t + YEAR);
    else if (k === 'PageDown') this.setProbe(t - YEAR);
    else if (k === 'Home') this.setProbe(this.model.span.from);
    else if (k === 'End') this.setProbe(this.model.span.to);
    else if (k === '+' || k === '=') this.zoom(-1);
    else if (k === '-' || k === '_') this.zoom(1);
    else if (k === 'Enter' || k === ' ') {
      var tt = t, act = this.model.stars.filter(function (s) { return s.from <= tt && tt <= s.to; }).sort(function (a, b) { return b.weight - a.weight; })[0];
      if (this.mode !== 'full') { if (this.o.onOpen) this.o.onOpen({ focus: act ? act.id : null }); }
      else if (act) this.showCard('star', act);
    } else done = false;
    if (done) { e.preventDefault(); this.probeShow = 1; this.showRead(true); this.lift(0.08); this.kick(); }
  };
  P.setHover = function (pk) {
    var id = pk ? pk.id : null;
    if (this.hover === id) return;
    this.hover = id;
    if (id) this.lift(0.1);
  };
  P.hideTip = function () { this.el.tip.style.opacity = '0'; };
  P.updateHover = function () {
    if (!this.ptr.moved) return;
    this.ptr.moved = false;
    if (!this.ptr.on || (this.down && this.down.axis)) { this.setHover(null); this.hideTip(); return; }
    var pk = this.pickAt(this.ptr);
    this.setHover(pk);
    var f = this.floorAt(this.ptr);
    this.ptr.world = f;
    var tip = this.el.tip;
    if (pk && this.items[pk.id] && this.ptrType === 'mouse') {
      var d = this.items[pk.id].userData.item;
      tip.textContent = pk.kind === 'year' ? d.y + (d.v != null ? ' · Personal Year ' + d.v : '') : d.label + ' · ' + d.range;
      var W = this.W || 300, x = clamp(this.ptr.px + 14, 8, W - 250), y = Math.max(8, this.ptr.py - 44);
      tip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      tip.style.opacity = '1';
      this.el.slider.style.cursor = 'pointer';
    } else {
      this.hideTip();
      if (!this.down) this.el.slider.style.cursor = this.mode === 'full' ? 'crosshair' : 'grab';
    }
  };

  /* ---- The loop --------------------------------------------------------------- */
  P.updateRun = function () {
    var want = this.ready && !this.failed && !!this.host && this.el.root.isConnected && this.visible && !document.hidden;
    if (this.ready && !this.failed) this.postSleep(want);
    if (want && this.reduced && !this.isFlying()) { this.stop(); this.kick(); return; }
    /* a stage coming back is timed from its first new frame: the gap it was
       away for is not a frame, and counted as one it dropped a rung on every
       return to a stage, until even a fast machine drew at the bottom. Its
       first frames carry the page settling and the GPU uploading, so they are
       drawn but not judged either */
    if (want && !this.running) { this.running = true; this.last = 0; this.lastDraw = 0; this.skipFrames = 3; this.raf = requestAnimationFrame(this._tick || (this._tick = this.tick.bind(this))); }
    else if (!want) this.stop();
  };
  /* An unseen stage gives back its bloom targets. The phone keeps every stage
     built at once, parked in the lot or mounted off screen, and the post chain
     is the largest thing a scene holds besides its canvas: a multisampled half
     float target at the stage's full pixel size and four smaller ones. They
     are released a few seconds after the stage stops being seen, so a quick
     scroll past does not churn them, and made again before the next frame
     draws, so the bloom is there the moment the stage is. */
  P.postSleep = function (want) {
    var self = this;
    this._postWant = want;
    if (want) {
      if (this._postT) { clearTimeout(this._postT); this._postT = 0; }
      if (this._postOff) { this._postOff = false; this.setupPost(); }
      return;
    }
    if (this._postOff || this._postT || !this.post) return;
    /* never before the warm-up has run: it compiles the bloom programs only
       while the targets exist, and a stage released first would link them on
       the main thread the first time it is seen */
    var rest = function () {
      self._postT = 0;
      if (self.destroyed || self._postWant) return;
      if (!self.warm) { self._postT = setTimeout(rest, 4000); return; }
      self._postOff = true;
      self.setupPost();
    };
    this._postT = setTimeout(rest, 4000);
  };
  P.stop = function () { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; };
  P.kick = function () {
    if (!this.ready || this.failed) return;
    if (this.running) return;
    if (this._kick) return;
    var self = this;
    this._kick = requestAnimationFrame(function () {
      self._kick = 0;
      if (!self.host || !self.el.root.isConnected) return;
      self.step(0.016, true);
      self.render();
    });
  };
  P.tick = function (ts) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this._tick);
    if (!this.host || !this.el.root.isConnected) { this.stop(); return; }
    var dt = this.last ? Math.min(this.isFlying() ? 0.25 : 0.1, (ts - this.last) / 1000) : 0.016;
    var busy = this.c > 0.04 || this.down || this.pinch || !this.settled() || (this.flyOk() && this.flyBusy());
    if (!busy && ts - this.lastDraw < 31) return;
    this.last = ts;
    if (this.lastDraw) { if (this.skipFrames > 0) this.skipFrames--; else this.measure(ts - this.lastDraw, busy); }
    this.lastDraw = ts;
    this.step(dt, false);
    this.render();
  };
  P.measure = function (ms, busy) {
    if (!busy) return;
    /* three frames in a row that are already far too late drop a rung at
       once, rather than waiting out the averaging window */
    this.late = ms > 120 ? (this.late || 0) + 1 : 0;
    if (this.late >= 3 && this.level < 4) { this.late = 0; this.frames = []; this.level++; this.resize(); return; }
    this.frames.push(ms);
    if (this.frames.length < 45) return;
    var avg = this.frames.reduce(function (a, b) { return a + b; }, 0) / this.frames.length;
    this.frames = [];
    if (avg > 36 && this.level < 4) { this.level++; this.resize(); }
  };
  P.step = function (dt, still) {
    var m = this.model;
    if (!m || !this.cam) return;
    var rm = this.reduced;
    /* Between the landscape and the sky: one number, the landscape fogging
       out over the first half and the sky coming up over the second. */
    var mGoal = this.layout === 'orbit' && this.orb ? 1 : 0;
    this.morph = rm ? mGoal : damp(this.morph, mGoal, 1 - Math.exp(-dt * 3.2));
    if (Math.abs(this.morph - mGoal) < 0.002) this.morph = mGoal;
    var orbI = clamp((this.morph - 0.35) / 0.65, 0, 1);
    this.landI = clamp(1 - this.morph * 1.8, 0, 1); this.orbI = orbI * orbI * (3 - 2 * orbI);
    this.U.uOrb.value = this.orbI;
    if (this.orb) this.orb.visible = this.orbI > 0.001;
    if (this.content) this.content.visible = this.landI > 0.001;
    this.now.visible = this.probe.visible = this.landI > 0.01;
    var fk = Math.round(this.landI * 1000) + Math.round(this.orbI * 1000) * 1001;
    if (this._fadeK !== fk) { this._fadeK = fk; this.applyFade(); }
    if (!rm && !still) this.time += dt;
    this.c = Math.max(0, this.c - dt / 8);
    this.cur = damp(this.cur, this.c, rm ? 1 : 1 - Math.exp(-dt * 4));
    var c = this.cur, breath = rm ? 1 : 0.5 + 0.5 * Math.sin(this.time * Math.PI * 2 / 7.5);
    this.U.uTime.value = rm ? 2.0 : this.time;
    this.U.uBreath.value = breath;
    this.U.uGlow.value = 0.82 + 0.14 * breath * (1 - 0.5 * c) + 0.45 * c;
    if (!rm && !still) this.drift += dt * (0.12 + 0.55 * c);
    this.dustMat.uniforms.uDrift.value = this.drift;
    this.dustMat.uniforms.uAttract.value = this.ptr.on ? 0.3 + 0.7 * c : 0;
    this.dustMat.uniforms.uAlpha.value = (0.4 + 0.45 * c) * this.landI;
    this.updateHover();
    var pw = this.ptr.world;
    if (pw) { this.dustMat.uniforms.uPtr.value.copy(pw); this.floorMat.uniforms.uPtr.value.set(pw.x, pw.z); }
    this.floorMat.uniforms.uPtrOn.value = damp(this.floorMat.uniforms.uPtrOn.value, this.ptr.on && pw ? 0.6 + 0.4 * c : 0, rm ? 1 : 1 - Math.exp(-dt * 6));

    /* The probe: in the small view it rests on Now and goes back there a few
       seconds after the reader lets go, unless the timeline has the keys. */
    var full = this.mode === 'full', focused = this.keyed && document.activeElement === this.el.slider;
    if (!full && this.probeT != null && !this.down && !focused && !this.ptr.on && performance.now() - this.probeHold > 3500) {
      var tNext = rm ? m.now : this.probeT + (m.now - this.probeT) * (1 - Math.exp(-dt * 5));
      if (Math.abs(tNext - m.now) < DAY * 20) { this.probeT = null; this.showRead(false); }
      else { this.probeT = tNext; this.readout(tNext); }
    }
    var pOn = this.probeT != null && Math.abs(this.probeT - m.now) > DAY * 10 ? 1 : 0;
    this.probeShow = damp(this.probeShow, pOn, rm ? 1 : 1 - Math.exp(-dt * 8));
    this.probeMat.uniforms.uI.value = this.probeShow * (0.75 + 0.25 * c);
    if (this.probeT != null) { var ppx = this.x(this.probeT); this.probe.position.x = ppx; this.floorMat.uniforms.uProbeX.value = ppx; }
    this.floorMat.uniforms.uProbeOn.value = this.probeShow;
    if (this.probeLabel) { this.probeLabel.visible = this.probeShow > 0.05 && this.landI > 0.01; this.probeLabel.material.opacity = this.probeShow * this.landI; }
    if (this.obProbe) this.obProbe.material.opacity = 0.55 * this.probeShow * this.orbI;
    this.nowMat.uniforms.uI.value = 0.75 + 0.2 * breath + 0.25 * c;

    /* Hover, and the lanes moving between the two views' row layouts. */
    var kz = rm ? 1 : 1 - Math.exp(-dt * 5), self = this, hov = this.hover;
    if (this.content) this.content.children.forEach(function (gp) {
      var u = gp.userData;
      if (!u || !u.kind) return;
      if (u.z) gp.position.z = damp(gp.position.z, u.z[full ? 'full' : 'mini'], kz);
      var hv = hov === u.item.id || (self.card && self.card.id === u.item.id) ? 1 : 0;
      u.hover = damp(u.hover, hv, rm ? 1 : 1 - Math.exp(-dt * 10));
      if (u.kind === 'star') {
        u.core.material.uniforms.uHover.value = u.hover; u.shell.material.uniforms.uHover.value = u.hover; u.mirror.material.uniforms.uHover.value = u.hover;
        gp.scale.y = 1 + 0.12 * u.hover;
      } else if (u.kind === 'design') {
        u.slab.material.uniforms.uHover.value = u.hover; u.curtain.material.uniforms.uHover.value = u.hover;
      }
    });
    if (this.items) Object.keys(this.items).forEach(function (k) {
      var it = self.items[k];
      if (!it.userData || it.userData.kind !== 'year') return;
      var hv = hov === k || (self.card && self.card.id === k) ? 1 : 0;
      it.userData.hover = damp(it.userData.hover, hv, rm ? 1 : 1 - Math.exp(-dt * 10));
      it.userData.tile.material.uniforms.uHover.value = it.userData.hover;
    });

    if (this.orb && this.orbI > 0.001) {
      this.orbitAt(this.probeT == null ? m.now : this.probeT);
      var kh = rm ? 1 : 1 - Math.exp(-dt * 10);
      this.obItems.forEach(function (it) { var hv = hov === it.id || (self.card && self.card.id === it.id) ? 1 : 0; it.h = damp(it.h, hv, kh); it.u.value = it.h; });
    }
    this.goals();
    this._dt = dt;
    this.placeCamera(rm ? 1 : 1 - Math.exp(-dt * 2.6));
    this.placeOrrery();
    if (this.orrery) this.orrery.visible = this.mode === 'full' && this.landI > 0.5;
    /* Billboards: the exact date pillars and the two columns of light turn to
       face the camera around their own vertical axis. */
    var cp = this.cam.position, face = function (o) { var w = new T.Vector3(); o.getWorldPosition(w); o.rotation.y = Math.atan2(cp.x - w.x, cp.z - w.z); };
    face(this.now); face(this.probe);
    if (this.content) this.content.traverse(function (o) { if (o.userData && o.userData.bill) face(o); });
    if (this.card) this.el.read.style.bottom = (this.el.card.offsetHeight + 22) + 'px';
  };

  P.resize = function () {
    if (!this.r || !this.el.root.isConnected) return;
    var b = this.el.root.getBoundingClientRect(), W = Math.max(2, Math.round(b.width)), H = Math.max(2, Math.round(b.height));
    var dpr = window.devicePixelRatio || 1, L = [Math.min(dpr, 2), Math.min(dpr, 1.5), Math.min(dpr, 1.25), 1, 0.75][this.level];
    var bloom = this.level <= 1 && !GFX.direct;
    if (W === this.W && H === this.H && L === this.pr && bloom === this.bloom) return;
    this.W = W; this.H = H; this.pr = L; this.bloom = bloom;
    this.r.setPixelRatio(L);
    this.r.setSize(W, H, false);
    this.cam.aspect = W / H;
    this.cam.fov = W / H < 1.2 ? 44 : 34;
    this._vsY = null; this.cam.clearViewOffset();
    this.cam.updateProjectionMatrix();
    this.U.uPR.value = L;
    var self = this;
    this.labels.forEach(function (s) { self.sizeLabel(s); });
    this.setupPost();
    if (this.model && this.goal) this.goals();
    this.kick();
  };
  P.setupPost = function () {
    if (this.post) { ['scene', 'a', 'b', 'c', 'd'].forEach(function (k) { this.post[k].dispose(); }, this); }
    this.post = null;
    if (!this.bloom || this._postOff) return;
    var w = Math.round(this.W * this.pr), h = Math.round(this.H * this.pr), type = this.half ? T.HalfFloatType : T.UnsignedByteType;
    var rt = function (ww, hh, s, d) { return new T.WebGLRenderTarget(Math.max(2, ww), Math.max(2, hh), { type: type, samples: s || 0, depthBuffer: !!(s || d) }); };
    var P2 = this.post = { scene: rt(w, h, GFX.nomsaa ? 0 : 4, true), a: rt(w / 4, h / 4), b: rt(w / 4, h / 4), c: rt(w / 8, h / 8), d: rt(w / 8, h / 8) };
    if (!this.postScene) {
      this.postScene = new T.Scene();
      this.postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.quad = new T.Mesh(new T.PlaneGeometry(2, 2));
      this.quad.frustumCulled = false;
      this.postScene.add(this.quad);
      this.mBright = new T.ShaderMaterial({ vertexShader: V_POST, fragmentShader: F_BRIGHT, depthTest: false, depthWrite: false, uniforms: { tIn: { value: null }, uThr: { value: 0.5 } } });
      this.mBlur = new T.ShaderMaterial({ vertexShader: V_POST, fragmentShader: F_BLUR, depthTest: false, depthWrite: false, uniforms: { tIn: { value: null }, uDir: { value: new T.Vector2() } } });
      this.mComp = new T.ShaderMaterial({ vertexShader: V_POST, fragmentShader: F_COMP, depthTest: false, depthWrite: false,
        uniforms: { tScene: { value: null }, tB1: { value: null }, tB2: { value: null }, uStr: { value: 0.8 }, uVig: { value: 0.45 } } });
    }
    return P2;
  };
  P.pass = function (mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.postScene, this.postCam); };
  P.render = function () {
    if (!this.r || !this.model || !this.cam) return;
    var r = this.r;
    if (!this.warm) { this.warmUp(); return; }
    if (!this.post) {
      r.setRenderTarget(null);
      r.render(this.scene, this.cam);
    } else {
      var p = this.post;
      r.setRenderTarget(p.scene); r.render(this.scene, this.cam);
      this.mBright.uniforms.tIn.value = p.scene.texture; this.pass(this.mBright, p.a);
      var bl = this.mBlur.uniforms;
      bl.tIn.value = p.a.texture; bl.uDir.value.set(1 / p.a.width, 0); this.pass(this.mBlur, p.b);
      bl.tIn.value = p.b.texture; bl.uDir.value.set(0, 1 / p.b.height); this.pass(this.mBlur, p.a);
      bl.tIn.value = p.a.texture; bl.uDir.value.set(1 / p.c.width, 0); this.pass(this.mBlur, p.c);
      bl.tIn.value = p.c.texture; bl.uDir.value.set(0, 1 / p.c.height); this.pass(this.mBlur, p.d);
      var cu = this.mComp.uniforms;
      cu.tScene.value = p.scene.texture; cu.tB1.value = p.a.texture; cu.tB2.value = p.d.texture; cu.uStr.value = 0.55 + 0.45 * this.cur;
      this.pass(this.mComp, null);
    }
    /* Revealed where it is seen: a stage built in the lot draws there first,
       and its fade belongs to the reader. */
    if (!this.shown && this.fontsOk && (this.visible || !this.io)) {
      this.shown = true;
      this.el.canvas.style.opacity = '1';
      var me = this;
      setTimeout(function () { if (me._readOn && !me.failed) me.el.read.style.opacity = '1'; }, 600);
      if (this.o.onReady) this.o.onReady();
    }
  };

  P.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.nio) { this.nio.disconnect(); this.nio = null; }
    this.stop();
    if (this._kick) { cancelAnimationFrame(this._kick); this._kick = 0; }
    if (this._postT) { clearTimeout(this._postT); this._postT = 0; }
    if (this._onBlur) window.removeEventListener('blur', this._onBlur);
    document.removeEventListener('visibilitychange', this._on.vis);
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    /* compileAsync polls shader programs until warm-up settles. Keep every
       GPU object alive for that poll, while listeners and frames stop now.
       A lost context with an unresolved poll is left to the collector. */
    var self = this;
    var freeGpu = function () {
      var freed = new Set();
      var release = function (asset) {
        if (!asset || freed.has(asset)) return;
        freed.add(asset);
        if (asset.map) release(asset.map);
        if (typeof asset.dispose === 'function') asset.dispose();
      };
      [self.scene, self.postScene].forEach(function (graph) {
        if (!graph) return;
        graph.traverse(function (node) {
          release(node.geometry);
          (Array.isArray(node.material) ? node.material : [node.material]).forEach(release);
        });
      });
      [self.pillarGeo, self.mBright, self.mBlur, self.mComp].forEach(release);
      if (self.post) ['scene', 'a', 'b', 'c', 'd'].forEach(function (k) { release(self.post[k]); });
      release(self.r);
    };
    if (this._warmJobs) this._warmJobs.then(freeGpu, freeGpu); else freeGpu();
    try { if (this.el.root.parentNode) this.el.root.parentNode.removeChild(this.el.root); } catch (e) { /* gone already */ }
    this.failed = true;
  };

  root.CycleScene = {
    supported: supported,
    create: function (opts) { return new Scene(opts); }
  };
})(typeof window !== 'undefined' ? window : this);
