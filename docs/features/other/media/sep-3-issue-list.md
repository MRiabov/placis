# Sep 3 issue list — Media

Reclassified 2026-09-03. No media ADR; [README.md](README.md) and
[persistence.md](persistence.md) are the decision record. Bold numbers
are original audit ids (not compacted).

## Doc gap

- **2. Four suggestion-only visual-issue severities**
  Comment: README / persistence: blur, overlay text, subject too
  small, low resolution are **suggestions only**; the tool still
  requires every argument. Not accidental columns.
  Action: say “recorded, no v1 surface”, or name the surface. Do not
  drop (that changes the tool contract).

## Actually drop

- **1. `media_assets.source_url`**
  Comment: no writer; omitted from `MediaAssetRead`; imported ids
  live in `etl.imported_media`.
  Action: drop the column.

- **4. `asset_type` redundant with `source`**
  Comment: `generated_image` ⇔ `generated`; owner upload is `image`.
  Action: keep `source`; drop `asset_type`.

- **5. `MediaAssetListGet.status=archived`**
  Comment: `/cms/media` has no archive view; Reject reselects the
  parent.
  Action: drop the query value; keep `status=archived` on the row.

## False alarms (closed)

- **8. `CreateGeneratedMediaAsset` usage-credit debit** —
  CMS `generate_image` **calls** `AssertUsageCredit` (via `ai`) with
  `bill_usage=billed`; remaining 0 is **402**. Onboarding stays
  `unbilled`.
- **Website editor crop/focal “disowned”** — README is the **UI**
  (crop stays on `/cms/media`). Image website slot PATCH is the same
  attach/crop/focal function after Content pick. Tighten README;
  keep both.
- **`files.visibility=owner_visible`** — keep until a third
  visibility is needed (`files.md` already says so).

## Deferred

- **6. `files.scan_status` has no named scanner**
  Comment: `confirm-upload` already branches on scan fail. Not this
  pass. If AV lands later it is an edge/API product, not a Go/River
  job. Same as
  [../../../general-architecture/sep-3-issue-list.md](../../../general-architecture/sep-3-issue-list.md)
  item 3.
