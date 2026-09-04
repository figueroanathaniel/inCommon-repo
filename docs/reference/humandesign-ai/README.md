# humandesign.ai

An independent Human Design app, unaffiliated with Jovian Archive. Referenced in
the study of 27 August 2026.

## The finding

Rated 3.9 stars across 15 reviews at the time of the study, with **multiple
reviews reporting a bug that prevents accurate birth-time entry**.

## Why a competitor's bug is worth a file

In this category birth time is load-bearing. A wrong time produces a wrong
chart, and a wrong chart is not a degraded product: it is a confident, complete
reading about a person who does not exist. It destroys the only claim the
product has to accuracy, and it does so invisibly, because nothing about a wrong
chart looks wrong.

A competitor failing at the one thing that must not fail is a differentiator
available for the cost of one careful sprint.

## What was built because of it

The birth-time hardening pass of 27 August 2026:

- Three states for the question rather than two: a time given, a time the reader
  said they do not know, and a question nobody has asked yet. A blank field is
  the third, never the second.
- A text field with an explicit 24h, AM or PM control rather than a native time
  input. A native time control is a different control on every platform and in
  some webviews cannot be typed into at all, which is the shape of the failure
  the reviews describe.
- A contradiction is refused rather than resolved: 13:00 with AM selected is two
  answers, and only the reader knows which they meant.
- The resolved coordinates and the UTC offset **for the birth date** are shown
  back for confirmation before any chart is drawn.
- Time-dependent elements are marked unavailable rather than estimated.

Thirty two births on the awkward side of a daylight-saving rule that has since
changed are now permanent test rows.

## The composite reading of this and Jovian

The incumbent is strong and lawful and cannot be beaten on corpus. The
independents are beatable on craft. That is where the effort goes.
