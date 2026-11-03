# Contract rejection recovery draft

Implemented in the local 2.9.7 draft only. No remote hook is active for this
change, and no production approval follows from the local tests.

## Classification and state

A sync write enters `upgradeRequired` only for the complete SDK response:
HTTP status 423, error code PT423 and error.details CLIENT_UPGRADE_REQUIRED.
Maintenance rejections, other status codes, other details and matching text
alone do not enter this state. The gate definition must keep that signature.

`push()` returns `{ok:false, reason:'upgradeRequired', status:423, code:'PT423',
details:'CLIENT_UPGRADE_REQUIRED', error:'Update the app to resume syncing.'}`.
Partial sent/skipped counts remain on the first result. `status()` keeps the
existing authenticated mode and adds `upgradeRequired` and `writeState`.
`sync()` exposes the same reason and retains its separate pull/push results.

The latch lasts for this runtime. There is no in-place resume switch. A fresh
runtime may try its declared contract again; another rejection pauses it again.
Reinitializing the same module or changing accounts does not clear the latch.
The latch itself is not persisted, so a new client can retry preserved records.

## What remains on the device

Local Throughline and Oki arrays are durable source records, not a queue that
loses items on successful upload. Successful rows advance only their hash
entries in incommon_cloud_map_v2. A rejected row is never acknowledged. Rows
acknowledged before a response-style rejection keep their hashes, and an
upgraded fresh runtime skips them while replaying the remaining rows.

The deletion outbox in incommon_cloud_outbox_v2 keeps failed and unattempted
operations, including operations queued while its request was in flight.
Local edits still write through ProfileManager. Nothing in this recovery path
clears site data, storage keys, hashes, session storage or service-worker caches.
Storage is the configured storage interface, normally localStorage in the web
app; this implementation does not introduce an IndexedDB migration.

This does not guarantee persistence if the browser refuses storage writes,
the user clears site data, or an unsaved form has never reached ProfileManager.
Transport response loss can also require replay of already committed rows.
Modern keyed replay depends on the reviewed composite schema contract.

## Writes pause, reads remain available

The rejection cancels the pending push debounce. Later schedule calls, push
attempts and deletion flushes do not initiate new sync writes. Remaining rows
in a batch stop after the rejection. Pull remains available and may merge
server reads under its existing rules, but it cannot flush queued deletions
while paused. Visibility/network-triggered sync may read; its push is refused
locally. Already in-flight requests are not retroactively canceled or rolled
back by a client latch.

## Host UI integration

The existing onSessionChange subscribers see the changed status. init also
accepts an optional onUpgradeRequired(result) callback. It is called once per
runtime, after the relevant hash/outbox save path completes. The callback may
check an update manifest and offer a reload. A callback failure does not clear
the latch or discard data. Automatic background asset swapping, forced reload,
cache eviction and a rendered update prompt are not implemented by this module.

The host must own the next steps:

1. Show that sync needs an app update while local editing remains available.
2. Check for an update without deleting active/offline cached assets.
3. Persist pending forms using their normal application handlers. Do not assume
   browser idle time means every draft is saved.
4. Offer an explicit reload after the user confirms. Keep site data intact.
5. Verify the new client loaded, rebuild from existing storage and retry. If
   the gate still refuses, keep the paused state and report the update problem.

That host UI work and browser/service-worker tests are release blockers, not
features provided by the callback. No reload or UI confirmation is invoked in
the recovery tests.

## Legacy manual recovery

Already-running 2.9.5 and 2.9.6 code cannot gain this handler remotely. Earlier
tests showed generic failed push results and retained local records for scoped
mocked scenarios, not universal browser safety. Do not assume crashes or
guarantee that a normal reload replaces every cached asset.

For a returning legacy instance, save local drafts first, preserve the browser
profile and site data, and use a reviewed update path while online. Do not ask
the reader to clear site storage or uninstall as an upgrade step. Confirm that
the updated client actually loaded before expecting backlog replay. If the
update cannot load, keep local data and the write refusal until recovery is
available. An old client remaining locked is not successful coexistence.

## Local validation

Run `node tools/test-recovery-scenarios.mjs`. The built-in Node test framework
needs no AVA package. Tests drive actual init, push, schedule, pull and sync in
isolated vm runtimes, with string-only storage snapshots, explicit fixture PM
and a stateful mocked transport.

Seven tests cover both child tables, partial acknowledgment, scheduled retry
suppression, post-pause local edits and deletion queuing, read availability,
fresh-runtime retry and ID stability, deletion queued during rejection,
negative error classification, remaining generic batch writes, and host
callback failure. They retain both source entries after acknowledgment.

`node tools/check-write-contract.js` separately drives the actual vendored SDK
with mocked HTTP to check response classification and no further HTTP pushes
after pause, as well as header/auth/Prefer propagation. These are local tests,
not proof of browser upgrade, real network loss, cross-device concurrency,
RLS/MFA, full ProfileManager behavior or remote contract-gate behavior.
