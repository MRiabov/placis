# Audit

Conventions for reconstructable trails. There is no Postgres schema
`audit` and no `internal/audit` package. Do not invent event tables.
[ADR](ADR.md) 7.

Trails already live on the owning feature:

| Trail | Owner |
| --- | --- |
| Business profile increments (`business_profile_edits`) | [Details](../features/business-profile/details/persistence.md) |
| Unpublished website `edit_history` | [Website](../features/website/persistence.md) |
| Website publications (`website_publications`) | [Website](../features/website/persistence.md) |
| Website activations (`website_activations`) | [Onboarding](../features/onboarding/persistence.md) |
| Ad reviews (`ad_reviews`) | [Ads](../features/ads/persistence.md) |
| LLM traces (`ai.ai_generations`) | [AI layer](../infrastructure/ai/README.md) |

Platform-admin impersonation is Clerk-native in prod (Dashboard /
Backend API `actor` on the Clerk session). Placis does not duplicate
that trail. Impersonation as a Placis product is deferred.
