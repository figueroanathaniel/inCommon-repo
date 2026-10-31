# Brief 4: Interactive Visuals (WebGL / three.js)

Shared entry: [FOUNDATION.md](../../FOUNDATION.md) and the current
[role prompts](../../BOT-PROMPTS.md), with the central roster and programme.
Use the same startup and completion receipts as every other role.

## Current handoff

Reconcile 4.3's engine document and remaining 4.1 work. 4.2 follows its
required graphics-completion evidence. Use current chart addresses and the
application model. Description help does not replace review or execution.

Agents: named in the roster in 00-README.md, workstream 4 (Task Force 4).
Branch: the Task Force 4 branch named in CHARTER.md (since 28 October 2026).
Read 00-README.md, CHARTER.md and CLAUDE.md first. This workstream's merged work so far
is listed under "Current values" in 00-README.md; build on it.

## What exists today

- The cover, app/cover.html: a Schwarzschild raytracer behind a DOM ring.
  Since 26 October 2026 the centre is a glowing violet ring (#9d4edd) with a
  green line (#00f5d4) inside it, turning in opposite directions, a Continue
  pill at the centre, and a sequence on the way in (the ring splits into two,
  the line draws in to a dot, flashes, fills the lens). The app plays it back
  as it loads (#ring-handoff at the top of the app's body). The ring is DOM
  and CSS, not WebGL, and runs in the plain sign in script so it works with
  WebGL off.
- The app's 3D stages: app/chart-scene.js (natal chart, Orbital and 3D),
  app/cycle-scene.js (Cycle Audit), app/hd-scene.js (Human Design wiring),
  app/body-globes.js (the bodies), app/flight.js (free look). three.js is
  vendored: app/three.module.js and app/three.core.js, revision 184.
- tools/check-three-lifecycle.js (82 checks) guards teardown: GPU resources
  are released only after shader warm-up settles, unseen stages give back
  their bloom targets, failed or lost contexts take the same cleanup path.

## Rules specific to this work

- Never edit three.module.js or three.core.js. Work around library behaviour
  in app code.
- The cover's shader half is ported, never retyped. VERT, COMMON,
  BRIGHT_FRAG, DOWN_FRAG and UP_FRAG are byte for byte from the reference;
  b_crit = 3*sqrt(3)/2, the disk bounds, the step clamp and the star shells
  are physical values. Read "The cover, and the two pages the site has now".
- Two additive lights in the same pixels sum toward white. Any light you add
  says which colour owns the pixels it lands on (CLAUDE.md records this fault
  three times).
- A spliced shader block that does not compile fails black and still sets
  __EH_LIVE. Read every shader back after editing it, and check H2 (the
  drawing buffer readback), not the first frame.
- The quality ladder has nine rungs and exists because the old floor crashed
  an Intel display driver. Never raise the floor, never remove a rung.
- The 3D scenes fade in from behind "Loading", 2D opens first, and stages are
  built before they are asked for. Read those CLAUDE.md sections before
  changing any stage's start up.
- The ring's colours are the owner's spec values and live only on the ring.
  The logo elsewhere keeps the identity's #8b5cf6 and #2fff8f. #8b5cf6 is
  never text.
- Respect prefers-reduced-motion everywhere: slower or still, never removed
  so the screen reads as broken.

## How to work

1. Measure before and after on a mid-range phone profile (390x844, 4x CPU
   slowdown): frame time, the rung the ladder settles on, and GPU memory.
2. Add a check to tools/check-three-lifecycle.js for any new resource you
   allocate, proving it is released.
3. Run "node tools/drift-check.js --force --with-h". H1 to H16 cover the
   cover; a red H1 with GL_VENDOR = Disabled is the environment, not the
   build (CLAUDE.md, "A red H1 with no context").
4. Check a screenshot at the BOTTOM rung of the ladder too, not only the top.

## Done means

- Every gate in 00-README.md passes, including H.
- check-three-lifecycle.js covers every new resource.
- A CLAUDE.md section with the before and after measurements.

## Secondary and tertiary

Approved by the owner on 27 October 2026. "Helpers" in 00-README.md applies
to every block below: the browser runner, shared seats, and the helper log
every pull request ends with. Who holds each seat is in the roster.

**Secondary** (repo access). Reviews each graphics PR. If its context is
under about 150k tokens, it reviews one file per pass, using
"git diff main -- <file>" plus the surrounding functions, and never loads the
app file, CLAUDE.md in full or the vendored three.js. For assignment 4.1:

1. Read the merge order note in the first PR (4.1, Task 1.2) and review the
   pieces in that order.
2. For each changed scene file, fill in a table: every GPU allocation
   (geometry, material, texture, render target, program) and the line that
   releases it. A row with no release is a finding.
3. For every new check-three-lifecycle.js row, remove the release it guards,
   run the gate, see red, and put the release back.
4. Task 3a: production has checkShaderErrors off on every platform, and
   something still catches a broken shader. Break one on purpose and
   confirm H2 or a lifecycle row goes red.
5. Task 3b: the ladder climbs back after recovery and does not flap. Ask for
   the VM row's output and read it.
6. Confirm the PR makes no change to the cover shader's constants, no edit
   to three.*.js, and no change to vtBindTouch, vtHScrollableAt or
   [data-chart].

CLAUDE.md sections to read, and only these when context is short: "The
cover, and the two pages the site has now"; "The ring, Continue and the
registration card (26 October 2026)"; "The 3D scenes fade in from behind
Loading, and nothing else on the stage arrives first"; "The 3D stages
compile in parallel, build when near, and wait for their own faces"; "Colour
rules that are not negotiable"; "Zero em dash"; and "Swiping on the phone is
one chain, read left to right". If it takes the branch over, it keeps
working one file at a time.

**Tertiary** (chat only). Drafts descriptions from supplied public or
sanitized visual evidence. Use actual labels, distinguish implemented from
proposed behavior, and mark missing evidence. A filename does not prove
appearance. No private charts, server files, data contracts or unresolved
findings are shared. This helper does not run gates.

**Bounded execution support**, named in the roster, or the browser runner:

1. Run required graphics gates including H and drive checks on the exact
   range. Report unavailable checks as not run.
2. Record the worked journey at the assignment's phone and desktop sizes,
   selection consistency, keyboard access and resource cleanup.
3. Label software rendering and physical-device gaps honestly. Investigate
   inconsistent rows instead of hiding them.

**Cap fallback**, named in the roster, receives the branch, exact diff,
completed checks and smallest unfinished step. It preserves ownership and
independent secondary review. An author cannot approve its own change;
no takeover is recorded before an actual handoff.
