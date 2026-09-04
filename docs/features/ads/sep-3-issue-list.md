# Sep 3 issue list — Ads

Reclassified 2026-09-03 against
[ad-generation/ADR.md](ad-generation/ADR.md). Not a drop list. Ads
never post. Disabled stubs that ADR 27/29 specify stay until ad
posting. Bold numbers are original audit ids (not compacted).

## Keep (ADR)

- **1. Performance strip / projection (disabled stub)**
  Comment: ADR 27/29 put Performance + expected-ad-lead line on the
  existing-ad detail. `frontend.md` forbids *live* metrics and allows
  disabled stubs. No metric DTO is required for dashes.
  Action: say first slice renders dashes; real metrics are Post-MVP.

- **3. Daily budget + duration (disabled stub)**
  Comment: ADR 29: disabled until ad posting. No budgets HTTP is
  consistent. PRD line 220 wrongly puts budget in the create flow;
  About the ad is offer / audience / format (ADR 21/29).
  Action: amend the PRD sentence. Do not drop the stub.

- **8. `platform_refs` / `platform_status` reservation**
  Comment: ADR 6: stable ids from day one. DTOs already omit
  `platform_refs`. Keep both tables’ columns.

- **13. One `ad_variants` row per ad**
  Comment: ADR 12 (ad + variants storage) + ADR 32 (one format). Not
  a leftover. `hidden` / `position` already went.

- **15. `POST /v1/ads/{ad_id}/ad-set`**
  Comment: ADR 6 / PRD: another internal caller can get the ad set
  without Ads. The route *is* that surface.
  Action: name the expected internal caller next to the route.

- **17. Structured ideal customer profile columns**
  Comment: ADR 8 default is married couples 30–40, stored as
  `icp_household` / `icp_age_min` / `icp_age_max`. ADR 22: precise
  targeting arrives with ad posting, without extra data entry.
  Action: none. Do not collapse to `icp_notes`.

## Doc gap

- **2. Per-ad ad leads list**
  Comment: ADR 27: per-ad ad leads **in scope**. `leads` has no
  `ad_id`; leads HTTP has no CMS list; PRD Post-MVP 6 still says
  future.
  Action: add `leads.ad_id` + `source=ad` and a per-ad read, or
  amend ADR 27. Do not silently drop the UI.

- **4. Connect Meta / Connect Google Ads**
  Comment: ADR 26 + CMS frontend: Connect lives on Ads. ADR 19
  defers Google Ads *ad posting*, not the button. No
  connection-status endpoint in this slice.
  Action: first slice: buttons cannot render (say so). Spec the
  status endpoint with ad posting.

- **5. `ads.review_status` / `ad_variants.review_status`**
  Comment: README open question 2. `status` is the lifecycle;
  `ad_reviews` is the trail.
  Action: answer question 2, then delete or define values. Not an
  auditor drop.

- **6. `icp_review_status` / `icp_source=llm_suggested`**
  Comment: ADR 8: LLM suggests asynchronously, reviewable. Backend
  test 15 exists. No River job kind.
  Action: spec the suggestion job and closed `icp_review_status`
  values. Do not drop the column.

- **7. `ads.origin` writers unnamed**
  Comment: `AdCreate` cannot set it. `owner` / `done_for_you` have
  product basis. `business_profile` has no writer.
  Action: derive from actor; drop `business_profile`; keep `llm`
  only if the suggestion pipeline is written down.

- **10. Disabled Ad posting control labelled Publish**
  Comment: `frontend-debloat.md` keeps a disabled **ad posting**
  control. ADR 28 reserves Published. Design decision 1/3 still say
  Publish.
  Action: rename the row. Keep the button.

- **16. `AdSetRead.format_number` vs PRD “revision number”**
  Comment: ADR 5 requires an ad set format number (the ad set
  contract id). PRD wording collides.
  Action: glossary + fix PRD. Separate field if a per-ad revision is
  wanted.

- **19. List filter vs `AdListGet`**
  Comment: ADR 25: spend sort **replaces** created-time once
  performance exists — that sentence stays. Gap: “filter by status,
  search by name” vs `AdListGet` only `archived`.
  Action: say browser-side over the prefetched cache, or add query
  fields.

- **20. DTO hygiene (`AdImagePlacementRead` on PATCH,
  `AdGenerateRequest` on DELETE)**
  Comment: ADR 31 needs `base_updated_at` on mutates. Write type for
  placements; shared conflict-token request (not a DELETE body).
  Action: write DTOs.

## Actually drop

- **9. `ad_reviews.note`**
  Comment: insert is actor + transition only; no DTO. Drop the
  column.

- **11. `AdImagePlacementRead.media_caption`**
  Comment: media library omits media caption on owner HTTP (ADR 13).
  Keep the **column** (generate/export notes). Drop the DTO field.

- **12. `ad_image_placements.format`**
  Comment: ADR 32: one ad, one format. Renderer uses variant format.
  Action: drop the placement column.

- **14. `GET /v1/ads/{ad_id}/variants`**
  Comment: `GET /v1/ads/{ad_id}` already hydrates `variant`. No
  screen needs the extra GET.
  Action: drop the route; tests re-read via the ad GET.

## False alarms (closed)

- **`ad-application/meta/` as spec** — README and ADR 14 already say
  investigation, not the spec. No change.
- **Variant layer / ad posting reservation / structured ideal
  customer profile / disabled performance and budget stubs** — Keep
  (ADR) above.
