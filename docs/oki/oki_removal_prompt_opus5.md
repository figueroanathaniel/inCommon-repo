# Task: Remove Oki Reading Feature from inCommon
## Target: Claude Opus 5
## Priority: Immediate — blocks UI affordance work until complete
## Note: Preserve all files. This is an unwire, not a deletion. Oki will be re-added as a feature later.

---

## What to remove (the seams)

### 1. oki-voice-v144.js integration
- Remove `voiceSection()` call from `buildSystem()` in `oki-prompt-builder.js`.
- Remove the import/require of `oki-voice-v144.js` if it exists.
- The builder must behave exactly as V1.0 when the voice file is absent (this was already a soft dependency — verify it still holds).
- Do NOT delete `oki-voice-v144.js`. Leave it in the repo. It will be re-wired later.

### 2. Mode declarations — three sites
- **MODES** (`oki-prompt-builder.js`): Remove `reading` from the mode list.
- **LIMITS** (post-processor): Remove `reading` word ceiling and any reading-specific contract rules.
- **CONFIG.models** (`oki-api.js`): Remove `reading` model entry. Verify that `configure()` still accepts new keys (the fix you shipped earlier must remain).

### 3. Shot injection
- Remove the code that injects `<example mode="reading">` blocks into the user turn.
- Verify that no other mode's shot injection is affected.
- E9 assertion (exactly three `<example mode=>` blocks) should now expect two blocks, not three. Update the assertion or remove it if it was reading-specific.

### 4. The reading mode itself
- Remove `reading` from the mode switch/router in the response pipeline.
- Ensure that any input previously routed to `reading` now falls back to `standard` cleanly — no silent failures, no undefined behavior.
- The fallback must be explicit: if a user somehow triggers a reading request, route to `standard` and log a debug note.

### 5. UI references (if any)
- If any tone chip, button, or route references "reading" or "Oki" in the frontend, remove or hide it.
- The fifth tone chip that was held for its own change — remove it from the design doc/branch, not just from the bundle.
- Do NOT add a "coming soon" placeholder. A missing feature is better than a broken promise.

### 6. Documentation
- Update `PROJECT_MEMORY`:
  - Log that Oki reading was removed in V1.4.5 (or whatever version you assign).
  - List the exact files and lines unwired.
  - Note the three seams (MODES, LIMITS, CONFIG) for re-addition later.
  - Reference the preserved files: `oki-voice-v144.js`, `oki_voice_reference_v1.4.4.md`, `oki_judge_kit_selfcontained_v1.4.4_rev1.md`.
- Update README: remove any mention of reading mode or Oki from the public-facing description. Add a dev note that the feature is held.

---

## What to preserve (do not touch)

| File | Action | Reason |
|------|--------|--------|
| `oki-voice-v144.js` | Leave in repo | Will be re-wired later |
| `Oki Voice v1.4.4.dc.html` | Leave in repo | Inspector tool, reusable |
| `handoff/oki-voice-v144-reconciliation.md` | Leave in repo | Seven conflicts and resolutions, reference for re-addition |
| `oki_test_matrix_v1.4.4.md` | Leave in repo | 26 test cases, reusable |
| `oki_judge_kit_selfcontained_v1.4.4_rev1.md` | Leave in repo | Judge kit with conflict resolution, reusable |
| `oki_judge_prompt_v1.4.4.md` | Leave in repo | Base judge rubric, reusable |
| `oki_voice_reference_v1.4.4.md` | Leave in repo | Gold-standard examples, reusable |

---

## Verification steps (must pass before declaring done)

1. **V1.4 suite re-run**: 110 assertions, 0 failed.
   - A 17/17, B 19/19, C 18/18, D 18/18, S 18/18, E 5/5, functional 15.
   - The absence of reading mode must not break any existing gate, popup, or precedence path.
   - Check A (touch-target + wrap at 375px) must pass with four tone chips, not five.

2. **Builder behavior test**: Verify that `buildSystem()` produces identical output to V1.0 when `oki-voice-v144.js` is absent. The soft dependency must hold.

3. **Mode fallback test**: Send a synthetic "reading" mode request. Verify it routes to `standard` with no crash and a debug log.

4. **File inventory**: Confirm that no `oki-*` files were deleted. Only references unwired.

5. **Cache and deploy**: If V1.4 passes, bump cache to v1.8, rebuild `deploy1.1/index.html`, verify cache-busted load.

---

## The reason (for PROJECT_MEMORY)

Oki reading was unwired because:
- The UI affordance (fifth tone chip) was held for its own change due to Check A touch-target risk at 375px.
- Without a UI entry point, the reading mode is unreachable dead code.
- Removing it now keeps the bundle clean, the harness focused, and the V1.4 suite stable.
- It will be treated as a feature addition later, with its own branch, its own harness run, and its own reconciliation doc.

---

## Output expected from you

When complete, respond with:
1. List of files modified and the specific lines/functions removed.
2. V1.4 suite results (pass/fail counts per suite).
3. Cache version bumped to (e.g., v1.8).
4. Any unexpected issues encountered.
5. Confirmation that all Oki artifacts were preserved, not deleted.

---

*Task: Remove Oki reading feature*
*App: inCommon*
*Version: V1.4.5 (or your assigned)*
*Date: 2026-08-05*
