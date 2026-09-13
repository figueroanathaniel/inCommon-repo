/*! forecast/news/synastryTemplates.ts
 * Headlines for synastry items (two-person contacts)
 * Structure mirrors transit templates, keyed for localization
 * Format: {planet1} is {aspect} their {planet2}, {name}. Headline text.
 */

export interface SynastryTemplate {
  id: string;
  type: string;  // aspect name
  templates: string[];  // {planet1} {aspect} their {planet2}, {name}
}

export const SYNASTRY_TEMPLATES: SynastryTemplate[] = [
  // ============================================================================
  // SYNASTRY: Major Aspects
  // ============================================================================

  {
    id: 'synastry-conjunction',
    type: 'conjunction',
    templates: [
      '{planet1} and their {planet2} meet today. Same frequency between you.',
      'A merger: your {planet1} conjunct their {planet2}, {name}. Two energies aligned.',
      'Your {planet1} finds their {planet2} today. You\'re speaking the same language.',
    ]
  },

  {
    id: 'synastry-sextile',
    type: 'sextile',
    templates: [
      'Your {planet1} sextile their {planet2} today, {name}. Diplomacy gets a green light.',
      'A sextile between you two: your {planet1} to their {planet2}. Easy conversation.',
      'Your {planet1} and their {planet2} are friends today. Lean on it.',
    ]
  },

  {
    id: 'synastry-square',
    type: 'square',
    templates: [
      'Your {planet1} square their {planet2}, {name}. Friction between you. Channel it.',
      'A hard angle: your {planet1} and their {planet2} want different things today.',
      'Your {planet1} meets resistance in their {planet2}. That\'s the work of the day.',
    ]
  },

  {
    id: 'synastry-trine',
    type: 'trine',
    templates: [
      'A gift between you: your {planet1} trine their {planet2}, {name}. It flows.',
      'Your {planet1} and their {planet2} are in conversation. The air is clear.',
      'Rare ease between you today: your {planet1} trine their {planet2}. Use it.',
    ]
  },

  {
    id: 'synastry-opposite',
    type: 'opposite',
    templates: [
      'Your {planet1} opposite their {planet2}, {name}. You\'re seeing both sides.',
      'Two poles between you: your {planet1} and their {planet2}. Balance is today\'s work.',
      'Mirror moment: your {planet1} opposite their {planet2}. Who is the other seeing?',
    ]
  },

  // ============================================================================
  // SYNASTRY: Station & Ingress (uncommon but possible)
  // ============================================================================

  {
    id: 'synastry-station-retrograde',
    type: 'station-retrograde',
    templates: [
      'Their {planet} stations retrograde today, {name}. What reverses between you.',
      'Lookback time: a pause in their {planet}. This may echo in what you share.',
    ]
  },

  {
    id: 'synastry-station-direct',
    type: 'station-direct',
    templates: [
      'Their {planet} stations direct today, {name}. Forward motion resumes between you.',
      'The pause lifts: their {planet} direct. What was held returns.',
    ]
  },
];

/**
 * Get synastry templates for a specific aspect type
 */
export function synastryTemplatesFor(type: string): string[] {
  const template = SYNASTRY_TEMPLATES.find(t => t.type === type);
  return template?.templates || [];
}

/**
 * Pick a random synastry template
 */
export function pickSynastryTemplate(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Fill a synastry template with values
 * Example: "{planet1} trine their {planet2}, {name}"
 *          => "Venus trine their Moon, Lucia"
 */
export function fillSynastryTemplate(
  template: string,
  planet1: string,
  planet2: string,
  partnerName: string,
  aspect: string
): string {
  let result = template;
  result = result.replace(/\{planet1\}/g, planet1);
  result = result.replace(/\{planet2\}/g, planet2);
  result = result.replace(/\{name\}/g, partnerName);
  result = result.replace(/\{aspect\}/g, aspect);
  return result;
}

/**
 * List all available synastry aspect types
 */
export function availableSynastryTypes(): string[] {
  return [...new Set(SYNASTRY_TEMPLATES.map(t => t.type))];
}
