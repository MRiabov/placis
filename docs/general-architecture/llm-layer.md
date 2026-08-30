# LLM layer

The LLM sits behind `LLMProvider` so prompts, model names, response shapes, and
cost logging never leak into domain logic. Shared `ai` is that interface and its
implementation.

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
  projects; onboarding 06 in onboarding; ETL usable-as-a-Project classify /
  photo classification / crawl parse in the ETL package. ETL extract/transform
  generation uses **`glm-5.3-flash`** (dated gateway id; do not ride `*-latest`)
  via `LLMProvider` — same cheap multimodal model when the input is text-only.
  Do not put product prompt prose in Go strings, and do not keep one global
  `internal/ai/prompts.yaml`. `ai` is `LLMProvider` + traces; it records
  `prompt_id` / `prompt_version` from that file (id + format revision).
  Assistant **product knowledge** is a separate **knowledge base registry**
  (YAML + markdown `go:embed` in the assistant packages), not `prompts.yaml` and
  not RAG. CMS and onboarding both list the shared product glossary
  (`internal/knowledge/product_glossary.md`: Domain + Enums + Don't say). Voice
  pronunciation / keyterms are `internal/knowledge/voice_pronunciation.yaml`,
  not `prompts.yaml`. Interpolate with `{{var}}`. Nested fields (business
  profile has many) use a dotted path: `{{aaa.bbb}}`. Same spelling as a
  [website placeholder](../features/website/variables.md) when the value is a profile detail; prompts.yaml is not
  unpublished website copy. Go fills `{{var}}`; it does not own the prompt text.
- Output is parsed against a schema before it enters the app. A mismatch is
  **repaired under a bounded contract**: repair only the smallest subtree that
  fails (never regenerate the whole answer), discard or reject unknown fields
  per the schema, and never accept a partial result — the output is
  whole-and-valid or it is a failed generation, nothing in between.
- **Every AI call is recorded so it can be reconstructed later**: the reasoning,
  the visible answer, and the tool calls — plus the model, the prompt id and
  format revision, and the usage and cost. That includes text, voice, and image
  generate/cleanup. Voice **cost** is xAI audio minutes plus text-item fees, not
  token counts — leave `input_tokens` / `output_tokens` null on those rows
  ([billing](../features/billing/README.md)). Hydrate of the assistant thread does **not** read this table.

## `ai_generations`

Shared by website copy generation, the CMS assistant, the onboarding assistant,
ads, and ETL post-text extract. One table, not copied into feature persistence
docs. Postgres schema **`ai`** (not `llm`). Go package `internal/ai/`. Image
**files** stay in `files` / `media_library`.

- `ai_generations` — `id`, `tenant_id` nullable fk, `thread_id` nullable uuid
  (CMS assistant; hydrate never joins), `conversation_id` nullable uuid
  (onboarding assistant; hydrate never joins), `trace_type` (`prod`/`eval`),
  `generation_type` (includes `voice`), `model`, `prompt_id`, `prompt_version`
  (that feature’s `prompts.yaml` — not knowledge), `knowledge_id` +
  `knowledge_format_revision` nullable (knowledge base registry; not `prompt_id`
  / `prompt_version`), `input` jsonb, `internal_reasoning` jsonb, `output`
  jsonb, `tool_calls` jsonb, `input_tokens`, `output_tokens`, `cost_amount`,
  `cost_currency`, `latency_ms`, `approval_status`
  (`pending_review`/`approved`/`applied`/`rejected`/`failed`), `applied_changes`
  jsonb, `status` (`running`/`succeeded`/`failed`), `error` nullable,
  `created_at`
- `ai_generation_tool_revisions` — `id`, `ai_generation_id` fk, `kind`
  (`tool`/`skill`), `name`, `format_revision`

`input`, `internal_reasoning`, `output`, `tool_calls`, and `applied_changes`
stay jsonb so a call can be reconstructed. Usage and cost are columns. Tool and
skill format revisions are rows, not a map dump.

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
path uses the xAI region for the **business country**, not the global
`api.x.ai` host
([voice agent](voice-agent.md)).

Website-editor tools (Ask first / instant apply) live in `website/assistant`
([website editor tools](../features/website/assistant.md)). Ads generate / revise stay ads HTTP, not the CMS
assistant `tools=` list. Dispatcher and thread: [assistant](../features/assistant/README.md). `ai` has no
mutating tool registries.

## Where the LLM sits in each feature

- A simple, one-shot pipeline is described in that feature's `ai-layer.md`.
- A complex pipeline (onboarding, website, ads) is described step by step in
  `features/<feature>/pipeline/*.md`; the AI steps live inside those steps, so
  no `ai-layer.md`.
