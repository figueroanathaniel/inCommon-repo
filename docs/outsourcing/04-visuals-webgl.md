# Brief 4: Interactive Visuals (WebGL / three.js)

Agents: named in the roster in 00-README.md, workstream 4.
Branch: visuals/<topic> from current main.
Read 00-README.md and CLAUDE.md first. This workstream's merged work so far
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

**Secondary.** Reviews pull requests file by file. The rest of this
paragraph applies while the seat is held by an agent with about 100k tokens
of context (see the roster); with a full context it may review the whole
diff at once. At 100k it fits each 3D stage (25k to 30k tokens),
app/cover.html (about 31k) and tools/check-three-lifecycle.js on their own, but NOT the app file (about
713k), NOT CLAUDE.md in full (about 106k), and NOT the vendored three.js.
So:
- Review one changed file per pass, using "git diff main -- <file>" plus the
  surrounding functions, never the whole repository.
- Read only these CLAUDE.md sections: "The cover, and the two pages the site
  has now", "The ring, Continue and the registration card (26 October 2026)",
  "The 3D scenes fade in from behind Loading, and nothing else on the stage
  arrives first", "The 3D stages compile in
  parallel, build when near, and wait for their own faces", "Colour rules
  that are not negotiable" and "Zero em dash".
- Check that every new GPU resource has a matching release and a
  check-three-lifecycle.js row.
If it takes the branch over, it keeps working one file at a time.

**Tertiary.** Runs the gates, including
"node tools/drift-check.js --force --with-h", and posts the results and any
screenshots on the pull request, including one at the bottom rung of the
quality ladder. It does not change rendering code.
