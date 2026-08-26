# Details

The **Details** view edits the business details — the one **business profile** the rest of the
application draws from. Onboarding builds it; the website shows it; ads reuse it. The owner
reaches it from **Profile** → **Business details**.

## What it edits

- **Who they are** — business name, legal name, trade, established year, description.
- **Contact** — marketing phone, marketing email, existing site URL. Emergency phone number is how we
  reach the owner, not what leads use.
- **Where they are** — business location, service areas.
- **What they do** — featured services.
- **Legal** — company number, VAT number, registered office.
- **Opening hours** — per day: open, close, and a note.

## Shared by everyone

- **Onboarding** builds these details (from the company registry record, Google Maps listing, and the client interview).
- **The website** shows them — including on the contact website page and service website pages
  (top menu and footer are edited in the website editor).
- **Ads** read them — the business name, trade, marketing phone, marketing email, and services become the ad copy,
  and the ideal customer profile starts from the same details.

One source of truth: the business profile. Editing it here changes the website and the next ad draft.

How the owner reaches it: [frontend.md](frontend.md). Port:
[frontend-debloat.md](frontend-debloat.md). Decisions: [ADR.md](ADR.md). HTTP:
[api.md](api.md). Tables: [persistence.md](persistence.md). Projects:
[website HTTP](../../website/api.md).
