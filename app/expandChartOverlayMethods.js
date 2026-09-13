/*! expandChartOverlayMethods.js
 * Wire ExpandChartOverlay into Component class
 * Add these methods to the main Component class in inCommonApp v2.dc.html
 */

// ============================================================================
// OVERLAY LIFECYCLE
// ============================================================================

/**
 * Open the expanded chart overlay
 * - Save current focus
 * - Lock body scroll
 * - Load state from localStorage
 * - Render content
 */
openExpandedChart() {
  const overlay = document.getElementById('expand-chart-overlay');
  if (!overlay) {
    console.warn('[ExpandChart] Overlay element not found in DOM');
    return;
  }

  // Save focus and scroll state
  if (!window.__expandChartState) {
    window.__expandChartState = {
      isOpen: false,
      focusedElement: null,
      originalOverflow: 'auto'
    };
  }

  window.__expandChartState.focusedElement = document.activeElement;
  window.__expandChartState.originalOverflow = document.body.style.overflow;

  // Show overlay
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Save state to localStorage
  localStorage.setItem('chart.expanded', '1');

  window.__expandChartState.isOpen = true;

  // Render expanded chart content
  this.renderExpandedChartOverlay();

  // Log timing
  if (this.log) this.log('ExpandChart overlay opened');
}

/**
 * Close the expanded chart overlay
 * - Fade out
 * - Restore scroll
 * - Restore focus
 * - Update localStorage
 */
closeExpandedChart() {
  const overlay = document.getElementById('expand-chart-overlay');
  const container = document.getElementById('expand-chart-container');

  if (!overlay) return;

  // Trigger close animation
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isReducedMotion) {
    container.style.animation = 'expandContainerScaleOut 200ms ease-out forwards';
    overlay.style.animation = 'expandOverlayFadeOut 200ms ease-out forwards';

    // Wait for animation to complete
    setTimeout(() => this.completeOverlayClose(), 200);
  } else {
    this.completeOverlayClose();
  }
}

/**
 * Complete overlay close (after animation)
 */
completeOverlayClose() {
  const overlay = document.getElementById('expand-chart-overlay');
  const container = document.getElementById('expand-chart-container');

  if (!overlay) return;

  overlay.style.display = 'none';
  overlay.style.animation = 'expandOverlayFadeIn 200ms ease-out forwards';
  container.style.animation = 'expandContainerScale 200ms ease-out forwards';

  // Restore scroll
  if (window.__expandChartState) {
    document.body.style.overflow = window.__expandChartState.originalOverflow;

    // Restore focus
    const focusEl = window.__expandChartState.focusedElement;
    if (focusEl && document.contains(focusEl)) {
      focusEl.focus();
    } else {
      const button = document.getElementById('expand-chart-button');
      if (button) button.focus();
    }

    window.__expandChartState.isOpen = false;
  }

  // Update localStorage
  localStorage.setItem('chart.expanded', '0');

  if (this.log) this.log('ExpandChart overlay closed');
}

// ============================================================================
// OVERLAY RENDERING
// ============================================================================

/**
 * Render all expanded chart content into overlay
 * - House cusps (left panel)
 * - Wheel SVG (center)
 * - Points table (right panel)
 * - Aspects grid (bottom, desktop only)
 */
renderExpandedChartOverlay() {
  // Render house cusps
  this.renderExpandHouseCusps();

  // Render wheel
  this.renderExpandWheel();

  // Render points table
  this.renderExpandPointsTable();

  // Update point count
  this.updateExpandPointCount();

  // Log performance
  console.log('[ExpandChart] Overlay rendered');
}

/**
 * Render house cusps in left panel
 */
renderExpandHouseCusps() {
  const housesList = document.getElementById('houses-list');
  if (!housesList) return;

  const cusps = this.expandedHouseCuspsList?.();
  if (!cusps || cusps.length === 0) return;

  housesList.innerHTML = cusps.map(c => `
    <div style="
      font-size:10px;
      line-height:1.8;
      padding:4px 0;
      border-bottom:1px solid var(--bd);
      display:flex;
      justify-content:space-between;
      align-items:center;
    ">
      <strong>${c.h}</strong>
      <span style="opacity:.7">${c.sign}</span>
      <span>${c.deg}°${c.min}′</span>
    </div>
  `).join('');
}

/**
 * Render wheel SVG in center panel
 */
renderExpandWheel() {
  const svg = document.querySelector('#expand-chart-overlay svg');
  if (!svg) return;

  const ring1 = this.expandedWheelPointsRing1?.();
  const ring2 = this.expandedWheelPointsRing2?.();
  const aspects = this.expandedWheelAspects?.();
  const houses = this.expandedWheelHouses?.();
  const signs = this.expandedWheelSigns?.();

  if (!ring1 || !ring2) return;

  // Clear existing content (except outer circle)
  const existingPoints = svg.querySelectorAll('[data-point-ring]');
  existingPoints.forEach(el => el.remove());

  const existingAspects = svg.querySelectorAll('[data-aspect]');
  existingAspects.forEach(el => el.remove());

  // Render zodiac signs (outer ring)
  signs?.forEach((s, i) => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', s.gx);
    text.setAttribute('y', s.gy);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('style', `font:600 12px Georgia,serif;fill:${s.c};opacity:.7`);
    text.textContent = s.glyph;
    svg.appendChild(text);
  });

  // Render house lines
  houses?.forEach((h, i) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', h.x1);
    line.setAttribute('y1', h.y1);
    line.setAttribute('x2', h.x2);
    line.setAttribute('y2', h.y2);
    line.setAttribute('stroke', h.c);
    line.setAttribute('stroke-width', h.w);
    line.setAttribute('opacity', '.4');
    svg.appendChild(line);

    // House number label
    const num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    num.setAttribute('x', h.nx);
    num.setAttribute('y', h.ny);
    num.setAttribute('text-anchor', 'middle');
    num.setAttribute('dominant-baseline', 'middle');
    num.setAttribute('style', 'font:400 9px var(--fu);fill:var(--dim);opacity:.6');
    num.textContent = h.n;
    svg.appendChild(num);
  });

  // Render aspect lines
  aspects?.forEach((a, i) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x1);
    line.setAttribute('y1', a.y1);
    line.setAttribute('x2', a.x2);
    line.setAttribute('y2', a.y2);
    line.setAttribute('stroke', a.stroke);
    line.setAttribute('stroke-dasharray', a.dash);
    line.setAttribute('stroke-width', a.w);
    line.setAttribute('opacity', a.op);
    line.setAttribute('data-aspect', '1');
    line.setAttribute('pointer-events', 'none');
    svg.appendChild(line);
  });

  // Render Ring 1 (inner, bold glyphs)
  ring1?.forEach((p, i) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-point-ring', '1');

    // Circle background
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', p.r);
    circle.setAttribute('fill', p.bg);
    circle.setAttribute('stroke', p.c);
    circle.setAttribute('stroke-width', p.sw);
    circle.setAttribute('opacity', p.op);
    circle.style.cursor = 'pointer';
    g.appendChild(circle);

    // Glyph text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', p.x);
    text.setAttribute('y', p.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('style', `font:${p.f};fill:${p.c};pointer-events:none`);
    text.textContent = p.glyph;
    g.appendChild(text);

    // Degree label
    const deg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    deg.setAttribute('x', p.dx);
    deg.setAttribute('y', p.dy);
    deg.setAttribute('text-anchor', 'middle');
    deg.setAttribute('dominant-baseline', 'middle');
    deg.setAttribute('style', 'font:400 9px var(--fu);fill:var(--dim);opacity:.6;pointer-events:none');
    deg.textContent = p.degLabel;
    g.appendChild(deg);

    // Hover tooltip
    g.addEventListener('mouseenter', (e) => {
      this.showExpandPointTooltip?.({
        name: p.name,
        glyph: p.glyph,
        lon: p.x, // Approximation; use actual degree
        id: p.id
      }, e.clientX, e.clientY);
    });

    g.addEventListener('mouseleave', () => {
      this.hideExpandPointTooltip?.();
    });

    svg.appendChild(g);
  });

  // Render Ring 2 (outer, small glyphs)
  ring2?.forEach((p, i) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-point-ring', '2');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', p.r);
    circle.setAttribute('fill', p.bg);
    circle.setAttribute('stroke', p.c);
    circle.setAttribute('stroke-width', p.sw);
    circle.setAttribute('opacity', p.op);
    circle.style.cursor = 'pointer';
    g.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', p.x);
    text.setAttribute('y', p.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('style', `font:${p.f};fill:${p.c};opacity:.7;pointer-events:none`);
    text.textContent = p.glyph;
    g.appendChild(text);

    g.addEventListener('mouseenter', (e) => {
      this.showExpandPointTooltip?.({
        name: p.name,
        glyph: p.glyph,
        lon: p.x,
        id: p.id
      }, e.clientX, e.clientY);
    });

    g.addEventListener('mouseleave', () => {
      this.hideExpandPointTooltip?.();
    });

    svg.appendChild(g);
  });
}

/**
 * Render points table in right panel
 */
renderExpandPointsTable() {
  const tbody = document.getElementById('expand-points-table-body');
  if (!tbody) return;

  let rows = '';

  if (this.state?.groupByCategory) {
    const grouped = this.expandedPointsGrouped?.();
    if (grouped) {
      grouped.forEach(group => {
        rows += `
          <tr style="height:24px;background:${group.catColor};opacity:.1;border-top:1px solid var(--bd)">
            <td colSpan="7" style="padding:4px 6px;font-weight:600;color:var(--ac2-hi);font-size:9px;text-transform:uppercase">
              ${group.category}
            </td>
          </tr>
        `;
        group.points.forEach(p => {
          rows += this.renderPointRow?.(p) || '';
        });
      });
    }
  } else {
    const filtered = this.filterExpandedPoints?.();
    if (filtered) {
      filtered.forEach(p => {
        rows += this.renderPointRow?.(p) || '';
      });
    }
  }

  tbody.innerHTML = rows;
}

/**
 * Update point count display
 */
updateExpandPointCount() {
  const countEl = document.getElementById('expand-point-count');
  if (!countEl) return;

  const data = this.expandedChartData?.();
  const count = data?.length || 0;
  countEl.textContent = count + ' points';
}

// ============================================================================
// OVERLAY TOOLTIPS
// ============================================================================

/**
 * Show point tooltip in overlay
 */
showExpandPointTooltip(point, clientX, clientY) {
  const tooltip = document.getElementById('expand-point-tooltip');
  const content = document.getElementById('expand-tooltip-content');

  if (!tooltip || !content) return;

  const symbolism = this.SYMBOLISM?.[point.id] || { archetype: '', practical: '' };

  // Build tooltip safely
  content.innerHTML = '';

  const title = document.createElement('strong');
  title.textContent = point.name + ' ' + point.glyph;
  content.appendChild(title);

  const br1 = document.createElement('br');
  content.appendChild(br1);

  const lon = document.createElement('span');
  lon.style.cssText = 'color:var(--ac-hi);opacity:.8';
  lon.textContent = Math.floor(point.lon) + '°';
  content.appendChild(lon);

  const br2 = document.createElement('br');
  content.appendChild(br2);

  const arch = document.createElement('span');
  arch.style.cssText = 'opacity:.8;margin-top:4px;display:block;font-size:9px';
  arch.textContent = symbolism.archetype || '';
  content.appendChild(arch);

  const prac = document.createElement('span');
  prac.style.cssText = 'opacity:.7;display:block;font-size:9px;color:var(--ac-hi)';
  prac.textContent = symbolism.practical || '';
  content.appendChild(prac);

  tooltip.style.left = (clientX + 10) + 'px';
  tooltip.style.top = (clientY + 10) + 'px';
  tooltip.style.display = 'block';
}

/**
 * Hide point tooltip in overlay
 */
hideExpandPointTooltip() {
  const tooltip = document.getElementById('expand-point-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

// ============================================================================
// MOBILE TAB SWITCHING
// ============================================================================

/**
 * Switch mobile tab (points, aspects, houses)
 */
switchExpandMobileTab(tabName) {
  const buttons = document.querySelectorAll('#expand-chart-overlay button[data-tab-button]');
  const container = document.getElementById('expand-mobile-tabs');

  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tabButton === tabName);
  });

  if (container) container.dataset.tab = tabName;

  const content = document.getElementById('expand-mobile-content');
  if (!content) return;

  if (tabName === 'points') {
    this.renderExpandPointsTable();
    content.innerHTML = document.getElementById('expand-points-table-body')?.innerHTML || '';
  } else if (tabName === 'aspects') {
    content.innerHTML = '<p style="padding:8px;color:var(--dim)">Aspects grid (scrollable)</p>';
  } else if (tabName === 'houses') {
    this.renderExpandHouseCusps();
    content.innerHTML = document.getElementById('houses-list')?.innerHTML || '';
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize expand chart on page load
 * Call from componentDidMount()
 */
initExpandChartOverlay() {
  // Wire expand button
  const button = document.getElementById('expand-chart-button');
  if (button) {
    button.onclick = () => this.openExpandedChart?.();
  }

  // Wire close button and escape handler
  const closeBtn = document.getElementById('expand-chart-close');
  if (closeBtn) {
    closeBtn.onclick = () => this.closeExpandedChart?.();
  }

  const overlay = document.getElementById('expand-chart-overlay');
  if (overlay) {
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeExpandedChart?.();
    };
    overlay.onkeydown = (e) => {
      if (e.key === 'Escape') this.closeExpandedChart?.();
    };
  }

  // Restore from localStorage
  if (localStorage.getItem('chart.expanded') === '1') {
    setTimeout(() => this.openExpandedChart?.(), 100);
  }

  // Set global reference
  window.__incommonApp = this;
}
