# DMCCA subscription compliance: inventory, gap analysis, questions and plan

Status: **phase 0 and phase 1 shipped** (11 August 2026). Phases 2 to 6 outstanding.

| Phase | State | Branch |
|---|---|---|
| Production portal configuration | **done**, `bpc_1U3MmNJvOfVErgzbn4eGunfa` | Stripe dashboard |
| 0. Foundations | **done** | `feature/dmcca-phase0-foundations` |
| 1. Easy exit | **done** | `feature/dmcca-phase1-easy-exit` |
| 2. Pre-contract information | not started | |
| 3. Reminder notices | not started | |
| 4. Cooling-off rights | not started | |
| 5. Pricing claims | policy doc outstanding; Stripe description fixed | |
| 6. Audit and evidence | `cancellation_events` created; admin view outstanding | |

Both branches are unmerged and stack: phase 1 branches off phase 0. Migrations
have been applied to the production database already, and are additive only.

Date: 11 August 2026. Claims re-verified against the codebase and the Stripe API on the same
date; see the correction in 1.1, which changes what section 5 can be used for.
Regime in force: January 2027
Pricing-claims consultation: autumn 2026

Scope decision taken and not reopened here: every self-serve subscription in every tier and
every currency gets the full set of rights. No consumer/business branch, no `is_consumer`
flag. Where a requirement is genuinely awkward for a multi-seat institutional plan it is
raised as a question in section 3, not branched around.

---

## 1. Inventory of the current billing surface

### 1.1 Stripe account

**Verified against live production, 11 August 2026.** Earlier drafts of this section described
a different account. That is now resolved and the figures below are the real ones.

Production bills through **`acct_1T42edJvOfVErgzb` ("Vitrine"), live mode**. A second account,
`acct_1T42eoF1q447WCoN` ("Composition"), exists and is what the original Stripe connector was
attached to. The near-identical id prefix suggests Composition is a **Sandbox** of the
production account rather than an unrelated business. Nothing in Composition affects customers.

Two facts about the deployment that follow from the Vercel configuration:

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and all three `STRIPE_PRICE_*` variables each
  hold **one value targeted at `production`, `preview` and `development` together**. There is
  no environment separation: preview deployments and local development transact on the live
  account.
- They were all last updated **2026-04-28**, which is when billing moved to this account.

**There are currently zero customers and zero subscriptions in live mode.** Confirmed by
listing both. Nobody has ever subscribed through this account. That single fact reframes the
whole exercise: this is pre-launch work, the blast radius of getting it wrong today is nil, and
there is no migration burden on any existing contract.

### 1.2 Products and prices

Live production, `acct_1T42edJvOfVErgzb`.

| Plan | Product | Active price | Amount | Interval |
|---|---|---|---|---|
| Hobbyist | `prod_UQ3zvqS95A8q7m` | `price_1TRDrOJvOfVErgzbPepNluZT` | £5.00 | month |
| Professional | `prod_UQ3zdgNuW3wmkT` | `price_1TRDrQJvOfVErgzbVIu90WnQ` | £79.00 | month |
| Institution | `prod_UQ3z4eQSGjlqV0` | `price_1TRDrRJvOfVErgzbJmcb552L` | £349.00 | month |

Facts that matter downstream:

- **There are no annual prices.** Every price is `interval: month, interval_count: 1`. The
  statutory 12-month renewal cooling-off trigger currently has nothing to fire on, and the
  annual reminder cadence in workstream 3 has no subscriptions to cover.
- **All three prices carry the full 16 `currency_options`** (aud, cad, chf, czk, dkk, eur, gbp,
  huf, isk, nok, nzd, pln, ron, sek, try, usd), matching `BILLING_CURRENCIES`. An earlier draft
  raised the possibility that the July multi-currency work had shipped to the sandbox and left
  production GBP-only. **Checked, and it is not the case.** Localised pricing works.
- **Every price and every currency option has `tax_behavior: "unspecified"`.** Correct for now,
  given the VAT decision recorded in section 3. Revisit on registration.
- **A duplicate, superseded product set is still active.** Three older products
  (`prod_U4391QWzWriHBr`, `prod_U439pfYvDJicPn`, `prod_U43CU7vDLaHmpN`, all `active: false`)
  each still carry an **`active: true`, GBP-only** price from 2026-02-28:
  `price_1T5v2jJvOfVErgzb06kj8XEf`, `price_1T5v3WJvOfVErgzb1pxb3LHs`,
  `price_1T5v5eJvOfVErgzb8GsNnzJL`. No code references them. They are harmless today but they
  are GBP-only, so if the portal's price-switching ever exposes them a customer could land on a
  price with no currency options. Worth deactivating. Listed in section 5.
- **Professional's price carries `recurring.trial_period_days: 30`.** This looked like a bug
  that would grant trials to ineligible customers, bypassing the guard in
  [checkout/route.ts](app/api/stripe/checkout/route.ts). **Checked against Stripe's
  documentation: it does not.** Stripe deprecated price-level trials in 2018 and ignores them
  whenever the subscription is created with the `items` array, which includes every Checkout
  Session. The explicit `subscription_data.trial_period_days` in our code is what actually
  creates the trial, and the eligibility guard is therefore effective. The setting is dead
  configuration, but it is a trap for anyone who later switches to `trial_from_plan`, so it
  should be cleared. Listed in section 5.

### 1.3 Billing portal configuration

**There is no billing portal configuration on the production account.** Listing
`/v1/billing_portal/configurations` in live mode returns an empty set.

[portal/route.ts](app/api/stripe/portal/route.ts) calls `billingPortal.sessions.create` with
only `customer` and `return_url`, passes no `configuration`, and has no try/catch. With no
default configuration on the account, Stripe rejects that call. So **the "Manage subscription"
button, which is the only cancellation route that exists today, will fail the first time
anyone presses it**, returning an unhandled 500.

No customer has hit this yet because there are no customers. But it means the honest statement
of the current position is not "cancellation takes six clicks", it is **"cancellation does not
work at all"**. Workstream 1 was already first in the order; this is confirmation it belongs
there.

For reference, the sandbox account does have a configuration (`bpc_1T6dKmF1q447WCoNZwx4e6RE`)
with cancellation enabled at period end and the cancellation-reason survey switched on. That is
a reasonable guide to what the dashboard's defaults look like, and the survey is the thing
workstream 1 forbids, so whoever creates the production configuration must not accept that
default. Exact required settings are in section 5.

### 1.4 Routes

Subscription billing:

- [app/api/stripe/checkout/route.ts](app/api/stripe/checkout/route.ts) creates the Checkout
  Session. Enforces trial eligibility (Professional only, once per museum, never for
  `ever_paid`), creates or reuses the Stripe customer, resolves currency from the
  `vitrine_currency` cookie with a GBP retry fallback.
- [app/api/stripe/portal/route.ts](app/api/stripe/portal/route.ts) creates a portal session.
  Owner-only via `museums.owner_id`. This is the only cancellation path that exists today.
- [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) is the single webhook
  endpoint, 495 lines, mixing subscription lifecycle, ticketing and Connect.
- [app/api/delete-account/route.ts](app/api/delete-account/route.ts) cancels the Stripe
  subscription immediately, then calls `deleteMuseumEverywhere` (irreversible).
- [app/api/account/export/route.ts](app/api/account/export/route.ts) full ZIP export
  (CSVs plus R2 images and documents).

Ticketing and Connect, listed for completeness but **out of scope**: `stripe/connect/onboard`,
`stripe/connect/callback`, `stripe/connect/disconnect`, `ticket-checkout`, `ticket-refund`.
These are museum-to-visitor transactions on Connect, not Vitrine subscription contracts.

### 1.5 Webhook events handled today

| Event | What it does |
|---|---|
| `customer.subscription.created` / `.updated` | Sets plan, `ui_mode`, `stripe_subscription_id`; records `trial_used_at`; clears lockout; mirrors `cancel_at_period_end` and subscription schedules into `pending_downgrade_*` |
| `customer.subscription.deleted` | Locks the museum, sets `scheduled_deletion_at` (180 days if `ever_paid`, else 30), writes `activity_log`, emails the owner |
| `invoice.payment_failed` | Sets `payment_past_due`, emails once (guarded on the existing flag) |
| `invoice.payment_succeeded` | Clears `payment_past_due`; sets `ever_paid` only when `amount_paid > 0` |
| `checkout.session.completed` | Subscription fallback activation, plus all ticketing fulfilment |
| `account.updated` | Connect onboarding state |
| `charge.refunded` | Ticketing only, full refunds only, ignores partials |
| `subscription_schedule.canceled` / `.released` | Clears `pending_downgrade_*` |

**Not handled at all:** `invoice.upcoming`, `customer.subscription.trial_will_end`,
`invoice.created`, `price.updated`, `product.updated`, `customer.subscription.paused`.

**The production webhook endpoint** is `we_1TRDpNJvOfVErgzbJcbyLGYN`, enabled, pointing at
`https://vitrinecms.com/api/stripe/webhook` on API version `2026-01-28.clover`. It subscribes
to 16 events. It is *not* set to "all events", so workstream 3 does require a dashboard change.

Two mismatches worth recording:

- **Subscribed but unhandled:** `customer.subscription.paused`, `customer.subscription.resumed`,
  `invoice.paid`, `checkout.session.expired`, `charge.refund.updated`,
  `subscription_schedule.expiring`. These are delivered and silently ignored. Harmless, but
  `charge.refund.updated` becomes relevant in phase 4.
- **Needed and not subscribed:** `invoice.upcoming`, `customer.subscription.trial_will_end`,
  `price.updated`. All three are required by workstream 3. Listed in section 5.

**No event deduplication table exists.** Idempotency is ad hoc and per-branch: the
`payment_past_due` flag guards the dunning email, an existing-ticket count guards ticket
generation, an order status check guards refund handling. There is nothing recording
`event.id`, so a replayed `customer.subscription.updated` re-runs its writes, and there is no
ordering guard anywhere. Sufficient for idempotent column writes today, not sufficient once
notices and refunds are keyed off events.

### 1.6 Database

All subscription state lives on the `museums` table. Relevant columns:

```
plan                            text, default 'community'
stripe_customer_id              text
stripe_subscription_id          text
pending_downgrade_plan          text
pending_downgrade_date          timestamptz
payment_past_due                boolean not null default false
trial_used_at                   timestamptz
ever_paid                       boolean not null default false
locked_at                       timestamptz
lock_reason                     text        ('trial_expired' | 'subscription_ended')
scheduled_deletion_at           timestamptz
deletion_warning_30d_sent_at    timestamptz
deletion_warning_7d_sent_at     timestamptz
reengage_{a3,a7,a30,b30,b180}_sent_at   timestamptz
stripe_connect_id               text        (ticketing)
stripe_connect_onboarded        boolean     (ticketing)
```

Note a naming trap: **`trial_used_at` holds the trial *end* timestamp**, not the start. The
webhook writes `new Date(subscription.trial_end * 1000)` into it, and
[plan/page.tsx](app/dashboard/plan/page.tsx) reads it back as the conversion date. Anything
in workstream 3 that keys off trial timing must not assume the column name is accurate.

Supporting tables: `deletion_log` (RLS enabled, no policies, service-role only, survives the
museum row) and `activity_log`.

**Absent:** any `subscriptions` table of our own, `subscription_notices`,
`cancellation_events`, `refunds`, a webhook event log, or any persisted billing currency,
renewal date, renewal amount or cooling-off window. The billing currency exists only as a
browser cookie and inside Stripe.

RLS convention in this codebase, from `messaging-rls.sql` and `staff-rls.sql`: policies are a
deny-by-default backstop for the anon/cookie client, while authorisation is actually enforced
in application code through the service-role client. New tables should follow that pattern.

### 1.7 Scheduled jobs

Vercel cron, seven entries in [vercel.json](vercel.json), all daily, all authenticated with a
`Bearer ${CRON_SECRET}` header, all `maxDuration = 300` and `dynamic = 'force-dynamic'`.

```
09:00  /api/cron/personal-loan-reminders
08:00  /api/cron/compliance-reminders
03:00  /api/cron/fx-sync
04:00  /api/cron/account-deletion
10:00  /api/cron/deletion-warnings
06:00  /api/cron/upstash-keepalive
11:00  /api/cron/reengagement
```

[reengagement/route.ts](app/api/cron/reengagement/route.ts) is the best existing precedent for
what workstream 3 needs: staged sends, per-stage idempotency flags, a two-day catch window so
a missed cron day still fires, and an environment-variable kill switch plus `?dryRun=1`.
Its weakness as a model is that idempotency lives in columns on `museums` rather than in an
append-only log, which is exactly what workstream 3 and 6 forbid.

### 1.8 Email

**Resend** (`resend@^6.9.3`), sender `Vitrine <noreply@contact.vitrinecms.com>`.

There is no email abstraction. `new Resend(...)` is constructed inline at nine call sites
across eleven `emails.send` calls (three of them in the Stripe webhook), with HTML written as
template literals in each route and an `esc()` helper copy-pasted into ten files. There is no
send log, no message-id capture (return values are discarded or `.catch`-swallowed), no
retry, and no templating.
Workstream 3 requires a provider message id and a content hash per notice, so this needs a
thin shared layer. See Q2.

### 1.9 UI

- [app/dashboard/plan/page.tsx](app/dashboard/plan/page.tsx), 535 lines, the billing screen:
  usage meters, plan grid, feature comparison, trial banner, pending-downgrade banner,
  post-checkout polling. Every management action is "Manage subscription", which posts to
  `/api/stripe/portal` and redirects out to Stripe.
- [components/Sidebar.tsx](components/Sidebar.tsx), settings panel containing the plan
  summary, a "My Plan →" button and the delete-account flow.
- [app/dashboard/billing-required/page.tsx](app/dashboard/billing-required/page.tsx), the
  lockout wall, with an export link and a delete-account button.
- [app/onboarding/page.tsx](app/onboarding/page.tsx), creates the museum on `community` then
  redirects to Checkout, auto-applying the trial for Professional.
- [app/plans/page.tsx](app/plans/page.tsx), [app/faq/page.tsx](app/faq/page.tsx), marketing.
- [lib/plans.ts](lib/plans.ts) feature matrix and limits, [lib/planPricing.ts](lib/planPricing.ts)
  FX snapshot and localised formatting, [lib/stripe.ts](lib/stripe.ts) client and price map.

**Current click depth from dashboard home to cancelled:** open the settings panel (1),
"My Plan →" (2), "Manage subscription" (3), leave the site, "Cancel plan" in the Stripe portal
(4), select a mandatory cancellation reason (5), confirm (6). Six interactions, two of them
off-site, one of them a compulsory survey. The two-click requirement is missed by a wide
margin.

### 1.10 Lockout and retention as they stand

`customer.subscription.deleted` locks the museum rather than deleting it. Middleware
([middleware.ts:148](middleware.ts:148)) redirects every dashboard path except
`/dashboard/billing-required` for a locked museum, and the public site 404s. Retention is 180
days for anyone who ever paid, 30 days for a trial-only account. Warning emails go at 30 and
7 days, then `account-deletion` cron calls `deleteMuseumEverywhere`, which empties the three
R2 buckets under the `${museumId}/` prefix, deletes roughly forty tables in dependency order,
writes `deletion_log`, and finally deletes the auth user.

This is a genuinely good foundation for workstream 4's data-handling requirement. What it is
not is *read-only*: a locked museum cannot see its own dashboard at all, only the payment wall
and the export link.

### 1.11 Tests

Vitest, node environment, dummy Stripe env vars in
[vitest.config.ts](vitest.config.ts). `__tests__/api/stripe/webhook.test.ts` is 620 lines with
mocked Stripe, Resend and Supabase. `ticket-checkout` and `ticket-refund` are covered.

No test clocks, no Stripe fixtures, no timezone tests, no reconciliation tests, no
click-depth test, and no component or browser-level tests anywhere in the repo. Workstream
testing is close to greenfield.

---

## 2. Gap analysis

Key: **absent** = nothing exists. **partial** = something exists but does not meet the
requirement. **met** = requirement satisfied as written.

### Workstream 1: easy exit

| Requirement | State | Notes |
|---|---|---|
| Cancel within two clicks of account home | **absent** | Six interactions by design, and in practice zero: the portal is unconfigured in production, so the flow fails at interaction three. See 1.3 |
| Works on mobile web | **partial** | Portal is responsive; our own flow does not exist |
| No mandatory exit survey | **absent** | Stripe portal `cancellation_reason` is enabled and required |
| Save offer rules (one screen, one offer, equal weight) | **met by absence** | No save offer exists. Rules apply if one is ever added |
| Cancel at period end by default | **met** | Portal `mode: at_period_end`; webhook mirrors to `pending_downgrade_*` |
| No second confirmation beyond one "are you sure" | **partial** | Stripe's flow is reason then confirm |
| Admin-triggered cancellation on the same code path | **absent** | `app/admin` has `toggleTestAccount` and `deleteUser` only. `deleteUser` is destructive, not a cancellation |
| Confirmation email within one hour | **absent** | Nothing is sent on cancellation. The only email is the later lockout email, fired on `subscription.deleted`, which for a period-end cancellation arrives weeks later |
| Portal config matches in-app behaviour | **absent, and worse than absent** | No portal configuration exists on the production account, so the portal call fails and the only cancellation route in the product is broken. See 1.3 |

### Workstream 2: pre-contract information

| Requirement | State | Notes |
|---|---|---|
| Key contract information panel before Checkout | **absent** | Both entry points redirect straight to Stripe |
| Repeated on the account subscription screen | **partial** | Price and plan shown; no first-charge date, renewal date, renewal amount, minimum term, cancellation route or cooling-off rights |
| Price inclusive of VAT | **absent, and blocked** | `tax_behavior: "unspecified"` throughout, Stripe Tax not configured. See Q1 |
| Billing frequency | **partial** | "/mo" suffix only |
| Date of first charge | **absent** | |
| Date and amount of first renewal | **absent** | |
| Auto-renewal disclosure | **absent** | |
| Minimum term | **absent** | There is none, but that must be stated, not implied |
| How to cancel | **partial** | Plan page links to the portal in banner copy only |
| Cooling-off rights | **absent** | Not in the UI, not in `lib/legal/terms.ts`. Section 4 of the terms covers pricing and 30 days' notice of change; section 9 covers termination. Neither mentions a 14-day right |
| Trial: length, exact end date, conversion amount, how to cancel | **partial** | Plan page shows conversion date and amount for an active trial. At the point of purchase the copy is "Card required. Converts to £79/mo after 30 days. Cancel anytime", with no exact date and no cancellation route |
| Trial info at least as prominent as the trial offer | **absent** | The offer is a filled primary button, the terms are 10px muted text below it |
| Discount and introductory price disclosure | **not applicable yet** | No coupons or intro prices are used. Rule must exist before one is |
| Same information emailed within one hour, durable | **absent** | No post-subscription email of any kind |
| Store rendered content or version id for evidence | **absent** | |
| Not behind accordion, tooltip or T&Cs link | **met by absence** | |

### Workstream 3: reminder notices

| Requirement | State |
|---|---|
| Annual renewal reminders at 30 and 7 days | **absent**, and no annual plans exist to remind about |
| Monthly reminder at least every six months | **absent** |
| Monthly first-renewal reminder at 7 days | **absent** |
| Trial reminders at 7 and 2 days | **absent**. `customer.subscription.trial_will_end` is not handled |
| Short-trial fallback (midpoint and 24 hours) | **absent**. Not reachable today, the only trial is 30 days |
| Price change notice 30 days ahead | **absent**. Terms promise 30 days' notice, no mechanism delivers it |
| Driven by Stripe events where possible | **absent**. `invoice.upcoming` not handled |
| Nightly reconciliation against the subscription table | **absent**. There is no subscription table to reconcile against |
| Append-only `subscription_notices` with sent-at, message id, content hash | **absent** |
| RLS: owner reads, service role writes | **absent** |

The reconciliation requirement is the sharpest gap here, because it has no local source of
truth to reconcile *to*. Everything about renewal timing currently lives in Stripe. This is
what makes a local subscription mirror table a prerequisite rather than a nicety.

### Workstream 4: cooling-off rights

| Requirement | State |
|---|---|
| 14 days from initial subscription start | **absent** |
| 14 days from trial conversion | **absent** |
| 14 days from every renewal, monthly included | **absent** |
| Window persisted on the subscription record | **absent** |
| Refund pro-rated for service supplied | **absent**. No subscription refund path exists at all. `ticket-refund` is Connect-only and separate |
| Pro-rata versus full behind one config constant | **absent** |
| Stripe Refunds API with mandatory idempotency keys | **absent**. No `stripe.refunds.create` call anywhere |
| Reconciled against `charge.refunded` | **partial**. The handler exists but early-returns on partial refunds and only ever looks up `ticket_orders` |
| Never delete immediately, move to read-only | **partial**. Lockout is not deletion, which is right, but it is a hard wall rather than read-only |
| Keep full export available | **met**. `/api/account/export` is reachable from the lockout wall |
| Minimum 30-day retention with warning email | **met**. 180 days if ever paid, 30 if trial-only, warnings at 30 and 7 |
| R2 images retained for the window | **met**. R2 purge happens only in `deleteMuseumEverywhere` |
| Multi-seat institutional behaviour defined | **absent**. See Q7 |

### Workstream 5: pricing claims

I audited `app/`, `components/`, `content/` and `lib/` for struck-through prices, "was"
pricing, RRP anchors, countdown timers and limited-time framing.

| Check | Result |
|---|---|
| Struck-through "was" prices | **clean**. The only `line-through` classes are UI state (completed tasks, cancelled-account label in admin, object progress) |
| Invented RRP anchors | **clean** |
| Countdown timers | **clean**. No timer components exist |
| "Limited time" framing on permanent pricing | **clean** |
| Fake discounts | **clean**. The only discount references are the genuine non-profit discount on `/plans` and `/faq`, which is a real offer via the enterprise form |
| Annual versus monthly saving claims | **not applicable**. No annual pricing exists, so no comparison is made |
| `docs/pricing-claims-policy.md` | **absent**. `docs/` did not exist before this file |

Exposure is essentially nil today, which makes this the cheapest workstream. The value is
writing the rule set down before annual pricing lands, since an annual tier is the most likely
future source of a saving claim.

One item that is not a pricing claim but is a claim: the Professional product description in
Stripe still says "spectrum compliance tools". That text appears on Stripe-hosted Checkout and
invoices.

### Workstream 6: audit and evidence

| Requirement | State |
|---|---|
| Append-only notices table | **absent** |
| Append-only cancellation events table | **absent**. `activity_log` gets one `account_locked` row, written at lock time, not at cancellation time |
| Append-only refunds table | **absent** |
| No hard deletes, no history-overwriting updates | **absent as a guarantee**. Nothing enforces append-only anywhere. Current billing state is a set of mutable columns on `museums`, overwritten in place |
| Single internal admin view per customer | **absent**. `/admin` lists museums with plan, MRR and a status derived from `plan` plus `stripe_subscription_id`. `/admin/[museumId]` exists but has no billing history |
| Six-year retention | **absent, and actively contradicted**. `deleteMuseumEverywhere` deletes the museum row and about forty tables. Only `deletion_log` survives. Any evidence table keyed by `museum_id` will be destroyed on deletion unless deliberately excluded |

That last row is the one to watch. Workstream 6's six-year retention and the existing
irreversible deletion path are in direct conflict, and the conflict is resolved by
`deleteMuseumEverywhere`, not by policy. See Q8.

---

## 3. Questions

> **Decisions taken 11 August 2026.** Recorded here; the question text below is left intact for
> context.
>
> - **Production Stripe account is `acct_1T42edJvOfVErgzb`.** The connector cannot reach it
>   (a read of a live price returns "No such price"), so it remains unreadable and unfixable by
>   me. Note the near-identical prefix to the connector's `acct_1T42eoF1q447WCoN`, which
>   suggests the latter is a Stripe **Sandbox** of the former rather than an unrelated account.
>   Either way changes made in one do not affect the other.
> - **Q1 VAT resolved: the headline price does not change.** £79 stays £79 whether or not
>   Composition is VAT registered; on registration the VAT is absorbed rather than added. So
>   the displayed price becomes VAT-*inclusive* at that point, which is option 1. Taking
>   "once registered" to mean not currently registered, the panel must therefore say
>   "£79 per month" today with no VAT claim, and "£79 per month, including VAT" later. Built
>   behind a single `VAT_REGISTERED` constant so the switch is one line plus one Stripe
>   setting. **Do not write "including VAT" while unregistered** — claiming to charge tax that
>   is not collected is an offence in itself.
> - **Q12 test environment: no separate test database.** Migrations to be applied without an
>   end-to-end test environment. Consequences and the mitigations I am applying regardless are
>   recorded in the testing note at the end of section 4. Mitigated considerably by the
>   discovery that production has zero customers and zero subscriptions.
> - **Q9 resolved: show both options, with period-end preselected.** A customer inside the
>   cooling-off window sees two choices on one screen: cancel at period end and keep service to
>   the end of the paid month (preselected, no refund), or cancel now and take the refund. The
>   panel copy is "cancel now and get £X back", never a claim that a period-end cancellation is
>   refundable. Equal visual weight between the two, per workstream 1.
> - **VAT copy audit done.** Zero occurrences of "VAT" or any tax wording across `app/`,
>   `components/`, `lib/`, `content/` and `public/`. Nothing to remove. The `VAT_REGISTERED`
>   constant will keep it that way until Matt says otherwise.

Ordered roughly by how much they block. Q1 to Q4 gate design; the rest gate individual
phases.

### Q1. VAT, and what "price inclusive of VAT" is going to mean

Every price and every one of the 16 currency options carries `tax_behavior: "unspecified"`.
Stripe Tax is not enabled. So today £79 is a bare number with no tax treatment attached,
and I cannot render "£79 including VAT" without asserting something that is not true in the
billing system.

Three ways out, and I need you to pick one:

1. **Set `tax_behavior: "inclusive"`** on the existing prices and declare the displayed price
   VAT-inclusive. Cheapest. Changes nothing about what is charged. Means the £79 is treated as
   containing £13.17 of VAT for UK customers, reducing net revenue at the same headline price.
2. **Enable Stripe Tax** with `tax_behavior: "exclusive"`, collect VAT on top, and show
   "£79 plus VAT, £94.80 total" in the key-information panel. Correct for a business selling
   across 16 currencies and multiple tax jurisdictions, but it is a pricing change in effect
   for existing customers, which sits against the "no changes to pricing levels" non-goal.
3. **Neither yet**, and the panel says "£79 per month" with a stated VAT position agreed with
   your accountant.

This is not really a code question and I should not pick it. It affects what the panel says
in every currency and it is not reversible without a customer-visible price change.

Related: are you VAT registered, and is Composition Limited currently charging VAT on
subscriptions at all?

### Q2. Email provider and whether I may add a thin shared layer

Resend is wired and working, sending from `noreply@contact.vitrinecms.com`. No new dependency
needed. But there is no abstraction: nine inline `new Resend(...)` sites, twenty-two send
calls, HTML in template literals, `esc()` duplicated, and return values discarded so no
message id is ever captured.

Workstream 3 requires a provider message id and a content hash per notice, and workstream 2
requires storing what a customer was shown. That needs a single send path.

May I add `lib/email/` containing a `send()` wrapper that captures the Resend message id,
a shared `esc`, and a small set of layout helpers, and route only the *new* compliance emails
through it? I would not touch the existing twenty-two call sites in this piece of work, since
that is exactly the unrelated restructuring you asked me to avoid. It does mean two email code
paths coexist for a while.

Also: should compliance notices send from a distinct address, for example
`billing@contact.vitrinecms.com`, so a customer filtering marketing does not filter a
statutory notice? And is the Resend domain configured with the deliverability records needed
for something we later have to prove was delivered?

### Q3. Annual prices

There are none. Every tier is monthly only.

This matters more than it first appears. The 30-day and 7-day renewal reminders are specified
for annual plans, and the statutory cooling-off trigger on auto-renewal applies to terms of 12
months or longer. Both currently describe an empty set.

- Are annual prices planned before January 2027?
- If yes, should I build the annual paths now against prices that do not exist yet, tested
  with test-mode annual prices, so the pipeline is ready? My recommendation is yes: build the
  cadence logic generically off `interval` and `interval_count` rather than hardcoding
  monthly, so an annual price added later is covered on day one with no code change.
- If annual pricing is coming, that is where a saving claim will appear, and workstream 5's
  policy document should be written with that in mind.

### Q4. Trials

Current state: 30 days, Professional only, one per museum forever, blocked for anyone with
`ever_paid`. Applied at Checkout Session creation, not on the price. Card required up front.
On the onboarding path the trial is applied automatically for Professional without the
customer choosing it.

- Are Hobbyist or Institution trials planned? The reminder logic is the same either way, but
  the pre-contract panel copy differs.
- Trials shorter than 7 days trigger the midpoint-and-24-hour fallback. Is a short trial ever
  likely, or should I implement the fallback and leave it unexercised in production?
- `trial_used_at` stores the trial *end* timestamp. Do you want me to leave that alone and work
  around it, or is a rename in scope? I lean towards leaving it, since renaming touches the
  webhook, the plan page and the checkout guard, and that is unrelated restructuring. I would
  add a comment.
- On the onboarding path, the customer is auto-enrolled into a trial they did not explicitly
  select. Pre-contract information has to be given "before the customer is bound", which for
  an auto-applied trial means before they reach Checkout. Confirm you are happy for onboarding
  step 3 to gain a key-information panel, which adds a screen to the signup flow.

### Q5. Job runner and cron budget

Vercel cron, seven jobs already, all daily, all `Bearer CRON_SECRET`, `maxDuration = 300`.
Good enough as a base. Questions:

- What Vercel plan is this on? Hobby caps cron at two jobs and once-daily; you have seven
  daily jobs deployed, which implies Pro (40 jobs, minute granularity). Confirm, because I want
  to add two jobs (notice dispatch, nightly reconciliation) and I would prefer them hourly, not
  daily. Daily granularity means a "7 days before renewal" notice can land anywhere in a
  23-hour band, which is fine, but "within one hour" for the cancellation confirmation and the
  pre-contract email is not achievable on a daily cron. Those two must be sent inline from the
  request or webhook rather than queued.
- Given `CRON_SECRET` was unset for months and silently 401'd everything, do you want a
  dead-man's-switch on the notice cron specifically, so a statutory notice pipeline that stops
  running alerts rather than failing quietly? I would suggest a row written on every
  successful run and a Sentry alert if the newest row is over 36 hours old.
- Should the notice pipeline get the same `REENGAGEMENT_ENABLED`-style kill switch and
  `?dryRun=1` as the reengagement cron? I think yes for dry run, no for the kill switch: a
  statutory notice pipeline should not have an easy off switch.

### Q6. Account deletion and data retention

Current behaviour, which is better than I expected and mostly satisfies workstream 4:

- Cancellation does not delete. `customer.subscription.deleted` locks the museum and schedules
  deletion 180 days out if `ever_paid`, 30 days if trial-only.
- Warning emails at 30 and 7 days before deletion, idempotent via flags.
- Export stays available at `/api/account/export` from the lockout wall.
- R2 objects are retained until the final deletion.
- `deleteMuseumEverywhere` then purges three R2 buckets and about forty tables, writes
  `deletion_log`, and deletes the auth user.
- Separately, `/api/delete-account` is immediate and irreversible with no cooling-off
  consideration at all.

Questions:

- Workstream 4 wants read-only, not locked out. Today a locked museum sees only the payment
  wall. Do you want a genuine read-only mode, where the dashboard renders with writes disabled
  and the collection is browsable, for cancelled accounts inside the retention window? That is
  the single largest piece of work implied anywhere in this brief, because every write path in
  the app has to respect it. Middleware currently does this with one redirect. Doing it
  properly means a gate on roughly fifty API routes.
  My recommendation: scope phase 4 to read-only for the *cooling-off* window specifically
  (14 days), keep the existing hard lockout after that, and treat full read-only as a separate
  piece of work. That satisfies the requirement as written, which attaches read-only to a
  cooling-off cancellation, without a fifty-route change landing inside a compliance branch.
- Does a cooling-off cancellation get the 180-day window or the 30-day window? They paid, then
  got refunded. `ever_paid` will be true, so today they would get 180 days. Fine by me, but it
  is a decision.
- `/api/delete-account` deletes immediately even for a customer three days into a paid month.
  Should an explicit account deletion inside a cooling-off window trigger the refund
  automatically, prompt the customer that they are giving one up, or stay as is?

### Q7. Multi-seat institutional cancellation, which you asked me to raise rather than guess

Seats are not billed. `quantity: 1` on every subscription item. `PLANS.institution.staff` is
`null`, meaning unlimited, and Professional allows 10. Staff are rows in `staff_members`
with `access` of Admin, Editor or Viewer, linked to auth users, and RLS grants them access
through the museum.

Only `museums.owner_id` can reach billing at all: both `/api/stripe/checkout` and
`/api/stripe/portal` filter on `owner_id`, and the plan page hides billing controls when
`isOwner` is false.

So there is no per-seat billing to unwind, but there is a real problem. When an owner cancels
inside the cooling-off window and takes a refund:

- Every staff member loses access at once, with no notice to them. Today they hit the same
  lockout redirect as the owner, having received no email, because notices go to the owner
  only.
- A staff Admin cannot cancel, so the "cancellation received through any channel" admin action
  needs a rule for what happens if a staff Admin emails support asking to cancel. Do we honour
  it, or refuse and route to the owner?
- If the owner leaves the institution, nobody can cancel. That is an easy-exit problem in its
  own right: the exit route depends on one person's auth account.

My questions:

1. Should staff members be emailed when the museum they work on is cancelled, or is the owner
   the only contractual party we notify?
2. Should staff Admins be able to cancel, or only the owner? If only the owner, the confirmation
   email should say so, so an institution knows who to ask.
3. On a cooling-off refund, the refund goes to the original payment method, which may be a
   departmental card belonging to someone who has left. Anything we should do beyond letting
   Stripe handle it?
4. Is there any circumstance where an institution's seats should survive a cancellation, for
   example a partial downgrade to Community with 100 objects retained rather than the whole
   museum going read-only? Today a cancel means the whole museum locks regardless of tier.

### Q8. Six-year retention versus irreversible deletion

Workstream 6 wants notices, cancellations and refunds kept for six years. The deletion path
destroys everything keyed to a museum after 180 days.

If evidence tables carry a `museum_id` foreign key with cascade, our proof disappears
precisely when a disgruntled ex-customer is most likely to complain. The fix is to keep them
out of `TABLES_IN_DEPENDENCY_ORDER` and let them outlive the museum, the way `deletion_log`
already does, with no FK constraint.

That leaves personal data (email addresses, amounts) in tables surviving account deletion for
six years, which needs to be true in the privacy policy. Confirm:

1. Evidence tables survive account deletion, no FK, no cascade. Agreed?
2. Do they store the email address the notice was sent to, or only a `museum_id` and a hash?
   Storing the address is far more useful as evidence and far worse for data minimisation. My
   recommendation is to store it, with a documented six-year retention basis of legal
   obligation, and add it to the privacy policy in the same branch.
3. Six years from the notice, or six years from the end of the contract?

### Q9. Cancel at period end versus cooling-off refund

These two requirements pull in opposite directions and I want to be sure I have your intent.

Workstream 1: cancellation takes effect at the end of the current period by default.
Workstream 4: cancelling inside the 14-day window issues a refund pro-rated for service
supplied.

A customer on day 3 of a monthly cycle who clicks cancel is in both cases at once. Either:

- **(a)** they cancel at period end, keep service for 27 more days, and get no refund, because
  they used the service; or
- **(b)** they cancel immediately, get roughly 11 of 30 days refunded, and lose access now; or
- **(c)** we show both options and let them choose.

I recommend (c), with (a) preselected, because it is the one that does not surprise anyone.
It also means the cooling-off panel copy is "cancel now and get £X back" rather than a claim
that a period-end cancellation is refundable, which it is not. Confirm, because it determines
the shape of the cancel screen.

A related edge case: with the window applied to every monthly renewal, a monthly customer is
inside a cooling-off window for 14 days of every 30. For roughly half of each month, "you can
cancel and get a refund until [date]" is permanently on screen. Is that the intent? You said
the simplicity is worth the refund exposure and I agree, I just want to confirm you pictured
it being always-on rather than occasional.

### Q10. Save offer

Permitted by your brief, does not exist today. Are you planning one? If not, I will build the
cancel flow with no save-offer step at all and document the constraints in the pricing-claims
policy so a future addition has rules to follow. Adding an unused screen now is the kind of
thing that rots.

### Q11. Currency is not persisted anywhere we control

Billing currency lives in the `vitrine_currency` cookie and in Stripe. It is not on `museums`.
Renewal reminders must state the amount, and the pre-contract email must state the price, both
in the currency the customer is actually charged.

Options: read it from Stripe on every notice (an API call per notice, authoritative), or mirror
it onto the subscription record at checkout and on every invoice (fast, one more thing to keep
in sync). I lean towards mirroring it into the local subscription table that workstream 3 needs
anyway, with the nightly reconciliation correcting drift. Any objection?

### Q12. Test clocks, the test-mode boundary, and which Stripe account is real

**Revised after the finding in 1.1.** This is now the most blocking question in the document,
because it is not a preference, it is an unknown about production.

What I established:

- `.env.local` holds an `sk_live` key and three price IDs from an account whose fragment is
  `JvOfVErgzb`. The Stripe MCP connector is authenticated to `acct_1T42eoF1q447WCoN`
  ("Composition") in test mode. These are different accounts.
- **Vercel confirms there is no environment separation at all.** On the `vitrine` project,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and all three `STRIPE_PRICE_*` variables each
  hold a **single value targeted at `production`, `preview` and `development` together**.
  `hiddenProductionEnvCount` is 0. So preview deployments and any Vercel-side dev environment
  transact against the same live Stripe account as production.
- The Stripe variables were all last updated **2026-04-28 15:48 UTC**, within seconds of each
  other, which looks like a deliberate switch of billing account on that date.
- **Supabase resolved: there is exactly one Vitrine database.** The organisation contains only
  `vitrine` (`cnbcvntlznwnznoixyzb`, active) and `quizzy-bears` (unrelated, inactive). No
  staging project exists. Answered, no input needed.

Conclusion: production bills through the `JvOfVErgzb` account, not "Composition", and every
environment shares it. Test clocks cannot run against a live key, and there is no non-production
database for test-clock webhooks to write into.

Still needed from you:

1. **Confirm the production Stripe account id**, or grant the connector access to it. Until
   then every ID in 1.2, 1.3 and section 5 is provisional.
2. **What is `acct_1T42eoF1q447WCoN` for?** Note it is not simply abandoned: its current
   prices were created **2026-07-20**, three months *after* production switched away, and that
   is the same date as the `FX_SNAPSHOT` capture in [lib/planPricing.ts](lib/planPricing.ts).
   See the risk flagged below.
3. **A second Supabase project for billing tests.** Now a prerequisite rather than a
   preference, since the alternative is test-clock suites writing fake subscriptions into the
   database holding real museums.
4. Should test-clock tests run in `npm test`, or a separate `npm run test:billing`? I suggest
   separate: a 90-second Stripe round trip in a watch loop is unusable.

#### Risk surfaced by the dates, to verify before anything else

The 16 `currency_options` documented in 1.2 were added to prices created on 2026-07-20 **in the
Composition account**. Production's `STRIPE_PRICE_*` variables have not changed since
2026-04-28. Stripe does allow `currency_options` to be added to an existing price without
changing its id, so this may be fine. But the alternative is that the localised-pricing work
shipped against the wrong account, in which case production prices may carry no currency
options and every non-GBP checkout is silently taking the GBP retry fallback in
[checkout/route.ts](app/api/stripe/checkout/route.ts).

That is a live revenue and correctness question, independent of DMCCA, and it is cheap to
settle: read one production price and look for `currency_options`. It should be the first
thing checked once the production account is reachable.

---

## 4. Phased plan

One branch per workstream, small commits, no cross-workstream refactoring.

Blast radius is rated by what breaks if the phase is wrong: **low** means new surface only,
**medium** means existing paths change behaviour, **high** means money or data moves.

### Phase 0: foundations (prerequisite, not a workstream)

Small, unavoidable, and shared by everything after it. Doing it as part of phase 1 keeps it
honest rather than speculative.

- `subscriptions` mirror table: museum id, Stripe subscription and customer id, price id,
  plan, status, interval and interval count, currency, unit amount, current period start and
  end, trial end, cancel-at-period-end, cooling-off window start and end. Populated from
  webhooks, corrected by the nightly reconciliation added in phase 3.
- `stripe_webhook_events` table keyed on `event.id` for deduplication and out-of-order
  detection, with the raw event retained.
- `lib/email/send.ts`, subject to Q2.
- `lib/billing/config.ts` with `COOLING_OFF_DAYS = 14` and `COOLING_OFF_REFUND_MODE =
  'pro_rata' | 'full'`.

Blast radius: **low**. New tables, new webhook writes alongside the existing ones, nothing
removed. The one risk is double-writing plan state, so the mirror table is read by nothing
until phase 3.

Stripe dashboard: none.

### Phase 1: easy exit (workstream 1)

- In-app cancel route reachable in two clicks: a "Cancel subscription" control on
  `/dashboard/plan`, which is itself one click from the sidebar settings panel. If the panel
  counts as a click, the plan page needs to be a direct sidebar nav item, which is a small
  change to `components/Sidebar.tsx`. Worth confirming how you count the panel.
- One "are you sure" screen. No survey. No save offer, pending Q10. Shows the cooling-off
  position from phase 4 once that lands, and until then shows the period-end date.
- `POST /api/subscription/cancel`, owner-only, writes an append-only `cancellation_events` row,
  calls Stripe with `cancel_at_period_end: true` plus an idempotency key.
- Admin cancellation action in `app/admin/[museumId]` calling the identical service function,
  with an `initiated_by` of `self_serve` or `support`, and the same timestamp semantics.
- Cancellation confirmation email, sent inline, not queued, so the one-hour requirement is met
  by construction. States the cancellation date, what happens to the data, the retention
  window, and the export link.
- Playwright or equivalent end-to-end test asserting click depth from `/dashboard` is two or
  fewer.

Blast radius: **medium**. Introduces a second cancellation path alongside the portal, so both
must converge on the same database state. Mitigated by having the in-app route do nothing the
webhook does not already handle: it calls Stripe, and `customer.subscription.updated` remains
the thing that updates `museums`.

Stripe dashboard changes, exact settings:

1. Billing portal configuration `bpc_1T6dKmF1q447WCoNZwx4e6RE`, and its live-mode equivalent:
   **Cancellation reason: off.** Currently on, with a required selection. This is the mandatory
   exit survey.
2. Same configuration: set `default_return_url` to `https://vitrinecms.com/dashboard/plan`.
   Currently null, so the portal's return link depends entirely on the per-session
   `return_url`, which we do set, but the default should not be empty.
3. Same configuration: set `business_profile.terms_of_service_url` to
   `https://vitrinecms.com/terms` and `privacy_policy_url` to
   `https://vitrinecms.com/privacy`. Both currently null.
4. Leave `subscription_cancel.mode` as `at_period_end` and `proration_behavior` as `none`.
   Both correct. Do not change them.

A note on the test suite: no browser test runner exists in this repo. A click-depth assertion
needs one. That is a new dependency and I will not add it without telling you first. Playwright
is the obvious choice. The alternative is a static assertion over the rendered component tree
in Vitest, which is weaker but adds nothing new. Say which you prefer.

### Phase 2: pre-contract information (workstream 2)

- `components/billing/KeyContractInformation.tsx`, one component rendered in three places:
  before Checkout on `/dashboard/plan`, in onboarding step 3, and on the account subscription
  screen. Not collapsible, not a tooltip, not a link.
- A versioned content module, so the exact text shown is identified by a version string stored
  against the subscription. Both the rendered HTML hash and the version go into evidence.
- Post-subscription email carrying the same content, sent inline from
  `checkout.session.completed`.
- Terms of service additions are **out of scope** per your non-goals. I will note precisely
  which sections need wording, sections 4 and 9, and leave the drafting to you.

Blast radius: **medium**. Adds a screen to the signup funnel. That is a conversion-affecting
change and should be measured. It cannot be avoided: the information has to come before the
customer is bound.

Stripe dashboard: depends entirely on Q1. If VAT-inclusive, `tax_behavior` changes on all
three prices and all 48 currency options. If Stripe Tax, that is a larger configuration
exercise and probably its own phase. Also: fix the Professional product description, which
still says "spectrum compliance tools".

### Phase 3: reminder notices (workstream 3)

- `subscription_notices`, append-only: subscription id, notice type, scheduled at, sent at,
  provider message id, content hash, content version. Insert-only grant, no update or delete
  policy, RLS readable by the owning user, writable by service role.
- `invoice.upcoming` and `customer.subscription.trial_will_end` webhook handlers, scheduling
  rather than sending.
- `GET /api/cron/subscription-notices`, hourly, dispatching anything due.
- `GET /api/cron/subscription-reconcile`, nightly, walking Stripe subscriptions against the
  mirror table and scheduling anything a missed webhook dropped.
- Cadence computed from `interval` and `interval_count`, so annual works the day an annual
  price exists.
- Price-change notices at 30 days, triggered from `price.updated` and from a manual admin
  action, since a price change is usually a new price plus a migration rather than an edit.

Blast radius: **low to medium**. Almost entirely new surface. The risk is not breakage, it is
sending wrong or duplicate emails to real customers, so the dry-run mode from Q5 matters and
the first deploy should run in dry run for a full cycle.

Stripe dashboard: add `invoice.upcoming`, `customer.subscription.trial_will_end` and
`price.updated` to the webhook endpoint's enabled events, in both modes. Confirm the endpoint
is not set to "all events", in which case no change is needed.

### Phase 4: cooling-off rights (workstream 4)

- Window computed and persisted on the mirror table at subscription start, trial conversion
  and every renewal.
- Cancel screen from phase 1 gains the refund option, per Q9.
- `stripe.refunds.create` with a mandatory idempotency key derived from the charge id and the
  window, so a retry can never double-refund.
- `refunds` table, append-only, reconciled against `charge.refunded`. The existing
  `charge.refunded` handler must be extended carefully: it currently early-returns on partial
  refunds and only looks at `ticket_orders`, so a pro-rata subscription refund would be
  silently ignored today.
- Read-only mode for the cooling-off window, scoped per my recommendation in Q6.
- Retention and warning emails already exist and are reused unchanged.

Blast radius: **high**. This phase moves money and touches the ticketing refund handler.
Everything here needs test-clock coverage before merge, and the refund path needs a live-mode
smoke test with a real small charge.

Stripe dashboard: confirm `charge.refunded` is enabled on the webhook endpoint. It is handled
in code, so presumably yes.

### Phase 5: pricing claims (workstream 5)

- `docs/pricing-claims-policy.md`, short standing rules.
- Nothing to remove. The audit came back clean.
- Fix the Stripe product description.

Blast radius: **none**. Documentation only. Could be done first if you want an early
merge, and honestly it probably should be, since it is an hour of work and it is the thing
with an autumn deadline rather than a January one.

### Phase 6: audit and evidence (workstream 6)

- Append-only enforcement: revoke update and delete on the three evidence tables from all
  roles, so append-only is a database guarantee and not a convention.
- Exclude evidence tables from `TABLES_IN_DEPENDENCY_ORDER`, subject to Q8.
- `/admin/[museumId]/billing`: every notice, every cancellation interaction with timestamps,
  every refund, on one screen.
- Retention documented, and the privacy policy updated to match.

Blast radius: **low**, with one exception. The change to `deleteMuseumEverywhere` is a change
to a destructive path, and getting it wrong either orphans data or destroys evidence. Small
diff, careful review.

### Testing note, following the decision to work without a test environment

The original brief made Stripe test clocks non-negotiable before merge. That is now off the
table, so this records what I will still do, and what genuinely goes untested.

**Still done, at no cost and needing no database:**

- All cooling-off and renewal date arithmetic as pure functions, unit tested. This covers the
  UTC computation, the locale display, and the BST/GMT transition including the 26 October
  renewal case the brief asked for.
- Webhook idempotency and out-of-order delivery, using the mocked-Stripe pattern already
  established in `__tests__/api/stripe/webhook.test.ts`.
- The cancel-flow click-depth assertion.
- Notice scheduling logic, tested as a pure function over a subscription shape rather than
  against live data.

**Genuinely untested until an environment exists:** end-to-end trial conversion, renewal, price
change and cooling-off expiry against an advancing clock, and the reconciliation job against a
dropped webhook.

**The one that carries real risk is the refund path in phase 4**, because it moves money on a
live account. An untested refund path can refund the wrong amount, or twice. Mitigations I will
apply rather than skipping the phase:

- Mandatory idempotency key derived from charge id plus window, so a retry cannot double-refund.
- A hard maximum refund amount asserted against the original charge before calling Stripe.
- Refunds behind a kill switch, off by default, enabled only after a manual smoke test.
- First live refund performed manually by Matt from the Stripe dashboard, with the code path
  observing and reconciling, before it is allowed to initiate one.

**Migrations** will be additive only: new tables, no alterations to existing tables, no drops,
no backfills that rewrite existing rows. That keeps an untested migration low risk. If any
phase turns out to need a change to an existing table, I will flag it rather than apply it
silently.

Worth knowing, since the objection was cost: a throwaway local database via the Supabase CLI is
free and needs no second paid project. If that is acceptable later, the end-to-end gaps above
close without changing the budget.

### Sequencing note

You gave the ordering and I have kept it. One deviation to flag: workstream 6's tables cannot
all wait until phase 6, because phase 1 needs `cancellation_events` and phase 3 needs
`subscription_notices` on the day they are built. I am creating each evidence table in the
phase that first writes to it, with the append-only grants applied at creation, and leaving
phase 6 to add the enforcement sweep, the deletion-path exclusion and the admin view. If you
would rather see all three tables land up front as a single schema commit, say so.

The other thing worth saying plainly: phase 5 is an hour, it has the earlier deadline, and it
blocks nothing. Consider merging it out of order.

---

## 5. Summary of Stripe dashboard changes

All against production, **`acct_1T42edJvOfVErgzb`, live mode**, verified 11 August 2026.

| # | Object | Setting | Current | Required | Phase |
|---|---|---|---|---|---|
| 1 | Billing portal | Configuration | **none exists** | **Create one.** Cancellation on, `mode: at_period_end`, `proration_behavior: none`, **cancellation reason OFF**, pause off | 1 |
| 2 | Same, once created | `default_return_url` | n/a | `https://vitrinecms.com/dashboard/plan` | 1 |
| 3 | Same | `terms_of_service_url` | n/a | `https://vitrinecms.com/terms` | 1 |
| 4 | Same | `privacy_policy_url` | n/a | `https://vitrinecms.com/privacy` | 1 |
| 5 | Same | `subscription_update` | n/a | If price switching is enabled, restrict it to the three current prices only, never the 2026-02-28 GBP-only ones | 1 |
| 6 | Endpoint `we_1TRDpNJvOfVErgzbJcbyLGYN` | Enabled events | 16, see 1.5 | add `invoice.upcoming`, `customer.subscription.trial_will_end`, `price.updated` | 3 |
| 7 | All three prices | `tax_behavior` | `unspecified` | unchanged for now; set `inclusive` on VAT registration | later |
| 8 | Product `prod_UQ3zdgNuW3wmkT` | Description | said "spectrum compliance tools" | **done 11 Aug 2026**, now "full documentation registers" | 5 |
| 9 | Prices `price_1T5v2j…`, `price_1T5v3W…`, `price_1T5v5e…` | `active` | `true`, GBP-only, superseded | set `active: false` | 5 |
| 10 | Price `price_1TRDrQJvOfVErgzbVIu90WnQ` | `recurring.trial_period_days` | `30` | clear it; ignored by Checkout but a trap later. See 1.2 | 5 |

Item 1 is the important one and it is not a tweak: **the customer portal has never been
configured on the production account**, so the only cancellation path in the product is
currently broken. Everything else on this list is tidying by comparison.

---

## 6. What I need before writing code

**Nothing is blocking.** Q1, Q9 and Q12 are answered, and production Stripe access is granted
and verified. Phase 0 and phase 1 can begin.

Two items that need Matt rather than me, neither of which blocks the start of work:

1. **Creating the production billing portal configuration** (section 5, item 1). I can do this
   through the connector if you want me to, but it is a customer-facing configuration on a live
   account and I would rather you either do it or explicitly tell me to. It is not needed until
   phase 1 ships.
2. **Confirming what `acct_1T42eoF1q447WCoN` ("Composition") is for.** If it is the sandbox it
   appears to be, it should be used as the test-mode target for anything that needs one, which
   partially recovers the test-clock capability given up under Q12. If it is something else,
   say so.

Deferred until VAT registration: setting `tax_behavior` to `inclusive` and flipping
`VAT_REGISTERED`. One line and one Stripe setting, recorded in section 5 item 7.

One thing worth doing regardless of the answers: **phase 5 is an hour of work, has the earlier
deadline (autumn, not January), blocks nothing, and depends on none of the above.** The pricing
audit came back clean, so it is a policy document plus one Stripe product description fix. If
you want something merged this week, it is that.
