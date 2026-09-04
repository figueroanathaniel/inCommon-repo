# inCommon

A local-only, offline-first self-knowledge app. Astrology, Human Design,
numerology, tarot, angel numbers, dreams and synastry, plus a journal, a
practice library and crisis resources. Everything is reckoned and stored on
the device: no account, no server, no network call in the shipping build.

**V1.7.0**, the app exported 2026-08-25. Read `CLAUDE.md` before changing
anything, then `docs/PROJECT_MEMORY.txt`.

---

## Layout

| Path | Holds |
|---|---|
| `app/` | The canonical build and all 35 modules. Flat on purpose. |
| `app/components/` | Component and design doc pages. They reach up one level for modules. |
| `app/handoff/` | The suites the runners load, and `tokens.css`, which documents the token system and is never loaded. |
| `verification/` | The runners and reports, plus run screenshots. |
| `data-contracts/` | The storage schema, the migration policy, the audit, the fixtures. |
| `deploy/v6.2/` | The shipping bundle, `incommon-v6.2`, built 2026-09-04. Upload this folder, not `deploy/`. |
| `docs/` | Briefing, project memory, build report, design system, source documents. |
| `docs/oki/` | The unwired assistant's voice and grounding papers. |
| `docs/reference/` | What is known about the other organisations in this category, one folder each. |
| `inCommon Logo/` | The mark, the generated icon set, the identity sheets. |
| `tools/` | Ten scripts: six gates and four generators. |

`app/inCommonApp v2.dc.html` is the whole application, about 12,600 lines,
no build step. Two shells live inside it, chosen at 820px, and there must
never be a phone, tablet, 9:16 or desktop fork.

**`app/` is flat because the app writes `./module.js`.** A module that moves
into a subfolder stops loading and nothing reports it. `app/components/`
writes `../module.js`. `verification/` is a sibling of `app/` and writes
`../app/…`.

**`deploy/` is a shelf, not a site.** The site is one folder inside it, and a
host pointed at the shelf serves a directory with no page in it, which deploys
clean and reads as a broken link. `netlify.toml` at the root names the folder
(`deploy/v6.2`) so pointing a host at the repo works; a drag and drop deploy
takes the folder itself. Bump both that line and `BUNDLE` in
`tools/build-bundle.js` when a new bundle folder is cut.

---

## Run it

A static server is required; the service worker and the fonts want an http
origin.

```bash
npx serve .
```

Then open `app/inCommonApp%20v2.dc.html`.

## The gates

```bash
node tools/run-tests-node.js
```

43 pure assertions from the V1.2 suite, 12 browser-only ones reported skipped.

```bash
node tools/run-fixtures.js
```

Nine calculation assertions, the per-commit gate. It is deliberately narrow
and says so itself: the numerology and angel-number vectors, nothing wider.

```bash
node tools/check-purple-text.js
```

`#8b5cf6` is never text. It resolves the colour and follows the data rather
than grepping a property, which matters because the component doc pages define
`--ac2` as a different violet.

```bash
node tools/check-dead-controls.js
```

Every control that looks clickable does something. 689 handler holes across
338 loops.

```bash
node tools/token-compare.js
```

The three token declaration sites agree everywhere CLAUDE.md says they must.

```bash
node tools/run-module-tests.js
```

126 assertions over `birth-time.js`, `hd-composite.js`, `hd-wheel.js`,
`arc-solver.js` and `analytics.js`, executed as the app executes them. Thirty
two of them are births on the awkward side of a daylight saving rule that has
since changed, and ten hold the design side to a solved 88 degree arc rather
than the flat 88.36 days that was putting a quarter of readers in the wrong
Type. Both are errors that produce a chart which is complete, confident and
about a different moment.

All six green as of 2026-08-27.

The browser harness is `verification/Verification v6.0.dc.html`: 206
assertions across ten phases, 25+ minutes, served over http.
`verification/Verification R - removal phase.dc.html` runs group R alone in
about a minute as the smoke test. **Neither has been run against this build.**

The gates inside `contrastFails()` are load bearing. If a check reports green,
confirm it examined a plausible number of elements before believing it.

## The generators

```bash
node tools/build-bundle.js     # deploy/v6.2/{index,app}.html from app/
node tools/build-icons.js      # the PWA icons from the mark's definition
node tools/build-ui-icons.js   # the app's icon set into inCommon Logo/icons/
node tools/build-gazetteer.js  # the birth-city tables
node tools/check-deployed.js   # is the file on the internet the file we built
```

`build-ui-icons.js` reproduces all sixteen of its outputs byte-identical to
the 2026-08-25 export, which is the reason they are generated rather than
exported by hand.

`build-bundle.js` writes both pages of `deploy/v6.2/` and takes its version
stamp from the `sw.js` beside it: `index.html` is the Event Horizon cover and
`app.html` is the app the cover leads to. It copies the two vendored three.js
files in beside them, because the cover imports its renderer as an ES module
and a page that cannot reach it paints nothing.

`deploy/` itself is a shelf of bundles with no page in it: upload the bundle
folder, never the shelf.

## After moving a file

```bash
"../Migration 8-26/verify-migration.sh" .
```

It resolves every relative reference on disk and reports what is missing. The
four it prints as known dangling predate the migration and are explained in
`../Migration 8-26/a. rules/README.md`.

---

## Open

1. The full browser harness has not been run against this build. Group R (14
   assertions) and group N (36) were run on 2026-08-27 and both passed; the
   other eight phases, including the theme sweep and the ADA phase, have not
   been.
2. `docs/README-RUN-LOCALLY.md` and `deploy/v6.2/README-DEPLOY.md` are from
   2026-08-16 and describe the handover's folder layout, not this one.
3. The three fonts come from a CDN, so a first load is not genuinely offline
   for an offline-first app. Self-hosting them is the author's own first
   suggestion for what to do next.
