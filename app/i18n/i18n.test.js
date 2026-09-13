/*! i18n.test.js: 13 assertions for localization
 * Tests locale switching, translation, placeholder, variants, tone validation
 */

const I18N = require('./index.js');

const tests = [];

function assert(id, desc, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  tests.push({ id: 'L' + id, desc, pass, actual: JSON.stringify(actual), expected: JSON.stringify(expected) });
}

// L1-L13 tests
assert(1, 'setLocale en works',
  (() => { I18N.setLocale('en'); return I18N.getLocale(); })(), 'en');

assert(2, 'setLocale es works',
  (() => { I18N.setLocale('es'); return I18N.getLocale(); })(), 'es');

assert(3, 'translation lookup finds key',
  (() => {
    I18N.setLocale('en');
    const result = I18N.t('transit-conjunction');
    return result !== 'transit-conjunction' && result.length > 10;
  })(), true);

assert(4, 'placeholder replacement works',
  I18N.fillPlaceholders('Hello {name}', { name: 'Alice' }), 'Hello Alice');

assert(5, 'pickVariant selects indexed variant',
  (() => {
    I18N.setLocale('en');
    const v0 = I18N.pickVariant('transit-conjunction', 0);
    const v1 = I18N.pickVariant('transit-conjunction', 1);
    return v0 !== v1 && v0.length > 0 && v1.length > 0;
  })(), true);

assert(6, 'variant index bounds check',
  (() => {
    I18N.setLocale('en');
    const v99 = I18N.pickVariant('transit-conjunction', 99);
    return v99 && v99.length > 0;
  })(), true);

assert(7, 'locale switching preserves content',
  (() => {
    I18N.setLocale('en');
    const en = I18N.t('locale-name-en');
    I18N.setLocale('es');
    const es = I18N.t('locale-name-es');
    return en.length > 0 && es.length > 0;
  })(), true);

assert(8, 'availableLocales includes en and es',
  (() => {
    const locales = I18N.availableLocales();
    return locales.indexOf('en') !== -1 && locales.indexOf('es') !== -1;
  })(), true);

assert(9, 'placeholder filling is non-destructive',
  (() => {
    const template = 'Hello {name}';
    const filled = I18N.fillPlaceholders(template, { name: 'Bob' });
    return filled === 'Hello Bob' && template === 'Hello {name}';
  })(), true);

assert(10, 'missing placeholders are left intact',
  (() => {
    const filled = I18N.fillPlaceholders('Hello {name}', {});
    return filled === 'Hello {name}';
  })(), true);

assert(11, 'multiple placeholders in one template',
  I18N.fillPlaceholders('{a} and {b}', { a: 'X', b: 'Y' }), 'X and Y');

assert(12, 'locale-specific content differs',
  (() => {
    I18N.setLocale('en');
    const enText = I18N.t('transit-conjunction');
    I18N.setLocale('es');
    const esText = I18N.t('transit-conjunction');
    return enText !== esText && esText.includes('y') || esText.includes('á');
  })(), true);

assert(13, 'all variants for one key translate correctly',
  (() => {
    I18N.setLocale('en');
    let allValid = true;
    for (let i = 0; i < 3; i++) {
      const v = I18N.pickVariant('transit-trine', i);
      if (!v || v.length < 10) allValid = false;
    }
    return allValid;
  })(), true);

function runTests() {
  const passed = tests.filter(t => t.pass).length;
  const failed = tests.length - passed;
  const errors = tests.filter(t => !t.pass).map(t =>
    'L' + t.id.slice(1) + ': ' + t.desc
  );

  if (!global.quiet) {
    tests.forEach(t => {
      if (!t.pass) {
        console.log('  FAIL ' + t.id + '  ' + t.desc + '\n       expected ' + t.expected + '\n       actual   ' + t.actual);
      }
    });
    console.log('  L i18n.test            ' + passed + '/' + tests.length);
  }

  return { passed, failed, errors };
}

module.exports = { runTests, tests };
