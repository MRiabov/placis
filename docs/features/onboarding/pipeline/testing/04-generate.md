# 04 — Generate (integration test)

- **Setup**: a business profile after `interview/complete`.
- **Invoke**: run generation (blueprint/style picker LLM faked to a fixed catalog id; instantiate
  real).
- **Assert**: `website_pages` / `website_page_versions` / `website_sections` / `content_slots`
  written as drafts; placeholders unresolved; same profile + same blueprint → same pages; one
  `ai_generations` row for the picker; no copy-generation `update_slot` batch yet (that is 05) and
  no `website_publications`.
- **Mocked**: the blueprint/style LLM only.
