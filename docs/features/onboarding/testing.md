# Onboarding — E2E test

One full-stack E2E: find → review → client interview → apply the website
template → website preview → website activation. Drives `frontend-2`
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
     onboarding-session route.

4. **Business research** (faked, overlapping 2–3) — SSE progress.
   - DB: `etl.runs` → fetch rows + `etl.google_maps_listings` when a place was
     selected.

5. **Apply the website template + website preview** — `/onboarding/preview` SSE
   carousel, then navigate to the preview website address when 07 has written
   `latest/` (copy done or ~15s cap).
   - DB: unpublished `website_pages` / website sections / website slots;
     `tenants.website_prefix`; `website_addresses` (`type=subdomain`);
     `website_publications` v1 (`published_by=onboarding`, strip on); onboarding
     session `previewing`. Copy-generation job may still be running.
   - UI: host is static R2 HTML with the website-activation island.

6. **Website copy generation** (faked LLM tools, overlapping DAG 06–08) —
   website slots/SEO update; tokens preserved.
   - DB: `ai_generations` for the tool batches; no `create_page`. 07 already
     wrote v1; 06 does not add another website publication.
   - Failure: unpublished website from 05 still gets 07 (cap) and can be
     activated.

7. **Website activation** — pay on the host (Clerk testing token + Stripe test
   webhook). First payer wins.
   - DB: `website_activations`, `stripe_events`; **same** `tenant_id` as
     business lookup, now `tenants.status=active`, `tenant_memberships.owner`;
     onboarding session `activated`; `website_publications` v2 strip off, v1
     archived (neither is a website-rollback target).
   - UI: lands in `/cms/website`. Host stays up without the strip.
   - Optional: open the preview website address in a clean storage (no
     `localStorage`) and still pay.

8. **Isolation** — a second onboarding session (second unactivated tenant).
   - Assert: the first tenant's profile and website pages are not readable under
     the second tenant (before or after activation).
