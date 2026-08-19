# 05 — Copy generation (integration test)

- **Setup**: 04 has applied the website template; 06 has an `active` website preview;
  onboarding session `previewing`.
- **Invoke**: enqueue website copy generation (website assistant-tool LLM faked to a small
  `update_slot` / `update_seo` batch).
- **Assert**: onboarding session already `previewing` before the job finishes; website preview
  token unchanged; targeted website slots/SEO updated and still valid; `{{…}}` website placeholder
  tokens preserved; `ai_generations` records reasoning + visible output + tool calls; no
  `create_page`; no `website_publications`.
- **Failure path**: fake the LLM to throw — unpublished website from 04 unchanged, onboarding
  session still `previewing`, website activation still allowed.
- **Mocked**: the website copy generation LLM only.
