/* flight.js: FREE MOTION, IN EVERY DIRECTION.

   The owner, 19 October 2026: "Free motion in every direction: up, down, left,
   right, diagonal, ascend, descend, strafe left, strafe right, dash up, and
   dash back, dash left, and dash right. Omni directional motion: on every
   chart, but especially in the full screen observatory." So every 3D chart in
   the app flies the same way, and this file is that one way.

   WHAT IT IS. A camera with a position, a heading (yaw) and a pitch, and the
   inputs that move it. No roll: a reader who has turned upside down in a
   chart has lost the chart. It knows nothing about three.js beyond setting a
   camera's position and rotation, and nothing about any chart: a scene hands
   it `near()`, the distance to the closest thing worth slowing down for, and a
   bound, and it hands the scene back a pose.

   THE CONTROLS, written once here and named in the Observatory's own panel:
     W S        forward, back          A D       strafe left, strafe right
     E Space    ascend                 Q C       descend
     arrows     look up, down, left, right       Shift (held) boost
     double tap any move key: a dash that way    X: a dash where you are going
   Diagonal is two keys at once and is normalised, so it is no faster than a
   straight line. Keys are read by `code`, not `key`, so the same hand
   position works on every keyboard layout. Ascend and descend are the world's
   up and down, the way an editor viewport flies, rather than the camera's.

   SPEED FOLLOWS PROXIMITY. Cruising speed is the distance to the nearest
   surface, so the open field crosses quickly and a body slows the reader as
   they close on it, which is what lets an approach feel like one. A dash is a
   separate impulse that decays on its own, so it can outrun the cruise for a
   moment and then hand back.

   AUTOPILOT. travel() carries the camera along a curve to a pose that looks at
   a point, easing in and out, and any manual input takes the controls back.
   Under reduced motion it cuts rather than travels, and a dash is a short step
   with no lens kick.

   TOUCH AND GAMEPAD. mountPad() builds a stick (move, any direction, flick it
   to dash), ascend and descend buttons held for thrust, and a Dash button;
   looking is a drag anywhere else, which the scene routes to look(). The
   buttons are real buttons with names, operable from a keyboard or a switch
   by a press, because the stick itself is pointer only and the keys above are
   its keyboard equal. A standard gamepad flies too: left stick moves, right
   stick looks, the triggers ascend and descend, A dashes, the bumpers step the
   target and Y engages it. */
(function (root) {
  'use strict';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function wrapPi(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
  function len3(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]); }
  function now() { return (root.performance && root.performance.now) ? root.performance.now() : Date.now(); }

  /* local axes: x strafe (right +), y lift (up +), z forward (+) */
  var MOVE = { KeyW: [0, 0, 1], KeyS: [0, 0, -1], KeyA: [-1, 0, 0], KeyD: [1, 0, 0], KeyE: [0, 1, 0], Space: [0, 1, 0], KeyQ: [0, -1, 0], KeyC: [0, -1, 0] };
  var LOOK = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  var DOUBLE_MS = 280, DASH_COOL = 0.32, PITCH_MAX = 1.45;

  function Flight(o) {
    this.o = o || {};
    this.reduced = !!this.o.reduced;
    this.pos = [0, 0, 0]; this.vel = [0, 0, 0]; this.dv = [0, 0, 0];
    this.yaw = 0; this.pitch = 0;
    this.active = false;
    this.keys = {}; this.taps = {};
    this.stick = [0, 0]; this.lift = 0; this.liftT = 0; this.lookAx = [0, 0];
    this.boost = false; this.cool = 0; this.kick = 0; this.dashK = 0;
    this.auto = null; this.maxV = 1; this.speedNow = 0;
    this.pad = null; this.padBtn = {};
  }
  var P = Flight.prototype;

  /* Take the controls from wherever the camera is now. */
  P.engage = function (pos, dir) {
    this.pos = [pos[0], pos[1], pos[2]];
    var d = dir || [0, 0, -1], l = len3(d) || 1;
    this.yaw = Math.atan2(-d[0] / l, -d[2] / l);
    this.pitch = clamp(Math.asin(clamp(d[1] / l, -1, 1)), -PITCH_MAX, PITCH_MAX);
    this.vel = [0, 0, 0]; this.dv = [0, 0, 0];
    this.active = true;
  };
  P.release = function () {
    this.active = false; this.auto = null;
    this.vel = [0, 0, 0]; this.dv = [0, 0, 0]; this.kick = 0;
    this.blur();
  };
  /* Keys held when focus leaves are let go, so nothing flies on by itself. */
  P.blur = function () { this.keys = {}; this.boost = false; this.stick = [0, 0]; this.lift = 0; this.lookAx = [0, 0]; this.setStickKnob(0, 0); };

  P.forward = function () { var cp = Math.cos(this.pitch); return [-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp]; };
  P.right = function () { return [Math.cos(this.yaw), 0, -Math.sin(this.yaw)]; };
  P.toWorld = function (m) {
    var f = this.forward(), r = this.right();
    return [r[0] * m[0] + f[0] * m[2], m[1] + f[1] * m[2], r[2] * m[0] + f[2] * m[2]];
  };

  /* A key, down or up. Returns true when it is one of flight's, so the scene
     can take the controls and keep the key from doing anything else. */
  P.key = function (e, down) {
    var c = e.code;
    if (c === 'ShiftLeft' || c === 'ShiftRight') { this.boost = !!down; return false; }
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (MOVE[c]) {
      if (down && !e.repeat) {
        var t = now(), last = this.taps[c];
        this.taps[c] = t;
        if (last && t - last < DOUBLE_MS) { this.taps[c] = 0; this.dash(MOVE[c]); }
        this.auto = null;
      }
      if (down) this.keys[c] = true; else delete this.keys[c];
      return true;
    }
    if (LOOK[c]) { if (down) { this.keys[c] = true; this.auto = null; } else delete this.keys[c]; return true; }
    if (c === 'KeyX') { if (down && !e.repeat) this.dash(null); return true; }
    return false;
  };
  P.held = function () { for (var k in this.keys) if (this.keys[k]) return true; return false; };

  P.look = function (dyaw, dpitch) {
    this.yaw = wrapPi(this.yaw + dyaw);
    this.pitch = clamp(this.pitch + dpitch, -PITCH_MAX, PITCH_MAX);
    this.auto = null;
  };
  /* analog: x strafe, z forward, each -1..1 */
  P.setStick = function (x, z) { this.stick = [clamp(x, -1, 1), clamp(z, -1, 1)]; if (x || z) this.auto = null; };
  P.setLift = function (y) { this.lift = clamp(y, -1, 1); if (y) this.auto = null; };
  /* A press of Ascend or Descend from a keyboard or a switch has no hold, so
     it lifts for a moment instead. */
  P.pulseLift = function (y) { this.lift = y; this.liftT = 0.45; this.auto = null; };
  /* A push along a local direction, for a gesture or the mouse wheel. */
  P.nudge = function (m, k) {
    var w = this.toWorld(m), s = (k || 1) * Math.max(0.5, this.maxV);
    this.dv[0] += w[0] * s; this.dv[1] += w[1] * s; this.dv[2] += w[2] * s;
    this.auto = null;
  };

  /* The direction the reader is moving in, local, or forward when still. */
  P.intent = function () {
    var m = [0, 0, 0];
    for (var k in this.keys) if (this.keys[k] && MOVE[k]) { m[0] += MOVE[k][0]; m[1] += MOVE[k][1]; m[2] += MOVE[k][2]; }
    m[0] += this.stick[0]; m[2] += this.stick[1]; m[1] += this.lift;
    return m;
  };
  P.dash = function (local) {
    if (!this.active || this.cool > 0) return false;
    var m = local ? local.slice() : this.intent();
    if (len3(m) < 0.2) m = [0, 0, 1];
    var l = len3(m); m = [m[0] / l, m[1] / l, m[2] / l];
    var w = this.toWorld(m), s = this.reduced ? Math.max(1.2, this.maxV * 1.2) : Math.max(3.2, this.maxV * 3.4);
    this.dv[0] += w[0] * s; this.dv[1] += w[1] * s; this.dv[2] += w[2] * s;
    this.cool = DASH_COOL; this.auto = null;
    if (!this.reduced) { this.dashK = 1; }
    if (this.o.onDash) this.o.onDash(m);
    return true;
  };

  /* Autopilot to a pose at `to`, looking at `at`. */
  P.travel = function (to, at, opts) {
    opts = opts || {};
    var p0 = this.pos.slice(), d = [to[0] - p0[0], to[1] - p0[1], to[2] - p0[2]], dist = len3(d);
    var look = [at[0] - to[0], at[1] - to[1], at[2] - to[2]], ll = len3(look) || 1;
    var yaw1 = Math.atan2(-look[0] / ll, -look[2] / ll), pitch1 = clamp(Math.asin(clamp(look[1] / ll, -1, 1)), -PITCH_MAX, PITCH_MAX);
    if (this.reduced || dist < 1e-4) {
      this.pos = to.slice(); this.yaw = yaw1; this.pitch = pitch1; this.vel = [0, 0, 0]; this.dv = [0, 0, 0];
      this.auto = null;
      if (opts.done) opts.done();
      return;
    }
    var f = this.forward(), k = Math.min(dist * 0.45, 6);
    this.auto = {
      t: 0, dur: opts.dur || clamp(1.0 + Math.sqrt(dist) * 0.38, 1.0, 2.8),
      p0: p0, p1: to.slice(), c0: [p0[0] + f[0] * k, p0[1] + f[1] * k + dist * 0.06, p0[2] + f[2] * k],
      c1: [to[0] - look[0] / ll * k * 0.6, to[1] - look[1] / ll * k * 0.6 + dist * 0.05, to[2] - look[2] / ll * k * 0.6],
      yaw0: this.yaw, yaw1: this.yaw + wrapPi(yaw1 - this.yaw), pitch0: this.pitch, pitch1: pitch1, done: opts.done
    };
    this.vel = [0, 0, 0]; this.dv = [0, 0, 0];
  };
  P.traveling = function () { return !!this.auto; };

  P.busy = function () {
    return this.active && (this.held() || !!this.auto || this.stick[0] !== 0 || this.stick[1] !== 0 || this.lift !== 0 ||
      this.lookAx[0] !== 0 || this.lookAx[1] !== 0 || len3(this.vel) > 1e-3 || len3(this.dv) > 1e-3 || this.kick > 0.01 || this.padPoll);
  };

  /* One step. env.near(pos) returns { d: distance to the nearest surface,
     c: its centre, r: its radius } or null; env.bound is how far out the
     reader may go before being turned gently home. Returns whether it moved. */
  P.update = function (dt, env) {
    if (!this.active) return false;
    env = env || {};
    /* the autopilot keeps to the clock, so a slow machine arrives on time in
       fewer frames; the hand controls step at most a twentieth of a second */
    var dtA = Math.min(dt, 0.25);
    dt = Math.min(dt, 0.05);
    this.cool = Math.max(0, this.cool - dt);
    this.pollPad(dt);
    if (this.liftT > 0) { this.liftT -= dt; if (this.liftT <= 0) { this.liftT = 0; this.lift = 0; } }
    var near = env.near ? env.near(this.pos) : null;
    var nd = near ? Math.max(0, near.d) : 4;
    this.maxV = clamp(nd * 1.35, env.minV || 0.22, env.maxV || 9) * (this.boost ? 3 : 1);

    if (this.auto) {
      var a = this.auto;
      a.t = Math.min(1, a.t + dtA / a.dur);
      var t = a.t, e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, u = 1 - e;
      var prev = this.pos.slice();
      for (var i = 0; i < 3; i++) this.pos[i] = u * u * u * a.p0[i] + 3 * u * u * e * a.c0[i] + 3 * u * e * e * a.c1[i] + e * e * e * a.p1[i];
      var ke = Math.min(1, t / 0.7), ko = ke * ke * (3 - 2 * ke);
      this.yaw = a.yaw0 + (a.yaw1 - a.yaw0) * ko;
      this.pitch = a.pitch0 + (a.pitch1 - a.pitch0) * ko;
      this.speedNow = len3([this.pos[0] - prev[0], this.pos[1] - prev[1], this.pos[2] - prev[2]]) / Math.max(dtA, 1e-3);
      this.kick = Math.sin(Math.PI * t) * 0.85;
      if (a.t >= 1) { var done = a.done; this.auto = null; this.kick = 0; if (done) done(); }
      return true;
    }

    /* look: arrows and the right stick */
    var ly = 0, lp = 0;
    for (var k in this.keys) if (this.keys[k] && LOOK[k]) { ly += LOOK[k][0]; lp += LOOK[k][1]; }
    ly += this.lookAx[0]; lp += this.lookAx[1];
    if (ly || lp) { this.yaw = wrapPi(this.yaw + ly * 1.7 * dt); this.pitch = clamp(this.pitch + lp * 1.15 * dt, -PITCH_MAX, PITCH_MAX); }

    var m = this.intent(), ml = len3(m);
    if (ml > 1) { m[0] /= ml; m[1] /= ml; m[2] /= ml; ml = 1; }
    var w = this.toWorld(m), V = this.maxV;
    var resp = 1 - Math.exp(-dt * (ml > 0.01 ? 6 : 3.2));
    for (var j = 0; j < 3; j++) this.vel[j] += (w[j] * V - this.vel[j]) * resp;
    var dk = Math.exp(-dt * (this.reduced ? 9 : 4.2));
    for (var q = 0; q < 3; q++) { this.dv[q] *= dk; if (Math.abs(this.dv[q]) < 1e-4) this.dv[q] = 0; }
    var vx = this.vel[0] + this.dv[0], vy = this.vel[1] + this.dv[1], vz = this.vel[2] + this.dv[2];
    this.pos[0] += vx * dt; this.pos[1] += vy * dt; this.pos[2] += vz * dt;

    /* no flying through a body: a soft shell at a third of a radius out */
    if (near && env.near) {
      var n2 = env.near(this.pos);
      if (n2 && n2.r && n2.d < n2.r * 0.35) {
        var c = n2.c, dx = this.pos[0] - c[0], dy = this.pos[1] - c[1], dz = this.pos[2] - c[2], dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        var want = n2.r * 1.35;
        this.pos = [c[0] + dx / dl * want, c[1] + dy / dl * want, c[2] + dz / dl * want];
        var nx = dx / dl, ny = dy / dl, nz = dz / dl;
        [this.vel, this.dv].forEach(function (v) { var vn = v[0] * nx + v[1] * ny + v[2] * nz; if (vn < 0) { v[0] -= vn * nx; v[1] -= vn * ny; v[2] -= vn * nz; } });
      }
    }
    var B = env.bound || 60, pl = len3(this.pos);
    if (pl > B) { var s = 1 - Math.min(1, (pl - B) * dt * 1.5) * (1 - B / pl); this.pos[0] *= s; this.pos[1] *= s; this.pos[2] *= s; }
    if (env.floor != null && this.pos[1] < env.floor) { this.pos[1] = env.floor; if (this.vel[1] < 0) this.vel[1] = 0; if (this.dv[1] < 0) this.dv[1] = 0; }

    this.speedNow = Math.sqrt(vx * vx + vy * vy + vz * vz);
    this.dashK = Math.max(0, this.dashK - dt * 2.4);
    var goal = this.reduced ? 0 : clamp(this.speedNow / Math.max(1, V * 3) + this.dashK * 0.6, 0, 1);
    this.kick += (goal - this.kick) * (1 - Math.exp(-dt * 6));
    return this.speedNow > 1e-3 || !!(ly || lp);
  };

  /* The pose onto a three.js camera: YXZ, so yaw then pitch and never roll. */
  P.apply = function (cam) {
    cam.position.set(this.pos[0], this.pos[1], this.pos[2]);
    cam.rotation.order = 'YXZ';
    cam.rotation.set(this.pitch, this.yaw, 0);
    cam.updateMatrixWorld();
  };
  P.velocity = function () { return [this.vel[0] + this.dv[0], this.vel[1] + this.dv[1], this.vel[2] + this.dv[2]]; };

  /* ---- The gamepad --------------------------------------------------------- */
  P.pollPad = function (dt) {
    this.padPoll = false;
    if (this.o.gamepad === false || !root.navigator || !root.navigator.getGamepads) return;
    var pads; try { pads = root.navigator.getGamepads(); } catch (e) { return; }
    var gp = null;
    for (var i = 0; pads && i < pads.length; i++) if (pads[i] && pads[i].connected) { gp = pads[i]; break; }
    if (!gp) { if (this._gp) { this._gp = null; this.stick = [0, 0]; this.lookAx = [0, 0]; this.lift = 0; } return; }
    this._gp = gp.id;
    var dz = function (v) { return Math.abs(v) < 0.14 ? 0 : (v - Math.sign(v) * 0.14) / 0.86; };
    var ax = gp.axes || [], bt = gp.buttons || [];
    var bv = function (n) { var b = bt[n]; return b ? (typeof b === 'object' ? b.value || (b.pressed ? 1 : 0) : b) : 0; };
    var sx = dz(ax[0] || 0), sz = -dz(ax[1] || 0), lx = -dz(ax[2] || 0), ly = -dz(ax[3] || 0);
    this.stick = [sx, sz]; this.lookAx = [lx * 1.2, ly];
    this.lift = clamp(bv(7) - bv(6), -1, 1);
    this.boost = this.boost || bv(10) > 0.5;
    var prev = this._gpPrev || {}, cur = {};
    [0, 3, 4, 5].forEach(function (n) { cur[n] = bv(n) > 0.5; });
    if (cur[0] && !prev[0]) this.dash(null);
    if (this.o.onPad) {
      if (cur[4] && !prev[4]) this.o.onPad('prev');
      if (cur[5] && !prev[5]) this.o.onPad('next');
      if (cur[3] && !prev[3]) this.o.onPad('engage');
    }
    this._gpPrev = cur;
    if (sx || sz || lx || ly || this.lift) { this.auto = null; this.padPoll = true; }
  };

  /* ---- The touch pad ----------------------------------------------------------
     A stick and three buttons, built into a container the screen provides.
     Every size is at least the 44px the app holds its controls to. */
  P.mountPad = function (box) {
    if (!box || (this.pad && this.pad.box === box && box.contains(this.pad.root))) return;
    this.unmountPad();
    var self = this, doc = box.ownerDocument || document;
    var rootEl = doc.createElement('div');
    rootEl.setAttribute('data-flight-pad', '1');
    rootEl.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    var base = doc.createElement('div');
    base.setAttribute('aria-hidden', 'true');
    base.style.cssText = 'position:absolute;left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));width:132px;height:132px;border-radius:50%;pointer-events:auto;touch-action:none;' +
      'background:radial-gradient(circle,rgba(var(--atmc),.16),rgba(var(--atmc),.04) 62%,transparent 70%);border:1px solid var(--bd);box-shadow:inset 0 0 0 1px rgba(var(--atmc),.18)';
    var ringIn = doc.createElement('div');
    ringIn.style.cssText = 'position:absolute;inset:30px;border-radius:50%;border:1px dashed rgba(var(--atmc2),.28)';
    base.appendChild(ringIn);
    var knob = doc.createElement('div');
    knob.style.cssText = 'position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(var(--atmc2),.5),rgba(var(--atmc),.4) 60%,var(--bg) 100%);border:1.5px solid var(--ac2-hi);box-shadow:0 0 22px rgba(var(--atmc),.55);transition:transform .12s ease-out';
    base.appendChild(knob);
    rootEl.appendChild(base);

    var col = doc.createElement('div');
    col.style.cssText = 'position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));display:grid;grid-template-columns:56px 56px;grid-template-rows:56px 56px;gap:10px;pointer-events:auto';
    var mk = function (label, glyph, area) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.style.cssText = 'all:unset;box-sizing:border-box;cursor:pointer;touch-action:none;grid-area:' + area + ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:56px;min-height:56px;border-radius:16px;' +
        'border:1px solid var(--bd);background:var(--bg);color:var(--tx);font:700 9px var(--fu);letter-spacing:.1em;text-transform:uppercase;-webkit-tap-highlight-color:transparent;box-shadow:0 0 0 1px rgba(var(--atmc),.12) inset';
      var g = doc.createElement('span'); g.setAttribute('aria-hidden', 'true'); g.textContent = glyph; g.style.cssText = 'font:400 18px/1 var(--fu);color:var(--ac2-hi)';
      var t = doc.createElement('span'); t.textContent = label;
      b.appendChild(g); b.appendChild(t);
      col.appendChild(b);
      return b;
    };
    var up = mk('Ascend', '▲', '1 / 2'), dash = mk('Dash', '»', '1 / 1 / 3 / 2'), down = mk('Descend', '▼', '2 / 2');
    dash.style.minHeight = '122px'; dash.style.borderColor = 'var(--ac2)';
    rootEl.appendChild(col);
    box.appendChild(rootEl);

    var hold = function (btn, y) {
      btn.addEventListener('pointerdown', function (e) { e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (x) {} self.setLift(y); btn.style.borderColor = 'var(--ac2-hi)'; self.wake(); });
      var off = function () { if (self.lift === y && !self.liftT) self.setLift(0); btn.style.borderColor = 'var(--bd)'; };
      btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off); btn.addEventListener('lostpointercapture', off);
      btn.addEventListener('click', function (e) { if (e.detail === 0) { self.pulseLift(y); self.wake(); } });
    };
    hold(up, 1); hold(down, -1);
    dash.addEventListener('click', function () { self.dash(null); self.wake(); });

    var st = { id: null, cx: 0, cy: 0, t: 0, max: 0 };
    var R = 46;
    var setK = function (x, y) { self.setStickKnob(x, y); };
    base.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var b = base.getBoundingClientRect();
      st.id = e.pointerId; st.cx = b.left + b.width / 2; st.cy = b.top + b.height / 2; st.t = now(); st.max = 0;
      try { base.setPointerCapture(e.pointerId); } catch (x) {}
      move(e);
      self.wake();
    });
    var move = function (e) {
      if (st.id !== e.pointerId) return;
      var dx = (e.clientX - st.cx) / R, dy = (e.clientY - st.cy) / R, l = Math.sqrt(dx * dx + dy * dy);
      if (l > 1) { dx /= l; dy /= l; l = 1; }
      st.max = Math.max(st.max, l);
      st.lx = dx; st.ly = dy;
      setK(dx, dy);
      self.setStick(dx, -dy);
      self.wake();
    };
    base.addEventListener('pointermove', move);
    var end = function (e) {
      if (st.id !== e.pointerId) return;
      st.id = null;
      /* a flick, out to the rim and released inside a fifth of a second, is a dash */
      if (st.max > 0.85 && now() - st.t < 200) self.dash([st.lx || 0, 0, -(st.ly || 0)]);
      setK(0, 0); self.setStick(0, 0);
    };
    base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
    this.pad = { box: box, root: rootEl, knob: knob, R: R };
  };
  P.setStickKnob = function (x, y) {
    if (!this.pad) return;
    this.pad.knob.style.transform = 'translate(' + (x * this.pad.R).toFixed(1) + 'px,' + (y * this.pad.R).toFixed(1) + 'px)';
  };
  P.unmountPad = function () {
    if (this.pad && this.pad.root && this.pad.root.parentNode) this.pad.root.parentNode.removeChild(this.pad.root);
    this.pad = null;
  };
  P.wake = function () { if (this.o.onWake) this.o.onWake(); };

  /* Whether a key event belongs to a control that already uses it, so flight
     leaves it alone: a field being typed into, or arrows on a radio group, a
     tab list, a menu or a slider, or Space and Enter on a button. */
  function claimedElsewhere(e) {
    var t = e.target;
    if (!t || t === document.body) return false;
    var tag = (t.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable) return true;
    var role = t.getAttribute && t.getAttribute('role');
    var isArrow = /^Arrow/.test(e.code);
    if (isArrow && (/^(radio|tab|menuitem|menuitemradio|option|slider)$/.test(role || '') || (t.closest && t.closest('[role="radiogroup"],[role="tablist"],[role="menu"],[role="listbox"]')))) return true;
    if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') && (tag === 'button' || tag === 'a' || role === 'button' || role === 'switch' || role === 'checkbox')) return true;
    return false;
  }

  /* ---- The glue a stage needs, installed onto a scene's prototype -----------
     The Human Design wiring and the Cycle Audit fly the way the chart does,
     through these. The scene supplies `cam`, `reduced`, `kick()`, `lift()`,
     `updateRun()` and, if it has bodies worth slowing for, `nearest(p)`.
     The move keys take off from wherever the camera is; Escape, 0 and Home
     land, and the camera eases back onto the scene's own resting rig. */
  function mixin(SP) {
    SP.flyer = function () {
      if (this.fly) return this.fly;
      var self = this;
      this.fly = new Flight({ reduced: this.reduced, onWake: function () { self.updateRun(); self.kick(); }, onDash: function () { self.lift(0.25); } });
      return this.fly;
    };
    SP.flying = function () { return !!(this.fly && this.fly.active); };
    SP.flyEngage = function () {
      var f = this.flyer();
      if (!f.active && this.cam) {
        var d = this.cam.getWorldDirection(this.cam.position.clone());
        f.engage([this.cam.position.x, this.cam.position.y, this.cam.position.z], [d.x, d.y, d.z]);
        this.ret = null;
      }
      this.updateRun();
      return f;
    };
    SP.flyRelease = function () {
      var f = this.fly;
      if (!f || !f.active || !this.cam) return;
      this.ret = { t: 0, pos: this.cam.position.clone(), q: this.cam.quaternion.clone() };
      f.release();
      this.lift(0.2); this.updateRun(); this.kick();
    };
    /* the card's keys: returns true when flight took the key */
    SP.flyKey = function (e) {
      var flying = this.flying();
      if (e.key === 'Escape' && flying) { e.preventDefault(); e.stopPropagation(); this.flyRelease(); return true; }
      if ((e.key === '0' || e.key === 'Home') && flying) { e.preventDefault(); this.flyRelease(); return true; }
      if ((MOVE[e.code] && (e.code !== 'Space' || flying)) || e.code === 'KeyX' || (flying && LOOK[e.code])) {
        this.flyEngage().key(e, true);
        e.preventDefault(); this.lift(0.04); this.kick();
        return true;
      }
      return false;
    };
    SP.flyKeyUp = function (e) { if (this.fly) this.fly.key(e, false); };
    /* in placeCamera, first: true when flight placed the camera */
    SP.flyPose = function (dt) {
      var f = this.fly;
      if (!f || !f.active) return false;
      var self = this;
      f.update(dt || 0.016, { bound: this.flyBound || 70, minV: 0.2, maxV: 9, near: this.nearest ? function (p) { return self.nearest(p); } : null });
      f.apply(this.cam);
      this.flyLens(f.kick);
      return true;
    };
    /* in placeCamera, after the rig has placed the camera: the ease home */
    SP.flyBlend = function (dt) {
      this.flyLens(0);
      var rt = this.ret;
      if (!rt) return false;
      rt.t = Math.min(1, rt.t + (dt || 0.016) / (this.reduced ? 0.01 : 0.9));
      var e = rt.t * rt.t * (3 - 2 * rt.t), toP = this.cam.position.clone(), toQ = this.cam.quaternion.clone();
      this.cam.position.lerpVectors(rt.pos, toP, e);
      this.cam.quaternion.slerpQuaternions(rt.q, toQ, e);
      this.cam.updateMatrixWorld();
      if (rt.t >= 1) this.ret = null;
      return true;
    };
    SP.flyLens = function (kick) {
      if (this.baseFov == null) this.baseFov = this.cam.fov;
      var fov = this.baseFov + (this.reduced ? 0 : 15 * (kick || 0)), near = this.flying() ? 0.01 : (this.baseNear || (this.baseNear = this.cam.near));
      if (Math.abs(this.cam.fov - fov) > 0.01 || this.cam.near !== near) { this.cam.fov = fov; this.cam.near = near; this.cam.updateProjectionMatrix(); }
    };
    SP.flyBusy = function () { return !!((this.fly && this.fly.busy()) || this.ret); };
    /* a drag while flying looks; two fingers move */
    SP.flyLook = function (dx, dy) { var H = this.H || 300; this.flyEngage().look(-dx / H * 2.1, -dy / H * 2.1); this.lift(0.02); };
    SP.flyNudge = function (m, k) { this.flyEngage().nudge(m, k); };
  }

  root.Flight = {
    create: function (o) { return new Flight(o); },
    mixin: mixin,
    claimedElsewhere: claimedElsewhere,
    isMoveKey: function (code) { return !!MOVE[code]; }
  };
})(typeof window !== 'undefined' ? window : this);
