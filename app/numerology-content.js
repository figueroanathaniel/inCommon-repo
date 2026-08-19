/* numerology-content.js. Content layer for the My Numerology page. V1.0.0

   Same modular logic as placement-content.js: a number means something on its
   own, something different in each position, and something different again at a
   given stage of life. Enumerating every combination would be 9 numbers x 10
   positions x 3 stages of written text. Instead this file holds:

     UNIVERSAL   what the number is, regardless of where it lands
     POSITION    what each position does to a number (Life Path, Expression,
                 Soul Urge, Personal Year / Month / Day, Pinnacle, Challenge,
                 Birthday, Cycle)
     STAGE       how the same number reads early, mid, and late in a life
     LISTS       strengths, challenges, opportunities, obstacles per number

   Epistemic tags follow the app vocabulary. Position and universal meanings are
   [TRADITIONAL], stage readings are [POSSIBILITY], and nothing here states a
   fact about the person. No em dashes anywhere in generated text.            */
(function () {
  'use strict';

  var N = {
    1: { name: 'the Initiator', essence: 'beginnings, initiative, and standing alone',
      universal: 'The number 1 is the starting point. It is will, independence, and the courage to go first. Where 1 falls, something has to be begun by you rather than joined.',
      path: 'you are here to lead rather than follow, and to learn that originality costs the comfort of company',
      express: 'you come across as direct, self-starting, and hard to redirect once decided',
      soul: 'what you privately want is autonomy: the right to decide without a committee',
      year: 'a year of new ground. Plant rather than harvest, and expect the results later',
      month: 'a month for starting the thing rather than perfecting it',
      day: 'a day that rewards the first move',
      pinnacle: 'a long stretch of self-development, where independence is built whether or not you felt ready for it',
      challenge: 'the lesson of standing on your own without turning it into isolation, and of asserting without dominating',
      cycle: 'a period whose theme is self-definition and first attempts',
      birthday: 'a native gift for initiative: you tend to open what others continue',
      strengths: ['You may find beginning easier than most people find deciding.', 'You may carry a natural authority that does not need volume.', 'You may work well without supervision or applause.'],
      challenges: ['You may confuse independence with refusing help.', 'You may start more than you finish.', 'You may read collaboration as dilution.'],
      opportunities: ['There is room to lead something small that is genuinely yours.', 'There is room to let a first draft be enough.', 'There is room to invite one person in early.'],
      obstacles: ['A habit of proving self-sufficiency before it is asked for.', 'Impatience with the slow middle of any project.', 'A tendency to leave when the work turns collective.'],
      stage: { young: 'Early on, 1 often shows up as restlessness with instruction. You may have needed to try it your own way before advice could land.',
        middle: 'By mid-life, 1 tends to ask for a project with your name on it. You may notice the pull to build something that does not depend on anyone else keeping it alive.',
        mature: 'Later, 1 usually softens into a quieter authority. You may find you can hand things on without feeling erased.' } },
    2: { name: 'the Diplomat', essence: 'pairs, patience, and quiet partnership',
      universal: 'The number 2 is relation. It waits, weighs, and works through the other person. Its strength is sensitivity, and its work is not disappearing into what it senses.',
      path: 'you are here to learn through relationship, and to hold your own shape inside it',
      express: 'you come across as tactful, receptive, and easier to talk to than to read',
      soul: 'what you privately want is closeness with peace in it: to be met without a fight',
      year: 'a year of patience and pairing. Progress arrives through cooperation rather than push',
      month: 'a month for tending an agreement rather than launching one',
      day: 'a day that goes better slowly and with someone else',
      pinnacle: 'a long stretch of partnership and sensitivity, where the work is shared and the growth is relational',
      challenge: 'the lesson of saying the true thing before resentment does it for you',
      cycle: 'a period whose theme is cooperation and emotional education',
      birthday: 'a native gift for reading a room and finding the workable middle',
      strengths: ['You may sense what a room needs before it is said.', 'You may be trusted with things people tell nobody else.', 'You may negotiate without leaving damage.'],
      challenges: ['You may keep a peace that costs you the truth.', 'You may wait for an invitation that is not coming.', 'You may take on the feeling in the room as if it were yours.'],
      opportunities: ['There is room to state a preference plainly and early.', 'There is room to let a disagreement stay open without fixing it.', 'There is room to be the partner rather than the caretaker.'],
      obstacles: ['A reflex of self-erasure dressed as kindness.', 'Decisions deferred until someone else makes them.', 'Resentment stored instead of spoken.'],
      stage: { young: 'Early on, 2 often shows up as adapting to whoever you are with. You may have learned other people\u2019s moods faster than your own.',
        middle: 'By mid-life, 2 tends to test whether your relationships have room for your actual preferences. You may notice the cost of the peace you have been keeping.',
        mature: 'Later, 2 usually becomes real diplomacy rather than accommodation. You may find you can hold a difference without losing the bond.' } },
    3: { name: 'the Communicator', essence: 'expression, play, and the social voice',
      universal: 'The number 3 is expression. It makes, speaks, and lightens. Its gift is creative contact, and its risk is scattering across everything it finds interesting.',
      path: 'you are here to express something and let it be seen, and to learn that depth needs a chosen subject',
      express: 'you come across as warm, articulate, and quick to make a room easier',
      soul: 'what you privately want is to be delighted in, and to have something of your own to show',
      year: 'a year of visibility and making. Say it, make it, put it where people can see it',
      month: 'a month for expression rather than accounting',
      day: 'a day that opens through conversation and making',
      pinnacle: 'a long stretch of creative expression, often with more opportunity than focus',
      challenge: 'the lesson of finishing one thing, and of speaking plainly when charm would be easier',
      cycle: 'a period whose theme is voice, contact, and creative range',
      birthday: 'a native gift for expression: you can make an idea likeable',
      strengths: ['You may find words for what others only feel.', 'You may lift a difficult mood without denying it.', 'You may make things simply because making them is good.'],
      challenges: ['You may scatter across three projects and finish none.', 'You may use humour where honesty was needed.', 'You may perform rather than say.'],
      opportunities: ['There is room to take one creative thread to completion.', 'There is room to be unpolished in front of someone safe.', 'There is room to let the work be the point rather than the response.'],
      obstacles: ['An audience installed early, still watching.', 'Interest that fades exactly where craft begins.', 'Optimism used as a way past the hard conversation.'],
      stage: { young: 'Early on, 3 often shows up as talent noticed before it was trained. You may have been rewarded for ease rather than depth.',
        middle: 'By mid-life, 3 tends to ask what you actually want to say. You may notice the difference between being liked and being heard.',
        mature: 'Later, 3 usually settles into craft. You may find you would rather do one thing well than five things visibly.' } },
    4: { name: 'the Builder', essence: 'foundations, work, and the steady hand',
      universal: 'The number 4 is structure. It builds, repeats, and keeps its word. Its gift is reliability, and its risk is mistaking rigidity for strength.',
      path: 'you are here to build something that holds, and to learn that rest is part of the structure',
      express: 'you come across as dependable, methodical, and slow to be talked out of a standard',
      soul: 'what you privately want is order you can trust, and work that means something',
      year: 'a year of foundations and unglamorous progress. The reward is durability, not speed',
      month: 'a month for the practical task and the maintained system',
      day: 'a day that rewards the boring, correct step',
      pinnacle: 'a long stretch of construction: effort, discipline, and the slow accumulation of something real',
      challenge: 'the lesson of flexibility, and of letting good enough be finished',
      cycle: 'a period whose theme is work, order, and material footing',
      birthday: 'a native gift for follow-through: you finish what stopped being interesting',
      strengths: ['You may be the person a plan actually survives.', 'You may hold a standard without a speech about it.', 'You may make an unglamorous system that carries everyone.'],
      challenges: ['You may treat rest as something to earn.', 'You may resist a change that would save you work.', 'You may carry more than you delegate.'],
      opportunities: ['There is room to build the small structure instead of planning the large one.', 'There is room to hand one duty to someone else.', 'There is room to schedule the rest rather than wait for permission.'],
      obstacles: ['A standard set by someone who was never satisfied.', 'Work used as a way of not feeling.', 'A plan defended past its usefulness.'],
      stage: { young: 'Early on, 4 often shows up as responsibility taken sooner than it was offered. You may have been the reliable one before you chose to be.',
        middle: 'By mid-life, 4 tends to ask what the structure is for. You may notice you have built well and rested rarely.',
        mature: 'Later, 4 usually becomes mastery with less strain. You may find you can keep the standard and drop the self-audit.' } },
    5: { name: 'the Explorer', essence: 'change, freedom, and appetite for experience',
      universal: 'The number 5 is motion. It varies, travels, and refuses a fixed shape. Its gift is adaptability, and its risk is leaving before anything roots.',
      path: 'you are here to gather experience and stay free enough to use it, and to learn that commitment is not capture',
      express: 'you come across as quick, curious, and hard to schedule',
      soul: 'what you privately want is room: the option to change your mind and your route',
      year: 'a year of change and unexpected doors. Keep enough slack to say yes',
      month: 'a month for movement rather than settlement',
      day: 'a day that goes better improvised',
      pinnacle: 'a long stretch of freedom and variety, often with more change than continuity',
      challenge: 'the lesson of staying long enough for depth, and of freedom that is not just exit',
      cycle: 'a period whose theme is experience, mobility, and appetite',
      birthday: 'a native gift for adaptation: you land on your feet in new terrain',
      strengths: ['You may adapt faster than a plan can fail.', 'You may find the possibility nobody listed.', 'You may be genuinely good company in change.'],
      challenges: ['You may leave at the moment depth becomes available.', 'You may mistake restlessness for intuition.', 'You may over-commit to keep every door open.'],
      opportunities: ['There is room to stay through one full cycle of something.', 'There is room to choose a limit that buys you freedom elsewhere.', 'There is room to let variety serve one long aim.'],
      obstacles: ['A reflex toward the exit when things settle.', 'Too many open doors and not enough hours.', 'Novelty used to outrun a feeling.'],
      stage: { young: 'Early on, 5 often shows up as needing to see for yourself. You may have collected experience faster than you could take it in.',
        middle: 'By mid-life, 5 tends to ask what the freedom has been for. You may notice a wish for something that lasts without feeling like a cage.',
        mature: 'Later, 5 usually becomes range rather than escape. You may find you can stay put and still feel unconfined.' } },
    6: { name: 'the Caretaker', essence: 'care, responsibility, and what you hold together',
      universal: 'The number 6 is care. It tends, repairs, and takes responsibility, often before being asked. Its gift is devotion, and its risk is duty that swallows the person doing it.',
      path: 'you are here to care well without disappearing into it, and to learn that help can be refused and still be love',
      express: 'you come across as warm, responsible, and easy to lean on',
      soul: 'what you privately want is a home worth tending and people who stay',
      year: 'a year of responsibility, home, and repair. Relationships take the foreground',
      month: 'a month for tending what you already have',
      day: 'a day that asks for care rather than conquest',
      pinnacle: 'a long stretch of responsibility and service, often with real load and real meaning',
      challenge: 'the lesson of care with edges: help offered rather than assumed, and support that is not control',
      cycle: 'a period whose theme is family, duty, and the terms of care',
      birthday: 'a native gift for making people materially and emotionally safer',
      strengths: ['You may notice what someone needs before they say it.', 'You may hold a household or a team together quietly.', 'You may make beauty and comfort out of ordinary means.'],
      challenges: ['You may take responsibility that was never yours.', 'You may give advice as a way of not being helped.', 'You may resent the load you did not put down.'],
      opportunities: ['There is room to let someone tend you for once.', 'There is room to ask instead of assuming what is needed.', 'There is room to keep one thing that is only for you.'],
      obstacles: ['Care used as the price of closeness.', 'A standard of self-sacrifice nobody requested.', 'Perfectionism about other people\u2019s comfort.'],
      stage: { young: 'Early on, 6 often shows up as being needed young. You may have learned to read the household before you read yourself.',
        middle: 'By mid-life, 6 tends to ask who is caring for the caretaker. You may notice the difference between chosen responsibility and inherited duty.',
        mature: 'Later, 6 usually becomes generous without depletion. You may find you can give from surplus rather than from reserve.' } },
    7: { name: 'the Seeker', essence: 'analysis, solitude, and the search for what is true',
      universal: 'The number 7 is the seeker, the thinker, the one who wants beneath the surface. It is analytical, introspective, and drawn to the hidden dimensions of a thing.',
      path: 'you are here to question, investigate, and find meaning under appearances, and to learn that trust is not the opposite of thinking',
      express: 'you come across as private, observant, and hard to hurry',
      soul: 'what you privately want is understanding, and enough solitude to reach it',
      year: 'a year of study, retreat, and inner accounting. Depth over expansion',
      month: 'a month for research rather than announcement',
      day: 'a day that improves with quiet',
      pinnacle: 'a long stretch of inner work and specialisation, often lonelier than it looks from outside',
      challenge: 'the lesson of letting people close without needing them to be explicable',
      cycle: 'a period whose theme is knowledge, solitude, and refinement',
      birthday: 'a native gift for pattern-finding: you see the structure under the noise',
      strengths: ['You may see the flaw in a plan nobody else questioned.', 'You may be genuinely comfortable alone.', 'You may hold a subject long enough to actually know it.'],
      challenges: ['You may analyse in place of deciding.', 'You may withdraw before asking.', 'You may keep a distance you did not intend.'],
      opportunities: ['There is room to say the half-formed thought out loud.', 'There is room to let expertise be shared rather than proven.', 'There is room to trust a person on incomplete evidence.'],
      obstacles: ['Solitude that stopped being restorative.', 'Certainty used as armour.', 'A question kept open to avoid the commitment an answer would bring.'],
      stage: { young: 'Early on, 7 often shows up as feeling slightly outside the group. You may have watched before joining, and read before asking.',
        middle: 'By mid-life, 7 tends to deepen into your own inner authority. Questions that once felt abstract may now feel urgent.',
        mature: 'Later, 7 usually becomes quiet certainty. You may find you no longer need the argument to know what you know.' } },
    8: { name: 'the Executive', essence: 'power, material mastery, and consequence',
      universal: 'The number 8 is power in the material world. It organises, earns, and answers for results. Its gift is capability at scale, and its risk is measuring a life in outcomes.',
      path: 'you are here to handle power and resources honestly, and to learn what is worth the cost of winning',
      express: 'you come across as capable, decisive, and used to being in charge',
      soul: 'what you privately want is enough authority to make things actually work',
      year: 'a year of results, money, and consequence. Effort compounds and errors show',
      month: 'a month for the decision with real stakes',
      day: 'a day that rewards executive nerve',
      pinnacle: 'a long stretch of ambition and material responsibility, with visible outcomes either way',
      challenge: 'the lesson of power used rather than proved, and of worth held apart from results',
      cycle: 'a period whose theme is authority, resources, and consequence',
      birthday: 'a native gift for organisation: you can make a plan pay',
      strengths: ['You may see how a thing could actually be made to work.', 'You may stay steady when the stakes are real.', 'You may create resources other people rely on.'],
      challenges: ['You may confuse worth with what you can show for it.', 'You may control where trust was needed.', 'You may work through what should have been grieved.'],
      opportunities: ['There is room to use authority for something you would not be paid for.', 'There is room to let a number be enough.', 'There is room to share power before you are asked to.'],
      obstacles: ['A ledger of achievement that never balances.', 'A fear of dependence dressed as competence.', 'An ambition inherited rather than chosen.'],
      stage: { young: 'Early on, 8 often shows up as an early sense of money and standing. You may have learned young what things cost.',
        middle: 'By mid-life, 8 tends to bring the largest stakes you have handled. You may notice how much of your worth is riding on the result.',
        mature: 'Later, 8 usually turns toward stewardship. You may find you would rather make others capable than be indispensable.' } },
    9: { name: 'the Humanitarian', essence: 'completion, compassion, and letting go',
      universal: 'The number 9 is the ending that makes room. It is wide compassion, artistic feeling, and the long view. Its gift is generosity, and its work is release.',
      path: 'you are here to give at scale and let go cleanly, and to learn that endings are part of the giving',
      express: 'you come across as generous, wide in sympathy, and slightly beyond the local argument',
      soul: 'what you privately want is to matter to more than your own circle',
      year: 'a year of completion and release. Finish, forgive, clear the ground for a 1 year',
      month: 'a month for endings rather than launches',
      day: 'a day that wants generosity and closure',
      pinnacle: 'a long stretch of service and wide perspective, often with public dimension and personal cost',
      challenge: 'the lesson of holding your own needs inside a wide compassion',
      cycle: 'a period whose theme is service, art, and letting go',
      birthday: 'a native gift for perspective: you can see the whole arc from inside it',
      strengths: ['You may care about people you will never meet.', 'You may forgive at a scale that surprises people.', 'You may see the ending coming and prepare for it kindly.'],
      challenges: ['You may hold on past the point of usefulness.', 'You may serve everyone and account for yourself last.', 'You may grieve endings you chose.'],
      opportunities: ['There is room to complete something you have been circling for years.', 'There is room to name your own need inside the service.', 'There is room to let a loss be honoured rather than argued with.'],
      obstacles: ['A wish to save what has already ended.', 'Compassion extended until nothing is left for you.', 'Nostalgia doing the work of decision.'],
      stage: { young: 'Early on, 9 often shows up as caring about the whole world before your own life was settled. You may have felt older than your years.',
        middle: 'By mid-life, 9 tends to ask what you are willing to finish. You may notice how much of your energy is spent holding old chapters open.',
        mature: 'Later, 9 usually becomes wisdom rather than sacrifice. You may find that letting go has stopped feeling like loss.' } },
    11: { name: 'the Illuminator', essence: 'heightened sensitivity and inspired insight',
      universal: 'The number 11 is a master number, a 2 raised in voltage. It carries intuition, nervous sensitivity, and the pull to inspire. Its gift is perception, and its risk is a nervous system running above its rating.',
      path: 'you are here to work with inspiration and sensitivity, and to learn to ground what you receive',
      express: 'you come across as intense, perceptive, and a little more visible than you intended',
      soul: 'what you privately want is meaning strong enough to justify the sensitivity',
      year: 'a year of heightened perception and unexpected clarity. Keep the nervous system fed',
      month: 'a month for listening more than deciding',
      day: 'a day of high signal and thin skin',
      pinnacle: 'a long stretch of inspired work, often with visibility that arrives before readiness',
      challenge: 'the lesson of grounding: turning sensitivity into something usable rather than overwhelming',
      cycle: 'a period whose theme is intuition, tension, and inspired contribution',
      birthday: 'a native gift for perception: you sense the current before it shows',
      strengths: ['You may sense what is coming before the evidence arrives.', 'You may inspire people without trying to.', 'You may feel the truth of a situation instantly.'],
      challenges: ['You may run past your own nervous limits.', 'You may doubt what you clearly perceived.', 'You may absorb what is not yours.'],
      opportunities: ['There is room to make a daily practice that grounds you.', 'There is room to act on one clear intuition, in small scale.', 'There is room to reduce the input rather than the sensitivity.'],
      obstacles: ['Overstimulation treated as normal.', 'Perception dismissed because it cannot be proved.', 'A calling held at arm\u2019s length out of fear of it.'],
      stage: { young: 'Early on, 11 often shows up as feeling too much and explaining it as being too sensitive. You may have muted the signal to fit in.',
        middle: 'By mid-life, 11 tends to insist on being used. You may notice that ignoring the perception costs more than acting on it.',
        mature: 'Later, 11 usually becomes steady insight. You may find you can receive without being flooded.' } },
    22: { name: 'the Master Builder', essence: 'vision built into material form',
      universal: 'The number 22 is a master number, a 4 with a wider blueprint. It joins vision to construction. Its gift is scale, and its risk is a plan larger than one life can staff.',
      path: 'you are here to build something structurally useful to more than yourself, and to learn to start smaller than the vision',
      express: 'you come across as ambitious, practical, and unusually long-sighted',
      soul: 'what you privately want is to leave something standing',
      year: 'a year for laying real foundations under a large idea',
      month: 'a month for the practical step inside the big plan',
      day: 'a day that rewards patient construction',
      pinnacle: 'a long stretch of large-scale building, with real demand on discipline',
      challenge: 'the lesson of scale: beginning at a size you can actually sustain',
      cycle: 'a period whose theme is structure, legacy, and disciplined vision',
      birthday: 'a native gift for turning an idea into a working system',
      strengths: ['You may see both the vision and the scaffolding it needs.', 'You may sustain effort over years rather than weeks.', 'You may build something that outlives your involvement.'],
      challenges: ['You may delay starting until the plan is complete.', 'You may take on more load than any one person can carry.', 'You may measure yourself against the size of the vision.'],
      opportunities: ['There is room to ship one small piece of the large thing.', 'There is room to bring in people earlier than feels comfortable.', 'There is room to define done at a human scale.'],
      obstacles: ['Perfection standing in for progress.', 'A plan too large to explain, and so carried alone.', 'Rest deferred until the build is finished.'],
      stage: { young: 'Early on, 22 often shows up as ambition without a vehicle. You may have felt capable of more than you had access to.',
        middle: 'By mid-life, 22 tends to hand you the real project. You may notice the difference between vision and staffing.',
        mature: 'Later, 22 usually becomes stewardship. You may find you would rather hand over a working structure than hold the keys.' } },
    33: { name: 'the Teacher', essence: 'compassion made instructive',
      universal: 'The number 33 is a master number, a 6 with a wider congregation. It is care that teaches. Its gift is healing presence, and its risk is a responsibility with no boundary.',
      path: 'you are here to care in a way that teaches, and to learn where your responsibility ends',
      express: 'you come across as warm, steady, and easy to confide in',
      soul: 'what you privately want is to relieve suffering that is not your own',
      year: 'a year of teaching, tending, and being leaned on',
      month: 'a month for the person in front of you',
      day: 'a day that asks for patience with someone',
      pinnacle: 'a long stretch of caretaking on a wide scale, with real cost and real reach',
      challenge: 'the lesson of boundary inside compassion',
      cycle: 'a period whose theme is service, teaching, and healing work',
      birthday: 'a native gift for making people feel safe enough to learn',
      strengths: ['You may make hard truths bearable to hear.', 'You may stay with someone who is not fixable yet.', 'You may teach without condescension.'],
      challenges: ['You may take on the suffering as your own.', 'You may keep giving past your reserves.', 'You may find your own needs hardest to name.'],
      opportunities: ['There is room to set an hour that is yours and defend it.', 'There is room to teach rather than carry.', 'There is room to accept help without repaying it.'],
      obstacles: ['A boundary treated as unkindness.', 'Depletion normalised.', 'Worth measured in how much you absorb.'],
      stage: { young: 'Early on, 33 often shows up as being the one others come to. You may have been trusted with more than was fair.',
        middle: 'By mid-life, 33 tends to require a boundary you did not want to draw. You may notice what carrying everyone has cost.',
        mature: 'Later, 33 usually becomes teaching rather than rescuing. You may find you can hold the door without carrying the person through it.' } }
  };

  var POSITIONS = {
    lifePath: { label: 'Life Path', from: 'the whole birth date, reduced',
      frame: function (n, d) { return 'As a Life Path number, ' + n + ' describes your fundamental approach to existence: ' + d.path + '.'; } },
    expression: { label: 'Expression', from: 'every letter of the full birth name',
      frame: function (n, d) { return 'As an Expression number, ' + n + ' describes the way you meet the world and what you are equipped to do in it: ' + d.express + '.'; } },
    soulUrge: { label: 'Soul Urge', from: 'the vowels of the full birth name',
      frame: function (n, d) { return 'As a Soul Urge number, ' + n + ' describes what you want when nobody is watching: ' + d.soul + '.'; } },
    personality: { label: 'Personality', from: 'the consonants of the full birth name',
      frame: function (n, d) { return 'As a Personality number, ' + n + ' describes the first impression you make before anyone knows you: ' + d.express + '.'; } },
    birthday: { label: 'Birthday', from: 'the day of the month, reduced',
      frame: function (n, d) { return 'As a Birthday number, ' + n + ' marks a specific talent you arrived with: ' + d.birthday + '.'; } },
    personalYear: { label: 'Personal Year', from: 'birth month and day added to the current year',
      frame: function (n, d) { return 'As a Personal Year, ' + n + ' sets the theme of the next twelve months: ' + d.year + '.'; } },
    personalMonth: { label: 'Personal Month', from: 'the Personal Year added to the calendar month',
      frame: function (n, d) { return 'As a Personal Month, ' + n + ' narrows the year\u2019s theme to these few weeks: ' + d.month + '.'; } },
    personalDay: { label: 'Personal Day', from: 'the Personal Month added to today\u2019s date',
      frame: function (n, d) { return 'As a Personal Day, ' + n + ' colours a single day: ' + d.day + '.'; } },
    pinnacle: { label: 'Pinnacle', from: 'pairs of reduced birth-date components',
      frame: function (n, d) { return 'As a Pinnacle, ' + n + ' describes a period rather than a trait: ' + d.pinnacle + '.'; } },
    challenge: { label: 'Challenge', from: 'the differences between reduced birth-date components',
      frame: function (n, d) { return 'As a Challenge number, ' + n + ' names the lesson the tradition says keeps returning until it is learned: ' + d.challenge + '.'; } },
    cycle: { label: 'Period cycle', from: 'the reduced birth month, day, and year in turn',
      frame: function (n, d) { return 'As a period cycle, ' + n + ' describes a long season of life: ' + d.cycle + '.'; } }
  };

  function art(v) { return /^(8|11|18|8\d)$/.test(String(v)) ? 'an' : 'a'; }
  function Art(v) { return art(v) === 'an' ? 'An' : 'A'; }

  var NC = {
    VERSION: '1.0.0',
    numbers: N,
    positions: POSITIONS,
    has: function (n) { return !!N[n]; },
    entry: function (n) { return N[n] || null; },
    reduce: function (n) { n = Math.abs(+n || 0); while (n > 9) n = String(n).split('').reduce(function (s, c) { return s + +c; }, 0); return n; },
    /* Master numbers keep their identity where the tradition keeps it, and fall
       back to the reduced digit for content when no master entry exists. */
    content: function (n) { return N[n] || N[NC.reduce(n)] || N[1]; },
    name: function (n) { return NC.content(n).name; },
    essence: function (n) { return NC.content(n).essence; },
    stageKey: function (age) { return age == null ? 'middle' : age < 28 ? 'young' : age < 56 ? 'middle' : 'mature'; },
    stageLabel: function (age) {
      var k = NC.stageKey(age);
      return k === 'young' ? 'early adulthood' : k === 'middle' ? 'the middle years' : 'the mature years';
    },

    /* build(position, value, age) -> tagged sections for the number detail page */
    build: function (position, value, age) {
      var p = POSITIONS[position] || POSITIONS.lifePath, d = NC.content(value);
      var T = function (tag, text) { return { tag: tag, text: text }; };
      var stage = d.stage[NC.stageKey(age)];
      return {
        value: value, category: p.label, title: d.name, from: p.from,
        universal: T('TRADITIONAL', d.universal),
        inPosition: T('TRADITIONAL', p.frame(value, d)),
        atStage: T('POSSIBILITY', (age == null ? '' : 'At ' + age + ', in ' + NC.stageLabel(age) + ': ') + stage),
        isPinnacle: position === 'pinnacle',
        pinnacleNote: position === 'pinnacle'
          ? T('TRADITIONAL', 'A pinnacle is read as a peak period rather than a personality trait. The tradition treats its opening years as the strongest, and the number as the climate of the whole span.')
          : null,
        lists: { strengths: d.strengths, challenges: d.challenges, opportunities: d.opportunities, obstacles: d.obstacles }
      };
    },

    /* Expression / Soul Urge / Personality from a full birth name. Pythagorean. */
    LETTERS: { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9, S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8 },
    VOWELS: 'AEIOU',
    fromName: function (raw) {
      var s = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (!s) return null;
      var all = 0, vow = 0, con = 0;
      for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i), v = NC.LETTERS[c] || 0;
        all += v;
        if (NC.VOWELS.indexOf(c) !== -1) vow += v; else con += v;
      }
      var keep = function (t) { return (t === 11 || t === 22 || t === 33) ? t : NC.reduce(t); };
      return { letters: s.length, expression: keep(all), soulUrge: keep(vow), personality: keep(con),
        rawTotals: { all: all, vowels: vow, consonants: con } };
    },

    /* [SYNTHESIS] paragraph. Assembled here from the numbers above, and tagged. */
    synthesis: function (o) {
      var lp = NC.content(o.lifePath), py = NC.content(o.personalYear), pd = NC.content(o.personalDay);
      var parts = ['Your Life Path ' + o.lifePath + ' sets the long arc: ' + lp.essence + '.'];
      if (o.expression) parts.push('Expression ' + o.expression + ' describes the equipment you meet it with, and Soul Urge ' + o.soulUrge + ' what you privately want from it.');
      parts.push('Inside that arc you are in a Personal Year ' + o.personalYear + ', which the tradition reads as ' + py.essence + ', narrowing today to ' + art(o.personalDay) + ' ' + o.personalDay + ' day of ' + pd.essence + '.');
      if (o.pinnacle != null) parts.push('The pinnacle you are standing in is ' + o.pinnacle + ', and the challenge that runs underneath is ' + o.challenge + '.');
      parts.push('Read as one picture: ' + art(o.lifePath) + ' ' + o.lifePath + ' life, currently asked to work in ' + art(o.personalYear) + ' ' + o.personalYear + ' way.');
      return parts.join(' ');
    },
    synthesisPossibility: function (o) {
      return 'These numbers may interact rather than take turns. ' + Art(o.personalYear) + ' ' + o.personalYear + ' year inside ' + art(o.lifePath) + ' ' + o.lifePath +
        ' life can feel like being asked for something that is not your default, and that friction is the part worth watching. ' +
        'Your own record over a year is better evidence than any meaning listed here.';
    }
  };

  window.NumerologyContent = NC;
})();
