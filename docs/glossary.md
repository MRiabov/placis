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

A website term always includes **website**. Never say page, section, slot, menu, styles, form,
editor, template, draft, preview, or publish as if they were generic.

Do not say **user**, **frozen**, or bare **session**. Say contractor, owner, or visitor.

## Not in this product

These are not Placis concepts. Do not coin them, and do not bring them back from older apps:

- **OnCall** — the predecessor. This product is **Placis**.
- **setup** — say **onboarding**.
- **CRM, quotes, invoices, jobs, workflows, calendar, crew** — not a contractor operations suite.
- **AI receptionist** — not in scope.
- **posting ads** — out of scope; ads finish at **ready to post**.

---

## Domain

Product and user-facing language. PRDs and UI use these words.

### Contractor

The customer: a construction business that Placis researches, builds a website for, and makes ads
for.

Use this exact term in user stories (“As a contractor”) and product prose. Do not say “user”,
“client”, or “customer”.

Distinct from: Owner (the person who claimed), Visitor (someone on the live website).

---

### Owner

The person who claimed. They can edit the website and ads, and they decide research conflicts
during onboarding.

“Owner” is the person, not a synonym for the business.

Distinct from: Contractor (the business).

---

### Visitor

An unauthenticated person looking at the contractor’s live website. A visitor who submits a
website form becomes a Lead.

Distinct from: Contractor, Owner.

---

### Lead

A visitor who got in touch through a website form. Stored for ad attribution and follow-up. This
is not a CRM: no quotes, invoices, jobs, or pipelines.

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
where it came from (the Google Maps listing, the registry record, the client interview, or
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
allowed trades). A trade picks the website template.

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

The kept record of how the business profile changed. Profile history is never overwritten.

Do not say “version”, “versioned”, “snapshot”, or bare “history”.

---

### Research conflict

When the contractor’s answer disagrees with business research, both are shown side by side and
the contractor decides. A research conflict is not an error.

---

### Onboarding

Learning about the business and building its profile: start from a Google Maps listing or
registry record, online research consent, client interview, business research, one business
profile, then an unpublished website and a website preview. It ends at website claim (paid, not
published). Never call this “setup”.

Internal: Onboarding session.

---

### Google Maps listing

The contractor’s Google Maps place, used to start onboarding and pre-fill what we already know.

---

### Registry record

The contractor’s company-registry entry (Companies House, CRO, or a US state registry), used to
start onboarding and pre-fill legal details.

---

### Online research consent

The one acknowledgement, during the client interview, that Placis may collect public information
about the business to prepare the website preview. Not a separate flow. Never say bare
“consent”.

---

### Business research

Finding out about the business from public sources (Maps, the registry, Facebook, their current
website, photos of their work) after online research consent. Business research runs in the
background during onboarding. Never say bare “research”.

---

### Website claim

Pay and activate: sign-in if needed, pay, the website address is reserved. The website stays
unpublished. Website claim does not website-publish.

Do not say “sign up” for this step. Never say bare “claim”.

---

### Sign up

Create the contractor’s account. Happens around website claim if they are not already signed in.
Sign up is identity, not payment.

Distinct from: Website claim.

---

### Unpublished website

The website the owner edits before it is published. Onboarding generates it; website claim leaves
it unpublished; visitors do not see it.

Do not say bare “draft”. An ad in draft is an ad status; say “ad draft” if you must.

---

### Website

The contractor’s site: website pages, website sections, website slots, website forms, website
menu, website styles, built from a website template and the business profile, edited in the
website editor, shown to visitors only after website publish.

---

### Website template

The starting point for a website: the website pages and website sections a typical site of that
trade needs. Never say bare “template”.

Internal: Blueprint.

---

### Website page

One page of the website (home, a service page, contact, legal), with a website page path, title,
and an ordered list of website sections. Never say bare “page”.

---

### Website section

A block on a website page (hero, services, reviews, …), edited through its website slots. Never
say bare “section”.

Internal: Component (the catalog building block a website section is an instance of).

---

### Website slot

A named editable value inside a website section: text, rich text, image, list, link, reviews, or
a project gallery. Never say bare “slot”.

---

### Copy

The words we write for the contractor — headlines, body, calls to action — on the website or in
an ad.

---

### Website copy generation

Writing website copy into the unpublished website from the business profile, in the background
after the skeleton exists. It does not block the website preview. Do not call this “refinement”
in onboarding.

Distinct from: Website assistant (chat after website claim).

---

### Website menu

The site navigation (header and footer). Never say bare “menu”.

---

### Website styles

The look of the website (colors, fonts, and related design controls). Never say bare “styles” or
“design system”.

---

### Website form

A form on the website a visitor can submit. A submission creates a Lead. Never say bare “form”.

Distinct from: Ad lead form (suggested Meta fields on an ad).

---

### Media

The photo library: the contractor’s work, logos, and documents. Only approved media with a media
caption can be used on the website or in ads. The source photo is never overwritten; AI cleanup
makes a separate reviewed variant.

Internal: Asset, File. Do not say “asset” in product docs.

---

### Media caption

The alt text on a media item. A photo needs a media caption and approval before the website or
ads can use it. Never say bare “caption”.

---

### Approved media

A media item the owner has accepted for use. Unapproved photos cannot appear on the website or in
an ad.

---

### Website editor

The website editing screen: website pages, canvas, website menu, and website styles. Details,
Media, and Ads are their own screens beside it, not website page content. Never say bare
“editor”.

---

### Website assistant

The chat (and later voice) that proposes website edits after website claim. It drafts; the owner
decides. The LLM never website-publishes.

Distinct from: Website copy generation (headless, during onboarding, no chat UI).

---

### Website publish

Put the website on the internet: validate the unpublished website, fill placeholders from the
business profile, and make a published copy visitors will see. Website publish is an explicit
action after website claim; onboarding never website-publishes.

Never say bare “publish” or “go live”. Ads do not website-publish; they become ready to post.

Internal: Publication.

---

### Website rollback

Make an earlier published copy the live website again, without deleting profile history.

---

### Live website

What visitors see: the currently published website. Distinct from the unpublished website.

---

### Website address

The URL-safe name of the business’s site (the host people type). Reserved at website claim as the
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
copy, an ad destination, and a suggested ad lead form. Ads are created on demand, never during
onboarding. Placis does not post ads; the first finish line is ready to post.

Internal: Creative set. Do not say “creative set” in product docs or UI.

---

### Ad format

A standard size an ad is produced in: square feed, portrait feed, carousel, or story. Formats
without suitable approved media are omitted, never empty.

---

### Ad destination

An existing published (or scheduled) website page owned by that contractor, that the ad can send
people to. Ads do not get a new landing page.

---

### Ideal customer profile

Who the ad is for. It steers tone, imagery, and the offer. It never appears in the ad copy.
Precise targeting from it is future posting work.

Do not abbreviate to “ICP” in product docs.

---

### Ad lead form

Suggested title and questions for a Meta lead form, carried on the ad. The real Meta form is
created at posting time (future work). Distinct from Website form.

---

### Ad needs review

Ad step: AI-generated or compliance-sensitive content waiting for the owner. An ad cannot become
ready to post from this step without an explicit accept.

Not website publish, and not used as a website status. Never say bare “needs review”.

---

### Ready to post

The approved ad package: validation passed, the owner accepted it, and it can be handed to an ad
platform or downloaded. This is the ads finish line. It is not website publish and it is not
posting.

---

### Ad package

The deliverable of an approved ad: images at each ad format, copy, ad destination, and the
suggested ad lead form. Callers read this package directly; a zip download is only for someone
posting by hand.

Distinct from: Website preview.

---

### Posting

Sending an ad to an ad platform (Facebook / Meta first). Out of scope. Ready to post is not
posting. Website publish is not posting.

---

### Ad platform

Facebook / Meta (first), where an approved ad would later be posted. Do not say “platform” for
Placis.

---

## Internal

Technical names and identifiers. Never in product docs or UI. Domain term in parentheses.

### Tenant

Placis’s tenancy record for one contractor after website claim. One tenant maps to one
Organization. The tenant name is the business.

Domain: (none — never in PRDs). Distinct from: Business profile, Organization.

In code: `tenants`, `tenant_id` on every tenant-owned row.

---

### Organization

The Clerk organization, 1-1 with a Tenant, named after the person (the account owner), not the
business.

Domain: (none — never in PRDs as a synonym for the contractor).

In code: `tenants.clerk_org_id`.

---

### Onboarding session

The persisted onboarding run.

Domain: Onboarding. Do not say “session” in product docs.

In code: `onboarding_sessions`, `internal/onboarding/`.

---

### Client interview

The questions we ask the contractor to fill gaps the Google Maps listing and registry record do
not cover. Text and voice are two channels into the same business profile. Never say bare
“interview”.

Domain: (internal — use this name in technical docs; onboarding copy may describe the
questions).

In code: `text_interview_submissions`; voice tools write the same profile.

---

### Voice

A way to answer the client interview (and later to drive the website assistant). Voice is a
channel, not a separate product and not a separate profile.

---

### Website preview

The unpaid public look at the unpublished website, on a signed link, before website claim.
Website copy generation may still be filling in. Expired website previews cannot be website-
claimed. Never say bare “preview”. Do not use this word for the website editor canvas or for ad
format mocks.

Domain: (internal).

In code: see Preview package.

---

### Preview package

The persisted website preview.

Domain: (none). Internal sibling: Website preview.

In code: `preview_packages`, signed preview token, `internal/onboarding/preview/`.

---

### The CMS

The app where the owner edits marketing: website, ads, Details, and Media. Umbrella name, not a
synonym for the website editor. Never in PRDs as if it were a domain object.

In code: `/cms/website`, `/cms/ads`, Details, Media.

---

### Done-for-you

Placis researches, builds, tweaks, and runs ads for the contractor, delivered into their inbox,
so they can DIY too. Positioning, not a domain object.

---

### DIY

The owner can do the same website edits and ad creation themselves. Positioning, not a domain
object.

---

### Custom domain

The contractor’s own hostname (later), on top of the generated website address.

Domain: (none — never in PRDs as a standalone). Sibling: Website address.

In code: `tenant_domains` with `type=custom`.

---

### Blueprint

A full-site website template for a trade, as catalog data.

Domain: Website template. Never say “blueprint” in a PRD.

In code: `catalog/`, `internal/website/blueprints/`.

---

### Skeleton

The unpublished website right after generate, with placeholders, before website copy generation
finishes. A website preview can be issued on the skeleton. If website copy generation fails, the
skeleton stays.

Domain: Unpublished website (the skeleton is unpublished; not every unpublished website is still
a skeleton).

---

### Placeholder

A blank in the unpublished website that stands for a business detail (`{{business_name}}`,
`{{phone}}`, …). Placeholders stay in the unpublished website and fill from the business profile
at website publish.

---

### Component

A named building block of a website section (`public.hero.image`, …), with a contract for props,
website slots, and design controls.

Domain: Website section (a website section is an instance of a component).

In code: catalog component structs under `catalog/`.

---

### Catalog

Where website templates and components live as versioned JSON, not as database rows.

In code: `catalog/`.

---

### Asset

A row in the media library.

Domain: Media / photo. Never say “asset” in product docs.

In code: `website_assets`.

---

### File

Stored bytes (a photo, a document).

Domain: Media / photo.

In code: `files`; `website_assets.file_id`.

---

### Slug

The URL-safe identifier. Never shown to users as “slug”.

Domain: Website address (host) or Website page path.

In code: `tenants.slug`, path on `website_pages`.

---

### Tenant domain

A hostname attached to a tenant (generated subdomain, or later a custom domain).

Domain: Website address.

In code: `tenant_domains`.

---

### Source refs

Where a detail came from.

Domain: “where a detail came from”. Never say `source_refs` in product docs.

In code: `source_refs`.

---

### Publication

One published copy of the website, written at website publish.

Domain: Website publish, Live website.

In code: `website_publications`.

---

### Published copy

What website publish writes: a kept copy of the website visitors will see. The unpublished
website stays the source of truth; a published copy is never overwritten. Undo a bad website
publish by website rollback.

Never say “frozen”, “materialize”, or “snapshot”.

In code: one `website_publications` row holding `site_manifest`.

---

### Site manifest

The read model inside a publication: website pages → website sections → props. The renderer only
ever reads the active publication.

Domain: Published copy.

In code: `site_manifest`.

---

### Creative set

The persisted ad record.

Domain: Ad. Never say “creative set” in product docs or UI.

In code: `ad_creative_sets` plus `ad_variants`, `ad_copy_variants`, `ad_image_placements`,
`ad_lead_forms`.

---

### Don't say

Never in product/user-facing text or PRD prose.

| Don't say | Say |
| --- | --- |
| setup | onboarding |
| OnCall | Placis |
| frozen / frozen copy | published copy |
| refine / refinement (onboarding) | website copy generation |
| fact / structured facts | detail / information |
| proof | certifications, reviews, or projects as appropriate |
| history (bare) | profile history |
| consent (bare) | online research consent |
| interview (bare) | client interview |
| research (bare) | business research |
| preview (bare) | website preview |
| claim (bare) | website claim |
| draft (bare) | unpublished website |
| template (bare) | website template |
| page / section / slot / menu / styles (bare) | website page / website section / website slot / website menu / website styles |
| form (bare) | website form or ad lead form |
| caption (bare) | media caption |
| editor (bare) | website editor |
| publish / go live (bare) | website publish |
| needs review (bare) | ad needs review |
| source reference / `source_refs` | where a detail came from |
| version / versioned / snapshot | profile history / a published copy |
| state / state machine | steps / where things stand |
| normalize(d) | combine / turn into |
| materialize(d) | make a published copy |
| immutable | kept / never overwritten |
| artifact | what we built (or the specific deliverable) |
| idempotent | safe to retry (tech only) |
| source-first | start from an existing Google Maps listing |
| propose-only | the LLM drafts; the contractor edits and website-publishes |
| blueprint | website template |
| creative set | ad |
| asset | photo / item in Media |
| slug | website address or website page path |
| user | contractor, owner, or visitor |
| client / customer | contractor |
| portfolio | projects |
| ICP | ideal customer profile |
| session (bare) | client interview, sign-in, or onboarding |
| CMS (in a PRD) | website editor, Details, Media, or Ads as appropriate |
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
