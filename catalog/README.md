# Website template catalog, website component catalog, and website style catalog

Typed Go structs dumped to JSON will live in this directory. That dump is the
contract the contractor website renderer and `cmd/api` both read — not a second
copy of website component schemas.

Until that dump exists, the **first-pass** set is the imported predecessor JSON
sidecars in `packages/website-components`:

- website component contracts beside each renderer (`contract.json`)
- website templates as JSON (home, about, service, contact, privacy policy).
  One website template is one website template catalog id. 01 lists
  `production_ready=true` website templates only. Predecessor
  `production_selectable` is not that flag. Model:
  [website template catalog](../docs/features/website/catalog.md).
- website style catalog presets under `packages/website-components/src/themes/`

Do not hand-duplicate those shapes in Go. Load the sidecars; later dump the same
structs here as website template catalog revisions.

First-pass website page types are `home` / `about` / `service` / `contact` /
`legal`. Blog and careers are deferred and are not in the website component
package. Extra website template catalog pages (work / gallery / careers) are
not copied onto the unpublished website.
