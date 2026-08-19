# 05 — Website copy generation (async)

After [04](04-generate.md) applies the website template, this step **writes the words** —
headlines, body, calls to action, SEO titles — into the existing website slots. It is not the
website editor and not a human approval loop. The predecessor called this "refinement"; the work
is website copy generation (and the same tool pass for SEO / image prompts).

Onboarding **enqueues** it. The writes go through the website assistant tools
([assistant.md](../../website/assistant.md)) onto the same unpublished website rows 04 created.

## Why it is async

Applying the website template is fast and deterministic. Website copy generation is slow (LLM, per
website page, several bounded batches). The contractor already waited through the client interview;
they should not wait again the way they no longer wait on business research.

04 finishes → [06](06-website-preview.md) issues the website preview on the **unpublished
website** (structure + detail tokens). This job fills copy in the background. SSE reports website
slot updates; the public website preview re-renders the current unpublished website. Website
activation does **not** wait for this job.

## When it runs

Once, when 04 succeeds (client interview complete). Not at find-confirm. Not on every later
business research event — business research has been running since confirm and should mostly be
in by client interview complete. The job reads the current profile history at start.

The website assistant (plan mode, activity cards, revert) is still **after website activation**.
Same tools, owner-driven, different entry.

## What it does

Continuous-mode website assistant tools on the unpublished website 04 wrote. No chat UI.

1. Per website page, in parallel (bounded concurrency): `update_slot` for copy, `update_seo`, and
   the rest of the website assistant tools that make sense on an already-built website page
   (`generate_image` if a website slot still has no photo). **Do not** `create_page` — 04 already
   applied the website template's website page set.
2. Keep `{{business_name}}`, `{{phone}}`, … tokens for reusable details. Do not bake raw detail
   values into copy that should stay a website placeholder.
3. Validate every tool result against website component contracts before keeping it.
4. Cap steps and total tool calls (predecessor: 3 steps / 12 calls / 4 website pages at a time).
   Whole-and-valid or the batch fails; do not accept a partial invalid website slot.

## Failure

If the job throws, keep the unpublished website from 04. Onboarding session stays
`previewing`. The unpublished website is the fallback (the predecessor already did this). Retry is
safe (explicit River key). Website copy generation failing must not fail applying the website
template or block website activation.

## Status

Onboarding session is already `previewing` (04 + 06). This job does not get its own onboarding
session status. Progress events on the onboarding session stream (`copy_generation_started` /
`copy_generation_completed` / `copy_generation_failed`, plus per-website-page/slot updates).

- **Persists** updates to existing `website_slots` / website page SEO (unpublished versions);
  `ai_generations` for the tool batches. No website publication.
