/* placement-content.js. Modular content engine for placement detail pages. V1.0.0

   WHY MODULAR: a placement is planet × sign × house × degree. Enumerated, that is
   21 × 12 × 12 × 30 = ~90,000 texts. Nobody writes those, and text generated to
   fill that grid reads like filler. So this file holds SIX layers of real written
   material and composes them per request:

     1 bodies   21 entries, plus 75 expanded chart points keyed by registry id.
                What the body is, its role, its gifts and shadows
     2 signs    12 entries. Definition, manner of operating, what it demands
     3 houses   12 entries. Arena, definition, what it asks of whoever lands there
     4 dignity  the traditional rulership/exaltation/detriment/fall table
     5 decans   per-sign decan rulers (Chaldean order) + decan character
     6 compose  planet-in-sign, planet-in-house, sign-in-house, synthesis, and the
                strengths / challenges / opportunities / obstacles lists

   Every string is tagged with the app's epistemic vocabulary:
     [TRADITIONAL] the tradition's own claim
     [CALCULATED]  arithmetic on the chart
     [POSSIBILITY] a maybe, never a statement about the person
     [SYNTHESIS]   this build combining layers. Flagged as ours, not the tradition's
   Composition is honest about itself: the synthesis tag exists precisely because
   the sentence was assembled here rather than quoted from anywhere.                */
(function () {
  'use strict';

  /* ---- LAYER 1: bodies ------------------------------------------------------
     energy   the noun phrase the body governs
     verb     how it acts on an arena
     gifts / shadows / growth / blocks  seed the Working With lists            */
  var BODIES = {
    'Sun': { glyph: '\u2609', kind: 'planet', energy: 'identity and conscious will',
      definition: 'The Sun is vitality, will, and the self that wants to be someone in particular. It is not personality but the thing personality is trying to express.',
      role: 'The Sun shows what you are here to become rather than what you already are, and where your energy renews itself.',
      verb: 'centres', gifts: ['hold a centre other people can locate', 'give warmth without being asked for it', 'know what you actually want when the room is undecided'],
      shadows: ['need the room to notice before something feels real', 'confuse being seen with being understood', 'burn through vitality proving a point'],
      growth: ['spend your warmth where it is received rather than where it is contested', 'let your identity be a practice rather than a verdict'],
      blocks: ['audiences that reward performance over substance', 'a self-image formed before you knew yourself'] },
    'Moon': { glyph: '\u263D', kind: 'planet', energy: 'feeling, memory, and what soothes',
      definition: 'The Moon is feeling, memory, and need. It is the private weather under the public day, and the first place the body reacts before thought arrives.',
      role: 'The Moon shows what actually comforts you, what you return to under pressure, and the emotional habits laid down early.',
      verb: 'softens', gifts: ['read a room before anyone speaks', 'remember what people needed last time', 'self-soothe without needing anyone to arrive'],
      shadows: ['mistake a familiar feeling for a true one', 'withdraw before asking', 'tend everyone\u2019s weather but your own'],
      growth: ['name a need out loud while it is still small', 'let comfort change shape as you do'],
      blocks: ['an old comfort that no longer comforts', 'moods treated as facts rather than reports'] },
    'Mercury': { glyph: '\u263F', kind: 'planet', energy: 'thought, language, and exchange',
      definition: 'Mercury is thinking, speech, and the traffic between minds. It governs how you take information in, sort it, and hand it back.',
      role: 'Mercury shows how you learn, what you notice first, and the shape your explanations take.',
      verb: 'articulates', gifts: ['find the sentence that makes a tangle legible', 'change your mind on new evidence', 'ask the question nobody framed'],
      shadows: ['talk past the point at which you knew', 'use precision as a way of not committing', 'mistake having words for having understanding'],
      growth: ['write down the thought you keep re-thinking', 'let silence carry part of the meaning'],
      blocks: ['a story about yourself repeated until it stopped being examined', 'rooms where speed is mistaken for intelligence'] },
    'Venus': { glyph: '\u2640', kind: 'planet', energy: 'affection, taste, and worth',
      definition: 'Venus is attraction, value, and pleasure. It governs what you find beautiful, how you draw close, and what you believe you are worth.',
      role: 'Venus shows how you love, what you consider fair, and the terms on which you accept being cared for.',
      verb: 'harmonises', gifts: ['make people feel welcome without effort', 'know what is worth keeping', 'bring beauty to something purely functional'],
      shadows: ['keep the peace past the point of honesty', 'confuse being wanted with being valued', 'spend on the appearance of a life rather than the life'],
      growth: ['say the unlovely true thing to someone who can hold it', 'let your taste be yours rather than defensible'],
      blocks: ['a standard of worth borrowed from someone who did not love you well', 'pleasure postponed as though it were owed later'] },
    'Mars': { glyph: '\u2642', kind: 'planet', energy: 'appetite, anger, and assertion',
      definition: 'Mars is action, appetite, and the will to assert. It is how you fight, how you pursue, and how you claim.',
      role: 'Mars shows where your initiative flows most naturally, how your anger behaves, and where conflict tends to find you.',
      verb: 'drives', gifts: ['start the thing while others are still deciding', 'stay in a difficult conversation', 'want something plainly enough to act on it'],
      shadows: ['spend force on the wrong target', 'read friction as proof of aliveness', 'let anger arrive as cold distance instead of speech'],
      growth: ['aim the heat rather than damping it', 'let a want be spoken before it becomes a demand'],
      blocks: ['a rule about anger set by someone else\u2019s temper', 'competition that is not actually a contest'] },
    'Jupiter': { glyph: '\u2643', kind: 'planet', energy: 'growth, belief, and meaning',
      definition: 'Jupiter is expansion, faith, and the search for meaning. It governs where you widen, what you trust, and how you make sense of scale.',
      role: 'Jupiter shows where you grow easily, where you overreach, and what you take on faith.',
      verb: 'expands', gifts: ['see the larger frame while others fight the detail', 'give generously without keeping the ledger', 'stay hopeful with your eyes open'],
      shadows: ['promise at the size of your optimism', 'mistake a good story for a true one', 'expand past what you can actually tend'],
      growth: ['let a belief be tested rather than defended', 'choose depth once breadth has been had'],
      blocks: ['a conviction inherited and never examined', 'more open doors than hours'] },
    'Saturn': { glyph: '\u2644', kind: 'planet', energy: 'structure, limit, and responsibility',
      definition: 'Saturn is limit, time, and consequence. It governs what must be built slowly and what will not be talked out of its price.',
      role: 'Saturn shows where you meet resistance, where mastery is available but only through repetition, and what you feel responsible for.',
      verb: 'disciplines', gifts: ['finish what stopped being interesting', 'hold a boundary without a speech', 'be the one who is actually reliable'],
      shadows: ['audit yourself in a voice you would not use on anyone else', 'call fear prudence', 'wait for qualification that never certifies itself'],
      growth: ['let sufficiency be a standard you can actually reach', 'build the small structure rather than plan the large one'],
      blocks: ['a standard set by someone who was never satisfied', 'a delay that has become a residence'] },
    'Uranus': { glyph: '\u2645', kind: 'planet', energy: 'individuation and the break in the pattern',
      definition: 'Uranus is the break in the pattern. Sudden insight, deviation, the refusal to inherit a life unexamined.',
      role: 'Uranus shows where you cannot be standardised, and where change arrives faster than preparation.',
      verb: 'pursues', gifts: ['see the arrangement everyone stopped questioning', 'tolerate being the odd one', 'change your life in a week when it is warranted'],
      shadows: ['break something because it is intact', 'call restlessness freedom', 'leave before being known'],
      growth: ['stay long enough for a change to take root', 'let difference be a contribution rather than a position'],
      blocks: ['belonging treated as a threat', 'a reflex against structure, including your own'] },
    'Neptune': { glyph: '\u2646', kind: 'planet', energy: 'longing and imagination',
      definition: 'Neptune dissolves the edges. Imagination, compassion, longing, and the pull toward something larger than the self.',
      role: 'Neptune shows where boundaries thin, where inspiration arrives unearned, and where you are most easily fooled.',
      verb: 'thins the edges of', gifts: ['feel what someone will not say', 'make something from almost nothing', 'forgive at scale'],
      shadows: ['soften a fact until it stops requiring action', 'merge until you cannot locate yourself', 'wait for rescue and call it faith'],
      growth: ['put the vision into a form that can be corrected', 'keep compassion and clear sight in the same hand'],
      blocks: ['a fog that arrives whenever a decision does', 'an ideal held close enough to obscure the actual' ] },
    'Pluto': { glyph: '\u2647', kind: 'planet', energy: 'power and compulsion',
      definition: 'Pluto is depth, power, and forced transformation. What will not stay buried, and what must end for something truer to live.',
      role: 'Pluto shows where you are compulsive, where your power is real, and where life keeps requiring a death and a rebuild.',
      verb: 'transforms', gifts: ['stay present to what others cannot look at', 'rebuild after a loss that should have ended it', 'sense the real power in a room'],
      shadows: ['hold control long past its usefulness', 'test a bond to see if it survives', 'go underground with what needed daylight'],
      growth: ['let a thing end while there is still choice in it', 'use intensity to hold something rather than to grip it'],
      blocks: ['a secret that has become the architecture', 'an old survival tactic still on duty'] },
    'Chiron': { glyph: '\u26B7', kind: 'body', energy: 'the tender place and the skill grown around it',
      definition: 'Chiron marks the injury that does not fully close, and the competence that grows around it. The wounded healer.',
      role: 'Chiron shows where you were hurt early, where you are unreasonably tender, and where that tenderness becomes usable skill for others.',
      verb: 'works through', gifts: ['recognise pain without flinching from it', 'teach what you had to learn the hard way', 'sit with someone who is not fixable yet'],
      shadows: ['help others where you will not be helped', 'treat the wound as an identity', 'over-qualify before offering what you already know'],
      growth: ['let someone tend the thing you tend in everyone else', 'offer the skill without re-opening the injury'],
      blocks: ['a hurt whose story is smoother than the truth', 'expertise used as armour'] },
    'Ceres': { glyph: '\u26B3', kind: 'body', energy: 'nurture, loss, and return',
      definition: 'Ceres is nourishment and its interruption. How you feed and are fed, and what grief does to the cycle.',
      role: 'Ceres shows your terms of care: what you give, what you cannot receive, and how you handle separation.',
      verb: 'nourishes through', gifts: ['make people materially safer', 'stay through a season of grief', 'know what someone actually needs'],
      shadows: ['make care the price of closeness', 'hold on where release is the care', 'feed others while running empty'],
      growth: ['receive without immediately repaying', 'let care survive distance'],
      blocks: ['an early loss still setting the terms', 'nurture confused with control'] },
    'Pallas': { glyph: '\u26B4', kind: 'body', energy: 'strategy and pattern-sight',
      definition: 'Pallas is applied intelligence. Pattern recognition, strategy, and the craft of fighting well rather than merely fighting.',
      role: 'Pallas shows how you solve, where your judgement is sharpest, and how you defend what matters.',
      verb: 'applies', gifts: ['see the pattern from few examples', 'find the move that costs least', 'argue a position without becoming it'],
      shadows: ['solve what needed only to be felt', 'win the exchange and lose the person', 'strategise instead of arriving'],
      growth: ['use the pattern in service of something you love', 'let a problem be somebody else\u2019s to solve'],
      blocks: ['cleverness standing in for courage', 'analysis extended until action expires'] },
    'Juno': { glyph: '\u26B5', kind: 'body', energy: 'commitment and its terms',
      definition: 'Juno is partnership as contract. What you require to commit, and what you will not tolerate once committed.',
      role: 'Juno shows the terms you bring to long bonds, and what betrayal means in your particular vocabulary.',
      verb: 'holds', gifts: ['name what you need in a bond', 'stay loyal without disappearing', 'hold a partner to something real'],
      shadows: ['enforce a contract nobody was shown', 'trade equality for security', 'keep score in the name of fairness'],
      growth: ['renegotiate rather than endure', 'let commitment be chosen again rather than assumed'],
      blocks: ['a marriage template absorbed before consent', 'a grievance filed but never raised'] },
    'Vesta': { glyph: '\u26B6', kind: 'body', energy: 'devotion and focus',
      definition: 'Vesta is the tended flame. Focus, dedication, and what you set aside in order to keep something sacred.',
      role: 'Vesta shows what you are devoted to, how you concentrate, and the cost you accept for that concentration.',
      verb: 'tends', gifts: ['go deep where others sample', 'keep a practice with no audience', 'protect the conditions your work needs'],
      shadows: ['make the sacrifice larger than the flame', 'call withdrawal purity', 'let devotion crowd out intimacy'],
      growth: ['let someone into the room where you work', 'check whether the sacrifice is still buying anything'],
      blocks: ['a vow made in a season that has passed', 'a standard of purity nobody asked for'] },
    'North Node': { glyph: '\u260A', kind: 'point', energy: 'the unfamiliar direction of growth',
      definition: 'The North Node is the direction of development. The terrain that feels awkward precisely because it has not been practised.',
      role: 'The North Node shows what to lean into, and it never feels like a talent at first.',
      verb: 'draws toward', gifts: ['keep going in the direction that is not yet fluent', 'take instruction late', 'grow in public'],
      shadows: ['wait for confidence before beginning', 'read awkwardness as wrongness'],
      growth: ['choose the version of the day that is slightly unpractised', 'let competence arrive after the attempt'],
      blocks: ['an old fluency that keeps paying just enough', 'progress measured against people further along'] },
    'South Node': { glyph: '\u260B', kind: 'point', energy: 'the practised, easy, worn direction',
      definition: 'The South Node is the well-worn groove. Real skill, easily reached, and easily hidden in.',
      role: 'The South Node shows where you already know how, and where retreat is most comfortable.',
      verb: 'falls back on', gifts: ['do this well with little preparation', 'stabilise a situation quickly', 'teach from long practice'],
      shadows: ['return here when growth is available elsewhere', 'call an old strength a whole identity'],
      growth: ['use the fluency as a base rather than a residence', 'give it away by teaching it'],
      blocks: ['comfort that looks exactly like competence', 'a reputation built on the easy thing'] },
    'Ascendant': { glyph: 'AC', kind: 'angle', energy: 'arrival and first impression',
      definition: 'The Ascendant is the horizon at your first breath. How you arrive, and the style through which everything else reaches the world.',
      role: 'The Ascendant shows the manner people meet first, and the lens through which you meet them.',
      verb: 'presents as', gifts: ['set a tone on entering', 'be legible quickly'],
      shadows: ['be taken for the manner rather than the person', 'perform the entrance long after arriving'],
      growth: ['let the first impression be an opening rather than a whole account'],
      blocks: ['a style that was armour first'] },
    'Descendant': { glyph: 'DC', kind: 'angle', energy: 'the qualities you find in other people',
      definition: 'The Descendant is the opposite horizon. The qualities you meet in others, often before recognising them as your own.',
      role: 'The Descendant shows what you seek and provoke in partnership.',
      verb: 'meets', gifts: ['draw complements toward you', 'learn fast through relationship'],
      shadows: ['outsource a quality rather than develop it', 'choose the same lesson in new company'],
      growth: ['take back one quality you keep hiring others to carry'],
      blocks: ['a type mistaken for a fate'] },
    'Midheaven': { glyph: 'MC', kind: 'angle', energy: 'vocation and public standing',
      definition: 'The Midheaven is the highest point of the chart. Vocation, visibility, and what you are known for.',
      role: 'The Midheaven shows the shape of your public work and the direction of ambition.',
      verb: 'aims at', gifts: ['be recognised for something specific', 'work toward a long horizon'],
      shadows: ['let the role eat the life', 'measure worth in visibility'],
      growth: ['choose the work for the work, and let standing follow'],
      blocks: ['someone else\u2019s definition of arrival'] },
    'IC': { glyph: 'IC', kind: 'angle', energy: 'roots and private ground',
      definition: 'The IC is the chart\u2019s floor. Origin, home, and the private ground standing requires.',
      role: 'The IC shows what you come from and what you need underfoot.',
      verb: 'rests on', gifts: ['build a private base that actually holds', 'know where you are from without romance'],
      shadows: ['keep the foundation unexamined', 'confuse the family\u2019s ground with your own'],
      growth: ['furnish the private life as carefully as the public one'],
      blocks: ['a house you left but never fully moved out of'] }
  };

  /* ---- LAYER 1b: the expanded chart's points --------------------------------
     Keyed by the registry id the expanded chart addresses them by, each with a
     label for the sentences. Same fields and the same grammar as BODIES above,
     because the same composer reads them: energy is a noun phrase, verb takes
     it as an object, gifts and shadows finish "you may find that you" and "a
     tendency to", growth finishes "invites you to", blocks finish "you may
     encounter".

     The definition carries the meaning AND where it came from (the myth, and
     when the body was found or the point defined), because a minor point read
     without its origin is a keyword with nothing under it. The role says what
     the placement is read for. Neither is a statement about the reader; the
     possibility lines the composer adds are where "you may" lives.

     Five points already have entries above under their plain names (Chiron,
     Ceres, Pallas, Juno, Vesta) and resolve to them through keyFor().
     The comets are mundane: their entries say so, because a comet in a birth
     chart records the sky of a year far more than anything about a person. */
  var EXPANDED = {
    /* asteroids */
    hygiea: { label: 'Hygiea', kind: 'asteroid', energy: 'health as daily upkeep',
      definition: 'Hygiea is prevention rather than cure. In Greek myth she is the daughter of Asclepius, the physician, and where he mends what has broken she keeps it from breaking. The asteroid, found in 1849, is the fourth largest body in the main belt.',
      role: 'Hygiea shows how you tend the body before it complains, what your habits of cleanliness and order are protecting, and where care of the self turns into control of it.',
      verb: 'maintains', gifts: ['notice the small signal before it becomes a symptom', 'build routines that quietly keep people well', 'make a space feel cared for'],
      shadows: ['treat the body as a project that is never finished', 'confuse purity with health', 'monitor rather than rest'],
      growth: ['let a habit serve how you feel rather than how you measure', 'rest before rest is prescribed'],
      blocks: ['a rule about the body inherited from someone frightened of it', 'wellness sold as a verdict on character'] },
    astraea: { label: 'Astraea', kind: 'asteroid', energy: 'justice held as an ideal',
      definition: 'Astraea is the star maiden, the last of the immortals to leave the earth when people stopped keeping faith, and in the old story she became the constellation Virgo. Her scales became Libra beside her. The asteroid was found in 1845, the first new one in almost forty years.',
      role: 'Astraea shows what you hold as fair before anyone has argued you into it, where you expect the world to keep its word, and what you do when it does not.',
      verb: 'weighs', gifts: ['see the unfairness nobody else in the room has named', 'keep faith with a principle after it stops paying', 'hold a standard gently enough that others can meet it'],
      shadows: ['withdraw from the world instead of mending it', 'judge a whole person by one broken promise', 'expect innocence from people and punish its absence'],
      growth: ['stay in the imperfect place long enough to improve it', 'let fairness include yourself'],
      blocks: ['disappointment that has hardened into distance', 'an ideal of justice with no room for repair'] },
    iris: { label: 'Iris', kind: 'asteroid', energy: 'the message that carries between',
      definition: 'Iris is the rainbow, the messenger who crosses between the gods and the world below, and between the realms of the living and the dead. The asteroid, found in 1847, is one of the brightest in the belt.',
      role: 'Iris shows how you carry word between people who are not speaking directly, and what colour you add to a message on the way.',
      verb: 'relays', gifts: ['translate one side to the other without losing either', 'bring news in a way that can be received', 'find the bridge after a storm'],
      shadows: ['colour the message with what you wish were true', 'become the go between in a quarrel that is not yours', 'carry everyone’s words but your own'],
      growth: ['deliver the message and then step out of it', 'say your own piece as plainly as you relay others'],
      blocks: ['rooms where you are only useful as a conduit', 'a family habit of speaking through somebody'] },
    flora: { label: 'Flora', kind: 'asteroid', energy: 'renewal, blossom and seasonal pleasure',
      definition: 'Flora is the Roman goddess of flowering, honoured in a spring festival of games and garlands. She presides over what blooms once, fully, and then gives way to fruit. The asteroid was found in 1847, and a whole family of asteroids now carries her name.',
      role: 'Flora shows where you come back into bloom, what season of the year or of a life renews you, and how you let beauty be brief.',
      verb: 'brings into flower', gifts: ['revive after a long winter', 'make something beautiful from what is to hand', 'enjoy a thing fully without needing it to last'],
      shadows: ['mistake the first bloom for the whole harvest', 'chase the next spring instead of tending this one', 'decorate what needed repair'],
      growth: ['let a flowering season end without calling it a failure', 'plant for a spring you will not be in charge of'],
      blocks: ['a belief that pleasure must be earned first', 'a garden kept for show rather than for use'] },
    metis: { label: 'Metis', kind: 'asteroid', energy: 'cunning intelligence and quiet counsel',
      definition: 'Metis is the Titaness of wise counsel. Zeus swallowed her to keep her wisdom inside him, and Athena was later born from his head, so her intelligence survived by working unseen. The Greek word metis means the practical cunning that finds a way. The asteroid was found in 1848.',
      role: 'Metis shows how you advise, where your intelligence works best out of sight, and what it costs when your thinking is credited to someone else.',
      verb: 'counsels through', gifts: ['find the practical way round an obstacle', 'give advice that changes the outcome without taking the stage', 'read what a situation actually allows'],
      shadows: ['let your thinking be swallowed by a louder voice', 'use cleverness to avoid saying what you want', 'stay behind the scenes past the point of choice'],
      growth: ['put your name to the idea that worked', 'counsel yourself with the care you give others'],
      blocks: ['a partnership that absorbs your intelligence', 'a habit of being useful instead of being heard'] },
    hebe: { label: 'Hebe', kind: 'asteroid', energy: 'youthful vigour offered in service',
      definition: 'Hebe is the goddess of youth who poured nectar for the gods, a daughter of Zeus and Hera who later married Heracles when he became immortal. Her service kept the gods young. The asteroid was found in 1847 and is thought to be a source of many meteorites that reach the Earth.',
      role: 'Hebe shows how you serve, what keeps you vital, and where the role of the one who pours becomes a role you cannot put down.',
      verb: 'refreshes', gifts: ['bring energy back into a tired room', 'serve without making it heavy', 'keep a sense of play into later life'],
      shadows: ['stay the helpful young one long after you have grown', 'pour for others and go without', 'measure your worth by how fresh you seem'],
      growth: ['let your service be chosen rather than expected', 'sit at the table instead of only serving it'],
      blocks: ['a family role assigned when you were small', 'a culture that rewards youth over ripeness'] },
    pandora: { label: 'Pandora', kind: 'asteroid', energy: 'curiosity and what it releases',
      definition: 'Pandora is the first woman in Hesiod, given a jar and told not to open it. When she did, every trouble flew into the world and hope alone stayed inside. The story is older than the moral later hung on it, and the jar only became a box in the sixteenth century. The asteroid was found in 1858.',
      role: 'Pandora shows what you cannot leave unopened, what your questions set loose, and what hope remains once they have.',
      verb: 'opens', gifts: ['ask the question that has to be asked', 'look directly at what has come out', 'keep hope when the rest has scattered'],
      shadows: ['open a thing to relieve the suspense rather than to know', 'blame the curiosity instead of the one who hid the contents', 'carry guilt for consequences you did not design'],
      growth: ['pause long enough to ask what you will do with the answer', 'tend the hope that stayed'],
      blocks: ['a secret kept by people who will not explain it', 'being made responsible for what others packed'] },
    psyche: { label: 'Psyche', kind: 'asteroid', energy: 'the soul tested into trust',
      definition: 'Psyche is the mortal loved by Eros on the condition that she never see his face. When she looked, he fled, and she won him back only through tasks set by Aphrodite that she could not have done alone. She ended immortal. The Greek word means both soul and butterfly. The asteroid, found in 1852, is made largely of metal and a spacecraft was launched toward it in 2023.',
      role: 'Psyche shows how you come to trust what you cannot see, the ordeals your inner life has to pass through, and how you are changed by them.',
      verb: 'refines', gifts: ['stay with a long ordeal and come out altered', 'love past the first loss of innocence', 'accept help from unlikely quarters'],
      shadows: ['break a trust to settle a doubt', 'believe love must be earned through suffering', 'treat every task as a test of worth'],
      growth: ['ask directly instead of looking in the dark', 'let the change the trials made be yours to keep'],
      blocks: ['a relationship built on a condition you were not allowed to question', 'jealousy from someone with power over the tasks'] },
    proserpina: { label: 'Proserpina', kind: 'asteroid', energy: 'descent, return and the cycle between',
      definition: 'Proserpina is the Roman Persephone, taken into the underworld by its king and returned for part of every year after her mother’s grief stopped the harvest. Having eaten there, she belonged to both worlds. The asteroid was found in 1853.',
      role: 'Proserpina shows what took you somewhere you did not choose, how you move between a bright world and a dark one, and what authority you gained below.',
      verb: 'returns with', gifts: ['live in two worlds without pretending there is only one', 'come back from a dark season carrying something useful', 'understand people who have been taken from their lives'],
      shadows: ['let the story of what was done to you become the whole account', 'keep a foot below out of habit', 'stay loyal to a mother’s grief instead of your own life'],
      growth: ['claim the authority the descent gave you', 'mark the season of return when it arrives'],
      blocks: ['a separation between parent and child that was never mended', 'a bargain made hungry that still sets the calendar'] },
    eros: { label: 'Eros', kind: 'asteroid', energy: 'desire and erotic aliveness',
      definition: 'Eros in the oldest Greek sources is not a child with arrows but a primal force present at creation, the pull that makes things join. The asteroid, found in 1898, was the first known to come close to the Earth, and in 2001 a spacecraft landed on it.',
      role: 'Eros shows what you want with your whole body, how passion arrives in you, and what makes you feel most alive.',
      verb: 'kindles', gifts: ['feel a pull and follow it honestly', 'bring intensity to what you love', 'make others feel wanted'],
      shadows: ['mistake intensity for intimacy', 'chase the charge and leave when it settles', 'use desire to avoid being known'],
      growth: ['let passion stay once it has become familiar', 'say what you want before it becomes a longing'],
      blocks: ['shame about wanting that was taught early', 'desire directed only at the unavailable'] },
    amor: { label: 'Amor', kind: 'asteroid', energy: 'love as generous goodwill',
      definition: 'Amor is the Latin name for love, and in astrology the asteroid is read for love that wishes the other well rather than wanting to possess them. The asteroid, found in 1932, gives its name to the Amor group, bodies that come near the Earth without crossing its path.',
      role: 'Amor shows the love you can give without needing it returned, and where that openness is wisdom and where it is avoidance of need.',
      verb: 'extends', gifts: ['love someone without needing to hold them', 'forgive in a way that frees both people', 'see the good in someone when they cannot'],
      shadows: ['give love to avoid asking for it', 'call your own neglect selflessness', 'stay close in orbit and never land'],
      growth: ['let yourself be loved in the same open way', 'offer care that includes a boundary'],
      blocks: ['a belief that needing is selfish', 'people who take goodwill as permission'] },
    cupido_astr: { label: 'Cupido', kind: 'asteroid', energy: 'romantic longing and the crush',
      definition: 'Cupido is the Roman Cupid, the young god whose arrow makes love strike without reason. In astrology the asteroid is read for infatuation and romantic idealising. It was found in 1913. It is a different point from the Hamburg School’s hypothetical Cupido, which shares the name.',
      role: 'Cupido shows how you fall for someone, what you project onto them in the first rush, and what remains when the arrow wears off.',
      verb: 'idealises', gifts: ['fall in love with delight', 'see the lovable in someone quickly', 'keep romance alive in a long bond'],
      shadows: ['love an image instead of the person', 'repeat the crush and skip the relationship', 'feel struck rather than choosing'],
      growth: ['stay curious about the real person after the picture fades', 'let a crush tell you what you long for'],
      blocks: ['a romantic story that no real person can live inside', 'people who enjoy being idealised and give nothing back'] },
    sappho: { label: 'Sappho', kind: 'asteroid', energy: 'passionate love put into words',
      definition: 'Sappho is the poet of Lesbos, writing around 600 BCE, whose lyrics to and about women are among the most admired in Greek, though most survive only in fragments. In astrology the asteroid is read for love expressed through art and for love outside convention. It was found in 1864.',
      role: 'Sappho shows how you make feeling into language or art, who you love when nobody is prescribing it, and what you write down so it survives.',
      verb: 'sings', gifts: ['turn longing into something others can feel', 'love freely across the lines drawn for you', 'find beauty in a fragment'],
      shadows: ['keep the love in the poem and out of the life', 'hide what you love behind craft', 'treat loss as material before it has been grieved'],
      growth: ['let what you love be spoken aloud as well as written', 'share the work while it is still a fragment'],
      blocks: ['a world that erases whole kinds of love', 'an audience that admires the art and ignores the person'] },
    bacchus: { label: 'Bacchus', kind: 'asteroid', energy: 'ecstasy, release and excess',
      definition: 'Bacchus is the Roman Dionysus, god of wine, theatre and the rites where people were loosened from their ordinary selves. His gift was release; its shadow was frenzy. The asteroid, found in 1977, crosses the Earth’s orbit.',
      role: 'Bacchus shows how you let go, what takes you out of yourself, and where release tips into losing the self you meant to come back to.',
      verb: 'loosens', gifts: ['help a gathering relax into joy', 'let go fully in celebration', 'find the sacred in pleasure'],
      shadows: ['need a substance or a spectacle to feel free', 'keep the party going past its purpose', 'mistake oblivion for release'],
      growth: ['find the release that leaves you more yourself', 'keep a ritual that has a beginning and an end'],
      blocks: ['a culture that offers excess as the only escape', 'company that measures closeness in indulgence'] },
    karma: { label: 'Karma', kind: 'asteroid', energy: 'action and its returning consequence',
      definition: 'Karma is the Sanskrit word for action, and in the traditions that use it every act carries a consequence that returns in time. The asteroid, found in 1953 by the Finnish astronomer Liisi Oterma, is read in astrology for where cause and effect feel most personal.',
      role: 'Karma shows where actions seem to come back to you, what patterns keep returning, and where responsibility can be taken rather than feared.',
      verb: 'sets in motion', gifts: ['see the link between what was done and what followed', 'act with the long run in mind', 'take responsibility without drowning in blame'],
      shadows: ['read every hardship as a debt being collected', 'excuse harm done to others as their karma', 'wait for payback instead of acting'],
      growth: ['change the pattern with one different action', 'let consequence be information rather than punishment'],
      blocks: ['a belief that suffering must be deserved', 'a cycle that nobody around you names'] },
    nemesis: { label: 'Nemesis', kind: 'asteroid', energy: 'retribution and the fall of pride',
      definition: 'Nemesis is the Greek goddess who brings down anyone who has risen too high, the correction the gods sent to overreaching pride. She is not revenge so much as balance restored. The asteroid was found in 1872.',
      role: 'Nemesis shows where pride tends to be corrected, who you cast as your adversary, and how you meet the balancing when it comes.',
      verb: 'rebalances', gifts: ['recognise when something has grown out of proportion', 'accept a fall and learn from it', 'hold people to account without cruelty'],
      shadows: ['nurse a grudge and call it justice', 'see an enemy where there is only a mirror', 'invite a fall by refusing any limit'],
      growth: ['ask what the adversary is showing you', 'correct your own excess before it is corrected for you'],
      blocks: ['a rivalry that has become part of your identity', 'success that no one around you will question'] },
    dejanira: { label: 'Dejanira', kind: 'asteroid', energy: 'trust deceived and harm unintended',
      definition: 'Dejanira is the wife of Heracles. A dying centaur who had tried to carry her off told her his blood would keep her husband faithful, and she believed him. The robe she soaked in it killed Heracles. The asteroid, found in 1875, is read in astrology for being deceived and for harm done without meaning it.',
      role: 'Dejanira shows where you have been misled by someone with reason to harm you, and where good intentions have carried a poison you could not see.',
      verb: 'lives through', gifts: ['recognise a manipulation once you have lived through one', 'take responsibility without taking all of it', 'warn others away from a false promise'],
      shadows: ['accept the account of someone who has harmed you', 'act in desperation to keep a love secure', 'carry the whole blame for a deception that was done to you'],
      growth: ['check a promise against who is making it', 'place responsibility where it belongs'],
      blocks: ['a person who offers help while intending harm', 'fear of losing someone that overrides judgement'] },
    atlantis: { label: 'Atlantis', kind: 'asteroid', energy: 'great achievement and the pride that sinks it',
      definition: 'Atlantis is the island Plato describes in two dialogues, a powerful and advanced civilisation that grew arrogant and sank into the sea in a single day. Plato meant it as a lesson rather than a history. The asteroid was found in 1931.',
      role: 'Atlantis shows what you are building that could grow too sure of itself, and what you carry forward from a collapse.',
      verb: 'raises', gifts: ['imagine a society or a project at full height', 'learn from a collapse without romanticising it', 'warn about hubris before the waters rise'],
      shadows: ['believe success protects you from consequence', 'mourn a lost golden age that never quite existed', 'rely on a system nobody understands anymore'],
      growth: ['build with the humility that lets a thing last', 'let the lost world teach rather than haunt'],
      blocks: ['an institution too proud to change', 'nostalgia that keeps you from building again'] },
    pythia: { label: 'Pythia', kind: 'asteroid', energy: 'oracular knowing',
      definition: 'Pythia is the title of the priestess at Delphi who spoke the oracle of Apollo for over a thousand years. Her answers were famously exact and famously hard to read. The asteroid was found in 1897.',
      role: 'Pythia shows how intuition speaks through you, what you know before you can explain it, and how others receive what you say.',
      verb: 'divines', gifts: ['sense where a situation is heading', 'say the true thing that takes time to understand', 'hold a question open until it answers itself'],
      shadows: ['speak in riddles to avoid being wrong', 'confuse fear with foresight', 'let others treat you as an oracle instead of a person'],
      growth: ['test a hunch against what happens and keep a record', 'say it plainly and let it be questioned'],
      blocks: ['people who want certainty from you', 'a tradition that trusts the voice and silences the woman'] },
    fortuna: { label: 'Fortuna', kind: 'asteroid', energy: 'luck and the turning wheel',
      definition: 'Fortuna is the Roman goddess of chance, often shown blindfolded with a wheel that raises and lowers people without regard to merit. The Romans worshipped her as a power to be courted rather than controlled. The asteroid was found in 1852.',
      role: 'Fortuna shows how you meet luck, good and bad, and what you make of a turn of the wheel you did not cause.',
      verb: 'turns', gifts: ['take a chance when one arrives', 'stay steady when the wheel turns down', 'notice good fortune while it is here'],
      shadows: ['wait for luck instead of acting', 'take credit for fortune and blame others for misfortune', 'gamble what you cannot afford to lose'],
      growth: ['prepare so that chance has something to land on', 'share good fortune while it is turning your way'],
      blocks: ['a belief that you are simply unlucky', 'a situation where outcomes are genuinely random'] },
    tyche: { label: 'Tyche', kind: 'asteroid', energy: 'fortune and the prosperity of a place',
      definition: 'Tyche is the Greek goddess of fortune, and Greek cities each had their own Tyche, crowned with city walls, who guarded their prosperity. She is luck as it belongs to a community rather than a gambler. The asteroid was found in 1886.',
      role: 'Tyche shows where good fortune comes through belonging, the places and groups that prosper with you, and how you carry the luck of where you are from.',
      verb: 'prospers', gifts: ['help a place or group do well', 'find the fortunate setting for your work', 'spot the opportunity inside a local change'],
      shadows: ['depend on a place for luck that is yours to make', 'leave when fortune dips instead of weathering it', 'confuse privilege with merit'],
      growth: ['invest your good fortune back where you live', 'make a new place lucky by staying'],
      blocks: ['a hometown whose fortunes are falling', 'a group that shares prosperity only with insiders'] },
    apollo: { label: 'Apollo', kind: 'asteroid', energy: 'clarity, prophecy and healing light',
      definition: 'Apollo is the Greek god of light, music, prophecy and healing, the patron of Delphi and of reason and proportion. The asteroid, found in 1932, gives its name to the Apollo group, the bodies whose orbits cross the Earth’s.',
      role: 'Apollo shows where you seek clarity and excellence, how you heal through understanding, and what your brightness leaves in shadow.',
      verb: 'illuminates', gifts: ['bring order and clarity to a muddle', 'excel at a craft through discipline', 'heal by helping someone understand'],
      shadows: ['prefer the clear idea over the messy truth', 'shine so brightly others cannot', 'dismiss what reason cannot measure'],
      growth: ['let feeling have a place beside clarity', 'teach the craft rather than performing it'],
      blocks: ['a standard of excellence that permits no beginners', 'rooms that reward the brilliant and ignore the kind'] },
    diana: { label: 'Diana', kind: 'asteroid', energy: 'independence and the wild self',
      definition: 'Diana is the Roman Artemis, goddess of the hunt, the moon and the wild places, who kept her own company and protected girls and animals. The asteroid was found in 1863.',
      role: 'Diana shows where you need to be self sufficient, what wildness you protect in yourself, and how you keep company with other women and with nature.',
      verb: 'guards', gifts: ['rely on yourself in rough country', 'protect those who are vulnerable', 'keep a part of life untamed'],
      shadows: ['refuse closeness to keep independence', 'punish anyone who intrudes', 'mistake self sufficiency for strength in every case'],
      growth: ['let independence include chosen company', 'spend time where nothing is managed'],
      blocks: ['a life with no wild place in it', 'people who read independence as rejection'] },
    arachne: { label: 'Arachne', kind: 'asteroid', energy: 'craft mastery and its pride',
      definition: 'Arachne is the weaver who claimed her skill was greater than Athena’s. In Ovid her tapestry was flawless and showed the gods’ abuses, and Athena turned her into a spider who weaves forever. The asteroid was found in 1895.',
      role: 'Arachne shows the craft you are best at, how you use it to say what others will not, and how you meet the powerful who resent it.',
      verb: 'weaves', gifts: ['master a craft through patient repetition', 'make work that tells an uncomfortable truth', 'connect separate threads into one pattern'],
      shadows: ['stake your worth on beating the best', 'let pride invite punishment', 'get caught in your own web of detail'],
      growth: ['let your work speak without the challenge', 'keep weaving after a setback'],
      blocks: ['authorities who punish skill that exposes them', 'a rivalry that turns craft into combat'] },
    /* centaurs: bodies orbiting between Jupiter and Neptune, named for the
       centaurs of Greek myth because they are half asteroid and half comet */
    nessus: { label: 'Nessus', kind: 'centaur', energy: 'harm passed on and the point where it stops',
      definition: 'Nessus is the centaur who tried to carry off Dejanira at a river crossing and was shot by Heracles. Dying, he gave her his poisoned blood as a love charm, and years later it killed Heracles. The harm outlived the one who did it. The centaur, found in 1993, is read in astrology for patterns of abuse and misuse of power that carry forward until someone ends them.',
      role: 'Nessus shows where harm or entitlement has been handed down, where you have been on the receiving end of it, and where the line can be drawn so it goes no further.',
      verb: 'confronts', gifts: ['recognise a pattern of harm that others excuse', 'draw a line that protects the next person', 'hold someone to account for what they did'],
      shadows: ['repeat a dynamic you swore you would not', 'excuse harm because it was done to you first', 'carry a poison offered as a gift'],
      growth: ['name the pattern out loud to someone safe', 'be the place in the line where it stops'],
      blocks: ['a family or group that protects the one causing harm', 'a gift that comes with a hidden cost'] },
    pholus: { label: 'Pholus', kind: 'centaur', energy: 'the small act that sets off a chain reaction',
      definition: 'Pholus is the gentle centaur who welcomed Heracles and opened a jar of wine that belonged to all the centaurs. The smell drew the others, a battle followed, and Pholus died when he dropped a poisoned arrow on his own foot while wondering at it. The centaur, found in 1992, is read for small causes with outsized effects.',
      role: 'Pholus shows where a small opening releases far more than was expected, what has been bottled up across generations, and how you handle the cascade.',
      verb: 'uncorks', gifts: ['recognise the tipping point before it tips', 'release something long held in a way that clears the air', 'stay calm while a situation escalates'],
      shadows: ['open the jar and leave before the consequences arrive', 'handle a dangerous thing out of curiosity', 'treat a family burden as a party trick'],
      growth: ['ask what else comes out when this is opened', 'choose the moment to release what was stored'],
      blocks: ['something sealed so long that no one remembers what is inside', 'a crowd that turns a small spill into a fight'] },
    chariklo: { label: 'Chariklo', kind: 'centaur', energy: 'protective grace and held space',
      definition: 'Chariklo is the nymph wife of Chiron, who raised heroes alongside him and is remembered for her grace and her care of those in their keeping. The centaur, found in 1997, is the largest known, and in 2013 it became the first small body found to have rings.',
      role: 'Chariklo shows how you hold space for others, the boundaries that make a place safe, and the quiet partner work that goes unnamed.',
      verb: 'encircles', gifts: ['make a place where people can heal', 'hold a boundary with kindness', 'support someone’s gift without competing with it'],
      shadows: ['disappear into the role of the supportive partner', 'protect others and leave yourself outside the ring', 'keep grace at the cost of saying no'],
      growth: ['let the care you give be seen and named', 'put yourself inside the protected circle'],
      blocks: ['a partnership where one gift gets all the credit', 'people who take a safe space and give nothing back'] },
    asbolus: { label: 'Asbolus', kind: 'centaur', energy: 'foresight read from signs',
      definition: 'Asbolus is the centaur seer who read the flight of birds and warned the others not to fight Heracles. They did not listen, and he survived the battle. The centaur, found in 1995, is read for intuition and the reading of omens.',
      role: 'Asbolus shows how you read what is coming from small signs, and what happens when you warn and are not heeded.',
      verb: 'reads', gifts: ['pick up the warning sign early', 'find your way through a dark and chaotic time', 'trust a pattern that others dismiss'],
      shadows: ['see danger everywhere and act on none of it', 'withdraw once your warning is ignored', 'confuse anxiety with foresight'],
      growth: ['warn clearly once and then protect yourself', 'check what you read against what happens'],
      blocks: ['groups who treat a warning as disloyalty', 'a gift for seeing that nobody asks for'] },
    hylonome: { label: 'Hylonome', kind: 'centaur', energy: 'grief and the bond that shapes identity',
      definition: 'Hylonome is the centaur Ovid describes as the most beautiful of the female centaurs, devoted to Cyllarus. When he was killed at the wedding battle of the Lapiths, her grief was complete. The centaur, found in 1995, is read in astrology for grief, deep bonds and the question of who you are after a loss.',
      role: 'Hylonome shows how you grieve, where a bond has become part of who you are, and how identity rebuilds after an ending. If grief feels too heavy to carry, reaching someone now matters more than any reading.',
      verb: 'honours', gifts: ['love with your whole self', 'sit with someone else’s grief without hurrying it', 'honour a loss by carrying what the person gave you'],
      shadows: ['let a bond become the only thing that holds you up', 'believe you cannot go on after a loss', 'grieve alone when others would come'],
      growth: ['let people in while you are grieving', 'find a self that includes the love and continues'],
      blocks: ['a loss that no one around you acknowledges', 'an identity built entirely on one relationship'] },
    elatus: { label: 'Elatus', kind: 'centaur', energy: 'recovery from an unexpected wound',
      definition: 'Elatus is the centaur struck by one of Heracles’ arrows, which passed through him and lodged in Chiron’s knee, the wound that could not heal. The centaur, found in 1999, is read for injuries taken in passing and for endurance and recovery afterwards.',
      role: 'Elatus shows where harm reaches you from a conflict that was not yours, and how you survive and recover from it.',
      verb: 'endures', gifts: ['recover from a blow you did not see coming', 'keep going after an injury', 'understand people hurt as bystanders'],
      shadows: ['stay in the path of other people’s battles', 'minimise a wound because it was not aimed at you', 'pass a hurt on without noticing'],
      growth: ['step out of the line of fire', 'take your injury as seriously as the one who was the target'],
      blocks: ['conflicts between powerful people nearby', 'a story that you were only collateral'] },
    okyrhoe: { label: 'Okyrhoe', kind: 'centaur', energy: 'truth spoken at a cost',
      definition: 'Okyrhoe is Chiron’s daughter, a prophetess who in Ovid revealed the fates of Asclepius and of her father, and was turned into a mare by the gods to stop her speaking. The centaur, found in 1998, is read for telling truths others do not want heard.',
      role: 'Okyrhoe shows what you know that is unwelcome, how you speak it, and what you risk when you do.',
      verb: 'speaks', gifts: ['say what everyone suspects and no one will say', 'see where a situation is heading', 'keep speaking truth after it has cost you'],
      shadows: ['blurt a truth nobody is ready to hear', 'go silent after being punished once', 'confuse being unheard with being wrong'],
      growth: ['choose who is ready to hear it and when', 'find the people who welcome what you see'],
      blocks: ['families or institutions that punish the messenger', 'a history of being silenced'] },
    thereus: { label: 'Thereus', kind: 'centaur', energy: 'raw predatory force',
      definition: 'Thereus is a centaur in Ovid’s account of the Lapith wedding battle, a hunter who carried bears home alive from the mountains. The centaur, found in 2001, is read for aggression, survival instinct and the capacity to overpower.',
      role: 'Thereus shows where your strength is raw and physical, how it is aimed, and where it needs a purpose to keep it from harm.',
      verb: 'overpowers with', gifts: ['meet a real threat with enough force', 'survive rough conditions', 'protect what matters physically'],
      shadows: ['use force where it was not needed', 'treat other people as prey', 'take pride in dominance'],
      growth: ['aim strength at protecting rather than taking', 'learn the gentleness that strength makes safe'],
      blocks: ['environments that reward aggression', 'a history where only strength was respected'] },
    cyllarus: { label: 'Cyllarus', kind: 'centaur', energy: 'devoted love and its cost',
      definition: 'Cyllarus is the young centaur Ovid calls the most beautiful of them, beloved of Hylonome, who was killed in the battle at the Lapith wedding while she stood beside him. The centaur, found in 1998, is read for devoted love and the loss it risks.',
      role: 'Cyllarus shows how you love with devotion, what that makes you willing to give, and how loss teaches the worth of what was held.',
      verb: 'devotes', gifts: ['love someone steadily and openly', 'give for another without resentment', 'carry the memory of someone well'],
      shadows: ['go into a fight you could have avoided', 'sacrifice yourself when it helps no one', 'make love depend on losing something'],
      growth: ['protect the bond by protecting yourself', 'let devotion include staying alive to it'],
      blocks: ['a conflict that draws in everyone nearby', 'a romantic ideal that equates love with sacrifice'] },
    amycus: { label: 'Amycus', kind: 'centaur', energy: 'combative impulse',
      definition: 'Amycus is a centaur in Ovid’s wedding battle who seized a heavy lampstand from a shrine and used it as a weapon, turning a sacred object to violence. The centaur, found in 2002, is read for picking fights and for aggression that finds whatever is to hand.',
      role: 'Amycus shows where you are quick to fight, what objects or words you pick up as weapons, and what you are really defending.',
      verb: 'provokes', gifts: ['stand up in a fight that needs one', 'act fast when threatened', 'refuse to be pushed around'],
      shadows: ['start a fight to discharge tension', 'use something precious as a weapon', 'mistake provocation for strength'],
      growth: ['find what the anger is protecting', 'put down what you picked up before using it'],
      blocks: ['gatherings where a quarrel is always close', 'a habit of meeting fear with attack'] },
    pelion: { label: 'Pelion', kind: 'centaur', energy: 'the proving ground and initiation',
      definition: 'Pelion is the mountain in Thessaly where Chiron kept his cave and trained heroes such as Achilles and Jason. It was the centaurs’ home and a wild place of learning. The centaur, found in 1998, is read for initiation and the places that test us.',
      role: 'Pelion shows where you are trained by difficulty, the teachers and wild places that shape you, and what passage you are being prepared for.',
      verb: 'trains', gifts: ['learn fast in rough conditions', 'find a mentor who changes your course', 'return from a trial ready for more'],
      shadows: ['treat every hardship as a necessary initiation', 'stay in training and never set out', 'romanticise the wilderness while avoiding people'],
      growth: ['recognise when the training is complete', 'become the mountain for someone else'],
      blocks: ['a lack of teachers or places that test you', 'a trial that is only damage dressed as growth'] },
    crantor: { label: 'Crantor', kind: 'centaur', energy: 'loyalty and a trusted companion lost',
      definition: 'Crantor is the armour bearer of Peleus in Ovid’s wedding battle, killed by a centaur who threw a tree, and avenged by his grieving friend. The centaur, found in 2002, shares the orbit of Uranus. In astrology it is read for trust within the close circle, and the pain when that circle breaks.',
      role: 'Crantor shows the loyalties you rely on, how you protect a companion, and how you respond when trust inside the circle breaks.',
      verb: 'stands by', gifts: ['be a loyal second to someone you believe in', 'defend a friend', 'honour a companion after losing them'],
      shadows: ['stay loyal to someone who has broken faith', 'turn a betrayal into distrust of everyone', 'live in someone else’s service'],
      growth: ['give loyalty to those who return it', 'let a betrayal be about that person, not all people'],
      blocks: ['an inner circle with a hidden rivalry', 'a friendship that asks for everything and gives protection only one way'] },
    echeclus: { label: 'Echeclus', kind: 'centaur', energy: 'sudden eruption of what was held in',
      definition: 'Echeclus is a centaur in Ovid’s battle at the Lapith wedding. The body named for it, found in 2000, surprised astronomers in 2005 by suddenly erupting into a large cloud of gas and dust, and it now carries a comet designation too. That outburst is why astrologers read it for secrets and pressures that break out.',
      role: 'Echeclus shows what you hold under pressure, how it breaks into the open, and what is revealed when silence finally fails.',
      verb: 'erupts with', gifts: ['release what has been kept silent', 'reveal a truth that changes the situation', 'recover after an outburst and clear the air'],
      shadows: ['hold things in until they explode', 'reveal too much all at once', 'use an outburst to force a change others were not ready for'],
      growth: ['release pressure in smaller, deliberate ways', 'choose what to reveal and to whom'],
      blocks: ['a place where nothing can be said until everything is', 'secrets held by several people at once'] },
    damocles: { label: 'Damocles', kind: 'centaur', energy: 'fortune under a hanging threat',
      definition: 'Damocles is the courtier who envied the tyrant Dionysius of Syracuse, and was seated at his banquet beneath a sword hung by a single horsehair to show what power costs. The body, found in 1991, travels on an extremely elongated orbit and gives its name to a whole class, the damocloids.',
      role: 'Damocles shows what threat hangs over your good fortune, the anxiety that comes with privilege or responsibility, and how you live well anyway.',
      verb: 'feels the weight of', gifts: ['see the real cost of power before taking it', 'stay alert to risk', 'enjoy what you have while knowing it can change'],
      shadows: ['sit under a threat rather than move away from it', 'envy what you would not actually want', 'spoil every good thing by waiting for the fall'],
      growth: ['ask whether the sword is real or only feared', 'choose responsibilities whose weight you are willing to carry'],
      blocks: ['a role where one mistake costs everything', 'a leader who teaches through fear'] },
    /* trans-Neptunian objects and dwarf planets: slow, so a placement is
       shared by everyone born within years, and read by house more than sign */
    eris: { label: 'Eris', kind: 'tno', energy: 'discord that exposes what was hidden',
      definition: 'Eris is the Greek goddess of strife. Left off the guest list for a wedding of the gods, she threw in a golden apple marked for the fairest, and the quarrel it started led to the Trojan War. The dwarf planet, found in 2005, is almost exactly Pluto’s size, and its discovery is what led astronomers to redefine what a planet is.',
      role: 'Eris shows where you refuse to be left out, how conflict you provoke exposes a truth, and where you speak for those pushed to the margins.',
      verb: 'disrupts', gifts: ['name the exclusion everyone else pretends not to see', 'shake a comfortable arrangement into honesty', 'stand with the people left outside'],
      shadows: ['stir conflict for its own sake', 'turn rejection into revenge', 'feel at home only when there is a fight'],
      growth: ['aim disruption at what actually needs to change', 'build a table where you are invited'],
      blocks: ['circles that keep their peace by leaving someone out', 'a reputation as the troublemaker'] },
    sedna: { label: 'Sedna', kind: 'tno', energy: 'the deepest loss and survival through it',
      definition: 'Sedna is the Inuit goddess of the sea. In the best known telling she was thrown from her father’s boat and her fingers were cut as she clung to it; they became the seals and whales, and she lives on the ocean floor as their keeper. The body, found in 2003, takes about eleven thousand years to go round the Sun and never comes near the planets.',
      role: 'Sedna shows the betrayals and losses that go to the bottom, how you survive what should not be survivable, and the depth of care that can come from it.',
      verb: 'carries', gifts: ['survive what others would not', 'offer care to others who were abandoned', 'find strength at great depth'],
      shadows: ['keep a wound so deep no one can reach it', 'isolate to avoid ever being betrayed again', 'let a victim story set every term'],
      growth: ['let someone tend the hands that were hurt', 'recognise what the depth has given you'],
      blocks: ['a betrayal by someone who should have protected you', 'isolation that protects and imprisons at once'] },
    quaoar: { label: 'Quaoar', kind: 'tno', energy: 'creation through rhythm and song',
      definition: 'Quaoar is the creation force of the Tongva people of the Los Angeles basin, who in their account sang and danced the world and the other gods into being. The body, found in 2002 and named with the Tongva’s blessing, is one of the largest in the Kuiper belt and has a ring farther out than rings should be able to hold.',
      role: 'Quaoar shows how you create order out of chaos, the rhythm in your making, and what you bring into being with others.',
      verb: 'sings into being', gifts: ['make a new thing where there was only mess', 'bring people together in a shared rhythm', 'find the structure inside improvisation'],
      shadows: ['wait for the right song before beginning', 'impose order before the chaos has taught you anything', 'create alone what needed a chorus'],
      growth: ['start with the first line and let the rest follow', 'make room for others to join the dance'],
      blocks: ['a culture that treats creativity as a luxury', 'rigid rules that leave no room to improvise'] },
    varuna: { label: 'Varuna', kind: 'tno', energy: 'cosmic order and the keeping of vows',
      definition: 'Varuna is the Vedic god of the sky and the waters who keeps rta, the order that holds the universe together, and who watches over oaths and punishes those who break them. The body was found in 2000.',
      role: 'Varuna shows your sense of a larger order, the vows you are bound by, and how you meet the consequences of keeping or breaking them.',
      verb: 'upholds', gifts: ['see the larger pattern that holds things in place', 'keep your word over a long time', 'act with integrity when no one is watching'],
      shadows: ['judge others by a law only you can see', 'hold yourself to a vow that no longer fits', 'fear consequences more than you value the good'],
      growth: ['make vows you understand and can keep', 'let order include mercy'],
      blocks: ['institutions whose rules have lost their purpose', 'promises made on your behalf'] },
    orcus: { label: 'Orcus', kind: 'tno', energy: 'oaths and what binds beyond ending',
      definition: 'Orcus is the Roman and Etruscan god of the underworld who punished those who broke their oaths. The body, found in 2004, moves in step with Neptune just as Pluto does, but always on the opposite side of its orbit, which is why astronomers call it the anti Pluto.',
      role: 'Orcus shows the commitments that bind you most deeply, the consequences of breaking faith, and what must be honoured even after a thing has ended.',
      verb: 'binds', gifts: ['keep your word to the end', 'honour an obligation after it is inconvenient', 'see through a promise made in bad faith'],
      shadows: ['stay bound to an oath that harms you', 'punish a broken promise without mercy', 'make commitments to avoid being free'],
      growth: ['release a vow honestly rather than breaking it quietly', 'choose which bonds deserve your faith'],
      blocks: ['contracts that last longer than the reason for them', 'a family loyalty that cannot be questioned'] },
    ixion: { label: 'Ixion', kind: 'tno', energy: 'broken trust and the second chance',
      definition: 'Ixion is the Thessalian king who murdered his father in law and was pardoned by Zeus and invited to Olympus, where he then tried to seduce Hera. He was bound to a burning wheel that turns forever. The body, found in 2001, is read for the abuse of a second chance and the cycles that follow.',
      role: 'Ixion shows where you are offered forgiveness, what you do with it, and where a pattern of betraying trust turns like a wheel.',
      verb: 'repeats', gifts: ['recognise a pattern of betrayal and step out of it', 'value a second chance when it is given', 'understand someone trapped in their own cycle'],
      shadows: ['waste a second chance on the same mistake', 'feel entitled to what you were given in trust', 'keep turning on the wheel and calling it fate'],
      growth: ['honour forgiveness by changing', 'grant trust again only when behaviour has changed'],
      blocks: ['people who forgive without limits', 'a cycle that feels too familiar to leave'] },
    haumea: { label: 'Haumea', kind: 'tno', energy: 'fertility and self renewal',
      definition: 'Haumea is the Hawaiian goddess of childbirth and fertility, who in legend gave birth to many children from different parts of her body and renewed herself to stay young. The dwarf planet, found in 2004, spins so fast it is stretched into an egg shape, has two moons named for her daughters, and has a family of fragments broken off by an ancient collision.',
      role: 'Haumea shows how you renew yourself, what you give birth to in life and work, and how you recover after being broken apart.',
      verb: 'gives birth to', gifts: ['begin again from what remains', 'nurture many projects or people at once', 'find a new form after a shattering'],
      shadows: ['keep producing to avoid being still', 'lose track of yourself in all you create', 'refuse to age or change'],
      growth: ['let a new beginning take its own time', 'honour the pieces that broke off'],
      blocks: ['a culture that values women only for fertility', 'demands to keep creating without rest'] },
    makemake: { label: 'Makemake', kind: 'tno', energy: 'creation, ritual and ecological abundance',
      definition: 'Makemake is the creator god of Rapa Nui, Easter Island, and the god of fertility at the centre of the Birdman ritual in which men raced to bring back the first egg of the season. The dwarf planet was found just after Easter in 2005, which is how it came by the name.',
      role: 'Makemake shows how you relate to the natural world, what rituals renew you, and how resources are used or overused around you.',
      verb: 'renews through', gifts: ['work with the natural cycles rather than against them', 'create meaningful ritual', 'find abundance in what already exists'],
      shadows: ['compete for scarce resources until they are gone', 'hold on to a ritual that has lost its meaning', 'exploit what should be tended'],
      growth: ['use resources in a way that leaves enough', 'make a ritual that fits the present'],
      blocks: ['a community exhausting its own ground', 'competitions that reward taking the most'] },
    arrokoth: { label: 'Arrokoth', kind: 'tno', energy: 'gentle joining into one whole',
      definition: 'Arrokoth means sky in the Powhatan language, the Algonquian tongue of the people whose land includes the Chesapeake Bay where the spacecraft that visited it was built. Found in 2014 and passed by New Horizons in 2019, it is two lobes that came together so gently they merged without breaking. It is the most distant object a spacecraft has ever visited.',
      role: 'Arrokoth shows how you join with others without losing yourself, and how two separate things become one whole slowly and gently.',
      verb: 'merges', gifts: ['bring two different things together softly', 'form a bond without force', 'hold two sides within one whole'],
      shadows: ['merge so fully you forget you were separate', 'avoid conflict to keep a union intact', 'stay in a slow orbit and never meet'],
      growth: ['let joining take the time it needs', 'keep your shape inside the union'],
      blocks: ['pressure to combine quickly', 'a history of collisions that broke things'] },
    albion: { label: 'Albion', kind: 'tno', energy: 'the threshold of a new territory',
      definition: 'Albion is William Blake’s primeval man, the first being whose fall and awakening Blake made into myth, and an old name for Britain. The body was found in 1992, the first object discovered in the Kuiper belt after Pluto and Charon, and so opened a whole new region of the solar system. It was named in 2018.',
      role: 'Albion shows where you are the first to cross into new ground, what you open for others to follow, and the fall and waking that come with it.',
      verb: 'pioneers', gifts: ['go first where there is no map', 'open a field for those who follow', 'see the edge of what is known'],
      shadows: ['need to be first to feel worthwhile', 'forget the ones who made the crossing possible', 'stay on the threshold and never settle'],
      growth: ['make a map for the next traveller', 'let the new ground become home'],
      blocks: ['a field with no one ready to follow', 'recognition that arrives decades late'] },
    /* comets: mundane astrology, read for eras and nations. A birth chart
       records where one was, which is a fact about the year. */
    halley: { label: 'Halley’s Comet', kind: 'comet', energy: 'the close of an era',
      definition: 'Halley’s Comet returns about every 76 years and has been recorded for more than two thousand years, including in 1066, when it was stitched into the Bayeux Tapestry before the Norman conquest. Edmond Halley was the first to show it was one comet returning. In mundane astrology it has long been read as an omen of changes in rule. It is not traditionally read as a personal placement, and this page reads it for the era you were born into.',
      role: 'Halley’s Comet in a birth chart places you in its long cycle: where it stood in the sky of your birth year, and the part of life where the changes of your generation may be felt most.',
      verb: 'marks', gifts: ['sense when an old order is ending', 'take the long view across generations', 'see your life inside a larger history'],
      shadows: ['treat a public omen as a private verdict', 'wait for a sign before acting', 'read every change as a catastrophe'],
      growth: ['connect your story to the history around it', 'act within your own lifetime rather than waiting for a return'],
      blocks: ['upheavals in public life that reshape private plans', 'a generation told its moment has passed'] },
    halebopp: { label: 'Hale-Bopp', kind: 'comet', energy: 'a collective mood made visible',
      definition: 'Hale-Bopp was one of the brightest comets of the last century, visible to the naked eye for a record eighteen months around its closest approach in 1997, as millennial anxiety was building. It will not return for more than two thousand years. In mundane astrology it is read for mass movements and shifts in the shared mood. It is not traditionally read as a personal placement.',
      role: 'Hale-Bopp in a birth chart records where the comet stood in the sky of your birth year, and the part of life where collective feeling may reach you most directly.',
      verb: 'reflects', gifts: ['read the mood of a crowd', 'give words to what many people are feeling', 'stay grounded when a group gets carried away'],
      shadows: ['be swept up in a collective fever', 'mistake a shared fear for a personal truth', 'follow a movement past the point of judgement'],
      growth: ['check a collective story against your own experience', 'help others stay steady when the mood runs high'],
      blocks: ['groups that feed on fear of the future', 'a climate of alarm around you'] },
    hyakutake: { label: 'Hyakutake', kind: 'comet', energy: 'sudden revelation from nowhere',
      definition: 'Hyakutake was found by an amateur astronomer in Japan in January 1996 and within weeks passed closer to the Earth than any comet in two centuries, trailing one of the longest tails ever measured. It appeared almost without warning. In mundane astrology it is read for sudden awareness and events nobody saw coming. It is not traditionally read as a personal placement.',
      role: 'Hyakutake in a birth chart records where the comet stood in the sky of your birth year, and the part of life where insight tends to arrive suddenly.',
      verb: 'reveals', gifts: ['notice what has just appeared', 'respond quickly to the unexpected', 'find something extraordinary through amateur curiosity'],
      shadows: ['chase the next revelation instead of living with the last', 'dismiss what arrived without credentials', 'be dazzled and forget to look again'],
      growth: ['record a sudden insight before it fades', 'follow a surprise with slow attention'],
      blocks: ['events that give no time to prepare', 'people who trust only expected news'] },
    /* lunar points */
    lilithMean: { label: 'Lilith (Mean)', kind: 'point', energy: 'what refused to be tamed',
      definition: 'The Black Moon Lilith is not a body. It is the apogee of the Moon’s orbit, the point where the Moon is farthest from the Earth, averaged into a smooth mean motion that takes about nine years to go round the zodiac. It is named for Lilith of Jewish folklore, who in medieval tellings refused to be subordinate, left Eden, and was made into a demon for it.',
      role: 'Lilith shows what in you was exiled for refusing to comply, where you hold anger or desire that was called unacceptable, and where your power is raw rather than polite.',
      verb: 'reclaims', gifts: ['refuse a role you were never asked about', 'speak about taboo without shame', 'hold your ground when told to be smaller'],
      shadows: ['go into exile rather than negotiate', 'let rage stay underground until it erupts', 'wear rejection as an identity'],
      growth: ['bring the exiled part back to the table', 'let anger inform a boundary rather than a banishment'],
      blocks: ['people and institutions that reward compliance', 'shame taught around the body or desire'] },
    lilithOsc: { label: 'Lilith (Osculating)', kind: 'point', energy: 'the untamed as it moves in the moment',
      definition: 'The osculating, or true, Black Moon is the lunar apogee as it actually stands at an instant, from the Moon’s real orbit at that moment rather than its long average. Because the Sun pulls on the Moon so strongly, it can sit up to thirty degrees either side of the mean. It carries the same meaning as the mean Lilith, read more immediately.',
      role: 'The osculating Lilith is read like the mean one, for the part of you exiled for refusing to comply, and some astrologers prefer it for its precision in time.',
      verb: 'stirs', gifts: ['feel exactly when something is being suppressed', 'respond to injustice while it is happening', 'trust a flash of defiance'],
      shadows: ['react before understanding', 'take every constraint as an attack', 'swing between defiance and hiding'],
      growth: ['pause between the flash and the response', 'choose which defiance is worth the cost'],
      blocks: ['settings that punish strong reactions', 'a fear of your own intensity'] },
    selena: { label: 'Selena', kind: 'point', energy: 'grace, protection and the pure intention',
      definition: 'Selena, the White Moon, is placed opposite the Black Moon, at the Moon’s mean perigee, the point where it comes closest to the Earth. It is a modern point, introduced by Russian astrologers in the twentieth century, and named for the Greek goddess of the moon. It is read as a place of grace and quiet protection, the counterweight to Lilith.',
      role: 'Selena shows where help seems to arrive, where your intentions are clearest, and where you act from goodness without needing to prove it.',
      verb: 'blesses', gifts: ['act from a clear and kind intention', 'find protection in hard times', 'bring light to a dark situation'],
      shadows: ['rely on grace instead of effort', 'hide from your own shadow behind goodness', 'expect protection and take risks accordingly'],
      growth: ['let good fortune make you generous', 'hold your light and your shadow together'],
      blocks: ['a belief that you must be pure to be protected', 'spaces where kindness is taken for weakness'] },
    /* planetary nodes: where each planet's orbit crosses the ecliptic, seen
       from the Sun. They move so slowly that everyone born within decades
       shares them, so they read as the shared work of a generation. */
    mercuryNode: { label: 'Mercury’s North Node', kind: 'node', energy: 'the thinking of a generation',
      definition: 'Mercury’s heliocentric node is where Mercury’s orbit crosses the plane of the Earth’s. It moves only a few degrees in a lifetime, so it is shared across generations. It is read for the collective direction of thought, speech and learning.',
      role: 'Mercury’s node shows the way your generation is learning to think and speak, and where in your life you meet that shared work.',
      verb: 'directs', gifts: ['speak for ideas your generation is forming', 'learn in the new ways of your time', 'connect old knowledge to new tools'],
      shadows: ['adopt the thinking of your generation without testing it', 'confuse a fashionable idea with a true one', 'dismiss older ways of knowing'],
      growth: ['test a shared idea against your own experience', 'carry forward a way of thinking worth keeping'],
      blocks: ['an information climate that rewards speed over thought', 'ideas that spread before they are tested'] },
    venusNode: { label: 'Venus’s North Node', kind: 'node', energy: 'the values a generation is forming',
      definition: 'Venus’s heliocentric node is where Venus’s orbit crosses the plane of the Earth’s. Like all planetary nodes it barely moves in a lifetime. It is read for the collective direction of love, beauty and value.',
      role: 'Venus’s node shows how your generation is learning to love and to value, and where in your life you meet that shared work.',
      verb: 'directs', gifts: ['help define what your generation finds beautiful', 'relate in ways that are new to your time', 'carry forward a value worth keeping'],
      shadows: ['take a generational taste for your own', 'measure love by the standards of the moment', 'look down on how earlier generations loved'],
      growth: ['choose what you value on your own terms', 'let the new ways of relating be tested by care'],
      blocks: ['changing norms that leave no settled ground', 'a market that sets the value of things for you'] },
    marsNode: { label: 'Mars’s North Node', kind: 'node', energy: 'the drive of a generation',
      definition: 'Mars’s heliocentric node is where Mars’s orbit crosses the plane of the Earth’s, fixed within a degree or two across a life. It is read for the collective direction of action, conflict and will.',
      role: 'Mars’s node shows how your generation is learning to act and to fight, and where in your life you meet that shared work.',
      verb: 'directs', gifts: ['act on the causes of your time', 'find courage alongside others', 'change the ways conflict is handled'],
      shadows: ['fight the battles of your generation without choosing them', 'confuse collective anger with your own', 'carry a war you did not start'],
      growth: ['choose where to put your energy for change', 'end a fight passed down to you'],
      blocks: ['conflicts inherited from an earlier generation', 'movements that want your anger more than your judgement'] },
    jupiterNode: { label: 'Jupiter’s North Node', kind: 'node', energy: 'the growth a generation reaches for',
      definition: 'Jupiter’s heliocentric node is where Jupiter’s orbit crosses the plane of the Earth’s. It shifts by well under a degree in a lifetime. It is read for the collective direction of belief, meaning and expansion.',
      role: 'Jupiter’s node shows what your generation believes in and hopes for, and where in your life you meet that shared work.',
      verb: 'directs', gifts: ['share in the hopes of your time', 'build meaning with others', 'broaden a belief to include more people'],
      shadows: ['overreach along with everyone else', 'take a collective optimism on faith', 'expand without asking what it costs'],
      growth: ['test a shared belief against its effects', 'grow in ways that leave room for others'],
      blocks: ['booms that assume growth will never end', 'a faith that no one is allowed to question'] },
    saturnNode: { label: 'Saturn’s North Node', kind: 'node', energy: 'the responsibilities a generation carries',
      definition: 'Saturn’s heliocentric node is where Saturn’s orbit crosses the plane of the Earth’s, almost fixed across a human life. It is read for the collective direction of structure, duty and limits.',
      role: 'Saturn’s node shows the structures your generation is building or bearing, and where in your life you meet that shared work.',
      verb: 'directs', gifts: ['take responsibility for what your time needs', 'build institutions that last', 'accept a real limit with dignity'],
      shadows: ['carry a weight that belongs to the whole generation alone', 'defend a structure past its usefulness', 'resent the limits of your time'],
      growth: ['share the load of what must be built', 'lay a foundation for those who come after'],
      blocks: ['institutions failing around you', 'debts left by earlier generations'] },
    uranusNode: { label: 'Uranus’s North Node', kind: 'node', energy: 'the change a generation is bringing',
      definition: 'Uranus’s heliocentric node is where Uranus’s orbit crosses the plane of the Earth’s, barely moving across centuries. It is read for the collective direction of innovation, freedom and upheaval.',
      role: 'Uranus’s node shows how your generation is breaking with the past, and where in your life you meet that shared work.',
      verb: 'directs', gifts: ['bring in the changes your time needs', 'free yourself from an outdated pattern', 'welcome new technology or ideas with discernment'],
      shadows: ['break things because your generation does', 'chase novelty for its own sake', 'feel alienated by the pace of change'],
      growth: ['change what needs changing and keep what works', 'help others through upheaval'],
      blocks: ['rapid change without support', 'a culture that confuses disruption with progress'] },
    neptuneNode: { label: 'Neptune’s North Node', kind: 'node', energy: 'the dream a generation holds',
      definition: 'Neptune’s heliocentric node is where Neptune’s orbit crosses the plane of the Earth’s, nearly fixed for centuries. It is read for the collective direction of spirituality, imagination and ideals.',
      role: 'Neptune’s node shows the dreams and illusions your generation holds, and where in your life you meet that shared work.',
      verb: 'directs', gifts: ['give form to the dreams of your time', 'find the spiritual in collective life', 'feel compassion on a large scale'],
      shadows: ['share a collective illusion', 'escape into the fantasies of your time', 'lose yourself in a cause'],
      growth: ['ground a shared ideal in practical action', 'see through a comforting story'],
      blocks: ['propaganda that looks like hope', 'escapes that a whole culture accepts'] },
    plutoNode: { label: 'Pluto’s North Node', kind: 'node', energy: 'the transformation a generation goes through',
      definition: 'Pluto’s heliocentric node is where Pluto’s steeply tilted orbit crosses the plane of the Earth’s, fixed for centuries. It is read for the collective direction of power, death and rebirth.',
      role: 'Pluto’s node shows the deep transformations your generation lives through, and where in your life you meet that shared work.',
      verb: 'directs', gifts: ['face collective crises with depth', 'take part in dismantling abuses of power', 'rebuild after a shared loss'],
      shadows: ['carry a collective trauma as if it were only personal', 'seek power the way your generation does', 'fear change that is already underway'],
      growth: ['let a shared ending make room for renewal', 'use your power to protect others'],
      blocks: ['structures of power that resist change', 'collective grief that goes unacknowledged'] },
    /* Hamburg School hypotheticals: eight points Alfred Witte and Friedrich
       Sieggruen proposed in the 1920s beyond Neptune. No such bodies have
       been found. Uranian astrology reads them as defined points on an orbit. */
    tnp_cupido: { label: 'Cupido (Hamburg)', kind: 'hypothetical', energy: 'belonging, family and shared art',
      definition: 'Cupido is the first of the Hamburg School’s hypothetical points, proposed by Alfred Witte in the 1920s. No planet has been found at this place: it is a point on a defined orbit, used in Uranian astrology. It is read for groups, family, marriage as an institution, and the arts that bind people together. It is not the asteroid Cupido.',
      role: 'Cupido shows where you belong to a group, what family and community mean to you, and how you create beauty with others.',
      verb: 'gathers', gifts: ['bring people together into a family of choice', 'create beauty in a group', 'keep traditions that connect people'],
      shadows: ['lose yourself in belonging', 'value the group over its members', 'put up with a group to avoid being alone'],
      growth: ['build belonging that allows difference', 'share the art you make with a community'],
      blocks: ['family roles that allow no change', 'groups that demand conformity'] },
    tnp_hades: { label: 'Hades (Hamburg)', kind: 'hypothetical', energy: 'what is old, discarded or hidden',
      definition: 'Hades is one of the Hamburg School’s hypothetical points, proposed by Alfred Witte. It does not exist as a body; it is a defined point used in Uranian astrology. It is read for decay, the past, what is neglected or hidden, antiquity, and the things people would rather not look at.',
      role: 'Hades shows where you meet what is worn out or rejected, what the past still holds, and where there is value in what others throw away.',
      verb: 'uncovers', gifts: ['find value in what others discard', 'study the past with patience', 'face what is unpleasant and deal with it'],
      shadows: ['dwell in what is decaying', 'hide what needs attention', 'feel worthless in the face of loss'],
      growth: ['clear out what is finished', 'restore what still has use'],
      blocks: ['neglect that has built up over years', 'secrets kept by those around you'] },
    tnp_zeus: { label: 'Zeus (Hamburg)', kind: 'hypothetical', energy: 'directed force and purposeful leadership',
      definition: 'Zeus is one of the Hamburg School’s hypothetical points, proposed by Alfred Witte. It is a defined point, not a found body, used in Uranian astrology. It is read for directed energy, fire and machines, leadership, creative drive and the aiming of power at a goal.',
      role: 'Zeus shows where your energy is most focused, how you lead, and what you are aiming your drive at.',
      verb: 'directs', gifts: ['aim energy precisely at a goal', 'lead by giving clear direction', 'use tools and machines with skill'],
      shadows: ['push force where patience is needed', 'lead by command alone', 'burn out from constant drive'],
      growth: ['aim force at goals worth reaching', 'lead in a way that builds others up'],
      blocks: ['situations with no outlet for drive', 'leaders who only give orders'] },
    tnp_kronos: { label: 'Kronos (Hamburg)', kind: 'hypothetical', energy: 'authority, mastery and high standing',
      definition: 'Kronos is one of the Hamburg School’s hypothetical points, proposed by Alfred Witte. It does not exist as a body; it is a defined point used in Uranian astrology. It is read for authority, government, expertise, independence and the position above others.',
      role: 'Kronos shows where you hold or seek authority, what you have mastered, and how you relate to those in power.',
      verb: 'commands', gifts: ['master a field thoroughly', 'hold authority fairly', 'see a situation from above'],
      shadows: ['look down on others', 'defer to authority without thinking', 'hold power too tightly'],
      growth: ['use authority to serve', 'respect expertise while questioning power'],
      blocks: ['rigid hierarchies', 'authority that will not be questioned'] },
    tnp_apollon: { label: 'Apollon (Hamburg)', kind: 'hypothetical', energy: 'expansion, commerce and breadth of success',
      definition: 'Apollon is one of the Hamburg School’s hypothetical points, proposed by Friedrich Sieggruen. It is a defined point rather than a found body, used in Uranian astrology. It is read for expansion, trade, science, multiplicity and success that grows wide.',
      role: 'Apollon shows where you grow your reach, how you trade and connect, and where abundance multiplies.',
      verb: 'expands', gifts: ['grow a project across many places', 'trade and exchange widely', 'build knowledge through science'],
      shadows: ['spread yourself too thin', 'value quantity over quality', 'grow without roots'],
      growth: ['expand from a firm centre', 'share success widely'],
      blocks: ['markets that reward only growth', 'too many demands at once'] },
    tnp_admetos: { label: 'Admetos (Hamburg)', kind: 'hypothetical', energy: 'depth, endurance and the stopping point',
      definition: 'Admetos is one of the Hamburg School’s hypothetical points, proposed by Friedrich Sieggruen. It is a defined point, not a found body, used in Uranian astrology. It is read for restriction, depth, raw materials, land, endurance and the things that stop or hold still.',
      role: 'Admetos shows where you are held back or held steady, what endures in you, and where you get to the root of a matter.',
      verb: 'deepens', gifts: ['persist through long delays', 'get to the root of a problem', 'build on solid ground'],
      shadows: ['stay stuck and call it patience', 'resist all change', 'feel trapped by circumstance'],
      growth: ['know when to stop and when to move', 'use stillness to go deeper'],
      blocks: ['long delays outside your control', 'heavy obligations tied to property or land'] },
    tnp_vulkanus: { label: 'Vulkanus (Hamburg)', kind: 'hypothetical', energy: 'immense force and intensity',
      definition: 'Vulkanus is one of the Hamburg School’s hypothetical points, proposed by Friedrich Sieggruen. It does not exist as a body; it is a defined point used in Uranian astrology. It is read for great power, force, energy and intensity, the capacity to move what is heavy.',
      role: 'Vulkanus shows where you are strongest, where intensity gathers in your life, and how you handle great force.',
      verb: 'powers', gifts: ['bring great energy to a task', 'move what others cannot', 'stay strong under pressure'],
      shadows: ['overwhelm others with intensity', 'use more force than is needed', 'feel powerless against larger forces'],
      growth: ['channel strength into lasting work', 'use power with care'],
      blocks: ['forces much larger than you', 'situations that demand constant intensity'] },
    tnp_poseidon: { label: 'Poseidon (Hamburg)', kind: 'hypothetical', energy: 'spirit, insight and clarity of mind',
      definition: 'Poseidon is the last of the Hamburg School’s hypothetical points, proposed by Friedrich Sieggruen. It is a defined point, not a found body, used in Uranian astrology. It is read for spirit, ideas, enlightenment, truth and clear perception.',
      role: 'Poseidon shows where you seek truth, how your spiritual life is lit, and where ideas become clear.',
      verb: 'clarifies', gifts: ['see the truth of a situation', 'bring spiritual depth to ordinary life', 'explain an idea clearly'],
      shadows: ['float in ideas without grounding', 'claim a truth for everyone', 'lose touch with the practical'],
      growth: ['put an insight into practice', 'let understanding stay open'],
      blocks: ['ideologies that claim final truth', 'confusion that clouds judgement'] },
    /* derived points: calculated, not bodies */
    vertex: { label: 'Vertex', kind: 'point', energy: 'encounters that feel arranged',
      definition: 'The Vertex is where the prime vertical, the great circle running due east and west through the point overhead, crosses the ecliptic in the west of the chart. It was introduced by the astrologer L. Edward Johndro in the twentieth century and developed by Charles Jayne. It is read for meetings and events that seem to come from outside, as if arranged.',
      role: 'The Vertex shows the kind of encounters that feel fated, and the doors other people open for you.',
      verb: 'opens', gifts: ['recognise a meeting that matters', 'say yes when a door opens', 'let others change your course'],
      shadows: ['wait for fate instead of choosing', 'give significance to every coincidence', 'hand your direction over to other people'],
      growth: ['meet an arranged opportunity with your own choice', 'notice who keeps opening doors'],
      blocks: ['a belief that nothing happens unless it is fated', 'relationships that take over your direction'] },
    antivertex: { label: 'Antivertex', kind: 'point', energy: 'agency within fate',
      definition: 'The Antivertex is the point opposite the Vertex, where the prime vertical crosses the ecliptic in the east. Where the Vertex is read for what comes through others, the Antivertex is read for what you initiate yourself.',
      role: 'The Antivertex shows the doors you open with your own hands, and how you take charge of what arrives.',
      verb: 'initiates', gifts: ['make your own opportunities', 'act on what fate offers', 'take responsibility for your path'],
      shadows: ['insist on controlling what comes', 'refuse help that is offered', 'see every event as your own doing'],
      growth: ['balance your own action with what others bring', 'take the first step'],
      blocks: ['situations that allow no initiative', 'a fear of acting without a sign'] },
    partOfFortune: { label: 'Part of Fortune', kind: 'point', energy: 'the body and its circumstances',
      definition: 'The Part of Fortune is the oldest and most used of the Hellenistic lots, and it reverses on sect: by day it is the Ascendant plus the distance from the Sun to the Moon, and by night the distance from the Moon to the Sun. The tradition reads it for the body and its furnishing, meaning health, livelihood and the material circumstances a life is actually lived in, which is a narrower and more concrete claim than the word fortune suggests.',
      role: 'The Part of Fortune shows where circumstances tend to come together for you without being arranged, and what area of life the tradition says your body and your living are bound up with.',
      verb: 'receives', gifts: ['find ease where you did not arrange it', 'let good circumstances be used rather than doubted', 'notice what already supports you'],
      shadows: ['wait for fortune instead of acting', 'read a run of luck as a verdict on your worth', 'spend what arrives easily without care'],
      growth: ['use what comes without needing to have earned it first', 'tell circumstance apart from character'],
      blocks: ['conditions nobody in the situation chose', 'the belief that unearned ease has to be paid for'] },
    partOfSpirit: { label: 'Part of Spirit', kind: 'point', energy: 'conscious will and chosen purpose',
      definition: 'The Part of Spirit is one of the Hellenistic lots, calculated from the Ascendant by adding the distance from the Moon to the Sun. It is the counterpart of the Part of Fortune: where Fortune is read for what happens to the body and its circumstances, Spirit is read for the mind, intention and what a person does by choice.',
      role: 'The Part of Spirit shows where your intentions are strongest, what you set out to do on purpose, and the work that expresses your will.',
      verb: 'chooses', gifts: ['act with clear intention', 'put your will behind a purpose', 'shape circumstances through effort'],
      shadows: ['believe will alone decides everything', 'push against what cannot change', 'judge yourself by what you intend rather than do'],
      growth: ['align intention with action', 'accept what fortune brings while acting on what you choose'],
      blocks: ['circumstances that limit choice', 'confusion about what you actually want'] },
    ariesPoint: { label: 'Aries Point', kind: 'point', energy: 'contact with the public world',
      definition: 'The Aries Point is zero degrees of Aries, where the Sun crosses the celestial equator at the March equinox and the tropical zodiac begins. It is the same place in every chart. Uranian astrology gave it weight as the point where personal life meets the world at large, and a planet near it is read as reaching the public.',
      role: 'The Aries Point shows how a chart meets the wider world. What sits near it, by conjunction, square or opposition, may be where you become visible beyond private life.',
      verb: 'opens', gifts: ['bring a personal matter into public life', 'make a mark beyond your own circle', 'begin something that others notice'],
      shadows: ['seek visibility for its own sake', 'feel exposed by public attention', 'let public events take over private life'],
      growth: ['choose what you bring into public view', 'let visibility serve something you care about'],
      blocks: ['public events beyond your control', 'attention that arrives before you are ready'] },
    sunmoonMidpoint: { label: 'Sun/Moon Midpoint', kind: 'point', energy: 'the meeting of will and feeling',
      definition: 'The Sun/Moon midpoint is the point halfway between the Sun and the Moon on their nearer side. Midpoints were developed by the Hamburg School and by Reinhold Ebertin, and this one is read as the place where the conscious self and the emotional self meet, and in relationship charts as a sign of inner and outer partnership.',
      role: 'The Sun/Moon midpoint shows how your will and your feelings work together, and what brings the two into accord.',
      verb: 'unites', gifts: ['make decisions your heart and head agree on', 'feel whole within yourself', 'recognise a partner who fits both sides of you'],
      shadows: ['let one side override the other', 'look for wholeness only in a partner', 'hide inner conflict behind balance'],
      growth: ['listen to what will and feeling each want', 'let a relationship reflect an inner agreement'],
      blocks: ['a split between what you want and what you need', 'pressure to choose between reason and feeling'] }
  };
  Object.keys(EXPANDED).forEach(function (k) { BODIES[k] = EXPANDED[k]; });

  /* ---- LAYER 2: signs -----------------------------------------------------
     manner  fills "acts <manner>"   demand  what the sign requires
     decans  Chaldean decan rulers, 0-9 / 10-19 / 20-29                      */
  var SIGNS = {
    'Aries': { element: 'fire', modality: 'cardinal', quality: 'directness and initiative',
      definition: 'Aries is cardinal fire. It begins, it moves first, and it understands afterwards. Courage is native here; restraint is learned.',
      manner: 'first and fast, before the argument for waiting can be made', demand: 'Aries requires that something actually start.',
      gift: 'begin without a guarantee', shadow: 'burn the first third of your force on the starting gun',
      decans: ['Mars', 'Sun', 'Venus'] },
    'Taurus': { element: 'earth', modality: 'fixed', quality: 'steadiness and sensory trust',
      definition: 'Taurus is fixed earth. It trusts what can be touched, moves at its own rate, and will not be hurried into anything.',
      manner: 'slowly, physically, and only once', demand: 'Taurus requires that the thing be real and worth keeping.',
      gift: 'stay with something until it is solid', shadow: 'keep a comfortable arrangement past its expiry',
      decans: ['Mercury', 'Moon', 'Saturn'] },
    'Gemini': { element: 'air', modality: 'mutable', quality: 'curiosity and quickness',
      definition: 'Gemini is mutable air. It gathers, connects, and keeps a second option live. Contradiction does not trouble it.',
      manner: 'in several directions at once, testing as it goes', demand: 'Gemini requires interest, and will not fake it.',
      gift: 'hold two ideas without collapsing them', shadow: 'move on at the moment depth becomes available',
      decans: ['Jupiter', 'Mars', 'Sun'] },
    'Cancer': { element: 'water', modality: 'cardinal', quality: 'protectiveness and memory',
      definition: 'Cancer is cardinal water. It protects, remembers, and moves indirectly. Feeling is information here, not interruption.',
      manner: 'protectively, sideways, tending the vulnerable part first', demand: 'Cancer requires safety before honesty.',
      gift: 'make a place where people can be unguarded', shadow: 'defend an old hurt as though it were current',
      decans: ['Venus', 'Mercury', 'Moon'] },
    'Leo': { element: 'fire', modality: 'fixed', quality: 'warmth and expressive pride',
      definition: 'Leo is fixed fire. It radiates, commits to its own expression, and wants what it makes to be seen.',
      manner: 'warmly and visibly, with the whole self behind it', demand: 'Leo requires that it matter, and be witnessed.',
      gift: 'be generous from the centre', shadow: 'need the witness before the act feels real',
      decans: ['Saturn', 'Jupiter', 'Mars'] },
    'Virgo': { element: 'earth', modality: 'mutable', quality: 'precision and usefulness',
      definition: 'Virgo is mutable earth. It refines, notices what is off, and serves through competence rather than declaration.',
      manner: 'carefully, in small corrections, keeping the standard in view', demand: 'Virgo requires that it be done properly.',
      gift: 'improve the thing rather than describe it', shadow: 'let the standard become a tax on every attempt',
      decans: ['Sun', 'Venus', 'Mercury'] },
    'Libra': { element: 'air', modality: 'cardinal', quality: 'balance and relation',
      definition: 'Libra is cardinal air. It weighs, relates, and initiates through other people. Fairness is the organising instinct.',
      manner: 'relationally, weighing the other side before moving', demand: 'Libra requires that it be fair, and mutual.',
      gift: 'hold two interests at once without erasing one', shadow: 'defer until the decision is made by default',
      decans: ['Moon', 'Saturn', 'Jupiter'] },
    'Scorpio': { element: 'water', modality: 'fixed', quality: 'depth and intensity',
      definition: 'Scorpio is fixed water. It seeks depth, truth, and emotional intensity. It rules what is hidden, what transforms, and what must die to be reborn.',
      manner: 'quietly and completely, holding the depth of it', demand: 'Scorpio requires the real version, at cost.',
      gift: 'stay with what others look away from', shadow: 'hold on and call the grip loyalty',
      decans: ['Mars', 'Sun', 'Venus'] },
    'Sagittarius': { element: 'fire', modality: 'mutable', quality: 'breadth and conviction',
      definition: 'Sagittarius is mutable fire. It ranges, believes, and needs a horizon. Meaning matters more than comfort here.',
      manner: 'expansively, aimed at somewhere larger', demand: 'Sagittarius requires room and a reason.',
      gift: 'keep faith in something bigger than the week', shadow: 'answer before the question is finished',
      decans: ['Mercury', 'Moon', 'Saturn'] },
    'Capricorn': { element: 'earth', modality: 'cardinal', quality: 'discipline and long ambition',
      definition: 'Capricorn is cardinal earth. It builds, endures, and takes the long view. Authority here is earned rather than assumed.',
      manner: 'strategically and patiently, with the long climb accounted for', demand: 'Capricorn requires that it last.',
      gift: 'stay with a plan past the interesting part', shadow: 'defer the living until the building is finished',
      decans: ['Jupiter', 'Mars', 'Sun'] },
    'Aquarius': { element: 'air', modality: 'fixed', quality: 'detachment and principle',
      definition: 'Aquarius is fixed air. It stands back, sees the system, and holds a position on principle even when it costs belonging.',
      manner: 'at a deliberate distance, on principle rather than pressure', demand: 'Aquarius requires that it make sense from outside.',
      gift: 'see the arrangement nobody questions', shadow: 'stay outside where inside was the point',
      decans: ['Venus', 'Mercury', 'Moon'] },
    'Pisces': { element: 'water', modality: 'mutable', quality: 'porousness and mercy',
      definition: 'Pisces is mutable water. Boundaries thin easily; compassion and escape run through the same door.',
      manner: 'permeably, taking in more than was addressed to you', demand: 'Pisces requires mercy, including for yourself.',
      gift: 'feel what has not been said', shadow: 'dissolve the edge that was holding you',
      decans: ['Saturn', 'Jupiter', 'Mars'] }
  };

  /* ---- LAYER 3: houses ---------------------------------------------------- */
  var HOUSES = [
    { theme: 'Self and body', arena: 'self, body, and first arrival',
      definition: 'The 1st House governs the self as it presents. Body, manner, and how you arrive in a room before you say anything.',
      asks: 'It asks who is showing up.', gift: 'presence', shadow: 'a manner that outlives its usefulness',
      growth: 'let the presentation catch up to the person', block: 'a style adopted before you had a say' },
    { theme: 'Resources and worth', arena: 'resources, income, and self-worth',
      definition: 'The 2nd House governs what you own and what you believe you are worth. Money, and the harder question underneath it.',
      asks: 'It asks what you value enough to keep.', gift: 'sustainable footing', shadow: 'worth measured in holdings',
      growth: 'value something that does not appreciate', block: 'a scarcity rule set in an earlier household' },
    { theme: 'Mind and near world', arena: 'thought, siblings, and the near world',
      definition: 'The 3rd House governs the immediate mind. Speech, learning, siblings, and everything within reach.',
      asks: 'It asks how you take the world in and hand it back.', gift: 'quick usable intelligence', shadow: 'motion mistaken for movement',
      growth: 'finish one line of thought before starting three', block: 'a household where some things could not be said' },
    { theme: 'Home and roots', arena: 'home, family, and private ground',
      definition: 'The 4th House governs origin and interior life. Family, home, and the private ground you stand on.',
      asks: 'It asks what holds you up when nobody is watching.', gift: 'a base that actually holds', shadow: 'a foundation left unexamined',
      growth: 'build a home rather than inherit one', block: 'an early atmosphere still setting the thermostat' },
    { theme: 'Creativity and play', arena: 'creativity, play, romance, and children',
      definition: 'The 5th House governs what you make for its own sake. Creative work, play, romance, children.',
      asks: 'It asks what you would do with no outcome attached.', gift: 'genuine delight', shadow: 'play that has become performance',
      growth: 'make something with no use', block: 'an audience installed in childhood' },
    { theme: 'Work and health', arena: 'daily work, health, and routine',
      definition: 'The 6th House governs the daily. Work, habit, health, and the small repeated things that constitute a life.',
      asks: 'It asks whether the ordinary days are survivable.', gift: 'craft and reliable rhythm', shadow: 'maintenance without meaning',
      growth: 'let the routine serve the life rather than replace it', block: 'a body treated as an instrument' },
    { theme: 'Partnership', arena: 'partnership and one-to-one relating',
      definition: 'The 7th House governs the other met as an equal. Partnership, contracts, and open opposition.',
      asks: 'It asks who you become in the presence of someone else.', gift: 'real mutuality', shadow: 'a self that only appears in company',
      growth: 'stay recognisable inside a bond', block: 'a pattern of partner that keeps arriving' },
    { theme: 'Depth and the shared', arena: 'depth, shared resources, and what is not spoken',
      definition: 'The 8th House governs transformation, shared resources, intimacy, death and rebirth, and the unseen forces that shape a life.',
      asks: 'It asks what you do with power that is not entirely yours.', gift: 'unflinching depth', shadow: 'control where trust was required',
      growth: 'let something end while there is still choice in it', block: 'a secret that has become structural' },
    { theme: 'Meaning and distance', arena: 'meaning, travel, and belief',
      definition: 'The 9th House governs the far. Belief, higher study, travel, and the frames you use to make sense of things.',
      asks: 'It asks what you are willing to hold as true.', gift: 'a working philosophy', shadow: 'conviction defended rather than tested',
      growth: 'let a belief be corrected by experience', block: 'a certainty inherited whole' },
    { theme: 'Work and standing', arena: 'vocation, standing, and ambition',
      definition: 'The 10th House governs the public arc. Vocation, reputation, and what you are known for.',
      asks: 'It asks what you are building in the open.', gift: 'a legible contribution', shadow: 'the role consuming the person',
      growth: 'choose the work rather than the standing', block: 'an inherited definition of success' },
    { theme: 'Community and future', arena: 'community, friendship, and the future',
      definition: 'The 11th House governs the collective. Friendship, group life, and the future you are moving toward with others.',
      asks: 'It asks who you are building alongside.', gift: 'belonging without disappearance', shadow: 'a group joined in order to be someone',
      growth: 'contribute to something that outlasts your interest', block: 'a circle held for who you used to be' },
    { theme: 'Interior and release', arena: 'solitude, the unconscious, and release',
      definition: 'The 12th House governs the hidden interior. Solitude, the unconscious, retreat, and what must be released rather than solved.',
      asks: 'It asks what you carry that nobody has seen.', gift: 'access to your own depths', shadow: 'a retreat that became a hiding place',
      growth: 'bring one hidden thing into the light on your terms', block: 'a habit of vanishing under pressure' }
  ];

  /* Per-house voice. Correction pass V1.1: the generated pages used one shared
     sentence for every house ("that question is rarely abstract"), which read as
     filler by the third page. Each house now has its own two paragraphs:
       presence  how a body behaves once it lands in this house
       inLife    what the house does to an actual life                          */
  var HOUSE_PRESENCE = [
    'When planets gather in your 1st House, you feel their presence directly. This is the house of self-presentation. A planet here does not hide. It becomes part of how others recognise you and how you recognise yourself.',
    'When planets occupy your 2nd House, they shape what you value and how you secure it. This is the terrain of earned worth. A planet here asks: what do you build, and what builds you?',
    'When planets move through your 3rd House, they colour how you speak, learn, and connect with your immediate world. This is the house of daily exchange. A planet here shows up in conversations, short journeys, and the information you choose to carry.',
    'When planets rest in your 4th House, they touch the foundation of your life. This is the house of home, heritage, and emotional ground. A planet here shapes what shelters you and what you are called to shelter.',
    'When planets shine in your 5th House, they ignite what you create for joy. This is the house of self-expression, romance, and play. A planet here wants to be seen, felt, and celebrated.',
    'When planets work in your 6th House, they shape your daily rhythms and how you tend to what needs doing. This is the house of craft, health, and useful labour. A planet here shows up in your routines and your relationship to your own body.',
    'When planets mirror in your 7th House, they reveal who stands across from you. This is the house of committed relationship and open opposition. A planet here draws others in to teach you what you cannot learn alone.',
    'When planets plunge into your 8th House, they enter the depths where surface life falls away. This is the house of shared resources, intimacy, and what must end to be remade. A planet here does not skim. It asks for the truth.',
    'When planets expand in your 9th House, they stretch your understanding of what is possible. This is the house of long journeys, higher learning, and belief. A planet here calls you beyond the familiar.',
    'When planets climb to your 10th House, they shape how you are known in the world. This is the house of vocation, reputation, and public life. A planet here leaves a mark that outlasts the moment.',
    'When planets gather in your 11th House, they weave you into the fabric of something larger. This is the house of friends, hopes, and collective future. A planet here shows what you wish for and who wishes it with you.',
    'When planets dissolve into your 12th House, they work below the level of conscious choice. This is the house of seclusion, undoing, and hidden strengths. A planet here operates in dreams, in solitude, and in what you release.'
  ];
  var HOUSE_IN_LIFE = [
    'This is where your life becomes visible. A planet in your 1st House does not stay hidden. It becomes part of your face to the world.',
    'This is where your values become tangible. A planet in your 2nd House asks what you are willing to cultivate and what you need in order to feel secure.',
    'This is where your mind meets the world. A planet in your 3rd House shapes how you speak, what you notice, and how you move through your daily environment.',
    'This is where your roots speak. A planet in your 4th House touches what grounds you, what you come from, and what you need in order to feel at home.',
    'This is where your joy finds form. A planet in your 5th House colours what you create, who you love, and what you do simply because it delights you.',
    'This is where your life finds its rhythm. A planet in your 6th House shapes your daily work, your health, and how you serve what matters.',
    'This is where you meet the other. A planet in your 7th House draws people toward you who mirror what you need to see in yourself.',
    'This is where surface gives way to depth. A planet in your 8th House enters the territory of trust, shared power, and what transforms through contact.',
    'This is where your horizon expands. A planet in your 9th House pulls you toward meaning, distance, and understanding that reorders what you thought you knew.',
    'This is where your path becomes public. A planet in your 10th House shapes how you are remembered and what you build that outlasts you.',
    'This is where your individual life joins something collective. A planet in your 11th House shows where your hopes align with others and what future you are willing to work toward.',
    'This is where the visible world thins. A planet in your 12th House works in solitude, in surrender, and in the strengths you do not know you have until they are needed.'
  ];
  HOUSES.forEach(function (h, i) { h.presence = HOUSE_PRESENCE[i]; h.inLife = HOUSE_IN_LIFE[i]; });

  /* ---- LAYER 4: dignity (traditional table) ------------------------------- */
  var DIGNITY = {
    'Sun':     { rulership: ['Leo'], detriment: ['Aquarius'], exaltation: ['Aries'], fall: ['Libra'] },
    'Moon':    { rulership: ['Cancer'], detriment: ['Capricorn'], exaltation: ['Taurus'], fall: ['Scorpio'] },
    'Mercury': { rulership: ['Gemini', 'Virgo'], detriment: ['Sagittarius', 'Pisces'], exaltation: ['Virgo'], fall: ['Pisces'] },
    'Venus':   { rulership: ['Taurus', 'Libra'], detriment: ['Scorpio', 'Aries'], exaltation: ['Pisces'], fall: ['Virgo'] },
    'Mars':    { rulership: ['Aries', 'Scorpio'], detriment: ['Libra', 'Taurus'], exaltation: ['Capricorn'], fall: ['Cancer'] },
    'Jupiter': { rulership: ['Sagittarius', 'Pisces'], detriment: ['Gemini', 'Virgo'], exaltation: ['Cancer'], fall: ['Capricorn'] },
    'Saturn':  { rulership: ['Capricorn', 'Aquarius'], detriment: ['Cancer', 'Leo'], exaltation: ['Libra'], fall: ['Aries'] },
    'Uranus':  { rulership: ['Aquarius'], detriment: ['Leo'], exaltation: ['Scorpio'], fall: ['Taurus'] },
    'Neptune': { rulership: ['Pisces'], detriment: ['Virgo'], exaltation: ['Leo', 'Cancer'], fall: ['Capricorn'] },
    'Pluto':   { rulership: ['Scorpio'], detriment: ['Taurus'], exaltation: ['Leo'], fall: ['Aquarius'] }
  };
  /* Mercury rules and is exalted in Virgo; Saturn's Aquarius rulership and Uranus'
     Aquarius rulership coexist here because the app shows both traditional and
     modern attributions. Where a sign yields two states, the stronger is shown. */
  var ORDER = ['rulership', 'exaltation', 'detriment', 'fall'];

  /* The expanded chart addresses its points by registry id. Five of them were
     written here first under their plain names, and an id resolves to that
     entry rather than to a second copy of it. */
  var ALIAS = { chiron: 'Chiron', ceres: 'Ceres', pallas: 'Pallas', juno: 'Juno', vesta: 'Vesta' };
  function keyFor(k) { return BODIES[k] ? k : (ALIAS[k] && BODIES[ALIAS[k]] ? ALIAS[k] : k); }
  /* The name a sentence uses. An entry keyed by id carries its own label. */
  function nm(body) { var b = BODIES[body]; return b && b.label ? b.label : body; }

  function ord(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }
  function ordWord(n) { return ['first', 'second', 'third'][n - 1] || String(n); }
  function low(s) { return String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1); }
  function stripDot(s) { return String(s || '').replace(/\.$/, ''); }

  var PC = {
    VERSION: '1.0.0',
    bodies: BODIES, signs: SIGNS, houses: HOUSES, dignityTable: DIGNITY,
    known: function (body) { return !!BODIES[keyFor(body)]; },
    keyFor: keyFor, label: nm,
    glyph: function (body) { return BODIES[body] ? BODIES[body].glyph : ''; },

    /* dignity(body, sign) -> null | { state, label, traditional, possibility } */
    dignity: function (body, sign) {
      var t = DIGNITY[body]; if (!t || !sign) return null;
      var state = null;
      for (var i = 0; i < ORDER.length; i++) { if ((t[ORDER[i]] || []).indexOf(sign) !== -1) { state = ORDER[i]; break; } }
      if (!state) return null;
      var b = BODIES[body], s = SIGNS[sign], nrg = b ? b.energy : 'its nature';
      /* Phrasing note: every clause below keeps the body as the grammatical
         subject, because `energy` is a compound phrase for most bodies.
         “drive, desire, and assertion” cannot take a verb without disagreeing.
         Energy is always appended after a colon or preposition, never inflected. */
      var text = {
        rulership: body + ' rules ' + sign + '. This is one of its home signs, where the planet operates without translation. The sign asks for exactly what ' + body + ' already does: ' + nrg + '.',
        exaltation: body + ' is exalted in ' + sign + '. Not its own sign, but a guest treated well: the planet works through ' + (s ? s.quality : 'the sign\u2019s terms') + ' and gains a discipline it would not find alone, bringing ' + nrg + ' to a form that can hold it.',
        detriment: body + ' is in detriment in ' + sign + ', the sign opposite its rulership. The planet meets terms it did not set, and has to reach ' + nrg + ' indirectly.',
        fall: body + ' is in fall in ' + sign + ', opposite its exaltation. The sign gives the planet no natural support, so ' + body + ' has to build ' + nrg + ' here rather than assume it.'
      }[state];
      var poss = {
        rulership: 'You may find this part of you is difficult to resist once it is pointed at something. And hardest to moderate for the same reason.',
        exaltation: 'You may find this works best when it has a structure to move through, and feels oddly formal when it does not.',
        detriment: 'You may experience this as frustration, or as force diverted into channels that do not look like force at all.',
        fall: 'You may find this operates quietly, through others, or later than you expected. And is not absent, only unsupported.'
      }[state];
      var label = { rulership: 'Rulership', exaltation: 'Exaltation', detriment: 'Detriment', fall: 'Fall' }[state];
      return { state: state, label: label, traditional: text, possibility: poss,
        strong: state === 'rulership' || state === 'exaltation' };
    },

    /* Decan ruler filters. The decan ruler does not replace the sign, it filters
       it: the same placement, narrowed. One entry per classical planet, since the
       Chaldean decan sequence only uses the seven.                              */
    FILTERS: {
      'Mars':    { name: 'Mars', primary: 'intensifies direct action', gain: 'urgency and a competitive edge', asks: 'can the heat be aimed rather than spent?' },
      'Sun':     { name: 'the Sun', primary: 'centralises expression', gain: 'visibility and a need to be recognised for it', asks: 'can this also be seen?' },
      'Jupiter': { name: 'Jupiter', primary: 'expands the scope', gain: 'optimism and a reach toward meaning', asks: 'can it grow no faster than you can tend it?' },
      'Mercury': { name: 'Mercury', primary: 'sharpens the intellect', gain: 'adaptability and communicative power', asks: 'can it also be articulated?' },
      'Moon':    { name: 'the Moon', primary: 'deepens feeling', gain: 'responsiveness and a sense of tidal timing', asks: 'can it be felt without being governed by the feeling?' },
      'Saturn':  { name: 'Saturn', primary: 'structures the effort', gain: 'patience and long-term consequence', asks: 'can it be built to last?' },
      'Venus':   { name: 'Venus', primary: 'softens the approach', gain: 'harmony and relational beauty', asks: 'can it stay in relationship while it works?' }
    },
    decanFilter: function (ruler) {
      return PC.FILTERS[ruler] || { name: ruler, primary: 'colours the expression', gain: 'its own emphasis', asks: 'what does this add?' };
    },

    decan: function (sign, degInSign) {
      var s = SIGNS[sign]; if (!s) return null;
      var n = Math.min(3, Math.floor(Math.max(0, degInSign) / 10) + 1);
      var character = [
        'The opening decan carries the sign raw and unmixed. The quality before life has argued with it.',
        'The middle decan is the sign at work: the quality applied, tested, and made productive.',
        'The closing decan is the sign matured, and already leaning toward what follows it.'
      ][n - 1];
      var ruler = s.decans[n - 1], fl = PC.decanFilter(ruler);
      return { n: n, word: ordWord(n), ruler: ruler, rulerName: fl.name, filter: fl,
        range: ((n - 1) * 10) + '\u00b0, ' + (n * 10 - 1) + '\u00b0', character: character };
    },

    planetInSign: function (body, sign) {
      var name = nm(body);
      var b = BODIES[body], s = SIGNS[sign]; if (!b || !s) return '';
      return name + ' in ' + sign + ' ' + b.verb + ' ' + b.energy + ' ' + s.manner + '. ' + stripDot(s.demand) +
        ', so this part of you is not simply present. It is shaped: ' + s.quality + ' become the medium ' + name + ' has to work in.';
    },
    planetInHouse: function (body, house) {
      var name = nm(body);
      var b = BODIES[body], h = HOUSES[house - 1]; if (!b || !h) return '';
      return name + ' in the ' + ord(house) + ' house turns ' + b.energy + ' toward ' + h.arena + '. ' +
        h.asks + ' ' + h.presence;
    },
    signInHouse: function (sign, house) {
      var s = SIGNS[sign], h = HOUSES[house - 1]; if (!s || !h) return '';
      return 'With ' + sign + ' on this house, the arena is approached ' + s.manner + '. ' +
        stripDot(h.asks).replace(/^It asks/, 'The house asks') + '; ' + sign + ' answers with ' + s.quality + '.';
    },

    /* [SYNTHESIS]. Assembled here, from the layers above, and tagged as such. */
    synthesis: function (body, sign, house) {
      var name = nm(body);
      var b = BODIES[body], s = SIGNS[sign], h = HOUSES[house - 1];
      if (!b || !s || !h) return { synthesis: '', possibility: '' };
      var dig = PC.dignity(body, sign);
      var digClause = dig ? ' Traditionally ' + name + ' is in ' + low(dig.label) + ' here, so ' +
        (dig.strong ? 'the force arrives with the sign\u2019s backing.' : 'the force arrives having had to negotiate for it.') : '';
      return {
        synthesis: name + ' in ' + sign + ' in the ' + ord(house) + ' house concentrates ' + b.energy +
          ' in ' + h.arena + ', and insists it be handled ' + s.manner + '.' + digClause +
          ' Read as one sentence: what ' + name + ' wants, ' + sign + ' decides the manner of, and the ' + ord(house) +
          ' house decides where the bill comes due.',
        possibility: 'You may find this shows up most clearly around ' + h.arena + '. It may read least clearly when you are asked to be the opposite of ' +
          sign + '. Your own record over a year is better evidence than any of the above.'
      };
    },

    /* Four lists, drawn from body + sign + house so no two placements read alike. */
    workingWith: function (body, sign, house) {
      var name = nm(body);
      var b = BODIES[body], s = SIGNS[sign], h = HOUSES[house - 1];
      if (!b || !s || !h) return { strengths: [], challenges: [], opportunities: [], obstacles: [] };
      var dig = PC.dignity(body, sign);
      var strengths = [
        'You may find that you naturally ' + b.gifts[0] + '.',
        'You may find that you can ' + s.gift + ' when what is at stake is ' + h.arena.split(',')[0] + '.',
        'This placement tends to give ' + h.gift + ': unglamorous, and load-bearing.'
      ];
      if (b.gifts[2]) strengths.push('You may find that you ' + b.gifts[2] + ' without being asked.');
      if (dig && dig.strong) strengths.push('Traditionally ' + name + ' is well placed in ' + sign + ', so this is the part of the chart that asks least and delivers most.');
      var challenges = [
        'You may notice a tendency to ' + b.shadows[0] + '.',
        'You may notice that under pressure you ' + s.shadow + '.',
        'In this house the recurring cost is ' + h.shadow + '.'
      ];
      if (b.shadows[2]) challenges.push('You may notice you ' + b.shadows[2] + ' and call it something more flattering.');
      if (dig && !dig.strong) challenges.push('Traditionally ' + name + ' is uneasy in ' + sign + ': not weak, but working without the sign\u2019s help.');
      var opportunities = [
        'This placement invites you to ' + b.growth[0] + '.',
        'This placement invites you to ' + h.growth + '.'
      ];
      if (b.growth[1]) opportunities.push('This placement invites you to ' + b.growth[1] + '.');
      opportunities.push('There is room here to let ' + low(s.quality) + ' serve ' + h.arena.split(',')[0] + ' rather than run it.');
      var obstacles = [
        'You may encounter ' + b.blocks[0] + '.',
        'You may encounter ' + h.block + '.'
      ];
      if (b.blocks[1]) obstacles.push('You may encounter ' + b.blocks[1] + '.');
      obstacles.push('You may encounter your own fluency in ' + low(s.quality) + ': the strength arriving before the question has been asked.');
      return { strengths: strengths, challenges: challenges, opportunities: opportunities, obstacles: obstacles };
    },

    /* One call per placement. Returns tagged, ordered sections for the page. */
    build: function (o) {
      var body = keyFor(o.body), name = nm(body), sign = o.sign, house = o.house, degInSign = o.deg || 0;
      var b = BODIES[body]; if (!b) return null;
      var s = SIGNS[sign], h = HOUSES[house - 1], dec = PC.decan(sign, degInSign);
      var dig = PC.dignity(body, sign), syn = PC.synthesis(body, sign, house);
      var T = function (tag, text) { return { tag: tag, text: text }; };
      return {
        body: body, glyph: b.glyph, kind: b.kind,
        house: {
          heading: 'The ' + ord(house) + ' House',
          lines: [T('TRADITIONAL', h.definition), T('TRADITIONAL', h.inLife),
            T('POSSIBILITY', 'You may notice this house asking for attention in seasons rather than steadily. ' + h.asks + ' Your own record of the last year answers that better than any definition.')]
        },
        signInHouse: {
          heading: sign + ' in the ' + ord(house) + ' House',
          lines: [T('TRADITIONAL', s.definition), T('TRADITIONAL', PC.signInHouse(sign, house)),
            T('POSSIBILITY', 'You may recognise this as a reflex: when it comes to ' + h.arena.split(',')[0] + ', the ' + sign + ' answer arrives before you have chosen it.')]
        },
        planet: { heading: name, lines: [T('TRADITIONAL', b.definition), T('TRADITIONAL', b.role)] },
        planetInHouse: {
          heading: name + ' in the ' + ord(house) + ' House',
          lines: [T('TRADITIONAL', PC.planetInHouse(body, house)),
            T('POSSIBILITY', 'You may find yourself drawn to ' + h.arena + ' more often than you planned, and that what you bring to it is ' + low(b.energy) + '.')]
        },
        planetInSign: {
          heading: name + ' in ' + sign,
          lines: [T('TRADITIONAL', PC.planetInSign(body, sign))]
            .concat(dig ? [T('CALCULATED', name + ' at ' + Math.floor(degInSign) + '\u00b0 ' + sign + ' is in traditional ' + low(dig.label) + '.')] : [])
            .concat([T('POSSIBILITY', 'You may notice that when you act from here, the manner is ' + low(s.quality) + ' whether or not the situation invited it.')])
        },
        dignity: dig ? { heading: name + '\u2019s Condition', label: dig.label, strong: dig.strong,
          lines: [T('TRADITIONAL', dig.traditional), T('POSSIBILITY', dig.possibility)] } : null,
        synthesis: { heading: 'The Complete Picture', lines: [T('SYNTHESIS', syn.synthesis), T('POSSIBILITY', syn.possibility)] },
        working: PC.workingWith(body, sign, house),
        degree: {
          heading: Math.floor(degInSign) + '\u00b0 ' + sign,
          lines: [
            T('CALCULATED', Math.floor(degInSign) + '\u00b0 ' + sign + ' falls in the ' + dec.word + ' decan (' + dec.range + '), co-ruled by ' + dec.rulerName + '.'),
            T('TRADITIONAL', dec.character),
            T('TRADITIONAL', dec.rulerName.charAt(0).toUpperCase() + dec.rulerName.slice(1) + '\u2019s filter here ' + dec.filter.primary + '. What might otherwise run on ' + low(s.quality) +
              ' alone gains ' + dec.filter.gain + '. ' + dec.rulerName.charAt(0).toUpperCase() + dec.rulerName.slice(1) + ' asks: ' + dec.filter.asks),
            T('TRADITIONAL', name + ' at this degree is filtered twice. ' + sign + ' sets the manner, ' + dec.rulerName + ' sets the emphasis, and what reaches the ' + ord(house) +
              ' house is ' + low(b.energy) + ' narrowed by both.'),
            T('POSSIBILITY', 'You may find this reads as a narrower signature than ' + name + ' in ' + sign + ' alone: not the whole sign, but this ten-degree slice of it, showing up in ' + h.arena.split(',')[0] + '.')
          ]
        }
      };
    },
    ord: ord, ordWord: ordWord
  };

  window.PlacementContent = PC;
})();
