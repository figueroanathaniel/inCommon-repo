/*! forecast/news/multiChart.test.js
 * 15 assertions for the synastry item builder. No storage API: this module
 * runs in node without localStorage. Focus: ceiling enforcement,
 * couple-link bonus, share text validation.
 */

const {
  buildSynastryItem,
  buildSynastryItems,
  validateSynastryCeiling,
  validateShareText,
  verifyCoupleLink
} = require('./multiChart');
const { IMPORTANCE_CEILING } = require('../newsEngine');

const mockPartner = {
  id: 'partner-lucia-1',
  name: 'Lucia',
  birthDate: new Date('1995-06-15'),
  birthTime: '14:30',
  birthPlace: 'Brooklyn, NY',
  planets: { Sun: 84.5, Moon: 167.3, Venus: 65.2 },
  points: { ASC: 120.0, MC: 210.0 }
};

const mockContact = {
  movingPlanet: 'Venus',
  aspect: 'trine',
  partnerPlanet: 'Moon',
  orb: 0.3,
  isExact: true,
  yourLongitude: 65.2,
  theirLongitude: 67.5
};

function test_A1_basicItemCreation() {
  const item = buildSynastryItem({ contact: mockContact, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  if (!item.headline.includes('Venus') || !item.headline.includes('Lucia')) throw new Error('A1: Headline missing planet or partner name');
  if (item.category !== 'transit') throw new Error('A1: Synastry item category should be "transit"');
  if (item.synastry !== true) throw new Error('A1: synastry flag should be true');
}

function test_A2_ceilingEnforcement() {
  const item = buildSynastryItem({
    contact: Object.assign({}, mockContact, { isExact: true }),
    partner: mockPartner, isPersonalTouch: true, hasNatalTouch: true, isRare: true, date: new Date()
  });
  if (item.importance > IMPORTANCE_CEILING) throw new Error('A2: Synastry importance (' + item.importance + ') exceeded ceiling (' + IMPORTANCE_CEILING + ')');
  if (!validateSynastryCeiling(item)) throw new Error('A2: validateSynastryCeiling failed for valid item');
}

function test_A3_ceilingValue() {
  if (IMPORTANCE_CEILING !== 68) throw new Error('A3: Ceiling should be 68, got ' + IMPORTANCE_CEILING);
}

function test_A4_coupleLinkBonus() {
  const contactWithLink = Object.assign({}, mockContact, { isCoupleLink: true });
  const item = buildSynastryItem({ contact: contactWithLink, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  if (item.importance > 80) throw new Error('A4: Couple-link item (' + item.importance + ') should not reach notify threshold');
  if (item.importance < 50) throw new Error('A4: Couple-link item importance too low: ' + item.importance);
}

function test_A5_coupleLinkDetection() {
  const yourLng = 65.2, theirLng = 65.8; // 0.6 degrees apart
  if (!verifyCoupleLink(yourLng, theirLng, 1.0)) throw new Error('A5: verifyCoupleLink should detect 0.6 degree contact');
  const farLng = 75.0; // 10 degrees apart
  if (verifyCoupleLink(yourLng, farLng, 1.0)) throw new Error('A5: verifyCoupleLink should reject 10 degree contact');
}

function test_A6_shareTextNoLongitudes() {
  const shareText = 'Venus trine their Moon, Lucia. 2026-09-13.';
  if (!validateShareText(shareText, mockContact)) throw new Error('A6: Clean share text should pass validation');
  const badShareText = 'Your Venus at 65.2° trine their Moon at 67.5°';
  if (validateShareText(badShareText, mockContact)) throw new Error('A6: Share text with longitudes should fail validation');
}

function test_A7_shareTextNoOrbs() {
  const cleanText = 'Venus trine their Moon today.';
  if (!validateShareText(cleanText, mockContact)) throw new Error('A7: Clean text should pass');
  const orbText = 'Venus trine their Moon within ' + mockContact.orb + '°';
  if (validateShareText(orbText, mockContact)) throw new Error('A7: Text with orb should fail');
}

function test_A8_shareTextNoBirthData() {
  const cleanText = 'Venus trine their Moon. Today you understand each other.';
  if (!validateShareText(cleanText, mockContact)) throw new Error('A8: Clean share text should pass');
  const birthYear = '1995-06-15';
  const badText = 'Venus trine their Moon. Born ' + birthYear + ', they...';
  if (validateShareText(badText, mockContact)) throw new Error('A8: Share text with birth data should fail');
}

function test_A9_partnerDataRequired() {
  const item = buildSynastryItem({ contact: mockContact, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  if (!item.partner) throw new Error('A9: Item missing partner object');
  if (item.partner.id !== mockPartner.id) throw new Error('A9: Partner id mismatch');
  if (item.partner.name !== mockPartner.name) throw new Error('A9: Partner name mismatch');
}

function test_A10_categoryStaysTransit() {
  const item = buildSynastryItem({ contact: mockContact, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  if (item.category !== 'transit') throw new Error('A10: Category should be "transit", got "' + item.category + '"');
  const itemWithLink = buildSynastryItem({ contact: Object.assign({}, mockContact, { isCoupleLink: true }), partner: mockPartner, isPersonalTouch: true, date: new Date() });
  if (itemWithLink.category !== 'transit') throw new Error('A10: Synastry item category should always be transit');
}

function test_A11_batchRespectsCeiling() {
  const contacts = [
    mockContact,
    Object.assign({}, mockContact, { aspect: 'conjunction', isCoupleLink: true }),
    Object.assign({}, mockContact, { aspect: 'square', orb: 0.1, isExact: true })
  ];
  const items = buildSynastryItems(contacts, mockPartner);
  for (const item of items) {
    if (!validateSynastryCeiling(item)) throw new Error('A11: Item ' + item.id + ' exceeded ceiling');
  }
}

function test_A12_noStorageApi() {
  // If the module had touched localStorage on require, we would not have gotten here.
  const item = buildSynastryItem({ contact: mockContact, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  if (!item.id) throw new Error('A12: Item should have valid id');
}

function test_A13_exactAspectDetection() {
  const exactContact = Object.assign({}, mockContact, { orb: 0.3, isExact: true });
  const item = buildSynastryItem({ contact: exactContact, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  if (item.importance < 50) throw new Error('A13: Exact contact should score higher: ' + item.importance);

  const inexactContact = Object.assign({}, mockContact, { orb: 2.0, isExact: false });
  const itemInexact = buildSynastryItem({ contact: inexactContact, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  if (itemInexact.importance > item.importance) throw new Error('A13: Inexact contact should score lower than exact');
}

function test_A14_partnerIdInKeywords() {
  const item = buildSynastryItem({ contact: mockContact, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  if (!item.keywords.includes(mockPartner.id)) throw new Error('A14: Partner id "' + mockPartner.id + '" should be in keywords');
}

function test_A15_bodyStructure() {
  const item = buildSynastryItem({ contact: mockContact, partner: mockPartner, isPersonalTouch: false, date: new Date() });
  const body = item.body;
  if (!body.includes(mockContact.aspect)) throw new Error('A15: Body missing aspect type');
  if (!body.includes('charts') && !body.includes('weather')) throw new Error('A15: Body missing weather/pair phrasing');
  const paragraphs = body.split('\n\n').filter(p => p.trim());
  if (paragraphs.length < 2) throw new Error('A15: Body should have multiple parts');
}

const tests = [
  test_A1_basicItemCreation,
  test_A2_ceilingEnforcement,
  test_A3_ceilingValue,
  test_A4_coupleLinkBonus,
  test_A5_coupleLinkDetection,
  test_A6_shareTextNoLongitudes,
  test_A7_shareTextNoOrbs,
  test_A8_shareTextNoBirthData,
  test_A9_partnerDataRequired,
  test_A10_categoryStaysTransit,
  test_A11_batchRespectsCeiling,
  test_A12_noStorageApi,
  test_A13_exactAspectDetection,
  test_A14_partnerIdInKeywords,
  test_A15_bodyStructure
];

function runTests() {
  let passed = 0, failed = 0;
  const errors = [], results = [];

  tests.forEach((test, i) => {
    const id = 'M' + (i + 1);
    try {
      test();
      passed++;
      results.push({ id, name: test.name, pass: true });
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      results.push({ id, name: test.name, pass: false, error: msg });
    }
  });

  return { passed, failed, errors, results };
}

module.exports = { tests, runTests };
