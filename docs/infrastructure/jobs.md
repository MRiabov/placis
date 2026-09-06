# Background jobs

Slow work runs off-request in `River` (Postgres-backed). `cmd/api` runs the
jobs in-process. The queue is the isolation, not a second container. Every
job can be retried safely (an explicit unique key). River-managed tables:
Postgres schema `jobs`. Workers live in the owning pipeline step file or
feature `jobs.go`. There is no `internal/jobs/` package.

There is no paid River workflows module and no workflow util. A **River
workflow** is the named sequence in `## Workflows`. The worker persists the
chunk, **inserts** the next River job kind, and completes the current job
in one transaction. Feature rows (`etl.runs`, `tenant_id`) are the
instance.

Named identifiers:
[docs conventions](../docs-conventions.md#named-identifiers). Closed
`## Workflows` and `## Jobs`. Overflow is `###` with a backticked River
job kind under Jobs (retry, after-09 leftover, skip unactivated). Meta
reconcile stays unnamed until ad posting is defined.

Crawl / Maps scrape stay in-process inside that River job kind’s extract worker;
API p90-delta during scrape: [processes.md](../general-architecture/processes.md).

## Workflows

| Workflow | Steps |
| --- | --- |
| `website_generation` | `select_and_copy_website_template`, `website_copy_generation` |
| `google_maps_listing` | `google_maps_listing_extract`, `google_maps_listing_transform` |
| `web_search` | `web_search_extract`, `web_search_transform` |
| `website_crawl` | `website_crawl_extract`, `website_crawl_transform` |
| `facebook` | `facebook_extract`, `facebook_transform` |
| `instagram` | `instagram_extract`, `instagram_transform` |
| `trade_registry` | `trade_registry_extract`, `trade_registry_transform` |
| `reviews_ranking_for_display` | `reviews_ranking_for_display` |
| `assistant_thread_compaction` | `assistant_thread_compaction` |
| `website_activation` | `website_activation` |
| `scheduled_etl` | `scheduled_etl` |

ETL workflow names are the [ETL run kind](../glossary.md) values. Each is
extract-to-raw then transform-to-profile, per chunk, same `etl.runs.id`.
`StartRun` **inserts** that ETL run kind’s extract River job kind. The
extract worker **inserts** transform; transform **inserts** the next extract
when ETL slow extract chunks remain. Sources fire in parallel (one
`etl.runs` row per ETL run kind). Photo classification and Projects are not
workflows; transform **calls** those packages.

`website_generation` does not include website 04. Share / CMS Publish
**calls** `PublishWebsite` on the request path. 09 **inserts**
`website_activation`, which then **calls** `PublishWebsite`.

`scheduled_etl` **calls** `StartRun(trigger=scheduled)`, which **inserts**
the extract River job kind that can start. It is not an extract/transform
step.

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `select_and_copy_website_template` | `tenant_id`, `website_id` | `website_id` while pending/running | **calls** `SelectWebsiteTemplate` then `CopyWebsiteTemplatePages` |
| `website_copy_generation` | `tenant_id`, `website_id` | `website_id` while pending/running | `GenerateWebsiteCopy` |
| `google_maps_listing_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/googlemaps.Run` |
| `google_maps_listing_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/googlemaps.Run` |
| `web_search_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/websearch.Run` |
| `web_search_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/websearch.Run` |
| `website_crawl_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/crawl.Run` |
| `website_crawl_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/crawl.Run` |
| `facebook_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/facebook.Run` |
| `facebook_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/facebook.Run` |
| `instagram_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/instagram.Run` |
| `instagram_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/instagram.Run` |
| `trade_registry_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/traderegistry.Run` |
| `trade_registry_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/traderegistry.Run` |
| `reviews_ranking_for_display` | `tenant_id` | `tenant_id` while pending/running | rank `in_pool` reviews for display |
| `ads_generate` | `tenant_id`, `ad_id` | `(tenant_id, ad_id)` while pending/running | `GenerateAdDraft` |
| `assistant_thread_compaction` | `thread_id` | `thread_id` while pending/running | compact `ai.threads` in place |
| `website_activation` | `tenant_id`, `checkout_session_id` | `tenant_id` while pending/running | `tenants.status=active`; **calls** `PublishWebsite` on the onboarding website; **calls** `ActivateSubscription` |
| `billing_extra_usage_credit` | Stripe checkout session id | checkout session id while pending/running | `ApplyExtraUsageCredit` |
| `billing_subscription_sync` | Stripe subscription id | Stripe subscription id while pending/running | `SyncSubscriptionFromStripe`; `invoice.paid` **calls** `AddIncludedUsageCredit`; `invoice.payment_failed` sets `nonpayment_started_at`; owner cancel at period end **calls** `UnpublishWebsite` |
| `billing_catalog_sync` | `event_id` or full-list | `event_id` when set; one global full-list while pending/running | `SyncCatalogFromStripe` (payload upsert, or one `Prices.List` on full-list) |
| `billing_nonpayment_unpublish` | none | one global row while pending/running | retrieve Stripe; unpaid after 3 calendar months → `canceled` + **calls** `UnpublishWebsite` |
| `scheduled_etl` | none | `tenant_id` while pending/running | **calls** `StartRun(trigger=scheduled)` |
| `describe_image` | `tenant_id`, `media_asset_id` | `(tenant_id, media_asset_id)` while pending/running | `DescribeImage` |
| `sweep_stale_media_uploads` | none | one global row while pending/running | delete stale `uploading` or upload-failed (`failed` + null `file_id`) |

Extract **must not** write `business_profile_*`. Transform **must not** call
source networks. Retry of this `run_id` reuses a fetch that already landed
for that chunk. Transform skip is `algorithm` + `schema_revision`.

### `select_and_copy_website_template`

Onboarding [05](../features/onboarding/pipeline/05-select-and-copy-website-template.md). `POST /v1/onboarding/interview/complete` **inserts** this River
job kind after inserting `websites` + reserving `website_prefix`. Website Select
website template then Copy the website template’s pages run in-process on that
`website_id`. Copy-pages **inserts** `website_copy_generation`. Fail →
`select_and_copy_website_template_failed`. Retry is a new insert of this River
job kind on the **same** `website_id` (prefix already reserved).

### `website_copy_generation`

Same job as onboarding [06](../features/onboarding/pipeline/06-website-copy-generation.md) and website [03](../features/website/pipeline/03-website-copy-generation.md). Unique on `website_id` while
pending/running. A second insert while pending/running is a River unique
conflict → HTTP **409**. Do not HTTP-check uniqueness before insert (it races).
Onboarding 06 is `bill_usage=unbilled`. CMS `POST /v1/websites` inserts this job
with `bill_usage=billed` when create ships. After Website activation the
leftover onboarding job stays in schema `jobs` on that `website_id` (not
cancelled). CMS PATCH / assistant HTTP are **not** 409 because this job is
running (`assistant.runs` is a different lock).

`thread_kind=website_copy_generation`, `prompt_id=website_copy_generation` in
the onboarding package `prompts.yaml` (onboarding) or the website package (CMS).
Insert one `ai.threads` row per website page before the first generate; reuse
that uuid only for schema-repair on that agent. Parallel website pages are
parallel threads. `ai_generations.thread_id` required. Worker: website copy
generation (`websiteRender`). Routes: [website HTTP](../features/website/api.md).

### `ads_generate`

Same job for **Create ad and generate** and **Generate again**. A second
insert while pending/running is a River unique conflict → HTTP **409**.
Do not HTTP-check uniqueness before insert (it races).

`thread_kind=ads_generate`, `prompt_id=ads_generate` in
`internal/ads/generation/prompts.yaml`. Worker:
[ads 02](../features/ads/ad-generation/pipeline/02-generate-ad-draft.md).
Routes: [ads HTTP](../features/ads/api.md).

### `reviews_ranking_for_display`

A second insert while the first is in flight is a River unique conflict —
treat as already queued. Not HTTP 409 (nothing HTTP-inserts this). After
the first completes, a later insert on the same tenant is allowed.

The worker always loads `in_pool` reviews, generates, and inserts a
`business_profile_review_rankings` batch (skip latest
`algorithm=human`). Same replace as Certifications and reviews PATCH.
`provisional` is **true** if overlapping ETL for this onboarding
enqueue is still running, else **false**. Scheduled ranking always
writes **false** (the run already `succeeded`). No pass field. No
`onboarding_session_id`.

The `profile` `jobs.go` worker **calls** the profile function. LLM:
`thread_kind=reviews_ranking_for_display`,
`prompt_id=reviews_ranking_for_display` in the profile package
`prompts.yaml`. `bill_usage=unbilled` until ETL is billed. Input:
current `in_pool` rows (id, citation/body, rating, origin,
`published_at`). Output: ordered `review_ids[]`, length 1–30,
each id in that pool. Prompt prose, ranking heuristics, and dated model
id are unspecified. Not stars or recency.
[AI layer](ai/README.md).

**Onboarding** insert: [build-profile](../features/onboarding/pipeline/build-profile.md) (after ETL fast extract has `in_pool`
reviews; again when that enqueue’s overlapping ETL runs finish if additional
rows landed). **Scheduled ETL** (Monday / Wednesday / Friday): after a scheduled
run **succeeds** and new `in_pool` rows landed, insert **once** (not per chunk).
ETL transform does not rank. Website does not insert this job.

`provisional` is not a skip key. A later
`reviews_ranking_for_display` may replace pins until owner PATCH
inserts `algorithm=human` (and `provisional=false`). When the enqueue’s
ETL finishes with **no** extra `in_pool` rows: insert a copy of the
latest batch with `provisional=false`, no second generate.

### `assistant_thread_compaction`

Worker: `internal/assistant/jobs.go`. The same in-process function as
today. Triggers:

- `ai.threads.last_activity_at` older than **12 hours**
  (`thread_kind=cms_assistant`)
- **text** `LLMProvider` prompt assembly would exceed **128K tokens**
- Voice **instructions** seed would be too large to send (`realtime-connection`
  create — not mid-utterance)

Keep the last **3 owner** and last **3 assistant** `thread_items` (plus
`tool_summary` / `thinking` in that tail). Older items become **one**
`assistant` summary in place; `compacted_through_item_id` advances. Kept
Voice items keep `offset_seconds` and `provider_event`. Summarize with a
cheap flash model (DeepSeek V4 Flash or current Qwen Flash — **pin a dated
id**, not `*-latest`). Write a new `ai_generations` row for that call (on
that `cms_assistant` thread). `bill_usage=bill-allow-out-of-balance`
(`usage_category=text`): debit when remaining > 0; remaining 0 still
compacts (**our usage** only). Does not rewrite existing
`ai_generations` rows.
Compaction prompt is assistant `prompts.yaml` (not Go). It does **not**
include a pending Ask-first reject notice as a special case. It **does**
include the Voice transcription notice when the thread has a
`channel=voice` run. Not a live xAI Voice connection trim. There is no 24h
discard. **Skip** threads whose tenant is `status=unactivated` (onboarding
website editor unpaid `current` must not compact — 12h, 128K overflow, or
compact-before-seed would refill the five unpaid prompts).

Onboarding 06 stays River job kind `website_copy_generation`. Each
website page’s agent is **20** tool-using model turns (same constant as
the CMS assistant, per website page).

### `website_activation`

Stripe `checkout.session.completed` **inserts** this River job kind and the
request returns when the Checkout is 09 activation (not extra usage, not
pay-again). Worker: onboarding
[09](../features/onboarding/pipeline/09-website-activation.md) (Clerk /
`tenants.status=active`, then **calls** `PublishWebsite` strip off, then
**calls** `ActivateSubscription` to **persist** `billing.subscriptions`
from that Checkout; it does not create a second Stripe Subscription).
Replay does not activate twice (`website_activations`, not this unique
key).

### `billing_extra_usage_credit`

Paid extra usage credit Checkout. `POST /v1/webhooks/stripe` **inserts** this
River job kind after `stripe_events`. Worker: `internal/billing/jobs.go`.
Worker **calls** `ApplyExtraUsageCredit`
(**persists into** `ai_use_ledger_entries` `entry_kind=extra_usage_credit`).
Replay of the same checkout session id is a unique conflict; do not insert a
second row. Not website activation. Routes:
[billing HTTP](../features/billing/api.md).

### `billing_subscription_sync`

Stripe subscription updated / deleted, `invoice.paid`, and
`invoice.payment_failed` (billing). Webhook **inserts** this River job
kind. Unique on Stripe subscription id while pending/running
(serialize). Worker: `internal/billing/jobs.go`. Worker **calls**
`SyncSubscriptionFromStripe`.

New paid period: **calls** `AddIncludedUsageCredit` (unique
`stripe_invoice_id`; do not insert a second `included_usage_credit` from
`checkout.session.completed` or from subscription-updated alone).
`invoice.paid` also clears `nonpayment_started_at`.
`invoice.payment_failed` sets `nonpayment_started_at` if null; does
**not** unpublish.

Owner-scheduled cancel at period end (`cancel_at_period_end` completed):
`status=canceled`, set `canceled_at`, **calls** `UnpublishWebsite`
(every website on that tenant). Unpaid dunning is **not** this immediate
unpublish — that is `billing_nonpayment_unpublish`.

Pay-again Checkout paid: new `stripe_subscription_id`, `status=active`,
`canceled_at` cleared, `stripe_customer_id` kept. Routes:
[billing HTTP](../features/billing/api.md).

### `billing_catalog_sync`

`product.*` / `price.*` on `POST /v1/webhooks/stripe` **inserts** this
River job kind with that `event_id`. Worker **reads**
`stripe_events.payload` and upserts/deactivates **that** Price /
Product. Not `Prices.List` per webhook. Empty `billing.prices` / boot
**inserts** one full-list job (one `Prices.List`; upsert all; deactivate
missing). Not on Checkout, catalogue GET, or `invoice.paid`. Worker:
`internal/billing/jobs.go`. Worker **calls** `SyncCatalogFromStripe`.

### `billing_nonpayment_unpublish`

Daily. Unique one global row while pending/running. For each
`billing.subscriptions` row whose `nonpayment_started_at` plus three
calendar months has elapsed: **retrieve** the Stripe Subscription and
latest invoice. If Stripe shows paid (missed webhook): clear
`nonpayment_started_at`, **calls** `AddIncludedUsageCredit` if that
invoice was not yet applied, do **not** unpublish. If still unpaid: set
`canceled` / `canceled_at` and **calls** `UnpublishWebsite` (every
website on that tenant). This Stripe GET is only here, not on Publish.
`billing_subscription_sync` also evaluates the clock when a webhook
lands. Worker: `internal/billing/jobs.go`. Website 01 occupancy
(6 months after `canceled_at`) is unchanged.

### `scheduled_etl`

Worker: `internal/etl/jobs.go`. Monday / Wednesday / Friday. Stagger
activated tenants. **Calls**
`StartRun(trigger=scheduled)` ([ETL](../features/etl/README.md)). Does not
inline extract.

### `describe_image`

Owner `POST /v1/media-assets/{id}/confirm-upload` **or** an ETL
transform **or** `CleanupMediaAsset` **inserts** this River job kind.
Transform **inserts** only when there is no classification yet. The
worker skips a new LLM row when latest matches `algorithm` +
`schema_revision`. `force` is ETL `StartRun` / transform only; this
job has no `force`. Do not wait inside transform. Unique
`(tenant_id, media_asset_id)` while pending/running — not `tenant_id`
alone. Dedicated queue, max workers **48**. Fail → retry that id only;
row stays `processing` until success or retries exhaust →
captioning-failed (`processing_status=failed`; `file_id` set). Sibling
photos are other job ids.

Worker: `internal/profile/media/jobs.go`.

`DescribeImage` **sends** media caption + `submit_image_visual_issues`
(`parallel_tool_calls=true`) and **writes**
`media_asset_classifications` (`photo_kind` `logo` or `photo`,
`content_hash` of this canonical `file_id`, `algorithm`,
`schema_revision`, `ai_generation_id`). Owner / `CleanupMediaAsset`
insert of this job: `bill_usage=bill-allow-out-of-balance`
(`usage_category=image`) — remaining 0 still classifies (**our usage**
only; not captioning-failed from usage credit). ETL insert:
`bill_usage=unbilled` from `StartRun`. Cleanup generate itself is
`bill_usage=billed`. Tool `clutter` maps to column
`clutter_severity` (same for the other seven). Never updates an old
classification. Then sets `media_assets.processing_status=ready`.
Record reasoning, output, and tool calls on `ai_generations`. Insert /
reuse `ai.threads` `thread_kind=media_cleanup` for this item. Must not
write `hero` / `project` / `service` / `founder` / `person`. Must not
write `pending_review` on the original owner or ETL row. Must not
auto-upres (`blur` / `overlay_text` / `subject_too_small` /
`low_resolution` are suggestions only). `WriteCanonicalWebP` and
`WriteImageThumbnail` already ran in confirm-upload / ETL insert.

First-upload auto-cleanup only when feature flag `media_auto_cleanup`
is on (default off). Then when **latest** `photo_kind=photo` **and**
`clutter_severity` / `busy_background_severity` /
`poor_lighting_severity` / `color_cast_severity` is not null (high
first): **calls** `CleanupMediaAsset` (no owner prompt). Skip when
the flag is off, latest is `logo`, or there is no classification yet.
When the flag is off: classify, set `ready`, **do not** **call**
`CleanupMediaAsset`. No child. Auto path does not **call**
`AssertUsageCredit`. When it **calls**: original stays `ready` +
`approved`. Child: new original + canonical + thumbnail,
`pending_review`, `parent_media_asset_id`, inherit `supplied_by` /
`created_by`, `cleaned_up_with_ai=true`. `CleanupMediaAsset` **calls**
`WriteCanonicalWebP` then `WriteImageThumbnail` on the child and
**inserts** `describe_image` on the child.
Routes: [media library HTTP](../features/other/media/api.md).
Named flags: [feature flags](config.md).

### `sweep_stale_media_uploads`

Worker: `internal/profile/media/jobs.go`. Periodic insert from the same
`cmd/api` in-process River workers as
`scheduled_etl`. Not crontab. Not list/GET handler deletes. Args none;
unique one global row while pending/running. **Do:** delete
`media_assets` older than the website-editor leave-guard window
([editing.md](../features/website/editing.md)) that are `uploading`
**or** upload-failed (`failed` + null `file_id`). Must not delete
captioning-failed (`failed` + `file_id` set). Age lives only here.
`ListMediaAssets` omits those in-flight `uploading` rows immediately.
