# Website — pipeline

Lifecycle of a website after onboarding, not a second River pipeline. Steps 01–02 are owned by
onboarding:

- [05 apply the website template](../onboarding/pipeline/05-apply-website-template.md)
- [06 website copy generation](../onboarding/pipeline/06-website-copy-generation.md)

```text
01. apply the website template (onboarding 05) → unpublished website pages / website sections / website slots
02. website copy generation (onboarding 06) → copy in unpublished website slots
03. owner edits (canvas / workspace / editing panel)
04. validate (website component contracts)
05. website publication → website.v1 website manifest → website publication row → R2 HTML
06. live GET (Cache then R2 latest/)
```

- **01–02** — onboarding. Website placeholders stay until website publication. Onboarding 05
  keeps `{{…}}` detail tokens. Onboarding 06 may overwrite prose slots but must leave reusable
  detail tokens. Publication resolves remaining tokens.
- **03** — the owner reviews and edits unpublished website rows in place (this feature).
- **04** — website sections are validated against their website component contracts before
  website publication.
- **05** — website publication resolves website placeholders, copies website styles, writes the
  `website_manifest` into a website version (`website_publications` row), then River asks the
  contractor website Worker to write HTML to R2 and purge.
- **06** — the live website is Cache then R2 `latest/` ([cloudflare.md](../cloudflare.md)). Website
  preview still renders unpublished rows on each request.
