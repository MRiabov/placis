# 02b — Review the checklist, then client interview

Two UI surfaces, one profile.

## Review (`/onboarding/review`)

The checklist is the review surface. Each row has a status — `filled_by_source`,
`filled_by_user`, `empty`, `in_progress`, `needs_confirmation`, `conflict`, `skipped`,
`not_applicable` — plus where it came from. Grouped as: who they are, legal details, contact,
services, service area, certifications and reviews, photos.

The contractor sees what 01a + 02a already filled (business research may still be running), then
**Continue**. Conflicts show both values; the system never picks silently.

Legal identity from the registry (legal name, company number, registered office) is shown here
and is **not** on the text client interview.

## Client interview (`/onboarding/interview`)

Fill only the gaps. Two writers, same path that writes details; applying the website template never reads a transcript.

**Text** — fields, autosaved (`PUT .../text-interview/autosave` writes `business_profile_edits` for
the fields the save set, plus a `client_interview_submissions` row with `kind=autosave`), submitted
as final (`POST .../text-interview/submissions` → `kind=final`) then `POST .../interview/complete`:

- Who they are — display name, trade.
- Contact — contact name, marketing phone, marketing email, existing site URL; emergency phone number
  (how we reach the owner).
- What they do — main services, service area.
- Opening hours — per day: open, close, closed.
- Photos — use the found ones, take them from Google, upload later, or use neutral ones.
- Certifications and reviews — accreditations, review notes (or "we don't have online reviews"), extra notes.

**Voice** — the implemented default in `frontend-2`. Transport:
[voice-agent.md](../../../general-architecture/voice-agent.md). Tools write the same profile:
`obtained_information`, `mark_information_status`, `request_lookup`, `confirm_conflict`,
`update_interview_plan`. `end_interview` is allowed only when required checklist rows are filled
(no open conflicts) and then calls the same `interview/complete` as text.

Leave-and-come-back restores the onboarding session from `localStorage` + `GET .../profile`.

Status stays `client_interviewing` until complete, then `applying_website_template` (04).

- **Persists** `client_interview_submissions` (`kind=autosave` / `kind=final`, plus interview-only
  choices) and `business_profile_edits` (03) for the profile answers.
  `onboarding_sessions.channel` = `text` or `voice`.
