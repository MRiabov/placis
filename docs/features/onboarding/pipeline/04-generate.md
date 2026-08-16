# 04 — Generate (deterministic)

After the interview completes, generation starts from the final accepted profile version: pick the
trade blueprint and instantiate pages/sections/slots deterministically — no LLM.

- **Persists** `website_pages` (draft) + `website_page_versions` + `website_sections` +
  `content_slots` (placeholders kept).
