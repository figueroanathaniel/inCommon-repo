# inCommon Web Design Foundation

The visual language that governs every screen. Nothing here is decorative preference. Each rule
exists so the app reads as one hand wrote it.

## Five principles

1. **Breath.** Every element has room. Empty space is not waste; it is silence, and silence is
   part of the reading.
2. **Depth.** Layers suggest mystery. Surfaces lift from the void by a shade, never by a shadow.
3. **Warmth.** Gold is candlelight, not metal. Green is living, not digital.
4. **Slowness.** Motion is unhurried. Nothing snaps. Everything arrives.
5. **Intention.** Each pixel serves either the reader's clarity or the reader's pause.

## Voice

The writer is a spiritualist of twenty years who carries the air of a scholar. Definitions read as
observations, not as readouts.

Never used: calculate, compute, algorithm, data, process, system (of software), function, output,
input, variable, parameter.

Preferred: reveals, shows, speaks, suggests, indicates, points toward, unfolds, emerges, arises,
dwells in, resides, belongs to, carries the quality of, bears the mark of, holds the memory of.

Scientific: "The algorithm computes astral body positions from the user's birth data."
Organic: "The chart reveals where each astral body dwelt at the moment of your first breath, drawn from
the place and hour of your arrival."

No em dashes anywhere. Use a comma, a colon, or a full stop.

## Type

| Role | Face | Size | Weight | Line | Use |
| --- | --- | --- | --- | --- | --- |
| Display | Marcellus / Georgia serif | 32px | 400 | 1.2 | greetings, page titles |
| Title | Marcellus / Georgia serif | 24px | 400 | 1.3 | section headings |
| Subtitle | Karla | 14px | 600 | 1.4, uppercase, .15em | labels, badges |
| Body | Newsreader / Georgia serif | 15px | 400 | 1.7 | paragraphs and definitions |
| Small | Karla | 13px | 400 | 1.5 | descriptions, secondary text |
| Micro | Karla | 11px | 400 | 1.5, .05em | timestamps, meta |

Serif carries meaning. Karla carries mechanics: labels, counts, controls, tags.

## Color

| Token | Value | Name and use |
| --- | --- | --- |
| `--bg` | `#0d0c11` | The void. Where everything rests. |
| `--sf` | `#17151e` | The veil. Card surfaces, lifted a shade. |
| `--sf2` | `#201d2a` | The mist. Hover and nested surfaces. |
| `--tx` | `#e8e6ee` | The word. What is spoken. |
| `--dim` | `rgba(232,230,238,.55)` | The whisper. What is implied. |
| echo | `rgba(232,230,238,.4)` | What is remembered. Meta only. |
| `--ac` | `#d3ad6e` | The flame. Draws the eye, used sparingly. |
| `--ok` | `#59b37d` | The leaf. Growth, confirmation, live values. |
| `--mood` | `#8fb0c9` | The water. Calm, flow, reported states. |
| `--ac2` | `#a98fd6` | The dusk. Second accent, reference material. |
| `--warn` | `#e08d7d` | The ember. Release, caution, fire signs. |

At most two accents on any one screen.

## Spacing

4 hairline, 8 breath, 16 pause, 24 rest, 32 silence, 48 void, 64 abyss. Card padding sits at
14 to 16. Section gaps sit at 16. Page padding sits at 18 horizontal on the phone shell.

## Radius

4 subtle (tags), 8 gentle (inputs), 10 to 12 soft (rows, dropdowns), 16 to 18 rounded (cards and
modals), 999 for pills, 50% for avatars.

## Depth

No drop shadows on content. Depth comes from a background lift plus a border:
`1px solid rgba(211,173,110,.16)`, warming to `rgba(211,173,110,.4)` when a thing is open or
active. Shadow is permitted only on floating objects that must break the plane: the Stella bubble,
sheets rising from the bottom edge.

## Motion

- 0.15s micro, 0.2 to 0.3s standard, 0.4 to 0.5s for a panel arriving.
- `ease-out` for entrances, `ease-in` for exits, `ease` for state changes.
- No bounce, no spring, no overshoot. Everything settles.
- Page and screen entrance: opacity 0 to 1 with translateY 8px to 0, 0.25s ease-out.
- Dropdown: content fades up 6px over 0.2s; the chevron rotates 90 degrees over 0.3s.
- Card hover: border color and background over 0.3s ease. No scale.
- Button hover: background over 0.2s; a trailing arrow slides 4px.
- Modal: backdrop to 0.72 opacity over 0.3s, panel up 16px over 0.4s ease-out.
- Toggle knob: 0.2s ease. Tab underline: 0.3s ease.
- Waiting: a slow gold pulse or three blinking dots, never a fast spinner.

## Tags

Every claim carries its provenance: CALCULATED (green), REPORTED (water), TRADITIONAL (flame),
POSSIBILITY (dusk), SYNTHESIS, DERIVED. Tag pills are Karla 7.5px, 700, .1em, radius 4.
