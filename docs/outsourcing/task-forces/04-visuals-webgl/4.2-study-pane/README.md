# 4.2 study pane: the reading beside the chart, and the phone sheet

Status: DRAFT for the Task Force 4 primary to wire. Written by Task Force 6 at
the owner's request on 2 November 2026, against `taskforce/04-visuals-webgl`
at `18e341a` (Sol's restored two-press rule). Nothing here is loaded by the
app, and nothing in `app/` was changed. Wiring it in, and every app gate that
follows, stays with the 4.2 primary, because 4.2 owns the stage mounting code.

It serves 4.2 Task 1: "Selecting a gate, channel or centre ... opens its Atlas
entry beside the chart, not over it, in both shells. On the phone that is a
sheet that leaves the chart visible above it."

## Files

| File | What it is |
|---|---|
| `pane.css` | The rules for the head stylesheet. Both presentations, keyed off the shells that exist (`[data-shell="desktop"]` and `[data-vt]`). |
| `pane-template.html` | The markup in the app's own template dialect, with the four places it goes. The reading blocks are the hdPop sheet's markup with `hdPop` renamed `hdPane`. |
| `pane-controller.js` | The host methods (the interface below) and the pure state function `reduce`. Plain ES5 plus method shorthand, so it can be pasted onto the app class. |
| `preview.html` | A standalone page that runs the CSS and the controller against a flat stand-in stage. For looking at and for the checks. Not the app. |
| `check-pane.js` | 45 checks: 13 on the states in Node, 5 on house rules in these files, 27 in Chromium at 390x844 (touch) and 1440x900. |

## Where it sits

**Desktop (820px and up): beside the chart.** The pane is the first child of
the right column, the one that holds the type card (line 8341 on the branch),
and is sticky to the Spirit page's own scroller. The stage column is not
touched, so the stage keeps its size and the WebGL canvas is never resized by
opening or closing the pane (check B18). Width comes from the column: at
least 340px, about 510px at 1440x900 in the preview.

**Phone (below 820px): a sheet, docked above Get Help.** Fixed to the `[data-vt]`
root, placed directly after the Get Help dock in the markup, NOT inside
`[data-vt-modals]` (that wrapper turns children into modal sheets over a
full-screen overlay). Its bottom edge is the dock's top edge, so Get Help and
the nav are never covered (B5, B6). Its top can never rise above
`--hd-top-reserve`, 46% of the dynamic viewport height (B4). While it is up,
the root carries `data-hd-pane-open="1"` and the stage is fitted into the top
reserve instead of its 3:4 box, so the whole chart stays in view above the
sheet (B7). hd-scene.js already resizes from its ResizeObserver; nothing in the
scene changes for this.

**No backdrop, scrim or dimming layer anywhere.** The pane is the only painted
surface. The stage stays live and pressable with the pane open (B8 probes 12
points over the stage, B9 looks for any painted full-screen layer including
`::before` and `::after`, B19 on desktop). The pane is a `role="region"`, not
a dialog, so the app's own dialog trap (`syncTrap`) does not grab it.

**Colour and type.** Tokens only, so all four theme identities and the
contrast modifier reach it. Purple text is `--ac2-hi`; `#8b5cf6` never colours
text; `#e5534d` appears nowhere in the pane (C2, C3). The one green surface is
the existing primary action, Learn more in the Atlas. The reading's own edge
colour (`hdPopEdge`) becomes the pane's accent edge through `--hd-pane-edge`.

## Visibility states

`state.hdPane` is `null` (closed) or `{ key, how, low }`. Every change goes
through `HDPane.reduce`, so the rules are checked without a browser (A1 to A13).

| From | Event | To |
|---|---|---|
| closed | first press or arrow step (`select`) | closed. The scene highlights and the panel under the stage names it, as today. |
| closed | second press, Enter, Space, or Open the reading (`open`) | open on that entry |
| open | `select` on another element | open on the new entry (follow, see Decisions) |
| open | `select` with nothing (Whole chart) | closed |
| open | `open` on any entry | open on it, raised if it was low |
| open | `low` (phone toggle) | low: head row only, the whole stage back |
| low | `low` | open |
| any | `close` (Escape, the close button, a route away) | closed |
| any | 2D, Wheel or 3D switch; crossing 820px | unchanged. The entry carries across views and shells (B27). |

## Keyboard

| Where focus is | Key | Result |
|---|---|---|
| stage | arrows | the scene steps and names (unchanged); an open pane follows; focus stays on the stage (B20, B21) |
| stage | Enter or Space | opens the pane and moves focus to the pane's title (B13, B22) |
| stage, pane open | Escape | closes the pane; focus stays on the stage (B26) |
| pane | Tab, Shift+Tab | cycle through the pane's controls and wrap; focus does not leave the pane (B23, B24) |
| pane | Escape | closes the pane and returns focus to what opened it, the stage normally (B14, B25) |

Escape is stopped at the pane and at the stage wrapper. Without that, the
shells' document listeners also see it, and on the phone `vtBind`'s Escape sets
`spiritView: null`. B14 and B25 count document-level Escapes and fail if one
gets through. A pointer press that opens the pane leaves focus where it was, so
nothing jumps on a phone.

Tab wrapping inside the pane was asked for. It is not a keyboard trap in the
WCAG 2.1.2 sense because Escape always leaves, and the pane says so with
`aria-keyshortcuts="Escape"`.

## The interface for the scene and the host

The renderer stays a renderer. app/hd-scene.js keeps its two callbacks and
gains no DOM, panel or state code. All of the below is host code.

| Method | Called from | Does |
|---|---|---|
| `hdPaneSelect(key, how)` | the scene's `onFocus`, and Whole chart with `null` | the selection-change hook |
| `hdPaneOpen(key, how)` | the scene's `onOpen`, the 2D wiring's presses, Open the reading | open(entry). `how === 'key'` moves focus into the pane |
| `hdPaneClose(reason)` | close button, Escape, routes | close(). `'escape'` and `'button'` return focus |
| `hdPaneLow(low)` | the phone toggle | head row only, or head and body |
| `hdPaneKeys(e)` | `onKeyDown` on the pane | Tab wrap, Escape |
| `hdStageKeys(e)` | `onKeyDown` on the stage's wrapper card | Escape while open |
| `hdPaneSync()` | `syncTrap()` and `componentDidUpdate` | focus and the phone stage reveal, once the pane has landed |
| `hdPaneVals(selVals)` | the template values | `hdPaneOn`, `hdPaneState`, `hdPaneOpenAttr`, and the reading as `hdPane*` |

Keys are the scene's own: `c:<Centre>`, `ch:<a>-<b>`, `g:<gate>`, `a:<activation>`.
The host's existing `hdSelOf(key)` turns one into the sel the reading needs.

### Wiring steps for the primary, in order

1. Add the methods to the app class and `hdPane: null` to the initial state
   (and to the resets that clear `hdSel`).
2. Let `hdPopVals` take a sel: `hdPopVals(sel = this.state.hdSel)`. The pane
   calls `this.hdPaneVals(this.hdPopVals)`, spread into both shells' vals.
3. In `hdSceneMake()` (line 27280 on the branch):
   `onFocus: (key, how) => { this.setState({ hsFocus: key }); this.hdPaneSelect(key, how); ... }`
   and `onOpen: (key, how) => this.hdPaneOpen(key, how)`.
4. In hd-scene.js, one argument only: pass `'tap'` or `'key'` as the second
   argument of `onOpen` (the pointer path at line 1334 and the Enter path at
   line 1362), as `onFocus` already does. Without it every open counts as a
   tap and Enter will not move focus into the pane.
5. Whole chart (`hsClear`) calls `hdPaneSelect(null)`; the 2D wiring's presses
   call `hdPaneOpen` with the matching key instead of `hdOpen(sel)`.
6. Insert the four markup pieces from `pane-template.html` and the rules from
   `pane.css` into the head stylesheet.
7. Call `this.hdPaneSync()` at the end of `syncTrap()`.
8. On the phone, route `hdPaneRevealStage` through `vtSettle` on the element
   that actually scrolls the Spirit page (set `HD_PANE_USE_SETTLE`), because a
   programmatic scroll fights mandatory snap. The draft uses `scrollTo`.
9. Rebuild the bundle and run the gates the charter names, H included.

## Checks

```
node docs/outsourcing/task-forces/04-visuals-webgl/4.2-study-pane/check-pane.js
PANE_SHOTS=/some/dir node .../check-pane.js     # also writes three screenshots
```

Result on 2 November 2026: 45 passed, 0 failed (Chromium from the preinstalled
Playwright, software rendering). The checks were also run against broken
copies to confirm they catch the defects they name: removing the Escape
`stopPropagation` fails B14 and B25; a 20% top reserve fails B4, B7, B8 and
B9; a gray `::after` overlay on the root fails B8 and B9; removing the Tab
wrap fails B23 and B24; a one-press stand-in fails B2 and B15.

What these checks do NOT show, all not run:

- anything in the real app: the pane is not wired, so no app gate, no
  `node tools/drift-check.js --force --with-h`, no H phase;
- the real hd-scene.js stage (the preview's stage is a flat canvas that copies
  the two-press rule), and the WebGL canvas resizing into the top reserve;
- the template runtime's event order: the draft assumes `onKeyDown` binds on
  the element, so `stopPropagation` beats the document listeners. `ddKeys`
  relies on the same, but it was not confirmed for this pane;
- the four theme identities and the contrast modifier (the preview carries
  Deep Field tokens only); `contrastFails()` and `tapTargets()` were not run;
- reduced motion: the app's head stylesheet already shortens every animation
  under `prefers-reduced-motion` (line 88); the preview has no such rule;
- a screen reader, and any physical iPhone, Android device or hardware GPU.

## Observed in the branch's code, not run

- The current hdPop sheet is `position:fixed; inset:0; z-index:72` with
  `background: rgba(8,7,11,.76)` (phone, line 7002). The Get Help dock is
  `z-index:62`, so while that sheet is open it covers Get Help on the phone.
  The pane does not.
- `dialogEscape()` does not clear `hdSel`, so Escape may not close the hdPop
  sheet today. Inferred from the code only.

## Decisions for the owner

1. **Follow.** While the pane is open, should a first press (or an arrow step)
   on another element move the pane to it? Recommended: yes. The reader has
   already asked for readings, and a pane that disagrees with the highlight
   breaks Task 2 ("whatever they read lights up on the chart"). With it off
   (`HD_PANE_FOLLOW = false`), the pane keeps its entry until a second press.
2. **Narrow desktop.** The page's two columns wrap below roughly 1000 to 1170px
   of window (estimated from the markup's 520px and 340px column bases, the
   sidebar and the padding; not measured in the app). There the right column,
   and so the pane, sits under the stage instead of beside it. Options: accept
   it, or give the pane its own column beside the stage in that range. Either
   keeps the one 820px breakpoint for the component tree.
3. **Top reserve.** 46% of the screen is held for the stage on the phone.
   Larger shows more chart and less reading.
