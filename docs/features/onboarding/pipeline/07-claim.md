# 07 — Claim

The contractor pays; the tenant activates but the site stays a **draft** until they publish.

Stripe (via `stripe-go`) handles this checkout only. `checkout.session.completed` is accepted only
after the SDK verifies the signature (`webhook.ConstructEvent`) and the metadata matches;
activation can be replayed safely and is never triggered by a browser success URL alone.

- **Persists** `preview_claims` (`clerk_subject`, `checkout_session_id`, `payment_state`,
  `activated_at`); activates `tenants`, writes `tenant_memberships` (`owner`). Does **not** write
  `website_publications`.
