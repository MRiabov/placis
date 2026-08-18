# 05 — Copy generation (async)

After [04](04-generate.md) instantiates the draft, this step **writes the words** — headlines,
body, calls to action, SEO titles — into the existing slots. It is not the CMS editor and not a
human approval loop. OnCall called this "refinement"; the work is copy generation (and the same
tool pass for SEO / image prompts).

Onboarding **enqueues** it. The writes go through the website CMS tools
([assistant.md](../../website/assistant.md)) onto the same draft rows 04 created.

## Why it is async

Instantiate is fast and deterministic. Copy generation is slow (LLM, per page, several bounded
batches). The contractor already waited through the interview; they should not wait again the way
they no longer wait on research.

04 finishes → [06](06-preview.md) issues the preview on the **skeleton** (structure + fact
tokens). This job fills copy in the background. SSE reports slot updates; the public preview
re-renders the current draft. Claim does **not** wait for this job.

## When it runs

Once, when 04 succeeds (interview complete). Not at find-confirm. Not on every later research
event — research has been running since confirm and should mostly be in by interview complete.
The job reads the current profile version at start.

The editor assistant (plan mode, activity cards, revert) is still **after claim**. Same tools,
human-driven, different entry.

## What it does

Continuous-mode CMS tools on the instantiated draft. No chat UI.

1. Per page, in parallel (bounded concurrency): `update_slot` for copy, `update_seo`, and the
   rest of the assistant tools that make sense on an already-built page (`generate_image` if a
   slot still has no photo). **Do not** `create_page` — 04 already instantiated the page set.
2. Keep `{{business_name}}`, `{{phone}}`, … tokens for reusable facts. Do not bake raw fact
   values into copy that should stay a token.
3. Validate every tool result against component contracts before keeping it.
4. Cap steps and total tool calls (OnCall: 3 steps / 12 calls / 4 pages at a time). Whole-and-valid
   or the batch fails; do not accept a partial invalid slot.

## Failure

If the job throws, keep the instantiated draft. Session stays `previewing`. The skeleton is the
fallback (OnCall already did this). Retry is safe (explicit River key). Copy generation failing
must not fail generate or block claim.

## Status

Session is already `previewing` (04 + 06). This job does not get its own session status. Progress
events on the session stream (`copy_generation_started` / `copy_generation_completed` /
`copy_generation_failed`, plus per-page/slot updates).

- **Persists** updates to existing `content_slots` / page SEO (draft versions); `ai_generations`
  for the tool batches. Nothing published.
