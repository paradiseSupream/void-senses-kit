# Checkout conversion fix

## Goal
Make every VIP CTA reliably reach a payable Whop checkout on mobile, and make failures visible in Admin analytics without breaking existing Pixel/CAPI deduplication.

## Changes
- Fix the $1.99 exit-offer plan mapping so the server no longer rejects it as an unsupported price.
- Route locked-result VIP CTAs through the existing one-tap checkout instead of reopening the multi-step plan modal.
- Add checkout-stage telemetry for tap, provider-session success/failure, navigation, embedded-checkout load, and hosted fallback.
- Make the hosted Whop checkout fallback immediately visible on mobile and automatically recover if the embedded checkout does not mount.
- Correct recurring monthly-plan wording so checkout claims match actual billing behavior.
- Preserve existing order creation, webhook fulfilment, Meta Pixel/CAPI event IDs, A/B tests, and lifetime pricing.

## Verification
- Test monthly $2.99, exit-offer $1.99, and lifetime paths without charging a card.
- Confirm checkout session creation, route navigation, embedded/fallback rendering, telemetry requests, and clean build/runtime logs.
