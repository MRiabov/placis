import { describe, expect, it } from "vitest";

import { setupEventsStreamUrl } from "./setup";
import {
  meaningfulSetupRefreshEvents,
  openSetupEventsStream,
  setupStreamEventTypes,
} from "./eventsStream";

describe("setup events stream", () => {
  it("exposes one adapter over the stream url", () => {
    // The adapter encapsulates the EventSource transport (transport-boundary
    // rule); node tests can only verify its shape, not the stream itself.
    expect(typeof openSetupEventsStream).toBe("function");
    expect(setupEventsStreamUrl("setup-session-1")).toContain(
      "/api/v1/setup-sessions/setup-session-1/events/stream",
    );
  });

  it("lists the stream event types", () => {
    expect(setupStreamEventTypes).toContain("setup.snapshot");
    expect(setupStreamEventTypes).toContain(
      "setup.website_generation_completed",
    );
  });

  it("keeps meaningful refresh events within the stream types", () => {
    for (const eventType of meaningfulSetupRefreshEvents) {
      expect(setupStreamEventTypes).toContain(eventType);
    }
  });
});
