# 04 — Export ad set

Deterministic ad set from the approved rows. The zip is a temporary
human path until ad posting reads `AdSetRead` directly.

## Trigger

- `POST /v1/ads/{ad_id}/ad-set` — `AdSetRead` only.
- `POST /v1/ads/{ad_id}/download` — same `ExportAdSet`, then a
  short-lived signed URL for the zip.

## Pre

- `ads.status=ad_ready_to_post`.
- Approved variant, copy, placements, ad lead form from 03.

## Must not

- Ad posting. Require ad-platform credentials.
- Write `ads` / `ad_variants` / `ad_copy_variants` /
  `ad_image_placements` / `ad_lead_forms`.
- Persist HTML onto ad rows.
- Public download URL (not a signed URL).
- Change `AdSetRead.format_number` without a new ad set format number.

## Do

`ExportAdSet` **reads** the approved ad and returns `AdSetRead`.
Download also packs a zip.

1. Cut each approved source media asset to its crop. Output keys
   `{ad_id}/{variant_format}/{position}.{ext}`.
2. Copy sheet: headline, primary text, short label (`description`),
   button label, notes for this ad's format.
3. Suggested ad lead form fields (title and include flags).
4. Mapping of each output image to its source media asset, crop, and
   format.
5. Download: zip in `files` (`visibility=private`); Response
   `AdDownloadRead.url` is the signed URL
   ([files](../../../../infrastructure/files.md)).

Same approved ad always yields the same ad set and the same rendered
images for the same source media assets.

## Reads

`ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`,
`ad_lead_forms`, `media_assets`, `files`.

## Persist

`files` (zip object) on download only. `audit_events`. No ad-table
writes.

## Fail

`409` if not `ad_ready_to_post`. No zip. Ad rows unchanged.

## Out

Done for this pipeline. Ad posting is future work.

## Invariants

- `AdSetRead.format_number` is the ad set format number.
- Download and `ad-set` return the same fields; download adds `url`.
