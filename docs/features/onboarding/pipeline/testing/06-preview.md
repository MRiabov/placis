# 06 — Preview (integration test)

- **Setup**: a refined website draft.
- **Invoke**: create the preview package and stream progress events (SSE).
- **Assert**: `preview_packages` (`token`, `personas`, `unresolved_fields`) + `preview_events`
  written; the SSE stream emits events on change (no faster than ~2s).
- **Mocked**: nothing.
