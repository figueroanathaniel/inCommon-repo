# The Oracle: setting it up

The Oracle is the nav tab that took Throughline's place. It is the Celestial
Codex's Oracle, ported: a reading for today, this week or this month, standard
or in depth, from the reader's own chart, asked with the Codex's own
instructions. Kimi, Moonshot AI's model, writes the words. The app never holds
an API key: it asks a Supabase Edge Function, which holds the key, and the
function asks Kimi.

It behaves as the Codex's did. The first time, a reader is told what is sent
and presses Consult the Oracle. After that the reading is asked for the moment
the Oracle is opened, and again when the period or the depth changes. A reading
is kept for its period, so opening it again costs nothing.

**In depth is paid for, as it was in the Codex.** It is the Codex's Luminary
tier, $12.99 a month or $119.99 a year through Stripe. Setting that up is its
own page, `docs/LUMINARY-SETUP.md`. Until it is done, In-Depth shows the
Luminary gate with "Payments are being set up. Check back soon." and standard
readings work as below.

Until the steps below are done, the tab is there and says "The Oracle is silent
for now", which is what the Codex said when it had no key. Nothing else in the
app changes.

## What it costs

Two bills, and only one of them is new.

- **Supabase.** Edge Functions come with the free plan, which includes 500,000
  invocations a month. One reading is one invocation, so this should cost
  nothing at inCommon's size. Check current limits on Supabase's pricing page.
- **Moonshot AI (Kimi).** This is the one that costs money. It is pay as you
  go, from a prepaid balance.

The function uses `kimi-k2.6` for both depths by default. At the time of
writing that is $0.95 per million input tokens ($0.16 when the instructions are
served from Kimi's cache, which they are after the first reading) and $4 per
million output tokens. Roughly:

| Reading | Estimate each |
|---|---|
| Standard | about $0.01 |
| In depth | about $0.03 to $0.05 |

These are estimates from the size of what goes in and comes out, not
measurements. After the first dozen readings, the Usage page on
platform.kimi.ai shows the real figure.

Three things keep the bill bounded:

1. **A reading is written once.** The same reader, chart, period and depth get
   the stored reading back for free until the period turns over. Pressing the
   button again, or opening it on another device, costs nothing.
2. **A daily limit per reader**, 6 attempts in any 24 hours by default. It
   counts attempts rather than successes, because a failed reading was still
   paid for. The worst case is 6 in-depth readings, about 30 cents, per reader
   per day. Most days a reader will ask for one or two.
3. **The prepaid balance is the ceiling.** Kimi spends only what you have put
   in. When the balance runs out, the Oracle says it is silent for now, and
   nothing else in the app is affected. Top up a small amount at a time and
   nothing can surprise you.

To buy richer in-depth writing, set `ORACLE_DEEP_MODEL` to `kimi-k3` ($3 in,
$15 out per million, so about three times the cost of an in-depth reading).
Read the time limit note under The knobs before you do.

## Steps

### 1. A Kimi API key

1. Sign in at platform.kimi.ai (Moonshot AI's platform; platform.moonshot.ai
   goes to the same place).
2. Add a balance under Billing: **$10, not $1.** The money is not spent any
   faster, but Kimi sets its limits by how much has been put in over the life
   of the account, and $1 buys the lowest tier (below).
3. Create a key under API Keys, and copy it.

**Why $10.** At the time of writing, Kimi's tiers go by the total ever added:

| Total added | Readings at once | Requests a minute | Tokens a day |
|---|---|---|---|
| $1 | 1 | 3 | 1.5 million |
| $10 | 15 | 100 | no limit |
| $20 | 40 | 100 | no limit |

The key is shared by every reader of the app, so at $1 Kimi writes **one
reading at a time for everybody**, and a second reader who asks while it is
writing is turned away. The page waits that out for about a minute and a half,
saying the Oracle is busy with another reading, before it gives up and says it
is resting. At $10 fifteen readings can be written at once, which is plenty at
inCommon's size. The $10 stays in the balance and is spent a cent or so a
reading, like any other top up. Check the current table on the Rate Limits
page of platform.kimi.ai, because it changes.

The key goes into Supabase in step 3, and nowhere else. **Never put it in the
repository**: the repository is public, and a key in it would be found and
spent by strangers within hours.

### 2. The tables

In the Supabase dashboard, open SQL Editor, paste all of
`server/oracle/schema.sql`, and press Run. It creates two tables,
`oracle_readings` and `subscriptions` (the second is Luminary's). It is safe to
run twice.

### 3. The function

1. In the dashboard, open Edge Functions and deploy a new function using the
   editor.
2. Name it exactly `oracle`. The app calls it by that name.
3. Replace the example code with all of `server/oracle/index.ts`, then deploy.
4. Under Edge Functions, Secrets, add `MOONSHOT_API_KEY` with the key from
   step 1.
5. Leave JWT verification on. The app sends the signed in reader's token, and
   the function refuses anybody without one.

If you set this up before 29 September 2026, the function asked Anthropic and
held `ANTHROPIC_API_KEY`. Paste the new `index.ts` over the old one, add
`MOONSHOT_API_KEY`, and delete the old secret.

The function is kept in `server/oracle/`, not `supabase/functions/`, on
purpose. This repository is connected to Supabase's GitHub integration, which
watches a `supabase/` folder and can open preview branches that are billed.

### 4. Try it

Sign in on the cover with your email and password (choose Create New Account
the first time), open The Oracle and press Consult the Oracle. A standard
reading takes about half a minute. Go to another tab and
back: the reading is there at once, because it is the stored one.

To try In-Depth before Stripe is set up, add your own address to
`LUMINARY_ADMIN_EMAILS` (below). It reads in depth without a subscription,
which is how the Codex's admin role passed its paywall.

While a reading is being written the page says so, and it keeps saying so if
the page is reloaded or opened in a second tab: it asks again every ten seconds
and the stored reading appears when it is done. If it says the Oracle is busy
with another reading, Kimi is writing someone else's and the balance is on the
$1 tier (step 1).

If it says the Oracle is silent for now, open the function's Logs in the
dashboard. No function named `oracle` at all means step 3 did not finish. The
Logs name the rest: a key Kimi refused, a balance that has run out, or a model
name Kimi does not have. If it says the stars clouded over, the Logs say why.

## The knobs

Set these as Edge Function secrets. Each is optional.

| Secret | Default | What it does |
|---|---|---|
| `ORACLE_MODEL` | `kimi-k2.6` | Which Kimi model writes a standard reading. |
| `ORACLE_DEEP_MODEL` | the same as `ORACLE_MODEL` | Which Kimi model writes an in-depth reading. `kimi-k3` writes more richly and costs about three times as much. |
| `ORACLE_DEEP_THINKING` | `off` | Whether the model thinks before an in-depth reading, as the Codex asked its model to. `on` for `kimi-k2.6`; `low`, `high` or `max` for `kimi-k3`, which cannot switch it off. Thinking is paid for as output and takes time. Standard readings never think. |
| `ORACLE_TIME_LIMIT` | `140` | Seconds the function waits for Kimi before giving up and saying so. |
| `ORACLE_DAILY_LIMIT` | `6` | Attempts per reader in any 24 hours. |
| `LUMINARY_ADMIN_EMAILS` | none | Comma separated addresses that read in depth without a subscription. Set the same value on the `billing` function. |

**Time limit.** Supabase stops a function that runs too long: at the time of
writing, 150 seconds on the free plan and 400 on a paid one. Kimi writes
`kimi-k2.6` at about 70 tokens a second on its own API and `kimi-k3` at 40 to
60, and an in-depth reading is several thousand tokens, so `kimi-k2.6` with
thinking off is the combination that fits the free plan. The function gives up
at `ORACLE_TIME_LIMIT` seconds, a little under the plan's limit, so the reader
is told rather than left waiting on a stopped function. On a paid plan, raise
`ORACLE_TIME_LIMIT` to `390` before trying `kimi-k3` or thinking.

## What is sent, and what is kept

**Sent to the function, and from there to Moonshot AI,** is the Codex's dossier:

- the reader's first name, as the Codex sent it;
- positions, houses and aspects;
- the Human Design type, authority, profile, definition, centres, channels and
  gates;
- the numbers, including the ones taken from the birth name;
- the sky at the period's instant, and its transits to the chart.

It carries no journal entry, and no birth date, time or place. The positions
are enough to work out roughly when somebody was born, and the page says all of
this before the first reading.

**Kept, in your Supabase project,** is the reading itself, the period it
covers, and a short hash of the dossier. The hash is how a changed chart
gets a new reading instead of an old one. The chart is not kept.

A reader can see their own readings and nothing else. Nobody can add, change or
delete a row from the app. Deleting an account deletes its readings.

Moonshot AI is based in Beijing. Before launch, read its current privacy and
data retention terms on platform.kimi.ai, including where requests are
processed and whether API traffic is used for training, and say what you find
in the app's privacy notice. The consent panel already names Moonshot AI as the
company the dossier goes to.
