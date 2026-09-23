# Cloud section UI spec (step 4 of the v6.3 cloud pass)

Status: design note, written before implementation, per project rule.
Temporary surface: it proves sync works and will change. Nothing in this
file loosens a gate, an assertion, or the consent model.

## Placement and frame

A single new section in Settings, headed "Cloud" (working name; the
consent-language pass may rename it, so the heading is a plain string, not a
promise). One line under the heading states the temporary status plainly.
Renders in both shells from the one codebase at the one breakpoint. All rows
and controls 44px minimum. Inline styles only. Palette by hex: section
actions in #2fff8f, nothing destructive anywhere in this section so #e5534d
never appears here, #8b5cf6 never appears as text.

## Signed out

Two fields (email, password) and one primary button labeled "Sign in." No
sign-up in this surface; test accounts are created in Supabase directly and
deleted after. Below the button, one quiet line, exact copy:

"What leaves this device is decided by the consent switches in Settings.
Nothing leaves without them."

## Signed in

Four blocks, all reading from InCommonCloud.

1. Session. "Signed in as {email}" and a secondary "Sign out." Sign out
   returns the section to the signed-out state and leaves local data
   untouched.
2. What would sync. Render InCommonCloud.inspect() as three grouped counts,
   one row per group, count plus a short clause:
   - "{n} memories would sync under your current consent."
   - "{n} would stay on this device (kept, or no consent given)."
   - "Your consent history and connections always sync: {n} rows."
   Counts only. No identifiers, no memory text, no bodies.
3. Sync now. A primary button labeled "Sync now." Forces the debounced push,
   then re-renders inspect(). This button mirrors decisions made elsewhere;
   it never overrides the consent gate.
4. PIN recovery. Two steps riding the account email. Step one: a secondary
   button "Email me a recovery code" calling startPinRecovery. Step two,
   revealed after: a code field and a new-PIN field calling
   completePinRecovery, using the existing PIN-gated vocabulary and the
   existing PIN entry components. This block is why the root-scope fix
   matters; it cannot work until that fix is live.

## What this surface is not

No provider sign-ins. No cloud deletion. No merge or conflict UI. No
"available on all your devices" promise. The consent gate decides what
pushes; this surface makes the gate visible and drivable, nothing more.

## Acceptance, in order

1. Sign in as test user A; inspect() shows A's counts.
2. Toggle one consent switch off in the Consent section; its memory kind
   leaves the "would sync" group.
3. Sync now; confirm rows land in Supabase via the saved "schema v2" query,
   and confirm the unconsented kind produced no row.
4. Sign out; the section returns clean, local data untouched.
5. Run PIN recovery end to end with the code from the account email.
6. Sign in as test user B; B sees an empty world.
7. Delete both test users in Supabase. Worklog records the first real sync
   and its numbers. The consent-language pass opens as the next feature work.

If any step surprises, stop and report rather than pressing on.