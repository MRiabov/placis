# ETL run kind triggers — integration test

- **Assert**: onboarding `StartRun` inserts `etl.runs` only for ETL run kinds
  whose **Starts when** tuple is met; does not pre-insert Facebook /
  Instagram / crawl with no URL. Maps starts from `place_id` **or** Places
  Find (`display_name` + locality, one confident hit). Company-number-only
  starts Parallel and trade registry immediately; Maps starts from Find Place
  or from a later `place_id` without waiting for Parallel `succeeded`.
  Contractor paste of `existing_site_url` / Facebook URL starts crawl /
  Facebook on the same `enqueue_id`. `web_search` does not start when
  discoverable details are already complete. Remaining expensive scrape /
  remainder is skipped when only `human` scalars would be filled and reviews /
  photos / Projects do not still need that chunk. Scheduled with no matching
  tuple → `skipped` immediately. Never `directory`, `review`, or `photo` as
  ETL run kinds.
- **Fake**: Maps Details / Places Find / scrape, Vercel Parallel Search,
  crawl Extract, Facebook, Instagram, trade registry.
