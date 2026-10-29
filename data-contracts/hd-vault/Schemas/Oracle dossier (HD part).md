---
kind: schema
layer: shell
source:
  - "app/inCommonApp v2.dc.html:25516 at 1c02c7c (oracleDossier)"
  - "app/inCommonApp v2.dc.html:25537 at 1c02c7c (hdChart, the Human Design lines)"
  - "app/inCommonApp v2.dc.html:25507 at 1c02c7c (ORACLE_STRATEGY, ORACLE_PROFILE, ORACLE_CENTER)"
  - "app/inCommonApp v2.dc.html:26641 at 1c02c7c (cycleDossier)"
verified: "by reading; values traced to hdChart() fields"
status: checked
---
# Oracle dossier (HD part)

The Human Design lines of the text the app sends to `server/oracle` (through
`incommon-cloud.js`) when the reader asks the Oracle. Layer: shell (it leaves the
device); every value in it is read from [[HD chart]].

## Standard depth: one line

`HUMAN DESIGN: <type>; Strategy: <ORACLE_STRATEGY[type]>; Authority: <name>;
Profile <c>/<u> <ORACLE_PROFILE[c]> / <ORACLE_PROFILE[u]>; <definition name>;
Defined centers: <ORACLE_CENTER names>; Channels: <a-b, ...>; Personality Sun
gate <n> (<GATE_NAMES[n]>), Design Sun gate <n> (<GATE_NAMES[n]>)`

and `CURRENT TRANSITING SUN GATE: <gate>.<line> (<GATE_NAMES>)`.

| Value | From |
|---|---|
| type | `hdChart().type` |
| authority | first part of `hdChart().authority`, mapped to the Codex's words (Mental is sent as "Mental (Environmental)", Ego keeps its split) |
| profile | the personality and design Sun lines from `hdChart().acts`, not `hdProfile()`: see [[Profile]] |
| definition | first part of `hdChart().definition` |
| defined centres | `hdChart().defined` |
| channels | `hdChart().activeChannels`, `a-b` |
| gate names | `GATE_NAMES`, not the atlas: [[D-02 Two gate name tables disagree on six gates]] |

## In-depth: one more line

`HD ACTIVATIONS: P-sun 41.3, P-earth ..., D-moon ...`: every activation on both
sides, `P-` or `D-`, the body's `ORACLE_KEY`, gate.line. Built with
`hdChart().acts.find(body, kind)`, so the duplicate South Node row
([[D-01 The South Node is activated twice]]) is not doubled here.

## Cycle Audit dossier

`cycleDossier()` sends `HUMAN DESIGN: <type>; Strategy: ...; Authority: <name>`.

## Consent, deletion, export (DATA-MAP.md)

The Oracle readings are in DATA-MAP.md (`oracle_readings`, and
`incommon.p.<pid>.oracle` on the device). The dossier itself is not stored by the
app; the server keeps a hash of it as `chart_key`. The Privacy Policy section 6
lists what is sent. The device's kept reading is keyed on `birthStamp`, which
does not change with the zone: [[D-09 The birth stamp ignores the zone]].
