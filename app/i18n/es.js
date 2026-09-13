/*! i18n/es.js
 * Spanish locale catalog for inCommon forecast system
 */

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

module.exports = ES;
