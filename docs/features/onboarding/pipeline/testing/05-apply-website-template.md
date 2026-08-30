# 05 — Apply the website template (integration test)

- **Setup**: a business profile after `interview/complete`.
- **Invoke**: apply the website template (website template/website styles picker
  LLM faked to a fixed website template catalog id; the write is real).
- **Assert**: `website_pages` / `website_sections` / `website_slots` written as
  an unpublished website; website placeholders unresolved; same profile + same
  website template → same website pages; reviews website sections exist with
  `website_slot_reviews` picked per reviews website section (empty if the pool
  is not ready; never a copy of **top reviews** onto every reviews website
  section); `ai_generations` for the website template/website styles picker
  (`kind=website_template_picker`) and,
  when the pool is ready, the pick of reviews per website section
  (`kind=website_reviews_picker`); no
  copy-generation `update_slot` batch yet (that is 06) and no
  `website_publications`; rows use the unactivated `tenant_id` from 01.
  Project-gallery website slots get the ranked top 4 `active` business research
  origin Project ids (empty if none); project drafts omitted.
- **Mocked**: the website template/website styles LLM, and the LLM that picks
  reviews per website section.
