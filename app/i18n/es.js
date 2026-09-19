/*! i18n/es.js: Spanish (Español) locale catalog, PARTIAL TRANSLATION (UMD)
 * allowPartial: true until the violation and missing-key counts reach zero.
 * Placeholder parity is enforced: a missing {placeholder} fails validation.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.I18nES = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    locale: 'es',
    strings: {
      // ---- TRANSIT: Aspects (Headlines) ----

      'transit-conjunction': [
        '{body1} y {body2} se encuentran a las {time}. La misma frecuencia. Observa el cambio hacia {theme}.',
        'Alerta de fusión: {body1} {body2} {time}. Dos energías hablando el mismo idioma hoy.',
        '{body1} en conjunción con {body2} {time}. No están discutiendo. Están alineados.'
      ],

      'transit-sextile': [
        '{body1} sextil a {body2}, {time}: la diplomacia recibe luz verde. Úsala antes de que tu bandeja arruine tu día.',
        'Un sextil es la suerte mostrándose. {body1} hacia {body2}, {time}. {theme} es fácil hoy si lo pides.',
        '{time}: {body1} y {body2} son amigos. Esta es la hora para comenzar {theme}.'
      ],

      'transit-trine': [
        'Un regalo llega {time}: {body1} trino con {body2}. {theme} fluye. No lo desperdicies en piloto automático.',
        '{time}, {body1} y {body2} están en conversación. El aire es claro para {theme}.',
        'Facilidad rara: {body1} trino con {body2}, {time}. Esto es lo que se ve cuando los cuerpos astrales están a tu favor.'
      ],

      // ---- SYNASTRY: Aspects (Headlines) ----

      'synastry-conjunction': [
        '{body1} y su {body2} se encuentran hoy. La misma frecuencia entre ustedes.',
        'Una fusión: tu {body1} en conjunción con su {body2}, {name}. Dos energías alineadas.',
        'Tu {body1} encuentra su {body2} hoy. Están hablando el mismo idioma.'
      ],

      'synastry-trine': [
        'Un regalo entre ustedes: tu {body1} trino con su {body2}, {name}. Fluye.',
        'Tu {body1} y su {body2} están en conversación. El aire es claro.',
        'Facilidad rara entre ustedes hoy: tu {body1} trino con su {body2}. Úsalo.'
      ],

      // ---- EXPLAINERS: Aspects ----

      'explainer-conjunction': 'Una conjunción es cuando dos cuerpos astrales ocupan el mismo grado. Están "fusionados". Las energías que estos cuerpos astrales representan hablan al unísono hoy, amplificadas, urgentes, enfocadas. Las conjunciones son poderosas pero indiferenciadas; el contexto importa enormemente.',

      'explainer-trine': 'Un trino (120°) es armonía. Dos cuerpos astrales en este ángulo fluyen juntos naturalmente. Los trinos no exigen esfuerzo; recompensan lo que ya está en movimiento. El riesgo: darlos por sentado. Un trino es un regalo, no un pase libre. Úsalo o piérdelo.',

      // ---- UTILITY STRINGS ----

      'locale-name-en': 'English',
      'locale-name-es': 'Español'

      // Missing translations (work queue): transit-square, transit-opposite,
      // synastry-square, explainer-sextile, explainer-opposite,
      // practical-conjunction, practical-trine, skywire-header, skywire-footer
    },
    metadata: {
      allowPartial: true, // Flip to false once all violations and missing keys are empty
      missingKeys: [],
      violations: [] // Populated by registerLocale
    }
  };
}));
