# The Oracle: setting it up

The Oracle is the nav tab that took Throughline's place. It is the Celestial
Codex's Oracle, ported: a reading for today, this week or this month, standard
or in depth, from the reader's own chart, asked with the Codex's own
instructions. Claude writes the words. The app never holds an API key: it asks
a Supabase Edge Function, which holds the key, and the function asks Claude.

It behaves as the Codex's did. The first time, a reader is told what is sent
and presses Consult the Oracle. After that the reading is asked for the moment
the Oracle is opened, and again when the period or the depth changes. A reading
is kept for its period, so opening it again costs nothing.

Until the steps below are done, the tab is there and says "The Oracle is silent
for now", which is what the Codex said when it had no key. Nothing else in the
app changes.

## What it costs

Two bills, and only one of them is new.

- **Supabase.** Edge Functions come with the free plan, which includes 500,000
  invocations a month. One reading is one invocation, so this should cost
  nothing at inCommon's size. Check current limits on Supabase's pricing page.
- **Anthropic (Claude).** This is the one that costs money. It is pay as you
  go, from a prepaid balance.

The function uses Claude Opus 5.5 by default. At the time of writing that is
$4 per million input tokens and $20 per million output tokens. Roughly:

| Reading | Estimate each |
|---|---|
| Standard | about $0.05 to $0.15 |
| In depth | about $0.15 to $0.40 |

These are estimates from the size of what goes in and comes out, not
measurements. After the first dozen readings, the Anthropic Console's Usage
page shows the real figure.

Three things keep the bill bounded:

1. **A reading is written once.** The same reader, chart, period and depth get
   the stored reading back for free until the period turns over. Pressing the
   button again, or opening it on another device, costs nothing.
2. **A daily limit per reader**, 6 attempts in any 24 hours by default. It
   counts attempts rather than successes, because a failed reading was still
   paid for. The worst case is about 6 in-depth readings, a little over $2, per
   reader per day. Most days a reader will ask for one or two.
3. **A spend limit you set with Anthropic.** In the Console, under Limits, set
   a monthly spend limit. When it is reached the Oracle says it is silent for
   now, and nothing else in the app is affected. This is the step that
   guarantees a surprise cannot happen. Do it before anything else.

To halve the per reading cost, set `ORACLE_MODEL` to `claude-sonnet-5-5`
($2 and $10 per million). The writing will be good but less rich.

## Steps

### 1. An Anthropic API key

1. Sign in at console.anthropic.com.
2. Add credit under Billing. A small amount is enough to start.
3. Set a monthly spend limit under Limits.
4. Create a key under API Keys, and copy it.

The key goes into Supabase in step 3, and nowhere else. **Never put it in the
repository**: the repository is public, and a key in it would be found and
spent by strangers within hours.

### 2. The table

In the Supabase dashboard, open SQL Editor, paste all of
`server/oracle/schema.sql`, and press Run. It creates one table,
`oracle_readings`. It is safe to run twice.

### 3. The function

1. In the dashboard, open Edge Functions and deploy a new function using the
   editor.
2. Name it exactly `oracle`. The app calls it by that name.
3. Replace the example code with all of `server/oracle/index.ts`, then deploy.
4. Under Edge Functions, Secrets, add `ANTHROPIC_API_KEY` with the key from
   step 1.
5. Leave JWT verification on. The app sends the signed in reader's token, and
   the function refuses anybody without one.

The function is kept in `server/oracle/`, not `supabase/functions/`, on
purpose. This repository is connected to Supabase's GitHub integration, which
watches a `supabase/` folder and can open preview branches that are billed.

### 4. Try it

Sign in on the cover with your email, open The Oracle and press Consult the
Oracle. The first reading takes up to a minute or so. Go to another tab and
back: the reading is there at once, because it is the stored one.

If it says the Oracle is silent for now, open the function's Logs in the
dashboard. No function named `oracle` at all means step 3 did not finish, and a
line saying the key was refused means the secret in step 3.4 is wrong. If it
says the stars clouded over, the Logs say why.

## The knobs

Set these as Edge Function secrets. Each is optional.

| Secret | Default | What it does |
|---|---|---|
| `ORACLE_MODEL` | `claude-opus-5-5` | Which Claude model writes. `claude-sonnet-5-5` costs half. |
| `ORACLE_DAILY_LIMIT` | `6` | Attempts per reader in any 24 hours. |
| `ORACLE_DEEP_EFFORT` | `medium` | How hard the model thinks before an in-depth reading: `low`, `medium` or `high`. Standard readings are always `low`. These are the Codex's own levels. |

**Time limit.** Supabase stops a function that runs too long. At the time of
writing that is 150 seconds on the free plan. A standard reading finishes well
inside it. An in-depth reading at `medium` is the longest thing the function
does; if in-depth readings start failing with "The stars clouded over", check
the Logs for a timeout and set `ORACLE_DEEP_EFFORT` to `low`, or move to a plan
with a longer limit.

## What is sent, and what is kept

**Sent to the function, and from there to Anthropic,** is the Codex's dossier:

- the reader's first name, as the Codex sent it;
- positions, houses and aspects;
- the Human Design type, authority, profile, centres, channels and gates;
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

Anthropic's API does not train on API traffic by default. Its current
retention terms are on its privacy page.
