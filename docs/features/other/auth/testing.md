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

## E2E

### Playwright + Clerk

#### Setup

E2E (Playwright + real Clerk testing token). Generate **one** Testing
Token once per PR job (`clerkSetup()` or
`npx clerk api testing_tokens -X POST` / Backend API). Put
`CLERK_TESTING_TOKEN` in that job env and reuse it. Needs
`CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` as job secrets. Signed-in
Playwright: `storageState` **once per job**, then
`test.use({ storageState })`. Do **not** restore `storageState` /
cookies across jobs
([ci-cd.md](../../../general-architecture/ci-cd.md)). Clerk-hitting
specs: serial project `workers: 1`. Official: `clerkSetup()` once when
the suite starts, then `setupClerkTestingToken` on each Playwright page
that hits Clerk UI.

#### Exercise

OAuth modal (Sign in with Google, no name fields). Programmatic
`founder_name` / business org. Frontend `setActive` from checkout
`clerk_org_id` or `MeRead.clerk_org_id` if the Clerk session has no org
yet. After 09, `/cms` opens.

#### Verify

`/cms` opens (`status=active`). DB: `tenants` / `tenant_memberships`
same asserts as Humatest + real Postgres.

## Integration

### Humatest + real Postgres

#### Setup

Backend (`humatest`, Testcontainers Postgres). SDK-boundary double
(programmed `Principal`; does not decode JWTs). Prefer fake Clerk. No
Playwright.

#### Exercise

`GET /v1/me` with no bind. Bind + `CreateClerkUser` from
`founder_name`. Checkout **calls** `AttachClerkOrganization`. 09
**calls** `InsertOwnerMembership` then `status=active`.

#### Verify

`GET /v1/me` with no bind → `tenant: null`. Bind →
`onboarding_sessions.clerk_user_id` set. Checkout →
`tenants.clerk_org_id` set; `status` still `unactivated`. After 09:
`auth.tenants`, `auth.tenant_memberships` (`role=owner`). No second
tenant row.

### Two-tenant isolation

#### Setup

Backend (`humatest`, Testcontainers Postgres). Two programmed
`Principal`s. Not two real Clerk orgs in Playwright.

#### Exercise

As tenant A, read/write website pages and files that belong to B.
Repeat as B against A. Method+path as in those Routes (website pages,
files).

#### Verify

404 or forbidden; B’s `website_pages` and `files` rows unchanged. Same
block the other way.
