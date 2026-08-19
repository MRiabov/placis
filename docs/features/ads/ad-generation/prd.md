# Ad Generation PRD

Status: proposed product direction and implementation input.

Related docs:

1. [Ad generation technical implementation](technical-implementation.md)
2. [Ad generation decision record](ADR.md)
3. [Ad generation frontend specification](frontend.md)
4. [Ads data model](../data-model.md)
5. [Website](../../website/README.md)
6. [Onboarding](../../onboarding/README.md)

## Problem

The website editor already builds a contractor website from the business profile, approved
photos, and public business research. The website is the first output, but contractors do not
stop there. The next thing they ask for is simple advertising: "Make a gallery of my best work
photos and post it to Facebook." Today Placis has no answer for that, so the work either does
not happen or happens manually outside Placis.

The raw materials for a simple ad already exist: approved photos of the contractor's work in the
media library, what services they offer and where they work, certifications and reviews, the
business name and contact details, and a published website the ad can send people to. Ad
generation should turn these into a reviewable ad — images cropped for each ad format plus short
copy — without building an ads manager.

Ad posting to Facebook (or any ad platform) is out of scope for the first implementation. Ad
posting needs ad accounts, billing, campaign objects, review policy, and performance reporting.
Those belong to a managed-ads service, not to Ads or the website editor. The first product stops
at **ad ready to post**: approved images and copy in the ad platform's standard ad formats,
delivered as an ad set a contractor or done-for-you can hand to an ad platform.

## Goals

1. Let a contractor generate a simple ad set from content Placis already owns: approved
   media, projects, services, service area, and details from the business profile.
2. Generate the two things an ad is made of: a gallery of appropriate images showing the
   contractor's work, and short copy (headline, primary text, description, button label).
3. Produce standard ad formats from the start: square and portrait feed images,
   multi-image carousel, and Story.
4. The LLM drafts; the owner edits: the LLM drafts copy, proposes image selections from
   approved media, and may apply light cleanup to selected images (remove clutter or trash, tidy
   backgrounds). The owner or done-for-you reviews and edits everything before approval.
5. Make approval and output deterministic: the same approved ad always produces the same
   ad set. The ad set is the deliverable; the zip download is a temporary step for someone
   doing ad posting manually, until direct transmission to Meta (future work) replaces it.
6. Store ads as their own records (variants, copy, image placements) that reference the
   existing media library, projects, certifications, reviews, and website pages. We reuse
   existing content by reference instead of copying it into a parallel ad store.
7. Keep ads separate from website page editing: ads are their own records and their own
   workspace in Ads — alongside the website editor — not website page content.
8. Capture ad leads without a landing page: each ad carries a suggested ad lead form (title and
   questions) that the ad platform turns into a real ad lead form at ad posting time, and the ad
   targets the owner's ideal customer profile.

## Non-Goals

1. Do not do ad posting to Facebook, Google, Instagram, or any ad platform in the first
   implementation. No ad-account linking, billing, campaign objects, or ad-platform APIs.
2. Do not build an ads manager in the first implementation: no budgets, bidding, targeting
   audiences, scheduling, A/B testing, retargeting, or campaign performance dashboards. This is
   expected future growth on top of the same ads service, not a website editor feature.
3. Do not invent advertising claims. No fabricated review counts, ratings, years in business,
   guarantees, certifications, insurance, or pricing. Before/after results are allowed only when
   a real before/after image pair of the contractor's own work exists; they may not be invented
   without such imagery.
4. Do not generate new images, and do not make substantive edits to photos as part of ad
   generation. The LLM may apply light cleanup only (remove clutter/trash, tidy backgrounds)
   through the same non-destructive image-variant system as the media library (epic D12); heavier
   editing stays in the media library.
5. Do not create campaign landing pages. Ads always link to existing published website pages;
   landing page generation is not part of the ad product for the contractor segment.
6. Do not store ad copy as freeform HTML or unvalidated text. Copy is stored as structured
   fields with ad-platform-aware length limits and allowed button labels.
7. Do not collect ad preferences during onboarding. Ads are created on demand
   in Ads; onboarding stays simple.

## Post-MVP Considerations

Useful follow-on features that should remain outside the first implementation:

1. ad posting to ad platforms through a managed-ads service (account linking, campaign creation,
   creating the ad lead form from the ad set, targeting by the confirmed ideal customer profile,
   ad upload, review policy handling, scheduling) — Meta first; Google Ads is too early to
   plan for yet
2. external destinations beyond the contractor's website pages, such as phone links, booking
   links, or direct contact URLs
3. fuller AI image editing and generation for ad-specific enhancements beyond light cleanup,
   reusing epic D12 non-destructive derived media
4. audience and offer suggestions from public business research and existing details from the
   business profile
5. A/B copy variants and simple ad performance input
6. ad-lead attribution so Placis can report which approved ad set produced which ad leads
7. video ads assembled from approved media: short cinematic-style videos cut from the
   contractor's photos and clips, with optional AI-generated transitions; deferred because video
   rendering is a separate pipeline from image ad sets
8. ad performance display once an ad platform is connected: impressions, clicks, spend, and
   results shown next to each approved ad; the ads are ready for this today (stable ids plus ad
   platform object references), so connecting the ad platform stays additive

## Who It Is For

Primary: an owner who wants to advertise their work on Facebook
without learning a design tool or writing marketing copy.

Secondary:

1. done-for-you preparing ads for a contractor
2. a contractor's marketing-savvy employee who wants to tweak copy or swap images

Common ad needs:

1. "Make an ad from my best roofing photos."
2. "I want people to call me for a quote — I don't know what to write."
3. "Promote the new service I just added."
4. "I want a few different images so the ad does not look static."
5. "I'll post it myself — just give me something ready."

## Product Shape

Ads lives under `/cms/ads`. The website editor (`/cms/website`), Details, and Media library are
their own screens beside it. Websites are mostly set-and-forget; ads are managed on an ongoing
basis, so Ads is a higher-frequency surface the contractor returns to — not a campaign console,
but a normal part of the app. Ads are their own records, not website page content.

The core object is an **ad** — the owner calls it an "ad". One ad represents one offer or
marketing goal, such as "promote garage conversions" or "get more quote requests", and contains
all the ad formats and copy for that offer.

Structure:

1. **Ad**: name, offer/goal, ad destination, and review status.
2. **Ad variants**: one per supported ad format — Square feed, Portrait feed,
   carousel, and Story. Each variant pairs an image selection with copy.
3. **Image selection**: one or more approved media-library items with per-ad-format crop and
   focal point metadata. For carousel and story variants the selection is a gallery of images;
   for single-image variants it is exactly one image.
4. **Copy**: headline, primary text, description, and button label, with ad-platform-aware
   character limits.

How it is built: ad generation is a service of its own. Ads is one caller of it. Later, campaign
management, or external systems, can call the same service.

Recommended owner language:

1. Ads
2. Create an ad
3. What are you promoting
4. Where should the ad send people
5. Images for the ad
6. Headline and text
7. Button label
8. Formats: square, portrait, carousel, story
9. Ad states: ad ready to post / ad needs review / ad draft

Avoid internal language such as variant payload, crop metadata, or review enum.

## MVP Behavior

The first implementation should be deliberately small:

1. create an ad from a short owner-facing form: offer/goal and service focus picked from the
   contractor's known data, ideal customer profile, and an ad lead form by default
2. the LLM drafts an image gallery from approved media, applies light cleanup where needed,
   and drafts copy from details in the business profile
3. the owner reviews format-accurate previews (square, portrait, carousel, story), edits copy,
   swaps images, and adjusts crops
4. approval gates the ad set: an ad is **ad ready to post** only when the ad destination,
   images, and copy pass validation
5. the service returns the ad set: the selected images at the correct crop for each ad format
   plus copy, with a download for people who do ad posting manually
6. drafts and ads that need review are preserved so work can be resumed later

The generation step is one action ("Generate ad ideas"), not a long wizard. If the owner only has
a few approved photos, the system still produces one clean feed variant rather than empty
carousel or story variants. Ad formats with no suitable approved images are left out of the ad
set instead of blocking it.

## Creating Ads

Ads are created on demand in Ads, from approved media and published website pages.
There is no onboarding step for ads: we do not ask about ads during onboarding,
so adding ads later costs nothing extra.

## Ads Experience

Ads under `/cms/ads` should expose:

1. ad list with status badges (Draft / Creative ready / Published / Archived) and last updated timestamp
2. create-an-ad flow: offer/goal and service focus picked from the contractor's known data, ideal
   customer profile (default married couples aged 30-40), ad lead form by default with an
   optional ad destination, and budget/schedule shown but disabled until ad posting; then
   generation runs and the ad opens for review
3. variant tabs for square, portrait, carousel, and story ad formats
4. image selection from the media library and projects, with per-ad-format crop
   and focal point controls
5. copy editor with headline, primary text, description, and button label, each with live
   character counts against ad-platform limits
6. format-accurate mocks: Square feed, Portrait feed, Carousel, and Story
7. validation errors shown inline next to the field they belong to (missing ad destination,
   unreviewed media, missing media caption, unsupported claims)
8. approve and download actions that produce the final ad set

The owner should be able to regenerate copy or image suggestions for a single variant without
losing their manual edits. Manual edits are always preserved as a new draft; the LLM never
overwrites an approved variant silently.

## Ad Formats

The first implementation produces these ad formats, matching common Facebook sizes:

1. **Square feed image** (`1:1`) — single image, the default for feed ads.
2. **Portrait feed image** (`4:5`) — single image, recommended mobile feed ratio.
3. **Carousel** — a gallery of 2-10 square cards, each card an approved image with its own crop.
4. **Story/reel** (`9:16`) — vertical full-screen format.

All crops are non-destructive: the source item in the media library is never modified, and each
variant stores its own crop/focal metadata or references a derived crop variant. Ad formats with
no suitable approved images are left out of the ad set rather than producing empty placeholders.

## Copy

Ad copy is short and structured. Each variant stores:

1. headline (with ad-platform limit, e.g. 40 characters)
2. primary text (the body of the ad, with ad-platform limit, e.g. up to 5000 characters but
   recommended far shorter)
3. description (optional, e.g. 30 characters)
4. button label from a fixed allowed set (e.g. Learn More, Get Quote, Call Now, Message)

Limits live in one constants module so the UI and validation read the same values. Copy is
generated from the business profile: services, service area, phone, certifications and reviews,
and the owner's own copy on the ad destination. LLM-drafted copy is recorded as a reviewable
draft with where it came from; it never writes directly into an approved variant.

The owner can accept, edit, or reject each generated copy field. Character counts update live and
validation blocks approval when a limit is exceeded.

## Image Selection Rules

Image selection is the heart of the feature: "a gallery of appropriate images showing work".

Selection source is the media library and projects. A media-library item is
selectable for an ad only when it is:

1. owned by that contractor
2. approved for public/website use (review passed, not pending review)
3. not an AI-edited variant still in review
4. accompanied by a media caption

Selection is the first filter: the picker only offers approved media, so unreviewed media
cannot normally be chosen. Approval is the second check: before an ad becomes **ad ready to
post**, every image is re-validated against its current review. If a media item went into review
after being selected, or a cleanup edit is still pending review, or a media caption is missing,
the ad is blocked with an owner-readable message until the image is approved or replaced.

The LLM drafts a gallery from this approved media using project/service relevance and quality
signals; the owner can swap, add, or remove images. No image is used without a per-ad-format crop
that is valid for that ad format, and every selected image keeps where it came from so the owner
can see its origin.

The LLM may also draft light cleanup edits — removing clutter or trash, tidying backgrounds —
when an image needs it. Cleanup is cosmetic: it must not add or remove objects in a way that
changes what the photo shows, must not conceal damage or defects, and must not change the work
being displayed. Cleanup creates a non-destructive derived variant of the source media; the
source media is never modified, the edit keeps where it came from, and the edited variant needs
normal review before it can appear in an **ad ready to post** ad set.

Photos showing third-party properties or identifiable people are fine to use when their
media-library review is already approved — that approval is the owner's consent.
Photos not yet approved need the same owner approval as website certifications, reviews, or
projects before they can be used. Ads must not present stock or unrelated imagery as the
contractor's work.

## Ideal Customer Profile

The create-an-ad flow asks who the ad should target: the owner's ideal customer profile.
The default is married couples aged 30-40, which fits most contractors (about 17 of 20 ads).
The owner can edit the default or answer with their own profile. In this workflow we first
decide who the ad is for, and only then how to reach them — targeting follows the confirmed
ideal customer profile, never the other way around.

The LLM suggests an ideal customer profile asynchronously from the business profile, services,
and business research; the suggestion is reviewable and the owner confirms or edits it. The
ideal customer profile is a loose profile, not precise targeting data. Today its job is steering
generation: tone, imagery, and the offer are tailored to the confirmed ideal customer profile —
but the ideal customer profile never appears in the copy itself, so no "ideal for homeowners
40-55" style claims. Precise targeting on the ideal customer profile (age range, household,
location) happens at ad posting (future work); the ad set carries the ideal customer profile so
targeting needs no extra data entry later. Internal ad logic outside Meta (custom rules deciding
when or how an ad runs) is out of scope for now.

## Ad Destination Rules

Ads capture ad leads with an ad lead form created at ad posting time. For this implementation
the ad lead form is just suggested fields: the ad set carries a suggested title and suggested
questions, and the final ad lead form is set up at ad posting (future work). A landing page is
not needed for ad-lead capture.

The ad can also link to an existing published website page owned by that contractor (the ad
destination — for example as the ad lead form's thank-you website page or the ad's link):

1. the website page exists for that contractor and is published or scheduled for website
   publication
2. the website page is public-safe (no unpublished-only content as the primary ad destination)
3. the ad destination belongs to that contractor

External destinations beyond the contractor's website pages are future work. Campaign landing
page generation is not planned. The ad destination picker should default to the contact/quote
website page or a service website page matching the ad's offer.

## Review And Approval

An ad moves through explicit steps:

1. **ad draft**: being created or edited
2. **ad needs review**: LLM-drafted content present, or a compliance-sensitive field changed
3. **ad ready to post**: all validation passed and the owner or done-for-you approved the ad set
4. **archived**: no longer offered, kept as a past ad

Approval is explicit and audited. Ad posting is out of scope, so **ad ready to post** is
the final step; it means the ad set passed validation and can be downloaded or read through the
service and handed to an ad platform.

These are creation-flow steps. Existing ads display their own statuses — **Draft / Creative
ready / Published / Archived** — where "Creative ready" means the ad is done and
"Published" is the next status once ad posting exists. "Ad needs review" and "Ad ready to post"
are not used as existing-ad labels.

## Ad Set Output

The deliverable is the ad set: the ad with its variants, copy, image placements, and
ad destination. Any caller of the service — Ads under `/cms/ads`, future campaign management,
or an external system — reads this ad set directly, so the feature never depends on a human
downloading files. Every ad and variant keeps a stable id, so a later ad-platform
integration (like a Facebook Ads Manager) can attach its own object ids and performance data to
an approved ad without changing the ad set.

The zip download is a temporary step for a person doing ad posting manually, until direct
transmission to Meta (future work) replaces it:

1. one folder or zip per ad
2. images at the correct crop for each ad format (square, portrait, carousel cards, story)
3. a copy sheet (plain text/markdown) with headline, primary text, description, and button label
   per ad format, plus the ad destination URL
4. the suggested ad lead form fields (title and questions) as the starting point for the ad lead
   form created on Meta
5. a note of which source media and crops each image came from

The same approved ad always produces the same output. Downloads need no ad-platform credentials
and do no ad posting.

## Compliance And Content Safety

Ads are public marketing claims with ad-platform review policies. The first implementation keeps
claims conservative and source-backed:

1. no fabricated review counts, ratings, years in business, guarantees, certifications,
   insurance, licensing, or pricing
2. only approved imagery of the contractor's own work (or explicitly owner-approved stock with
   confirmation), never stock passed off as the contractor's work
3. light cleanup edits are cosmetic and non-deceptive: they may remove clutter or tidy
   backgrounds, but must not conceal damage or defects, add or remove objects, or change the
   work shown
4. before/after results only when they are backed by a real before/after image pair from the
   same project — the image pair is the evidence — and the pair is owner-approved
5. photos showing identifiable people or third-party properties are usable once their
   media-library review is approved; otherwise they need owner approval first
6. no personal data in ad copy
7. ad destination website pages must exist and be owned by that contractor
8. copy must not promise specific outcomes, results, or turnaround times unless the owner
   explicitly supplies and approves the claim

Anything the LLM drafts that resembles a sensitive claim (reviews, ratings, guarantees, prices,
results) must be flagged **ad needs review** and blocked from **ad ready to post** until an owner
or done-for-you approves it.

## User Stories

These stories are the source catalog for the feature. Each story has its own acceptance criteria;
the overall MVP gate is the [Acceptance Criteria](#acceptance-criteria) section.

1. **As a contractor owner**, I want to create an ad from my approved photos and business
   profile, so that I get advertising that is ad ready to post without writing marketing copy.
   - "Generate ad ideas" drafts copy and an image gallery from approved media, with light
     cleanup edits where needed, based on projects, services, service area, certifications, and
     reviews.
   - Drafts are reviewable with where they came from; manual edits are preserved and the LLM
     never overwrites an approved variant silently.
   - LLM draft calls are recorded through `ai_generations` tracing with contractor scope and
     actor context.
2. **As a contractor owner**, I want my ad in standard ad formats, so that it looks right
   on Facebook feed, carousel, and stories.
   - Square feed (1:1), Portrait feed (4:5), Carousel cards (1:1), and Story (9:16) variants use
     non-destructive crops with focal-point metadata.
   - Ad formats without suitable approved images are left out of the ad set instead of rendering
     empty placeholders.
   - The ad set carries per-ad-format image placements; the download renders them deterministically
     (cropped images, copy sheet, ad destination URL) with no ad-platform credentials required.
3. **As a contractor owner**, I want my ad to send people to a website page that exists, so that
   clicks land on real content.
   - Every ad requires a published website page owned by that contractor (the ad destination)
     before it can become ad ready to post.
   - Approval validates the ad destination, approved contractor-owned imagery with a media
     caption, per-ad-format crops, copy limits, and allowed button labels.
   - Unsupported claims (reviews, ratings, guarantees, pricing, results) block approval until
     owner or done-for-you review.
4. **As done-for-you**, I want ads stored as their own records, so that ads can be produced
   from approved contractor content and campaign operations can build on them later.
   - Ads and variants belong to the contractor, referencing approved media and published
     website pages (ad destinations); no parallel media store.
   - Ad states track ad draft, ad needs review, ad ready to post, and archived.
   - Campaign status, spend, ad-lead attribution, cost per ad lead, and billing are future work
     on top of these records; Ads never does ad posting.
5. **As any caller**, I want the ad generation service to return a stable ad set, so that Ads,
   a future managed-ads service, or an external system can use it without rebuilding
   generation.
   - The service returns a clearly defined ad set (ad, variants, copy, image
     placements, ad destination) with a version number.
   - The same approved ad always yields the same ad set; a downloadable images-plus-copy-sheet
     rendering is available for the human path; approval is explicit and audited.

## Success Metrics

1. Contractors with at least one approved ad set.
2. Time from "create ad" to "ad ready to post" for a typical contractor.
3. Percentage of LLM-drafted copy and image selections accepted without edits.
4. Compliance blockers caught before approval (unsupported claims, unreviewed imagery).
5. Ad sets consumed as-is — via download or via the service — when used for ad posting by the
   contractor or done-for-you.
6. No ad feature depends on ad-platform accounts or credentials in the first implementation.

## Acceptance Criteria

1. Ads under `/cms/ads` exposes an ad list, create flow, and status badges.
2. Ad generation consumes approved media, projects, services, and details from the business
   profile; it never requires new media to be uploaded.
3. LLM drafts — copy, image gallery, and light cleanup edits — are reviewable with where they
   came from; manual edits are preserved and never silently overwritten by the LLM.
4. Square, portrait, carousel, and story variants produce valid non-destructive crops with focal
   point metadata.
5. Copy enforces ad-platform character limits and an allowed button-label set through shared
   validation.
6. Every ad requires a published website page owned by that contractor (the ad destination)
   before it can become ad ready to post.
7. Approval is explicit and audited; **ad ready to post** is the final step and does no ad
   posting.
8. The service returns a stable ad set with a version number, and a person can download a
   deterministic rendering (cropped images per ad format plus a copy sheet and ad destination
   URL) with no ad-platform credentials required.
9. Compliance gates block unsupported claims and unreviewed imagery before approval.
10. An E2E test covers create → generate → review/edit → approve → use the ad set without
    mocking the core domain logic.
11. Ad generation is a service of its own with clearly defined inputs and outputs. Ads is one
    caller; another internal part of Placis can also get the ad set without going through Ads,
    and external systems can be added later without changing the ad set format.
