/* hd-atlas.js: inCommon Human Design reference. V1.0.0
   Pure data, no UI, no framework. Reference material only: nothing here reads
   or writes a profile. Every claim is the tradition's; the app tags it as such.
   Gendered descriptions are written as tendencies, never as rules, and the app
   presents them under a POSSIBILITY tag.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.HDAtlas = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '1.0.0';

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
      pct: 'about 37 percent',
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
      pct: 'about 11 percent',
      aura: 'Open and enveloping with a forward edge. People are drawn in and then find the Manifesting Generator already three steps ahead of the conversation.',
      signature: 'Satisfaction and peace together, which is why both the response and the informing have to be present for either to arrive.',
      notSelf: 'Frustration and anger together. Read as the signal of having skipped the response, the informing, or both.',
      def: 'A defined Sacral plus a motor-to-Throat connection. A hybrid: response first, then the capacity to act on it quickly.',
      strategy: 'Wait to respond, then inform. The response comes first; telling people comes second.',
      authority: 'Sacral, or emotional when the Solar Plexus is defined.',
      male: 'Often reads as fast, energetic, and impatient, prone to skipping a step and doubling back for it.',
      female: 'Often reads as dynamic and highly capable, sometimes too fast for the room, and may feel pressed to slow down.',
      strengths: 'Speed, efficiency, the ability to carry several things at once.',
      challenges: 'Frustration and anger together, impatience, skipping the step that mattered.',
      opportunities: 'To slow down just enough to respond, and to inform after the response rather than instead of it.',
      obstacles: 'Initiating out of urgency, and treating the response step as optional.'
    },
    Projector: {
      pct: 'about 22 percent',
      aura: 'Focused and penetrating, aimed at one person at a time. It is felt as being seen, and occasionally as being seen rather too accurately.',
      signature: 'Success. Not status, in the tradition’s sense, but the recognition of having guided something correctly.',
      notSelf: 'Bitterness. Read as the signal of having entered without invitation, or of having gone unrecognized for too long.',
      def: 'No defined Sacral. A non-energy type, read as built to see and guide the energy of others rather than to generate it.',
      strategy: 'Wait for the invitation. Wait to be recognized for the thing you actually are, then enter.',
      authority: 'Various: self-projected, splenic, mental, or ego.',
      male: 'Often reads as observant and incisive, and can turn bitter where recognition never arrives. Needs to be seen for a specific gift.',
      female: 'Often reads as penetrating and intuitive, and may struggle with being overlooked. Needs correct invitations in order to lead.',
      strengths: 'Guidance, systems, seeing another person clearly.',
      challenges: 'Bitterness without recognition, and exhaustion from proving worth.',
      opportunities: 'To wait for correct invitations, and to use the waiting to study.',
      obstacles: 'Entering uninvited, and overworking to justify a place.'
    },
    Reflector: {
      pct: 'about 1 percent',
      aura: 'Sampling and resistant. A Reflector takes the room in and gives very little fixed back, which is what makes the read on a community possible.',
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
      sub: 'Sub-circuits: Knowing, Centering, and Integration.' },
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
    { name: 'Variables and the Four Arrows', text: 'The four arrows at the top and bottom of a bodygraph, read as Determination and Environment below, Motivation and Perspective above. They are the system’s advanced layer, covering how a person is said to take in food and information, and where they function best. This build names them and does not compute them.' },
    { name: 'Color, Tone and Base', text: 'Gate and line are the first two layers of the system’s address for a position; color, tone and base are the three finer ones beneath them, and they are what the Variables are derived from. Ra Uru Hu’s full notation is gate.line.color.tone.base. This build reads to gate and line only.' },
    { name: 'Design and Personality Crystals', text: 'The system’s own cosmology: a Personality crystal said to carry who you think you are, a Design crystal said to carry the body and its genetics, and a magnetic monopole holding the two together and pulling them along one trajectory. This is the frame the red and black activations come from, and it is metaphysics rather than mechanics.' },
    { name: 'Transits', text: 'The moving activations of the day laid over a fixed bodygraph, temporarily defining gates and sometimes channels that are not natally defined. The tradition reads a transit as borrowed rather than yours: the useful question is whether a theme leaves when the day does.' }
  ];


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
    ['terms', 'Further terms'],
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
    CONNECTION_TRADITION: CONNECTION_TRADITION, CONNECTION_ASK: CONNECTION_ASK,
    layers: layers,
    centerOf: centerOf, gateName: gateName, channel: channel, channelKey: channelKey,
    channelsFor: channelsFor, profileFor: profileFor };
}));
