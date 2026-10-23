import type { AcgAngle } from "./astroCartography";

export const acgLore: {
  angles: Record<AcgAngle, { title: string; realm: string; prose: string }>;
  planets: Record<string, { tone: "benefic" | "challenging" | "potent"; gifts: string; cautions: string }>;
} = {
  angles: {
    ASC: { title: "Rising Line", realm: "self, body, first impression", prose: "Here the planet rises on the eastern horizon at the moment of your birth. Its energy becomes your atmosphere: how you feel in your own skin, how strangers read you, and the self you grow into." },
    MC: { title: "Midheaven Line", realm: "vocation, reputation, public destiny", prose: "Here the planet stood at the crown of the sky. It lights your public life, making this a place where career, recognition, and the legacy you build are colored by its power." },
    DSC: { title: "Descendant Line", realm: "partnership, encounters, others", prose: "Here the planet sets in the west. It arrives through other people: partners, collaborators, rivals, and the relationships that mirror you back to yourself." },
    IC: { title: "Imum Coeli Line", realm: "home, roots, inner foundations", prose: "Here the planet lies beneath your feet. It shapes domestic life, family, a sense of belonging, and the private sanctuary you build, often working quietly over time." },
  },
  planets: {
    sun: { tone: "benefic", gifts: "vitality, confidence, visibility, and a sense of being truly yourself", cautions: "ego clashes or feeling permanently on stage" },
    moon: { tone: "benefic", gifts: "emotional belonging, nurture, popularity, and a feeling of home", cautions: "heightened moods, nostalgia, or restlessness with the tides of feeling" },
    mercury: { tone: "benefic", gifts: "learning, writing, commerce, networking, and quick connections", cautions: "nervous overstimulation and scattered attention" },
    venus: { tone: "benefic", gifts: "love, beauty, pleasure, artistic flourishing, and social grace", cautions: "indulgence or complacency in comfort" },
    mars: { tone: "challenging", gifts: "courage, drive, athletic vigor, and bold initiative", cautions: "conflict, accidents from haste, and burning out" },
    jupiter: { tone: "benefic", gifts: "luck, expansion, generosity, faith, and open doors", cautions: "overpromising or excess" },
    saturn: { tone: "challenging", gifts: "discipline, mastery, authority, and hard-won lasting achievement", cautions: "heaviness, isolation, and slow, effortful progress" },
    uranus: { tone: "potent", gifts: "awakening, freedom, innovation, and exhilarating reinvention", cautions: "instability and sudden upheaval" },
    neptune: { tone: "potent", gifts: "spiritual depth, art, music, compassion, and enchantment", cautions: "confusion, illusion, and blurred boundaries" },
    pluto: { tone: "potent", gifts: "profound transformation, power, and psychological depth", cautions: "intensity, power struggles, and crises that force rebirth" },
    northNode: { tone: "benefic", gifts: "destiny, growth, and meetings that move your soul forward", cautions: "the discomfort of the unfamiliar" },
    chiron: { tone: "potent", gifts: "healing, teaching, and turning old wounds into medicine", cautions: "tender places that ache before they mend" },
  },
};
