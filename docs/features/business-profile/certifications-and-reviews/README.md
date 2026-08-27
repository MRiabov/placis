# Certifications and reviews

The Profile screen at `/cms/certifications-and-reviews`: certification ticks and the **All
reviews** / **top reviews** picker (ads). The review and certification **rows** live on
[details persistence](../details/persistence.md). HTTP:
[details HTTP](../details/api.md).

How the owner reaches it: [CMS frontend](../../../general-architecture/cms/frontend.md). Screen:
[frontend.md](frontend.md). Decisions: [ADR.md](ADR.md). Look:
[design decisions](design-decisions.md). Port: [frontend-debloat.md](frontend-debloat.md).

Each **reviews website section**’s ordered list is edited in website editor Content
([website frontend](../../website/frontend.md), [website ADR](../../website/ADR.md) 16). That is
not this screen.
