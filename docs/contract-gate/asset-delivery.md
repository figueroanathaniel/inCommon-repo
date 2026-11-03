# Staged shell and user-confirmed reload

Local 2.9.7 draft on draft/recovery-2.9.7-20261103. No production deployment,
SQL, hook registration or monitor change is part of this work.

## Delivery boundary

The builder emits release-manifest.json with an exact release/contract,
build ID, compiled app.html byte count and SHA-256 digest. The build ID covers
the inlined app, cover source and bundle worker. Both delivery documents
carry it alongside the release token. The manifest is written through a
temporary file and rename, after app output. Deploy artifacts must travel
together. This manifest stages the compiled app shell, not every optional
runtime download, external font or native/store binary.

update-assets.js is shared between the inlined page and the bundle worker.
The worker fetches the same-origin manifest and app with no-store, no cookies
and redirect rejection. A fixed app.html path, release, contract, build ID,
byte count and digest are checked before saving the public response. The
separate incommon-update-v1-<build> cache receives its receipt last. A partial,
corrupt or expired receipt is ineligible. Staged eligibility lasts 30 minutes;
this is a logical lifetime, not a promise of physical deletion on expiry.
No user records, JWTs, source queues or writing copies are staged in caches.

The worker serves this app only on an explicit app.html?ic_update=<build>
navigation. Ordinary cache lookup is restricted to the worker runtime cache,
so staging cannot silently replace an unrelated tab's offline response.
On confirmed navigation it re-verifies the staged app, replaces only its
canonical runtime app.html entry and serves the exact response, including
offline. A missing/corrupt/expired stage returns a static 503 with Back
instructions. It never executes an unknown old cached program as a confirmed
update. The source and bundle workers remove only obsolete caches in their
own respective namespaces; neither wipes arbitrary same-origin caches.
No worker is unregistered and no blanket cache eviction is performed.

## Host interaction

An upgrade notice starts one background check; Check for update allows an
explicit retry. A compatible controlling worker and secure browser context
are required. Source previews and native/store shells fail closed and retain
local work. The runtime updates its existing registration with import-cache
bypass, waits for activation, and uses a bounded MessageChannel exchange.
Old workers without the protocol time out safely. There is no automatic reload.

After staging, Reload to update is the explicit confirmation action. Its UI
is disabled while work is being checked or form readiness is false. That flag
is not authorization: the coordinator re-verifies the staged cache, reads the
committed scoped IndexedDB copy, rechecks the account/profile/tab and active
worker/page, then runs the actual live form guard. There is no asynchronous
gap or React state update between that last guard and location.assign.
Sensitive, unsupported, stale, uncommitted or newly edited inputs still block.
Failure leaves the current page usable and asks the reader to finish or save
open work and check again. Existing copy/restore rules are unchanged.

A session-scoped navigation intent records the target build, attempt nonce,
owner/profile/tab and expiry, not form contents. The new browser init checks
its document/module/transport evidence plus that intent against the actual
booted build before session-triggered sync. Only a matching boot removes the
navigation bookkeeping and cleans its query parameters. Record arrays, hashes,
deletions, writing copies and a live server rejection are never cleared.
Copies remain available for explicit, conflict-safe restore in the same tab.

A stale or missing boot keeps writes paused. A failed/expired reload context
can deliberately re-stage the same build using Check for update, then run the
same guarded, user-confirmed flow again. Background checks cannot authorize a
same-build retry. This does not clear a rejection in the existing runtime.
Ordinary server rejection with an already-current build does not offer an
endless reload loop. Keep working remains available.

## Validation and limits

```bash
node tools/test-update-delivery.mjs
NODE_PATH=/tmp/incommon-preservation-test-deps/node_modules \
PLAYWRIGHT_BROWSERS_PATH=/tmp/incommon-playwright-browsers \
node tools/drive-update-delivery.js
```

The local test suite checks corrupt/missing/expired stages, path traversal,
wrong contract, fresh fetch options, committed-copy/owner/worker races,
explicit recovery, actual core boot ordering, targeted worker cache behavior,
static failure fallback and generated manifest consistency. Browser checks
serve the compiled app and real service worker on localhost, stage a newer
build fixture, block an unmapped writing surface, navigate offline on the
actual button, acknowledge the target build and explicitly restore the copy.
They run at 390x844 and 1440x900 and preserve an unrelated cache. Separate
missing-manifest and corrupt-shell fixtures offer no reload and retain text.
The host sign-in status is synthetic; these are not real authenticated sync,
RLS, production CDN or full device tests. External browser requests are blocked.

A digest over a same-origin manifest is consistency evidence, not independent
publisher authentication. Browser storage can fail or be evicted. Already
running legacy code cannot acquire this new flow retroactively. WebKit/iOS,
native/store updates, IME/custom editors, cloned-tab ownership, every optional
asset and long-lived device/storage failures are not signed off. Production
schema/hook composition, other writers, in-flight requests, rollback,
independent review and deployment authorization remain separate requirements.
