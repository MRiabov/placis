# Certifications and reviews Decision Record

Status: decided (dates on each entry). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

## Decisions

1. **Certifications and reviews are one Profile screen** —
   `/cms/certifications-and-reviews`. Global
   `website_certification_definitions`; tenant selections. Unchecking is
   `removed`. No upload-your-badge. Reviews stay `business_profile_reviews`.
   **Top reviews** max 30, featured-first; new pin appends as least featured.
   This screen is the picker for the pool and for pinning more into top reviews.
   Website editor reviews Content used to show that **same set**. No
   `/cms/proof`. Layout is in [design decision
   record](design-decision-record.md).
   - 2026-08-20: moved from website ADR 16, 2026-08-27
   - 2026-08-20: Unpin/reorder of **top reviews** used to rewrite unpublished
     `website_slot_reviews` from the current top set.
   - 2026-08-26: Pinning **top reviews** on this screen does **not** rewrite
     website sections. Archive still drops that review from every website
     section array and from top reviews. Origins, archive, and create
     owner-written stay as above. Website-section ordered lists: [website
     ADR](../../website/ADR.md) 16.
   - 2026-08-26: Certification definitions and selections are Details /
     business-profile tables (`certification_definitions`,
     `business_profile_certification_selections`), not
     `website_certification_*`. See [details ADR](../details/ADR.md) 7.
   - 2026-08-31: A ranking job **LLM-ranks** the reviews pool and selects **top
     reviews**. It runs **in parallel with client interview** if reviews are
     already in the pool, and **again when ETL finishes**.
     `thread_kind=website_reviews_ranking`. Persist `is_top` / `top_position`
     (same replace as this screen’s PATCH). `{{reviews.1}}` … resolve from that
     order at website publication and canvas/wait-teaser hydrate. Copying the
     website template’s pages does not pick `website_slot_reviews`. Website copy
     generation must not `update_reviews`. Owner Content / `update_reviews` can
     still override a website section later.
   - 2026-08-31: After **ETL fast extract** writes `in_pool` reviews, the first
     ranking replaces `is_top` / `top_position` as **provisional** — that set
     will change and is not locked (not a skip key, not `algorithm=human`). When
     the last overlapping ETL run for this enqueue finishes, rank again if
     additional review rows landed, then replace `is_top` / `top_position` as
     **persistent**. If no additional rows, persist the same pins without a
     second generate. Owner PATCH on this screen stays human and is not
     overwritten.
   - 2026-08-31, later: This screen owns columns, human PATCH, and ads use of
     **top reviews**. It does **not** enqueue ranking. River job enum value
     `reviews_ranking_for_display` (`thread_kind` and `prompt_id` the same
     string) writes `is_top` / `top_position` with the same replace as this
     screen’s PATCH. Owner PATCH is `algorithm=human` and
     `top_reviews_provisional=false` and is not overwritten. The top set’s
     freshness is `business_profiles.top_reviews_provisional` (nullable bool;
     not a skip key; not on each review). Orchestration (onboarding enqueue
     after ETL fast extract, again if more `in_pool` rows when that enqueue’s
     ETL finishes; scheduled ETL after `succeeded` when new `in_pool` rows
     landed): [build-profile](../../onboarding/pipeline/build-profile.md),
     [jobs](../jobs.md). Website consumes the ranked pool (`{{reviews.N}}`); it
     does not own ranking.
   - 2026-09-02: Ranking writes insert-only `business_profile_review_rankings`
     (not columns on the review or profile). HTTP / ads hydrate `is_top` /
     `top_position` from the latest row per review.
     `ReviewListRead.top_reviews_provisional` is that batch’s `provisional`.
     Owner PATCH inserts `algorithm=human` / `provisional=false`. Skip overwrite
     when latest ranking is `algorithm=human`.
   - 2026-09-04: v1 stays one tenant pool on this screen. Ads use **top
     reviews**. Whether this picker later becomes per website and per ads
     (different certification selections and review sets) is **TBD**. [website
     ADR](../../website/ADR.md) 16 and 26.
   - 2026-09-06: One screen, two Registers. HTTP lives in
     `profile/certifications/` (`/v1/business-profile/certifications`) and
     `profile/reviews/` (`/v1/business-profile/reviews`), not `details/api.md`.
     Frontend modules `cms/profile/certifications/` and `cms/profile/reviews/`
     compose on `/cms/certifications-and-reviews`. [certifications
     HTTP](../certifications/api.md), [reviews HTTP](api.md).

