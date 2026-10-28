# The WebGL engine

How the 3D stages are built, as they are built. Drafted on 28 October 2026 by
the Task Force 6 primary under assignment 6.4 (programme priority 1), against
main `9356d04`, from the code and from CLAUDE.md. The document the programme
board names was never committed, so this one was written fresh with the
owner's corrections built in rather than applied to an earlier text. Where
this page and CLAUDE.md disagree, CLAUDE.md wins and this page is corrected.

Nothing on this page is a proposal. A name written here exists in the
repository today, and "Checking the names" at the end gives the grep for each
one. Anything proposed later is marked **proposed** where it is written.

## The five modules

| File | Global | Draws | Used by |
|---|---|---|---|
| `app/chart-scene.js` | `ChartScene` | the natal chart in 3D and Orbital, and the Observatory | the Birth Chart card, the maximize button |
| `app/hd-scene.js` | `HDScene` | the wiring in 3D and Wheel | the Human Design page |
| `app/cycle-scene.js` | `CycleScene` | the Cycle Audit in 3D and Orbital | the widget on Today and its sheet |
| `app/body-globes.js` | `BodyGlobes` | an astral body as a world, when the camera closes on it | `chart-scene.js` |
| `app/flight.js` | `Flight` | nothing: the free flying camera, keys, touch pad and gamepad | all three scenes |

Each of the three scenes exports `supported()` (WebGL 2 is present) and
`create(opts)` (one scene object). `ChartScene` adds `kindOf()`, and `HDScene`
exposes `_layoutGates` and `_outline` for the gates that test the layout
without a browser.

three.js is revision 184, vendored as `app/three.module.js` and
`app/three.core.js` under their upstream names, and each scene imports it on
first use with `import('./three.module.js')`. That address resolves beside the
page in the source shell, in the bundle and in the store apps alike, and no
scene loads anything from another origin.

## Where it ships

- **Source shell.** `app/inCommonApp v2.dc.html` loads the five modules as
  helmet script tags (`./flight.js`, `./body-globes.js`, `./cycle-scene.js`,
  `./chart-scene.js`, `./hd-scene.js`). `app/sw.js` precaches all five and the
  two three.js files.
- **Bundle.** `deploy/<current>/app.html` carries the five modules inlined and
  the two three.js files beside it, precached by `deploy/<current>/sw.js`. At
  the time of writing `<current>` is `v6.4` ("Current values" in
  `docs/outsourcing/00-README.md`). The folder is named once, in `BUNDLE` at
  the top of `tools/build-bundle.js`.
- **Store apps.** `tools/build-native.js` copies the bundle folder into
  `native/www/`, so the apps carry the same files.

## The rule: a scene computes nothing

A scene draws a model the application builds from the same calculation the 2D
view reads, so the 2D view and the depth views cannot disagree. A scene holds
no ephemeris, no chart arithmetic, no gate lookup and no birth data of its
own. What it does compute is drawing: geometry, layout, picking, the camera,
and interpolation along arrays the application handed it.

| Scene | Model | Built from | Rebuilt when |
|---|---|---|---|
| `ChartScene` | `this._csModel`, in the chart vals | `placedRows` and `radiusFor` (the rows and stagger radii the 2D wheel was just drawn from), `natalAspects()`, `CAT_COLOR`, `ASP_COLOR`, `SIGN_EL_C`, `pointKey()`, `pointTooltip()` | `csKey` changes: birth stamp, basic or expanded, comets, minor aspects, profile name |
| `HDScene` | `this._hsModel`, in the wiring vals | `hdChart()`, `HDWheel`, the atlas's `CENTERS`, `BG_POS`, `GATE_NAMES` | `hsKey` changes: birth stamp, profile name, atlas or wheel present |
| `CycleScene` | `cycleSceneModel()`, memoised as `this._cySM` | `cycleWindows()`, `cycleDesign()`, `cycleNumbers()`, `chartAt()`, `anglePoints()`, and the cubic nodes the scan already walked (`this._cyNodes`) for the Orbital paths | `cycleScanKey()` or the day changes |

Focus, selection, the layer, the sky and the view travel separately from the
model (`setFocus`, `setSelection`, `setLayer`, `setSky`, `setView`,
`setLayout`), so a press never rebuilds the scene.

**The one position a scene asks for itself** comes through `opts.lonAt`, which
the application supplies:

- `ChartScene`: `lonAt` is the app's own `lonOf()`, used for the Orbital
  view's Today's sky (`buildToday`).
- `CycleScene`: `lonAt` is the app's `cyLon()`, used for the slow bodies at
  the probed instant in the full view.
- `HDScene` asks for nothing. The sky now arrives through `setSky()`, built by
  the app's `hdSkyList()` from `HDTransit.reading()`, the same reading the gates
  card on Today uses.

CLAUDE.md: "The natal chart is drawn three ways", "The wiring is drawn three
ways", "The Cycle Audit is drawn four ways".

## What the engine never touches

**Nothing in the browser talks to Supabase except `app/incommon-cloud.js`.** It
is the one module that makes a client (the vendored
`supabase-js-2.57.1.umd.min.js` aside, which is the library it makes it with).
No scene, renderer or engine module holds a client, makes a request, or reads
or writes storage: a grep of the five modules for `supabase`, `fetch(`,
`localStorage`, `sessionStorage` and `indexedDB` finds nothing.

**There is no client write to `oracle_readings`, and none is proposed.** That
table is written only by the Oracle edge function (`server/oracle/index.ts`)
with the service role. `server/oracle/schema.sql` turns row level security on
and gives app users one policy, `"read own oracle readings"`, for select only,
and on purpose no insert, update or delete policy, so a write from the page is
refused. The daily limit counts those rows, so a reader who could write them
could defeat it. A reading reaches the page through `oracleRead()` in
`incommon-cloud.js`, which calls the function (`client.functions.invoke`), and
is kept on the device by the app's `oracleKeep()` under
`incommon.p.<id>.oracle`. No scene draws a reading today. If one ever does,
the application passes it in from what it already holds, the way it passes a
model, and the scene never reaches the database.

## How a stage comes up

The application owns the stages; a scene never decides where it is drawn.

1. **Mount.** `componentDidMount()` waits up to eight seconds for all five
   globals (`sceneWait`); past that `_scenesSettled` is set and a missing
   module means the 2D view is the answer. Until then `scenePending(name)`
   keeps a depth view holding its place behind Loading rather than drawing the
   2D fallback and swapping it out. It then schedules `scenePrewarm()`.
2. **Prewarm.** `scenePrewarm()` builds the Cycle Audit, the wiring and the
   chart, one at a time, in idle time, starting two seconds after the app is
   ready. A scene with no stage on the page waits in the lot (`sceneLot()`, an
   offscreen, `inert`, `aria-hidden` box inside the shell's own token root),
   where it keeps its palette and compiled programs and runs no loop. Each
   scene is made by its one constructor (`chartSceneMake()`, `hdSceneMake()`,
   `cycleSceneMake()`), shared by the prewarm and the sync.
3. **Sync.** The one `componentDidUpdate()` calls `cycleSceneSync()`,
   `chartSceneSync()` and `hdSceneSync()`. Each finds its host
   (`[data-cy-scene]`, `[data-cs-scene]`, `[data-hs-scene]`), hands the scene
   its model and state, and calls `attach()`. A host expected and not yet
   committed (an `sc-if` lands a tick after the hook) is looked for again, up
   to eight times, 60ms apart. A scene whose host is gone is parked in the lot
   (`scenePark()`), never detached. The Observatory is the chart scene moved
   into `[data-cs-scene="obs"]` and switched with `setMode('obs')`.
4. **Build, inside the scene.** `buildNear()` builds when the stage comes
   within reach of the screen, or `prebuild()` builds at once in the lot. The
   build loads three.js and the scene's own faces together (`waitFaces`, the
   `--fu` and `--fd` faces by name, three seconds at most), runs `init()` and
   `buildContent()`, then `warmUp()` compiles every program with
   `compileAsync` before the first frame, so no frame links a shader on the main
   thread.
5. **Reveal.** A scene reports ready (`onReady`, which sets `csLive`, `hsLive`
   or `cwSceneLive`) only once it is drawn where the reader can see it. The
   Loading veil dissolves, the canvas fades up through it, and the stage's
   controls fade in last (`csUiO`, `hsUiO`, `cyUiO`).
6. **Away.** An IntersectionObserver and the page's visibility stop the loop
   when the stage is not seen. `postSleep()` gives back the bloom targets four
   seconds after a stage stops being seen.
7. **Failure.** Without WebGL 2 (`supported()` false), when three.js does not
   load, or on `webglcontextlost`, the scene tears itself down and calls
   `onFail`. The app sets `csFail`, `hsFail` or `cwSceneFail`, and
   `chartViewNow()`, `hdViewNow()` and `cycleViewNow()` answer `2d`. The view
   switch then offers only what can be drawn.
8. **Unmount.** The one `componentWillUnmount()` calls `destroy()` on all
   three. `destroy()` disposes every geometry, material, label texture and
   post processing target it made, cancels pending frames and removes its
   listeners, and is safe to call twice.

2D opens first, every time, and the chosen view is not stored (CLAUDE.md "2D
opens first").

## Rendering

- **The draw path.** Each scene carries `GFX`: `ios` (iPhone and iPad),
  `direct` (draw straight to the canvas, no post chain; the default on iOS),
  and `nomsaa` (the post chain without its multisampled target). `?gfx=post`,
  `?gfx=nomsaa` and `?gfx=direct` choose one on any device without a build.
  Elsewhere the scene renders into a half float target and adds bloom
  (`setupPost`).
- **The quality ladder.** `measure()` judges busy frames only: three frames
  after a start are drawn and not judged, an idle frame breaks a late streak,
  three late frames in a row drop a rung at once, and the frame history
  belongs to one visit.
- **Palette.** `readTokens()` reads the page's own tokens off the scene's root,
  and only once that root is in the document. The app calls `setTheme()` when
  the identity or the contrast modifier changes. The colours of the worlds in
  `body-globes.js` are each astral body's own, not tokens, because a theme
  does not repaint a world; none of them is text.
- **Reduced motion.** Nothing animates; frames are drawn on change, and the
  camera cuts instead of travelling.

## Flight and the worlds

`Flight.create()` is a camera with a position, a yaw and a pitch. `hd-scene.js`
and `cycle-scene.js` take the card glue from `Flight.mixin()`; `chart-scene.js`
carries its own, because the Observatory needs more of it.
`Flight.claimedElsewhere()` keeps flight off a field being typed into and off
the keys a control already owns, and `mountPad()` builds the touch stick.

`BodyGlobes.create()` is made by the chart scene with three.js. A world is
generated on the GPU from noise when the camera closes on an astral body and
disposed when it leaves; the points that are not bodies (the nodes, Lilith,
the Parts, the hypotheticals) are lattices of light, never solid.
`BodyGlobes.kindOf()` says which kind a point is drawn as.

## Accessibility at the stage

The stage is `[data-chart]` and carries a role description and the same
summary the 2D view does (G11c, G11d). The HUD is `aria-hidden`; a keyboard
step is spoken through the app's `speak()`, never through state. The Cycle
Audit's timeline is a slider whose `aria-valuetext` `cycle-scene.js` writes
directly. Everything a scene draws is also reachable from controls outside the
canvas.

## The checks

| Check | What it holds | Needs |
|---|---|---|
| `node tools/check-three-lifecycle.js` | teardown, sleep, the quality ladder, globe frame math (103 checks at `9356d04`) | Node only |
| `node tools/drift-check.js --force --with-h` | the browser phases and the cover's H phase against the bundle | Playwright and Chromium |
| harness G11c, G11d, G14b | the stage's role description, summary and zoom controls | a browser |

**What a run in a container cannot say.** No WebKit is installed, so iOS is
confirmed only on a real phone. SwiftShader shows a shader compiles and paints;
it says nothing about a hardware driver's crash and recovery, and its frame
rates and memory are not device figures. The theme sweep measures Today only;
the stages were measured by hand over the four identities. Those gaps are kept
on the programme board ("Device gaps still owed" in
`docs/outsourcing/PROGRAMME.md`) until a device run closes them.

## Checking the names

Every name this page uses, with the file it is in and a fixed string that
finds it. Run from the repository root; each line prints the match count,
and none may print 0.

```sh
while IFS='|' read -r f s; do
  printf '%4s  %-40s %s\n' "$(grep -cF -- "$s" "$f")" "$f" "$s"
done <<'EOF'
app/chart-scene.js|root.ChartScene = {
app/hd-scene.js|root.HDScene = {
app/cycle-scene.js|root.CycleScene = {
app/body-globes.js|root.BodyGlobes = {
app/flight.js|root.Flight = {
app/chart-scene.js|import('./three.module.js')
app/hd-scene.js|import('./three.module.js')
app/cycle-scene.js|import('./three.module.js')
app/chart-scene.js|var GFX =
app/chart-scene.js|function supported()
app/chart-scene.js|P.attach =
app/chart-scene.js|P.setModel =
app/chart-scene.js|P.setView =
app/chart-scene.js|P.setFocus =
app/chart-scene.js|P.setSelection =
app/chart-scene.js|P.setTheme =
app/chart-scene.js|P.setMode =
app/chart-scene.js|P.buildNear =
app/chart-scene.js|P.prebuild =
app/chart-scene.js|P.warmUp =
app/chart-scene.js|compileAsync
app/chart-scene.js|waitFaces
app/chart-scene.js|P.postSleep =
app/chart-scene.js|P.measure =
app/chart-scene.js|P.setupPost =
app/chart-scene.js|readTokens
app/chart-scene.js|P.buildToday =
app/chart-scene.js|webglcontextlost
app/chart-scene.js|P.destroy =
app/chart-scene.js|o.lonAt
app/hd-scene.js|P.setLayer =
app/hd-scene.js|P.setSky =
app/hd-scene.js|Flight.mixin
app/cycle-scene.js|P.setLayout =
app/cycle-scene.js|Flight.mixin
app/cycle-scene.js|o.lonAt
app/body-globes.js|kindOf
app/flight.js|mixin: mixin
app/flight.js|claimedElsewhere
app/flight.js|P.mountPad =
app/chart-scene.js|F.create(
app/chart-scene.js|BG.create(T)
app/cycle-scene.js|aria-valuetext
app/three.module.js|REVISION
app/three.core.js|REVISION = '184'
app/inCommonApp v2.dc.html|<script src="./chart-scene.js">
app/inCommonApp v2.dc.html|this._csModel = {
app/inCommonApp v2.dc.html|this._hsModel = {
app/inCommonApp v2.dc.html|  cycleSceneModel() {
app/inCommonApp v2.dc.html|this.CAT_COLOR[r.category]
app/inCommonApp v2.dc.html|const placedRows =
app/inCommonApp v2.dc.html|lonAt: (name, t) => this.lonOf(
app/inCommonApp v2.dc.html|lonAt: (name, t) => this.cyLon(
app/inCommonApp v2.dc.html|  hdSkyList() {
app/inCommonApp v2.dc.html|  scenePending(name) {
app/inCommonApp v2.dc.html|  scenePrewarm() {
app/inCommonApp v2.dc.html|  sceneLot() {
app/inCommonApp v2.dc.html|  scenePark(S) {
app/inCommonApp v2.dc.html|  chartSceneMake() {
app/inCommonApp v2.dc.html|  hdSceneMake() {
app/inCommonApp v2.dc.html|  cycleSceneMake() {
app/inCommonApp v2.dc.html|  chartSceneSync(retry) {
app/inCommonApp v2.dc.html|  hdSceneSync(retry) {
app/inCommonApp v2.dc.html|  cycleSceneSync(retry) {
app/inCommonApp v2.dc.html|  chartViewNow() {
app/inCommonApp v2.dc.html|  hdViewNow() {
app/inCommonApp v2.dc.html|  cycleViewNow() {
app/inCommonApp v2.dc.html|_scenesSettled = true
app/inCommonApp v2.dc.html|  oracleKeep(slot, entry) {
app/inCommonApp v2.dc.html|'.oracle'
app/incommon-cloud.js|function oracleRead(req)
app/incommon-cloud.js|client.functions.invoke('oracle'
server/oracle/schema.sql|"read own oracle readings"
server/oracle/schema.sql|No insert, update or delete policy
app/sw.js|'./chart-scene.js'
deploy/v6.4/sw.js|'./three.module.js'
tools/build-bundle.js|BUNDLE
EOF
```

And the absence the data boundary rests on, which must print nothing:

```sh
grep -nE "supabase|fetch\(|localStorage|sessionStorage|indexedDB" \
  app/chart-scene.js app/hd-scene.js app/cycle-scene.js app/body-globes.js app/flight.js
```
