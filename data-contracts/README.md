# d. data contracts

Everything inCommon knows lives in `localStorage` on one device. There is no
sync, no export to a server and no account. `local-storage-schema.md` is the
full key list and shape.

Treat it as a **migration contract**: people have real journals in these keys.
Any change to a key name or a value shape needs a migration path, and the
profile keys are namespaced per profile id, so a rename touches every one.

Two keys drive first run and theming and are easy to break:

    incommon.firstrun          absent means show the birth screen
    incommon.theme.<profile>   per profile, inheriting incommon.theme.device
                               once and then owned independently
