/* chart-scene.js: THE NATAL CHART IN DEPTH.

   The owner, 19 October 2026: "Update the astrology page to make it as if it
   was built by unreal engine. Make a 3D natal chart, an orbital option, and a
   standard 2D chart. Make the logos fit elegantly." So the wheel is drawn three
   ways. The 2D wheel is the app's own SVG and stays exactly as it was. This
   file draws the other two, as one three.js scene that moves between them:

   3D is the wheel as an object, an astrolabe lying in space. The disc carries
   the house band, the sign band with a tick for every degree, and the inner
   field the aspects cross. Each astral body stands on a pillar of light over
   its own longitude, at the radius the 2D wheel staggers it to, and wears its
   glyph above it. The aspects are ribbons of light bowed over the disc, and
   the four angles are beams at the rim.

   Orbital is the same sky as an orrery: the person at the centre, each body on
   an orbit of its own in the order the bodies stand from the Earth, the nodes
   on the Moon's, and the zodiac drawn outward into a belt round all of it. The
   angle a body makes from the centre is still its longitude, so the chart is
   the same chart; what changes is that distance means something. A switch lays
   today's sky over it as ghosts, each with the arc it has travelled since.

   Moving between the two is a morph, not a cut: the sign band slides outward
   into the belt while the bodies step down off their pillars onto their
   orbits, and the aspect ribbons follow their ends.

   WHAT IT DRAWS IS THE APP'S, NEVER ITS OWN. Every position, stagger level,
   house, aspect and colour arrives in the model the app builds
   (chartSceneModel), from the same fullChart() and natalAspects() the 2D wheel
   reads, so the views cannot disagree. Today's positions come through
   opts.lonAt, the app's own lonOf(). Nothing here computes a chart, and
   nothing here is sent anywhere.

   THE GLYPHS ARE SET, NOT TYPED. Astrological symbols sit at different heights
   in every font that carries them, so a glyph centred on its text box rides
   high or low in its roundel. Each one is measured (actualBoundingBox) and
   placed on its optical centre, inside a roundel ringed in the colour the 2D
   wheel gives it, at a fixed pixel size so it reads the same near and far.

   BREATHING. One number, curiosity, rises with what the reader does and
   decays over about eight seconds; it lifts the glow, the bloom and the dust.
   Hovering a body lights its aspects and quiets the rest. Under reduced motion
   nothing animates: a frame is drawn when something changes, the morph and the
   camera cut, and the sky holds still rather than vanishing.

   THE FALLBACK IS THE APP'S 2D WHEEL. Without WebGL 2, or when three.js does
   not load, or when the context is lost, opts.onFail tells the app, which shows
   the SVG and hides the other two choices. The scene never paints a broken
   frame in its place.

   THE LOOP IS ONLY WHERE IT IS SEEN: while the host is in the document, on
   screen and the page visible, at 60 frames a second while something moves
   and 30 at rest, with a quality ladder that drops the pixel ratio and then the
   bloom when frames run long. three.js is the copy the cover vendors, imported
   on first use with import('./three.module.js'). */
(function (root) {
  'use strict';

  var T = null, loading = null, okGL = null;
  var RAD = Math.PI / 180;
  /* The 2D wheel's radii (out of 386), at ten units for the rim. */
  function sc(r) { return r / 386 * 10; }
  var R_OUT = sc(386), R_HOUSE = sc(322), R_SIGN_IN = sc(266), R_INNER = sc(206), R_ASP = sc(196);
  /* The same radii once the zodiac has slid out into the orrery's belt. */
  var O_SIGN_IN = 10.9, O_SIGN_OUT = 12.1, O_GLYPH = 11.5;
  /* Orbits, in the order the bodies stand from the Earth. */
  var ORBIT = { Moon: 2.5, Mercury: 3.3, Venus: 4.05, Sun: 4.8, Mars: 5.55, Jupiter: 6.55, Saturn: 7.35, Uranus: 8.2, Neptune: 9.0, Pluto: 9.75,
    'North Node': 2.5, 'South Node': 2.5 };
  var BELT = { asteroid: 6.05, centaur: 7.8, tno: 10.3 };

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
  function ease(k) { return k * k * (3 - 2 * k); }
  function mix(a, b, k) { return a + (b - a) * k; }
  function wrapPi(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

  /* ---- Shaders ------------------------------------------------------------ */
  var FOG = 'uniform vec3 uCam; uniform float uFog;\nfloat fogK(vec3 w){ float d = distance(w, uCam); return exp(-pow(d * uFog, 2.0)); }\n';
  var V_UV = 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';

  /* The disc: every ring, tick and division is drawn here rather than built,
     so a hundred lines cost one draw and stay sharp at any distance. Radii are
     uniforms, which is what lets the zodiac slide outward in the morph. */
  var F_DISC = FOG + [
    'uniform vec3 uBg; uniform vec3 uLine; uniform vec3 uAtm; uniform vec3 uAtm2; uniform vec3 uHi; uniform vec3 uAc2; uniform vec3 uSel;',
    'uniform float uZero; uniform float uK; uniform float uSignIn; uniform float uSignOut; uniform float uOut; uniform float uInner;',
    'uniform vec2 uPtr; uniform float uPtrOn; uniform float uBreath; uniform float uHouse; uniform float uTimed; uniform vec3 uOrbits[12]; uniform float uNOrb;',
    'varying vec2 vUv; varying vec3 vW;',
    'float ring(float r, float at, float w){ float fw = fwidth(r) * 1.2 + 0.002; return 1.0 - smoothstep(w, w + fw, abs(r - at)); }',
    'void main(){',
    ' vec2 p = vec2(vW.x, -vW.z); float r = length(p);',
    ' if (r > uOut + 0.9) discard;',
    ' float th = atan(p.y, p.x); float lon = mod(degrees(th) - 180.0 + uZero + 720.0, 360.0);',
    ' float rel = mod(lon - uZero + 720.0, 360.0);',
    ' float fw = fwidth(r) * 1.2 + 0.002; float w1 = 1.0 - uK;',
    ' vec3 c = uBg;',
    /* the inner field: a lens of warm light under the aspects */
    ' c += uAtm2 * 0.07 * exp(-r * r * 0.05) * (0.8 + 0.2 * uBreath);',
    ' c += uAtm * 0.05 * smoothstep(uOut + 0.4, 0.0, r);',
    /* the sign band */
    ' float inSign = smoothstep(uSignIn - fw, uSignIn + fw, r) * (1.0 - smoothstep(uSignOut - fw, uSignOut + fw, r));',
    ' float alt = step(0.5, fract(lon / 60.0));',
    ' c += uAc2 * inSign * (0.035 + 0.03 * alt);',
    ' float sd = abs(fract(lon / 30.0 + 0.5) - 0.5) * 30.0 * 0.01745 * r;',
    ' c += uLine * inSign * (1.0 - smoothstep(0.012, 0.012 + fw, sd)) * 0.32;',
    /* a tick for every degree on the band\'s inner edge, longer at five and ten */
    ' float dd = abs(fract(lon + 0.5) - 0.5) * 0.01745 * r; float d5 = abs(fract(lon / 5.0 + 0.5) - 0.5) * 5.0 * 0.01745 * r; float d10 = abs(fract(lon / 10.0 + 0.5) - 0.5) * 10.0 * 0.01745 * r;',
    ' float tl = mix(0.1, 0.17, step(d5, 0.03)); tl = mix(tl, 0.26, step(d10, 0.03));',
    ' float inTick = step(uSignIn, r) * (1.0 - step(uSignIn + tl, r));',
    ' c += uLine * inTick * (1.0 - smoothstep(0.006, 0.006 + fw, min(dd, min(d5, d10)))) * 0.42;',
    /* the house band, with its cusps and the one a reader has open */
    ' float inHouse = smoothstep(uSignOut - fw, uSignOut + fw, r) * (1.0 - smoothstep(uOut - fw, uOut + fw, r)) * w1;',
    ' float hd = abs(fract(rel / 30.0 + 0.5) - 0.5) * 30.0 * 0.01745 * r;',
    ' float hn = floor(rel / 30.0) + 1.0; float ang = step(abs(mod(hn - 1.0, 3.0)), 0.5);',
    ' c += uLine * inHouse * (1.0 - smoothstep(0.01 + 0.008 * ang, 0.01 + 0.008 * ang + fw, hd)) * (0.16 + 0.14 * ang);',
    ' c += uSel * inHouse * step(abs(hn - uHouse), 0.5) * 0.16;',
    /* the house cusps carry on across the inner field, faintly */
    ' float inIn = (1.0 - smoothstep(uInner - fw, uInner + fw, r)) * smoothstep(0.6, 1.2, r) * w1 * uTimed;',
    ' c += uLine * inIn * (1.0 - smoothstep(0.006, 0.006 + fw, hd)) * 0.06 * ang;',
    /* the rings */
    ' float rings = ring(r, uOut, 0.016) * 0.55 + ring(r, uSignOut, 0.012) * 0.5 + ring(r, uSignIn, 0.012) * 0.5 + ring(r, uInner, 0.008) * 0.32 * w1;',
    ' c += uLine * rings * 0.6 + uAc2 * ring(r, uOut, 0.05) * 0.25;',
    /* the orbits, in the orrery */
    ' float orb = 0.0; for (int i = 0; i < 12; i++) { if (float(i) >= uNOrb) break; orb += ring(r, uOrbits[i].x, 0.006 + 0.006 * uOrbits[i].y) * (0.18 + 0.32 * uOrbits[i].y) * uOrbits[i].z; }',
    ' c += mix(uLine, uHi, 0.35) * orb * uK;',
    ' vec2 dp = p - uPtr; c += uAtm * 0.18 * uPtrOn * exp(-dot(dp, dp) * 0.5);',
    ' float edge = 1.0 - smoothstep(uOut + 0.15, uOut + 0.9, r);',
    ' c = mix(uBg, c, fogK(vW));',
    ' gl_FragColor = vec4(c, edge * (0.9 - 0.25 * uK)); }'].join('\n');

  var F_WALL = FOG + [
    'uniform vec3 uC; uniform float uI; varying vec2 vUv; varying vec3 vW;',
    'void main(){ float v = vUv.y; float top = exp(-pow((1.0 - v) * 9.0, 2.0)); float body = pow(v, 2.0) * 0.22;',
    ' gl_FragColor = vec4(uC * (top + body) * uI * fogK(vW), 1.0); }'].join('\n');

  var F_PILLAR = FOG + [
    'uniform vec3 uC; uniform float uI; uniform float uCore; varying vec2 vUv; varying vec3 vW;',
    'void main(){ float x = (vUv.x - 0.5) * 2.0; float core = exp(-x * x * uCore); float halo = exp(-x * x * 3.5) * 0.24;',
    ' float v = vUv.y; float fade = smoothstep(0.0, 0.04, v) * (0.35 + 0.65 * (1.0 - v));',
    ' gl_FragColor = vec4(uC * (core + halo) * fade * uI * fogK(vW), 1.0); }'].join('\n');

  var V_ORB = 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  var F_ORB = FOG + [
    'uniform vec3 uC; uniform vec3 uCore; uniform float uHover; uniform float uGlow; uniform float uGhost; uniform float uOp;',
    'varying vec3 vN; varying vec3 vV; varying vec3 vW;',
    'void main(){ float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); float rim = pow(1.0 - f, 2.2);',
    ' vec3 c = mix(uCore * (0.22 + 0.5 * pow(f, 1.6)), uC, rim) + uC * rim * (0.5 + 0.7 * uHover);',
    ' if (uGhost > 0.5) c = uC * (rim * 1.6 + 0.12);',
    ' c *= uGlow * (0.85 + 0.3 * uHover) * uOp;',
    ' gl_FragColor = vec4(c * fogK(vW), 1.0); }'].join('\n');

  /* A ribbon between two points that bows upward, a constant number of pixels
     wide wherever it is seen from. The ends are uniforms, so a ribbon follows
     its bodies through the morph without its geometry being rebuilt. */
  var V_RIB = [
    'attribute float aU; attribute float aSide; uniform vec3 uA; uniform vec3 uB; uniform float uBow; uniform float uW; uniform vec2 uRes;',
    'varying vec2 vUv; varying vec3 vW;',
    'vec3 P(float u){ vec3 p = mix(uA, uB, u); p.y += uBow * 4.0 * u * (1.0 - u); return p; }',
    'void main(){ vec3 p = P(aU); vec4 cp = projectionMatrix * viewMatrix * vec4(p, 1.0);',
    ' vec4 c1 = projectionMatrix * viewMatrix * vec4(P(min(1.0, aU + 0.01)), 1.0); vec4 c0 = projectionMatrix * viewMatrix * vec4(P(max(0.0, aU - 0.01)), 1.0);',
    ' vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * uRes; float l = length(d); vec2 n = l > 1e-5 ? vec2(-d.y, d.x) / l : vec2(0.0, 1.0);',
    ' cp.xy += n * aSide * uW / uRes * cp.w; vUv = vec2(aU, aSide); vW = p; gl_Position = cp; }'].join('\n');
  var F_RIB = FOG + [
    'uniform vec3 uC; uniform float uI; uniform float uDash; uniform float uLen; uniform float uTime; uniform float uPulse;',
    'varying vec2 vUv; varying vec3 vW;',
    'void main(){ float s = 1.0 - abs(vUv.y); float a = pow(s, 1.6) * 0.7 + pow(s, 8.0) * 0.8;',
    ' float ends = smoothstep(0.0, 0.03, vUv.x) * smoothstep(1.0, 0.97, vUv.x);',
    ' if (uDash > 0.5) a *= 0.35 + 0.65 * step(0.45, fract(vUv.x * uLen * 2.2));',
    ' float pl = pow(0.5 + 0.5 * sin((vUv.x * 2.0 - uTime * 0.5) * 6.2832), 10.0) * uPulse;',
    ' gl_FragColor = vec4(uC * a * ends * (uI + pl * 0.8) * fogK(vW), 1.0); }'].join('\n');

  var V_SKY = 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  var F_SKY = [
    'uniform vec3 uBg; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC3; uniform float uAtmo; uniform float uTime; varying vec3 vD;',
    'void main(){ float e = vD.y; vec3 c = uBg;',
    ' c += uA * uAtmo * 0.3 * exp(-pow((e - 0.35) * 2.2, 2.0));',
    ' c += uB * uAtmo * 0.12 * exp(-pow((e + 0.05) * 6.0, 2.0));',
    ' float n = sin(vD.x * 5.0 + uTime * 0.012) * sin(vD.z * 4.0 - uTime * 0.009) * 0.5 + 0.5;',
    ' c += uC3 * uAtmo * 0.06 * n * smoothstep(-0.2, 0.6, e);',
    ' gl_FragColor = vec4(c, 1.0); }'].join('\n');
  var V_POINTS = [
    'attribute float aSize; attribute vec3 aCol; uniform float uPR; uniform float uScale; uniform float uTime; varying vec3 vC; varying float vTw;',
    'void main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    ' vTw = 0.7 + 0.3 * sin(uTime * (0.5 + fract(aSize * 7.13) * 1.7) + position.x * 3.0);',
    ' gl_PointSize = aSize * uPR * uScale / max(0.2, -mv.z); gl_Position = projectionMatrix * mv; }'].join('\n');
  var F_POINTS = [
    'uniform float uI; varying vec3 vC; varying float vTw;',
    'void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p) * 2.0; if (d > 1.0) discard;',
    ' float a = exp(-d * d * 4.0) * 0.8 + exp(-d * d * 36.0); gl_FragColor = vec4(vC * a * uI * vTw, 1.0); }'].join('\n');
  var V_DUST = [
    'attribute float aR; uniform float uDrift; uniform float uTime; uniform float uPR;',
    'varying float vA; varying float vR;',
    'void main(){ vec3 p = position; p.y = mod(p.y + uDrift * (0.25 + aR), 6.0) - 0.5;',
    ' p.x += sin(uTime * 0.13 + aR * 40.0) * 0.35; p.z += cos(uTime * 0.11 + aR * 30.0) * 0.3;',
    ' vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    ' gl_PointSize = (1.0 + aR * 2.2) * uPR * (11.0 / max(0.5, -mv.z));',
    ' vA = (0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * (0.7 + aR * 2.0) + aR * 20.0))) * smoothstep(-0.5, 0.4, p.y) * smoothstep(5.5, 3.5, p.y);',
    ' vR = aR; gl_Position = projectionMatrix * mv; }'].join('\n');
  var F_DUST = [
    'uniform vec3 uC1; uniform vec3 uC2; uniform float uAlpha; varying float vA; varying float vR;',
    'void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q) * 2.0; if (d > 1.0) discard;',
    ' gl_FragColor = vec4(mix(uC1, uC2, vR) * exp(-d * d * 5.0) * vA * uAlpha, 1.0); }'].join('\n');
  var V_MOTE = [
    'attribute float aEnd; attribute float aR; uniform vec3 uCamP; uniform vec3 uVel; uniform float uBox;',
    'varying float vA;',
    'void main(){ vec3 p = mod(position - uCamP + uBox * 0.5, uBox) - uBox * 0.5 + uCamP;',
    ' float sp = length(uVel); p -= uVel * aEnd * (0.035 + 0.02 * aR);',
    ' float d = distance(p, uCamP); vA = smoothstep(uBox * 0.5, uBox * 0.15, d) * smoothstep(0.05, 0.4, d) * (0.25 + 0.75 * aR) * (0.35 + min(1.0, sp * 0.25)) * (1.0 - aEnd * 0.85);',
    ' gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }'].join('\n');
  var F_MOTE = 'uniform vec3 uC; varying float vA; void main(){ gl_FragColor = vec4(uC * vA, 1.0); }';
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
    ' float v = smoothstep(1.2, 0.3, length((vUv - 0.5) * vec2(1.3, 1.3))); c *= mix(1.0, v, uVig);',
    ' c = c / (1.0 + max(vec3(0.0), c - 0.85) * 0.9); gl_FragColor = vec4(c, 1.0); }'].join('\n');

  /* ---- Reading the palette off the page ----------------------------------- */
  var DEFAULT_TOK = {
    bg: [0.02, 0.024, 0.04], tx: [0.933, 0.941, 0.973], ac2: [0.545, 0.361, 0.965], hi: [0.718, 0.608, 1], blue: [0.49, 0.608, 1],
    atm: [0.184, 0.31, 0.839], atm2: [0.949, 0.839, 0.62], atm3: [0.184, 0.31, 0.839], ac: [0.184, 1, 0.561],
    cTx: 'rgb(238, 240, 248)', cMut: 'rgba(238, 240, 248, 0.58)', cHi: 'rgb(183, 155, 255)', cBlue: 'rgb(125, 155, 255)', cBg: 'rgb(5, 6, 10)',
    atmo: 0.85, fd: 'serif', fu: 'sans-serif'
  };
  function probe(el) {
    var pr = document.createElement('span');
    pr.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
    el.appendChild(pr);
    return pr;
  }
  function cssColor(pr, v, fb) {
    pr.style.color = fb || 'rgb(128,128,128)';
    if (v) pr.style.color = v;
    return getComputedStyle(pr).color || 'rgb(128,128,128)';
  }
  function toVec(c) {
    var m = /rgba?\(([^)]+)\)/.exec(c);
    var p = m ? m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat) : [128, 128, 128];
    return [p[0] / 255, p[1] / 255, p[2] / 255];
  }
  function readTokens(el) {
    if (!el || !el.isConnected) return null;
    var cs = getComputedStyle(el);
    if (!cs.getPropertyValue('--tx').trim()) return null;
    var pr = probe(el);
    function css(name, fb) {
      var v = cs.getPropertyValue(name).trim();
      if (/^\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?$/.test(v)) v = 'rgb(' + v + ')';
      return cssColor(pr, v, fb);
    }
    var out = {
      bg: toVec(css('--bg', 'rgb(5,6,10)')), tx: toVec(css('--tx')), ac2: toVec(css('--ac2')), hi: toVec(css('--ac2-hi')), blue: toVec(css('--blue')),
      atm: toVec(css('--atmc')), atm2: toVec(css('--atmc2')), atm3: toVec(css('--atmc3')), ac: toVec(css('--ac')),
      cTx: css('--tx'), cMut: css('--mut'), cHi: css('--ac2-hi'), cBlue: css('--blue'), cBg: css('--bg'),
      atmo: parseFloat(cs.getPropertyValue('--atmo')) || 0.6,
      fd: cs.getPropertyValue('--fd').trim() || 'serif', fu: cs.getPropertyValue('--fu').trim() || 'sans-serif'
    };
    el.removeChild(pr);
    return out;
  }
  function v3(a) { return new T.Vector3(a[0], a[1], a[2]); }
  /* A font stack that carries the astrological block on every platform this
     app ships to, before the display face, which mostly does not. */
  var GLYPH_FONT = '"Apple Symbols","Segoe UI Symbol","Noto Sans Symbols","Noto Sans Symbols 2","DejaVu Sans",Georgia,serif';

  /* ---- The scene ----------------------------------------------------------- */
  function Scene(opts) {
    this.o = opts || {};
    this.host = null; this.model = null; this.view = '3d';
    this.ready = false; this.failed = false; this.building = false;
    this.running = false; this.visible = true; this.raf = 0; this.last = 0; this.lastDraw = 0;
    this.c = 0; this.cur = 0; this.time = 0; this.drift = 0;
    this.k = 0; this.kGoal = 0;
    this.ptr = { x: 0, y: 0, px: 0, py: 0, on: false, moved: false };
    this.down = null; this.pinch = null; this.hover = null; this.focusKey = null;
    this.sel = { aspect: null, house: null, body: null };
    this.todayOn = false; this.todayK = 0;
    this.rig = null; this.user = { yaw: 0, pitch: null, zoom: 1 };
    this.level = 0; this.frames = []; this.labels = [];
    /* 'stage' is the card; 'obs' is the Observatory, the full screen view */
    this.mode = 'stage'; this.fly = null; this.ret = null; this.globes = null; this.globeCount = 0;
    this.hoverKey = null; this.hud = null; this.booted = false;
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.dom();
  }
  var P = Scene.prototype;

  P.dom = function () {
    var self = this, r = document.createElement('div');
    r.setAttribute('data-cs-root', '1');
    r.style.cssText = 'position:absolute;inset:0;overflow:hidden;border-radius:inherit;background:var(--bg)';
    var s = document.createElement('div');
    s.style.cssText = 'position:absolute;inset:0;outline:none;cursor:grab;touch-action:pan-y;-webkit-tap-highlight-color:transparent';
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:100%;opacity:0;transition:opacity 1.2s cubic-bezier(.22,.61,.36,1)';
    s.appendChild(cv);
    r.appendChild(s);
    var tip = document.createElement('div');
    tip.setAttribute('aria-hidden', 'true');
    tip.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;opacity:0;transition:opacity .18s ease;max-width:260px;padding:8px 11px;border-radius:10px;background:var(--bg);border:1px solid var(--ac2);font:400 12px/1.45 var(--fu);color:var(--tx);white-space:pre-line;box-shadow:0 6px 24px rgba(0,0,0,.45)';
    r.appendChild(tip);
    this.el = { root: r, pad: s, canvas: cv, tip: tip };
    this._on = {
      down: function (e) { self.onDown(e); }, move: function (e) { self.onMove(e); }, up: function (e) { self.onUp(e); },
      cancel: function (e) { if (self.pts) delete self.pts[e.pointerId]; self.pinch = null; self.down = null; },
      leave: function () { self.ptr.on = false; self.ptr.moved = true; self.setHover(null); self.hideTip(); self.kick(); },
      wheel: function (e) { self.onWheel(e); },
      vis: function () { self.updateRun(); }
    };
    s.addEventListener('pointerdown', this._on.down);
    s.addEventListener('pointermove', this._on.move);
    s.addEventListener('pointerup', this._on.up);
    s.addEventListener('pointercancel', this._on.cancel);
    s.addEventListener('pointerleave', this._on.leave);
    s.addEventListener('wheel', this._on.wheel, { passive: false });
    document.addEventListener('visibilitychange', this._on.vis);
  };

  /* ---- Attaching, and the lazy build -------------------------------------- */
  P.attach = function (host) {
    if (this.failed || !host) return;
    var moved = this.host !== host || this.el.root.parentNode !== host;
    if (moved) {
      if (this.host && this._onKey) this.host.removeEventListener('keydown', this._onKey);
      if (this.host && this._onKeyUp) this.host.removeEventListener('keyup', this._onKeyUp);
      host.appendChild(this.el.root);
      var self = this;
      this._onKey = this._onKey || function (e) { self.onKey(e); };
      this._onKeyUp = this._onKeyUp || function (e) { if (self.fly && self.mode !== 'obs') self.fly.key(e, false); };
      host.addEventListener('keydown', this._onKey);
      host.addEventListener('keyup', this._onKeyUp);
      if (!this._onBlur) { this._onBlur = function () { if (self.fly) self.fly.blur(); }; window.addEventListener('blur', this._onBlur); }
    }
    this.host = host;
    if (!this.io && window.IntersectionObserver) {
      var me = this;
      this.io = new IntersectionObserver(function (es) {
        me.visible = es.some(function (x) { return x.isIntersecting; });
        /* Free look ends when the stage leaves the screen, so the page never
           comes back to a stage still holding the reader's finger. */
        if (!me.visible && me.explore) { me.setExplore(false); if (me.o.onExploreEnd) me.o.onExploreEnd(); }
        me.updateRun();
      });
    }
    if (moved && this.io) { this.io.disconnect(); this.io.observe(this.el.root); }
    if (!this.ro && window.ResizeObserver) { var m2 = this; this.ro = new ResizeObserver(function () { m2.resize(); }); }
    if (moved && this.ro) { this.ro.disconnect(); this.ro.observe(this.el.root); }
    if (moved && this.mode === 'obs') this.bindObs();
    if (!this.ready) { this.buildNear(); return; }
    if (!this.tokOk) this.setTheme();
    this.resize();
    if (moved) this.rig = null;
    this.updateRun();
    this.kick();
  };
  P.detach = function () {
    if (this.host && this._onKey) this.host.removeEventListener('keydown', this._onKey);
    if (this.host && this._onKeyUp) this.host.removeEventListener('keyup', this._onKeyUp);
    this.host = null;
    this.stop();
  };
  P.setModel = function (m) {
    if (!m) return;
    if (this.model && this.model.key === m.key) return;
    this.model = m;
    if (this.focusKey && !this.bodyBy(this.focusKey)) this.focusKey = null;
    if (this.ready) { this.buildContent(); this.kick(); }
  };
  P.setView = function (v) {
    v = v === 'orbit' ? 'orbit' : '3d';
    if (this.view === v && this.kGoal === (v === 'orbit' ? 1 : 0)) return;
    this.view = v;
    this.kGoal = v === 'orbit' ? 1 : 0;
    if (this.reduced || !this.ready) this.k = this.kGoal;
    this.user.pitch = null;
    this.lift(0.4);
    this.kick();
  };
  /* FREE LOOK. On a touch screen a vertical drag is the page scrolling, so by
     default only a sideways one turns the scene. Free look is the reader saying
     the stage is theirs: one finger orbits both ways, the page holds still,
     and a pinch still zooms. The app shows the switch on touch screens only. */
  P.setExplore = function (on) {
    on = !!on;
    if (this.explore === on) return;
    this.explore = on;
    this.el.pad.style.touchAction = on ? 'none' : 'pan-y';
    this.lift(0.2);
    this.kick();
  };
  P.setFocus = function (key, turn) {
    if (this.focusKey === key) return;
    this.focusKey = key || null;
    if (key && turn !== false) this.turnTo(key);
    this.kick();
  };
  P.setSelection = function (s) {
    s = s || {};
    this.sel = { aspect: s.aspect == null ? null : s.aspect, house: s.house == null ? null : s.house, body: s.body || null };
    this.kick();
  };
  P.setToday = function (on) {
    on = !!on;
    if (this.todayOn === on) return;
    this.todayOn = on;
    if (on && this.ready) this.buildToday();
    if (this.reduced) this.todayK = on ? 1 : 0;
    this.lift(0.25);
    this.kick();
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
  /* Built now, wherever it is: the app builds a stage in its offscreen lot
     before the reader asks for it, which buildNear() would wait on forever. */
  P.prebuild = function () {
    if (this.ready || this.building || this.failed) return;
    if (this.nio) { this.nio.disconnect(); this.nio = null; }
    this.build();
  };
  P.build = function () {
    if (this.building || this.ready) return;
    this.building = true;
    var self = this;
    load().then(function () {
      self.building = false;
      if (self.failed) return;
      try { self.init(); } catch (e) { self.fail('init'); return; }
      if (self.host) {
        if (!self.tokOk) self.setTheme();
        self.resize();
        self.updateRun();
        self.kick();
      }
      /* The display face may land after the first labels were drawn with the
         fallback; draw them once more when it has. */
      /* The display face may land after the first labels were drawn with the
         fallback, so the scene is not shown until it has: the reader sees
         Loading, then the finished picture, and never the labels jumping. */
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
    this.cam = new T.PerspectiveCamera(36, 1, 0.1, 400);
    this.scene.add(this.cam);
    this.U = { uCam: { value: new T.Vector3() }, uFog: { value: 0.02 }, uTime: { value: 0 }, uGlow: { value: 1 }, uBreath: { value: 0 },
      uPR: { value: 1 }, uRes: { value: new T.Vector2(1, 1) } };

    this.skyMat = new T.ShaderMaterial({ vertexShader: V_SKY, fragmentShader: F_SKY, side: T.BackSide, depthWrite: false,
      uniforms: { uBg: { value: new T.Vector3() }, uA: { value: new T.Vector3() }, uB: { value: new T.Vector3() }, uC3: { value: new T.Vector3() }, uAtmo: { value: 0.6 }, uTime: this.U.uTime } });
    this.sky = new T.Mesh(new T.SphereGeometry(150, 32, 16), this.skyMat);
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);

    var n = phone ? 800 : 1500, pos = new Float32Array(n * 3), sz = new Float32Array(n), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var u = Math.random(), v = Math.random(), th = u * Math.PI * 2, ph = Math.acos(1 - 2 * v);
      pos[i * 3] = Math.sin(ph) * Math.cos(th) * 120; pos[i * 3 + 1] = Math.cos(ph) * 120; pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 120;
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

    var orbV = []; for (var o = 0; o < 12; o++) orbV.push(new T.Vector3());
    this.discMat = new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_DISC, transparent: true, depthWrite: false,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uBreath: this.U.uBreath, uBg: { value: new T.Vector3() }, uLine: { value: new T.Vector3() }, uAtm: { value: new T.Vector3() },
        uAtm2: { value: new T.Vector3() }, uHi: { value: new T.Vector3() }, uAc2: { value: new T.Vector3() }, uSel: { value: new T.Vector3() },
        uZero: { value: 0 }, uK: { value: 0 }, uSignIn: { value: R_SIGN_IN }, uSignOut: { value: R_HOUSE }, uOut: { value: R_OUT }, uInner: { value: R_INNER },
        uPtr: { value: new T.Vector2() }, uPtrOn: { value: 0 }, uHouse: { value: -1 }, uTimed: { value: 1 }, uOrbits: { value: orbV }, uNOrb: { value: 0 } } });
    var disc = new T.Mesh(new T.CircleGeometry(13.4, 160), this.discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.renderOrder = -5;
    this.disc = disc;
    this.scene.add(disc);

    /* The rims stand up out of the disc: the rim itself, the two edges of the
       sign band and the edge of the inner field. Each is a unit cylinder,
       scaled to its radius every frame, so the morph can carry it outward. */
    var wg = new T.CylinderGeometry(1, 1, 1, 160, 1, true); wg.translate(0, 0.5, 0);
    this.wallGeo = wg;
    var mkWall = function (h) {
      var m = new T.Mesh(wg, new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_WALL, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
        uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uC: { value: new T.Vector3() }, uI: { value: 1 } } }));
      m.userData.h = h; m.userData.sharedGeo = true;
      self.scene.add(m);
      return m;
    };
    this.walls = { out: mkWall(0.34), signOut: mkWall(0.2), signIn: mkWall(0.16), inner: mkWall(0.08) };

    var dn = phone ? 300 : 560, dp = new Float32Array(dn * 3), dr = new Float32Array(dn);
    for (var j = 0; j < dn; j++) { var a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 14; dp[j * 3] = Math.cos(a) * rr; dp[j * 3 + 1] = Math.random() * 6; dp[j * 3 + 2] = Math.sin(a) * rr; dr[j] = Math.random(); }
    var dg = new T.BufferGeometry();
    dg.setAttribute('position', new T.BufferAttribute(dp, 3));
    dg.setAttribute('aR', new T.BufferAttribute(dr, 1));
    this.dustMat = new T.ShaderMaterial({ vertexShader: V_DUST, fragmentShader: F_DUST, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uDrift: { value: 0 }, uTime: this.U.uTime, uPR: this.U.uPR, uC1: { value: new T.Vector3() }, uC2: { value: new T.Vector3() }, uAlpha: { value: 0.5 } } });
    this.dust = new T.Points(dg, this.dustMat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);

    var pg = new T.PlaneGeometry(1, 1); pg.translate(0, 0.5, 0);
    this.pillarGeo = pg;
    this.orbGeo = new T.SphereGeometry(1, 40, 24);
    var rib = new T.BufferGeometry(), N = 48, au = new Float32Array((N + 1) * 2), as = new Float32Array((N + 1) * 2), idx = [];
    for (var q = 0; q <= N; q++) { au[q * 2] = au[q * 2 + 1] = q / N; as[q * 2] = -1; as[q * 2 + 1] = 1; if (q < N) { var b0 = q * 2; idx.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2); } }
    rib.setAttribute('position', new T.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3));
    rib.setAttribute('aU', new T.BufferAttribute(au, 1));
    rib.setAttribute('aSide', new T.BufferAttribute(as, 1));
    rib.setIndex(idx);
    this.ribGeo = rib;

    /* motes for flight: what tells the eye it is moving in open space */
    var mn = phone ? 260 : 520, mp = new Float32Array(mn * 6), me = new Float32Array(mn * 2), mr = new Float32Array(mn * 2), BOX = 14;
    for (var mi = 0; mi < mn; mi++) {
      var mx = (Math.random() - 0.5) * BOX, my = (Math.random() - 0.5) * BOX, mz = (Math.random() - 0.5) * BOX, rv = Math.random();
      mp.set([mx, my, mz, mx, my, mz], mi * 6); me[mi * 2] = 0; me[mi * 2 + 1] = 1; mr[mi * 2] = mr[mi * 2 + 1] = rv;
    }
    var mg = new T.BufferGeometry();
    mg.setAttribute('position', new T.BufferAttribute(mp, 3));
    mg.setAttribute('aEnd', new T.BufferAttribute(me, 1));
    mg.setAttribute('aR', new T.BufferAttribute(mr, 1));
    this.spaceDust = new T.LineSegments(mg, new T.ShaderMaterial({ vertexShader: V_MOTE, fragmentShader: F_MOTE, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uCamP: this.U.uCam, uVel: { value: new T.Vector3() }, uBox: { value: BOX }, uC: { value: new T.Vector3(0.75, 0.78, 0.9) } } }));
    this.spaceDust.frustumCulled = false; this.spaceDust.visible = false;
    this.scene.add(this.spaceDust);
    /* the close-up camera sees the worlds, the stars and the sky, nothing else */
    this.sky.layers.enable(1); this.stars.layers.enable(1);

    this.world = new T.Group(); this.scene.add(this.world);
    this.content = null; this.todayG = null;
    this.post = null;
    this.applyTheme();
    this.buildContent();
    this.ready = true;
  };

  P.applyTheme = function () {
    var t = this.tok;
    this.r.setClearColor(new T.Color(t.bg[0], t.bg[1], t.bg[2]), 1);
    var sk = this.skyMat.uniforms;
    sk.uBg.value.set(t.bg[0], t.bg[1], t.bg[2]); sk.uA.value.set(t.atm[0], t.atm[1], t.atm[2]);
    sk.uB.value.set(t.atm2[0], t.atm2[1], t.atm2[2]); sk.uC3.value.set(t.atm3[0], t.atm3[1], t.atm3[2]); sk.uAtmo.value = t.atmo;
    var du = this.discMat.uniforms, lift = [t.bg[0] + (t.atm[0] - t.bg[0]) * 0.07, t.bg[1] + (t.atm[1] - t.bg[1]) * 0.07, t.bg[2] + (t.atm[2] - t.bg[2]) * 0.07];
    du.uBg.value.set(lift[0], lift[1], lift[2]); du.uLine.value.set(t.tx[0], t.tx[1], t.tx[2]); du.uAtm.value.set(t.atm[0], t.atm[1], t.atm[2]);
    du.uAtm2.value.set(t.atm2[0], t.atm2[1], t.atm2[2]); du.uHi.value.set(t.hi[0], t.hi[1], t.hi[2]); du.uAc2.value.set(t.ac2[0], t.ac2[1], t.ac2[2]);
    du.uSel.value.set(t.ac[0], t.ac[1], t.ac[2]);
    this.walls.out.material.uniforms.uC.value.set(t.ac2[0], t.ac2[1], t.ac2[2]);
    this.walls.signOut.material.uniforms.uC.value.set(t.hi[0] * 0.7, t.hi[1] * 0.7, t.hi[2] * 0.7);
    this.walls.signIn.material.uniforms.uC.value.set(t.hi[0] * 0.7, t.hi[1] * 0.7, t.hi[2] * 0.7);
    this.walls.inner.material.uniforms.uC.value.set(t.atm2[0] * 0.5, t.atm2[1] * 0.5, t.atm2[2] * 0.5);
    var dm = this.dustMat.uniforms; dm.uC1.value.set(t.tx[0], t.tx[1], t.tx[2]); dm.uC2.value.set(t.atm2[0], t.atm2[1], t.atm2[2]);
    if (this.spaceDust) this.spaceDust.material.uniforms.uC.value.set(t.tx[0] * 0.8, t.tx[1] * 0.8, t.tx[2] * 0.85);
    var c = this.starCol;
    for (var i = 0; i < c.length / 3; i++) { var k = (i * 0.61803) % 1, a = k < 0.7 ? t.tx : k < 0.88 ? t.atm2 : t.hi; c[i * 3] = a[0] * 0.8; c[i * 3 + 1] = a[1] * 0.8; c[i * 3 + 2] = a[2] * 0.8; }
    this.stars.geometry.attributes.aCol.needsUpdate = true;
  };

  /* ---- Glyphs and labels, drawn once to a canvas and held at a pixel size --- */
  P.sprite = function (c, px, aspect, o) {
    var tex = new T.CanvasTexture(c); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
    var mat = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: this.mode === 'obs', sizeAttenuation: false, opacity: 1 });
    var s = new T.Sprite(mat);
    s.center.set(0.5, o && o.anchorY != null ? o.anchorY : 0.5);
    s.userData.lab = { px: px, aspect: aspect };
    s.renderOrder = o && o.order != null ? o.order : 6;
    this.labels.push(s);
    this.sizeLabel(s);
    return s;
  };
  P.sizeLabel = function (s) {
    var L = s.userData.lab, H = this.H || 300, f = 2 * Math.tan(this.cam ? this.cam.fov * Math.PI / 360 : 0.3);
    var h = L.px / H * f;
    s.scale.set(h * L.aspect, h, 1);
  };
  P.text = function (text, o) {
    var c = document.createElement('canvas'), g = c.getContext('2d'), k = 2;
    var px = o.px || 12, font = (o.weight || 400) + ' ' + Math.round(px * k) + 'px ' + (o.font || this.tok.fu);
    g.font = font;
    if (o.caps) text = String(text).toUpperCase();
    if (o.ls) { try { g.letterSpacing = (o.ls * px * k) + 'px'; } catch (e) { /* older canvas */ } }
    var w = Math.max(4, Math.ceil(g.measureText(text).width + px * k * 1.2)), h = Math.ceil(px * k * 1.7);
    c.width = w; c.height = h;
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (o.ls) { try { g.letterSpacing = (o.ls * px * k) + 'px'; } catch (e) { /* older canvas */ } }
    g.shadowColor = this.tok.cBg; g.shadowBlur = px * k * 0.6;
    g.fillStyle = o.color || this.tok.cTx;
    g.fillText(text, w / 2, h / 2);
    g.shadowBlur = 0;
    g.fillText(text, w / 2, h / 2);
    return this.sprite(c, px * 1.7, w / h, o);
  };
  /* The glyph, set on its optical centre in a roundel. A degree under it when
     asked for, so a body and its position read as one mark. */
  P.medallion = function (glyph, o) {
    var k = 3, D = o.size, ring = o.ring !== false, deg = o.deg || '';
    var c = document.createElement('canvas'), g = c.getContext('2d');
    var degPx = Math.max(9, Math.round(D * 0.3));
    var W = Math.ceil((D + 8) * k), H = Math.ceil((D + 8 + (deg ? degPx + 4 : 0)) * k);
    c.width = W; c.height = H;
    var cx = W / 2, cy = (D / 2 + 4) * k, R = D / 2 * k;
    if (ring) {
      g.beginPath(); g.arc(cx, cy, R - k, 0, Math.PI * 2);
      var gr = g.createRadialGradient(cx, cy - R * 0.4, R * 0.1, cx, cy, R);
      gr.addColorStop(0, o.fillHi || this.tok.cBg); gr.addColorStop(1, this.tok.cBg);
      g.fillStyle = gr; g.globalAlpha = 0.86; g.fill(); g.globalAlpha = 1;
      g.lineWidth = (o.focus ? 2.2 : 1.4) * k; g.strokeStyle = o.ringColor || o.color; g.stroke();
      if (o.focus) { g.beginPath(); g.arc(cx, cy, R + 2.4 * k, 0, Math.PI * 2); g.lineWidth = 1 * k; g.globalAlpha = 0.55; g.stroke(); g.globalAlpha = 1; }
    }
    var gs = Math.round(D * (o.scale || 0.6) * k);
    g.font = '400 ' + gs + 'px ' + GLYPH_FONT;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    var text = String(glyph);
    if (text.length === 1) text += '︎';
    var m = g.measureText(text), asc = m.actualBoundingBoxAscent, dsc = m.actualBoundingBoxDescent;
    var left = m.actualBoundingBoxLeft, right = m.actualBoundingBoxRight;
    var ox = (isFinite(left) && isFinite(right)) ? (left - right) / 2 : 0;
    var oy = (isFinite(asc) && isFinite(dsc) && asc + dsc > 0) ? (asc - dsc) / 2 : gs * 0.35;
    if (!ring) { g.shadowColor = this.tok.cBg; g.shadowBlur = gs * 0.35; }
    g.fillStyle = o.color;
    g.fillText(text, cx + ox, cy + oy);
    if (!ring) { g.shadowBlur = 0; g.fillText(text, cx + ox, cy + oy); }
    if (o.retro) {
      g.font = '600 ' + Math.round(D * 0.26 * k) + 'px ' + this.tok.fu;
      g.fillStyle = this.tok.cHi; g.textBaseline = 'middle';
      g.fillText('R', cx + R * 0.86, cy + R * 0.7);
    }
    if (deg) {
      g.font = '600 ' + degPx * k + 'px ' + this.tok.fu;
      g.textBaseline = 'middle';
      g.shadowColor = this.tok.cBg; g.shadowBlur = degPx * k * 0.5;
      g.fillStyle = o.degColor || this.tok.cMut;
      g.fillText(deg, cx, (D + 8 + degPx / 2 + 1) * k);
      g.shadowBlur = 0; g.fillText(deg, cx, (D + 8 + degPx / 2 + 1) * k);
    }
    return this.sprite(c, H / k, W / H, { anchorY: o.anchorY == null ? 0 : o.anchorY, order: o.order });
  };

  /* ---- Geometry of the chart --------------------------------------------- */
  P.theta = function (lon) { return (180 + lon - this.model.zero) * RAD; };
  P.at = function (lon, r, y) { var th = this.theta(lon); return new T.Vector3(Math.cos(th) * r, y || 0, -Math.sin(th) * r); };
  P.bodyBy = function (key) { return this.model && this.model.bodies.filter(function (b) { return b.key === key; })[0]; };
  P.orbitOf = function (b, i) {
    if (ORBIT[b.name] != null && b.core) return ORBIT[b.name];
    var base = BELT[b.cat] != null ? BELT[b.cat] : 10.55;
    return base + ((i * 0.618) % 1 - 0.5) * 0.5;
  };
  P.dispose = function (obj) {
    var labels = this.labels;
    obj.traverse(function (o) {
      if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      if (o.isSprite) { var i = labels.indexOf(o); if (i !== -1) labels.splice(i, 1); }
    });
  };
  P.colorOf = function (css) {
    if (!this._pr || !this._pr.isConnected) { if (!this.el.root.isConnected) return { v: this.tok.ac, c: 'rgb(47,255,143)' }; this._pr = probe(this.el.root); }
    var c = cssColor(this._pr, css, 'rgb(47,255,143)');
    return { v: toVec(c), c: c };
  };
  P.pillarMat = function (c, i) {
    return new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_PILLAR, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uC: { value: v3(c) }, uI: { value: i }, uCore: { value: 40 } } });
  };

  P.buildContent = function () {
    if (!this.model || !this.r) return;
    if (this.content) { this.world.remove(this.content); this.dispose(this.content); }
    if (this.globes) this.clearGlobes();
    var m = this.model, tk = this.tok, g = new T.Group(), self = this, ui = this.ui || 1;
    this.builtUi = ui;
    this.content = g; this.bodies = []; this.aspects = []; this.signs = []; this.houseLabels = []; this.angleObjs = [];
    this.world.add(g);
    this.discMat.uniforms.uZero.value = m.zero;
    this.discMat.uniforms.uTimed.value = m.timed ? 1 : 0;

    /* The signs: the glyph floats over the middle of its band, in the colour
       the 2D wheel gives its element. */
    (m.signs || []).forEach(function (s, i) {
      var col = self.colorOf(s.c);
      var spr = self.medallion(s.glyph, { size: Math.round(28 * ui), ring: false, color: col.c, scale: 0.78, anchorY: 0.5 });
      spr.userData.lon = i * 30 + 15;
      g.add(spr);
      self.signs.push(spr);
    });
    /* The houses, numbered round the outer band. */
    for (var h = 0; h < 12; h++) {
      var hl = this.text(String(h + 1), { px: Math.max(9, 10.5 * ui), weight: 600, color: tk.cMut });
      hl.userData.lon = m.zero + h * 30 + 15;
      hl.position.copy(this.at(hl.userData.lon, sc(354), 0.06));
      g.add(hl);
      this.houseLabels.push(hl);
    }
    /* The angles: a beam at the rim and a line across the bands. */
    (m.angles || []).forEach(function (a) {
      var main = a.label === 'ASC' || a.label === 'MC';
      var beam = new T.Mesh(self.pillarGeo, self.pillarMat(main ? tk.blue : tk.hi, main ? 0.85 : 0.5));
      beam.userData.sharedGeo = true; beam.userData.bill = true;
      g.add(beam);
      var line = new T.Mesh(self.ribGeo, self.ribMat(tk.blue, 0.55, 1.2, false));
      line.userData.sharedGeo = true; line.frustumCulled = false;
      g.add(line);
      var lab = self.text(a.label, { px: Math.max(9.5, 11 * ui), weight: 700, color: tk.cBlue, ls: 0.12 });
      g.add(lab);
      self.angleObjs.push({ a: a, beam: beam, line: line, lab: lab, h: a.label === 'ASC' ? 3.1 : 2.3 });
    });

    /* The bodies. */
    var orbs = [], seen = {};
    m.bodies.forEach(function (b, i) {
      var col = self.colorOf(b.c), ring1 = b.ring !== 2;
      var core = b.name === 'Sun' ? tk.atm2 : b.name === 'Moon' ? tk.tx : [0.5 + col.v[0] * 0.5, 0.5 + col.v[1] * 0.5, 0.5 + col.v[2] * 0.5];
      var size = ring1 ? (b.name === 'Sun' ? 0.36 : b.name === 'Moon' ? 0.3 : b.core ? 0.25 : 0.19) : 0.12;
      var mat = new T.ShaderMaterial({ vertexShader: V_ORB, fragmentShader: F_ORB, transparent: true, depthWrite: true,
        uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uGlow: self.U.uGlow, uC: { value: v3(b.name === 'Sun' ? tk.atm2 : col.v) }, uCore: { value: v3(core) }, uHover: { value: 0 }, uGhost: { value: 0 }, uOp: { value: 1 } } });
      var orb = new T.Mesh(self.orbGeo, mat); orb.userData.sharedGeo = true;
      orb.scale.setScalar(size);
      var pil = new T.Mesh(self.pillarGeo, self.pillarMat(col.v, ring1 ? 0.55 : 0.32)); pil.userData.sharedGeo = true; pil.userData.bill = true;
      var foot = new T.Mesh(self.ribGeo, self.ribMat(col.v, 0.5, 1.4, false)); foot.userData.sharedGeo = true; foot.frustumCulled = false;
      /* The minor points are many and small: a plain roundel, their degree in
         the tooltip and the panel rather than under every one of eighty. */
      var deg = ring1 && b.deg != null ? b.deg + '°' : '';
      var D = Math.round((ring1 ? 27 : 15) * ui);
      var med = self.medallion(b.glyph, { size: D, color: col.c, deg: deg, retro: b.retro && ring1, scale: b.glyph.length > 1 ? 0.42 : 0.6 });
      var lvl = b.lvl || 0;
      var r3 = sc(b.rad || (ring1 ? 234 : 136));
      var h3 = ring1 ? 0.95 + lvl * 0.42 : 0.42 + lvl * 0.2;
      var rO = self.orbitOf(b, i);
      var o = { b: b, orb: orb, pil: pil, foot: foot, med: med, medF: null, size: size, col: col, D: D, deg: deg,
        p3: self.at(b.lon, r3, h3), base3: self.at(b.lon, r3, 0), pO: self.at(b.lon, rO, 0), rO: rO, h3: h3, hover: 0, focus: 0, pos: new T.Vector3() };
      g.add(orb); g.add(pil); g.add(foot); g.add(med);
      self.bodies.push(o);
      if (b.core || ORBIT[b.name] != null) { if (!seen[rO]) { seen[rO] = 1; orbs.push([rO, b.core ? 1 : 0.6, 1]); } }
    });
    if (m.bodies.some(function (b) { return b.cat === 'asteroid'; })) orbs.push([BELT.asteroid, 0, 0.6]);
    if (m.bodies.some(function (b) { return b.cat === 'centaur'; })) orbs.push([BELT.centaur, 0, 0.6]);
    if (m.bodies.some(function (b) { return b.cat === 'tno'; })) orbs.push([BELT.tno, 0, 0.6]);
    var uo = this.discMat.uniforms.uOrbits.value;
    orbs.slice(0, 12).forEach(function (x, k) { uo[k].set(x[0], x[1], x[2]); });
    this.discMat.uniforms.uNOrb.value = Math.min(12, orbs.length);

    /* The aspects. */
    var byKey = {};
    this.bodies.forEach(function (o) { byKey[o.b.key] = o; });
    (m.aspects || []).forEach(function (x) {
      var A = byKey[x.a], B = byKey[x.b];
      if (!A || !B) return;
      var col = self.colorOf(x.c);
      var mat = self.ribMat(col.v, 0.9, Math.max(1.6, x.w * 1.5) * ui, x.dash);
      var mesh = new T.Mesh(self.ribGeo, mat); mesh.userData.sharedGeo = true; mesh.frustumCulled = false;
      g.add(mesh);
      self.aspects.push({ x: x, A: A, B: B, mesh: mesh, hover: 0, a3: self.at(A.b.lon, R_ASP, 0.03), b3: self.at(B.b.lon, R_ASP, 0.03), pts: [] });
    });

    /* The owner, at the centre. */
    var hub = new T.Mesh(this.orbGeo, new T.ShaderMaterial({ vertexShader: V_ORB, fragmentShader: F_ORB, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uGlow: this.U.uGlow, uC: { value: v3(tk.atm2) }, uCore: { value: v3(tk.atm2) }, uHover: { value: 0 }, uGhost: { value: 0 }, uOp: { value: 0 } } }));
    hub.userData.sharedGeo = true; hub.scale.setScalar(0.16);
    g.add(hub);
    this.hub = hub;
    var crowd = m.bodies.some(function (b) { return b.ring === 2; });
    if (m.owner && !crowd) {
      var ow = this.text(m.owner, { px: Math.max(12, 17 * ui), font: tk.fd, color: tk.cTx, anchorY: 0 });
      ow.position.set(0, 0.32, 0);
      g.add(ow);
      this.ownerLab = ow;
    } else this.ownerLab = null;
    if (m.sub && !crowd) {
      var sb = this.text(m.sub, { px: Math.max(8.5, 9.5 * ui), weight: 600, color: tk.cMut, caps: true, ls: 0.12, anchorY: 1 });
      sb.position.set(0, 0.3, 0);
      g.add(sb);
      this.subLab = sb;
    } else this.subLab = null;
    if (this.todayOn) this.buildToday();
    this.place(true);
  };
  P.ribMat = function (c, i, w, dash) {
    return new T.ShaderMaterial({ vertexShader: V_RIB, fragmentShader: F_RIB, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uRes: this.U.uRes, uTime: this.U.uTime, uA: { value: new T.Vector3() }, uB: { value: new T.Vector3() },
        uBow: { value: 0 }, uW: { value: w }, uC: { value: v3(c) }, uI: { value: i }, uDash: { value: dash ? 1 : 0 }, uLen: { value: 10 }, uPulse: { value: 0 } } });
  };

  /* Today's sky over the orrery: a ghost on each orbit where the body stands
     now, and the arc it has travelled from where it stood at birth. */
  P.buildToday = function () {
    if (!this.content || !this.o.lonAt) return;
    if (this.todayG) { this.content.remove(this.todayG); this.dispose(this.todayG); }
    var g = new T.Group(), self = this, tk = this.tok, now = Date.now();
    this.todayG = g; this.ghosts = [];
    this.bodies.forEach(function (o) {
      if (!o.b.core || o.b.name.indexOf('Node') !== -1) return;
      var L = null;
      try { L = self.o.lonAt(o.b.name, now); } catch (e) { L = null; }
      if (L == null || !isFinite(L)) return;
      var mat = new T.ShaderMaterial({ vertexShader: V_ORB, fragmentShader: F_ORB, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uGlow: self.U.uGlow, uC: { value: v3(tk.hi) }, uCore: { value: v3(tk.hi) }, uHover: { value: 0 }, uGhost: { value: 1 }, uOp: { value: 0 } } });
      var gh = new T.Mesh(self.orbGeo, mat); gh.userData.sharedGeo = true;
      gh.scale.setScalar(o.size * 1.1);
      gh.position.copy(self.at(L, o.rO, 0));
      g.add(gh);
      var a0 = o.b.lon, sweep = ((L - a0) % 360 + 360) % 360, n = Math.max(8, Math.round(sweep / 3)), pts = [];
      for (var i = 0; i <= n; i++) pts.push(self.at(a0 + sweep * i / n, o.rO, 0.015));
      var arc = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), Math.max(8, n * 2), 0.032, 5, false),
        new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: FOG + 'uniform vec3 uC; uniform float uI; varying vec2 vUv; varying vec3 vW; void main(){ float a = 0.25 + 0.75 * vUv.x; gl_FragColor = vec4(uC * a * uI * fogK(vW), 1.0); }',
          transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uC: { value: v3(tk.hi) }, uI: { value: 0 } } }));
      g.add(arc);
      self.ghosts.push({ gh: gh, arc: arc });
    });
    var lab = this.text('Today', { px: 9.5, weight: 700, caps: true, ls: 0.14, color: tk.cHi, anchorY: 0 });
    var sun = this.ghosts.length ? this.ghosts[0].gh : null;
    if (sun) { lab.position.copy(sun.position); lab.position.y += 0.45; }
    lab.material.opacity = 0;
    g.add(lab);
    this.todayLab = lab;
    this.content.add(g);
  };

  /* ---- Placing everything for the current morph ---------------------------- */
  P.place = function (force) {
    if (!this.content || !this.model) return;
    var e = ease(clamp(this.k, 0, 1)), w1 = 1 - e, self = this;
    var du = this.discMat.uniforms;
    du.uK.value = e;
    du.uSignIn.value = mix(R_SIGN_IN, O_SIGN_IN, e);
    du.uSignOut.value = mix(R_HOUSE, O_SIGN_OUT, e);
    du.uOut.value = mix(R_OUT, O_SIGN_OUT + 0.02, e);
    du.uInner.value = mix(R_INNER, 0.6, e);
    du.uHouse.value = this.sel.house != null ? this.sel.house : -1;
    var wl = this.walls;
    wl.out.scale.set(du.uOut.value, wl.out.userData.h, du.uOut.value); wl.out.material.uniforms.uI.value = 0.9;
    wl.signOut.scale.set(du.uSignOut.value, wl.signOut.userData.h, du.uSignOut.value); wl.signOut.material.uniforms.uI.value = 0.75 * w1;
    wl.signIn.scale.set(du.uSignIn.value, wl.signIn.userData.h, du.uSignIn.value); wl.signIn.material.uniforms.uI.value = 0.75;
    wl.inner.scale.set(du.uInner.value, wl.inner.userData.h, du.uInner.value); wl.inner.material.uniforms.uI.value = 0.6 * w1;
    wl.signOut.visible = w1 > 0.01; wl.inner.visible = w1 > 0.01;
    var gR = mix(sc(294), O_GLYPH, e);
    this.signs.forEach(function (s) { s.position.copy(self.at(s.userData.lon, gR, 0.3 * w1 + 0.12)); });
    this.houseLabels.forEach(function (l) { l.material.opacity = w1; l.visible = w1 > 0.02; });
    var focusKey = this.focusKey, hov = this.hover, hovBody = (hov && hov.kind === 'body' ? hov.key : null) || this.hoverKey;
    var lit = hovBody || focusKey;
    this.bodies.forEach(function (o) {
      var p = o.pos.copy(o.p3).lerp(o.pO, e);
      o.orb.position.copy(p);
      o.pil.position.set(p.x, 0, p.z); o.pil.scale.set(o.b.ring === 2 ? 0.3 : 0.45, Math.max(0.001, p.y), 1);
      o.pil.visible = p.y > 0.02;
      var mt = o.b.ring === 2 ? 0.75 : 1;
      o.med.position.set(p.x, p.y + o.size + 0.1, p.z);
      var isF = o.b.key === focusKey;
      if (isF && !o.medF) {
        o.medF = self.medallion(o.b.glyph, { size: o.D + 4, color: o.col.c, deg: o.deg, retro: o.b.retro && o.b.ring !== 2, focus: true, scale: o.b.glyph.length > 1 ? 0.42 : 0.6 });
        self.content.add(o.medF);
      }
      if (o.medF) { o.medF.position.copy(o.med.position); o.medF.visible = isF; }
      o.med.visible = !isF;
      /* hovering quiets everything it does not touch; a body that is only
         named, in the panel under the stage, quiets it less */
      var dimmed = lit && !isF && o.b.key !== hovBody && !self.touches(o.b.key, lit) ? (hovBody ? 0.5 : 0.8) : 1;
      o.med.material.opacity = mt * dimmed;
      o.orb.material.uniforms.uOp.value = dimmed;
      /* the foot: from the sign band's inner edge to the pillar's base, as the
         2D wheel draws its tick */
      var fu = o.foot.material.uniforms;
      fu.uA.value.copy(self.at(o.b.lon, R_SIGN_IN, 0.02).lerp(self.at(o.b.lon, O_SIGN_IN, 0.02), e));
      fu.uB.value.set(p.x, 0.02, p.z);
      fu.uI.value = 0.45 * (o.b.ring === 2 ? 0.6 : 1) * (1 - 0.55 * e);
    });
    this.aspects.forEach(function (a) {
      var u = a.mesh.material.uniforms;
      u.uA.value.copy(a.a3).lerp(a.A.pos, e); u.uA.value.y = mix(0.03, 0.0, e);
      u.uB.value.copy(a.b3).lerp(a.B.pos, e); u.uB.value.y = mix(0.03, 0.0, e);
      var len = u.uA.value.distanceTo(u.uB.value);
      u.uBow.value = len * mix(0.13, 0.04, e);
      u.uLen.value = len;
    });
    this.angleObjs.forEach(function (x) {
      var rB = mix(R_OUT + 0.25, O_SIGN_OUT + 0.3, e);
      var bp = self.at(x.a.lon, rB, 0);
      x.beam.position.copy(bp); x.beam.scale.set(0.55, x.h * mix(1, 0.55, e), 1);
      var lu = x.line.material.uniforms;
      lu.uA.value.copy(self.at(x.a.lon, mix(R_INNER, 0.6, e), 0.03)); lu.uB.value.copy(self.at(x.a.lon, mix(R_HOUSE, O_SIGN_IN, e), 0.03));
      lu.uBow.value = 0; lu.uI.value = 0.5 * mix(1, 0.45, e);
      x.lab.position.copy(self.at(x.a.lon, rB + 0.75, 0.25));
    });
    if (this.ownerLab) { this.ownerLab.material.opacity = w1; this.ownerLab.visible = w1 > 0.02; }
    if (this.subLab) { this.subLab.material.opacity = w1; this.subLab.visible = w1 > 0.02; }
    if (this.hub) { this.hub.material.uniforms.uOp.value = e; this.hub.visible = e > 0.02; }
    if (this.todayG) {
      var tk2 = this.todayK * e;
      this.todayG.visible = tk2 > 0.01;
      (this.ghosts || []).forEach(function (x) { x.gh.material.uniforms.uOp.value = tk2; x.arc.material.uniforms.uI.value = tk2 * 1.1; });
      if (this.todayLab) this.todayLab.material.opacity = tk2;
    }
  };
  P.touches = function (key, other) {
    return (this.model.aspects || []).some(function (x) { return (x.a === key && x.b === other) || (x.b === key && x.a === other); });
  };

  /* ---- The camera ---------------------------------------------------------- */
  P.defaultPitch = function () { return this.kGoal > 0.5 ? 0.82 : 0.98; };
  P.fit = function () {
    var e = ease(clamp(this.k, 0, 1)), Rc = mix(R_OUT + 0.8, O_SIGN_OUT + 0.7, e), pitch = this.rig ? this.rig.pitch : this.defaultPitch();
    var tv = Math.tan((this.baseFov || this.cam.fov) * Math.PI / 360);
    var ins = this.mode === 'obs' && this.inset ? this.inset : null;
    var asp = ins && this.H ? Math.max(0.45, (this.W - ins.l - ins.r) / this.H) : this.cam.aspect;
    var dw = Rc / (tv * asp), dh = (Rc * Math.sin(pitch) + 2.6 * Math.cos(pitch)) / tv;
    return Math.max(dw, dh) * 1.04;
  };
  P.turnTo = function (key) {
    var o = (this.bodies || []).filter(function (x) { return x.b.key === key; })[0];
    if (!o) return;
    var th = this.theta(o.b.lon), want = Math.atan2(Math.cos(th), -Math.sin(th));
    var cur = this.user.yaw;
    this.user.yaw = cur + wrapPi(want - cur);
    this.lift(0.3);
  };
  P.goals = function () {
    var c = this.cur, drift = this.reduced ? 0 : Math.sin(this.time * 0.05) * 0.045;
    var pitch = this.user.pitch != null ? this.user.pitch : this.defaultPitch();
    return {
      yaw: this.user.yaw + drift + (this.ptr.on && this.ptrType === 'mouse' && !this.down ? this.ptr.x * 0.05 : 0),
      pitch: clamp(pitch - 0.04 * c + (this.ptr.on && this.ptrType === 'mouse' && !this.down ? this.ptr.y * 0.03 : 0), 0.2, 1.42),
      dist: this.fit() / this.user.zoom * (1 - 0.04 * c)
    };
  };
  P.placeCamera = function (k) {
    var f = this.fly;
    if (f && f.active) {
      f.apply(this.cam);
      this.camTail(Math.hypot(this.cam.position.x, this.cam.position.y, this.cam.position.z), f.kick);
      this._settled = true;
      return;
    }
    var g = this.goals();
    /* The scene opens where it rests: no fly-in, so nothing moves on arrival but
       the fade (owner, 19 October 2026). */
    if (!this.rig) this.rig = { yaw: g.yaw, pitch: g.pitch, dist: g.dist };
    var r = this.rig;
    r.yaw = damp(r.yaw, g.yaw, k); r.pitch = damp(r.pitch, g.pitch, k); r.dist = damp(r.dist, g.dist, k);
    var cp = Math.cos(r.pitch), ty = 0.35;
    this.cam.position.set(Math.sin(r.yaw) * cp * r.dist, ty + Math.sin(r.pitch) * r.dist, Math.cos(r.yaw) * cp * r.dist);
    this.cam.rotation.order = 'XYZ';
    this.cam.lookAt(0, ty, 0);
    this.cam.updateMatrixWorld();
    this._settled = Math.abs(r.yaw - g.yaw) < 0.0005 && Math.abs(r.pitch - g.pitch) < 0.0005 && Math.abs(r.dist - g.dist) < 0.005;
    /* Coming home from flight: the camera eases from where the reader left it
       back onto the resting rig, rather than jumping there. */
    if (this.ret) {
      var rt = this.ret;
      rt.t = Math.min(1, rt.t + (this._dt || 0.016) / (this.reduced ? 0.01 : 0.9));
      var e = ease(rt.t), toP = this.cam.position.clone(), toQ = this.cam.quaternion.clone();
      this.cam.position.lerpVectors(rt.pos, toP, e);
      this.cam.quaternion.slerpQuaternions(rt.q, toQ, e);
      this.cam.updateMatrixWorld();
      if (rt.t >= 1) this.ret = null; else this._settled = false;
    }
    this.camTail(r.dist, 0);
  };
  /* What every camera pose needs after it is set: the shaders told where it
     is, the sky and the stars kept round it, and the lens. */
  P.camTail = function (dist, kick) {
    this.U.uCam.value.copy(this.cam.position);
    this.U.uFog.value = 1 / (dist * 3.2 + 30);
    this.sky.position.copy(this.cam.position);
    this.stars.position.copy(this.cam.position);
    /* In the Observatory the lens is centred on the open sky between the
       panels, not on the whole screen, so the reticle and the station frame
       the chart where the reader can see it. */
    var ins = this.mode === 'obs' && this.inset ? this.inset : null, sh = ins ? (ins.r - ins.l) / 2 : 0;
    if (sh !== (this._sh || 0)) {
      this._sh = sh;
      if (sh) this.cam.setViewOffset(this.W || 1, this.H || 1, sh, 0, this.W || 1, this.H || 1); else this.cam.clearViewOffset();
      if (this.hud) this.hud.ret.style.left = 'calc(50% + ' + (-sh) + 'px)';
    }
    var flying = !!(this.fly && this.fly.active), near = flying ? 0.008 : 0.1, fov = (this.baseFov || 36) + (this.reduced ? 0 : 15 * (kick || 0));
    if (Math.abs(this.cam.fov - fov) > 0.01 || this.cam.near !== near) { this.cam.fov = fov; this.cam.near = near; this.cam.updateProjectionMatrix(); }
    if (this.mComp) this.mComp.uniforms.uVig.value = 0.4 + 0.35 * (kick || 0);
    if (this.spaceDust) this.spaceDust.visible = flying;
  };

  /* ---- Flight (flight.js), on the card and in the Observatory -------------- */
  P.flyer = function () {
    if (this.fly) return this.fly;
    var F = root.Flight;
    if (!F) return null;
    var self = this;
    this.fly = F.create({ reduced: this.reduced,
      onWake: function () { self.updateRun(); self.kick(); },
      onDash: function () { self.lift(0.25); },
      onPad: function (what) {
        if (what === 'engage') { if (self.focusKey) self.flyTo(self.focusKey); return; }
        var nk = self.step(what === 'next' ? 1 : -1);
        if (nk) { self.setFocus(nk, false); if (self.o.onFocus) self.o.onFocus(nk, 'key'); }
      } });
    return this.fly;
  };
  /* Take the controls from wherever the camera is now. */
  P.flyEngage = function () {
    var f = this.flyer();
    if (!f || !this.cam) return null;
    if (!f.active) {
      var d = new T.Vector3();
      this.cam.getWorldDirection(d);
      f.engage([this.cam.position.x, this.cam.position.y, this.cam.position.z], [d.x, d.y, d.z]);
      this.ret = null;
      if (this.o.onFly) this.o.onFly(true);
    }
    this.updateRun();
    return f;
  };
  /* Back to the resting view, eased. */
  P.flyRelease = function () {
    var f = this.fly;
    if (!f || !f.active || !this.cam) return;
    this.ret = { t: 0, pos: this.cam.position.clone(), q: this.cam.quaternion.clone() };
    f.release();
    this.lift(0.2);
    if (this.o.onFly) this.o.onFly(false);
    this.updateRun();
    this.kick();
  };
  P.flying = function () { return !!(this.fly && this.fly.active); };
  P.flyEnv = function () {
    var self = this;
    return this._env || (this._env = { bound: 70, minV: 0.2, maxV: 9, near: function (p) { return self.nearest(p); } });
  };
  /* The closest surface: a body, or the face of the disc while over it. */
  P.nearest = function (p) {
    var best = null, bd = 1e9;
    (this.bodies || []).forEach(function (o) {
      var c = o.orb.position, r = o.size;
      var d = Math.sqrt((p[0] - c.x) * (p[0] - c.x) + (p[1] - c.y) * (p[1] - c.y) + (p[2] - c.z) * (p[2] - c.z)) - r;
      if (d < bd) { bd = d; best = { d: d, c: [c.x, c.y, c.z], r: r, o: o }; }
    });
    var rr = Math.sqrt(p[0] * p[0] + p[2] * p[2]), dd = Math.abs(p[1]) + 0.35;
    if (rr < R_OUT + 1 && (!best || dd < best.d)) best = { d: dd, c: null, r: 0 };
    return best;
  };
  P.bodyObj = function (key) { return (this.bodies || []).filter(function (o) { return o.b.key === key; })[0] || null; };
  P.sunPos = function () {
    var s = (this.bodies || []).filter(function (o) { return o.b.name === 'Sun'; })[0];
    return s ? s.orb.position : (this._origin || (this._origin = new T.Vector3(0, 0.35, 0)));
  };
  var RINGED = { Saturn: 7.2, Uranus: 6, chiron: 5, chariklo: 5, haumea: 6.5 };
  /* Autopilot to a body: arrive on its lit side, a little above, close
     enough that it fills the view and far enough that its rings fit. */
  P.flyTo = function (key) {
    var o = this.bodyObj(key);
    if (!o || !this.cam) return;
    var f = this.flyEngage();
    if (!f) return;
    if (this.focusKey !== key) { this.setFocus(key, false); if (this.o.onFocus) this.o.onFocus(key, 'fly'); }
    var c = o.orb.position.clone(), sun = this.sunPos();
    var dir = new T.Vector3().subVectors(this.cam.position, c);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0.3, 1);
    dir.normalize();
    var toSun = new T.Vector3().subVectors(sun, c);
    if (toSun.lengthSq() > 1e-4) { toSun.normalize(); dir.lerp(toSun, 0.5).normalize(); }
    dir.y = Math.max(dir.y, 0.2); dir.normalize();
    var R = o.size * (RINGED[o.b.name] || RINGED[o.b.key] || 4.2);
    var to = c.clone().add(dir.multiplyScalar(R)), self = this;
    f.travel([to.x, to.y, to.z], [c.x, c.y, c.z], { done: function () { if (self.o.onArrive) self.o.onArrive(key); self.kick(); } });
    this.lift(0.3); this.updateRun(); this.kick();
  };
  /* A contact: frame both ends from above the line between them. */
  P.flyToPair = function (aKey, bKey) {
    var A = this.bodyObj(aKey), B = this.bodyObj(bKey);
    if (!A || !B) return;
    var f = this.flyEngage();
    if (!f) return;
    var a = A.orb.position, b = B.orb.position, m = a.clone().add(b).multiplyScalar(0.5), span = Math.max(0.8, a.distanceTo(b));
    var side = new T.Vector3(-(b.z - a.z), 0, b.x - a.x);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    if (side.dot(new T.Vector3().subVectors(this.cam.position, m)) < 0) side.negate();
    var to = m.clone().add(side.multiplyScalar(span * 0.75)); to.y += span * 0.55 + 0.4;
    f.travel([to.x, to.y, to.z], [m.x, m.y, m.z]);
    this.lift(0.3); this.updateRun(); this.kick();
  };
  /* A house: look down onto its sector of the band. */
  P.flyToHouse = function (n) {
    if (!this.model) return;
    var f = this.flyEngage();
    if (!f) return;
    var lon = this.model.zero + (n - 1) * 30 + 15, rMid = (R_HOUSE + R_OUT) / 2;
    var at = this.at(lon, rMid, 0), from = this.at(lon, rMid * 0.45, 3.6);
    this.sel = { aspect: this.sel.aspect, house: n, body: this.sel.body };
    f.travel([from.x, from.y, from.z], [at.x, at.y, at.z]);
    this.lift(0.3); this.updateRun(); this.kick();
  };
  /* The station: the resting view of the whole chart. */
  P.station = function () {
    var g = this.goals(), cp = Math.cos(g.pitch), d = this.fit();
    return { pos: [Math.sin(g.yaw) * cp * d, 0.35 + Math.sin(g.pitch) * d, Math.cos(g.yaw) * cp * d], at: [0, 0.35, 0] };
  };
  P.home = function () {
    var f = this.flyEngage();
    if (!f) return;
    var st = this.station();
    f.travel(st.pos, st.at);
    this.lift(0.3); this.updateRun(); this.kick();
  };
  P.setHoverKey = function (key) { if (this.hoverKey === (key || null)) return; this.hoverKey = key || null; this.lift(0.05); this.kick(); };

  /* ---- Bodies seen up close (body-globes.js) -------------------------------- */
  P.updateGlobes = function (dt) {
    var BG = root.BodyGlobes;
    if (!BG || !this.bodies || !this.cam) return;
    if (!this.globes) {
      this.globes = BG.create(T);
      this.globeG = new T.Group();
      this.world.add(this.globeG);
      this.GU = { uTime: this.U.uTime, uSun: { value: new T.Vector3() }, uCamW: { value: new T.Vector3() } };
    }
    var cp = this.cam.position, sun = this.sunPos(), self = this, step = this.reduced ? 0 : dt;
    var tgt = this.mode === 'obs' && this.pipOn ? this.focusKey : null;
    this.GU.uSun.value.copy(sun); this.GU.uCamW.value.copy(cp);
    this.bodies.forEach(function (o) {
      var ratio = cp.distanceTo(o.orb.position) / o.size;
      var k = clamp((30 - ratio) / 16, 0, 1); k = k * k * (3 - 2 * k);
      var want = k > 0.001 || o.b.key === tgt;
      if (want && !o.globe && self.globeCount < 16) {
        o.globe = self.globes.make(o.b, self.GU, o.col.v);
        o.globe.traverse(function (x) { x.layers.enable(1); });
        self.globeG.add(o.globe);
        self.globeCount++;
      } else if (!want && o.globe && ratio > 46) {
        self.globeG.remove(o.globe); self.globes.dispose(o.globe); o.globe = null; self.globeCount--;
      }
      o.gk = k;
      if (o.globe) {
        o.globe.position.copy(o.orb.position);
        o.globe.scale.setScalar(o.size);
        o.globe.visible = k > 0.001;
        if (o.globe.visible) self.globes.update(o.globe, step, k, sun, cp, o.size);
      }
      /* the orb steps inside the globe and goes out under it */
      o.orb.material.uniforms.uOp.value *= 1 - k;
      if (k > 0) o.orb.scale.multiplyScalar(1 - 0.25 * k);
      o.orb.visible = k < 0.995;
      /* the glyph gives way to the world it names */
      var mk = clamp((ratio - 7) / 8, 0, 1);
      o.med.material.opacity *= mk;
      if (o.medF) o.medF.material.opacity = mk;
      if (mk < 0.02) { o.med.visible = false; if (o.medF) o.medF.visible = false; }
    });
  };
  P.clearGlobes = function () {
    var self = this;
    (this.bodies || []).forEach(function (o) { if (o.globe) { self.globeG.remove(o.globe); self.globes.dispose(o.globe); o.globe = null; } });
    this.globeCount = 0;
  };

  /* ---- The Observatory ------------------------------------------------------
     The same scene, full screen, flying from the first frame. The screen
     around it is the app's; what moves every frame (the reticle, the target's
     bracket, the telemetry, the close-up) is drawn here, never through state. */
  P.setMode = function (m) {
    m = m === 'obs' ? 'obs' : 'stage';
    if (this.mode === m) { if (m === 'obs') this.bindObs(); return; }
    this.mode = m;
    var self = this;
    this.labels.forEach(function (sp) { sp.material.depthTest = m === 'obs'; });
    if (m === 'obs') {
      this.buildHud();
      this.hud.root.style.display = '';
      this.bindObs();
      this.launchPending = true;
    } else {
      this.unbindObs();
      if (this.hud) { this.hud.root.style.display = 'none'; this.hud.root.style.opacity = '0'; }
      if (this.fly) { this.fly.release(); this.fly.unmountPad(); }
      this.ret = null; this.rig = null; this.pipEl = null; this.pipOn = false; this.hoverKey = null; this.inset = null;
      this.sel = { aspect: this.sel.aspect, house: null, body: this.sel.body };
      if (this.o.onFly) this.o.onFly(false);
    }
    this.updateRun();
    this.kick();
  };
  P.bindObs = function () {
    var r = this.host && this.host.closest ? (this.host.closest('[data-obs]') || this.host) : null;
    if (r === this.obsRoot && this._obsDown) return;
    this.unbindObs();
    this.obsRoot = r;
    if (!r) return;
    var self = this;
    this._obsDown = function (e) { self.onObsKey(e, true); };
    this._obsUp = function (e) { self.onObsKey(e, false); };
    r.addEventListener('keydown', this._obsDown);
    r.addEventListener('keyup', this._obsUp);
  };
  P.unbindObs = function () {
    if (this.obsRoot && this._obsDown) { this.obsRoot.removeEventListener('keydown', this._obsDown); this.obsRoot.removeEventListener('keyup', this._obsUp); }
    this._obsDown = this._obsUp = null;
    this.obsRoot = null;
  };
  P.onObsKey = function (e, down) {
    var F = root.Flight;
    if (!this.ready || this.mode !== 'obs' || !F || e.defaultPrevented) return;
    if (F.claimedElsewhere(e)) return;
    var f = this.flyEngage();
    if (!f) return;
    if (!down) { f.key(e, false); return; }
    if (f.key(e, true)) { e.preventDefault(); this.lift(0.03); this.updateRun(); this.kick(); return; }
    var c = e.code, done = true;
    if (c === 'BracketRight' || c === 'BracketLeft') {
      var nk = this.step(c === 'BracketRight' ? 1 : -1);
      if (nk) { this.setFocus(nk, false); if (this.o.onFocus) this.o.onFocus(nk, 'key'); }
    } else if (c === 'Enter' || c === 'NumpadEnter' || c === 'KeyT') { if (this.focusKey) this.flyTo(this.focusKey); }
    else if (c === 'KeyO') { if (this.focusKey && this.o.onOpen) this.o.onOpen(this.focusKey); }
    else if (c === 'KeyH' || c === 'Home' || c === 'Digit0' || c === 'Numpad0') this.home();
    else if (c === 'KeyV') { if (this.o.onToggleView) this.o.onToggleView(); }
    else if (c === 'KeyP') { if (this.o.onPanels) this.o.onPanels(); }
    else if (e.key === '?') { if (this.o.onHelp) this.o.onHelp(); }
    else done = false;
    if (done) { e.preventDefault(); this.lift(0.08); this.kick(); }
  };
  /* Arriving: from further out, down onto the station, once the canvas is up.
     The card opens where it rests; the Observatory is a place the reader
     travels into, so it is the one view that arrives. */
  P.launch = function () {
    this.launchPending = false;
    this.readInset();
    var f = this.flyer();
    if (!f) return;
    var st = this.station(), p = st.pos, k = this.reduced ? 1 : 1.75;
    var from = [p[0] * k, p[1] * k + (this.reduced ? 0 : 2.5), p[2] * k], d = [st.at[0] - from[0], st.at[1] - from[1], st.at[2] - from[2]];
    f.release();
    f.engage(from, d);
    if (this.o.onFly) this.o.onFly(true);
    if (!this.reduced) f.travel(p, st.at, { dur: 2.6 });
    if (!this.booted) { this.booted = true; this.boot(); }
  };

  /* ---- The HUD: drawn over the canvas, aria-hidden, written per frame ------ */
  var MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
  var SIGNS3 = ['ARI', 'TAU', 'GEM', 'CAN', 'LEO', 'VIR', 'LIB', 'SCO', 'SAG', 'CAP', 'AQU', 'PIS'];
  P.buildHud = function () {
    if (this.hud) return;
    var d = document, h = d.createElement('div');
    h.setAttribute('aria-hidden', 'true');
    h.setAttribute('data-obs-hud', '1');
    h.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;clip-path:inset(0 var(--obs-r,0px) 0 var(--obs-l,0px));opacity:0;transition:opacity .9s ease .4s;font:600 10.5px/1.2 ' + MONO + ';color:var(--tx);letter-spacing:.06em';
    var el = function (css, parent, txt) { var e = d.createElement('div'); e.style.cssText = css; if (txt) e.textContent = txt; (parent || h).appendChild(e); return e; };
    /* the reticle */
    var ret = el('position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1px solid rgba(var(--atmc2),.42);box-shadow:0 0 14px rgba(var(--atmc),.35)');
    [[16, -6, 1, 8], [16, 32, 1, 8], [-6, 16, 8, 1], [32, 16, 8, 1]].forEach(function (t) { el('position:absolute;left:' + t[0] + 'px;top:' + t[1] + 'px;width:' + t[2] + 'px;height:' + t[3] + 'px;background:rgba(var(--atmc2),.6)', ret); });
    el('position:absolute;left:15px;top:15px;width:2px;height:2px;border-radius:50%;background:var(--tx)', ret);
    /* the target's bracket, its label, and the arrow when it is off screen */
    var br = el('position:absolute;left:0;top:0;width:10px;height:10px;transition:opacity .2s ease;opacity:0');
    var corners = [];
    for (var i = 0; i < 4; i++) corners.push(el('position:absolute;width:12px;height:12px;border-color:var(--ac2-hi);border-style:solid;border-width:0', br));
    corners[0].style.cssText += ';left:0;top:0;border-left-width:2px;border-top-width:2px';
    corners[1].style.cssText += ';right:0;top:0;border-right-width:2px;border-top-width:2px';
    corners[2].style.cssText += ';left:0;bottom:0;border-left-width:2px;border-bottom-width:2px';
    corners[3].style.cssText += ';right:0;bottom:0;border-right-width:2px;border-bottom-width:2px';
    var lab = el('position:absolute;left:50%;top:100%;transform:translate(-50%,8px);white-space:nowrap;padding:4px 8px;border-radius:7px;background:var(--bg);border:1px solid var(--bd);color:var(--tx);font:600 10.5px ' + MONO, br);
    var arrow = el('position:absolute;left:0;top:0;width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:16px solid var(--ac2-hi);opacity:0;filter:drop-shadow(0 0 6px rgba(var(--atmc),.8))');
    /* telemetry */
    var strip = el('position:absolute;left:calc(var(--obs-l,0px) + (100% - var(--obs-l,0px) - var(--obs-r,0px)) / 2);top:var(--obs-top,72px);transform:translateX(-50%);display:flex;gap:2px;padding:3px;border-radius:12px;background:var(--bg);border:1px solid var(--bd);box-shadow:0 8px 30px rgba(0,0,0,.35)');
    var cell = function (k) {
      var c = el('display:flex;flex-direction:column;align-items:center;gap:2px;min-width:58px;padding:5px 8px;border-radius:9px', strip);
      el('font:700 8.5px ' + MONO + ';letter-spacing:.16em;color:var(--mut)', c, k);
      return el('font:600 12px ' + MONO + ';color:var(--tx);white-space:nowrap', c, '...');
    };
    var tel = { hdg: cell('HDG'), alt: cell('ALT'), vel: cell('VEL'), rng: cell('RNG'), utc: cell('UTC') };
    var spd = el('position:absolute;left:0;bottom:0;height:2px;width:0;background:linear-gradient(90deg,var(--ac2),var(--ac2-hi));transition:width .1s linear', strip);
    /* an approach, named as it begins */
    var ban = el('position:absolute;left:calc(var(--obs-l,0px) + (100% - var(--obs-l,0px) - var(--obs-r,0px)) / 2);top:58%;transform:translate(-50%,0);padding:7px 14px;border-radius:999px;background:var(--bg);border:1px solid var(--ac2);color:var(--tx);font:700 11px ' + MONO + ';letter-spacing:.2em;opacity:0;transition:opacity .5s ease');
    /* the boot lines, once */
    var boot = el('position:absolute;left:calc(var(--obs-l,0px) + (100% - var(--obs-l,0px) - var(--obs-r,0px)) / 2);top:40%;transform:translate(-50%,-50%);display:flex;flex-direction:column;gap:7px;padding:14px 18px;border-radius:14px;background:var(--bg);border:1px solid var(--bd);opacity:0;transition:opacity .6s ease');
    this.el.root.appendChild(h);
    this.hud = { root: h, ret: ret, br: br, lab: lab, arrow: arrow, strip: strip, tel: tel, spd: spd, ban: ban, boot: boot, t: 0, banT: 0, near: null };
  };
  P.boot = function () {
    var H = this.hud;
    if (!H) return;
    var lines = ['HULL SEALED', 'GUIDANCE ONLINE', 'FLIGHT ARMED'], d = document;
    H.boot.textContent = '';
    var rows = lines.map(function (t) {
      var r = d.createElement('div');
      r.style.cssText = 'display:flex;align-items:center;gap:10px;opacity:.35;font:700 10.5px ' + MONO + ';letter-spacing:.2em;color:var(--tx)';
      var dot = d.createElement('span'); dot.style.cssText = 'width:7px;height:7px;border-radius:50%;border:1px solid var(--ac2-hi)';
      var tx = d.createElement('span'); tx.textContent = t;
      r.appendChild(dot); r.appendChild(tx); H.boot.appendChild(r);
      return { r: r, dot: dot };
    });
    if (this.reduced) return;
    H.boot.style.opacity = '1';
    rows.forEach(function (x, i) { setTimeout(function () { x.r.style.opacity = '1'; x.dot.style.background = 'var(--ac2-hi)'; }, 500 + i * 420); });
    setTimeout(function () { H.boot.style.opacity = '0'; }, 2700);
  };
  P.fmt = function (v) { return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v) + ''); };
  P.readInset = function () {
    if (!this.obsRoot) return;
    var cs = getComputedStyle(this.obsRoot), l = parseFloat(cs.getPropertyValue('--obs-l')) || 0, r = parseFloat(cs.getPropertyValue('--obs-r')) || 0;
    if (!this.inset || this.inset.l !== l || this.inset.r !== r) { this.inset = { l: l, r: r }; this.kick(); }
  };
  P.updateHud = function (dt) {
    var H = this.hud;
    if (!H || this.mode !== 'obs' || !this.cam) return;
    if (this.shown && H.root.style.opacity !== '1') H.root.style.opacity = '1';
    var cam = this.cam, W = this.W || 300, Hh = this.H || 300, o = this.focusKey ? this.bodyObj(this.focusKey) : null, f = this.fly;
    var rng = null;
    if (o) {
      var p = o.orb.position, dist = cam.position.distanceTo(p);
      rng = Math.max(0, dist - o.size);
      var v = p.clone().project(cam), behind = v.z > 1;
      var sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * Hh;
      var on = !behind && sx > 0 && sx < W && sy > 0 && sy < Hh;
      if (on) {
        var pr = o.size / (dist * Math.tan(cam.fov * Math.PI / 360)) * Hh / 2, half = Math.max(16, Math.min(W, Hh) * 0.45 > pr * 1.25 ? pr * 1.25 : Math.min(W, Hh) * 0.45);
        H.br.style.opacity = '1';
        H.br.style.width = H.br.style.height = (half * 2).toFixed(0) + 'px';
        H.br.style.transform = 'translate(' + (sx - half).toFixed(1) + 'px,' + (sy - half).toFixed(1) + 'px)';
        H.arrow.style.opacity = '0';
      } else {
        H.br.style.opacity = '0';
        /* the arrow rides the edge of the open sky, never under a panel */
        var ins = this.inset || { l: 0, r: 0 }, cx = ins.l + (W - ins.l - ins.r) / 2, hw = (W - ins.l - ins.r) / 2;
        var dx = sx - cx, dy = sy - Hh / 2;
        if (behind) { dx = -dx; dy = -dy; }
        var a = Math.atan2(dy, dx), m = Math.min((hw - 34) / Math.max(1e-3, Math.abs(Math.cos(a))), (Hh / 2 - 90) / Math.max(1e-3, Math.abs(Math.sin(a))));
        H.arrow.style.opacity = '1';
        H.arrow.style.transform = 'translate(' + (cx + Math.cos(a) * m - 9).toFixed(1) + 'px,' + (Hh / 2 + Math.sin(a) * m - 8).toFixed(1) + 'px) rotate(' + (a * 180 / Math.PI + 90).toFixed(1) + 'deg)';
      }
    } else { H.br.style.opacity = '0'; H.arrow.style.opacity = '0'; }
    /* text ten times a second is plenty, and is what keeps this cheap */
    H.t += dt;
    if (H.t < 0.1 && !this.reduced) return;
    H.t = 0;
    this.readInset();
    var fw = new T.Vector3(); cam.getWorldDirection(fw);
    var th = Math.atan2(-fw.z, fw.x), lon = ((th / RAD - 180 + (this.model ? this.model.zero : 0)) % 360 + 720) % 360;
    H.tel.hdg.textContent = SIGNS3[Math.floor(lon / 30) % 12] + ' ' + Math.floor(lon % 30) + '°';
    H.tel.alt.textContent = this.fmt(Math.abs(cam.position.y)) + (cam.position.y < 0 ? ' S' : '');
    var sp = f && f.active ? f.speedNow : 0;
    H.tel.vel.textContent = this.fmt(sp);
    H.tel.rng.textContent = rng == null ? '--' : this.fmt(rng);
    var nd = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    H.tel.utc.textContent = pad(nd.getUTCHours()) + ':' + pad(nd.getUTCMinutes()) + ':' + pad(nd.getUTCSeconds());
    H.spd.style.width = (Math.min(1, sp / 9) * 100).toFixed(1) + '%';
    if (o) H.lab.textContent = o.b.label + '  ·  ' + (rng == null ? '' : this.fmt(rng));
    /* the panel's own range line, if the screen draws one */
    if (this.obsRoot) { var rt = rng == null ? '' : this.fmt(rng); [].forEach.call(this.obsRoot.querySelectorAll('[data-obs-range]'), function (x) { if (x.textContent !== rt) x.textContent = rt; }); }
    /* an approach: the nearest body inside twelve of its radii, named once */
    var nb = this.nearest([cam.position.x, cam.position.y, cam.position.z]);
    var close = nb && nb.o && nb.d < nb.r * 11 ? nb.o : null;
    if (close && close !== H.near) {
      H.near = close;
      H.ban.textContent = 'APPROACH  ·  ' + close.b.label.toUpperCase();
      H.ban.style.opacity = '1';
      H.banT = 2.4;
      if (this.o.onApproach) this.o.onApproach(close.b.key);
    } else if (!close) H.near = null;
    if (H.banT > 0) { H.banT -= 0.1; if (H.banT <= 0) H.ban.style.opacity = '0'; }
    /* the touch pad, where the screen offers one */
    if (f && this.obsRoot) {
      var padBox = this.obsRoot.querySelector('[data-obs-pad]');
      if (padBox) f.mountPad(padBox); else if (f.pad) f.unmountPad();
    }
  };
  /* The close-up: the target's world, turning slowly in the panel's window,
     drawn into the same canvas under the panel rather than a second one. */
  P.renderPip = function () {
    var el = this.pipEl;
    if (!el || !el.isConnected) el = this.pipEl = this.obsRoot ? this.obsRoot.querySelector('[data-obs-pip]') : null;
    var o = this.focusKey ? this.bodyObj(this.focusKey) : null;
    this.pipOn = !!(el && o && el.offsetWidth > 8);
    if (!this.pipOn || !o.globe || !this.globes) return;
    var cb = this.el.canvas.getBoundingClientRect(), eb = el.getBoundingClientRect();
    var x = eb.left - cb.left, y = cb.bottom - eb.bottom, w = eb.width, h = eb.height;
    if (w < 8 || h < 8 || x + w < 0 || y + h < 0 || x > cb.width || y > cb.height) return;
    var pc = this.pipCam || (this.pipCam = new T.PerspectiveCamera(28, 1, 0.002, 400));
    pc.layers.set(1);
    pc.aspect = w / h;
    var g = o.globe, spec = g.userData.spec || {}, c = o.orb.position, sun = this.sunPos();
    var R = o.size * (spec.rings ? 7.6 : spec.corona ? 6.5 : spec.kind === 7 ? 9 : 4.1);
    var to = new T.Vector3().subVectors(sun, c);
    if (to.lengthSq() < 1e-6) to.set(1, 0, 0.4);
    var base = Math.atan2(to.z, to.x) + 0.75 + Math.sin(this.time * 0.18) * 0.45;
    pc.position.set(c.x + Math.cos(base) * R, c.y + R * 0.3, c.z + Math.sin(base) * R);
    pc.lookAt(c);
    pc.updateProjectionMatrix(); pc.updateMatrixWorld();
    var vis = g.visible;
    g.visible = true;
    this.GU.uCamW.value.copy(pc.position);
    this.globes.update(g, 0, 1, sun, pc.position, o.size);
    var r = this.r;
    r.setRenderTarget(null);
    r.autoClear = false;
    r.setScissorTest(true);
    r.setScissor(x, y, w, h); r.setViewport(x, y, w, h);
    r.clear(true, true, false);
    r.render(this.scene, pc);
    r.setScissorTest(false);
    r.setViewport(0, 0, this.W, this.H);
    r.autoClear = true;
    this.GU.uCamW.value.copy(this.cam.position);
    g.visible = vis;
    this.globes.update(g, 0, o.gk || 0, sun, this.cam.position, o.size);
  };

  /* ---- Public moves --------------------------------------------------------- */
  P.zoom = function (dir) {
    if (this.mode === 'obs') {
      if (dir === 0) this.home();
      else { var f = this.flyEngage(); if (f) f.nudge([0, 0, dir < 0 ? 1.2 : -1.2]); }
      this.kick();
      return;
    }
    if (dir === 0 && this.flying()) this.flyRelease();
    if (dir === 0) { this.user.zoom = 1; this.user.yaw = 0; this.user.pitch = null; }
    else this.user.zoom = clamp(this.user.zoom * (dir < 0 ? 1.25 : 0.8), 0.6, 3.2);
    this.lift(0.15);
    this.kick();
  };
  P.step = function (dir) {
    var list = (this.model && this.model.bodies) || [];
    if (!list.length) return null;
    var i = list.map(function (b) { return b.key; }).indexOf(this.focusKey);
    var n = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
    return list[n].key;
  };

  /* ---- Picking, on the screen rather than in the scene ---------------------- */
  P.screen = function (v) {
    var p = v.clone().project(this.cam);
    return { x: (p.x + 1) / 2 * this.W, y: (1 - p.y) / 2 * this.H, z: p.z };
  };
  P.pickAt = function (px, py) {
    if (!this.cam || !this.bodies) return null;
    var best = null, bd = 1e9, self = this, e = ease(this.k);
    this.bodies.forEach(function (o) {
      var s = self.screen(o.orb.position), m = self.screen(o.med.position);
      var rad = Math.max(16, o.D * 0.62), up = o.D + 8 + (o.deg ? Math.max(9, Math.round(o.D * 0.3)) + 4 : 0) - (o.D / 2 + 4);
      var d = Math.min(Math.hypot(s.x - px, s.y - py), Math.hypot(m.x - px, m.y - up - py));
      if (d < rad && d < bd && s.z < 1) { bd = d; best = { kind: 'body', key: o.b.key }; }
    });
    if (best) return best;
    var ab = null, ad = 7;
    this.aspects.forEach(function (a) {
      var u = a.mesh.material.uniforms, prev = null;
      for (var i = 0; i <= 14; i++) {
        var t = i / 14, p = u.uA.value.clone().lerp(u.uB.value, t); p.y += u.uBow.value * 4 * t * (1 - t);
        var s = self.screen(p);
        if (prev) {
          var vx = s.x - prev.x, vy = s.y - prev.y, L = vx * vx + vy * vy, k = L ? clamp(((px - prev.x) * vx + (py - prev.y) * vy) / L, 0, 1) : 0;
          var d = Math.hypot(prev.x + vx * k - px, prev.y + vy * k - py);
          if (d < ad) { ad = d; ab = { kind: 'aspect', i: a.x.i }; }
        }
        prev = s;
      }
    });
    if (ab) return ab;
    if (e < 0.5) {
      var f = this.floorAt(px, py);
      if (f) {
        var r = Math.hypot(f.x, f.z);
        if (r >= R_HOUSE && r <= R_OUT + 0.2) {
          var lon = ((Math.atan2(-f.z, f.x) / RAD - 180 + this.model.zero) % 360 + 720) % 360;
          var rel = ((lon - this.model.zero) % 360 + 360) % 360;
          return { kind: 'house', n: Math.floor(rel / 30) + 1 };
        }
      }
    }
    return null;
  };
  P.floorAt = function (px, py) {
    var ray = this._ray || (this._ray = new T.Raycaster());
    ray.setFromCamera(new T.Vector2(px / this.W * 2 - 1, -(py / this.H * 2 - 1)), this.cam);
    var o = ray.ray.origin, d = ray.ray.direction;
    if (d.y > -1e-4) return null;
    var k = -o.y / d.y;
    return new T.Vector3(o.x + d.x * k, 0, o.z + d.z * k);
  };

  /* ---- Input ----------------------------------------------------------------- */
  P.local = function (e) { var b = this.el.pad.getBoundingClientRect(); return { px: e.clientX - b.left, py: e.clientY - b.top, x: (e.clientX - b.left) / b.width * 2 - 1, y: -((e.clientY - b.top) / b.height * 2 - 1) }; };
  P.lift = function (v) { this.c = Math.min(1, this.c + v); };
  P.onDown = function (e) {
    if (!this.ready || (e.button != null && e.button > 0)) return;
    this.pts = this.pts || {};
    this.pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(this.pts);
    if (ids.length === 2) {
      var a = this.pts[ids[0]], b = this.pts[ids[1]];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.user.zoom, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      this.down = null;
      return;
    }
    this.down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, id: e.pointerId, axis: null, type: e.pointerType, yaw: this.user.yaw, pitch: this.user.pitch != null ? this.user.pitch : this.defaultPitch() };
    this.lift(0.06);
  };
  P.onMove = function (e) {
    if (!this.ready) return;
    var n = this.local(e), dx0 = n.x - this.ptr.x, dy0 = n.y - this.ptr.y;
    this.ptrType = e.pointerType;
    this.ptr.x = n.x; this.ptr.y = n.y; this.ptr.px = n.px; this.ptr.py = n.py; this.ptr.on = true; this.ptr.moved = true;
    this.lift(Math.min(0.03, Math.hypot(dx0, dy0) * 0.25));
    if (this.pts && this.pts[e.pointerId]) this.pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (this.pinch && this.pts) {
      var ids = Object.keys(this.pts);
      if (ids.length === 2) {
        var a = this.pts[ids[0]], b = this.pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        /* Two fingers fly when flight is possible: the pair moving is a strafe
           or a climb, and spreading them is forward (Free look, or the
           Observatory, which is always flying). Otherwise a pinch zooms. */
        if (this.mode === 'obs' || this.explore || this.flying()) {
          var f = this.flyEngage();
          if (f) {
            var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, Hd = this.H || 300;
            f.nudge([-(cx - this.pinch.cx) / Hd * 2.2, (cy - this.pinch.cy) / Hd * 2.2, (d - this.pinch.d) / Hd * 3.2], 0.9);
            this.pinch.cx = cx; this.pinch.cy = cy; this.pinch.d = d;
          }
        } else this.user.zoom = clamp(this.pinch.zoom * d / Math.max(20, this.pinch.d), 0.6, 3.2);
      }
      this.kick();
      return;
    }
    var dn = this.down;
    if (dn && dn.id === e.pointerId) {
      var dx = e.clientX - dn.x, dy = e.clientY - dn.y;
      if (!dn.axis && Math.hypot(dx, dy) > 7) {
        /* On a touch screen a vertical drag is the page scrolling, so only a
           sideways one turns the chart; a mouse may tilt it too. */
        dn.axis = this.mode === 'obs' || (this.flying() && (dn.type === 'mouse' || this.explore)) ? 'look' : dn.type === 'mouse' || this.explore ? 'free' : Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        if (dn.axis !== 'y') { try { this.el.pad.setPointerCapture(e.pointerId); } catch (er) { /* not capturable */ } this.el.pad.style.cursor = 'grabbing'; this.hideTip(); }
      }
      if (dn.axis === 'look') {
        var fl = this.flyEngage(), Hl = this.H || 300;
        if (fl) fl.look(-(e.clientX - dn.lx) / Hl * 2.1, -(e.clientY - dn.ly) / Hl * 2.1);
        dn.lx = e.clientX; dn.ly = e.clientY;
        this.lift(0.02);
      } else if (dn.axis === 'x' || dn.axis === 'free') {
        var Wd = this.W || 300;
        this.user.yaw = dn.yaw - dx / Wd * Math.PI * 1.1;
        if (dn.axis === 'free') this.user.pitch = clamp(dn.pitch + dy * 0.005, 0.2, 1.42);
        this.lift(0.02);
      }
    }
    this.kick();
  };
  P.onUp = function (e) {
    if (this.pts) delete this.pts[e.pointerId];
    if (this.pinch) { if (!this.pts || Object.keys(this.pts).length < 2) this.pinch = null; return; }
    var dn = this.down;
    this.down = null;
    this.el.pad.style.cursor = 'grab';
    if (!dn || dn.id !== e.pointerId || dn.axis) return;
    var n = this.local(e), pk = this.pickAt(n.px, n.py);
    if (e.pointerType !== 'mouse') { this.ptr.on = false; this.hideTip(); }
    this.lift(0.2);
    if (!pk) { this.kick(); return; }
    var obs = this.mode === 'obs';
    if (pk.kind === 'body') {
      /* The first press brings a body forward and names it; a second press on
         the same body, or a mouse click on one already named, opens it. In
         the Observatory the second press travels there instead, and the
         reading is a button in the target panel. */
      if (pk.key === this.focusKey) { if (obs) this.flyTo(pk.key); else if (this.o.onOpen) this.o.onOpen(pk.key); }
      else { this.setFocus(pk.key, !obs); if (this.o.onFocus) this.o.onFocus(pk.key, 'tap'); }
    } else if (pk.kind === 'aspect') {
      if (this.o.onAspect) this.o.onAspect(pk.i);
      if (obs) { var ax = (this.model.aspects || []).filter(function (x) { return x.i === pk.i; })[0]; if (ax) this.flyToPair(ax.a, ax.b); }
    }
    else if (pk.kind === 'house') { if (this.o.onHouse) this.o.onHouse(pk.n); if (obs) this.flyToHouse(pk.n); }
    this.kick();
  };
  P.onWheel = function (e) {
    if (!this.ready) return;
    e.preventDefault();
    if (this.mode === 'obs' || this.flying()) {
      var f = this.flyEngage();
      if (f) f.nudge([0, 0, clamp(-e.deltaY * 0.004, -1.5, 1.5)], 0.8);
      this.lift(0.03); this.kick();
      return;
    }
    this.user.zoom = clamp(this.user.zoom * Math.exp(-e.deltaY * 0.0012), 0.6, 3.2);
    this.lift(0.04);
    this.kick();
  };
  P.onKey = function (e) {
    if (!this.ready || !this.model || e.target !== this.host || this.mode === 'obs') return;
    var F = root.Flight, flying = this.flying();
    if (F && ((F.isMoveKey(e.code) && (e.code !== 'Space' || flying)) || e.code === 'KeyX' || (flying && /^Arrow/.test(e.code)))) {
      var fl = this.flyEngage();
      if (fl) { fl.key(e, true); e.preventDefault(); this.lift(0.04); this.kick(); return; }
    }
    if (e.key === 'Escape' && flying) { e.preventDefault(); e.stopPropagation(); this.flyRelease(); return; }
    var k = e.key, done = true;
    if (k === 'ArrowRight' || k === 'ArrowLeft') {
      var nk = this.step(k === 'ArrowRight' ? 1 : -1);
      if (nk) { this.setFocus(nk); if (this.o.onFocus) this.o.onFocus(nk, 'key'); }
    } else if (k === 'ArrowUp') this.user.pitch = clamp((this.user.pitch != null ? this.user.pitch : this.defaultPitch()) + 0.08, 0.2, 1.42);
    else if (k === 'ArrowDown') this.user.pitch = clamp((this.user.pitch != null ? this.user.pitch : this.defaultPitch()) - 0.08, 0.2, 1.42);
    else if (k === '+' || k === '=') this.zoom(-1);
    else if (k === '-' || k === '_') this.zoom(1);
    else if (k === '0' || k === 'Home') this.zoom(0);
    else if ((k === 'Enter' || k === ' ') && this.focusKey) { if (this.o.onOpen) this.o.onOpen(this.focusKey); }
    else done = false;
    if (done) { e.preventDefault(); this.lift(0.08); this.kick(); }
  };
  P.setHover = function (pk) {
    var id = pk ? pk.kind + ':' + (pk.kind === 'body' ? pk.key : pk.kind === 'aspect' ? pk.i : pk.n) : null;
    if (this._hovId === id) return;
    this._hovId = id;
    this.hover = pk;
    if (pk) this.lift(0.1);
  };
  P.hideTip = function () { this.el.tip.style.opacity = '0'; };
  P.updateHover = function () {
    if (!this.ptr.moved) return;
    this.ptr.moved = false;
    if (!this.ptr.on || (this.down && this.down.axis) || this.ptrType !== 'mouse') { this.setHover(null); this.hideTip(); return; }
    var pk = this.pickAt(this.ptr.px, this.ptr.py);
    this.setHover(pk);
    var tip = this.el.tip, txt = '';
    if (pk && pk.kind === 'body') { var b = this.bodyBy(pk.key); txt = b ? b.tip : ''; }
    else if (pk && pk.kind === 'aspect') { var a = (this.model.aspects || []).filter(function (x) { return x.i === pk.i; })[0]; txt = a ? a.label : ''; }
    else if (pk && pk.kind === 'house') txt = 'House ' + pk.n;
    var du = this.discMat.uniforms, f = this.floorAt(this.ptr.px, this.ptr.py);
    if (f) du.uPtr.value.set(f.x, -f.z);
    this._ptrOn = !!f;
    if (txt) {
      tip.textContent = txt;
      var W = this.W || 300, x = clamp(this.ptr.px + 14, 8, W - 270), y = Math.max(8, this.ptr.py - 50);
      tip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      tip.style.opacity = '1';
      this.el.pad.style.cursor = 'pointer';
    } else {
      this.hideTip();
      if (!this.down) this.el.pad.style.cursor = 'grab';
    }
  };

  /* ---- The loop --------------------------------------------------------------- */
  P.updateRun = function () {
    var want = this.ready && !this.failed && !!this.host && this.el.root.isConnected && this.visible && !document.hidden;
    /* reduced motion draws on change, except while the reader is flying,
       because flying is a change every frame */
    if (want && this.reduced && !this.flying()) { this.stop(); this.kick(); return; }
    if (want && !this.running) { this.running = true; this.last = 0; this.raf = requestAnimationFrame(this._tick || (this._tick = this.tick.bind(this))); }
    else if (!want) this.stop();
  };
  P.stop = function () { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; };
  P.kick = function () {
    if (!this.ready || this.failed || this.running || this._kick) return;
    var self = this;
    this._kick = requestAnimationFrame(function () {
      self._kick = 0;
      if (!self.host || !self.el.root.isConnected) return;
      self.frame(0.016, true);
      self.render();
    });
  };
  P.tick = function (ts) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this._tick);
    if (!this.host || !this.el.root.isConnected) { this.stop(); return; }
    var dt = this.last ? Math.min(this.flying() ? 0.25 : 0.1, (ts - this.last) / 1000) : 0.016;
    var busy = this.c > 0.04 || this.down || this.pinch || !this._settled || Math.abs(this.k - this.kGoal) > 0.001 || Math.abs(this.todayK - (this.todayOn ? 1 : 0)) > 0.001 ||
      (this.fly && this.fly.busy()) || !!this.ret || this.mode === 'obs';
    if (!busy && ts - this.lastDraw < 31) return;
    this.last = ts;
    if (this.lastDraw) this.measure(ts - this.lastDraw, busy);
    this.lastDraw = ts;
    this.frame(dt, false);
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
  P.frame = function (dt, still) {
    if (!this.model || !this.cam || !this.content) return;
    var rm = this.reduced;
    if (!rm && !still) this.time += dt;
    this.c = Math.max(0, this.c - dt / 8);
    this.cur = damp(this.cur, this.c, rm ? 1 : 1 - Math.exp(-dt * 4));
    var c = this.cur, breath = rm ? 1 : 0.5 + 0.5 * Math.sin(this.time * Math.PI * 2 / 7.5);
    this.U.uTime.value = rm ? 2.0 : this.time;
    this.U.uBreath.value = breath;
    this.U.uGlow.value = 0.86 + 0.12 * breath * (1 - 0.5 * c) + 0.35 * c;
    if (!rm && !still) this.drift += dt * (0.1 + 0.4 * c);
    this.dustMat.uniforms.uDrift.value = this.drift;
    this.dustMat.uniforms.uAlpha.value = 0.35 + 0.4 * c;
    this.k = rm ? this.kGoal : damp(this.k, this.kGoal, 1 - Math.exp(-dt * 2.4));
    if (Math.abs(this.k - this.kGoal) < 0.0008) this.k = this.kGoal;
    var tg = this.todayOn ? 1 : 0;
    this.todayK = rm ? tg : damp(this.todayK, tg, 1 - Math.exp(-dt * 3));
    this.updateHover();
    this._dt = dt;
    if (this.launchPending && this.mode === 'obs' && this.W) this.launch();
    if (this.fly && this.fly.active) { this.fly.update(dt, this.flyEnv()); if (this.spaceDust) this.spaceDust.material.uniforms.uVel.value.fromArray(this.fly.velocity()); }
    this.discMat.uniforms.uPtrOn.value = damp(this.discMat.uniforms.uPtrOn.value, this.ptr.on && this._ptrOn && this.ptrType === 'mouse' ? 0.5 + 0.5 * c : 0, rm ? 1 : 1 - Math.exp(-dt * 6));
    this.place();

    /* Hover and focus: a body named lights its aspects and the rest go quiet. */
    var kh = rm ? 1 : 1 - Math.exp(-dt * 10), self = this, hov = this.hover;
    var hovBody = (hov && hov.kind === 'body' ? hov.key : null) || this.hoverKey, lit = hovBody || this.focusKey || this.sel.body;
    var hovAsp = hov && hov.kind === 'aspect' ? hov.i : null;
    this.bodies.forEach(function (o) {
      var on = o.b.key === hovBody || o.b.key === self.focusKey || o.b.key === self.sel.body ? 1 : 0;
      o.hover = damp(o.hover, on, kh);
      o.orb.material.uniforms.uHover.value = o.hover;
      var bob = rm ? 0 : Math.sin(self.time * 0.9 + o.b.lon * 0.05) * 0.03 * (1 - ease(self.k));
      o.orb.position.y += bob; o.med.position.y += bob; if (o.medF) o.medF.position.y += bob;
      o.orb.scale.setScalar(o.size * (1 + 0.18 * o.hover));
    });
    this.aspects.forEach(function (a) {
      var mine = lit && (a.x.a === lit || a.x.b === lit), on = a.x.i === hovAsp || a.x.i === self.sel.aspect ? 1 : mine ? 0.75 : 0;
      a.hover = damp(a.hover, on, kh);
      var u = a.mesh.material.uniforms;
      u.uI.value = (lit && !mine && on === 0 ? (hovBody || hovAsp != null ? 0.18 : 0.42) : 0.85) + 0.7 * a.hover;
      u.uPulse.value = a.hover;
    });

    this.placeCamera(rm ? 1 : 1 - Math.exp(-dt * 3));
    this.updateGlobes(dt);
    if (this.mode === 'obs') this.updateHud(dt);
    var cp = this.cam.position, w = new T.Vector3();
    var face = function (o) { o.getWorldPosition(w); o.rotation.y = Math.atan2(cp.x - w.x, cp.z - w.z); };
    this.content.traverse(function (o) { if (o.userData && o.userData.bill) face(o); });
  };

  P.resize = function () {
    if (!this.r || !this.el.root.isConnected) return;
    var b = this.el.root.getBoundingClientRect(), W = Math.max(2, Math.round(b.width)), H = Math.max(2, Math.round(b.height));
    var dpr = window.devicePixelRatio || 1, L = [Math.min(dpr, 2), Math.min(dpr, 1.5), Math.min(dpr, 1.25), 1, 0.75][this.level];
    var bloom = this.level <= 1;
    if (W === this.W && H === this.H && L === this.pr && bloom === this.bloom) return;
    this.W = W; this.H = H; this.pr = L; this.bloom = bloom;
    /* Glyphs and labels are drawn at a pixel size, so they are drawn for the
       stage they sit on: a phone's chart is two thirds of a desktop's. */
    var ui = clamp(Math.min(W, H) / 500, 0.7, 1.2);
    this.ui = ui;
    var rebuild = this.builtUi != null && Math.abs(ui - this.builtUi) > 0.05;
    this.r.setPixelRatio(L);
    this.r.setSize(W, H, false);
    this.cam.aspect = W / H;
    this.cam.fov = this.baseFov = W / H < 0.9 ? (this.mode === 'obs' ? 46 : 42) : this.mode === 'obs' ? 40 : 36;
    this.cam.updateProjectionMatrix();
    this.U.uPR.value = L;
    this.U.uRes.value.set(W, H);
    var self = this;
    this.labels.forEach(function (s) { self.sizeLabel(s); });
    this.setupPost();
    if (rebuild) this.buildContent();
    this.kick();
  };
  P.setupPost = function () {
    if (this.post) { ['scene', 'a', 'b', 'c', 'd'].forEach(function (k) { this.post[k].dispose(); }, this); }
    this.post = null;
    if (!this.bloom) return;
    var w = Math.round(this.W * this.pr), h = Math.round(this.H * this.pr), type = this.half ? T.HalfFloatType : T.UnsignedByteType;
    var rt = function (ww, hh, s) { return new T.WebGLRenderTarget(Math.max(2, ww), Math.max(2, hh), { type: type, samples: s || 0, depthBuffer: !!s }); };
    this.post = { scene: rt(w, h, 4), a: rt(w / 4, h / 4), b: rt(w / 4, h / 4), c: rt(w / 8, h / 8), d: rt(w / 8, h / 8) };
    if (!this.postScene) {
      this.postScene = new T.Scene();
      this.postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.quad = new T.Mesh(new T.PlaneGeometry(2, 2));
      this.quad.frustumCulled = false;
      this.postScene.add(this.quad);
      this.mBright = new T.ShaderMaterial({ vertexShader: V_POST, fragmentShader: F_BRIGHT, depthTest: false, depthWrite: false, uniforms: { tIn: { value: null }, uThr: { value: 0.5 } } });
      this.mBlur = new T.ShaderMaterial({ vertexShader: V_POST, fragmentShader: F_BLUR, depthTest: false, depthWrite: false, uniforms: { tIn: { value: null }, uDir: { value: new T.Vector2() } } });
      this.mComp = new T.ShaderMaterial({ vertexShader: V_POST, fragmentShader: F_COMP, depthTest: false, depthWrite: false,
        uniforms: { tScene: { value: null }, tB1: { value: null }, tB2: { value: null }, uStr: { value: 0.8 }, uVig: { value: 0.4 } } });
    }
  };
  P.pass = function (mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.postScene, this.postCam); };
  P.render = function () {
    if (!this.r || !this.model || !this.cam || !this.content) return;
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
      cu.tScene.value = p.scene.texture; cu.tB1.value = p.a.texture; cu.tB2.value = p.d.texture; cu.uStr.value = 0.5 + 0.4 * this.cur;
      this.pass(this.mComp, null);
    }
    if (this.mode === 'obs') this.renderPip();
    /* Revealed where it is seen: a stage built in the lot draws its first
       frames there, and its fade and its wake belong to the reader. */
    if (!this.shown && this.fontsOk && (this.visible || !this.io)) {
      this.shown = true;
      this.el.canvas.style.opacity = '1';
      if (this.o.onReady) this.o.onReady();
    }
  };

  P.destroy = function () {
    if (this.nio) { this.nio.disconnect(); this.nio = null; }
    this.stop();
    this.unbindObs();
    if (this._onBlur) window.removeEventListener('blur', this._onBlur);
    if (this.fly) this.fly.unmountPad();
    if (this.globes) this.clearGlobes();
    if (this.host && this._onKey) this.host.removeEventListener('keydown', this._onKey);
    document.removeEventListener('visibilitychange', this._on.vis);
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    if (this.content) this.dispose(this.content);
    if (this.post) { ['scene', 'a', 'b', 'c', 'd'].forEach(function (k) { this.post[k].dispose(); }, this); }
    if (this.r) this.r.dispose();
    try { if (this.el.root.parentNode) this.el.root.parentNode.removeChild(this.el.root); } catch (e) { /* gone already */ }
    this.failed = true;
  };

  root.ChartScene = {
    supported: supported,
    /* what kind of world a body is drawn as, for the screen's own words */
    kindOf: function (b) { return root.BodyGlobes ? root.BodyGlobes.kindOf(b) : 'point'; },
    create: function (opts) { return new Scene(opts); }
  };
})(typeof window !== 'undefined' ? window : this);
