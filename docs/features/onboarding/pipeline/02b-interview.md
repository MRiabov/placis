# 02b — Review the checklist, then interview

Two UI surfaces, one profile.

## Review (`/onboarding/review`)

The checklist is the review surface. Each row has a status — `filled_by_source`,
`filled_by_user`, `empty`, `in_progress`, `needs_confirmation`, `conflict`, `skipped`,
`not_applicable` — plus where it came from. Grouped as: who they are, legal details, contact,
services, area, proof, photos.

The contractor sees what 01a + 02a already filled (research may still be running), then
**Continue to interview**. Conflicts show both values; the system never picks silently.

Legal identity from the registry (legal name, company number, registered office) is shown here
and is **not** on the text form.

## Interview (`/onboarding/interview`)

Fill only the gaps. Two writers, same `apply facts` path; generation never reads a transcript.

**Text** — fields, autosaved as a draft (`PUT .../text-interview/draft` →
`text_interview_submissions` `version` drafts), submitted as final
(`POST .../text-interview/submissions`) then `POST .../interview/complete`:

- Who they are — display name, trade.
- Contact — contact name, phone, email, website.
- What they do — main services, service area.
- Opening hours — per day: open, close, closed.
- Photos — use the found ones, take them from Google, upload later, or use neutral ones.
- Proof — accreditations, review notes (or "we don't have online reviews"), extra notes.

**Voice** — the implemented default in `frontend-2`. Transport:
[voice-agent.md](../../../general-architecture/voice-agent.md). Tools write the same profile:
`obtained_information`, `mark_information_status`, `request_lookup`, `confirm_conflict`,
`update_interview_plan`. `end_interview` is allowed only when required checklist rows are filled
(no open conflicts) and then calls the same `interview/complete` as text.

Leave-and-come-back restores the session from `localStorage` + `GET .../profile`; text drafts
rehydrate the form.

Status stays `interviewing` until complete, then `generating` (04).

- **Persists** `text_interview_submissions` (draft + final) and profile-version deltas (03).
  `onboarding_sessions.channel` = `text` or `voice`.
