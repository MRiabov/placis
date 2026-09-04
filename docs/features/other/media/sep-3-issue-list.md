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

- **6. `files.scan_status` has no named scanner**
  Comment: `confirm-upload` already branches on scan fail. Lifecycle
  is load-bearing.
  Action: name the scanner (in-process vs job). Same as
  [../../../general-architecture/sep-3-issue-list.md](../../../general-architecture/sep-3-issue-list.md)
  item 3.

- **8. `CreateGeneratedMediaAsset` usage-credit debit**
  Comment: cleanup calls `AssertUsageCredit`; generate is silent;
  `llm-layer.md` lists CMS `generate_image` as billed.
  Action: same assert + 402 as cleanup.

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

- **Website editor crop/focal “disowned”** — README is the **UI**
  (crop stays on `/cms/media`). Image website slot PATCH is the same
  attach/crop/focal function after Content pick. Tighten README;
  keep both.
- **`files.visibility=owner_visible`** — keep until a third
  visibility is needed (`files-and-s3.md` already says so).
