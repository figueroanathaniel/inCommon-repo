/*! newsEngine.js: core news types and importance scoring
 * Centralized importance calculation with category-specific ceilings
 */

const TIER_1_BASE = 50;
const BONUS_EXACTNESS = 10;
const BONUS_PERSONAL = 8;
const BONUS_RARE = 5;
const BONUS_COUPLE_LINK = 10;
const BONUS_NATAL_TOUCH = 5;

const SYNASTRY_CEILING = 68;
const SKY_WIRE_CEILING = 93;
const PERSONAL_CEILING = 98;

function calculateImportance(options) {
  let score = TIER_1_BASE;

  if (options.isExact) {
    score += BONUS_EXACTNESS;
  }

  if (options.isPersonal) {
    score += BONUS_PERSONAL;
  }

  if (options.isRare) {
    score += BONUS_RARE;
  }

  if (options.isCoupleLink) {
    score += BONUS_COUPLE_LINK;
  }

  if (options.hasNatalTouch) {
    score += BONUS_NATAL_TOUCH;
  }

  return score;
}

function verifySynastryCeiling(importance) {
  return Math.min(importance, SYNASTRY_CEILING);
}

function verifySkyWireCeiling(importance) {
  return Math.min(importance, SKY_WIRE_CEILING);
}

function verifyPersonalCeiling(importance) {
  return Math.min(importance, PERSONAL_CEILING);
}

function generateNewsId(type, body, aspect) {
  return [type, body, aspect]
    .filter(Boolean)
    .join('-')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

module.exports = {
  TIER_1_BASE,
  BONUS_EXACTNESS,
  BONUS_PERSONAL,
  BONUS_RARE,
  BONUS_COUPLE_LINK,
  BONUS_NATAL_TOUCH,
  SYNASTRY_CEILING,
  SKY_WIRE_CEILING,
  PERSONAL_CEILING,
  calculateImportance,
  verifySynastryCeiling,
  verifySkyWireCeiling,
  verifyPersonalCeiling,
  generateNewsId
};
