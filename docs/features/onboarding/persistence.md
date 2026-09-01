# Onboarding — persistence

Onboarding session, client interview, guide conversation, and website
activation tables. Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `onboarding`). Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

Referenced, not owned here:
[auth](../other/auth/persistence.md) (`tenants`),
[details](../business-profile/details/persistence.md) (live business
profile and profile history), [ETL](../etl/persistence.md),
[LLM layer](../../general-architecture/llm-layer.md) (`ai.threads`),
[website](../website/persistence.md).

## Tables

### `onboarding_sessions`

- **Columns:** `id`, `tenant_id` fk (required; unactivated tenant from
  business lookup), `started_from`, `channel` nullable, `status`,
  `token` unique, `clerk_user_id` nullable, `online_research_consent_at`
  nullable timestamptz, `place_id` nullable (Maps attach),
  `company_number` nullable (registry attach; trade-registry key with
  `tenants.country`), `website_url` nullable (known existing-site URL;
  crawl key), timestamps
- **Enums:** `started_from` → `google_maps_listing` /
  `company_registry`; `channel` → `text` / `voice`; `status` →
  `created` / `client_interviewing` /
  `selecting_and_copying_website_template` / `preview_and_edit` /
  `activated` / `select_and_copy_website_template_failed`
- **Uniques:** `token`
- **Written by:** `LookupBusiness`
  (`POST /v1/onboarding/business-lookup`); `UpdateOnboardingSources`
  (`PUT /v1/onboarding/sources`); `SaveTextClientInterview`
  (`channel=text`); `CompleteClientInterview` (`status`); River job
  kind `select_and_copy_website_template` (wait-end
  `preview_and_edit`; fail
  `select_and_copy_website_template_failed`); River job kind
  `website_activation` (`status=activated`, `clerk_user_id`)
- **Notes:** `research_wait_until` is derived from `etl.runs`
  (`trigger=onboarding`, distinct `enqueue_id` in the last 30
  minutes), not a column.

### No extract tables

02 **calls** `etl.StartRun`. This schema has no extract tables. SSE
**reads** `etl.runs` and the live business profile transform already
wrote. 01 **inserts** `etl.sources`
`source_kind=company_registry_record` when registry increments write
profile columns. Live business profile via
[build-profile](pipeline/build-profile.md).

### `client_interview_submissions`

- **Columns:** `id`, `onboarding_session_id` fk, `submission_kind`,
  `photos_fill` nullable, `reviews_unavailable` bool,
  `additional_notes`, `created_at`
- **Enums:** `submission_kind` → `autosave` / `final`; `photos_fill`
  → `source_from_internet` / `ai` (only when found + uploaded photos
  are not enough)
- **Written by:** `SaveTextClientInterview`
  (`PUT /v1/onboarding/interview`, `submission_kind=autosave`);
  `CompleteClientInterview`
  (`POST /v1/onboarding/interview/complete`, `submission_kind=final`
  when last answers persist)
- **Notes:** Profile answers are `business_profile_edits`, not a
  payload dump on this row. Interview-only fields live here. Found
  photos live in the media library.

### `assistant_conversation_items`

- **Columns:** `id`, `onboarding_session_id` fk, `thread_id` fk →
  `ai.threads`, `thread_item_kind`, `body`, `icon`, `offset_seconds`
  int nullable (`>= 0`; Voice utterances; seconds from
  `audio_start_ms` on paired `speech_started` when present; null if
  none), `provider_event` jsonb nullable (forwarded xAI JSON; Voice
  only; omit from GET), `created_at`
- **Enums:** `thread_item_kind` → `owner` / `assistant` /
  `tool_summary` / `thinking`
- **Written by:** `POST /v1/onboarding/assistant/voice/transcripts`
- **Notes:** Same shapes as CMS thread items.

### Guide isolation

Isolated from CMS `cms_assistant` threads. Never migrated after
website activation. Thread identity is
[`ai.threads`](../../general-architecture/llm-layer.md)
(`thread_kind=onboarding_assistant`, unique per
`onboarding_session_id`). Do **not** keep `assistant_conversations` as
an identity table. Unpaid website-editor Voice uses
`thread_kind=cms_assistant` on CMS overlay tables, not these rows.

### `assistant_runs`

- **Columns:** `id`, `onboarding_session_id` fk, `thread_id` fk →
  `ai.threads`, `status`, `channel`, `ai_generation_id` uuid nullable,
  timestamps
- **Enums:** `status` → `running` / `succeeded` / `failed`; `channel`
  → `text` / `voice`
- **Uniques:** `(onboarding_session_id) WHERE status = 'running'`
- **Written by:**
  `POST /v1/onboarding/assistant/voice/realtime-connection`;
  `POST /v1/onboarding/assistant/voice/transcripts`

### `website_activations`

- **Columns:** `id`, `tenant_id` fk, `onboarding_session_id` fk,
  `clerk_subject`, `checkout_session_id`, `payment_status`, `amount`,
  `currency`, `failure_reason` nullable, `activated_at` nullable,
  `created_at`
- **Enums:** `payment_status` → `pending` / `paid` / `failed` /
  `refunded`
- **Uniques:** unique webhook key (safe to replay)
- **Written by:** `POST /v1/onboarding/activation/checkout`;
  `POST /v1/webhooks/stripe`; River job kind `website_activation`
- **Notes:** No `website_previews` / `token_hash`. The website preview
  is `/onboarding/preview-and-edit/`. The preview website address is
  reserved at 08. Website publications live on
  [website persistence](../website/persistence.md).

### `stripe_events`

- **Columns:** `id`, `event_id` unique, `type`, `payload` jsonb,
  `processed` bool, `created_at`
- **Uniques:** `event_id`
- **Written by:** `POST /v1/webhooks/stripe`
- **Notes:** `payload` is **omit** from HTTP.

## Indexes

Lookup: `(tenant_id, status, created_at)` on `onboarding_sessions`.
Unique: `onboarding_sessions.token`; `stripe_events.event_id`;
`(onboarding_session_id) WHERE status = 'running'` on
`assistant_runs`. Onboarding thread uniqueness lives on `ai.threads`.
Lookup: `(thread_id, created_at)` on `assistant_conversation_items`.
