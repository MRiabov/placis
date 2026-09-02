# Onboarding — E2E test

One full-stack E2E: find → review → client interview → select and copy the
website template → website preview → website activation. Guide Voice is a
**separate** full-stack E2E in [assistant testing](../assistant/testing.md)
`### Onboarding` (`assistant_conversation_items`, `assistant_runs`,
`ai.threads` `thread_kind=onboarding_assistant`). Do not include it in
this journey. DB asserts use [persistence.md](persistence.md) and
[details](../business-profile/details/persistence.md).

## E2E

### Find through website activation

#### Setup

Playwright drives `frontend-2` against the real API + real Postgres.
Google Maps / company registry / Facebook / crawl and the LLM are faked.
Worker **container** is up when 03/04 run (no `wrangler deploy`). No
Clerk sign-in until website activation.

#### Invoke

1. **Find** — country, registry and/or Google Maps, online research
   consent, business lookup (`POST /v1/onboarding/business-lookup`).
   UI: `/onboarding/find` → Review.
2. **Review** — found vs missing; Continue to client interview. UI:
   `/onboarding/review`.
3. **Client interview** — fill the gaps (text path in this E2E so it
   does not depend on a live voice service); Continue
   (`POST /v1/onboarding/interview/complete`). Reload mid-interview:
   lands on `/onboarding/interview` with click-off saved answers and
   extra notes. If Maps Details fakes include a review usable as a
   Project, the client interview shows Project cards; Archive uses
   `POST /v1/onboarding/projects/{projectId}/archive`. While 02 is still
   running, reviews / photos / Projects / empty Details controls appear
   on `/onboarding/interview` without reload; a field they already typed
   is not rewritten.
4. **Business research** (faked, overlapping 2–3) — SSE
   (`GET /v1/onboarding/events/stream`).
5. **Select and copy the website template + website preview** —
   `/onboarding/preview` SSE carousel, then
   `/onboarding/preview-and-edit/` (home website page copy done or wait
   cap; other website pages may still be generating). UI: live
   unpublished canvas. Assistant prompt → PATCH → pay is
   [assistant testing](../assistant/testing.md)
   `### Onboarding website editor`.
6. **Automatic website copy generation** (overlapping DAG 06–09) —
   website slots/SEO update; tokens preserved; no `update_reviews`.
   Real Worker `websiteRender` on turn 1 and after `update_slot`
   (website image render; unpublished slots still tokens). Zero
   `website_publications` / R2 from 03. 08 share is optional.
7. **Website activation** — pay on the website preview (Clerk testing
   token + Stripe test webhook). First payer wins. Prior 08 share is
   not required. Checkout: `POST /v1/onboarding/activation/checkout`.
   UI: lands in `/cms/website`. `/onboarding/preview-and-edit/`
   redirects there.

#### Assert

1. **Find** — `tenants` (`status=unactivated`, `country` from Find);
   `onboarding_sessions` (`status=client_interviewing`, token,
   `online_research_consent_at`, `tenant_id` set);
   `business_profiles.tenant_id` matches the onboarding session.
2. **Review** — live business profile fill from 01/02
   (`filled_by_research` appearing as each extract chunk transforms,
   Details before scrape finishes). No `checklist_rows` table.
3. **Client interview** — `client_interview_submissions`;
   `business_profile_edits` with `created_by=text`. After Details
   reviews land: schema `jobs` has `reviews_ranking_for_display` on
   this `tenant_id`.
4. **Business research** — `etl.runs` → fetch rows +
   `etl.google_maps_listings` when a place was selected.
5. **Select and copy** — `website_settings` (`website_template_id`,
   `preset_id`); no `website_template_picker` thread; unpublished
   `website_pages` (including `page_type=about`) / `website_sections`
   (including look sections) / tokenized `website_slots`; derived
   `website.menus`; onboarding session `preview_and_edit` at wait-end.
   Schema `jobs`: `website_copy_generation` on `tenant_id`.
   `website_prefix` is **not** required until share or 09. Zero
   `website_publications` until 08/09.
6. **Automatic website copy generation** — targeted
   `website_slots.origin=website_copy_generation`; `ai_generations`
   (`thread_kind=website_copy_generation`,
   `prompt_id=website_copy_generation`, `input` /
   `internal_reasoning` / `output` / `tool_calls`); no `create_page`;
   no `update_reviews`; zero `website_publications` from 06.
7. **Website activation** — `website_activations`, `stripe_events`;
   **same** `tenant_id` as business lookup, now `tenants.status=active`,
   `tenant_memberships.owner`; onboarding session `activated`; unpaid
   `ai.threads` `thread_kind=cms_assistant` `current` completed;
   `website_publications` live (`published_by=onboarding`, strip off,
   `website_manifest` still tokenized); leftover
   `website_copy_generation` still in schema `jobs` if in flight; live
   R2 without strip (first write if they never shared).

#### Fail

Unpublished website from 05 still opens the website preview and can be
activated.

#### Mocked

Google Maps, company registry, Facebook, crawl, LLM. Stripe test
webhook. Worker is real (container). R2 / `purge_cache` faked.

## Integration

### Two-tenant isolation

#### Setup

Two onboarding sessions (second unactivated tenant) via `humatest` +
real Postgres. No Playwright. No `frontend-2`.

#### Invoke

Read the first tenant's profile and website pages as the second tenant,
before and after the first tenant's website activation.

#### Assert

The first tenant's profile and website pages are not readable under the
second tenant. First tenant's `business_profiles` / `website_pages`
unchanged.
