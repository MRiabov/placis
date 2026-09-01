# Onboarding HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Business lookup, resume, client interview, SSE, website activation,
onboarding assistant (guide). Details after website activation:
[details HTTP](../business-profile/details/api.md). Selecting and
copying the website template is owned by [website](../website/api.md);
this feature only **inserts** it.

**Auth default:** onboarding session token (request header; token uniquely
identifies the `onboarding_sessions` row). **None:** business lookup
and Find typeahead. **Clerk JWT** Host / `website_prefix` or Clerk
unactivated on the app origin: activation checkout / status.
**Stripe signature:** `POST /v1/webhooks/stripe`. Activated owner:
**403** on `/v1/onboarding/assistant/…`, `/v1/onboarding/website/…`,
and leftover onboarding session token routes. Mutating Routes send
`Idempotency-Key`. Token-auth Routes have **no** onboarding-session
`{id}` in the path. Unactivated **403** on `/v1/website/editor` and
`/v1/assistant/…`.

Serve-only jsonb (not a DTO field dump): company registry / Maps
search **omit** `raw`; ETL fetch `raw` **omit**; Stripe event body
**omit**; extra notes are `string`. SSE uses Huma `sse.Register` event
name → struct, not an unconstrained `payload`. Fill status lives on
`OnboardingProfileRead` (not a checklist `*Read`).

## DTOs

### Find

| DTO | Fields | Description |
| --- | --- | --- |
| `BusinessLookupCreate` | `country`, `online_research_consent`, `company_number`, `place_id`, `website_url` | Create unactivated tenant + onboarding session. `country` default `ie`. Consent required. Registry and/or Maps. Extra keys 4xx |
| `BusinessLookupRead` | `id`, `token`, `status`, `research_wait_until` | Lookup response. `id` for logs. Token → `localStorage`. `research_wait_until` when enqueue cap hit |
| `CompanyRegistrySearchGet` | `country`, `q` | Find typeahead query |
| `CompanyRegistryRecordRead` | `company_number`, `legal_name`, `registered_office`, `company_status` | Typeahead row. **Omit** `raw` |
| `GoogleMapsSearchGet` | `country`, `q` | Find typeahead query |
| `GoogleMapsListingRead` | `place_id`, `display_name`, `formatted_address` | Typeahead row. **Omit** Maps `raw` |
| `OnboardingSourcesUpdate` | `place_id`, `company_number`, `website_url` | Replace attach keys on the existing onboarding session |

### Profile

| DTO | Fields | Description |
| --- | --- | --- |
| `OnboardingProfileRead` | `id`, `status`, `research_wait_until`, `preview_website_address`, `fill: []OnboardingFillStatusRead`, `conflicts: []OnboardingResearchConflictRead`, `profile: OnboardingLiveBusinessProfileRead` | Resume / Review hydrate. Not Details GET |
| `OnboardingFillStatusRead` | `key`, `status` | Derived fill. `status` → `empty` / `in_progress` / `conflict` / `filled_by_user` / `filled_by_research` / `skipped` / `not_applicable` |
| `OnboardingResearchConflictRead` | `key`, `live_value`, `research_value` | Research conflict (both values). Not a write |
| `OnboardingLiveBusinessProfileRead` | `display_name`, `trade`, `description`, `founder_name`, `legal_name`, `company_number`, `registered_office`, `company_status`, `contact_name`, `marketing_phone`, `marketing_email`, `existing_site_url`, `emergency_phone`, `opening_hours`, `services`, `service_areas`, `accreditations`, `reviews`, `facebook_profile_url` | Live columns the onboarding screens show. Same row as Details; onboarding session token |

### Client interview

| DTO | Fields | Description |
| --- | --- | --- |
| `ClientInterviewUpdate` | `display_name`, `trade`, `description`, `founder_name`, `contact_name`, `marketing_phone`, `marketing_email`, `existing_site_url`, `emergency_phone`, `opening_hours`, `services`, `service_areas`, `accreditations`, `photos_fill`, `reviews_unavailable`, `additional_notes`, `skipped` | Dirty keys only. PUT click-off; optional POST complete body. Extra keys 4xx |

### Progress

| DTO | Fields | Description |
| --- | --- | --- |
| `OnboardingBusinessProfileEvent` | `profile: OnboardingLiveBusinessProfileRead`, `fill: []OnboardingFillStatusRead`, `conflicts: []OnboardingResearchConflictRead` | SSE `business_profile` |
| `OnboardingTimelineStepEvent` | `step` | SSE `timeline_step` |
| `OnboardingResearchWaitUntilEvent` | `research_wait_until` | SSE `research_wait_until` |
| `OnboardingWebsitePreviewReadyEvent` | `ready` | SSE `website_preview_ready` |

### Website

| DTO | Fields | Description |
| --- | --- | --- |
| `PreviewWebsiteAddressRead` | `url` | Share (08). Website preview link |

Unpaid canvas reuses CMS website editor DTOs (`WebsiteEditorGet`,
`WebsitePageSummaryRead`, `WebsitePageRead`, `WebsitePageUpdate`,
`WebsiteEditApplyRead`, `WebsiteMenusRead`, `WebsiteMenusUpdate`).

### Activation

| DTO | Fields | Description |
| --- | --- | --- |
| `WebsiteActivationCheckoutRead` | `checkout_url` | Checkout URL. **Omit** Stripe bodies |
| `WebsiteActivationStatusRead` | `payment_status`, `checkout_url` | Poll after checkout |

### Onboarding assistant (guide)

| DTO | Fields | Description |
| --- | --- | --- |
| `OnboardingGuideRealtimeConnectionCreate` | `step`, `visible_fields` | Voice create. Current onboarding step + visible fields. No unpublished website |
| `AssistantVoiceRealtimeConnectionRead` | `client_secret`, `expires_at`, `realtime_url` | Browser-safe secret + expiry + `wss://{region}.api.x.ai/v1/realtime`. CMS shape |
| `AssistantVoiceTranscriptCreate` | `events`, `offset_seconds`, `reasoning`, `usage` | Closed union of committed xAI Voice events. CMS shape. **Omit** PCM |
| `AssistantThreadRead` | `id`, `status`, `last_activity_at`, `items: []AssistantThreadItemRead` | Guide hydrate. Empty is `items: []` |
| `AssistantThreadItemRead` | `thread_item_kind`, `body`, `icon`, `offset_seconds`, `created_at` | Ordered item. **Omit** `provider_event` |

Unpaid website assistant reuses these CMS thread/voice `*Read` shapes
as-is (no `OnboardingWebsiteEditor*` aliases). GET thread **omits**
`runs`.

## Routes

### Find

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/onboarding/business-lookup` | `/onboarding/find` once | `BusinessLookupCreate` | `BusinessLookupRead` | | `tenants`, `onboarding_sessions`, `business_profiles` | **calls** `LookupBusiness`; **inserts** 02 if under cap | | Select or copy the website template; wait for 02; mount/keystroke POST; second tenant for same token |
| `GET /v1/onboarding/find/search/company-registry` | Find typeahead | `CompanyRegistrySearchGet` | `CompanyRegistryRecordRead` | | | Debounced. **Omit** `raw` | | Persist; upsert listings |
| `GET /v1/onboarding/find/search/google-maps` | Find typeahead | `GoogleMapsSearchGet` | `GoogleMapsListingRead` | | | Debounced. **Omit** Maps `raw` | | Upsert `etl.google_maps_listings`; insert fetches |
| `PUT /v1/onboarding/sources` | attach/change Maps or registry | `OnboardingSourcesUpdate` | `OnboardingProfileRead` | `onboarding_sessions` | `onboarding_sessions` | Safe-to-retry replace of attach keys; may **call** `StartBusinessResearch` (same cap) | `429` `research_wait_until` | Create a new onboarding session; business lookup |

Auth on lookup and Find search: none. `PUT /v1/onboarding/sources`:
onboarding session token.

### POST /v1/onboarding/business-lookup

**Create** the unactivated tenant + onboarding session (once per
browser token). Consent is this body field, not a `/research-consent`
resource. Country persists on `tenants.country`. Over the 5-enqueue cap
→ still 200 with `research_wait_until`.

### Profile

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/onboarding/profile` | Resume; Review | | `OnboardingProfileRead` | `onboarding_sessions`, `business_profiles`, `etl.runs` | | Nested live business profile + research conflict + fill status + `research_wait_until` | | ETL fetch `raw`; checklist resource |

### Client interview

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PUT /v1/onboarding/interview` | click-off / periodic save | `ClientInterviewUpdate` | `OnboardingProfileRead` | `onboarding_sessions`, `business_profiles` | `client_interview_submissions`, `business_profile_edits`, `onboarding_sessions` | **calls** `SaveTextClientInterview`. `submission_kind=autosave`. Succeeds when the complete gate would fail | | Start 05; `/autosave` |
| `POST /v1/onboarding/interview/complete` | Continue | `ClientInterviewUpdate` | `OnboardingProfileRead` | `onboarding_sessions`, `business_profiles` | `client_interview_submissions`, `business_profile_edits`, `business_profiles`, `onboarding_sessions` | **calls** `CompleteClientInterview`. Optional last dirty answers. Gate; `accepted_edit_id`; **inserts** `select_and_copy_website_template` | `409` gate | PUT-then-POST hop; `/submit`; second complete; `generation-runs` from `frontend-2` |
| `POST /v1/onboarding/projects/{projectId}/archive` | interview Project cards | | | `business_profile.projects` | `business_profile.projects` | `active` → `archived`, `algorithm=human`; `project_sources` kept | | `POST /v1/projects/{id}/archive`; DELETE; interview Approve; guide tool |

### POST /v1/onboarding/interview/complete

Continue **is** submit. One hop. Optional body empty if click-off
already saved. Gate fail stays `client_interviewing`. Exactly one
complete → 05.

### Progress

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/onboarding/events/stream` | `/onboarding/preview`; Review while 02 runs; `/onboarding/preview-and-edit/` while 06 runs | | `OnboardingBusinessProfileEvent` / `OnboardingTimelineStepEvent` / `OnboardingResearchWaitUntilEvent` / `OnboardingWebsitePreviewReadyEvent` | `etl.runs`, `business_profiles`, `onboarding_sessions` | | Huma `sse.Register`. Event names `business_profile`, `timeline_step`, `research_wait_until`, `website_preview_ready` | | Unconstrained `payload`; `checklist_row`; contractor host |

### Website

Unpaid canvas. Same tails as `/v1/website/editor/…`. CMS website editor
is active tenant only. Policy: [website-editor.md](website-editor.md).
GET website pages / website page / top menu and footer: onboarding
session token or Clerk unactivated. PATCH website pages / top menu and
footer: Clerk unactivated only. Share: onboarding session token or Clerk
unactivated. Send / Voice: Clerk only. `status=active` → **403**.

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/onboarding/website/editor/pages` | `/onboarding/preview-and-edit/` | `WebsiteEditorGet` | `WebsitePageSummaryRead` | `website_pages` | | Same as CMS list. No `publication_id` | `403` activated | `/v1/website/editor`; contractor host GET |
| `GET /v1/onboarding/website/editor/pages/{page_id}` | canvas hydrate | `WebsiteEditorGet` | `WebsitePageRead` | `website_pages`, `website_sections`, `website_slots`, `website.menus`, `website_settings`, `website_forms`, `website_slot_reviews`, `website_publications` | | Same as CMS hydrate. No `publication_id` | `403` activated; `404`/`400` | `/v1/website/editor`; `slot_type=json`; `website_manifest` |
| `PATCH /v1/onboarding/website/editor/pages/{page_id}` | Assistant apply; canvas | `WebsitePageUpdate` | `WebsiteEditApplyRead` | `website_pages`, `website_settings`, `edit_history` | `website_slots`, `website_sections`, `website_pages`, `website_forms`, `website_form_fields`, `website_form_field_options`, `website.menus`, `edit_history`, `website_settings.edit_history_head` | Same as CMS PATCH. Clerk only | `403`; `409 edit_history_conflict`; `413`; `429` | Onboarding session token PATCH |
| `GET /v1/onboarding/website/editor/menus` | top menu / footer | `WebsiteEditorGet` | `WebsiteMenusRead` | `website.menus` | | Same as CMS menus GET | `403` activated | `/top-menu` or `/footer` |
| `PATCH /v1/onboarding/website/editor/menus` | top menu / footer | `WebsiteMenusUpdate` | `WebsiteEditApplyRead` | | `website.menus`, `edit_history` | Same as CMS menus PATCH. Clerk only | `403`; `409 edit_history_conflict` | Onboarding session token PATCH; top menu / footer on website page PATCH |
| `POST /v1/onboarding/website/publications` | **Share** on `/onboarding/preview-and-edit/` | | `PreviewWebsiteAddressRead` | `onboarding_sessions`, `website_settings` | `website_addresses`, `website_publications` | **calls** `SharePreviewWebsiteAddress` (08) | | Require website activation; auto-run at wait-end; `/v1/website-previews/{token}/…`; CMS `POST /v1/website/publications` |
| `GET /v1/onboarding/website/assistant/thread` | unsigned land; hydrate | | `AssistantThreadRead` | `ai.threads`, `assistant.thread_items` | `ai.threads` | Lazy-create empty `current`. Omits `runs` | `403` activated | `/v1/assistant/…`; `/v1/onboarding/assistant/…` |
| `GET /v1/onboarding/website/assistant/thread/ws` | text chat | | | `ai.threads` | `assistant.thread_items`, `assistant.runs` | CMS text socket. Clerk only | `403`; `409` `unpaid_prompt_cap` | Onboarding session token send |
| `POST /v1/onboarding/website/assistant/voice/realtime-connection` | Voice on | | `AssistantVoiceRealtimeConnectionRead` | | `assistant.runs` | Clerk only | `403`; `409` `unpaid_prompt_cap` | Onboarding session token Voice |
| `POST /v1/onboarding/website/assistant/voice/tool-calls` | Voice tools | | | | | CMS tools; Clerk only | `403`; `409` | |
| `POST /v1/onboarding/website/assistant/voice/transcripts` | committed utterances | `AssistantVoiceTranscriptCreate` | | | `assistant.thread_items` | Clerk only | `403` | |
| `POST /v1/onboarding/website/assistant/voice/recordings` | Voice recording | | | | `assistant_voice` | CMS `assistant_voice`. Clerk only | `403` | Onboarding guide recordings |
| `POST /v1/onboarding/website/assistant/voice/recordings/{id}/complete` | finish recording | | | | `assistant_voice` | Clerk only | `403` | |

### Activation

First pay (09). Not Usage & billing
`POST /v1/billing/subscription/checkout`. Table/DTOs stay
`website_activations` / `WebsiteActivation*`.

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/onboarding/activation/checkout` | strip island; pay CTA on `/onboarding/preview-and-edit/` | | `WebsiteActivationCheckoutRead` | | `website_activations` | First activation also signs up / creates the owner | | Website publication; browser Stripe success URL as truth; `/v1/website-activations/…`; `/v1/billing/subscription/checkout` |
| `GET /v1/onboarding/activation/status` | poll after checkout | | `WebsiteActivationStatusRead` | `website_activations` | | Closed `payment_status` + checkout URL if still needed | | |
| `POST /v1/webhooks/stripe` | Stripe | | | | `stripe_events`, `website_activations` | Verify, persist event; activation Checkout **inserts** `website_activation`; extra usage credit Checkout **inserts** `billing_extra_usage_credit`; subscription / `invoice.paid` **inserts** `billing_subscription_sync` | | Trust browser success URL |

Checkout / status auth: Clerk JWT, Host / `website_prefix`
(unactivated allowed) **or** (checkout only) Clerk JWT unactivated
tenant on the **app** origin. Webhook: Stripe signature. Never
`frontend-2`.

### Onboarding assistant (guide)

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/onboarding/assistant/voice/realtime-connection` | turn **voice guide** on | `OnboardingGuideRealtimeConnectionCreate` | `AssistantVoiceRealtimeConnectionRead` | `onboarding_sessions`, `ai.threads` | `assistant_runs`, `ai.threads` | Go picks region from business country. `tools=[]` | `403` activated; `409` `in_flight_run` | Long-lived voice API key; browser-chosen region; Find mount; profile writer |
| `POST /v1/onboarding/assistant/voice/transcripts` | committed utterances; usage-only when Voice turns off | `AssistantVoiceTranscriptCreate` | | | `assistant_conversation_items`, `assistant_runs` | Same shape as CMS transcripts. Go sets `created_at`. Settlement **200** | `403` activated | PCM; ASR/TTS deltas; recording file; `POST /v1/stt` |
| `GET /v1/onboarding/assistant/thread` | reload, resume, later Voice turn | | `AssistantThreadRead` | `ai.threads`, `assistant_conversation_items` | | Empty is `200` with `items: []` | `403` activated | `thread_items` field; `runs`; `provider_event`; recording URLs |

Policy: [onboarding assistant](assistant.md).

## Do not create

- Don't say setup: `/setup-sessions`, `…/from-google-place`,
  `profile/facts`
- separate consents resource, artifacts, contract-versions
- Don't say: preview-packages
- Don't say: `preview/{token}/module/{module}`
- Don't say claim: `…/claim`, `…/claim/checkout`, `…/package`,
  `approve-publish`, `request-changes`
- sandbox-actions, `generation-runs` from `frontend-2`
- `/v1/preview/{token}/…` and `/v1/website-previews/{token}/…`
- `/v1/website-activations/…` (checkout / status live under
  `/v1/onboarding/activation/…`)
- `/v1/onboarding/website-activation/…`
- `/v1/onboarding/website/activation/…`
- `POST /v1/onboarding/preview-website-address`
- `/v1/onboarding/website-editor/…`
- `/v1/website/editor/…` while unactivated (use
  `/v1/onboarding/website/editor/…`)
- the whole `/v1/onboarding-sessions/…` tree (including `{id}` on
  token-auth routes)
- `/v1/onboarding-sessions/confirm` (use
  `POST /v1/onboarding/business-lookup`)
- `POST /v1/onboarding/initiate`
- bare `POST /v1/onboarding`
- `GET …/profile/checklist`, `Checklist*`, SSE `checklist_row`, fill
  status `needs_confirmation`
- `POST …/profile/confirmations`,
  `POST …/profile/research-conflicts`, `*Confirmation*`,
  `ResearchConflictCreate`
- `PUT …/text-interview/autosave`,
  `POST …/text-interview/submissions`, `POST …/interview/submit`,
  `TextInterviewAutosave*`, `*Submission*`, `SubmitCreate`,
  `Initiate*`
- `GET …/business-research-runs`, leftover
  `…/apply-website-template-runs`
- `/v1/onboarding/assistant/…` after website activation (403)
- `/v1/onboarding/website/…` after website activation (403)
- leftover `/v1/onboarding-sessions/…` with an onboarding session
  token after website activation (403)
- `POST /v1/onboarding/assistant/thread/new` (CMS only)
- `POST /v1/onboarding/assistant/tool-calls`
- `POST /v1/onboarding/assistant/voice/tool-calls` this pass
  (`tools=[]`)
- `POST /v1/onboarding/assistant/turns`
- `POST /v1/onboarding/assistant/thread/clear`
- `GET /v1/onboarding/assistant/thread/ws` (no text backup)
- `POST /v1/onboarding/assistant/voice/recordings` and
  `…/recordings/{id}/complete` (onboarding does not store Voice
  recordings)
- unprefixed `POST /v1/onboarding/assistant/realtime-connection` /
  `…/transcripts` / `…/recordings`
- `POST /v1/stt` and `wss://…/v1/stt` (use live Voice transcripts)
- `OnboardingWebsiteEditor*` DTO aliases
