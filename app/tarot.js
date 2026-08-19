/* tarot.js: inCommon tarot corpus and reading engine. V1.0.0
   Pure reference plus a deterministic weaver. Nothing here reads or writes a
   profile. The deck is the standard 78: twenty two Major Arcana in sequence,
   then Wands, Cups, Swords and Pentacles, each ace through king.

   Two things live here. CARDS is the reference the Library reads: title, number
   in the sequence, meanings upright and reversed, what the tradition says the
   card has meant historically, and what it is useful for. read() is the weaver:
   it takes a draw and returns a reading that ties every card to the ones around
   it rather than listing them one at a time.

   Epistemics, matching the rest of the app: which cards fell, which way up, and
   in what order is CALCULATED. What a card has meant for centuries is
   TRADITIONAL. What it might mean for the person holding it is POSSIBILITY.
   Voice: organic and scholarly. No em dashes.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Tarot = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '1.0.0';

  /* ---------- the four suits ---------- */
  var SUITS = [
    { key: 'wands', name: 'Wands', glyph: '\u2726', element: 'fire', arena: 'will, work, appetite and the thing you are burning fuel on',
      history: 'Wands descend from the batons of the Italian tarocchi, a labourer\u2019s suit in the earliest decks. The occult revival of the nineteenth century read the baton as a rod of will and gave the suit to fire.',
      utility: 'Read Wands when the question is about drive: whether to begin, whether to keep going, and where the energy is actually going.' },
    { key: 'cups', name: 'Cups', glyph: '\u25CB', element: 'water', arena: 'feeling, attachment, memory and what you are willing to be moved by',
      history: 'Cups come from the chalice suit of the fifteenth century decks, associated with the clergy and with grace. The Golden Dawn assigned them to water and to the emotional body.',
      utility: 'Read Cups when the question is about the heart: what is felt, what is unsaid, and what a relationship is actually being asked to carry.' },
    { key: 'swords', name: 'Swords', glyph: '\u2020', element: 'air', arena: 'thought, speech, conflict and the stories you are telling yourself',
      history: 'Swords were the nobility\u2019s suit, the arms of those who ruled by force. The tradition kept the edge and moved it inward, making the suit about the mind that cuts.',
      utility: 'Read Swords when the question is about clarity: what needs saying, what needs ending, and which fear is doing the thinking.' },
    { key: 'pentacles', name: 'Pentacles', glyph: '\u25C7', element: 'earth', arena: 'money, body, craft and the slow accumulation of a life',
      history: 'Coins were the merchant\u2019s suit. Renamed pentacles in the esoteric decks, they kept their commerce and gained the body, the harvest and the workshop.',
      utility: 'Read Pentacles when the question is material: work, money, health, and whether a thing is being built or merely maintained.' }
  ];

  /* ---------- the fourteen ranks ---------- */
  var RANKS = [
    { key: 'ace', name: 'Ace', num: 1, theme: 'a seed, offered rather than earned' },
    { key: 'two', name: 'Two', num: 2, theme: 'a pair, a choice, the first tension' },
    { key: 'three', name: 'Three', num: 3, theme: 'the first result, and the first witness to it' },
    { key: 'four', name: 'Four', num: 4, theme: 'structure, rest, and the risk of stopping here' },
    { key: 'five', name: 'Five', num: 5, theme: 'loss, friction, the necessary disturbance' },
    { key: 'six', name: 'Six', num: 6, theme: 'recovery, exchange, the return of balance' },
    { key: 'seven', name: 'Seven', num: 7, theme: 'assessment under pressure, alone' },
    { key: 'eight', name: 'Eight', num: 8, theme: 'movement, repetition, the work of getting through' },
    { key: 'nine', name: 'Nine', num: 9, theme: 'the near end, held in one pair of hands' },
    { key: 'ten', name: 'Ten', num: 10, theme: 'completion, and the weight completion leaves' },
    { key: 'page', name: 'Page', num: 11, theme: 'the beginner, the message, the unpractised hand' },
    { key: 'knight', name: 'Knight', num: 12, theme: 'the one who acts, at speed, sometimes past sense' },
    { key: 'queen', name: 'Queen', num: 13, theme: 'mastery held inwardly, given as care' },
    { key: 'king', name: 'King', num: 14, theme: 'mastery turned outward, given as authority' }
  ];

  /* ---------- the twenty two Major Arcana ---------- */
  var MAJORS = [
    { n: 0, name: 'The Fool', keys: ['beginning', 'risk', 'innocence'],
      up: 'A start taken without a map, and the particular clarity that comes from having nothing yet to protect.',
      rev: 'Recklessness dressed as freedom, or a start refused so long that it has begun to rot.',
      love: 'Something unrehearsed and genuinely new; reversed, an unwillingness to be pinned to anything.',
      fin: 'A leap worth taking on small stakes; reversed, a leap taken on stakes that were never small.',
      history: 'The Fool is the deck\u2019s oldest oddity, unnumbered in the earliest packs and free to move anywhere in the sequence. In the Marseille tradition he is the wanderer outside the count.',
      utility: 'Use it to ask whether you are at a genuine beginning or merely avoiding the middle of something.' },
    { n: 1, name: 'The Magician', keys: ['will', 'craft', 'focus'],
      up: 'Everything needed is already on the table. The question is concentration, not supply.',
      rev: 'Talent used to persuade rather than to build, or capability scattered across too many surfaces.',
      love: 'Real intent and the skill to express it; reversed, charm running well ahead of honesty.',
      fin: 'Resources are sufficient if focused; reversed, a scheme that only works while nobody looks closely.',
      history: 'Il Bagatto, the juggler or mountebank, opened the numbered sequence as a street performer. The occult revival promoted him to adept and gave him the four suit emblems as tools.',
      utility: 'Use it to audit your actual resources before deciding you lack any.' },
    { n: 2, name: 'The High Priestess', keys: ['knowing', 'threshold', 'silence'],
      up: 'Something is known before it can be argued for. The card asks you to wait rather than to explain.',
      rev: 'Intuition overruled by noise, or secrecy kept past the point where it protects anyone.',
      love: 'Depth that has not surfaced yet; reversed, a withholding that is starting to read as absence.',
      fin: 'Information you do not have yet is decisive; reversed, a deal with something deliberately unlit in it.',
      history: 'Once La Papesse, a figure the early decks placed beside the Pope and the Church disliked. Later readings made her the guardian of the veil rather than a churchwoman.',
      utility: 'Use it to name what you already suspect but have not said out loud.' },
    { n: 3, name: 'The Empress', keys: ['abundance', 'growth', 'care'],
      up: 'Something is fertile and wants tending rather than forcing. Growth here is bodily and slow.',
      rev: 'Care that has curdled into control, or a garden left to run wild while attention went elsewhere.',
      love: 'Warmth, generosity and appetite; reversed, love expressed as management.',
      fin: 'Increase through patience and good soil; reversed, comfort spent as fast as it arrives.',
      history: 'The Empress inherits both the medieval sovereign and older figures of abundance. Nineteenth century readers linked her to Venus and to the generative earth.',
      utility: 'Use it to ask what you are growing, and whether you are letting it take its own time.' },
    { n: 4, name: 'The Emperor', keys: ['structure', 'authority', 'limit'],
      up: 'Order, boundaries and someone willing to be responsible. Structure is the gift here, not the punishment.',
      rev: 'Rigidity, or an authority that has stopped earning the position it holds.',
      love: 'Steadiness and clear commitment; reversed, control mistaken for devotion.',
      fin: 'Budgets, contracts and rules that hold; reversed, a structure defended after it stopped working.',
      history: 'The Emperor is the temporal power beside the Pope\u2019s spiritual one, a pairing the earliest decks used to map the whole social order.',
      utility: 'Use it to find the one boundary that would resolve most of the confusion.' },
    { n: 5, name: 'The Hierophant', keys: ['tradition', 'teaching', 'belonging'],
      up: 'The established way, and the real usefulness of learning something the way it has been taught.',
      rev: 'Orthodoxy for its own sake, or a departure from the form that has not yet earned itself.',
      love: 'Commitment recognised publicly; reversed, a relationship measured against other people\u2019s templates.',
      fin: 'Conventional advice is sound here; reversed, an institution serving itself rather than you.',
      history: 'Il Papa in the Italian decks, renamed by later publishers to soften the church reference. The Golden Dawn read him as the outer teacher opposite the High Priestess\u2019s inner one.',
      utility: 'Use it to decide whether to follow the form or to leave it, and to say honestly which you are doing.' },
    { n: 6, name: 'The Lovers', keys: ['choice', 'union', 'values'],
      up: 'A meeting that requires a decision. The card is less about romance than about what you choose to be joined to.',
      rev: 'A choice avoided, or a union held together by habit rather than by agreement.',
      love: 'Genuine alignment, chosen with open eyes; reversed, attraction pulling against values.',
      fin: 'A partnership worth entering deliberately; reversed, terms nobody has actually agreed on.',
      history: 'Early versions show a young man between two women, or a marriage under Cupid\u2019s arrow. The moral reading, a choice between two paths, is the older one.',
      utility: 'Use it to name the choice you are treating as if it were weather.' },
    { n: 7, name: 'The Chariot', keys: ['drive', 'control', 'direction'],
      up: 'Opposing forces harnessed and pointed the same way. Movement through will rather than ease.',
      rev: 'Force without direction, or a grip so tight the vehicle cannot turn.',
      love: 'Two people pulling together on purpose; reversed, a relationship driven rather than shared.',
      fin: 'Momentum that rewards steering; reversed, effort spent maintaining speed rather than choosing a road.',
      history: 'The triumphal chariot comes from Petrarch\u2019s Trionfi and the civic processions the early decks drew on. Its two beasts were made black and white by later esotericists to signal opposites yoked.',
      utility: 'Use it to check whether you are steering or merely accelerating.' },
    { n: 8, name: 'Strength', keys: ['patience', 'courage', 'gentleness'],
      up: 'The animal is not defeated. It is handled, calmly, by someone who is not afraid of it.',
      rev: 'Force where patience was needed, or a self doubt that has begun to look like weakness.',
      love: 'Tenderness that does not flinch; reversed, tolerance stretched past what is healthy.',
      fin: 'Steady nerve through a slow patch; reversed, a decision made from fear of scarcity.',
      history: 'Numbered eleven in the Marseille decks and swapped with Justice by the Golden Dawn to fit the zodiac. Both numbers are still in print, which is why decks disagree.',
      utility: 'Use it to find the place where softness would actually be the stronger move.' },
    { n: 9, name: 'The Hermit', keys: ['solitude', 'search', 'lamp'],
      up: 'Withdrawal on purpose, carrying a small light. Answers here are found alone and slowly.',
      rev: 'Isolation that has stopped being useful, or advice sought from everyone except yourself.',
      love: 'Space taken honestly; reversed, distance used as an answer to a question nobody asked.',
      fin: 'A season for review rather than expansion; reversed, hoarding disguised as prudence.',
      history: 'Once Il Gobbo, the hunchback, and once Time itself carrying an hourglass. The lantern replaced the glass in the nineteenth century, turning age into guidance.',
      utility: 'Use it to decide what to stop consulting.' },
    { n: 10, name: 'Wheel of Fortune', keys: ['turning', 'chance', 'cycle'],
      up: 'A turn arrives from outside your effort. What rises here rose partly by luck, and knows it.',
      rev: 'Resistance to a turn already underway, or a run of luck read as merit.',
      love: 'A change of season in the bond; reversed, waiting for fate to do the talking.',
      fin: 'A shift in circumstance worth riding; reversed, a gamble that treats a cycle as a straight line.',
      history: 'The Rota Fortunae is medieval Europe\u2019s favourite image: kings rise and fall on the rim while the goddess turns the axle. The tarot inherited it nearly unchanged.',
      utility: 'Use it to separate what you caused from what merely happened around you.' },
    { n: 11, name: 'Justice', keys: ['balance', 'consequence', 'truth'],
      up: 'Cause and effect, weighed honestly. The card is interested in accuracy rather than in mercy.',
      rev: 'A ledger kept badly, or accountability avoided by whoever most needs to take it.',
      love: 'Fairness restored; reversed, an imbalance both people have agreed not to mention.',
      fin: 'Contracts, audits and the truth of the numbers; reversed, a cost being deferred rather than paid.',
      history: 'One of the four cardinal virtues the early decks scattered through the sequence. Her sword and scales are Roman before they are esoteric.',
      utility: 'Use it to work out what the honest accounting would show.' },
    { n: 12, name: 'The Hanged Man', keys: ['suspension', 'reversal', 'surrender'],
      up: 'A pause that is not wasted. Seeing the thing upside down is the only way it becomes legible.',
      rev: 'Stalling called sacrifice, or a martyrdom nobody asked for.',
      love: 'A willing pause that lets something settle; reversed, endurance mistaken for love.',
      fin: 'A delay that protects you; reversed, sunk cost holding the whole plan hostage.',
      history: 'The image comes from the pittura infamante, the shame portraits Italian cities painted of traitors hung by one foot. The tarot kept the posture and lost the disgrace.',
      utility: 'Use it to ask what becomes obvious if you stop trying to move.' },
    { n: 13, name: 'Death', keys: ['ending', 'transition', 'clearance'],
      up: 'Something is genuinely over. The card is not about dying; it is about the refusal to carry a corpse.',
      rev: 'An ending resisted, and the long expensive maintenance of what has already stopped.',
      love: 'A form of the relationship ending so another can exist; reversed, holding a shape past its life.',
      fin: 'A clean cut that frees resources; reversed, paying to keep something technically alive.',
      history: 'Unnamed on many Marseille cards, the thirteenth trump was left nameless out of superstition. Its reaper is medieval, and its meaning was read as change long before modern readers softened it.',
      utility: 'Use it to name what you already know is finished.' },
    { n: 14, name: 'Temperance', keys: ['blending', 'measure', 'patience'],
      up: 'Two things combined at the correct rate. The skill is proportion, not intensity.',
      rev: 'Excess in either direction, or a compromise so even that nothing in it is alive.',
      love: 'Real reconciliation, done slowly; reversed, a truce that avoids the actual subject.',
      fin: 'Steady mixing of risk and safety; reversed, a plan swinging between extremes.',
      history: 'The second of the cardinal virtues in the deck, pouring between vessels. Alchemical readers took the pouring literally and made her the card of the work.',
      utility: 'Use it to find the correct ratio rather than the correct side.' },
    { n: 15, name: 'The Devil', keys: ['bind', 'appetite', 'contract'],
      up: 'A binding you are participating in. The chains in the old image are loose, which is the whole point.',
      rev: 'The bind loosening, or an addiction rationalised into a personality.',
      love: 'Powerful attachment with a hook in it; reversed, the beginning of an honest look at the hook.',
      fin: 'Debt, dependency, or a deal that pays well and costs more; reversed, the first real reckoning.',
      history: 'The horned figure owes as much to Christian iconography as to any occult source. Eliphas Levi\u2019s Baphomet redrew him in 1856 and most modern decks still follow that drawing.',
      utility: 'Use it to identify what you are getting out of the thing you say you want to stop.' },
    { n: 16, name: 'The Tower', keys: ['rupture', 'revelation', 'collapse'],
      up: 'A structure comes down quickly, and the ground under it turns out to be the reliable part.',
      rev: 'A collapse delayed, or a shock absorbed without any of it being learned.',
      love: 'A sudden truth that changes the shape of everything; reversed, a crisis postponed at cost.',
      fin: 'An abrupt loss or exposure; reversed, propping up a structure whose faults you can list.',
      history: 'La Maison Dieu, the house of God, struck by lightning. Some scholars read the tower as Babel, others as a fire in a real city; the earliest decks are not telling.',
      utility: 'Use it to ask which structure you are spending your life defending.' },
    { n: 17, name: 'The Star', keys: ['hope', 'renewal', 'clarity'],
      up: 'After the fall, quiet water and a clear sky. Something is being replenished without being hurried.',
      rev: 'Faith mislaid, or optimism used as a way to avoid looking at the ground.',
      love: 'Gentle healing and honest openness; reversed, hope invested in a version of someone that does not exist.',
      fin: 'Recovery beginning, slowly and genuinely; reversed, a plan resting on wishing.',
      history: 'The Star follows the Tower in every ordering, and the sequence is old enough to be deliberate. Her two vessels pour onto land and into water, one for the body and one for the source.',
      utility: 'Use it to notice what has already started to heal without your supervision.' },
    { n: 18, name: 'The Moon', keys: ['uncertainty', 'dream', 'distortion'],
      up: 'A path lit badly. What you can see is real, and it is not everything, and you must walk anyway.',
      rev: 'Fog lifting, or a fear finally named and found smaller than it looked.',
      love: 'Ambiguity, projection and unspoken fear; reversed, a truth surfacing after a long confusion.',
      fin: 'Figures that do not add up yet; reversed, the missing information arriving.',
      history: 'The dog and the wolf, the pool and the crayfish, are Marseille inventions read since as the tame and wild mind. The card has always meant the hour when judgement is least reliable.',
      utility: 'Use it to separate what you know from what you have assembled out of fear.' },
    { n: 19, name: 'The Sun', keys: ['clarity', 'vitality', 'plain good'],
      up: 'Something is simply good, and visible, and not a trick. The card permits enjoyment.',
      rev: 'Brightness dimmed by doubt, or a success you are refusing to let yourself feel.',
      love: 'Warmth, ease and being seen; reversed, happiness held at arm\u2019s length.',
      fin: 'Plain success and honest gain; reversed, a good result undercut by the story you tell about it.',
      history: 'Children under a wall, or a single child on a horse, depending on the deck. The Sun is one of the few trumps whose meaning has barely shifted in five centuries.',
      utility: 'Use it to check whether you are able to accept a good thing when it arrives.' },
    { n: 20, name: 'Judgement', keys: ['reckoning', 'call', 'rising'],
      up: 'A summons you did not schedule. Something from the past is calling for a verdict and a response.',
      rev: 'The call ignored, or a self judgement so harsh it prevents any actual change.',
      love: 'A reconciliation or a decisive naming; reversed, replaying an old case that has already been decided.',
      fin: 'A past decision coming up for review; reversed, avoiding the audit you already know the result of.',
      history: 'The angel and the risen dead come straight from the Last Judgement of medieval church walls. Occult readers kept the trumpet and reframed it as vocation.',
      utility: 'Use it to answer the thing that keeps returning.' },
    { n: 21, name: 'The World', keys: ['completion', 'integration', 'threshold'],
      up: 'A cycle closes properly. Not a reward, but the recognition that the whole circuit was walked.',
      rev: 'A finish left slightly undone, or a closure claimed before the last step was taken.',
      love: 'Wholeness with another, or with yourself, that does not need defending; reversed, an almost.',
      fin: 'A project genuinely complete; reversed, one declared complete to avoid the last unpleasant part.',
      history: 'The dancer in her wreath, ringed by the four living creatures of Ezekiel and the evangelists. The four corners are why the card is read as the whole deck folded into one image.',
      utility: 'Use it to check whether you have finished the thing or merely stopped doing it.' }
  ];

  /* ---------- the minors, fourteen per suit ----------
     [keywords, upright, reversed, love clause, finance clause] */
  var MINOR = {
    wands: [
      [['ignition', 'offer', 'raw drive'], 'A spark is handed to you, unearned and genuinely live.', 'The spark is there and nothing has been done with it yet.', 'A fast attraction with real heat in it; reversed, interest that never leaves the idea stage.', 'A live opportunity worth acting on; reversed, an idea sitting unfunded and unstarted.'],
      [['planning', 'horizon', 'restlessness'], 'The first success is in hand and the view from it is larger than expected.', 'Planning used as a way to postpone the leaving.', 'Two people deciding whether the world they want is the same one; reversed, a future discussed but never chosen.', 'A plan with real reach; reversed, forecasts rewritten instead of acted on.'],
      [['expansion', 'waiting', 'shipment'], 'The ships are out. The work now is patience with something already in motion.', 'Delays, or an expansion that outran its supply line.', 'Space given while something grows; reversed, waiting on someone who is not coming back.', 'Investment placed and travelling; reversed, returns later and smaller than promised.'],
      [['threshold', 'celebration', 'home'], 'A stable joy, marked publicly. A foundation good enough to stand on.', 'The celebration is muted, or the foundation is not quite ready to bear weight.', 'Commitment made visible; reversed, a milestone reached without much feeling in it.', 'A secure base and a reason to mark it; reversed, stability that has not yet been earned.'],
      [['friction', 'competition', 'noise'], 'Everyone is talking at once and nobody is actually opposed.', 'The squabble ends, or it goes underground and gets worse.', 'Bickering that is mostly energy; reversed, conflict avoided until it has to be excavated.', 'Crowded market, real competition; reversed, undercutting nobody benefits from.'],
      [['recognition', 'return', 'momentum'], 'A public win, and the confidence that comes from being seen to have won.', 'The win is private, delayed, or credited elsewhere.', 'Pride in being chosen openly; reversed, a relationship performed for an audience.', 'Visible success and the leverage it brings; reversed, a result nobody is acknowledging.'],
      [['defence', 'stand', 'high ground'], 'You hold a position against pressure, and the position is defensible.', 'The ground is not worth what defending it is costing.', 'Protecting a bond against outside pressure; reversed, arguing to win rather than to stay.', 'Defending market or margin successfully; reversed, spending more to hold than the ground returns.'],
      [['speed', 'arrival', 'message'], 'Everything moves at once, and it moves in the right direction.', 'Rushed, scattered, or a message that landed badly.', 'Sudden acceleration and news; reversed, momentum lost mid air.', 'Fast movement of money or work; reversed, haste creating rework.'],
      [['resilience', 'guard', 'the last stretch'], 'Tired, wounded and still standing. The reserve is smaller than the resolve.', 'Vigilance turned into suspicion of everything.', 'Loving from a defensive crouch; reversed, exhaustion mistaken for a decision.', 'One more push with depleted reserves; reversed, guarding against a threat that has passed.'],
      [['overload', 'burden', 'too much'], 'The whole load is carried by one person, and that person volunteered.', 'The load is put down, or it finally breaks something.', 'Carrying the relationship alone; reversed, refusing help until resentment does the talking.', 'Overcommitment with real consequences; reversed, delegation arriving late but arriving.'],
      [['spark', 'news', 'apprentice'], 'An enthusiastic beginner and an idea worth the enthusiasm.', 'Enthusiasm with no follow through, or news that does not arrive.', 'A flirtation with genuine charm; reversed, interest that evaporates on contact with effort.', 'A promising small venture; reversed, a pitch stronger than the plan.'],
      [['charge', 'haste', 'adventure'], 'Movement now, questions later, and sometimes that is correct.', 'Recklessness, or a departure with nothing arranged behind it.', 'Passionate and impatient; reversed, a hot start with no staying power.', 'Bold action that pays if timed; reversed, a decision made at speed and regretted at leisure.'],
      [['warmth', 'confidence', 'command'], 'Certainty that warms a room rather than dominating it.', 'Confidence turned brittle, or warmth withdrawn as punishment.', 'Generous, magnetic, unembarrassed love; reversed, affection used as leverage.', 'Bold competent stewardship; reversed, risk taken to feel decisive.'],
      [['vision', 'authority', 'enterprise'], 'A long view held by someone with the standing to act on it.', 'Vision without patience, or authority spent on being right.', 'Leadership in the bond, freely given; reversed, one person deciding for two.', 'Entrepreneurial command; reversed, expansion driven by ego rather than by numbers.']
    ],
    cups: [
      [['offering', 'openness', 'the source'], 'Feeling is offered to you. Nothing is required except that you take it.', 'The cup is offered and not accepted, or feeling stopped before it surfaced.', 'A genuine opening of the heart; reversed, an emotion held back at the moment it mattered.', 'Generosity that arrives without invoice; reversed, goodwill left unclaimed.'],
      [['meeting', 'pact', 'attraction'], 'Two meet as equals and something is exchanged in the meeting.', 'The connection is uneven, or a pact quietly broken.', 'Real mutual recognition; reversed, an imbalance in what each is giving.', 'A partnership of equals; reversed, terms weighted to one side.'],
      [['joy', 'friendship', 'company'], 'Something worth celebrating, and people to celebrate it with.', 'The party is thin, or the friendship is doing something else under the surface.', 'Warmth held in good company; reversed, a third presence complicating a pair.', 'Collaborative success; reversed, credit distributed unevenly.'],
      [['apathy', 'offer', 'inattention'], 'Something is being offered while you look at what you already have and feel nothing.', 'The mood lifts, or the offer is finally noticed.', 'Boredom in a bond that is not actually broken; reversed, attention returning.', 'A good option ignored out of fatigue; reversed, re engagement after a flat spell.'],
      [['grief', 'spill', 'what remains'], 'Something is lost, and two cups are still standing behind you.', 'Grief beginning to move, or a loss refused for so long it has calcified.', 'Mourning what did not happen; reversed, turning to face what is still there.', 'A real loss with survivable remainder; reversed, writing off more than was actually lost.'],
      [['memory', 'kindness', 'return'], 'Something from earlier returns gently, and it is kind.', 'Nostalgia used as a residence rather than a visit.', 'An old warmth resurfacing; reversed, living in a version of the relationship that has passed.', 'Past work paying forward; reversed, trading on a reputation that is now history.'],
      [['options', 'fantasy', 'choice'], 'Many possibilities, most of them imagined, one of them real.', 'The fog clears and a single option becomes actual.', 'Infatuation with a possibility rather than a person; reversed, a real choice finally made.', 'Too many prospects, none examined; reversed, focus arriving after a costly detour.'],
      [['departure', 'search', 'enough'], 'Walking away from something adequate because adequate is not the point.', 'Leaving delayed, or a departure that solves nothing.', 'Leaving a bond that no longer feeds you; reversed, staying while already gone.', 'Abandoning a working but hollow arrangement; reversed, quitting without a next step.'],
      [['satisfaction', 'wish', 'plenty'], 'A wish granted on its own terms. Comfort with the taste of enough.', 'Satisfaction that arrived and did not fill the space it was supposed to.', 'Contentment and being pleased with each other; reversed, indulgence covering a gap.', 'Material comfort achieved; reversed, appetite outrunning enjoyment.'],
      [['harmony', 'belonging', 'the whole'], 'Emotional completeness, shared rather than owned.', 'The picture of harmony maintained over a truth nobody wants to raise.', 'A settled, mutual happiness; reversed, an image of family kept up for the neighbours.', 'Shared prosperity that everyone feels; reversed, appearances funded past their worth.'],
      [['tenderness', 'message', 'first feeling'], 'An unpractised feeling, offered anyway.', 'Sentiment without spine, or a message never sent.', 'A sweet, slightly awkward beginning; reversed, feelings hinted at and never said.', 'A gentle small opportunity; reversed, an offer too vague to act on.'],
      [['romance', 'invitation', 'idealism'], 'The one who arrives with an offer and means it in the moment.', 'Charm without follow through, or an ideal you cannot live inside.', 'Courtship, sincere and a little theatrical; reversed, promises made in feeling and forgotten in practice.', 'An attractive proposal; reversed, an offer that reads better than it pays.'],
      [['empathy', 'depth', 'holding'], 'Emotional intelligence used in service of someone else.', 'Feeling absorbed until there is nothing left of the one absorbing it.', 'Deep attuned care; reversed, caretaking that has swallowed the carer.', 'Intuitive judgement about people; reversed, decisions made from sympathy alone.'],
      [['mastery', 'calm', 'diplomacy'], 'Feeling fully present and fully governed. Neither suppressed nor spilled.', 'Composure used to avoid, or emotion managed until it is unreachable.', 'Steady loving maturity; reversed, warmth withheld behind competence.', 'Calm stewardship under pressure; reversed, avoidance dressed as professionalism.']
    ],
    swords: [
      [['clarity', 'cut', 'truth'], 'A clean thought arrives with an edge on it. Say it plainly.', 'Clarity refused, or truth used as a weapon.', 'An honest conversation that changes things; reversed, words chosen to wound.', 'A decisive insight; reversed, analysis paralysed by its own sharpness.'],
      [['stalemate', 'blindfold', 'avoidance'], 'A choice held in suspension by refusing to look at either side.', 'The blindfold comes off, or the stalemate hardens.', 'Not choosing, and calling it fairness; reversed, the truth finally admitted.', 'A decision deferred at cost; reversed, information arriving that forces the call.'],
      [['heartbreak', 'naming', 'rain'], 'It hurts, it is clear why, and the clarity is part of the pain.', 'Grief beginning to drain, or a wound kept open deliberately.', 'A painful truth spoken aloud; reversed, recovery starting slowly.', 'A loss you can account for exactly; reversed, ruminating past any use.'],
      [['rest', 'retreat', 'recovery'], 'Deliberate stillness. Not surrender, but repair.', 'Rest refused, or rest that has become hiding.', 'A pause that protects both people; reversed, withdrawal with no return date.', 'Stepping back to recover capacity; reversed, avoidance of a decision you must make.'],
      [['conflict', 'cost', 'winning'], 'A win that costs more than it returns, and everyone can see it.', 'The fight ends, or the damage is finally counted.', 'Being right at the expense of being close; reversed, an apology that is actually offered.', 'A hollow victory; reversed, cutting losses in a dispute.'],
      [['passage', 'leaving', 'calmer water'], 'Moving away from difficulty, with the difficulty still in the boat.', 'The crossing delayed, or a return to what you left.', 'Moving on together, quietly; reversed, unable to leave the argument behind.', 'Transition to steadier conditions; reversed, relocation that changes nothing.'],
      [['strategy', 'stealth', 'partial'], 'Taking what you can carry and leaving the rest. Clever, and not entirely clean.', 'The scheme unravels, or conscience arrives.', 'Something being kept from someone; reversed, a secret coming out.', 'A shortcut with exposure in it; reversed, the shortcut being audited.'],
      [['restriction', 'story', 'the way out'], 'Bound by a situation you have partly narrated yourself into.', 'The bindings loosen once one assumption is tested.', 'Feeling trapped by a bond you are choosing hourly; reversed, the first real move.', 'Constraint that is real but not total; reversed, an exit that was always available.'],
      [['anxiety', 'night', 'proportion'], 'The fear at three in the morning, larger than the thing it is about.', 'Dawn, or worry rehearsed until it is a habit.', 'Fear of loss doing the talking; reversed, the fear named and shrinking.', 'Catastrophising a manageable shortfall; reversed, perspective returning.'],
      [['ending', 'bottom', 'melodrama'], 'Something is decisively finished and it was finished before the last blow.', 'The recovery begins, or the ending is dramatised past its size.', 'A definitive end; reversed, an ending survived and slowly outgrown.', 'Total loss in one area; reversed, the worst passed and the rebuild starting.'],
      [['curiosity', 'watching', 'first word'], 'A sharp new interest, still learning what it is looking at.', 'Curiosity turned to surveillance, or words spoken carelessly.', 'Direct questions asked at last; reversed, gossip and half information.', 'A useful piece of intelligence; reversed, acting on unverified news.'],
      [['directness', 'haste', 'argument'], 'Straight at it, fast, with no interest in cushioning the landing.', 'Aggression without aim, or a charge into the wrong argument.', 'Blunt honesty that clears the air; reversed, conflict for the sake of motion.', 'Decisive fast action; reversed, a rash move made on partial data.'],
      [['discernment', 'boundary', 'experience'], 'Clear sight earned through loss, offered without sentiment.', 'Coldness where discernment was, or a boundary that became a wall.', 'Honesty that respects both people; reversed, distance justified as standards.', 'Unsentimental accurate assessment; reversed, cynicism read as realism.'],
      [['judgement', 'authority', 'principle'], 'The rule stated by someone who has the standing to state it.', 'Authority without compassion, or principle used to avoid a person.', 'Fair firm terms; reversed, being litigated rather than loved.', 'Sound governance and clear rules; reversed, rigidity that costs the opportunity.']
    ],
    pentacles: [
      [['seed', 'means', 'offer'], 'A tangible beginning. Money, work or health, handed over as a real thing.', 'The opportunity unused, or a beginning with no ground under it.', 'Something practical offered in love; reversed, promises without arrangements.', 'A concrete opportunity or sum; reversed, a chance let go unexamined.'],
      [['juggling', 'flex', 'balance'], 'Two obligations kept in the air by continuous small adjustments.', 'One ball drops, or the juggling was never sustainable.', 'Making room for each other in full lives; reversed, a relationship funded by leftovers.', 'Cash flow managed by agility; reversed, overextension becoming visible.'],
      [['craft', 'collaboration', 'standard'], 'Skill recognised, and work done with others who know the trade.', 'Standards slipping, or a team pulling in different directions.', 'Building something together deliberately; reversed, uneven effort in the making.', 'Quality work earning its reputation; reversed, corners cut where they show later.'],
      [['holding', 'security', 'grip'], 'What you have is held tightly, and the tightness is starting to show.', 'The grip loosens, or scarcity thinking hardens.', 'Security valued over openness; reversed, letting someone closer than is comfortable.', 'Reserves protected; reversed, capital hoarded past usefulness.'],
      [['want', 'exclusion', 'the lit window'], 'Real shortage, made worse by walking past what others have.', 'The shortage easing, or help finally asked for.', 'Feeling outside the warmth; reversed, being let back in.', 'A hard material stretch; reversed, recovery beginning quietly.'],
      [['giving', 'terms', 'exchange'], 'Help moves, and the terms of the help matter as much as the amount.', 'Generosity with a hook, or a debt disguised as a gift.', 'Care given and received in balance; reversed, an imbalance of power dressed as kindness.', 'Fair exchange or funding; reversed, strings attached to money.'],
      [['assessment', 'patience', 'the long crop'], 'A pause to look honestly at what the effort has produced so far.', 'Impatience, or effort continued out of habit rather than judgement.', 'Assessing whether the relationship is growing; reversed, waiting without reviewing.', 'Reviewing return on investment; reversed, throwing time after time.'],
      [['practice', 'repetition', 'apprenticeship'], 'The unglamorous work that turns capacity into skill.', 'Repetition without progress, or perfectionism replacing output.', 'Steady daily attention; reversed, going through the motions.', 'Diligence compounding; reversed, busywork mistaken for building.'],
      [['self sufficiency', 'refinement', 'earned ease'], 'Independence that was built rather than inherited, and is enjoyed.', 'Comfort that is isolating, or self reliance used to keep people out.', 'Wholeness alone that makes company a choice; reversed, independence as armour.', 'Earned security; reversed, luxury outpacing the income under it.'],
      [['legacy', 'family', 'the long term'], 'Wealth in the widest sense: structures that outlast the person who built them.', 'A legacy contested, or long term thinking abandoned for the near one.', 'Building something durable together; reversed, family expectations pressing on a couple.', 'Generational or structural gain; reversed, short horizons eroding a good position.'],
      [['study', 'beginning', 'earnest'], 'A student of something practical, and genuinely willing to be bad at it first.', 'Study without application, or a beginning endlessly postponed.', 'Learning how to love this particular person; reversed, unwillingness to learn.', 'A new skill or small venture; reversed, plans that stay theoretical.'],
      [['persistence', 'slowness', 'reliability'], 'Unhurried, unglamorous, and the one who actually arrives.', 'Stagnation, or reliability that has become inertia.', 'Dependability that builds trust; reversed, a bond with no motion in it.', 'Slow certain progress; reversed, a plan stalled and defended.'],
      [['nurture', 'resource', 'competence'], 'Practical care: the person who notices what is needed and provides it.', 'Overprovision, or self neglect while providing for everyone else.', 'Love expressed as tangible care; reversed, giving until nothing is left for the giver.', 'Resourceful management; reversed, working to exhaustion for security.'],
      [['provision', 'wealth', 'stewardship'], 'Established material mastery, used to hold something steady for others.', 'Control through resources, or success with nothing left in it but the ledger.', 'Solid provision and commitment; reversed, worth measured in what is provided.', 'Command of assets; reversed, risk aversion that forecloses growth.']
    ]
  };

  /* ---------- assemble the 78 ---------- */
  var CARDS = [];
  MAJORS.forEach(function (m) {
    CARDS.push({ n: m.n, seq: m.n, name: m.name, arcana: 'major', suit: null, rank: null,
      element: null, keys: m.keys, up: m.up, rev: m.rev, love: m.love, fin: m.fin,
      history: m.history, utility: m.utility, num: m.n });
  });
  SUITS.forEach(function (s, si) {
    MINOR[s.key].forEach(function (row, ri) {
      var r = RANKS[ri];
      CARDS.push({ n: 22 + si * 14 + ri, seq: 22 + si * 14 + ri,
        name: r.name + ' of ' + s.name, arcana: 'minor', suit: s.key, suitName: s.name,
        glyph: s.glyph, element: s.element, rank: r.key, rankName: r.name, num: r.num,
        keys: row[0], up: row[1], rev: row[2], love: row[3], fin: row[4],
        history: s.history, utility: s.utility, rankTheme: r.theme });
    });
  });

  /* ---------- spreads ---------- */
  var POSITIONS = {
    3: ['What is behind this', 'Where you stand', 'What is arriving'],
    6: ['What is behind this', 'Where you stand', 'What is arriving', 'What is holding it up', 'What is pulling against it', 'What it asks of you'],
    9: ['The root', 'What is behind this', 'Where you stand', 'What is arriving', 'What is holding it up', 'What is pulling against it', 'The inner current', 'The outer weather', 'Where it lands'],
    11: ['The root', 'What is behind this', 'Where you stand', 'What is arriving', 'What is holding it up', 'What is pulling against it', 'The inner current', 'The outer weather', 'What you have not named', 'The turn', 'Where it lands']
  };

  var TOPICS = {
    general: { name: 'General', field: null, glyph: '\u2732',
      lens: 'read wide: whatever is loudest in your life right now is what the cards will attach themselves to',
      close: 'A general reading is broad by design. The parts that fit will fit obviously; the parts that do not are not a message you have failed to decode.' },
    love: { name: 'Love and Romance', field: 'love', glyph: '\u2661',
      lens: 'read through attachment: what is offered, what is withheld, and what the bond is being asked to carry',
      close: 'Nothing here obliges anybody. A reading can name a pattern in a relationship; only the two people in it decide what happens next.' },
    finance: { name: 'Finance', field: 'fin', glyph: '\u25C8',
      lens: 'read through material life: work, money, security, and the difference between building and maintaining',
      close: 'This is not financial advice and cannot be. Treat any figure it seems to point at as a question to check, never an instruction to follow.' }
  };

  var DEPTHS = {
    quick: { name: 'Quick', counts: [3, 6], blurb: 'Three or six cards, two or three sentences. The shape of it, nothing more.' },
    divine: { name: 'Divine', counts: [6, 9], blurb: 'Six or nine cards, read in full paragraphs, with the weave between them.' },
    celestial: { name: 'Celestial', counts: [9, 11], blurb: 'The long study. Nine or eleven cards, every one against every other, at least five passages, ending in a prediction you can test.' }
  };

  /* ---------- deterministic draw ----------
     A seeded shuffle so a reading can be re-rendered without changing under the
     reader, and so a saved reading can be reproduced exactly from its seed. */
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  function draw(count, seed) {
    var r = rng(seed), idx = [], i, j, t, out = [];
    for (i = 0; i < CARDS.length; i++) idx.push(i);
    for (i = idx.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var pos = POSITIONS[count] || POSITIONS[3];
    for (i = 0; i < count; i++) {
      out.push({ card: CARDS[idx[i]], rev: r() < 0.45, pos: pos[i] || ('Card ' + (i + 1)), i: i });
    }
    return out;
  }

  /* ---------- helpers the weaver leans on ---------- */
  function low(t) { return t ? t.charAt(0).toLowerCase() + t.slice(1) : ''; }
  function cap(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ''; }
  function strip(t) { return String(t || '').replace(/\.$/, ''); }
  /* Several meanings run to two sentences. Anything spliced into the middle of a
     woven line takes the first sentence only, or the second one lands lowercase
     inside a clause it was never written for. */
  function firstSent(t) { var s = String(t || '').split(/(?<=\.)\s+/)[0] || String(t || ''); return s.trim(); }
  function piece(d) { return low(strip(firstSent(meaning(d)))); }
  /* Most card meanings are complete clauses, not noun phrases, so they cannot be
     lowercased and spliced after a connective. Anything joined to a connective
     is joined as its own sentence instead. */
  function sent(d) { var s = firstSent(meaning(d)).trim(); return cap(/[.!?]$/.test(s) ? s : s + '.'); }
  function artN(n) { return (n === 8 || n === 11 || n === 18) ? 'An' : 'A'; }
  var WORDS = ['no', 'One', 'Two', 'Three', 'Four'];
  function wordN(n) { return WORDS[n] || String(n); }
  function meaning(d) { return d.rev ? d.card.rev : d.card.up; }
  function topicClause(d, topic) {
    var f = TOPICS[topic] && TOPICS[topic].field;
    if (!f) return '';
    var whole = d.card[f] || '';
    var parts = whole.split('; reversed, ');
    if (parts.length === 2) return d.rev ? parts[1] : parts[0];
    return whole;
  }
  function tally(drawn) {
    var t = { suits: { wands: 0, cups: 0, swords: 0, pentacles: 0 }, major: 0, rev: 0,
      courts: 0, aces: 0, nums: {}, elements: { fire: 0, water: 0, air: 0, earth: 0 } };
    drawn.forEach(function (d) {
      var c = d.card;
      if (d.rev) t.rev++;
      if (c.arcana === 'major') { t.major++; return; }
      t.suits[c.suit]++;
      t.elements[c.element]++;
      if (c.num >= 11) t.courts++;
      if (c.num === 1) t.aces++;
      t.nums[c.num] = (t.nums[c.num] || 0) + 1;
    });
    return t;
  }
  function dominantSuit(t) {
    var best = null, n = -1;
    Object.keys(t.suits).forEach(function (k) { if (t.suits[k] > n) { n = t.suits[k]; best = k; } });
    return n > 0 ? { key: best, count: n, suit: suitOf(best) } : null;
  }
  function absentSuits(t) {
    return Object.keys(t.suits).filter(function (k) { return t.suits[k] === 0; }).map(suitOf);
  }
  function suitOf(key) { return SUITS.filter(function (s) { return s.key === key; })[0]; }
  function repeats(t) {
    return Object.keys(t.nums).filter(function (k) { return t.nums[k] > 1; })
      .map(function (k) { return { num: +k, count: t.nums[k], rank: RANKS[+k - 1] }; });
  }
  function label(d) { return d.card.name + (d.rev ? ' reversed' : ''); }

  /* ---------- the weave ----------
     Every passage refers to at least two cards. A card is never described alone
     unless it is the only one in the draw. */
  function pairLine(a, b, topic) {
    var link = a.rev === b.rev
      ? (a.rev ? 'Both are reversed, so the pair reads as one blockage described twice. '
               : 'Both stand upright, so they reinforce rather than complicate each other. ')
      : 'One is reversed and one is not, which is where the tension in this reading sits. ';
    return link + sent(a) + ' Against that: ' + sent(b);
  }
  function arcLine(drawn) {
    var f = drawn[0], l = drawn[drawn.length - 1];
    return 'The reading opens on ' + label(f) + ' in the position of ' + low(f.pos) +
      ' and closes on ' + label(l) + ' at ' + low(l.pos) + '. Read the first as the ground the question is standing on and the last as what the ground is turning into.';
  }
  function suitLine(t, drawn) {
    var dom = dominantSuit(t), gone = absentSuits(t), bits = [];
    if (dom && dom.count > 1) {
      bits.push(dom.count + ' of the ' + drawn.length + ' cards are ' + dom.suit.name +
        ', which puts the weight of this reading on ' + dom.suit.arena + '.');
    } else if (t.major >= Math.ceil(drawn.length / 2)) {
      bits.push('The suits are scattered and the Major Arcana carry the reading instead, which the tradition reads as a matter larger than the daily one.');
    } else {
      bits.push('No suit dominates. The reading is spread across several parts of your life rather than concentrated in one.');
    }
    if (gone.length === 1) {
      bits.push('Nothing from ' + gone[0].name + ' appears at all, so ' + gone[0].arena.split(',')[0] + ' is either settled or being left out of the question.');
    } else if (gone.length > 1 && gone.length < 4) {
      bits.push('Two of the four suits are missing entirely, which narrows the reading more than a full spread usually allows.');
    }
    return bits.join(' ');
  }
  function orientLine(t, drawn) {
    var up = drawn.length - t.rev;
    if (t.rev === 0) return 'Every card fell upright. The tradition reads an all upright draw as a situation with no hidden brake in it: what you see is the whole mechanism.';
    if (t.rev === drawn.length) return 'Every card fell reversed. That is unusual, and it is read as one obstruction repeated at every level rather than as many separate problems.';
    return up + ' upright against ' + t.rev + ' reversed. The reversed cards are not bad cards; they mark where the current is running backwards or has not been let out yet.';
  }
  function majorLine(t, drawn) {
    if (!t.major) return 'No Major Arcana appear. The tradition takes that as a matter still in your hands, worked out through daily choices rather than through anything larger.';
    if (t.major === 1) return 'One Major Arcanum stands in the draw, and it is the hinge: the minors around it describe how that single larger movement is being lived out.';
    return t.major + ' Major Arcana in a draw of ' + drawn.length + '. That density is read as a season rather than an episode, and seasons are not usually argued out of.';
  }
  function repeatLine(t) {
    var r = repeats(t);
    if (!r.length) return '';
    var named = r.map(function (x) {
      return 'the number ' + x.num + ' appears ' + x.count + ' times, and ' + x.rank.name + 's carry ' + x.rank.theme;
    });
    return cap(named.join('; ')) + '. A repeated number is the tradition\u2019s loudest signal: it says the same lesson is being offered in more than one part of your life at once.';
  }
  function courtLine(t) {
    if (!t.courts) return '';
    if (t.courts === 1) return 'One court card appears. Courts are usually read as people, or as the part of you that behaves like one, so expect a specific figure in this.';
    return t.courts + ' court cards appear, which the tradition reads as other people being genuinely involved rather than as a private matter.';
  }
  function elementLine(t) {
    var e = t.elements, hi = null, n = -1;
    Object.keys(e).forEach(function (k) { if (e[k] > n) { n = e[k]; hi = k; } });
    if (n < 2) return '';
    var pair = { fire: 'water', water: 'fire', air: 'earth', earth: 'air' }[hi];
    var opp = e[pair];
    return 'By element the draw runs ' + hi + ' heavy' + (opp ? ', with ' + pair + ' present as a counterweight. The tradition reads that pairing as a temperature problem: the right action at the wrong heat.'
      : ', with nothing of ' + pair + ' to answer it, so the reading tends to overshoot in that direction.');
  }
  function chainLine(drawn, topic) {
    var out = [];
    for (var i = 0; i < drawn.length - 1; i++) {
      var a = drawn[i], b = drawn[i + 1];
      out.push(label(a) + ' at ' + low(a.pos) + ' hands on to ' + label(b) + ' at ' + low(b.pos) + '. ' +
        sent(a) + ' From there: ' + sent(b));
    }
    return out;
  }

  /* ---------- the three readings ---------- */
  function quick(drawn, topic) {
    var T = TOPICS[topic], f = drawn[0], m = drawn[Math.floor(drawn.length / 2)], l = drawn[drawn.length - 1];
    var t = tally(drawn), dom = dominantSuit(t);
    var s1 = label(f) + ' behind you, ' + label(m) + ' where you stand, ' + label(l) + ' arriving.';
    var s2 = sent(f) + ' What arrives is this: ' + sent(l);
    var s3 = topic === 'general'
      ? (dom && dom.count > 1 ? 'The weight sits on ' + dom.suit.arena.split(',')[0] + ', so start there.' : 'Nothing dominates, so take the middle card as the instruction.')
      : cap(strip(topicClause(m, topic))) + '.';
    return [
      { tag: 'CALCULATED', text: s1 },
      { tag: 'TRADITIONAL', text: s2 },
      { tag: 'POSSIBILITY', text: s3 }
    ];
  }

  function divine(drawn, topic) {
    var t = tally(drawn), T = TOPICS[topic], out = [];
    out.push({ tag: 'CALCULATED', text: arcLine(drawn) + ' ' + drawn.length + ' cards, ' +
      (drawn.length - t.rev) + ' upright and ' + t.rev + ' reversed, ' + T.lens + '.' });
    var mid = drawn.slice(1, drawn.length - 1);
    var body = mid.map(function (d) {
      return label(d) + ' at ' + low(d.pos) + '. ' + sent(d) +
        (topic === 'general' ? '' : ' In this question: ' + cap(strip(topicClause(d, topic))) + '.');
    }).join(' ');
    out.push({ tag: 'TRADITIONAL', text: body + ' ' + pairLine(drawn[0], drawn[drawn.length - 1], topic) });
    out.push({ tag: 'TRADITIONAL', text: [suitLine(t, drawn), orientLine(t, drawn), majorLine(t, drawn)].filter(Boolean).join(' ') });
    var last = drawn[drawn.length - 1];
    out.push({ tag: 'POSSIBILITY', text: 'Taken together the draw points at one move rather than several. ' +
      sent(last) + ' ' + (repeatLine(t) || courtLine(t) || '') + ' ' + T.close });
    return out;
  }

  function celestial(drawn, topic) {
    var t = tally(drawn), T = TOPICS[topic], out = [], dom = dominantSuit(t);
    out.push({ tag: 'CALCULATED', text: artN(drawn.length) + ' ' + drawn.length + ' card draw, ' + T.name.toLowerCase() + ', ' + T.lens + '. ' +
      arcLine(drawn) + ' ' + (t.rev === 0 ? 'Every card fell upright'
        : t.rev === drawn.length ? 'Every card fell reversed'
        : (drawn.length - t.rev) + ' cards stand upright and ' + t.rev + ' are reversed') + ', and ' +
      (t.major === 1 ? 'one of them belongs' : t.major === 0 ? 'none of them belong' : t.major + ' of them belong') + ' to the Major Arcana.' });

    out.push({ tag: 'TRADITIONAL', text: 'Read in sequence, the cards hand on to one another rather than standing apart. ' +
      chainLine(drawn, topic).join(' ') });

    out.push({ tag: 'TRADITIONAL', text: [suitLine(t, drawn), elementLine(t)].filter(Boolean).join(' ') +
      (dom ? ' ' + dom.suit.utility : '') });

    out.push({ tag: 'TRADITIONAL', text: orientLine(t, drawn) + ' ' + majorLine(t, drawn) + ' ' +
      (t.rev ? 'Where a card is reversed, the tradition does not flip its meaning to the opposite. It reads the same force turned inward, delayed, or refused, which is why reversed cards so often describe something you already know and have not acted on.' : '') });

    var num = repeatLine(t), crt = courtLine(t);
    out.push({ tag: 'TRADITIONAL', text: (num || 'No number repeats in this draw, so no single lesson is being pressed twice; the reading gains its weight from sequence rather than from emphasis.') +
      ' ' + (crt || 'No court cards appear, which points at a situation you are working out largely by yourself.') +
      ' ' + (t.aces ? wordN(t.aces) + ' Ace' + (t.aces > 1 ? 's' : '') + ' in the draw marks a genuine beginning inside whatever else is happening.' : 'No Aces fall, so this is a middle rather than a start.') });

    var f = drawn[0], m = drawn[Math.floor(drawn.length / 2)], l = drawn[drawn.length - 1];
    out.push({ tag: 'SYNTHESIS', text: 'Woven, the reading turns on three of its cards. ' + label(f) +
      ' sets the ground. ' + sent(f) + ' ' + label(m) + ' is the pivot. ' + sent(m) +
      ' ' + label(l) + ' is where it lands. ' + sent(l) + ' ' + pairLine(f, l, topic) });

    out.push({ tag: 'POSSIBILITY', text: 'If the pattern holds, the next stretch looks like this. ' +
      sent(l) + (topic === 'general' ? '' : ' In this question specifically: ' + cap(strip(topicClause(l, topic))) + '.') +
      ' ' + (dom && dom.count > 1 ? 'Watch ' + dom.suit.arena.split(',')[0] + ' first; that is where the draw is densest and where a change would show earliest. ' : '') +
      'This is a prediction in the only sense a spread can offer one: a pattern named clearly enough that you can check it against what actually happens. ' + T.close });

    return out;
  }

  function read(o) {
    var count = o.count, topic = o.topic || 'general', depth = o.depth || 'quick';
    var drawn = o.drawn || draw(count, o.seed || 1);
    var passages = (depth === 'quick' ? quick(drawn, topic)
      : depth === 'divine' ? divine(drawn, topic)
      : celestial(drawn, topic)).map(function (p) {
        return { tag: p.tag, text: String(p.text).replace(/\s+/g, ' ').trim() };
      });
    var t = tally(drawn);
    return {
      drawn: drawn, topic: topic, depth: depth, count: drawn.length,
      title: TOPICS[topic].name + ' \u00b7 ' + DEPTHS[depth].name + ' \u00b7 ' + drawn.length + ' cards',
      passages: passages,
      stats: { upright: drawn.length - t.rev, reversed: t.rev, major: t.major, courts: t.courts },
      summary: drawn.map(label).join(', ')
    };
  }

  return {
    VERSION: VERSION, CARDS: CARDS, SUITS: SUITS, RANKS: RANKS, MAJORS: MAJORS,
    POSITIONS: POSITIONS, TOPICS: TOPICS, DEPTHS: DEPTHS,
    draw: draw, read: read, tally: tally, label: label,
    byName: function (n) { return CARDS.filter(function (c) { return c.name === n; })[0] || null; },
    section: function (key) {
      if (key === 'major') return CARDS.filter(function (c) { return c.arcana === 'major'; });
      return CARDS.filter(function (c) { return c.suit === key; });
    },
    INTRO: {
      what: 'Tarot is a deck of seventy eight images with five centuries of commentary attached. It does not know anything. It is a structured way of looking at a situation from angles you would not have chosen yourself.',
      how: 'A reading here is drawn at random, recorded with its seed, and woven rather than listed: every card is read against the ones beside it, in the order they fell and in the direction they landed.',
      caution: 'No claim on this page has been shown to predict anything by any means outside the tradition itself. Read it as a mirror with a vocabulary, and keep your own record of whether it was ever useful.'
    }
  };
}));
