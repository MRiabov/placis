/* Vanilla DustOrb for HTML mocks. Port of placis-web
   `frontend/src/components/public-website/DustOrb.tsx` (particles recycle from
   the centre; the cursor pulls dust) and OrbDemo scale (`hover:scale-[1.03]`,
   speaking `scale-110`, 500ms). No build. */

const TAU = Math.PI * 2;

const ORB_PROFILES = {
  standard: {
    maxParticles: 4200,
    startParticles: 3200,
    growBy: 220,
    maxDist: 1.4,
    particleSizeMin: 0.6,
    particleSizeRange: 1.3,
  },
  full: {
    maxParticles: 26000,
    startParticles: 13000,
    growBy: 1600,
    maxDist: 1.16,
    particleSizeMin: 0.35,
    particleSizeRange: 1.2,
  },
};

const STATE_ENERGY = {
  idle: 0.16,
  listening: 0.4,
  fetching: 0.75,
  building: 0.5,
  done: 0.24,
};

const GROW_EVERY_MS = 5000;
const BUCKETS = 32;
const MAX_ALPHA = 0.72;
const GAUSSIAN_SIGMA = 0.4;
const GAUSSIAN_LOOKUP_SIZE = 512;
const GAUSSIAN_LOOKUP_MAX_RADIUS = 1.5;
const GAUSSIAN_LOOKUP_SCALE =
  (GAUSSIAN_LOOKUP_SIZE - 1) / GAUSSIAN_LOOKUP_MAX_RADIUS;
const GAUSSIAN_FADE = new Float32Array(GAUSSIAN_LOOKUP_SIZE);

for (let i = 0; i < GAUSSIAN_LOOKUP_SIZE; i += 1) {
  const normalizedRadius = i / GAUSSIAN_LOOKUP_SCALE;
  GAUSSIAN_FADE[i] = Math.exp(
    -(normalizedRadius * normalizedRadius) /
      (2 * GAUSSIAN_SIGMA * GAUSSIAN_SIGMA),
  );
}

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

function makeParticle(nearCentre, profile) {
  return {
    angle: Math.random() * TAU,
    dist: nearCentre ? Math.random() * 0.05 : Math.random() * profile.maxDist,
    speed: 0.0011 + Math.random() * 0.0026,
    size: profile.particleSizeMin + Math.random() * profile.particleSizeRange,
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

function ease(from, to, k) {
  return from + (to - from) * k;
}

function mount(canvas, options) {
  if (!canvas) return null;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const opts = options || {};
  const density = opts.density === "full" ? "full" : "standard";
  const profile = ORB_PROFILES[density];
  const inkColor = opts.inkColor;
  let state = STATE_ENERGY[opts.state] != null ? opts.state : "idle";
  let speaking = Boolean(opts.speaking);

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () =>
    document.documentElement.classList.contains("dark") || darkQuery.matches;
  let ink = inkColor ?? (isDark() ? "255,255,255" : "9,9,11");
  const onScheme = () => {
    if (!inkColor) ink = isDark() ? "255,255,255" : "9,9,11";
  };
  darkQuery.addEventListener("change", onScheme);
  const themeObserver = new MutationObserver(onScheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const particles = [];
  for (let i = 0; i < profile.maxParticles; i += 1) {
    particles.push(makeParticle(false, profile));
  }
  let activeCount = profile.startParticles;
  const growTimer = window.setInterval(() => {
    activeCount = Math.min(profile.maxParticles, activeCount + profile.growBy);
  }, GROW_EVERY_MS);

  const bucketX = [];
  const bucketY = [];
  const bucketS = [];
  for (let i = 0; i < BUCKETS; i += 1) {
    bucketX.push(new Float32Array(profile.maxParticles));
    bucketY.push(new Float32Array(profile.maxParticles));
    bucketS.push(new Float32Array(profile.maxParticles));
  }
  const bucketCount = new Int32Array(BUCKETS);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let looping = false;
  let t = 0;
  let energy = STATE_ENERGY.idle;
  let amplitude = 0;
  let colorMix = 0;
  let speechLevel = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduceMotion) {
      render();
      return;
    }
    if (width >= 2 && height >= 2) startLoop();
  };

  const pointer = { x: 0, y: 0, active: false, strength: 1 };
  const onPointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active =
      pointer.x >= -80 &&
      pointer.x <= width + 80 &&
      pointer.y >= -80 &&
      pointer.y <= height + 80;
  };
  const onPointerDown = (event) => {
    onPointerMove(event);
    pointer.strength = 2;
  };
  const onPointerUp = () => {
    pointer.strength = 1;
  };
  const onLeave = () => {
    pointer.active = false;
  };

  const render = () => {
    t += 0.016;
    energy = ease(energy, STATE_ENERGY[state] ?? STATE_ENERGY.idle, 0.04);
    const building = state === "building";
    colorMix = ease(colorMix, building ? 1 : 0, 0.09);

    const listening = state === "listening";
    const noise =
      Math.sin(t * 9) * 0.5 +
      Math.sin(t * 19.3) * 0.3 +
      Math.sin(t * 2.7) * 0.2;
    const voice = Math.max(speaking ? 0.35 : 0, speechLevel);
    const targetAmp = listening
      ? 0.14 + Math.abs(noise) * 0.08 + voice * 0.7
      : 0.08;
    amplitude = ease(amplitude, targetAmp, 0.15);

    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.5;
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
      if (p.dist > profile.maxDist) {
        const fresh = makeParticle(true, profile);
        fresh.dx = p.dx;
        fresh.dy = p.dy;
        particles[i] = fresh;
        continue;
      }

      const wobble = Math.sin(t * p.wob + p.phase) * 0.03;
      const ang = p.angle + wobble;
      const normalizedRadius = p.dist * (1 + amplitude * 0.1 * p.wob);
      const radius = normalizedRadius * maxR;
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

      const gaussianIndex = Math.min(
        GAUSSIAN_LOOKUP_SIZE - 1,
        (normalizedRadius * GAUSSIAN_LOOKUP_SCALE) | 0,
      );
      const fade = GAUSSIAN_FADE[gaussianIndex];
      const alpha = baseAlpha * fade * energyBoost;
      if (alpha <= 0.006) continue;

      let inkAlpha = alpha;
      if (p.tint >= 0 && colorMix > 0.02) {
        const colorA = Math.min(0.95, alpha * colorMix * 2.6);
        const s = p.size + 0.7;
        context.fillStyle = `rgba(${BUILD_COLORS[p.tint]},${colorA})`;
        context.fillRect(x, y, s, s);
        inkAlpha = alpha * (1 - colorMix);
        if (inkAlpha <= 0.006) continue;
      }
      let bi = (inkAlpha * bucketScale) | 0;
      if (bi >= BUCKETS) bi = BUCKETS - 1;
      const c = bucketCount[bi];
      bucketX[bi][c] = x;
      bucketY[bi][c] = y;
      bucketS[bi][c] = p.size;
      bucketCount[bi] = c + 1;
    }

    for (let bi = 0; bi < BUCKETS; bi += 1) {
      const n = bucketCount[bi];
      if (n === 0) continue;
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
  };

  const startLoop = () => {
    if (reduceMotion || looping || width < 2 || height < 2) return;
    looping = true;
    const tick = () => {
      if (width < 2 || height < 2) {
        looping = false;
        return;
      }
      render();
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
  };

  resize();
  window.addEventListener("resize", resize);
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  return {
    setState(next) {
      if (STATE_ENERGY[next] != null) state = next;
    },
    setSpeaking(next) {
      speaking = Boolean(next);
      if (!speaking) speechLevel = 0;
    },
    setLevel(next) {
      speechLevel = Math.max(0, Math.min(1, Number(next) || 0));
    },
    destroy() {
      looping = false;
      window.cancelAnimationFrame(raf);
      window.clearInterval(growTimer);
      sizeObserver.disconnect();
      themeObserver.disconnect();
      darkQuery.removeEventListener("change", onScheme);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("pointerleave", onLeave);
    },
  };
}

function bindBounce(host) {
  if (!host) return null;
  host.classList.add("dust-orb-host");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  return {
    setSpeaking(on) {
      host.classList.toggle("is-speaking", Boolean(on));
      if (!on) {
        host.classList.remove("is-level");
        host.style.removeProperty("transform");
      }
    },
    setLevel(rms) {
      if (reduceMotion || !host.classList.contains("is-speaking")) return;
      const level = Math.max(0, Number(rms) || 0);
      if (level < 0.02) {
        host.classList.remove("is-level");
        host.style.removeProperty("transform");
        return;
      }
      host.classList.add("is-level");
      const scale = 1 + Math.min(0.3, 0.04 + level * 2.4);
      host.style.transform = `scale(${scale})`;
    },
    destroy() {
      host.classList.remove("is-speaking", "is-level");
      host.style.removeProperty("transform");
    },
  };
}

export { bindBounce, mount };
