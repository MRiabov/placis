import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

import { cn } from "@/lib/cn";

/** Canvas renderer copied from placis-web `frontend/src/components/public-website/DustOrb.tsx`. */

export type OrbState = "idle" | "listening" | "fetching" | "building" | "done";

const TAU = Math.PI * 2;

const STATE_ENERGY: Record<OrbState, number> = {
  idle: 0.16,
  listening: 0.4,
  fetching: 0.75,
  building: 0.5,
  done: 0.24,
};

const MAX_PARTICLES = 4200;
const START_PARTICLES = 3200;
const GROW_EVERY_MS = 5000;
const GROW_BY = 220;
const MAX_DIST = 1.4;
const BUCKETS = 7;
const MAX_ALPHA = 0.72;
const BUILD_COLORS = [
  "255,80,80",
  "255,105,180",
  "255,160,60",
  "180,100,255",
  "80,210,110",
  "80,150,255",
  "255,210,70",
  "70,220,220",
];

type Particle = {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  wob: number;
  phase: number;
  dx: number;
  dy: number;
  tint: number;
};

function makeParticle(nearCentre: boolean): Particle {
  return {
    angle: Math.random() * TAU,
    dist: nearCentre ? Math.random() * 0.05 : Math.random() * MAX_DIST,
    speed: 0.0011 + Math.random() * 0.0026,
    size: 0.6 + Math.random() * 1.3,
    wob: 0.5 + Math.random() * 0.9,
    phase: Math.random() * TAU,
    dx: 0,
    dy: 0,
    tint:
      Math.random() < 0.45
        ? Math.floor(Math.random() * BUILD_COLORS.length)
        : -1,
  };
}

function DustCanvas({
  state,
  speaking = false,
  className,
}: {
  state: OrbState;
  speaking?: boolean;
  className?: string;
}): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<OrbState>(state);
  const speakingRef = useRef<boolean>(speaking);

  stateRef.current = state;
  speakingRef.current = speaking;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const isDark = () => document.documentElement.classList.contains("dark");
    let ink = isDark() ? "255,255,255" : "9,9,11";
    const themeObserver = new MutationObserver(() => {
      ink = isDark() ? "255,255,255" : "9,9,11";
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const particles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      particles.push(makeParticle(false));
    }
    let activeCount = START_PARTICLES;
    const growTimer = window.setInterval(() => {
      activeCount = Math.min(MAX_PARTICLES, activeCount + GROW_BY);
    }, GROW_EVERY_MS);

    const bucketX: Float32Array[] = [];
    const bucketY: Float32Array[] = [];
    const bucketS: Float32Array[] = [];
    for (let i = 0; i < BUCKETS; i += 1) {
      bucketX.push(new Float32Array(MAX_PARTICLES));
      bucketY.push(new Float32Array(MAX_PARTICLES));
      bucketS.push(new Float32Array(MAX_PARTICLES));
    }
    const bucketCount = new Int32Array(BUCKETS);

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const pointer = { x: 0, y: 0, active: false, strength: 1 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active =
        pointer.x >= -80 &&
        pointer.x <= width + 80 &&
        pointer.y >= -80 &&
        pointer.y <= height + 80;
    };
    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      pointer.strength = 2;
    };
    const onPointerUp = () => {
      pointer.strength = 1;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let t = 0;
    let energy = STATE_ENERGY.idle;
    let amplitude = 0;
    let colorMix = 0;

    const ease = (from: number, to: number, k: number) =>
      from + (to - from) * k;

    const render = () => {
      t += 0.016;
      energy = ease(energy, STATE_ENERGY[stateRef.current], 0.04);
      const building = stateRef.current === "building";
      colorMix = ease(colorMix, building ? 1 : 0, 0.09);

      const listening = stateRef.current === "listening";
      const noise =
        Math.sin(t * 9) * 0.5 +
        Math.sin(t * 19.3) * 0.3 +
        Math.sin(t * 2.7) * 0.2;
      const targetAmp =
        listening && speakingRef.current
          ? 0.5 + Math.abs(noise) * 0.4
          : listening
            ? 0.14 + Math.abs(noise) * 0.08
            : 0.08;
      amplitude = ease(amplitude, targetAmp, 0.15);

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.5;
      const invTwoSigmaSq = 1 / (2 * (maxR * 0.4) * (maxR * 0.4));
      const influence = maxR * 0.95;
      const flow = 0.5 + energy * 0.9;
      const baseAlpha = pointer.active ? 0.62 : 0.42;
      const energyBoost = 0.6 + energy * 0.5;
      const bucketScale = BUCKETS / MAX_ALPHA;

      context.clearRect(0, 0, width, height);
      bucketCount.fill(0);

      for (let i = 0; i < activeCount; i += 1) {
        const p = particles[i];
        p.dist += p.speed * flow + amplitude * 0.0012;
        if (p.dist > MAX_DIST) {
          const fresh = makeParticle(true);
          fresh.dx = p.dx;
          fresh.dy = p.dy;
          particles[i] = fresh;
          continue;
        }

        const wobble = Math.sin(t * p.wob + p.phase) * 0.03;
        const ang = p.angle + wobble;
        const radius = p.dist * maxR * (1 + amplitude * 0.1 * p.wob);
        const baseX = cx + Math.cos(ang) * radius;
        const baseY = cy + Math.sin(ang) * radius;

        let targetDx = 0;
        let targetDy = 0;
        if (pointer.active) {
          const vx = pointer.x - baseX;
          const vy = pointer.y - baseY;
          const d = Math.hypot(vx, vy);
          if (d < influence) {
            const pull = (1 - d / influence) * 0.8 * pointer.strength;
            targetDx = vx * pull;
            targetDy = vy * pull;
          }
        }
        p.dx = ease(p.dx, targetDx, 0.5);
        p.dy = ease(p.dy, targetDy, 0.5);

        const x = baseX + p.dx;
        const y = baseY + p.dy;

        const fade = Math.exp(-(radius * radius) * invTwoSigmaSq);
        const alpha = baseAlpha * fade * energyBoost;
        if (alpha <= 0.006) {
          continue;
        }
        let inkAlpha = alpha;
        if (p.tint >= 0 && colorMix > 0.02) {
          const colorA = Math.min(0.95, alpha * colorMix * 2.6);
          const s = p.size + 0.7;
          context.fillStyle = `rgba(${BUILD_COLORS[p.tint]},${colorA})`;
          context.fillRect(x, y, s, s);
          inkAlpha = alpha * (1 - colorMix);
          if (inkAlpha <= 0.006) {
            continue;
          }
        }
        let bi = (inkAlpha * bucketScale) | 0;
        if (bi >= BUCKETS) {
          bi = BUCKETS - 1;
        }
        const c = bucketCount[bi];
        bucketX[bi][c] = x;
        bucketY[bi][c] = y;
        bucketS[bi][c] = p.size;
        bucketCount[bi] = c + 1;
      }

      for (let bi = 0; bi < BUCKETS; bi += 1) {
        const n = bucketCount[bi];
        if (n === 0) {
          continue;
        }
        const a = ((bi + 0.5) / BUCKETS) * MAX_ALPHA;
        context.fillStyle = `rgba(${ink},${a})`;
        const xs = bucketX[bi];
        const ys = bucketY[bi];
        const ss = bucketS[bi];
        for (let j = 0; j < n; j += 1) {
          const s = ss[j];
          context.fillRect(xs[j], ys[j], s, s);
        }
      }

      if (!reduceMotion) {
        raf = window.requestAnimationFrame(render);
      }
    };

    raf = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(growTimer);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas className={className} ref={canvasRef} />;
}

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
  level: _level = 0,
  size,
  style,
  ...props
}: DustOrbProps): ReactNode {
  return (
    <button
      aria-label="Voice"
      className={cn(
        "relative grid cursor-pointer place-items-center overflow-visible rounded-full border-0 bg-transparent p-0 shadow-none outline-none transition-transform duration-500 select-none motion-reduce:transition-none",
        speaking ? "scale-110" : "hover:scale-[1.03]",
        className,
      )}
      style={{
        ...(size ? { width: size, height: size } : {}),
        ...style,
      }}
      type="button"
      {...props}
    >
      <DustCanvas
        className={cn("size-full", canvasClassName)}
        speaking={speaking}
        state={speaking ? "listening" : "idle"}
      />
    </button>
  );
}
