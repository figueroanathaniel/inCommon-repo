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
    window.addEventListener('blur', function () { if (self.fly) self.fly.blur(); });
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
    if (moved && this.io) { this.io.disconnect(); this.io.observe(this.el.root); }
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
    this.stop();
    try { if (this.el.root.parentNode) this.el.root.parentNode.removeChild(this.el.root); } catch (e) { /* gone already */ }
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
    try {
      jobs.push(r.compileAsync(this.scene, this.cam));
      if (this.post && this.quad) [this.mBright, this.mBlur, this.mComp].forEach(function (m) { self.quad.material = m; jobs.push(r.compileAsync(self.postScene, self.postCam)); });
    } catch (e) { done(); return; }
    Promise.all(jobs).then(done, done);
  };
  P.build = function () {
    if (this.building) return;
    this.building = true;
    var self = this;
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
      uPR: { value: 1 }
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
  P.dispose = function (obj) {
    var labels = this.labels;
    obj.traverse(function (o) {
      if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      if (o.isSprite) { var i = labels.indexOf(o); if (i !== -1) labels.splice(i, 1); }
    });
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
    }
    this.lift(0.35);
    if (this.focusId && full) this.focus(this.focusId);
    this.kick();
  };
  P.goals = function () {
    var m = this.model, c = this.c, full = this.mode === 'full', w = this.win();
    var x0 = this.x(w.from), x1 = this.x(w.to), cx = (x0 + x1) / 2;
    var g = this.goal || (this.goal = {});
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
      this.U.uCam.value.copy(this.cam.position);
      this.U.uFog.value = 1 / (Math.abs(this.cam.position.z - TARGET_Z) * 2.6 + 30);
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
    if (this.flyOk()) this.flyBlend(this._dt);
    this.U.uCam.value.copy(this.cam.position);
    this.U.uFog.value = 1 / (r.dist * 2.6 + 18);
    this.sky.position.copy(this.cam.position);
    this.stars.position.copy(this.cam.position);
  };
  P.settled = function () {
    var r = this.rig, g = this.goal;
    if (!r || !g) return true;
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
    if (this.mode !== 'full' || !this.user.dist) return;
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
    if (this.mode === 'full') {
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
    var full = this.mode === 'full';
    var hits = this.ray.intersectObjects(this.picks.filter(function (p) { return p.parent && (full || p.parent.visible !== false) && p.visible !== false && (!p.parent.parent || p.parent.visible); }), false);
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
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: this.user.dist };
      this.down = null;
      return;
    }
    this.keyed = false;
    this.el.slider.style.boxShadow = 'none';
    this.down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, id: e.pointerId, axis: null, type: e.pointerType, elev: this.user.elev, center: this.user.center };
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
      else if (dn.axis === 'x') {
        var f = this.floorAt(n);
        if (f) { this.setProbe(this.t(f.x)); this.probeShow = 1; this.showRead(true); this.hideTip(); }
        this.lift(0.02);
      } else if (dn.axis === 'y' && this.mode === 'full') {
        this.user.elev = clamp(dn.elev + dy * 0.004, 0.2, 1.1);
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
      var f = this.floorAt(n);
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
    if (want && this.reduced && !this.isFlying()) { this.stop(); this.kick(); return; }
    if (want && !this.running) { this.running = true; this.last = 0; this.raf = requestAnimationFrame(this._tick || (this._tick = this.tick.bind(this))); }
    else if (!want) this.stop();
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
    if (this.lastDraw) this.measure(ts - this.lastDraw, busy);
    this.lastDraw = ts;
    this.step(dt, false);
    this.render();
  };
  P.measure = function (ms, busy) {
    if (!busy) return;
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
    this.dustMat.uniforms.uAlpha.value = 0.4 + 0.45 * c;
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
    if (this.probeLabel) { this.probeLabel.visible = this.probeShow > 0.05; this.probeLabel.material.opacity = this.probeShow; }
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

    this.goals();
    this._dt = dt;
    this.placeCamera(rm ? 1 : 1 - Math.exp(-dt * 2.6));
    this.placeOrrery();
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
    var bloom = this.level <= 1;
    if (W === this.W && H === this.H && L === this.pr && bloom === this.bloom) return;
    this.W = W; this.H = H; this.pr = L; this.bloom = bloom;
    this.r.setPixelRatio(L);
    this.r.setSize(W, H, false);
    this.cam.aspect = W / H;
    this.cam.fov = W / H < 1.2 ? 44 : 34;
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
    if (!this.bloom) return;
    var w = Math.round(this.W * this.pr), h = Math.round(this.H * this.pr), type = this.half ? T.HalfFloatType : T.UnsignedByteType;
    var rt = function (ww, hh, s) { return new T.WebGLRenderTarget(Math.max(2, ww), Math.max(2, hh), { type: type, samples: s || 0, depthBuffer: !!s }); };
    var P2 = this.post = { scene: rt(w, h, 4), a: rt(w / 4, h / 4), b: rt(w / 4, h / 4), c: rt(w / 8, h / 8), d: rt(w / 8, h / 8) };
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
    if (!this.shown && this.fontsOk) {
      this.shown = true;
      this.el.canvas.style.opacity = '1';
      var me = this;
      setTimeout(function () { if (me._readOn && !me.failed) me.el.read.style.opacity = '1'; }, 600);
      if (this.o.onReady) this.o.onReady();
    }
  };

  P.destroy = function () {
    if (this.nio) { this.nio.disconnect(); this.nio = null; }
    this.stop();
    document.removeEventListener('visibilitychange', this._on.vis);
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    if (this.content) this.dispose(this.content);
    if (this.post) { ['scene', 'a', 'b', 'c', 'd'].forEach(function (k) { this.post[k].dispose(); }, this); }
    if (this.r) { this.r.dispose(); }
    try { if (this.el.root.parentNode) this.el.root.parentNode.removeChild(this.el.root); } catch (e) { /* gone already */ }
    this.failed = true;
  };

  root.CycleScene = {
    supported: supported,
    create: function (opts) { return new Scene(opts); }
  };
})(typeof window !== 'undefined' ? window : this);
