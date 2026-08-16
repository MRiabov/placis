# Onboarding — E2E test

One full-stack E2E test: start → consent → interview → research → profile → website draft. Drives
`frontend-2` (Playwright) against the real API + real Postgres; research providers and the LLM are
faked. DB asserts name the tables from the data model.

1. **Start** — the user picks a country, finds their business (registry + optional Google Maps),
   checks the consent box.
   - UI: source panel → "Confirm and review".
   - DB: `onboarding_sessions` (source, channel=`text`, status=`created`, token, `consent_given_at`
     set).

2. **Interview** — the user answers the questions; answers autosave.
   - DB: `text_interview_submissions` (version, `payload` jsonb).

3. **Research** (faked) — runs in the background; the UI shows progress.
   - DB: `research_sessions` → `research_runs` → `research_events` → `research_sources` (kind,
     `external_id`, `source_ref`, `raw` + `normalized` jsonb, `confidence`) + `google_places_cache`.

4. **Review** — the user sees found-vs-missing; disagreements are shown side by side and they pick.
   - DB: `business_profiles` (trade, display_name, legal_name, contact, `company_number`,
     `vat_number`, `registered_office`), `business_profile_versions` (`details` + `source_refs` +
     `created_by`), `business_profile_services`, `business_profile_service_areas`,
     `business_profile_opening_hours`.
   - UI: the accepted profile is reflected (`current_version_id` points at the version).

5. **Generate website draft** — the UI shows a preview.
   - DB: `website_pages` (status=`draft`), `website_page_versions`, `website_sections`,
     `content_slots`.
   - UI: the draft preview renders from those rows.

6. **Isolation** — a second tenant's session.
   - Assert: the first tenant's profile and pages are not readable under the second tenant.
