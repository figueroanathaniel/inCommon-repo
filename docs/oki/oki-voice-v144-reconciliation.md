# Oki voice v1.4.4: reconciliation with the shipped pipeline

Source: `uploads/oki_voice_reference_v1.4.4.md` (voice calibration session).
Implementation: `oki-voice-v144.js`. Inspector: `Oki Voice v1.4.4.dc.html`.

The reference document is a voice spec, and a good one. It is not a safety spec.
As written, **all six of its gold-standard responses would be rejected by the
live pipeline**, not for tone, but for tags, dashes, attribution, and length.
This document records the seven conflicts and how each was resolved. In every
case the contract won and the voice was rebuilt to fit inside it.

| # | Conflict | Resolution |
|---|---|---|
| R1 | No epistemic tags. `buildSystem()` requires one per substantive segment (E8). | Tags stay, inline at segment start, never as headers. A tag opens a paragraph of prose. |
| R2 | Em dashes throughout. Banned: the app renders raw text. | Rewritten with colons, commas, sentence breaks. Closer to the doc's own rhythm than the dashes were. |
| R3 | Declarative claims stated as fact. BOUNDARIES require attribution. | **Attribute once per system, then speak declaratively inside that frame.** The frame carries the epistemics so the prose keeps its force. The single most important rule in the module. |
| R4 | Architecture is Reception → Terrain → Reading → Invitation; pipeline is Recognition → Agency → Action → Reflection. | Not rivals. One is a voice surface, one is an ethical spine. Mapped beat to beat in `ARCH`. |
| R5 | Examples run 180: 260 words; deep caps at 180. | New `reading` mode (150, 330w, 3: 4 paragraphs, t=0.85). The doc's examples are readings, not chat turns. quick/standard/deep untouched so `tests-v14` still passes. |
| R6 | Example 6 derives a life path and a chart position from a raw birth date. Oki never calculates. | She may show arithmetic for numbers already in `<user_context>`; she may never derive a position from a birth date. Example 6 recites the app's reduction instead of performing it. |
| R7 | No `SOURCES:` line; citation contract withholds replies without one. | The transport layer appends it. The voice never writes it, and `checkVoice()` strips it before checking. |

## What the module gives you

- `voiceSection(mode)`: the system-prompt block. Splice between **WHO YOU ARE**
  and **EPISTEMIC TAXONOMY** in `buildSystem()`. Adds voice and shape, removes no
  boundary. ~2.3k characters.
- `SHOTS`: the six examples rewritten contract-compliant, tagged by domain.
- `selectShots(query, max, context)`: domain-matched selection, capped at two,
  honouring the doc's instruction never to paste all six. Reads the chart context
  as well as the query, because "why do I burn out when I lead" contains no
  Human Design vocabulary at all.
- `checkVoice(text, mode)` is the mechanical drift detector: dashes, exclamations,
  emoji, markdown, banned phrases, determinism, diagnosis, missing tag, tag
  density, word band, paragraph shape, missing invitation, sentence rhythm,
  unattributed `[TRADITIONAL]`.
- `TESTS`: 12 mechanical cases (self-checking) and 6 judge-only rubric items.

## What is deliberately not mechanical

Six failures no regex will catch. They need a human or a model grader:
attribution-then-force, tension held rather than resolved, absence of cold
reading, an invitation answerable this week, image specificity, and the
distress downshift (four paragraphs of metaphor at someone who said they cannot
get out of bed is the worst pass this voice can produce).

## Open question for you

The `rhythm` check requires at least one sentence under ten words per reply and
a mean under 32. That is a proxy for the doc's paragraph music, and proxies drift
into cargo cult. If it starts rejecting good replies, loosen it: unlike
`contrastFails()`, this gate is **not** load-bearing for safety.

## Not yet wired

`oki-voice-v144.js` is standalone. It is **not** imported by
`inCommonApp v2.dc.html` or `oki-prompt-builder.js` yet. Wiring it means:
adding `reading` to `MODES`, calling `voiceSection()` inside `buildSystem()`,
routing `selectShots()` into the user turn on drift, and re-running
`Verification V1.4.dc.html`. Say the word.
