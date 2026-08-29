import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { cn } from "@/lib/cn";
import {
  type BounceHandle,
  bindBounce,
  mount,
  type OrbHandle,
} from "@/lib/dust-orb.js";

type DustOrbProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  speaking?: boolean;
  level?: number;
  size?: number;
};

export function DustOrb({
  className,
  speaking = false,
  level = 0,
  size = 72,
  ...props
}: DustOrbProps): ReactNode {
  const hostRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handlesRef = useRef<{
    orb: OrbHandle | null;
    bounce: BounceHandle | null;
  }>({
    orb: null,
    bounce: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) {
      return;
    }
    const orb = mount(canvas, { density: "standard" });
    const bounce = bindBounce(host);
    handlesRef.current = { orb, bounce };
    return () => {
      orb?.destroy();
      bounce?.destroy();
      handlesRef.current = { orb: null, bounce: null };
    };
  }, []);

  useEffect(() => {
    handlesRef.current.orb?.setSpeaking(speaking);
    handlesRef.current.bounce?.setSpeaking(speaking);
    handlesRef.current.bounce?.setLevel(level);
    handlesRef.current.orb?.setLevel(level);
  }, [speaking, level]);

  return (
    <button
      aria-label="Voice"
      className={cn(
        "dust-orb-host overflow-hidden border border-stone-200 bg-white",
        className,
      )}
      ref={hostRef}
      style={{ width: size, height: size }}
      type="button"
      {...props}
    >
      <canvas className="dust-orb-canvas" ref={canvasRef} />
    </button>
  );
}
