# Frontend (`frontend-2`) — cross-cutting UI

Conventions that apply to every screen in `frontend-2` (the CMS and onboarding).
Feature screens stay in that feature’s `frontend.md`. Stack and folders:
[frontend-stack.md](frontend-stack.md). Port instructions:
[frontend-debloat.md](frontend-debloat.md) (index:
[planning/frontend-debloat.md](../planning/frontend-debloat.md)).

## Loading placeholders

Every screen uses loading placeholders for data that is not on screen yet (first paint and
refetch). Each loading placeholder sits **inside** the field, list row, or website slot that is
waiting — the same layout as the loaded UI.

Do **not** swap a whole card, panel, canvas, or screen for one loading block. The CMS sidebar
and main area stay; so do workspace, editing panel frame, and accordion. Only the waiting
values show a loading placeholder.

- **Details and other field screens:** a loading placeholder in each field (label stays).
- **Lists:** loading placeholder rows, not one block where the list was.
- **Website editor:** workspace rows and editing-panel fields / website slots; do not blank the
  whole canvas or the whole editing panel.
- **Ads:** same, per offer / copy / image cell. Cache hit (prefetch) → no loading placeholders.
- **In-flight action** (Approve, website publication): busy on the control, not a
  loading placeholder for the whole screen.

Do not say “skeleton”; the name is loading placeholder ([glossary](../glossary.md)).
