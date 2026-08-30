import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Loader2,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { previewUrlForToken } from "@/shared/lib/navigation";
import { OnboardingStatus, StreamState } from "../model/onboarding";
import type { ProgressEventRead } from "../voice/types";
import {
  formatEventTime,
  isGenerationProgressEvent,
  latestGenerationStateEvent,
  progressEventLabel,
  visibleProgressEvents,
} from "./progress";
import { WebsiteComponentEditPreview } from "./WebsiteComponentEditPreview";

export type GenerationPanelProps = {
  onResumeGeneration?: () => void;
  previewPackage: import("../model/onboarding").SetupOnboardingState["previewPackage"];
  progressEvents: ProgressEventRead[];
  resumeActionBusy?: boolean;
  setupSessionId?: string;
  status: OnboardingStatus;
  streamState: StreamState;
};

export function GenerationPanel({
  onResumeGeneration,
  previewPackage,
  progressEvents,
  resumeActionBusy,
  setupSessionId,
  status,
  streamState,
}: GenerationPanelProps): ReactNode {
  const previewToken = previewPackage?.preview_token;
  const previewPath = previewToken ? previewUrlForToken(previewToken) : "";
  const generationBlocked =
    latestGenerationStateEvent(progressEvents)?.event_type ===
    "generation.blocked";
  const generationFailed =
    latestGenerationStateEvent(progressEvents)?.event_type ===
    "generation.failed";
  const generationStopped = generationBlocked || generationFailed;
  const generationStarted = progressEvents.some(isGenerationProgressEvent);
  const websiteEditing = progressEvents.some(
    (event) =>
      event.event_type === "generation.website_editing_started" ||
      event.event_type === "generation.website_preview_ready" ||
      event.event_type === "generation.completed",
  );
  const generating =
    Boolean(setupSessionId) &&
    !previewToken &&
    !status.equals(OnboardingStatus.Error) &&
    generationStarted &&
    !generationStopped;
  const previewReady = Boolean(previewToken);
  const heroIconClassName = heroIconClass(previewReady, generationStopped);
  const heroCopy = generationPanelCopy({
    generationBlocked,
    generationFailed,
    generating,
    previewReady,
    websiteEditing,
  });

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0">
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-lg",
            heroIconClassName,
          )}
        >
          {previewReady ? (
            <CheckCircle2 className="size-7" />
          ) : generationBlocked ? (
            <AlertTriangle className="size-7" />
          ) : (
            <Loader2 className="size-7 animate-spin" />
          )}
        </span>
        <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
          {heroCopy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          {heroCopy.description}
        </p>

        {!previewToken && !generationStopped ? (
          <WebsiteComponentEditPreview progressEvents={progressEvents} />
        ) : null}

        {!previewToken && generationStopped ? (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm leading-6 text-foreground">
              {generationFailed
                ? "Your saved interview is ready to retry."
                : "We will use the saved interview and details we found to prepare the editable website draft."}
            </p>
            <button
              className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-semibold text-background transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                !setupSessionId || !onResumeGeneration || resumeActionBusy
              }
              onClick={onResumeGeneration}
              type="button"
            >
              {resumeActionBusy
                ? "Continuing generation..."
                : generationFailed
                  ? "Try generation again"
                  : "Continue generation"}
            </button>
          </div>
        ) : null}

        {previewToken ? (
          <div className="mt-6 grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-semibold text-emerald-950">
                Open the native website preview.
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-900">
                The preview opens as the actual website with review actions
                fixed to the bottom of the screen.
              </p>
            </div>
            <a
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-background transition"
              href={previewPath}
            >
              View website
              <ArrowRight className="size-4" />
            </a>
          </div>
        ) : null}
      </div>

      <ProgressTimeline
        events={progressEvents}
        previewReady={previewReady}
        generationBlocked={generationStopped}
        {...(setupSessionId ? { setupSessionId } : {})}
        streamState={streamState}
      />
    </section>
  );
}

function ProgressTimeline({
  events,
  generationBlocked,
  previewReady,
  setupSessionId,
  streamState,
}: {
  events: ProgressEventRead[];
  generationBlocked?: boolean;
  previewReady?: boolean;
  setupSessionId?: string;
  streamState: StreamState;
}): ReactNode {
  const visibleEvents = visibleProgressEvents(events);
  const status = timelineStatus({
    generationBlocked: generationBlocked ?? false,
    previewReady: previewReady ?? false,
    setupSessionId,
    streamState,
  });

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">Generation progress</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We will show generation events and the preview link as soon as they
            are ready.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {!visibleEvents.length ? (
          <div className="rounded-md border border-border bg-muted px-3 py-3 text-sm text-muted-foreground">
            {previewReady
              ? "Website preview is ready."
              : events.length
                ? "Waiting for the next setup update."
                : "Progress will appear after setup starts."}
          </div>
        ) : null}
        {visibleEvents.map((event, index) => (
          <div
            className="grid grid-cols-[18px_1fr] gap-3 rounded-md border border-border bg-background px-3 py-2"
            key={event.id ?? `${event.event_type}-${event.created_at ?? index}`}
          >
            <span className="mt-1 size-2.5 rounded-full bg-foreground" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {progressEventLabel(event.event_type)}
              </span>
              {event.created_at ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formatEventTime(event.created_at)}
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function _ClaimCta({
  onResumeGeneration,
  previewPackage,
  progressEvents,
  resumeActionBusy,
  setupSessionId,
  visible,
}: {
  onResumeGeneration?: () => void;
  previewPackage: import("../model/onboarding").SetupOnboardingState["previewPackage"];
  progressEvents: ProgressEventRead[];
  resumeActionBusy?: boolean;
  setupSessionId?: string;
  visible?: boolean;
}): ReactNode {
  if (!visible || !setupSessionId) {
    return null;
  }
  const previewToken = previewPackage?.preview_token;
  const generationBlocked =
    latestGenerationStateEvent(progressEvents)?.event_type ===
    "generation.blocked";
  const generationFailed =
    latestGenerationStateEvent(progressEvents)?.event_type ===
    "generation.failed";
  const generationStopped = generationBlocked || generationFailed;
  const generating = progressEvents.some(isGenerationProgressEvent);
  const ctaCopy = claimCtaCopy({
    generationBlocked,
    generationFailed,
    generating,
    previewToken,
  });

  return (
    <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-border bg-background/90 px-4 py-3 shadow-2xl backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Globe2 className="size-5 shrink-0 text-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {ctaCopy.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {ctaCopy.description}
          </p>
        </div>
        {previewToken ? (
          <a
            className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-foreground px-3 text-sm font-semibold text-background"
            href={previewUrlForToken(previewToken)}
          >
            Preview
            <ArrowRight className="size-4" />
          </a>
        ) : generationStopped ? (
          <button
            className="h-10 rounded-md bg-foreground px-3 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!onResumeGeneration || resumeActionBusy}
            onClick={onResumeGeneration}
            type="button"
          >
            {generationFailed ? "Retry" : "Continue"}
          </button>
        ) : (
          <button
            className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-muted-foreground"
            disabled
            type="button"
          >
            Waiting
          </button>
        )}
      </div>
    </div>
  );
}

function generationPanelCopy({
  generationBlocked,
  generationFailed,
  generating,
  previewReady,
  websiteEditing,
}: {
  generationBlocked: boolean;
  generationFailed: boolean;
  generating: boolean;
  previewReady: boolean;
  websiteEditing: boolean;
}): { description: string; title: string } {
  if (previewReady) {
    return {
      description:
        "Open the preview, then keep the draft when the claim and CMS handoff is ready.",
      title: "Your website preview is ready.",
    };
  }
  if (generationFailed) {
    return {
      description:
        "Your answers are saved. Please try generation again, or contact support if this keeps happening.",
      title: "Website generation could not finish.",
    };
  }
  if (generationBlocked) {
    return {
      description:
        "Continue generation to resume editing the draft. Nothing is published automatically.",
      title: "Website generation is paused.",
    };
  }
  if (websiteEditing) {
    return {
      description:
        "The setup agent is editing the first mobile-ready draft. Progress updates will appear here as each step lands.",
      title: "Your website is being edited.",
    };
  }
  if (generating) {
    return {
      description:
        "The setup agent is editing the first mobile-ready draft. Progress updates will appear here as each step lands.",
      title: "Your website generation has started.",
    };
  }
  return {
    description:
      "Complete the interview to start website generation. Until then, we only show setup and research progress.",
    title: "We are preparing your website plan.",
  };
}

function claimCtaCopy({
  generationBlocked,
  generationFailed,
  generating,
  previewToken,
}: {
  generationBlocked: boolean;
  generationFailed: boolean;
  generating: boolean;
  previewToken: string | undefined;
}): { description: string; title: string } {
  if (previewToken) {
    return {
      description: "Open the draft before claim.",
      title: "Preview ready",
    };
  }
  if (generationFailed) {
    return {
      description: "Try generation again.",
      title: "Generation failed",
    };
  }
  if (generationBlocked) {
    return {
      description: "Continue generation to resume the draft.",
      title: "Generation paused",
    };
  }
  if (generating) {
    return {
      description: "We will show the draft here.",
      title: "Website generating",
    };
  }
  return {
    description: "Generation starts after the interview is complete.",
    title: "Preparing setup",
  };
}

function heroIconClass(
  previewReady: boolean,
  generationStopped: boolean,
): string {
  if (previewReady) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (generationStopped) {
    return "bg-red-50 text-red-700";
  }
  return "bg-amber-50 text-amber-700";
}

function timelineStatus({
  generationBlocked,
  previewReady,
  setupSessionId,
  streamState,
}: {
  generationBlocked: boolean;
  previewReady: boolean;
  setupSessionId: string | undefined;
  streamState: StreamState;
}): { className: string; label: string } {
  if (generationBlocked) {
    return { className: "bg-red-50 text-red-700", label: "Blocked" };
  }
  if (previewReady) {
    return { className: "bg-emerald-50 text-emerald-700", label: "Ready" };
  }
  if (streamState.equals(StreamState.Connected)) {
    return { className: "bg-emerald-50 text-emerald-700", label: "Live" };
  }
  if (streamState.equals(StreamState.Reconnecting)) {
    return { className: "bg-amber-50 text-amber-700", label: "Reconnecting" };
  }
  if (setupSessionId) {
    return { className: "bg-muted text-muted-foreground", label: "Closed" };
  }
  return { className: "bg-muted text-muted-foreground", label: "Waiting" };
}
