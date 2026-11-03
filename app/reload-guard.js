/* Local form readiness only. Does not verify assets, reset sync or reload. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ui-registry'));
  else root.ReloadGuard = factory(root.SafeFormRegistry);
}(typeof self !== 'undefined' ? self : this, function (registry) {
  'use strict';
  function retained(value) {
    if (typeof value === 'string') return !!value;
    if (Array.isArray(value)) return value.some(retained);
    if (value && typeof value === 'object') return Object.keys(value).some(function (key) { return retained(value[key]); });
    if (typeof value === 'number' || value === true) return true;
    return false;
  }
  function fail(reason) { return { formsReady: false, allowed: false, reason: reason,
    message: 'Finish or save the open form before updating.' }; }
  function forms(options) {
    var state = options.state, document = options.document, snapshot = options.snapshot, scope = options.scope;
    if (!state || !document || !registry || !scope) return fail('FORM_CONTEXT_UNAVAILABLE');
    if (state.recOn || state.typing || state.flushing || Object.keys(state).some(function (key) {
      return /Busy$/.test(key) && !!state[key];
    })) return fail('WORK_IN_PROGRESS');
    /* Closed but retained editors and non-DOM secrets also need protection.
       Do not copy their values or put them into diagnostics. */
    var pending = ['pnotes', 'sightFree', 'dreamAssoc', 'dreamRej', 'cloudPassword', 'cloudRecoveryPin',
      'mfCode', 'mfSecret', 'phCode', 'formPin', 'memPin', 'pin', 'sharePin',
      'recText', 'recInterim', 'supText', 'supEmail', 'adText', 'delName', 'relText'];
    if (pending.some(function (key) { return retained(state[key]); })) return fail('UNSUPPORTED_RETAINED_DATA');
    if (state.dreamLucid || state.dreamRecurring || state.dreamSleep) return fail('UNSUPPORTED_FORM_STATE');
    if ((state.formMode && state.form) || state.synForm || state.synManual ||
        (state.auth && state.af && retained(state.af))) return fail('UNSUPPORTED_FORM');
    var expected;
    try { expected = registry.pick(state); } catch (e) { return fail('INVALID_DRAFT_SCHEMA'); }
    if (options.saving) return fail('BACKUP_IN_PROGRESS');
    if (Object.keys(expected).length) {
      if (!snapshot || snapshot.account !== scope.account || snapshot.profile !== scope.profile || snapshot.tab !== scope.tab ||
          !Number.isFinite(snapshot.expires) || snapshot.expires <= (options.now || Date.now)()) return fail('BACKUP_NOT_COMMITTED');
      try {
        if (JSON.stringify(registry.pick(snapshot.fields || {})) !== JSON.stringify(expected)) return fail('BACKUP_STALE');
      } catch (e) { return fail('INVALID_BACKUP_SCHEMA'); }
    }
    var controls;
    try { controls = Array.from(document.querySelectorAll('input,textarea,select,[contenteditable="true"]')); }
    catch (e) { return fail('FORM_SCAN_FAILED'); }
    for (var i = 0; i < controls.length; i++) {
      var field = controls[i];
      if (!field.getClientRects().length) continue;
      var type = String(field.type || '').toLowerCase();
      if (['hidden', 'button', 'submit', 'reset', 'image'].indexOf(type) !== -1) continue;
      var raw = field.isContentEditable ? field.textContent : field.value;
      var filled = !!raw || (field.files && field.files.length) || field.checked;
      var sensitive = type === 'password' || /password|one-time-code|cc-/.test(field.autocomplete || '') ||
        field.getAttribute('data-reload-sensitive') === 'true';
      if (sensitive) { if (filled) return fail('SENSITIVE_INPUT'); else continue; }
      if (!field.isContentEditable && type !== 'file' && registry.uiOnly.indexOf(field.getAttribute('data-reload-ui')) !== -1) continue;
      if (['checkbox', 'radio', 'range'].indexOf(type) !== -1 || field.tagName === 'SELECT') return fail('UNSUPPORTED_CONTROL');
      if (!filled && field.getAttribute('data-dirty') !== 'true') continue;
      var path = field.getAttribute('data-recovery-field');
      if (!path || registry.paths.indexOf(path) === -1 || field.isContentEditable || type === 'file') return fail('UNSUPPORTED_RETAINED_DATA');
      if (registry.value(state, path) !== String(raw)) return fail('INPUT_NOT_CAPTURED');
      if (!snapshot || registry.value(snapshot.fields || {}, path) !== String(raw)) return fail('BACKUP_NOT_COMMITTED');
    }
    /* Future editors can mark dirty containers even if they expose no native
       input. Unknown dirty surfaces must never default to eligible. */
    var dirty = document.querySelectorAll('form[data-dirty="true"],[data-reload-dirty="true"]');
    for (var j = 0; j < dirty.length; j++) {
      if (dirty[j].getClientRects().length) return fail('UNSUPPORTED_DIRTY_SURFACE');
    }
    return { formsReady: true, allowed: false, reason: 'ASSETS_NOT_VERIFIED',
      message: 'Draft copies are current. The update still needs verification.' };
  }
  return { evaluate: forms };
}));
