# Testing

## The rule

At least **one E2E test per major feature**. E2E means everything real except external/paid
providers: Postgres is real (Testcontainers), migrations run, and all our code is real — HTTP
handler, service, sqlc queries, validation. Only external/paid providers are faked (LLM, research,
voice). A feature does not pass without its E2E test green.

## Per-feature E2E tests

### 1. Tenancy & auth

**Scenario**: sign in with a real Clerk **testing token** → `GET /api/v1/me` (real
`clerk.Session.Verify` against Clerk's test JWKS) → `POST /api/v1/me/organization` (real
`Organizations().Create` on a Clerk test instance) → `GET /api/v1/me` now returns the tenant.

**Real**: Postgres, all auth/tenancy code, the Clerk SDK against a Clerk **test** instance (testing
tokens + test keys — free, not a paid provider). No fake verifier.

**Acceptance**: a second org yields a second tenant; each request resolves its own tenant and a
cross-tenant read is blocked.

### 2. Onboarding

**Scenario**: start onboarding from a Google Maps listing or registry record → answer the interview
→ research runs (faked providers) → a versioned business profile is built → a website draft is
generated.

**Real**: Postgres, onboarding/research/profile/generation code.

**Faked**: research providers (Google Places, registry, Facebook, website crawl), LLM.

**Acceptance**: the profile keeps its history and each detail records where it came from; the
website draft exists.

### 3. Website (CMS)

**Scenario**: from a business profile + blueprint, generate pages and sections → edit a slot and
swap an image → validate against the component contract → publish → the public manifest resolves.

**Real**: Postgres, CMS code, the component JSON Schemas.

**Faked**: LLM refinement.

**Acceptance**: the published manifest resolves; rollback reactivates an earlier version.

### 4. Preview & claim / billing

**Scenario**: create a signed preview package → claim → Stripe checkout (test mode) → a
`checkout.session.completed` webhook is delivered → the tenant activates and the CMS rebuilds and
publishes.

**Real**: Postgres, preview/claim/activation code, the Stripe SDK webhook verification against a
test webhook secret.

**Faked**: the checkout charge itself (Stripe test mode — no real money).

**Acceptance**: replaying the same webhook does not activate twice (safe to replay).

### 5. Ads

**Scenario**: from the profile + approved media, create an ad creative set → AI proposes copy and
images (faked LLM) → the owner edits and approves → the package is exported.

**Real**: Postgres, ads code.

**Faked**: LLM; no posting.

**Acceptance**: the export is deterministic, and `ready to post` is blocked by a missing caption or
an unapproved asset.

### 6. Leads

**Scenario**: a public form submits → a `leads` row is persisted under the right tenant.

**Real**: Postgres, public-form/lead code.

**Faked**: nothing.

**Acceptance**: the lead is stored with tenant scope and appears for attribution.

## Notes

- **Clerk** is the one external dependency that is *not* faked: it has real testing tokens (signed
  with a test key, verifiable against the test JWKS). Use them through the real SDK — never a fake
  verifier. It is fiddly to set up once, then reusable everywhere.
- **Stripe** uses test mode the same way: real SDK + test keys, no real charge.
- Provider fakes live in the repo (see `ci-cd.md`); tests never spend money or reach production
  providers.
