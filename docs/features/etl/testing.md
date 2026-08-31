# ETL — tests

ETL has no owner UI. The full-stack onboarding E2E ([onboarding testing](../onboarding/testing.md)) proves
02 still fills the checklist and writes `etl.*` rows. This feature’s own test is
**integration** (real Postgres, faked Maps / Facebook / Instagram / LLM):

1. **Bootstrap** — `StartRun` with `trigger=onboarding`, ETL kinds including
   Google Maps, Facebook, Instagram. Assert `etl.runs` (one per ETL kind, shared
   `enqueue_id`), `etl.sources`, fetch rows, Maps listing, profile posts /
   reviews / media library photo kinds. Assert Details transform (hours /
   marketing phone / first reviews) lands while scrape is still in flight;
   scrape then adds further reviews / photos. ETL increments have
   `business_profile_edit_sources`.
2. **Scheduled increment** — second `StartRun` with `trigger=scheduled` and a
   new review, a new Instagram post, a new photo, and a different marketing
   phone than the owner typed. Assert new review / post / photo on the business
   profile; owner-typed marketing phone unchanged (research conflict); photo
   ETL kind not rewritten for the same content hash when `force` is false and
   `schema_revision` matches; a bumped `schema_revision` extracts / classifies
   without `force`; `algorithm=human` is not overwritten.
3. **Cap** — five onboarding `enqueue_id`s in 30 minutes; a sixth
   `StartRun(trigger=onboarding)` does not insert runs.
4. **Skip** — scheduled Instagram with no handle → `status=skipped`, no fetch.
5. **Isolation** — two tenants; each cannot read the other’s `etl.runs`,
   fetches, or profile posts.

Step-level asserts: [pipeline/testing](pipeline/testing/README.md).
