# Onboarding — E2E test

One full-stack E2E: find → review → client interview → apply the website template → website preview
→ website activation. Drives `frontend-2` (Playwright) against the real API + real
Postgres; Google Maps / company registry / Facebook / crawl and the LLM are faked. DB
asserts use [data-model.md](data-model.md) and [details](../other/details/data-model.md).

1. **Find** — country, registry and/or Google Maps, online research consent, Confirm.
   - UI: `/onboarding/find` → Review.
   - DB: `tenants` (`status=unactivated`); `onboarding_sessions` (`status=client_interviewing`, token,
     `online_research_consent_at`, `tenant_id` set); `business_profiles.tenant_id` matches the session.

2. **Review** — found vs missing; Continue to client interview.
   - UI: `/onboarding/review`.
   - DB: checklist rows from 01a/02a (`filled_by_source` appearing as business research fakes complete).

3. **Client interview** — fill the gaps (text path in this E2E so it does not depend on a live voice
   service); submit.
   - DB: `client_interview_submissions`; `business_profile_edits` with `created_by=text`.

4. **Business research** (faked, overlapping 2–3) — SSE progress.
   - DB: `business_research_runs` → `business_research_sources` + `google_maps_listings` when a place was selected.

5. **Apply the website template + website preview** — `/onboarding/preview`, then View website as soon as the website preview
   exists (do not wait for copy).
   - DB: unpublished `website_pages` / website sections / website slots; `website_previews` (`token_hash`, `status=active`);
     onboarding session `previewing`. Copy-generation job may still be running.
   - UI: website preview renders the current unpublished website.

6. **Website copy generation** (faked LLM tools, overlapping 5–7) — website slots/SEO update; tokens preserved.
   - DB: `ai_generations` for the tool batches; no `create_page`; no `website_publications`.
   - Failure: unpublished website from 04 still has a website preview and can be activated.

7. **Website activation** — pay on the website preview (Clerk testing token + Stripe test webhook).
   - DB: `website_activations`, `stripe_events`; **same** `tenant_id` as confirm, now `tenants.status=active`,
     `tenant_memberships.owner`, `website_addresses` (`type=subdomain`); onboarding session `activated`;
     **no** `website_publications`.
   - UI: lands in `/cms/website`.

8. **Isolation** — a second onboarding session (second unactivated tenant).
   - Assert: the first tenant's profile and website pages are not readable under the second tenant
     (before or after activation).
