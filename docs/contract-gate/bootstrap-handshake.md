# Post-reload local asset handshake

Local 2.9.7 draft only. No server hook, deployment or production change.

Both the cover index document and canonical app document declare an immutable
__INCOMMON_RELEASE_TOKEN__ before their other scripts. The builder requires
that token, the bootstrap verifier release and the actual sync module VERSION
to agree. The verifier is included before sync initialization in the app.

At browser init, before the SDK can restore a session and request sync, the
core checks the document token, its own version and write contract, the actual
SDK transport header options, and the push/pull interfaces. Missing or
mismatched evidence latches upgradeRequired. Mutations and automatic retries
remain paused, while reads and local editing remain available. The status
object exposes assetHandshake for diagnostics. A missing verifier also blocks.

This checks local asset compatibility; it is not a cryptographic integrity
proof, authentication, a server acceptance check or a test of every app
feature. A malicious caller can assert the header. RLS remains authoritative.
The cover token cannot attest to a separately loaded app: app.html declares
its own token and runs its own handshake.

There is no persisted sync_state or upgradeRequired storage flag to clear.
The existing rejection latch remains page-local. A matching fresh runtime can
build its plan and retry stored records through the existing sync lifecycle.
It does not erase records, hashes, deletion queues or recovery copies. A
subsequent PT423 rejection stays latched even when local boot evidence passes.
Changing a token or calling init again in that page cannot promote it.

Headless tests have no delivery document to attest. The new bootstrap suite
explicitly supplies a browser-like document and loads the real verifier and
sync source into fresh VM contexts. Existing headless tests keep their seams.
Already-running legacy clients cannot acquire this new check remotely.

## Verification

```bash
node tools/test-bootstrap-handshake.mjs
node tools/test-recovery-scenarios.mjs
node tools/check-write-contract.js
```

Bootstrap tests cover missing, stale and malformed tokens, missing verifier,
module/transport/interface mismatches, immutable document tokens, retained
storage, available reads, paused scheduling and fresh-runtime replay after a
partial acknowledgment. The shared stateful mock transport models composite
identity and conflicts; this is not another real-server precedence test.
Chromium checks the actual source-app handshake at phone and desktop sizes.

The form guard intentionally still returns ASSETS_NOT_VERIFIED for a future
reload. This post-boot check does not establish that a replacement bundle is
available before leaving the current page. Asset staging, safe user-confirmed
navigation, restoration and stale-asset recovery UX must be wired and tested
before exposing a reload action. No cache deletion or automatic reload ships
with this step. Independent review and production authorization remain open.
