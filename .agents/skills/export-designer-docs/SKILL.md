---
name: export-designer-docs
description: Copies every sanitized Placis product, design, and frontend decision doc into the look-demo git repo (demo.placis.com) for the designer cofounder. No backend docs, no HTML mock archive, no zip. Use when asked to export design docs, copy designer docs into the demo repo, send product/look docs to a designer, or repeat the designer/cofounder docs extraction.
---

# Export designer docs

Repeatable extraction of **look + product** for the designer cofounder. They
have a complete say over the product. They must **not** receive backend code,
backend docs, or the deprecated HTML mock archive.

The destination is the **same git repo** as the Vite look app
(`demo.placis.com`). Git is the send channel. There is no zip.

Do not invent a new tree layout. Run the committed exporter.

## Run

From the repo root (or a task worktree):

```bash
rtk python3 scripts/export_designer_docs.py
```

Optional explicit destination:

```bash
rtk python3 scripts/export_designer_docs.py /home/maksym/Work/business/demo.placis.com
```

Default dest is the sibling of the **main** Placis checkout
(`../demo.placis.com`). From a worktree that still resolves to the same sibling,
not `worktree/../demo.placis.com`.

The script fails if the dest is missing or not a git repo. It prints `dest=`,
`docs=`, and `copied_<filename>=` counts. It writes only `dest/docs/` (cover
README, SANITIZATION.md, product/look Markdown). It does **not** overwrite the
Vite app or the dest root `README.md`.

Do not commit `demo.placis.com` unless asked. Re-running the exporter replaces
`dest/docs/` (`rsync --delete`). Do not hand-edit dest and expect the next
export to keep those edits — copy them back into Placis first, or they vanish.

`SANITIZATION.md` in `dest/docs/` records export time and source commit.

## Completeness (must pass)

`dest/docs/` must contain **every** Placis file of these names (except under
the HTML archive `docs/design/`):

| Kind | Filename | Must include |
| --- | --- | --- |
| Product | `general-prd.md`, every `prd.md` | Loop, onboarding, website, ads, **assistant**, **billing** |
| Design decisions | every `design-decision-record.md` | CMS, website, onboarding, details, **projects**, certifications, assistant, billing |
| Frontend | every `frontend.md` | Cross-cutting, CMS, website, onboarding, ads, details, projects, certifications, billing |
| Look notes | every `design.md`, `styles.md` | CMS, onboarding, projects `design.md`; website `styles.md` |
| Language | `glossary.md` | Whole file |

The cover `docs/README.md` must **index** all of those (do not omit assistant
or billing PRDs, or the Projects design decision record). Compare
`copied_prd.md=` / `copied_design-decision-record.md=` /
`copied_frontend.md=` from the script to a glob of the same names under Placis
`docs/` (skip `docs/design/`). If a new file of those names exists in Placis
and is missing from dest, the export is wrong — fix the script (usually
`INCLUDED_MD_NAMES`) and re-run.

Placis has no extra files in those classes today. Do **not** invent:

- a business-profile PRD (those screens use frontend + design decision records)
- `features/assistant/frontend.md` (look is the assistant design decision record)
- an ads design decision record (ads look is CMS record, decisions 5–6)

Media / leads / auth have no PRD, frontend spec, or design decision record.

## Agreement

| They get | They do not get |
| --- | --- |
| Vite look app (via `scripts/sync-look-demo.sh`) | HTML/CSS/JS mock archive (`docs/design/`) |
| Every `prd.md`, `general-prd.md` | `ADR.md` |
| Every `design-decision-record.md` | `api.md`, `persistence.md`, `technical-implementation.md` |
| Every `frontend.md` (not `frontend-debloat.md`) | `architecture.md`, `pipeline/`, testing, Cloudflare/ops |
| Every `design.md`, `styles.md` | `frontend-debloat.md`, `frontend-stack.md`, `planning/` |
| Whole `docs/glossary.md` | Backend / `frontend-2` / Go source |

The cover `docs/README.md` must say they can change the Vite look, PRDs,
design decision records, and the glossary. Engineering follows their call.
Send-back is commit and push this repo, not a zip.

## After the script

1. If it exits non-zero (`leftovers:` / `broken_links:`), fix
   `scripts/export_designer_docs.py` and re-run. Do not hand-edit dest.
2. Run the Completeness checklist above. Confirm dest has **no**
   `design/cms.html`, `onboarding.html`, `ads.html`, or `ADR.md`.
3. Tell the user the dest path. Warn them not to send leftover zips such as
   `docs/design.zip` or anything that includes `ADR.md`.

The look app is a separate copy: `scripts/sync-look-demo.sh` (excludes
`docs/` so it does not wipe this package).

## If the docs tree changed

Update the **script**, then re-run. Typical edits:

- New look/product files: add the filename to `INCLUDED_MD_NAMES` (exact names
  like `frontend.md`, `prd.md`, `design.md`, `design-decision-record.md`,
  `styles.md`). Then add a cover-README row so the index stays complete.
- New engineering docs: add the basename to `BACKEND_NAMES` or a path part to
  `BACKEND_PATH_PARTS`.
- New leftover prose after sanitization: extend `tidy_prose()` / `LEFTOVER`,
  then re-run until exit 0.

Do not flatten the tree. Keep `docs/` relative paths so links between included
files still work.

Only Markdown is copied (omitted links stripped or retargeted from a feature
`README.md` onto that feature's `prd.md` / `frontend.md`).

## Do not

- Put backend files or HTML mocks in dest “for context”
- Build a zip or write `docs/design/exported-docs/`
- Point the designer at `frontend-2/` or Go `internal/` packages
- Send an unsanitized `docs/` tree (the exporter still strips omitted-file links)
- Overwrite the Vite app or dest-root `README.md`
- Treat a cover table that lists only onboarding/website/ads as complete
