# f. design system

`tokens.css` documents the system. **It is not loaded by the app** and never
has been: styling is inline on every element, and the tokens are declared as
CSS custom properties on three roots inside the app file. The file is a
reference, and it is the thing to keep in step when tokens change.

`web-design-system.md` covers type and the wider visual language.

The rules that are not negotiable are in `a. rules/PROJECT-RULES.md`, under
"Colour rules" and "The theme boundary". The two that get broken most:

- **`#8b5cf6` is never text.** It measures about 4.2:1 on the app's own
  surfaces. Purple text is `#b79bff`.
- **Audit colour by grepping the hex, not the token name.** A sweep for
  `var(--ac2)` once reported zero remaining while nine sites wrote the
  literal and kept failing.

Three theme identities plus a contrast modifier. A theme is token deltas, not
style holes: the literal midnight tokens stay in the markup so the app paints
from the first character.
