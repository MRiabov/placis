# Onboarding — data model

Onboarding session, business research, website preview, and website activation tables.
Conventions: [data-model conventions](../../general-architecture/data-model.md)
(Postgres schema `onboarding`).

The business profile these onboarding sessions write is owned by
[details](../other/details/data-model.md). LLM traces:
[LLM layer](../../general-architecture/llm-layer.md).

## Onboarding sessions and client interview

- `onboarding_sessions` — `id`, `tenant_id` fk (required; the unactivated tenant created at
  confirm), `started_from` (`google_maps_listing`/
  `company_registry`), `channel` (`text`/`voice`), `status` (`created`/`client_interviewing`/
  `applying_website_template`/`previewing`/`activated`/`apply_website_template_failed`),
  `token` unique, `clerk_user_id` nullable, `online_research_consent_at` nullable,
  `interview_plan_markdown` nullable, `interview_plan_completed` text[] nullable,
  `interview_plan_next_questions` text[] nullable, timestamps
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
  runs), `external_id`, `source_ref`, `raw` jsonb (ETL dump for kinds with no listing table;
  null when `kind` is `google_maps_listing` or `review`; copy of the cache hit, not a second fetch),
  `status` (`matched`/`ambiguous`/`not_found`/`not_attempted`/`blocked`/`error`), `confidence`,
  `created_at`
- `business_research_fetches` — `id`, `kind` (same closed set as runs, plus `web_search`),
  `cache_key` unique with `kind` (canonical URL, scrape query, Facebook URL, trade-registry id,
  Parallel query, or `place_id` for Maps scrape fallback), `raw` jsonb, `fetched_at`. Global ETL
  cache: look up before any external call. Hit → reuse `raw`; do not call Google Maps Details,
  scrape, Facebook, crawl, or Parallel again. Still write a `business_research_run` +
  `business_research_sources` row for **this** onboarding session. Maps listings also reuse
  `google_maps_listings` by `place_id`. Company registry parquet and Find autocomplete are not
  this cache. No TTL.
- `google_maps_listings` — `id`, `place_id` unique (Google’s id),
  `fetched_from` (`google_maps_details`/`scrape`), `display_name`, `primary_type`,
  `marketing_phone`, `website_url`, `google_maps_listing_url`, `listing_address`, `locality`,
  `rating`, `review_count`, `raw` jsonb (last Details or scrape body; ETL cache so we do not
  refetch), `fetched_at`
- `google_maps_listing_opening_hours` — `id`, `listing_id` fk, `day_of_week`, `opens_at`,
  `closes_at`, `closed`
- `google_maps_listing_reviews` — `id`, `listing_id` fk, `external_id` (Google’s review id,
  unique per listing when present), `author_name`, `rating` (1–5), `body`, `published_at`
  nullable, `language` nullable

The Google Maps listing is this row, not a blob and not a second copy on
`business_research_sources`. `raw` is the ETL fetch body only. Hours and reviews are child
rows. Photos from the listing become media library items. Profile increments (03) copy selected
fields and review rows onto the business profile; the listing address stays here.

## Website preview and website activation

- `website_previews` — `id`, `onboarding_session_id` fk, `token_hash` unique, `status` (`active`/
  `superseded`/`activated`), `created_at`
- `website_preview_events` — `id`, `website_preview_id` fk, `event_type`, `payload` jsonb,
  `created_at`
- `website_activations` — `id`, `website_preview_id` fk, `clerk_subject`, `checkout_session_id`,
  `payment_status` (`pending`/`paid`/`failed`/`refunded`), `amount`, `currency`, `failure_reason`,
  `tenant_id` nullable fk, `activated_at`, `created_at`; unique webhook key (safe to replay)
- `stripe_events` — `id`, `event_id` unique, `type`, `payload` jsonb, `processed`, `created_at`

## Indexes

Lookup: `(tenant_id, status, created_at)` on onboarding sessions. Unique: `stripe_events.event_id`,
`business_research_fetches` `(kind, cache_key)`.
