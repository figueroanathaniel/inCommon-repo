# Write contract draft

Starting source: 1b2aa0c, taskforce/04-visuals-webgl.
Owner requested the client header and a sandbox integration harness.
No production deployment, migration, role override, merge, push or external
message is part of this change. A temporary sandbox-only contract probe has
now passed and was fully removed; see sandbox-validation.txt.

The sync client now declares `X-InCommon-Write-Contract: v2-composite-upsert`
through Supabase `global.headers`. Its draft version is 2.9.7, and the cover
loader has the same cache version. Auth options remain at library defaults.
The SDK adds this header to reads as well as writes. Direct fetch calls for
support and voice, and the separate cover auth client, are outside the sync
client and this gate's two-table scope.

This is a caller-controlled write-shape declaration, not a credential or proof
of application adoption. It must never replace RLS, ownership, MFA, consent,
deletion checks or payload validation. Unchanged 2.9.6 has no header and will
be rejected like 2.9.5. A caller forging the declaration can still send a bad
write. No claim of universal translation or coexistence is made.

The local draft now also implements structured upgrade rejection and a
page-local write pause. See [recovery.md](recovery.md) for classification,
acknowledgments, pending deletions and the host callback. The callback now has
a local presentation implementation: see [host-ui.md](host-ui.md) for the
notice, writing-copy coverage and remaining asset-staging/reload work.
The explicit registry and fail-closed form checks are documented in
[form-coverage.md](form-coverage.md). Form readiness never clears the write
pause or authorizes reload by itself.
The post-boot document/module/transport check is described in
[bootstrap-handshake.md](bootstrap-handshake.md). It cannot clear a server
rejection in the same runtime or authorize leaving a page with unsaved forms.

## Local verification

`node tools/check-write-contract.js` drives actual `init()` and the vendored
Supabase SDK with a mocked fetch. It checks both tables for POST, PATCH,
DELETE and GET, and preserves API key, authorization, Prefer and conflict
query semantics. The existing K20 module test now expects the intentional
global-header option and continues to reject auth-option overrides.

## Sandbox integration harness

`tools/test-contract-gate.mjs` uses native fetch and requires no new package.
Inject these through the environment, never source files or chat:

- SUPABASE_URL: exact pinned sandbox origin from tools/fixtures/remote-sync-sandbox.json.
- SUPABASE_ANON_KEY: sandbox public API key.
- SUPABASE_TEST_USER_A_JWT: real disposable user session with a provisioned
  account, satisfying the existing MFA requirements where applicable.

With a reviewed sandbox hook already active:

```bash
NODE_USE_ENV_PROXY=1 node tools/test-contract-gate.mjs
```

The script drives the actual module init seam to obtain the header. It then
authenticates the supplied session, creates a real owner profile and exercises
both child endpoints with modern composite upserts, stable-ID replay, PATCH
and DELETE. Missing, empty, old, malformed and combined header values must
return HTTP 423, code PT423, details CLIENT_UPGRADE_REQUIRED for all four
mutation verbs. Each rejected mutation is followed by an authenticated read
without the header, proving read availability and unchanged stored payload.
This is request-shape integration testing, not a full browser sync journey.

The script removes its profile and cascading rows in finally and verifies
cleanup. It never creates Auth users, changes hooks or applies SQL. The caller
owns session signout and deletion of the disposable Auth user. Cleanup failure
makes the run fail. Missing session, invalid target, production target and
unsafe override fail before a write. It requires a provisioned sandbox schema
with the composite constraints; it never bootstraps one.

## Gate definition and configuration review

`sandbox-hook-draft.sql` is a definition-only review draft. It checks the
documented request.headers JSON and lowercased header name, with exact value
matching. Missing headers fail closed on the two child mutation endpoints;
other endpoints and reads are unchanged. No SECURITY DEFINER privilege is
needed because it reads only the request settings.

Inspect stored database and role settings, including database-specific role
settings, and the effective PostgREST configuration. SHOW in an unrelated SQL
session does not establish the daemon setting. If another pre-request hook
exists, compose explicit, reviewed calls to it and this function. An override
alone does not chain. Preserve and test existing checks, snapshot the previous
configuration for rollback, bind via authenticator, notify PostgREST to reload,
and prove behavior with real HTTP requests. This draft intentionally does not
register a hook.

## Release limits

The integration suite passed all 48 logged sandbox cases; no hook remains
active from that run. See sandbox-validation.txt and sandbox-contract-output.txt.
A read-only
sandbox OPTIONS request from the site's origin returned HTTP 200 and explicitly
allowed x-incommon-write-contract. This is not a browser execution result.
Production
remains 2.9.5 as last reported, with no new live-version verification here.
Do not ship 2.9.7 before its composite constraints exist. Do not enable this
gate until denied cached/offline clients have a reviewed upgrade and retry
experience. A 423 preserves the possibility of later retry but does not force
tabs or service workers to upgrade. Browser CORS preflight must permit the new
header. In-flight requests, RPC and other writers, RLS negative cases, null
keys, partial sync, independent review and rollback still need appropriate
release validation. Never use the incomplete migration directory as a reason
to run unreviewed production db push.
