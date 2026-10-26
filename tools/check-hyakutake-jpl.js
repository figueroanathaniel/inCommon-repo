#!/usr/bin/env node
/* Independent Horizons #73 observer quantity 31 samples at non-grid times.
 * Earth geocenter, apparent IAU76/80 ecliptic of date, UTC. The last value
 * in each row is Horizons' formal 3-sigma plane-of-sky uncertainty, not the
 * interpolation error. See tools/fetch-hyakutake-jpl.py for regeneration. */
'use strict';
const H = require('../app/comet-hyakutake-jpl.js');
const samples = [
  ['1994-02-17T05:37:00Z', 213.6183769, 0.665],
  ['1995-08-17T12:34:00Z', 190.9752665, 0.541],
  ['1996-05-01T09:21:00Z', 41.4301458, 0.543],
  ['1997-04-12T20:17:00Z', 268.0650565, 1.187]
];
for (const [date, reference, sigma3] of samples) {
  const t = Date.parse(date) / 86400000 + 2440587.5 - 2451545;
  const got = H.lon(t);
  const errorArcsec = Math.abs(((got - reference + 540) % 360 - 180) * 3600);
  if (errorArcsec > 0.9) throw Error(date + ': interpolation missed Horizons by ' + errorArcsec + ' arcsec');
  if (date.startsWith('1994')) {
    const asc = 232.66274023598433;
    const house = Math.floor(((got - asc + 360) % 360) / 30) + 1;
    if (house !== 12 || sigma3 !== 0.665) throw Error('1994 placement/uncertainty fixture changed');
  }
}
if (H.lon(-40000) !== null || H.lon(40000) !== null) throw Error('unmeasured span extrapolated');
console.log('check-hyakutake-jpl: 4 independent Horizons instants, house 12, no out-of-span extrapolation');
