/* numerology-content.js. Content layer for the My Numerology page. V1.1.0

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
      why: 'One is the first count, the point before there is a line. Every way of counting that starts from it gives it the same character: whatever exists before anything is joined to it, and so whatever has to move under its own power.',
      universal: 'Some things only happen because somebody goes first. The 1 is that first step, taken before the path is cleared or the company arrives. Wherever it falls, something waits to be started by you rather than joined, and it tends to stay unstarted until you start it.',
      path: 'Across a whole life the 1 keeps handing you the opening move. Following rarely fits for long, and the long work is discovering that an original road is lonely at its start and far less so once others find it.',
      express: 'What people meet in you is directness: someone who begins things on their own steam and is hard to turn once the decision is made.',
      persona: 'Before anyone knows you, they tend to read someone with a plan already in hand, a person to ask rather than a person to steer.',
      soul: 'Underneath, the want is simple and fierce: the right to decide for yourself without waiting on a room to agree.',
      year: 'This year is new ground. Seeds go in now and the harvest comes later, so what looks like slow progress is usually the planting.',
      month: 'These weeks favour starting the thing over polishing it.',
      day: 'Today rewards whoever moves first, and the first move is allowed to be small.',
      pinnacle: 'Through this long stretch independence gets built whether or not you felt ready, and much of the growing happens alone before it is shared.',
      challenge: 'What keeps circling back is how to stand on your own without walling yourself off, and how to say what you want without running over the people near you.',
      cycle: 'This season of life turns around defining yourself, and its first attempts carry more weight than they seem to at the time.',
      birthday: 'The day you arrived carries a knack for opening doors that other people walk through later.',
      ask: 'What would you begin this week if nobody had to approve it first?',
      strengths: ['You may find beginning easier than most people find deciding.', 'You may carry a natural authority that does not need volume.', 'You may work well without supervision or applause.'],
      challenges: ['You may confuse independence with refusing help.', 'You may start more than you finish.', 'You may read collaboration as dilution.'],
      opportunities: ['There is room to lead something small that is genuinely yours.', 'There is room to let a first draft be enough.', 'There is room to invite one person in early.'],
      obstacles: ['A habit of proving self-sufficiency before it is asked for.', 'Impatience with the slow middle of any project.', 'A tendency to leave when the work turns collective.'],
      stage: { young: 'Early on, 1 often shows up as restlessness with instruction. You may have needed to try it your own way before advice could land.',
        middle: 'By mid-life, 1 tends to ask for a project with your name on it. You may notice the pull to build something that does not depend on anyone else keeping it alive.',
        mature: 'Later, 1 usually softens into a quieter authority. You may find you can hand things on without feeling erased.' } },
    2: { name: 'the Diplomat', essence: 'pairs, patience, and quiet partnership',
      why: 'Two is the first relation. With one there is only a self; with two there is a between, and everything a between asks for: listening, timing, the space where one person ends and the other begins.',
      universal: 'The 2 lives in the space between people. It notices before it speaks and moves through the other person rather than past them. Its gift is a fine sensitivity, and its quiet work is keeping your own outline while you feel everyone else’s.',
      path: 'Your long road runs through relationship. The 2 asks you to grow inside partnership while keeping your own shape, which is harder than either leading or leaving.',
      express: 'People meet tact in you, a receptiveness that makes you easy to talk to and harder to read.',
      persona: 'At first sight you tend to come across as gentle and safe to approach, someone who listens before deciding what to say.',
      soul: 'What you privately long for is closeness with peace inside it: to be met without having to fight for the meeting.',
      year: 'This year moves through patience and pairing. What you want tends to arrive through cooperation, and pushing slows it down.',
      month: 'These weeks ask you to tend an agreement rather than launch a new one.',
      day: 'Today goes better slowly, and better with someone beside you.',
      pinnacle: 'For this long stretch the growth is relational: shared work, slow trust, and a sensitivity that becomes skill.',
      challenge: 'What keeps returning is the moment of saying the true thing out loud, before resentment says it for you in a worse voice.',
      cycle: 'This season of life educates the heart, mostly through the people you share it with.',
      birthday: 'Your birth day carries a gift for reading a room and finding the middle that everyone can live with.',
      ask: 'Where have you kept the peace at the cost of saying what you actually prefer?',
      strengths: ['You may sense what a room needs before it is said.', 'You may be trusted with things people tell nobody else.', 'You may negotiate without leaving damage.'],
      challenges: ['You may keep a peace that costs you the truth.', 'You may wait for an invitation that is not coming.', 'You may take on the feeling in the room as if it were yours.'],
      opportunities: ['There is room to state a preference plainly and early.', 'There is room to let a disagreement stay open without fixing it.', 'There is room to be the partner rather than the caretaker.'],
      obstacles: ['A reflex of self-erasure dressed as kindness.', 'Decisions deferred until someone else makes them.', 'Resentment stored instead of spoken.'],
      stage: { young: 'Early on, 2 often shows up as adapting to whoever you are with. You may have learned other people\u2019s moods faster than your own.',
        middle: 'By mid-life, 2 tends to test whether your relationships have room for your actual preferences. You may notice the cost of the peace you have been keeping.',
        mature: 'Later, 2 usually becomes real diplomacy rather than accommodation. You may find you can hold a difference without losing the bond.' } },
    3: { name: 'the Communicator', essence: 'expression, play, and the social voice',
      why: 'Three is the first shape that can stand: two points make a line, and a third makes a figure. So the tradition reads 3 as what two people make together and offer outward, the child, the song, the word said aloud.',
      universal: 'The 3 wants to make something and let it be seen. It speaks, plays, and lightens whatever room it walks into. Its gift is creative contact, and its risk is being interested in everything at once and finishing very little of it.',
      path: 'Over a lifetime the 3 keeps asking you to say something and let it land. Range comes easily; depth arrives once you choose a subject and stay with it past the point where it stops being fun.',
      express: 'You come across as warm and quick with words, someone who makes a difficult room easier to stand in.',
      persona: 'Strangers tend to see brightness first: someone sociable and easy, whose seriousness only shows later.',
      soul: 'The private want is to be delighted in, and to have something of your own to show the people you love.',
      year: 'This year turns toward visibility and making. Say it, make it, and put it somewhere people can see it.',
      month: 'These weeks favour expression over bookkeeping.',
      day: 'Today opens through conversation and through making something with your hands or your voice.',
      pinnacle: 'This long stretch brings creative expression, often with more openings than focus, and the real growth is choosing among them.',
      challenge: 'The returning question is how to finish one thing, and how to speak plainly in the moments when charm would be easier.',
      cycle: 'This season of life is about voice, contact, and finding out how wide your range really runs.',
      birthday: 'The day you were born carries a gift for making an idea likeable.',
      ask: 'Which unfinished thing of yours deserves to be carried all the way to the end?',
      strengths: ['You may find words for what others only feel.', 'You may lift a difficult mood without denying it.', 'You may make things simply because making them is good.'],
      challenges: ['You may scatter across three projects and finish none.', 'You may use humour where honesty was needed.', 'You may perform rather than say.'],
      opportunities: ['There is room to take one creative thread to completion.', 'There is room to be unpolished in front of someone safe.', 'There is room to let the work be the point rather than the response.'],
      obstacles: ['An audience installed early, still watching.', 'Interest that fades exactly where craft begins.', 'Optimism used as a way past the hard conversation.'],
      stage: { young: 'Early on, 3 often shows up as talent noticed before it was trained. You may have been rewarded for ease rather than depth.',
        middle: 'By mid-life, 3 tends to ask what you actually want to say. You may notice the difference between being liked and being heard.',
        mature: 'Later, 3 usually settles into craft. You may find you would rather do one thing well than five things visibly.' } },
    4: { name: 'the Builder', essence: 'foundations, work, and the steady hand',
      why: 'Four is the square, the four corners and four directions, the first number that encloses space. Walls, fields and foundations are all fours, which is why the tradition hears in it work, order and the ground underfoot.',
      universal: 'The 4 builds. It repeats the good habit, keeps its word, and makes things that are still standing next year. Its gift is reliability, and its risk is holding a shape so tightly that nothing new can get in.',
      path: 'Your whole life keeps asking you to build something that holds. Steadiness comes naturally; the slower discovery is that rest belongs inside the structure rather than outside it.',
      express: 'What others meet is a steady hand: practical, methodical, and good for exactly what you said you would do.',
      persona: 'At a first meeting you tend to read as solid and trustworthy, a person whose plans can be built on.',
      soul: 'Privately you want ground that will not move: safety earned, and a life you built rather than one that happened to you.',
      year: 'This year asks for foundation work. It is slow and unglamorous, and it is exactly what lets next year stand.',
      month: 'These weeks are for structure: the boring task that makes the rest possible.',
      day: 'Today rewards whatever is methodical over whatever is clever.',
      pinnacle: 'Through this long stretch effort and discipline build what lasts, and the work tends to be quiet until suddenly it is visible.',
      challenge: 'What keeps returning is flexibility: letting good enough count as finished, and letting a plan bend before it breaks.',
      cycle: 'This season of life lays foundations: work, order, and roots put down on purpose.',
      birthday: 'The day you were born carries a gift for turning an idea into a working system.',
      ask: 'What are you holding rigid that could carry more weight if it were allowed to bend?',
      strengths: ['You may be the person a plan actually survives.', 'You may hold a standard without a speech about it.', 'You may make an unglamorous system that carries everyone.'],
      challenges: ['You may treat rest as something to earn.', 'You may resist a change that would save you work.', 'You may carry more than you delegate.'],
      opportunities: ['There is room to build the small structure instead of planning the large one.', 'There is room to hand one duty to someone else.', 'There is room to schedule the rest rather than wait for permission.'],
      obstacles: ['A standard set by someone who was never satisfied.', 'Work used as a way of not feeling.', 'A plan defended past its usefulness.'],
      stage: { young: 'Early on, 4 often shows up as responsibility taken sooner than it was offered. You may have been the reliable one before you chose to be.',
        middle: 'By mid-life, 4 tends to ask what the structure is for. You may notice you have built well and rested rarely.',
        mature: 'Later, 4 usually becomes mastery with less strain. You may find you can keep the standard and drop the self-audit.' } },
    5: { name: 'the Explorer', essence: 'change, freedom, and appetite for experience',
      why: 'Five sits at the middle of the nine, with four numbers on either side, and it is the count of the senses and of the fingers that reach out. So the tradition reads it as the turning point, the hinge, the appetite for contact with the world.',
      universal: 'The 5 is motion. It varies, travels, tastes, and refuses to be held in one shape for long. Its gift is adaptability, and its risk is leaving before anything has had time to take root.',
      path: 'Your long road gathers experience and stays free enough to use it. Somewhere along it, commitment stops feeling like capture and starts feeling like a place to stand while you keep moving.',
      express: 'People meet curiosity in you, a quickness and versatility that makes you good company and hard to pin down.',
      persona: 'Strangers tend to read you as lively and a little unpredictable, someone who has been places and will go further.',
      soul: 'What you privately want is room: room to move, to change your mind, and to try the next thing without asking.',
      year: 'This year brings change and range. Doors open, plans shift, and the year rewards saying yes to the right movement.',
      month: 'These weeks invite variety and a little welcome disruption.',
      day: 'Today favours the detour, the new route, the conversation you did not plan.',
      pinnacle: 'This long stretch is full of movement, through places, roles and ideas, and the growth comes from what you choose to keep.',
      challenge: 'What keeps returning is staying long enough for depth, and learning a freedom that is more than the next exit.',
      cycle: 'This season of life is about range: travel, change, and finding your own definition of being free.',
      birthday: 'The day you were born carries a gift for thriving where things change fast.',
      ask: 'Where would staying a little longer give you a freedom that leaving cannot?',
      strengths: ['You may adapt faster than a plan can fail.', 'You may find the possibility nobody listed.', 'You may be genuinely good company in change.'],
      challenges: ['You may leave at the moment depth becomes available.', 'You may mistake restlessness for intuition.', 'You may over-commit to keep every door open.'],
      opportunities: ['There is room to stay through one full cycle of something.', 'There is room to choose a limit that buys you freedom elsewhere.', 'There is room to let variety serve one long aim.'],
      obstacles: ['A reflex toward the exit when things settle.', 'Too many open doors and not enough hours.', 'Novelty used to outrun a feeling.'],
      stage: { young: 'Early on, 5 often shows up as needing to see for yourself. You may have collected experience faster than you could take it in.',
        middle: 'By mid-life, 5 tends to ask what the freedom has been for. You may notice a wish for something that lasts without feeling like a cage.',
        mature: 'Later, 5 usually becomes range rather than escape. You may find you can stay put and still feel unconfined.' } },
    6: { name: 'the Caretaker', essence: 'care, responsibility, and what you hold together',
      why: 'Six is the first perfect number, the sum of its own divisors, one and two and three, and the hexagon is the shape bees build a home from. The tradition hears in it balance, the household, and the care that keeps a group whole.',
      universal: 'The 6 tends. It repairs, nourishes, and takes responsibility, often before anyone asks it to. Its gift is devotion, and its risk is a sense of duty large enough to swallow the person carrying it.',
      path: 'Your whole life keeps placing care in your hands. The work runs through learning to care well without vanishing into it, and finding that help can be refused and still be love.',
      express: 'What people meet in you is warmth with a backbone: someone responsible, protective, and quick to make a place feel like home.',
      persona: 'At first sight you tend to read as kind and dependable, someone others bring their problems to without being invited.',
      soul: 'The private want is harmony: a home and a circle where everyone is all right, you included.',
      year: 'This year centres on home, family, and the commitments you keep. It asks for care given with eyes open.',
      month: 'These weeks pull toward the household, the repair, and the people closest in.',
      day: 'Today is good for tending something or someone, including yourself.',
      pinnacle: 'Through this long stretch responsibility grows, at home and in community, and so does the question of how much of it is yours.',
      challenge: 'What keeps returning is care with edges: help that is offered rather than assumed, and support that does not quietly become control.',
      cycle: 'This season of life gathers around home, family, and service to the people you love.',
      birthday: 'The day you were born carries a gift for making people feel looked after.',
      ask: 'Whose wellbeing are you carrying that was never yours to hold?',
      strengths: ['You may notice what someone needs before they say it.', 'You may hold a household or a team together quietly.', 'You may make beauty and comfort out of ordinary means.'],
      challenges: ['You may take responsibility that was never yours.', 'You may give advice as a way of not being helped.', 'You may resent the load you did not put down.'],
      opportunities: ['There is room to let someone tend you for once.', 'There is room to ask instead of assuming what is needed.', 'There is room to keep one thing that is only for you.'],
      obstacles: ['Care used as the price of closeness.', 'A standard of self-sacrifice nobody requested.', 'Perfectionism about other people\u2019s comfort.'],
      stage: { young: 'Early on, 6 often shows up as being needed young. You may have learned to read the household before you read yourself.',
        middle: 'By mid-life, 6 tends to ask who is caring for the caretaker. You may notice the difference between chosen responsibility and inherited duty.',
        mature: 'Later, 6 usually becomes generous without depletion. You may find you can give from surplus rather than from reserve.' } },
    7: { name: 'the Seeker', essence: 'analysis, solitude, and the search for what is true',
      why: 'Seven is the count of the visible lights that wander the old sky, of the days of the week, of the colours in the bow and the notes of the scale. It is the number of a complete set seen from the outside, which is why the tradition gives it to the one who stands back to study the whole.',
      universal: 'The 7 wants what lies under the surface. It questions, investigates, withdraws to think, and comes back with something nobody else noticed. Its gift is depth, and its risk is a solitude that slowly becomes distance.',
      path: 'Your long road runs through questions. The 7 keeps asking you to look beneath appearances, and in time to discover that trusting someone is not the opposite of thinking clearly.',
      express: 'People meet a quiet intelligence in you, observant and private, with more going on underneath than you show.',
      persona: 'Strangers tend to read you as reserved and a little mysterious, someone who listens closely and gives away little.',
      soul: 'What you privately want is understanding: time alone with a real question, and an answer that holds.',
      year: 'This year turns inward toward study and reflection. Less output, more understanding, and both count.',
      month: 'These weeks favour quiet, research, and the long thought finished at last.',
      day: 'Today rewards a little solitude and one good question.',
      pinnacle: 'This long stretch deepens: study, specialisation, and an inner life that grows more real than the outer one.',
      challenge: 'What keeps returning is letting people come close without needing them to be explained first.',
      cycle: 'This season of life is about inner work, study, and discovering what you actually believe.',
      birthday: 'The day you were born carries a gift for research, for noticing the detail everyone else walked past.',
      ask: 'Which question have you been carrying alone that would open if you said it to one person?',
      strengths: ['You may see the flaw in a plan nobody else questioned.', 'You may be genuinely comfortable alone.', 'You may hold a subject long enough to actually know it.'],
      challenges: ['You may analyse in place of deciding.', 'You may withdraw before asking.', 'You may keep a distance you did not intend.'],
      opportunities: ['There is room to say the half-formed thought out loud.', 'There is room to let expertise be shared rather than proven.', 'There is room to trust a person on incomplete evidence.'],
      obstacles: ['Solitude that stopped being restorative.', 'Certainty used as armour.', 'A question kept open to avoid the commitment an answer would bring.'],
      stage: { young: 'Early on, 7 often shows up as feeling slightly outside the group. You may have watched before joining, and read before asking.',
        middle: 'By mid-life, 7 tends to deepen into your own inner authority. Questions that once felt abstract may now feel urgent.',
        mature: 'Later, 7 usually becomes quiet certainty. You may find you no longer need the argument to know what you know.' } },
    8: { name: 'the Executive', essence: 'power, material mastery, and consequence',
      why: 'Eight is the cube, two times two times two, the first solid with real weight. Turned on its side it becomes the figure of something that circles back to itself, so the tradition reads it as power, material mastery, and what returns to the one who uses it.',
      universal: 'The 8 deals in power and the material world. It organises, earns, takes charge, and answers for the result. Its gift is capability at scale, and its risk is measuring a whole life by its outcomes.',
      path: 'Across your life the 8 keeps handing you power and resources, and asking how honestly they will be held. The long work is learning what is worth the cost of winning.',
      express: 'What people meet in you is capability: someone who can run things, decide quickly, and carry responsibility without flinching.',
      persona: 'At first sight you tend to read as competent and a little formidable, someone who means business.',
      soul: 'Privately you want mastery: to be equal to what life asks, and to build something with real weight.',
      year: 'This year brings consequence: earning, deciding, and reaping what was planted earlier. Ambition is well placed now.',
      month: 'These weeks favour business, decisions, and asking for what your work is worth.',
      day: 'Today rewards taking charge of the practical thing in front of you.',
      pinnacle: 'Through this long stretch achievement and authority grow, along with the test of what you do once you have them.',
      challenge: 'What keeps returning is power used rather than proved, and a sense of your worth that stands apart from your results.',
      cycle: 'This season of life centres on achievement, money, and the honest use of strength.',
      birthday: 'The day you were born carries a gift for management, for seeing how resources and people fit together.',
      ask: 'What would you still choose if winning were taken off the table?',
      strengths: ['You may see how a thing could actually be made to work.', 'You may stay steady when the stakes are real.', 'You may create resources other people rely on.'],
      challenges: ['You may confuse worth with what you can show for it.', 'You may control where trust was needed.', 'You may work through what should have been grieved.'],
      opportunities: ['There is room to use authority for something you would not be paid for.', 'There is room to let a number be enough.', 'There is room to share power before you are asked to.'],
      obstacles: ['A ledger of achievement that never balances.', 'A fear of dependence dressed as competence.', 'An ambition inherited rather than chosen.'],
      stage: { young: 'Early on, 8 often shows up as an early sense of money and standing. You may have learned young what things cost.',
        middle: 'By mid-life, 8 tends to bring the largest stakes you have handled. You may notice how much of your worth is riding on the result.',
        mature: 'Later, 8 usually turns toward stewardship. You may find you would rather make others capable than be indispensable.' } },
    9: { name: 'the Humanitarian', essence: 'completion, compassion, and letting go',
      why: 'Nine is the last single digit, the end of the count before it starts again, and any number multiplied by it returns to nine in its digits. So the tradition gives it completion, the wide view, and the open hand that lets a thing go.',
      universal: 'The 9 is the ending that makes room. It feels widely, gives generously, and sees the long view. Its gift is compassion that reaches past its own circle, and its work is release.',
      path: 'Your long road is wide. The 9 asks you to give at scale and let go cleanly, and over time endings stop feeling like loss and start feeling like part of the giving.',
      express: 'People meet a broad warmth in you, idealistic and artistic, someone who cares about more than their own corner.',
      persona: 'Strangers tend to read you as old in a good way, worldly and kind, someone who has seen a great deal.',
      soul: 'What you privately want is for your life to matter beyond yourself, and for the world to be a little kinder because you were in it.',
      year: 'This year closes a cycle. It is a time for finishing, forgiving, and clearing space before the next 1 begins.',
      month: 'These weeks favour completion over beginning.',
      day: 'Today is good for an ending, a gift, or letting something go.',
      pinnacle: 'This long stretch is broad: service, art, and a life that opens outward toward many people.',
      challenge: 'What keeps returning is holding your own needs inside a compassion that wants to include everyone else first.',
      cycle: 'This season of life is about completion, wisdom, and generosity offered freely.',
      birthday: 'The day you were born carries a gift for compassion that reaches across difference.',
      ask: 'What is finished in your life that you have not yet let yourself close?',
      strengths: ['You may care about people you will never meet.', 'You may forgive at a scale that surprises people.', 'You may see the ending coming and prepare for it kindly.'],
      challenges: ['You may hold on past the point of usefulness.', 'You may serve everyone and account for yourself last.', 'You may grieve endings you chose.'],
      opportunities: ['There is room to complete something you have been circling for years.', 'There is room to name your own need inside the service.', 'There is room to let a loss be honoured rather than argued with.'],
      obstacles: ['A wish to save what has already ended.', 'Compassion extended until nothing is left for you.', 'Nostalgia doing the work of decision.'],
      stage: { young: 'Early on, 9 often shows up as caring about the whole world before your own life was settled. You may have felt older than your years.',
        middle: 'By mid-life, 9 tends to ask what you are willing to finish. You may notice how much of your energy is spent holding old chapters open.',
        mature: 'Later, 9 usually becomes wisdom rather than sacrifice. You may find that letting go has stopped feeling like loss.' } },
    11: { name: 'the Illuminator', essence: 'heightened sensitivity and inspired insight',
      why: 'Eleven is two ones standing side by side, a self meeting a self, and its digits add to 2. The tradition keeps it whole rather than reducing it because the doubled one is read as a 2 carrying a higher voltage: relation lit from within.',
      universal: 'The 11 is a master number. It carries intuition, a sensitive nervous system, and a pull to inspire others with what it sees. Its gift is perception, and its risk is running above its own rating until the wiring hums.',
      path: 'Your long road works with inspiration and sensitivity. Much of it is learning to ground what you receive so that it reaches other people as something they can use.',
      express: 'What people meet in you is a charged presence: perceptive, idealistic, and often a little ahead of the room.',
      persona: 'At first sight you tend to read as luminous and slightly otherworldly, someone who notices more than they say.',
      soul: 'Privately you want to bring something true into the world and have it recognised for what it is.',
      year: 'This year runs at higher voltage: insight, sensitivity, and openings to inspire. Rest becomes part of the work.',
      month: 'These weeks are charged with intuition, so trust the quiet signal and guard your sleep.',
      day: 'Today the first impression is worth more than the analysis.',
      pinnacle: 'Through this long stretch insight and visibility grow, and the work is keeping a body and a life steady enough to carry them.',
      challenge: 'What keeps returning is grounding: turning a fine sensitivity into something usable rather than something that overwhelms you.',
      cycle: 'This season of life is about illumination, intuition, and learning to trust what you perceive.',
      birthday: 'The day you were born carries a gift for intuition that lands before the reasoning catches up.',
      ask: 'What do you already know that you have been waiting for permission to believe?',
      strengths: ['You may sense what is coming before the evidence arrives.', 'You may inspire people without trying to.', 'You may feel the truth of a situation instantly.'],
      challenges: ['You may run past your own nervous limits.', 'You may doubt what you clearly perceived.', 'You may absorb what is not yours.'],
      opportunities: ['There is room to make a daily practice that grounds you.', 'There is room to act on one clear intuition, in small scale.', 'There is room to reduce the input rather than the sensitivity.'],
      obstacles: ['Overstimulation treated as normal.', 'Perception dismissed because it cannot be proved.', 'A calling held at arm\u2019s length out of fear of it.'],
      stage: { young: 'Early on, 11 often shows up as feeling too much and explaining it as being too sensitive. You may have muted the signal to fit in.',
        middle: 'By mid-life, 11 tends to insist on being used. You may notice that ignoring the perception costs more than acting on it.',
        mature: 'Later, 11 usually becomes steady insight. You may find you can receive without being flooded.' } },
    22: { name: 'the Master Builder', essence: 'vision built into material form',
      why: 'Twenty two is two twos, partnership doubled, and its digits add to 4, the square and the foundation. The tradition keeps it whole because it reads the pair of twos as a builder who can see the blueprint for many people at once.',
      universal: 'The 22 is a master number. It joins vision to construction, the dream to the drawing to the building. Its gift is scale, and its risk is a plan larger than one life can staff.',
      path: 'Your long road builds something structurally useful to more than yourself. Much of the craft is beginning at a size you can actually sustain, even when the vision is enormous.',
      express: 'People meet a practical visionary in you: someone who can see the whole and still knows where the first brick goes.',
      persona: 'Strangers tend to read you as capable and serious, a person with large plans and the patience to carry them.',
      soul: 'What you privately want is to leave something standing that helps people long after you have finished building it.',
      year: 'This year asks for building at scale: long plans, practical steps, and patience with both.',
      month: 'These weeks favour the blueprint and the first solid step toward it.',
      day: 'Today rewards one concrete move toward the large thing.',
      pinnacle: 'This long stretch is for major work: building, organising, and leaving a structure behind.',
      challenge: 'What keeps returning is scale: starting at a size you can sustain rather than the size of the whole vision.',
      cycle: 'This season of life is about mastery made concrete, the plan finally given a body.',
      birthday: 'The day you were born carries a gift for turning large ideas into working form.',
      ask: 'What is the smallest true version of the large thing you want to build?',
      strengths: ['You may see both the vision and the scaffolding it needs.', 'You may sustain effort over years rather than weeks.', 'You may build something that outlives your involvement.'],
      challenges: ['You may delay starting until the plan is complete.', 'You may take on more load than any one person can carry.', 'You may measure yourself against the size of the vision.'],
      opportunities: ['There is room to ship one small piece of the large thing.', 'There is room to bring in people earlier than feels comfortable.', 'There is room to define done at a human scale.'],
      obstacles: ['Perfection standing in for progress.', 'A plan too large to explain, and so carried alone.', 'Rest deferred until the build is finished.'],
      stage: { young: 'Early on, 22 often shows up as ambition without a vehicle. You may have felt capable of more than you had access to.',
        middle: 'By mid-life, 22 tends to hand you the real project. You may notice the difference between vision and staffing.',
        mature: 'Later, 22 usually becomes stewardship. You may find you would rather hand over a working structure than hold the keys.' } },
    33: { name: 'the Teacher', essence: 'compassion made instructive',
      why: 'Thirty three is two threes, expression doubled, and its digits add to 6, the number of care. The tradition keeps it whole because it reads it as care that has learned to speak, the healer who teaches by the way they live.',
      universal: 'The 33 is a master number. It is care that teaches, compassion with a voice. Its gift is a healing presence, and its risk is a sense of responsibility with no edge to it at all.',
      path: 'Your long road cares in a way that teaches. A great deal of it is finding where your responsibility ends, so the care can keep going for a lifetime.',
      express: 'What people meet in you is nurturing wisdom: someone who helps, guides, and lifts without making a show of it.',
      persona: 'At first sight you tend to read as gentle and wise beyond your years, someone people confide in quickly.',
      soul: 'Privately you want to ease suffering, and to see the people you love grow into themselves.',
      year: 'This year deepens service and care, and asks you to look after the one giving it.',
      month: 'These weeks favour teaching, healing, and gentle guidance offered where it is wanted.',
      day: 'Today is good for helping someone in a way that leaves them stronger.',
      pinnacle: 'Through this long stretch service and guidance become central, and so does learning to rest inside them.',
      challenge: 'What keeps returning is a boundary held inside compassion, so that your care stays sustainable.',
      cycle: 'This season of life is about compassionate service, and the wisdom of where it should end.',
      birthday: 'The day you were born carries a gift for comfort that also teaches.',
      ask: 'Where would your care do more good if it had a clearer edge?',
      strengths: ['You may make hard truths bearable to hear.', 'You may stay with someone who is not fixable yet.', 'You may teach without condescension.'],
      challenges: ['You may take on the suffering as your own.', 'You may keep giving past your reserves.', 'You may find your own needs hardest to name.'],
      opportunities: ['There is room to set an hour that is yours and defend it.', 'There is room to teach rather than carry.', 'There is room to accept help without repaying it.'],
      obstacles: ['A boundary treated as unkindness.', 'Depletion normalised.', 'Worth measured in how much you absorb.'],
      stage: { young: 'Early on, 33 often shows up as being the one others come to. You may have been trusted with more than was fair.',
        middle: 'By mid-life, 33 tends to require a boundary you did not want to draw. You may notice what carrying everyone has cost.',
        mature: 'Later, 33 usually becomes teaching rather than rescuing. You may find you can hold the door without carrying the person through it.' } }
  };

  /* A position says what it is and why the tradition reads it that way, and
     then hands over to the number's own sentence for that seat. The "about"
     lines explain the seat, never the arithmetic: "No disclaimers" still
     holds, and how a figure is added is not part of the reading. */
  var MATURITY = {
    1: 'Later in life the wish to stand on your own grows louder, and the second half becomes a lesson in leading without waiting to be asked.',
    2: 'The second half of life leans toward partnership and quiet diplomacy, and its deepest satisfactions come through what is shared.',
    3: 'What ripens later is the urge to express: words, colour, sound, the joy of making something and letting it be seen.',
    4: 'Later years ask for structure that lasts, and their reward is building something solid enough to outlive the effort it took.',
    5: 'The later road keeps a door open, and freedom of movement turns from an escape into a way of staying awake to the world.',
    6: 'What grows later is a pull toward home and responsibility, a wish to be useful to the people within reach.',
    7: 'The second half turns inward, toward study, reflection and the questions that only show themselves in quiet.',
    8: 'Later life brings authority within reach, and the work becomes holding power, money and influence with a steady hand.',
    9: 'The later years widen the circle until it holds strangers, and giving without keeping score becomes the aim.',
    11: 'Later, intuition sharpens into something other people lean on, and the task is trusting a signal that cannot be proved.',
    22: 'The second half offers the chance to give a large vision practical form, built to serve many people at once.',
    33: 'What ripens late is a teacher\u2019s care, the wish to lift others simply because they happen to be near.'
  };
  var LESSON = {
    1: 'With no 1 in the name, standing up for your own view may not come easily, and taking the first step is a skill built by practice.',
    2: 'With no 2, patience and cooperation are learned along the way rather than handed over at the start.',
    3: 'With no 3, speaking up and letting yourself be seen can take courage, and expression grows by being used.',
    4: 'With no 4, order and steady routine may feel foreign, until structure starts to feel like a kind of freedom.',
    5: 'With no 5, change can feel like a threat, and saying yes to the unfamiliar now and then is where the growth sits.',
    6: 'With no 6, care for home and family may arrive before it feels comfortable, and it brings a warmth of its own.',
    7: 'With no 7, trust in your own inner life may need tending, and time alone becomes the teacher.',
    8: 'With no 8, money and authority can feel slippery, and handling them plainly is part of the road.',
    9: 'With no 9, letting go and seeing the larger picture may come slowly, and compassion keeps returning as the thing to practise.'
  };

  var POSITIONS = {
    lifePath: { label: 'Life Path', from: 'the whole birth date, reduced',
      about: 'The Life Path is drawn from the whole of the day you arrived, every part of it at once. That is why it is read as the widest of your numbers: the road itself, rather than any stop along it.',
      frame: function (n, d) { return d.path; } },
    expression: { label: 'Expression', from: 'every letter of the full birth name',
      about: 'Expression comes from every letter of the name you were given at birth. A name is how the world first calls to you, so the number it makes is read as the equipment you meet that world with.',
      frame: function (n, d) { return d.express; } },
    soulUrge: { label: 'Soul Urge', from: 'the vowels of the full birth name',
      about: 'Soul Urge listens only to the vowels of your birth name, the open, breathed sounds, the part of a name you could sing. The tradition hears in them what you want when nobody is watching.',
      frame: function (n, d) { return d.soul; } },
    personality: { label: 'Personality', from: 'the consonants of the full birth name',
      about: 'Personality takes the consonants of your birth name, the hard edges that give a sound its shape. It is read as the outline people catch before they know you at all.',
      frame: function (n, d) { return d.persona || d.express; } },
    birthday: { label: 'Birthday', from: 'the day of the month, reduced',
      about: 'The Birthday number is the day of the month you were born on, held by itself. It is the smallest of the birth numbers, and so it is read as one particular talent rather than a whole character.',
      frame: function (n, d) { return d.birthday; } },
    personalYear: { label: 'Personal Year', from: 'birth month and day added to the current year',
      about: 'Your Personal Year turns over once a year, on 1 January or on your birthday, and walks the nine in order. It reads as the weather of the twelve months ahead rather than anything fixed about you.',
      frame: function (n, d) { return d.year; } },
    personalMonth: { label: 'Personal Month', from: 'the Personal Year added to the calendar month',
      about: 'The Personal Month sits inside the year and narrows its weather down to a few weeks.',
      frame: function (n, d) { return d.month; } },
    personalDay: { label: 'Personal Day', from: 'the Personal Month added to today’s date',
      about: 'The Personal Day is the shortest of the cycles, and the easiest one to hold up against what actually happens.',
      frame: function (n, d) { return d.day; } },
    pinnacle: { label: 'Pinnacle', from: 'pairs of reduced birth-date components',
      about: 'A pinnacle covers a span of years, four of them across a life. It is read as the climate of a period rather than a trait, felt most strongly in its opening years.',
      frame: function (n, d) { return d.pinnacle; } },
    challenge: { label: 'Challenge', from: 'the differences between reduced birth-date components',
      about: 'A challenge measures a gap, the distance between one part of your birth date and another. Because it is a distance, the tradition reads it as what keeps asking to be crossed until it is.',
      frame: function (n, d) { return d.challenge; } },
    maturity: { label: 'Maturity', from: 'the Life Path joined to the Expression',
      about: 'Maturity joins the Life Path to the Expression, the road and the equipment you carry along it. The tradition reads it as an aim that stays quiet early on and comes forward somewhere in the thirties, growing as the years add up.',
      frame: function (n) { return MATURITY[n] || MATURITY[NC.reduce(n)]; } },
    karmicLesson: { label: 'Karmic Lesson', from: 'a digit no letter of the birth name carries',
      about: 'A Karmic Lesson is a number from one to nine that no letter of your birth name carries. The name did not bring that skill along, so life tends to keep offering it until it has been practised.',
      frame: function (n) { return LESSON[NC.reduce(n)]; } },
    cycle: { label: 'Period cycle', from: 'the reduced birth month, day, and year in turn',
      about: 'The three period cycles lay your birth month, day and year end to end across a life, as three long seasons: the formative, the productive and the harvest.',
      frame: function (n, d) { return d.cycle; } }
  };

  function art(v) { return /^(8|11|18|8\d)$/.test(String(v)) ? 'an' : 'a'; }
  function Art(v) { return art(v) === 'an' ? 'An' : 'A'; }

  var NC = {
    VERSION: '1.1.0',
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
        why: d.why || '', about: p.about || '', ask: d.ask || '',
        inPosition: T('TRADITIONAL', p.frame(value, d)),
        atStage: T('POSSIBILITY', stage),
        stageKicker: age == null ? 'Where you stand' : 'At ' + age + ', in ' + NC.stageLabel(age),
        isPinnacle: position === 'pinnacle',
        pinnacleNote: null,
        lists: { strengths: d.strengths, challenges: d.challenges, opportunities: d.opportunities, obstacles: d.obstacles }
      };
    },

    /* Expression / Soul Urge / Personality from a full birth name. Pythagorean. */
    LETTERS: { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9, S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8 },
    VOWELS: 'AEIOU',
    /* Two routes reach each name number, and the owner's rule of 19 October
       2026 is that a master met on either is the number: the whole name added
       letter by letter (the route this page has always shown), and each word
       reduced on its own and then added (the route InCommonCore takes).
       settle() in incommon-core.js decides, and `compounds` carries the double
       digit each number passed through, which number-matrix.js reads. */
    fromName: function (raw) {
      var words = String(raw || '').toUpperCase().replace(/[^A-Z\s\-']/g, ' ').split(/[\s\-']+/).filter(Boolean);
      var s = words.join('');
      if (!s) return null;
      var all = 0, vow = 0, con = 0, wAll = 0, wVow = 0, wCon = 0;
      words.forEach(function (w) {
        var a = 0, vo = 0, co = 0;
        for (var i = 0; i < w.length; i++) {
          var c = w.charAt(i), v = NC.LETTERS[c] || 0;
          a += v;
          if (NC.VOWELS.indexOf(c) !== -1) vo += v; else co += v;
        }
        all += a; vow += vo; con += co;
        wAll += NC.keep(a); wVow += NC.keep(vo); wCon += NC.keep(co);
      });
      var e = NC.settle([all, wAll]), su = NC.settle([vow, wVow]), pe = NC.settle([con, wCon]);
      /* Karmic Lessons: the digits from 1 to 9 that no letter of the name carries. */
      var seen = {}, lessons = [];
      for (var j = 0; j < s.length; j++) seen[NC.LETTERS[s.charAt(j)]] = 1;
      for (var dgt = 1; dgt <= 9; dgt++) if (!seen[dgt]) lessons.push(dgt);
      return { letters: s.length, expression: e.value, soulUrge: su.value, personality: pe.value,
        compounds: { expression: e.compound, soulUrge: su.compound, personality: pe.compound },
        karmic: { expression: e.karmic || [], soulUrge: su.karmic || [], personality: pe.karmic || [] },
        lessons: lessons, rawTotals: { all: all, vowels: vow, consonants: con } };
    },
    keep: function (t) { t = Math.abs(+t || 0); while (t > 9 && t !== 11 && t !== 22 && t !== 33) t = String(t).split('').reduce(function (x, c) { return x + +c; }, 0); return t; },
    /* settle() is the core's; this is only what the page falls back to when
       incommon-core.js is missing, and it keeps the masters the old way. */
    settle: function (routes) {
      var core = typeof window !== 'undefined' && window.InCommonCore;
      if (core && core.settle) return core.settle(routes);
      var t = routes[0] || 0;
      return { value: NC.keep(t), root: NC.reduce(t), compound: null, master: false };
    },

    /* [SYNTHESIS] paragraph. Assembled here from the numbers above, and tagged. */
    synthesis: function (o) {
      var lp = NC.content(o.lifePath), py = NC.content(o.personalYear), pd = NC.content(o.personalDay);
      var parts = ['The long road is your Life Path ' + o.lifePath + ', the number of ' + lp.essence + '.'];
      if (o.expression) parts.push('Expression ' + o.expression + ' is what you bring to that road, and Soul Urge ' + o.soulUrge + ' is what you quietly want from it.');
      parts.push('This stretch of the road is a Personal Year ' + o.personalYear + ', a year of ' + py.essence + ', and today narrows it to ' + art(o.personalDay) + ' ' + o.personalDay + ' day of ' + pd.essence + '.');
      if (o.pinnacle != null) parts.push('Beneath the year runs the pinnacle ' + o.pinnacle + ', and beneath that the challenge ' + o.challenge + '.');
      parts.push('Held together, ' + art(o.lifePath) + ' ' + o.lifePath + ' life is being asked, for now, to move in ' + art(o.personalYear) + ' ' + o.personalYear + ' way.');
      return parts.join(' ');
    },
    synthesisPossibility: function (o) {
      return 'The numbers lean on each other rather than taking turns. ' + Art(o.personalYear) + ' ' + o.personalYear + ' year inside ' + art(o.lifePath) + ' ' + o.lifePath +
        ' life can feel like being asked for something outside your habit, and that friction is where the year has the most to show you. ' +
        'A few notes kept across the year will say more about you than any meaning written here.';
    }
  };

  /* The words of numerology, A to Z, for the Book of Numbers' lexicon. Each
     was written from a page read on 7 November 2026; the pages are in
     docs/numbers-upgrade/01-lexicon-sources.md. The third field is where the
     word leads in the room: a category of the book, the reader's own numbers,
     or nothing. */
  var LEXICON = [
    ['Balance', "A number drawn from the initials of the birth name, the family name included. It is read for how a person steadies themselves when something knocks them off course.", 'mine'],
    ['Birthday', "The day of the month someone was born on. Some teach it whole, so the 29th stays 29; this book reads the double digit first and keeps its root beside it.", 'mine'],
    ['Chaldean chart', "An older table of letters that gives them the values 1 to 8 only. Nine is held back as a sacred number and appears only when a total reaches it.", ''],
    ['Capstone', "The last letter of the first name at birth, read for how a person tends to bring a thing to its finish.", ''],
    ['Challenge', "A number found in the distance between two parts of the birth date. There are four, each read as something that keeps asking to be crossed.", 'mine'],
    ['Cheiro', "The pen name of William John Warner, 1866 to 1936, the Irish palmist and numerologist. Among his books is Cheiro's Book of Numbers, and he said he learned Chaldean numerology in India.", ''],
    ['Compound number', "A number from 10 to 99, met on the way down to a single digit. This book reads the double digit first, because it is the number's own frequency, and its root after.", 'cat:all'],
    ['Cornerstone', "The first letter of the first name at birth, read for a person's first way of meeting life.", ''],
    ['Digital root', "What is left when the digits of a number are added again and again until one remains: 12345 becomes 15, then 6. Western numerology works with it, and lets 11, 22 and 33 stand.", ''],
    ['Expression', "Every letter of the full birth name turned into a number and added together. It is also called Destiny.", 'mine'],
    ['Gematria', "Reading a word as a number by giving each of its letters a value. The tradition is Hebrew in the first place, with Greek and English kin.", ''],
    ['Hidden Passion', "The digit that turns up most often among the letter values of the full birth name.", ''],
    ['Isopsephy', "The Greek practice of adding the letters of a word into one number, so that words with equal totals can be heard together. The name joins equal and pebble.", ''],
    ['Karmic Lessons', "The digits from 1 to 9 that no letter of the full birth name carries. Each is read as a skill the name did not bring along.", 'mine'],
    ['Karmic debt', "Four compounds, 13, 14, 16 and 19, read as a debt when a birth number passes through one of them. Met on a cycle, each is read as a season instead.", 'cat:karmic'],
    ['Life Path', "The whole birth date brought down: month, day and year each reduced, then added and reduced again, with 11, 22 and 33 kept.", 'mine'],
    ['Maturity', "The Life Path and the Expression added together and reduced. It is read as an aim that comes forward around the middle thirties.", 'mine'],
    ['Master number', "11, 22 and 33, the three numbers that are not reduced any further.", 'cat:master'],
    ['Period cycle', "Three long seasons of a life, drawn from the birth date. The first gives way somewhere between 25 and 33, the second between 52 and 60.", 'mine'],
    ['Personal Day', "The tone of a single day, the shortest of the personal cycles.", 'mine'],
    ['Personal Month', "A short cycle inside the Personal Year that turns with every month.", 'mine'],
    ['Personal Year', "The current year added to the birth month and day, then reduced. It turns over with the calendar year, or at the birthday in the older count.", 'mine'],
    ['Personality', "The consonants of the full birth name added together: the side others meet first.", 'mine'],
    ['Pinnacle', "Four long periods of a life, each with a number. The first runs from birth to somewhere between 27 and 35, the next two last nine years each, and the fourth runs on from there.", 'mine'],
    ['Pythagorean chart', "The usual table of letters: A to I are 1 to 9, J to R begin again at 1, and S to Z run from 1 to 8.", ''],
    ['Soul Urge', "The vowels of the full birth name added together. It is also called Heart's Desire.", 'mine'],
    ['Universal Year', "The calendar year alone, reduced to one digit. It is the same for everybody and turns every 1 January; each Personal Year is read inside it.", '']
  ];
  LEXICON.sort(function (a, b) { return a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }); });
  NC.LEXICON = LEXICON;

  window.NumerologyContent = NC;
})();
