# Website — pipeline

```text
01. website template apply (deterministic) → unpublished website pages / website sections / website slots
02. website copy generation (LLM edits: update_slot, generate_image) → proposed changes
03. owner edits (canvas / workspace / inspector)
04. validate (website component contracts)
05. website publication → website manifest → website publication row
06. render (live website)
```

- **01** — the website template is applied to the profile: unpublished `website_pages` /
  `website_sections` / `website_slots`, website placeholders kept.
- **02** — website copy generation writes copy into the unpublished website through typed,
  validated, parallel tool calls (not the website assistant).
- **03** — the owner reviews and edits unpublished website rows in place.
- **04** — website sections are validated against their website component contracts before
  website publication.
- **05** — website publication resolves website placeholders, writes the `website_manifest` into a
  website version (`website_publications` row).
- **06** — the live website renders the active website version (Astro document, React islands).
