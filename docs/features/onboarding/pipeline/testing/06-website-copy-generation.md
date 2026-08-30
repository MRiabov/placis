# 06 — Website copy generation (integration test)

- **Setup**: 05 has applied the website template; 06 may run before or after 07;
  onboarding session `applying_website_template` or `previewing`.
- **Invoke**: enqueue website copy generation (website editor-tool LLM faked to
  a small `update_slot` / `update_seo` / `update_reviews` batch). Also start a
  second run; also activate (08) while the job is in flight.
- **Assert**: onboarding session is `previewing` once 07 has run; targeted
  website slots/SEO updated and still valid; reusable `{{…}}` detail tokens
  preserved in prose; `ai_generations` records reasoning + visible output + tool
  calls (`kind=website_copy_generation` thread); no `create_page`; this job does
  not write `website_publications`; lock is `tenant_id` (not `assistant.runs`);
  second 06 start is 409; job continues after 08 on the same `tenant_id` (not
  cancelled); CMS PATCH / assistant HTTP are not 409 because 06 is running;
  slots are not set `approved`.
- **Failure path**: fake the LLM to throw — unpublished website from 05
  unchanged, onboarding session still `applying_website_template` or
  `previewing`, website activation still allowed.
- **Mocked**: the website copy generation LLM only.
