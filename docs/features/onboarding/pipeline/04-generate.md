# 04 — Generate (deterministic)

After the interview completes, generation starts from the final accepted profile version.

**Population** — the profile + trade blueprint become draft CMS records, not raw code:

1. assemble the stable facts: services, service areas, proof assets, contact, business details;
2. deterministic rules (or an AI proposal) choose page structure, section composition, copy
   direction, CTA hierarchy, style tokens, image-slot intent, SEO, review flags;
3. create draft `website_pages` / `website_page_versions` / `website_sections` / `content_slots`
   (placeholders kept);
4. pick or generate image assets — prefer real proof/customer media, generate only when approved;
5. validate against component contracts, the registry, claims, links, forms, SEO.

- **Persists** the draft CMS records above — nothing published.
