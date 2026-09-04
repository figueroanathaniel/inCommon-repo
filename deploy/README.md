# deploy

One folder per bundle. A bundle is the whole site: upload it and it is live.
No build step at the host, no npm, nothing to install.

| Folder | Stamp | Built |
|---|---|---|
| `v6.2/` | `incommon-v6.2` | 2026-09-04 |

## Three ways to deploy this, and what each one needs

| How | What serves it | Needs |
|---|---|---|
| Connect the repo to the host | `../netlify.toml` names `deploy/v6.2` as the publish directory | nothing else |
| Drag `v6.2/` onto the drop zone | the folder is the whole site | its own `_redirects` and `_headers`, which are in it |
| Drag the repo folder | `../_redirects` rewrites every address into the bundle | that file, which the build regenerates |

The third one is the one that used to fail, and it failed in the worst way
available: the deploy succeeded, the link came back, and every address on it
was a not found page. `publish` in `netlify.toml` is a build setting and a
dragged folder runs no build, so it is ignored and the host serves the repo
root, which has no page in it and never will.

`../_redirects` is generated on every build and always names the current
bundle folder. Do not edit it by hand.

## The folder is named for the version, and the version moves once per deploy

The folder used to be called `v1.7` while the bundle inside it was stamped
`incommon-v5.8`, which meant nobody could tell from a directory listing what
was in there. They are the same number now, and they move together.

**A version bump belongs to a deployment, not to a build.** Rebuilding is free
and happens many times while work is in progress; each of those does not earn a
number. The stamp changes when a build has been deployed and confirmed live,
and the folder is renamed in the same change. Anything else produces a shelf of
near identical folders and two files claiming the same version with different
bytes, which is the exact failure `tools/check-deployed.js` exists to catch.

**Three places name the folder and all three must agree**: `publish` in
`../netlify.toml`, `BUNDLE` in `tools/build-bundle.js`, and `LOCAL` in
`tools/check-deployed.js`. Rename the folder and change all three in one edit,
or the build writes into a directory nothing serves.

Earlier bundles are in `../../Archive 8-26/`, one per batch folder, under the
name `index.html`.

## What the bundle contains, and why each file is there

```
index.html      the whole app, one file, 10.0 MB
sw.js           the offline shell, cache incommon-v5.8, same stamp as above
manifest.json   name, colour, icons for home-screen install
icon-192.png    icon-512.png    splash.png
minor-bodies-ephemeris.js       named by index.html as a sibling
react-18.3.1.production.min.js
react-dom-18.3.1.production.min.js
_redirects      every path resolves to index.html
_headers        must-revalidate on index.html, sw.js, manifest.json
robots.txt      allows indexing
README-DEPLOY.md
```

The three easy ones to lose are the last three before the README.
`index.html` names `./minor-bodies-ephemeris.js` and both React files
directly: React is **vendored here rather than fetched from unpkg**, so the
shipping build does not go to a CDN for its runtime. Drop them and the app
does not boot, and the failure is a blank page rather than an error anyone
reads.

`sw.js` and `index.html` must carry the same version stamp. The stamp is what
makes a redeploy actually replace an installed copy.

## Which folder you upload, and the two files that make it a site

**Upload `v6.2/`, never `deploy/`.** `deploy/` is a shelf of bundles and has
no page in it, so a host pointed at it serves a directory listing or a 404. That
is the failure that reads as a broken link: the deploy succeeded, and there was
nothing at the address. `../netlify.toml` says `publish = "deploy/v6.2"` for
the same reason, so pointing a host at the repo lands on the bundle instead of
the repo root. It and `BUNDLE` in `tools/build-bundle.js` name the same folder
and have to agree.

The second half of it is the three files below `index.html` in the listing,
which the 2026-08-16 procedure names and this folder had lost:

`_redirects` is what makes an address other than the bare one work. The router
is the hash, so the server never sees `/#/spirit/tarot`; what it sees is
whatever was typed or pasted before the `#`, and with no rule it answers 404.
One line, `/*  /index.html  200`, and every path resolves to the app.

`_headers` puts `must-revalidate` on `index.html`, `sw.js` and
`manifest.json`. Without it a redeploy can fail to arrive: the service worker
serves the copy it has, the edge serves the copy it has, and an installed phone
sits on an old build with nothing about the device to say so.

`robots.txt` allows indexing. The link is public; what a reader writes never
leaves their device, so there is nothing behind it to keep out of an index.

Both files live beside the bundle rather than in `../netlify.toml`, so a folder
dragged onto `app.netlify.com/drop` is served exactly like a deploy from the
repo, and no rule is written down twice.

## The icons in here are build output

Not a fork of `../inCommon Logo/icons/`, and they must not be repointed at it:
a deploy directory is uploaded whole. When the mark changes, rerun
`tools/build-icons.js` and rebuild.

## Rebuilding

```bash
node tools/build-bundle.js
```

It writes both pages of `v6.2/`, `index.html` for the cover and `app.html` for
the app, and takes the version stamp from the `sw.js` beside it. It inlines every script the app loads by `src` into a script block
of the same contents in the same order. The output is larger than what the design tool's
bundler produced and completely readable, which for a file people are asked to
trust with their journals is the better trade. It also means the bundle can be
grepped, which the old one could not: its assets were stored compressed and
UUID-mapped.

```bash
node tools/check-deployed.js
```

Compares the file on the internet with the file that was built. This exists
because a Netlify build plugin once re-serialised the document on the way out
and duplicated every inlined script block: 27 script tags became 79, React and
all nineteen modules executed three times over, and the site crashed on every
device. The version stamp on the live file still read correctly, which is what
made it convincing. Byte length was the tell: 26,255,170 served against
9,530,599 built.

A rebuilt bundle also cannot be verified by a plain reload, because the page
registers a service worker and you will be handed the precached copy. Use

```js
location.href = location.pathname + '?cb=' + Date.now()
```

before believing any version number you read out of a rebuild.

## Note on README-DEPLOY.md

It is the 2026-08-16 copy and calls this folder `deploy1.1`. Only the folder
was renamed; the procedure it describes still holds.
