# Ads — pipeline

No step files yet. Future `01-….md` files use Trigger / Pre / Must not / Do /
Persist / Fail / Out / Invariants (closed `##`) and ship with
`testing/01-….md`. Named identifiers:
[docs conventions](../../../../docs-conventions.md#named-identifiers).

```text
01. create (ad)
02. draft (LLM: copy + image gallery + light cleanup) — async, queued
03. review / edit / approve (owner)
04. export (deterministic ad set)
```

- **01** — the owner creates the ad (offer, goal, service focus, ideal customer
  profile, ad lead form, and exactly one ad format before generate).
- **02** — the LLM drafts copy and an image gallery by picking from the media
  captions of ready approved photos, with **light cleanup** (remove clutter or
  trash, tidy backgrounds — not denoise-as-the-job, not generative fills or new
  subjects; the result stays a reviewable before/after, never silently
  replaced), queued; the owner can leave and return. Cached per input, ad
  format, and `prompt_id` / `prompt_version`; a retry hits the cache. After the
  owner accepts (`ad_ready_to_post`), or if the result would duplicate a
  Published ad, roll to the next `prompt_version`. Recorded in `ai_generations`.
- **03** — the owner reviews, edits (including AI-orb rewrite/cleanup with a
  required prompt), approves. `ad_ready_to_post` requires tenant-owned photos
  that have finished uploading. A media caption is not a gate for a photo the
  owner just added to this ad (the media caption writes in the background).
  `update_details` writes the business profile when copy includes a detail.
  Approve is not blocked.
- **04** — the ad set exports deterministically (images at crop + copy sheet +
  ad lead form fields).
