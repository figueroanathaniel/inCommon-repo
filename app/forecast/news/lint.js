/*! lint.ts: validation for dashes and data leakage
 * Checks for em/en dashes and reader-possessive language
 */

const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);

const PUBLIC_FORBIDDEN = [
  'your chart', 'your sky', 'your birth', 'your natal',
  'in your ', 'what it means for you', 'how this affects you',
  'your personal', 'for you today', 'your reading', 'your journey', 'your destiny'
];

function hasDash(text) {
  if (!text) return false;
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) return true;
  if (text.includes('&mdash;') || text.includes('&ndash;')) return true;
  if (text.includes('&#8212;') || text.includes('&#8211;')) return true;
  if (text.includes('&#x2014;') || text.includes('&#x2013;')) return true;
  return false;
}

function lintHeadline(text) {
  if (hasDash(text)) {
    return { valid: false, error: 'Contains em or en dash' };
  }
  return { valid: true };
}

function lintBody(text) {
  if (hasDash(text)) {
    return { valid: false, error: 'Contains em or en dash' };
  }
  return { valid: true };
}

function lintShareText(text) {
  if (hasDash(text)) {
    return { valid: false, error: 'Contains em or en dash' };
  }
  if (/longitude|orb|degree|coordinate/i.test(text)) {
    return { valid: false, error: 'Contains birth data' };
  }
  return { valid: true };
}

function publicLintFeed(items) {
  const violations = [];
  items.forEach(item => {
    if (item.headline && PUBLIC_FORBIDDEN.some(phrase =>
        item.headline.toLowerCase().includes(phrase))) {
      violations.push({ id: item.id, issue: 'reader-possessive in headline' });
    }
    if (item.body && PUBLIC_FORBIDDEN.some(phrase =>
        item.body.toLowerCase().includes(phrase))) {
      violations.push({ id: item.id, issue: 'reader-possessive in body' });
    }
  });
  return violations;
}

function sanitizeForPublic(text) {
  let result = text;
  PUBLIC_FORBIDDEN.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi');
    result = result.replace(regex, '[removed]');
  });
  return result;
}

module.exports = {
  EM_DASH,
  EN_DASH,
  PUBLIC_FORBIDDEN,
  hasDash,
  lintHeadline,
  lintBody,
  lintShareText,
  publicLintFeed,
  sanitizeForPublic
};
