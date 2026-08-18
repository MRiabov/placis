# Onboarding — E2E test

One full-stack E2E: find → review → interview → generate → preview → claim. Drives `frontend-2`
(Playwright) against the real API + real Postgres; research providers and the LLM are faked. DB
asserts use [data-model.md](data-model.md) and [details](../other/details/data-model.md).

1. **Find** — country, registry and/or Google Maps, consent, Confirm.
   - UI: `/onboarding/find` → Review.
   - DB: `onboarding_sessions` (`status=interviewing`, token, `consent_given_at`, no tenant yet).

2. **Review** — found vs missing; Continue to interview.
   - UI: `/onboarding/review`.
   - DB: checklist rows from 01a/02a (`filled_by_source` appearing as research fakes complete).

3. **Interview** — fill the gaps (text path in this E2E so it does not depend on a live voice
   provider); submit.
   - DB: `text_interview_submissions`; profile version `created_by=text`.

4. **Research** (faked, overlapping 2–3) — SSE progress.
   - DB: `research_runs` → `research_sources` + `google_places_cache` when a place was selected.

5. **Generate + preview** — `/onboarding/preview`, then View website as soon as the package
   exists (do not wait for copy).
   - DB: draft `website_pages` / sections / slots; `preview_packages` (`token_hash`, `status=active`);
     session `previewing`. Copy-generation job may still be running.
   - UI: public preview renders the current draft.

6. **Copy generation** (faked LLM tools, overlapping 5–7) — slots/SEO update; tokens preserved.
   - DB: `ai_generations` for the tool batches; no `create_page`; no `website_publications`.
   - Failure: instantiated draft still previewable and claimable.

7. **Claim** — pay on the preview page (Clerk testing token + Stripe test webhook).
   - DB: `preview_claims`, `stripe_events`, `tenants.status=active`, `tenant_memberships.owner`,
     `tenant_domains`; session `claimed`; **no** `website_publications`.
   - UI: lands in `/cms/website`.

8. **Isolation** — a second session.
   - Assert: the first tenant's profile and pages are not readable under the second tenant.
