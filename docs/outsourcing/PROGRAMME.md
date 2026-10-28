# Programme board

Set by the owner on 28 October 2026. The order of work across the task
forces, what each priority is done by, and where it stands. The task force
charters hold each assignment's status and delivery; this page says what
comes next and why. Update a row in the same commit that changes its state.

| # | Owner | To do | Assignment | Depends on | State | Complete when |
|---|---|---|---|---|---|---|
| 1 | Task Force 6 (QA, documentation) | Correct WEBGL_ENGINE.md: use `deploy/v6.4/`, `hd-scene.js`, the application's chart model and `incommon-cloud.js`; remove the proposed direct write to `oracle_readings` | 6.4 | none | 6.4 **READY** 28 October 2026. The file had never been committed, so `docs/WEBGL_ENGINE.md` was drafted from the code with these corrections built in (Task Force 6 branch, #115); **in review** by the workstream 4 secondary | The document matches the implemented architecture |
| 2 | The owner | Approve assignment 1.3, then hand its instructions to the assigned seats | 1.3 | none | **Approved** 28 October 2026 (READY, recorded in #107, merged). **Delivery not recorded yet**: the Delivered column in Task Force 1's charter is filled in as each seat receives its file | Approval and actual delivery are recorded separately |
| 3 | Task Force 1, assignment 1.3 | Map every Human Design calculation, data structure and consumer; reconcile duplicated logic; define stable chart element identifiers | 1.3 | priority 2's delivery | Ready to start once delivered | The repository's Obsidian vault (`data-contracts/hd-vault/`) holds the map, the evidence and the discrepancy list |
| 4 | Task Force 3, assignment 3.2 | Correct the sleep teaching, expose calculation fallbacks, report invalid profiles honestly, add the calculation inspection panel | 3.2 Tasks 1 to 3 | D1 for the reviewed mark on content changes | READY | Each change has regression evidence and works in both layouts |
| 5 | Task Force 6, assignment 6.2 | Independent reference charts and boundary tests, including failed calculations and uncertain birth times | 6.2 | none | READY | Tests tell numerical tolerance apart from correct gate, line and chart classifications |
| 6 | Task Forces 1 and 2, assignments 1.2 and 2.2 | Storage for study notes, chart versions and other people's charts, with consent, ownership, deletion and export | 1.2, then 2.2 | 1.3's Chart address note | READY; 2.2 starts after 1.2's model is agreed | The model is approved and its access rules reviewed before any migration |
| 7 | Task Force 4, assignment 4.2 | Extend the existing scenes: explanations beside the chart, readings connected to highlights, selection kept across 2D and 3D, keyboard and text alternatives | 4.2 | 4.1's graphics update merged | READY, waiting on 4.1 | The whole study journey works on desktop and phone |
| 8 | Task Forces 3 and 5 | Color and the birth time scanner, after the reference cases and accuracy work; their cost measured outside rendering | 3.2 Tasks 4 and 5, 5.2 | priorities 4 and 5; 5.1's JPL deferral merged | READY, waiting on its dependencies | Results show their uncertainty and meet the documented performance budgets |
| 9 | Task Force 6 | Validate the integrated changes, required browser and H gates included; record physical device gaps | 6.3 | each merge of priorities 3 to 8 | READY 28 October 2026; starts with the first merge | Each result names the tested commit, the independent review and the remaining limitations |

## Device gaps still owed

Kept here by 6.3 until a recorded device run closes each line.

- iPhone (WebKit): no WebKit in the automation; swipes, the 3D stages and the
  direct draw path are confirmed only on the owner's own phone.
- Android: not driven.
- A hardware GPU: SwiftShader runs only; driver crash and recovery unmeasured.

## What keeps this page true

- A priority changes order only on the owner's word, recorded in its row.
- A row's State changes in the same commit as the charter or pull request
  that changed it.
- Approval (an assignment's Status) and delivery (the charter's Delivered
  column) are separate facts and are never written as one.
