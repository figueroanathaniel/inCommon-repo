# Brief 3: Refactoring & Feature Additions

Agents: named in the roster in 00-README.md, workstream 3 (Task Force 3).
Branch: the Task Force 3 branch named in CHARTER.md (since 28 October 2026).
Read 00-README.md, CHARTER.md and CLAUDE.md first.

This brief sets the rules for any refactor or feature the owner assigns.
Each assignment arrives as its own task; do each on the task force branch, as CHARTER.md says.

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

Approved by the owner on 27 October 2026. "Helpers" in 00-README.md applies
to every block below: the browser runner, shared seats, and the helper log
every pull request ends with. Who holds each seat is in the roster.

**Secondary** (repo access, full context, used sparingly). It does not review
every PR: for this workstream the README's gates and the proof dump are the
review. The budget for assignment 3.1:

- Task 1 (dead methods): no consult, unless the primary fails the same gate
  twice or cannot decide whether a method is called dynamically.
- Task 2 (the renderVals split): ONE consult, before the first PR, on the
  plan. Give it the list of blocks to extract, their line ranges, the order
  of spreads, the proof script and the state list, and ask two questions:
  "Does any extracted block read a variable defined later in renderVals, or
  a key spread before it?" and "Is the state list enough to exercise every
  block?" Its answer goes on the PR.
- A second consult needs the owner's go-ahead. The helper log records each
  one.

If the roster ever gives this seat an agent with no limit on use, it reviews
every pull request as the README describes.

**Tertiary** (repo access). Once the code is done:

- Task 1: run every README gate on the branch and post the output. Grep the
  whole repository for each removed name and post the counts, all zero.
- Task 2: run the primary's proof script independently on the base commit
  and on the branch, and post both hashes. They must match. No test rows are
  added: this refactor changes no behaviour, and the dump is the test.
- For a feature (later assignments), write the test rows and the CLAUDE.md
  section, following brief 6's rules.

It writes the CLAUDE.md section only when the primary asks, and never
changes app code.
