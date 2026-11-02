/* 4.2 study pane: host methods used by app/inCommonApp v2.dc.html.
   Drafted by Task Force 6 and integrated by Task Force 4. The host installs
   the methods on Component.prototype; the scene contains no panel markup.

   The renderer stays a renderer: app/hd-scene.js keeps calling its existing
   onFocus(key, how) and onOpen(key) callbacks and gains no DOM, panel or
   state code. Everything below runs in the host, where hdSel and the old
   hdPop sheet already live.

   Entry keys are the scene's own keys: c:<Centre>, ch:<a>-<b>, g:<gate>,
   a:<activation>. The host's hdSelOf(key) turns one into the sel object the
   existing hdPopVals reads, so the pane shows exactly the content the sheet
   shows today; that content stays workstream 3's.

   State: this.state.hdPane is null (closed) or { key, how, low }. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HDPane = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* The same selector the app's trap uses (FOCUSABLE on the app class). */
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  /* Pure. Every visibility change goes through here, so the states can be
     checked without a browser. opts.follow: while open, a first press or an
     arrow step elsewhere on the chart moves the pane to it (recommended; an
     owner decision, see README "Decisions"). */
  function reduce(s, ev, opts) {
    var follow = !opts || opts.follow !== false;
    s = s || null;
    switch (ev && ev.type) {
      case 'select':
        if (!ev.key) return null;                 /* Whole chart: nothing named, pane closes */
        if (s && follow) return s.key === ev.key ? s : { key: ev.key, how: ev.how || 'tap', low: s.low };
        return s;                                  /* closed stays closed: the first press only names */
      case 'open':
        if (!ev.key) return s;
        return { key: ev.key, how: ev.how || 'tap', low: false };
      case 'close':
        return null;
      case 'low':
        if (!s) return s;
        return { key: s.key, how: s.how, low: ev.low == null ? !s.low : !!ev.low };
      case 'view':                                 /* 2D, Wheel, 3D: the pane and its entry carry across */
      case 'shell':                                /* crossing 820px: same state, other presentation */
        return s;
      default:
        return s;
    }
  }

  /* Tab and Shift+Tab stay inside the pane while focus is in it. Returns true
     when it moved focus. Mirrors trapAttach's loop so the two behave alike. */
  function tabWrap(el, e) {
    if (!el || e.key !== 'Tab') return false;
    var f = [].slice.call(el.querySelectorAll(FOCUSABLE)).filter(function (n) {
      return n.offsetWidth || n.offsetHeight || n === document.activeElement;
    });
    if (!f.length) { e.preventDefault(); return true; }
    var first = f[0], last = f[f.length - 1], at = document.activeElement;
    if (e.shiftKey && (at === first || !el.contains(at) || at === el.querySelector('[data-hd-pane-title]'))) { e.preventDefault(); last.focus(); return true; }
    if (!e.shiftKey && (at === last || !el.contains(at))) { e.preventDefault(); first.focus(); return true; }
    return false;
  }

  function paneEl() { return document.querySelector('[data-hd-pane]'); }
  function stageEl() { return document.querySelector('[data-hs-scene]') || document.querySelector('[data-chart="bodygraph"]') || document.querySelector('[data-chart="wiring"]'); }

  var hostMethods = {
    HD_PANE_FOLLOW: true,
    HD_PANE_USE_SETTLE: true,

    hdPaneSet(ev) {
      var next = reduce(this.state.hdPane, ev, { follow: this.HD_PANE_FOLLOW });
      if (next !== this.state.hdPane) this.setState({ hdPane: next });
      return next;
    },

    /* The selection-change hook. Call it from the scene's onFocus, beside
       the existing setState({ hsFocus }), and from Whole chart with null. */
    hdPaneSelect(key, how) {
      var next = this.hdPaneSet({ type: 'select', key: key || null, how: how });
      if (this._hsS) this._hsS.setReadingOpen(!!next, next && next.key);
      return next;
    },

    /* open(entry). Call it from the scene's onOpen and from the 2D wiring's
       presses. how is 'key' when Enter or Space opened it (focus then moves
       into the pane), anything else leaves focus where the reader put it. */
    hdPaneOpen(key, how) {
      if (!key) return this.state.hdPane;
      var a = document.activeElement;
      if (!this.state.hdPane) this._hdPaneReturn = a && a !== document.body ? a : stageEl();
      this._hdPaneWantFocus = how === 'key';
      this._hdPaneReveal = true;
      if (this._hsS) this._hsS.setReadingOpen(true, key);
      return this.hdPaneSet({ type: 'open', key: key, how: how });
    },

    /* close(). reason 'escape' or 'button' hands focus back to whatever
       opened the pane (the stage, normally); 'clear' and 'route' do not move
       focus, because the reader is already somewhere else. */
    hdPaneClose(reason) {
      var back = this._hdPaneReturn;
      this._hdPaneReturn = null; this._hdPaneWantFocus = false;
      this.hdPaneSet({ type: 'close', reason: reason });
      if (this._hsS) {
        this._hsS.setReadingOpen(false);
        this._hsS.trimUnusedResources();
      }
      if ((reason === 'escape' || reason === 'button') ) {
        var t = back && document.contains(back) ? back : stageEl();
        if (t && t.focus) { try { t.focus({ preventScroll: true }); } catch (x) { t.focus(); } }
      }
    },

    /* Phone only: the sheet's head row alone, or the head and body. */
    hdPaneLow(low) { return this.hdPaneSet({ type: 'low', low: low }); },

    /* onKeyDown on the pane element. */
    hdPaneKeys(e) {
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();   /* or vtBind's Escape leaves the Spirit page */
        this.hdPaneClose('escape');
        return;
      }
      tabWrap(e.currentTarget || paneEl(), e);
    },

    /* onKeyDown on the stage's wrapper (not inside hd-scene.js). The scene
       ignores Escape, so it bubbles here. Only acts while the pane is open. */
    hdStageKeys(e) {
      if (e.key !== 'Escape' || !this.state.hdPane) return;
      e.preventDefault(); e.stopPropagation();
      this.hdPaneClose('escape');
    },

    /* Runs once the pane has actually landed in the document. sc-if commits
       a tick after componentDidUpdate (see trapWatch in the app), so call
       this from syncTrap() as well as componentDidUpdate. */
    hdPaneSync() {
      var el = paneEl();
      var vertical = !!(el && el.closest && el.closest('[data-vt]'));
      if (!el) return;
      if (this._hdPaneWantFocus) {
        this._hdPaneWantFocus = false;
        var h = el.querySelector('[data-hd-pane-title]') || el;
        try { h.focus({ preventScroll: true }); } catch (x) { h.focus(); }
      }
      if (this._hdPaneReveal && vertical) {
        this._hdPaneReveal = false;
        this.hdPaneRevealStage();
      } else this._hdPaneReveal = false;
    },

    /* Phone: bring the stage up under the header so it sits in the open top
       of the screen. DRAFT: in the app this must go through vtSettle on the
       element that scrolls the Spirit page, because a programmatic scroll
       fights mandatory snap (see vtSettle). The preview uses scrollTo. */
    hdPaneRevealStage() {
      var st = stageEl(); if (!st) return;
      var sc = st.parentElement;
      while (sc && sc !== document.body) {
        var oy = getComputedStyle(sc).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && sc.scrollHeight > sc.clientHeight) break;
        sc = sc.parentElement;
      }
      if (!sc || sc === document.body) return;
      var head = document.querySelector('[data-app-header="vertical"]');
      var off = head ? head.getBoundingClientRect().height : 0;
      var top = sc.scrollTop + st.getBoundingClientRect().top - sc.getBoundingClientRect().top - off - 8;
      var target = Math.max(0, top);
      /* vtSettle watches an already-started scroll. Without scrollTo first
         it cannot bring the stage into the mobile sheet's top reserve. Only
         use the snap restorer for a scroller that already snaps. */
      var snapping = /mandatory/.test(getComputedStyle(sc).scrollSnapType || '');
      if (snapping && typeof this.vtSettle === 'function' && this.HD_PANE_USE_SETTLE) {
        sc.style.scrollSnapType = 'none';
        sc.scrollTo({ top: target, behavior: 'auto' });
        this.vtSettle(sc, 'y', target, 'P');
      } else sc.scrollTo({ top: target, behavior: 'auto' });
    },

    /* Template values. selVals is the existing hdPopVals, made to take a sel
       instead of reading state.hdSel (a one-line change for the primary).
       Its hdPop* names come back as hdPane*, so the pane's markup is the
       sheet's markup with the prefix changed. */
    hdPaneVals(selVals) {
      var p = this.state.hdPane, out = { hdPaneOn: !!p, hdPaneState: p ? (p.low ? 'low' : 'open') : 'closed',
        hdPaneOpenAttr: p && !p.low ? '1' : '0', hdPaneLowLabel: p && p.low ? 'Show the reading' : 'Show the chart',
        hdPaneLowExpanded: p && !p.low ? 'true' : 'false',
        hdPaneKeys: this._hdPaneKeysB || (this._hdPaneKeysB = this.hdPaneKeys.bind(this)),
        hdStageKeys: this._hdStageKeysB || (this._hdStageKeysB = this.hdStageKeys.bind(this)),
        hdPaneCloseGo: this._hdPaneCloseB || (this._hdPaneCloseB = this.hdPaneClose.bind(this, 'button')),
        hdPaneLowGo: this._hdPaneLowB || (this._hdPaneLowB = this.hdPaneLow.bind(this, null)) };
      if (!p) return out;
      var sel = this.hdSelOf(p.key), v = sel && selVals ? selVals.call(this, sel) : null;
      if (!v) { out.hdPaneOn = false; out.hdPaneState = 'closed'; out.hdPaneOpenAttr = '0'; return out; }
      Object.keys(v).forEach(function (k) { if (k.indexOf('hdPop') === 0) out['hdPane' + k.slice(5)] = v[k]; });
      out.hdPaneClose = out.hdPaneCloseGo;
      out.hdPaneAtlas = () => { this.hdPaneClose('route'); if (v.hdPopAtlas) v.hdPopAtlas(); };
      out.hdPaneEdgeVar = '--hd-pane-edge:' + (v.hdPopEdge || 'var(--bd)');
      return out;
    }
  };

  return { reduce: reduce, tabWrap: tabWrap, hostMethods: hostMethods, FOCUSABLE: FOCUSABLE };
}));
