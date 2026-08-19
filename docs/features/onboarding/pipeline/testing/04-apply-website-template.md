# 04 — Apply the website template (integration test)

- **Setup**: a business profile after `interview/complete`.
- **Invoke**: apply the website template (website template/website styles picker LLM faked to a
  fixed website template catalog id; the write is real).
- **Assert**: `website_pages` / `website_sections` / `website_slots`
  written as an unpublished website; website placeholders unresolved; same profile + same website template
  → same website pages; one `ai_generations` row for the picker; no copy-generation
  `update_slot` batch yet (that is 05) and no `website_publications`.
- **Mocked**: the website template/website styles LLM only.
