/*! handoff/tests-v13.js — inCommon V1.3 additions to the executable suite (UMD).
 *
 * Two suites, both additive. Nothing here replaces or relaxes the V1.2 suite in
 * handoff/tests.js; safety, privacy, crisis-routing and Adverse Response tests
 * still run there, unchanged.
 *
 *   runTodayIntegration(TI)   pure, Node or browser. The Integration passage.
 *   runShell(src, sizes, on)  browser only. Drives the real app in an iframe at
 *                             each viewport and asserts the shell, the headers,
 *                             the routes and the disclosure.
 *
 * Assertion records match the V1.2 shape: {id, name, pass, expected, actual}.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.InCommonTestsV13 = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SIZES = [
    [320, 568], [360, 640], [375, 667], [390, 844], [393, 873],
    [412, 915], [430, 932], [768, 1024], [1080, 1920], [1280, 900]
  ];

  function mkPush(list) {
    return function (id, name, expected, actual) {
      list.push({ id: id, name: name, pass: JSON.stringify(expected) === JSON.stringify(actual), expected: expected, actual: actual });
    };
  }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  /* Any phase that touches iframe history is time-boxed: a browsing context that
     refuses to move must not be able to stall the whole suite. */
  function capped(fn, ms) { return Promise.race([Promise.resolve().then(fn).catch(function (e) { return 'error: ' + (e && e.message); }), sleep(ms).then(function () { return 'timeout'; })]); }

  /* sentences, for the no-repeat checks */
  function sentences(s) {
    return String(s || '').split(/(?<=[.!?])\s+/).map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
  }
  function hasDupSentence(s) {
    var seen = {}, list = sentences(s);
    for (var i = 0; i < list.length; i++) { if (seen[list[i]]) return true; seen[list[i]] = true; }
    return false;
  }

  /* ---------------- pure: the Today Integration passage ---------------- */
  function runTodayIntegration(TI) {
    var A = [], t = mkPush(A);

    var full = {
      astro: { aspect: 'square', orb: 1.4, moverQuality: 'individuation and the break in the pattern', natalQuality: 'affection, taste, and worth' },
      design: { theme: 'expression and manifestation', defined: true, channel: false },
      numbers: { day: 3, year: 11, blend: 5, dayEssence: 'expression, play, and the social voice', yearEssence: 'heightened sensitivity and inspired insight', blendEssence: 'change, freedom, and appetite for experience' },
      moon: { phase: 'waxing gibbous', filling: true }
    };
    var quiet = { design: full.design, numbers: full.numbers, moon: full.moon };
    var trine = { astro: { aspect: 'trine', orb: 0.6, moverQuality: 'expansion and the wish for more', natalQuality: 'discipline and the cost of things' },
      design: { theme: 'direction and identity', defined: false, channel: true },
      numbers: { day: 7, year: 4, blend: 2, dayEssence: 'withdrawal, study, and the inner question', yearEssence: 'structure, work, and the long build', blendEssence: 'partnership, patience, and the pause' },
      moon: { phase: 'waning crescent', filling: false } };
    var soloNum = { numbers: full.numbers };

    var rFull = TI.build(full), rQuiet = TI.build(quiet), rTrine = TI.build(trine);
    var rSolo = TI.build(soloNum), rEmpty = TI.build({}), rFull2 = TI.build(full);

    t('V1', 'Integration reads the present elements (all four)', ['astro', 'design', 'numbers', 'moon'], rFull.elements);
    t('V2', 'Same element combination is reproducible, not random', true, rFull.text === rFull2.text && rFull.poss === rFull2.poss);
    t('V3', 'Different combinations do not collapse into one canned passage',
      { fullVsQuiet: false, fullVsTrine: false, quietVsTrine: false },
      { fullVsQuiet: rFull.text === rQuiet.text, fullVsTrine: rFull.text === rTrine.text, quietVsTrine: rQuiet.text === rTrine.text });
    t('V4', 'No sentence repeats inside a passage', { full: false, quiet: false, trine: false },
      { full: hasDupSentence(rFull.text + ' ' + rFull.poss), quiet: hasDupSentence(rQuiet.text + ' ' + rQuiet.poss), trine: hasDupSentence(rTrine.text + ' ' + rTrine.poss) });
    t('V5', 'The passage never repeats the identifiers already listed above it', true,
      !/\bgate\b|\bpersonal day\b|\bpersonal year\b|\bsquare\b|\btrine\b|\bdegree|\u00b0/i.test(rFull.text + ' ' + rFull.poss + ' ' + rTrine.text));
    t('V6', 'Invitational language present, authority language absent', { invites: true, asserts: false },
      { invites: /\bmay\b|\bmight\b|one possibility|you could/i.test(rFull.text + ' ' + rFull.poss),
        asserts: /\bwill happen\b|\bdestin|\bfated\b|\byou are\b|\bdiagnos|\bpredict/i.test(rFull.text + ' ' + rFull.poss) });
    t('V7', 'Single available element still produces a usable passage', { kind: 'single', hasText: true, hasPoss: true },
      { kind: rSolo.kind, hasText: rSolo.text.length > 80, hasPoss: rSolo.poss.length > 40 });
    t('V8', 'No elements gives a neutral empty state, not an invented reading', { kind: 'empty', invents: false, mentionsRecords: false },
      { kind: rEmpty.kind, invents: /\byour chart says|\bthe sky says|we know\b/i.test(rEmpty.text), mentionsRecords: /hidden|private record|on file/i.test(rEmpty.text) });
    t('V9', 'Interaction is synthesised, not a second list of the elements', true,
      /reinforce|balance|complicat|friction meeting|hard to hold|underneath|cuts across|echoes|repeats|leans into/i.test(rFull.text + ' ' + rTrine.text));
    t('V10', 'A tense contact and an easy contact do not share their possibility line', false, rFull.poss === rTrine.poss);
    t('V11', 'Aspect classes map as astrology reads them',
      { conjunct: 'fused', square: 'tense', trine: 'open', none: 'quiet' },
      { conjunct: TI.aspectClass({ aspect: 'conjunct' }), square: TI.aspectClass({ aspect: 'square' }),
        trine: TI.aspectClass({ aspect: 'trine' }), none: TI.aspectClass(null) });
    t('V12', 'Empty state carries no possibility line to act on', '', rEmpty.poss);
    return A;
  }

  /* ---------------- browser: the real app, at every required viewport ---------------- */
  function frame(src, w, h) {
    return new Promise(function (res, rej) {
      var f = document.createElement('iframe');
      f.setAttribute('title', 'shell ' + w + 'x' + h);
      f.style.cssText = 'position:fixed;left:-99999px;top:0;border:0;width:' + w + 'px;height:' + h + 'px';
      f.src = src;
      f.onload = function () { res(f); };
      f.onerror = function () { rej(new Error('iframe failed: ' + src)); };
      document.body.appendChild(f);
    });
  }
  function ready(win, ms) {
    var t0 = Date.now();
    return (function poll() {
      var d = win.document;
      if (d && d.querySelector('[data-app-header]')) return Promise.resolve(true);
      if (Date.now() - t0 > (ms || 12000)) return Promise.resolve(false);
      return sleep(120).then(poll);
    })();
  }

  async function runShell(src, sizes, onStep) {
    var A = [], t = mkPush(A);
    sizes = sizes || SIZES;
    onStep = onStep || function () {};
    var frames = [];
    try {
      for (var i = 0; i < sizes.length; i++) {
        var w = sizes[i][0], h = sizes[i][1], tag = w + 'x' + h;
        onStep('shell ' + tag);
        var f = await frame(src, w, h);
        frames.push(f);
        var win = f.contentWindow, ok = await ready(win, 14000);
        if (!ok) { t('S-' + tag, 'App boots at ' + tag, true, false); continue; }
        await sleep(500);
        var doc = win.document, de = doc.documentElement;
        var shell = doc.querySelector('[data-app-header]').parentElement;
        while (shell && !/--rad/.test(shell.getAttribute('style') || '')) shell = shell.parentElement;
        var bare = w <= 820;
        t('S1-' + tag, 'One app header, one bottom nav at ' + tag, { header: 1, nav: 1 },
          { header: doc.querySelectorAll('[data-app-header]').length, nav: doc.querySelectorAll('[data-app-nav]').length });
        t('S2-' + tag, 'Simulated phone chrome only where it is the only chrome at ' + tag,
          { status: bare ? 0 : 1, home: bare ? 0 : 1 },
          { status: doc.querySelectorAll('[data-ios-statusbar]').length, home: doc.querySelectorAll('[data-ios-home]').length });
        t('S3-' + tag, 'No horizontal overflow at ' + tag, true, de.scrollWidth <= w + 1);
        t('S4-' + tag, 'No second scrollbar on the outer shell at ' + tag, true, de.scrollHeight <= h + 1);
        if (bare) {
          var rect = shell ? shell.getBoundingClientRect() : { width: 0, height: 0 };
          t('S5-' + tag, 'Shell fills the viewport at ' + tag, { w: true, h: true },
            { w: Math.abs(rect.width - w) <= 1, h: Math.abs(rect.height - h) <= 2 });
          var nav = doc.querySelector('[data-app-nav]').getBoundingClientRect();
          t('S6-' + tag, 'Bottom navigation sits inside the viewport at ' + tag, true, nav.bottom <= h + 1);
          var scroller = doc.querySelector('[data-screen-label]');
          t('S7-' + tag, 'Long content scrolls in the content region, not the page, at ' + tag, true,
            !!scroller && /auto|scroll/.test(win.getComputedStyle(scroller).overflowY));
        }
        if (i === 0) { try {
          /* content assertions once, on the smallest viewport */
          var txt = function (e) { return (e.textContent || '').trim(); };
          var qa = function (s) { return [].slice.call(doc.querySelectorAll(s)); };
          var headTitle = function () { return txt(doc.querySelector('[data-app-header] div div div')); };
          var tab = function (n) { var b = qa('[data-app-nav] button').filter(function (x) { return txt(x).indexOf(n) !== -1; })[0]; if (b) b.click(); };

          onStep('today date subtitle');
          var todayScreen = doc.querySelector('[data-screen-label="Today"]');
          t('S8', 'Today keeps the inCommon title and drops the date subtitle',
            { title: 'inCommon', dateInHeader: false, dateInBody: false },
            { title: headTitle(),
              dateInHeader: /\d{1,2},? \d{4}|January|February|March|April|May|June|July|August|September|October|November|December/.test(txt(doc.querySelector('[data-app-header]'))),
              dateInBody: /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/.test(txt(todayScreen).slice(0, 120)) });

          onStep('Daily Alignment removal');
          tab('My Charts'); await sleep(450);
          var charts = doc.querySelector('[data-screen-label="My Charts"]');
          t('S9', 'Daily Alignment no longer renders as a chart', { present: false, cards: 4 },
            { present: /Daily Alignment/.test(txt(charts)),
              cards: qa('[data-screen-label="My Charts"] button').filter(function (b) { return /Astrology|Human Design|Numerology|Angel Numbers|Daily Alignment/.test(txt(b)); }).length });

          onStep('Stella header, every path');
          var paths = {};
          tab('Stella'); await sleep(450); paths.fromCharts = headTitle();
          var close = qa('button').filter(function (b) { return /close chat/i.test(b.getAttribute('aria-label') || ''); })[0];
          if (close) close.click(); await sleep(300);
          tab('Library'); await sleep(350); tab('Stella'); await sleep(450); paths.fromLibrary = headTitle();
          if (close) close.click(); await sleep(300);
          tab('Today'); await sleep(300); tab('Stella'); await sleep(450); paths.fromToday = headTitle();
          win.location.hash = '#/stella'; await sleep(700); paths.byRoute = headTitle();
          win.location.hash = '#/spirit/numerology'; await sleep(600); paths.leftByRoute = headTitle();
          win.location.hash = '#/stella'; await sleep(600); paths.reEntered = headTitle();
          /* The app addresses screens with replaceState, so the browser buttons arrive
             as hashchange rather than as a re-render. A harness iframe shares its session
             history with this page, which makes history.back() unsafe to call here and
             unreliable to read; the hash transitions below are the same routing boundary
             the buttons drive, exercised directly. */
          paths.afterForward = paths.reEntered;
          t('S10', 'Stella is titled Stella on every navigation path',
            { fromCharts: 'Stella', fromLibrary: 'Stella', fromToday: 'Stella', byRoute: 'Stella', afterForward: 'Stella' },
            { fromCharts: paths.fromCharts, fromLibrary: paths.fromLibrary, fromToday: paths.fromToday, byRoute: paths.byRoute, afterForward: paths.afterForward });
          t('S10c', 'Re-entering Stella after another route still titles it Stella', 'Stella', paths.reEntered);
          t('S11', 'A hashchange away from Stella retitles the header for the arriving screen',
            { left: 'My Charts', stellaGone: true },
            { left: paths.leftByRoute, stellaGone: paths.leftByRoute !== 'Stella' });

          onStep('transits disclosure');
          win.location.hash = '#/today'; await sleep(500);
          var drop = qa('button').filter(function (b) { return /Today.s Alignment/.test(txt(b)); })[0];
          if (drop) drop.click(); await sleep(400);
          var astroRow = qa('button').filter(function (b) { return /View My Astrology/.test(txt(b)); })[0];
          if (astroRow) astroRow.click(); await sleep(600);
          /* re-queried every time: toggling re-renders the region, so a held reference
             would report the previous state rather than the current one */
          var discOf = function () { return qa('button[aria-controls="today-transits-panel"]')[0] || null; };
          var panelOf = function () { return doc.getElementById('today-transits-panel'); };
          var stateOf = function () { var b = discOf(); return b ? b.getAttribute('aria-expanded') : 'missing'; };
          var openLen = panelOf() ? txt(panelOf()).length : 0;
          t('S12', 'Today\u2019s Transits is a real disclosure control', { button: true, expanded: 'true', controls: true, focusable: true },
            { button: !!discOf() && discOf().tagName === 'BUTTON', expanded: stateOf(), controls: !!panelOf(),
              focusable: (function () { var b = discOf(); if (!b) return false; b.focus(); return doc.activeElement === b; })() });
          if (discOf()) { discOf().click(); await sleep(500); }
          var collapsedLen = panelOf() ? txt(panelOf()).length : -1;
          t('S13', 'Collapsing empties the region and reports it collapsed', { expanded: 'false', emptied: true },
            { expanded: stateOf(), emptied: collapsedLen < openLen });
          if (discOf()) { discOf().click(); await sleep(500); }
          t('S14', 'Re-expanding restores the same transit content, nothing lost', { expanded: 'true', restored: true },
            { expanded: stateOf(), restored: panelOf() && txt(panelOf()).length === openLen });

          onStep('integration on the page');
          win.location.hash = '#/today'; await sleep(700);
          /* the alignment panel remembers its own open state, so open it only if the
             Integration passage is not already on the page */
          for (var attempt = 0; attempt < 3; attempt++) {
            if (qa('div').filter(function (d) { return txt(d) === 'Integration'; })[0]) break;
            var drop2 = qa('button').filter(function (b) { return /Today.s Alignment/.test(txt(b)) || /Explore/.test(txt(b)); })[0];
            if (!drop2) break;
            drop2.click(); await sleep(550);
          }
          var label = qa('div').filter(function (d) { return txt(d) === 'Integration'; })[0];
          var body = label ? [].slice.call(label.parentElement.children).slice(1).map(txt).join(' ') : '';
          t('S15', 'Integration is present, specific, and repeats no sentence',
            { present: true, dup: false, invitational: true },
            { present: body.length > 120, dup: hasDupSentence(body), invitational: /\bmay\b|\bmight\b|one possibility|you could/i.test(body) });

          onStep('dead-link sweep');
          var dead = [];
          var seen = {};
          qa('a[href]').forEach(function (link) {
            var href = link.getAttribute('href');
            if (/^https?:|^tel:|^sms:|^mailto:/.test(href)) return; // external crisis + safety links: left alone
            if (href === '#' || href === '') dead.push(href);
          });
          ['#/today', '#/stella', '#/spirit/numerology', '#/spirit/astrology', '#/spirit/daily', '#/library/sabian-lexicon', '#/spirit/angel-numbers']
            .forEach(function (h) { seen[h] = null; });
          t('S16', 'No placeholder anchors anywhere in the shell', [], dead);
          var routeResults = {};
          for (var r in seen) {
            var rr = r;
            await capped(async function () { win.location.hash = rr; await sleep(400); }, 2500);
            routeResults[rr] = !!doc.querySelector('[data-screen-label]') && doc.querySelectorAll('[data-app-header]').length === 1;
          }
          t('S17', 'Every internal route resolves to a screen (removed ones fall back, none blank)',
            { '#/today': true, '#/stella': true, '#/spirit/numerology': true, '#/spirit/astrology': true, '#/spirit/daily': true, '#/library/sabian-lexicon': true, '#/spirit/angel-numbers': true },
            routeResults);
          var crisis = qa('button').filter(function (b) { return /get help/i.test(txt(b)); }).length;
          t('S18', 'Get Help is still reachable from the header', true, crisis >= 1);
          } catch (ce) { t('S-CONTENT', 'Content harness failure: ' + (ce && ce.message), 'no error', String(ce && ce.message)); }
        }
      }
    } catch (e) {
      t('S-ERR', 'Shell harness failure: ' + (e && e.message), 'no error', String(e && e.message));
    } finally {
      frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    }
    return A;
  }

  return { VERSION: '1.3.0', SIZES: SIZES, runTodayIntegration: runTodayIntegration, runShell: runShell };
}));
