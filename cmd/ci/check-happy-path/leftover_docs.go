package main

// leftoverDocs is structured Routes Method+path strings that do not yet
// have a ### TestHappyPath* whose Exercise is that one Method+path. An
// op may only disappear in the same PR that adds the heading. A Go
// func does not shrink this list. A new structured Routes cell fails
// immediately.
var leftoverDocs = []string{
	"GET /openapi.json",
	"GET /v1/assistant/thread",
	"GET /v1/assistant/thread/ws",
	"GET /v1/billing/usage",
	"GET /v1/health",
	"POST /v1/assistant/record-apply",
	"POST /v1/assistant/record-reject",
	"POST /v1/assistant/thread/new",
	"POST /v1/assistant/voice/realtime-connection",
	"POST /v1/assistant/voice/recordings",
	"POST /v1/assistant/voice/recordings/{id}/complete",
	"POST /v1/assistant/voice/tool-calls",
	"POST /v1/assistant/voice/transcripts",
	"POST /v1/billing/extra-usage-credit/checkout",
	"POST /v1/billing/subscription/cancel",
	"POST /v1/billing/subscription/checkout",
	"POST /v1/billing/subscription/keep",
}
