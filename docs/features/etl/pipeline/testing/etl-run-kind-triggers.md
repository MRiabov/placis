# ETL run kind triggers — integration test

- **Setup**: `tenants`. `business_profiles` for that `tenant_id`.
  Onboarding: **Starts when** details present or absent per case.
  Scheduled: `place_id` present or absent; matching tuple present or
  absent.
- **Exercise**: `StartRun` (`trigger=onboarding` or `scheduled`).
- **Verify** (Postgres):
  - Onboarding `StartRun` inserts `etl.runs` only for ETL run kinds
    whose **Starts when** tuple is met; does not pre-insert Facebook /
    Instagram / crawl with no URL.
  - Maps starts from `place_id` **or** Places Find (`display_name` if
    set, else `legal_name`, plus locality, one confident hit).
  - Company-number-only starts Parallel, trade registry, and Maps Places
    Find (`legal_name` + registered-office locality) immediately; Maps
    does not wait for Parallel `succeeded`. A later `place_id` from
    Search still starts Maps if Places Find missed.
  - Contractor paste of `existing_site_url` / Facebook URL starts crawl
    / Facebook on the same `enqueue_id`.
  - `web_search` does not start when discoverable details are already
    complete.
  - Remaining expensive scrape / remainder is skipped when only `human`
    scalars would be filled and reviews / photos / Projects do not still
    need that chunk.
  - Never `directory`, `review`, or `photo` as ETL run kinds.
- **Fail**: scheduled Maps without `place_id` →
  `insufficient_data_for_lookup` immediately, no Places Find. Scheduled
  with no matching tuple → `insufficient_data_for_lookup` immediately.
- **Mocked**: Maps Details / Places Find / scrape, Vercel Parallel
  Search, crawl Extract, Facebook, Instagram, trade registry.
