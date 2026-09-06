# File trees — assistant

CMS `/v1/assistant`. Onboarding guide and unpaid website editor are
onboarding packages ([onboarding file trees](../onboarding/file-trees.md)).
High-level: [module layout](../../general-architecture/module-layout.md),
[frontend stack](../../general-architecture/frontend-stack.md).
[architecture.md](architecture.md). [ADR](ADR.md) 31. Omit `*_test.go` /
`*.test.*`.

Dispatcher **calls** `website/assistant` and `ads/assistant`. It does not
import those pipelines. Assistants must not import each other’s
`knowledge/`. `infrastructure/ai` load/interpolate only.

## Backend

```text
internal/assistant/
  api.go                            # Register + picks Clerk active helper
                                    # GetAssistantThread, CreateAssistantThread,
                                    # StreamAssistantThread (WS),
                                    # RecordAssistantApply / Reject,
                                    # Voice realtime / tool-calls / transcripts /
                                    # recordings
  dto.go
  dispatcher.go                     # text + Voice loop; **calls**
                                    # website/assistant + ads/assistant
  prompts.yaml                      # wrap-up, reject, STT notice, compaction,
                                    # Voice seed
  jobs.go                           # CompactAssistantThread
                                    # (assistant_thread_compaction)
  knowledge/
    knowledge_base_registry.yaml    # id assistant.knowledge
    knowledge_product_glossary.md   # Domain + Enums + Don't say
    pronunciation.yaml              # Voice pronunciation yaml
  store/                            # sqlc for assistant.thread_items / runs
    queries.sql
```

Thread identity is `ai.threads` (`infrastructure/ai` store). Overlay
items/runs are this `store/`.

## Frontend

DustOrb is `src/shared/ui/DustOrb.tsx` (second-caller). Do not put
`ui/CmsAssistant`. Onboarding website preview **imports** this folder
(different HTTP ops). Ads also mounts it (`cleanup_image` only).

```text
frontend-3/src/features/cms/assistant/
  Assistant.tsx                     # call button, thread, composer, Apply/Reject
                                    # pills (workspace, not on the canvas)
```
