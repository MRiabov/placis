# public.form.lead

## Purpose

Use this component to render a public lead, quote, booking, or contact form from
CMS form definitions.

## Best Fit

Good for conversion sections where the CMS owns the form fields and CRM owns the
submitted lead/customer record.

## Avoid

Avoid hardcoded forms or forms without a validated `submit_action` and privacy
notice.

## Key Props

Use `form_id`, title/copy, `submit_label`, `submit_action`, fields, privacy
copy, and optional `contact_details` when source contact information should sit
inside the same conversion section.

## Style And Composition

The style preset should control field spacing, button treatment, error states,
and panel surface. Place it after enough context and proof for the offer.
