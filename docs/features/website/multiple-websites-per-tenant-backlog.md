# Multiple websites per tenant — backlog (round 2)

Not canonical. Punch list after
[PR #89](https://github.com/MRiabov/placis/pull/89) (2026-09-04): persistence
and nested CMS HTTP are ready for N websites; owner create is deferred.
Delete an item when it is decided or the wording is fixed. Delete this file
when empty.

Round 1 parked create, Assistant multi-website knowledge, logo, and SEO
duplication in canonical docs. Round 2 patched N-ready wording (2026-09-04).
Remaining rows are parked-as-intended or waiting on another PR.

Language: [glossary](../../glossary.md). Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

---

## Already parked (do not reopen here)

| Topic | Where |
| --- | --- |
| Owner create, questionnaire, template rule, retry, list screen, `WebsiteCreate`, `/cms/websites/new` | [new-website-creation-flow.md](new-website-creation-flow.md) |
| Assistant `open_website`, pointer list, CMS knowledge of N websites | [assistant ADR](../assistant/ADR.md) 30; create-flow file |
| Logo on a second website | [ADR](ADR.md) 26; [persistence.md](persistence.md) `website_settings` |
| Near-duplicate copy / SEO across a business’s websites | [ADR](ADR.md) 26; [03](pipeline/03-website-copy-generation.md) |
| Certifications / reviews / **top reviews** per website vs ads | [ADR](ADR.md) 16, 26; [certifications ADR](../business-profile/certifications-and-reviews/ADR.md) 1 |
| Archive / delete website; failed rows count toward the cap | [persistence.md](persistence.md) `websites`; create-flow file |
| Enterprise plan cap 20 | [plans.md](../billing/plans.md) |
| Ads privacy website page URL per website vs tenant | [creatives and lead forms](../ads/ad-application/meta/03-creatives-and-lead-forms.md) |
| Isolation E2E of a second website | [testing.md](testing.md); create-flow file |
| Goose `websites` schema + `website_id` FKs | later Go slice; no migrations in this checkout |

No CMS create wait screen: after `POST /v1/websites`, the deferred
Ads-style list. Onboarding wait teaser is unchanged.

---

## Index

| ID | Area | Status | One-line |
| --- | --- | --- | --- |
| MW-22 | Publish | resolved | Blockers and Publish hard gate are this `website_id` |
| MW-23 | Hosts | resolved | `type=subdomain` inserted with `websites` + prefix |
| MW-24 | CMS nav | parked | **Sites** opens the onboarding website until the list ships |
| MW-25 | Copy generation | resolved | Leftover 06 lock is `website_id` |
| MW-26 | Copy generation | parked | 06 one-website assert is a permanent onboarding invariant |
| MW-27 | Occupancy | resolved | Tie-break `website_id % len` |
| MW-28 | Assistant | parked | Assistant must not know N websites exist this pass |
| MW-29 | Media library | resolved | Unapproved media library items are live-path on this website |
| MW-30 | Checkout | resolved | Foreign `publication_id` / `website_address_id` → **404** |
| MW-31 | Tests | resolved | E2E Open Verify reads `website_pages` for this `website_id` |
| MW-32 | Port | resolved | Port maps use `/v1/websites/{website_prefix}/…` |
| MW-33 | Frontend | resolved | Website editor HTTP and CMS routes are prefix-keyed; bare `/cms/website` is the Sites redirect |
| MW-34 | Look | parked | Demo app `/cms/website` waits on create |
| MW-35 | CI | resolved | Docs-code website ratchet arms on `/v1/websites` |
| MW-36 | Billing | wait | Billing tests and ADR still POST `/v1/website/publications` until [PR #88](https://github.com/MRiabov/placis/pull/88) |
| MW-37 | Create UX | resolved | No CMS wait screen; after create, the Ads-style list |
| MW-38 | Leads | resolved | Console filters via `website_forms.website_id` (no `leads.website_id`) |
| MW-39 | Website editor | resolved | Projection keyed on `{website_prefix}`; working copy has `website_prefix` |

---

## Parked as intended

### MW-24 — Sites opens the onboarding website

Intended until the deferred website list.
[ADR](ADR.md) 28 and [frontend.md](frontend.md): bare `/cms/website`
redirects to the onboarding website. Do not change product this pass.

### MW-26 — 06 asserts exactly one `websites` row

Permanent onboarding invariant. Onboarding never creates a second
website. Owner create is a different HTTP path and does not run this
job. [06](../onboarding/pipeline/06-website-copy-generation.md).

### MW-28 — Assistant does not know N websites

Intended this pass. No `open_website`. Website editor tools run on the
open prefix. [assistant ADR](../assistant/ADR.md) 30;
[new-website-creation-flow.md](new-website-creation-flow.md).

### MW-34 — Look app has no `{website_prefix}`

Parked with create. [`apps/demo/`](../../../apps/demo/README.md)
`/cms/website` stays until the list / prefix scenes ship.

---

## Waiting

### MW-36 — Billing still names flat `/v1/website/publications`

Do not touch billing ADR or billing testing this pass. Rebase after
[PR #88](https://github.com/MRiabov/placis/pull/88).

---

## Open questions

Answered 2026-09-04 (patched in canonical docs unless parked / wait):

1. **Publish blockers scope.** This `website_id`.
   `subscription_canceled` tenant-wide. (MW-22)
2. **Who inserts `type=subdomain`.** Every `websites` insert (05 and
   later `POST /v1/websites`), same transaction as prefix. (MW-23)
3. **Sites, N > 1, no list yet.** Keep yank-to-onboarding-website.
   (MW-24, parked)
4. **Occupancy tie-break.** `website_id % len`. (MW-27)
5. **Assistant isolation.** Accept one CMS run / thread until
   `open_website`. (MW-28, parked)
6. **Unapproved media library items.** Live-path on this website only.
   (MW-29)
7. **Checkout.** Foreign `publication_id` / `website_address_id` →
   **404**. Host isolation: never another website’s
   `{prefix}.preview.placis.com`. (MW-30)
8. **Logo.** Tenant-shared `logo_media_asset_id` for v1. (parked ADR 26)
9. **SEO / copy duplication.** Accept near-duplicate 03 for v1.
   (parked ADR 26 / 03)
10. **Ads destination and privacy URL.** Still parked ads TBD.
11. **06 defensive assert.** Keep as a permanent onboarding invariant.
    (MW-26, parked)
12. **Leads console.** Join `website_forms.website_id`. No
    `leads.website_id`. (MW-38)
13. **Certifications and reviews per application.** v1 tenant pool.
    Later ads / each website may have their own set. (parked ADR 16 / 26)

Still open (not this pass): logo override, SEO steering, ads privacy
URL, certifications/reviews per website vs ads, isolation E2E of a
second website, MW-36 after #88.
