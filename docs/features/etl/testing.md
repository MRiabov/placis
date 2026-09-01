# ETL — tests

ETL has no owner UI. The full-stack onboarding E2E ([onboarding testing](../onboarding/testing.md)) proves
02 still fills the checklist and writes `etl.*` rows. This feature’s own test is
**integration** (real Postgres, faked Maps / Facebook / Instagram / LLM):

1. **Bootstrap** — `StartRun` with `trigger=onboarding` and 01 details that let
   some ETL run kinds start ([ETL run kind triggers](pipeline/etl-run-kind-triggers.md); never `directory`,
   `review`, or `photo`). Assert `etl.runs` only for started ETL run kinds
   (shared `enqueue_id`), `etl.sources`, fetch rows, Maps listing, profile posts
   / reviews / media library photo kinds. Assert Details transform (hours /
   marketing phone / first reviews) lands while scrape is still in flight;
   scrape then adds further reviews / photos. ETL increments have
   `business_profile_edit_sources`. Facebook / Instagram are not inserted until
   a URL/handle detail exists; `insufficient_data_for_lookup` if nothing left
   can produce that detail.
2. **Scheduled increment** — second `StartRun` with `trigger=scheduled` and a
   new review, a new Instagram post, a new photo, and a different marketing
   phone than the owner typed. Assert new review / post / photo on the business
   profile; owner-typed marketing phone unchanged (research conflict); photo
   kind not rewritten for the same content hash when `force` is false and
   `schema_revision` matches; a bumped `schema_revision` extracts / classifies
   without `force`; `algorithm=human` is not overwritten. After that
   scheduled run **succeeds** and new `in_pool` review rows landed:
   schema `jobs` has one `reviews_ranking_for_display` on that
   `tenant_id` (once, not per chunk). After invoke:
   `top_reviews_provisional=false`. Transform did not rank. If the
   scheduled run added no new `in_pool` rows, no ranking job.
3. **Cap** — five onboarding `enqueue_id`s in 30 minutes; a sixth
   `StartRun(trigger=onboarding)` does not insert runs.
4. **insufficient_data_for_lookup** — scheduled Instagram with no handle →
   `status=insufficient_data_for_lookup` immediately, no fetch. Scheduled Maps
   with no `place_id` → `insufficient_data_for_lookup`, no
   Places Find. Onboarding Instagram is not inserted until a handle detail
   exists.
5. **Isolation** — two tenants; each cannot read the other’s `etl.runs`,
   fetches, or profile posts.

Step-level asserts: [pipeline/testing](pipeline/testing/README.md).
