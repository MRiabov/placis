# 03 — Approve ad

The checkpoint. Owner Review PATCH / rewrite / cleanup already happened
on Routes. This step only moves the ad to **ad ready to post**.

## Trigger

`POST /v1/ads/{ad_id}/approve` (`ApproveAd`).

## Pre

- 02 draft exists (`ads.status=ad_needs_review` or owner-edited
  `draft` with copy and placements).
- This ad's format has a complete variant.
- Every placement has an uploaded photo (`file_id` present, not
  `failed`). A media caption is **not** required for a photo the owner
  added to this ad. A cleanup copy counts only once `approved`.
- Copy satisfies character limits. `cta_label` is in the allowed set.
- An `ad_lead_forms` row exists (suggestions never block).

## Must not

- Ad posting. Write `platform_refs`.
- Block on unprompted sensitive statements the owner kept, edited, or
  prompted ([ADR 18](../ADR.md)).
- Block on a missing media caption for an owner-added photo.
- Write website pages or an ad destination.
- Export the zip (that is 04).

## Do

`ApproveAd` sets `ad_ready_to_post`.

1. Re-check blockers (limits, uploads in flight, failed uploads).
2. Set `ads.status=ad_ready_to_post`,
   `ad_variants.status=approved`.
3. Insert `ad_reviews` (actor, transition to `ad_ready_to_post`).
4. Write `audit_events`.

## Reads

`ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`,
`ad_lead_forms`, `media_assets` (upload / review on placements).

## Persist

`ads.status=ad_ready_to_post`, `ad_variants.status=approved`,
`ad_reviews`, `audit_events`. Copy and placements unchanged except
`ads.updated_at`.

## Fail

`400` blockers. `409` conflict token. Rows stay `ad_needs_review`. No
`ad_reviews` row for a failed approve.

## Out

[04 export ad set](04-export-ad-set.md).

## Invariants

- `ad_ready_to_post` means the ad set can be consumed, not ad posting
  done.
- Approve is explicit. Generate must not have written this status.
