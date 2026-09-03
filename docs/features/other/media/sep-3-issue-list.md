# Sep 3 issue list — Media

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

## High

1. **`media_assets.source_url` is dead and contradicted**
   Issue: persistence. Action: drop.
   Where:

   - [persistence.md](persistence.md) line 35 (column)
   - [persistence.md](persistence.md) lines 159–163 (imported external
     ids live in `etl.imported_media`, “not a second column on this row”)
   - [api.md](api.md) (`MediaAssetRead` omits it)

2. **Four visual-issue severity columns are write-only**
   Issue: persistence. Action: drop until a suggestion surface exists.
   Keep the four that drive first-upload auto-cleanup (`clutter`,
   `busy_background`, `poor_lighting`, `color_cast`).
   Where:

   - [persistence.md](persistence.md) lines 183–185
     (`blur_severity`, `overlay_text_severity`,
     `subject_too_small_severity`, `low_resolution_severity`)
   - [persistence.md](persistence.md) lines 138–140, 203 (suggestions
     only; off HTTP)
   - [README.md](README.md) (suggestions only)
   - [../../general-architecture/jobs.md](../../general-architecture/jobs.md)
     (must not act on them)

3. **Website-editor crop/focal specified twice and disowned once**
   Issue: contradiction. Action: crop stays on `/cms/media` only — then
   drop crop/focal from website PATCH and `update_slot`. Or Content
   gets crop controls the design docs currently deny.
   Where:

   - [README.md](README.md) lines 5, (crop/focal stay on `/cms/media`)
   - [../website/frontend.md](../website/frontend.md)
   - [../website/editing.md](../website/editing.md) (image website slot PATCH
     carries crop/focal)
   - [../website/assistant.md](../website/assistant.md) (`update_slot`
     `crop` / `focal`)

## Medium

4. **`asset_type` is redundant with `source`**
   Issue: DTO + persistence. Action: keep one.
   Where: [persistence.md](persistence.md) (`image`/`generated_image` vs
   `upload`/`generated`/`imported`); [api.md](api.md) (both on
   `MediaAssetRead`; bans `document` / `logo`).

5. **`MediaAssetListGet.status=archived` has no caller**
   Issue: API. Action: drop the filter, or add an archive view on
   `/cms/media`.
   Where: [api.md](api.md); [README.md](README.md) (no archive view;
   Reject reselects the parent).

6. **`files.scan_status` has no scanner** Issue: persistence (files table).
   Action: name the scanner + job, or drop the lifecycle. Tests assert `clean`
   with no transition. Where: [../../general-architecture/files-and-s3.md](../../general-architecture/files-and-s3.md) line
   26; [api.md](api.md) line 92 (insert `pending`); [testing.md](testing.md) lines 125, 166 (assert
   `clean`).

7. **`files.visibility=owner_visible` is unreachable** Issue: persistence.
   Action: drop the enum value. Where:
   [../../general-architecture/files-and-s3.md](../../general-architecture/files-and-s3.md) line 26. Media writes `public`;
   voice recordings `private`. Comment: **do not drop private / public.** Same
   as general-architecture item 7. Raw originals `private`; WebP `public`. Keep
   `owner_visible` until a third visibility is needed or ruled out.

8. **`CreateGeneratedMediaAsset` usage-credit debit is unspecified**
   Issue: gap. Action: same `AssertUsageCredit` as cleanup, matching
   billing ADR.
   Where: [api.md](api.md) (silent on generate; cleanup calls
   `AssertUsageCredit`).

## Keep

- Generate (in-process, no POST generate route), cleanup
  (`POST …/image-edits`), crop/focal PATCH, replace-upload — distinct
  callers, no route duplication.
- Project cover pick-only (no generate).
- The long “Do not create” route list against predecessor drift.
- Media caption internal: not on owner HTTP.
