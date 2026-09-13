/*! expandedAspectsGrid.js
 * Aspects Grid for ExpandedChart: sortable, filterable matrix of all active aspects
 * Add these methods to the Component class
 */

// ============================================================================
// ASPECTS GRID COMPUTATION & FILTERING
// ============================================================================

/**
 * Compute all aspects for expanded chart as a flat array with metadata
 * Returns: { pointA, pointB, aspect, orb, exact, category }[]
 */
computeExpandedAspectsMatrix() {
  const data = this.expandedChartData?.();
  if (!data || data.length === 0) return [];

  const aspects = [];

  const ASPECT_DEFS = [
    { angle: 0, name: 'conjunct', orb: 6, minor: false },
    { angle: 60, name: 'sextile', orb: 4, minor: false },
    { angle: 90, name: 'square', orb: 6, minor: false },
    { angle: 120, name: 'trine', orb: 6, minor: false },
    { angle: 180, name: 'opposite', orb: 6, minor: false },
    { angle: 30, name: 'semisextile', orb: 1.5, minor: true },
    { angle: 45, name: 'semisquare', orb: 2, minor: true },
    { angle: 135, name: 'sesquisquare', orb: 2, minor: true },
    { angle: 150, name: 'quincunx', orb: 3, minor: true }
  ];

  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const a = data[i];
      const b = data[j];

      // Skip angle-to-angle aspects
      if (a.category === 'angle' && b.category === 'angle') continue;

      let d = Math.abs(a.lon - b.lon);
      if (d > 180) d = 360 - d;

      ASPECT_DEFS.forEach(def => {
        // Scale orb for minor points
        const isMinor = (a.category === 'asteroid' || a.category === 'centaur' ||
                        a.category === 'tno' || b.category === 'asteroid' ||
                        b.category === 'centaur' || b.category === 'tno');
        const orbScale = isMinor ? 0.5 : 1;
        const orb = def.orb * orbScale;

        const off = Math.abs(d - def.angle);

        // Include if within orb and (major aspects always, or minor if toggled)
        if (off <= orb && (!def.minor || this.state?.showMinorAspects)) {
          aspects.push({
            pointA: a,
            pointB: b,
            aspect: def.name,
            angle: def.angle,
            orb: orb,
            actual: off.toFixed(2),
            exact: (def.angle - off).toFixed(2) + '°',
            category: `${a.category}/${b.category}`,
            aspectType: def.minor ? 'minor' : 'major'
          });
        }
      });
    }
  }

  return aspects;
}

/**
 * Filter aspects matrix by search term, aspect type, and category
 */
filterExpandedAspectsMatrix() {
  let matrix = this.computeExpandedAspectsMatrix();

  // Filter by search term (point names)
  const search = (this.state?.aspectsSearchTerm || '').toLowerCase();
  if (search) {
    matrix = matrix.filter(a =>
      a.pointA.name.toLowerCase().includes(search) ||
      a.pointB.name.toLowerCase().includes(search)
    );
  }

  // Filter by aspect type (conjunct, square, etc.)
  const aspectFilter = this.state?.aspectsTypeFilter;
  if (aspectFilter && aspectFilter !== 'all') {
    matrix = matrix.filter(a => a.aspect === aspectFilter);
  }

  // Filter by category involvement (asteroid, centaur, etc.)
  const categoryFilter = this.state?.aspectsCategoryFilter;
  if (categoryFilter && categoryFilter !== 'all') {
    matrix = matrix.filter(a =>
      a.pointA.category === categoryFilter || a.pointB.category === categoryFilter
    );
  }

  // Sort by orb (closest first by default)
  const sortBy = this.state?.aspectsSortBy || 'orb';
  const sortDir = this.state?.aspectsSortDir === 'desc' ? -1 : 1;

  matrix.sort((x, y) => {
    let cmp = 0;
    switch (sortBy) {
      case 'orb':
        cmp = parseFloat(x.actual) - parseFloat(y.actual);
        break;
      case 'aspect':
        cmp = x.aspect.localeCompare(y.aspect);
        break;
      case 'pointA':
        cmp = x.pointA.name.localeCompare(y.pointA.name);
        break;
      case 'pointB':
        cmp = x.pointB.name.localeCompare(y.pointB.name);
        break;
      default:
        cmp = 0;
    }
    return cmp * sortDir;
  });

  return matrix;
}

/**
 * Group aspects by aspect type (conjunct, square, etc.)
 */
groupExpandedAspectsMatrix() {
  const matrix = this.filterExpandedAspectsMatrix();
  const grouped = {};

  matrix.forEach(a => {
    if (!grouped[a.aspect]) {
      grouped[a.aspect] = [];
    }
    grouped[a.aspect].push(a);
  });

  return Object.entries(grouped).map(([aspect, rows]) => ({
    aspect,
    count: rows.length,
    rows
  }));
}

// ============================================================================
// ASPECTS GRID RENDERING
// ============================================================================

/**
 * Render aspects matrix table
 */
renderExpandedAspectsTable() {
  const tbody = document.getElementById('expand-aspects-table-body');
  if (!tbody) return;

  const matrix = this.filterExpandedAspectsMatrix();

  tbody.innerHTML = matrix.map((a, idx) => `
    <tr
      style="height:24px;border-bottom:1px solid var(--bd);cursor:pointer"
      onclick="window.__incommonApp.highlightExpandedAspect(${idx})"
      data-aspect-idx="${idx}"
    >
      <td style="padding:2px 6px;text-align:left">${a.pointA.name}</td>
      <td style="padding:2px 6px;text-align:center">${a.pointA.glyph}</td>
      <td style="padding:2px 6px;text-align:center;color:var(--ac2-hi);font-weight:600">${a.aspect}</td>
      <td style="padding:2px 6px;text-align:center">${a.pointB.glyph}</td>
      <td style="padding:2px 6px;text-align:left">${a.pointB.name}</td>
      <td style="padding:2px 6px;text-align:right;opacity:.7">${a.actual}°</td>
      <td style="padding:2px 6px;text-align:right;font-size:9px;color:var(--blue)">${a.exact}</td>
    </tr>
  `).join('');
}

/**
 * Render aspects grid as grouped cards (optional alternative to table)
 */
renderExpandedAspectsCards() {
  const container = document.getElementById('expand-aspects-cards');
  if (!container) return;

  const grouped = this.groupExpandedAspectsMatrix();

  container.innerHTML = grouped.map(group => `
    <div style="
      border:1px solid var(--bd);
      border-radius:6px;
      margin-bottom:12px;
      overflow:hidden;
      background:var(--sf);
    ">
      <div style="
        background:var(--bg);
        padding:8px 10px;
        border-bottom:1px solid var(--bd);
        font:600 11px var(--fu);
        color:var(--ac2-hi);
      ">
        ${group.aspect} (${group.count})
      </div>
      <div style="padding:8px;font:400 10px var(--fu)">
        ${group.rows.map((a, idx) => `
          <div style="
            display:flex;
            gap:8px;
            padding:4px;
            border-bottom:1px solid var(--bd);
            cursor:pointer;
          "
            onclick="window.__incommonApp.highlightExpandedAspect(${idx})"
          >
            <span style="flex:1">${a.pointA.glyph} ${a.pointA.name}</span>
            <span style="color:var(--ac2-hi);font-weight:600">${a.aspect}</span>
            <span style="flex:1;text-align:right">${a.pointB.name} ${a.pointB.glyph}</span>
            <span style="opacity:.6;width:40px;text-align:right">${a.actual}°</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ============================================================================
// HIGHLIGHT & WHEEL INTERACTION
// ============================================================================

/**
 * Highlight aspect on wheel (click row to highlight both glyphs)
 */
highlightExpandedAspect(index) {
  // Toggle highlight (click twice to clear)
  const prevIdx = this.state?.highlightedAspectIndex;
  const newIdx = prevIdx === index ? null : index;

  this.setState({ highlightedAspectIndex: newIdx });

  // Highlight glyphs on wheel
  if (newIdx !== null) {
    const matrix = this.filterExpandedAspectsMatrix();
    const aspect = matrix[newIdx];

    if (aspect) {
      const pointAGlyph = document.querySelector(
        `#expand-chart-overlay svg g[data-point-a="${aspect.pointA.id}"]`
      );
      const pointBGlyph = document.querySelector(
        `#expand-chart-overlay svg g[data-point-b="${aspect.pointB.id}"]`
      );

      // Add highlight class / style
      if (pointAGlyph) {
        pointAGlyph.style.filter = 'drop-shadow(0 0 8px var(--ac2-hi))';
        pointAGlyph.style.opacity = '1';
      }
      if (pointBGlyph) {
        pointBGlyph.style.filter = 'drop-shadow(0 0 8px var(--ac2-hi))';
        pointBGlyph.style.opacity = '1';
      }

      // Draw highlight line on aspect
      const aspectLine = document.querySelector(
        `#expand-chart-overlay svg line[data-aspect-idx="${newIdx}"]`
      );
      if (aspectLine) {
        aspectLine.style.strokeWidth = '2';
        aspectLine.style.opacity = '0.8';
      }
    }
  } else {
    // Clear highlight
    const glyphs = document.querySelectorAll('#expand-chart-overlay svg g[data-point-a], #expand-chart-overlay svg g[data-point-b]');
    glyphs.forEach(g => {
      g.style.filter = 'none';
      g.style.opacity = '0.6';
    });

    const lines = document.querySelectorAll('#expand-chart-overlay svg line[data-aspect-idx]');
    lines.forEach(l => {
      l.style.strokeWidth = '1';
      l.style.opacity = '0.32';
    });
  }
}

// ============================================================================
// ASPECTS FILTER CONTROLS
// ============================================================================

/**
 * Filter aspects by type (conjunct, square, etc.)
 */
filterAspectsByType(aspectType) {
  this.setState({
    aspectsTypeFilter: aspectType,
    highlightedAspectIndex: null
  });
}

/**
 * Filter aspects by category involvement (asteroid, centaur, etc.)
 */
filterAspectsByCategory(category) {
  this.setState({
    aspectsCategoryFilter: category,
    highlightedAspectIndex: null
  });
}

/**
 * Sort aspects matrix
 */
sortAspectsMatrix(field) {
  const current = this.state?.aspectsSortBy;
  const newDir = current === field
    ? (this.state?.aspectsSortDir === 'asc' ? 'desc' : 'asc')
    : 'asc';

  this.setState({
    aspectsSortBy: field,
    aspectsSortDir: newDir,
    highlightedAspectIndex: null
  });
}

/**
 * Search aspects by point name
 */
searchAspects(term) {
  this.setState({
    aspectsSearchTerm: term.toLowerCase(),
    highlightedAspectIndex: null
  });
}

// ============================================================================
// STATISTICS & SUMMARIES
// ============================================================================

/**
 * Generate aspects summary (e.g., "42 contacts: 18 major, 24 minor")
 */
getAspectsStats() {
  const matrix = this.computeExpandedAspectsMatrix();
  const major = matrix.filter(a => a.aspectType === 'major').length;
  const minor = matrix.filter(a => a.aspectType === 'minor').length;

  return {
    total: matrix.length,
    major,
    minor,
    summary: `${matrix.length} contacts: ${major} major, ${minor} minor`
  };
}

/**
 * Get aspect type filter options from registry
 */
getAspectTypeFilters() {
  return [
    { name: 'All aspects', value: 'all' },
    { name: 'Conjunct', value: 'conjunct' },
    { name: 'Sextile', value: 'sextile' },
    { name: 'Square', value: 'square' },
    { name: 'Trine', value: 'trine' },
    { name: 'Opposite', value: 'opposite' },
    { name: 'Semisextile', value: 'semisextile' },
    { name: 'Semisquare', value: 'semisquare' },
    { name: 'Sesquisquare', value: 'sesquisquare' },
    { name: 'Quincunx', value: 'quincunx' }
  ];
}

/**
 * Get category filter options
 */
getCategoryFilters() {
  return [
    { name: 'All categories', value: 'all' },
    { name: 'Asteroids', value: 'asteroid' },
    { name: 'Centaurs', value: 'centaur' },
    { name: 'TNOs', value: 'tno' },
    { name: 'Nodes', value: 'node' },
    { name: 'Hypothetical', value: 'hypothetical' },
    { name: 'Derived', value: 'derived' },
    { name: 'Comets', value: 'comet' }
  ];
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize aspects grid state
 * Call from initExpandedChart()
 */
initExpandedAspectsGrid() {
  this.setState({
    aspectsSearchTerm: '',
    aspectsTypeFilter: 'all',
    aspectsCategoryFilter: 'all',
    aspectsSortBy: 'orb',
    aspectsSortDir: 'asc',
    highlightedAspectIndex: null
  });
}
