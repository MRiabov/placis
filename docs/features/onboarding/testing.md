# Onboarding — E2E test

One full-stack E2E: find → review → client interview → select and copy the
website template → website preview → website activation. Drives `frontend-2`
(Playwright) against the real API + real Postgres; Google Maps / company
registry / Facebook / crawl and the LLM are faked. DB asserts use
[persistence.md](persistence.md) and [details](../business-profile/details/persistence.md).

1. **Find** — country, registry and/or Google Maps, online research consent,
   business lookup.
   - UI: `/onboarding/find` → Review.
   - DB: `tenants` (`status=unactivated`, `country` from Find);
     `onboarding_sessions` (`status=client_interviewing`, token,
     `online_research_consent_at`, `tenant_id` set);
     `business_profiles.tenant_id` matches the onboarding session.

2. **Review** — found vs missing; Continue to client interview.
   - UI: `/onboarding/review`.
   - DB: checklist rows from 01/02 (`filled_by_research` appearing as each
     extract chunk transforms, Details before scrape finishes).

3. **Client interview** — fill the gaps (text path in this E2E so it does not
   depend on a live voice service); submit. Reload mid-interview: lands on
   `/onboarding/interview` with autosaved answers, extra notes, and last
   `update_interview_plan` still present.
   - DB: `client_interview_submissions`; `business_profile_edits` with
     `created_by=text`; `onboarding_sessions.interview_plan_*` when voice
     `update_interview_plan` ran. If Maps Details fakes include a review usable
     as a Project, the client interview shows Project cards; Archive uses the
     onboarding-session route. While 02 is still running, reviews / photos /
     Projects / empty Details controls appear on `/onboarding/interview`
     without reload; a field they already typed is not rewritten.

4. **Business research** (faked, overlapping 2–3) — SSE progress.
   - DB: `etl.runs` → fetch rows + `etl.google_maps_listings` when a place was
     selected.

5. **Select and copy the website template + website preview** —
   `/onboarding/preview` SSE carousel, then `/onboarding/preview-and-edit/`
   (home website page copy done or wait cap; other website pages may still
   be generating).
   - DB: `website_settings` (`website_template_id`, `preset_id`);
     unpublished `website_pages` / `website_sections` (including look
     sections) / tokenized `website_slots`; derived `website.menus`;
     onboarding session `preview_and_edit` at wait-end. Schema `jobs`: 06
     River job on `tenant_id`. `website_prefix` is **not** required
     until share or 09. Zero `website_publications` until 08/09.
   - UI: live unpublished canvas. Assistant prompt → PATCH → pay is
     [assistant testing](../assistant/testing.md) (onboarding website editor).

6. **Automatic website copy generation** (faked LLM tools, overlapping DAG
   06–09) — website slots/SEO update; tokens preserved; no `update_reviews`.
   Worker internal website page render on turn 1 and after `update_slot`
   (faked).
   - DB: targeted `website_slots.origin=website_copy_generation`;
     `ai_generations` (`thread_kind=website_copy_generation`, `input` /
     `internal_reasoning` / `output` / `tool_calls`); no `create_page`;
     no `update_reviews`; zero `website_publications` from 06. 08 share
     is optional.
   - Failure: unpublished website from 05 still opens the website preview and
     can be activated.

7. **Website activation** — pay on the website preview (Clerk testing token +
   Stripe test
   webhook). First payer wins. Prior 08 share is not required.
   - DB: `website_activations`, `stripe_events`; **same** `tenant_id` as
     business lookup, now `tenants.status=active`, `tenant_memberships.owner`;
     onboarding session `activated`; unpaid `ai.threads`
     `thread_kind=cms_assistant` `current` completed; `website_publications`
     live (`published_by=onboarding`, strip off, `website_manifest`
     still tokenized); leftover 06 still in schema `jobs` if in flight;
     live R2 without strip (first write if they never shared).
   - UI: lands in `/cms/website`. `/onboarding/preview-and-edit/` redirects
     there.

8. **Isolation** — a second onboarding session (second unactivated tenant).
   - Assert: the first tenant's profile and website pages are not readable under
     the second tenant (before or after activation).
