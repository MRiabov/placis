import type { ReactNode } from "react";

type PlatformIconProps = {
  platform: "facebook" | "google";
};

/** Brand-mark platform icons (official colors by design; exempted from the
 *  semantic-color-token contract via the `platformIcons.tsx` style pattern). */
export function PlatformIcon({ platform }: PlatformIconProps): ReactNode {
  if (platform === "facebook") {
    return (
      <svg
        aria-label="Facebook"
        className="size-4 shrink-0"
        role="img"
        viewBox="0 0 24 24"
      >
        <title>Facebook</title>
        <rect fill="#1877F2" height="24" rx="4" width="24" />
        <path
          d="M15.86 13.5l.38-2.95h-2.82V8.66c0-.86.24-1.44 1.43-1.44h1.47V4.58c-.7-.1-1.42-.15-2.13-.15-2.1 0-3.55 1.28-3.55 3.62v2.5H8.25v2.95h2.39V20h2.78v-6.5h2.44z"
          fill="#fff"
        />
      </svg>
    );
  }
  return (
    <svg
      aria-label="Google Maps"
      className="size-4 shrink-0"
      role="img"
      viewBox="0 0 24 24"
    >
      <title>Google Maps</title>
      <path
        d="M12 2.25A7.52 7.52 0 0 0 4.5 9.77c0 5.28 6.63 11.26 7.1 11.68a.6.6 0 0 0 .8 0c.47-.42 7.1-6.4 7.1-11.68A7.52 7.52 0 0 0 12 2.25z"
        fill="#EA4335"
      />
      <path
        d="M6.9 4.45A7.48 7.48 0 0 0 4.5 9.77c0 2.1 1.05 4.3 2.33 6.22l5.17-5.17-5.1-6.37z"
        fill="#34A853"
      />
      <path
        d="M17.1 4.45 12 10.82l5.17 5.17c1.28-1.92 2.33-4.12 2.33-6.22a7.48 7.48 0 0 0-2.4-5.32z"
        fill="#4285F4"
      />
      <path
        d="M6.9 4.45 12 10.82l5.1-6.37A7.46 7.46 0 0 0 12 2.25a7.46 7.46 0 0 0-5.1 2.2z"
        fill="#FBBC04"
      />
      <circle cx="12" cy="9.75" fill="#fff" r="2.35" />
    </svg>
  );
}
