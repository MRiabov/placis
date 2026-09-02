# Certifications and reviews (integration test)

This screen’s PATCH. Ranking enqueue and two-pass:
[build-profile testing](../../onboarding/pipeline/testing/build-profile.md).

## Integration

### Owner pin top reviews

#### Setup

Backend (`humatest`, Testcontainers Postgres). `in_pool` reviews exist;
some already pinned by `reviews_ranking_for_display`.

#### Exercise

PATCH ordered `review_ids[]` (featured-first, max 30). Then run
`reviews_ranking_for_display` again.

#### Verify

PATCH wrote `is_top` / `top_position` with `algorithm=human` and
`top_reviews_provisional=false`. The later ranking job does not
overwrite those pins. Ads still read `is_top`. No
`website_slot_reviews` rewrite.

#### Mocked

Ranking LLM.
