# Onboarding — data model

Onboarding session, business research, website preview, and website activation tables.
Conventions: [data-model conventions](../../general-architecture/data-model.md).

The business profile these onboarding sessions write is owned by
[details](../other/details/data-model.md). LLM traces:
[LLM layer](../../general-architecture/llm-layer.md).

## Onboarding sessions and client interview

- `onboarding_sessions` — `id`, `tenant_id` nullable fk, `started_from` (`google_maps`/
  `company_registry`), `channel` (`text`/`voice`), `status` (`created`/`client_interviewing`/
  `applying_website_template`/`previewing`/`activated`/`apply_website_template_failed`),
  `token` unique, `clerk_user_id` nullable, `online_research_consent_at` nullable, timestamps
- `client_interview_submissions` — `id`, `onboarding_session_id` fk, `payload` jsonb,
  `created_at`

## Business research

- `business_research_runs` — `id`, `onboarding_session_id` fk, `place_id` nullable (Google’s
  id on the Maps path), `kind` (`google_maps`/`company_registry`/`trade_registry`/`facebook`/
  `social_profile`/`website_crawl`/`review`/`directory`/`photo`), `status`, `started_at`,
  `finished_at`
- `business_research_events` — `id`, `business_research_run_id` fk, `event_type`, `payload` jsonb,
  `created_at`
- `business_research_sources` — `id`, `business_research_run_id` fk, `kind` (same closed set as
  runs), `external_id`, `source_ref`, `raw` jsonb, `status` (`matched`/`ambiguous`/`not_found`/
  `not_attempted`/`blocked`/`error`), `confidence`, `created_at`
- `google_maps_listing_cache` — `id`, `place_id` unique (Google’s id), `payload` jsonb,
  `cached_at`

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
