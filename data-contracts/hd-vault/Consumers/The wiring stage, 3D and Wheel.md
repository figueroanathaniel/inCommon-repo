---
kind: consumer
layer: shell
source:
  - "app/inCommonApp v2.dc.html:29866 at 1c02c7c (_hsModel)"
  - "app/inCommonApp v2.dc.html:27292 at 1c02c7c (hdSceneSync)"
  - "app/inCommonApp v2.dc.html:27317 at 1c02c7c (hdSelOf)"
  - "app/inCommonApp v2.dc.html:27328 at 1c02c7c (hdHudOf)"
  - "app/hd-scene.js at 1c02c7c"
verified: "by reading; hd-scene.js computes no gate, centre or channel (grep for gateLine, CENTER_OF, HDTopology finds none)"
status: checked
---
# The wiring stage, 3D and Wheel

`hd-scene.js` (shell layer) draws a model the app builds, `_hsModel`, keyed on
`birthStamp`, the profile name and whether the atlas and wheel are loaded.

| Model field | From |
|---|---|
| `centres[]` (`name`, `defined`, `box`, `c`) | `hdChart().defined`, `BG_POS`, atlas colour |
| `channels[]` (`key`, `a`, `b`, `ca`, `cb`, `defined`) | `HD_CHANNELS` and the chart's gate set |
| `acts[]` (`key`, `kind`, `body`, `gate`, `line`, `lon`) | `hdChart().acts`; `lon` is the middle of the line from `HDWheel.gateStart`, a drawing position |
| `wheel` | `HDWheel.WHEEL` |
| `gateTips` | `GATE_NAMES` and `hdCenterOf` |
| `steps` | the nine centres, then the defined channels |
| the sky now (`setSky`) | `hdSkyNow()` |

The duplicate South Node gives two model rows each for `p:South Node` and
`d:South Node`: [[D-01 The South Node is activated twice]]. Tooltips use
`GATE_NAMES`: [[D-02 Two gate name tables disagree on six gates]].
