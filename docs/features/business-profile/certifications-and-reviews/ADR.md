# Certifications and reviews Decision Record

Status: decided (dates on each entry). Update an entry (keeping the old decision + date)
instead of silently replacing the old entry.

## Decisions

1. **Certifications and reviews are one Profile screen** — `/cms/certifications-and-reviews`.
   Global `website_certification_definitions`; tenant selections. Unchecking is `removed`.
   No upload-your-badge. Reviews stay `business_profile_reviews`. **Top reviews** max 30,
   featured-first; new pin appends as least featured. This screen is the picker for the pool
   and for pinning more into top reviews. Website editor reviews Content used to show that
   **same set**. No `/cms/proof`. Layout is in
   [design decision record](design-decisions.md). (2026-08-20; moved from website ADR 16,
   2026-08-27)

   Unpin/reorder of **top reviews** used to rewrite unpublished `website_slot_reviews` from
   the current top set. (2026-08-20)

   (2026-08-26): Pinning **top reviews** on this screen does **not** rewrite website sections.
   Archive still drops that review from every website section array and from top reviews.
   Origins, archive, and create owner-written stay as above. Website-section ordered lists:
   [website ADR](../../website/ADR.md) 16.

   (2026-08-26): Certification definitions and selections are Details / business-profile
   tables (`certification_definitions`, `business_profile_certification_selections`), not
   `website_certification_*`. See [details ADR](../details/ADR.md) 7.
