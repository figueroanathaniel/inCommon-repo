/* chart-traditions.js: the arithmetic every study beyond the tropical chart
   needs. Mechanics layer: numbers and names from the field, no writing about
   what anything means. It reads no clock and no storage; the app hands it
   longitudes it already computed and, where a search is needed, the vendored
   astronomy-engine.

   1. Ayanamsas. Lahiri (Chitrapaksha) and Fagan-Bradley, by the Swiss
      Ephemeris method: the vernal point of date is precessed back to the
      defining epoch t0, its longitude on the ecliptic of t0 is read, and the
      ayanamsa is the value defined at t0 less that longitude. Epochs and
      values are the Swiss Ephemeris table (sweph.c, aya_init): Lahiri
      JD 2435553.5, 23.250182778 - 0.004658035; Fagan-Bradley
      JD 2433282.42346, 24.042044444. Precession is Lieske (IAU 1976), the
      model that table names for Lahiri, and the obliquity at t0 is IAU 1976.
      These are MEAN ayanamsas. A sidereal longitude is the apparent tropical
      longitude less the mean ayanamsa less the nutation in longitude, which
      is what the Swiss Ephemeris and the Indian Astronomical Ephemeris give.

   2. Nakshatras: twenty seven of 13 degrees 20 minutes from 0 sidereal
      Aries, four padas each, lords in the Vimshottari order, and the
      Vimshottari periods (120 years; a year of 365.25 days, stated because
      schools differ).

   3. The Chinese calendar: the Four Pillars by the solar terms (the year
      turns at Lichun, the Sun at 315 degrees; a month at each jie), the day
      by the sexagenary count, the hour by the double hour; and the lunar new
      year that the animal sign follows, by the rule in use since 1645 (the
      month holding the winter solstice is the 11th; a lunar month holding no
      major solar term after it is the leap month). Days are counted in China
      Standard Time, UTC+8, as the calendar is (Beijing mean time before 1929).

   Checked: Lahiri against the six Swiss Ephemeris and Indian Astronomical
   Ephemeris values from 1950 to 2020 (within 0.01 arcsecond); the lunar new
   year against every year from 1900 to 2100 (tools/fixtures/chinese-new-year.json). */
(function (root) {
  'use strict';
  const R = Math.PI / 180, AS = 1 / 3600;
  const norm = x => ((x % 360) + 360) % 360;
  const J2000 = 2451545.0;

  /* Lieske 1976 precession from J2000 to JD tt: equatorial vector rotation. */
  function precMatrix(jd) {
    const T = (jd - J2000) / 36525;
    const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) * AS * R;
    const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) * AS * R;
    const th = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T) * AS * R;
    const cz = Math.cos(zeta), sz = Math.sin(zeta), cZ = Math.cos(z), sZ = Math.sin(z), ct = Math.cos(th), st = Math.sin(th);
    return [
      [cZ * ct * cz - sZ * sz, -cZ * ct * sz - sZ * cz, -cZ * st],
      [sZ * ct * cz + cZ * sz, -sZ * ct * sz + cZ * cz, -sZ * st],
      [st * cz, -st * sz, ct]
    ];
  }
  const mul = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
  const mulT = (M, v) => [M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2], M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2], M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2]];
  function eps1976(jd) {
    const T = (jd - J2000) / 36525;
    return (84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T) * AS;
  }

  const AYANAMSAS = {
    lahiri: { name: 'Lahiri', t0: 2435553.5, v0: 23.250182778 - 0.004658035 },
    fagan: { name: 'Fagan-Bradley', t0: 2433282.42346, v0: 24.042044444 }
  };
  /* Mean ayanamsa in degrees at JD tt. */
  function ayanamsa(key, jd) {
    const a = AYANAMSAS[key]; if (!a) return null;
    let v = mulT(precMatrix(jd), [1, 0, 0]);          /* vernal point of date, to J2000 */
    v = mul(precMatrix(a.t0), v);                     /* to the equator of t0 */
    const e = eps1976(a.t0) * R;                      /* to the ecliptic of t0 */
    const y = v[1] * Math.cos(e) + v[2] * Math.sin(e), x = v[0];
    let L = Math.atan2(y, x) / R;
    if (L > 180) L -= 360;
    return a.v0 - L;
  }
  /* Nutation in longitude, degrees, by the IAU 1980 leading terms (good to
     about half an arcsecond). The app passes astronomy-engine's own when it
     has it; this is the fallback. */
  function dpsi(jd) {
    const T = (jd - J2000) / 36525;
    const Om = norm(125.04452 - 1934.136261 * T) * R;
    const L = norm(280.4665 + 36000.7698 * T) * R, Lp = norm(218.3165 + 481267.8813 * T) * R;
    return (-17.20 * Math.sin(Om) - 1.32 * Math.sin(2 * L) - 0.23 * Math.sin(2 * Lp) + 0.21 * Math.sin(2 * Om)) * AS;
  }
  /* Apparent tropical longitude to sidereal. */
  function sidereal(lon, key, jd, nut) {
    const a = ayanamsa(key, jd); if (a == null || lon == null) return null;
    return norm(lon - a - (nut != null ? nut : dpsi(jd)));
  }

  const RASHI = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Mina'];
  const NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
  const DASHA = [['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7], ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17]];
  const NAK = 360 / 27, PADA = NAK / 4, DASHA_YEAR = 365.25;
  function nakshatra(sid) {
    if (sid == null) return null;
    const i = Math.floor(norm(sid) / NAK), into = norm(sid) - i * NAK;
    return { index: i, name: NAKSHATRAS[i], pada: Math.floor(into / PADA) + 1, lord: DASHA[i % 9][0], frac: into / NAK };
  }
  /* Vimshottari: the sequence of major periods from birth, from the Moon's
     sidereal longitude. Dates are JD; the first period is the balance. */
  function vimshottari(moonSid, birthJd, count) {
    const n = nakshatra(moonSid); if (!n) return [];
    let k = n.index % 9, jd = birthJd;
    const out = [];
    const firstYears = DASHA[k][1] * (1 - n.frac);
    out.push({ lord: DASHA[k][0], start: jd, end: jd + firstYears * DASHA_YEAR, years: firstYears, balance: true });
    jd += firstYears * DASHA_YEAR;
    for (let i = 1; i < (count || 9); i++) {
      k = (k + 1) % 9;
      out.push({ lord: DASHA[k][0], start: jd, end: jd + DASHA[k][1] * DASHA_YEAR, years: DASHA[k][1] });
      jd += DASHA[k][1] * DASHA_YEAR;
    }
    return out;
  }
  /* Classical dignity of a graha in a sidereal sign (Parashara): exaltation,
     debilitation, own sign, or none. Exaltation degrees as the tradition
     gives them. */
  const EXALT = { Sun: [0, 10], Moon: [1, 3], Mars: [9, 28], Mercury: [5, 15], Jupiter: [3, 5], Venus: [11, 27], Saturn: [6, 20] };
  const OWN = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
  function dignity(graha, sid) {
    if (sid == null || !EXALT[graha]) return null;
    const s = Math.floor(norm(sid) / 30);
    if (EXALT[graha][0] === s) return 'exalted';
    if ((EXALT[graha][0] + 6) % 12 === s) return 'debilitated';
    if (OWN[graha].indexOf(s) !== -1) return 'own';
    return null;
  }

  /* ---- Chinese calendar ---- */
  const STEMS = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
  const BRANCHES = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
  const ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const ELEMENTS = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
  const pillar = (s, b) => ({ stem: STEMS[s], branch: BRANCHES[b], animal: ANIMALS[b], element: ELEMENTS[s], yin: s % 2 === 1, si: s, bi: b });
  const CST = 8 / 24;
  /* The calendar's civil day number of a UTC JD (a JDN). From 1929 the
     calendar counts days at 120 degrees east (UTC+8); before that it counted
     them on Beijing's local mean time, 116 degrees 25 minutes east
     (UTC+7:45:40). The switch is what puts the 1916 new year on 3 February. */
  const JD1929 = 2425612.5;
  const cstDay = jd => Math.floor(jd + (jd < JD1929 ? 27940 / 86400 : CST) + 0.5);
  /* Sexagenary index of a JDN: 0 is Jia-Zi. 2000-01-01 (JDN 2451545) is Wu-Wu, 54. */
  const dayIndex = jdn => (((jdn + 49) % 60) + 60) % 60;

  const jdOf = t => t.ut + J2000;                   /* astronomy-engine AstroTime.ut is days from J2000 UT */
  function sunAt(A, lon, fromJd, limit) { const t = A.SearchSunLongitude(lon, A.MakeTime(new Date((fromJd - 2440587.5) * 86400000)), limit || 400); return t ? jdOf(t) : null; }
  function newMoonAfter(A, jd) { const t = A.SearchMoonPhase(0, A.MakeTime(new Date((jd - 2440587.5) * 86400000)), 40); return t ? jdOf(t) : null; }
  /* New moon whose CST day is on or before the CST day of jd. */
  function newMoonOnOrBefore(A, jd) {
    let nm = newMoonAfter(A, jd - 31);
    let prev = nm;
    while (nm != null && cstDay(nm) <= cstDay(jd)) { prev = nm; nm = newMoonAfter(A, nm + 1); }
    return prev;
  }
  /* The CST day the 11th month begins in the winter solstice of Gregorian year y. */
  function month11(A, y) {
    const ws = sunAt(A, 270, (Date.UTC(y, 11, 1) / 86400000) + 2440587.5);
    return { ws, start: newMoonOnOrBefore(A, ws) };
  }
  const _ny = {};
  /* The lunar new year (CST JDN of its first day) that falls in Gregorian year y. */
  function lunarNewYear(A, y) {
    if (_ny[y] != null) return _ny[y];
    const a = month11(A, y - 1), b = month11(A, y);
    const moons = [a.start];
    while (true) { const n = newMoonAfter(A, moons[moons.length - 1] + 1); if (cstDay(n) >= cstDay(b.start)) break; moons.push(n); }
    let leapAt = -1;
    if (moons.length === 13) {
      /* The first month after the 11th with no major term (a multiple of 30 degrees) is the leap. */
      for (let i = 1; i < 13; i++) {
        const s = moons[i], e = i + 1 < 13 ? moons[i + 1] : b.start;
        const want = norm(270 + 30 * i);
        let term = sunAt(A, want, s - 20);
        if (term != null && cstDay(term) < cstDay(s)) term = sunAt(A, want, s + 1);
        const hasTerm = term != null && cstDay(term) >= cstDay(s) && cstDay(term) < cstDay(e);
        if (!hasTerm) { leapAt = i; break; }
      }
    }
    /* Month 1 is the second month after the 11th, or the third if the leap fell in between. */
    const idx = (leapAt === 1 || leapAt === 2) ? 3 : 2;
    return (_ny[y] = cstDay(moons[idx]));
  }
  /* The animal year of a moment by the lunar new year (the popular sign). */
  function animalYear(A, jd) {
    const g = new Date((jd + CST - 2440587.5) * 86400000).getUTCFullYear();
    const y = cstDay(jd) >= lunarNewYear(A, g) ? g : g - 1;
    const s = (((y - 4) % 10) + 10) % 10, b = (((y - 4) % 12) + 12) % 12;
    return { year: y, ...pillar(s, b) };
  }
  /* The Four Pillars at a UTC JD, for a local clock offset in hours (the day
     and the hour are read on the birth's own clock; the year and month turn
     at the solar terms, which are instants). */
  function fourPillars(A, jd, offsetHours, hasTime) {
    const sun = norm(A.SunPosition(A.MakeTime(new Date((jd - 2440587.5) * 86400000))).elon);
    const g = new Date((jd - 2440587.5) * 86400000).getUTCFullYear();
    const lichun = sunAt(A, 315, (Date.UTC(g, 0, 15) / 86400000) + 2440587.5, 60);
    const y = jd >= lichun ? g : g - 1;
    const ys = (((y - 4) % 10) + 10) % 10, yb = (((y - 4) % 12) + 12) % 12;
    const m = Math.floor(norm(sun - 315) / 30);           /* 0 is the Yin month */
    const mb = (2 + m) % 12, ms = ((ys % 5) * 2 + 2 + m) % 10;
    const local = jd + (offsetHours || 0) / 24;
    const jdn = Math.floor(local + 0.5), di = dayIndex(jdn);
    const out = { year: pillar(ys, yb), month: pillar(ms, mb), day: pillar(di % 10, di % 12), lichun };
    if (hasTime) {
      const h = (local + 0.5 - jdn) * 24, hb = Math.floor((h + 1) / 2) % 12;
      /* 23:00 to midnight is the Zi hour of the next day, whose stem rules it. */
      const ds = h >= 23 ? (di + 1) % 10 : di % 10;
      out.hour = pillar(((ds % 5) * 2 + hb) % 10, hb);
    }
    return out;
  }

  /* Heliocentric longitude of a body (true ecliptic of date). */
  function helio(A, name, jd) {
    const t = A.MakeTime(new Date((jd - 2440587.5) * 86400000));
    if (name === 'Earth' || name === 'Sun') { const s = A.SunPosition(t).elon; return norm(s + 180); }
    try { return norm(A.Ecliptic(A.HelioVector(name, t)).elon); } catch (e) { return null; }
  }

  const STUDIES = [
    { key: 'western', name: 'Western, Whole Sign', zodiac: 'tropical', houses: 'W' },
    { key: 'placidus', name: 'Western, Placidus', zodiac: 'tropical', houses: 'O' },
    { key: 'vedic', name: 'Vedic (Jyotish)', zodiac: 'lahiri', houses: 'W' },
    { key: 'chinese', name: 'Chinese (Four Pillars)', zodiac: 'tropical', houses: 'W', calendar: 'chinese' },
    { key: 'koch', name: 'Western, Koch', zodiac: 'tropical', houses: 'K' },
    { key: 'equal', name: 'Western, Equal', zodiac: 'tropical', houses: 'E' },
    { key: 'hellenistic', name: 'Hellenistic', zodiac: 'tropical', houses: 'W', sect: true },
    { key: 'sidereal', name: 'Western Sidereal (Fagan-Bradley)', zodiac: 'fagan', houses: 'W' },
    { key: 'draconic', name: 'Draconic', zodiac: 'draconic', houses: 'W' },
    { key: 'heliocentric', name: 'Heliocentric', zodiac: 'tropical', houses: null, frame: 'helio' }
  ];

  const api = { VERSION: '1.0.0', AYANAMSAS, ayanamsa, dpsi, sidereal, RASHI, NAKSHATRAS, DASHA, DASHA_YEAR, nakshatra, vimshottari,
    dignity, STEMS, BRANCHES, ANIMALS, ELEMENTS, dayIndex, cstDay, lunarNewYear, animalYear, fourPillars, helio, STUDIES, DEFAULT: 'western' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChartTraditions = api;
})(typeof window !== 'undefined' ? window : this);
