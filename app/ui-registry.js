/* Explicit writing schemas shared by persistence, restore and reload checks. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SafeFormRegistry = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var TEXT = ['input', 'shifted', 'notShifted', 'dreamTitle', 'dreamText', 'dreamDate',
    'dreamMoodB', 'dreamMoodA', 'dreamInterp', 'orNoteText', 'orCmtText', 'icQuestion',
    'angelInput', 'animInput', 'otherInput'];
  var PATHS = TEXT.concat(['draft.title', 'draft.note', 'draft.date']);
  function value(state, path) {
    if (PATHS.indexOf(path) === -1) return undefined;
    var v = path.indexOf('draft.') === 0 ? (state.draft || {})[path.slice(6)] : state[path];
    return typeof v === 'string' ? v : undefined;
  }
  function pick(state) {
    var out = {};
    TEXT.forEach(function (key) { if (typeof state[key] === 'string' && state[key]) out[key] = state[key]; });
    if (state.draft && (state.draft.title || state.draft.note)) {
      out.draft = {};
      ['title', 'note', 'date'].forEach(function (key) {
        if (typeof state.draft[key] === 'string') out.draft[key] = state.draft[key];
      });
    }
    if (JSON.stringify(out).length > 1000000) throw Error('Draft copy is too large');
    return out;
  }
  function restore(current, saved) {
    var fields = pick(saved), patch = {};
    Object.keys(fields).forEach(function (key) {
      var here = current[key], occupied = key === 'draft' ? here && (here.title || here.note) : !!here;
      if (occupied && JSON.stringify(here) !== JSON.stringify(fields[key])) throw Error('Current writing differs from the saved copy');
      patch[key] = fields[key];
    });
    return patch;
  }
  var UI_ONLY = ['horoDate', 'arcQuery', 'q', 'lexQuery', 'atlasQuery', 'apQuery',
    'bnQuery', 'ilQuery', 'dlQuery', 'chartExpandSearch', 'searchQuery', 'orTpPermille'];
  return { paths: Object.freeze(PATHS), uiOnly: Object.freeze(UI_ONLY), value: value, pick: pick, restore: restore };
}));
