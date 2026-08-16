# Testing

## The rule

At least **one E2E test per feature** — a "feature" is a directory under `docs/features/`
(`onboarding`, `website`, `ads`). E2E means everything real except external/paid providers:
Postgres is real (Testcontainers), migrations run, and all our code is real — HTTP handler,
service, sqlc queries, validation. Only external/paid providers are faked (LLM, research, voice). A
feature does not pass without its E2E test green.

Each E2E below spells out the exact tables read and written at every step, so the test asserts the
persisted state, not just an HTTP 200. Table/column names come from
[tenancy-auth-and-data-model.md](tenancy-auth-and-data-model.md).

Cross-cutting concerns are exercised *within* these three: tenancy/auth is the precondition of every
E2E (real Clerk testing token), claim/billing is the terminal step of onboarding, and leads is the
public-form step of website.

## Onboarding

**Precondition**: a tenant exists via a real Clerk testing token → `Sessions.Verify` → org → tenant
(`tenants` row with `clerk_org_id`); the request resolves a `Principal` with that `tenant_id`.

1. **Start** — `POST /api/v1/onboarding-sessions` with a Google Maps place.
   - Writes `onboarding_sessions`: `source=google_places`, `channel=text`, `status=created`,
     `token` (unique), `clerk_user_id=null`, `consent_given_at=null`.
   - Asserts one row, tenant-scoped, status `created`.

2. **Consent** — set the single acknowledgement.
   - Writes `onboarding_sessions.consent_given_at` (a timestamp).
   - Asserts `consent_given_at` is set.

3. **Interview** — submit the interview answers (display name, phone, trade, main services, service
   area, opening hours, photo choice, accreditations, notes).
   - Writes `text_interview_submissions` (version, `payload` jsonb).
   - Asserts one submission row linked to the session.

4. **Research** (faked providers return fixtures) — trigger the research run.
   - Writes `research_sessions` (status), `research_runs` (provider), `research_events`
     (event_type, payload), `research_sources` (kind, `external_id`, `source_ref`, `raw` +
     `normalized` jsonb, `confidence`), and `google_places_cache` (`place_id` → payload).
   - Asserts the `research_sources` rows are typed (`kind` in the enum) and carry a `source_ref`.

5. **Build profile** — normalize interview + research into the business profile.
   - Writes `business_profiles` (trade, display_name, legal_name, contact, `company_number`,
     `vat_number`, `registered_office`, …), `business_profile_versions` (`details` jsonb +
     `source_refs` + `created_by`), `business_profile_services`, `business_profile_service_areas`,
     `business_profile_opening_hours`.
   - Asserts `business_profiles.current_version_id` points at the version row, and each detail
     records where it came from.

6. **Generate a website draft** — from a blueprint.
   - Writes `website_pages` (page_type, status=`draft`), `website_page_versions` (`content` jsonb,
     status=`draft`), `website_sections` (component_id, props, design), `content_slots` (slot_type,
     value).
   - Asserts the draft rows exist and are tenant-scoped.

7. **Isolation** — a second tenant's request.
   - Reads: the first tenant's `business_profiles`, `website_pages`.
   - Asserts the cross-tenant read is blocked (no rows returned / 404).

## Website

**Precondition**: a tenant with a business profile and a generated website draft (from onboarding).

1. **Edit** — update a slot's copy and swap an image.
   - Reads `content_slots`, `website_sections`, `website_assets`.
   - Writes `content_slots.value` (new text) and `website_sections` (new image asset id).
   - Asserts the edited slot value persists and the source asset reference is tenant-owned.

2. **Validate** — component-contract check on save.
   - Reads `website_sections.component_id` → validates `props` against the component JSON Schema.
   - Asserts an invalid prop is rejected with a validation error (and `validation_errors` recorded).

3. **Publish** — build the manifest and go live.
   - Writes `website_publications` (status=`published`, `active=true`, `site_manifest` jsonb,
     `validation_report` jsonb, `version_number`), updates `website_pages.published_version_id`.
   - Asserts exactly one active publication, with a `site_manifest` matching the draft content.

4. **Resolve** — the public site read.
   - Reads `website_publications` (the active row) → `site_manifest`.
   - Asserts the resolved manifest matches what was published.

5. **Rollback** — reactivate an earlier publication.
   - Updates `website_publications` (active flags, status=`rolled_back`).
   - Asserts the earlier version is active again and history is untouched (both rows still exist).

6. **Public form → lead** — a visitor submits a form.
   - Writes `leads` (source=`public_form`, form_id, `contact` jsonb, message, status=`new`).
   - Asserts one `leads` row under the correct tenant, for attribution.

## Ads

**Precondition**: a tenant with a business profile and approved media (`website_assets` with
`alt_text` and `review_status=approved`).

1. **Create** — `POST /api/v1/website/editor/ads` (name, ad goal, service focus, destination page).
   - Writes `ad_creative_sets` (status=`draft`, `ad_goal`, `icp` jsonb, `destination_page_id`,
     `platform_status=not_connected`, `platform_refs` empty).
   - Asserts one `ad_creative_sets` row, tenant-scoped, `draft`.

2. **AI propose** (faked LLM) — generate copy + image gallery.
   - Writes `ai_generations` (internal reasoning, output, tool calls, usage) and
     `ad_copy_variants` (headline, primary_text, description, cta_label, source=`ai_proposal`),
     `ad_variants` (format, status=`needs_review`), `ad_image_placements` (media_asset_id, crop,
     focal_point, alt_text), `ad_lead_forms` (title, questions).
   - Asserts the trace row exists (reasoning + output + tool calls) and proposals are `needs_review`,
     never `ready_to_post`.

3. **Blocked path** — an asset without `alt_text` or still `pending_review`.
   - Reads `website_assets` referenced by placements.
   - Asserts approval fails and `ad_creative_sets.status` stays out of `ready_to_post`.

4. **Approve** — owner edits copy and approves.
   - Updates `ad_copy_variants` (source=`owner_edit`), `ad_variants.status=approved`,
     `ad_creative_sets.status=ready_to_post`.
   - Asserts terminal state `ready_to_post` only after every placement resolves to an approved,
     captioned asset.

5. **Export** — build the package.
   - Reads `ad_creative_sets` + variants + copy + placements + lead form.
   - Asserts the export is deterministic (same input → same package) and includes no unreviewed
     assets.

## Notes

- **Clerk** is the one external dependency that is *not* faked: it has real testing tokens (signed
  with a test key, verifiable against the test JWKS). Use them through the real SDK — never a fake
  verifier. Fiddly to set up once, then reusable.
- **Stripe** uses test mode the same way: real SDK + test keys, no real charge.
- Provider fakes live in the repo (see `ci-cd.md`); tests never spend money or reach production
  providers.
