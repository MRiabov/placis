# Onboarding HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Business lookup, resume, client interview, SSE, website activation,
onboarding assistant (guide), unpaid media library (interview upload).
Details after website activation:
[details HTTP](../business-profile/details/api.md). Unpaid
`update_details` / Revert: wrappers below, not that tree. Selecting and
copying the website template is owned by [website](../website/api.md);
this feature only **inserts** it.

**Auth default:** onboarding session token (request header; token uniquely
identifies the `onboarding_sessions` row). **None:** Find typeahead.
**Business lookup:** none (create) or that onboarding session token (must name a
row). **Clerk JWT** Host / `website_prefix` or Clerk unactivated on the app
origin: activation checkout / status. **Clerk JWT** unactivated on the app
origin: unpaid POST website pages, Details PATCH / undo. **Stripe signature:**
`POST /v1/webhooks/stripe`. Activated owner: **403** on
`/v1/onboarding/assistant/…`, `/v1/onboarding/website/…`,
`/v1/onboarding/business-profile`, and leftover
onboarding session token routes. Mutating Routes send `Idempotency-Key`.
Token-auth Routes have **no** onboarding-session `{id}` in the path. Unactivated
**403** on `/v1/websites/{website_prefix}/editor`, `/v1/assistant/…`, and
`/v1/business-profile`. Unactivated **403** on `/v1/media-assets/…` (use
`/v1/onboarding/media-assets/…`) and on `/v1/projects` (use nested
`profile.projects` and `POST /v1/onboarding/projects/{projectId}/archive`).
Unpaid website editor uses
`onboarding_sessions.website_id`.

Serve-only jsonb (not a DTO field dump): company registry / Maps
search **omit** `raw`; ETL fetch `raw` **omit**; Stripe event body
**omit**; extra notes are `string`. SSE uses Huma `sse.Register` event
name → struct, not an unconstrained `payload`. Fill status lives on
`OnboardingProfileRead` (not a checklist `*Read`).

## DTOs

### Find

| DTO | Fields | Description |
| --- | --- | --- |
| `BusinessLookupCreate` | `country`, `online_research_consent`, `company_number`, `place_id`, `website_url` | Create or scratch 01. `country` default `ie`. Consent required. Registry and/or Maps. Extra keys 4xx |
| `CompanyRegistrySearchGet` | `country`, `q` | Find typeahead query |
| `CompanyRegistryRecordRead` | `company_number`, `legal_name`, `registered_office`, `company_status` | Typeahead row. **Omit** `raw` |
| `GoogleMapsSearchGet` | `country`, `q` | Find typeahead query |
| `GoogleMapsListingRead` | `place_id`, `display_name`, `formatted_address` | Typeahead row. **Omit** Maps `raw` |

### Profile

| DTO | Fields | Description |
| --- | --- | --- |
| `OnboardingProfileRead` | `id`, `token`, `status`, `preview_website_address`, `fill: []OnboardingFillStatusRead`, `conflicts: []OnboardingResearchConflictRead`, `profile: OnboardingLiveBusinessProfileRead` | Lookup / resume / Review hydrate. `token` → `localStorage` on create; echoed on GET. `preview_website_address` after 08 Preview website address; omit before Share. Not Details GET |
| `OnboardingFillStatusRead` | `key`, `status` | Derived fill. `status` → `empty` / `in_progress` / `conflict` / `filled_by_user` / `filled_by_research` / `skipped` / `not_applicable` |
| `OnboardingResearchConflictRead` | `key`, `live_value`, `research_value` | Research conflict (both values). Not a write |
| `OnboardingLiveBusinessProfileRead` | `display_name`, `trade`, `description`, `founder_name`, `legal_name`, `company_number`, `registered_office`, `vat_registration_status`, `vat_number`, `contact_name`, `marketing_phone`, `marketing_email`, `existing_site_url`, `emergency_phone`, `opening_hours`, `services`, `service_areas`, `accreditations`, `reviews`, `projects: []ProjectRead`, `facebook_profile_url` | Live columns plus reviews and ranked Project cards. Same row as Details plus `projects` (top 4 `active` business-research origin; [build-profile](pipeline/build-profile.md) rank). Not media library items (`GET /v1/onboarding/media-assets`). Same [`ProjectRead`](../business-profile/projects/api.md) as `/cms/projects`. Cover is `cover_media_asset_id` into the media library. Empty `projects` → omit the Projects block. Onboarding session token. No `company_status` |

### Client interview

| DTO | Fields | Description |
| --- | --- | --- |
| `ClientInterviewUpdate` | `display_name`, `trade`, `description`, `founder_name`, `contact_name`, `marketing_phone`, `marketing_email`, `existing_site_url`, `emergency_phone`, `opening_hours`, `vat_registration_status`, `vat_number`, `services`, `service_areas`, `accreditations`, `additional_notes`, `skipped` | Dirty keys only. PUT click-off; optional POST complete body. Extra keys 4xx |

### Progress

| DTO | Fields | Description |
| --- | --- | --- |
| `OnboardingBusinessProfileEvent` | `profile: OnboardingLiveBusinessProfileRead`, `fill: []OnboardingFillStatusRead`, `conflicts: []OnboardingResearchConflictRead` | SSE `business_profile` |
| `OnboardingTimelineStepEvent` | `step` | SSE `timeline_step` |
| `OnboardingWebsitePreviewReadyEvent` | `ready` | SSE `website_preview_ready` |

### Website

| DTO | Fields | Description |
| --- | --- | --- |
| `PreviewWebsiteAddressRead` | `url` | Share (08). Website preview link |

Unpaid website editor canvas reuses CMS website editor DTOs (`WebsiteEditorGet`,
`WebsitePageSummaryRead`, `WebsitePageRead`, `WebsitePageCreate`,
`WebsitePageUpdate`, `WebsiteEditApplyRead`, `WebsiteMenusRead`,
`WebsiteMenusUpdate`). Unpaid Details write reuses
`BusinessProfileUpdate` / `BusinessProfileRead`.

### Activation

| DTO | Fields | Description |
| --- | --- | --- |
| `WebsiteActivationCheckoutRead` | `checkout_url`, `clerk_org_id` | Checkout URL + Clerk org id for `setActive`. **Omit** Stripe bodies |
| `WebsiteActivationStatusRead` | `payment_status` | Poll after checkout. No `checkout_url` |

### Onboarding assistant (guide)

| DTO | Fields | Description |
| --- | --- | --- |
| `OnboardingGuideRealtimeConnectionCreate` | `step`, `visible_fields` | Voice create. Current onboarding step + visible fields. No unpublished website |
| `AssistantVoiceRealtimeConnectionRead` | `secret`, `expires_at`, `realtime_url` | Same CMS DTO. Browser-safe secret + expiry + `wss://{region}.api.x.ai/v1/realtime` |
| `AssistantVoiceTranscriptsCreate` | `events`, `usage`, `internal_reasoning` | Same CMS DTO. Closed union of committed xAI Voice events. **Omit** PCM. Server derives `offset_seconds` |
| `AssistantThreadRead` | `id`, `status`, `last_activity_at`, `items: []AssistantThreadItemRead` | Same CMS DTO. Guide hydrate. Empty is `items: []` |
| `AssistantThreadItemRead` | `thread_item_kind`, `body`, `icon`, `offset_seconds`, `created_at` | Same CMS DTO. Ordered item. **Omit** `provider_event` |

Unpaid website assistant and the guide reuse CMS thread/voice DTO names
and fields as-is (no `OnboardingWebsiteEditor*` aliases; no
`AssistantVoiceTranscriptCreate` / `client_secret` / request
`offset_seconds` / `reasoning`). GET thread **omits** `runs`.

## Routes

### Find

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/onboarding/business-lookup` | `/onboarding/find` (no token); `/onboarding/review` (valid token) | `BusinessLookupCreate` | `OnboardingProfileRead` | `onboarding_sessions` | `tenants`, `onboarding_sessions`, `business_profiles` | **calls** `LookupBusiness`: no onboarding session token creates; valid token + same attach keys is safe to retry 200; different keys scratch 01 and **inserts** 02 | `401` unknown token; `429` `onboarding_enqueue_cap`; `403` activated; 4xx after 05 | Select or copy the website template; wait for 02; mount/keystroke POST; second tenant for same token; create on unknown token; IP cap |
| `GET /v1/onboarding/find/search/company-registry` | Find typeahead | `CompanyRegistrySearchGet` | `CompanyRegistryRecordRead` | | | Debounced. **Omit** `raw` | | Persist; upsert listings |
| `GET /v1/onboarding/find/search/google-maps` | Find typeahead | `GoogleMapsSearchGet` | `GoogleMapsListingRead` | | | Debounced. **Omit** Maps `raw` | | Upsert `etl.google_maps_listings`; insert fetches |

Auth on Find search: none. `POST /v1/onboarding/business-lookup`: none
(create) or onboarding session token that names a row.

### POST /v1/onboarding/business-lookup

**Create** the unactivated tenant + onboarding session when there is no
onboarding session token (once per browser token). Consent is this body
field, not a `/research-consent` resource. Country persists on
`tenants.country`. An onboarding session token that does not name a row
is **401** (do not create). A valid token
with `status=client_interviewing` and the same attach keys
(`place_id`, `company_number`, `website_url`; omitted = null) is
safe to retry **200**: no wipe, no `StartRun`, in-flight 02 keeps running.
Different attach keys are scratch 01 (re-init live profile, this pick’s
increments, new 02). Five distinct `enqueue_id`s (`trigger=onboarding`)
in 30 minutes on that tenant: scratch is **429** `onboarding_enqueue_cap`
(optional `Retry-After`); no wipe; current 02 keeps running. First lookup
never hits that cap. Status not `client_interviewing` → 4xx. Activated
leftover token → **403**.

### Profile

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/onboarding/profile` | Resume; Review; client interview hydrate; re-show `preview_website_address` after 08 Preview website address | | `OnboardingProfileRead` | `onboarding_sessions`, `business_profiles`, `business_profile.projects`, `website_publications`, `etl.runs` | | Nested live business profile (including ranked `projects`) + research conflict + fill status. After 08 Preview website address, `preview_website_address` is set so resume can paint the URL again | | ETL fetch `raw`; checklist resource; nest photos / `MediaAssetRead[]` |

### Client interview

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PUT /v1/onboarding/interview` | click-off / periodic save | `ClientInterviewUpdate` | `OnboardingProfileRead` | `onboarding_sessions`, `business_profiles`, `business_profile.projects` | `client_interview_submissions`, `business_profile_edits`, `onboarding_sessions` | **calls** `SaveTextClientInterview`. `submission_kind=autosave`. Succeeds when the complete gate would fail. Nested `profile.projects` is the same ranked cards as GET profile | | Start 05; `/autosave` |
| `POST /v1/onboarding/interview/complete` | Continue | `ClientInterviewUpdate` | `OnboardingProfileRead` | `onboarding_sessions`, `business_profiles`, `business_profile.projects` | `client_interview_submissions`, `business_profile_edits`, `business_profiles`, `onboarding_sessions` | **calls** `CompleteClientInterview`. Optional last dirty answers. Gate; `accepted_edit_id`; **inserts** `select_and_copy_website_template`. Nested `profile.projects` is the same ranked cards as GET profile | `409` gate | PUT-then-POST hop; `/submit`; second complete; `generation-runs` from `frontend-3` |
| `POST /v1/onboarding/projects/{projectId}/archive` | interview Project cards | | `OnboardingProfileRead` | `business_profile.projects` | `business_profile.projects`, `business_profile_edits` | `active` → `archived`, `algorithm=human`; `project_sources` kept; **calls** `ArchiveProject` (same `list=projects` increment as CMS). Body is the nested live profile with ranked `projects` (archived id gone; next-ranked `active` may appear) | | `POST /v1/projects/{id}/archive`; DELETE; interview Approve; guide tool; `GET /v1/projects` while unactivated |

### POST /v1/onboarding/interview/complete

Continue **is** submit. One hop. Optional body empty if click-off
already saved. Gate fail stays `client_interviewing`. Exactly one
complete → 05. Complete does not require photos.

### Media library (unactivated)

Onboarding image gallery + first upload. Same tails as
[`/v1/media-assets/…`](../other/media/api.md) for list and the three
upload hops. The CMS media library is active tenant only. Policy wrapper:
onboarding session token; **calls** `ListMediaAssets` /
`StartMediaAssetUpload` / `ConfirmMediaAssetUpload`. Same DTOs
(`MediaAssetListGet`, `MediaAssetRead`, `MediaAssetCreate`,
`MediaAssetUploadRead`). Browser **PUT** to `upload_url` (R2; Go never
sees the body). Do not wrap crop / replace / cleanup / reject.

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/onboarding/media-assets` | onboarding image gallery; resume; re-GET on each SSE `business_profile` while the client interview is open | `MediaAssetListGet` | `MediaAssetRead[]` | `media_assets`, `media_asset_classifications` | | Same as CMS list. Onboarding session token. Client interview live-fill for photos (not nested on the live profile DTO) | `403` activated | `/v1/media-assets` while unactivated; paginate; nest photos on `OnboardingLiveBusinessProfileRead` |
| `POST /v1/onboarding/media-assets/start-upload` | **Upload photos**; complete-warning **Add photos** | `MediaAssetCreate` | `MediaAssetUploadRead` | | `media_assets`, `files` | **calls** `StartMediaAssetUpload`. Same `Idempotency-Key` returns the same id + `upload_url` | `403` activated | `/v1/media-assets/start-upload` while unactivated; take the photo body; `/v1/onboarding/media/upload/` |
| `POST /v1/onboarding/media-assets/{id}/confirm-upload` | After PUT succeeds | | `MediaAssetRead` | `media_assets`, `files` | `media_assets`, `files` | **calls** `ConfirmMediaAssetUpload`; **inserts** `describe_image` | `403` activated; `404`; scan/decode fail | Take the photo body; crop / replace / cleanup |

Auth: onboarding session token. `status=active` → **403**.

### Progress

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/onboarding/events/stream` | `/onboarding/preview`; Review while 02 runs; `/onboarding/interview` live fill; `/onboarding/preview-and-edit/` while 06 runs | | `OnboardingBusinessProfileEvent` / `OnboardingTimelineStepEvent` / `OnboardingWebsitePreviewReadyEvent` | `etl.runs`, `business_profiles`, `business_profile.projects`, `onboarding_sessions` | | Huma `sse.Register`. Event names `business_profile`, `timeline_step`, `website_preview_ready`. `business_profile.profile` includes ranked `projects`. Photos are not on that payload — interview re-GETs `/v1/onboarding/media-assets` | | Unconstrained `payload`; `checklist_row`; contractor host; `research_wait_until`; nest photos on `profile` |

### Website

Unpaid website editor canvas. Same tails as
`/v1/websites/{website_prefix}/editor/…`. CMS website editor is active tenant
only. Policy: [website-editor.md](website-editor.md). GET website pages / website page: onboarding
session token or Clerk unactivated. Top menu and footer hydrate is that website
page GET. POST website pages, PATCH website pages / top menu and footer: Clerk
unactivated only (tenant from `clerk_user_id` bind until org claim). Share:
onboarding session token or Clerk unactivated. Send / Voice: Clerk only.
`status=active` → **403**.

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/onboarding/website/editor/pages` | `/onboarding/preview-and-edit/` | `WebsiteEditorGet` | `WebsitePageSummaryRead` | `website_pages`, `website_sections`, `website_slots`, `media_assets` | | Same as CMS list (per website page `blockers[]`). No `publication_id` | `403` activated | `/v1/websites/{website_prefix}/editor`; contractor host GET |
| `POST /v1/onboarding/website/editor/pages` | `create_page` apply | `WebsitePageCreate` | `WebsitePageRead` | | `website_pages`, `website.menus` | **calls** `CreateWebsitePage`. Same as CMS POST. Clerk only. Append a top-level website page node on the footer, and on the top menu unless legal or cap. Website editor canvas follows `open_website_page` | `403`; `409` | Onboarding session token POST; CMS `POST /v1/websites/{website_prefix}/editor/pages` while unactivated |
| `GET /v1/onboarding/website/editor/pages/{page_id}` | website editor canvas hydrate | `WebsiteEditorGet` | `WebsitePageRead` | `website_pages`, `website_sections`, `website_slots`, `website.menus`, `website_settings`, `website_forms`, `website_slot_reviews`, `website_publications`, `media_assets` | | Same as CMS hydrate. No `publication_id` | `403` activated; `404`/`400` | `/v1/websites/{website_prefix}/editor`; `/settings` GET; `/menus` GET; `website_manifest`; embed `media_assets[]` |
| `PATCH /v1/onboarding/website/editor/pages/{page_id}` | Assistant apply; website editor canvas | `WebsitePageUpdate` | `WebsiteEditApplyRead` | `website_pages`, `website_settings`, `edit_history`, `website_sections`, `website_slots`, `media_assets` | `website_slots`, `website_sections`, `website_pages`, `website_forms`, `website_form_fields`, `website.menus`, `edit_history`, `website_settings.edit_history_head` | Same as CMS PATCH. Clerk only. Ack `blockers[]` for that website page | `403`; `409 edit_history_conflict`; `413`; `429` | Onboarding session token PATCH |
| `PATCH /v1/onboarding/website/editor/menus` | top menu / footer | `WebsiteMenusUpdate` | `WebsiteEditApplyRead` | | `website.menus`, `edit_history` | Same as CMS menus PATCH. Clerk only. Hydrate is the website page GET `menus`. Omit `blockers` | `403`; `409 edit_history_conflict` | Onboarding session token PATCH; `GET /menus`; top menu / footer on website page PATCH |
| `POST /v1/onboarding/website/publications` | **Share** on `/onboarding/preview-and-edit/` | | `PreviewWebsiteAddressRead` | `onboarding_sessions`, `website_settings` | `website_addresses`, `website_publications` | **calls** `SharePreviewWebsiteAddress` (08) | | Require website activation; auto-run at wait-end; `/v1/website-previews/{token}/…`; CMS `POST /v1/websites/{website_prefix}/publications` |
| `GET /v1/onboarding/website/assistant/thread` | unsigned land; hydrate | | `AssistantThreadRead` | `ai.threads`, `assistant.thread_items` | `ai.threads` | Lazy-create empty `current`. Omits `runs` | `403` activated | `/v1/assistant/…`; `/v1/onboarding/assistant/…` |
| `GET /v1/onboarding/website/assistant/thread/ws` | text chat | | | `ai.threads` | `assistant.thread_items`, `assistant.runs` | CMS text socket. Clerk only | `403`; `409` `unpaid_prompt_cap` | Onboarding session token send |
| `POST /v1/onboarding/website/assistant/voice/realtime-connection` | Voice on | | `AssistantVoiceRealtimeConnectionRead` | | `assistant.runs` | Clerk only | `403`; `409` `unpaid_prompt_cap` | Onboarding session token Voice |
| `POST /v1/onboarding/website/assistant/voice/tool-calls` | Voice tools | | | | | CMS tools; Clerk only | `403`; `409` | |
| `POST /v1/onboarding/website/assistant/voice/transcripts` | committed utterances | `AssistantVoiceTranscriptsCreate` | | | `assistant.thread_items` | Clerk only | `403` | |
| `POST /v1/onboarding/website/assistant/voice/recordings` | Voice recording | | | | `assistant_voice` | CMS `assistant_voice`. Clerk only | `403` | Onboarding guide recordings |
| `POST /v1/onboarding/website/assistant/voice/recordings/{id}/complete` | finish recording | | | | `assistant_voice` | Clerk only | `403` | |

### Details (unpaid)

Signed-in unpaid `update_details` and notification Revert. Same DTOs as
[details HTTP](../business-profile/details/api.md). **calls**
`UpdateBusinessProfile` / `UndoBusinessProfileEdit`. Client interview
stays `PUT /v1/onboarding/interview`. CMS `/v1/business-profile` stays
active tenant (**403** unactivated). Clerk unactivated only.
`status=active` → **403**.

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PATCH /v1/onboarding/business-profile` | unpaid `update_details` | `BusinessProfileUpdate` | `BusinessProfileRead` | `business_profiles` | `business_profiles`, `business_profile_edits`, `business_profile_services`, `business_profile_service_areas`, `business_profile_opening_hours` | **calls** `UpdateBusinessProfile`. Same increment writer as CMS PATCH. Clerk only | `403` | Onboarding session token PATCH; `PUT /v1/onboarding/interview`; `/v1/business-profile` while unactivated |
| `POST /v1/onboarding/business-profile/edits/{id}/undo` | unpaid notification **Revert** | | `BusinessProfileRead` | `business_profile_edits`, `business_profiles` | `business_profiles`, `business_profile_edits` | **calls** `UndoBusinessProfileEdit`. Clerk only | `403`; `409` if already undone or not the named increment | Onboarding session token; CMS `POST /v1/business-profile/edits/{id}/undo` while unactivated |

### Activation

First pay (09). Not Usage & billing
`POST /v1/billing/subscription/checkout`. Table/DTOs stay
`website_activations` / `WebsiteActivation*`. Line items **read**
`billing.prices`. Success/cancel URLs named for preview website
address vs app origin. Frontend follows `checkout_url` to hosted
Checkout. **Omit** Stripe bodies.

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/onboarding/activation/checkout` | strip island; pay CTA on `/onboarding/preview-and-edit/` | | `WebsiteActivationCheckoutRead` | `tenants`, `billing.prices` | `website_activations`, `tenants.clerk_org_id` | **calls** `AttachClerkOrganization`; frontend `setActive` then hosted Checkout; line items: active activation Price + Placis Pro plan / month Price; metadata / `client_reference_id` = `tenant_id`; does not set `status=active` | missing Price | Website publication; browser Stripe success URL as truth; `/v1/website-activations/…`; `/v1/billing/subscription/checkout`; `POST /v1/me/clerk-organization`; ad-hoc `price_data` |
| `GET /v1/onboarding/activation/status` | poll after checkout | | `WebsiteActivationStatusRead` | `website_activations` | | Closed `payment_status` (`pending` / `paid` / `refunded`). Need a URL again → POST checkout | | `checkout_url` |
| `POST /v1/webhooks/stripe` | Stripe | | | | `stripe_events`, `website_activations` | See overflow | | Trust browser success URL |

Checkout / status auth: Clerk JWT, Host / `website_prefix`
(unactivated allowed) **or** (checkout only) Clerk JWT unactivated
tenant on the **app** origin. Webhook: Stripe signature. Never
`frontend-3`.

### POST /v1/webhooks/stripe

Verify (`webhook.ConstructEvent`), **persist into** `stripe_events`
(`event_id` unique; `processed` when the River job is inserted or the
type needs no job). Closed event list:

- `checkout.session.completed` — discriminate: 09 activation **inserts**
  `website_activation`; extra usage credit **inserts**
  `billing_extra_usage_credit`; pay-again **inserts**
  `billing_subscription_sync`
- `checkout.session.expired` — `stripe_events` only (`processed`; no
  River job; no `website_activations` write). Need a URL again → POST
  checkout
- `customer.subscription.updated` / `deleted` — **inserts**
  `billing_subscription_sync`
- `invoice.paid` / `invoice.payment_failed` — **inserts**
  `billing_subscription_sync`
- `product.*` / `price.*` — **inserts** `billing_catalog_sync`
  (`event_id`)
- `charge.refunded` — `website_activations.payment_status=refunded`
  (money-only; does not un-activate; extra usage credit row stays)

Do not grant `included_usage_credit` from `checkout.session.completed`
(that is `invoice.paid`). Omit Stripe bodies from HTTP.

### Onboarding assistant (guide)

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/onboarding/assistant/voice/realtime-connection` | turn **voice guide** on | `OnboardingGuideRealtimeConnectionCreate` | `AssistantVoiceRealtimeConnectionRead` | `onboarding_sessions`, `ai.threads` | `assistant.runs`, `ai.threads` | Go picks region from business country. `tools=[]` | `403` activated; `409` `in_flight_run` | Long-lived voice API key; browser-chosen region; Find mount; profile writer |
| `POST /v1/onboarding/assistant/voice/transcripts` | committed utterances; usage-only when Voice turns off | `AssistantVoiceTranscriptsCreate` | | | `assistant.thread_items`, `assistant.runs` | Same CMS DTO. Go sets `created_at` and `offset_seconds`. Settlement **200** | `403` activated | PCM; ASR/TTS deltas; recording file; `POST /v1/stt`; request `offset_seconds` |
| `GET /v1/onboarding/assistant/thread` | reload, resume, later Voice turn | | `AssistantThreadRead` | `ai.threads`, `assistant.thread_items` | | Empty is `200` with `items: []` | `403` activated | `thread_items` field; `runs`; `provider_event`; recording URLs |

Policy: [onboarding assistant](assistant.md).

## Do not create

- Don't say setup: `/setup-sessions`, `…/from-google-place`,
  `profile/facts`
- separate consents resource, artifacts, contract-versions
- Don't say: preview-packages
- Don't say: `preview/{token}/module/{module}`
- Don't say claim: `…/claim`, `…/claim/checkout`, `…/package`,
  `approve-publish`, `request-changes`
- sandbox-actions, `generation-runs` from `frontend-3`
- `/v1/preview/{token}/…` and `/v1/website-previews/{token}/…`
- `/v1/website-activations/…` (checkout / status live under
  `/v1/onboarding/activation/…`)
- `/v1/onboarding/website-activation/…`
- `/v1/onboarding/website/activation/…`
- `POST /v1/onboarding/preview-website-address`
- `/v1/onboarding/website-editor/…`
- `/v1/onboarding/website/editor/blockers`
- `/v1/websites/{website_prefix}/editor/…` while unactivated (use
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
- `/v1/onboarding/business-profile` after website activation (403)
- leftover `/v1/onboarding-sessions/…` with an onboarding session
  token after website activation (403)
- `PUT /v1/onboarding/sources`
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
- `GET /v1/onboarding/website/editor/menus` (hydrate is the website
  page GET `menus`)
- `OnboardingWebsiteEditor*` DTO aliases
- `/v1/onboarding/website/editor/business-profile`
- `/v1/business-profile` while unactivated (use
  `/v1/onboarding/business-profile`)
- `/v1/onboarding/media/upload/`
- `/v1/media-assets/…` while unactivated (use
  `/v1/onboarding/media-assets/…` for list / start-upload /
  confirm-upload)
- `PATCH` / replace / cleanup / reject under
  `/v1/onboarding/media-assets/`
- `photos_fill` on `ClientInterviewUpdate` / `client_interview_submissions`
- `photos` / `MediaAssetRead[]` on `OnboardingLiveBusinessProfileRead`
- `GET /v1/projects` while unactivated (use nested `profile.projects`)
- `GET /v1/onboarding/projects`
