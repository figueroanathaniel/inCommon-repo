import type { CenterKey, HDType } from "./humanDesignEngine";

export const hdLore: {
  types: Record<HDType, { strategy: string; signature: string; notSelf: string; aura: string; prose: string }>;
  centers: Record<CenterKey, { name: string; theme: string; defined: string; open: string }>;
  authorities: Record<string, string>;
  gateNames: Record<number, string>;
  profiles: Record<number, string>;
} = {
  types: {
    Generator: { strategy: "Wait to Respond", signature: "Satisfaction", notSelf: "Frustration", aura: "Open & Enveloping", prose: "You are a living furnace, a sacral engine humming with renewable life force. Your power does not come from chasing, but from responding: the gut's quiet “uh-huh” or “uhn-uhn” to what life places before you. When you devote your fire to work you love, you glow with a satisfaction that warms everyone near you." },
    "Manifesting Generator": { strategy: "Wait to Respond, then Inform", signature: "Satisfaction & Peace", notSelf: "Frustration & Anger", aura: "Open & Enveloping", prose: "You are a comet with an engine: sacral life force wired straight to the voice of manifestation. You move fast, skip steps, and juggle many passions at once, and that is not a flaw but your design. Respond first, inform those in your path, and then fly." },
    Manifestor: { strategy: "Inform Before Acting", signature: "Peace", notSelf: "Anger", aura: "Closed & Repelling", prose: "You are the initiator, the one who lights the fuse that sets the world in motion. Your aura moves through a room like a wind before a storm. Your freedom grows when you tell others what you are about to do, smoothing the wake your impact leaves." },
    Projector: { strategy: "Wait for the Invitation", signature: "Success", notSelf: "Bitterness", aura: "Focused & Absorbing", prose: "You are the seer, a lantern made to guide the energy of others. Your aura penetrates, reading people and systems with uncanny precision. When recognized and invited, your wisdom lands like prophecy; your mastery lies in rest and in knowing your worth." },
    Reflector: { strategy: "Wait a Lunar Cycle", signature: "Surprise", notSelf: "Disappointment", aura: "Resistant & Sampling", prose: "You are the rarest mirror in the human mandala, a silver moon reflecting the health of every community you enter. Open in every center, you sample the whole world. Give great decisions a full lunar month, and let the right place find you." },
  },
  centers: {
    head: { name: "Head", theme: "Inspiration · Mental Pressure", defined: "A steady fountain of questions and inspiration that others draw from.", open: "You drink inspiration from the air around you; not every question needs answering." },
    ajna: { name: "Ajna", theme: "Conceptualization · Certainty", defined: "A fixed, reliable way of processing thought and holding concepts.", open: "A flexible, many-angled mind that need not cling to certainty." },
    throat: { name: "Throat", theme: "Expression · Manifestation", defined: "A consistent voice and a reliable way of turning intention into action.", open: "Your voice changes with the company; speak when invited and your words carry weight." },
    g: { name: "G Center", theme: "Identity · Love · Direction", defined: "A fixed inner compass that knows who you are and where you are going.", open: "Your identity is fluid; the right places reveal the right versions of you." },
    heart: { name: "Heart / Ego", theme: "Willpower · Worth", defined: "Consistent willpower; you keep promises when your word is truly given.", open: "Nothing to prove. You are worthy without the endless effort of proving it." },
    sacral: { name: "Sacral", theme: "Life Force · Work · Sexuality", defined: "A sustainable wellspring of vital energy for what you love.", open: "You amplify others’ energy wisely; know when enough is enough." },
    spleen: { name: "Spleen", theme: "Intuition · Survival · Health", defined: "A quiet, instantaneous intuition that speaks once and in the now.", open: "Deeply sensitive to wellness; release what you cling to for false safety." },
    solarPlexus: { name: "Solar Plexus", theme: "Emotion · Spirit · Desire", defined: "An emotional wave; clarity comes with time, never in the heat of the crest.", open: "An empath who feels others deeply; discern which emotions are truly yours." },
    root: { name: "Root", theme: "Pressure · Adrenaline · Drive", defined: "A consistent relationship with pressure that fuels your drive.", open: "You amplify stress around you; not everything must be finished now." },
  },
  authorities: {
    "Emotional (Solar Plexus)": "There is no truth in the now. Ride your emotional wave from crest to trough and let clarity rise like a tide.",
    Sacral: "Your gut speaks in sounds before words. Trust the immediate body-yes and the body-no.",
    Splenic: "Intuition whispers only once, in the present moment. Honor the first quiet knowing.",
    "Ego Manifested": "Speak from the heart and listen for what your will truly wants.",
    "Ego Projected": "Ask what you genuinely want and whether you have the will to see it through.",
    "Self-Projected": "Talk it out and hear your own voice. Truth reveals itself in the sound of your identity.",
    "Mental (Environmental)": "Sound out decisions with trusted others in the right environment; your clarity is outer, not inner.",
    Lunar: "Let the Moon cycle through all 64 gates before deciding. Time is your oracle.",
  },
  gateNames: {
    1: "Self-Expression", 2: "Higher Knowing", 3: "Ordering", 4: "Formulization", 5: "Fixed Rhythms", 6: "Friction", 7: "The Role of the Self", 8: "Contribution", 9: "Focus", 10: "Behavior of the Self", 11: "Ideas", 12: "Caution", 13: "The Listener", 14: "Power Skills", 15: "Extremes", 16: "Skills", 17: "Opinions", 18: "Correction", 19: "Wanting", 20: "The Now", 21: "The Hunter", 22: "Openness", 23: "Assimilation", 24: "Rationalization", 25: "Spirit of the Self", 26: "The Egoist", 27: "Caring", 28: "The Game Player", 29: "Perseverance", 30: "Recognition of Feelings", 31: "Influence", 32: "Continuity", 33: "Privacy", 34: "Power", 35: "Change", 36: "Crisis", 37: "Friendship", 38: "The Fighter", 39: "Provocation", 40: "Aloneness", 41: "Contraction", 42: "Growth", 43: "Insight", 44: "Alertness", 45: "The Gatherer", 46: "Determination of the Self", 47: "Realization", 48: "Depth", 49: "Principles", 50: "Values", 51: "Shock", 52: "Stillness", 53: "Beginnings", 54: "Ambition", 55: "Spirit", 56: "Stimulation", 57: "Intuitive Clarity", 58: "Vitality", 59: "Sexuality", 60: "Acceptance", 61: "Mystery", 62: "Details", 63: "Doubt", 64: "Confusion",
  },
  profiles: {
    1: "The Investigator builds unshakable foundations through study.",
    2: "The Hermit carries natural gifts that bloom when called out of solitude.",
    3: "The Martyr learns by trial, error, and glorious discovery.",
    4: "The Opportunist thrives through the warmth of a trusted network.",
    5: "The Heretic is projected upon as a savior, practical and universal.",
    6: "The Role Model walks three lives: experimenter, observer, and exemplar.",
  },
};
