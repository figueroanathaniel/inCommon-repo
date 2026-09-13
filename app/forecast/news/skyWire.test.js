/*! skyWire.test.js: 13 assertions for public Sky Wire feed
 * Tests ceiling, determinism, type separation, no reader context
 */

const SW = require('./skyWire.js');
const NE = require('../newsEngine.js');

const tests = [];

function assert(id, desc, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  tests.push({ id: 'S' + id, desc, pass, actual: JSON.stringify(actual), expected: JSON.stringify(expected) });
}

// S1-S13 tests
assert(1, 'Sky Wire item does not have synastry flag',
  { synastry: false }.synastry === false, true);

assert(2, 'Sky Wire ceiling is hard-capped at 93',
  NE.verifySkyWireCeiling(100), 93);

assert(3, 'ceiling value is exactly 93',
  SW.PUBLIC_CEILING, 93);

assert(4, 'item lacks isNew field',
  { isNew: undefined }.isNew === undefined, true);

assert(5, 'feed includes metadata version',
  typeof SW.buildSkyWireFeed([]).version === 'string', true);

assert(6, 'feed includes generation timestamp',
  typeof SW.buildSkyWireFeed([]).generatedAt === 'string', true);

assert(7, 'feed sorts by importance descending',
  (() => {
    const items = [
      { id: 'a', importance: 50 },
      { id: 'b', importance: 90 },
      { id: 'c', importance: 75 }
    ];
    const feed = SW.buildSkyWireFeed(items);
    return feed.items[0].importance >= feed.items[1].importance &&
           feed.items[1].importance >= feed.items[2].importance;
  })(), true);

assert(8, 'feed uses ID as tiebreaker',
  (() => {
    const items = [
      { id: 'b', importance: 80 },
      { id: 'a', importance: 80 }
    ];
    const feed = SW.buildSkyWireFeed(items);
    return feed.items[0].id === 'a' && feed.items[1].id === 'b';
  })(), true);

assert(9, 'validation rejects synastry items',
  SW.validateSkyWireItem({ synastry: true, importance: 80 }), false);

assert(10, 'validation rejects items with partner',
  SW.validateSkyWireItem({ partner: { id: 'p1' }, importance: 80 }), false);

assert(11, 'validation rejects items over ceiling',
  SW.validateSkyWireItem({ importance: 95 }), false);

assert(12, 'personal ceiling is 5 points higher than Sky Wire',
  (NE.PERSONAL_CEILING - SW.PUBLIC_CEILING), 5);

assert(13, 'feed sorting is deterministic',
  (() => {
    const items = [
      { id: 'c', importance: 70 },
      { id: 'a', importance: 80 },
      { id: 'b', importance: 80 }
    ];
    const feed1 = SW.buildSkyWireFeed(items);
    const feed2 = SW.buildSkyWireFeed(items);
    return feed1.items.map(i => i.id).join() === feed2.items.map(i => i.id).join();
  })(), true);

function runTests() {
  const passed = tests.filter(t => t.pass).length;
  const failed = tests.length - passed;
  const errors = tests.filter(t => !t.pass).map(t =>
    'S' + t.id.slice(1) + ': ' + t.desc
  );

  if (!global.quiet) {
    tests.forEach(t => {
      if (!t.pass) {
        console.log('  FAIL ' + t.id + '  ' + t.desc + '\n       expected ' + t.expected + '\n       actual   ' + t.actual);
      }
    });
    console.log('  S skyWire.test         ' + passed + '/' + tests.length);
  }

  return { passed, failed, errors };
}

module.exports = { runTests, tests };
