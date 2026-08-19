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

**Domain** terms are the business's own words. Use them in PRDs, user stories, and UI.

**Internal** terms are identifiers and technical names. Use them in technical docs and code only.

The glossary defines what terms mean. It never prescribes — no scope, pipeline, validation rules,
or how something is implemented. Those belong in PRDs and technical docs.

A website term always includes **website**. Never say page, section, slot, styles, form, editor,
template, draft, preview, or publish as if they were generic. Header and footer are named
separately; there is no umbrella “menu”.

Closed sets of user-facing labels are **enums**. They live together under Enums, not as their own
terms.

Do not say **user**, **frozen**, or bare **session**. Say contractor, owner, or website visitor.

---

## Domain

Product and user-facing language. PRDs and UI use these words.

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

### Website visitor

An unauthenticated person looking at the contractor’s live website. A website visitor who
submits a website form becomes a Website lead.

Distinct from: Contractor, Owner.

---

### Website lead

A website visitor who got in touch through a website form.

Distinct from: Ad lead.

---

### Ad lead

A person who got in touch through an ad (a Meta lead form).

Distinct from: Website lead.

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

---

### Detail

One piece of information in the business profile (a name, a phone number, a service), including
where it came from (the Google Maps listing, the company registry record, the client interview, or
business research).

Do not say “fact”.

Distinct from: Details (the screen that edits the profile).

Internal: Source refs.

---

### Details

The screen where the contractor edits the business profile. Editing Details changes the website
and the next ad draft.

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
sections.

Use “projects” in product docs and UI. Do not say “portfolio”.

---

### Profile history

The kept record of how the business profile changed.

Do not say “version”, “versioned”, “snapshot”, or bare “history”.

---

### Research conflict

When the contractor’s answer disagrees with business research, both are shown side by side and
the contractor decides. A research conflict is not an error.

---

### Onboarding

Learning about the business and building its profile: start from a Google Maps listing or
company registry record, online research consent, client interview, business research, one
business profile, then an unpublished website and a website preview. It ends at website activation
(paid, not published). Never call this “setup”.

Internal: Onboarding session.

---

### Google Maps listing

The contractor’s Google Maps place, used to start onboarding and pre-fill what we already know.

---

### Company registry record

The contractor’s entry in a company registry (Companies House, CRO, or a US state registry),
used to start onboarding and pre-fill legal details. Never say bare “registry record”.

---

### Online research consent

The one acknowledgement, during the client interview, that Placis may collect public information
about the business to prepare the website preview. Never say bare “consent”.

---

### Business research

Finding out about the business from public sources (Maps, the company registry, Facebook, their
current website, photos of their work) after online research consent. Never say bare “research”.

---

### Website activation

Pay and activate: sign-in if needed, pay, the website address is reserved. The website stays
unpublished.

Distinct from: Sign up, Website publication. Never say “claim” or “website claim”.

In code: `website_activations`.

---

### Sign up

Create the contractor’s account. Happens around website activation if they are not already signed in.
Sign up is identity, not payment.

Distinct from: Website activation.

---

### Unpublished website

The website the owner edits before it is published. Onboarding generates it; website activation leaves
it unpublished; website visitors do not see it.

Do not say bare “draft”. An ad in draft is an Ad states value; say “ad draft” if you must.

---

### Website

The contractor’s site: website pages, website sections, website slots, website forms, header,
footer, website styles, built from a website template and the business profile, edited in the
website editor, shown to website visitors only after website publication.

---

### Website template

The starting point for a website: the website pages and website sections a typical site of that
trade needs. Never say bare “template” or “blueprint”.

In code: `website_template`, website template catalog.

---

### Website page

One page of the website (home, a service page, contact, legal), with a website page path, title,
and an ordered list of website sections. Never say bare “page”.

---

### Website section

A block on a website page (hero, services, reviews, …), edited through its website slots. Never
say bare “section”.

Internal: Website component (a website component catalog building block a website section is an
instance of).

---

### Website slot

A named editable value inside a website section: text, rich text, image, list, link, reviews, or
a project gallery. Never say bare “slot”.

In code: `website_slots`.

---

### Copy

The words we write for the contractor — headlines, body, calls to action — on the website or in
an ad.

---

### Website copy generation

Writing website copy into the unpublished website from the business profile. Do not call this
“refinement” in onboarding.

Distinct from: Website assistant.

---

### Website styles

The look of the website (colors, fonts, and related design controls). Never say bare “styles” or
“design system”.

Internal: Website style catalog.

---

### Website form

A form on the website a website visitor can submit. A submission creates a Website lead. Never
say bare “form”.

Distinct from: Ad lead form (suggested Meta fields on an ad).

---

### Media library

The photo library: the contractor’s work, logos, and documents. Never say bare “media” for this
library.

Internal: Media asset, File. Do not say bare “asset” in product docs.

---

### Media caption

The alt text on a media item. Never say bare “caption”.

---

### Approved media

A media item the owner has accepted for use.

---

### Website editor

The website editing screen: website pages, canvas, header, footer, and website styles. Details,
Media library, and Ads are their own screens beside it, not website page content. Never say bare
“editor”.

---

### Website assistant

The chat (and later voice) that proposes website edits. It drafts; the owner decides.

Distinct from: Website copy generation.

---

### Website publication

Putting the website on the internet: a published website copy website visitors will see.

Never say bare “publish” or “go live”.

Distinct from: Unpublished website, Ad states.

In code: `website_publications`.

---

### Website rollback

Make an earlier published website copy the live website again, without deleting profile history.

---

### Live website

What website visitors see: the currently published website. Distinct from the unpublished website.

---

### Website address

The URL-safe name of the business’s site (the host people type). Reserved at website activation as the
generated subdomain. Never say `slug`.

Distinct from: Website page path.

Internal: Slug (for this host), Tenant domain.

---

### Website page path

The URL-safe path of a website page (for example a service page). Never say `slug` or bare “page
path”.

Distinct from: Website address.

Internal: Slug (for this path).

---

### Ad

What the owner calls one offer or marketing goal — images cropped for each ad format, plus short
copy, an ad destination, and a suggested ad lead form.

Internal: Creative set. Do not say “creative set” in product docs or UI.

---

### Ad destination

An existing published website page owned by that contractor, that the ad can send people to.

---

### Ideal customer profile

Who the ad is for. It steers tone, imagery, and the offer.

Do not abbreviate to “ICP” in product docs.

---

### Ad lead form

Suggested title and questions for a Meta lead form, carried on the ad. Distinct from Website
form.

---

### Ad set

The deliverable of an approved ad: images at each ad format, copy, ad destination, and the
suggested ad lead form. Never say “ad package”.

Distinct from: Website preview. Internal sibling: Creative set (the persisted record).

---

### Ad posting

Sending an ad to an ad platform (Facebook / Meta first).

Distinct from: Ad states (ad ready to post), Website publication. Never say bare “posting”.

---

### Ad platform

Facebook / Meta, where an ad is posted. Do not say “platform” for Placis.

---

## Enums

Closed sets of user-facing labels. Name the set; the values live only here — never as their own
terms.

### Ad states

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

### Ad format

A standard size an ad is produced in.

- **Square feed**
- **Portrait feed**
- **Carousel**
- **Story**

In code: `feed_square` / `feed_portrait` / `carousel` / `story`.

---

## Internal

Technical names and identifiers. Never in product docs or UI. Domain term in parentheses.

### Tenant

Placis’s tenancy record for one contractor after website activation. One tenant maps to one Clerk
organization. The tenant name is the business.

Domain: (none — never in PRDs). Distinct from: Business profile, Clerk organization.

In code: `tenants`, `tenant_id` on every tenant-owned row.

---

### Clerk organization

The Clerk organization, 1-1 with a Tenant, named after the person (the account owner), not the
business. Never say bare “organization”.

Domain: (none — never in PRDs as a synonym for the contractor).

In code: `tenants.clerk_org_id`.

---

### Onboarding session

The persisted onboarding run.

Domain: Onboarding. Do not say “session” in product docs.

In code: `onboarding_sessions`, `internal/onboarding/`.

---

### Client interview

The questions we ask the contractor to fill gaps the Google Maps listing and company registry
record do not cover. Text and voice are two channels into the same business profile. Never say
bare “interview”.

Domain: (internal — use this name in technical docs; onboarding copy may describe the
questions).

In code: `text_interview_submissions`; voice tools write the same profile.

---

### Voice

A way to answer the client interview (and later to drive the website assistant). Voice is a
channel, not a separate product and not a separate profile.

---

### Website preview

The unpaid public look at the unpublished website, before website activation. Never say bare
“preview”. Do not use this word for the website editor canvas or for ad format mocks.

Domain: (internal).

In code: `website_previews`, signed preview token, `internal/onboarding/websitepreview/`.

---

### The CMS

The app where the owner edits marketing: website, ads, Details, and Media library. Umbrella
name, not a synonym for the website editor. Never in PRDs as if it were a domain object.

In code: `/cms/website`, `/cms/ads`, Details, Media library.

---

### Done-for-you / DIY

**Done-for-you:** Placis researches, builds, tweaks, and runs ads for the contractor, delivered
into their inbox. **DIY:** the owner can do the same website edits and ad creation themselves.

Positioning, not a domain object.

---

### Custom website domain

The contractor’s own hostname, on top of the generated website address. Never say bare
“custom domain”.

Domain: (none — never in PRDs as a standalone). Sibling: Website address.

In code: `tenant_domains` with `type=custom`.

---

### Website placeholder

A blank in the unpublished website that stands for a business detail (`{{business_name}}`,
`{{phone}}`, …). Never say bare “placeholder”.

---

### Website component

A named building block of a website section (`public.hero.image`, …), with a contract for props,
website slots, and design controls. Never say bare “component”.

Domain: Website section (a website section is an instance of a website component).

In code: website component catalog structs under `catalog/`.
---

### Website template catalog

Where website templates live. Never say bare “catalog”. In code: `catalog/` (templates).

---

### Website component catalog

Where website section building blocks live. Never say bare “catalog”. In code: `catalog/`
(component contracts).

---

### Website style catalog

Where website style presets live. Never say bare “catalog”. In code: `catalog/` (style presets).

---

### Media asset

A row in the media library. Never say bare “asset” (a website is not this).

Domain: Media library / photo.

In code: `media_assets`.

---

### File

Stored bytes (a photo, a document).

Domain: Media library / photo.

In code: `files`; `media_assets.file_id`.

---

### Slug

The URL-safe identifier. Never shown to users as “slug”.

Domain: Website address (host) or Website page path.

In code: `tenants.slug`, path on `website_pages`.

---

### Tenant domain

A hostname attached to a tenant (generated subdomain, or later a custom website domain).

Domain: Website address.

In code: `tenant_domains`.

---

### Source refs

Where a detail came from.

Domain: “where a detail came from”. Never say `source_refs` in product docs.

In code: `source_refs`.

---

### Published website copy

What website publication writes: a kept copy website visitors will see. The unpublished
website stays the source of truth; a published website copy is never overwritten. Undo a bad
website publication by website rollback.

Never say “frozen”, “materialize”, “snapshot”, or bare “published copy”.

In code: one `website_publications` row holding `website_manifest`.

---

### Website manifest

The read model inside a website publication: website pages → website sections → props. Never say
“site manifest”.

Domain: Published website copy.

In code: `website_manifest`.

---

### Creative set

The persisted ad record.

Domain: Ad. Distinct from: Ad set (the owner-facing deliverable). Never say “creative set” in
product docs or UI.

In code: `ads` plus `ad_variants`, `ad_copy_variants`, `ad_image_placements`,
`ad_lead_forms`.

---

### Don't say

Never in product/user-facing text or PRD prose.

| Don't say | Say |
| --- | --- |
| setup | onboarding |
| OnCall | Placis |
| frozen / frozen copy | published website copy |
| refine / refinement (onboarding) | website copy generation |
| fact / structured facts | detail / information |
| proof | certifications, reviews, or projects as appropriate |
| history (bare) | profile history |
| consent (bare) | online research consent |
| interview (bare) | client interview |
| research (bare) | business research |
| preview (bare) | website preview |
| preview package | website preview |
| claim / website claim | website activation |
| draft (bare) | unpublished website, or ad draft (Ad states) |
| template (bare) | website template |
| page / section / slot / styles (bare) | website page / website section / website slot / website styles |
| menu (as header+footer) | header or footer |
| form (bare) | website form or ad lead form |
| caption (bare) | media caption |
| media (the library) | media library |
| editor (bare) | website editor |
| publish / go live / website publish (bare) | website publication |
| registry record (bare) | company registry record |
| placeholder (bare) | website placeholder |
| catalog (bare) | website template catalog, website component catalog, or website style catalog |
| component (bare) | website component |
| custom domain | custom website domain |
| published copy (bare) | published website copy |
| site manifest | website manifest |
| ready to post (bare) | ad ready to post (Ad states) |
| posting (bare) | ad posting |
| ad package | ad set |
| organization (Clerk) | Clerk organization |
| needs review (bare) | ad needs review (Ad states) |
| source reference / `source_refs` | where a detail came from |
| version / versioned / snapshot | profile history / a published website copy |
| state / state machine | steps / where things stand |
| normalize(d) | combine / turn into |
| materialize(d) | make a published website copy |
| immutable | kept / never overwritten |
| artifact | what we built (or the specific deliverable) |
| idempotent | safe to retry (tech only) |
| source-first | start from an existing Google Maps listing |
| propose-only | the LLM drafts; the contractor edits and does a website publication |
| blueprint | website template |
| skeleton | unpublished website |
| creative set | ad |
| asset (bare) | media asset (internal) or photo / item in the media library (product) |
| slug | website address or website page path |
| user | contractor, owner, or website visitor |
| visitor (bare) | website visitor |
| lead (bare) | website lead or ad lead |
| client / customer | contractor |
| portfolio | projects |
| ICP | ideal customer profile |
| session (bare) | client interview, sign-in, or onboarding |
| CMS (in a PRD) | website editor, Details, Media library, or Ads as appropriate |
| `Demo`-prefixed ops; `save` vs `update`; `Projection`/`Read`/`Summary` aliases | one verb (`Create/Update/Get/List/Delete`), one `*Read` response suffix |

## Code naming rules

- Domain words in product surfaces; internal names in technical docs and code.
- Database: `snake_case`, plural table names, `tenant_id` on every tenant-owned row, `*_id`
  foreign keys, `snake_case` enum values.
- Go: feature-nested packages (`internal/<domain>/<feature>/`), no package stutter
  (`website/pages`, not `website/websitepages`); the file-size guard applies (see `ci-cd.md`).
- API: `/api/v1/<domain>/...`, domain nouns in paths, `Create/Update/Get/List/Delete` verbs, one
  `*Read` response suffix.
- New terms are added to this glossary first; a PRD never invents a synonym.
