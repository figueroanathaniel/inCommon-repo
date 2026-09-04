/*! iching.js: the Book of Changes, sixty four hexagrams. V1.0.0 (UMD)
 *
 * WHAT THIS IS. The oldest of the systems in this app by a wide margin, and the
 * one the others borrowed from: Human Design's sixty four gates ARE these
 * hexagrams, in this numbering, which is why hexagram 34 and gate 34 are the
 * same figure read by two traditions. The library says so and links them, and
 * that link is the point of having both in one app rather than two.
 *
 * WHOSE WORDS. Nobody else's. The judgments and images below are written here,
 * from the traditional imagery, which is ancient and belongs to no publisher.
 * Wilhelm's translation and Baynes's English are in copyright and are not
 * quoted, paraphrased line by line, or used as a crib. Where the tradition is
 * terse and strange this text stays terse and strange, because smoothing an
 * oracle into advice is how a book of changes becomes a horoscope.
 *
 * THE THREE PARTS, kept apart here and on the page, the same shape
 * animal-symbolism.js and dream-symbols.js use:
 *
 *   judgment      what the hexagram holds. The tradition's claim, in our words.
 *   image         the picture the two trigrams make, and what is done with it.
 *   movement      a question for the person who cast it. Never a statement
 *                 about them, never a prediction, never an instruction.
 *
 * CASTING IS REAL. Three coins gives 6 and 9 a one in eight chance each and 7
 * and 8 three in eight. The yarrow stalks do not: they give 6 one chance in
 * sixteen and 8 seven in sixteen, so a yarrow reading changes less often and
 * moves toward yin when it does. Those are different oracles and this module
 * implements both rather than rolling a number from six to nine and calling it
 * either. A reader who knows the methods would notice, and would be right to.
 *
 * SEEDED, so a reading re-renders identically and a kept one can be traced to
 * the exact cast that produced it. Same rule the tarot draw keeps.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.IChing = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  /* ---------- the eight trigrams ----------
     Lines are read bottom to top, which is also the order they are cast in.
     [name, glyph, image, attribute, bottom, middle, top] with 1 yang, 0 yin. */
  var TRIGRAMS = {
    heaven:   ['Heaven', '☰', 'the sky', 'force, and the initiative that does not wait to be asked', 1, 1, 1],
    lake:     ['Lake', '☱', 'still water held in a hollow', 'openness, pleasure, and what is said out loud', 1, 1, 0],
    fire:     ['Fire', '☲', 'flame and the sun', 'clarity, attachment, and what depends on its fuel', 1, 0, 1],
    thunder:  ['Thunder', '☳', 'the storm arriving', 'shock, beginning, and movement that starts below', 1, 0, 0],
    wind:     ['Wind', '☴', 'wind, and wood growing', 'penetration, patience, and what works by not stopping', 0, 1, 1],
    water:    ['Water', '☵', 'the gorge and the deep', 'danger, depth, and what has to be gone through', 0, 1, 0],
    mountain: ['Mountain', '☶', 'the peak', 'stillness, limit, and the place where a thing stops', 0, 0, 1],
    earth:    ['Earth', '☷', 'the field', 'yielding, carrying, and what receives without insisting', 0, 0, 0]
  };
  var TRIGRAM_ORDER = ['heaven', 'lake', 'fire', 'thunder', 'wind', 'water', 'mountain', 'earth'];

  /* ---------- the sixty four ----------
     [ name, pinyin, lower trigram, upper trigram, judgment, image, movement,
       [six line readings, bottom first] ] */
  var HEX = {
    1: ['The Creative', 'Qian', 'heaven', 'heaven',
      'Pure initiative, and the only hexagram with nothing in it to soften the impulse. It is the strength that begins things, which is also the strength that does not know when to stop.',
      'Heaven doubled: motion that never tires. The old reading is that a person keeps themselves in order the way the sky does, by continuing rather than by forcing.',
      'What are you starting, and is the force behind it yours or borrowed?',
      ['The energy is real and the moment is not here yet. Nothing is lost by waiting.',
       'You have been seen. Being visible changes what is possible and what is expected.',
       'Working all day and uneasy at night. Effort at the edge of what you can sustain.',
       'A choice between rising and staying. Either is correct; being unable to choose is not.',
       'In the open, doing the thing well, and it is recognised. The good position, plainly.',
       'Too high. Force with nothing left to push against turns on the person using it.']],
    2: ['The Receptive', 'Kun', 'earth', 'earth',
      'Pure yielding, which the tradition is careful to say is not weakness: it is capacity. This is the ground that carries what the creative starts, and nothing gets built without it.',
      'Earth doubled: it holds whatever is set on it. The reading is that breadth of character is what lets a person carry things that would break someone narrower.',
      'What are you being asked to carry, and did you agree to it or absorb it?',
      ['Frost underfoot. The first cold is small and it is telling you what season is coming.',
       'Straight, level, wide. What is done without calculation goes further here.',
       'Do the work without needing your name on it. The result stands either way.',
       'A tied sack. Say nothing, claim nothing, and nothing can be held against you.',
       'Quiet authority that does not announce itself. The most fortunate line in the figure.',
       'Yielding pushed past its limit becomes a fight, and nobody wins it.']],
    3: ['Difficulty at the Beginning', 'Zhun', 'thunder', 'water',
      'The hard start. Thunder under water is the first movement inside danger, and the tradition reads the confusion as ordinary rather than as a warning: blades of grass push through hard ground.',
      'Sprouting, tangled. The image is a person sorting threads, putting the chaos in order strand by strand instead of pulling.',
      'What is actually tangled here, and are you pulling at it or unpicking it?',
      ['Hesitation is right. Look for people who know the ground before moving on it.',
       'Held up, and the delay is not refusal. What is declined now can be accepted later.',
       'Hunting with no guide, deeper into the wood. Going on alone is the mistake available here.',
       'Help is there if it is asked for. Asking is the whole of the difficulty.',
       'Give small and it lands. Give large too early and it is misread.',
       'Stuck and weeping. When effort has stopped working, stopping is the move.']],
    4: ['Youthful Folly', 'Meng', 'water', 'mountain',
      'Inexperience, and the tradition puts the responsibility on the learner rather than the teacher. The oracle answers once; asked the same question three times, it stops answering.',
      'A spring at the foot of a mountain, going nowhere yet. The reading is that character is built the way a stream finds its channel, by persisting in one direction.',
      'What are you asking again because you did not like the first answer?',
      ['Discipline first, then freedom. Rules resented early are missed later.',
       'Bearing with the inexperienced, including your own. Patience here is strength, not indulgence.',
       'Do not throw yourself at someone who has something you want. It costs the thing you wanted.',
       'Folly left alone hardens. Isolation is what makes ignorance permanent.',
       'Childlike, not childish. Asking plainly is what makes learning fast.',
       'Correct the error, not the person. Punishment aimed at a person makes an enemy.']],
    5: ['Waiting', 'Xu', 'heaven', 'water',
      'Not passivity. This is waiting with the outcome already decided and only the timing outstanding, which is a different thing from hoping. Danger is ahead and there is nothing to gain by arriving early.',
      'Clouds rise and the rain has not come. The reading is that a person eats, drinks and keeps their strength up, because the waiting is the work.',
      'Are you waiting because it is not time, or because you are avoiding the thing?',
      ['Waiting on open ground, far from it. Keep to what you normally do.',
       'Waiting on sand. Talk starts here. It is noise and it passes.',
       'Waiting in the mud, and you moved too close. Now care is the only option.',
       'Waiting in blood. Out of your depth; get out rather than manage it.',
       'Waiting at the table. A real pause, and it is allowed to be pleasant.',
       'Uninvited guests arrive. Meeting them well turns the ending.']],
    6: ['Conflict', 'Song', 'water', 'heaven',
      'A dispute where both parties are certain. The tradition does not say who is right; it says that carrying it to the end costs more than the thing being fought over.',
      'Heaven going up, water going down: two forces moving apart. The reading is that the work is done at the beginning, in how a thing is set up, so the fight never starts.',
      'What would settling this early cost, and what are you paying to be right?',
      ['Do not carry it on. A little talk and it ends here.',
       'You cannot win this one. Withdraw; there is no dishonour in the count.',
       'Live on what you have and let the credit go elsewhere. It holds.',
       'You could fight and you turn back. Sitting with that is the line.',
       'Brought before someone fair. This is the good outcome and it required a third party.',
       'Winning it, and losing it again three times before the morning is out. A victory that will not stay won.']],
    7: ['The Army', 'Shi', 'water', 'earth',
      'Organised force, and every warning in it is about who leads. Discipline without a person answerable for it becomes a mob, which the tradition treats as worse than losing.',
      'Water inside the earth: strength held out of sight. The reading is that a leader keeps people the way ground keeps water, by holding rather than by driving.',
      'Who is answerable here, and would they say so out loud?',
      ['The army sets out in order. Without order at the start, nothing later fixes it.',
       'In the middle of the force, and trusted. Recognition follows from being there.',
       'Carrying corpses in the wagon. Somebody unfit is in charge.',
       'The army retreats and camps. Withdrawing in order is not defeat.',
       'Deal with what is actually in the field. Choose who acts by fitness, not by seniority.',
       'The work is done; now the rewards. Do not put small people in large positions.']],
    8: ['Holding Together', 'Bi', 'earth', 'water',
      'Union, and the question of whether you belong to what you have joined. The tradition asks the person to examine their own constancy before they ask for anyone else\'s.',
      'Water over the earth, filling every hollow. The reading is that a bond forms by fitting the shape of the thing, not by being pressed onto it.',
      'What are you part of, and did you choose it or arrive in it?',
      ['Sincere from the start, and it fills up quietly. Good comes of it that nobody arranged.',
       'Hold together from the inside. Joining out of need alone does not hold.',
       'Holding together with the wrong people. Common enough, and worth naming.',
       'Openly attached to the one worth being attached to. No concealment needed.',
       'The hunt is driven from three sides and the fourth is left open. Whoever stays, stays freely, and that is the point of leaving it open.',
       'No head to it. Union that begins without a centre has nothing to gather around.']],
    9: ['The Taming Power of the Small', 'Xiao Xu', 'heaven', 'wind',
      'Something small restraining something large, and doing it by persistence rather than strength. The tradition is clear that this holds only for now: the restraint is real and it is temporary.',
      'Wind moves across the sky and does not stop it. The reading is that a person refines the small things, because that is what is actually within reach.',
      'What small and steady thing is holding a large one, and how long can it?',
      ['Returning to your own road. No blame in going back.',
       'Drawn back, and willingly. Being talked out of it was correct.',
       'The wheels come off the wagon; the couple stare at each other. Force applied where agreement was needed.',
       'Sincerity clears the blood and the fear goes with it.',
       'Held by loyalty rather than by arrangement, and better off for what the neighbour has.',
       'The rain has come and it stops. Push now and it turns.']],
    10: ['Treading', 'Lu', 'lake', 'heaven',
      'Conduct in a dangerous position: treading on the tiger\'s tail. The tradition says the tiger does not bite, and the reason is manner, not luck.',
      'Heaven above the lake, a difference in height that cannot be argued with. The reading is that a person acts by knowing where they actually stand.',
      'Where are you standing, and are you behaving as though you know it?',
      ['Simple conduct, going on alone. Plainness is protection here.',
       'Treading a level road. Quiet people do well on it.',
       'Half sighted and certain of the view; half lame and certain of the pace. Ambition running past capacity.',
       'On the tail, and careful, careful. Care carries it through.',
       'Resolute conduct. Correct, and aware it is dangerous.',
       'Look at where you have walked. The whole road is the evidence.']],
    11: ['Peace', 'Tai', 'heaven', 'earth',
      'Heaven below and earth above, so the two are moving toward each other rather than apart. This is the figure of things working, and every line in it is about not wasting the season.',
      'Earth over heaven: the meeting. The reading is that whoever is responsible arranges things so the good conditions reach everybody, because unshared prosperity does not last.',
      'What is going well, and what are you doing with the room it gives you?',
      ['Pull one reed and the roots bring others. Undertakings gather people.',
       'Putting up with the rough part, making the crossing, and not forgetting the people who are far off.',
       'Every level stretch eventually tilts, and everything that goes out comes back. It turns. Eat well in the meantime.',
       'Fluttering down, not from wealth, and the neighbour comes too. Trust without arrangements.',
       'The sovereign gives his daughter in marriage. Rank set aside for the sake of the thing.',
       'The wall falls back into the moat. Now is not the time for armies.']],
    12: ['Standstill', 'Pi', 'earth', 'heaven',
      'The inverse of peace, and the mechanism is the same: heaven rising, earth sinking, the two moving apart. Communication has stopped and effort spent forcing it makes the stop worse.',
      'Heaven over earth, not meeting. The reading is that a person withdraws their worth from view rather than spending it where it will be wasted.',
      'What has stopped, and are you still talking into it?',
      ['Pull one reed and others come. Perseverance brings good fortune even now.',
       'Bearing and enduring. The great person keeps their own quality through it.',
       'They carry shame. Feeling it is the first honest thing here.',
       'Acting on what is actually mandated. Those with you share in it.',
       'The standstill ends. Tie it to a mulberry shoot: still fragile, still tied.',
       'It stops. First it stood still, then it is glad. The end is not the middle.']],
    13: ['Fellowship', 'Tong Ren', 'fire', 'heaven',
      'People joined by something larger than their own group. The tradition is specific that fellowship in the open works and fellowship in the clan does not, because the second is a faction wearing the same word.',
      'Fire under heaven, rising toward it. The reading is that a person sorts things by kind, so that what belongs together is together and what does not is not.',
      'Who is this fellowship actually open to, and who is quietly excluded?',
      ['Fellowship at the gate. In the open, at the start. No blame.',
       'Fellowship in the clan. Humiliation, and the smallness is the reason.',
       'Weapons in the thicket, climbing the hill to watch. Suspicion, three years of it.',
       'On the wall and not attacking. Turning back at the last moment is the good fortune.',
       'They weep first and then laugh. Great forces meet and get through.',
       'Fellowship in the meadow, outside the walls. No remorse, and no great achievement either.']],
    14: ['Great Possession', 'Da You', 'heaven', 'fire',
      'Having a great deal, and the whole figure is about the character required to hold it without being changed by it. Possession here includes standing, attention, and the goodwill of others.',
      'Fire above heaven, seeing far. The reading is that a person curbs what is harmful and lets what is good through, in themselves before anyone else.',
      'What do you have more of than you can carry well?',
      ['No dealings with what is harmful. Awareness of the difficulty keeps it clean.',
       'A big wagon to load. Somewhere to put it, and somewhere to take it.',
       'Offered to the sovereign. A small person could not do this.',
       'Not making a display of it. That is the whole of the line.',
       'Sincerity that is met with sincerity, and dignity underneath. Good fortune.',
       'Blessed from heaven. Nothing here works against you.']],
    15: ['Modesty', 'Qian', 'mountain', 'earth',
      'The only hexagram where every line is favourable, which the tradition treats as a statement about the quality rather than a promise about outcomes. A mountain inside the earth: height that does not need to be seen.',
      'Mountain under the earth. The reading is that a person reduces what is too much and adds to what is too little, so that things come out level.',
      'Where are you taking up more room than the thing requires?',
      ['Modest about being modest. A real crossing is open.',
       'Modesty that shows. Constancy is what makes this work.',
       'Working and modest. Carries things to the end.',
       'Nothing here works against you. Modesty in action.',
       'No boasting of wealth. Use force only where it is warranted.',
       'Modesty that speaks. Set your own house in order first.']],
    16: ['Enthusiasm', 'Yu', 'earth', 'thunder',
      'Movement that carries people with it, and the warning attached is that enthusiasm follows the mood of the person leading it. It gathers fast and it disperses fast.',
      'Thunder out of the earth: the storm breaking after the pressure. The reading is that music and honour were made for exactly this, to give a shared feeling somewhere to go.',
      'Whose enthusiasm is this, and what happens to it when they leave the room?',
      ['Enthusiasm that announces itself. Misfortune, and it is early.',
       'Firm as a rock, and not for a whole day. Recognising the turn before it turns.',
       'Looking up and waiting for it from above. Remorse, and hesitation makes it worse.',
       'The source of it. Great things come; do not doubt, friends gather.',
       'Persistently ill and never dying. Chronic, and survivable.',
       'Deluded enthusiasm. If it changes after it has begun, no blame.']],
    17: ['Following', 'Sui', 'thunder', 'lake',
      'Adapting to what is actually happening, which the tradition rates highly and hedges immediately: to be followed a person must first be willing to follow, and what is followed has to be worth it.',
      'Thunder inside the lake, quiet in the season for it. The reading is that a person goes in at nightfall and rests, because following includes following the hour.',
      'What are you following, and would you have chosen it if it had a different name?',
      ['What you are loyal to has shifted. Go out and meet people rather than settling it alone.',
       'Holding on to the small and easy, and losing the person of substance. You cannot keep both.',
       'Holding to the person of substance and letting the easy thing go. That is the trade, and it holds.',
       'People are following you for what they get out of it. Even honestly come by, this needs saying out loud.',
       'Loyal to something genuinely good. Nothing ambiguous in this one.',
       'Bound to it, and the bond honoured publicly. Allegiance that has become a commitment.']],
    18: ['Work on What Has Been Spoiled', 'Gu', 'wind', 'mountain',
      'Something has decayed through neglect rather than through an event, often over a generation. The tradition is unusually practical: it can be repaired, the repair takes a set amount of time, and the days before and after matter.',
      'Wind at the foot of the mountain, stopped and stirring. The reading is that a person rouses people and strengthens what is in them, which is the only durable repair.',
      'What has quietly rotted here, and whose was it before it was yours?',
      ['Repairing what a parent let rot. There is risk in touching it and it comes right.',
       'Repairing what a mother let rot. Do not be rigid about it; this asks for a gentler hand.',
       'Repairing it too vigorously, and regretting the manner rather than the act. The work stands.',
       'Tolerating the decay. Carry on this way and you will be ashamed of it later.',
       'The repair is made and it is recognised. Credit for the work nobody else wanted.',
       'Serving no king and no prince. Stepping out of the arrangement to work on something larger.']],
    19: ['Approach', 'Lin', 'lake', 'earth',
      'Something favourable coming nearer, and a date attached to it: in the eighth month there will be misfortune. The tradition puts a clock on good conditions on purpose, so the season is used rather than assumed.',
      'Earth above the lake, the bank over the water. The reading is that a person teaches without running out of patience, and protects people without a limit on it.',
      'What is approaching, and what will you have wanted to have done by then?',
      ['Approaching together, and welcomed. The joint move is the right one.',
       'Approaching together, and nothing here works against you.',
       'Approaching because it is comfortable. Notice that honestly and the fault clears.',
       'Approaching all the way, without keeping part of yourself back.',
       'Approaching wisely: choosing people and then letting them work.',
       'Approaching generously. Good fortune, and no fault in the size of it.']],
    20: ['Contemplation', 'Guan', 'earth', 'wind',
      'Looking, and being looked at. The figure is a tower you can see from and be seen from, and the tradition treats the second half as the more serious: what is watched is what is copied.',
      'Wind over the earth, going everywhere. The reading is that the old rulers travelled the regions and looked at the people, and taught from what they saw rather than from what they assumed.',
      'What is being learned from watching you that you did not intend to teach?',
      ['Looking at it like a child. Harmless in someone with no responsibility, humiliating in someone with it.',
       'Watching through a crack in the door. Enough for a narrow life; not enough for this one.',
       'Looking at your own life to decide whether to go on or turn back. The honest audit.',
       'Seeing how a place is actually run, from inside it. A guest with real access.',
       'Looking at your own life and judging it by its effects rather than its intentions.',
       'Looking at the life from outside, as a stranger would. Freed of needing to be the one living it.']],
    21: ['Biting Through', 'Shi He', 'thunder', 'fire',
      'An obstruction between two parts that ought to meet, and the remedy is to bite through it rather than around it. This is the hexagram of law, penalties, and saying the hard thing.',
      'Thunder and lightning together. The reading is that the old kings made the penalties clear and enforced the laws, so that people knew the shape of the thing before they met it.',
      'What is in the way, and are you biting through it or working around it?',
      ['A small correction, made early, while it is still only about a foot in the stocks.',
       'Overdoing a correction that was justified. Biting soft meat and going in up to the nose.',
       'Biting into something old and hitting rot. Some embarrassment; nothing lasting.',
       'Biting through gristle and finding metal in it. Difficult, and knowing it is difficult is what carries it.',
       'Biting through dried meat and finding gold. The reward is inside the hard part.',
       'Warnings that stopped being heard a long time ago. The ears have gone with the yoke.']],
    22: ['Grace', 'Bi', 'fire', 'mountain',
      'Form, decoration, the way a thing is presented. The tradition allows it real value in small matters and refuses it in large ones: grace can make something clearer and cannot make it true.',
      'Fire at the foot of the mountain, lighting it. The reading is that a person clears up the day\'s affairs by it and does not decide grave cases by it.',
      'What is being made to look better here, and does that change what it is?',
      ['Leaving the carriage and walking. Choosing the plain way on purpose.',
       'Decoration with nothing underneath it yet. Grace in the beard.',
       'Graceful and comfortable in it. Constancy is what keeps this from turning into vanity.',
       'Plainness, and a white horse coming. Not a raider: someone arriving to ask.',
       'The gift is embarrassingly small. Sincerity outlasts the size of it.',
       'Grace in plain white. Ornament that has come all the way round to nothing.']],
    23: ['Splitting Apart', 'Bo', 'earth', 'mountain',
      'Something being worn away from below, line by line, until only the top remains. The tradition does not counsel resistance here; it counsels not moving, because the season is the thing acting.',
      'The mountain rests on the earth and is being undermined. The reading is that those above secure their position by being generous to those below, since that is the part being eroded.',
      'What is being worn away, and is this a thing to fight or to wait out?',
      ['It starts at the bottom, out of sight, where the bed splits at the leg.',
       'It is closer now, and still under the surface.',
       'Splitting away, and no fault in it. Separating from company that was pulling you down.',
       'It has reached the person. Nothing ambiguous left in it.',
       'Order arriving from an unexpected quarter, through the household rather than the court.',
       'One large fruit left uneaten. The seed survives the season that took everything else.']],
    24: ['Return', 'Fu', 'thunder', 'earth',
      'The turn at the bottom of the year: one yang line returning underneath five yin. The tradition is emphatic that this is not forced and not hurried, and that it comes back on its own schedule.',
      'Thunder inside the earth at the solstice. The reading is that the old kings closed the passes at that time and merchants did not travel, because a returning thing is protected by rest.',
      'What is coming back, and are you letting it arrive at its own pace?',
      ['Turning back after a short distance. Nothing to regret; caught early.',
       'Turning back quietly, without ceremony. The good fortune is in the lack of drama.',
       'Turning back over and over. Risky as a habit, and no fault in it.',
       'Walking among others and turning back alone. They were going somewhere you are not.',
       'Turning back generously. Owning it without needing the moment to be about you.',
       'Missing the turn entirely. This is the one whose effects run for years.']],
    25: ['Innocence', 'Wu Wang', 'thunder', 'heaven',
      'The unexpected, and acting without a second motive. The tradition warns that if a person is not upright here they will meet misfortune, and that the misfortune will look like bad luck rather than consequence.',
      'Thunder under heaven, everything moving in its own way. The reading is that the old kings, rich in virtue, nourished all beings in time with the season.',
      'What are you doing for its own sake, and what has a second reason under it?',
      ['Acting on the unforced impulse, because nothing was calculated into it.',
       'Not counting the harvest while you are still ploughing. Then it is worth undertaking.',
       'Undeserved trouble: the cow is tied up and a passer-by takes it. Someone else gains and you carry it.',
       'What can honestly be held to, hold to. No fault in the holding.',
       'Illness with no cause you can find. Do not medicate it. It passes.',
       'Acting innocently and getting it wrong. Nothing to gain here. Not the season for it.']],
    26: ['The Taming Power of the Great', 'Da Xu', 'heaven', 'mountain',
      'Great force held and stored rather than spent, which the tradition treats as the harder discipline. Held strength renews daily; spent strength does not.',
      'Heaven inside the mountain. The reading is that a person learns many sayings and deeds of the past, and by that strengthens what they are.',
      'What are you holding rather than spending, and is it accumulating or just waiting?',
      ['Danger, and it is present now. Stop rather than manage it.',
       'The axle taken out of the wagon. Stopped on purpose, not broken.',
       'A good horse keeping pace with others. Awareness of the risk, and practice every day.',
       'A board fixed on the young bull, before the horns are grown. Prevention while prevention is cheap.',
       'The tusk of a gelded boar. The force is all still there and the danger in it is not.',
       'The road opens. What was held back becomes available, and it was held back for this.']],
    27: ['Nourishment', 'Yi', 'thunder', 'mountain',
      'The open mouth, and what goes into it. The tradition reads it two ways at once and means both: what a person eats, and what they take in as attention, company and language.',
      'Thunder at the foot of the mountain. The reading is that a person is careful with their words and moderate in what they consume, since both are the same act.',
      'What are you taking in, and would you choose it if you were paying attention?',
      ['Setting down what feeds you to watch someone else eat. Envy, and it costs you what you had.',
       'Turning off the path to be fed from higher up. Going on this way does not end well.',
       'Turning away from what actually feeds you. Ten years of nothing coming of it.',
       'Hungry, and honest about it, and looking about with sharp eyes. That is allowed here.',
       'Off the path, and staying put. Not the season for a big crossing.',
       'Being the source others are fed from. Knowing how dangerous that is is what makes it work.']],
    28: ['Preponderance of the Great', 'Da Guo', 'wind', 'lake',
      'A ridgepole bending under the weight it carries. Something has grown too heavy in the middle and too weak at the ends, and the tradition says extraordinary times allow extraordinary measures.',
      'The lake rises over the trees. The reading is that a person stands alone without fear and withdraws from the world without regret, because the situation genuinely requires it.',
      'What is bearing more than it was built for?',
      ['White rushes laid down underneath. Extreme care at the start, and no fault in the caution.',
       'A dry poplar putting out shoots at the root. An unlikely pairing, and it works.',
       'The ridgepole sags to the point of breaking. Weight in the wrong place.',
       'The ridgepole braced. Good, and other motives in the bracing spoil it.',
       'A withered poplar in flower. Nothing wrong in it, and nothing to praise either.',
       'Wading on until the water closes over your head. Misfortune, and no blame: the cause was worth it.']],
    29: ['The Abysmal', 'Kan', 'water', 'water',
      'Danger doubled, and the only hexagram whose advice is to go through rather than around. Water fills the hole and continues; it does not lose its nature in the gorge.',
      'Water flowing on without stopping. The reading is that a person acts with consistent virtue and practises the work of teaching, because what carries a person through repetition is habit.',
      'What are you in the middle of, and is going through it the way out?',
      ['Danger repeating, and a pit inside the pit. The second one is the one that gets you.',
       'Go for small gains only. Nothing here rewards ambition.',
       'Forward and back, and a pit either way. Stop, rather than choose badly.',
       'Wine in a jar, rice in a bowl, passed in at the window. Plain help, plainly given, and it is enough.',
       'It fills to the rim and no further. Danger with a limit on it.',
       'Tied up and shut behind thorns. Three years lost, and the loss is the whole line.']],
    30: ['The Clinging', 'Li', 'fire', 'fire',
      'Fire doubled: brightness, and the fact that it depends on what it burns. Clarity here is real and it is not self-sustaining, which is the whole difficulty of the figure.',
      'Brightness rising twice. The reading is that a great person, by continuing the light, illuminates the four quarters, and that this is a practice rather than a possession.',
      'What is your clarity resting on, and what happens to it when that goes?',
      ['The footprints cross each other at the start of the day. Compose yourself first.',
       'Yellow light: the colour of the middle. The best line in the figure.',
       'The sun going down, and people either sing or complain about being old. Which you do is the reading.',
       'It flares, burns out, and is thrown away. Brightness with nothing under it.',
       'Weeping and lamenting, and good fortune in it. Grief let out rather than held.',
       'Deal with what caused it and let the rest go. The leaders are taken, not the followers.']],
    31: ['Influence', 'Xian', 'mountain', 'lake',
      'Mutual attraction, and the figure of courtship. The tradition is precise that influence works by keeping still inside while remaining open outside, and that pursuit closes the thing it wants.',
      'A lake on the mountain. The reading is that a person keeps their mind receptive by staying empty of assumptions about the other.',
      'What is drawing you, and are you moving toward it or pulling at it?',
      ['An intention, and nothing more than that yet.',
       'Moving before the rest of you agrees. Staying put is better.',
       'Following whatever moves. Going along with it will embarrass you.',
       'Constancy is what makes this good. Restlessness reaches only the people already close to you.',
       'Firm, unglamorous, nothing to regret.',
       'Talk, and only talk. Influence that got as far as the tongue.']],
    32: ['Duration', 'Heng', 'wind', 'thunder',
      'What lasts, and the tradition is careful that lasting is not standing still. The sun and moon endure by moving; a thing that endures does so by renewing its own shape.',
      'Thunder and wind: enduring together. The reading is that a person stands firm and does not change their direction, which is different from not changing their method.',
      'What here is meant to last, and is it renewing or just repeating?',
      ['Demanding permanence too early. Wanting it settled is what stops it settling.',
       'The regret lifts. There is enough strength here for the length of it.',
       'Giving your character no continuity. People stop knowing what to expect, and that is the cost.',
       'No game in the field. Looking steadily in a place where there is none.',
       'Constancy in character. The old text splits this by role; that is the tradition, not the reading.',
       'Restlessness made permanent. Motion is not the same thing as duration.']],
    33: ['Retreat', 'Dun', 'mountain', 'heaven',
      'Withdrawing while withdrawal is still a choice. The tradition rates this as strength rather than flight: a retreat made in time keeps everything that a retreat made late loses.',
      'The mountain rises and heaven withdraws upward. The reading is that a person keeps small-minded people at a distance without hostility, by being unmistakably dignified.',
      'What are you staying in past the point where leaving was clean?',
      ['At the tail of the retreat, and exposed. Do not start anything now.',
       'A grip nobody is going to loosen. Held, and held deliberately.',
       'A retreat that stalls, and it is distressing. Keep people near you for the ordinary work.',
       'Retreating by choice. Straightforward for someone who can; a stumbling block for someone who cannot.',
       'Retreating on good terms. Constancy is what makes this one land well.',
       'Retreating cheerfully. Nothing left behind that is still holding on.']],
    34: ['The Power of the Great', 'Da Zhuang', 'heaven', 'thunder',
      'Great strength arriving, and every line warns about the same thing: force is available and using it is usually the error. Power that has to be demonstrated is not yet power.',
      'Thunder in the sky above. The reading is that a person does not walk in ways that are not proper, which is the only restraint strong enough to hold this much energy.',
      'What could you force here, and what would forcing it cost that waiting would not?',
      ['Power down in the toes. Going on from here is a mistake, and a certain one.',
       'The strength is real and it is not being spent. Constancy.',
       'The small person leads with force and the person of character does not. A goat butts a hedge and sticks.',
       'The hedge opens and the horns come free. The regret lifts.',
       'Losing the goat easily. Nothing to regret in letting the force go.',
       'Stuck in the hedge, unable to go forward or back. Seeing the difficulty is what gets you out.']],
    35: ['Progress', 'Jin', 'earth', 'fire',
      'The sun coming up over the land: advancement that is visible, rapid, and rewarded. The tradition attaches no warning about the rise itself, only about being seen to want it.',
      'Brightness over the earth. The reading is that a person brightens their own bright virtue, which is the part of advancement nobody can award or take back.',
      'What is rising for you, and are you letting it be seen or making it be seen?',
      ['Advancing, and turned back. Not being trusted yet is not a fault.',
       'Advancing, and sorrowing while you do it. Support comes from an older quarter.',
       'Everyone agrees with the move. The regret lifts.',
       'Advancing by hoarding, and always visible while you do it. Constancy here is dangerous.',
       'Stop weighing gain and loss, and the way opens.',
       'Advancing with the horns down. Use it on your own house only. No fault, and no dignity in it.']],
    36: ['Darkening of the Light', 'Ming Yi', 'fire', 'earth',
      'The sun gone under the earth. A time when being right is not safe to say, and the tradition\'s counsel is to keep the light rather than to shine it.',
      'Brightness sunk into the earth. The reading is that a person mixing with a crowd veils their brilliance and still does not lose it.',
      'What do you know here that it is not yet safe to say?',
      ['In flight with the wings hanging. Three days without eating, and people talk about it.',
       'Wounded, and rescued, and the rescue has real strength behind it.',
       'The leader is taken in the hunt. Do not expect it all to right itself at once.',
       'Getting to the heart of it, and then out through the gate before it closes.',
       'Hiding the light and keeping it lit. Constancy is the whole instruction here.',
       'Not light but dark. Climbing to heaven first, and then falling.']],
    37: ['The Family', 'Jia Ren', 'fire', 'wind',
      'The household, and the claim underneath it: what a person is inside their own walls is what they will be outside them. Order at home is not a private matter in this reading.',
      'Wind coming out of fire. The reading is that a person\'s words have substance and their conduct has duration, which is what makes a family hold.',
      'What is the actual rule in this house, as opposed to the stated one?',
      ['Firm limits inside the house from the start. The regret is spared later.',
       'Staying at the centre of the household and keeping it fed. Constancy, in the least glamorous form there is.',
       'Too harsh a tone brings regret and works anyway. Too much laughter and the house loses its shape.',
       'The one who holds the wealth of the house. Great good fortune, and it is administrative.',
       'Coming to your family the way a ruler comes: without fear, and without needing to rule.',
       'Work that commands respect on its own. Good fortune at the end, and the end is the point.']],
    38: ['Opposition', 'Kui', 'lake', 'fire',
      'Two things that will not combine: fire rising, water sinking. The tradition does not resolve the opposition, it says small things can be done inside it, and that difference is not the same as enmity.',
      'Fire above, the lake below. The reading is that a person keeps their own individuality even where the general run of things agrees.',
      'What is opposed here, and does it actually need to be reconciled?',
      ['If the horse is lost, do not chase it. It comes back on its own.',
       'Meeting the person you needed in a back street. Not the arranged meeting, and it counts.',
       'A bad start: dragged back, halted, humiliated. There is an end to it.',
       'Isolated by the opposition, then meeting someone who sees it the same way. Good faith on both sides.',
       'The companion bites through the wrapping and gets to it. The regret lifts.',
       'Seeing a mud-covered pig and a cart full of devils. It is not a raider: it is someone coming to ask.']],
    39: ['Obstruction', 'Jian', 'mountain', 'water',
      'Water on the mountain: a real obstacle, in front and not going away. The whole hexagram turns on one instruction, which is to stop and look at yourself rather than at the obstruction.',
      'Water on the mountain. The reading is that a person turns their attention around and works on their own character, because that is the part available to be changed.',
      'What is in the way, and what in you is making it larger than it is?',
      ['Going forward meets the obstruction; coming back meets praise. The direction is the reading.',
       'One barrier and then the next, and none of it your doing. Serving something larger, and paying for it.',
       'Going forward meets it, so you come back. That is not defeat.',
       'Going forward meets it; coming back finds company. What you need is behind you.',
       'At the worst of it, friends arrive. The obstruction is what brought them.',
       'Coming back opens the whole thing. Go and see the person who can actually help.']],
    40: ['Deliverance', 'Jie', 'water', 'thunder',
      'The storm breaking and the tension going with it. The tradition is specific about the two rules of a release: go back to ordinary life quickly, and if anything is still to be done, do it early.',
      'Thunder and rain. The reading is that a person forgives mistakes and deals gently with what was done wrong, because the season for severity has just ended.',
      'What has just been released, and are you still braced for it?',
      ['Nothing to answer for. The release is clean.',
       'Three foxes taken in the field. The reward is in the middle of the work, not after it.',
       'Carrying a load on your back while riding in a carriage. Displaying it invites someone to take it.',
       'Freeing yourself from the small attachment you did not think mattered. Then the right company arrives.',
       'Freeing yourself is the proof. Nothing you say to the people around you does what this does.',
       'The hawk taken off the high wall in one shot. The obstacle removed at the top.']],
    41: ['Decrease', 'Sun', 'lake', 'mountain',
      'Deliberate reduction, and the tradition treats it as an exchange rather than a loss: something below is decreased so that something above is increased. Two small bowls are enough for the offering.',
      'The lake at the foot of the mountain. The reading is that a person controls their anger and restrains their appetites, which is the decrease that is actually within reach.',
      'What are you reducing, and what is it being given to?',
      ['Finishing your own business quickly and going to help. Think about how much to take from others while you do it.',
       'Holding steady, and starting something new now is the mistake. Add to others without subtracting from yourself.',
       'Three walking together lose one; one walking alone finds a companion. The number settles itself.',
       'Reducing your own faults is what makes the other person hurry over. The fastest thing in the figure.',
       'Enriched, and nobody can prevent it. Great good fortune arriving without your arrangement.',
       'Increased without anyone being reduced for it. Nobody paid for this.']],
    42: ['Increase', 'Yi', 'thunder', 'wind',
      'The opposite exchange: something above is decreased so that something below is increased, and the tradition says this is the season for large undertakings and for crossing water.',
      'Wind and thunder together. The reading is that a person, seeing good, imitates it, and having faults, gets rid of them, which is the only increase that compounds.',
      'What is being added to you, and what are you doing with it while it lasts?',
      ['The moment for something large. Great good fortune, and no fault in the scale of it.',
       'Enriched, and nobody can prevent it. Constancy is what keeps hold of it.',
       'Enriched by events nobody would have chosen. No fault, if you are honest and keep to the middle.',
       'Keeping to the middle, and reporting upward, and being followed. Useful for moving something large.',
       'A kind heart, and no need to ask whether it shows. Great good fortune.',
       'Increasing nobody, and then being struck at. A heart that never settled anywhere.']],
    43: ['Breakthrough', 'Guai', 'heaven', 'lake',
      'A resolute decision, and the tradition surrounds it with caution: announce it truthfully at court, do not resort to arms, and know that the danger in a breakthrough is the person making it.',
      'The lake risen up to heaven. The reading is that a person distributes riches downward and refrains from resting on their own virtue.',
      'What are you about to break through, and are you doing it cleanly or angrily?',
      ['Strong in the toes and going anyway. Not equal to it, and that becomes the fault.',
       'A cry of alarm in the night, and nothing to fear. Prepared, so the alarm passes through.',
       'Strong in the face, going alone, caught in the rain and resented for it. No fault in the soaking.',
       'Walking is hard and you are being led like a sheep. The regret lifts; the advice is not believed.',
       'Dealing with weeds takes resolution. Keep to the middle while you do it.',
       'No warning cry, and misfortune at the end. The one thing left undealt with is the one that returns.']],
    44: ['Coming to Meet', 'Gou', 'wind', 'heaven',
      'One yin line returning underneath five yang: something small entering something large, unnoticed and consequential. The tradition\'s counsel is not alarm but attention, and not to give it more room than it has taken.',
      'Wind under heaven. The reading is that the prince acts by disseminating his commands to the four quarters, because what enters quietly is answered by being clear everywhere.',
      'What has entered here that nobody decided to let in?',
      ['Braked early, while braking is still possible. Let it run and it turns thin and bad.',
       'Contain it rather than share it. This is not for guests.',
       'Walking is hard. Aware of the danger, and no great fault comes of it.',
       'What you meant to contain has gone. That is the misfortune, and it happened while you were deciding.',
       'Character kept covered, and it falls to you from above rather than being claimed.',
       'Meeting it head down, with the horns. Humiliating, and no fault: force applied to a meeting.']],
    45: ['Gathering Together', 'Cui', 'earth', 'lake',
      'People collecting around a centre, and the tradition puts two things at the centre: a person answerable for it, and something larger than any of them that they are gathered around.',
      'The lake over the earth. The reading is that a person keeps their weapons in repair to meet the unforeseen, because a gathering is exactly where the unforeseen arrives.',
      'What is at the centre of this gathering, and would it hold without the person holding it?',
      ['Sincere, and not to the end. Confusion first, then the gathering. Call out and it turns.',
       'Letting yourself be drawn. Even a small offering is enough here.',
       'Gathering amid sighs. Nothing here works. Going is not a fault, and it is slightly humiliating.',
       'Great good fortune, and no fault. It arrives, and it is not yours by right.',
       'A position in it, and some are not convinced yet. Steady constancy, and the regret lifts.',
       'Lamenting, and streams of tears. No fault: the grief belongs to the gathering.']],
    46: ['Pushing Upward', 'Sheng', 'wind', 'earth',
      'Wood growing up out of the earth: gradual, unforced, and reliably rewarded. This is the least dramatic of the favourable hexagrams and the tradition says its advance is the most certain.',
      'Wood growing upward out of the earth. The reading is that a person heaps up small things in order to achieve something high and great.',
      'What are you building slowly enough that it will actually hold?',
      ['Pushing upward and welcomed. Great good fortune, at the very bottom of the figure.',
       'Sincere, and a small offering is enough. No fault in the size of it.',
       'Pushing upward into an empty city. Nothing in the way, and nothing there either.',
       'Recognised at the height. Good fortune, and no fault in accepting it.',
       'Pushing upward by steps. The whole flight, one at a time.',
       'Pushing upward in the dark. Constancy in what does not stop, and only that.']],
    47: ['Oppression', 'Kun', 'water', 'lake',
      'The lake with the water drained out of it: exhaustion, and being unable to be heard. The tradition\'s specific warning is that in this state what a person says is not believed, so acting matters more than explaining.',
      'A lake with no water. The reading is that a person stakes their life on following their will, because that is the one thing oppression cannot take.',
      'What is draining here, and who has stopped listening?',
      ['Sitting under a bare tree, straying into a dark valley. Three years without being seen.',
       'Worn down in the middle of plenty. The recognition arrives; make the offering, and do not set out.',
       'Leaning on thorns, and coming home to an empty house. Misfortune, and it is the low point.',
       'Coming very quietly, and hemmed in even in comfort. Humiliating, and it comes to an end.',
       'Cut at from above, and joy comes back slowly. Make the offering rather than the argument.',
       'Tangled in creepers, moving uncertainly. Say that moving brings regret, and then move: it goes well.']],
    48: ['The Well', 'Jing', 'wind', 'water',
      'The town moves and the well does not. The tradition uses it for what a community draws on and does not own: the source is unchanged by who is using it, and it can be neglected until it silts up.',
      'Water over wood. The reading is that a person encourages people at their work and exhorts them to help one another, because a well serves by being shared.',
      'What is the well here, and who has been maintaining it?',
      ['Mud in the well, and nobody drinks. An old well, and not even the animals come.',
       'The water goes to the fish and the jug leaks. Everything reaching everywhere except where it was meant to.',
       'The well is cleared and nobody drinks from it. The sorrow in the figure: fit to use, and unused.',
       'The well is being lined. Work that produces nothing today and makes the well permanent.',
       'A clear cold spring, and it is drunk from. What the whole figure was for.',
       'Drawn from and not covered over. Great good fortune, and it is in leaving it open.']],
    49: ['Revolution', 'Ge', 'fire', 'lake',
      'Molting: the skin coming off because the animal has outgrown it. The tradition is strict about timing, saying belief only arrives on the day it is actually done, and that a change made early is not believed at all.',
      'Fire in the lake. The reading is that a person sets the calendar in order and makes the seasons clear, because a revolution that nobody can date is a rumour.',
      'What has actually outgrown its shape, and is today the day?',
      ['Wrapped and bound, and not yet the moment. Everything here is waiting.',
       'When your own day comes, then change it. Setting out now is right and no fault.',
       'Setting out is a mistake and constancy is dangerous. When the talk has gone round three times, commit.',
       'The regret lifts, and people believe it. Changing the form of the thing is what works.',
       'Changing like a tiger: unmistakable, and believed before anyone asks for proof.',
       'The person of character changes deeply; the small person only changes expression. Stay with it rather than setting out.']],
    50: ['The Cauldron', 'Ding', 'wind', 'fire',
      'The vessel that cooks the offering: the figure of culture, of transformation by slow heat, and of a thing whose whole purpose is to hold something else well.',
      'Fire over wood. The reading is that a person consolidates their fate by making their position correct, the way a cauldron stands only because its legs are placed right.',
      'What is being slowly transformed here, and is the vessel sound?',
      ['Tipped over to empty the residue out. An undignified start that clears the way for the use.',
       'There is food in it, and others are envious and cannot reach it. Good fortune.',
       'The handle is altered and the way is blocked, and the best of it goes uneaten. Rain comes, and it comes right.',
       'The legs break and the meal is spilled. Carrying more than the structure holds.',
       'Yellow handles and golden rings: the fittings are right at last. Constancy is what this asks for.',
       'Rings of jade. Great good fortune, and nothing here works against you.']],
    51: ['The Arousing', 'Zhen', 'thunder', 'thunder',
      'Shock doubled. The tradition\'s striking claim is that the person who is genuinely composed laughs and talks while everyone around them is terrified, and does not drop the sacrificial spoon.',
      'Thunder repeated. The reading is that a person, in fear and trembling, sets their life in order and examines themselves, which is what shock is for.',
      'What has just startled you, and what does it show you about what you were assuming?',
      ['The shock comes, and there is fear, and afterwards laughter. The fear was the useful part.',
       'Shock with danger in it, and a great deal lost. Do not chase it. It comes back in seven days.',
       'Shock, and it unsettles you. Move under it and nothing goes wrong.',
       'Shock that sinks into the mud. The energy arrives and goes nowhere.',
       'Shock going back and forth, and danger, and nothing actually lost. There are still things to be done.',
       'Shock bringing ruin, and looking around terrified. If it has not reached you, no fault, and people will have things to say.']],
    52: ['Keeping Still', 'Gen', 'mountain', 'mountain',
      'Stillness doubled, and the tradition means something exact by it: the back, which does not perceive. Keeping still where the self is not involved, so that a person can act without their ego being in the way.',
      'Mountains standing close together. The reading is that a person does not permit their thoughts to go beyond the situation they are actually in.',
      'What are you turning over that has already ended, or has not begun?',
      ['Stillness from the ground up, before anything has been committed. No fault in stopping this early.',
       'The legs are still and the one above is not stopping. Stillness that cannot save what it is attached to.',
       'Stiffening the spine to force it. Dangerous: the heart suffocates.',
       'Stillness that has reached the middle of you. No fault, and no strain in it.',
       'The jaws still, and the words have order. The regret lifts.',
       'Stillness with a whole character behind it. The top of the figure, and the good fortune.']],
    53: ['Development', 'Jian', 'mountain', 'wind',
      'Gradual progress, the way a tree grows on a mountain: slow, in stages, and impossible to hurry without ruining. The tradition uses the wild goose\'s migration for it, one landing at a time.',
      'A tree on the mountain. The reading is that a person abides in dignity and virtue in order to improve the general customs, which is itself a slow business.',
      'What is developing at its own pace, and where are you pushing it?',
      ['The goose reaches the shore. The young one is exposed, and there is talk, and no fault.',
       'The goose reaches the cliff. Eating and drinking in peace. Good fortune.',
       'The goose reaches the plateau, and the pair are separated. Misfortune. Fend off what is circling.',
       'The goose reaches the tree, and may find a flat branch on it. No fault: an unnatural perch that holds.',
       'The goose reaches the summit. Three years of nothing, and in the end nothing prevents it.',
       'The goose reaches the cloud heights. What it leaves behind is used in the ceremony.']],
    54: ['The Marrying Maiden', 'Gui Mei', 'lake', 'thunder',
      'Entering a relationship from the weaker position and without a settled place in it. The tradition is unusually blunt here: undertakings bring misfortune, and the counsel is to understand the arrangement rather than to improve it.',
      'Thunder over the lake. The reading is that a person understands the transitory in the light of the eternity of the end.',
      'What position are you actually entering here, as opposed to the one you were offered?',
      ['Coming in at the lowest rank, and able to move anyway. Undertakings work from here.',
       'Half sighted and still seeing. The constancy of someone doing it alone.',
       'Coming in with no standing at all, and taking what is offered. The bottom of the arrangement.',
       'The time is drawn out. What comes late comes in its own season.',
       'The plainer garment is the one with rank inside it. The moon nearly full: enough, and not overfull.',
       'The basket with no fruit, the blade with no blood. The form of the thing performed and nothing in it.']],
    55: ['Abundance', 'Feng', 'fire', 'thunder',
      'Fullness at its peak, with the sun at midday inside it. The tradition puts the warning in the same sentence as the blessing: what is at noon begins to set, and this is not a reason for grief.',
      'Thunder and lightning together. The reading is that a person decides lawsuits and carries out punishments, because clarity and movement are both present at once.',
      'What is at its fullest right now, and are you spending it or hoarding it?',
      ['Meeting the one you are matched with. Ten days together, and no mistake in it.',
       'Screened so heavily that stars show at noon. Going out meets mistrust; sincerity is what moves them.',
       'The growth so thick that the small stars show at noon, and the right arm breaks. No fault.',
       'Stars at noon again, and this time meeting an equal. Good fortune.',
       'What is coming brings recognition with it. Good fortune, and it arrives rather than being taken.',
       'The house at its fullest and screened off. Three years and nobody seen. Abundance turned into a wall.']],
    56: ['The Wanderer', 'Lu', 'mountain', 'fire',
      'A stranger passing through, with no standing and no claim on anyone. The tradition says success in small things only, and that the wanderer\'s safety is made entirely of their own conduct.',
      'Fire on the mountain, burning through and moving on. The reading is that a person is clear-minded and cautious in imposing penalties, and does not protract lawsuits.',
      'Where are you a stranger, and are you behaving like one?',
      ['Fussing over small things in a place you are only passing through. That is how the trouble starts.',
       'Reaching an inn with your property intact, and earning someone loyal. The good line in the figure.',
       'The inn burns and the loyalty goes with it. Danger, and it was avoidable.',
       'A place to stay, the property back, and the means to defend it, and the heart is not glad.',
       'One shot, one bird, and the arrow lost. In the end it brings both praise and position.',
       'The nest burns. Laughing first and weeping after. What was held carelessly is gone.']],
    57: ['The Gentle', 'Xun', 'wind', 'wind',
      'Wind doubled: penetration by persistence rather than by force. The tradition attaches the image of something that gets in everywhere by not stopping and by not announcing itself.',
      'Winds following one upon the other. The reading is that a person spreads their commands abroad and carries out their undertakings, which works here only by repetition.',
      'What are you trying to force that would yield to being asked repeatedly?',
      ['Advancing and retreating in the same motion. The constancy of a disciplined person is what is wanted.',
       'Working underneath, out of sight, and calling in a great deal of help. Good fortune and no fault.',
       'Asking again and again. Humiliating: the same question until the answer is the wanted one.',
       'The regret lifts, and the work takes everything it was sent for.',
       'No beginning, and an end. Three days before it and three days after: that is where the care goes.',
       'Working underneath and losing both the property and the means of defending it. Constancy here brings misfortune.']],
    58: ['The Joyous', 'Dui', 'lake', 'lake',
      'Openness doubled, and the tradition means conversation as much as pleasure: the lake is the trigram of the mouth. Joy that is genuine spreads, and joy that is courted is the failure mode of the figure.',
      'Lakes resting one on the other. The reading is that friends discuss and practise together, because that is the form of joy that renews rather than exhausts.',
      'What here is genuinely gladdening, and what are you performing?',
      ['Contented gladness. Good fortune, and nothing performed in it.',
       'Sincere gladness. Good fortune, and the regret lifts.',
       'Gladness gone looking for itself outside. Misfortune, and the direction is the reason.',
       'Gladness weighed up and not yet at peace. Get rid of the fault and the gladness arrives.',
       'Trust placed in what is on its way out. Dangerous, and the danger is in the sincerity.',
       'Being led by what is pleasant. The line stops there, without a verdict, on purpose.']],
    59: ['Dispersion', 'Huan', 'water', 'wind',
      'Dissolving what has hardened: rigidity, egotism, a division between people that has set. The tradition treats this as a religious act, and the wind over water is the image of something breaking up ice.',
      'Wind moving over water. The reading is that the old kings sacrificed to the Lord and built temples, because what gathers a scattered people is something above all of them.',
      'What has hardened here, and what would dissolve it rather than break it?',
      ['Help brought early, with real strength behind it. Good fortune.',
       'At the breaking up, going quickly to what holds you. The regret lifts.',
       'Dissolving the self. No regret, and it is the hardest line here.',
       'Dissolving the group, and great good fortune. Scattering is what makes the gathering possible.',
       'The great cry, and everything pouring out. What holds through it holds without fault.',
       'Getting out, and keeping a distance. No fault in the leaving.']],
    60: ['Limitation', 'Jie', 'lake', 'water',
      'The joints of a bamboo: a limit that makes growth possible rather than one that prevents it. The tradition immediately adds that galling limitation must not be persevered in, so the figure limits itself.',
      'Water over the lake. The reading is that a person creates number and measure, and examines the nature of virtue and correct conduct.',
      'What limit are you keeping, and is it the useful kind or the galling kind?',
      ['Not going out of the door. No fault: the limit is correct while it is correct.',
       'Not going out of the gate. Misfortune: the same restraint, held past the moment for it.',
       'Knowing no limit, and having cause to regret it. No fault in whom it lands on.',
       'A limit you are content inside. That is what makes it work.',
       'A limit that is not bitter. Good fortune, and going on from it brings esteem.',
       'A limit that galls. Constancy brings misfortune, and the regret lifts once it breaks.']],
    61: ['Inner Truth', 'Zhong Fu', 'lake', 'wind',
      'Sincerity that reaches even what cannot reason: pigs and fishes, the tradition says, which is its way of naming the least persuadable audience there is. The figure is hollow in the middle, like an open heart.',
      'Wind over the lake. The reading is that a person discusses criminal cases in order to delay executions, because certainty is exactly what inner truth makes a person slower about.',
      'What do you actually believe here, underneath what you have been saying?',
      ['Being prepared. Good fortune, and hidden motives underneath make it uneasy.',
       'A crane calling in the shade and its young answering. I have something good; I will share it with you.',
       'Finding a companion, and now drumming, now stopping, now weeping, now singing. Steadiness borrowed from someone else.',
       'The moon nearly full, and the other horse goes astray. No fault in continuing without it.',
       'Truth that binds, and holds the whole thing together. No fault.',
       'A cock crowing at heaven. Constancy brings misfortune: a claim louder than what is under it.']],
    62: ['Preponderance of the Small', 'Xiao Guo', 'mountain', 'thunder',
      'A season for small things done carefully and not for large ones. The tradition gives it the image of a bird that should fly down rather than up, and says the note should be modest.',
      'Thunder on the mountain, loud but not carrying. The reading is that a person is exceedingly humble in conduct, exceedingly restrained in expenditure, and exceptionally sorrowful in mourning.',
      'What small thing done well would be worth more here than the large thing you are planning?',
      ['The bird flying up when the figure says go down. It meets misfortune in the flying.',
       'Passing the higher one and meeting the nearer one. No fault: the smaller meeting is the real one.',
       'Not taking exceptional care, and being struck from behind. Misfortune.',
       'No fault. Meeting without going past. Going on is dangerous; be on guard, do not act, be constant.',
       'Dense clouds and no rain. Taking the one in the cave rather than waiting for the weather.',
       'Passing by without meeting. The bird leaves. This one is named as injury rather than bad luck.']],
    63: ['After Completion', 'Ji Ji', 'fire', 'water',
      'Everything in its correct place, every line where it should be, and the tradition immediately says that this is the most precarious position in the book. Order at its most complete is where disorder starts.',
      'Water over fire. The reading is that a person takes thought of misfortune and arms themselves against it in advance, because nothing else is left to do.',
      'What is finished here, and what are you doing with the part of you that was doing it?',
      ['Braking the wheels, and getting the tail wet. No fault: caught at the start.',
       'What is lost is not worth chasing. It comes back in seven days.',
       'Three years to subdue it, and the wrong people must not be used for it. A long campaign that outlasts enthusiasm.',
       'The finest clothes turn to rags. Be careful all day: the decline is in the maintenance.',
       'The small offering made honestly receives more than the large one made for show.',
       'Head in the water. The crossing is finished and you are still crossing.']],
    64: ['Before Completion', 'Wei Ji', 'water', 'fire',
      'Everything out of place and the transition not yet made: the last hexagram in the book, and it ends on incompleteness rather than on arrival. The little fox almost across the stream gets its tail wet.',
      'Fire over water. The reading is that a person is careful in differentiating things, so that each finds its place.',
      'What is nearly across, and what would carelessness at the last step cost?',
      ['Getting the tail wet. Humiliating: moving before the crossing is understood.',
       'Braking the wheels. Constancy brings good fortune, and the brake is the constancy.',
       'Attacking now is a mistake, and even so, a real crossing is worth making.',
       'Constancy, and the regret lifts. Three years of hard work, and the rewards come at the end of them.',
       'Constancy, and nothing to regret. The light is genuine, and it is being read correctly.',
       'Drinking in real confidence. No fault. Getting your head wet at this point is losing it through carelessness.']]
  };

  var INTRO = {
    what: 'The Book of Changes is about three thousand years old and is the oldest thing in this app by two millennia. Sixty four figures, each six lines of yin or yang, each one a description of a situation and how it is moving. It is not a fortune telling device in its own tradition. It is a book about change that is consulted by producing a figure at random and then reading what that figure says about where a thing stands.',
    how: 'You ask something, and six lines are cast from the bottom up. Lines come up young or old; the old ones are changing, and where they change the figure becomes a second one. The first hexagram is the situation now, the changing lines are where the movement is, and the second is where it is going if nothing interferes.',
    caution: 'Nothing here predicts. The figure is produced by chance and the reading is a description written centuries ago about a shape, not about you, and the useful part is almost always the question it makes you ask rather than the answer it seems to give. Ask once. The tradition itself says the oracle stops answering a question that is asked repeatedly until it gives the wanted reply.'
  };

  /* THE TWO METHODS ARE DIFFERENT ORACLES, and this is not a detail.

     Three coins, heads three and tails two, sums six to nine: 6 and 9 arrive
     one time in eight each, 7 and 8 three times in eight. Every line is equally
     likely to change and a change is as likely to go either way.

     Yarrow stalks do not behave like that. The old stalk ritual gives 6 one
     chance in sixteen, 7 five, 8 seven and 9 three. A yarrow reading changes
     less often, and when it changes it is three times more likely to be a yang
     line giving way than a yin line hardening. Whole commentaries rest on that
     asymmetry, so a build that rolled a number from six to nine would be
     quietly answering with a third oracle that nobody has ever used. */
  var METHODS = {
    coins: { label: 'Three coins', note: 'Each line is three coins. Six and nine come up one time in eight, so about one line in four changes.',
      weights: [[6, 1], [7, 3], [8, 3], [9, 1]] },
    yarrow: { label: 'Yarrow stalks', note: 'The older ritual, and a different set of odds: changes are rarer, and a changing line is three times more likely to be yang giving way than yin hardening.',
      weights: [[6, 1], [7, 5], [8, 7], [9, 3]] }
  };

  /* Seeded so a reading re-renders identically and a kept one can be traced to
     the cast that produced it. Mulberry32: small, fast, and good enough for an
     oracle, which is not a cryptographic application. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedFrom(text) {
    var s = 2166136261, t = String(text || '');
    for (var i = 0; i < t.length; i++) { s ^= t.charCodeAt(i); s = Math.imul(s, 16777619); }
    return s >>> 0;
  }

  function castLine(method, rnd) {
    var w = (METHODS[method] || METHODS.coins).weights;
    var total = 0, i;
    for (i = 0; i < w.length; i++) total += w[i][1];
    var pick = rnd() * total, run = 0;
    for (i = 0; i < w.length; i++) { run += w[i][1]; if (pick < run) return w[i][0]; }
    return w[w.length - 1][0];
  }

  /* Six values from six to nine, bottom line first, which is the order they are
     cast in and the order they are read in. */
  function cast(opts) {
    var o = opts || {};
    var method = METHODS[o.method] ? o.method : 'coins';
    var seed = o.seed == null ? seedFrom(String(Date.now()) + Math.random()) : (typeof o.seed === 'number' ? o.seed : seedFrom(o.seed));
    var rnd = rng(seed), values = [];
    for (var i = 0; i < 6; i++) values.push(castLine(method, rnd));
    return { values: values, method: method, seed: seed };
  }

  var YIN = 0, YANG = 1;
  function primaryLines(values) { return values.map(function (v) { return (v === 7 || v === 9) ? YANG : YIN; }); }
  /* Old yang becomes yin, old yin becomes yang. Young lines do not move. */
  function movedLines(values) {
    return values.map(function (v) { return v === 9 ? YIN : v === 6 ? YANG : ((v === 7) ? YANG : YIN); });
  }

  function trigramOf(key) {
    var t = TRIGRAMS[key];
    return { key: key, name: t[0], glyph: t[1], image: t[2], attribute: t[3] };
  }

  /* One hexagram, decorated. gate is the cross link: the Human Design gate of
     the same number IS this hexagram, which is the reason both live here. */
  function hexagram(n) {
    var h = HEX[n];
    if (!h) return null;
    return {
      number: +n, name: h[0], pinyin: h[1],
      lower: trigramOf(h[2]), upper: trigramOf(h[3]),
      judgment: h[4], image: h[5], movement: h[6],
      lines: h[7].slice(),
      bits: bits(n),
      glyphs: TRIGRAMS[h[3]][1] + ' over ' + TRIGRAMS[h[2]][1],
      gate: +n
    };
  }

  function all() {
    var out = [];
    for (var n = 1; n <= 64; n++) out.push(hexagram(n));
    return out;
  }
  function byTrigrams(lowerKey, upperKey) {
    for (var n = 1; n <= 64; n++) {
      if (HEX[n][2] === lowerKey && HEX[n][3] === upperKey) return hexagram(n);
    }
    return null;
  }
  function search(raw, limit) {
    var q = String(raw || '').trim().toLowerCase();
    if (!q) return [];
    var out = [];
    for (var n = 1; n <= 64; n++) {
      var h = HEX[n];
      if (String(n) === q || h[0].toLowerCase().indexOf(q) > -1 || h[1].toLowerCase().indexOf(q) > -1) out.push(hexagram(n));
    }
    return limit ? out.slice(0, limit) : out;
  }

  /* A whole consultation. The changing lines are the reason to cast at all: the
     tradition reads them as where the movement actually is, and a build that
     reported only the two hexagrams would have thrown away the middle of it. */
  function read(opts) {
    var o = opts || {};
    var c = cast(o);
    var p = primaryLines(c.values), m = movedLines(c.values);
    var changing = [];
    c.values.forEach(function (v, i) { if (v === 6 || v === 9) changing.push(i + 1); });
    var pn = numberFor(p), mn = numberFor(m);
    var primary = hexagram(pn);
    var moved = changing.length ? hexagram(mn) : null;
    return {
      question: String(o.question || '').slice(0, 240),
      method: c.method, methodLabel: METHODS[c.method].label, seed: c.seed,
      values: c.values,
      primary: primary,
      changing: changing,
      /* Read in the order the tradition reads them: bottom first. */
      changingLines: changing.map(function (i) {
        return { line: i, value: c.values[i - 1],
          kind: c.values[i - 1] === 9 ? 'yang giving way' : 'yin hardening',
          text: primary.lines[i - 1] };
      }),
      moved: moved,
      /* Said plainly rather than implied by an empty list. */
      stillness: changing.length ? '' : 'No line is changing. The tradition reads that as a situation that is not currently in motion, and the figure is answered by itself.',
      allChanging: changing.length === 6
    };
  }

  /* ---------- structure ---------- */
  function bits(key) {
    var h = HEX[key];
    var lo = TRIGRAMS[h[2]], up = TRIGRAMS[h[3]];
    /* bottom to top: lower trigram then upper */
    return [lo[4], lo[5], lo[6], up[4], up[5], up[6]];
  }

  function numberFor(lines) {
    for (var k in HEX) {
      var b = bits(k), same = true;
      for (var i = 0; i < 6; i++) if (b[i] !== lines[i]) { same = false; break; }
      if (same) return +k;
    }
    return null;
  }

  return {
    VERSION: VERSION, INTRO: INTRO, TRIGRAMS: TRIGRAMS, TRIGRAM_ORDER: TRIGRAM_ORDER,
    METHODS: METHODS, HEX: HEX, bits: bits, numberFor: numberFor,
    rng: rng, seedFrom: seedFrom, cast: cast, read: read,
    hexagram: hexagram, all: all, byTrigrams: byTrigrams, search: search,
    count: Object.keys(HEX).length,
    TAG: 'iching'
  };
}));
