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
[assistant](../assistant/persistence.md) (`thread_items`, `runs`),
[website](../website/persistence.md).

Guide conversation overlay is `assistant.thread_items` /
`assistant.runs`. Isolation is `ai.threads`
(`thread_kind=onboarding_assistant`, unique per
`onboarding_session_id`). Never migrated after website activation. Do
**not** keep `assistant_conversations` or onboarding copies of items /
runs. Unpaid website-editor Voice uses `thread_kind=cms_assistant` on
those same overlay tables.

## Tables

### `onboarding_sessions`

- **Columns:** `id`, `tenant_id` fk (required; unactivated tenant from
  business lookup), `started_from`, `channel` nullable, `status`,
  `token` unique, `clerk_user_id` nullable, `online_research_consent_at`
  nullable timestamptz, `browser_safety_session_id` uuid (Find lookup
  cap; not unique; not the onboarding session token), `place_id`
  nullable (Maps attach), `company_number` nullable (registry attach;
  trade-registry key with `tenants.country`), `website_url` nullable
  (known existing-site URL; crawl key), timestamps
- **Enums:** `started_from` → `google_maps_listing` /
  `company_registry`; `channel` → `text` / `voice`; `status` →
  `created` / `client_interviewing` /
  `selecting_and_copying_website_template` / `preview_and_edit` /
  `activated` / `select_and_copy_website_template_failed`
- **Uniques:** `token`; nullable unique `clerk_user_id`
- **Written by:** `LookupBusiness`
  (`POST /v1/onboarding/business-lookup`); `UpdateOnboardingSources`
  (`PUT /v1/onboarding/sources`); `SaveTextClientInterview`
  (`channel=text`); `CompleteClientInterview` (`status`); River job
  kind `select_and_copy_website_template` (wait-end
  `preview_and_edit`; fail
  `select_and_copy_website_template_failed`); River job kind
  `website_activation` (`status=activated`; `clerk_user_id` if still
  unset); `BindClerkUserToOnboardingSession`
  (`clerk_user_id` on the first Clerk request)
- **Notes:** Lookup cap counts rows with this
  `browser_safety_session_id` and `created_at > now() - 30 minutes`
  (fool protection; not IP). Per-tenant enqueue cap is derived from
  `etl.runs` (`trigger=onboarding`, distinct `enqueue_id` in the last
  30 minutes), not a column, not a DTO field. Nullable unique
  `clerk_user_id`: one Google account cannot bind to a second
  onboarding session / tenant (`BindClerkUserToOnboardingSession`).
  Postgres unique allows many nulls.

### No extract tables

02 **calls** `etl.StartRun`. This schema has no extract tables. SSE
**reads** `etl.runs` and the live business profile transform already
wrote. 01 **inserts** `etl.sources`
`source_kind=company_registry_record` when registry increments write
profile columns. Live business profile via
[build-profile](pipeline/build-profile.md).

### `client_interview_submissions`

- **Columns:** `id`, `onboarding_session_id` fk, `submission_kind`,
  `photos_fill` nullable, `additional_notes`, `created_at`
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

Lookup: `(tenant_id, status, created_at)` on `onboarding_sessions`;
`(browser_safety_session_id, created_at)` on `onboarding_sessions`.
Unique: `onboarding_sessions.token`; `stripe_events.event_id`.
Onboarding thread uniqueness and guide running lock live on
`ai.threads` / `assistant.runs`.
