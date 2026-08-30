import type { ProgressEventRead } from "../voice/types";
import { latestGenerationStateEvent } from "./progress";

export const WAIT_TEASER_CAP_MS = 15_000;

export function waitTeaserBlocked(events: ProgressEventRead[]): boolean {
  const latest = latestGenerationStateEvent(events)?.event_type;
  return latest === "generation.blocked" || latest === "generation.failed";
}

export function waitTeaserCopyDone(events: ProgressEventRead[]): boolean {
  return events.some((event) => event.event_type === "generation.completed");
}

/** Wait teaser ends on copy-done or the 15s cap — not a leftover preview token. */
export function waitTeaserShouldOpenPreview(
  events: ProgressEventRead[],
  elapsedMs: number,
): boolean {
  if (waitTeaserBlocked(events)) {
    return false;
  }
  return waitTeaserCopyDone(events) || elapsedMs >= WAIT_TEASER_CAP_MS;
}
