/**
 * Billing compliance configuration.
 *
 * Single place for the switches that govern DMCCA subscription behaviour, so
 * that changing policy is a one-line edit rather than a hunt through routes.
 * See docs/dmcca-subscription-compliance.md.
 */

/**
 * Length of every cooling-off window, in days.
 *
 * The statute gives 14 days from the start of a contract, from a trial
 * converting to paid, and from the auto-renewal of a contract with a term of
 * 12 months or longer. Vitrine grants all three, and extends the third to
 * monthly renewals as well. That is broader than required. It costs a small
 * amount of refund exposure on a monthly price and removes an entire class of
 * "which window applies here" edge case.
 */
export const COOLING_OFF_DAYS = 14

/**
 * How much to refund when a customer cancels inside a cooling-off window.
 *
 * 'pro_rata' deducts the value of the service already supplied since the
 * charge, which is what the regulations permit. 'full' refunds the whole
 * charge regardless. Kept behind this constant so the policy can be softened
 * without a code change.
 */
export const COOLING_OFF_REFUND_MODE: 'pro_rata' | 'full' = 'pro_rata'

/**
 * Whether Composition Limited is registered for VAT.
 *
 * While false, no price anywhere may be described as including VAT. Claiming
 * to charge tax that is not collected is an offence in itself, so this is a
 * hard gate rather than a display preference.
 *
 * The decision taken is that the headline price does not move on registration:
 * £79 stays £79 and the VAT is absorbed. So flipping this to true makes the
 * displayed price VAT-inclusive. Doing so also requires setting tax_behavior
 * to 'inclusive' on the three Stripe prices. Neither is reversible without a
 * customer-visible change, so do not flip it speculatively.
 */
export const VAT_REGISTERED = false

/**
 * Reason a cooling-off window opened. Persisted on the subscription record so
 * that a notice or a refund can state which right is being exercised.
 */
export type CoolingOffReason = 'initial' | 'trial_conversion' | 'renewal'
