/*! i18n/es.ts
 * Spanish (Español) locale catalog - PARTIAL TRANSLATION
 * allowPartial: true until violation count reaches zero
 * Placeholder parity is enforced: missing {placeholder} fails validation
 * Translator: track missingKeys in registerLocale output for work queue
 */

import { LocaleCatalog } from './index';

const ES: LocaleCatalog = {
  locale: 'es',
  strings: {
    // ============================================================================
    // TRANSIT: Aspects (Headlines)
    // ============================================================================

    'transit-conjunction': [
      '{planet1} y {planet2} se encuentran a las {time}. La misma frecuencia. Observa el cambio hacia {theme}.',
      'Alerta de fusión: {planet1} {planet2} {time}. Dos energías hablando el mismo idioma hoy.',
      '{planet1} en conjunción con {planet2} {time}. No están discutiendo. Están alineados.'
    ],

    'transit-sextile': [
      '{planet1} sextil a {planet2}, {time}: la diplomacia recibe luz verde. Úsala antes de que tu bandeja arruine tu día.',
      'Un sextil es la suerte mostrándose. {planet1} hacia {planet2}, {time}. {theme} es fácil hoy si lo pides.',
      '{time}: {planet1} y {planet2} son amigos. Esta es la hora para comenzar {theme}.'
    ],

    'transit-trine': [
      'Un regalo llega {time}: {planet1} trino con {planet2}. {theme} fluye. No lo desperdicies en piloto automático.',
      '{time}, {planet1} y {planet2} están en conversación. El aire es claro para {theme}.',
      'Facilidad rara: {planet1} trino con {planet2}, {time}. Esto es lo que se ve cuando los planetas están a tu favor.'
    ],

    // ============================================================================
    // SYNASTRY: Aspects (Headlines)
    // ============================================================================

    'synastry-conjunction': [
      '{planet1} y su {planet2} se encuentran hoy. La misma frecuencia entre ustedes.',
      'Una fusión: tu {planet1} en conjunción con su {planet2}, {name}. Dos energías alineadas.',
      'Tu {planet1} encuentra su {planet2} hoy. Están hablando el mismo idioma.'
    ],

    'synastry-trine': [
      'Un regalo entre ustedes: tu {planet1} trino con su {planet2}, {name}. Fluye.',
      'Tu {planet1} y su {planet2} están en conversación. El aire es claro.',
      'Facilidad rara entre ustedes hoy: tu {planet1} trino con su {planet2}. Úsalo.'
    ],

    // ============================================================================
    // EXPLAINERS: Aspects
    // ============================================================================

    'explainer-conjunction': 'Una conjunción es cuando dos planetas ocupan el mismo grado. Están "fusionados". Las energías que estos planetas representan hablan al unísono hoy, amplificadas, urgentes, enfocadas. Las conjunciones son poderosas pero indiferenciadas; el contexto importa enormemente.',

    'explainer-trine': 'Un trino (120°) es armonía. Dos planetas en este ángulo fluyen juntos naturalmente. Los trinos no exigen esfuerzo; recompensan lo que ya está en movimiento. El riesgo: darlos por sentado. Un trino es un regalo, no un pase libre. Úsalo o piérdelo.',

    // ============================================================================
    // UTILITY STRINGS
    // ============================================================================

    'locale-name-en': 'English',
    'locale-name-es': 'Español'

    // NOTE: Missing translations (work queue):
    // - transit-square
    // - transit-opposite
    // - synastry-square
    // - explainer-sextile
    // - explainer-opposite
    // - practical-conjunction
    // - practical-trine
    // - skywire-header
    // - skywire-footer
  },
  metadata: {
    allowPartial: true,  // Flip to false once all violations are empty
    missingKeys: [],
    violations: []  // Will be populated by registerLocale
  }
};

export default ES;
