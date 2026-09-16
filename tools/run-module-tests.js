#!/usr/bin/env node
/* run-module-tests.js: the gate for the three connection pass modules.
 *
 * WHAT IT COVERS. birth-time.js, hd-composite.js, iching.js and analytics.js,
 * executed as
 * the app executes them: the same files, required rather than transformed. It
 * does not touch the app shell, which needs a browser, and it says so rather
 * than pretending otherwise.
 *
 * WHY THE TIMEZONE ROWS ARE WORTH THEIR LENGTH. A wrong offset is the one
 * error this app cannot notice: it produces a chart that is complete,
 * internally consistent and about a different moment. An hour is about fifteen
 * degrees of Ascendant, which is routinely a whole rising sign, and it moves
 * every house cusp with it. So the rows below are not "does Intl work": they
 * are births on the awkward side of a rule that has since changed, in zones
 * that changed it, including a year when Britain did not go back, a decade
 * when Portugal was on central European time, the five years Russia kept
 * daylight saving permanently, the Sydney games starting daylight saving early,
 * China's brief experiment with it, and three zones whose offset is not a whole
 * number of hours.
 *
 * These are facts about the tz database, not about this code, which is the
 * point: if a future change starts reading a stored standard offset again,
 * every summer row here goes red at once.
 *
 * A NOTE ON ICU. Node carries the same IANA database the browser does. A row
 * failing here means one of three things: the code stopped asking the zone,
 * the expectation is wrong, or the tz database revised that history. All three
 * are worth a person looking, which is why none of them is a skip.
 *
 * Usage:  node tools/run-module-tests.js [--quiet]
 * Exit:   0 all passed, 1 any failure.
 */
'use strict';

const path = require('path');
const fs = require('fs');

const repo = path.resolve(__dirname, '..');
const quiet = process.argv.indexOf('--quiet') !== -1;

const BT = require(path.join(repo, 'app', 'birth-time.js'));
const HDC = require(path.join(repo, 'app', 'hd-composite.js'));
const TOPO = require(path.join(repo, 'app', 'hd-topology.js'));
const ATLAS = require(path.join(repo, 'app', 'hd-atlas.js'));
/* Helmet order, as globals: hd-topology loads before hd-atlas, and both are
   found by name the way every module in this build finds its dependencies. */
globalThis.HDTopology = TOPO;
globalThis.HDAtlas = ATLAS;
const AN = require(path.join(repo, 'app', 'analytics.js'));
const IC = require(path.join(repo, 'app', 'iching.js'));

/* Extension suites from Prompts A, B, C */
const MC = require(path.join(repo, 'app', 'forecast', 'news', 'multiChart.test.js'));
const SW = require(path.join(repo, 'app', 'forecast', 'news', 'skyWire.test.js'));
const I18N = require(path.join(repo, 'app', 'i18n', 'i18n.test.js'));

const rows = [];
function t(id, desc, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  rows.push({ id, desc, pass: a === e, actual: a, expected: e });
}
function tTrue(id, desc, actual) { t(id, desc, actual === true, true); }

/* ---------------------------------------------------------------- B: times */

t('B1', 'a blank field is not an answer', BT.parse('', '24').reason, 'empty');
t('B2', 'a bare hour is four different times and is refused', BT.parse('7', '24').ok, false);
t('B3', '24 hour digits read as written', BT.parse('14:05', '24').time, '14:05');
t('B4', 'pm is applied to a 12 hour clock', BT.parse('2:05', 'pm').time, '14:05');
t('B5', 'am at noon is midnight', BT.parse('12:30', 'am').time, '00:30');
t('B6', 'pm at noon stays noon', BT.parse('12:30', 'pm').time, '12:30');
t('B7', 'a contradiction is refused, never resolved quietly', BT.parse('13:00', 'am').ok, false);
t('B8', 'a meridiem written into the text wins over the control', BT.parse('2:05 pm', '24').time, '14:05');
t('B9', 'seconds are allowed in and dropped', BT.parse('21:41:00', '24').time, '21:41');
t('B10', 'a single digit hour is padded on the way to storage', BT.norm('0:37'), '00:37');
t('B11', 'minutes past 59 are refused', BT.parse('10:75', '24').reason, 'minute');
t('B12', 'the three states are distinguished', [
  BT.timeState({ birthTime: '09:00' }), BT.timeState({ timeUnknown: true }), BT.timeState({})
], ['known', 'unknown', 'unanswered']);
t('B13', 'an unknown time is drawn for noon and says so', (() => {
  const i = BT.instant({ birthDate: '1992-07-02', timeUnknown: true });
  return [i.assumed, i.assumedTime, i.date.toISOString()];
})(), [true, '12:00', '1992-07-02T12:00:00.000Z']);
t('B14', 'an unanswered time is not treated as a declared unknown', BT.availability({ birthDate: '1992-07-02' }).timeState, 'unanswered');
t('B15', 'nothing time dependent is claimed without a time and a place', BT.availability({ birthDate: '1992-07-02', timeUnknown: true }).unavailable.length, BT.TIME_DEPENDENT.length);
t('B16', 'a time with no coordinates is still not a timed chart', BT.availability({ birthDate: '1992-07-02', birthTime: '09:00' }).timed, false);
t('B17', 'a time with coordinates is', BT.availability({ birthDate: '1992-07-02', birthTime: '09:00', birthLat: 47.6, birthLon: -122.3 }).timed, true);
t('B18', 'fractional offsets are labelled to the minute', [BT.offsetLabel(5.75), BT.offsetLabel(-3.5)], ['UTC+05:45', 'UTC-03:30']);

/* The documented case: Seattle, 2 July 1992 at 21:41. Read on the stored
   standard offset it lands an hour late, which put the Ascendant in the wrong
   sign and moved all twelve cusps. */
t('B19', 'the Seattle case resolves to daylight time, not the stored standard offset',
  BT.instant({ birthDate: '1992-07-02', birthTime: '21:41', timezone: 'America/Los_Angeles', tzOffset: -8 }).date.toISOString(),
  '1992-07-03T04:41:00.000Z');
t('B20', 'and the offset it used says where it came from',
  (() => { const i = BT.instant({ birthDate: '1992-07-02', birthTime: '21:41', timezone: 'America/Los_Angeles', tzOffset: -8 }); return [i.offset, i.offsetSource]; })(),
  [-7, 'zone']);

/* ---- the birthdays. zone, local date, local time, expected UTC offset ---- */
const DST = [
  ['America/New_York', '1992-07-04', '09:00', -4, 'US summer, eastern'],
  ['America/New_York', '1992-01-15', '09:00', -5, 'US winter, eastern'],
  ['America/New_York', '2006-04-01', '09:00', -5, 'the day before the old April start'],
  ['America/New_York', '2007-03-11', '09:00', -4, 'the new March start, first year of it'],
  ['America/Los_Angeles', '1992-07-02', '21:41', -7, 'the documented Seattle birth'],
  ['America/Phoenix', '1975-07-15', '12:00', -7, 'Arizona keeps standard time all year'],
  ['America/Indiana/Indianapolis', '2005-07-15', '12:00', -5, 'Indiana before it kept daylight saving'],
  ['America/Indiana/Indianapolis', '2007-07-15', '12:00', -4, 'Indiana after'],
  ['America/St_Johns', '1998-07-15', '12:00', -2.5, 'Newfoundland, half hour zone, summer'],
  ['America/St_Johns', '1998-01-15', '12:00', -3.5, 'Newfoundland, winter'],
  ['Europe/London', '1970-01-15', '12:00', 1, 'the years Britain stayed on summer time all winter'],
  ['Europe/London', '1995-07-15', '12:00', 1, 'British summer time'],
  ['Europe/London', '1995-01-15', '12:00', 0, 'Greenwich in January'],
  ['Europe/Lisbon', '1993-01-15', '12:00', 1, 'the years Portugal ran on central European time'],
  ['Europe/Lisbon', '1998-01-15', '12:00', 0, 'and after it moved back'],
  ['Europe/Moscow', '2012-01-15', '12:00', 4, 'the years Russia kept daylight saving permanently'],
  ['Europe/Moscow', '2016-01-15', '12:00', 3, 'and after it stopped'],
  ['Europe/Istanbul', '2015-01-15', '12:00', 2, 'Turkey before it fixed its clock'],
  ['Europe/Istanbul', '2018-01-15', '12:00', 3, 'and after'],
  ['Europe/Berlin', '1980-07-15', '12:00', 2, 'central European summer time'],
  ['Asia/Shanghai', '1990-07-15', '12:00', 9, 'the five summers China ran daylight saving'],
  ['Asia/Shanghai', '1995-07-15', '12:00', 8, 'and after it stopped'],
  ['Asia/Kolkata', '1985-06-15', '12:00', 5.5, 'half hour zone, no daylight saving'],
  ['Asia/Kathmandu', '1990-06-15', '12:00', 5.75, 'three quarter hour zone'],
  ['Asia/Tokyo', '1960-07-15', '12:00', 9, 'Japan after its daylight saving years ended'],
  ['Australia/Sydney', '2000-09-15', '12:00', 11, 'daylight saving started early for the Sydney games'],
  ['Australia/Sydney', '1999-09-15', '12:00', 10, 'the same date in an ordinary year'],
  ['Pacific/Auckland', '2005-01-15', '12:00', 13, 'southern summer'],
  ['Pacific/Chatham', '2005-01-15', '12:00', 13.75, 'the three quarter hour zone, in summer'],
  ['America/Sao_Paulo', '2018-01-15', '12:00', -2, 'Brazil while it still kept daylight saving'],
  ['America/Sao_Paulo', '2020-01-15', '12:00', -3, 'Brazil after it abolished it'],
  ['Pacific/Honolulu', '1990-07-15', '12:00', -10, 'Hawaii keeps standard time all year']
];
DST.forEach((row, i) => {
  const [tz, date, time, want, why] = row;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date), hm = time.split(':');
  const got = BT.utcOffsetFor(tz, +m[1], +m[2] - 1, +m[3], +hm[0], +hm[1], 0).offset;
  t('B' + (21 + i), tz + ' ' + date + ' ' + time + ': ' + why, got, want);
});

/* An hour that happened twice has no single right answer. What matters is that
   the resolver settles rather than oscillating, and that it says it was
   ambiguous so the screen can. */
const fold = BT.utcOffsetFor('America/Chicago', 1990, 10, 4, 1, 30, 0);
tTrue('B53', 'a local time inside a fall back settles on one of the two offsets', fold.offset === -5 || fold.offset === -6);

/* A zone the device does not know falls back to what was stored rather than
   silently reading the birth as UTC. */
t('B54', 'an unknown zone falls back to the stored offset',
  BT.utcOffsetFor('Mars/Olympus', 1992, 6, 2, 21, 41, -8), { offset: -8, source: 'stored', ambiguous: false });
t('B55', 'hand entered coordinates keep the offset their longitude implies',
  BT.utcOffsetFor('manual', 1992, 6, 2, 21, 41, -8).source, 'stored');
t('B56', 'daylight saving is detected without assuming a hemisphere or an hour',
  [BT.isDst('America/New_York', new Date(Date.UTC(1992, 6, 2, 16))), BT.isDst('Australia/Sydney', new Date(Date.UTC(2000, 6, 2, 2)))],
  [true, false]);

/* The separator a numeric keypad cannot type. parse() refuses a bare hour on
   purpose, which left the field unfillable on a phone: these rows are what say
   the digits arriving from a keypad reach parse() in a shape it accepts. */
t('B57', 'three digits from a keypad become an hour and a minute',
  [BT.mask('2', ''), BT.mask('20', '2'), BT.mask('205', '20')], ['2', '20', '2:05']);
t('B58', 'four digits fill the whole clock',
  BT.mask('1430', '1:43'), '14:30');
t('B59', 'what the mask writes is what parse accepts, which is the point of it',
  [BT.parse(BT.mask('205', '20'), '24').time, BT.parse(BT.mask('1430', '143'), '24').time],
  ['02:05', '14:30']);
t('B60', 'masking a masked value changes nothing',
  [BT.mask('2:05', '2:05'), BT.mask('14:30', '14:30')], ['2:05', '14:30']);
/* Re-masking a deletion turns one backspace on 14:30 into 1:43, which reads as
   the field fighting the reader. */
t('B61', 'a deletion is left alone rather than re-masked',
  [BT.mask('14:3', '14:30'), BT.mask('14:', '14:3'), BT.mask('14', '14:')], ['14:3', '14:', '14']);
/* Stripping a typed meridiem would move a birth time by twelve hours in
   silence, which is the one error this module exists to prevent. */
t('B62', 'a typed meridiem is never touched',
  [BT.mask('2:05 pm', '2:05 p'), BT.parse(BT.mask('2:05 pm', '2:05 p'), '24').time], ['2:05 pm', '14:05']);
t('B63', 'a keypad cannot overflow the clock',
  BT.mask('143055', '14305'), '14:30');
t('B64', 'an empty field stays empty',
  [BT.mask('', '2'), BT.mask(null, null)], ['', '']);

/* --------------------------------------------------------- C: the composite */

const A_GATES = [34, 20, 10, 1, 8, 57];
const B_GATES = [57, 2, 14, 20, 10];
const comp = HDC.composite(A_GATES, B_GATES, { atlas: ATLAS, nameA: 'Nate', nameB: 'Sam', timeA: 'known', timeB: 'known' });

t('C1', 'every one of the thirty six channels lands in exactly one of the six states', comp.counts.total, 36);

/* The six branches, each on a case built to hit it and nothing else. */
const S = g => HDC.composite(g[0], g[1], { atlas: ATLAS, nameA: 'A', nameB: 'B' });
t('C2', 'ONE(x) and ONE(y) with x not equal to y is electromagnetic',
  S([[10], [57]]).electromagnetic.map(r => r.key), ['10-57']);
t('C3', 'BOTH and BOTH is companionship',
  S([[10, 57], [10, 57]]).companionship.map(r => r.key), ['10-57']);
t('C4', 'BOTH and NONE is dominance',
  S([[10, 57], [2]]).dominance.map(r => r.key), ['10-57']);
t('C5', 'BOTH and ONE is compromise, never dominance',
  [S([[10, 57], [10]]).compromise.map(r => r.key), S([[10, 57], [10]]).dominance.length], [['10-57'], 0]);
t('C6', 'the same single gate on both sides is a shared gate, not one of the four',
  S([[10], [10]]).sharedGate.map(r => r.key + ':' + r.gate), ['10-20:10', '10-34:10', '10-57:10']);
t('C7', 'neither reaching it is absent, and absent is counted rather than listed',
  S([[1], [2]]).counts.absent, 36);

/* Direction is the part a symmetric summary throws away. */
t('C8', 'a dominance row names who holds it and who does not',
  (() => { const r = S([[10, 57], [2]]).dominance[0]; return [r.holder, r.holderName, r.other, r.otherName]; })(),
  ['a', 'A', 'b', 'B']);
t('C9', 'swapping the two people inverts the direction rather than repeating it',
  (() => { const f = S([[10, 57], [2]]).dominance[0], b = HDC.composite([2], [10, 57], { atlas: ATLAS, nameA: 'A', nameB: 'B' }).dominance[0];
    return [f.holder, b.holder]; })(), ['a', 'b']);
t('C10', 'a compromise row records which gate the second person holds',
  S([[10, 57], [10]]).compromise[0].sharedGate, 10);

/* THE SAFETY RULE, ASSERTED IN THE DATA. Every dominance and compromise row
   carries the sentence that says the word is about a shape between two charts,
   and the screen renders it beside the row rather than behind a tap. */
tTrue('C11', 'every dominance and compromise row carries the configuration caution',
  comp.dominance.concat(comp.compromise).every(r => r.caution === HDC.CONFIG_CAUTION));
tTrue('C12', 'and the caution says it is not about behaviour',
  /says nothing about how either person treats the other/.test(HDC.CONFIG_CAUTION));
tTrue('C13', 'no row labels a person dominant',
  comp.dominance.concat(comp.compromise).every(r => !/\bdominant\b/i.test(r.fact)));
tTrue('C14', 'layers() carries the caution through to the screen',
  ATLAS.layers(comp.dominance[0], 'Nate', 'Sam').hasCaution === true);
tTrue('C15', 'and does not attach one where it does not belong',
  ATLAS.layers(comp.companionship[0], 'Nate', 'Sam').hasCaution === false);

/* Identical charts, the spec's own case. */
const same = HDC.composite(A_GATES, A_GATES, { atlas: ATLAS });
t('C16', 'two identical charts are all companionship and no electromagnetic',
  [same.counts.electromagnetic, same.counts.dominance, same.counts.compromise, same.counts.companionship > 0],
  [0, 0, 0, true]);
t('C17', 'and the identical case is reported as identical', same.identical, true);

/* Composite definition: the union, not a third chart. */
t('C18', 'the composite defines the union of both activation sets',
  comp.definition.channels.sort(), ['10-20', '10-34', '10-57', '1-8', '2-14', '20-34', '20-57', '34-57'].sort());
tTrue('C19', 'and names the centres that union defines', comp.definition.centers.length > 0 &&
  comp.definition.centers.indexOf('Throat') > -1);

/* Degrading, named per person rather than averaged away. */
const halfTimed = HDC.composite(A_GATES, B_GATES, { atlas: ATLAS, nameA: 'Nate', nameB: 'Sam', timeA: 'known', timeB: 'unknown' });
t('C20', 'one unknown birth time is named, not averaged away', halfTimed.precision.who, 'b');
tTrue('C21', 'and the note says whose it is', halfTimed.precision.note.indexOf('Sam') > -1);
t('C22', 'two unknown birth times are named as two',
  HDC.composite(A_GATES, B_GATES, { atlas: ATLAS, timeA: 'unknown', timeB: 'unanswered' }).precision.who, 'both');
t('C23', 'a fully timed pair says so plainly', comp.precision.full, true);

/* THE CONSTRAINT. No score, no percentage, no ranking, anywhere in what the
   module returns. A future helper that adds one fails here. */
const flat = JSON.stringify(comp);
tTrue('C24', 'no percentage appears anywhere in a composite', flat.indexOf('%') === -1);
t('C25', 'no field is named like a score', Object.keys(comp).filter(k => /score|rating|rank|percent|compat|match|best/i.test(k)), []);
tTrue('C26', 'and no row carries one either',
  comp.electromagnetic.concat(comp.companionship, comp.dominance, comp.compromise, comp.sharedGate)
    .every(r => Object.keys(r).every(k => !/score|rating|rank|percent|compat|match|best/i.test(k))));

const L = ATLAS.layers(comp.electromagnetic[0] || comp.companionship[0], 'Nate', 'Sam');
t('C27', 'the layers come back apart, never merged', Object.keys(L), ['fact', 'tradition', 'possibility', 'caution', 'hasCaution']);
tTrue('C28', 'the possibility layer is a question for the two of them', L.possibility.indexOf('?') > -1);
tTrue('C29', 'a one sided reading says whose birth data it holds', HDC.consentNote(false, 'Sam').indexOf('has not seen this') > -1);
t('C30', 'the contact cap is twelve', HDC.MAX_CONTACTS, 12);

/* ---- C32 to C35: the writing lives in the atlas, not in the mechanics ----
   layers() used to hold the tradition line and all six possibility questions,
   which put the interpretation layer inside a mechanics module. They moved to
   hd-atlas.js beside the channel descriptors the tradition line quotes. These
   four rows are what stops them coming back. */
tTrue('C32', 'the tradition line and the six questions come from the atlas',
  ['electromagnetic', 'companionship', 'dominance', 'compromise', 'sharedGate', 'absent']
    .every(k => typeof ATLAS.CONNECTION_ASK[k] === 'string' && ATLAS.CONNECTION_ASK[k].length > 40) &&
  ['named', 'namedWithTheme', 'unnamed'].every(k => typeof ATLAS.CONNECTION_TRADITION[k] === 'string'));

/* THE INVARIANT THE SPLIT BOUGHT, and the successor to the row that used to
   sit here. That one asserted layers() degraded honestly with no atlas
   reachable, which stopped meaning anything when layers() moved INTO the
   atlas. What is worth asserting now is the stronger thing: a composite row
   is structure and carries no writing at all, so no text passes through a
   mechanics module on its way to a screen. */
t('C33', 'a composite row carries no writing, only structure',
  (() => {
    const prose = [];
    ['electromagnetic','companionship','dominance','compromise','sharedGate','absent']
      .forEach(k => (comp[k] || []).forEach(r => Object.keys(r).forEach(f => {
        const v = r[f];
        /* fact and caution are this module's own and are declared in the layer
           gate's PROSE list; everything else must be numbers, keys or states. */
        if (typeof v === 'string' && f !== 'fact' && f !== 'caution' &&
            v.trim().split(/s+/).length >= 4) prose.push(f + ': ' + v.slice(0, 40));
      })));
    return prose;
  })(), []);

/* And the path the browser actually uses: no opts, atlas found on the global.
   Set and removed inside the row so nothing else in this file sees it. */
tTrue('C34', 'layers() finds the atlas on the global the way the app does',
  (() => {
    globalThis.HDAtlas = ATLAS;
    const L = ATLAS.layers(comp.dominance[0], 'Nate', 'Sam');
    delete globalThis.HDAtlas;
    return L.possibility.indexOf('?') > -1 && L.tradition.indexOf('is called') > -1;
  })());

/* The source-level half: hd-composite may not carry these sentences again.
   check-layer-boundary would catch a new one, but this names the specific
   text that was moved, the way I12 does for the rewritten hexagram lines. */
const COMPOSITE_SRC = fs.readFileSync(path.join(repo, 'app', 'hd-composite.js'), 'utf8');

/* ---- Y: hd-topology.js ----------------------------------------------
   The atlas split. The wiring, which gates pair into which channel and which
   centre each gate belongs to, is a fact about a system nobody owns and lives
   in a mechanics module. The names, themes and meanings are inCommon's and
   stay in hd-atlas.js. These rows hold the two halves to each other, because
   the failure mode of a split is two tables that drift and a chart that is
   internally consistent and about a different system. */
t('Y1', 'the thirty six channels are declared once and the atlas agrees',
  TOPO.PAIRS.slice().sort(), Object.keys(ATLAS.CHANNELS).sort());
t('Y2', 'every gate from 1 to 64 has a centre',
  Object.keys(TOPO.CENTER_OF).map(Number).sort((a, b) => a - b),
  Array.from({ length: 64 }, (_, i) => i + 1));
tTrue('Y3', 'and every one of those centres is one of the nine',
  Object.keys(TOPO.CENTER_OF).every(g => TOPO.CENTERS.indexOf(TOPO.CENTER_OF[g]) !== -1));
/* AGAINST THE ATLAS'S OWN TABLE, NOT AGAINST ATLAS.centerOf(). That function
   delegates to topology now, so comparing the two asks topology whether it
   agrees with itself and passes whatever either says. GATES still carries the
   centre in position 1 and is a genuinely independent record of the same fact,
   which is what makes this row able to fail: moving one gate to another centre
   in hd-topology.js turns it red, and against centerOf() it did not. */
t('Y4', 'topology agrees with the centre the atlas GATES table records, for all 64',
  Array.from({ length: 64 }, (_, i) => i + 1)
    .filter(g => (ATLAS.GATES[g] || [])[1] !== TOPO.centerOf(g))
    .map(g => g + ': atlas ' + (ATLAS.GATES[g] || [])[1] + ' vs topology ' + TOPO.centerOf(g)), []);
t('Y5', 'both gates of every channel are real gates',
  TOPO.PAIRS.filter(k => { const q = k.split('-').map(Number);
    return q.length !== 2 || !TOPO.CENTER_OF[q[0]] || !TOPO.CENTER_OF[q[1]]; }), []);
t('Y6', 'channel keys are written low-high, which is what channelKey produces',
  TOPO.PAIRS.filter(k => { const q = k.split('-').map(Number); return TOPO.channelKey(q[1], q[0]) !== k; }), []);

/* THE HALF THAT MAKES THE SPLIT WORTH ANYTHING. Topology may not describe.
   A name, a theme or a meaning appearing in here means the two halves have
   started merging back, and it would look completely harmless. */
t('Y7', 'hd-topology carries no writing at all',
  (() => { const src = fs.readFileSync(path.join(repo, 'app', 'hd-topology.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
    const strings = [...src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map(m => m[1]);
    return strings.filter(t => t.trim().split(/\s+/).length >= 4); })(), []);

/* And the direction: mechanics may not read interpretation. These two used to
   and were the last declared crossings in the build. */
t('Y8', 'neither hd-composite nor hd-circle names the atlas any more',
  ['hd-composite.js', 'hd-circle.js'].filter(f =>
    /\bHDAtlas\b|\batlas\b/.test(fs.readFileSync(path.join(repo, 'app', f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' '))), []);

t('C35', 'none of the moved sentences is still written into hd-composite',
  ['Is there something the two of you do together', 'The same wiring twice is easy to mistake',
   'is in the room, and is that welcome to both', 'A thing you only do in company',
   'You both reach for the same half', 'If this reads as a gap, whose idea was it',
   'The tradition has no separate reading']
    .filter(q => COMPOSITE_SRC.indexOf(q) !== -1), []);

/* The channel table is declared once. This is the row that keeps it that way:
   the module reads hd-atlas, the app has its own HD_CHANNELS literal, and a
   build where those two disagree is a build where the bodygraph and the
   composite are describing different systems. */
const appSrc = fs.readFileSync(path.join(repo, 'app', 'inCommonApp v2.dc.html'), 'utf8');
const hdLine = /HD_CHANNELS = (\[\[[\s\S]*?\]\]);/.exec(appSrc);
if (!hdLine) {
  t('C31', 'the app HD_CHANNELS table can be read', 'not found', 'found');
} else {
  const appPairs = JSON.parse(hdLine[1].replace(/'/g, '"'))
    .map(c => [c[0], c[1]].sort((x, y) => x - y).join('-')).sort();
  const modPairs = HDC.channelPairs(TOPO).map(c => c.key).sort();
  t('C31', 'the app and the atlas describe the same thirty six channels', appPairs, modPairs);
}

/* ------------------------------------------------------- W: the wheel edges */

const WH = require(path.join(repo, 'app', 'hd-wheel.js'));

/* The app keeps its own literal as a fallback. This sweeps both at every
   thousandth of a degree, which is the resolution the spec asks boundary cases
   to be tested at, and would catch a drift of one entry in the table. */
(function () {
  const m = /HD_WHEEL = (\[[^\]]*\]);/.exec(appSrc);
  const appWheel = m ? JSON.parse(m[1]) : null;
  t('W1', 'the app fallback table and the module agree, entry for entry', appWheel, WH.WHEEL);
  let mismatch = 0;
  if (appWheel) {
    const n360 = x => ((x % 360) + 360) % 360;
    for (let x = 0; x < 360; x += 0.001) {
      const off = n360(x - 302), i = Math.min(63, Math.floor(off / 5.625)), within = off - i * 5.625;
      const appG = appWheel[i], appL = Math.min(6, Math.floor(within / 0.9375) + 1);
      const r = WH.gateLine(x);
      if (r.gate !== appG || r.line !== appL) { mismatch++; break; }
    }
  }
  t('W2', 'and agree at every thousandth of a degree around the wheel', mismatch, 0);
})();

t('W3', 'sixty four gates, each appearing once', new Set(WH.WHEEL).size, 64);
t('W4', 'a gate is 5.625 degrees and a line is 0.9375', [WH.GATE_DEG, WH.LINE_DEG], [5.625, 0.9375]);
t('W5', 'gate 41 opens the wheel at 302 degrees', [WH.WHEEL[0], WH.gateStart(41)], [41, 302]);

/* THE TIE BREAK. A boundary belongs to what begins there. */
t('W6', 'a longitude exactly on a gate boundary belongs to the gate that begins there',
  (() => { const r = WH.gateLine(302); return [r.gate, r.line]; })(), [41, 1]);
t('W7', 'and a thousandth of a degree below it belongs to the gate before',
  (() => { const r = WH.gateLine(302 - 0.001); return [r.gate, r.line]; })(), [60, 6]);
t('W8', 'a longitude exactly on a line boundary belongs to the line that begins there',
  (() => { const r = WH.gateLine(302 + WH.LINE_DEG); return [r.gate, r.line]; })(), [41, 2]);
t('W9', 'and a thousandth below stays in the line before',
  (() => { const r = WH.gateLine(302 + WH.LINE_DEG - 0.001); return [r.gate, r.line]; })(), [41, 1]);
t('W10', 'the rule holds at every one of the sixty four gate boundaries',
  WH.WHEEL.filter((g, i) => WH.gateLine(WH.norm360(302 + i * WH.GATE_DEG)).gate !== g).length, 0);
t('W11', 'and at every line boundary inside a gate',
  (() => { let bad = 0;
    for (let i = 0; i < 64; i++) for (let l = 0; l < 6; l++) {
      const r = WH.gateLine(WH.norm360(302 + i * WH.GATE_DEG + l * WH.LINE_DEG));
      if (r.gate !== WH.WHEEL[i] || r.line !== l + 1) bad++;
    } return bad; })(), 0);
t('W12', 'a longitude below zero and one above 360 resolve the same as the wrapped value',
  [WH.gateLine(-58).gate, WH.gateLine(662).gate], [WH.gateLine(302).gate, WH.gateLine(302).gate]);

/* ------------------------------------------------------ D: the design solve */

const AS = require(path.join(repo, 'app', 'arc-solver.js'));

/* The app's own Sun, copied here rather than imported, because the point of
   these rows is the SOLVER: given a longitude function, does it land on the
   arc. The app's function is exercised through the app in the browser. */
const RAD = Math.PI / 180;
const sunLon = tt => {
  const M = AS.norm360(357.5291 + 0.98560028 * tt), Ls = AS.norm360(280.459 + 0.98564736 * tt);
  return AS.norm360(Ls + 1.915 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD));
};
const t2000 = d => d.getTime() / 86400000 + 2440587.5 - 2451545.0;

(function () {
  let solved = 0, worstResidual = 0, worstIter = 0, minDays = 999, maxDays = 0, cases = 0;
  for (let y = 1930; y <= 2030; y += 5) {
    for (let mo = 0; mo < 12; mo++) {
      const tp = t2000(new Date(Date.UTC(y, mo, 15, 12)));
      const d = AS.designMoment(sunLon, tp);
      cases++;
      if (d.solved) solved++;
      worstResidual = Math.max(worstResidual, d.residual || 0);
      worstIter = Math.max(worstIter, d.iterations);
      minDays = Math.min(minDays, d.daysBefore);
      maxDays = Math.max(maxDays, d.daysBefore);
    }
  }
  t('D1', 'the design moment solves for every month of a hundred years', [solved, cases], [cases, cases]);
  tTrue('D2', 'to under one arcsecond', worstResidual <= AS.ARCSEC);
  tTrue('D3', 'and the iteration count stays bounded, so a bad bracket cannot run away', worstIter <= 30);
  /* The number the old constant claimed was universal. It is not: the Earth is
     fastest at perihelion and slowest at aphelion, so the same 88 degrees takes
     from about 86.6 to about 92 days. */
  tTrue('D4', 'the true offset is not a constant, and spans more than five days',
    minDays < 87 && maxDays > 91.5);
  tTrue('D5', 'so the old flat 88.36 days sits outside the true range for much of the year',
    88.36 < maxDays - 1 || 88.36 > minDays + 1);
})();

t('D6', 'a target the bracket does not contain is reported, never guessed at',
  AS.solve(sunLon, 0, 0, 1).bracketed, false);
t('D7', 'the solver reports how many halvings it took', AS.solve(sunLon, sunLon(40), 30, 50).iterations > 0, true);

/* Retrograde bodies cross the same longitude more than once. The synthetic
   wobble stands in for one, because the point is that the scan finds every
   crossing rather than the first: reporting one date for a three pass return is
   a false statement about when something happens. */
(function () {
  const wobble = tt => AS.norm360(tt * 0.03 + 8 * Math.sin(tt / 60));
  const target = wobble(500);
  const r = AS.crossings(wobble, target, 400, 700, { step: 2 });
  tTrue('D8', 'a retrograde style path returns every crossing, not the first', r.count >= 2);
  tTrue('D9', 'and says so, so a multi pass event is never reported as one date', r.multiPass === true);
  tTrue('D10', 'every returned crossing actually sits on the target',
    r.crossings.every(c => Math.abs(AS.delta(wobble(c.t), target)) <= AS.ARCSEC * 2));
})();

/* ------------------------------------------------- E: the minor bodies */

/* WHY REAL VECTORS LIVE IN A TEST FILE.

   Chiron is fitted rather than derived, and a fit is only as good as the thing
   it was fitted to. These are the positions it was fitted against: NASA JPL
   Horizons, target 2060 Chiron (1977 UB), geocentric apparent ecliptic
   longitude at 500@399, two year steps, retrieved 2026-08-27. Public domain.

   Keeping them here means the claim on the screen ("good to about a degree")
   is a measurement anybody can re-run, and it means the next change to those
   elements has to beat a number rather than sound convincing. It also fixes the
   method for the bodies that come after: publish elements, hold a and n to
   Kepler, fit only the phase and the slow angles, then prove it here. */
const CHIRON_JPL = [
  ['1900-01-01', 258.8961931], ['1902-01-01', 277.4825704], ['1904-01-01', 292.4419058], ['1906-01-01', 304.9255667],
  ['1908-01-01', 315.5284594], ['1910-01-01', 324.9225919], ['1912-01-01', 333.3614293], ['1914-01-01', 341.2092696],
  ['1916-01-01', 348.5799246], ['1918-01-01', 355.6878245], ['1920-01-01', 2.6090909], ['1922-01-01', 9.5129257],
  ['1924-01-01', 16.5126473], ['1926-01-01', 23.771977], ['1928-01-01', 31.4639692], ['1930-01-01', 39.7820458],
  ['1932-01-01', 49.0355906], ['1934-01-01', 59.5902861], ['1936-01-01', 72.1510524], ['1938-01-01', 87.6187395],
  ['1940-01-01', 107.5740896], ['1942-01-01', 133.5677022], ['1944-01-01', 165.8119063], ['1946-01-01', 200.1685677],
  ['1948-01-01', 230.8735609], ['1950-01-01', 255.7772883], ['1952-01-01', 275.2928192], ['1954-01-01', 290.9917258],
  ['1956-01-01', 303.8419802], ['1958-01-01', 314.8418536], ['1960-01-01', 324.4162483], ['1962-01-01', 333.0771038],
  ['1964-01-01', 340.9995984], ['1966-01-01', 348.4656208], ['1968-01-01', 355.5727117], ['1970-01-01', 2.5203639],
  ['1972-01-01', 9.4066165], ['1974-01-01', 16.3890188], ['1976-01-01', 23.5901457], ['1978-01-01', 31.1585721],
  ['1980-01-01', 39.2987747], ['1982-01-01', 48.2514717], ['1984-01-01', 58.4541942], ['1986-01-01', 70.4272865],
  ['1988-01-01', 85.1499928], ['1990-01-01', 103.8474663], ['1992-01-01', 128.3242598], ['1994-01-01', 159.2249635],
  ['1996-01-01', 193.590876], ['1998-01-01', 225.5148956], ['2000-01-01', 251.560376], ['2002-01-01', 272.1647272],
  ['2004-01-01', 288.4729772], ['2006-01-01', 301.9195415], ['2008-01-01', 313.2163084], ['2010-01-01', 323.115295],
  ['2012-01-01', 331.9022106], ['2014-01-01', 339.9724975], ['2016-01-01', 347.4674679], ['2018-01-01', 354.6419778],
  ['2020-01-01', 1.5963378], ['2022-01-01', 8.5058845], ['2024-01-01', 15.4625666], ['2026-01-01', 22.6001147],
  ['2028-01-01', 30.0609939], ['2030-01-01', 38.0254016], ['2032-01-01', 46.7789981], ['2034-01-01', 56.642849],
  ['2036-01-01', 68.206156], ['2038-01-01', 82.1812324], ['2040-01-01', 99.8836888], ['2042-01-01', 122.8302258],
  ['2044-01-01', 152.3029943], ['2046-01-01', 186.2632931], ['2048-01-01', 219.0450718], ['2050-01-01', 246.5876012],
  ['2052-01-01', 268.2943102], ['2054-01-01', 285.6091302], ['2056-01-01', 299.609362], ['2058-01-01', 311.4311173],
  ['2060-01-01', 321.5766473]
];

(function () {
  const g = { window: {} };
  const mbPath = path.join(repo, "app", "minor-bodies-ephemeris.js");
  const src = fs.readFileSync(mbPath, "utf8");
  const fn = new Function("window", "localStorage", src);
  fn(g.window, undefined);
  const MBE = g.window.MinorBodiesEphemeris;
  const n360 = x => ((x % 360) + 360) % 360;
  const sep = (a, b) => { const d = Math.abs(n360(a - b)); return d > 180 ? 360 - d : d; };

  t("E1", "the minor bodies module supplies Chiron", typeof MBE.longitudeOn, "function");

  let sum = 0, worst = 0, worstAt = "", over1 = 0;
  CHIRON_JPL.forEach(([d, lon]) => {
    const got = MBE.longitudeOn("Chiron", new Date(d + "T00:00:00Z"));
    const e = sep(got, lon);
    sum += e * e;
    if (e > worst) { worst = e; worstAt = d; }
    if (e > 1) over1++;
  });
  const rms = Math.sqrt(sum / CHIRON_JPL.length);

  t("E2", "every JPL reference position is matched within one degree, 1900 to 2060",
    { samples: CHIRON_JPL.length, over1deg: 0 }, { samples: CHIRON_JPL.length, over1deg: over1 });
  tTrue("E3", "and the worst case is the one recorded in the elements (" + worst.toFixed(3) + " deg on " + worstAt + ")",
    Math.abs(worst - MBE.elements.Chiron.fit.worst) < 0.01);
  tTrue("E4", "as is the RMS (" + rms.toFixed(3) + " deg)",
    Math.abs(rms - MBE.elements.Chiron.fit.rms) < 0.01);

  /* THE RULE THAT KEEPS A FIT AN ORBIT. Letting the semi-major axis float gave
     a better residual and an object at 11.37 AU, which is not Chiron. */
  const c = MBE.elements.Chiron;
  t("E5", "the semi-major axis is the published one, not a fitted one", c.a, 13.6371);
  tTrue("E6", "and the mean motion still obeys Kepler third law",
    Math.abs(c.n - 0.9856076686 / (c.a * Math.sqrt(c.a))) < 1e-9);
  t("E7", "only the phase and the slow angles were free", c.fit.free.sort(), ["L0", "e", "varpi"].sort());
  t("E8", "the fit records where its reference came from and when",
    [/JPL Horizons/.test(c.fit.source), c.fit.retrieved], [true, "2026-08-27"]);

  /* Accuracy decides which claims the body has earned, and the app reads this
     same number to decide whether a degree symbol may be printed. */
  tTrue("E9", "the stated accuracy is not better than the measured worst case",
    c.accuracyDeg >= worst);
  const appSrcE = fs.readFileSync(path.join(repo, "app", "inCommonApp v2.dc.html"), "utf8");
  /* The expanded chart addresses these five by registry id as well as by name,
     so both spellings have to be withheld or one route prints the symbol. */
  tTrue("E10", "and the app withholds a degree symbol from every unpinned body, by name and by registry id",
    appSrcE.indexOf("DEGREE_SAFE_EXCEPT = ['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta', 'chiron', 'ceres', 'pallas', 'juno', 'vesta']") > -1 &&
    appSrcE.indexOf('plHasSabian: !!sb && this.degreeSafe(rk)') > -1);
  tTrue("E11", "the retired single anchor model is gone from the app, so one body has one answer",
    appSrcE.indexOf("chironEl()") === -1 && appSrcE.indexOf("CHIRON_EL") === -1);
})();

/* ------------------------------------------------- P: the People Library */

const PL = require(path.join(repo, 'app', 'people-library.js'));

function memStore2() {
  const mem = {};
  return { mem: mem, getItem: k => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
}

/* The chart engine is injected. These tests never compute a real chart: what is
   under test is the store, and a store that needed an ephemeris to be tested
   would only ever be tested in a browser. */
const stubCompute = o => ({
  longitudes: { Sun: 350.1, Moon: 120.5 }, gates: [34, 20], channels: ['20-34'], centers: ['Throat'],
  moon: 120.5, ascendant: 88.2, midheaven: 178.4, houses: [1, 2, 3], house_rulers: { 1: 'Mars' },
  personal_points: { vertex: 12.3 }
});

(function () {
  const st = memStore2();
  PL.configure({ store: st, compute: stubCompute });

  /* SHA-256, against the two vectors everybody knows, because a digest that is
     subtly wrong produces a cache that silently never hits. */
  t('P1', 'the digest matches the published empty-string vector',
    PL.sha256hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  t('P2', 'and the published abc vector',
    PL.sha256hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

  const timed = { display_name: 'Sam', birth_date: '1990-03-11', birth_time: '14:20',
    birth_lat: 41.8781, birth_lon: -87.6298, tz_offset: -6, birth_tz: 'America/Chicago' };
  const added = PL.add('prof1', timed);
  t('P3', 'a person can be saved', [added.ok, added.record.display_name], [true, 'Sam']);

  /* NO INVENTED PLACEMENTS. The prompt asks for a test that asserts this and it
     is the most important row in the group: an estimate written into a record
     outlives the label that explained it. */
  const un = PL.add('prof1', { display_name: 'Alex', birth_date: '1988-11-30' });
  const st2 = un.record.computed_state;
  t('P4', 'an unknown birth time writes null into every time dependent field, never noon',
    PL.TIME_DEPENDENT.map(k => st2[k]), PL.TIME_DEPENDENT.map(() => null));
  t('P5', 'and the record says the time is unknown without being told',
    [un.record.time_unknown, un.record.birth_time, st2.time_unknown], [true, null, true]);
  tTrue('P6', 'while the time independent part is still computed', !!st2.longitudes && !!st2.gates);
  t('P7', 'a known time keeps its time dependent fields',
    [added.record.computed_state.ascendant, added.record.computed_state.moon], [88.2, 120.5]);

  /* THE HASH IS OVER THE MOMENT, NOT THE WALL CLOCK. The prompt asks for
     determinism across equivalent inputs expressed in different timezones, and
     this is what makes the pair cache hit at all. */
  const chi = { birth_date: '1990-03-11', birth_time: '14:20', birth_lat: 41.8781, birth_lon: -87.6298, tz_offset: -6 };
  const utc = { birth_date: '1990-03-11', birth_time: '20:20', birth_lat: 41.8781, birth_lon: -87.6298, tz_offset: 0 };
  const tky = { birth_date: '1990-03-12', birth_time: '05:20', birth_lat: 41.8781, birth_lon: -87.6298, tz_offset: 9 };
  t('P8', 'one birth moment expressed in three timezones is one hash',
    [PL.chartHash(chi) === PL.chartHash(utc), PL.chartHash(utc) === PL.chartHash(tky)], [true, true]);
  tTrue('P9', 'a minute later is a different hash', PL.chartHash(chi) !== PL.chartHash(
    { birth_date: '1990-03-11', birth_time: '14:21', birth_lat: 41.8781, birth_lon: -87.6298, tz_offset: -6 }));
  tTrue('P10', 'and an unknown time is not the same record as a known one',
    PL.chartHash({ birth_date: '1990-03-11', birth_lat: 41.8781, birth_lon: -87.6298 }) !== PL.chartHash(chi));
  tTrue('P11', 'the hash carries no name, label or note',
    PL.chartHash(Object.assign({ display_name: 'Sam', relationship_label: 'brother' }, chi)) === PL.chartHash(chi));

  /* NOTES ARE OFF, AND OFF IS IN THE WRITER. */
  t('P12', 'notes are off on a new record without any caller saying so', added.record.notes_enabled, false);
  t('P13', 'and writing a note while they are off is refused',
    PL.setNotes('prof1', added.record.id, 'private').reason, 'notes_disabled');
  PL.enableNotes('prof1', added.record.id, true);
  PL.setNotes('prof1', added.record.id, 'she hates being read about');
  tTrue('P14', 'with notes on, a note is held', PL.get('prof1', added.record.id).notes.length > 0);
  const off = PL.enableNotes('prof1', added.record.id, false);
  t('P15', 'turning notes off destroys them rather than hiding them',
    [off.notesDestroyed, PL.get('prof1', added.record.id).notes], [true, null]);

  /* THE FOUR LAYERS COME BACK AS FOUR KEYS. */
  PL.enableNotes('prof1', added.record.id, true);
  PL.setNotes('prof1', added.record.id, 'her words');
  const d = PL.display('prof1', added.record.id,
    { calculated_fact: 'Sun at 350 degrees', traditional: 'the tradition says', synthesis: 'a hypothesis' });
  t('P16', 'the four truth layers are four separate keys, never joined',
    [d.calculated_fact, d.user_words, d.traditional, d.synthesis],
    ['Sun at 350 degrees', 'her words', 'the tradition says', 'a hypothesis']);
  t('P17', 'and the reader own words go quiet when notes are off',
    (() => { PL.enableNotes('prof1', added.record.id, false);
      return PL.display('prof1', added.record.id, {}).user_words; })(), null);

  /* HARD DELETE, IN ONE WRITE. */
  PL.enableNotes('prof1', added.record.id, true);
  PL.setNotes('prof1', added.record.id, 'to be destroyed');
  const gone = PL.remove('prof1', added.record.id);
  t('P18', 'deleting a person destroys the notes in the same write',
    [gone.ok, gone.notesDestroyed, PL.get('prof1', added.record.id)], [true, true, null]);
  tTrue('P19', 'and nothing of the deleted record survives in the raw store',
    (st.mem[PL.KEY] || '').indexOf('to be destroyed') === -1);

  /* THE CAP REFUSES, IT DOES NOT TRIM. */
  const st3 = memStore2();
  PL.configure({ store: st3, compute: stubCompute });
  let last = null;
  for (let i = 0; i < PL.MAX_PEOPLE + 3; i++) {
    last = PL.add('prof2', { display_name: 'P' + i, birth_date: '1990-01-01',
      birth_time: '0' + (i % 9) + ':00', birth_lat: 1 + i, birth_lon: 2 + i, tz_offset: 0 });
  }
  t('P20', 'the cap refuses the add rather than dropping somebody to make room',
    [PL.count('prof2'), last.ok, last.reason], [PL.MAX_PEOPLE, false, 'full']);

  /* Records do not cross between profiles: this app's answer to owner_user_id. */
  t('P21', 'records belong to one profile and do not cross', PL.count('prof3'), 0);

  /* The same birth arriving twice is one person, not two. */
  const st4 = memStore2();
  PL.configure({ store: st4, compute: stubCompute });
  PL.add('p', timed);
  const dup = PL.add('p', Object.assign({}, timed, { display_name: 'Samuel' }));
  t('P22', 'the same birth moment saved twice updates rather than duplicating',
    [PL.count('p'), !!dup.duplicateOf, PL.list('p')[0].display_name], [1, true, 'Samuel']);

  /* One store, not two: the contacts that shipped on 27 August move across. */
  const st5 = memStore2();
  st5.mem['incommon.friends'] = JSON.stringify([
    { id: 'f1', source: 'card', card: { n: 'Rae', d: '1991-05-02', t: '09:10', la: 51.5, lo: -0.12, tz: 'Europe/London', to: 0 } },
    { id: 'f2', source: 'manual', card: { n: 'Jo', d: '1985-12-19', t: '', la: 40.7, lo: -74, tz: 'America/New_York', to: -5 } }
  ]);
  PL.configure({ store: st5, compute: stubCompute });
  const mig = PL.migrateLegacy('p');
  t('P23', 'the older contacts store migrates into the library', [mig.migrated, PL.count('p')], [2, 2]);
  t('P24', 'and a contact with no birth time arrives with its time flagged unknown',
    PL.list('p').filter(r => r.display_name === 'Jo')[0].time_unknown, true);
  tTrue('P25', 'the legacy key is left in place rather than deleted under the reader',
    !!st5.mem['incommon.friends']);

  /* No streaks, no counters, no completeness. The module cannot render a guilt
     trip out of a number it does not expose. */
  t('P26', 'the store exposes no last-viewed, streak or completeness field',
    Object.keys(PL.list('p')[0] || {}).filter(k => /streak|last_view|viewed|complete|score/i.test(k)), []);
})();

/* ------------------------------------------------------ Q: the pair cache */

const PC = require(path.join(repo, 'app', 'pair-cache.js'));

(function () {
  const st = memStore2();
  PC.configure({ store: st, sha256: PL.sha256hex, stateVersion: 1 });
  PC.invalidate(1);
  PC.resetMetrics();

  const A1 = 'aaaa1111', B1 = 'bbbb2222';
  t('Q1', 'the pair key is order independent, so (A,B) and (B,A) are one entry',
    PC.pairKey(A1, B1), PC.pairKey(B1, A1));
  tTrue('Q2', 'and a different pair is a different key', PC.pairKey(A1, 'cccc3333') !== PC.pairKey(A1, B1));

  let computes = 0;
  const build = () => { computes++; return { electromagnetic: ['20-34'], counts: { electromagnetic: 1 } }; };
  const first = PC.openOne(A1, B1, build);
  const second = PC.openOne(B1, A1, build);
  t('Q3', 'the second look at the same pair is served from the cache',
    [computes, first.cached, second.cached], [1, false, true]);

  /* THE GUARD. A group of twelve is sixty six pairs, and the reason this layer
     was built before the composite is that a grid rendered eagerly asks for all
     of them. openOne takes one pair, so a caller cannot hand it a list. */
  const opened = 3;
  computes = 0;
  const people = [];
  for (let i = 0; i < 12; i++) people.push('hash' + i);
  for (let i = 0; i < opened; i++) PC.openOne(people[i], people[i + 1], build);
  t('Q4', 'a twelve person group that opens three cells computes three composites, never sixty six',
    computes, opened);
  t('Q5', 'and the arithmetic of the cap is the reason: twelve people is sixty six pairs',
    (12 * 11) / 2, 66);

  /* Structure only. Prose is generated per view and never stored, which is what
     keeps the model cost out of a group view. */
  let refused = false;
  try { PC.put(A1, 'dddd4444', { narrative: 'a generated paragraph' }); } catch (e) { refused = true; }
  t('Q6', 'the cache refuses to store generated prose', refused, true);
  tTrue('Q7', 'and no narrative reaches the raw store',
    (st.mem[PC.KEY] || '').indexOf('generated paragraph') === -1);

  /* No name, label or note may reach a key that is designed to be shared. */
  tTrue('Q8', 'the key is built from the two hashes and nothing else',
    PC.pairKey('aaaa1111', 'bbbb2222') === PC.pairKey('aaaa1111', 'bbbb2222'));

  const s1 = PC.stats();
  t('Q9', 'the cache reports hit rate, entries, bytes and generations avoided',
    ['hitRate', 'entries', 'bytes', 'generationsAvoided'].map(k => typeof s1[k]),
    ['number', 'number', 'number', 'number']);
  tTrue('Q10', 'and it counts a generation avoided when it hits', s1.generationsAvoided >= 1);

  /* A bump in the state version means every stored readout was produced by
     arithmetic that no longer exists. */
  PC.invalidate(2);
  t('Q11', 'bumping computed_state_version empties the cache', PC.stats().entries, 0);
  const after = PC.openOne(A1, B1, build);
  t('Q12', 'so the pair is computed again under the new version', after.cached, false);
})();

/* ---------------------------------------------------------- A: the counting */

function memStore() {
  const mem = {};
  return { mem: mem, getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
}
let store = memStore();
AN.configure({ store: store });

t('A1', 'it is off before anybody says otherwise', AN.isOptedIn(), false);
t('A2', 'and it writes nothing at all while it is off', [AN.emit('chart_generated'), Object.keys(store.mem).length], [false, 0]);
AN.optIn(true);
t('A3', 'a name from the list is counted', AN.emit('chart_generated'), true);
t('A4', 'a name that is not on the list is dropped', AN.emit('journal_text'), false);
/* The shape is the promise: there is no second parameter, so a caller that
   tries to attach content attaches nothing. */
AN.emit('layer3_expanded', { text: 'my private journal line', birthDate: '1992-07-02' });
const raw = store.mem[AN.AGG_KEY] || '';
tTrue('A5', 'content handed to emit reaches storage nowhere', raw.indexOf('private') === -1 && raw.indexOf('1992-07-02') === -1);
t('A6', 'what was stored is a day, a name and a number', Object.keys(JSON.parse(raw).days).length, 1);
AN.sessionEnd(420000);
t('A7', 'a session length is stored as a wide bucket, never a timestamp', Object.keys(AN.snapshot().sessions), ['5m to 15m']);
t('A8', 'return days are counted from the day stamps already held', AN.snapshot().dayCount, 1);
const payload = AN.exportPayload();
t('A9', 'the export carries no field the snapshot does not', Object.keys(payload).sort(),
  ['app', 'dayCount', 'events', 'firstDay', 'gauges', 'generatedAt', 'histograms', 'lastDay', 'schema', 'sessions']);
tTrue('A10', 'and no content of any kind', JSON.stringify(payload).indexOf('private') === -1);
t('A11', 'the endpoint is dark and transmit refuses', AN.transmit().sent, false);
t('A12', 'the module raises no notification of its own', AN.NOTIFIES, false);
/* A mention is not a call. The header explains why there is no notification
   here, and a test that banned the word would have banned the explanation, so
   what is asserted is the absence of every way the API is reached. */
tTrue('A13', 'and never reaches the notification API',
  !/new\s+Notification|Notification\s*\.|showNotification|requestPermission/.test(
    fs.readFileSync(path.join(repo, 'app', 'analytics.js'), 'utf8')));
AN.optIn(false);
t('A14', 'switching it off deletes what was counted, rather than keeping it', store.mem[AN.AGG_KEY], undefined);
t('A15', 'and the export goes quiet with it', AN.exportPayload(), null);
t('A16', 'every event name carries a one line description', Object.keys(AN.EVENTS).filter(k => !AN.EVENTS[k]), []);

/* The doc is the schema written out, so the two cannot drift: a name added to
   the module and not to the page fails here rather than shipping undocumented. */
const DOC = path.join(repo, 'docs', 'ANALYTICS-EVENTS.md');
if (!fs.existsSync(DOC)) {
  t('A17', 'docs/ANALYTICS-EVENTS.md lists every event name', 'missing', 'present');
} else {
  /* Scoped to the events table alone. The page carries a second table for the
     histogram buckets now, and a scan of every backticked row in the file would
     read those as event names and fail on a page that is correct. */
  const whole = fs.readFileSync(DOC, 'utf8');
  const from = whole.indexOf('## The events');
  const rest = from === -1 ? '' : whole.slice(from + 1);
  const nextHead = rest.indexOf('\n## ');
  const doc = nextHead === -1 ? rest : rest.slice(0, nextHead);
  const listed = (doc.match(/^\| `([a-z0-9_]+)` \|/gm) || []).map(l => l.replace(/^\| `/, '').replace(/` \|$/, '')).sort();
  t('A17', 'docs/ANALYTICS-EVENTS.md lists every event name and no others', listed, Object.keys(AN.EVENTS).sort());
}


/* ------------------------------------------------------ I: iching.js -------
 *
 * The registry and the casting engine, gated here rather than only in the
 * browser harness, because a distribution check is arithmetic and arithmetic
 * belongs where it can be run in a second instead of at the tail of a run that
 * takes twenty five minutes.
 */

/* The King Wen anchors, bottom line first, 1 for yang. Twelve figures a reader
   of the book would notice first, so a reversed sequence or a flipped bit
   order goes red here rather than looking plausible on a page. */
const ANCH = { 1: '111111', 2: '000000', 11: '111000', 12: '000111', 29: '010010',
  30: '101101', 51: '100100', 52: '001001', 57: '011011', 58: '110110',
  63: '101010', 64: '010101' };
const anchorBad = Object.keys(ANCH).filter(n => IC.bits(+n).join('') !== ANCH[n]);
t('I1', 'The King Wen anchors are where the book puts them', anchorBad, []);

const seen = {}, dupes = [];
IC.all().forEach(h => { const k = h.bits.join(''); if (seen[k]) dupes.push(seen[k] + ' and ' + h.number); else seen[k] = h.number; });
t('I2', 'Sixty four figures, sixty four distinct structures, no duplicates',
  { count: 64, distinct: 64, dupes: [] },
  { count: IC.count, distinct: Object.keys(seen).length, dupes });

/* Every figure carries every part. An entry short a judgment or a line reads
   as a gap on the page and as nothing at all in a grep. */
const thin = [];
IC.all().forEach(h => {
  if (!h.name || !h.pinyin) thin.push(h.number + ": name");
  if (!h.judgment || h.judgment.length < 40) thin.push(h.number + ": judgment");
  if (!h.image || h.image.length < 30) thin.push(h.number + ": image");
  if (!h.movement || h.movement.length < 20) thin.push(h.number + ": movement");
  if (h.lines.length !== 6) thin.push(h.number + ": line count");
  h.lines.forEach((l, i) => { if (!l || l.length < 12) thin.push(h.number + " line " + (i + 1)); });
});
t('I3', 'Every figure carries a judgment, an image, a question and six lines', thin, []);

/* THE ROW THIS MODULE EXISTS FOR. Coins and yarrow are two different oracles.
   The stalks change less often, and when they change they are three times more
   likely to be yang giving way than yin hardening; whole commentaries rest on
   that asymmetry. A build that rolled six to nine from one table would pass
   every other row here and be answering with a third oracle nobody has ever
   used, so the weights are asserted AND the casts are counted: a weights table
   nothing reads is decoration. */
const tally = m => {
  const c = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let i = 0; i < 5000; i++) IC.cast({ method: m, seed: i * 7919 + 13 }).values.forEach(v => { c[v]++; });
  const n = 30000;
  return { six: c[6] / n, seven: c[7] / n, eight: c[8] / n, nine: c[9] / n };
};
const co = tally('coins'), ya = tally('yarrow');
const near = (a, b) => Math.abs(a - b) < 0.01;
t('I4', 'Three coins: 6 and 9 one time in eight, 7 and 8 three times in eight',
  { six: true, seven: true, eight: true, nine: true },
  { six: near(co.six, 0.125), seven: near(co.seven, 0.375), eight: near(co.eight, 0.375), nine: near(co.nine, 0.125) });
t('I5', 'Yarrow stalks: the older ritual, and its own asymmetric odds',
  { six: true, seven: true, eight: true, nine: true },
  { six: near(ya.six, 0.0625), seven: near(ya.seven, 0.3125), eight: near(ya.eight, 0.4375), nine: near(ya.nine, 0.1875) });
t('I6', 'The stalks are not the coins under another name',
  { weightsDiffer: true, changesLess: true, favoursYangGivingWay: true },
  { weightsDiffer: JSON.stringify(IC.METHODS.coins.weights) !== JSON.stringify(IC.METHODS.yarrow.weights),
    changesLess: (ya.six + ya.nine) < (co.six + co.nine),
    favoursYangGivingWay: ya.nine > ya.six * 2.5 });

/* A kept reading is a claim about a cast, so the cast has to be reproducible
   from the seed that is kept beside it. */
const r1 = IC.read({ question: 'x', method: 'coins', seed: 424242 });
const r2 = IC.read({ question: 'x', method: 'coins', seed: 424242 });
t('I7', 'A seeded cast redraws identically',
  { values: r1.values.join(), primary: r1.primary.number },
  { values: r2.values.join(), primary: r2.primary.number });

/* Every reading has to resolve: a changing line must produce a second figure,
   and an unchanging cast must say so in a sentence rather than leaving a gap. */
const bad = [];
for (let i = 0; i < 4000; i++) {
  const r = IC.read({ question: 'q', method: i % 2 ? 'yarrow' : 'coins', seed: i * 104729 + 7 });
  if (!r.primary) { bad.push(i + ": no primary"); continue; }
  if (r.changing.length && !r.moved) bad.push(i + ": changing with no moved figure");
  if (!r.changing.length && r.moved) bad.push(i + ": moved figure with nothing changing");
  if (!r.changing.length && r.stillness.length < 20) bad.push(i + ': unchanging with no sentence saying so');
  if (r.changing.length && r.stillness !== '') bad.push(i + ': changing but claiming stillness');
  if (r.changingLines.length !== r.changing.length) bad.push(i + ": line readings do not match the changing lines");
}
t('I8', 'Four thousand readings across both methods, every one of them resolved', bad, []);

/* The cross link that is the reason both systems live in one app: Human Design
   took its wheel from this book, so hexagram N IS gate N. Asserted over all
   sixty four rather than trusting two registries to agree. */
const gateBad = IC.all().filter(h => h.gate !== h.number).map(h => h.number);
t('I9', 'Hexagram N is gate N, all sixty four of them', gateBad, []);

/* The room looks a figure up by number and by name, and the search is what the
   reader reaches for first. */
t('I10', 'A figure can be found by its number and by a word in its name',
  { byNumber: 49, byName: true, bogus: 0 },
  { byNumber: (IC.search('49')[0] || {}).number,
    byName: IC.search('creative').length > 0,
    bogus: IC.search('zzzz').length });

/* Nothing is quoted. Wilhelm and Baynes is in copyright and the page says the
   text is written for inCommon, so a phrase that is theirs and nobody else's
   appearing in the registry would make that sentence false. */
const WILHELM = ['perseverance furthers', 'remorse disappears', 'it furthers one to',
  'furthers one to cross', 'nothing that does not further', 'the superior man',
  'sublime success', 'supreme success', 'sublime perseverance'];
const wholeText = IC.all().map(h => [h.judgment, h.image, h.movement].concat(h.lines).join(' ')).join(' ').toLowerCase();
const quoted = WILHELM.filter(q => wholeText.indexOf(q) !== -1);
t('I11', 'No phrasing distinctive to the translation in copyright appears in the registry', quoted, []);

/* The other half of the same rule, and the reason I11 alone is not enough: a
   line can be copied without using any of those phrases. These are sentences
   that were in the registry and were rewritten, kept here as fixtures so a
   future edit cannot quietly put one back. */
const RESTORED = ['a jug of wine, a bowl of rice, earthenware',
  'oppressed by stone, and leans on thorns', 'were not as gorgeous as those of the servingmaid',
  'obstruction on obstruction', 'one kills three foxes in the field',
  'a pig covered with dirt, a wagon full of devils', 'no plain that does not slope',
  'climb the nine hills', 'the polestars can be seen at noon'];
const back = RESTORED.filter(q => wholeText.indexOf(q) !== -1);
t('I12', 'No line that was rewritten for this reason has come back', back, []);


/* ------------------------------------------------------- G: hd-circle.js */
/* Circle and the Ground it returns. Most of this group is not testing that a
   number came out right: it is testing that certain things CANNOT be said. The
   schema rows are the ones the brief asked for. The two that matter more are
   G20 and G23, because a forbidden field is easy to delete and easy to add
   back, while permutation invariance and an inert anchor are properties a
   future helper would have to actually break. */

const HDG = require(path.join(repo, 'app', 'hd-circle.js'));

const M = (id, name, gates, timeState) => ({ id, name, gates, timeState: timeState || 'known' });
const CIRCLE5 = [
  /* Ana holds 1 but not 8, and Cai holds 8: channel 1-8 is then one the group
     closes only together, which is the case a Ground exists to report. */
  M('a', 'Ana', [1, 10, 20, 34, 57]),
  M('b', 'Bo', [2, 14, 10, 34]),
  M('c', 'Cai', [20, 57, 34, 8]),
  M('d', 'Dee', [1, 10, 43, 23]),
  M('e', 'Efe', [34, 20, 61, 24])
];
const CIRCLE3 = CIRCLE5.slice(0, 3);
const G = HDG.circle(CIRCLE5, { atlas: ATLAS });

/* ---- the range refuses rather than trims ---- */
t('G1', 'two people is not a circle and is refused by name',
  (() => { const r = HDG.circle(CIRCLE5.slice(0, 2), { atlas: ATLAS }); return [r.ok, r.reason]; })(),
  [false, 'too_few']);
t('G2', 'six people is refused rather than trimmed to five',
  (() => { const r = HDG.circle(CIRCLE5.concat([M('f', 'Fi', [1])]), { atlas: ATLAS });
    return [r.ok, r.reason, r.given]; })(), [false, 'too_many', 6]);
t('G3', 'three and five are both circles', [HDG.circle(CIRCLE3, { atlas: ATLAS }).ok, G.ok], [true, true]);
t('G4', 'and nobody is dropped from the member list', G.members.length, 5);

/* ---- the Ground is mechanics, attributed ---- */
t('G5', 'a gate every member holds is reported as held by all',
  HDG.circle([M('x', 'X', [34]), M('y', 'Y', [34]), M('z', 'Z', [34])], { atlas: ATLAS }).gates.all, [34]);
t('G6', 'a gate only one member holds names that member',
  (G.gates.one.filter(r => r.gate === 43)[0] || {}).member, 'd');
t('G7', 'a gate some members hold names all of them',
  (G.gates.some.filter(r => r.gate === 20)[0] || {}).members, ['a', 'c', 'e']);
tTrue('G8', 'every gate lands in exactly one of all, some, one or nobody',
  G.counts.gatesHeldByAll + G.counts.gatesHeldBySome + G.counts.gatesHeldByOne + G.counts.gatesHeldByNobody === 64);

/* ---- channels: the point of a Ground is what only the group reaches ---- */
tTrue('G9', 'a channel one member closes alone is filed as closed alone and names them',
  G.channels.alone.some(r => r.key === '10-20' && r.members.indexOf('a') !== -1));
tTrue('G10', 'a channel the group closes only together names who brings each end',
  G.channels.together.length > 0 &&
  G.channels.together.every(r => r.brings && Object.keys(r.brings).length === 2 &&
    Object.keys(r.brings).every(k => Array.isArray(r.brings[k]))));
tTrue('G11', 'a channel closed only together is closed by nobody alone',
  G.channels.together.every(r => !r.members));
tTrue('G12', 'and every channel is filed exactly once',
  G.counts.channelsClosedAlone + G.counts.channelsClosedOnlyTogether + G.counts.channelsOpenToTheGroup === 36);
tTrue('G13', 'what the group cannot reach is reported rather than omitted', G.channels.open.length > 0);

/* ---- centres ---- */
tTrue('G14', 'centres are split by how many members define them, and the three lists cover the set',
  G.centers.everyMember.length + G.centers.someMember.length + G.centers.noMember.length === Object.keys(ATLAS.CENTERS).length);
tTrue('G15', 'the group defines at least what its members define alone',
  G.centers.everyMember.every(c => G.centers.asGroup.indexOf(c) !== -1));

/* ---- THE SCHEMA CONSTRAINT ---- */
const flatG = JSON.stringify(G);
const BANNED = /score|rating|rank|percent|compat|match|best|winner|strongest|weakest/i;
function keysDeep(v, out) {
  out = out || [];
  if (Array.isArray(v)) v.forEach(x => keysDeep(x, out));
  else if (v && typeof v === 'object') Object.keys(v).forEach(k => { out.push(k); keysDeep(v[k], out); });
  return out;
}
t('G16', 'no field anywhere in a Ground is named like a score', keysDeep(G).filter(k => BANNED.test(k)), []);
tTrue('G17', 'no percentage appears anywhere in a Ground', flatG.indexOf('%') === -1);
tTrue('G18', 'every count is about gates, channels or centres and none is about a member',
  Object.keys(G.counts).every(k => /^(gates|channels|centers)/.test(k)));
tTrue('G19', 'the module source declares no scoring helper either',
  !/function\s+(score|rank|rate|compare|best)/i.test(fs.readFileSync(path.join(repo, 'app', 'hd-circle.js'), 'utf8')));

/* ---- G20: THE PROOF THERE IS NO RANKING ----
   An absent field is easy to add back. This is the property: permuting the
   members permutes the member list and nothing else. Every permutation of five
   is checked, not a sample. */
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => permutations(arr.slice(0, i).concat(arr.slice(i + 1))).forEach(p => out.push([x].concat(p))));
  return out;
}
const strip = g => JSON.stringify({ gates: g.gates, channels: g.channels, centers: g.centers, counts: g.counts });
const baseline = strip(G);
const perms = permutations(CIRCLE5);
const drifted = perms.filter(p => strip(HDG.circle(p, { atlas: ATLAS })) !== baseline);
t('G20', 'permuting the members changes nothing but the member list (' + perms.length + ' permutations)',
  drifted.length, 0);
tTrue('G21', 'and the member list does follow the input order',
  HDG.circle(CIRCLE5.slice().reverse(), { atlas: ATLAS }).members.map(m => m.id).join('') === 'edcba');
t('G22', 'the Ground says the order is the given one', G.memberOrder, 'as given');

/* ---- G23 to G27: THERE IS NO SEAT ----
   This module had an anchor. It was passed in rather than computed, it carried
   permissions: 'none', and a test proved it was inert. All of that worked and
   all of it defended the wrong thing: permissions: 'none' is read by code, and
   a person reads five names with one of them singled out. So the seat is gone,
   and these five rows are what keep it gone. They are stricter than the rows
   that guarded the inert version, because there is now nothing to be careful
   with. */
/* centre and center are deliberately absent: in this codebase a centre is a
   bodygraph centre, which is a place in a chart and can never be a person. The
   rest are the words a distinguished member would plausibly be given. */
const SEATLIKE = /anchor|seat|lead|host|owner|primary|chair|captain|head|first|main|focus|perspective/i;
t('G23', 'no field anywhere in a Ground names a seat',
  keysDeep(G).filter(k => SEATLIKE.test(k)), []);
t('G24', 'an anchor passed in options is ignored rather than honoured',
  JSON.stringify(HDG.circle(CIRCLE5, { atlas: ATLAS, anchor: 'c' })), JSON.stringify(G));
t('G25', 'every member carries the same fields as every other, so none is distinguished by shape',
  new Set(G.members.map(m => Object.keys(m).sort().join(','))).size, 1);
t('G26', 'the module declares no anchor, in code or in export',
  (() => { const s = fs.readFileSync(path.join(repo, 'app', 'hd-circle.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
    return (s.match(/anchor/gi) || []); })(), []);
/* A shape lock. An anchor added back anywhere at the top level fails here even
   if somebody names it something this list did not think of. */
t('G27', 'the top level shape of a Ground is exactly this and nothing else',
  Object.keys(G).sort(),
  ['caution', 'centers', 'channels', 'counts', 'gates', 'memberOrder', 'members', 'ok', 'precision', 'size', 'version']);

/* ---- the safety sentence travels with the data ---- */
tTrue('G28', 'every Ground carries the group caution', G.caution === HDG.GROUP_CAUTION);
tTrue('G29', 'and the caution says it is not a measure of anybody',
  /not a measure of the group or of anybody in it/.test(HDG.GROUP_CAUTION));

/* ---- degrade explicitly ---- */
const halfKnown = HDG.circle([CIRCLE5[0], CIRCLE5[1], M('c', 'Cai', [20, 57], 'unknown')], { atlas: ATLAS });
t('G30', 'a member with no birth time is named rather than averaged away',
  [halfKnown.precision.full, halfKnown.precision.unknownMembers], [false, ['c']]);
tTrue('G31', 'and what that puts out of reach is listed', halfKnown.precision.timeDependent.length > 0);
t('G32', 'a member with no time is still in the Ground', halfKnown.members.length, 3);
t('G33', 'a fully timed circle says so plainly', G.precision.full, true);

/* ---- Between is the existing engine, not a second one ---- */
const btw = HDG.between(CIRCLE5[0], CIRCLE5[1], { atlas: ATLAS, composite: HDC });
tTrue('G34', 'Between returns what hd-composite returns, six states and all',
  btw !== null && ['electromagnetic', 'companionship', 'dominance', 'compromise', 'sharedGate', 'absent']
    .every(k => Array.isArray(btw[k])));
t('G35', 'Between agrees with calling hd-composite directly',
  JSON.stringify(btw), JSON.stringify(HDC.composite(CIRCLE5[0].gates, CIRCLE5[1].gates,
    { atlas: ATLAS, nameA: 'Ana', nameB: 'Bo', timeA: 'known', timeB: 'known' })));
tTrue('G36', 'and hd-circle does not reimplement the six states',
  !/electromagnetic\s*:|companionship\s*:|dominance\s*:/.test(
    fs.readFileSync(path.join(repo, 'app', 'hd-circle.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')));

/* ---- compute on read ---- */
const circleSrc = fs.readFileSync(path.join(repo, 'app', 'hd-circle.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
t('G37', 'a Ground is never persisted',
  ['localStorage', 'sessionStorage', 'indexedDB', 'setItem', 'PairCache'].filter(s => circleSrc.indexOf(s) !== -1), []);
tTrue('G38', 'and computing the same circle twice returns equal objects rather than a held one',
  (() => { const x = HDG.circle(CIRCLE5, { atlas: ATLAS }), y = HDG.circle(CIRCLE5, { atlas: ATLAS });
    return x !== y && JSON.stringify(x) === JSON.stringify(y); })());

/* ---- no prose in the mechanics, which is what check-layer-boundary asks ---- */
tTrue('G39', 'the only sentences a Ground carries are the two safety constants',
  (() => {
    const seen = [];
    (function walk(v) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.keys(v).forEach(k => walk(v[k]));
      else if (typeof v === 'string' && v.trim().split(/\s+/).length >= 6) seen.push(v);
    })(G);
    return seen.every(s => s === HDG.GROUP_CAUTION || s === HDG.ANCHOR_NOTE);
  })());

/* ------------------------------------------ X: the gates the sky stands in */

/* The clock and the formatter are taken away while the module loads, so a
   module that read either at require time throws here instead of passing. */
const HT = (() => {
  const realNow = Date.now, realDTF = Intl.DateTimeFormat;
  Date.now = () => { throw new Error('clock read at load'); };
  Intl.DateTimeFormat = function () { throw new Error('formatter built at load'); };
  try { return require(path.join(repo, 'app', 'hd-transit.js')); }
  catch (e) { return { loadError: String(e) }; }
  finally { Date.now = realNow; Intl.DateTimeFormat = realDTF; }
})();
const HTW = require(path.join(repo, 'app', 'hd-wheel.js'));
const X_OPT = { wheel: HTW };

/* A synthetic sky: each body at a fixed rate from a base longitude, so every
   row can say exactly where a boundary is. The bases sit half a line inside a
   line, except the Moon, which stands exactly on the start of gate 41 line 4
   at the epoch, so the minute before it is line 3. */
const X_EPOCH = Date.UTC(2026, 8, 10, 12, 0);
const xT = ms => ms / 86400000 + 2440587.5 - 2451545.0;
const xLon = k => 302 + k * HTW.LINE_DEG + HTW.LINE_DEG / 2;
const X_BASE = { Sun: xLon(150), Moon: 302 + 3 * HTW.LINE_DEG, Mercury: xLon(141), Venus: xLon(190),
  Mars: xLon(20), Jupiter: xLon(77), Saturn: xLon(300), Uranus: xLon(260), Neptune: xLon(345),
  Pluto: xLon(310), 'North Node': xLon(5) };
const X_RATE = { Sun: 0.9856, Moon: 13.176, Mercury: 1.2, Venus: 1.1, Mars: 0.52, Jupiter: 0.083,
  Saturn: 0.033, Uranus: 0.012, Neptune: 0.006, Pluto: 0.004, 'North Node': -0.053 };
const xSky = (missing) => (name, t) =>
  (missing || []).indexOf(name) !== -1 ? null : X_BASE[name] + X_RATE[name] * (t - xT(X_EPOCH));
const xGL = a => a && [a.gate, a.line];
const xBody = (acts, b) => acts.filter(a => a.body === b)[0];

tTrue('X1', 'the module loads without reading the clock or building a formatter',
  !HT.loadError && typeof HT.reading === 'function');
t('X2', 'every body comes back in one declared order, with each derived body after its source',
  HT.activations(xSky(), X_EPOCH, X_OPT).map(a => a.body),
  ['Sun', 'Earth', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node']);
tTrue('X3', 'the same instant read twice gives equal readings, never a held one',
  (() => { const a = HT.reading(xSky(), X_EPOCH, X_OPT), b = HT.reading(xSky(), X_EPOCH, X_OPT);
    return a !== b && a.activations !== b.activations && JSON.stringify(a) === JSON.stringify(b); })());
t('X4', 'a reading is taken at the start of the minute it is asked in',
  (() => { const a = HT.reading(xSky(), X_EPOCH + 59999, X_OPT), b = HT.reading(xSky(), X_EPOCH, X_OPT);
    return [a.instant, JSON.stringify(a) === JSON.stringify(b)]; })(),
  ['2026-09-10T12:00:00.000Z', true]);
t('X5', 'the Moon changes line across a minute, and the boundary belongs to the line that begins there',
  [xGL(xBody(HT.activations(xSky(), X_EPOCH - 60000, X_OPT), 'Moon')),
    xGL(xBody(HT.activations(xSky(), X_EPOCH, X_OPT), 'Moon'))],
  [[41, 3], [41, 4]]);
t('X6', 'and nothing else moved in that minute',
  (() => { const a = HT.activations(xSky(), X_EPOCH - 60000, X_OPT), b = HT.activations(xSky(), X_EPOCH, X_OPT);
    return a.filter((x, i) => x.body !== 'Moon' && JSON.stringify(x) !== JSON.stringify(b[i])).map(x => x.body); })(),
  []);
t('X7', 'Earth and the South Node sit opposite the Sun and the North Node',
  (() => { const acts = HT.activations(xSky(), X_EPOCH, X_OPT);
    return [xGL(xBody(acts, 'Earth')), xGL(xBody(acts, 'South Node'))]; })(),
  [xGL(HTW.gateLine(X_BASE.Sun + 180)), xGL(HTW.gateLine(X_BASE['North Node'] + 180))]);
t('X8', 'a body the caller cannot place comes back empty rather than guessed, and so does its opposite',
  (() => { const acts = HT.activations(xSky(['Sun', 'Moon']), X_EPOCH, X_OPT);
    return ['Sun', 'Earth', 'Moon', 'Mars'].map(b => { const a = xBody(acts, b); return a.gate === null && a.line === null; }); })(),
  [true, true, true, false]);
tTrue('X9', 'a split puts every placed body in exactly one half, and both halves keep the declared order',
  (() => {
    const acts = HT.activations(xSky(['Venus']), X_EPOCH, X_OPT);
    const chart = new Set([xBody(acts, 'Sun').gate, xBody(acts, 'Moon').gate, xBody(acts, 'Pluto').gate]);
    const s = HT.split(acts, chart), placed = acts.filter(a => a.gate !== null);
    const order = xs => xs.map(a => a.body).join();
    return order(s.inside) === order(placed.filter(a => chart.has(a.gate)))
      && order(s.outside) === order(placed.filter(a => !chart.has(a.gate)))
      && s.inside.length + s.outside.length === placed.length && s.inside.length >= 3
      && [].concat(s.inside, s.outside).every(a => a.body !== 'Venus');
  })());
t('X10', 'a split takes an array as well as a Set, and refuses anything else',
  (() => { const acts = HT.activations(xSky(), X_EPOCH, X_OPT), g = [acts[0].gate, acts[2].gate];
    return [JSON.stringify(HT.split(acts, g)) === JSON.stringify(HT.split(acts, new Set(g))),
      HT.split(acts, null), HT.split(acts, '41'), HT.split(null, g)]; })(),
  [true, null, null, null]);
t('X11', 'one instant is the same sky in every zone, and only the civil day moves',
  (() => { const ms = Date.UTC(2026, 8, 10, 12, 30);
    const rs = ['Pacific/Tongatapu', 'UTC', 'Pacific/Pago_Pago'].map(z => HT.reading(xSky(), ms, { wheel: HTW, timeZone: z }));
    return [rs.map(r => r.day), rs.every(r => r.instant === rs[0].instant),
      rs.every(r => JSON.stringify(r.activations) === JSON.stringify(rs[0].activations))]; })(),
  [['2026-09-11', '2026-09-10', '2026-09-10'], true, true]);
t('X12', 'east of UTC the day turns over at local midnight, thirteen hours ahead',
  [HT.civilDay(Date.UTC(2026, 8, 10, 10, 59), 'Pacific/Tongatapu'), HT.civilDay(Date.UTC(2026, 8, 10, 11, 0), 'Pacific/Tongatapu')],
  ['2026-09-10', '2026-09-11']);
t('X13', 'west of UTC the day turns over at local midnight, eleven hours behind',
  [HT.civilDay(Date.UTC(2026, 8, 11, 10, 59), 'Pacific/Pago_Pago'), HT.civilDay(Date.UTC(2026, 8, 11, 11, 0), 'Pacific/Pago_Pago')],
  ['2026-09-10', '2026-09-11']);
t('X14', 'on the day New York moves its clocks the day is 23 hours long, and the skipped hour still has a sky',
  [HT.civilDay(Date.UTC(2026, 2, 8, 4, 59), 'America/New_York'), HT.civilDay(Date.UTC(2026, 2, 8, 5, 0), 'America/New_York'),
    HT.civilDay(Date.UTC(2026, 2, 9, 3, 59), 'America/New_York'), HT.civilDay(Date.UTC(2026, 2, 9, 4, 0), 'America/New_York'),
    (r => [r.instant, r.day, r.activations.length])(HT.reading(xSky(), Date.UTC(2026, 2, 8, 7, 0), { wheel: HTW, timeZone: 'America/New_York' }))],
  ['2026-03-07', '2026-03-08', '2026-03-08', '2026-03-09', ['2026-03-08T07:00:00.000Z', '2026-03-08', 13]]);
t('X15', 'a reading refuses without an instant, a longitude function or a wheel',
  (() => { const saved = globalThis.HDWheel; delete globalThis.HDWheel;
    try { return [HT.reading(xSky(), undefined, X_OPT), HT.reading(null, X_EPOCH, X_OPT), HT.reading(xSky(), X_EPOCH, {}), HT.civilDay(X_EPOCH, 'Not/AZone')]; }
    finally { if (saved !== undefined) globalThis.HDWheel = saved; } })(),
  [null, null, null, null]);
tTrue('X16', 'a reading carries gate and line numbers and no field that ranks, counts, rates or remembers',
  (() => {
    const r = HT.reading(xSky(), X_EPOCH, X_OPT), s = HT.split(r.activations, new Set([41]));
    const keys = [];
    (function walk(v) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.keys(v).forEach(k => { keys.push(k); walk(v[k]); });
    })([r, s]);
    return JSON.stringify(Object.keys(r)) === '["instant","day","activations"]'
      && r.activations.every(a => JSON.stringify(Object.keys(a)) === '["body","gate","line"]'
        && Number.isInteger(a.gate) && a.gate >= 1 && a.gate <= 64 && Number.isInteger(a.line) && a.line >= 1 && a.line <= 6)
      && !keys.some(k => /score|rank|streak|compat|match|percent|best|count|total|yesterday|last/i.test(k));
  })());
tTrue('X17', 'the only strings in a reading are body names, the instant and the day: no gate names and no sentences',
  (() => {
    const r = HT.reading(xSky(), X_EPOCH, X_OPT), strs = [];
    (function walk(v) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.keys(v).forEach(k => walk(v[k]));
      else if (typeof v === 'string') strs.push(v);
    })(r);
    return strs.every(x => HT.BODIES.indexOf(x) !== -1 || x === r.instant || x === r.day);
  })());
t('X18', 'the module names no storage API and never asks the clock for now',
  (() => { const src = fs.readFileSync(path.join(repo, 'app', 'hd-transit.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    return ['localStorage', 'sessionStorage', 'indexedDB', 'setItem', 'Date.now', 'new Date()', 'setInterval', 'setTimeout']
      .filter(s => src.indexOf(s) !== -1); })(),
  []);

/* ---- Run the three extension suites (Prompts A, B, C) ---- */

(function() {
  /* Each suite's runTests() returns one result per assertion (pass or
     fail), not just failures, so every M/S/L row below is counted toward
     the total the same way every B/C/... row above is. A version that
     pushed rows only for failures under counted its own total: a fully
     passing suite would contribute zero rows and vanish from the report. */
  const pushSuite = (result, label) => {
    result.results.forEach(r => t(r.id, label + ': ' + r.name + (r.pass ? '' : ' (' + r.error + ')'), r.pass, true));
  };
  pushSuite(MC.runTests(), 'multiChart');
  pushSuite(SW.runTests(), 'skyWire');
  pushSuite(I18N.runTests(), 'i18n');
})();

/* ------------------------------------------------------------------ report */

const pass = rows.filter(r => r.pass).length, fail = rows.length - pass;
if (!quiet) {
  rows.forEach(r => { if (!r.pass) console.log('  FAIL ' + r.id + '  ' + r.desc + '\n       expected ' + r.expected + '\n       actual   ' + r.actual); });
  console.log('run-module-tests: ' + pass + '/' + rows.length + ' passed' + (fail ? ', ' + fail + ' FAILED' : ''));
  [['B', 'birth-time.js'], ['C', 'hd-composite.js'], ['W', 'hd-wheel.js'], ['D', 'arc-solver.js'],
    ['E', 'minor bodies'], ['P', 'people-library.js'], ['Q', 'pair-cache.js'],
    ['A', 'analytics.js'], ['I', 'iching.js'], ['G', 'hd-circle.js'], ['Y', 'hd-topology.js'], ['X', 'hd-transit.js'],
    ['M', 'multiChart.test.js'], ['S', 'skyWire.test.js'], ['L', 'i18n.test.js']].forEach(([k, name]) => {
    const g = rows.filter(r => r.id[0] === k);
    if (g.length > 0) console.log('  ' + k + ' ' + name.padEnd(16) + g.filter(r => r.pass).length + '/' + g.length);
  });
}
process.exit(fail ? 1 : 0);
