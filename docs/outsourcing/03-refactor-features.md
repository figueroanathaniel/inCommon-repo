# Brief 3: Refactoring & Feature Additions

Agents: named in the roster in 00-README.md, workstream 3.
Branch: feature/<topic> or refactor/<topic>
from current main. Read 00-README.md and CLAUDE.md first.

This brief sets the rules for any refactor or feature the owner assigns.
Each assignment arrives as its own task; do one per branch and pull request.

## How the app is built (read this, it is unusual)

- app/inCommonApp v2.dc.html is the whole application: about 31,000 lines,
  one file, no build step at run time. Do not split it into a framework
  project and do not add npm dependencies.
- Markup is a template: <sc-if value="{{ x }}">, <sc-for list="{{ xs }}"
  as="x">, {{ value }} bindings, onClick="{{ handler }}". Values come from
  "value bag" methods on the logic class (authVals(), regVals(),
  supportVals() and many more), spread together in the render. To add a
  screen element: add its markup, then return its values from a bag.
- Two shells live in the file, chosen by width at 820px: the phone shell and
  the desktop shell. Any control added to one is added to the other. There
  must never be a phone, tablet or desktop copy of a screen.
- Styles are inline, plus the ONE stylesheet in the document <head>. Never put
  a <style> in the helmet.
- Modules sit beside the app in app/ and are loaded by the app as ./name.js.
  app/ is flat on purpose: a module moved into a subfolder silently stops
  loading.

## Rules that the gates enforce

- Every control does something: tools/check-dead-controls.js walks every
  handler in both shells.
- #8b5cf6 is never text, at any size. Purple text uses #b79bff (--ac2-hi):
  tools/check-purple-text.js.
- Colours are tokens (--ac, --ac2, --tx, and so on), declared in three places
  that must agree: tools/token-compare.js. #e5534d is for safety controls
  only. #2fff8f is the primary action colour.
- Touch targets are at least 44px; text contrast is at least 4.5:1.
- No em or en dashes anywhere.

## Rules from CLAUDE.md that are easy to miss

- "Discovery belongs to the reader": do not add text that explains a screen
  before it is opened.
- "No disclaimers, and no line saying how a reading is made."
- Get Help and the crisis directory are safety controls. Never move, hide or
  restyle them as part of other work.
- A new address (#/route) goes through openPath() in the app; a routed jump
  owns the pager tab until it lands.

## How to work

1. Before a refactor, write down what it must not change, and prove it with
   the gates before and after. A refactor that changes behaviour is a feature.
2. Keep each change small enough to review. If a refactor touches more than
   about 400 lines of the app file, split it.
3. For a feature: add it to both shells, wire every control, give every new
   string a home in the copy style of the surrounding screen, and add a
   CLAUDE.md section saying what was built, why, and the owner's words that
   asked for it.
4. Add a test row for anything a node test can reach (tools/run-module-tests.js
   for modules, the verification phases for screens). Coordinate with
   workstream 6, who owns the harness.
5. boot() and modulesReady() are shared with workstream 5. Describe any change
   you need there in your pull request instead of making it.

## Done means

- Both shells updated, every gate in 00-README.md passes.
- A CLAUDE.md section for the change.
- The pull request shows before and after screenshots at 390x844 and
  1440x900.

## Secondary and tertiary

**Secondary, used sparingly.** Not a routine reviewer: the seat is held by
an agent the roster marks for sparing use. Bring it in only when one of these
is true (if the roster ever gives this seat an agent with no limit on use,
it reviews every pull request as the README describes instead):
- the change is a cross-cutting refactor that touches both shells and more
  than one value bag;
- the primary has failed twice on the same problem;
- a gate fails and the primary cannot find the cause in an hour.
Give it the specific question, the files involved and the failing output, not
the whole brief. One consult per pull request is the norm; more needs the
owner's go-ahead. Record each consult and its outcome in the pull request.

**Tertiary.** Writes the test rows and the CLAUDE.md
section for each feature, once the code is done, following brief 6's rules
(it owns the harness there, so it knows the structure). It does not change
app code. It runs every gate and posts the results on the pull request.
