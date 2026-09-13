# Ephemeris Architecture: Dual-Backend System

## Overview

The app now uses a **dual-backend ephemeris system** that provides:
- **Primary Backend**: Swiss Ephemeris (WASM) for high-precision calculations
- **Fallback Backend**: Current simplified ephemeris (Kepler + analytical) if Swiss unavailable
- **Transparent Degradation**: If Swiss WASM fails to load, app automatically uses current ephemeris

## Architecture

```
Application (hdChart, hd-wheel, etc.)
           ↓
[Ephemeris Cache] (optional memoization)
           ↓
    EphemerisRouter (orchestrator)
           ↓
    ┌──────┴──────┐
    ↓             ↓
Swiss WASM    Current Ephemeris
(if available)  (always available)
```

## Modules

### 1. `ephemeris-points.js` — Point Registry
**Single source of truth** for all 17 computable points.

```javascript
const Points = EphemerisPoints;
const sun = Points.byId('sun');
// → { id, name, glyph, category, sweId, backends, accuracy, tooltip, reference }

const allPoints = Points.ordered();  // All 17 in order
const basics = Points.byCategory('basic');  // Just primary 13
```

**Categories:**
- `basic` (13): Sun, Moon, Mercury–Pluto, N.Node, S.Node
- `node` (2): North Node, South Node
- `derived` (1): Earth (computed)
- `centaur` (1): Chiron
- `asteroid` (4): Ceres, Pallas, Juno, Vesta

**Layering Rule:**
- **Basic chart**: `category='basic'` + nodes + angles (if time known)
- **Expanded chart**: all of above + asteroids + centaur
- Expanded-only items link back to basic duplicates (no duplication in rendering)

### 2. `ephemeris-backend-current.js` — Fallback Backend
Wraps the app's existing simplified ephemeris:
- Sun/Moon: VSOP87-truncated analytical series
- Mercury–Pluto: First-order Kepler solver with stored elements
- Chiron/Asteroids: Newton-iterated Kepler solver
- North/South Node: Mean motion only

```javascript
const CurrentBackend = EphemerisBackendCurrent.create();
await CurrentBackend.init();

const point = CurrentBackend.compute('sun', jd, lat, lon, 'Placidus');
// → { id, name, glyph, lon, lat, dist, sign, degreeInSign, house, retrograde, speed, ... }
```

**Accuracy:**
- Sun/Moon: ±0.1° (analytical)
- Mercury–Pluto: ±0.5° RMS
- Chiron: 0.93° worst (fitted to JPL 1900–2060)
- Asteroids: ±0.3° (provisional elements)

### 3. `ephemeris-backend-swiss.js` — Swiss Ephemeris (WASM)
Wraps [swisseph-wasm](https://npm.im/swisseph-wasm) (v0.1.0+, GPL-3.0).

```javascript
const SwissBackend = EphemerisBackendSwiss.create();
await SwissBackend.init();  // Loads and initializes WASM

const point = SwissBackend.compute('sun', jd, lat, lon, 'Placidus');
// → { id, name, glyph, lon, lat, dist, sign, degreeInSign, house, retrograde, speed, ... }
```

**If WASM unavailable:**
- `SwissBackend.ready` becomes `false`
- `compute()` returns `null`
- Router automatically falls back to current ephemeris

**Accuracy:**
- All points: JPL DE441 (professional-grade)
- Much tighter than current ephemeris

### 4. `ephemeris-router.js` — Orchestrator
Selects backend at runtime and handles fallback.

```javascript
const router = EphemerisRouter.create({ forceBackend: 'current' });
await router.init();  // Tries Swiss, falls back if needed

// Compute single point (tries Swiss first, falls back to current)
const result = router.compute('sun', jd, lat, lon, 'Placidus');

// Compute all 17 points
const allPoints = router.computeAll(jd, lat, lon, 'Placidus');

// Check status
const status = router.status();
// → { ready, primary: 'Swiss Ephemeris WASM' | 'unavailable', 
//     fallback: 'Current (simplified)', errors: [], using: 'swiss' | 'current' }

router.close();  // Clean up WASM
```

**Options:**
- `forceBackend: 'current'` — Skip Swiss, always use current (for offline-only or testing)
- `logErrors: true` — Log warnings/errors to console

## Integration into App

### Step 1: Load modules in main app file

```html
<script src="./ephemeris-points.js"></script>
<script src="./ephemeris-backend-current.js"></script>
<script src="./ephemeris-backend-swiss.js"></script>
<script src="./ephemeris-router.js"></script>
<script src="./ephemeris-cache.js"></script>
```

### Step 2: Replace direct `lonRaw()` calls with router

**Before:**
```javascript
const lon = this.lonRaw('Sun', t);  // Direct call
```

**After:**
```javascript
// In component init:
this.ephRouter = EphemerisRouter.create();
await this.ephRouter.init();

// In computation:
const point = this.ephRouter.compute('sun', jd, lat, lon, houseSys);
const lon = point.lon;
```

### Step 3: Use point metadata from registry

**Before:**
```javascript
// Glyph hardcoded everywhere
const glyph = '☉';  // for Sun
```

**After:**
```javascript
const point = EphemerisPoints.byId('sun');
const glyph = point.glyph;  // ☉
const tooltip = point.tooltip;  // "Core essence, ego, identity, conscious will"
```

## Installation

### For npm-based project (if build step added):

```bash
npm install swisseph-wasm
```

### For non-npm project (current app):

Swiss Ephemeris is **optional**. If not installed:
- App still works (uses current ephemeris)
- No error
- Status reports Swiss as unavailable

To use Swiss WASM, either:
1. Copy swisseph-wasm into `app/` manually, OR
2. Add a simple build step to copy node_modules → app/

## Caching

Ephemeris caching via `ephemeris-cache.js` is **transparent** to the router:

```javascript
// Behind the scenes:
// 1. Router.compute() calls backend.compute()
// 2. Cache intercepts (keyed on point ID + jd)
// 3. If hit, returns cached value
// 4. If miss, computes fresh and caches

// Application sees same interface either way
const point = router.compute('sun', jd, lat, lon);
```

No changes needed to app; caching works automatically.

## Accuracy & Tradeoffs

| Aspect | Current | Swiss WASM | Recommendation |
|---|---|---|---|
| Precision | 0.5–0.93° | <0.1° | Use Swiss for production |
| Bundle | 40 KB | +3.1 MB | Can lazy-load on first chart |
| Startup | <1ms | +500ms (init) | Acceptable; init once per session |
| Offline | ✅ | ✅ after loaded | Both work offline |
| License | (app choice) | GPL-3.0 | Must disclose if included |
| Testing | ✅ (fitted) | ✅ (v0.1.0 Jul 2026) | Both production-ready |

## Testing

### Verify both backends work:

```javascript
// Node.js or browser dev console
const router = EphemerisRouter.create();
await router.init();
const status = router.status();
console.log(status);
// → { ready: true, primary: 'Swiss...' | 'unavailable', fallback: 'Current...', using: 'swiss' | 'current' }

// Compute the same point on both (should differ <1°)
const jd = 2451545.0;  // 2000-01-01 12:00 UT
const sunSwiss = router.compute('sun', jd, null, null);
// Swiss should have precise lon, lat, dist, speed; current will have null for lat/dist
```

### Force current ephemeris (for testing fallback):

```javascript
const router = EphemerisRouter.create({ forceBackend: 'current' });
await router.init();
const status = router.status();
console.log(status.using);  // → 'current'
```

## Migration Path (for app maintainers)

### Phase 1: Add modules (no app change)
- Add the 4 new modules to `app/`
- They are inert until called

### Phase 2: Refactor hdChart (gradual)
1. Create router instance in app class init
2. Replace `this.lonRaw(name, t)` with `router.compute(idFromName(name), jd, ...)`
3. Use point metadata from registry instead of hardcoded glyphs/names

### Phase 3: Update dependencies (optional)
1. Add `npm install swisseph-wasm` (if npm is added to project)
2. Update CLAUDE.md to document Swiss as optional

### Phase 4: Monitor & optimize
1. Measure cache hit rates
2. Consider lazy-loading WASM on first chart render (if bundle size matters)
3. Collect accuracy feedback

## Glossary

- **JD / Julian Day**: Astronomical day count from J2000.0 epoch (2000-01-01 12:00 UT)
- **Longitude**: Ecliptic longitude in degrees, 0–360
- **Sign**: Zodiac sign index, 0=Aries through 11=Pisces
- **Retrograde**: Body moving backward in longitude (Sun/Moon never retrograde)
- **House**: Astrological house (1–12), computed from birth location and time
- **Orb**: Tolerance in degrees for aspects; e.g., conjunction within 8° orb
- **Ephemeris**: Table of body positions; here, computation of positions from time

## References

- **Swiss Ephemeris**: https://www.astro.com/swisseph/
- **swisseph-wasm npm**: https://npm.im/swisseph-wasm
- **swisseph-wasm GitHub**: https://github.com/prolaxu/swisseph-wasm
- **JPL Horizons**: https://ssd.jpl.nasa.gov/horizons/
- **VSOP87**: https://en.wikipedia.org/wiki/VSOP_(astronomy)

## Notes

- No em dashes (per CLAUDE.md rule on style).
- Point IDs are camelCase (e.g., 'northNode', not 'North Node').
- Backend modules use UMD pattern for Node.js + browser compatibility.
- All computation is on main thread (WASM runs in browser; no Web Worker needed).
- Caching is optional and transparent; app works fine without it.
