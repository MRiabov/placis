# Ads — pipeline

```text
01. create (ad)
02. draft (LLM: copy + image gallery + light cleanup) — async, queued
03. review / edit / approve (owner)
04. export (deterministic ad set)
```

- **01** — the owner creates the ad (offer, goal, service focus, ideal customer profile, ad
  destination).
- **02** — the LLM drafts copy and an image gallery from approved media, with **light cleanup**
  (subtle enhancement, e.g. minor retouch/denoise — no generative fills or new subjects; the
  result stays a reviewable before/after, never silently replaced), queued; the owner can leave
  and return. Recorded in `ai_generations`.
- **03** — the owner reviews, edits, approves; `ad_ready_to_post` requires approved media with a
  media caption.
- **04** — the ad set exports deterministically (images at crop + copy sheet + ad lead form
  fields).
