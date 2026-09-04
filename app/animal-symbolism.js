/* animal-symbolism.js. Meanings for repeated animal sightings, the other half of
   the Synchronicities page. V1.0.0

   WHAT THIS IS AND IS NOT. Animal symbolism is not one tradition. It is many,
   and they disagree: a crow is a messenger in one place, an omen in another, and
   a bird that remembers your face in the third, which is the reading this file
   trusts most. So every entry is written in three parts that are kept apart on
   the page as well as in here:

     tradition  what the popular symbolic reading holds. A claim, quoted.
     origin     why the animal picked up that reading. Usually its behaviour,
                sometimes a myth, always something that can be checked.
     possibility what it may be doing for the person noticing. Never a
                statement about them.

   COVERAGE IS DELIBERATELY NARROW. These are the animals people actually report
   noticing, in North America and Europe, plus the few that carry so much
   symbolic weight that leaving them out would be strange. An animal that is not
   here returns null rather than a composed reading: numbers can be read from
   their digits because the practice itself does that, and an animal cannot be
   read from its letters. An unlisted sighting is still worth journalling, and
   the page says so instead of inventing a scripture for it.

   NO EM DASH ANYWHERE IN THIS FILE, including in the content strings. */
(function () {
  'use strict';

  /* [ display name, aliases, tradition, origin, possibility ] */
  var A = {
    crow: ['Crow', ['crows'],
      'Read as a messenger, and as a sign that something is being watched more closely than you realised. In most of the folklore it marks a change arriving rather than a harm.',
      'Crows recognise human faces, hold the memory for years, and pass their opinion of a person to their families. Much of the folklore is people noticing they were being remembered.',
      'Crows are common and loud, so noticing them often says as much about your attention that week as about the birds. Write down what you were watching for.'],
    raven: ['Raven', ['ravens'],
      'The raven is read as prophecy and as the keeper of what has not been said yet. Norse tradition gives Odin two of them, thought and memory.',
      'Ravens play, use tools, mimic speech and follow wolves and hunters to a kill. A bird that seems to know where the story is going tends to get written into it.',
      'A raven is uncommon enough that noticing one is usually a real event rather than frequency illusion. That makes it a better thing to date and record.'],
    cardinal: ['Cardinal', ['cardinals', 'red bird', 'redbird'],
      'In North America the cardinal is read as a visit from someone who has died, and as a reminder that you are not being forgotten.',
      'Cardinals are bright red against winter, do not migrate, and stay in pairs all year, so they appear at the coldest and most grief prone time of the year and appear to stay.',
      'The reading tends to arrive when someone is missed. That does not make it useless; it makes what you write beside it the important part.'],
    bluejay: ['Blue jay', ['blue jays', 'jay', 'jays'],
      'Read as a call to speak up, and as a warning about who is being loud on your behalf.',
      'Jays imitate hawk calls to clear a feeder, mob predators in groups, and steal from other birds. The tradition is describing a real habit of taking the room.',
      'Notice whether the jay showed up on a day you were deciding whether to say something. That is the version of this you can actually check.'],
    hawk: ['Hawk', ['hawks', 'red-tailed hawk', 'redtail'],
      'Read as perspective: the long view, the thing you can see from height that you cannot see from the road.',
      'A red tailed hawk hunts from a perch or a thermal and can see a mouse move from a hundred metres up. The symbol is the eyesight, more or less literally.',
      'Hawks sit on highway poles because that is where the mice are. Noticing them often begins the week you start driving somewhere new.'],
    eagle: ['Eagle', ['eagles', 'bald eagle'],
      'Read as sovereignty and clear sight, and in many traditions as a carrier between the human and the divine.',
      'Eagles are large, rare, and fly higher than anything else people watch, which is most of why empires kept putting them on standards.',
      'An eagle sighting is usually genuinely uncommon. Note where you were: the location tends to explain the frequency better than the meaning does.'],
    owl: ['Owl', ['owls', 'barred owl', 'barn owl'],
      'Read as knowing what is hidden, and in older European folklore as a death omen. Both readings are still in circulation and they do not sit comfortably together.',
      'Owls are silent in flight, hunt at night, and turn their heads further than seems possible. An animal that sees when you cannot gets treated as knowing what you do not.',
      'Owls are heard far more often than seen. If it was a call rather than a bird, write that down too: they are different events.'],
    hummingbird: ['Hummingbird', ['hummingbirds'],
      'Read as joy, and as a reminder that the small and quick is not the same as the unimportant.',
      'A hummingbird can hover, fly backwards and cross the Gulf of Mexico without stopping, at a body weight of about four grams. The symbolism is an accurate description of the bird.',
      'They come to feeders and to red flowers. If they have started appearing, check whether something in the garden changed before deciding what the visit means.'],
    robin: ['Robin', ['robins'],
      'Read as new growth and as the turn of a season, particularly the end of a long stretch of nothing.',
      'In North America robins appear on lawns as the ground thaws and worms come near the surface, so their arrival is a real signal about the year.',
      'Seeing the first robin of the year is a genuine seasonal marker. Later ones are mostly lawns.'],
    sparrow: ['Sparrow', ['sparrows'],
      'Read as the value of small and ordinary things, and as protection for the unremarkable.',
      'Sparrows live wherever people do, in numbers, and have done for as long as there have been settlements. The tradition is about the dignity of what is everywhere.',
      'The commonest bird in the street is the hardest to read as a sign. That is worth knowing before you read one.'],
    dove: ['Dove', ['doves', 'mourning dove'],
      'Read as peace, and as a message arriving gently rather than loudly.',
      'Doves carried messages for millennia because they navigate home reliably. The peace reading comes through the flood story and centuries of art after it.',
      'A mourning dove call is often mistaken for an owl. Note which one you actually heard, because you will want to know later.'],
    pigeon: ['Pigeon', ['pigeons', 'rock dove'],
      'Read as homing: the way back, and the value of being able to return.',
      'Pigeons navigate hundreds of miles home using magnetic and olfactory cues. They are the same species as the dove above, which is a useful thing to know about symbolism.',
      'A city pigeon is not a rarer bird than yesterday. If you have started noticing them, something about your attention changed first.'],
    heron: ['Heron', ['herons', 'great blue heron', 'egret'],
      'Read as patience and self possession: standing still on purpose while everything moves.',
      'A heron hunts by waiting motionless for minutes at a time and then striking once. The symbol is the hunting method.',
      'Herons appear near water on a schedule. If you started walking a new route by a river, that is the more likely explanation and still worth writing down.'],
    crane: ['Crane', ['cranes', 'sandhill crane'],
      'Read as longevity and fidelity, especially in East Asian tradition, where the crane carries a thousand years.',
      'Cranes mate for life, dance in courtship, and migrate in huge visible flocks with a call that carries for miles.',
      'A crane overhead in migration season is a calendar as much as a sign. Note the date; the date is the part that will mean something later.'],
    seagull: ['Gull', ['seagull', 'seagulls', 'gulls'],
      'Read as adaptability and as a reminder to stop carrying what you can set down.',
      'Gulls will eat anything, live anywhere, and have learned to follow ploughs, trawlers and chip shops. They are a study in opportunism.',
      'Gulls go where food is. If they have appeared, something nearby changed about the food, which is not less interesting than the symbol.'],
    swan: ['Swan', ['swans'],
      'Read as grace and as transformation, mostly through the story of the ugly duckling and the older myths under it.',
      'Swans are enormous, aggressive in defence of a nest, and pair for many years. The gentleness in the symbol is not in the bird.',
      'The gap between the swan in the symbol and the swan on the water is a useful thing to sit with.'],
    goose: ['Goose', ['geese', 'canada goose'],
      'Read as loyalty and as the discipline of a group: taking a turn at the front and then falling back.',
      'Geese fly in a V because the birds behind save energy in the vortex of the bird ahead, and they rotate the lead. The symbolism is aerodynamics.',
      'Geese overhead mark the season more reliably than they mark anything about you.'],
    duck: ['Duck', ['ducks', 'mallard'],
      'Read as staying steady on the surface while a good deal happens underneath.',
      'The image comes from the paddling, which the water hides. It is a metaphor people invented and then attributed to the duck.',
      'Worth asking whether you are the duck or the person watching one and assuming it is calm.'],
    woodpecker: ['Woodpecker', ['woodpeckers', 'flicker'],
      'Read as persistence, and as a signal to keep knocking on the thing you have been knocking on.',
      'A woodpecker drums both to find insects and to claim territory by sound. The persistence is real and it is mostly an advertisement.',
      'Drumming on a gutter is a territorial display, not a message. It is still the sound you noticed, and the day you noticed it counts.'],
    vulture: ['Vulture', ['vultures', 'turkey vulture', 'buzzard'],
      'Read as the end of something and the cleaning up after it. Rarely read as an omen of death itself in the traditions that live alongside them.',
      'Vultures find carrion by smell from a great distance and remove it from the landscape. Their whole existence is the aftermath, not the event.',
      'A circling vulture means a thermal or a carcass, not a warning. What it can honestly mark for you is that a thing has already ended.'],
    falcon: ['Falcon', ['falcons', 'peregrine', 'kestrel'],
      'Read as focus and decisive speed: knowing the moment and taking it without a second pass.',
      'A peregrine stoops at over 300 km/h and takes its prey in the air on the first attempt. The symbol is that dive.',
      'Falcons nest on tall buildings and bridges now. A sighting says something about the city as often as about the day.'],
    magpie: ['Magpie', ['magpies'],
      'Read by number in British tradition: one for sorrow, two for joy. Elsewhere read as a thief and a keeper of bright things.',
      'Magpies are corvids, as clever as crows, and were long believed to steal shiny objects, which experiments have mostly disproved.',
      'If you know the counting rhyme, you will count. Notice that the rhyme is doing the work and write what happened anyway.'],
    turkey: ['Wild turkey', ['turkeys', 'wild turkeys'],
      'Read as abundance and as the return of something that was nearly lost.',
      'Wild turkeys were almost extinct in North America by 1930 and are now in suburbs. The abundance reading is a conservation record.',
      'They are back in numbers, so a sighting is now an ordinary event in many places. Note where.'],

    deer: ['Deer', ['deers', 'doe', 'buck', 'white-tailed deer'],
      'Read as gentleness with alertness: the ability to be soft and watchful at the same time.',
      'Deer freeze, watch, and run. They are prey animals whose whole posture is attention, which is what the symbol is actually describing.',
      'Deer come out at dawn and dusk and into gardens in dry weather. If they have appeared, check the weather before checking yourself.'],
    fox: ['Fox', ['foxes'],
      'Read as cleverness and as knowing when to go around rather than through.',
      'Foxes hunt alone, adapt to cities, and get into things that are supposed to be closed. Every tradition that has them ends up calling them tricksters.',
      'Urban foxes are on a route and a schedule. Seeing one repeatedly is usually the same fox, which is its own kind of interesting.'],
    rabbit: ['Rabbit', ['rabbits', 'hare', 'bunny'],
      'Read as fertility, luck and quick decisions. In some traditions also as fear, and the cost of being ruled by it.',
      'Rabbits breed prodigiously and escape by speed and direction changes rather than by fighting. Both halves of the symbol come from the same animal.',
      'A rabbit at the edge of a lawn at dusk is a rabbit doing what rabbits do. What you were thinking about is the part worth keeping.'],
    squirrel: ['Squirrel', ['squirrels'],
      'Read as preparation and as the sensible storing of what you have, with a warning about hoarding past the point of use.',
      'Squirrels cache thousands of nuts and recover a good share of them by memory and smell. The ones they forget become trees.',
      'Squirrel activity peaks in autumn for reasons that have nothing to do with you. The reading still lands if you are the one deciding what to store.'],
    mouse: ['Mouse', ['mice'],
      'Read as attention to small detail, and as the thing that gets in through a gap you had not measured.',
      'Mice fit through openings the width of a pencil and live in the walls of an occupied house without being seen for months.',
      'A mouse indoors is a maintenance fact first. Read it after you have found the gap.'],
    rat: ['Rat', ['rats'],
      'Read as resourcefulness and survival, and in some traditions as a warning about what has been left out.',
      'Rats are neophobic, highly social, and thrive wherever food is not managed. Their reputation is mostly a description of human cities.',
      'A rat sighting is information about the block. Take the information first.'],
    raccoon: ['Raccoon', ['raccoons'],
      'Read as masks and dexterity: what is hidden, and what can be opened by hands that should not be able to open it.',
      'Raccoons have extraordinarily sensitive forepaws, solve latches, and remember the solution for years. The mask is a face marking that reduces glare.',
      'They are on a bin route. The symbol arrives with the rubbish schedule more often than with the moment.'],
    opossum: ['Opossum', ['possum', 'possums', 'opossums'],
      'Read as strategy over confrontation: playing dead, waiting, and leaving when it is safe.',
      'Playing dead in an opossum is an involuntary shock response, not a decision, which is worth knowing before treating it as a lesson in strategy.',
      'They are nocturnal and slow. Noticing one usually means you were out at an unusual hour, which may be the real event.'],
    skunk: ['Skunk', ['skunks'],
      'Read as reputation and boundaries: what you are known for keeping people at a distance with.',
      'A skunk gives warning first, stamping and raising its tail, and sprays only if the warning fails. The boundary reading is accurate.',
      'The smell carries for over a kilometre. If that is what you noticed, note it as a smell rather than a sighting.'],
    bat: ['Bat', ['bats'],
      'Read as rebirth and as navigating the dark by other means than sight.',
      'Bats find their way by echo, which is the closest thing in nature to seeing with sound. The rebirth reading comes from roosting in caves and emerging at dusk.',
      'Bats appear at dusk in insect season. A summer evening explains most of it, and the dark you are navigating may still be real.'],
    coyote: ['Coyote', ['coyotes'],
      'Read as the trickster: the lesson that arrives disguised as an inconvenience.',
      'Coyotes have expanded across a continent while being hunted the whole time, and they adapt faster than the efforts to remove them.',
      'Coyotes call at night and are heard more than seen. Note whether it was a sighting or a sound.'],
    wolf: ['Wolf', ['wolves'],
      'Read as loyalty inside a group, and as instinct that has not been argued out of itself.',
      'Wolf packs are usually a family: two parents and their young. The dominance stories come from unrelated captive animals and are mostly wrong.',
      'A wolf sighting is rare and location bound. If it was a large dog or a coyote, that is still worth writing down as what you saw.'],
    bear: ['Bear', ['bears', 'black bear'],
      'Read as strength held in reserve, and as the value of a season spent withdrawn.',
      'Bears den for months on stored fat and emerge lean, which is where the retreat and return reading comes from.',
      'Bears follow food. A sighting is a fact about the fruit and the bins before it is a fact about you.'],
    cat: ['Cat', ['cats', 'black cat'],
      'Read as independence and as seeing what is in the room that nobody named. A black cat is luck in Britain and Japan and bad luck elsewhere, which is a good demonstration of how these readings work.',
      'Cats see well in low light, hear an octave above us, and choose their people. The mystery is mostly better senses.',
      'The same cat probably lives nearby. Repeated sightings of a specific animal are usually a specific animal.'],
    dog: ['Dog', ['dogs'],
      'Read as loyalty, protection, and a reminder of who is actually on your side.',
      'Dogs have lived alongside people for at least fifteen thousand years and read human faces better than any other species. The loyalty reading is a real coevolution.',
      'A strange dog approaching is worth noting as an encounter. What you needed at that moment tends to be the entry worth writing.'],
    horse: ['Horse', ['horses'],
      'Read as freedom and drive, and in older traditions as the carrier between one world and the next.',
      'Horses carried people, armies and messages for four thousand years. Nearly every meaning attached to them is a memory of that.',
      'Horses appear where horses are kept. A sighting on an unfamiliar road is more interesting than one on a familiar one.'],
    cow: ['Cow', ['cows', 'cattle'],
      'Read as patience, abundance and being fed. Sacred in Hindu tradition, where the reading is care rather than production.',
      'Cattle made settled agriculture possible, which is why they end up in so many creation stories and in so many currencies.',
      'A field of cows is a landscape fact. If one made you stop, write down what you had been hurrying past.'],
    otter: ['Otter', ['otters'],
      'Read as play as a serious activity, and as trusting that there is enough.',
      'Otters play, use tools, and hold hands while sleeping so they do not drift apart. Very little of the symbolism here is an exaggeration.',
      'Otters are shy and location bound. Noticing one usually means you were still and quiet for long enough, which is itself the reading.'],
    beaver: ['Beaver', ['beavers'],
      'Read as building, and as the patience to change a landscape one piece at a time.',
      'Beavers change rivers. Their dams create wetlands that outlast them and support everything else that lives there.',
      'Beaver sign, chewed stumps and a dam, is easier to notice than the animal. Note which one you actually saw.'],
    chipmunk: ['Chipmunk', ['chipmunks'],
      'Read as busy small work and as the value of the store you keep out of sight.',
      'Chipmunks carry food in cheek pouches to underground larders and stay near them all season.',
      'They are territorial and stay in one small area, so the same one is likely appearing repeatedly.'],
    whale: ['Whale', ['whales'],
      'Read as deep memory and as the size of a thing you can only see part of.',
      'Whale song travels for hundreds of miles underwater and changes across a population over years, which is as close to culture as anything outside people.',
      'A whale sighting is an event with a date and a place. Record those before the meaning.'],
    dolphin: ['Dolphin', ['dolphins'],
      'Read as play, breath, and help arriving from an unexpected direction.',
      'Dolphins are voluntary breathers, name each other with signature whistles, and have been recorded helping other species. The rescue stories are not all folklore.',
      'They follow boats and food. Where you were is a large part of the explanation.'],
    seal: ['Seal', ['seals', 'sea lion'],
      'Read as curiosity and as the pull between two elements, land and water, in the selkie stories of Scotland and Ireland.',
      'Seals haul out to rest and watch people from the water with obvious curiosity, which is where the half human stories come from.',
      'Seals watch swimmers. Being looked at by one is a real encounter and worth a note of its own.'],

    snake: ['Snake', ['snakes', 'serpent'],
      'Read as shedding and renewal, and in older Mediterranean tradition as healing. Also read as danger, and both readings are ancient.',
      'Snakes shed their skin whole, periodically, and become briefly blind before they do. The renewal symbol is that literal process.',
      'A snake sighting comes with real feeling attached, usually fear. Write the feeling down separately from the meaning.'],
    turtle: ['Turtle', ['turtles', 'tortoise'],
      'Read as patience and carrying your own shelter. In several Indigenous North American traditions the continent rests on a turtle back.',
      'Turtles are long lived, slow, and carry their protection with them. The symbol needs no elaboration.',
      'Turtles cross roads to lay eggs in early summer. That is when you will notice them, and helping one across is a fine entry.'],
    lizard: ['Lizard', ['lizards', 'gecko'],
      'Read as regeneration and as letting go of what has been caught.',
      'Many lizards drop their tail to escape a grip and regrow it, though the new one is never quite the same.',
      'The version worth testing: what got caught, and what you left behind to get out.'],
    frog: ['Frog', ['frogs'],
      'Read as cleansing and change, and as the sound that means the rain has come.',
      'Frogs are permeable to their environment and vanish first when water is polluted, which makes them a genuine indicator of a place.',
      'Frogs call after rain. If you heard them, the weather is the honest first explanation.'],
    toad: ['Toad', ['toads'],
      'Read as what is buried and what comes up, and in European folklore as a companion to those who work with plants.',
      'Toads burrow and come out at night after rain, which is most of why they arrive at doorsteps unexpectedly.',
      'A toad at the door is a wet night. It is also a fine thing to have noticed.'],
    alligator: ['Alligator', ['alligators', 'crocodile'],
      'Read as ancient patience and as knowing exactly when to move.',
      'Alligators are older than most of what shares the swamp with them and can wait motionless for hours before a single strike.',
      'These are location bound sightings. The place explains the frequency, and the stillness may still be the lesson.'],

    butterfly: ['Butterfly', ['butterflies', 'monarch'],
      'Read as transformation, and in many traditions as a soul passing or visiting.',
      'A caterpillar dissolves almost entirely inside the chrysalis before it rebuilds. The metamorphosis is more total than the metaphor usually admits.',
      'Butterflies are seasonal and plant specific. If they have appeared, something is in flower.'],
    moth: ['Moth', ['moths'],
      'Read as being drawn toward a light, and the risk that comes with that. Sometimes read as a message from the dead in the same way as the butterfly.',
      'Moths navigate by keeping a constant angle to a distant light such as the moon. A nearby bulb turns that into a spiral. The tragedy in the symbol is a navigation error.',
      'A moth at a window is a lit room. Whether you are circling a light of your own is a separate question and a fair one.'],
    dragonfly: ['Dragonfly', ['dragonflies'],
      'Read as clarity arriving after a long unclear period, and as living lightly on the surface of things.',
      'A dragonfly spends most of its life underwater as a nymph and only weeks in the air. The reading follows the life cycle.',
      'Dragonflies are near water in warm months. The season carries most of the frequency.'],
    ladybug: ['Ladybug', ['ladybird', 'ladybugs', 'ladybirds'],
      'Read as luck arriving, and as a small good thing that should not be brushed off.',
      'The name is medieval: the beetle ate the aphids and the crop survived, and the credit went to Our Lady. The luck is agricultural.',
      'They come indoors in autumn to overwinter, in numbers. That is the likeliest reason one is on your wall.'],
    bee: ['Bee', ['bees', 'bumblebee', 'honeybee'],
      'Read as work that only makes sense as a group, and as sweetness earned rather than given.',
      'A honeybee colony is a single organism by most useful definitions, and a hive communicates distance and direction by dancing.',
      'Bees are on flowers. If they have started appearing, look at what is blooming before deciding what it means.'],
    wasp: ['Wasp', ['wasps', 'hornet'],
      'Read as boundaries defended without apology, and as productive aggression.',
      'Wasps are predators and pollinators both, and they get defensive near a nest in late summer when the colony is largest and the food is gone.',
      'Late summer is wasp season for reasons that are entirely about the colony. The boundary reading may still be the one you needed.'],
    ant: ['Ant', ['ants'],
      'Read as patience, cooperation and the strength of small repeated effort.',
      'An ant colony solves routing problems no individual ant understands, using chemical trails. The cooperation is real and it is not planned by anyone.',
      'Ants indoors are a trail to something. Follow the trail before you read the sign.'],
    spider: ['Spider', ['spiders'],
      'Read as making: the web you build, and the patience to wait in it. In West African and diaspora tradition Anansi is a spider and the keeper of stories.',
      'Orb weavers rebuild a web most nights, eating the old silk. The making is continuous, which is the part the symbol usually leaves out.',
      'Spiders come indoors in autumn looking for mates. If they have suddenly appeared, that is why.'],
    mantis: ['Praying mantis', ['mantis', 'mantid'],
      'Read as stillness and patience, and in some traditions as a sign to wait rather than act.',
      'A mantis holds absolutely still and strikes in a fraction of a second. The prayer posture is a hunting posture.',
      'They are large, rare enough to notice, and appear late in summer. A sighting is usually a real event.'],
    cricket: ['Cricket', ['crickets'],
      'Read as luck and as the sound of a house being lived in. Strongly lucky in Chinese tradition.',
      'Crickets chirp at a rate that rises with temperature, closely enough that you can read the air temperature from the count.',
      'A cricket indoors is a warm night and an open door. It is also, traditionally, good news.'],
    grasshopper: ['Grasshopper', ['grasshoppers', 'locust'],
      'Read as a leap taken forward, and as movement that cannot be made in small steps.',
      'Grasshoppers jump many times their body length using stored elastic energy in the leg. They also cannot easily go backwards.',
      'If a decision has been sitting still, this is the reading that will feel pointed. Note what it was.'],
    firefly: ['Firefly', ['fireflies', 'lightning bug'],
      'Read as brief light in the dark, and as hope that does not need to last long to count.',
      'Fireflies flash in species specific patterns to find each other. The light is nearly heatless and it is a conversation.',
      'They appear for a few weeks in early summer, in humid places. The season is short, which is part of why noticing them lands.'],
    beetle: ['Beetle', ['beetles', 'scarab'],
      'Read as renewal, especially through the Egyptian scarab, which rolled the sun across the sky.',
      'The scarab rolls a ball of dung and lays its egg inside, and the young emerge from it. The Egyptians read that as self creation.',
      'Beetles are a quarter of all known animal species. Specificity matters here more than in most entries.'],
    snail: ['Snail', ['snails', 'slug'],
      'Read as slowness as a method, and as carrying home with you.',
      'A snail moves on a single muscular foot over a layer of its own mucus and can cross broken glass without harm.',
      'Snails appear after rain. That is nearly always the whole of the frequency.'],
    worm: ['Worm', ['worms', 'earthworm'],
      'Read as unseen work that everything above ground depends on.',
      'Earthworms turn over the top layer of soil continuously. Darwin spent his last book on them and concluded that they had made most of the fertile land in England.',
      'They surface in rain. The reading holds anyway: most of what is working is not visible.'],
    cicada: ['Cicada', ['cicadas'],
      'Read as long patience and sudden loud arrival, and as a life that waits underground for years.',
      'Periodical cicadas spend thirteen or seventeen years underground and emerge together in one enormous brood. The prime numbers are thought to be a defence against predator cycles.',
      'An emergence year is a public event. If it is one, the sighting is a date rather than a sign.'],
    fish: ['Fish', ['fishes', 'koi'],
      'Read as abundance and as what moves below the surface. The koi that swims upstream and becomes a dragon is the persistence version.',
      'Koi were bred from carp for colour in nineteenth century Japan. The dragon story is older and Chinese, and it is about a waterfall.',
      'Note the setting. A fish in a pond, in a dream and on a plate are three different entries.'],
    shark: ['Shark', ['sharks'],
      'Read as forward motion and as a fear that is mostly larger than its cause.',
      'Sharks are older than trees. Some species must keep moving to breathe, which is where the forward motion reading comes from.',
      'If this arrived as an image rather than an animal, that is worth recording as what it was.'],
    peacock: ['Peacock', ['peacocks', 'peafowl'],
      'Read as display, pride, and the courage of being visible. In some traditions the eyes in the tail are watchfulness.',
      'The train is a costly signal: it is heavy, expensive to grow, and honest for that reason. The display is the information.',
      'Peafowl live near people who keep them. The location will explain most sightings.'],
    rooster: ['Rooster', ['cockerel', 'roosters', 'chicken', 'hen'],
      'Read as announcing what is coming, and as courage that is noisy rather than quiet.',
      'Roosters crow on an internal clock and will do it before dawn without any light to prompt them, which is why the announcement reading stuck.',
      'A rooster heard is a neighbourhood fact. Write down the hour; that is the part with information in it.']
  };

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  }

  var KEYS = Object.keys(A);
  /* name and alias to key, built once */
  var INDEX = {};
  KEYS.forEach(function (k) {
    var e = A[k];
    INDEX[norm(e[0])] = k;
    INDEX[k] = k;
    (e[1] || []).forEach(function (al) { INDEX[norm(al)] = k; });
  });

  var AS = {
    VERSION: '1.0.0',
    count: KEYS.length,
    names: KEYS.map(function (k) { return A[k][0]; }).sort(),
    /* A short list for the picker. Not the whole set: the point is to show the
       shape of the thing, not to make the reader scroll a bestiary. */
    COMMON: ['Crow', 'Cardinal', 'Hawk', 'Owl', 'Deer', 'Fox', 'Rabbit', 'Butterfly', 'Dragonfly', 'Ladybug', 'Spider', 'Snake'],

    /* lookup -> { key, name, tradition, origin, possibility } or null */
    lookup: function (raw) {
      var q = norm(raw);
      if (!q) return null;
      var k = INDEX[q];
      if (!k && q.slice(-1) === 's') k = INDEX[q.slice(0, -1)];
      if (!k) {
        /* One pass for a name inside a phrase, so "saw a red fox again" lands. */
        var words = q.split(' ');
        for (var i = 0; i < words.length && !k; i++) {
          k = INDEX[words[i]] || (words[i].slice(-1) === 's' ? INDEX[words[i].slice(0, -1)] : null);
        }
      }
      if (!k) return null;
      var e = A[k];
      return { key: k, name: e[0], tradition: e[2], origin: e[3], possibility: e[4] };
    },
    /* Names that start with or contain what has been typed, for the hint row. */
    suggest: function (raw, limit) {
      var q = norm(raw);
      if (!q) return [];
      var starts = [], holds = [];
      KEYS.forEach(function (k) {
        var n = norm(A[k][0]);
        if (n.indexOf(q) === 0) starts.push(A[k][0]);
        else if (n.indexOf(q) > 0) holds.push(A[k][0]);
      });
      return starts.concat(holds).slice(0, limit || 6);
    },

    journalTitle: function (name) { return String(name) + ' sighting'; },
    journalPrompt: function (name, meaningText, whenLabel) {
      return 'I saw a ' + String(name).toLowerCase() + ' at ' + (whenLabel || 'some point today') + '. The symbolic reading is: ' +
        String(meaningText || '').replace(/\s+$/, '') +
        '\n\nWhere was it, and what was it doing?\n\nWhat was I thinking about just before?\n\nHave I seen one recently, or is this the first?';
    },
    /* For an animal that is not in the list. The page offers this rather than
       composing a meaning, because a meaning composed for an animal would be
       invented rather than assembled. */
    unlistedPrompt: function (raw, whenLabel) {
      return 'I saw ' + String(raw || 'an animal') + ' at ' + (whenLabel || 'some point today') +
        '. This one is not in the app’s list, so there is no traditional reading here to quote.' +
        '\n\nWhere was it, and what was it doing?\n\nWhat was I thinking about just before?\n\nWhat did it feel like at the time?';
    },
    TAG: 'animal_sighting'
  };

  window.AnimalSymbolism = AS;
})();
