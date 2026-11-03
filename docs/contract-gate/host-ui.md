# Host recovery notice and writing copies

This local draft wires onUpgradeRequired into the existing app host. No
Supabase, Netlify or production configuration was changed in this step.

## Visible behavior

The app shows a non-modal, dismissible notice headed "Update needed to sync".
It does not claim that an update has already been downloaded. The reader can
save a writing copy, explicitly restore an available copy, or keep working.
Sync now reopens the notice if the module is still write-paused. No dialog,
focus transfer, cache eviction, asset staging or product reload is introduced.

A focused non-credential text control is briefly read-only while its snapshot
is written, then restored to its prior state. Completion, failure and unmount
release it. A one-second ceiling prevents a stalled backend freezing input;
later state changes are copied by the normal tracker. Other local controls
remain usable, and an unsaved form is never submitted by this path.

## What is copied

cloud-update-drafts.js writes an IndexedDB recovery store, never the cloud.
It allowlists these actual host state fields:

- input, shifted, notShifted
- dreamTitle, dreamText, dreamDate, dreamMoodB, dreamMoodA, dreamInterp
- orNoteText, orCmtText, icQuestion
- angelInput, animInput, otherInput
- draft.title, draft.note, draft.date

This is writing-draft coverage, not a copy of every form. Passwords, PINs,
MFA fields, birth forms, account forms, support forms, audio buffers, chart
results, arbitrary DOM values and the rest of application state are excluded.
The helper refuses a JSON copy larger than 1,000,000 characters. Source
records, cloud hash bookkeeping and pending deletion queues are untouched.

The IndexedDB database is incommon-update-drafts-v1, object store drafts.
Each record carries an account ID, profile ID and tab token, an exact scope
key, an allowlisted fields object, saved time and logical expiration time.
The tab token is an opaque UUID in sessionStorage under incommon.update.tab.
Copies become ineligible for restore after 24 hours and expired rows are
removed on subsequent store access, not by a background process while closed.
No recovery copy is included in account sync or ordinary backup/export.

The host does not copy data until a real account and active profile are known.
An existing copy is offered for explicit restore before it can be replaced.
Restore refuses to overwrite different current writing. Restored drafts stay
under tracking until the normal form clears them; an empty snapshot deletes
the copy. A late async result after unmount or an owner change cannot restore
or display old data in the new context.

Profile deletion calls removeProfile through the real ProfileManager cascade,
including deletion learned during pull. Signout and account-deletion handlers
request account copy cleanup. Failures produce a local cleanup-failed event;
they do not interrupt signout or replace the source records. Browser storage
failures remain real limits, not guarantees of physical erasure. Storage
read/write failures show a keep-this-tab-open message rather than a saved
claim. A retry after a failed read checks the existing copy before writing.

## Integration files

- app/cloud-update-drafts.js: storage adapter, allowlist, expiration and scopes.
- app/cloud-update-ui.js: host methods and async lifecycle guards.
- app/inCommonApp v2.dc.html: callback, notice, action bindings, lifecycle hooks.
- app/profile-manager.js: profile-copy removal during the deletion cascade.
- tools/build-bundle.js: module order and generated bundle inclusion.

## Verification

Test-only dependencies were installed outside the repository, with no app
runtime dependency or package manifest change:

```bash
npm --cache /tmp/incommon-ui-npm-cache install \
  --prefix /tmp/incommon-ui-test-deps --no-package-lock --ignore-scripts \
  fake-indexeddb@6.0.0 playwright@1.56.0
NODE_PATH=/tmp/incommon-ui-test-deps/node_modules node tools/test-cloud-update-ui.js
```

Nine local tests cover scope separation, field exclusion, expiration, deletion,
transaction completion, unavailable/blocked storage, safe restore, late
callbacks, account cleanup and the actual ProfileManager deletion method.

For the browser check, install Chromium into an isolated test location:

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/incommon-playwright-browsers \
  node /tmp/incommon-ui-test-deps/node_modules/playwright/cli.js install chromium
NODE_PATH=/tmp/incommon-ui-test-deps/node_modules \
PLAYWRIGHT_BROWSERS_PATH=/tmp/incommon-playwright-browsers \
  node tools/drive-cloud-update.js
```

The driver serves the actual source app on localhost and blocks every external
request. It uses a synthetic signed-in status fixture for the host presentation,
not a real authentication claim. Phone 390x844 and desktop 1440x900 both passed:
visible non-modal notice, real Chromium IndexedDB copy, explicit restore after
a test-driven reload, credential-field exclusion, 44px controls and no page
errors. Screenshots are in browser-ui/. A product reload button is not tested
or shipped; the test driver calls reload to verify persistence.

## Explicit form guard

See [form-coverage.md](form-coverage.md) for the shared field registry,
committed-copy checks and conservative unsupported-input blocking. The
notice now includes Check open forms. A passing form check does not authorize
reload or verify assets. Release confirmation text is excluded from copies.

The post-boot document/module/transport check is now implemented; see
[bootstrap-handshake.md](bootstrap-handshake.md). It does not authorize
leaving this page or confirm that a replacement asset is available.

## Still required before enabling a production gate

Replacement asset availability/staging, service-worker update coordination,
full editor coverage, explicit user reload confirmation and legacy manual
recovery remain open. The current worker already handles navigation network
first, with offline fallback. Blanket cache deletion is not an update plan.
The app must not offer reload on the strength of this partial writing-copy
allowlist alone. Native/store apps need their own update path.

Real device storage failures, WebKit/iOS, form composition/IME, recording,
multiple windows and duplicated-tab token inheritance are not signed off.
The account/profile/tab-ID tests establish logical scope checks, not a proof
that cloned browser tabs cannot inherit the same sessionStorage token.
Already-running legacy bundles cannot acquire these host methods remotely.
Independent review, production hook chaining, schema readiness and rollout
authorization remain separate requirements.

The follow-up staged-delivery draft adds the guarded confirmation action; see
[asset-delivery.md](asset-delivery.md). Earlier UI-only verification above is
historical. Its writing-copy scope and unsupported-form blocking still apply.
