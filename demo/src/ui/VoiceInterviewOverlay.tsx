import type { ReactNode } from "react";

type VoiceInterviewOverlayProps = {
  onBack: () => void;
};

export function VoiceInterviewOverlay({
  onBack,
}: VoiceInterviewOverlayProps): ReactNode {
  return (
    <div
      aria-hidden="false"
      className="cms-voice-overlay fixed inset-0 z-[90] flex flex-col overflow-hidden bg-white text-foreground"
    >
      <button
        className="absolute top-4 left-4 z-[2] inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white/86 px-3.5 text-[13px] font-medium shadow-[0_4px_18px_rgb(9_9_11/8%)] backdrop-blur-lg hover:bg-zinc-50"
        onClick={onBack}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          viewBox="0 0 24 24"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back
      </button>
      <section className="cms-voice-overlay-stage flex min-h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
        <div
          aria-label="Voice interview"
          className="size-[min(20rem,70vw)] shrink-0 rounded-full bg-[radial-gradient(circle_at_50%_42%,rgb(255_255_255)_0%,rgb(198_204_216/70%)_38%,rgb(150_158_176/28%)_62%,rgb(150_158_176/0%)_78%)] shadow-[0_0_80px_rgb(150_158_176/18%)]"
          role="img"
        />
        <p className="mt-6 max-w-[22rem] text-center text-sm leading-snug text-muted-foreground">
          Placis interviews you and builds from your answers.
        </p>
      </section>
    </div>
  );
}
