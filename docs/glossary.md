# Glossary

The **ubiquitous language** of Placis — the shared vocabulary used in product docs, technical
docs, code, the API, and the UI. Read this before naming anything new.

> "By using the model-based language pervasively and not being satisfied until it flows, we
> approach a model that is complete and comprehensible, made up of simple elements that combine to
> express complex ideas." — Eric Evans, *Domain-Driven Design*
>
> Domain experts object to terms that are awkward or inadequate to convey the domain; developers
> watch for ambiguity or inconsistency that will trip up the design.

## Why

Bad names in a PRD become table, field, route, and UI names; once they ship they're hard to fix.
We name each concept once, here, and reuse the same word everywhere. If a PRD invents a new word,
it's wrong — the word should already be in this file (or be added here first).

## The rule

Product docs (PRDs) and user-facing text use these **business words**. Implementation identifiers
stay in technical docs and code, listed on each term. The same word is used everywhere — docs,
code, API, UI — with no synonyms drifting in.

Do not say **user** or bare **session** in product docs. Say contractor, owner, or visitor; say
interview, sign-in, or onboarding.

## Not in this product

These are not Placis concepts. Do not coin them, and do not bring them back from older apps:

- **OnCall** — the predecessor. This product is **Placis**.
- **setup** — say **onboarding**.
- **CRM, quotes, invoices, jobs, workflows, calendar, crew** — not a contractor operations suite.
- **AI receptionist** — not in scope.
- **posting ads** — out of scope; ads finish at **ready to post**.

---

## Contractor

The customer: a construction business that Placis researches, builds a website for, and makes ads
for.

Use this exact term in user stories (“As a contractor”) and product prose. Do not say “user”,
“client”, or “customer”.

Distinct from: Owner (the person who claimed), Visitor (someone on the published website).

In code: the paying Clerk user plus `tenant_memberships.role = owner` after claim; never a table
named `contractors`.

---

## Owner

The person who claimed the tenant. They can edit the website and ads in the CMS, and they decide
conflicts during onboarding.

In our language, “owner” is the person, not a synonym for the business.

Distinct from: Contractor (the business).

In code: `tenant_memberships.role = owner`.

---

## Visitor

An unauthenticated person looking at the contractor’s published website. A visitor who submits a
form becomes a Lead.

Distinct from: Contractor, Owner.

---

## Lead

A visitor who got in touch through a public-site form. Stored for ad attribution and done-for-you
follow-up. This is not a CRM: no quotes, invoices, jobs, or pipelines.

In code: `leads`.

---

## Business

The construction company we are learning about — name, trade, services, areas, contact, proof,
photos.

Distinct from: Business profile (our record of that business), Tenant (Placis tenancy after
claim), Organization (Clerk org, named after the person).

---

## Business profile

Everything we know about the business, in one place. Onboarding builds it; Details edits it; the
website shows it; ads read it. Each detail notes where it came from. When the contractor’s answer
disagrees with research, both are shown and they decide.

Do not say “setup profile”, “facts”, or “structured facts”.

In code: `business_profiles`, `business_profile_versions`, `business_profile_services`,
`business_profile_service_areas`, `business_profile_opening_hours`.

---

## Detail

One piece of information in the business profile (a name, a phone number, a service), including
where it came from (the listing, the registry record, the interview, or research).

Do not say “fact”. Do not say `source_refs` in product docs; say where the detail came from.

Distinct from: Details (the CMS screen that edits the profile).

---

## Details

The CMS screen where the contractor edits the business profile. Editing Details
changes the site and the next ad draft.

In code: the Details view over the `business_profile*` tables.

---

## Trade

The main kind of work the business does (roofing, landscaping, bathroom renovation, and the other
allowed trades). A trade picks the website template.

In code: `business_profiles.trade`.

---

## Service

A named thing the business offers, shown on the site and available as an ad focus.

In code: `business_profile_services`.

---

## Service area

A locality the business covers.

In code: `business_profile_service_areas`.

---

## Proof

Evidence of the business: accreditations, certifications, the founder, and reviews. Shown on the
website and available to ads. Do not invent proof.

Distinct from: Certification (one accreditation record), Portfolio (photos of their work).

---

## History

The kept record of how something changed — the business profile, or each frozen copy of the
website. History is never overwritten.

Do not say “version”, “versioned”, or “snapshot” in product docs.

In code: `business_profile_versions`; publications are kept, not updated in place.

---

## Conflict

When the contractor’s answer disagrees with research, both are shown side by side and the
contractor decides. A conflict is not an error.

---

## Onboarding

Learning about the business and building its profile: start from a listing or registry record,
consent, interview, research, one business profile, then a draft website and a preview. It ends at
claim (paid, not published). Never call this “setup”.

In code: `onboarding_sessions`, `internal/onboarding/`. Do not say “session” in product docs.

---

## Listing

The contractor’s Google Maps place, used to start onboarding and pre-fill what we already know.

---

## Registry record

The contractor’s company-registry entry (Companies House, CRO, or a US state registry), used to
start onboarding and pre-fill legal details.

---

## Consent

The one acknowledgement, during the interview, that Placis may collect public information about
the business to prepare the website preview. Not a separate flow.

---

## Interview

The questions we ask the contractor to fill gaps the listing and registry record do not cover.
Text and voice are two channels into the same profile.

In code: `text_interview_submissions`; voice tools write the same profile.

---

## Voice

A way to answer the interview (and later to drive the assistant). Voice is a channel, not a
separate product and not a separate profile.

In code: voice-agent transport; interview tools such as `obtained_information`,
`end_interview`.

---

## Research

Finding out about the business from public sources (Maps, the registry, Facebook, their current
website, photos of their work) after consent. Research runs in the background during onboarding.

In code: `research_sessions` / `research_runs` / `research_events` / `research_sources`,
`internal/research/`.

---

## Preview

The unpaid public look at the **draft website**, on a signed link, before claim. Copy may still be
filling in. Expired previews cannot be claimed.

Do not use “preview” for the CMS editor canvas or for ad format mocks.

In code: `preview_packages`, signed preview token, `internal/onboarding/preview/`.

---

## Claim

Pay and activate: Clerk sign-in if needed, Stripe checkout, tenant becomes active, generated web
address is reserved. The website stays a draft. Claim does not publish.

Do not say “sign up” for this step.

In code: `preview_claims`, Stripe checkout, `internal/onboarding/claim.go`.

---

## Sign up

Create the contractor’s Clerk account. Happens around claim if they are not already signed in.
Sign up is identity, not payment.

Distinct from: Claim.

---

## Draft

The unpublished website the owner edits in the CMS. Onboarding generates a draft;
claim leaves it a draft; visitors do not see it.

Distinct from: an ad in draft (that is an ad status, not this term). Prefer “ad draft” if you must
mention it.

In code: draft `website_pages` / `website_sections` / `content_slots`; no active
`website_publications`.

---

## Skeleton

The draft website right after generate, with placeholders, before copy generation finishes.
Preview can be issued on the skeleton. If copy generation fails, the skeleton stays.

Distinct from: Draft (the skeleton is a draft; not every draft is still a skeleton).

---

## Website

The contractor’s site: pages, sections, slots, forms, menu, styles, built from a template and the
business profile, edited in the CMS, shown to visitors only after publish.

In code: `website_pages`, `website_sections`, `content_slots`, `website_forms`,
`navigation_items`, `website_publications`, `internal/website/`. Media lives in `website_assets`
but is named Media in product language.

---

## Template

The starting point for a website: the pages and sections a typical site of that trade needs.
Product docs and UI say “template” or “trade template”.

In code: `blueprint` (catalog JSON under `catalog/`, `internal/website/blueprints/`). Never say
“blueprint” in a PRD.

---

## Placeholder

A blank in the draft that stands for a business detail (`{{business_name}}`, `{{phone}}`, …).
Placeholders stay in the draft and fill from the business profile at publish.

In code: `{{var}}` tokens; see website variables.

---

## Page

One page of the website (home, a service page, contact, legal), with a page path, title, and an
ordered list of sections.

In code: `website_pages`.

---

## Section

A block on a page (hero, services, reviews, …), edited through its slots.

In code: `website_sections` (an instance of a catalog component).

---

## Slot

A named editable value inside a section: text, rich text, image, list, link, reviews, or a
project gallery.

In code: `content_slots`.

---

## Copy

The words we write for the contractor — headlines, body, calls to action — on the website or in
an ad.

In code: text / rich_text `content_slots`; `ad_copy_variants` for ads.

---

## Copy generation

Writing website copy into the draft from the business profile, in the background after the
skeleton exists. It does not block preview. Do not call this “refinement” in onboarding.

Distinct from: Assistant (the CMS chat after claim).

In code: onboarding pipeline 05; the same CMS tools as the editor (`update_slot`, `update_seo`,
…) with no chat UI.

---

## Menu

The site navigation (header and footer).

In code: `navigation_items`.

---

## Styles

The look of the site (colors, fonts, and related design controls).

In code: style presets / theme tokens. Do not say “design system” in a PRD.

---

## Form

A form on the website a visitor can submit. A submission creates a Lead.

Distinct from: Ad lead form (suggested Meta fields on an ad).

In code: `website_forms`.

---

## Media

The photo library in the CMS: the contractor’s work, logos, and documents. Only approved items
with a caption can be used on the website or in ads. The source photo is never overwritten; AI
cleanup makes a separate reviewed variant.

Do not say “asset” in product docs.

In code: `website_assets` (bytes in `files`).

---

## Caption

The alt text on a media item. A photo needs a caption and approval before the website or ads can
use it.

---

## Approved

A media item the owner has accepted for use. Unapproved photos cannot appear on the
website or in an ad.

---

## Portfolio

The contractor’s work shown on the site, as projects with photos, edited separately from page
sections.

In code: `projects`. Never say “project” as the product name for this library; the product name is
portfolio.

---

## Certification

Proof the business holds a trade accreditation, edited separately from page sections.

In code: `certifications`.

---

## Editor

The website part of the CMS: pages, canvas, menu, and styles. Details, Media, and Ads are their
own screens beside the editor, not page content.

---

## Assistant

The CMS chat (and later voice) that proposes website edits after claim. It drafts; the owner
decides. The LLM never publishes.

Distinct from: Copy generation (headless, during onboarding, no chat UI).

In code: website assistant tools (`update_slot`, `generate_image`, …).

---

## Publish

Put the website on the internet: validate the draft, fill placeholders from the business profile,
and make a frozen copy visitors will see. Publish is a CMS action after claim; onboarding never
publishes.

Use this verb. Do not introduce “go live” as a second process. Ads do not publish; they become
ready to post.

In code: `website_publications` (the frozen `site_manifest`).

---

## Frozen copy

What publish writes: a kept copy of the site visitors will see. The edited draft stays the source
of truth; a frozen copy is never overwritten. Undo a bad publish by rollback.

Do not say “materialize” or “snapshot” in product docs.

In code: one `website_publications` row holding `site_manifest`.

---

## Rollback

Make an earlier frozen copy the live site again, without deleting history.

In code: reactivate an earlier `website_publications` row.

---

## Live site

What visitors see: the currently published website. Distinct from the draft in the CMS.

---

## Web address

The URL-safe name of the business’s site (the host people type). Reserved at claim as the
generated subdomain.

Do not say `slug` in product docs.

Distinct from: Page path, Custom domain.

In code: `tenants.slug`, `tenant_domains.hostname` (`type=subdomain`).

---

## Custom domain

The contractor’s own hostname (later), on top of the generated web address.

In code: `tenant_domains` with `type=custom`.

---

## Page path

The URL-safe path of a page on the website (for example a service page).

Do not say `slug` in product docs.

Distinct from: Web address.

In code: page path / `slug` on `website_pages`.

---

## The CMS

The app where the owner edits marketing: website, ads, Details, and Media. It is the
umbrella, not a synonym for the website editor.

In code: `/cms/website`, `/cms/ads`, Details, Media; `internal/website/` + `internal/ads/`.

---

## Ad

What the owner calls one offer or marketing goal — images cropped for each format, plus short
copy, a destination, and a suggested lead form. Ads are created on demand in the CMS, never during
onboarding. Placis does not post ads; the first finish line is ready to post.

Do not say “creative set” in product docs or UI.

In code: `ad_creative_sets` plus `ad_variants`, `ad_copy_variants`, `ad_image_placements`,
`ad_lead_forms`.

---

## Ad format

A standard size an ad is produced in: square feed, portrait feed, carousel, or story. Formats
without suitable approved photos are omitted, never empty.

In code: `ad_variants` (`feed_square`, `feed_portrait`, `carousel`, `story`).

---

## Destination

An existing published (or scheduled) website page owned by that contractor, that the ad can send
people to. Ads do not get a new landing page.

In code: a tenant-owned `website_pages` row referenced by the ad.

---

## Ideal customer profile

Who the ad is for. It steers tone, imagery, and the offer. It does not appear as a claim in the
copy. Precise targeting from it is future posting work.

Do not abbreviate to “ICP” in product docs.

---

## Ad lead form

Suggested title and questions for a Meta lead form, carried on the ad. The real form is created at
posting time (future work). Distinct from Form (a form on the website).

In code: `ad_lead_forms`.

---

## Needs review

Ad step: AI-generated or compliance-sensitive content waiting for the owner. An ad
cannot become ready to post from this step without an explicit accept.

Not website publish, and not used as a website status.

---

## Ready to post

The approved ad package: validation passed, the owner accepted it, and it can be
handed to a platform or downloaded. This is the ads finish line. It is not website publish and it
is not posting.

In code: `ready_to_post` on the creative set.

---

## Ad package

The deliverable of an approved ad: images at each format, copy, destination, and the suggested
lead form. Callers read this package directly; a zip download is only for someone posting by
hand.

Distinct from: Preview (unpaid look at the draft website).

---

## Posting

Sending an ad to an ad platform (Facebook / Meta first). Out of scope. Ready to post is not
posting. Publish is not posting.

---

## Ad platform

Facebook / Meta (first), where an approved ad would later be posted. Do not say “platform” for
Placis or the CMS.

---

## Done-for-you

Placis researches, builds, tweaks, and runs ads for the contractor, delivered into their inbox,
so they can DIY too.

---

## DIY

The owner can do the same website edits and ad creation themselves through the CMS.

---

## Tenant

Placis’s tenancy record for one contractor after claim. One tenant maps to one Clerk
organization. The tenant name is the **business**.

Never in product/user-facing text. Distinct from: Organization (Clerk, named after the person),
Business profile.

In code: `tenants`, `tenant_id` on every tenant-owned row.

---

## Organization

The Clerk organization, 1-1 with a tenant, named after the **person** (the account owner), not the
business.

Never in product/user-facing text as a synonym for the contractor.

In code: `tenants.clerk_org_id`.

---

## Component

A named building block of a section (`public.hero.image`, …), with a contract for props, slots,
and design controls. Never in product/user-facing text.

In code: catalog component structs under `catalog/`.

---

## Catalog

Where templates and components live as versioned JSON, not as database rows. Never in
product/user-facing text.

In code: `catalog/`.

---

## File

Stored bytes (a photo, a document). Never in product/user-facing text. Product language is Media
or photo.

In code: `files`; `website_assets.file_id`.

---

## Implementation-only words

Never in product/user-facing text or PRD prose — these live only in technical docs and code.

| Don't say | Say |
| --- | --- |
| setup | onboarding |
| OnCall | Placis |
| refine / refinement (onboarding) | copy generation |
| fact / structured facts | detail / information |
| source reference / `source_refs` | where a detail came from |
| version / versioned / snapshot | history / a frozen copy |
| state / state machine | steps / where things stand |
| normalize(d) | combine / turn into |
| materialize(d) | make a frozen copy |
| immutable | kept / never overwritten |
| artifact | what we built (or the specific deliverable) |
| idempotent | safe to retry (tech only) |
| source-first | start from an existing listing |
| propose-only | the LLM drafts; the contractor edits and publishes |
| blueprint | template |
| creative set | ad |
| asset | photo / item in Media |
| slug | web address or page path |
| user | contractor, owner, or visitor |
| client / customer | contractor |
| go live | publish |
| ICP | ideal customer profile |
| session (bare) | interview, sign-in, or onboarding |
| `Demo`-prefixed ops; `save` vs `update`; `Projection`/`Read`/`Summary` aliases | one verb (`Create/Update/Get/List/Delete`), one `*Read` response suffix |

## Code → product

When you see the identifier, use the product word in PRDs and UI.

| In code | Say |
| --- | --- |
| `blueprint` | template |
| `ad_creative_sets` | ad |
| `website_assets` | Media |
| `files` | (bytes; product: photo / Media) |
| `slug` | web address or page path |
| `source_refs` | where a detail came from |
| `site_manifest` / `website_publications` | frozen copy / publish |
| `onboarding_sessions` | onboarding |
| `preview_packages` | preview |
| `preview_claims` | claim |
| `projects` | portfolio |
| `certifications` | certification |
| `navigation_items` | menu |
| `content_slots` | slot |
| `tenants` | (never in PRD; tenant) |
| `clerk_org_id` | (never in PRD; organization) |

## Code naming rules

- Ubiquitous language: one canonical term per concept, reused in docs, code, API, and UI (product
  words in product surfaces; identifiers above in code).
- Database: `snake_case`, plural table names, `tenant_id` on every tenant-owned row, `*_id`
  foreign keys, `snake_case` enum values.
- Go: feature-nested packages (`internal/<domain>/<feature>/`), no package stutter
  (`website/pages`, not `website/websitepages`); the file-size guard applies (see `ci-cd.md`).
- API: `/api/v1/<domain>/...`, domain nouns in paths, `Create/Update/Get/List/Delete` verbs, one
  `*Read` response suffix.
- New terms are added to this glossary first; a PRD never invents a synonym.
