# Pricing claims policy

Standing rules for how Vitrine may and may not describe its prices. Check any new pricing
copy against this before it ships, wherever it appears: the marketing site, the pricing page,
in-app upgrade screens, email, Instagram, ads, and Stripe product descriptions.

## Why this exists

The government announced in August 2026 a consultation, opening autumn 2026, on banning
misleading pricing practices: fake "was" prices, invented discounts, and misleading
recommended retail prices. That is a consultation rather than law, so nothing here is
currently a legal requirement.

The rules are written down anyway, for two reasons. Vitrine's pricing copy is clean today, and
the cheapest moment to adopt a standard is before there is anything to unwind. And an annual
tier is the most likely future source of a saving claim, so the rule needs to exist before the
tier does.

Audited 11 August 2026 across `app/`, `components/`, `content/`, `lib/` and `public/`: no
struck-through prices, no RRP anchors, no countdown timers, no limited-time framing. The only
`line-through` styling in the codebase is UI state for completed tasks and cancelled accounts.

## The rules

### 1. A "was" price must be a price we actually charged

A struck-through or "was" price may only be shown if that price was genuinely charged, to
ordinary customers, for a sustained period immediately before the reduction. If it was charged
briefly, to nobody, or only to set up the comparison, it may not be shown at all.

If in doubt, do not show it. A lower price stands on its own.

### 2. Annual versus monthly comparisons are fine, if the arithmetic is honest

Both prices genuinely exist, so comparing them is a real comparison rather than an invented
one. The saving must be calculated from the two real prices and stated accurately.

State it as what it is. "£790 a year, which works out at £65.83 a month instead of £79" is
fine. "Save 17%" is fine if the sum is right. "Was £948" is not, because nobody was ever
charged £948.

### 3. No invented anchors

No recommended retail price, no "worth £X", no comparison to a competitor's price, and no
"normally £X" unless £X is a price we normally charge. Do not price against what a museum
might otherwise spend on consultants, software, or staff time, as though that were a discount.

### 4. No countdown timers, and no deadline that moves

No timer counting down to an offer expiring. If an offer genuinely ends on a date, it ends on
that date and is not reoffered on the same terms shortly afterwards. A deadline that resets is
the specific practice the consultation is aimed at.

### 5. No "limited time" framing on permanent pricing

Current prices are the prices. They are not an introductory rate, not a launch offer, and not
available for a limited period, so they must not be described that way.

### 6. Introductory and discounted prices must show the whole picture

Where a discount or introductory price genuinely applies, the discounted price, how long it
lasts, and the price that applies afterwards must all appear in the same visual block. Not in
a footnote, not behind a tooltip, not on the terms page.

This is a DMCCA pre-contract information requirement as well as a fair-trading one, so it is
not optional once an introductory price exists.

### 7. The non-profit discount is a real offer and may be described as one

It is genuinely available, through the enterprise contact form, and is not time-limited or
conditional on acting quickly. Describe it plainly and do not attach urgency to it.

### 8. If a save offer is ever added to the cancellation flow

None exists today and none is planned. If one is ever introduced it gets exactly one screen
with exactly one offer, and the control that continues to cancellation keeps equal visual
weight with the control that accepts: same size, same shape, same contrast. No text link next
to a filled button, and no copy that shames the customer for leaving.

Enforced by `__tests__/lib/cancelClickDepth.test.ts`, which fails if the two controls diverge
or if offer language appears in the cancel flow.

## Where prices appear

Anyone changing pricing copy should check all of these, not just the pricing page:

- `lib/planPricing.ts`, the GBP base prices and the FX snapshot
- `lib/plans.ts`, the feature matrix and per-tier copy
- `app/plans/`, `app/faq/`, the public pricing and questions
- `app/dashboard/plan/`, the in-app upgrade screen
- `content/`, blog and marketing copy
- **Stripe product descriptions**, which appear on the hosted checkout page and on invoices,
  and which no search of this repository will ever find. They are edited in the Stripe
  dashboard. A stale claim survived there for months after being removed from the codebase.

## Related

Pre-contract information requirements, including how a price must be presented before a
customer is bound, are in [dmcca-subscription-compliance.md](dmcca-subscription-compliance.md).
