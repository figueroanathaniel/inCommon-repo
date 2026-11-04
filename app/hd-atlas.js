/* hd-atlas.js: inCommon Human Design reference. V1.1.0
   Pure data, no UI, no framework. Reference material only: nothing here reads
   or writes a profile. Every claim is the tradition's; the app tags it as such.
   Gendered descriptions are written as tendencies, never as rules, and the app
   presents them under a POSSIBILITY tag.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.HDAtlas = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '1.1.0';

  var INTRO = {
    what: 'Human Design is a synthesis. It takes a birth moment and draws a diagram, which inCommon calls the wiring and the field calls a bodygraph, and reads it as a map of how a person is built to make decisions and spend energy.',
    history: 'The system was published by Ra Uru Hu, born Alan Krakower, after an experience he reported on Ibiza in January 1987. It combines the 64 hexagrams of the I Ching, the ten Sephirot of the Kabbalistic Tree of Life, the seven-chakra system, Western astrology, and a reading of the neutrino as a carrier of information.',
    method: 'Two charts are cast. The Personality chart uses the birth moment. The Design chart uses the position of the astral bodies about 88 degrees of solar arc earlier, roughly 88 to 90 days before birth. Both are laid over the same nine centers, and the pattern of what connects decides type, authority, and profile.',
    caution: 'None of this has been demonstrated by any mechanism outside the system itself. It is a language for noticing, and it is at its most useful where it describes something you can check.'
  };

  /* ---------- the five types ---------- */
  var TYPES = {
    Manifestor: {
      pct: 'about 9 percent',
      aura: 'Closed and repelling. The tradition means that descriptively rather than unkindly: people cannot read a Manifestor from outside, so they tend to invent a reading and then respond to their own invention.',
      signature: 'Peace. The feeling reported when a Manifestor has informed, moved, and met no unnecessary resistance.',
      notSelf: 'Anger. Read as the signal of having moved without informing, or of having been managed.',
      def: 'A motor center connected to a defined Throat. That wiring is read as the capacity to initiate: to act first and let the world respond.',
      strategy: 'Inform before acting. Say what you are about to do before you do it, to the people it will land on.',
      authority: 'Varies by chart: emotional, splenic, or ego.',
      male: 'Often reads as independent and self-directed, sometimes abrupt, sometimes solitary. Needs room to move without being managed.',
      female: 'Often reads as powerful and self-contained, and can sit awkwardly against social expectations of receptivity. Needs autonomy more than approval.',
      strengths: 'Impact, independence, the ability to start something from nothing.',
      challenges: 'Anger when met with resistance, isolation, being misread as inconsiderate.',
      opportunities: 'To use force consciously, and to treat informing as generosity rather than permission-seeking.',
      obstacles: 'Other people\u2019s resistance, and their own reactivity to it.'
    },
    Generator: {
      pct: 'about 35 percent',
      aura: 'Open and enveloping. People come closer than they meant to and stay longer than they planned, which is why a Generator is so often asked for things.',
      signature: 'Satisfaction. The feeling reported at the end of work that was genuinely responded to rather than chased.',
      notSelf: 'Frustration. Read as the signal of having initiated instead of responded, or of having said yes without the energy for it.',
      def: 'A defined Sacral center without a motor-to-Throat connection. The system reads the Sacral response, not the mind, as the reliable guide to action.',
      strategy: 'Wait to respond. Let something enter your world and notice whether there is energy for it.',
      authority: 'Sacral, or emotional when the Solar Plexus is defined.',
      male: 'Often reads as steady, productive, and reliable, and may build identity around work and stamina.',
      female: 'Often reads as responsive and grounded, and may chafe against pressure to be the one who initiates.',
      strengths: 'Stamina, satisfaction, mastery through repetition.',
      challenges: 'Frustration when initiating instead of responding, and saying yes under social pressure.',
      opportunities: 'To trust the gut response, and to find work that is actually correct rather than merely available.',
      obstacles: 'Conditioning to initiate, and the habit of overriding body signals.'
    },
    'Manifesting Generator': {
      pct: 'about 35 percent',
      aura: 'Open and enveloping with a forward edge. People are drawn in and then find the Manifesting Generator already three steps ahead of the conversation.',
      signature: 'Satisfaction, as for the Generator, which is how the published convention gives it. Many teachers add peace, for the informing half.',
      notSelf: 'Frustration, as for the Generator, in the published convention. Many teachers add anger, read as the signal of having skipped the informing.',
      def: 'A defined Sacral plus a motor-to-Throat connection. A hybrid: response first, then the capacity to act on it quickly.',
      strategy: 'Wait to respond. The published convention gives the Generator\u2019s strategy; many teachers add informing once the response has come.',
      authority: 'Sacral, or emotional when the Solar Plexus is defined.',
      male: 'Often reads as fast, energetic, and impatient, prone to skipping a step and doubling back for it.',
      female: 'Often reads as dynamic and highly capable, sometimes too fast for the room, and may feel pressed to slow down.',
      strengths: 'Speed, efficiency, the ability to carry several things at once.',
      challenges: 'Frustration and anger together, impatience, skipping the step that mattered.',
      opportunities: 'To slow down just enough to respond, and to inform after the response rather than instead of it.',
      obstacles: 'Initiating out of urgency, and treating the response step as optional.'
    },
    Projector: {
      pct: 'about 20 percent',
      aura: 'Focused and absorbing, aimed at one person at a time (some teachers say penetrating). It is felt as being seen, and occasionally as being seen rather too accurately.',
      signature: 'Success. Not status, in the tradition’s sense, but the recognition of having guided something correctly.',
      notSelf: 'Bitterness. Read as the signal of having entered without invitation, or of having gone unrecognized for too long.',
      def: 'No defined Sacral. A non-energy type, read as built to see and guide the energy of others rather than to generate it.',
      strategy: 'Wait for the invitation. Wait to be recognized for the thing you actually are, then enter.',
      authority: 'Various: emotional, splenic, ego projected, self-projected, or mental.',
      male: 'Often reads as observant and incisive, and can turn bitter where recognition never arrives. Needs to be seen for a specific gift.',
      female: 'Often reads as penetrating and intuitive, and may struggle with being overlooked. Needs correct invitations in order to lead.',
      strengths: 'Guidance, systems, seeing another person clearly.',
      challenges: 'Bitterness without recognition, and exhaustion from proving worth.',
      opportunities: 'To wait for correct invitations, and to use the waiting to study.',
      obstacles: 'Entering uninvited, and overworking to justify a place.'
    },
    Reflector: {
      pct: 'about 1 percent',
      aura: 'Resistant and sampling. A Reflector takes the room in and gives very little fixed back, which is what makes the read on a community possible.',
      signature: 'Surprise. The delight of a cycle that turned out differently than expected, in a place that suited them.',
      notSelf: 'Disappointment. Read as the signal of a wrong environment, or of having been hurried into deciding.',
      def: 'No defined centers at all. Entirely open, and read as sampling the environment rather than holding a fixed nature.',
      strategy: 'Wait a lunar cycle, about 28 days, before a major decision.',
      authority: 'Lunar: the cycle itself is the authority.',
      male: 'Rare. Often reads as chameleon-like and unusually sensitive to place, and may feel foreign wherever they are.',
      female: 'Rare. Often reads as deeply receptive and cyclical, and can be swamped by other people\u2019s definition.',
      strengths: 'Sampling, mirroring, an unusual read on the health of a community.',
      challenges: 'Disappointment, feeling permanently other, pressure to be consistent.',
      opportunities: 'To trust the slow cycle, and to treat environment as the primary decision.',
      obstacles: 'Deciding quickly, and staying somewhere wrong out of loyalty.'
    }
  };

  /* ---------- the six lines ---------- */
  var LINES = {
    1: { name: 'The Investigator', theme: 'Foundation. The need to know before moving.',
      behavior: 'Digs until the ground is solid. Insecure without study, and hard to shift once the base is laid.',
      male: 'Methodical and thorough, often reading as cautious or scholarly.',
      female: 'Security-seeking and exact, often reserved until the material is actually known.' },
    2: { name: 'The Hermit', theme: 'Natural talent, and the withdrawal that protects it.',
      behavior: 'Gifted without effort and often unaware of it. Needs to be called out rather than pushed out.',
      male: 'Naturally skilled and slow to develop it, emerging when someone names the gift.',
      female: 'Innately able and inclined to hide it, needing to be drawn out rather than recruited.' },
    3: { name: 'The Martyr', theme: 'Trial and error. Discovery by bumping into things.',
      behavior: 'Experiments constantly and learns what does not work. Resilient, and often misread as chaotic.',
      male: 'Experimental and durable, sometimes reading as reckless.',
      female: 'Experiential and adaptable, sometimes reading as inconsistent while learning fast.' },
    4: { name: 'The Opportunist', theme: 'Externalization. Influence through the people already known.',
      behavior: 'Needs a foundation and a network. Moves laterally, through relationships rather than applications.',
      male: 'Network-oriented and influential, and dependent on being accepted by the group.',
      female: 'Relational and persuasive through friends, and alert to the risk of social rejection.' },
    5: { name: 'The Heretic', theme: 'Universalization. Carrying other people\u2019s projections.',
      behavior: 'Seen as the solution or the problem, rarely as themselves. Practical, and judged by results.',
      male: 'Charismatic and projected upon, often burdened by expectations he did not set.',
      female: 'Magnetic and generalized by others, and may struggle to be seen precisely.' },
    6: { name: 'The Role Model', theme: 'Transition. Living, then watching, then showing.',
      behavior: 'Read as three lives: experiment to about 30, observation to about 50, then example.',
      male: 'A late bloomer who becomes a wise example after mid-life.',
      female: 'Experiential early, withdrawn in the middle, emerging later as an authentic model.' }
  };

  /* ---------- the twelve profiles ---------- */
  var PROFILES = {
    '1/3': { name: 'Investigator / Martyr', line: 'Foundation laid by study, tested by trial and error.', how: 'The conscious mind researches; the unconscious body experiments. Knowledge is earned twice.' },
    '1/4': { name: 'Investigator / Opportunist', line: 'Foundation laid by study, carried outward through a network.', how: 'What is known privately becomes influence among people who already trust it.' },
    '2/4': { name: 'Hermit / Opportunist', line: 'Natural talent, externalized by friends.', how: 'The gift is not developed in public. It is called out by the network, and the network is the career.' },
    '2/5': { name: 'Hermit / Heretic', line: 'Natural talent, universalized.', how: 'A reluctant leader: known for a gift they did not train for, and projected on for solutions.' },
    '3/5': { name: 'Martyr / Heretic', line: 'Discovery through failure, then generalized to others.', how: 'What was learned by bumping into it becomes practical advice, which is why the projection lands.' },
    '3/6': { name: 'Martyr / Role Model', line: 'Experiment early, observe next, exemplify later.', how: 'Two experimental engines in one chart, which is why the middle stretch feels like a stop.' },
    '4/6': { name: 'Opportunist / Role Model', line: 'Network becomes example.', how: 'Influence through relationships, ripening into being watched rather than consulted.' },
    '4/1': { name: 'Opportunist / Investigator', line: 'Fixed foundation, expressed through a network.', how: 'The most fixed of the profiles: the position does not really move, and it does not need to.' },
    '5/1': { name: 'Heretic / Investigator', line: 'Universalized, built on study.', how: 'Projected on as the practical solution, and only survives it by actually knowing the material.' },
    '5/2': { name: 'Heretic / Hermit', line: 'Universalized natural talent.', how: 'Called out for a gift, then needing to disappear again to keep it intact.' },
    '6/2': { name: 'Role Model / Hermit', line: 'Wisdom expressed through natural talent.', how: 'The gift surfaces late, and the observation years are what make it worth watching.' },
    '6/3': { name: 'Role Model / Martyr', line: 'Wisdom through experience, three lives of it.', how: 'Trial and error consciously and unconsciously, which is a lot of course correction in one life.' }
  };

  /* ---------- the nine centers ---------- */
  var CENTERS = {
    Head: { label: 'Head / Crown', color: '#e0c452', fn: 'Inspiration and mental pressure. The question that arrives on its own.',
      defined: 'A consistent way of being pressured to think, and a reliable source of inspiration for others.',
      open: 'Pressure to answer questions that are not yours. The mind picks up whatever is in the room.',
      wisdom: 'Learning which questions deserve an answer at all, which is a rare skill.' },
    Ajna: { label: 'Ajna', color: '#e0c452', fn: 'Conceptualizing. Certainty, doubt, and the way ideas get organised.',
      defined: 'A fixed way of turning ideas over. Reliable opinions, and difficulty seeing outside them.',
      open: 'Flexible thinking that can look like inconsistency, plus a fear of being seen as uncertain.',
      wisdom: 'Genuine open-mindedness, and comfort with not knowing yet.' },
    Throat: { label: 'Throat', color: '#b08a5e', fn: 'Expression and manifestation. Where anything becomes speech or action.',
      defined: 'A consistent voice, and a consistent way of turning energy into something visible.',
      open: 'Pressure to speak in order to be noticed, and speech that arrives at the wrong moment.',
      wisdom: 'Timing. Knowing that being asked is different from being ready.' },
    G: { label: 'G / Identity', color: '#59b37d', fn: 'Direction, love, and the sense of self.',
      defined: 'A fixed sense of who you are and where you are going, whether or not it is convenient.',
      open: 'Identity and direction shift with company and place. Environment is the real decision.',
      wisdom: 'An unusual read on other people\u2019s direction, and a light hold on your own.' },
    Heart: { label: 'Heart / Will', color: '#d4544a', fn: 'Willpower, worth, and the material world.',
      defined: 'Reliable willpower, and a habit of measuring things in what they cost and prove.',
      open: 'Something to prove that cannot be proven. Promises made to establish worth.',
      wisdom: 'Learning that worth is not earned, which the defined version rarely questions.' },
    Spleen: { label: 'Spleen', color: '#a9805a', fn: 'Intuition, survival, health, and time.',
      defined: 'A steady instinct in the present tense, and a consistent relationship with fear.',
      open: 'Fear that arrives loudly and passes. Holding on to what is not good for you.',
      wisdom: 'Knowing what is healthy for other people, once you stop mistaking their fear for yours.' },
    Sacral: { label: 'Sacral', color: '#e08a3c', fn: 'Life force, work capacity, sexuality, and availability.',
      defined: 'Consistent energy that needs using, and a yes or no that shows up in the body.',
      open: 'No reliable engine. Borrowed energy that feels endless until it stops all at once.',
      wisdom: 'Knowing when enough is enough, which the defined version has to learn the hard way.' },
    'Solar Plexus': { label: 'Solar Plexus', color: '#5b8fc9', fn: 'Emotion, desire, and mood as a wave.',
      defined: 'An emotional wave that is yours. No truth in the now; clarity comes over time.',
      open: 'Amplified emotion picked up from the room, plus conflict avoidance to keep the air calm.',
      wisdom: 'Reading the emotional weather of a group accurately, once you stop owning it.' },
    Root: { label: 'Root', color: '#8e4a3c', fn: 'Adrenaline, stress, and the pressure to get started.',
      defined: 'A consistent pressure to move, in pulses. Stress that functions as fuel.',
      open: 'Pressure to be finished with things, and rushing to make the pressure stop.',
      wisdom: 'Learning that the hurry is not yours, which takes most people decades.' }
  };

  /* ---------- authorities ---------- */
  var AUTHORITIES = [
    { name: 'Emotional (Solar Plexus)', how: 'Clarity arrives over time, not in the moment. The wave has to be ridden out.',
      recognize: 'Any decision feels different in the morning than it did at night.',
      follow: 'Sleep on it. Give a real answer later, and say so plainly at the time.' },
    { name: 'Sacral', how: 'A response in the body at the moment of the question. A sound before a sentence.',
      recognize: 'A lift or a drop in the gut, immediate and not negotiable.',
      follow: 'Answer to the response, not the argument. The mind will supply reasons afterwards.' },
    { name: 'Splenic', how: 'A quiet first instinct, in the present tense, spoken once and not repeated.',
      recognize: 'The very first read, before the mind arrives.',
      follow: 'Move on it immediately, or lose it. It does not argue.' },
    { name: 'Ego (Heart)', how: 'What there is genuine will and worth for. Decisions run through capacity, not obligation.',
      recognize: 'A clear sense of what you want, stated in the first person.',
      follow: 'Say what you want out loud, and check whether the will is actually there.' },
    { name: 'Self-projected (G)', how: 'Direction becomes clear by hearing yourself talk about it.',
      recognize: 'You need to say it aloud before you know it.',
      follow: 'Talk to someone who will listen without steering. Listen to your own voice, not their reply.' },
    { name: 'Mental (environmental)', how: 'No inner authority. Clarity comes from talking it through in the right environment.',
      recognize: 'Nothing decides itself internally, and place changes the answer.',
      follow: 'Use trusted sounding boards, and treat where you are as part of the decision.' },
    { name: 'Lunar (Reflector)', how: 'A full lunar cycle of about 28 days gives the decision its shape.',
      recognize: 'Every day gives a different answer, and all of them feel true that day.',
      follow: 'Wait the cycle out for anything large, and change environment rather than force clarity.' }
  ];

  /* ---------- strategies ---------- */
  var STRATEGIES = [
    { name: 'Informing', who: 'Manifestor', when: 'Before acting, to whoever the action will touch.',
      recognize: 'Correct timing feels like an urge to move that does not need permission.',
      ignored: 'Resistance comes back as anger, and the people around you dig in.' },
    { name: 'Responding', who: 'Generator and Manifesting Generator', when: 'When something arrives to respond to.',
      recognize: 'Correct timing shows up as available energy in the body, not as a good argument.',
      ignored: 'Frustration builds, and work that started wrong stays wrong.' },
    { name: 'Waiting for the invitation', who: 'Projector', when: 'For the big things: work, place, relationship.',
      recognize: 'Correct timing feels like being recognized for the specific thing you are.',
      ignored: 'Bitterness, and a lot of effort spent proving worth to people who did not ask.' },
    { name: 'Waiting a lunar cycle', who: 'Reflector', when: 'For any decision that changes the shape of a life.',
      recognize: 'Correct timing shows up as the same answer surviving a whole cycle.',
      ignored: 'Disappointment, and a pattern of committing to environments that were never right.' }
  ];

  /* ---------- 36 channels ---------- */
  var CHANNELS = {
    '1-8': ['Inspiration', 'Creative role model', 'A creative direction made public. The 8 gives form to what the 1 already is.'],
    '2-14': ['The Beat', 'Keeper of the keys', 'Direction meeting resources. Where the self is pointed, fuel appears.'],
    '3-60': ['Mutation', 'Energy for change', 'Pressure for the new, held back until the ordering is possible. Change comes in pulses.'],
    '4-63': ['Logic', 'Mental ease mixed with doubt', 'Doubt looking for a formula. Answers are hypotheses until tested.'],
    '5-15': ['Rhythm', 'Being in the flow', 'A fixed pattern meeting an extreme range. Rhythm broken is felt in the body.'],
    '6-59': ['Mating', 'Focused on reproduction', 'Intimacy and the barrier that guards it. Openness on a schedule of its own.'],
    '7-31': ['The Alpha', 'Leadership, for better or worse', 'Influence given by others. The role only works when it was granted.'],
    '9-52': ['Concentration', 'Determination', 'Stillness with focus. The capacity to stay on one thing to the end.'],
    '10-20': ['Awakening', 'Commitment to higher principles', 'Being yourself, in the present tense, out loud.'],
    '10-34': ['Exploration', 'Following one\u2019s convictions', 'Energy for a life lived on your own terms. Self-empowerment with a motor behind it.'],
    '10-57': ['Perfected Form', 'Survival', 'Instinct in service of behaviour. The body knows how to be right here.'],
    '11-56': ['Curiosity', 'A seeker', 'Ideas looking for a story. Stimulation as a way of thinking.'],
    '12-22': ['Openness', 'A social being', 'Emotional expression with a sense of occasion. Mood decides whether the words land.'],
    '13-33': ['The Prodigal', 'A witness', 'Listening, then retelling. Experience preserved as narrative.'],
    '16-48': ['The Wavelength', 'Talent', 'Depth and enthusiasm together. Skill built on repetition, expressed with energy.'],
    '17-62': ['Acceptance', 'An organizational being', 'Opinion supported by detail. Order out of a lot of small facts.'],
    '18-58': ['Judgment', 'Insatiability', 'Correction driven by the wish for improvement. Criticism as a form of love.'],
    '19-49': ['Synthesis', 'Sensitivity', 'Need meeting principle. Belonging negotiated on terms.'],
    '20-34': ['Charisma', 'Where thoughts must become deeds', 'Doing, now. Busyness that is genuinely yours.'],
    '20-57': ['The Brain Wave', 'Penetrating awareness', 'Intuition spoken in the moment it arrives, once.'],
    '21-45': ['Money', 'A materialist', 'Control of resources and their distribution. Stewardship with a will behind it.'],
    '23-43': ['Structuring', 'Individuality', 'Insight that has to be phrased before anyone else can hear it. Genius or strangeness, by timing.'],
    '24-61': ['Awareness', 'A thinker', 'Inner knowing turned over and over until it is expressible.'],
    '25-51': ['Initiation', 'Needing to be first', 'Shock in service of the universal. Love tested by risk.'],
    '26-44': ['Surrender', 'A transmitter', 'Memory turned into pitch. The past sold as the future, sometimes honestly.'],
    '27-50': ['Preservation', 'Custodianship', 'Care with rules. Responsibility for others, held as values.'],
    '28-38': ['Struggle', 'Stubbornness', 'A fight worth having. Purpose found by resisting something.'],
    '29-46': ['Discovery', 'Succeeding where others fail', 'Commitment plus a body in the right place. Saying yes and meaning all of it.'],
    '30-41': ['Recognition', 'Focused energy', 'Fantasy with feeling attached. Desire that starts the whole cycle.'],
    '32-54': ['Transformation', 'Being driven', 'Ambition tempered by a sense of what will last.'],
    '34-57': ['Power', 'An archetype', 'Instinct with power behind it. The purest expression of individual energy.'],
    '35-36': ['Transitoriness', 'A jack of all trades', 'Hunger for the new experience, and restlessness once it is had.'],
    '37-40': ['Community', 'A part seeking a whole', 'Bargain and belonging. Loyalty with terms attached.'],
    '39-55': ['Emoting', 'Moodiness', 'Provocation and abundance. Spirit that cannot be argued into place.'],
    '42-53': ['Maturation', 'Balanced development', 'Beginnings and endings. Cycles finished rather than abandoned.'],
    '47-64': ['Abstraction', 'Mental activity mixed with clarity', 'Confusion working itself into realisation, usually later than wanted.']
  };

  /* ---------- 64 gates: [name, center, keynote, shadow, gift] ---------- */
  var GATES = {
    1: ['Self-Expression', 'G', 'Creative individuality that has to come out in its own form.', 'Performing for approval.', 'Original expression that needed no audience.'],
    2: ['Direction of the Self', 'G', 'The receptive ground that gives direction its shape.', 'Waiting passively for meaning.', 'Knowing where you are pointed without pushing.'],
    3: ['Ordering', 'Sacral', 'New life pressing to be organised.', 'Chaos justified as freedom.', 'Order that lets change survive.'],
    4: ['Formulization', 'Ajna', 'Answers offered to doubt, held as hypotheses.', 'Certainty faked to end discomfort.', 'Honest not-knowing that keeps thinking.'],
    5: ['Fixed Rhythms', 'Sacral', 'Patterns the body keeps whether or not you approve.', 'Ritual defended past its usefulness.', 'Rhythm that carries you without thought.'],
    6: ['Friction', 'Solar Plexus', 'The boundary where intimacy is negotiated.', 'Conflict for its own heat.', 'Openness with a real threshold.'],
    7: ['The Role of the Self', 'G', 'Leadership held on behalf of others.', 'Steering everything for its own sake.', 'Direction given only when granted.'],
    8: ['Contribution', 'Throat', 'Making a contribution in your own style.', 'Style without substance.', 'Form that carries something worth showing.'],
    9: ['Focus', 'Sacral', 'Energy narrowed to one detail at a time.', 'Detail as a hiding place.', 'Concentration that finishes things.'],
    10: ['Behaviour of the Self', 'G', 'Loving yourself as a practice rather than an idea.', 'Self-regard that needs witnesses.', 'Being yourself with no argument.'],
    11: ['Ideas', 'Ajna', 'Ideas that arrive to be told, not to be acted on.', 'Mistaking ideas for instructions.', 'Ideas offered lightly.'],
    12: ['Caution', 'Throat', 'Expression that only works in the right mood.', 'Silence weaponised.', 'Words that arrive at the right moment.'],
    13: ['The Listener', 'G', 'Holding other people\u2019s stories without leaking them.', 'Collecting secrets for leverage.', 'Listening that lets a person be heard.'],
    14: ['Power Skills', 'Sacral', 'Resources following direction.', 'Accumulation with no direction.', 'Means put behind a purpose.'],
    15: ['Extremes', 'G', 'A wide human range rather than a fixed pace.', 'Extremes performed as personality.', 'Range that makes room for others.'],
    16: ['Skills', 'Throat', 'Enthusiasm poured into practice.', 'Enthusiasm without the practice.', 'Talent earned by repetition.'],
    17: ['Opinions', 'Ajna', 'Opinion built from a pattern.', 'Opinion mistaken for fact.', 'Ideas held loosely enough to test.'],
    18: ['Correction', 'Spleen', 'Noticing what could be better.', 'Criticism as a habit.', 'Correction offered where it is wanted.'],
    19: ['Wanting', 'Root', 'Sensitivity to what the group needs.', 'Need dressed as principle.', 'Asking plainly for what is needed.'],
    20: ['The Now', 'Throat', 'Speech in the present tense.', 'Talking to fill the moment.', 'Saying the true thing now.'],
    21: ['Control', 'Heart', 'Authority over resources and territory.', 'Control for the feel of it.', 'Stewardship that gives others room.'],
    22: ['Openness', 'Solar Plexus', 'Grace that depends on mood.', 'Charm used to avoid the subject.', 'Emotional openness at the right time.'],
    23: ['Assimilation', 'Throat', 'Insight that needs its own words.', 'Explanations nobody asked for.', 'Genius phrased so it can be heard.'],
    24: ['Rationalizing', 'Ajna', 'The same question returning until it resolves.', 'Rumination mistaken for progress.', 'Return that finally arrives somewhere.'],
    25: ['The Spirit of the Self', 'G', 'Universal love, tested by shock.', 'Innocence defended by withdrawal.', 'Love that does not need a reason.'],
    26: ['The Egoist', 'Heart', 'Memory turned into persuasion.', 'The useful exaggeration.', 'Telling the truth with the same force.'],
    27: ['Caring', 'Sacral', 'Responsibility for other people\u2019s wellbeing.', 'Care that will not let go.', 'Nourishment offered, not imposed.'],
    28: ['The Game Player', 'Spleen', 'Struggle in search of what is worth it.', 'Risk taken to feel alive.', 'Purpose found in the difficulty.'],
    29: ['Saying Yes', 'Sacral', 'Commitment with the whole body.', 'Yes said to avoid the discomfort of no.', 'Commitment that follows through.'],
    30: ['Feelings', 'Solar Plexus', 'Desire that starts everything.', 'Wanting more than living.', 'Feeling used as fuel.'],
    31: ['Influence', 'Throat', 'Leading because you were asked.', 'Leading because nobody stopped you.', 'Influence held on loan.'],
    32: ['Continuity', 'Spleen', 'Instinct for what will endure.', 'Fear of failure that stops the start.', 'Judgment about what deserves to last.'],
    33: ['Privacy', 'Throat', 'Retelling experience after it is over.', 'Secrecy for status.', 'Witness that becomes something useful.'],
    34: ['Power', 'Sacral', 'Raw energy that wants to be busy.', 'Busyness with no response behind it.', 'Power spent where it belongs.'],
    35: ['Change', 'Throat', 'Appetite for the experience not yet had.', 'Novelty for its own sake.', 'Progress through actually doing it.'],
    36: ['Crisis', 'Solar Plexus', 'The new experience, arriving before you are ready.', 'Crisis manufactured out of boredom.', 'Turbulence met without drama.'],
    37: ['Friendship', 'Solar Plexus', 'The bargain that holds a family together.', 'Loyalty used as a lever.', 'Agreements kept in the open.'],
    38: ['The Fighter', 'Root', 'Stubbornness in service of meaning.', 'Fighting everything to feel purpose.', 'Choosing the fight that matters.'],
    39: ['Provocation', 'Root', 'Provoking to find out what is really there.', 'Provocation as a habit.', 'Provocation that frees the feeling.'],
    40: ['Aloneness', 'Heart', 'Work, then withdrawal to recover.', 'Denial of needing anyone.', 'Rest taken before the collapse.'],
    41: ['Contraction', 'Root', 'The start of the cycle: fantasy under pressure.', 'Fantasy substituted for living.', 'Imagination that opens the real thing.'],
    42: ['Growth', 'Sacral', 'Finishing what was started.', 'Endings avoided indefinitely.', 'Completion that makes room.'],
    43: ['Insight', 'Ajna', 'Knowing before it can be explained.', 'Insight forced on the room.', 'Knowing that waits for its moment.'],
    44: ['Alertness', 'Spleen', 'Pattern recognition about people.', 'The past used to predict everyone.', 'Instinct about who is trustworthy.'],
    45: ['The Gatherer', 'Throat', 'The voice that speaks for the group\u2019s resources.', 'Owning what belongs to everyone.', 'Distribution done honestly.'],
    46: ['Determination', 'G', 'Being in the right place, in the body.', 'Effort substituted for placement.', 'Luck that is really good timing.'],
    47: ['Realizing', 'Ajna', 'Confusion working towards a realisation.', 'Confusion treated as failure.', 'Patience with what has not resolved.'],
    48: ['Depth', 'Spleen', 'Depth of skill, and the fear of not having enough.', 'Inadequacy as an identity.', 'Depth that shows up when needed.'],
    49: ['Principles', 'Solar Plexus', 'The terms on which you belong.', 'Rejection issued pre-emptively.', 'Principles stated rather than enforced.'],
    50: ['Values', 'Spleen', 'Guardianship of what the group holds.', 'Rules kept past their purpose.', 'Values that actually protect people.'],
    51: ['Shock', 'Heart', 'The shock that changes the order of things.', 'Competition for its own sake.', 'Courage that opens something.'],
    52: ['Stillness', 'Root', 'Pressure held still enough to concentrate.', 'Stillness that becomes inertia.', 'Focus with a body behind it.'],
    53: ['Beginnings', 'Root', 'Pressure to start the next thing.', 'Starting to avoid finishing.', 'Beginnings that are actually ready.'],
    54: ['Ambition', 'Root', 'Drive to rise, materially or otherwise.', 'Ambition with no ground under it.', 'Ambition matched to real capacity.'],
    55: ['Spirit', 'Solar Plexus', 'Mood as the weather of the spirit.', 'Melancholy nursed as depth.', 'Spirit that does not need a reason.'],
    56: ['Stimulation', 'Throat', 'The storyteller who keeps people listening.', 'Stories told to hold the room.', 'Stimulation that carries a truth.'],
    57: ['Intuitive Clarity', 'Spleen', 'The first quiet read, right now.', 'Fear treated as prophecy.', 'Intuition trusted the first time.'],
    58: ['Vitality', 'Root', 'Joy that presses towards improvement.', 'Dissatisfaction as a personality.', 'Aliveness that improves things.'],
    59: ['Sexuality', 'Sacral', 'The barrier that decides intimacy.', 'Intimacy used to secure something.', 'Openness chosen deliberately.'],
    60: ['Acceptance', 'Root', 'Limitation as the condition for change.', 'Limitation resented indefinitely.', 'Accepting the frame, then mutating inside it.'],
    61: ['Mystery', 'Head', 'Pressure to know the unknowable.', 'Obsession dressed as insight.', 'Wonder held without an answer.'],
    62: ['Detail', 'Throat', 'Naming things precisely.', 'Precision used to avoid the point.', 'Detail that makes something usable.'],
    63: ['Doubt', 'Head', 'Doubt as the beginning of logic.', 'Suspicion of everything, including yourself.', 'Doubt that asks a good question.'],
    64: ['Confusion', 'Head', 'Images and impressions not yet resolved.', 'Confusion mistaken for meaning.', 'Images left alone until they clarify.']
  };

  var EXAMPLE = {
    type: 'Generator', strategy: 'Wait to respond.', authority: 'Sacral', profile: '5/1',
    definedCenters: ['Sacral', 'G', 'Throat'],
    openCenters: ['Head', 'Ajna', 'Heart', 'Spleen', 'Solar Plexus', 'Root'],
    gates: [1, 2, 8, 10, 13, 14, 15, 20, 23, 25, 27, 29, 34, 42, 46, 50, 57, 59],
    channels: ['2-14', '10-20', '1-8', '27-50', '29-46', '34-57'],
    steps: [
      ['Type and strategy', 'Sacral defined, no motor to the Throat: a Generator. The strategy is to respond rather than initiate, so the first question about any plan is what prompted it.'],
      ['Authority', 'Sacral defined and Solar Plexus open, so the authority is sacral: the answer is in the body at the moment of asking, not in the reasoning afterwards.'],
      ['Defined centers', 'Sacral, G, and Throat are defined. Energy, identity, and voice behave consistently. What is said tends to be said the same way twice.'],
      ['Open centers', 'Head, Ajna, Heart, Spleen, Solar Plexus, and Root are open. Mental pressure, emotion, and urgency are mostly picked up from the room, which is where most of the noise comes from.'],
      ['Profile lines', 'A 5/1: conscious Heretic, unconscious Investigator. Projected on for practical answers, and only comfortable when the material is genuinely known.'],
      ['Defined channels', 'Six channels, including 10-20 and 34-57. The G to Throat link means identity reaches speech directly, which is why being misquoted stings.'],
      ['Activated gates', 'Eighteen gates. The ones inside defined channels operate consistently; the rest are single activations that need a partner gate from someone else to complete.'],
      ['Synthesis', 'A Generator with a fixed voice and a borrowed sense of urgency. The useful practice is noticing which pressure is actually theirs before agreeing to anything.']
    ]
  };

  /* Topology comes from hd-topology.js now. This module keeps the writing
     and reads the wiring, which is interpretation depending on mechanics:
     the direction the boundary allows. With the module absent it falls back
     to its own GATES table, so a build missing hd-topology still draws.  */
  function TOPO() {
    if (typeof self !== 'undefined' && self.HDTopology) return self.HDTopology;
    if (typeof globalThis !== 'undefined' && globalThis.HDTopology) return globalThis.HDTopology;
    return null;
  }
  function centerOf(gate) {
    var T = TOPO();
    if (T) return T.centerOf(gate);
    var g = GATES[gate]; return g ? g[1] : null;
  }
  function gateName(gate) { var g = GATES[gate]; return g ? g[0] : ''; }
  function channelKey(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); }
  function channel(a, b) {
    var k = channelKey(a, b), c = CHANNELS[k];
    return c ? { key: k, name: c[0], theme: c[1], meaning: c[2] } : null;
  }
  function channelsFor(gate) {
    var out = [];
    Object.keys(CHANNELS).forEach(function (k) {
      var p = k.split('-').map(Number);
      if (p[0] === gate || p[1] === gate) {
        out.push({ key: k, partner: p[0] === gate ? p[1] : p[0], name: CHANNELS[k][0], theme: CHANNELS[k][1], meaning: CHANNELS[k][2] });
      }
    });
    return out;
  }
  /* The design Sun sits 88 degrees of solar arc behind the personality Sun, so the
     design line is always two or three steps ahead of the conscious line on the
     six line wheel. Only twelve pairs exist. Snap any computed pair onto the
     nearest valid one rather than inventing a thirteenth. */
  function normalizeProfile(consciousLine, designLine) {
    var c = ((Math.round(consciousLine) - 1) % 6 + 6) % 6 + 1;
    var u = ((Math.round(designLine) - 1) % 6 + 6) % 6 + 1;
    var allowed = [(c + 1) % 6 + 1, (c + 2) % 6 + 1];
    if (allowed.indexOf(u) === -1) {
      var dist = function (a, b) { var d = Math.abs(a - b) % 6; return Math.min(d, 6 - d); };
      u = dist(u, allowed[0]) <= dist(u, allowed[1]) ? allowed[0] : allowed[1];
    }
    return { c: c, u: u, key: c + '/' + u };
  }
  function profileFor(consciousLine, designLine) {
    var n = normalizeProfile(consciousLine, designLine);
    var p = PROFILES[n.key];
    return { key: n.key, c: n.c, u: n.u, name: p.name, line: p.line, how: p.how };
  }

  /* ---- The connection layer's own writing --------------------------------
   * These moved here out of hd-composite.js, which is a mechanics module and
   * had seven sentences in it. The channel descriptors they are written
   * against are three lines up, which is the argument for the move: the
   * tradition line quotes CHANNELS, and a sentence that quotes a table wants
   * to live beside it.
   *
   * TOKENS, NOT CONCATENATION. `{holder}` and `{other}` are filled in by
   * hd-composite's layers(), which knows which of the two people holds a
   * channel and which does not. Handing it a template rather than building
   * the sentence there is what keeps the prose on this side of the boundary:
   * the mechanics module substitutes and never composes.
   *
   * THE THIRD PART IS ALWAYS A QUESTION AND NEVER A STATEMENT ABOUT EITHER
   * PERSON. That is the same rule animal-symbolism.js and dream-symbols.js
   * keep, and it is why "Neither answer is the chart's to give" is in the
   * dominance line: the two of them can close that question and this app
   * cannot. Do not rewrite one of these into a finding.
   */
  var CONNECTION_TRADITION = {
    named: 'The {key} is called {name}. {meaning}',
    namedWithTheme: 'The {key} is called {name}, {theme}. {meaning}',
    unnamed: 'The tradition has no separate reading for this channel in this build.'
  };

  var CONNECTION_ASK = {
    electromagnetic: 'Is there something the two of you do together that neither of you does alone, and would you both say it is that? A channel that only one of you recognises is worth putting down.',
    companionship: 'Where do the two of you agree so quickly that neither of you checks? The same wiring twice is easy to mistake for being right.',
    dominance: 'Does {other} notice this as something that is already settled when {holder} is in the room, and is that welcome to both of you? Neither answer is the chart’s to give.',
    compromise: 'Does {other} feel more like this when {holder} is around, and does {other} want to? A thing you only do in company is worth naming as that, either way.',
    sharedGate: 'You both reach for the same half of this and neither of you closes it. Is that a shared appetite, a shared frustration, or has neither of you noticed it?',
    absent: 'Nothing here is missing from either of you. If this reads as a gap, whose idea was it that it should be there?'
  };

  /* ---------- definition ----------
     How the defined centers link up, which the tradition treats as a structural
     fact about how a person's energy moves and how they need other people. */
  var DEFINITION = [
    { name: 'Single Definition', text: 'Every defined center is connected to every other defined center in one unbroken piece. The tradition reads this as self-contained: energy moves through the whole definition without needing anything from outside to close a gap, which is read as independence, and sometimes as a difficulty noticing that other people work differently.' },
    { name: 'Split Definition', text: 'Two separate groups of defined centers with no channel joining them. The tradition reads a split as a built-in search: the person is looking, often without naming it, for whatever bridges the gap, and other people who carry the bridging gates are felt strongly. The advice given is to let the bridge be many people and situations rather than one person appointed to complete you.' },
    { name: 'Triple Split Definition', text: 'Three separate groups. Read as busier than a single split and slower to settle, because there are more gaps and more ways to be affected. The tradition suggests such a person needs varied contact and enough time, and tends to do badly under pressure to decide quickly.' },
    { name: 'Quadruple Split Definition', text: 'Four separate groups, which requires a lot of definition in the first place. Read as needing a great deal of variety and being unusually hard to condition, since there is no single dominant flow to be pushed around.' },
    { name: 'No Definition', text: 'No channel is defined anywhere, which is the Reflector. There is nothing fixed to connect, so the whole chart is read as sampling whatever is present. The tradition treats environment, not effort, as the decisive factor.' }
  ];

  /* ---------- the incarnation cross ---------- */
  var CROSS = {
    what: 'The Incarnation Cross is the four gates held by the Sun and the Earth in both charts: the Personality Sun and Earth from the birth moment, and the Design Sun and Earth from about 88 degrees of solar arc earlier. Four gates, always in two opposing pairs.',
    how: 'The tradition reads the cross as the backdrop of a life rather than an instruction inside it. Type says how you engage, authority says how you decide, profile says the role you play, and the cross is the theme all of that is playing out against. There are 192 of them, named in the form Right Angle Cross of Planning, Left Angle Cross of Confrontation, Juxtaposition Cross of Formulization.',
    angles: 'The angle comes from the profile. Right Angle crosses are read as a personal life, where the story is mostly your own. Left Angle crosses are read as transpersonal, where other people are the medium the theme works through. The Juxtaposition Cross, from the 4/1 profile, is read as a fixed destiny with little room to swerve.',
    caution: 'A cross is the broadest thing in the system and the easiest to over-read. It is better used as a description of the weather a life happens in than as a job title.'
  };

  /* ---------- circuitry ---------- */
  var CIRCUITS = [
    { name: 'Individual Circuitry', keynote: 'mutation, and the melancholy that carries it',
      text: 'Individual channels are read as mutative: they arrive as something nobody asked for and cannot be reasoned into arriving on time. The tradition attaches melancholy to this circuitry, not as a disorder but as the pressure that precedes a mutation, and it holds that the mutation is only useful if it is expressed rather than sat on. Its gift to others is empowerment; its difficulty is that it cannot be scheduled.',
      sub: 'Within it: the Knowing and Centering circuits, with the Integration channels.' },
    { name: 'Tribal Circuitry', keynote: 'support, and the bargain that makes it work',
      text: 'Tribal channels are read as the machinery of keeping people alive together: resources, touch, loyalty, agreements, who is owed what. The tradition treats the bargain as the honest core of it rather than something to be embarrassed about, and reads tribal pressure as the source of most of what gets called obligation. Its gift is support; its difficulty is that it works by deal rather than by principle.',
      sub: 'Sub-circuits: Ego and Defense.' },
    { name: 'Collective Circuitry', keynote: 'sharing, and the pattern nobody owns',
      text: 'Collective channels are read as the sharing circuitry: experience gathered and passed on so that the group does not have to learn it again. The tradition splits it into the logical stream, which is about patterns that repeat and can be tested, and the abstract stream, which is about experience that only makes sense looking back. Its gift is sharing; its difficulty is that it is impersonal, and a person can be used by it without being cared for.',
      sub: 'Sub-circuits: Understanding, the logical half, and Sensing, the abstract half.' }
  ];

  /* ---------- further terms ----------
     The vocabulary a reading uses without stopping to define it. Several of these
     appear in this build's own generated text, which is the strongest argument for
     defining them here: a page that says 'electromagnetic' or 'your design crystal'
     and never says what it means is asking to be taken on faith. */
  var TERMS = [
    { name: 'The Wiring', text: 'The diagram itself, which the field calls a bodygraph: nine centers, 36 channels and 64 gates, with the Personality activations printed in black on one side and the Design activations in red on the other. Everything the system says is read off this one picture.' },
    { name: 'Aura', text: 'The field the tradition says a person projects and is met through, before anything is said. It is fixed by type, not by manner or intention, which is why the system treats it as mechanical rather than psychological. Each type entry names its own.' },
    { name: 'Signature', text: 'The feeling reported when a person is living in their own design: peace, satisfaction, success or surprise, by type. Used as a check rather than a goal, since it cannot be performed on purpose.' },
    { name: 'Not-Self Theme', text: 'The feeling reported when a person is off their own design: anger, frustration, bitterness or disappointment, by type. The tradition treats it as early information rather than failure, which is the whole reason it is worth naming.' },
    { name: 'Conditioning', text: 'What the tradition says happens where a center is undefined: the openness is filled in by whoever is nearby, and their consistency gets mistaken for your own. Not framed as harm being done to you, but as the ordinary mechanics of being open.' },
    { name: 'Deconditioning', text: 'The process of living by type and authority long enough to tell your own definition from what was filled in. The tradition puts it at roughly seven years and warns that it is uncomfortable in the middle, which is the part most often left out.' },
    { name: 'Hanging Gate', text: 'A gate that is defined while the gate at the other end of its channel is not, leaving half a channel open. The tradition reads a hanging gate as where you are most reliably drawn to other people, because anyone carrying the other gate completes the circuit on contact.' },
    { name: 'Electromagnetic Connection', text: 'When one person holds one gate of a channel and the other holds its pair, completing a channel neither could complete alone. Described as the most magnetic thing available between two charts, with the standing caution that magnetism is not compatibility. The circuit closes with anyone who happens to hold the other gate.' },
    { name: 'Dominance', text: 'When one person has a channel fully defined and the other has neither of its gates. The defined one broadcasts and the open one receives, so the tradition reads it as the defined person setting the terms in that area without either of them deciding to.' },
    { name: 'Compromise', text: 'When one person has a channel fully defined and the other holds only one of its gates. Read as workable but uneven: the half-defined person keeps meeting their own gate in someone else’s fixed circuitry.' },
    { name: 'Companionship', text: 'When both people have the same channel fully defined. Read as easy recognition and, over time, as a shared blind spot, since neither has any distance on what they both hold fixed.' },
    { name: 'Emotional Wave', text: 'The Solar Plexus does not give a clear answer in the moment; the tradition says it moves in a wave and that clarity comes from riding it out rather than reading any single point on it. This is why emotional authority is advice about time before it is advice about feeling.' },
    { name: 'Variables and the Four Arrows', text: 'The four arrows beside the head of a bodygraph: Determination at top left and Environment at bottom left, both from the Design side; Motivation at top right and Perspective at bottom right, both from the Personality side. They are the system’s advanced layer, covering how a person is said to take in food and information, and where they function best. This build names them and does not compute them.' },
    { name: 'Color, Tone and Base', text: 'Gate and line are the first two layers of the system’s address for a position; color, tone and base are the three finer ones beneath them, and they are what the Variables are derived from. Ra Uru Hu’s full notation is gate.line.color.tone.base. This build reads to gate and line only.' },
    { name: 'Design and Personality Crystals', text: 'The system’s own cosmology: a Personality crystal said to carry who you think you are, a Design crystal said to carry the body and its genetics, and a magnetic monopole holding the two together and pulling them along one trajectory. This is the frame the red and black activations come from, and it is metaphysics rather than mechanics.' },
    { name: 'Transits', text: 'The moving activations of the day laid over a fixed bodygraph, temporarily defining gates and sometimes channels that are not natally defined. The tradition reads a transit as borrowed rather than yours: the useful question is whether a theme leaves when the day does.' }
  ];


  /* ---------- the three tiers of lessons ----------
     Asked for by the owner on 3 November 2026: twenty one lessons in three
     tiers, Bedrock, Weather and Horizon. A lesson is the full account of one
     idea and every variant the field names for it; the chapters below it
     (types, centers, gates and the rest) stay the reference shelves the
     lessons point into. Every sentence is inCommon's own wording of the
     field's published convention. Where teachers and the published
     convention differ, the lesson says so in the part that differs rather
     than picking silently. The sources each part was checked against, and
     the parts still open, are in docs/hd-upgrade/03-atlas-lessons-sources.md.
     `see` and `words` are [chapter, id] pairs; the app slugs the id.  */
  var TIERS = [
    { key: 'bedrock', name: 'Bedrock', glyph: '▣',
      line: 'The seven ideas every reading stands on: how you are built to engage, and how you decide.' },
    { key: 'weather', name: 'Weather', glyph: '≈',
      line: 'The seven ideas that describe the particular climate of one chart.' },
    { key: 'horizon', name: 'Horizon', glyph: '◠',
      line: 'The seven ideas at the far edge of the system: time, change, and the finest grain of the design.' }
  ];

  var LESSONS = [
    /* ---------------- Bedrock ---------------- */
    { tier: 'bedrock', name: 'Type', epi: 'Five ways of meeting the world',
      lead: 'Type is the first sort the system makes, and every other idea is read through it. It is not a temperament and it is not chosen. It falls out of the wiring: which centers are defined, and whether a motor reaches the Throat. The Sacral is the hinge. Defined, it makes a Generator of one kind or another. Undefined, a motor wired to the Throat makes a Manifestor, any other definition makes a Projector, and no definition at all makes a Reflector.',
      parts: [
        ['Manifestor', 'No defined Sacral, and one of the other three motors (Heart, Solar Plexus or Root) joined to the Throat. Read as built to initiate. Published figures put it near 9 percent of people.'],
        ['Generator', 'A defined Sacral with no motor reaching the Throat. Read as built to respond, with sustainable energy for the work that is correct for it.'],
        ['Manifesting Generator', 'A defined Sacral plus a motor joined to the Throat. The published convention counts four types and files it under Generator rather than as a fifth, with the same strategy, aura, signature and not-self theme. Many teachers and some reference works treat it as a fifth type and add informing to its strategy. Generators of both kinds together are given as roughly two thirds to seven tenths of people, about half of them Manifesting Generators.'],
        ['Projector', 'No defined Sacral and no motor to the Throat, with at least one channel defined. Read as built to see and guide the energy of others. Just over 20 percent in published figures.'],
        ['Reflector', 'Nothing defined: all nine centers open. Read as a mirror for its surroundings. About 1 percent.'],
        ['Energy types and non-energy types', 'Manifestors and both kinds of Generator are called energy types. Projectors and Reflectors are non-energy types: the tradition holds they have no consistent working energy of their own and do best when they stop trying to keep pace with those who do.'],
        ['Solar and lunar', 'The four types whose rhythm follows the Sun’s passage through the gates are called solar. The Reflector is called lunar, because the Moon’s monthly passage is what gives its decisions their shape.'],
        ['Kinds of Projector', 'Ra Uru Hu\u2019s own readings name a chart by its type and its authority: an emotional Projector, a splenic Projector, a self-projected Projector, and the mental Projector, whose definition sits only above the Throat so that it has no direct inner authority, a group it shares with the Reflector. Modern teachers also speak of energy and classic Projectors, but each school draws that line differently, so the Atlas leaves those as names rather than definitions.'],
      ],
      see: [['types', 'Manifestor'], ['types', 'Generator'], ['types', 'Manifesting Generator'], ['types', 'Projector'], ['types', 'Reflector']],
      words: [['bedrock', 'Strategy'], ['bedrock', 'Aura'], ['weather', 'Centers']] },

    { tier: 'bedrock', name: 'Strategy', epi: 'How to meet the moment',
      lead: 'Strategy is the practical instruction each type carries: a way of engaging with life so that decisions have something correct to work on. It is offered as an experiment to try in ordinary days rather than as a rule, and the tradition is candid that the mind will argue with it.',
      parts: [
        ['To inform (Manifestor)', 'Tell the people an action will touch before you take it. Informing is not a request for permission. It is said to ease the resistance a closed aura otherwise meets.'],
        ['To respond (Generator)', 'Wait for life to bring something, an offer, a question, a sound, and let the Sacral answer it before the mind does.'],
        ['To respond, then inform (Manifesting Generator)', 'The published convention gives the Manifesting Generator the Generator’s strategy. Many teachers add a second step: once the response has come, tell the people the action will touch, as a Manifestor would.'],
        ['To wait for the invitation (Projector)', 'For the large things, love, work, home and close bonds, wait to be recognised and invited. Everyday exchanges need no formal invitation.'],
        ['To wait a lunar cycle (Reflector)', 'Give a large decision about 28 days, one pass of the Moon through all 64 gates, and talk it over with people you trust along the way.'],
        ['Strategy beside authority', 'Strategy says how to meet a moment. Authority says how to decide inside it. The tradition always presents the two together.']
      ],
      see: [['strategies', 'Informing'], ['strategies', 'Responding'], ['strategies', 'Waiting for the invitation'], ['strategies', 'Waiting a lunar cycle']],
      words: [['bedrock', 'Inner Authority'], ['bedrock', 'Signature']] },

    { tier: 'bedrock', name: 'Aura', epi: 'Met before a word is said',
      lead: 'The aura is the field the tradition says every body carries, reaching about two metres in each direction, through which people meet before anything is spoken. Its quality is set by type, which is why the system calls it mechanical rather than a matter of manners or mood.',
      parts: [
        ['Closed and repelling (Manifestor)', 'Said to keep others at a distance and make the Manifestor hard to read from outside, which is part of why informing matters so much.'],
        ['Open and enveloping (Generator)', 'Said to take in whatever is near, which is how a Generator meets so much to respond to. The Manifesting Generator carries the same aura.'],
        ['Focused and absorbing (Projector)', 'Aimed at one person at a time and said to take that person in deeply. Some teachers call it focused and penetrating; both describe the same narrow beam.'],
        ['Resistant and sampling (Reflector)', 'Said to taste everyone present without taking anyone in, which is what lets a Reflector read the health of a group.'],
        ['Aura and conditioning', 'Two auras overlapping is where conditioning happens: whatever one person defines is felt by the other wherever the other is open.']
      ],
      see: [['terms', 'Aura']],
      words: [['horizon', 'Conditioning'], ['bedrock', 'Type']] },

    { tier: 'bedrock', name: 'Signature', epi: 'The feeling of being on course',
      lead: 'The signature is the feeling the tradition says arrives when someone lives by their own strategy and authority. It is a check noticed afterwards rather than a target, since it cannot be produced by aiming at it.',
      parts: [
        ['Peace (Manifestor)', 'Ease after moving freely, with nobody blindsided.'],
        ['Satisfaction (Generator)', 'The good tiredness at the end of work that was truly responded to. The published convention gives Manifesting Generators the same signature; some teachers add peace, for the informing half.'],
        ['Success (Projector)', 'Not status but the quiet recognition of having guided something well, after being invited to.'],
        ['Surprise (Reflector)', 'Delight at a cycle that turned out differently than expected, in a place that suited it.']
      ],
      see: [['terms', 'Signature']],
      words: [['bedrock', 'Not-Self Theme']] },

    { tier: 'bedrock', name: 'Not-Self Theme', epi: 'The signal to come back',
      lead: 'The not-self theme is the signature’s counterpart: the feeling reported when someone is living from the mind’s agenda or from borrowed pressure rather than from their design. The tradition treats it as early information, a nudge back toward strategy, and never as a verdict on the person.',
      parts: [
        ['Anger (Manifestor)', 'Read as the sign of having been held back, or of having moved without informing.'],
        ['Frustration (Generator)', 'Read as the sign of having initiated, or of having said yes without the energy for it. The published convention gives Manifesting Generators the same theme; some teachers add anger.'],
        ['Bitterness (Projector)', 'Read as the sign of having entered without an invitation, or of having gone unrecognised for too long.'],
        ['Disappointment (Reflector)', 'Read as the sign of the wrong surroundings, or of having been hurried into a decision.'],
        ['In the open centers', 'Each open center carries a habit the tradition names. The open Head chases questions that belong to others; the open Ajna performs certainty; the open Throat works for attention; the open G searches for love and direction; the open Heart sets out to prove its worth; the open Spleen holds on to what is not good for it; the open Sacral cannot tell when enough is enough; the open Solar Plexus dodges truth to dodge confrontation; the open Root hurries to be free of pressure.'],
        ['The not-self mind', 'The tradition’s name for the mind trying to run decisions it is not built to make, usually by acting out the habits of the open centers.']
      ],
      see: [['terms', 'Not-Self Theme']],
      words: [['bedrock', 'Signature'], ['horizon', 'Conditioning']] },

    { tier: 'bedrock', name: 'Inner Authority', epi: 'Where a decision is made',
      lead: 'Inner authority is where the tradition says a reliable decision comes from in a given chart, and it is never the mind. It is found by a fixed order of precedence: the first of the centers below that the chart defines is the authority, and the ones after it are not consulted.',
      parts: [
        ['1. Emotional', 'A defined Solar Plexus outranks everything else, and about half of people have one. Clarity comes over time, across the wave. Possible for every type except the Reflector.'],
        ['2. Sacral', 'A defined Sacral with the Solar Plexus open: a response in the body in the moment, often a sound before a sentence. Generators of both kinds only.'],
        ['3. Splenic', 'A defined Spleen with the Solar Plexus and Sacral open: a quiet instinct in the present that speaks once. Manifestors and Projectors.'],
        ['4. Ego manifested', 'A defined Heart joined to the Throat, with the three above open: decisions run through what the will truly wants and can commit to. Manifestors only.'],
        ['5. Ego projected', 'A defined Heart joined to the G but not to the Throat. The will speaks through what you hear yourself say you want. Projectors only.'],
        ['6. Self-projected', 'A defined G joined to the Throat, nothing else above it in the order. Direction becomes clear by talking and listening to your own voice. Projectors only.'],
        ['7. Mental', 'Definition only in the Head, Ajna or Throat, which the published material calls no direct inner authority. Clarity comes from the right surroundings and from talking things over with trusted people. Projectors only. Ego, self-projected and mental together are sometimes called the minor authorities, a small share of people.'],
        ['8. Lunar', 'No definition: the Reflector waits a lunar cycle and lets the decision take shape across it.']
      ],
      see: [['authorities', 'Emotional (Solar Plexus)'], ['authorities', 'Sacral'], ['authorities', 'Splenic'], ['authorities', 'Ego (Heart)'], ['authorities', 'Self-projected (G)'], ['authorities', 'Mental (environmental)'], ['authorities', 'Lunar (Reflector)']],
      words: [['terms', 'Emotional Wave'], ['bedrock', 'Outer Authority']] },

    { tier: 'bedrock', name: 'Outer Authority', epi: 'What the mind is for',
      lead: 'Outer authority is the tradition’s name for the mind’s proper work. Released from running a person’s own decisions, the mind becomes a source of knowledge, perspective and insight that other people can draw on, offered when it is asked for.',
      parts: [
        ['Not a decision maker', 'The mind can compare, research and describe. The tradition holds that it cannot decide for the body it lives in, which is inner authority’s work.'],
        ['Inner and outer together', 'Inner authority decides for you. Outer authority is what you can give. The two are meant to work side by side rather than compete.'],
        ['Outer authority is not mental authority', 'Mental authority is one of the inner authorities, the one that decides through surroundings and sounding boards. Outer authority belongs to every type and every chart.'],
        ['Passenger', 'The tradition pictures the mind as a passenger in the vehicle of the body: free to look out of the window and describe the view, and happiest when it is not reaching for the wheel.']
      ],
      see: [],
      words: [['bedrock', 'Inner Authority'], ['weather', 'Rave Cosmology']] },

    /* ---------------- Weather ---------------- */
    { tier: 'weather', name: 'Definition', epi: 'What a chart holds fixed',
      lead: 'Definition is whatever a chart holds constant. A channel is defined when both of its gates are activated, and a defined channel defines the two centers it joins. What is defined is consistent and broadcast to others; what is not is open and takes in others. How the defined areas connect to one another is a category of its own.',
      parts: [
        ['Single definition', 'Every defined center joins every other in one unbroken piece. Read as self-contained.'],
        ['Split definition', 'Two separate areas with nothing joining them. Read as a built-in search for whatever bridges the gap, often felt as an attraction to the people who carry it.'],
        ['Simple split and wide split', 'Teachers distinguish a simple split, closed by a single bridging gate, from a wide split, which needs a whole channel or more. These two names are teachers’ usage rather than the published four.'],
        ['Triple split', 'Three separate areas. Read as needing variety and time before settling.'],
        ['Quadruple split', 'Four separate areas, the rarest pattern. Read as hard to condition and in need of a great deal of variety.'],
        ['No definition', 'Nothing defined, which is only ever the Reflector.'],
        ['Defined, undefined and open', 'A defined center is fixed. An undefined center has gates activated but no full channel. A completely open center has no gates activated at all, and teachers read it as the widest openness of the three.'],
        ['Bridging gates', 'The gates that would join separate areas of definition. Whoever carries them, a person or the day’s transits, completes the chart for a while.']
      ],
      see: [['definition', 'Single Definition'], ['definition', 'Split Definition'], ['definition', 'Triple Split Definition'], ['definition', 'Quadruple Split Definition'], ['definition', 'No Definition']],
      words: [['terms', 'Hanging Gate'], ['weather', 'Centers']] },

    { tier: 'weather', name: 'Profile', epi: 'The role you wear',
      lead: 'Profile is the role a person plays in the world, taken from two lines: the conscious line of the Personality Sun and the unconscious line of the Design Sun. Only twelve pairs occur, because the Design Sun sits a fixed arc behind the Personality Sun.',
      parts: [
        ['The lower lines, 1 to 3', 'The lower trigram of a hexagram. Read as personal and self-directed: building a foundation, guarding a natural gift, learning by trial.'],
        ['The upper lines, 4 to 6', 'The upper trigram. Read as directed outward: a network, the projections of strangers, an example to others.'],
        ['Harmonic lines', 'Line 1 pairs with 4, 2 with 5, and 3 with 6, the same position in the lower and upper trigram. Teachers read people whose lines harmonise this way as easily recognisable to one another.'],
        ['Conscious and unconscious', 'The first number is the line you tend to know about yourself. The second is the one others often see first.'],
        ['The twelve', '1/3, 1/4, 2/4, 2/5, 3/5, 3/6 and 4/6 are the seven personal profiles; 4/1 stands alone; 5/1, 5/2, 6/2 and 6/3 are the four transpersonal ones.']
      ],
      see: [['profiles', '1/3'], ['lines', 1], ['lines', 6]],
      words: [['weather', 'Angle']] },

    { tier: 'weather', name: 'Angle', epi: 'The geometry of a life’s theme',
      lead: 'Angle is set by profile, and it decides which of three families of Incarnation Cross a person carries. The cross is the four gates of the Personality and Design Suns and Earths; the angle is the slant at which its theme is lived.',
      parts: [
        ['Right Angle', 'The seven personal profiles, from 1/3 to 4/6. The theme is described as personal: lived mostly through your own process, with other people as company rather than as the point.'],
        ['Juxtaposition', 'The 4/1 profile only. The theme is described as fixed: a narrow line held steadily between the personal and the transpersonal.'],
        ['Left Angle', 'The four transpersonal profiles: 5/1, 5/2, 6/2 and 6/3. The theme is described as worked out through encounters with other people.'],
        ['How many crosses', 'The published convention counts 192 general Incarnation Crosses by angle.'],
        ['The four Quarters', 'The wheel of 64 gates is divided into four Quarters of 16 hexagrams each: Initiation, Civilization, Duality and Mutation. Each is read as purpose fulfilled in its own way: through mind, through form, through bonding and through transformation. A cross belongs to the Quarter its Personality Sun falls in.'],
        ['A word on the older names', 'The founding literature gives the three angles older names that read as forecasts. inCommon keeps to personal, fixed and transpersonal, which describe the same geometry without one.']
      ],
      see: [['cross', 'what'], ['cross', 'angles'], ['profiles', '4/1']],
      words: [['weather', 'Profile'], ['horizon', 'Cycles']] },

    { tier: 'weather', name: 'Centers', epi: 'Nine hubs, four kinds of work',
      lead: 'The nine centers are the hubs of the wiring, drawn from the older seven-chakra picture and split into nine. Each has a defined and an open way of working, and they fall into kinds by what they do: they press, they become aware, they power, they express, and they give identity.',
      parts: [
        ['Pressure centers', 'The Head and the Root. The Head presses to know and the Root presses to act; both push energy toward the rest of the chart.'],
        ['Awareness centers', 'The Spleen, the Ajna and the Solar Plexus: awareness of the body, of the mind, and the emerging awareness the tradition calls spirit.'],
        ['Motor centers', 'The Sacral, the Heart, the Solar Plexus and the Root. Only these supply energy, and a motor reaching the Throat is what makes a type able to manifest.'],
        ['The Throat', 'The center of manifestation, where everything becomes speech or action. Eleven gates, more than any other.'],
        ['The G', 'Identity, love and direction. The tradition seats the magnetic monopole here.'],
        ['Defined and open', 'A defined center works the same way every day and is what you lend to others. An open center takes in and amplifies what others bring, and is where the tradition locates both conditioning and wisdom.']
      ],
      see: [['centers', 'Head'], ['centers', 'Ajna'], ['centers', 'Throat'], ['centers', 'G'], ['centers', 'Heart'], ['centers', 'Spleen'], ['centers', 'Sacral'], ['centers', 'Solar Plexus'], ['centers', 'Root']],
      words: [['open', 'Sacral'], ['horizon', 'Awareness']] },

    { tier: 'weather', name: 'Circuits', epi: 'Families of channels',
      lead: 'Channels sort into families called circuits, and the circuits into three groups, each with its own keynote: the individual group empowers, the tribal group supports, the collective group shares. A circuit is read as the purpose the energy of its channels serves.',
      parts: [
        ['Knowing circuit (individual)', 'Insight that arrives whole and cannot be argued into being, with uncertainty as its theme and melancholy as its familiar mood. Channels 1-8, 2-14, 3-60, 12-22, 23-43, 24-61, 28-38 and 39-55.'],
        ['Centering circuit (individual)', 'A minor circuit about the empowerment of personal will. Channels 10-34 and 25-51.'],
        ['Integration channels (individual)', 'Gates 10, 20, 34 and 57, which can define in several combinations and are the only multi-gate definition in the system. Their theme is personal survival in the present. Channels 10-20, 10-57, 20-34, 20-57 and 34-57, with 10-34 joining the same four gates.'],
        ['Understanding circuit (collective)', 'Logic: patterns that can be tested and repeated, shared so others need not learn them again. Channels 4-63, 5-15, 7-31, 9-52, 16-48, 17-62 and 18-58.'],
        ['Sensing circuit (collective)', 'The abstract way: experience lived through and made sense of afterwards. Channels 11-56, 13-33, 29-46, 30-41, 35-36, 42-53 and 47-64.'],
        ['Ego circuit (tribal)', 'Resources, bargains, belonging and loyalty, and the only circuit whose flow runs to the Heart rather than the Throat. Channels 19-49, 21-45, 26-44, 32-54 and 37-40.'],
        ['Defense circuit (tribal)', 'Nurture, intimacy and care for the young. Channels 6-59 and 27-50.']
      ],
      see: [['circuitry', 'Individual Circuitry'], ['circuitry', 'Tribal Circuitry'], ['circuitry', 'Collective Circuitry']],
      words: [['weather', 'Streams'], ['terms', 'Integration Channels']] },

    { tier: 'weather', name: 'Streams', epi: 'Currents through awareness',
      lead: 'A stream is a run of gates carrying a potential from a pressure center through an awareness center toward expression. Each awareness center has three, so the wiring holds nine streams of awareness, and teachers follow each one gate by gate as a story of how that kind of knowing matures.',
      parts: [
        ['Spleen: instinct, intuition and taste', 'The Spleen\u2019s awareness is read through three themes: instinct, intuition and taste.'],
        ['Ajna: abstract, logical, individual', 'Conceptualizing runs in three streams: the abstract idea through gates 64, 47 and 11, the logical fact through 63, 4 and 17, and the individual insight through 61, 24 and 43, each then reaching the Throat.'],
        ['Solar Plexus: need, uncertainty, desire', 'The emotional wave is read in three variations: the tribal wave of need, the individual wave of uncertainty and the collective wave of desire. The tribal stream runs through gates 19, 49, 37 and 40, and the collective stream of feeling through 41, 30, 36 and 35.'],
        ['Why streams matter', 'A stream shows a gate in context: what pressure feeds it, what awareness it carries, and where it wants to come out.']
      ],
      see: [['centers', 'Spleen'], ['centers', 'Ajna'], ['centers', 'Solar Plexus']],
      words: [['horizon', 'Awareness'], ['weather', 'Circuits']] },

    { tier: 'weather', name: 'Rave Cosmology', epi: 'The story behind the chart',
      lead: 'Rave Cosmology is the system’s account of where a design comes from. It is metaphysics rather than mechanics, the frame the founder gave for the chart, and it is best read as that frame rather than as something the chart demonstrates.',
      parts: [
        ['The Biverse', 'The founder’s word for a cosmos that is dual at its root, yin and yang before anything else.'],
        ['The Maia', 'The world of form, from a Sanskrit root meaning to measure. The system describes itself as the mechanics of the Maia.'],
        ['The neutrino and the Program', 'The neutrino is held to carry information as it passes through every body. The Program is the patterned, cyclical effect of that stream on all life, carried by the movement of the astral bodies.'],
        ['The crystals', 'Two crystals of consciousness: the Personality crystal, placed at the Head center, and the Design crystal, placed within the skull. The black activations are the Personality and the red ones the Design.'],
        ['The magnetic monopole', 'A single-poled magnet the tradition places in the G, at the sternum. It holds the two crystals together and is said to steer the body along its line through space.'],
        ['Passenger and vehicle', 'The Personality is the passenger and the Design is the vehicle, the body. The passenger rides; the vehicle knows the road.'],
        ['The Voice', 'The founder’s name for the source of the teaching he reported receiving on Ibiza in January 1987.']
      ],
      see: [['terms', 'Design and Personality Crystals'], ['intro', 0]],
      words: [['horizon', 'Mechanics'], ['horizon', 'Evolution']] },

    /* ---------------- Horizon ---------------- */
    { tier: 'horizon', name: 'Evolution', epi: 'A body still changing',
      lead: 'The tradition sets every chart inside a larger story of human change, in which forms of awareness arrive one after another and the body itself goes on mutating. These are the system’s own claims about history, offered as its framework rather than as findings.',
      parts: [
        ['Seven centers to nine', 'The tradition holds that humanity was seven-centered until 1781, the year Uranus was discovered, and has been nine-centered since. It calls nine-centered beings Rave.'],
        ['Awareness in sequence', 'Splenic awareness is described as the oldest, keeping the body alive; mental awareness came next; emotional awareness is described as still arriving.'],
        ['2027 and the Solar Plexus', 'The tradition expects the Solar Plexus to begin a mutation around 2027, through gates 55 and 49, and calls the children born into it Rave children.'],
        ['Global cycles', 'History is read as long eras, each carrying the theme of an Incarnation Cross. The tradition dates the present era, the Cross of Planning, from 1615 to 2027, followed by the Cross of the Sleeping Phoenix.'],
        ['Mutation', 'In the wiring, change enters through the individual circuitry, which is why individual channels are read as arriving before anyone has asked for them.']
      ],
      see: [['circuitry', 'Individual Circuitry']],
      words: [['horizon', 'Cycles'], ['horizon', 'Awareness']] },

    { tier: 'horizon', name: 'Conditioning', epi: 'What is borrowed',
      lead: 'Conditioning is what the tradition says happens wherever a chart is open: the openness takes in other people’s definition and the day’s transits, and the mind mistakes the borrowed consistency for its own. It is not framed as harm. It is the ordinary mechanics of being open, and the place where the tradition locates both confusion and wisdom.',
      parts: [
        ['Open centers', 'An open center amplifies whatever definition is near it, so it can feel the borrowed energy more strongly than the person who lends it.'],
        ['The transit field', 'The moving astral bodies activate gates for everyone at once, so the whole world is conditioned by the same sky for a while. The tradition calls this the Program.'],
        ['Homogenization', 'The founder’s word for the pull to be like everyone else, which conditioning makes easy and the not-self mind welcomes.'],
        ['Deconditioning', 'Living by strategy and authority long enough for the body to sort its own definition from what was borrowed. The published convention calls it a seven-year cellular process and is candid that the middle of it can be uncomfortable.'],
        ['Conditioning between two charts', 'Where one person is defined and the other open, the defined one conditions the other. The four connection patterns, electromagnetic, companionship, dominance and compromise, name how.']
      ],
      see: [['terms', 'Conditioning'], ['terms', 'Deconditioning'], ['terms', 'Transits']],
      words: [['terms', 'Electromagnetic Connection'], ['bedrock', 'Not-Self Theme']] },

    { tier: 'horizon', name: 'Cycles', epi: 'Returns across a life',
      lead: 'Cycles are the timed returns the tradition reads across a year, across a life and across history. They describe the weather of a stage rather than an event, and the system presents them as seasons of the design.',
      parts: [
        ['The Moon', 'About 28 days to pass through all 64 gates. This is the Reflector’s rhythm.'],
        ['The Rave New Year', 'When the Sun enters gate 41, around the third week of January, the wheel begins again.'],
        ['Saturn return', 'Around 29 to 31. The tradition reads it as the end of the first stage of a life.'],
        ['Uranus opposition', 'Somewhere between 38 and 44: the mid-life point. The tradition says the first half of a life is lived through the South Node’s theme and the second through the North Node’s.'],
        ['Kiron return', 'Around 50 to 51. The founding texts spell the body Kiron. It opens the last stage of a life.'],
        ['The sixth line’s three stages', 'Trial and error from birth to the Saturn return; a stage on the roof, observing, until the Kiron return; then coming off the roof as a lived example.'],
        ['The Uranian life', 'About 84 years, one orbit of Uranus, which the tradition treats as a full human life cycle since 1781.']
      ],
      see: [['lines', 6]],
      words: [['horizon', 'Evolution']] },

    { tier: 'horizon', name: 'Mechanics', epi: 'How it is built',
      lead: 'Mechanics is the tradition’s word for how the system is put together: what is calculated and how the parts connect, as distinct from what any of it is said to mean. The founding phrase is the mechanics of the Maia.',
      parts: [
        ['Two moments', 'The Personality is cast for the birth moment. The Design is cast for the moment the Sun stood 88 degrees of solar arc earlier, roughly 88 days before birth.'],
        ['Thirteen bodies on each side', 'The Sun, the Earth, the Moon, the North and South Nodes, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto, giving 26 activations in all.'],
        ['The wheel', 'The 64 gates are laid around the zodiac, 5.625 degrees each, beginning with gate 41. Each gate has six lines.'],
        ['The address of a position', 'Gate, line, color, tone and base: six lines to a gate, six colors to a line, six tones to a color and five bases to a tone.'],
        ['From gate to type', 'Two gates make a channel, a channel defines two centers, and the pattern of defined centers gives type, authority and definition.'],
        ['Black and red', 'Personality activations are printed in black and Design activations in red. A gate in both is shown striped.']
      ],
      see: [['terms', 'The Wiring'], ['terms', 'Color, Tone and Base']],
      words: [['weather', 'Definition'], ['horizon', 'Variable']] },

    { tier: 'horizon', name: 'Awareness', epi: 'Three ways of knowing',
      lead: 'Three of the nine centers are awareness centers, and the tradition describes each as a different kind of knowing: the body’s in the Spleen, the mind’s in the Ajna, and the emerging awareness of spirit in the Solar Plexus. Awareness is distinct from energy. The awareness centers know; the motors move.',
      parts: [
        ['Splenic awareness', 'The oldest, concerned with survival and wellbeing, speaking once and only in the present.'],
        ['Mental awareness', 'The Ajna’s way: concepts, comparisons and research, working across time and best offered to others.'],
        ['Emotional awareness', 'The Solar Plexus’s way: clarity that comes across the wave, which the tradition expects to deepen after 2027.'],
        ['Streams of awareness', 'Each awareness center carries three streams, nine in all, which follow a potential from pressure to expression.'],
        ['The fears of awareness', 'Ra Uru Hu taught that awareness carries fear: the Spleen\u2019s are fears of survival, one to each gate, and the Ajna\u2019s fear is anxiety. The seven splenic fears are of authority (18), of death and a life without meaning (28), of failure (32), of the past (44), of inadequacy (48), of responsibility (50) and of the future (57). Modern teachers also give each Solar Plexus gate a nervousness and each Ajna gate an anxiety; the Ajna lists still differ from one teacher to the next.']
      ],
      see: [['centers', 'Spleen'], ['centers', 'Ajna'], ['centers', 'Solar Plexus']],
      words: [['weather', 'Streams'], ['terms', 'Emotional Wave']] },

    { tier: 'horizon', name: 'Variable', epi: 'The finest grain',
      lead: 'Variable is the system’s advanced layer: four arrows beside the head of the chart, read from the color and tone beneath the Sun and Node activations on each side. Teachers present it as the fine print of how one body and one mind are built to take in the world. inCommon names the four and their variants here and does not yet compute them for a chart.',
      parts: [
        ['Determination (top left, Design)', 'Also called digestion: how the body is said to take in nourishment. Six colors: Appetite, consecutive or alternating; Taste, open or closed; Thirst, hot or cold; Touch, calm or nervous; Sound, high or low; Light, direct or indirect.'],
        ['Environment (bottom left, Design)', 'Where the body is said to do best. Six colors: Caves, selective or blending; Markets, internal or external; Kitchens, wet or dry; Mountains, active or passive; Valleys, narrow or wide; Shores, natural or artificial.'],
        ['Motivation (top right, Personality)', 'Why the mind does what it does. Some teachers call this arrow awareness. Six colors: Fear, Hope, Desire, Need, Guilt and Innocence.'],
        ['Perspective (bottom right, Personality)', 'Also called view: what the mind is built to notice. Six colors: Survival, Possibility, Power, Wanting, Probability and Personal.'],
        ['Cognition and sense', 'The tones name senses. On the Design side, cognition: smell, taste, outer vision, inner vision, feeling and touch. On the Personality side, the sense keys: security, uncertainty, action, meditation, judgment and acceptance.'],
        ['Transference', 'When the not-self takes over, Motivation and Perspective are said to flip to the color three places away: Fear with Need, Hope with Guilt, Desire with Innocence; Survival with Wanting, Possibility with Probability, Power with Personal. The Design arrows have no transference.']
      ],
      see: [['terms', 'Variables and the Four Arrows'], ['terms', 'Color, Tone and Base']],
      words: [['horizon', 'Left or Right'], ['horizon', 'Mechanics']] },

    { tier: 'horizon', name: 'Left or Right', epi: 'Strategic or receptive',
      lead: 'Each of the four arrows points left or right, and the direction comes from the tone beneath it: tones 1 to 3 point left, tones 4 to 6 point right. Left is described as strategic, focused and active. Right is described as receptive, peripheral and passive. Neither is better; they are two builds.',
      parts: [
        ['Determination', 'As with every arrow, left is read as strategic and active and right as receptive and passive: how deliberately the body is said to need to approach nourishment.'],
        ['Environment', 'Left is described as being observed, right as observing: whether the body does best seen within its setting or watching it.'],
        ['Motivation', 'Left is strategic, right is receptive: whether the mind is said to drive toward a goal or take in what arrives.'],
        ['Perspective', 'Left is focused, right is peripheral: whether the mind is said to see best narrowly or take in the wide field.'],
        ['Sixteen combinations', 'With four arrows and two directions, sixteen configurations are possible. Teachers write them as a short code of letters, Personality pair first, then Design.']
      ],
      see: [['terms', 'Variables and the Four Arrows']],
      words: [['horizon', 'Variable']] }
  ];

  /* The circuit of each channel, one family per channel. The Integration
     set takes 10-34 as well in teachers' usage; it is filed here under
     Centering so every channel has exactly one family, and the lesson says
     so. M-row tests hold the partition to all 36. */
  var CIRCUIT_OF = {
    Knowing: ['1-8', '2-14', '3-60', '12-22', '23-43', '24-61', '28-38', '39-55'],
    Centering: ['10-34', '25-51'],
    Integration: ['10-20', '10-57', '20-34', '20-57', '34-57'],
    Understanding: ['4-63', '5-15', '7-31', '9-52', '16-48', '17-62', '18-58'],
    Sensing: ['11-56', '13-33', '29-46', '30-41', '35-36', '42-53', '47-64'],
    Ego: ['19-49', '21-45', '26-44', '32-54', '37-40'],
    Defense: ['6-59', '27-50']
  };
  function circuitOf(key) {
    var out = null;
    Object.keys(CIRCUIT_OF).forEach(function (c) { if (CIRCUIT_OF[c].indexOf(key) !== -1) out = c; });
    return out;
  }

  /* ---------- the lexicon, beyond the further terms ----------
     Every other standard term and its variants, one short entry each, in
     inCommon's own words. These join TERMS and the chapter sorts the whole
     list alphabetically. `see` points at the lesson or shelf that carries
     the full account. */
  var LEXICON = [
    { name: 'Activation', text: 'One astral body standing in one gate and line, on either the Personality or the Design side. A chart has 26 of them, and they are the raw facts every other idea is read from.', see: ['horizon', 'Mechanics'] },
    { name: 'Astral Bodies', text: 'The thirteen positions cast on each side of a chart: the Sun, the Earth, the Moon, the North and South Nodes, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto. The Sun and Earth together carry most of the weight, about seventy percent of the imprint in the tradition’s own reckoning.', see: ['horizon', 'Mechanics'] },
    { name: 'Awareness Centers', text: 'The Spleen, the Ajna and the Solar Plexus, the three centers that know rather than move: body, mind and the emerging awareness of spirit.', see: ['horizon', 'Awareness'] },
    { name: 'Alpha', text: 'In the published dictionary\u2019s account of the Wa, the one member beyond its three small groups. Little else written about it was found.', see: ['terms', 'Penta'] },
    { name: 'BG5', text: 'The business and career application of the system, taught by the BG5 Business Institute, which reads charts for work and for working groups.', see: ['terms', 'Penta'] },
    { name: 'Gap', text: 'In a small group, a part of the group\u2019s own wiring that nobody present defines. One published talk says a group\u2019s attention keeps going to its gaps.', see: ['terms', 'Penta'] },
    { name: 'OC16', text: 'The large-group business application of the system, named beside the Wa as a body of knowledge for working with large groups of people.', see: ['terms', 'Penta'] },
    { name: 'Penta', text: 'The group aura the tradition says forms when three to five people are regularly together, and which then leads the group. It is drawn from the six channels between the Sacral, the G and the Throat (2-14, 5-15, 29-46, 1-8, 7-31 and 13-33) and has no awareness center, no Heart and no Root of its own. Read as the ground of family and small-business life. Some pages say three or more.', see: ['channels', '5-15'] },
    { name: 'Trans-Auric Form', text: 'An aura made by several people together rather than by one, which the tradition says shapes everyone in it. There are two: the Penta and the Wa. Also called a transpersonal form.', see: ['terms', 'Penta'] },
    { name: 'Wa', text: 'The larger group aura, said to be built from several small groups and driven toward material success. Its size is given differently on different published pages: nine to sixteen people, nine or more, and sixteen or more; one account has it as three small groups and an Alpha.', see: ['terms', 'Penta'] },
    { name: 'Base', text: 'The deepest layer of a position, below color and tone. There are five bases to a tone, and the tradition reads them as the most fundamental orientation of a design.', see: ['terms', 'Color, Tone and Base'] },
    { name: 'Biverse', text: 'The founder’s word for a cosmos that is dual at its root.', see: ['weather', 'Rave Cosmology'] },
    { name: 'Black and Red', text: 'The two colors of a printed chart. Black marks the Personality, the side you tend to know; red marks the Design, the side that runs below awareness.', see: ['horizon', 'Mechanics'] },
    { name: 'Bridging Gate', text: 'A gate that would join two separate areas of definition. Whoever carries it completes the chart for as long as they are near.', see: ['weather', 'Definition'] },
    { name: 'Centering Circuit', text: 'A minor circuit in the individual group about the empowerment of personal will, made of channels 10-34 and 25-51.', see: ['weather', 'Circuits'] },
    { name: 'Channel', text: 'The line joining two gates in two centers. When both gates are activated the channel is defined, and so are the two centers it joins. There are 36.', see: ['channels', '1-8'] },
    { name: 'Circuit Group', text: 'The three large families of channels: individual, tribal and collective, with the integration channels counted under the individual group. Their keynotes are empowerment, support and sharing.', see: ['weather', 'Circuits'] },
    { name: 'Cognition', text: 'The tone beneath the Design Sun, read as the sense through which the body takes in the world: smell, taste, outer vision, inner vision, feeling or touch.', see: ['horizon', 'Variable'] },
    { name: 'Collective Circuit Group', text: 'The understanding and sensing circuits, whose keynote is sharing: experience and pattern passed on for everyone’s use.', see: ['circuitry', 'Collective Circuitry'] },
    { name: 'Color', text: 'The layer of a position beneath the line. Six colors to a line; the color of the Sun and Node activations gives the four Variables.', see: ['horizon', 'Variable'] },
    { name: 'Completely Open Center', text: 'A center with no gates activated at all. Teachers read it as the widest openness, with no theme of its own to lean on.', see: ['weather', 'Definition'] },
    { name: 'Cross of Planning', text: 'The theme the tradition gives the present era of history, dated from 1615 to 2027.', see: ['horizon', 'Evolution'] },
    { name: 'Cross of the Sleeping Phoenix', text: 'The theme the tradition gives the era it expects to follow 2027.', see: ['horizon', 'Evolution'] },
    { name: 'Defense Circuit', text: 'The smaller tribal circuit, of nurture, intimacy and care for the young: channels 6-59 and 27-50.', see: ['weather', 'Circuits'] },
    { name: 'Defined Center', text: 'A center joined to another by at least one defined channel. It works the same way every day and is what you broadcast to others.', see: ['open', 'Sacral'] },
    { name: 'Design', text: 'The red side of a chart, cast for the moment the Sun stood 88 degrees of solar arc before birth. Read as the body and its inheritance, running below conscious awareness.', see: ['horizon', 'Mechanics'] },
    { name: 'Design Sun', text: 'The Sun’s gate and line at the Design moment. It gives the second number of the profile and two of the four gates of the Cross.', see: ['weather', 'Profile'] },
    { name: 'Determination', text: 'The top left arrow, from the Design side, also called digestion: how the body is said to take in nourishment best. Its six colors are Appetite, Taste, Thirst, Touch, Sound and Light.', see: ['horizon', 'Variable'] },
    { name: 'Earth', text: 'Always the gate opposite the Sun on the same side. It is read as grounding, and with the Sun it makes the Cross.', see: ['cross', 'what'] },
    { name: 'Ego Circuit', text: 'The larger tribal circuit, of resources, bargains, belonging and loyalty, and the only circuit that runs to the Heart rather than the Throat: channels 19-49, 21-45, 26-44, 32-54 and 37-40.', see: ['weather', 'Circuits'] },
    { name: 'Emotional Wave Types', text: 'Three shapes of emotional wave. The tribal wave builds by steps, one forward and one back, until it releases. The individual wave runs level and then spikes. The collective wave climbs gradually and falls sharply. Their themes are given as need, passion and desire; one entry in the published dictionary calls the individual theme uncertainty instead of passion.', see: ['weather', 'Streams'] },
    { name: 'Energy Type', text: 'Manifestors, Generators and Manifesting Generators: the types with a motor defined in a way that gives consistent access to working energy.', see: ['bedrock', 'Type'] },
    { name: 'Environment', text: 'The bottom left arrow, from the Design side: the kind of surroundings the body is said to do best in. Its six colors are Caves, Markets, Kitchens, Mountains, Valleys and Shores.', see: ['horizon', 'Variable'] },
    { name: 'Exaltation and Detriment', text: 'The two poles of a line. Each line is given one or more astral bodies that exalt it and one or more in its detriment, and an activation by one of them is said to fix the line in that expression; fixed both ways at once is a juxtaposition. Ra Uru Hu regretted the two names, because they read as good and bad when they describe a polarity within the line.', see: ['gates', 'g1'] },
    { name: 'Gate', text: 'One of the 64 divisions of the wheel, each matching a hexagram of the I Ching, and each housed in one center. Gate N is hexagram N.', see: ['gates', 'g1'] },
    { name: 'Generator', text: 'The type with a defined Sacral. In the published convention it is an umbrella with two kinds, the Pure Generator and the Manifesting Generator, together about seven in ten people. Strategy to respond, signature satisfaction, not-self theme frustration.', see: ['types', 'Generator'] },
    { name: 'Global Cycle', text: 'An era of history read as carrying the theme of one Incarnation Cross. The present one is the Cross of Planning.', see: ['horizon', 'Evolution'] },
    { name: 'Harmonic Gate', text: 'The gate at the other end of a channel. Two harmonic gates make the channel; either alone is a hanging gate.', see: ['terms', 'Hanging Gate'] },
    { name: 'Hexagram', text: 'A figure of six lines from the I Ching. The system lays the 64 hexagrams around the zodiac as its 64 gates, and each line of a hexagram becomes a line of the gate.', see: ['gates', 'g1'] },
    { name: 'Homogenization', text: 'The founder’s word for the pull to be like everyone else, which conditioning makes easy.', see: ['horizon', 'Conditioning'] },
    { name: 'Incarnation Cross', text: 'The four gates of the Personality Sun and Earth and the Design Sun and Earth, read as the theme a life plays out against. The published convention counts 192 by angle.', see: ['cross', 'what'] },
    { name: 'Individual Circuit Group', text: 'The knowing and centering circuits with the integration channels, whose keynote is empowerment: something new brought in, which the group did not know it needed.', see: ['circuitry', 'Individual Circuitry'] },
    { name: 'Integration Channels', text: 'The channels among gates 10, 20, 34 and 57, the only place in the wiring where several gates can define together. Their theme is personal survival in the present.', see: ['weather', 'Circuits'] },
    { name: 'Juxtaposition', text: 'The angle of the 4/1 profile, described as fixed: a narrow line held between the personal and the transpersonal.', see: ['weather', 'Angle'] },
    { name: 'Kiron Return', text: 'The return of Chiron, which the founding texts spell Kiron, around age 50 to 51. It opens the last stage of a life and brings a sixth line off the roof.', see: ['horizon', 'Cycles'] },
    { name: 'Knowing Circuit', text: 'The main individual circuit: insight that arrives whole, with uncertainty as its theme and melancholy as its familiar mood.', see: ['weather', 'Circuits'] },
    { name: 'Left Angle', text: 'The angle of the four transpersonal profiles, 5/1, 5/2, 6/2 and 6/3, where the theme is worked out through other people.', see: ['weather', 'Angle'] },
    { name: 'Line', text: 'One of the six positions within a gate, from the lines of the hexagram. The lines of the two Suns give the profile.', see: ['lines', 1] },
    { name: 'Lower and Upper Trigram', text: 'The two halves of a hexagram. Lines 1 to 3 are the lower, read as personal; lines 4 to 6 the upper, read as turned toward others.', see: ['weather', 'Profile'] },
    { name: 'Lunar Cycle', text: 'The Moon’s passage through all 64 gates, about 28 days, which is the span a Reflector is advised to give a large decision.', see: ['bedrock', 'Strategy'] },
    { name: 'Magnetic Monopole', text: 'A single-poled magnet the tradition seats in the G. It holds the two crystals of consciousness together and is said to steer the body along its line.', see: ['weather', 'Rave Cosmology'] },
    { name: 'Maia', text: 'The world of form. The system calls itself the mechanics of the Maia.', see: ['weather', 'Rave Cosmology'] },
    { name: 'Manifestation', text: 'Turning energy into action or speech, which only the Throat can do. A motor reaching the Throat is what makes a type able to manifest directly.', see: ['centers', 'Throat'] },
    { name: 'Manifesting Generator', text: 'A Generator whose Throat is joined to a motor, by a channel or through other defined centers; the motor may be the Sacral itself. The published convention calls it a kind of Generator, not a separate type, while many teachers and some reference works count it as a fifth. Given as about half of all Generators, roughly a third of people. Often shortened to MG.', see: ['types', 'Manifesting Generator'] },
    { name: 'Mid-Life Point', text: 'The Uranus opposition, between about 38 and 44, when the tradition says a life turns from the South Node’s theme to the North Node’s.', see: ['horizon', 'Cycles'] },
    { name: 'Minor Authorities', text: 'Ego, self-projected and mental authority, taken together: a small share of people, all Manifestors or Projectors.', see: ['bedrock', 'Inner Authority'] },
    { name: 'Motivation', text: 'The top right arrow, from the Personality side, read as why the mind does what it does. Its six colors are Fear, Hope, Desire, Need, Guilt and Innocence. Some teachers call this arrow awareness.', see: ['horizon', 'Variable'] },
    { name: 'Motor Centers', text: 'The Sacral, the Heart, the Solar Plexus and the Root, the four centers that supply energy.', see: ['weather', 'Centers'] },
    { name: 'Neutrino', text: 'The particle the tradition holds carries information through every body, imprinting the design at the two moments a chart is cast.', see: ['weather', 'Rave Cosmology'] },
    { name: 'Nodes', text: 'The North and South Nodes of the Moon, cast on both sides. They give the two bottom arrows and the themes of the two halves of a life.', see: ['horizon', 'Cycles'] },
    { name: 'Non-Energy Type', text: 'Projectors and Reflectors, read as having no consistent working energy of their own, and as built to guide and to reflect.', see: ['bedrock', 'Type'] },
    { name: 'Not-Self Mind', text: 'The mind trying to make decisions it is not built to make, usually by acting out the habits of the open centers.', see: ['bedrock', 'Not-Self Theme'] },
    { name: 'Outer Authority', text: 'The mind at its proper work: knowledge and perspective offered to others, once it has stopped deciding for you.', see: ['bedrock', 'Outer Authority'] },
    { name: 'Passenger and Vehicle', text: 'The tradition’s picture of a person: the Personality as a passenger riding in the Design, the body, which knows the road.', see: ['weather', 'Rave Cosmology'] },
    { name: 'Personality', text: 'The black side of a chart, cast for the birth moment. Read as the conscious self, the one you tend to identify with.', see: ['horizon', 'Mechanics'] },
    { name: 'Personality Sun', text: 'The Sun’s gate and line at birth. It gives the first number of the profile and two of the four gates of the Cross.', see: ['weather', 'Profile'] },
    { name: 'Perspective', text: 'The bottom right arrow, from the Personality side, also called view: what the mind is built to notice. Its six colors are Survival, Possibility, Power, Wanting, Probability and Personal.', see: ['horizon', 'Variable'] },
    { name: 'Pressure Centers', text: 'The Head and the Root, which push rather than power: pressure to know and pressure to act.', see: ['weather', 'Centers'] },
    { name: 'Pure Generator', text: 'A Generator whose Throat is not joined to any motor. The published convention names it beside the Manifesting Generator as the two kinds of Generator, with the same strategy, signature and not-self theme. Given as about half of all Generators.', see: ['types', 'Generator'] },
    { name: 'Program', text: 'The tradition’s word for the patterned, cyclical effect of the neutrino stream on all life, carried by the moving astral bodies.', see: ['horizon', 'Conditioning'] },
    { name: 'Quarter', text: 'One of four arcs of 16 hexagrams on the wheel: Initiation, which opens at gate 13, Civilization at gate 2, Duality at gate 7 and Mutation at gate 1.', see: ['weather', 'Angle'] },
    { name: 'Rave', text: 'The tradition’s name for nine-centered human beings, which it dates from 1781.', see: ['horizon', 'Evolution'] },
    { name: 'Rave Children', text: 'The tradition’s name for children it expects to be born with a mutated Solar Plexus after 2027.', see: ['horizon', 'Evolution'] },
    { name: 'Rave Mandala', text: 'The wheel of 64 gates laid around the zodiac, from which every activation is read.', see: ['horizon', 'Mechanics'] },
    { name: 'Rave New Year', text: 'The Sun’s entry into gate 41, around the third week of January, where the wheel begins.', see: ['horizon', 'Cycles'] },
    { name: 'Right Angle', text: 'The angle of the seven personal profiles, from 1/3 to 4/6, where the theme is lived mostly through your own process.', see: ['weather', 'Angle'] },
    { name: 'Sacral Response', text: 'The Sacral’s answer to a yes or no question, often heard as a sound before words: a rising sound for yes, a falling one for no. It is the decision of a Generator with sacral authority.', see: ['authorities', 'Sacral'] },
    { name: 'Saturn Return', text: 'Saturn coming back to its birth position, around age 29 to 31, read as the close of the first stage of a life.', see: ['horizon', 'Cycles'] },
    { name: 'Sense', text: 'The tone beneath the Personality Sun, read as the mind’s key to awareness: security, uncertainty, action, meditation, judgment or acceptance.', see: ['horizon', 'Variable'] },
    { name: 'Sensing Circuit', text: 'The abstract half of the collective group: experience lived through and made sense of afterwards.', see: ['weather', 'Circuits'] },
    { name: 'Solar Plexus Mutation', text: 'The change the tradition expects to begin around 2027, through gates 55 and 49, carrying a new emotional awareness.', see: ['horizon', 'Evolution'] },
    { name: 'Streams of Awareness', text: 'The nine runs of gates, three through each awareness center, that carry a potential from pressure toward expression.', see: ['weather', 'Streams'] },
    { name: 'Tone', text: 'The layer beneath color. Six tones to a color; tones 1 to 3 point an arrow left and 4 to 6 point it right.', see: ['horizon', 'Left or Right'] },
    { name: 'Transference', text: 'The flip the tradition says Motivation and Perspective make under the not-self, to the color three places away.', see: ['horizon', 'Variable'] },
    { name: 'Tribal Circuit Group', text: 'The ego and defense circuits, whose keynote is support: keeping people fed, held and bound by agreement.', see: ['circuitry', 'Tribal Circuitry'] },
    { name: 'Understanding Circuit', text: 'The logical half of the collective group: patterns tested and repeated, then shared.', see: ['weather', 'Circuits'] },
    { name: 'Undefined Center', text: 'A center with one or more gates activated but no full channel. It is open to other people’s definition while still carrying its own leanings.', see: ['open', 'Sacral'] },
    { name: 'Uranian Cycle', text: 'One orbit of Uranus, about 84 years, which the tradition treats as the span of a full human life cycle.', see: ['horizon', 'Cycles'] },
    { name: 'Voice', text: 'The founder’s name for the source of the teaching he reported receiving in January 1987.', see: ['weather', 'Rave Cosmology'] },
    { name: 'Wheel', text: 'The circle of 64 gates of 5.625 degrees each, beginning with gate 41, which turns every astral position into a gate and line.', see: ['horizon', 'Mechanics'] }
  ];

  /* One alphabetical lexicon: the further terms and the rest together. */
  TERMS = TERMS.concat(LEXICON).sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });

  var SECTIONS = [
    ['intro', 'What Human Design is'],
    ['types', 'The five types'],
    ['lines', 'The six lines'],
    ['profiles', 'The twelve profiles'],
    ['centers', 'The nine centers'],
    ['gates', 'The 64 gates'],
    ['channels', 'The 36 channels'],
    ['circuitry', 'The three circuits'],
    ['definition', 'Definition'],
    ['cross', 'The Incarnation Cross'],
    ['strategies', 'Strategies'],
    ['authorities', 'Authorities'],
    ['open', 'Defined and undefined'],
    ['bedrock', 'Bedrock'],
    ['weather', 'Weather'],
    ['horizon', 'Horizon'],
    ['terms', 'The lexicon'],
    ['example', 'An example bodygraph']
  ];

  /* THE THREE LAYERS, ASSEMBLED. This lived in hd-composite.js, which is a
     mechanics module, first as seven hardcoded sentences and then as
     substitution against templates kept here. Either way it left mechanics
     reading interpretation, which is the one direction the boundary does not
     allow. It is interpretation start to finish, so it lives here.

     It takes a row exactly as hd-composite returns one and adds nothing to
     it: the fact is the module's, the tradition line and the question are
     this module's, and they come back apart rather than merged, which is
     what C27 asserts. The caution rides through untouched, because a screen
     that drops it fails C11 to C15. */
  function fillNames(s, holder, other) {
    return String(s || '').split('{holder}').join(holder).split('{other}').join(other);
  }
  function layers(row, nameA, nameB) {
    var a = nameA || 'You', b = nameB || 'They';
    var holder = row.holderName || a, other = row.otherName || b;
    /* The descriptor is looked up rather than read off the row, so a caller
       may hand over pure structure and hd-composite need not carry any of
       this module's text on its way through. */
    var meta = (row.gates && row.gates.length === 2) ? channel(row.gates[0], row.gates[1]) : null;
    var name = meta ? meta.name : row.name;
    var theme = meta ? meta.theme : row.theme;
    var meaning = meta ? meta.meaning : row.meaning;
    var trad = name
      ? (theme ? CONNECTION_TRADITION.namedWithTheme : CONNECTION_TRADITION.named)
          .split('{key}').join(row.key)
          .split('{name}').join(name)
          .split('{theme}').join(theme ? String(theme).toLowerCase() : '')
          .split('{meaning}').join(meaning || '')
      : CONNECTION_TRADITION.unnamed;
    return { fact: row.fact, tradition: trad,
      possibility: fillNames(CONNECTION_ASK[row.type], holder, other),
      caution: row.caution || '', hasCaution: !!row.caution };
  }

  return { VERSION: VERSION, INTRO: INTRO, TYPES: TYPES, LINES: LINES, PROFILES: PROFILES,
    CENTERS: CENTERS, AUTHORITIES: AUTHORITIES, STRATEGIES: STRATEGIES, CHANNELS: CHANNELS,
    GATES: GATES, EXAMPLE: EXAMPLE, SECTIONS: SECTIONS,
    DEFINITION: DEFINITION, CROSS: CROSS, CIRCUITS: CIRCUITS, TERMS: TERMS,
    TIERS: TIERS, LESSONS: LESSONS, CIRCUIT_OF: CIRCUIT_OF, circuitOf: circuitOf,
    CONNECTION_TRADITION: CONNECTION_TRADITION, CONNECTION_ASK: CONNECTION_ASK,
    layers: layers,
    centerOf: centerOf, gateName: gateName, channel: channel, channelKey: channelKey,
    channelsFor: channelsFor, profileFor: profileFor };
}));
