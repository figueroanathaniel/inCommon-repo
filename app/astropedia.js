/* astropedia.js: inCommon astrological reference. V1.1.0
   Pure reference. Nothing here reads or writes a profile, and nothing here knows
   anyone's birth moment. It is the language, not the reading: the twelve signs,
   the twelve houses, the celestial bodies, the points, the aspects, and how a chart is
   read. Gendered descriptions are tendencies the tradition reports, never rules
   about people, and the app presents them under a POSSIBILITY tag.
   Voice: organic and scholarly. No em dashes.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Astropedia = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '1.2.0';

  var SECTIONS = [
    ['signs', 'The Twelve Signs'],
    ['houses', 'The Twelve Houses'],
    ['housesystems', 'House Systems'],
    ['bodies', 'The Celestial Bodies'],
    ['points', 'The Asteroids and Points'],
    ['aspects', 'Aspects'],
    ['concepts', 'Astrological Concepts'],
    ['chart', 'The Birth Chart'],
    ['sabian', 'Sabian Symbols'],
    ['stellium', 'Stellium'],
    ['transits', 'Transits'],
    ['techniques', 'Other Techniques'],
    ['synastry', 'Synastry'],
    ['example', 'An Example Chart']
  ];

  var INTRO = {
    what: 'Astropedia is a reference, not a reading. It holds the language the tradition speaks in: the signs as atmospheres, the houses as rooms, the celestial bodies as guests, and the aspects as the conversation between them.',
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
      bodies: 'A celestial body here is worn in public. It colors how you are met before you have said anything.',
      signs: 'The sign on this cusp is the Ascendant, and it sets the atmosphere of the whole chart.' },
    { n: 2, name: 'The House of Substance', sign: 'Taurus', area: 'resources, worth, what is held',
      text: 'The Second House is the storehouse. It holds what is yours: money, possessions, talents, and the quieter matter of what you believe you are worth. Taurus by nature, it measures value by what can be kept.',
      bodies: 'A celestial body here shapes how you earn, spend, and value.', signs: 'The sign here reveals the manner of holding: generous, cautious, restless, or exacting.' },
    { n: 3, name: 'The House of Speech', sign: 'Gemini', area: 'language, siblings, the near world',
      text: 'The Third House is the street you grew up on. It governs speech, learning, letters, short journeys, and brothers and sisters. Gemini by nature, it is the mind at its most immediate.',
      bodies: 'A celestial body here speaks. It enters your language and your daily traffic.', signs: 'The sign here colors how you think out loud.' },
    { n: 4, name: 'The House of Foundations', sign: 'Cancer', area: 'home, lineage, the root',
      text: 'The Fourth House is the floor beneath the house. It holds family, ancestry, the place you come from, and the private self no visitor sees. Cancer by nature, it keeps what was felt early.',
      bodies: 'A celestial body here works underground. It shapes the interior and the inheritance.', signs: 'The sign here describes the emotional weather of home.' },
    { n: 5, name: 'The House of Play', sign: 'Leo', area: 'creation, romance, children, delight',
      text: 'The Fifth House is where something is made for the joy of making it. It governs love affairs, children, performance, and play. Leo by nature, it is the self spilling over into what it creates.',
      bodies: 'A celestial body here wants to be expressed and enjoyed.', signs: 'The sign here reveals what delight looks like for you.' },
    { n: 6, name: 'The House of Daily Work', sign: 'Virgo', area: 'labor, habit, health, service',
      text: 'The Sixth House is the ordinary day. It governs work as it is actually done, the body as it is actually kept, routine, and service. Virgo by nature, it is small repeated acts becoming a life.',
      bodies: 'A celestial body here shows up in your habits and in your health.', signs: 'The sign here colors your relationship to duty.' },
    { n: 7, name: 'The House of the Other', sign: 'Libra', area: 'partnership, contracts, the mirror',
      text: 'The Seventh House is the person across from you. It governs marriage, partnership, agreements, and open opposition. Libra by nature, it reveals what you meet in another and cannot see in yourself.',
      bodies: 'A celestial body here arrives through other people.', signs: 'The sign here describes who you are drawn to and how you meet them.' },
    { n: 8, name: 'The House of Passage', sign: 'Scorpio', area: 'death, intimacy, shared resources, transformation',
      text: 'The Eighth House is the door you go through and do not come back the same. It governs deep intimacy, inheritance, debt, other people\u2019s money, and endings that remake you. Scorpio by nature, it deals in what cannot be kept.',
      bodies: 'A celestial body here goes through change and takes you with it.', signs: 'The sign here reveals how you handle surrender and shared power.' },
    { n: 9, name: 'The House of the Horizon', sign: 'Sagittarius', area: 'belief, distance, study, meaning',
      text: 'The Ninth House is the far view. It governs philosophy, faith, higher study, long journeys, and the frameworks you make sense of things with. Sagittarius by nature, it is the search itself.',
      bodies: 'A celestial body here becomes part of what you believe.', signs: 'The sign here reveals the shape of your seeking.' },
    { n: 10, name: 'The House of the Path', sign: 'Capricorn', area: 'vocation, reputation, standing',
      text: 'The Tenth House is the top of the chart, the most public point. It governs vocation, authority, reputation, and what you are recognized for. Capricorn by nature, it is built rather than granted.',
      bodies: 'A celestial body here becomes visible as your role in the world.', signs: 'The sign on this cusp is the Midheaven, the direction of the path.' },
    { n: 11, name: 'The House of the Many', sign: 'Aquarius', area: 'friendship, community, hopes',
      text: 'The Eleventh House is the circle you choose. It governs friends, allies, groups, and the future you are working toward with others. Aquarius by nature, it belongs to the many rather than the one.',
      bodies: 'A celestial body here arrives through community and shared aims.', signs: 'The sign here reveals what kind of company you keep.' },
    { n: 12, name: 'The House of Dissolution', sign: 'Pisces', area: 'solitude, the unseen, release',
      text: 'The Twelfth House is the room with no lamp. It governs solitude, dreams, what is hidden from you as much as from others, and what must be released. Pisces by nature, it has no clear edges.',
      bodies: 'A celestial body here works out of sight, often felt before it is understood.', signs: 'The sign here reveals what you meet in the dark and in retreat.' }
  ];

  /* ---------- the celestial bodies ---------- */
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
    { name: 'South Node', glyph: '\u260B', text: 'The ground you have already walked. The gift you bring and the habit you must release. It is easy here, and easy is the trap.' },
    { name: 'Black Moon Lilith', glyph: '\u26B8', text: 'Lilith is not a body but a mathematical point: the empty focus of the Moon\u2019s elliptical orbit, the place where nothing sits. The tradition reads her as what the culture around you asked you to leave out of the story, the appetite or refusal that does not apologize for itself. Where she falls is less a wound than a place you were told not to look, and looked anyway.' },
    { name: 'Part of Fortune', glyph: '\u2297', text: 'The Part of Fortune is calculated, not observed: Ascendant plus Moon minus Sun by day, the reverse by night, folded back into the wheel as a point rather than a body. The oldest of the Arabic Parts, and the only one most modern charts still carry. The tradition reads it as the place ease is available without having earned it first, which is also why it is the placement people are quickest to argue about.' },
    { name: 'Vertex', glyph: 'Vx', text: 'The Vertex is the second intersection of the ecliptic with the prime vertical, the geometric twin of the Ascendant that opens westward instead of east. It has no classical pedigree; it is a twentieth century addition to the tradition, and it stayed in use because synastry contacts to it tend to read as encounters that felt arranged rather than chosen. Treat it as a minor point, not a fifth angle.' }
  ];

  /* ---------- aspects ---------- */
  var ASPECTS = [
    { name: 'Conjunction', angle: '0 degrees', text: 'Two celestial bodies dwell in the same breath. Their qualities merge, for better or deeper. They cannot be separated in the reading.' },
    { name: 'Sextile', angle: '60 degrees', text: 'An opening. A door that invites but does not compel. Opportunity, if you choose to walk through it.' },
    { name: 'Square', angle: '90 degrees', text: 'Tension that builds. Two forces pulling in different directions, each necessary, each demanding integration.' },
    { name: 'Trine', angle: '120 degrees', text: 'Flow. What comes easily, perhaps too easily. The gift that risks being taken for granted.' },
    { name: 'Opposition', angle: '180 degrees', text: 'The mirror. The other that completes and confronts. Relationship as teacher.' }
  ];
  var ORBS = {
    what: 'An aspect is rarely exact. The orb is the range within which the conversation between two celestial bodies remains audible.',
    how: 'The closer the two stand to the exact angle, the louder the exchange. Within a degree or two it is unmistakable. Toward the edge of the orb it is a murmur you may only recognize afterward.',
    custom: 'The tradition allows wider orbs for the Sun and Moon and narrower ones for the slower bodies, and honest readers disagree about the exact limits.'
  };

  /* ---------- astrological concepts ---------- */
  var CONCEPTS = [
    { name: 'Elements', text: 'Fire, earth, air, and water sort the twelve signs into four temperaments, three signs each. Fire acts before it thinks. Earth builds before it speaks. Air names before it feels. Water feels before it can say what it is feeling. A chart heavy in one element leans that way by default; a chart missing one tends to import it through other people, since a quality that finds no expression at home usually finds one somewhere else.' },
    { name: 'Modalities', text: 'Cardinal, fixed, and mutable sort the twelve signs into three postures toward change, four signs each. Cardinal signs start things, at the four points where a season turns. Fixed signs hold what cardinal signs began, at the point a season is most itself. Mutable signs let a season go, at the point it is already turning into the next one. A chart can lean toward starting, sustaining, or releasing before it says anything else about itself.' },
    { name: 'Essential Dignity', text: 'Dignity is the old accounting of how well a celestial body is suited to the sign it stands in, independent of anything else in the chart. Rulership and exaltation are the strong seats, where the body is understood on its own terms. Detriment and fall are the weak seats, the sign opposite, where it has to work through terms someone else set. Weak is not broken: a body in detriment or fall still does its work, it simply has to negotiate for it rather than assume it.' },
    { name: 'Angular, Succedent, and Cadent Houses', text: 'The twelve houses fall into three groups of four by their relation to the angles. Angular houses, the first, fourth, seventh, and tenth, sit right on the Ascendant, IC, Descendant, and Midheaven, and are read as the most forceful, where a placement acts directly on a life. Succedent houses, the second, fifth, eighth, and eleventh, follow the angles and consolidate what they started, read as resources built rather than events. Cadent houses, the third, sixth, ninth, and twelfth, fall away from the angles and are read as processing houses: information, adjustment, and the work of making sense of what already happened.' },
    { name: 'Chart Ruler', text: 'The chart ruler is the traditional ruler of the sign on the Ascendant: Mars if Aries rises, Venus if Taurus rises, and so on through the wheel. Wherever that body sits by house and sign is read as a summary of the whole chart’s business, since it is the one placement bound to the exact degree the person was born on. A house works the same way in miniature: whichever sign sits on its cusp hands the room to that sign’s ruler, and the room is read through wherever the ruler actually stands.' },
    { name: 'Decans', text: 'Each thirty degree sign divides into three ten degree decans. They began in Egypt as thirty six groups of stars, one rising at dawn every ten days and each marking an hour of the night, painted on coffin lids from about the twenty first century BCE. Hellenistic astrology set three in every sign. Firmicus Maternus gives the faces in the order most Western astrology still uses: Mars, the Sun and Venus in Aries, then Mercury, the Moon and Saturn in Taurus, the seven classical bodies running on in one unbroken order without regard for each sign’s own ruler. Parashara counts the same ten degrees another way, through the signs of the element: the first decan belongs to the sign itself, the second to the next sign of its element and the third to the one after, so Aries runs Aries, Leo, Sagittarius. Manilius gives them to signs rather than to bodies: Aries keeps its first ten degrees, gives the next ten to Taurus and the last to Gemini, and the count runs on through the signs in order, with Pisces keeping its own last ten. The Golden Dawn set the small cards of the tarot, the Twos to the Tens, on the same Chaldean faces, and began the count at Leo: the Five of Wands is Saturn in Leo, and the Two of Wands is Mars in Aries. The chart keeps the faces and the drekkanas, because both are a living tradition. The opening decan carries the sign raw and unmixed, before anything has tested it. The middle decan is the sign at work, applied and made productive. The closing decan is the sign matured, already leaning toward whatever comes next. A decan does not replace the sign; it narrows it, the way an accent narrows a language without changing which language it is.' },
    { name: 'Retrograde Motion', text: 'A body in retrograde slows, stands still, and walks backward through the zodiac for a season, then turns forward again. The tradition reads that season as a turn inward, the same business as always, handled in review rather than in advance. The days on either side of the turn, the stations, are read as the loudest part of the whole passage.' },
    { name: 'Void of Course Moon', text: 'A Moon is void of course from the moment it makes its last aspect to another body before leaving its current sign until the moment it enters the next one. In that gap the tradition reads her as unattached, between rooms rather than in one, and reads action started there as more likely to drift or come to nothing than action started once she has landed. It is a weather report, not a lock on the day: plenty gets done under a void Moon, it simply tends to wander from the plan.' },
    { name: 'Combust and Cazimi', text: 'A body within about eight degrees of the Sun is combust, read as overpowered by proximity to the one light no other body can outshine, its own signal harder to hear under the glare. Inside about seventeen minutes of exact conjunction the same closeness flips: the body is cazimi, in the heart of the Sun rather than burned by it, and the tradition reads that narrow window as strength rather than loss. The difference between the two readings is almost entirely a matter of degrees.' },
    { name: 'Mutual Reception', text: 'Two bodies are in mutual reception when each sits in the sign the other rules, Mars in Cancer while the Moon sits in Aries, say. The tradition treats it as a kind of hospitality: each body is a guest in the other’s house, and each is understood well enough by its host to be handed a working key rather than left to manage as a stranger. It softens a difficult placement more reliably than almost anything else in the traditional toolkit.' },
    { name: 'Out of Bounds', text: 'The Sun never travels more than about twenty three and a half degrees north or south of the celestial equator, the same limit that marks the tropics. A body that travels beyond that limit in declination, most often the Moon, is out of bounds: outside the Sun’s own range, answering to no seasonal authority. The tradition reads it as a placement that will not be governed by the ordinary rules, for better and for worse.' },
    { name: 'Peregrine', text: 'A body is peregrine when it holds no essential dignity at all in the sign it occupies: not ruling, not exalted, not in detriment, not in fall, a traveler with no lodging arranged anywhere in the sign. The tradition reads it as unpredictable rather than weak exactly, since a peregrine body answers to no local authority and can act on its own terms undirected, which is a different problem than being overpowered.' },
    { name: 'Sect', text: 'Every chart is read as either a day chart or a night chart, decided by whether the Sun sits above or below the horizon at the moment in question. Day charts favor the Sun, Jupiter, and Saturn as their sect’s own team; night charts favor the Moon, Venus, and Mars. A body of its own sect is read as working with more ease and self possession than the same body would show in the opposite chart, a distinction the older tradition weighed as heavily as sign or house.' },
    { name: 'Intercepted Signs', text: 'Except under equal house division, houses vary in size, and an unusually wide house can enclose an entire sign between its cusps without that sign ever touching either edge. That sign is intercepted, present in the chart but given no doorway of its own, and the sign opposite it in the neighboring house is intercepted too. The tradition reads an intercepted sign as a quality the person carries but was not handed an obvious entrance to, something to be found rather than simply used.' },
    { name: 'Fixed Stars', text: 'Beyond the moving bodies and the zodiac they travel, a handful of fixed stars close to the ecliptic have carried their own reputations since antiquity: Regulus for a certain kind of public fortune, Algol for a severity the tradition treats with real caution, Spica for a grace that arrives already finished. They are used sparingly, by conjunction to a personal point within about a degree, since a chart read through every fixed star ever cataloged stops saying anything in particular.' },
    { name: 'Star Clusters', text: 'A star cluster is a crowd of stars born together and still travelling together, and the tradition read the brightest of them as single lights with natures of their own. Ptolemy names five: the Pleiades in Taurus, like the Moon and Jupiter; the Hyades in its head, like Saturn and, more gently, Mercury, with one bright reddish star among them, the Torch, like Mars; Praesepe, the misty manger in the breast of the Crab, like Mars and the Moon; the Hair of Berenice, like the Moon and Venus; and the cluster in the hilt of the sword of Perseus, the Double Cluster, like Mars and Mercury. A cluster barely moves against the stars, so its zodiacal degree creeps forward only by precession, about fifty seconds of arc a year: the Pleiades stood near the end of Taurus in 2000 and stand there still, a little further on. They are read as fixed stars are, by conjunction to a body or an angle within a degree or so, and the chart gives each the same narrow welcome: a cluster joins nothing at a wider angle.' },
    { name: 'Eclipses', text: 'Every month the Moon meets the Sun and every month it opposes it, and most of those lunations miss each other’s shadow, because the Moon’s path is tilted about five degrees against the Sun’s and the two only cross at the lunar nodes. When a New Moon or Full Moon happens close enough to one of those crossings, the shadow lands: a solar eclipse is a New Moon with the light taken out of it, a beginning insisted upon rather than argued with; a lunar eclipse is a Full Moon that goes dark at its height, a revelation arriving whether or not it was wanted. Eclipses arrive in pairs and clusters rather than at random, and the tradition reads them as turned up in volume, not as a different kind of event.' },
    { name: 'Aspect Patterns', text: 'Three or more aspects can lock together into a shape the tradition reads as a unit rather than as separate contacts. A grand trine links three bodies by trine into a closed triangle, a flow so complete it can run without friction and without much effort either. A T square sets two bodies in opposition with a third squaring them both, a pressure point that usually becomes the chart’s engine. A yod links two bodies in sextile, both quincunx a third, a narrow channel the tradition calls the finger of fate, more a persistent adjustment than a fate exactly. A grand cross squares four bodies around the wheel in two oppositions, the T square’s tension on every side at once, exhausting to carry and hard to set down.' }
  ];

  /* ---------- house systems ----------
     How the twelve houses are cut. Origins follow the Astrodienst overview of
     house systems and the Skyscript glossary entry on house division; where
     the two disagree the entry says so. Sources are listed in
     docs/astro-upgrade/01-house-systems-sources.md. The key is the one
     house-systems.js and the app store. */
  var HOUSE_SYSTEMS_INTRO = 'Every system agrees on what the twelve houses mean and disagrees on where each one begins. Some cut the zodiac itself, some cut the sky around the birthplace, and some cut the time a degree takes to rise. Whole Sign is where inCommon starts, and any system here can be the one the chart is drawn in: the wheel, the house pages, the placements and the Oracle all follow the choice.';
  var HOUSE_SYSTEMS = [
    { key: 'W', name: 'Whole Sign', kind: 'Sign based', origin: 'In use since antiquity.',
      text: 'The whole sign that holds the Ascendant is the first house, the next sign is the second, and so on round the wheel, so every house is exactly one sign. No cusp falls inside a sign, which is why it is the simplest system to read: a sign and a house are always the same room. The Ascendant and the Midheaven still matter as points, but they float inside their houses rather than marking where one begins. Astrodienst notes it is especially popular in Indian sidereal astrology today.' },
    { key: 'E', name: 'Equal', kind: 'Sign based', origin: 'In use since antiquity.',
      text: 'Each house is thirty degrees of the zodiac, counted from the exact degree of the Ascendant. The first house begins at the Ascendant itself, so the horizon is honoured to the degree, while the Midheaven floats free of the tenth cusp and usually falls in the ninth, tenth or eleventh house.' },
    { key: 'P', name: 'Porphyry', kind: 'Quadrant, space', origin: 'Named after the philosopher Porphyry of the third century. Skyscript traces the method further back, to the second century work of Vettius Valens.',
      text: 'The four angles cut the zodiac into four quadrants, and each quadrant is cut into three equal parts. It is the plainest of the quadrant systems: the angles are cusps, and everything between them is shared out evenly. It is also the system most software draws when Placidus or Koch cannot be computed.' },
    { key: 'O', name: 'Placidus', kind: 'Quadrant, time', origin: 'Named after the monk and mathematician Placidus de Titis (1603 to 1668); Astrodienst credits its invention to Giovanni Antonio Magini (1555 to 1617). Generally considered the most used system in Western astrology today.',
      text: 'Each degree of the zodiac takes its own time to climb from the horizon to the Midheaven. A Placidus cusp is the degree that has covered a third, or two thirds, of its own climb, and the same below the horizon. Because it measures time, it cannot be drawn inside the polar circles, where some degrees never rise or never set; a chart born there is drawn in Porphyry instead.' },
    { key: 'K', name: 'Koch', kind: 'Quadrant, time', origin: 'Named after Walter Koch (1895 to 1970), and also called the birthplace system; Astrodienst credits its invention to Fiedrich Zanzinger and Heinz Specht. Astrodienst calls it time oriented and Skyscript classes it by space.',
      text: 'Koch takes the time the Midheaven degree needs to rise and divides that one span in three, so every cusp is read from the birthplace’s own horizon at a moment along it. It shares Placidus’s limit: inside the polar circles it cannot be drawn, and the chart is drawn in Porphyry instead.' },
    { key: 'R', name: 'Regiomontanus', kind: 'Quadrant, space', origin: 'Named after Regiomontanus, Johannes Müller of Königsberg (1436 to 1476); Astrodienst credits its invention to Abraham ibn Ezra in the twelfth century.',
      text: 'The celestial equator is divided into twelve equal parts, and each division is carried to the zodiac along a great circle through the north and south points of the horizon.' },
    { key: 'C', name: 'Campanus', kind: 'Quadrant, space', origin: 'Named after the mathematician Campanus of Novara (1220 to 1296).',
      text: 'The sky above and below the horizon is cut like an orange into twelve equal segments, measured along the prime vertical, the great circle through the east point, the zenith and the west point. Where a segment’s edge meets the zodiac is the cusp. It divides space as the observer stands in it.' },
    { key: 'A', name: 'Alcabitius', kind: 'Quadrant, time', origin: 'Known by the name of the tenth century astrologer al Qabisi, Alcabitius. Skyscript notes that he popularised it rather than invented it, and that its calculation appears in a chart from 428.',
      text: 'The time the Ascendant degree takes to travel from the horizon to the meridian is divided into three, and the same below the horizon; the cusps are the zodiac degrees on the meridian at each of those moments. Skyscript counts it among the oldest of the time based systems.' },
    { key: 'T', name: 'Topocentric', kind: 'Quadrant, time', origin: 'Devised by Wendel Polich and Anthony Nelson Page, and also called Polich Page.',
      text: 'The cusps come from circles that lean at a third and at two thirds of the birthplace’s latitude. In low and middle latitudes its cusps fall within about a degree of Placidus’s, and unlike Placidus it can be drawn everywhere, though inside the polar circles its houses can come out strange.' },
    { key: 'M', name: 'Morinus', kind: 'Equator', origin: 'Named after the philosopher and astrologer Jean Baptiste Morin, Morinus (1583 to 1656).',
      text: 'The celestial equator is divided into twelve equal parts starting from the meridian, and each part is carried to the zodiac through the poles of the zodiac. The Ascendant is not a cusp in this system, which reads the houses from the turning of the sky rather than from the horizon.' },
    { key: 'X', name: 'Meridian', kind: 'Equator', origin: 'Also called axial rotation.',
      text: 'Like Morinus it divides the equator into twelve equal parts from the meridian, but carries each part to the zodiac through the celestial poles, so the tenth cusp is the Midheaven and the first cusp is not the Ascendant. It can be read as a division of time and of space at once.' }
  ];
  function houseSystem(k) {
    var x = String(k || '');
    for (var i = 0; i < HOUSE_SYSTEMS.length; i++) { if (HOUSE_SYSTEMS[i].key === x || HOUSE_SYSTEMS[i].name.toLowerCase() === x.toLowerCase()) return HOUSE_SYSTEMS[i]; }
    return null;
  }

  /* ---------- the lessons of each chart study ----------
     Asked for by the owner on 5 November 2026: every study that is not the
     plain Western chart teaches its own field, in the order its own schools
     teach it. Each list is ranked by how widely a topic is taught against how
     hard it is to learn; the ranking and every source are in
     docs/astro-upgrade/04-study-education-sources.md. A band names how widely
     the topic is taught, a pace how much it asks of a beginner. Keyed by the
     study keys in chart-traditions.js. */
  var STUDY_LESSONS = {
    vedic: { title: 'Jyotish', glyph: '☾',
      lessons: [
        { name: 'The Nine Grahas', band: 'taught almost everywhere', pace: 'gentle', term: 'Graha, the one who seizes',
          text: "Jyotish reads nine grahas: the Sun, Surya; the Moon, Chandra; Mars, Mangala; Mercury, Budha; Jupiter, Guru; Venus, Shukra; Saturn, Shani; and Rahu and Ketu, the north and south lunar nodes, counted as grahas of shadow because they hold no light of their own. A graha is a seizer, something that takes hold of a life and moves it. The classical list stops at Saturn, the last body the eye can see, so most schools of Jyotish leave Uranus, Neptune and Pluto out of the reading altogether. Every later lesson is a lesson about where these nine stand and what they own." },
        { name: 'The Twelve Rashis', band: 'taught almost everywhere', pace: 'gentle', term: 'Rashi, a heap or measure',
          text: "The twelve signs are the rashis: Mesha, Vrishabha, Mithuna, Karka, Simha, Kanya, Tula, Vrishchika, Dhanu, Makara, Kumbha and Meena, the same twelve Aries to Pisces that Western astrology names, with the same rulers among the seven visible grahas. What differs is where they begin. A rashi is measured against the stars behind it rather than against the seasons, so most of the time a body that Western astrology places late in one sign stands in the sign before it here." },
        { name: 'The Lagna and the Bhavas', band: 'taught almost everywhere', pace: 'gentle', term: 'Bhava, a state of being',
          text: "The rashi rising in the east at birth is the lagna, and it is the first bhava. Each rashi after it is the next bhava, whole sign by whole sign, so a house and a sign are always the same room. The twelve bhavas are often read in four groups of three, by the four aims of a life: dharma, purpose, in the first, fifth and ninth; artha, livelihood, in the second, sixth and tenth; kama, desire, in the third, seventh and eleventh; and moksha, release, in the fourth, eighth and twelfth. The first, fourth, seventh and tenth are the kendras, the pillars of the chart, and the first, fifth and ninth are the trikonas, its blessings." },
        { name: 'The Sidereal Zodiac and the Ayanamsa', band: 'taught almost everywhere', pace: 'steady', term: 'Ayanamsa, the portion of the precession',
          text: "The Earth's axis wobbles slowly, so the point where the Sun crosses the equator each spring drifts backward against the stars by about a degree every seventy two years. Western astrology ties Aries to that crossing; Jyotish ties it to the stars. The gap between the two zodiacs is the ayanamsa, a little over twenty four degrees in our time and still growing. Schools differ on exactly where the starry zodiac begins, and each answer is its own ayanamsa. This chart uses Lahiri, the one India's Calendar Reform Committee adopted in the 1950s and the one most Indian almanacs follow." },
        { name: 'The Nakshatras and Their Padas', band: 'taught almost everywhere', pace: 'steady', term: 'Nakshatra, a lunar mansion',
          text: "Beneath the twelve rashis runs an older division: twenty seven nakshatras of 13 degrees 20 minutes each, about one day of the Moon's travel. Each is named for the stars that mark it, from Ashwini at the start of Mesha to Revati at the end of Meena, and each is divided into four padas of 3 degrees 20 minutes. Every nakshatra has a graha as its lord, in the order the Vimshottari dasha follows. The nakshatra holding the Moon at birth is the birth star, and it carries much of what Western astrology would say about the Moon's sign, only finer." },
        { name: 'The Vimshottari Dasha', band: 'taught almost everywhere', pace: 'steady', term: 'Dasha, a condition or period',
          text: "Jyotish times a life by periods, each ruled by one graha. The Vimshottari cycle lasts one hundred and twenty years and runs in a fixed order: Ketu seven years, Venus twenty, the Sun six, the Moon ten, Mars seven, Rahu eighteen, Jupiter sixteen, Saturn nineteen and Mercury seventeen. A life begins in the period of the lord of the Moon's nakshatra, with only as much of it left as the Moon had still to travel through that nakshatra. Each mahadasha holds nine smaller periods, the antardashas, in the same order, so a season of life always has a main voice and a second one." },
        { name: 'The Panchanga', band: 'taught in most courses', pace: 'steady', term: 'Panchanga, the five limbs',
          text: "The Indian almanac reads every day by five limbs: the tithi, the lunar day, one of thirty steps of twelve degrees between the Sun and the Moon; the vara, the weekday and its graha; the nakshatra the Moon stands in; the yoga, one of twenty seven made from the Sun and the Moon together; and the karana, half a tithi. Together they are the day's own quality, the ground the calendar of festivals and auspicious hours stands on, and the birth panchanga is read as the quality of the day a person arrived in." },
        { name: 'Gochara, the Transits', band: 'taught in most courses', pace: 'steady', term: 'Gochara, the movement of the grahas',
          text: "Transits in Jyotish are read above all from the Moon's rashi rather than from the lagna: the slow malefics passing the third, sixth or eleventh from the Moon are often welcome, and any graha passing the eighth is watched. The best known passage is Saturn's sade sati, the seven and a half years it takes to cross the rashi before the Moon's, the Moon's own and the one after it, read as a long season of maturing under weight. Transits are read together with the dasha running at the time, because the dasha says which grahas have the floor." },
        { name: 'Yogas', band: 'taught in most courses', pace: 'demanding', term: 'Yoga, a joining',
          text: "A yoga is a combination of grahas, bhavas and their lords that the texts read as a single signature. Raja yogas join the lords of a kendra and a trikona and are read for standing; dhana yogas join the lords of the houses of wealth; sanyasa yogas gather several grahas together and are read for renunciation. The classical books list hundreds, and most of the craft is weighing them: a yoga only speaks as loudly as the grahas that form it are strong, and only when a dasha gives them their turn." },
        { name: 'Drishti, the Sight of the Grahas', band: 'taught in most courses', pace: 'steady', term: 'Drishti, a glance',
          text: "In Jyotish a graha casts its sight on whole signs rather than on exact angles. Every graha looks at the seventh sign from itself. Mars looks also at the fourth and the eighth, Jupiter at the fifth and the ninth, and Saturn at the third and the tenth. Where a graha looks, it lends its nature: Jupiter's glance protects, Saturn's tests, Mars's stirs. Reading drishti is why two grahas in signs that never touch in Western terms can still be speaking to each other." },
        { name: 'The Vargas and the Navamsa', band: 'taught later', pace: 'demanding', term: 'Varga, a division',
          text: "Each rashi can be divided again into smaller parts, and each division makes a chart of its own, a varga. Parashara names sixteen of them, each for one area of life. The most used is the navamsa, which cuts every sign into nine parts of 3 degrees 20 minutes, the same span as a pada, and is read for marriage, for the deeper strength of each graha, and as the fruit of the birth chart. A graha that is strong in both the rashi chart and the navamsa is read as strong indeed." }
      ] },
    chinese: { title: 'The Four Pillars', glyph: '☯',
      lessons: [
        { name: 'The Ten Heavenly Stems', band: 'taught almost everywhere', pace: 'gentle', term: 'Tiangan',
          text: "Ten stems run in a fixed order, two for each of the five phases, the first of each pair yang and the second yin: Jia and Yi are wood, Bing and Ding are fire, Wu and Ji are earth, Geng and Xin are metal, Ren and Gui are water. A stem is the heavenly half of a pillar, the quality that shows. Jia is often pictured as a tall tree and Yi as a vine; Bing as the Sun and Ding as a lamp; the pictures are a way into the stems rather than a rule about them." },
        { name: 'The Twelve Earthly Branches', band: 'taught almost everywhere', pace: 'gentle', term: 'Dizhi',
          text: "Twelve branches run beside the stems, each with its animal, its phase and its two hours of the day: Zi the Rat, water, from eleven at night to one; Chou the Ox, earth; Yin the Tiger and Mao the Rabbit, wood; Chen the Dragon, earth; Si the Snake and Wu the Horse, fire; Wei the Goat, earth; Shen the Monkey and You the Rooster, metal; Xu the Dog, earth; and Hai the Pig, water. A branch is the earthly half of a pillar, the ground a stem stands on." },
        { name: 'The Four Pillars and the Sixty Cycle', band: 'taught almost everywhere', pace: 'gentle', term: 'Bazi, the eight characters',
          text: "A birth is written as four pillars, the year, the month, the day and the hour, each a stem standing on a branch, eight characters in all. Stems and branches pair in step, yang with yang and yin with yin, so they make sixty pairs before the first comes round again, the sexagenary cycle that has counted days in China for three thousand years. The year pillar is read for ancestry and early life, the month for parents and youth, the day for the self and a partner, and the hour for children and later years." },
        { name: 'The Day Master', band: 'taught almost everywhere', pace: 'gentle', term: 'Rizhu',
          text: "Since the method Xu Ziping set out in the Song dynasty, the stem of the day pillar is read as the self, the Day Master. Everything else in the chart is read by what it does to that one stem: feeds it, drains it, controls it, is controlled by it or stands beside it. A Day Master of Geng metal reads the same fire in a chart quite differently from a Day Master of Jia wood, which is why two people born in the same year and month can read so unlike each other." },
        { name: 'Yin, Yang and the Five Phases', band: 'taught almost everywhere', pace: 'gentle', term: 'Wuxing',
          text: "Wood, fire, earth, metal and water are phases more than substances, and they move in two cycles. In the generating cycle wood feeds fire, fire leaves earth, earth bears metal, metal carries water and water nourishes wood. In the controlling cycle wood parts earth, earth dams water, water quenches fire, fire melts metal and metal cuts wood. Each phase comes as yang, outgoing and solid, or yin, yielding and inward. Counting the phases across the eight characters is the first picture of a chart: what is plentiful, what is scarce, what is missing." },
        { name: 'The Ten Gods', band: 'taught in most courses', pace: 'steady', term: 'Shishen',
          text: "The ten gods name each other stem by its relation to the Day Master. The same phase is the Friend when it shares the polarity and the Rob Wealth when it does not. The phase the Day Master produces is the Eating God or the Hurting Officer. The phase it controls is Indirect or Direct Wealth. The phase that controls it is the Seven Killings or the Direct Officer. The phase that produces it is the Indirect or Direct Resource. In each pair the first shares the Day Master's polarity and the second is its opposite, and the names carry a whole vocabulary of resources, expression, authority and support." },
        { name: 'The Luck Pillars', band: 'taught in most courses', pace: 'steady', term: 'Dayun',
          text: "Beside the four natal pillars runs a chain of luck pillars, each ruling about ten years. They are counted from the month pillar, forward through the sixty cycle or backward, by the polarity of the year and the sex of the person born: a yang year for a man or a yin year for a woman runs forward, the other two backward. Each luck pillar is a new stem and branch arriving to meet the eight characters, and the years inside it are read against both." },
        { name: 'The Solar Terms', band: 'taught in most courses', pace: 'steady', term: 'Jieqi',
          text: "The months of the Four Pillars are solar, not lunar. The Sun's year is divided into twenty four solar terms, fifteen degrees each, and a pillar month begins at every second one. So the year pillar does not turn at the lunar new year but at Lichun, the beginning of spring, when the Sun reaches 315 degrees, early in February. A birth in late January belongs to the year before, whatever the calendar says." },
        { name: 'The Symbolic Stars', band: 'taught in some courses', pace: 'steady', term: 'Shensha',
          text: "Beside the elements stand the symbolic stars, special branches found by rule from the day stem or from the year and day branches. The Nobleman marks help that arrives from others, the Travel Horse movement and change of place, and Peach Blossom charm and attraction. There are many more. Most teachers place them after the elements and the ten gods, as accents on a reading rather than its ground." },
        { name: 'Clashes and Combinations', band: 'taught in some courses', pace: 'demanding', term: 'Chong and he',
          text: "Branches meet and change one another. Branches six apart clash, the Rat with the Horse, the Ox with the Goat, and so on round the twelve, and a clash shakes whatever the two pillars hold. Some pairs combine, and some groups of three come together into a single phase, the three harmonies. Stems combine too. Clashes and combinations are where a still chart begins to move, above all when a luck pillar or a year brings the branch that sets them off." },
        { name: 'The Strength of the Day Master', band: 'taught later', pace: 'demanding', term: 'Strong and weak',
          text: "Before anything can be advised, the Day Master is weighed. Is it born in its own season, the month branch, or out of it? Do the other pillars support it with its own phase and with the phase that feeds it, or do they drain and control it? A strong Day Master and a weak one want different things from the same year, and most disagreements between readers come back to this weighing." },
        { name: 'The Useful God', band: 'taught later', pace: 'demanding', term: 'Yongshen',
          text: "The useful god is the phase that brings a chart toward balance: what a strong Day Master needs to spend itself on, or what a weak one needs to be held up by. Once it is found, the luck pillars and the years that bring it are read as easier seasons, and those that bring its opposite as harder ones. Finding it is the work the earlier lessons prepare for." },
        { name: 'Structures', band: 'taught later', pace: 'demanding', term: 'Geju',
          text: "Classical books sort charts into structures, named mostly from the ten god the month branch gives, such as a Direct Officer structure or an Eating God structure, along with special structures for charts so lopsided that the ordinary weighing does not apply. A structure is a whole chart's shape named at once, and it is usually the last thing a student learns to see." }
      ] },
    hellenistic: { title: 'Hellenistic Astrology', glyph: '☉',
      lessons: [
        { name: 'Sect, Day and Night', band: 'taught almost everywhere', pace: 'gentle', term: 'Hairesis, a party',
          text: "The first question a Hellenistic astrologer asks is whether the chart is of the day or of the night, whether the Sun stood above the horizon or below it. The day has its own party, the Sun with Jupiter and Saturn; the night has the Moon with Venus and Mars. Mercury joins the day when it rises before the Sun and the night when it sets after it. A body in its own sect is read as better placed to do its work: Saturn is easier by day, Mars by night, and the benefic of the sect is the chart's best help." },
        { name: 'The Seven Planets', band: 'taught almost everywhere', pace: 'gentle', term: 'Planetes, the wanderers',
          text: "Hellenistic astrology reads the seven bodies the eye can see: the Sun and the Moon, the two lights, and Mercury, Venus, Mars, Jupiter and Saturn. Jupiter and Venus are the benefics, Mars and Saturn the malefics, and Mercury takes the nature of whatever it is with. None of these words is a verdict: a malefic in its own sect and well placed can build as much as a benefic, and the texts read every planet as both a giver and a taker by its condition." },
        { name: 'The Signs and the Thema Mundi', band: 'taught almost everywhere', pace: 'gentle', term: 'Thema Mundi, the chart of the world',
          text: "The tradition taught its rulerships through a teaching chart, the birth of the world: Cancer rising with the Moon in it, the Sun in Leo, then Mercury in Virgo, Venus in Libra, Mars in Scorpio, Jupiter in Sagittarius and Saturn in Capricorn, each planet in turn round the zodiac in the order of its speed. Read backward from Cancer the same order runs again, Gemini to Mercury, Taurus to Venus, Aries to Mars, Pisces to Jupiter and Aquarius to Saturn, which is why each planet but the lights rules two signs. The chart also shows the aspects: the lights see Saturn's signs by opposition and Jupiter's by trine." },
        { name: 'Whole Sign Places and the Joys', band: 'taught almost everywhere', pace: 'gentle', term: 'Topos, a place',
          text: "The houses were called places, and the oldest way to count them is by whole signs from the rising sign. Each planet has a place where it rejoices: Mercury in the first, the Moon in the third, Venus in the fifth, Mars in the sixth, the Sun in the ninth, Jupiter in the eleventh and Saturn in the twelfth. The joys explain much of what the places mean: the third, the Moon's, is the place of the goddess, and the ninth, the Sun's, the place of the god." },
        { name: 'Annual Profections', band: 'taught almost everywhere', pace: 'gentle', term: 'Lord of the year',
          text: "Each year of life the chart turns one sign forward. At birth the year belongs to the rising sign, at the first birthday to the second sign, and so on, back to the rising sign at twelve, twenty four, thirty six. The sign the year falls in names the topic of the year, and its ruler becomes the lord of the year, the planet whose condition and transits are watched most closely until the next birthday." },
        { name: 'The Lots of Fortune and Spirit', band: 'taught in most courses', pace: 'steady', term: 'Kleros, a lot',
          text: "A lot is a point found by measuring the distance between two planets and casting it from the Ascendant. The Lot of Fortune, by day, is the distance from the Sun to the Moon added to the Ascendant, and by night the reverse; the Lot of Spirit is its mirror, the Moon to the Sun by day. Fortune is read for the body and what happens to it, Spirit for the mind and what is chosen. Each lot becomes a first house of its own, from which the other signs can be counted again." },
        { name: 'Zodiacal Releasing', band: 'taught in most courses', pace: 'demanding', term: 'Aphesis, a release',
          text: "Vettius Valens describes a way of timing a life by releasing it from a lot through the signs. Starting from the sign of the Lot of Spirit, for career and direction, or of Fortune, for the body and its circumstances, each sign rules a period whose length comes from its ruler's period, and smaller periods run inside the larger ones. Students learn it for the peaks it marks, when the periods reach the signs angular to the lot, and for the turns between chapters of a life." },
        { name: 'Aspects by Sign', band: 'taught in most courses', pace: 'steady', term: 'Witnessing',
          text: "In the older tradition planets see each other by sign. A planet two signs away sees by sextile, three by square, four by trine and six by opposition, and a planet in the same sign is with it. Signs that stand one, five, seven or eleven signs apart are in aversion: they cannot see each other at all, and a planet in aversion to a place has no say over it. Close degrees still matter, as a contact being completed, but the sign is the door." },
        { name: 'The Ruler of the Hour Marker', band: 'taught in most courses', pace: 'steady', term: 'Horoskopos',
          text: "The rising sign was called the hour marker, horoskopos, from which the whole chart takes its name. Its ruler steers the chart: where it stands by place, sign and sect, and whether it can see the rising sign at all, is read as the course of the life. A ruler of the hour marker in aversion to the first place is a captain who cannot see the ship, and the tradition reads that as a life lived partly elsewhere." },
        { name: 'Bonification and Maltreatment', band: 'taught later', pace: 'demanding', term: 'Help and harm',
          text: "Later Hellenistic authors list the ways one planet improves or troubles another: being joined to it by a close aspect, being overcome by a planet in the tenth sign from it, being enclosed between two benefics or two malefics, receiving a ray from one. Learning the list is how a student moves from reading planets one at a time to reading them as a crowd that helps and harms itself." },
        { name: 'Triplicity Lords of the Sect Light', band: 'taught later', pace: 'demanding', term: 'Trigon lords',
          text: "Each element has three lords, one for the day, one for the night and one that shares. Dorotheus reads the course of a life from the lords of the element holding the sect light, the Sun by day and the Moon by night: the first lord for the first part of life, the second for the next, the third as a partner to both. Where those lords stand, and how well, is read as how the life is supported over its length." },
        { name: 'The Revolution of the Year', band: 'taught later', pace: 'steady', term: 'Return',
          text: "Hellenistic astrologers also cast a chart for the moment the Sun returns to its birth degree each year, and read it beside the profection. The return chart says how the year is set up; the profection says whose year it is. Read together they give a year its weather and its subject." }
      ] },
    sidereal: { title: 'The Sidereal Zodiac', glyph: '★',
      lessons: [
        { name: 'Why the Stars', band: 'taught almost everywhere', pace: 'gentle', term: 'Sidereal, of the stars',
          text: "Western sidereal astrology keeps the Western way of reading a chart and moves the zodiac back onto the stars. Cyril Fagan argued that the zodiac of the Babylonians, the oldest one known, was measured against the constellations rather than the seasons, and that the tropical zodiac came later. Because the equinox drifts against the stars, the two zodiacs have slid apart since then, and in a sidereal chart most placements move back by a sign." },
        { name: 'The Ayanamsa and Its Anchor', band: 'taught almost everywhere', pace: 'steady', term: 'Fagan-Bradley',
          text: "The ayanamsa is how far the starry zodiac now stands from the seasonal one. The Fagan-Bradley ayanamsa is set so that Aldebaran, the eye of the Bull, falls at 15 degrees of Taurus and Spica at 29 degrees 06 minutes of Virgo, and at the start of 2000 it measured about 24 degrees 44 minutes. It grows by about a degree every seventy two years, so the gap is a little wider for every generation." },
        { name: 'Fagan and Bradley', band: 'taught in most courses', pace: 'gentle', term: 'The founders',
          text: "Cyril Fagan, an Irish astrologer born in Dublin in 1896, set out his case in Zodiacs Old and New in 1950. Donald Bradley, an American astrologer and statistician, tested the zodiac against data and refined its starting point, and later edited American Astrology. Their work is why Western sidereal astrology exists as a school of its own rather than as Jyotish's zodiac borrowed." },
        { name: 'Learning One Ayanamsa First', band: 'taught in some courses', pace: 'gentle', term: 'One sky at a time',
          text: "Sidereal astrologers do not agree on a single ayanamsa: Fagan-Bradley and Lahiri, the most used, stand less than a degree apart, and others differ by more. Teachers advise working with one long enough to learn how it reads before comparing it with another, because a body near the edge of a sign changes sign between them. This chart uses Fagan-Bradley throughout." }
      ] },
    draconic: { title: 'The Draconic Chart', glyph: '☊',
      lessons: [
        { name: 'The Dragon’s Chart', band: 'taught almost everywhere', pace: 'gentle', term: 'Draco, the dragon',
          text: "A draconic chart is the birth chart turned until the North Node of the Moon stands at 0 degrees Aries. Every body and angle moves by the same amount, so the houses, the aspects and the shape of the chart are exactly as they were; only the signs change. The nodes were once pictured as the head and tail of a dragon that swallows the Sun and the Moon at an eclipse, which is where the chart takes its name." },
        { name: 'The Sun, the Moon and the Rising Sign', band: 'taught almost everywhere', pace: 'gentle', term: 'The first comparison',
          text: "Students begin by setting three placements beside their tropical ones: the draconic Sun, Moon and rising sign. Pamela Crane, whose books did most to spread the chart, read it as the deeper current under the familiar one, the purpose and the driving principles of a life, and teachers still describe it that way. A draconic Sun in a sign far from the tropical one is the first thing a student learns to sit with." },
        { name: 'Laying It Over the Birth Chart', band: 'taught in most courses', pace: 'steady', term: 'The overlay',
          text: "The chart is read most often laid over the tropical chart, as two rings. Close contacts between the two, above all conjunctions and oppositions within a degree or two, are read as places where the deeper current touches the everyday chart directly. Roy Olliver's Chasing the Dragons is built around reading those contacts." },
        { name: 'Where It Came From', band: 'taught in some courses', pace: 'gentle', term: 'History',
          text: "The draconic chart is a twentieth century technique. It is traced to the French astrologer Froger in the late 1950s, was brought to English astrology by Dennis Elwell in a lecture in 1977, and was set out at length by Pamela Crane in Draconic Astrology in 1987 and The Draconic Chart in 1999. It has always been read beside the birth chart, never in place of it." }
      ] },
    heliocentric: { title: 'From the Sun', glyph: '⊙',
      lessons: [
        { name: 'The Chart Seen From the Sun', band: 'taught almost everywhere', pace: 'gentle', term: 'Helios, the Sun',
          text: "A heliocentric chart draws the planets where they stand as seen from the Sun rather than from the Earth. The Sun leaves the wheel, because it is the centre, and the Earth takes a place on it, opposite where the Sun appears from here. The planets keep their order and their signs mean what they always mean; it is the point of view that has moved." },
        { name: 'What Drops Away', band: 'taught almost everywhere', pace: 'gentle', term: 'No horizon',
          text: "From the Sun there is no horizon, so a heliocentric chart has no Ascendant, no Midheaven and no houses. The Moon goes too, since it circles the Earth rather than the Sun. Seen from the Sun a planet never appears to turn backward, so there is no retrograde motion either. What remains is the planets, their signs and the angles between them." },
        { name: 'Reading the Aspects', band: 'taught in most courses', pace: 'steady', term: 'The pattern',
          text: "With houses and angles gone, heliocentric astrologers read the aspects and the patterns they make: the planets' own geometry round the Sun, unbent by the Earth's motion. Mercury and Venus, which never stray far from the Sun as seen from here, can stand anywhere in a heliocentric chart, so they make aspects a geocentric chart can never show." },
        { name: 'Beside the Birth Chart', band: 'taught in most courses', pace: 'gentle', term: 'Two views',
          text: "Hardly anyone reads a heliocentric chart alone. It is read beside the geocentric chart, as the view from the centre of the system set next to the view from where a person actually stood, and the comparison of the two is most of the craft." },
        { name: 'Where It Came From', band: 'taught in some courses', pace: 'gentle', term: 'History',
          text: "Heliocentric charts are as old as the Sun centred system. Andreas Aurifaber in the sixteenth century and Joshua Childrey in the 1650s argued astrology should follow Copernicus; Holmes Merton revived the idea in 1899, and Philip Sedgwick's primer of 1990 brought it to astrologers working today." }
      ] }
  };

  /* ---------- the four Western courses ----------
     Asked for by the owner on 6 November 2026: every chart study is a course,
     Placidus, Koch, Equal and Whole Sign among them. Those four are house
     systems inside the Western chart, so each is the Western course taught
     through its own division of the sky: the same foundations, a unit on its
     houses, and reading and timing as that division changes them. Sources are
     in docs/astro-upgrade/05-study-courses-sources.md. */
  function L(name, unit, band, pace, term, text, see) {
    return { name: name, unit: unit, band: band, pace: pace, term: term, text: text, see: see || [] };
  }
  var EVERY = 'taught almost everywhere', MOST = 'taught in most courses', SOME = 'taught in some courses', LATER = 'taught later';
  function westernFoundations(sysLine) {
    return [
      L('The Celestial Bodies', 'Foundations', EVERY, 'gentle', 'The luminaries and the planets',
        "A Western chart is read first through its celestial bodies. The Sun and the Moon are the two luminaries; Mercury, Venus, Mars, Jupiter and Saturn are the planets the eye can see; Uranus, Neptune and Pluto were found by telescope and joined the chart as they were found, Pluto staying beside them by convention though astronomy now names it a dwarf planet. Each body is a kind of motive in a life: the Sun what it lives for, the Moon what it needs, Mercury how it thinks. The faster bodies are read as personal, and the slower ones as the weather a whole generation shares.",
        ['body:Sun', 'body:Moon']),
      L('The Twelve Signs', 'Foundations', EVERY, 'gentle', 'The tropical zodiac',
        "The signs are twelve equal stretches of thirty degrees along the Sun's yearly path. Western astrology measures them from the seasons: 0 degrees Aries is where the Sun stands at the March equinox, so the zodiac is tied to the turning of the year rather than to the stars behind it. Each sign carries one of four elements, fire, earth, air or water, and one of three modalities, cardinal, fixed or mutable, and between them those two give every sign its manner. A body takes on the manner of the sign it stands in.",
        ['sign:Aries', 'concept:Elements', 'concept:Modalities']),
      L('The Angles and the Houses', 'Foundations', EVERY, 'gentle', 'The four angles',
        "Where the signs belong to the sky, the houses belong to the place of birth. The horizon and the meridian there cross the zodiac at four angles: the Ascendant rising in the east, the Midheaven overhead, the Descendant setting in the west and the IC beneath. From them the chart is divided into twelve houses, each an area of life, from the self in the first to what is hidden in the twelfth. How the sky between the angles is shared out is the question a house system answers. " + sysLine,
        ['house:1', 'concept:Angular, Succedent, and Cadent Houses']),
      L('The Aspects', 'Foundations', EVERY, 'gentle', 'Aspect, a way of looking',
        "Two bodies a meaningful angle apart are read as being in conversation. The five major aspects are the conjunction at 0 degrees, the sextile at 60, the square at 90, the trine at 120 and the opposition at 180, each allowed a little leeway, its orb. Western astrology reads aspects by degree, so two bodies in neighbouring signs can still meet, and two bodies whose signs agree can still stand too far apart to count.",
        ['aspect:Conjunction', 'essay:orbs'])
    ];
  }
  function westernReading(rulerLine) {
    return [
      L('The Chart Ruler and the House Rulers', 'Reading', EVERY, 'steady', 'Ruler',
        "The chart ruler is the ruler of the rising sign, and where it stands, by house and by sign, is read as the course of the whole chart. Every house has a ruler in the same way, and a house is read through wherever its ruler actually stands. " + rulerLine,
        ['concept:Chart Ruler']),
      L('Angular, Succedent and Cadent', 'Reading', EVERY, 'gentle', 'The three kinds of house',
        "The houses fall into three groups of four by their place beside the angles. The angular houses, the first, fourth, seventh and tenth, are read as the most forceful, where a placement acts directly on a life. The succedent houses, the second, fifth, eighth and eleventh, follow and hold what the angles start. The cadent houses, the third, sixth, ninth and twelfth, fall away from the angles and are read as the places where a life is adjusted and made sense of.",
        ['concept:Angular, Succedent, and Cadent Houses']),
      L('Dignity and Retrograde Motion', 'Reading', MOST, 'steady', 'Essential dignity',
        "A body is at home in the sign it rules, exalted in the sign that lifts it, and in detriment or fall in the signs opposite those. Its dignity says how freely it can do its work. A body that appears from the Earth to move backward is retrograde, and its work is read as turned inward or done again. Both are read the same way whatever the house system.",
        ['concept:Essential Dignity', 'concept:Retrograde Motion'])
    ];
  }
  function westernTiming(transitLine, progLine) {
    return [
      L('Transits Through the Houses', 'Timing', EVERY, 'steady', 'Transit',
        "The bodies keep moving after birth, and their present places laid over the birth chart are the transits. A transit is read by the natal body it touches and by the house it is crossing. " + transitLine,
        ['essay:transits']),
      L('Secondary Progressions', 'Timing', MOST, 'steady', 'A day for a year',
        "Secondary progression moves the birth chart forward one day for each year of life, so the chart of someone thirty years old is progressed thirty days past the birth. The progressed Sun moves about a degree a year and the progressed Moon about a sign every two and a half years, and both are read as a slow inner season rather than an event. " + progLine,
        ['technique:Secondary Progressions'])
    ];
  }
  function quadrantHouses(sysName, key) {
    return L('Quadrant Houses', sysName + ' Houses', EVERY, 'gentle', 'Cusp',
      "In " + sysName + " the four angles are the cusps of the angular houses: the Ascendant begins the first house, the IC the fourth, the Descendant the seventh and the Midheaven the tenth. The quarter of the sky between each pair of angles is cut into three houses, which can be of very different sizes, and each house begins at its cusp, the degree where its doorway stands.",
      ['housesys:' + key]);
  }
  function interceptedSigns(sysName) {
    return L('Intercepted Signs', sysName + ' Houses', MOST, 'steady', 'Interception',
      "Because the houses are unequal, a wide house can enclose a whole sign without that sign touching either cusp. That sign is intercepted, and the sign opposite it is intercepted in the opposite house. Elsewhere in the same chart two neighbouring houses share one sign on their cusps. Interceptions grow more common the further from the equator a person is born, and the tradition reads an intercepted sign as a quality carried without an obvious doorway, something found rather than simply used.",
      ['concept:Intercepted Signs']);
  }
  function nearThePoles(sysName) {
    return L('Near the Poles', sysName + ' Houses', LATER, 'steady', 'The polar circles',
      "Inside the Arctic and Antarctic circles some degrees of the zodiac never rise and others never set, so there is no climb to divide and " + sysName + " cusps cannot be found: some houses vanish and others swell. A chart born there is drawn here in Porphyry instead, which cuts each quarter into three equal parts.",
      ['housesys:P']);
  }
  var QUAD_RULER = "A house takes the ruler of the sign on its cusp. In a quadrant system one sign can sit on two cusps, so one ruler can hold two houses, and many astrologers also hear the ruler of an intercepted sign in the house that encloses it.";
  var QUAD_TRANSIT = "A slow body crossing a cusp changes the room it works in, and because the cusps move with every few minutes of birth time, quadrant systems ask for an exact birth time before a transit to a cusp can be trusted.";
  var QUAD_PROG = "The progressed angles move too, and in a quadrant chart the progressed Ascendant and Midheaven carry the house cusps along with them.";
  var STUDY_COURSES = {
    western: { title: 'Whole Sign Houses', glyph: '◫',
      lessons: westernFoundations("This study answers it by signs: every house is one whole sign.").concat([
        L('One Sign, One House', 'Whole Sign Houses', EVERY, 'gentle', 'Whole sign house',
          "In Whole Sign the rising sign is the first house from its first degree to its last, wherever in that sign the Ascendant falls, and each sign after it is the next house. A house and a sign are always the same room, there are no cusps inside a sign, and no sign is ever intercepted. The chart reads the same at every latitude, and a birth time only has to be good enough to know which sign was rising.",
          ['housesys:W']),
        L('The Ascendant and the Midheaven as Points', 'Whole Sign Houses', EVERY, 'steady', 'A floating point',
          "The Ascendant is still the degree that was rising, but it no longer starts the first house: it floats inside it as a sensitive point. The Midheaven floats too, and it can fall in the ninth, tenth or eleventh sign from the rising sign. Wherever it lands it brings the tenth house's themes, work and standing, into that house, while the tenth sign stays the tenth house in its own right.",
          ['essay:chart']),
        L('Where Whole Sign Came From', 'Whole Sign Houses', MOST, 'gentle', 'The oldest division',
          "Whole sign houses are the oldest form of house division with clear textual evidence, and they were the dominant one for roughly the first thousand years of horoscopic astrology, used by Dorotheus of Sidon and Vettius Valens among others. Jyotish has kept them as its primary system ever since. Their return in Western astrology began with James Holden's paper Ancient House Division in 1982 and the translations of Project Hindsight in the 1990s by Robert Schmidt and Robert Hand. Hand taught the system from the middle of that decade, and it was widely taken up in the late 2000s.",
          []),
        L('Counting by Signs', 'Whole Sign Houses', SOME, 'gentle', 'Profection',
          "Because each house is a sign, every technique that counts sign by sign fits it exactly. The annual profection moves one sign a year from the rising sign, and in Whole Sign that is one house a year, so the sign of the year and the house of the year are the same.",
          ['technique:Profection'])
      ]).concat(westernReading("In Whole Sign the sign is the house, so each house has exactly one ruler, the ruler of its sign."))
        .concat(westernTiming("A body changes house only when it changes sign, so the rooms turn at the same moments for everyone born with the same sign rising.",
          "In Whole Sign the progressed Ascendant moves through the first house without changing the houses, which stay fixed to the signs.")) },
    placidus: { title: 'Placidus Houses', glyph: '◫',
      lessons: westernFoundations("This study answers it by time: Placidus divides the hours each degree takes to climb the sky.").concat([
        quadrantHouses('Placidus', 'O'),
        L('Houses Measured by Time', 'Placidus Houses', MOST, 'steady', 'Semi-arc',
          "Every degree of the zodiac takes its own time to climb from the horizon to the Midheaven, its semi-arc. A Placidus cusp is the degree that has climbed a third, or two thirds, of its own semi-arc, and the same below the horizon. The houses are divisions of time rather than of space, which is why they are found by repeated approximation rather than one formula, and why a few minutes in the birth time can move every cusp.",
          ['housesys:O']),
        interceptedSigns('Placidus'),
        L('Where Placidus Came From', 'Placidus Houses', SOME, 'gentle', 'Placidus de Titis',
          "The system carries the name of Placidus de Titis (1603 to 1668), an Olivetan monk who taught mathematics, physics and astronomy at the University of Pavia, though he popularised the method rather than invented it. It was rejected when it first reached England, but Raphael's Ephemeris and Raphael's Tables of Houses, printed with Placidus cusps from the middle of the nineteenth century, made it the system most English speaking astrologers learned. It is the system most used in Western astrology today, and most textbooks and software assume it.",
          []),
        nearThePoles('Placidus')
      ]).concat(westernReading(QUAD_RULER)).concat(westernTiming(QUAD_TRANSIT, QUAD_PROG)) },
    koch: { title: 'Koch Houses', glyph: '◫',
      lessons: westernFoundations("This study answers it from the birthplace: Koch divides one span of time read off the local horizon.").concat([
        quadrantHouses('Koch', 'K'),
        L('The Birthplace System', 'Koch Houses', MOST, 'steady', 'Birthplace houses',
          "Koch takes one span of time, the time the Midheaven degree needed to climb to its place from the horizon, and divides it into three. Each intermediate cusp is the degree that stood on the birthplace's own horizon at one of those moments, which is why it is also called the birthplace system. It is close kin to the older Alcabitius system, which divides the Ascendant's journey instead, and like Placidus it asks for an exact birth time.",
          ['housesys:K', 'housesys:A']),
        interceptedSigns('Koch'),
        L('Where Koch Came From', 'Koch Houses', SOME, 'gentle', 'Walter Koch',
          "Walter Koch (1895 to 1970), a German astrologer born in Esslingen, put the system forward in the early 1960s and published tables for it in 1965; tables in English followed in 1971. It remains a respected choice in Central European practice. Bruno Huber chose it for the Huber Method of astrological psychology, which he and Louise Huber taught from 1968 at their institute in Adliswil, Switzerland, a choice that drew controversy of its own.",
          []),
        nearThePoles('Koch')
      ]).concat(westernReading(QUAD_RULER)).concat(westernTiming(QUAD_TRANSIT, QUAD_PROG)) },
    equal: { title: 'Equal Houses', glyph: '◫',
      lessons: westernFoundations("This study answers it from the Ascendant: every house is thirty degrees from the rising degree.").concat([
        L('Thirty Degrees from the Ascendant', 'Equal Houses', EVERY, 'gentle', 'Equal house',
          "Every house is exactly thirty degrees, counted from the degree of the Ascendant. If the Ascendant stands at 15 degrees Leo, the second cusp is at 15 Virgo, the third at 15 Libra, and so round the wheel. The horizon is honoured to the degree, each sign holds exactly one cusp, so nothing is ever intercepted, and the chart can be drawn at any latitude.",
          ['housesys:E']),
        L('The Floating Midheaven', 'Equal Houses', MOST, 'steady', 'The Midheaven as a point',
          "Because the houses are measured from the Ascendant, the Midheaven is not the tenth cusp. It floats in one of the upper houses, usually the ninth, the tenth or the eleventh, and is read as a point of its own wherever it lands, carrying work and standing into that house.",
          ['essay:chart']),
        L('Reading Across Two Signs', 'Equal Houses', SOME, 'steady', 'A house in two signs',
          "An Equal house usually begins in one sign and ends in the next, at the same degree. The sign on the cusp is the house's doorway and the sign after it the room most of the house stands in, so a body early in a sign can belong to the house before the one its sign alone would suggest.",
          []),
        L('Where Equal Came From', 'Equal Houses', SOME, 'gentle', 'An ancient division',
          "Equal division is very old. It is thought to have arisen around the time of Petosiris in the first century BC, and some Hellenistic astrologers used it beside whole signs. In the twentieth century the English Faculty of Astrological Studies made an Equal system the one it taught, which is why many astrologers trained in Britain learned their houses this way.",
          [])
      ]).concat(westernReading("Each cusp falls in its own sign, so every house has one ruler, the ruler of the sign on its cusp, even though most of the house stands in the sign after it."))
        .concat(westernTimingEqual()) }
  };
  function westernTimingEqual() {
    return westernTiming("A body changes house when it passes the Ascendant's own degree in a new sign, so every cusp is crossed at the same degree of each sign.",
      "The progressed Ascendant carries all twelve cusps with it, thirty degrees apart.");
  }

  /* ---------- the units of the six other courses ----------
     Each lesson keeps its place; a unit names a run of them, in order. */
  var STUDY_UNITS = {
    vedic: [[5, 'Foundations'], [3, 'Timing'], [2, 'Reading'], [1, 'Deeper Study']],
    chinese: [[5, 'Foundations'], [1, 'Reading'], [2, 'Timing'], [2, 'Movement'], [3, 'Deeper Study']],
    hellenistic: [[4, 'Foundations'], [3, 'First Techniques'], [2, 'Reading'], [3, 'Deeper Study']],
    sidereal: [[2, 'Foundations'], [2, 'The School']],
    draconic: [[2, 'Foundations'], [1, 'Practice'], [1, 'The School']],
    heliocentric: [[2, 'Foundations'], [2, 'Practice'], [1, 'The School']]
  };
  Object.keys(STUDY_UNITS).forEach(function (k) {
    var at = 0;
    STUDY_UNITS[k].forEach(function (u) { for (var i = 0; i < u[0]; i++) { var x = STUDY_LESSONS[k].lessons[at++]; x.unit = u[1]; x.see = x.see || []; } });
  });
  Object.keys(STUDY_COURSES).forEach(function (k) { STUDY_LESSONS[k] = STUDY_COURSES[k]; });

  /* ---------- the words of each study ----------
     Every study's own terms, defined as its lessons use them, so a term met
     in a lesson opens its definition. Nothing here goes beyond what the
     lessons themselves say. */
  var WESTERN_WORDS = [
    ['Ascendant', "The degree of the zodiac rising on the eastern horizon at birth."],
    ['Midheaven', "The degree of the zodiac at the top of the sky, where the meridian crosses it, also called the MC."],
    ['Descendant', "The degree setting on the western horizon, opposite the Ascendant."],
    ['IC', "The degree at the bottom of the chart, opposite the Midheaven, the imum coeli."],
    ['Luminaries', "The Sun and the Moon, the two lights."],
    ['Orb', "The leeway an aspect is allowed and still counted."],
    ['Chart ruler', "The ruler of the sign on the Ascendant."],
    ['Transit', "A body's present place read against the birth chart."],
    ['Progression', "The birth chart moved forward symbolically, a day for each year of life."]
  ];
  var QUAD_WORDS = [
    ['Cusp', "The degree where a house begins."],
    ['Quadrant system', "A house system that cuts each quarter between the angles into three houses, so the angles are cusps and the houses differ in size."],
    ['Intercepted sign', "A sign enclosed by a house without touching either of its cusps; the sign opposite it is intercepted too."]
  ];
  var STUDY_WORDS = {
    western: WESTERN_WORDS.concat([
      ['Whole sign house', "A house that is exactly one sign, the rising sign being the first."],
      ['Floating point', "An angle, such as the Ascendant or the Midheaven, that stands inside a house rather than beginning one."],
      ['Profection', "The year by year turning of the chart one sign forward from the rising sign."]]),
    placidus: WESTERN_WORDS.concat(QUAD_WORDS, [
      ['Semi-arc', "The time a degree of the zodiac takes to climb from the horizon to the meridian, or to fall from it."],
      ['Polar circles', "The Arctic and Antarctic circles, inside which Placidus cusps cannot be found."]]),
    koch: WESTERN_WORDS.concat(QUAD_WORDS, [
      ['Birthplace system', "Another name for Koch houses, read from the birthplace's own horizon."],
      ['Polar circles', "The Arctic and Antarctic circles, inside which Koch cusps cannot be found."]]),
    equal: WESTERN_WORDS.concat([
      ['Cusp', "The degree where a house begins; in Equal houses every cusp is at the Ascendant's degree of a different sign."],
      ['Equal house', "A house of exactly thirty degrees, counted from the Ascendant's degree."]]),
    vedic: [
      ['Jyotish', "The astrology of India, the science of light."],
      ['Graha', "A seizer: one of the nine bodies Jyotish reads, the Sun, the Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu."],
      ['Rahu', "The north lunar node, a graha of shadow."],
      ['Ketu', "The south lunar node, a graha of shadow."],
      ['Rashi', "A sign, measured against the stars."],
      ['Lagna', "The rashi rising in the east at birth, the first bhava."],
      ['Bhava', "A house, a state of being; in Jyotish each bhava is a whole rashi."],
      ['Kendra', "The first, fourth, seventh and tenth bhavas, the pillars of the chart."],
      ['Trikona', "The first, fifth and ninth bhavas, the blessings of the chart."],
      ['Ayanamsa', "The gap between the starry zodiac and the seasonal one."],
      ['Lahiri', "The ayanamsa India's Calendar Reform Committee adopted in the 1950s, used for this chart."],
      ['Nakshatra', "One of twenty seven lunar mansions of 13 degrees 20 minutes."],
      ['Pada', "A quarter of a nakshatra, 3 degrees 20 minutes."],
      ['Birth star', "The nakshatra holding the Moon at birth."],
      ['Dasha', "A period of life ruled by one graha."],
      ['Mahadasha', "A main period of the Vimshottari dasha."],
      ['Antardasha', "One of the nine smaller periods inside a mahadasha."],
      ['Panchanga', "The five limbs of the day: tithi, vara, nakshatra, yoga and karana."],
      ['Tithi', "A lunar day, one of thirty steps of twelve degrees between the Sun and the Moon."],
      ['Gochara', "The transits of the grahas, read above all from the Moon's rashi."],
      ['Sade sati', "Saturn's seven and a half years across the rashis before, on and after the Moon's."],
      ['Yoga', "A joining of grahas, bhavas and lords read as one signature; also one of the panchanga's five limbs."],
      ['Drishti', "The glance a graha casts on whole signs."],
      ['Varga', "A divisional chart made by cutting each rashi again."],
      ['Navamsa', "The ninth division, the most used varga."],
      ['Combust', "A graha too close to the Sun to show its own light."]],
    chinese: [
      ['Bazi', "The eight characters: a birth written as four pillars of a stem and a branch."],
      ['Pillar', "A stem standing on a branch, for the year, the month, the day or the hour."],
      ['Tiangan', "The ten heavenly stems."],
      ['Dizhi', "The twelve earthly branches, each with its animal."],
      ['Sexagenary cycle', "The sixty pairings of stem and branch that count years, months, days and hours."],
      ['Day Master', "The stem of the day pillar, read as the self."],
      ['Wuxing', "The five phases: wood, fire, earth, metal and water."],
      ['Yin and yang', "The two polarities every stem and branch carries."],
      ['Ten gods', "The names each stem takes by its relation to the Day Master."],
      ['Luck pillar', "A stem and branch ruling about ten years of life."],
      ['Solar term', "One of twenty four fifteen degree steps of the Sun's year; a pillar month begins at every second one."],
      ['Lichun', "The beginning of spring, when the year pillar turns."],
      ['Symbolic stars', "Special branches found by rule, read as accents on a chart."],
      ['Clash', "Two branches six apart meeting and shaking one another."],
      ['Useful god', "The phase that brings a chart toward balance."],
      ['Structure', "A whole chart's shape named at once, mostly from the ten god the month branch gives."]],
    hellenistic: [
      ['Sect', "Whether a chart is of the day or of the night, and the party each planet belongs to."],
      ['Benefic', "Jupiter or Venus, the planets read as helpers."],
      ['Malefic', "Mars or Saturn, the planets read as testers."],
      ['Thema Mundi', "The teaching chart of the birth of the world."],
      ['Place', "A house, counted by whole signs."],
      ['Joy', "The place where a planet rejoices."],
      ['Hour marker', "The rising sign, horoskopos."],
      ['Profection', "The chart turned one sign forward each year of life."],
      ['Lord of the year', "The ruler of the sign the profected year falls in."],
      ['Lot', "A point found by casting the distance between two planets from the Ascendant."],
      ['Zodiacal releasing', "Valens's timing of a life released from a lot through the signs."],
      ['Aversion', "Signs that cannot see each other, one, five, seven or eleven signs apart."],
      ['Bonification', "The ways one planet improves another."],
      ['Triplicity lords', "The three lords of each element."]],
    sidereal: [
      ['Sidereal', "Of the stars: a zodiac measured against the constellations."],
      ['Tropical', "Of the seasons: a zodiac measured from the March equinox."],
      ['Precession', "The slow drift of the equinox backward against the stars."],
      ['Ayanamsa', "How far the starry zodiac now stands from the seasonal one."],
      ['Fagan-Bradley', "The ayanamsa that puts Aldebaran at 15 Taurus and Spica at 29 degrees 06 minutes of Virgo, used for this chart."],
      ['Aldebaran', "The eye of the Bull, one of the two anchor stars of the Fagan-Bradley zodiac."],
      ['Spica', "The star of the wheat sheaf in Virgo, the other anchor."]],
    draconic: [
      ['Draconic', "Of the dragon: the chart turned until the North Node stands at 0 Aries."],
      ['Lunar nodes', "The two points where the Moon's path crosses the Sun's, the dragon's head and tail."],
      ['Overlay', "The draconic chart laid over the birth chart as a second ring."]],
    heliocentric: [
      ['Heliocentric', "Seen from the Sun."],
      ['Geocentric', "Seen from the Earth, as the ordinary birth chart is."],
      ['Retrograde', "The apparent backward motion of a planet seen from the Earth, which never happens seen from the Sun."]]
  };
  Object.keys(STUDY_WORDS).forEach(function (k) {
    if (STUDY_LESSONS[k]) STUDY_LESSONS[k].words = STUDY_WORDS[k].map(function (w) { return { term: w[0], text: w[1] }; });
  });

  function studyLessons(k) { return STUDY_LESSONS[String(k || '')] || null; }

  /* ---------- the birth chart ---------- */
  var CHART = {
    what: 'A map of the sky at your first breath. Not a fate, but a field of possibilities.',
    wheel: 'Read the wheel as a building. The houses are rooms, the signs are the atmosphere in each room, and the celestial bodies are the guests who arrived and stayed.',
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
      ['Find the celestial bodies', 'They are the actors. Note which house holds each one, and which sign it dwells in.'],
      ['Notice the aspects', 'The lines across the wheel reveal which celestial bodies are in conversation, and in what tone.'],
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
    what: 'A gathering. Three or more celestial bodies in the same sign or house, concentrating their conversation in one room. The chart leans here. The life returns here, again and again, until what is concentrated is understood.',
    read: 'Notice which house holds the gathering. That is where the energy pools. Notice the sign; that is the quality of the pool. The stellium does not demand; it invites attention.',
    caution: 'Concentration is not destiny. It may mean this is where you carry the most force and the least perspective. Your own record is the test.'
  };

  var TRANSITS = {
    personal: 'The moving celestial bodies touching your natal chart. A conversation between what is now and what was then.',
    sky: 'The patterns in the sky themselves, independent of your chart. The weather that falls on everyone.',
    read: 'A transit does not cause; it reveals. It opens a window. What you see through it depends on where you stand.',
    timing: 'The swift bodies pass in hours or days. The slow ones stay for months and are better read as a season than an event.'
  };

  /* ---------- other techniques ---------- */
  var TECHNIQUES = [
    { name: 'Solar Return', text: 'A solar return chart is cast for the exact moment the Sun returns to its natal degree each year, usually within a day of the birthday, using the location the person is actually in at that moment. The tradition reads it as a chart for the year ahead, layered over the natal chart rather than replacing it: a solar return Mars in the seventh house does not overrule a natal Mars in the first, it colors what that Mars is occupied with for the twelve months around the return.' },
    { name: 'Secondary Progressions', text: 'Secondary progression advances the natal chart at the rate of one day for one year of life, so a chart for someone thirty years old is progressed thirty days past the birth moment. The Sun moves roughly a degree a year under this method, the Moon roughly a sign every two and a half years, which is why a progressed lunar cycle is read as a slow inner season spanning most of a life rather than the month it takes in the sky. It is a symbolic clock, not a forecast of events, read for what is ripening rather than what is scheduled.' },
    { name: 'Composite Chart', text: 'A composite chart is built from the midpoints between two people’s placements, body by body and angle by angle, producing a third chart that belongs to neither person and to the relationship instead. Where synastry compares two charts side by side, a composite treats the relationship itself as the native, with its own Sun, its own houses, its own weather. The tradition reads it as what the bond feels like from inside, which is often a different report than either person’s chart taken alone would give.' },
    { name: 'Profection', text: 'Profection is an old timing technique that advances one whole sign every year of life: the first year, which ends on the first birthday, belongs to the rising sign, the second year to the sign after it, and the count comes back to the rising sign every twelve years. Whichever house is activated for the year, and whichever body rules the sign on that house, becomes the year’s lord, read as the theme and the presiding influence for the twelve months. It is coarser than a transit and older than most of the tradition’s other timing methods, and it is having a visible revival in current practice.' },
    { name: 'Derived Houses', text: 'Any house can be read as the first of another and counted on from there. The 7th is a partner, so the 8th, second from it, is a partner’s money, and the 10th from the 7th is the 4th, a partner’s work in the world. The tradition calls these derived or turned houses. They are used most in horary astrology, where a question is often about somebody else, and William Lilly gives several of his house meanings for exactly this reason: the 9th for the kindred of one’s wife, the 5th for the wealth of the father. Ptolemy goes further and takes a parent’s place as a new horoscope in its own right. Vedic astrology reads one house from another in the same way, and calls it bhavat bhavam.' },
    { name: 'Antiscia', text: 'Fold the zodiac along the line from Cancer to Capricorn, the two solstices, and every degree lands on a partner the same distance from the turning of the year: 5° Capricorn on 25° Sagittarius, 1° Gemini on 29° Cancer. Each is the other’s antiscion, and the two share the length of their days. Firmicus Maternus gives the rule and names the pairs, and Lilly uses it in his own charts. A body standing on another’s antiscion is linked to it without any aspect between them.' },
    { name: 'Relationship Chart', text: 'A relationship chart, introduced by Ronald Davison in 1977, is cast for the midpoint in time and in place between two births: a real moment, with a real sky, that neither person was born in. It is a cousin of the composite, which takes the midpoint of each pair of placements instead and so draws a chart no sky ever showed. Both treat the bond as having a life of its own.' },
    { name: 'Harmonic Charts', text: 'A harmonic chart multiplies every position by a whole number and folds the result back into the circle, so that placements a fifth or a seventh of the circle apart come together. John Addey built the modern practice in Harmonics in Astrology, arguing that every aspect is a division of the circle and every division has its own character.' }
  ];

  var SYNASTRY = {
    what: 'The comparison of two charts. Not compatibility in the simple sense, but the map of what happens when two fields of possibility meet.',
    read: 'Look first at where your celestial bodies fall in their houses. Then where theirs fall in yours. The aspects between your celestial bodies reveal the nature of the conversation.',
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
      ['Find the celestial bodies', 'Three bodies gather in the fourth house. The chart is weighted toward family, inheritance, and the foundation the person is standing on.'],
      ['Read the aspects', 'Sun conjunct Saturn says identity and duty arrived together. Mars in the seventh, square that gathering, says other people press on it.'],
      ['Notice the gathering', 'The Capricorn stellium in the fourth is the loudest feature. Whatever else is true, life keeps returning to home and obligation.'],
      ['Weigh what is missing', 'Only one water placement and no fire below the horizon. Ease is not the theme; endurance is.'],
      ['Synthesize', 'A courteous exterior over a serious interior, built early, tested through partnership. Say it in one sentence, then check it against a life. If it does not fit, the reading is wrong, not the life.']
    ]
  };

  /* THE LEXICON (the owner, 7 November 2026: "Astropedia ... need lexicons
     like Human Design has"). One A to Z of the words astrology uses, each
     written only after a page that supports it was read; every page is in
     docs/astro-upgrade/06-lexicon-sources.md. [name, text, see] where see is
     an Astropedia entry key the word opens onto. The study glossaries join it
     in the room, tagged by study, so a word is defined once. */
  var LEXICON = [
    ['Accidental dignity', "Strength a planet takes from where it stands in this chart rather than from its sign: near an angle, in good aspect, beside a helpful body.", 'concept:Essential Dignity'],
    ['Alcocoden', "The planet that rules the degree of the hyleg and looks at it. Persian and Arabic authors called it the kadhkhudah, the giver of years.", ''],
    ['Almuten', "The planet that holds the most dignity over a degree once every kind is counted together, sign, exaltation, triplicity, term and face. The word comes from Arabic.", 'concept:Essential Dignity'],
    ['Angular', "The houses that begin at the four angles, the 1st, 4th, 7th and 10th. They are where things are started.", 'concept:Angular, Succedent, and Cadent Houses'],
    ['Application', "A body within orb of another and still moving toward the exact angle, so the contact is gathering. Retrograde motion can turn what looks like an approach into a parting.", 'essay:orbs'],
    ['Aries Point', "Zero degrees of Aries, where the Sun crosses the celestial equator going north at the spring equinox. It drifts west against the stars by about a degree every seventy two years.", 'point:Aries Point'],
    ['Ascendant', "The degree of the sign rising on the eastern horizon at the moment of birth, the beginning of the 1st house in most systems.", ''],
    ['Ayanamsa', "The distance between the tropical and the sidereal zodiac, the correction Jyotish makes for precession. Lahiri's is the one most used in India.", 'concept:The Sidereal Zodiac and the Ayanamsa'],
    ['Besieged', "A planet held between two hostile bodies, as Venus between Mars and Saturn in Lilly's example.", ''],
    ['Black Moon Lilith', "In present day astrology, the point where the Moon's orbit is furthest from the Earth.", 'point:Black Moon Lilith'],
    ['Cadent', "The houses that fall away from the angles, the 3rd, 6th, 9th and 12th. They are where things are passed on.", 'concept:Angular, Succedent, and Cadent Houses'],
    ['Cazimi', "A planet in the heart of the Sun, within seventeen minutes of arc of it. Lilly gives sixteen in one place; the old texts read it as strength rather than harm.", 'concept:Combust and Cazimi'],
    ['Chart ruler', "The planet that rules the rising sign, read as the voice that carries the whole chart.", 'concept:Chart Ruler'],
    ['Collection of light', "Two planets that never meet each other both reach toward a third, and the third gathers their light and joins them.", 'essay:orbs'],
    ['Combust', "A planet close enough to the Sun to be lost in its light, within eight and a half degrees by Lilly's count.", 'concept:Combust and Cazimi'],
    ['Contraparallel', "Two bodies at the same declination on opposite sides of the celestial equator, heard much like an opposition.", ''],
    ['Cosmobiology', "Reinhold Ebertin's school, grown from Alfred Witte's work: midpoints and the hard angles of the eighth harmonic, without Witte's hypothetical points.", ''],
    ['Declination', "How far a body stands north or south of the celestial equator, from 0 to 90 degrees. It is not the same as latitude from the ecliptic.", ''],
    ['Detriment', "The sign opposite a planet's own, where it works against the grain.", 'concept:Essential Dignity'],
    ['Dispositor', "The ruler of the sign a body stands in. Its condition colours the body it disposes, and its own dispositor colours it in turn, until the chain closes.", ''],
    ['Diurnal', "Of the day. The Sun, Jupiter and Saturn belong to the day, and work most easily when the Sun is above the horizon.", 'concept:Sect'],
    ['Dodecatemoria', "An old way of giving a sign or a degree more to say by dividing or multiplying it by twelve. The word can also mean the twelve signs themselves, or portions of twelve degrees.", 'concept:Decans'],
    ['Domicile', "A planet in a sign it rules, at home and most itself.", 'concept:Essential Dignity'],
    ['Ecliptic', "The Sun's apparent yearly path through the sky, tilted about twenty three and a half degrees to the equator. The zodiac is measured along it.", ''],
    ['Ecliptic latitude', "How far a body stands north or south of the ecliptic itself.", ''],
    ['Equinox', "Either moment the Sun crosses the celestial equator and day and night are near equal, around 21 March and 23 September.", ''],
    ['Exaltation', "A sign where a planet is honoured as a guest, the second of the essential dignities.", 'concept:Essential Dignity'],
    ['Face', "A ten degree third of a sign with a planet of its own, the least of the essential dignities. The same division is called the decan.", 'concept:Decans'],
    ['Fall', "The sign opposite a planet's exaltation, where it is least honoured.", 'concept:Essential Dignity'],
    ['Final disposition', "Follow a planet to the ruler of its sign, then that ruler to the ruler of its own, and on. The chain comes to rest at a planet in its own sign, or circles without end.", 'concept:Essential Dignity'],
    ['Firdaria', "Long periods of life, each given to a planet, a medieval technique attributed to the Persians. A day chart begins with the Sun and a night chart with the Moon.", 'concept:Sect'],
    ['Grand cross', "Four bodies in two oppositions, each joined to its neighbours by squares: four squares locked together, with no single body at the centre.", 'concept:Aspect Patterns'],
    ['Grand trine', "Three bodies each 120 degrees from the next, a triangle of trines. It is steady and easy, and can rest a little too comfortably.", 'concept:Aspect Patterns'],
    ['Hayz', "A planet that meets every condition of its sect at once, in its own hemisphere and its own kind of sign.", 'concept:Sect'],
    ['Hellenistic astrology', "The horoscopic tradition of the Mediterranean world from about the second or first century before the common era to the sixth or seventh after it, with Ptolemy's Tetrabiblos among its texts.", ''],
    ['Hyleg', "The planet or point older astrologers read as the giver of life, the one most bound to vitality. The ruler of its degree is the alcocoden.", ''],
    ['Imum coeli', "Where the ecliptic crosses the meridian below the Earth, opposite the Midheaven. It usually begins the 4th house.", ''],
    ['Joys', "The house each of the seven planets rejoices in: Mercury the 1st, the Moon the 3rd, Venus the 5th, Mars the 6th, the Sun the 9th, Jupiter the 11th and Saturn the 12th.", ''],
    ['Kite', "A grand trine with a fourth body opposite one of its three and sextile to the other two, so the triangle has a point to fly from.", 'concept:Aspect Patterns'],
    ['Lot', "A point made from three others: the distance between two is measured from the third, most often the Ascendant.", 'point:Part of Fortune'],
    ['Lunar nodes', "The two points where the Moon's path crosses the ecliptic, the north going up and the south going down.", 'point:North Node'],
    ['Lunar phases', "The Moon's month seen as light: four principal phases, new, first quarter, full and last quarter, and four between them.", ''],
    ['Midpoint', "The point halfway between two bodies. When a third body stands on it, the three are heard together.", ''],
    ['Mutual reception', "Two planets each standing in a sign the other rules, or otherwise dignified there, so each receives the other.", 'concept:Mutual Reception'],
    ['Mystic rectangle', "Two oppositions joined by sextiles on the short sides and trines on the long, a box held together by its own tension and ease.", 'concept:Aspect Patterns'],
    ['Nocturnal', "Of the night. The Moon, Venus and Mars belong to the night, and work most easily when the Sun is below the horizon.", 'concept:Sect'],
    ['Occidental', "Western, from the Latin for the west: setting and falling away, like the Sun going down.", ''],
    ['Orb', "How far from exact an aspect may be and still be heard.", 'essay:orbs'],
    ['Oriental', "Eastern, from the Latin for the east: rising and coming forth, like the Sun at dawn.", ''],
    ['Parallel', "Two bodies at the same declination on the same side of the equator, within about a degree. Some read it as a conjunction.", ''],
    ['Part of Fortune', "The lot of the body's fortunes: the Ascendant plus the Moon less the Sun by day, and the Sun less the Moon by night.", 'point:Part of Fortune'],
    ['Part of Spirit', "The lot of the mind and its intentions, made the other way round from the Part of Fortune.", 'point:Part of Fortune'],
    ['Partile', "An aspect in the same degree, or near enough. Lilly first meant the same degree and later allowed three.", 'essay:orbs'],
    ['Peregrine', "A planet with no essential dignity where it stands, a wanderer far from home.", 'concept:Peregrine'],
    ['Platic', "An aspect within its orb but not exact, the looser kind.", 'essay:orbs'],
    ['Prohibition', "Two planets moving toward an aspect, and a third reaching one of them first, so the first contact never forms. Lilly sets it out in Christian Astrology.", 'essay:orbs'],
    ['Quincunx', "Two bodies 150 degrees apart, in signs that share nothing, asking for adjustment.", ''],
    ['Quintile', "Two bodies 72 degrees apart, a fifth of the circle, linked to talent and to making something with it.", 'technique:Harmonic Charts'],
    ['Reception', "A planet received by the ruler of the sign it stands in, or of its exaltation, when the two are in aspect.", 'concept:Mutual Reception'],
    ['Refranation', "A kind of prohibition: a planet moving toward an aspect turns retrograde and draws away before the aspect is exact.", 'concept:Retrograde Motion'],
    ['Saros', "A span of 223 lunar months, about eighteen years and eleven days, after which an eclipse returns in nearly the same shape.", 'concept:Eclipses'],
    ['Sect', "The division of the seven planets into those of the day and those of the night. A planet of the chart's own sect works more easily.", 'concept:Sect'],
    ['Semisextile', "Two bodies 30 degrees apart, neighbours in the zodiac.", ''],
    ['Semisquare', "Two bodies 45 degrees apart, half a square.", ''],
    ['Separation', "A body within orb of another and moving away from the exact angle, so the contact is loosening. Retrograde motion can turn it around.", 'essay:orbs'],
    ['Sesquiquadrate', "Two bodies 135 degrees apart, a square and a half.", ''],
    ['Sidereal zodiac', "A zodiac fixed to the stars rather than to the seasons, used in Jyotish and in Western sidereal astrology.", 'concept:The Sidereal Zodiac and the Ayanamsa'],
    ['Solstice', "Where the Sun stands furthest from the equator: 0 Cancer in June and 0 Capricorn in December, in the tropical zodiac.", ''],
    ['Station', "The moment a planet's daily motion turns, direct to retrograde or back again, so it seems to hang on one degree. Tradition hears hesitation in it, and an effect that lingers.", 'concept:Retrograde Motion'],
    ['Stellium', "A gathering of bodies in one sign or one house. The older word is satellitium.", 'essay:stellium'],
    ['Succedent', "The houses that follow the angles, the 2nd, 5th, 8th and 11th. They are where things are held.", 'concept:Angular, Succedent, and Cadent Houses'],
    ['Synastry', "Reading two charts beside each other, one person's bodies laid over the other's. It is a conversation between charts, never a score.", 'essay:synastry'],
    ['T-square', "Two bodies in opposition, both square a third, which becomes the focus. The empty point across from the focus is held as sensitive.", 'concept:Aspect Patterns'],
    ['Terms', "Unequal portions of each sign, each given to one of the five planets and never to the lights. Also called bounds.", 'concept:Essential Dignity'],
    ['Translation of light', "A planet leaves one body and reaches another while still in orb of the first, carrying the first one's light across so the two are joined.", 'essay:orbs'],
    ['Triplicity', "Rulership by element, each of the four triplicities with planets of its own.", 'concept:Essential Dignity'],
    ['Tropical zodiac', "The zodiac anchored to the seasons, beginning at the spring equinox, with the solstices at 0 Cancer and 0 Capricorn.", ''],
    ['Uranian astrology', "The Hamburg School after Alfred Witte: midpoints, and eight hypothetical points beyond Neptune.", ''],
    ['Void of course', "A body, most often the Moon, that makes no further aspect before it leaves its sign.", 'concept:Void of Course Moon'],
    ['Yod', "Two bodies in sextile with a third quincunx to both, a long finger pointing at the third. It is also called the finger of fate.", 'concept:Aspect Patterns']
  ];

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

  return { VERSION: VERSION, SECTIONS: SECTIONS, INTRO: INTRO, SIGNS: SIGNS, HOUSES: HOUSES, HOUSE_SYSTEMS: HOUSE_SYSTEMS, HOUSE_SYSTEMS_INTRO: HOUSE_SYSTEMS_INTRO,
    STUDY_LESSONS: STUDY_LESSONS, studyLessons: studyLessons,
    ASTRAL_BODIES: ASTRAL_BODIES, POINTS: POINTS, ASPECTS: ASPECTS, ORBS: ORBS, CONCEPTS: CONCEPTS, CHART: CHART, SABIAN: SABIAN,
    STELLIUM: STELLIUM, TRANSITS: TRANSITS, TECHNIQUES: TECHNIQUES, SYNASTRY: SYNASTRY, EXAMPLE: EXAMPLE,
    LEXICON: LEXICON, STUDY_WORDS: STUDY_WORDS,
    sign: signByName, house: house, houseSystem: houseSystem, astralBody: astralBody, point: point, aspect: aspect };
}));
