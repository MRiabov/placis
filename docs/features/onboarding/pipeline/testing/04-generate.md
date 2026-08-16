# 04 — Generate (integration test)

- **Setup**: a business profile.
- **Invoke**: generate the website draft from the trade blueprint.
- **Assert**: `website_pages`/`website_page_versions`/`website_sections`/`content_slots` written as
  drafts; placeholders kept (unresolved); same input → same output.
- **Mocked**: nothing (deterministic, no LLM).
