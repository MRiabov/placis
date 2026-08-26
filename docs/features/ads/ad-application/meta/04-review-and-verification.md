# Meta ad review and verification — investigation

Status: investigation. What "verification of ads" actually is on Meta, what Placis can check
before posting, and what we do when Meta says no.

See also: [index](00-index.md), [access](01-access-and-accounts.md),
[creatives](03-creatives-and-lead-forms.md).

## Recommendation in one paragraph

Treat Meta review as a **second gate after Placis approval**, not a replacement for it.
Before setting `ACTIVE`, run API `validate_only` plus `synchronous_ad_review` to catch
language and obvious creative issues. After the ad is ACTIVE, subscribe to ad-account webhooks
(`effective_status`, `with_issues_ad_objects`) and read `ad_review_feedback`. Identity and
business verification are **advertiser** checks the owner completes in Meta; we only
detect and explain them. Conservative marketing statements and approved media library items are the
main reasons contractor ads survive review.

## Three different "verifications"

People say "Meta verifies ads". There are three processes.

| Process | What it checks | Who acts | Blocks delivery? |
| --- | --- | --- | --- |
| **Ad review** | This creative, copy, targeting, and destination against Advertising Standards | Meta, automatic (sometimes human) | Yes, until `ACTIVE` or `DISAPPROVED` |
| **Advertiser / account review** | Facebook Page, ad account, person, Business Portfolio behaviour | Meta, Account Quality | Can restrict the whole account |
| **Identity / business verification** | Person's ID or the legal entity behind the Business Portfolio | Owner, in Business Suite / Security Centre | Can block spend, Advanced Access, or flagged accounts |

Placis approval (**ad ready to post**) is a fourth gate, ours. It does not bind Meta.

## How ad review works

Official: [Advertising Standards — the ad review process](https://transparency.meta.com/policies/ad-standards/).

- Starts automatically when an ad would run (`status=ACTIVE`). Typically finishes within
  **24 hours**; can be longer.
- During review, `effective_status` is `PENDING_REVIEW` (Ads Manager: "In review").
- Review looks at **the ad as a unit**: images, video, text, targeting, **and the landing website page / Instant Form / other destination**.
- Ads can be **re-reviewed after they are live**. Approval is not a permanent certificate.
- Lower-quality ads that do not violate policy can still get throttled delivery.
- If the ad or the business account is restricted, appeal in **Account Quality**. Editing
  creates a new review.

`synchronous_ad_review` on create/update is **not** the full review. Meta says so on the
Ad object: it runs integrity checks (language, some image rules) so a UI can show errors
early. Passing it means "worth submitting", not "will be approved".

### API: see why an ad failed

On the Ad:

- `effective_status`
- `ad_review_feedback` → [`AdgroupReviewFeedback`](https://developers.facebook.com/docs/marketing-api/reference/adgroup-review-feedback/):
  `global` map of reason key → description, plus `placement_specific` (Facebook vs
  Instagram, etc.)
- `issues_info` when `effective_status=WITH_ISSUES` (delivery broken for a coded reason,
  including Special Ad Category mismatches, missing Facebook Page post, billing)
- `recommendations`

Create/update `execution_options`:

- `validate_only` — no write; schema and campaign-objective consistency
- `validate_only` + `synchronous_ad_review` — integrity checks as well
- `include_recommendations` — extra hints

Always create `PAUSED`, pre-check, then `ACTIVE` so a failed pre-check does not spend.

### Webhooks instead of polling

Subscribe the app to the ad account
([ad account webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-ad-accounts/)):

| Field | Use |
| --- | --- |
| `effective_status` | Review finished, paused, disapproved, billing block. Payload often **does not include the new value** — then `GET` the object. |
| `with_issues_ad_objects` | `WITH_ISSUES` with error code / summary |
| `in_process_ad_objects` | Left `IN_PROCESS` |

Then read `effective_status,configured_status,ad_review_feedback,issues_info`.

Do not busy-poll every few seconds. A River job that reconciles daily plus webhooks for
real-time is enough. For long review waits, a 3–5 minute check is fine until the webhook
is wired.

## Advertiser verification (the other "verification")

Covered as a connect-time concern in [access](01-access-and-accounts.md). Review
can still surface it later:

- Payment method fails → `PENDING_BILLING_INFO` or disabled account
- Meta asks for business documents → ads pause until Security Centre is done
- Facebook Page unpublished / restricted → `WITH_ISSUES` ("Ad post is not available")
- Admin has not accepted the non-discrimination certification (Special Ad Category) →
  error `2859024`

Placis cannot upload the contractor's passport or company registry papers to Meta on
their behalf through the Marketing API. The product is: **detect, explain, deep-link**.

Placis's **own** Business Verification is required for App Review Advanced Access. That
is an ops task, not a per-ad task.

## Policy that actually hits contractors

Full text: [Advertising Standards](https://transparency.meta.com/policies/ad-standards/).
The slices that matter for construction ads:

### Misleading or unsupported marketing statements

Meta prohibits deceptive offers and scam patterns. Placis already forbids fabricated
reviews, ratings, years, guarantees, insurance, pricing, and results. That is the highest
leverage review protection we have. Keep it at **ad ready to post**, and re-validate
immediately before posting in case Details changed.

Risky copy even when "true-ish":

- "Guaranteed leak-free roof"
- "Done in 7 days"
- "No mess" / "doubles your home value"
- Review counts that are not on the business profile

### Before / after and "results" imagery

Health and wellness before/after (weight, anti-aging) is a hard no. Property before/after
is not automatically banned, but pairing a before/after with a results promise is how
multimodal review reads a transformation marketing statement. Ad generation already defers before/after
as a product (ADR 10) and forbids inventing results. Keep it that way for posting.

### Personal attributes in copy

Ads must not call out personal attributes ("are you a married homeowner aged 30–40?").
Ideal customer profile steers targeting and tone; it must not appear in copy (already a
Placis rule).

### Destination mismatch

Review crawls the Instant Form and/or website page. If the ad promotes garage conversions
and the ad destination is a generic home website page with no mention, expect rejection or poor
delivery. Prefer the matching service website page or contact/quote website page.

The live website must be up, HTTPS, not a login wall, not a parked domain. **Website
publication** is a hard precondition for ad posting.

### Restricted / illegal local work

Ads must follow local law. We are not a legal filter, but we should not generate copy
that lists licences the profile does not have. If a trade is licensed, only list
certifications that exist as details.

### Special Ad Categories

Home services ≠ housing. Still send `special_ad_categories=NONE`. If Meta disagrees, do
not silently retarget a 15-mile all-ages audience; surface it to done-for-you.

### Issues, elections, politics

Out of scope. No political CTAs, no authorization flow.

### AI-generated photos

Placis ads use approved photos of the contractor's work, plus optional light cleanup
copies that still go through media library review. If Meta requires disclosure for digitally
created photos, cleanup copies may need that flag later. Do not pass stock off as their
work (already forbidden).

## What Placis should check *before* calling Meta

Reuse ad-generation validation, then add posting-specific checks:

1. Ad is Creative ready / ad ready to post; revision unchanged since approval.
2. Every image still approved media library items with a media caption.
3. **Ad destination** website page is published and reachable.
4. Privacy / legal website page is published (Instant Form).
5. Meta connection healthy: Facebook Page, ad account, payment method, token.
6. Copy still within CTA mapping rules (no `CALL_NOW` on Story).
7. Budget and schedule present.
8. `validate_only` + `synchronous_ad_review` on the would-be Ad.

If 8 fails, show Meta's error to the owner; do not set `ACTIVE`.

## What Placis should do *after* Meta answers

| Outcome | Owner-facing | System |
| --- | --- | --- |
| `PENDING_REVIEW` | "Meta is reviewing this ad" | `platform_status=synced`, keep Published off until `ACTIVE` (or show in-review) |
| `ACTIVE` | Existing-ad status **Published** | Store ids, start insights later, subscribe leadgen |
| `DISAPPROVED` | Show `ad_review_feedback` in plain language; edit in Placis and re-apply as a new revision | `platform_status=error` |
| `WITH_ISSUES` | Show `issues_info` (billing, Facebook Page, SAC, …) | Do not flip to Published |
| `PENDING_BILLING_INFO` | "Add a payment method in Meta" | Block |
| Re-review later rejects a live ad | Notify owner / done-for-you; pause locally | Webhook |

Do not auto-rewrite disapproved copy with the LLM and resubmit in a loop. That is how
accounts get restricted. LLM may **propose** a fix into **ad needs review**; a human
approves.

Appeals ("I think Meta is wrong") happen in Account Quality. Done-for-you can do that;
the API does not replace it.

## Implications for Placis

- "Verification" in the product should be split in the UI: **Meta is reviewing the ad**
  vs **Meta asked the business to verify identity**. One word for both will confuse
  owners.
- Posting is asynchronous. The Apply action enqueues a job; the detail view watches
  `effective_status`.
- Conservative copy is not optional once we post — rejected ads hurt the **ad account**,
  not just that one creative.
- E2E for this feature cannot fully mock Meta if we say we post; use a real test ad
  account with `PAUSED` ads and `validate_only` in CI, and one manual/staging run that
  hits review.
