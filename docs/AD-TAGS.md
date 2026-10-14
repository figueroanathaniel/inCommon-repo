# Which ad brought an account in

Added 14 October 2026 at the owner's request, before the first Meta ads.

## How it works

Every ad links to the cover with utm tags, for example
`https://incommon.netlify.app/?utm_source=meta&utm_medium=paid&utm_campaign=launch&utm_content=carousel`.

1. The cover reads the four tags (`utm_source`, `utm_medium`, `utm_campaign`,
   `utm_content`) the first time it sees them in a tab and keeps them in
   `sessionStorage` under `incommon.signup.from`. Short plain words only: each
   value is lowercased, cut to `[a-z0-9_.-]` and 40 characters.
2. Nothing leaves the device until the reader creates an account. Then the
   tags go with the sign up as user metadata, `signup_from`, beside the
   newsletter answer. Supabase writes metadata only when the call creates the
   account, so it is recorded once, at creation.
3. `incommon-cloud.js` cleans the tags again (`fromOf()`), because the module
   does not trust its caller. K25b holds it.

No pixel, no third party script, nothing sent to Meta. The Privacy Policy,
section 4, says what is kept and why; change it if this changes.

## Counting sign ups by ad

In the Supabase SQL editor:

```sql
select
  raw_user_meta_data->'signup_from'->>'source'  as source,
  raw_user_meta_data->'signup_from'->>'content' as ad,
  count(*)                                      as accounts,
  count(email_confirmed_at)                     as confirmed
from auth.users
where created_at >= '2026-10-14'
group by 1, 2
order by accounts desc;
```

Rows with no source are accounts that did not arrive through a tagged link.
