# Leads Decision Record

Status: decided (dates on each entry). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

## Decisions

1. **One `leads` table for website leads and ad leads** — Website form
   POST and later ad-lead ingest persist into the same rows. `source`
   is `website_form` / `ad`. Nullable `website_form_id` and `ad_id`.
   HTTP list `source` is `website` / `ad` to match the picker.
   (2026-09-04)

2. **The list HTTP is the source filter** — `GET /v1/leads` Request
   `LeadListQuery`. `source=website` requires `website_prefix` (which
   website; today there is one). `source=ad` lists ad leads; optional
   `ad_id` for the ads-detail link. Omit `source` for All. Do not
   invent a second “by website vs ads” route. (2026-09-04)

3. **Leads is the access; ads detail links in** — Ads ADR 27’s per-ad
   list is not a second product surface. Ads detail shows a New-ad-leads
   count that opens `/cms/leads` with `source=ad` and that `ad_id`.
   [Ads ADR 41](../../ads/ad-generation/ADR.md). (2026-09-04)

4. **Lead states live with this screen** — `new` / `contacted` /
   `closed`. Insert writes `new`. `PATCH /v1/leads/{lead_id}` is
   status-only. (2026-09-04)
