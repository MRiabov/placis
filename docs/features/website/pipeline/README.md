# Website — pipeline

Lifecycle of a website after onboarding, not a second River pipeline. Steps 01–02 are owned by
onboarding:

- [05 apply the website template](../onboarding/pipeline/05-apply-website-template.md)
- [06 website copy generation](../onboarding/pipeline/06-website-copy-generation.md)

```text
01. apply the website template (onboarding 05) → unpublished website pages / website sections / website slots
02. website copy generation (onboarding 06) → copy in unpublished website slots
03. onboarding 07/08 website publication (v1 strip on, v2 strip off) → R2 latest/
04. owner edits (canvas / workspace / editing panel)
05. validate (website component contracts)
06. owner website publication → website.v1 → website publication row → R2 HTML
07. live GET (Cache then R2 latest/)
```

- **01–03** — onboarding. Website placeholders stay until website publication. Onboarding 05
  keeps `{{…}}` detail tokens. Onboarding 06 may overwrite prose slots but must leave reusable
  detail tokens. 07/08 call the same publication write (onboarding drafts are not website-rollback
  targets).
- **04** — the owner reviews and edits unpublished website rows in place (this feature).
- **05** — website sections are validated against their website component contracts before
  website publication.
- **06** — owner website publication resolves website placeholders, copies website styles, writes
  the `website_manifest` into a website version (`website_publications` row), then River asks the
  contractor website Worker to write HTML to R2 and purge.
- **07** — the live website is Cache then R2 `latest/` ([cloudflare.md](../cloudflare.md)). There
  is no per-request unpublished render.
