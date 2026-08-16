import { describe, expect, it } from "vitest";

import { voiceEventFromToolCall } from "./protocol";

describe("setup voice protocol", () => {
  it("maps setup_end_interview tool calls into typed voice events", () => {
    expect(
      voiceEventFromToolCall("setup_end_interview", {
        completed_required_row_ids: [
          "business_identity.display_name",
          "contact.email",
        ],
        handoff_summary: "The contractor approved generation.",
        needs_confirmation_row_ids: [],
        ready_for_generation: true,
        remaining_unresolved_row_ids: [],
      }),
    ).toEqual({
      completed_required_row_ids: [
        "business_identity.display_name",
        "contact.email",
      ],
      event_type: "end_interview",
      handoff_summary: "The contractor approved generation.",
      needs_confirmation_row_ids: [],
      ready_for_generation: true,
      remaining_unresolved_row_ids: [],
    });
  });

  it("rejects unknown tool names", () => {
    expect(voiceEventFromToolCall("unknown_tool", {})).toBeNull();
  });
});
