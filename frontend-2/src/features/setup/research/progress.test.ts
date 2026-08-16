import { describe, expect, it } from "vitest";

import {
  formatEventTime,
  isGenerationProgressEvent,
  latestGenerationStateEvent,
  mergeProgressEvents,
  progressEventLabel,
  retainProgressEvents,
  visibleProgressEvents,
} from "./progress";

const baseEvent = {
  event_type: "setup.snapshot",
  id: "event-1",
  payload: {},
  setup_session_id: "setup-session-1",
};

describe("mergeProgressEvents", () => {
  it("deduplicates events by id and by type+time", () => {
    const merged = mergeProgressEvents(
      [baseEvent, baseEvent],
      [{ ...baseEvent, event_type: "setup.heartbeat", id: "event-2" }],
    );
    expect(merged).toHaveLength(2);
  });
});

describe("retainProgressEvents", () => {
  it("keeps the recent window plus sticky generation events", () => {
    const heartbeat = { ...baseEvent, event_type: "setup.heartbeat" };
    const blocked = {
      ...baseEvent,
      event_type: "generation.blocked",
      id: "event-blocked",
    };
    const events = [
      blocked,
      ...Array.from({ length: 20 }, (_, index) => ({
        ...baseEvent,
        event_type: `setup.progressive_preresearch_profile_ingested_${index}`,
        id: `event-${index}`,
      })),
      heartbeat,
    ];
    const retained = retainProgressEvents(events, { limit: 12 });
    expect(retained).toContain(blocked);
    expect(retained).toContain(heartbeat);
    expect(retained.length).toBeLessThanOrEqual(13);
  });
});

describe("visibleProgressEvents", () => {
  it("hides heartbeats", () => {
    const visible = visibleProgressEvents([
      baseEvent,
      { ...baseEvent, event_type: "setup.heartbeat" },
    ]);
    expect(visible.map((event) => event.event_type)).toEqual([
      "setup.snapshot",
    ]);
  });
});

describe("progressEventLabel", () => {
  it("labels known events and falls back to spaced event type", () => {
    expect(progressEventLabel("setup.voice_agent_obtained_information")).toBe(
      "Interview answer saved",
    );
    expect(progressEventLabel("research.jobs.enqueued")).toBe(
      "Checking public business details",
    );
    expect(progressEventLabel("custom.event")).toBe("custom event");
  });
});

describe("formatEventTime", () => {
  it("formats timestamps and passes through invalid values", () => {
    expect(formatEventTime("not-a-date")).toBe("not-a-date");
    const formatted = formatEventTime("2026-08-08T12:00:00Z");
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe("generation event helpers", () => {
  it("detects generation events and finds the latest state event", () => {
    const started = {
      ...baseEvent,
      event_type: "generation.started",
      id: "g-1",
    };
    const blocked = {
      ...baseEvent,
      event_type: "generation.blocked",
      id: "g-2",
    };
    expect(isGenerationProgressEvent(started)).toBe(true);
    expect(isGenerationProgressEvent(baseEvent)).toBe(false);
    expect(latestGenerationStateEvent([started, blocked])?.event_type).toBe(
      "generation.blocked",
    );
  });
});
