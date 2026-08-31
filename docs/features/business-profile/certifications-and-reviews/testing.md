# Certifications and reviews (integration test)

This screen’s PATCH. Ranking enqueue and two-pass:
[build-profile testing](../../onboarding/pipeline/testing/build-profile.md).

- **Setup**: `in_pool` reviews exist; some already pinned by
  `reviews_ranking_for_display`.
- **Invoke**: PATCH ordered `review_ids[]` (featured-first, max 30). Then
  run `reviews_ranking_for_display` again.
- **Assert**: PATCH wrote `is_top` / `top_position` with
  `algorithm=human`. The later ranking job does not overwrite those pins.
  Ads still read `is_top`. No `website_slot_reviews` rewrite.
- **Mocked**: ranking LLM.
