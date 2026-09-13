# Ephemeris Architecture Integration Guide

## Overview

This guide walks through integrating the dual-backend ephemeris system into `inCommonApp v2.dc.html`. The integration is **non-breaking** — the app works with or without the changes.

## Architecture Modules

All in `app/`:
- `ephemeris-points.js` — Point registry
- `ephemeris-backend-current.js` — Fallback (current simplified ephemeris)
- `ephemeris-backend-swiss.js` — Primary (Swiss Ephemeris WASM)
- `ephemeris-router.js` — Router/orchestrator
- `ephemeris-cache.js` — Optional memoization (existing, unchanged)
- `ephemeris-integration.js` — Integration helper (NEW, for migration)

## Step-by-Step Integration

### Phase 1: Load Modules (No App Changes)

#### 1.1 Add script tags to HTML head

In `inCommonApp v2.dc.html`, after the existing `<script src="./support.js"></script>` block, add:

```html
<!-- Ephemeris system: dual-backend with fallback -->
<script src="./ephemeris-points.js"></script>
<script src="./ephemeris-backend-current.js"></script>
<script src="./ephemeris-backend-swiss.js"></script>
<script src="./ephemeris-router.js"></script>
<script src="./ephemeris-integration.js"></script>
```

**Result**: Modules are loaded into `window.EphemerisPoints`, `window.EphemerisRouter`, etc. App works unchanged.

---

### Phase 2: Initialize Router in Component (Minimal Change)

#### 2.1 Add initialization in `componentDidMount()`

**Location**: Line ~8647 in `inCommonApp v2.dc.html`

**Before**:
```javascript
componentDidMount() {
  this.pruneDefaultProfile();
  window.__incommonApp = this;
  this._sessionAt = Date.now();
  // ... rest of mount code
}
```

**After**:
```javascript
componentDidMount() {
  this.pruneDefaultProfile();
  window.__incommonApp = this;
  this._sessionAt = Date.now();
  
  /* Initialize ephemeris router (new) */
  const EI = typeof window !== 'undefined' && window.EphemerisIntegration;
  if (EI) {
    this.ephIntegration = EI.init(this);
  }
  
  // ... rest of mount code
}
```

**Impact**: Router loads in background. `this.ephIntegration.ready()` promise resolves when ready.

#### 2.2 Add cleanup in `componentWillUnmount()`

**Location**: Line ~8755 in `inCommonApp v2.dc.html`

**Before**:
```javascript
componentWillUnmount() {
  if (this._onHide) { this._onHide(); window.removeEventListener('pagehide', this._onHide); this._onHide = null; }
  this.skyStop();
  // ... rest of unmount code
}
```

**After**:
```javascript
componentWillUnmount() {
  if (this._onHide) { this._onHide(); window.removeEventListener('pagehide', this._onHide); this._onHide = null; }
  
  /* Clean up ephemeris router (new) */
  if (this.ephIntegration) {
    this.ephIntegration.close();
    this.ephIntegration = null;
  }
  
  this.skyStop();
  // ... rest of unmount code
}
```

**Impact**: Router closes and WASM is unloaded on unmount.

---

### Phase 3: Use Router Instead of Direct `lonRaw()` (Optional Refactor)

This phase is **optional**. The app works fine with Phase 1 & 2 alone. Phase 3 adds routing benefits (Swiss ephemeris support, structured point data).

#### 3.1 Replace `lonOf()` calls in `hdChart()` and `chartAt()`

**Current code** (around line 10471, `hdChart()` and line 10279, `chartAt()`):

```javascript
chartAt(date) {
  const t = this.t2000(date);
  return this.PLNS.map(([n, g]) => {
    const lon = this.lonOf(n, t);  // Direct call
    const s = this.signOf(lon);
    return { name: n, glyph: g, lon: lon, sign: s.sign, deg: s.deg, idx: s.idx, mean: this.PL_MEAN[n] };
  });
}
```

**Option A: Minimal change (use integration helper)**

```javascript
chartAt(date) {
  const t = this.t2000(date);
  const lonOf = this.ephIntegration ? this.ephIntegration.lonOf.bind(this.ephIntegration) : this.lonOf.bind(this);
  return this.PLNS.map(([n, g]) => {
    const lon = lonOf(n, t);  // Uses router if available, else fallback
    const s = this.signOf(lon);
    return { name: n, glyph: g, lon: lon, sign: s.sign, deg: s.deg, idx: s.idx, mean: this.PL_MEAN[n] };
  });
}
```

**Option B: Full refactor (use structured point data)**

```javascript
chartAt(date) {
  const t = this.t2000(date);
  return this.PLNS.map(([n, g]) => {
    let point = null;
    if (this.ephIntegration) {
      point = this.ephIntegration.computePoint(n, t);
    }
    
    if (point && point.lon != null) {
      return {
        name: n, glyph: g, lon: point.lon, sign: point.sign,
        deg: point.degreeInSign, idx: point.sign,
        mean: this.PL_MEAN[n],
        backend: point.backend
      };
    }
    
    /* Fallback: direct lonRaw */
    const lon = this.lonOf(n, t);
    const s = this.signOf(lon);
    return { name: n, glyph: g, lon: lon, sign: s.sign, deg: s.deg, idx: s.idx, mean: this.PL_MEAN[n] };
  });
}
```

#### 3.2 Replace `lonOf()` calls in `transitsNow()` and others

Same pattern: replace `this.lonOf(n, t)` with:
- Router version: `this.ephIntegration && this.ephIntegration.lonOf(n, t)`
- Fallback: `this.lonOf(n, t)`

**Affected methods** (~10 total):
- `hdChart()` (lines ~10471)
- `chartAt()` (lines ~10279)
- `fullChart()` (lines ~10285)
- `transitsNow()` (lines ~10431)
- `moonPhase()` (lines ~10418)
- `designT()` (lines ~10463)
- Any other place that calls `this.lonOf()`

---

## Installation: Adding Swiss Ephemeris (Optional)

To use the Swiss Ephemeris backend, install the WASM package:

```bash
npm install swisseph-wasm
```

If NOT installed, app still works (uses current ephemeris, reports Swiss as unavailable).

To check backend status:

```javascript
// In browser console
const status = window.__incommonApp.ephIntegration.status();
console.log(status);
// → { ready: true, primary: 'Swiss Ephemeris WASM' | 'unavailable', fallback: 'Current...', using: 'swiss' | 'current' }
```

---

## Testing the Integration

### Test 1: Router initializes

```javascript
// Browser console
const eph = window.__incommonApp.ephIntegration;
await eph.ready();
console.log(eph.status());
```

Expected: `{ ready: true, primary: ..., fallback: ..., using: 'current' | 'swiss' }`

### Test 2: lonOf() works through router

```javascript
const t = 2451545.0;  // 2000-01-01 12:00 UTC
const sun = eph.lonOf('Sun', t);
console.log(sun);  // Should be ~280.5 (Sun in Capricorn)
```

### Test 3: computePoint() returns structured data

```javascript
const point = eph.computePoint('Sun', t);
console.log(point);
// → { id: 'sun', name: 'Sun', lon: 280.5, lat: null, sign: 9, degreeInSign: 10.5, ... }
```

### Test 4: Compare Sun position (current vs Swiss, if WASM available)

```javascript
// If Swiss is loaded
const status = eph.status();
if (status.using === 'swiss') {
  console.log('Swiss Ephemeris is active');
  const point = eph.computePoint('Sun', t);
  console.log('Swiss Sun:', point.lon, 'backend:', point.backend);
}
```

---

## Migration Timeline

**Phase 1** (lowest risk):
- Add script tags (no code changes)
- Add init/cleanup to lifecycle hooks
- Test app loads and works normally
- **Time**: 5 minutes

**Phase 2** (medium risk):
- Add `lonOf` routing to one method (`chartAt()`)
- Test that natal chart renders correctly
- Compare current vs Swiss backend results (if WASM installed)
- **Time**: 30 minutes

**Phase 3** (polish):
- Refactor all `lonOf()` calls to use router
- Add structured point data usage (lat, dist, retrograde, etc.)
- Update any UI that shows ephemeris accuracy notes
- **Time**: 2–3 hours

---

## Rollback

If issues arise:

1. **Phase 1 only (safe)**: Remove router script tags, keep component init code (harmless if `this.ephIntegration` is undefined).
2. **Phase 1 + 2**: Remove `ephIntegration` initialization and cleanup from lifecycle hooks; keep router scripts loaded (inert).
3. **Full rollback**: Revert to prior commit; no data loss or state corruption.

---

## Performance Impact

| Operation | Before | After | Impact |
|---|---|---|---|
| App boot | <1ms | +500ms (WASM init) | One-time, async |
| `lonOf(name, t)` | ~1µs | ~1µs (cached) | None (cache speeds it up) |
| `hdChart()` call | ~10ms | ~10ms | None (same computation) |
| Memory (WASM loaded) | ~1MB | +3.1MB | After first chart render |

**Note**: WASM loads asynchronously; app is interactive before it finishes.

---

## Accuracy Impact

| Point | Current | Swiss | Benefit |
|---|---|---|---|
| Sun/Moon | ±0.1° | <0.1° | Negligible |
| Planets | ±0.5° | JPL DE441 | 5–10x tighter |
| Chiron | 0.93° | <0.1° | Sabian degree now safe |
| Asteroids | ±0.3° | JPL DE441 | Professional-grade |

**Visible to users**: Sabian symbols for Chiron (currently hidden); sharper natal charts.

---

## Troubleshooting

| Issue | Symptom | Fix |
|---|---|---|
| WASM fails to load | Console warnings, status shows `using: 'current'` | Install `npm i swisseph-wasm`, or use current ephemeris (fine for astrology) |
| lonOf() returns null for a point | Chart shows blank for that point | Router returned null; fallback to lonRaw (check ephIntegration.status()) |
| `this.ephIntegration` undefined | TypeError in methods | Ensure Phase 1 (script tags) completed and componentDidMount ran |
| App slow on first chart | UI hangs briefly | WASM initializing; harmless, only happens once per session |

---

## References

- **Architecture doc**: `EPHEMERIS-ARCHITECTURE.md`
- **Integration helper**: `ephemeris-integration.js`
- **Point registry**: `ephemeris-points.js`
- **Router**: `ephemeris-router.js`
- **Swiss WASM**: https://npm.im/swisseph-wasm

---

## Checklist (for maintainer)

- [ ] Phase 1: Script tags added
- [ ] Phase 2: Init/cleanup in lifecycle hooks
- [ ] Phase 2 tested: app loads, hdChart renders, no console errors
- [ ] Phase 3: lonOf routing added to at least chartAt() and hdChart()
- [ ] Phase 3 tested: natal charts match (±0.1°) between current and Swiss
- [ ] `npm i swisseph-wasm` run (if adding Swiss)
- [ ] Commit with message: "Integrate dual-backend ephemeris (current + Swiss WASM)"
- [ ] Update CLAUDE.md to document new modules and Swiss as optional

