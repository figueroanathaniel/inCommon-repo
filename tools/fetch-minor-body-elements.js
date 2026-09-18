#!/usr/bin/env node
/* fetch-minor-body-elements.js: pulls real orbital elements for the expanded
 * chart's asteroids, centaurs and TNOs from NASA JPL Horizons, and writes
 * app/minor-body-elements.js plus the reference positions that grade it.
 *
 * WHY THIS EXISTS. Fifty one of the eighty expanded points had no elements
 * sourced anywhere in this codebase, so the wheel listed them as
 * "n/a: no ephemeris" and their pages were empty. The rule engine.ts states
 * still holds: a missing position is honest and an invented one is not. So
 * the elements are not remembered or typed, they are fetched, and every body
 * ships with its own measured worst case against Horizons' apparent
 * positions, which is what decides whether it may name a degree.
 *
 * WHAT IS FETCHED, PER BODY.
 *   1. Heliocentric osculating elements, ecliptic and mean equinox of J2000,
 *      every STEP_YEARS from FIRST_YEAR to LAST_YEAR (CENTER 500@10,
 *      EPHEM_TYPE ELEMENTS, units AU and days).
 *   2. Geocentric apparent ecliptic longitude of date (QUANTITIES 31, CENTER
 *      500@399, UT) every REF_STEP_DAYS over the same span. These are the
 *      fixtures, written to tools/fixtures/minor-bodies-horizons.json.
 *
 * The returned target name is checked against the expected one before
 * anything is kept, because a numbered designation typed wrong returns a real
 * and entirely different asteroid, which would look exactly right.
 *
 * The Hamburg School hypotheticals are not fetched: they do not exist, so no
 * observatory has a position for them. Their elements are the published
 * Witte/Sieggruen set as refined by James Neely and carried by the Swiss
 * Ephemeris (seorbel.txt), and their reference positions were taken from the
 * Swiss Ephemeris itself; see HYPOTHETICAL_SOURCE below.
 *
 * Raw responses are cached in --cache (default: a folder beside the OS temp
 * dir) so the epoch spacing can be tuned without asking JPL again.
 *
 * The Swiss Ephemeris references for the hypotheticals are passed in with
 * --swiss-refs FILE (a JSON map of id to [[t, lon]] taken from swisseph-wasm
 * with the Moshier ephemeris). Without it, the ones already in the fixture file
 * are kept, so a refetch of the real bodies does not need Swiss installed.
 *
 * Usage: node tools/fetch-minor-body-elements.js [--cache DIR] [--refresh]
 *        [--swiss-refs FILE] [--only id,id]
 * Needs network. Nothing in the app fetches at runtime: this is a generator.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const OUT_MODULE = path.join(repo, 'app', 'minor-body-elements.js');
const OUT_FIX = path.join(repo, 'tools', 'fixtures', 'minor-bodies-horizons.json');
const args = process.argv.slice(2);
const argVal = k => { const i = args.indexOf(k); return i === -1 ? null : args[i + 1]; };
const CACHE = argVal('--cache') || path.join(os.tmpdir(), 'incommon-horizons-cache');
const REFRESH = args.indexOf('--refresh') !== -1;
/* --only id,id restricts the fetch and MERGES the result into what is already
   generated, so adding a body does not rewrite the other fifty one's recorded
   worst cases. Horizons revises its orbit solutions, so a full refetch moves
   numbers that nothing in this change touched, and a diff nobody can read is a
   diff nobody checks. Without it every body is fetched and DATA is rebuilt
   whole, which is the original behaviour. */
const ONLY = (argVal('--only') || '').split(',').map(s => s.trim()).filter(Boolean);

const FIRST_YEAR = 1900, LAST_YEAR = 2100, RAW_STEP_YEARS = 1, REF_STEP_DAYS = 181;
/* Spacings tried, widest first. A body keeps the widest one whose worst case
   against its references stays inside TARGET_DEG, and the densest otherwise.
   Kuiper belt orbits barely move in twenty years; a near Earth asteroid can
   change its orbit in one close pass, which is why this is chosen per body
   rather than set once. */
const STEPS = [20, 10, 4, 2, 1], TARGET_DEG = 0.1;
const SWISS_REFS = argVal('--swiss-refs');

/* registry id -> [Horizons small-body number, the name Horizons must return] */
const BODIES = {
  /* The four classical asteroids. They were the only real bodies on the
     expanded wheel NOT fetched: they sat on minor-bodies-ephemeris.js's single
     epoch coplanar model with mean longitudes its own header called
     provisional, and measured against these very references they were wrong by
     an RMS of 35 to 110 degrees, worst 169, flat across every window from
     1980-2010 to 1900-2100. That is a wrong phase rather than drift, so they
     are fetched like everything else now. Chiron is not here: it is genuinely
     chaotic, Saturn and Uranus keep perturbing it, and the fitted single epoch
     set in minor-bodies-ephemeris.js measures 0.3 degrees over 1980-2010,
     which is what a fit against real positions buys. */
  ceres: [1, 'Ceres'], pallas: [2, 'Pallas'], juno: [3, 'Juno'], vesta: [4, 'Vesta'],

  hygiea: [10, 'Hygiea'], astraea: [5, 'Astraea'], iris: [7, 'Iris'], flora: [8, 'Flora'],
  metis: [9, 'Metis'], hebe: [6, 'Hebe'], pandora: [55, 'Pandora'], psyche: [16, 'Psyche'],
  proserpina: [26, 'Proserpina'], eros: [433, 'Eros'], amor: [1221, 'Amor'], cupido_astr: [763, 'Cupido'],
  sappho: [80, 'Sappho'], bacchus: [2063, 'Bacchus'], karma: [3811, 'Karma'], nemesis: [128, 'Nemesis'],
  dejanira: [157, 'Dejanira'], atlantis: [1198, 'Atlantis'], pythia: [432, 'Pythia'], fortuna: [19, 'Fortuna'],
  tyche: [258, 'Tyche'], apollo: [1862, 'Apollo'], diana: [78, 'Diana'], arachne: [407, 'Arachne'],
  nessus: [7066, 'Nessus'], pholus: [5145, 'Pholus'], chariklo: [10199, 'Chariklo'], asbolus: [8405, 'Asbolus'],
  hylonome: [10370, 'Hylonome'], elatus: [31824, 'Elatus'], okyrhoe: [52872, 'Okyrhoe'], thereus: [32532, 'Thereus'],
  cyllarus: [52975, 'Cyllarus'], amycus: [55576, 'Amycus'], pelion: [49036, 'Pelion'], crantor: [83982, 'Crantor'],
  echeclus: [60558, 'Echeclus'], damocles: [5335, 'Damocles'],
  eris: [136199, 'Eris'], sedna: [90377, 'Sedna'], quaoar: [50000, 'Quaoar'], varuna: [20000, 'Varuna'],
  orcus: [90482, 'Orcus'], ixion: [28978, 'Ixion'], haumea: [136108, 'Haumea'], makemake: [136472, 'Makemake'],
  arrokoth: [486958, 'Arrokoth'], albion: [15760, 'Albion']
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
function block(text) {
  return text.slice(text.indexOf('$$SOE') + 5, text.indexOf('$$EOE')).split('\n').map(s => s.trim()).filter(Boolean);
}

async function fetchBody(id, num, expect) {
  const common = { COMMAND: q(num + ';'), OBJ_DATA: q('NO'), MAKE_EPHEM: q('YES'), CSV_FORMAT: q('YES'),
    START_TIME: q(FIRST_YEAR + '-01-01'), STOP_TIME: q(LAST_YEAR + '-01-01') };
  const el = await horizons(id + '-elements-' + RAW_STEP_YEARS + 'y', { ...common, EPHEM_TYPE: q('ELEMENTS'), CENTER: q('500@10'),
    REF_PLANE: q('ECLIPTIC'), REF_SYSTEM: q('J2000'), OUT_UNITS: q('AU-D'), STEP_SIZE: q(RAW_STEP_YEARS + ' y') });
  const ob = await horizons(id + '-observer', { ...common, EPHEM_TYPE: q('OBSERVER'), CENTER: q('500@399'),
    QUANTITIES: q('31'), TIME_TYPE: q('UT'), ANG_FORMAT: q('DEG'), STEP_SIZE: q(REF_STEP_DAYS + ' d'), CAL_TYPE: q('GREGORIAN') });
  for (const [kind, text] of [['elements', el], ['observer', ob]]) {
    const got = targetName(text);
    if (got.indexOf(expect) === -1) throw new Error(id + ' ' + kind + ': Horizons returned "' + got + '", expected ' + expect);
  }
  /* JDTDB, Cal, EC, QR, IN, OM, W, Tp, N, MA, TA, A, AD, PR */
  const epochs = block(el).map(line => {
    const c = line.split(',').map(s => s.trim());
    return { jd: +c[0], e: +c[2], i: +c[4], om: +c[5], w: +c[6], M: +c[9], a: +c[11] };
  });
  /* Date__(UT)__HR:MN, , , ObsEcLon, ObsEcLat */
  const refs = block(ob).map(line => {
    const c = line.split(',').map(s => s.trim());
    const d = new Date(c[0].replace(/^(\d{4})-(\w{3})-(\d{2}) (\d{2}:\d{2})$/, '$2 $3 $1 $4 UTC'));
    return [+(d.getTime() / 86400000 + 2440587.5 - 2451545.0).toFixed(4), +(+c[3]).toFixed(4)];
  }).filter(r => isFinite(r[0]) && isFinite(r[1]));
  return { name: targetName(el), epochs, refs };
}

/* The Witte and Sieggruen hypotheticals, refined by James Neely, as carried
   in the Swiss Ephemeris seorbel.txt: mean anomaly, semi-major axis,
   eccentricity, argument of perihelion, node, inclination; epoch and equinox
   J1900. Copied field for field, in the file's own order, below. */
const HYPOTHETICAL_SOURCE = 'Witte/Sieggruen, refined by James Neely (Swiss Ephemeris seorbel.txt)';
const HYPOTHETICALS = {
  tnp_cupido:   ['Cupido',   163.7409, 40.99837, 0.00460, 171.4333, 129.8325, 1.0833],
  tnp_hades:    ['Hades',     27.6496, 50.66744, 0.00245, 148.1796, 161.3339, 1.0500],
  tnp_zeus:     ['Zeus',     165.1232, 59.21436, 0.00120, 299.0440,   0.0000, 0.0000],
  tnp_kronos:   ['Kronos',   169.0193, 64.81690, 0.00305, 208.8801,   0.0000, 0.0000],
  tnp_apollon:  ['Apollon',  138.0533, 70.29949, 0.00000,   0.0000,   0.0000, 0.0000],
  tnp_admetos:  ['Admetos',  351.3350, 73.62765, 0.00000,   0.0000,   0.0000, 0.0000],
  tnp_vulkanus: ['Vulkanus',  55.8983, 77.25568, 0.00000,   0.0000,   0.0000, 0.0000],
  tnp_poseidon: ['Poseidon', 165.5163, 83.66907, 0.00000,   0.0000,   0.0000, 0.0000]
};
const T_J1900 = 2415020.0 - 2451545.0;

const sig = (x, n) => +(+x).toPrecision(n);
const fix = (x, n) => +(+x).toFixed(n);
function worstOf(ME, b, refs) {
  let w = 0;
  for (const [t, lon] of refs) {
    let d = Math.abs(ME.lonFrom(ME.rowsOf(b), t) - lon); if (d > 180) d = 360 - d;
    if (d > w) w = d;
  }
  return w;
}

function writeData(DATA) {
  let src = fs.readFileSync(OUT_MODULE, 'utf8');
  const a = src.indexOf('  var DATA = '), b = src.indexOf('  /* END GENERATED */');
  if (a === -1 || b === -1 || b < a) throw new Error('generated markers not found in ' + OUT_MODULE);
  const lines = Object.entries(DATA).map(([id, x]) => '    ' + id + ': ' + JSON.stringify(x));
  src = src.slice(0, a) + '  var DATA = {\n' + lines.join(',\n') + '\n  };\n' + src.slice(b);
  fs.writeFileSync(OUT_MODULE, src);
}

async function build() {
  const fixtures = fs.existsSync(OUT_FIX) ? JSON.parse(fs.readFileSync(OUT_FIX, 'utf8')) : { horizons: {}, swiss: {} };
  if (SWISS_REFS) fixtures.swiss = JSON.parse(fs.readFileSync(SWISS_REFS, 'utf8'));
  const ME = require(OUT_MODULE);
  const DATA = {}, report = [];
  if (ONLY.length) {
    /* Seed from the generated block, parsed rather than re-derived, so every
       body this run does not touch is re-serialised from its own bytes. */
    const src = fs.readFileSync(OUT_MODULE, 'utf8');
    const a = src.indexOf('  var DATA = '), b = src.indexOf('  /* END GENERATED */');
    if (a === -1 || b === -1) throw new Error('generated markers not found in ' + OUT_MODULE);
    const inner = src.slice(src.indexOf('{', a), src.lastIndexOf('}', b) + 1);
    Object.assign(DATA, JSON.parse(inner.replace(/^\s*([A-Za-z0-9_]+):/gm, '"$1":')));
    const unknown = ONLY.filter(k => !BODIES[k] && !HYPOTHETICALS[k]);
    if (unknown.length) throw new Error('--only names bodies this generator does not know: ' + unknown.join(', '));
  }
  const want = id => !ONLY.length || ONLY.indexOf(id) !== -1;
  for (const [id, [num, expect]] of Object.entries(BODIES)) {
    if (!want(id)) continue;
    const got = await fetchBody(id, num, expect);
    const all = got.epochs.map(e => [fix(e.jd - 2451545, 1), sig(e.a, 8), fix(e.e, 7), fix(e.i, 5), fix(e.om, 5), fix(e.w, 5), fix(e.M, 5)]);
    let chosen = null, best = null;
    for (const step of STEPS) {
      const rows = all.filter((r, i) => i % (step / RAW_STEP_YEARS) === 0);
      const cand = { n: expect, num: String(num), src: 'JPL Horizons', eq: 'J2000', step: step, w: 0,
        span: [fix(all[0][0] - 366, 1), fix(all[all.length - 1][0] + 366, 1)], rows: rows };
      cand.w = worstOf(ME, cand, got.refs);
      if (!best || cand.w < best.w) best = cand;
      if (cand.w <= TARGET_DEG) { chosen = cand; break; }
    }
    chosen = chosen || best;
    chosen.w = fix(chosen.w, 3);
    DATA[id] = chosen;
    fixtures.horizons[id] = got.refs.map(r => [fix(r[0], 1), fix(r[1], 4)]);
    report.push(id.padEnd(13) + (chosen.step + 'y').padStart(4) + '  ' + String(chosen.rows.length).padStart(3) + ' epochs  worst ' + chosen.w.toFixed(3) + '  ' + got.name);
  }
  for (const [id, [name, M0, a, e, w, om, i]] of Object.entries(HYPOTHETICALS)) {
    if (!want(id)) continue;
    const b = { n: name, num: 'hypothetical', src: HYPOTHETICAL_SOURCE, eq: 'J1900', step: null, w: 0, span: null,
      rows: [[T_J1900, a, e, i, om, w, M0]] };
    const refs = fixtures.swiss[id];
    if (!refs || !refs.length) throw new Error(id + ': no Swiss Ephemeris references; pass --swiss-refs');
    b.w = fix(worstOf(ME, b, refs), 3);
    DATA[id] = b;
    report.push(id.padEnd(13) + '   -    1 epoch   worst ' + b.w.toFixed(3) + '  ' + name + ' (hypothetical)');
  }
  if (!ONLY.length) for (const k of Object.keys(fixtures.swiss)) if (!HYPOTHETICALS[k]) delete fixtures.swiss[k];
  writeData(DATA);
  fs.mkdirSync(path.dirname(OUT_FIX), { recursive: true });
  fixtures.note = 'Reference positions for tools/check-minor-body-elements.js. horizons: JPL Horizons geocentric apparent ecliptic longitude of date (QUANTITIES 31, UT), every ' + REF_STEP_DAYS + ' days ' + FIRST_YEAR + ' to ' + LAST_YEAR + '. swiss: Swiss Ephemeris (swisseph-wasm, Moshier) apparent longitude for the Hamburg hypotheticals at the same instants. [t, lon], t = JD - 2451545 in UT.';
  fs.writeFileSync(OUT_FIX, JSON.stringify(fixtures));
  console.log(report.join('\n'));
  console.log('wrote ' + path.relative(repo, OUT_MODULE) + ' and ' + path.relative(repo, OUT_FIX));
}

module.exports = { BODIES, HYPOTHETICALS, FIRST_YEAR, LAST_YEAR, TARGET_DEG };

if (require.main === module) build().catch(e => { console.error('fetch-minor-body-elements: ' + e.message); process.exit(1); });
