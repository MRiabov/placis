# Sep 3 issue list — Business profile

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

Covers Details, Projects, and Certifications and reviews.

## High

1. **Six of seven founder columns have no reader**
   Issue: persistence. Action: keep `founder_name` only; drop the rest
   from the first migration (or name a consumer).
   Where:

   - [details/persistence.md](details/persistence.md) lines 33–35, 52–55
   - [details/ADR.md](details/ADR.md) lines 29–33
   - [details/frontend.md](details/frontend.md) line 92 (“Do not add
     unless asked: founder columns”)
   - [details/api.md](details/api.md) (`GET /v1/business-profile` does
     not include them)
   - [../onboarding/api.md](../onboarding/api.md) line 50 (`founder_name`
     only)

2. **Four brand columns duplicate website styles**
   Issue: persistence. Action: drop from `business_profiles`.
   Where:

   - [details/persistence.md](details/persistence.md) line 36
   - [details/ADR.md](details/ADR.md) lines 32–33
   - [details/frontend.md](details/frontend.md) line 92 (banned from the
     screen)
   - Live website styles:
     [../website/persistence.md](../website/persistence.md) lines 151–158
     (`preset_id`, `primary`, `neutral`, `accent`, `radius`, `density`)

3. **`trading_name` and `legal_form` appear only in the schema**
   Issue: persistence. Action: drop.
   Where: [details/persistence.md](details/persistence.md) lines 28,
   47–48. Not on screens, DTOs, variables, or the complete-gate
   mapping.

4. **`business_profile_reviews.position` is dead**
   Issue: persistence. Action: drop.
   Where: [details/persistence.md](details/persistence.md) line 119.
   Pool order is `is_top` then `top_position`; per website section order is
   `website_slot_reviews.position`.

5. **`certification_definitions.registry_url` is dead**
   Issue: persistence. Action: drop.
   Where: [details/persistence.md](details/persistence.md) line 174.
   Screen is badge, name, checkbox.

6. **Website variables with no backing column (profile-owned facts)**
   Issue: gap in website variables, cited here because the columns would
   live on this record. Action: remove the tokens, or add columns.
   Where:

   - [../website/variables.md](../website/variables.md)
     (`{{address}}` — [details/ADR.md](details/ADR.md) says there is
     deliberately no business-location column)
   - `{{projects.categories}}` — [projects/persistence.md](projects/persistence.md) has no category;
     [projects/frontend.md](projects/frontend.md) rules it out on cards

## Medium

7. **`vat_registration_status` is write-only**
   Issue: persistence. Action: drop, or put it on HTTP / a gate.
   See [../onboarding/sep-3-issue-list.md](../onboarding/sep-3-issue-list.md)
   item 4.
   Where: [details/persistence.md](details/persistence.md) line 29;
   [../onboarding/pipeline/build-profile.md](../onboarding/pipeline/build-profile.md)
   line 64.

8. **`business_profile_reviews.language` and `published_at`**
   Issue: persistence. Action: drop if cards stay stars / author /
   review citation / origin only.
   Where: [details/persistence.md](details/persistence.md) lines 116–117.

9. **`business_profile_services.website_page_path` has no writer**
   Issue: persistence. Action: website 02 writes it, or drop.
   Where: [details/persistence.md](details/persistence.md) line 102.
   Website 02 copies a service website page per named service without this
   column.

10. **`emergency_phone` is required with no owner-facing consumer**
    Issue: functionality. Action: keep as done-for-you contact, but
    then the follow-up surface must exist; or drop the complete-gate
    required flag.
    Where: [details/persistence.md](details/persistence.md) line 18;
    [../onboarding/pipeline/build-profile.md](../onboarding/pipeline/build-profile.md)
    line 87; [details/README.md](details/README.md) keeps it off the
    screen and unpublished.

11. **Profile history is asymmetric on projects**
    Issue: persistence. Action: `projects/api.md` writes increments, or
    drop `list=projects` (and unused `facebook_posts` /
    `instagram_posts`) from `business_profile_edits`.
    Where: [details/persistence.md](details/persistence.md).

12. **Linked-Facebook card fields that `facebook_profiles` does not store**
    Issue: gap. Action: add name / photo / rating / review count, or stop
    promising them. Where: [details/api.md](details/api.md); [details/README.md](details/README.md);
    [details/persistence.md](details/persistence.md) (`facebook_profiles` has id/URL, handle, algorithm
    — not those card fields).

13. **`top_reviews_provisional` already slated for removal** Issue: persistence.
    Action: move ranking onto the classifications table as the TODO says, before
    more tests pin the old shape. Where:
    [../../general-architecture/persistence.md](../../general-architecture/persistence.md).

## Keep

- **Services is not redundant** with projects or certifications: service
  website pages, top menu / footer children, `ads.service_focus_id`.
- No blog/careers entity in this feature (CSS leftovers are already on
  the delete list).
- Reviews `is_top` / `top_position` / review citation / archive.
- Certifications selections table.
- Project draft / approve / archive.
