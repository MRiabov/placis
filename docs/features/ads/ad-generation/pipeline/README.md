# Ads — pipeline

```text
01. create (ad creative set)
02. propose (LLM: copy + image gallery + light cleanup) — async, queued
03. review / edit / approve (user)
04. export (deterministic package)
```

- **01** — the user creates the set (offer, goal, service focus, ICP, destination).
- **02** — the LLM proposes copy and an image gallery from approved media, with **light cleanup**
  (subtle enhancement, e.g. minor retouch/denoise — no generative fills or new subjects; the
  result stays a reviewable before/after, never silently replaced), queued; the user can leave and
  return. Recorded in `ai_generations`.
- **03** — the user reviews, edits, approves; `ready_to_post` requires approved, captioned assets.
- **04** — the package exports deterministically (images at crop + copy sheet + lead-form fields).
