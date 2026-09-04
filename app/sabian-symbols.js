/* sabian-symbols.js: 360-degree zodiac degree table for inCommon. V1.0.0

   HONESTY NOTE (read before shipping):
   The Sabian symbols are the 360 degree images received by Elsie Wheeler and
   recorded by Marc Edmund Jones in San Diego, 1925. This module ships the full
   360-row TABLE: degree, sign, degree-in-sign, address, and a derived phase
   keyword, but the `symbol` field is null for every row, because the app does
   not carry the authentic symbol phrasing yet. Nothing here invents a symbol.

   The derived `keyword` is NOT Sabian material: it is computed from the sign and
   the 6-degree phase within it, and the UI tags it [DERIVED] so no user mistakes
   it for the tradition's own words.

   To load the real list (a 1925 publication; verify your source's rights):
       SabianSymbols.load([{ degree: 0, symbol: '…' }, … 360 rows …]);
   or  SabianSymbols.load(['symbol for Aries 1', 'symbol for Aries 2', … ]);
   After load(), verified === true and every surface shows the tradition's text
   with a [TRADITIONAL] tag instead of [DERIVED].                              */
(function () {
  'use strict';
  var SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  /* Five 6-degree phases per sign. Each sign moves from its raw first impulse
     through to what it hands on to the next sign, the classic unfolding read of
     a sign's arc, written plainly. */
  var PHASES = {
    Aries: ['the first move, made before it is ready', 'raw force finding a direction', 'the self tested against resistance', 'courage that learns restraint', 'initiative handed to something larger'],
    Taurus: ['taking root in what can be touched', 'value discovered by keeping still', 'the body as its own authority', 'abundance that asks to be shared', 'form settled enough to be trusted'],
    Gemini: ['two things noticed at once', 'the question that opens more questions', 'language catching up to experience', 'connection made by carrying word between', 'knowledge ready to be spent'],
    Cancer: ['the shelter built from feeling', 'memory as a form of loyalty', 'care that risks its own softness', 'the home extended past blood', 'holding without holding on'],
    Leo: ['warmth that wants to be seen', 'play as a serious act', 'the heart claiming its own worth', 'authority earned rather than taken', 'light spent on other people'],
    Virgo: ['attention paid to the small part', 'skill built by repetition', 'the flaw named without cruelty', 'service that does not announce itself', 'usefulness offered up whole'],
    Libra: ['the other person, finally in view', 'weight measured against weight', 'agreement that costs something', 'grace under a real disagreement', 'balance held for the sake of both'],
    Scorpio: ['what was buried surfacing', 'desire that will not be managed', 'the ending accepted as an ending', 'power used instead of hoarded', 'renewal on the far side of loss'],
    Sagittarius: ['the horizon becoming visible', 'the journey undertaken on belief', 'meaning gathered from far away', 'teaching what the road taught', 'faith wide enough to hold doubt'],
    Capricorn: ['the climb begun in cold weather', 'structure raised stone by stone', 'responsibility carried in public', 'mastery that no longer needs proof', 'legacy set down for others to use'],
    Aquarius: ['the pattern seen from outside', 'difference insisted upon', 'the group discovered as a body', 'invention offered to strangers', 'the future admitted into the present'],
    Pisces: ['the edges going soft', 'sorrow met without a story', 'compassion with no audience', 'surrender that is not defeat', 'the whole cycle dissolving to begin again']
  };

  var TABLE = [];
  for (var d = 0; d < 360; d++) {
    var si = Math.floor(d / 30), dis = d % 30, sign = SIGNS[si];
    TABLE.push({
      degree: d, sign: sign, degreeInSign: dis,
      address: sign + ' ' + (dis + 1) + '\u00b0',
      symbol: null,
      keyword: PHASES[sign][Math.min(4, Math.floor(dis / 6))],
      verified: false
    });
  }

  var S = {
    VERSION: '1.0.0',
    SOURCE: 'degree-table-only \u00b7 authentic symbol text not loaded',
    verified: false,
    SIGNS: SIGNS,
    TABLE: TABLE,
    at: function (lon) {
      var l = ((Number(lon) % 360) + 360) % 360;
      return TABLE[Math.floor(l)];
    },
    forSign: function (sign) { return TABLE.filter(function (r) { return r.sign === sign; }); },
    /* Accepts 360 strings, or 360 objects with { degree, symbol, keyword? }. */
    load: function (list) {
      if (!Array.isArray(list) || list.length !== 360) throw new Error('SabianSymbols.load expects exactly 360 entries');
      list.forEach(function (item, i) {
        var row = typeof item === 'string' ? { degree: i, symbol: item } : item;
        var target = TABLE[((Number(row.degree) % 360) + 360) % 360];
        target.symbol = String(row.symbol || '') || null;
        if (row.keyword) target.keyword = row.keyword;
        target.verified = !!target.symbol;
      });
      S.verified = TABLE.every(function (r) { return r.verified; });
      S.SOURCE = S.verified ? 'loaded \u00b7 supplied 360-degree list' : S.SOURCE;
      return S.verified;
    }
  };
  window.SabianSymbols = S;
})();
