/// <reference types="vite/client" />

declare module "@/lib/dust-orb.js" {
  export type OrbState =
    | "idle"
    | "listening"
    | "fetching"
    | "building"
    | "done";

  export type OrbHandle = {
    setState: (state: OrbState) => void;
    setSpeaking: (speaking: boolean) => void;
    setLevel: (level: number) => void;
    destroy: () => void;
  };

  export type BounceHandle = {
    setSpeaking: (speaking: boolean) => void;
    setLevel: (rms: number) => void;
    destroy: () => void;
  };

  export function mount(
    canvas: HTMLCanvasElement,
    options?: {
      density?: "standard" | "full";
      inkColor?: string;
      state?: OrbState;
      speaking?: boolean;
    },
  ): OrbHandle | null;

  export function bindBounce(host: HTMLElement | null): BounceHandle | null;
}
