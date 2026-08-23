# Website template catalog, website component catalog, and website style catalog

Typed Go structs dumped to JSON will live in this directory. That dump is the contract the
contractor website renderer and `cmd/api` both read — not a second copy of website component
schemas.

Until that dump exists, the **first-pass** set is the imported predecessor JSON sidecars in
`packages/website-components`:

- website component contracts beside each renderer (`contract.json`)
- website templates as JSON + markdown sidecars (home, service, contact, legal, plus
  predecessor extras)
- website style catalog presets under `packages/website-components/src/themes/`

Do not hand-duplicate those shapes in Go. Load the sidecars; later dump the same structs
here as website template catalog revisions.

First-pass website page types are `home` / `service` / `contact` / `legal`. Blog and careers
are deferred even though predecessor files were imported with the package.
