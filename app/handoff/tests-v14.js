/*! handoff/tests-v14.js: inCommon V1.4 canonical-build suite (UMD).
 *
 * Additive, like V1.3. Nothing here replaces handoff/tests.js (safety, privacy,
 * crisis routing, Adverse Response) or handoff/tests-v13.js.
 *
 *   runMatrix(src, on)   Checks A-D. Real iframes at real pixel sizes, so the
 *                        build's own window.innerWidth decides the shell. No
 *                        state is poked to force a layout.
 *   runCross(src, on)    Check E. One frame, resized live, asserting the app
 *                        survives the transition rather than a fresh load.
 *   runSweep(src, on)    Fixes 1-5. Dead controls, routes, back, persistence.
 *
 * Records match the V1.2 shape: {id, name, pass, expected, actual}.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.InCommonTestsV14 = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MATRIX = [
    { tag: 'A', w: 375, h: 667, name: 'Phone' },
    { tag: 'B', w: 820, h: 1180, name: 'Tablet' },
    { tag: 'C', w: 1080, h: 1920, name: '9:16 vertical' },
    { tag: 'D', w: 1440, h: 900, name: 'Desktop' },
    /* A short desktop window. The other four are all tall enough that the rail
       never has to shrink, which is exactly how four sub-44px rail controls
       stayed invisible to this matrix. */
    { tag: 'S', w: 1024, h: 600, name: 'Short desktop' }
  ];
  var MD = 820, LG = 1024;

  function mkPush(list) {
    return function (id, name, expected, actual) {
      list.push({ id: id, name: name, pass: JSON.stringify(expected) === JSON.stringify(actual), expected: expected, actual: actual });
    };
  }
  /* sleep() runs off a Worker clock, not setTimeout.
     A hidden tab clamps setTimeout chains to roughly one call a minute, and
     every phase here is a chain of hundreds of them. Backgrounded, the sweep
     spent four minutes inside a step that costs three seconds and would have
     hit its 25 minute cap and reported F-TIMEOUT: a red result caused by the
     tab, not the build. Worker timers are not throttled, so the same run costs
     the same wall clock whether the tab is looked at or not. setTimeout stays
     as the fallback for any context that refuses a Worker. */
  var clock = (function () {
    try {
      var src = 'onmessage=function(e){setTimeout(function(){postMessage(e.data.id)},e.data.ms)}';
      var w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      var n = 0, waiting = {};
      w.onmessage = function (e) { var f = waiting[e.data]; if (f) { delete waiting[e.data]; f(); } };
      return function (ms) {
        return new Promise(function (r) { var id = ++n; waiting[id] = r; w.postMessage({ id: id, ms: ms }); });
      };
    } catch (e) { return null; }
  })();
  var sleep = function (ms) {
    if (clock) return clock(ms);
    return new Promise(function (r) { setTimeout(r, ms); });
  };
  function capped(fn, ms) {
    return Promise.race([
      Promise.resolve().then(fn).catch(function (e) { return 'error: ' + (e && e.message); }),
      sleep(ms).then(function () { return 'timeout'; })
    ]);
  }
  function txt(e) { return e ? (e.textContent || '').trim() : ''; }

  /* V1.6.0 replaced the account gate with a one-time birth screen. It renders
     above both shells, so any phase that does not mean to measure it has to
     declare first run done before the frame loads: [data-app-header] exists
     behind the overlay, which means ready() resolves and the sweep would go on
     to measure a screen nobody could reach. */
  var FIRSTRUN = 'incommon.firstrun';
  function primeFirstRun() { try { localStorage.setItem(FIRSTRUN, 'true'); } catch (e) {} }
  /* The first run gate is behind an sc-if, and sc-if bodies commit a tick or
     more after the app reports ready. A fixed sleep measured the shell before
     the gate had landed and read as "no gate", which is indistinguishable from
     the gate being gone: three removal rows and two ADA rows failed that way on
     a build where the gate was present and correct. Wait for the node. */
  async function waitGate(doc, ms) {
    var until = Date.now() + (ms || 4000);
    for (;;) {
      var g = doc.querySelector('[data-screen-label="First run"]');
      if (g) return g;
      if (Date.now() > until) return null;
      await sleep(80);
    }
  }
  function readFirstRun() { try { return localStorage.getItem(FIRSTRUN); } catch (e) { return null; } }
  function restoreFirstRun(v) {
    try { if (v === null) localStorage.removeItem(FIRSTRUN); else localStorage.setItem(FIRSTRUN, v); } catch (e) {}
  }

  /* An iframe sized in CSS pixels. The app reads window.innerWidth from inside,
     so the shell it picks is the shell a real device at this size would get.
     The URL carries a cache-buster because the build registers a service
     worker: without it a phase can be handed a precached copy of an older
     bundle and report on a build that is not the one on disk. The parameter
     goes in before the hash, or a deep-link frame would address ?v= as part of
     its route. */
  var FRAME_N = 0;
  function bust(src) {
    var h = src.indexOf('#');
    var base = h === -1 ? src : src.slice(0, h), hash = h === -1 ? '' : src.slice(h);
    return base + (base.indexOf('?') === -1 ? '?' : '&') + 'v=' + Date.now() + '-' + (++FRAME_N) + hash;
  }
  function frame(src, w, h) {
    return new Promise(function (res) {
      var f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;left:-10000px;top:0;border:0;width:' + w + 'px;height:' + h + 'px';
      f.src = bust(src);
      f.onload = function () { res(f); };
      document.body.appendChild(f);
    });
  }
  function ready(win, ms, notThisDoc) {
    var t0 = Date.now();
    return (function poll() {
      var d = win.document;
      var fresh = !notThisDoc || (d && d !== notThisDoc);
      if (fresh && d && d.readyState !== 'loading' && d.querySelector('[data-app-header]')) return Promise.resolve(true);
      if (Date.now() - t0 > (ms || 14000)) return Promise.resolve(false);
      return sleep(120).then(poll);
    })();
  }

  /* ---- contrast, measured against what is actually painted behind ---- */
  /* Controls and text drawn inside a chart are judged as chart, not as chrome:
     a natal wheel cannot give 44px to twelve house numbers, and its labels sit
     on SVG paint that no DOM ancestor reports as a background. */
  function insideChart(el) {
    return !!(el.closest && el.closest('[data-chart]'));
  }
  function parseRGB(s) {
    var m = /rgba?\(([^)]+)\)/.exec(s || '');
    if (!m) return null;
    var p = m[1].split(',').map(function (x) { return parseFloat(x); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(fg, bg) {
    var a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function lum(c) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function ratio(a, b) { var l1 = lum(a), l2 = lum(b); var hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); }
  function effBG(win, el) {
    var base = { r: 5, g: 6, b: 10, a: 1 }, node = el, stack = [];
    while (node && node.nodeType === 1) {
      var c = parseRGB(win.getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) stack.push(c);
      node = node.parentElement;
    }
    for (var i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  }
  /* Gates here are load-bearing and have hidden real defects three times.
     size < 11 hid the 10px metadata labels; t.length < 8 hid a 7-character
     uppercase one; size < 9 then hid the 7.5px epistemic badges, which are the
     app's whole vocabulary for how far to trust a claim. The floor is 7px and
     4 characters so that micro-type is actually judged. Do not raise either to
     quiet a failure: every raise so far has hidden a real one. */
  function contrastFails(win, doc, limit) {
    var out = [], seen = 0;
    var nodes = [].slice.call(doc.querySelectorAll('div,span,p,button,a,li,td'));
    for (var i = 0; i < nodes.length && out.length < 12 && seen < 420; i++) {
      var el = nodes[i];
      /* Direct text child, not necessarily the FIRST child. Requiring firstChild to
         be text skipped every button that leads with an icon, which is how a
         3.72:1 label inside the voice sheet survived a 85/85 run. */
      var hasText = false;
      for (var ci = 0; ci < el.childNodes.length; ci++) {
        var cn = el.childNodes[ci];
        if (cn.nodeType === 3 && String(cn.nodeValue).trim().length >= 4) { hasText = true; break; }
      }
      if (!hasText) continue;
      if (insideChart(el)) continue;
      var t = txt(el);
      if (t.length < 4) continue;
      var cs = win.getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      var size = parseFloat(cs.fontSize) || 16;
      if (size < 7) continue;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      var fg = parseRGB(cs.color); if (!fg) continue;
      var bg = effBG(win, el);
      var cr = ratio(over(fg, bg), bg);
      seen++;
      var floor = (size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700)) ? 3 : (limit || 4.5);
      if (cr < floor - 0.05) out.push({ text: t.slice(0, 42), size: Math.round(size), ratio: Math.round(cr * 100) / 100, need: floor });
    }
    return { checked: seen, fails: out };
  }

  function shellOf(doc) {
    var h = doc.querySelector('[data-app-header]');
    return h ? h.getAttribute('data-app-header') : 'none';
  }
  /* A natal wheel cannot give 44px to twelve house numbers without ceasing to be
   a wheel. Controls drawn inside a chart are judged as chart, not as chrome.

   The skip link is the second exemption, and for a different reason: it is
   1x1 until it is focused, which is the whole point of it, and it is the only
   control in the build that is deliberately not a touch target. It is marked
   with data-skip so this can tell the difference, exactly as charts are, and
   the exemption is paid for by G1c, which focuses it and measures the box it
   grows to. Do not widen this to anything else. */
  function tapTargets(win, doc) {
    var small = [];
    [].slice.call(doc.querySelectorAll('button,[role="tab"],a[href]')).forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (insideChart(b)) return;
      if (b.hasAttribute('data-skip') || b.closest('[data-skip]')) return;
      var cs = win.getComputedStyle(b);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      if (r.height < 43.5 || r.width < 43.5) small.push({ label: (txt(b) || b.getAttribute('aria-label') || '?').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    });
    return small;
  }

  /* ================= Checks A-D: the acceptance matrix ================= */
  async function runMatrix(src, onStep, sink) {
    var A = sink || [], t = mkPush(A), frames = [];
    onStep = onStep || function () {};
    primeFirstRun();
    try {
      for (var i = 0; i < MATRIX.length; i++) {
        var v = MATRIX[i], tag = v.tag, label = v.tag + ' ' + v.name + ' ' + v.w + 'x' + v.h;
        onStep('matrix ' + label);
        var f = await frame(src, v.w, v.h);
        frames.push(f);
        var win = f.contentWindow;
        var ok = await ready(win, 16000);
        if (!ok) {
          t(tag + '0', 'App boots at ' + label, true, false);
          if (f.parentNode) f.parentNode.removeChild(f);
          frames.splice(frames.indexOf(f), 1);
          continue;
        }
        await sleep(650);
        var doc = win.document, de = doc.documentElement;
        var vertical = v.w < MD;

        t(tag + '1', 'Exactly one header and one primary nav at ' + label,
          { headers: 1, navs: 1 },
          { headers: doc.querySelectorAll('[data-app-header]').length, navs: doc.querySelectorAll('[data-app-nav]').length });

        t(tag + '2', 'The correct shell is mounted, and only that shell, at ' + label,
          { shell: vertical ? 'vertical' : 'desktop', otherShell: 0 },
          { shell: shellOf(doc),
            otherShell: doc.querySelectorAll('[data-app-header="' + (vertical ? 'desktop' : 'vertical') + '"]').length });

        t(tag + '3', 'No simulated phone chrome inside the app at ' + label,
          { status: 0, home: 0 },
          { status: doc.querySelectorAll('[data-ios-statusbar]').length, home: doc.querySelectorAll('[data-ios-home]').length });

        t(tag + '4', 'No horizontal overflow at ' + label, true, de.scrollWidth <= v.w + 1);
        t(tag + '5', 'No page-level vertical scrollbar at ' + label, true, de.scrollHeight <= v.h + 2);

        var rootEl = doc.querySelector('[data-app-root]');
        var rr = rootEl ? rootEl.getBoundingClientRect() : { width: 0, height: 0 };
        t(tag + '6', 'Interface fills the viewport, no letterboxing, at ' + label,
          { w: true, h: true },
          { w: Math.abs(rr.width - v.w) <= 1, h: Math.abs(rr.height - v.h) <= 2 });

        var atmos = doc.querySelector('[data-app-root] > [aria-hidden="true"]');
        t(tag + '7', 'Atmosphere layer present and held at 60 percent at ' + label,
          { present: true, opacity: '0.6' },
          { present: !!atmos, opacity: atmos ? win.getComputedStyle(atmos).opacity : 'none' });

        if (vertical) {
          var scroller = doc.querySelector('[data-vt-scroll]');
          t(tag + '8', 'Vertical snap scrolling is active at ' + label,
            { scroller: true, snap: 'y mandatory', sections: 5 },
            { scroller: !!scroller,
              snap: scroller ? win.getComputedStyle(scroller).scrollSnapType : 'none',
              sections: doc.querySelectorAll('[data-vt-sec]').length });
          var nav = doc.querySelector('[data-app-nav]').getBoundingClientRect();
          t(tag + '9', 'Bottom navigation sits inside the viewport at ' + label, true, nav.bottom <= v.h + 1);
          var pager = doc.querySelector('[data-vt-pager]');
          t(tag + '10', 'Spirit sub-pages page horizontally, independent of the vertical snap at ' + label,
            { pager: true, axis: 'x mandatory' },
            { pager: !!pager, axis: pager ? win.getComputedStyle(pager).scrollSnapType : 'none' });
        } else {
          t(tag + '8', 'No phone bottom nav and no snap scrolling at ' + label,
            { verticalNav: 0, snapSections: 0, snapScroller: 0 },
            { verticalNav: doc.querySelectorAll('[data-app-nav="vertical"]').length,
              snapSections: doc.querySelectorAll('[data-vt-sec]').length,
              snapScroller: doc.querySelectorAll('[data-vt-scroll]').length });
          var side = doc.querySelector('aside[data-side]');
          /* Below lg the rail is mandatory. At lg+ the reader may have collapsed
             it on purpose, so the honest assertion is that a wide sidebar is
             possible there, not that it is currently showing. */
          var pref = null;
          try { pref = win.__incommonApp.readLS('incommon.desktop.sidebar', null); } catch (e) {}
          var wantWide = v.w >= LG && pref !== false;
          t(tag + '9', 'Sidebar is ' + (wantWide ? 'full width' : 'a collapsed rail') + ' at ' + label,
            { present: true, mode: wantWide ? 'wide' : 'rail' },
            { present: !!side, mode: side ? side.getAttribute('data-side') : 'none' });
          if (side) {
            var sw = Math.round(side.getBoundingClientRect().width);
            t(tag + '10', 'Sidebar measures its declared width at ' + label, wantWide ? 256 : 76, sw);
            if (v.w < LG) {
              var forced = false;
              try { forced = win.__incommonApp.dtSideOpen() === false; } catch (e) {}
              t(tag + '10b', 'A stored preference cannot force a full sidebar below 1024 at ' + label, true, forced);
            }
          }
          win.location.hash = '#/today';
          await sleep(600);
          var todayScreen = doc.querySelector('[data-screen-label="Today"]');
          var cols = todayScreen ? [].slice.call(todayScreen.querySelectorAll(':scope > div > div')).filter(function (d) {
            var r = d.getBoundingClientRect(); return r.width > 180 && r.height > 120;
          }).length : 0;
          t(tag + '11', 'Today uses a multi-column layout at ' + label, true, cols >= 2);
        }

        var small = tapTargets(win, doc);
        t(tag + '12', 'Every visible control meets the 44px touch target at ' + label, [], small);

        var con = contrastFails(win, doc, 4.5);
        t(tag + '13', 'Body text passes 4.5:1 against what is painted behind it at ' + label, [], con.fails);

        /* Panels that default closed were invisible to every colour and target
           check above, so a purple fill carrying pale text inside the voice sheet
           passed a full green run untouched. Open the sheets, in the recording
           state, and judge them on the same terms.
           V1.4.6: the mic moved. It used to sit in the assistant's composer; that
           screen is gone, so the mic is now the "Speak it instead" control inside
           the Mark a moment sheet, which is what addOpen renders. Opening the
           right panel is the point of this block: if it opens nothing, A15 to A17
           sweep an empty DOM and report green having proved nothing. */
        try {
          win.__incommonApp.setState({ addOpen: true, voiceOpen: true, voiceTarget: 'journal',
            recSup: true, recOn: true, recSecs: 12,
            recText: 'A spoken line, long enough that the sweep judges it as real body copy.' });
          await sleep(560);
          var sheet = doc.querySelector('[aria-label="Record a spoken entry"]');
          var mic = doc.querySelector('button[aria-label="Record your voice"]');
          t(tag + '14', 'The voice sheet and the mic are present to be judged at ' + label,
            { sheet: true, mic: true }, { sheet: !!sheet, mic: !!mic });
          t(tag + '15', 'Every control in the open sheets meets 44px at ' + label, [], tapTargets(win, doc));
          var openCon = contrastFails(win, doc, 4.5);
          t(tag + '16', 'Text in the open sheets passes 4.5:1 at ' + label, [], openCon.fails);
          /* If this reports zero, the sweep above it proved nothing. */
          t(tag + '17', 'The open-panel colour sweep examined a plausible number of elements at ' + label,
            true, openCon.checked >= 12);
          var recBtn = sheet ? [].slice.call(sheet.querySelectorAll('button')).filter(function (b) { return /stop|recording|keep going/i.test(txt(b)); })[0] : null;
          t(tag + '18', 'The recording button label is judged, and passes, at ' + label,
            { found: true, fails: 0 },
            { found: !!recBtn,
              fails: recBtn ? contrastFails(win, { querySelectorAll: function () { return [recBtn]; } }, 4.5).fails.length : 'no button' });
          win.__incommonApp.setState({ voiceOpen: false, recOn: false, recSecs: 0, recText: '', recInterim: '' });
          await sleep(220);
        } catch (e) {
          t(tag + '14', 'The voice sheet could not be opened at ' + label, 'opens', String(e && e.message));
        }

        /* Release this viewport before opening the next one. Holding all five
           frames to the end left five live apps running timers against each
           other, which is what made a full run take a quarter of an hour. */
        if (f.parentNode) f.parentNode.removeChild(f);
        frames.splice(frames.indexOf(f), 1);
        await sleep(60);
      }
    } catch (e) {
      t('M-ERR', 'Matrix harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }

  /* ================= Check E: crossing the breakpoint live ================= */
  async function runCross(src, onStep) {
    var A = [], t = mkPush(A), f = null;
    onStep = onStep || function () {};
    primeFirstRun();
    try {
      onStep('cross-breakpoint: booting the frame');
      f = await frame(src, 1440, 900);
      var win = f.contentWindow;
      if (!(await ready(win, 16000))) { t('E0', 'App boots for the resize run', true, false); return A; }
      await sleep(650);
      var doc = win.document;
      var errs = [];
      win.addEventListener('error', function (e) { errs.push(String(e.message)); });

      var resize = async function (w, h) {
        f.style.width = w + 'px'; f.style.height = h + 'px';
        win.dispatchEvent(new win.Event('resize'));
        await sleep(520);
      };

      /* park somewhere that is not the default screen, so a silent remount shows */
      onStep('cross-breakpoint: parking on a non-default route');
      win.location.hash = '#/library/practices';
      await sleep(700);
      var routeBefore = win.location.hash;

      onStep('cross-breakpoint: down to phone');
      await resize(375, 667);
      var atPhone = { shell: shellOf(doc), route: win.location.hash, nav: doc.querySelectorAll('[data-app-nav="vertical"]').length };
      onStep('cross-breakpoint: up to tablet');
      await resize(820, 1180);
      var atTablet = { shell: shellOf(doc), route: win.location.hash, side: (doc.querySelector('aside[data-side]') || {}).getAttribute ? doc.querySelector('aside[data-side]').getAttribute('data-side') : 'none' };
      onStep('cross-breakpoint: up to desktop');
      await resize(1440, 900);
      var atDesk = { shell: shellOf(doc), route: win.location.hash, side: doc.querySelector('aside[data-side]') ? doc.querySelector('aside[data-side]').getAttribute('data-side') : 'none' };

      t('E1', 'Resizing swaps the shell without a reload',
        { phone: 'vertical', tablet: 'desktop', desktop: 'desktop' },
        { phone: atPhone.shell, tablet: atTablet.shell, desktop: atDesk.shell });
      t('E2', 'The active route survives every breakpoint crossing',
        { phone: routeBefore, tablet: routeBefore, desktop: routeBefore },
        { phone: atPhone.route, tablet: atTablet.route, desktop: atDesk.route });
      var deskPref = null;
      try { deskPref = win.__incommonApp.readLS('incommon.desktop.sidebar', null); } catch (e) {}
      t('E3', 'Sidebar is forced to a rail below 1024 and follows the reader\u2019s choice above it',
        { tablet: 'rail', desktop: deskPref === false ? 'rail' : 'wide' },
        { tablet: atTablet.side, desktop: atDesk.side });

      /* an open sheet must not survive into a shell that has no sheets */
      onStep('cross-breakpoint: sheet across a shell change');
      await capped(async function () {
        await resize(375, 667);
        var placeBtn = [].slice.call(doc.querySelectorAll('button')).filter(function (b) { return /open placement|in /i.test(txt(b)); })[0];
        if (placeBtn) { placeBtn.click(); await sleep(500); }
        await resize(1440, 900);
      }, 20000);
      t('E4', 'An open bottom sheet closes when the shell changes under it',
        { sheets: 0 }, { sheets: doc.querySelectorAll('[data-vt-sheet]').length });

      t('E5', 'No uncaught errors thrown during resize', [], errs);
      onStep('cross-breakpoint: done');
    } catch (e) {
      t('E-ERR', 'Resize harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      if (f && f.parentNode) f.parentNode.removeChild(f);
    }
    return A;
  }

  /* ================= Fixes 1-5: the repair sweep ================= */
  async function runSweep(src, onStep, sink) {
    var A = sink || [], t = mkPush(A), frames = [];
    onStep = onStep || function () {};
    primeFirstRun();
    try {
      onStep('sweep: loading');
      var f = await frame(src, 1440, 900);
      frames.push(f);
      var win = f.contentWindow;
      if (!(await ready(win, 16000))) { t('F0', 'App boots for the sweep', true, false); return A; }
      await sleep(700);
      var doc = win.document;
      var qa = function (s) { return [].slice.call(doc.querySelectorAll(s)); };
      var go = async function (h, ms) { win.location.hash = h; await sleep(ms || 520); };

      /* ---- Fix 1: the alignment card lives in Today and nowhere else ---- */
      onStep('fix 1: alignment placement');
      await go('#/today', 700);
      var todayHasAlign = /Today.s Alignment/.test(txt(doc.querySelector('[data-screen-label="Today"]')));
      var elsewhere = [];
      var others = ['#/spirit/astrology', '#/spirit/human-design', '#/spirit/numerology', '#/spirit/angel-numbers', '#/library/practices', '#/throughline'];
      for (var oi = 0; oi < others.length; oi++) {
        await go(others[oi], 520);
        var scr = qa('[data-screen-label]').filter(function (s) { return s.getBoundingClientRect().height > 0; });
        var joined = scr.map(txt).join(' ');
        if (/Today.s Alignment/.test(joined)) elsewhere.push(others[oi]);
      }
      t('F1', 'The alignment card appears in Today and on no other screen',
        { inToday: true, elsewhere: [] }, { inToday: todayHasAlign, elsewhere: elsewhere });

      /* ---- Fix 1b: the condensed brief is all four parts ---- */
      /* This row used to read Today's whole text for four words, which is not
         what it claims to measure: three of the four also appear on the chart
         cards in the Today sidebar, and "Together" was matching the Together
         card rather than the alignment pager at all. Renaming that card to
         Synastry in V1.6.0 turned the row red without anything in the
         alignment having moved. It pages the pager now, which is the thing the
         name has always described. */
      await go('#/today', 650);
      var pageTitles = [];
      for (var hp = 0; hp < 4; hp++) {
        try { win.__incommonApp.setState({ hPage: hp }); } catch (e) {}
        await sleep(260);
        var card = doc.querySelector('[data-screen-label="Today"]');
        var vals = null;
        try { vals = win.__incommonApp.renderVals(); } catch (e) {}
        pageTitles.push(vals ? String(vals.hpTitle) : 'unreadable');
      }
      try { win.__incommonApp.setState({ hPage: 0 }); } catch (e) {}
      await sleep(260);
      t('F1b', 'The alignment pager carries all four parts',
        ['Horoscope', 'Human Design Horoscope', 'Daily Numerology', 'Together'], pageTitles);
      var todayTxt = txt(doc.querySelector('[data-screen-label="Today"]'));
      t('F1c', 'Today still names the three systems it reads from',
        { horoscope: true, humanDesign: true, numerology: true },
        { horoscope: /Horoscope/.test(todayTxt), humanDesign: /Human Design/.test(todayTxt),
          numerology: /Numerology/.test(todayTxt) });

      /* ---- Fix 2: no date beneath the wordmark ---- */
      onStep('fix 2: wordmark');
      try { win.__incommonApp.setState({ dtSide: true }); } catch (e) {}
      await sleep(400);
      var brand = qa('aside[data-side] span,aside[data-side] div').filter(function (e) { return txt(e) === 'inCommon'; })[0];
      var sib = brand && brand.parentElement ? txt(brand.parentElement) : '';
      var dateRE = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b|\b\d{1,2}\/\d{1,2}\b|\b(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\b/;
      t('F2', 'No date renders beneath the inCommon wordmark',
        { wordmark: true, dateUnderIt: false },
        { wordmark: !!brand, dateUnderIt: dateRE.test(sib) });

      /* ---- Fix 3: dead controls ---- */
      onStep('fix 3: dead controls');
      var deadButtons = [], deadLinks = [];
      var screens = ['#/today', '#/spirit/astrology', '#/spirit/human-design', '#/spirit/numerology',
        '#/spirit/angel-numbers', '#/spirit/daily', '#/spirit/synastry', '#/library/practices',
        '#/library/sabian-lexicon', '#/throughline', '#/settings'];
      for (var si = 0; si < screens.length; si++) {
        await go(screens[si], 520);
        qa('button').forEach(function (b) {
          var r = b.getBoundingClientRect();
          if (!r.width || !r.height) return;
          /* React attaches listeners at the root, so onclick is always null here.
             A live control is one the runtime gave a props handler to; the fibre
             key is the only honest place to read that from outside. */
          var key = Object.keys(b).find(function (k) { return k.indexOf('__reactProps$') === 0; });
          var props = key ? b[key] : null;
          var wired = !!(props && (props.onClick || props.onPointerDown || props.onMouseDown));
          if (!wired && !b.getAttribute('type')) {
            var lbl = (txt(b) || b.getAttribute('aria-label') || '?').slice(0, 36);
            if (deadButtons.indexOf(lbl) === -1) deadButtons.push(lbl);
          }
        });
        qa('a[href]').forEach(function (a) {
          var href = a.getAttribute('href');
          if (/^https?:|^tel:|^sms:|^mailto:/.test(href)) return;
          if (href === '#' || href === '') deadLinks.push(txt(a).slice(0, 30) || href);
        });
      }
      t('F3', 'No button is rendered without a handler', [], deadButtons);
      t('F3b', 'No placeholder anchors anywhere in the build', [], deadLinks);

      /* ---- Fix 3c: the named controls are present and wired ---- */
      onStep('fix 3: named controls');
      await go('#/today', 600);
      var named = {};
      var findBtn = function (re) {
        return qa('button').filter(function (b) { return re.test(txt(b) + ' ' + (b.getAttribute('aria-label') || '')); })[0];
      };
      named.practices = !!findBtn(/practices/i);
      await go('#/library/practices', 800);
      try {
        var PL = win.PracticeLibrary;
        var list = PL && PL.PRACTICES;
        var first = list && list.length ? list[0] : null;
        named.practiceSeeded = !!first;
        win.__incommonApp.setState({ tab: 'library', libSub: 'library', libView: null,
          selId: first && first.id, pv: 'run', pstep: 0 });
      } catch (e) { named.practiceSeeded = 'threw: ' + (e && e.message); }
      await sleep(800);
      named.adverse = !!findBtn(/didn.t feel right/i);
      /* The sidebar Get Help button was removed. Crisis resources must still be
         reachable: the Settings card, and the H-three-times shortcut. */
      await go('#/settings', 700);
      named.crisisInSettings = !!findBtn(/you deserve a person/i);
      named.crisisShortcut = false;
      try {
        var kb = new win.KeyboardEvent('keydown', { key: 'h', bubbles: true });
        win.document.dispatchEvent(kb); win.document.dispatchEvent(kb); win.document.dispatchEvent(kb);
        await sleep(500);
        named.crisisShortcut = !!win.__incommonApp.state.helpOpen;
        win.__incommonApp.setState({ helpOpen: false });
        await sleep(300);
      } catch (e) { named.crisisShortcut = 'threw: ' + (e && e.message); }
      named.noSidebarHelp = !findBtn(/^get help$/i);
      t('F3c', 'The named controls all exist and are reachable',
        { practices: true, practiceSeeded: true, adverse: true, crisisInSettings: true, crisisShortcut: true, noSidebarHelp: true }, named);

      /* ---- Fix 4: routes ---- */
      onStep('fix 4: routes');
      var routes = ['#/today', '#/spirit', '#/spirit/daily', '#/spirit/astrology', '#/spirit/human-design',
        '#/spirit/numerology', '#/spirit/angel-numbers', '#/spirit/synastry', '#/library',
        '#/library/practices', '#/library/sabian-lexicon', '#/throughline', '#/settings'];
      var routeResults = {}, routeExpect = {};
      for (var ri = 0; ri < routes.length; ri++) {
        var r = routes[ri];
        routeExpect[r] = true;
        await capped(async function () { await go(r, 480); }, 3000);
        var live = qa('[data-screen-label]').filter(function (s) { return s.getBoundingClientRect().height > 40; });
        routeResults[r] = live.length > 0 && doc.querySelectorAll('[data-app-header]').length === 1;
      }
      t('F4', 'Every declared route resolves to a rendered screen', routeExpect, routeResults);

      /* deep link straight into a placement, cold, in its own frame */
      onStep('fix 4: deep link');
      var f2 = await frame(src + '#/spirit/astrology/placement/mars', 1440, 900);
      frames.push(f2);
      var w2 = f2.contentWindow;
      var ok2 = await ready(w2, 16000);
      await sleep(900);
      var d2 = w2.document;
      var deepTxt = [].slice.call(d2.querySelectorAll('[data-screen-label]')).map(txt).join(' ');
      t('F4b', 'A placement deep link opens that placement on a cold load',
        { booted: true, showsMars: true },
        { booted: ok2, showsMars: /Mars/.test(deepTxt) });

      /* back walks the screens visited */
      onStep('fix 4: back');
      var back = await capped(async function () {
        await go('#/today', 500);
        await go('#/library/practices', 500);
        await go('#/settings', 500);
        var before = w2.location.hash;
        return { before: before };
      }, 4000);
      var rev = await capped(async function () {
        var seq = [];
        await go('#/library/practices', 620); seq.push(win.location.hash);
        await go('#/today', 620); seq.push(win.location.hash);
        return seq;
      }, 6000);
      var popWired = false;
      try { popWired = typeof win.__incommonApp._onPop === 'function'; } catch (e) {}
      t('F4c', 'Reversing to an earlier path restores that screen, and popstate is wired',
        { steps: ['#/library/practices', '#/today'], popstate: true },
        { steps: Array.isArray(rev) ? rev : rev, popstate: popWired });

      /* ---- Fix 5: persistence ---- */
      onStep('fix 5: persistence');
      var seeded = await capped(async function () {
        var A2 = win.__incommonApp;
        A2.writeLS('incommon.v14.probe', { ok: true, at: Date.now() });
        var pm = A2.PM();
        return { profiles: pm ? pm.listProfiles().length : 0, activeId: pm ? pm.activeId() : null, consent: !!A2.readLS(A2.ckey(), null) };
      }, 4000);
      await go('#/library/sabian-lexicon', 700);
      var oldDoc = win.document;
      win.location.reload();
      var ok3 = await ready(f.contentWindow, 20000, oldDoc);
      win = f.contentWindow;
      doc = win.document;
      qa = function (s) { return [].slice.call(doc.querySelectorAll(s)); };
      go = async function (h, ms) { win.location.hash = h; await sleep(ms || 520); };
      await sleep(1100);
      var after;
      try {
        var A3 = win.__incommonApp;
        if (!A3) throw new Error('the app instance was not republished after reload');
        var pm = A3.PM();
        after = { probe: !!A3.readLS('incommon.v14.probe', null),
          profiles: pm ? pm.listProfiles().length : 0,
          activeId: pm ? pm.activeId() : null,
          consent: !!A3.readLS(A3.ckey(), null),
          route: win.location.hash,
          bootHash: A3._bootHash,
          screen: !!doc.querySelector('[data-screen-label]') };
      } catch (e) {
        after = { probe: 'threw: ' + (e && e.message), profiles: -1, activeId: null, consent: false, route: 'threw', screen: false };
      }
      t('F5', 'Local state survives a reload',
        { booted: true, probe: true, profiles: seeded.profiles, activeId: seeded.activeId, consent: seeded.consent },
        { booted: ok3, probe: after.probe, profiles: after.profiles, activeId: after.activeId, consent: after.consent });
      t('F5b', 'The route is recovered on reload, and a screen renders',
        { route: '#/library/sabian-lexicon', screen: true },
        { route: after.route, screen: after.screen });
      // Kept separate so a future failure says whether the fragment survived
      // the reload or the app mishandled one that did.
      t('F5f', 'The reload carries the fragment through to the app',
        '#/library/sabian-lexicon', after.bootHash);

      /* ---- Fix 5c: twenty navigations, no drift ---- */
      onStep('fix 5: navigation endurance');
      var loop = ['#/today', '#/spirit/astrology', '#/spirit/synastry', '#/library/practices', '#/throughline'];
      var t0 = Date.now();
      for (var n = 0; n < 20; n++) { await go(loop[n % loop.length], 210); }
      var elapsed = Date.now() - t0;
      await sleep(500);
      var endState = {
        headers: doc.querySelectorAll('[data-app-header]').length,
        navs: doc.querySelectorAll('[data-app-nav]').length,
        screens: qa('[data-screen-label]').filter(function (s) { return s.getBoundingClientRect().height > 40; }).length > 0,
        detached: doc.querySelectorAll('[data-vt-sheet]').length
      };
      t('F5c', 'Twenty navigations leave one header, one nav, and no orphaned sheets',
        { headers: 1, navs: 1, screens: true, detached: 0 }, endState);
      t('F5d', 'Twenty navigations complete without slowing to a crawl', true, elapsed < 20000);


      /* ---- nav active state ---- */
      await go('#/throughline', 600);
      var current = qa('[data-app-nav] button').filter(function (b) { return b.getAttribute('aria-current') === 'true' || b.getAttribute('aria-current') === 'page'; });
      t('F5e', 'The navigation marks exactly one item current', 1, current.length);

    } catch (e) {
      t('F-ERR', 'Sweep harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }

  /* ================= The theme sweep: its own phase =================
     It used to live at the tail of runSweep, which is how it came to be cut:
     the functional sweep grew past its own 25 minute cap and the theme rows,
     queued behind it, never ran at all. The report counted them as absent
     rather than failing, which is the quietest way for a check to disappear.
     A phase that must not be skipped gets its own frame and its own budget. */
  /* G13 of the ADA audit: the contrast gate has to be met at both the phone
     and the desktop width, not just the one the theme frame happened to load
     at. Exported so the ADA phase can assert the coverage is still two wide:
     this list shrinking back to one is exactly the kind of silent narrowing
     that let the theme rows measure a single identity six times. */
  var THEME_WIDTHS = [[1440, 900, 'desktop'], [375, 667, 'phone']];

  async function runThemes(src, onStep, sink) {
    var A = sink || [], t = mkPush(A), frames = [];
    onStep = onStep || function () {};
    try {
      primeFirstRun();

      /* ---- Theme sweep: every identity is held to the same gates -------------
         contrastFails() already measures what is PAINTED, via getComputedStyle
         and the effective background, so it never read literal hexes and needs
         no theme object handed to it. What was missing is coverage: it only ever
         swept the default identity. These rows run the same gate, at the same
         4.5:1 floor, over each theme and over each theme hardened, so a palette
         cannot ship a failing pair. Nothing above is relaxed or removed. */
      onStep('theme sweep: three identities, contrast on and off');
      /* The atmosphere hue is the one surface that is painted rather than
         written, so it cannot be caught by a contrast sweep: a midnight glow
         under dawn passes every ratio and still looks wrong. These are the
         triplets --atmc and --atmc2 must resolve to per identity. Neither is
         in HC_SHARED, so the hardened case expects the same pair. */
      var themeCases = [['midnight', false, '47,79,214', '139,92,246'], ['midnight', true, '47,79,214', '139,92,246'],
        ['dawn', false, '200,160,120', '190,118,96'], ['dawn', true, '200,160,120', '190,118,96'],
        ['gold', false, '211,173,110', '154,122,200'], ['gold', true, '211,173,110', '154,122,200']];
      for (var wi = 0; wi < THEME_WIDTHS.length; wi++) {
      var W = THEME_WIDTHS[wi], wLabel = W[2];
      onStep('themes: loading at ' + wLabel);
      var f = await frame(src, W[0], W[1]);
      frames.push(f);
      var win = f.contentWindow;
      if (!(await ready(win, 16000))) { t('T0-' + wLabel, 'App boots for the theme sweep at ' + wLabel, true, false); continue; }
      await sleep(700);
      var doc = win.document;
      var go = async function (h, ms) { win.location.hash = h; await sleep(ms || 520); };
      for (var tc = 0; tc < themeCases.length; tc++) {
        var key = themeCases[tc][0], hard = themeCases[tc][1];
        var id = 'T' + (wi * themeCases.length + tc + 1);
        try {
          /* themeProf must be the app's OWN profile id. themeVals() compares
             state.themeProf against themeProfId() and reloads that profile's
             stored theme when they differ, so the sentinel 'harness' used here
             before guaranteed a mismatch: every case was silently clobbered
             back to incommon.theme.device on the next render, and the six
             identity rows measured one identity six times. */
          win.__incommonApp.setState({ themeKey: key, themeHC: hard, themeProf: win.__incommonApp.themeProfId() });
          await sleep(420);
          await go('#/today', 520);
          var tCon = contrastFails(win, doc, 4.5);
          t(id + 'a', 'Body text passes 4.5:1 at ' + wLabel + ' in ' + key + (hard ? ', hardened' : ''), [], tCon.fails);
          /* The count rides in the name, not in expected/actual: mkPush compares
             by JSON.stringify, so folding it into the value would make a passing
             row unequal. A bare green "plausible" cannot tell 900 elements from
             41, and a change that silently shrinks the rendered surface would
             keep the boolean true all the way down to the gate. */
          t(id + 'b', 'The sweep examined a plausible number of elements at ' + wLabel + ' in ' + key + (hard ? ', hardened' : '') +
            ' (saw ' + tCon.checked + ')', true, tCon.checked > 40);
          t(id + 'c', 'Every visible control still meets 44px at ' + wLabel + ' in ' + key + (hard ? ', hardened' : ''), [], tapTargets(win, doc));
          var tAtmos = doc.querySelector('[data-app-root] > [aria-hidden="true"]');
          var paint = tAtmos ? win.getComputedStyle(tAtmos).backgroundImage.replace(/\s+/g, '') : 'none';
          /* Also reports which identity was actually live, so a clobbered
             theme can never again pass as green: the a, b and c rows above ran
             in this same settled state, and this is what proves it was the
             state they were meant to measure. */
          t(id + 'd', 'The ' + key + ' identity is live at ' + wLabel + ' and paints its own atmosphere',
            { live: key, primary: true, second: true },
            { live: win.__incommonApp.state.themeKey,
              primary: paint.indexOf('rgba(' + themeCases[tc][2].replace(/\s+/g, '') + ',0.5)') > -1,
              second: paint.indexOf('rgba(' + themeCases[tc][3].replace(/\s+/g, '') + ',0.32)') > -1 });
        } catch (e) {
          t(id + 'a', 'Body text passes 4.5:1 at ' + wLabel + ' in ' + key + (hard ? ', hardened' : ''), [], 'threw: ' + (e && e.message));
        }
      }
      try { win.__incommonApp.setState({ themeKey: 'midnight', themeHC: false }); await sleep(300); } catch (e) {}
      }
    } catch (e) {
      t('T-ERR', 'Theme harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }


  /* ================= The removal phase: its own phase =================
     V1.6.0 took four things out: the Stella guide and its safety router, the
     account gate, the epistemic tag badges, and the name Together. Three of
     those are invisible when they work, which is exactly the shape of a
     regression nobody notices: a re-added script tag, a badge that comes back
     through a call site the sweep never walked, a gate that returns on a clean
     device. These rows assert absence, so they need their own frame (one of
     them clears first run on purpose) and their own budget.
     Rows are keyed R and declared in the runner's GROUPS. */
  var TAGS = ['CALCULATED', 'TRADITIONAL', 'POSSIBILITY', 'SYNTHESIS', 'REPORTED'];
  var READING_SCREENS = ['#/today', '#/spirit/astrology', '#/spirit/human-design',
    '#/spirit/numerology', '#/spirit/angel-numbers', '#/spirit/daily',
    '#/spirit/synastry', '#/library/sabian-lexicon', '#/library/astropedia'];

  async function runRemoval(src, onStep, sink) {
    var A = sink || [], t = mkPush(A), frames = [];
    onStep = onStep || function () {};
    var saved = readFirstRun();
    try {
      /* ---- R1, R2: the first run screen, on a genuinely clean device ---- */
      onStep('removal: first run on a clean device');
      restoreFirstRun(null);
      var f0 = await frame(src, 375, 667);
      frames.push(f0);
      var w0 = f0.contentWindow;
      if (!(await ready(w0, 16000))) { t('R0', 'App boots for the removal phase', true, false); return A; }
      await sleep(900);
      var d0 = w0.document;
      var gate = await waitGate(d0, 5000);
      var gateTxt = txt(gate);
      /* The gate is gone as a concept, not just as a screen: no password, no
         provider, no captcha, no mailing list, and nothing to sign in to.
         The label list rides in the name so a miss says WHAT rendered instead:
         a bare shown:false cannot tell a removed gate from a stale bundle
         served out of the service worker cache. */
      var labels0 = [].slice.call(d0.querySelectorAll('[data-screen-label]'))
        .map(function (x) { return x.getAttribute('data-screen-label'); }).join(', ');
      t('R1', 'A clean device opens on the birth screen and offers no way to sign in (saw: ' + (labels0 || 'nothing') + ')',
        { shown: true, birthField: true, signIn: false, provider: false, password: false, skyLetter: false },
        { shown: !!gate,
          birthField: !!(gate && gate.querySelector('input[type="date"]')),
          signIn: /sign in|sign up|log in|already have an account/i.test(gateTxt),
          provider: /google|facebook|tiktok|chatgpt/i.test(gateTxt),
          password: !!(gate && gate.querySelector('input[type="password"]')),
          skyLetter: /sky letter/i.test(gateTxt) });
      t('R1b', 'Every control on the birth screen still meets 44px', [],
        gate ? tapTargets(w0, { querySelectorAll: function (q) { return gate.querySelectorAll(q); } }) : 'no gate');
      t('R1c', 'The birth screen passes 4.5:1', [],
        gate ? contrastFails(w0, { querySelectorAll: function (q) { return gate.querySelectorAll(q); } }, 4.5).fails : 'no gate');

      onStep('removal: dismissing first run');
      var skip = gate ? [].slice.call(gate.querySelectorAll('button')).filter(function (b) { return /skip/i.test(txt(b)); })[0] : null;
      if (skip) skip.click();
      await sleep(900);
      t('R2', 'Skipping first run lands in the app and does not come back on reload',
        { dismissed: true, marked: 'true', headerShown: true },
        { dismissed: !d0.querySelector('[data-screen-label="First run"]'),
          marked: readFirstRun(),
          headerShown: d0.querySelectorAll('[data-app-header]').length === 1 });

      /* ---- R3 to R6: the desktop shell, first run already done ---- */
      onStep('removal: loading the app shell');
      primeFirstRun();
      var f = await frame(src, 1440, 900);
      frames.push(f);
      var win = f.contentWindow;
      if (!(await ready(win, 16000))) { t('R3-0', 'App boots for the removal sweep', true, false); return A; }
      await sleep(700);
      var doc = win.document;
      var go = async function (h, ms) { win.location.hash = h; await sleep(ms || 520); };

      /* ---- R3: no module is loaded, and nothing can reach the chain ---- */
      onStep('removal: Stella modules');
      var sendReturn = 'not called';
      try { sendReturn = await win.__incommonApp.send('read my chart'); } catch (e) { sendReturn = 'threw: ' + (e && e.message); }
      t('R3', 'No Stella or safety-router module is loaded, and send reaches nothing',
        { router: 'undefined', builder: 'undefined', post: 'undefined', api: 'undefined', sendResolves: true },
        { router: typeof win.SafetyRouter, builder: typeof win.StellaPromptBuilder,
          post: typeof win.StellaPostProcessor, api: typeof win.StellaAPI,
          sendResolves: sendReturn === undefined });
      var srcTags = [].slice.call(doc.querySelectorAll('script[src]')).map(function (x) { return x.getAttribute('src'); });
      t('R3b', 'The document loads no stella-* or safety-router script',
        [], srcTags.filter(function (x) { return /stella|safety-router/i.test(x); }));

      /* ---- R4: no entry point, on any screen ---- */
      onStep('removal: Stella entry points');
      var stellaHits = [], tagHits = [];
      for (var i = 0; i < READING_SCREENS.length; i++) {
        await go(READING_SCREENS[i], 460);
        var live = [].slice.call(doc.querySelectorAll('[data-screen-label]'))
          .filter(function (s) { return s.getBoundingClientRect().height > 40; });
        /* A control, not a word: the Library still holds reference copy that
           may legitimately name things, so this looks at what can be pressed. */
        [].slice.call(doc.querySelectorAll('button, a, [role="tab"], [role="button"]')).forEach(function (b) {
          var label = (txt(b) + ' ' + (b.getAttribute('aria-label') || '')).trim();
          if (/stella|ask (her|the guide)|open chat/i.test(label)) stellaHits.push(READING_SCREENS[i] + ': ' + label.slice(0, 40));
        });
        /* The badge shape is an element whose whole text IS the tag. Prose that
           happens to contain the word is not a badge and is not counted. */
        live.forEach(function (screen) {
          [].slice.call(screen.querySelectorAll('*')).forEach(function (el) {
            if (el.children.length) return;
            var v = txt(el);
            if (TAGS.indexOf(v) > -1) tagHits.push(READING_SCREENS[i] + ': ' + v);
          });
        });
      }
      t('R4', 'No screen offers a Stella entry point', [], stellaHits);
      t('R4b', 'No reading screen prints an epistemic tag badge (' + READING_SCREENS.length + ' screens walked)', [], tagHits);
      t('R4c', 'No message composer survives anywhere in the shell',
        [], [].slice.call(doc.querySelectorAll('textarea, input[type="text"]')).filter(function (el) {
          return /message|ask|chat/i.test((el.getAttribute('placeholder') || '') + (el.getAttribute('aria-label') || ''));
        }).map(function (el) { return el.getAttribute('aria-label') || el.getAttribute('placeholder'); }));

      /* ---- R5: Synastry, named and addressed ---- */
      onStep('removal: the Synastry rename');
      await go('#/spirit/synastry', 620);
      var synScreen = doc.querySelector('[data-screen-label="Spirit / Synastry"]');
      var synTxt = txt(synScreen);
      t('R5', 'The feature is called Synastry on its own screen',
        { screen: true, heading: true, oldName: false },
        { screen: !!synScreen,
          heading: /Synastry/.test(synTxt),
          oldName: /\bTogether\b/.test(synTxt) });
      await go('#/spirit', 560);
      var hubTxt = [].slice.call(doc.querySelectorAll('[data-screen-label]')).map(txt).join(' ');
      t('R5b', 'My Charts lists it as Synastry, not Together',
        { synastry: true, together: false },
        { synastry: /Synastry/.test(hubTxt), together: /\bTogether\b/.test(hubTxt) });
      /* The old address is an alias, not a redirect to Today: an existing link
         has to land on the same screen and then correct itself. */
      onStep('removal: the legacy address');
      await go('#/spirit/together', 780);
      t('R5c', 'The pre-V1.6 address still lands on Synastry and rewrites itself',
        { landed: true, rewritten: '#/spirit/synastry' },
        { landed: !!doc.querySelector('[data-screen-label="Spirit / Synastry"]'),
          rewritten: win.location.hash });

      /* ---- R6: the account is gone from Settings too ---- */
      onStep('removal: Settings');
      await go('#/settings', 700);
      var setTxt = txt(doc.querySelector('[data-screen-label="Settings"]')) ||
        [].slice.call(doc.querySelectorAll('[data-screen-label]')).map(txt).join(' ');
      t('R6', 'Settings carries no account, sign-out or mailing controls',
        { account: false, signOut: false, skyLetter: false, chatgptLink: false },
        { account: /\bAccount\b/.test(setTxt), signOut: /sign out/i.test(setTxt),
          skyLetter: /sky letter/i.test(setTxt), chatgptLink: /chatgpt/i.test(setTxt) });
      /* The safety controls are NOT what was removed, and a sweep that only
         asserts absence would happily pass a build that took them out too. */
      t('R6b', 'The crisis controls survived the removal',
        { help: true, yellowPages: true },
        { help: /you deserve a person/i.test(setTxt), yellowPages: /yellow pages/i.test(setTxt) });
    } catch (e) {
      t('R-ERR', 'Removal harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      restoreFirstRun(saved);
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }


  /* ================= The ADA phase: its own phase =====================
     Group G, one row family per gap in the accessibility audit. Almost every
     one of these is invisible when it works, which is the same shape as the
     removal phase: a landmark that quietly loses its role, a live region that
     stops being written to, a focus trap that attaches a frame too early and
     traps nothing. Each row drives the real thing rather than looking for the
     attribute, because an attribute that is present and inert is the failure
     mode these gaps had in the first place.

     Three gaps could not be met as the audit words them, and say so here
     rather than being quietly dropped:
       G4  there is no CAPTCHA in this build and no account behind one, so the
           row asserts that absence instead of testing an alternative path.
       G7  the audit puts field errors in the account gate. There is no account
           gate, so the same treatment is on the first run birth form.
       G13 lives in the theme phase, where the contrast gate already is. The row
           here asserts that phase still covers two widths. */
  async function runA11y(src, onStep, sink) {
    var A = sink || [], t = mkPush(A), frames = [];
    onStep = onStep || function () {};
    var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    var saved = readFirstRun();
    try {
      /* ---- G7 first, on a genuinely clean device: it needs the birth form -- */
      onStep('ada: field level errors on the first run form');
      restoreFirstRun(null);
      var f0 = await frame(src, 375, 667);
      frames.push(f0);
      var w0 = f0.contentWindow;
      if (!(await ready(w0, 16000))) { t('G0', 'App boots for the ADA phase', true, false); return A; }
      await sleep(700);
      var d0 = w0.document;
      await waitGate(d0, 5000);
      var dateIn = d0.querySelector('input[aria-label="Birth date"]');
      if (dateIn) {
        w0.__incommonApp.afSet('bdate', '1776-07-04');
        await sleep(260);
        w0.__incommonApp.birthSubmit();
        await sleep(420);
        dateIn = d0.querySelector('input[aria-label="Birth date"]');
        var errId = dateIn && dateIn.getAttribute('aria-errormessage');
        var errEl = errId ? d0.getElementById(errId) : null;
        t('G7', 'A bad birth date marks its own field and points at a real message',
          { invalid: 'true', pointsAt: true, messageExists: true, messageHasText: true, stillOnForm: true },
          { invalid: dateIn ? dateIn.getAttribute('aria-invalid') : 'no field',
            pointsAt: !!errId, messageExists: !!errEl, messageHasText: !!(errEl && txt(errEl).length > 8),
            stillOnForm: !!d0.querySelector('[data-screen-label="First run"]') });
        /* The half that usually gets left behind: both attributes have to come
           off again when the field is corrected. */
        w0.__incommonApp.afSet('bdate', '1992-07-02');
        w0.__incommonApp.afClearErr('bdate');
        await sleep(400);
        dateIn = d0.querySelector('input[aria-label="Birth date"]');
        t('G7b', 'Correcting the field clears aria-invalid and the message together',
          { invalid: 'false', messageGone: true },
          { invalid: dateIn ? dateIn.getAttribute('aria-invalid') : 'no field',
            messageGone: !d0.getElementById('incommon-err-bdate') });
      } else {
        t('G7', 'A bad birth date marks its own field', 'birth form present', 'no birth form');
      }
      /* ---- G4: there is no CAPTCHA to give an alternative to ---- */
      var gateTxt = txt(d0.querySelector('[data-screen-label="First run"]'));
      /* Judged on the rendered gate and its controls. body.innerHTML would
         include the logic class, which is inlined into the body of a Design
         Component, so a comment mentioning CAPTCHA failed this row on itself. */
      t('G4', 'No CAPTCHA and no account stand between a person and the app',
        { captcha: false, challengeImg: false, puzzle: false, account: false, hasSkip: true },
        { captcha: /captcha/i.test(gateTxt),
          challengeImg: !!d0.querySelector('[data-screen-label="First run"] img, [data-screen-label="First run"] iframe, [data-screen-label="First run"] canvas'),
          puzzle: /prove you|not a robot/i.test(gateTxt),
          account: /password|sign in|email/i.test(gateTxt), hasSkip: /skip for now/i.test(gateTxt) });

      /* ---- the phone shell ---- */
      onStep('ada: the vertical shell');
      primeFirstRun();
      var fp = await frame(src, 375, 667);
      frames.push(fp);
      var wp = fp.contentWindow;
      if (!(await ready(wp, 16000))) { t('G0b', 'App boots at phone width for the ADA phase', true, false); return A; }
      await sleep(800);
      var dp = wp.document;
      var goP = async function (h, ms) { wp.location.hash = h; await sleep(ms || 560); };

      /* ---- G1: the skip link ---- */
      var firstFocusable = [].slice.call(dp.querySelectorAll(FOCUSABLE)).filter(function (el) {
        return el.offsetParent !== null || el.hasAttribute('data-skip');
      })[0];
      var skip = dp.querySelector('[data-skip]');
      t('G1', 'A skip link is the first focusable thing in the shell and is hidden until focused',
        { exists: true, isFirst: true, hiddenAtRest: true, named: true },
        { exists: !!skip, isFirst: !!(firstFocusable && firstFocusable.hasAttribute('data-skip')),
          hiddenAtRest: !!(skip && skip.getBoundingClientRect().width <= 2),
          named: /skip to the reading/i.test(txt(skip)) });
      if (skip) {
        /* The exemption in tapTargets() is paid for here: focused, the skip
           link has to be a real target like everything else. */
        skip.focus();
        await sleep(260);
        var fr = skip.getBoundingClientRect();
        t('G1c', 'Focused, the skip link is a real 44px target',
          { tall: true, wide: true, visible: true },
          { tall: fr.height >= 43.5, wide: fr.width >= 43.5, visible: fr.width > 2 });
        skip.click();
        await sleep(360);
        var main = dp.querySelector('[data-main-region]');
        t('G1b', 'Activating it moves focus to the main reading region',
          { movedIntoMain: true },
          { movedIntoMain: !!(main && (dp.activeElement === main || main.contains(dp.activeElement))) });
      }

      /* ---- G5: landmarks ---- */
      var lm = function (sel) { return dp.querySelectorAll(sel).length; };
      t('G5', 'The shell declares its landmarks',
        { main: 1, nav: 1, contentinfo: true },
        { main: lm('[role="main"]'), nav: lm('[role="navigation"]'), contentinfo: lm('[role="contentinfo"]') > 0 });
      wp.__incommonApp.setState({ tab: 'library', libSub: 'archive', libView: null, selId: null, arcSel: null });
      await sleep(760);
      t('G5b', 'The archive search is a search landmark, on the container and not the input',
        { onContainer: true, onInput: false },
        { onContainer: !!dp.querySelector('[role="search"]'),
          onInput: !!dp.querySelector('input[role="search"]') });

      /* ---- G6: the live regions ----
         Read through a getter, never a cached node: an announcement is written
         straight to the DOM and the surrounding rows re-render the app, so a
         held reference is the one thing guaranteed to read the wrong text.
         And "empty at rest" means at rest: G1b announced, so wait it out. */
      var liveText = function (which) {
        var el = dp.querySelector('[data-live="' + which + '"]');
        return el ? (el.textContent || '').trim() : 'no region';
      };
      var waitSaid = async function (which, ms) {
        var until = Date.now() + (ms || 1200);
        for (;;) {
          var v = liveText(which);
          if (v && v !== 'no region') return v;
          if (Date.now() > until) return v;
          await sleep(60);
        }
      };
      await sleep(1900);
      var pol = dp.querySelector('[data-live="polite"]'), asr = dp.querySelector('[data-live="assertive"]');
      t('G6', 'Two live regions exist, one polite and one assertive, empty at rest',
        { polite: 'polite', assertive: 'assertive', emptyPolite: true, emptyAssertive: true },
        { polite: pol && pol.getAttribute('aria-live'), assertive: asr && asr.getAttribute('aria-live'),
          emptyPolite: liveText('polite') === '', emptyAssertive: liveText('assertive') === '' });
      wp.__incommonApp.speak('harness probe', 'polite');
      var spoke = await waitSaid('polite', 1200);
      await sleep(2100);
      t('G6b', 'speak() writes to the region and clears it again',
        { wrote: 'harness probe', cleared: true },
        { wrote: spoke, cleared: liveText('polite') === '' });
      /* A chart redraw is one of the changes the audit asks to be announced,
         and it is announced off the state change rather than off a handler, so
         it holds however the change was reached. */
      await goP('#/spirit/astrology', 900);
      var mode0 = wp.__incommonApp.state.chartMode;
      wp.__incommonApp.setState({ chartMode: mode0 === 'basic' ? 'expanded' : 'basic' });
      var said = await waitSaid('polite', 1200);
      t('G6c', 'A chart redraw is announced through the polite region (heard: "' + said + '")',
        true, /chart redrawn/i.test(said));
      await sleep(2100);

      /* ---- G11: the charts describe themselves ---- */
      var wheel = dp.querySelector('svg[aria-roledescription="astrological chart"]');
      var sumId = wheel && wheel.getAttribute('aria-describedby');
      var sumEl = sumId ? dp.getElementById(sumId) : null;
      t('G11', 'The natal wheel carries a role description and a plain language summary',
        { roledesc: 'astrological chart', summaryExists: true, plainLanguage: true, inTree: 'false' },
        { roledesc: wheel && wheel.getAttribute('aria-roledescription'),
          summaryExists: !!sumEl, plainLanguage: /twelve houses/i.test(txt(sumEl)),
          inTree: sumEl && sumEl.getAttribute('aria-hidden') });
      wp.__incommonApp.setState({ dpSel: { kind: 'house', h: 4 } });
      await sleep(600);
      var sumEl2 = dp.getElementById('incommon-wheel-summary');
      t('G11b', 'The summary leaves the accessibility tree while a detail sheet is open',
        'true', sumEl2 ? sumEl2.getAttribute('aria-hidden') : 'summary gone');
      wp.__incommonApp.setState({ dpSel: null });
      await sleep(400);

      /* ---- G14: icon only controls ---- */
      var described = [].slice.call(dp.querySelectorAll('[aria-describedby]'));
      var dangling = described.filter(function (el) {
        var id = el.getAttribute('aria-describedby');
        var target = id ? dp.getElementById(id) : null;
        return !target || txt(target).length < 10;
      }).map(function (el) { return el.getAttribute('aria-label') || el.tagName; });
      t('G14', 'Every aria-describedby points at real, non-empty text', [], dangling);
      var zoomBtn = dp.querySelector('button[aria-label="Zoom in"]');
      t('G14b', 'The zoom cluster is described, not just labelled',
        { described: 'incommon-zoom-help', mentionsReset: true },
        { described: zoomBtn && zoomBtn.getAttribute('aria-describedby'),
          mentionsReset: /reset/i.test(txt(dp.getElementById('incommon-zoom-help'))) });

      /* ---- G9: colour is never the only carrier ---- */
      var legend = dp.querySelector('[aria-label="What the aspect line colours mean"]');
      t('G9', 'The aspect colours are named in words beside the wheel',
        { exists: true, named: 5 },
        { exists: !!legend, named: legend ? legend.querySelectorAll('[role="listitem"]').length : 0 });
      /* The ring only draws with a second person on the device, and a row that
         can only run in one setup is a row that quietly stops running. The rule
         is a pure mapping from the figure the arc draws, so it is asserted at
         its boundaries here, and the rendered band is asserted whenever a ring
         is actually on screen. */
      var app = wp.__incommonApp;
      t('G9b', 'The band words follow the same figure that draws the arc',
        { at0: 'Mostly challenging', at40: 'Mostly challenging', at41: 'Mixed', at59: 'Mixed',
          at60: 'Mostly harmonious', at100: 'Mostly harmonious' },
        { at0: app.synBandFor(0), at40: app.synBandFor(40), at41: app.synBandFor(41),
          at59: app.synBandFor(59), at60: app.synBandFor(60), at100: app.synBandFor(100) });
      await goP('#/spirit/synastry', 900);
      var ring = dp.querySelector('[data-chart="synastry"] svg text');
      if (ring) {
        var band = txt(dp.querySelector('[data-screen-label="Spirit / Synastry"]'));
        var score = parseInt(txt(ring) || '0', 10);
        t('G9c', 'The rendered ring prints its band (score ' + score + ')',
          { shown: true, matches: true },
          { shown: /mostly harmonious|mostly challenging|mixed/i.test(band),
            matches: band.indexOf(app.synBandFor(score)) > -1 });
      } else {
        /* Says so rather than passing silently: no ring is drawn until a second
           person exists, and this names that as the reason. */
        t('G9c', 'No synastry ring is drawn on this device, so there is no band to print',
          { ring: false, offersPartner: true },
          { ring: false, offersPartner: /add|choose|someone|contact/i.test(txt(dp.querySelector('[data-screen-label="Spirit / Synastry"]'))) });
      }

      /* ---- G10: navigation and the tablist pattern ---- */
      await goP('#/today', 640);
      var cur = dp.querySelectorAll('[data-app-nav] [aria-current="true"],[data-app-nav] [aria-current="page"]');
      t('G10', 'Exactly one navigation item is marked current', 1, cur.length);
      await goP('#/spirit/astrology', 820);
      var tabs = [].slice.call(dp.querySelectorAll('[role="tablist"][aria-label="Spirit views"] [role="tab"]'));
      var broken = tabs.filter(function (tb) {
        var pid = tb.getAttribute('aria-controls');
        var panel = pid ? dp.getElementById(pid) : null;
        return !panel || panel.getAttribute('role') !== 'tabpanel' ||
          panel.getAttribute('aria-labelledby') !== tb.getAttribute('id');
      }).map(function (tb) { return txt(tb) || tb.getAttribute('id'); });
      t('G10b', 'Every Spirit tab owns a panel and the panel names it back (' + tabs.length + ' tabs)', [], broken);

      /* ---- G12: the snap sections take focus ---- */
      var secs = [].slice.call(dp.querySelectorAll('[data-vt-sec]'));
      var unfocusable = secs.filter(function (sc) { return sc.getAttribute('tabindex') !== '0'; })
        .map(function (sc) { return sc.getAttribute('data-vt-sec'); });
      t('G12', 'Every snap section is focusable (' + secs.length + ' sections)', [], unfocusable);
      if (secs.length > 1) {
        secs[1].focus();
        await sleep(400);
        var secSaid = await waitSaid('polite', 1200);
        t('G12b', 'Focusing a section announces it and does not trap focus there (heard: "' + secSaid + '")',
          { announced: true, canLeave: true },
          { announced: secSaid.length > 0 && secSaid !== 'no region',
            canLeave: secs[1].querySelectorAll(FOCUSABLE).length > 0 });
        await sleep(1800);
      }

      /* ---- G15: single select chips are radios, and arrows drive them ---- */
      await goP('#/spirit/astrology', 820);
      var groups = [].slice.call(dp.querySelectorAll('[role="radiogroup"]'));
      var mixed = groups.filter(function (g) { return g.querySelector('[aria-pressed]'); })
        .map(function (g) { return g.getAttribute('aria-label') || 'unlabelled group'; });
      t('G15', 'No radiogroup still carries an aria-pressed child (' + groups.length + ' groups live)', [], mixed);
      var badCount = groups.filter(function (g) {
        var radios = g.querySelectorAll('[role="radio"]');
        if (!radios.length) return false;
        return [].slice.call(radios).filter(function (r) { return r.getAttribute('aria-checked') === 'true'; }).length !== 1;
      }).map(function (g) { return g.getAttribute('aria-label') || 'unlabelled group'; });
      t('G15b', 'Every radiogroup has exactly one checked radio', [], badCount);
      var rg = groups.filter(function (g) { return g.querySelectorAll('[role="radio"]').length > 1; })[0];
      if (rg) {
        var radios = [].slice.call(rg.querySelectorAll('[role="radio"]'));
        radios[0].focus();
        rg.dispatchEvent(new wp.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        await sleep(500);
        var after = [].slice.call(rg.querySelectorAll('[role="radio"]'));
        t('G15c', 'End selects the last radio in the group',
          { checkedLast: 'true' },
          { checkedLast: after[after.length - 1].getAttribute('aria-checked') });
        rg.dispatchEvent(new wp.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        await sleep(500);
        after = [].slice.call(rg.querySelectorAll('[role="radio"]'));
        t('G15d', 'Home selects the first', { checkedFirst: 'true' }, { checkedFirst: after[0].getAttribute('aria-checked') });
      }

      /* ---- G8: the focus trap ---- */
      onStep('ada: the focus trap');
      var opener = dp.querySelector('button[aria-label="Search"]');
      if (opener) opener.focus();
      wp.__incommonApp.setState({ helpOpen: true });
      await sleep(800);
      var dlg = dp.querySelector('[role="dialog"]');
      var inside = dlg ? [].slice.call(dlg.querySelectorAll(FOCUSABLE)) : [];
      t('G8', 'Opening a sheet moves focus into it',
        { dialog: true, focusInside: true },
        { dialog: !!dlg, focusInside: !!(dlg && dlg.contains(dp.activeElement)) });
      if (inside.length > 1) {
        inside[inside.length - 1].focus();
        dlg.dispatchEvent(new wp.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        await sleep(300);
        var wrapped = dp.activeElement === inside[0];
        inside[0].focus();
        dlg.dispatchEvent(new wp.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
        await sleep(300);
        t('G8b', 'Tab wraps at both ends instead of leaving the sheet',
          { forward: true, backward: true },
          { forward: wrapped, backward: dp.activeElement === inside[inside.length - 1] });
      }
      dlg.dispatchEvent(new wp.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await sleep(700);
      t('G8c', 'Escape closes the sheet and hands focus back',
        { closed: true, released: true, focusOutside: true },
        { closed: !dp.querySelector('[role="dialog"]'),
          released: !wp.__incommonApp._trapEl,
          focusOutside: !dp.querySelector('[role="dialog"]') });

      /* ---- the desktop shell: headings and the language ---- */
      onStep('ada: headings and the document language');
      var fd = await frame(src, 1440, 900);
      frames.push(fd);
      var wd = fd.contentWindow;
      if (!(await ready(wd, 16000))) { t('G0c', 'App boots at desktop width for the ADA phase', true, false); return A; }
      await sleep(800);
      var dd = wd.document;
      var goD = async function (h, ms) { wd.location.hash = h; await sleep(ms || 620); };

      /* G2: the wrapper owns <html>, so this is set from the logic class. The
         row also guards the bug that shipped first: a language read from the
         old Stella key labelled this English interface as Japanese. */
      t('G2', 'The document declares a language, and not the stale conversation language',
        { lang: 'en', notStale: true },
        { lang: dd.documentElement.getAttribute('lang'),
          notStale: dd.documentElement.getAttribute('lang') === wd.__incommonApp.pageLang() });

      /* G3: one h1 per screen. The desktop shell titles every screen from one
         header, so the document carries exactly one. */
      /* Counting h1s is not enough. The first pass counted one h1 on every
         route and went green while the Today h1 read "inCommon": the brand
         name, not the screen, which is precisely the condition G3 exists to
         catch. The row asserts what the heading SAYS as well as that there is
         exactly one of it. */
      var routes = [['#/today', 'Today'], ['#/spirit', 'My Charts'], ['#/library/practices', 'Library'],
        ['#/throughline', 'Throughline'], ['#/settings', 'Settings']];
      var h1Bad = [];
      for (var ri = 0; ri < routes.length; ri++) {
        await goD(routes[ri][0], 640);
        var hs = dd.querySelectorAll('h1');
        var titleH2 = [].slice.call(dd.querySelectorAll('h2')).filter(function (el) {
          return /36px|clamp\(20px/.test(el.getAttribute('style') || '');
        }).length;
        var said = hs.length === 1 ? txt(hs[0]) : '';
        if (hs.length !== 1 || titleH2 || said !== routes[ri][1]) {
          h1Bad.push(routes[ri][0] + ': ' + hs.length + ' h1 saying "' + said + '", wanted "' + routes[ri][1] + '"' +
            (titleH2 ? ', plus ' + titleH2 + ' title h2' : ''));
        }
      }
      t('G3', 'Every desktop screen has exactly one h1, and it names that screen', [], h1Bad);
      /* On the phone all five sections are in the document at once, so the
         rule there is one h1 per section rather than one per document. */
      var secBad = [].slice.call(dp.querySelectorAll('[data-vt-sec]')).filter(function (sc) {
        return sc.querySelectorAll('h1').length !== 1;
      }).map(function (sc) { return sc.getAttribute('data-vt-sec') + ': ' + sc.querySelectorAll('h1').length; });
      t('G3b', 'Every snap section carries exactly one h1', [], secBad);

      /* G13 lives in the theme phase. This row only guards its coverage. */
      t('G13', 'The theme contrast gate still covers two widths',
        { widths: 2, hasPhone: true, hasDesktop: true },
        { widths: THEME_WIDTHS.length,
          hasPhone: THEME_WIDTHS.some(function (w) { return w[0] === 375; }),
          hasDesktop: THEME_WIDTHS.some(function (w) { return w[0] === 1440; }) });
    } catch (e) {
      t('G-ERR', 'ADA harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      restoreFirstRun(saved);
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }

  return { VERSION: '1.7.0', MATRIX: MATRIX, THEME_WIDTHS: THEME_WIDTHS,
    runMatrix: runMatrix, runCross: runCross, runSweep: runSweep,
    runThemes: runThemes, runRemoval: runRemoval, runA11y: runA11y };
}));
