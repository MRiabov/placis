# Onboarding — data model

Onboarding session, research, preview, and claim tables. Conventions:
[data-model conventions](../../general-architecture/data-model.md).

The business profile these sessions write is owned by
[details](../other/details/data-model.md). LLM traces:
[LLM layer](../../general-architecture/llm-layer.md).

## Sessions and interview

- `onboarding_sessions` — `id`, `tenant_id` nullable fk, `started_from` (`google_places`/
  `company_registry`), `channel` (`text`/`voice`), `status` (`created`/`interviewing`/
  `generating`/`previewing`/`claimed`/`generation_failed`), `token` unique, `clerk_user_id`
  nullable, `consent_given_at` nullable, timestamps
- `text_interview_submissions` — `id`, `onboarding_session_id` fk, `version`, `payload` jsonb,
  `created_at`

## Research

- `research_sessions` — `id`, `onboarding_session_id` fk, `status`, `created_at`
- `research_runs` — `id`, `research_session_id` fk, `provider`, `status`, `started_at`,
  `finished_at`
- `research_events` — `id`, `research_run_id` fk, `event_type`, `payload` jsonb, `created_at`
- `research_sources` — `id`, `research_run_id` fk, `kind` (`google_places`/`company_registry`/
  `trade_registry`/`facebook`/`social_profile`/`website_crawl`/`review`/`directory`/`photo`),
  `external_id`, `source_ref`, `raw` jsonb, `normalized` jsonb,
  `confidence`, `created_at`
- `google_places_cache` — `id`, `place_id` unique, `payload` jsonb, `cached_at`

## Preview and claim

- `preview_packages` — `id`, `onboarding_session_id` fk, `token_hash` unique, `status` (`active`/
  `superseded`/`expired`/`claimed`), `personas` jsonb, `unresolved_fields` jsonb, `expires_at`,
  `created_at`
- `preview_events` — `id`, `preview_package_id` fk, `event_type`, `payload` jsonb, `created_at`
- `preview_claims` — `id`, `preview_package_id` fk, `clerk_subject`, `checkout_session_id`,
  `payment_state` (`pending`/`paid`/`failed`/`refunded`), `amount`, `currency`, `failure_reason`,
  `tenant_id` nullable fk, `activated_at`, `created_at`; unique webhook key (safe to replay)
- `stripe_events` — `id`, `event_id` unique, `type`, `payload` jsonb, `processed`, `created_at`

## Indexes

Lookup: `(tenant_id, status, created_at)` on sessions. Unique: `stripe_events.event_id`.
