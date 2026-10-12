# Codex Luminary in the EU and the UK: closed for now, ready for later

Decided by the owner on 12 October 2026: **do not sell Luminary in the EU or the
UK until volume justifies it, and have everything else prepared.** This page
says what is live, what is waiting, and the steps to open it.

## Why it is closed

A seller based outside the EU owes EU VAT on a digital service sold to a
consumer there **from the very first sale**. The UK works the same way for
sellers outside the UK. There is no small business threshold for either, so one
subscriber in Paris means registering for VAT, charging it and filing returns.
That is worth doing once there are enough subscribers to pay for it, not before.

Everything else in inCommon stays free and open everywhere. Only the purchase is
held.

## What is live now

Three layers. The first two are courtesy; the third is what actually holds.

1. **The page guesses the country** from the device's time zone (`lumCountry()`
   in the app). In the 27 EU countries, Monaco, the UK and the Isle of Man, the
   Luminary panel says "Codex Luminary is not available in your country yet."
   and shows no plan or button.
2. **The server refuses the checkout** for those countries with `REGION`, before
   Stripe is asked anything.
3. **The webhook checks what Stripe actually collected.** A time zone can be
   wrong (a VPN, a traveller, a zone set by hand), so when a checkout completes,
   `server/billing/index.ts` looks at the billing address and the card's issuing
   country. If either is in the EU or the UK, the subscription is cancelled
   immediately and the first payment refunded in full. Stripe emails the refund
   receipt. The function log says `refusing a Luminary checkout from a country
   not yet sold to` with the subscription id each time.

If a log ever says `REFUND BY HAND`, the payment could not be found on the
invoice: refund it from the Stripe dashboard.

Jersey and Guernsey are not held: neither is in the UK's VAT area. Norway,
Switzerland, Iceland and Liechtenstein are not held either: each has a
registration threshold for foreign sellers, so the first sales there owe nothing.

**Nothing needs doing in Stripe or Supabase for this.** Deploy the billing
function as usual (`docs/LUMINARY-SETUP.md`) and it is in force.

## What is prepared and switched off

Two Supabase secrets on the billing function, both off unless set to `on`:

| Secret | What it does when on |
|---|---|
| `LUMINARY_TAX` | Turns on Stripe Tax for every checkout: Stripe collects a billing address and adds tax wherever the Stripe account has a tax registration. With no registrations it adds nothing. |
| `LUMINARY_SELL_EU_UK` | Opens the EU and the UK. Refused unless `LUMINARY_TAX` is also on, because selling there without charging VAT is the one thing worse than not selling. |

With both on, a reader in the EU or the UK:

- pays the **same price as the US before tax**, in euros or pounds, **plus their
  own country's VAT**, and is shown the total with VAT in it before they pay
  (EU and UK consumer law want the price shown to be the price paid). See
  "The prices" below;
- gets a box at checkout to tick: "I ask for the in-depth readings to be
  available as soon as I subscribe, and I understand that I lose my 14 day right
  to withdraw once they are." Terms section 7 already says this, and EU law wants
  it as an explicit tick to be valid (`docs/LEGAL-SETUP.md`, before launch, item 2);
- can enter a business VAT number, in which case Stripe charges no VAT.

The EUR and GBP prices are created on the existing Codex Luminary product the
first time someone checks out there, the same way the US prices were.

## The prices

Set by the owner on 12 October 2026: **equal to the US price before tax**,
converted at that day's rates (1 USD = 0.891841 EUR and 0.754808 GBP), with each
country's VAT added on top, the way US sales tax is added to the US price.

| | Before tax | Monthly with VAT | Yearly with VAT |
|---|---|---|---|
| United States | | $12.99 + any sales tax | $119.99 + any sales tax |
| Every EU country | EUR 11.59 / 107.01 | | |
| Germany (19%) | | EUR 13.79 | EUR 127.34 |
| France, Austria, Monaco (20%) | | EUR 13.91 | EUR 128.41 |
| Ireland, Poland, Portugal (23%) | | EUR 14.26 | EUR 131.62 |
| Hungary (27%), the highest | | EUR 14.72 | EUR 135.90 |
| Luxembourg (17%), the lowest | | EUR 13.56 | EUR 125.20 |
| United Kingdom, Isle of Man (20%) | GBP 9.80 / 90.57 | GBP 11.76 | GBP 108.68 |

The before tax amounts are `LOCAL` in `server/billing/index.ts`, and Stripe holds
them as tax exclusive prices. Stripe Tax adds the VAT at checkout. The page shows
the total for the reader's country from the `VAT` table beside `LOCAL`, rounded
the way Stripe rounds, so the number on the button is the number charged.

**Two things to keep up:**

- **A VAT rate changes.** Update `VAT` in the same week, or the page shows one
  total and checkout charges another. The rates were checked against published
  2026 tables on 12 October 2026.
- **The exchange rate drifts.** A Stripe price never changes once made, so to
  re-price: make new prices in Stripe (Products, Codex Luminary, Add price, tax
  exclusive) with "transfer lookup key" from the old one
  (`incommon_luminary_monthly_eur` and the rest), archive the old ones, and
  update `LOCAL` to match. Existing subscribers stay on the price they bought
  until you move them.

## Opening the EU and the UK, when the time comes

Do these in order.

1. **Register for VAT.**
   - **EU:** the One Stop Shop's **non-Union scheme**, for businesses not
     established in the EU. One registration in one EU country covers all 27,
     with one quarterly return. Ireland's Revenue is a common choice for
     English speakers. Search "VAT OSS non-Union scheme registration".
   - **UK:** register with HMRC as a **non-established taxable person**. There
     is no threshold, and returns are quarterly.
   An accountant who does cross-border digital VAT can do both in an afternoon.
2. **Set up Stripe Tax** (Stripe dashboard, Tax):
   - activate it and enter the business's origin address;
   - add the registrations: the EU non-Union OSS registration and the UK one;
   - set the default product tax code to **General, Electronically Supplied
     Services** (`txcd_10000000`), or set it on the Codex Luminary product;
   - set the default tax behaviour to **Exclusive**, which is what the US price
     already means ("plus any applicable taxes" in the Terms). The EUR and GBP
     prices are created as inclusive by the code regardless.
3. **Give Stripe the Terms address.** Settings, Business, Public details, Terms of
   service URL: the address of `terms.html` on the real domain. Checkout cannot
   show the withdrawal box without it.
4. **Check the prices** in `LOCAL` and the rates in `VAT` (see "The prices"
   above): if the exchange rate has moved a lot since 12 October 2026, re-run
   the conversion before the first EU or UK checkout, because a price is made
   once.
5. **Update the legal pages in the same change**, and move their dates:
   - Terms section 7: add the EUR and GBP prices, plus VAT at the buyer's rate;
   - Privacy Policy: name an **EU and a UK representative** (GDPR Article 27).
     Once inCommon is sold there it is plainly offered there, and the exemption
     for occasional processing no longer fits. Representative services cost
     roughly EUR 100 to 500 a year;
   - the newsletter box: start it unticked for EU and UK readers, or leave them
     off the list (`docs/NEWSLETTER-SETUP.md`).
6. **Test it in Stripe's test mode** with test keys. Stripe's test cards include
   a French card (`4000 0025 0000 0003`) and a British one
   (`4000 0082 6000 0000`): with selling off, either should be refunded by the
   webhook; with it on, either should be charged VAT.
7. **Set both secrets to `on`** (Supabase dashboard, Edge Functions, billing,
   Secrets) and redeploy the function.

## Taxes elsewhere, for later

- **US states.** Florida does not tax this subscription. Some states tax digital
  products, but only once sales into that state pass a threshold, usually
  US$100,000 a year. Stripe Tax can watch the thresholds for you (Tax,
  Registrations, Monitoring). When one is reached, register in that state, add
  the registration in Stripe and set `LUMINARY_TAX` to `on`.
- **Other countries** with a threshold for foreign digital sellers include
  Canada (C$30,000), Australia (A$75,000), Switzerland (CHF 100,000 worldwide)
  and Norway (NOK 50,000). Monitoring covers these too.
- **The app stores.** A purchase made through Apple's or Google's own billing is
  sold by Apple or Google, who charge and pay the VAT themselves. If Luminary
  is sold in the iPhone and Android apps that way, EU and UK readers there need
  none of the above. See `docs/APP-STORE-SETUP.md`.
