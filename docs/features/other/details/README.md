# Details

The **Details** view edits the business details — the one **business profile** the rest of the
application draws from. Onboarding builds it; the website shows it; ads reuse it. The owner
reaches it from **Profile** → **Business details**.

## What it edits

- **Who they are** — business name, legal name, trade, established year, description.
- **Contact** — marketing phone, marketing email, existing site URL. Emergency phone number is how we
  reach the owner, not what leads use (unpublished; not on this screen unless asked).
- **Where they are** — business location, service areas.
- **What they do** — featured services.
- **Legal** — company number, VAT number, registered office.
- **Opening hours** — Google Calendar-style picker, one row per day: Opens, to, Closes, Closed.
  Hours they pick up the marketing phone. No Appointment note.
- **Logo** — pick from the media library.
- **Facebook** — `facebook_profile_url`. Link when unlinked (paste URL this pass);
  URL + Change when linked. Same link as review import.
- **Google Maps listing** — `google_maps_listing_url`. Same link pattern. Certifications and
  reviews imports from that listing.

## Shared by everyone

- **Onboarding** builds these details (from the company registry record, Google Maps listing, and the client interview).
- **The website** shows them — including on the contact website page and service website pages
  (top menu and footer are edited in the website editor).
- **Ads** read them — the business name, trade, marketing phone, marketing email, and services become the ad copy,
  and the ideal customer profile starts from the same details.

One source of truth: the business profile. Editing it here changes the website and the next ad draft.
If ad copy conflicts with these details, prefer updating Details rather than leaving a second
truth only in the ad. Ads may also write a detail here via a tool call (`business_profile_edits`);
the owner sees a **notification** in Ads (OK keeps it; Revert undoes that increment).

How the owner reaches it: [frontend.md](frontend.md). Port:
[frontend-debloat.md](frontend-debloat.md). Decisions: [ADR.md](ADR.md). Look:
[website design-decisions](../../website/design-decisions.md). HTTP:
[api.md](api.md). Tables: [persistence.md](persistence.md). Projects:
[website HTTP](../../website/api.md).
