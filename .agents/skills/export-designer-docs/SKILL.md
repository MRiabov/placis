---
name: export-designer-docs
description: Builds a sanitized zip of Placis HTML design mocks plus product and look docs for the designer cofounder, with no backend code or backend docs. Use when asked to export design docs, make a designer zip, package docs/design, send mocks to a designer, or repeat the designer/cofounder docs extraction.
---

# Export designer docs

Repeatable extraction of **look + product** for the designer cofounder. They
have a complete say over the product. They must **not** receive backend code
or backend docs.

Do not invent a new zip layout. Run the committed exporter.

## Run

From the repo root (or a task worktree):

```bash
rtk python3 scripts/export_designer_docs.py
```

The script prints `zip=` and `snapshot=`. Give the user that zip path. Do not
commit the zip or the snapshot.

Output is gitignored:

- `docs/design/exported-docs/placis-design-and-product_<local-time>_<commit8>/`
- `docs/design/exported-docs/placis-design-and-product_<local-time>_<commit8>.zip`

`SANITIZATION.md` inside the snapshot records export time and source commit.

## Agreement

| They get | They do not get |
| --- | --- |
| `docs/design/**` mocks (HTML/CSS/JS/fonts/photos/audio) | Backend / `frontend-2` / app source |
| `prd.md`, `general-prd.md` | `ADR.md` |
| `design-decision-record.md` | `api.md`, `persistence.md`, `technical-implementation.md` |
| `frontend.md` (not `frontend-debloat.md`) | `architecture.md`, `pipeline/`, testing, Cloudflare/ops |
| `design.md`, website `styles.md` | `frontend-debloat.md`, `frontend-stack.md`, `planning/` |
| Glossary Domain + Enums | Glossary Internal + code-naming rules |

The cover `README.md` in the zip must say they can change the mocks, PRDs, and
design decision records. Engineering follows their call.

## After the script

1. If it exits non-zero (`leftovers:` / `broken_links:`), fix
   `scripts/export_designer_docs.py` and re-run. Do not hand-edit the snapshot.
2. Confirm the zip contains `docs/design/cms.html`, `onboarding.html`,
   `ads.html`, fonts, and the PRDs. Confirm it does **not** contain `ADR.md`.
3. Tell the user the zip path. Warn them not to send leftover zips such as
   `docs/design.zip` or anything that includes `ADR.md`.

## If the docs tree changed

Update the **script**, then re-run. Typical edits:

- New look/product files: add the filename to `collect_sources()` (exact names
  like `frontend.md`, `prd.md`, `design.md`, `design-decision-record.md`,
  `styles.md`).
- New engineering docs: add the basename to `BACKEND_NAMES` or a path part to
  `BACKEND_PATH_PARTS`.
- New leftover prose after sanitization: extend `tidy_prose()` / `LEFTOVER`,
  then re-run until exit 0.

Do not flatten the tree. Keep `docs/` relative paths so links between included
files still work.

HTML/CSS/JS are copied as-is. Only Markdown is sanitized (omitted links
stripped or retargeted from a feature `README.md` onto that feature's `prd.md`
/ `frontend.md`).

## Do not

- Put backend files in the zip “for context”
- Commit `docs/design/exported-docs/`
- Point the designer at `frontend-2/` or `internal/`
- Send an unsanitized `docs/` tree
