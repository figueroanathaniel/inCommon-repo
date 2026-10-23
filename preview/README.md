# preview/: unpublished builds

Each folder here is a whole site built from the same source as `deploy/`, for
trying a change in an unpublished deploy before it reaches the real one. None of
them is published, and nothing in the build or the deploy check reads them.

| Folder | What it tries | Built with | How to deploy it |
|---|---|---|---|
| `fonts-self/` | The four typefaces served from this site instead of Google Fonts | `node tools/build-bundle.js --fonts self --preview preview/fonts-self` | docs/FONTS.md |

A folder here goes stale the moment the app changes, so rebuild it before
trusting it: the first line of its `app.html` names the date it was built.

`netlify.toml` names each folder as a branch deploy context, so on a site
connected to GitHub, the branch `preview-<folder>` serves it at its own
address and the main site is untouched.
