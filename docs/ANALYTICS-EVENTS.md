# Analytics events, in full

One page, and it is the whole vocabulary. `app/analytics.js` is the schema;
this file is that schema written out. `tools/run-module-tests.js` row A17
asserts the two lists are identical, so a name added to the module and not to
this page fails the gate rather than shipping undocumented.

**Default: off.** Nothing is aggregated and nothing is stored until a reader
turns it on in Settings, under Memory and Privacy. Off means the store is
absent, not collected and withheld. Switching it back off deletes what was
counted.

## There is no content field, and there is nowhere to put one

`emit()` takes one argument: a name. It has no second parameter, so no call
site anywhere in the app can attach a journal line, a chart, a birth date, a
search term or anything else a reader typed, even by mistake. A caller that
passes a second argument is passing it to nothing.

The only writer in the module writes three things: a day stamp, a name that was
already on the list below, and an integer. There is no branch that writes
anything else. Rows A5 and A10 of the gate assert this by handing `emit()` a
payload of invented private data and then searching the raw store and the
export for it.

## Where it goes

Nowhere. `ENDPOINT` is `null` and `transmit()` refuses on every call.
`exportPayload()` builds exactly what would be sent so the shape can be
reviewed now, and returns `null` when the reader has not opted in. Wiring an
address is a deliberate change with its own consent copy, not a constant to be
filled in quietly.

## It cannot interrupt anybody

The module raises no notification. Quiet hours and category controls govern
anything that can interrupt a reader, so the way this module stays inside those
rules is by having nothing in it that can. Row A13 asserts the notification API
is never reached.

## The events

| Name | Counted when |
|---|---|
| `chart_generated` | A natal chart was drawn for the active profile. |
| `connection_chart_generated` | A composite of two charts was drawn. |
| `contact_added` | A second person was saved to this device. |
| `contact_removed` | A saved person was removed. |
| `layer3_expanded` | A traditional interpretation was opened by tapping to expand it. |
| `layer4_expanded` | A synthesis block was opened by tapping to expand it. |
| `birth_data_confirmed` | A resolved birth place and offset were confirmed. |
| `birth_time_declared_unknown` | The reader chose "I do not know my birth time". |
| `birth_data_edited` | Stored birth data was corrected after the fact. |
| `connection_chart_cached` | A composite was served from the pair cache instead of being computed. |
| `person_added` | A person was saved to the People Library. |
| `person_removed` | A person was removed from the People Library. |
| `person_notes_enabled` | Notes were switched on for one saved person. |
| `library_cap_reached` | An add was refused because the library was full. |
| `feature_abandoned` | A flow was left before it finished. |
| `session_start` | The app was opened. |
| `session_end` | The app was closed or backgrounded. |

Seventeen names. Nothing is counted that is not on this list, and a name not on it
is dropped rather than stored under some other heading.

## Session length, and why it is blunt

`sessionEnd()` takes a duration and stores a bucket, never a timestamp: under
1m, 1m to 5m, 5m to 15m, 15m to 30m, 30m to 1h, over 1h. A duration to the
millisecond is close enough to a fingerprint to be worth blunting, and nothing
a product question could ask needs the precision.

## Return days

Counted from the day stamps already in the store rather than tracked
separately, so there is no second record of when somebody was here. The store
keeps at most 90 days and drops the oldest first.


## Histograms, and why they are bucket tables

The 28 August instrumentation prompt asks for `people_records_per_user` and
`group_size` as histograms. A histogram whose label is the value is a payload by
another name, and the one property this module has that a policy cannot give it
is that there is nowhere to put content.

So `observe(metric, value)` maps the value to a name from a fixed table before
anything is written, and the table is the whole vocabulary:

| Metric | Buckets |
|---|---|
| `people_records` | none, 1, 2 to 3, 4 to 6, 7 to 12, over 12 |
| `group_size` | 2, 3 to 5, 6 to 8, 9 to 12, 13 to 30, over 30 |

A library of seven people is written as "7 to 12". The number seven is never
stored.

The cap alert the prompt asks for is not a server page, because there is no
server. On a device it is the refusal at the cap plus a `library_cap_reached`
count, which carries the same information without an alerting stack that does
not exist.

## Gauges are computed, never stored

`pair_cache_hit_rate` and `time_unknown_share` are properties of two other
stores at the moment somebody asks. Writing them down would create a third
record of the same facts and a way for the three to disagree, so the app hands
this module two functions through `sources()` and `gauges()` asks them on read.

`model_tokens_per_composite_view` is not implemented and is not a gap: this
build generates no prose for a composite and calls no model, so the metric would
be a permanent zero pretending to be a measurement. It arrives with narrative,
if narrative ever does.

## What is not counted, and will not be

- Anything a reader wrote: journal entries, dream text, moods, names.
- Anything computed about a reader: placements, gates, numbers, bands.
- Birth dates, times, places, coordinates.
- Anything about a second person saved to the device.
- Which profile is active, or how many there are.
- Any identifier for the device, the install or the reader.
