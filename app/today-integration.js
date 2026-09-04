/*! today-integration.js: the Today page Integration passage.  v1.3.0
 *
 * Pure and testable. It takes the STRUCTURED elements that are present in
 * today's reading (never prose read back out of the interface) and returns one
 * cohesive passage that does three things:
 *
 *   context      what the present elements commonly point toward
 *   interaction  how they may reinforce, balance, or complicate one another
 *   possibility  one optional experiment the reader might try
 *
 * Rules held here:
 *   - qualities only, never identifiers. The passage never repeats the gate
 *     number, planet name, degree, or personal day already listed above it,
 *     so it cannot collapse into a second summary of the same rows.
 *   - invitational language only: may, might, one possibility, you could.
 *   - no diagnosis, no prediction, no fate, no invented personal context.
 *   - variation is stable, derived from the element combination itself. The
 *     same combination always reads the same way. Different combinations do
 *     not collapse into one canned response.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TodayIntegration = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ASP_CLASS = {
    conjunct: 'fused', conjunction: 'fused',
    sextile: 'open', trine: 'open',
    square: 'tense', opposite: 'tense', opposition: 'tense'
  };

  /* CONTEXT_FRAMES open a paragraph. SOURCE_FRAMES follow one.

     The synthesis used to open with its own inventory, "Present today:"
     followed by three abstractions chained with commas. That is a reading
     showing its working before it has said anything, and a chain of qualities
     is the least picture-like sentence this app produces.

     The vivid sentence already existed. It was simply second. The order is
     flipped so the reading opens with what the combination tends to do, and
     the inventory follows as the reason, which needs a frame that can carry a
     list after a statement rather than before one. */
  var SOURCE_FRAMES = [
    'That comes out of ',
    'What it is drawn from: ',
    'The parts in play are ',
    'Underneath it sit '
  ];

  var CONTEXT_FRAMES = [
    'What is actually present today is ',
    'Today is made of ',
    'The elements in play today are ',
    'Present today: '
  ];

  /* astro class x whether the design ground is defined.
   *
   * WHY THESE ARE SETS AND NOT SENTENCES. This table used to hold exactly one
   * string per cell, and the cell is chosen by two facts: the class of today's
   * contact, and whether the reader's ground is defined. The second of those
   * never changes, because it is a fact about their chart rather than about the
   * day, so only four cells were ever reachable by any one person. Measured
   * over twenty one consecutive days on a real profile, one sentence came back
   * eighteen times. Every other pool in this file is already indexed by the
   * seed; this one alone was a flat lookup, and it read as the app repeating
   * itself because it was.
   *
   * The variants are not rewordings of each other. Each takes a different
   * angle on the same arrangement, and most of them name what is actually in
   * play rather than describing it in the abstract: the quality the mover
   * carries, the quality it lands on, the theme the ground is running. A reader
   * who sees "friction between individuation and the break in the pattern,
   * landing on ground you can count on" twice in a month is being told
   * something about their week. A reader who sees the same generic sentence
   * eighteen times is being told something about the software.
   */
  function pairLines(c, defined, el, pick) {
    var A = el.astro || {}, D = el.design || {};
    var mover = A.moverQuality || 'what is moving';
    var natal = A.natalQuality || 'what it lands on';
    var theme = D.theme || 'the theme underneath';
    var sets = {
      'open|true': [
        'The ease in that contact and the steadiness of that ground may reinforce one another, which can make a day like this easy to spend without noticing it went by.',
        'An open line into ' + natal + ', landing on ground that already behaves the same way every time, is the combination most often mistaken for an ordinary day.',
        'Nothing here is asking for effort, which is the difficulty: ' + theme + ' will hold whether or not you use it.',
        'Ease on reliable ground compounds quietly. What gets done today will not feel like it took anything, and that is worth noticing rather than trusting.',
        'A day that will not resist you is not the same as a day that will reward you, and this is the first kind.',
        'The ground holds and the contact is kind, so whatever you put down today will still be where you left it.'
      ],
      'open|false': [
        'An easy contact landing on ground that is borrowed rather than fixed may read as a good day that is hard to repeat on purpose.',
        'The ease is real and the ground under it is on loan, so ' + natal + ' may behave differently tomorrow with the same effort applied.',
        'Borrowed ground takes the colour of the room. An open line through ' + theme + ' can feel like yours and be mostly the company.',
        'Whatever works today, write down the conditions rather than the result: the conditions are the part that will not still be here next week.',
        'Take the win and hold the explanation loosely: the ease is in the room at least as much as it is in you.',
        'An easy day on ground you do not own is worth enjoying and not worth generalising from.'
      ],
      'tense|true': [
        'Friction meeting ground that already behaves consistently may become usable rather than only uncomfortable.',
        'Friction ' + meeting(mover, natal, pick) + ', landing on ground you can count on, is the version of a hard contact that tends to produce something.',
        'The ground will not move, so the pressure has to go somewhere else. That is the difference between a day that grinds and a day that decides.',
        'This is a tense line on fixed footing. It will ask for a choice, and there is something steady enough underneath to make one from.',
        'Something has to give and it will not be the floor, which is the most useful sentence available about today.',
        'Hard contact, solid footing. That pairing is where most of what people later call discipline actually came from.'
      ],
      'tense|false': [
        'Friction meeting borrowed ground can feel larger than it is, and some of it may belong to the room rather than to you.',
        'The friction ' + meeting(mover, natal, pick) + ' has nothing fixed under it today, which is usually when a mood gets mistaken for a trait.',
        'Pressure on borrowed ground amplifies. Before deciding what this means about you, check who else was in the room when it started.',
        'Neither side of this is settled: not the contact, and not ' + theme + '. A day like this reads more accurately in hindsight than during.',
        'The friction is real and the ground under it is on loan, which makes today a poor day to conclude anything permanent about yourself.',
        'Take the pressure seriously and the verdict lightly. One of those is information; the other is a mood with a good vocabulary.'
      ],
      'fused|true': [
        'A fused contact is hard to hold at arm’s length while it is happening, and ground that is already reliable will not argue with it.',
        mover.charAt(0).toUpperCase() + mover.slice(1) + ' is folded into ' + natal + ' closely enough that separating them today is mostly theoretical.',
        'Fusion on consistent ground tends to feel like conviction. It is worth asking, once, whether it arrived with you or arrived this morning.',
        'There is no gap to think in while this is close, and the ground underneath will simply carry whatever you decide from inside it.',
        'While this is close it will feel like knowing rather than like weather, and the ground will back it either way.',
        'The reliable part of you will carry whatever this contact decides, which is worth remembering before deciding.'
      ],
      'fused|false': [
        'A fused contact on borrowed ground may be mistaken for a fixed trait when it is closer to weather.',
        'Fused, and on ground that is not yours to keep: this is the arrangement most likely to be remembered as a personality rather than a day.',
        'What feels most like you today has the least underneath it. That is not a reason to distrust it, only a reason to date it.',
        mover.charAt(0).toUpperCase() + mover.slice(1) + ' and ' + natal + ' are hard to tell apart right now, and nothing fixed is holding either one in place.',
        'Nothing here is anchored, so whatever certainty arrives today is best written down and read again on a duller one.',
        'This will feel like a discovery about yourself. It is closer to a forecast, and forecasts expire.'
      ],
      'quiet|true': [
        'With nothing in the sky within orb, the steadiness of that ground is most of what is setting the pace.',
        'The sky is not saying anything today, which leaves ' + theme + ' running at its own speed and nothing arguing with it.',
        'Quiet overhead, fixed underneath. Days like this are the ones your own pattern is easiest to see in, because nothing else is competing.',
        'Nothing is arriving. What is already consistent in you is the whole of the weather.',
        'An empty sky is the honest test of what runs in you without prompting, and today you get to watch it.',
        'No weather, fixed ground. Whatever happens today, you can reasonably take the credit or the blame for it.'
      ],
      'quiet|false': [
        'With no outside contact, and no fixed ground under the theme either, the shape of the day may come from whoever you spend it with.',
        'Nothing overhead and nothing fixed below: today takes its shape almost entirely from the room you are standing in.',
        'An open sky over borrowed ground is the least determined day this reading can describe. Treat what happens as information about the company.',
        'There is little here that belongs to you specifically. That is worth knowing before reading much into how the day goes.',
        'Nothing overhead and nothing fixed below. Today is mostly made of whoever is in the room, which is not a small thing.',
        'This is the least determined day the reading can describe, which also makes it the easiest one to steer.'
      ]
    };
    var set = sets[c + '|' + (defined ? 'true' : 'false')] || sets['quiet|false'];
    return set[pick % set.length];
  }

  var SOLO_ASTRO = {
    open: 'On its own, an easy contact tends to widen a day rather than direct it, and easy things are the ones most often left unused.',
    tense: 'On its own, a tense contact tends to ask for a choice rather than a balance.',
    fused: 'On its own, a fused contact is difficult to separate from your own impulse while it lasts.'
  };

  var POSS = {
    open: [
      'One possibility: name the single thing that would benefit from unusual ease, and do that one first, before the day fills with everything else.',
      'You could take the easiest useful thing in front of you and finish it while it is still cheap to finish.'
    ],
    tense: [
      'One possibility: take the smaller of the two demands today, let the other wait until tomorrow, and notice whether the friction drops or simply moves.',
      'You could write the choice down in one sentence, without deciding it yet, and read it back this evening.'
    ],
    fused: [
      'You could notice, once today, the moment an impulse stops feeling like a choice, and let a few minutes pass before you act on it.',
      'One possibility: say plainly what you want right now, then check whether it still sounds like yours an hour from now.'
    ],
    quiet: [
      'One possibility: treat today as unforced. Nothing outside is asking, so whatever you begin is fairly yours to claim.',
      'You could use an uneventful day for one small thing that has been waiting on attention rather than on effort.'
    ]
  };

  var TAILS = [
    'Read as description, not forecast.',
    'None of this predicts the day. Your own record is the only test of it.',
    'Three mechanisms, not three agreements.'
  ];

  function aspectClass(a) {
    if (!a || !a.aspect) return 'quiet';
    return ASP_CLASS[String(a.aspect).toLowerCase()] || 'fused';
  }

  function joinList(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + ' and ' + list[1];
    return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
  }

  /* Stable, combination-derived index. No randomness, so a state is
     reproducible for testing, while different states diverge. */
  function seedOf(el) {
    var n = 0, A = el.astro, D = el.design, N = el.numbers, M = el.moon;
    if (N) n += (+N.day || 0) * 3 + (+N.year || 0) * 5 + (+N.blend || 0);
    if (D) { n += D.defined ? 4 : 9; if (D.channel) n += 2; }
    if (A) {
      var c = aspectClass(A);
      n += (c === 'tense' ? 7 : c === 'open' ? 4 : 2) + Math.round((+A.orb || 0) * 2);
      n += String(A.natalQuality || '').length;
    }
    if (M) n += M.filling ? 1 : 3;
    return Math.abs(n);
  }

  function numRelation(N) {
    if (N.day === N.year) return 'repeats';
    if (N.blend === N.day) return 'echoes';
    if (N.blend === N.year) return 'leans into';
    return 'cuts across';
  }

  /* JOINING TWO QUALITIES WITHOUT BREAKING THE SENTENCE.
   *
   * The qualities these readings join are phrases, not words: "individuation
   * and the break in the pattern", "affection, taste, and worth". Welding two
   * of those with "between A and B" produced "the friction between
   * individuation and the break in the pattern and affection, taste, and
   * worth", where the reader has to work out which "and" is the hinge. It is
   * the kind of sentence that makes a reading feel machine assembled, which
   * is exactly the impression the whole app is trying not to give.
   *
   * So the construction is chosen by the shape of what is being joined. Two
   * short qualities can take "between A and B", because there is only one
   * "and" in the sentence and it is the hinge. Anything carrying its own
   * "and" or its own comma gets a construction with a verb in the middle,
   * where the seam is unmistakable. The variants also give the sentence
   * somewhere to move, which is the other half of the problem. */
  function isComplex(x) { return / and |,/.test(String(x || '')); }
  function sameQuality(a, b) {
    return String(a || '').toLowerCase().trim() === String(b || '').toLowerCase().trim();
  }
  function meeting(a, b, pick) {
    a = String(a || 'what is moving'); b = String(b || 'what it lands on');
    /* A body returning to its own natal place gives the same quality twice, and
       "feeling, memory, and what soothes, landing on feeling, memory, and what
       soothes" is a sentence that took work to say nothing. Name the return. */
    if (sameQuality(a, b)) {
      var same = [
        'where ' + a + ' comes back over its own ground',
        'where ' + a + ' meets itself',
        'in ' + a + ', doubled',
        'where ' + a + ' is both halves of the contact'
      ];
      return same[Math.abs(pick || 0) % same.length];
    }
    /* Every form starts with a connective, because these get a prefix in front
       of them: "an easy line ...", "friction ...". A form beginning with the
       quality itself leaves "an easy line feeling, memory, and what soothes",
       which is missing the word that would have made it a sentence. */
    var forms = (isComplex(a) || isComplex(b))
      ? [
          'where ' + a + ' meets ' + b,
          'running from ' + a + ' into ' + b,
          'with ' + a + ' set against ' + b,
          'where ' + a + ' lands on ' + b
        ]
      : [
          'between ' + a + ' and ' + b,
          'where ' + a + ' meets ' + b,
          'from ' + a + ' into ' + b,
          'between ' + a + ' and ' + b
        ];
    return forms[Math.abs(pick || 0) % forms.length];
  }
  function contextPhrases(el, pick) {
    var out = [], A = el.astro, D = el.design, N = el.numbers;
    if (A) {
      var c = aspectClass(A);
      if (c === 'open') out.push('an easy line ' + meeting(A.moverQuality, A.natalQuality, pick));
      else if (c === 'tense') out.push('friction ' + meeting(A.moverQuality, A.natalQuality, pick));
      else out.push(A.moverQuality + ', folded into ' + A.natalQuality);
    }
    if (D) {
      out.push('a theme running through ' + D.theme +
        (D.defined ? ', on ground that already behaves consistently' : ', on ground that is borrowed rather than fixed'));
    }
    if (N) out.push(N.dayEssence + ' held inside a longer season of ' + N.yearEssence);
    if (!out.length && el.moon) out.push('a ' + el.moon.phase + ' moon and little else within reach');
    return out;
  }

  function interaction(el, pick) {
    var A = el.astro, D = el.design, N = el.numbers, M = el.moon, lines = [];
    var c = aspectClass(A);
    if (D) lines.push(pairLines(c, D.defined, el, pick));
    else if (A) lines.push(SOLO_ASTRO[c]);
    else if (N) lines.push('With nothing else in play, the tempo underneath is most of what today is offering to work with.');
    if (N && (A || D)) {
      lines.push('Underneath, ' + N.dayEssence + ' ' + numRelation(N) + ' the year\u2019s ' + N.yearEssence +
        ', and taken together the tradition reads the pair as ' + N.blendEssence + '.');
    } else if (N && !A && !D) {
      lines.push('The day\u2019s tempo ' + numRelation(N) + ' the year\u2019s, which the tradition reads together as ' + N.blendEssence + '.');
    }
    if (M && lines.length < 2) {
      lines.push('A ' + M.phase + ' moon is traditionally read as favouring ' +
        (M.filling ? 'starting over finishing' : 'finishing or releasing over starting') + '.');
    }
    return lines.filter(Boolean);
  }

  function possibility(el, pick) {
    var A = el.astro, D = el.design, M = el.moon, out = [];
    var pool = POSS[aspectClass(A)] || POSS.quiet;
    out.push(pool[pick % pool.length]);
    if (D && D.channel) {
      out.push('A channel completing with ground of your own may make company easier than solitude today, and one conversation is enough to test that.');
    } else if (M && !A) {
      out.push('A ' + M.phase + ' moon may be the only tilt in the day, and it is a mild one.');
    }
    return out;
  }

  function dedupe(list) {
    var seen = {}, out = [];
    list.forEach(function (s) {
      var k = String(s).trim().toLowerCase();
      if (!k || seen[k]) return;
      seen[k] = true;
      out.push(String(s).trim());
    });
    return out;
  }

  function build(el) {
    el = el || {};
    var present = [];
    ['astro', 'design', 'numbers', 'moon'].forEach(function (k) { if (el[k]) present.push(k); });

    if (!present.length) {
      return {
        kind: 'empty', elements: [], seed: 0,
        text: 'Nothing is drawn for today yet. A birth date, a time, and a place are what the three traditions read from, and until those sit on this profile there is nothing here to hold together.',
        poss: ''
      };
    }

    var seed = seedOf(el);
    var phrases = contextPhrases(el, seed);
    var lines = interaction(el, seed);
    /* Picture first, inventory second. If there is no interaction line to lead
       with, the inventory opens as it always did rather than starting the
       paragraph with a sentence about sources. */
    var context = lines.length
      ? SOURCE_FRAMES[seed % SOURCE_FRAMES.length] + joinList(phrases) + '.'
      : CONTEXT_FRAMES[seed % CONTEXT_FRAMES.length] + joinList(phrases) + '.';
    /* Which picture opens.

       Promoting the interaction line to the front fixed the voice and created
       a new problem: that line comes from a set of four, and the set is chosen
       by the class of the contact and by whether the ground is defined, which
       for one reader is nearly fixed. So the most visible sentence in the
       reading became its least variable one, seven distinct openers across
       twenty four days.

       interaction() already returns a second sentence, the one that sets the
       day number against the year, and that one varies with the arithmetic
       rather than with a lookup. Alternating which of the two leads costs no
       new writing and roughly doubles what a reader meets first, while both
       remain statements about the day rather than an inventory of its parts. */
    if (lines.length > 1 && seed % 2) lines = [lines[1], lines[0]].concat(lines.slice(2));
    var body = dedupe(lines.concat([context]));
    var poss = dedupe(possibility(el, seed).concat([TAILS[seed % TAILS.length]]));

    return {
      kind: present.length === 1 ? 'single' : 'full',
      elements: present, seed: seed,
      text: body.join(' '),
      poss: poss.join(' ')
    };
  }

  return { VERSION: '1.3.0', build: build, aspectClass: aspectClass };
}));
