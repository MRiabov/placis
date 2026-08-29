# Projects Frontend Specification

A working Projects screen at `/cms/projects`: list of jobs with photos, then
`/cms/projects/new` and `/cms/projects/{id}` for title, description, and cover
from the media library. Not a stub.

Editing this screen updates the unpublished website / website editor
immediately; the live website changes only on the next website publication. Ads
read the same live rows.

**TODO:** Save on click-off must follow the same split as the website editor:
unpublished website / ad draft only, not the live website or a Published ad.
Canonical:
[HTTP conventions](../../../general-architecture/api.md). Today Projects PATCH
is the live `business_profile.projects` row ads and website publication also
read.

Archive drops the project from every project-gallery website section (then
compact).

Left nav: [The CMS (sidebar + main area)](../../../general-architecture/cms/frontend.md). HTTP: [api.md](api.md). Table:
[persistence.md](persistence.md). Product: [ADR](ADR.md). Look: [design.md](design.md), [design decision record](design-decision-record.md).
Port: [frontend-debloat.md](frontend-debloat.md). Headings have no decorative icon. On narrow, Open
destinations stays inline with the heading.

Loading placeholders: every screen, per card / field / photo cell — not a
whole-panel swap
([frontend.md](../../../general-architecture/frontend.md)).

## Routes

| Route | Purpose |
| --- | --- |
| `/cms/projects` | List |
| `/cms/projects/new` | New project |
| `/cms/projects/{id}` | Existing project |

## List (`/cms/projects`)

Cards clone My ads look: `--prompt-radius`, `--prompt-border`,
`--prompt-shadow`, 10px pad, inset photo (`height: 176px`, `border-radius:
18px`). Wide: **2 columns**, `gap: 20px`. Narrow (≤1100px): 1 column, 44px
hits. Large by default. No compact rows. The list sits in the same centered
960px column as Ads.

Each card is cover, **title** (15px / 600), then a short **description**
paragraph. No status badge, no “Updated …”, no performance strip, no category /
location / date. Missing cover is an empty photo well, not a button.

**The whole card is the hit.** No **Change cover**, no **Remove**, no other
controls on the card. Click opens `/cms/projects/{id}`.

**Add project** is the heading ink button. It opens `/cms/projects/new`. It does
not append an editable card.

Empty: heading **Projects**, lede (jobs with photos shown on the website),
**Add project**. No demo jobs.

Collapsed **Archive** heading under the cards (chevron down on the right;
default collapsed). Unarchive from there. Same disclosure look as Certifications
and reviews Archive.

No Profile eyebrow. No “Profile active” pill.

## `/cms/projects/new` and `/cms/projects/{id}`

Back to the list. Heading is the project title, or **New project**. Shared
field controls:

- **Cover** — current photo or empty well + **Pick from the media library**.
  Overlay of thumbs from the media library (media caption when present; the
  owner never labels). Landscape, square, and portrait keep their ratio. Two
  columns on a narrow screen; three on a wide screen, four when there are more
  than ten. Twenty to forty photos is expected. **Upload** in that overlay
  lands in the media library, then becomes the cover. Crop / cleanup stay
  `/cms/media`.
- **Title** (1–80)
- **Description** (1–2000)
- **Archive** — red outline, after the fields, not ink. Hidden until there is a
  row.

Persist on **click-off**. No Save. New project: first click-off on title
`POST /v1/projects`. Human click-off of title / description / cover (no pending
agent hunks) `PATCH /v1/projects/{id}`.

## Writing (Ads AI orbs)

Not Voice. Not the website assistant overlay. Same AI tools as Ads Review: 44px
sparkle + required prompt overlay. Empty prompt does not generate. Click-off
closes the prompt. Overlay sits above a highlighted span when they selected.
Tools: [ADR](ADR.md) 4. Same HTTP as `/cms/projects/{id}`
([website assistant](../../website/assistant.md): owner action = assistant
action).

- **Title** — orb. No selection = whole title (`set_project_title`). PATCHes
  immediately. Ctrl+Z restores the previous title.
- **Description** — orb. Selection = `span` patch. No selection = `quote`
  (the model names the passage). Empty description = `fill`. Never a whole-field
  rewrite of a non-empty description (`patch_project_description`).
- **Cover** — pick, not an orb.

Prompt required. Other owner edits are kept. Record reasoning, owner-visible
output, and tool calls. Usage debit is the AI use ledger. Tool names never
appear.

## Description Ask first (inline diff)

Description AI is **Ask first**, always (no Plan / Ask first switch). Proposal
in memory; nothing PATCHed until **Apply**. Pending must be obvious; do not
paint **Not applied**.

The description **is** an inline diff of **every not-yet-Applied hunk** (this
orb and earlier ones still pending):

- unchanged: normal
- removed: red wash + strike
- inserted: green wash

Not a second column. Not wholesale replace + highlight. `append` is a green run
at the end. `fill` is all green.

**Apply / Reject** pills sit next to the description (no overlay). One pair for
**all** stacked hunks, not per hunk. Pills never fade while pending. One-way:
Apply *or* Reject, never both.

- **Pending** — composed proposal in the field; all unapproved hunks stay as
  diffs. No PATCH.
- **Applied** — `PATCH /v1/projects/{id}` with the resulting `description`
  (same body as click-off). Diffs gone. Pills gone.
- **Rejected** — last PATCHed description. Pills gone. Reject never writes a
  row.

A further orb **adds** a pending hunk. Owner typing edits the proposal (still
pending).

## Archive

Archive is not delete. The project leaves the list and is dropped from every
project-gallery website section (then compact). Unarchive returns the row to the
list (not automatically back onto website sections). Toast with **Undo**
(unarchive). Owner copy: **Archive** / **Unarchive**. Never Remove or Delete.

## Out of scope

- Website editor project-gallery Content (ordered project ids on that website
  section).
- Onboarding creating project rows from photos of their work.
- Voice as the writing UI.
- Website-assistant overlay as the writing UI.
