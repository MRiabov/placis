# Website — pipeline

```text
01. blueprint apply (deterministic) → draft pages / sections / slots
02. refine (LLM edits: update_slot, generate_image) → proposed changes
03. user edits (canvas / workspace / inspector)
04. validate (component contracts)
05. publish → manifest → publication
06. render (public site)
```

- **01** — the trade blueprint is applied to the profile: draft `website_pages` / `website_sections`
  / `content_slots`, placeholders kept.
- **02** — the LLM (the editor) proposes edits through typed, validated, parallel tool calls.
- **03** — the user reviews and edits; every edit is a new page version.
- **04** — sections are validated against their component contracts before save and publish.
- **05** — publish resolves placeholders, freezes the `site_manifest` into a publication.
- **06** — the public site renders the active publication (Astro shell, React islands).
