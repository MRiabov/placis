# Onboarding — data model

Onboarding session, business research, website preview, and website activation tables.
Conventions: [data-model conventions](../../general-architecture/data-model.md).

The business profile these onboarding sessions write is owned by
[details](../other/details/data-model.md). LLM traces:
[LLM layer](../../general-architecture/llm-layer.md).

## Onboarding sessions and client interview

- `onboarding_sessions` — `id`, `tenant_id` nullable fk, `started_from` (`google_maps_listing`/
  `company_registry`), `channel` (`text`/`voice`), `status` (`created`/`client_interviewing`/
  `applying_website_template`/`previewing`/`activated`/`apply_website_template_failed`),
  `token` unique, `clerk_user_id` nullable, `online_research_consent_at` nullable, timestamps
- `client_interview_submissions` — `id`, `onboarding_session_id` fk, `kind` (`autosave`/`final`),
  `photos_choice` (`use_found`/`source_from_google`/`upload_later`/`use_neutral`),
  `google_maps_listing_choice` (`use_found`/`lookup`/`no_profile`/`add_later`),
  `reviews_unavailable`, `additional_notes`, `created_at`

Profile answers from the client interview are `business_profile_edits`, not a payload dump on
this row. Interview-only choices (photos, Google Maps listing, reviews unavailable, extra notes)
live here.

## Business research

- `business_research_runs` — `id`, `onboarding_session_id` fk, `place_id` nullable (Google’s
  id on the Maps path), `kind` (`google_maps_listing`/`company_registry`/`trade_registry`/`facebook`/
  `social_profile`/`website_crawl`/`review`/`directory`/`photo`), `status`, `started_at`,
  `finished_at`
- `business_research_events` — `id`, `business_research_run_id` fk, `event_type`, `payload` jsonb,
  `created_at`
- `business_research_sources` — `id`, `business_research_run_id` fk, `kind` (same closed set as
  runs), `external_id`, `source_ref`, `raw` jsonb, `status` (`matched`/`ambiguous`/`not_found`/
  `not_attempted`/`blocked`/`error`), `confidence`, `created_at`
- `google_maps_listing_cache` — `id`, `place_id` unique (Google’s id),
  `fetched_from` (`google_maps_details`/`scrape`), `payload` jsonb, `cached_at`

`payload` is the raw listing from Google Maps Details (the free API) or the scrape fallback. The
cache avoids a repeat fetch; it is not a source of truth. Typed output is
`business_research_sources`.

## Website preview and website activation

- `website_previews` — `id`, `onboarding_session_id` fk, `token_hash` unique, `status` (`active`/
  `superseded`/`expired`/`activated`), `expires_at`, `created_at`
- `website_preview_events` — `id`, `website_preview_id` fk, `event_type`, `payload` jsonb,
  `created_at`
- `website_activations` — `id`, `website_preview_id` fk, `clerk_subject`, `checkout_session_id`,
  `payment_status` (`pending`/`paid`/`failed`/`refunded`), `amount`, `currency`, `failure_reason`,
  `tenant_id` nullable fk, `activated_at`, `created_at`; unique webhook key (safe to replay)
- `stripe_events` — `id`, `event_id` unique, `type`, `payload` jsonb, `processed`, `created_at`

## Indexes

Lookup: `(tenant_id, status, created_at)` on onboarding sessions. Unique: `stripe_events.event_id`.
