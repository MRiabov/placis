# Details

The **Details** view edits the Business details subset of the **business profile** — who they
are, contact, hours, logo, Facebook / Maps links. Onboarding builds the record; the website
shows it; ads reuse it. The owner reaches this screen from **Profile** → **Business details**.
The record is larger than this screen (reviews, certifications, projects):
[business profile](../README.md).

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
- **Facebook** — `facebook_profile_url`. Link when unlinked (paste URL this pass).
  When linked, show that Facebook profile’s **name, photo, rating, and review count**, plus
  **Change** — not the raw URL. Same link as review import. Changing it starts another public
  extract of that Facebook URL (posts and images, not only reviews).
- **Google Maps listing** — `google_maps_listing_url`. Same link pattern and the same card
  (name, photo, rating, review count from that listing). Certifications and reviews imports
  from that listing.

## Shared by everyone

- **Onboarding** builds these details (from the company registry record, Google Maps listing, and the client interview).
- **The website** shows them — including on the contact website page and service website pages
  (top menu and footer are edited in the website editor).
- **Ads** read them — the business name, trade, marketing phone, marketing email, and services become the ad copy,
  and the ideal customer profile starts from the same details.

Editing Details changes the website and the next ad draft.
If ad copy conflicts with these details, prefer updating Details rather than leaving a second
truth only in the ad. Ads may also write a detail here via a tool call (`business_profile_edits`);
the owner sees a **notification** in Ads (OK keeps it; Revert undoes that increment).

How the owner reaches it: [CMS frontend](../../../general-architecture/cms/frontend.md). This
screen: [frontend.md](frontend.md). Port:
[frontend-debloat.md](frontend-debloat.md). [ADR](ADR.md). Look:
[design decision record](design-decision-record.md). HTTP:
[api.md](api.md). Tables: [persistence.md](persistence.md). Projects:
[projects HTTP](../projects/api.md).
