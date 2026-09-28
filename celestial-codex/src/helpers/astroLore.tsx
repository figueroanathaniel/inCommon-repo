type SignLore = {
  element: "Fire" | "Earth" | "Air" | "Water";
  modality: "Cardinal" | "Fixed" | "Mutable";
  ruler: string;
  epithet: string;
  keywords: string[];
  prose: string;
};

type PlanetLore = { domain: string; prose: string };

export const astroLore: {
  signs: SignLore[];
  planets: Record<string, PlanetLore>;
  houses: { title: string; prose: string }[];
  aspects: Record<string, { glyph: string; verb: string; prose: string }>;
  elements: Record<string, string>;
} = {
  signs: [
    { element: "Fire", modality: "Cardinal", ruler: "Mars", epithet: "The Spark That Breaks the Dark", keywords: ["initiation", "courage", "raw becoming"], prose: "Aries is the first breath of the zodiac, the match struck against a starless sky. Here the soul moves before it thinks, charging headlong into beginnings with the untamed innocence of spring. Its gift is courage; its lesson is patience with a world that burns slower than it does." },
    { element: "Earth", modality: "Fixed", ruler: "Venus", epithet: "The Garden Sworn to Bloom", keywords: ["devotion", "sensuality", "steadfastness"], prose: "Taurus is the loam after rain, the velvet weight of ripening fruit. It knows the holiness of the body and the slow liturgy of growth. What Taurus loves, it tends for a lifetime; what it builds, it builds to outlast storms." },
    { element: "Air", modality: "Mutable", ruler: "Mercury", epithet: "The Twin Voices of the Wind", keywords: ["curiosity", "wit", "connection"], prose: "Gemini is the quicksilver messenger darting between worlds, a mind with a thousand open windows. It gathers stories the way a magpie gathers light, weaving strangers into conversation and contradictions into insight." },
    { element: "Water", modality: "Cardinal", ruler: "Moon", epithet: "The Tide That Remembers", keywords: ["nurture", "memory", "belonging"], prose: "Cancer is the shell that carries the ocean's hush, a hearth lit against the long night. It feels in undertows and remembers in tides. Its shell is armor, but its heart is a harbor for everyone it has ever chosen." },
    { element: "Fire", modality: "Fixed", ruler: "Sun", epithet: "The Crowned Heart of Summer", keywords: ["radiance", "creativity", "generosity"], prose: "Leo is noon made flesh, a golden mane of warmth thrown wide across the room. It creates because it must, loves out loud, and asks only to be witnessed. Its sovereignty is truest when it lets others shine in its light." },
    { element: "Earth", modality: "Mutable", ruler: "Mercury", epithet: "The Harvest-Keeper's Hands", keywords: ["discernment", "service", "craft"], prose: "Virgo is the sacred attention of the harvester sorting wheat from chaff by moonlight. It finds divinity in detail and devotion in usefulness. Where others see chaos, Virgo sees the pattern waiting to be tended into order." },
    { element: "Air", modality: "Cardinal", ruler: "Venus", epithet: "The Scales Set Among the Stars", keywords: ["harmony", "beauty", "relationship"], prose: "Libra is the hush of perfect balance at the equinox, when day and night stand as equals. It seeks beauty as a form of justice and justice as a form of beauty, forever composing the world into something more graceful." },
    { element: "Water", modality: "Fixed", ruler: "Pluto & Mars", epithet: "The Scorpion Beneath the Lake", keywords: ["depth", "transformation", "intimacy"], prose: "Scorpio is the black mirror of still water, the place where nothing is shallow and everything is true. It descends willingly into the underworld of feeling and returns carrying fire. To be loved by Scorpio is to be seen entirely." },
    { element: "Fire", modality: "Mutable", ruler: "Jupiter", epithet: "The Archer Aiming at Infinity", keywords: ["wisdom", "adventure", "faith"], prose: "Sagittarius is the arrow loosed toward the far horizon, the campfire philosopher under a sky too vast to name. It hungers for meaning, for roads not yet walked, for truths large enough to hold laughter." },
    { element: "Earth", modality: "Cardinal", ruler: "Saturn", epithet: "The Goat Upon the Winter Summit", keywords: ["mastery", "discipline", "legacy"], prose: "Capricorn is the patient climber who knows the summit is earned one hold at a time. Beneath its composure lies a dry, ancient humor and an unwavering sense of duty. It builds cathedrals it may never see completed." },
    { element: "Air", modality: "Fixed", ruler: "Uranus & Saturn", epithet: "The Water-Bearer of Tomorrow", keywords: ["vision", "originality", "community"], prose: "Aquarius pours starlight into the thirsting future. It is the lightning-strike idea, the rebel with a blueprint, the friend to all and the captive of none. Its love is wide as a constellation and just as luminous." },
    { element: "Water", modality: "Mutable", ruler: "Neptune & Jupiter", epithet: "The Two Fish in the Dreaming Sea", keywords: ["compassion", "imagination", "transcendence"], prose: "Pisces is the ocean dreaming itself, the last sign where every boundary dissolves into mist. It feels the ache of the whole world and answers with art, mercy, and prayer. Its magic lives in surrender." },
  ],
  planets: {
    sun: { domain: "Essence · Vitality · Purpose", prose: "The Sun is the burning core of your identity, the fire you were sent here to tend. Its sign describes the costume your soul wears to the great masquerade; its house reveals the stage on which you are meant to shine." },
    moon: { domain: "Emotion · Instinct · Comfort", prose: "The Moon is your inner tide, the silver creature that stirs when no one is watching. It governs what soothes you, what you remember in your body, and the particular shape of your longing to belong." },
    mercury: { domain: "Mind · Voice · Perception", prose: "Mercury is the winged courier of your thoughts, the way your mind catches light and turns it into language. It shows how you learn, how you argue, and how you tell the story of your own life." },
    venus: { domain: "Love · Beauty · Value", prose: "Venus is the rose in the garden of your desire. It reveals what you find beautiful, how you give and receive affection, and the quiet currency of what you hold precious." },
    mars: { domain: "Will · Drive · Desire", prose: "Mars is the red blade of your wanting, the engine of pursuit. It shows how you fight, how you chase, and where your blood runs hottest when something worth having comes within reach." },
    jupiter: { domain: "Expansion · Faith · Fortune", prose: "Jupiter is the great benefic, a kingly planet of generosity and growth. Wherever it lands in your chart, doors swing open a little more easily and the universe seems inclined to say yes." },
    saturn: { domain: "Structure · Time · Mastery", prose: "Saturn is the stern teacher with the hourglass. Its lessons arrive slowly and cost something, yet every stone it asks you to carry becomes a foundation. Saturn's gift is earned authority." },
    uranus: { domain: "Awakening · Rebellion · Genius", prose: "Uranus is the lightning that splits the old oak. It marks where you refuse convention, where sudden revelation breaks through, and where your particular brilliance insists on being free." },
    neptune: { domain: "Dream · Mysticism · Dissolution", prose: "Neptune is the fog upon the sea at dawn, beautiful and bewildering. It governs imagination, spiritual yearning, and the places where the veil between you and the infinite grows thin." },
    pluto: { domain: "Power · Rebirth · Shadow", prose: "Pluto is lord of the underworld and keeper of the phoenix flame. Where it resides, you will be broken open and remade, and from that sacred ruin comes a power no one can take from you." },
    northNode: { domain: "Destiny · Growth · Soul Direction", prose: "The North Node is the compass point of your soul's evolution, the unfamiliar north your spirit is learning to walk toward. It feels awkward, even frightening, and it is exactly where your deepest fulfillment waits." },
    southNode: { domain: "Inheritance · Mastery · Release", prose: "The South Node is the well-worn road behind you, the gifts you arrived already knowing. It is a place of comfort and competence, and also of habit. Draw from its treasury, then keep walking north." },
    lilith: { domain: "Wildness · Exile · Untamed Power", prose: "Black Moon Lilith is the empty point of the Moon's farthest reach, the part of you that refused to be domesticated. Where she sits, you have known shame or exile, and there you reclaim a raw, magnetic sovereignty that answers to no one." },
    chiron: { domain: "Wound · Medicine · Teaching", prose: "Chiron, the wounded healer, marks the ache you carry that never fully closes. Yet through tending it with honesty, you become a healer for others who bleed in the same place. Your deepest wound is also your most potent medicine." },
    ceres: { domain: "Nurture · Grief · Return", prose: "Ceres, the grain mother, shows how you need to be nourished and how you nourish others. She knows loss and seasonal return, teaching that every descent into winter ends in a harvest." },
    pallas: { domain: "Strategy · Pattern · Wisdom", prose: "Pallas Athena, born from the mind of Zeus, grants pattern recognition, creative intelligence, and the strategist's calm. Her placement shows how you perceive the whole design and act with clear-eyed wisdom." },
    juno: { domain: "Devotion · Partnership · Vow", prose: "Juno, queen and wife, reveals what you require from a committed bond and what you promise in return. She speaks of loyalty, equality, and the sacred contracts of the heart." },
    vesta: { domain: "Sacred Focus · Devotion · Flame", prose: "Vesta tends the eternal flame of the temple. Her placement shows where you devote yourself utterly, where you become whole in focused solitude, and what you hold sacred enough to protect." },
    eris: { domain: "Disruption · Truth · Awakening", prose: "Eris, the dwarf planet of discord, tosses the golden apple into the banquet. She marks where you are called to disrupt complacency and speak the inconvenient truth that sets things right." },
    vertex: { domain: "Fated Encounters · Destiny's Door", prose: "The Vertex is a sensitive point in the western sky where fate seems to arrive through other people. Meetings that touch it feel destined, as if a door opened from the other side." },
    fortune: { domain: "Joy · Prosperity · Natural Luck", prose: "The Part of Fortune blends Sun, Moon, and Ascendant into one golden point of ease. Where it falls, contentment comes naturally and life's gifts flow with the least resistance." },
    eastPoint: { domain: "Self-Assertion · Personal Dawn", prose: "The East Point, or equatorial Ascendant, is a second doorway of identity, showing how you instinctively rise to meet the world when no one has told you who to be." },
  },
  houses: [
    { title: "House of Self", prose: "the face you turn toward the dawn, your body, bearing and first impression" },
    { title: "House of Treasure", prose: "your resources, your talents, and the things you consider truly yours" },
    { title: "House of Messages", prose: "siblings, short journeys, neighbors, and the everyday traffic of the mind" },
    { title: "House of Roots", prose: "home, ancestry, and the private hearth at the bottom of the sky" },
    { title: "House of Pleasure", prose: "romance, children, play, and every act of joyful creation" },
    { title: "House of Craft", prose: "daily ritual, health, service, and the art of useful work" },
    { title: "House of Partnership", prose: "the mirror of the other, marriage, contracts, and open rivals" },
    { title: "House of Mysteries", prose: "intimacy, shared resources, death and rebirth, all that is hidden" },
    { title: "House of Pilgrimage", prose: "philosophy, long voyages, higher learning, and faith" },
    { title: "House of the Summit", prose: "vocation, reputation, and the legacy you leave in public view" },
    { title: "House of Allies", prose: "friendship, community, and the hopes you hold for the future" },
    { title: "House of the Veil", prose: "solitude, the unconscious, secret sorrows, and spiritual retreat" },
  ],
  aspects: {
    conjunction: { glyph: "☌", verb: "fuses with", prose: "Two lights melt into a single flame. Their powers amplify each other and cannot act alone." },
    sextile: { glyph: "⚹", verb: "harmonizes with", prose: "A gentle, opportune doorway. These energies cooperate when you choose to open it." },
    square: { glyph: "□", verb: "wrestles with", prose: "Friction that forges diamonds. These forces clash, and in the clash you grow strong." },
    trine: { glyph: "△", verb: "flows with", prose: "An effortless river of grace. These gifts come so naturally you may forget they are gifts." },
    opposition: { glyph: "☍", verb: "faces", prose: "A dance across the sky. Two poles seeking balance, often mirrored through other people." },
    semisextile: { glyph: "⚺", verb: "brushes against", prose: "A subtle neighborly nudge, asking for small adjustments between adjacent energies." },
    semisquare: { glyph: "∠", verb: "chafes against", prose: "A minor irritation that quietly motivates action." },
    quintile: { glyph: "Q", verb: "creates with", prose: "A rare creative spark, the signature of talent and inventive genius." },
    sesquiquadrate: { glyph: "⚼", verb: "agitates", prose: "A restless tension that seeks release through effort." },
    quincunx: { glyph: "⚻", verb: "must adjust to", prose: "Two energies that do not speak the same language, requiring continual, creative adjustment." },
  },
  elements: {
    Fire: "Fire burns with enthusiasm, inspiration, and holy impatience.",
    Earth: "Earth grounds, gathers, and gives form to the formless.",
    Air: "Air thinks, speaks, and weaves the invisible threads between things.",
    Water: "Water feels, remembers, and dissolves what no longer serves.",
  },
};
