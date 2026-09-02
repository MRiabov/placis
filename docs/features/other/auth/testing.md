# Auth — E2E tests

Auth tenancy is humatest + real Postgres in default CI (SDK-boundary
test double for `Sessions().Verify`). Playwright + Clerk uses one
[Testing Token](https://clerk.com/docs/guides/development/testing/overview)
per PR job. Testing Tokens bypass bot detection
(`__clerk_testing_token` on the Frontend API). They are **not** Go
`Sessions().Verify`. Do not create a token per spec or worker (Backend
testing-token create is rate-limited: **2 requests per second**).
Parity / look renders may still pin empty `VITE_CLERK_PUBLISHABLE_KEY`
(no-auth). That is not the auth E2E.

DB asserts name the tables from [persistence.md](persistence.md).

1. **Humatest + real Postgres (CI).** SDK-boundary double (programmed
   `Principal`; does not decode JWTs).
   - `/me` with no bind → `tenant: null`.
   - Bind + `CreateClerkUser` from `founder_name` →
     `onboarding_sessions.clerk_user_id` set.
   - Checkout **calls** `AttachClerkOrganization` →
     `tenants.clerk_org_id` set; `status` still `unactivated`.
   - 09 **calls** `InsertOwnerMembership` then `status=active`.
   - DB: `auth.tenants`, `auth.tenant_memberships` (`role=owner`). No
     second tenant row.

2. **Two-tenant isolation (humatest).** Two programmed `Principal`s.
   Not two real Clerk orgs in Playwright. As tenant A, read/write
   website pages and files that belong to B → 404 or forbidden; B’s
   `website_pages` and `files` rows unchanged. Repeat as B against A.

3. **Frontend Vitest (CI).** `AuthGate.test.tsx`. Delete
   OrgProvisionStep tests. CMS-open is `status === "active"`.

4. **Playwright + Clerk (PR job).** Generate **one** Testing Token
   once per PR job (`clerkSetup()` or `npx clerk api testing_tokens
   -X POST` / Backend API). Put `CLERK_TESTING_TOKEN` in that job env
   and reuse it. Needs `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` as
   job secrets. Signed-in Playwright: `storageState` **once per job**,
   then `test.use({ storageState })`. Do **not** restore `storageState`
   / cookies across jobs
   ([ci-cd.md](../../../general-architecture/ci-cd.md)). Clerk-hitting
   specs: serial project `workers: 1`. Official: `clerkSetup()` once
   when the suite starts, then `setupClerkTestingToken` on each
   Playwright page that hits Clerk UI.
   - OAuth modal (Sign in with Google, no name fields).
   - Programmatic `founder_name` / business org.
   - Frontend `setActive` from checkout `clerk_org_id` or
     `pending_clerk_org_id`.
   - After 09, `/cms` opens (`status=active`).
   - DB: same `tenants` / `tenant_memberships` asserts as beat 1.
