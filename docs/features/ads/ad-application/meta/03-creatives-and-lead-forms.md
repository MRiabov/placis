# Meta creatives and Instant Forms — investigation

Status: investigation. How the Placis **ad set** (crops, copy, suggested
**ad lead form**, **ad destination**) becomes Meta creatives and a real Instant
Form.

See also: [index](00-index.md), [campaign structure](02-campaign-structure.md),
[review](04-review-and-verification.md).

## Recommendation in one paragraph

Upload each cropped image to the ad account, keep the returned **image hash**,
and build one unpublished Facebook Page post per ad format via
`object_story_spec`. Default conversion is an **Instant Form** on the
contractor's Facebook Page (this is the real **ad lead form**). The form
**must** include a privacy policy URL on the live website. After submit, the
thank-you button sends people to the **ad destination** website page.
Website-only click ads are the fallback when the owner opts out of lead capture
on Meta.

## Images

Creatives do not hotlink the media library. Official path:

1. Render the already-approved crop (square / portrait / carousel card / story).
2. `POST /act_{ad-account-id}/adimages` as multipart, filename with `.jpg` /
   `.png`.
3. Store the returned `hash`. Use `image_hash` in `link_data`. Do not use the
   temporary `url` field when creating creatives.

Docs: [Ad images](https://developers.facebook.com/docs/marketing-api/reference/ad-account/adimages/),
[Ad image](https://developers.facebook.com/docs/marketing-api/reference/ad-image/).

Hashes are per ad account. Copying an image to another account uses `copy_from`.

### Specs that match Placis ad formats

| Placis ad format | Aspect | Upload target | Meta placement |
| --- | --- | --- | --- |
| Square feed | 1:1 | 1080×1080 (min width 600) | Facebook / Instagram feed |
| Portrait feed | 4:5 | 1080×1350 | Mobile feed |
| Carousel | 1:1 cards, 2–10 | 1080×1080 per card | Feed carousel |
| Story | 9:16 | 1080×1920 | Stories / Reels |

JPG or PNG, max ~30 MB. Keep Story safe zones in mind (top ~14% / bottom ~35% UI
overlay) when we crop; that is a generation concern more than an API one.

The old "20% text in image" rule is retired. Meta still reviews
**marketing statements** in baked-in text. Light cleanup that does not invent
results is aligned with policy; before/after composites that imply guaranteed
transformations are not (see review doc).

## Copy fields

`object_story_spec.link_data` mapping:

| Placis copy field | Meta field | Practical limit | Hard-ish API max |
| --- | --- | --- | --- |
| Primary text | `message` | ~125 chars visible on mobile before "See more" | Thousands; generation already caps ~500 recommended / 5000 max |
| Headline | `name` (and carousel card `name`) | 27–40 visible | ~255 |
| Description | `description` / `link_data.description` | ~25–30; often hidden on mobile feed | ~200 |
| Button label | `call_to_action.type` | Closed enum | Closed enum |

Ad generation ADR 15 already stores 40 / 5000 / 30 and a fixed button set.
Re-verify at implementation; the numbers above are what the ads actually *show*.
Front-load the first 125 characters of primary text.

### Button labels

Placis today: `learn_more` / `get_quote` / `call_now` / `message`.

Meta `call_to_action.type` is a large enum
([link data CTA](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-call-to-action/)).
Useful mappings:

| Placis `cta_label` | Instant Form (`ON_AD`) | Website click | Notes |
| --- | --- | --- | --- |
| `learn_more` | `LEARN_MORE` | `LEARN_MORE` | Allowed on Instant Forms |
| `get_quote` | `GET_QUOTE` | `GET_QUOTE` | Allowed on Instant Forms |
| `call_now` | not in Instant Form CTA list | `CALL_NOW` | Needs a marketing phone. **Not supported on Facebook Stories.** |
| `message` | not in Instant Form CTA list | `MESSAGE_PAGE` (Messenger) | Different objective / `destination_type` |

Instant Form CTAs documented for lead creatives: `APPLY_NOW`, `DOWNLOAD`,
`GET_QUOTE`, `LEARN_MORE`, `SIGN_UP`, `SUBSCRIBE`. If the owner picked
`call_now` or `message`, v1 should either:

- switch destination (click-to-call / Messenger), or
- keep Instant Form and map to `GET_QUOTE` / `LEARN_MORE` with an owner-visible
  note.

Do not send custom button text. Meta will not render it.

## Building the creative

Pattern: unpublished Facebook Page post via `object_story_spec`.

Required: `page_id` (admin or ADVERTISE). Optional: `instagram_user_id` for IG.

### Single image (square or portrait)

`link_data`: `image_hash`, `message`, `name`, `description`, `call_to_action`,
`link`.

For Instant Forms, `link` is the dummy `https://fb.me/` (Meta's lead-ads rule)
and `call_to_action.value.lead_gen_form_id` is the form id.

For website ads, `link` **and** CTA `value.link` must be the same live
**ad destination** URL.

### Carousel

`link_data.child_attachments[]` (2–10): each card `image_hash`, `name`, `link`,
optional per-card CTA. All cards of a lead carousel must use the **same**
Instant Form id.

### Story

9:16 image (or later video). Story does not support `CALL_NOW` /
`GET_DIRECTIONS`. Prefer `LEARN_MORE` / `GET_QUOTE`. Set Instagram user id or
Story may not deliver on IG.

## Instant Form = the real ad lead form

Suggested fields on `ad_lead_forms` are not enough to post. Create a form on the
Facebook Page:

`POST /{PAGE_ID}/leadgen_forms`

Minimum that actually works in production:

1. `name`
2. `questions` — use built-in types where we can (`FULL_NAME`, `EMAIL`, a
   phone-number question, plus `CUSTOM` for trade-specific questions)
3. **`privacy_policy`**:
   `{ "url": "<https live privacy website page>",
   "link_text": "Privacy policy" }`
   (`link_text` max 70 chars). Omitting this returns
   *"Either legal_content_id or privacy_policy is required"*
   ([Facebook Page leadgen_forms](https://developers.facebook.com/docs/graph-api/reference/page/leadgen_forms/)).
4. `thank_you_page` with `button_type=VIEW_WEBSITE` and `website_url` =
   **ad destination** (this is how the Instant Form still "applies" to the
   website)

Worth setting for quote-quality:

- `is_optimized_for_quality=true` (review-and-confirm step)
- `tracking_parameters` including Placis `ad_id` / variant id (comes back on the
  lead)

Forms cannot be deleted; they are `ARCHIVED`. Create per ad revision rather than
mutating a live form under a delivering ad.

### Privacy policy URL is a website dependency

Meta fetches the URL. It must:

- be HTTPS
- load for an unauthenticated crawler
- belong to this contractor (same site as the ad destination)
- actually be a privacy policy, not a random website page

Website templates already have `legal` website page types. Ad posting should
**refuse** until a published legal/privacy website page exists. That is a new
gate on top of "ad destination is published".

### Retrieving ad leads

Two channels, both needed:

1. **Webhook** Facebook Page object, field `leadgen`. Install the app on the
   Facebook Page (`POST /{page-id}/subscribed_apps`). Payload has `leadgen_id`;
   then `GET /{LEAD_ID}?fields=created_time,id,ad_id,form_id,field_data`.
2. **Backfill** `GET /{form-id}/leads` for missed webhooks.

Docs: [Webhooks for lead ads](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/quickstart/webhooks-integration/).

Permissions: `leads_retrieval` + the Facebook Page permissions in the access
doc.

Write into the existing leads table as **ad leads** (distinct from website
leads), with `ad_id` / Meta lead id for attribution. The ads detail view already
specifies a per-ad ad-leads list (ADR 27).

## Website-click creatives (no Instant Form)

When destination is the website:

- Campaign objective `OUTCOME_TRAFFIC` or `OUTCOME_LEADS` +
  `destination_type=WEBSITE`
- `link` = live ad destination
- Meta's ad review **crawls that website page**. Offer in the ad must match the
  website page. A published contact/quote website page is the right default
  (already the picker default).

Without a Pixel, optimization is clicks / website page views, not qualified
quotes. Acceptable for v1 website-click; Instant Form is still the better
default for contractors.

## Previews

`GET /{ad-id}/previews` (or Ad Preview on the account) can render an iframe for
feed / story. Useful in CMS before we set `ACTIVE`, but it is not a substitute
for `synchronous_ad_review`.

## Implications for Placis

- Cropped images must be produced by the same deterministic renderer as the zip
  download.
- Instant Form creation is a posting step, not an ad-generation step (already
  decided: privacy notice at posting time).
- We need a canonical **privacy website page** URL per tenant.
- `call_now` / `message` are not drop-in Instant Form CTAs; decide mapping
  before implementation.
- Ad leads arrive asynchronously; posting is not "done" when the API returns an
  ad id.
