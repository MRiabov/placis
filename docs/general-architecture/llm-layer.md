# LLM layer

The LLM provider sits behind an internal provider interface (Vercel AI SDK primary, OpenRouter
alternative), so prompts, model names, response shapes, and cost logging never leak into domain
logic.

- Prompts are a catalog keyed by id and version — not hardcoded strings.
- Output is parsed against a schema before it enters the app. A mismatch is **repaired under a
  bounded contract**: repair only the smallest subtree that fails (never regenerate the whole
  answer), discard or reject unknown fields per the schema, and never accept a partial result — the
  output is whole-and-valid or it is a failed generation, nothing in between.
- **Every LLM call is recorded so it can be reconstructed later**: the reasoning, the visible
  answer, and the tool calls — plus the model, the prompt id/version, and the usage and cost.

## AI tools

The LLM acts through **tools** — named, typed functions it may call. Each tool is deliberately
designed and registered, not ad-hoc. Every call is recorded in `ai_generations.tool_calls` (args +
result).

- **Strongly typed** — a tool's input is a Go struct with the same constraints as any DTO
  (`minLength`, `maximum`, `enum`, …). The LLM's call is parsed into that struct.
- **Validated on input** — a call that doesn't fit the struct, or fails its constraints, is rejected
  (or repaired and re-validated) — never executed blindly.
- **Parallel** — independent tool calls run concurrently; only declared dependencies serialize.
- **Propose-only** — tools write drafts and reviewable changes, never published state. The user
  decides and publishes.

Each domain owns a small tool registry — the set of tools its agent may call (e.g. `update_slot`
and `generate_image` for the website editor; copy + image-gallery proposals for ads).

## Where the LLM sits in each feature

- A simple, one-shot pipeline is described in that feature's `ai-layer.md`.
- A complex pipeline (onboarding, website, ads) is described step by step in
  `features/<feature>/pipeline/*.md`; the AI steps live inside those steps, so no `ai-layer.md`.
