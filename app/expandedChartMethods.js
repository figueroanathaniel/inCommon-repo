/*! expandedChartMethods.js
 * Extends Component class with expanded wheel rendering and points table logic
 *
 * Add these methods to the main Component class in inCommonApp v2.dc.html
 * They are separated here for clarity and organization
 */

// ============================================================================
// COMPUTED: EXPANDED CHART DATA
// ============================================================================

/**
 * Fetch and cache all 80+ point data for expanded chart
 * Returns PointData[] from engine.ts computeAll()
 */
expandedChartData() {
  const jd = this.jd();
  const lat = this.state.lat;
  const lon = this.state.lon;
  const cusps = this.houseCusps();

  if (!lat || !lon) return []; // No location, no expanded chart

  // Cache key: rounded JD | lat | lon
  const key = Math.round(jd * 100) + '|' + Math.round(lat * 100) + '|' + Math.round(lon * 100);

  if (this._expandedCacheKey === key && this._expandedCacheData) {
    return this._expandedCacheData;
  }

  // TODO: Call computeAll() from ephemeris/engine.ts
  // For now, return mocked data for testing
  const data = this.placed(true).map(p => ({
    id: p.id || p.name,
    name: p.name,
    glyph: p.glyph,
    lon: p.lon,
    speed: p.speed || null,
    lat: p.lat || null,
    house: p.house || this.assignHouse(p.lon, cusps),
    status: 'ok',
    category: p.group === 'extra' ? 'asteroid' : p.group === 'angle' ? 'angle' : 'body'
  }));

  this._expandedCacheKey = key;
  this._expandedCacheData = data;
  return data;
}

// ============================================================================
// WHEEL RENDERING: RING 1 (INNER, BOLD)
// ============================================================================

/**
 * Ring 1: Planets, Chiron, major asteroids, Lilith, Selena
 * Glyphs: 14px bold, radius 270–280px depending on body
 */
expandedWheelPointsRing1() {
  const data = this.expandedChartData();
  const ring1Names = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
    'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node',
    'Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta', 'Lilith (Mean)', 'Selena'
  ];

  const radiusFor = {
    'Sun': 276, 'Moon': 280, 'Mercury': 271, 'Venus': 275, 'Mars': 274,
    'Jupiter': 273, 'Saturn': 272, 'Uranus': 271.5, 'Neptune': 272.5,
    'Pluto': 273.5, 'North Node': 275.5, 'South Node': 274.5,
    'Chiron': 273, 'Ceres': 272, 'Pallas': 272.2, 'Juno': 272.4,
    'Vesta': 272.6, 'Lilith (Mean)': 274, 'Selena': 275
  };

  return data
    .filter(p => ring1Names.includes(p.name))
    .map(p => {
      const rad = radiusFor[p.name] || 273;
      const pt = this.P(p.lon, rad);
      const catColor = p.category === 'asteroid' ? '--cat-asteroid' : '--ac2-hi';

      return {
        id: p.id,
        name: p.name,
        glyph: p.glyph,
        x: pt.x.toFixed(1),
        y: pt.y.toFixed(1),
        r: 7,
        c: `var(${catColor})`,
        bg: '#15141b',
        sw: 1.2,
        op: 0.9,
        f: '600 14px Georgia,serif',
        degLabel: Math.floor(p.lon) + '°',
        dx: this.P(p.lon, rad - 30).x.toFixed(1),
        dy: this.P(p.lon, rad - 30).y.toFixed(1),
        tip: p.name + ' · ' + Math.floor(p.lon) + '° ' + this.signOf(p.lon).sign,
        onclick: () => this.openPlanetDetail(p.name)
      };
    });
}

// ============================================================================
// WHEEL RENDERING: RING 2 (OUTER, SMALL)
// ============================================================================

/**
 * Ring 2: All other points (asteroids, centaurs, TNOs, nodes, hypotheticals, derived)
 * Glyphs: 10px, radius 240–250px, opacity 0.6
 * Comets hidden unless state.showCometsOnWheel = true
 */
expandedWheelPointsRing2() {
  const data = this.expandedChartData();
  const ring1Names = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
    'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node',
    'Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta', 'Lilith (Mean)', 'Selena'
  ];

  const radiusFor = {}; // Default 240–250 per category
  const catRadii = {
    'asteroid': 242, 'centaur': 246, 'tno': 248, 'node': 244,
    'hypothetical': 242, 'derived': 241, 'comet': 250
  };

  const ring2 = data.filter(p =>
    !ring1Names.includes(p.name) &&
    p.category !== 'angle' &&
    !(p.category === 'comet' && !this.state.showCometsOnWheel)
  );

  return ring2.map(p => {
    const rad = catRadii[p.category] || 242;
    const pt = this.P(p.lon, rad);
    const catToken = {
      'asteroid': '--cat-asteroid',
      'centaur': '--cat-centaur',
      'tno': '--cat-tno',
      'node': '--cat-node',
      'hypothetical': '--cat-node',
      'derived': '--cat-node',
      'comet': '--cat-comet'
    }[p.category] || '--cat-node';

    return {
      id: p.id,
      name: p.name,
      glyph: p.glyph,
      x: pt.x.toFixed(1),
      y: pt.y.toFixed(1),
      r: 5,
      c: `var(${catToken})`,
      bg: '#15141b',
      sw: 0.8,
      op: 0.6,
      f: '400 10px Georgia,serif',
      tip: p.name + ' · ' + Math.floor(p.lon) + '° ' + this.signOf(p.lon).sign,
      onclick: () => this.openPlanetDetail(p.name)
    };
  });
}

// ============================================================================
// WHEEL RENDERING: ASPECTS (EXPANDED)
// ============================================================================

/**
 * Compute all pairwise aspects for expanded points
 * Minor points get 50% orb scaling
 * Returns up to 150 aspect lines
 */
expandedWheelAspects() {
  const data = this.expandedChartData();
  const out = [];

  const EXPANDED_ASPECTS = [
    [0, 'conjunct', 6, '#2fff8f'],
    [60, 'sextile', 4, '#7d9bff'],
    [90, 'square', 6, '#e5534d'],
    [120, 'trine', 6, '#59b37d'],
    [180, 'opposite', 6, '#2fff8f']
  ];

  if (this.state.showMinorAspects) {
    EXPANDED_ASPECTS.push(
      [30, 'semisextile', 1.5, '#888'],
      [45, 'semisquare', 2, '#888'],
      [135, 'sesquisquare', 2, '#888'],
      [150, 'quincunx', 3, '#888']
    );
  }

  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const a = data[i];
      const b = data[j];

      // Skip angle-to-angle aspects
      if (a.category === 'angle' && b.category === 'angle') continue;

      let d = Math.abs(a.lon - b.lon);
      if (d > 180) d = 360 - d;

      for (const [ang, nm, baseOrb, col] of EXPANDED_ASPECTS) {
        // Scale orb for minor points
        const isMinor = (a.category === 'asteroid' || a.category === 'centaur' ||
                        a.category === 'tno' || b.category === 'asteroid' ||
                        b.category === 'centaur' || b.category === 'tno');
        const orbScale = isMinor ? 0.5 : 1;
        const orb = baseOrb * orbScale;

        const off = Math.abs(d - ang);
        if (off <= orb) {
          const pt1 = this.P(a.lon, 196);
          const pt2 = this.P(b.lon, 196);

          out.push({
            x1: pt1.x.toFixed(1),
            y1: pt1.y.toFixed(1),
            x2: pt2.x.toFixed(1),
            y2: pt2.y.toFixed(1),
            stroke: col,
            dash: nm === 'conjunct' ? '0' : '4,4',
            w: 1,
            op: 0.32
          });
        }
      }
    }
  }

  // Cap at 150 lines to prevent visual overload
  return out.slice(0, 150);
}

// ============================================================================
// WHEEL RENDERING: HOUSES & SIGNS
// ============================================================================

/**
 * Render 12 house division lines
 */
expandedWheelHouses() {
  return Array.from({ length: 12 }, (_, i) => {
    const cusp = this.wheelZero() + i * 30;
    const a = this.P(cusp, 322), b = this.P(cusp, 386), n = this.P(cusp + 15, 354);
    return {
      x1: a.x.toFixed(1), y1: a.y.toFixed(1),
      x2: b.x.toFixed(1), y2: b.y.toFixed(1),
      c: i % 3 === 0 ? '#3a3646' : '#26232f',
      w: i % 3 === 0 ? 1.6 : 1,
      n: i + 1,
      nx: n.x.toFixed(1),
      ny: n.y.toFixed(1)
    };
  });
}

/**
 * Zodiac signs around wheel perimeter
 */
expandedWheelSigns() {
  return this.ZODIAC_SIGNS.map((name, i) => {
    const mid = this.P(i * 30 + 15, 294);
    return {
      glyph: this.ZODIAC_GLYPHS[i],
      gx: mid.x.toFixed(1),
      gy: mid.y.toFixed(1),
      c: i % 4 === 0 ? '#e08d7d' : i % 4 === 1 ? '#2fff8f' : i % 4 === 2 ? '#7eb8da' : '#59b37d'
    };
  });
}

// ============================================================================
// LEFT PANEL: HOUSE CUSPS
// ============================================================================

/**
 * Format all 12 house cusps for left panel display
 */
expandedHouseCuspsList() {
  const asc = this.ascendant();
  if (!asc) return [];

  return Array.from({ length: 12 }, (_, i) => {
    const cusp = this.wheelZero() + i * 30;
    const lon = this.norm360(cusp);
    const s = this.signOf(lon);
    return {
      h: i + 1,
      sign: s.sign,
      deg: Math.floor(s.deg),
      min: Math.floor((s.deg % 1) * 60),
      lon: lon
    };
  });
}

// ============================================================================
// RIGHT PANEL: POINTS TABLE
// ============================================================================

/**
 * Filter points by search term (real-time)
 */
filterExpandedPoints() {
  const term = (this.state.pointsSearchTerm || '').toLowerCase();
  let filtered = this.expandedChartData();

  if (term) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
  }

  return this.sortExpandedPoints(filtered);
}

/**
 * Sort filtered points by current sort column and direction
 */
sortExpandedPoints(points) {
  const { pointsSortBy = 'name', pointsSortDir = 'asc' } = this.state;
  const dir = pointsSortDir === 'asc' ? 1 : -1;

  return [...points].sort((a, b) => {
    let cmp = 0;
    switch (pointsSortBy) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'lon':
        cmp = a.lon - b.lon;
        break;
      case 'house':
        cmp = (a.house || 0) - (b.house || 0);
        break;
      case 'speed':
        cmp = (b.speed || 0) - (a.speed || 0); // Retrograde first
        break;
      case 'category':
        cmp = a.category.localeCompare(b.category);
        break;
      default:
        cmp = 0;
    }
    return cmp * dir;
  });
}

/**
 * Group filtered points by category (if toggled)
 */
expandedPointsGrouped() {
  if (!this.state.groupByCategory) return null;

  const filtered = this.filterExpandedPoints();
  const groups = {};

  filtered.forEach(p => {
    if (!groups[p.category]) {
      groups[p.category] = [];
    }
    groups[p.category].push(p);
  });

  return Object.entries(groups).map(([cat, points]) => ({
    category: cat,
    catColor: {
      'asteroid': '#d4a574',
      'centaur': '#4a9d83',
      'tno': '#8b5cf6',
      'node': '#6b7280',
      'hypothetical': '#6b7280',
      'derived': '#6b7280',
      'comet': '#f97316'
    }[cat] || '#6b7280',
    points: points
  }));
}

/**
 * Format one row of the points table
 */
renderPointRow(p) {
  const lonStr = Math.floor(p.lon) + '° ' + this.signOf(p.lon).sign;
  const speedStr = p.speed !== null ? (p.speed > 0 ? '+' : '') + p.speed.toFixed(1) + '°' : '—';
  const retrograde = p.speed < 0 ? 'R' : '—';
  const statusLabel = {
    'ok': 'ok',
    'unavailable': 'n/a — no ephemeris',
    'fixed': 'fixed'
  }[p.status] || p.status;
  const statusColor = {
    'ok': '#2fff8f',
    'unavailable': 'var(--dim)',
    'fixed': '#7eb8da'
  }[p.status] || 'var(--tx)';

  return `
    <tr style="height:22px;${p.status === 'unavailable' ? 'opacity:.5;color:var(--dim)' : ''}">
      <td style="font-weight:500">${p.name}</td>
      <td style="text-align:center;font-size:12px;opacity:.6">${p.glyph}</td>
      <td style="text-align:right">${lonStr}</td>
      <td style="text-align:center">${p.house || '—'}</td>
      <td style="text-align:center;opacity:.7">${speedStr}</td>
      <td style="text-align:center;opacity:.7">${retrograde}</td>
      <td style="font-size:9px;color:${statusColor}">${statusLabel}</td>
    </tr>
  `;
}

// ============================================================================
// INTERACTION HANDLERS
// ============================================================================

toggleCometDisplay() {
  this.setState({ showCometsOnWheel: !this.state.showCometsOnWheel });
}

toggleMinorAspects() {
  this.setState({ showMinorAspects: !this.state.showMinorAspects });
}

filterPointsTable(searchTerm) {
  this.setState({ pointsSearchTerm: searchTerm.toLowerCase() });
}

toggleGroupByCategory() {
  this.setState({ groupByCategory: !this.state.groupByCategory });
}

sortPointsTable(field) {
  const current = this.state.pointsSortBy;
  const newDir = current === field
    ? (this.state.pointsSortDir === 'asc' ? 'desc' : 'asc')
    : 'asc';

  this.setState({
    pointsSortBy: field,
    pointsSortDir: newDir
  });
}

showPointTooltip(point, clientX, clientY) {
  const tooltip = document.getElementById('point-tooltip');
  const content = document.getElementById('tooltip-content');
  if (!tooltip || !content) return;

  const symbolism = this.SYMBOLISM?.[point.id] || { archetype: '', practical: '' };
  const lonStr = Math.floor(point.lon) + '° ' + this.signOf(point.lon).sign;

  // Build tooltip safely without innerHTML
  content.innerHTML = '';

  const title = document.createElement('strong');
  title.textContent = point.name + ' ' + point.glyph;
  content.appendChild(title);

  const br1 = document.createElement('br');
  content.appendChild(br1);

  const lon = document.createElement('span');
  lon.style.cssText = 'color:var(--ac-hi);opacity:.8';
  lon.textContent = lonStr;
  content.appendChild(lon);

  const br2 = document.createElement('br');
  content.appendChild(br2);

  const arch = document.createElement('span');
  arch.style.cssText = 'opacity:.8;margin-top:4px;display:block;font-size:9px';
  arch.textContent = symbolism.archetype;
  content.appendChild(arch);

  const prac = document.createElement('span');
  prac.style.cssText = 'opacity:.7;display:block;font-size:9px;color:var(--ac-hi)';
  prac.textContent = symbolism.practical;
  content.appendChild(prac);

  tooltip.style.left = clientX + 'px';
  tooltip.style.top = (clientY - 80) + 'px';
  tooltip.style.display = 'block';
}

hidePointTooltip() {
  const tooltip = document.getElementById('point-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

openPlanetDetail(pointName) {
  // TODO: Open detail panel showing full ephemeris, aspects involving this point, etc.
  console.log('Opening detail for:', pointName);
}

// ============================================================================
// INITIALIZATION (add to componentDidMount)
// ============================================================================

initExpandedChart() {
  this.setState({
    chartMode: 'basic',
    showCometsOnWheel: false,
    showMinorAspects: true,
    groupByCategory: true,
    pointsSearchTerm: '',
    pointsSortBy: 'name',
    pointsSortDir: 'asc'
  });
}

// ============================================================================
// PERFORMANCE LOGGING
// ============================================================================

logExpandedChartRender() {
  const start = performance.now();

  // Trigger all computed methods
  this.expandedChartData();
  this.expandedWheelPointsRing1();
  this.expandedWheelPointsRing2();
  this.expandedWheelAspects();
  this.filterExpandedPoints();

  const elapsed = performance.now() - start;
  console.log(`[ExpandedChart] Full render computed in ${elapsed.toFixed(1)}ms`);

  if (elapsed > 150) {
    console.warn(`[ExpandedChart] Render exceeded 150ms budget (${elapsed.toFixed(1)}ms)`);
  }
}
