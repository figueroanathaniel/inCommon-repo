/**
 * inCommon Human Design: the teachings
 * UMD module, no dependencies, no network, no profile access.
 * Version 2.0.0
 *
 * Composes hd-atlas.js (what a feature is) and hd-life.js (what a feature asks
 * of a life) into ten long readings written for one particular chart:
 *
 *   My Type · The Two Charts · Mood · Work · Sleep · Diet and Exercise ·
 *   Health · With Others · Just Me · At Me
 *
 * Voice: a teacher speaking to a student. The epistemic frame is carried in the
 * language rather than in a badge. "The tradition holds", "your chart shows",
 * "it may be that" do the work the four tags did on the shorter surfaces.
 *
 * Nothing here is medical, and the Health reading says so in its own words.
 *
 * BULLETS. Each tab draws its four readings from its own bank. A bullet states
 * the condition it applies under, so two people with different charts do not
 * read the same list, and no two tabs repeat each other.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HDTeachings = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function lower(s) { return String(s || '').replace(/\.$/, '').replace(/^([A-Z])/, function (m) { return m.toLowerCase(); }); }
  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function list(a) {
    var x = (a || []).filter(Boolean);
    if (!x.length) return '';
    if (x.length === 1) return x[0];
    if (x.length === 2) return x[0] + ' and ' + x[1];
    return x.slice(0, -1).join(', ') + ', and ' + x[x.length - 1];
  }
  function an(w) { return /^[AEIOU]/i.test(String(w || '')) ? 'an ' : 'a '; }
  function isGen(t) { return t === 'Generator' || t === 'Manifesting Generator'; }

  var AURA = {
    Manifestor: 'closed and repelling, which the tradition means descriptively rather than unkindly: people cannot read you from the outside, so they invent a reading',
    Generator: 'open and enveloping, so people come closer than they meant to and stay longer than they planned',
    'Manifesting Generator': 'open and enveloping with a forward edge, so people are drawn in and then find you already three steps ahead',
    Projector: 'focused and penetrating, aimed at one person at a time, which is felt as being seen and occasionally as being seen too accurately',
    Reflector: 'sampling and resistant, taking the room in and giving very little fixed back'
  };

  var NOT_SELF = {
    Manifestor: 'anger', Generator: 'frustration', 'Manifesting Generator': 'frustration and anger together',
    Projector: 'bitterness', Reflector: 'disappointment'
  };

  var SIGNATURE = {
    Manifestor: 'peace', Generator: 'satisfaction', 'Manifesting Generator': 'satisfaction and peace',
    Projector: 'success', Reflector: 'surprise'
  };

  /* Which centers the tradition actually speaks about, per reading. */
  var RELEVANT = {
    type: ['Sacral', 'Throat', 'G', 'Heart', 'Spleen', 'Solar Plexus', 'Root', 'Head', 'Ajna'],
    work: ['Sacral', 'Throat', 'Heart', 'Root', 'G'],
    sleep: ['Head', 'Ajna', 'Sacral', 'Root', 'Solar Plexus'],
    body: ['Sacral', 'Spleen', 'Root', 'Solar Plexus', 'Heart'],
    health: ['Spleen', 'Solar Plexus', 'Root', 'Heart', 'Sacral'],
    mood: ['Solar Plexus', 'Root', 'Spleen', 'Heart', 'Ajna'],
    chart: ['G', 'Ajna', 'Head', 'Throat', 'Sacral'],
    synastry: ['Solar Plexus', 'Sacral', 'Spleen', 'G', 'Throat'],
    justme: ['Solar Plexus', 'Ajna', 'Head', 'Spleen', 'G'],
    atme: ['Throat', 'G', 'Heart', 'Solar Plexus', 'Ajna']
  };

  var FIELD = { work: 'work', sleep: 'sleep', body: 'body', health: 'health' };

  var TAB_META = {
    type: { label: 'My Type', title: 'Your Type', kicker: 'type, strategy, authority, and the two lines you live by' },
    chart: { label: 'Chart', title: 'The Two Charts', kicker: 'design and personality, the body you were given and the person you know' },
    mood: { label: 'Mood', title: 'Mood', kicker: 'what navigating emotion looks like in this design' },
    work: { label: 'Work', title: 'Work', kicker: 'how this design is built to spend itself' },
    sleep: { label: 'Sleep', title: 'Sleep', kicker: 'how the day is meant to end' },
    body: { label: 'Diet & Exercise', title: 'Diet and Exercise', kicker: 'what the body is asking for' },
    health: { label: 'Health', title: 'Health', kicker: 'where the tradition says attention goes' },
    synastry: { label: 'Synastry', title: 'Synastry', kicker: 'which designs tend to feel good beside yours, and why' },
    justme: { label: 'Just Me', title: 'Just Me', kicker: 'what solitude gives back to this design' },
    atme: { label: 'At Me', title: 'At Me', kicker: 'what the world sees, and what that does to you' }
  };

  var ORDER = ['type', 'chart', 'mood', 'work', 'sleep', 'body', 'health', 'synastry', 'justme', 'atme'];

  /* ================= paragraphs ================= */

  function typeParas(c, A, L) {
    var t = (A.TYPES || {})[c.type] || {}, life = (L.TYPES || {})[c.type] || {};
    var au = L.authorityFor(c.authority);
    var lc = (A.LINES || {})[c.cLine] || {}, lu = (A.LINES || {})[c.uLine] || {};
    return [
      'Begin here, because everything else in your chart is read through it. You are ' + an(c.type) + c.type + ', and the tradition arrives at that not by temperament or by preference but by looking at which of your nine centers hold a consistent charge. ' +
        (c.definedCount === 0
          ? 'None of yours do, which is the rarest arrangement of all and the reason your reading turns on time rather than on energy.'
          : 'In your chart ' + c.definedCount + ' of them do: ' + list(c.defined) + '. ') +
        clean(t.def || '') + ' Hold that lightly for a moment. A type is not a personality. It is a description of how energy moves through you and, just as importantly, how it does not.',
      'The tradition gives each type one instruction, and yours is this: ' + clean(c.strategy) + ' Students hear that and reach immediately for the exception, the situation where it could not possibly apply. Let the exception wait. What the instruction is really asking is that you stop treating every opening as a question addressed to you. ' +
        clean(life.work || '') + ' When it is kept, the tradition says you feel ' + SIGNATURE[c.type] + '. When it is not, the signal it names is ' + NOT_SELF[c.type] + ', and that signal is worth more to you than any reading, because it arrives on its own and it is always current.',
      'Your authority is where the instruction becomes practical. Your chart gives ' + clean(c.authority) + ' ' + clean(au.work || '') + ' Understand what is being claimed. The tradition is not saying your mind is unintelligent. It is saying your mind is a poor place to make a decision and an excellent place to consider one afterward. ' + clean(au.C || '') + ' Most of a lifetime with this material is learning to hear the authority speak before the mind has finished composing its argument.',
      'Now the two lines. Your profile is ' + c.profileKey + ', ' + clean(c.profileName) + '. The first number, line ' + c.cLine + ', ' + clean(lc.name) + ', is the part you know about yourself. ' + clean(lc.theme) + ' ' + clean(lc.behavior) + ' The second, line ' + c.uLine + ', ' + clean(lu.name) + ', runs underneath and is generally visible to everyone but you. ' + clean(lu.theme) + ' ' + clean(lu.behavior) + ' The pair is not a contradiction to be resolved. ' + clean(c.profileHow || '') + ' Watch for the second line in the reports other people give of you, particularly the ones that surprise you.',
      'Put the four together and a shape appears. ' + (c.definedCount === 0
        ? 'With no center fixed, you are a mirror, and what you take to be your own mood is very often the room\u2019s.'
        : 'Your defined centers, ' + list(c.defined) + ', are fixed. They work the same way in every room, and they are the parts of you other people rely on without asking. Your open centers, ' + list(c.open) + ', are not fixed. They take their colour from whoever is nearby, and almost everything you have called a personal failing probably lives in one of them.') +
        ' ' + (c.channelCount
          ? 'You carry ' + c.channelCount + ' defined ' + (c.channelCount === 1 ? 'channel' : 'channels') + ', ' + list(c.channelNames) + '. These are not optional. You cannot turn them down for a room that would prefer you quieter.'
          : 'You carry no fully defined channel, which means nothing in you is locked open. That is a rare kind of freedom and a rare kind of exposure at once.'),
      'A word about how to use this. The tradition asks for an experiment, not belief. Take the one instruction, ' + lower(c.strategy) + ', and run it for a season on decisions that do not matter much. Watch what changes. If nothing changes you have lost nothing but your attention. If something does, you will not need anyone to confirm it, which is the only kind of confirmation this material was ever able to offer.'
    ];
  }

  function chartParas(c, A, L) {
    var lc = (A.LINES || {})[c.cLine] || {}, lu = (A.LINES || {})[c.uLine] || {};
    return [
      'Your bodygraph is not one chart. It is two, laid over each other, and almost every confusion students have about this material comes from reading them as one. The tradition calls them Personality and Design. Personality is taken from the moment you were born. Design is taken from roughly eighty-eight days earlier, near the second trimester, when the tradition holds the body was being formed. Two moments, two sets of activations, one diagram.',
      'Personality is the part you would call yourself. It is what you notice, what you can describe, what you would put in an introduction. In your chart that side carries ' + c.personalityCount + ' ' + (c.personalityCount === 1 ? 'activation' : 'activations') + ', and your conscious line is ' + c.cLine + ', ' + clean(lc.name) + '. ' + clean(lc.theme) + ' When you explain yourself to someone, this is the material you reach for, and you reach for it accurately.',
      'Design is the body. The tradition is blunt about this: you do not have conscious access to it. It runs whether you attend to it or not, and the people around you see it long before you do. In your chart that side carries ' + c.designCount + ' ' + (c.designCount === 1 ? 'activation' : 'activations') + ', and your unconscious line is ' + c.uLine + ', ' + clean(lu.name) + '. ' + clean(lu.theme) + ' If someone has ever described you in a way that felt inaccurate and stayed with you anyway, this is usually where it came from.',
      'Here is the practical consequence. Personality can be worked on. You can study it, argue with it, refine it, and much of what a person calls growth happens on that side. Design cannot be worked on in the same way. It can only be observed and then arranged around. The tradition says the effort to change your design is the single largest waste of a life\u2019s energy available to you, and that recognising the difference is worth more than any technique.',
      (c.definedCount === 0
        ? 'With no center defined, both sides of your chart are unusually permeable, and the two-chart distinction matters even more: what feels like your personality on a given day is frequently the room, arriving through a design that was built to sample.'
        : 'Both sides feed the same nine centers. Your defined centers, ' + list(c.defined) + ', are fixed no matter which side activated them, and your open centers, ' + list(c.open) + ', are open the same way. The tradition would have you stop asking which side a trait came from and start asking only whether it is consistent. Consistency is what defines a center, and definition is what you can actually rely on.'),
      'Sit with the pair for a while before doing anything with it. The reading that helps most is not a technique. It is the moment a student stops treating the unconscious half as a flaw in the conscious half, and starts treating it as the body they were given to live the conscious half inside.'
    ];
  }

  function moodParas(c, A, L) {
    var spDef = c.defined.indexOf('Solar Plexus') !== -1;
    var rootDef = c.defined.indexOf('Root') !== -1;
    var au = L.authorityFor(c.authority);
    return [
      'Emotion has a particular architecture in this system, and it does not sit where most people expect. The tradition puts it in the Solar Plexus, and it describes it as a wave rather than a state. A wave has a shape and a duration. It is not information about the present moment, and it is not a verdict on your life. Everything else in this reading follows from taking that seriously.',
      spDef
        ? 'Your Solar Plexus is defined. That means the wave is yours, it runs on its own schedule, and it will run whether the day deserves it or not. The tradition\u2019s central claim here is uncomfortable and worth testing: there is no truth in the now. What feels certain at the top of a wave and what feels certain at the bottom are both the wave talking. Clarity does not arrive in a feeling, it arrives over time, after the feeling has finished moving.'
        : 'Your Solar Plexus is open. That means you do not generate the wave. You take it in, amplify it, and hand it back stronger than it arrived. The tradition is specific: an open Solar Plexus feels emotion more intensely than a defined one, not less, because amplification is what open centers do. The trouble is that almost none of it originates in you, and you have probably spent years explaining your own life to yourself using someone else\u2019s weather.',
      'Your authority sits directly on top of this. Your chart gives ' + clean(c.authority) + ' ' + clean(au.how || au.work || '') + ' ' +
        (/emotional/i.test(c.authority)
          ? 'When authority is emotional, the instruction is a waiting instruction and there is no way around it. No same-day yes on anything that matters. The wave has to be ridden out before the answer is legible, and a decision made at either extreme will be defended long after it stopped being right.'
          : 'Your authority is not emotional, which means feeling is not where your decisions are meant to be made at all. That is a relief and a discipline at once: the mood is real, and it is not the instrument you decide with.'),
      rootDef
        ? 'The Root adds pressure to all of this, and in you it is defined. Pressure and emotion together are easy to confuse. What presents as a bad mood is often a body under adrenal load with nowhere to put it. The tradition would have you move the body before interpreting the feeling, because a great deal of what students bring to a reading as emotional turns out to be physical and unspent.'
        : 'Your Root is open, so the pressure you feel is largely borrowed and it arrives as urgency. Urgency and emotion braid together quickly. You will feel a need to resolve a mood immediately, and the resolving is what extends it. The practice is to let a borrowed pressure pass through without acting on it, which is far harder than it sounds and is most of the work.',
      'What navigating emotion actually looks like, then, is unglamorous. It looks like naming the wave when it starts. It looks like refusing to make a decision inside it and saying so out loud. It looks like asking, before you interpret a mood, whether you were alone when it started. ' +
        (spDef ? 'For you the question is how long, not whether.' : 'For you the question is whose, and the answer is very often not yours.') +
        ' None of this asks you to feel less. It asks you to stop treating feeling as evidence.',
      'The tradition offers one encouragement here and it is worth keeping. The wave is not a defect in the design, and neither is the amplification. Both are described as the source of the depth other people come to you for. What is being asked is not that you become even. It is that you stop signing things at the peak.'
    ];
  }

  function synastryParas(c, A, L) {
    var t = c.type;
    var pairs;
    if (isGen(t)) pairs = 'Projectors, who see what you have not noticed about your own energy and can aim it, and other Generators, whose response you can hear and trust because it sounds like your own';
    else if (t === 'Projector') pairs = 'Generators and Manifesting Generators, whose energy you can guide without having to supply it, and Manifestors, who move first and leave you room to see where they are going';
    else if (t === 'Manifestor') pairs = 'Generators, who respond to what you begin and carry it further than you would alone, and Projectors, who can tell you what your initiating looks like from outside it';
    else pairs = 'people who do not need an answer from you today, of any type at all, because time is the only condition your design genuinely requires';
    var openList = c.open.length ? list(c.open) : '';
    return [
      'This is the part of the material students most want and most misuse. The tradition does not rank pairings and does not hand out matches. What it describes is mechanics: what two bodygraphs do when they are placed next to each other, which is not a matter of taste and is fairly easy to feel once you know what you are feeling for.',
      'Start with what you give. Your defined centers, ' + (c.definedCount ? list(c.defined) : 'none in your case') + ', are consistent, and anyone standing near you receives them. ' + (c.definedCount
        ? 'People with those same centers open will feel steadied, focused, or energised by you, and they will not know why. That is your effect, and it operates whether or not you are trying.'
        : 'With nothing fixed, what you give is space, which is rarer and more valuable than it sounds.'),
      openList
        ? 'Now what you receive. Your open centers, ' + openList + ', are where other people land in you. Someone with a defined center where you are open will feel unusually good to be near, and the tradition asks for care exactly here, because that feeling is chemistry rather than character. It is genuinely pleasant and it is genuinely not information about who they are. Many long attachments begin in an open center and are explained afterwards with a story.'
        : 'With every center defined you receive very little from others, which makes you consistent company and can make you hard to reach. The care asked of you is the opposite of most people\u2019s: notice when you have stopped taking anything in.',
      c.hangingCount
        ? 'The strongest pull in this system is electromagnetic, and you carry ' + c.hangingCount + ' half-' + (c.hangingCount === 1 ? 'channel' : 'channels') + ' that would complete if the right person walked in. ' + (c.hangingNames.length ? 'Among them: ' + list(c.hangingNames.slice(0, 3)) + '. ' : '') + 'When someone holds the other gate, a circuit closes that neither of you can close alone. The tradition describes this as the most magnetic experience available between two charts and warns, in the same breath, that magnetism is not compatibility. The circuit will close with anyone who has the gate.'
        : 'You carry no hanging half-channel, which means you are less subject to the sudden electromagnetic pull the tradition describes. Attraction for you tends to build rather than arrive, and that is worth knowing about yourself.',
      'As for which designs tend to feel genuinely good beside yours: ' + pairs + '. Read that as a description of mechanics and not as an instruction. The tradition\u2019s actual position is that any two types work when each keeps its own strategy, and that most of what people call incompatibility is two people running each other\u2019s strategies and wondering why nothing fits.',
      'One last thing, and it is the part worth carrying out of this tab. The question to ask about another person is not whether they feel good to be near. Your open centers will answer that dishonestly for years. The question is whether you are still recognisably yourself in their company, and that one your own signature will answer: ' + SIGNATURE[c.type] + ' if the arrangement suits you, and ' + NOT_SELF[c.type] + ' if it does not.'
    ];
  }

  function justMeParas(c, A, L) {
    var t = c.type;
    var opens = c.open.length ? list(c.open) : '';
    return [
      'Something needs saying before the mechanics, because students arrive at this tab carrying an apology. Solitude is not a lesser condition in this system. It is not the state you occupy while waiting for company. In a design read honestly, time alone is where the borrowed material drains off and what is actually yours becomes legible, and the tradition treats it as a requirement rather than a consolation.',
      opens
        ? 'Here is the mechanism. Your open centers, ' + opens + ', take their charge from whoever is nearby. In company they are amplifying, constantly, and none of it is labelled. Alone, they empty. What you feel after an hour by yourself is not emptiness, though it can be mistaken for it at first. It is the absence of everything you were carrying for other people. The tradition says this is the only condition under which you can tell your own state from the room\u2019s, which makes solitude the closest thing to a diagnostic instrument you have.'
        : 'Your chart has no open center, which is unusual and worth naming. You take in very little, which means solitude will not feel like relief the way it does for most people. It will feel like continuity. Your work alone is different: not draining what is borrowed, but noticing what is fixed, since a person who has never felt a center go quiet rarely knows they are carrying one.',
      (isGen(t)
        ? 'For your type specifically, solitude has a physical shape. You have a working engine, and it wants to be used whether or not anyone is watching. Time alone spent making something, moving something, finishing something, satisfies this design more reliably than time alone spent resting. The tradition would rather you ended a solitary day tired in the body than rested and vaguely unsettled.'
        : t === 'Projector'
          ? 'For your type specifically, solitude is not optional maintenance, it is the maintenance schedule. You have no consistent engine, and in company you are absorbing and guiding at once. The tradition says a Projector without regular unwatched hours becomes bitter, and that the bitterness is not a character flaw but an accounting error. Time alone is how the account is settled.'
          : t === 'Manifestor'
            ? 'For your type specifically, solitude is where the initiating energy gathers. You are not built to be available continuously, and the tradition is unusually direct about this: a Manifestor needs to be left alone, and the anger that arrives when they are not is the design reporting correctly. Take the time before anyone has to ask you why you need it.'
            : 'For your type specifically, solitude is the whole practice. You are the most permeable design there is, and the tradition\u2019s single strongest instruction for a Reflector is to sleep alone and to spend real time in your own space. Not because company is bad for you, but because you cannot tell what you are until the room stops answering the question for you.'),
      'What thriving looks like in a long stretch alone is more specific than people expect. It looks like keeping your strategy even when there is nobody to keep it with, which sounds absurd until you try it: ' + lower(c.strategy) + ', with the day itself as the thing you are responding to or informing. It looks like letting the first two or three days be unpleasant, because draining is not the same as emptying. It looks like noticing which of your habits were only ever for an audience.',
      'And there is a genuine appreciation owed here. The parts of you that feel like too much in a room, ' + (c.channelCount ? 'your fixed circuitry, ' + list(c.channelNames.slice(0, 3)) + ', which cannot be turned down' : 'the consistency you carry, which cannot be turned down') + ', are not too much when there is no room. Alone, the same material simply becomes what you are like. The tradition holds that a person who has spent real time with their own design without an audience for it is very difficult to knock off centre afterwards, and that this is the actual reward.',
      'Do not turn this into a programme. One stretch of unwatched time, entered without a plan for what it will produce, teaches more than a schedule of solitary practice. You are allowed to be alone without it being for something, and this design in particular gets more from that than from any technique in the material.'
    ];
  }

  function atMeParas(c, A, L) {
    var lu = (A.LINES || {})[c.uLine] || {};
    return [
      'This tab is about the half of your effect you do not witness. The tradition is unusually confident here, because the mechanics are not subtle: what is fixed in you radiates, and what radiates is felt by everyone near you whether or not either of you names it. You are the only person in the room who cannot feel your own aura.',
      'Yours is described as ' + AURA[c.type] + '. Read that twice. It is not a description of your manner, which you can adjust, and not of your intentions, which are your own. It is a description of what arrives before you speak. Much of what you have been told about yourself that seemed to come from nowhere is people reporting this accurately and attributing it to character.',
      c.definedCount
        ? 'The specific transmission is your defined centers: ' + list(c.defined) + '. Anyone whose corresponding center is open receives them from you, amplified. ' + (c.defined.indexOf('Throat') !== -1 ? 'With a defined Throat, people feel spoken to and expect you to carry the conversation. ' : '') + (c.defined.indexOf('Solar Plexus') !== -1 ? 'With a defined Solar Plexus, your wave sets the emotional weather for people who are open there, and they will experience your mood as the room\u2019s mood. ' : '') + (c.defined.indexOf('Sacral') !== -1 ? 'With a defined Sacral, people find you energising and stay near you longer than they intended. ' : '') + (c.defined.indexOf('G') !== -1 ? 'With a defined G, people feel a direction near you and often borrow it. ' : '') + (c.defined.indexOf('Heart') !== -1 ? 'With a defined Heart, people feel your willpower as a standard and quietly measure themselves against it. ' : '') + 'None of this is under your control, and none of it stops when you are tired.'
        : 'With no center defined, you transmit nothing fixed, and what people experience near you is largely themselves. That is a profound effect and an easily misread one: people report feeling seen by you when what they felt was their own material handed back clearly.',
      'Then there is your unconscious line, ' + c.uLine + ', ' + clean(lu.name) + '. ' + clean(lu.behavior) + ' This is the part of your profile you do not have access to, and it is the first thing most people meet. When a description of you feels wrong and will not stop bothering you, check it against this line before dismissing it. Being wrong about yourself in exactly this place is normal and structural rather than a failure of self-knowledge.',
      'Now the harder half: what this does to you. Being received in a way you cannot verify has a cost. ' + (c.type === 'Projector'
        ? 'Projectors in particular are seen sharply and then invited or not invited on the strength of it, and years of that produce a habit of proving usefulness before anyone has asked.'
        : c.type === 'Manifestor'
          ? 'Manifestors are read as unavailable before they have said anything, and a lifetime of that produces either isolation or an exhausting compensatory warmth.'
          : isGen(c.type)
            ? 'Generators are experienced as available, and a lifetime of that produces a person who is asked for things constantly and has learned to say yes before the gut has answered.'
            : 'Reflectors are experienced as hard to place, and a lifetime of that produces a habit of taking on a fixed shape so that people have something to hold.') +
        ' The tradition names this projection field and asks only that you learn to recognise it, since correcting it in real time is rarely available to you.',
      'What to do with this, practically. Stop arguing with the first impression, because it is not about your character and it will not be argued with. Attend instead to your signature: if you are living in ' + SIGNATURE[c.type] + ', the projection field is background noise. If you are living in ' + NOT_SELF[c.type] + ', it is worth asking whether you have been arranging a life around how you are received rather than around how you actually decide.'
    ];
  }

  function domainParas(dom, c, A, L) {
    var f = FIELD[dom];
    var typeLife = (L.TYPES || {})[c.type] || {};
    var au = L.authorityFor(c.authority);
    var lc = (L.LINES || {})[c.cLine] || {}, lu = (L.LINES || {})[c.uLine] || {};
    var rel = RELEVANT[dom] || [];
    var defRel = rel.filter(function (n) { return c.defined.indexOf(n) !== -1; });
    var openRel = rel.filter(function (n) { return c.open.indexOf(n) !== -1; });
    var p = [];

    var OPENER = {
      work: 'Work is where a design shows itself fastest, because work is where energy is either spent correctly or spent anyway.',
      sleep: 'Sleep is the least negotiable teaching in this system, and the one students most often skip. Everything else can be experimented with slowly. This one is nightly.',
      body: 'The tradition speaks about the body carefully. It prescribes no diet and names no food. What it describes is the manner in which your particular body wants to be consulted.',
      health: 'Approach this reading the way a teacher would want it approached. Human Design is a tradition of self-observation. It has no clinical standing, it diagnoses nothing, and it is at its most useful when it tells you where to pay attention rather than what is wrong.'
    };
    var TAIL = {
      work: 'Read that again slowly. The tradition is not describing what you are capable of. It is describing what leaves you intact.',
      sleep: 'The instruction is small and the compliance is difficult, which is generally the mark of a teaching worth keeping.',
      body: 'The question is not what is healthy in general. The question is what your particular design can hear.',
      health: 'Hold it as a place to watch, not as a finding.'
    };

    p.push(OPENER[dom] + ' You are ' + an(c.type) + c.type + '. ' + clean(typeLife[f] || '') + ' ' + TAIL[dom]);
    p.push('Your authority shapes this as much as your type does. Your chart gives ' + clean(c.authority) + ' ' + clean(au[f] || '') + ' A student will ask how to tell the difference between the authority speaking and the mind speaking. The answer is unsatisfying and correct: the authority arrives without an argument attached. The mind arrives with reasons. When you find yourself building a case, you are already past the moment.');

    if (defRel.length) {
      p.push('Now the centers that carry this in you, beginning with what is fixed. ' + defRel.map(function (n) {
        var cl = L.centerLife(n, true);
        return 'Your defined ' + n + ' center. ' + clean(cl && cl[f] || '');
      }).join(' ') + ' What is fixed is reliable, and what is reliable is easy to overspend, because it never announces that it is running low.');
    } else {
      p.push('None of the centers the tradition associates with this are defined in you, which is itself the reading. Nothing here runs on a fixed supply. What you have instead is a design that takes its cue from the room, and the practice becomes noticing which room you are in before you conclude anything about yourself.');
    }

    if (openRel.length) {
      p.push('And what is open, which is where the tradition says most of the trouble and most of the wisdom both live. ' + openRel.map(function (n) {
        var cl = L.centerLife(n, false);
        return 'Your open ' + n + ' center. ' + clean(cl && cl[f] || '');
      }).join(' ') + ' An open center is not a deficiency. It is a place designed to sample rather than to hold. The difficulty is that a sample taken often enough starts to feel like a possession, and you begin defending as your own something you only ever borrowed.');
    } else {
      p.push('Every center the tradition associates with this is defined in you. That is a consistent design, and consistency has its own hazard: you are unlikely to notice any of it as a trait, because it has never once been absent. Other people will notice it long before you do, and their reports are worth collecting.');
    }

    p.push('Your lines add the rhythm. Line ' + c.cLine + ', which you are conscious of: ' + clean(lc[f] || '') + ' Line ' + c.uLine + ', which runs without your permission: ' + clean(lu[f] || '') + ' ' + (c.channelCount
      ? 'And your ' + c.channelCount + ' defined ' + (c.channelCount === 1 ? 'channel holds' : 'channels hold') + ' this in place. Fixed circuitry does not soften with effort, and the tradition would rather you arranged a life around it than spent one arguing with it.'
      : 'With no channel fully defined, none of this is locked. You are more changeable here than most, and the practice is to stop reading that changeability as a lack of discipline.'));

    var CLOSE = {
      work: 'So the whole of it comes to one question, asked before anything is agreed to: was this responded to, or was this reasoned into? Answer honestly and act on the answer. The tradition promises nothing more dramatic than that the answer, kept for long enough, changes what a working life feels like from the inside.',
      sleep: 'Take one thing from this and let the rest wait. Get horizontal before you are finished, and let the end of the day happen lying down rather than sitting up. It is a small instruction and the one the tradition repeats most, which is usually a sign that it was hard-won.',
      body: 'The teaching ends where it began. No food is named and no regimen is given, because the tradition holds that your body already answers these questions and has simply not been asked in a way it can hear. Ask once, quietly, before the thinking starts. Then do what it said.',
      health: 'Close this with the caution it opened with. None of this diagnoses anything, none of it should displace a doctor, and none of it is a reason to delay care. What it offers is a place to look and a vocabulary for what you find there. Bring what you notice to someone qualified to interpret it.'
    };
    p.push(CLOSE[dom]);
    return p;
  }

  /* ================= bullets =================
     Each entry is [condition, text]. Conditions:
       ['always']            ['def', Center]      ['open', Center]
       ['type', Name]        ['gen']              ['auth', substring]
       ['line', n]           ['chan']             ['nochan']       ['hang']
  */
  var B = {
    type: {
      S: [['always', 'A design you can name, which most people never get.'],
          ['gen', 'A working engine that renews when it is spent on the right things.'],
          ['type:Projector', 'You see the mechanics of other people quickly and accurately.'],
          ['type:Manifestor', 'You can begin something without anyone\u2019s permission.'],
          ['type:Reflector', 'You read a whole room and hand it back to itself.'],
          ['chan', 'Fixed circuitry others can rely on without asking for it.']],
      C: [['always', 'One instruction, kept in a world that rewards the opposite.'],
          ['gen', 'The mind reaches an answer before the gut has finished responding.'],
          ['type:Projector', 'Waiting for recognition while watching what you could fix.'],
          ['type:Manifestor', 'Informing feels like asking permission, and never stops feeling that way.'],
          ['type:Reflector', 'A month to decide, in a world that offers an afternoon.'],
          ['auth:emotional', 'No clarity in the moment, and the moment always demands it.']],
      O: [['always', 'A season of running the strategy on small decisions, to see what changes.'],
          ['always', 'Living toward your signature rather than away from your discomfort.'],
          ['nochan', 'Nothing locked, so more of you is genuinely open to change than most.'],
          ['chan', 'Arranging a life around what is fixed rather than arguing with it.'],
          ['line:6', 'Three distinct phases across a life, each with its own permission.']],
      X: [['always', 'Treating a type as a personality, then defending the description.'],
          ['gen', 'Saying yes from the mind and paying for it for months.'],
          ['type:Projector', 'Offering guidance nobody asked for and resenting the reception.'],
          ['type:Manifestor', 'Moving without a word, then reading the resistance as hostility.'],
          ['type:Reflector', 'Being pressed into a decision inside a single day.']]
    },
    chart: {
      S: [['always', 'Two sources of information about yourself instead of one.'],
          ['always', 'A conscious line you can describe accurately when asked.'],
          ['def:G', 'A fixed sense of direction that both halves of the chart agree on.'],
          ['def:Ajna', 'A consistent way of thinking things through, on both sides.'],
          ['always', 'A body that has been running its own half competently your whole life.']],
      C: [['always', 'The design half is genuinely unavailable to introspection.'],
          ['always', 'Other people see the unconscious line before you ever will.'],
          ['open:G', 'Direction shifts with place, which the conscious half keeps trying to explain.'],
          ['open:Ajna', 'Certainty borrowed on one side, defended on the other.'],
          ['always', 'Descriptions of you that feel wrong and are not.']],
      O: [['always', 'Collecting outside reports as information about the half you cannot see.'],
          ['always', 'Letting the body\u2019s half be observed rather than corrected.'],
          ['always', 'Noticing which of your traits are consistent and which only recur.'],
          ['chan', 'Reading your fixed channels as the meeting point of both charts.'],
          ['line:3', 'Trial and error on the conscious side, teaching the unconscious side faster.']],
      X: [['always', 'Spending a life trying to reform the design half.'],
          ['always', 'Dismissing an accurate report because it did not match your self-image.'],
          ['always', 'Reading the two charts as one and wondering why you contradict yourself.'],
          ['always', 'Assuming the conscious half is the real you and the rest is noise.']]
    },
    mood: {
      S: [['def:Solar Plexus', 'Real emotional depth, and a range other people rely on you to hold.'],
          ['open:Solar Plexus', 'You read the emotional weather of a room early and accurately.'],
          ['auth:emotional', 'Waiting out a wave is a skill, and you have had to build it.'],
          ['def:Root', 'Pressure you can work under without it turning into panic.'],
          ['def:Spleen', 'A quiet baseline sense of wellbeing that does not swing.']],
      C: [['def:Solar Plexus', 'There is no truth in the now, and the now keeps insisting there is.'],
          ['open:Solar Plexus', 'Amplifying a feeling that started in someone else entirely.'],
          ['open:Solar Plexus', 'Avoiding a hard conversation to keep the air calm.'],
          ['open:Root', 'Hurrying to be free of pressure, which produces more of it.'],
          ['open:Spleen', 'Holding on to what is familiar past the point it was good for you.']],
      O: [['always', 'Naming the wave out loud when it starts, before interpreting it.'],
          ['open:Solar Plexus', 'Asking whose feeling this is before asking what it means.'],
          ['auth:emotional', 'Refusing to decide inside a mood, and saying so plainly.'],
          ['def:Root', 'Moving the body first, then reading the feeling that is left.'],
          ['def:Solar Plexus', 'Becoming the person who does not act on the first feeling.']],
      X: [['def:Solar Plexus', 'Signing something at the peak and defending it from the trough.'],
          ['open:Solar Plexus', 'Building a life story out of borrowed weather.'],
          ['always', 'Treating a feeling as evidence about the present moment.'],
          ['open:Root', 'Confusing adrenal urgency with an emotional truth.']]
    },
    work: {
      S: [['gen', 'Energy that renews when it is spent on work you actually responded to.'],
          ['def:Throat', 'You can be heard, and you can make things happen by saying them.'],
          ['def:Heart', 'Willpower that delivers what it promised.'],
          ['def:Root', 'Deadlines are fuel rather than threat.'],
          ['def:G', 'A stable direction that makes long projects natural.'],
          ['type:Projector', 'You can see what a system needs before anyone explains it.']],
      C: [['open:Sacral', 'Borrowed energy feels like your own until it is suddenly gone.'],
          ['open:Throat', 'Attention comes and goes, and forcing it costs more than it returns.'],
          ['open:Heart', 'Willpower is not consistently available, and the shortfall reads as weakness.'],
          ['open:Root', 'Rushing to clear pressure that was never yours.'],
          ['open:G', 'Career advice assuming one fixed path will not fit you.'],
          ['gen', 'Talking yourself into work the gut declined.']],
      O: [['always', 'Asking, before agreeing: was this responded to, or reasoned into?'],
          ['gen', 'Mastery, which this design is genuinely built for over time.'],
          ['type:Projector', 'Work taken by invitation, which changes what the same hours cost.'],
          ['def:Heart', 'Choosing what your will is spent on rather than answering every ask.'],
          ['open:Sacral', 'Building a working life around bursts rather than a steady engine.']],
      X: [['always', 'Measuring your work done against a design you do not have.'],
          ['gen', 'Grinding through work the body never said yes to.'],
          ['type:Projector', 'Working uninvited until bitterness arrives and gets misread as burnout.'],
          ['def:Heart', 'Overcommitting because you can, then paying in the body.'],
          ['open:Root', 'Living permanently at someone else\u2019s pace.']]
    },
    sleep: {
      S: [['gen', 'A body that tells you plainly when it has been used enough.'],
          ['def:Ajna', 'A mind that keeps its shape, so a routine actually holds.'],
          ['def:Spleen', 'A reliable internal sense of timing.'],
          ['def:Head', 'Inspiration arrives on its own, and can be written down and set aside.'],
          ['open:Root', 'Once the day\u2019s pressure is left behind, it genuinely leaves.']],
      C: [['def:Head', 'Mental pressure does not switch off because the day ended.'],
          ['open:Head', 'The evening racing mind is usually the day\u2019s borrowed questions.'],
          ['def:Root', 'Adrenal pressure keeps running after everything else has stopped.'],
          ['gen', 'Going to bed already exhausted, night after night.'],
          ['open:Sacral', 'Needing more rest than the people around you, and arguing with it.']],
      O: [['gen', 'Lying down before you are finished, and letting the last of it burn off there.'],
          ['def:Head', 'Emptying the questions onto paper before the light goes out.'],
          ['open:Solar Plexus', 'A real transition after an absorbing day, rather than a screen.'],
          ['type:Reflector', 'Sleeping alone in your own space, which the tradition asks for directly.'],
          ['type:Projector', 'Unwatched time before bed to discharge what the day put in you.']],
      X: [['always', 'Treating sleep as the reward for a finished day.'],
          ['def:Root', 'Taking pressure to bed and calling it thinking.'],
          ['open:Head', 'Solving, at midnight, a question that was never yours.'],
          ['open:Sacral', 'Keeping the hours of people with an engine you do not have.']]
    },
    body: {
      S: [['gen', 'A body that wants to be used and says so clearly.'],
          ['def:Spleen', 'A trustworthy first read on what agrees with you.'],
          ['def:Root', 'Movement is the natural release, and it works.'],
          ['def:Ajna', 'Routine suits you, so one decision can cover a hundred meals.'],
          ['def:Solar Plexus', 'Appetite that moves honestly with the wave rather than hiding.']],
      C: [['open:Sacral', 'Exercise that assumes a constant engine will not fit.'],
          ['open:Spleen', 'Habits stay long past the point they stopped serving you.'],
          ['open:Solar Plexus', 'Smoothing a borrowed feeling with food.'],
          ['open:Heart', 'Regimens built on willpower fail, and the failure gets read as character.'],
          ['open:Ajna', 'Food rules absorbed from other people rarely hold.']],
      O: [['always', 'Asking the body once, quietly, before the thinking starts.'],
          ['def:Spleen', 'Trusting the first response to a food and not the second thought.'],
          ['gen', 'Ending the day physically tired rather than mentally spent.'],
          ['open:Sacral', 'Short and responsive movement instead of long and scheduled.'],
          ['line:3', 'Trying regimens and discarding them, which here is the method.']],
      X: [['always', 'Following a regimen your design was never able to hear.'],
          ['open:Heart', 'Turning the body into another place to prove something.'],
          ['open:Spleen', 'Keeping a habit because leaving it feels like fear.'],
          ['def:Heart', 'Pushing through a session the body had already declined.']]
    },
    health: {
      S: [['def:Spleen', 'A steady immune baseline the tradition treats as an asset.'],
          ['def:Solar Plexus', 'Emotion that moves rather than sitting in the body.'],
          ['def:Root', 'Stress that has somewhere to go.'],
          ['gen', 'A clear physical signal when something has gone on too long.'],
          ['def:Heart', 'A body that recovers when the will finally allows it to.']],
      C: [['open:Spleen', 'The signal about what is unhealthy is quiet and easily overruled.'],
          ['open:Solar Plexus', 'Conflict avoided until the body carries it instead.'],
          ['open:Root', 'A speed borrowed from other people, held for years.'],
          ['open:Heart', 'Proving worth through effort, which the tradition watches closely.'],
          ['gen', 'Burnout arriving as a surprise after a long run of yeses.']],
      O: [['always', 'Noticing where attention goes, and bringing that to someone qualified.'],
          ['always', 'Reading your not-self signature as early information rather than failure.'],
          ['def:Spleen', 'Acting on the first instinct, before the reasoning starts.'],
          ['open:Solar Plexus', 'Saying the hard thing while it is still small.'],
          ['open:Root', 'Letting a borrowed urgency pass without acting on it.']],
      X: [['always', 'Mistaking a tradition of self-observation for a diagnosis.'],
          ['always', 'Delaying real care because a reading offered an explanation.'],
          ['open:Heart', 'Measuring recovery against people whose willpower is fixed.'],
          ['gen', 'Reading exhaustion as a discipline problem.']]
    },
    synastry: {
      S: [['always', 'You give consistently, and people feel it without being told.'],
          ['def:Sacral', 'Others find you energising and stay near you.'],
          ['def:G', 'People feel a direction near you and often borrow it.'],
          ['def:Throat', 'Conversations move because you are in them.'],
          ['type:Projector', 'You see a person\u2019s mechanics before they have described themselves.'],
          ['nochan', 'What you offer is space, which is rarer than it sounds.']],
      C: [['open:Solar Plexus', 'A defined wave nearby will feel like your own feeling.'],
          ['open:Sacral', 'Someone else\u2019s energy will keep you up past your own limit.'],
          ['open:Spleen', 'Their confidence becomes yours, and it was only ever borrowed.'],
          ['hang', 'Electromagnetic pull that closes a circuit and explains nothing about them.'],
          ['open:G', 'You take direction from whoever you are closest to.']],
      O: [['always', 'Asking whether you are still recognisably yourself in their company.'],
          ['always', 'Reading chemistry as mechanics rather than as character.'],
          ['gen', 'Letting a Projector aim energy you already have.'],
          ['type:Projector', 'Guiding an engine you do not have to supply.'],
          ['hang', 'Knowing which half-channels of yours a person is completing.']],
      X: [['always', 'Mistaking how good someone feels to be near for who they are.'],
          ['always', 'Running each other\u2019s strategies and calling the friction incompatibility.'],
          ['open:Solar Plexus', 'Staying in a difficult arrangement to keep the emotional weather calm.'],
          ['hang', 'Building a life on a circuit anyone with that gate would close.']]
    },
    justme: {
      S: [['always', 'Alone, what is yours becomes legible for the first time.'],
          ['open:Solar Plexus', 'The borrowed weather clears, and it turns out you were fine.'],
          ['open:Head', 'The questions go quiet, because most were never yours.'],
          ['gen', 'An engine that is satisfying to use with nobody watching.'],
          ['type:Reflector', 'Your own space returns you to yourself faster than anything else.']],
      C: [['always', 'The first days feel like emptiness rather than relief.'],
          ['type:Projector', 'Without an audience, the habit of proving usefulness has nowhere to go.'],
          ['type:Manifestor', 'The energy gathers and wants somewhere to be spent.'],
          ['gen', 'Solitude spent resting rather than making leaves you unsettled.'],
          ['nodef', 'Nothing fixed to hold on to when the room stops answering.']],
      O: [['always', 'Keeping your strategy with the day itself as the other party.'],
          ['always', 'Noticing which habits were only ever for an audience.'],
          ['gen', 'Making something, finishing something, with no one to show.'],
          ['type:Projector', 'Unwatched hours, which the tradition treats as the maintenance schedule.'],
          ['type:Reflector', 'Real time in your own space, which is the strongest instruction you have.']],
      X: [['always', 'Turning solitude into a programme with an outcome attached.'],
          ['always', 'Reading the first discomfort as proof that you need company.'],
          ['always', 'Apologising for time that the design actually requires.'],
          ['open:Spleen', 'Filling the quiet with a familiar habit that stopped being good.']]
    },
    atme: {
      S: [['always', 'An effect on rooms that operates whether or not you are trying.'],
          ['def:Throat', 'People expect you to carry the conversation, and you can.'],
          ['def:Sacral', 'You are experienced as available and warm without effort.'],
          ['def:G', 'People feel oriented near you.'],
          ['type:Projector', 'You are felt as seeing people, which is rare and valued.'],
          ['nodef', 'People meet themselves near you, clearly, which is its own gift.']],
      C: [['always', 'The first impression is not about your character and will not be argued with.'],
          ['always', 'Your unconscious line is read before you have said anything.'],
          ['def:Solar Plexus', 'Your wave becomes the room\u2019s weather without your consent.'],
          ['def:Heart', 'People measure themselves against your willpower and resent it quietly.'],
          ['type:Manifestor', 'You are read as unavailable before you have spoken.']],
      O: [['always', 'Collecting outside reports as information about the half you cannot see.'],
          ['always', 'Letting your signature, not the projection, tell you how you are doing.'],
          ['def:Throat', 'Choosing when to speak, since the capacity is always there.'],
          ['type:Projector', 'Waiting for the invitation, which changes how you are received.'],
          ['always', 'Naming your fixed centers aloud so people know they are not aimed at them.']],
      X: [['always', 'Arranging a life around how you are received rather than how you decide.'],
          ['always', 'Arguing with a first impression that was never about you.'],
          ['always', 'Compensating for the aura with a warmth that exhausts you.'],
          ['always', 'Dismissing an accurate report because it contradicted your self-image.']]
    }
  };

  function matches(cond, c) {
    if (cond === 'always') return true;
    if (cond === 'gen') return isGen(c.type);
    if (cond === 'chan') return c.channelCount > 0;
    if (cond === 'nochan') return c.channelCount === 0;
    if (cond === 'hang') return c.hangingCount > 0;
    if (cond === 'nodef') return c.definedCount === 0;
    var i = cond.indexOf(':');
    if (i === -1) return false;
    var k = cond.slice(0, i), v = cond.slice(i + 1);
    if (k === 'def') return c.defined.indexOf(v) !== -1;
    if (k === 'open') return c.open.indexOf(v) !== -1;
    if (k === 'type') return c.type === v;
    if (k === 'auth') return String(c.authority).toLowerCase().indexOf(v) !== -1;
    if (k === 'line') return String(c.cLine) === v || String(c.uLine) === v;
    return false;
  }

  function pick(bank, c) {
    var out = [];
    (bank || []).forEach(function (row) { if (matches(row[0], c)) out.push(row[1]); });
    if (out.length < 3) {
      (bank || []).forEach(function (row) {
        if (out.length < 3 && out.indexOf(row[1]) === -1) out.push(row[1]);
      });
    }
    return out.slice(0, 5);
  }

  function quadFor(tab, c) {
    var bank = B[tab] || {};
    return [
      { label: 'Strengths', accent: '#59b37d', items: pick(bank.S, c) },
      { label: 'Challenges', accent: '#e08d7d', items: pick(bank.C, c) },
      { label: 'Opportunities', accent: '#2fff8f', items: pick(bank.O, c) },
      { label: 'Obstacles', accent: '#b79bff', items: pick(bank.X, c) }
    ];
  }

  var PARAS = {
    type: typeParas, chart: chartParas, mood: moodParas,
    synastry: synastryParas, justme: justMeParas, atme: atMeParas
  };

  function build(chart, A, L) {
    if (!chart || !A || !L) return [];
    var c = {
      type: chart.type, strategy: chart.strategy, authority: chart.authority,
      profileKey: chart.profileKey, profileName: chart.profileName, profileHow: chart.profileHow,
      cLine: chart.cLine, uLine: chart.uLine,
      defined: chart.defined || [], open: chart.open || [],
      definedCount: (chart.defined || []).length,
      channelNames: chart.channelNames || [],
      channelCount: (chart.channelNames || []).length,
      gateCount: chart.gateCount || 0,
      designCount: chart.designCount || 0,
      personalityCount: chart.personalityCount || 0,
      hangingNames: chart.hangingNames || [],
      hangingCount: (chart.hangingNames || []).length
    };
    return ORDER.map(function (key) {
      var meta = TAB_META[key];
      var paras = PARAS[key] ? PARAS[key](c, A, L) : domainParas(key, c, A, L);
      return {
        key: key, label: meta.label, title: meta.title, kicker: meta.kicker,
        paragraphs: paras.map(clean).filter(function (x) { return x.length > 40; }),
        quads: quadFor(key, c)
      };
    });
  }

  return { VERSION: '2.0.0', ORDER: ORDER, TAB_META: TAB_META, RELEVANT: RELEVANT, build: build };
}));
