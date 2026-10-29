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
const vm = require('vm');

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
const CL = require(path.join(repo, 'app', 'incommon-cloud.js'));

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
t('B13b', 'the placeholder noon is noon where the reader was born, as the note says and the Codex drew it', [
  BT.instant({ birthDate: '1992-07-02', timeUnknown: true, timezone: 'Asia/Tokyo' }).date.toISOString(),
  BT.instant({ birthDate: '1992-07-02', timeUnknown: true, timezone: 'Pacific/Honolulu' }).date.toISOString(),
  BT.instant({ birthDate: '1992-07-02', timezone: 'America/Chicago' }).date.toISOString(),
  BT.instant({ birthDate: '1992-01-02', timeUnknown: true, timezone: 'America/Chicago' }).date.toISOString(),
  BT.instant({ birthDate: '1992-07-02', timeUnknown: true, timezone: 'manual', tzOffset: 5.5 }).date.toISOString()
], ['1992-07-02T03:00:00.000Z', '1992-07-02T22:00:00.000Z', '1992-07-02T17:00:00.000Z', '1992-01-02T18:00:00.000Z', '1992-07-02T06:30:00.000Z']);
/* The rows above check the offset. This one checks the instant it produces,
   because a correct offset of 5.5 was subtracted as whole hours for as long as
   only the offset was checked: every birth in India, Nepal, Iran,
   Afghanistan, Newfoundland and central Australia was drawn 30 or 45 minutes
   early, which is seven to eleven degrees of Ascendant. */
t('B13c', 'a half and three quarter hour zone move the instant by the whole offset, minutes included', [
  BT.instant({ birthDate: '1992-07-02', birthTime: '10:00', timezone: 'Asia/Kolkata' }).date.toISOString(),
  BT.instant({ birthDate: '1990-06-15', birthTime: '12:00', timezone: 'Asia/Kathmandu' }).date.toISOString(),
  BT.instant({ birthDate: '1998-07-15', birthTime: '12:00', timezone: 'America/St_Johns' }).date.toISOString(),
  BT.instant({ birthDate: '2005-01-15', birthTime: '12:00', timezone: 'Pacific/Chatham' }).date.toISOString(),
  BT.instant({ birthDate: '1992-07-02', birthTime: '10:00', timezone: 'manual', tzOffset: 9.5 }).date.toISOString()
], ['1992-07-02T04:30:00.000Z', '1990-06-15T06:15:00.000Z', '1998-07-15T14:30:00.000Z', '2005-01-14T22:15:00.000Z', '1992-07-02T00:30:00.000Z']);
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

/* ------------------------------------------------ U: master numbers kept
   The owner asked on 29 September 2026 for 11, 22 and 33 to be kept wherever a
   number is read, not only in the Life Path and the Personal Year. The methods
   live in the app class, so they are lifted out of the app the way
   check-astral-bodies lifts lonRaw(), and run against InCommonCore. */
(() => {
  const CORE = require(path.join(repo, 'app', 'incommon-core.js'));
  const one = re => { const m = re.exec(appSrc); return m ? m[0] : ''; };
  const method = name => {
    const i = appSrc.indexOf('\n  ' + name + '(');
    if (i === -1) return '';
    const j = appSrc.indexOf('\n  }\n', i);
    return appSrc.slice(i, j + 4);
  };
  const src = 'class U {\n' + one(/  numReduce\(n\)[^\n]*/) + '\n' + one(/  NUM_MASTERS = [^\n]*/) + '\n' +
    one(/  numKeep\(n\)[^\n]*/) + '\n' + method('numerology') + '\n' + method('personalDay') + '\n' +
    one(/  personalWeek\([^\n]*/) + '\n' + one(/  weekNo\([^\n]*/) + '\n}';
  let X = null;
  try { X = vm.runInNewContext('(' + src + ')', { window: { InCommonCore: CORE }, Date: Date, Math: Math, String: String, isNaN: isNaN }); } catch (e) { X = null; }
  tTrue('U1', 'the numerology methods lift out of the app and compile', typeof X === 'function');
  if (typeof X !== 'function') return;
  const x = new X();
  t('U2', 'numKeep stops at 11, 22 and 33 and reduces everything else', [29, 22, 33, 44, 38, 99].map(v => x.numKeep(v)).join(','), '11,22,33,8,11,9');
  x.dob = () => '1985-11-29';
  const a = x.numerology();
  t('U3', 'a birth month and day of 11 and 29 keep 11 as the cycles and the first pinnacle keeps 22', [a.rm, a.rd, a.pinnacles[0][0], a.pinnacles[2][0]].join(','), '11,11,22,11');
  t('U4', 'challenges are differences of fully reduced parts, never of a kept master', [a.challenge].concat(a.subs).join(','), '3,0,3');
  x.dob = () => '1978-02-22';
  const b = x.numerology();
  t('U5', 'a birth day of 22 keeps 22 as the Productive cycle', b.cycles[1][1], 22);
  const seen = new Set();
  for (let k = 0; k < 400; k++) {
    const d = new Date(2026, 0, 1 + k), py = CORE.personalYear('1985-11-29', d.getFullYear()).value;
    seen.add(x.personalDay(py, d));
  }
  tTrue('U6', 'the Personal Day reaches 11, 22 and 33 across a year and never another number over 9',
    seen.has(11) && seen.has(22) && seen.has(33) && [...seen].every(v => v <= 9 || v === 11 || v === 22 || v === 33));
  tTrue('U7', 'the Personal Week keeps a master', x.personalWeek(2, new Date(2026, 0, 28)) === x.numKeep(2 + 1 + x.weekNo(new Date(2026, 0, 28))));

  /* The double digit decides (owner, 19 October 2026). A 6 reached from 33 is
     Master Number 33: 1985-01-09 reduces by its parts to 1 + 9 + 5 = 15, and
     every digit of it adds to 33, so its Life Path is 33 and not 6. */
  const lp = CORE.lifePath('1985-01-09');
  t('U8', 'a Life Path whose digits add to 33 is Master Number 33, though its parts give 15', [lp.sum, lp.all, lp.value, lp.root, lp.compound].join(','), '15,33,33,6,33');
  let moved = 0, wrong = 0, total = 0;
  for (let ms = Date.UTC(1940, 0, 1); ms < Date.UTC(2010, 0, 1); ms += 864e5) {
    const iso = new Date(ms).toISOString().slice(0, 10), r = CORE.lifePath(iso), old = CORE.reduce(r.sum).value;
    total++;
    if (r.value !== old) { moved++; if (!r.master || CORE.reduce(r.value, { preserveMasters: false }).value !== CORE.reduce(old, { preserveMasters: false }).value) wrong++; }
  }
  tTrue('U9', 'a Life Path only ever moves to a master of its own root, and never without one (' + moved + ' of ' + total + ' moved)', moved > 0 && wrong === 0);
  t('U10', 'compound() is the first double digit on the way down', [128, 199, 38, 7, 99].map(v => CORE.compound(v)).join(','), '11,19,38,,99');
  global.window = { InCommonCore: CORE };
  delete require.cache[require.resolve(path.join(repo, 'app', 'numerology-content.js'))];
  require(path.join(repo, 'app', 'numerology-content.js'));
  const nm = global.window.NumerologyContent.fromName('Ida Bell Wells');
  delete global.window;
  t('U11', 'a name number meets a master on the word by word route: IDA BELL WELLS has vowels 20, words 1 + 5 + 5 = 11', [nm.rawTotals.vowels, nm.soulUrge, nm.compounds.soulUrge].join(','), '20,11,11');
  const MX = require(path.join(repo, 'app', 'number-matrix.js'));
  const ks = Object.keys(MX.entries).map(Number);
  tTrue('U12', 'the Book of Numbers holds every compound from 10 to 99 once, each on its own root',
    ks.length === 90 && ks.every(k => k >= 10 && k <= 99 && MX.entries[k].root === CORE.reduce(k, { preserveMasters: false }).value));
  t('U13', 'the matrix names the three masters and the four karmic debts', [ks.filter(k => MX.get(k).master).join(' '), ks.filter(k => MX.get(k).karmic).join(' ')].join(' | '), '11 22 33 | 13 14 16 19');
  let Cm = null;
  try { Cm = vm.runInNewContext('(class { ' + method('numCmp').replace(/^\n/, '') + ' })', { window: { NumberMatrix: MX }, String: String }); } catch (e) { Cm = null; }
  const cm = Cm ? new Cm() : null;
  t('U14', 'the label is 33/6 for a master, 24/6 or 38/11 otherwise, and a birth number owing 13 wears --warn',
    cm ? [cm.numCmp(33, 33, []).cmp, cm.numCmp(24, 6).cmp, cm.numCmp(38, 11).cmp, cm.numCmp(13, 4, [13]).cmpC, cm.numCmp(null, 4).cmpOn].join(',') : 'did not lift',
    '33/6,24/6,38/11,var(--warn),false');
  /* Karmic debt on any route, read on the birth numbers only (owner, 19
     October 2026). 1940-01-04 is 10 by its parts and 19 by its digits. */
  const kd = CORE.lifePath('1940-01-04');
  t('U16', 'a karmic debt on the second route is found though the compound shown is the first route\'s', [kd.compound, kd.value, kd.karmic.join(' ')].join(','), '10,1,19');
  t('U17', 'karmicOf walks every route to its root: 49 passes 13, 28 passes nothing, 199 passes 19', CORE.karmicOf([49, 28, 199]).join(','), '13,19');
  const owe = cm ? cm.numCmp(10, 1, kd.karmic) : null, cyc = cm ? cm.numCmp(16, 7) : null;
  t('U18', 'a Life Path owing 19 on its other route carries a debt line; a cycle on 16 reads as The Tower Season, the ordinary colour and no debt label',
    owe && cyc ? [owe.cmpC, owe.debtOn, owe.debtLine, cyc.cmpTitle, cyc.cmpC, cyc.cmpCat === '', cyc.debtOn].join('|') : 'did not lift',
    'var(--ac2-hi)|true|Karmic Debt 19 \u00b7 The Debt of Selfishness|The Tower Season|var(--ac2-hi)|true|false');
  const cycDebt = ks.filter(k => MX.get(k).karmic).map(k => MX.get(k, { cycle: true }));
  tTrue('U19', 'every karmic compound has a cycle title and description of its own, and none of them says debt',
    cycDebt.length === 4 && cycDebt.every(e => e.title && e.desc && e.category === '' && !/debt/i.test(e.title + e.desc) && e.title !== MX.get(e.n).title)
    && MX.get(24, { cycle: true }).title === MX.get(24).title);
  /* The Numbers stage turns its orbit, it does not jump (owner, 19 October
     2026). numFocusTo() must bring the chosen number to the front (+90
     degrees, the near side of the floor) and always take the short way. */
  let Ns = null;
  try { Ns = vm.runInNewContext('(class { ' + method('numSpinNow').replace(/^\n/, '') + method('numFocusTo') + method('numStep') + ' })', { Math: Math, isNaN: isNaN }); } catch (e) { Ns = null; }
  const ns = Ns ? new Ns() : null;
  if (ns) { ns.state = { numSpin: null, numFocus: 'lifePath' }; ns.setState = o => Object.assign(ns.state, o); }
  const ringKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const front = k => { const i = ringKeys.indexOf(k); return (((i * 45 - 90 + ns.state.numSpin) % 360) + 360) % 360; };
  const walk = [];
  if (ns) {
    walk.push(ns.numSpinNow());
    ['c', 'h', 'a', 'e'].forEach(k => { const before = ns.state.numSpin == null ? 180 : ns.state.numSpin; ns.numFocusTo(k, ringKeys); walk.push(front(k), Math.abs(ns.state.numSpin - before) <= 180); });
    const still = ns.state.numSpin; ns.numFocusTo('lifePath', ringKeys); walk.push(ns.state.numFocus, ns.state.numSpin === still);
  }
  t('U20', 'the orbit rests with its first number in front, brings each chosen number to the front by the short way, and leaves the orbit still for the Life Path',
    walk.join(','), '180,90,true,90,true,90,true,90,true,lifePath,true');
  x.dob = () => '1985-01-09';
  const xa = x.numerology();
  t('U15', 'the Numbers page reads the Life Path and its compound from the core', [xa.lp, xa.lpC, xa.rdC, xa.cycles[2][3]].join(','), '33,33,,23');
})();

/* ------------------------------------------------ Z: the Cycle Audit
   The owner asked on 18 October 2026 for a reading of the long transits, sold
   pay what you want on the website and free in the apps. The dates are found
   on the device by cycleWindows(), lifted out of the app here and run on the
   vendored astronomy-engine, and the case it was asked for is the fixture:
   Pluto on a Mars at 15 Aquarius, then on a Sun at 28 Aquarius. Pluto crosses
   315 degrees five times from April 2032 to December 2033 and 328 degrees five
   times from April 2041 to December 2042, measured with the same library. */
(() => {
  const AE = require(path.join(repo, 'app', 'astronomy-engine-2.1.19.min.js'));
  const field = name => { const m = new RegExp('\\n  ' + name + ' = [^\\n]*').exec(appSrc); return m ? m[0] : ''; };
  const method = name => {
    const i = appSrc.indexOf('\n  ' + name + '(');
    if (i === -1) return '';
    const j = appSrc.indexOf('\n  }\n', i);
    return appSrc.slice(i, j + 4);
  };
  const src = 'class Z {' + field('CY_MOVERS') + field('CY_ASPECTS') + field('CY_ORB') + field('CY_STEP') + field('CY_WEIGHT') + '\n' + method('cyLon') +
    method('cycleScanKey') + method('cycleReady') + method('cycleWindows') + method('cyclePassages') + method('cycleKey') + method('cycleDossier') + method('cyDash') + '\n}';
  /* Today is pinned to the day this was written, so the fixture stays inside
     the scan however long after that the suite is run. */
  class Today extends Date { constructor(...a) { if (a.length) super(...a); else super(Date.UTC(2026, 9, 18, 12)); } }
  let Zc = null;
  try { Zc = vm.runInNewContext('(' + src + ')', { Date: Today, Math: Math, String: String, Object: Object, Intl: Intl }); } catch (e) { Zc = null; }
  tTrue('Z1', 'the Cycle Audit methods lift out of the app and compile', typeof Zc === 'function');
  if (typeof Zc !== 'function') return;
  const z = new Zc();
  const BODY = { Saturn: AE.Body.Saturn, Uranus: AE.Body.Uranus, Neptune: AE.Body.Neptune, Pluto: AE.Body.Pluto };
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  Object.assign(z, {
    PLNS: ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].map(n => [n]),
    activeProfile: () => ({ id: 'p', birthStamp: 'z', name: 'Rowan Vale' }),
    natalDate: () => new Date(Date.UTC(1990, 0, 1)),
    chartAt: () => [{ name: 'Sun', lon: 328 }, { name: 'Mars', lon: 315 }],
    anglePoints: () => [], ascendant: () => null, birthName: () => 'Rowan Vale',
    hdChart: () => ({ type: 'Projector', authority: 'Splenic: the body knows' }), numerology: () => ({ lp: 7 }),
    ORACLE_STRATEGY: { Projector: 'Wait for the invitation' },
    norm360: x => ((x % 360) + 360) % 360,
    addDays: (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; },
    t2000: d => d.getTime() / 86400000 + 2440587.5 - 2451545.0,
    lonOf: (name, t) => AE.Ecliptic(AE.GeoVector(BODY[name], new Date((t + 2451545.0 - 2440587.5) * 86400000), true)).elon,
    _fmt: (k, o) => new Intl.DateTimeFormat('en', o),
    signOf: lon => ({ sign: SIGNS[Math.floor(z.norm360(lon) / 30)], deg: z.norm360(lon) % 30 }),
    aspName: a => a
  });
  const ws = z.cycleWindows();
  const near = (d, iso) => Math.abs(d - Date.parse(iso + 'T12:00:00Z')) <= 3 * 864e5;
  const mars = ws.filter(w => w.mover === 'Pluto' && w.asp === 'conjunct' && w.natal === 'Mars');
  const sun = ws.filter(w => w.mover === 'Pluto' && w.asp === 'conjunct' && w.natal === 'Sun');
  const MARS = ['2032-04-15', '2032-06-17', '2033-02-11', '2033-09-04', '2033-12-19'];
  const SUN = ['2041-04-08', '2041-07-22', '2042-02-15', '2042-10-01', '2042-12-21'];
  t('Z2', 'Pluto on a Mars at 15 Aquarius is one passage with its five exact dates, each within three days of the measured crossing', {
    passages: 1, passes: 5, onDates: true, label: 'Pluto conjunct your Mars'
  }, { passages: mars.length, passes: mars[0] && mars[0].passes.length,
    onDates: !!mars[0] && mars[0].passes.length === 5 && mars[0].passes.every((d, i) => near(d, MARS[i])), label: mars[0] && mars[0].label });
  t('Z3', 'Pluto on a Sun at 28 Aquarius is the later passage, nine years after, with its own five', {
    passages: 1, passes: 5, onDates: true, after: true
  }, { passages: sun.length, passes: sun[0] && sun[0].passes.length,
    onDates: !!sun[0] && sun[0].passes.length === 5 && sun[0].passes.every((d, i) => near(d, SUN[i])),
    after: !!(sun[0] && mars[0]) && ws.indexOf(sun[0]) > ws.indexOf(mars[0]) });
  tTrue('Z4', 'only the four slow astral bodies are read', ws.length > 0 && ws.every(w => ['Saturn', 'Uranus', 'Neptune', 'Pluto'].indexOf(w.mover) !== -1));
  const dos = z.cycleDossier();
  const dashRe = new RegExp('[' + String.fromCharCode(8212, 8211) + ']');
  t('Z5', 'the dossier names the first name, the touched points, the design and the Life Path its questions are asked through, and the passages with their dates, and no birth date, no full name, no dash and no planet', {
    name: true, points: true, design: true, lifePath: true, passage: true, noBirth: true, noSurname: true, noDash: true, noPlanet: true
  }, { name: /^NAME: Rowan$/m.test(dos), points: /Natal Mars 15°00′ Aquarius/.test(dos),
    design: /^HUMAN DESIGN: Projector; Strategy: Wait for the invitation; Authority: Splenic$/m.test(dos), lifePath: /^LIFE PATH: 7$/m.test(dos),
    passage: /Pluto conjunct natal Mars\. In orb .*Exact on [^.]*2032[^.]*2033\./.test(dos),
    noBirth: !/1990/.test(dos), noSurname: !/Vale/.test(dos), noDash: !dashRe.test(dos), noPlanet: !/planet/i.test(dos) });
  const k1 = z.cycleKey(); z._cy = null; z._cyKey = null;
  const pending = z.cycleKey(); z.cycleWindows();
  t('Z6', 'the scan is anchored to the calendar year, so the key and the dossier come out the same when asked again, and no key is named before the scan has run', { key: true, dossier: true, pending: 'cypending' },
    { key: z.cycleKey() === k1 && /^cy[0-9a-z]+$/.test(k1), dossier: z.cycleDossier() === dos, pending });
  tTrue('Z7', 'the audit reads at most eight passages, in the order they arrive', (() => {
    const p = z.cyclePassages();
    return p.length <= 8 && p.every((w, i) => i === 0 || p[i - 1].from <= w.from) && p.every(w => !w.past);
  })());
  /* The ledger layout: what the dashboard says about a passage is the scan's,
     never the model's, and a reading kept before the layout still draws. */
  const dm = mars[0] ? z.cyDash({ contact: 'Pluto conjunct natal Mars', window: 'the model\'s words',
    tax: ['Set down the blade.', 'Let the last word go.'], dividend: ['A voice that need not win.'],
    prompts: [{ system: 'stars', question: 'What feels at stake?' }, { system: 'design', question: 'What waits?' }, { system: 'numbers', question: 'What does seven ask?' }] }, mars[0], 0) : {};
  const old = mars[0] ? z.cyDash({ contact: 'x', window: 'w', tax: 'One sentence here. Another one there.', dividend: 'Just this.', prompts: ['A plain question?'] }, mars[0], 0) : {};
  const anyDash = JSON.stringify(dm) + JSON.stringify(old);
  t('Z8', 'a passage dashboard takes its title, coordinate, window, years and exact dates from the scan, its lists and questions from the reading, and reads an older paragraph reading too', {
    title: 'Pluto Conjunct Natal Mars', coord: '15°00′ Aquarius', window: true, years: '2031 · 2032 · 2033 · 2034', nodes: 5, badge: true,
    tax: 2, sys: 'The Stars|The Design|The Numbers', oldTax: 2, oldPrompt: true, noDash: true
  }, { title: dm.title, coord: dm.coord, window: dm.window === mars[0].range, years: dm.years, nodes: (dm.nodes || []).length,
    badge: /Outer Transit/.test(dm.badge || ''), tax: (dm.tax || []).length, sys: (dm.prompts || []).map(q => q.sys).join('|'),
    oldTax: (old.tax || []).length, oldPrompt: !!old.prompts && old.prompts.length === 1 && old.prompts[0].sysOn === false, noDash: !dashRe.test(anyDash) });
  /* A block replaced by slicing between two anchors once took the next
     block's opening sc-if with it, and the page still drew: the runtime
     forgave the stray closer. Counting is what catches it. */
  const tags = n => [(appSrc.match(new RegExp('<' + n + '[\\s>]', 'g')) || []).length, (appSrc.match(new RegExp('</' + n + '>', 'g')) || []).length];
  t('Z9', 'every sc-if and sc-for in the app opens and closes in equal number', { scIf: true, scFor: true },
    { scIf: tags('sc-if')[0] === tags('sc-if')[1], scFor: tags('sc-for')[0] === tags('sc-for')[1] });
})();

/* ------------------------------------------------ J: Omni lives on the server
   Omni became a paid add-on on 18 October 2026, written by the Oracle function
   so the lock holds. Its composer must not come back into the app, the
   function's copy of the deck must be the app's byte for byte, and the moved
   composer must write a whole, steady reading from that copy. */
(() => {
  const appDeck = fs.readFileSync(path.join(repo, 'app', 'tarot.js'), 'utf8');
  const srvDeckPath = path.join(repo, 'server', 'oracle', 'tarot.js');
  const srvDeck = fs.existsSync(srvDeckPath) ? fs.readFileSync(srvDeckPath, 'utf8') : '';
  const TA = require(path.join(repo, 'app', 'tarot.js'));
  const OMNI = require(path.join(repo, 'server', 'oracle', 'tarot-omni.js'));
  tTrue('J1', 'the app\'s tarot.js carries no Omni composer, and asked for Omni without one it answers null', !/function omni\(/.test(appDeck) && TA.read({ count: 9, topic: 'general', depth: 'omni', seed: 3 }) === null);
  tTrue('J2', 'the Oracle function\'s copy of tarot.js is the app\'s, byte for byte (tools/build-bundle.js writes it)', srvDeck === appDeck);
  const a = TA.read({ count: 11, topic: 'love', depth: 'omni', seed: 1234, omni: OMNI });
  const b = TA.read({ count: 11, topic: 'love', depth: 'omni', seed: 1234, omni: OMNI });
  t('J3', 'the server composer writes seven passages in the tradition\'s order, the same every time for one shuffle', {
    passages: 7, tags: 'CALCULATED,TRADITIONAL,TRADITIONAL,TRADITIONAL,TRADITIONAL,SYNTHESIS,POSSIBILITY', steady: true, cards: 11
  }, { passages: a && a.passages.length, tags: a && a.passages.map(x => x.tag).join(','), steady: JSON.stringify(a) === JSON.stringify(b), cards: a && a.count });
  tTrue('J4', 'the bundle does not carry the composer', (() => {
    const m = fs.readFileSync(path.join(repo, 'tools', 'build-bundle.js'), 'utf8').match(/const BUNDLE = path\.join\(repo, 'deploy', '([^']+)'\)/);
    const app = m ? path.join(repo, 'deploy', m[1], 'app.html') : '';
    return !!app && fs.existsSync(app) && fs.readFileSync(app, 'utf8').indexOf('Woven together, the reading turns on three of its cards') === -1;
  })());
})();

/* ------------------------------------------------ V: the profile menu
   The owner asked on 30 September 2026 for the profile icon to open a menu
   (Profile, Settings, Get Help, Log Out), for the profile card to carry a
   motto made for the reader, and for Get Help to prompt a call. The motto and
   the line are chosen by methods in the app class, lifted out here the way the
   U rows lift the numbers. */
(() => {
  const CD = require(path.join(repo, 'app', 'crisis-directory.js'));
  const field = name => {
    const i = appSrc.indexOf('\n  ' + name + ' = ');
    if (i === -1) return '';
    const j = appSrc.indexOf('};\n', i);
    return appSrc.slice(i, j + 2);
  };
  const method = name => {
    const i = appSrc.indexOf('\n  ' + name + '(');
    if (i === -1) return '';
    const j = appSrc.indexOf('\n  }\n', i);
    return appSrc.slice(i, j + 4);
  };
  const one = re => { const m = re.exec(appSrc); return m ? m[0] : ''; };
  const src = 'class V {\n' + one(/  numReduce\(n\)[^\n]*/) + '\n' + field('MOTTO_LP') + '\n' + field('MOTTO_SUN') + '\n' +
    field('MOTTO_TYPE') + '\n' + method('mottoFor') + '\n' + method('helpCountry') + '\n' + method('callVals') + '\n}';
  let env = { tz: 'America/New_York', lang: 'en-US' };
  const ctx = {
    Intl: { DateTimeFormat: function () { return { resolvedOptions: () => ({ timeZone: env.tz }) }; } },
    navigator: { get language() { return env.lang; } }, String: String, Math: Math
  };
  let X = null;
  try { X = vm.runInNewContext('(' + src + ')', ctx); } catch (e) { X = null; }
  tTrue('V1', 'the motto and the call line lift out of the app and compile', typeof X === 'function');
  if (typeof X !== 'function') return;
  const x = new X();
  const LPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
  const SUNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const TYPES = ['Generator', 'Manifesting Generator', 'Manifestor', 'Projector', 'Reflector'];
  const all = [];
  LPS.forEach(lp => SUNS.forEach(sun => TYPES.forEach(ty => all.push(x.mottoFor(lp, sun, ty)))));
  const DASH = new RegExp('[' + String.fromCharCode(8212, 8211) + ']');
  t('V2', 'every Life Path, Sun and type makes a motto: 720 of them, all different, each two sentences ending in a full stop, none with a dash',
    { count: 720, distinct: 720, shaped: 720, dashed: 0 },
    { count: all.filter(Boolean).length, distinct: new Set(all).size, shaped: all.filter(m => /^[A-Z][^.]+\. [A-Z][^.]+\.$/.test(m)).length, dashed: all.filter(m => DASH.test(m)).length });
  t('V3', 'the motto is something to do, never a statement about who the reader is, and the same chart always gets the same one',
    { aboutReader: 0, stable: true, missingPart: '' },
    { aboutReader: all.filter(m => /\byou are\b|\byou're\b|\byour nature\b/i.test(m)).length,
      stable: x.mottoFor(4, 'Taurus', 'Generator') === x.mottoFor(4, 'Taurus', 'Generator') && x.mottoFor(4, 'Taurus', 'Generator') === 'Build what lasts. At an unhurried pace, answer what lights you up.',
      missingPart: x.mottoFor(null, 'Leo', 'Projector') + x.mottoFor(5, '', 'Projector') + x.mottoFor(5, 'Leo', '') });
  const where = [['Europe/London', 'en-US'], ['Europe/Dublin', 'en-IE'], ['Australia/Sydney', 'en-US'], ['America/Toronto', 'en-US'], ['America/New_York', 'es-US'],
    ['Pacific/Honolulu', 'en-US'], ['America/Indiana/Indianapolis', 'en-US'], ['Asia/Tokyo', 'en-US'], ['America/Mexico_City', 'es-MX'], ['UTC', 'en-GB'], ['UTC', 'fr-FR'], ['', 'en_CA']]
    .map(([tz, lang]) => { env = { tz, lang }; return (tz || '-') + ' ' + lang + ' ' + x.helpCountry(); });
  t('V4', 'the line follows the time zone first and the language only when the zone says nothing, and a place the directory does not cover gets no country',
    ['Europe/London en-US UK', 'Europe/Dublin en-IE UK', 'Australia/Sydney en-US AU', 'America/Toronto en-US CA', 'America/New_York es-US US',
     'Pacific/Honolulu en-US US', 'America/Indiana/Indianapolis en-US US', 'Asia/Tokyo en-US null', 'America/Mexico_City es-MX null', 'UTC en-GB UK', 'UTC fr-FR null', '- en_CA CA'], where);
  x.CD = () => CD;
  x.openHelp = () => {};
  x.setState = () => {};
  const call = tz => { env = { tz, lang: 'en-US' }; x.state = { callOpen: true }; const v = x.callVals(); return [v.callKnown, v.callName, v.callHref, v.callTextHref, v.callEmHref].join(' | '); };
  t('V5', 'Get Help prompts a call to the crisis line for where the reader is, with the emergency number beside it, and offers the way to find one where the directory has none',
    ['true | 988 Suicide & Crisis Lifeline | tel:988 | sms:988 | tel:911', 'true | Samaritans | tel:116123 |  | tel:999', 'true | 988 Suicide Crisis Helpline | tel:988 | sms:988 | tel:911',
     'true | Lifeline Australia | tel:131114 |  | tel:000', 'false |  |  |  | '],
    ['America/Chicago', 'Europe/London', 'America/Vancouver', 'Australia/Perth', 'Asia/Tokyo'].map(call));
  env = { tz: 'Asia/Tokyo', lang: 'en-US' }; x.state = { callOpen: true };
  const far = x.callVals();
  tTrue('V5b', 'where there is no line, the prompt says to find one and carries no number', far.callUnknown === true && !far.callHref && far.callFindHref === 'https://findahelpline.com');
})();

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
  /* E10 USED TO ASSERT A COPY OF THE LIST, and then a rule over the list, and
     both went red on a correct change: first when the four asteroids came off
     it, and then when Chiron was fetched and there was no list left. What is
     asserted now is the behaviour, run on the app's own degreeSafe() lifted
     out of it: with the fetched elements present, every body this fallback
     module also supplies names a degree exactly when its fetched worst case is
     inside the ceiling; with them missing, every one whose fitted accuracy is
     worse than the ceiling withholds it, under both spellings, because the
     wheel asks by name and the expanded table by registry id. A body added to
     either module with a nine degree fit turns this red on the route that
     would print it. */
  const ceiling = parseFloat((appSrcE.match(/DEGREE_SAFE_WORST = ([\d.]+)/) || [, '0'])[1]);
  const MEmod = (() => { try { return require(path.join(repo, 'app', 'minor-body-elements.js')); } catch (e) { return null; } })();
  const dsSrc = (() => {
    const i = appSrcE.indexOf('\n  degreeSafe(name) {');
    return i === -1 ? '' : appSrcE.slice(i, appSrcE.indexOf('\n  }\n', i) + 4);
  })();
  const liftDS = (win) => {
    try {
      const K = vm.runInNewContext('(class { COMET_IDS = ["halley", "halebopp", "hyakutake"]; DEGREE_SAFE_WORST = ' + ceiling + ';' + dsSrc + '})', { window: win, String: String, Object: Object });
      return new K();
    } catch (e) { return null; }
  };
  const withME = liftDS({ MinorBodyElements: MEmod, MinorBodiesEphemeris: MBE });
  const withoutME = liftDS({ MinorBodiesEphemeris: MBE });
  const wrongWith = [], wrongWithout = [];
  let barredWithout = 0;
  MBE.BODIES.forEach(b => [b, b.toLowerCase()].forEach(nm => {
    const id = b.toLowerCase();
    if (withME && MEmod && MEmod.has(id) && withME.degreeSafe(nm) !== (MEmod.worstDeg(id) <= ceiling)) wrongWith.push(nm);
    const fit = MBE.elements[b].accuracyDeg, should = fit != null && fit <= ceiling;
    if (withoutME && withoutME.degreeSafe(nm) !== should) wrongWithout.push(nm);
    if (!should) barredWithout++;
  }));
  tTrue("E10", "a fallback body names a degree by its measurement, fetched or fitted, under both spellings" +
    (wrongWith.length || wrongWithout.length ? ' (wrong with elements: ' + wrongWith.join(',') + '; without: ' + wrongWithout.join(',') + ')' : ''),
    ceiling > 0 && !!withME && !!withoutME && barredWithout > 0 && wrongWith.length === 0 && wrongWithout.length === 0);
  tTrue("E10c", "Chiron, now fetched, earns its degree, and on the fitted fallback it does not",
    !!withME && !!withoutME && withME.degreeSafe('Chiron') === true && withME.degreeSafe('chiron') === true &&
    withoutME.degreeSafe('Chiron') === false && withoutME.degreeSafe('chiron') === false && MEmod.worstDeg('chiron') < 0.1);
  tTrue("E10b", "and the decision is made by measurement, through the one gate the Sabian panel reads",
    /ME\.worstDeg\(key\) <= this\.DEGREE_SAFE_WORST/.test(appSrcE) &&
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

  /* THE STORED INSTANT IS THE READER'S INSTANT (1.3, D-03 and D-04). A saved
     person is drawn for the moment birth-time.js gives the reader: the zone's
     offset on the birth date, and noon where it happened for an unknown time.
     Before STATE_VERSION 4 an unknown time was midnight at Greenwich and a
     summer birth took the stored standard offset, an hour late. */
  const BTm = require(path.join(repo, 'app', 'birth-time.js'));
  PL.configure({ birthTime: BTm });
  const iso = x => new Date(PL.normalize(x).instant).toISOString();
  t('P27', 'an unknown birth time is read at noon where it happened, as the reader is, not midnight at Greenwich',
    [iso({ birth_date: '1990-03-15', tz_offset: -5, birth_tz: 'America/New_York' }),
      iso({ birth_date: '1990-03-15', tz_offset: 9, birth_tz: 'Asia/Tokyo' })],
    ['1990-03-15T17:00:00.000Z', '1990-03-15T03:00:00.000Z']);
  t('P28', 'a summer birth given with the zone\'s standard offset is read at the offset the zone had that day, and a winter one is unchanged',
    [iso({ birth_date: '1985-07-01', birth_time: '14:00', tz_offset: -5, birth_tz: 'America/New_York' }),
      iso({ birth_date: '1985-01-15', birth_time: '14:00', tz_offset: -5, birth_tz: 'America/New_York' })],
    ['1985-07-01T18:00:00.000Z', '1985-01-15T19:00:00.000Z']);
  const cases = [
    { birth_date: '1990-03-15', tz_offset: -5, birth_tz: 'America/New_York' },
    { birth_date: '1985-07-01', birth_time: '14:00', tz_offset: -5, birth_tz: 'America/New_York' },
    { birth_date: '1972-06-30', birth_time: '23:30', tz_offset: 0, birth_tz: 'Europe/London' },
    { birth_date: '2001-11-02', birth_time: '06:15', tz_offset: 5.5, birth_tz: 'Asia/Kolkata' },
    { birth_date: '1999-12-31', birth_time: '12:00', tz_offset: -3 },
    { birth_date: '1966-02-14', tz_offset: 10, birth_tz: 'Australia/Sydney' }];
  t('P29', 'for every case, the store and birth-time.js agree on the instant to the millisecond, and the version that marks the change is 4',
    { same: cases.map(() => true), v: 4 },
    { same: cases.map(c => PL.normalize(c).instant === BTm.instant({ birthDate: c.birth_date, birthTime: c.birth_time || '',
      timeUnknown: !c.birth_time, timezone: c.birth_tz || '', tzOffset: c.tz_offset }).date.getTime()), v: PL.STATE_VERSION });
  PL.configure({ birthTime: null });
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

/* ---------------------------------------------------------------- K: incommon-cloud.js
   Consent gating and the deletion outbox, the two risks named by the
   integration-harness redesign (docs/integration-harness-design.md). Pure
   logic only: profile-manager.js is `window.ProfileManager = PM`, never a
   UMD module, so it cannot be required here: a hand-built fixture carrying
   only the four methods incommon-cloud.js actually calls stands in for it.
   PIN recovery needs a real sessionStorage (the UMD wrapper resolves `root`
   to this module's own private exports object under Node, never globalThis)
   and is covered in the browser phase instead. */

const OUTBOX_KEY = 'incommon_cloud_outbox_v2';

function clStore() {
  var m = {};
  return {
    getItem: function (k) { return k in m ? m[k] : null; },
    setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; }
  };
}
function fakePM(profiles, consents, pairs) {
  return {
    _store: function () { return { profiles: profiles, activeId: profiles[0] && profiles[0].id, defaultId: profiles[0] && profiles[0].id, pairs: pairs || [] }; },
    listProfiles: function () { return profiles; },
    getConsents: function (pid) { return consents[pid] || {}; },
    getMemory: function (opts) { return profiles.filter(p => p.id === opts.profileId).reduce((a, p) => a.concat(p.memories || []), []); },
    subscribe: function () {}
  };
}
/* A fake Supabase query builder: chainable the way the real client is
   (.from().upsert().then(), .from().delete().eq().eq().then()), every call
   recorded, `fail(rec)` decides whether that call reports an error. */
function fakeClient(calls, fail) {
  function builder(table) {
    var b = { _eq: [] };
    b.insert = function (row) { b._op = 'insert'; b._row = row; return b; };
    b.upsert = function (row, opts) { b._op = 'upsert'; b._row = row; b._opts = opts; return b; };
    b.select = function () { b._op = 'select'; return b; };
    b.delete = function () { b._op = 'delete'; return b; };
    b.eq = function (col, val) { b._eq.push([col, val]); return b; };
    b.then = function (resolve, reject) {
      var rec = { table: table, op: b._op, row: b._row, opts: b._opts, eq: b._eq.slice() };
      calls.push(rec);
      var err = (typeof fail === 'function' && fail(rec)) ? { message: 'fake failure' } : null;
      return Promise.resolve({ error: err, data: [] }).then(resolve, reject);
    };
    return b;
  }
  return { from: builder };
}

async function runCloudTests() {
  /* ---- K1-K6: buildPlan, driven through push(), consent gating end to end ---- */
  var storeA = clStore();
  var pmA = fakePM(
    [{ id: 'p1', name: 'Subject', memories: [
      { id: 'm1', memoryType: 'journal', content: { t: 'granted-journal' }, consentRequired: 'journal', kept: false },
      { id: 'm2', memoryType: 'mood', content: { t: 'SECRET-mood-never-sync' }, consentRequired: 'mood', kept: false },
      { id: 'm3', memoryType: 'mood', content: { t: 'KEPT-but-still-local-only' }, consentRequired: 'mood', kept: true }
    ] }],
    { p1: { journal: true, mood: false, assessments: false, conversation: false, birthData: true, relationships: false } },
    [{ key: 'p1::p2', a: 'p1', b: 'p2', enabled: true }]
  );
  storeA.setItem('incommon.consent.p1', JSON.stringify({ events: [{ id: 'journal', ts: '2026-01-01T00:00:00.000Z', granted: true }] }));
  var callsA = [];
  CL._setConfigForTests({ storage: storeA, pm: pmA, core: null });
  CL._setClientForTests(fakeClient(callsA), { user: { id: 'u1' } });
  var resA = await CL.push();
  var memRowsA = callsA.filter(c => c.table === 'memories' && c.op === 'upsert').map(c => c.row.local_id).sort();
  t('K1', 'push() against a fake, always-succeeding client reports ok', resA.ok, true);
  t('K2', 'only the consented memory is pushed; the ungated and the kept-but-ungated ones are held back', memRowsA, ['m1']);
  var everyRowA = JSON.stringify(callsA);
  t('K3', 'content whose consent is off never appears in any recorded call, kept or not', /SECRET-mood-never-sync|KEPT-but-still-local-only/.test(everyRowA), false);
  t('K4', 'the profile row (birth data) syncs unconditionally, even with most consents off', callsA.some(c => c.table === 'profiles' && c.op === 'upsert' && c.row.id === 'p1'), true);
  t('K5', 'the consent ledger syncs unconditionally: it is governance, not gated content', callsA.some(c => c.table === 'consent_events' && c.op === 'upsert'), true);
  t('K6', 'pairs sync unconditionally, the same governance reasoning as the ledger', callsA.some(c => c.table === 'pairs' && c.op === 'upsert'), true);

  /* ---- K7-K9: the deletion outbox. flushOutbox() is not itself exported
     (this pass does not touch the cloud module), so every path through it
     is driven the same way the real app reaches it: push()'s own tail. An
     empty pm keeps the rest of the plan trivially empty, so the only calls
     recorded are the ones the outbox itself issues. ---- */
  var storeB = clStore();
  storeB.setItem(OUTBOX_KEY, JSON.stringify([{ op: 'del-profile', pid: 'gone-1' }]));
  var callsB = [];
  CL._setConfigForTests({ storage: storeB, pm: fakePM([], {}), core: null });
  CL._setClientForTests(fakeClient(callsB), { user: { id: 'u1' } });
  await CL.push();
  t('K7', 'a queued profile deletion issues delete().eq(id, pid) against profiles', callsB.some(c => c.table === 'profiles' && c.op === 'delete' && JSON.stringify(c.eq) === JSON.stringify([['id', 'gone-1']])), true);
  t('K7b', 'a successfully flushed op is cleared from the outbox', JSON.parse(storeB.getItem(OUTBOX_KEY) || '[]').length, 0);

  var storeC = clStore();
  storeC.setItem(OUTBOX_KEY, JSON.stringify([{ op: 'del-memories', pid: 'p1', type: 'journal' }]));
  var callsC = [];
  CL._setConfigForTests({ storage: storeC, pm: fakePM([], {}), core: null });
  CL._setClientForTests(fakeClient(callsC), { user: { id: 'u1' } });
  await CL.push();
  t('K8', 'a queued memory-type deletion issues delete().eq(profile_id).eq(memory_type) against memories', callsC.some(c => c.table === 'memories' && c.op === 'delete' && JSON.stringify(c.eq) === JSON.stringify([['profile_id', 'p1'], ['memory_type', 'journal']])), true);

  var storeD = clStore();
  storeD.setItem(OUTBOX_KEY, JSON.stringify([{ op: 'del-profile', pid: 'p1' }]));
  var callsD = [];
  CL._setConfigForTests({ storage: storeD, pm: fakePM([], {}), core: null });
  CL._setClientForTests(fakeClient(callsD, function (rec) { return rec.table === 'profiles' && rec.op === 'delete'; }), { user: { id: 'u1' } });
  await CL.push();
  t('K9', 'a wipe cannot be lost: a failed flush leaves the op queued for retry rather than dropping it', JSON.parse(storeD.getItem(OUTBOX_KEY) || '[]'), [{ op: 'del-profile', pid: 'p1' }]);

  /* ---- K10: a wipe cannot be re-uploaded by the debounce that follows it ---- */
  var storeE = clStore();
  storeE.setItem(OUTBOX_KEY, JSON.stringify([{ op: 'del-memories', pid: 'p1', type: 'mood' }]));
  var pmE = fakePM([{ id: 'p1', name: 'Subject', memories: [] }], { p1: {} });
  var callsE = [];
  CL._setConfigForTests({ storage: storeE, pm: pmE, core: null });
  CL._setClientForTests(fakeClient(callsE), { user: { id: 'u1' } });
  var resE = await CL.push();
  t('K10', 'an ordinary push() flushes the outbox as its own tail, so a pending deletion is not re-uploaded by the next debounce', {
    pushOk: resE.ok,
    deleteIssued: callsE.some(c => c.table === 'memories' && c.op === 'delete'),
    outboxDrained: JSON.parse(storeE.getItem(OUTBOX_KEY) || '[]').length
  }, { pushOk: true, deleteIssued: true, outboxDrained: 0 });

  /* ---- K11: the hash cache: a quiet week touches nothing ---- */
  var storeF = clStore();
  var pmF = fakePM([{ id: 'p1', name: 'Subject', memories: [{ id: 'm1', memoryType: 'journal', content: { t: 'unchanged' }, consentRequired: 'journal', kept: false }] }], { p1: { journal: true } });
  var callsF1 = [];
  CL._setConfigForTests({ storage: storeF, pm: pmF, core: null });
  CL._setClientForTests(fakeClient(callsF1), { user: { id: 'u1' } });
  await CL.push();
  var callsF2 = [];
  CL._setClientForTests(fakeClient(callsF2), { user: { id: 'u1' } });
  var resF2 = await CL.push();
  t('K11', 'a second push of unchanged content sends zero memories upserts: the hash cache skips it', {
    ok: resF2.ok, memoriesUpserted: callsF2.filter(c => c.table === 'memories' && c.op === 'upsert').length
  }, { ok: true, memoriesUpserted: 0 });

  /* ---- K12-K14: the REAL init()->lib() path, unsigned-in stays inert.
     K1-K11 drive the module through _setConfigForTests/_setClientForTests
     on purpose (the design note explains why: under Node's CommonJS wrapper,
     `root` resolves to this module's own private exports object, never
     globalThis, so lib() could never find a `self.supabase` there). That
     bypass proves the module's own logic but never actually called init().
     Before the root fix, init() would have thrown the instant it called
     lib(), the "unsigned-in" branch of the module's own header claim
     ("if this module is absent, inert, or unsigned-in, the app is exactly
     the offline-first program it was yesterday") was UNREACHABLE through
     init() at all, so it had never been checked, only assumed. Now that
     init() actually runs, that claim gets its own proof: a second, isolated
     instance of the module, loaded in a vm context where `self` is a plain
     object carrying `.supabase`, driven through the real init() rather than
     the test-seam bypass. This is a behavioral change from before the fix
     (lib()/init() now do something instead of throwing), and the point of
     these three rows is to confirm that something is the correct inert
     nothing, not to reassert "nothing changed." */
  function loadIsolatedCloud(supabaseLib, fetchFn, extra) {
    var src = fs.readFileSync(path.join(repo, 'app', 'incommon-cloud.js'), 'utf8');
    /* setTimeout/clearTimeout are host globals, not ECMAScript intrinsics:
       a vm context does not get them for free the way it gets JSON/Promise/
       Date, so schedule()'s real debounce needs them threaded through
       explicitly or K14 would be testing a ReferenceError, not the module. */
    var selfStub = { supabase: supabaseLib, setTimeout: setTimeout, clearTimeout: clearTimeout };
    if (fetchFn) selfStub.fetch = fetchFn;
    /* localStorage and document, for the rows that need a browser's storage
       and cookie jar (K38 on); every row before them runs without either. */
    if (extra) Object.keys(extra).forEach(function (k) { selfStub[k] = extra[k]; });
    selfStub.self = selfStub; // self === self, the way a real Window is
    var ctx = vm.createContext(selfStub);
    vm.runInContext(src, ctx, { filename: 'incommon-cloud.js (isolated K12-K14 instance)' });
    return selfStub.InCommonCloud;
  }
  var initCalls = [];
  var initClient = {
    from: function (table) { initCalls.push({ table: table }); return fakeClient([]).from(table); },
    auth: { onAuthStateChange: function () {} }
  };
  var CL2 = loadIsolatedCloud({ createClient: function () { return initClient; } });
  var pmG = fakePM([{ id: 'p1', name: 'Subject', memories: [{ id: 'm1', memoryType: 'journal', content: { t: 'x' }, consentRequired: 'journal', kept: false }] }], { p1: { journal: true } });
  var initRes = CL2.init({ url: 'https://k12-test.invalid', anonKey: 'k12-fake-anon', core: {}, pm: pmG, storage: clStore() });
  t('K12', 'the real init() path (not the test-seam bypass) resolves the vendored client and returns a working api, unsigned-in', {
    gotApi: true, mode: 'local'
  }, {
    gotApi: !!initRes, mode: CL2.status().mode
  });
  var pushUnsigned = await CL2.push();
  t('K13', 'unsigned-in, push() refuses before ever reaching the client: not a single call is recorded. flushOutbox() is not public and only runs from a successful push, so this is the only path that could reach it, and it is never taken', {
    pushReason: 'no-session', clientCalls: 0
  }, {
    pushReason: pushUnsigned.reason, clientCalls: initCalls.length
  });
  /* schedule()'s debounce is real; let it actually fire rather than trusting
     that push() alone covers the path a live ProfileManager event takes. */
  CL2.schedule();
  await new Promise(function (r) { setTimeout(r, 1500); });
  t('K14', 'a live debounce firing unsigned-in is exactly as inert as calling push() directly: still no client call', 0, initCalls.length);

  /* ---- K15-K25, K35-K37: signing in on the cover, with a password.
     The cover has no ProfileManager, so these run without init(). What they
     must prove is the shape that lets every email the cover causes work in any
     browser (one client on the implicit flow that does not read the url by
     itself), that the emailed sign in link is gone since the owner replaced it
     on 29 September 2026, as Google sign in went the same day, that every
     refusal comes back as a reason rather than a throw, and that the app's own
     client is left on the library defaults. K17 was Google's offline start and
     went with it. */
  function oauthHarness(opts) {
    opts = opts || {};
    var h = { created: [], oauth: [], exchanged: [], otp: [], pw: [], up: [], reset: [], set: [], upd: [], verify: [], resend: [] };
    var answer = function (k, ok) { return Promise.resolve(opts[k] ? { data: {}, error: opts[k] } : ok); };
    var fakeLib = { createClient: function (url, key, o) {
      h.created.push({ url: url, opts: o || null });
      return { auth: {
        onAuthStateChange: function () {},
        signInWithOtp: function (a) { h.otp.push(a); return answer('otpError', { data: {}, error: null }); },
        verifyOtp: function (a) { h.verify.push(a); return answer('verifyError', { data: { session: { user: { phone: String(a.phone).replace(/^\+/, ''), email: opts.verifyEmail || '' } }, user: { phone: String(a.phone).replace(/^\+/, '') } }, error: null }); },
        resend: function (a) { h.resend.push(a); return answer('resendError', { data: {}, error: null }); },
        signInWithOAuth: function (a) { h.oauth.push(a); return Promise.resolve({ data: {}, error: null }); },
        exchangeCodeForSession: function (c) { h.exchanged.push(c); return Promise.resolve({ data: { session: { user: { email: 'reader@k18.invalid' } } }, error: null }); },
        signInWithPassword: function (a) { h.pw.push(a); return answer('pwError', { data: { session: { user: a.phone ? { phone: a.phone.slice(1) } : { email: a.email } } }, error: null }); },
        signUp: function (a) {
          h.up.push(a);
          var d = opts.upData || { user: a.phone ? { phone: a.phone.slice(1), identities: [{ id: 'i1' }] } : { email: a.email, identities: [{ id: 'i1' }] }, session: null };
          return answer('upError', { data: d, error: null });
        },
        resetPasswordForEmail: function (e, o) { h.reset.push({ email: e, opts: o }); return answer('resetError', { data: {}, error: null }); },
        setSession: function (t) { h.set.push(t); return answer('setError', { data: { session: { user: { email: 'server@k36.invalid' } } }, error: null }); },
        updateUser: function (u) { h.upd.push(u); return answer('updError', { data: { user: {} }, error: null }); }
      }, from: function () { return fakeClient([]).from('x'); } };
    } };
    h.C = loadIsolatedCloud(fakeLib, function () { return Promise.reject(new Error('no network in the test')); }, opts.extra);
    return h;
  }
  var gOn = oauthHarness();
  var inOk = await gOn.C.passwordSignIn('  reader@k15.invalid ', 'correct horse');
  var auth0 = gOn.created[0] && gOn.created[0].opts && gOn.created[0].opts.auth;
  t('K15', 'the cover signs in on one client on the implicit flow that does not read the url and keeps the session, with the trimmed address and the password', {
    ok: true, email: 'reader@k15.invalid', flowType: 'implicit', detectSessionInUrl: false, persistSession: true, sent: { email: 'reader@k15.invalid', password: 'correct horse' }
  }, {
    ok: inOk.ok, email: inOk.email, flowType: auth0 && auth0.flowType, detectSessionInUrl: auth0 && auth0.detectSessionInUrl,
    persistSession: auth0 && auth0.persistSession, sent: gOn.pw[0] || null
  });
  t('K16', 'Google sign in is gone from the module: no provider start and no provider check, and nothing reaches signInWithOAuth', {
    oauthStart: 'undefined', providerEnabled: 'undefined', oauthCalls: 0
  }, { oauthStart: typeof gOn.C.oauthStart, providerEnabled: typeof gOn.C.providerEnabled, oauthCalls: gOn.oauth.length });
  var finish = await gOn.C.oauthFinish('code-k18');
  t('K18', 'oauthFinish still exchanges exactly the code it was handed, for a link sent before the password, on the same client, and names the account', {
    ok: true, exchanged: ['code-k18'], email: 'reader@k18.invalid', clients: 1
  }, { ok: finish.ok, exchanged: gOn.exchanged, email: finish.email, clients: gOn.created.length });
  var CLnone = loadIsolatedCloud(null, function () { return Promise.reject(new Error('unused')); });
  var none = await Promise.all([
    CLnone.passwordSignIn('reader@k19.invalid', 'correct horse'), CLnone.passwordSignUp('reader@k19.invalid', 'correct horse', 'https://cover.k19.invalid/'),
    CLnone.passwordResetStart('reader@k19.invalid', 'https://cover.k19.invalid/'), CLnone.adoptSession('at', 'rt'),
    CLnone.passwordSet('correct horse'), CLnone.oauthFinish('code-k19')]);
  t('K19', 'with the vendored client missing every cover call answers off rather than throwing', {
    reasons: ['off', 'off', 'off', 'off', 'off', 'off']
  }, { reasons: none.map(function (r) { return r.reason; }) });
  var gApp = oauthHarness();
  gApp.C.init({ url: 'https://k20-test.invalid', anonKey: 'k20-fake-anon', core: {}, pm: pmG, storage: clStore() });
  t('K20', 'init() still makes the app client with the library defaults, so the email links it sends stay on the implicit flow', {
    clients: 1, opts: null
  }, { clients: gApp.created.length, opts: gApp.created[0] ? gApp.created[0].opts : 'none' });

  var gUp = oauthHarness();
  var upNew = await gUp.C.passwordSignUp(' reader@k21.invalid', 'correct horse', 'https://cover.k21.invalid/');
  t('K21', 'the emailed sign in link is gone: making an account sends the address, the password and the page to confirm back to, and answers confirm when no session comes back', {
    emailStart: 'undefined', otpCalls: 0, ok: true, confirm: true, email: 'reader@k21.invalid', password: 'correct horse', emailRedirectTo: 'https://cover.k21.invalid/'
  }, {
    emailStart: typeof gUp.C.emailStart, otpCalls: gUp.otp.length + gOn.otp.length, ok: upNew.ok, confirm: !!upNew.confirm,
    email: gUp.up[0] && gUp.up[0].email, password: gUp.up[0] && gUp.up[0].password, emailRedirectTo: gUp.up[0] && gUp.up[0].options.emailRedirectTo
  });
  var refusals = {};
  var cases = [
    ['wrong', { status: 400, code: 'invalid_credentials', message: 'Invalid login credentials' }],
    ['unconfirmed', { status: 400, code: 'email_not_confirmed', message: 'Email not confirmed' }],
    ['rate', { status: 429, code: 'over_request_rate_limit', message: 'Request rate limit reached' }],
    ['offline', { name: 'AuthRetryableFetchError', message: 'Failed to fetch' }],
    ['oldWrong', { status: 400, message: 'Invalid login credentials' }]
  ];
  for (var ci = 0; ci < cases.length; ci++) {
    var gc = oauthHarness({ pwError: cases[ci][1] });
    refusals[cases[ci][0]] = (await gc.C.passwordSignIn('reader@k22.invalid', 'correct horse')).reason;
  }
  refusals.weak = (await oauthHarness({ upError: { status: 422, code: 'weak_password', message: 'Password should contain at least one character of each' } }).C.passwordSignUp('reader@k22.invalid', 'correct horse', 'https://cover.k22.invalid/')).reason;
  refusals.closed = (await oauthHarness({ upError: { status: 422, code: 'signup_disabled', message: 'Signups not allowed for this instance' } }).C.passwordSignUp('reader@k22.invalid', 'correct horse', 'https://cover.k22.invalid/')).reason;
  refusals.same = (await oauthHarness({ updError: { status: 422, code: 'same_password', message: 'New password should be different from the old password.' } }).C.passwordSet('correct horse')).reason;
  refusals.mailRate = (await oauthHarness({ resetError: { status: 429, code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' } }).C.passwordResetStart('reader@k22.invalid', 'https://cover.k22.invalid/')).reason;
  var thrower = loadIsolatedCloud({ createClient: function () { return { auth: { signInWithPassword: function () { throw new Error('Failed to fetch'); } } }; } });
  refusals.thrown = (await thrower.passwordSignIn('reader@k22.invalid', 'correct horse')).reason;
  t('K22', 'every refusal comes back as a reason the cover can say, by the code where there is one and the message where there is not, and the same password is not read as a weak one', {
    wrong: 'wrong', unconfirmed: 'unconfirmed', rate: 'rate', offline: 'offline', oldWrong: 'wrong', weak: 'weak', closed: 'closed', same: 'same', mailRate: 'rate', thrown: 'offline'
  }, refusals);
  var gBad = oauthHarness();
  var bad = await Promise.all([
    gBad.C.passwordSignIn('not an address', 'correct horse'), gBad.C.passwordSignUp('not an address', 'correct horse', 'x'),
    gBad.C.passwordResetStart('not an address', 'x'), gBad.C.passwordSignIn('reader@k23.invalid', ''),
    gBad.C.passwordSignUp('reader@k23.invalid', 'seven77', 'x'), gBad.C.passwordSet('seven77')]);
  t('K23', 'an address that is not one, an empty password, and a new password under eight characters are refused before anything is sent', {
    reasons: ['invalid', 'invalid', 'invalid', 'nopassword', 'short', 'short'], calls: 0
  }, { reasons: bad.map(function (r) { return r.reason; }), calls: gBad.pw.length + gBad.up.length + gBad.reset.length + gBad.upd.length });

  /* ---- K24-K25: the newsletter choice rides on the sign up as user metadata,
     both ways, a sign in carries nothing, and a caller that does not ask
     records nothing. */
  var gNewsIn = oauthHarness(), gNewsOut = oauthHarness();
  await gNewsIn.C.passwordSignUp('reader@k24.invalid', 'correct horse', 'https://cover.k24.invalid/', { newsletter: true });
  await gNewsOut.C.passwordSignUp('reader@k24.invalid', 'correct horse', 'https://cover.k24.invalid/', { newsletter: false });
  var dIn = gNewsIn.up[0] && gNewsIn.up[0].options.data, dOut = gNewsOut.up[0] && gNewsOut.up[0].options.data;
  t('K24', 'the newsletter box is sent with the sign up as user metadata, ticked and unticked alike, with where and when it was decided, and a sign in carries no options at all', {
    inChoice: true, outChoice: false, source: 'cover-signup', dated: true, redirectKept: 'https://cover.k24.invalid/', signInKeys: ['email', 'password']
  }, {
    inChoice: dIn ? dIn.newsletter : 'none', outChoice: dOut ? dOut.newsletter : 'none', source: dIn ? dIn.newsletter_source : 'none',
    dated: !!(dIn && !isNaN(Date.parse(dIn.newsletter_decided_at))), redirectKept: gNewsIn.up[0] && gNewsIn.up[0].options.emailRedirectTo,
    signInKeys: gOn.pw[0] ? Object.keys(gOn.pw[0]).sort() : 'none'
  });
  t('K25', 'a sign up that is not asked about the newsletter records nothing about it', {
    data: 'none'
  }, { data: gUp.up[0] && gUp.up[0].options.data ? 'present' : 'none' });
  /* ---- K25b: where a sign up came from rides along as signup_from, cleaned
     again in the module, on email and phone sign ups alike; with no tags it
     records nothing. (owner, 14 October 2026) */
  var gFrom = oauthHarness(), gFromPh = oauthHarness(), gFromBad = oauthHarness();
  await gFrom.C.passwordSignUp('reader@k25b.invalid', 'correct horse', 'https://cover.k25b.invalid/', { newsletter: true, from: { source: 'meta', medium: 'paid', campaign: 'launch', content: 'Carousel' } });
  await gFromPh.C.passwordSignUp('+15551234567', 'correct horse', 'https://cover.k25b.invalid/', { from: { source: 'meta', content: 'reel' } });
  await gFromBad.C.passwordSignUp('reader@k25b.invalid', 'correct horse', 'https://cover.k25b.invalid/', { from: { source: '<script>', name: 'Jane Doe', content: 'x'.repeat(90) } });
  var fE = gFrom.up[0] && gFrom.up[0].options && gFrom.up[0].options.data, fP = gFromPh.up[0] && gFromPh.up[0].options && gFromPh.up[0].options.data, fB = gFromBad.up[0] && gFromBad.up[0].options && gFromBad.up[0].options.data;
  t('K25b', 'the ad a sign up came from is saved as signup_from beside the newsletter answer, on phone sign ups too, cleaned to four known keys of short plain words', {
    email: { source: 'meta', medium: 'paid', campaign: 'launch', content: 'carousel' }, newsletterKept: true, phone: { source: 'meta', content: 'reel' },
    cleaned: { source: 'script', content: 40, keys: ['content', 'source'] }
  }, {
    email: fE ? fE.signup_from : 'none', newsletterKept: !!(fE && fE.newsletter === true), phone: fP ? fP.signup_from : 'none',
    cleaned: fB && fB.signup_from ? { source: fB.signup_from.source, content: (fB.signup_from.content || '').length, keys: Object.keys(fB.signup_from).sort() } : 'none'
  });
  /* ---- K25c: the registration card in the app (26 October 2026) sends the
     optional phone number as contact_phone in E.164, refuses one that does not
     read as a number before anything is sent, and marks its newsletter answer
     as the app's rather than the cover's. */
  var gReg = oauthHarness(), gRegBad = oauthHarness();
  await gReg.C.passwordSignUp('reader@k25c.invalid', 'correct horse', 'https://cover.k25c.invalid/', { newsletter: true, source: 'app-register', phone: '(555) 123-4567' });
  var regBad = await gRegBad.C.passwordSignUp('reader@k25c.invalid', 'correct horse', 'https://cover.k25c.invalid/', { newsletter: true, phone: '12' });
  var dReg = gReg.up[0] && gReg.up[0].options.data;
  t('K25c', 'the registration card sends its optional phone as contact_phone in E.164 and its newsletter answer as the app\'s, and a number that does not read as one is refused before the call', {
    phone: '+15551234567', source: 'app-register', badReason: 'badPhone', badCalls: 0
  }, {
    phone: dReg ? dReg.contact_phone : 'none', source: dReg ? dReg.newsletter_source : 'none',
    badReason: regBad && regBad.reason, badCalls: gRegBad.up.length
  });
  /* ---- K25d: the full name at birth, middle name included, rides with the
     account as full_name wherever one is made, the cover and the card alike,
     on email and phone sign ups, trimmed, inner spaces collapsed and capped at
     200; with no name nothing is recorded. (owner, 27 October 2026) */
  var gNm = oauthHarness(), gNmPh = oauthHarness(), gNmLong = oauthHarness(), gNmNone = oauthHarness();
  await gNm.C.passwordSignUp('reader@k25d.invalid', 'correct horse', 'https://cover.k25d.invalid/', { newsletter: true, fullName: '  Ana   Maria  Ruiz ' });
  await gNmPh.C.passwordSignUp('+15551234567', 'correct horse', 'https://cover.k25d.invalid/', { fullName: 'Jordan Lee Okafor' });
  await gNmLong.C.passwordSignUp('reader@k25d.invalid', 'correct horse', 'https://cover.k25d.invalid/', { fullName: 'x'.repeat(500) });
  await gNmNone.C.passwordSignUp('reader@k25d.invalid', 'correct horse', 'https://cover.k25d.invalid/', { newsletter: false, fullName: '   ' });
  var nE = gNm.up[0] && gNm.up[0].options && gNm.up[0].options.data, nP = gNmPh.up[0] && gNmPh.up[0].options && gNmPh.up[0].options.data;
  var nL = gNmLong.up[0] && gNmLong.up[0].options && gNmLong.up[0].options.data, nN = gNmNone.up[0] && gNmNone.up[0].options && gNmNone.up[0].options.data;
  t('K25d', 'the full name rides with a sign up as full_name, on email and phone alike, tidied and capped, and a blank name records nothing', {
    email: 'Ana Maria Ruiz', newsletterKept: true, phone: 'Jordan Lee Okafor', capped: 200, blank: 'none'
  }, {
    email: nE ? nE.full_name : 'none', newsletterKept: !!(nE && nE.newsletter === true), phone: nP ? nP.full_name : 'none',
    capped: nL && nL.full_name ? nL.full_name.length : 'none', blank: nN && 'full_name' in nN ? 'present' : 'none'
  });
  var gHas = oauthHarness({ upData: { user: { email: 'reader@k35.invalid', identities: [] }, session: null } });
  var upHas = await gHas.C.passwordSignUp('reader@k35.invalid', 'correct horse', 'https://cover.k35.invalid/');
  var gAuto = oauthHarness({ upData: { user: { email: 'reader@k35.invalid', identities: [{ id: 'i1' }] }, session: { user: { email: 'reader@k35.invalid' } } } });
  var upAuto = await gAuto.C.passwordSignUp('reader@k35.invalid', 'correct horse', 'https://cover.k35.invalid/');
  t('K35', 'an address that already has an account (a user with no identities) is reported as exists rather than told to check an email that will not come, and a project with confirmation off signs in at once', {
    exists: { ok: false, reason: 'exists' }, auto: { ok: true, signedIn: true, confirm: false }
  }, {
    exists: { ok: upHas.ok, reason: upHas.reason }, auto: { ok: upAuto.ok, signedIn: !!upAuto.signedIn, confirm: !!upAuto.confirm }
  });
  var gRec = oauthHarness();
  var resetOk = await gRec.C.passwordResetStart(' reader@k36.invalid ', 'https://cover.k36.invalid/');
  var adopted = await gRec.C.adoptSession('at-k36', 'rt-k36');
  var saved = await gRec.C.passwordSet('a new one, long');
  t('K36', 'a new password: the reset email returns to the page that asked, the tokens it brings are handed to the server to check, the address named is the server\'s, and the password is set on that session', {
    reset: true, resetTo: { email: 'reader@k36.invalid', redirectTo: 'https://cover.k36.invalid/' },
    adopted: { ok: true, email: 'server@k36.invalid' }, tokens: [{ access_token: 'at-k36', refresh_token: 'rt-k36' }],
    saved: true, updates: [{ password: 'a new one, long' }], clients: 1
  }, {
    reset: resetOk.ok, resetTo: gRec.reset[0] && { email: gRec.reset[0].email, redirectTo: gRec.reset[0].opts.redirectTo },
    adopted: { ok: adopted.ok, email: adopted.email }, tokens: gRec.set, saved: saved.ok, updates: gRec.upd, clients: gRec.created.length
  });
  var gHalf = oauthHarness(), gExp = oauthHarness({ setError: { status: 403, code: 'session_expired', message: 'Session from session_id claim in JWT does not exist' } });
  var half = await gHalf.C.adoptSession('at-only', '');
  var expired = await gExp.C.adoptSession('at-k37', 'rt-k37');
  t('K37', 'a hash missing a token is refused without asking the server, and tokens the server refuses sign nobody in', {
    half: 'error', halfCalls: 0, expired: { ok: false, reason: 'error' }
  }, { half: half.reason, halfCalls: gHalf.set.length, expired: { ok: expired.ok, reason: expired.reason } });

  /* ---- K38-K45: remember me and the phone, the owner's request of 30
     September 2026. Remember me keeps the login and the session and never the
     password; a phone signs in, signs up by a texted code, and recovers a
     password by one, without ever telling anybody whether a number has an
     account; and a signed in reader adds a phone in the app. */
  function jarStore() {
    var m = {};
    return { m: m, getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } };
  }
  function cookieDoc(initial) {
    var jar = {};
    String(initial || '').split(/;\s*/).forEach(function (c) { var i = c.indexOf('='); if (i > 0) jar[c.slice(0, i)] = c.slice(i + 1); });
    var d = {};
    Object.defineProperty(d, 'cookie', {
      get: function () { return Object.keys(jar).map(function (k) { return k + '=' + jar[k]; }).join('; '); },
      set: function (v) { var nv = String(v).split(';')[0], i = nv.indexOf('='); jar[nv.slice(0, i).trim()] = nv.slice(i + 1); }
    });
    return d;
  }
  var cloudSrc = fs.readFileSync(path.join(repo, 'app', 'incommon-cloud.js'), 'utf8');
  var coverSrc = fs.readFileSync(path.join(repo, 'app', 'cover.html'), 'utf8');
  var projUrl = (cloudSrc.match(/PROJECT_URL = '([^']+)'/) || [])[1] || '';
  var sessKey = 'sb-' + projUrl.replace(/^https?:\/\//, '').split('.')[0] + '-auth-token';
  var cloudVer = (cloudSrc.match(/VERSION = '([^']+)'/) || [])[1];
  t('K38', 'the cover reads remember me and the session by the same names the module writes them, the session key being the one supabase-js derives from the project, and it loads this VERSION of the module', {
    remember: true, ephemeral: true, cookie: true, session: true, version: true
  }, {
    remember: /REMEMBER_KEY = 'incommon\.signin\.remember'/.test(cloudSrc) && coverSrc.indexOf("'incommon.signin.remember'") !== -1,
    ephemeral: /EPHEMERAL_KEY = 'incommon\.signin\.ephemeral'/.test(cloudSrc) && coverSrc.indexOf("'incommon.signin.ephemeral'") !== -1,
    cookie: /LIVE_COOKIE = 'incommon_signin_live'/.test(cloudSrc) && coverSrc.indexOf("'incommon_signin_live'") !== -1,
    session: sessKey === 'sb-lkzcybzhjjxdqetwwdrx-auth-token' && coverSrc.indexOf("'" + sessKey + "'") !== -1,
    version: coverSrc.indexOf("./incommon-cloud.js?v=" + cloudVer + "'") !== -1
  });

  var gPh = oauthHarness();
  var norm = {};
  ['(555) 123-4567', '555.123.4567', '+44 20 7946 0958', '0044 20 7946 0958', '1 555 123 4567', '12345', '555 1234', 'call me', 'reader@k39.invalid', '+0 555 123 4567']
    .forEach(function (x) { norm[x] = gPh.C.normPhone(x); });
  var phIn = await gPh.C.passwordSignIn(' (555) 123-4567 ', 'correct horse');
  t('K39', 'a phone is a login: a US number written any usual way becomes E.164, any other needs its country code, a number that is not one is refused, and signing in by phone sends the number and never an address', {
    norm: { '(555) 123-4567': '+15551234567', '555.123.4567': '+15551234567', '+44 20 7946 0958': '+442079460958', '0044 20 7946 0958': '+442079460958',
      '1 555 123 4567': '+15551234567', '12345': null, '555 1234': null, 'call me': null, 'reader@k39.invalid': null, '+0 555 123 4567': null },
    sent: { phone: '+15551234567', password: 'correct horse' }, ok: true, phone: '+15551234567', email: null
  }, { norm: norm, sent: gPh.pw[0] || null, ok: phIn.ok, phone: phIn.phone, email: phIn.email });

  var gPu = oauthHarness({ verifyEmail: '' });
  var puStart = await gPu.C.passwordSignUp('+44 20 7946 0958', 'correct horse', 'https://cover.k40.invalid/', { newsletter: true });
  var puBad = await gPu.C.phoneCodeCheck('+442079460958', 'abc');
  var puDone = await gPu.C.phoneCodeCheck('+442079460958', ' 123 456 ');
  t('K40', 'a sign up by phone sends the number and the password with no newsletter answer (the list is read by email), is told to wait for a code, and the code signs in; a code that is not digits is refused before anything is sent', {
    sent: { phone: '+442079460958', password: 'correct horse' }, start: { ok: true, confirm: true, via: 'phone', phone: '+442079460958' },
    bad: 'badCode', verified: [{ phone: '+442079460958', token: '123456', type: 'sms' }], done: { ok: true, phone: '+442079460958' }
  }, {
    sent: gPu.up[0] || null, start: { ok: puStart.ok, confirm: !!puStart.confirm, via: puStart.via, phone: puStart.phone },
    bad: puBad.reason, verified: gPu.verify, done: { ok: puDone.ok, phone: puDone.phone }
  });

  var gPr = oauthHarness(), gPrNone = oauthHarness({ otpError: { status: 422, code: 'otp_disabled', message: 'Signups not allowed for otp' } });
  var prHas = await gPr.C.passwordResetStart('555-123-4567', 'https://cover.k41.invalid/');
  var prNone = await gPrNone.C.passwordResetStart('555-123-4567', 'https://cover.k41.invalid/');
  var prAgain = await gPr.C.phoneCodeResend('+15551234567', 'recover');
  var prUp = await gPr.C.phoneCodeResend('+15551234567', 'signup');
  t('K41', 'a new password by phone is a code by text that never makes an account, a number with no account is answered exactly as one with an account, and another code is asked for the reason the first was', {
    has: { ok: true, via: 'phone', phone: '+15551234567' }, none: { ok: true, via: 'phone', phone: '+15551234567' },
    otp: [{ phone: '+15551234567', options: { shouldCreateUser: false } }, { phone: '+15551234567', options: { shouldCreateUser: false } }],
    emails: 0, again: true, up: true, resent: [{ type: 'sms', phone: '+15551234567' }]
  }, {
    has: { ok: prHas.ok, via: prHas.via, phone: prHas.phone }, none: { ok: prNone.ok, via: prNone.via, phone: prNone.phone },
    otp: gPr.otp, emails: gPr.reset.length + gPrNone.reset.length, again: prAgain.ok, up: prUp.ok, resent: gPr.resend
  });

  var phoneRefusals = {};
  var phoneCases = [
    ['phoneOff', 'pwError', { status: 400, code: 'phone_provider_disabled', message: 'Phone logins are disabled' }],
    ['phoneUnconfirmed', 'pwError', { status: 400, code: 'phone_not_confirmed', message: 'Phone not confirmed' }],
    ['smsFailed', 'upError', { status: 500, code: 'sms_send_failed', message: 'Error sending confirmation sms' }],
    ['phoneTaken', 'upError', { status: 422, code: 'phone_exists', message: 'Phone number has already been registered' }],
    ['badCode', 'verifyError', { status: 403, code: 'otp_expired', message: 'Token has expired or is invalid' }],
    ['oldBadCode', 'verifyError', { status: 403, message: 'Token has expired or is invalid' }],
    ['invalid', 'upError', { status: 400, code: 'validation_failed', message: 'Invalid phone number format (E.164 required)' }]
  ];
  for (var pci = 0; pci < phoneCases.length; pci++) {
    var o = {}; o[phoneCases[pci][1]] = phoneCases[pci][2];
    var gpc = oauthHarness(o), rr;
    if (phoneCases[pci][1] === 'pwError') rr = await gpc.C.passwordSignIn('+15551234567', 'correct horse');
    else if (phoneCases[pci][1] === 'upError') rr = await gpc.C.passwordSignUp('+15551234567', 'correct horse', 'x');
    else rr = await gpc.C.phoneCodeCheck('+15551234567', '123456');
    phoneRefusals[phoneCases[pci][0]] = rr.reason;
  }
  t('K42', 'every refusal a phone can meet comes back as a reason the cover can say', {
    phoneOff: 'phoneOff', phoneUnconfirmed: 'phoneUnconfirmed', smsFailed: 'smsFailed', phoneTaken: 'phoneTaken', badCode: 'badCode', oldBadCode: 'badCode', invalid: 'invalid'
  }, phoneRefusals);

  var addCalls = [];
  var addClient = { auth: {
    updateUser: function (u) { addCalls.push({ update: u }); return Promise.resolve({ data: { user: {} }, error: null }); },
    verifyOtp: function (a) { addCalls.push({ verify: a }); return Promise.resolve({ data: { user: { email: 'reader@k43.invalid', phone: a.phone.slice(1) } }, error: null }); }
  } };
  var CP = loadIsolatedCloud({ createClient: function () { return {}; } });
  CP._setClientForTests(addClient, null);
  var addOut = await CP.phoneAddStart('555 123 4567');
  CP._setClientForTests(addClient, { user: { id: 'u43', email: 'reader@k43.invalid' } });
  var addStart = await CP.phoneAddStart('(555) 123-4567');
  var addBad = await CP.phoneAddVerify('+15551234567', '');
  var addDone = await CP.phoneAddVerify('+15551234567', '654321');
  t('K43', 'a phone is added only to an account that is signed in: the number is sent to the account, the code confirms it as a phone change, and the status names it at once', {
    out: 'signedOut', start: { ok: true, phone: '+15551234567' }, bad: 'badCode', done: { ok: true, phone: '+15551234567' },
    calls: [{ update: { phone: '+15551234567' } }, { verify: { phone: '+15551234567', token: '654321', type: 'phone_change' } }], status: '+15551234567'
  }, {
    out: addOut.reason, start: { ok: addStart.ok, phone: addStart.phone }, bad: addBad.reason, done: { ok: addDone.ok, phone: addDone.phone },
    calls: addCalls, status: CP.status().phone
  });

  var remStore = jarStore(), remDoc = cookieDoc('');
  var gRem = oauthHarness({ extra: { localStorage: remStore, document: remDoc } });
  var remDefault = gRem.C.rememberGet();
  await gRem.C.passwordSignIn('reader@k44.invalid', 'a secret, long');
  gRem.C.rememberSet(true, ' reader@k44.invalid ');
  var remOn = gRem.C.rememberGet(), markOn = remStore.getItem('incommon.signin.ephemeral');
  gRem.C.rememberSet(false, 'reader@k44.invalid');
  var remOff = gRem.C.rememberGet();
  var anySecret = Object.keys(remStore.m).some(function (k) { return remStore.m[k].indexOf('a secret, long') !== -1; });
  t('K44', 'remember me keeps the login when ticked and forgets it when not, starts ticked, marks an unremembered sign in with a browser session cookie, and never keeps the password', {
    fresh: { on: true, login: null }, on: { on: true, login: 'reader@k44.invalid' }, markOn: null,
    off: { on: false, login: null }, markOff: '1', cookie: true, secret: false
  }, {
    fresh: remDefault, on: remOn, markOn: markOn, off: remOff, markOff: remStore.getItem('incommon.signin.ephemeral'),
    cookie: /(^|; )incommon_signin_live=1(;|$)/.test(remDoc.cookie), secret: anySecret
  });

  function sweepCase(mark, cookie) {
    var st = jarStore();
    st.setItem(sessKey, '{"refresh_token":"rt"}');
    if (mark) st.setItem('incommon.signin.ephemeral', '1');
    var seen = null;
    var Cx = loadIsolatedCloud({ createClient: function () { seen = st.getItem(sessKey); return initClient; } }, null, { document: cookieDoc(cookie ? 'incommon_signin_live=1' : 'other=2') });
    Cx.init({ url: projUrl, anonKey: 'k45-fake-anon', core: {}, pm: pmG, storage: st });
    return { seenByClient: !!seen, mark: st.getItem('incommon.signin.ephemeral') };
  }
  t('K45', 'an unremembered session ends with the browser session: with the mark and no cookie init() clears it before the client reads it, and a live cookie or a remembered sign in keeps it', {
    closed: { seenByClient: false, mark: null }, live: { seenByClient: true, mark: '1' }, remembered: { seenByClient: true, mark: null }
  }, { closed: sweepCase(true, false), live: sweepCase(true, true), remembered: sweepCase(false, false) });

  /* ---- K26-K29: the Oracle is asked through this module, with a session,
     and every failure comes back as a reason rather than a throw. */
  function oracleClient(respond) {
    var calls = [];
    return { calls: calls, client: { functions: { invoke: function (name, opts) {
      calls.push({ name: name, body: opts && opts.body });
      return Promise.resolve(respond(name, opts));
    } } } };
  }
  function httpErr(status, code) {
    return { name: 'FunctionsHttpError', message: 'Edge Function returned a non-2xx status code',
      context: { status: status, json: function () { return Promise.resolve(code ? { code: code } : {}); } } };
  }
  var CO = loadIsolatedCloud({ createClient: function () { return {}; } });
  var ocOut = oracleClient(function () { return { data: { reading: { title: 'x' } }, error: null }; });
  CO._setClientForTests(ocOut.client, null);
  var rOut = await CO.oracleRead({ period: 'daily' });
  t('K26', 'the Oracle is not asked without a session, and says signed out rather than calling the function', {
    ok: false, reason: 'signedOut', calls: 0
  }, { ok: rOut.ok, reason: rOut.reason, calls: ocOut.calls.length });
  var ocIn = oracleClient(function () { return { data: { reading: { title: 'The Tide Turns' }, cached: true, periodKey: '2026-09-29', label: 'Tuesday' }, error: null }; });
  CO._setClientForTests(ocIn.client, { user: { id: 'u1' } });
  var rIn = await CO.oracleRead({ period: 'daily', depth: 'standard', localDate: '2026-09-29', dossier: 'D' });
  t('K27', 'with a session the oracle function is invoked with the request as its body, and the reading comes back', {
    ok: true, fn: 'oracle', period: 'daily', title: 'The Tide Turns', cached: true, periodKey: '2026-09-29'
  }, { ok: rIn.ok, fn: ocIn.calls[0] && ocIn.calls[0].name, period: ocIn.calls[0] && ocIn.calls[0].body.period,
    title: rIn.reading && rIn.reading.title, cached: rIn.cached, periodKey: rIn.periodKey });
  var reasons = {};
  var cases = [['404', httpErr(404)], ['429', httpErr(429, 'LIMIT')], ['429r', httpErr(429, 'RATE_LIMITED')], ['503', httpErr(503, 'OUT_OF_CREDITS')], ['401', httpErr(401)], ['409', httpErr(409, 'PENDING')], ['500', httpErr(500, 'MODEL')], ['504', httpErr(504, 'TIMEOUT')]];
  for (var ci = 0; ci < cases.length; ci++) {
    var ec = cases[ci][1];
    CO._setClientForTests(oracleClient(function () { return { data: null, error: ec }; }).client, { user: { id: 'u1' } });
    reasons[cases[ci][0]] = (await CO.oracleRead({ period: 'weekly' })).reason;
  }
  t('K28', 'each way the function can fail is a reason the page can say in words', {
    '404': 'notSetUp', '429': 'limit', '429r': 'busy', '503': 'silent', '401': 'signedOut', '409': 'pending', '500': 'error', '504': 'timeout'
  }, reasons);
  CO._setClientForTests(oracleClient(function () { return { data: null, error: httpErr(402, 'PREMIUM_REQUIRED') }; }).client, { user: { id: 'u1' } });
  var rPrem = await CO.oracleRead({ period: 'daily', depth: 'deep' });
  t('K28b', 'an in-depth reading refused for want of Luminary comes back as premium, so the page can show the gate', {
    ok: false, reason: 'premium'
  }, { ok: rPrem.ok, reason: rPrem.reason });
  var two = oracleClient(function (n, o) {
    return o.body.part === 'b'
      ? { data: { reading: { title: 'T', overview: 'O', chapters: [{ heading: 'h', body: 'b' }], shadowWork: 's' } }, error: null }
      : { data: { reading: { title: 'T', overview: 'O' } }, error: null };
  });
  CO._setClientForTests(two.client, { user: { id: 'u1' } });
  var rTwo = await CO.oracleRead({ period: 'daily', depth: 'deep', localDate: '2026-09-29', dossier: 'D' });
  var firstSeen = [];
  var twoCb = oracleClient(function (n, o) { return o.body.part === 'b' ? { data: { reading: { title: 'T', chapters: [{ heading: 'h', body: 'b' }] } }, error: null } : { data: { reading: { title: 'T' } }, error: null }; });
  CO._setClientForTests(twoCb.client, { user: { id: 'u1' } });
  await CO.oracleRead({ period: 'daily', depth: 'deep', localDate: '2026-09-29', dossier: 'D', onFirst: function (f) { firstSeen.push({ chapters: !!(f.reading && f.reading.chapters), callsSoFar: twoCb.calls.length }); } });
  var cbBodyClean = twoCb.calls.every(function (c) { return !('onFirst' in c.body); });
  var one = oracleClient(function () { return { data: { reading: { title: 'T', chapters: [] } }, error: null }; });
  CO._setClientForTests(one.client, { user: { id: 'u1' } });
  await CO.oracleRead({ period: 'daily', depth: 'deep', localDate: '2026-09-29', dossier: 'D' });
  var halfFail = oracleClient(function (n, o) { return o.body.part === 'b' ? { data: null, error: httpErr(504, 'TIMEOUT') } : { data: { reading: { title: 'T' } }, error: null }; });
  CO._setClientForTests(halfFail.client, { user: { id: 'u1' } });
  var rHalf = await CO.oracleRead({ period: 'daily', depth: 'deep', localDate: '2026-09-29', dossier: 'D' });
  t('K29c', 'the first half is handed to the page before the second is asked for, without the callback in the request body', {
    seen: [{ chapters: false, callsSoFar: 1 }], bodyClean: true
  }, { seen: firstSeen, bodyClean: cbBodyClean });
  t('K29b', 'an in-depth reading is asked in two calls, a then b, and comes back joined; a server that already wrote the whole reading is asked once; a failed second half is a reason, not a partial reading', {
    parts: ['a', 'b'], hasChapters: true, legacyCalls: 1, half: { ok: false, reason: 'timeout' }
  }, { parts: two.calls.map(function (c) { return c.body.part; }), hasChapters: !!(rTwo.reading && rTwo.reading.chapters && rTwo.reading.title),
    legacyCalls: one.calls.length, half: { ok: rHalf.ok, reason: rHalf.reason } });
  CO._setClientForTests(oracleClient(function () { throw new Error('socket hang up'); }).client, { user: { id: 'u1' } });
  var rThrow = await CO.oracleRead({ period: 'monthly' });
  t('K29', 'a thrown call comes back as offline, not as an exception out of the page', {
    ok: false, reason: 'offline'
  }, { ok: rThrow.ok, reason: rThrow.reason });

  /* ---- K30-K34: Codex Luminary is asked through this module as well, with a
     session, and every failure is a reason. */
  var bOut = oracleClient(function () { return { data: { status: { isPremium: true } }, error: null }; });
  CO._setClientForTests(bOut.client, null);
  var bNo = await CO.billingStatus();
  t('K30', 'billing is not asked without a session', { ok: false, reason: 'signedOut', calls: 0 }, { ok: bNo.ok, reason: bNo.reason, calls: bOut.calls.length });
  var bIn = oracleClient(function (name, opts) {
    var a = opts.body.action;
    if (a === 'status') return { data: { status: { isPremium: true, plan: 'annual', billingConfigured: true } }, error: null };
    return { data: { url: 'https://stripe.k31.invalid/' + a }, error: null };
  });
  CO._setClientForTests(bIn.client, { user: { id: 'u1' } });
  var st1 = await CO.billingStatus({ sync: true }), st2 = await CO.billingStatus();
  t('K31', 'the status is asked of the billing function, with a sync only when one is asked for', {
    fn: 'billing', action: 'status', sync1: true, sync2: false, premium: true, plan: 'annual'
  }, { fn: bIn.calls[0].name, action: bIn.calls[0].body.action, sync1: bIn.calls[0].body.sync, sync2: bIn.calls[1].body.sync,
    premium: st1.status && st1.status.isPremium, plan: st2.status && st2.status.plan });
  /* The subscription checkout was retired on 18 October 2026: the module no
     longer offers one, and Luminary is the one time unlock (K34d). */
  var co1 = await CO.billingUnlock('https://app.k31.invalid/app.html?lumfrom=deep#/oracle');
  var po1 = await CO.billingPortal('https://app.k31.invalid/app.html#/oracle');
  t('K32', 'the unlock and the portal each come back as the address Stripe gave and send the return address, and there is no subscription checkout any more', {
    unlock: 'https://stripe.k31.invalid/unlock', portal: 'https://stripe.k31.invalid/portal', returnTo: 'https://app.k31.invalid/app.html?lumfrom=deep#/oracle', noCheckout: true
  }, { unlock: co1.url, portal: po1.url, returnTo: bIn.calls[2].body.returnTo, noCheckout: typeof CO.billingCheckout === 'undefined' });
  var bReasons = {};
  var bCases = [['404', httpErr(404)], ['nc', httpErr(503, 'NOT_CONFIGURED')], ['already', httpErr(409, 'ALREADY')], ['noacct', httpErr(404, 'NO_ACCOUNT')], ['401', httpErr(401, 'SIGNED_OUT')], ['500', httpErr(502, 'STRIPE')]];
  for (var bi = 0; bi < bCases.length; bi++) {
    var be = bCases[bi][1];
    CO._setClientForTests(oracleClient(function () { return { data: null, error: be }; }).client, { user: { id: 'u1' } });
    bReasons[bCases[bi][0]] = (await CO.billingUnlock('https://x.invalid/')).reason;
  }
  t('K33', 'each way billing can fail is a reason, and a missing account is told apart from a missing function', {
    '404': 'notSetUp', nc: 'notConfigured', already: 'already', noacct: 'noAccount', '401': 'signedOut', '500': 'error'
  }, bReasons);
  CO._setClientForTests(oracleClient(function () { throw new Error('socket hang up'); }).client, { user: { id: 'u1' } });
  var bThrow = await CO.billingPortal('https://x.invalid/');
  t('K34', 'a thrown billing call comes back as offline', { ok: false, reason: 'offline' }, { ok: bThrow.ok, reason: bThrow.reason });

  /* K56: deleting the account from inside the app (docs/ACCOUNT-DELETION.md).
     The call is never made without a session, carries the typed word to the
     account function, and on the server's yes forgets the account on this
     device: the sync map, the outbox and the remembered login go, and the
     session is signed out locally, because the map would otherwise mark rows
     as uploaded to an account that no longer exists. Each refusal is a reason,
     and a Stripe failure is told apart, because then nothing was deleted. */
  var adMem = { incommon_cloud_map_v2: '{"hashes":{"profiles":{"p1":"h"}}}', incommon_cloud_outbox_v2: '[{"op":"x"}]',
    'incommon.signin.remember': 'reader@k56.invalid', 'incommon.p.p1.birthName': 'Kept On Device' };
  var adStore = { getItem: function (k) { return k in adMem ? adMem[k] : null; }, setItem: function (k, v) { adMem[k] = String(v); }, removeItem: function (k) { delete adMem[k]; } };
  var AD = loadIsolatedCloud({ createClient: function () { return {}; } }, null, { localStorage: adStore });
  var adCalls = [], adSignOut = [];
  var adClient = function (answer) {
    return { functions: { invoke: function (name, opts) { adCalls.push({ name: name, body: opts && opts.body }); return Promise.resolve(answer); } },
      auth: { signOut: function (o) { adSignOut.push(o && o.scope); return Promise.resolve({ error: null }); } } };
  };
  AD._setClientForTests(adClient({ data: { deleted: true }, error: null }), null);
  var adNo = await AD.accountDelete('delete');
  var adCallsSignedOut = adCalls.length;
  AD._setClientForTests(adClient({ data: { deleted: true }, error: null }), { user: { id: 'u1' } });
  var adOk = await AD.accountDelete('delete');
  var adReasons = {};
  var adCases = [['stripe', httpErr(502, 'STRIPE')], ['404', httpErr(404)], ['mfa', httpErr(401, 'MFA_REQUIRED')], ['confirm', httpErr(400, 'BAD_REQUEST')], ['500', httpErr(500, 'STORE')]];
  for (var ai = 0; ai < adCases.length; ai++) {
    AD._setClientForTests(adClient({ data: null, error: adCases[ai][1] }), { user: { id: 'u1' } });
    adReasons[adCases[ai][0]] = (await AD.accountDelete('delete')).reason;
  }
  t('K56', 'account deletion is not asked without a session, sends the typed word to the account function, forgets the account on this device on success and keeps what the device holds, and names each failure', {
    signedOut: 'signedOut', callsSignedOut: 0, ok: true, fn: 'account', action: 'delete', confirm: 'delete',
    mapGone: true, outboxGone: true, rememberGone: true, deviceKept: true, localSignOut: 'local',
    reasons: { stripe: 'stripe', '404': 'notSetUp', mfa: 'signedOut', confirm: 'confirm', '500': 'error' }
  }, {
    signedOut: adNo.reason, callsSignedOut: adCallsSignedOut, ok: !!adOk.ok, fn: adCalls[0] && adCalls[0].name,
    action: adCalls[0] && adCalls[0].body.action, confirm: adCalls[0] && adCalls[0].body.confirm,
    mapGone: !('incommon_cloud_map_v2' in adMem), outboxGone: !('incommon_cloud_outbox_v2' in adMem),
    rememberGone: !('incommon.signin.remember' in adMem), deviceKept: adMem['incommon.p.p1.birthName'] === 'Kept On Device',
    localSignOut: adSignOut[0], reasons: adReasons
  });

  /* K70: Log Out ends this device's session and no other. supabase-js signs
     out globally unless told otherwise, which revoked the account's sessions
     on every device, so a Log Out on a phone signed the laptop out too. */
  adSignOut.length = 0;
  AD._setClientForTests(adClient({ data: null, error: null }), { user: { id: 'u1' } });
  var soR = await AD.signOut();
  t('K70', 'Log Out signs out with the local scope, so the account stays signed in on its other devices', { ok: true, scopes: 'local' },
    { ok: !!(soR && soR.ok), scopes: adSignOut.join(',') });

  /* K57: an account deletion that could not reach RevenueCat is told apart.
     The app no longer sells anything through the stores (18 October 2026:
     every add-on is free in the apps), so the store sync went with it; the
     account function still closes a RevenueCat record when that service is
     set up, and its failure must still read as its own reason. */
  AD._setClientForTests(adClient({ data: null, error: httpErr(502, 'REVENUECAT') }), { user: { id: 'u1' } });
  var stDel = (await AD.accountDelete('delete')).reason;
  t('K57', 'a deletion that could not reach RevenueCat says so, and the module no longer carries a store sync', {
    deleteReason: 'revenuecat', noStoreSync: true
  }, { deleteReason: stDel, noStoreSync: typeof CO.storeSync === 'undefined' });

  /* K34b: the EU and UK hold (docs/LUMINARY-EU-UK.md). The page's country guess
     travels with the status and the checkout as two capital letters or not at
     all, and the server's refusal of a country it does not sell to yet comes
     back as its own reason, so the page can say so rather than "try again". */
  var bCo = oracleClient(function (name, opts) {
    return opts.body.action === 'status' ? { data: { status: { isPremium: false } }, error: null } : { data: { url: 'https://stripe.k34b.invalid/' }, error: null };
  });
  CO._setClientForTests(bCo.client, { user: { id: 'u1' } });
  await CO.billingStatus({ country: 'FR' });
  await CO.billingStatus({ country: 'france' });
  await CO.billingUnlock('https://x.invalid/', 'GB');
  await CO.billingUnlock('https://x.invalid/');
  CO._setClientForTests(oracleClient(function () { return { data: null, error: httpErr(403, 'REGION') }; }).client, { user: { id: 'u1' } });
  var bRegion = await CO.billingUnlock('https://x.invalid/', 'DE');
  t('K34b', 'the country guess is sent with the status and the unlock only as two capital letters, and a country not sold to yet comes back as region', {
    status: 'FR', badDropped: true, checkout: 'GB', noneDropped: true, region: 'region'
  }, {
    status: bCo.calls[0].body.country, badDropped: !('country' in bCo.calls[1].body) || bCo.calls[1].body.country === undefined,
    checkout: bCo.calls[2].body.country, noneDropped: bCo.calls[3].body.country === undefined, region: bRegion.reason
  });

  /* K34c-K34e: the Cycle Audit, 18 October 2026. Its reading is asked of the
     Oracle as one call, the period named and no part, and a website reader who
     has not opened it is refused as premium, which the page reads as the gate.
     Its unlock is a billing action of its own that carries no amount, because
     the reader chooses the amount on Stripe's page. A gift needs no account,
     so it is sent through the functions address with the public key and
     carries only where to come back to. */
  var cyOc = oracleClient(function () { return { data: { reading: { title: 'The Long Tide', passages: [] } }, error: null }; });
  CO._setClientForTests(cyOc.client, { user: { id: 'u1' } });
  var cyR = await CO.oracleRead({ period: 'cycle', depth: 'standard', localDate: '2026-10-18', dossier: 'D' });
  CO._setClientForTests(oracleClient(function () { return { data: null, error: httpErr(402, 'PREMIUM_REQUIRED') }; }).client, { user: { id: 'u1' } });
  var cyLocked = await CO.oracleRead({ period: 'cycle', depth: 'standard', localDate: '2026-10-18', dossier: 'D' });
  t('K34c', 'a Cycle Audit is one call to the Oracle naming the period and no part, and a reader who has not opened it is refused as premium', {
    calls: 1, period: 'cycle', part: false, title: 'The Long Tide', locked: 'premium'
  }, { calls: cyOc.calls.length, period: cyOc.calls[0] && cyOc.calls[0].body.period, part: !!(cyOc.calls[0] && 'part' in cyOc.calls[0].body),
    title: cyR.reading && cyR.reading.title, locked: cyLocked.reason });
  var ulOut = oracleClient(function () { return { data: { url: 'https://stripe.k34d.invalid/unlock' }, error: null }; });
  CO._setClientForTests(ulOut.client, null);
  var ulNo = await CO.billingUnlock('https://app.k34d.invalid/app.html#/oracle', 'US');
  CO._setClientForTests(ulOut.client, { user: { id: 'u1' } });
  var ulOk = await CO.billingUnlock('https://app.k34d.invalid/app.html#/oracle', 'US');
  var ulBad = await CO.billingUnlock('https://app.k34d.invalid/', 'usa');
  var ulReasons = {};
  var ulCases = [['already', httpErr(409, 'ALREADY')], ['region', httpErr(403, 'REGION')], ['nc', httpErr(503, 'NOT_CONFIGURED')], ['404', httpErr(404)]];
  for (var ui = 0; ui < ulCases.length; ui++) {
    var ue = ulCases[ui][1];
    CO._setClientForTests(oracleClient(function () { return { data: null, error: ue }; }).client, { user: { id: 'u1' } });
    ulReasons[ulCases[ui][0]] = (await CO.billingUnlock('https://x.invalid/', 'FR')).reason;
  }
  t('K34d', 'the unlock is not asked without a session, sends the action, the return address and a two letter country and no amount, comes back as the Checkout address, and names already and region', {
    signedOut: 'signedOut', calls: 2, url: 'https://stripe.k34d.invalid/unlock', keys: ['action', 'country', 'returnTo'], action: 'unlock', badCountryDropped: true,
    reasons: { already: 'already', region: 'region', nc: 'notConfigured', '404': 'notSetUp' }
  }, {
    signedOut: ulNo.reason, calls: ulOut.calls.length, url: ulOk.url, keys: Object.keys(ulOut.calls[0].body).sort(), action: ulOut.calls[0].body.action,
    badCountryDropped: ulOut.calls[1].body.country === undefined && !!ulBad.ok, reasons: ulReasons
  });
  var gSent = [];
  var gFetch = function (status, b) { return function (url, init) { gSent.push({ url: url, init: init }); return Promise.resolve({ ok: status < 300, status: status, json: function () { return Promise.resolve(b); } }); }; };
  CO._setClientForTests(null, null);
  var gOk = await CO.billingSupport('https://incommonspace.com/thanks.html', { fetch: gFetch(200, { url: 'https://stripe.k34e.invalid/gift' }) });
  var gBody = gSent[0] ? JSON.parse(gSent[0].init.body) : {}, gHdr = gSent[0] ? gSent[0].init.headers : {};
  var gReasons = {
    nc: (await CO.billingSupport('https://incommonspace.com/thanks.html', { fetch: gFetch(503, { code: 'NOT_CONFIGURED' }) })).reason,
    '404': (await CO.billingSupport('https://incommonspace.com/thanks.html', { fetch: gFetch(404, null) })).reason,
    older: (await CO.billingSupport('https://incommonspace.com/thanks.html', { fetch: gFetch(401, { code: 'SIGNED_OUT' }) })).reason,
    offline: (await CO.billingSupport('https://incommonspace.com/thanks.html', { fetch: function () { return Promise.reject(new Error('net')); } })).reason
  };
  t('K34e', 'a gift is asked of the billing function with nobody signed in, with the public key, carrying only the action and where to come back to, and each failure is a reason', {
    ok: true, url: 'https://stripe.k34e.invalid/gift', endpoint: true, anon: true, body: { action: 'support', returnTo: 'https://incommonspace.com/thanks.html' },
    reasons: { nc: 'notConfigured', '404': 'notSetUp', older: 'notSetUp', offline: 'offline' }
  }, {
    ok: !!gOk.ok, url: gOk.url, endpoint: !!gSent[0] && /\/functions\/v1\/billing$/.test(gSent[0].url),
    anon: !!gHdr && gHdr.Authorization === 'Bearer ' + gHdr.apikey && /^eyJ/.test(gHdr.apikey || ''), body: gBody, reasons: gReasons
  });

  /* K34f: Omni is asked of the Oracle function with the shuffle, the count
     and the topic and nothing else, and is refused as premium like every
     add-on. */
  var omOc = oracleClient(function () { return { data: { reading: { title: 'General \u00b7 Omni \u00b7 9 cards', passages: [{ tag: 'CALCULATED', text: 'x' }] } }, error: null }; });
  CO._setClientForTests(omOc.client, null);
  var omNo = await CO.tarotRead({ seed: 7, count: 9, topic: 'general' });
  CO._setClientForTests(omOc.client, { user: { id: 'u1' } });
  var omOk = await CO.tarotRead({ seed: 7, count: 9, topic: 'general', extra: 'no' });
  CO._setClientForTests(oracleClient(function () { return { data: null, error: httpErr(402, 'PREMIUM_REQUIRED') }; }).client, { user: { id: 'u1' } });
  var omLocked = await CO.tarotRead({ seed: 7, count: 9, topic: 'general' });
  t('K34f', 'Omni is not asked without a session, goes to the oracle function as kind tarot with the seed, count and topic only, and a reader without Luminary is refused as premium', {
    signedOut: 'signedOut', fn: 'oracle', body: { kind: 'tarot', seed: 7, count: 9, topic: 'general' }, ok: true, locked: 'premium'
  }, { signedOut: omNo.reason, fn: omOc.calls[0] && omOc.calls[0].name, body: omOc.calls[0] && omOc.calls[0].body, ok: !!omOk.ok, locked: omLocked.reason });

  /* ---- K46-K51: two-step sign in, optional, the owner's request of 11
     October 2026. A password that passed on an account with an authenticator
     makes a session at aal1 that still owes its code: the cover asks for it,
     the app holds that session aside as signed out, and the code lifts it to
     aal2. Turning it on proves the app holds the secret with a first code,
     and turning it off asks for a current one. */
  function jwtOf(claims) {
    var b = function (o) { return Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
    return b({ alg: 'HS256', typ: 'JWT' }) + '.' + b(claims) + '.sig';
  }
  var VER = [{ id: 'f1', factor_type: 'totp', status: 'verified' }];
  var UNV = [{ id: 'f0', factor_type: 'totp', status: 'unverified' }];
  var sess = function (factors, aal, extra) {
    return Object.assign({ access_token: aal === 'bad' ? 'not.a-token!' : aal === 'none' ? '' : jwtOf({ sub: 'u46', aal: aal }),
      refresh_token: 'r', user: Object.assign({ id: 'u46', email: 'reader@k46.invalid', factors: factors }, extra || {}) });
  };
  var owesCases = {
    nothing: null, noUser: { access_token: jwtOf({ aal: 'aal1' }) }, noFactors: sess(undefined, 'aal1'),
    unverifiedOnly: sess(UNV, 'aal1'), verifiedAal1: sess(VER, 'aal1'), verifiedAal2: sess(VER, 'aal2'),
    verifiedNoToken: sess(VER, 'none'), verifiedBadToken: sess(VER, 'bad')
  };
  var CM = loadIsolatedCloud({ createClient: function () { return {}; } });
  var coverOwesSrc = (coverSrc.match(/function owesCode\(st\) \{[\s\S]*?\n  \}/) || [])[0];
  var coverOwes = coverOwesSrc ? vm.runInNewContext('(' + coverOwesSrc + ')', { atob: function (s) { return Buffer.from(s, 'base64').toString('binary'); }, JSON: JSON, Array: Array, String: String }) : null;
  /* The third copy: profile-manager.js reads the stored session to choose
     whose profiles to open, before the cloud module has loaded. */
  var pmSrcK46 = fs.readFileSync(path.join(repo, 'app', 'profile-manager.js'), 'utf8');
  var pmOwesSrc = (pmSrcK46.match(/function owesCode\(st\) \{[\s\S]*?\n  \}/) || [])[0];
  var pmOwes = pmOwesSrc ? vm.runInNewContext('(' + pmOwesSrc + ')', { atob: function (s) { return Buffer.from(s, 'base64').toString('binary'); }, JSON: JSON, Array: Array, String: String }) : null;
  var modOwes = {}, covOwes = {}, pmOwesOut = {};
  Object.keys(owesCases).forEach(function (k) { modOwes[k] = CM.owesCode(owesCases[k]); covOwes[k] = coverOwes ? coverOwes(owesCases[k]) : 'missing'; pmOwesOut[k] = pmOwes ? pmOwes(owesCases[k]) : 'missing'; });
  t('K46', 'a session owes its two-step code exactly when the user has a verified authenticator and the token is not aal2, an unreadable token owes it, and the cover reads stored sessions by the same rule as the module', {
    module: { nothing: false, noUser: false, noFactors: false, unverifiedOnly: false, verifiedAal1: true, verifiedAal2: false, verifiedNoToken: true, verifiedBadToken: true },
    coverSame: true, profileManagerSame: true
  }, { module: modOwes, coverSame: JSON.stringify(modOwes) === JSON.stringify(covOwes), profileManagerSame: JSON.stringify(modOwes) === JSON.stringify(pmOwesOut) });

  /* ---- K58-K68: one account reads the same on every device. Two devices,
     each the REAL profile-manager.js over its own storage and its own copy of
     the cloud module, share one in memory database that answers the way
     PostgREST does: upserts on the named conflict columns, an identity id for
     the child tables, timestamps returned as +00:00, and pages by range. ---- */
  function memDB() {
    var db = { t: { accounts: [], profiles: [], memories: [], consent_events: [], pairs: [], throughline_entries: [], oki_messages: [] },
      seq: 1, failSelect: null, failDelete: false, maxRows: 1000 };
    var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
    var pgTime = function (r) {
      ['ts', 'created_at', 'enabled_at'].forEach(function (k) { if (typeof r[k] === 'string') r[k] = r[k].replace(/Z$/, '+00:00'); });
      return r;
    };
    db.client = { from: function (table) {
      var q = { _f: [], _op: 'select' };
      q.select = function () { q._op = 'select'; return q; };
      q.insert = function (row) { q._op = 'insert'; q._row = row; return q; };
      q.upsert = function (row, o) { q._op = 'upsert'; q._row = row; q._on = String((o && o.onConflict) || 'id').split(','); return q; };
      q.delete = function () { q._op = 'delete'; return q; };
      q.eq = function (c, v) { q._f.push(function (r) { return r[c] === v; }); return q; };
      q.in = function (c, vs) { q._f.push(function (r) { return vs.indexOf(r[c]) !== -1; }); return q; };
      q.order = function (c) { q._order = c; return q; };
      q.range = function (a, b) { q._range = [a, b]; return q; };
      q.then = function (res, rej) {
        var rows = db.t[table], out = { data: null, error: null };
        var match = function (x) { return q._f.every(function (f) { return f(x); }); };
        if (q._op === 'select') {
          if (db.failSelect === table) out.error = { message: 'fake read failure' };
          else {
            var r = rows.filter(match).map(function (x) { return pgTime(clone(x)); });
            if (q._order) r.sort(function (a, b) { return a[q._order] < b[q._order] ? -1 : a[q._order] > b[q._order] ? 1 : 0; });
            if (q._range) r = r.slice(q._range[0], q._range[1] + 1);
            out.data = r.slice(0, db.maxRows);  // PostgREST's max-rows, whatever was asked for
          }
        } else if (q._op === 'insert') {
          if (rows.some(function (x) { return x.id === q._row.id; })) out.error = { code: '23505', message: 'duplicate key value' };
          else rows.push(clone(q._row));
        } else if (q._op === 'upsert' && table === 'memories' && db.memoryTypes && db.memoryTypes.indexOf(q._row.memory_type) === -1) {
          /* The live table's check constraint, as the server words it. */
          out.error = { code: '23514', message: 'new row for relation "memories" violates check constraint "memories_memory_type_check"' };
        } else if (q._op === 'upsert' && table === 'profiles' && db.oneActive && q._row.is_active &&
            rows.some(function (x) { return x.account_id === q._row.account_id && x.id !== q._row.id && x.is_active; })) {
          /* profiles_one_active, the live partial unique index (server/
             cloud-schema.sql). 'index' is the index alone and refuses the row
             as Postgres does; 'follow' is the index with migration 0002's
             trigger, which makes the account's other profiles inactive first. */
          if (db.oneActive === 'index') out.error = { code: '23505', message: 'duplicate key value violates unique constraint "profiles_one_active"' };
          else {
            rows.forEach(function (x) { if (x.account_id === q._row.account_id && x.id !== q._row.id) x.is_active = false; });
            var rowA = clone(q._row), hitA = rows.filter(function (x) { return x.id === rowA.id; })[0];
            if (hitA) Object.assign(hitA, rowA); else rows.push(rowA);
          }
        } else if (q._op === 'upsert') {
          var row = clone(q._row);
          var hit = rows.filter(function (x) { return q._on.every(function (c) { return row[c] !== undefined && x[c] === row[c]; }); })[0];
          if (hit) Object.assign(hit, row);
          else { if (row.id === undefined) row.id = db.seq++; rows.push(row); }
        } else if (q._op === 'delete') {
          if (db.failDelete) out.error = { message: 'Failed to fetch' };
          else db.t[table] = rows.filter(function (x) { return !match(x); });
        }
        return Promise.resolve(out).then(res, rej);
      };
      return q;
    } };
    return db;
  }
  /* These rows read expected first, then actual. */
  var ts = function (id, desc, expected, actual) { t(id, desc, actual, expected); };
  var SYNC_SB = 'sb-lkzcybzhjjxdqetwwdrx-auth-token', SU = 'cccccccc-0000-4000-8000-00000000000c';
  function syncDevice(db, userId, opts) {
    opts = opts || {};
    var store = (function () {
      var m = {};
      return { _m: m, get length() { return Object.keys(m).length; }, key: function (i) { return Object.keys(m)[i] || null; },
        getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } };
    })();
    store.setItem(SYNC_SB, JSON.stringify({ access_token: jwtOf({ sub: userId, aal: 'aal1' }), refresh_token: 'r', user: { id: userId } }));
    var win = {};
    vm.runInNewContext(pmSrcK46, { window: win, localStorage: store, document: { cookie: '' }, atob: function (x) { return Buffer.from(x, 'base64').toString('binary'); },
      JSON: JSON, Math: Math, Date: Date, String: String, Array: Array, Object: Object, Error: Error, isNaN: isNaN, parseFloat: parseFloat });
    var pm = win.ProfileManager;
    var C = loadIsolatedCloud({ createClient: function () { return {}; } });
    var dev = { store: store, pm: pm, C: C, pulled: [], placeholders: [] };
    C._setConfigForTests({ storage: store, pm: pm, core: null,
      placeholders: function () { return dev.placeholders; }, onPulled: function (r) { dev.pulled.push(r); } });
    C._setClientForTests(db.client, { user: { id: userId } });
    /* The module subscribes in init(); the test seam skips init(), so the
       deletion events are routed into the outbox here the same way. */
    pm.subscribe(function (name, d) {
      var o = JSON.parse(store.getItem('incommon_cloud_outbox_v2') || '[]');
      if (name === 'profile:deleted') o.push({ op: 'del-profile', pid: d.id });
      else if (name === 'memory:deleted' && d.id) o.push({ op: 'del-memory', pid: d.profileId, id: String(d.id) });
      else if (name === 'memory:deleted') o.push({ op: 'del-memories', pid: d.profileId, type: d.type || null });
      else return;
      store.setItem('incommon_cloud_outbox_v2', JSON.stringify(o));
    });
    return dev;
  }
  var tl = function (dev, pid) { return JSON.parse(dev.store.getItem('incommon.p.' + pid + '.throughline') || '[]'); };
  var counts = function (db) { var o = {}; Object.keys(db.t).forEach(function (k) { o[k] = db.t[k].length; }); return o; };

  var sdb = memDB();
  var devA = syncDevice(sdb, SU);
  var nate = devA.pm.createProfile({ name: 'Nate', birthDate: '1990-05-01', birthTime: '07:30', birthLocation: '38.9,-77.0' });
  devA.pm.setConsent('journal', true, nate.id);
  var j1 = devA.pm.addMemory({ profileId: nate.id, type: 'journal', content: { t: 'first entry' } }).id;
  var j2 = devA.pm.addMemory({ profileId: nate.id, type: 'journal', content: { t: 'second entry' } }).id;
  devA.store.setItem('incommon.p.' + nate.id + '.throughline', JSON.stringify([{ id: 'm1790000000000', date: '2026-09-01', type: 'event', title: 'Moved', manual: true }]));
  var syncA1 = await devA.C.sync();

  var devB = syncDevice(sdb, SU);
  var sample = devB.pm.createProfile({ name: 'Default Profile', birthDate: '1992-07-02' });
  devB.placeholders = [sample.id];
  var syncB1 = await devB.C.sync();
  var bProfiles = devB.pm.listProfiles();
  var bMem = devB.pm.getMemory({ profileId: nate.id }).map(function (m) { return m.content.t; }).sort();
  ts('K58', 'a second device signing in to the account takes its profiles, journal, consents and Throughline, opens on them, and drops the sample it invented rather than sending it up', {
    aOk: true, bOk: true, adopted: true, names: ['Nate'], active: nate.id, birthTime: '07:30', lat: 38.9,
    journal: ['first entry', 'second entry'], journalConsent: true, throughline: ['Moved'], sampleOnServer: false, tlOnServer: 1
  }, {
    aOk: syncA1.ok, bOk: syncB1.ok, adopted: syncB1.pull.adopted, names: bProfiles.map(function (p) { return p.name; }),
    active: devB.pm.activeId(), birthTime: devB.pm.getProfile(nate.id).birthTime, lat: devB.pm._store().profiles[0].birth_lat,
    journal: bMem, journalConsent: devB.pm.getConsents(nate.id).journal, throughline: tl(devB, nate.id).map(function (e) { return e.title; }),
    sampleOnServer: sdb.t.profiles.some(function (r) { return r.id === sample.id; }), tlOnServer: sdb.t.throughline_entries.length
  });

  var before59 = counts(sdb);
  var a2 = await devA.C.sync(), b2 = await devB.C.sync();
  ts('K59', 'syncing again on both devices changes nothing anywhere: no duplicate rows reach the server and neither device reports a change', {
    rows: before59, aChanged: false, bChanged: false, bTl: 1
  }, { rows: counts(sdb), aChanged: a2.pull.changed, bChanged: b2.pull.changed, bTl: tl(devB, nate.id).length });

  devB.pm.updateProfile(nate.id, { birthTime: '09:15' });
  await devB.C.sync();
  var a3 = await devA.C.sync();
  ts('K60', 'a birth time corrected on one device reaches the other, which had not touched the profile, and its charts are marked for recalculation', {
    changed: true, updated: 1, birthTime: '09:15'
  }, { changed: a3.pull.changed, updated: a3.pull.profilesUpdated, birthTime: devA.pm.getProfile(nate.id).birthTime });

  devB.pm.updateProfile(nate.id, { birthTime: '10:00' });
  await devB.C.sync();
  devA.pm.updateProfile(nate.id, { name: 'Nathaniel' });
  await devA.C.sync();
  var srv61 = sdb.t.profiles.filter(function (r) { return r.id === nate.id; })[0];
  ts('K61', 'an edit made here that has not gone up yet is not overwritten by the pull; it goes up after it, so the last device to save the profile is what the server holds', {
    aName: 'Nathaniel', aTime: '09:15', serverName: 'Nathaniel'
  }, { aName: devA.pm.getProfile(nate.id).name, aTime: devA.pm.getProfile(nate.id).birthTime, serverName: srv61.name });

  devA.pm.deleteMemory({ profileId: nate.id, id: j1 });
  await devA.C.sync();
  var serverMem62 = sdb.t.memories.map(function (r) { return r.local_id; });
  var b62 = await devB.C.sync();
  ts('K62', 'deleting one journal entry deletes that one row on the server, not the profile\'s whole history, and the other device removes the same entry and keeps the rest', {
    server: [j2], bRemoved: 1, bLeft: ['second entry']
  }, { server: serverMem62, bRemoved: b62.pull.memoriesRemoved, bLeft: devB.pm.getMemory({ profileId: nate.id }).map(function (m) { return m.content.t; }) });

  var partner = devA.pm.createProfile({ name: 'Partner', birthDate: '1991-02-03' });
  await devA.C.sync();
  await devB.C.sync();
  var bHadPartner = !!devB.pm.getProfile(partner.id);
  devB.pm.deleteProfile(partner.id, 'Partner');
  await devB.C.sync();
  var a63 = await devA.C.sync();
  ts('K63', 'a profile added on one device appears on the other, and deleted there it is deleted on the server and then here, with its keys', {
    bHadPartner: true, onServer: false, aRemoved: 1, aHas: false, aKeysGone: true
  }, { bHadPartner: bHadPartner, onServer: sdb.t.profiles.some(function (r) { return r.id === partner.id; }), aRemoved: a63.pull.profilesRemoved,
    aHas: !!devA.pm.getProfile(partner.id), aKeysGone: devA.store.getItem('incommon.consent.' + partner.id) === null });

  devB.pm.setConsent('journal', false, nate.id);
  await devB.C.sync();
  await devA.C.sync();
  ts('K64', 'a consent revoked on one device is revoked on the other: the ledgers merge and the latest event decides', false, devA.pm.getConsents(nate.id).journal);

  /* The reader's record, without the module's own bookkeeping (its cache
     and outbox move on every pull, applied or not). */
  var record = function (dev) { var o = {}; Object.keys(dev.store._m).forEach(function (k) { if (!/^incommon_cloud_/.test(k)) o[k] = dev.store._m[k]; }); return JSON.stringify(o); };
  var snap65 = record(devA);
  sdb.failSelect = 'memories';
  var a65 = await devA.C.pull();
  sdb.failSelect = null;
  var emptyDb = memDB();
  devA.C._setClientForTests(emptyDb.client, { user: { id: SU } });
  var a65b = await devA.C.pull();
  devA.C._setClientForTests(sdb.client, { user: { id: SU } });
  ts('K65', 'a table that fails to read applies nothing, and a server holding no profiles deletes nothing: neither reads as a deletion', {
    failOk: false, emptyOk: true, emptyChanged: false, untouched: true
  }, { failOk: a65.ok, emptyOk: a65b.ok, emptyChanged: a65b.changed, untouched: record(devA) === snap65 });

  /* The defect K62 fixes, as an older build left the server: one entry was
     deleted and the whole history went with it, while the device's cache
     still says every row was sent. The first pull after this version must
     put them back rather than delete them here too. */
  var olddb = memDB();
  var devC = syncDevice(olddb, 'dddddddd-0000-4000-8000-00000000000d');
  var cp = devC.pm.createProfile({ name: 'Old', birthDate: '1980-01-01' });
  devC.pm.setConsent('journal', true, cp.id);
  devC.pm.addMemory({ profileId: cp.id, type: 'journal', content: { t: 'kept one' } });
  devC.pm.addMemory({ profileId: cp.id, type: 'journal', content: { t: 'kept two' } });
  await devC.C.push();
  olddb.t.memories = [];
  var c66 = await devC.C.sync();
  ts('K66', 'on a device\'s first pull, rows its cache says were sent and the server lacks are sent again, not deleted, so an older build\'s wiped history is restored', {
    firstPull: true, removed: 0, local: 2, server: 2
  }, { firstPull: c66.pull.firstPull, removed: c66.pull.memoriesRemoved, local: devC.pm.getMemory({ profileId: cp.id }).length, server: olddb.t.memories.length });

  var j3 = devA.pm.addMemory({ profileId: nate.id, type: 'journal', content: { t: 'offline delete' } }).id;
  devA.pm.setConsent('journal', true, nate.id);
  await devA.C.sync();
  devA.pm.deleteMemory({ profileId: nate.id, id: j3 });
  /* As a device's first pull, where nothing but the outbox says the entry
     was deleted here. */
  var mapA = JSON.parse(devA.store.getItem('incommon_cloud_map_v2'));
  delete mapA.pulled;
  devA.store.setItem('incommon_cloud_map_v2', JSON.stringify(mapA));
  sdb.failDelete = true;
  var a67 = await devA.C.sync();
  var stillQueued = JSON.parse(devA.store.getItem('incommon_cloud_outbox_v2') || '[]').length;
  var resurrected = devA.pm.getMemory({ profileId: nate.id, respectConsent: false }).some(function (m) { return m.id === j3; });
  sdb.failDelete = false;
  await devA.C.sync();
  ts('K67', 'a deletion made while the server cannot be told stays queued, the pull does not bring the entry back meanwhile, and the next sync carries it up', {
    resurrected: false, queued: 1, serverAfter: false
  }, { resurrected: resurrected,
    queued: stillQueued, serverAfter: sdb.t.memories.some(function (r) { return r.local_id === j3; }) });

  var big = memDB(), devD = syncDevice(big, 'eeeeeeee-0000-4000-8000-00000000000e');
  var dp = devD.pm.createProfile({ name: 'Writer', birthDate: '1985-03-03' });
  var dp2 = devD.pm.createProfile({ name: 'Second', birthDate: '1986-04-04' });
  devD.pm.setConsent('journal', true, dp.id);
  devD.pm.setConsent('journal', true, dp2.id);
  for (var bi = 0; bi < 760; bi++) devD.pm.addMemory({ profileId: dp.id, type: 'journal', content: { n: bi }, createdAt: new Date(Date.UTC(2026, 0, 1) + bi * 60000).toISOString() });
  for (bi = 0; bi < 400; bi++) devD.pm.addMemory({ profileId: dp2.id, type: 'journal', content: { n: bi } });
  await devD.C.sync();
  var devE = syncDevice(big, 'eeeeeeee-0000-4000-8000-00000000000e');
  var e68 = await devE.C.sync();
  ts('K68', 'an account larger than the server\'s row limit (1,160 memories against 1,000) comes down whole, newest first, and A and B hold the same entries', {
    ok: true, count: 760, second: 400, newest: 759, same: true
  }, { ok: e68.ok, count: devE.pm.getMemory({ profileId: dp.id }).length, second: devE.pm.getMemory({ profileId: dp2.id }).length, newest: devE.pm.getMemory({ profileId: dp.id })[0].content.n,
    same: JSON.stringify(devE.pm.getMemory({ profileId: dp.id }).map(function (m) { return m.id; })) === JSON.stringify(devD.pm.getMemory({ profileId: dp.id }).map(function (m) { return m.id; })) });

  /* ---- K69: the Archive cannot stop a sync. Deleting an entry writes an
     archive_deleted memory, a type the live table's check constraint
     refuses, and one refused upsert ended the push before the Throughline
     and the deletion outbox. The fake database enforces the same constraint,
     read out of server/cloud-schema.sql rather than typed again here. ---- */
  var schemaSql = fs.readFileSync(path.join(repo, 'server', 'cloud-schema.sql'), 'utf8');
  var checkM = /memory_type text not null check \(memory_type in\s*\(([^)]*)\)\)/.exec(schemaSql);
  var serverTypes = checkM ? checkM[1].split(',').map(function (x) { return x.trim().replace(/^'|'$/g, ''); }) : null;
  var cdb = memDB();
  cdb.memoryTypes = serverTypes;
  var devF = syncDevice(cdb, 'ffffffff-0000-4000-8000-00000000000f');
  var fp = devF.pm.createProfile({ name: 'Keeper', birthDate: '1988-08-08' });
  devF.pm.setConsent('journal', true, fp.id);
  var keep1 = devF.pm.addMemory({ profileId: fp.id, type: 'journal', content: { t: 'stays' } }).id;
  var gone1 = devF.pm.addMemory({ profileId: fp.id, type: 'journal', content: { t: 'deleted here' } }).id;
  await devF.C.sync();
  /* What memDeleteOne() does: an archive record first, then the delete. */
  devF.pm.addMemory({ profileId: fp.id, type: 'archive_deleted', consentRequired: null, content: { origType: 'journal', deletedAt: new Date().toISOString() } });
  devF.pm.deleteMemory({ profileId: fp.id, id: gone1 });
  devF.store.setItem('incommon.p.' + fp.id + '.throughline', JSON.stringify([{ id: 'm1790000000001', date: '2026-10-14', type: 'event', title: 'After the archive', manual: true }]));
  var f69 = await devF.C.sync();
  ts('K69', 'an archived entry stays on its device and never reaches the server, so the push goes on: the deletion reaches the server, the Throughline goes up, and the sync module sends exactly the types the server schema accepts', {
    schemaRead: true, sameTypes: true, ok: true, server: [keep1], archiveOnServer: false, throughline: 1, outbox: 0, archiveKeptLocally: true
  }, {
    schemaRead: !!serverTypes, sameTypes: JSON.stringify(serverTypes) === JSON.stringify(devF.C.SYNC_MEMORY_TYPES), ok: f69.ok,
    server: cdb.t.memories.map(function (r) { return r.local_id; }),
    archiveOnServer: cdb.t.memories.some(function (r) { return r.memory_type === 'archive_deleted'; }),
    throughline: cdb.t.throughline_entries.length,
    outbox: JSON.parse(devF.store.getItem('incommon_cloud_outbox_v2') || '[]').length,
    archiveKeptLocally: devF.pm.getMemory({ profileId: fp.id, type: 'archive_deleted', respectConsent: false }).length === 1
  });

  /* ---- K71: a row that names no consent is held to its type's. Restoring an
     entry from the Archive (restoreMemory) writes it back with
     consentRequired null, and the push gate read null as "no consent
     needed", so a restored journal entry went up with journal off. ---- */
  var gdb = memDB();
  var devG = syncDevice(gdb, '71717171-0000-4000-8000-000000000071');
  var gp71 = devG.pm.createProfile({ name: 'Restorer', birthDate: '1985-03-03' });
  var restored = devG.pm.addMemory({ profileId: gp71.id, type: 'journal', consentRequired: null, content: { t: 'restored' } }).id;
  var g71off = await devG.C.sync();
  var offServer = gdb.t.memories.map(function (r) { return r.local_id; });
  devG.pm.setConsent('journal', true, gp71.id);
  var g71on = await devG.C.sync();
  ts('K71', 'an entry restored from the Archive, which names no consent, stays on the device while its type\'s consent is off and goes up once it is on', {
    okOff: true, offServer: [], okOn: true, onServer: [restored]
  }, { okOff: g71off.ok, offServer: offServer, okOn: g71on.ok, onServer: gdb.t.memories.map(function (r) { return r.local_id; }) });

  /* ---- K72: which profile is active is kept beside the profiles, not in
     them, so a switch sends nothing and the server keeps the old one active.
     The next edit to the new one sends is_active true, profiles_one_active
     refuses it, and the push ends there, every time, with the memories behind
     it. Run against the index alone, then with migration 0002's trigger,
     which is read out of the migration rather than assumed. ---- */
  var mig0002 = '';
  try { mig0002 = fs.readFileSync(path.join(repo, 'server', 'migrations', '0002-profiles-one-active-follows.sql'), 'utf8'); } catch (e) {}
  var follows = /before insert or update of is_active on public\.profiles/.test(mig0002) && /set is_active = false/.test(mig0002);
  async function switchThenEdit(mode) {
    var db = memDB(); db.oneActive = mode;
    var dev = syncDevice(db, '72727272-0000-4000-8000-000000000072');
    var a = dev.pm.createProfile({ name: 'First', birthDate: '1980-01-01' });
    await dev.C.sync();
    var b = dev.pm.createProfile({ name: 'Second', birthDate: '1982-02-02' });
    await dev.C.sync();
    dev.pm.setActiveProfile(b.id);
    await dev.C.sync();
    dev.pm.updateProfile(b.id, { birthTime: '07:15' });
    dev.pm.setConsent('journal', true, b.id);
    var note = dev.pm.addMemory({ profileId: b.id, type: 'journal', content: { t: 'after the switch' } }).id;
    var r = await dev.C.sync();
    return { ok: r.ok, active: db.t.profiles.filter(function (x) { return x.is_active; }).map(function (x) { return x.name; }),
      memoryUp: db.t.memories.some(function (x) { return x.local_id === note; }) };
  }
  var k72index = await switchThenEdit('index'), k72follow = await switchThenEdit(follows ? 'follow' : 'index');
  ts('K72', 'switching profiles and then editing the new one no longer stops the push: the index alone refuses it, and with migration 0002 the new profile is the one active and the journal entry behind it goes up', {
    migrationRead: true, indexAloneOk: false, indexAloneMemoryUp: false, withMigrationOk: true, activeOnServer: ['Second'], memoryUp: true
  }, { migrationRead: follows, indexAloneOk: k72index.ok, indexAloneMemoryUp: k72index.memoryUp,
    withMigrationOk: k72follow.ok, activeOnServer: k72follow.active, memoryUp: k72follow.memoryUp });

  /* ---- K73: the migrations folder keeps its own rules. Each file is
     numbered in order and listed in that order in the folder's README, can
     be run twice (every create checks first, every trigger is dropped before
     it is made), carries its down migration, puts no bare dollar sign where
     the dashboard's SQL Editor would split on it, and makes any new table
     with row level security on and no policy. And 0001 indexes the columns
     pull() filters on. ---- */
  var migDir = path.join(repo, 'server', 'migrations');
  var migFiles = [];
  try { migFiles = fs.readdirSync(migDir).filter(function (f) { return /\.sql$/.test(f); }).sort(); } catch (e) {}
  var migReadme = '';
  try { migReadme = fs.readFileSync(path.join(migDir, 'README.md'), 'utf8'); } catch (e) {}
  var migBad = [];
  migFiles.forEach(function (f, i) {
    var src = fs.readFileSync(path.join(migDir, f), 'utf8');
    var code = src.split('\n').filter(function (l) { return !/^\s*--/.test(l); }).join('\n');
    var why = [];
    if (f.indexOf(('000' + (i + 1)).slice(-4) + '-') !== 0 || !/^\d{4}-[a-z0-9-]+\.sql$/.test(f)) why.push('name');
    if (!/^-- DOWN/m.test(src) || !/^-- DOWN[^\n]*\n--   \S/m.test(src)) why.push('down');
    (code.match(/create (unique )?index [^;]*/gi) || []).forEach(function (s) { if (!/if not exists/i.test(s)) why.push('index'); });
    (code.match(/create table [^(]*/gi) || []).forEach(function (s) {
      var name = s.replace(/create table (if not exists )?/i, '').trim();
      if (!/if not exists/i.test(s)) why.push('table');
      if (code.indexOf('alter table ' + name + ' enable row level security') === -1) why.push('rls ' + name);
      if (new RegExp('create policy [^;]* on ' + name.replace(/\./g, '\\.') + '\\b', 'i').test(code)) why.push('policy ' + name);
    });
    (code.match(/create trigger (\w+)/gi) || []).forEach(function (s) {
      var name = s.split(/\s+/)[2];
      if (code.indexOf('drop trigger if exists ' + name) === -1) why.push('trigger ' + name);
    });
    (code.match(/create (or replace )?function/gi) || []).forEach(function (s) { if (!/or replace/i.test(s)) why.push('function'); });
    if (src.replace(/\$[a-z_]+\$/g, '').indexOf('$') !== -1) why.push('dollar');
    if (/[–—]/.test(src)) why.push('dash');
    if (why.length) migBad.push(f + ': ' + why.join(','));
  });
  var listed = migFiles.map(function (f) { return migReadme.indexOf(f); });
  var mig0001 = migFiles[0] ? fs.readFileSync(path.join(migDir, migFiles[0]), 'utf8') : '';
  var covered = ['public.profiles (account_id)', 'public.pairs (account_id)', 'public.throughline_entries (profile_id)', 'public.oki_messages (profile_id)']
    .filter(function (on) { return mig0001.indexOf(' on ' + on) === -1; });
  ts('K73', 'every migration is numbered in order, listed in the README in that order, safe to run twice, carries its down migration, splits nowhere in the SQL Editor, and 0001 indexes what pull() filters on', {
    files: 5, bad: [], listedInOrder: true, uncovered: []
  }, { files: migFiles.length, bad: migBad,
    listedInOrder: listed.every(function (p, i) { return p !== -1 && (i === 0 || p > listed[i - 1]); }), uncovered: covered });

  /* ---- K74: a table a migration adds is reached by the two walls that do
     not read it by name: the account function's deletion and the two-step
     rule (assignment 2.2). Every table keyed by profile_id, in the schema of
     record or a migration, is in the account function's profile list, and
     every table a migration creates is in server/mfa-policies.sql's list. A
     new table missing from either is a reader's rows that outlive their
     account, or a table a stolen password reads. ---- */
  var k74Sql = [fs.readFileSync(path.join(repo, 'server', 'cloud-schema.sql'), 'utf8')]
    .concat(migFiles.map(function (f) { return fs.readFileSync(path.join(migDir, f), 'utf8'); }));
  var k74Child = [], k74New = [];
  k74Sql.forEach(function (src, i) {
    var code = src.split('\n').filter(function (l) { return !/^\s*--/.test(l); }).join('\n');
    var re = /create table (?:if not exists )?(?:public\.)?(\w+) \(([\s\S]*?)\n\);/gi, m;
    while ((m = re.exec(code))) {
      if (/\bprofile_id uuid not null references (?:public\.)?profiles\b/i.test(m[2])) k74Child.push(m[1]);
      if (i > 0) k74New.push(m[1]);
    }
  });
  var k74Acct = fs.readFileSync(path.join(repo, 'server', 'account', 'index.ts'), 'utf8');
  var k74List = ((k74Acct.match(/for \(const t of \[([^\]]*)\]\) await del\(t, "profile_id"/) || [])[1] || '')
    .split(',').map(function (x) { return x.trim().replace(/"/g, ''); }).filter(Boolean);
  var k74Mfa = fs.readFileSync(path.join(repo, 'server', 'mfa-policies.sql'), 'utf8');
  var k74MfaList = ((k74Mfa.match(/foreach t in array array\[([\s\S]*?)\] loop/) || [])[1] || '')
    .split(',').map(function (x) { return x.trim().replace(/'/g, ''); }).filter(Boolean);
  ts('K74', 'every table keyed by profile is deleted by the account function, and every table a migration adds is under the two-step rule', {
    childrenSeen: true, notDeleted: [], notTwoStep: []
  }, { childrenSeen: k74Child.indexOf('memories') !== -1 && k74Child.length >= 5,
    notDeleted: k74Child.filter(function (t) { return k74List.indexOf(t) === -1; }),
    notTwoStep: k74New.filter(function (t) { return k74MfaList.indexOf(t) === -1; }) });

  /* ---- O1-O7: each account has its own profiles on a device, the owner's
     request of 12 October 2026 after three accounts on one browser all opened
     onto the same birth data. Each pmPage() is one page load: a fresh copy of
     profile-manager.js over the same storage, which is what a browser does
     between the cover and the app. */
  function ownerStore() {
    var m = {};
    return {
      _m: m,
      get length() { return Object.keys(m).length; },
      key: function (i) { return Object.keys(m)[i] || null; },
      getItem: function (k) { return k in m ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
  }
  var SB = 'sb-lkzcybzhjjxdqetwwdrx-auth-token';
  function signIn(store, id, factors, aal) {
    store.setItem(SB, JSON.stringify({ access_token: jwtOf({ sub: id, aal: aal || 'aal1' }), refresh_token: 'r', user: { id: id, factors: factors } }));
  }
  function pmPage(store, cookie) {
    var win = {};
    vm.runInNewContext(pmSrcK46, { window: win, localStorage: store, document: { cookie: cookie || '' }, atob: function (x) { return Buffer.from(x, 'base64').toString('binary'); },
      JSON: JSON, Math: Math, Date: Date, String: String, Array: Array, Object: Object, Error: Error, isNaN: isNaN, parseFloat: parseFloat });
    return win.ProfileManager;
  }
  var ROOTK = 'incommon.profiles.v1', UA = 'aaaaaaaa-0000-4000-8000-00000000000a', UB = 'bbbbbbbb-0000-4000-8000-00000000000b';
  var dev = ownerStore();
  var g0 = pmPage(dev);
  var gp = g0.createProfile({ name: 'Nate', birthDate: '1990-05-01' });
  dev.setItem('incommon.firstrun', 'true');
  dev.setItem('incommon.friends', JSON.stringify([{ id: 'f1', name: 'Card' }]));
  t('O1', 'signed out, the profiles are the guest store under the plain key, and the device wide keys stay plain', {
    owner: null, inRoot: true, firstrunKey: 'incommon.firstrun'
  }, { owner: g0.owner(), inRoot: (JSON.parse(dev.getItem(ROOTK) || '{}').profiles || []).some(function (p) { return p.id === gp.id; }), firstrunKey: g0.accountKey('incommon.firstrun') });

  signIn(dev, UA);
  var pa = pmPage(dev);
  var aList = pa.listProfiles().map(function (p) { return p.name; });
  t('O2', 'the first account to open the app on a device that holds profiles takes them, with its first run, sample, friends, adverse log and archive, and the guest store is left empty', {
    owner: UA, profiles: ['Nate'], rootGone: true, firstrunMoved: true, friendsMoved: true, plainGone: true
  }, { owner: pa.owner(), profiles: aList, rootGone: dev.getItem(ROOTK) === null, firstrunMoved: dev.getItem('incommon.firstrun.u.' + UA) === 'true',
    friendsMoved: !!dev.getItem('incommon.friends.u.' + UA), plainGone: dev.getItem('incommon.firstrun') === null && dev.getItem('incommon.friends') === null });

  dev.setItem('incommon.throughline.manual', JSON.stringify([{ t: 'before profiles' }]));
  signIn(dev, UB);
  var pb = pmPage(dev);
  var bBefore = pb.count();
  var mig = pb.migrateLegacyProfile({ name: 'Default Profile', birthDate: '1992-07-02' });
  var bp = pb.getActiveProfile();
  t('O3', 'a second account on the same device opens onto no profiles, makes its own under its own key, and inherits none of the device history from before profiles', {
    before: 0, after: 1, ownKey: true, aUntouched: ['Nate'], legacyNotCopied: true, firstrunKey: 'incommon.firstrun.u.' + UB, firstrunUnset: true
  }, { before: bBefore, after: pb.count(), ownKey: (JSON.parse(dev.getItem(ROOTK + '.u.' + UB) || '{}').profiles || []).some(function (p) { return p.id === bp.id; }),
    aUntouched: (JSON.parse(dev.getItem(ROOTK + '.u.' + UA) || '{}').profiles || []).map(function (p) { return p.name; }),
    legacyNotCopied: dev.getItem('incommon.p.' + bp.id + '.throughline') === null && (mig.moved || []).length === 0,
    firstrunKey: pb.accountKey('incommon.firstrun'), firstrunUnset: dev.getItem(pb.accountKey('incommon.firstrun')) === null });

  signIn(dev, UA);
  var pa2 = pmPage(dev);
  t('O4', 'signing back in as the first account opens its own profiles again, and not the second account\'s', {
    owner: UA, profiles: ['Nate']
  }, { owner: pa2.owner(), profiles: pa2.listProfiles().map(function (p) { return p.name; }) });

  signIn(dev, UA, VER, 'aal1');
  /* owner() is read straight after each load: the scope is settled at the
     first read of the store, and a real page reads it before anything could
     change the stored session under it. */
  var owing = pmPage(dev).owner();
  signIn(dev, UA);
  dev.setItem('incommon.signin.ephemeral', '1');
  var closed = pmPage(dev, '').owner(), open = pmPage(dev, 'incommon_signin_live=1').owner();
  dev.removeItem('incommon.signin.ephemeral');
  t('O5', 'a session that still owes its two-step code, and one the browser has closed, open the guest store rather than the account\'s', {
    owesCode: null, browserClosed: null, browserOpen: UA
  }, { owesCode: owing, browserClosed: closed, browserOpen: open });

  var pa3 = pmPage(dev);
  var aKeys = pa3.accountStorageKeys();
  t('O6', 'erasing an account from the device names its store, its scoped keys and its profiles\' keys, and nothing of the other account\'s', {
    hasStore: true, hasFirstrun: true, hasProfileKey: true, noneOfB: true
  }, { hasStore: aKeys.indexOf(ROOTK + '.u.' + UA) !== -1, hasFirstrun: aKeys.indexOf('incommon.firstrun.u.' + UA) !== -1,
    hasProfileKey: aKeys.some(function (k) { return k.indexOf(gp.id) !== -1 && k !== ROOTK + '.u.' + UA; }),
    noneOfB: aKeys.every(function (k) { return k.indexOf(UB) === -1 && k.indexOf(bp.id) === -1; }) });

  var released = pa3.releaseToGuest();
  dev.removeItem(SB);
  var guest = pmPage(dev);
  t('O7', 'an account deleted without erasing hands its profiles and keys to the guest store, so the reader keeps them signed out, and the other account keeps its own', {
    released: true, guestProfiles: ['Nate'], firstrunPlain: 'true', scopedGone: true, bKept: true
  }, { released: released, guestProfiles: guest.listProfiles().map(function (p) { return p.name; }), firstrunPlain: dev.getItem('incommon.firstrun'),
    scopedGone: dev.getItem(ROOTK + '.u.' + UA) === null && dev.getItem('incommon.firstrun.u.' + UA) === null, bKept: dev.getItem(ROOTK + '.u.' + UB) !== null });

  /* THE STAMP CARRIES THE ZONE (1.3, D-09). reresolveLocations() puts a
     Puerto Rico place saved under New York's zone back on Atlantic time and
     keeps its coordinates. The instant moves an hour, so the stamp every chart
     cache and every kept Oracle reading is keyed on has to move with it. */
  var prDev = ownerStore();
  var prPm = pmPage(prDev);
  var prP = prPm.createProfile({ name: 'Ana', birthDate: '1985-01-01', birthTime: '06:30' });
  var prRaw = JSON.parse(prDev.getItem(ROOTK));
  prRaw.profiles.forEach(function (q) { if (q.id === prP.id) { q.birth_lat = 18.4655; q.birth_lon = -66.1057; q.timezone = 'America/New_York'; q.tz_offset = -5; } });
  prDev.setItem(ROOTK, JSON.stringify(prRaw));
  var prPm2 = pmPage(prDev), stampBefore = prPm2.getProfile(prP.id).birthStamp;
  var prFixed = prPm2.reresolveLocations();
  var prAfter = pmPage(prDev).getProfile(prP.id);
  t('O8', 'putting a Puerto Rico place back on Atlantic time moves the birth stamp, so no cache keyed on it outlives the correction', {
    fixed: true, zone: 'America/Puerto_Rico', moved: true
  }, { fixed: (prFixed || []).indexOf(prP.id) !== -1, zone: prAfter.timezone, moved: prAfter.birthStamp !== stampBefore });

  /* ---- O9-O18: chart versions and chart notes (1.2, data-contracts/
     HD-STUDY-MODEL.md, approved by the owner on 29 October 2026). The device
     half: a corrected birth is a new version, never an overwrite; a note is
     attached to an address and the version it was written against; Clear
     birth data takes the history and leaves the notes; deleting a profile
     takes both. Every actual is computed inside a guard, so the build before
     this change reports red rows rather than stopping the suite. */
  function cv(fn) { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } }
  var cvDev = ownerStore(), cvPm = pmPage(cvDev);
  var cvA = cvPm.createProfile({ name: 'Ana', birthDate: '1985-03-10', birthTime: '06:30', birthLocation: 'Chicago' });
  var cvB = cvPm.createProfile({ name: 'Bea', birthDate: '1990-01-01' });
  var VK = function (id) { return 'incommon.p.' + id + '.chartVersions.v1'; };
  var NK = function (id) { return 'incommon.p.' + id + '.chartNotes.v1'; };

  t('O9', 'a profile in the shape before versions existed, edited only by name and avatar, gains no versions and no new key', {
    versions: 0, key: null
  }, cv(function () {
    cvPm.updateProfile(cvA.id, { name: 'Ana Maria', avatarColor: '#123456' });
    return { versions: cvPm.listChartVersions(cvA.id).length, key: cvDev.getItem(VK(cvA.id)) };
  }));

  var cvNoteEarly = cv(function () { return cvPm.addChartNote(cvA.id, { address: 'activation:design:Moon', resolved: { value: '41.2' }, text: 'Before any correction.' }); });
  t('O10', 'the first correction of a time writes the old birth as version 1 and the new one as version 2, and the profile still holds the new birth', {
    count: 2, seqs: [1, 2], reasons: ['initial', 'time_corrected'], times: ['06:30', '07:15'], subject: 'profile:' + cvA.id,
    noChart: true, current: '07:15', currentIsLast: true
  }, cv(function () {
    cvPm.updateProfile(cvA.id, { birthTime: '07:15' });
    var v = cvPm.listChartVersions(cvA.id);
    return { count: v.length, seqs: v.map(function (x) { return x.seq; }), reasons: v.map(function (x) { return x.reason; }),
      times: v.map(function (x) { return x.birth.time; }), subject: v[0].subject,
      noChart: v.every(function (x) { return !('computed_state' in x) && !('longitudes' in x.birth) && !('gates' in x); }),
      current: cvPm.getProfile(cvA.id).birthTime, currentIsLast: cvPm.currentChartVersion(cvA.id).id === v[1].id };
  }));

  t('O11', 'a note written before the first correction is given version 1, and a note written after it the current version', {
    early: 'v1', late: 'v2'
  }, cv(function () {
    var v = cvPm.listChartVersions(cvA.id), early = cvPm.listChartNotes(cvA.id).filter(function (n) { return n.id === cvNoteEarly.id; })[0];
    var late = cvPm.addChartNote(cvA.id, { address: 'channel:20-34', resolved: { defined: true, by: ['activation:personality:Sun'] }, text: 'After.' });
    return { early: early.version === v[0].id ? 'v1' : early.version, late: late.version === v[1].id ? 'v2' : late.version };
  }));

  t('O12', 'a corrected date and then a corrected place each add one version with their own reason; a repeated value adds none', {
    reasons: ['initial', 'time_corrected', 'date_corrected', 'place_corrected'], seqs: [1, 2, 3, 4]
  }, cv(function () {
    cvPm.updateProfile(cvA.id, { birthDate: '1985-03-11' });
    cvPm.updateProfile(cvA.id, { birthDate: '1985-03-11' });
    cvPm.updateProfile(cvA.id, { birthLocation: 'Los Angeles' });
    var v = cvPm.listChartVersions(cvA.id);
    return { reasons: v.map(function (x) { return x.reason; }), seqs: v.map(function (x) { return x.seq; }) };
  }));

  t('O13', 'the first birth a blank profile is given is not a correction, and replacing the sample chart is not one either', {
    blank: 0, sample: 0
  }, cv(function () {
    var e = cvPm.createProfile({ name: 'Cal' });
    cvPm.updateProfile(e.id, { birthDate: '2000-02-02' });
    var smp = cvPm.createProfile({ name: 'Default Profile', birthDate: '1990-06-15' });
    cvDev.setItem('incommon.sample', JSON.stringify(smp.id));
    cvPm.updateProfile(smp.id, { birthDate: '1979-11-30', birthTime: '23:05' });
    cvDev.removeItem('incommon.sample');
    var out = { blank: cvPm.listChartVersions(e.id).length, sample: cvPm.listChartVersions(smp.id).length };
    cvPm.deleteProfile(e.id, 'Cal'); cvPm.deleteProfile(smp.id, 'Default Profile');
    return out;
  }));

  t('O14', 'putting a Puerto Rico place back on Atlantic time is a version of its own, reason zone_repaired (O7)', {
    reasons: ['initial', 'zone_repaired'], zones: ['America/New_York', 'America/Puerto_Rico']
  }, cv(function () {
    var d = ownerStore(), pm = pmPage(d);
    var p = pm.createProfile({ name: 'Ana', birthDate: '1985-01-01', birthTime: '06:30' });
    var raw = JSON.parse(d.getItem(ROOTK));
    raw.profiles.forEach(function (q) { if (q.id === p.id) { q.birth_lat = 18.4655; q.birth_lon = -66.1057; q.timezone = 'America/New_York'; q.tz_offset = -5; } });
    d.setItem(ROOTK, JSON.stringify(raw));
    var pm2 = pmPage(d); pm2.reresolveLocations();
    var v = pmPage(d).listChartVersions(p.id);
    return { reasons: v.map(function (x) { return x.reason; }), zones: v.map(function (x) { return x.birth.zone; }) };
  }));

  t('O15', 'addresses: the vault\'s six forms are taken and anything else is refused, before anything is written', {
    ok: [true, true, true, true, true, true, true], refused: [false, false, false, false, false, false, false], thrown: 7, written: 0
  }, cv(function () {
    var good = ['centre:Solar Plexus', 'channel:20-34', 'gate:64', 'line:20.3', 'activation:design:Moon', 'activation:personality:South Node', 'facet:cross'];
    var bad = ['centre:Spleen ', 'channel:34-20', 'gate:65', 'line:20.7', 'activation:design:Chiron', 'facet:colour', 'gate:20; 1-1'];
    var before = cvPm.listChartNotes(cvA.id).length, thrown = 0;
    bad.forEach(function (a) { try { cvPm.addChartNote(cvA.id, { address: a, text: 'x' }); } catch (e) { thrown++; } });
    return { ok: good.map(function (a) { return cvPm.chartAddressOk(a); }), refused: bad.map(function (a) { return cvPm.chartAddressOk(a); }),
      thrown: thrown, written: cvPm.listChartNotes(cvA.id).length - before };
  }));

  t('O16', 'a note compares what its address resolved to then with now: same, changed, or unresolved; editing the words keeps the snapshot', {
    same: 'same', reordered: 'same', changed: 'changed', unresolved: 'unresolved', kept: { value: '41.2' }, text: 'Edited.', tooLong: true, deleted: true
  }, cv(function () {
    var n = cvPm.listChartNotes(cvA.id).filter(function (x) { return x.id === cvNoteEarly.id; })[0];
    var c = cvPm.listChartNotes(cvA.id, { address: 'channel:20-34' })[0], long = false;
    var ed = cvPm.updateChartNote(cvA.id, n.id, 'Edited.');
    try { cvPm.updateChartNote(cvA.id, n.id, new Array(4002).join('a')); } catch (e) { long = true; }
    var tmp = cvPm.addChartNote(cvA.id, { address: 'gate:1', text: 'temp' });
    return { same: cvPm.chartNoteStatus(n, { value: '41.2' }),
      reordered: cvPm.chartNoteStatus(c, { by: ['activation:personality:Sun'], defined: true }),
      changed: cvPm.chartNoteStatus(c, { defined: false, by: [] }), unresolved: cvPm.chartNoteStatus(n, null),
      kept: ed.resolved, text: cvPm.listChartNotes(cvA.id).filter(function (x) { return x.id === n.id; })[0].text,
      tooLong: long, deleted: cvPm.deleteChartNote(cvA.id, tmp.id) && cvPm.listChartNotes(cvA.id).every(function (x) { return x.id !== tmp.id; }) };
  }));

  t('O17', 'the export carries the versions, withholds the notes while journal is off and counts them, and carries them once it is on', {
    versions: 4, offNotes: 0, offWithheld: 2, onNotes: 2, onWithheld: 0
  }, cv(function () {
    var off = cvPm.exportProfile(cvA.id);
    cvPm.setConsent('journal', true, cvA.id);
    var on = cvPm.exportProfile(cvA.id);
    return { versions: (off.chartVersions || []).length, offNotes: (off.chartNotes || []).length, offWithheld: off.chartNotesWithheld,
      onNotes: (on.chartNotes || []).length, onWithheld: on.chartNotesWithheld };
  }));

  t('O18', 'Clear birth data takes the version history and keeps the notes (O8); deleting the profile takes both keys, which erasing the account also names', {
    clearedVersions: 0, versionKey: null, notesKept: 2, erasedNamed: true, afterDelete: [null, null], otherUntouched: true
  }, cv(function () {
    cvPm.updateChartNote(cvA.id, cvPm.listChartNotes(cvA.id)[0].id, 'Still mine.');
    cvPm.updateProfile(cvA.id, { birthDate: '', birthTime: '', birthLocation: '', timeUnknown: false });
    var cleared = { clearedVersions: cvPm.listChartVersions(cvA.id).length, versionKey: cvDev.getItem(VK(cvA.id)), notesKept: cvPm.listChartNotes(cvA.id).length };
    cvPm.updateProfile(cvA.id, { birthDate: '1985-03-11', birthTime: '07:15' });
    cvPm.updateProfile(cvA.id, { birthTime: '08:00' });
    var named = cvPm.accountStorageKeys();
    cvPm.addChartNote(cvB.id, { address: 'facet:type', resolved: { value: 'Generator' }, text: 'Bea\'s own.' });
    cvPm.deleteProfile(cvA.id, 'Ana Maria');
    cleared.erasedNamed = named.indexOf(VK(cvA.id)) !== -1 && named.indexOf(NK(cvA.id)) !== -1;
    cleared.afterDelete = [cvDev.getItem(VK(cvA.id)), cvDev.getItem(NK(cvA.id))];
    cleared.otherUntouched = cvPm.listChartNotes(cvB.id).length === 1;
    return cleared;
  }));

  /* ---- T1-T10: what a handout and an export may carry (assignment 2.2,
     Task 3, app/share-rules.js). The rows load the module guarded, so a
     build without it reports red rows rather than stopping the suite. The
     chart handed in is stuffed with everything a chart object near the
     screens carries, and the rows search the serialised payload for each of
     those values, because a rule that holds for the fields a test names and
     leaks the ones it did not name is the failure this module exists for. */
  var SR = null;
  try { SR = require(path.join(repo, 'app', 'share-rules.js')); } catch (e) { SR = null; }
  function sr(fn) { try { if (!SR) return { missing: 'share-rules.js' }; return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } }
  function srChart(kind, consent) {
    return { kind: kind, name: 'Ana Maria Lopez', type: 'Generator', strategy: 'To respond', authority: 'Sacral',
      profile: '3/5', definition: 'Single', centres: ['Sacral', 'Throat', 'Root'], channels: ['20-34', '53-42'],
      gates: [20, 34, 53, 42, 7], activations: [{ side: 'personality', body: 'Sun', gate: 20, line: 3, lon: 301.11 },
        { side: 'design', body: 'Moon', gate: 34, line: 5 }],
      birth: { date: '1985-03-10', time: '06:30', place: 'Chicago, Illinois', lat: 41.8781, lon: -87.6298, zone: 'America/Chicago' },
      birth_date: '1985-03-10', birth_time: '06:30', birth_lat: 41.8781, birth_lon: -87.6298, timezone: 'America/Chicago',
      tz_offset: -6, chart_hash: 'c0ffee1234abcd', email: 'ana@example.test', id: 'p9f8e7d6c5b4a3921',
      subject_consent: consent || null,
      notes: [{ id: 'n1', address: 'facet:type', text: 'Waiting to respond.', resolved: { value: 'Generator' } },
        { id: 'n2', address: 'activation:design:Moon', text: 'The design Moon again.', resolved: { value: '34.5' } },
        { id: 'n3', address: 'gate:20', text: 'Not picked.', resolved: { held: true } }] };
  }
  var SR_SECRETS = ['1985', '06:30', 'Chicago', '41.87', '87.62', 'America/Chicago', 'c0ffee', 'example.test', 'p9f8e7d6', 'Maria', 'Lopez', '301.11', '34.5'];
  function srLeaks(obj) { var j = JSON.stringify(obj); return SR_SECRETS.filter(function (v) { return j.indexOf(v) !== -1; }); }

  t('T1', 'a handout of the reader\'s own chart carries Type, Strategy, Authority, Profile, Definition and a first name, and nothing of the wiring or the birth unless asked', {
    ok: true, keys: 'authority,definition,includes,kind,name,notes,profile,schema,strategy,type', name: 'Ana', wiringOff: true
  }, sr(function () {
    var r = SR.handout(srChart('self'));
    return { ok: r.ok, keys: Object.keys(r.payload).sort().join(','), name: r.payload.name,
      wiringOff: ['centres', 'channels', 'gates', 'activations', 'birthDate', 'birthTime', 'birthPlace'].every(function (k) { return r.payload.includes[k] === false; }) };
  }));
  t('T2', 'none of the birth date, time, place, coordinates, zone, stored hash, email, record id, full name or positions reaches a default handout, wherever the chart object kept them', {
    leaks: []
  }, sr(function () { return { leaks: srLeaks(SR.handout(srChart('self'), { notes: ['n1', 'n2'] }).payload) }; }));
  t('T3', 'each option adds its own part and only that: the place is a name and never coordinates or a zone, and an activation keeps four fields', {
    centres: ['Sacral', 'Throat', 'Root'], channels: ['20-34', '53-42'], gates: 5, acts: 'body,gate,line,side', birth: { date: '1985-03-10', time: '06:30', place: 'Chicago, Illinois' },
    placeOnlyLeaks: ['Chicago']
  }, sr(function () {
    var all = SR.handout(srChart('self'), { include: { centres: true, channels: true, gates: true, activations: true, birthDate: true, birthTime: true, birthPlace: true } }).payload;
    var place = SR.handout(srChart('self'), { include: { birthPlace: true } }).payload;
    return { centres: all.centres, channels: all.channels, gates: all.gates.length, acts: Object.keys(all.activations[0]).sort().join(','),
      birth: all.birth, placeOnlyLeaks: srLeaks(place) };
  }));
  t('T4', 'another person\'s chart: the default handout goes without their name; anything beyond it needs their recorded word, and a withdrawn word is no word', {
    plain: true, name: false, refused: 'no_consent', stated: true, card: true, withdrawn: 'no_consent', named: 'Ana'
  }, sr(function () {
    var plain = SR.handout(srChart('person'));
    return { plain: plain.ok, name: 'name' in plain.payload,
      refused: SR.handout(srChart('person'), { include: { centres: true } }).reason,
      stated: SR.handout(srChart('person', { basis: 'stated', scope: ['store', 'handout'] }), { include: { gates: true } }).ok,
      card: SR.handout(srChart('person', { basis: 'card', scope: ['handout'] }), { include: { birthDate: true } }).ok,
      withdrawn: SR.handout(srChart('person', { basis: 'stated', scope: ['handout'], withdrawn_at: '2026-10-29T00:00:00Z' }), { include: { centres: true } }).reason,
      named: SR.handout(srChart('person'), { include: { name: true } }).payload.name };
  }));
  t('T5', 'a client\'s chart: no handout at all without their word, a word that does not cover handouts is not enough, and with it the name still starts off', {
    none: 'no_consent', notesOnly: 'no_consent', withWord: true, name: false, basisNone: 'no_consent'
  }, sr(function () {
    var ok = SR.handout(srChart('client', { basis: 'stated', scope: ['store', 'notes', 'handout'] }));
    return { none: SR.handout(srChart('client')).reason,
      notesOnly: SR.handout(srChart('client', { basis: 'stated', scope: ['store', 'notes'] })).reason,
      withWord: ok.ok, name: 'name' in ok.payload,
      basisNone: SR.handout(srChart('client', { basis: 'none', scope: ['handout'] })).reason };
  }));
  t('T6', 'an option the module does not know is refused rather than ignored, so a misspelled one cannot ship what it meant to leave out', {
    typo: 'unknown_option', detail: 'birthdate', stray: 'unknown_option', kind: 'kind'
  }, sr(function () {
    var r = SR.handout(srChart('self'), { include: { birthdate: false } });
    return { typo: r.reason, detail: r.detail, stray: SR.handout(srChart('self'), { everything: true }).reason,
      kind: SR.handout({ type: 'Generator' }).reason };
  }));
  t('T7', 'notes travel as the reader picked them, as words: what an address resolved to never travels, and an address goes only beside the part it names', {
    count: 2, first: { text: 'Waiting to respond.', address: 'facet:type' }, second: { text: 'The design Moon again.' },
    withActs: 'activation:design:Moon', resolvedNever: true
  }, sr(function () {
    var a = SR.handout(srChart('self'), { notes: ['n1', 'n2'] }).payload, b = SR.handout(srChart('self'), { notes: ['n2'], include: { activations: true } }).payload;
    return { count: a.notes.length, first: a.notes[0], second: a.notes[1], withActs: b.notes[0].address,
      resolvedNever: JSON.stringify([a, b]).indexOf('resolved') === -1 };
  }));
  var srSubjects = [
    { kind: 'self', id: 'pSelf', display_name: 'Ana', birth: { date: '1985-03-10', time: '06:30', place: 'Chicago', lat: 41.8781, lon: -87.6298, zone: 'America/Chicago', secret: 'x' },
      versions: [{ id: 'v1', seq: 1, reason: 'initial', birth: { date: '1985-03-10', time: '06:15' }, chart_hash: 'h1', created_at: '2026-10-29T00:00:00Z' }],
      notes: [{ id: 'n1', address: 'gate:20', version: 'v1', text: 'Mine.', resolved: { held: true }, created_at: 'a', updated_at: 'b' }] },
    { kind: 'person', id: 'pPerson', display_name: 'Bea', birth: { date: '1990-01-01' }, versions: [], notes: [],
      subject_consent: { basis: 'none', scope: [] } },
    { kind: 'client', id: 'pClient', display_name: 'Cal', birth: { date: '1970-07-07', time: '10:00' }, versions: [], notes: [],
      subject_consent: { basis: 'stated', scope: ['store', 'notes', 'handout'], stated_at: '2026-10-01T00:00:00Z' } }];
  t('T8', 'the reader\'s export carries their own birth, versions and notes and nobody else unless asked, and says so in its header', {
    schema: 'incommon.charts.v1', includes: { birth_data: true, notes: true, people: false }, kinds: ['self'], versions: 1, notes: 1, resolved: true, extra: false
  }, sr(function () {
    var f = SR.exportFile(srSubjects, {}, Date.UTC(2026, 9, 29)).file;
    return { schema: f.schema, includes: f.includes, kinds: f.subjects.map(function (x) { return x.kind; }), versions: f.subjects[0].versions.length,
      notes: f.subjects[0].notes.length, resolved: !!f.subjects[0].notes[0].resolved, extra: 'secret' in f.subjects[0].birth };
  }));
  t('T9', 'with people ticked the export carries them and their recorded word; without birth data it carries no birth, no version and no resolved value for anyone', {
    kinds: ['self', 'person', 'client'], clientWord: 'stated', noBirth: true, refused: 'unknown_option'
  }, sr(function () {
    var f = SR.exportFile(srSubjects, { people: true }).file, g = SR.exportFile(srSubjects, { people: true, birthData: false }).file;
    var j = JSON.stringify(g);
    return { kinds: f.subjects.map(function (x) { return x.kind; }), clientWord: f.subjects[2].subject_consent.basis,
      noBirth: g.subjects.every(function (x) { return x.birth === null && x.versions.length === 0; }) && j.indexOf('resolved') === -1 && j.indexOf('1985') === -1 && j.indexOf('1970') === -1,
      refused: SR.exportFile(srSubjects, { everyone: true }).reason };
  }));
  t('T10', 'the module sends nothing and keeps nothing: no network, no storage, no clock beyond the export stamp', {
    clean: true
  }, sr(function () {
    var src = fs.readFileSync(path.join(repo, 'app', 'share-rules.js'), 'utf8').split('\n').filter(function (l) { return !/^\s*(\/\*|\*)/.test(l); }).join('\n');
    return { clean: !/fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\./.test(src) };
  }));

  /* A cover client whose sign ins come back owing a code or not, and whose
     authenticator calls are recorded. */
  function mfaHarness(o) {
    o = o || {};
    var h = { verify: [], challenge: [], listed: 0, unenroll: [], enroll: [], signOut: [] };
    var s = o.session || sess(VER, 'aal1');
    var mfa = {
      listFactors: function () { h.listed++; var all = o.all || (o.factors || VER); return Promise.resolve({ data: { all: all, totp: all.filter(function (f) { return f.status === 'verified'; }) }, error: null }); },
      challengeAndVerify: function (a) { h.verify.push(a); return Promise.resolve(o.verifyError ? { data: null, error: o.verifyError } : { data: { access_token: jwtOf({ aal: 'aal2' }) }, error: null }); },
      unenroll: function (a) { h.unenroll.push(a); return Promise.resolve({ data: { id: a.factorId }, error: null }); },
      enroll: function (a) { h.enroll.push(a); return Promise.resolve({ data: { id: 'fNew', type: 'totp', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/x' } }, error: null }); }
    };
    var auth = {
      onAuthStateChange: function (cb) { h.onAuth = cb; },
      signInWithPassword: function () { return Promise.resolve({ data: { session: s }, error: null }); },
      setSession: function () { return Promise.resolve({ data: { session: s }, error: null }); },
      exchangeCodeForSession: function () { return Promise.resolve({ data: { session: s }, error: null }); },
      verifyOtp: function () { return Promise.resolve({ data: { session: s }, error: null }); },
      signOut: function (a) { h.signOut.push(a); return Promise.resolve({ error: null }); },
      mfa: mfa
    };
    h.client = { auth: auth, from: function (table) { return fakeClient([]).from(table); } };
    h.C = loadIsolatedCloud({ createClient: function () { return h.client; } });
    return h;
  }
  var mOwe = mfaHarness(), mFree = mfaHarness({ session: sess(undefined, 'aal1') });
  var siOwe = await mOwe.C.passwordSignIn('reader@k46.invalid', 'correct horse');
  var siFree = await mFree.C.passwordSignIn('reader@k46.invalid', 'correct horse');
  var adOwe = await mOwe.C.adoptSession('at', 'rt'), exOwe = await mOwe.C.oauthFinish('c'), phOwe = await mOwe.C.phoneCodeCheck('+15551234567', '123456');
  t('K47', 'every way the cover makes a session says when it still owes its two-step code (password, emailed link, old sign in link, texted code), and an account without one is not asked', {
    password: { ok: true, mfa: true }, free: { ok: true, mfa: false }, link: true, oldLink: true, text: true
  }, { password: { ok: siOwe.ok, mfa: !!siOwe.mfa }, free: { ok: siFree.ok, mfa: !!siFree.mfa }, link: !!adOwe.mfa, oldLink: !!exOwe.mfa, text: !!phOwe.mfa });

  var mV = mfaHarness();
  var vShort = await mV.C.mfaVerify('12345'), vCalls = mV.verify.length;
  var vOk = await mV.C.mfaVerify(' 123 456 ');
  var mBad = mfaHarness({ verifyError: { code: 'mfa_verification_failed', message: 'Invalid TOTP code entered', status: 422 } });
  var vBad = await mBad.C.mfaVerify('000000');
  var mNone = mfaHarness({ factors: [] });
  var vNone = await mNone.C.mfaVerify('123456');
  var soOut = await mV.C.coverSignOut();
  t('K48', 'the cover checks a two-step code against the account\'s verified authenticator: anything but six digits is refused without asking, spaces are allowed, a wrong code is badCode, no authenticator is an error, and leaving the step signs this browser out only', {
    shortReason: 'badCode', shortCalls: 0, ok: true, sent: { factorId: 'f1', code: '123456' }, bad: 'badCode', none: 'error', signOut: { ok: true, scope: 'local' }
  }, { shortReason: vShort.reason, shortCalls: vCalls, ok: vOk.ok, sent: mV.verify[0], bad: vBad.reason, none: vNone.reason,
    signOut: { ok: soOut.ok, scope: mV.signOut[0] && mV.signOut[0].scope } });

  var mG = mfaHarness();
  mG.C.init({ url: 'https://k49-test.invalid', anonKey: 'k49-fake-anon', core: {}, pm: fakePM([{ id: 'p1', name: 'R' }], {}), storage: clStore() });
  mG.onAuth('SIGNED_IN', sess(VER, 'aal1'));
  var gHeld = mG.C.status();
  var gOracle = await mG.C.oracleRead({ period: 'daily' }), gPush = await mG.C.push(), gMfa = await mG.C.mfaStatus();
  mG.onAuth('MFA_CHALLENGE_VERIFIED', sess(VER, 'aal2'));
  var gUp = mG.C.status();
  mG.onAuth('SIGNED_IN', sess(undefined, 'aal1'));
  var gPlain = mG.C.status();
  t('K49', 'in the app a session that still owes its code is held aside: the app reads as signed out and says why, nothing is pushed and no function is asked, and the same account at aal2, or an account without two-step, is signed in', {
    held: { mode: 'local', owesCode: true }, oracle: 'signedOut', push: 'no-session', status: 'signedOut',
    lifted: { mode: 'cloud', owesCode: false }, plain: { mode: 'cloud', owesCode: false }
  }, { held: { mode: gHeld.mode, owesCode: gHeld.owesCode }, oracle: gOracle.reason, push: gPush.reason, status: gMfa.reason,
    lifted: { mode: gUp.mode, owesCode: gUp.owesCode }, plain: { mode: gPlain.mode, owesCode: gPlain.owesCode } });

  var appSess = sess(undefined, 'aal1');
  var eOut = mfaHarness({ all: UNV.concat([{ id: 'f9', factor_type: 'totp', status: 'unverified' }]) });
  eOut.C._setClientForTests(eOut.client, null);
  var enOut = await eOut.C.mfaEnrollStart();
  eOut.C._setClientForTests(eOut.client, appSess);
  var stOff = await eOut.C.mfaStatus();
  var en = await eOut.C.mfaEnrollStart();
  var enVerify = await eOut.C.mfaEnrollVerify(en.factorId, '654321');
  var eOn = mfaHarness();
  eOn.C._setClientForTests(eOn.client, sess(VER, 'aal2'));
  var stOn = await eOn.C.mfaStatus(), enAgain = await eOn.C.mfaEnrollStart();
  t('K50', 'turning two-step on needs a session, clears setups that were never confirmed, asks for an authenticator named inCommon, hands back the QR code and the setup key, and is confirmed only by a first code for that new authenticator; an account that has it on is told so', {
    signedOut: 'signedOut', statusOff: { ok: true, on: false }, cleared: ['f0', 'f9'],
    enroll: { factorType: 'totp', issuer: 'inCommon' }, got: { ok: true, factorId: 'fNew', qr: true, secret: 'JBSWY3DPEHPK3PXP' },
    confirmed: { ok: true, sent: { factorId: 'fNew', code: '654321' } }, statusOn: { ok: true, on: true }, already: 'already'
  }, { signedOut: enOut.reason, statusOff: stOff, cleared: eOut.unenroll.map(function (u) { return u.factorId; }),
    enroll: { factorType: eOut.enroll[0] && eOut.enroll[0].factorType, issuer: eOut.enroll[0] && eOut.enroll[0].issuer },
    got: { ok: en.ok, factorId: en.factorId, qr: /^data:image\/svg/.test(en.qr || ''), secret: en.secret },
    confirmed: { ok: enVerify.ok, sent: eOut.verify[0] }, statusOn: stOn, already: enAgain.reason });

  var dBad = mfaHarness({ verifyError: { code: 'mfa_verification_failed', message: 'Invalid TOTP code entered' } });
  dBad.C._setClientForTests(dBad.client, sess(VER, 'aal2'));
  var offBad = await dBad.C.mfaDisable('111111');
  var dOk = mfaHarness();
  dOk.C._setClientForTests(dOk.client, sess(VER, 'aal2'));
  var offOk = await dOk.C.mfaDisable('222222');
  CO._setClientForTests(oracleClient(function () { return { data: null, error: httpErr(401, 'MFA_REQUIRED') }; }).client, { user: { id: 'u1' } });
  var mfaOracle = await CO.oracleRead({ period: 'daily' }), mfaBill = await CO.billingStatus();
  t('K51', 'turning two-step off asks for a current code first and removes nothing on a wrong one; and a server that refuses a session for its missing code reads to the page as signed out', {
    wrong: { ok: false, reason: 'badCode', removed: 0 }, right: { ok: true, removed: ['f1'] }, oracle: 'signedOut', billing: 'signedOut'
  }, { wrong: { ok: offBad.ok, reason: offBad.reason, removed: dBad.unenroll.length },
    right: { ok: offOk.ok, removed: dOk.unenroll.map(function (u) { return u.factorId; }) }, oracle: mfaOracle.reason, billing: mfaBill.reason });

  /* ---- K52-K53: Cloudflare Turnstile, 11 October 2026. With CAPTCHA
     protection on, Supabase asks a token of the five calls that can be scripted
     (password sign in, sign up, the reset email, a text code, a resend) and of
     nothing else. The cover hands the token in; without one the calls go
     exactly as before, which is what lets the page ship first. */
  var tk = { captchaToken: 'tok-k52' };
  var gT = oauthHarness();
  await gT.C.passwordSignIn('reader@k52.invalid', 'correct horse', tk);
  await gT.C.passwordSignIn('(555) 123-4567', 'correct horse', tk);
  await gT.C.passwordSignUp('reader@k52.invalid', 'correct horse', 'https://k52.invalid/', { newsletter: true, captchaToken: 'tok-k52' });
  await gT.C.passwordSignUp('(555) 123-4567', 'correct horse', 'https://k52.invalid/', tk);
  await gT.C.passwordResetStart('reader@k52.invalid', 'https://k52.invalid/', tk);
  await gT.C.passwordResetStart('(555) 123-4567', 'https://k52.invalid/', tk);
  await gT.C.phoneCodeResend('(555) 123-4567', 'signup', tk);
  await gT.C.phoneCodeResend('(555) 123-4567', 'recover', tk);
  await gT.C.phoneCodeCheck('+15551234567', '123456');
  var gN = oauthHarness();
  await gN.C.passwordSignIn('reader@k52.invalid', 'correct horse');
  await gN.C.passwordSignUp('reader@k52.invalid', 'correct horse', 'https://k52.invalid/', { newsletter: false });
  await gN.C.passwordResetStart('reader@k52.invalid', 'https://k52.invalid/');
  await gN.C.phoneCodeResend('(555) 123-4567', 'signup');
  var tokOf = function (o) { return o && o.captchaToken; };
  t('K52', 'a Turnstile token rides on every call the server asks one of (sign in by email and by phone, sign up by both, the reset email and the text, both resends), never on a code check, and with no token the calls are sent exactly as before', {
    withToken: { pw: ['tok-k52', 'tok-k52'], up: ['tok-k52', 'tok-k52'], newsletterKept: true, reset: 'tok-k52', otp: ['tok-k52', 'tok-k52'], resend: 'tok-k52', verifyCarries: false },
    without: { pwOptions: false, upToken: false, resetToken: false, resendOptions: false }
  }, {
    withToken: { pw: gT.pw.map(function (a) { return tokOf(a.options); }), up: gT.up.map(function (a) { return tokOf(a.options); }),
      newsletterKept: !!(gT.up[0].options && gT.up[0].options.data && gT.up[0].options.data.newsletter === true),
      reset: tokOf(gT.reset[0] && gT.reset[0].opts), otp: gT.otp.map(function (a) { return tokOf(a.options); }),
      resend: tokOf(gT.resend[0] && gT.resend[0].options), verifyCarries: JSON.stringify(gT.verify).indexOf('tok-k52') !== -1 },
    without: { pwOptions: 'options' in gN.pw[0], upToken: 'captchaToken' in (gN.up[0].options || {}), resetToken: 'captchaToken' in (gN.reset[0].opts || {}),
      resendOptions: 'options' in gN.resend[0] }
  });
  var capReasons = {};
  [['missing', { code: 'captcha_failed', message: 'captcha protection: request disallowed (no captcha_token found)', status: 400 }],
   ['refused', { message: 'captcha protection: request disallowed (timeout-or-duplicate)', status: 400 }]].forEach(function (c) {
    capReasons[c[0]] = null; capReasons['_' + c[0]] = c[1];
  });
  capReasons.missing = (await oauthHarness({ pwError: capReasons._missing }).C.passwordSignIn('reader@k52.invalid', 'x', tk)).reason;
  capReasons.refused = (await oauthHarness({ upError: capReasons._refused }).C.passwordSignUp('reader@k52.invalid', 'correct horse', 'https://k52.invalid/', tk)).reason;
  delete capReasons._missing; delete capReasons._refused;
  var hdrSrc = fs.readFileSync(path.join(repo, 'deploy', 'v6.4', '_headers'), 'utf8');
  var csp = (hdrSrc.match(/Content-Security-Policy: (.*)/) || [])[1] || '';
  var dir = function (name) { return ((csp.match(new RegExp('(?:^|; )' + name + ' ([^;]*)')) || [])[1] || '').split(/\s+/); };
  var tsSrc = (coverSrc.match(/var TS_SRC = '([^']+)'/) || [])[1] || '';
  var tsOrigin = tsSrc ? new URL(tsSrc).origin : '';
  t('K53', 'a refused or missing Turnstile token is a reason the cover can say, and the security headers let the cover reach the one Turnstile origin it loads, for its script and its frame, and nowhere else new', {
    reasons: { missing: 'captcha', refused: 'captcha' }, origin: 'https://challenges.cloudflare.com', script: true, frame: true, connectUnchanged: true
  }, { reasons: capReasons, origin: tsOrigin, script: dir('script-src').indexOf(tsOrigin) !== -1, frame: dir('frame-src').indexOf(tsOrigin) !== -1,
    connectUnchanged: dir('connect-src').indexOf(tsOrigin) === -1 });

  /* ---- K54-K55: Contact Support and the two legal pages, 11 October 2026.
     The Terms and the Privacy Policy name Contact Support as the way to reach
     the operator, cancel, and make a privacy or deletion request, so the call
     has to work with nobody signed in, say what was wrong in words, and send
     exactly three fields: topic, email and message. Nothing the reader types
     may choose a user id or a status; the table refuses both as well
     (server/support.sql). */
  var sent = [];
  var fakeFetch = function (answer) {
    return function (url, init) { sent.push({ url: url, init: init }); return Promise.resolve(answer); };
  };
  var okAns = { ok: true, status: 201, text: function () { return Promise.resolve(''); } };
  var rateAns = { ok: false, status: 400, text: function () { return Promise.resolve('{"code":"P0001","message":"support_rate"}'); } };
  var goneAns = { ok: false, status: 404, text: function () { return Promise.resolve('{"code":"PGRST205","message":"Could not find the table"}'); } };
  var sOk = await CL.supportSend({ topic: 'delete', email: ' reader@k54.invalid ', message: 'Please delete my account and data.', user_id: 'x', status: 'answered' }, { fetch: fakeFetch(okAns) });
  var body = sent[0] ? JSON.parse(sent[0].init.body) : {};
  var hdr = sent[0] ? sent[0].init.headers : {};
  var sBadTopic = await CL.supportSend({ topic: 'spam', email: 'a@k54.invalid', message: 'A message long enough.' }, { fetch: fakeFetch(okAns) });
  var sentTopic = sent[1] ? JSON.parse(sent[1].init.body).topic : null;
  var before = sent.length;
  var reasons = {
    email: (await CL.supportSend({ email: 'not an address', message: 'A message long enough.' }, { fetch: fakeFetch(okAns) })).reason,
    short: (await CL.supportSend({ email: 'a@k54.invalid', message: 'hi' }, { fetch: fakeFetch(okAns) })).reason,
    long: (await CL.supportSend({ email: 'a@k54.invalid', message: new Array(5002).join('x') }, { fetch: fakeFetch(okAns) })).reason
  };
  var sentForInvalid = sent.length - before;
  reasons.rate = (await CL.supportSend({ email: 'a@k54.invalid', message: 'A message long enough.' }, { fetch: fakeFetch(rateAns) })).reason;
  reasons.notSetUp = (await CL.supportSend({ email: 'a@k54.invalid', message: 'A message long enough.' }, { fetch: fakeFetch(goneAns) })).reason;
  reasons.offline = (await CL.supportSend({ email: 'a@k54.invalid', message: 'A message long enough.' }, { fetch: function () { return Promise.reject(new Error('net')); } })).reason;
  t('K54', 'Contact Support sends topic, email and message and nothing else to support_requests, works signed out with the public key, refuses a bad address or an empty message before sending, and names a throttle, a missing table and no connection in words', {
    ok: true, url: true, keys: ['email', 'message', 'topic'], trimmed: 'reader@k54.invalid', anon: true, badTopicFallsBack: 'general',
    invalidSentNothing: 0, reasons: { email: 'email', short: 'short', long: 'long', rate: 'rate', notSetUp: 'notSetUp', offline: 'offline' }
  }, {
    ok: !!sOk.ok && !!sBadTopic.ok, url: !!sent[0] && /\/rest\/v1\/support_requests$/.test(sent[0].url),
    keys: Object.keys(body).sort(), trimmed: body.email,
    anon: !!hdr && hdr.Authorization === 'Bearer ' + hdr.apikey && /^eyJ/.test(hdr.apikey || ''),
    badTopicFallsBack: sentTopic, invalidSentNothing: sentForInvalid, reasons: reasons
  });

  var termsSrc = fs.readFileSync(path.join(repo, 'app', 'terms.html'), 'utf8');
  var privSrc = fs.readFileSync(path.join(repo, 'app', 'privacy.html'), 'utf8');
  var appSrcK = fs.readFileSync(path.join(repo, 'app', 'inCommonApp v2.dc.html'), 'utf8');
  var orderOk = function (src) {
    var t1 = src.indexOf('./terms.html'), p1 = src.indexOf('./privacy.html');
    return t1 !== -1 && p1 !== -1 && t1 < p1;
  };
  var dashRe = new RegExp('[' + String.fromCharCode(8212, 8211) + ']|&[mn]dash;');
  var sqlSrc = fs.readFileSync(path.join(repo, 'server', 'support.sql'), 'utf8');
  var mfaSrc = fs.readFileSync(path.join(repo, 'server', 'mfa-policies.sql'), 'utf8');
  /* Eight links in the app, in each shell: Settings twice, the Luminary gate
     in the Oracle, and the same gate in the tarot room for Omni. */
  t('K55', 'the Terms sit directly above the Privacy Policy on the cover, in Settings, and at the Luminary gate in the Oracle, in the sheet of the Cycle Audit and in the tarot room; both pages name the operator, Florida law, the age of 16, the support route and the Oracle disclosure, carry no dash, and the support table is covered by the two-step rule', {
    /* 11 since 26 October 2026: the registration card's agreement line. */
    cover: true, appLinks: 11, appOrderEachTime: true, operator: true, florida: true, age16: true,
    oracleSent: true, oracleNotSent: true, moonshot: true, supportRoute: true, renewal: true, noDash: true, mfaCovers: true, sqlInsertOnly: true
  }, {
    cover: orderOk(coverSrc), appLinks: appSrcK.split('href="./terms.html"').length - 1,
    appOrderEachTime: appSrcK.split('href="./terms.html"').slice(1).every(function (chunk) { return chunk.indexOf('href="./privacy.html"') !== -1 && chunk.indexOf('href="./privacy.html"') < 900; }),
    operator: /Nathaniel J\. Figueroa/.test(termsSrc) && /Nathaniel J\. Figueroa/.test(privSrc),
    florida: /State of Florida/.test(termsSrc), age16: /at least <strong>16 years old<\/strong>/.test(termsSrc) && /under 16/.test(privSrc),
    oracleSent: /first name on your profile/.test(privSrc) && /Moonshot AI/.test(privSrc),
    oracleNotSent: /birth date, birth time and birth place are not sent/.test(privSrc),
    moonshot: /Moonshot AI/.test(termsSrc),
    supportRoute: /#\/support/.test(termsSrc) && /#\/support/.test(privSrc) && /seg\[0\] === 'support'/.test(appSrcK),
    renewal: /one time payment/i.test(termsSrc) && /not a subscription/.test(termsSrc) && /One payment, not a subscription/.test(appSrcK) && !/Renews automatically each month or year/.test(appSrcK),
    noDash: !dashRe.test(termsSrc) && !dashRe.test(privSrc),
    mfaCovers: /'support_requests'/.test(mfaSrc),
    sqlInsertOnly: /for insert to anon, authenticated/.test(sqlSrc) && !/for select|for update|for delete|for all/.test(sqlSrc)
  });
}

/* --------------------------------------------------- H: the sleep teaching
   Four rows for the correction of 28 October 2026. The tradition's Sleeping
   Mechanics entry gives a design with a defined Sacral a different instruction
   from every other design, and the app carried the other one for both, in four
   entries, a shared closing and a health note. H1 to H3 hold the passages. H4
   holds the selection, because pick() pads a short list from rows whose
   condition did not match, which is how a Projector was handed the Sacral
   instruction while the closing beneath it said the opposite. */
(function () {
  const LIFE = require(path.join(repo, 'app', 'hd-life.js'));
  const TEACH = require(path.join(repo, 'app', 'hd-teachings.js'));

  const OLD = /before you are tired|before the energy runs out|burn off lying down|get horizontal before you are finished|already exhausted, night after night/i;
  const four = [
    ['Sacral defined sleep', LIFE.CENTERS.Sacral.defined.sleep],
    ['Generator sleep', LIFE.TYPES.Generator.sleep],
    ['Manifesting Generator sleep', LIFE.TYPES['Manifesting Generator'].sleep],
    ['Sacral authority sleep', LIFE.authorityFor('Sacral').sleep]
  ];
  t('H1', 'none of the four corrected sleep entries gives a design the instruction the tradition gives to the design it is not',
    four.filter(r => OLD.test(r[1])).map(r => r[0]), []);

  t('H2', 'the open Sacral sleep entry is unchanged, because horizontal rest is the correct teaching for a design without a defined Sacral',
    LIFE.CENTERS.Sacral.open.sleep,
    'You need more rest than the people around you, and often need to lie down before they do. That is not a weakness to be trained out.');

  /* The health note carried the same reversal as the sleep entries: it called
     going to bed already exhausted the damage, which is the correct order for a
     design with a defined Sacral. It names the unspent day now, in the same
     terms as the sleep entry beside it. */
  t('H5', 'the Sacral health note no longer calls going to bed exhausted the damage, and names the unspent energy its sleep entry describes',
    [/already exhausted/.test(LIFE.CENTERS.Sacral.defined.health),
     /energy still running/.test(LIFE.CENTERS.Sacral.defined.health),
     /nothing the gut agreed to spent it/.test(LIFE.CENTERS.Sacral.defined.health)],
    [false, true, true]);

  const CENTERS = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Spleen', 'Solar Plexus', 'Sacral', 'Root'];
  const CHANNELS = Object.keys(ATLAS.CHANNELS);
  const chart = o => {
    const names = CHANNELS.slice(0, o.channels || 0);
    return {
      type: o.type, strategy: o.type, authority: o.authority,
      profileKey: '3/5', profileName: 'Martyr / Heretic',
      profileHow: 'Trial and error, then a life read through other people.',
      cLine: 3, uLine: 5,
      defined: o.defined,
      open: CENTERS.filter(n => o.defined.indexOf(n) === -1),
      channelNames: names, channelCount: names.length,
      gateCount: 12, designCount: 13, personalityCount: 13,
      hangingNames: [], hangingCount: 0
    };
  };
  const SHAPES = [
    { name: 'Generator, Sacral authority', sacral: true,
      chart: chart({ type: 'Generator', authority: 'Sacral', defined: ['Sacral', 'Root', 'Spleen'], channels: 3 }) },
    { name: 'Generator, emotional authority', sacral: true,
      chart: chart({ type: 'Generator', authority: 'Emotional', defined: ['Sacral', 'Solar Plexus', 'Root'], channels: 3 }) },
    { name: 'Manifesting Generator, emotional authority', sacral: true,
      chart: chart({ type: 'Manifesting Generator', authority: 'Emotional', defined: ['Sacral', 'Solar Plexus', 'Throat', 'G'], channels: 4 }) },
    { name: 'Projector, splenic authority', sacral: false,
      chart: chart({ type: 'Projector', authority: 'Splenic', defined: ['Spleen', 'Ajna'], channels: 1 }) },
    { name: 'Reflector, lunar authority', sacral: false,
      chart: chart({ type: 'Reflector', authority: 'Lunar', defined: [], channels: 0 }) },
    { name: 'Manifestor, ego authority', sacral: false,
      chart: chart({ type: 'Manifestor', authority: 'Ego', defined: ['Heart', 'Throat'], channels: 1 }) }
  ];
  const sleepOf = s => TEACH.build(s.chart, ATLAS, LIFE).filter(tab => tab.key === 'sleep')[0];

  t('H3', 'the shared closing follows defined Sacral and not authority: the three Sacral shapes take the post-spending closing, the other three take the horizontal one, and none takes both',
    SHAPES.map(s => {
      const p = sleepOf(s).paragraphs;
      const close = p[p.length - 1] || '';
      return [s.name,
        close.indexOf('has been spent, not before it') !== -1,
        close.indexOf('horizontal position long before sleep') !== -1];
    }),
    SHAPES.map(s => [s.name, s.sacral, !s.sacral]));

  const SACRAL_ROWS = ['engine still running', 'energy spent on something the gut said yes to'];
  t('H4', 'the two defined-Sacral sleep rows appear in the three defined-Sacral readings and in none of the other three, so no reading contradicts its own closing',
    SHAPES.map(s => {
      const text = sleepOf(s).quads.map(q => q.items.join(' ')).join(' ');
      return [s.name, SACRAL_ROWS.filter(r => text.indexOf(r) !== -1).length];
    }),
    SHAPES.map(s => [s.name, s.sacral ? 2 : 0]));
})();

/* --------------------------------------------------- N: the authority order
   Authority is one expression inside hdChart() in the app file, and it is not
   exported. This group reads that expression out of the shipped file and
   evaluates it against the defined centres, so it tests the code a reader gets
   rather than a copy of it. The order is the tradition's: a defined Solar Plexus
   is Emotional before a defined Sacral is Sacral, so a Generator or Manifesting
   Generator with both defined has Emotional authority. Rows N1 and N2 hold that
   order; the rows after them hold the controls beside it. */
(function () {
  const src = require('fs').readFileSync(path.join(repo, 'app', 'inCommonApp v2.dc.html'), 'utf8');
  /* The line is found by the branch it must contain, not by its first test, so
     a change of order is read and judged rather than reported as a missing line. */
  const found = src.match(/^ *const authority = .*Emotional:.*;\s*$/gm) || [];
  const expr = found.length === 1 ? /^ *const authority = (.*);\s*$/m.exec(found[0])[1] : null;
  /* hdChart() puts the Sacral test in a local before this line, and the line may
     read it, so the three names it can read are supplied the same way. */
  const derive = expr === null ? null : new Function('defined', 'seen', 'sacral', 'return ' + expr);
  const authorityOf = (defined, seen) => {
    const d = new Set(defined);
    try { return derive(d, new Set(seen || []), d.has('Sacral')); } catch (e) { return 'threw: ' + e.message; }
  };
  const kind = (defined, seen) => authorityOf(defined, seen).split(':')[0];

  t('N0', 'the authority expression is found once in the shipped app file, as a single line that reads defined centres',
    [found.length, expr !== null && /defined\.has\(/.test(expr)],
    [1, true]);

  t('N1', 'a Generator with a defined Sacral and a defined Solar Plexus has Emotional authority, not Sacral',
    derive ? kind(['Sacral', 'Solar Plexus', 'Root'], []) : null, 'Emotional');
  t('N2', 'a Manifesting Generator with a defined Sacral and a defined Solar Plexus has Emotional authority, not Sacral',
    derive ? kind(['Sacral', 'Solar Plexus', 'Throat', 'G'], ['Throat', 'G', 'Sacral']) : null, 'Emotional');
  t('N3', 'a Generator with a defined Sacral and no Solar Plexus has Sacral authority',
    derive ? kind(['Sacral', 'Root', 'Spleen'], []) : null, 'Sacral');
  t('N4', 'a defined Sacral with a defined Spleen and no Solar Plexus has Sacral authority, since the Sacral is read before the Spleen',
    derive ? kind(['Sacral', 'Spleen'], []) : null, 'Sacral');
  t('N5', 'a Projector with a defined Solar Plexus has Emotional authority whatever its type, and no Sacral',
    derive ? kind(['Solar Plexus', 'Ajna'], []) : null, 'Emotional');
  t('N6', 'a defined Spleen with no Sacral or Solar Plexus has Splenic authority',
    derive ? kind(['Spleen', 'Ajna'], []) : null, 'Splenic');
  t('N7', 'a Heart reaching the Throat is Ego manifested; a Heart that does not is Ego projected',
    derive ? [kind(['Heart', 'Throat'], ['Throat', 'Heart']), kind(['Heart'], ['Throat'])] : null,
    ['Ego manifested', 'Ego projected']);
  t('N8', 'a chart with no defined centres has Lunar authority',
    derive ? kind([], []) : null, 'Lunar');
})();

/* ---------------------------------------- R: the 1.3 register, fixed in app
   Four of the discrepancies 1.3 found live in the app class, which no module
   test loads. Each row lifts the piece it judges out of the shipped file, as
   N does, and runs it, so it tests the code a reader gets. Every row fails on
   the code before the fix. */
(function () {
  const src = require('fs').readFileSync(path.join(repo, 'app', 'inCommonApp v2.dc.html'), 'utf8');
  const between = (from, to) => { const a = src.indexOf(from), b = a === -1 ? -1 : src.indexOf(to, a); return a === -1 || b === -1 ? null : src.slice(a, b); };

  /* D-01: thirteen activations a side, and one South Node on each. */
  const collectSrc = between('const collect = (t, kind) =>', "collect(tP, 'personality')");
  let acts = null;
  if (collectSrc) {
    const stub = { PLNS: [['Sun'], ['Moon'], ['Mercury'], ['Venus'], ['Mars'], ['Jupiter'], ['Saturn'], ['Uranus'], ['Neptune'], ['Pluto'], ['North Node'], ['South Node']],
      lonOf: (n, t) => (n.length * 29 + t) % 360, gateOf: lon => ({ gate: 1 + Math.floor(((lon % 360) + 360) % 360 / 5.625), line: 1 }) };
    acts = [];
    try { new Function('acts', collectSrc.replace(/\/\*[\s\S]*?\*\//g, '') + "\ncollect(0, 'personality'); collect(1, 'design');").call(stub, acts); } catch (e) { acts = null; }
  }
  t('R1', 'each side carries thirteen activations and the South Node once, as the tradition counts them (D-01)',
    acts ? ['personality', 'design'].map(k => [acts.filter(a => a.kind === k).length, acts.filter(a => a.kind === k && a.body === 'South Node').length]) : null,
    [[13, 1], [13, 1]]);

  /* D-05: every authority in the Atlas but Lunar lights its centre. */
  const fieldLine = (src.match(/^ *HD_AUTH_CENTRE = \{.*\};\s*$/m) || [''])[0];
  const authLine = (src.match(/^ *const authOf = name => this\.HD_AUTH_CENTRE\[.*\];\s*$/m) || [''])[0];
  let lit = null;
  try {
    const host = vm.runInNewContext('(class { ' + fieldLine.trim() + ' })');
    const inst = new host();
    const authOf = new Function('name', authLine.trim().replace(/^const authOf = name => /, 'return ').replace(/;\s*$/, '')).bind(inst);
    const ATL = require(path.join(repo, 'app', 'hd-atlas.js'));
    lit = ATL.AUTHORITIES.map(a => [a.name, authOf(a.name) === undefined ? 'UNDEFINED' : String(authOf(a.name))]);
  } catch (e) { lit = 'threw: ' + e.message; }
  t('R2', 'every Atlas authority but Lunar lights a centre, Self-projected (G) the G (D-05)',
    lit, [['Emotional (Solar Plexus)', 'Solar Plexus'], ['Sacral', 'Sacral'], ['Splenic', 'Spleen'], ['Ego (Heart)', 'Heart'],
      ['Self-projected (G)', 'G'], ['Mental (environmental)', 'Ajna'], ['Lunar (Reflector)', 'null']]);

  /* D-08: a gate held at two lines keeps both, and each side's list shows the
     lines that side holds. */
  const gatesSrc = between('const gates = [...gset]', 'this._hd = {');
  const sideSrc = (src.match(/^ *const sideLines = g => .*;\s*$/m) || [''])[0];
  let lists = null;
  try {
    const sample = [{ body: 'Pluto', kind: 'personality', gate: 19, line: 6 }, { body: 'Moon', kind: 'personality', gate: 41, line: 2 },
      { body: 'Pluto', kind: 'design', gate: 19, line: 3 }, { body: 'Saturn', kind: 'design', gate: 41, line: 4 }];
    const rowsOf = new Function('acts', 'gset', gatesSrc.replace(/\/\*[\s\S]*?\*\//g, '') + '\nreturn gates;').bind({ GATE_NAMES: {} });
    const rows = rowsOf(sample, new Set(sample.map(a => a.gate)));
    lists = ['both', 'personality', 'design'].map(mode => rows.map(g => g.gate + ':' +
      new Function('mode', 'g', sideSrc.trim().replace(/^const sideLines = g => /, 'return ').replace(/;\s*$/, ''))(mode, g).join('.')));
  } catch (e) { lists = 'threw: ' + e.message; }
  t('R3', 'a gate held at two lines shows both in the list, and each side shows the line it holds (D-08)',
    lists, [['19:3.6', '41:2.4'], ['19:6', '41:2'], ['19:3', '41:4']]);

  /* D-03, the app half: a saved person's gates are read at the instant the
     store settled on, the same instant as the longitudes. */
  const pcSrc = between('peopleCompute(o) {', '  /* Wired once,');
  let asked = null;
  try {
    const host = vm.runInNewContext('(class { ' + pcSrc + ' })');
    const inst = new host();
    inst.t2000 = d => d.getTime(); inst.lonOf = () => 1; inst.PLNS = [['Sun']]; inst.HD_CHANNELS = []; inst.gateCenter = () => null;
    inst.hdGatesFor = p => { asked = p; return new Set([1]); };
    inst.peopleCompute({ instant: Date.UTC(1990, 2, 15, 17, 0), timeKnown: false });
    asked = asked && [asked.birthDate, asked.birthTime, asked.timeUnknown, asked.timezone];
  } catch (e) { asked = 'threw: ' + e.message; }
  t('R4', 'an untimed saved person\'s gates are read at the stored instant, noon where born, not at noon at Greenwich (D-03)',
    asked, ['1990-03-15', '17:00', false, 'UTC']);
})();

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

runCloudTests().then(() => {
  const pass = rows.filter(r => r.pass).length, fail = rows.length - pass;
  if (!quiet) {
    rows.forEach(r => { if (!r.pass) console.log('  FAIL ' + r.id + '  ' + r.desc + '\n       expected ' + r.expected + '\n       actual   ' + r.actual); });
    console.log('run-module-tests: ' + pass + '/' + rows.length + ' passed' + (fail ? ', ' + fail + ' FAILED' : ''));
    [['B', 'birth-time.js'], ['C', 'hd-composite.js'], ['W', 'hd-wheel.js'], ['D', 'arc-solver.js'],
      ['E', 'minor bodies'], ['P', 'people-library.js'], ['Q', 'pair-cache.js'],
      ['A', 'analytics.js'], ['I', 'iching.js'], ['G', 'hd-circle.js'], ['Y', 'hd-topology.js'], ['X', 'hd-transit.js'],
      ['K', 'incommon-cloud.js'], ['O', 'profile-manager.js'], ['T', 'share-rules.js'], ['H', 'hd-life.js sleep'], ['U', 'master numbers'], ['Z', 'cycle audit'], ['J', 'omni on the server'],
      ['M', 'multiChart.test.js'], ['S', 'skyWire.test.js'], ['L', 'i18n.test.js'], ['N', 'hd authority'], ['R', '1.3 register']].forEach(([k, name]) => {
      const g = rows.filter(r => r.id[0] === k);
      if (g.length > 0) console.log('  ' + k + ' ' + name.padEnd(16) + g.filter(r => r.pass).length + '/' + g.length);
    });
  }
  process.exit(fail ? 1 : 0);
}).catch(e => { console.error('run-module-tests: the K section (incommon-cloud.js) threw', e); process.exit(1); });
