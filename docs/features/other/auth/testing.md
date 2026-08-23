# Auth — E2E tests

Two full-stack E2E tests. Both drive `frontend-2` (Playwright) against the real API + real Postgres,
using a real Clerk testing token — never a fake verifier. DB asserts name the tables from
[data-model.md](data-model.md).

## 1. Access control (`/cms`)

1. **Before sign-in** — open `/cms`.
   - UI: redirected to authenticate; not into the CMS.
2. **After sign-in, not activated** — a contractor with no Clerk organization (an unactivated
   tenant may already exist from onboarding confirm).
   - UI: routed to onboarding, not `/cms` (`/me` returns `tenant: null`).
3. **After sign-in, activated** — a contractor whose Clerk organization maps to an **active** tenant.
   - UI: lands in `/cms`; the Clerk profile icon shows; a read operation (the website page list) renders
     data.
   - DB: `tenants` (`clerk_org_id`, `status=active`) and `tenant_memberships` (`owner`) are populated; the website page list
     reads `website_pages` for that `tenant_id`.

## 2. Clerk organization created without re-entering the name

1. **Authenticated, no Clerk organization, onboarding details present** — a contractor who already
   confirmed onboarding (unactivated tenant + business name on the profile).
   - Action: website activation creates the Clerk organization **programmatically from the known
     name** and **upgrades** that unactivated tenant; the contractor is not asked to type the name
     again.
   - UI: `/me` stays `tenant: null` until activation; then it returns the **same** tenant id.
   - DB: the existing `tenants` row gets `clerk_org_id` and `status=active`; `tenant_memberships`
     (`owner`) is written; no second tenant row.
