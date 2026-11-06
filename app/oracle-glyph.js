/* oracle-glyph.js: THE ORACLE'S SYMBOL, ALIVE.

   The owner, 5 November 2026: the Oracle's nav symbol is the somatic ring (a
   rounded triangular torus drawn in contour lines, see build-ui-icons.js), and
   it shapeshifts in every identity, with each world's own weather on top:

     Deep Field          cosmic flare: a glow, sparks running the contours and
                         a star that flares at a lobe now and then
     Cyberspace          tech rot: the ring snapped to pixels, stepped in time,
                         lines dropping out and a band of it glitching sideways
     Nature's Roots      molded like clay, continuously: slow lumps, a thumb
                         pressing in and travelling, lines thick and thin by hand
     Subterranean Biome  liquefied: ripples running round it, the whole ring
                         wobbling as if under water, drops falling from it

   WHAT THIS FILE OWES THE APP.
   - It is ornament. The nav span it draws in is aria-hidden and the button
     beside it carries the name; nothing here reads the reader's data.
   - The plain mask stays the fallback. The template still paints the static
     icon as a mask; only once a canvas is in place does `data-glyph-live` let
     the head sheet drop that mask, so a missing module, a failed canvas or the
     contrast modifier all leave the static icon exactly as it was.
   - The colour is the nav's own. The span's inline background-color (a token)
     is read through the canvas's `color` and drawn with, so resting and active
     follow every identity. A world's accent comes from --atmc and --atmc2,
     the bare RGB triplets the atmosphere already uses.
   - Under reduced motion it holds one settled frame per world. Under the
     contrast modifier it does not draw at all. It pauses while the page is
     hidden and runs at about 30 frames a second.

   Shell layer, global OracleGlyph. The app calls sync(root, still) from
   worldSync(), which runs whenever the identity, the contrast modifier or the
   motion setting changes, and stop() from the one componentWillUnmount. */
(function () {
  'use strict';
  if (window.OracleGlyph) return;

  const TAU = Math.PI * 2;
  const N = 72;                     /* samples per contour */
  const LEVELS = [[0, 1.5], [0.33, 0.7], [0.66, 0.7], [1, 1.4]];

  let root = null, obs = null, raf = 0, last = 0, t0 = 0, held = false, stillWanted = false;
  const glyphs = new Set();
  let drops = [];

  const reduced = () => stillWanted || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const worldOf = () => {
    if (!root) return 'deepfield';
    if (root.hasAttribute('data-world-hc')) return 'hc';
    return root.getAttribute('data-world') || 'deepfield';
  };
  /* Every value read off the page is read once, when the identity changes or a
     span arrives, never per frame: a getComputedStyle or a box measurement in
     the loop forces a style and layout pass over the whole app thirty times a
     second, which is what made the N phase overrun its budget. */
  let toks = {};
  function rgbVar(name, fallback) { return toks[name] || fallback; }
  function readToks() {
    toks = {};
    if (!root) return;
    const cs = getComputedStyle(root);
    for (const n of ['--atmc', '--atmc2']) toks[n] = cs.getPropertyValue(n).trim();
  }
  let sizeObs = null, seeObs = null;
  function observers() {
    if (!sizeObs && typeof ResizeObserver === 'function')
      sizeObs = new ResizeObserver(es => { for (const e of es) for (const g of glyphs) if (g.span === e.target) { g.size = e.contentRect.width || g.size; if (held) still(); } });
    if (!seeObs && typeof IntersectionObserver === 'function')
      seeObs = new IntersectionObserver(es => { for (const e of es) for (const g of glyphs) if (g.span === e.target) g.seen = e.isIntersecting; });
  }
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  /* THE SHAPESHIFT, shared by all four. The lobes trade between two, three and
     four, the ring turns, the hole drifts and breathes, and the side the
     contours crowd moves round. Every rate is a different irrational fraction
     so the form never quite repeats. */
  function form(T) {
    return {
      w3: 0.8 + 0.2 * Math.sin(T * 0.31),
      w2: 0.16 * Math.sin(T * 0.23 + 1.0),
      w4: 0.13 * Math.sin(T * 0.17 + 2.0),
      rot: -0.45 + 0.7 * Math.sin(T * 0.11),
      hx: 0.8 * Math.cos(T * 0.19),
      hy: -1.0 + 0.5 * Math.sin(T * 0.27),
      ri: 5.0 + 0.6 * Math.sin(T * 0.37 + 0.5),
      leanA: 0.6 + T * 0.25,
    };
  }

  /* A point on contour t at angle a, with the world's displacement added. */
  function point(f, t, a, T, world) {
    const ro = 9.1, lobeO = 0.13, lobeI = 0.18, tw = 0.25, lean = 0.35;
    const m = t * (1 - t) * 4;
    const te = t + lean * m * Math.sin(a - f.leanA);
    const ph = a - f.rot - tw * te;
    const lobes = f.w3 * Math.cos(3 * ph) + f.w2 * Math.cos(2 * ph) + f.w4 * Math.cos(4 * ph);
    let r = (ro + (f.ri - ro) * te) * (1 + (lobeO + (lobeI - lobeO) * te) * lobes);
    let x0 = 0, y0 = 0;
    if (world === 'dawn') {
      /* clay: slow lumps, and a thumb pressing in where it travels */
      for (let k = 1; k <= 4; k++) r += (0.34 / k) * Math.sin(k * a + T * (0.13 * k + 0.05) + k * 1.7);
      const thumb = T * 0.21, d = Math.atan2(Math.sin(a - thumb), Math.cos(a - thumb));
      r -= 0.9 * (1 - t * 0.6) * Math.exp(-(d * d) / 0.18);
    } else if (world === 'gold') {
      /* liquid: ripples running round the ring, and a slow sway */
      r += 0.28 * Math.sin(8 * a - T * 3.1 + t * 3.0) * (0.6 + 0.4 * m);
      x0 = 0.35 * Math.sin(T * 1.3 + a * 2);
    }
    let x = 12 + f.hx * te + r * Math.cos(a) + x0;
    let y = 12.2 + f.hy * te + r * Math.sin(a);
    if (world === 'gold') y += 0.35 * Math.sin(x * 0.7 + T * 2.2);
    return [x, y];
  }

  function contour(f, t, T, world) {
    const pts = [];
    for (let i = 0; i < N; i++) pts.push(point(f, t, i / N * TAU, T, world));
    return pts;
  }
  function smooth(ctx, pts) {
    const n = pts.length;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    ctx.closePath();
  }


  /* THE LOADING ORB IN DEPTH. The owner, 6 November 2026: "Make the oracle on
     the loading screen more 3 dimensional and realistic", with a recording of
     a lobed torus drawn in dense contour lines, lit, cool above and warm
     below, turning slowly. The orb span (data-glyph-orb) is drawn that way:
     the same three lobed ring as the nav symbol, raymarched as a solid, and
     its contours are the level lines of a slow field over the surface, so
     they crowd, close into eyes and cross at saddles as the form turns. Lit
     from above left; the line colour runs from the identity's --atmc above
     to its --atmc2 below, lightened, so each world tints it. Each world keeps
     its weather: Cyberspace steps in time and is drawn in coarse pixels,
     Nature's Roots is lumpier and slower, the Biome ripples. Without WebGL 2,
     or if the shader will not build, the orb falls back to the flat glyph. */
  const VS = '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uT; uniform int uW; uniform mat3 uRot;
uniform vec3 uTop; uniform vec3 uBot; uniform float uZ;
out vec4 o;
float Ts;
float h1(float n){ return fract(sin(n*127.1 + 311.7)*43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b - a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0 - h); }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0.0, 1.0); return length(pa - ba*h); }
float lobe(float a){ return cos(3.0*a + 0.5*sin(Ts*0.31)) + 0.18*sin(2.0*a - Ts*0.23); }
float sdf(vec3 p){
  p = uRot*p;
  float a = atan(p.z, p.x);
  float l = lobe(a);
  float R = 0.57 + 0.14*l;
  float r = 0.285 + 0.06*l;
  float y = p.y - 0.10*sin(2.0*a + Ts*0.27) - 0.06*cos(3.0*a - Ts*0.19);
  if (uW == 2) { R += 0.035*sin(5.0*a + Ts*0.21); r += 0.025*sin(7.0*a - Ts*0.17 + p.y*6.0); }
  if (uW == 3) { R += 0.022*sin(9.0*a - Ts*2.2); y += 0.02*sin(6.0*a + Ts*1.7); }
  vec2 q = vec2(length(p.xz) - R, y*1.12);
  float d = length(q) - r;
  if (uW == 2) {
    /* two thumbs working the clay: each presses in, eases off, and moves on */
    float a1 = Ts*0.21, k1 = 0.5 + 0.5*sin(Ts*0.9);
    vec3 c1 = vec3(cos(a1)*0.6, 0.47 - 0.15*k1, sin(a1)*0.6);
    d = smax(d, 0.2 - length(p - c1), 0.06);
    float a2 = 2.4 - Ts*0.17, k2 = 0.5 + 0.5*sin(Ts*0.7 + 2.0);
    vec3 c2 = vec3(cos(a2), 0.0, sin(a2))*(1.0 - 0.08*k2);
    d = smax(d, 0.16 - length(p - c2), 0.07);
  }
  return d*0.62;
}
vec3 nrm(vec3 p){
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(sdf(p+e.xyy)-sdf(p-e.xyy), sdf(p+e.yxy)-sdf(p-e.yxy), sdf(p+e.yyx)-sdf(p-e.yyx)));
}
float field(vec3 p){
  vec3 q = uRot*p;
  float s = uW == 3 ? Ts*0.25 : Ts*0.06;
  return sin(q.x*2.3 + s) * cos(q.z*2.1 - s*0.7)
       + 0.65*sin(q.y*3.1 + q.x*1.3 + s*1.3)
       + 0.45*cos(length(q.xz)*4.2 - s);
}
vec3 P; float A;
void glow(vec3 e){ e = max(e, 0.0); P += e; A = clamp(A + max(e.r, max(e.g, e.b))*0.85, 0.0, 1.0); }
void over(vec3 c, float m){ P = P*(1.0 - m) + c*m; A = A*(1.0 - m) + m; }
vec3 star(vec2 uv, vec2 c, float s){
  vec2 d = uv - c;
  float core = exp(-dot(d, d)/(s*s*0.18));
  float spike = exp(-abs(d.x)/(s*0.05))*exp(-abs(d.y)/(s*1.6)) + exp(-abs(d.y)/(s*0.05))*exp(-abs(d.x)/(s*1.6));
  return vec3(core*1.3 + spike*0.55);
}
/* Deep Field: stars on tilted orbits round the orb */
void dfStars(vec2 uv, bool front){
  for (int i = 0; i < 5; i++) {
    float fi = float(i), h = h1(fi*3.7 + 1.0);
    float th = Ts*(0.35 + 0.25*h)*(i == 2 ? -1.0 : 1.0) + h*6.283;
    if ((sin(th) < 0.0) != front) continue;
    vec2 pos = rot(-0.5 + h*1.1)*vec2(cos(th)*(1.08 + 0.3*h), sin(th)*(0.18 + 0.2*h1(fi + 9.0)));
    float s = 0.05 + 0.035*h1(fi*5.1);
    vec3 tint = mix(vec3(1.0), mix(uTop, uBot, h), 0.35);
    glow(star(uv, pos, s)*tint*(front ? 1.0 : 0.7));
    vec2 back = rot(-0.5 + h*1.1)*vec2(cos(th - 0.25)*(1.08 + 0.3*h), sin(th - 0.25)*(0.18 + 0.2*h1(fi + 9.0)));
    glow(tint*0.18*exp(-seg(uv, pos, back)/0.008));
  }
}
/* Biome: the current that wraps the orb, now and then, a different size each time */
vec3 bolt(vec2 uv, bool front, out float on){
  float k = floor(Ts/2.3), ph = fract(Ts/2.3);
  on = 0.0;
  if (h1(k*13.1) < 0.3 || ph > 0.42) return vec3(0.0);
  on = smoothstep(0.0, 0.04, ph)*smoothstep(0.42, 0.3, ph)*(0.7 + 0.3*vn(vec2(Ts*40.0, 1.0)));
  float s = 0.78 + 0.5*h1(k*7.3), fl = 0.22 + 0.5*h1(k*5.7);
  vec2 lp = rot(-(h1(k*3.1) - 0.5)*1.8)*uv;
  vec2 e = lp/vec2(s, s*fl);
  float phi = atan(e.y, e.x);
  if ((sin(phi) < 0.0) != front) return vec3(0.0);
  float tg = 1.0 + 0.16*(vn(vec2(phi*7.0 + k*9.0, Ts*18.0)) - 0.5) + 0.06*(vn(vec2(phi*23.0, Ts*31.0)) - 0.5);
  float d = abs(length(e) - tg)*s*fl*1.2;
  float head = 0.35 + 0.65*pow(0.5 + 0.5*cos(phi - Ts*22.0), 6.0);
  vec3 c = vec3(1.0)*exp(-d*d/0.00003) + uTop*0.9*exp(-d/0.02) + uBot*0.25*exp(-d/0.06);
  return c*head*on;
}
void main(){
  Ts = uW == 1 ? floor(uT*6.0)/6.0 : uT;
  P = vec3(0.0); A = 0.0;
  vec2 uv = (gl_FragCoord.xy*2.0 - uRes)/uRes.y*uZ;
  float px = 2.0*uZ/uRes.y;
  vec2 raw = uv;
  /* Cyberspace: glitch bursts shove bands sideways and swap the channels */
  bool swap = false;
  if (uW == 1) {
    float k = floor(uT*7.0);
    float burst = step(0.55, h1(floor(uT*1.3)))*step(0.35, h1(k));
    float band = floor(uv.y*9.0 + h1(k)*4.0);
    if (burst > 0.5 && h1(band*1.7 + k*7.0) > 0.55) { uv.x += (h1(band*3.0 + k) - 0.5)*0.4; swap = h1(band + k*2.0) > 0.5; }
    uv.y -= 0.05*sin(uT*1.1);
  }
  float pulse = 0.75 + 0.25*sin(uT*2.2);
  float fl = 0.72 + 0.28*vn(vec2(uT*6.0, 0.0));
  vec3 warm = vec3(1.0, 0.45, 0.12);
  float bOn = 0.0;

  /* behind the orb */
  if (uW == 0) {
    float r = length(uv);
    vec2 dir = uv/max(r, 1e-4);
    float rays = pow(vn(dir*9.0 + vec2(uT*0.15, -uT*0.1)), 4.0) + 0.7*pow(vn(dir*23.0 - uT*0.2), 6.0);
    float stream = 0.6 + 0.4*sin(r*22.0 - uT*3.0 + rays*4.0);
    float out1 = smoothstep(0.7, 0.95, r)*exp(-(r - 0.9)*2.2);
    glow(mix(uTop, uBot, 0.5 + 0.5*dir.y)*rays*stream*out1*0.55);
    glow(uTop*0.12*exp(-abs(r - 0.92)/0.06));
    dfStars(uv, false);
  } else if (uW == 1) {
    /* the beam from overhead, its rings climbing, and the craft that holds it */
    float y = uv.y, w = mix(0.12, 1.05, clamp((1.55 - y)/2.6, 0.0, 1.0));
    float beam = smoothstep(w, w*0.55, abs(uv.x))*step(y, 1.55)*smoothstep(-1.6, -0.4, y);
    float rings = pow(0.5 + 0.5*sin(y*16.0 + uT*6.0), 6.0);
    glow(uTop*beam*(0.16 + 0.22*rings)*pulse);
    vec2 sc = (uv - vec2(0.0, 1.52))/vec2(0.55, 0.08);
    glow(uTop*exp(-dot(sc, sc)*1.4)*0.9*pulse + vec3(0.9)*exp(-dot(sc, sc)*5.0)*0.4);
  } else if (uW == 2) {
    /* the hearth under the orb: its flames, and the glow it throws */
    vec2 f = uv - vec2(0.0, -1.5);
    float n = vn(vec2(f.x*7.0, f.y*5.0 - uT*5.0));
    float n2 = vn(vec2(f.x*13.0 + 3.0, f.y*9.0 - uT*8.0));
    float wdt = 0.5*(1.0 - clamp(f.y/0.85, 0.0, 1.0));
    float edge = abs(f.x) + (n - 0.5)*0.18 + (n2 - 0.5)*0.08;
    float fm = smoothstep(wdt, wdt - 0.12, edge)*smoothstep(0.85, 0.15, f.y + (n - 0.5)*0.35);
    float heat = clamp(1.0 - f.y/0.6 - abs(f.x)*1.4, 0.0, 1.0);
    vec3 fc = mix(vec3(0.8, 0.12, 0.03), mix(vec3(1.0, 0.55, 0.12), vec3(1.0, 0.92, 0.6), heat), heat);
    glow(fc*fm*1.2*fl);
    glow(warm*exp(-length((uv - vec2(0.0, -1.3))*vec2(0.9, 1.2))*2.4)*0.5*fl);
  } else {
    /* the lighthouse lamp turns in the orb, its beam sweeping the water */
    float th = uT*1.1;
    vec2 e = uv/vec2(1.0, 0.32);
    float a = atan(e.y, e.x);
    float df = abs(mod(a - atan(sin(th), cos(th)) + 3.14159, 6.28318) - 3.14159);
    float rr = length(e);
    float wedge = smoothstep(0.36, 0.0, df)*smoothstep(0.55, 0.95, rr)*exp(-(rr - 0.9)*0.6);
    float facing = 0.45 + 0.55*max(-sin(th), 0.0);
    if (sin(th) > 0.0) glow(mix(uTop, vec3(1.0), 0.35)*wedge*0.9*facing);
    glow(uTop*0.10*exp(-abs(length(uv) - 0.9)/0.08));
    glow(bolt(uv, false, bOn));
    /* drops falling from above onto the orb */
    for (int i = 0; i < 4; i++) {
      float fi = float(i), hh = h1(fi*7.7 + 40.0), per = 1.6 + hh;
      float ag = fract(uT/per + hh)*per;
      vec2 dp = vec2((hh - 0.5)*1.0, 1.65 - 0.55*ag*ag*1.6);
      if (dp.y < 0.35) continue;
      vec2 q = (uv - dp)*vec2(1.0, 0.6);
      glow(mix(uTop, vec3(1.0), 0.3)*exp(-dot(q, q)/0.00035)*0.9);
    }
    /* drops pulled from the orb's underside, stretching, falling, landing */
    for (int i = 0; i < 9; i++) {
      float fi = float(i), hh = h1(fi*5.3 + 2.0), per = 2.2 + 1.2*h1(fi + 30.0);
      float ag = fract(uT/per + hh)*per;
      float x = (hh - 0.5)*1.5;
      float y0 = -0.25 - 0.2*h1(fi*2.1);
      float yd = y0 - 0.12*ag - 0.75*ag*ag;
      vec3 dc = mix(uTop, uBot, h1(fi*9.3)*0.6);
      if (yd > -1.42) {
        vec2 q = uv - vec2(x, yd);
        float tail = seg(uv, vec2(x, yd), vec2(x, yd + 0.06 + 0.1*smoothstep(0.0, 0.8, ag)));
        float m = exp(-dot(q*vec2(1.0, 0.8), q*vec2(1.0, 0.8))/0.0006) + 0.55*exp(-tail*tail/0.00008);
        if (ag < 0.55) m += 0.35*exp(-pow(seg(uv, vec2(x, y0), vec2(x, yd)), 2.0)/0.00002);
        glow(dc*m*0.95);
        glow(vec3(1.0)*exp(-dot(q - vec2(-0.008, 0.01), q - vec2(-0.008, 0.01))/0.00004)*0.6);
      } else {
        float hit = (-0.12 + sqrt(max(0.0144 + 3.0*(y0 + 1.42), 0.0)))/1.5;
        float sa = ag - hit;
        vec2 q = (uv - vec2(x, -1.44))*vec2(1.0, 4.0);
        float ring = abs(length(q) - (0.03 + sa*0.45));
        glow(dc*exp(-ring*ring/0.0003)*max(1.0 - sa*1.6, 0.0)*0.8);
        float up = sa*2.2 - sa*sa*6.0;
        if (up > 0.0) { vec2 s1 = uv - vec2(x - 0.04 - sa*0.1, -1.44 + up*0.2), s2 = uv - vec2(x + 0.04 + sa*0.1, -1.44 + up*0.2);
          glow(dc*(exp(-dot(s1, s1)/0.0002) + exp(-dot(s2, s2)/0.0002))*0.7); }
      }
    }
  }
  /* falling leaves, odd ones behind the orb */
  if (uW == 2) {
    for (int i = 1; i < 8; i += 2) {
      float fi = float(i), hh = h1(fi*4.1 + 7.0), per = 6.0 + 3.0*h1(fi + 3.0);
      float f = fract(uT/per + hh);
      vec2 pos = vec2((hh - 0.5)*2.6 + 0.22*sin(uT*0.9 + hh*6.0), 1.75 - f*3.5);
      float ang = sin(uT*1.3 + hh*5.0)*1.2 + hh*6.0;
      vec2 lp = rot(-ang)*(uv - pos);
      lp.x /= 0.35 + 0.65*abs(cos(uT*2.0 + hh*7.0));
      float wv = 0.06*(1.0 - pow(lp.x/0.13, 2.0));
      float m = smoothstep(px*1.5, 0.0, abs(lp.y) - wv)*step(abs(lp.x), 0.13);
      vec3 lc = h1(fi*2.3) < 0.33 ? vec3(0.78, 0.52, 0.14) : (h1(fi*2.3) < 0.66 ? vec3(0.66, 0.25, 0.09) : vec3(0.45, 0.48, 0.15));
      lc *= 0.55 + 0.45*fl - 0.3*smoothstep(0.006, 0.0, abs(lp.y));
      over(lc*0.7, m*0.95);
    }
  }

  /* the orb */
  float t = 1.6, d = 1.0, md = 1e9;
  vec3 ro = vec3(0.0, 0.0, 3.1), rd = normalize(vec3(uv*0.4, -1.0));
  if (length(uv) < 1.5) {
    for (int i = 0; i < 80; i++) {
      d = sdf(ro + rd*t);
      md = min(md, d);
      if (d < 0.0008 || t > 4.6) break;
      t += d;
    }
  }
  if (d > 0.002) {
    float c = 1.0 - smoothstep(0.0, px*0.8, md);
    glow(uBot*0.12*c);
  } else {
    vec3 p = ro + rd*t, n = nrm(p);
    vec3 L = normalize(vec3(-0.55, 0.7, 0.6));
    float dif = max(dot(n, L), 0.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
    float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 28.0)*(uW == 2 ? 0.25 : 1.0);
    float h = smoothstep(-0.7, 0.7, p.y + 0.25*p.x);
    vec3 col = mix(uBot, uTop, h);
    float v = field(p)*clamp(uRes.y/uZ*0.072, 7.0, 20.0)*(uW == 1 ? 0.75 : 1.0);
    float fw = fwidth(v);
    float k = abs(fract(v) - 0.5);
    float w = uW == 2 ? 0.13 + 0.07*sin(v*0.7) : (uW == 1 ? 0.16 : 0.11);
    float line = smoothstep(w + fw, w - fw*0.5, 0.5 - k);
    line = mix(line, 0.22, smoothstep(0.32, 0.8, fw));
    vec3 lit = col*(0.16 + 1.0*dif) + vec3(spec*0.5) + col*rim*0.5;
    vec3 body = col*(0.015 + 0.05*dif) + col*rim*0.06;
    vec3 c = mix(body, lit, line);
    vec3 q = uRot*p;
    if (uW == 0) {
      /* sparks running along the contours, and glints that come and go */
      c += mix(uBot, vec3(1.0), 0.6)*line*pow(0.5 + 0.5*sin(v*0.37 - uT*2.0 + q.x*6.0), 18.0)*1.4;
      vec3 cell = floor(q*11.0);
      float gh = h2(cell.xy + cell.z*7.3);
      vec3 cp = fract(q*11.0) - 0.5;
      c += vec3(1.0)*step(0.86, gh)*pow(max(0.0, sin(uT*3.0 + gh*40.0)), 12.0)*exp(-dot(cp, cp)*40.0)*1.5;
    } else if (uW == 1) {
      c += uTop*0.5*smoothstep(-0.1, 1.0, n.y)*pulse*(0.4 + 0.6*line);
    } else if (uW == 2) {
      float below = smoothstep(0.35, -0.9, n.y);
      c += warm*fl*below*(0.12 + 0.55*line*(0.3 + dif));
    } else {
      /* water running down the orb in thin bright threads */
      float col1 = floor(uv.x*38.0);
      float hh = h1(col1*1.3);
      float fwv = fract(uv.y*2.6 + uT*(0.35 + 0.5*hh) + hh*9.0);
      float thread = step(0.45, hh)*smoothstep(0.5, 0.15, abs(fract(uv.x*38.0) - 0.5))*smoothstep(0.0, 0.06, fwv)*smoothstep(0.4, 0.06, fwv);
      c += mix(uTop, vec3(1.0), 0.4)*thread*0.55*(0.3 + 0.7*smoothstep(0.5, -0.6, n.y));
      c += vec3(1.0)*pow(max(dot(reflect(-L, n), -rd), 0.0), 60.0)*0.4;
      float th = uT*1.1;
      vec2 bd = vec2(cos(th), -sin(th));
      c += uTop*pow(max(dot(normalize(n.xz), bd), 0.0), 8.0)*0.45;
      c += mix(uTop, vec3(1.0), 0.5)*bOn*0.35*(0.4 + 0.6*line);
    }
    over(c, 1.0);
  }

  /* in front of the orb */
  if (uW == 0) {
    dfStars(uv, true);
    /* sparks thrown off the rim */
    for (int i = 0; i < 12; i++) {
      float fi = float(i), hh = h1(fi*6.1 + 3.0), per = 1.3 + 1.1*h1(fi + 20.0);
      float f = fract(uT/per + hh);
      float a = hh*6.283 + floor(uT/per + hh)*2.1;
      vec2 dir = vec2(cos(a), sin(a));
      vec2 pos = dir*(0.78 + f*0.75);
      float m = exp(-pow(seg(uv, pos, pos - dir*(0.05 + 0.08*(1.0 - f))), 2.0)/0.000025);
      glow(mix(vec3(1.0, 0.9, 0.7), uBot, f)*m*pow(1.0 - f, 1.5)*1.3);
    }
  } else if (uW == 1) {
    /* the beam's light over the orb, and what it lifts */
    float y = uv.y, w = mix(0.12, 1.05, clamp((1.55 - y)/2.6, 0.0, 1.0));
    float beam = smoothstep(w, w*0.55, abs(uv.x))*step(y, 1.55)*smoothstep(-1.6, -0.4, y);
    glow(uTop*beam*0.07*pulse);
    for (int i = 0; i < 10; i++) {
      float fi = float(i), hh = h1(fi*2.9 + 11.0);
      float yy = -1.3 + fract(uT*0.22 + hh)*2.8;
      float ww = mix(0.12, 1.05, clamp((1.55 - yy)/2.6, 0.0, 1.0));
      vec2 pp = vec2((h1(fi*8.1) - 0.5)*ww*1.1, yy);
      vec2 dq = abs(uv - pp);
      glow(mix(uTop, vec3(1.0), 0.5)*step(max(dq.x, dq.y), 0.017)*0.9*smoothstep(1.5, 1.0, yy));
    }
    /* the buzzsaw: every seven seconds it crosses and shreds */
    float ph = fract(uT/7.0);
    if (ph < 0.3) {
      float s = ph/0.3;
      vec2 cB = vec2(mix(-1.9, 1.9, s), mix(0.28, -0.28, s));
      vec2 rl = raw - cB;
      float rr = length(rl);
      float an = atan(rl.y, rl.x) + uT*40.0;
      float R = 0.3 + 0.055*fract(an*16.0/6.28318);
      float disc = smoothstep(R + px, R - px, rr);
      if (disc > 0.0) {
        vec3 mc = vec3(0.62, 0.66, 0.7)*(0.75 + 0.25*sin(rr*90.0 + an*2.0)) + vec3(0.3)*pow(max(0.0, rl.x*0.7 + rl.y*0.7)/0.3, 3.0);
        mc = mix(mc, vec3(0.12), smoothstep(0.07, 0.05, rr));
        mc += vec3(0.9)*smoothstep(0.02, 0.0, abs(rr - R + 0.02));
        over(mc, disc*0.96);
      }
      /* the cut it leaves, still glowing */
      float yp = mix(0.28, -0.28, (raw.x + 1.9)/3.8);
      float since = (s - (raw.x + 1.9)/3.8)*2.1;
      if (since > 0.0 && abs(raw.y) < 1.2 && md < 0.002) {
        glow(vec3(1.0, 0.5, 0.15)*exp(-pow(raw.y - yp, 2.0)/0.00015)*exp(-since*2.5)*1.4);
      }
      float contact = smoothstep(0.95, 0.75, abs(cB.x));
      for (int i = 0; i < 26; i++) {
        float fi = float(i), hh = h1(fi*3.3 + 50.0);
        float t0 = mix(0.27, 0.73, h1(fi*1.9 + 5.0));
        float ag = (s - t0)*2.1;
        if (ag < 0.0 || ag > 0.55) continue;
        vec2 c0 = vec2(mix(-1.9, 1.9, t0), mix(0.28, -0.28, t0));
        float sg = i < 13 ? 1.0 : -1.0;
        vec2 em = c0 + vec2(-0.05, sg*0.33);
        vec2 vel = vec2(-(0.7 + 1.4*hh), sg*(0.25 + 0.9*h1(fi*4.4)));
        vec2 pos = em + vel*ag + vec2(0.0, -2.2)*ag*ag;
        vec2 vv = vel + vec2(0.0, -4.4)*ag;
        float m = exp(-pow(seg(raw, pos, pos - vv*0.035), 2.0)/0.00002);
        glow(mix(vec3(1.0, 0.95, 0.7), vec3(1.0, 0.45, 0.1), ag*2.0)*m*(1.0 - ag/0.55)*1.6);
      }
      if (contact > 0.0) {
        vec2 cp1 = raw - (cB + vec2(-0.03, 0.31)), cp2 = raw - (cB + vec2(-0.03, -0.31));
        glow(vec3(1.0, 0.6, 0.2)*(exp(-dot(cp1, cp1)/0.002) + exp(-dot(cp2, cp2)/0.002))*contact*0.8);
      }
    }
  } else if (uW == 2) {
    for (int i = 0; i < 8; i += 2) {
      float fi = float(i), hh = h1(fi*4.1 + 7.0), per = 6.0 + 3.0*h1(fi + 3.0);
      float f = fract(uT/per + hh);
      vec2 pos = vec2((hh - 0.5)*2.6 + 0.22*sin(uT*0.9 + hh*6.0), 1.75 - f*3.5);
      float ang = sin(uT*1.3 + hh*5.0)*1.2 + hh*6.0;
      vec2 lp = rot(-ang)*(uv - pos);
      lp.x /= 0.35 + 0.65*abs(cos(uT*2.0 + hh*7.0));
      float wv = 0.06*(1.0 - pow(lp.x/0.13, 2.0));
      float m = smoothstep(px*1.5, 0.0, abs(lp.y) - wv)*step(abs(lp.x), 0.13);
      vec3 lc = h1(fi*2.3) < 0.33 ? vec3(0.78, 0.52, 0.14) : (h1(fi*2.3) < 0.66 ? vec3(0.66, 0.25, 0.09) : vec3(0.45, 0.48, 0.15));
      lc *= 0.6 + 0.4*fl + 0.25*smoothstep(-0.2, -1.2, pos.y) - 0.3*smoothstep(0.006, 0.0, abs(lp.y));
      over(lc, m*0.95);
    }
    for (int i = 0; i < 9; i++) {
      float fi = float(i), hh = h1(fi*6.7 + 90.0);
      float f = fract(uT*0.28 + hh);
      vec2 pp = vec2((hh - 0.5)*0.7 + 0.12*sin(uT*1.7 + hh*9.0), -1.45 + f*2.6);
      vec2 q = uv - pp;
      glow(mix(vec3(1.0, 0.8, 0.4), vec3(0.9, 0.2, 0.05), f)*exp(-dot(q, q)/0.00012)*(1.0 - f)*(0.6 + 0.4*sin(uT*9.0 + hh*20.0)));
    }
  } else {
    float th = uT*1.1;
    vec2 e = uv/vec2(1.0, 0.32);
    float a = atan(e.y, e.x);
    float df = abs(mod(a - atan(sin(th), cos(th)) + 3.14159, 6.28318) - 3.14159);
    float rr = length(e);
    float wedge = smoothstep(0.36, 0.0, df)*smoothstep(0.55, 0.95, rr)*exp(-(rr - 0.9)*0.6);
    if (sin(th) <= 0.0) glow(mix(uTop, vec3(1.0), 0.35)*wedge*0.9*(0.45 + 0.55*max(-sin(th), 0.0)));
    float flash = pow(max(-sin(th), 0.0), 40.0);
    glow(mix(uTop, vec3(1.0), 0.5)*flash*0.4*exp(-length(uv)*1.2));
    float dummy;
    glow(bolt(uv, true, dummy));
  }

  if (uW == 1) {
    if (swap) P = P.gbr;
    P *= 0.84 + 0.16*step(0.5, fract(gl_FragCoord.y*0.5));
  }
  float edge = smoothstep(1.0, 0.82, length(raw)/uZ);
  o = vec4(clamp(P, 0.0, 1.0)*edge, A*edge);
}`;
  function rot3(T, world) {
    /* a slow tumble that never repeats: the ring's axis leans toward the
       viewer and sways, and the ring turns about it */
    const S = world === 'dawn' ? 0.6 : world === 'gold' ? 1.1 : 1;
    const ax = -1.05 + 0.32 * Math.sin(T * 0.21 * S), ay = 0.45 * Math.sin(T * 0.17 * S + 1.0), az = T * 0.12 * S;
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
    /* R = Ry(ay) * Rx(ax) * Ry(az), column major for GLSL */
    const Ry1 = [cz, 0, -sz, 0, 1, 0, sz, 0, cz];
    const Rx = [1, 0, 0, 0, cx, sx, 0, -sx, cx];
    const Ry2 = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
    const mul = (A, B) => { const C = new Array(9); for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) { let s2 = 0; for (let k = 0; k < 3; k++) s2 += A[k * 3 + r] * B[c * 3 + k]; C[c * 3 + r] = s2; } return C; };
    return mul(Ry2, mul(Rx, Ry1));
  }
  function triplet(name, fb) {
    const v = (rgbVar(name, fb) || fb).split(',').map(x => parseFloat(x) / 255);
    return v.length === 3 && v.every(x => isFinite(x)) ? v : fb.split(',').map(x => parseFloat(x) / 255);
  }
  function lighten(c, k) { return c.map(x => x + (0.86 - x) * k); }
  function glInit(cv) {
    let gl = null;
    try { gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
    if (!v || !f) return null;
    const pr = gl.createProgram();
    gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    for (const n of ['uRes', 'uT', 'uW', 'uRot', 'uTop', 'uBot', 'uZ']) u[n] = gl.getUniformLocation(pr, n);
    return { gl, u };
  }
  function glFree(g) {
    if (!g.gl) return;
    try { const x = g.gl.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) { /* gone already */ }
    g.gl = null;
  }
  /* the orb's canvas is larger than its span, so what each world throws off
     (sparks, stars, the beam, the hearth, leaves, drops) has room round it */
  const ORB_Z = 1.6;
  const WORLD_ID = { deepfield: 0, midnight: 1, dawn: 2, gold: 3 };
  function drawGL(g, T, world) {
    const { gl, u } = g.gl, cv = g.cv;
    const coarse = world === 'midnight';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = Math.max(16, Math.round(g.size * ORB_Z * (coarse ? 0.5 : dpr)));
    if (cv.width !== px) { cv.width = px; cv.height = px; cv.style.imageRendering = coarse ? 'pixelated' : ''; }
    gl.viewport(0, 0, px, px);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const Tq = coarse ? Math.floor(T * 6) / 6 : T;
    gl.uniform2f(u.uRes, px, px);
    gl.uniform1f(u.uT, T);
    gl.uniform1f(u.uZ, ORB_Z);
    gl.uniform1i(u.uW, WORLD_ID[world] || 0);
    gl.uniformMatrix3fv(u.uRot, false, rot3(Tq, world));
    gl.uniform3fv(u.uTop, lighten(triplet('--atmc', '47,79,214'), 0.7));
    gl.uniform3fv(u.uBot, lighten(triplet('--atmc2', '242,214,158'), 0.45));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function draw(g, T) {
    const world = worldOf();
    if (g.gl) { drawGL(g, T, world); return; }
    const cv = g.cv, ctx = g.ctx;
    const css = g.size, dpr = Math.min(3, window.devicePixelRatio || 1);
    const px = Math.round(css * dpr);
    if (cv.width !== px) { cv.width = px; cv.height = px; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, px, px);
    ctx.setTransform(px / 24, 0, 0, px / 24, 0, 0);
    const ink = g.ink;
    const Tq = world === 'midnight' ? Math.floor(T * 8) / 8 : T;
    const speed = world === 'dawn' ? 0.6 : world === 'gold' ? 1.15 : 1;
    const f = form(Tq * speed);
    const loops = LEVELS.map(([t]) => contour(f, t, Tq, world));

    if (world === 'midnight') {
      /* TECH ROT. Snapped to a pixel grid, a ghost in the identity's aqua, lines
         dropping out a segment at a time, and now and then a band of the ring
         shoved sideways. */
      const step = 1.0, snap = v => Math.round(v / step) * step;
      const glitch = (Math.floor(T * 1.4) % 3 === 0) && (T * 1.4 % 1) < 0.22;
      const gy = 4 + hash(Math.floor(T * 1.4)) * 14, gdx = (hash(Math.floor(T * 1.4) + 9) - 0.5) * 5;
      const warp = p => [snap(p[0] + (glitch && p[1] > gy && p[1] < gy + 3.5 ? gdx : 0)), snap(p[1])];
      const seg = (pts, w, colour, dx) => {
        ctx.strokeStyle = colour; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
        ctx.beginPath();
        const tick = Math.floor(T * 3);
        for (let i = 0; i < pts.length; i++) {
          const a = warp(pts[i]), b = warp(pts[(i + 1) % pts.length]);
          if (hash(i * 7 + tick + w * 13) < 0.1) continue;
          ctx.moveTo(a[0] + dx, a[1]); ctx.lineTo(b[0] + dx, b[1]);
        }
        ctx.stroke();
      };
      const acc = 'rgba(' + rgbVar('--atmc', '90,200,255') + ',.55)';
      loops.forEach((pts, i) => seg(pts, LEVELS[i][1], acc, 0.8));
      loops.forEach((pts, i) => seg(pts, LEVELS[i][1], ink, 0));
      return;
    }

    if (world === 'deepfield' || world === 'gold') {
      /* a glow under the lines: the same lines wide and faint, never a filter */
      const glow = world === 'gold' ? 'rgba(' + rgbVar('--atmc', '95,247,255') + ',.32)' : ink;
      ctx.save();
      if (world === 'deepfield') ctx.globalAlpha = 0.16;
      ctx.strokeStyle = glow; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      /* the Biome's glow sits on the rim only, or the contours drown in it */
      loops.forEach((pts, i) => {
        if (world === 'gold' && i !== 0) return;
        ctx.lineWidth = LEVELS[i][1] + (world === 'gold' ? 1.6 : 2.4); ctx.beginPath(); smooth(ctx, pts); ctx.stroke();
      });
      ctx.restore();
    }

    ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (world === 'dawn') {
      /* by hand: each line thickens and thins along its length */
      loops.forEach((pts, li) => {
        const base = LEVELS[li][1];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          ctx.lineWidth = base * (0.75 + 0.45 * (0.5 + 0.5 * Math.sin(i / N * TAU * 3 + li * 2 + T * 0.3)));
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
      });
      return;
    }
    loops.forEach((pts, i) => { ctx.lineWidth = LEVELS[i][1]; ctx.beginPath(); smooth(ctx, pts); ctx.stroke(); });

    if (world === 'deepfield') {
      /* COSMIC FLARE. Sparks run the two inner contours, and a four point star
         in the horizon's warm light flares at one lobe and fades. */
      const warm = rgbVar('--atmc2', '242,214,158');
      [[1, 0.09, 0], [2, -0.07, 2.1], [1, 0.05, 4.2]].forEach(([li, sp, off]) => {
        const pts = loops[li], k = ((T * sp + off / TAU) % 1 + 1) % 1, p = pts[Math.floor(k * N) % N];
        ctx.fillStyle = 'rgba(' + warm + ',.95)';
        ctx.beginPath(); ctx.arc(p[0], p[1], 0.85, 0, TAU); ctx.fill();
      });
      const cyc = (T / 4.5) % 1, pulse = Math.max(0, Math.sin(cyc * Math.PI));
      if (pulse > 0.02) {
        const lobe = Math.floor(T / 4.5) % 3, a = f.rot + lobe * TAU / 3;
        const p = point(f, 0, a, T, world), s = 1.0 + 2.4 * pulse;
        ctx.save();
        ctx.translate(p[0], p[1]); ctx.rotate(T * 0.4);
        ctx.fillStyle = 'rgba(' + warm + ',' + (0.9 * pulse).toFixed(3) + ')';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const rr = i % 2 ? s * 0.18 : s, aa = i / 8 * TAU;
          ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    } else if (world === 'gold' && !held) {
      /* drops gather at the lowest point of the rim and fall away */
      const rim = loops[0];
      let low = rim[0]; for (const p of rim) if (p[1] > low[1]) low = p;
      if (drops.length < 3 && hash(Math.floor(T * 2.3)) > 0.6 && !drops.some(d => d.born === Math.floor(T * 2.3)))
        drops.push({ x: low[0] + (hash(T) - 0.5) * 3, y: low[1], v: 0, born: Math.floor(T * 2.3), r: 0.9 });
      ctx.fillStyle = ink;
      drops = drops.filter(d => d.y < 25 && d.r > 0.1);
      for (const d of drops) {
        d.v += 0.03; d.y += d.v; d.r *= 0.985;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
      }
    }
  }

  function inkOf(g) {
    /* The template's own token, resolved through the canvas's colour. The
       inline value is read every frame (it costs nothing); the resolved
       colour only when that value changes or the identity does. */
    const tok = g.span.style.backgroundColor || 'currentColor';
    if (g.tok !== tok || !g.ink) { g.cv.style.color = tok; g.tok = tok; g.ink = getComputedStyle(g.cv).color; }
    return g.ink;
  }

  function attach(span) {
    for (const g of glyphs) if (g.span === span) return;
    let cv = span.querySelector('canvas[data-glyph]');
    if (!cv) {
      cv = document.createElement('canvas');
      cv.setAttribute('data-glyph', '');
      cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block';
      span.appendChild(cv);
    }
    let glx = null;
    if (span.hasAttribute('data-glyph-orb') && !cv.hasAttribute('data-glyph-flat')) {
      glx = glInit(cv);
      if (!glx) {
        /* a canvas that has handed out a WebGL context cannot give a 2D one,
           so the flat fallback gets a fresh canvas */
        const flat = cv.cloneNode(false);
        flat.setAttribute('data-glyph-flat', '');
        cv.replaceWith(flat); cv = flat;
      }
    }
    if (glx) { const m = (ORB_Z - 1) * 50; cv.style.cssText = 'position:absolute;left:-' + m + '%;top:-' + m + '%;width:' + (ORB_Z * 100) + '%;height:' + (ORB_Z * 100) + '%;pointer-events:none;display:block'; }
    const ctx = glx ? null : cv.getContext('2d');
    if (!glx && !ctx) { cv.remove(); return; }
    const g = { span, cv, ctx, gl: glx, size: span.getBoundingClientRect().width || 21, ink: '', tok: '', seen: true };
    if (glx) span.setAttribute('data-glyph-3d', '');
    g.ink = inkOf(g);
    glyphs.add(g);
    observers();
    if (sizeObs) sizeObs.observe(span);
    if (seeObs) seeObs.observe(span);
    span.setAttribute('data-glyph-live', '');
  }

  function scan() {
    if (!root) return;
    for (const g of [...glyphs]) {
      if (!g.span.isConnected || !g.cv.isConnected) {
        glFree(g);
        glyphs.delete(g);
        if (sizeObs) sizeObs.unobserve(g.span);
        if (seeObs) seeObs.unobserve(g.span);
        if (g.span.isConnected) { g.span.removeAttribute('data-glyph-live'); g.span.removeAttribute('data-glyph-3d'); }
      }
    }
    if (worldOf() === 'hc') {
      for (const g of glyphs) { glFree(g); g.span.removeAttribute('data-glyph-live'); g.span.removeAttribute('data-glyph-3d'); g.cv.remove(); }
      glyphs.clear();
      return;
    }
    root.querySelectorAll('[data-icon="oracle"]').forEach(attach);
  }

  let lastWorld = '';
  function frame(now) {
    raf = 0;
    if (!root) return;
    if (document.hidden) return;
    if (now - last >= 33) {
      last = now;
      const T = (now - t0) / 1000;
      const world = worldOf();
      if (world !== lastWorld) { lastWorld = world; drops = []; scan(); }
      for (const g of glyphs) {
        if (!g.seen || !g.size) continue;
        if (!g.gl) inkOf(g);
        draw(g, T);
      }
    }
    if (!held) raf = requestAnimationFrame(frame);
  }

  /* Under reduced motion: one settled frame, redrawn only when something it
     depends on (the identity, the active tab, a new span) changes. */
  function still() {
    held = true;
    const T = 3.0;
    for (const g of glyphs) { if (!g.gl) inkOf(g); if (g.size) draw(g, T); }
  }

  function kick() {
    readToks();
    for (const g of glyphs) g.ink = '';
    scan();
    if (reduced()) { still(); return; }
    held = false;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function onVis() { if (!document.hidden) kick(); }

  window.OracleGlyph = {
    sync(el, stillMode) {
      if (!el || typeof document === 'undefined') return;
      stillWanted = !!stillMode;
      if (root !== el) {
        if (root) this.stop();
        root = el; t0 = performance.now(); last = 0;
        /* A render can replace the nav span, so new spans are looked for as
           the tree changes; the scan is one selector and costs nothing when
           every span is already drawn. */
        obs = new MutationObserver(() => { scan(); if (held) still(); });
        obs.observe(root, { childList: true, subtree: true });
        document.addEventListener('visibilitychange', onVis);
      }
      lastWorld = '';
      kick();
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (obs) obs.disconnect();
      obs = null;
      document.removeEventListener('visibilitychange', onVis);
      for (const g of glyphs) { glFree(g); g.span.removeAttribute('data-glyph-live'); g.span.removeAttribute('data-glyph-3d'); g.cv.remove(); }
      glyphs.clear();
      if (sizeObs) sizeObs.disconnect();
      if (seeObs) seeObs.disconnect();
      sizeObs = seeObs = null;
      root = null;
    },
  };

  /* Helmet scripts load async, so the app's first worldSync() may have run
     before this file existed. Catch up once if the app is already there. */
  try {
    const r = document.querySelector('[data-app-root]'), app = window.__incommonApp;
    if (r && app) window.OracleGlyph.sync(r, typeof app.motionOff === 'function' ? app.motionOff() : false);
  } catch (e) { /* the app's own worldSync() will call again */ }
})();
