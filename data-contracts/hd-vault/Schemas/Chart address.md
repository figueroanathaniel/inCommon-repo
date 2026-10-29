---
kind: schema
layer: mechanics
source:
  - "app/hd-topology.js:70 at 1c02c7c (channelKey)"
  - "app/hd-topology.js:37 at 1c02c7c (CENTERS)"
  - "app/inCommonApp v2.dc.html:27317 at 1c02c7c (hdSelOf: c:, ch:, g:, a:)"
  - "app/inCommonApp v2.dc.html:29878 at 1c02c7c (_hsModel.acts key)"
  - "app/inCommonApp v2.dc.html:20037 at 1c02c7c (atlasSlug)"
  - "app/inCommonApp v2.dc.html:21689 at 1c02c7c (atlasEntries: chapter:slug)"
  - "app/inCommonApp v2.dc.html:14493 at 1c02c7c (human-design-atlas, openPath: /library/human-design-atlas/gate/<n>)"
  - "tools/build-learn-pages.js:234 at 1c02c7c (gatePath, the Learn page app links)"
verified: "by reading every place the build already names a part of a chart; a proposal, not code"
status: draft
---
# Chart address

**A proposal for assignment 1.2 to decide.** 1.2 attaches a note to "an address
in a chart". This note defines what an address is, from what the code already
names, and says which addresses survive a corrected birth time.

## What the build already calls things

| Part | 3D stage and panel (`hsFocus`, `hdSelOf`) | 2D sheet (`hdSel`) | Atlas entry (`chapter:slug`) | Address bar |
|---|---|---|---|---|
| centre | `c:Solar Plexus` | `{ kind: 'center', name }` | `centers:solar-plexus` | none |
| channel | `ch:20-34` | `{ kind: 'channel', a, b }` | `channels:20-34` | none |
| gate | `g:20` | `{ kind: 'gate', gate, line }` | `gates:g20` | `/library/human-design-atlas/gate/20` |
| gate line | none | the `line` inside the gate selection | none (the atlas's `lines:3` is line 3 in general) | none |
| activation | `a:d:Moon` (from the 3D key `d:Moon`) | none | none | none |
| type, authority, strategy, profile, definition | none | `{ kind: 'type' }` and so on | `types:generator`, `authorities:sacral`, `profiles:1-3` | none |

`atlasSlug(s)` lowercases and turns every run of other characters into one dash.

## Proposed addresses

Plain strings, one form per kind, built only from the facts in [[Centres]], [[Channels]] and [[Gates]] and from the [[Activation]] fields.
Nothing personal is in an address; the chart it belongs to is carried beside it.

| Kind | Form | Example | Built from |
|---|---|---|---|
| centre | `centre:<name>` | `centre:Solar Plexus` | `HDTopology.CENTERS` name, exact case and spacing |
| channel | `channel:<low>-<high>` | `channel:20-34` | `HDTopology.channelKey(a, b)` |
| gate | `gate:<n>` | `gate:20` | 1 to 64 |
| gate line | `line:<gate>.<line>` | `line:20.3` | the tradition's own notation, gate dot line |
| activation | `activation:<side>:<body>` | `activation:design:Moon` | side `personality` or `design`, body from the thirteen ([[Activations]]) |
| chart facet | `facet:<name>` | `facet:type`, `facet:authority`, `facet:profile`, `facet:definition`, `facet:cross` | the chart as a whole |

Two rules carry the weight:

1. **An activation is addressed by who it is, not where it landed.**
   `activation:design:Moon` is the design Moon wherever it falls; its gate and
   line are the value at that chart version, not part of the address. A note
   about "my design Moon" follows the Moon.
2. **Centres, channels, gates and gate lines are positions in the system**, so
   their addresses exist in every chart. What a chart decides is whether it
   holds them (defined, activated, held by which activations). A note on
   `channel:20-34` is still about 20-34 when the chart changes; what can change
   is whether the chart defines it.

So a note should store the address **and a snapshot of what it resolved to**
when it was written (for example `{ held: true, by: ['activation:personality:Sun'], value: '20.3' }`),
and a chart version change is detected by resolving the address again and
comparing. 1.2 decides what the screen does with a difference.

## What a corrected birth time does

Measured in this build's own motion, not estimated by rule:

| Address | Survives a corrected time? |
|---|---|
| `centre:*`, `channel:*`, `gate:*`, `line:*`, `facet:*` | the address always survives. Its resolution (held or not, defined or not, which line) can change. |
| `activation:*:*` | the address always survives; its gate and line can move |

What moves, and how fast, for a correction of the birth time:

| Activation | Moves by about | A line (0.9375 deg) in about | A gate (5.625 deg) in about |
|---|---|---|---|
| Moon, both sides | 13 deg a day | 1.7 hours | 10 hours |
| Sun and Earth, both sides | 1 deg a day | 23 hours | 5.6 days |
| Mercury, Venus | up to about 2 deg a day, near zero when stationary | 11 hours or more | 2.8 days or more |
| the slow bodies and the node | a few arcminutes a day or less | days to weeks | weeks or more |

The design side moves with a time correction too: the [[Design moment]] is
solved from the Sun at birth, so a correction of `h` hours moves the design
instant by about `h` hours.

An unknown time is drawn at 12:00 local ([[Birth instant]]), so supplying the
real time can move the two Moons by up to half a day of motion, about 6.5 deg,
which is more than a gate. So for a chart whose time state is not `known`, the
two Moon activations, and any channel, centre, Type or Authority that depends
on them, should be treated as provisional. birth-time.js already names "the Moon
to the degree" and "gate lines near a boundary" as time dependent.

A corrected **date** or **place** (the zone) can move everything, including the
Type: 1.2's chart versions are the right unit for that, not a migration of
addresses.

## Relation to the existing names

| Proposed | 3D key | Atlas `chapter:slug` | Address bar |
|---|---|---|---|
| `centre:Solar Plexus` | `c:Solar Plexus` | `centers:` + `atlasSlug('Solar Plexus')` | none |
| `channel:20-34` | `ch:20-34` | `channels:20-34` | none |
| `gate:20` | `g:20` | `gates:g20` | `/library/human-design-atlas/gate/20` |
| `line:20.3` | none | none | none |
| `activation:design:Moon` | `a:d:Moon` | none | none |
| `facet:type` | none | `types:` + slug of the chart's type | none |

Each mapping is mechanical in both directions, so the existing names do not
have to change. The 3D keys have one collision today: `p:South Node` and
`d:South Node` occur twice ([[D-01 The South Node is activated twice]]); the
proposed form does not inherit it, because it addresses the body and there is
only one South Node.

## Open for 1.2

- Whether a note on a gate line is about the gate line in the system
  (`line:20.3`) or about "the line my Sun holds" (`activation:personality:Sun`).
  Both are proposed because both are things a student writes about.
- Whether the Incarnation Cross is a facet now, since the app computes none
  ([[Incarnation cross]]).
- Colour, tone and base: not computed (3.2 Color). If they arrive, an
  activation's value grows (`20.3.4.2.1`), and the address does not change.
