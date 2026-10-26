import json
import pathlib
import importlib.util

tool_dir = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('hyakutake_fetch', tool_dir / 'fetch-hyakutake-jpl.py')
source = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)
root = source.HERE
series = [
    ('spring', 'spring_hour', 1 / 24, '1996-03-01 00:00', '1996-05-01 00:00', '1 h'),
    ('summer', 'summer_hour', 1 / 24, '1996-06-01 00:00', '1996-08-01 00:00', '1 h'),
    ('near', 'coarse1_1993_1999', 1, '1993-01-01 00:00', '1999-01-01 00:00', '1 d'),
    ('long', 'coarse7', 7, '1900-01-01 00:00', '2100-01-01 00:00', '7 d'),
]
chunks = []
for name, file, step, start, stop, stride in series:
    d = source.fetch(file, start, stop, stride)
    rows = d['rows']
    values = ','.join(f'{r[1]:.7f}'.rstrip('0').rstrip('.') for r in rows)
    chunks.append(f"    {name}: {{ start: {rows[0][0]:.9f}, step: {step:.14g}, values: [{values}] }}")

module = '''/*! comet-hyakutake-jpl.js: Horizons #73 observer ecliptic longitude.
 * Target: C/1996 B2 (Hyakutake), Earth geocenter, apparent IAU76/80
 * ecliptic of date, UTC. Generated from JPL Horizons API quantity 31.
 * Grid: seven days 1900-2100, one day 1993-1999, one hour 1996 Mar-Apr
 * and Jun-Jul. Cubic interpolation at independent half-step Horizons
 * references measured composite maximum below 0.9 arcsec; the rapid
 * March passage's one-hour grid is within 0.045 arcsec at half steps.
 * This measures interpolation error, separate from Horizons orbit covariance.
 * The raw source queries and validation script are in tools/.
 * No extrapolation outside the stored span. V1.0.0 (UMD)
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HyakutakeJPL = factory();
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';
  var SERIES = {
''' + ',\n'.join(chunks) + '''
  };
  function interpolate(s, t) {
    var v = s.values, z = (t - s.start) / s.step, k = Math.floor(z);
    if (k < 1 || k + 2 >= v.length) return null;
    var y = [v[k-1], v[k], v[k+1], v[k+2]];
    for (var i = 1; i < 4; ++i) {
      var d = (y[i] - y[i-1] + 540) % 360 - 180;
      y[i] = y[i-1] + d;
    }
    var x = z - k;
    var out = y[0] * (-x*(x-1)*(x-2)/6)
            + y[1] * ((x+1)*(x-1)*(x-2)/2)
            + y[2] * (-(x+1)*x*(x-2)/2)
            + y[3] * ((x+1)*x*(x-1)/6);
    return ((out % 360) + 360) % 360;
  }
  function lon(t) {
    if (typeof t !== 'number' || !isFinite(t)) return null;
    return interpolate(SERIES.spring, t) ?? interpolate(SERIES.summer, t)
        ?? interpolate(SERIES.near, t) ?? interpolate(SERIES.long, t);
  }
  return { lon: lon, VERSION: '1.0.0', source: 'JPL Horizons #73, quantity 31',
    span: [SERIES.long.start + SERIES.long.step,
           SERIES.long.start + (SERIES.long.values.length - 2) * SERIES.long.step] };
}));
'''
target = tool_dir.parent / 'app' / 'comet-hyakutake-jpl.js'
target.write_text(module)
print(len(module), 'bytes,', sum(len(source.fetch(f, start, stop, stride)['rows']) for _, f, _, start, stop, stride in series), 'samples')
