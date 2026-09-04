/*! hd-composite.js: two bodygraphs, overlaid. V1.1.0 (UMD)
 *
 * WHAT IT IS. Given the activated gates of two charts, this classifies each of
 * the thirty six channels into one of six states and returns structured data
 * with no prose in it: the screen decides how much to show and in what order.
 *
 * THE SIX STATES, and why six rather than the four everybody names.
 *
 *   ELECTROMAGNETIC  one gate each, different gates. The channel completes only
 *                    together and neither person holds it alone.
 *   COMPANIONSHIP    both hold the whole channel. Familiarity, and no new
 *                    definition made by the meeting.
 *   DOMINANCE        one holds the whole channel, the other holds neither gate.
 *   COMPROMISE       one holds the whole channel, the other holds one gate of
 *                    it. The single gate person meets the whole channel, but it
 *                    stays defined by the other.
 *   SHARED_GATE      the same single gate, both sides. Not one of the four, and
 *                    reported as resonance rather than quietly dropped.
 *   ABSENT           neither reaches it. Counted, never listed: thirty rows
 *                    saying nothing happened is not a reading.
 *
 * The first version of this file had four buckets and folded DOMINANCE and
 * COMPROMISE together, which threw away the difference between "they hold this
 * and you do not touch it" and "they hold this and you have half of it". It
 * also filed SHARED_GATE under absent, so two people who both carry gate 34 and
 * nothing else were told the channel was out of reach of both, which is true of
 * the channel and false about them.
 *
 * DIRECTION IS NOT OPTIONAL. Dominance and compromise are asymmetric. A row
 * that says a channel is "dominant between you" has described neither person
 * and invited the reader to fill in the blank themselves, usually wrongly.
 * Every such row carries who holds it and who does not, by name.
 *
 * AND THE WORD IS ABOUT A CHANNEL, NEVER ABOUT A PERSON. `caution` is returned
 * on every dominance and compromise row and the screen is required to print it
 * beside the row, not in a tooltip and not in a footnote. Rendered carelessly
 * next to a real relationship this vocabulary can validate a coercive dynamic
 * or manufacture suspicion in a healthy one. Nobody is ever labelled dominant.
 *
 * THERE IS NO SCORE HERE AND THERE WILL NOT BE ONE. No percentage, no rating,
 * no ranking, no best match, and no field that could be turned into one without
 * adding arithmetic that is deliberately absent. Counts are kept because a
 * count is a fact about channels, and it stops being one the moment it is
 * divided by anything.
 *
 * THE CHANNEL TABLE IS NOT DUPLICATED, AND NEITHER IS THE WRITING. The wiring,
 * which gates pair into which channel and which centre each belongs to, comes
 * from hd-topology.js. The names, themes and meanings, and the tradition line
 * and the six possibility questions, are hd-atlas.js's and are assembled by
 * HDAtlas.layers(). This module reads only the first, holds none of the
 * second, and returns structure.
 * Gate names in the Ra tradition are avoided: a gate is its number and the
 * atlas descriptor.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.HDComposite = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.1.0';

  var TYPES = { ELECTROMAGNETIC: 'electromagnetic', COMPANIONSHIP: 'companionship',
    DOMINANCE: 'dominance', COMPROMISE: 'compromise', SHARED_GATE: 'sharedGate', ABSENT: 'absent' };

  /* The sentence that has to be on screen beside every dominance and every
     compromise row. It is returned from here rather than written in the
     template so that it cannot drift between the two shells, and so that a
     screen which forgets it fails a test rather than shipping quietly. */
  var CONFIG_CAUTION = 'This describes how two charts fit together and says nothing about how either person treats the other. It is a shape, not a behaviour, and not a verdict on anybody.';

  var PRIVACY_NOTICE = 'Adding someone else means holding their birth date, and a birth date is theirs rather than yours. ' +
    'It stays on this device, it is never sent anywhere, it is not used to build any picture of them, and one tap removes it. ' +
    'Ask them first where you can.';

  /* Topology, from the mechanics module that owns it. This is what the
     declared crossing into hd-atlas was for, and it is gone. */
  function topoOf(opts) {
    if (opts && opts.topology) return opts.topology;
    if (typeof self !== 'undefined' && self.HDTopology) return self.HDTopology;
    if (typeof globalThis !== 'undefined' && globalThis.HDTopology) return globalThis.HDTopology;
    return null;
  }

  function setOf(gates) {
    var s = {};
    (gates || []).forEach(function (g) {
      var n = typeof g === 'object' && g ? +g.gate : +g;
      if (n >= 1 && n <= 64) s[n] = true;
    });
    return s;
  }

  /* The thirty six channels as pairs, from hd-topology.js, which is the one
     place they are declared. With that module missing this returns nothing
     rather than guessing: a composite drawn from half a channel table is a
     confident wrong answer, and an empty one is visibly empty. */
  function channelPairs(topo) {
    return topo && topo.pairs ? topo.pairs() : [];
  }

  /* A person's state on one channel: BOTH, ONE with the gate, or NONE. */
  function stateOn(set, g1, g2) {
    var h1 = !!set[g1], h2 = !!set[g2];
    if (h1 && h2) return { s: 'BOTH', gate: 0 };
    if (h1) return { s: 'ONE', gate: g1 };
    if (h2) return { s: 'ONE', gate: g2 };
    return { s: 'NONE', gate: 0 };
  }

  function composite(gatesA, gatesB, opts) {
    var o = opts || {}, topo = topoOf(o);
    var A = setOf(gatesA), B = setOf(gatesB);
    var nameA = o.nameA || 'You', nameB = o.nameB || 'They';
    var out = { electromagnetic: [], companionship: [], dominance: [], compromise: [],
      sharedGate: [], absent: [] };
    /* The composite definition: what the two of them define standing together,
       which is the union of the activations and not a third chart. */
    var union = {}, k;
    for (k in A) union[k] = true;
    for (k in B) union[k] = true;
    var defined = [], definedCenters = {};

    channelPairs(topo).forEach(function (ch) {
      var g1 = ch.a, g2 = ch.b;
      var sa = stateOn(A, g1, g2), sb = stateOn(B, g1, g2);
      var c1 = topo ? topo.centerOf(g1) : '';
      var c2 = topo ? topo.centerOf(g2) : '';
      var row = {
        /* Structure only. The channel's name, theme and meaning are this
           module's to identify (by key and by gates) and hd-atlas's to
           describe, and HDAtlas.layers() reads them from there. */
        key: ch.key, gates: [g1, g2], centers: [c1, c2],
        state: { a: sa.s, b: sb.s, aGate: sa.gate, bGate: sb.gate }
      };
      if (union[g1] && union[g2]) { defined.push(ch.key); definedCenters[c1] = true; definedCenters[c2] = true; }

      if (sa.s === 'ONE' && sb.s === 'ONE' && sa.gate !== sb.gate) {
        row.type = TYPES.ELECTROMAGNETIC;
        row.brings = { a: sa.gate, b: sb.gate };
        row.fact = nameA + ' and ' + nameB + ' together complete channel ' + ch.key + '. ' +
          nameA + ' brings gate ' + sa.gate + ', ' + nameB + ' brings gate ' + sb.gate + '.';
        out.electromagnetic.push(row);
      } else if (sa.s === 'ONE' && sb.s === 'ONE') {
        row.type = TYPES.SHARED_GATE;
        row.gate = sa.gate;
        row.fact = nameA + ' and ' + nameB + ' both carry gate ' + sa.gate + ' and neither carries the other end, so channel ' + ch.key + ' stays open for both.';
        out.sharedGate.push(row);
      } else if (sa.s === 'BOTH' && sb.s === 'BOTH') {
        row.type = TYPES.COMPANIONSHIP;
        row.fact = nameA + ' and ' + nameB + ' each complete channel ' + ch.key + ' on their own.';
        out.companionship.push(row);
      } else if (sa.s === 'BOTH' || sb.s === 'BOTH') {
        var holder = sa.s === 'BOTH' ? 'a' : 'b';
        var otherState = holder === 'a' ? sb : sa;
        var holderName = holder === 'a' ? nameA : nameB;
        var otherName = holder === 'a' ? nameB : nameA;
        row.holder = holder;
        row.other = holder === 'a' ? 'b' : 'a';
        row.holderName = holderName;
        row.otherName = otherName;
        row.caution = CONFIG_CAUTION;
        if (otherState.s === 'NONE') {
          row.type = TYPES.DOMINANCE;
          row.fact = holderName + ' completes channel ' + ch.key + ' alone. ' + otherName +
            ' carries neither of its gates, so between the two of them this channel is held by ' + holderName + '.';
          out.dominance.push(row);
        } else {
          row.type = TYPES.COMPROMISE;
          row.sharedGate = otherState.gate;
          row.fact = holderName + ' completes channel ' + ch.key + ' alone, and ' + otherName +
            ' carries gate ' + otherState.gate + ' of it. ' + otherName + ' meets the whole channel through ' +
            holderName + ', and it stays defined by ' + holderName + '.';
          out.compromise.push(row);
        }
      } else {
        row.type = TYPES.ABSENT;
        row.fact = 'Neither chart reaches channel ' + ch.key + ', together or apart.';
        out.absent.push(row);
      }
    });

    out.counts = { electromagnetic: out.electromagnetic.length, companionship: out.companionship.length,
      dominance: out.dominance.length, compromise: out.compromise.length,
      sharedGate: out.sharedGate.length, absent: out.absent.length,
      total: out.electromagnetic.length + out.companionship.length + out.dominance.length +
        out.compromise.length + out.sharedGate.length + out.absent.length };
    /* The composite definition, stated as what the pair defines together. */
    out.definition = { channels: defined, centers: Object.keys(definedCenters).filter(Boolean).sort(),
      channelCount: defined.length };
    out.precision = precision(o.timeA, o.timeB, nameA, nameB);
    out.identical = sameGates(A, B);
    return out;
  }

  function sameGates(A, B) {
    var ka = Object.keys(A), kb = Object.keys(B);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) if (!B[ka[i]]) return false;
    return true;
  }

  /* DEGRADE EXPLICITLY, NEVER INVENT. A gate is about five and a half degrees
     of the zodiac and the Moon crosses one in roughly ten hours, so an unknown
     birth time can move the fast bodies out of a gate entirely. This says which
     side of the pair that applies to and stops: it does not estimate, and it
     does not quietly drop the affected rows, because a shortened list with no
     explanation reads as a finding. */
  function precision(timeA, timeB, nameA, nameB) {
    var a = timeA === 'known', b = timeB === 'known';
    if (a && b) return { full: true, who: 'none',
      note: 'Both birth times are known, so the gates below are drawn as precisely as this build can draw them.' };
    var who = !a && !b ? 'both' : (!a ? 'a' : 'b');
    var subject = who === 'both' ? 'Neither birth time is known'
      : 'The birth time for ' + (who === 'a' ? nameA : nameB) + ' is not known';
    return { full: false, who: who,
      note: subject + ', so those gates are computed for 12:00 noon local as a placeholder. ' +
        'The Sun and the slow bodies hold; the Moon and the personal points can sit in a different gate ' +
        'by evening, which can add or remove a channel below. Read this as a draft until the time is filled in.' };
  }

  /* The three parts, kept apart on the way out exactly as animal-symbolism.js
     and dream-symbols.js keep them: what is calculated, what the tradition
     holds, and a question only the two people can answer. The third is never a
     statement about either of them, and never about the relationship. */
  /* layers() IS NOT HERE, AND THAT IS THE POINT. It assembles hd-atlas.js's
     own writing, so it lives there: call HDAtlas.layers(row, nameA, nameB)
     with a row exactly as this module returns one. Putting it back would put
     a mechanics module back to reading an interpretation one, which is the
     crossing the atlas split removed. */

  /* A composite is a reading of two people and is never presented as one
     person's verdict on the other. */
  function consentNote(mutual, nameB) {
    var b = nameB || 'they';
    return mutual
      ? 'Drawn from a birth moment ' + b + ' sent you, so this reading is one you both have.'
      : 'Drawn from birth details you entered for ' + b + '. ' + b + ' has not seen this and has not been asked. It stays on this device.';
  }

  return { VERSION: VERSION, MAX_CONTACTS: 12, TYPES: TYPES,
    CONFIG_CAUTION: CONFIG_CAUTION, PRIVACY_NOTICE: PRIVACY_NOTICE,
    composite: composite, precision: precision,
    consentNote: consentNote, channelPairs: channelPairs, setOf: setOf, stateOn: stateOn };
}));
