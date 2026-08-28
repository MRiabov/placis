# Frontend (`frontend-2`) — cross-cutting UI

Conventions that apply to every screen in `frontend-2` (the CMS and onboarding).
Feature screens stay in that feature’s `frontend.md`. Stack and folders:
[frontend-stack.md](frontend-stack.md). Port instructions:
[frontend-debloat.md](frontend-debloat.md) (index:
[planning/frontend-debloat.md](../planning/frontend-debloat.md)).
Tokens for the CMS (sidebar + main area): [design.md](./cms/design.md).

## Loading placeholders

Every screen uses loading placeholders for data that is not on screen yet (first
paint and refetch). Each loading placeholder sits **inside** the field, list
row, or website slot that is waiting — the same layout as the loaded UI.

Do **not** swap a whole card, panel, canvas, or screen for one loading block.
The CMS sidebar and main area stay; so do workspace (including Content) and
accordion. Only the waiting values show a loading placeholder.

- **Details and other field screens:** a loading placeholder in each field
  (label stays).
- **Lists:** loading placeholder rows, not one block where the list was.
- **Website editor:** workspace rows and Content / SEO fields / website slots;
  do not blank the whole canvas or the whole workspace list.
- **Ads:** same, per offer / copy / image cell. Cache hit (prefetch) → no
  loading placeholders.
- **In-flight action** (Approve, website publication): busy on the control, not
  a loading placeholder for the whole screen.

Do not say “skeleton”; the name is loading placeholder ([glossary](../glossary.md)).

## Notification

A shared **notification**: fixed bottom-right, above the main area. Message +
two actions. Details `update_details`: **Revert** + **OK**. Denied microphone:
**Try again** + **Switch to text mode**. Look in the mocks:
[ads.html](../design/ads.html) (Saved years in business to Business details).
On a **narrow** screen
(≤1100px), sit **above** the Sites workspace bottom bar (not under thumbs or the
home indicator).

`update_details` ([details HTTP](../business-profile/details/api.md)): the write is applied; OK keeps it; Revert
undoes that `business_profile_edits` increment. Website assistant, Ads
generator, and later LLM callers invoke **that** tool (one implementation).
Leaving the screen without clicking keeps the write. Stay until they pick an
action (timeout later).

Intended later callers (rare — do not spam): ad leads when they log in, an
**ad lead** while they are in Ads, an unusually profitable or lossy campaign, a
long-running or unexpected operation. Website editor and Ads use the same piece.
Do not invent extra events in the Ads mock.

Not an inline field warning. Not a modal. Specs say **notification**.
