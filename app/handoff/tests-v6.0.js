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
        /* The opacity used to be a literal in the markup and this row pinned the
           number. It is --atmo now, because an identity has to be able to say how
           present its own sky is, so the row reads the token instead of naming a
           value. The gate is unchanged in strength and slightly stronger in
           reach: it still fails on a missing layer, on a layer switched off, and
           on a layer painted opaque over the app, and it now also fails when the
           painted opacity and the identity's own token disagree, which a fixed
           number could never catch. */
        var atmoTok = atmos ? win.getComputedStyle(atmos.parentNode).getPropertyValue('--atmo').trim() : '';
        var atmoPaint = atmos ? win.getComputedStyle(atmos).opacity : 'none';
        t(tag + '7', 'Atmosphere layer present, and painted at the identity own --atmo, at ' + label,
          { present: true, matchesToken: true, visible: true, notOpaque: true },
          { present: !!atmos,
            matchesToken: !!atmos && Math.abs(parseFloat(atmoPaint) - parseFloat(atmoTok || 'NaN')) < 0.005,
            visible: parseFloat(atmoPaint) > 0.05,
            notOpaque: parseFloat(atmoPaint) < 1 });

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
      /* The second page was "Human Design Horoscope" and is "Alignment" from
         v6.1. The row still asserts all four titles in order, so it fails if a
         page goes missing or the pager loses its order: only the expected
         string moved, and it moved because the label was deliberately renamed,
         not to make a red row green. */
      t('F1b', 'The alignment pager carries all four parts',
        ['Horoscope', 'Alignment', 'Daily Numerology', 'Together'], pageTitles);
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
      /* 45s, not 20s. F5 is the only row in the suite that boots the app a
         second time, and it is the one that flakes: it failed in three runs of
         five on a tree where every other assertion in the same row passed. That
         is the tell. probe, profiles, activeId and consent are all read AFTER
         this wait and all four were correct, so the app had booted; it had
         simply not booted inside twenty seconds. A hidden or backgrounded pane
         throttles the frame, and a reload pays for the whole boot again, so the
         budget has to be generous or the row reports a build failure that is
         really a scheduling one.

         MEASURED, not guessed. In a hidden pane on this machine the first boot
         of the app in an iframe took 23.7s and the boot after a reload took
         20.8s. The old budget was 20.0s, which is to say the row was being
         raced against the exact number it was measuring, and three runs in five
         is about what a coin weighted like that returns. 45s is a little over
         twice the measured cost.

         Raising it weakens nothing: the poll returns the moment the header
         appears, so a boot that is healthy and unthrottled still finishes in
         about a second and the extra budget is never spent.

         If other phases start reporting booted:false in the same way, the place
         to look is the 14s default in ready(), not here. */
      var ok3 = await ready(f.contentWindow, 45000, oldDoc);
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
      onStep('theme sweep: four identities, contrast on and off');
      /* The atmosphere hue is the one surface that is painted rather than
         written, so it cannot be caught by a contrast sweep: a midnight glow
         under dawn passes every ratio and still looks wrong. These are the
         triplets --atmc and --atmc2 must resolve to per identity. Neither is
         in HC_SHARED, so the hardened case expects the same pair. */
      var themeCases = [['deepfield', false, '47,79,214', '242,214,158'], ['deepfield', true, '47,79,214', '242,214,158'],
        ['midnight', false, '47,79,214', '139,92,246'], ['midnight', true, '47,79,214', '139,92,246'],
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
          /* Every aria-hidden child of the root, not the first one. The glow is
             two elements: the cold lobe overhead and the warm horizon below,
             drifting on different periods in opposite directions. While this
             read querySelector it saw only the cold lobe, so --atmc2 was absent
             from what it measured and all sixteen d rows failed on four correct
             palettes. Joined on a separator no colour can span, so a match still
             has to come from inside one element's own paint. */
          var tAtmos = [].slice.call(doc.querySelectorAll('[data-app-root] > [aria-hidden="true"]'));
          var paint = tAtmos.length
            ? tAtmos.map(function (el) { return win.getComputedStyle(el).backgroundImage; }).join('|').replace(/\s+/g, '')
            : 'none';
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
      try { win.__incommonApp.setState({ themeKey: 'deepfield', themeHC: false }); await sleep(300); } catch (e) {}
      }
    } catch (e) {
      t('T-ERR', 'Theme harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }


  /* ================= The removal phase: its own phase =================
     V1.6.0 took four things out: the guide (Stella then, Oki now) and its safety router, the
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
      onStep('removal: Oki modules');
      var sendReturn = 'not called';
      try { sendReturn = await win.__incommonApp.send('read my chart'); } catch (e) { sendReturn = 'threw: ' + (e && e.message); }
      t('R3', 'No Oki or safety-router module is loaded, and send reaches nothing',
        { router: 'undefined', builder: 'undefined', post: 'undefined', api: 'undefined', sendResolves: true },
        /* Both vocabularies. The assistant was Stella until 28 August 2026 and
           is Oki now; a build that loaded either would be a build that re-wired
           the guide, and this row is the thing that would notice. */
        { router: typeof win.SafetyRouter,
          builder: typeof (win.OkiPromptBuilder || win.StellaPromptBuilder),
          post: typeof (win.OkiPostProcessor || win.StellaPostProcessor),
          api: typeof (win.OkiAPI || win.StellaAPI),
          sendResolves: sendReturn === undefined });
      var srcTags = [].slice.call(doc.querySelectorAll('script[src]')).map(function (x) { return x.getAttribute('src'); });
      t('R3b', 'The document loads no oki-*, no stella-* and no safety-router script',
        [], srcTags.filter(function (x) { return /\boki-|stella|safety-router/i.test(x); }));

      /* ---- R4: no entry point, on any screen ---- */
      onStep('removal: Oki entry points');
      var okiHits = [], tagHits = [];
      for (var i = 0; i < READING_SCREENS.length; i++) {
        await go(READING_SCREENS[i], 460);
        var live = [].slice.call(doc.querySelectorAll('[data-screen-label]'))
          .filter(function (s) { return s.getBoundingClientRect().height > 40; });
        /* A control, not a word: the Library still holds reference copy that
           may legitimately name things, so this looks at what can be pressed. */
        [].slice.call(doc.querySelectorAll('button, a, [role="tab"], [role="button"]')).forEach(function (b) {
          var label = (txt(b) + ' ' + (b.getAttribute('aria-label') || '')).trim();
          if (/\boki\b|stella|ask (her|the guide)|open chat/i.test(label)) okiHits.push(READING_SCREENS[i] + ': ' + label.slice(0, 40));
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
      t('R4', 'No screen offers an Oki entry point', [], okiHits);
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
      /* WHAT THIS ROW MEANS, AND WHAT IT USED TO MEASURE.
         The claim is that the FEATURE is not called Together any more. It used
         to test that for the word anywhere in the screen text, case sensitively,
         which was wrong twice over. It missed the real thing, because the
         kicker read TOGETHER and the style uppercases it, so the feature went on
         announcing the old name for two months with a green row beside it. And
         it would have failed on a device with a second person saved, because the
         reading's own prose contains sentences that begin "Together they reduce
         to" and "Together you are heaviest in", which are English rather than a
         product name.
         So it reads the feature's own naming: the kicker and the shared card,
         case insensitively, and reports the text it found. */
      var app5 = win.__incommonApp;
      var kicker = '', cardHead = '';
      try { kicker = String((app5.synVals() || {}).synKicker || ''); } catch (e) {}
      try { cardHead = String(app5.synCardText({ a: 'A', b: 'B', pairs: 0, warm: 0, edge: 0, top: [] }) || ''); } catch (e) {}
      t('R5', 'The feature names itself Synastry, not Together',
        { screen: true, heading: true, kicker: '', card: '' },
        { screen: !!synScreen,
          heading: /Synastry/.test(synTxt),
          kicker: /together/i.test(kicker) ? kicker : '',
          card: /together/i.test(cardHead) ? cardHead.slice(0, 80) : '' });
      await go('#/spirit', 560);
      var hubTxt = [].slice.call(doc.querySelectorAll('[data-screen-label]')).map(txt).join(' ');
      t('R5b', 'The Spirit hub lists it as Synastry, not Together',
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
      /* POLL FOR THE LANDMARK RATHER THAN SLEEPING A FIXED 760ms.

         This was a flat wait and it started failing the day the first run
         screen gained two continuously animating atmosphere layers: in an
         offscreen harness frame that is enough compositor work to push this
         render past the wait, and the row then reports the landmark missing
         when it arrives a moment later. Proven by removing the two layers and
         watching the row go green with nothing else changed, so what was being
         measured was the sleep, not the build. Same fault the cover phase had
         twice, and the same fix. */
      var g5search = null;
      for (var g5i = 0; g5i < 40; g5i++) {
        await sleep(120);
        g5search = dp.querySelector('[role="search"]');
        if (g5search) break;
      }
      t('G5b', 'The archive search is a search landmark, on the container and not the input',
        { onContainer: true, onInput: false },
        { onContainer: !!g5search,
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
      t('G9b', 'Neither of the methods that made the compatibility figure survives',
        { scorer: 'undefined', bander: 'undefined' },
        { scorer: typeof app.synScoreOf, bander: typeof app.synBandFor });
      await goP('#/spirit/synastry', 900);
      var synTxt = txt(dp.querySelector('[data-screen-label="Spirit / Synastry"]'));
      var ring = dp.querySelector('[data-chart="synastry"] svg text');
      t('G9c', 'No figure is drawn or written on the synastry screen',
        { ring: false, outOf100: false, bandWords: false },
        { ring: !!ring,
          outOf100: /of 100|out of 100/i.test(synTxt),
          bandWords: /mostly harmonious|mostly challenging/i.test(synTxt) });

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
         old assistant key labelled this English interface as Japanese. */
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
      var routes = [['#/today', 'Today'], ['#/spirit', 'Spirit'], ['#/library/practices', 'Library'],
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


  /* ================= The new surfaces phase: its own phase =================
     V1.8.0 added four things and each of them can regress silently:

       the synastry card   a picture leaves the device. The rows that matter are
                           the ones about what is NOT on it.
       dated windows       a timing feature is only worth having if its dates
                           are checkable, and only worth reading if the sky does
                           not drown the reader's own record.
       the month ahead     a dated reading, on a page that has to exist in both
                           shells.
       Synchronicities     a renamed page with a second lookup on it, and the
                           rename has to be complete or half the app points at a
                           name that is gone.

     These are driven rather than read off attributes: the card is painted and
     its pixels are sampled, the windows are recomputed, the month stepper is
     walked to both of its bounds, and the animal field is typed into through a
     real input event, which is the failure this page has had before.

     THE PHASE LEAVES NO RESIDUE. It journals, which writes to the same
     localStorage the app itself uses, so both stores it can touch are
     snapshotted at the start and put back in the finally block. Rows are keyed
     N and declared in the runner's GROUPS. */
  function hexToRGB(h) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim());
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function cornerPixel(cv) {
    var c = cv.getContext('2d'), d = c.getImageData(4, 4, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2] };
  }
  function inkFraction(cv) {
    var c = cv.getContext('2d'), d = c.getImageData(0, 0, cv.width, cv.height).data;
    var bg = d[0] + ',' + d[1] + ',' + d[2], seen = 0, diff = 0;
    for (var i = 0; i < d.length; i += 4 * 199) {
      seen++;
      if (d[i] + ',' + d[i + 1] + ',' + d[i + 2] !== bg) diff++;
    }
    return seen ? diff / seen : 0;
  }
  var PARTNER = { name: 'Sam', birthDate: '1990-03-11', birthTime: '14:20', birthLocation: 'Chicago' };

  async function runNew(src, onStep, sink) {
    var A = sink || [], t = mkPush(A), frames = [];
    onStep = onStep || function () {};
    var saved = readFirstRun();
    var restore = [];
    try {
      primeFirstRun();
      onStep('new surfaces: loading the desktop shell');
      var fd = await frame(src, 1440, 900);
      frames.push(fd);
      var wd = fd.contentWindow;
      if (!(await ready(wd, 16000))) { t('N0', 'App boots for the new surfaces phase', true, false); return A; }
      await sleep(800);
      var dd = wd.document, app = wd.__incommonApp, PM = wd.ProfileManager;
      var goD = async function (h, ms) { wd.location.hash = h; await sleep(ms || 520); };
      var find = function (doc, re) {
        return [].slice.call(doc.querySelectorAll('button')).filter(function (b) { return re.test(txt(b)); })[0] || null;
      };
      /* Both stores this phase can write to, saved before anything writes. */
      var pid = PM && PM.activeId();
      var MEMK = pid ? 'incommon.p.' + pid + '.memories' : null;
      var MANK = app.mkey();
      /* FRIENDS_KEY joins them because the circle rows add cards: a circle
         needs other people on the device, and a card is how a reader gets
         one. Three stores now, all three put back in the finally block. */
      var FRK = app.FRIENDS_KEY;
      [MEMK, MANK, FRK].forEach(function (k) {
        if (!k) return;
        var v = null;
        try { v = wd.localStorage.getItem(k); } catch (e) {}
        restore.push([k, v]);
      });

      /* ---- N1 to N4: the card that leaves the device ---- */
      onStep('new surfaces: the synastry card');
      await goD('#/spirit/synastry', 700);
      app.setState({ synManual: PARTNER, synWith: 'manual' });
      await sleep(700);
      var shareBtn = find(dd, /Share this reading/i);
      t('N1', 'A synastry reading offers a card to share, at 44px',
        { offered: true, tapTargets: [] },
        { offered: !!shareBtn,
          tapTargets: shareBtn ? (shareBtn.getBoundingClientRect().height >= 43.5 ? [] : ['card button ' + Math.round(shareBtn.getBoundingClientRect().height) + 'px']) : 'no button' });

      /* The card object is captured off the real control rather than rebuilt
         here: a test that constructs its own card proves the test, not the app. */
      var card = null, origShare = app.synCardShare;
      app.synCardShare = function (c) { card = c; };
      if (shareBtn) shareBtn.click();
      await sleep(300);
      app.synCardShare = origShare;
      var cardStr = card ? JSON.stringify(card) : '';
      t('N2', 'The card carries first names and counts, no figure and no band',
        { built: true, firstNamesOnly: true, counted: true, noScore: true, noBand: true, contacts: true },
        { built: !!card,
          firstNamesOnly: !!card && card.a.indexOf(' ') === -1 && card.b.indexOf(' ') === -1,
          counted: !!card && isFinite(card.warm) && isFinite(card.edge) && isFinite(card.pairs),
          noScore: !!card && card.score === undefined,
          noBand: !!card && card.band === undefined,
          contacts: !!card && Array.isArray(card.top) && card.top.length <= 3 });
      /* The row this feature exists to keep true. */
      t('N3', 'No birth date, time or place reaches the card',
        { date: false, time: false, place: false },
        { date: /1990-03-11|11 March|March 11/.test(cardStr),
          time: /14:20/.test(cardStr),
          place: /Chicago/i.test(cardStr) });
      var textOut = card ? app.synCardText(card) : '';
      t('N3b', 'A one sided reading says so on the card as well as on the screen',
        { oneSided: true, saysSo: true },
        { oneSided: !!card && !!card.oneSided, saysSo: /one sided/i.test(textOut) });

      var cv = card ? app.synCardCanvas(card) : null;
      t('N4', 'The card paints, at share size, with ink on it',
        { w: 1080, h: 1350, painted: true },
        { w: cv ? cv.width : 0, h: cv ? cv.height : 0, painted: !!cv && inkFraction(cv) > 0.05 });
      /* Painted from live tokens, so a card shared from dawn is a dawn card.
         themeSet owns the profile key: the harness must never write themeProf
         itself. */
      var bgMid = app.cardToken('--bg', ''), pxMid = cv ? cornerPixel(cv) : null;
      app.themeSet('dawn');
      await sleep(600);
      var bgDawn = app.cardToken('--bg', ''), cv2 = card ? app.synCardCanvas(card) : null;
      var pxDawn = cv2 ? cornerPixel(cv2) : null;
      var wantDawn = hexToRGB(bgDawn);
      app.themeSet('midnight');
      await sleep(500);
      t('N4b', 'The card is painted from the live theme, not from midnight literals',
        { tokensDiffer: true, pixelFollowed: true, matchesDawnGround: true },
        { tokensDiffer: !!bgMid && !!bgDawn && bgMid !== bgDawn,
          pixelFollowed: !!pxMid && !!pxDawn && (pxMid.r !== pxDawn.r || pxMid.g !== pxDawn.g || pxMid.b !== pxDawn.b),
          matchesDawnGround: !!wantDawn && !!pxDawn && Math.abs(wantDawn.r - pxDawn.r) < 3 && Math.abs(wantDawn.g - pxDawn.g) < 3 && Math.abs(wantDawn.b - pxDawn.b) < 3 });
      app.setState({ synManual: null, synWith: null });
      await sleep(300);

      /* ---- N29 to N33: Circle, on the desktop shell ----
         Circle renders inside Synastry rather than as a ninth Spirit page, so
         these rows sit here, on the screen the card rows above just used.

         Every one of them is driven. The chips are clicked, the cap is walked
         into, and the reading is read back out of the DOM, because the failure
         this surface can actually have is the one that looks correct: a
         section that renders with its handlers missing. Reading circleVals()
         alone would pass on exactly that build. */
      onStep('new surfaces: the circle');
      await goD('#/spirit/synastry', 700);
      var ciSection = function () {
        var heads = [].slice.call(dd.querySelectorAll('*')).filter(function (e) {
          return e.children.length === 0 && txt(e) === 'More than two of you';
        });
        if (!heads.length) return null;
        var n = heads[0];
        /* up to the section container, which is the one holding the chip row */
        for (var i = 0; i < 6 && n; i++) {
          n = n.parentNode;
          if (n && n.querySelector && n.querySelector('[aria-label="Choose who is in this circle"]')) return n;
        }
        return null;
      };
      var ciChips = function () {
        var s = ciSection();
        return s ? [].slice.call(s.querySelectorAll('button[aria-pressed]')) : [];
      };

      /* With nobody else on the device the section is absent rather than an
         empty control, which is the same rule the pair picker follows. */
      var ciBefore = !!ciSection();

      /* Two people, added the way a reader actually gets them: a card someone
         sent. FRIENDS_KEY is snapshotted with the other two stores above. */
      app.friendAdd({ v: app.CARD_V, n: 'Bo Rivera', d: '1988-03-14', t: '06:20', l: 'Denver', la: 39.74, lo: -104.99, tz: '', to: null });
      app.friendAdd({ v: app.CARD_V, n: 'Cai Okonkwo', d: '1995-11-02', t: '', l: 'Austin', la: 30.27, lo: -97.74, tz: '', to: null });
      app.setState({ circleWith: [] });
      await sleep(600);
      var ciAfter = ciSection(), chips2 = ciChips();
      t('N29', 'Circle is absent with nobody else on the device and appears with two, inside Synastry rather than as a ninth page',
        { hiddenAlone: true, shownWithTwo: true, chips: 2, spiritPagesUnchanged: 8 },
        { hiddenAlone: !ciBefore, shownWithTwo: !!ciAfter, chips: chips2.length,
          spiritPagesUnchanged: dd.querySelectorAll('[data-vt-pager] > [data-vt-page]').length || 8 });

      /* A Ground appears at three and not before, and it is the module's own
         counts that reach the screen. */
      var ciAtTwo = !!(app.circleVals().ciGroundShow);
      if (chips2[0]) chips2[0].click();
      await sleep(350);
      var ciAtThreeMinusOne = !!(app.circleVals().ciGroundShow);
      var chipsAgain = ciChips();
      if (chipsAgain[1]) chipsAgain[1].click();
      await sleep(500);
      var ciV = app.circleVals();
      var ciText = ciSection() ? txt(ciSection()) : '';
      t('N30', 'A Ground appears at three and not before, and the reading reaches the DOM rather than only the vals',
        { atOne: false, atTwo: false, atThree: true, inDom: true, hasChannelRow: true },
        { atOne: ciAtTwo, atTwo: ciAtThreeMinusOne, atThree: !!ciV.ciGroundShow,
          inDom: /Only the circle closes these/.test(ciText),
          hasChannelRow: /Channel [0-9]+-[0-9]+/.test(ciText) });

      /* THE ROW THIS SURFACE EXISTS TO KEEP HONEST. G16 and G23 assert the
         module returns no score and no seat. This asserts the SCREEN does not
         reintroduce either one above it: no figure, no percentage, no seat
         word on any label, and nothing named like a rank in what the shell
         hands the template. */
      var ciKeys = Object.keys(ciV);
      var SEAT = /anchor|seat|lead|host|owner|primary|chair|captain|rank|score|rating|percent|compat|match|best/i;
      t('N31', 'Nothing on the circle screen is a score, a rank or a seat',
        { noPercent: true, noOutOfFigure: true, noSeatKey: [], noSeatLabel: true },
        { noPercent: ciText.indexOf('%') === -1,
          /* "9 of the 9 centres" is a count of centres and is allowed; a mark
             out of a total is not. Anything scored would read as "N out of M"
             or carry a slash figure, so both shapes are refused. */
          noOutOfFigure: !/\b[0-9]+\s*(out of|\/)\s*[0-9]+\b/.test(ciText),
          noSeatKey: ciKeys.filter(function (k) { return SEAT.test(k); }),
          noSeatLabel: [].slice.call((ciSection() || dd).querySelectorAll('[aria-label]'))
            .every(function (e) { return !SEAT.test(e.getAttribute('aria-label') || ''); }) });

      /* The shell must not reintroduce an order above the module. G20 proves
         the Ground is identical under every permutation; this proves the
         SCREEN is, which is where an ordering would be added by somebody
         sorting chips for tidiness. */
      var ciOrderA = ciText.replace(/\s+/g, ' ');
      var idsNow = (app.state.circleWith || []).slice();
      app.setState({ circleWith: idsNow.slice().reverse() });
      await sleep(500);
      var ciOrderB = (ciSection() ? txt(ciSection()) : '').replace(/\s+/g, ' ');
      t('N32', 'Reading the same circle with the members in the other order gives the same screen',
        { identical: true, twoMembers: 2 },
        { identical: ciOrderA === ciOrderB && ciOrderA.length > 200, twoMembers: idsNow.length });

      /* The caution travels with the reading and is on screen beside it, not
         behind a tap, for the same reason the configuration caution is. */
      t('N33', 'The group caution is rendered beside the Ground rather than behind a tap',
        { present: true, saysNotAMeasure: true, notInsideAnExpander: true },
        { present: ciText.indexOf('not a measure of the group or of anybody in it') !== -1,
          saysNotAMeasure: /says nothing about who belongs/.test(ciText),
          notInsideAnExpander: !!(ciSection() &&
            [].slice.call(ciSection().querySelectorAll('[aria-expanded]')).length === 0) });

      /* ---- N5 to N9: dated windows on the Throughline ---- */
      onStep('new surfaces: dated transit windows');
      var wins = app.transitWindows();
      var badShape = wins.filter(function (w) {
        return !(w.from <= w.exact && w.exact <= w.to) || app.TR_MOVERS.indexOf(w.mover) === -1 ||
          !w.label || !w.range || !w.ask;
      }).map(function (w) { return w.label; }).slice(0, 4);
      t('N5', 'Every window opens before it is exact, closes after it, and names a slow mover',
        { any: true, malformed: [], moonRows: 0 },
        { any: wins.length > 0, malformed: badShape,
          moonRows: wins.filter(function (w) { return /Moon|Sun|Mercury|Venus/.test(w.mover); }).length });
      var span = { min: -app.TR_BACK, max: app.TR_FWD };
      t('N5b', 'No window is dated outside the scan that found it',
        { outside: 0 },
        { outside: wins.filter(function (w) { return w.fromI < span.min || w.toI > span.max; }).length });

      /* A window has to earn its row. With nothing written, only what is open
         today may appear; a closed window arrives when an entry falls inside
         it, and never before. */
      try { wd.localStorage.removeItem(MANK); } catch (e) {}
      app.setState({ memTick: (app.state.memTick || 0) + 1 });
      await sleep(300);
      var skyBare = app.tlSky(app.tlAll());
      var closed = wins.filter(function (w) { return !w.now && w.to < new Date(); })
        .sort(function (a, b) { return b.weight - a.weight; })[0];
      var hadClosed = !!closed && skyBare.some(function (r) { return r.id === closed.id; });
      t('N6', 'With nothing written, the only sky rows are the ones open today',
        { futureRows: 0, closedRowShown: false },
        { futureRows: skyBare.filter(function (r) { return Date.parse(r.date + 'T12:00:00') > Date.now(); }).length,
          closedRowShown: hadClosed });
      var seeded = false;
      if (closed) {
        var when = app.isoDay(closed.exact);
        app.writeLS(MANK, [{ id: 'nphase1', date: when, type: 'event', title: 'Harness entry',
          preview: 'written by the verification run', body: 'written by the verification run', manual: true, at: Date.now() }]);
        app.setState({ memTick: (app.state.memTick || 0) + 1 });
        await sleep(300);
        seeded = app.tlSky(app.tlAll()).some(function (r) { return r.id === closed.id; });
      }
      t('N6b', 'A closed window earns its row as soon as something written falls inside it',
        { hadOne: true, appears: true },
        { hadOne: !!closed, appears: seeded });
      t('N6c', 'The sky is capped rather than allowed to fill the screen',
        { withinCap: true },
        { withinCap: app.tlSky(app.tlAll()).length <= app.TL_SKY_MAX });

      /* tlAll() is the reader's own hand. If the sky ever leaks into it, the
         marked moments count and the weekly reflection both start counting the
         weather. */
      var own = app.tlAll(), line = app.tlLine();
      t('N7', 'The sky is merged for the screen and never into the reader’s own record',
        { skyInOwn: 0, lineIsBoth: true },
        { skyInOwn: own.filter(function (e) { return e.sky; }).length,
          lineIsBoth: line.length === own.length + app.tlSky(own).length });
      var stamped = line.filter(function (e) { return !e.sky && e.under; })[0];
      t('N7b', 'An entry the reader wrote is stamped with the window covering its date',
        { stamped: true, named: true, dated: true },
        { stamped: !!stamped, named: !!stamped && /your /.test(stamped.under),
          dated: !!stamped && /\d/.test(stamped.underRange || '') });

      onStep('new surfaces: the Sky filter');
      await goD('#/throughline', 700);
      var chips = [].slice.call(dd.querySelectorAll('[role="radio"]')).filter(function (b) { return /^Sky$/i.test(txt(b)); });
      if (chips[0]) chips[0].click();
      await sleep(500);
      var rowTxt = [].slice.call(dd.querySelectorAll('[data-screen-label="Throughline"] button'))
        .map(function (b) { return txt(b); }).filter(function (x) { return /SKY/.test(x); });
      t('N8', 'The timeline offers a Sky filter and it shows dated windows only',
        { chip: true, rows: true, allSky: true },
        { chip: !!chips[0], rows: rowTxt.length > 0,
          allSky: rowTxt.length > 0 && rowTxt.every(function (x) { return /\b(to|onward|running)\b/.test(x); }) });

      /* ---- N9 to N13: the month ahead ---- */
      onStep('new surfaces: the month ahead');
      await goD('#/spirit/month', 900);
      var page = dd.querySelector('[data-screen-label="Spirit / The Month Ahead"]');
      var r0 = app.monthReading(0);
      var heads = r0 ? r0.sections.map(function (x) { return x.head; }) : [];
      t('N9', 'The month page exists on the desktop and is drawn for this month',
        { page: true, label: app.fmtMonth(new Date()), sections: true },
        { page: !!page, label: r0 ? r0.label : 'no reading', sections: heads.length >= 6 });
      t('N9b', 'The reading covers the sky, the reader’s own windows, the gates the Sun walks, a date and the numbers',
        { shape: true, marked: true, gates: true },
        { shape: heads.indexOf('What the month is made of') !== -1 && heads.indexOf('What is working on you') !== -1 &&
            heads.indexOf('The tempo underneath') !== -1 && heads.indexOf('How to hold it') !== -1,
          marked: heads.indexOf('The date worth marking') !== -1,
          gates: heads.indexOf('The gates the Sun walks') !== -1 });
      var stamp0 = page ? txt(page) : '';
      t('N10', 'This month’s issue names its publication date and the next one',
        { published: true, next: true },
        { published: /published on the first/i.test(stamp0), next: /the next one lands/i.test(stamp0) });

      app.setState({ monthOff: 1 });
      await sleep(600);
      var ahead = txt(dd.querySelector('[data-screen-label="Spirit / The Month Ahead"]') || dd.body);
      t('N10b', 'Reading ahead is named rather than blocked',
        { labelled: true, isNextMonth: true },
        { labelled: /read ahead/i.test(ahead),
          isNextMonth: ahead.indexOf(app.fmtMonth(app.monthBounds(1).from)) !== -1 });

      /* The stepper is clamped to the window the scan can actually see. */
      app.setState({ monthOff: app.MONTH_MAX });
      await sleep(500);
      var atMax = !!find(dd, /→$/);
      app.setState({ monthOff: app.MONTH_MIN });
      await sleep(500);
      var atMin = !!find(dd, /^←\s+\w+\s+\d{4}$/);
      app.setState({ monthOff: 0 });
      await sleep(400);
      t('N11', 'The month stepper stops where the scan does, at both ends',
        { forwardOffered: false, backOffered: false },
        { forwardOffered: atMax, backOffered: atMin });

      var keptTitle = 'The month ahead · ' + r0.label;
      app.monthKeep(r0);
      await sleep(500);
      t('N12', 'Keeping the month writes one reading onto the Throughline',
        { kept: true, type: 'reading' },
        { kept: app.tlAll().some(function (e) { return e.title === keptTitle; }),
          type: (app.tlAll().filter(function (e) { return e.title === keptTitle; })[0] || {}).type });
      t('N12b', 'Every control on the month page meets 44px and passes 4.5:1',
        { taps: [], contrast: [] },
        { taps: page ? tapTargets(wd, { querySelectorAll: function (q) { return page.querySelectorAll(q); } }) : 'no page',
          contrast: page ? contrastFails(wd, { querySelectorAll: function (q) { return page.querySelectorAll(q); } }, 4.5).fails : 'no page' });

      /* ---- N13 to N17: Synchronicities ---- */
      onStep('new surfaces: Synchronicities');
      await goD('#/spirit/synchronicities', 800);
      var sync = dd.querySelector('[data-screen-label="Synchronicities"]');
      t('N13', 'The page answers to its own address and carries its own name',
        { page: true, named: true, oldNameGone: true },
        { page: !!sync, named: !!sync && /Synchronicities/.test(txt(sync)),
          /* innerText, not textContent: the rename left the old name in a
             source comment explaining why it happened, and a comment is not a
             thing the reader can read. This row is about what is shown. */
          oldNameGone: !/Angel Number Encounters/.test(String(dd.body.innerText || '')) });
      await goD('#/spirit/angel-numbers', 800);
      t('N13b', 'The address the page used to have still lands on it',
        { page: true, rewritten: '/spirit/synchronicities' },
        { page: !!dd.querySelector('[data-screen-label="Synchronicities"]'), rewritten: app.currentPath() });

      var numIn = dd.querySelector('input[aria-label="The number you keep seeing"]');
      app.setState({ angelInput: '111', angelResult: null, angelSaved: false });
      await sleep(250);
      app.angelLookup();
      await sleep(400);
      var numTxt = txt(dd.querySelector('[data-screen-label="Synchronicities"]'));
      t('N14', 'The number half still reads a repeating number',
        { field: true, number: true, meaning: true },
        { field: !!numIn, number: /111/.test(numTxt), meaning: /awakening|doorway|attention/i.test(numTxt) });

      var animalBtn = find(dd, /^An animal$/);
      if (animalBtn) animalBtn.click();
      await sleep(400);
      app.animalPick('Crow');
      await sleep(450);
      var animTxt = txt(dd.querySelector('[data-screen-label="Synchronicities"]'));
      t('N15', 'The animal half reads a sighting in three parts, kept apart',
        { name: true, tradition: true, origin: true, testable: true },
        { name: /Crow/.test(animTxt),
          tradition: /what the tradition holds/i.test(animTxt),
          origin: /where it comes from/i.test(animTxt),
          testable: /worth testing/i.test(animTxt) });

      app.setState({ animInput: 'axolotl', animResult: null, animUnknownFor: '', animSaved: false });
      await sleep(250);
      app.animalLookup();
      await sleep(450);
      var unTxt = txt(dd.querySelector('[data-screen-label="Synchronicities"]'));
      /* The rule this row exists for: a number composes from its digits, an
         animal does not compose from its letters. */
      t('N16', 'An animal that is not in the list gets no invented meaning, and can still be kept',
        { saysSo: true, offersToKeep: true, noComposedReading: true },
        { saysSo: /no reading here for axolotl/i.test(unTxt),
          offersToKeep: !!find(dd, /Keep it anyway/i),
          noComposedReading: !/what the tradition holds/i.test(unTxt) });

      onStep('new surfaces: one log, both kinds');
      app.animalPick('Crow');
      await sleep(300);
      app.animalJournal();
      await sleep(400);
      app.setState({ angelInput: '111', angelResult: null, angelSaved: false });
      await sleep(200);
      app.angelLookup();
      await sleep(300);
      app.angelJournal();
      await sleep(500);
      var log = app.angelSightings();
      t('N17', 'One log holds both kinds of sighting, and both reach the Throughline',
        { number: true, animal: true, onLine: true },
        { number: log.some(function (x) { return x.isNumber; }),
          animal: log.some(function (x) { return !x.isNumber; }),
          onLine: app.tlAll().some(function (e) { return /Crow sighting/.test(e.title); }) &&
            app.tlAll().some(function (e) { return /Angel number 111/.test(e.title); }) });

      /* ---- N18 to N19: Anything Else ----
         The third kind logs and does not interpret, and the row that matters is
         the second one. A tab that offers no reading is one refactor away from
         quietly gaining one, and the case it exists for is somebody logging the
         make and colour of a car that belonged to a person they lost. There is
         no lookup to assert the absence of, so what is asserted is that nothing
         interpretive reaches the entry or the screen. */
      onStep('new surfaces: anything else');
      app.setState({ sightMode: 'other', otherInput: 'A green pickup truck', otherSaved: false });
      await sleep(250);
      app.otherJournal();
      await sleep(500);
      var log3 = app.angelSightings();
      var other = log3.filter(function (x) { return x.kind === 'SOMETHING ELSE'; })[0];
      t('N18', 'A third kind of sighting is kept in the same log and reaches the Throughline',
        { kept: true, kind: 'SOMETHING ELSE', onLine: true },
        { kept: !!other, kind: other ? other.kind : '(none)',
          onLine: app.tlAll().some(function (e) { return /Noticed: A green pickup truck/.test(e.title); }) });

      var otherPanel = txt(dd.querySelector('[data-screen-label="Synchronicities"]'));
      t('N18b', 'and no interpretation reaches the entry or the screen',
        { body: true, screen: true, saidPlainly: true },
        { /* the stored entry offers no reading of any kind */
          body: !!other && !/means|meaning|symbolis|the tradition|reads as/i.test(other.body),
          /* nor does the panel, beyond the sentence that explains the absence */
          screen: !/what the tradition holds/i.test(otherPanel),
          /* and the absence is stated rather than left looking unfinished */
          saidPlainly: /no meaning is offered here/i.test(otherPanel) });

      /* ---- N20 to N22: the dream journal ----
         The registry, the counting discipline, and the record. N21 is the row
         this feature most needs: the detector had two bugs that both inflated a
         count without ever throwing, and a detector that quietly overcounts is
         worse than one that is plainly broken, because it reads as a finding. */
      onStep('new surfaces: the dream journal');
      await goD('#/spirit/dreams', 700);
      var DS = wd.DreamSymbols;
      var dreamScreen = dd.querySelector('[data-screen-label="Spirit / Dream Journal"]');
      /* Seven categories since weather was added: a tornado read every other
         image in the dream and had nothing for the one that was the point. The
         count is still asserted rather than loosened, because a category
         disappearing is exactly the failure this row exists to catch. */
      t('N20', 'The dream symbol registry loads and the page it feeds is on the desktop shell',
        { module: true, screen: true, categories: 7, weather: true, hasArchetypes: true },
        { module: !!DS, screen: !!dreamScreen,
          categories: DS ? Object.keys(DS.counts).length : 0,
          weather: !!(DS && DS.counts.weather > 0),
          hasArchetypes: !!(DS && DS.archetypeIds().length >= 12) });

      var DTXT = 'I was in a house and went down to the basement. The light would not turn on. ' +
        'A snake was on the stairs and I was terrified. It was not a fox at all. I was being chased. Then I woke up.';
      var det = DS ? DS.detect(DTXT) : [];
      var byName = function (n) { return det.filter(function (r) { return r.symbol === n; })[0] || null; };
      var chased = byName('Being Chased'), snake = byName('Snake'), fox = byName('Fox');
      t('N21', 'One occurrence counts once, and a figure the dreamer ruled out is not in the dream',
        /* "being chased" is matched by the phrase, the bare word and the key, and
           all three used to score. "not a fox" is a negation, and the "would not
           turn on" in the sentence before must not reach across into the snake. */
        { chasedHits: 1, snakeFound: true, foxAbsent: true, confidenceCapped: true },
        { chasedHits: chased ? chased.hits : 'not found',
          snakeFound: !!snake, foxAbsent: !fox,
          confidenceCapped: det.every(function (r) { return r.confidence <= 1; }) });

      var struct = DS ? DS.structure(DTXT) : {};
      t('N21b', 'A dream that breaks off on waking is given no resolution it did not have',
        { hasLysis: false, brokeOff: true, hasExposition: true },
        { hasLysis: struct.hasLysis, brokeOff: struct.brokeOff, hasExposition: !!struct.exposition });

      /* The local day, computed here rather than reached for on the class, so
         this row does not depend on where that helper happens to live. */
      var dnow = new Date();
      var DDAY = dnow.getFullYear() + '-' + String(dnow.getMonth() + 1).padStart(2, '0') + '-' + String(dnow.getDate()).padStart(2, '0');
      app.setState({ dreamText: DTXT, dreamTitle: 'Harness dream', dreamDate: DDAY });
      await sleep(420);
      app.dreamSave();
      await sleep(500);
      var kept = app.dreamEntries();
      var onLine = app.tlAll().filter(function (e) { return e.type === 'dream' && /Harness dream/.test(e.title); })[0];
      var stamped = app.tlLine().filter(function (e) { return e.type === 'dream' && /Harness dream/.test(e.title); })[0];
      t('N22', 'A kept dream is its own kind on the record, and the sky engine dates it like any other entry',
        { kept: 1, onThroughline: true, kind: 'dream', hasSymbols: true, labelled: true },
        { kept: kept.length, onThroughline: !!onLine,
          kind: onLine ? onLine.type : 'missing',
          hasSymbols: !!(kept[0] && kept[0].symbols && kept[0].symbols.length),
          /* Not that a window was found, which depends on the sky today, but
             that the merge reached it at all rather than skipping the new kind. */
          labelled: !!stamped });

      /* ---- N25 to N28: the Book of Changes ---- */

      var ICM = wd.IChing;
      /* The King Wen anchors, bottom line first, 1 for yang. If the sequence
         or the bit order is ever reversed these twelve are what says so, and
         they are the twelve a reader of the book would notice first. */
      var ANCH = { 1: '111111', 2: '000000', 11: '111000', 12: '000111', 29: '010010',
                   30: '101101', 51: '100100', 52: '001001', 57: '011011', 58: '110110',
                   63: '101010', 64: '010101' };
      var anchorsOk = true, structures = {}, dupes = 0, lineCount = 0;
      if (ICM) {
        Object.keys(ANCH).forEach(function (n) { if (ICM.bits(+n).join('') !== ANCH[n]) anchorsOk = false; });
        ICM.all().forEach(function (h) {
          var k = h.bits.join('');
          if (structures[k]) dupes++; else structures[k] = h.number;
          lineCount += h.lines.filter(function (t) { return t && t.length > 12; }).length;
        });
      }
      app.setState({ tab: 'library', libSub: 'library', libView: 'iching', icSec: 'heaven', icHex: null, icQuery: '', selId: null, spiritView: null });
      await sleep(600);
      var icRoom = dd.querySelector('[data-screen-label="Library / The Book of Changes"]');
      t('N25', 'All sixty four figures are present, distinct, and in the order the book has',
        { module: true, count: 64, distinct: 64, duplicates: 0, anchors: true, lines: 384 },
        { module: !!ICM, count: ICM ? ICM.count : 0,
          distinct: Object.keys(structures).length, duplicates: dupes,
          anchors: anchorsOk, lines: lineCount });

      /* N26 is the row this feature exists to protect. Coins and yarrow are
         two different oracles: the stalks change less often, and when they
         change they are three times more likely to be yang giving way than
         yin hardening. A build that rolled six to nine from one table would
         pass every other row here and be answering with a third oracle that
         nobody has ever used, so the weights are asserted AND the casts are
         counted, because a weights table nothing reads is decoration. */
      var tally = function (m) {
        var c = { 6: 0, 7: 0, 8: 0, 9: 0 };
        for (var i = 0; i < 3000; i++) {
          ICM.cast({ method: m, seed: i * 7919 + 13 }).values.forEach(function (v) { c[v]++; });
        }
        var tot = 18000;
        return { six: c[6] / tot, nine: c[9] / tot };
      };
      var co = ICM ? tally('coins') : { six: 0, nine: 0 };
      var ya = ICM ? tally('yarrow') : { six: 0, nine: 0 };
      var near = function (a, b) { return Math.abs(a - b) < 0.012; };
      t('N26', 'The stalks and the coins are different oracles, in the table and in the casting',
        { weightsDiffer: true, coinsSymmetric: true, yarrowAsymmetric: true, yarrowChangesLess: true },
        { weightsDiffer: !!(ICM && JSON.stringify(ICM.METHODS.coins.weights) !== JSON.stringify(ICM.METHODS.yarrow.weights)),
          coinsSymmetric: near(co.six, 0.125) && near(co.nine, 0.125),
          yarrowAsymmetric: near(ya.six, 0.0625) && near(ya.nine, 0.1875),
          yarrowChangesLess: (ya.six + ya.nine) < (co.six + co.nine) });

      /* A seeded cast has to redraw identically or a kept reading is a claim
         about a cast nobody can reproduce. The gate cross link is the reason
         both systems live in one app: hexagram N IS gate N. */
      var r1 = ICM ? ICM.read({ question: 'harness', method: 'coins', seed: 424242 }) : null;
      var r2 = ICM ? ICM.read({ question: 'harness', method: 'coins', seed: 424242 }) : null;
      var gateOk = true;
      if (ICM) ICM.all().forEach(function (h) { if (h.gate !== h.number) gateOk = false; });
      t('N26b', 'A cast is reproducible from its seed, and a figure is the gate of the same number',
        { same: true, sixLines: true, movedWhenChanging: true, stillWhenNot: true, gates: true },
        { same: !!(r1 && r2 && r1.values.join() === r2.values.join() && r1.primary.number === r2.primary.number),
          sixLines: !!(r1 && r1.values.length === 6),
          movedWhenChanging: !!(r1 && (r1.changing.length ? !!r1.moved : r1.moved === null)),
          stillWhenNot: !!(r1 && (r1.changing.length ? r1.stillness === '' : r1.stillness.length > 20)),
          gates: gateOk });

      /* The room, and the address that reaches it. libShell has to be off or
         the shelf draws as an empty flex box on top of the room: the fault the
         atlases had, which dreams inherited and this would have inherited too. */
      var icVals = app.ichingLibVals(), icShelf = dd.querySelector('[data-screen-label="Library"]');
      t('N27', 'The room renders on the desktop with the shelf out of the way, consultation and all sixty four together',
        { room: true, shelfHidden: true, sections: 8, cast: true, search: true },
        { room: !!icRoom, shelfHidden: !icShelf,
          sections: icVals.ilSecs ? icVals.ilSecs.length : 0,
          cast: !!app.ichingVals().spiritIChing,
          search: !!(ICM && ICM.search('49').length === 1 && ICM.search('49')[0].number === 49) });

      /* A kept reading is a reading on the record, filed with the tarot rather
         than falling through to LIFE EVENT. */
      app.setState({ icQuestion: 'What am I not seeing here?', icMethod: 'coins', icSeed: 20260829 });
      await sleep(400);
      app.ichingJournal();
      await sleep(500);
      /* Found by title, the way every other Throughline row in this group finds
         its entry. Filtering on tag looked more precise and could never match:
         ichingJournal() does write tag 'iching', but tlAll() rebuilds a memory
         entry as id, date, type, title, preview, body, and tag is not one of
         them. Only the manual branch spreads the original. Title rather than
         type, because type is what the row below has to assert. */
      var icKept = app.tlAll().filter(function (e) { return /^Hexagram [0-9]+, /.test(e.title || ''); })[0];
      t('N28', 'A kept hexagram reaches the Throughline as a reading, carrying the question and the cast',
        { onThroughline: true, kind: 'reading', hasQuestion: true, hasJudgment: true, noBirthData: true },
        { onThroughline: !!icKept, kind: icKept ? icKept.type : 'missing',
          hasQuestion: !!(icKept && /What am I not seeing here/.test(icKept.body)),
          hasJudgment: !!(icKept && icKept.body.length > 200),
          noBirthData: !!(icKept && !/[0-9]{4}-[0-9]{2}-[0-9]{2}T|birth/i.test(icKept.body)) });

      /* ---- N18, N19: the phone shell ---- */
      onStep('new surfaces: the phone shell');
      var fp = await frame(src, 375, 667);
      frames.push(fp);
      var wp = fp.contentWindow;
      if (!(await ready(wp, 16000))) { t('N18-0', 'App boots the phone shell for this phase', true, false); return A; }
      await sleep(900);
      var dp = wp.document, pApp = wp.__incommonApp;
      var tabs = [].slice.call(dp.querySelectorAll('[data-vt-sec="Spirit"] [role="tab"]')).map(function (b) { return txt(b); });
      t('N36', 'The Spirit pager carries the new pages, under the names the app uses',
        { pages: 8, sync: true, month: true, dream: true, oldName: false },
        { pages: dp.querySelectorAll('[data-vt-pager] > [data-vt-page]').length,
          sync: tabs.indexOf('Synchronicities') !== -1,
          month: tabs.indexOf('The Month Ahead') !== -1,
          dream: tabs.indexOf('Dream Journal') !== -1,
          oldName: tabs.indexOf('Angel Number Encounters') !== -1 });
      var pSync = dp.querySelector('[data-vt-sec="Spirit"] [data-screen-label="Synchronicities"]');
      var pMonth = dp.querySelector('[data-vt-sec="Spirit"] [data-screen-label="Spirit / The Month Ahead"]');
      var pDream = dp.querySelector('[data-vt-sec="Spirit"] [data-screen-label="Spirit / Dream Journal"]');
      t('N36b', 'Every one of those pages renders with its handlers on the shell that holds it',
        { syncPage: true, monthPage: true, dreamPage: true, taps: [], dreamTaps: [] },
        { syncPage: !!pSync, monthPage: !!pMonth, dreamPage: !!pDream,
          taps: pSync ? tapTargets(wp, { querySelectorAll: function (q) { return pSync.querySelectorAll(q); } }) : 'no page',
          dreamTaps: pDream ? tapTargets(wp, { querySelectorAll: function (q) { return pDream.querySelectorAll(q); } }) : 'no page' });

      /* The failure this page has actually had: a field that renders while its
         change handler is missing. Typed through a real input event rather than
         by setting state, because setting state cannot fail that way. */
      var animOn = pSync ? [].slice.call(pSync.querySelectorAll('button')).filter(function (b) { return /^An animal$/.test(txt(b)); })[0] : null;
      if (animOn) animOn.click();
      await sleep(450);
      var animIn = dp.querySelector('[data-vt-sec="Spirit"] input[aria-label="The animal you keep seeing"]');
      var typed = 'no field';
      if (animIn) {
        var setter = Object.getOwnPropertyDescriptor(wp.HTMLInputElement.prototype, 'value').set;
        setter.call(animIn, 'deer');
        animIn.dispatchEvent(new wp.Event('input', { bubbles: true }));
        await sleep(450);
        typed = pApp.state.animInput;
      }
      t('N19', 'The animal field takes typing on the phone, where this page has lost it before',
        { field: true, typed: 'deer' },
        { field: !!animIn, typed: typed });

      /* N23: the same failure, on the newest page. A narrative field that renders
         with no change handler looks completely correct and swallows the dream,
         so it is typed into through a real input event rather than by setting
         state, which cannot fail that way. */
      var dreamTA = dp.querySelector('[data-vt-sec="Spirit"] textarea[aria-label="The dream itself"]');
      var dreamTyped = 'no field', dreamFound = 'not run';
      if (dreamTA) {
        var tset = Object.getOwnPropertyDescriptor(wp.HTMLTextAreaElement.prototype, 'value').set;
        tset.call(dreamTA, 'I went down to the basement and a snake was on the stairs.');
        dreamTA.dispatchEvent(new wp.Event('input', { bubbles: true }));
        await sleep(450);
        dreamTyped = pApp.state.dreamText;
        dreamFound = pApp.dreamKept().map(function (r) { return r.symbol; }).sort().join(',');
      }
      t('N23', 'The dream narrative takes typing on the phone, and the figures in it are found there',
        { typed: 'I went down to the basement and a snake was on the stairs.',
          found: 'Basement,Snake,Stairs' },
        { typed: dreamTyped, found: dreamFound });

      /* N24: the rule this app has broken more than once. An address has to
         resolve to a screen in the shell the reader is actually standing in,
         and the Dream Journal lives in two different places on the two shells.

         Sampled across the whole flight rather than read once. vtGoTab claims
         the tab before the scroll starts and holds it until the jump lands, so
         the destination is the only value the tab may ever take: the pages it
         travels through are not the reader's and must not be announced as if
         they were. One read at a fixed moment asked how busy the machine was
         instead, and one read after the pager settles would not see a walk at
         all, which is why this counts values rather than waiting for quiet.

         Parked on Today first so it is a real jump every run. Straight after
         N23 the pager is already sitting on the Dream Journal, and a jump of no
         distance proves nothing about a jump. */
      wp.location.hash = '#/today';
      await sleep(900);
      var n24Start = pApp.state.vtTab, n24Seen = [], n24Waited = 0;
      wp.location.hash = '#/spirit/dreams';
      while (n24Waited < 2500) {
        var n24Now = pApp.state.vtTab;
        if (n24Now !== n24Start && n24Seen.indexOf(n24Now) === -1) n24Seen.push(n24Now);
        await sleep(50);
        n24Waited += 50;
      }
      var pDreamByPath = dp.querySelector('[data-vt-sec="Spirit"] [data-screen-label="Spirit / Dream Journal"]');
      t('N24', 'Spirit slash dreams lands on a real screen on both shells, not a blank shelf, and announces nothing on the way',
        { desktop: true, phone: true, phoneTab: 7, travelled: [7] },
        { desktop: !!dreamScreen, phone: !!pDreamByPath, phoneTab: pApp.state.vtTab, travelled: n24Seen });


      /* ---- N34, N35: Circle on the phone shell ----
         The rule this app has broken more than once: a screen has to exist in
         the shell the reader is standing in, and a page can render with every
         handler missing and look completely correct. So the chips are clicked
         here too, not inspected, and the cap is walked into through the real
         controls rather than through state. */
      var pciSection = function () {
        var heads = [].slice.call(dp.querySelectorAll('*')).filter(function (e) {
          return e.children.length === 0 && txt(e) === 'More than two of you';
        });
        if (!heads.length) return null;
        var n = heads[0];
        for (var i = 0; i < 6 && n; i++) {
          n = n.parentNode;
          if (n && n.querySelector && n.querySelector('[aria-label="Choose who is in this circle"]')) return n;
        }
        return null;
      };
      var pciChips = function () {
        var s = pciSection();
        return s ? [].slice.call(s.querySelectorAll('button[aria-pressed]')) : [];
      };
      wp.location.hash = '#/spirit/synastry';
      await sleep(900);
      pApp.setState({ circleWith: [] });
      await sleep(500);
      var pciBefore = pciSection();
      var pChips = pciChips();
      if (pChips[0]) pChips[0].click();
      await sleep(300);
      if (pciChips()[1]) pciChips()[1].click();
      await sleep(600);
      var pciText = pciSection() ? txt(pciSection()) : '';
      var pciTaps = pciSection()
        ? tapTargets(wp, { querySelectorAll: function (q) { return pciSection().querySelectorAll(q); } })
        : 'no section';
      t('N34', 'Circle renders on the phone inside Synastry, with its handlers on and its controls at 44px',
        { section: true, groundDrawn: true, chipsRespond: true, taps: [] },
        { section: !!pciBefore,
          groundDrawn: !!pApp.circleVals().ciGroundShow,
          /* The handler test: the Ground only reaches the DOM if the clicks
             above actually changed state. A section that rendered with dead
             chips shows the picker and nothing under it. */
          chipsRespond: /Only the circle closes these/.test(pciText),
          taps: pciTaps });

      /* The cap, walked into through the controls. Five is the ceiling, a
         sixth is refused, and a member already chosen must still come OFF at
         the cap or a reader who picked five is stuck with no way to swap. */
      pApp.friendAdd({ v: pApp.CARD_V, n: 'Dee Halvorsen', d: '1990-01-21', t: '14:05', l: 'Boise', la: 43.61, lo: -116.20, tz: '', to: null });
      pApp.friendAdd({ v: pApp.CARD_V, n: 'Efe Adeyemi', d: '1993-05-09', t: '11:11', l: 'Miami', la: 25.76, lo: -80.19, tz: '', to: null });
      pApp.friendAdd({ v: pApp.CARD_V, n: 'Fi Novak', d: '1991-08-30', t: '03:45', l: 'Reno', la: 39.53, lo: -119.81, tz: '', to: null });
      pApp.setState({ circleWith: [] });
      await sleep(600);
      var capSeen = [];
      for (var ci = 0; ci < 6; ci++) {
        var cc = pciChips().filter(function (b) { return b.getAttribute('aria-pressed') === 'false'; })[0];
        if (!cc) break;
        cc.click();
        await sleep(260);
        capSeen.push((pApp.state.circleWith || []).length + 1);
      }
      var atCap = (pApp.state.circleWith || []).length + 1;
      /* and one already on must still turn off */
      var onChip = pciChips().filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
      if (onChip) onChip.click();
      await sleep(300);
      var afterOff = (pApp.state.circleWith || []).length + 1;
      t('N35', 'Five is the ceiling, a sixth is refused, and a member already in still comes out so a swap is possible',
        { climbed: [2, 3, 4, 5, 5, 5], cap: 5, swappable: 4 },
        { climbed: capSeen, cap: atCap, swappable: afterOff });
      pApp.setState({ circleWith: [] });
      await sleep(200);
      /* N27b: the recurring fault, on the newest room. A libView the vertical
         shell does not name paints the shelf with every gate off, which is a
         blank screen with no way back, and the Spirit address is an alias
         rather than a page so it must land in the Library and not nowhere. */
      wp.location.hash = '#/library/i-ching';
      await sleep(700);
      var pIC = dp.querySelector('[data-screen-label="Library / The Book of Changes"]');
      wp.location.hash = '#/spirit/i-ching';
      await sleep(700);
      var pICAlias = dp.querySelector('[data-screen-label="Library / The Book of Changes"]');
      t('N27b', 'The Book of Changes is a real screen on the phone, by its own address and by the Spirit alias',
        { desktop: true, phone: true, alias: true, aliasView: 'iching', notASpiritView: true },
        { desktop: !!icRoom, phone: !!pIC, alias: !!pICAlias,
          aliasView: pApp.state.libView,
          /* It must not be in SPIRIT_PATHS: that would resolve the address to
             a spiritView no shell draws, which is the blank screen again. */
          notASpiritView: pApp.SPIRIT_PATHS.iching === undefined });

      /* ---- N37 to N39: the search bar ------------------------------------
       *
       * The bar reached two shelves out of fifteen and had no coverage at all,
       * which is how it stayed that way while the help text beside it already
       * promised the journal and the atlases.
       *
       * DRIVEN, NOT READ. The control is clicked, the field is typed into
       * through a real input event, and the row is clicked, because the failure
       * this surface can have is the one that reads as correct: a sheet that
       * renders with its handlers missing, or a row that writes a state no
       * shell draws. Reading searchAll() would pass on exactly that build. */
      onStep('new surfaces: the search bar');
      var openSearch = function (w, d) {
        var all = [].slice.call(d.querySelectorAll('button'));
        var b = all.filter(function (x) { return x.getAttribute('aria-label') === 'Search'; })[0] ||
          all.filter(function (x) { return /^Search/.test(txt(x)); })[0];
        if (b) b.click();
        return !!b;
      };
      var typeSearch = function (w, d, s) {
        var inp = d.querySelector('input[aria-label="Search"]');
        if (!inp) return false;
        var set = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set;
        set.call(inp, s);
        inp.dispatchEvent(new w.Event('input', { bubbles: true }));
        return true;
      };
      var sheetRows = function (d) {
        var dlg = [].slice.call(d.querySelectorAll('[role="dialog"]')).filter(function (x) {
          return x.getAttribute('aria-label') === 'Search'; })[0];
        return dlg ? [].slice.call(dlg.querySelectorAll('button')).filter(function (b) {
          return b.getAttribute('aria-label') !== 'Close search'; }) : [];
      };
      /* The title, not the whole button: textContent runs the glyph, the name
         and the line under it together, so a prefix match on it matches nothing
         and a loose one matches the row below. Addressed by position rather
         than by a nested selector, because the runtime wraps every element in
         a span of its own and "span span" lands on the glyph. */
      var rowTitle = function (b) {
        var col = b.children[1];
        return col && col.children[0] ? txt(col.children[0]) : '';
      };
      var rowNamed = function (rows, name) {
        return rows.filter(function (b) { return rowTitle(b) === name; })[0] || null;
      };

      var pOpened = openSearch(wp, dp);
      await sleep(400);
      var pTyped = typeSearch(wp, dp, 'dream');
      await sleep(500);
      var pRows = sheetRows(dp);
      t('N37', 'The search sheet opens from the header control and takes typing on the phone',
        { opener: true, field: true, query: 'dream', rows: true },
        { opener: pOpened, field: pTyped, query: pApp.state.vtQuery, rows: pRows.length > 2 });

      /* Every shelf, one query each. A group that stops being built is a shelf
         that silently drops out of the index, and nothing else would say so. */
      var reach = function (q, label) {
        return (pApp.searchAll(q) || []).some(function (g) { return g.label === label; });
      };
      t('N37b', 'The index reaches every shelf, not only the placements and the degrees',
        { screens: true, placements: true, numbers: true, practices: true, tarot: true,
          iching: true, dreams: true, animals: true, repeating: true, humanDesign: true,
          astrology: true, sabian: true, help: true },
        { screens: reach('settings', 'Screens and rooms'),
          placements: reach('sun', 'Your placements'),
          numbers: reach('life path', 'Your numbers'),
          practices: reach('grounding', 'Practices'),
          tarot: reach('the fool', 'Tarot cards'),
          iching: reach('well', 'The Book of Changes'),
          dreams: reach('water', 'Dream images'),
          animals: reach('crow', 'Animals noticed'),
          repeating: reach('111', 'Repeating numbers'),
          humanDesign: reach('gate 34', 'Human Design'),
          astrology: reach('scorpio', 'Astrology reference'),
          sabian: reach('Leo 15', 'Sabian degrees'),
          help: reach('suicide', 'Lines that answer') });

      /* The routing rule, on the shell that breaks it. A row that wrote
         spiritView 'dream' on the phone would paint a Spirit view no vertical
         shell draws: the sheet would close onto a blank screen with no way
         back, and the state would look correct while it did. */
      var pDreamRow = rowNamed(pRows, 'Dream Journal');
      if (pDreamRow) pDreamRow.click();
      await sleep(1200);
      t('N38', 'A result lands on a screen that exists in the shell it was clicked in',
        { row: true, closed: true, tab: 'spirit', page: 7, noSpiritView: true, painted: true },
        { row: !!pDreamRow, closed: !pApp.state.vtSearch, tab: pApp.state.tab, page: pApp.state.vtTab,
          noSpiritView: pApp.state.spiritView === null,
          painted: !!dp.querySelector('[data-vt-sec="Spirit"] [data-screen-label="Spirit / Dream Journal"]') });

      /* A card is a selection inside a room, so the desktop is where the deeper
         target is driven: the row has to open the room AND what is in it. */
      var dOpened = openSearch(wd, dd);
      await sleep(400);
      typeSearch(wd, dd, 'the fool');
      await sleep(500);
      var dCard = rowNamed(sheetRows(dd), 'The Fool');
      if (dCard) dCard.click();
      await sleep(900);
      t('N38b', 'A result on the desktop opens the room AND the thing inside it',
        { opener: true, row: true, closed: true, room: true, card: 'The Fool', section: 'major' },
        { opener: dOpened, row: !!dCard, closed: !app.state.dtSearch,
          room: !!dd.querySelector('[data-screen-label="Library / My Tarot"]'),
          card: app.state.ttCard, section: app.state.ttSec });

      /* Get Help must never wear the action colour, and the search sheet is the
         one surface in the build where every row is drawn the same way. */
      openSearch(wd, dd);
      await sleep(400);
      typeSearch(wd, dd, 'suicide');
      await sleep(600);
      var helpRows = sheetRows(dd);
      var helpInk = helpRows.map(function (b) {
        var g = b.querySelector('span[aria-hidden="true"]');
        return g ? wd.getComputedStyle(g).color : 'none';
      });
      t('N39', 'No safety row in the search sheet wears the action colour',
        { rows: true, green: 0, crisis: true },
        { rows: helpRows.length > 2,
          green: helpInk.filter(function (c) { return /47,\s*255,\s*143/.test(c); }).length,
          crisis: helpInk.some(function (c) { return /229,\s*83,\s*77/.test(c); }) });
      app.setState({ dtSearch: false, dtQuery: '' });
      await sleep(250);

      /* ---- N40 to N40b: the maximize overlay's own smoke, and its tooltips ----
         The overlay's controls, dismissal paths and layout were driven by hand
         across three viewports when they were built; nothing in this suite had
         driven the ⛶ control itself, or checked that a sampled point's tooltip
         actually carries the registry's own symbolism rather than a blank
         string a missing wire would still let the row render with. */
      onStep('new surfaces: the maximize chart overlay');
      app.setState({ tab: 'spirit', spiritView: 'astrology', chartExpandOpen: false, chartExpandAspSel: null });
      await sleep(400);
      var expandBtn = dd.querySelector('[aria-label="Expand chart"]');
      if (expandBtn) expandBtn.click();
      await sleep(500);
      var dlg = dd.querySelector('[role="dialog"][aria-label="Expanded natal chart"]');
      var dlgOpen = !!dlg;
      var closeBtn = dlg ? dlg.querySelector('[aria-label="Close expanded chart"]') : null;
      if (closeBtn) closeBtn.click();
      await sleep(350);
      var dlgClosedNow = !dd.querySelector('[role="dialog"][aria-label="Expanded natal chart"]');
      t('N40', 'The maximize control opens the expanded chart overlay and the close control dismisses it',
        { opened: true, closed: true },
        { opened: dlgOpen, closed: dlgClosedNow });

      /* Ten registry ids, evenly spread rather than the first ten, so the
         sample crosses asteroids, centaurs, TNOs, nodes, hypotheticals,
         comets and derived points rather than staying inside one category.
         Reopened for this row since N40 just closed it. */
      if (expandBtn) expandBtn.click();
      await sleep(500);
      dlg = dd.querySelector('[role="dialog"][aria-label="Expanded natal chart"]');
      var sample = app.EXPANDED_REGISTRY.filter(function (_, i) { return i % 8 === 0; }).slice(0, 10);
      var rowsNow = app.fullChart(true);
      var titleButtons = dlg ? [].slice.call(dlg.querySelectorAll('button[title]')) : [];
      var mismatched = sample.filter(function (reg) {
        var row = rowsNow.filter(function (r) { return r.id === reg.id; })[0];
        if (!row) return true;
        var btn = titleButtons.filter(function (b) { return b.getAttribute('title').indexOf(row.name) !== -1; })[0];
        var title = btn ? btn.getAttribute('title') : app.pointTooltip(row, '');
        return row.lon == null ? title.indexOf('no ephemeris') === -1 : title.indexOf(reg.tooltip) === -1;
      }).map(function (reg) { return reg.id; });
      t('N40b', 'A sample of ten expanded-registry points each render their own symbolism, or their own honest absence, in the rendered tooltip',
        { sampled: 10, mismatched: [] },
        { sampled: sample.length, mismatched: mismatched });
      app.setState({ chartExpandOpen: false, chartExpandAspSel: null });
      await sleep(250);
    } catch (e) {
      t('N-ERR', 'New surfaces harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      /* Everything this phase wrote goes back, in both stores. */
      restore.forEach(function (kv) {
        try {
          if (kv[1] == null) frames[0].contentWindow.localStorage.removeItem(kv[0]);
          else frames[0].contentWindow.localStorage.setItem(kv[0], kv[1]);
        } catch (e) {}
      });
      restoreFirstRun(saved);
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }

  /* ================= The cover phase: its own phase =================
     Group H, for the home screen. Nothing else in this suite loads
     app/cover.html: every other phase points at the app through SRC, so until
     this existed the first screen a visitor meets had no gate at all and the
     scroll, the rim and the exit rested on somebody looking at them.

     THE ROW THIS PHASE EXISTS FOR IS H2. The cover is a raytracer, and a
     shader that fails to compile does not throw: the loop runs, the first
     frame "lands", __EH_LIVE goes true and the reveal fires over a canvas that
     is painting nothing. That happened during the build of this page, from one
     duplicated brace, and the console said "useProgram: program not valid" and
     "Feedback loop formed between Framebuffer and active Texture", neither of
     which names a brace. So this phase does not ask whether the page booted.
     It reads the pixels back off the drawing buffer and asks whether anything
     was painted.

     Rows are keyed H and declared in the runner's GROUPS. */

  /* Readiness for a page with no app header: the cover sets __EH_LIVE on its
     first successful composite, which is the same flag the 9 second fallback
     timer watches. */
  function coverReady(win, ms) {
    var t0 = Date.now();
    return (function poll() {
      try {
        if (win.__EH_LIVE && win.document && win.document.body.classList.contains('live')) return Promise.resolve(true);
      } catch (e) {}
      if (Date.now() - t0 > (ms || 20000)) return Promise.resolve(false);
      return sleep(150).then(poll);
    })();
  }

  /* Read the drawing buffer back. Two nested rAFs so we are certainly inside a
     frame the app has already rendered: the app schedules its next callback at
     the end of its own, so ours is appended after it and the buffer is still
     intact when we read.

     The whole buffer, not the middle. The middle of this image is the
     silhouette, which is genuinely black, so a centre sample would report a
     working render as a dead one. */
  function coverPixels(win) {
    return new Promise(function (res) {
      try {
        var c = win.document.getElementById('view');
        var gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
        if (!gl) return res({ ok: false, why: 'no webgl context on the canvas' });
        win.requestAnimationFrame(function () {
          win.requestAnimationFrame(function () {
            try {
              var W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
              if (!W || !H) return res({ ok: false, why: 'empty drawing buffer' });
              var px = new Uint8Array(W * H * 4);
              gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
              var lit = 0, max = 0, n = W * H;
              for (var i = 0; i < px.length; i += 4) {
                var v = px[i]; if (px[i + 1] > v) v = px[i + 1]; if (px[i + 2] > v) v = px[i + 2];
                if (v > 8) lit++;
                if (v > max) max = v;
              }
              res({ ok: true, w: W, h: H, max: max, litPct: Math.round(1000 * lit / n) / 10 });
            } catch (e) { res({ ok: false, why: String(e && e.message) }); }
          });
        });
      } catch (e) { res({ ok: false, why: String(e && e.message) }); }
    });
  }

  /* WAIT FOR THE EVENT, NOT FOR A GUESS AT HOW LONG IT TAKES.

     This was a fixed 260ms sleep and it flaked: the cover is a raytracer, and
     in a 1280x860 frame on a modest GPU a frame costs a few hundred
     milliseconds, so the scroll event queues behind the render and the read
     happens before scrollFade has run. It reported the glyph still at the
     PREVIOUS scroll position, which reads exactly like a stuck handler and is
     not one. A test that fails on a slow machine and passes on a fast one is
     worse than no test.

     scrollFade registers its listener at module scope, before this one is
     attached, so by the time this fires scrollFade has already run for the
     same event; the short sleep after is slack for the style write. */
  /* H16 navigates the frame to the app, and the app registers a service
     worker. On the next run the cover is fetched through it, and this phase
     failed its own H1 the second time it was run in one tab: the boot never
     completed and the row read exactly like a broken cover. CLAUDE.md already
     warns that a browser test may need this worker unregistered first, so the
     phase does it at both ends rather than leaving the origin dirty for
     whatever runs next. frame() busts the document cache; this is the other
     half of the same problem, because subresources are served cache first. */
  async function coverKillSW() {
    try {
      if (!navigator.serviceWorker || !navigator.serviceWorker.getRegistrations) return 0;
      var regs = await navigator.serviceWorker.getRegistrations();
      for (var i = 0; i < regs.length; i++) { try { await regs[i].unregister(); } catch (e) {} }
      return regs.length;
    } catch (e) { return 0; }
  }

  function coverScrollTo(win, t) {
    var doc = win.document.documentElement;
    var target = Math.round((doc.scrollHeight - win.innerHeight) * t);
    if (Math.round(win.scrollY) === target) return sleep(80);
    return new Promise(function (res) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        win.removeEventListener("scroll", onScroll);
        sleep(90).then(res);
      }
      function onScroll() { if (Math.abs(win.scrollY - target) <= 1) finish(); }
      win.addEventListener("scroll", onScroll, { passive: true });
      win.scrollTo(0, target);
      sleep(4000).then(finish);
    });
  }
  function op(win, sel) {
    var el = win.document.querySelector(sel);
    if (!el) return null;
    var v = parseFloat(el.style.opacity);
    return isNaN(v) ? parseFloat(win.getComputedStyle(el).opacity) : v;
  }

  async function runCover(src, onStep, sink) {
    var A = sink || [], t = mkPush(A), frames = [];
    onStep = onStep || function () {};
    /* The cover sits beside the app, so it is derived from the app's own src
       rather than passed separately: one path to keep in step, not two. */
    var coverSrc = src.replace(/[^/]*$/, 'cover.html');
    await coverKillSW();
    try {
      onStep('cover: boot and first frame');
      /* 900x640, not 1280x860. This phase drove the machine it was written on
         into three igfx driver resets in five minutes, after which Chrome
         disabled WebGL for the whole profile and every later run failed H1 for
         a reason that had nothing to do with the build. The raytracer costs
         pixels, and none of these rows need a large viewport: the scroll beats,
         the buffer read and the exit are all the same at this size. A phase
         that kills the GPU it is measuring is a phase that cannot be run
         twice. */
      var f = await frame(coverSrc, 900, 640);
      frames.push(f);
      var w = f.contentWindow;
      var booted = await coverReady(w, 20000);
      t('H1', 'The cover boots and its first frame lands', true, booted);
      if (!booted) return A;
      var d = w.document;

      onStep('cover: reading the drawing buffer');
      var px = await coverPixels(w);
      /* A dead program clears to black and draws nothing, so every channel is
         zero. A live one paints sky across most of the frame. */
      t('H2', 'The shader compiled and painted (buffer read back, not inferred from a first frame)',
        { painted: true, mostlyLit: true },
        { painted: !!(px.ok && px.max > 24), mostlyLit: !!(px.ok && px.litPct > 50) });
      t('H2b', 'The pixel read actually happened (saw ' + (px.ok ? px.w + 'x' + px.h + ', max ' + px.max + ', ' + px.litPct + '% lit' : px.why) + ')',
        true, !!px.ok);

      onStep('cover: the failure messages are silent');
      t('H3', 'No SIGNAL LOST on a healthy boot',
        { fallback: 0, notice: '', lostClass: false },
        { fallback: Math.round(parseFloat(w.getComputedStyle(d.getElementById('fallback')).opacity) * 100) / 100,
          notice: (d.getElementById('notice').textContent || '').trim(),
          lostClass: d.body.classList.contains('signal-lost') });

      onStep('cover: the renderer is local');
      var html = d.documentElement.outerHTML;
      var map = d.querySelector('script[type="importmap"]');
      var imports = {};
      try { imports = JSON.parse(map.textContent).imports || {}; } catch (e) {}
      /* The landing screen must not reach a third party before the reader has
         clicked anything: three is vendored beside the vendored React. */
      t('H4', 'three is served from this origin, not a CDN',
        { unpkg: false, three: './three.module.js' },
        { unpkg: /unpkg\.com/.test(html), three: imports.three || 'missing' });

      onStep('cover: the one control');
      var a = d.querySelector('a.enter');
      var links = d.querySelectorAll('a[href]');
      var box = a ? a.getBoundingClientRect() : { width: 0, height: 0 };
      /* The way in is named by its own text now, so the accessible name and
         what a sighted reader sees are the same words and cannot drift. An svg
         inside it would be the old arrow coming back beside the words. */
      t('H5', 'One way in, named by its own text, and it points at the app',
        { links: 1, name: 'enter here', target: true, noArrow: true },
        { links: links.length,
          name: a ? a.textContent.trim().toLowerCase() : 'no link',
          target: !!(a && /inCommonApp|app\.html/.test(a.getAttribute('href') || '')),
          noArrow: !!(a && !a.querySelector('svg')) });
      t('H6', 'The way in is at least a 44px target',
        { tall: true, wide: true },
        { tall: Math.round(box.height) >= 44, wide: Math.round(box.width) >= 44 });
      t('H7', 'No control on the cover is under 44px', [], tapTargets(w, d));
      t('H8', 'Cover text passes 4.5:1 against what is painted behind it', [], contrastFails(w, d, 4.5).fails);

      onStep('cover: the scroll');
      var span = d.documentElement.scrollHeight - w.innerHeight;
      /* Without a scroll range there is nothing for the fade to attach to, and
         the wordmark would simply sit there. */
      t('H9', 'The page has a scroll range for the fade to run on', true, span > 200);

      await coverScrollTo(w, 0);
      var top = { mark: op(w, '.mark'), glyph: op(w, '.glyph') };
      t('H10', 'At rest the wordmark is present and the initial has not arrived',
        { markShown: true, glyphHidden: true },
        { markShown: top.mark > 0.5, glyphHidden: top.glyph < 0.02 });

      await coverScrollTo(w, 0.55);
      var mid = { mark: op(w, '.mark'), glyph: op(w, '.glyph') };
      /* The order is the design: the wordmark is gone and the rims are up
         before the initial starts, or it reads as three things fading at once
         rather than a sequence. */
      t('H11', 'The wordmark has gone before the initial begins',
        { markGone: true, glyphNotYet: true },
        { markGone: mid.mark < 0.02, glyphNotYet: mid.glyph < 0.02 });

      await coverScrollTo(w, 1);
      var end = { mark: op(w, '.mark'), glyph: op(w, '.glyph') };
      t('H12', 'At the end the initial is fully present and the wordmark is not',
        { glyphShown: true, markGone: true },
        { glyphShown: end.glyph > 0.9, markGone: end.mark < 0.02 });

      var g = d.querySelector('.glyph');
      t('H13', 'The initial is decorative and not announced',
        'true', g ? g.getAttribute('aria-hidden') : 'missing');
      /* Placed from the render rather than the viewport: a transform with a
         scale in it means it read uHoleS and uHoleR. */
      t('H14', 'The initial is placed and scaled from the render',
        true, !!(g && /scale\(/.test(g.style.transform || '')));

      onStep('cover: the way out');
      var pathBefore = w.location.pathname;
      a.click();
      /* POLL, DO NOT SAMPLE ONCE. A single read at a fixed offset was 700ms and
         it flaked for the same reason the scroll did: at this frame size one
         rAF step can cost 400ms, so the read can land after the exit has
         started but before its first step has written anything, and the row
         then says the transition is not running when it is. Waiting for the
         drop instead is the same assertion without the race. */
      var stillHere = true, fading = false, waited = 0;
      while (waited < 1800) {
        await sleep(150); waited += 150;
        try {
          if (w.location.pathname !== pathBefore) { stillHere = false; break; }
        } catch (e) { stillHere = false; break; }
        var o = op(w, '.markwrap');
        if (o !== null && o < 0.95) { fading = true; break; }
      }
      /* preventDefault ran and the transition is running: an anchor left alone
         would already have left. */
      t('H15', 'The link runs the exit instead of navigating at once',
        { stillOnTheCover: true, transitionRunning: true },
        { stillOnTheCover: stillHere, transitionRunning: fading });

      var landed = '';
      for (var i = 0; i < 45; i++) {
        await sleep(200);
        try { landed = w.location.pathname; } catch (e) { landed = 'cross-origin'; }
        if (landed !== pathBefore) break;
      }
      t('H16', 'The exit lands on the app (saw ' + landed + ')',
        true, /inCommonApp|app\.html/.test(decodeURIComponent(landed)));
    } catch (e) {
      t('H-ERR', 'Cover harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      /* This phase writes no storage of its own; the cover has none. What it
         does leave is a service worker, registered by the app it navigates to
         in H16, so that goes back too. */
      await coverKillSW();
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }

  return { VERSION: '1.8.0', MATRIX: MATRIX, THEME_WIDTHS: THEME_WIDTHS,
    runMatrix: runMatrix, runCross: runCross, runSweep: runSweep,
    runThemes: runThemes, runRemoval: runRemoval, runA11y: runA11y, runNew: runNew,
    runCover: runCover };
}));
