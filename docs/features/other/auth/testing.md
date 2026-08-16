# Auth — E2E tests

Two full-stack E2E tests. Both drive `frontend-2` (Playwright) against the real API + real Postgres,
using a real Clerk testing token — never a fake verifier. DB asserts name the tables from the data
model.

## 1. Access control (`/cms`)

1. **Signed out** — open `/cms`.
   - UI: redirected to authenticate; not into the CMS.
2. **Signed in, not onboarded** — a Clerk user with no org.
   - UI: routed to onboarding, not `/cms` (`/me` returns `tenant: null`).
3. **Signed in, onboarded** — a Clerk user whose org maps to an active tenant.
   - UI: lands in `/cms`; the Clerk profile icon shows; a read operation (the page list) renders
     data.
   - DB: `tenants` (`clerk_org_id`) and `tenant_memberships` (`owner`) are populated; the page list
     reads `website_pages` for that `tenant_id`.

## 2. Org created without re-entering the name

1. **Authenticated, no org, onboarding details present** — a user who already gave their business
   name in onboarding.
   - Action: the system creates the Clerk org **programmatically from the known name**; the user is
     not asked to type the name again.
   - UI: `/me` transitions from `tenant: null` to the tenant; the user proceeds without a
     re-entry step.
   - DB: `tenants` (`clerk_org_id`, `slug`) and `tenant_memberships` (`owner`) are written, reusing
     the onboarding profile's name.
