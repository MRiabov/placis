---
name: export-designer-docs
description: Copies every sanitized Placis product, design, and frontend decision doc into the look-demo git repo (demo.placis.com) for the designer cofounder. On invocation: pull from latest, resolve if there are any conflicts, merge, and notify if there were changes while the user wasn't looking. No backend docs, no HTML mock archive, no zip. Use when asked to export design docs, copy designer docs into the demo repo, send product/look docs to a designer, or repeat the designer/cofounder docs extraction.
---

# Export designer docs

Repeatable extraction of **look + product** for the designer cofounder. They
have a complete say over the product. They must **not** receive backend code,
backend docs, or the deprecated HTML mock archive.

The destination is the **same git repo** as the Vite look app
(`demo.placis.com`). Git is the send channel. There is no zip.

Do not invent a new tree layout. Run the committed exporter.

## On invocation (do this first)

Do these four steps in dest (`demo.placis.com`) **before** `export_designer_docs.py`
or `sync-look-demo.sh`. Dest is a separate git repo with `origin`
`https://github.com/MRiabov/demo.placis.com.git`. Default path is the sibling
of the **main** Placis checkout. Record `HEAD` and `git status --porcelain`
before touching anything.

### 1. pull from latest

`git fetch origin`, then pull the tracked branch (usually `origin/main`). If
dest has no remote, stop this step and tell the user.

### 2. resolve if there are any conflicts

If the pull stops on conflicts, resolve them. Do not abort and do not leave
dest mid-merge. Prefer keeping dest `docs/` and look-app edits when they are
the designer's; cover `docs/README.md` / `docs/SANITIZATION.md` from a prior
export can be regenerated later.

### 3. merge

Finish the merge so dest matches latest origin (complete `git pull` / `git
merge`). Do not commit dest or push dest unless asked.

### 4. notify me if there were changes while I wasn't looking

Tell the user, in the reply, whether dest moved. Incoming `origin` commits,
uncommitted dest files (especially `docs/` and the Vite app), and anything
that would be destroyed by `rsync --delete` all count. Summarize paths. If
nothing changed, say that.

If dest `docs/` changed, copy those files back onto the same paths under
Placis `docs/` **before** exporting (`rsync --delete` on dest `docs/` would
wipe them). If the Vite app changed, do not run `sync-look-demo.sh` until
those edits are copied back onto Placis `demo/` or the user says to overwrite.

Then run the exporter (and sync only if dest look files are safe to replace).

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
`dest/docs/` (`rsync --delete`). That is why On invocation pulls dest and
copies designer `docs/` back into Placis first when dest changed.

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
- Run the exporter or `sync-look-demo.sh` before On invocation (pull / resolve /
  merge / notify)
- Overwrite dest `docs/` or the Vite app when dest has incoming or uncommitted
  designer edits
- Treat a cover table that lists only onboarding/website/ads as complete
