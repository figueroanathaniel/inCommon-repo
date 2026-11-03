# Explicit form mapping and reload readiness

This is a local 2.9.7 draft. No remote hook or deployment was changed.

The shared app/ui-registry.js defines the writing fields that may be copied
and restored. app/cloud-update-drafts.js uses that schema, rather than
serializing arbitrary controls. The canonical host annotates actual controls
with data-recovery-field, data-reload-sensitive or explicit navigation-only
data-reload-ui markers. Release confirmation text is not a writing draft and
is excluded. Adding an editor requires deliberate mapping and restore tests.

app/reload-guard.js scans every visible native input, textarea, select and
contenteditable surface. It blocks filled sensitive or unsupported inputs,
unknown dirty containers, retained unsupported state and active operations.
It does not log or persist those inspected values. Navigation exceptions are
explicitly listed; sensitivity checks take precedence over those exceptions.
Unsupported selection controls conservatively block even without a detected
change. This can require finishing or leaving a form before updating.

Mapped writing requires a completed IndexedDB copy with matching current
fields, account, profile, tab and unexpired lifetime. DOM values must match
the mapped state and saved copy. Input/change events invalidate readiness;
late asynchronous checks cannot enable it after input or scope changes.
The notice exposes Check open forms. A future reload action must run the
check again immediately before navigation, not trust a cached UI flag.

A successful check returns formsReady true but allowed false with reason
ASSETS_NOT_VERIFIED. No reload button, cache eviction or bootstrap bypass is
introduced. A static 2.9.7 string does not establish working compatible assets
or authorize clearing the write pause. There is no persisted upgradeRequired
database flag in the current core module; its rejection latch is page-local.

## Verification

Run with the isolated test dependencies documented in host-ui.md:

```bash
NODE_PATH=/tmp/incommon-ui-test-deps/node_modules node tools/test-form-coverage.mjs
```

Nine tests cover sensitive-field exclusion, scanning multiple controls,
unmapped dirty forms, committed-copy readback and restore, every mapped field,
stale/expired/wrong-owner copies, DOM/state mismatch, unsupported controls,
retained non-DOM state and asynchronous invalidation. The actual-browser
driver also checks a mapped copy and an injected unsupported textarea at
390x844 and 1440x900, with external requests blocked. Both passed.

This is bounded coverage, not proof of every future editor, browser storage
failure, custom widget or hidden application state. Missing mappings fail
closed for scanned controls. Asset staging, post-reload validation, user
confirmation, legacy manual recovery and release authorization remain open.
