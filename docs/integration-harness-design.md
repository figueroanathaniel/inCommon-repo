# The integration harness, redesigned

Written before any test code changed, per the standing rule: verification
precedes the build. Superseded by nothing; this is the record of why the
rewrite looks the way it does.

## What the phase was, and why it stopped meaning anything

`verification/Test Runner V1.2.dc.html` dates from the single-blob
`InCommonCore` prototype: one JS object (`profile`, `msgs`, `stellaCtx`)
persisted under `incommon_state_v1`, with a `?test=1` query flag that
namespaced every storage key with `_test` so a test run would not touch a
real reader's data. Its twelve `IT*` assertions drove that object through
`window.__incommon`: a debounced write landing in the namespaced store, a
Life Path number matching between the app and `incommon-core.js`, birth-time
modes suppressing angle-dependent rows, Stella's citation gate withholding an
uncited reply, a two-person consent revoke, "forget conversation," a pacing
limit, and a delete-reload-verify-empty round trip.

None of that object exists any more. The app is ProfileManager: multiple
profiles, each with its own consent record and memory store, no `msgs`, no
`stellaCtx`, no `window.__incommon`. Oki (Stella's current name) is unwired
per the V1.6.0 removal; `send()` returns a debug note and touches nothing.
So the phase was not failing on a regression, it was asserting facts about a
program that no longer runs. Loosening its timeout, or teaching it to find
`window.__incommon` faster, would have kept a suite green over a piece of
architecture nobody would recognize.

## What the phase is for now

Not a second copy of `Verification v6.0.dc.html`. That suite already runs
276 assertions over layout, contrast, ADA, the removal phase and the new
surfaces, against the real app via `window.__incommonApp`, and it works. This
phase sits beside it and stays small on purpose: it is the companion to the
**core module suite** (`incommon-core.js` + `handoff/tests.js`, "same code the
app runs"), and its job is the risk that suite was never built to see —
**what happens when local state might leave the device.**

Four things, named because each is a place a wrong answer is silent rather
than loud:

1. **Consent gating.** A memory whose consent is off must never be built into
   a push, a pull, or an inspect count, regardless of whether it is marked
   `kept` for local display.
2. **The deletion outbox.** A profile or memory delete must become a queued
   remote `DELETE`, and that op must survive a failed flush rather than being
   silently dropped, because a push is upsert-only and would otherwise leave a
   deleted row alive on the server forever.
3. **Profile switching.** Switching the active profile must not let one
   profile's Oki context or memory bleed into another's view, and the plan
   built for sync must mark exactly one profile `is_active`.
4. **PIN gating.** A PIN check must refuse a wrong PIN and accept the right
   one, and PIN recovery must send a hash to the remote store, never the PIN
   itself.

`incommon-cloud.js` is the one file allowed to move data off the device
(CLAUDE.md, "The wiring, and where it is not" / the v6.3 worklog), so these
four are the actual blast radius of that file existing at all. Getting them
wrong is a privacy defect, not a cosmetic one, which is why they earn a
dedicated phase instead of riding along in the 276-row sweep.

## Where each risk is actually tested

Pure logic goes in Node wherever the module lets it; the browser phase is
kept to what truly cannot be reasoned about without a live DOM and a live
ProfileManager wired to a live InCommonCloud.

**Node (`tools/run-module-tests.js`, group K).** `incommon-cloud.js` is a true
UMD module with two test hooks built for exactly this
(`_setConfigForTests`, `_setClientForTests`) and a documented header comment
saying so: "every gate and outbox path runs in Node." A hand-built fake
`pm` (matching the four methods the module actually calls: `_store()`,
`getMemory()`, `getConsents()`, `listProfiles()`) and a fake Supabase query
builder (records every `.from(table).op(...)` call it receives and answers
with a configurable `{error}`) are enough to drive `buildPlan()` indirectly
through `inspect()` and `push()`, and to drive the outbox through
`flushOutbox()` directly. This covers: a granted memory is included; an
ungated memory is excluded and never appears in any recorded call, kept or
not; the consent ledger and pairs sync unconditionally; the profile row
itself (birth data) syncs unconditionally; a queued deletion issues the exact
`delete().eq()` call; a failed flush leaves the op queued rather than
dropping it; `push()` flushes the outbox as its own tail so an ordinary
debounced write also drains a pending deletion; and the hash cache skips
unchanged rows on a second push. None of this needs a browser: `pm` is a
plain object, storage is an in-memory Map-backed stub, and the fake client
never touches a socket.

**What Node cannot reach, and why.** `incommon-cloud.js`'s UMD wrapper
resolves `root` to `typeof self !== 'undefined' ? self : this`; under Node's
CommonJS wrapper `this` is the module's own (private, pre-assignment)
`exports` object, not `globalThis`, so `root.sessionStorage` is always
undefined and PIN recovery's `isRecoverySession()` always reports false. That
is a real boundary, not a gap to paper over with a `global.self = global`
trick: PIN recovery genuinely needs a real `sessionStorage`, and
`profile-manager.js` genuinely needs a real `localStorage` (it is
`window.ProfileManager = PM`, not a UMD module — it has never been
Node-requireable and making it one is out of scope for this pass). Recording
that boundary here means the next person does not re-discover it by watching
a Node test silently return `false` for everything.

**Browser (the rewritten `verification/Test Runner V1.2.dc.html`).** Boots
the real app (`app/inCommonApp v2.dc.html`) in a hidden iframe, the same
`frame()` / cache-bust / `ready()` pattern `handoff/tests-v6.0.js` already
uses successfully against `window.__incommonApp`, because that pattern is
proven and there is no reason to invent a second one. Five things live here
because each needs either a live ProfileManager wired to a live
InCommonCloud, or a real `sessionStorage`/`performance` timeline:

- **No seam needed, and that is itself the finding.** `window.__incommonApp`,
  `window.ProfileManager`, `window.InCommonCore` and `window.InCommonCloud`
  are already unconditional globals — none behind a `?test=1` flag, none
  built for this pass. `InCommonCloud._setClientForTests` /
  `_setConfigForTests` already exist for exactly this purpose. Introducing a
  namespaced-storage test flag, the way the retired suite did, would
  duplicate machinery the app already exposes and would resurrect the
  V1.2-era pattern this rewrite exists to retire. The one seam this pass adds
  is a **fake Supabase client**, defined in the test file itself, passed
  across the iframe boundary and installed through the existing
  `_setClientForTests` hook — not a new hook on the app, a use of the one
  already there.
- **Inert at boot, proven not assumed.** Fresh iframe, no call to `init()`
  anywhere in the app (grep confirms it: the sign-in surface that would call
  it is the still-open step 4 of the cloud build). `InCommonCloud.status()`
  must read `{mode:'off', ...}` and `performance.getEntriesByType('resource')`
  must contain no request whose URL names Supabase or the project ref. This
  is the literal claim the module's own header makes ("if this module is
  absent, inert, or unsigned-in, the app is exactly the offline-first program
  it was yesterday") and it had never been checked against the real bundle.
- **Consent gating, end to end.** A disposable test profile is created
  through the real `ProfileManager.createProfile()`, real memories are
  written through `ProfileManager.addMemory()` with one consent granted and
  one withheld, and the fake client is installed through
  `InCommonCloud._setClientForTests()` inside the live iframe. Calling
  `inspect()` and `push()` here exercises the real wiring between the real
  ProfileManager and the real InCommonCloud, which the Node test cannot: the
  Node test's `pm` is a hand-built stand-in, so it can prove the module's own
  logic is correct but not that the module is actually plumbed to the real
  data layer the same way.
- **The deletion outbox, against real deletes.** `ProfileManager.deleteMemory()`
  and `ProfileManager.deleteProfile()` are called on the disposable profile
  and memories used above; since `InCommonCloud.init()` is never called by
  the app, `pm.subscribe()` was never wired to `queueOp()`, so this is proven
  the same way the Node test proves it: seed the outbox key with the op shape
  `queueOp()` would have written, then call `flushOutbox()` through the
  fake-client seam and assert the delete lands.
- **PIN gating and recovery.** `ProfileManager.setProfilePin()` /
  `verifyProfilePin()` on the disposable profile (wrong PIN refused, right
  PIN accepted); `completePinRecovery()` driven through the fake client with
  `sessionStorage` (real, because this is a real browser window) marking a
  recovery session, asserting the recorded remote call carries `pin_hash`
  and that the literal PIN string appears nowhere in anything the fake
  client received.
- **Profile switching.** A second disposable profile, `setActiveProfile()`
  between the two, asserting `activeId()` moves and the previous profile's
  Oki/context key is cleared per `clearOkiContext()`'s own contract.

Every browser test that creates state cleans it up in a `finally`: the
disposable profile(s) are deleted through `ProfileManager.deleteProfile()`
(which already cascades every scoped key), and the pre-existing `activeId`/
`defaultId` are snapshotted and restored explicitly, because `deleteProfile`
reassigns the active profile itself and a test that started against someone's
real dev profiles must not leave a different one active than it found.

## A real bug the rewrite caught

IT8 (PIN recovery) failed on its first honest run, and not on the assertion
it was written to make interesting: `recRes.ok` came back `false`,
`reason: 'not-recovery-session'`. `incommon-cloud.js`'s UMD wrapper is

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.InCommonCloud = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // ... isRecoverySession(), startPinRecovery(), completePinRecovery(), lib() all read `root`
}));
```

`root` is a parameter of the OUTER function. `factory` is a separate function
expression, written in the enclosing module scope and passed in as an
argument; it does not execute inside the outer function's body, so it never
closes over `root`. Every `root.*` reference inside `factory` — the
recovery-session flag, and `lib()`, which `init()` calls to find the vendored
Supabase client — was a bare reference to an undeclared identifier,
throwing `ReferenceError: root is not defined` the instant it ran. Confirmed
in isolation with a two-line Node repro before touching anything. Every one
of those throws landed inside a `try { … } catch (e) { return false; }` (or an
empty `catch (e) {}` around the `sessionStorage.setItem` calls), so nothing
ever surfaced: `startPinRecovery()` still resolved `{ok: true}` because that
value comes from the *other* try block, the one wrapping
`signInWithOtp`. PIN recovery has silently done nothing since it shipped.
`init()` itself was equally broken — `lib()` has no try/catch around it,
so any future call to `init()` (the sign-in surface, step 4) would have
thrown synchronously on its very first line.

Root cause confirmed, the question was whether fixing a one-line scoping bug
counted as "touching the cloud module" under this pass's own instruction not
to. Asked; the answer was to fix it. The fix is one line, added at the top of
`factory()`: `var root = typeof self !== 'undefined' ? self : this;` —
identical to the outer wrapper's own definition, now actually in scope where
it is used. Nothing that already worked touched `root` (`push`, `inspect`,
the outbox, `_setConfigForTests`/`_setClientForTests` all read `cfg`/`client`/
`session`, never `root`), so `run-module-tests.js`'s group K stayed 12/12
before and after, and this is the only line changed in `incommon-cloud.js`.

## What this phase deliberately does not do

It does not re-test `incommon-core.js`'s numerology, dates, birth-time
visibility, persistence guard, or citation validation: those are the pure
suite, unchanged, still 43/43 in `run-tests-node.js`, and this rewrite does
not touch them. It does not re-test layout, contrast, or ADA: that is
`Verification v6.0.dc.html`'s job and it already does it. It does not touch
`incommon-cloud.js`, the builder, or the deploy plumbing — CLAUDE.md's
standing rule and this pass's own instructions agree on that, and step 4 of
the cloud build (the sign-in surface) is a separate pass landing after this
one. And it does not chase `providerConsent`: that name is a retired V1.2
prototype concept (Stella's model-processing consent gate, `stellaCtx` era)
that appears in the v6.3 worklog's prose but nowhere in `incommon-cloud.js`
itself; Oki is unwired, nothing in the current build keys off it, and there
is nothing to test that would not be testing a name instead of a behavior.
