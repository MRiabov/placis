# Onboarding — persistence

Onboarding session, client interview, and website activation tables.
Conventions: [persistence conventions](../../general-architecture/persistence.md) (Postgres schema `onboarding`).

The business profile these onboarding sessions write is owned by [details](../business-profile/details/persistence.md).
Extract and the Google Maps listing: [ETL](../etl/persistence.md). LLM traces: [LLM layer](../../general-architecture/llm-layer.md) (schema
`ai`). Onboarding assistant conversation: below.

## Onboarding assistant (guide)

Isolated from CMS `cms_assistant` threads. Never migrated after website
activation. Thread identity is [`ai.threads`](../../general-architecture/llm-layer.md) (`kind=onboarding_assistant`,
unique per `onboarding_session_id`). Do **not** keep `assistant_conversations`
as an identity table.

- `assistant_conversation_items` — `id`, `onboarding_session_id` fk,
  `thread_id` fk → `ai.threads`, `kind` (`owner` / `assistant` /
  `tool_summary` / `thinking`), `body`, `icon`, `offset_seconds` int nullable
  (`>= 0`; Voice utterances; seconds from the xAI Voice connection clock on the
  committed transcript events; null if none), `provider_event` jsonb nullable
  (forwarded xAI JSON; Voice only; omit from GET), `created_at` (row insert).
  Index `(thread_id, created_at)`. Same shapes as CMS thread items.
- `assistant_runs` — `id`, `onboarding_session_id` fk, `thread_id` fk →
  `ai.threads`, `status` (`running` / `succeeded` / `failed`), `channel`
  (`text` / `voice`), `ai_generation_id` uuid nullable, timestamps. Unique
  `(onboarding_session_id) WHERE status = 'running'`.

## Onboarding sessions and client interview

- `onboarding_sessions` — `id`, `tenant_id` fk (required; the unactivated tenant
  created at business lookup), `started_from` (`google_maps_listing`/
  `company_registry`), `channel` (`text`/`voice`), `status`
  (`created`/`client_interviewing`/
  `applying_website_template`/`previewing`/`activated`/`apply_website_template_failed`),
  `token` unique, `clerk_user_id` nullable, `online_research_consent_at`
  nullable, `interview_plan_markdown` nullable, `interview_plan_completed`
  text[] nullable, `interview_plan_next_questions` text[] nullable, timestamps
- `client_interview_submissions` — `id`, `onboarding_session_id` fk, `kind`
  (`autosave`/`final`), `photos_fill` nullable (`source_from_internet`/`ai`)
  only when found + uploaded photos are not enough, `google_maps_listing_choice`
  (`use_found`/`lookup`/`no_profile`/`add_later`), `reviews_unavailable`,
  `additional_notes`, `created_at`

Profile answers from the client interview are `business_profile_edits`, not a
payload dump on this row. Interview-only fields (photo fill when short, Google
Maps listing, reviews unavailable, extra notes) live here. Found photos live in
the media library; the owner may upload more.

## Business research

02 calls `etl.StartRun` ([ETL](../etl/README.md); [02](pipeline/02-business-research.md)). This schema has no extract tables.
`research_wait_until` is derived from `etl.runs` (`trigger=onboarding`, distinct
`enqueue_id` in the last 30 minutes). SSE reads `etl.runs`. Live business
profile via
[build-profile](pipeline/build-profile.md).

## Website activation

- `website_activations` — `id`, `tenant_id` fk, `onboarding_session_id` fk,
  `clerk_subject`, `checkout_session_id`, `payment_status`
  (`pending`/`paid`/`failed`/`refunded`), `amount`, `currency`,
  `failure_reason`, `activated_at`, `created_at`; unique webhook key (safe to
  replay)
- `stripe_events` — `id`, `event_id` unique, `type`, `payload` jsonb,
  `processed`, `created_at`

No `website_previews` / `token_hash`. The website preview is
`/onboarding/preview-and-edit/`. The preview website address is reserved at 08
([08](pipeline/08-preview-website-address.md)). Website publications live on
[website persistence](../website/persistence.md).

## Indexes

Lookup: `(tenant_id, status, created_at)` on onboarding sessions. Unique:
`stripe_events.event_id`; `(onboarding_session_id) WHERE status = 'running'` on
`assistant_runs`. Onboarding thread uniqueness lives on `ai.threads`. Lookup:
`(thread_id, created_at)` on `assistant_conversation_items`.
