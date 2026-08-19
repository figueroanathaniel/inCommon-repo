# Storage migration policy

These keys hold people's journals, moods, birth data and consent decisions.
There is no server copy. If a migration loses data, it is gone. Treat every
change to a key name or a value shape as a data-handling operation, not a
refactor.

## Before anything changes

1. **Write the change down first.** Old key or shape, new key or shape, and
   why the change is worth asking a real person's data to move.
2. **Find every reader and writer.** Storage in this build is reached three
   ways: `readLS` / `writeLS` on the logic class, the `read` / `write` helpers
   in `profile-manager.js`, and a few direct `localStorage` calls for theme and
   country. A key built from a profile id (`incommon.p.<id>.*`) exists once per
   profile, so a rename touches up to six copies per device.
3. **Bump a version marker, do not overload an existing one.** `incommon.profiles.v1`
   and `incommon.minorbodies.calibration.v1` already carry a version in the key.
   Follow that pattern rather than changing the meaning of a key in place.

## Migrating the data

4. **Write forward, never in place.** Read the old key, write the new key,
   and only then remove the old one. A crash between steps must leave the
   device readable by the version that is installed.
5. **Migration runs once, at boot, before first render**, and is guarded by a
   marker so it cannot run twice on the same device.
6. **Never destroy the source until the destination verifies.** Read the new
   key back and check it against what was written. If verification fails, keep
   the old key and stop.
7. **Unknown fields survive.** Copy fields the code does not recognise rather
   than dropping them, so a device that ran a newer build is not stripped by
   an older one.

## Testing it

8. **Test from real fixtures, not from an empty device.** At minimum: a device
   with no data, a device with one profile, a device at the six profile cap,
   a device holding the previous shape, and a device already migrated (the
   migration must be a no-op on the second run).
9. **Assert counts, not just success.** Journal entries, moods and consent
   events in equals out. A migration that silently drops rows and reports
   success is the failure this policy exists to prevent.
10. **Add the assertions to the harness before merging**, and never relax an
    existing assertion to make a migration pass.

## When it goes wrong

11. **Partial migration is a stop, not a retry loop.** Leave both keys in
    place, set a marker recording the failure, and let the app boot on the old
    shape. Do not delete anything and do not run again automatically.
12. **Say so in the interface.** The person is entitled to know their data did
    not move, before they write anything new on top of it.
13. **Provide an export before the migration ships.** Settings already exports
    a JSON snapshot. That export is the only recovery path this product has,
    so it must work on the old shape before the new shape is released.

## The one rule underneath all of it

If the choice is between losing data and shipping late, ship late.
