# Recommended Meta application shape — investigation

Status: investigation. Proposed product path for **ad posting** to Meta, given
the rest of this folder. Not an ADR until we decide the open questions.

See also: [index](00-index.md), [access](01-access-and-accounts.md),
[campaign structure](02-campaign-structure.md),
[creatives](03-creatives-and-lead-forms.md),
[review](04-review-and-verification.md).

## What "apply to the website" should mean

Ads are not injected into the contractor website. The website is already the
**ad destination**. Applying an ad means:

1. The approved **ad set** is sent to Meta as a paid campaign.
2. People either fill an **Instant Form** (real **ad lead form**) and then land
   on the thank-you **ad destination**, or they click through to that website
   page directly.

That matches ad generation: zip download is temporary; direct transmission to
Meta replaces it (ADR 5). The live website must already be published.

## Account model

**Contractor-owned Facebook Page + ad account + payment method. Placis connected
via Facebook Login for Business (business integration system user access
token).**

Done-for-you operates that account after the owner grants access once. Placis
does not advertise *as* Placis for them.

## Happy path (v1)

Preconditions (all blocking, all owner-readable):

- Website publication exists; **ad destination** is live HTTPS.
- A published legal/privacy website page exists (Instant Form).
- Meta connected: Facebook Page (ADVERTISE), ad account active, payment method
  present.
- Instagram linked if the ad includes Story.
- Placis ad is Creative ready; validation still passes.
- Budget + schedule filled (today's disabled fields become live).
- Placis company app has Advanced Access + Marketing API Full Access for
  production.

Job (River), safe to retry on `(tenant_id, ad_id, revision)`:

```text
upload crops → image hashes
create Instant Form on the Facebook Page (privacy + thank-you → ad destination)
create Campaign PAUSED (OUTCOME_LEADS, special_ad_categories NONE)
create Meta Ad Set (targeting from ideal customer profile + service area,
                    destination ON_AD, budget/schedule)
for each ad variant present:
    create Ad Creative (object_story_spec)
    create Ad PAUSED
validate_only + synchronous_ad_review
if fail: stop, platform_status=error, show errors
else: set Ads (or campaign) ACTIVE
write platform_refs
subscribe ad-account + Facebook Page leadgen webhooks (once per connection)
```

Then:

- Webhook / reconcile `effective_status`.
- `ACTIVE` → existing-ad status **Published**.
- `DISAPPROVED` / `WITH_ISSUES` → stay Creative ready, `platform_status=error`,
  show feedback.
- `leadgen` webhook → **ad lead** rows, listed on the ad.

## Mapping summary

| Placis | Meta v1 |
| --- | --- |
| One ad (one offer) | One Campaign + one Meta Ad Set |
| Ideal customer profile | Age + geo (service area). Household optional later |
| Ad lead form suggestions | Instant Form; privacy from legal website page |
| Ad destination | Thank-you `VIEW_WEBSITE` URL (and website-click fallback) |
| Ad variant | One Ad + Creative |
| `learn_more` / `get_quote` | Same CTA types on Instant Form |
| `call_now` / `message` | v1: remap to `GET_QUOTE` or a later destination type |
| Creative ready | Objects created, not yet `ACTIVE` or still in review |
| Published | `effective_status=ACTIVE` (or paused after having run) |
| `platform_refs` / `platform_status` | Filled as above |

## Phasing

Do not build "full ads manager" to post the first ad.

| Phase | Ship | Why |
| --- | --- | --- |
| **0** | Ad generation (current spec) | Need a stable ad set |
| **1** | Connect Meta + checklist (Facebook Page, ad account, payment, privacy website page) | Unblocks everything; useful even while posting is manual |
| **2** | Apply one Instant Form campaign from a Creative-ready ad, paused then active; review status in the detail view | Replaces the zip as the real deliverable |
| **3** | Ad lead webhooks into leads + per-ad list (ADR 27) | Makes posting valuable |
| **4** | Website-click campaigns, Story/IG hardening, insights on the detail view | Additive |
| Later | Pixel / Conversions API, Advantage+ / placement customization, call/message destinations, Google Ads | Explicitly later |

Company ops in parallel with phase 1: Business Verification, App Review, Full
Access. Without those, phase 2 only works for app testers.

## What we will not do in v1

- Create Facebook Pages silently.
- Collect card numbers.
- Auto-appeal or auto-rewrite rejected ads.
- Mix Instant Form and website conversion in one campaign.
- Target "married couples" if Meta will not give us a clean targeting spec —
  age + service area is enough.
- Declare `HOUSING` to dodge a rejection.
- Run political ads.
- Depend on the zip download.

## Data model gaps (for a later implementation pack)

Existing `ads.platform_refs` / `platform_status` are enough for Meta ids. We
still need:

- Tenant-level Meta connection (tokens, Facebook Page, ad account, Instagram,
  funding/verification flags). Not an ad row.
- Budget and schedule on the ad (or a child posting record). Typed, with
  currency matching the ad account.
- Instant Form id + privacy URL used (audit).
- Ad lead identity (Meta `lead_id`) on leads, unique per tenant.
- Webhook receipts (dedupe `leadgen_id`).

Do not copy Meta's whole object graph into Postgres. Store ids + status + the
fields we edit.

## Testing stance

- Unit / service tests: mapping, safe-to-retry job, CTA rules, validation gates.
  Meta HTTP faked.
- One E2E per epic: create Creative-ready ad → (with a test connection) run the
  job against a **real test ad account** creating `PAUSED` objects and
  `validate_only`. Do not mock Postgres or our domain.
- Full `ACTIVE` + human review: staging only; not CI.
- Never put production tokens in CI.

## Open decisions (need a human)

These are product calls, not API facts. Proposed defaults in italics.

1. **Is the folder name `ad-application` a new glossary term, or do we keep
   saying ad posting?** *Keep **ad posting** in product language; folder can
   stay as the engineering slice.*
2. **Default destination: Instant Form vs website click?** *Instant Form,
   thank-you to the ad destination — matches the current ad lead form.*
3. **In-review label on an existing ad?** Creation-flow states must not be
   reused (ADR 28). Options: keep Creative ready + a Meta badge, or add a label
   under existing-ad statuses. *Badge, no new Ad states value until we feel it.*
4. **Who pays Meta?** *Contractor's payment method always for v1.*
5. **`call_now` / `message` in v1?** *Remap Instant Form to `GET_QUOTE` with a
   note; true click-to-call / Messenger as phase 4.*
6. **Must Story wait for Instagram?**
   *Yes: omit Story delivery if no IG, still post feed formats.*
7. **Privacy website page:** do templates always include one in website
   publication? If not, posting is blocked until we add it to website templates.

## Company checklist (Placis ops)

- [ ] Business type Meta app + Login for Business configuration
- [ ] Placis Business Portfolio verified
- [ ] App Review Advanced Access for the permission set in the access doc
- [ ] Marketing API Access Tier Full Access (after 500 clean calls)
- [ ] Webhook HTTPS endpoint (Facebook Page `leadgen`, ad account
      `effective_status`)
- [ ] Token encryption at rest
- [ ] Test ad account, test Facebook Page, test payment method
- [ ] Account Quality access for done-for-you

## Official docs (keep nearby)

- [Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/)
- [Lead Forms for Ads](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/create/)
- [Ad object / execution_options](https://developers.facebook.com/docs/marketing-api/reference/adgroup/)
- [Ad review feedback](https://developers.facebook.com/docs/marketing-api/reference/adgroup-review-feedback/)
- [Advertising Standards](https://transparency.meta.com/policies/ad-standards/)
- [Special Ad Categories](https://developers.facebook.com/docs/marketing-api/audiences/special-ad-category/)
- [Ad account webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-ad-accounts/)
- [Marketing API Access Tier](https://developers.facebook.com/docs/marketing-api/overview/rate-limiting/)
