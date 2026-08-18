# 05 — Copy generation (integration test)

- **Setup**: 04 has instantiated a draft; 06 has an `active` preview package; session
  `previewing`.
- **Invoke**: enqueue copy generation (CMS-tool LLM faked to a small `update_slot` / `update_seo`
  batch).
- **Assert**: session already `previewing` before the job finishes; preview token unchanged;
  targeted slots/SEO updated and still valid; `{{…}}` fact tokens preserved; `ai_generations`
  records reasoning + visible output + tool calls; no `create_page`; no `website_publications`.
- **Failure path**: fake the LLM to throw — instantiated draft unchanged, session still
  `previewing`, claim still allowed.
- **Mocked**: the copy-generation LLM only.
