---
kind: consumer
layer: shell
source:
  - "app/inCommonApp v2.dc.html at 1c02c7c (every line below)"
  - "app/hd-*.js, app/arc-solver.js, app/birth-time.js, app/lunar-mean-points.js, app/people-library.js, app/pair-cache.js, app/iching.js, app/timing-lexicon.js at 1c02c7c"
verified: "found by the two greps in assignment 1.3 Task 1, widened by every name met along the way; every row's line opened and read"
status: checked
---
# Inventory

Every place the build computes, stores, sends or reads Human Design, mapped at
commit 1c02c7c. "App" means `app/inCommonApp v2.dc.html`; the app file is the
shell that hosts mechanics and interpretation methods side by side, so each row
names the layer of what the method does. Modules carry the layer
`tools/check-layer-boundary.js` gives them.

## Computing (mechanics)

| Site | file:line | Layer | Reads | Returns | Called by |
|---|---|---|---|---|---|
| `BirthTime.instant` | birth-time.js:207 | mechanics | birth date, time, unknown flag, zone, offset | `{ date, timeState, offset, ... }` | `natalDateFor` |
| `natalDateFor(p)` | App:16235 | mechanics | a profile or card | a Date (UT) | `natalDate`, `hdGatesFor`, `calcFor` |
| `t2000(d)` | App:15998 | mechanics | a Date | days from J2000 UT | everything below |
| `lonOf` / `lonRaw` | App:16010, 16028 | mechanics | body, t | degrees | every chart |
| `meanLunarNodeOf` | App:16417 | mechanics | t | degrees, mean node | `lonRaw` |
| `designT(tP)` | App:17181 | mechanics | t | t of the design moment | `hdChart`, `hdGatesFor` |
| `ArcSolver.designMoment` | arc-solver.js:80 | mechanics | a Sun longitude function, t | `{ t, solved, iterations, residual, daysBefore }` | `designT` |
| `gateOf(lon)` | App:17158 | mechanics | degrees | `{ gate, line }` | `hdChart`, `hdGatesFor`, `dailyData`, `hdSunRun`, `cycleDesign`, `oracleDossier`, `synGatesOf` |
| `HDWheel.gateLine` | hd-wheel.js:45 | mechanics | degrees | `{ gate, line, index, degreeInGate, gateStart }` | `gateOf`, `HDTransit`, the 3D model |
| `hdChart()` | App:17189 | mechanics | the active profile | [[HD chart]] | 25 call sites, the Consumers notes |
| `hdProfile()` | App:19972 | mechanics | `hdChart().acts` | `{ c, u, key, name, line, how }` | the wiring, the readings, the profile card, the 3D panel |
| `hdGatesFor(p)` | App:23063 | mechanics | any person | Set of gates, memoised on date, time, flag, zone, offset | `compositeFor` path in `synVals`, `circleVals`, `peopleCompute` |
| `synGatesOf(chart)` | App:23058 | mechanics | an astrology chart | Set of gates (Sun to Pluto and nodes only, one instant) | **nothing. Unused; scheduled for removal by 3.1 Task 1. Not mapped further.** |
| `gateCenter(g)` | App:17594 | mechanics | gate | centre name, from `HD_CHANNELS` | `dailyData`, `peopleCompute`, `hdCenterOf` fallback, the daily sheet |
| `hdCenterOf(g)` | App:19971 | mechanics | gate | centre name, atlas then `gateCenter` | the wiring, the Atlas, the 3D model |
| `hdSkyNow()` | App:21733 | mechanics | now | the sky's thirteen activations, memoised per minute | Atlas sky ring, `hdWeatherVals` |
| `HDTransit.reading` | hd-transit.js:101 | mechanics | lonOf, ms | [[Transit reading]] | `hdSkyNow`, `gnowVals`, `hdSkyOn` scene feed |
| `cycleDesign()` | App:26727 | mechanics | the natal gate set, the slow bodies' positions | stays of Saturn to Pluto on or completing natal gates | the Cycle Audit |
| `HDComposite.composite` | hd-composite.js:112 | mechanics | two gate sets | [[Composite row]] | `compositeFor` |
| `HDCircle.circle` | hd-circle.js:172 | mechanics | three to five gate sets | [[Ground]] | `circleVals` |
| `HDTopology` | hd-topology.js | mechanics | | the 36 pairs, 64 gate centres, 9 centres | composite, circle, atlas |
| `peopleCompute(o)` | App:13855 | mechanics, handed to the shell | an instant and a time flag | `{ longitudes, gates, channels, centers, moon }` | `PeopleLibrary.computeStateFor` |

## Storing and sending (shell)

| Site | file:line | Holds | Note |
|---|---|---|---|
| `PeopleLibrary` records | people-library.js:199, 214 | [[computed_state]] in `incommon.people.v1` | written once by `migrateLegacy`, read by nothing |
| `PairCache` | pair-cache.js:137 | composite structure keyed by two chart hashes, `incommon.paircache.v1` | [[Composite row]] |
| `oracleDossier` | App:25516 | the HD lines sent to `server/oracle` | [[Oracle dossier (HD part)]] |
| `cycleDossier` | App:26641 | type, strategy, authority sent for the Cycle Audit | [[Oracle dossier (HD part)]] |
| profile `birthStamp` | profile-manager.js:304 | the key every chart memo and the kept Oracle reading use | [[D-09 The birth stamp ignores the zone]] |
| `analytics` `chart_generated` | App:17195 | a name and a day, no chart | counted in `hdChart()` |

Nothing in `server/` computes Human Design. The Oracle function receives the
dossier text and stores a hash of it; it never sees a gate set or an instant.

## Reading (interpretation and screens)

See the per screen notes: [[The wiring, 2D]], [[The wiring stage, 3D and Wheel]],
[[Human Design readings]], [[Human Design Atlas]], [[Today Human Design card]],
[[Gates now card]], [[Synastry composite]], [[Circle]],
[[Cycle Audit Design lane]], [[The Oracle]], [[Saved people]],
[[Timing Lexicon and the Together slide]], [[Book of Changes]],
[[Learn pages and search]], [[Tests that hold it]].

## Data tables in the app file

| Name | file:line | Layer | Copy of |
|---|---|---|---|
| `PLNS` | App:15404 | mechanics | the twelve bodies asked for (includes `South Node`) |
| `HD_WHEEL` | App:15416 | mechanics | `HDWheel.WHEEL` (equal) |
| `GATE_NAMES` | App:15417 | interpretation | `HDAtlas.GATES[n][0]` (six differ, D-02) |
| `HD_CHANNELS` | App:15418 | mechanics | `HDTopology.PAIRS` with centres (equal) |
| `HD_CENTERS` | App:15419 | interpretation | centre phrases |
| `HD_STRATEGY`, `HD_TYPE_DESC` | App:15420, 15443 | interpretation | by Type |
| `HD_DEFINITION` | App:17233 | interpretation | by part count |
| `BG_POS`, `BG_SHORT` | App:19967 | shell | 2D drawing |
| `HD_TYPE_LIGHT`, `HD_AUTH_CENTRE` | App:21655, 21657 | interpretation | Atlas lighting (D-05) |
| `ORACLE_STRATEGY`, `ORACLE_PROFILE`, `ORACLE_CENTER` | App:25507 | interpretation | the Codex's words |
