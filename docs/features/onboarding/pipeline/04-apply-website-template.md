# 04 — Apply the website template (after client interview complete)

`POST .../interview/complete` (text submit or voice `end_interview`) sets the onboarding session
to `applying_website_template` and enqueues this step. It does **not** run at find-confirm.

Onboarding **owns** kicking this off and waiting until an unpublished website exists. The records
it writes are [website](../../website/data-model.md) + [media](../../other/media/data-model.md)
unpublished rows — the same tables The CMS edits later.

## What runs

1. Keep the accepted profile history (`current_history_id`).
2. **One bounded LLM call** picks a website template + website styles from the website template
   catalog and website style catalog, with a heuristic fallback (trade → website template, else a
   default). This is not website-page-by-website-page website copy generation.
   Trade does not pick the website template 1:1.
3. **Apply the website template** (deterministic) — profile + chosen website template → unpublished
   `website_pages` / `website_sections` / `website_slots`. Website
   placeholders (`{{business_name}}`, `{{marketing_phone}}`, …) stay in the unpublished website. Same
   profile + same website template → same website pages.
4. Prefer real projects / Maps photos for image website slots
   ([media](../../other/media/data-model.md)); do not invent work photos.
5. Validate against website component contracts before the unpublished website is kept.

Copy (headlines, body, CTAs, SEO) is **not** this step — see
[05](05-website-copy-generation.md). 04 leaves website placeholders in the website slots; 05 fills
them asynchronously after the website preview exists.

- **Persists** the unpublished website + media rows above; `ai_generations` for the website
  template/website styles pick only. Onboarding session → `previewing` once 06 writes the website
  preview. Enqueues 05. No website publication.
