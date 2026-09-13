# ExpandedChart Component Integration Guide

## Overview

The ExpandedChart component renders 80+ astrological points across two rings with supporting panels: house cusps (left), sortable points table (right), and full aspects grid. It wraps the existing wheel renderer and extends it for the expanded view mode.

## Architecture

```
State Machine:
  chartMode: 'basic' | 'expanded'
  
  ├─ Basic (11 points + 4 angles)
  │  └─ wheelPlanets: Sun, Moon, 8 planets, both nodes
  │  └─ wheelAngles: ASC, MC, IC, DC (axis cross)
  │
  └─ Expanded (80+ points)
     ├─ wheelPointsRing1 (18): planets + Chiron + Ceres/Pallas/Juno/Vesta + Lilith + Selena
     ├─ wheelPointsRing2 (62+): remaining asteroids, centaurs, TNOs, nodes, hypotheticals, derived
     ├─ expandedWheelAspects: all pairwise contacts (minor points 50% orb)
     ├─ houseCuspsList: 12 cusps with sign/degree
     ├─ pointsTableFiltered: searchable, sortable by name/lon/house/speed/category
     └─ groupByCategory: toggle grouped vs. flat view
```

## Key Features

### 1. Two-Ring Wheel Layout

**Ring 1 (Inner, Bold)** — radius ~270–280px:
- Sun (276px)
- Moon (280px)
- Mercury–Pluto (271–275px staggered)
- North Node, South Node
- Chiron (273px)
- Ceres, Pallas, Juno, Vesta (272px cluster)
- Lilith Mean (274px)
- Selena (275px)

**Ring 2 (Outer, Smaller)** — radius ~240–250px:
- All other asteroids (242–244px)
- Centaurs (246–248px)
- TNOs (248–250px)
- Hypothetical TNPs (242px)
- Lunar nodes (daily, if computed)
- Derived points: Vertex, Antivertex, POF, POS, Sun/Moon midpoint (240–245px)
- Comets (hidden by default, visible if `showComets = true`)

### 2. Category Color Coding

Each point carries a `category` from the registry:
- **asteroid**: `--cat-asteroid` (#d4a574 amber)
- **centaur**: `--cat-centaur` (#4a9d83 teal)
- **tno**: `--cat-tno` (#8b5cf6 violet)
- **node/hypothetical/derived**: `--cat-node` (#6b7280 gray)
- **comet**: `--cat-comet` (#f97316 orange)

Colors are theme-aware and transition smoothly via CSS variables. Point circles use stroke=`var(${catColor})`, opacity varies by ring.

### 3. Symbolism Tooltips

Hover on any wheel point reveals:
```
<strong>Point Name</strong> Glyph
<span class="ac-hi">00° Sign</span>
<span class="archetype">Traditional symbolism (≤60 chars)</span>
<span class="practical">Modern application (≤60 chars)</span>
```

Tooltips are rendered via shared PointTooltip component, positioned near cursor, auto-clamped to viewport.

### 4. Sortable Points Table

**Columns**: Point | Glyph | Position | House | Speed | R | Status

**Sorting**: Click header to toggle ASC/DESC on that column:
- **name**: alphabetical
- **lon**: 0–360°
- **house**: 1–12
- **speed**: degrees/day (retrograde first)
- **category**: alphabetical (toggleable)

**Filtering**:
- Search box filters by point name (real-time)
- **Group by category** checkbox toggles grouped view with collapsible category sections

**Status field**:
- `'ok'` — computed from ephemeris (green text, `#2fff8f`)
- `'unavailable'` — no ephemeris file (gray text, `--dim`), labeled "n/a — no ephemeris"
- `'fixed'` — manually derived (blue text, `--blue`)

### 5. House Cusp Panel (Left)

Displays all 12 house cusps:
```
Houses (heading)
─────────────────
I     0° Aries
II    30° Taurus
...
XII   330° Pisces
```

Each row: house number, sign glyph, degree (0–29), minute (0–59).

### 6. Expanded Aspects

Computed via `computeAll()` + `natalAspects()` with **50% orb scaling for minor points**:

- **Major points** (Sun–Pluto, Chiron): standard orbs (6–8°)
- **Minor points** (asteroids, TNOs, etc.): 50% orb
- **Aspect types**: conjunction (0°), sextile (60°), square (90°), trine (120°), opposition (180°), plus minor aspects (30°, 45°, 135°, 150°)

Lines drawn on wheel with:
- Stroke color per aspect type
- Dasharray per aspect (tight for major, sparse for minor)
- Opacity 0.32 (fades behind planets)

### 7. Comets Toggle

By default, comets are **NOT** rendered on the wheel (hidden in Ring 2).
- Checkbox "Show comets" toggles `state.showCometsOnWheel`
- When enabled, Halley/Hale-Bopp/Hyakutake render in Ring 2 at fixed radii
- Always shown in right-panel subtable regardless of toggle
- Label: "Mundane only" on every comet row

### 8. Minor Aspects Toggle

Checkbox "Minor aspects" toggles `state.showMinorAspects`:
- OFF: show only major aspects (0°, 60°, 90°, 120°, 180°)
- ON: show all 9 aspect types
- Defaults to ON

## Implementation Sections

### State Properties

```javascript
// In Component state:
chartMode: 'basic' | 'expanded',
showCometsOnWheel: false,
showMinorAspects: true,
groupByCategory: true,
pointsSearchTerm: '',
pointsSortBy: 'name',
pointsSortDir: 'asc',

// Computed:
expandedPointsFiltered: PointData[],
expandedPointsGrouped: { category: string, points: PointData[] }[],
expandedWheelPointsRing1: WheelGlyph[],
expandedWheelPointsRing2: WheelGlyph[],
expandedWheelAspects: WheelAspect[],
expandedWheelHouses: WheelHouse[],
expandedWheelSigns: WheelSign[]
```

### Computed Methods

1. **`expandedChartData()`** — calls `computeAll(jd, lat, lon, houseCusps)` and caches result
2. **`expandedPointsFiltered()`** — filters by search term
3. **`expandedPointsGrouped()`** — groups by category if toggled
4. **`expandedWheelPointsRing1()`** — 18 points with bold glyphs (14px)
5. **`expandedWheelPointsRing2()`** — 62+ points with small glyphs (10px)
6. **`expandedWheelAspects()`** — all pairwise contacts (up to 150 lines)
7. **`expandedWheelHouses()`** — 12 house division lines
8. **`expandedHouseCuspsList()`** — house cusp data for left panel
9. **`expandedWheelSigns()`** — zodiac sign positions for outer ring

### Event Handlers

```javascript
toggleCometDisplay() {
  this.setState({ showCometsOnWheel: !this.state.showCometsOnWheel });
  // Re-render expandedWheelPointsRing2
}

toggleMinorAspects() {
  this.setState({ showMinorAspects: !this.state.showMinorAspects });
  // Re-filter expandedWheelAspects
}

filterExpandedPoints(searchTerm) {
  this.setState({ pointsSearchTerm: searchTerm.toLowerCase() });
  // Re-compute expandedPointsFiltered
}

toggleGroupByCategory() {
  this.setState({ groupByCategory: !this.state.groupByCategory });
}

sortTable(field) {
  const newDir = this.state.pointsSortBy === field 
    ? (this.state.pointsSortDir === 'asc' ? 'desc' : 'asc')
    : 'asc';
  this.setState({ pointsSortBy: field, pointsSortDir: newDir });
  // Re-sort expandedPointsFiltered
}

showPointTooltip(point, x, y) {
  const tooltip = document.getElementById('point-tooltip');
  const symbolism = this.SYMBOLISM[point.id] || { archetype: '', practical: '' };
  tooltip.innerHTML = `
    <strong>${point.name}</strong> ${point.glyph}<br/>
    <span style="color:var(--ac-hi)">${Math.floor(point.lon)}° ${point.sign}</span><br/>
    <span class="archetype">${symbolism.archetype}</span><br/>
    <span class="practical">${symbolism.practical}</span>
  `;
  tooltip.style.left = x + 'px';
  tooltip.style.top = (y - 80) + 'px';
  tooltip.style.display = 'block';
}

hidePointTooltip() {
  document.getElementById('point-tooltip').style.display = 'none';
}

openPoint(pointName) {
  // Open detail panel for point (future: shows full ephemeris, aspects grid for this point)
}
```

### Performance Optimization

- **Computation**: Run `computeAll()` in Web Worker, return results via `postMessage()`
- **Memoization**: Cache wheel data by `rounded(jd)|lat|lon` key
- **Rendering**: Use `React.memo()` for wheel SVG and table rows
- **Partial updates**: Only re-render points/aspects/table affected by state change
- **Target**: ≤150ms from data arrival to full render

## Integration Checklist

- [ ] Add `ExpandableChart` component wrapper with mode="expanded" prop
- [ ] Implement all computed methods above
- [ ] Wire event handlers to state updates
- [ ] Add category color tokens to CSS (already in ExpandedChart.dc.html)
- [ ] Test wheel rendering: Ring 1 bold, Ring 2 small, no overlap
- [ ] Test table sorting: all 7 columns sortable, stable sort
- [ ] Test filtering: search box live, group toggle works
- [ ] Test tooltips: hover reveals symbolism, 2-second delay before show
- [ ] Test aspects: major lines bright, minor lines faint, ≤150 total
- [ ] Test comets: hidden by default, show/hide toggle works, always in table
- [ ] Test house cusps: all 12 shown with sign and degree
- [ ] Measure render time: log to console, target ≤150ms
- [ ] Test responsiveness: table scrolls independently, wheel scales to fit
- [ ] Test dark mode: category colors respect theme

## Files Modified

- `app/inCommonApp v2.dc.html` — add expanded chart methods + state
- `app/components/ExpandedChart.dc.html` — component template (created)
- `ephemeris/pointRegistry.ts` — point definitions (already created)
- `ephemeris/engine.ts` — computation engine (already created)

## Testing

Unit tests: `handoff/tests-v6.0.js` (group E, rows E7–E12)
- E7: 80+ points render without crash
- E8: Ring 1 glyphs bold (14px), Ring 2 small (10px)
- E9: Category colors applied correctly
- E10: Table sortable all 7 columns
- E11: Search filter live, groups toggle
- E12: Tooltips appear on hover, comets toggle works, render ≤150ms

---

**Version**: 1.0.0  
**Status**: Implementation ready  
**Next step**: Wire component into main app, test acceptance criteria
