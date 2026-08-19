/**
 * inCommon Human Design: life domains and the four readings
 * UMD module, no dependencies, no network, no profile access.
 * Version 1.0.0
 *
 * Companion to hd-atlas.js. The atlas holds what a feature IS. This holds what
 * the tradition says a feature asks of a life: work, sleep, food and movement,
 * and the body's health, plus Strengths, Challenges, Opportunities and
 * Obstacles for every describable feature of a chart.
 *
 * Everything here is TRADITIONAL or POSSIBILITY. Nothing here is medical.
 * Human Design is not a clinical system and does not diagnose. The health notes
 * describe where a tradition says attention tends to go, and the app states that
 * plainly wherever they are shown.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HDLife = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CAVEAT = 'Human Design is a tradition of self-observation, not a clinical one. Nothing here diagnoses anything, and nothing here should displace a doctor.';

  /* ---------- the nine centers ---------- */
  var CENTERS = {
    Head: {
      defined: {
        work: 'A steady source of questions. You supply the inspiration a room runs on, and work suits you best when someone else is willing to carry the answers.',
        sleep: 'The mind arrives with its own pressure at night. A defined Head keeps generating whether or not the day is finished, so a written list before bed does more than a dark room.',
        body: 'Mental pressure spends real energy. Meals get skipped in the middle of a thought more often than they get skipped from lack of appetite.',
        health: 'The tradition watches the head and the jaw here: tension held above the neck, and the habit of thinking through a headache rather than stopping.',
        S: 'A reliable wellspring of inspiration. Questions come to you without being chased.',
        C: 'The pressure to think does not switch off, and it can look like restlessness to people who need you present.',
        O: 'You can hand a question to a room and let others solve it. That is a gift when you stop trying to answer everything yourself.',
        X: 'Believing every question that arrives is yours to answer. Most of them are not.'
      },
      open: {
        work: 'You take on the mental pressure of whoever you are near. In an anxious office you will feel anxious, and it will read as your own.',
        sleep: 'Sleeping in your own space matters more than for most. The day\u2019s borrowed questions loosen their hold once the room is yours again.',
        body: 'The evening racing mind is often not hunger and not caffeine. It is the day\u2019s inherited pressure still working itself out.',
        health: 'The tradition watches sleep quality here more than anything else, and the habit of lying awake solving a question that was never yours.',
        S: 'You can read what a room is preoccupied with before anyone says it aloud.',
        C: 'Distinguishing your own question from the one you absorbed takes deliberate practice.',
        O: 'Wisdom about what is worth thinking about at all. Open centers become discerning, not empty.',
        X: 'Answering pressure that belongs to someone else, then feeling responsible for the outcome.'
      }
    },
    Ajna: {
      defined: {
        work: 'A fixed way of thinking things through. You will reach conclusions the same way every time, which makes you trusted and occasionally immovable.',
        sleep: 'The mind keeps its shape at night. Reviewing the day in bed is a habit worth moving to paper and an earlier hour.',
        body: 'Routine suits this center. Deciding what to eat once and repeating it costs you nothing and saves the thinking for elsewhere.',
        health: 'The tradition watches the eyes, the jaw and the neck: the physical places a fixed mind holds on.',
        S: 'Consistent, reliable thinking. People come to you for certainty and get it.',
        C: 'Certainty arrives whether or not it has been earned, and it is hard to hear a better answer once yours is set.',
        O: 'Becoming the one who holds the frame while others explore inside it.',
        X: 'Defending a conclusion because it is yours rather than because it is right.'
      },
      open: {
        work: 'You think in the shape of whoever you are with. That is an advantage in collaboration and a liability in a room of one loud voice.',
        sleep: 'Certainty borrowed during the day comes apart at night. Deciding nothing important after dark is a reasonable rule here.',
        body: 'Food rules absorbed from other people rarely hold. What works is what you observed working in your own body, not what convinced you in an article.',
        health: 'The tradition watches anxiety here: the pressure to be certain when your design does not hold certainty.',
        S: 'Genuine mental flexibility. You can hold two frameworks at once without needing to collapse them.',
        C: 'The pressure to seem certain, and the tendency to borrow someone else\u2019s certainty to relieve it.',
        O: 'Wisdom about which frameworks are worth anything, having tried on so many.',
        X: 'Pretending to a conviction you do not have, then being held to it.'
      }
    },
    Throat: {
      defined: {
        work: 'A consistent way of speaking and making things happen. Work that lets you say and do lands better than work that asks you to wait quietly.',
        sleep: 'Verbal energy needs somewhere to go before the day closes. Talking through the day, aloud or on paper, closes it faster than silence.',
        body: 'Steady expression burns steady fuel. Long meetings do more damage than long walks.',
        health: 'The tradition watches the throat and the thyroid here, and the strain of speaking constantly without recovery.',
        S: 'You can be heard. Voice and manifestation are available on demand.',
        C: 'Speaking before the timing is right, because the capacity is always there.',
        O: 'Being the one who gives a group its words. That is real influence when it waits for its moment.',
        X: 'Filling silence out of capacity rather than necessity.'
      },
      open: {
        work: 'Attention comes and goes. Trying to command a room on a day it is not offered is exhausting and usually unsuccessful.',
        sleep: 'A day of forcing yourself to be heard leaves a particular kind of tiredness. Quiet evenings undo it.',
        body: 'The urge to speak to be noticed can spill into the urge to eat to be soothed. They come from the same restlessness.',
        health: 'The tradition watches the throat here too, and the strain of pushing a voice that was not invited.',
        S: 'When you do speak it carries, because it was not constant.',
        C: 'The pull to interrupt, to be seen, to prove you are there.',
        O: 'Learning that recognition arrives on its own and does not have to be seized.',
        X: 'Speaking to be noticed, then being known for what you said to fill a gap.'
      }
    },
    G: {
      defined: {
        work: 'A stable sense of direction. You know roughly who you are and where you are pointed, which makes long projects natural.',
        sleep: 'Little disturbance here. Where you sleep matters less than for most.',
        body: 'A consistent relationship to your own body. Habits, once set, tend to hold.',
        health: 'The tradition associates this center with the liver and the blood, and with the cost of living a direction that is not actually yours.',
        S: 'A fixed identity and a reliable inner compass.',
        C: 'When the direction stops fitting, changing it feels like losing yourself rather than turning.',
        O: 'Giving other people a sense of direction just by being consistent near them.',
        X: 'Mistaking a rut for a compass.'
      },
      open: {
        work: 'Direction changes with company and with place. Career advice that assumes one fixed path will not fit you.',
        sleep: 'The room matters. Where you sleep affects how you sleep more than it does for most people.',
        body: 'The body responds strongly to environment. The same routine in the wrong place will simply not work.',
        health: 'The tradition puts the emphasis on place here: the right environment does more for an open G than any regimen.',
        S: 'You can meet people where they are, because you are not fixed in one place yourself.',
        C: 'The search for identity and direction can become a permanent condition rather than a passing one.',
        O: 'Finding the right places, and letting the right place hand you the direction.',
        X: 'Committing to a life direction to end the discomfort of not having one.'
      }
    },
    Heart: {
      defined: {
        work: 'Willpower is genuinely available. You can promise and deliver, which means you will be asked constantly.',
        sleep: 'Rest is negotiable to you, and that is the danger. The will can override tiredness for a long time before the body objects.',
        body: 'You can push through a workout the body wanted to skip. Whether you should is a different question.',
        health: 'The tradition watches the heart and the stomach here, and the cost of proving worth through effort.',
        S: 'Reliable willpower. What you commit to gets done.',
        C: 'Everything becomes something to prove, including rest.',
        O: 'Choosing what your will is spent on rather than answering every demand for it.',
        X: 'Overcommitting because you can, then paying for it in the body.'
      },
      open: {
        work: 'Willpower is not consistently available, and a job built on constant self-motivation will grind you down.',
        sleep: 'Sleep is not a reward to be earned. This center is where that belief is most likely to be borrowed.',
        body: 'Regimens built on willpower fail here, and the failure gets read as weakness. It is not.',
        health: 'The tradition watches the same organs here, and the strain of proving something the design was never built to prove.',
        S: 'You can see what is actually worth proving, having felt the pull to prove everything.',
        C: 'Making promises to prove worth, then straining to keep them.',
        O: 'Letting worth be the starting point instead of the prize.',
        X: 'Measuring yourself against people whose willpower is fixed and yours is not.'
      }
    },
    'Solar Plexus': {
      defined: {
        work: 'You set the emotional weather of a room without trying. Deadlines that demand a decision on the spot work against your design.',
        sleep: 'The wave runs at night as much as by day. A low evening is not a verdict on your life, and it is a bad hour to decide anything.',
        body: 'Appetite rides the wave. Eating with the mood rather than against it is easier than fighting it.',
        health: 'The tradition watches the gut and the nervous system here, and the toll of deciding things at the top or bottom of a wave.',
        S: 'Emotional depth, and a range others rely on you to hold.',
        C: 'There is no truth in the now. Clarity has to be waited for, every time.',
        O: 'Becoming the person who does not act on the first feeling, which is rarer than it sounds.',
        X: 'Acting from the peak or the trough and calling it certainty.'
      },
      open: {
        work: 'You take in and amplify the room\u2019s emotion. A tense workplace costs you more than it costs the people generating the tension.',
        sleep: 'A day spent absorbing other people\u2019s moods needs a real transition before bed, not a screen.',
        body: 'The urge to smooth a borrowed feeling with food is strong here, and it is worth naming as borrowed.',
        health: 'The tradition watches the gut here as well, and the habit of avoiding conflict until the body carries it instead.',
        S: 'You feel what a room is feeling, accurately and early.',
        C: 'Avoiding confrontation and truth-telling to keep the emotional weather calm.',
        O: 'Deep wisdom about emotion, precisely because you are not run by your own.',
        X: 'Mistaking someone else\u2019s wave for your own and steering a life by it.'
      }
    },
    Sacral: {
      defined: {
        work: 'Real, renewable life force, on the condition that it is spent on work you actually responded to. Work you talked yourself into drains it instead.',
        sleep: 'The rule the tradition is most insistent about: go to bed before you are tired, and let the last of the energy burn off lying down.',
        body: 'The body wants to be used. A day without physical effort makes for a poor night.',
        health: 'The tradition watches burnout here above all, and the specific damage of going to bed already exhausted, night after night.',
        S: 'Sustainable energy, and the capacity to work at something long after others have stopped.',
        C: 'Saying yes from the mind rather than the gut, and paying for it for months.',
        O: 'Mastery. This design is built to become genuinely good at something over time.',
        X: 'Grinding through work the body never said yes to.'
      },
      open: {
        work: 'Energy is borrowed, not generated. You can work intensely and then genuinely have nothing left, and that is the design working correctly.',
        sleep: 'You need more rest than the people around you, and often need to lie down before they do. That is not a weakness to be trained out.',
        body: 'Exercise that assumes a constant engine will not fit. Short and responsive beats long and scheduled.',
        health: 'The tradition watches exhaustion here, and the long cost of keeping pace with sacral beings who are simply built differently.',
        S: 'You know when enough is enough, which sacral beings often do not.',
        C: 'Not knowing when to stop, because the borrowed energy feels like your own until it stops.',
        O: 'Becoming wise about work itself, and about how much of it any life actually needs.',
        X: 'Measuring your work done against people with an engine you do not have.'
      }
    },
    Spleen: {
      defined: {
        work: 'A steady sense of what is safe and what is not. Instinct arrives once, quietly, and does not repeat itself.',
        sleep: 'A consistent internal sense of timing. Regular hours suit this center and irregular ones cost more than they seem to.',
        body: 'A reliable read on what agrees with you. Trusting the first response to a food, before the thinking starts, is the whole practice.',
        health: 'The tradition ties this center to the immune system and to a general sense of wellbeing. It says only that the signal is quiet and easy to talk over.',
        S: 'Instinct you can trust, and a steady baseline of wellbeing.',
        C: 'The signal speaks once, in the moment, and is easily overruled by the mind a second later.',
        O: 'Becoming the person who notices what is off before anyone can explain it.',
        X: 'Talking yourself out of a first instinct and calling it being reasonable.'
      },
      open: {
        work: 'Fear and caution come and go with company. A confident room makes you confident, and that confidence is borrowed.',
        sleep: 'Holding on to what is unhealthy is the theme here, and that includes routines and hours that stopped working long ago.',
        body: 'Habits stay long after they should. The open Spleen keeps things past their usefulness, food and otherwise.',
        health: 'The tradition watches this center for that same holding on, and for the difficulty of letting go of what is familiar but no longer good.',
        S: 'Deep sensitivity to whether something is actually healthy, once you have learned to read it.',
        C: 'Holding on to what is not good for you, and calling it loyalty or habit.',
        O: 'Becoming genuinely wise about health and about timing, having felt so many versions of both.',
        X: 'Staying because leaving feels like fear, when the fear is what is being borrowed.'
      }
    },
    Root: {
      defined: {
        work: 'A consistent supply of pressure and drive. Deadlines are fuel to you, and you supply them to others whether or not you mean to.',
        sleep: 'Adrenal pressure keeps running after the day ends. Winding the body down deliberately does more than any bedtime rule.',
        body: 'Movement is the natural release. Pressure with nowhere to go becomes tension in the lower back and the legs.',
        health: 'The tradition ties this center to the adrenals and to stress carried in the body rather than felt in the mind.',
        S: 'Reliable drive, and a capacity to work under pressure that others find unusual.',
        C: 'The pressure is constant, so rest can feel like something is wrong.',
        O: 'Setting the pace for a group without burning it out.',
        X: 'Confusing being under pressure with being alive.'
      },
      open: {
        work: 'You amplify whatever pressure is in the room, then rush to clear it. The rushing is the trap, not the work.',
        sleep: 'Nights after high-pressure days are the hard ones. Leaving the pressure with the day, deliberately, is the practice.',
        body: 'The urge to hurry shows up physically. Slower movement suits this center better than anything competitive.',
        health: 'The tradition watches the adrenals here as well, and the long cost of living at a speed borrowed from other people.',
        S: 'You can feel a deadline coming before it is announced.',
        C: 'Hurrying to be free of pressure, which only produces more pressure.',
        O: 'Learning that pressure is not an instruction, and that most of it is not yours.',
        X: 'Living permanently at someone else\u2019s pace.'
      }
    }
  };

  /* ---------- the five types ---------- */
  var TYPES = {
    Manifestor: {
      work: 'Built to initiate. Work that requires waiting for permission will read as a cage, and informing the people an action touches is what keeps the door open.',
      sleep: 'The tradition is specific here: wind down alone before bed, and let the day\u2019s initiating energy settle before lying down.',
      body: 'Energy comes in bursts rather than a steady stream. Movement suits the burst, not the schedule.',
      health: 'Anger is named as the signature to watch, and the tradition ties suppressed initiating energy to tension held in the body.'
    },
    Generator: {
      work: 'Built to respond. Work you said yes to from the gut renews you; work you argued yourself into empties you, slowly and then all at once.',
      sleep: 'Go to bed before you are tired and let the last of the day burn off lying down. The tradition repeats this more than any other instruction.',
      body: 'The body wants to be used every day. Satisfaction after physical work is the signal that the energy was spent correctly.',
      health: 'Frustration is the signature to watch. The tradition ties chronic frustration to work the gut never actually agreed to.'
    },
    'Manifesting Generator': {
      work: 'Response first, then speed. Skipping steps is native to this design, and the correction is usually informing people rather than slowing down.',
      sleep: 'The same rule as the Generator, made harder by the number of things still open at the end of a day. Closing loops on paper helps the body close too.',
      body: 'Fast, multi-directional energy. Variety in movement suits this design better than a single discipline.',
      health: 'Both frustration and anger are named here. The tradition reads them as evidence of a yes that was skipped or a person who was not informed.'
    },
    Projector: {
      work: 'Built to guide, not to grind. Recognition and invitation are the conditions, and work taken without them costs more than it pays.',
      sleep: 'Time alone before sleep is important here. The tradition says a Projector needs to discharge what was absorbed from the day before lying down.',
      body: 'There is no consistent engine. Rest is not indulgence in this design, it is the maintenance schedule.',
      health: 'Bitterness is the signature to watch. The tradition ties it directly to working uninvited and unrecognised for too long.'
    },
    Reflector: {
      work: 'Built to sample. What is true for you shifts with the environment and with the lunar month, so a place that suits you matters more than a role that does.',
      sleep: 'Sleeping alone, in your own space, is named as the single most useful practice for this design.',
      body: 'The body reflects whoever is nearby. Food and movement that worked last month may not fit this one, and that is the design, not inconsistency.',
      health: 'Disappointment is the signature to watch. The tradition asks for a full lunar cycle before any major decision, health included.'
    }
  };

  /* ---------- the six lines, as a rhythm ---------- */
  var LINES = {
    1: { work: 'Needs the ground under it before it moves. Research is not procrastination in this line.',
      sleep: 'An unsettled foundation shows up as a mind that will not close at night.',
      body: 'Understanding why a regimen works is what makes it stick.',
      health: 'Insecurity is the theme. The body carries it when the ground has not been laid.' },
    2: { work: 'Natural talent that works best undisturbed. Being called out of the room before you are ready costs more than it gains.',
      sleep: 'Solitude restores this line more reliably than sleep alone does.',
      body: 'Movement done privately, without an audience, suits this line.',
      health: 'Too much calling out, with too little retreat, is where this line strains.' },
    3: { work: 'Learns by bumping into things. What looks like failure here is the actual method.',
      sleep: 'A day of trial and error needs an honest review, not a replay in the dark.',
      body: 'Trying regimens and discarding them is the method, not a lack of discipline.',
      health: 'The wear of repeated trial. This line needs recovery built in, because it will keep testing.' },
    4: { work: 'Runs on the network. Opportunity arrives through people already known, rarely through a cold door.',
      sleep: 'Unsettled relationships disturb this line\u2019s rest more than work does.',
      body: 'Shared movement, with a familiar person, holds better than solo discipline.',
      health: 'Isolation is the strain here. This line is not built to do it alone.' },
    5: { work: 'Called on to solve things, and projected onto while doing it. Delivering what was actually promised is the whole practice.',
      sleep: 'The weight of other people\u2019s expectations follows this line to bed.',
      body: 'Practical, useful movement suits it. Something with a visible point.',
      health: 'The strain of carrying a reputation that was assigned rather than claimed.' },
    6: { work: 'Three phases across a life: trial, retreat, then quiet authority. Work suits whichever phase is running.',
      sleep: 'The roof phase, in the middle third of life, genuinely needs more rest, and the tradition says so plainly.',
      body: 'The relationship to the body changes markedly around thirty and again around fifty.',
      health: 'Detachment can become distance from the body itself. Staying in it is the practice.' }
  };

  /* ---------- authorities ---------- */
  var AUTHORITIES = [
    { match: 'emotional',
      work: 'No same-day yes on anything that matters. Sleeping on it is the method, not a stalling tactic.',
      sleep: 'A decision made at the low end of a wave will keep you awake defending it. Leave it until morning.',
      body: 'Appetite moves with the wave. Eating on a schedule steadies what the wave unsettles.',
      health: 'The tradition watches the gut here, and the cost of committing at a peak and living it out in a trough.',
      S: 'Emotional depth, and the ability to feel the full shape of a decision before making it.',
      C: 'There is never clarity in the moment, and the moment always asks for it.',
      O: 'Becoming the person who waits, in a world that rewards speed and then regrets it.',
      X: 'Deciding at the peak, or at the bottom, and calling either one certainty.' },
    { match: 'sacral',
      work: 'The gut answers before the mind does, in sound rather than in words. The task is to hear it and not to translate it away.',
      sleep: 'Go to bed before the energy runs out, so the last of it discharges lying down.',
      body: 'The body says yes and no to food the same way it says yes and no to work. It is worth listening at the table.',
      health: 'The tradition ties burnout here to a life of yeses the gut never gave.',
      S: 'An immediate and reliable answer, available in the moment.',
      C: 'The mind reaches the response before you have heard it, and overrides it politely.',
      O: 'Building a life entirely out of things you actually responded to.',
      X: 'Reasoning your way past the gut, repeatedly, until you cannot hear it.' },
    { match: 'splenic',
      work: 'The spleen speaks once, quietly, in the moment. It does not argue and it does not repeat itself.',
      sleep: 'A consistent rhythm matters more here than the number of hours.',
      body: 'The first response to a food, before the thinking starts, is the one the tradition trusts.',
      health: 'This center is tied to immunity and to a general sense of wellbeing. The signal is quiet, and easy to talk over.',
      S: 'Instinct in real time, and a good baseline sense of what is safe.',
      C: 'One quiet signal against a loud mind. It is usually the mind that wins.',
      O: 'Learning to move on the first knowing, before the second thought arrives.',
      X: 'Rationalising past the instinct and later recognising it was right.' },
    { match: 'ego',
      work: 'The question is what you actually want, and whether you have the will for it. Both have to be true.',
      sleep: 'Rest is not something to be earned. This authority is where that belief takes hold hardest.',
      body: 'Willpower is real here but finite. Spending all of it on work leaves none for the body.',
      health: 'The tradition watches the heart and the stomach, and the long cost of proving worth.',
      S: 'A clear and honest sense of what you want.',
      C: 'Promising more than the will can carry, because in the moment it feels available.',
      O: 'Spending willpower deliberately, on few things.',
      X: 'Treating every request as a test of your worth.' },
    { match: 'self',
      work: 'Direction, not logic. The question is whether a thing is right for who you are, spoken aloud to hear your own answer.',
      sleep: 'The place matters. Where you sleep affects this authority more than what you did that day.',
      body: 'The right environment does more here than any regimen.',
      health: 'The tradition points to environment first, and everything else second.',
      S: 'A clear sense of what is and is not you.',
      C: 'It has to be spoken to be heard, which means it needs a listener.',
      O: 'Building a life around places and directions that fit.',
      X: 'Deciding silently, and never hearing your own answer.' },
    { match: 'environment',
      work: 'Talking it out is the method. The listener is a sounding board, not an advisor.',
      sleep: 'The room, the light, the sound. This authority is unusually sensitive to where the body lies down.',
      body: 'Change the environment before changing the regimen.',
      health: 'The tradition puts place first here, consistently.',
      S: 'You hear your own truth once it is out loud.',
      C: 'It requires another person to be present, which is not always possible.',
      O: 'Choosing surroundings deliberately rather than accepting them.',
      X: 'Taking advice from the sounding board instead of hearing yourself.' },
    { match: 'lunar',
      work: 'A full lunar cycle before anything major. Twenty-eight days is the tradition\u2019s answer and it does not shorten it.',
      sleep: 'Sleeping alone in your own space is the single most protective practice for this authority.',
      body: 'What suits the body changes across the month. That is the design, not inconsistency.',
      health: 'The tradition asks for the same twenty-eight days before any significant health decision.',
      S: 'A perspective on people and places nobody else in the room has.',
      C: 'Everything worth deciding takes a month, and the world rarely offers one.',
      O: 'Becoming a genuine mirror for a community.',
      X: 'Being rushed into a decision by people whose designs move faster.' }
  ];

  function authorityFor(name) {
    var n = String(name || '').toLowerCase();
    for (var i = 0; i < AUTHORITIES.length; i++) {
      if (n.indexOf(AUTHORITIES[i].match) !== -1) return AUTHORITIES[i];
    }
    return AUTHORITIES[0];
  }

  /* ---------- strategies ---------- */
  var STRATEGIES = {
    Manifestor: {
      S: 'You can start things without waiting for anyone.',
      C: 'Informing feels like asking permission, and it is not. That distinction takes years to sit right.',
      O: 'Peace, which the tradition names as your signature when informing becomes habit.',
      X: 'Acting without a word and meeting resistance you then read as hostility.'
    },
    Generator: {
      S: 'A clear yes when it is real, and a body that backs it.',
      C: 'Waiting to respond, in a culture that rewards initiating.',
      O: 'Satisfaction, which the tradition names as your signature.',
      X: 'Initiating out of impatience, then carrying work the gut never wanted.'
    },
    'Manifesting Generator': {
      S: 'Speed and response together. You get there faster than anyone expects.',
      C: 'Two strategies at once: respond first, then inform. Skipping either one causes the same trouble.',
      O: 'Satisfaction and peace both, when the sequence is kept.',
      X: 'Moving before responding, then informing nobody, and calling the fallout bad luck.'
    },
    Projector: {
      S: 'You see people and systems with a clarity others do not have.',
      C: 'Waiting for the invitation, while watching what you could fix.',
      O: 'Success, which the tradition names as your signature when the invitations are the right ones.',
      X: 'Offering guidance nobody asked for, and being resented for being right.'
    },
    Reflector: {
      S: 'You sample and mirror a whole community back to itself.',
      C: 'A month before any real decision, and a world that will not wait.',
      O: 'Surprise, which the tradition names as your signature.',
      X: 'Being pressed into a decision inside a single day.'
    }
  };

  /* ---------- profiles: a short pair reading ---------- */
  function profileSCOO(c, u, LINESRC) {
    var lc = LINESRC[c] || {}, lu = LINESRC[u] || {};
    return {
      S: 'The conscious line brings ' + strip(lc.strength || lc.theme || 'its own footing') +
        ', and the unconscious line brings ' + strip(lu.strength || lu.theme || 'a second, quieter one') + '.',
      C: 'The two lines want different things at once, and only one of them is visible to you.',
      O: 'Running both deliberately rather than letting the unconscious line drive unnoticed.',
      X: 'Living only the conscious line, and calling the other half a flaw.'
    };
  }

  function strip(s) { return String(s || '').replace(/\.$/, '').toLowerCase(); }

  /* ---------- gates and channels: built from the atlas entry ---------- */
  function gateSCOO(atlasGate, defined) {
    if (!atlasGate) return null;
    var keynote = strip(atlasGate[2]), shadow = strip(atlasGate[3]), gift = strip(atlasGate[4]);
    return {
      S: 'At its best this gate gives ' + gift + '.',
      C: 'Its low expression is ' + shadow + '.',
      O: defined
        ? 'Because the center it sits in is defined, this is available consistently. The opportunity is to spend it on purpose.'
        : 'Because the center it sits in is open, this comes and goes. The opportunity is to notice the conditions under which it arrives.',
      X: 'Reading ' + keynote + ' as a fixed trait rather than a tendency that can be worked with.'
    };
  }

  function channelSCOO(info) {
    if (!info) return null;
    return {
      S: 'A completed circuit. ' + String(info.theme || '').replace(/\.$/, '') + ', available without effort.',
      C: 'A defined channel is not optional. You cannot turn this one off for a room that would prefer it quieter.',
      O: 'Naming it out loud, so the people around you know it is fixed rather than aimed at them.',
      X: 'Assuming everyone has it, and reading its absence in others as a failure of will.'
    };
  }

  var LABELS = { work: 'Work', sleep: 'Sleep', body: 'Diet and exercise', health: 'Health' };
  var ORDER = ['work', 'sleep', 'body', 'health'];

  /* Returns [{key, label, text}] for a life-domain block, or [] when the
     feature has no honest domain reading of its own. */
  function domains(src) {
    if (!src) return [];
    var out = [];
    ORDER.forEach(function (k) {
      if (src[k]) out.push({ key: k, label: LABELS[k], text: src[k] });
    });
    return out;
  }

  function centerLife(name, defined) {
    var c = CENTERS[name];
    if (!c) return null;
    return defined ? c.defined : c.open;
  }

  return {
    VERSION: '1.0.0',
    CAVEAT: CAVEAT,
    LABELS: LABELS,
    ORDER: ORDER,
    CENTERS: CENTERS,
    TYPES: TYPES,
    LINES: LINES,
    AUTHORITIES: AUTHORITIES,
    STRATEGIES: STRATEGIES,
    authorityFor: authorityFor,
    centerLife: centerLife,
    gateSCOO: gateSCOO,
    channelSCOO: channelSCOO,
    profileSCOO: profileSCOO,
    domains: domains
  };
}));
