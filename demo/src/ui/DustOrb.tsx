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
  canvasClassName?: string;
};

export function DustOrb({
  className,
  canvasClassName,
  speaking = false,
  level = 0,
  size,
  style,
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
        "dust-orb-host appearance-none border-0 bg-transparent p-0 shadow-none",
        className,
      )}
      ref={hostRef}
      style={{
        background: "transparent",
        ...(size ? { width: size, height: size } : {}),
        ...style,
      }}
      type="button"
      {...props}
    >
      <canvas
        className={cn("dust-orb-canvas", canvasClassName)}
        ref={canvasRef}
      />
    </button>
  );
}
