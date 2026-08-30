import { ChevronLeft, Globe2 } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import {
  createSetupTextInterviewSubmission,
  saveSetupTextInterviewDraft,
} from "./api/setup";
import { FoundInformationReview } from "./checklist/FoundInformationReview";
import {
  OnboardingStatus,
  OnboardingStep,
  type SetupOnboardingState,
} from "./model/onboarding";
import { useSetupOnboarding } from "./model/useSetupOnboarding";
import { GenerationPanel } from "./research/PreviewProgressPanels";
import {
  waitTeaserBlocked,
  waitTeaserShouldOpenPreview,
} from "./research/waitTeaser";
import { BusinessSourcePanel } from "./sources/BusinessSourcePanel";
import type { SetupSources } from "./sources/useSetupSources";
import { useSetupSources } from "./sources/useSetupSources";
import { TextInterviewForm } from "./textInterview/TextInterviewForm";
import type { SetupVoiceInterview } from "./voice/useSetupVoiceInterview";
import { useSetupVoiceInterview } from "./voice/useSetupVoiceInterview";
import { PreviewAndEditPanel } from "./websitePreview/PreviewAndEditPanel";

export function OnboardingShell(): ReactNode {
  const { actions, dispatch, state } = useSetupOnboarding();
  const waitStartedRef = useRef<number | null>(null);
  const voice = useSetupVoiceInterview({
    onApplyEventResponse: (response) => {
      dispatch({ type: "profile_refreshed", profile: response.profile });
      if (response.event_type === "end_interview") {
        dispatch({ type: "interview_submitted" });
        actions.changeStep(OnboardingStep.Generating);
      }
    },
    missingChecklistRows: state.checklistRows.filter(
      (row) => row.status !== "filled_by_user",
    ),
    onAppendNotes: () => undefined,
    onNotice: actions.showNotice,
    onShowError: actions.showError,
    setupSessionId: state.setupSessionId,
  });
  const sources = useSetupSources({
    dispatchOnboarding: dispatch,
    moveToStep: actions.changeStep,
    refreshProfile: async (setupSessionId) => {
      const { getSetupProfile } = await import("./api/setup");
      const nextProfile = await getSetupProfile(setupSessionId);
      dispatch({ type: "profile_refreshed", profile: nextProfile });
    },
    researchConsent: state.researchConsent,
    resetSessionState: () => dispatch({ type: "session_reset" }),
    startVoiceInterview: voice.actions.startVoiceInterview,
  });

  useEffect(() => {
    if (!state.step.equals(OnboardingStep.Generating)) {
      waitStartedRef.current = null;
      return;
    }
    if (waitTeaserBlocked(state.progressEvents)) {
      return;
    }
    if (waitStartedRef.current === null) {
      waitStartedRef.current = performance.now();
    }
    const tryOpen = (now: number): boolean => {
      const elapsed = now - (waitStartedRef.current ?? now);
      if (!waitTeaserShouldOpenPreview(state.progressEvents, elapsed)) {
        return false;
      }
      actions.changeStep(OnboardingStep.PreviewAndEdit);
      return true;
    };
    if (tryOpen(performance.now())) {
      return;
    }
    let frame = 0;
    const tick = (now: number): void => {
      if (tryOpen(now)) {
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [actions.changeStep, state.progressEvents, state.step]);

  if (state.step.equals(OnboardingStep.PreviewAndEdit)) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        {state.notice ? (
          <p className="border-b border-border bg-muted px-6 py-3 text-sm text-muted-foreground">
            {state.notice}
          </p>
        ) : null}
        {state.error ? (
          <p className="border-b border-destructive/30 bg-destructive/5 px-6 py-3 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <PreviewAndEditPanel
          onPay={() =>
            actions.showNotice("Pay to activate opens checkout after sign-in.")
          }
          onShare={() =>
            actions.showNotice("Share writes the preview website address.")
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a
            className="flex items-center gap-2 font-semibold text-foreground"
            href="/"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
              <Globe2 className="size-4" />
            </span>
            <span>placis</span>
          </a>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="pt-4 sm:pt-6">
          <div className="flex items-center gap-3">
            {state.step.value !== OnboardingStep.Identify.value ? (
              <button
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md border border-border bg-card px-3 font-medium text-sm text-foreground transition"
                disabled={state.status.equals(OnboardingStatus.Refreshing)}
                onClick={() => {
                  const previous = stepBefore(state.step);
                  if (previous) {
                    actions.changeStep(previous);
                  }
                }}
                type="button"
              >
                <ChevronLeft className="size-4" />
                Back
              </button>
            ) : null}
            <div className="min-w-0 flex-1">
              <StepIndicator step={state.step} />
            </div>
          </div>
        </div>

        {state.notice ? (
          <p className="border-b border-border bg-muted px-6 py-3 text-sm text-muted-foreground">
            {state.notice}
          </p>
        ) : null}
        {state.error ? (
          <p className="border-b border-destructive/30 bg-destructive/5 px-6 py-3 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        {state.status.equals(OnboardingStatus.Refreshing) ? (
          <p className="py-5 text-sm text-muted-foreground">
            Restoring your previous setup state…
          </p>
        ) : (
          <StepContent
            actions={{
              continueToInterview: () =>
                actions.changeStep(OnboardingStep.Interview),
              goBack: () => {
                const previous = stepBefore(state.step);
                if (previous) {
                  actions.changeStep(previous);
                }
              },
              goToReview: () => actions.changeStep(OnboardingStep.Review),
              resetSession: actions.resetSession,
              showError: actions.showError,
            }}
            sources={sources}
            state={state}
            voice={voice}
          />
        )}
      </section>
    </main>
  );
}

type StepContentActions = {
  continueToInterview: () => void;
  goBack: () => void;
  goToReview: () => void;
  resetSession: () => void;
  showError: (message: string | null) => void;
};

function stepBefore(step: OnboardingStep): OnboardingStep | null {
  if (step.equals(OnboardingStep.Review)) {
    return OnboardingStep.Identify;
  }
  if (step.equals(OnboardingStep.Interview)) {
    return OnboardingStep.Review;
  }
  if (step.equals(OnboardingStep.Generating)) {
    return OnboardingStep.Interview;
  }
  return null;
}

function StepContent({
  actions,
  sources,
  state,
  voice,
}: {
  actions: StepContentActions;
  sources: SetupSources;
  state: SetupOnboardingState;
  voice: SetupVoiceInterview;
}) {
  if (state.step.equals(OnboardingStep.Interview)) {
    return <InterviewPanel actions={actions} state={state} voice={voice} />;
  }
  if (state.step.equals(OnboardingStep.Generating)) {
    return (
      <GenerationPanel
        previewPackage={state.previewPackage}
        progressEvents={state.progressEvents}
        {...(state.setupSessionId ? { setupSessionId: state.setupSessionId } : {})}
        status={state.status}
        streamState={state.streamState}
      />
    );
  }
  if (state.step.equals(OnboardingStep.Review)) {
    return <ReviewPanel actions={actions} state={state} />;
  }
  return <IdentifyPanel sources={sources} state={state} />;
}

type IdentifyPanelProps = {
  sources: SetupSources;
  state: SetupOnboardingState;
};

function IdentifyPanel({
  sources,
  state,
}: IdentifyPanelProps) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 py-6 sm:py-8">
      <div>
        <p className="font-semibold text-sm text-muted-foreground">
          Website setup
        </p>
        <h1 className="mt-2 font-semibold text-foreground">
          Find your business and start the website draft.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Choose the country, then find the corporate registry record or the
          Google Maps place. We show what we found before the short interview.
        </p>
      </div>
      <div>
        <BusinessSourcePanel
          businessName={sources.state.businessName}
          candidatesResult={sources.state.searchResult}
          controlsDisabled={state.status.value === "creating"}
          country={sources.state.country}
      googleMapsCandidates={sources.state.googleMapsCandidates}
      googleMapsLookupStatus={sources.state.googleMapsLookupStatus}
      googleMapsQuery={sources.state.googleMapsQuery}
      googlePlaceId={sources.state.googlePlaceId}
      onBusinessNameChange={sources.actions.setBusinessName}
      onConfirm={() => void sources.actions.confirmSource()}
      onCountryChange={sources.actions.setCountry}
      onGoogleMapsCandidateSelect={sources.actions.selectGoogleMapsCandidate}
      onGoogleMapsQueryChange={sources.actions.setGoogleMapsQuery}
      onSelectedCandidateChange={sources.actions.setSelectedRegistryCandidate}
      onTermsAcceptedChange={sources.actions.setTermsAccepted}
      registryLookupStatus={sources.state.registryLookupStatus}
      {...(sources.state.selectedRegistryCandidate
        ? { selectedCandidateId: sources.state.selectedRegistryCandidate.id }
        : {})}
        termsAccepted={sources.state.termsAccepted}
      />
      </div>
    </div>
  );
}

function ReviewPanel({
  actions,
  state,
}: {
  actions: StepContentActions;
  state: SetupOnboardingState;
}) {
  const foundRows = state.checklistRows.filter(
    (row) =>
      row.status === "filled_by_source" || row.status === "filled_by_user",
  );
  const missingRows = state.checklistRows.filter(
    (row) => !foundRows.includes(row),
  );
  return (
    <FoundInformationReview
      busy={false}
      company={null}
      completeness={state.profileCompleteness}
      foundRows={foundRows}
      missingRows={missingRows}
      onContinue={actions.continueToInterview}
    />
  );
}

function InterviewPanel({
  actions,
  state,
  voice,
}: {
  actions: StepContentActions;
  state: SetupOnboardingState;
  voice: SetupVoiceInterview;
}) {
  const listening = voice.state.status === "listening";
  const setupSessionId = state.setupSessionId;
  if (state.interviewMode.value === "text") {
    return (
      <TextInterviewForm
        busy={state.status.value === "creating"}
        country="IE"
        mapsSelection={{
          googleMapsQuery: "",
          googleMapsUrl: "",
          googlePlaceId: "",
          hasReviewCandidates: false,
        }}
        {...(setupSessionId
          ? {
              onAutosave: ({ submission }) =>
                void saveSetupTextInterviewDraft(setupSessionId, submission),
            }
          : {})}
        onSubmit={({ submission }) => {
          if (!setupSessionId) {
            actions.showError(
              "Start setup before submitting interview details.",
            );
            return;
          }
          void createSetupTextInterviewSubmission(setupSessionId, submission)
            .then(() => {
              actions.showError(null);
              actions.goToReview();
            })
            .catch((caught: unknown) => {
              actions.showError(
                caught instanceof Error
                  ? caught.message
                  : "Failed to submit the interview form.",
              );
            });
        }}
      />
    );
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">Interview</h2>
      <p className="text-sm text-muted-foreground">
        Mode: {state.interviewMode.value}
      </p>
      <div className="flex gap-3">
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          disabled={listening}
          onClick={() => void voice.actions.startVoiceInterview()}
          type="button"
        >
          {listening ? "Listening…" : "Start voice interview"}
        </button>
        {listening ? (
          <button
            className="rounded-md border border-border px-4 py-2 text-sm"
            onClick={voice.actions.stopVoiceCapture}
            type="button"
          >
            Stop
          </button>
        ) : null}
      </div>
      {voice.state.error ? (
        <p className="text-sm text-destructive">{voice.state.error}</p>
      ) : null}
      {voice.state.transcriptTurns.length > 0 ? (
        <ol className="list-disc space-y-1 pl-5 text-sm">
          {voice.state.transcriptTurns.slice(-4).map((turn) => (
            <li key={turn.id}>
              <span className="text-muted-foreground">{turn.role}: </span>
              {turn.text}
            </li>
          ))}
        </ol>
      ) : null}
      <button
        className="text-sm text-muted-foreground underline"
        onClick={actions.goToReview}
        type="button"
      >
        Back to review
      </button>
    </div>
  );
}

function StepIndicator({ step }: { step: OnboardingStep }) {
  const steps = [
    [OnboardingStep.Identify, "Find"],
    [OnboardingStep.Review, "Review"],
    [OnboardingStep.Interview, "Interview"],
    [OnboardingStep.Generating, "Preview"],
  ] as const;
  const activeIndex = steps.findIndex(([candidate]) => candidate.equals(step));
  return (
    <nav aria-label="Onboarding progress">
      <ol className="grid grid-cols-4 gap-2">
        {steps.map(([candidate, label], index) => (
          <li key={candidate.value}>
            <span
              className={`block h-[3px] rounded-full bg-border ${
                index <= activeIndex ? "bg-foreground" : ""
              }`}
            />
            <span
              className={`mt-2 block truncate font-medium text-[11px] tracking-[0.01em] ${
                index === activeIndex ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
