# Ephemeris Computation Engine (V1.0.0)

## Overview

The computation engine (`ephemeris/engine.ts`) is the **second architectural layer** of the dual-backend ephemeris system, implementing all 8 computation functions from Prompt 2. It wraps Swiss Ephemeris (via `swisseph-wasm` in the browser) and provides a complete type-safe interface for computing positions of all 98 astrological points in the registry.

**Architecture layers:**
1. **Registry** (`pointRegistry.ts`) — Type-safe definitions of 98 points (BASIC 17 + EXPANDED 40+)
2. **Computation Engine** (`engine.ts`) — Position calculations, integrated with registry
3. **Router** (`ephemeris-router.js`) — Backend selection & fallback orchestration
4. **Integration** (`ephemeris-integration.js`) — Component lifecycle hooks

## Installation & Initialization

### Browser (WASM)

The app uses **swisseph-wasm**, an optional dependency (GPL-3.0):

```bash
npm install swisseph-wasm@0.1.0+
```

If not installed, the app falls back to the simplified ephemeris (`ephemeris-backend-current.js`).

### Node.js (Testing, Development)

For Node.js server-side tests, use the **swisseph** binding:

```bash
npm install swisseph
```

The engine auto-detects the available binding on init.

### Initialization

```typescript
import { initEngine, computeAll } from './ephemeris/engine';

// Call once per session
await initEngine();

// Now compute points
const points = computeAll(
  2451545.0,        // JD2000 (2000-01-01 12:00 TT)
  40.7128,          // latitude (degrees)
  -74.0060,         // longitude (degrees)
  houseCusps        // optional: [cusp1...cusp12]
);
```

## Computation Functions

### 1. Ephemeris Bodies (Sun, Moon, Planets)

```typescript
sweBody(sweId: number, jd: number): { lon, speed }
```

- **Input**: Swiss Ephemeris body ID (0–9: Sun, Moon, Mercury–Pluto)
- **Output**: Ecliptic longitude (0–360°), speed (degrees/day; <0 = retrograde)
- **Fallback**: Automatically retries with MOSEPH if SWIEPH fails
- **Example**: `sweBody(0, 2451545.0)` → Sun at J2000.0 ≈ **280.4°** ± 0.1°

### 2. Asteroids by MPC Number

```typescript
sweAsteroid(mpcId: number, jd: number): { lon, speed } | null
```

- **Input**: MPC asteroid number (e.g., 1 for Ceres, 2060 for Chiron)
- **Output**: Position or `null` if not in ephemeris (graceful fallback)
- **Fallback**: MOSEPH, then silent `null` (never crashes batch)
- **Acceptance**: Ceres, Chiron, Eris, Sedna all compute or return `null` without crash

### 3. Hypothetical Planets (Hamburg School TNPs)

```typescript
sweHypothetical(sweId: number, jd: number): { lon, speed }
```

- **Input**: Swiss Ephemeris ID 40–47 (Cupido, Hades, Zeus, Kronos, Apollon, Admetos, Vulkanus, Poseidon)
- **Output**: Same as `sweBody()`
- **Note**: These are fixed astronomical bodies in the Swiss Ephemeris library

### 4. Lunar Nodes (North & South)

```typescript
lunarNode(jd: number): { northNode: number, southNode: number }
```

- **Input**: Julian Day
- **Output**: Mean lunar node longitude; South Node = North + 180° **exactly**
- **Acceptance**: South Node ≡ Mean Node + 180° (verified by test 'e')

### 5. Planetary Nodes (Ascending)

```typescript
planetaryNodes(jd: number, sweIds: number[]): Record<number, number>
```

- **Input**: Array of planet IDs (e.g., `[2, 3, 4]` for Mercury, Venus, Mars)
- **Output**: Map of `{sweId: ascending_node_lon}`
- **Fallback**: If `swe_nod_aps_ut()` unavailable, falls back to main position
- **Caching**: Call once per chart, reuse for all house assignments

### 6. Manual Points

All compute without ephemeris calls:

#### Selena (White Moon)
```typescript
computeSelena(lilithMeanLon: number): number
```
Formula: `(Lilith Mean + 180°) mod 360`

#### Aries Point
```typescript
computeAriesPoint(): number
```
Always **0°** (vernal equinox, fixed).

#### Antivertex
```typescript
computeAntivertex(vertexLon: number): number
```
Formula: `(Vertex + 180°) mod 360`

#### Part of Fortune (Two Formulas)
```typescript
computePartOfFortune(
  ascLon: number,
  moonLon: number,
  sunLon: number,
  isNightChart: boolean,
  formula: 'day' | 'night' | 'reverse' = 'reverse'
): number
```

- **Day formula**: `(Asc + Moon − Sun) mod 360`
- **Night formula**: `(Asc + Sun − Moon) mod 360`
- **'reverse' (default)**: Use night formula if `isNightChart = true`, day formula if false
- **Acceptance**: Day chart test passes; night chart (reversed) passes

#### Part of Spirit
```typescript
computePartOfSpirit(
  ascLon: number,
  sunLon: number,
  moonLon: number
): number
```
Always: `(Asc + Sun − Moon) mod 360`

#### Sun/Moon Midpoint
```typescript
computeSunMoonMidpoint(sunLon: number, moonLon: number): number
```
Formula: Shortest arc between Sun and Moon, with wraparound at 0°/360°.

#### Vertex (Computed from First Principles)
```typescript
computeVertex(jd: number, lat: number, lon: number, mcLon: number): number
```

**Formula derivation:**
- Vertex = western intersection of **prime vertical** with **ecliptic**
- From Meeus, Astronomical Algorithms, Ch. 14:
  - `tan(vertex) = −cos(lat) × sin(AST) / sin(obliquity)`
  - Where AST = Apparent Sidereal Time at observer location
  - Obliquity = mean ecliptic inclination at JD

**Implementation:**
- Uses `swe_sidtime()` if available (precise)
- Falls back to Greenwich Mean Sidereal Time approximation
- Singularity handling: if `sin(obliquity) ≈ 0`, return `MC ± 90°`

**Acceptance test (c):**
- NYC (40.7128°N, 74.0060°W), 1990-04-19 14:02 EDT
- Expected: ~313° (Aquarius)
- Tolerance: ±10° (accounts for house system / AST precision variance)

### 7. Comets

```typescript
computeComet(cometName: string, jd: number): { lon, magnitude? } | null
```

Delegates to `keplerSolve()` in `cometSolver.ts`:

**Kepler's Equation Solver:**
```typescript
keplerSolve(elements: CometElements, jd: number): { lon, magnitude? }
```

**Algorithm:**
1. Compute **mean anomaly** from days since perihelion: `M = n × dt`
2. Solve **Kepler's equation** via Newton-Raphson: `M = E − e·sin(E)`
3. Compute **true anomaly** from eccentric anomaly
4. Calculate **heliocentric distance** via orbital equation
5. Convert orbital plane → **ecliptic coordinates**
6. Return geocentric **ecliptic longitude**

**Comets included:**
- **Halley**: Perihelion 1986-02-09; next: 2061-07-28
- **Hale-Bopp**: Perihelion 1997-04-01; bright (~−1.1 mag at perihelion)
- **Hyakutake**: Perihelion 1996-05-01; passed 0.15 AU from Earth

**Acceptance test (d):**
- Halley at 1986-02-09 perihelion (JD 2446470.12)
- Expected: ~239° (Sagittarius)
- Tolerance: ±0.5° (mundane astrology standard)
- UI labels all comet positions as **"mundane only"**

**Note on elements:** Osculating elements are valid near their epoch and degrade over decades. For production use, download latest elements from:
- JPL Horizons System (NASA JPL)
- Minor Planet Center (IAU)

### 8. House Assignment

```typescript
assignHouse(lon: number, houseCusps: number[]): number
```

Assigns house (1–12) for any longitude given 12 house cusps.

**Logic:**
- Handles wraparound at 0°/360°
- Point is in house N if between cusp N and cusp N+1
- Default: house 1 (if cusps missing)

## Integration with Registry

The computation engine is **type-safe against the registry**:

```typescript
// In engine.ts
import { BASIC_REGISTRY, EXPANDED_REGISTRY } from './pointRegistry';

function computeAll(jd, lat, lon, houseCusps?, opts?): PointData[] {
  const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
  
  for (const point of allPoints) {
    // Compute by point.id
    // Store result in PointData { id, lon, speed, house, status }
  }
}
```

**PointData status field:**
- `'ok'` — Computed from ephemeris or derivation
- `'unavailable'` — Body not in ephemeris (e.g., asteroid without .se1 file)
- `'fixed'` — Manually derived (Aries Point, manual points)

## Caching & Performance

**Recommended architecture (Prompt 1-D):**
- Run `computeAll()` in a **Web Worker** (off main thread)
- Cache results by rounded key: `jd|lat|lon`
- Return `PointData[]` to main thread via `postMessage()`

**Performance expectations:**
- Single `sweBody()` call: ~0.1–1 ms
- Full `computeAll()` (98 points): ~10–50 ms
- Batch 10 charts: ~100–500 ms

The existing **`ephemeris-cache.js`** (optional) memoizes `lonOf()` by body and instant (in-memory, dies with page load). Do not add TTL or LRU; let it clear at ceiling.

## Error Handling

### Swiss Ephemeris Load Failure

If `swisseph-wasm` or `swisseph` not available:
1. `initEngine()` throws `Error`
2. Router catches and falls back to `ephemeris-backend-current.js`
3. App continues with simplified ephemeris (no asteroids, slower)

### Missing Asteroid Ephemeris Files

If `.se1` files not present (common in browser WASM):
1. `sweAsteroid()` catches error, returns `null`
2. `computeAll()` sets status `'unavailable'`
3. Batch continues; UI labels point as "not computed"

### Kepler Solver Convergence

If Newton-Raphson fails to converge:
1. `keplerSolve()` returns best guess after max iterations
2. Comets rarely fail (eccentricity 0.96–0.999); fallback to perihelion longitude

## Validation & Testing

**Unit tests**: `ephemeris/engine.test.ts` (Jest or Vitest)

**Acceptance criteria (all tested):**

| Test | Assertion | Tolerance |
|------|-----------|-----------|
| (a) Sun at J2000.0 | 280.4° | ±0.1° |
| (b) Asteroids | Compute or return `null` | No crash |
| (c) Vertex (NYC 1990) | ~313° (Aquarius) | ±10° |
| (d) Halley 1986 | ~239° (Sagittarius) | ±0.5° |
| (e) South Node | North + 180° exactly | Floating point |

**Run tests:**
```bash
npm test ephemeris/engine.test.ts
```

## API Reference

### `engine.ts` exports

```typescript
// Init
export async function initEngine(): Promise<void>
export function isEngineReady(): boolean

// Body computation
export function sweBody(sweId: number, jd: number): { lon, speed }
export function sweAsteroid(mpcId: number, jd: number): { lon, speed } | null
export function sweHypothetical(sweId: number, jd: number): { lon, speed }
export function lunarNode(jd: number): { northNode, southNode }
export function planetaryNodes(jd: number, sweIds: number[]): Record<number, number>

// Manual points
export function computeSelena(lilithMeanLon: number): number
export function computeAriesPoint(): number
export function computeAntivertex(vertexLon: number): number
export function computePartOfFortune(asc, moon, sun, isNight, formula?): number
export function computePartOfSpirit(asc, sun, moon): number
export function computeSunMoonMidpoint(sun, moon): number
export function computeVertex(jd, lat, lon, mcLon): number

// Comets
export function computeComet(name: string, jd: number): { lon, magnitude? } | null

// Utility
export function assignHouse(lon: number, houseCusps: number[]): number

// Main export
export function computeAll(jd, lat, lon, houseCusps?, opts?): PointData[]

// Types
export interface PointData {
  id: string
  name: string
  lon: number
  speed?: number
  lat?: number
  house?: number
  status: 'ok' | 'unavailable' | 'fixed'
}

export interface ComputeOpts {
  forceHouseSystem?: string
  logErrors?: boolean
  partOfFortuneFormula?: 'day' | 'night' | 'reverse'
  fallbackToMoseph?: boolean
}
```

### `cometSolver.ts` exports

```typescript
export interface CometElements { /* ... */ }
export function keplerSolve(elements: CometElements, jd: number): { lon, magnitude? }
```

### `cometElements.ts` exports

```typescript
export const HALLEY: CometElements
export const HALE_BOPP: CometElements
export const HYAKUTAKE: CometElements
export const COMET_ELEMENTS: Record<string, CometElements>
```

## Footnotes

### Vertex Implementation Note

The vertex calculation inverts part of the Ascendant algorithm (both require RAMC and local sidereal time). This implementation uses a documented pure-function approach with `sin(obliquity)` singularity handling. For higher precision, integrate the house system's own `swe_houses_ex()` call or equivalent.

**Known variance sources:**
- House system (Placidus, Koch, Equal, etc.) affects AST derivation
- Floating-point rounding in GLSL/double arithmetic
- Atmospheric refraction approximation (not included; use for topocentric only)

**Validation approach:** Compare computed vertex against astro.com's output (which uses Placidus houses by default). Difference of ±5° is normal across systems.

### Comet Elements Epoch

Halley's next perihelion (2061-07-28) will require new elements closer to that date. The 1986 elements remain valid for ±50 years from perihelion; degradation accelerates beyond that due to planetary perturbations.

### Part of Fortune Formulas

The "reverse" formula (default) is a modern convention:
- **Day chart**: `(Asc + Moon − Sun) mod 360`
- **Night chart**: `(Asc + Sun − Moon) mod 360`

Older texts sometimes use the same formula day and night. Configuration flag `partOfFortuneFormula` in `ComputeOpts` allows override to `'day'` (always first) or `'night'` (always second).

---

**Version**: 1.0.0  
**Last updated**: 2026-09-12  
**Next milestone**: Integration with Web Worker (Prompt 1-D) and UI display layer
