/* dream-symbols.js. The archetypal reference behind the Dream Journal. V1.0.0

   WHAT THIS IS. A dream image read as a dream image. Jung's own method is the
   frame: the dream is a theatre in which the dreamer is scene, player, prompter,
   producer, author and critic at once, so every figure in it is first read on
   the subjective level, as an aspect of the person having it, before it is read
   as anything about the world.

   HOW EACH ENTRY IS WRITTEN. Three parts, kept apart here and kept apart on the
   page, the same shape animal-symbolism.js uses:

     meaning     what the depth psychological reading holds. A claim, attributed.
     origin      where that reading came from. A myth, a behaviour, a clinical
                 observation, always something that can be checked.
     possibility what it may be doing for the person who dreamt it. Never a
                 statement about them, always a question they can answer.

   The third part is the one that is easy to get wrong. "You are avoiding your
   anger" is a diagnosis this app is not entitled to make. "What were you running
   from, and had you seen it before?" is a question only the dreamer can close.

   THIS FILE AND animal-symbolism.js DISAGREE ON PURPOSE. A crow on the path and
   a crow in a dream are different events. The sighting file reads folklore about
   a real bird that a real person noticed; this file reads an image the psyche
   produced while nobody was watching. Where both name an animal, both readings
   are true of their own occasion. Do not merge them, and do not make one cite
   the other.

   CONFIDENCE IS NOT CERTAINTY. detect() returns a score built from how the word
   appeared, not from how much the reading applies. A high score means the word
   is really there. It never means the interpretation is right, and the page says
   so rather than implying otherwise.

   NO EM DASH AND NO EN DASH ANYWHERE IN THIS FILE, including in the content
   strings, which is a rule the whole project keeps and which a paste from
   research notes will break faster than anything else. */
(function () {
  'use strict';

  /* ---------- archetypes ----------
     [ display name, what it is, how it tends to arrive in a dream ] */
  var ARCH = {
    self: ['The Self', 'The centre of the whole psyche, conscious and unconscious together, which is larger than the ego and is not the same thing as it.',
      'Mandalas, circles, squared circles, anything fourfold, a divine or radiant child, a treasure that is guarded.'],
    shadow: ['The Shadow', 'Everything about a person that has been denied a place in the way they see themselves, which does not stop existing when it stops being admitted.',
      'A pursuer, a dark or faceless figure, an intruder, a sibling who is wrong somehow, an animal that means harm.'],
    anima: ['The Anima', 'The feminine principle in a man\'s psyche, carrying Eros: relatedness, feeling, and the capacity to be moved.',
      'An unknown woman who seems to know him, a figure by or in water, a guide who will not explain, moods that arrive from nowhere.'],
    animus: ['The Animus', 'The masculine principle in a woman\'s psyche, carrying Logos: structure, judgement, and the making of distinctions.',
      'A council or committee of men, a voice that pronounces sentence, an expert, a set of opinions delivered as fact.'],
    persona: ['The Persona', 'The face assembled for other people, which is necessary and becomes a problem only when it is mistaken for the whole person.',
      'Uniforms, costumes, masks, being on a stage, a role that cannot be put down, clothing that is wrong for the occasion.'],
    trickster: ['The Trickster', 'The figure who breaks the frame, cheats, and by cheating moves a situation that had stopped moving.',
      'A thief, a liar who is charming about it, a shape that will not stay one shape, a joke at the worst moment.'],
    great_mother: ['The Great Mother', 'The double face of origin: the one that nourishes and the one that will not let go, both at full strength.',
      'Caves, vessels, the sea, a house that is also a body, an enormous animal, a mother who is not quite the dreamer\'s mother.'],
    wise_old: ['The Wise Old One', 'Meaning that arrives from outside the ego, spoken by a figure who plainly did not learn it from the dreamer.',
      'An old man or woman, a hermit, a teacher, a talking animal, a book that opens at the right page.'],
    innocent: ['The Innocent', 'The self before it learned what to hide, which is why its arrival is so often embarrassing.',
      'Childhood places, nakedness in public, a child in danger, an animal that has not learned to be afraid.'],
    descent: ['The Descent', 'The going down, whether chosen or not, into what the daylight arrangement of a life leaves out.',
      'Falling, stairs going down, basements, wells, sinking, the ground giving way.'],
    transcendent: ['The Transcendent Function', 'What forms when two opposites are held together long enough that a third thing appears which was in neither of them.',
      'Flight, bridges, ladders, a way across that was not there before, a marriage of unlikely halves.'],
    transformation: ['Transformation', 'The change that costs the old form. Not improvement, which keeps the shape and adds to it.',
      'Shedding, moulting, fire, dissolving, cooking, a chrysalis, a body that becomes another body.'],
    death_rebirth: ['Death and Rebirth', 'An ending that is doing the work of a beginning, which is why it so rarely feels like one at the time.',
      'Funerals, teeth coming loose, a house being demolished, drowning followed by breathing, a corpse that is not frightening.'],
    initiation: ['The Initiation', 'A test set by something other than the person taking it, measuring readiness rather than knowledge.',
      'Examinations, trials, a gate with a keeper, a task that must be done alone, a journey with a condition attached.'],
    unconscious: ['The Unconscious', 'What the psyche knows and has not told the ego, which includes the personal and reaches past it.',
      'Deep or dark water, night, the sea floor, cellars, forests, anything below or behind.'],
    instinct: ['Instinct', 'The body\'s own knowing, older than the ego and indifferent to its plans.',
      'Horses, herds, running, hunger, heat, an animal that is not hostile and is not tame either.'],
    fate: ['Fate', 'The pattern a life is inside of, which can be read as a trap or as a design depending on where the dreamer is standing.',
      'Webs, threads, looms, roads that only go one way, a game whose rules were set before arrival.'],
    healing: ['Healing', 'The repair that the psyche attempts on its own, which is often what a distressing dream turns out to have been doing.',
      'Medicine, a wound that is tended, a physician, a spring, an animal that carries the cure and the poison at once.'],
    introspection: ['Introspection', 'A withdrawal that is doing work. Distinguished from avoidance by what comes back out of it, which is why it can only be judged later.',
      'Hibernation, a closed room entered willingly, winter, a long sleep, a retreat with a door that opens from the inside.']
  };

  /* ---------- the bestiary ----------
     [ display, aliases, archetypes, meaning, origin, possibility ] */
  var ANIMALS = {
    dragon: ['Dragon', ['dragons', 'wyrm'], ['great_mother', 'shadow'],
      'Read as primordial chaos and as the unconscious at full size, the mother complex in the form that has to be met rather than escaped. The fight with it is the standard image for winning consciousness, and the standard warning is that the hoard is always guarded.',
      'The dragon guards treasure in Germanic, Greek and Chinese sources alike, and in every one of them the treasure is unreachable without the fight. Jung read the recurrence across cultures that had no contact as evidence the image was being produced rather than borrowed.',
      'A dragon is a large dream and worth writing out in full. What was it keeping you from, and did you want that thing before you saw what was sitting on it?'],
    snake: ['Snake', ['snakes', 'serpent', 'serpents', 'cobra', 'python', 'viper', 'rattlesnake'], ['transformation', 'healing'],
      'The most consistently double animal in the record: transformation through the shedding of a skin, healing, and the energy that rises up the spine in the yogic reading, set against concealment and a threat that is noticed late.',
      'Snakes leave a whole intact skin behind and walk away as themselves, which is the plainest available picture of change that costs the old form. The healing half comes from the rod of Asclepius, still on the side of ambulances.',
      'Snakes are common in dreams and rarely neutral. Where was it, and did you see it before it moved? The answer usually matters more than the animal.'],
    bear: ['Bear', ['bears', 'grizzly'], ['great_mother', 'introspection'],
      'The Great Mother in her strong form, and the hibernating animal that is read as a withdrawal doing work rather than avoiding it. Protective at close range and dangerous for the same reason.',
      'The bear stands upright, uses its hands, and mothers its young for years, which is why so many traditions treat it as a person of another kind. The hibernation reading follows the observable fact that the animal returns.',
      'Was the bear coming towards you or minding its own business? A bear that ignores the dreamer and a bear that has noticed them are not the same dream.'],
    wolf: ['Wolf', ['wolves'], ['shadow', 'instinct'],
      'Untamed instinct that has not agreed to be a dog, and the politics of a group: rank, exclusion, the one on the outside. A common carrier for the Shadow because it is the part of the dreamer that was never domesticated.',
      'Wolves live by a social order a person recognises immediately, and were the predator that competed with people most directly for the longest, which is why European folklore made them the outside of the village.',
      'Was it alone or in a pack, and which were you? The lone wolf and the wolf in the pack carry almost opposite readings.'],
    spider: ['Spider', ['spiders', 'tarantula', 'web'], ['fate', 'great_mother'],
      'The weaver, and therefore fate: a pattern spun out of the weaver\'s own body. Held as creative construction in one reading and as the devouring mother in the other, with the web as either the work or the trap.',
      'Arachne, Anansi and the Navajo Spider Woman are all weavers, and the Fates spin. The devouring half is straightforwardly entomological: in several species the female eats the male.',
      'Were you watching the web, caught in it, or making it? Those are three different dreams that share one animal.'],
    lion: ['Lion', ['lions', 'lioness'], ['self', 'instinct'],
      'Solar energy, sovereignty and courage, and in alchemical material the passion that has to be tamed before it can be royal rather than merely loud.',
      'The lion is a sun animal from Egypt through to European heraldry, and the green lion of the alchemists devours the sun, which is the image for an appetite strong enough to swallow the thing it wants to serve.',
      'A lion is rarely background. Did it have a keeper, a cage, or nothing at all between it and you?'],
    eagle: ['Eagle', ['eagles', 'hawk', 'falcon'], ['transcendent', 'wise_old'],
      'Spiritual aspiration and the view from height: the perspective that can see the whole shape of a thing because it is no longer standing inside it. The old warning attached is that height is also distance.',
      'Eagles were the bird of Zeus and of Rome and carried the soul upward in several traditions, all of which follow from a bird that hunts by seeing further than anything else alive.',
      'What could you see from up there, and was it a relief or a loss to be that far off the ground?'],
    horse: ['Horse', ['horses', 'mare', 'stallion', 'pony'], ['instinct'],
      'The libido in its forward moving form: the body\'s own energy, which carries the rider and does not belong to them. A horse that bolts and a horse that will not move are the two commonest versions and they read as opposites.',
      'The horse is the animal a person\'s power was literally borrowed from for several thousand years, which is why the language of it survives in horsepower and in being carried away.',
      'Were you riding it, leading it, or watching it run? And did it go where you wanted?'],
    fish: ['Fish', ['fishes', 'salmon', 'trout'], ['unconscious', 'self'],
      'Contents surfacing from depth. Something with its own life that was down there the whole time and has now come near enough to be seen, which is the standard image for a truth arriving from the emotional depths.',
      'The salmon of wisdom in Irish material and the fish as the early Christian sign both sit on the same observation: the fish comes up from where a person cannot see or breathe, carrying something.',
      'Did you catch it, lose it, or only see it? What surfaced in the week around this dream?'],
    cat: ['Cat', ['cats', 'kitten'], ['anima'],
      'Independence and intuition, and a frequent carrier of the Anima: a presence that is affectionate on its own terms and will not be summoned. The feminine principle in its unbiddable form rather than its nurturing one.',
      'Cats domesticated themselves by moving into grain stores, which is the reason they live with people and take no instruction. Egypt made this divine and medieval Europe made it suspicious, from the same trait.',
      'Did it come to you or leave? A cat that chooses the dreamer and a cat that walks out are the two halves of the same reading.'],
    dog: ['Dog', ['dogs', 'puppy', 'hound'], ['instinct'],
      'Loyalty and instinctual guidance, and in the older material the psychopomp: the animal that goes with a person into the underworld and knows the way when they do not.',
      'Anubis and Cerberus both keep the threshold of the dead, and the dog has been buried alongside people far longer than any other animal. The guiding reading is not metaphor first; dogs really do find the way home.',
      'Was it your dog, a dog you knew, or a stranger\'s? And was it leading you somewhere?'],
    butterfly: ['Butterfly', ['butterflies', 'moth', 'chrysalis'], ['transformation', 'death_rebirth'],
      'Transformation carried through to completion, and in Greek the same word as the soul. The image insists on the part people skip: the caterpillar does not improve, it dissolves first.',
      'Psyche means both butterfly and soul, and the Greeks drew her with wings. The dissolution is literal biology, and it is the reason the image keeps its force after it is explained.',
      'Was it flying, or still in the stage before? What in your life is in the part that looks like nothing is happening?'],
    owl: ['Owl', ['owls'], ['wise_old', 'unconscious'],
      'Sight in the dark: knowing that works where ordinary attention fails. Wisdom in the Greek reading, and an announcement of death in a good deal of folklore, which are less far apart than they look.',
      'The owl was Athena\'s bird and is on the drachma. Both readings come from the same fact, which is that it hunts at night in silence and is heard before it is seen.',
      'Did it look at you? What have you been able to see lately that you would rather not have.'],
    elephant: ['Elephant', ['elephants'], ['great_mother', 'wise_old'],
      'Memory that outlasts the occasion, and a strength that is foundational rather than aggressive: the thing a structure rests on. Ganesha places it at the start of undertakings, as the remover of obstacles.',
      'Elephants recognise individuals after decades, return to the bones of their dead, and are led by the oldest female, who is carrying the route to water. The memory reading is not folklore, it is observation.',
      'What was it doing, and was there room for it? An elephant in a space too small for it is one of the more specific images the psyche makes.'],
    fox: ['Fox', ['foxes', 'vixen'], ['trickster'],
      'Cunning and adaptability, and the Trickster: the intelligence that solves the problem by refusing its terms. Admired and not trusted, in most of the places it appears.',
      'Reynard in Europe and the kitsune in Japan are both shapeshifters who win by wit rather than force, built on an animal that thrives at the edge of human settlement by never being predictable.',
      'What did it do that you did not expect? Trickster dreams tend to be about a rule you had stopped noticing was a rule.'],
    whale: ['Whale', ['whales', 'leviathan', 'orca'], ['unconscious', 'great_mother'],
      'The collective unconscious at scale, and being swallowed by it: the night sea journey in which a person is taken down, held, and put back on a shore that is not the one they left.',
      'Jonah and the Polynesian and Inuit swallowing stories share a structure Jung called the night sea journey, and it is the same shape as the hero in the belly of the beast.',
      'Were you in the water with it, or in it? And what did the scale of it do to you.'],
    crocodile: ['Crocodile', ['crocodiles', 'alligator', 'gator'], ['shadow', 'instinct'],
      'The oldest part of the nervous system with nothing on top of it: appetite without deliberation, and danger that arrives from a surface that looked empty a moment before.',
      'Crocodilians predate the dinosaurs and hunt by stillness, which is why they read as ancient rather than merely dangerous. Sobek was both feared and asked for protection, in the same temple.',
      'Was the water clear or not, and did you know it was there? A thing seen late and a thing not seen at all are different dreams.']
  };

  /* ---------- what happens ----------
     The universal scenarios. These are the dreams that turn up in every
     collection anyone has ever made, across languages and centuries, which is
     the fact that makes them worth a table at all. Same six fields. */
  var ACTIONS = {
    falling: ['Falling', ['fell', 'fall', 'falling down', 'dropped'], ['descent'],
      'Loss of control, and in the compensatory reading a correction applied to an ego that had climbed higher than its footing. The descent is not the punishment; the height was the problem.',
      'The falling dream is near universal and often arrives at sleep onset, where it has a physiological partner in the hypnic jerk. The psychological reading sits on top of that rather than replacing it.',
      'Did you land? A fall that ends and a fall that does not are read differently, and most people remember which one theirs was.'],
    flying: ['Flying', ['flew', 'fly', 'floating', 'hovering', 'levitating'], ['transcendent'],
      'Freedom, ambition and spiritual ascent, and the oldest attached warning in the material: flight that cannot be controlled or landed is read as inflation rather than as liberation.',
      'Icarus is the warning in its compact form, and the alchemical texts repeat it as the sublimation that has to come back down or the work is lost.',
      'Could you steer, and could you get down? A flight the dreamer directs and one that carries them are different dreams.'],
    chased: ['Being Chased', ['chased', 'chasing', 'pursued', 'running away', 'being followed', 'followed'], ['shadow'],
      'The most reliable Shadow dream there is. Something the dreamer will not turn towards keeps arriving anyway, and the chase continues as long as the running does.',
      'Jung\'s observation, repeated across the case material, is that the pursuer changes character the moment it is faced, which is why the recurring version so often stops recurring after one dream in which the dreamer turns around.',
      'What was chasing you, and had you seen it before? If you did turn, what happened. If you did not, what did you think would.'],
    teeth: ['Losing Teeth', ['teeth', 'tooth', 'lost teeth', 'teeth falling out', 'teeth crumbling'], ['death_rebirth', 'persona'],
      'Vulnerability and a loss of power, and specifically a decay in the face presented to other people, since teeth are the part of the skeleton that shows. Read as a transitional phase rather than a loss on its own.',
      'It is one of the most frequently reported dream types worldwide, and the association with periods of change rather than with dentistry is consistent enough across collections to be the thing worth reporting.',
      'Was anyone there to see it happen? The presence of an audience is usually the part that carries the feeling.'],
    naked: ['Public Nudity', ['naked', 'nude', 'undressed', 'no clothes', 'exposed'], ['innocent', 'persona'],
      'Exposure and the fear of judgement, and on the other side of the same image the stripping away of a social mask, which is why the dream is so often humiliating and a relief at once.',
      'The pairing is old: the innocent unclothed state before the fall, and the recurring anxiety dream in which only the dreamer has noticed. Both are in the record from the earliest collections.',
      'Did anyone else notice? A nakedness nobody remarks on is one of the more interesting versions and is easy to forget by morning.'],
    exam: ['The Examination', ['exam', 'test', 'examination', 'unprepared', 'final', 'failed the test'], ['initiation'],
      'Self doubt and unpreparedness, usually attached to a transition rather than to anything academic. The examiner is internal, which is why the dream persists decades after the last real exam.',
      'The version reported most often is by people who long ago passed the exam they are dreaming about, which is the detail that rules out simple memory and points at the initiation reading.',
      'What were you being tested on, and who set it? The subject is often not the one the dream named.'],
    unfamiliar_house: ['The Unfamiliar Room', ['unfamiliar house', 'new room', 'rooms i had not seen', 'extra room', 'strange house', 'discovered a room'], ['self', 'unconscious'],
      'Finding rooms in a house the dreamer thought they knew: territory of their own that had not been entered, described as the foreign departments of the intrapsychic world.',
      'Jung used his own dream of a house whose lower floors were older than its upper ones as the working image for the layered psyche, and the discovered room is the domestic form of it.',
      'What was in the room, and how did you feel about finding it? Neglect, delight and dread are all common and they are not the same reading.'],
    drowning: ['Drowning', ['drowned', 'drowning', 'sinking', 'underwater', 'could not breathe'], ['unconscious', 'descent'],
      'Being overtaken by what the water stands for, which is feeling. Distinguished from swimming by consent: the dreamer is in it either way, and only one of them chose.',
      'The night sea journey again, at its worst point. In the myth it is survivable and it is not pleasant, and the material is consistent that the going under is part of the passage rather than the end of it.',
      'What was the water like, and was there a surface? Write down what you were feeling in the days before.'],
    hiding: ['Hiding', ['hid', 'hiding', 'concealed', 'crouched', 'trying not to be seen'], ['shadow', 'persona'],
      'Something must not be found, and in a dream the hider and the sought are usually both the dreamer, which is what makes the image worth writing down rather than only feeling.',
      'The paired dream is the search, and collections tend to find them alternating in the same person over a period, which is the argument for reading them as one image with two positions.',
      'What were you hiding from, and what would have happened if it found you? Those two answers are often not consistent with each other.'],
    searching: ['Searching', ['searching', 'looking for', 'lost something', 'cannot find', 'trying to find'], ['self'],
      'The looking itself, more than the object. In the depth reading a search dream is the ego\'s side of a process the rest of the psyche has already started.',
      'The object is characteristically vague or changes on the way, which is the detail that separates the search dream from an ordinary memory of having lost something.',
      'What were you looking for, and would you have recognised it? Did anyone tell you where to look.'],
    late: ['Being Late', ['late', 'missed the train', 'missed the flight', 'running out of time', 'too late'], ['initiation'],
      'A schedule set by something other than the dreamer that they are failing to meet. Read as pressure with an external face on it, and worth asking whose schedule it actually was.',
      'The transport version is modern and the structure is not: the appointment that cannot be reached in time is in medieval and classical dream material with different vehicles.',
      'What were you late for, and who was waiting? And was the deadline yours.'],
    fighting: ['Fighting', ['fight', 'fighting', 'attacked', 'struggling', 'wrestling'], ['shadow'],
      'A conflict in the open, which in the subjective reading is a conflict between two parts of one person. The opponent is worth describing in detail for that reason.',
      'Jacob wrestles all night and is renamed and injured by it, which is the template the material keeps returning to: the fight is not won or lost so much as survived and paid for.',
      'Who were you fighting, and what did they look like? Did it end.'],
    climbing: ['Climbing', ['climb', 'climbing', 'ascending', 'stairs up', 'going up'], ['transcendent', 'initiation'],
      'Effortful ascent, distinguished from flying by the cost. The ladder and the staircase are the two commonest forms and both imply that the steps have an order that cannot be skipped.',
      'Jacob\'s ladder and the alchemical scala are the same figure, and in both the traffic goes in both directions, which is the part usually forgotten.',
      'What were you climbing towards, and could you see it from where you started?'],
    birth: ['Birth', ['born', 'birth', 'gave birth', 'baby was born', 'pregnant'], ['self', 'transformation'],
      'Something beginning that is not yet able to look after itself. In the Jungian material the divine child is one of the clearest Self images, and it always arrives vulnerable.',
      'The child who is both newborn and older than everything is a figure Jung traced across mythologies, and its defencelessness is structural rather than incidental.',
      'Whose was it, and what did you feel about being responsible for it?']
  };

  /* ---------- where it happens ---------- */
  var SETTINGS = {
    house: ['House', ['home', 'building', 'my house', 'the house'], ['self'],
      'The standard image for the whole person, with rooms as areas of a life. The building the dreamer lives in is the one they are.',
      'This is the most consistent architectural reading in the literature, and Jung\'s own house dream is where he dates the idea of the collective unconscious from.',
      'Whose house was it, and which rooms did you go into? Which ones did you avoid.'],
    basement: ['Basement', ['cellar', 'downstairs', 'under the house', 'crawl space'], ['unconscious', 'descent'],
      'The unconscious, in the most literal spatial form the psyche makes: the part of the structure that holds it up and is not lived in.',
      'The vertical arrangement is near universal in dream reports, with the lower storeys older and darker than the upper ones, which is the reading Jung built directly from his own dream.',
      'What was down there, and did you go all the way down? Was the light on.'],
    attic: ['Attic', ['loft', 'upstairs', 'top floor'], ['persona', 'wise_old'],
      'What has been put away rather than repressed: kept, known about, and not currently in use. Distinguished from the basement by the fact that the dreamer chose to store it.',
      'The attic is where inherited things sit in the domestic image, which is why it so often holds figures from a generation before the dreamer.',
      'What was up there, and had you put it there yourself?'],
    calm_water: ['Still Water', ['lake', 'calm water', 'pond', 'still water', 'pool'], ['unconscious'],
      'Emotional equilibrium, and a surface that can be seen into or reflected off. The two possibilities are the whole reading and the dream usually picks one.',
      'The reflecting pool is Narcissus, and the clear pool that can be seen through is a separate and much older image for depth that is not threatening.',
      'Could you see into it, or only see yourself? Was it deep.'],
    rough_water: ['Rough Water', ['waves', 'storm at sea', 'rough sea', 'flood', 'tsunami', 'turbulent water', 'stormy water'], ['unconscious'],
      'Emotional turmoil with a direction to it. The water is doing something to the dreamer rather than simply being there, which is what separates this from the sea below.',
      'The distinction between a body of water a person could cross and one they could not is old enough to be in the flood myths, which are the shared inheritance the scale reading rests on.',
      'Were you in it, on it, or watching from shore? And was it rising.'],
    /* The sea is its own entry rather than an alias of the rough one. A bare
       mention of the sea says nothing about whether it was calm, and filing it
       under Rough Water labelled "I could smell the sea" as turmoil, which is
       the detector putting a word in the dreamer's mouth. What the sea reliably
       carries is scale, so that is what this entry reads. */
    sea: ['The Sea', ['ocean', 'the ocean', 'seas', 'oceans'], ['unconscious', 'great_mother'],
      'The unconscious at a size that is plainly not personal: an expanse that was there before the dreamer and is not affected by them. Calm or violent is a second question, and the dream usually answers it separately.',
      'Every seafaring tradition treats the sea as something to be entered on terms it sets, and Jung took the night sea journey, the passage down and across and back, as one of the oldest shapes the psyche makes.',
      'Were you on it, in it, or looking at it? And was it moving.'],
    cemetery: ['Cemetery', ['graveyard', 'grave', 'tomb', 'burial ground'], ['death_rebirth'],
      'Endings, and the place where they are kept in order. Read as transition rather than as forecast, which is a distinction the app will not blur.',
      'The cemetery in dream material is more often a place of visiting than of dying, and the figures met there tend to talk, which is not how the dread reading would have it.',
      'Whose grave was it, and what was the weather? Did anyone speak.'],
    forest: ['Forest', ['woods', 'wood', 'trees', 'jungle'], ['unconscious'],
      'The unknown entered on foot. Dark, alive, and not hostile in itself, though every folk tale agrees it is easy to get lost in and hard to get instructions about.',
      'The selva oscura opens Dante and the forest opens most European tales, always at the point where the ordinary path has run out.',
      'Was there a path? What were you looking for in there, and did you come out.'],
    bridge: ['Bridge', ['crossing', 'bridges'], ['transcendent'],
      'A crossing between two states with the gap still visible underneath, which is what separates it from simply arriving somewhere else.',
      'The bridge as a test with a keeper is in Norse, Persian and Christian material, and in all of them the crossing is conditional on something about the person crossing.',
      'What was underneath, and did you get to the other side? Was anyone on the bridge with you.'],
    mountain: ['Mountain', ['hill', 'peak', 'summit', 'cliff'], ['self', 'transcendent'],
      'The obstacle and the vantage in one object, and in the older material the meeting place: the height a person goes to because the thing they need is not down here.',
      'Sinai, Olympus and Meru are all the same figure, which is a high place where the human and the more than human are close enough to talk.',
      'Were you going up, coming down, or looking at it? How far away was it.'],
    crossroads: ['Crossroads', ['fork in the road', 'junction', 'intersection', 'which way'], ['fate', 'trickster'],
      'A decision with the alternatives visible at once, which is rarer in waking life than in dreams and is part of why the image is so recognisable.',
      'Hecate is the goddess of the crossroads and Papa Legba keeps them, and in both cases the place is where a choice is watched by something that is not making it.',
      'How many ways were there, and did you choose? Was there anyone standing there.'],
    school: ['School', ['classroom', 'university', 'college', 'lecture hall'], ['initiation', 'persona'],
      'The institution that measures, revisited long after leaving it. The setting brings its own authority whether or not the dream has anything to do with learning.',
      'School settings persist in dream reports at high rates decades past the last attendance, and typically pair with the examination and the being late dreams rather than standing alone.',
      'How old were you in it? And was anyone else the right age.'],
    church: ['Church', ['temple', 'cathedral', 'chapel', 'mosque', 'shrine'], ['self'],
      'A space built to hold something larger than the people in it, which is the definition rather than a claim about what is held.',
      'The temenos, the marked precinct, is Jung\'s term for the protected space in which a transformation can happen without leaking, and he took it from exactly this architecture.',
      'What were you doing in there, and was there anyone else? Did it belong to a tradition you know.'],
    road: ['Road', ['highway', 'path', 'street', 'track', 'lane'], ['fate'],
      'The route, and how much of it the dreamer chose. A road runs where it was laid, which is the part of the image that carries the weight.',
      'The journey as the shape of a life is the oldest structural metaphor there is, and dream roads characteristically have the wrong number of turnings for the place they claim to be.',
      'Where did it go, and had you been on it before? Were you driving.'],
    cave: ['Cave', ['cavern', 'tunnel', 'underground', 'burrow'], ['great_mother', 'unconscious'],
      'Enclosure that is both shelter and interment, entered rather than fallen into. The chamber the descent arrives at.',
      'The cave holds the oracle at Delphi and the first painted images anyone made, and the sequence of going in, staying, and coming back out is the same in both.',
      'Was it warm or cold, and did you want to be in there? Was there a way through, or only a way back.']
  };

  /* ---------- what is in it ---------- */
  var OBJECTS = {
    door: ['Door', ['doors', 'doorway', 'entrance', 'gate'], ['initiation'],
      'A threshold with a state attached: open, shut, locked, or one the dreamer cannot get back through. The state is the whole content of the image.',
      'Janus faces both ways at the doorway and every threshold rite in the anthropological record treats the crossing itself as the dangerous part, not the rooms on either side.',
      'Was it open, and which side were you on? Could you go back.'],
    key: ['Key', ['keys', 'unlock', 'locked'], ['self'],
      'Access held in the hand, and therefore the question of whether the dreamer has what the situation requires. A key without its lock is as common in dreams as a lock without its key.',
      'The keys of the kingdom and the keys of Hecate are the same object doing the same job, which is deciding who passes.',
      'Did it fit? And if it did not, whose key was it.'],
    mirror: ['Mirror', ['mirrors', 'reflection', 'my reflection'], ['shadow', 'persona'],
      'Self examination with the reliability of the image in question. What the dream does to the reflection is the reading, and it very often does something.',
      'The mirror that shows what is not there, or fails to show what is, runs from Narcissus through the folk prohibitions on covering mirrors after a death.',
      'What did it show? Was it you, and was it the age you are.'],
    mask: ['Mask', ['masks', 'costume', 'disguise', 'uniform'], ['persona'],
      'The Persona as an object the dreamer can put down, which is exactly what makes it worth noticing: in waking life it is rarely that separable.',
      'Persona is the Latin word for the mask a stage actor spoke through, and Jung took the term without changing its meaning much.',
      'Whose face was on it, and could you take it off? Did anyone know it was a mask.'],
    book: ['Book', ['books', 'letter', 'writing', 'text', 'page'], ['wise_old'],
      'Meaning in a form that predates the dreamer and can be consulted. Whether it can be read is usually the point.',
      'The book that cannot be read, or that is in a language the dreamer does not know and understands anyway, is one of the more reported dream objects and both versions are old.',
      'Could you read it? What was it about, and who wrote it.'],
    fire: ['Fire', ['flames', 'burning', 'burned', 'blaze'], ['transformation'],
      'Transformation that consumes, and the double reading that goes with it: purification and destruction are the same process seen from different distances.',
      'The alchemical calcinatio is a burning that is meant to happen, and the material is emphatic that the operation cannot be skipped or done gently.',
      'What was burning, and were you the one who lit it? Was it contained.'],
    tree: ['Tree', ['trees', 'oak', 'roots', 'branches'], ['self'],
      'Growth with the below and the above joined in one living thing, which is why Jung took it as one of the steadiest Self images there is.',
      'Yggdrasil, the Bodhi tree and the tree in Eden are the same figure standing at the centre of a world, and the alchemical arbor philosophica is the same image again.',
      'What kind of tree, and what condition was it in? Could you see the roots.'],
    egg: ['Egg', ['eggs'], ['self', 'transformation'],
      'Potential still sealed. Contains everything it will be and none of it yet, which makes it the standard image for a thing that must not be opened early.',
      'The cosmic egg opens Orphic, Vedic and Finnish creation accounts, and the alchemical vessel is drawn as an egg for the same reason.',
      'Was it whole? What did you expect was inside.'],
    clock: ['Clock', ['watch', 'time', 'hands of the clock'], ['fate'],
      'Time as a measured and external thing. Dream clocks are characteristically unreliable, and the unreliability is the content rather than a flaw in the dream.',
      'Numerals that will not resolve, hands that move wrongly, and the inability to read a dial are among the most consistently reported dream distortions.',
      'What did it say, and could you read it? Was it running.'],
    car: ['Car', ['vehicle', 'driving', 'truck', 'bus'], ['persona', 'instinct'],
      'The means of getting through the world, and the question of who is driving it. Brakes that do not work are the single most reported version.',
      'The vehicle inherits the horse\'s position in the older material, and the dreams have the same structure: carried, or in control, and rarely both.',
      'Who was driving? Where were you going, and did the controls work.'],
    money: ['Money', ['coins', 'cash', 'wallet', 'payment', 'paying'], ['self'],
      'Value in a transferable form. In the depth reading it stands for energy that can be spent somewhere rather than for finance, and losing it is the commonest version.',
      'The coin for the ferryman is payment for a passage that cannot be made without it, which is the oldest form of the image and still the clearest.',
      'Was it yours, and what were you going to do with it? Did you lose it or spend it.'],
    stairs: ['Stairs', ['staircase', 'steps', 'stairway'], ['descent', 'transcendent'],
      'Movement between levels with the intermediate steps insisted upon. Direction matters more than the object: the same staircase means different things going each way.',
      'The scala and the ladder are one figure in the alchemical and Biblical material, where the traffic runs both ways and neither direction is the good one.',
      'Up or down, and did you get to the end? What was at the other level.']
  };

  /* ---------- who is in it ----------
     Dream figures are read on the subjective level first: a person in a dream
     is an aspect of the dreamer before they are anything about the person they
     resemble. That is Jung's own instruction and it is the reason this app will
     never tell someone what a dream says about somebody else. */
  var PEOPLE = {
    stranger: ['A Stranger', ['unknown person', 'someone i did not know', 'a man i did not recognise', 'a woman i did not recognise', 'faceless'], ['shadow'],
      'An unrecognised figure of the dreamer\'s own sex is the classic Shadow presentation, and the same figure of the other sex is the classic Anima or Animus one.',
      'The rule of thumb comes from the case material rather than from theory, and Jung was clear it is a starting point for the association work rather than a conclusion.',
      'What did they want, and how did you feel about them before they did anything? That reaction is usually the most useful thing in the dream.'],
    pursuer: ['A Pursuer', ['the man chasing me', 'someone chasing me', 'attacker', 'intruder', 'shadowy figure', 'dark figure'], ['shadow'],
      'The Shadow with a direction. Distinguished from a stranger by the fact that it wants something and is not going to stop.',
      'The consistent report is that the figure is unclear until it is faced and specific afterwards, which is the observation the whole Shadow method is built on.',
      'Could you see it? What would have happened if you had stopped.'],
    mother: ['A Mother Figure', ['my mother', 'mother', 'mum', 'mom', 'grandmother'], ['great_mother'],
      'The mother in a dream is rarely only the dreamer\'s mother. The figure carries the whole double archetype and the personal woman at once, and separating them is most of the work.',
      'Jung\'s distinction between the personal mother and the mother imago is the foundation of the complex, and he insisted the two get confused precisely because they arrive in the same shape.',
      'Was she as you know her? What was different about her, and when did you notice.'],
    father: ['A Father Figure', ['my father', 'father', 'dad', 'grandfather'], ['animus', 'wise_old'],
      'Authority, law, and the structure a person was handed. Like the mother figure, carrying both the individual and the archetype and easy to mistake for only the first.',
      'The father imago governs the relationship to authority generally, which is why the figure so often appears wearing an office rather than a face.',
      'What did he say, and did you agree with it? Whose voice was it really.'],
    child: ['A Child', ['baby', 'children', 'little girl', 'little boy', 'infant'], ['self', 'innocent'],
      'The divine child: something beginning, valuable and unable to defend itself. One of the clearest Self images and almost always in some degree of danger.',
      'Jung traced the child motif across mythologies and found the vulnerability structural: the figure is powerful and exposed in the same instant, and the exposure is not incidental.',
      'Whose child, and what was happening to them? Were you looking after them.'],
    dead: ['Someone Who Has Died', ['dead person', 'someone who died', 'deceased', 'my late'], ['death_rebirth', 'wise_old'],
      'A figure who arrives with the authority of having crossed something. In the dream record they are characteristically calm and often have something to say.',
      'The visitation dream is reported at high rates in bereavement and is described as categorically different from ordinary dreaming by the people who have them, which is worth recording rather than explaining away.',
      'What did they say or do? How did you feel when you woke, and was it the feeling you expected.'],
    crowd: ['A Crowd', ['crowd', 'audience', 'everyone', 'lots of people', 'group of people'], ['persona'],
      'The collective as an audience, which turns whatever else is happening into a performance. Nakedness, examinations and public failure nearly all need one.',
      'The anxiety dreams that require witnesses are a distinct family in every collection, and removing the audience changes the dream into something else entirely.',
      'Were they watching you? Did you know any of them.'],
    teacher: ['A Teacher or Guide', ['teacher', 'guide', 'old man', 'old woman', 'wise', 'mentor', 'professor'], ['wise_old'],
      'Meaning that arrives from somewhere the ego did not put it. The test is simple: the figure knows something the dreamer does not, and says it plainly.',
      'Jung called this figure the mana personality and warned about the other half of it, which is the temptation to identify with the one who knows.',
      'What were you told? Write down the exact words if you have them; they tend to go first.']
  };

  /* ---------- how many ----------
     Number in a dream is structural rather than decorative, which is the one
     claim in this file that reads as superstition and is not: the quaternity
     turns up in dream material at a rate that is the reason Jung took it
     seriously in the first place. */
  var NUMBERS = {
    one: ['One', ['1', 'a single', 'alone', 'only one'], ['self'],
      'Primordial unity, the source before anything divided from it. Also the state before the ego separated out, which is why it can read as wholeness or as not yet having begun.',
      'The Monad in the Pythagorean and Neoplatonic sequence is not the first number so much as the ground the numbers come from, and the alchemical unus mundus is the same idea returning.',
      'What was there only one of? And did that feel complete or lonely.'],
    two: ['Two', ['2', 'a pair', 'twins', 'both', 'two of them'], ['shadow'],
      'Separation and polarity, and the conflict that comes with them. Read as necessary rather than as a fault: the tension of opposites is the condition for anything moving.',
      'The Dyad is where division enters the Pythagorean sequence, and Jung\'s whole account of the transcendent function depends on the two being held rather than resolved early.',
      'What were the two things, and were they opposed? Did you have to choose between them.'],
    three: ['Three', ['3', 'three of them', 'triad', 'trio'], ['transformation'],
      'Movement and process. Dynamic and, in Jung\'s reading, characteristically unstable: it goes somewhere, and it leaves something out to do it.',
      'His argument with the Trinity is the source of this: a threeness that ascends by excluding a fourth, which then has to arrive from below.',
      'What was the third thing? And was something missing from the set.'],
    four: ['Four', ['4', 'four of them', 'quaternity', 'square', 'four corners'], ['self'],
      'Psychic totality. The quaternity stabilises the triad by taking back in what the three left out, which is why it is the Self image Jung returned to most often.',
      'Four directions, four elements, four functions, and the mandala. He collected the fourfold figure from dream material for years before he published a word about what he thought it meant.',
      'What were the four, and were they arranged? A square, a cross and a circle divided in four are all this image.']
  };

  /* ---------- emotional tone ----------
     A small lexicon rather than a model. It reports which feeling words the
     dreamer used, which is a fact about the text, and it never reports a
     feeling the dreamer did not write down. */
  var TONE = {
    fear: ['afraid', 'scared', 'terrified', 'terror', 'panic', 'panicked', 'fear', 'frightened', 'dread', 'horror', 'anxious', 'anxiety', 'nervous', 'trapped', 'helpless'],
    grief: ['sad', 'sadness', 'grief', 'grieving', 'crying', 'cried', 'wept', 'weeping', 'mourning', 'loss', 'lonely', 'ache', 'heartbroken'],
    anger: ['angry', 'anger', 'furious', 'rage', 'enraged', 'annoyed', 'frustrated', 'frustration', 'resentful', 'shouting', 'yelling'],
    shame: ['ashamed', 'shame', 'embarrassed', 'embarrassment', 'humiliated', 'exposed', 'guilty', 'guilt', 'caught'],
    awe: ['awe', 'vast', 'enormous', 'immense', 'sacred', 'holy', 'overwhelming', 'beautiful', 'radiant', 'glowing', 'luminous', 'infinite'],
    joy: ['happy', 'joy', 'joyful', 'delighted', 'delight', 'laughing', 'laughed', 'elated', 'free', 'freedom', 'light', 'warm', 'safe'],
    calm: ['calm', 'peaceful', 'peace', 'still', 'quiet', 'serene', 'settled', 'content', 'restful'],
    confusion: ['confused', 'confusing', 'lost', 'strange', 'odd', 'unclear', 'disoriented', 'maze', 'nonsense', 'shifting', 'blurry']
  };
  var TONE_LABEL = { fear: 'Fear', grief: 'Grief', anger: 'Anger', shame: 'Shame',
    awe: 'Awe', joy: 'Joy', calm: 'Calm', confusion: 'Confusion', none: 'Not stated' };

  /* Vividness markers. Jung's big dreams are remembered for a lifetime, and the
     reports of them are full of colour, light and specific sensation. That is a
     property of the text, so it can be counted honestly. */
  var VIVID = ['red', 'blue', 'green', 'gold', 'golden', 'white', 'black', 'silver', 'crimson', 'violet',
    'bright', 'dark', 'shining', 'glowing', 'colour', 'color', 'smell', 'smelled', 'scent', 'sound',
    'music', 'singing', 'cold', 'heat', 'warm', 'texture', 'taste', 'loud', 'silence', 'silent'];

  /* ---------- weather and the natural forces ----------

     THE GAP THIS FILLS. Someone dreamt of a tornado, the journal read every
     other image in the dream and had nothing at all for the one that was
     obviously the point. Weather is not decor in a dream: it is the mood of the
     whole scene made visible, and it is the one class of image the dreamer
     never chooses, which is exactly why the tradition reads it as what is
     happening TO them rather than what they are doing.

     A SEVENTH FIELD, and why. Every entry here carries variants: the same image
     seen from a distance, from inside, before, and after. A tornado watched
     from a porch and a tornado you are standing in are not the same dream, and
     an entry that gives one reading for both is the reason a symbol dictionary
     feels like a horoscope. Variants belong to the tradition layer, so the
     three part rule is unchanged: what the reading holds, where it came from,
     and a question only the dreamer can close. */
  var WEATHER = {
    tornado: ['Tornado', ['twister', 'cyclone', 'funnel cloud', 'whirlwind', 'tornadoes'], ['shadow', 'transformation'],
      'An overwhelming force with a narrow path. The distinguishing feature of the image is not its violence but its selectivity: a tornado destroys one house and leaves the next one standing, which is why the reading is rarely about general catastrophe and usually about one specific thing being torn out of a life while everything around it continues. It arrives with warning and without negotiation, and the dreamer is almost never its cause. Read as an emotional or situational pressure that has stopped being containable, and note that a funnel is a spiral, which the same tradition reads as transformation rather than only as destruction.',
      'Storm gods carry the oldest version of this: a power that is worshipped rather than fought, because fighting it is not one of the options. In the modern dream collections the tornado dream clusters around periods of anger the dreamer is not expressing directly and around situations governed by somebody else, and the recurring form very often stops when the situation is either left or named out loud.',
      'Where were you standing, and what were you trying to reach? A tornado dream usually has one object in it that the dreamer was running toward or could not get to, and that object tends to matter more than the storm.',
      [['Watched from a distance', 'Seen and not reached, this reads as a pressure being tracked rather than met. Notice whether you were warning anyone.'],
       ['Inside it', 'Being in the funnel rather than near it turns the image from a threat to a passage, which is the transformation reading rather than the destruction one.'],
       ['Sheltering from it', 'The cellar or the interior room shifts the dream to what the dreamer is protecting, and who is down there with them.'],
       ['More than one', 'Multiple funnels tend to arrive when the pressure is coming from several directions at once, and the dreamer often cannot decide which to watch.'],
       ['After it has passed', 'A dream that starts in the aftermath is a different image entirely: it is about what is still standing, not about the wind.']]],
    storm: ['Storm', ['thunderstorm', 'storming', 'thunder', 'tempest', 'gale', 'squall', 'storms'], ['shadow', 'transformation'],
      'Emotional weather that has broken. The tradition reads a storm as feeling that has built past the point where it could be held quietly, and treats it as clearing rather than as damage: a storm is a system reaching equilibrium loudly. The dream usually reports the approach more vividly than the storm itself, which is the part worth noticing.',
      'The storm as divine anger is one of the most widely distributed images there is, and Jung read it more specifically as affect breaking through a persona that had been holding too long. The clearing that follows is in the myth as often as the storm is.',
      'Were you out in it or watching it come? The distance between the dreamer and the weather is usually the whole reading.',
      [['Approaching', 'The sky changing while nothing has happened yet is the anticipation form, and it is the most common one.'],
       ['Caught in it', 'Being out in it without shelter tends to arrive when the feeling has already been unavoidable for a while.'],
       ['From indoors', 'Watching through glass is the containment version. Notice whether the glass held.']]],
    flood: ['Flood', ['flooding', 'flooded', 'floodwater', 'deluge', 'water rising', 'floods'], ['unconscious', 'death_rebirth'],
      'The unconscious arriving faster than it can be met. Water is the standing image for feeling and for what is not conscious, so a flood is not simply loss: it is that material entering the ordinary rooms of a life. The tradition is consistent that a flood clears as well as destroys, and that what it leaves behind is the reading.',
      'Every flood myth in the record carries the same double meaning, ending in survival and a new covenant rather than in the water. Jung took the rising water dream as one of the clearest signals that unconscious content was close to the surface.',
      'How high did it get, and what were you trying to save? What people reach for in a flood dream is usually the honest inventory.',
      [['Rising slowly', 'Slow water is the version that shows up during a long change rather than a sudden one.'],
       ['A wall of it', 'A wave or a sudden break tends to accompany news, an event, or something learned all at once.'],
       ['Clear water', 'Clean floodwater reads differently from muddy, and the dreamer usually remembers which it was.'],
       ['Standing after', 'Water that has stopped rising and simply sits is the stagnation form, and it asks a different question.']]],
    lightning: ['Lightning', ['lightning bolt', 'lightning strike', 'thunderbolt'], ['transcendent', 'transformation'],
      'Sudden illumination, and the tradition is unusually consistent that it is not gentle. Lightning is understanding that arrives entire, unasked for and possibly destructive, and it lights the whole landscape for exactly as long as it lasts. The image is knowledge and danger in one, which is why it belongs to sky gods rather than to teachers.',
      'The thunderbolt is the attribute of the highest god in a remarkable number of unrelated traditions, and the alchemical texts use it for the moment the work changes state. The Tower card carries the same reading in tarot: a structure emptied by a stroke from outside it.',
      'What did you see in the flash? A lightning dream usually shows the dreamer one thing very clearly, and that thing is the dream.',
      [['Striking something', 'A strike on a building or a tree points the reading at whatever was struck.'],
       ['Distant', 'Lightning without thunder is the version that arrives before a change rather than during one.'],
       ['Struck yourself', 'Rare, and read in the tradition as initiation rather than as injury. Notice what you could do afterwards.']]],
    fog: ['Fog', ['mist', 'haze', 'foggy', 'cannot see ahead'], ['unconscious', 'introspection'],
      'Not knowing, rendered as landscape. Fog does not hide one thing; it removes distance, so what is close is unusually vivid and nothing further can be planned for. The reading is a period in which the next step is visible and the direction is not, which is a different state from being lost and is worth separating from it.',
      'The mist that separates worlds is standard in the folklore of thresholds, and clinically the fog dream tends to accompany decisions that have not been made rather than ones that have gone wrong.',
      'Could you still move? People usually remember whether they kept walking in the fog or stopped, and that detail carries most of the reading.',
      [['Walking through it', 'Movement without visibility is the continuing form, and it is more hopeful than it feels.'],
       ['Lifting', 'Fog clearing during the dream tends to arrive near the end of an unresolved period.'],
       ['Something in it', 'A shape in the fog moves the dream toward the shadow reading rather than the not knowing one.']]],
    earthquake: ['Earthquake', ['quake', 'ground shaking', 'shaking', 'tremor', 'the ground moved'], ['death_rebirth', 'shadow'],
      'The ground itself proving unreliable. Every other threatening image in a dream still leaves the dreamer somewhere to stand; this one does not, which is why the tradition reserves it for foundational change rather than for ordinary difficulty. It reads as an assumption failing rather than an event happening.',
      'The image is old and specific in the record: not the destruction of a city but the loss of the thing under it. Modern collections associate it with periods when something the dreamer had considered settled turned out not to be.',
      'What was still standing when it stopped? An earthquake dream that includes the aftermath is answering its own question.',
      [['A single shock', 'One tremor tends to follow a specific piece of news.'],
       ['Repeated', 'Continuing tremors are the version that arrives during an unresolved period rather than after a resolved one.'],
       ['Cracks opening', 'Ground splitting adds the descent reading: something is being revealed underneath rather than only shaken.']]],
    fire_weather: ['Wildfire', ['wildfire', 'forest fire', 'the fire spread', 'burning field'], ['transformation', 'shadow'],
      'Transformation that does not ask permission. Fire in a dream is the classic image of change by destruction, and the wild form specifically adds that nobody set it and nobody is directing it. The tradition holds that what survives fire is what was actually rooted, which is why the reading turns on what was left rather than on what burned.',
      'Fire as purification runs through the alchemical literature as the calcinatio, the first operation, and the burn that precedes any change of state. The ecological fact that some seed only germinates after fire is a genuinely useful modern parallel and is often what makes the reading land.',
      'What burned, and what did not? The dreamer usually remembers one thing that survived, and that is where the dream is pointing.',
      [['Watching it approach', 'The anticipation version, and it usually names the thing the dreamer is afraid to lose.'],
       ['Escaping it', 'Movement changes the image to a passage rather than a loss.'],
       ['After the burn', 'A dream set in the black landscape afterwards is about what comes next, not about the fire.']]],
    snow: ['Snow', ['snowing', 'snowed', 'snowfall', 'blizzard', 'snowstorm'], ['introspection', 'death_rebirth'],
      'Stillness laid over everything, and the covering is the point: snow does not remove what is underneath, it makes it uniform and quiet and unusable for a while. The tradition reads it as a dormant period rather than an ending, with the specific note that what is under the snow is unchanged and will be found again.',
      'The winter of the year is the oldest calendar for this, and the alchemical texts have a corresponding phase in which the work is held rather than advanced. The blizzard form, where the dreamer cannot see or move, is read closer to the fog entry than to this one.',
      'Was it beautiful or was it a problem? Snow dreams split cleanly on that, and the dreamer always knows which theirs was.',
      [['Falling gently', 'The quiet form, usually a rest rather than a threat.'],
       ['Blizzard', 'When it takes visibility and movement, read it alongside fog and storm rather than as snow.'],
       ['Melting', 'Thaw is one of the more hopeful weather images there is, and it tends to arrive at the end of a held period.']]],
    wind: ['Wind', ['windy', 'gust', 'gale force', 'the wind picked up'], ['transcendent', 'fate'],
      'Spirit, in the most literal etymological sense the languages have: the same words carry breath, wind and spirit in Hebrew, Greek and Latin alike. Wind in a dream is an unseen force with visible effects, and the reading turns on whether it moved the dreamer along their direction or across it.',
      'The pneuma of the Greeks and the ruach of the Hebrew scriptures are the same word doing both jobs, which is not a coincidence anyone invented later. The wind that fills a sail and the wind that takes a roof are the same force read by its outcome.',
      'Which way was it pushing you? A wind at the back and a wind in the face are the two dreams, and they are not related.',
      [['At your back', 'The carried form. Notice whether you liked the direction.'],
       ['Against you', 'Resistance, and usually a specific one the dreamer can name on waking.'],
       ['Taking things away', 'Wind that scatters or removes moves the reading toward loss and toward what was not held down.']]],
    rain: ['Rain', ['raining', 'rained', 'downpour', 'rainfall', 'it was raining'], ['healing', 'unconscious'],
      'Relief and grief share this image, and the tradition does not try to separate them: rain is feeling that has finally arrived, and it is read as fertility more often than as sadness. The distinguishing detail is almost always whether the dreamer was sheltered from it.',
      'Rain-making rites and the association of rain with blessing are close to universal in agricultural cultures, and the tears reading is the modern layer on top rather than the original one. Both are in the material.',
      'Did you get wet, and did you mind? People remember the answer to the second one more clearly than they expect to.',
      [['Warm rain', 'The relief form, and often the end of a dry period in the dream and out of it.'],
       ['Cold or driving', 'Closer to the storm reading than to this one.'],
       ['Watching it from inside', 'Shelter changes the reading to what the dreamer is keeping themselves out of.']]],
    eclipse: ['Eclipse', ['solar eclipse', 'lunar eclipse', 'the sun went dark'], ['shadow', 'transformation'],
      'One light standing in front of another. The image is specifically not darkness: it is a temporary obscuring by something that is itself part of the system, which is why the tradition reads it as an aspect of the dreamer covering another aspect rather than as an external loss. It is dependable, it is brief, and it ends on schedule.',
      'Eclipses were the most reliably predicted frightening events in the ancient world, which is the interesting part: the record shows them read as omens and calculated in advance at the same time, by the same people.',
      'What was hidden, and did it come back? An eclipse dream that finishes is a different reading from one that stops while it is dark.',
      [['Solar', 'The conscious light covered. Usually read against something the dreamer would normally rely on.'],
       ['Lunar', 'The reflective light covered, which the tradition takes to the feeling and the inner world instead.'],
       ['Someone watching with you', 'Company changes the dream from an event to a shared one, and the companion is worth naming.']]],
    drought: ['Drought', ['dry land', 'no water', 'parched', 'the well was dry'], ['descent', 'introspection'],
      'The absence of the thing that usually flows. Where flood is too much feeling arriving at once, drought is the same axis at the other end: a period in which what nourished is simply not there. The tradition treats it as a phase with an end rather than as a verdict, and reads the search for water in the dream as the important part.',
      'The wasteland is the standing form of this in the Grail material, where the land is barren because a question has not been asked. That detail is worth keeping: the cure in the story is a question rather than an effort.',
      'Were you looking for water, and did you know where to look? The searching is usually more legible than the dryness.',
      [['Cracked ground', 'The visible form, and it tends to arrive late in a depleted period rather than early.'],
       ['A dry riverbed', 'Something that used to flow, which points the reading at what has stopped rather than what is missing.'],
       ['Finding water', 'A drought dream that ends at a spring or a well is one of the most hopeful images in the collection.']]],
    ice: ['Ice', ['frozen', 'iced over', 'frozen lake', 'icy'], ['introspection', 'shadow'],
      'Feeling held in place. Ice is water that has stopped moving, and the tradition reads it as emotion that is present, intact and currently unavailable, which is a different state from absence. The recurring question in the material is whether the ice was safe to walk on.',
      'The frozen lake is a standing image for the surface of the unconscious in the analytic literature, with the specific detail that what is under it is visible and unreachable. That combination is what makes it distinct from the fog and the flood.',
      'Did it hold your weight? A dream that includes a crack is answering a question the dreamer was already asking.',
      [['Walking on it', 'The risk form, and the dreamer usually knows exactly what they were crossing toward.'],
       ['Something visible underneath', 'This is the version that most often becomes recurring, and the thing underneath is the dream.'],
       ['Thawing', 'Read alongside melting snow: a held period ending.']]],
    heat: ['Heat', ['heatwave', 'sweltering', 'too hot', 'burning up'], ['instinct', 'shadow'],
      'Pressure without an event. Unlike storm or fire, heat has no moment in it: it is a condition that makes everything slower and shorter tempered, and the tradition reads it as accumulated irritation or desire that has not found a form. It is one of the few weather images that is read more physically than symbolically, and it is worth checking the room before the psyche.',
      'The humoral tradition put anger and heat in the same category and did so consistently for centuries, which is where the ordinary language of a hot temper still comes from. Modern sleep research is blunter: an overheated room produces vivid and unpleasant dreams reliably.',
      'Was anyone else uncomfortable, or only you? That answer decides which of the two readings applies.',
      [['Everyone affected', 'A shared condition in the dream tends to point outward, at a situation rather than a feeling.'],
       ['Only the dreamer', 'The private version, and closer to the anger reading.'],
       ['Seeking shade', 'What the dreamer moves toward is more informative than the heat itself.']]],
    hail: ['Hail', ['hailstones', 'hailstorm', 'ice falling'], ['shadow'],
      'Punishment weather, and the only common form in which water arrives hard. Hail is read as criticism or consequence coming from above and from outside, striking indiscriminately and stopping as abruptly as it began. It damages surfaces rather than foundations, which the tradition takes literally: the persona is what gets dented.',
      'Hail is a plague in the scriptural record and an omen in the agricultural one, and both readings share the sense of an unearned, arbitrary correction. The brevity is part of the traditional reading rather than an accident of the weather.',
      'What were you sheltering, or who? Hail dreams tend to have somebody being protected in them.',
      [['On a roof or a car', 'The noise version, where the dreamer is safe and cannot ignore it.'],
       ['Caught in the open', 'Direct exposure, and closer to the shame reading than to fear.']]],
    rainbow: ['Rainbow', ['rainbows', 'a rainbow appeared'], ['self', 'healing'],
      'The sign after. A rainbow only exists with rain and sun at once and from one particular position, which is why the tradition reads it as reconciliation rather than as good fortune: two conditions that were opposed producing something visible together. It arrives after the weather rather than instead of it.',
      'The covenant after the flood is the best known version and carries exactly this structure, a promise that appears only once the water has gone down. The bridge between worlds reading is independent and just as old, appearing in Norse and Japanese material without contact.',
      'What had just happened? A rainbow in a dream is nearly always the second half of something, and the first half is the part to write down.',
      [['After a storm', 'The reconciliation form, and the most common one.'],
       ['Unreachable', 'A rainbow being walked toward and not arrived at is read closer to longing than to promise.']]]
  };

  var CATS = { animal: ANIMALS, action: ACTIONS, setting: SETTINGS, object: OBJECTS, person: PEOPLE, number: NUMBERS, weather: WEATHER };
  var CAT_LABEL = { animal: 'Animal', action: 'What happened', setting: 'Where', object: 'Object', person: 'Who', number: 'Number', weather: 'Weather' };

  /* Punctuation becomes a pipe token rather than a space, because it is the only
     thing that tells the negation check where one clause stops. Without it, the
     "not" in "the light would not turn on. A snake was on the stairs" reaches
     forward into the next sentence and deletes the snake. */
  function norm(s) {
    return ' ' + String(s == null ? '' : s).toLowerCase()
      .replace(/[.,;:!?\n\r]+/g, ' | ')
      .replace(/[^a-z0-9| ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }
  function uid() {
    return 'ds' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  /* One index over every category. Each term carries the length of its phrase,
     because a two word phrase that matches is far better evidence than a single
     common word, and the confidence score has to be able to say so. */
  var TERMS = [];
  Object.keys(CATS).forEach(function (cat) {
    var G = CATS[cat];
    Object.keys(G).forEach(function (key) {
      var e = G[key];
      var forms = [e[0]].concat(e[1] || []);
      if (key.indexOf('_') < 0) forms.push(key);
      /* Deduped: the display name and the key are frequently the same string,
         and a term listed twice would count one occurrence twice. */
      var seenForm = {};
      forms.forEach(function (f) {
        var t = norm(f).trim();
        if (!t || seenForm[t]) return;
        seenForm[t] = 1;
        TERMS.push({ cat: cat, key: key, term: t, words: t.split(' ').length, primary: t === norm(e[0]).trim() });
      });
    });
  });
  /* Longest first, so "being chased" is consumed before "chased" can claim it. */
  TERMS.sort(function (a, b) { return b.term.length - a.term.length; });

  /* Words that turn a match into its own absence. A dream in which there was no
     water is not a water dream, and counting it as one is the kind of error that
     makes the whole feature untrustworthy. */
  var NEGATE = [' no ', ' not ', ' never ', ' without ', ' nothing ', ' neither '];
  function negatedBefore(hay, at) {
    var back = hay.slice(0, at), cut = back.lastIndexOf('|');
    if (cut >= 0) back = back.slice(cut + 1);
    /* Three words, inside the clause. Any wider and an unrelated "not" earlier
       in a long sentence starts deleting symbols that are plainly there. */
    var words = back.trim().split(' ').filter(Boolean);
    var tail = ' ' + words.slice(-3).join(' ') + ' ';
    for (var i = 0; i < NEGATE.length; i++) if (tail.indexOf(NEGATE[i]) >= 0) return true;
    return false;
  }

  function entryFor(cat, key) {
    var e = CATS[cat][key];
    return { key: key, cat: cat, category: cat, categoryLabel: CAT_LABEL[cat],
      symbol: e[0], name: e[0], archetypes: e[2].slice(),
      archetype: e[2][0] || null, archetypeLabel: (ARCH[e[2][0]] || [])[0] || null,
      universalMeaning: e[3], meaning: e[3], origin: e[4], possibility: e[5],
      /* The same image seen from a distance, from inside, before and after. It
         is part of the tradition layer, not a fourth claim: an entry that gives
         one reading for every version of an image is the reason a symbol
         dictionary reads like a horoscope. */
      variants: (e[6] || []).map(function (v) { return { label: v[0], text: v[1] }; }),
      hasVariants: !!(e[6] && e[6].length) };
  }

  var DS = {
    VERSION: '1.0.0',
    TAG: 'dream',
    ARCH: ARCH,
    CAT_LABEL: CAT_LABEL,
    TONE_LABEL: TONE_LABEL,
    counts: { weather: Object.keys(WEATHER).length,
      animal: Object.keys(ANIMALS).length, action: Object.keys(ACTIONS).length,
      setting: Object.keys(SETTINGS).length, object: Object.keys(OBJECTS).length,
      person: Object.keys(PEOPLE).length, number: Object.keys(NUMBERS).length },

    archetype: function (id) {
      var a = ARCH[id];
      return a ? { id: id, name: a[0], what: a[1], how: a[2] } : null;
    },
    archetypeIds: function () { return Object.keys(ARCH); },

    /* lookup by name or alias, for the palette and for a symbol the reader adds
       by hand. Returns the same shape detect() puts in its rows. */
    /* Everything in one category, in display order, for browsing rather than
       detecting. The library reads this; the journal reads detect(); both read
       the same table, so a symbol cannot say one thing in one place and
       something else in the other. */
    byCategory: function (cat) {
      if (!CATS[cat]) return [];
      return Object.keys(CATS[cat]).map(function (k) { return entryFor(cat, k); })
        .sort(function (a, b) { return a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0; });
    },
    /* A search over the same term index the detector walks, so what the library
       finds and what the journal finds cannot disagree. Matches a term that
       starts with the query as well as one that contains it, and puts the
       starts-with matches first, because someone typing "wat" means water. */
    search: function (raw, limit) {
      var q = norm(raw).trim();
      if (!q) return [];
      var seen = {}, starts = [], holds = [];
      TERMS.forEach(function (t) {
        var id = t.cat + ":" + t.key;
        if (seen[id]) return;
        var i = t.term.indexOf(q);
        if (i === 0) { seen[id] = 1; starts.push(entryFor(t.cat, t.key)); }
        else if (i > 0) { seen[id] = 1; holds.push(entryFor(t.cat, t.key)); }
      });
      var out = starts.concat(holds);
      return limit ? out.slice(0, limit) : out;
    },
    lookup: function (raw) {
      var q = norm(raw).trim();
      if (!q) return null;
      for (var i = 0; i < TERMS.length; i++) {
        if (TERMS[i].term === q) return entryFor(TERMS[i].cat, TERMS[i].key);
      }
      if (q.slice(-1) === 's') return this.lookup(q.slice(0, -1));
      return null;
    },

    /* ---------- the detector ----------
       Returns one row per symbol found, not one per occurrence, with the hit
       count carried on the row. Confidence answers "is this word really in the
       text", which is a question about the text. It does not answer "is this
       reading correct", which is a question nothing here can answer, and the
       screen says which of the two it is showing. */
    detect: function (text, opts) {
      opts = opts || {};
      var hay = norm(text), found = {}, order = [];
      if (hay.trim().length < 2) return [];
      /* One occurrence is one hit, however many of a symbol's terms cover it.
         "I was being chased" holds the phrase and the bare word and the key, and
         counting all three would treat one sentence as a drumbeat. TERMS is
         sorted longest first, so the phrase claims the span and the shorter
         forms inside it find it already taken. */
      var claim = function (row, at, len) {
        for (var i = 0; i < row.spans.length; i++) {
          var s = row.spans[i];
          if (at < s[1] && s[0] < at + len) return false;
        }
        row.spans.push([at, at + len]);
        return true;
      };
      TERMS.forEach(function (t) {
        var id = t.cat + ':' + t.key;
        var scan = function (needle, base) {
          var from = 0, at;
          while ((at = hay.indexOf(needle, from)) >= 0) {
            from = at + 1;
            var row = found[id];
            if (!row) {
              row = found[id] = entryFor(t.cat, t.key);
              row.id = uid(); row.hits = 0; row.negated = 0; row.best = 0; row.spans = [];
              row.source = 'detected'; row.confirmed = null; row.personalAssociation = '';
              order.push(id);
            }
            if (!claim(row, at, needle.length)) continue;
            if (negatedBefore(hay, at)) row.negated++;
            else { row.hits++; if (base > row.best) row.best = base; }
          }
        };
        /* Base: a multi word phrase is strong evidence, the entry's own name is
           good evidence, an alias is weaker, and a plural fallback weaker again. */
        scan(' ' + t.term + ' ', t.words > 1 ? 0.95 : t.primary ? 0.8 : 0.7);
        if (t.words === 1 && t.term.slice(-1) !== 's') scan(' ' + t.term + 's ', t.primary ? 0.8 : 0.7);
      });
      var rows = order.map(function (id) { return found[id]; })
        /* A symbol every one of whose mentions was a negation is not in the
           dream. "There was no water" leaves a row here with nothing in it. */
        .filter(function (r) { return r.hits > 0; })
        .map(function (r) {
          /* Repetition raises confidence that the word is doing work in the
             text, and it saturates fast: three mentions is not three times one. */
          var rep = Math.min(0.15, (r.hits - 1) * 0.06);
          r.confidence = Math.round(Math.min(1, r.best + rep) * 100) / 100;
          delete r.spans; /* internal to the scan, never stored on the entry */
          return r;
        });
      rows.sort(function (a, b) { return (b.confidence - a.confidence) || (b.hits - a.hits) || a.symbol.localeCompare(b.symbol); });
      var floor = opts.minConfidence == null ? 0.7 : opts.minConfidence;
      rows = rows.filter(function (r) { return r.confidence >= floor; });
      return opts.limit ? rows.slice(0, opts.limit) : rows;
    },

    /* Archetypes present in a set of detected rows, ranked by how many symbols
       carry them. This is the radar chart's data and the density measure. */
    archetypesIn: function (rows) {
      var seen = {};
      (rows || []).forEach(function (r) {
        if (r.confirmed === false) return;
        (r.archetypes || []).forEach(function (a) {
          if (!seen[a]) seen[a] = { id: a, name: (ARCH[a] || [])[0] || a, what: (ARCH[a] || [])[1] || '', count: 0, symbols: [] };
          seen[a].count++;
          if (seen[a].symbols.indexOf(r.symbol) < 0) seen[a].symbols.push(r.symbol);
        });
      });
      return Object.keys(seen).map(function (k) { return seen[k]; })
        .sort(function (a, b) { return (b.count - a.count) || a.name.localeCompare(b.name); });
    },

    /* ---------- emotional tone ---------- */
    tone: function (text) {
      var hay = norm(text), out = [], top = null;
      Object.keys(TONE).forEach(function (k) {
        var n = 0;
        TONE[k].forEach(function (w) {
          var needle = ' ' + w, from = 0, at;
          while ((at = hay.indexOf(needle, from)) >= 0) {
            var after = hay.charAt(at + needle.length);
            if (after === ' ' || after === 's' || after === 'd') n++;
            from = at + 1;
          }
        });
        if (n) out.push({ id: k, name: TONE_LABEL[k], count: n });
      });
      out.sort(function (a, b) { return b.count - a.count; });
      top = out.length ? out[0] : null;
      return { primary: top ? top.id : 'none', primaryName: top ? top.name : TONE_LABEL.none,
        all: out, stated: !!top,
        /* Intensity is how much of the writing is feeling words, capped. */
        intensity: Math.min(1, out.reduce(function (s, r) { return s + r.count; }, 0) / 8) };
    },

    /* ---------- the four acts ----------
       Exposition, development, peripateia, lysis. Sectioned by position in the
       narrative, which is what a structure with no parser can honestly claim to
       do: it is a proposal about where the turns are, offered for the dreamer to
       correct, and the form on the page is editable for that reason.

       Lysis is genuinely optional. Jung's own note is that a good many dreams
       break off without one, and a parser that always produces four parts would
       be inventing the resolution that the dream withheld. */
    structure: function (text) {
      var raw = String(text || '').trim();
      var parts = raw.split(/(?<=[.!?])\s+|\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
      var out = { exposition: '', development: '', peripateia: '', lysis: '', hasLysis: false, sentences: parts.length, proposed: true };
      if (!parts.length) return out;
      /* A dream that ends on waking, or breaks off, has no lysis. The ending is
         the cliffhanger, and saying so is more useful than padding a fourth act. */
      var tail = norm(parts[parts.length - 1]);
      var broke = /( woke | wake | awake | woke up | alarm | then it stopped | and then nothing | i do not remember | cant remember | cannot remember )/.test(tail);
      var acts = broke || parts.length < 4 ? 3 : 4;
      var per = Math.max(1, Math.floor(parts.length / acts));
      var cut = [];
      for (var i = 0; i < acts - 1; i++) cut.push(per * (i + 1));
      var seg = function (a, b) { return parts.slice(a, b).join(' '); };
      out.exposition = seg(0, cut[0]);
      out.development = seg(cut[0], cut[1]);
      if (acts === 4) {
        out.peripateia = seg(cut[1], cut[2]);
        out.lysis = seg(cut[2], parts.length);
        out.hasLysis = !!out.lysis;
      } else {
        out.peripateia = seg(cut[1], parts.length);
        out.lysis = '';
        out.hasLysis = false;
      }
      out.brokeOff = broke;
      return out;
    },

    /* ---------- the big dream ----------
       Jung: not all dreams are of equal importance, and the ones that are get
       remembered for a lifetime. Three countable things stand in for that, and
       the screen is careful to present the result as a suggestion to look
       again rather than as a grade. */
    bigDream: function (rows, text, entry) {
      entry = entry || {};
      var archs = this.archetypesIn(rows), t = this.tone(text);
      var density = Math.min(1, archs.length / 6);
      var vivid = 0, hay = norm(text);
      VIVID.forEach(function (w) { if (hay.indexOf(' ' + w) >= 0) vivid++; });
      var vividness = Math.min(1, vivid / 7);
      var lucid = (Number(entry.lucidityRating) || 0) / 5;
      var score = (density * 0.4) + (t.intensity * 0.3) + (vividness * 0.2) + (lucid * 0.1);
      var reasons = [];
      if (density >= 0.5) reasons.push(archs.length + ' archetypes are active in it at once');
      if (t.intensity >= 0.5) reasons.push('the feeling in it is written down heavily');
      if (vividness >= 0.5) reasons.push('it carries a lot of colour and sensation');
      if (entry.isRecurring) { score = Math.min(1, score + 0.1); reasons.push('you marked it as one that repeats'); }
      return { score: Math.round(score * 100) / 100, isBig: score >= 0.55,
        density: density, vividness: vividness, intensity: t.intensity, reasons: reasons };
    },

    /* ---------- the series ----------
       What repeats across dreams, which is the only thing a single dream cannot
       show. Takes the stored entries and returns symbols and archetypes seen
       more than once, with the dates they were seen on. */
    series: function (entries) {
      var sym = {}, arch = {}, tones = {}, n = 0;
      (entries || []).forEach(function (d) {
        n++;
        (d.symbols || []).forEach(function (s) {
          if (s.confirmed === false) return;
          var k = s.category + ':' + s.key;
          if (!sym[k]) sym[k] = { key: s.key, category: s.category, symbol: s.symbol, count: 0, dates: [] };
          sym[k].count++;
          if (sym[k].dates.indexOf(d.date) < 0) sym[k].dates.push(d.date);
          (s.archetypes || []).forEach(function (a) {
            if (!arch[a]) arch[a] = { id: a, name: (ARCH[a] || [])[0] || a, count: 0, dates: [] };
            arch[a].count++;
            if (arch[a].dates.indexOf(d.date) < 0) arch[a].dates.push(d.date);
          });
        });
        var tk = d.emotionalTone || 'none';
        tones[tk] = (tones[tk] || 0) + 1;
      });
      var list = function (o) {
        return Object.keys(o).map(function (k) { return o[k]; })
          .sort(function (a, b) { return (b.count - a.count) || String(a.name || a.symbol).localeCompare(String(b.name || b.symbol)); });
      };
      var symbols = list(sym), archetypes = list(arch);
      return { dreams: n, symbols: symbols, archetypes: archetypes,
        /* A theme has to appear in more than one dream to be a theme. One dream
           with a snake in it three times is a dream about a snake, not a series. */
        recurring: symbols.filter(function (s) { return s.dates.length > 1; }),
        standingArchetypes: archetypes.filter(function (a) { return a.dates.length > 1; }),
        tones: Object.keys(tones).map(function (k) { return { id: k, name: TONE_LABEL[k] || k, count: tones[k] }; })
          .sort(function (a, b) { return b.count - a.count; }) };
    },

    /* ---------- association prompts ----------
       Step two of the method: personal meaning before archetypal meaning. The
       app asks and does not answer, which is the whole of the discipline here. */
    associationPrompt: function (sym) {
      return 'What does ' + String(sym.symbol).toLowerCase() + ' mean to you, before anything anyone else says about it? ' +
        'Where have you met one, and who does it belong to in your life?';
    },
    /* Step five: something small and concrete, because an interpretation that
       stays in the head is the one most likely to be gone by evening. */
    ritualFor: function (archId) {
      var R = {
        shadow: 'Name one thing the figure in the dream did that you would not do. Write the sentence out. Leave it there.',
        self: 'Draw the shape you remember, however badly. The drawing is the point, not the quality of it.',
        anima: 'Write down the mood you woke in, without explaining it or arguing with it.',
        animus: 'Write the sentence that was pronounced, then write who else has said it to you.',
        persona: 'Name the room you were performing in. Then name one place this week where you were not.',
        descent: 'Say out loud what you have been holding up. One thing.',
        transcendent: 'Write the two things that will not fit together. Put them on the same page and stop there.',
        transformation: 'Name what would have to be given up. Do not decide anything about it today.',
        death_rebirth: 'Write what has ended, in the past tense, and date it.',
        initiation: 'Write the question you were being asked, in your own words.',
        unconscious: 'Sit for two minutes without your phone and see what surfaces. Write the first thing only.',
        instinct: 'Notice where the dream was in your body when you woke. Write that down before the story.',
        great_mother: 'Write who fed you and who would not let you go. They may be the same person.',
        wise_old: 'Write the exact words you were told. If you cannot, write what they were about.',
        innocent: 'Write one thing you liked before you learned what it was worth.',
        trickster: 'Name the rule that got broken. Ask whether it was still doing anything.',
        fate: 'Write the part of this you did not choose. Then write the part you did.'
      };
      return R[archId] || 'Write one sentence about the dream and leave it where you will see it tomorrow.';
    },

    journalTitle: function (title) { return String(title || 'Dream') + ''; }
  };

  window.DreamSymbols = DS;
})();
