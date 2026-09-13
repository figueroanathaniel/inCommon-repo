# Expand Chart Button & Overlay — Integration Guide

## Overview

The expand button (⛶) toggles a full-screen overlay showing the ExpandedChart component. The overlay is:
- **Portal-based** (fixed position, stacking context isolated)
- **Focus-trapped** (keyboard navigation within overlay only)
- **Scroll-locked** (body overflow hidden while open)
- **Persistent** (state saved to localStorage)
- **Responsive** (3-column desktop, tabbed mobile <900px, single column <375px)
- **Animated** (200ms ease-out scale/opacity, respects prefers-reduced-motion)

## Files

### 1. **ExpandChartOverlay.dc.html** (8.2 KB)
Complete overlay markup, styles, and inline JavaScript.

**Structure**:
```
Overlay (fixed, backdrop, z-index 9999)
├─ Close button (✕, top-right)
├─ Main container (3-column grid desktop / stacked mobile)
│  ├─ Left: House cusps panel
│  ├─ Center: Wheel SVG + controls
│  ├─ Right: Points table + search + group toggle
│  └─ Bottom (desktop) / Tabs (mobile): Aspects grid
├─ Focus trap (keyboard, Tab within overlay)
├─ Backdrop dismiss (click outside)
├─ Escape key handler
└─ Point tooltip (position: fixed)

Expand button (36px, top-right of chart card)
├─ aria-label="Expand chart"
├─ Icon: ⛶ (U+2B36, expand square)
└─ Hover state: purple tint
```

**Animations**:
- Fade in overlay: 200ms ease-out
- Scale container: 0.95→1.0, opacity 0→1
- Close: reverse order, 200ms each
- Respects `prefers-reduced-motion: reduce` (no animation)

**Layout Breakpoints**:
- **Desktop (>900px)**: 3-column (houses | wheel | table) + aspects bottom
- **Tablet (900px–375px)**: Stacked (wheel top, table/houses below), tabbed bottom
- **Mobile (<375px)**: Full width, all content scrollable, tabs below

## Integration Steps

### Step 1: Add Overlay to App DOM

Include the ExpandChartOverlay markup somewhere in the app root (inside `<div id="app">` but outside specific pages):

```html
<!-- In inCommonApp v2.dc.html, after main content, before closing div -->
<div id="app">
  <!-- Main app content -->
  ...

  <!-- Expand Chart Overlay Portal -->
  {{ if false }}{{ endif }}
  <!-- Include ExpandChartOverlay.dc.html here -->
</div>
```

Or include as a separate file:
```html
<div id="expand-overlay-root"></div>
<!-- Load ExpandChartOverlay.dc.html into that div -->
```

### Step 2: Add Expand Button to Chart Card Header

In the chart card header (the area showing "Chart for [Name]"), add the button:

```html
<div style="display:flex;align-items:center;justify-content:space-between">
  <div>Chart for {{ state.focusName }}</div>
  <div style="display:flex;gap:8px">
    <!-- Other buttons... -->
    <!-- Expand button (from ExpandChartOverlay.dc.html) -->
    <button
      id="expand-chart-button"
      aria-label="Expand chart"
      title="Maximize"
      onclick="window.__expandChart.open();"
      style="width:36px;height:36px;border:none;background:transparent;color:var(--ac2-hi);font:600 18px system-ui;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:all 120ms ease-out"
      onmouseover="this.style.background='rgba(139,92,246,0.15)'"
      onmouseout="this.style.background='transparent'"
    >⛶</button>
  </div>
</div>
```

### Step 3: Wire Methods into Component

In Component class, add these methods (call from expanded chart methods file):

```javascript
/**
 * Render expanded chart overlay (called after open())
 */
renderExpandedChartOverlay() {
  const housesList = document.getElementById('houses-list');
  const ring1 = this.expandedWheelPointsRing1();
  const ring2 = this.expandedWheelPointsRing2();
  const aspects = this.expandedWheelAspects();
  const houses = this.expandedWheelHouses();
  const signs = this.expandedWheelSigns();
  const cusps = this.expandedHouseCuspsList();

  // Render house cusps
  if (housesList) {
    housesList.innerHTML = cusps.map(c =>
      `<div style="font-size:10px;line-height:1.6">
        <strong>${c.h}</strong> ${c.sign} ${c.deg}°
      </div>`
    ).join('');
  }

  // Render wheel SVG
  const svg = document.querySelector('#expand-chart-overlay svg');
  if (svg) {
    // Clear and re-render (or update via D3/React)
    // For now, delegate to existing wheel render logic
    this.renderWheelSVG(svg, ring1, ring2, aspects, houses, signs);
  }

  // Render points table
  const tbody = document.getElementById('expand-points-table-body');
  if (tbody) {
    const filtered = this.filterExpandedPoints();
    if (this.state.groupByCategory) {
      const grouped = this.expandedPointsGrouped();
      tbody.innerHTML = grouped.map(group =>
        `<tr style="height:24px;background:${group.catColor};opacity:.1;border-top:1px solid var(--bd)">
          <td colSpan="7" style="padding:4px 6px;font-weight:600;color:var(--ac2-hi);font-size:9px;text-transform:uppercase">
            ${group.category}
          </td>
        </tr>` +
        group.points.map(p => this.renderPointRow(p)).join('')
      ).join('');
    } else {
      tbody.innerHTML = filtered.map(p => this.renderPointRow(p)).join('');
    }
  }

  // Update point count
  const countEl = document.getElementById('expand-point-count');
  if (countEl) {
    const total = this.expandedChartData().length;
    countEl.textContent = total + ' points';
  }
}

/**
 * Render wheel SVG (integrate with existing wheel renderer)
 */
renderWheelSVG(svg, ring1, ring2, aspects, houses, signs) {
  // This is a placeholder; integrate with existing SVG rendering
  // Strategy: Use D3 / React / native DOM to update the SVG
  // For now, assume the template SVG is pre-rendered and static
  // Update on state changes as needed
}

/**
 * Wire expand/close to state (optional; keep in ExpandChartOverlay.dc.html)
 */
openExpandedChart() {
  window.__expandChart.open?.();
}

closeExpandedChart() {
  window.__expandChart.close?.();
}
```

### Step 4: Delegate Event Handlers

The overlay's inline JavaScript calls these Component methods:

```javascript
// From expandedChartMethods.js, already defined:
window.__incommonApp.toggleCometDisplay();
window.__incommonApp.toggleMinorAspects();
window.__incommonApp.filterPointsTable(term);
window.__incommonApp.toggleGroupByCategory();
window.__incommonApp.sortPointsTable(field);
```

Ensure `window.__incommonApp` is set to the Component instance:

```javascript
// In Component constructor or componentDidMount:
window.__incommonApp = this;
```

### Step 5: Initialize on Load

In `componentDidMount()`:

```javascript
componentDidMount() {
  // ... existing code ...

  // Wire expand chart overlay
  const button = document.getElementById('expand-chart-button');
  if (button) {
    button.onclick = () => this.openExpandedChart?.();
  }

  // Restore expanded state from localStorage
  if (localStorage.getItem('chart.expanded') === '1') {
    setTimeout(() => this.openExpandedChart?.(), 100);
  }
}
```

## State Management

### localStorage Key

```javascript
localStorage.getItem('chart.expanded') // '1' | '0' | null
```

- `'1'` — overlay should be open
- `'0'` — overlay is closed
- `null` — never opened (default)

**Persistence**: Survives page reload and browser restart.

### Focus Management

```javascript
window.__expandChartState = {
  isOpen: boolean,
  focusedElement: Element,  // Saved before open, restored on close
  originalOverflow: string   // document.body.style.overflow backup
}
```

**Focus Trap**: Tab/Shift+Tab cycles within overlay; Escape closes and returns focus to expand button.

### Scroll Lock

```javascript
// On open:
window.__expandChartState.originalOverflow = document.body.style.overflow;
document.body.style.overflow = 'hidden';

// On close:
document.body.style.overflow = window.__expandChartState.originalOverflow;
```

## Styling Notes

### Theme Tokens Used

- `--bg`: Page background
- `--sf`: Surface (cards)
- `--bd`: Border color
- `--tx`: Text color
- `--dim`: Dimmed text
- `--ac2-hi`: Purple text (accent)
- `--chl`: Chart line color

All inherited from app theme; overlay respects dark mode automatically.

### Animations

**Respects `prefers-reduced-motion`**:
```css
@media (prefers-reduced-motion: reduce) {
  #expand-chart-overlay,
  #expand-chart-container {
    animation: none !important;
  }
}
```

If reduced motion is on, overlay appears instantly (no fade, no scale).

### Z-Index Stack

```
Overlay backdrop:     z-index 9999
Close button:         z-index 10000
Point tooltip:        z-index 10001
```

All sit above app content (typically z-index <1000).

## Responsive Breakpoints

### Desktop (>900px)

```
[Houses] [WHEEL] [Points]
[Houses] [WHEEL] [Aspects]
```

- Left panel: 140px fixed
- Center: 1fr (flexible)
- Right panel: 320px fixed
- Bottom: auto height, scrollable

### Tablet (900px–375px)

```
[WHEEL]
[Points / Aspects / Houses tabs]
```

- Wheel: full width, max 50vh height
- Tabs: Points | Aspects | Houses (one visible at a time)
- Panels stack vertically, scrollable

### Mobile (<375px)

```
[WHEEL] (scrollable, max height)
[Tabs]  (single-row tabs, scrollable content below)
```

- Wheel smaller, pinch-zoom enabled
- Tabs stacked horizontally at bottom
- All text 8–10px (readable, no overflow)

## Testing Checklist

### Functional

- [ ] Click ⛶ button → overlay opens
- [ ] Click ✕ button → overlay closes, focus returns to ⛶
- [ ] Press Escape → overlay closes
- [ ] Click backdrop (not on container) → overlay closes
- [ ] Tab/Shift+Tab within overlay → focus cycles, never leaves overlay
- [ ] Table sorting: click column header → re-sort ascending/descending
- [ ] Search input: type → live filter by point name
- [ ] Group checkbox: toggle → table groups/ungroups by category
- [ ] Show comets checkbox: toggle → wheel updates
- [ ] Show minor aspects checkbox: toggle → wheel updates
- [ ] Details/summary: click → expands/collapses category subtable

### Persistence

- [ ] Open overlay → refresh page → overlay still open
- [ ] Close overlay → refresh page → overlay still closed
- [ ] Open overlay in tab 1, close in tab 2 → both tabs independent (no cross-tab state)

### Responsive

- [ ] Desktop (1024px): 3-column layout renders
- [ ] Tablet (800px): stacked layout with tabs
- [ ] Mobile (375px): single column, tabs at bottom
- [ ] Pinch-zoom on mobile wheel: SVG scales, overlay remains fixed
- [ ] Reduce motion: no animation on open/close

### Accessibility

- [ ] Expand button: keyboard focusable (Tab), clickable (Enter/Space)
- [ ] Close button: keyboard focusable, clickable
- [ ] Escape key: closes overlay
- [ ] Focus trap: Tab never leaves overlay while open
- [ ] aria-label on overlay and buttons: screen reader reads correctly
- [ ] Overlay role="dialog" aria-modal="true"
- [ ] Backdrop dismissal: not announced (inert)

### Performance

- [ ] Overlay opens in <300ms
- [ ] Table filters live, no lag
- [ ] Sorting stable, <100ms per re-sort
- [ ] Wheel SVG renders once on open, updates on toggle only
- [ ] No memory leaks (close and reopen 3x → no growth)

### Visual

- [ ] Overlay backdrop: darkens background (55% black opacity)
- [ ] Overlay container: rounded corners (12px desktop, 8px mobile)
- [ ] Close button: ✕ character, purple on hover
- [ ] Expand button: ⛶ character, small rounded background
- [ ] Points table: alternating row hover (light purple)
- [ ] Category colors: distinct, readable against background
- [ ] Glyphs: bold in Ring 1, small in Ring 2

## Known Limitations

- **localStorage**: Single device, single profile. Multi-tab state is independent (each tab has its own state).
- **Focus trap**: Requires interactive elements in overlay; empty overlay has no focus target.
- **Animations**: 200ms is fixed; not configurable per theme or device.
- **Mobile**: Tabs are functional but minimal; full responsive design would benefit from more UX polish.

## File Structure

```
app/
├─ inCommonApp v2.dc.html           (main app, add expand button)
├─ ExpandChartOverlay.dc.html       (overlay template + inline JS)
├─ components/
│  └─ ExpandedChart.dc.html         (content component, from Prompt 5)
├─ expandedChartMethods.js           (28 methods, integrate into Component)
├─ EXPAND-BUTTON-INTEGRATION.md     (this file)
└─ EXPANDED-CHART-COMPLETE.md       (Prompt 5 summary)
```

## Next Steps

1. Include ExpandChartOverlay.dc.html in app DOM
2. Add expand button to chart card header
3. Set `window.__incommonApp = this` in Component
4. Call `renderExpandedChartOverlay()` after overlay opens
5. Test all functional and responsive cases
6. Measure performance (target: <300ms open time)

---

**Version**: 1.0.0  
**Status**: Ready for integration  
**Depends on**: ExpandedChart.dc.html (Prompt 5), expandedChartMethods.js (Prompt 5)
