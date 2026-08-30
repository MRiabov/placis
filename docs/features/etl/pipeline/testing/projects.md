# Projects from source — integration test

- **Assert**: Facebook / Instagram posts and crawled URLs that are a past named
  job insert `business_profile.projects` `status=active` with origin and source
  key; a Maps Details review usable as a Project (work type, one past job)
  inserts with empty cover; scrape photos on **that** review may fill cover only
  when `algorithm` is not `human`. Do not stop at four inserts. Rank in
  build-profile: cover, then title+description length, then newer `created_at`.
  Client interview cards / 05 gallery use the top 4. Skip when skip keys match.
  `algorithm=human` is not overwritten. Unlabeled `photo_kind=project` photos do
  not become Projects. Paid Maps / LLM faked.
- **Fake**: Maps Details / scrape, LLM (`glm-5.3-flash` dated id), crawl
  Extract/GET. Never live Google / OpenRouter / Parallel Search.
