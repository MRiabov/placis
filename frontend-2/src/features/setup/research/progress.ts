import type { ProgressEventRead } from "../voice/types";

const stickyProgressEventTypes = new Set([
  "generation.queued",
  "generation.started",
  "generation.blocked",
  "generation.failed",
  "generation.website_editing_started",
  "generation.website_components_edited",
  "generation.website_preview_ready",
  "generation.completed",
]);

export function mergeProgressEvents(
  primary: ProgressEventRead[],
  secondary: ProgressEventRead[],
): ProgressEventRead[] {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((event, index) => {
    const key = event.id ?? `${event.event_type}-${event.created_at ?? index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export type RetainProgressEventsOptions = {
  limit?: number;
};

export function retainProgressEvents(
  events: ProgressEventRead[],
  { limit = 12 }: RetainProgressEventsOptions = {},
): ProgressEventRead[] {
  const stickyEventsByType = new Map<string, ProgressEventRead>();
  for (const event of events) {
    if (stickyProgressEventTypes.has(event.event_type)) {
      stickyEventsByType.set(event.event_type, event);
    }
  }
  const recentStart = Math.max(0, events.length - limit);
  return events.filter((event, index) => {
    if (index >= recentStart) {
      return true;
    }
    return stickyEventsByType.get(event.event_type) === event;
  });
}

export function visibleProgressEvents(
  events: ProgressEventRead[],
): ProgressEventRead[] {
  return events.filter((event) => event.event_type !== "setup.heartbeat");
}

const progressEventLabels: Record<string, string> = {
  "generation.blocked": "Website generation paused",
  "generation.completed": "Website generation completed",
  "generation.failed": "Website generation failed",
  "generation.queued": "Website generation queued",
  "generation.started": "Website generation started",
  "generation.website_blueprint_selected": "Website style selected",
  "generation.website_components_edited": "Website component edited",
  "generation.website_draft_instantiated": "Website draft assembled",
  "generation.website_editing_started": "Editing your website draft",
  "generation.website_preview_ready": "Website preview ready",
  "research.jobs.enqueued": "Checking public business details",
  "research.session.created": "Preparing source checks",
  "setup.business_research_completed": "Business details checked",
  "setup.company_registry_selected": "Company record selected",
  "setup.google_place_workflow_started": "Google Maps listing selected",
  "setup.interview_completed": "Interview completed",
  "setup.contract_version_created": "Website plan prepared",
  "setup.heartbeat": "Still working on the preview",
  "setup.progressive_refinement_completed":
    "Preview refreshed from new setup facts",
  "setup.progressive_refinement_started":
    "Refreshing the preview from new setup facts",
  "setup.snapshot": "Website profile refreshed",
  "setup.voice_agent_confirmed_conflict": "Confirmed an interview answer",
  "setup.voice_agent_interview_plan_updated": "Interview plan updated",
  "setup.voice_agent_lookup_completed": "Voice-requested lookup completed",
  "setup.voice_agent_lookup_failed": "Voice-requested lookup failed",
  "setup.voice_agent_lookup_pending_consent": "Lookup waiting for consent",
  "setup.voice_agent_lookup_profile_ingested": "Lookup facts added to profile",
  "setup.voice_agent_lookup_requested": "Lookup requested from interview",
  "setup.voice_agent_lookup_started": "Lookup started from interview",
  "setup.voice_agent_marked_information_status": "Checklist status updated",
  "setup.voice_agent_obtained_information": "Interview answer saved",
  "setup.voice_agent_session_created": "Voice interview session started",
};

export function progressEventLabel(eventType: string): string {
  return progressEventLabels[eventType] ?? eventType.replaceAll(".", " ");
}

export function formatEventTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isGenerationProgressEvent(event: ProgressEventRead): boolean {
  return (
    event.event_type === "generation.queued" ||
    event.event_type === "generation.started" ||
    event.event_type === "generation.failed" ||
    event.event_type === "generation.website_editing_started" ||
    event.event_type === "generation.website_components_edited" ||
    event.event_type === "generation.completed" ||
    event.event_type === "generation.website_preview_ready"
  );
}

export function latestGenerationStateEvent(
  events: ProgressEventRead[],
): ProgressEventRead | undefined {
  return [...events].reverse().find((event) => {
    if (
      event.event_type === "generation.blocked" ||
      event.event_type === "generation.failed"
    ) {
      return true;
    }
    return isGenerationProgressEvent(event);
  });
}
