import { describe, expect, it } from "vitest";

import type { ProgressEventRead } from "../voice/types";
import {
  WAIT_TEASER_CAP_MS,
  waitTeaserShouldOpenPreview,
} from "./waitTeaser";

function event(event_type: string): ProgressEventRead {
  return {
    event_type,
    id: event_type,
    payload: {},
    setup_session_id: "setup-session-1",
  };
}

describe("waitTeaserShouldOpenPreview", () => {
  it("opens after the 15s cap", () => {
    expect(waitTeaserShouldOpenPreview([], WAIT_TEASER_CAP_MS)).toBe(true);
    expect(waitTeaserShouldOpenPreview([], WAIT_TEASER_CAP_MS - 1)).toBe(false);
  });

  it("opens when website copy generation completes", () => {
    expect(
      waitTeaserShouldOpenPreview([event("generation.completed")], 0),
    ).toBe(true);
  });

  it("does not open on a leftover preview-ready token event", () => {
    expect(
      waitTeaserShouldOpenPreview(
        [event("generation.website_preview_ready")],
        0,
      ),
    ).toBe(false);
  });

  it("stays on the wait teaser when generation failed", () => {
    expect(
      waitTeaserShouldOpenPreview(
        [event("generation.failed")],
        WAIT_TEASER_CAP_MS,
      ),
    ).toBe(false);
  });
});
