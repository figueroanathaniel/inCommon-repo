# Fonts: Google, or our own copy, and how to swap

Added 12 October 2026. **Every published build still loads its type from Google
Fonts.** A second way is built and waiting: the same four typefaces served from
this site, so no visitor's address reaches Google for a font. It is tried in an
unpublished deploy first, and switching the real site over is one word and two
sentences of the Privacy Policy.

## Why it exists

Loading a font from Google sends the visitor's IP address to Google. A German
court found that to break GDPR when done without consent (Landgericht Munchen,
January 2022), and it is the one third party request the cover still makes
before anybody has clicked anything. Serving our own copy removes both, and
removes Google from the Privacy Policy's provider table.

## What is in the repository

- `app/fonts/`: Marcellus, Newsreader and Karla (`fonts.css`) and Dawn's Petrona
  (`petrona.css`), as WOFF2 files, with each family's licence (`OFL-*.txt`). All
  four are under the SIL Open Font License 1.1, which allows exactly this. The
  `@font-face` rules are Google's own, pointed at the local files. 492 KB in all,
  and a browser downloads only the faces and character ranges a page uses.
- The app and the cover carry their Google links between two markers,
  `<!-- fonts:google -->` and `<!-- /fonts:google -->`. Leave the markers in place:
  the build refuses to run without them.
- The app has one switch, `FONTS = 'google'`, which `themeFace()` reads to decide
  where Dawn's Petrona comes from.
- `tools/build-bundle.js --fonts self` swaps all of it in the build output: the
  links become `./fonts/fonts.css`, the switch becomes `'self'`, `app/fonts/` is
  copied in as `fonts/`, the service worker precaches the faces the first screen
  needs, and the two Google addresses come out of the Content-Security-Policy.
  That last step is the proof: a page that still reached for Google would be
  refused by the browser, with a console error naming the policy.
- `preview/fonts-self/` is that build, ready to deploy. It is a whole site and it
  is not the real one.

## Trying it in an unpublished deploy

Pick one. None of them changes the public site.

1. **Netlify Drop (simplest).** Open https://app.netlify.com/drop and drag the
   `preview/fonts-self` folder onto it. Netlify gives it a throwaway address of
   its own. Delete that site from the Netlify dashboard when you are done.
2. **A draft deploy on the real site.** With the Netlify command line tool:
   `netlify deploy --dir preview/fonts-self` (no `--prod`). It prints a draft
   address and publishes nothing.
3. **A branch deploy, if the site is connected to GitHub.** `netlify.toml` has a
   context for it: push to a branch named `preview-fonts-self` and, once branch
   deploys are switched on for that branch (Site configuration, Build & deploy,
   Branches and deploy contexts), Netlify serves the preview at
   `preview-fonts-self--<your site>.netlify.app`. The main site keeps serving
   `deploy/v6.4`.

**What to look at:** the wordmark on the cover (Marcellus), headings and body
text in the app (Marcellus, Newsreader, Karla), and the Dawn theme in Settings
(Petrona). In the browser's developer tools, the Network tab should show files
from `/fonts/` and nothing from `fonts.googleapis.com` or `fonts.gstatic.com`.
This was checked in Chromium when the preview was built: 0 requests to Google,
all four faces loaded, no policy errors.

**What will not work on a throwaway address:** signing in. Supabase only sends
readers back to addresses on its Redirect URLs list, and the Turnstile check is
tied to your real domain. "Continue without an account" works, and that is all
fonts need.

## Rebuilding the preview

After the app changes, the preview is out of date. Rebuild it with:

```
node tools/build-bundle.js --fonts self --preview preview/fonts-self
```

It writes only into `preview/fonts-self`. It does not touch `deploy/`, the root
`_redirects` or `netlify.toml`. The first line of `app.html` there says
`PREVIEW, not a release` and the date it was built.

## Switching the real site over

When you are happy with it, three changes go in together:

1. In `tools/build-bundle.js`, change `const FONTS_DEFAULT = 'google';` to `'self'`.
2. In `app/privacy.html`, remove the **Typefaces** item in section 3 and the
   **Google** row in section 11's provider table, and move the date at the top.
   The build checks this both ways: it refuses a self hosted build while the
   policy still names Google Fonts, and a Google build once it stops naming it.
3. Run `node tools/build-bundle.js` and deploy `deploy/v6.4` as usual.

To switch back, undo all three. The build puts the Google links, the CSP origins
and the service worker list back to how they are now.

The app's source shell (`app/inCommonApp v2.dc.html` opened directly) always
uses Google; only built folders swap. That keeps everyday development unchanged.
