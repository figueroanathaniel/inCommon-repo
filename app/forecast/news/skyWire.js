/*! skyWire.js: public deterministic feed builder
 * Builds SkyWireItem collection with importance ceiling 93, no reader context
 */

const PUBLIC_CEILING = 93;

function buildSkyWireItem(contact, importance) {
  const capped = Math.min(importance, PUBLIC_CEILING);
  return {
    id: generateSkyWireId(contact),
    category: 'public_transit',
    importance: capped,
    body: contact.body || 'Unknown',
    aspect: contact.aspect || 'contact',
    orb: contact.orb || 0,
    isExact: contact.isExact || false
  };
}

function generateSkyWireId(contact) {
  return 'sky-' + (contact.body || 'unknown').replace(/\s+/g, '-').toLowerCase() +
         '-' + (contact.aspect || 'transit').replace(/\s+/g, '-').toLowerCase() +
         '-' + Date.now();
}

function buildSkyWireFeed(items) {
  const sorted = items
    .filter(item => !item.synastry && item.category !== 'transit')
    .sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return (a.id || '').localeCompare(b.id || '');
    });

  return {
    version: '1.0.0',
    date: new Date().toISOString().split('T')[0],
    generatedAt: new Date().toISOString(),
    items: sorted,
    stats: {
      count: sorted.length,
      maxImportance: sorted.length > 0 ? sorted[0].importance : 0
    }
  };
}

function validateSkyWireItem(item) {
  if (!item) return false;
  if (item.synastry) return false;
  if (item.partner) return false;
  if (item.isNew === true) return false;
  return item.importance <= PUBLIC_CEILING;
}

module.exports = {
  PUBLIC_CEILING,
  buildSkyWireItem,
  generateSkyWireId,
  buildSkyWireFeed,
  validateSkyWireItem
};
