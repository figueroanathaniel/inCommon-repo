/*! hd-circle.js: Between, Circle, and the Ground a Circle stands on. V1.0.0 (UMD)
 *
 * BETWEEN IS NOT A SECOND ENGINE. Between(a, b) is the two person overlay this
 * build already has, under its inCommon name: it delegates to hd-composite.js
 * and adds nothing. Writing a second overlay would be the same mistake as a
 * second channel table, and hd-composite already carries the six states, the
 * direction rule and the configuration caution that took two versions to get
 * right.
 *
 * CIRCLE IS THE NEW THING, and it is a group reading rather than a pile of
 * pairs. Three to five people, and what comes back is a GROUND: the mechanics
 * the group actually holds in common, as gate numbers and centre states, with
 * every one of them attributed to the members who carry it.
 *
 * WHY THERE ARE NO PAIRWISE ROWS IN A GROUND. A Circle of five contains ten
 * Betweens, and a Ground that listed all ten with their counts would be a
 * ranking whatever the field names were: two numbers side by side are compared,
 * and the reader would be told which two of their friends fit best. That is the
 * one thing this object must never say. A Ground is about the group as a whole,
 * and a Between is opened deliberately, one pair at a time, on the two person
 * surface that already carries the consent story.
 *
 * THERE IS NO SCORE AND THERE WILL NOT BE ONE. No percentage, no rating, no
 * ranking, no best match, and no ordering of members produced by anything in
 * here. Counts are kept because a count is a fact about channels, and it stops
 * being one the moment it is divided by anything, so every count in a Ground is
 * about gates, channels or centres and NONE is per member. A per member count
 * is a league table with one step missing.
 *
 * `members` is in the order it was given in, and says so. The proof that no
 * ranking is happening is not the absence of a field, which is easy to add
 * back: it is that permuting the input permutes nothing but the member list.
 * G20 asserts that over every permutation of a five person Circle.
 *
 * THERE IS NO ANCHOR, AND THAT IS THE DECISION RATHER THAN AN OMISSION.
 *
 * An earlier version of this module had one. It was the seat the reading was
 * taken from, it was passed in rather than computed so that no measurement
 * could choose it, it carried permissions: 'none' in the shape, and a test
 * proved it was inert: the same Circle read from all five seats gave a byte
 * identical Ground apart from the anchor field. Every one of those defences
 * worked, and they defended the wrong thing.
 *
 * `permissions: 'none'` is read by code. A person reads a list of five names
 * with one of them singled out and labelled, and no adjacent sentence undoes
 * that. In a family, a team, or a friendship, being the named one, or not being
 * the named one, is the whole content of the screen no matter what the field
 * says. The safe version of a distinguished seat in a small group of real
 * people is not a carefully labelled one. It is none.
 *
 * So a Ground has no seat, no centre, no first member and no perspective. Every
 * member appears the same way, carries the same fields, and can be swapped for
 * any other without the object changing. If a screen needs to know whose device
 * it is, that belongs to the screen: it is a fact about the session and not a
 * finding about the group, and it must not travel inside the reading. G23 to
 * G27 hold this shut, and an `anchor` passed in options is ignored rather than
 * honoured, so reintroducing one takes a deliberate edit here.
 *
 * NOTHING IS PERSISTED AND NOTHING IS MEMOISED. A Ground is computed on read
 * from birth data and dropped. Storing one would mean n(n-1)/2 rows per Circle
 * that every member can invalidate by correcting their own birth time, which is
 * the failure the compute on read rule exists to prevent. pair-cache.js is
 * deliberately not consulted here: it is the two person surface's cache, its
 * key is a digest of two birth moments, and reaching into it from a group
 * reading would put group state behind a pair key.
 *
 * NO PROSE. A Ground is mechanics, so it returns gate numbers, channel keys,
 * centre names and member ids, and the screen writes the sentences. The one
 * sentence in this module is GROUP_CAUTION, returned rather than written in a
 * template for the same reason CONFIG_CAUTION is: so it cannot drift between
 * the two shells, and so a screen that drops it fails a test rather than
 * shipping quietly.
 *
 * DEGRADE EXPLICITLY, NEVER INVENT. A member with no birth time is named as
 * such and the affected mechanics are listed. No placement is estimated and no
 * member is quietly dropped from the Ground, because a group of five that
 * silently reads as four is a wrong answer that looks like a right one.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.HDCircle = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  var MIN_MEMBERS = 3;
  var MAX_MEMBERS = 5;

  /* Rendered beside every Ground, not behind a tap and not in a footnote. The
     vocabulary of shared and unshared mechanics sits next to real friendships
     and real families, and read carelessly it can turn a description of two
     charts into a verdict on a person's place in a group. */
  var GROUP_CAUTION = 'This describes what a group of charts holds in common. It says nothing about who belongs, who matters, or how anyone in this circle should be treated, and it is not a measure of the group or of anybody in it.';

  /* What an unknown birth time puts out of reach, in the same terms
     birth-time.js uses, so the two never drift into two vocabularies. */
  var TIME_DEPENDENT = ['the Moon to the degree', 'gate lines near a boundary', 'the design side'];

  /* The same move hd-composite made: the wiring is mechanics and comes from
     the module that owns it, so nothing here reaches into the atlas at all.
     A Ground is gate numbers, channel keys and centre names, and every one of
     those is a fact rather than a description. */
  function topoOf(opts) {
    if (opts && opts.topology) return opts.topology;
    if (typeof self !== 'undefined' && self.HDTopology) return self.HDTopology;
    if (typeof globalThis !== 'undefined' && globalThis.HDTopology) return globalThis.HDTopology;
    return null;
  }
  function compositeOf(opts) {
    if (opts && opts.composite) return opts.composite;
    if (typeof self !== 'undefined' && self.HDComposite) return self.HDComposite;
    if (typeof globalThis !== 'undefined' && globalThis.HDComposite) return globalThis.HDComposite;
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

  /* From hd-topology.js, the one place the thirty six are declared. Empty
     rather than guessed if that module is missing: a Ground built from half a
     channel table would report channels as out of reach that are not. */
  function pairsOf(topo) {
    return topo && topo.pairs ? topo.pairs() : [];
  }

  /* Which channels one person closes alone, and therefore which centres are
     defined for them. A centre is defined by a completed channel touching it,
     which is the same rule hd-composite applies to a pair. */
  function definedFor(set, pairs, topo) {
    var channels = [], centers = {};
    pairs.forEach(function (ch) {
      if (!set[ch.a] || !set[ch.b]) return;
      channels.push(ch.key);
      if (topo) {
        var c1 = topo.centerOf(ch.a), c2 = topo.centerOf(ch.b);
        if (c1) centers[c1] = true;
        if (c2) centers[c2] = true;
      }
    });
    return { channels: channels, centers: Object.keys(centers).sort() };
  }

  /* ------------------------------------------------------------- Between */

  /* The two person overlay under its inCommon name. Everything about the six
     states, the direction rule and the caution lives in hd-composite.js, and
     this exists so that "Between" is a word the codebase answers to rather
     than a second implementation of it. */
  function between(personA, personB, opts) {
    var o = opts || {};
    var HDC = compositeOf(o);
    if (!HDC) return null;
    var a = personA || {}, b = personB || {};
    return HDC.composite(a.gates, b.gates, {
      topology: topoOf(o),
      nameA: a.name, nameB: b.name,
      timeA: a.timeState, timeB: b.timeState
    });
  }

  /* -------------------------------------------------------------- Circle */

  function circle(members, opts) {
    var o = opts || {};
    var topo = topoOf(o);
    var list = members || [];

    /* REFUSE, DO NOT TRIM. A cap that silently drops the sixth person deletes
       somebody from their own circle and says nothing, which is the same rule
       the twelve person library follows. */
    if (list.length < MIN_MEMBERS || list.length > MAX_MEMBERS) {
      return { version: VERSION, ok: false,
        reason: list.length < MIN_MEMBERS ? 'too_few' : 'too_many',
        given: list.length, min: MIN_MEMBERS, max: MAX_MEMBERS };
    }

    var pairs = pairsOf(topo);
    var ids = list.map(function (m, i) { return m && m.id != null ? String(m.id) : 'm' + i; });
    var sets = list.map(function (m) { return setOf(m && m.gates); });
    var n = list.length;

    /* ---- gates, attributed ---- */
    /* EVERY ATTRIBUTION LIST IS SORTED BY ID, NOT LEFT IN INPUT ORDER.
       Built in member order these lists carry the input order into the Ground,
       and then permuting the members changes the object: 117 of the 120
       permutations of a five person circle differed before this line existed.
       Nothing downstream was reading the order, which is exactly why it would
       have survived. An order that means nothing and changes with the input is
       an order a reader will eventually read as a ranking. */
    var holdersByGate = {};
    for (var g = 1; g <= 64; g++) {
      var who = [];
      for (var i = 0; i < n; i++) if (sets[i][g]) who.push(ids[i]);
      if (who.length) holdersByGate[g] = who.sort();
    }
    var gatesAll = [], gatesSome = [], gatesOne = [], gatesNone = [];
    for (var g2 = 1; g2 <= 64; g2++) {
      var w = holdersByGate[g2];
      if (!w) { gatesNone.push(g2); continue; }
      if (w.length === n) gatesAll.push(g2);
      else if (w.length === 1) gatesOne.push({ gate: g2, member: w[0] });
      else gatesSome.push({ gate: g2, members: w.slice() });
    }

    /* ---- what each member closes alone, and what the group closes ---- */
    var per = sets.map(function (s) { return definedFor(s, pairs, topo); });
    var union = {};
    sets.forEach(function (s) { for (var k in s) union[k] = true; });

    var chAlone = [], chTogether = [], chOpen = [];
    var centersAsGroup = {};
    pairs.forEach(function (ch) {
      var c1 = topo ? topo.centerOf(ch.a) : '';
      var c2 = topo ? topo.centerOf(ch.b) : '';
      var row = { key: ch.key, gates: [ch.a, ch.b], centers: [c1, c2] };

      var soloists = [];
      for (var i = 0; i < n; i++) if (sets[i][ch.a] && sets[i][ch.b]) soloists.push(ids[i]);

      var groupHas = !!(union[ch.a] && union[ch.b]);
      if (groupHas) { if (c1) centersAsGroup[c1] = true; if (c2) centersAsGroup[c2] = true; }

      if (soloists.length) {
        row.members = soloists.sort();     /* sorted for the reason above */
        chAlone.push(row);
      } else if (groupHas) {
        /* Who brings which end. This is the attribution the Ground exists for:
           the channel is only there because these people are in the room. */
        row.brings = {};
        row.brings[ch.a] = holdersByGate[ch.a] ? holdersByGate[ch.a].slice() : [];
        row.brings[ch.b] = holdersByGate[ch.b] ? holdersByGate[ch.b].slice() : [];
        chTogether.push(row);
      } else {
        chOpen.push(row);
      }
    });

    /* ---- centres ---- */
    var centerNames = topo ? topo.CENTERS.slice() : [];
    var everyMember = [], someMember = [], noMember = [];
    centerNames.forEach(function (c) {
      var count = 0;
      per.forEach(function (p) { if (p.centers.indexOf(c) !== -1) count++; });
      if (count === n) everyMember.push(c);
      else if (count > 0) someMember.push(c);
      else noMember.push(c);
    });

    /* ---- birth times, named per member and never averaged ---- */
    var unknown = [], unanswered = [];
    list.forEach(function (m, i) {
      var st = m && m.timeState;
      if (st === 'unknown') unknown.push(ids[i]);
      else if (st === 'unanswered' || st == null) unanswered.push(ids[i]);
    });

    return {
      version: VERSION,
      ok: true,
      size: n,
      /* Stated so nobody has to infer it, and asserted by G20. */
      memberOrder: 'as given',
      members: list.map(function (m, i) {
        return { id: ids[i], name: (m && m.name) || '', timeState: (m && m.timeState) || 'unanswered' };
      }),
      gates: { all: gatesAll, some: gatesSome, one: gatesOne, none: gatesNone, holders: holdersByGate },
      channels: { alone: chAlone, together: chTogether, open: chOpen },
      centers: {
        everyMember: everyMember, someMember: someMember, noMember: noMember,
        asGroup: Object.keys(centersAsGroup).filter(Boolean).sort()
      },
      /* Every count is about gates, channels or centres. None is about a
         member, because a per member count is the last step before a table. */
      counts: {
        gatesHeldByAll: gatesAll.length,
        gatesHeldBySome: gatesSome.length,
        gatesHeldByOne: gatesOne.length,
        gatesHeldByNobody: gatesNone.length,
        channelsClosedAlone: chAlone.length,
        channelsClosedOnlyTogether: chTogether.length,
        channelsOpenToTheGroup: chOpen.length,
        centersDefinedForEveryMember: everyMember.length,
        centersDefinedAsGroup: Object.keys(centersAsGroup).filter(Boolean).length
      },
      precision: {
        full: unknown.length === 0 && unanswered.length === 0,
        unknownMembers: unknown,
        unansweredMembers: unanswered,
        timeDependent: (unknown.length || unanswered.length) ? TIME_DEPENDENT.slice() : []
      },
      caution: GROUP_CAUTION
    };
  }

  return {
    VERSION: VERSION,
    MIN_MEMBERS: MIN_MEMBERS, MAX_MEMBERS: MAX_MEMBERS,
    GROUP_CAUTION: GROUP_CAUTION,
    TIME_DEPENDENT: TIME_DEPENDENT,
    between: between, circle: circle,
    setOf: setOf, definedFor: definedFor, pairsOf: pairsOf
  };
}));
