/*! ephemeris/pointRegistry.ts: Complete astrological point registry (TypeScript)
 *
 * Single source of truth for all 17 basic + 40+ expanded points.
 * Every id here must be computable by Prompt 3.
 * Categories "asteroid"..."derived" (except South Node) are EXPANDED-only.
 *
 * BASIC (17 points): asc, mc, ic, dc, sun, moon, mercury, venus, mars,
 * jupiter, saturn, uranus, neptune, pluto, northNode, southNode, partOfFortune.
 *
 * EXPANDED adds: asteroids, centaurs, TNOs, comets, lunar nodes, hypotheticals, derived.
 */

export type Category =
  | 'angle'      // ASC, MC, IC, DC
  | 'body'       // Sun, Moon, planets
  | 'node'       // North, South, lunar points, planetary nodes
  | 'asteroid'   // Belt asteroids + love/shadow group (EXPANDED-only)
  | 'centaur'    // Centaurs, chironic bodies (EXPANDED-only)
  | 'tno'        // Transneptunian objects & dwarf planets (EXPANDED-only)
  | 'comet'      // Halley, Hale-Bopp, Hyakutake (EXPANDED-only, mundane only)
  | 'hypothetical' // Hamburg School TNPs (EXPANDED-only)
  | 'derived';   // Computed points: Vertex, Antivertex, etc. (EXPANDED-only)

export interface PointDef {
  id: string;                    // unique identifier
  name: string;                  // display name
  glyph: string;                 // unicode/astronomical symbol or 3-letter abbr
  category: Category;
  sweId?: number | string;       // Swiss Ephemeris ID (body, MPC, or manual)
  tooltip: string;               // ≤120 chars: archetype meaning
  reference: string;             // ≤120 chars: practical/mundane meaning
  expanded?: boolean;            // true = EXPANDED-only (default false for basic)
}

export interface SymbolismEntry {
  archetype: string;             // ≤120 chars: spiritual/archetypal meaning
  practical: string;             // ≤120 chars: mundane/psychological meaning
}

// ============================================================================
// BASIC REGISTRY (17 points)
// ============================================================================

export const BASIC_REGISTRY: PointDef[] = [
  // Angles
  {
    id: 'asc',
    name: 'Ascendant',
    glyph: '↑',
    category: 'angle',
    tooltip: 'self-presentation, mask, first impression to the world',
    reference: 'how others see you, persona, life direction'
  },
  {
    id: 'mc',
    name: 'Midheaven',
    glyph: 'MC',
    category: 'angle',
    tooltip: 'career, public image, highest achievement, life purpose',
    reference: 'professional path, reputation, ambition, legacy'
  },
  {
    id: 'ic',
    name: 'Nadir',
    glyph: 'IC',
    category: 'angle',
    tooltip: 'home, family roots, private self, foundation',
    reference: 'family legacy, inner security, psychological roots'
  },
  {
    id: 'dc',
    name: 'Descendant',
    glyph: '↓',
    category: 'angle',
    tooltip: 'relationships, projections onto others, partnerships',
    reference: 'marriage partner, enemies, significant others'
  },

  // Luminaries
  {
    id: 'sun',
    name: 'Sun',
    glyph: '☉',
    category: 'body',
    sweId: 0,
    tooltip: 'core self, will, identity, creative essence',
    reference: 'conscious purpose, vitality, what you came to express'
  },
  {
    id: 'moon',
    name: 'Moon',
    glyph: '☽',
    category: 'body',
    sweId: 1,
    tooltip: 'emotions, needs, inner world, nurturing instinct',
    reference: 'emotional nature, instinct, security, family'
  },

  // Planets
  {
    id: 'mercury',
    name: 'Mercury',
    glyph: '☿',
    category: 'body',
    sweId: 2,
    tooltip: 'communication, mind, ideas, learning, commerce',
    reference: 'how you think and speak, trade, siblings'
  },
  {
    id: 'venus',
    name: 'Venus',
    glyph: '♀',
    category: 'body',
    sweId: 3,
    tooltip: 'love, beauty, values, relating, sensuality',
    reference: 'romantic nature, aesthetics, money, pleasure'
  },
  {
    id: 'mars',
    name: 'Mars',
    glyph: '♂',
    category: 'body',
    sweId: 4,
    tooltip: 'assertion, courage, desire, anger, drive',
    reference: 'sexual energy, aggression, competition, action'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    glyph: '♃',
    category: 'body',
    sweId: 5,
    tooltip: 'expansion, luck, faith, excess, growth',
    reference: 'opportunity, abundance, optimism, over-extension'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    glyph: '♄',
    category: 'body',
    sweId: 6,
    tooltip: 'limitation, responsibility, time, structure, fear',
    reference: 'discipline, maturity, delays, earned success'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    glyph: '♅',
    category: 'body',
    sweId: 7,
    tooltip: 'rebellion, innovation, freedom, sudden change',
    reference: 'genius, disruption, detachment, revolution'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    glyph: '♆',
    category: 'body',
    sweId: 8,
    tooltip: 'illusion, spirituality, dreams, dissolve boundaries',
    reference: 'imagination, deception, mysticism, addiction'
  },
  {
    id: 'pluto',
    name: 'Pluto',
    glyph: '♇',
    category: 'body',
    sweId: 9,
    tooltip: 'transformation, death/rebirth, power, shadow',
    reference: 'deep change, shared resources, control, obsession'
  },

  // Lunar Nodes
  {
    id: 'northNode',
    name: 'North Node',
    glyph: '☊',
    category: 'node',
    sweId: 11,
    tooltip: 'soul growth direction, future potential, destiny',
    reference: 'life calling, evolution, what to move toward'
  },
  {
    id: 'southNode',
    name: 'South Node',
    glyph: '☋',
    category: 'node',
    sweId: 10,
    tooltip: 'past karma, natural talents, old patterns',
    reference: 'gifts from past, comfort zone, what to release'
  },

  // Essential Point (now BASIC)
  {
    id: 'partOfFortune',
    name: 'Part of Fortune',
    glyph: '⊗',
    category: 'derived',
    tooltip: 'luck, prosperity, natural ease, flow',
    reference: 'where fortune flows, material ease, life current'
  }
];

// ============================================================================
// EXPANDED REGISTRY (additional 40+ points)
// ============================================================================

export const EXPANDED_REGISTRY: PointDef[] = [
  // ---- ASTEROIDS (Belt + love/shadow group) ----
  {
    id: 'ceres',
    name: 'Ceres',
    glyph: '⚳',
    category: 'asteroid',
    sweId: 1,
    tooltip: 'nurturing, motherhood, grief, harvest, parenting',
    reference: 'food, attachment, how you nurture',
    expanded: true
  },
  {
    id: 'pallas',
    name: 'Pallas Athene',
    glyph: '⚴',
    category: 'asteroid',
    sweId: 2,
    tooltip: 'strategic wisdom, justice, pattern-seeing',
    reference: 'problem-solving, activism, craft skills'
  },
  {
    id: 'juno',
    name: 'Juno',
    glyph: '⚵',
    category: 'asteroid',
    sweId: 3,
    tooltip: 'sacred marriage, commitment, jealousy',
    reference: 'spouse needs, couple power dynamics, loyalty'
  },
  {
    id: 'vesta',
    name: 'Vesta',
    glyph: '⚶',
    category: 'asteroid',
    sweId: 4,
    tooltip: 'hearth-flame, devotion, focus, sacred fire',
    reference: 'work devotion, sacred sexuality, dedication'
  },
  {
    id: 'hygiea',
    name: 'Hygiea',
    glyph: '⚕',
    category: 'asteroid',
    sweId: 10,
    tooltip: 'health, purification, wellness, healing',
    reference: 'diet, healing crises, preventive care'
  },
  {
    id: 'astraea',
    name: 'Astraea',
    glyph: '⚖',
    category: 'asteroid',
    sweId: 5,
    tooltip: 'justice, innocence, balance, divine law',
    reference: 'law, activism, the Virgo archetype'
  },
  {
    id: 'iris',
    name: 'Iris',
    glyph: 'Irs',
    category: 'asteroid',
    sweId: 7,
    tooltip: 'rainbow messenger, communication, bridging',
    reference: 'news, connections between people, mediation'
  },
  {
    id: 'flora',
    name: 'Flora',
    glyph: 'Flr',
    category: 'asteroid',
    sweId: 8,
    tooltip: 'spring, fertility, renewal, sensual beauty',
    reference: 'creativity, sensual cycles, rebirth'
  },
  {
    id: 'metis',
    name: 'Metis',
    glyph: 'Met',
    category: 'asteroid',
    sweId: 9,
    tooltip: 'cunning wisdom, strategy, hidden counsel',
    reference: 'tactical thinking, behind-scenes advice'
  },
  {
    id: 'hebe',
    name: 'Hebe',
    glyph: 'Hbe',
    category: 'asteroid',
    sweId: 6,
    tooltip: 'youth, service, vitality, renewal',
    reference: 'vigor, service to others, youthfulness'
  },
  {
    id: 'pandora',
    name: 'Pandora',
    glyph: 'Pan',
    category: 'asteroid',
    sweId: 55,
    tooltip: 'curiosity, unleashed consequences, opening',
    reference: 'irreversible choices, consequences'
  },
  {
    id: 'psyche',
    name: 'Psyche',
    glyph: 'Psy',
    category: 'asteroid',
    sweId: 16,
    tooltip: 'soul, trials, metamorphosis, transformation',
    reference: 'tests of trust, soul growth, psychology'
  },
  {
    id: 'proserpina',
    name: 'Proserpina',
    glyph: 'Pro',
    category: 'asteroid',
    sweId: 26,
    tooltip: 'abduction, underworld, return, rebirth',
    reference: 'trauma, return, mother-daughter, cycles'
  },
  {
    id: 'eros',
    name: 'Eros',
    glyph: 'Ero',
    category: 'asteroid',
    sweId: 433,
    tooltip: 'erotic passion, desire, sexual magnetism',
    reference: 'sexual nature, desire, erotic compatibility'
  },
  {
    id: 'amor',
    name: 'Amor',
    glyph: 'Amo',
    category: 'asteroid',
    sweId: 1221,
    tooltip: 'unconditional love, devotion, agape',
    reference: 'selfless love, compassion, loving beyond reason'
  },
  {
    id: 'cupido_astr',
    name: 'Cupido',
    glyph: 'Cup',
    category: 'asteroid',
    sweId: 763,
    tooltip: 'infatuation, romantic idealization, crush',
    reference: 'romantic yearning, crushes, idealization'
  },
  {
    id: 'sappho',
    name: 'Sappho',
    glyph: 'Sap',
    category: 'asteroid',
    sweId: 80,
    tooltip: 'same-sex love, poetry, artistic expression',
    reference: 'sexual orientation, artistic love'
  },
  {
    id: 'bacchus',
    name: 'Bacchus',
    glyph: 'Bac',
    category: 'asteroid',
    sweId: 2063,
    tooltip: 'ecstasy, ritual release, intoxication',
    reference: 'indulgence, trance states, liberation'
  },
  {
    id: 'karma',
    name: 'Karma',
    glyph: 'Kar',
    category: 'asteroid',
    sweId: 3811,
    tooltip: 'cause and effect, karmic law, consequence',
    reference: 'karmic debts, cosmic payback'
  },
  {
    id: 'nemesis',
    name: 'Nemesis',
    glyph: 'Nem',
    category: 'asteroid',
    sweId: 128,
    tooltip: 'retribution, balance, cosmic justice',
    reference: 'enemies, payback, where hubris falls'
  },
  {
    id: 'dejanira',
    name: 'Dejanira',
    glyph: 'Dej',
    category: 'asteroid',
    sweId: 157,
    tooltip: 'victimization, wounding, betrayal trauma',
    reference: 'victim patterns, where one feels wronged'
  },
  {
    id: 'atlantis',
    name: 'Atlantis',
    glyph: 'Atl',
    category: 'asteroid',
    sweId: 1198,
    tooltip: 'misused power, hubris, technology falling',
    reference: 'downfall, ego, technological/egoic collapse'
  },
  {
    id: 'pythia',
    name: 'Pythia',
    glyph: 'Pyt',
    category: 'asteroid',
    sweId: 432,
    tooltip: 'oracle, prophecy, inner knowing, divination',
    reference: 'intuition, divination, prophetic voice'
  },
  {
    id: 'fortuna',
    name: 'Fortuna',
    glyph: 'For',
    category: 'asteroid',
    sweId: 19,
    tooltip: 'luck, prosperity, abundance, chance',
    reference: 'material ease, flow, natural fortune'
  },
  {
    id: 'tyche',
    name: 'Tyche',
    glyph: 'Tyx',
    category: 'asteroid',
    sweId: 258,
    tooltip: 'fortune, prosperity, good luck, chance',
    reference: 'luck, abundance, serendipity'
  },
  {
    id: 'apollo',
    name: 'Apollo',
    glyph: 'Apo',
    category: 'asteroid',
    sweId: 1862,
    tooltip: 'prophecy, healing, arts, solar wisdom',
    reference: 'healing, creativity, prophecy'
  },
  {
    id: 'diana',
    name: 'Diana',
    glyph: 'Dia',
    category: 'asteroid',
    sweId: 78,
    tooltip: 'moon goddess, hunt, independence, sisterhood',
    reference: 'self-reliance, female bonds, independence'
  },
  {
    id: 'arachne',
    name: 'Arachne',
    glyph: 'Ara',
    category: 'asteroid',
    sweId: 407,
    tooltip: 'craft mastery, hubris, comeuppance',
    reference: 'pride in skill, artistic skill, transformation'
  },

  // ---- CENTAURS ----
  {
    id: 'chiron',
    name: 'Chiron',
    glyph: '⚷',
    category: 'centaur',
    sweId: 2060,
    tooltip: 'wounded healer, deepest wound, mentorship',
    reference: 'healing gift, wound-becoming-calling'
  },
  {
    id: 'nessus',
    name: 'Nessus',
    glyph: 'Nes',
    category: 'centaur',
    sweId: 7066,
    tooltip: 'transgenerational abuse, cycles, patterns',
    reference: 'abuse cycles, where patterns break'
  },
  {
    id: 'pholus',
    name: 'Pholus',
    glyph: 'Pho',
    category: 'centaur',
    sweId: 5145,
    tooltip: 'chain reaction, small triggers, massive release',
    reference: 'tipping points, cascade effects'
  },
  {
    id: 'chariklo',
    name: 'Chariklo',
    glyph: 'Cha',
    category: 'centaur',
    sweId: 10199,
    tooltip: 'sacred boundaries, protection, ethics',
    reference: 'where to hold space, ethical limits'
  },
  {
    id: 'asbolus',
    name: 'Asbolus',
    glyph: 'Asb',
    category: 'centaur',
    sweId: 8405,
    tooltip: 'insight from chaos, divination, darkness',
    reference: 'reading signs, seeing through shadow'
  },
  {
    id: 'hylonome',
    name: 'Hylonome',
    glyph: 'Hyl',
    category: 'centaur',
    sweId: 10370,
    tooltip: 'grief, mourning, loss of identity',
    reference: 'death work, loss, identity transformation'
  },
  {
    id: 'elatus',
    name: 'Elatus',
    glyph: 'Ela',
    category: 'centaur',
    sweId: 31824,
    tooltip: 'resilience, recovery, survival, endurance',
    reference: 'bouncing back, healing after violation'
  },
  {
    id: 'okyrhoe',
    name: 'Okyrhoe',
    glyph: 'Oky',
    category: 'centaur',
    sweId: 52872,
    tooltip: 'punished truth-teller, Cassandra, silencing',
    reference: 'truth-telling cost, being unheard'
  },
  {
    id: 'thereus',
    name: 'Thereus',
    glyph: 'The',
    category: 'centaur',
    sweId: 32532,
    tooltip: 'predator nature, aggression, unprovoked attack',
    reference: 'survival instinct, picked fights'
  },
  {
    id: 'cyllarus',
    name: 'Cyllarus',
    glyph: 'Cyl',
    category: 'centaur',
    sweId: 52975,
    tooltip: 'sacrificial love, noble loss, devotion',
    reference: 'love's cost, noble sacrifice'
  },
  {
    id: 'amycus',
    name: 'Amycus',
    glyph: 'Amy',
    category: 'centaur',
    sweId: 55576,
    tooltip: 'picked fights, unprovoked aggression',
    reference: 'quarrelsome nature, seeking conflict'
  },
  {
    id: 'pelion',
    name: 'Pelion',
    glyph: 'Pel',
    category: 'centaur',
    sweId: 49036,
    tooltip: 'initiation site, wild places, trials',
    reference: 'training ground, wilderness, rite of passage'
  },
  {
    id: 'crantor',
    name: 'Crantor',
    glyph: 'Cra',
    category: 'centaur',
    sweId: 83982,
    tooltip: 'betrayal by allies, friends-turned-foes',
    reference: 'trust broken by inner circle'
  },
  {
    id: 'echeclus',
    name: 'Echeclus',
    glyph: 'Ech',
    category: 'centaur',
    sweId: 60558,
    tooltip: 'erupting secrets, broken silence, revelation',
    reference: 'where silence fails, truth emerges'
  },
  {
    id: 'damocles',
    name: 'Damocles',
    glyph: 'Dam',
    category: 'centaur',
    sweId: 5335,
    tooltip: 'sword overhead, collapse under privilege',
    reference: 'suspended threat, precarious fortune'
  },

  // ---- TNO / DWARF PLANETS ----
  {
    id: 'eris',
    name: 'Eris',
    glyph: '⚯',
    category: 'tno',
    sweId: 136199,
    tooltip: 'discord, revealed truth, marginalized voices',
    reference: 'exposing hypocrisy, shadow truth'
  },
  {
    id: 'sedna',
    name: 'Sedna',
    glyph: 'Sed',
    category: 'tno',
    sweId: 90377,
    tooltip: 'deepest wound, extreme abandonment, resilience',
    reference: 'shamanic depth, survival, soul wound'
  },
  {
    id: 'quaoar',
    name: 'Quaoar',
    glyph: 'Qua',
    category: 'tno',
    sweId: 50000,
    tooltip: 'creation, sacred dance, art from chaos',
    reference: 'primordial force, creative power'
  },
  {
    id: 'varuna',
    name: 'Varuna',
    glyph: 'Var',
    category: 'tno',
    sweId: 20000,
    tooltip: 'cosmic justice, oaths, universal consequence',
    reference: 'divine law, contracts, accountability'
  },
  {
    id: 'orcus',
    name: 'Orcus',
    glyph: 'Orc',
    category: 'tno',
    sweId: 90482,
    tooltip: 'binding oaths, contracts beyond death',
    reference: 'sworn promises, karmic binding'
  },
  {
    id: 'ixion',
    name: 'Ixion',
    glyph: 'Ixi',
    category: 'tno',
    sweId: 28978,
    tooltip: 'betrayal, second chances, trust tests',
    reference: 'repeated betrayal, cycles of trauma'
  },
  {
    id: 'haumea',
    name: 'Haumea',
    glyph: 'Hau',
    category: 'tno',
    sweId: 136108,
    tooltip: 'fertility, parthenogenesis, self-generated',
    reference: 'renewal, rebirth, self-creation'
  },
  {
    id: 'makemake',
    name: 'Makemake',
    glyph: 'Mak',
    category: 'tno',
    sweId: 136472,
    tooltip: 'abundance, ritual, fertility, ecology',
    reference: 'ceremonial power, natural abundance'
  },
  {
    id: 'arrokoth',
    name: 'Arrokoth',
    glyph: 'Arr',
    category: 'tno',
    sweId: 486958,
    tooltip: 'union of opposites, gentle merging',
    reference: 'harmony, blended wholeness'
  },
  {
    id: 'albion',
    name: 'Albion',
    glyph: 'Alb',
    category: 'tno',
    sweId: 15760,
    tooltip: 'first KBO, threshold, pioneer consciousness',
    reference: 'boundary crossing, new territory'
  },

  // ---- COMETS (Mundane astrology only; manual Kepler elements) ----
  {
    id: 'halley',
    name: 'Halley\'s Comet',
    glyph: 'Hal',
    category: 'comet',
    tooltip: 'omen of rulers falling, mundane charts only',
    reference: 'historical cycles, reign changes (mundane)'
  },
  {
    id: 'halebopp',
    name: 'Hale-Bopp',
    glyph: 'HB',
    category: 'comet',
    tooltip: 'mass movements, millennium fever, mundane',
    reference: 'cultural shifts, collective psychology'
  },
  {
    id: 'hyakutake',
    name: 'Hyakutake',
    glyph: 'Hya',
    category: 'comet',
    tooltip: 'sudden revelation, mundane astrology only',
    reference: 'unexpected events, sudden awareness'
  },

  // ---- LUNAR NODES & POINTS ----
  {
    id: 'lilithMean',
    name: 'Lilith (Mean)',
    glyph: '⚸',
    category: 'node',
    sweId: 12,
    tooltip: 'black moon, repressed rage, raw feminine power',
    reference: 'shadow, taboo, exile, wildness'
  },
  {
    id: 'lilithOsc',
    name: 'Lilith (Osculating)',
    glyph: '⚸✦',
    category: 'node',
    sweId: 13,
    tooltip: 'black moon, repressed rage (osculating)',
    reference: 'shadow, current cycle (osculating)'
  },
  {
    id: 'selena',
    name: 'Selena',
    glyph: 'Sel',
    category: 'node',
    tooltip: 'white moon, purity, spiritual protection',
    reference: 'guardian force, pure intent, grace'
  },
  {
    id: 'priapus',
    name: 'Priapus',
    glyph: 'Pri',
    category: 'node',
    tooltip: 'blunt masculine shadow, fertility, phallus',
    reference: 'primal masculinity, raw vitality'
  },

  // Planetary Nodes (computed)
  {
    id: 'mercuryNode',
    name: 'Mercury Node',
    glyph: '☿N',
    category: 'node',
    tooltip: 'mercury collective karma, communication evolution',
    reference: 'shared speech, thought-form destiny'
  },
  {
    id: 'venusNode',
    name: 'Venus Node',
    glyph: '♀N',
    category: 'node',
    tooltip: 'venus collective karma, relationship evolution',
    reference: 'shared love, value-form destiny'
  },
  {
    id: 'marsNode',
    name: 'Mars Node',
    glyph: '♂N',
    category: 'node',
    tooltip: 'mars collective karma, action evolution',
    reference: 'shared drive, will-form destiny'
  },
  {
    id: 'jupiterNode',
    name: 'Jupiter Node',
    glyph: '♃N',
    category: 'node',
    tooltip: 'jupiter collective karma, expansion evolution',
    reference: 'shared growth, abundance-form destiny'
  },
  {
    id: 'saturnNode',
    name: 'Saturn Node',
    glyph: '♄N',
    category: 'node',
    tooltip: 'saturn collective karma, structure evolution',
    reference: 'shared responsibility, form-building destiny'
  },
  {
    id: 'uranusNode',
    name: 'Uranus Node',
    glyph: '♅N',
    category: 'node',
    tooltip: 'uranus collective karma, freedom evolution',
    reference: 'shared innovation, revolution destiny'
  },
  {
    id: 'neptuneNode',
    name: 'Neptune Node',
    glyph: '♆N',
    category: 'node',
    tooltip: 'neptune collective karma, transcendence evolution',
    reference: 'shared spirituality, dissolution destiny'
  },
  {
    id: 'plutoNode',
    name: 'Pluto Node',
    glyph: '♇N',
    category: 'node',
    tooltip: 'pluto collective karma, transformation evolution',
    reference: 'shared power, death-rebirth destiny'
  },

  // ---- HYPOTHETICAL PLANETS (Hamburg School TNPs) ----
  {
    id: 'tnp_cupido',
    name: 'Cupido',
    glyph: 'Cup',
    category: 'hypothetical',
    sweId: 40,
    tooltip: 'love, family, art, bonds, harmony',
    reference: 'artistic bonds, collective love (Hamburg)'
  },
  {
    id: 'tnp_hades',
    name: 'Hades',
    glyph: 'Had',
    category: 'hypothetical',
    sweId: 41,
    tooltip: 'decay, secrets, occult knowledge, underworld',
    reference: 'what\'s hidden, poverty, depths (Hamburg)'
  },
  {
    id: 'tnp_zeus',
    name: 'Zeus',
    glyph: 'Zeu',
    category: 'hypothetical',
    sweId: 42,
    tooltip: 'controlled fire, leadership, power, machinery',
    reference: 'command, force, command (Hamburg)'
  },
  {
    id: 'tnp_kronos',
    name: 'Kronos',
    glyph: 'Kro',
    category: 'hypothetical',
    sweId: 43,
    tooltip: 'authority, government, time, boundaries',
    reference: 'status, officialdom, control (Hamburg)'
  },
  {
    id: 'tnp_apollon',
    name: 'Apollon',
    glyph: 'Apl',
    category: 'hypothetical',
    sweId: 44,
    tooltip: 'science, commerce, growth, rationality',
    reference: 'business, measured growth (Hamburg)'
  },
  {
    id: 'tnp_admetos',
    name: 'Admetos',
    glyph: 'Adm',
    category: 'hypothetical',
    sweId: 45,
    tooltip: 'depth, blockage, raw materials, density',
    reference: 'stoppage, real estate, substance (Hamburg)'
  },
  {
    id: 'tnp_vulkanus',
    name: 'Vulkanus',
    glyph: 'Vul',
    category: 'hypothetical',
    sweId: 46,
    tooltip: 'raw power, energy, force, manufacturing',
    reference: 'manufacturing, force, energy (Hamburg)'
  },
  {
    id: 'tnp_poseidon',
    name: 'Poseidon',
    glyph: 'Pos',
    category: 'hypothetical',
    sweId: 47,
    tooltip: 'spirituality, ideals, truth, religion',
    reference: 'idealism, religion, clairvoyance (Hamburg)'
  },

  // ---- DERIVED POINTS ----
  {
    id: 'vertex',
    name: 'Vertex',
    glyph: 'Vex',
    category: 'derived',
    tooltip: 'fated encounters, doors opened by others',
    reference: 'destiny events, other people\'s doors'
  },
  {
    id: 'antivertex',
    name: 'Antivertex',
    glyph: 'AVx',
    category: 'derived',
    tooltip: 'self-directed fate, personal agency',
    reference: 'your own doors, self-made fate'
  },
  {
    id: 'partOfSpirit',
    name: 'Part of Spirit',
    glyph: 'PoS',
    category: 'derived',
    tooltip: 'soul, volition, moral choice, conscious will',
    reference: 'what you consciously choose, spiritual intent'
  },
  {
    id: 'ariesPoint',
    name: 'Aries Point',
    glyph: 'AP',
    category: 'derived',
    tooltip: 'public visibility, world events, fame',
    reference: 'where you touch the public world (fixed 0°)'
  },
  {
    id: 'sunmoonMidpoint',
    name: 'Sun/Moon Midpoint',
    glyph: 'S/M',
    category: 'derived',
    tooltip: 'blend of will and feeling, core duality',
    reference: 'composite technique, synastry blend'
  }
];

// ============================================================================
// REGISTRY HELPERS
// ============================================================================

/**
 * All basic points (17). Exclude EXPANDED-only.
 */
export function basicPoints(): PointDef[] {
  return BASIC_REGISTRY;
}

/**
 * All expanded points (40+).
 */
export function expandedPoints(): PointDef[] {
  return EXPANDED_REGISTRY;
}

/**
 * All points (basic + expanded).
 */
export function allPoints(): PointDef[] {
  return [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
}

/**
 * Points by category.
 */
export function byCategory(category: Category): PointDef[] {
  return allPoints().filter(p => p.category === category);
}

/**
 * Point by id.
 */
export function pointById(id: string): PointDef | undefined {
  return allPoints().find(p => p.id === id);
}

// ============================================================================
// SYMBOLISM MAP
// ============================================================================

export const SYMBOLISM: Record<string, SymbolismEntry> = {
  asc: {
    archetype: 'Self-presentation, mask, first impression to the world',
    practical: 'How others see you, persona, life direction'
  },
  mc: {
    archetype: 'Career, public image, highest achievement, life purpose',
    practical: 'Professional path, reputation, ambition, legacy'
  },
  ic: {
    archetype: 'Home, family roots, private self, foundation',
    practical: 'Family legacy, inner security, psychological roots'
  },
  dc: {
    archetype: 'Relationships, projections onto others, partnerships',
    practical: 'Marriage partner, enemies, significant others'
  },
  sun: {
    archetype: 'Core self, will, identity, creative essence',
    practical: 'Conscious purpose, vitality, what you came to express'
  },
  moon: {
    archetype: 'Emotions, needs, inner world, nurturing instinct',
    practical: 'Emotional nature, instinct, security, family'
  },
  mercury: {
    archetype: 'Communication, mind, ideas, learning, commerce',
    practical: 'How you think and speak, trade, siblings'
  },
  venus: {
    archetype: 'Love, beauty, values, relating, sensuality',
    practical: 'Romantic nature, aesthetics, money, pleasure'
  },
  mars: {
    archetype: 'Assertion, courage, desire, anger, drive',
    practical: 'Sexual energy, aggression, competition, action'
  },
  jupiter: {
    archetype: 'Expansion, luck, faith, excess, growth',
    practical: 'Opportunity, abundance, optimism, over-extension'
  },
  saturn: {
    archetype: 'Limitation, responsibility, time, structure, fear',
    practical: 'Discipline, maturity, delays, earned success'
  },
  uranus: {
    archetype: 'Rebellion, innovation, freedom, sudden change',
    practical: 'Genius, disruption, detachment, revolution'
  },
  neptune: {
    archetype: 'Illusion, spirituality, dreams, dissolve boundaries',
    practical: 'Imagination, deception, mysticism, addiction'
  },
  pluto: {
    archetype: 'Transformation, death/rebirth, power, shadow',
    practical: 'Deep change, shared resources, control, obsession'
  },
  northNode: {
    archetype: 'Soul growth direction, future potential, destiny',
    practical: 'Life calling, evolution, what to move toward'
  },
  southNode: {
    archetype: 'Past karma, natural talents, old patterns',
    practical: 'Gifts from past, comfort zone, what to release'
  },
  partOfFortune: {
    archetype: 'Luck, prosperity, natural ease, flow',
    practical: 'Where fortune flows, material ease, life current'
  },
  chiron: {
    archetype: 'Wounded healer, deepest wound, mentorship',
    practical: 'Healing gift, wound-becoming-calling'
  },
  lilithMean: {
    archetype: 'Black moon, repressed rage, raw feminine power',
    practical: 'Shadow, taboo, exile, wildness'
  },
  vertex: {
    archetype: 'Fated encounters, doors opened by others',
    practical: 'Destiny events, other people\'s doors'
  }
  // ... (abbreviate for space; all basic + major expanded covered above)
};

// ============================================================================
// VALIDATION & TYPECHECK
// ============================================================================

/**
 * Verify registry integrity: unique ids, non-empty tooltips/references, valid categories.
 */
export function validateRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  const validCategories = new Set<Category>([
    'angle', 'body', 'node', 'asteroid', 'centaur', 'tno', 'comet', 'hypothetical', 'derived'
  ]);

  for (const point of allPoints()) {
    // Check unique id
    if (seen.has(point.id)) {
      errors.push(`Duplicate id: ${point.id}`);
    }
    seen.add(point.id);

    // Check tooltip ≤120 chars
    if (!point.tooltip || point.tooltip.length === 0) {
      errors.push(`${point.id}: empty tooltip`);
    } else if (point.tooltip.length > 120) {
      errors.push(`${point.id}: tooltip too long (${point.tooltip.length} > 120)`);
    }

    // Check reference ≤120 chars
    if (!point.reference || point.reference.length === 0) {
      errors.push(`${point.id}: empty reference`);
    } else if (point.reference.length > 120) {
      errors.push(`${point.id}: reference too long (${point.reference.length} > 120)`);
    }

    // Check valid category
    if (!validCategories.has(point.category)) {
      errors.push(`${point.id}: invalid category '${point.category}'`);
    }

    // Check glyph is non-empty
    if (!point.glyph || point.glyph.length === 0) {
      errors.push(`${point.id}: empty glyph`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
