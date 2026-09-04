# 01 — Create ad

Persist About the ad. Do not call an LLM. Do not enqueue generate.
Format is stored on a stub `ad_variants` row so leave-and-return keeps
the pill.

## Trigger

`POST /v1/ads` (`CreateAd`). Later About the ad click-off is
`PATCH /v1/ads/{ad_id}` (`UpdateAd`).

## Pre

- Active tenant. Clerk JWT.
- Business profile services exist for the service-focus picker
  (nullable `service_focus_id`).
- Exactly one `format` on the body (`feed_square` default in the UI).

## Must not

- Call an LLM. No `ai.threads` / `ai_generations` for this step.
- Enqueue `ads_generate`.
- Write `ad_copy_variants` / `ad_image_placements`.
- Write `ad_ready_to_post` or `ad_needs_review`.
- Write a lead-form `title` (Review copy; [ADR 38](../ADR.md)).
- Ad posting. Campaign objects. An ad destination.

## Do

`CreateAd` persists the ad draft and a stub variant.

1. Insert `ads` (`status=draft`, ideal customer profile defaults if
   omitted: married couples aged 30–40, `icp_source=static`,
   `platform_status=not_connected`, `platform_refs` empty).
2. Insert `ad_lead_forms` (include flags; `include_marketing_phone`
   default true; `title` empty).
3. Insert one `ad_variants` row (`format` from the body,
   `status=draft`, `copy_variant_id` null).
4. `UpdateAd` may change those same rows (including `format` on the
   stub) before generate.

## Reads

`business_profiles` (service picker and service-area location
suggestions). Existing `ads` when filling `icp_location_focus` from
the last ad ([ADR 37](../ADR.md)). Ideal customer profile is the
stored default, not a picker ([ADR 40](../ADR.md)).

## Persist

One `ads` row, one `ad_lead_forms` row, one stub `ad_variants` row on
that `ad_id`. No copy. No placements. No `ads_generate` job.

## Fail

Validation 400 (missing format, bad enum). No rows. Retry is a new
`POST /v1/ads`.

## Out

[02 generate ad draft](02-generate-ad-draft.md) after
`POST /v1/ads/{ad_id}/generate`.

## Invariants

- One variant per ad. Format is on that stub before generate.
- Same tenant retry of PATCH updates the same rows; it does not insert
  a second variant.
