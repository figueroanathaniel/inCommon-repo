# Cross check: the 28 August prompts against the build that exists

**Written:** 28 August 2026, before any code from that document was executed.
**Governing:** the 28 August prompts take precedence over the 27 August
ordering where the two disagree.

This file exists because the new document was written against an assumed
architecture that is not the one this app has, and because part of what it asks
for was built yesterday. Both of those are worth saying out loud before a line
is written, rather than discovered halfway through.

---

## 1. The reorder, and where it lands

The finding is that a **People Library** should be built first, as a standalone
primitive, before composite math and before Unions. That is correct and it is
the cheapest thing on the roadmap.

It is also partly overtaken by events. The composite shipped on 27 August, one
day before the study that says to build it second. The honest reconciliation is
not to pretend otherwise and not to unbuild it:

| The spec assumes | What is actually true | What follows |
|---|---|---|
| No composite exists yet | `hd-composite.js` ships, six-branch, directional | Build the library, then **retrofit** the composite to read from it |
| No people store exists | A contacts store exists: `FRIENDS_KEY`, capped at 12, from shared cards or typed entry | Formalise it into the Prompt A schema rather than starting a second store |
| Cache comes before composite math | Composite math came first | Build the cache now and put the existing composite behind it, which is the same end state |

**One store, not two.** The single largest risk in executing Prompt A literally
is ending up with a People Library beside the existing contacts store, both
holding people, neither authoritative. The contacts store is migrated, not
duplicated.

## 2. The architecture conflict, stated plainly

Prompt A is written for a server: `owner_user_id`, defaults "at the database
level, not in application code", notes "encrypted at rest", fields returned
"server-side", and Prompt D asks for gauges and histograms with alerting.

**inCommon has no server, no account, and no network call in the shipping
build.** That is not an oversight to be worked around; it is the product, and
V1.6.0 removed the account gate deliberately. Every requirement in Prompt A
therefore has to be mapped onto a device rather than implemented as written.
Mapped, and not quietly dropped:

| As written | On this architecture | Is the guarantee preserved? |
|---|---|---|
| `owner_user_id` | The active profile id. Records are per profile and do not cross. | Yes |
| Default false "at the database level" | The store's own writer is the only path in, and it writes the default. There is no second path to forget. | Yes, and arguably more strongly: there is no ORM to bypass |
| `notes` encrypted at rest | The device is the boundary. There is no server, so there is no key to hold and nobody to hold it from. Notes stay on the device, are never transmitted, and are hard deleted with the record. | Different guarantee, honestly stated. Not encryption. |
| "Never concatenate them server-side" | Never concatenate them anywhere. The four layers are separate keys through to the screen. | Yes |
| Metrics as gauges and histograms | `analytics.js`, off by default, no payload parameter, buckets rather than values | Partly: see section 5 |

**The one that must not be fudged is the encryption line.** Writing "encrypted
at rest" into a local-only app would be a claim about a protection that is not
there. What is there is a device that never transmits. That is what the copy
will say.

## 3. Swiss Ephemeris: the recommendation this build declines, and why

The spec recommends a local Swiss Ephemeris binding with a data file of roughly
90 MB, in preference to a per-chart API.

**The preference is right and the conclusion does not apply here.** The argument
against a per-chart API is unanswerable: rate limits, vendor dependency, and a
third party receiving users' birth data. inCommon already calls no API for
anything, so it has already taken that half of the advice.

The 90 MB file is a different matter:

- The shipping artefact is a single HTML file served as a PWA and expected to
  work offline after one visit. A 90 MB precache is not that.
- Swiss Ephemeris is AGPL or a paid commercial licence. AGPL in a shipped
  client is a decision with consequences, not a dependency choice.
- The current engine is analytic and on-device, and its error is now measured
  rather than assumed: Chiron is fitted against 81 JPL Horizons positions at
  RMS 0.559 degrees and worst 0.923, and the app withholds any claim finer than
  the measurement supports.

**Recommendation:** keep the analytic engine, keep extending the JPL-derived
fixture set to the remaining bodies, and revisit Swiss Ephemeris only if and
when a native app ships, where 90 MB is ordinary and the licence question can be
answered once. Flagged for the founder rather than decided here.

## 4. Terminology: Prompt B is blocked and Prompt A is not

Section 3 of the new document proposes six substitutions and says plainly that
none are adopted until initialed. They are not initialed. Prompt B instructs
that the words BodyGraph, Connection Chart, Composite, Penta and Transit appear
nowhere in UI copy **or code identifiers**.

What that costs, counted in the current build:

| Term | Occurrences in the app file | Notes |
|---|---|---|
| transit | 162 | `transitWindows()`, the Passage engine, the timeline sky rows, harness rows |
| bodygraph | 34 | `data-chart="bodygraph"`, which the tap-target exemption keys on |
| composite | 10 | `hd-composite.js`, `cxGroups`, the module gate |

This is a rename with real reach: it touches the module names, the harness, the
tap-target exemption attribute, and a published module contract. It is entirely
doable and it should be done once, deliberately, with the gates re-run, rather
than piecemeal.

**Prompt A needs none of it.** A store of people can be built without saying any
of those five words, so it proceeds now and the rename waits for initials.

## 5. Prompt D against the analytics module that exists

`analytics.js` already ships, off by default, with a deliberate design property:
`emit()` takes **one argument and has no payload parameter**, so no call site
can attach content even by accident. Prompt D asks for labelled histograms and
gauges.

The reconciliation, and it is mostly compatible:

- Histograms become bucketed counters, which the module already does for session
  length. A record count of 7 becomes a bucket, not a value.
- Gauges become a snapshot computed on read from what is already stored, rather
  than a written value.
- "Emit no user-identifying data in metric labels" is already stronger here:
  there are no labels, and no way to add one.
- The alert above a group cap is not a server alert. On device it is a refusal
  at the cap plus a counted event.

## 6. Order of operations

The dependency order, with the reason each step must precede the next:

1. **Reference content and this cross check.** Done first so the constraints are
   written down before code is written against them.
2. **Prompt A, the People Library store.** Depends on nothing. Migrates the
   existing contacts store rather than sitting beside it.
3. **Prompt C, the pair cache.** Before the composite is wired to the library,
   so the cost control exists from the first composite rather than being
   retrofitted after the shape of the calls has set.
4. **Retrofit the composite onto the library, through the cache.** This is the
   step the spec did not need to name because it assumed no composite existed.
5. **Prompt D, instrumentation.** After the store and the cache exist, because
   three of the six metrics measure them.
6. **Prompt B, the library UI.** Last of the four, and blocked on the
   terminology register.

Unions and family charting remain out of this pass, per section 7 of the source
document, and remain gated on the Crisis Language Policy, which exists as a v1.0
draft dated 27 August and is also unratified.

## 7. What this cross check does not resolve

Four founder decisions, listed so they are not lost in a report:

1. The six terminology substitutions. Nothing renames until initialed.
2. Swiss Ephemeris: adopt at 90 MB, or keep the analytic engine and extend the
   JPL fixtures.
3. Group caps. The 27 August spec said 8 for a family; the 28 August spec says
   12 for family and 30 for a Union. The build currently caps saved people at
   12. These want one number each.
4. The Crisis Language Policy, still draft, still blocking for the group and
   community layers.
