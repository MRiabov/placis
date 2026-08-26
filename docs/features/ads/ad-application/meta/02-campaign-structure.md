# Meta campaign structure — investigation

Status: investigation. How a Placis **ad** becomes Meta Campaign / Ad Set / Ad / Creative
objects.

See also: [index](00-index.md), [access](01-access-and-accounts.md),
[creatives](03-creatives-and-lead-forms.md).

## Recommendation in one paragraph

Treat one Placis **ad** (one offer) as one Meta **Campaign** with objective
`OUTCOME_LEADS`. Put targeting, budget, and schedule on one Meta **Ad Set** with
`destination_type=ON_AD` (Instant Form). Create one Meta **Ad** + **Ad Creative** per
Placis **ad format** that exists in the ad set (square, portrait, carousel, story).
Create everything `PAUSED`, pre-check, then set `ACTIVE` so Meta review starts. Store
every Meta id on `platform_refs`.

## Meta's hierarchy (required order)

```text
Business Portfolio
  └─ Ad account
       └─ Campaign          (objective, special ad category)
            └─ Ad Set       (audience, budget, schedule, destination, optimization)
                 └─ Ad      (pairs a Creative with that Ad Set)
                      └─ Ad Creative  (Facebook Page, images, copy, CTA, Instant Form id)
```

You cannot create a child without the parent. Creatives can be created on the ad account
first and then referenced; ads still need an ad set.

Official shape: [Ad Account campaigns](https://developers.facebook.com/docs/marketing-api/reference/ad-account/campaigns/),
[Ad](https://developers.facebook.com/docs/marketing-api/reference/adgroup/).

### Naming collision

Meta's "Ad Set" is **not** the Placis **ad set**.

| Placis | Meta |
| --- | --- |
| **Ad** — one offer / marketing goal | Campaign + (usually) one Ad Set + N Ads |
| **Ad set** — the approved deliverable (images, copy, destination, suggested lead form) | — |
| **Ad variant** — one ad format | One Ad + one Ad Creative |
| **Ad lead form** (suggested fields) | Instant Form on the Facebook Page (`leadgen_forms`) |
| **Ideal customer profile** | Ad Set `targeting` |
| Budget / schedule (stub in Ads UI today) | Ad Set `daily_budget` / `lifetime_budget`, `start_time`, `end_time` |

Never say "ad set" in a mixed sentence without making clear which one. In this investigation
file, "Meta Ad Set" means Meta's object.

## Objectives (ODAX)

Legacy objectives (`LEAD_GENERATION`, `LINK_CLICKS`, …) are invalid on current API
versions. Use Outcome-Driven Ads Experience (ODAX) values. Current set:

- `OUTCOME_AWARENESS`
- `OUTCOME_TRAFFIC`
- `OUTCOME_ENGAGEMENT`
- `OUTCOME_LEADS`
- `OUTCOME_SALES`
- `OUTCOME_APP_PROMOTION`

For contractors, two objectives matter.

### Default: `OUTCOME_LEADS` + Instant Form

Matches the product: capture an **ad lead** without inventing a campaign landing website page.

Campaign:

- `objective=OUTCOME_LEADS`
- `buying_type=AUCTION`
- `special_ad_categories=['NONE']` (required even when none apply)
- `status=PAUSED`

Meta Ad Set:

- `destination_type=ON_AD`
- `optimization_goal=LEAD_GENERATION` or `QUALITY_LEAD`
- `billing_event=IMPRESSIONS`
- `promoted_object.page_id=<PAGE_ID>`
- `daily_budget` in the **account currency's minor units** (cents for USD/GBP/EUR)
- `targeting` from the confirmed ideal customer profile + service area

Official walkthrough: [Lead Forms for Ads](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/create/).

`QUALITY_LEAD` is better when we later send CRM-quality signals; for v1 use
`LEAD_GENERATION`. Higher-intent Instant Forms (`is_optimized_for_quality=true`) add a
confirm step and are worth turning on for quote requests.

### Alternative: website clicks

When the owner wants people on a website page (and we are not using an Instant Form):

- Campaign `OUTCOME_LEADS` with `destination_type=WEBSITE`, or `OUTCOME_TRAFFIC`
- Creative `link` = live **ad destination** URL
- Optimization for traffic is weaker without a Pixel / Conversions API event

This is the true "apply the ad to the website" path: the ad's click lands on a published
website page. Instant Forms still *use* the website (privacy policy + thank-you website page) but
the conversion happens on Meta.

Do not start with `OUTCOME_SALES`. Contractors are not running a product checkout.

## Special Ad Categories

Every campaign **must** send `special_ad_categories`. For typical roofing / landscaping /
renovation ads that is `NONE` (or `[]`).

Official: [Special Ad Categories](https://developers.facebook.com/docs/marketing-api/audiences/special-ad-category/).

| Category | When | Effect on targeting |
| --- | --- | --- |
| `NONE` | Default for home-service ads | Full age / geo / detailed targeting |
| `HOUSING` | Marketing housing *opportunities* (rent, sale, listings) | Age locked 18–65+, no gender, min radius 15 mi / 25 km (US/CA) or 15 km (EU), no zips, no lookalikes |
| `EMPLOYMENT` | Hiring | Same restrictions |
| `FINANCIAL_PRODUCTS_SERVICES` | Credit / finance (US especially) | Same restrictions |
| `ISSUES_ELECTIONS_POLITICS` | Political / social issue ads | Authorization, disclaimers, Ad Library; **out of scope** |

Home-service ads are **not** housing ads. We should still:

1. Always send `NONE` explicitly.
2. Never put housing-opportunity language in copy ("homes for sale", mortgage, etc.).
3. If Meta's classifier pauses the campaign and asks for `HOUSING`, done-for-you handles
   it; do not auto-flip to `HOUSING` just to make targeting "work" — that would destroy
   the 30–40 age default.

Meta enforces mis-declared categories by pausing ads. `WITH_ISSUES` + `issues_info` is how
that shows up on the API.

## Mapping Placis → Meta

Proposed default for one approved Placis ad:

```text
Placis Ad
  ├─ Meta Campaign
  │     objective OUTCOME_LEADS, special_ad_categories NONE
  ├─ Meta Ad Set
  │     targeting ← ideal customer profile + service area
  │     budget/schedule ← owner-confirmed (today's disabled UI fields)
  │     destination ON_AD
  ├─ Instant Form
  │     questions ← ad lead form suggestions + required privacy policy
  │     thank you → ad destination URL
  └─ for each present ad variant:
        upload crops → image hashes
        Ad Creative (object_story_spec)
        Ad (creative_id, adset_id)
```

`platform_refs` sketch (flexible JSON already allowed on `ads` / `ad_variants`):

```json
{
  "facebook": {
    "ad_account_id": "act_…",
    "page_id": "…",
    "campaign_id": "…",
    "adset_id": "…",
    "leadgen_form_id": "…",
    "ads": {
      "feed_square": { "ad_id": "…", "creative_id": "…" },
      "carousel": { "ad_id": "…", "creative_id": "…" }
    }
  }
}
```

One Meta Ad Set for all formats means they share budget and audience, which is what we
want. Splitting formats into separate Meta Ad Sets would split spend and learning.

### Why not Advantage+ "one creative, Meta crops"?

Placis already produces format-accurate crops. Handing Meta a single 1:1 and letting it
crop for Stories would throw away that work. Prefer:

- **v1:** separate Ads in one Meta Ad Set, with `targeting.publisher_platforms` /
  positions narrowed per format (feed vs story), **or**
- **soon after:** [Placement customization](https://developers.facebook.com/docs/marketing-api/ad-creative/asset-customization)
  so one Ad carries per-placement images.

v1 separate Ads is simpler to debug when review fails (feedback is per Ad).

## Targeting from the ideal customer profile

The profile is loose by design (ADR 22). At ad posting it becomes a Meta targeting spec.

Practical mapping for the default "married couples aged 30–40":

| Ideal customer profile field | Meta targeting | Caution |
| --- | --- | --- |
| `age_min` / `age_max` | `age_min`, `age_max` | Fine under `NONE`. Illegal to imply in **copy**. |
| Service area | `geo_locations.custom_locations` (lat/lng + radius) or cities | Radius 0.63–50 miles (1–80 km). Match how we store service area. |
| Household / married | Life-event / relationship detailed targeting **if still offered** | Often restricted; never required. Age + geo is enough for v1. |
| `location_focus` notes | Do not parse free text into targeting | Owner confirms service area in Ads; we already have it |

Do not put "ideal for homeowners 40–55" in primary text. That is both a Placis rule and
Meta's personal-attributes policy.

EU / EEA / Switzerland: ads cannot target youth. Our default 30–40 is fine. If we ever
allow 18–20, exclude those countries.

EU Digital Services Act: ad sets targeting DSA-regulated locations need payor/beneficiary
on the ad account (`default_dsa_payor`, `default_dsa_beneficiary`). Set when we first
connect a UK/EU ad account that will run in the EU.

## Status fields (three layers)

On Campaign, Meta Ad Set, and Ad:

| Field | Meaning |
| --- | --- |
| `status` / `configured_status` | What we set: `ACTIVE`, `PAUSED`, `ARCHIVED`, `DELETED` |
| `effective_status` | What is actually happening, including parents and review |

`effective_status` values include: `ACTIVE`, `PAUSED`, `DELETED`, `PENDING_REVIEW`,
`DISAPPROVED`, `PREAPPROVED`, `PENDING_BILLING_INFO`, `CAMPAIGN_PAUSED`, `ADSET_PAUSED`,
`ARCHIVED`, `IN_PROCESS`, `WITH_ISSUES`.

Create as `PAUSED`. Publishing is `POST` with `status=ACTIVE`. The object then goes
`PENDING_REVIEW` until Meta finishes. Pausing the campaign pauses delivery even if ads
are `ACTIVE`.

Map onto Placis existing-ad labels:

| Meta `effective_status` | Placis existing-ad status | `platform_status` |
| --- | --- | --- |
| (not posted) | Creative ready | `not_connected` |
| `IN_PROCESS` / `PENDING_REVIEW` | Creative ready (or a posting-in-review badge) | `synced` with review pending — see open question |
| `ACTIVE` | **Published** | `synced` |
| `PAUSED` / `CAMPAIGN_PAUSED` / `ADSET_PAUSED` | Published (paused) | `synced` |
| `DISAPPROVED` / `WITH_ISSUES` | Creative ready + error | `error` |
| `PENDING_BILLING_INFO` | Creative ready + billing gate | `error` |
| `needs edits after we change the ad set` | Creative ready | `needs_sync` |

Do not invent a fifth Ad states value in the glossary until we decide the in-review
label. Creation-flow states stay as they are; posting is the "Published" transition
already reserved.

## Create, don't edit-in-place

Meta creatives are effectively append-only. Changing copy or image usually means a **new
creative + new ad** (or a new ad that points at a new creative), which re-enters review.
That matches Placis: an approved ad set is a revision; a new revision is a new post, not
a silent overwrite.

Safe-to-retry posting: if we already stored `campaign_id` for this ad revision, resume
from the next missing object instead of creating a second campaign. Use the stable Placis
ad id + revision number as an idempotency-key in our DB, not as a Meta field.

## Insights (later)

Performance is not required to post, but the model is ready (ADR 6). Read
`/{object-id}/insights` at campaign, Meta Ad Set, or Ad level. Attach to stable Placis
ids. Do not build a dashboard in v1; the existing-ad detail already has a performance
area.

## Implications for Placis

- Budget and schedule, currently disabled in Ads, become **real required fields** before
  Apply. They live on the Placis ad (or a small posting record), then copy into the Meta
  Ad Set.
- We need a posting job (River), not an HTTP request that waits for review.
- `platform_refs` should be written as each object succeeds, so a retry does not duplicate
  the campaign.
