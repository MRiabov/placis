# Business profile jobs

Conventions and index: [jobs](../../infrastructure/jobs.md). Named
identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers). Closed
`## Workflows` and `## Jobs`. Overflow is `###` with a backticked River
job kind under Jobs.

## Workflows

| Workflow | Steps |
| --- | --- |
| `reviews_ranking_for_display` | `reviews_ranking_for_display` |

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `reviews_ranking_for_display` | `tenant_id` | `tenant_id` while pending/running | rank `in_pool` reviews for display |

### `reviews_ranking_for_display`

A second insert while the first is in flight is a River unique conflict
— treat as already queued. Not HTTP 409 (nothing HTTP-inserts this).
After the first completes, a later insert on the same tenant is
allowed.

The worker always loads `in_pool` reviews, generates, and inserts a
`business_profile_review_rankings` batch (skip latest
`algorithm=human`). Same replace as Certifications and reviews PATCH.
`provisional` is **true** if overlapping ETL for this onboarding enqueue
is still running, else **false**. Scheduled ranking always writes
**false** (the run already `succeeded`). No pass field. No
`onboarding_session_id`.

The `profile` `jobs.go` worker **calls** the profile function. LLM:
`thread_kind=reviews_ranking_for_display`,
`prompt_id=reviews_ranking_for_display` in the profile package
`prompts.yaml`. `bill_usage=unbilled` until ETL is billed. Input:
current `in_pool` rows (id, citation/body, rating, origin,
`published_at`). Output: ordered `review_ids[]`, length 1–30, each id
in that pool. Prompt prose, ranking heuristics, and dated model id are
unspecified. Not stars or recency.
[AI layer](../../infrastructure/ai/README.md).

**Onboarding** insert: [build-profile](../onboarding/pipeline/build-profile.md)
(after ETL fast extract has `in_pool` reviews; again when that enqueue’s
overlapping ETL runs finish if additional rows landed). **Scheduled ETL**
(Monday / Wednesday / Friday): after a scheduled run **succeeds** and
new `in_pool` rows landed, insert **once** (not per chunk). ETL transform
does not rank. Website does not insert this job.

`provisional` is not a skip key. A later
`reviews_ranking_for_display` may replace pins until owner PATCH inserts
`algorithm=human` (and `provisional=false`). When the enqueue’s ETL
finishes with **no** extra `in_pool` rows: insert a copy of the latest
batch with `provisional=false`, no second generate.
