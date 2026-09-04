/*! practice-library.js: inCommon PracticeLibrary V1.0 (UMD, data + validation, no deps).
 * 10 practices in the canonical schema:
 *   id, title, description, category, risk_level ('universal'|'mild_caution'),
 *   tradition_tags[], steps[], duration, follow_up_questions[],
 *   source_attribution, review_date,
 *   insight_experiment: { traditional, possibility, action, review[] }
 * The insight_experiment is the Insight Experiment schema: traditional
 * interpretation -> psychological possibility -> testable action -> review questions.
 * Oki may only suggest practices from this library (PostProcessor enforces).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.PracticeLibrary = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CATEGORIES = ['psychological', 'communication', 'grounding', 'reflection', 'practical', 'spiritual-agnostic'];
  var RISK_LEVELS = {
    universal: { label: 'Universal', note: 'Safe to try on any ordinary day.' },
    mild_caution: { label: 'Mild caution', note: 'Can stir things up. Skip it on a raw day, and Get help stays one tap away.' }
  };

  var PRACTICES = [
    { id: 'values_clarification', title: 'Values Clarification', category: 'psychological', risk_level: 'universal',
      description: 'Find which values are actually driving you this season, not the ones that merely sound right.',
      tradition_tags: ['ACT', 'humanistic'], duration: '10 min',
      steps: [
        'List five moments from the last month when you felt most alive or most right.',
        'For each, name what was being honored: freedom? craft? care? honesty?',
        'Circle the two words that repeat.',
        'Ask: where in this week do those two get zero minutes?',
        'Pick one 15-minute slot this week and give it to one of them.'
      ],
      follow_up_questions: ['Which value surprised you by showing up?', 'Where did the sounds-right list and the actually-alive list disagree?'],
      insight_experiment: {
        traditional: 'Human Design might frame this as your inner authority asking to lead for a season.',
        possibility: 'You may be running on inherited values (the ones praised at home) rather than felt ones.',
        action: 'Give one felt value fifteen scheduled minutes this week.',
        review: ['Did the minutes feel like relief or duty?', 'Would you defend that slot next week?']
      },
      source_attribution: 'Adapted from Acceptance & Commitment Therapy values work (Hayes et al.)', review_date: '2026-07-01' },

    { id: 'behavioral_experiment', title: 'Behavioral Experiment', category: 'psychological', risk_level: 'mild_caution',
      description: 'Test a belief about yourself against reality: small, safe, and honestly scored.',
      tradition_tags: ['CBT'], duration: '15 min + one real test',
      steps: [
        'Write the belief as a prediction: \u201cIf I ask, they\u2019ll be annoyed.\u201d',
        'Rate how much you believe it, 0 to 100.',
        'Design the smallest real test: one low-stakes ask, one small exposure.',
        'Run it. Write down what actually happened, not what it felt like.',
        'Re-rate the belief. Note the gap.'
      ],
      follow_up_questions: ['Prediction versus reality: how big was the gap?', 'What would you test next?'],
      insight_experiment: {
        traditional: 'Tarot\u2019s Two of Swords often reads as a stalemate held in place by an untested assumption.',
        possibility: 'The belief may be load-bearing, organizing your choices without ever being checked.',
        action: 'Run the smallest real test within the week.',
        review: ['What did reality actually return?', 'Which belief deserves the next experiment?']
      },
      source_attribution: 'Cognitive Behavioral Therapy behavioral experiments (Beck tradition)', review_date: '2026-07-01' },

    { id: 'difficult_conversation_rehearsal', title: 'Difficult Conversation Rehearsal', category: 'communication', risk_level: 'mild_caution',
      description: 'Rehearse the conversation you\u2019re avoiding: steelman them, script only your opening.',
      tradition_tags: ['NVC', 'communication'], duration: '15 min',
      steps: [
        'Name the conversation you\u2019re avoiding, in one sentence.',
        'Write their strongest reasonable point. Steelman it honestly.',
        'Draft your opening two sentences: an observation and a need, no verdicts.',
        'Say them out loud, twice.',
        'Decide when, or decide not yet, on purpose.'
      ],
      follow_up_questions: ['Was their real response closer to the feared version or the steelmanned one?', 'What did your body do just before you spoke?'],
      insight_experiment: {
        traditional: 'The I Ching\u2019s crossing imagery: the far bank looks farther before the first step.',
        possibility: 'The dread may be about their imagined reaction, not their likely one.',
        action: 'Speak only the first two sentences within three days, or consciously schedule not-yet.',
        review: ['Feared vs. actual: what happened?', 'Would you open the same way again?']
      },
      source_attribution: 'Draws on Nonviolent Communication (Rosenberg) and Difficult Conversations (Stone, Patton & Heen)', review_date: '2026-07-01' },

    { id: 'grounding_anxiety', title: 'Grounding for Anxiety', category: 'grounding', risk_level: 'universal',
      description: 'Come down from the spin and into the body. Links to the full Grounding Library.',
      tradition_tags: ['somatic'], duration: '3 min',
      steps: [
        'Feet flat. Press them into the floor for five counts.',
        'Name where the anxiety lives in your body right now: chest, throat, gut.',
        'Breathe out longer than you breathe in, four rounds.',
        'Name five things you can see. (The full version lives in Grounding.)',
        'Check the number: what was the spin at the start, 0 to 10, and what is it now?'
      ],
      follow_up_questions: ['What number did it start and end at?', 'Which step did the most work?'],
      insight_experiment: {
        traditional: 'Many traditions read anxious seasons as thresholds; the body is the doorframe.',
        possibility: 'Ninety seconds of body-first attention may drop the spin a full number.',
        action: 'Use this the next time the number hits six.',
        review: ['Did it drop?', 'Earlier or later than you expected?']
      },
      source_attribution: 'Common somatic grounding; overlaps GroundingLibrary\u2019s 5-4-3-2-1', review_date: '2026-07-01' },

    { id: 'cognitive_defusion', title: 'Cognitive Defusion', category: 'psychological', risk_level: 'universal',
      description: 'Get an inch of distance from a sticky thought: hold it instead of being it.',
      tradition_tags: ['ACT'], duration: '5 min',
      steps: [
        'Catch the sticky thought, word for word.',
        'Say it as: \u201cI\u2019m having the thought that\u2026\u201d',
        'Again as: \u201cI notice I\u2019m having the thought that\u2026\u201d',
        'Once more, in a cartoon voice. (Yes, really.)',
        'Ask: with that inch of distance, what matters right now?'
      ],
      follow_up_questions: ['Did the distance change the thought\u2019s grip?', 'What did you do next?'],
      insight_experiment: {
        traditional: 'Numerology\u2019s repeating-number lens: what repeats is asking to be noticed, not obeyed.',
        possibility: 'The thought may be a weather pattern, not a verdict.',
        action: 'Run the four lines on the next sticky thought, same day.',
        review: ['Grip before and after?', 'Which line did the loosening?']
      },
      source_attribution: 'ACT cognitive defusion (Hayes); phrasing adapted', review_date: '2026-07-01' },

    { id: 'journaling_prompt', title: 'Journaling Prompt', category: 'reflection', risk_level: 'universal',
      description: 'One honest paragraph, one underline. The surprise is the subject.',
      tradition_tags: ['expressive writing'], duration: '7 min',
      steps: [
        'Set a 7-minute timer.',
        'Write the last month as one plain paragraph. No style points.',
        'Underline the one sentence that surprised you.',
        'Write two more sentences about the underlined one only.'
      ],
      follow_up_questions: ['What did you underline?', 'Would you have predicted it yesterday?'],
      insight_experiment: {
        traditional: 'inCommon\u2019s throughline lens: your own record decides which readings hold.',
        possibility: 'The surprise sentence is often where the real subject lives.',
        action: 'Bring the underlined sentence to your next check-in, or to Oki.',
        review: ['Did the underline still ring true a day later?', 'What did it open?']
      },
      source_attribution: 'Expressive writing research (Pennebaker), simplified', review_date: '2026-07-01' },

    { id: 'sleep_hygiene_check', title: 'Sleep Hygiene Check', category: 'practical', risk_level: 'universal',
      description: 'A plain audit of the week\u2019s sleep. One lever, no shame.',
      tradition_tags: ['behavioral'], duration: '10 min + 7 nights',
      steps: [
        'Write your last three nights: in-bed time, lights-out, wake time.',
        'Mark caffeine after 2 pm, screens in bed, alcohol. Marks, not sins.',
        'Pick the single easiest lever. One, not three.',
        'Write one implementation line: \u201cAfter X, I will Y.\u201d',
        'Re-check in seven days.'
      ],
      follow_up_questions: ['Did the lever hold all seven nights?', 'What changed by day four?'],
      insight_experiment: {
        traditional: 'Several traditions read sleep as the first oracle. Everything else is downstream.',
        possibility: 'One lever moved for a week may shift mood more than any reading.',
        action: 'Move the one lever for seven nights.',
        review: ['Mood on day one vs. day seven?', 'Keep the lever or trade it?']
      },
      source_attribution: 'Behavioral sleep medicine guidance, simplified', review_date: '2026-07-01' },

    { id: 'boundary_setting', title: 'Boundary Setting Exercise', category: 'communication', risk_level: 'mild_caution',
      description: 'Say one clean no: small, kind, and held.',
      tradition_tags: ['assertiveness'], duration: '10 min + one delivery',
      steps: [
        'Name one ask you keep saying yes to against your own grain.',
        'Write the cost of that yes: time, resentment, sleep.',
        'Draft a two-sentence no: appreciation, then decline. No essay.',
        'Rehearse it out loud once.',
        'Deliver it at the next natural moment.'
      ],
      follow_up_questions: ['How did they actually respond?', 'What did the reclaimed space feel like after?'],
      insight_experiment: {
        traditional: 'Human Design\u2019s sacral framing: a no protects the yes that matters.',
        possibility: 'The resentment may be the boundary trying to happen anyway, sideways.',
        action: 'Deliver one small no this week.',
        review: ['Feared reaction vs. real one?', 'Which yes got easier?']
      },
      source_attribution: 'Assertiveness training tradition; phrasing adapted', review_date: '2026-07-01' },

    { id: 'gratitude_practice', title: 'Gratitude Practice', category: 'spiritual-agnostic', risk_level: 'universal',
      description: 'Three specifics a night, one sentence each. No forced sunshine.',
      tradition_tags: ['contemplative'], duration: '3 min \u00d7 5 nights',
      steps: [
        'Tonight, write three specific good things from today. Specific beats grand.',
        'For one of them, add who or what made it possible.',
        'If a person is involved, say it to them out loud once this week.',
        'Repeat for five nights.'
      ],
      follow_up_questions: ['Did the days start reading differently by night four?', 'Which entry was hardest to find?'],
      insight_experiment: {
        traditional: 'Nearly every tradition keeps some form of grace-before-meals: attention as thanks.',
        possibility: 'Naming specifics may retrain what your attention files as \u201ca day.\u201d',
        action: 'Five nights, three lines each.',
        review: ['Easier or harder by the end?', 'What category kept appearing?']
      },
      source_attribution: 'Gratitude interventions research (Emmons & McCullough), simplified', review_date: '2026-07-01' },

    { id: 'spiritual_bypass_check', title: '\u2018Spiritual Bypass\u2019 Check', category: 'reflection', risk_level: 'mild_caution',
      description: 'Is the reading helping you meet life, or helping you avoid it? inCommon\u2019s own integrity check.',
      tradition_tags: ['discernment', 'inCommon-native'], duration: '10 min',
      steps: [
        'Name the reading or belief you\u2019ve been leaning on this month.',
        'Write what it lets you not do: decide, grieve, ask, leave.',
        'Ask: if the reading were wrong, what would I have to face today?',
        'Write one sentence of what facing it would look like.',
        'Decide: keep the reading AND take the step, or set the reading down.'
      ],
      follow_up_questions: ['What did the reading turn out to be protecting?', 'Keep, adapt, or set down?'],
      insight_experiment: {
        traditional: 'inCommon\u2019s own rule: a reading that only soothes is doing half its job.',
        possibility: 'The comfort may be real, and still be a detour.',
        action: 'Take the one avoided step, reading in hand.',
        review: ['Was the step smaller than the dread said?', 'What does the reading mean now?']
      },
      source_attribution: 'Concept from John Welwood\u2019s \u201cspiritual bypassing\u201d; exercise inCommon-native', review_date: '2026-07-01' }
  ];

  var REQUIRED = ['id', 'title', 'description', 'category', 'risk_level', 'tradition_tags', 'steps', 'duration', 'follow_up_questions', 'source_attribution', 'review_date', 'insight_experiment'];
  function validate(p) {
    var missing = REQUIRED.filter(function (k) { return p[k] == null || (Array.isArray(p[k]) && p[k].length === 0); });
    if (p.insight_experiment) ['traditional', 'possibility', 'action', 'review'].forEach(function (k) {
      if (p.insight_experiment[k] == null) missing.push('insight_experiment.' + k);
    });
    if (CATEGORIES.indexOf(p.category) < 0) missing.push('category(unknown: ' + p.category + ')');
    if (!RISK_LEVELS[p.risk_level]) missing.push('risk_level(unknown: ' + p.risk_level + ')');
    return { valid: missing.length === 0, missing: missing };
  }
  function validateAll() {
    return PRACTICES.map(function (p) { return { id: p.id, result: validate(p) }; }).filter(function (r) { return !r.result.valid; });
  }

  return { PRACTICES: PRACTICES, CATEGORIES: CATEGORIES, RISK_LEVELS: RISK_LEVELS, validate: validate, validateAll: validateAll, VERSION: '1.0' };
}));
