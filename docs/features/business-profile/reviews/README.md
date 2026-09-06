# Reviews

The **All reviews** / **top reviews** picker (ads) on the Certifications
and reviews screen (`/cms/certifications-and-reviews`). Rows live on
[business profile persistence](../details/persistence.md). HTTP:
[api.md](api.md). Go: `internal/profile/reviews/`.

The same Profile screen also has certification ticks: [certifications](../certifications/README.md). Screen:
[frontend.md](frontend.md). [ADR](ADR.md). Look: [design decision record](design-decision-record.md). Withdrawn port:
[frontend-debloat.md](frontend-debloat.md). Tests: [testing.md](testing.md) (HTTP 1:1 stays Details
`testing.md`). Files:
[business profile file trees](../file-trees.md).

How the owner reaches it:
[CMS frontend](../../../general-architecture/cms/frontend.md) (left nav).

Each **reviews website section** may later have an ordered
`website_slot_reviews` list from Content / `update_reviews`. First pass
resolves `{{reviews.1}}` … from the ranked pool
([build-profile](../../onboarding/pipeline/build-profile.md)). That is
not this screen’s pin of **top reviews**.
