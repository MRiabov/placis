# Sep 3 issue list — Ads

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

Ads never post. Terminal status is **ad ready to post**. The leak is
an ads-manager surface in `ad-generation/frontend.md` with no API or
columns.

## High

1. **Performance block and projection line**
   Issue: functionality (out of scope). Action: cut the block.
   Where:

   - [ad-generation/frontend.md](ad-generation/frontend.md) line 93
     (list-card performance strip)
   - [ad-generation/frontend.md](ad-generation/frontend.md) line 304
     (impressions, clicks, spend, results, cost per ad lead)
   - [ad-generation/prd.md](ad-generation/prd.md) line 115
   - [ad-generation/technical-implementation.md](ad-generation/technical-implementation.md)
     line 139
   - Same file line 453: “no … live performance UIs”

   No metric DTO. No metric column.

2. **Per-ad “Ad leads” list**
   Issue: functionality. Action: defer with attribution, or spec `ad_id`
   - route.
   Where:
   - [ad-generation/frontend.md](ad-generation/frontend.md) (uncontacted
     ad leads in urgent red)
   - [ad-generation/prd.md](ad-generation/prd.md) Post-MVP 6 (attribution
     is future)
   - [../other/leads/persistence.md](../other/leads/persistence.md) (no
     `ad_id`; `source` = `website_form`; later `ad`)
   - [../other/leads/api.md](../other/leads/api.md) line 38 (no CMS leads
     HTTP)
   - [README.md](README.md) (leads are a separate surface)

3. **Budget and duration controls**
   Issue: functionality (ads manager). Action: drop until ad posting.
   Where:

   - [ad-generation/prd.md](ad-generation/prd.md) line 220 (daily budget
     shown but disabled)
   - [ad-generation/frontend.md](ad-generation/frontend.md) lines 295–296
   - [ad-generation/frontend.md](ad-generation/frontend.md) line 453
     (forbids live performance UIs including daily budget)

4. **Connect Meta / Connect Google Ads**
   Issue: functionality. Action: drop both; Google Ads is not even planned.
   Where:

   - [ad-generation/frontend.md](ad-generation/frontend.md) line 113
   - [ad-generation/prd.md](ad-generation/prd.md) line 291 (Link your
     Facebook is Details, not Ads Connect Meta)
   - [api.md](api.md) (no connection endpoint; external API keys are
     future)
   - [ad-application/meta/](ad-application/meta/) is investigation, not
     the spec

5. **`ads.review_status` and `ad_variants.review_status`**
   Issue: persistence. Action: delete both.
   Where:

   - [persistence.md](persistence.md) lines 26, 51, 57, 67
   - [README.md](README.md) lines 98–101 (open question: leftover of
     `status`?)

6. **`icp_review_status` and `icp_source=llm_suggested`**
   Issue: persistence + DTO. Action: spec the job, or drop column, enum
   value, DTO field, and backend test 15.
   Where:

   - [persistence.md](persistence.md) lines 26, 49
   - [api.md](api.md) line 37
   - [ad-generation/testing.md](ad-generation/testing.md) line 46
   - No River job in [../../general-architecture/jobs.md](../../general-architecture/jobs.md)

7. **Three of four `ads.origin` values**
   Issue: persistence. Action: `owner` only (plus `done_for_you` if that
   actor is real), or drop the column.
   Where:

   - [persistence.md](persistence.md) (`origin` → `owner` / `llm` /
     `done_for_you` / `business_profile`)
   - [api.md](api.md) line 37 (`origin` on `AdRead`; not on `AdCreate`)

8. **Posting reservation columns**
   Issue: persistence. Action: at most one forward-compat column on
   `ads`; drop `ad_variants.platform_refs`.
   Where:

   - [persistence.md](persistence.md) lines 27, 43, 57, 68
   - [api.md](api.md) lines 15, 37, 70, 132 (omit from DTOs)
   - [ad-generation/pipeline/01-create-ad.md](ad-generation/pipeline/01-create-ad.md)
     line 34 (assert empty)

9. **`ad_reviews.note`**
   Issue: persistence. Action: drop.
   Where: [persistence.md](persistence.md) line 123. Approve / archive
   take no note; no DTO carries one.

10. **Disabled “Ad posting” / “Publish” on detail**
    Issue: UI. Action: drop the control. Do not say Publish for ads.
    Where: [ad-generation/frontend.md](ad-generation/frontend.md) §2
    approve block and §3 top bar.

## Medium

11. **`AdImagePlacementRead.media_caption`**
    Issue: DTO. Action: omit (media library already omits `media_caption`).
    Where: ads API vs [../other/media/api.md](../other/media/api.md).

12. **`ad_image_placements.format` redundant with `ad_variants.format`**
    Issue: persistence. Action: one place.
    Where: [persistence.md](persistence.md).

13. **Variant layer is vestigial (one variant per ad)**
    Issue: persistence. Action: consider collapsing to `ads` + one copy
    row.
    Where: [persistence.md](persistence.md) (`ad_variants` unique per
    `ad_id`).

14. **`GET /v1/ads/{ad_id}/variants`**
    Issue: API. Action: drop; `GET /v1/ads/{ad_id}` already hydrates
    `variant`.
    Where: [api.md](api.md).

15. **`POST /v1/ads/{ad_id}/ad-set` as public HTTP**
    Issue: API. Action: keep `ExportAdSet`; question the public route
    until a second caller exists (CMS uses `/download`).
    Where: [api.md](api.md).

16. **`AdSetRead.format_number`**
    Issue: DTO. Action: glossary name or drop. PRD says “revision number”.
    Where: [api.md](api.md); [ad-generation/prd.md](ad-generation/prd.md).

17. **Structured ideal customer profile targeting fields**
    Issue: over-specified. Action: `icp_notes` + `icp_location_focus` may
    be enough to steer generation.
    Where: [persistence.md](persistence.md) (`icp_age_min` / `icp_age_max`
    / `icp_household`).

18. **`docs/features/ads/ad-application/meta/` treated as spec**
    Issue: docs placement. Action: keep as investigation outside the
    authority path, or one file. Spec authority is `ad-generation/`.
    Where: [README.md](README.md) already says investigation.

19. **Spend-based sorting / status filter vs `AdListGet`**
    Issue: DTO. Action: say browser-only, or add query fields. Drop
    spend-based sorting until posting.
    Where: [ad-generation/frontend.md](ad-generation/frontend.md) §1;
    [api.md](api.md) (`AdListGet` is `archived` only).

20. **DTO hygiene**
    - `AdVariantUpdate` accepts `[]AdImagePlacementRead` (Read type with
      server `id`) as a request body.
    - `AdGenerateRequest` reused as body of approve, archive, unarchive,
      ad-set, download, and `DELETE /v1/ads/{ad_id}`.
    Action: write types + a mutate request that is not a DELETE body.
    Where: [api.md](api.md).

## Keep

- Create → generate → review → approve → export zip.
- Inputs by reference (profile, services, projects, reviews, approved
  photos). No parallel photo store.
- Four formats as Meta placements (Instagram is not a second platform).
- `ad_lead_forms` as suggestions that never block approval.
- Inline rewrite, cleanup via media library HTTP, `base_updated_at` / 409,
  archive, `/download`.
- No ad questions in onboarding.
