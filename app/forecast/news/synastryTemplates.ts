/*! forecast/news/synastryTemplates.ts
 * Headlines for synastry items (two-person contacts)
 * Structure mirrors transit templates, keyed for localization
 * Format: {body1} is {aspect} their {body2}, {name}. Headline text.
 */

export interface SynastryTemplate {
  id: string;
  type: string;  // aspect name
  templates: string[];  // {body1} {aspect} their {body2}, {name}
}

export const SYNASTRY_TEMPLATES: SynastryTemplate[] = [
  // ============================================================================
  // SYNASTRY: Major Aspects
  // ============================================================================

  {
    id: 'synastry-conjunction',
    type: 'conjunction',
    templates: [
      '{body1} and their {body2} meet today. Same frequency between you.',
      'A merger: your {body1} conjunct their {body2}, {name}. Two energies aligned.',
      'Your {body1} finds their {body2} today. You\'re speaking the same language.',
    ]
  },

  {
    id: 'synastry-sextile',
    type: 'sextile',
    templates: [
      'Your {body1} sextile their {body2} today, {name}. Diplomacy gets a green light.',
      'A sextile between you two: your {body1} to their {body2}. Easy conversation.',
      'Your {body1} and their {body2} are friends today. Lean on it.',
    ]
  },

  {
    id: 'synastry-square',
    type: 'square',
    templates: [
      'Your {body1} square their {body2}, {name}. Friction between you. Channel it.',
      'A hard angle: your {body1} and their {body2} want different things today.',
      'Your {body1} meets resistance in their {body2}. That\'s the work of the day.',
    ]
  },

  {
    id: 'synastry-trine',
    type: 'trine',
    templates: [
      'A gift between you: your {body1} trine their {body2}, {name}. It flows.',
      'Your {body1} and their {body2} are in conversation. The air is clear.',
      'Rare ease between you today: your {body1} trine their {body2}. Use it.',
    ]
  },

  {
    id: 'synastry-opposite',
    type: 'opposite',
    templates: [
      'Your {body1} opposite their {body2}, {name}. You\'re seeing both sides.',
      'Two poles between you: your {body1} and their {body2}. Balance is today\'s work.',
      'Mirror moment: your {body1} opposite their {body2}. Who is the other seeing?',
    ]
  },

  // ============================================================================
  // SYNASTRY: Station & Ingress (uncommon but possible)
  // ============================================================================

  {
    id: 'synastry-station-retrograde',
    type: 'station-retrograde',
    templates: [
      'Their {body} stations retrograde today, {name}. What reverses between you.',
      'Lookback time: a pause in their {body}. This may echo in what you share.',
    ]
  },

  {
    id: 'synastry-station-direct',
    type: 'station-direct',
    templates: [
      'Their {body} stations direct today, {name}. Forward motion resumes between you.',
      'The pause lifts: their {body} direct. What was held returns.',
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
 * Example: "{body1} trine their {body2}, {name}"
 *          => "Venus trine their Moon, Lucia"
 */
export function fillSynastryTemplate(
  template: string,
  body1: string,
  body2: string,
  partnerName: string,
  aspect: string
): string {
  let result = template;
  result = result.replace(/\{body1\}/g, body1);
  result = result.replace(/\{body2\}/g, body2);
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
