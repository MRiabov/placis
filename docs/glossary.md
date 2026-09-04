# Glossary

The **ubiquitous language** of Placis. Read this before naming anything new.

> "By using the model-based language pervasively and not being satisfied until
> it flows, we approach a model that is complete and comprehensible, made up of
> simple elements that combine to express complex ideas." — Eric Evans,
> *Domain-Driven Design*
>
> Domain experts object to terms that are awkward or inadequate to convey the
> domain; developers watch for ambiguity or inconsistency that will trip up the
> design.

## Why

Bad names in a PRD become table, field, route, and UI names; once they ship
they're hard to fix. We name each concept once, here, and reuse the same word
everywhere. If a PRD invents a new word, it's wrong — the word should already be
in this file (or be added here first).

## The rule

**Domain** terms are the business's own words. Use them in PRDs, user stories,
UI, and in code when they name that concept.

**Enums** are closed sets of user-facing labels. They live together under Enums,
not as their own terms.

**Internal** terms are technical names for a *different* concept — not an alias,
synonym, or “In code” stand-in for a Domain term. Use them in technical docs and
code only. If Internal and Domain would name the same concept, drop Internal;
code snake_cases the Domain term. If they are different concepts, keep both,
with Distinct from.

The glossary defines what terms mean. It never prescribes — no scope, pipeline,
validation rules, or how something is implemented. Those belong in PRDs and
technical docs.

In PRDs, user stories, and UI, a website term includes **website**. Never say
page, section, styles, form, editor, template, draft, preview, or publish as if
they were generic. Never say **slot** or **website slot** in PRDs or UI
(Internal). **Top menu** and **footer** are named separately; never say header,
navigation, or bare “menu”. The same idea for ads and onboarding: use the full
glossary term when the feature is not already the context.

In technical docs and code that **clearly already belong to that feature** (a
website architecture doc, `internal/website/`, an ads package), the short word
is acceptable: page, section, slot; copy, variant; session. Do not use the short
word in a mixed or product-facing sentence where it could mean something else.

Do not say **user**, **frozen**, bare **session**, **provider**,
**instantiate**, **population**, **mint**, **fold**, **bytes**, **bag**,
**blob**, **grain**, or **widget**. Say contractor, owner, or website
visitor; name Google Maps, the LLM, or Stripe; say copy the website
template’s pages onto the unpublished website; say create or use for
ephemeral tokens and ids; say live business profile or unpublished
website; say photo, image, file, or binary; name the typed payload; name
the unit (what Persist / Must not names, the Go package, or the grouping);
name the control (crop overlay, Details field, or island).

---

## Domain

Product and user-facing language. Use these words in PRDs, UI, and in code when
they name that concept.

### Contractor

The customer: a construction business that Placis researches, builds a website
for, and makes ads for.

Use this exact term in user stories (“As a contractor”) and product prose. Do
not say “user”, “client”, or “customer”.

Distinct from: Owner (the person who activated), Website visitor (someone on the
live website).

---

### Owner

The person who completed website activation. They can edit the website and ads,
and they decide research conflicts during onboarding.

“Owner” is the person, not a synonym for the business.

Distinct from: Contractor (the business).

---

### Assistant

The chat and voice agent. Contractor copy is **Assistant** on every surface
(CMS, Find / Review / interview, onboarding website editor). Specs still name
three implementations. Product guide and doer where that implementation allows
tools.

Do not say **Website assistant**. Do not say **overlay** for this chrome. Do
not say **guide** in contractor UI.

Distinct from: Website copy generation, Inline AI assistance.

---

#### CMS Assistant

The Assistant after website activation. HTTP `/v1/assistant/…`. Distinct from
Onboarding assistant (Find / Review / interview) and Onboarding website
editor.

---

#### Assistant thread

One persisted `ai.threads` (`thread_kind=cms_assistant`) conversation per tenant
(CMS Assistant and onboarding website editor). The onboarding assistant has its
own `onboarding_assistant` thread; do not call that this thread. Never say
**session** for this.

---

#### Assistant screen context

The complete loaded state of one assistant screen (a CMS screen or an onboarding
step’s screen). Never say **destination context**.

---

#### Assistant screen switch

The owner moved to another assistant screen relative to the last **owner**
request. Clicks during an in-flight run do not interrupt speech; the model is
told on the next owner turn, with the screen they ended on. Never say
**page switch** or **destination switch**.

---

#### Inline AI assistance

The control on **one** value (copy rewrite; image cleanup or generate on that
slot; project title or description). Required **inline AI assistance prompt**.
Not the Assistant, not Voice, not DustOrb. Image generate and cleanup share this
control; they stay different tools (generate = new library item; cleanup =
copy-on-write; project cover is pick-only, no generate). Distinct from **Select
to edit inline AI assistance** (a selected span of copy, not the whole value)
and Ask first **inline diff** (pending hunks).

---

#### Inline AI assistance prompt

The required prompt on inline AI assistance. Empty does not run. Do not shorten
to “inline assistance prompt.”

---

#### Select to edit inline AI assistance

Inline AI assistance that rewrites a **selected span** of copy only. Same
control and required **inline AI assistance prompt**. Do not shorten to “select
to edit.” Distinct from Inline AI assistance with no selection (the whole
value). Not image cleanup or generate (no span). Distinct from Ask first
**inline diff**.

---

#### Follow

The canvas snapping to the website slot the agent is editing (website editor),
or a distinct agent-edited field notice on form-like screens. Default **on**.
The owner cannot turn it off.

Distinct from: Voice agent.

---

#### Voice

A channel: the assistant (CMS and onboarding) and the voice agent. Not a
separate product and not a separate profile.

Distinct from: Voice agent.

---

#### Voice agent

The realtime agent the owner can turn on in the application.

Distinct from: Voice (the channel), Website activation (never say “activate” for
the voice agent).

---

### Business

The construction company we are learning about — name, trade, services, areas,
contact, certifications, reviews, photos.

Distinct from: Business profile (our record of that business).

---

### Business profile

Everything we know about the business, in one place. Onboarding and ETL
transform write it; the website shows it; ads read it. Each detail notes where
it came from. When the contractor’s answer disagrees with business research,
both are shown and they decide. Details, Projects, and Certifications and
reviews are screens on it (the media library is reached from Profile but lives
elsewhere).

Do not say “setup profile”, “facts”, or “structured facts”.

Distinct from: Profile (the left-nav group), Details (the Business details
screen).

---

### Detail

One piece of information in the business profile (a name, a phone number, a
service), including where it came from (the Google Maps listing, the company
registry record, the client interview, or business research).

Do not say “fact”.

Distinct from: Details (the screen that edits the profile).

Internal: Source refs.

---

### Marketing phone

The phone on the website and in ads — where website leads and ad leads call.

Distinct from: Emergency phone (how we reach the owner).

---

### Marketing email

The email on the website and in ads. Never say “website email”. Not the Clerk
account email (identity; not a profile detail).

---

### Emergency phone

How we contact the owner. Unpublished; may be the same number as marketing
phone.

Distinct from: Marketing phone.

---

### Profile

The left-nav group in The CMS that holds Details, Projects, Certifications and
reviews, and the media library. It is not a page and not a record.

Distinct from: Business profile (the data), Details (the Business details
screen), Profile history (how the business profile changed).

---

#### Details

The screen where the contractor edits the Business details subset of the
business profile (who they are, contact, hours, logo, Facebook / Maps links).
Editing Details changes the website and the next ad draft. In Profile, Details
is labeled **Business details**.

Distinct from: Profile (the nav group), Business profile (the record).

---

#### Trade

The main type of work the business does. Open text (not a closed list).

---

#### Service

A named thing the business offers, shown on the website and available as an ad
focus.

---

#### Service area

A locality the business covers. The owner picks a place on Google Maps.

---

#### Certification

A trade accreditation the business holds, edited on Certifications and reviews.

Distinct from: Projects (photos of their work).

---

#### Projects

A Project is a named job with title, description, and cover, shown on the
website and edited at Profile. It is normally a **past** job (work already
completed). Distinct from a media library item that happens to show that
work (a photo is not itself a Project).

Use “projects” in product docs and UI. Do not say “portfolio”.

---

#### Reviews

What people wrote about the business: who wrote it, the rating, and the text.
Origins: the Google Maps listing, a Facebook business page, or the owner. Filled
during onboarding and edited on Certifications and reviews (headings:
**Top reviews**, **All reviews**, **Archive**). **All reviews** is the non-top
`in_pool` cards. Each **reviews website section** shows its own ordered list
from `in_pool` reviews (the review citation, not the full body when those
differ). Ads use **top reviews**.

Distinct from: Ad needs review (an Ad state), Website preview, Top reviews (the
ads featured list), Review citation (the short text shown from a review).

---

#### Top reviews

The ordered list of reviews the owner pinned on Certifications and reviews.
Earlier in the order is more featured. Ads use this list. It is **not** what
every reviews website section shows.

Distinct from: Reviews (**All reviews** on Certifications and reviews), the
ordered reviews on one reviews website section.

---

#### Review citation

The short text taken from a review for cards, the website, and ads — not a
paraphrase of the body. Never say bare “citation” for this.

Distinct from: where it came from (a detail’s origin). Distinct from Reviews
(the full body) and Top reviews (the ads featured list) or the reviews on one
website section.

---

#### Profile history

The kept record of how the business profile changed.

Do not say “version”, “versioned”, or “snapshot” for this. Distinct from:
Profile (the nav group), Website version (published checkpoints of the website),
Website edit history (unpublished website edits).

---

#### Media library

The photo library: the contractor’s work and logos. Never say bare
“media” for this library. Reached from Profile. The website editor attaches from
the same library.

Internal: Media asset, File. Do not say bare “asset” in product docs.

---

#### Media caption

The classifier text on a media item (ads generate and website 03 slot
match). Internal; not owner HTTP and not a `/cms/media` field. Never
say bare “caption”.

---

#### Approved media

A media item the owner has accepted for use.

---

#### Supplied by

Who originated this picture in the media library: the owner, research, or AI.

Distinct from: Source refs (where a detail came from). Never say “provenance”.

---

### Research conflict

When the contractor’s answer disagrees with business research, both are shown
side by side and the contractor decides. A research conflict is not an error.

---

### Google Maps listing

The contractor’s Google Maps place, used to start onboarding and pre-fill what
we already know.

Listing is this Google Maps term only. Never say Instagram listing or Facebook
listing.

---

### Instagram profile

The contractor’s Instagram account (handle / user). Distinct from: Google Maps
listing, Business profile.

---

### Instagram post

One post on that Instagram profile.

---

### Company registry record

The contractor’s entry in a company registry (Companies House, CRO, or a US
state registry), used to start onboarding and pre-fill legal details. Never say
bare “registry record”.

---

### Copy

The words we write for the contractor — headlines, body, calls to action — on
the website or in an ad.

Distinct from: Marketing statement (an assertion in those words that must be
backed by a detail).

---

### Marketing statement

An assertion we make in marketing (on the website or in an ad) that must be
backed by a detail — reviews, ratings, guarantees, prices, years in business,
and the like.

Distinct from: Copy (the words), Website activation (never “website claim”),
sign-in identity claims (auth only).

Never say “marketing claim”, “advertising claim”, or bare “claim” for this.
Never say **source-backed** (contractor wording, PRDs, technical specs). Prefer
**backed by a detail**, or name the origin (Google Maps listing, Facebook post,
and the like).

---

### Placis website

Placis’s own site. Never say “our site”, “our website”, or “public site” for
this.

Distinct from: Website (the contractor website). Say contractor website when the
contrast is needed.

---

### Onboarding

Getting to know the contractor and selling to them. Includes business lookup,
business research, client interview, unpublished website, and website preview.
Ends at website activation. Never call this “setup”. Client interview is asking
them, not public-source research.

Distinct from: Onboarding session (the persisted run).

---

#### Onboarding assistant

Find / Review / interview Voice only (`/v1/onboarding/assistant/…`). Distinct
from CMS Assistant, from Onboarding website editor, and from client interview
(the field-filling step, not an agent writer). Contractor copy is **Assistant**.
Architecture files may still say guide.

---

#### Onboarding website editor

The unpaid website editor on `/onboarding/preview-and-edit/`. Spec label;
contractor copy is **Assistant**. HTTP
`/v1/onboarding/website/editor/…` and `/v1/onboarding/website/assistant/…`.
Distinct from CMS Assistant, from
Onboarding assistant, and from the CMS website editor.

---

#### Business lookup

On Find: submit the picked company registry record and/or Google Maps listing to
start onboarding. Distinct from typeahead search, from business research, from
Review, from picking a research conflict. Never say Confirm for this command.

---

#### Browser safety id

A UUID the browser creates once that groups Find business lookups for the
lookup cap. Distinct from: Onboarding session token. Not authentication.

In code: `browser_safety_session_id`. Go: `BrowserSafetySessionID`.

---

#### Online research consent

The one acknowledgement, on find at business lookup, that Placis may collect
public information about the business to prepare the website preview. Not a
client interview question. Never say bare “consent”.

---

#### Business research

Research about the business from public sources. Onboarding 02 is the first
run; Monday / Wednesday / Friday is the same research on a schedule. Does not
include the client interview. Never say bare “research”.

Distinct from: Client interview (asking them, not public sources).

---

#### Sign up

Create the contractor’s account. Happens around website activation if they are
not already signed in. Sign up is identity, not payment.

Distinct from: Website activation.

---

#### Website activation

Pay and activate: sign-in if needed, pay. The website stays unpublished.

Distinct from: Sign up, Website publication. Never say “website claim”.

---

#### Website preview

The unpaid website editor at `/onboarding/preview-and-edit/` where they see the
unpublished website and may buy. Never say bare “preview”. Do not use this
word for the CMS website editor or for ad format mocks.

Distinct from: Unpublished website, Website activation, Website preview link,
Live website, Preview website address (the optional R2 host).

---

#### Website preview link

The shareable URL of the preview website address
(`{website_prefix}.preview.placis.com`) after they share. Anyone who has it can
open the host. Never say “signed website preview”.

Distinct from: Website preview (the editor), Preview website address (the
host), Signed URL.

---

### Website

The contractor’s site: website pages, website sections, website forms, top menu,
footer, website styles, built from a website template and the business profile,
edited in the website editor, shown to website visitors only after website
publication.

Say **contractor website** when you need to tell it apart from Placis website.

Distinct from: Placis website.

---

#### Unpublished website

The website after copying the website template’s pages onto it, before
website publication.
Website visitors do not see it.

Do not say bare “draft”. An ad in draft is an Ad states value; say **ad draft**.
A project in draft is a Project states value; say **project draft**. The
unpublished website is not a draft.

Distinct from: Website preview (the unpaid editor), Live website.

---

#### Live website

What website visitors see: the currently published website. Distinct from the
unpublished website, Published website copy (the content), and Placis website
(whose site is still the contractor’s).

---

#### Website template

The starting point for a website: one id in the website template catalog.
Copying yields home, about, named service pages, contact, and privacy policy.
Never say bare “template” or “blueprint”.

---

#### Production-ready website template

A website template with `production_ready=true`. Website 01 may pick it.
Internal, stub, and predecessor source-backed dumps are not 01 picks.
Predecessor per-page `production_selectable` is not this flag.

---

#### Website page

One page of the website (home, about, a service page, contact, legal), with a
website page path, title, and an ordered list of website sections. Never say
bare “page” in PRDs or UI.

---

#### Website page path

The URL-safe path of a website page (for example a service page). Never say
`slug` or bare “page path” in PRDs or UI.

Distinct from: Website address, Website prefix.

---

#### Website section

A block on a website page (hero, services, reviews, …). Never say bare “section”
in PRDs or UI.

Internal: Website component (a website component catalog building block a
website section is an instance of), Website slot (a named editable value on that
website section).

---

#### Website style

One look of the website: one website style catalog preset, or the currently
applied look. Never say bare “style” or “theme” in PRDs or UI.

Distinct from: Website styles (more than one, or the list of looks in the
website editor).

---

#### Website styles

More than one website style, or the list of looks in the website editor. Never
say bare “styles” or “design system” in PRDs or UI.

Internal: Website style catalog.

---

#### Website form

A form on the website a website visitor can submit. A submission creates a
Website lead. Never say bare “form” in PRDs or UI.

Distinct from: Ad lead form (suggested Meta fields on an ad).

---

#### Website editor

The screen where the owner edits the unpublished website. Never say bare
“editor” in PRDs or UI.

Details, Projects, Certifications and reviews, the media library, and Ads are
not this screen.

---

#### Editing panel

Retired. Do not use for the current website editor. **Content** is the workspace
list that opens when the owner clicks a website section or image on the canvas.
Never say inspector.

Distinct from: Canvas (the website page), Workspace (website pages / SEO /
website styles / website versions).

---

#### Top menu

The bar at the top of the website. Never say header, navigation, or bare “menu”.
Edited in the website editor, not Details.

Distinct from: Footer, Website section. Top menu is not a website page. Distinct
from the Placis website.

---

#### Footer

The footer of the website. Never say navigation or menu for this. Edited in the
website editor, not Details.

Distinct from: Top menu, Website section. Distinct from the Placis website.

---

#### Website assistant

Retired. Do not use. The product term is **Assistant**. Website-editor tool
names live under Internal (**website editor tools**).

---

#### Website assistant plan

Text the assistant shows on the website editor before it continuously applies.
Confirmation text, like asking Cursor for a plan. Nothing is written until the
owner accepts that text (then Apply / Reject still follow Ask first or Instant
apply).

Never say “live markdown plan” or “handoff boundary”.

Distinct from: Assistant (the chat), continuous workflow (no plan text), instant
apply (no Apply / Reject), Ask first (Apply / Reject), Website copy generation
(continuous + instant apply, no chat).

---

#### Ask first

The assistant shows Apply / Reject before an edit lands. Opposite of Instant
apply.

Distinct from: Instant apply, Website assistant plan, Inline AI assistance
(one-value control; not Apply / Reject hunks), Select to edit inline AI
assistance (span rewrite, not pending hunks). The **inline diff** on Ask first
is the pending canvas hunks, not the inline AI assistance prompt.

---

#### Select website template

Pick a website template and website styles for this contractor.

Distinct from: Copy the website template’s pages onto the unpublished
website (the write), Website template (the starting point).

---

#### Copy the website template’s pages onto the unpublished website

Write unpublished website pages and website sections from a website
template and the business profile. Website placeholders stay. Never say
instantiate, population, generate, or apply the website template for this.

Distinct from: Select website template (the pick), Website copy generation
(the words), Resolve website placeholders, Website template (the starting
point), Copy (the words).

---

#### Resolve website placeholders

Fill `{{…}}` from the live business profile. Not copying template pages.
Not Go rewriting unpublished slots.

Distinct from: Copy the website template’s pages onto the unpublished
website, Website copy generation, Website publication (HTML snapshot after
resolve).

---

#### Website copy generation

Automatic writing of website copy into the unpublished website from the
business profile. Do not call this “refinement” in onboarding. Never say
generate without “website copy”.

Distinct from: Assistant, Copy the website template’s pages onto the
unpublished website (the unpublished website structure).

---

#### Website publication

Putting the website on the internet. Distinct from: Unpublished website,
Published website copy (the content), Live website (what visitors see), Ad
states.

Owner UI is the verb **Publish**. Specs still say website publication. Never say
“go live”.

---

#### Website version

One kept checkpoint of the whole website. Website versions are the history of
the website. Website publication makes a website version the live website.
Website rollback makes an earlier website version live.

Distinct from: Profile history (the business profile), Website edit history
(unpublished website edits), Unpublished website (what the editor mutates),
Website publication (the act), Published website copy (the content of the live
website version), Live website.

Do not say “website history”, “website page version”, or “website page history”.
Never say bare “version” for the business profile.

---

#### Website edit history

The kept record of how the unpublished website changed, not published
checkpoints.

Distinct from: Website version (published checkpoints of the whole website),
Profile history (the business profile), audit events.

Do not say “website history”.

---

#### Website rollback

Make an earlier website version the live website again, without deleting profile
history.

Distinct from: Website edit history.

---

#### Website address

The hostname they supply (`acme.ie`), which we publish under. Never say “custom
domain” or “custom website address”.

Distinct from: Preview website address (our `preview.placis.com` host), Website
prefix, Website page path.

---

#### Preview website address

Our host for their site: `{website_prefix}.preview.placis.com`. Optional while
unpaid: it exists after they **share** from the website preview (R2 `latest/`
with the website-activation strip), or after 08 if they paid without sharing.
After website activation it is still a preview website address and the live
default until they attach a website address. Never call the host “website
preview”. Never say “website preview host”. Apex `preview.placis.com` (no
prefix) is not a contractor site.

Distinct from: Website address (`acme.ie`), Website prefix, Website preview
(the editor).

---

#### Website prefix

The reserved DNS label for their site (`acme-roofing-dublin`). Not a URL. Never
renamed. Never say `slug` or `website-prefix`.

Distinct from: Website address, Preview website address, Website page path.

---

#### Website visitor

An unauthenticated person looking at the contractor’s live website. A website
visitor who submits a website form becomes a Website lead.

Distinct from: Contractor, Owner.

---

#### Website lead

A website visitor who got in touch through a website form.

Distinct from: Ad lead.

---

### Ad

What the owner calls one offer or marketing goal in one ad format.

Distinct from: Creative set (images + text), Ad posting (running a paid ad), Ad
set (the deliverable). Never say “creative set” in product docs or UI.

---

#### Ad destination

An existing published website page owned by that contractor, that the ad can
send people to.

---

#### Ideal customer profile

Who the ad is for. It steers tone, imagery, and the offer.

Do not abbreviate to “ICP” in product docs.

---

#### Ad lead form

Suggested title and questions for a Meta lead form, carried on the ad. Distinct
from Website form.

---

#### Ad set

The deliverable of an approved ad: images at this ad's format, copy, and the
suggested ad lead form. Never say “ad package”.

Distinct from: Creative set (images + text), Website preview.

---

#### Ad format preview

Facebook and Instagram placement mocks of this ad’s one format, shown in Review
as the owner types. Distinct from: Website preview. Not the preview an ad
platform shows at ad posting time.

---

#### Ad posting

Sending an ad to an ad platform (Facebook / Meta first) — a running paid ad.

Distinct from: Creative set, Ad states (ad ready to post), Website publication.
Never say bare “posting”.

---

#### Ad platform

Facebook / Meta, where an ad is posted. Do not say “platform” for Placis.

---

#### Ad lead

A person who got in touch through an ad (a Meta lead form).

Distinct from: Website lead.

---

### Billing

Usage credit, subscription price, and the Usage & billing screen. The owner
spends usage credit on billed work in the website editor, Ads, and Voice.

Distinct from: Website activation (the one-time pay).

---

#### AI vendor cost

What OpenRouter / the model / image vendors invoice us (token and per-image
lines). **Our cost** is that invoice. **Their cost** is ×5 on Usage & billing.

Do not say **meter**.

Distinct from: AI voice vendor cost.

---

#### AI voice vendor cost

What xAI invoices for Voice: audio minutes (both directions) plus text
`conversation.item.create` fees. **Our cost** is that invoice. **Their cost** is
×5 on Usage & billing.

Do not say **meter** / **audio meter**.

Distinct from: AI vendor cost.

---

#### Our cost

The AI vendor cost or AI voice vendor cost invoice.

Distinct from: Their cost.

---

#### Their cost

×5 our cost, shown on Usage & billing.

Distinct from: Our cost.

---

#### Usage credit

The credit the owner spends on billed work (assistant text, image
generate/cleanup, ads generate, Voice). Shown in **USD** (their cost), not a
unitless count. The subscription includes a monthly amount; they may also buy
**extra usage credit**. One pool. When it is empty they are out of usage
credit.

Do not say “generation hop”, “hop”, “AI credit”, or bare “credit”.

Distinct from: Extra usage credit (a purchase that adds to this pool),
Subscription price (the monthly fee), Website activation (the one-time pay).

In code: `usage_credit` (error `usage_credit_exhausted`).

---

#### Extra usage credit

Usage credit the owner buys in addition to the amount included in the
subscription. It adds to the same usage credit pool.

Distinct from: Usage credit (the pool), Subscription price.

---

#### Subscription price

The monthly amount for the current subscription tier. The subscription includes
usage credit. If they stop paying, the website is unpublished and they cannot
Publish until they pay again.

Do not say “retainer”. Never say “subscription shelf”.

Distinct from: Website activation (one-time pay), Usage credit, Extra usage
credit, Placis Pro plan / Placis Pro Plus plan / Placis Pro Max plan /
Enterprise plan (the tiers).

---

#### Placis Pro plan

The basic self-serve subscription tier. Never say bare **Placis Pro** or
**Pro**.

Distinct from: Placis Pro Plus plan, Placis Pro Max plan, Enterprise plan,
Subscription price, Usage & billing.

---

#### Placis Pro Plus plan

The middle self-serve subscription tier. Never say bare **Placis Pro Plus** or
**Pro Plus**.

Distinct from: Placis Pro plan, Placis Pro Max plan, Enterprise plan.

---

#### Placis Pro Max plan

The highest self-serve subscription tier. Never say bare **Placis Pro Max** or
**Pro Max**.

Distinct from: Placis Pro plan, Placis Pro Plus plan, Enterprise plan.

---

#### Enterprise plan

The sales-led subscription tier for teams. Not chosen on the self-serve grid;
contact sales. Never say bare **Enterprise**.

Distinct from: Placis Pro plan, Placis Pro Plus plan, Placis Pro Max plan.

---

#### Usage & billing

The screen that shows the current subscription tier, subscription price,
remaining usage credit, buying extra usage credit, **Change plan**, **Cancel
subscription**, and **one bar** of this period’s usage credit (spent vs
remaining; spent colored Voice / Image / text edits). Not public marketing
pricing. Reached from the account menu (user icon), not from the left nav.

Distinct from: Website activation (the pay-and-activate step), Profile (the
left-nav group), Pricing (the Placis website page).

---

#### Pricing

The Placis website page that shows subscription tiers and subscription prices.
Not Usage & billing. Not website activation.

Distinct from: Usage & billing (the screen in the application), Placis website
(the whole site).

---

## Enums

Closed sets of user-facing labels. Name the set; the values live only here —
never as their own terms.

### Ad

#### Ad states

Where an ad stands. Two closed sets of labels:

While creating the ad:

- **Ad draft** — being created or edited.
- **Ad needs review** — AI-generated or compliance-sensitive content waiting for
  the owner.
- **Ad ready to post** — the owner accepted it; it can be handed to an ad
  platform or downloaded.
- **Archived** — no longer offered, kept as a past ad.

On an existing ad:

- **Draft**
- **Creative ready** — the ad is done.
- **Published** — used once ad posting exists. Distinct from Website
  publication.
- **Archived**

Never say bare “draft”, “needs review”, or “ready to post”.

---

#### Ad format

A standard size an ad is produced in.

- **Square feed**
- **Portrait feed**
- **Carousel**
- **Story**

Square feed, Portrait feed, and Carousel are **posts**. Story is **stories**.
One ad is one format — a single creative is a single ad. Feed is one photo; a
carousel is several cards; a story is almost always one image.

---

### Projects

#### Project states

Where a project stands:

- **Project draft** — created or edited; not in the next website publication
  bake until Approve.
- **Active** — ready for the next website publication bake (`projects[]` /
  `{{projects.*}}`).
- **Archived** — left the list; dropped from unpublished project-gallery
  website sections.

Never say bare “draft”. Do not copy ads **ad needs review** / **ad ready to
post** onto projects. Unarchive returns a **project draft**, not silently
active.

---

### Billing

#### Subscription tier

Closed owner-facing labels: **Placis Pro plan**, **Placis Pro Plus plan**,
**Placis Pro Max plan**, **Enterprise plan**.

In code: `pro`, `pro-plus`, `pro-max`. Enterprise plan is not a self-serve plan
id.

---

#### Usage category

How usage credit spend is shown on Usage & billing: **one bar**. The bar is the
period total; filled is spent (their cost); filled segments are Voice / Image /
Text by color. Owner copy for Text is **text edits**. Not our cost.

In code: `voice`, `image`, `text`. Nested image/ads work during Voice counts as
Image or Text, not Voice.

---

## Internal

Technical names for concepts that are **not** a Domain term. Never in product
docs or UI. If Internal and Domain would name the same concept, drop Internal;
code snake_cases the Domain term.

### Tenant

Placis’s tenancy record for one contractor. Created at business lookup as an
**unactivated** tenant; website activation makes it an **activated** tenant. One
tenant maps to one Clerk organization (1-1), including while unactivated after
org attach. The tenant name is the business. Never in PRDs.

Domain: (none — never in PRDs). Distinct from: Business profile, Clerk
organization.

---

### River job kind

The `Kind()` string River runs (schema `jobs`). Never bare **kind**. Never in
PRDs or UI. Distinct from: ETL run kind (the run, not the job);
thread kind.

In code: River `Kind()`. Catalog: [jobs.md](general-architecture/jobs.md)
`## Jobs`.

---

### River workflow

A named sequence of River job kind rows in [jobs.md](general-architecture/jobs.md) `## Workflows`. Never in
PRDs or UI. Not a paid River workflows module. Distinct from: assistant
continuous workflow; Cloudflare Workflows.

---

### Clerk organization

The Clerk organization, 1-1 with the data tenant (including while
unactivated after attach). Named and badged as the **business**, not the
owner. Never say bare “organization”.

Domain: (none — never in PRDs as a synonym for the contractor).

---

### AI use ledger

The record of usage credit granted, purchased, and spent on billed work. Never
in PRDs. Domain: (none). Distinct from: Usage credit, Extra usage credit.

In code: `ai_use_ledger`.

---

### BillUsageMode

How a paid external call treats usage credit: debit **their cost**,
skip that debit, or debit only when remaining is not empty and still
run when it is empty. Any external spend (AI vendor, ETL fetch, later
paid APIs). Never in PRDs or UI.

In code: `BillUsageMode`. Argument: `bill_usage`. Values: `billed`,
`unbilled`, `bill-allow-out-of-balance`. Omit / zero is `billed`.

Distinct from: Usage category; AI use ledger.

---

### Feature flag

A named bool that turns a shipped behavior on or off for the whole
`cmd/api` process. Distinct from secrets and from usage credit. Never
in PRDs or UI.

In code: field on `internal/config`. Named flags:
[feature-flags.md](general-architecture/feature-flags.md).

---

### Knowledge base registry

The YAML that names which owner-facing markdown files belong to one assistant’s
knowledge base (`cms_knowledge_base_registry.yaml` /
`onboarding_knowledge_base_registry.yaml`). Both list the shared product
glossary (`internal/knowledge/product_glossary.md`). Never in PRDs or UI. Never
say **catalog** for this YAML.

Distinct from: Assistant screen context; website style catalog.

---

### Assistant

Internal names for the CMS Assistant (tool registries and prompt-assembly
notices). Never in PRDs or UI.

---

#### Website editor tools

The named tool registry for the website editor assistant screen. Not a product
term. Not “website assistant.”

---

#### Ads tools

The named tool registry for the Ads assistant screen. Not a product term. Full
CMS `tools=` is always loaded; this is not a swapped list on navigation.

---

#### Per-screen tools

Internal. The named tool registry for that assistant screen. Full CMS `tools=`
is always loaded; the **allowed set** is the execution gate. Do not swap
`tools=` on assistant screen switch.

Distinct from: Always executable.

---

#### Always executable

Internal. The CMS tools Go will execute on **any** assistant screen. Not “the
only tools the model sees” (full `tools=` is always loaded). Never say
**General** for this subset.

Distinct from: Per-screen tools (screen-gated allowed set), Website editor
tools, Ads tools.

---

#### Voice transcription, wrap-up, reject notice

A named slice of CMS Assistant text prompt assembly for the model this turn:
**wrap-up notice**, **reject notice**, **Voice transcription notice**. Never in
PRDs or UI. Never say **caveat**.

Distinct from: Follow (owner-facing field notice), CMS **notification** chrome,
Voice connection **instructions**, the assembled prompt.

---

#### Thread kind

Which conversation an `ai.threads` row is (`cms_assistant`,
`onboarding_assistant`, `ads_generate`, and the other closed values). Never
bare **kind**. Distinct from: Thread item kind.

In code: `ai.threads.thread_kind`. Go: `ThreadKind`.

---

#### Thread item kind

Whether a thread item is owner, assistant, thinking, or tool summary. Never
bare **kind**. Distinct from: Thread kind.

In code: `assistant.thread_items.thread_item_kind`.

---

#### Tool revision kind

Whether an `ai_generation_tool_revisions` row is a tool or a skill. Never bare
**kind**.

In code: `ai.ai_generation_tool_revisions.tool_revision_kind`.

---

### Signed URL

A time-limited file download URL. Distinct from: Website preview link. Never
call a website preview signed.

---

### The CMS

The app where the owner edits marketing: website, ads, Profile (Details,
Projects, Certifications and reviews, Media library), and Usage & billing
(account menu). Umbrella name, not a synonym for the website editor. Never in
PRDs as if it were a domain object.

---

### Loading placeholder

The shaped stand-in shown **in** a field, row, or slot while that value is still
loading. Same layout as the loaded UI. Not a spinner that replaces a whole card,
panel, canvas, or screen. Not the unpublished website (never say “skeleton” for
either). Distinct from: Website placeholder (`{{…}}` in unpublished copy).

---

### Done-for-you / DIY

**Done-for-you:** Placis researches, builds, tweaks, and runs ads for the
contractor, delivered into their inbox. **DIY:** the owner can do the same
website edits and ad creation themselves.

Positioning, not a domain object.

---

### Media asset

One item in the media library. Never say bare “asset” (a website is not this).
Distinct from: Media library (the library), File (the stored photo or document),
Supplied by (who originated the picture), Media asset classification
(caption / photo kind / visual issues).

---

#### Media asset classification

One classifier output for a media library item: media caption,
photo kind, visual-issue severities, `content_hash`, `algorithm`,
`schema_revision`. Many rows per item; current is the latest
`created_at`. No pointer on the media library item. Distinct from:
Media asset (the item), Photo kind (the `logo` / `photo` label on a
classification row).

In code: `media_asset_classifications`.

---

#### Photo kind

The label on a media asset classification: **logo** (a wordmark) or
**photo** (everything else). Null until `DescribeImage` inserts the
first row. Never `hero` / `project` / `service` / `founder` /
`person`. Never bare **kind**. Distinct from: Imported media kind,
Media asset classification (the classification row).

In code: `media_asset_classifications.photo_kind` (latest join).

---

### File

The stored photo or document. Distinct from: Media asset (the media library
item), Image thumbnail (the compressed grid-tile copy of that photo).

---

### Image thumbnail

The small compressed WebP of **that media library item’s file**, used as CMS /
ads / Details / Projects **grid tiles**. Never say **preview** for this (website
preview, preview website address, ads format preview, and website image render
are other things). Distinct from: File (the original), Media asset (the library
item).

In code: `media_assets.thumbnail_file_id`, HTTP `thumbnail_url`,
`WriteImageThumbnail`.

---

### Source refs

Where a detail came from (for example marked as their Google Maps listing).
Distinct from: Detail (the information itself), Supplied by (who originated a
picture). Never say `source_refs` in product docs.

---

### Provider

Not a term. Name Google Maps, the LLM, Stripe, or fakes in tests. Never use this
word for a dependency.

---

### Business research

Domain business research is implemented by ETL. First useful public-source write
is the ETL fast extract SLO; the rest is the ETL slow extract SLO. Never in PRDs
or UI.

Distinct from: Business research (Domain), client interview.

---

### ETL

Extract **and** transform: how business research fetches public contractor
sources and writes the business profile. Not extract-only. Not a second
activity. Never in PRDs or UI. Distinct from: Business research (the activity).

In code: `internal/etl/` (`extract/` + `transform/`), Postgres schema `etl`.

---

#### Enqueue

One `StartRun` call. Several ETL runs (one per ETL run kind) share
`enqueue_id`. Distinct from: ETL run (one ETL run kind).

In code: `etl.runs.enqueue_id`.

---

#### ETL run

One extract of **one ETL run kind** for one tenant (the Google Maps extract, the
Facebook extract, the Instagram extract). River retries are the same run.
Distinct from: Business research (onboarding 02 starts several ETL runs),
Enqueue (one `StartRun`), ETL run kind (the closed value on the run).

In code: `etl.runs`.

---

#### ETL run kind

Which ETL run this is: Google Maps listing, Facebook, Instagram, website crawl,
trade registry, or web search. Never `directory`, `review`, or `photo` as a
`StartRun` ETL run kind. An ETL run kind starts when it has the details it
needs. The ETL run kind attaches to the run, not to ETL and not to the River job
kind. Never bare **kind**. Distinct from: ETL source kind (the run vs the saved
extract we point at later; some names overlap); River job kind
(`google_maps_listing_extract`, not the run kind alone).

In code: `etl.runs.etl_run_kind`. Go: `ETLRunKind`. Unique
`(enqueue_id, etl_run_kind)`. Write `etl_run_kind=google_maps_listing`.
Packages `extract/<etl_run_kind>/`.

---

#### ETL source kind

What kind of saved extract a “where this came from” row is (Google Maps listing,
listing review, Facebook or Instagram profile or post, website crawl extract or
HTML, company registry record, or trade registry record). Never bare **kind**.
Distinct from: ETL run kind; Source refs.

In code: `etl.sources.source_kind`.

---

#### Imported media kind

Which extract origin an imported media library item came from. Never bare
**kind**. Distinct from: Photo kind.

In code: `etl.imported_media.imported_media_kind`.

---

#### ETL fast extract

The first cheap response (Google Maps Details, or an ETL fast crawl). p95 ≤ 5s.
Distinct from: ETL slow extract.

---

#### ETL slow extract

The remainder after the ETL fast extract (Maps scrape of further reviews and
photos, or an ETL slow crawl). Fills the rest progressively over about 60s.
Distinct from: ETL fast extract.

---

#### ETL fast crawl

The first-response pass of website crawl. An ETL fast extract for that ETL run
kind. SLO ~1s. Distinct from: ETL slow crawl.

---

#### ETL slow crawl

The remainder extract of website crawl after the homepage: remaining HTML URLs
in parallel (not a serial tens-of-seconds walk). An ETL slow extract for that
ETL run kind. Distinct from: ETL fast crawl.

---

### Onboarding

#### Onboarding session

The persisted onboarding run. Distinct from: Onboarding (the process), Resume.
Do not say “session” in product docs.

---

#### Wait teaser

The `/onboarding/preview` screen after copying the website template’s pages.
It waits until the **home** website page has automatic website copy generation,
or until the wait cap. Distinct from: Website preview (the editor after
wait-end).

---

#### Wait cap

The ~15s bound on the wait teaser if the home website page is not done yet.

---

#### Wait-end

When the wait teaser stops: onboarding session `preview_and_edit` and
`/onboarding/preview-and-edit/`. Copy-done is the home website page finished;
other website pages may still be generating.

Distinct from: Wait teaser (the waiting screen), Website preview (where they
land).

---

#### Resume

Continuing an in-progress onboarding session on the same browser. Never say
“resume token”.

Distinct from: Onboarding session (the persisted run), Website preview link.

---

#### Client interview

The questions we ask the contractor to fill gaps the Google Maps listing and
company registry record do not cover. Text (04a) is the v1 writer into the
business profile. Voice is not a v1 writer into the profile (04b is out). Never
say bare “interview”. Distinct from: Business research (public sources, not
asking them).

Domain: (internal — use this name in technical docs; onboarding copy may
describe the questions).

---

#### Client interview submission kind

Whether a client interview submission is autosave or final. Never bare **kind**.

In code: `onboarding.client_interview_submissions.submission_kind`.

---

### Website

#### Website placeholder

A blank in the unpublished website that stands for a business detail
(`{{business_name}}`, `{{marketing_phone}}`, …). Never say bare “placeholder”.
Distinct from: Loading placeholder (UI while a field loads).

---

#### Website component

A named building block of a website section, with a contract for what that block
can hold. Never say bare “component”.

Domain: Website section (a website section is an instance of a website
component).

---

#### Website slot

A named editable value inside a website section (text, image, list, and the
like). Never in product docs or UI — owners see heading, text, or image on a
website section.

Domain: Website section.

---

#### Menu node kind

Whether a top menu or footer node is a page, a text heading, or a URL. Never
bare **kind**.

In code: JSON `menu_node_kind` on `website.menus` trees.

---

#### Website template catalog

Where website templates live. Never say bare “catalog”.

---

#### Website component catalog

Where website section building blocks live. Never say bare “catalog”.

---

#### Website style catalog

Where website style presets live. Never say bare “catalog”.

---

#### Published website copy

The content of the live website: text, images, and arrangement.

Distinct from: Website publication (the act), Website version (the kept
checkpoint), Live website (what they see).

Never say “frozen”, “materialize”, “snapshot”, or bare “published copy”.

---

#### Website manifest

The published website as pages, website sections, and their values. Distinct
from: Website publication, Published website copy. Never say “site manifest”.

---

#### Website image render

Painting a website page to an image (`websiteRender`). Never in PRDs or
UI. Distinct from: Website HTML render, image on a website section,
media library.

In code: `websiteRender`. Never say **raster**.

---

#### Website HTML render

Painting a website page to HTML (`websitePublication`). Never in PRDs or
UI. Distinct from: Website image render, live GET.

In code: `websitePublication`.

---

### Ad

#### Creative set

A marketing set: images + text. Distinct from: Ad (an offer or marketing goal),
Ad set (the owner-facing deliverable), Ad posting (running a paid ad). Never say
“creative set” in product docs or UI.

---

## Don't say

Never in product/user-facing text, PRD prose, technical docs, or code, unless a
home marker says the unqualified word is self-understood there.
`cmd/ci/check-dont-say` reads this `## Don't say` table: keep the
`Don't say | Say` header, separator, data rows, and end the section at the
next `##` heading. Unmarked =
nowhere. `(website)` / `(ads)` / `(onboarding)` / `(media)` / `(details)` /
`(billing)` / `(assistant)` / `(projects)` = unqualified only in that feature’s
technical docs (not `prd.md`, not `frontend.md`) and later `internal/<home>/`;
`(website)` also covers `apps/contractor-website`. Other features use the Say.
`(in a PRD)` is only for `CMS`. Leftover `(bare)` is unmarked. Worked examples:
`cmd/ci/check-dont-say/ref.md`.

| Don't say | Say |
| --- | --- |
| setup | onboarding |
| OnCall | Placis |
| frozen / frozen copy | published website copy |
| refine / refinement | website copy generation |
| instantiate / population | copy the website template’s pages onto the unpublished website |
| mint / minted / minting | create or use (ephemeral tokens and ids) |
| fold / folds | live business profile or unpublished website |
| bytes | photo, image, file, or binary |
| raster | website image render |
| generate unpublished website / generate website structure | copy the website template’s pages onto the unpublished website |
| provider | name the service (Google Maps, the LLM, Stripe) or fakes in tests |
| signed (onboarding) | website preview link |
| live markdown plan | website assistant plan |
| chatbot | Assistant, composer, or text |
| handoff boundary | the owner approves the plan, then the assistant applies it |
| knowledge catalog | knowledge base registry |
| page switch / destination switch | assistant screen switch |
| destination context | assistant screen context |
| Upgrade | usage (billing) |
| website email | marketing email |
| phone | marketing phone |
| fact (details) / structured facts | detail / information |
| proof | certifications, reviews, or projects as appropriate |
| history (details, website) | profile history, website versions, or website edit history |
| menu (website) / header / navigation | top menu or footer |
| version (website, details) / versioned (website, details) / snapshot (website, details) | website version or profile history |
| consent (onboarding) | online research consent |
| consent confirm | business lookup |
| interview (onboarding) | client interview |
| research (onboarding) | business research |
| preview (website, ads) | website preview, preview website address, or ad format preview |
| preview package | website preview |
| claim / website claim (activation) | website activation |
| marketing claim / advertising claim / unsupported claim | marketing statement / unsupported marketing statement |
| draft (website, ads, projects) | unpublished website, ad draft (Ad states), or project draft (Project states) |
| template (website) | website template |
| page (website) / section (website) / styles (website) | website page / website section / website style or website styles |
| slot (website) | heading, text, or image on that website section. Internal: website slot |
| form (website, ads) | website form or ad lead form |
| caption (media) | media caption |
| media (media) | media library |
| editor (website) | website editor |
| inspector | Content (workspace list from a canvas click) |
| jump / jumps / jumping / jumpable | navigate / navigate to |
| go live (website) | Publish (owner UI). Specs: website publication |
| registry record | company registry record |
| placeholder (website) | website placeholder or loading placeholder |
| catalog (website) | website template catalog, website component catalog, or website style catalog |
| component (website) | website component |
| our site / our website | Placis website |
| public site / public-site runtime | contractor website or Placis website (whose site) |
| runtime | do not name the application “runtime”; the contractor website lives in `apps/contractor-website` |
| private app / private Vite app / private client | the part of the application: the CMS, onboarding, or website preview (`frontend-2`) |
| shell / profile shell / app shell / page shell / Astro shell / CMS shell / editor shell / chrome / wrapper chrome / app chrome | empty business profile; the CMS (sidebar + main area); Astro document vs React islands; no extra wrapper around the page |
| custom domain | website address |
| custom website address | website address |
| website preview host | preview website address |
| published copy | published website copy |
| site manifest | website manifest |
| ready to post (ads) | ad ready to post (Ad states) |
| posting (ads) | ad posting |
| ad package | ad set |
| organization | Clerk organization |
| needs review (ads) | ad needs review (Ad states) |
| source reference / `source_refs` | where a detail came from |
| provenance | supplied by (media) or where it came from (a detail) |
| citation (details) | review citation (the excerpt) or where it came from (a detail’s origin) |
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
| slug | website prefix |
| website-prefix | website prefix |
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
| JsonRecord / JsonObjectPayload / `map[string]any` in domain code | typed struct; `jsonb` is persistence-only |
| wave | ETL run |
| Instagram listing | Instagram profile or Instagram post |
| Facebook listing | Facebook profile or Facebook post |
| generation hop | usage credit, or name the work |
| AI credit / AI credits | usage credit |
| credit (billing) | usage credit |
| build credits | usage credit |
| retainer | subscription price |
| subscription shelf / subscription-shelf | Usage & billing |
| ledger | AI use ledger |
| usage credit ledger | AI use ledger |
| credit grant / included grant | included usage credit |
| lapsed | they stopped paying / subscription is not active (`canceled`) |
| Pro Plus (billing) / Pro Max (billing) / Placis Pro Plus (billing) / Placis Pro Max (billing) | Placis Pro Plus plan / Placis Pro Max plan |
| Placis Pro (billing) / Pro (billing) | Placis Pro plan |
| Enterprise (billing) | Enterprise plan |
| meter | AI vendor cost or AI voice vendor cost (or our cost / their cost) |
| AI orb (ads) / Ads orb (ads) | inline AI assistance |
| kind / kinds | ETL run kind, photo kind, thread kind, ETL source kind, imported media kind, thread item kind, menu node kind, client interview submission kind, tool revision kind, or River job kind |
| fast extract / slow extract / fast crawl / slow crawl | ETL fast extract, ETL slow extract, ETL fast crawl, or ETL slow crawl |
| wait-end clock | wait-end, wait teaser, or wait cap |
| bag / bags | typed struct or named fields (not a freeform object) |
| blob / blobs | name the payload (HTML, instructions, jsonb column, file) |
| grain | name the unit (what Persist / Must not names, Go package, grouping) |
| widget / widgets | name the control (crop overlay, Details field, island) |

## Code naming rules

- Domain words in PRDs, UI, **and in code** when they name that concept.
  Internal names only for a different concept (technical docs and code).
- Unqualified Domain words (`page`, `section`) only in that feature’s technical
  docs and package. Other features use the Say (`website page`). Internal `slot`
  / website slot only in website technical docs and code — never owner copy or
  PRDs. Banned synonyms (`slug`, `skeleton`, `blueprint`) appear nowhere,
  including code.
- Database: `snake_case`, plural table names, `tenant_id` on every tenant-owned
  row, `*_id` foreign keys, `snake_case` enum values.
- Go: feature-nested packages (`internal/<domain>/<feature>/`), no package
  stutter (`website/pages`, not `website/websitepages`); the file-size guard
  applies (see `general-architecture/ci-cd.md`).
- API: `/v1/<domain>/...`, domain nouns in paths,
  `Create/Update/Get/List/Delete` verbs, one `*Read` response suffix.
  Conventions: `docs/general-architecture/api.md`.
- New terms are added to this glossary first; a PRD never invents a synonym.
