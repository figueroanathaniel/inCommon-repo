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

  function draw(g, T) {
    const world = worldOf();
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
    const ctx = cv.getContext('2d');
    if (!ctx) { cv.remove(); return; }
    const g = { span, cv, ctx, size: span.getBoundingClientRect().width || 21, ink: '', tok: '', seen: true };
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
        glyphs.delete(g);
        if (sizeObs) sizeObs.unobserve(g.span);
        if (seeObs) seeObs.unobserve(g.span);
        if (g.span.isConnected) g.span.removeAttribute('data-glyph-live');
      }
    }
    if (worldOf() === 'hc') {
      for (const g of glyphs) { g.span.removeAttribute('data-glyph-live'); g.cv.remove(); }
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
        inkOf(g);
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
    for (const g of glyphs) { inkOf(g); if (g.size) draw(g, T); }
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
      for (const g of glyphs) { g.span.removeAttribute('data-glyph-live'); g.cv.remove(); }
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
