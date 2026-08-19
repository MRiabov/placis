# Onboarding — data model

Onboarding session, business research, website preview, and website activation tables.
Conventions: [data-model conventions](../../general-architecture/data-model.md).

The business profile these onboarding sessions write is owned by
[details](../other/details/data-model.md). LLM traces:
[LLM layer](../../general-architecture/llm-layer.md).

## Onboarding sessions and client interview

- `onboarding_sessions` — `id`, `tenant_id` nullable fk, `started_from` (`google_places`/
  `company_registry`), `channel` (`text`/`voice`), `status` (`created`/`interviewing`/
  `generating`/`previewing`/`activated`/`generation_failed`; TODO: rename `generating` /
  `generation_failed`), `token` unique, `clerk_user_id`
  nullable, `consent_given_at` nullable, timestamps
- `text_interview_submissions` — `id`, `onboarding_session_id` fk, `version`, `payload` jsonb,
  `created_at`

## Business research

- `research_sessions` — `id`, `onboarding_session_id` fk, `status`, `created_at`
- `research_runs` — `id`, `research_session_id` fk, `provider` (TODO: rename — do not say
  provider in prose; this column still does), `status`, `started_at`,
  `finished_at`
- `research_events` — `id`, `research_run_id` fk, `event_type`, `payload` jsonb, `created_at`
- `research_sources` — `id`, `research_run_id` fk, `kind` (`google_places`/`company_registry`/
  `trade_registry`/`facebook`/`social_profile`/`website_crawl`/`review`/`directory`/`photo`),
  `external_id`, `source_ref`, `raw` jsonb, `normalized` jsonb,
  `confidence`, `created_at`
- `google_places_cache` — `id`, `place_id` unique, `payload` jsonb, `cached_at`

## Website preview and website activation

- `website_previews` — `id`, `onboarding_session_id` fk, `token_hash` unique, `status` (`active`/
  `superseded`/`expired`/`activated`), `personas` jsonb, `unresolved_fields` jsonb, `expires_at`,
  `created_at`
- `website_preview_events` — `id`, `website_preview_id` fk, `event_type`, `payload` jsonb, `created_at`
- `website_activations` — `id`, `website_preview_id` fk, `clerk_subject`, `checkout_session_id`,
  `payment_state` (`pending`/`paid`/`failed`/`refunded`), `amount`, `currency`, `failure_reason`,
  `tenant_id` nullable fk, `activated_at`, `created_at`; unique webhook key (safe to replay)
- `stripe_events` — `id`, `event_id` unique, `type`, `payload` jsonb, `processed`, `created_at`

## Indexes

Lookup: `(tenant_id, status, created_at)` on onboarding sessions. Unique: `stripe_events.event_id`.
