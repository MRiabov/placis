# LLM layer

The LLM sits behind `LLMProvider` so prompts, model names, response shapes, and
cost logging never leak into domain logic. Shared `ai` owns **every vendor
AI interface** (`LLMProvider` generate, Voice adapter, image generate/cleanup
on that generate) and its implementation. Open-web search is the same
generate with a Gateway web-search tool, not a second billed call.

Generation uses the Vercel AI SDK.
**Open-web search is Parallel as a Vercel AI Gateway server tool**
(`gateway.tools.parallelSearch()`) — not OpenRouter, not a model's built-in
search, not Exa, Perplexity, or Tako, not Parallel's **Search** API directly
(onboarding ADR 5a). Known-URL crawl **text** may call Parallel **Extract**
(`PARALLEL_API_KEY` → `https://api.parallel.ai/v1/extract`) from website crawl;
that is not Search. Parallel Search returns excerpts; a follow-up generation
over retrieved text is a Vercel generation call with no search tools. Generation
and search share Vercel; there is no OpenRouter hop.

- **Prompts live in per-feature `prompts.yaml`, not in Go.** The feature that
  issues the LLM call owns the file (`go:embed` in that package): CMS Assistant
  wrap-up / reject / STT / compaction / Voice seed prompt in `assistant`; Ads
  generate / Review **inline AI assistance** in `ads`; media library cleanup in
  the media package; project title/description **inline AI assistance** in
  projects; onboarding 06 in onboarding; reviews ranking for display in
  `profile`; ETL usable-as-a-Project classify / crawl parse in the ETL package.
  ETL extract/transform generation uses **`glm-5.3-flash`** (dated gateway id;
  do not ride `*-latest`) via `LLMProvider` — same cheap multimodal model when
  the input is text-only. Do not put product prompt prose in Go strings, and do
  not keep one global `internal/ai/prompts.yaml`. `ai` is those vendor
  interfaces + traces; it records `prompt_id` / `prompt_version` from that file
  (id + format revision). Assistant **product knowledge** is a separate
  **knowledge base registry** (YAML + markdown `go:embed` in the assistant
  packages), not `prompts.yaml` and not RAG. CMS and onboarding both list the
  shared product glossary (`internal/knowledge/product_glossary.md`: Domain +
  Enums + Don't say). Voice pronunciation / keyterms are
  `internal/knowledge/voice_pronunciation.yaml`, not `prompts.yaml`. Interpolate
  with `{{var}}`. Nested fields (business profile has many) use a dotted path:
  `{{aaa.bbb}}`. Same spelling as a [website placeholder](../features/website/variables.md) when the value is a
  profile detail; prompts.yaml is not unpublished website copy. Go fills
  `{{var}}`; it does not own the prompt text.
- Output is parsed against a schema before it enters the app. A mismatch is
  **repaired under a bounded contract**: repair only the smallest subtree that
  fails (never regenerate the whole answer), discard or reject unknown fields
  per the schema, and never accept a partial result — the output is
  whole-and-valid or it is a failed generation, nothing in between.
- **Every AI call is recorded so it can be reconstructed later**: the reasoning,
  the visible answer, and the tool calls — plus the model, the prompt id and
  format revision, and the usage and cost. That includes text, voice, and image
  generate/cleanup. **`input` is the exact text sent** (text-turn assembled
  prompt; Voice-connection instructions at create, including keyterms /
  `replace` on that row). Prompt id / knowledge id are not a substitute for that
  `input`. Voice **cost** is xAI audio minutes plus text-item fees, not token
  counts — leave `input_tokens` / `output_tokens` null on those rows
  ([billing](../features/billing/README.md)). Voice utterance reconstructability is the forwarded xAI JSON on
  `thread_items.provider_event` (onboarding:
  `assistant_conversation_items.provider_event`) **plus** that run’s `input`
  (instructions / system prompt). Reconstruct a Voice conversation from
  `input` + ordered thread items (`thread_item_kind` / `body` /
  `offset_seconds`) + `provider_event` + `output` / `tool_calls` /
  `internal_reasoning`. Hydrate of the assistant thread does **not** read this
  table or `provider_event`. **Every call belongs to a thread**
  (`ai_generations.thread_id` required) so a schema mismatch can retry on the
  same thread (failed row stays; the next attempt is another generation).
  `LLMProvider` always receives `thread_id`.

## BillUsageMode

[`BillUsageMode`](../glossary.md#billusagemode) is the generic spend
enum, not AI-only. `ai` vendor methods take **`bill_usage`** and
`thread_id`. ETL `StartRun` takes it too (currently `unbilled`). Do not
pass `bill_tenant`. Do not pass a `billed` / `unbilled` bool. Omit /
zero = `billed`. **Who** to debit for an `ai` call is
`threads.tenant_id`. Require `usage_category` when recording **their
usage**. Features **must not** **call** `RecordAIUseSpend` after an
`ai` call (or after `StartRun`’s LLM).

Two records on an `ai` vendor-hit:

- **Our usage** — vendor-hit **writes** `ai_generations` (`cost_amount`
  / tokens, or Voice minutes + text-item fees). All three modes do this
  when the vendor ran. Usage & billing never shows this.
- **Their usage** — `RecordAIUseSpend` (`entry_kind=spend`, ×5) on that
  thread’s tenant. Skip when `bill_usage=unbilled`, or `threads.tenant_id`
  is null (`eval`), or `tenants.status=unactivated`.

| `bill_usage` | Remaining 0 | Remaining > 0 |
| --- | --- | --- |
| `billed` | No vendor call. Out of usage credit (**402** / job fail) | Vendor; **our usage** + **their usage** |
| `unbilled` | Vendor; **our usage** only | Vendor; **our usage** only |
| `bill-allow-out-of-balance` | Vendor; **our usage** only; must not fail | Vendor; **our usage** + **their usage** |

No vendor call (skip LLM) → neither record. `internal/ai`
**calls** `AssertUsageCredit` / `RecordAIUseSpend` (`internal/billing`).
ETL billed later uses the same remaining-0 rules (job fail, not HTTP
**402**). `billing` must not import feature tool packages.

**`billed`:** CMS assistant text, CMS Voice, `CleanupMediaAsset` /
image-edits, ads generate/rewrite, project inline AI, CMS
`generate_image`. **`bill-allow-out-of-balance`:** compaction;
owner `DescribeImage`. **`unbilled`:** onboarding; `eval`; ETL (not
billed yet).

## Threads

Shared by the CMS assistant, the onboarding assistant, and every headless /
offline generate factory. One table, not copied into feature persistence docs.
Postgres schema **`ai`**. Go package `internal/ai/`.

Closed set: `text` `NOT NULL` plus a check constraint, not a Postgres enum
type ([ADR 1](ADR.md)). Go `StrEnum` when code exists. Do **not** dump
non-assistant work into an internal thread kind.

```sql
thread_kind text NOT NULL CHECK (thread_kind IN (
  'cms_assistant',
  'onboarding_assistant',
  'ads_generate',
  'ads_inline_assistance',
  'website_copy_generation',
  'reviews_ranking_for_display',
  'etl_project_classify',
  'etl_crawl_parse',
  'media_cleanup',
  'project_inline_assistance',
  'eval'
))
```

A new generate factory replaces that check (plus this list and the Go enum).
Callers do not invent strings at the call site.

- `threads` — `id`, `tenant_id` nullable fk (null on `eval`), `thread_kind` text
  required (check above), `onboarding_session_id` nullable fk
  (`onboarding.onboarding_sessions`; required when
  `thread_kind=onboarding_assistant`), `status` (`current` / `completed`; used
  when `thread_kind=cms_assistant`), `last_activity_at`,
  `last_assistant_edit_at` (cms compaction), `compacted_through_item_id`
  nullable fk (`assistant.thread_items`; cms only), timestamps. Unique
  `(tenant_id) WHERE thread_kind = 'cms_assistant' AND status = 'current'`.
  Unique `(onboarding_session_id) WHERE thread_kind = 'onboarding_assistant'`.

**`cms_assistant`** — CMS overlay conversation. Unique current per tenant.
Compaction (skip while `tenants.status=unactivated`). GET `/v1/assistant/thread`
hydrate (items, not generations). Unpaid onboarding website editor reuses this
`current` until 09 completes it; CMS GET then lazy-creates a new empty
`current`. Compaction writes a new generation on **this** thread (not its own
thread kind).

**`onboarding_assistant`** — onboarding guide. Unique per onboarding session.
Onboarding hydrate. Never migrated onto `cms_assistant` after website
activation.

**Every other `thread_kind`** — insert a thread before the first generate; reuse
it for schema-repair retries; do not hydrate on GET thread. Features that are
not already on a CMS or onboarding thread create one with the matching
`thread_kind`.

Failed parse stays an `ai_generations` row. The next attempt is another row on
the **same** `thread_id` (prior failure in context). Bounded subtree repair
above still applies; this is the persistence for a further agentic retry.

**`website_copy_generation`** — automatic website copy generation (onboarding
06 / website 03). River job kind `website_copy_generation`
([jobs](jobs.md)). `prompt_id=website_copy_generation` in the onboarding
package `prompts.yaml`. Writes existing unpublished website slots. Do not
`create_page` or `update_reviews`. Same insert rule as every other
`thread_kind`: one thread per website page; parallel website pages =
parallel threads; `ai_generations.thread_id` required. Not one row per website
([website ADR](../features/website/ADR.md) 29).

**`reviews_ranking_for_display`** — **LLM ranking** of the reviews pool
(not stars or recency) for display (website tokens, Certifications cards,
ads top reviews). River job kind `reviews_ranking_for_display`
([jobs](jobs.md)). `prompt_id=reviews_ranking_for_display` in the profile
package `prompts.yaml`. Input: current `in_pool` rows (id, citation/body,
rating, origin, `published_at`). Output: ordered `review_ids[]`, length
1–30, each id in that pool. The job inserts a
`business_profile_review_rankings` batch (same replace as
Certifications and reviews PATCH), sets `provisional` (not a skip
key), and skips latest `algorithm=human`. Prompt prose and ranking
heuristics are unspecified.
When onboarding and scheduled ETL enqueue:
[build-profile](../features/onboarding/pipeline/build-profile.md). Not a
per-website-section pick when copying the website template’s pages. Do
not use `website_reviews_picker`.

**`media_cleanup`** — captioning pass and image-edits / first-upload
cleanup when feature flag `media_auto_cleanup` is on (default off).
River job kind `describe_image`
([jobs](jobs.md)). Insert a thread before the first generate on that
item; reuse it for schema-repair retries and for `CleanupMediaAsset`.
Do not hydrate on GET thread. `prompt_id` matches `media_cleanup` in
the media package `prompts.yaml`. Do not add a second generate factory
or a `thread_kind=media_process`.

## `ai_generations`

Shared by automatic website copy generation, the CMS assistant, the onboarding
assistant, ads, media captioning, and ETL post-text extract. One table, not
copied into feature persistence docs. Postgres schema **`ai`** (not `llm`). Go
package `internal/ai/`. Image **files** stay in `files` / `media_library`.

- `ai_generations` — `id`, `tenant_id` nullable fk, `thread_id` required fk →
  `ai.threads` (hydrate never joins), `trace_type` (`prod`/`eval`),
  `generation_type` (includes `voice`), `model`, `prompt_id`, `prompt_version`
  (that feature’s `prompts.yaml` — not knowledge), `knowledge_id` +
  `knowledge_format_revision` nullable (knowledge base registry; not `prompt_id`
  / `prompt_version`), `input` jsonb, `internal_reasoning` jsonb, `output`
  jsonb, `tool_calls` jsonb, `input_tokens`, `output_tokens`, `cost_amount`,
  `cost_currency`, `latency_ms`, `status` (`running`/`succeeded`/`failed`),
  `error` nullable, `created_at`
- `ai_generation_tool_revisions` — `id`, `ai_generation_id` fk,
  `tool_revision_kind` (`tool`/`skill`), `name`, `format_revision`

`input`, `internal_reasoning`, `output`, and `tool_calls` stay jsonb so a
call can be reconstructed. Usage and cost are columns. Tool and
skill format revisions are rows, not a map dump. Product classifications and
other predictions are **not** these tables — they live in the feature
Postgres schema
([persistence conventions](persistence.md#classifications-and-predictions)).
Apply / reject and Ask first are per-feature (`runs.ask_first_status`,
website `edit_history`, media library `review_status`). Do not put an
approval queue on `ai_generations`.

## AI tools

The LLM acts through **tools** — named, typed functions it may call. Each tool
is deliberately designed and registered, not ad-hoc. Every call is recorded in
`ai_generations.tool_calls` (args + result).

- **Strongly typed** — a tool's input is a Go struct with the same constraints
  as any DTO (`minLength`, `maximum`, `enum`, …). The LLM's call is parsed into
  that struct.
- **Validated on input** — a call that doesn't fit the struct, or fails its
  constraints, is rejected (or repaired and re-validated) — never executed
  blindly.
- **Parallel** — independent tool calls run concurrently; only declared
  dependencies serialize. Parallel tools still apply **inside** one model turn.
- **Recorded** — every call lands in `ai_generations.tool_calls`. Domain
  packages own the registries that mutate unpublished rows. They call
  `LLMProvider`; they are not `LLMProvider`.

The CMS Assistant (text and Voice) is an **agent loop** (tools → model → tools),
not one generation. **20** tool-using turns after one owner send or utterance
(both channels). **128K / 12K tokens** are text `LLMProvider` assembly only.
Voice live context is xAI-side after instructions seed
([assistant architecture](../features/assistant/architecture.md)). That live
path uses the xAI region for the **business country**, not the auto-routing
global `api.x.ai` host ([voice agent](voice-agent.md)).

Website-editor tools (Ask first / instant apply) live in `website/assistant`
([website editor tools](../features/website/assistant.md)). Ads generate / revise stay ads HTTP, not the CMS
assistant `tools=` list. Dispatcher and thread: [assistant](../features/assistant/README.md). `ai` has no
mutating tool registries.

## Where the LLM sits in each feature

- A simple, one-shot pipeline is described in that feature's `ai-layer.md`.
- A complex pipeline (onboarding, website, ads) is described step by step in
  `features/<feature>/pipeline/*.md`; the AI steps live inside those steps, so
  no `ai-layer.md`.
- Media library captioning is River job kind `describe_image` in
  [jobs.md](jobs.md). No `pipeline/`, no `ai-layer.md`.
