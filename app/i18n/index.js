/*! i18n/index.js
 * Localization runtime: locale switching, catalog loading, placeholder replacement
 * Never concatenates fragments; only fills placeholders in complete sentences
 */

let activeLocale = 'en';
let activeCatalog = null;

const EN = {
  locale: 'en',
  strings: {
    'transit-conjunction': [
      '{planet1} and {planet2} meet at {time}. Same frequency. Watch for {theme}.',
      'Merger alert: {planet1} {planet2} {time}. Two energies speaking the same language today.',
      '{planet1} conjunct {planet2} {time}. They\'re not arguing. They\'re aligned.'
    ],
    'transit-trine': [
      'A gift lands {time}: {planet1} trine {planet2}. {theme} flows. Don\'t waste it on autopilot.',
      '{time}, {planet1} and {planet2} are in conversation. The air is clear for {theme}.',
      'Rare ease: {planet1} trine {planet2}, {time}. This is what favor looks like.'
    ],
    'synastry-conjunction': [
      '{planet1} and their {planet2} meet today. Same frequency between you.',
      'A merger: your {planet1} conjunct their {planet2}, {name}. Two energies aligned.',
      'Your {planet1} finds their {planet2} today. You\'re speaking the same language.'
    ],
    'synastry-trine': [
      'A gift between you: your {planet1} trine their {planet2}, {name}. It flows.',
      'Your {planet1} and their {planet2} are in conversation. The air is clear.',
      'Rare ease between you today: your {planet1} trine their {planet2}. Use it.'
    ],
    'locale-name-en': 'English'
  },
  metadata: { allowPartial: false, missingKeys: [], violations: [] }
};

const ES = {
  locale: 'es',
  strings: {
    'transit-conjunction': [
      '{planet1} y {planet2} se encuentran a las {time}. La misma frecuencia.',
      'Alerta de fusión: {planet1} {planet2} {time}. Dos energías hablando el mismo idioma hoy.',
      '{planet1} en conjunción con {planet2} {time}. No están discutiendo. Están alineados.'
    ],
    'transit-trine': [
      'Un regalo llega {time}: {planet1} trino con {planet2}. {theme} fluye.',
      '{time}, {planet1} y {planet2} están en conversación. El aire es claro para {theme}.',
      'Facilidad rara: {planet1} trino con {planet2}, {time}.'
    ],
    'synastry-conjunction': [
      '{planet1} y su {planet2} se encuentran hoy. La misma frecuencia entre ustedes.',
      'Una fusión: tu {planet1} en conjunción con su {planet2}, {name}.',
      'Tu {planet1} encuentra su {planet2} hoy. Están hablando el mismo idioma.'
    ],
    'synastry-trine': [
      'Un regalo entre ustedes: tu {planet1} trino con su {planet2}, {name}.',
      'Tu {planet1} y su {planet2} están en conversación. El aire es claro.',
      'Facilidad rara entre ustedes hoy: tu {planet1} trino con su {planet2}.'
    ],
    'locale-name-es': 'Español'
  },
  metadata: { allowPartial: true, missingKeys: [], violations: [] }
};

function setLocale(locale) {
  if (locale === 'en') {
    activeLocale = 'en';
    activeCatalog = EN;
  } else if (locale === 'es') {
    activeLocale = 'es';
    activeCatalog = ES;
  } else {
    throw new Error('Unknown locale: ' + locale);
  }
}

function getLocale() {
  return activeLocale;
}

function fillPlaceholders(template, placeholders) {
  if (!placeholders || Object.keys(placeholders).length === 0) {
    return template;
  }
  let result = template;
  for (const key in placeholders) {
    const placeholder = '{' + key + '}';
    result = result.split(placeholder).join(String(placeholders[key]));
  }
  return result;
}

function t(key, placeholders) {
  if (!activeCatalog) {
    setLocale('en');
  }
  const entry = activeCatalog.strings[key];
  if (!entry) {
    console.warn('Missing translation key: ' + key);
    return key;
  }
  if (Array.isArray(entry)) {
    return fillPlaceholders(entry[0], placeholders);
  }
  return fillPlaceholders(entry, placeholders);
}

function pickVariant(key, variantIndex, placeholders) {
  if (!activeCatalog) {
    setLocale('en');
  }
  const entry = activeCatalog.strings[key];
  if (!entry) {
    console.warn('Missing translation key: ' + key);
    return key;
  }
  if (Array.isArray(entry)) {
    const idx = Math.max(0, Math.min(variantIndex, entry.length - 1));
    return fillPlaceholders(entry[idx], placeholders);
  }
  return fillPlaceholders(entry, placeholders);
}

function availableLocales() {
  return ['en', 'es'];
}

// Initialize
setLocale('en');

module.exports = {
  setLocale,
  getLocale,
  t,
  pickVariant,
  fillPlaceholders,
  availableLocales
};
