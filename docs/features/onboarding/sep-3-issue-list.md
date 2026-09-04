# Sep 3 issue list — Onboarding

Reclassified 2026-09-03 against [ADR.md](ADR.md) and
[../assistant/ADR.md](../assistant/ADR.md). Not a drop list. Bold
numbers are original audit ids (not compacted). Fix the cited spec,
then delete the item. Delete this file when empty.

Later dated ADR / design decision is source of truth. Missing reader is
usually a **doc gap**, not a drop.

## Keep (ADR)

- **12. `channel` stays (04b Voice client interview out tombstone)**
  Comment: [ADR.md](ADR.md) 2: voice is a channel; 04b writer is out.
  `assistant.md` already says the column stays. Resume uses `channel`
  unset vs `text`. Keep the `voice` enum value as the 04b tombstone.

- **17. `visible_fields` on the guide realtime connection**
  Comment: [ADR.md](ADR.md) 14 seeds current step + visible fields.
  That is the guide (no writer tools). Keep `step` and
  `visible_fields`.

## Doc gap

- **3. `photos_fill` — controls exist; job and threshold do not**
  Comment: frontend, 04a Text client interview, complete-gate
  `photos`, and testing all depend on it.
  [../../general-architecture/jobs.md](../../general-architecture/jobs.md)
  has no consumer. “Enough photos” is undefined.
  Action: name the River job kind and a number in
  [pipeline/build-profile.md](pipeline/build-profile.md). Do not drop
  the field.

- **4. VAT paragraph — website paints `{{vat_number}}`; onboarding
  never writes it**
  Comment: Details `BusinessProfileRead` carries VAT;
  `ClientInterviewUpdate` does not. “Publication may block” names no
  blocker on [../website/api.md](../website/api.md).
  Action: put VAT on the client interview / Details write path; name
  or delete the blocker sentence.

- **9. `PUT /v1/onboarding/sources` has no screen**
  Comment: 01 Find business Do 4: wrong company is **not** a new run.
  Dropping the route leaves no recovery (ADR 16: one onboarding per
  browser token).
  Action: add “change the business” on Review. Do not drop the route.

- **11. 06 Generate website copy vs website 03 Generate website copy
  lock paragraph duplicated**
  Comment: tools/render/SLO are already forbidden in 06 Must not.
  Trigger/lock sentences still appear in both files plus
  website-editor.md and assistant ADR 27.
  Action: one owner (06); website 03 links. Not a deletion of 06.

- **13. Unpaid `create_page` / `update_details` allowed; HTTP is 403**
  Comment: website-editor.md and website 03 both allow unpaid
  `create_page`. Details PATCH is active-tenant.
  Action: onboarding-prefixed POST website pages, and an unactivated
  `update_details` path — or remove both from Allowed tools **and**
  website 03. Do not leave pipeline vs HTTP disagreeing.

- **14. `OnboardingLiveBusinessProfileRead` missing projects and
  photos**
  Comment: ADR 11 / 04a Text client interview / frontend / E2E all
  live-fill them over SSE.
  Action: add nested reads, or name the separate route.

- **15. Client interview photo upload has no route**
  Comment: `photos` is a **required** complete-gate key; onboarding
  runs before an active tenant; media library HTTP is active-tenant.
  Action: onboarding media library wrapper (onboarding token, same
  three hops). Do not drop upload unless the gate key changes too.

- **16. Stale “08” / “07” sentences after ADR 21**
  Comment: ADR 21 moved share to 08 Preview website address and
  activation to 09 Website activation. ADR 12 already has a dated
  amendment (keep old text). ADR 16 still says “Website activation
  (08)” with no note. Billing ADR 2/8 and frontend-debloat “match 07”
  are downstream errors.
  Action: dated amendment on onboarding ADR 16; correct
  frontend-debloat and (until #88) billing PRD.

- **18. `OnboardingProfileRead.preview_website_address` reader
  unnamed**
  Comment: Share is optional (ADR 21). After reload, profile GET is
  the only hydrate that can re-show the URL.
  Action: name that resume behaviour in frontend.md §5.

## Actually drop

- **5. `onboarding_sessions.started_from`**
  Comment: ADR 2 is “either or both”; the enum cannot say both;
  attach keys already hold it; `PUT /v1/onboarding/sources` would
  stale it.
  Action: drop column; derive from `place_id` / `company_number`.

- **8. `website_activations` dead enum values**
  Comment: webhook is `checkout.session.completed` only. Keep
  `amount` / `currency` (billing ADR 2: billing does not own this
  row) and `stripe_events.processed` (09 Website activation test
  asserts it). #88 keeps `refunded` (billing ADR 17: refunds are
  money-only).
  Action: drop `failed`, `failure_reason`, `activated_at`. Name a
  source for `WebsiteActivationStatusRead.checkout_url` or drop that
  field.

- **18a. `BusinessLookupRead.id` (“for logs”)**
  Comment: token-auth Routes have no `{id}` in the path. Drop.

## False alarms (closed)

- **10. Two website preview routes** — ADR 21 and design decision 13:
  wait teaser then `/onboarding/preview-and-edit/`. Do not merge them.

## Keep (scope)

- Core loop 01–09. 04b Voice client interview files as **out**
  tombstones.
- Complete gate, research conflicts, derived fill status.
- Unpaid website editor as a policy wrapper.
- Stripe: checkout POST, status GET, signed webhook.
- `POST /v1/onboarding/projects/{projectId}/archive`.
