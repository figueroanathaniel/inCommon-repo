/* placement-content.js. Modular content engine for placement detail pages. V1.0.0

   WHY MODULAR: a placement is astral body × sign × house × degree. Enumerated, that is
   21 × 12 × 12 × 30 = ~90,000 texts. Nobody writes those, and text generated to
   fill that grid reads like filler. So this file holds SIX layers of real written
   material and composes them per request:

     1 bodies   21 entries. What the body is, its role, its gifts and shadows
     2 signs    12 entries. Definition, manner of operating, what it demands
     3 houses   12 entries. Arena, definition, what it asks of whoever lands there
     4 dignity  the traditional rulership/exaltation/detriment/fall table
     5 decans   per-sign decan rulers (Chaldean order) + decan character
     6 compose  astral body-in-sign, astral body-in-house, sign-in-house, synthesis, and the
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
    'Sun': { glyph: '\u2609', kind: 'astral body', energy: 'identity and conscious will',
      definition: 'The Sun is vitality, will, and the self that wants to be someone in particular. It is not personality but the thing personality is trying to express.',
      role: 'The Sun shows what you are here to become rather than what you already are, and where your energy renews itself.',
      verb: 'centres', gifts: ['hold a centre other people can locate', 'give warmth without being asked for it', 'know what you actually want when the room is undecided'],
      shadows: ['need the room to notice before something feels real', 'confuse being seen with being understood', 'burn through vitality proving a point'],
      growth: ['spend your warmth where it is received rather than where it is contested', 'let your identity be a practice rather than a verdict'],
      blocks: ['audiences that reward performance over substance', 'a self-image formed before you knew yourself'] },
    'Moon': { glyph: '\u263D', kind: 'astral body', energy: 'feeling, memory, and what soothes',
      definition: 'The Moon is feeling, memory, and need. It is the private weather under the public day, and the first place the body reacts before thought arrives.',
      role: 'The Moon shows what actually comforts you, what you return to under pressure, and the emotional habits laid down early.',
      verb: 'softens', gifts: ['read a room before anyone speaks', 'remember what people needed last time', 'self-soothe without needing anyone to arrive'],
      shadows: ['mistake a familiar feeling for a true one', 'withdraw before asking', 'tend everyone\u2019s weather but your own'],
      growth: ['name a need out loud while it is still small', 'let comfort change shape as you do'],
      blocks: ['an old comfort that no longer comforts', 'moods treated as facts rather than reports'] },
    'Mercury': { glyph: '\u263F', kind: 'astral body', energy: 'thought, language, and exchange',
      definition: 'Mercury is thinking, speech, and the traffic between minds. It governs how you take information in, sort it, and hand it back.',
      role: 'Mercury shows how you learn, what you notice first, and the shape your explanations take.',
      verb: 'articulates', gifts: ['find the sentence that makes a tangle legible', 'change your mind on new evidence', 'ask the question nobody framed'],
      shadows: ['talk past the point at which you knew', 'use precision as a way of not committing', 'mistake having words for having understanding'],
      growth: ['write down the thought you keep re-thinking', 'let silence carry part of the meaning'],
      blocks: ['a story about yourself repeated until it stopped being examined', 'rooms where speed is mistaken for intelligence'] },
    'Venus': { glyph: '\u2640', kind: 'astral body', energy: 'affection, taste, and worth',
      definition: 'Venus is attraction, value, and pleasure. It governs what you find beautiful, how you draw close, and what you believe you are worth.',
      role: 'Venus shows how you love, what you consider fair, and the terms on which you accept being cared for.',
      verb: 'harmonises', gifts: ['make people feel welcome without effort', 'know what is worth keeping', 'bring beauty to something purely functional'],
      shadows: ['keep the peace past the point of honesty', 'confuse being wanted with being valued', 'spend on the appearance of a life rather than the life'],
      growth: ['say the unlovely true thing to someone who can hold it', 'let your taste be yours rather than defensible'],
      blocks: ['a standard of worth borrowed from someone who did not love you well', 'pleasure postponed as though it were owed later'] },
    'Mars': { glyph: '\u2642', kind: 'astral body', energy: 'appetite, anger, and assertion',
      definition: 'Mars is action, appetite, and the will to assert. It is how you fight, how you pursue, and how you claim.',
      role: 'Mars shows where your initiative flows most naturally, how your anger behaves, and where conflict tends to find you.',
      verb: 'drives', gifts: ['start the thing while others are still deciding', 'stay in a difficult conversation', 'want something plainly enough to act on it'],
      shadows: ['spend force on the wrong target', 'read friction as proof of aliveness', 'let anger arrive as cold distance instead of speech'],
      growth: ['aim the heat rather than damping it', 'let a want be spoken before it becomes a demand'],
      blocks: ['a rule about anger set by someone else\u2019s temper', 'competition that is not actually a contest'] },
    'Jupiter': { glyph: '\u2643', kind: 'astral body', energy: 'growth, belief, and meaning',
      definition: 'Jupiter is expansion, faith, and the search for meaning. It governs where you widen, what you trust, and how you make sense of scale.',
      role: 'Jupiter shows where you grow easily, where you overreach, and what you take on faith.',
      verb: 'expands', gifts: ['see the larger frame while others fight the detail', 'give generously without keeping the ledger', 'stay hopeful with your eyes open'],
      shadows: ['promise at the size of your optimism', 'mistake a good story for a true one', 'expand past what you can actually tend'],
      growth: ['let a belief be tested rather than defended', 'choose depth once breadth has been had'],
      blocks: ['a conviction inherited and never examined', 'more open doors than hours'] },
    'Saturn': { glyph: '\u2644', kind: 'astral body', energy: 'structure, limit, and responsibility',
      definition: 'Saturn is limit, time, and consequence. It governs what must be built slowly and what will not be talked out of its price.',
      role: 'Saturn shows where you meet resistance, where mastery is available but only through repetition, and what you feel responsible for.',
      verb: 'disciplines', gifts: ['finish what stopped being interesting', 'hold a boundary without a speech', 'be the one who is actually reliable'],
      shadows: ['audit yourself in a voice you would not use on anyone else', 'call fear prudence', 'wait for qualification that never certifies itself'],
      growth: ['let sufficiency be a standard you can actually reach', 'build the small structure rather than plan the large one'],
      blocks: ['a standard set by someone who was never satisfied', 'a delay that has become a residence'] },
    'Uranus': { glyph: '\u2645', kind: 'astral body', energy: 'individuation and the break in the pattern',
      definition: 'Uranus is the break in the pattern. Sudden insight, deviation, the refusal to inherit a life unexamined.',
      role: 'Uranus shows where you cannot be standardised, and where change arrives faster than preparation.',
      verb: 'pursues', gifts: ['see the arrangement everyone stopped questioning', 'tolerate being the odd one', 'change your life in a week when it is warranted'],
      shadows: ['break something because it is intact', 'call restlessness freedom', 'leave before being known'],
      growth: ['stay long enough for a change to take root', 'let difference be a contribution rather than a position'],
      blocks: ['belonging treated as a threat', 'a reflex against structure, including your own'] },
    'Neptune': { glyph: '\u2646', kind: 'astral body', energy: 'longing and imagination',
      definition: 'Neptune dissolves the edges. Imagination, compassion, longing, and the pull toward something larger than the self.',
      role: 'Neptune shows where boundaries thin, where inspiration arrives unearned, and where you are most easily fooled.',
      verb: 'thins the edges of', gifts: ['feel what someone will not say', 'make something from almost nothing', 'forgive at scale'],
      shadows: ['soften a fact until it stops requiring action', 'merge until you cannot locate yourself', 'wait for rescue and call it faith'],
      growth: ['put the vision into a form that can be corrected', 'keep compassion and clear sight in the same hand'],
      blocks: ['a fog that arrives whenever a decision does', 'an ideal held close enough to obscure the actual' ] },
    'Pluto': { glyph: '\u2647', kind: 'astral body', energy: 'power and compulsion',
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
    'When astral bodies gather in your 1st House, you feel their presence directly. This is the house of self-presentation. An astral body here does not hide. It becomes part of how others recognise you and how you recognise yourself.',
    'When astral bodies occupy your 2nd House, they shape what you value and how you secure it. This is the terrain of earned worth. An astral body here asks: what do you build, and what builds you?',
    'When astral bodies move through your 3rd House, they colour how you speak, learn, and connect with your immediate world. This is the house of daily exchange. An astral body here shows up in conversations, short journeys, and the information you choose to carry.',
    'When astral bodies rest in your 4th House, they touch the foundation of your life. This is the house of home, heritage, and emotional ground. An astral body here shapes what shelters you and what you are called to shelter.',
    'When astral bodies shine in your 5th House, they ignite what you create for joy. This is the house of self-expression, romance, and play. An astral body here wants to be seen, felt, and celebrated.',
    'When astral bodies work in your 6th House, they shape your daily rhythms and how you tend to what needs doing. This is the house of craft, health, and useful labour. An astral body here shows up in your routines and your relationship to your own body.',
    'When astral bodies mirror in your 7th House, they reveal who stands across from you. This is the house of committed relationship and open opposition. An astral body here draws others in to teach you what you cannot learn alone.',
    'When astral bodies plunge into your 8th House, they enter the depths where surface life falls away. This is the house of shared resources, intimacy, and what must end to be remade. An astral body here does not skim. It asks for the truth.',
    'When astral bodies expand in your 9th House, they stretch your understanding of what is possible. This is the house of long journeys, higher learning, and belief. An astral body here calls you beyond the familiar.',
    'When astral bodies climb to your 10th House, they shape how you are known in the world. This is the house of vocation, reputation, and public life. An astral body here leaves a mark that outlasts the moment.',
    'When astral bodies gather in your 11th House, they weave you into the fabric of something larger. This is the house of friends, hopes, and collective future. An astral body here shows what you wish for and who wishes it with you.',
    'When astral bodies dissolve into your 12th House, they work below the level of conscious choice. This is the house of seclusion, undoing, and hidden strengths. An astral body here operates in dreams, in solitude, and in what you release.'
  ];
  var HOUSE_IN_LIFE = [
    'This is where your life becomes visible. An astral body in your 1st House does not stay hidden. It becomes part of your face to the world.',
    'This is where your values become tangible. An astral body in your 2nd House asks what you are willing to cultivate and what you need in order to feel secure.',
    'This is where your mind meets the world. An astral body in your 3rd House shapes how you speak, what you notice, and how you move through your daily environment.',
    'This is where your roots speak. An astral body in your 4th House touches what grounds you, what you come from, and what you need in order to feel at home.',
    'This is where your joy finds form. An astral body in your 5th House colours what you create, who you love, and what you do simply because it delights you.',
    'This is where your life finds its rhythm. An astral body in your 6th House shapes your daily work, your health, and how you serve what matters.',
    'This is where you meet the other. An astral body in your 7th House draws people toward you who mirror what you need to see in yourself.',
    'This is where surface gives way to depth. An astral body in your 8th House enters the territory of trust, shared power, and what transforms through contact.',
    'This is where your horizon expands. An astral body in your 9th House pulls you toward meaning, distance, and understanding that reorders what you thought you knew.',
    'This is where your path becomes public. An astral body in your 10th House shapes how you are remembered and what you build that outlasts you.',
    'This is where your individual life joins something collective. An astral body in your 11th House shows where your hopes align with others and what future you are willing to work toward.',
    'This is where the visible world thins. An astral body in your 12th House works in solitude, in surrender, and in the strengths you do not know you have until they are needed.'
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

  function ord(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }
  function ordWord(n) { return ['first', 'second', 'third'][n - 1] || String(n); }
  function low(s) { return String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1); }
  function stripDot(s) { return String(s || '').replace(/\.$/, ''); }

  var PC = {
    VERSION: '1.0.0',
    bodies: BODIES, signs: SIGNS, houses: HOUSES, dignityTable: DIGNITY,
    known: function (body) { return !!BODIES[body]; },
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
        rulership: body + ' rules ' + sign + '. This is one of its home signs, where the astral body operates without translation. The sign asks for exactly what ' + body + ' already does: ' + nrg + '.',
        exaltation: body + ' is exalted in ' + sign + '. Not its own sign, but a guest treated well: the astral body works through ' + (s ? s.quality : 'the sign\u2019s terms') + ' and gains a discipline it would not find alone, bringing ' + nrg + ' to a form that can hold it.',
        detriment: body + ' is in detriment in ' + sign + ', the sign opposite its rulership. The astral body meets terms it did not set, and has to reach ' + nrg + ' indirectly.',
        fall: body + ' is in fall in ' + sign + ', opposite its exaltation. The sign gives the astral body no natural support, so ' + body + ' has to build ' + nrg + ' here rather than assume it.'
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
       it: the same placement, narrowed. One entry per classical astral body, since the
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

    astralBodyInSign: function (body, sign) {
      var b = BODIES[body], s = SIGNS[sign]; if (!b || !s) return '';
      return body + ' in ' + sign + ' ' + b.verb + ' ' + b.energy + ' ' + s.manner + '. ' + stripDot(s.demand) +
        ', so this part of you is not simply present. It is shaped: ' + s.quality + ' become the medium ' + body + ' has to work in.';
    },
    astralBodyInHouse: function (body, house) {
      var b = BODIES[body], h = HOUSES[house - 1]; if (!b || !h) return '';
      return body + ' in the ' + ord(house) + ' house turns ' + b.energy + ' toward ' + h.arena + '. ' +
        h.asks + ' ' + h.presence;
    },
    signInHouse: function (sign, house) {
      var s = SIGNS[sign], h = HOUSES[house - 1]; if (!s || !h) return '';
      return 'With ' + sign + ' on this house, the arena is approached ' + s.manner + '. ' +
        stripDot(h.asks).replace(/^It asks/, 'The house asks') + '; ' + sign + ' answers with ' + s.quality + '.';
    },

    /* [SYNTHESIS]. Assembled here, from the layers above, and tagged as such. */
    synthesis: function (body, sign, house) {
      var b = BODIES[body], s = SIGNS[sign], h = HOUSES[house - 1];
      if (!b || !s || !h) return { synthesis: '', possibility: '' };
      var dig = PC.dignity(body, sign);
      var digClause = dig ? ' Traditionally ' + body + ' is in ' + low(dig.label) + ' here, so ' +
        (dig.strong ? 'the force arrives with the sign\u2019s backing.' : 'the force arrives having had to negotiate for it.') : '';
      return {
        synthesis: body + ' in ' + sign + ' in the ' + ord(house) + ' house concentrates ' + b.energy +
          ' in ' + h.arena + ', and insists it be handled ' + s.manner + '.' + digClause +
          ' Read as one sentence: what ' + body + ' wants, ' + sign + ' decides the manner of, and the ' + ord(house) +
          ' house decides where the bill comes due.',
        possibility: 'You may find this shows up most clearly around ' + h.arena + '. It may read least clearly when you are asked to be the opposite of ' +
          sign + '. Your own record over a year is better evidence than any of the above.'
      };
    },

    /* Four lists, drawn from body + sign + house so no two placements read alike. */
    workingWith: function (body, sign, house) {
      var b = BODIES[body], s = SIGNS[sign], h = HOUSES[house - 1];
      if (!b || !s || !h) return { strengths: [], challenges: [], opportunities: [], obstacles: [] };
      var dig = PC.dignity(body, sign);
      var strengths = [
        'You may find that you naturally ' + b.gifts[0] + '.',
        'You may find that you can ' + s.gift + ' when what is at stake is ' + h.arena.split(',')[0] + '.',
        'This placement tends to give ' + h.gift + ': unglamorous, and load-bearing.'
      ];
      if (b.gifts[2]) strengths.push('You may find that you ' + b.gifts[2] + ' without being asked.');
      if (dig && dig.strong) strengths.push('Traditionally ' + body + ' is well placed in ' + sign + ', so this is the part of the chart that asks least and delivers most.');
      var challenges = [
        'You may notice a tendency to ' + b.shadows[0] + '.',
        'You may notice that under pressure you ' + s.shadow + '.',
        'In this house the recurring cost is ' + h.shadow + '.'
      ];
      if (b.shadows[2]) challenges.push('You may notice you ' + b.shadows[2] + ' and call it something more flattering.');
      if (dig && !dig.strong) challenges.push('Traditionally ' + body + ' is uneasy in ' + sign + ': not weak, but working without the sign\u2019s help.');
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
      var body = o.body, sign = o.sign, house = o.house, degInSign = o.deg || 0;
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
        astralBody: { heading: body, lines: [T('TRADITIONAL', b.definition), T('TRADITIONAL', b.role)] },
        astralBodyInHouse: {
          heading: body + ' in the ' + ord(house) + ' House',
          lines: [T('TRADITIONAL', PC.astralBodyInHouse(body, house)),
            T('POSSIBILITY', 'You may find yourself drawn to ' + h.arena + ' more often than you planned, and that what you bring to it is ' + low(b.energy) + '.')]
        },
        astralBodyInSign: {
          heading: body + ' in ' + sign,
          lines: [T('TRADITIONAL', PC.astralBodyInSign(body, sign))]
            .concat(dig ? [T('CALCULATED', body + ' at ' + Math.floor(degInSign) + '\u00b0 ' + sign + ' is in traditional ' + low(dig.label) + '.')] : [])
            .concat([T('POSSIBILITY', 'You may notice that when you act from here, the manner is ' + low(s.quality) + ' whether or not the situation invited it.')])
        },
        dignity: dig ? { heading: body + '\u2019s Condition', label: dig.label, strong: dig.strong,
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
            T('TRADITIONAL', body + ' at this degree is filtered twice. ' + sign + ' sets the manner, ' + dec.rulerName + ' sets the emphasis, and what reaches the ' + ord(house) +
              ' house is ' + low(b.energy) + ' narrowed by both.'),
            T('POSSIBILITY', 'You may find this reads as a narrower signature than ' + body + ' in ' + sign + ' alone: not the whole sign, but this ten-degree slice of it, showing up in ' + h.arena.split(',')[0] + '.')
          ]
        }
      };
    },
    ord: ord, ordWord: ordWord
  };

  window.PlacementContent = PC;
})();
