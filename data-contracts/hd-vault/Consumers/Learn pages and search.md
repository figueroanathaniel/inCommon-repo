---
kind: consumer
layer: interpretation
source:
  - "tools/build-learn-pages.js:234 at 1c02c7c (gatePath, the gate pages)"
  - "app/inCommonApp v2.dc.html:14493 at 1c02c7c (human-design-atlas gate address in openPath)"
  - "app/inCommonApp v2.dc.html:30893 at 1c02c7c (searchAll)"
verified: "by reading"
status: checked
---
# Learn pages and search

The 64 Learn gate pages link to `/library/human-design-atlas/gate/<n>`, which
`openPath()` turns into `atlasSec: 'gates', atlasItem: atlasSlug('g' + n)`.
`searchAll()` reaches gates, channels, centres, types, profiles and lines
through the atlas. None computes a chart; they are the existing names the
[[Chart address]] note maps.
