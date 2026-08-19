# e. deploy

A ready-to-upload Netlify folder. `README-DEPLOY.md` is the full procedure,
including the cache rules and what V1.7.0 changed.

`index.html` here is the **bundled** app: one self-contained 2MB file with
the runtime, all 17 modules and the app inlined, produced from
`b. app/inCommonApp v2.dc.html`. It is a build output. Never edit it, and
never treat it as the source: fix the source in `b. app/` and re-bundle.

Two rules that have cost time before:

- **Bump `CACHE` in `sw.js` whenever `index.html` changes**, and not when
  a test changes. It is at `incommon-v2.5` now.
- **Both deploy folders must stay byte-identical.** The design project kept
  `deploy/` and `deploy1.1/`; only one of them ships, and the drift between
  them is a real hazard. Collapse to one in the new repo.

Reproducing the bundle is an early task worth scripting: inline
`support.js`, the 17 modules and the app into a single HTML file, then add
`lang="en"` to the `<html>` tag.
