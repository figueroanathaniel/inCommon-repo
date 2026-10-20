/* hd-scene.js: THE WIRING IN DEPTH.

   The owner, 19 October 2026: "Redesign the human design page to make the ux
   like it was made by unreal engine. Completely interactive, high quality
   visuals, 3D options with 2D available. Compact, highly engaging, drive the
   experience to reflect the human design philosophy." The 2D wiring is the
   app's own SVG and stays exactly as it was. This file draws the other two,
   as one three.js scene that moves between them:

   3D is the wiring standing in space. The nine centres are crystals in the
   shapes the field draws them in, at the places the 2D wiring puts them. All
   thirty six channels are there, each as two halves, and a half is lit only
   when its own gate is: Personality in the ink colour, Design in the warm one,
   both as a braid. That is how a hanging gate reads, as half a channel
   reaching for somebody else. The activations stand in two columns either
   side, Design on the left and Personality on the right, the way a printed
   chart lists them, and each one threads to its gate when it is named.

   Wheel is the same chart with the sky put back round it: the sixty four
   gates as a ring at the body's waist, in their order from gate 41, and every
   activation leaves its column for the place on the ring its astral body
   stood, with a thread down to the gate it lights. Moving between the two is a
   morph, not a cut.

   THE PHILOSOPHY IS IN THE BEHAVIOUR, NEVER IN A SENTENCE. A defined centre
   holds its light steadily, because that is what defined means. An open
   centre is glass that takes on the colours of the centres around it and
   never settles on one, and when it is named it fills with them. Defined
   channels carry a slow flow upward toward expression. A defined Solar Plexus
   breathes as a wave, a defined Sacral hums, a defined Root builds pressure.
   And the body wakes the way its type meets the world: a Manifestor's lights
   from its motor to its throat on its own, a Generator's waits, its Sacral
   asking, until the reader responds, a Manifesting Generator's answers that
   response at speed, a Projector's open centres see first and the defined
   follow, and a Reflector's comes up all at once like moonlight. Nothing on
   screen says so; the reader finds it.

   WHAT IT DRAWS IS THE APP'S, NEVER ITS OWN. Every gate, line, activation,
   channel, centre and colour arrives in the model the app builds (hdSceneModel
   in the app), from the same hdChart() the 2D wiring reads, so the views
   cannot disagree. The sky now arrives through setSky(), from the app's own
   hd-transit reading. Nothing here computes a chart, and nothing is sent.

   THE FALLBACK IS THE APP'S 2D WIRING. Without WebGL 2, or when three.js does
   not load, or when the context is lost, opts.onFail tells the app, which
   shows the SVG and hides the other two choices.

   THE LOOP IS ONLY WHERE IT IS SEEN, at 60 frames a second while something
   moves and 30 at rest, with the quality ladder chart-scene.js uses. Under
   reduced motion nothing animates: a frame is drawn on change, the morph, the
   wake and the camera cut, and the light holds still rather than vanishing.
   three.js is the copy the cover vendors, imported on first use. */
(function (root) {
  'use strict';

  var T = null, loading = null, okGL = null;
  var RAD = Math.PI / 180;
  /* The 2D wiring's box is 300 by 520; forty of its units are one here. */
  var S = 40, MIDX = 150, BASE = 500;
  var RING_Y = 6.2, RING_IN = 6.15, RING_OUT = 7.25, RING_LAB = 6.7, ACT_R = { design: 7.95, personality: 8.75 }, SKY_R = 9.5;
  var COL_X = 5.75, COL_TOP = 11.55, COL_STEP = 0.8;
  var DEPTH = 0.42, FACE = 0.27;
  var MOTORS = { Sacral: 1, Heart: 1, 'Solar Plexus': 1, Root: 1 };
  var ORDER = ['Sun', 'Earth', 'Moon', 'North Node', 'South Node', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

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
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function damp(cur, goal, k) { return cur + (goal - cur) * k; }
  function ease(k) { return k * k * (3 - 2 * k); }
  function mix(a, b, k) { return a + (b - a) * k; }
  /* The wake runs on the wall clock, not on scene time: a slow machine draws
     fewer frames of it rather than a longer one. */
  function now() { return (window.performance ? performance.now() : Date.now()) / 1000; }
  function wrapPi(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

  /* ---- Shaders ------------------------------------------------------------ */
  var FOG = 'uniform vec3 uCam; uniform float uFog;\nfloat fogK(vec3 w){ float d = distance(w, uCam); return exp(-pow(d * uFog, 2.0)); }\n';
  var V_UV = 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';

  /* The ground the body stands on: a pool of the identity's warm light under
     it, a faint grid that fades with distance, and the pointer's glow. */
  var F_FLOOR = FOG + [
    'uniform vec3 uBg; uniform vec3 uLine; uniform vec3 uAtm; uniform vec3 uAtm2; uniform vec2 uPtr; uniform float uPtrOn; uniform float uBreath; uniform float uWake;',
    'varying vec2 vUv; varying vec3 vW;',
    'void main(){ vec2 p = vW.xz; float r = length(p); if (r > 15.5) discard;',
    ' float fw = fwidth(r) * 1.2 + 0.002; vec3 c = uBg;',
    ' c += uAtm2 * 0.11 * exp(-r * r * 0.06) * (0.75 + 0.25 * uBreath) * (0.4 + 0.6 * uWake);',
    ' c += uAtm * 0.06 * smoothstep(15.0, 0.0, r);',
    ' vec2 g = abs(fract(p / 1.5 + 0.5) - 0.5) * 1.5; float gl = 1.0 - smoothstep(0.0, 0.02 + fwidth(p.x) * 1.5, min(g.x, g.y));',
    ' c += uLine * gl * 0.05 * smoothstep(14.0, 2.0, r);',
    ' float rings = 1.0 - smoothstep(0.012, 0.012 + fw, abs(r - 4.6)); rings += (1.0 - smoothstep(0.01, 0.01 + fw, abs(r - 13.0))) * 0.6;',
    ' c += uLine * rings * 0.12;',
    ' vec2 dp = p - uPtr; c += uAtm * 0.16 * uPtrOn * exp(-dot(dp, dp) * 0.35);',
    ' c = mix(uBg, c, fogK(vW));',
    ' gl_FragColor = vec4(c, (1.0 - smoothstep(12.5, 15.5, r)) * 0.92); }'].join('\n');

  /* A centre: crystal, lit from inside when defined, glass when open. The open
     glass carries the colour of what is around it (uCond) and drifts, which is
     the whole difference between the two kinds, drawn rather than said. */
  var V_CEN = 'varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vL; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  var F_CEN = FOG + [
    'uniform vec3 uC; uniform vec3 uRim; uniform vec3 uCond; uniform vec3 uBg; uniform float uDef; uniform float uLit; uniform float uCondK; uniform float uHover;',
    'uniform float uPulse; uniform float uTime; uniform float uDim;',
    'varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vL;',
    'void main(){ vec3 n = normalize(vN); float f = clamp(abs(dot(n, normalize(vV))), 0.0, 1.0); float rim = pow(1.0 - f, 2.4);',
    ' float sh = 0.5 + 0.5 * sin(vL.x * 3.1 + vL.y * 2.3 + uTime * 0.6) * sin(vL.y * 2.7 - uTime * 0.43);',
    ' vec3 d = uC * (0.32 + 0.48 * pow(f, 1.3) + 0.08 * sh) * (1.0 + uPulse) + mix(uC, vec3(1.0), 0.35) * rim * 0.9;',
    ' vec3 o = uBg * 0.6 + uRim * (0.05 + rim * 0.75) + uCond * uCondK * (0.3 + 0.7 * sh) * (0.45 + 0.55 * f);',
    ' vec3 c = mix(o, d, uDef) * mix(0.32, 1.0, uLit) * (0.85 + 0.4 * uHover) * uDim;',
    ' float a = mix(0.42 + 0.5 * rim + 0.3 * uCondK, 1.0, uDef);',
    ' gl_FragColor = vec4(c * fogK(vW), a); }'].join('\n');

  var V_ORB = 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  var F_ORB = FOG + [
    'uniform vec3 uC; uniform vec3 uCore; uniform float uHover; uniform float uGlow; uniform float uOp;',
    'varying vec3 vN; varying vec3 vV; varying vec3 vW;',
    'void main(){ float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); float rim = pow(1.0 - f, 2.2);',
    ' vec3 c = mix(uCore * (0.25 + 0.55 * pow(f, 1.6)), uC, rim) + uC * rim * (0.5 + 0.8 * uHover);',
    ' gl_FragColor = vec4(c * uGlow * (0.85 + 0.35 * uHover) * uOp * fogK(vW), 1.0); }'].join('\n');

  /* A ribbon between two points, a constant number of pixels wide, bowed by a
     vector. A channel is two of these, one per half, sharing one curve: each
     half draws its own stretch of it (uU0 to uU1), with vUv.x = 0 at its gate,
     so a half lights from its gate whatever the other half is doing. */
  var V_RIB = [
    'attribute float aU; attribute float aSide; uniform vec3 uA; uniform vec3 uB; uniform vec3 uBow; uniform float uU0; uniform float uU1; uniform float uW; uniform vec2 uRes;',
    'varying vec2 vUv; varying vec3 vW;',
    'vec3 P(float u){ return mix(uA, uB, u) + uBow * 4.0 * u * (1.0 - u); }',
    'void main(){ float u = mix(uU0, uU1, aU); vec3 p = P(u); vec4 cp = projectionMatrix * viewMatrix * vec4(p, 1.0);',
    ' float e = 0.01 * sign(uU1 - uU0 + 1e-6); vec4 c1 = projectionMatrix * viewMatrix * vec4(P(u + e), 1.0); vec4 c0 = projectionMatrix * viewMatrix * vec4(P(u - e), 1.0);',
    ' vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * uRes; float l = length(d); vec2 n = l > 1e-5 ? vec2(-d.y, d.x) / l : vec2(0.0, 1.0);',
    ' cp.xy += n * aSide * uW / uRes * cp.w; vUv = vec2(aU, aSide); vW = p; gl_Position = cp; }'].join('\n');
  var F_RIB = FOG + [
    'uniform vec3 uC; uniform vec3 uC2; uniform float uBraid; uniform float uI; uniform float uDash; uniform float uLen; uniform float uTime; uniform float uFlow; uniform float uDir; uniform float uEnds;',
    'varying vec2 vUv; varying vec3 vW;',
    'void main(){ float s = 1.0 - abs(vUv.y); float a = pow(s, 1.5) * 0.7 + pow(s, 8.0) * 0.85;',
    ' float x = vUv.x * uLen; vec3 col = mix(uC, uC2, uBraid * step(0.5, fract(x * 1.4)));',
    ' if (uDash > 0.5) a *= 0.25 + 0.75 * step(0.5, fract(x * 2.6 - uTime * 0.4));',
    ' float fl = pow(0.5 + 0.5 * sin((x * 0.55 * uDir - uTime * 0.9) * 6.2832), 12.0) * uFlow;',
    ' float ends = mix(1.0, smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x), uEnds);',
    ' gl_FragColor = vec4(col * a * ends * (uI + fl * 1.3) * fogK(vW), 1.0); }'].join('\n');

  /* The wheel: sixty four cells, each lit from a row of a small texture
     (personality, design, the sky, the focus), with the line between every
     gate drawn here rather than built. */
  var F_RING = FOG + [
    'uniform vec3 uLine; uniform vec3 uP; uniform vec3 uD; uniform vec3 uSky; uniform vec3 uSel; uniform vec3 uAc2; uniform sampler2D uCells; uniform float uK; uniform float uStart;',
    'uniform float uIn; uniform float uOut; varying vec2 vUv; varying vec3 vW;',
    'void main(){ vec2 p = vec2(vW.x, -vW.z); float r = length(p); float fw = fwidth(r) * 1.2 + 0.002;',
    ' float inB = smoothstep(uIn - fw, uIn + fw, r) * (1.0 - smoothstep(uOut - fw, uOut + fw, r)); if (inB < 0.001) discard;',
    ' float lon = mod(degrees(atan(p.y, p.x)) - 180.0 + 720.0, 360.0); float off = mod(lon - uStart + 720.0, 360.0);',
    ' float i = floor(off / 5.625); vec4 cell = texture2D(uCells, vec2((i + 0.5) / 64.0, 0.5));',
    ' float bd = abs(fract(off / 5.625 + 0.5) - 0.5) * 5.625 * 0.01745 * r;',
    ' vec3 c = uAc2 * 0.06;',
    ' c += uP * cell.r * 0.34 + uD * cell.g * 0.34 + uSky * cell.b * 0.3 + uSel * cell.a * 0.3;',
    ' c += uLine * (1.0 - smoothstep(0.01, 0.01 + fw, bd)) * 0.32;',
    ' float edge = (1.0 - smoothstep(0.012, 0.012 + fw, abs(r - uIn))) + (1.0 - smoothstep(0.016, 0.016 + fw, abs(r - uOut)));',
    ' c += mix(uLine, uAc2, 0.5) * edge * 0.75;',
    ' gl_FragColor = vec4(c * inB * uK * fogK(vW), 1.0); }'].join('\n');

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
    'void main(){ vec3 p = position; p.y = mod(p.y + uDrift * (0.25 + aR), 13.5);',
    ' p.x += sin(uTime * 0.13 + aR * 40.0) * 0.35; p.z += cos(uTime * 0.11 + aR * 30.0) * 0.3;',
    ' vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    ' gl_PointSize = (1.0 + aR * 2.2) * uPR * (11.0 / max(0.5, -mv.z));',
    ' vA = (0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * (0.7 + aR * 2.0) + aR * 20.0))) * smoothstep(0.0, 1.0, p.y) * smoothstep(13.5, 10.0, p.y);',
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
    ' float v = smoothstep(1.2, 0.3, length((vUv - 0.5) * vec2(1.3, 1.3))); c *= mix(1.0, v, uVig);',
    ' c = c / (1.0 + max(vec3(0.0), c - 0.85) * 0.9); gl_FragColor = vec4(c, 1.0); }'].join('\n');

  /* ---- Reading the palette off the page ----------------------------------- */
  var DEFAULT_TOK = {
    bg: [0.02, 0.024, 0.04], tx: [0.933, 0.941, 0.973], ac2: [0.545, 0.361, 0.965], hi: [0.718, 0.608, 1], blue: [0.49, 0.608, 1],
    atm: [0.184, 0.31, 0.839], atm2: [0.949, 0.839, 0.62], atm3: [0.184, 0.31, 0.839], ac: [0.184, 1, 0.561], des: [0.875, 0.604, 0.373],
    cTx: 'rgb(238, 240, 248)', cMut: 'rgba(238, 240, 248, 0.58)', cHi: 'rgb(183, 155, 255)', cBlue: 'rgb(125, 155, 255)', cBg: 'rgb(5, 6, 10)', cDes: 'rgb(223, 154, 95)',
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
      atm: toVec(css('--atmc')), atm2: toVec(css('--atmc2')), atm3: toVec(css('--atmc3')), ac: toVec(css('--ac')), des: toVec(css('--hd-des', 'rgb(223,154,95)')),
      cTx: css('--tx'), cMut: css('--mut'), cHi: css('--ac2-hi'), cBlue: css('--blue'), cBg: css('--bg'), cDes: css('--hd-des', 'rgb(223,154,95)'),
      atmo: parseFloat(cs.getPropertyValue('--atmo')) || 0.6,
      fd: cs.getPropertyValue('--fd').trim() || 'serif', fu: cs.getPropertyValue('--fu').trim() || 'sans-serif'
    };
    el.removeChild(pr);
    return out;
  }
  function v3(a) { return new T.Vector3(a[0], a[1], a[2]); }
  var GLYPH_FONT = '"Apple Symbols","Segoe UI Symbol","Noto Sans Symbols","Noto Sans Symbols 2","DejaVu Sans",Georgia,serif';

  /* ---- The geometry of the wiring ----------------------------------------- */
  /* Each centre in the shape the field draws it, about its own middle, in the
     box the 2D wiring gives it. */
  function outline(name, w, h) {
    var a = w / 2, b = h / 2;
    switch (name) {
      case 'Head': case 'Heart': return [[-a, -b], [a, -b], [0, b]];
      case 'Ajna': return [[-a, b], [0, -b], [a, b]];
      case 'Spleen': return [[-a, -b], [a, 0], [-a, b]];
      case 'Solar Plexus': return [[a, -b], [a, b], [-a, 0]];
      case 'G': return [[0, -b * 1.12], [a * 0.98, 0], [0, b * 1.12], [-a * 0.98, 0]];
      default: return [[-a, -b], [a, -b], [a, b], [-a, b]];
    }
  }
  function inPoly(pt, poly) {
    var x = pt[0], y = pt[1], ins = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins;
    }
    return ins;
  }
  /* How far a ray from o along d travels before it leaves the polygon. */
  function rayOut(o, d, poly) {
    var best = 1e9;
    for (var i = 0; i < poly.length; i++) {
      var p = poly[i], q = poly[(i + 1) % poly.length], ex = q[0] - p[0], ey = q[1] - p[1];
      var den = d[0] * ey - d[1] * ex;
      if (Math.abs(den) < 1e-9) continue;
      var t = ((p[0] - o[0]) * ey - (p[1] - o[1]) * ex) / den, u = ((p[0] - o[0]) * d[1] - (p[1] - o[1]) * d[0]) / den;
      if (t > 1e-6 && u >= -1e-6 && u <= 1 + 1e-6 && t < best) best = t;
    }
    return best < 1e9 ? best : 0;
  }
  /* Where every gate sits on its centre: on the edge that faces the centre its
     channel runs to, with the channels between one pair of centres kept
     parallel so they never cross each other on the way. A gate in more than
     one channel takes the place of its first, in the topology's order. */
  function layoutGates(centres, channels) {
    var byName = {}, pos = {}, dirs = {};
    centres.forEach(function (c) { byName[c.name] = c; });
    var pairs = {};
    channels.forEach(function (ch) { var k = ch.ca < ch.cb ? ch.ca + '|' + ch.cb : ch.cb + '|' + ch.ca; (pairs[k] = pairs[k] || []).push(ch); });
    channels.forEach(function (ch) {
      var A = byName[ch.ca], B = byName[ch.cb];
      if (!A || !B) return;
      var k = ch.ca < ch.cb ? ch.ca + '|' + ch.cb : ch.cb + '|' + ch.ca, list = pairs[k], idx = list.indexOf(ch), n = list.length;
      var first = list[0].ca === ch.ca ? A : B, other = first === A ? B : A;
      var dx = other.cx - first.cx, dy = other.cy - first.cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux;
      var o = (idx - (n - 1) / 2) * 0.34;
      var place = function (g, C, sx, sy) {
        if (pos[g]) return;
        var ox = px * o, oy = py * o;
        var guard = 0;
        while (!inPoly([ox * 1.0, oy * 1.0], C.poly) && guard++ < 6) { ox *= 0.6; oy *= 0.6; }
        var t = rayOut([ox, oy], [sx, sy], C.poly);
        var inset = Math.min(0.24, t * 0.45);
        pos[g] = { c: C.name, x: ox + sx * (t - inset), y: oy + sy * (t - inset) };
        dirs[g] = [sx, sy];
      };
      place(ch.a, ch.ca === first.name ? first : other, ch.ca === first.name ? ux : -ux, ch.ca === first.name ? uy : -uy);
      place(ch.b, ch.cb === first.name ? first : other, ch.cb === first.name ? ux : -ux, ch.cb === first.name ? uy : -uy);
    });
    /* Gates of one centre that land on top of each other are eased apart and
       kept inside the shape. */
    for (var it = 0; it < 30; it++) {
      centres.forEach(function (C) {
        var gs = Object.keys(pos).filter(function (g) { return pos[g].c === C.name; });
        for (var i = 0; i < gs.length; i++) for (var j = i + 1; j < gs.length; j++) {
          var a = pos[gs[i]], b = pos[gs[j]], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < 0.3) { var m = (0.3 - d) / 2 + 0.002, ux = d > 1e-6 ? dx / d : 1, uy = d > 1e-6 ? dy / d : 0; a.x -= ux * m; a.y -= uy * m; b.x += ux * m; b.y += uy * m; }
        }
        gs.forEach(function (g) { var p = pos[g], k = 0; while (!inPoly([p.x, p.y], C.poly) && k++ < 12) { p.x *= 0.9; p.y *= 0.9; } });
      });
    }
    return { pos: pos, dirs: dirs };
  }

  /* ---- The scene ----------------------------------------------------------- */
  function Scene(opts) {
    this.o = opts || {};
    this.host = null; this.model = null; this.view = '3d'; this.layer = 'both';
    this.ready = false; this.failed = false; this.building = false;
    this.running = false; this.visible = true; this.raf = 0; this.last = 0; this.lastDraw = 0;
    this.c = 0; this.cur = 0; this.time = 0; this.drift = 0;
    this.k = 0; this.kGoal = 0;
    this.ptr = { x: 0, y: 0, px: 0, py: 0, on: false, moved: false };
    this.down = null; this.pinch = null; this.hover = null; this.focusKey = null;
    this.sky = null; this.skyK = 0;
    this.rig = null; this.user = { yaw: 0, pitch: null, zoom: 1 };
    this.wakeKey = null; this.wakeAt = null; this.responded = false;
    this.level = 0; this.frames = []; this.labels = [];
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.dom();
  }
  var P = Scene.prototype;

  P.dom = function () {
    var self = this, r = document.createElement('div');
    r.setAttribute('data-hs-root', '1');
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
      if (this.host && this._onKey) { this.host.removeEventListener('keydown', this._onKey); this.host.removeEventListener('keyup', this._onKeyUp); }
      host.appendChild(this.el.root);
      var self = this;
      this._onKey = this._onKey || function (e) { self.onKey(e); };
      this._onKeyUp = this._onKeyUp || function (e) { if (self.flyOk()) self.flyKeyUp(e); };
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
    if (!this.ready) { this.build(); return; }
    if (!this.tokOk) this.setTheme();
    this.resize();
    if (moved) this.rig = null;
    this.updateRun();
    this.kick();
  };
  /* FLIGHT (flight.js, owner 19 October 2026: "omni directional motion, on
     every chart"). The move keys take off from wherever the camera is, a drag
     looks while flying, two fingers in Free look move, and Escape, 0 or Home
     land back on the rig. flight.js may arrive after this file, so its glue
     is installed on first use. */
  P.flyOk = function () { if (!P.flyer && root.Flight && root.Flight.mixin) root.Flight.mixin(P); return !!P.flyer; };
  P.isFlying = function () { return this.flyOk() && this.flying(); };
  P.nearest = function (p) {
    var best = null;
    (this.centres || []).forEach(function (C) {
      var d = Math.sqrt((p[0] - C.cx) * (p[0] - C.cx) + (p[1] - C.cy) * (p[1] - C.cy) + p[2] * p[2]) - 0.55;
      if (!best || d < best.d) best = { d: d, c: [C.cx, C.cy, 0], r: 0.55 };
    });
    return best;
  };
  P.detach = function () {
    if (this.host && this._onKey) { this.host.removeEventListener('keydown', this._onKey); this.host.removeEventListener('keyup', this._onKeyUp); }
    this.host = null;
    this.stop();
  };
  P.setModel = function (m) {
    if (!m) return;
    if (this.model && this.model.key === m.key) return;
    this.model = m;
    if (this.focusKey && !this.known(this.focusKey)) this.focusKey = null;
    if (this.ready) { this.buildContent(); this.kick(); }
  };
  P.setView = function (v) {
    v = v === 'wheel' ? 'wheel' : '3d';
    if (this.view === v && this.kGoal === (v === 'wheel' ? 1 : 0)) return;
    this.view = v;
    this.kGoal = v === 'wheel' ? 1 : 0;
    if (this.reduced || !this.ready) this.k = this.kGoal;
    this.user.pitch = null;
    this.lift(0.4);
    this.kick();
  };
  P.setLayer = function (l) {
    l = l === 'personality' || l === 'design' ? l : 'both';
    if (this.layer === l) return;
    this.layer = l;
    if (this.ready && this.content) this.derive();
    this.lift(0.3);
    this.kick();
  };
  /* The sky now: a list of { body, gate, line, lon } from the app's own
     hd-transit reading, or null. */
  P.setSky = function (list) {
    var key = list ? list.map(function (a) { return a.body + a.gate + '.' + a.line; }).join(',') : '';
    if ((this.skyKey || '') === key) return;
    this.skyKey = key;
    this.sky = list && list.length ? list : null;
    if (this.reduced) this.skyK = this.sky ? 1 : 0;
    if (this.ready && this.content) { this.buildSky(); this.derive(); }
    this.lift(0.25);
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
        self.updateRun();
        self.kick();
      }
      /* The display face may land after the first labels were drawn with the
         fallback, so the scene is not shown until it has: the reader sees
         Loading, then the finished picture, and never the labels jumping. */
      var faces = function () { if (self.fontsOk || self.failed) return; self.fontsOk = true; if (self.ready) { self.buildContent(); self.kick(); } };
      if (document.fonts && document.fonts.ready && document.fonts.status !== 'loaded') { document.fonts.ready.then(faces); setTimeout(faces, 3000); } else self.fontsOk = true;
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
    this.cam = new T.PerspectiveCamera(34, 1, 0.1, 400);
    this.scene.add(this.cam);
    this.U = { uCam: { value: new T.Vector3() }, uFog: { value: 0.02 }, uTime: { value: 0 }, uGlow: { value: 1 }, uBreath: { value: 0 },
      uPR: { value: 1 }, uRes: { value: new T.Vector2(1, 1) } };

    this.skyMat = new T.ShaderMaterial({ vertexShader: V_SKY, fragmentShader: F_SKY, side: T.BackSide, depthWrite: false,
      uniforms: { uBg: { value: new T.Vector3() }, uA: { value: new T.Vector3() }, uB: { value: new T.Vector3() }, uC3: { value: new T.Vector3() }, uAtmo: { value: 0.6 }, uTime: this.U.uTime } });
    this.skyDome = new T.Mesh(new T.SphereGeometry(150, 32, 16), this.skyMat);
    this.skyDome.renderOrder = -10;
    this.scene.add(this.skyDome);

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

    this.floorMat = new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_FLOOR, transparent: true, depthWrite: false,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uBreath: this.U.uBreath, uBg: { value: new T.Vector3() }, uLine: { value: new T.Vector3() },
        uAtm: { value: new T.Vector3() }, uAtm2: { value: new T.Vector3() }, uPtr: { value: new T.Vector2() }, uPtrOn: { value: 0 }, uWake: { value: 0 } } });
    var floor = new T.Mesh(new T.CircleGeometry(15.5, 128), this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.renderOrder = -5;
    this.scene.add(floor);

    /* The wheel's cells: one texel per gate, in wheel order. */
    this.cellData = new Uint8Array(64 * 4);
    this.cellTex = new T.DataTexture(this.cellData, 64, 1, T.RGBAFormat);
    this.cellTex.magFilter = T.NearestFilter; this.cellTex.minFilter = T.NearestFilter; this.cellTex.needsUpdate = true;
    this.ringMat = new T.ShaderMaterial({ vertexShader: V_UV, fragmentShader: F_RING, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uLine: { value: new T.Vector3() }, uP: { value: new T.Vector3() }, uD: { value: new T.Vector3() },
        uSky: { value: new T.Vector3() }, uSel: { value: new T.Vector3() }, uAc2: { value: new T.Vector3() }, uCells: { value: this.cellTex }, uK: { value: 0 },
        uStart: { value: 302 }, uIn: { value: RING_IN }, uOut: { value: RING_OUT } } });
    var ring = new T.Mesh(new T.RingGeometry(RING_IN - 0.1, RING_OUT + 0.1, 256, 1), this.ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = RING_Y;
    ring.renderOrder = -4;
    this.ring = ring;
    this.scene.add(ring);

    var dn = phone ? 260 : 480, dp = new Float32Array(dn * 3), dr = new Float32Array(dn);
    for (var j = 0; j < dn; j++) { var a = Math.random() * Math.PI * 2, rr = 1.5 + Math.sqrt(Math.random()) * 11; dp[j * 3] = Math.cos(a) * rr; dp[j * 3 + 1] = Math.random() * 13.5; dp[j * 3 + 2] = Math.sin(a) * rr; dr[j] = Math.random(); }
    var dg = new T.BufferGeometry();
    dg.setAttribute('position', new T.BufferAttribute(dp, 3));
    dg.setAttribute('aR', new T.BufferAttribute(dr, 1));
    this.dustMat = new T.ShaderMaterial({ vertexShader: V_DUST, fragmentShader: F_DUST, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uDrift: { value: 0 }, uTime: this.U.uTime, uPR: this.U.uPR, uC1: { value: new T.Vector3() }, uC2: { value: new T.Vector3() }, uAlpha: { value: 0.5 } } });
    this.dust = new T.Points(dg, this.dustMat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);

    this.orbGeo = new T.SphereGeometry(1, 32, 20);
    var rib = new T.BufferGeometry(), N = 40, au = new Float32Array((N + 1) * 2), as = new Float32Array((N + 1) * 2), idx = [];
    for (var q = 0; q <= N; q++) { au[q * 2] = au[q * 2 + 1] = q / N; as[q * 2] = -1; as[q * 2 + 1] = 1; if (q < N) { var b0 = q * 2; idx.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2); } }
    rib.setAttribute('position', new T.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3));
    rib.setAttribute('aU', new T.BufferAttribute(au, 1));
    rib.setAttribute('aSide', new T.BufferAttribute(as, 1));
    rib.setIndex(idx);
    rib.boundingSphere = new T.Sphere(new T.Vector3(0, 6, 0), 30);
    this.ribGeo = rib;
    this.world = new T.Group(); this.scene.add(this.world);
    this.content = null; this.skyG = null;
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
    var fu = this.floorMat.uniforms, lift = [t.bg[0] + (t.atm[0] - t.bg[0]) * 0.07, t.bg[1] + (t.atm[1] - t.bg[1]) * 0.07, t.bg[2] + (t.atm[2] - t.bg[2]) * 0.07];
    fu.uBg.value.set(lift[0], lift[1], lift[2]); fu.uLine.value.set(t.tx[0], t.tx[1], t.tx[2]); fu.uAtm.value.set(t.atm[0], t.atm[1], t.atm[2]); fu.uAtm2.value.set(t.atm2[0], t.atm2[1], t.atm2[2]);
    var ru = this.ringMat.uniforms;
    ru.uLine.value.set(t.tx[0], t.tx[1], t.tx[2]); ru.uP.value.set(t.tx[0], t.tx[1], t.tx[2]); ru.uD.value.set(t.des[0], t.des[1], t.des[2]);
    ru.uSky.value.set(t.blue[0], t.blue[1], t.blue[2]); ru.uSel.value.set(t.ac[0], t.ac[1], t.ac[2]); ru.uAc2.value.set(t.ac2[0], t.ac2[1], t.ac2[2]);
    var dm = this.dustMat.uniforms; dm.uC1.value.set(t.tx[0], t.tx[1], t.tx[2]); dm.uC2.value.set(t.atm2[0], t.atm2[1], t.atm2[2]);
    var c = this.starCol;
    for (var i = 0; i < c.length / 3; i++) { var k = (i * 0.61803) % 1, a = k < 0.7 ? t.tx : k < 0.88 ? t.atm2 : t.hi; c[i * 3] = a[0] * 0.8; c[i * 3 + 1] = a[1] * 0.8; c[i * 3 + 2] = a[2] * 0.8; }
    this.stars.geometry.attributes.aCol.needsUpdate = true;
  };

  /* ---- Labels, drawn once to a canvas and held at a pixel size ------------- */
  P.sprite = function (c, px, aspect, o) {
    var tex = new T.CanvasTexture(c); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
    var mat = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, sizeAttenuation: false, opacity: 1 });
    var s = new T.Sprite(mat);
    s.center.set(o && o.anchorX != null ? o.anchorX : 0.5, o && o.anchorY != null ? o.anchorY : 0.5);
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
    if (o.shadow !== false) { g.shadowColor = this.tok.cBg; g.shadowBlur = px * k * 0.6; }
    g.fillStyle = o.color || this.tok.cTx;
    g.fillText(text, w / 2, h / 2);
    g.shadowBlur = 0;
    g.fillText(text, w / 2, h / 2);
    return this.sprite(c, px * 1.7, w / h, o);
  };
  /* An activation: the astral body's glyph in a roundel ringed in its side's
     colour, set on its optical centre, with gate.line beside it. */
  P.activation = function (glyph, label, color, D, focus) {
    var k = 3, c = document.createElement('canvas'), g = c.getContext('2d');
    var fpx = Math.round(D * 0.5);
    g.font = '700 ' + fpx * k + 'px ' + this.tok.fu;
    var tw = g.measureText(label).width / k;
    var W = Math.ceil((D + 8 + tw + 8) * k), H = Math.ceil((D + 8) * k);
    c.width = W; c.height = H;
    var cx = (D / 2 + 4) * k, cy = H / 2, R = D / 2 * k;
    g.beginPath(); g.arc(cx, cy, R - k, 0, Math.PI * 2);
    g.fillStyle = this.tok.cBg; g.globalAlpha = 0.86; g.fill(); g.globalAlpha = 1;
    g.lineWidth = (focus ? 2.4 : 1.4) * k; g.strokeStyle = color; g.stroke();
    if (focus) { g.beginPath(); g.arc(cx, cy, R + 2.4 * k, 0, Math.PI * 2); g.lineWidth = 1 * k; g.globalAlpha = 0.55; g.stroke(); g.globalAlpha = 1; }
    var gs = Math.round(D * 0.6 * k);
    g.font = '400 ' + gs + 'px ' + GLYPH_FONT;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    var text = String(glyph); if (text.length === 1) text += '︎';
    var m = g.measureText(text), asc = m.actualBoundingBoxAscent, dsc = m.actualBoundingBoxDescent;
    var ox = (isFinite(m.actualBoundingBoxLeft) && isFinite(m.actualBoundingBoxRight)) ? (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2 : 0;
    var oy = (isFinite(asc) && isFinite(dsc) && asc + dsc > 0) ? (asc - dsc) / 2 : gs * 0.35;
    g.fillStyle = color; g.fillText(text, cx + ox, cy + oy);
    g.font = '700 ' + fpx * k + 'px ' + this.tok.fu; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = this.tok.cBg; g.shadowBlur = fpx * k * 0.6; g.fillStyle = this.tok.cTx;
    g.fillText(label, (D + 10) * k, cy); g.shadowBlur = 0; g.fillText(label, (D + 10) * k, cy);
    var spr = this.sprite(c, H / k, W / H, { anchorX: (D / 2 + 4) * k / W, anchorY: 0.5, order: 7 });
    return spr;
  };

  /* ---- Building the wiring from the model ----------------------------------- */
  P.known = function (key) {
    var m = this.model; if (!m || !key) return false;
    var p = key.split(':');
    if (p[0] === 'c') return m.centres.some(function (c) { return c.name === p[1]; });
    if (p[0] === 'g') return !!this.gateInfo(+p[1]);
    if (p[0] === 'ch') return m.channels.some(function (c) { return c.key === p[1]; });
    if (p[0] === 'a') return m.acts.some(function (a) { return a.key === key.slice(2); });
    return false;
  };
  P.gateInfo = function (n) { return this.gates && this.gates[n]; };
  P.colorOf = function (css) {
    if (!this._pr || !this._pr.isConnected) { if (!this.el.root.isConnected) return { v: this.tok.ac, c: 'rgb(47,255,143)' }; this._pr = probe(this.el.root); }
    var c = cssColor(this._pr, css, 'rgb(47,255,143)');
    return { v: toVec(c), c: c };
  };
  P.dispose = function (obj) {
    var labels = this.labels;
    obj.traverse(function (o) {
      if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      if (o.isSprite) { var i = labels.indexOf(o); if (i !== -1) labels.splice(i, 1); }
    });
  };
  P.ribMat = function (c, i, w) {
    return new T.ShaderMaterial({ vertexShader: V_RIB, fragmentShader: F_RIB, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uRes: this.U.uRes, uTime: this.U.uTime, uA: { value: new T.Vector3() }, uB: { value: new T.Vector3() },
        uBow: { value: new T.Vector3() }, uU0: { value: 0 }, uU1: { value: 1 }, uW: { value: w }, uC: { value: v3(c) }, uC2: { value: v3(c) }, uBraid: { value: 0 },
        uI: { value: i }, uDash: { value: 0 }, uLen: { value: 4 }, uFlow: { value: 0 }, uDir: { value: 1 }, uEnds: { value: 1 } } });
  };
  P.ribbon = function (c, i, w) {
    var m = new T.Mesh(this.ribGeo, this.ribMat(c, i, w)); m.userData.sharedGeo = true; m.frustumCulled = false; return m;
  };
  P.orbMat = function (c, core) {
    return new T.ShaderMaterial({ vertexShader: V_ORB, fragmentShader: F_ORB, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uCam: this.U.uCam, uFog: this.U.uFog, uGlow: this.U.uGlow, uC: { value: v3(c) }, uCore: { value: v3(core || c) }, uHover: { value: 0 }, uOp: { value: 1 } } });
  };

  P.buildContent = function () {
    if (!this.model || !this.r) return;
    if (this.content) { this.world.remove(this.content); this.dispose(this.content); }
    var m = this.model, tk = this.tok, g = new T.Group(), self = this, ui = this.ui || 1;
    this.builtUi = ui;
    this.content = g; this.centres = []; this.channels = []; this.acts = []; this.gates = {}; this.colHeads = []; this.ringLabs = [];
    this.world.add(g);
    if (this.wakeKey !== m.key) { this.wakeKey = m.key; this.wakeAt = null; this.responded = false; this.wakeT0 = now(); }

    /* The centres. */
    var cByName = {};
    m.centres.forEach(function (c) {
      var b = c.box, w = b[2] / S, h = b[3] / S, cx = (b[0] + b[2] / 2 - MIDX) / S, cy = (BASE - (b[1] + b[3] / 2)) / S;
      var poly = outline(c.name, w, h);
      var sh = new T.Shape(); poly.forEach(function (p, i) { if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); }); sh.closePath();
      var geo = new T.ExtrudeGeometry(sh, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: 4 });
      geo.translate(0, 0, -DEPTH / 2);
      geo.computeVertexNormals();
      var col = self.colorOf(c.c);
      var mat = new T.ShaderMaterial({ vertexShader: V_CEN, fragmentShader: F_CEN, transparent: !c.defined, depthWrite: !!c.defined, side: c.defined ? T.FrontSide : T.DoubleSide,
        uniforms: { uCam: self.U.uCam, uFog: self.U.uFog, uTime: self.U.uTime, uC: { value: v3(col.v) }, uRim: { value: v3(tk.tx) }, uCond: { value: v3(tk.tx) }, uBg: { value: v3(tk.bg) },
          uDef: { value: c.defined ? 1 : 0 }, uLit: { value: 1 }, uCondK: { value: 0.1 }, uHover: { value: 0 }, uPulse: { value: 0 }, uDim: { value: 1 } } });
      var mesh = new T.Mesh(geo, mat);
      mesh.position.set(cx, cy, 0);
      mesh.renderOrder = c.defined ? 1 : 3;
      g.add(mesh);
      var edgeG = new T.EdgesGeometry(geo, 30);
      var edge = new T.LineSegments(edgeG, new T.LineBasicMaterial({ color: new T.Color(c.defined ? col.v[0] : tk.tx[0], c.defined ? col.v[1] : tk.tx[1], c.defined ? col.v[2] : tk.tx[2]), transparent: true, opacity: c.defined ? 0.85 : 0.4, depthWrite: false, blending: T.AdditiveBlending }));
      edge.position.copy(mesh.position);
      g.add(edge);
      var lab = self.text(c.short, { px: Math.max(7.5, 8.6 * ui), weight: 700, caps: true, ls: 0.12, color: c.defined ? tk.cBg : tk.cMut, shadow: !c.defined });
      lab.position.set(cx, cy + (c.name === 'Head' ? -h * 0.18 : c.name === 'Ajna' ? h * 0.18 : 0), FACE + 0.08);
      g.add(lab);
      var o = { c: c, mesh: mesh, edge: edge, lab: lab, cx: cx, cy: cy, w: w, h: h, poly: poly, col: col, lit: 0, hover: 0, cond: [tk.tx[0], tk.tx[1], tk.tx[2]], ph: Math.random() * 6.28 };
      cByName[c.name] = o;
      self.centres.push(o);
    });
    this.cByName = cByName;

    /* The gates, on the edges that face their channels. */
    var lay = layoutGates(this.centres.map(function (o) { return { name: o.c.name, cx: o.cx, cy: o.cy, poly: o.poly }; }), m.channels);
    Object.keys(lay.pos).forEach(function (gk) {
      var n = +gk, p = lay.pos[gk], C = cByName[p.c], d = lay.dirs[gk];
      if (!C) return;
      var at = new T.Vector3(C.cx + p.x, C.cy + p.y, FACE + 0.03);
      var orb = new T.Mesh(self.orbGeo, self.orbMat(tk.tx)); orb.userData.sharedGeo = true;
      orb.position.copy(at); orb.scale.setScalar(0.07);
      orb.renderOrder = 5;
      g.add(orb);
      var lab = self.text(String(n), { px: Math.max(7.5, 8.4 * ui), weight: 700, color: tk.cTx });
      /* the number sits just inside the edge and the gate's light on it */
      lab.position.set(at.x - d[0] * 0.04, at.y - d[1] * 0.04, FACE + 0.1);
      orb.position.set(at.x + d[0] * 0.17, at.y + d[1] * 0.17, FACE + 0.03);
      g.add(lab);
      self.gates[n] = { n: n, centre: p.c, at: at, node: orb.position.clone(), orb: orb, lab: lab, per: 0, des: 0, sky: 0, hover: 0, lit: 0 };
    });

    /* The channels, two halves each. Where the straight path would cross a
       third centre, the channel bows toward the reader to pass in front of it. */
    m.channels.forEach(function (ch) {
      var A = self.gates[ch.a], B = self.gates[ch.b];
      if (!A || !B) return;
      var pa = A.node, pb = B.node, bow = new T.Vector3();
      for (var s2 = 1; s2 < 10; s2++) {
        var t2 = s2 / 10, x = mix(pa.x, pb.x, t2), y = mix(pa.y, pb.y, t2);
        var hit = self.centres.some(function (C) { return C.c.name !== ch.ca && C.c.name !== ch.cb && inPoly([x - C.cx, y - C.cy], C.poly); });
        if (hit) { bow.set(0, 0, 0.75); break; }
      }
      var len = pa.distanceTo(pb);
      var mk = function (u0, u1) {
        var r = self.ribbon(tk.tx, 0.12, Math.max(2.2, 3.0 * ui));
        var u = r.material.uniforms; u.uA.value.copy(pa); u.uB.value.copy(pb); u.uBow.value.copy(bow); u.uU0.value = u0; u.uU1.value = u1; u.uLen.value = len / 2;
        r.position.z = 0;
        g.add(r);
        return r;
      };
      var ca = cByName[ch.ca], cb = cByName[ch.cb];
      /* the flow rises: from the lower centre to the higher */
      var up = ca && cb ? (ca.cy <= cb.cy ? 1 : -1) : 1;
      self.channels.push({ ch: ch, A: A, B: B, hA: mk(0, 0.5), hB: mk(1, 0.5), bow: bow, len: len, up: up, hover: 0, def: 0, flowK: 0 });
    });

    /* The activations, in the order a printed chart lists them. */
    var colR = { design: tk.des, personality: tk.tx }, colC = { design: tk.cDes, personality: tk.cTx };
    var D = Math.round(19 * ui);
    var rows = { design: 0, personality: 0 };
    var acts = m.acts.slice().sort(function (a, b) { return ORDER.indexOf(a.body) - ORDER.indexOf(b.body); });
    acts.forEach(function (a, idx) {
      var side = a.kind === 'design' ? -1 : 1, row = rows[a.kind]++;
      var col3 = new T.Vector3(side * COL_X, COL_TOP - row * COL_STEP, 0.2);
      var th = (180 + a.lon) * RAD, R = ACT_R[a.kind];
      var ringP = new T.Vector3(Math.cos(th) * R, RING_Y + 0.12 + (a.kind === 'personality' ? 0.18 : 0), -Math.sin(th) * R);
      var spr = self.activation(a.glyph, a.gate + '.' + a.line, colC[a.kind], D, false);
      g.add(spr);
      var orb = new T.Mesh(self.orbGeo, self.orbMat(colR[a.kind])); orb.userData.sharedGeo = true; orb.scale.setScalar(0.09);
      g.add(orb);
      var thread = self.ribbon(colR[a.kind], 0, Math.max(1.4, 1.8 * ui));
      thread.material.uniforms.uEnds.value = 0.4;
      g.add(thread);
      self.acts.push({ a: a, spr: spr, sprF: null, orb: orb, thread: thread, col3: col3, ringP: ringP, idx: idx, pos: new T.Vector3(), hover: 0, vis: 1, D: D, colC: colC[a.kind], th: 0 });
    });
    var hd = this.text('Design', { px: Math.max(8, 9 * ui), weight: 700, caps: true, ls: 0.16, color: tk.cDes });
    hd.position.set(-COL_X + 0.5, COL_TOP + 0.75, 0.2); g.add(hd);
    var hp = this.text('Personality', { px: Math.max(8, 9 * ui), weight: 700, caps: true, ls: 0.16, color: tk.cTx });
    hp.position.set(COL_X + 0.5, COL_TOP + 0.75, 0.2); g.add(hp);
    this.colHeads = [hd, hp];

    /* The wheel's numbers, in gate order from 41. */
    var W = m.wheel || [];
    W.forEach(function (n, i) {
      var lon = (302 + (i + 0.5) * 5.625) % 360, th = (180 + lon) * RAD;
      var l = self.text(String(n), { px: Math.max(7, 7.8 * ui), weight: 700, color: tk.cMut });
      l.position.set(Math.cos(th) * RING_LAB, RING_Y + 0.02, -Math.sin(th) * RING_LAB);
      l.userData.gate = n;
      g.add(l);
      self.ringLabs.push(l);
    });

    /* The owner, under the body. */
    if (m.owner) {
      var ow = this.text(m.owner, { px: Math.max(11, 14 * ui), font: tk.fd, color: tk.cTx });
      ow.position.set(0, 0.05, 1.6);
      g.add(ow);
      this.ownerLab = ow;
    } else this.ownerLab = null;
    if (m.sub) {
      var sb = this.text(m.sub, { px: Math.max(8, 9 * ui), weight: 600, caps: true, ls: 0.12, color: tk.cMut, anchorY: 1 });
      sb.position.set(0, -0.35, 1.6);
      g.add(sb);
      this.subLab = sb;
    } else this.subLab = null;

    this.planWake();
    this.buildSky();
    this.derive();
    this.place();
  };

  /* Which gates are lit in the layer shown, and what that makes of each half
     channel. Centres keep the chart's own definition in every layer, as the 2D
     wiring does. */
  P.derive = function () {
    var self = this, L = this.layer, tk = this.tok;
    Object.keys(this.gates).forEach(function (k) { var G = self.gates[k]; G.per = 0; G.des = 0; G.sky = 0; });
    this.model.acts.forEach(function (a) {
      var G = self.gates[a.gate]; if (!G) return;
      if (a.kind === 'personality' && L !== 'design') G.per = 1;
      if (a.kind === 'design' && L !== 'personality') G.des = 1;
    });
    (this.sky || []).forEach(function (a) { var G = self.gates[a.gate]; if (G) G.sky = 1; });
    var tone = function (G) {
      if (G.per && G.des) return { c: tk.tx, c2: tk.des, braid: 1, on: 1, sky: 0 };
      if (G.per) return { c: tk.tx, c2: tk.tx, braid: 0, on: 1, sky: 0 };
      if (G.des) return { c: tk.des, c2: tk.des, braid: 0, on: 1, sky: 0 };
      if (G.sky) return { c: tk.blue, c2: tk.blue, braid: 0, on: 0.85, sky: 1 };
      return { c: tk.tx, c2: tk.tx, braid: 0, on: 0, sky: 0 };
    };
    this.channels.forEach(function (x) {
      var a = tone(x.A), b = tone(x.B);
      [[x.hA, a], [x.hB, b]].forEach(function (p) {
        var u = p[0].material.uniforms;
        u.uC.value.set(p[1].c[0], p[1].c[1], p[1].c[2]); u.uC2.value.set(p[1].c2[0], p[1].c2[1], p[1].c2[2]);
        u.uBraid.value = p[1].braid; u.uDash.value = p[1].sky; p[0].userData.on = p[1].on; p[0].userData.sky = p[1].sky;
      });
      x.natal = a.on && !a.sky && b.on && !b.sky ? 1 : 0;
      x.skyDef = !x.natal && a.on && b.on ? 1 : 0;
    });
    /* the wheel's cells */
    var W = this.model.wheel || [], cd = this.cellData;
    W.forEach(function (n, i) {
      var G = self.gates[n] || {}, f = self.focusGate();
      cd[i * 4] = G.per ? 255 : 0; cd[i * 4 + 1] = G.des ? 255 : 0; cd[i * 4 + 2] = G.sky ? 255 : 0; cd[i * 4 + 3] = f === n ? 255 : 0;
    });
    this.cellTex.needsUpdate = true;
    this._cellFocus = this.focusGate();
    /* an open centre takes on the light of the defined centres its channels
       reach, through any gate of its own or theirs */
    this.centres.forEach(function (C) {
      if (C.c.defined) return;
      var acc = [0, 0, 0], n = 0;
      self.channels.forEach(function (x) {
        var other = x.ch.ca === C.c.name ? x.ch.cb : x.ch.cb === C.c.name ? x.ch.ca : null;
        if (!other) return;
        var O = self.cByName[other];
        if (!O || !O.c.defined) return;
        var w = (x.A.per || x.A.des || x.B.per || x.B.des) ? 2 : 1;
        acc[0] += O.col.v[0] * w; acc[1] += O.col.v[1] * w; acc[2] += O.col.v[2] * w; n += w;
      });
      C.cond = n ? [acc[0] / n, acc[1] / n, acc[2] / n] : [tk.tx[0], tk.tx[1], tk.tx[2]];
      C.mesh.material.uniforms.uCond.value.set(C.cond[0], C.cond[1], C.cond[2]);
    });
    this.acts.forEach(function (o) { o.visGoal = L === 'both' || L === o.a.kind ? 1 : 0; });
  };
  P.focusGate = function () {
    var f = this.focusKey || (this.hover && this.hover.key);
    if (!f) return null;
    if (f.indexOf('g:') === 0) return +f.slice(2);
    if (f.indexOf('a:') === 0) { var a = this.actBy(f.slice(2)); return a ? a.gate : null; }
    return null;
  };
  P.actBy = function (k) { return this.model.acts.filter(function (a) { return a.key === k; })[0]; };

  /* The sky now, as ghosts on the wheel. Its gates light their half channels
     in a third tone, dashed, through derive(). */
  P.buildSky = function () {
    if (!this.content) return;
    if (this.skyG) { this.content.remove(this.skyG); this.dispose(this.skyG); this.skyG = null; }
    this.ghosts = [];
    if (!this.sky) return;
    var g = new T.Group(), self = this, tk = this.tok, ui = this.ui || 1;
    this.sky.forEach(function (a) {
      var th = (180 + a.lon) * RAD, p = new T.Vector3(Math.cos(th) * SKY_R, RING_Y + 0.05, -Math.sin(th) * SKY_R);
      var gh = new T.Mesh(self.orbGeo, self.orbMat(tk.blue)); gh.userData.sharedGeo = true; gh.scale.setScalar(0.11); gh.position.copy(p);
      g.add(gh);
      var lab = self.text(a.glyph || '', { px: Math.max(9, 11 * ui), font: GLYPH_FONT, color: tk.cBlue });
      lab.position.set(p.x, p.y + 0.38, p.z);
      g.add(lab);
      self.ghosts.push({ a: a, gh: gh, lab: lab });
    });
    this.skyG = g;
    this.content.add(g);
  };

  /* ---- How the body wakes, by type ------------------------------------------ */
  P.planWake = function () {
    var m = this.model, self = this, C = this.cByName, adj = {};
    m.channels.forEach(function (ch) {
      if (!ch.defined) return;
      (adj[ch.ca] = adj[ch.ca] || []).push(ch.cb); (adj[ch.cb] = adj[ch.cb] || []).push(ch.ca);
    });
    var bfs = function (from) {
      var d = {}, q = [];
      from.forEach(function (f) { d[f] = 0; q.push(f); });
      while (q.length) { var cur = q.shift(); (adj[cur] || []).forEach(function (n) { if (d[n] == null) { d[n] = d[cur] + 1; q.push(n); } }); }
      return d;
    };
    var type = m.type || '', origin = [], hop = 0.3, wait = false;
    var defined = m.centres.filter(function (c) { return c.defined; }).map(function (c) { return c.name; });
    if (/^Manifestor/.test(type)) {
      var reach = bfs(['Throat']);
      origin = ['Heart', 'Solar Plexus', 'Root', 'Sacral'].filter(function (n) { return reach[n] != null; }).slice(0, 1);
      if (!origin.length) origin = ['Throat'];
      hop = 0.2;
    } else if (/^Manifesting Generator/.test(type)) { origin = ['Sacral']; hop = 0.14; wait = true; }
    else if (/^Generator/.test(type)) { origin = ['Sacral']; hop = 0.34; wait = true; }
    else if (/^Projector/.test(type)) { origin = defined.indexOf('G') !== -1 ? ['G'] : defined.slice(0, 1); hop = 0.32; }
    else { origin = []; hop = 0; }
    var dist = origin.length ? bfs(origin) : {}, maxD = 0;
    Object.keys(dist).forEach(function (k) { if (dist[k] > maxD) maxD = dist[k]; });
    var proj = /^Projector/.test(type);
    this.centres.forEach(function (o) {
      var d = dist[o.c.name];
      if (!origin.length) o.delay = 0.2;
      else if (proj) o.delay = o.c.defined ? 0.7 + (d != null ? d : maxD + 1) * hop : 0.1;
      else o.delay = d != null ? d * hop : (maxD + 1) * hop + 0.25;
    });
    this.wakeWait = wait && !this.reduced;
    this.wakeOrigin = origin;
    this.wakeSpan = this.centres.reduce(function (a, o) { return Math.max(a, o.delay); }, 0) + 0.9;
    /* the wake begins when the reader can see it, at the reveal in render() */
    if (!this.wakeWait && this.wakeAt == null && this.shown) this.wakeAt = now();
    if (this.reduced) this.wakeAt = -1e6;
  };
  /* Anything the reader does counts as the response a Generator waits for. */
  P.respond = function () {
    if (this.responded) return;
    this.responded = true;
    if (this.wakeAt == null) { this.wakeAt = now(); this.lift(0.6); }
  };

  /* ---- Placing everything for the current morph ---------------------------- */
  P.place = function () {
    if (!this.content || !this.model) return;
    var e = ease(clamp(this.k, 0, 1)), w1 = 1 - e, self = this;
    this.ringMat.uniforms.uK.value = e;
    this.ring.visible = e > 0.01;
    this.ringLabs.forEach(function (l) { l.visible = e > 0.02; });
    this.colHeads.forEach(function (l) { l.material.opacity = w1; l.visible = w1 > 0.02; });
    this.acts.forEach(function (o) {
      /* each activation leaves its column on its own beat, so they peel away
         rather than moving as a block */
      var stag = clamp((self.k - o.idx * 0.012) / (1 - 0.3), 0, 1), ee = ease(stag);
      var p = o.pos.copy(o.col3).lerp(o.ringP, ee);
      if (ee > 0 && ee < 1) p.y += Math.sin(ee * Math.PI) * 1.4;
      o.spr.position.copy(p);
      if (o.sprF) o.sprF.position.copy(p);
      o.orb.position.copy(p);
      var G = self.gates[o.a.gate];
      var u = o.thread.material.uniforms;
      u.uA.value.copy(p); if (G) u.uB.value.copy(G.node);
      var len = G ? p.distanceTo(G.node) : 1; u.uLen.value = len; u.uBow.value.set(0, mix(0, 0.6, e), 0);
    });
    if (this.ownerLab) { this.ownerLab.material.opacity = w1; this.ownerLab.visible = w1 > 0.02; }
    if (this.subLab) { this.subLab.material.opacity = w1; this.subLab.visible = w1 > 0.02; }
  };

  /* ---- The camera ---------------------------------------------------------- */
  P.defaultPitch = function () { return this.kGoal > 0.5 ? 0.56 : 0.1; };
  P.fit = function () {
    var e = ease(clamp(this.k, 0, 1)), pitch = this.rig ? this.rig.pitch : this.defaultPitch();
    var tv = Math.tan(this.cam.fov * Math.PI / 360);
    /* standing: the columns either side and room above them for the stage's
       own controls; on the wheel: the ring of activations, and the body above
       the ring's far side, whichever reaches higher on the screen */
    var reach = this.sky ? SKY_R + 0.5 : ACT_R.personality + 1.1;
    var hw = mix(COL_X + 1.9, reach, e);
    var hh = mix(8.25, Math.max(6.4 * Math.cos(pitch), reach * Math.sin(pitch)) + 1.3, e);
    return Math.max(hw / (tv * this.cam.aspect), hh / tv) * 1.04;
  };
  P.targetOf = function (key) {
    if (!key) return null;
    var p = key.split(':');
    if (p[0] === 'c' && this.cByName && this.cByName[p[1]]) { var C = this.cByName[p[1]]; return new T.Vector3(C.cx, C.cy, 0); }
    if (p[0] === 'g' && this.gates[+p[1]]) return this.gates[+p[1]].node.clone();
    if (p[0] === 'ch') { var x = this.channels.filter(function (c) { return c.ch.key === p[1]; })[0]; if (x) return x.A.node.clone().lerp(x.B.node, 0.5); }
    if (p[0] === 'a') { var o = this.acts.filter(function (q) { return q.a.key === key.slice(2); })[0]; if (o) return o.pos.clone(); }
    return null;
  };
  P.turnTo = function (key) {
    if (this.kGoal > 0.5 && key.indexOf('a:') === 0) {
      var a = this.actBy(key.slice(2));
      if (a) { var th = (180 + a.lon) * RAD, want = Math.atan2(Math.cos(th), -Math.sin(th)); this.user.yaw = this.user.yaw + wrapPi(want - this.user.yaw); }
    }
    this.lift(0.3);
  };
  P.goals = function () {
    var c = this.cur, drift = this.reduced ? 0 : Math.sin(this.time * 0.05) * 0.05;
    var pitch = this.user.pitch != null ? this.user.pitch : this.defaultPitch();
    var mouse = this.ptr.on && this.ptrType === 'mouse' && !this.down;
    /* a named thing draws the eye toward it, gently, in the standing view */
    var tgt = this.kGoal < 0.5 ? this.targetOf(this.focusKey) : null, e = ease(clamp(this.k, 0, 1));
    var ty = tgt ? mix(5.75, tgt.y, 0.35) : 5.75, tx = tgt ? tgt.x * 0.3 : 0;
    return {
      yaw: this.user.yaw + drift + (mouse ? this.ptr.x * 0.12 : 0),
      pitch: clamp(pitch - 0.03 * c + (mouse ? this.ptr.y * 0.05 : 0), -0.25, 1.35),
      dist: this.fit() / this.user.zoom * (1 - 0.04 * c) * (tgt ? 0.9 : 1),
      ty: mix(ty, RING_Y, e), tx: tx * (1 - e)
    };
  };
  P.placeCamera = function (k) {
    if (this.isFlying() && this.flyPose(this._dt)) {
      this.U.uCam.value.copy(this.cam.position);
      this.U.uFog.value = 1 / (this.cam.position.length() * 3.2 + 30);
      this.skyDome.position.copy(this.cam.position);
      this.stars.position.copy(this.cam.position);
      this._settled = true;
      return;
    }
    var g = this.goals();
    /* The scene opens where it rests: no fly-in, so nothing moves on arrival but
       the fade and the body's own wake (owner, 19 October 2026). */
    if (!this.rig) this.rig = { yaw: g.yaw, pitch: g.pitch, dist: g.dist, ty: g.ty, tx: g.tx };
    var r = this.rig;
    r.yaw = damp(r.yaw, g.yaw, k); r.pitch = damp(r.pitch, g.pitch, k); r.dist = damp(r.dist, g.dist, k); r.ty = damp(r.ty, g.ty, k); r.tx = damp(r.tx, g.tx, k);
    var cp = Math.cos(r.pitch);
    this.cam.position.set(r.tx + Math.sin(r.yaw) * cp * r.dist, r.ty + Math.sin(r.pitch) * r.dist, Math.cos(r.yaw) * cp * r.dist);
    this.cam.lookAt(r.tx, r.ty, 0);
    this.cam.updateMatrixWorld();
    if (this.flyOk() && this.flyBlend(this._dt)) this._blending = !!this.ret;
    this.U.uCam.value.copy(this.cam.position);
    this.U.uFog.value = 1 / (r.dist * 3.2 + 30);
    this.skyDome.position.copy(this.cam.position);
    this.stars.position.copy(this.cam.position);
    this._settled = Math.abs(r.yaw - g.yaw) < 0.0005 && Math.abs(r.pitch - g.pitch) < 0.0005 && Math.abs(r.dist - g.dist) < 0.005 && Math.abs(r.ty - g.ty) < 0.002;
  };

  /* ---- Public moves --------------------------------------------------------- */
  P.zoom = function (dir) {
    if (dir === 0 && this.isFlying()) this.flyRelease();
    if (dir === 0) { this.user.zoom = 1; this.user.yaw = 0; this.user.pitch = null; }
    else this.user.zoom = clamp(this.user.zoom * (dir < 0 ? 1.25 : 0.8), 0.6, 3.4);
    this.respond();
    this.lift(0.15);
    this.kick();
  };
  P.step = function (dir) {
    var list = (this.model && this.model.steps) || [];
    if (!list.length) return null;
    var i = list.indexOf(this.focusKey);
    var n = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
    return list[n];
  };

  /* ---- Picking, on the screen ------------------------------------------------ */
  P.screen = function (v) {
    var p = v.clone().project(this.cam);
    return { x: (p.x + 1) / 2 * this.W, y: (1 - p.y) / 2 * this.H, z: p.z };
  };
  P.pickAt = function (px, py) {
    if (!this.cam || !this.content) return null;
    var self = this, best = null, bd = 1e9;
    this.acts.forEach(function (o) {
      if (o.vis < 0.5) return;
      var s = self.screen(o.pos), d = Math.hypot(s.x - px, s.y - py);
      if (d < Math.max(14, o.D * 0.7) && d < bd && s.z < 1) { bd = d; best = { kind: 'act', key: 'a:' + o.a.key }; }
    });
    if (best) return best;
    Object.keys(this.gates).forEach(function (k) {
      var G = self.gates[k], s = self.screen(G.node), d = Math.hypot(s.x - px, s.y - py);
      if (d < 11 && d < bd && s.z < 1) { bd = d; best = { kind: 'gate', key: 'g:' + G.n }; }
    });
    if (best) return best;
    var ab = null, ad = 6;
    this.channels.forEach(function (x) {
      var u = x.hA.material.uniforms, prev = null;
      for (var i = 0; i <= 12; i++) {
        var t = i / 12, p = u.uA.value.clone().lerp(u.uB.value, t).addScaledVector(u.uBow.value, 4 * t * (1 - t));
        var s = self.screen(p);
        if (prev) {
          var vx = s.x - prev.x, vy = s.y - prev.y, L = vx * vx + vy * vy, k = L ? clamp(((px - prev.x) * vx + (py - prev.y) * vy) / L, 0, 1) : 0;
          var d = Math.hypot(prev.x + vx * k - px, prev.y + vy * k - py);
          if (d < ad) { ad = d; ab = { kind: 'channel', key: 'ch:' + x.ch.key }; }
        }
        prev = s;
      }
    });
    if (ab) return ab;
    var cb = null, cd = 1e9;
    this.centres.forEach(function (C) {
      var s = self.screen(new T.Vector3(C.cx, C.cy, FACE)), r2 = self.screen(new T.Vector3(C.cx + C.w / 2, C.cy + C.h / 2, FACE));
      var rx = Math.max(16, Math.abs(r2.x - s.x)), ry = Math.max(16, Math.abs(r2.y - s.y));
      var d = Math.pow((px - s.x) / rx, 2) + Math.pow((py - s.y) / ry, 2);
      if (d < 1 && d < cd) { cd = d; cb = { kind: 'centre', key: 'c:' + C.c.name }; }
    });
    return cb;
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
        if ((this.explore || this.isFlying()) && this.flyOk()) {
          var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, Hd = this.H || 300;
          this.flyNudge([-(cx - this.pinch.cx) / Hd * 2.2, (cy - this.pinch.cy) / Hd * 2.2, (d - this.pinch.d) / Hd * 3.2], 0.9);
          this.pinch.cx = cx; this.pinch.cy = cy; this.pinch.d = d;
        } else this.user.zoom = clamp(this.pinch.zoom * d / Math.max(20, this.pinch.d), 0.6, 3.4);
      }
      this.respond();
      this.kick();
      return;
    }
    var dn = this.down;
    if (dn && dn.id === e.pointerId) {
      var dx = e.clientX - dn.x, dy = e.clientY - dn.y;
      if (!dn.axis && Math.hypot(dx, dy) > 7) {
        /* On a touch screen a vertical drag is the page scrolling, so only a
           sideways one turns the wiring; a mouse may tilt it too. */
        dn.axis = this.isFlying() && (dn.type === 'mouse' || this.explore) ? 'look' : dn.type === 'mouse' || this.explore ? 'free' : Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        if (dn.axis !== 'y') { try { this.el.pad.setPointerCapture(e.pointerId); } catch (er) { /* not capturable */ } this.el.pad.style.cursor = 'grabbing'; this.hideTip(); this.respond(); }
      }
      if (dn.axis === 'look') { this.flyLook(e.clientX - dn.lx, e.clientY - dn.ly); dn.lx = e.clientX; dn.ly = e.clientY; }
      else if (dn.axis === 'x' || dn.axis === 'free') {
        var Wd = this.W || 300;
        this.user.yaw = dn.yaw - dx / Wd * Math.PI * 1.1;
        if (dn.axis === 'free') this.user.pitch = clamp(dn.pitch + dy * 0.005, -0.25, 1.35);
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
    var first = !this.responded;
    this.respond();
    if (!pk) { this.kick(); return; }
    /* The first press brings a thing forward and names it; a second press on
       the same thing opens its reading. A Generator's first press is the
       response the body was waiting for, so it wakes the body and names. */
    if (pk.key === this.focusKey && !first) { if (this.o.onOpen) this.o.onOpen(pk.key); }
    else { this.setFocus(pk.key); if (this.o.onFocus) this.o.onFocus(pk.key, 'tap'); }
    this.kick();
  };
  P.onWheel = function (e) {
    if (!this.ready) return;
    e.preventDefault();
    if (this.isFlying()) { this.flyNudge([0, 0, clamp(-e.deltaY * 0.004, -1.5, 1.5)], 0.8); this.lift(0.03); this.kick(); return; }
    this.user.zoom = clamp(this.user.zoom * Math.exp(-e.deltaY * 0.0012), 0.6, 3.4);
    this.respond();
    this.lift(0.04);
    this.kick();
  };
  P.onKey = function (e) {
    if (!this.ready || !this.model || e.target !== this.host) return;
    if (this.flyOk() && this.flyKey(e)) { this.respond(); return; }
    var k = e.key, done = true;
    if (k === 'ArrowRight' || k === 'ArrowLeft') {
      var nk = this.step(k === 'ArrowRight' ? 1 : -1);
      if (nk) { this.setFocus(nk); if (this.o.onFocus) this.o.onFocus(nk, 'key'); }
    } else if (k === 'ArrowUp') this.user.pitch = clamp((this.user.pitch != null ? this.user.pitch : this.defaultPitch()) + 0.08, -0.25, 1.35);
    else if (k === 'ArrowDown') this.user.pitch = clamp((this.user.pitch != null ? this.user.pitch : this.defaultPitch()) - 0.08, -0.25, 1.35);
    else if (k === '+' || k === '=') this.zoom(-1);
    else if (k === '-' || k === '_') this.zoom(1);
    else if (k === '0' || k === 'Home') this.zoom(0);
    else if ((k === 'Enter' || k === ' ') && this.focusKey) { if (this.o.onOpen) this.o.onOpen(this.focusKey); }
    else done = false;
    if (done) { e.preventDefault(); this.respond(); this.lift(0.08); this.kick(); }
  };
  P.setHover = function (pk) {
    var id = pk ? pk.key : null;
    if (this._hovId === id) return;
    this._hovId = id;
    this.hover = pk;
    if (pk) this.lift(0.1);
  };
  P.hideTip = function () { this.el.tip.style.opacity = '0'; };
  P.tipOf = function (key) {
    var m = this.model, p = key.split(':');
    if (p[0] === 'c') { var c = m.centres.filter(function (x) { return x.name === p[1]; })[0]; return c ? c.tip : ''; }
    if (p[0] === 'g') return (m.gateTips && m.gateTips[p[1]]) || ('Gate ' + p[1]);
    if (p[0] === 'ch') { var ch = m.channels.filter(function (x) { return x.key === p[1]; })[0]; return ch ? ch.tip : ''; }
    if (p[0] === 'a') { var a = this.actBy(key.slice(2)); return a ? a.tip : ''; }
    return '';
  };
  P.updateHover = function () {
    if (!this.ptr.moved) return;
    this.ptr.moved = false;
    if (!this.ptr.on || (this.down && this.down.axis) || this.ptrType !== 'mouse') { this.setHover(null); this.hideTip(); return; }
    var pk = this.pickAt(this.ptr.px, this.ptr.py);
    this.setHover(pk);
    var tip = this.el.tip, txt = pk ? this.tipOf(pk.key) : '';
    var f = this.floorAt(this.ptr.px, this.ptr.py);
    if (f) this.floorMat.uniforms.uPtr.value.set(f.x, f.z);
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
  P.floorAt = function (px, py) {
    var ray = this._ray || (this._ray = new T.Raycaster());
    ray.setFromCamera(new T.Vector2(px / this.W * 2 - 1, -(py / this.H * 2 - 1)), this.cam);
    var o = ray.ray.origin, d = ray.ray.direction;
    if (d.y > -1e-4) return null;
    var k = -o.y / d.y;
    return new T.Vector3(o.x + d.x * k, 0, o.z + d.z * k);
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
    var dt = this.last ? Math.min(this.isFlying() ? 0.25 : 0.1, (ts - this.last) / 1000) : 0.016;
    var waking = this.wakeAt == null || now() - this.wakeAt < this.wakeSpan + 0.5;
    var busy = this.c > 0.04 || this.down || this.pinch || !this._settled || waking || Math.abs(this.k - this.kGoal) > 0.001 || Math.abs(this.skyK - (this.sky ? 1 : 0)) > 0.001 ||
      (this.flyOk() && this.flyBusy());
    /* the flow and the breathing never stop, so the rest rate is only a rate */
    if (!busy && ts - this.lastDraw < 31) return;
    this.last = ts;
    if (this.lastDraw) this.measure(ts - this.lastDraw, busy);
    this.lastDraw = ts;
    this.frame(dt, false);
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
  P.frame = function (dt, still) {
    if (!this.model || !this.cam || !this.content) return;
    var rm = this.reduced, self = this;
    if (!rm && !still) this.time += dt;
    this.c = Math.max(0, this.c - dt / 8);
    this.cur = damp(this.cur, this.c, rm ? 1 : 1 - Math.exp(-dt * 4));
    var c = this.cur, t = this.time, breath = rm ? 1 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 7.5);
    this.U.uTime.value = rm ? 2.0 : t;
    this.U.uBreath.value = breath;
    this.U.uGlow.value = 0.9 + 0.1 * breath * (1 - 0.5 * c) + 0.3 * c;
    if (!rm && !still) this.drift += dt * (0.12 + 0.4 * c);
    this.dustMat.uniforms.uDrift.value = this.drift;
    this.dustMat.uniforms.uAlpha.value = 0.3 + 0.4 * c;
    this.k = rm ? this.kGoal : damp(this.k, this.kGoal, 1 - Math.exp(-dt * 2.2));
    if (Math.abs(this.k - this.kGoal) < 0.0008) this.k = this.kGoal;
    var sg = this.sky ? 1 : 0;
    this.skyK = rm ? sg : damp(this.skyK, sg, 1 - Math.exp(-dt * 3));
    /* A body that waits for a response asks for one: after a while it wakes
       anyway, slowly, so nobody is left looking at a dark chart. */
    var wt = now();
    if (this.wakeAt == null && this.wakeWait && wt - (this.wakeT0 || wt) > 7) this.wakeAt = wt;
    var since = this.wakeAt == null ? -1 : wt - this.wakeAt;
    this.floorMat.uniforms.uWake.value = since < 0 ? 0.3 : clamp(since / Math.max(0.5, this.wakeSpan), 0, 1);
    this.updateHover();
    this.floorMat.uniforms.uPtrOn.value = damp(this.floorMat.uniforms.uPtrOn.value, this.ptr.on && this._ptrOn && this.ptrType === 'mouse' ? 0.5 + 0.5 * c : 0, rm ? 1 : 1 - Math.exp(-dt * 6));
    if (this._cellFocus !== this.focusGate()) this.derive();
    this.place();

    var kh = rm ? 1 : 1 - Math.exp(-dt * 9), hov = this.hover, hk = hov ? hov.key : null, fk = this.focusKey;
    var lit = hk || fk, litC = this.involved(lit);
    var origin = this.wakeOrigin || [];
    /* the centres */
    this.centres.forEach(function (C) {
      var u = C.mesh.material.uniforms, name = C.c.name;
      var wl = since < 0 ? (origin.indexOf(name) !== -1 ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.6)) : 0) : clamp((since - C.delay) / 0.8, 0, 1);
      C.lit = rm ? 1 : wl;
      u.uLit.value = ease(C.lit);
      var on = hk === 'c:' + name || fk === 'c:' + name ? 1 : 0;
      C.hover = damp(C.hover, on, kh);
      u.uHover.value = C.hover;
      u.uDim.value = lit && !litC.centres[name] ? 0.55 : 1;
      if (C.c.defined) {
        var p = 0;
        if (!rm) {
          if (name === 'Solar Plexus') p = 0.32 * Math.sin(t * Math.PI * 2 / 9);
          else if (name === 'Sacral') p = 0.09 * Math.sin(t * Math.PI * 2 / 1.8);
          else if (name === 'Root') p = 0.16 * Math.pow((t / 5.5) % 1, 3);
        }
        u.uPulse.value = p * C.lit;
      } else {
        /* open: never the same twice, and filled with what is around it when named */
        var drift = rm ? 0.26 : 0.24 + 0.12 * Math.sin(t * 0.7 + C.ph) + 0.07 * Math.sin(t * 1.9 + C.ph * 2.0);
        u.uCondK.value = mix(drift, 0.8, C.hover);
      }
      C.edge.material.opacity = (C.c.defined ? 0.85 : 0.4) * (0.35 + 0.65 * ease(C.lit)) * (lit && !litC.centres[name] ? 0.5 : 1);
      C.lab.material.opacity = 0.4 + 0.6 * ease(C.lit);
    });
    /* the gates */
    var fg = this.focusGate(), ek = ease(clamp(this.k, 0, 1));
    Object.keys(this.gates).forEach(function (k) {
      var G = self.gates[k], C = self.cByName[G.centre], cl = C ? ease(C.lit) : 1;
      var on = G.per || G.des ? 1 : 0, sky = G.sky * self.skyK;
      var hot = hk === 'g:' + G.n || fk === 'g:' + G.n || fg === G.n ? 1 : 0;
      G.hover = damp(G.hover, hot, kh);
      var mu = G.orb.material.uniforms, tcol = G.per && G.des ? self.tok.atm2 : G.per ? self.tok.tx : G.des ? self.tok.des : sky ? self.tok.blue : self.tok.tx;
      mu.uC.value.set(tcol[0], tcol[1], tcol[2]); mu.uCore.value.set(tcol[0], tcol[1], tcol[2]);
      var dimG = lit && !litC.gates[G.n] ? 0.4 : 1;
      mu.uOp.value = (on ? 0.95 : sky ? 0.7 : 0.22) * cl * dimG + G.hover * 0.5;
      G.orb.scale.setScalar((on ? 0.1 : sky ? 0.085 : 0.055) * (1 + 0.6 * G.hover));
      G.lab.material.opacity = ((on ? 1 : sky ? 0.75 : 0.42 * (1 - 0.75 * ek)) * (0.4 + 0.6 * cl)) * (lit && !litC.gates[G.n] ? 0.45 : 1) + G.hover * 0.3;
    });
    /* the channels: a lit half from its gate, a defined channel flowing */
    this.channels.forEach(function (x) {
      var key = 'ch:' + x.ch.key, hot = hk === key || fk === key ? 1 : 0;
      x.hover = damp(x.hover, hot, kh);
      var mine = !lit || litC.channels[x.ch.key];
      var CA = self.cByName[x.ch.ca], CB = self.cByName[x.ch.cb];
      [[x.hA, CA], [x.hB, CB]].forEach(function (p) {
        var u = p[0].material.uniforms, on = p[0].userData.on || 0, sky = p[0].userData.sky ? self.skyK : 1;
        var wl = p[1] ? ease(p[1].lit) : 1;
        u.uI.value = (on ? 0.95 * sky : 0.09) * (on ? wl : 1) * (mine ? 1 : 0.3) + 0.6 * x.hover;
        u.uW.value = (on ? 3.4 : 2.0) * (self.ui || 1) * (1 + 0.5 * x.hover);
        var flows = (x.natal || x.skyDef * self.skyK) ? 1 : 0;
        u.uFlow.value = rm ? 0 : flows * wl * (mine ? 1 : 0.3) * (x.natal ? 0.9 : 0.6);
      });
      /* the flow rises through both halves: half A runs from gate a to the
         middle, half B from gate b, so the two point opposite ways */
      x.hA.material.uniforms.uDir.value = x.up; x.hB.material.uniforms.uDir.value = -x.up;
    });
    /* the activations */
    this.acts.forEach(function (o) {
      var akey = 'a:' + o.a.key, on = hk === akey || fk === akey || (fg != null && fg === o.a.gate) ? 1 : 0;
      o.hover = damp(o.hover, on, kh);
      o.vis = rm ? o.visGoal : damp(o.vis, o.visGoal, 1 - Math.exp(-dt * 6));
      var C = self.cByName[(self.gates[o.a.gate] || {}).centre], cl = C ? ease(C.lit) : 1;
      var isF = fk === akey;
      if (isF && !o.sprF) { o.sprF = self.activation(o.a.glyph, o.a.gate + '.' + o.a.line, o.colC, o.D + 3, true); o.sprF.position.copy(o.pos); self.content.add(o.sprF); }
      if (o.sprF) { o.sprF.visible = isF && o.vis > 0.05; o.sprF.material.opacity = o.vis; }
      o.spr.visible = !isF && o.vis > 0.05;
      var dim = lit && !on && !litC.acts[o.a.key] ? 0.45 : 1;
      o.spr.material.opacity = o.vis * dim * (0.55 + 0.45 * cl);
      o.orb.visible = o.vis > 0.05;
      o.orb.material.uniforms.uOp.value = o.vis * (0.5 + 0.5 * cl) * dim;
      o.orb.material.uniforms.uHover.value = o.hover;
      var e = ease(clamp(self.k, 0, 1));
      var base = mix(0, 0.22, e), want = (litC.acts[o.a.key] ? 0.75 : base) + o.hover * 0.6;
      o.th = damp(o.th, want * o.vis, kh);
      var tu = o.thread.material.uniforms;
      tu.uI.value = o.th; tu.uFlow.value = rm ? 0 : o.hover * 0.8; tu.uDir.value = 1;
      o.thread.visible = o.th > 0.01;
    });
    if (this.ghosts) this.ghosts.forEach(function (gh) {
      var e = ease(clamp(self.k, 0, 1));
      gh.gh.material.uniforms.uOp.value = self.skyK * (0.35 + 0.65 * e);
      gh.lab.material.opacity = self.skyK * e;
      gh.lab.visible = e > 0.05 && self.skyK > 0.02;
    });
    this.ringLabs.forEach(function (l) {
      var G = self.gates[l.userData.gate] || {}, on = G.per || G.des;
      l.material.opacity = ease(clamp(self.k, 0, 1)) * (on ? 1 : G.sky ? 0.8 * self.skyK + 0.4 : 0.42);
    });

    this._dt = dt;
    this.placeCamera(rm ? 1 : 1 - Math.exp(-dt * 3));
  };
  /* What a named thing touches: a centre its gates, channels and the
     activations on them; a gate its channels and activations; a channel its two
     gates and centres; an activation its gate. */
  P.involved = function (key) {
    var out = { centres: {}, gates: {}, channels: {}, acts: {} };
    if (!key || !this.model) return out;
    var self = this, p = key.split(':'), m = this.model;
    var addGate = function (n) {
      out.gates[n] = 1;
      m.acts.forEach(function (a) { if (a.gate === n) out.acts[a.key] = 1; });
    };
    if (p[0] === 'c') {
      out.centres[p[1]] = 1;
      Object.keys(this.gates).forEach(function (k) { if (self.gates[k].centre === p[1]) addGate(+k); });
      this.channels.forEach(function (x) {
        if (x.ch.ca === p[1] || x.ch.cb === p[1]) {
          var lit = x.A.per || x.A.des || x.B.per || x.B.des;
          if (lit) { out.channels[x.ch.key] = 1; out.centres[x.ch.ca] = 1; out.centres[x.ch.cb] = 1; }
        }
      });
    } else if (p[0] === 'g' || p[0] === 'a') {
      var n = p[0] === 'g' ? +p[1] : (this.actBy(key.slice(2)) || {}).gate;
      if (n == null) return out;
      addGate(n);
      var G = this.gates[n]; if (G) out.centres[G.centre] = 1;
      this.channels.forEach(function (x) { if (x.ch.a === n || x.ch.b === n) { out.channels[x.ch.key] = 1; out.centres[x.ch.ca] = 1; out.centres[x.ch.cb] = 1; addGate(x.ch.a); addGate(x.ch.b); } });
      if (p[0] === 'a') out.acts[key.slice(2)] = 1;
    } else if (p[0] === 'ch') {
      var x = this.channels.filter(function (c) { return c.ch.key === p[1]; })[0];
      if (x) { out.channels[x.ch.key] = 1; out.centres[x.ch.ca] = 1; out.centres[x.ch.cb] = 1; addGate(x.ch.a); addGate(x.ch.b); }
    }
    return out;
  };

  P.resize = function () {
    if (!this.r || !this.el.root.isConnected) return;
    var b = this.el.root.getBoundingClientRect(), W = Math.max(2, Math.round(b.width)), H = Math.max(2, Math.round(b.height));
    var dpr = window.devicePixelRatio || 1, L = [Math.min(dpr, 2), Math.min(dpr, 1.5), Math.min(dpr, 1.25), 1, 0.75][this.level];
    var bloom = this.level <= 1;
    if (W === this.W && H === this.H && L === this.pr && bloom === this.bloom) return;
    this.W = W; this.H = H; this.pr = L; this.bloom = bloom;
    var ui = clamp(Math.min(W, H) / 520, 0.72, 1.2);
    this.ui = ui;
    var rebuild = this.builtUi != null && Math.abs(ui - this.builtUi) > 0.05;
    this.r.setPixelRatio(L);
    this.r.setSize(W, H, false);
    this.cam.aspect = W / H;
    this.cam.fov = W / H < 0.9 ? 40 : 34;
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
    if (!this.shown && this.fontsOk) {
      this.shown = true;
      if (this.wakeAt == null && !this.wakeWait) this.wakeAt = now();
      this.wakeT0 = now();
      this.el.canvas.style.opacity = '1';
      if (this.o.onReady) this.o.onReady();
    }
  };

  P.destroy = function () {
    this.stop();
    if (this.host && this._onKey) this.host.removeEventListener('keydown', this._onKey);
    document.removeEventListener('visibilitychange', this._on.vis);
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    if (this.content) this.dispose(this.content);
    if (this.post) { ['scene', 'a', 'b', 'c', 'd'].forEach(function (k) { this.post[k].dispose(); }, this); }
    if (this.cellTex) this.cellTex.dispose();
    if (this.r) this.r.dispose();
    try { if (this.el.root.parentNode) this.el.root.parentNode.removeChild(this.el.root); } catch (e) { /* gone already */ }
    this.failed = true;
  };

  root.HDScene = {
    supported: supported,
    create: function (opts) { return new Scene(opts); },
    /* exposed for the gates that test the layout without a browser */
    _layoutGates: layoutGates, _outline: outline
  };
})(typeof window !== 'undefined' ? window : this);
