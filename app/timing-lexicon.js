/* timing-lexicon.js. The inCommon Timing Lexicon. V1.0.0

   Interpretation layer. Original writing for inCommon, keyed by what the
   mechanics layer returns: a moving body, an aspect and a natal point; a gate
   and a line; a number and the role it plays. It computes no positions and
   reads no ephemeris, so the same text serves any date and any chart.

   WHY IT IS BUILT IN LAYERS. Every transit is a mover, an angle and a place in
   the chart, and every one of those three changes what a reader is owed.
   Twelve movers, five aspects and sixteen natal points are 960 contacts. Each
   contact is read from three pieces written for it: what this mover does at
   this angle, what this mover does to this point, and a question for this
   point and this kind of contact. No two contacts share all three, so no two
   readings are the same, and nothing is a template with a word swapped in.

   Gates are read the same way: what the gate carries while a body holds it,
   how it lands in a chart that carries the gate and in one that does not, what
   the line adds, and what completes when a transit closes a channel. Numbers
   are read by role, because a 5 as the day and a 5 as the Life Path are not
   the same sentence.

   House rules, all of them enforced by tools/check-timing-lexicon.js: no dash
   of either kind, no sentence that tells a reader who they are, no rating of
   any kind, the word astral body where a reader would otherwise meet planet,
   and no question that answers itself. A question here is one only the reader
   can close.                                                                 */
(function () {
  'use strict';

  var MOVERS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node'];
  var ASPECTS = ['conjunct', 'sextile', 'square', 'trine', 'opposite'];
  var TARGETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node', 'Ascendant', 'Midheaven', 'Descendant', 'IC'];

  /* How long a contact from each mover tends to stay live. */
  var PACE = {
    'Sun': 'a day or two either side of exact',
    'Moon': 'a matter of hours',
    'Mercury': 'a few days, longer when it turns back on itself',
    'Venus': 'the better part of a week',
    'Mars': 'about a week, and weeks when it slows to turn',
    'Jupiter': 'several weeks, sometimes in three passes',
    'Saturn': 'months, usually in three passes',
    'Uranus': 'a year or more, arriving in waves',
    'Neptune': 'a year or more, slow enough to be mistaken for mood',
    'Pluto': 'two years or longer',
    'North Node': 'a couple of months',
    'South Node': 'a couple of months'
  };

  /* WHAT THIS MOVER DOES AT THIS ANGLE. Sixty entries, each written for its
     pair. The angle is the shape of the contact; the mover is its character. */
  var MOVE = {
    'Sun': {
      conjunct: 'The Sun comes back to a single point in the chart and lights it from inside. For a day or two whatever lives there wants to be seen doing its work rather than talked about.',
      sextile: 'At sixty degrees the Sun offers a side door: a little more visibility to anything deliberately put in front of it. Nothing arrives unasked, so the opening is as wide as the effort brought to it.',
      square: 'At ninety degrees the Sun presses on a habit the way strong light shows dust on a shelf. The friction is brief and useful, because it names what has been running without supervision.',
      trine: 'The Sun in trine is easy daylight, and what it touches works without much pushing. The only waste is an easy day spent on nothing, so pick one thing to carry forward while the light holds.',
      opposite: 'Opposite, the Sun shines from across the room, usually through another person. Their view becomes the mirror for a day or two, and a mirror is information rather than a verdict.'
    },
    'Moon': {
      conjunct: 'The Moon sits on the point for a few hours and the feeling stored there rises. Mood moves faster than plans today, so notice it before acting on it.',
      sextile: 'A sextile from the Moon is a small warm current, gone by evening. It favours the ordinary: a meal shared, a message answered, a kindness that costs nothing.',
      square: 'The Moon square is a passing itch, an irritation measured in hours. Treat it as weather to wait out rather than a reason to rearrange anything.',
      trine: 'With the Moon in trine, comfort comes without asking for an afternoon. It is a soft window for rest, for care given or received, and for letting a pleasant feeling stay pleasant.',
      opposite: 'Opposite, the Moon sets two sets of needs across from each other for a few hours. Someone else may set the mood, and naming your own gently keeps the scales level.'
    },
    'Mercury': {
      conjunct: 'Mercury crossing the point turns up the chatter about it: lists, messages, second thoughts. Ideas arrive quickly and leave as quickly, so catch them on paper.',
      sextile: 'Mercury at sixty degrees opens a clean line for useful talk. A question asked now tends to get a straight answer, and small paperwork goes through without fuss.',
      square: 'Mercury square brings crossed wires: a tone misread, a detail out of place, a plan that wants a second draft. Slow the sentence down and read the figure twice.',
      trine: 'Mercury in trine lets words fit their purpose. Explaining, bargaining and learning all go more smoothly than usual, which makes it a good few days to say the thing plainly.',
      opposite: 'With Mercury opposite, a conversation has two ends and each holds part of the point. Listening first saves an argument that would only prove both sides half right.'
    },
    'Venus': {
      conjunct: 'Venus on the point softens it and makes it attractive, inwardly and outwardly. Pleasure, affection and spending all lean toward that part of the chart for a few days.',
      sextile: 'Venus at sixty degrees offers a light social opening: an invitation, a reconciliation, a purchase that feels right. Saying yes to small pleasures is enough to use it.',
      square: 'Venus square asks what something is really worth, in affection or in money. A craving or a flicker of envy may surface, pointing at a value being renegotiated.',
      trine: 'Venus in trine lets ease and appreciation run freely. Company feels cooperative and beauty is easier to notice, which makes this a kind window for mending or making.',
      opposite: 'Opposite, Venus brings attraction and agreement through someone else. What each side wants sits across the table, and the meeting point is usually a fair trade.'
    },
    'Mars': {
      conjunct: 'Mars landing on the point brings heat and drive for several days. Energy runs high and patience runs low, which suits starting, lifting and deciding better than waiting.',
      sextile: 'A Mars sextile hands over a measured dose of initiative. Effort turns into progress with less resistance than usual, so the postponed task is the one to pick up.',
      square: 'Mars square is friction with fuel in it: impatience, a short fuse, a shove against a limit. Spending the charge on something physical keeps it from landing on people.',
      trine: 'Mars in trine makes effort feel natural. Work gets done, the body moves well, and courage costs less than usual, so spend it on whatever needs nerve.',
      opposite: 'With Mars opposite, another person\u2019s drive meets yours head on. A disagreement or a contest is likely, and it can sharpen both sides if neither insists on winning outright.'
    },
    'Jupiter': {
      conjunct: 'Jupiter on the point widens it for weeks: more room, more opportunity, more appetite. The opening is real, and so is the urge to take on too much of it at once.',
      sextile: 'Jupiter at sixty degrees is a door left ajar. Opportunities appear when they are looked for, and a modest step toward one is answered generously.',
      square: 'Jupiter square inflates: promises outgrow the calendar and hope outruns the budget. The growth is genuine, so the real work is choosing what deserves it.',
      trine: 'Jupiter in trine is the quiet kind of good fortune, circumstances leaning your way. It favours study, travel and generosity, and it rewards use over waiting.',
      opposite: 'Opposite, Jupiter brings growth through other people: a teacher, a partner, an offer from outside. The question is whether the larger thing fits the life it is meant for.'
    },
    'Saturn': {
      conjunct: 'Saturn sits on the point for a season and asks it to prove itself. What is built here now is built to last, and shortcuts tend to be noticed and sent back.',
      sextile: 'A Saturn sextile rewards steady, unglamorous effort. Structure, discipline and sound advice are within reach, and a commitment made now can hold for years.',
      square: 'Saturn square is a checkpoint: a delay, a limit, a responsibility that will not be postponed. It is slow and testing, and what survives it has usually earned its place.',
      trine: 'Saturn in trine lends support to patience. Plans settle into place, institutions and older hands are helpful, and plain consistency produces results that can be seen.',
      opposite: 'Opposite, Saturn puts the weight across the table: an authority, a contract, a partner asking for accountability. It is a season for honest terms rather than hopeful ones.'
    },
    'Uranus': {
      conjunct: 'Uranus on the point loosens whatever was fixed there, often abruptly. A break, a new freedom or a change of plan arrives, and resisting it usually costs more than following it.',
      sextile: 'A Uranus sextile brings a welcome surprise: an idea, a connection, a fresh way through an old routine. Small experiments are favoured over sweeping overhauls.',
      square: 'Uranus square shakes things loose against the grain. Restlessness, disruption and sudden news are typical, and they tend to reveal where life had grown too tight.',
      trine: 'Uranus in trine makes change feel exciting rather than threatening. Invention comes easily, and a long-held routine can be updated without any drama.',
      opposite: 'Opposite, Uranus delivers the unexpected through others: a partner\u2019s surprise, a sudden offer, a door opened or shut from the other side. Flexibility serves better than control.'
    },
    'Neptune': {
      conjunct: 'Neptune dissolves into the point and blurs its edges for a long stretch. Inspiration and confusion arrive together, and clarity comes back slowly, so patience with not knowing helps.',
      sextile: 'A Neptune sextile sweetens imagination and compassion. Art, music, rest and quiet kindness all come more easily, and a hunch deserves a hearing.',
      square: 'Neptune square fogs the picture: unclear motives, missing facts, hopes in need of checking. It is a time to verify before committing and to sleep more than usual.',
      trine: 'Neptune in trine opens a gentle channel to the imagination. Creative and devotional pursuits flow, and a softer, more forgiving view of things becomes available.',
      opposite: 'Opposite, Neptune wraps another person or situation in haze. Idealising someone, or being idealised, is the real risk, and seeing them plainly is the kindness.'
    },
    'Pluto': {
      conjunct: 'Pluto on the point works slowly and thoroughly over years. Something here is being remade from the root, and whatever it has outgrown is unlikely to return.',
      sextile: 'A Pluto sextile offers depth by consent: a chance to change something on purpose rather than under pressure. Research, therapy and honest reckonings bear fruit.',
      square: 'Pluto square applies pressure that does not ease until something gives. Struggles over control and buried matters surface, and the change it asks for is structural.',
      trine: 'Pluto in trine supports real transformation without a crisis attached. Old habits can be released, and influence or resources can grow through steady, unseen effort.',
      opposite: 'Opposite, Pluto brings intensity through others: a powerful person, a deep bond, a situation that demands a shift. It can be confronting, and it can be freeing.'
    },
    'North Node': {
      conjunct: 'The North Node crossing the point marks a direction worth growing toward. Unfamiliar experience in this area tends to feel awkward and right at the same time.',
      sextile: 'A North Node sextile makes growth accessible in small pieces: modest chances to try a new direction. Taking one is usually enough to feel which way it leans.',
      square: 'With the Nodes square the point, it stands at a crossroads between old habit and new direction. Neither road is wrong, and the tension shows what each one costs.',
      trine: 'With the North Node in trine, the new direction cooperates with what already works. Growth feels natural rather than forced, and it rarely announces itself.',
      opposite: 'The North Node opposite puts the South Node on this point, so a familiar pattern is up for review. Something comfortable may be ready to be set down.'
    },
    'South Node': {
      conjunct: 'The South Node on the point draws out the familiar: old skills, old reflexes, people from before. Use what is known, and notice what has quietly run its course.',
      sextile: 'A South Node sextile lets an old talent come back into service without effort. Experience is an asset this season, as long as it serves something present.',
      square: 'The South Node squares the point from the far side of the crossroads. Habit pulls one way and growth the other, and the friction makes the choice visible.',
      trine: 'With the South Node in trine, past experience props up the present without being asked. It feels comfortable, and comfort is worth enjoying while staying curious.',
      opposite: 'The South Node opposite places the North Node on this point: an invitation to grow here by leaving something older behind. The pull forward is quiet and persistent.'
    }
  };

  /* WHAT THIS MOVER DOES TO THIS POINT. One hundred and ninety two entries.
     Where a mover meets its own natal place the sentence names the return or
     the cycle it belongs to, because that is the fact a reader most needs. */
  var MEET = {
    'Sun': {
      'Sun': 'The Sun back on its own degree begins a new personal year, a natural moment to say what the next twelve months are for.',
      'Moon': 'Light falling on the natal Moon brings needs into plain view, where they can be tended rather than guessed at.',
      'Mercury': 'With the Sun on natal Mercury, thinking wants an audience; it suits presenting an idea or finishing the draft.',
      'Venus': 'The Sun warming natal Venus makes pleasure easier to admit and affection easier to show.',
      'Mars': 'Sunlight on natal Mars restarts a stalled effort and lends will to whatever has been waiting on nerve.',
      'Jupiter': 'The Sun across natal Jupiter enlarges hope, and a generous plan looks more possible than it did a month ago.',
      'Saturn': 'Light on natal Saturn shows the exact outline of a duty, and meeting it well leaves a dry, durable satisfaction.',
      'Uranus': 'The Sun touching natal Uranus wakes the appetite for independence, and the unconventional option starts to look like common sense.',
      'Neptune': 'The Sun on natal Neptune illuminates a longing, and it is worth telling the vision apart from the wish.',
      'Pluto': 'With the Sun on natal Pluto a buried motive rises, and naming it honestly hands its power back.',
      'North Node': 'The Sun lighting the North Node points along the road ahead, and a step in that direction feels oddly natural.',
      'South Node': 'The Sun on the South Node throws light on inherited habits and shows which ones still earn their keep.',
      'Ascendant': 'The Sun crossing the Ascendant raises visibility, and a first impression carries further than usual.',
      'Midheaven': 'At the Midheaven the Sun puts work and reputation under the lamp, which favours a public move.',
      'Descendant': 'At the Descendant the Sun turns the day toward partners, and one to one conversations decide more than group ones.',
      'IC': 'At the IC the Sun lights the foundations: home, family and the private self ask for some care.'
    },
    'Moon': {
      'Sun': 'The Moon passing the natal Sun lets feeling and purpose line up for a few hours, an easy moment for a monthly check in.',
      'Moon': 'The Moon returning to its natal place opens a fresh monthly round of mood; tonight shows what comfort actually requires.',
      'Mercury': 'With the Moon on natal Mercury thoughts take on emotional colour, and a message sent now carries feeling more than fact.',
      'Venus': 'The Moon brushing natal Venus brings a tender, sociable few hours suited to small pleasures and easy company.',
      'Mars': 'The Moon on natal Mars quickens the pulse; reaction comes before reflection, so a pause is cheap insurance.',
      'Jupiter': 'The Moon across natal Jupiter lifts the spirits and loosens the purse, and generosity comes naturally for an evening.',
      'Saturn': 'The Moon touching natal Saturn can bring a heavier hour, a reminder of duty that eases once it is acknowledged.',
      'Uranus': 'The Moon on natal Uranus stirs restlessness for a few hours, and a spontaneous change of plan is likely.',
      'Neptune': 'The Moon on natal Neptune softens the day\u2019s edges; music, daydreams and long baths are close at hand.',
      'Pluto': 'With the Moon on natal Pluto a strong feeling surfaces briefly, and its strength says something about what matters.',
      'North Node': 'The Moon on the North Node brings a passing sense of direction, a feeling about where life wants to lean.',
      'South Node': 'The Moon on the South Node stirs nostalgia and old reflexes, which are comforting and worth watching.',
      'Ascendant': 'The Moon crossing the Ascendant puts feeling on the face, and others read the mood easily for a few hours.',
      'Midheaven': 'The Moon at the Midheaven makes public life emotional for a while, and reactions at work get noticed.',
      'Descendant': 'The Moon at the Descendant draws attention to what others need, and closeness is easy to offer.',
      'IC': 'The Moon at the IC turns the heart homeward, a natural evening to rest, cook, or call family.'
    },
    'Mercury': {
      'Sun': 'Mercury meeting the natal Sun puts purpose into words, a good time to explain what the work is actually for.',
      'Moon': 'Mercury on the natal Moon makes feelings easier to talk about, and a conversation can settle an unspoken worry.',
      'Mercury': 'Mercury returning to its own place resets the mind\u2019s habits, inviting a fresh look at how learning and deciding happen.',
      'Venus': 'Mercury on natal Venus favours graceful words: a compliment, an apology, a conversation about money.',
      'Mars': 'Mercury on natal Mars sharpens speech; arguments come quickly, and so does the chance to say a hard thing well.',
      'Jupiter': 'Mercury across natal Jupiter broadens thinking, and plans for study, writing or travel come easily.',
      'Saturn': 'Mercury on natal Saturn asks for careful thought and exact words, and serious paperwork goes well with patience.',
      'Uranus': 'Mercury on natal Uranus brings sudden ideas and unusual news, and the mind runs ahead of the conversation.',
      'Neptune': 'Mercury on natal Neptune blurs facts and feeds imagination: fine for poetry, risky for contracts.',
      'Pluto': 'Mercury on natal Pluto drives the mind toward what is hidden: research, investigation, frank talk about who decides.',
      'North Node': 'Mercury on the North Node brings information that points forward, often a new subject worth learning.',
      'South Node': 'Mercury on the South Node revisits old ideas and old conversations, sometimes with a useful correction.',
      'Ascendant': 'Mercury crossing the Ascendant makes the manner curious and talkative, and phrasing shapes how one is seen.',
      'Midheaven': 'Mercury at the Midheaven brings professional communication forward: the email, the pitch, the call that counts.',
      'Descendant': 'Mercury at the Descendant centres the week on dialogue with a partner or client, and terms come into focus.',
      'IC': 'Mercury at the IC brings household talk and domestic logistics, and family news may arrive.'
    },
    'Venus': {
      'Sun': 'Venus meeting the natal Sun brings charm and appreciation, a good few days to be seen at ease.',
      'Moon': 'Venus on the natal Moon lets comfort and affection flow, and home life feels gentler.',
      'Mercury': 'Venus on natal Mercury softens speech, and tactful words and pleasant letters come easily.',
      'Venus': 'Venus returning to its own place, close to once a year, renews the sense of what is beautiful and worth having.',
      'Mars': 'Venus on natal Mars stirs desire and attraction, and creative or romantic initiative is well received.',
      'Jupiter': 'Venus across natal Jupiter brings celebration and generosity, and sometimes a bill to match.',
      'Saturn': 'Venus on natal Saturn asks for commitment in love or money, and steady affection is prized over sparkle.',
      'Uranus': 'Venus on natal Uranus brings a sudden attraction or a new taste, and the unusual choice feels exciting.',
      'Neptune': 'Venus on natal Neptune heightens romance and artistic longing; idealising is easy, so look twice.',
      'Pluto': 'Venus on natal Pluto deepens attraction until it feels fated, and a bond may ask for more than it first appears to.',
      'North Node': 'Venus on the North Node draws in relationships or pleasures that point toward growth.',
      'South Node': 'Venus on the South Node revives old affections and familiar comforts, worth enjoying without clinging.',
      'Ascendant': 'Venus crossing the Ascendant adds grace to the way one arrives, and people respond warmly.',
      'Midheaven': 'Venus at the Midheaven brings favour at work, where diplomacy and presentation open doors.',
      'Descendant': 'Venus at the Descendant smiles on partnership, and agreements of the heart or of business go smoothly.',
      'IC': 'Venus at the IC brings beauty into the home, a fine time to make a room more welcoming.'
    },
    'Mars': {
      'Sun': 'Mars meeting the natal Sun adds vigour and nerve, and a bold move toward a goal is well supported.',
      'Moon': 'Mars on the natal Moon heats the emotions; protectiveness and irritability both run high.',
      'Mercury': 'Mars on natal Mercury speeds thought and speech; debate is lively and words can cut, so choose them.',
      'Venus': 'Mars on natal Venus ignites passion, and going after what is wanted feels urgent.',
      'Mars': 'Mars returning to its own place, about every two years, restarts the cycle of drive: time to choose the next campaign.',
      'Jupiter': 'Mars across natal Jupiter fuels ambition and confidence, and a large effort can produce a large result.',
      'Saturn': 'Mars on natal Saturn is effort meeting resistance, and progress comes through discipline rather than force.',
      'Uranus': 'Mars on natal Uranus brings sudden bursts of energy and impatience with limits; quick decisions carry risk.',
      'Neptune': 'Mars on natal Neptune can blur motive, so energy goes further in inspired or compassionate work.',
      'Pluto': 'Mars on natal Pluto intensifies will; determination is formidable, and so is the pull toward a power struggle.',
      'North Node': 'Mars on the North Node pushes toward new territory, and the first step costs less than expected.',
      'South Node': 'Mars on the South Node can reignite an old quarrel or an old habit, worth meeting with fresh eyes.',
      'Ascendant': 'Mars crossing the Ascendant sharpens the edge of the personality, and physical activity is favoured.',
      'Midheaven': 'Mars at the Midheaven drives ambition at work, and competitive situations heat up.',
      'Descendant': 'Mars at the Descendant puts energy into partnerships, through cooperation or through conflict.',
      'IC': 'Mars at the IC stirs activity at home: repairs, a move, or a family tension that needs airing.'
    },
    'Jupiter': {
      'Sun': 'Jupiter meeting the natal Sun, once in twelve years, expands confidence and purpose; a season to aim higher.',
      'Moon': 'Jupiter on the natal Moon brings emotional generosity and growth at home, sometimes a larger household.',
      'Mercury': 'Jupiter on natal Mercury enlarges thinking: study, publishing, plans for travel, big conversations.',
      'Venus': 'Jupiter on natal Venus multiplies pleasure and affection, and social or financial luck is likely.',
      'Mars': 'Jupiter on natal Mars boosts stamina and courage, ideal for an ambitious project or an athletic goal.',
      'Jupiter': 'Jupiter returning to its own place, about every twelve years, opens a new cycle of growth and belief.',
      'Saturn': 'Jupiter on natal Saturn lets expansion meet structure, and a long effort can finally pay out.',
      'Uranus': 'Jupiter on natal Uranus brings unexpected openings and a wider field of freedom.',
      'Neptune': 'Jupiter on natal Neptune enlarges dreams and spiritual hunger; inspiration flows and discernment matters.',
      'Pluto': 'Jupiter on natal Pluto amplifies influence and resources, backing a transformation that was already under way.',
      'North Node': 'Jupiter on the North Node widens the road ahead, and growth in a new direction gets help.',
      'South Node': 'Jupiter on the South Node enlarges familiar strengths, and old skills find a new market.',
      'Ascendant': 'Jupiter crossing the Ascendant brings optimism and visibility, and a new personal chapter opens.',
      'Midheaven': 'Jupiter at the Midheaven favours advancement and recognition, a high point for public standing.',
      'Descendant': 'Jupiter at the Descendant brings beneficial partnerships, and generous people walk in.',
      'IC': 'Jupiter at the IC expands home and family, a good time for a move or a renovation.'
    },
    'Saturn': {
      'Sun': 'Saturn meeting the natal Sun tests identity and purpose, a season to commit to what genuinely matters.',
      'Moon': 'Saturn on the natal Moon brings emotional seriousness and duty at home, and self care becomes a discipline.',
      'Mercury': 'Saturn on natal Mercury asks for disciplined thinking and careful speech, and study deepens.',
      'Venus': 'Saturn on natal Venus tests love and values; committed bonds strengthen and thin ones strain.',
      'Mars': 'Saturn on natal Mars slows action and asks for patience, so effort has to be steady and strategic.',
      'Jupiter': 'Saturn on natal Jupiter sobers optimism, and growth has to rest on a realistic plan.',
      'Saturn': 'Saturn meeting its own natal place marks the great checkpoints of adulthood: the returns near 29 and 58, the squares and the opposition between.',
      'Uranus': 'Saturn on natal Uranus sets stability against freedom, and some structure has to change shape.',
      'Neptune': 'Saturn on natal Neptune grounds dreams, testing which ideals can be made real.',
      'Pluto': 'Saturn on natal Pluto asks for accountability around power, and deep structures are rebuilt.',
      'North Node': 'Saturn on the North Node asks for real commitment to the path ahead.',
      'South Node': 'Saturn on the South Node brings an old pattern to an end and closes a chapter responsibly.',
      'Ascendant': 'Saturn crossing the Ascendant begins a serious, defining phase, and the way one carries oneself grows more deliberate.',
      'Midheaven': 'Saturn at the Midheaven marks a career summit or a career test, where reputation reflects long effort.',
      'Descendant': 'Saturn at the Descendant tests partnerships, and commitments are formalised or released.',
      'IC': 'Saturn at the IC brings responsibility at home and with family, and foundations are relaid.'
    },
    'Uranus': {
      'Sun': 'Uranus meeting the natal Sun is an awakening of identity, often a once in a lifetime break toward a freer self.',
      'Moon': 'Uranus on the natal Moon unsettles home and emotional habits, sometimes through a sudden change of household.',
      'Mercury': 'Uranus on natal Mercury electrifies the mind: new ideas, new tools, abrupt news.',
      'Venus': 'Uranus on natal Venus disrupts love and taste, bringing a sudden attraction or a need for space.',
      'Mars': 'Uranus on natal Mars brings bursts of energy and rebellion; act boldly, and act safely.',
      'Jupiter': 'Uranus on natal Jupiter brings unexpected opportunity and a sudden widening of what seems possible.',
      'Saturn': 'Uranus on natal Saturn breaks rigid structures and frees one from obligations that had outlived their reason.',
      'Uranus': 'Uranus meeting its own natal place marks the turns of independence: the square near 21, the opposition near 42, the return near 84.',
      'Neptune': 'Uranus on natal Neptune shakes ideals awake, and inspiration may arrive all at once.',
      'Pluto': 'Uranus on natal Pluto triggers sudden release, as pressure that built for years finds an outlet.',
      'North Node': 'Uranus on the North Node jolts life toward a new direction without much warning.',
      'South Node': 'Uranus on the South Node breaks an old pattern suddenly, freeing what was stuck.',
      'Ascendant': 'Uranus crossing the Ascendant changes appearance and approach, often as a sudden reinvention.',
      'Midheaven': 'Uranus at the Midheaven brings career changes and unexpected public shifts.',
      'Descendant': 'Uranus at the Descendant shakes up partnership, with abrupt beginnings or endings.',
      'IC': 'Uranus at the IC disrupts home life, often through a move or a change in who lives there.'
    },
    'Neptune': {
      'Sun': 'Neptune on the natal Sun loosens an old identity, opening a creative or devotional chapter with soft edges.',
      'Moon': 'Neptune on the natal Moon heightens sensitivity, and emotional boundaries grow porous.',
      'Mercury': 'Neptune on natal Mercury favours imagination over logic, so check the facts twice.',
      'Venus': 'Neptune on natal Venus brings romantic idealism, and love and money both want a clear look.',
      'Mars': 'Neptune on natal Mars lowers the drive, and energy goes further in inspired or compassionate action.',
      'Jupiter': 'Neptune on natal Jupiter expands faith and imagination, with a tendency to promise more than the week holds.',
      'Saturn': 'Neptune on natal Saturn dissolves rigid structures and leaves old ambitions open to question.',
      'Uranus': 'Neptune on natal Uranus spiritualises the urge for freedom, and ideals quietly shift.',
      'Neptune': 'Neptune meeting its own natal place marks slow tides of meaning, the square in the early forties above all, when dream and disillusion meet.',
      'Pluto': 'Neptune on natal Pluto stirs deep currents, and psychological change happens below the surface.',
      'North Node': 'Neptune on the North Node blurs the way forward, inviting trust in intuition over maps.',
      'South Node': 'Neptune on the South Node dissolves old attachments without a fight.',
      'Ascendant': 'Neptune crossing the Ascendant softens and blurs the outline one presents.',
      'Midheaven': 'Neptune at the Midheaven brings uncertainty at work, or a calling toward creative or healing work.',
      'Descendant': 'Neptune at the Descendant idealises partners, so see them clearly.',
      'IC': 'Neptune at the IC blurs home life, surfacing family secrets or a dream of a different home.'
    },
    'Pluto': {
      'Sun': 'Pluto on the natal Sun transforms identity at the root, a long rebirth of purpose.',
      'Moon': 'Pluto on the natal Moon transforms emotional patterns and family bonds.',
      'Mercury': 'Pluto on natal Mercury deepens thinking until it becomes penetrating, sometimes obsessive.',
      'Venus': 'Pluto on natal Venus transforms love and values through bonds of real intensity.',
      'Mars': 'Pluto on natal Mars concentrates drive into something formidable, and power struggles test it.',
      'Jupiter': 'Pluto on natal Jupiter transforms beliefs and enlarges influence.',
      'Saturn': 'Pluto on natal Saturn breaks down structures and rebuilds them on deeper ground.',
      'Uranus': 'Pluto on natal Uranus brings radical change to how freedom is lived, a shift shared by a whole generation.',
      'Neptune': 'Pluto on natal Neptune transforms the inner life of faith, slowly and for a whole cohort at once.',
      'Pluto': 'Pluto meeting its own natal place is a midlife reckoning with power, most often by square.',
      'North Node': 'Pluto on the North Node lends a fated weight to the way forward.',
      'South Node': 'Pluto on the South Node draws out a deep release of past patterns.',
      'Ascendant': 'Pluto crossing the Ascendant transforms self image from the inside out.',
      'Midheaven': 'Pluto at the Midheaven transforms vocation, and questions of authority come to the fore.',
      'Descendant': 'Pluto at the Descendant brings intense, transformative partnerships.',
      'IC': 'Pluto at the IC brings upheaval at home and a reckoning with family roots.'
    },
    'North Node': {
      'Sun': 'The North Node on the natal Sun asks purpose to grow in an unfamiliar direction.',
      'Moon': 'The North Node on the natal Moon asks emotional life to grow up, and new forms of care become possible.',
      'Mercury': 'The North Node on natal Mercury points learning forward, toward a subject or a voice not yet tried.',
      'Venus': 'The North Node on natal Venus brings relationships that teach, and a new sense of what is valuable.',
      'Mars': 'The North Node on natal Mars points drive toward a new aim, and courage is part of the lesson.',
      'Jupiter': 'The North Node on natal Jupiter widens belief, and growth through teaching or travel is likely.',
      'Saturn': 'The North Node on natal Saturn asks for maturity in a new form, and responsibility becomes the way forward.',
      'Uranus': 'The North Node on natal Uranus points toward freedom and originality as the next step.',
      'Neptune': 'The North Node on natal Neptune invites spiritual or creative growth, with faith as the compass.',
      'Pluto': 'The North Node on natal Pluto points toward transformation, and power is learned through letting go.',
      'North Node': 'The Nodes returning to their own places, about every eighteen and a half years, open a new chapter of purpose.',
      'South Node': 'The North Node on the natal South Node reverses the axis, and old habits are turned to face the future.',
      'Ascendant': 'The North Node crossing the Ascendant asks for growth in how one shows up and leads.',
      'Midheaven': 'The North Node at the Midheaven points toward public purpose and vocation.',
      'Descendant': 'The North Node at the Descendant points toward partnership as the next lesson.',
      'IC': 'The North Node at the IC points toward home and inner foundations as the place to grow.'
    },
    'South Node': {
      'Sun': 'The South Node on the natal Sun draws out familiar strengths, along with patterns ready to be released.',
      'Moon': 'The South Node on the natal Moon brings old emotional habits and family patterns into view.',
      'Mercury': 'The South Node on natal Mercury revisits old ways of thinking, and some of them can be retired.',
      'Venus': 'The South Node on natal Venus brings back past loves or familiar pleasures, a time to release attachment.',
      'Mars': 'The South Node on natal Mars brings old fights and old drives back to the surface.',
      'Jupiter': 'The South Node on natal Jupiter revisits old beliefs, and outgrown ones can be let go.',
      'Saturn': 'The South Node on natal Saturn completes an old responsibility, and the weight lifts.',
      'Uranus': 'The South Node on natal Uranus revisits old rebellions and old freedoms.',
      'Neptune': 'The South Node on natal Neptune dissolves old illusions.',
      'Pluto': 'The South Node on natal Pluto releases old power dynamics.',
      'North Node': 'The South Node on the natal North Node reverses the axis, and the familiar pulls back toward old ground.',
      'South Node': 'The South Node returning to its own place returns to old patterns, a chance to see them clearly and choose.',
      'Ascendant': 'The South Node crossing the Ascendant brings back old ways of presenting, some ready to retire.',
      'Midheaven': 'The South Node at the Midheaven brings closure in career and public life.',
      'Descendant': 'The South Node at the Descendant brings back old relationship patterns or people from the past.',
      'IC': 'The South Node at the IC brings old family patterns and memories into view.'
    }
  };

  /* WHAT KIND OF PLACE THE POINT IS, and a question for each kind of contact
     there: a meeting (conjunct), an easy contact (sextile, trine) and a hard
     one (square, opposite). Forty eight questions, none answerable from here. */
  var PLACE = {
    'Sun': { area: 'purpose and vitality',
      c: 'What would it look like to put the main effort of this stretch behind the one thing you most want to be known for?',
      e: 'Where is your sense of purpose being met halfway right now, and what would it take to meet it back?',
      h: 'What is pushing back on your sense of direction, and is it an obstacle or a correction?' },
    'Moon': { area: 'feeling, comfort and need',
      c: 'What do you need today that you have not yet said out loud?',
      e: 'Where does comfort come most easily at the moment, and who shares it?',
      h: 'Which feeling keeps returning this week, and what is it asking to have changed?' },
    'Mercury': { area: 'thought, speech and the near world',
      c: 'What idea keeps arriving, and what would happen if you wrote it down in full?',
      e: 'Which conversation would be easiest to have now that has been easy to put off?',
      h: 'Where has something been misheard, by you or about you, and what would set it straight?' },
    'Venus': { area: 'love, pleasure and what is valued',
      c: 'What do you love right now that you have not let yourself enjoy?',
      e: 'Which relationship feels most generous at the moment, and how could it be honoured?',
      h: 'Where is something being valued too much or too little, in money or in affection?' },
    'Mars': { area: 'drive, desire and nerve',
      c: 'What would you start today if no one were watching?',
      e: 'Where is effort turning into progress, and what could it carry next?',
      h: 'What is the frustration this week actually about, underneath the occasion for it?' },
    'Jupiter': { area: 'growth, faith and generosity',
      c: 'What would you attempt if the opening in front of you were as wide as it looks?',
      e: 'Where is life saying yes at the moment, and how much of that yes have you claimed?',
      h: 'Which promise has grown larger than the time there is to keep it?' },
    'Saturn': { area: 'structure, duty and time',
      c: 'What are you willing to commit to for the long term, knowing it will be tested?',
      e: 'Where would a little more structure make life noticeably easier?',
      h: 'Which limit is a real wall, and which one is a habit dressed as a wall?' },
    'Uranus': { area: 'freedom, change and difference',
      c: 'What would change first if you stopped waiting for permission?',
      e: 'Which small experiment could you run this week to see what else is possible?',
      h: 'What is the disruption showing you about where life had grown too tight?' },
    'Neptune': { area: 'imagination, devotion and the porous edge',
      c: 'What dream is asking for room, and what would honour it without demanding proof?',
      e: 'Where is intuition speaking softly enough that it might be missed?',
      h: 'What would you see if you looked at the hopeful version and the factual version side by side?' },
    'Pluto': { area: 'depth, power and renewal',
      c: 'What is ending so that something truer can begin?',
      e: 'Which change could you choose deliberately now, before it is chosen for you?',
      h: 'Where is control being fought over, and what would letting go of a little of it make possible?' },
    'North Node': { area: 'direction and the unfamiliar road',
      c: 'What unfamiliar step feels both awkward and right at the moment?',
      e: 'Where is growth arriving in small, manageable pieces?',
      h: 'Which habit feels safest, and what would it cost to set it down for a while?' },
    'South Node': { area: 'inheritance, habit and old skill',
      c: 'Which old skill is worth using again, and which old reflex is worth retiring?',
      e: 'What do you already know how to do that this season could put to good use?',
      h: 'Where is familiarity pulling against growth, and which side is speaking louder?' },
    'Ascendant': { area: 'the body and the way you arrive',
      c: 'How do you want to be met by people you have not yet met?',
      e: 'Where is your way of showing up already opening doors?',
      h: 'What part of how you present no longer matches who is presenting it?' },
    'Midheaven': { area: 'vocation and public standing',
      c: 'What would you want your work to be known for a year from now?',
      e: 'Which professional door is open at the moment that you have not yet walked through?',
      h: 'Where does the role you hold pull against the work you actually want to do?' },
    'Descendant': { area: 'partnership and the people across from you',
      c: 'Which relationship is asking for your full attention right now?',
      e: 'Who makes things easier at the moment, and have they heard so?',
      h: 'What is a partner, colleague or rival reflecting back that is hard to hear?' },
    'IC': { area: 'home, roots and the private self',
      c: 'What would make home feel more like yours this month?',
      e: 'Where does the private life feel most supported at the moment?',
      h: 'What old family pattern is surfacing, and do you still agree with it?' }
  };

  function aspClass(asp) {
    asp = String(asp || '').toLowerCase();
    if (asp === 'conjunct' || asp === 'conjunction') return 'c';
    if (asp === 'square' || asp === 'opposite' || asp === 'opposition') return 'h';
    return 'e';
  }
  function aspKey(asp) {
    asp = String(asp || '').toLowerCase();
    if (asp === 'conjunction') return 'conjunct';
    if (asp === 'opposition') return 'opposite';
    return asp;
  }

  /* A transit reading in four parts. Null when any key is unknown, so a caller
     can fall back to its own wording rather than print half a reading. */
  function transit(mover, asp, target) {
    var k = aspKey(asp), m = MOVE[mover], meet = MEET[mover], pl = PLACE[target];
    if (!m || !m[k] || !meet || !meet[target] || !pl) return null;
    return { move: m[k], meet: meet[target], area: pl.area, ask: pl[aspClass(k)], pace: PACE[mover] };
  }

  /* GATES. Each gate in four parts. sky: what the gate carries for everyone
     while a moving body holds it. held: how that lands in a chart that already
     carries the gate. open: how it lands in a chart that does not, where the
     theme is visiting rather than resident. ask: the question. The themes
     follow hd-atlas.js, which is inCommon's own reading of each gate, so this
     file and the atlas never disagree about what a gate is about. */
  var GATE = {
    1: { sky: 'While this gate is lit, the sky favours work made in its own shape. Originality is easier to risk and harder to hide, and imitation feels unusually thin.',
      held: 'Where the gate is already part of the chart, the familiar urge to make something unmistakably personal arrives with more fuel than usual.',
      open: 'With the gate absent from the chart, originality arrives from outside, through what others are making, and can be sampled without being owned.',
      ask: 'What would you make if it did not have to resemble anything that already exists?' },
    2: { sky: 'The gate carries a receptive quality: direction comes by allowing rather than by steering. Knowing which way to face matters more than moving fast.',
      held: 'Carried in the chart, a quiet inner compass becomes harder to ignore, and drifting from it registers sooner.',
      open: 'Where the gate is open, a sense of direction can be borrowed from the people nearby; notice whose compass is doing the pointing.',
      ask: 'If no one asked where you were headed, which way would you still be facing?' },
    3: { sky: 'Something new is trying to get organised in the collective air. Beginnings feel messy, and the mess is how anything new finds its order.',
      held: 'For a chart that holds this gate, the confusion of a beginning tends to feel productive, because the knack for sorting new pieces is already in place.',
      open: 'Left open, the pressure to organise something new can feel like another person\u2019s chaos; helping to sort it does not mean taking it home.',
      ask: 'What new thing is still at the untidy stage, and what is the smallest order you could give it?' },
    4: { sky: 'Answers are in the air, plenty of them, and most are worth holding as working guesses. The mind wants closure faster than the facts can supply it.',
      held: 'With this gate in the chart, explanations come readily now; the discipline is keeping each one provisional until it has been tested.',
      open: 'Where it is absent, other people\u2019s tidy answers can be persuasive. They may be right, and they still deserve the scrutiny given to any guess.',
      ask: 'Which question would you rather leave open a little longer than settle too soon?' },
    5: { sky: 'The field leans toward rhythm and routine. Habits steady things now, and breaking a good one costs more than usual.',
      held: 'Carried natally, a personal rhythm feels especially right for now, and keeping it is a way of keeping balance.',
      open: 'Without this gate, the timing of others tends to set the pace; a borrowed routine can help when it is known to be borrowed.',
      ask: 'Which daily rhythm actually supports you, and which one only persists out of habit?' },
    6: { sky: 'Friction sits near the surface, the kind that decides who comes close. Small disagreements here are mostly about thresholds.',
      held: 'Held in the chart, the gate sharpens the sense of when to open and when to hold back, and the emotional doorway is easier to read.',
      open: 'An open gate here lets other moods press on the doorway; letting the feeling settle before answering keeps it yours to open.',
      ask: 'Where does closeness need a clearer threshold, and where could it be relaxed?' },
    7: { sky: 'Questions of guidance circulate: who steers, who follows, and on whose behalf. Direction is welcome while it serves the group.',
      held: 'Already part of the chart, the instinct to guide is amplified, and it lands best when somebody has asked for it.',
      open: 'With the gate open, a confident voice is tempting to follow; it is worth checking that it points where the group needs to go.',
      ask: 'Who has asked for your guidance, and who only seems to need it?' },
    8: { sky: 'The air rewards a contribution made in a recognisable style. Showing the thing, rather than describing it, opens doors.',
      held: 'In a chart that carries it, personal style wants an audience, and offering it costs less nerve than usual.',
      open: 'Without it natally, someone else\u2019s flair is contagious; a good season to learn from a style without copying it.',
      ask: 'What could you contribute this week that only you would think to offer?' },
    9: { sky: 'Attention narrows toward the detail that finishes things. Concentration comes more easily, and scattered effort feels wasteful.',
      held: 'Held, focus is a strength the transit leans on; one task taken all the way through is worth three begun.',
      open: 'Where the gate is open, concentration comes in borrowed bursts, from a deadline or a focused companion. Use them while they last.',
      ask: 'What single detail, finished, would release the most energy?' },
    10: { sky: 'The gate favours behaving naturally, without argument or apology. Authenticity is noticed, and so is performance.',
      held: 'For a chart holding this gate, the practice of self acceptance is easier now, and it shows in how the body moves through a room.',
      open: 'Left open, other people\u2019s ease can raise doubts about your own; this is a stretch to watch rather than compare.',
      ask: 'Where would acting naturally, without explaining yourself, make the most difference?' },
    11: { sky: 'Ideas are plentiful, more than anyone could act on. They are worth sharing and worth holding lightly.',
      held: 'Carried in the chart, the mind fills with images and possibilities, and talking them through serves better than acting on them.',
      open: 'With no natal hold on this gate, other people\u2019s ideas can feel urgent; enjoy them as stories rather than orders.',
      ask: 'Which idea is worth telling someone today, and which is only worth enjoying?' },
    12: { sky: 'Words carry weight, and timing matters more than content. Speech offered in the right mood lands far better.',
      held: 'Natally present, this gate makes the voice especially sensitive to mood, and waiting for the right moment pays.',
      open: 'Where the gate is open, the urge to speak can arrive on someone else\u2019s clock; a pause before replying is a courtesy to both.',
      ask: 'What would change if you waited for the right mood to say it?' },
    13: { sky: 'Stories surface easily, and people want to be heard. Listening becomes a quiet form of leadership.',
      held: 'A chart that already keeps other people\u2019s stories is offered more of them now, and keeping them well is the gift.',
      open: 'With this gate open, confidences may arrive unexpectedly. Holding a secret carefully is a kindness that costs nothing.',
      ask: 'Whose story have you not yet fully heard?' },
    14: { sky: 'Resources follow direction here: money, time and energy move toward whatever has a clear aim.',
      held: 'Held, the knack for gathering means behind a purpose is amplified, provided the purpose is real.',
      open: 'Without it in the chart, resources tend to flow through partners or employers; steering them wisely is still within reach.',
      ask: 'What purpose would you gladly put your resources behind?' },
    15: { sky: 'Rhythms swing widely, early and late, all or nothing. The range itself is healthy, and forcing an even pace wastes it.',
      held: 'For a chart carrying the gate, a wide span of moods and speeds feels natural, and accepting it is easier than fighting it.',
      open: 'Open here, other people\u2019s extremes pull at the schedule; choosing which swings to join keeps the calendar honest.',
      ask: 'Where could more range, rather than more consistency, serve you?' },
    16: { sky: 'Enthusiasm meets practice, and repetition turns interest into skill. Rehearsal is unusually rewarding.',
      held: 'Carried natally, the pleasure of honing a craft is amplified, and a little daily practice goes a long way.',
      open: 'Without this gate, a teacher\u2019s zeal is infectious; borrowing it to start a practice is fine, and keeping it up is the work.',
      ask: 'What would be worth practising every day for a month?' },
    17: { sky: 'Opinions are loud and patterns look obvious. The useful ones are held loosely enough to be tested.',
      held: 'Held in the chart, views form quickly and with confidence; offering them as views rather than facts keeps the conversation alive.',
      open: 'Without this gate natally, other people\u2019s certainty can sound convincing; asking how they know is a fair question.',
      ask: 'Which of your opinions would you be willing to test this week?' },
    18: { sky: 'Flaws are easy to spot, in things and in people. Correction helps when it has been asked for.',
      held: 'In a chart that carries it, the eye for improvement sharpens, and offering it with care makes it welcome.',
      open: 'An open gate here lets criticism sting more than it should; separating useful correction from habit takes the sting out.',
      ask: 'What could be improved, and who actually wants the improvement?' },
    19: { sky: 'Needs sit close to the surface, especially the need to belong and to be looked after.',
      held: 'Natally held, sensitivity to what others need is heightened, and naming your own needs plainly matters just as much.',
      open: 'Where the gate is open, someone else\u2019s needs can feel pressing; answering them without overextending is a skill worth practising.',
      ask: 'What do you need that you have not yet asked for?' },
    20: { sky: 'The present tense wins. What is said now carries further than what was planned.',
      held: 'Carried in the chart, the gift for speaking in the moment is amplified, and the immediate word can be trusted.',
      open: 'Left open, pressure to answer instantly tends to come from others; taking a breath first is allowed.',
      ask: 'What is true right now that would be worth saying?' },
    21: { sky: 'Control over resources and territory is in question. Stewardship works better than grip.',
      held: 'Held, the urge to manage things runs strong, and leaving others some room makes the control lighter to carry.',
      open: 'With the gate open, others may try to manage your territory; deciding what to hand over, and what not, settles it.',
      ask: 'What do you need to control, and what could you trust to someone else?' },
    22: { sky: 'Grace rides on mood. Social ease comes and goes with the emotional wave, and that is no failing.',
      held: 'For a chart that holds the gate, charm and openness are amplified and shine most when the mood is right.',
      open: 'Where it is absent, the room\u2019s mood colours social ease; nobody else\u2019s weather needs to be taken personally.',
      ask: 'When do you feel most open, and how could you spend more time there?' },
    23: { sky: 'Fresh insight is trying to find words. Simplicity is what makes it understood.',
      held: 'Carried natally, explaining something original feels urgent; plain words travel further than clever ones.',
      open: 'Absent from the chart, this gate lets a borrowed insight arrive half translated; asking for the simple version is not a weakness.',
      ask: 'What do you understand that you have not yet found the words for?' },
    24: { sky: 'Old questions return and circle until something resolves. Patience with the circling is part of the answer.',
      held: 'Held in the chart, the mind revisits the same thought, and a new angle may finally show itself.',
      open: 'An open gate lets someone else\u2019s rumination draw you in; stepping out of the loop is allowed.',
      ask: 'Which question keeps returning, and what would let it rest?' },
    25: { sky: 'Innocence and open heartedness are tested. Love without conditions is possible and is also challenged.',
      held: 'Where the gate is natal, an open heart is amplified, and protecting it without closing it is the art.',
      open: 'Without it in the chart, other people\u2019s idealism may inspire or disappoint; keep what is real in it.',
      ask: 'Where could you offer care without needing a reason?' },
    26: { sky: 'Persuasion is strong. A good story sells, and whether it is true matters more than ever.',
      held: 'Carried in the chart, the talent for presenting things well is amplified, and telling the truth with the same force is the test.',
      open: 'An open 26 is easily sold to; checking the facts first is simple prudence.',
      ask: 'What would you sell if you could only tell the truth about it?' },
    27: { sky: 'Care is in the air: nourishing others feels natural, and so does giving too much.',
      held: 'Held, the instinct to look after people is amplified, and looking after yourself counts toward it.',
      open: 'Where the gate is open, other people\u2019s need for care can pull hard; giving what can be spared is enough.',
      ask: 'Who are you caring for, and who is caring for you?' },
    28: { sky: 'Struggle carries meaning. A difficulty worth facing gives purpose, and a pointless one drains it.',
      held: 'Natally present, the willingness to risk for what matters is amplified; choosing which battles is the whole skill.',
      open: 'Left open, other people\u2019s struggles can feel like yours; deciding which ones to join is your call.',
      ask: 'What difficulty is worth facing because of what it means to you?' },
    29: { sky: 'Commitments come easily. Saying yes is powerful, and saying yes to the right thing matters more.',
      held: 'In a chart that carries the gate, the capacity for wholehearted commitment is strong; it is worth checking that each yes is meant.',
      open: 'Without the gate, someone else\u2019s enthusiasm may draw a yes out of you before you have decided; a pause protects it.',
      ask: 'What have you said yes to that you would choose again?' },
    30: { sky: 'Desire burns brightly, the wish for an experience not yet had. Wanting is fuel rather than a destination.',
      held: 'Held, longing runs intense; letting it drive action rather than consume the hours is the gift.',
      open: 'Where it is open, another person\u2019s yearning is contagious; enjoy the heat of it without chasing it.',
      ask: 'What do you long for, and what is the longing really asking for?' },
    31: { sky: 'Influence is on offer, and it works best once it has been invited.',
      held: 'Carried natally, the voice that leads is amplified, and leading because you were asked keeps it strong.',
      open: 'With the gate open, others may look to you to lead; accepting and declining are both honest answers.',
      ask: 'Where has your influence been invited, and where has it only been assumed?' },
    32: { sky: 'What will last is the question in the air. Instinct about what endures runs sharper than usual.',
      held: 'Held in the chart, the sense of what deserves to continue is strong, and a fear of failing may need naming before it steers.',
      open: 'Where the gate is open, other people\u2019s worry about the future can feel like your own; check what it rests on.',
      ask: 'What deserves to last, and what are you holding onto out of fear?' },
    33: { sky: 'Retreat and reflection are favoured. Experience turns into wisdom when it is told after the fact.',
      held: 'Natally held, the need for privacy grows stronger, and telling the experience later makes it useful.',
      open: 'With the gate open, others may bring their stories to you; listening well is the contribution.',
      ask: 'What experience is ready to be told?' },
    34: { sky: 'Raw energy is abundant and wants to be busy. Spending it where it belongs is the challenge.',
      held: 'Carried in the chart, the power to get things done is amplified; responding to what genuinely engages keeps it clean.',
      open: 'Without it natally, another person\u2019s energy can carry you along; notice when the fuel is borrowed.',
      ask: 'Where is your energy going, and is it going where you want it?' },
    35: { sky: 'Restlessness for new experience runs strong. Progress comes from doing it, not from wanting it.',
      held: 'Held, the hunger for change is amplified, and taking an experience all the way through gives it value.',
      open: 'Where the gate is open, someone else\u2019s restlessness can pass for your own; choose which adventures to join.',
      ask: 'What experience have you been wanting, and what would it take to begin?' },
    36: { sky: 'Turbulence travels with new experience. Things may feel out of hand before they settle.',
      held: 'For a chart that carries it, crisis is familiar ground; meeting it without adding drama is the gift.',
      open: 'Left open, other people\u2019s turmoil can feel overwhelming; a step back is not abandonment.',
      ask: 'What new experience is unsettling you, and what might it teach?' },
    37: { sky: 'Bonds and bargains are in focus. Families and friendships hold together through fair agreements.',
      held: 'Natally present, the instinct to support and be supported is strong; keeping agreements in the open keeps them sweet.',
      open: 'Where it is absent, other people\u2019s expectations of loyalty may weigh more than they should; clarify what is fair.',
      ask: 'Which agreement in your relationships needs to be spoken aloud?' },
    38: { sky: 'Stubbornness has a purpose. Fighting for what matters gives meaning, and fighting everything exhausts.',
      held: 'Held in the chart, the drive to stand firm is amplified; choosing the fight that matters is the skill.',
      open: 'Open here, a neighbour\u2019s quarrel can start to feel like a cause; deciding which are yours is enough.',
      ask: 'What is worth standing firm for?' },
    39: { sky: 'Provocation is in the air, poking at feelings to see what is there. It can free things up or stir them up.',
      held: 'Carried natally, the urge to provoke is strong; provoking with care can release a stuck feeling.',
      open: 'Where the gate is open, others may provoke; noticing what gets stirred is revealing in itself.',
      ask: 'What feeling would be freed if it were gently provoked?' },
    40: { sky: 'Work followed by rest is favoured. Withdrawal after effort restores rather than retreats.',
      held: 'Held, the need to retreat after giving is strong, and resting before the collapse is the wise order.',
      open: 'With it open, someone else\u2019s need for solitude can feel like rejection; usually it is not.',
      ask: 'Where do you need to rest, and have you claimed it?' },
    41: { sky: 'A new cycle is starting, and imagination runs ahead of what is real. Fantasies hint at what could come.',
      held: 'Natally held, the pressure of imagination is strong; let it open a door rather than stand in for living.',
      open: 'An open 41 catches daydreams the way a sail catches wind; enjoy them, then come back to what is real.',
      ask: 'What fantasy is pointing at something real you want?' },
    42: { sky: 'Completion is favoured. Finishing what was started makes room for whatever is next.',
      held: 'Carried in the chart, the drive to bring a cycle to its end is amplified, and ending well is the gift.',
      open: 'With the gate open, the pull to finish may come from others; a shared deadline can help.',
      ask: 'What is ready to be finished?' },
    43: { sky: 'Sudden knowing arrives before it can be explained. When it is delivered matters as much as what it is.',
      held: 'Held in the chart, insights come out of nowhere; waiting for the right moment to share them helps them land.',
      open: 'In a chart without it, a colleague\u2019s sudden certainty can feel startling; give them time to make sense.',
      ask: 'What do you know that you cannot yet explain?' },
    44: { sky: 'Pattern recognition about people runs sharp. Instinct about whom to trust deserves a hearing.',
      held: 'Natally present, the nose for people is keen; the past is a guide here, not a prophecy.',
      open: 'Lacking this gate, a friend\u2019s verdict on a stranger can quietly become yours; check them against your own experience.',
      ask: 'Who do you trust, and what does your instinct say about it?' },
    45: { sky: 'Who holds the resources, and who shares them out, is the question in the air. Honest stewardship holds a group together.',
      held: 'Carried natally, the voice that speaks for the group is amplified, and sharing generously keeps it trusted.',
      open: 'Where the gate is open, someone may claim to speak for everyone; ask whose interest is being served.',
      ask: 'What do you hold that belongs, in part, to others?' },
    46: { sky: 'Being in the right place at the right time matters. The body knows where it belongs before the mind does.',
      held: 'Held in the chart, good timing has a way of turning up, and trusting the body\u2019s sense of place helps it along.',
      open: 'With the gate open, another person\u2019s lucky timing can look enviable; that kind of timing is not rationed.',
      ask: 'Where does your body feel at home this week?' },
    47: { sky: 'Confusion is working its way toward a realisation. Patience with what has not resolved is wise.',
      held: 'Natally held, the mind works hard to make sense of the past; it deserves time rather than a deadline.',
      open: 'Where it is open, someone else\u2019s confusion can become yours for a while; let it pass through.',
      ask: 'What are you trying to make sense of, and can it wait?' },
    48: { sky: 'Depth of knowledge is valued, and so is the fear of not knowing enough.',
      held: 'Carried in the chart, deep skill is available, and trusting it to appear when needed is the work.',
      open: 'An open 48 meets the expert in the room and shrinks a little; curiosity is qualification enough to begin.',
      ask: 'Where do you know more than you give yourself credit for?' },
    49: { sky: 'Principles and the terms of belonging are in question. Reform, or something bolder, may beckon.',
      held: 'Held, the sense of what is acceptable runs strong; stating it serves better than enforcing it.',
      open: 'Open here, a group\u2019s principles can harden into rules overnight; choosing your own is allowed.',
      ask: 'On what terms do you belong, and are they still true?' },
    50: { sky: 'Values, and the rules that protect a group, come into focus. Guardianship matters while it lasts.',
      held: 'Natally present, the instinct to protect is amplified; make sure the rules still serve the people they were made for.',
      open: 'An open 50 meets inherited rules with suspicion; ask what they were meant to protect.',
      ask: 'What values do you protect, and who do they serve?' },
    51: { sky: 'Shock and surprise shake the order of things. Courage can open something that politeness would not.',
      held: 'Held in the chart, the capacity to meet a jolt with nerve is strong, and competition may be tempting.',
      open: 'Without it natally, a jolt in someone else\u2019s life shakes the floor under yours; finding your footing comes first.',
      ask: 'What shock might be opening a door?' },
    52: { sky: 'Stillness and focus are favoured. Pressure held still becomes concentration.',
      held: 'Carried natally, the ability to stay put and focus is strong; it is worth making sure it does not harden into inertia.',
      open: 'An open 52 can find a still household stifling; moving is fine.',
      ask: 'What deserves your undivided attention?' },
    53: { sky: 'The pressure to start something new is strong. Beginnings that are actually ready thrive.',
      held: 'Held, starting comes easily; finishing is the test.',
      open: 'Lacking the gate, a friend\u2019s fresh venture is very easy to sign up for; choosing which to join is half the work.',
      ask: 'What is ready to begin, and what is better left for later?' },
    54: { sky: 'Ambition rises, material and otherwise. Drive matched to real capacity succeeds.',
      held: 'Natally held, the drive to rise is amplified, and grounding it in real skill keeps it sustainable.',
      open: 'With it open, someone else\u2019s ambition may press on you; success on your own terms is the only kind worth chasing.',
      ask: 'What would rising mean to you, on your own terms?' },
    55: { sky: 'Mood is the weather of the spirit here. Highs and lows pass, and something steadier stays.',
      held: 'Carried in the chart, emotional abundance or emptiness runs strong, and neither is permanent.',
      open: 'Where it is open, the moods around you may sweep you along; anchor in whatever is steady.',
      ask: 'What lifts your spirit without needing a reason?' },
    56: { sky: 'Stories and ideas stimulate. A good tale either carries a truth or distracts from one.',
      held: 'Held, the gift for storytelling is amplified; let the story carry something real.',
      open: 'Open here, the room\u2019s best storyteller sets the evening; enjoy them, and check them.',
      ask: 'What story are you telling, and what truth does it carry?' },
    57: { sky: 'Intuition runs quiet and sharp. The first read is usually the right one.',
      held: 'Natally present, intuition speaks clearly and can be trusted the first time.',
      open: 'Absent this gate, an anxious companion can sound uncannily like a hunch; telling the two apart is the work.',
      ask: 'What did your first instinct say, before you argued with it?' },
    58: { sky: 'Joy presses toward improvement. Aliveness wants to make things better.',
      held: 'Carried in the chart, vitality is strong; channelled into improvement, it stops being restlessness.',
      open: 'Lacking the gate, a lively friend can lift the whole day; let it.',
      ask: 'What would you improve for the sheer joy of it?' },
    59: { sky: 'Intimacy, and the barriers to it, are in focus. Openness chosen deliberately deepens connection.',
      held: 'Held, the pull toward intimacy is strong; choosing whom to open to is the point.',
      open: 'Where it is open, another person\u2019s wish for closeness may feel intense; the pace is still yours to set.',
      ask: 'Where would deeper intimacy be welcome, and where would it not?' },
    60: { sky: 'Limitation is the theme, and accepting it is the condition for change.',
      held: 'Natally held, the ability to work within limits is strong; change happens inside the frame.',
      open: 'An open 60 chafes at limits set by others; acceptance can be freeing in its own right.',
      ask: 'What limit, once accepted, would let something change?' },
    61: { sky: 'The pressure to know the unknowable runs strong. Wonder is better company than answers.',
      held: 'Carried in the chart, the mind seeks inner truth; let it wonder without forcing a conclusion.',
      open: 'Open here, a seeker\u2019s revelation may intrigue; hold it lightly.',
      ask: 'What mystery are you content to leave unsolved?' },
    62: { sky: 'Precision matters. Naming things exactly is what makes them usable.',
      held: 'Held, the gift for detail is amplified; let precision serve the point rather than hide it.',
      open: 'Lacking it, a pedant\u2019s corrections may grate; it may also help.',
      ask: 'What detail, named precisely, would make something clearer?' },
    63: { sky: 'Doubt is in the air, and doubt is where good logic begins.',
      held: 'Natally present, questioning runs strong; aim it at the theory before aiming it at yourself.',
      open: 'Where it is open, someone else\u2019s scepticism can unsettle; let it sharpen the thinking instead.',
      ask: 'What doubt is worth turning into a good question?' },
    64: { sky: 'Images and impressions swirl, not yet resolved. Clarity comes with time rather than effort.',
      held: 'Carried in the chart, the mind fills with pictures; leave them alone until they settle.',
      open: 'Open here, a muddle in the household can pass for a muddle of your own; nobody needs you to resolve it.',
      ask: 'What image keeps returning, and can you let it be?' }
  };

  /* What the line adds. A line is where in the gate the body stands, and the
     six are read as six ways of meeting the same theme. */
  var LINE = {
    1: 'On the first line the theme wants groundwork: study it before acting on it.',
    2: 'On the second line it works best unwatched, arriving naturally rather than on request.',
    3: 'On the third line it is learned by trial, and whatever breaks teaches the most.',
    4: 'On the fourth line it travels through people, and a friend or a colleague is the door.',
    5: 'On the fifth line it is in public view, where others project their hopes onto it.',
    6: 'On the sixth line it is seen from a height, and the lesson shows over time rather than at once.'
  };

  /* When a transit holds one gate of a channel and the chart holds the other,
     the channel is complete for as long as the transit lasts. Thirty six
     sentences, keyed by the pair in ascending order. */
  var CHANNEL = {
    '1-8': 'a creative idea finds its outlet and can be shown rather than kept',
    '2-14': 'direction and resources line up, so effort goes where it is pointed',
    '3-60': 'the pressure for change finds a pulse, and something new can begin inside its limits',
    '4-63': 'doubt meets an answer worth testing, and the logic runs its full circuit',
    '5-15': 'a personal rhythm falls into step with the wider flow',
    '6-59': 'intimacy has both its boundary and its bond, and closeness can deepen',
    '7-31': 'a leader is asked and answers, and influence finds its voice',
    '9-52': 'concentration has both fuel and stillness, and a long task can be finished',
    '10-20': 'being yourself and speaking now line up, so the natural word comes out',
    '10-34': 'conviction has power behind it, and acting on belief is easier',
    '10-57': 'self trust and instinct join, and the body knows how to stay well',
    '11-56': 'an idea becomes a story others want to hear',
    '12-22': 'feeling finds its voice, and timing makes it graceful',
    '13-33': 'listening becomes testimony, and an old story can be told well',
    '16-48': 'skill meets depth, and practice turns toward mastery',
    '17-62': 'an opinion finds its details, and a view becomes a case',
    '18-58': 'joy and correction join, and improvement feels alive',
    '19-49': 'needs and principles meet, so belonging can be negotiated fairly',
    '20-34': 'power meets the present, and things get done right now',
    '20-57': 'intuition finds words in the moment it arrives',
    '21-45': 'control and distribution meet, and resources can be managed for everyone',
    '23-43': 'an insight finds words that others can follow',
    '24-61': 'the search for an inner truth reaches a thought that settles',
    '25-51': 'courage and an open heart meet, and a shock can be met with love',
    '26-44': 'memory and instinct combine, and the past becomes a persuasive lesson',
    '27-50': 'care and values join, and protection becomes nourishment',
    '28-38': 'a struggle finds its purpose, and the fight feels worth having',
    '29-46': 'a yes lands in the right place, and commitment meets timing',
    '30-41': 'desire and imagination combine, and a new experience is longed for in earnest',
    '32-54': 'ambition meets endurance, and the climb becomes sustainable',
    '34-57': 'instinct has power behind it, and the body responds before the mind',
    '35-36': 'change meets feeling, and a new experience moves the heart',
    '37-40': 'a bargain and a rest meet, and a community supports itself',
    '39-55': 'provocation stirs the spirit, and stuck moods begin to move',
    '42-53': 'a beginning and an ending meet, so a whole cycle can complete',
    '47-64': 'confusion finds its realisation, and a puzzling image makes sense'
  };

  function chanKey(a, b) { a = +a; b = +b; return a < b ? a + '-' + b : b + '-' + a; }

  /* A gate reading. opts.held says whether the reader's chart carries the
     gate; opts.partner names the natal gate that completes a channel with it,
     when there is one. Null for an unknown gate. */
  function gate(n, line, opts) {
    var g = GATE[+n];
    if (!g) return null;
    opts = opts || {};
    var ck = opts.partner != null ? chanKey(n, opts.partner) : null;
    return { sky: g.sky, personal: opts.held ? g.held : g.open, held: !!opts.held,
      line: LINE[+line] || '', channel: ck && CHANNEL[ck] ? CHANNEL[ck] : '', channelKey: ck && CHANNEL[ck] ? ck : '',
      ask: g.ask };
  }

  /* NUMBERS, by role. A 5 as the day and a 5 as the Life Path are different
     sentences, so every value is written for every role it can take. A
     challenge is a difference of single digits, so it runs 0 to 8 and never
     carries a master number; the master numbers are written for the five roles
     they can reach. */
  var ROLES = ['day', 'month', 'year', 'lp', 'challenge', 'pinnacle'];
  var NUMBER = {
    0: { challenge: 'A Challenge of 0 names no single difficulty, which leaves every lesson available. The work is choosing which one to take up, rather than having it chosen.',
      ask: 'Which lesson would you choose to learn, if none were assigned?' },
    1: { day: 'A day for the first move. Something begun today carries its own momentum, and waiting for permission wastes it.',
      month: 'A month of starting. What is planted now takes a while to show, and the planting is the work.',
      year: 'A Personal Year 1 opens a new nine year round. What is started now sets the key for the years after it, so it is worth choosing deliberately.',
      lp: 'As a Life Path, 1 is a lifelong study of independence: leading without isolating, and beginning without waiting for company.',
      challenge: 'As a Challenge, 1 is the lesson of self assertion: standing up for a wish without overriding everyone else\u2019s.',
      pinnacle: 'As a Pinnacle, 1 is a long season of self reliance, when independence gets built whether or not it was asked for.',
      ask: 'What would you start if you trusted your own judgment completely?' },
    2: { day: 'A day for patience and partnership. Small kindnesses and quiet cooperation achieve more than force.',
      month: 'A month of waiting and weaving: relationships deepen, and timing matters more than effort.',
      year: 'A Personal Year 2 is slow by design. Last year\u2019s seeds germinate out of sight, and patience and partnership do the work.',
      lp: 'As a Life Path, 2 is a lifelong study of cooperation, sensitivity and the art of the pair.',
      challenge: 'As a Challenge, 2 is the lesson of sensitivity: caring without being swamped, and keeping the peace without disappearing.',
      pinnacle: 'As a Pinnacle, 2 is a season of partnership and diplomacy, when the important work happens between people.',
      ask: 'Who is quietly helping you, and how could you return it?' },
    3: { day: 'A day for expression and play. Words, art and laughter carry further than usual.',
      month: 'A month of creativity and connection. Social life brightens and self expression flows.',
      year: 'A Personal Year 3 expands through expression: creativity, friendship and delight. Scattered energy is the only real risk.',
      lp: 'As a Life Path, 3 is a lifelong study of expression: finding a voice and using it with pleasure.',
      challenge: 'As a Challenge, 3 is the lesson of being heard: speaking up without performing, and being seen without hiding behind charm.',
      pinnacle: 'As a Pinnacle, 3 is a season of creative growth and a widening circle of friends.',
      ask: 'What would you express if nobody were grading it?' },
    4: { day: 'A day for steady work. Practical tasks done well build something that lasts.',
      month: 'A month of structure and effort: organise, build, lay foundations.',
      year: 'A Personal Year 4 asks for hard work and order. It is the year of foundations, and what is laid now holds.',
      lp: 'As a Life Path, 4 is a lifelong study of building: discipline, reliability, and the quiet satisfaction of work done well.',
      challenge: 'As a Challenge, 4 is the lesson of discipline: working steadily without turning rigid.',
      pinnacle: 'As a Pinnacle, 4 is a season of laying foundations through practical, patient effort.',
      ask: 'What foundation would you lay if you knew it would hold for a decade?' },
    5: { day: 'A day for change and movement. Variety refreshes, and routine feels confining.',
      month: 'A month of freedom and motion: travel, new faces, unexpected turns.',
      year: 'A Personal Year 5 brings change at the midpoint of the round. Movement is coming either way, so choose it where possible.',
      lp: 'As a Life Path, 5 is a lifelong study of freedom: adventure, adaptability, and learning through experience.',
      challenge: 'As a Challenge, 5 is the lesson of freedom: exploring without scattering, and committing without feeling caged.',
      pinnacle: 'As a Pinnacle, 5 is a season of change, travel and a widening range of experience.',
      ask: 'What change would refresh you most?' },
    6: { day: 'A day for care and responsibility. Home, family and community ask for attention.',
      month: 'A month of nurture and duty: relationships and home take the foreground.',
      year: 'A Personal Year 6 centres on love, home and responsibility. Commitments deepen, and service carries meaning.',
      lp: 'As a Life Path, 6 is a lifelong study of care: responsibility, harmony, and nurturing without controlling.',
      challenge: 'As a Challenge, 6 is the lesson of responsibility: caring without carrying everyone.',
      pinnacle: 'As a Pinnacle, 6 is a season of family, home and service.',
      ask: 'Who needs your care, and are you on the list?' },
    7: { day: 'A day for reflection and study. Solitude refreshes, and insight arrives quietly.',
      month: 'A month of introspection: study, rest, inner work.',
      year: 'A Personal Year 7 turns inward. It is a year for study, contemplation and rest, not for pushing outward.',
      lp: 'As a Life Path, 7 is a lifelong study of inner truth: analysis, wisdom, and the search for meaning.',
      challenge: 'As a Challenge, 7 is the lesson of trust: seeking understanding without withdrawing from connection.',
      pinnacle: 'As a Pinnacle, 7 is a season of study, reflection and deepening faith.',
      ask: 'What question deserves your quiet attention?' },
    8: { day: 'A day for power and practicality. Decisions about money and authority land well.',
      month: 'A month of achievement and recognition, when ambition is rewarded.',
      year: 'A Personal Year 8 is the harvest of effort: power, money and recognition come into focus.',
      lp: 'As a Life Path, 8 is a lifelong study of power: authority, abundance, and their responsible use.',
      challenge: 'As a Challenge, 8 is the lesson of power: holding authority without being consumed by it.',
      pinnacle: 'As a Pinnacle, 8 is a season of achievement, authority and material growth.',
      ask: 'What would you do with power you knew how to use well?' },
    9: { day: 'A day for completion and generosity. Let go of what is done.',
      month: 'A month of endings and clearing: finish, release, forgive.',
      year: 'A Personal Year 9 closes the round. It is a year of completion, release and generosity, clearing room for what comes next.',
      lp: 'As a Life Path, 9 is a lifelong study of compassion: completion, service and letting go.',
      challenge: 'As a Challenge, 9 is the lesson of release: giving without martyrdom, and ending without bitterness.',
      pinnacle: 'As a Pinnacle, 9 is a season of completion and service to something larger.',
      ask: 'What is ready to be released?' },
    11: { day: 'An 11 day heightens intuition and sensitivity. Inspiration is close, and so is nervous tension.',
      month: 'An 11 month brings illumination: insight arrives, and so does the pressure to share it.',
      year: 'A Personal Year 11 is a master year of insight and inspiration, the patience of a 2 carried at a higher voltage.',
      lp: 'As a Life Path, 11 is a master number: a lifelong study of intuition, illumination and inspiring others.',
      pinnacle: 'As a Pinnacle, 11 is a season of inspiration and spiritual leadership.',
      ask: 'What insight is asking to be shared, and who needs to hear it?' },
    22: { day: 'A 22 day carries large scale building energy. Practical vision can turn into something real.',
      month: 'A 22 month brings the chance to build something larger than a single life.',
      year: 'A Personal Year 22 is a master year of building: vision made practical, at a scale that outlasts the year.',
      lp: 'As a Life Path, 22 is a master number: a lifelong study of turning vision into structure that serves many.',
      pinnacle: 'As a Pinnacle, 22 is a season of large achievement and lasting construction.',
      ask: 'What would you build if you could build it for many people at once?' },
    33: { day: 'A 33 day carries a teacher\u2019s compassion. Care offered today reaches further than expected.',
      month: 'A 33 month brings the chance to heal and teach through love.',
      year: 'A Personal Year 33 is a master year of compassionate service, the care of a 6 widened to a whole community.',
      lp: 'As a Life Path, 33 is a master number: a lifelong study of compassionate teaching and healing.',
      pinnacle: 'As a Pinnacle, 33 is a season of service and selfless care.',
      ask: 'How could your care reach someone who needs it most?' }
  };

  function numRoot(v) { v = Math.abs(+v || 0); while (v > 9) { var s = 0; String(v).split('').forEach(function (d) { s += +d; }); v = s; } return v; }
  function roleKey(role) {
    role = String(role || '').toLowerCase();
    if (/^pin/.test(role)) return 'pinnacle';
    if (role === 'lifepath' || role === 'life path') return 'lp';
    return role;
  }

  /* A number reading. A master number keeps its own entry where it has one
     and reads as its root where it does not. Null for an unknown role. */
  function number(v, role) {
    var r = roleKey(role);
    if (ROLES.indexOf(r) === -1) return null;
    var n = NUMBER[+v];
    var text = n && n[r];
    if (!text) { n = NUMBER[numRoot(v)]; text = n && n[r]; }
    if (!text) return null;
    return { value: +v, role: r, text: text, ask: n.ask };
  }

  /* Coverage, so a gate can ask the module what it claims to hold. */
  function coverage() {
    var transits = 0, gates = 0, numbers = 0;
    MOVERS.forEach(function (m) { ASPECTS.forEach(function (a) { TARGETS.forEach(function (t) { if (transit(m, a, t)) transits++; }); }); });
    for (var g = 1; g <= 64; g++) for (var l = 1; l <= 6; l++) if (gate(g, l, {}) && LINE[l]) gates++;
    Object.keys(NUMBER).forEach(function (k) { ROLES.forEach(function (r) { if (NUMBER[k][r]) numbers++; }); });
    return { transits: transits, gateLines: gates, channels: Object.keys(CHANNEL).length, numbers: numbers };
  }

  var api = {
    VERSION: '1.0.0',
    MOVERS: MOVERS, ASPECTS: ASPECTS, TARGETS: TARGETS, ROLES: ROLES,
    PACE: PACE, MOVE: MOVE, MEET: MEET, PLACE: PLACE,
    GATE: GATE, LINE: LINE, CHANNEL: CHANNEL, NUMBER: NUMBER,
    transit: transit, gate: gate, number: number, coverage: coverage
  };
  if (typeof window !== 'undefined') window.TimingLexicon = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
