import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

import { cn } from "@/lib/cn";
import { voiceLevel } from "@/lib/mock-voice";

/** Canvas renderer copied from placis-web `frontend/src/components/public-website/DustOrb.tsx`. */

type OrbMode = "idle" | "listening" | "fetching" | "building" | "done";

const TAU = Math.PI * 2;

const MODE_ENERGY: Record<OrbMode, number> = {
  idle: 0.16,
  listening: 0.4,
  fetching: 0.75,
  building: 0.5,
  done: 0.24,
};

const PARTICLE_POOL = 8000;
const REST_PARTICLES = 3200;
const REST_CAP = 4200;
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

function ease(from: number, to: number, k: number): number {
  return from + (to - from) * k;
}

type Pointer = {
  x: number;
  y: number;
  active: boolean;
  strength: number;
};

type Buckets = {
  x: Float32Array[];
  y: Float32Array[];
  s: Float32Array[];
  count: Int32Array;
};

function targetAmplitude(t: number, listening: boolean, voiceT: number): number {
  const noise =
    Math.sin(t * 9) * 0.5 + Math.sin(t * 19.3) * 0.3 + Math.sin(t * 2.7) * 0.2;
  if (listening) {
    return 0.14 + Math.abs(noise) * 0.08 + voiceT * 0.25;
  }
  return 0.08;
}

function pointerPull(
  pointer: Pointer,
  baseX: number,
  baseY: number,
  influence: number,
): { dx: number; dy: number } {
  if (!pointer.active) {
    return { dx: 0, dy: 0 };
  }
  const vx = pointer.x - baseX;
  const vy = pointer.y - baseY;
  const d = Math.hypot(vx, vy);
  if (d >= influence) {
    return { dx: 0, dy: 0 };
  }
  const pull = (1 - d / influence) * 0.8 * pointer.strength;
  return { dx: vx * pull, dy: vy * pull };
}

function stampTinted(
  context: CanvasRenderingContext2D,
  particle: Particle,
  x: number,
  y: number,
  alpha: number,
  colorMix: number,
): number {
  if (particle.tint < 0 || colorMix <= 0.02) {
    return alpha;
  }
  const colorA = Math.min(0.95, alpha * colorMix * 2.6);
  const size = particle.size + 0.7;
  context.fillStyle = `rgba(${BUILD_COLORS[particle.tint]},${colorA})`;
  context.fillRect(x, y, size, size);
  return alpha * (1 - colorMix);
}

function pushBucket(
  buckets: Buckets,
  inkAlpha: number,
  x: number,
  y: number,
  size: number,
): void {
  const bucketScale = BUCKETS / MAX_ALPHA;
  let bi = (inkAlpha * bucketScale) | 0;
  if (bi >= BUCKETS) {
    bi = BUCKETS - 1;
  }
  const c = buckets.count[bi];
  const xs = buckets.x[bi];
  const ys = buckets.y[bi];
  const ss = buckets.s[bi];
  if (c === undefined || !xs || !ys || !ss) {
    return;
  }
  xs[c] = x;
  ys[c] = y;
  ss[c] = size;
  buckets.count[bi] = c + 1;
}

function simulateParticles(
  context: CanvasRenderingContext2D,
  particles: Particle[],
  activeCount: number,
  t: number,
  energy: number,
  amplitude: number,
  colorMix: number,
  width: number,
  height: number,
  pointer: Pointer,
  buckets: Buckets,
): void {
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.5;
  context.save();
  context.beginPath();
  context.arc(cx, cy, maxR, 0, TAU);
  context.clip();
  const invTwoSigmaSq = 1 / (2 * (maxR * 0.4) * (maxR * 0.4));
  const influence = maxR * 0.95;
  const flow = 0.5 + energy * 0.9;
  const baseAlpha = pointer.active ? 0.62 : 0.42;
  const energyBoost = 0.6 + energy * 0.5;

  for (let i = 0; i < activeCount; i += 1) {
    const particle = particles[i];
    if (!particle) {
      continue;
    }
    particle.dist += particle.speed * flow + amplitude * 0.0012;
    if (particle.dist > MAX_DIST) {
      const fresh = makeParticle(true);
      fresh.dx = particle.dx;
      fresh.dy = particle.dy;
      particles[i] = fresh;
      continue;
    }

    const wobble = Math.sin(t * particle.wob + particle.phase) * 0.03;
    const ang = particle.angle + wobble;
    const radius = particle.dist * maxR * (1 + amplitude * 0.1 * particle.wob);
    const baseX = cx + Math.cos(ang) * radius;
    const baseY = cy + Math.sin(ang) * radius;
    const pull = pointerPull(pointer, baseX, baseY, influence);
    particle.dx = ease(particle.dx, pull.dx, 0.5);
    particle.dy = ease(particle.dy, pull.dy, 0.5);
    const x = baseX + particle.dx;
    const y = baseY + particle.dy;
    const fade = Math.exp(-(radius * radius) * invTwoSigmaSq);
    const alpha = baseAlpha * fade * energyBoost;
    if (alpha <= 0.006) {
      continue;
    }
    const inkAlpha = stampTinted(context, particle, x, y, alpha, colorMix);
    if (inkAlpha <= 0.006) {
      continue;
    }
    pushBucket(buckets, inkAlpha, x, y, particle.size);
  }
  context.restore();
}

function flushBuckets(
  context: CanvasRenderingContext2D,
  ink: string,
  buckets: Buckets,
): void {
  for (let bi = 0; bi < BUCKETS; bi += 1) {
    const n = buckets.count[bi];
    if (n === undefined || n === 0) {
      continue;
    }
    const a = ((bi + 0.5) / BUCKETS) * MAX_ALPHA;
    context.fillStyle = `rgba(${ink},${a})`;
    const xs = buckets.x[bi];
    const ys = buckets.y[bi];
    const ss = buckets.s[bi];
    if (!xs || !ys || !ss) {
      continue;
    }
    for (let j = 0; j < n; j += 1) {
      const size = ss[j];
      context.fillRect(xs[j] ?? 0, ys[j] ?? 0, size ?? 0, size ?? 0);
    }
  }
}

function DustCanvas({
  mode,
  className,
}: {
  mode: OrbMode;
  className?: string;
}): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<OrbMode>(mode);

  modeRef.current = mode;

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
    for (let i = 0; i < PARTICLE_POOL; i += 1) {
      particles.push(makeParticle(false));
    }
    let restCount = REST_PARTICLES;
    let activeCount = REST_PARTICLES;
    const growTimer = window.setInterval(() => {
      restCount = Math.min(REST_CAP, restCount + GROW_BY);
    }, GROW_EVERY_MS);

    const bucketX: Float32Array[] = [];
    const bucketY: Float32Array[] = [];
    const bucketS: Float32Array[] = [];
    for (let i = 0; i < BUCKETS; i += 1) {
      bucketX.push(new Float32Array(PARTICLE_POOL));
      bucketY.push(new Float32Array(PARTICLE_POOL));
      bucketS.push(new Float32Array(PARTICLE_POOL));
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
    let energy = MODE_ENERGY.idle;
    let amplitude = 0;
    let colorMix = 0;
    const buckets: Buckets = {
      x: bucketX,
      y: bucketY,
      s: bucketS,
      count: bucketCount,
    };

    const render = () => {
      t += 0.016;
      energy = ease(energy, MODE_ENERGY[modeRef.current], 0.04);
      colorMix = ease(colorMix, modeRef.current === "building" ? 1 : 0, 0.09);
      const listening = modeRef.current === "listening";
      const voice = reduceMotion ? 0 : Math.max(0, voiceLevel());
      const voiceT = listening
        ? Math.min(1, Math.max(0, (voice - 0.018) / 0.14))
        : 0;
      const targetCount = restCount + voiceT * (PARTICLE_POOL - restCount);
      if (targetCount > activeCount) {
        const from = activeCount | 0;
        const to = Math.min(PARTICLE_POOL, Math.ceil(targetCount));
        for (let i = from; i < to; i += 1) {
          particles[i] = makeParticle(true);
        }
      }
      activeCount = ease(activeCount, targetCount, 0.22);
      const drawCount = activeCount | 0;
      amplitude = ease(
        amplitude,
        targetAmplitude(t, listening, voiceT),
        0.15,
      );
      context.clearRect(0, 0, width, height);
      bucketCount.fill(0);
      simulateParticles(
        context,
        particles,
        drawCount,
        t,
        energy,
        amplitude,
        colorMix,
        width,
        height,
        pointer,
        buckets,
      );
      flushBuckets(context, ink, buckets);
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
  live?: boolean;
  size?: number;
  canvasClassName?: string;
};

export function DustOrb({
  className,
  canvasClassName,
  speaking = false,
  live = false,
  size,
  style,
  ...props
}: DustOrbProps): ReactNode {
  return (
    <button
      aria-label="Voice"
      className={cn(
        "relative grid cursor-pointer appearance-none place-items-center overflow-visible rounded-full border-0 bg-transparent p-0 shadow-none outline-none transition-transform duration-500 select-none hover:scale-[1.03] motion-reduce:scale-100 motion-reduce:transition-none",
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
        className={cn("block", canvasClassName ?? "size-full")}
        mode={live || speaking ? "listening" : "idle"}
      />
    </button>
  );
}
