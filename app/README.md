# b. app: the canonical build

Runnable as it stands. No install, no build step.

    python3 -m http.server 8000     # or any static server
    open http://localhost:8000/inCommonApp%20v2.dc.html

A plain `file://` open mostly works, but use a server: the service worker
and the fonts want an http origin.

## What is here

`inCommonApp v2.dc.html`  The entire application. Markup, then one
`class Component`. Both shells. Every screen.

`support.js`  The runtime that renders it. Vendored, not ours: it turns the
markup into React, resolves `{{ }}` holes and `sc-for` / `sc-if`, and
streams the page. Do not edit it. Do not upgrade it casually.

`handoff/tests-v14.js` + the two `Verification *.dc.html` files  The
harness. It lives here because it loads the app by relative path and must sit
beside it. See stage c.

**17 content and logic modules**, loaded in this order from the app's
`<helmet>`. The order matters, several read globals set by earlier ones:

    incommon-core.js            ephemeris, charts, numerology
    practice-library.js         the 10 practices
    profile-manager.js          profiles, memory, consent
    sabian-symbols.js           the 360 degree engine
    sabian-symbols-data.js      the 360 degree table
    minor-bodies-ephemeris.js   Chiron and the asteroids
    placement-content.js        written material per body, sign, house
    numerology-content.js       written material per number
    today-integration.js        the daily brief
    angel-numbers.js            repeating number readings
    hd-atlas.js                 Human Design gates and channels
    astropedia.js               the reference atlas
    tarot.js                    the 78 cards
    crisis-directory.js         helplines by country
    hd-life.js                  Human Design life themes
    hd-teachings.js             Human Design teachings
    gazetteer-us.js             birth city lookup

`manifest.json`, `sw.js`, the icons and `splash.png`  PWA install and
offline shell.

## Fonts

Marcellus (display), Newsreader (body) and Karla (UI), from Google Fonts over
a CDN link in the app's `<helmet>`. The shipping bundle in stage e does the
same. Self-hosting them is a reasonable early task and would make the app
genuinely offline on first load.
