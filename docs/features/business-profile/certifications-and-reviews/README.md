# Certifications and reviews

The Profile screen at `/cms/certifications-and-reviews`: certification ticks and
the **All reviews** / **top reviews** picker (ads). The review and certification
**rows** live on [details persistence](../details/persistence.md). HTTP:
[details HTTP](../details/api.md).

How the owner reaches it: [CMS frontend](../../../general-architecture/cms/frontend.md). Screen: [frontend.md](frontend.md). [ADR](ADR.md). Look:
[design decision record](design-decision-record.md). Port: [frontend-debloat.md](frontend-debloat.md).

Each **reviews website section** may later have an ordered
`website_slot_reviews` list from Content / `update_reviews`. First pass
resolves `{{reviews.1}}` … from the ranked pool
([ADR](ADR.md)). That is not this screen’s pin of **top reviews**.
