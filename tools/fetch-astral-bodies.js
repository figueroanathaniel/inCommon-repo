#!/usr/bin/env node
/* fetch-astral-bodies.js: the reference positions check-astral-bodies.js
 * measures the chart against.
 *
 * The ten astral bodies are the foundation every reading stands on, and until
 * this existed nothing in the build compared them with anything outside it:
 * the asteroids were held to 24,240 JPL Horizons positions while the Moon they
 * are aspected to was never measured at all. This asks Horizons for the
 * geocentric apparent ecliptic longitude of date (QUANTITIES 31, CENTER
 * 500@399, UT), which is the same quantity fetch-minor-body-elements.js
 * fetches and the same one the app draws, for each body from 1900 to 2100.
 *
 * The step is 37 days rather than a round number because the Moon has to be
 * seen at every phase: a step that is a multiple of the synodic month samples
 * one phase two hundred times and calls it coverage.
 *
 * Like the minor body fetcher it checks the name Horizons returns, because a
 * mistyped target number is a real, different body and would look right.
 *
 * Usage: node tools/fetch-astral-bodies.js [--refresh] [--cache <dir>]
 * Writes tools/fixtures/astral-bodies-horizons.json. Needs network.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const OUT = path.join(repo, 'tools', 'fixtures', 'astral-bodies-horizons.json');
const argVal = k => { const i = process.argv.indexOf(k); return i !== -1 ? process.argv[i + 1] : null; };
const REFRESH = process.argv.indexOf('--refresh') !== -1;
const CACHE = argVal('--cache') || path.join(os.tmpdir(), 'incommon-horizons-cache');

const FIRST = '1900-01-01', LAST = '2100-01-01', STEP_DAYS = 37;

/* The app's own names, so the gate can hand each one straight to lonRaw. */
const BODIES = {
  Sun: [10, 'Sun'], Moon: [301, 'Moon'], Mercury: [199, 'Mercury'], Venus: [299, 'Venus'],
  Mars: [499, 'Mars'], Jupiter: [599, 'Jupiter'], Saturn: [699, 'Saturn'],
  Uranus: [799, 'Uranus'], Neptune: [899, 'Neptune'], Pluto: [999, 'Pluto']
};

const API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const q = v => "'" + v + "'";

async function horizons(key, params) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, key + '.txt');
  if (!REFRESH && fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const url = API + '?' + Object.entries({ format: 'text', ...params })
    .map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + text.slice(0, 200));
      if (text.indexOf('$$SOE') === -1) throw new Error('no ephemeris block: ' + text.slice(0, 600));
      fs.writeFileSync(file, text);
      return text;
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

function targetName(text) {
  const m = text.match(/Target body name:\s*(.+?)\s{2,}/);
  return m ? m[1] : '';
}

async function fetchBody(name, num, expect) {
  const text = await horizons('astral-' + name.toLowerCase() + '-' + STEP_DAYS + 'd', {
    COMMAND: q(num), OBJ_DATA: q('NO'), MAKE_EPHEM: q('YES'), CSV_FORMAT: q('YES'),
    EPHEM_TYPE: q('OBSERVER'), CENTER: q('500@399'), QUANTITIES: q('31'), TIME_TYPE: q('UT'),
    ANG_FORMAT: q('DEG'), CAL_TYPE: q('GREGORIAN'), EXTRA_PREC: q('YES'),
    START_TIME: q(FIRST), STOP_TIME: q(LAST), STEP_SIZE: q(STEP_DAYS + ' d')
  });
  const got = targetName(text);
  if (got.indexOf(expect) !== 0) throw new Error(name + ': Horizons returned "' + got + '", expected ' + expect);
  /* Date__(UT)__HR:MN, , , ObsEcLon, ObsEcLat */
  const rows = text.slice(text.indexOf('$$SOE') + 5, text.indexOf('$$EOE')).split('\n').map(s => s.trim()).filter(Boolean);
  const refs = rows.map(line => {
    const c = line.split(',').map(s => s.trim());
    const d = new Date(c[0].replace(/^(\d{4})-(\w{3})-(\d{2}) (\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/, '$2 $3 $1 $4 UTC'));
    return [+(d.getTime() / 86400000 + 2440587.5 - 2451545.0).toFixed(4), +(+c[3]).toFixed(5)];
  }).filter(r => isFinite(r[0]) && isFinite(r[1]));
  if (refs.length !== rows.length) throw new Error(name + ': ' + (rows.length - refs.length) + ' rows did not parse');
  return { name: got, refs };
}

(async () => {
  const out = { horizons: {}, targets: {}, note: '' };
  for (const [name, [num, expect]] of Object.entries(BODIES)) {
    const r = await fetchBody(name, num, expect);
    out.horizons[name] = r.refs;
    out.targets[name] = r.name;
    console.log('  ' + name.padEnd(8) + ' ' + r.refs.length + ' positions  (' + r.name + ')');
  }
  out.note = 'Reference positions for tools/check-astral-bodies.js. JPL Horizons geocentric apparent ' +
    'ecliptic longitude of date (QUANTITIES 31, CENTER 500@399, UT), every ' + STEP_DAYS + ' days ' +
    FIRST + ' to ' + LAST + '. [t, lon], t = JD - 2451545 in UT. Generated by tools/fetch-astral-bodies.js; do not edit by hand.';
  fs.writeFileSync(OUT, JSON.stringify(out) + '\n');
  const n = Object.values(out.horizons).reduce((s, a) => s + a.length, 0);
  console.log('fetch-astral-bodies: wrote ' + n + ' positions to ' + path.relative(repo, OUT));
})().catch(e => { console.error('fetch-astral-bodies: FAIL\n  ' + e.message); process.exit(1); });
