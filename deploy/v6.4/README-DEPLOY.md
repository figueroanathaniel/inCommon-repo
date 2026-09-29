# Deploying inCommon on Netlify, v1.1 folder, V1.7.0 build

Bundled from `inCommonApp v2.dc.html` on 2026-08-15. Service worker cache
`incommon-v2.4`, which is the thing that decides whether an installed copy
replaces itself.

**This build has no AI in it, and no account.** Four removals, described below.
Verified on 2026-08-15 by `Verification V1.4.dc.html` against this exact
source: **206 assertions, 0 failed.**

    A  Phone 375x667             17/17
    B  Tablet 820x1180           19/19
    C  9:16 vertical 1080x1920   18/18
    D  Desktop 1440x900          18/18
    S  Short desktop 1024x600    18/18
    E  Crossing breakpoints       5/5
    F  Functional repair sweep   16/16
    T  Theme sweep, 3 identities 48/48
    R  Removal phase, V1.6.0     14/14
    G  ADA phase, V1.7.0         33/33

No ungrouped rows and no phase timed out. The theme phase took 21.1s of its
900s budget, the ADA phase 35.7s of its 420s.

Two groups account for the jump from 149. **G** is new: fifteen accessibility
gaps, each one driven rather than read off an attribute, because an attribute
that is present and inert is the failure these gaps had to begin with. **T**
doubled, from 24 to 48: the contrast gate now runs at phone width as well as
desktop, so a palette cannot pass by being measured at one size.

## V1.6.0, four removals (this bundle, 2026-08-15)

**The guide is unwired.** No Stella module and no safety router is loaded, no
route reaches a chat, no control opens one, and the send path returns without
touching a chain. Every reading on every screen is arithmetic done on the
device, which is what it always was; what is gone is the layer that talked
about it. Nothing was deleted from the repo: the modules, the inspectors and
the reference material all stay, and re-wiring is four script tags plus two
functions.

The crisis controls are not part of this and did not move. Get Help, the Self
Help Yellow Pages and the full directory are where they were, and the suite
asserts it.

**No account, no sign-in.** The sign-up screens, the captcha, the SMS code, the
four provider handshakes, the sky letter and sign-out are all gone. A fresh
device opens on one screen asking for a birth moment, with a Skip, and never
asks again. Everything was local before and is local now; the account was
ceremony around data that never left the phone.

**The epistemic badges are hidden.** The bracketed CALCULATED, TRADITIONAL,
POSSIBILITY and SYNTHESIS labels no longer print. The readings are still
written against those distinctions, so the copy is as careful as it was, but
the reader gets plain prose.

**Together is now Synastry.** The two-person chart keeps every part of itself:
the summary ring, the six key contacts, the seven by seven aspect grid, the
element blend, the Life Path pairing and the Human Design electromagnetics. Its
address moved from `/spirit/together` to `/spirit/synastry`, and the old
address still lands on the screen and corrects itself, so existing links work.

The daily **Together** horoscope page is a different feature (the three systems
read as one) and keeps its name.

**Fonts.** Only the base three (Marcellus, Newsreader, Karla) are in the head.
Dawn's Petrona is fetched when that theme is first chosen, so a theme switched
with no signal falls back to the UI face and says so until the face is cached.
That is designed behaviour, not a bug to report.

- Service worker cache `incommon-v2.3` to `incommon-v2.4`.
- Harness note: `frame()` now appends a cache-buster. Without it the service
  worker can hand the suite a precached copy of an older bundle, and the run
  grades a build that is not on disk. That happened once and looked exactly
  like a passing removal.
## What V1.7.0 changed

The build is accessible now, against a fifteen point audit. Nothing about the
reading changed: this is landmarks, focus, announcements, and words next to
every colour that was carrying meaning on its own.

- A skip link, first in the tab order of both shells, hidden until focused. It
  is a button, not an anchor: an href fragment would be written to
  `location.hash`, which is the router, so a conventional skip link would
  navigate the app instead of moving focus.
- Two live regions at the app root, one polite and one assertive. Chart
  redraws, zoom, theme changes, tarot draws and Together mode switches announce
  through them, driven off the state change rather than wired into each
  handler, so a change reached by keyboard, by click or by deep link announces
  the same way.
- A focus trap on every sheet: Tab wraps at both ends, Escape closes and hands
  focus back to whatever opened it.
- Landmarks (main, navigation, contentinfo, search), one h1 per screen,
  `aria-current` on the live nav item, and the Spirit tablist wired to its
  panels in both directions.
- Single select chips are radiogroups with arrow key, Home and End support,
  instead of rows of independent `aria-pressed` buttons.
- The natal wheel and the bodygraph carry a role description and a plain
  language summary, and the summary leaves the accessibility tree while a
  detail sheet is open.
- Colour is never the only carrier: the aspect lines have a named legend, the
  synastry ring prints its band in words, mood keeps its word beside its dot.
- Field level errors on the first run form, with `aria-invalid` and
  `aria-errormessage` that come off together the moment the field is fixed.

Three gaps could not be met the way the audit words them, because the audit was
written against V1.5.7, and the harness says so rather than dropping them:

- **The CAPTCHA gap.** There is no CAPTCHA in this build and no account behind
  one. G4 asserts that absence instead of testing an alternative path.
- **The account gate field errors.** There is no account gate. The same
  treatment is on the first run birth form, which is the only form that
  validates.
- **`<html lang>`.** The app is a Design Component and the wrapper owns the
  document element, so the template cannot reach it. The logic class sets it on
  mount and keeps it in step. The first attempt read the language from the
  stored Stella conversation key, which on a device with `ja` left in it
  labelled this entirely English interface as Japanese and would have pointed a
  screen reader at a Japanese voice. The UI language is its own value now,
  seeded `en`. The served `index.html` also carries `lang="en"` statically,
  so assistive technology has a language before any script runs.

- Two fixes landed after the first green run, both caught by review rather than
  by the suite, and both now have a row that would catch them again:
  the desktop Today header said the app name, which left the landing screen as
  the one screen whose only heading did not name it (G3 counted headings but not
  what they said, so it certified the fault); and the focus trap was debounced
  on `requestAnimationFrame`, which a hidden tab never runs, so a sheet opened
  after switching tabs was never trapped. The debounce is a microtask now.
- Harness note: the theme phase costs about 10s. A backgrounded tab used to
  inflate that to 428s, which is why its `race()` cap is 600s. Read
  `__v14ThemeMs`, not the clock.
- Harness fix: `sleep()` in `handoff/tests-v14.js` now runs off a Worker
  clock rather than `setTimeout`. A hidden tab clamps `setTimeout` chains to
  roughly one call a minute, and every phase is a chain of hundreds of them; the
  sweep sat four minutes inside a step that costs three seconds and was heading
  for an F-TIMEOUT caused by the tab rather than the build. Worker timers are
  not throttled, so a run now costs the same whether anyone is watching it.
- The cache is `incommon-v2.5`. `index.html` changed with the accessibility
  pass, so the offline shell has to invalidate. Bump it when `index.html`
  changes, not when a test does.
- The skip link is 1x1 until focused, which is the point of it, so it is the
  one control exempt from the 44px floor. It is marked `data-skip` so the
  harness can tell it from an undersized button, and the exemption is paid for
  by G1c, which focuses it and measures the box it grows to. Ten tap-target
  rows failed on it before it was marked, across every viewport and every
  theme: that is the gate working, and it is why the exemption is narrow.

## The identities are unchanged

V1.5.0 through V1.5.7 shipped **three visual identities plus a contrast
modifier**: midnight (the default), dawn (warm, set in Petrona), gold (the older
gold and violet, set in Marcellus). Theme is stored per profile, inheriting the
device value once and owned independently after. `#2fff8f` action green and
`#e5534d` safety red are fixed in all four combinations, so the contrast
guarantees hold whichever identity is live. Gold gets a green primary button on
purpose. None of that moved in V1.6.0.

This folder is the whole site. There is no build step, no npm, nothing to
install. Drag it onto Netlify and it is live.

    deploy1.1/
      index.html      the entire app, one self-contained file
      manifest.json   name, colour, icons for home-screen install
      sw.js           offline shell (service worker)
      icon-192.png    home screen icon
      icon-512.png    home screen icon, larger + maskable
      splash.png      iOS launch image
      netlify.toml    build + header + redirect config
      _headers        same headers, for hosts that read this instead
      _redirects      sends every path to index.html
      robots.txt      allows indexing

## Checklist before you drag it

- [x] `index.html` rebuilt from the current `inCommonApp v2.dc.html`
- [x] install metadata in the outer head (manifest, icons, splash, theme colour,
      Apple standalone flags) so the browser sees it before the app unpacks
- [x] service worker cache `incommon-v2.4`, bumped with the bundle, which is
      what makes a redeploy actually replace an installed copy
- [x] `must-revalidate` on `sw.js`, `manifest.json`, `index.html`
- [x] all three PNGs present (`icon-192`, `icon-512`, `splash`)
- [x] no stray staging files in the folder

## Earlier releases, kept for the record

Everything below predates V1.6.0. Where it describes Stella tones, the account
gate, epistemic tagging or the Together name, read it as history: all four were
removed above.

- **The assistant is gone from the interface.** V1.4.6 removed every visible
  trace of Stella: the nav entry in both shells, the chat panel, the floating
  bubble and peek, the "Talk to Stella" and "Start the conversation" cards, the
  four "Ask Stella" buttons, the `/stella` route, and every line of copy that
  named her. Consent, memory and safety copy now speak as inCommon. The reply
  pipeline modules still load and still work; nothing in the UI calls them.
- **New: the houses are clickable.** Each of the twelve house bands in the natal
  wheel is a hit target, as is every row of the Houses list, in both shells. The
  sheet gives the cusp degree and sign, the house system actually in use, the
  angular/succedent/cadent class, what the house governs, the cusp ruler and
  where that ruler lives, every one of your bodies inside it read one by one, the
  opposing house on its axis, and a testable framing. Empty houses are handled
  properly rather than left blank: they hand off to their ruler. All content is
  assembled from PlacementContent, so a house never contradicts a planet page.
- **New: Retrograde, under Stellium in Chart Features.** Current, recently
  finished, and upcoming retrogrades for Mercury through Pluto, computed from the
  same ephemeris as the wheel, with station degrees, dates, per-body traditional
  readings, and the same CALCULATED / TRADITIONAL / POSSIBILITY tagging as the
  rest of the app. Both shells, one array, no fork.
- **Dev note: `reading` mode is held, not shipped.** V1.4.4 built a long-form
  reply mode and wired it through the prompt builder, the post-processor and the
  transport layer. V1.4.5 unwired all three seams again, because the mode had no
  UI entry point and unreachable code in a bundle is just weight. Nothing was
  deleted: `stella-voice-v144.js`, the inspector, the reconciliation doc and the
  reference material all stay in the repo. Re-adding it is a feature change with
  its own harness run. Users see no difference either way.
- `index.html` rebuilt for V1.4.5. Four source releases land in this one
  bundle, because the previous shipped folder predated all of them:
  **V1.4.2** account gate (email + password, phone + SMS code, OAuth stubs for
  Google, Meta, TikTok, OpenAI; anonymous data is merged on sign-in, never
  discarded). **V1.4.3** real popup OAuth handshake, and small talk answered on
  device in every tone rather than Everyday only. **V1.4.4** the Stella voice
  layer: new file `stella-voice-v144.js`, a new `reading` mode declared in both
  `stella-prompt-builder.js` (MODES) and `stella-post-processor.js` (LIMITS),
  and domain-matched example injection into the user turn. **V1.4.5** unwired
  that mode again (see the dev note above).
- Service worker cache `incommon-v1.6` → `incommon-v2.2`.
- No UI affordance for `reading` mode ships in this bundle. The tone selector is
  still quick / standard / deep / everyday. Adding a fifth chip at 375px would
  put the touch-target and wrap assertions in Check A at risk, so it is being
  held for its own change and its own verification run.

### Earlier folders

- **The 2026-08-05 folder, V1.4.5.** Bundled from `inCommonApp v2.dc.html`
  carrying V1.4.2 through V1.4.5: the account gate (email, phone, OAuth popups)
  and small talk in every tone with the guard-precedence fix. Verified by
  `Verification V1.4.dc.html` on 2026-08-05, run after the voice wiring and
  before that bundle: 110 assertions, 0 failed (A 17/17, B 19/19, C 18/18,
  D 18/18, S 18/18, E 5/5, functional 15/15). Superseded by the V1.5.7 bundle
  above, whose figure is 134. Kept because the per-check breakdown is the
  baseline the theme rows were added to, not because the folder still ships.

- `index.html` rebuilt for V1.4.1: adds the Together view (fifth Spirit tab in
  the vertical shell, fifth My Charts card on desktop, `/spirit/together`) and
  the Everyday reply tone. New storage key: `incommon.stella.lang`.
- Service worker cache `incommon-v1.4` → `incommon-v1.6` (v1.5 was an
  intermediate bundle that predated the 44px back-link fix; do not ship it).
- `index.html` rebuilt earlier for V1.4: carries the purple-text contrast fix
  (`--ac2-hi`), the aligned `--crisis` token, the 44px control floor, and the
  short-window rail fix. The previous folder predated the last source pass.
- Earlier: service worker cache `incommon-v1.1` → `incommon-v1.4`.

- `index.html` rebuilt from the current canonical build (`inCommonApp
  v2.dc.html`), which is post-consolidation: one codebase, vertical snap shell
  below 820px, desktop sidebar shell at 820px and up.
- The desktop sidebar **Get Help** button is gone. Crisis resources are reached
  from Settings, from the safety router, and by pressing **H** three times from
  anywhere.
- `theme_color` and `background_color` corrected to `#05060a` to match the
  shipped palette (they were still `#0d0c11`).
- `orientation` relaxed from `portrait` to `any` , the build has a real desktop
  and landscape layout now, and locking orientation fought it.
- Service worker cache bumped to `incommon-v1.1`, so installed phones fetch the
  new shell instead of serving the old one.
- Added `netlify.toml` / `_headers`: `sw.js`, `manifest.json`, and `index.html`
  are served `must-revalidate` so a redeploy actually reaches installed
  devices. Previously they could sit in the CDN cache and users would stay on
  an old build indefinitely.
- Added `_redirects` so any typed path resolves to the app instead of a 404.
- Added install metadata to the outer page head, so the manifest and icons are
  visible to the browser before the app unpacks itself.

## Deploy, drag and drop (easiest)

1. Go to **app.netlify.com/drop**.
2. Drag the **deploy1.1** folder onto the drop zone. The folder itself, not the
   files inside it, and not a zip.
3. A link appears, e.g. `https://quiet-harbour-4d21f9.netlify.app`. Open it.
4. **Site configuration → Change site name** to something memorable.
5. **Claim the site** when Netlify prompts you, or it expires.

## Deploy, CLI (if you prefer)

    npm i -g netlify-cli
    cd deploy1.1
    netlify deploy --prod --dir .

## Redeploying later

Netlify dashboard → your site → **Deploys** → drag the new folder onto the
manual deploy area at the bottom. The URL does not change.

Installed phones pick up the new version on the next launch with signal. With
the cache headers in this folder that is now reliable; it may still take two
launches, because the service worker serves the copy it has while it fetches
the new one.

## Install on a phone

**iPhone:** open the link in Safari (not Chrome), wait for the Today screen,
tap **Share**, then **Add to Home Screen**.

**Android:** open in Chrome, three-dot menu, **Install app**.

## Requirements

HTTPS. Netlify gives you that automatically. Offline mode and home-screen
install do not work over plain http.

## Privacy note, unchanged

Everything written in inCommon stays on the device that wrote it. Journals,
moods, profiles, conversations: none of it leaves the phone, and none of it
syncs. The link is public; the contents are not. A stranger who opens your link
gets an empty app.

Deleting the app deletes the writing with it.

## Troubleshooting

**Blank dark screen.** Give it ten seconds , the app unpacks on first load. If
it stays blank you dragged a zip, or a folder containing the folder.

**A file listing instead of the app.** You dragged one level too high. Drag
`deploy1.1` itself.

**Grey icon on the home screen.** The PNGs did not upload. Confirm all three
images are in the folder, redeploy, then remove and re-add the home screen icon.

**Works online, not offline.** Open it once on a good connection and leave it
for fifteen seconds so the service worker can store the shell.

**Old version keeps appearing.** Hard-reload in the browser, or delete the home
screen icon and re-add it. If it persists, check that `netlify.toml` deployed
with the folder.
