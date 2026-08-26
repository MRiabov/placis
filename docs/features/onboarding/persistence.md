# Onboarding — persistence

Onboarding session, business research, website preview, and website activation tables.
Conventions: [persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `onboarding`).

The business profile these onboarding sessions write is owned by
[details](../other/details/persistence.md). Public-source extract (runs, fetches, Maps
listing, Facebook posts) is owned by [ETL](../other/etl/persistence.md) (Postgres schema
`etl`). LLM traces: [LLM layer](../../general-architecture/llm-layer.md).

## Onboarding sessions and client interview

- `onboarding_sessions` — `id`, `tenant_id` fk (required; the unactivated tenant created at
  business lookup), `started_from` (`google_maps_listing`/
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

02 enqueue inserts `etl.business_research_runs` (`trigger=onboarding`, this
`onboarding_session_id`). Cap: 5 rows per `tenant_id` with that trigger in any rolling 30
minutes ([02](pipeline/02-business-research.md)). `research_wait_until` on profile / SSE is
derived: oldest in-window `started_at` + 30 minutes when the cap is hit.

## Website activation

- `website_activations` — `id`, `tenant_id` fk, `onboarding_session_id` fk, `clerk_subject`,
  `checkout_session_id`, `payment_status` (`pending`/`paid`/`failed`/`refunded`), `amount`,
  `currency`, `failure_reason`, `activated_at`, `created_at`; unique webhook key (safe to replay)
- `stripe_events` — `id`, `event_id` unique, `type`, `payload` jsonb, `processed`, `created_at`

No `website_previews` / `token_hash`. The website preview is the host reserved at 07
([07](pipeline/07-website-preview.md)). Website publications live on
[website persistence](../website/persistence.md).

## Indexes

Lookup: `(tenant_id, status, created_at)` on onboarding sessions.
Unique: `stripe_events.event_id`.
