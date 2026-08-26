# Glossary

The **ubiquitous language** of Placis. Read this before naming anything new.

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

**Domain** terms are the business's own words. Use them in PRDs, user stories, UI, and in code
when they name that concept.

**Enums** are closed sets of user-facing labels. They live together under Enums, not as their own
terms.

**Internal** terms are technical names for a *different* concept — not an alias, synonym, or
“In code” stand-in for a Domain term. Use them in technical docs and code only. If Internal and
Domain would name the same concept, drop Internal; code snake_cases the Domain term. If they are
different concepts, keep both, with Distinct from.

The glossary defines what terms mean. It never prescribes — no scope, pipeline, validation rules,
or how something is implemented. Those belong in PRDs and technical docs.

In PRDs, user stories, and UI, a website term includes **website**. Never say page, section, slot,
styles, form, editor, template, draft, preview, or publish as if they were generic. **Top menu**
and **footer** are named separately; never say header, navigation, or bare “menu”. The same idea for ads and onboarding: use
the full glossary term when the feature is not already the context.

In technical docs and code that **clearly already belong to that feature** (a website architecture
doc, `internal/website/`, an ads package), the short word is acceptable: page, section, slot; copy,
variant; session. Do not use the short word in a mixed or product-facing sentence where it could
mean something else.

Do not say **user**, **frozen**, bare **session**, **provider**, **instantiate**, or **population**.
Say contractor, owner, or website visitor; name Google Maps, the LLM, or Stripe; say apply the
website template.

---

## Domain

Product and user-facing language. Use these words in PRDs, UI, and in code when they name that
concept.

### Contractor

The customer: a construction business that Placis researches, builds a website for, and makes ads
for.

Use this exact term in user stories (“As a contractor”) and product prose. Do not say “user”,
“client”, or “customer”.

Distinct from: Owner (the person who activated), Website visitor (someone on the live website).

---

### Owner

The person who completed website activation. They can edit the website and ads, and they decide
research conflicts during onboarding.

“Owner” is the person, not a synonym for the business.

Distinct from: Contractor (the business).

---

### Business

The construction company we are learning about — name, trade, services, areas, contact,
certifications, reviews, photos.

Distinct from: Business profile (our record of that business).

---

### Business profile

Everything we know about the business, in one place. Onboarding builds it; Details edits it; the
website shows it; ads read it. Each detail notes where it came from. When the contractor’s answer
disagrees with business research, both are shown and they decide.

Do not say “setup profile”, “facts”, or “structured facts”.

Distinct from: Profile (the left-nav group).

---

### Detail

One piece of information in the business profile (a name, a phone number, a service), including
where it came from (the Google Maps listing, the company registry record, the client interview, or
business research).

Do not say “fact”.

Distinct from: Details (the screen that edits the profile).

Internal: Source refs.

---

### Marketing phone

The phone on the website and in ads — where website leads and ad leads call.

Distinct from: Emergency phone (how we reach the owner).

In code: `business_profiles.marketing_phone`.

---

### Marketing email

The email on the website and in ads. Never say “website email”. Not the Clerk account email
(identity; not a profile detail).

In code: `business_profiles.marketing_email`.

---

### Emergency phone

How we contact the owner. Unpublished; may be the same number as marketing phone.

Distinct from: Marketing phone.

In code: `business_profiles.emergency_phone`.

---

### Details

The screen where the contractor edits the business profile. Editing Details changes the website
and the next ad draft. In Profile, Details is labeled **Business details** (also the in-page
title).

Distinct from: Profile (the nav group), Business profile (the record).

---

### Trade

The main kind of work the business does (roofing, landscaping, bathroom renovation, and the other
allowed trades).

---

### Service

A named thing the business offers, shown on the website and available as an ad focus.

---

### Service area

A locality the business covers.

---

### Certification

A trade accreditation the business holds, edited separately from website sections.

Distinct from: Projects (photos of their work).

---

### Projects

The contractor’s work shown on the website — jobs with photos — edited separately from website
sections. Reached from Profile, not as its own top-level nav item.

Use “projects” in product docs and UI. Do not say “portfolio”.

---

### Reviews

What people wrote about the business on the Google Maps listing: who wrote it, the rating, and
the text. Filled during onboarding. Shown on the website; ads read the same rows.

Distinct from: Ad needs review (an Ad state), Website preview.

In code: `business_profile_reviews`, `google_maps_listing_reviews`, `website_slot_reviews`.

---

### Profile

The left-nav group in The CMS that holds Details and Projects. It is not a page and not a
record.

Distinct from: Business profile (the data), Details (the Business details screen), Profile
history (how the business profile changed).

---

### Profile history

The kept record of how the business profile changed.

Do not say “version”, “versioned”, or “snapshot” for this. Distinct from: Profile (the nav
group), Website version (published checkpoints of the website), Website edit history
(unpublished website edits).

In code: `business_profile_edits`, `business_profiles.last_edit_id`,
`business_profiles.accepted_edit_id`.

---

### Research conflict

When the contractor’s answer disagrees with business research, both are shown side by side and
the contractor decides. A research conflict is not an error.

---

### Google Maps listing

The contractor’s Google Maps place, used to start onboarding and pre-fill what we already know.

In code: `google_maps_listings` (Google’s `place_id` as the external id).

---

### Company registry record

The contractor’s entry in a company registry (Companies House, CRO, or a US state registry),
used to start onboarding and pre-fill legal details. Never say bare “registry record”.

---

### Media library

The photo library: the contractor’s work, logos, and documents. Never say bare “media” for this
library. Full screen at `/cms/media`. In the website editor it is a selectable **workspace
item** (same library). Drop files onto that workspace item to upload.

Internal: Media asset, File. Do not say bare “asset” in product docs.

---

### Media caption

The alt text on a media item. Never say bare “caption”.

---

### Approved media

A media item the owner has accepted for use.

---

### Supplied by

Who originated this picture in the media library: the user, research, or AI. A generated image is
supplied by AI. A cleanup copy inherits supplied by from the parent; edits always create a new
media library item and never replace the parent’s file.

Distinct from: Source refs (where a detail came from). Never say “provenance”.

In code: `supplied_by`.

---

### Copy

The words we write for the contractor — headlines, body, calls to action — on the website or in
an ad.

Distinct from: Marketing statement (an assertion in those words that must be backed by a detail).

---

### Marketing statement

An assertion we make in marketing (on the website or in an ad) that must be backed by a detail —
reviews, ratings, guarantees, prices, years in business, and the like.

Distinct from: Copy (the words), Website activation (never “website claim”), Clerk JWT claims
(auth only).

Never say “marketing claim”, “advertising claim”, or bare “claim” for this.

---

### Placis website

Placis’s own site. Never say “our site”, “our website”, or “public site” for this.

Distinct from: Website (the contractor website). Say contractor website when the contrast is needed.

---

### Onboarding

Learning about the business and building its profile: start from a Google Maps listing or
company registry record, online research consent, client interview, business research, one
business profile, then an unpublished website and a website preview. It ends at website activation
(paid, not published). Never call this “setup”.

Distinct from: Onboarding session (the persisted run).

---

#### Online research consent

The one acknowledgement, on find (a checkbox required before Confirm), that Placis may collect
public information about the business to prepare the website preview. Not a client interview
question. Never say bare “consent”.

In code: `onboarding_sessions.online_research_consent_at`.

---

#### Business research

Finding out about the business from public sources (Maps, the company registry, Facebook, their
current website, photos of their work) after online research consent. Never say bare “research”.

In code: `business_research_waves`, `business_research_runs`, `business_research_events`,
`business_research_sources`, `business_research_fetches`.

---

#### Sign up

Create the contractor’s account. Happens around website activation if they are not already signed in.
Sign up is identity, not payment.

Distinct from: Website activation.

---

#### Website activation

Pay and activate: sign-in if needed, pay, the website address is reserved. The website stays
unpublished.

Distinct from: Sign up, Website publication. Never say “website claim”.

In code: `website_activations`.

---

#### Website preview

A stage in our sales process where they choose to buy the website or not. Never say bare
“preview”. Do not use this word for the website editor canvas or for ad format mocks.

Distinct from: Unpublished website, Website activation, Website preview link, Ad format
preview, the `{website_address}.preview.placis.com` host (that is the website address after
website publication, not this sales stage). Never label that host website preview.

In code: `website_previews`, `internal/onboarding/websitepreview/`.

---

#### Website preview link

The shareable URL for a website preview. Anyone who has the link can open the unpublished
website until the website preview is superseded or activated. Never say “signed website preview”.

Distinct from: Website preview (the sales stage), Preview token, Signed URL.

---

### Website

The contractor’s site: website pages, website sections, website slots, website forms, top menu,
footer, website styles, built from a website template and the business profile, edited in the
website editor, shown to website visitors only after website publication.

Say **contractor website** when you need to tell it apart from Placis website.

Distinct from: Placis website.

---

#### Unpublished website

The website after applying the website template, before website publication. Website visitors do
not see it.

Do not say bare “draft”. An ad in draft is an Ad states value; say “ad draft” if you must.

Distinct from: Website preview (the sales stage where they choose to buy), Live website.

---

#### Live website

What website visitors see: the currently published website. Distinct from the unpublished website,
Published website copy (the content), and Placis website (whose site is still the contractor’s).

---

#### Website template

The starting point for a website: the website pages and website sections a typical site of that
trade needs. Never say bare “template” or “blueprint”.

In code: `website_template`, website template catalog.

---

#### Website page

One page of the website (home, a service page, contact, legal), with a website page path, title,
and an ordered list of website sections. Never say bare “page” in PRDs or UI.

---

#### Website page path

The URL-safe path of a website page (for example a service page). Never say `slug` or bare “page
path” in PRDs or UI.

Distinct from: Website address.

---

#### Website section

A block on a website page (hero, services, reviews, …), edited through its website slots. Never
say bare “section” in PRDs or UI. The top menu and footer each have one site-wide look website
section (`page_id` null); they are not copied onto every website page.

Internal: Website component (a website component catalog building block a website section is an
instance of).

---

#### Website slot

A named editable value inside a website section: text, rich text, image, list, link, reviews, or
a project gallery. Never say bare “slot” in PRDs or UI.

In code: `website_slots`.

---

#### Website styles

The look of the website (colors, fonts, and related design controls). Never say bare “styles” or
“design system” in PRDs or UI.

Internal: Website style catalog.

---

#### Website form

A form on the website a website visitor can submit. A submission creates a Website lead. Never
say bare “form” in PRDs or UI.

Distinct from: Ad lead form (suggested Meta fields on an ad).

---

#### Website editor

The website editing screen: website pages, canvas, editing panel, top menu, footer, and website
styles. Details, Projects, Certifications and reviews, and the media library are website page
content; they are separate entities edited on their own screens, not as website slots here. Ads
are their own screens and are not website page content. Never say bare “editor” in PRDs or UI.

---

#### Editing panel

The right-hand column of the website editor. The owner edits the selected website section
(website slots, design) and website-page SEO, website forms, and website versions. Never say
inspector.

Distinct from: Canvas (the website page), Workspace (website pages / media library / website
styles / top menu and footer).

---

#### Top menu

The bar at the top of the website. Never say header, navigation, or bare “menu”.

A JSON tree of website pages, text groups, and URL nodes (depth 2: bar + one dropdown), stored on
`website.menus.top_menu`. Look (logo, marketing phone, design) is the site-wide top-menu website
section. Edited in the website editor workspace, not Details.

Distinct from: Footer, Website section (a block on a website page — except the site-wide top-menu
look section). Top menu is not a website page. Distinct from the Placis website.

In code: `website.menus.top_menu`.

---

#### Footer

The footer of the website. Never say navigation or menu for this.

A JSON tree of the same node kinds as the top menu (depth 2), stored on `website.menus.footer`.
Look is the site-wide footer website section. Edited in the website editor workspace, not Details.

Distinct from: Top menu, Website section. Distinct from the Placis website.

In code: `website.menus.footer`.

---

#### Website assistant

The chat (and the voice agent) that proposes website edits. Two configs combine: **plan** vs
**continuous** (text plan first, or not), and **instant apply** vs **Ask first** (Apply /
Reject, or not). It drafts; the owner decides except in instant apply.

Distinct from: Website copy generation, Website assistant plan.

---

#### Website assistant plan

Text the website assistant shows before it continuously applies (plan workflow). Confirmation
text, like asking Cursor for a plan. Nothing is written until the owner accepts that text
(then Apply / Reject still follow Ask first or Instant apply).

Never say “live markdown plan” or “handoff boundary”.

Distinct from: Website assistant (the chat), continuous workflow (no plan text), instant apply
(no Apply / Reject), Ask first (Apply / Reject), Website copy generation (continuous + instant apply, no chat).

---

#### Ask first

The website assistant shows Apply / Reject before an edit lands. Opposite of Instant apply.

Distinct from: Instant apply, Website assistant plan.

---

#### Apply the website template

Write unpublished website pages, website sections, and website slots from a website template and
the business profile. Website placeholders stay. Never say instantiate, population, or generate
for this.

Distinct from: Website copy generation (the words), Website template (the starting point).

In code: onboarding session status `applying_website_template` / `apply_website_template_failed`.

---

#### Website copy generation

Writing website copy into the unpublished website from the business profile. Do not call this
“refinement” in onboarding. Never say generate without “website copy”.

Distinct from: Website assistant, Apply the website template (the unpublished website structure).

---

#### Website publication

Putting the website on the internet. Distinct from: Unpublished website, Published website copy
(the content), Live website (what visitors see), Ad states.

Never say bare “publish” or “go live” in PRDs or UI.

In code: `website_publications` (each row is a website version).

---

#### Website version

One kept checkpoint of the whole website. Website versions are the history of the website.
Website publication makes a website version the live website. Website rollback makes an earlier
website version live.

Distinct from: Profile history (the business profile), Website edit history (unpublished
website edits), Unpublished website (what the editor mutates), Website publication (the act),
Published website copy (the content of the live website version), Live website.

Do not say “website history”, “website page version”, or “website page history”. Never say bare
“version” for the business profile.

In code: `website_publications` (`version_number` is the website version number).

---

#### Website edit history

The kept record of how the unpublished website changed (typed increments, not published
checkpoints).

Distinct from: Website version (published checkpoints of the whole website), Profile history
(the business profile), audit events.

Do not say “website history”.

In code: `edit_history`, `website_settings.edit_history_head`.

---

#### Website rollback

Make an earlier website version the live website again, without deleting profile history.

---

#### Website address

The default host of the business’s site: they may be deployed under **our subdomain**. Reserved
at website activation. Never say `slug`.

Distinct from: Custom website address (the address they supply), Website page path.

In code: `website_addresses` with `type=subdomain`.

---

#### Website visitor

An unauthenticated person looking at the contractor’s live website. A website visitor who
submits a website form becomes a Website lead.

Distinct from: Contractor, Owner.

---

#### Website lead

A website visitor who got in touch through a website form.

Distinct from: Ad lead.

---

### Ad

What the owner calls one offer or marketing goal in one ad format.

Distinct from: Creative set (images + text), Ad posting (running a paid ad), Ad set (the
deliverable). Never say “creative set” in product docs or UI.

---

#### Ad destination

An existing published website page owned by that contractor, that the ad can send people to.

Deferred for v1 ads: ads use an ad lead form only and do not send people to a website page.

---

#### Ideal customer profile

Who the ad is for. It steers tone, imagery, and the offer.

Do not abbreviate to “ICP” in product docs.

---

#### Ad lead form

Suggested title and questions for a Meta lead form, carried on the ad. Distinct from Website
form.

---

#### Ad set

The deliverable of an approved ad: images at this ad's format, copy, and the
suggested ad lead form. Never say “ad package”.

Distinct from: Creative set (images + text), Website preview.

---

#### Ad format preview

Facebook and Instagram placement mocks of this ad’s one format, shown in Review as the owner
types. Distinct from: Website preview. Not Meta `generatepreviews` (that is ad posting time).

---

#### Ad posting

Sending an ad to an ad platform (Facebook / Meta first) — a running paid ad.

Distinct from: Creative set, Ad states (ad ready to post), Website publication. Never say bare
“posting”.

---

#### Ad platform

Facebook / Meta, where an ad is posted. Do not say “platform” for Placis.

---

#### Ad lead

A person who got in touch through an ad (a Meta lead form).

Distinct from: Website lead.

---

## Enums

Closed sets of user-facing labels. Name the set; the values live only here — never as their own
terms.

### Ad

#### Ad states

Where an ad stands. Two closed sets of labels:

While creating the ad:

- **Ad draft** — being created or edited.
- **Ad needs review** — AI-generated or compliance-sensitive content waiting for the owner.
- **Ad ready to post** — the owner accepted it; it can be handed to an ad platform or downloaded.
- **Archived** — no longer offered, kept as a past ad.

On an existing ad:

- **Draft**
- **Creative ready** — the ad is done.
- **Published** — used once ad posting exists. Distinct from Website publication.
- **Archived**

Never say bare “draft”, “needs review”, or “ready to post”.

In code: `ads.status` (`draft` / `ad_needs_review` / `ad_ready_to_post` / `archived`).

---

#### Ad format

A standard size an ad is produced in.

- **Square feed**
- **Portrait feed**
- **Carousel**
- **Story**

Square feed, Portrait feed, and Carousel are **posts**. Story is **stories**. One ad is
one format — a single creative is a single ad. The owner picks that format before
generate. The draft matches how the format is used: feed is one photo; a carousel is
several cards; a story is almost always one image.

In code: `feed_square` / `feed_portrait` / `carousel` / `story`.

---

## Internal

Technical names for concepts that are **not** a Domain term. Never in product docs or UI. If Internal
and Domain would name the same concept, drop Internal; code snake_cases the Domain term.

### Tenant

Placis’s tenancy record for one contractor. Created at onboarding confirm as an **unactivated**
tenant; website activation upgrades the same row to an **activated** tenant. One **activated**
tenant maps to one Clerk organization. The tenant name is the business. Never in PRDs.

Domain: (none — never in PRDs). Distinct from: Business profile, Clerk organization.

In code: `tenants`, `tenant_id` on every tenant-owned row;
`tenants.status` (`unactivated` / `active` / `suspended`). `/me` exposes a tenant only when
`status=active`.

---

### Clerk organization

The Clerk organization, 1-1 with an **activated** tenant, named after the person (the account
owner), not the business. Never say bare “organization”. Unactivated tenants have no Clerk
organization yet.

Domain: (none — never in PRDs as a synonym for the contractor).

In code: `tenants.clerk_org_id`.

---

### Signed URL

A time-limited file download URL. Distinct from: Website preview link. Never call a website
preview signed.

In code: object-storage signed URLs.

---

### The CMS

The app where the owner edits marketing: website, ads, Details, Projects, and Media library.
Umbrella name, not a synonym for the website editor. Never in PRDs as if it were a domain
object.

In code: `frontend-2` (`/cms/website`, `/cms/ads`, `/cms/details`, `/cms/projects`, Details,
Media library). Profile is the left-nav group, not a route.

---

### Loading placeholder

The shaped stand-in shown **in** a field, row, or slot while that value is still loading. Same
layout as the loaded UI. Not a spinner that replaces a whole card, panel, canvas, or screen.
Not the unpublished website (never say “skeleton” for either). Distinct from: Website placeholder
(`{{…}}` in unpublished copy).

In code: `LoadingPlaceholder`. Never `Skeleton`.

---

### Done-for-you / DIY

**Done-for-you:** Placis researches, builds, tweaks, and runs ads for the contractor, delivered
into their inbox. **DIY:** the owner can do the same website edits and ad creation themselves.

Positioning, not a domain object.

---

### Media asset

A row in the media library. Never say bare “asset” (a website is not this). Distinct from: Media
library (the library), File (bytes), Supplied by (who originated the picture).

The file on a row is never replaced. An edit creates a new row with `parent_media_asset_id` set
to the parent.

In code: `media_assets`.

---

### File

Stored bytes (a photo, a document). Distinct from: Media asset (the media library row).

In code: `files`; `media_assets.file_id`.

---

### Source refs

Where a detail came from (for example marked as their Google Maps listing). Distinct from: Detail
(the information itself), Supplied by (who originated a picture). Never say `source_refs` in
product docs.

In code: `origin`.

---

### Provider

Not a term. Name Google Maps, the LLM, Stripe, or fakes in tests. Never use this word for a
dependency.

---

### Onboarding

#### Onboarding session

The persisted onboarding run. Distinct from: Onboarding (the process), Resume. Do not say
“session” in product docs.

In code: `onboarding_sessions`, `internal/onboarding/`.

---

#### Resume

Continuing an in-progress onboarding session on the same browser. `localStorage` holds the
onboarding session token; restore is `GET .../profile`. There is no second token. Never say
“resume token”.

Distinct from: Onboarding session (the persisted run), Website preview link (opens without
`localStorage` after the website template is applied).

In code: `onboarding_sessions.token` in `localStorage`.

---

#### Client interview

The questions we ask the contractor to fill gaps the Google Maps listing and company registry
record do not cover. Text and voice are two channels into the same business profile. Never say
bare “interview”.

Domain: (internal — use this name in technical docs; onboarding copy may describe the
questions).

In code: `client_interview_submissions`; voice tools write the same profile. Onboarding session
status `client_interviewing`.

---

#### Voice

A channel: answer the client interview, drive the website assistant, and use the voice agent in
the CMS. Not a separate product and not a separate profile.

Distinct from: Voice agent.

---

#### Voice agent

The realtime agent the owner can turn on in the application. Same governed tools as text.

Distinct from: Voice (the channel), Website activation (never say “activate” for the voice
agent).

---

#### Preview token

The secret in a website preview link. Technical docs only. Never say “signed” for this.

Distinct from: Website preview link, Signed URL.

In code: `website_previews.token_hash`.

---

### Website

#### Custom website address

The website address **they supply**, which we publish under. Distinct from: Website address (the
default: they may be deployed under our subdomain). Never say bare “custom domain”.

In code: `website_addresses.type=custom`.

---

#### Website placeholder

A blank in the unpublished website that stands for a business detail (`{{business_name}}`,
`{{marketing_phone}}`, …). Never say bare “placeholder”. Distinct from: Loading placeholder
(UI while a field loads).

---

#### Website component

A named building block of a website section (`public.hero.image`, …), with a contract for props,
website slots, and design controls. Never say bare “component”.

Domain: Website section (a website section is an instance of a website component).

In code: website component catalog structs under `catalog/`.

---

#### Website template catalog

Where website templates live. Never say bare “catalog”. In code: `catalog/` (templates).

---

#### Website component catalog

Where website section building blocks live. Never say bare “catalog”. In code: `catalog/`
(component contracts).

---

#### Website style catalog

Where website style presets live. Never say bare “catalog”. In code: `catalog/` (style presets).

---

#### Published website copy

The content of the website: text, images, and arrangement — the website manifest produced to convert
a website visitor to purchase or call.

Distinct from: Website publication (the act), Website version (the kept checkpoint), Live website
(what they see).

Never say “frozen”, “materialize”, “snapshot”, or bare “published copy”.

In code: one `website_publications` row holding `website_manifest`.

---

#### Website manifest

The concise technical JSON read model: website pages → website sections → props. Distinct from:
Website publication, Published website copy. Never say “site manifest”.

In code: `website_manifest`.

---

### Ad

#### Creative set

A marketing set: images + text. Distinct from: Ad (an offer or marketing goal), Ad set (the
owner-facing deliverable), Ad posting (running a paid ad). Never say “creative set” in product docs
or UI.

In code: `ads` plus `ad_variants`, `ad_copy_variants`, `ad_image_placements`,
`ad_lead_forms`.

---

### Don't say

Never in product/user-facing text, PRD prose, technical docs, or code, unless a home marker says the unqualified word is self-understood there. `cmd/ci/check-dont-say` reads this table: keep the `Don't say | Say` header, separator, data rows, and end the section at the next `## ` heading. Unmarked = nowhere. `(website)` / `(ads)` / `(onboarding)` / `(media)` / `(details)` = unqualified only in that feature’s technical docs (not `prd.md`, not `frontend.md`) and later `internal/<home>/`; other features use the Say. `(in a PRD)` is only for `CMS`. Leftover `(bare)` is unmarked. Worked examples: `cmd/ci/check-dont-say/ref.md`.

| Don't say | Say |
| --- | --- |
| setup | onboarding |
| OnCall | Placis |
| frozen / frozen copy | published website copy |
| refine / refinement | website copy generation |
| instantiate / population | apply the website template |
| generate unpublished website / generate website structure | apply the website template |
| provider | name the service (Google Maps, the LLM, Stripe) or fakes in tests |
| signed (onboarding) | website preview link (product); preview token (technical) |
| live markdown plan | website assistant plan |
| handoff boundary | the owner approves the plan, then the assistant applies it |
| website email | marketing email |
| phone | marketing phone |
| fact (details) / structured facts | detail / information |
| proof | certifications, reviews, or projects as appropriate |
| history (details, website) | profile history, website versions, or website edit history |
| menu (website) / header / navigation | top menu or footer |
| version (website, details) / versioned (website, details) / snapshot (website, details) | website version or profile history |
| consent (onboarding) | online research consent |
| interview (onboarding) | client interview |
| research (onboarding) | business research |
| preview (website, ads) | website preview or ad format preview |
| preview package | website preview |
| claim / website claim (activation) | website activation |
| marketing claim / advertising claim / unsupported claim | marketing statement / unsupported marketing statement |
| draft (website, ads) | unpublished website, or ad draft (Ad states) |
| template (website) | website template |
| page (website) / section (website) / slot (website) / styles (website) | website page / website section / website slot / website styles |
| form (website, ads) | website form or ad lead form |
| caption (media) | media caption |
| media (media) | media library |
| editor (website) | website editor |
| inspector | editing panel |
| publish (website) / go live (website) / website publish (website) | website publication |
| registry record | company registry record |
| placeholder (website) | website placeholder or loading placeholder |
| catalog (website) | website template catalog, website component catalog, or website style catalog |
| component (website) | website component |
| our site / our website | Placis website |
| public site / public-site runtime | contractor website or Placis website (whose site) |
| runtime | do not name the application “runtime”; the contractor website lives in `apps/contractor-website` |
| private app / private Vite app / private client | the part of the application: the CMS, onboarding, or website preview (`frontend-2`) |
| shell / profile shell / app shell / page shell / Astro shell / CMS shell / editor shell / chrome / wrapper chrome / app chrome | empty business profile; the CMS (sidebar + main area); Astro document vs React islands; no extra wrapper around the page |
| custom domain | custom website address |
| published copy | published website copy |
| site manifest | website manifest |
| ready to post (ads) | ad ready to post (Ad states) |
| posting (ads) | ad posting |
| ad package | ad set |
| organization | Clerk organization |
| needs review (ads) | ad needs review (Ad states) |
| source reference / `source_refs` | where a detail came from |
| provenance | supplied by (media) or where it came from (a detail) |
| citation | where it came from |
| state / state machine | steps / where things stand |
| normalize(d) | combine / turn into |
| materialize(d) | make a published website copy |
| immutable | kept / never overwritten |
| artifact | what we built (or the specific deliverable) |
| idempotent | safe to retry |
| source-first | start from an existing Google Maps listing |
| propose-only | the LLM drafts; the contractor edits and does a website publication |
| blueprint | website template |
| skeleton | unpublished website (the unpublished site) or loading placeholder (UI while a field loads) |
| creative set | never in product (Internal: Creative set — images + text; not Ad) |
| asset (media) | media asset (internal) or photo / item in the media library (product) |
| slug | website address |
| user | contractor, owner, or website visitor |
| visitor | website visitor |
| lead (website, ads) | website lead or ad lead |
| client / customer | contractor |
| portfolio | projects |
| ICP | ideal customer profile |
| session | client interview, sign-in, or onboarding |
| CMS (in a PRD) | website editor, Details, Projects, Media library, or Ads as appropriate |
| profile tab | Profile |
| knob / knobs | option (product); field / variable (technical) |
| `Demo`-prefixed ops; `save` vs `update`; `Projection`/`Read`/`Summary` aliases | one verb (`Create/Update/Get/List/Delete`), one `*Read` response suffix |
| JsonRecord / JsonObjectPayload / `map[string]any` in domain code | typed struct; `jsonb` only at the persistence/API boundary |

## Code naming rules

- Domain words in PRDs, UI, **and in code** when they name that concept. Internal names only
  for a different concept (technical docs and code).
- Unqualified Domain words (`page`, `section`, `slot`) only in that feature’s technical docs and
  package. Other features use the Say (`website page`). Banned synonyms (`slug`, `skeleton`,
  `blueprint`) appear nowhere, including code.
- Database: `snake_case`, plural table names, `tenant_id` on every tenant-owned row, `*_id`
  foreign keys, `snake_case` enum values.
- Go: feature-nested packages (`internal/<domain>/<feature>/`), no package stutter
  (`website/pages`, not `website/websitepages`); the file-size guard applies (see `general-architecture/ci-cd.md`).
- API: `/api/v1/<domain>/...`, domain nouns in paths, `Create/Update/Get/List/Delete` verbs, one
  `*Read` response suffix.
- New terms are added to this glossary first; a PRD never invents a synonym.
