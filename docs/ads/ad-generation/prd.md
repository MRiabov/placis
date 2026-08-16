# CMS Ad Generation PRD

Status: proposed product direction and implementation input.

Related docs:

1. [CMS ad generation technical implementation](technical-implementation.md)
2. [Ad generation decision record](ADR.md)
3. [Ad generation frontend specification](frontend.md)
4. [Website CMS](../../website/README.md)
5. [Onboarding](../../onboarding/README.md)

## Problem

The Website CMS already builds a contractor website from business-profile facts, approved photos, and public
research. The website is the first output, but contractors do not stop there. The next thing they
ask for is simple advertising: "Make a gallery of my best work photos and post it to Facebook."
Today Placis has no answer for that, so the work either does not happen or happens manually
outside the platform.

The raw materials for a simple ad already exist in the CMS: approved photos of the contractor's
work, what services they offer and where they work, proof like certifications and reviews, the
business name and contact details, and a published website the ad can send people to. Ad
generation should turn these into a reviewable ad — a set of images cropped for each ad format
plus short copy — without building an ads manager.

Posting to Facebook (or any ad platform) is out of scope for the first implementation. Posting
needs ad accounts, billing, campaign objects, review policy, and performance reporting. Those
belong to a managed-ads service, not to the CMS editor. The first product stops at "ready to
post": approved images and copy in the platform's standard formats, delivered as a package a
contractor or Placis operator can hand to a platform.

## Goals

1. Let a contractor generate a simple ad package from content Placis already owns: approved
   media, projects, services, service area, and business facts.
2. Generate the two things an ad is made of: a gallery of appropriate images showing the
   contractor's work, and short copy (headline, primary text, description, button label).
3. Produce standard platform formats from the start: square and portrait feed images,
   multi-image carousel, and vertical story/reel images.
4. Keep AI in a proposal role: AI drafts copy, proposes image selections from approved media,
   and may apply light cleanup to selected images (remove clutter or trash, tidy backgrounds). The
   contractor or operator reviews and edits everything before approval.
5. Make approval and output deterministic: the same approved ad always produces the same
   package. The package is the deliverable; the zip download is a temporary step for someone
   posting manually, until direct transmission to Meta (future work) replaces it.
6. Store ads as their own records (creative set, variants, copy, image placements) that
   reference the existing CMS media, projects, proof, and website pages. We reuse existing
   content by reference instead of copying it into a parallel ad store.
7. Keep ads separate from website page editing: ads are their own records and their own
   workspace in the CMS — the ads part of the CMS alongside the website part — not website page
   content.
8. Capture leads without a landing page: each ad carries a suggested Meta lead form (title and
   questions) that the platform turns into a real form at posting time, and the ad targets the
   owner's ideal customer profile.

## Non-Goals

1. Do not post ads to Facebook, Google, Instagram, or any ad platform in the first
   implementation. No ad-account linking, billing, campaign objects, or platform APIs.
2. Do not build an ads manager in the first implementation: no budgets, bidding, targeting
   audiences, scheduling, A/B testing, retargeting, or campaign performance dashboards. This is
   expected future growth on top of the same creative service, not a CMS editor feature.
3. Do not invent advertising claims. No fabricated review counts, ratings, years in business,
   guarantees, certifications, insurance, or pricing. Before/after results are allowed only when
   a real before/after image pair of the contractor's own work exists; they may not be invented
   without such imagery.
4. Do not generate new images, and do not make substantive edits to photos as part of ad
   generation. AI may apply light cleanup only (remove clutter/trash, tidy backgrounds) through
   the same non-destructive image-variant system as the media library (epic D12); heavier
   editing stays in the media library.
5. Do not create campaign landing pages. Ads always link to existing published website pages;
   landing page generation is not part of the ad product for the contractor segment.
6. Do not store ad copy as freeform HTML or unvalidated text. Copy is stored as structured
   fields with platform-aware length limits and allowed button labels.
7. Do not collect ad preferences during onboarding. Ads are created on demand
   in the CMS; onboarding stays simple.

## Post-MVP Considerations

Useful follow-on features that should remain outside the first implementation:

1. posting to ad platforms through a managed-ads service (account linking, campaign creation,
   creating the Meta lead form from the package, targeting by the confirmed ICP, creative
   upload, review policy handling, scheduling) — Meta first; Google Ads is too early to plan
   for yet
2. external destinations beyond tenant pages, such as phone links, booking links, or direct
   contact URLs
3. fuller AI image editing and generation for ad-specific enhancements beyond light cleanup,
   reusing epic D12 non-destructive derived media
4. audience and offer suggestions from public research and existing business facts
5. A/B copy variants and simple creative performance input
6. lead attribution so the platform can report which approved ad package produced which leads
7. video ads assembled from approved media: short cinematic-style videos cut from the
   contractor's photos and clips, with optional AI-generated transitions; deferred because video
   rendering is a separate pipeline from image packages
8. ad performance display once a platform is connected: impressions, clicks, spend, and results
   shown next to each approved ad; the creative records are ready for this today (stable ids
   plus platform object references), so connecting the platform stays additive

## Target Users

Primary user: a contractor owner or office admin who wants to advertise their work on Facebook
without learning a design tool or writing marketing copy.

Secondary users:

1. Placis operators and the managed-ads team preparing creative for a contractor
2. a contractor's marketing-savvy employee who wants to tweak copy or swap images

Common ad needs:

1. "Make an ad from my best roofing photos."
2. "I want people to call me for a quote — I don't know what to write."
3. "Promote the new service I just added."
4. "I want a few different images so the ad does not look static."
5. "I'll post it myself — just give me something ready."

## Product Shape

The CMS is the umbrella for marketing management. It has two parts: the website part (pages,
content, media, proof) and the ads part. Ad generation lives in the ads part as an **Ads**
workspace under `/cms/ads`. Websites are mostly set-and-forget; ads are managed on an ongoing
basis, so the Ads workspace is a higher-frequency surface the contractor returns to — not a
campaign console, but a normal part of the app. Ads are their own records, not website page
content.

The core object is an **ad creative set** — the owner calls it an "ad". One creative set
represents one offer or marketing goal, such as "promote garage conversions" or "get more quote
requests", and contains all the formats and copy for that offer.

Structure:

1. **Ad creative set**: name, offer/goal, destination page, and review/publish state.
2. **Ad variants**: one per supported format — square feed image, portrait feed image, carousel,
   and story/reel. Each variant pairs an image selection with copy.
3. **Image selection**: one or more approved CMS media assets with per-format crop and focal
   point metadata. For carousel and story variants the selection is a gallery of images; for
   single-image variants it is exactly one image.
4. **Copy**: headline, primary text, description, and button label, with platform-aware character
   limits.

How it is built: ad generation is a service of its own. The Ads workspace in the CMS is one user
of it. Later, campaign management inside the CMS, or external systems, can call the same service.

Recommended owner language:

1. Ads
2. Create an ad
3. What are you promoting
4. Where should the ad send people
5. Images for the ad
6. Headline and text
7. Button label
8. Formats: square, portrait, carousel, story
9. Ready to post / needs review / draft

Avoid internal language such as creative set, variant payload, crop metadata, or review enum.

## MVP Behavior

The first implementation should be deliberately small:

1. create an ad from a short owner-facing form: offer/goal and service focus picked from the
   tenant's known data, ideal customer profile, and a Meta lead form by default
2. AI proposes an image gallery from approved media, applies light cleanup where needed,
   and drafts copy from business facts
3. the owner reviews format-accurate previews (square, portrait, carousel, story), edits copy,
   swaps images, and adjusts crops
4. approval gates the package: an ad is `ready to post` only when destination, images, and copy
   pass validation
5. the service returns the package: the selected images at the correct crop for each format plus
   copy, with a download for people who post manually
6. drafts and review-required states are preserved so work can be resumed later

The generation step is one action ("Generate ad ideas"), not a long wizard. If the owner only has
a few approved photos, the system still produces one clean feed variant rather than empty
carousel or story variants. Formats with no suitable approved images are left out of the package
instead of blocking it.

## Creating Ads

Ads are created on demand in the CMS Ads workspace, from approved media and published pages.
There is no onboarding step for ads: we do not ask about ads during onboarding,
so adding ads later costs nothing extra.

## CMS Experience

The Ads workspace under `/cms/ads` should expose:

1. ad list with status badges (draft, needs review, ready to post) and last updated timestamp
2. publish-an-ad flow: offer/goal and service focus picked from the tenant's known data, ideal
   customer profile (default married couples aged 30-40), Meta lead form by default with an
   optional destination page, and budget/schedule shown but disabled until posting; then
   generation runs and the ad opens for review
3. variant tabs for square, portrait, carousel, and story formats
4. image selection from the approved CMS media library and project gallery, with per-format crop
   and focal point controls
5. copy editor with headline, primary text, description, and button label, each with live
   character counts against platform limits
6. format-accurate previews: a feed mock, a carousel mock, and a story/reel mock
7. validation errors shown inline next to the field they belong to (missing destination,
   unreviewed media, missing alt text, unsupported claims)
8. approve and download actions that produce the final ad package

The owner should be able to regenerate copy or image suggestions for a single variant without
losing their manual edits. Manual edits are always preserved as a new draft; AI never overwrites
an approved variant silently.

## Creative Formats

The first implementation produces these formats, matching common Facebook creative slots:

1. **Square feed image** (`1:1`) — single image, the default for feed ads.
2. **Portrait feed image** (`4:5`) — single image, recommended mobile feed ratio.
3. **Carousel** — a gallery of 2-10 square cards, each card an approved image with its own crop.
4. **Story/reel** (`9:16`) — vertical full-screen format.

All crops are non-destructive: the source CMS media asset is never modified, and each variant
stores its own crop/focal metadata or references a derived crop variant. Formats with no suitable
approved images are left out of the package rather than producing empty placeholders.

## Copy

Ad copy is short and structured. Each variant stores:

1. headline (with platform limit, e.g. 40 characters)
2. primary text (the body of the ad, with platform limit, e.g. up to 5000 characters but
   recommended far shorter)
3. description (optional, e.g. 30 characters)
4. button label from a fixed allowed set (e.g. Learn More, Get Quote, Call Now, Message)

Limits live in one constants module so the UI and validation read the same values. Copy is
generated from approved business facts: services, service area, phone, proof like
certifications and reviews, and the owner's own copy on the destination page. AI-generated copy is recorded as a reviewable draft
with provenance; it never writes directly into an approved variant.

The owner can accept, edit, or reject each generated copy field. Character counts update live and
validation blocks approval when a limit is exceeded.

## Image Selection Rules

Image selection is the heart of the feature: "a gallery of appropriate images showing work".

Selection source is the approved CMS media library and portfolio projects. A media asset is
selectable for an ad only when it is:

1. owned by the tenant
2. approved for public/website use (review state passed, not pending review)
3. not an AI-edited variant still in review
4. accompanied by alt text

Selection is the first filter: the picker only offers approved assets, so unreviewed media
cannot normally be chosen. Approval is the second check: before an ad becomes `ready to post`,
every image is re-validated against its current state. If an asset went into review after being
selected, or a cleanup edit is still pending review, or alt text is missing, the ad is blocked
with an owner-readable message until the image is approved or replaced.

AI proposes a gallery from these approved assets using project/service relevance and quality
signals; the owner can swap, add, or remove images. No image is used without a per-format crop
that is valid for that format, and every selected image keeps its provenance so the owner can see
where it came from.

AI may also propose light cleanup edits — removing clutter or trash, tidying backgrounds — when an
image needs it. Cleanup is cosmetic: it must not add or remove objects in a way that changes what
the photo shows, must not conceal damage or defects, and must not change the work being displayed.
Cleanup creates a non-destructive derived variant of the source asset; the source asset is never
modified, the edit keeps provenance, and the edited variant needs normal review before it can
appear in a `ready to post` package.

Photos showing customers, third-party properties, or identifiable people are fine to use when
their media-library review state is already approved — that approval is the owner's consent.
Photos not yet approved need the same owner approval as website proof before they can be used.
Ads must not present stock or unrelated imagery as the contractor's work.

## Ideal Customer Profile

The create-an-ad flow asks who the ad should target: the owner's ideal customer profile (ICP).
The default is married couples aged 30-40, which fits most contractors (about 17 of 20 ads).
The owner can edit the default or answer with their own profile. In this workflow we first
decide who the ad is for, and only then how to reach them — targeting follows the confirmed
ICP, never the other way around.

The LLM suggests an ICP asynchronously from the business profile, services, and research; the
suggestion is reviewable and the owner confirms or edits it. The ICP is a loose profile, not
precise targeting data. Today its job is steering generation: tone, imagery, and the offer are
tailored to the confirmed ICP — but the ICP never appears in the copy itself, so no "ideal for
homeowners 40-55" style claims. Precise targeting on the ICP (age range, household, location)
happens when posting to a platform (future work); the package carries the ICP so targeting
needs no extra data entry later. Internal ad logic outside Meta (custom rules deciding when or
how an ad runs) is out of scope for now.

## Destination Rules

Ads capture leads with a Meta lead form created at posting time. For this implementation the
form is just suggested fields: the package carries a suggested title and suggested questions,
and the final form is set up when posting (future work). A landing page is not needed for lead
capture.

The ad can also link to an existing published website page owned by the tenant (for example as
the form's thank-you page or the ad's link):

1. the page exists in the tenant's CMS and is published or scheduled for publication
2. the page is public-safe (no draft-only content as the primary destination)
3. the destination page belongs to the tenant

External destinations beyond tenant pages are future work. Campaign landing page generation is
not planned. The destination picker should default to the contact/quote page or a service page
matching the ad's offer.

## Review And Approval

An ad creative set moves through explicit states:

1. **draft**: being created or edited
2. **needs review**: AI-generated content present, or a compliance-sensitive field changed
3. **ready to post**: all validation passed and the owner or operator approved the package
4. **archived**: no longer offered, kept for history

Approval is explicit and audited. Posting to a platform is out of scope, so "ready to post" is
the final state; it means the package passed validation and can be downloaded or read through the
service and handed to an ad platform.

These are creation-flow states. Existing ads display their own statuses — **Draft / Creative
ready / Published / Archived** — where "Creative ready" means the creative is done and
"Published" is the next state once posting exists. "Needs review" and "Ready to post" are not
used as existing-ad labels.

## Creative Package Output

The deliverable is the package: the creative set with its variants, copy, image placements, and
destination. Any caller of the service — the `/cms/ads` workspace, future campaign management,
or an external client — reads this package directly, so the feature never depends on a human
downloading files. Every creative set and variant keeps a stable id, so a later platform
integration (like a Facebook Ads Manager) can attach its own object ids and performance data to
an approved ad without changing the package.

The zip download is a temporary step for a person posting manually, until direct transmission
to Meta (future work) replaces it:

1. one folder or zip per creative set
2. images at the correct crop for each format (square, portrait, carousel cards, story)
3. a copy sheet (plain text/markdown) with headline, primary text, description, and button label
   per format, plus the destination URL
4. the suggested lead form fields (title and questions) as the starting point for the form
   created on Meta
5. a manifest note of which source assets and crops each image came from

The same approved ad always produces the same output. Downloads need no platform credentials and
post nothing.

## Compliance And Content Safety

Ads are public marketing claims with platform review policies. The first implementation keeps
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
5. photos showing identifiable people or customer properties are usable once their
   media-library review state is approved; otherwise they need owner approval first
6. no personal data in ad copy
7. destination pages must exist and be owned by the tenant
8. copy must not promise specific outcomes, results, or turnaround times unless the owner
   explicitly supplies and approves the claim

Anything AI drafts that resembles a sensitive claim (reviews, ratings, guarantees, prices,
results) must be flagged `needs review` and blocked from `ready to post` until an owner or
operator approves it.

## User Stories

These stories are the source catalog for the feature. Each story has its own acceptance criteria;
the overall MVP gate is the [Acceptance Criteria](#acceptance-criteria) section.

1. **As a contractor owner**, I want to publish an ad from my approved photos and business
   facts, so that I get ready-to-post advertising without writing marketing copy.
   - "Generate ad ideas" proposes copy and an image gallery from approved media, with light
     cleanup edits where needed, based on projects, services, service area, and proof.
   - Proposals are reviewable drafts with provenance; manual edits are preserved and AI never
     overwrites an approved variant silently.
   - AI proposal calls are recorded through `ai_generations` tracing with tenant scope and actor
     context.
2. **As a contractor owner**, I want my ad in standard platform formats, so that it looks right
   on Facebook feed, carousel, and stories.
   - Square (1:1), portrait (4:5), carousel cards (1:1), and story/reel (9:16) variants use
     non-destructive crops with focal-point metadata.
   - Formats without suitable approved images are left out of the package instead of rendering
     empty placeholders.
   - The package carries per-format image placements; the download renders them deterministically
     (cropped images, copy sheet, destination URL) with no platform credentials required.
3. **As a contractor owner**, I want my ad to send people to a page that exists, so that clicks
   land on real content.
   - Every ad requires a tenant-owned published destination page before it can become `ready to
     post`.
   - Approval validates destination, approved tenant-owned imagery with alt text, per-format
     crops, copy limits, and allowed button labels.
   - Unsupported claims (reviews, ratings, guarantees, pricing, results) block approval until
     owner or operator review.
4. **As the managed ads team**, I want CMS-owned ad creative records, so that ads can be produced
   from approved contractor content and campaign operations can build on them later.
   - Creative sets and variants are tenant-owned records referencing approved media assets and
     published destination pages; no parallel asset store.
   - Creative state tracks draft, needs review, ready to post, and archived.
   - Campaign status, spend, lead attribution, cost per lead, and billing are future work on top
     of these records; the ads part never posts ads.
5. **As any consumer**, I want the ad generation service to return a stable package, so that the
   CMS UI, a future managed-ads service, or an external client can use it without rebuilding
   generation.
   - The service returns a clearly defined package (creative set, variants, copy, image
     placements, destination) with a version number.
   - The same approved ad always yields the same package; a downloadable images-plus-copy-sheet
     rendering is available for the human path; approval is explicit and audited.

## Success Metrics

1. Contractors with at least one approved ad package.
2. Time from "create ad" to "ready to post" for a typical contractor.
3. Percentage of AI-proposed copy and image selections accepted without edits.
4. Compliance blockers caught before approval (unsupported claims, unreviewed imagery).
5. Ad packages consumed as-is — via download or via the service — when posted by the contractor
   or managed-ads team.
6. No ad feature depends on platform accounts or credentials in the first implementation.

## Acceptance Criteria

1. The CMS exposes an Ads workspace under `/cms/ads` with ad list, create flow, and status
   badges.
2. Ad generation consumes approved media, projects, services, and business facts; it never
   requires new media to be uploaded.
3. AI proposals — copy, image gallery, and light cleanup edits — are reviewable drafts with
   provenance; manual edits are preserved and never silently overwritten by AI.
4. Square, portrait, carousel, and story variants produce valid non-destructive crops with focal
   point metadata.
5. Copy enforces platform character limits and an allowed button-label set through shared
   validation.
6. Every ad requires a tenant-owned published destination page before it can become `ready to
   post`.
7. Approval is explicit and audited; `ready to post` is the final state and does not post
   anywhere.
8. The service returns a stable package with a version number, and a person can download a
   deterministic rendering (cropped images per format plus a copy sheet and destination URL) with
   no platform credentials required.
9. Compliance gates block unsupported claims and unreviewed imagery before approval.
10. An E2E test covers create → generate → review/edit → approve → use the package without
    mocking the core domain logic.
11. Ad generation is a service of its own with clearly defined inputs and outputs. The CMS editor
    is one user; another internal part of the platform can also get the package without going
    through the CMS, and external systems can be added later without changing the package format.
