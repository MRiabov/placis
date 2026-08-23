---
version: alpha
name: Public Site Blueprint Content System
description: "Google-style DESIGN.md reference for CMS blueprint content composition and runtime template selection."
selection_axes:
  status:
    - stub
    - ready
  production_selectable:
    - true
    - false
  selection_visibility:
    - public
    - internal
  source_type:
    - structural_stub
    - source_backed_reference
    - generated_template
  page_types:
    - home
    - service
    - quote_contact
    - privacy
    - campaign
  content_fit:
    - section_sequence
    - navigation_shape
    - proof_depth
    - imagery_availability
    - conversion_path
    - source_confidence
content_roles:
  navigation: global identity, key links, and primary contact paths
  hero: first-viewport proposition, proof cue, media, and primary call to action
  services: repeatable offer or capability content
  proof: reviews, accreditations, supplier marks, and trust evidence
  gallery: project or work imagery with source/provenance metadata
  faq: objections and qualification questions
  conversion: forms, callback prompts, and contact calls to action
  footer: persistent legal, navigation, and contact summary
blueprint_records:
  metadata: id, name, status, production_selectable, selection_visibility, deprecated, description, nullable modelled_after alias array, and source provenance
  forms: reusable form definitions created with the page draft
  pages: page path, SEO fields, navigation, and ordered section records
  sections: public component IDs, content props, design controls, and source references
  source_refs: imported-site evidence used for review, QA, and later edits
required_docs:
  folder_design_doc: src/blueprints/DESIGN.md
  per_blueprint_docs: "BLUEPRINT.md beside each <page-type>/<site-or-template>/blueprint.json"
  style_boundary: "Theme/style preset DESIGN.md owns colors, typography, radius, spacing, density, and visual states."
---

# Public Site Blueprint Content System DESIGN.md

## Overview

CMS page blueprints are backend-readable content and composition factories. They live under
`<page-type>/<template-slug>/` so agents select by page intent first, then content/structure variant.
They describe which page, forms, navigation items, public component sections, content props, source
references, and style preset references should be used when creating tenant-owned CMS records.

Blueprints encode content structure. Style presets encode visual style. A blueprint may reference a
style preset by ID so the generated page has a starting look, but it must not define colors,
typography, rounding, spacing, density, motion, or visual states.

Blueprints may include starter content. Source-backed reference blueprints should keep the source
website's real copy, service descriptions, reviews, proof claims, and images where those are part of
the decomposition. That content is still seed content for tenant-owned CMS records. After a blueprint
is applied, normal CMS draft records own the editable content; later edits must not depend on
rewriting the blueprint JSON.

Every blueprint JSON must include nullable `modelled_after`. Use it as the single reusable metadata
field for source aliases the blueprint was modelled after, or `null` when the blueprint is a
structural stub or generated template. When present, `modelled_after` must be an array of non-empty
strings so aliases such as legal names, display names, and compact source names can be checked
together. Source brand names belong in `modelled_after`, source references, provenance metadata, and
review notes. They must not leak into rendered seed copy, default slot values, reusable blueprint
folder names, `id`, `name`, `description`, `BLUEPRINT.md`, form IDs, companion IDs, theme IDs,
component IDs, package exports, CSS classes, or renderer selectors.

Blueprints also must not encode company-size or business-type affinity. Avoid reusable labels and
guidance such as `contractor`, `enterprise`, `commercial`, `residential`, `small`, `large`, `smb`,
or `solo`. A blueprint is a blueprint: select it by page shape, section requirements, proof depth,
navigation needs, imagery availability, and conversion path, not by assuming a tenant's company size
or market category.

## Orthogonality Contract

Blueprints, content, public components, and style presets are separate contracts:

| Layer | Blueprint relationship |
| -- | -- |
| CMS content records | Blueprints seed editable content records; they are not the long-term content model. |
| Public components | Blueprints reference registered `public.*` component IDs and valid props; they do not define renderer markup or private component behavior. |
| Style presets | Blueprints may reference a preset ID as a starting style; they do not define palette, type, spacing, density, radius, hover/focus states, or visual CSS. |
| Publication manifests | Blueprints help create drafts; they are not published manifests and are not public runtime state. |

Changing one layer should not force changes in the others. A style preview should be able to render
the same blueprint-applied CMS content through a different compatible style preset. A component swap
should preserve compatible slots and produce review fields for anything that cannot map safely. A
new blueprint should not add source-site-specific selectors, one-off CSS, or arbitrary HTML to make
its visual design work.

## Content Model

A blueprint record should answer what the page contains: the page type, section sequence, business
copy, source-backed claims, service lists, proof, reviews, image references, form fields, navigation,
and conversion paths. Tenant-editable facts belong in CMS records created from the blueprint, not in
component documentation or style preset documentation.

## Default Slot Values And Variables

Component contracts may include durable `default_values` entries. Use those for generic defaults
that should seed newly inserted components regardless of the page blueprint. Blueprint folders may
also include a durable `default_slot_values.json` sidecar for blueprint-specific overrides that
should survive beyond local seed scripts.

Default values may be literals or variable tokens. Variable tokens use double braces, for example
`{{business_name}}`, `{{phone}}`, `{{email}}`, `{{address}}`, `{{website_url}}`, `{{trade}}`,
`{{service_area}}`, `{{service_region}}`, `{{opening_hours}}`, researched people facts such as
`{{people.founder.name}}`, and typed namespaces such as `{{images.logo}}`. These
tokens resolve from tenant-owned business facts and CMS source libraries only when the backend
materializes the public publication snapshot.

Tokens should preserve type when the token is the whole value. A scalar fact resolves to a scalar,
a list fact resolves to a list, and an image fact such as `{{images.logo}}` resolves to an image
object with asset id, durable URL, alt text, description, review status, and provenance. Use legacy
string URL tokens such as `{{logo_url}}` only for current components that still expose URL-backed
image props; new component and blueprint work should prefer image-object slots.

Image source libraries should use short, stable, distinct keys. When imported or uploaded filenames
look like dates, hashes, camera defaults, CDN derivative names, or generic `image0` labels, the
image-description step should also assign a canonical name such as `logo`, `roof_repair_hero`, or
`bathroom_before_1`. Store the original filename as provenance, but do not require agents or
component defaults to refer to unreadable filenames.

The backend is responsible for loading and validating component `default_values` and
`default_slot_values.json` against registered component contracts. It should reject unknown component
IDs, invalid prop/slot paths, unsupported variable tokens, and defaults that do not match the slot
type. Python code may contain the resolver logic, but it should not contain per-blueprint marketing
copy or per-component default copy that belongs in JSON sidecars/contracts.

Variable defaults are not public runtime dependencies. CMS draft records, editor projections, and
editor previews intentionally keep tokens such as `{{phone}}` visible/editable. Created rows should
keep metadata that identifies the source variable so the editor can show friendly variable
chips/cards. Publication snapshots resolve the tokens into end-user values before the public runtime
renders them.

Reference blueprints extracted from real websites should keep real source copy in `blueprint.json`
for service descriptions, reviews, proof claims, and distinct marketing language. Use variable
defaults for stable tenant facts that are reused across components, such as navigation business
name, contact phone/email, footer business name, logo image, service area, and opening hours. Review
content should come from source-backed review selections, not from variable tokens that bypass the
review picker/selection contract.

Tenant-specific selections and claims such as about/story copy, services, sector tabs, project or
news galleries, accreditation lists, region/service-area proof, people/team stories, metrics, and
proof counts should not be treated as static reusable props when applying a reference blueprint to
another tenant. Store those values in `default_slot_values.json` with `mandatory_edit`,
`review_required`, source/candidate metadata, and a typed research or collection variable such as
`{{services.featured}}`, `{{projects.featured}}`, `{{projects.projects_page}}`,
`{{proof.accreditations}}`, `{{proof.company_metrics}}`, or `{{about.intro_paragraphs}}`. The
backend may use the source-reference values as fallback starter content, but researched tenant values
and tenant-owned CMS records should win when available. Assistant/editor context should expose the
default metadata so the LLM sees which values were inherited from the source template and must be
picked, reranked, rewritten, or removed. Publication validation must block any unresolved
`mandatory_edit` default until a CMS edit clears that field's marker or a later explicit approval
workflow records the value as accepted.

Projects are typed CMS records, not ordinary reusable blueprint props. Project-page blueprints should
live under `src/blueprints/projects/<site-or-template>/` and be modelled after real source
project/gallery/work pages where available. Applying a projects blueprint may create a Projects page,
listing sections, detail sections, and project-selection defaults, but the canonical project title,
short website description, longer project-page description, images, provenance, status, and
placement switches belong to tenant-owned project records. A project blueprint that was not extracted
from a real source Projects page should say so in `BLUEPRINT.md` and remain a documented structural
stub with review blockers, not invented project content.

Service-page route variants and form option generation still need a first-class service-selection
contract. Until that exists, reference blueprints should avoid embedding inherited service options
in ordinary forms and should keep service-specific route sets isolated to service-page blueprints
with clear source/reference status.

## Template Selection

Runtime agents should choose a blueprint from content fit before choosing a style. Use the blueprint
metadata and per-blueprint docs to match source confidence, page type, section needs, proof depth,
imagery availability, navigation shape, and conversion path. Use the style preset docs separately to
choose or tune the visual system. Do not choose from business-size labels or market/category labels.

Only blueprints with `production_selectable: true`, `selection_visibility: public`, and
`deprecated: false` are valid runtime/assistant selection candidates for customer-visible websites.
Structural stubs and internal fixtures may remain loadable by direct ID for backend/editor tests, but
they must not be supplied in normal agent selection guidance or hard-typed LLM selection tools.

## Runtime LLM Use

Provide this folder DESIGN.md plus the matching per-folder `BLUEPRINT.md` files to template-selection
agents. The folder DESIGN.md explains the selection contract; each per-blueprint doc explains when
that specific blueprint is appropriate and what content it expects. Agents should choose the page
type first, then the content/structure variant. Agents should not infer visual taste from blueprint
docs except for the referenced style preset ID, and should not infer organization scale or service
category from a blueprint.

## Style Boundary

The `theme` field is a compatibility link to the selected CMS style preset. It is not a local style
definition. The canonical visual contract lives in `packages/website-components/src/themes/`
and its `DESIGN.md`: color roles, Radix Colors mapping, typography, radius, spacing, density, imagery
treatment, interactive states, and responsive visual behavior.

## Components

Blueprint sections must use registered `public.*` component IDs with valid props and governed design
controls. If a source website needs a new structure, add or extend a reusable registry component with
`component.tsx`, `contract.json`, and `docs.md`; do not hide one-off HTML, CSS, scripts, or source
framework markup inside blueprint JSON.

## Do's and Don'ts

- Do document every blueprint with a compact `BLUEPRINT.md` sidecar for runtime selection.
- Do include nullable `modelled_after` in every `blueprint.json`; use an array of source aliases or
  `null`.
- Do keep source brand names limited to `modelled_after`, source references, provenance metadata,
  and review notes.
- Do keep source-backed service copy, reviews, FAQs, proof claims, and non-fact page copy in blueprint
  props or generated CMS records.
- Do variable-back reusable tenant facts, personal names/profiles, contact details, service area, and
  images instead of hardcoding the reference tenant's values in rendered props.
- Do store reusable blueprint defaults in `default_slot_values.json` instead of seed-only scripts or
  Python constants.
- Do mark inherited about/story copy, service lists, sector/service tabs, proof counts,
  accreditation lists, people/team stories, region stats, recent projects, and news/project cards as
  `mandatory_edit` defaults when they are candidates rather than verified tenant facts.
- Do use variable tokens for tenant facts that should follow the business profile.
- Do use typed image variables such as `{{images.logo}}` for image-object slots when the component
  contract supports them.
- Do keep imported-site evidence in source references so claims can be reviewed later.
- Do select blueprints by content requirements such as section sequence, proof depth, imagery,
  navigation, and conversion path.
- Don't put colors, typography, radius, spacing, density, motion, or visual states in blueprint docs.
- Don't treat blueprint JSON as a tenant's long-term editable CMS model.
- Don't include raw HTML, JavaScript, arbitrary CSS, remote scripts, or one-off component IDs.
- Don't put source brands, company-size labels, or business-type affinity in reusable blueprint
  identity, sidecar docs, companion IDs, form IDs, component IDs, theme IDs, exports, or CSS classes.
- Don't replace source-backed reviews, proof claims, or meaningful page copy with variables except
  for embedded tenant facts such as business names, contact details, service area, people profiles,
  and images.
- Don't leave selected service lists, project lists, or accreditation lists as unmarked reusable
  component props when they should be picked from business research or typed CMS records.
- Don't add new URL-only image fields when an image-object slot can carry asset id, alt text,
  description, crop/focal point, review status, and provenance.
