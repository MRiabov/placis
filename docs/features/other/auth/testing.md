# Auth — E2E test

One full-stack E2E when Clerk lands. DB asserts name the tables from
[persistence.md](persistence.md). Public 1:1 is Go `TestHappyPathV1Me`
for `GET /v1/me` (leftover until that func exists). Auth has no pipeline
(`TestPipelineHappyPathAuth*` does not exist).

## E2E

### Login through CMS-open

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against the
real API + real Postgres. Real Clerk Testing Token: generate **one**
once per PR job (`clerkSetup()` or
`npx clerk api testing_tokens -X POST` / Backend API). Put
`CLERK_TESTING_TOKEN` in that job env and reuse it. Needs
`CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` as job secrets. Testing
Tokens bypass bot detection (`__clerk_testing_token` on the Frontend
API). They are **not** Go `Sessions().Verify`. Do not create a token per
spec or worker (Backend testing-token create is rate-limited: **2
requests per second**). Signed-in Playwright: `storageState` **once per
job**, then `test.use({ storageState })`. Do **not** restore
`storageState` / cookies across jobs
([ci-cd.md](../../../general-architecture/ci-cd.md)). Clerk-hitting
specs: serial project `workers: 1`. Official: `clerkSetup()` once when
the suite starts, then `setupClerkTestingToken` on each Playwright page
that hits Clerk UI. Parity / look renders may pin empty
`VITE_CLERK_PUBLISHABLE_KEY` (no-auth). That is not this E2E.

#### Exercise

1. **Sign in** — OAuth modal (Sign in with Google, no name fields, no
   OrgProvisionStep). Programmatic `founder_name` / business org.
2. **Checkout** — `POST /v1/onboarding/activation/checkout`. Frontend
   `setActive` from checkout `clerk_org_id` or `MeRead.clerk_org_id` if
   the Clerk session has no org yet. Skip if `orgId` already set.
3. **CMS-open** — after 09, `/cms` opens.

#### Verify

1. **Sign in** — Don't say organization: chooser does **not** appear.
2. **Checkout** — `tenants.clerk_org_id` set; `status` still
   `unactivated` until 09.
3. **CMS-open** — `/cms` because `status=active`, not tenant non-null.
   DB: `auth.tenants`, `auth.tenant_memberships` (`role=owner`). No
   second tenant row.

#### Mocked

Stripe test webhook. Clerk is real.

## Integration

### GetMe through activation

Backend flow. Does not replace the 1:1 row (`TestHappyPathV1Me`).

#### Setup

Backend (`humatest`, Testcontainers Postgres). SDK-boundary double
(programmed `Principal`; does not decode JWTs). Prefer fake Clerk. No
Playwright. No Worker.

#### Exercise

1. **No bind** — `GET /v1/me`.
2. **Bind** — first Clerk-gated request **calls**
   `BindClerkUserToOnboardingSession` / `CreateClerkUser` from
   `founder_name`. Then `GET /v1/me`.
3. **Checkout** — `POST /v1/onboarding/activation/checkout` **calls**
   `AttachClerkOrganization`. Then `GET /v1/me` with JWT **without** org
   claim (no `setActive` yet; no `tenant_memberships` row yet).
4. **09** — River job kind `website_activation` **calls**
   `InsertOwnerMembership` then `status=active`. Then `GET /v1/me`.

#### Verify

1. **No bind** — `tenant: null`, `clerk_org_id` null.
2. **Bind** — `onboarding_sessions.clerk_user_id` set. Unactivated
   `TenantRead`; `clerk_org_id` null.
3. **Checkout** — `tenants.clerk_org_id` set; `status` still
   `unactivated`. `MeRead.clerk_org_id` is that column. No
   `tenant_memberships` row.
4. **09** — `status=active`, `auth.tenant_memberships` (`role=owner`),
   `clerk_org_id` set. No second tenant row.

#### Mocked

Clerk SDK-boundary `Principal`.

### HappyPathAuthFull

Frontend. Vitest `HappyPathAuthFull`. Not OpenAPI 1:1.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go).

#### Exercise

Signed-out `/cms` → `/login`. MSW `GET /v1/me`: null tenant →
onboarding; unactivated tenant → CMS closed; `clerk_org_id` with
`orgId` unset → `setActive`; `status=active` → `/cms`. No chooser /
OrgProvisionStep.

#### Verify

UI: `/login`, onboarding, CMS closed, then `/cms`. MSW saw
`GET /v1/me`. Postgres rows are the backend test.

#### Mocked

All HTTP via MSW.

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

#### Mocked

Clerk SDK-boundary `Principal`.
