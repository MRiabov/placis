# Projects from source — integration test

- **Verify**: Facebook / Instagram posts and crawled sources that are a past
  named job insert `business_profile.projects` `status=active` with origin and
  ≥1 `project_sources` row; a Maps Details review usable as a Project (work
  type, one past job) inserts with empty cover; scrape photos on **that** review
  may fill cover only when `algorithm` is not `human`. Same crawl URL, Extract +
  HTML both yes → one Project, two cites, two
  `etl.llm_source_to_project_classifications` rows with the same `project_id`.
  Text under 200 characters writes verdict no with no LLM. Do not stop at four
  inserts. Rank in build-profile: cover, then title+description length, then
  newer `created_at`. Client interview cards / 05 gallery use the top 4. Skip
  when the verdict `algorithm` + `schema_revision` match. `algorithm=human` is
  not overwritten. Unlabeled `photo_kind=project` photos do not become Projects.
  No `project_from_source_*` on posts / reviews / crawl HTML URLs. No nullable
  `source_id` on Projects. ETL Details increments have ≥1
  `business_profile_edit_sources`. Paid Maps / LLM faked.
- **Fake**: Maps Details / scrape, LLM (`glm-5.3-flash` dated id), crawl
  Extract/GET. Never live Google / OpenRouter / Parallel Search.

Named tables: `business_profile_reviews`, `business_profiles`, `etl.runs`,
`etl.sources`, `etl.website_crawl_pages`, `google_maps_listing_photos`.
