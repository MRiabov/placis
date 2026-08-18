# 04 — Generate (after interview complete)

`POST .../interview/complete` (text submit or voice `end_interview`) sets the session to
`generating` and enqueues this step. It does **not** run at find-confirm.

Onboarding **owns** kicking this off and waiting until a draft exists. The records it writes are
[website](../../website/data-model.md) + [media](../../other/media/data-model.md) drafts — the
same tables the CMS edits later.

## What runs

1. Freeze the accepted profile version (`current_version_id`).
2. **One bounded LLM call** picks a trade blueprint + style preset from the catalog, with a
   heuristic fallback (trade → blueprint, else a default). This is not page-by-page generation
   and not copy generation.
3. **Deterministic instantiate** — profile + chosen blueprint → draft `website_pages` /
   `website_page_versions` / `website_sections` / `content_slots`. Placeholders (`{{business_name}}`,
   `{{phone}}`, …) stay in the draft. Same profile + same blueprint → same pages.
4. Prefer real proof / Maps photos for image slots ([media](../../other/media/data-model.md));
   do not invent work photos.
5. Validate against component contracts before the draft is kept.

Copy (headlines, body, CTAs, SEO) is **not** this step — see [05](05-refine.md). 04 leaves
placeholders in the slots; 05 fills them asynchronously after the preview exists.

- **Persists** the draft website + media rows above; `ai_generations` for the blueprint/style
  pick only. Session → `previewing` once 06 writes the package. Enqueues 05. Nothing published.
