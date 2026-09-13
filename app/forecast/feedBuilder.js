/*! feedBuilder.ts: feed orchestration and filtering
 * Merges base items with synastry items, sorts by importance
 */

function buildFeed(baseItems, synastryItems, options) {
  const allItems = (baseItems || []).concat(synastryItems || []);

  const sorted = allItems.sort((a, b) => {
    if (b.importance !== a.importance) {
      return b.importance - a.importance;
    }
    return (a.id || '').localeCompare(b.id || '');
  });

  if (options && options.depth === 'headlines') {
    return sorted.slice(0, 5);
  }

  if (options && options.depth === 'deep') {
    return sorted.slice(0, 15);
  }

  return sorted.slice(0, 10);
}

function filterByDepth(items, depth) {
  if (depth === 'headlines') return items.slice(0, 5);
  if (depth === 'deep') return items.slice(0, 15);
  return items.slice(0, 10);
}

function capByFeedType(items, feedType) {
  const caps = { 'homepage': 3, 'today': 10, 'spirit': 20 };
  const cap = caps[feedType] || 10;
  return items.slice(0, cap);
}

function displayName(item) {
  if (item.partner) {
    return item.partner.name || 'Unknown';
  }
  return item.body || 'Unknown';
}

function visualMarker(item) {
  if (item.synastry) return '◈';
  if (item.isNew) return '●';
  return '○';
}

function synastryExplainer(item) {
  if (!item.synastry || !item.partner) return null;
  return 'with ' + (item.partner.name || 'them');
}

module.exports = {
  buildFeed,
  filterByDepth,
  capByFeedType,
  displayName,
  visualMarker,
  synastryExplainer
};
