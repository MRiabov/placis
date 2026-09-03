package main

// leftoverDocs is structured Routes Method+path strings that do not yet
// have a ### TestHappyPath* whose Exercise is that one Method+path. An
// op may only disappear in the same PR that adds the heading. A Go
// func does not shrink this list. A new structured Routes cell fails
// immediately.
var leftoverDocs = []string{
	"DELETE /v1/ads/{ad_id}",
	"GET /openapi.json",
	"GET /v1/ads",
	"GET /v1/ads/{ad_id}",
	"GET /v1/ads/{ad_id}/variants",
	"GET /v1/assistant/thread",
	"GET /v1/assistant/thread/ws",
	"GET /v1/billing/usage",
	"GET /v1/health",
	"PATCH /v1/ads/{ad_id}",
	"PATCH /v1/ads/{ad_id}/variants/{variant_id}",
	"POST /v1/ads",
	"POST /v1/ads/{ad_id}/ad-set",
	"POST /v1/ads/{ad_id}/approve",
	"POST /v1/ads/{ad_id}/archive",
	"POST /v1/ads/{ad_id}/download",
	"POST /v1/ads/{ad_id}/generate",
	"POST /v1/ads/{ad_id}/unarchive",
	"POST /v1/ads/{ad_id}/variants/{variant_id}/rewrite",
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
