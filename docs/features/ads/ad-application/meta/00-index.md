# Meta ad posting — investigation index

Status: investigation (not a PRD). Unshipped. Ad generation remains the
shipped-spec authority under [`ad-generation/`](../../ad-generation/prd.md). This directory is how we would
later do **ad posting** to Meta (Facebook / Instagram).

The folder is named `ad-application` because that is the future slice: take an
approved **ad set** and apply it on Meta. In product language this is still
[ad posting](../../../glossary.md).

Related:

- [Ads overview](../../README.md)
- [Ad generation PRD](../../ad-generation/prd.md) (post-MVP: Meta first)
- [Ads persistence](../../persistence.md) (`platform_refs`, `platform_status`)
- [Leads](../../../other/leads/README.md) (website leads today; ad leads later)

## What this answers

How Placis would take a contractor's **ad ready to post** ad set and run it as a
paid ad on Meta, including:

1. which Meta accounts the contractor must already own
2. how Placis authenticates and keeps acting without the owner sitting in Ads
   Manager
3. how the ad set maps onto Meta's campaign objects
4. how Instant Forms become the real **ad lead form**
5. how Meta reviews and verifies ads (and the advertiser), and what Placis
   should do when an ad is rejected

## Reading order

1. [Access and accounts](01-access-and-accounts.md) — Business Portfolio, Facebook Page, ad account, Login
   for Business, App Review, billing
2. [Campaign structure](02-campaign-structure.md) — Campaign → Ad set → Ad → Creative, objectives, mapping
   to Placis
3. [Creatives and Instant Forms](03-creatives-and-lead-forms.md) — image hashes,
   ad formats, copy, CTAs, privacy policy, thank-you website page
4. [Review and verification](04-review-and-verification.md) — ad review, pre-check, identity/business
   verification, contractor-relevant policy
5. [Recommended application shape](05-recommended-application-shape.md) — proposed product path, gates, phasing, open
   decisions

## Scope of this investigation

In:

- Meta Marketing API (Graph API) as it stood in 2026 (v25 / v26 docs)
- Instant Forms (lead ads) that land people on the contractor's website after
  submit
- Website-click ads to a published **ad destination**
- Meta's own ad review and advertiser verification
- Placis App Review and Marketing API Access Tier (company-level, once)

Out:

- Google Ads
- Video ads (deferred in ad generation)
- Pixel / Conversions API as a first requirement (needed later for
  website-conversion optimization)
- Full ads-manager UX (budgets as a console, A/B, retargeting dashboards)
- Running ads from a Placis-owned Facebook Page as if they were the contractor

## Source of truth for names

Use [glossary](../../../glossary.md) terms in product sentences: **ad**, **ad set**, **ad posting**,
**ad platform**, **ad lead form**, **ad lead**, **ad destination**,
**ideal customer profile**.

Meta's own object names (Campaign, Ad Set, Ad, Ad Creative, Instant Form,
Facebook Page, Business Portfolio) stay as Meta names in these investigation
files. They are not Placis domain terms.

## Official starting points

- [Marketing API get started](https://developers.facebook.com/docs/marketing-api/get-started)
- [Lead Forms for Ads](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/create/)
- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/)
- [Advertising Standards](https://transparency.meta.com/policies/ad-standards/)
- [Special Ad Categories](https://developers.facebook.com/docs/marketing-api/audiences/special-ad-category/)
