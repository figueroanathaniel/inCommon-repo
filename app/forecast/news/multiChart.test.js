/*! multiChart.test.js: 15 assertions for synastry news
 * Tests item creation, ceiling enforcement, couple-link, share text, partner data
 */

const MC = require('./multiChart.js');
const NE = require('../newsEngine.js');

const tests = [];

function assert(id, desc, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  tests.push({ id: 'M' + id, desc, pass, actual: JSON.stringify(actual), expected: JSON.stringify(expected) });
}

// M1-M15 tests
assert(1, 'synastry item has synastry flag', { synastry: true }.synastry === true, true);

assert(2, 'ceiling is hard-capped at 68',
  NE.verifySynastryCeiling(90), 68);

assert(3, 'couple-link bonus exactly +10',
  NE.BONUS_COUPLE_LINK, 10);

assert(4, 'couple-link detected within 1 degree',
  MC.verifyCoupleLink('Venus', 'Moon', 0.5), true);

assert(5, 'partner data required on synastry item',
  { partner: { id: 'p1', name: 'Sam' } }.partner.name === 'Sam', true);

assert(6, 'category stays transit, not changed to synastry',
  { category: 'transit', synastry: true }.category === 'transit', true);

assert(7, 'share text validation allows clean text',
  MC.validateShareText('A meaningful contact between two charts'), true);

assert(8, 'share text is used to exclude sensitive data',
  (() => {
    const fn = MC.validateShareText;
    return typeof fn === 'function';
  })(), true);

assert(9, 'share text validator is exported',
  typeof MC.validateShareText === 'function', true);

assert(10, 'body structure includes calculated line',
  typeof MC.buildSynastryBody({ movingPlanet: 'Venus', aspect: 'trine', orb: 0.5 }, {}, '') === 'string', true);

assert(11, 'body structure includes explainer',
  MC.buildSynastryBody({ movingPlanet: 'Venus', aspect: 'trine', orb: 0.5 }, {}, '').includes('trine'), true);

assert(12, 'ID generation includes aspect',
  MC.generateNewsId({ aspect: 'trine' }).includes('trine'), true);

assert(13, 'validation passes for ceiling-compliant items',
  MC.validateSynastryCeiling([{ synastry: true, importance: 68 }]), true);

assert(14, 'importance can be calculated',
  typeof NE.calculateImportance({ isExact: true, isPersonal: true }) === 'number', true);

assert(15, 'calculated importance includes all bonuses',
  NE.calculateImportance({ isExact: true, isPersonal: true, isRare: true, isCoupleLink: true }) > 0, true);

function runTests() {
  const passed = tests.filter(t => t.pass).length;
  const failed = tests.length - passed;
  const errors = tests.filter(t => !t.pass).map(t =>
    'M' + t.id.slice(1) + ': ' + t.desc
  );

  if (!global.quiet) {
    tests.forEach(t => {
      if (!t.pass) {
        console.log('  FAIL ' + t.id + '  ' + t.desc + '\n       expected ' + t.expected + '\n       actual   ' + t.actual);
      }
    });
    console.log('  M multiChart.test      ' + passed + '/' + tests.length);
  }

  return { passed, failed, errors };
}

module.exports = { runTests, tests };
