# Meta access and accounts — investigation

Status: investigation. How Placis would connect to a contractor's Meta accounts
so ad posting can run without the owner living in Ads Manager.

See also: [index](00-index.md), [campaign structure](02-campaign-structure.md).

## Recommendation in one paragraph

The contractor owns the Facebook Page, Instagram professional account (optional
but wanted), Business Portfolio, and ad account, including the payment method.
Placis is a connected Meta app. The owner grants access once through
**Facebook Login for Business**, which issues a
**business integration system user access token** that does not expire until
they revoke the app. Placis never runs ads from a Placis-owned Facebook Page,
and never bills Meta spend on a Placis card as the default.

## The Meta accounts actually required

An ad does not live on the contractor website. It lives on Meta, attributed to a
**Facebook Page**, paid from an **ad account**, and optionally shown as an
Instagram account.

| Meta account | Why it is required | Who should own it |
| --- | --- | --- |
| Personal Facebook login | Every admin signs in as a person. Meta does not allow shared fake logins. | Owner (or their marketing employee) |
| Business Portfolio (formerly Business Manager) | Container for Pages, ad accounts, people, system users | Contractor |
| Facebook Page | Every ad creative needs a `page_id`. Ads appear as that Facebook Page. | Contractor |
| Instagram professional account | Needed for Instagram / Stories / Reels placements as that business | Contractor, linked to the Facebook Page |
| Ad account | Campaigns, billing, spend limits | Contractor |
| Payment method on the ad account | Without it, ads sit in `PENDING_BILLING_INFO` and never deliver | Contractor |
| Placis Meta app + Placis Business Portfolio | Our app, App Review, rate limits | Placis |

Creating an ad account through the API is possible
(`POST /{business_id}/adaccount`) but does not remove the human steps: payment
method, often identity or business verification, and a Facebook Page the ads can
promote. Prefer connecting what they already have.

### Facebook Page is non-negotiable

Lead ads require a Facebook Page access token from someone who can perform the
**ADVERTISE** task on the Facebook Page (`pages_manage_ads`,
`pages_read_engagement`, `pages_show_list`). Website-click ads still need
`page_id` on `object_story_spec`. If the contractor has no Facebook Page, ad
posting cannot start; creating a Facebook Page for them is a separate onboarding
step, not a silent API side-effect of "apply this ad".

### Instagram is optional for v1, required for Story

Placis already produces a **Story** ad format (9:16). To deliver that on
Instagram Stories / Reels as the contractor, the Facebook Page must be linked to
an Instagram professional account and the creative should set
`instagram_user_id`. Without Instagram, we can still run Facebook feed /
carousel, and should omit Story delivery rather than invent a Facebook-Page-only
story that looks wrong.

## Two authentication models — pick one

Meta documents both. They are not interchangeable.

### Model A — Facebook Login for Business (recommended)

Official: [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/).

- Placis app is a **business type** app, attached to Placis's own verified
  Business Portfolio.
- We save a Login configuration: permissions + which account types (Facebook
  Pages, ad accounts, Instagram).
- The owner logs in from the web CMS, picks **their** Business Portfolio, and
  grants only the accounts we need.
- We request a **business integration system user access token**, not a
  short-lived user token. That token is tied to the contractor's Business
  Portfolio, defaults to never expire, and can be revoked in Business Settings →
  Integrations → Connected apps.
- Any admin of the contractor's Business Portfolio can grant it. Actions are not
  attributed to one person's Facebook user, which is what we want for
  done-for-you automation.

Use a user token only for interactive "the owner is clicking Connect right now"
steps. Use the business integration system user access token for River jobs:
create campaign, poll review, fetch ad leads.

### Model B — On Behalf Of / partner Business Manager

Official: [On Behalf Of](https://developers.facebook.com/docs/marketing-api/business-manager/guides/on-behalf-of/).

This is the older agency pattern: Placis's admin business integration system
user creates a business integration system user **inside the contractor's**
Business Portfolio. It still requires the contractor admin to login once. More
moving parts, easier to get wrong, and Meta's current preference for this kind
of app is Login for Business. Do not start here.

### What we should not do

- **User tokens for nightly jobs.** They expire and are tied to one person
  leaving the company.
- **One shared Facebook user** that Placis employees log into. Meta treats that
  as spam and can suspend it. See [Business Manager best practices](https://developers.facebook.com/docs/marketing-api/business-manager/best-practices/).
- **Placis-owned ad account promoting many contractors.** The Facebook Page
  would be wrong, the advertiser identity would be Placis, website-page / offer
  mismatch would fail review, and billing/attribution would be a mess.
- **Spending on Placis's payment method by default.** Meta spend is the
  contractor's Meta buy. Done-for-you can still *operate* the account.

## Permissions Placis must ask for

Login for Business supported permissions we actually need for ad posting + ad
leads:

| Permission | Why |
| --- | --- |
| `ads_management` | Create/update campaigns, ad sets, ads, creatives, images |
| `ads_read` | Read status, insights, review feedback |
| `business_management` | List businesses, accounts, grant business integration system user access |
| `pages_show_list` | Let the owner pick a Facebook Page |
| `pages_read_engagement` | Read the Facebook Page; required for lead ads |
| `pages_manage_ads` | Create Instant Forms and ads as that Facebook Page |
| `pages_manage_metadata` | Subscribe the Facebook Page to `leadgen` webhooks |
| `leads_retrieval` | Read submitted Instant Form answers |
| `instagram_basic` | List / use the linked Instagram account (when present) |

`public_profile` / `email` come along with Login; they are not the point.

To serve contractors we do not own, each of these needs **Advanced Access** via
App Review. Development Mode only works for people with a role on the Placis
app.

## Company-level Meta work (Placis, once)

This is independent of any contractor.

1. Create a **business type** Meta app.
2. Attach it to **Placis's Business Portfolio**.
3. Complete **Business Verification** for Placis. Advanced Access for other
   businesses requires it ([Business Verification](https://developers.facebook.com/docs/development/release/business-verification/)).
4. Add products: Facebook Login for Business, Marketing API, Webhooks, Pages.
5. Submit App Review for the permissions above, with a screencast of the real
   connect + apply-ad flow (can be a staging contractor).
6. Start on **Marketing API Access Tier = Limited Access** (dev quota). Move to
   **Full Access** once the app has 500 Marketing API calls in 15 days and error
   rate under 15% on the last 500 calls. Renamed May 2026; previously "Ads
   Management Standard Access". Limited Access is not a production quota for
   real advertisers. Docs: [Rate limiting](https://developers.facebook.com/docs/marketing-api/overview/rate-limiting/), [changelog 2026-05-04](https://developers.facebook.com/docs/marketing-api/marketing-api-changelog/).

Until Full Access lands, we can build and test with app-role users and a small
number of ad accounts. We cannot honestly "apply ads" for arbitrary contractors.

## Billing — API cannot skip it

Meta will create objects without a funding source, but they will not deliver.
[`funding_id` on ad-account create](https://developers.facebook.com/docs/marketing-api/reference/business/adaccount/):
if omitted, ads get no delivery.

Adding a card is a human flow in Meta Business Suite / Ads Manager. Placis
should:

1. Detect ad account `funding_source` / `account_status` /
   `PENDING_BILLING_INFO`.
2. Block **ad posting** with an owner-readable message: add a payment method in
   Meta, then return.
3. Not try to collect card numbers ourselves.

Spend itself is charged by Meta to that payment method. Placis billing (website
activation / subscription) stays separate. If we later resell Meta spend as a
managed service, that is a commercial decision (agency credit line, invoicing) —
not required to post the first ads.

## Verification of the *advertiser* (not the ad)

Two different Meta processes, both easy to confuse with ad review:

### Business verification (Business Portfolio)

Confirms the Business Portfolio belongs to a real legal entity. Triggered for
developer features, some billing, spend, and when Meta asks. Done in Meta
Business Suite → Security Centre with registration documents and a phone
number/email/domain check. Help: [Verify your business](https://www.facebook.com/business/help/2058515294227817).

Placis must do this for *our* Business Portfolio. Many contractors will also be
asked; we cannot complete it for them. We can only detect "verification
required" and send them there.

### Identity verification (person)

Government ID for a person. Common when Meta flags the person, payment method,
or (always) for issues/elections/politics ads — which we will not run.

### Account Quality

Rejected ads and restricted accounts are appealed in **Account Quality**, not in
our UI. We should deep-link there and surface `ad_review_feedback` /
`issues_info` so the owner or done-for-you knows *why*.

## What to persist on the tenant

Do not invent a second ads graph. Extend the existing `platform_refs` idea.

Per tenant (connection):

- Meta Business Portfolio id (`client_business_id` from
  `GET /me?fields=client_business_id`)
- Ad account id (`act_…`)
- Facebook Page id
- Instagram user id (nullable)
- Encrypted business integration system user access token (and Facebook Page
  token if we still need a distinct one)
- Granted permission set + account ids
- Connection status: `not_connected` / `connected` / `needs_reconnect` /
  `restricted`
- Last successful API call / last error

Per ad (already planned on `ads` / `ad_variants`):

- `platform_refs` campaign / ad set / ad / creative / Instant Form ids
- `platform_status`

Tokens never go in git, logs, or `ai_generations`. Audit *that* we connected or
posted, not the secret.

## Connect flow (owner-facing, CMS)

Prefetch connection status on app load is already an ad-generation decision (ADR
26). When we add posting:

1. **Connect Meta** — Login for Business, pick Facebook Page + ad account (+
   Instagram).
2. We validate: ADVERTISE on the Facebook Page, ad account active, payment
   method present, Facebook Page–IG link if they want Story.
3. Show a short checklist of anything missing (no Facebook Page, no card,
   verification required).
4. Only then enable **Apply this ad** on an existing Creative-ready ad.

Done-for-you uses the same connection. The owner still has to grant it once; we
cannot bypass Facebook Login.

## Failure modes to design for

- Owner revokes the app → token dies; `needs_reconnect`.
- Facebook Page unpublished / restricted → creatives fail; ads `WITH_ISSUES`.
- Ad account disabled (payment fail, policy) → nothing delivers; show Account
  Quality.
- Token valid but Advanced Access not granted → only app-role users work;
  production contractors cannot connect.
- Rate limit (`ads_api_access_tier` in response headers) → queue and backoff; do
  not retry-storm Instant Form creates.

## Implications for Placis

- Ad posting is blocked on **company** App Review + Business Verification, not
  just engineering.
- The first product increment that is actually useful is **Connect Meta** (read
  accounts, show status), even before we create a campaign.
- The website is the **ad destination** and the Instant Form privacy / thank-you
  URL. It is not the place ads are "applied onto". Ads are applied onto Meta,
  and send people to the live website.
