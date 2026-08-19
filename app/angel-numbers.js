/* angel-numbers.js. Meanings for repeated number sightings, plus the journalling
   prompt the Spirit tab writes into a journal entry. V1.0.0

   COVERAGE: every integer from 1 to 999 resolves to a meaning. Numbers the
   tradition treats as specific (single digits, every doubled and tripled
   sequence, and the common ascending and mirrored patterns) are written out.
   Anything else is composed from its digits and its reduced root, which is how
   the practice itself reads an unlisted number rather than inventing a new
   scripture for it. Composed readings say so, so the user can tell the
   difference between a tradition's claim and an assembled one.

   Epistemic tags: the meaning is [TRADITIONAL], the psychological framing is
   [POSSIBILITY], and neither is a statement about the person. No em dashes. */
(function () {
  'use strict';

  var DIGIT = {
    0: { key: 'wholeness', short: 'wholeness, potential, the open circle',
      line: 'Zero is the open circle: potential before form, and a reminder that the cycle has no fixed start.' },
    1: { key: 'beginning', short: 'new beginnings, initiative, the power of attention',
      line: 'One is the first step and the reminder that attention builds: what you keep thinking about tends to be what you walk toward.' },
    2: { key: 'balance', short: 'balance, partnership, trust in timing',
      line: 'Two is balance and partnership. It counsels patience and trust in a process that is not finished yet.' },
    3: { key: 'expression', short: 'expression, growth, guidance nearby',
      line: 'Three is creative expression and encouragement. The tradition reads it as a sign that help and inspiration are at hand.' },
    4: { key: 'foundation', short: 'foundation, protection, steady work',
      line: 'Four is foundation and protection. It counsels the practical step and the built structure.' },
    5: { key: 'change', short: 'change, freedom, release of the old',
      line: 'Five is change. It reads as a signal that something is being cleared to make room, whether or not you chose the timing.' },
    6: { key: 'care', short: 'care, home, the balance of giving',
      line: 'Six is care and domestic balance. It asks about the ratio between what you give and what you keep.' },
    7: { key: 'insight', short: 'insight, alignment, the inner path',
      line: 'Seven is insight and confirmation. It reads as a sign that an inward direction is the right one.' },
    8: { key: 'abundance', short: 'abundance, consequence, cycles returning',
      line: 'Eight is consequence and material flow: what circulates comes back, and the ledger tends to balance.' },
    9: { key: 'completion', short: 'completion, service, letting go',
      line: 'Nine is completion. It reads as an ending that is making room, and a call toward something larger than the self.' }
  };

  /* Written entries. Everything else composes from DIGIT above. */
  var MEANINGS = {
    1: 'New beginnings and the power of attention. What you keep thinking about is being pointed at.',
    2: 'Balance and partnership. Trust the process; the second half has not arrived yet.',
    3: 'Creative expression and encouragement. Guidance is described as nearby.',
    4: 'Foundation and protection. Build the practical thing.',
    5: 'Change arriving. Something is being cleared.',
    6: 'Care, home, and the ratio of giving to keeping.',
    7: 'Insight and alignment. The inward direction is being confirmed.',
    8: 'Abundance and consequence. Cycles return what they were given.',
    9: 'Completion and service. An ending making room.',
    11: 'An awakening number. Heightened intuition, and a doorway described as opening.',
    22: 'The master builder. Vision asked to take material form.',
    33: 'The master teacher. Compassion asked to become instruction.',
    44: 'Foundation reinforced. Support described as present while you build.',
    55: 'Major change underway. Release rather than resist.',
    66: 'Care out of balance. Attention called back to home and to yourself.',
    77: 'Confirmation on the inner path. Study, insight, and quiet progress.',
    88: 'Material cycles closing and reopening. Consequence arriving.',
    99: 'A chapter completing at scale. Service and release together.',
    100: 'A beginning held in wholeness. One step, taken with the whole picture in view.',
    111: 'New beginnings, manifestation, and attention to your thoughts. The classic doorway number.',
    222: 'Balance, partnership, and trust in the process. Keep going; it is taking form.',
    333: 'Creative expression and guidance. The tradition names ascended masters and encouragement.',
    444: 'Protection and foundation. Angels described as present while the ground is laid.',
    555: 'Major change and transformation. Release the old arrangement.',
    666: 'Rebalance. Attention has gone too far toward the material or the caretaking; recentre.',
    777: 'Alignment and good fortune on the inner path. Confirmation of a spiritual direction.',
    888: 'Abundance and closure of a material cycle. Infinity turned on its side.',
    999: 'Completion of a long chapter, and the call toward wider service.',
    123: 'Sequence and simplification. One step, then the next; nothing needs to be solved at once.',
    234: 'Steady progression. The build is in order.',
    321: 'A countdown. Something is completing rather than beginning.',
    345: 'Motion through structure. Change inside a working plan.',
    456: 'Foundation, change, and care in sequence. A practical transition.',
    567: 'Change resolving into insight.',
    678: 'Care, insight, and material return in sequence.',
    789: 'The last stretch of a cycle, moving toward completion.',
    808: 'Abundance with a pause in the middle. Flow interrupted rather than ended.',
    818: 'Personal power in material matters. A beginning inside an eight cycle.',
    828: 'Partnership and abundance together. A shared material step.',
    911: 'Completion and immediate beginning. A door closing while another opens.',
    919: 'Endings around a new start. Leadership after release.',
    1010: 'Wholeness and beginning together. A reset with the full circle in view.',
    1111: 'The most cited sighting: a doorway, alignment of attention, and a moment named as significant.',
    1122: 'Intuition asked to build. Eleven with the master builder behind it.',
    1133: 'Insight asked to teach.',
    1144: 'Intuition supported by structure.',
    1155: 'Awakening and change together.',
    1212: 'A rhythm of beginnings and balance. Faith in a sequence already underway.',
    1221: 'Mirrored beginnings. What you started is reflecting back.',
    1234: 'Simple forward order. Take the next step only.',
    1313: 'Expression repeating. Say the thing, then say it again.',
    1414: 'Foundation repeating. The structure is holding.',
    1515: 'Change repeating. The shift is not a one-off.',
    1616: 'Care repeating. Home and balance keep asking.',
    1717: 'Insight repeating. The inner reading is being confirmed twice.',
    1818: 'Material cycles repeating. Consequence arriving in sequence.',
    1919: 'Completion repeating. Two endings in one season.',
    2020: 'Balance and wholeness. A partnership seen whole.',
    2121: 'Balance and beginning, mirrored.',
    2222: 'Balance at scale. Trust and alignment described as strong.',
    3333: 'Expression and guidance at scale.',
    4444: 'Foundation and protection at scale.',
    5555: 'Change at scale. A whole arrangement clearing.'
  };

  /* Psychological framings, keyed by the reduced root so the same person does not
     read the same sentence every time. Always [POSSIBILITY], never a diagnosis. */
  var FRAMES = {
    1: 'You may be noticing this number because something in you has already decided to begin, and your attention is finding evidence for it.',
    2: 'You may be noticing this number because you are waiting on someone or something, and the waiting has become the loudest thing in the day.',
    3: 'You may be noticing this number because there is something you want to say or make, and it has not found its outlet yet.',
    4: 'You may be noticing this number because you are looking for solid ground, and your attention is tuned to signals of stability.',
    5: 'You may be noticing this number because change is already in motion and part of you is scanning for confirmation that it is allowed.',
    6: 'You may be noticing this number because care and obligation are on your mind, and your attention is sorting what is yours to hold.',
    7: 'You may be noticing this number because you are asking an inward question, and the number is a punctuation mark rather than an answer.',
    8: 'You may be noticing this number because something material is unresolved, and your attention is running the ledger in the background.',
    9: 'You may be noticing this number because something is ending, and part of you has known that for a while.'
  };

  var AN = {
    VERSION: '1.0.0',
    digits: DIGIT, meanings: MEANINGS,
    reduce: function (n) { n = Math.abs(+n || 0); while (n > 9) n = String(n).split('').reduce(function (s, c) { return s + +c; }, 0); return n; },
    parse: function (raw) {
      var s = String(raw == null ? '' : raw).replace(/[^0-9]/g, '');
      if (!s) return null;
      s = s.slice(0, 6);
      var n = parseInt(s, 10);
      return isNaN(n) || n === 0 ? null : n;
    },
    isRepeated: function (n) { var s = String(n); return s.length > 1 && /^(\d)\1+$/.test(s); },

    /* lookup -> { number, listed, traditional, composed, reduced, rootLine,
                   possibility, digits: [{d, short}] }                         */
    lookup: function (raw) {
      var n = AN.parse(raw);
      if (n == null) return null;
      var listed = Object.prototype.hasOwnProperty.call(MEANINGS, n);
      var s = String(n), reduced = AN.reduce(n), root = DIGIT[reduced];
      var parts = s.split('').map(function (c) { return { d: +c, short: DIGIT[+c].short }; });
      var composed = '';
      if (!listed) {
        var seen = {}, uniq = [];
        parts.forEach(function (p) { if (!seen[p.d]) { seen[p.d] = 1; uniq.push(p); } });
        composed = 'The number ' + n + ' is not one of the sequences the tradition names directly, so it is read from its parts: ' +
          uniq.map(function (p) { return p.d + ' for ' + p.short; }).join(', ') +
          '. Those digits reduce to ' + reduced + ', which carries ' + root.short + '.';
      }
      return {
        number: n, listed: listed, reduced: reduced,
        traditional: listed ? MEANINGS[n] : composed,
        composed: !listed,
        rootLine: root.line,
        repeated: AN.isRepeated(n),
        digits: parts,
        possibility: FRAMES[reduced] || FRAMES[1]
      };
    },

    /* The journal entry text, pre-populated for the user to edit. */
    journalPrompt: function (n, meaningText, whenLabel) {
      return 'I noticed ' + n + ' at ' + (whenLabel || 'some point today') + '. The traditional meaning is: ' +
        String(meaningText || '').replace(/\s+$/, '') +
        '\n\nWhat was I thinking about when I saw it?\n\nWhat felt significant?\n\nWhat had happened in the hour before?';
    },
    journalTitle: function (n) { return 'Angel number ' + n; },
    TAG: 'angel_number'
  };

  window.AngelNumbers = AN;
})();
