# 07 — Claim

The contractor pays; the tenant activates but the site stays a **draft** until they publish.

- **Persists** `preview_claims` (`clerk_subject`, `checkout_session_id`, `payment_state`,
  `activated_at`); activates `tenants`, writes `tenant_memberships` (`owner`). Does **not** write
  `website_publications`.
