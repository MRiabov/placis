# Auth — E2E tests

Two full-stack E2E tests. Both drive `frontend-2` (Playwright) against the real
API + real Postgres, using a real Clerk testing token — never a fake verifier.
DB asserts name the tables from
[persistence.md](persistence.md).

## 1. Access control (`/cms`)

1. **Before sign-in** — open `/cms`.
   - UI: redirected to authenticate; not into the CMS.
2. **After sign-in, not activated** — a contractor with a Clerk organization
   attached to an unactivated tenant (or no org yet).
   - UI: routed to onboarding or `/onboarding/preview-and-edit/` if already
     there, not `/cms`. `/me.tenant` may be `null` (no org) or `TenantRead`
     `status=unactivated`. CMS keys off `status === "active"`. If this browser
     has a stored onboarding session token, restore that onboarding session
     (do not start Find from scratch). Clerk does not list incomplete
     onboarding sessions.
3. **After sign-in, activated** — a contractor whose Clerk organization maps to
   an **active** tenant.
   - UI: lands in `/cms`; the Clerk profile icon shows; a read operation (the
     website page list) renders data.
   - DB: `tenants` (`clerk_org_id`, `status=active`) and `tenant_memberships`
     (`owner`) are populated; the website page list reads `website_pages` for
     that `tenant_id`.

## 2. Clerk organization created without re-entering the name

1. **Authenticated, no Clerk organization, onboarding details present** — a
   contractor who already confirmed onboarding (unactivated tenant + business
   name on the profile).
   - Action: website activation creates the Clerk organization
     **programmatically from the known name** and **upgrades** that unactivated
     tenant; the contractor is not asked to type the name again.
   - UI: `/me` returns `TenantRead` `status=unactivated` after
     `POST /v1/me/clerk-organization`; CMS stays closed. After 09 it returns
     the **same** tenant id with `status=active`.
   - DB: the existing `tenants` row gets `clerk_org_id` and `status=active`;
     `tenant_memberships` (`owner`) is written; no second tenant row.

## 3. Two-tenant isolation

1. **Two activated tenants** — create tenant A and tenant B (separate Clerk
   organizations, separate `tenant_id`s), each with at least one website page
   and one file.
2. **As tenant A**, read/write website pages and files that belong to B.
   - API: 404 or forbidden; never B's rows.
   - DB: A's queries include `tenant_id = A`; B's `website_pages` and `files`
     rows are unchanged.
3. Repeat as tenant B against A's rows. Same block.
