/* astropedia.js: inCommon astrological reference. V1.0.0
   Pure reference. Nothing here reads or writes a profile, and nothing here knows
   anyone's birth moment. It is the language, not the reading: the twelve signs,
   the twelve houses, the astral bodies, the points, the aspects, and how a chart is
   read. Gendered descriptions are tendencies the tradition reports, never rules
   about people, and the app presents them under a POSSIBILITY tag.
   Voice: organic and scholarly. No em dashes.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Astropedia = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '1.0.0';

  var SECTIONS = [
    ['signs', 'The Twelve Signs'],
    ['houses', 'The Twelve Houses'],
    ['bodies', 'The Astral Bodies'],
    ['points', 'The Asteroids and Points'],
    ['aspects', 'Aspects'],
    ['chart', 'The Birth Chart'],
    ['sabian', 'Sabian Symbols'],
    ['stellium', 'Stellium'],
    ['transits', 'Transits'],
    ['synastry', 'Synastry'],
    ['example', 'An Example Chart']
  ];

  var INTRO = {
    what: 'Astropedia is a reference, not a reading. It holds the language the tradition speaks in: the signs as atmospheres, the houses as rooms, the astral bodies as guests, and the aspects as the conversation between them.',
    how: 'Read it beside your own chart. Nothing here knows your birth moment, so nothing here can tell you who you are. It can only teach you to hear what your chart is saying.',
    caution: 'None of this has been shown to work by any means outside the tradition itself. It is a language for noticing, and it earns its keep only where it describes something you can check against your own life.'
  };

  /* ---------- the twelve signs ---------- */
  var SIGNS = [
    { name: 'Aries', glyph: '\u2648', element: 'fire', modality: 'cardinal', ruler: 'Mars', season: 'the spring equinox', key: 'beginning',
      text: 'Aries is the first breath of spring. It arrives without hesitation, carrying the urgency of beginnings. Mars dwells here. It is the spark before the flame knows it is fire.',
      strengths: 'Courage, directness, the willingness to go first.', challenges: 'Impatience, a temper that arrives before the thought, difficulty finishing.',
      opportunities: 'To lead without needing to win. To spend the initial force on something worth beginning.',
      obstacles: 'Boredom once the novelty passes, and other people who move at a slower pace.',
      male: 'Often reads as competitive and physically forward, quick to act and slow to explain.',
      female: 'Often reads as forthright and unwilling to soften, which can sit awkwardly against expectations of deference.',
      sun: 'The self expresses itself by initiating. Identity arrives through action rather than reflection.',
      moon: 'Feeling comes fast and passes fast. Comfort is found in movement, not in stillness.',
      asc: 'You are met as someone who has already decided. The first impression carries heat.',
      house: 'That room is entered head first. Whatever the house governs, it is begun rather than deliberated.' },
    { name: 'Taurus', glyph: '\u2649', element: 'earth', modality: 'fixed', ruler: 'Venus', season: 'the settling of spring', key: 'holding',
      text: 'Taurus is spring after the ground has warmed. It does not hurry, because nothing that grows well hurries. Venus dwells here as pleasure that can be touched: taste, weight, texture, the worth of a thing.',
      strengths: 'Steadiness, loyalty, the ability to build something that lasts.', challenges: 'Stubbornness, resistance to change even when change is due.',
      opportunities: 'To make comfort into craft. To hold value without hoarding it.',
      obstacles: 'Inertia, and a habit of measuring security only in what can be counted.',
      male: 'Often reads as solid and unhurried, dependable and quietly immovable.',
      female: 'Often reads as sensual and self-possessed, and can be mistaken for passive when she is simply unmoved.',
      sun: 'The self expresses itself by consolidating. Identity is built rather than declared.',
      moon: 'Feeling settles slowly and stays. Comfort resides in the familiar and the physical.',
      asc: 'You are met as calm and grounded, with a stillness others read as depth.',
      house: 'That room is furnished for the long term. Whatever the house governs is accumulated and kept.' },
    { name: 'Gemini', glyph: '\u264A', element: 'air', modality: 'mutable', ruler: 'Mercury', season: 'late spring, the air quickening', key: 'exchange',
      text: 'Gemini is the mind waking to the fact that there is more than one of everything. Mercury dwells here as curiosity: the question asked for the pleasure of asking. It gathers rather than concludes.',
      strengths: 'Quickness, wit, the ability to hold two ideas at once.', challenges: 'Scattering, restlessness, leaving the second half of things unsaid.',
      opportunities: 'To become the one who translates between worlds.', obstacles: 'Distraction, and mistaking talking about a thing for doing it.',
      male: 'Often reads as verbal and boyish, entertaining, sometimes evasive about the deeper question.',
      female: 'Often reads as bright and socially fluent, and may be underestimated for her lightness.',
      sun: 'The self expresses itself through language and variety. Identity shifts by design, not by failure.',
      moon: 'Feeling is understood by naming it. Comfort resides in conversation.',
      asc: 'You are met as curious and companionable, someone easy to talk to and hard to pin down.',
      house: 'That room holds more than one option. Whatever the house governs is approached in plural.' },
    { name: 'Cancer', glyph: '\u264B', element: 'water', modality: 'cardinal', ruler: 'the Moon', season: 'the summer solstice', key: 'shelter',
      text: 'Cancer is the turn of the year at its fullest light, and it responds by building shelter. The Moon dwells here. It remembers. What was felt once is kept, and what is kept becomes the shape of home.',
      strengths: 'Devotion, memory, the instinct to protect what is vulnerable.', challenges: 'Withdrawal, indirectness, holding an old hurt past its season.',
      opportunities: 'To make care into a practice rather than a debt.', obstacles: 'Defensiveness, and asking to be understood without saying the thing.',
      male: 'Often reads as protective and quietly sentimental, with a guarded interior.',
      female: 'Often reads as nurturing and intuitive, and may be expected to carry more feeling than is hers.',
      sun: 'The self expresses itself through belonging. Identity is bound to lineage, home, and the people kept close.',
      moon: 'Feeling runs deep and tidal. Comfort resides in familiarity and in being needed.',
      asc: 'You are met gently, and behind the softness there is a shell that decides who comes in.',
      house: 'That room is where you go to be safe. Whatever the house governs is treated as family.' },
    { name: 'Leo', glyph: '\u264C', element: 'fire', modality: 'fixed', ruler: 'the Sun', season: 'high summer', key: 'radiance',
      text: 'Leo is summer at its most confident. The Sun dwells here, and so this sign does not orbit anything: it holds a center and warms what stands near it. Its work is to be seen without needing to be watched.',
      strengths: 'Warmth, generosity, the courage to be visible.', challenges: 'Pride, a need for the room to notice, difficulty being ordinary.',
      opportunities: 'To give the light rather than collect it.', obstacles: 'Wounded dignity, and confusing attention with love.',
      male: 'Often reads as proud and magnanimous, performing more than he admits.',
      female: 'Often reads as radiant and self-assured, and may be called too much for occupying her space.',
      sun: 'The self expresses itself by shining. Identity requires an audience of at least one.',
      moon: 'Feeling wants recognition. Comfort resides in being appreciated out loud.',
      asc: 'You are met as warm and vivid, the person the room turns toward.',
      house: 'That room is lit. Whatever the house governs becomes a stage and a source of pride.' },
    { name: 'Virgo', glyph: '\u264D', element: 'earth', modality: 'mutable', ruler: 'Mercury', season: 'the harvest', key: 'refining',
      text: 'Virgo arrives at harvest, when what grew must be sorted, and some of it must be let go. Mercury dwells here as discernment rather than curiosity. It serves the work, and it notices the flaw first.',
      strengths: 'Precision, usefulness, devotion to the craft.', challenges: 'Self-criticism, anxiety dressed as diligence, correcting what did not ask.',
      opportunities: 'To make attention into a form of care.', obstacles: 'Perfection, and the belief that worth must be earned by service.',
      male: 'Often reads as methodical and modest, capable and quietly exacting.',
      female: 'Often reads as competent and self-editing, and may hold herself to a standard she would not impose on anyone else.',
      sun: 'The self expresses itself through improvement. Identity is found in what is done well.',
      moon: 'Feeling is managed by ordering the surroundings. Comfort resides in routine.',
      asc: 'You are met as measured and observant, someone who has already noticed the detail.',
      house: 'That room is kept in order. Whatever the house governs is analyzed and refined.' },
    { name: 'Libra', glyph: '\u264E', element: 'air', modality: 'cardinal', ruler: 'Venus', season: 'the autumn equinox', key: 'weighing',
      text: 'Libra stands at the equinox, where light and dark are equal, and it never forgets that both sides have weight. Venus dwells here as proportion and relation: beauty as the harmony between things rather than the thing itself.',
      strengths: 'Fairness, grace, an eye for what belongs together.', challenges: 'Indecision, conflict avoidance, agreeing to keep the peace.',
      opportunities: 'To hold two truths without collapsing either.', obstacles: 'The other person, when their preference is louder than yours.',
      male: 'Often reads as charming and diplomatic, reluctant to be the one who disturbs.',
      female: 'Often reads as gracious and accommodating, and may lose her own preference inside the effort to please.',
      sun: 'The self expresses itself in relation. Identity comes into focus opposite someone else.',
      moon: 'Feeling seeks balance. Comfort resides in harmony and in company.',
      asc: 'You are met as pleasant and even, with a courtesy that both invites and holds at a distance.',
      house: 'That room is shared. Whatever the house governs is negotiated rather than decided alone.' },
    { name: 'Scorpio', glyph: '\u264F', element: 'water', modality: 'fixed', ruler: 'Mars and Pluto', season: 'autumn going under', key: 'depth',
      text: 'Scorpio is the season when the leaves are gone and what remains is the root. Mars is its ancient ruler and Pluto its modern one. It goes to the bottom of a thing, and it does not pretend the bottom is comfortable.',
      strengths: 'Intensity, loyalty, the nerve to look at what others avoid.', challenges: 'Control, suspicion, a long memory for betrayal.',
      opportunities: 'To let intimacy be a risk taken rather than a hold kept.', obstacles: 'Mistrust, and power used to keep from being touched.',
      male: 'Often reads as guarded and magnetic, revealing little and observing much.',
      female: 'Often reads as penetrating and self-contained, and can be called intimidating for refusing the surface.',
      sun: 'The self expresses itself through intensity. Identity forms through what has been survived.',
      moon: 'Feeling is total and private. Comfort resides in being known completely by very few.',
      asc: 'You are met as still and unreadable, with a presence others feel before they can name.',
      house: 'That room has a locked drawer. Whatever the house governs carries stakes and secrecy.' },
    { name: 'Sagittarius', glyph: '\u2650', element: 'fire', modality: 'mutable', ruler: 'Jupiter', season: 'the last light before winter', key: 'seeking',
      text: 'Sagittarius answers the dark by aiming past it. Jupiter dwells here as the appetite for meaning: the horizon, the doctrine, the road that keeps going. It trades the near thing for the larger view.',
      strengths: 'Optimism, honesty, an appetite for what lies beyond.', challenges: 'Bluntness, restlessness, promising more than the day can hold.',
      opportunities: 'To turn wandering into study, and belief into something tested.', obstacles: 'Confinement, and certainty arriving before understanding.',
      male: 'Often reads as expansive and candid, restless in commitments.',
      female: 'Often reads as independent and outspoken, unwilling to make herself smaller for a room.',
      sun: 'The self expresses itself by widening. Identity is bound to what it believes.',
      moon: 'Feeling wants space and possibility. Comfort resides in freedom of movement.',
      asc: 'You are met as open and enthusiastic, someone who arrives already going somewhere.',
      house: 'That room has the window open. Whatever the house governs is explored rather than settled.' },
    { name: 'Capricorn', glyph: '\u2651', element: 'earth', modality: 'cardinal', ruler: 'Saturn', season: 'the winter solstice', key: 'building',
      text: 'Capricorn begins at the longest night and starts climbing anyway. Saturn dwells here as time, limit, and consequence. It respects what has been earned and distrusts what has merely been given.',
      strengths: 'Discipline, endurance, the patience to build across years.', challenges: 'Severity, joylessness, mistaking usefulness for worth.',
      opportunities: 'To become the authority you needed. To carry weight without becoming the weight.',
      obstacles: 'Isolation at the top, and a standard that keeps moving.',
      male: 'Often reads as reserved and responsible, ambitious in a way he does not announce.',
      female: 'Often reads as capable and self-reliant, and may carry the structure for everyone around her.',
      sun: 'The self expresses itself through mastery. Identity is proven by what stands afterward.',
      moon: 'Feeling is kept in reserve. Comfort resides in competence and in control of the plan.',
      asc: 'You are met as composed and serious, someone assumed to be in charge.',
      house: 'That room is load-bearing. Whatever the house governs is where duty and ambition gather.' },
    { name: 'Aquarius', glyph: '\u2652', element: 'air', modality: 'fixed', ruler: 'Saturn and Uranus', season: 'deep winter', key: 'apartness',
      text: 'Aquarius stands slightly outside the circle in order to see its shape. Saturn is its ancient ruler and Uranus its modern one, which is why it can be both principled and disruptive. It thinks in wholes: the many rather than the one.',
      strengths: 'Originality, principle, loyalty to the group rather than the hierarchy.', challenges: 'Detachment, contrariness, coolness where warmth was asked for.',
      opportunities: 'To belong without conforming.', obstacles: 'Alienation, and holding an idea more tightly than a person.',
      male: 'Often reads as unconventional and cerebral, friendly at a slight distance.',
      female: 'Often reads as independent and unusual, resistant to being placed in a familiar role.',
      sun: 'The self expresses itself by differing. Identity is bound to the collective it serves or refuses.',
      moon: 'Feeling is observed before it is felt. Comfort resides in room to breathe.',
      asc: 'You are met as singular and unhurried, hard to categorize on the first meeting.',
      house: 'That room is arranged unusually. Whatever the house governs is done your own way.' },
    { name: 'Pisces', glyph: '\u2653', element: 'water', modality: 'mutable', ruler: 'Jupiter and Neptune', season: 'winter dissolving', key: 'dissolving',
      text: 'Pisces is the end of the wheel, where the edges of things soften and the year gives itself back. Jupiter is its ancient ruler and Neptune its modern one. It feels what is not spoken, and it does not always know whose feeling it is.',
      strengths: 'Compassion, imagination, permeability to what others carry.', challenges: 'Boundarylessness, escape, sorrow without an origin.',
      opportunities: 'To make sensitivity into art, service, or devotion.', obstacles: 'Avoidance, and absorbing what was never yours to hold.',
      male: 'Often reads as gentle and dreamy, uneasy with hard edges.',
      female: 'Often reads as empathic and impressionable, and may be asked to hold the room\u2019s mood.',
      sun: 'The self expresses itself by merging. Identity is fluid and finds itself through devotion.',
      moon: 'Feeling has no fixed shore. Comfort resides in music, water, solitude, and mercy.',
      asc: 'You are met as soft and slightly elsewhere, someone the room finds easy to confide in.',
      house: 'That room has no door. Whatever the house governs is where boundaries blur.' }
  ];

  /* ---------- the twelve houses ---------- */
  var HOUSES = [
    { n: 1, name: 'The House of Self', sign: 'Aries', area: 'appearance, arrival, the body as messenger',
      text: 'The First House is the threshold. It is the face you present before you have chosen to speak. It belongs to Aries by nature, and so it carries the mark of emergence, of self-assertion, of the body as the first thing anyone reads.',
      bodies: 'An astral body here is worn in public. It colors how you are met before you have said anything.',
      signs: 'The sign on this cusp is the Ascendant, and it sets the atmosphere of the whole chart.' },
    { n: 2, name: 'The House of Substance', sign: 'Taurus', area: 'resources, worth, what is held',
      text: 'The Second House is the storehouse. It holds what is yours: money, possessions, talents, and the quieter matter of what you believe you are worth. Taurus by nature, it measures value by what can be kept.',
      bodies: 'An astral body here shapes how you earn, spend, and value.', signs: 'The sign here reveals the manner of holding: generous, cautious, restless, or exacting.' },
    { n: 3, name: 'The House of Speech', sign: 'Gemini', area: 'language, siblings, the near world',
      text: 'The Third House is the street you grew up on. It governs speech, learning, letters, short journeys, and brothers and sisters. Gemini by nature, it is the mind at its most immediate.',
      bodies: 'An astral body here speaks. It enters your language and your daily traffic.', signs: 'The sign here colors how you think out loud.' },
    { n: 4, name: 'The House of Foundations', sign: 'Cancer', area: 'home, lineage, the root',
      text: 'The Fourth House is the floor beneath the house. It holds family, ancestry, the place you come from, and the private self no visitor sees. Cancer by nature, it keeps what was felt early.',
      bodies: 'An astral body here works underground. It shapes the interior and the inheritance.', signs: 'The sign here describes the emotional weather of home.' },
    { n: 5, name: 'The House of Play', sign: 'Leo', area: 'creation, romance, children, delight',
      text: 'The Fifth House is where something is made for the joy of making it. It governs love affairs, children, performance, and play. Leo by nature, it is the self spilling over into what it creates.',
      bodies: 'An astral body here wants to be expressed and enjoyed.', signs: 'The sign here reveals what delight looks like for you.' },
    { n: 6, name: 'The House of Daily Work', sign: 'Virgo', area: 'labor, habit, health, service',
      text: 'The Sixth House is the ordinary day. It governs work as it is actually done, the body as it is actually kept, routine, and service. Virgo by nature, it is small repeated acts becoming a life.',
      bodies: 'An astral body here shows up in your habits and in your health.', signs: 'The sign here colors your relationship to duty.' },
    { n: 7, name: 'The House of the Other', sign: 'Libra', area: 'partnership, contracts, the mirror',
      text: 'The Seventh House is the person across from you. It governs marriage, partnership, agreements, and open opposition. Libra by nature, it reveals what you meet in another and cannot see in yourself.',
      bodies: 'An astral body here arrives through other people.', signs: 'The sign here describes who you are drawn to and how you meet them.' },
    { n: 8, name: 'The House of Passage', sign: 'Scorpio', area: 'death, intimacy, shared resources, transformation',
      text: 'The Eighth House is the door you go through and do not come back the same. It governs deep intimacy, inheritance, debt, other people\u2019s money, and endings that remake you. Scorpio by nature, it deals in what cannot be kept.',
      bodies: 'An astral body here goes through change and takes you with it.', signs: 'The sign here reveals how you handle surrender and shared power.' },
    { n: 9, name: 'The House of the Horizon', sign: 'Sagittarius', area: 'belief, distance, study, meaning',
      text: 'The Ninth House is the far view. It governs philosophy, faith, higher study, long journeys, and the frameworks you make sense of things with. Sagittarius by nature, it is the search itself.',
      bodies: 'An astral body here becomes part of what you believe.', signs: 'The sign here reveals the shape of your seeking.' },
    { n: 10, name: 'The House of the Path', sign: 'Capricorn', area: 'vocation, reputation, standing',
      text: 'The Tenth House is the top of the chart, the most public point. It governs vocation, authority, reputation, and what you are recognized for. Capricorn by nature, it is built rather than granted.',
      bodies: 'An astral body here becomes visible as your role in the world.', signs: 'The sign on this cusp is the Midheaven, the direction of the path.' },
    { n: 11, name: 'The House of the Many', sign: 'Aquarius', area: 'friendship, community, hopes',
      text: 'The Eleventh House is the circle you choose. It governs friends, allies, groups, and the future you are working toward with others. Aquarius by nature, it belongs to the many rather than the one.',
      bodies: 'An astral body here arrives through community and shared aims.', signs: 'The sign here reveals what kind of company you keep.' },
    { n: 12, name: 'The House of Dissolution', sign: 'Pisces', area: 'solitude, the unseen, release',
      text: 'The Twelfth House is the room with no lamp. It governs solitude, dreams, what is hidden from you as much as from others, and what must be released. Pisces by nature, it has no clear edges.',
      bodies: 'An astral body here works out of sight, often felt before it is understood.', signs: 'The sign here reveals what you meet in the dark and in retreat.' }
  ];

  /* ---------- the astral bodies ---------- */
  var ASTRAL_BODIES = [
    { name: 'Sun', glyph: '\u2609', rhythm: 'one turn of the year', dignity: 'Leo', detriment: 'Aquarius', exaltation: 'Aries', fall: 'Libra',
      text: 'The Sun is the heart of the chart. It does not orbit; it holds the center. It reveals what you are becoming, what you cannot help but express, and what warms you from within.',
      sign: 'The sign shows the manner of shining.', house: 'The house shows the room the light falls in.', aspect: 'Aspects to the Sun touch identity itself, which is why they are felt as personal.' },
    { name: 'Moon', glyph: '\u263D', rhythm: 'a little under a month', dignity: 'Cancer', detriment: 'Capricorn', exaltation: 'Taurus', fall: 'Scorpio',
      text: 'The Moon is the body\u2019s memory. She governs need, mood, and the instinct that moves before thought. Where the Sun reveals what you are becoming, the Moon holds what already soothes you.',
      sign: 'The sign shows what feeling reaches for.', house: 'The house shows where comfort is sought.', aspect: 'Aspects to the Moon are felt in the nervous system before they are named.' },
    { name: 'Mercury', glyph: '\u263F', rhythm: 'never far from the Sun', dignity: 'Gemini and Virgo', detriment: 'Sagittarius and Pisces', exaltation: 'Virgo', fall: 'Pisces',
      text: 'Mercury carries messages. He governs speech, thought, hands, commerce, and the crossing of thresholds. He is neither warm nor cold on his own; he takes the temperature of what he stands beside.',
      sign: 'The sign shows the style of thought.', house: 'The house shows what you keep thinking about.', aspect: 'Aspects to Mercury shape how the mind moves, and how easily it says what it means.' },
    { name: 'Venus', glyph: '\u2640', rhythm: 'close to the Sun, in a slow cycle of appearances', dignity: 'Taurus and Libra', detriment: 'Aries and Scorpio', exaltation: 'Pisces', fall: 'Virgo',
      text: 'Venus reveals what you are drawn toward. She governs love, beauty, worth, and the pleasure of the senses. She is the measure of harmony: what belongs with what, and how much is enough.',
      sign: 'The sign shows the taste.', house: 'The house shows where beauty and value are sought.', aspect: 'Aspects to Venus color affection, and what you believe you deserve.' },
    { name: 'Mars', glyph: '\u2642', rhythm: 'about two years', dignity: 'Aries and Scorpio', detriment: 'Libra and Taurus', exaltation: 'Capricorn', fall: 'Cancer',
      text: 'Mars is the will made physical. He governs desire, anger, courage, and the act of cutting. He reveals how you go after what you want, and what you do when you are thwarted.',
      sign: 'The sign shows the style of action.', house: 'The house shows the field of the fight.', aspect: 'Aspects to Mars shape how force is used and how anger arrives.' },
    { name: 'Jupiter', glyph: '\u2643', rhythm: 'about twelve years, a year to a sign', dignity: 'Sagittarius and Pisces', detriment: 'Gemini and Virgo', exaltation: 'Cancer', fall: 'Capricorn',
      text: 'Jupiter widens whatever he touches. He governs meaning, faith, fortune, teaching, and excess. He is generous without discrimination, which is why his gifts sometimes need a limit set around them.',
      sign: 'The sign shows the flavor of abundance.', house: 'The house shows where life is inclined to open.', aspect: 'Aspects to Jupiter enlarge. That is help in one light and inflation in another.' },
    { name: 'Saturn', glyph: '\u2644', rhythm: 'about twenty-nine years, and a return near thirty', dignity: 'Capricorn and Aquarius', detriment: 'Cancer and Leo', exaltation: 'Libra', fall: 'Aries',
      text: 'Saturn is time, limit, and consequence. He governs structure, discipline, and the slow earning of authority. What he touches comes late and stays, and the delay is the instruction.',
      sign: 'The sign shows the nature of the discipline.', house: 'The house shows where the weight is carried.', aspect: 'Aspects to Saturn slow, test, and eventually strengthen.' },
    { name: 'Uranus', glyph: '\u2645', rhythm: 'about eighty-four years, seven to a sign', dignity: 'Aquarius', detriment: 'Leo', exaltation: 'Scorpio', fall: 'Taurus',
      text: 'Uranus interrupts. He governs sudden knowing, deviation, invention, and the freedom that arrives by breaking something. He does not negotiate with what is established.',
      sign: 'The sign shows what a generation refuses.', house: 'The house shows where your life will not sit still.', aspect: 'Aspects to Uranus bring the unexpected and the ungovernable.' },
    { name: 'Neptune', glyph: '\u2646', rhythm: 'about one hundred sixty-five years, fourteen to a sign', dignity: 'Pisces', detriment: 'Virgo', exaltation: 'Leo', fall: 'Aquarius',
      text: 'Neptune dissolves the edge. He governs longing, imagination, devotion, glamour, and illusion. What he touches becomes both more beautiful and less certain.',
      sign: 'The sign shows a generation\u2019s dream.', house: 'The house shows where you are prone to enchantment.', aspect: 'Aspects to Neptune soften the outline. Read them twice before believing them once.' },
    { name: 'Pluto', glyph: '\u2647', rhythm: 'about two hundred forty-eight years, unevenly through the signs', dignity: 'Scorpio', detriment: 'Taurus', exaltation: 'none traditionally assigned', fall: 'none traditionally assigned',
      text: 'Pluto strips a thing to what will survive. He governs power, compulsion, buried material, and change that is not reversible. His work is slow and it does not ask.',
      sign: 'The sign shows what an era must face.', house: 'The house shows where you are remade.', aspect: 'Aspects to Pluto intensify and expose. What they touch does not stay hidden.' }
  ];

  /* ---------- asteroids and points ---------- */
  var POINTS = [
    { name: 'Chiron', glyph: '\u26B7', text: 'The wound that becomes wisdom. The place where you were pierced, and through that opening, light enters. Chiron shows what cannot be fully healed and can be made useful to others.' },
    { name: 'Ceres', glyph: '\u26B3', text: 'The rhythm of nurture, of loss and return, of what feeds and what is fed. Ceres reveals how you care and how you grieve what is taken.' },
    { name: 'Pallas', glyph: '\u26B4', text: 'The pattern-seer. The strategist who recognizes what others overlook. Pallas reveals the shape of your intelligence when it is put to use.' },
    { name: 'Juno', glyph: '\u26B5', text: 'The vow. Not merely partnership, but the commitment that tests and refines. Juno reveals what you require of union, and what you will tolerate for it.' },
    { name: 'Vesta', glyph: '\u26B6', text: 'The hearth. What you tend without payment, what burns quietly in the center of your life. Vesta reveals the devotion you keep whether or not it is witnessed.' },
    { name: 'North Node', glyph: '\u260A', text: 'The direction of growth. What calls you forward, unfamiliar and necessary. The Node is not a talent; it is an appetite you have not yet fed.' },
    { name: 'South Node', glyph: '\u260B', text: 'The ground you have already walked. The gift you bring and the habit you must release. It is easy here, and easy is the trap.' }
  ];

  /* ---------- aspects ---------- */
  var ASPECTS = [
    { name: 'Conjunction', angle: '0 degrees', text: 'Two astral bodies dwell in the same breath. Their qualities merge, for better or deeper. They cannot be separated in the reading.' },
    { name: 'Sextile', angle: '60 degrees', text: 'An opening. A door that invites but does not compel. Opportunity, if you choose to walk through it.' },
    { name: 'Square', angle: '90 degrees', text: 'Tension that builds. Two forces pulling in different directions, each necessary, each demanding integration.' },
    { name: 'Trine', angle: '120 degrees', text: 'Flow. What comes easily, perhaps too easily. The gift that risks being taken for granted.' },
    { name: 'Opposition', angle: '180 degrees', text: 'The mirror. The other that completes and confronts. Relationship as teacher.' }
  ];
  var ORBS = {
    what: 'An aspect is rarely exact. The orb is the range within which the conversation between two astral bodies remains audible.',
    how: 'The closer the two stand to the exact angle, the louder the exchange. Within a degree or two it is unmistakable. Toward the edge of the orb it is a murmur you may only recognize afterward.',
    custom: 'The tradition allows wider orbs for the Sun and Moon and narrower ones for the slower bodies, and honest readers disagree about the exact limits.'
  };

  /* ---------- the birth chart ---------- */
  var CHART = {
    what: 'A map of the sky at your first breath. Not a fate, but a field of possibilities.',
    wheel: 'Read the wheel as a building. The houses are rooms, the signs are the atmosphere in each room, and the astral bodies are the guests who arrived and stayed.',
    angles: [
      ['Ascendant', 'The mask. The eastern horizon at your first breath, and the way you are met before you speak.'],
      ['Descendant', 'The mirror. The point opposite the Ascendant, where you meet the other.'],
      ['Midheaven', 'The path. The highest point of the chart, and what you are recognized for.'],
      ['Imum Coeli', 'The root. The lowest point, the private foundation nobody visits.']
    ],
    steps: [
      ['Find the Ascendant', 'This is where the chart begins. It sits at the left edge of the wheel and sets the atmosphere for everything else.'],
      ['Follow the houses', 'They move counterclockwise from the Ascendant, one room at a time, twelve in all.'],
      ['Notice the signs on each cusp', 'The sign at the edge of a house colors what happens inside it.'],
      ['Find the astral bodies', 'They are the actors. Note which house holds each one, and which sign it dwells in.'],
      ['Notice the aspects', 'The lines across the wheel reveal which astral bodies are in conversation, and in what tone.'],
      ['Weigh the emphasis', 'Look for a gathering: several bodies in one sign or one house. The chart leans there.'],
      ['Synthesize', 'Ask what story emerges. A chart that does not sound like a life you recognize has been read too literally.']
    ]
  };

  var SABIAN = {
    what: 'The Sabian Symbols are 360 images, one for each degree of the zodiac, received by Elsie Wheeler and set down by Marc Edmund Jones in 1925. They are not measurements; they are glimpses. Each degree carries a scene, a moment, a possibility that invites contemplation.',
    use: 'Do not force meaning. Let the image speak. The symbol for your Sun degree is not a definition; it is a door.',
    caution: 'A degree image is a prompt. What it means is settled by what you notice afterward, not by the picture itself.'
  };

  var STELLIUM = {
    what: 'A gathering. Three or more astral bodies in the same sign or house, concentrating their conversation in one room. The chart leans here. The life returns here, again and again, until what is concentrated is understood.',
    read: 'Notice which house holds the gathering. That is where the energy pools. Notice the sign; that is the quality of the pool. The stellium does not demand; it invites attention.',
    caution: 'Concentration is not destiny. It may mean this is where you carry the most force and the least perspective. Your own record is the test.'
  };

  var TRANSITS = {
    personal: 'The moving astral bodies touching your natal chart. A conversation between what is now and what was then.',
    sky: 'The patterns in the sky themselves, independent of your chart. The weather that falls on everyone.',
    read: 'A transit does not cause; it reveals. It opens a window. What you see through it depends on where you stand.',
    timing: 'The swift bodies pass in hours or days. The slow ones stay for months and are better read as a season than an event.'
  };

  var SYNASTRY = {
    what: 'The comparison of two charts. Not compatibility in the simple sense, but the map of what happens when two fields of possibility meet.',
    read: 'Look first at where your astral bodies fall in their houses. Then where theirs fall in yours. The aspects between your astral bodies reveal the nature of the conversation.',
    caution: 'Two charts cannot tell you whether to stay. They can tell you what you keep running into, which is more useful and less flattering.'
  };

  /* ---------- an example chart, for teaching only ---------- */
  var EXAMPLE = {
    note: 'This chart belongs to nobody. It exists so you can practice reading before you read your own.',
    facts: [
      ['Ascendant', 'Libra at 12 degrees, so the chart begins in Libra and the first room carries the quality of weighing.'],
      ['Sun', 'Capricorn at 4 degrees, in the fourth house.'],
      ['Moon', 'Gemini at 21 degrees, in the ninth house.'],
      ['Mercury', 'Capricorn at 26 degrees, in the fourth house.'],
      ['Venus', 'Sagittarius at 9 degrees, in the third house.'],
      ['Mars', 'Aries at 18 degrees, in the seventh house.'],
      ['Jupiter', 'Taurus at 2 degrees, in the eighth house.'],
      ['Saturn', 'Capricorn at 11 degrees, in the fourth house.'],
      ['Midheaven', 'Cancer at 14 degrees.'],
      ['Gathering', 'Sun, Mercury, and Saturn in Capricorn in the fourth house: a stellium.'],
      ['Aspects', 'Sun conjunct Saturn within seven degrees. Moon opposite Venus within twelve. Mars square the Capricorn group.']
    ],
    steps: [
      ['Find the Ascendant', 'Libra rising. This person is met as even, courteous, and difficult to provoke on first meeting.'],
      ['Follow the houses', 'From Libra the rooms run counterclockwise, which places Capricorn on the fourth: home, lineage, the private foundation.'],
      ['Read the signs on the cusps', 'Cancer sits on the Midheaven, so the public path carries a protective, caretaking quality even though the interior is Capricorn.'],
      ['Find the astral bodies', 'Three bodies gather in the fourth house. The chart is weighted toward family, inheritance, and the foundation the person is standing on.'],
      ['Read the aspects', 'Sun conjunct Saturn says identity and duty arrived together. Mars in the seventh, square that gathering, says other people press on it.'],
      ['Notice the gathering', 'The Capricorn stellium in the fourth is the loudest feature. Whatever else is true, life keeps returning to home and obligation.'],
      ['Weigh what is missing', 'Only one water placement and no fire below the horizon. Ease is not the theme; endurance is.'],
      ['Synthesize', 'A courteous exterior over a serious interior, built early, tested through partnership. Say it in one sentence, then check it against a life. If it does not fit, the reading is wrong, not the life.']
    ]
  };

  function signByName(n) { for (var i = 0; i < SIGNS.length; i++) { if (SIGNS[i].name === n) return SIGNS[i]; } return null; }
  function house(n) { return HOUSES[n - 1] || null; }
  function astralBody(n) { for (var i = 0; i < ASTRAL_BODIES.length; i++) { if (ASTRAL_BODIES[i].name === n) return ASTRAL_BODIES[i]; } return null; }
  function point(n) { for (var i = 0; i < POINTS.length; i++) { if (POINTS[i].name === n) return POINTS[i]; } return null; }
  function aspect(n) {
    var k = String(n || '').toLowerCase();
    for (var i = 0; i < ASPECTS.length; i++) { if (ASPECTS[i].name.toLowerCase().indexOf(k) === 0) return ASPECTS[i]; }
    if (k === 'opposite') return aspect('opposition');
    return null;
  }

  return { VERSION: VERSION, SECTIONS: SECTIONS, INTRO: INTRO, SIGNS: SIGNS, HOUSES: HOUSES,
    ASTRAL_BODIES: ASTRAL_BODIES, POINTS: POINTS, ASPECTS: ASPECTS, ORBS: ORBS, CHART: CHART, SABIAN: SABIAN,
    STELLIUM: STELLIUM, TRANSITS: TRANSITS, SYNASTRY: SYNASTRY, EXAMPLE: EXAMPLE,
    sign: signByName, house: house, astralBody: astralBody, point: point, aspect: aspect };
}));
