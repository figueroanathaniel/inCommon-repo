/* tarot-omni.js: the Omni reading, written on the server only.

   Omni is the long tarot study: nine or eleven cards, every one read against
   every other, seven passages. It was in app/tarot.js until 18 October 2026,
   when the owner made it a paid add-on and chose that the lock should hold, so
   the composer moved here, beside the Oracle function that runs it after it
   has checked the reader's Codex Luminary. It is never copied into the app or
   the bundle; that is the whole of the lock.

   It composes nothing new. The words are the ones it always wrote, from the
   cards, the draw and the shared phrases in tarot.js, which the Oracle function
   loads from its own copy (server/oracle/tarot.js, written by
   tools/build-bundle.js from app/tarot.js, so the two cannot drift). It is
   handed those helpers as PARTS rather than reaching for them, so it reads
   exactly the functions the reader's own Light and Divine readings use.

   Epistemics as in tarot.js: which cards fell is CALCULATED, what a card has
   meant is TRADITIONAL, what it might mean for the reader is POSSIBILITY. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TarotOmni = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  return function omni(drawn, topic, P) {
    var TOPICS = P.TOPICS,
      tally = P.tally,
      dominantSuit = P.dominantSuit,
      arcLine = P.arcLine,
      chainLine = P.chainLine,
      suitLine = P.suitLine,
      elementLine = P.elementLine,
      orientLine = P.orientLine,
      majorLine = P.majorLine,
      repeatLine = P.repeatLine,
      courtLine = P.courtLine,
      label = P.label,
      sent = P.sent,
      linkClause = P.linkClause,
      topicClause = P.topicClause,
      cap = P.cap,
      strip = P.strip,
      artN = P.artN,
      wordN = P.wordN;
    var t = tally(drawn), T = TOPICS[topic], out = [], dom = dominantSuit(t);
    out.push({ tag: 'CALCULATED', text: artN(drawn.length) + ' ' + drawn.length + ' card draw. They are ' + T.lens + '. ' +
      arcLine(drawn) + ' ' + (t.rev === 0 ? 'Every card fell upright'
        : t.rev === drawn.length ? 'Every card fell reversed'
        : (drawn.length - t.rev) + ' cards stand upright and ' + t.rev + ' are reversed') + ', and ' +
      (t.major === 1 ? 'one of them belongs' : t.major === 0 ? 'none of them belong' : t.major + ' of them belong') + ' to the Major Arcana.' });

    out.push({ tag: 'TRADITIONAL', text: 'Read in sequence, the cards hand on to one another rather than standing apart, and the handovers are where the reading is. ' +
      chainLine(drawn, topic).join(' ') });

    out.push({ tag: 'TRADITIONAL', text: [suitLine(t, drawn), elementLine(t)].filter(Boolean).join(' ') +
      (dom ? ' ' + dom.suit.utility : '') });

    out.push({ tag: 'TRADITIONAL', text: orientLine(t, drawn) + ' ' + majorLine(t, drawn) + ' ' +
      (t.rev ? 'Where a card is reversed, the tradition does not flip its meaning into its opposite. It reads the same force turned inward, delayed, or refused, which is why reversed cards so often describe something you already know and have not yet acted on. Naming it is most of the work.' : '') });

    var num = repeatLine(t), crt = courtLine(t);
    out.push({ tag: 'TRADITIONAL', text: (num || 'No number repeats in this draw, so no single lesson is being pressed twice; the reading gains its weight from sequence rather than from emphasis.') +
      ' ' + (crt || 'No court cards appear, which points at a situation you are working out largely by yourself.') +
      ' ' + (t.aces ? wordN(t.aces) + ' Ace' + (t.aces > 1 ? 's' : '') + ' in the draw marks a genuine beginning inside whatever else is happening.' : 'No Aces fall, so this is a middle rather than a start.') });

    var f = drawn[0], m = drawn[Math.floor(drawn.length / 2)], l = drawn[drawn.length - 1];
    out.push({ tag: 'SYNTHESIS', text: 'Woven together, the reading turns on three of its cards, and this next part is assembled here rather than quoted from the tradition. ' + label(f) +
      ' sets the ground. ' + sent(f) + ' ' + label(m) + ' is the pivot. ' + sent(m) +
      ' ' + label(l) + ' is where it lands. ' + sent(l) + ' ' + linkClause(f, l) });

    out.push({ tag: 'POSSIBILITY', text: 'If the pattern holds, the next stretch looks like this. ' +
      sent(l) + (topic === 'general' ? '' : ' In this question specifically: ' + cap(strip(topicClause(l, topic))) + '.') +
      ' ' + (dom && dom.count > 1 ? 'Watch ' + dom.suit.arena.split(',')[0] + ' first; that is where the draw is densest and where a change would show earliest. ' : '') +
      'This is a prediction in the only sense a spread can offer one: a pattern named clearly enough that you can hold it up against what actually happens, and discard it honestly if it does not hold. A pattern you can see is one you can do something about, and that is the whole of what a spread is for. ' + T.close });

    return out;
  };
}));
