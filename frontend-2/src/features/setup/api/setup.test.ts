import { describe, expect, it } from "vitest";

import {
  autocompleteGooglePlaces,
  createGooglePlaceSetupWorkflow,
  createGuidedSetupSession,
  createSetupTextInterviewSubmission,
  getSetupProfile,
  getSetupProfileChecklist,
  recordSetupProfileFacts,
  saveSetupTextInterviewDraft,
  searchCompanyRegistry,
  selectCompanyRegistryRecord,
  setupApiErrorMessage,
  setupEventsStreamUrl,
} from "./setup";
import {
  createSetupVoiceAgentDebugEvent,
  createSetupVoiceAgentEvent,
  createSetupVoiceAgentSession,
} from "./voice";

describe("setup api", () => {
  it("creates a guided setup session", async () => {
    const session = await createGuidedSetupSession();
    expect(session.id).toBe("setup-session-1");
    expect(session.requested_modules).toEqual(["website", "dashboard"]);
  });

  it("loads the setup profile", async () => {
    const profile = await getSetupProfile("setup-session-1");
    expect(profile.completeness.percent).toBe(42);
  });

  it("loads the setup checklist", async () => {
    const checklist = await getSetupProfileChecklist("setup-session-1");
    expect(checklist).toHaveLength(2);
    expect(checklist[0]?.id).toBe("business_identity.display_name");
  });

  it("searches the company registry", async () => {
    const result = await searchCompanyRegistry({ query: "Bellfield" });
    expect(result.candidates?.[0]?.legal_name).toContain("Bellfield");
  });

  it("builds the events stream url", () => {
    const url = setupEventsStreamUrl("setup-session-1");
    expect(url).toContain("/api/v1/setup-sessions/setup-session-1/events/stream");
    expect(url).toContain("heartbeat_seconds=1");
    expect(url).toContain("poll_seconds=0.25");
  });

  it("extracts api error messages from the error detail", () => {
    expect(
      setupApiErrorMessage({ detail: { message: "Checklist is blocked." } }),
    ).toBe("Checklist is blocked.");
    expect(setupApiErrorMessage({ detail: "Plain message" })).toBe(
      "Plain message",
    );
    expect(setupApiErrorMessage(null)).toBeNull();
  });
});

describe("setup voice api", () => {
  it("saves a voice agent event with a markdown receipt", async () => {
    const event = await createSetupVoiceAgentEvent("setup-session-1", {
      confidence: "high",
      event_type: "obtained_information",
      field_path: "business_identity.display_name",
      needs_confirmation: false,
      value: { kind: "text", value: "Bellfield Construction" },
    });
    expect(event.event_type).toBe("obtained_information");
    expect(event.tool_result_markdown).toContain("Saved business name");
  });

  it("fails the autocomplete request on validation errors", async () => {
    await expect(
      autocompleteGooglePlaces({ input: "" }),
    ).rejects.toThrow("Failed to search Google Maps listings");
  });

  it("creates a voice agent session in plan mode", async () => {
    const session = await createSetupVoiceAgentSession("setup-session-1");
    expect("connection_url" in session).toBe(true);
  });

  it("records a debug event", async () => {
    const debug = await createSetupVoiceAgentDebugEvent("setup-session-1", {
      event_type: "transcript",
      final: false,
      role: "assistant",
    });
    expect(debug).toBeDefined();
  });
});

describe("setup session mutations", () => {
  it("starts a workflow from a google place", async () => {
    const workflow = await createGooglePlaceSetupWorkflow({
      google_place_id: "google-place-1",
    });
    expect(workflow.next_step).toBeDefined();
  });

  it("selects a company registry record", async () => {
    const selection = await selectCompanyRegistryRecord("setup-session-1", {
      candidate: {
        company_number: "IE123456",
        confidence: "high",
        country: "IE",
        id: "candidate-1",
        legal_name: "Bellfield Construction Ltd",
        match_reason: "name",
        provider: "cro",
        registry_id: "registry-1",
        registry_name: "CRO",
      },
    });
    expect(selection.setup_session).toBeDefined();
  });

  it("records profile facts", async () => {
    const profile = await recordSetupProfileFacts("setup-session-1", {
      facts: [
        {
          confidence: "high",
          field_path: "contact.phone",
          needs_confirmation: false,
          source_type: "contractor_answer",
          value: { kind: "text", value: "+353 1 234 5678" },
        },
      ],
    });
    expect(profile.completeness.percent).toBe(42);
  });

  it("creates and autosaves a text interview submission", async () => {
    const submission = await createSetupTextInterviewSubmission(
      "setup-session-1",
      {
        country: "IE",
        display_name: "Bellfield Construction",
        phone: "+353 1 234 5678",
        photo_choice: "source_from_google",
        reviews_unavailable: false,
      },
    );
    expect(submission.id).toBe("submission-1");

    const draft = await saveSetupTextInterviewDraft("setup-session-1", {
      country: "IE",
      display_name: "Bellfield Construction Ltd",
      phone: "+353 1 234 5678",
      photo_choice: "source_from_google",
      reviews_unavailable: false,
    });
    expect(draft.id).toBe("submission-1");
  });
});
