type VoiceHooks = {
  onStart?: () => void;
  onEnd?: () => void;
  onLevel?: (rms: number) => void;
  onSpeaking?: (speaking: boolean) => void;
  onDenied?: () => void;
};

const GREETING_REPLAY_MS = 5000;
const levelBuf = new Uint8Array(new ArrayBuffer(1024));
const micBuf = new Uint8Array(new ArrayBuffer(1024));

let audio: HTMLAudioElement | null = null;
let gen = 0;
let unlock: ((event: PointerEvent) => void) | null = null;
let raf = 0;
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let greetingAt = 0;

let micGen = 0;
let micRaf = 0;
let micStream: MediaStream | null = null;
let micSource: MediaStreamAudioSourceNode | null = null;
let micAnalyser: AnalyserNode | null = null;
let micUnlock: ((event: PointerEvent) => void) | null = null;

function clearUnlock(): void {
  if (!unlock) {
    return;
  }
  document.removeEventListener("pointerdown", unlock, true);
  unlock = null;
}

function clearMicUnlock(): void {
  if (!micUnlock) {
    return;
  }
  document.removeEventListener("pointerdown", micUnlock, true);
  micUnlock = null;
}

function stopMeter(): void {
  if (!raf) {
    return;
  }
  window.cancelAnimationFrame(raf);
  raf = 0;
}

function ensureCtx(): AudioContext | null {
  const Win = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctx = Win.AudioContext || Win.webkitAudioContext;
  if (!Ctx) {
    return null;
  }
  const ctx = audioCtx ?? new Ctx();
  audioCtx = ctx;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function rmsFrom(buf: Uint8Array<ArrayBuffer>, node: AnalyserNode): number {
  node.getByteTimeDomainData(buf);
  let sum = 0;
  for (const sample of buf) {
    const value = (sample - 128) / 128;
    sum += value * value;
  }
  return Math.sqrt(sum / buf.length);
}

function attachMeter(
  el: HTMLAudioElement,
  onLevel: (rms: number) => void,
  thisGen: number,
): void {
  const ctx = ensureCtx();
  if (!ctx) {
    return;
  }
  try {
    sourceNode?.disconnect();
    sourceNode = ctx.createMediaElementSource(el);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    sourceNode.connect(analyser);
    analyser.connect(ctx.destination);
  } catch {
    analyser = null;
    return;
  }
  const tick = (): void => {
    if (thisGen !== gen || !analyser) {
      return;
    }
    onLevel(rmsFrom(levelBuf, analyser));
    raf = window.requestAnimationFrame(tick);
  };
  raf = window.requestAnimationFrame(tick);
}

function stopPlayback(): void {
  gen += 1;
  clearUnlock();
  stopMeter();
  if (!audio) {
    return;
  }
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  audio = null;
}

function stopMic(): void {
  micGen += 1;
  clearMicUnlock();
  if (micRaf) {
    window.cancelAnimationFrame(micRaf);
  }
  micRaf = 0;
  micSource?.disconnect();
  micSource = null;
  micAnalyser = null;
  if (micStream) {
    for (const track of micStream.getTracks()) {
      track.stop();
    }
    micStream = null;
  }
}

export function stop(): void {
  stopPlayback();
  stopMic();
}

export function play(src: string, hooks?: VoiceHooks): void {
  if (greetingAt && Date.now() - greetingAt > GREETING_REPLAY_MS) {
    return;
  }
  if (!greetingAt) {
    greetingAt = Date.now();
  }
  stopPlayback();
  const thisGen = gen;
  const onEnd = (): void => {
    if (thisGen !== gen) {
      return;
    }
    clearUnlock();
    stopMeter();
    hooks?.onEnd?.();
  };
  audio = new Audio(src);
  audio.preload = "auto";
  let metered = false;
  audio.addEventListener("playing", () => {
    if (thisGen !== gen) {
      return;
    }
    hooks?.onStart?.();
    if (hooks?.onLevel && !metered && audio) {
      metered = true;
      attachMeter(audio, hooks.onLevel, thisGen);
    }
  });
  audio.addEventListener("ended", onEnd);
  audio.addEventListener("error", onEnd);
  const started = audio.play();
  started.catch(() => {
    if (thisGen !== gen || !audio) {
      return;
    }
    unlock = () => {
      clearUnlock();
      if (thisGen !== gen || !audio) {
        return;
      }
      ensureCtx();
      audio.play().catch(onEnd);
    };
    document.addEventListener("pointerdown", unlock, true);
  });
}

function startMicMeter(
  stream: MediaStream,
  hooks: VoiceHooks | undefined,
  thisGen: number,
): void {
  const ctx = ensureCtx();
  if (!ctx) {
    return;
  }
  try {
    micSource = ctx.createMediaStreamSource(stream);
    micAnalyser = ctx.createAnalyser();
    micAnalyser.fftSize = 1024;
    micSource.connect(micAnalyser);
  } catch {
    return;
  }
  let talking = false;
  const tick = (): void => {
    if (thisGen !== micGen || !micAnalyser) {
      return;
    }
    const rms = rmsFrom(micBuf, micAnalyser);
    if (rms > 0.035) {
      if (!talking) {
        talking = true;
        hooks?.onSpeaking?.(true);
      }
    } else if (rms < 0.018 && talking) {
      talking = false;
      hooks?.onSpeaking?.(false);
    }
    hooks?.onLevel?.(rms);
    micRaf = window.requestAnimationFrame(tick);
  };
  micRaf = window.requestAnimationFrame(tick);
}

function permissionState(): Promise<PermissionState | "unknown"> {
  if (!navigator.permissions?.query) {
    return Promise.resolve("unknown");
  }
  return navigator.permissions
    .query({ name: "microphone" as PermissionName })
    .then((status) => status.state)
    .catch(() => "unknown" as const);
}

export function listen(hooks?: VoiceHooks): void {
  stopMic();
  if (!navigator.mediaDevices?.getUserMedia) {
    hooks?.onDenied?.();
    return;
  }
  const thisGen = micGen;
  const denied = (): void => {
    if (thisGen !== micGen) {
      return;
    }
    stopMic();
    hooks?.onDenied?.();
  };
  const ask = (afterGesture: boolean): void => {
    if (thisGen !== micGen) {
      return;
    }
    ensureCtx();
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (thisGen !== micGen) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          return;
        }
        micStream = stream;
        startMicMeter(stream, hooks, thisGen);
      })
      .catch(() => {
        void permissionState().then((perm) => {
          if (thisGen !== micGen) {
            return;
          }
          if (perm === "denied" || afterGesture) {
            denied();
            return;
          }
          micUnlock = () => {
            clearMicUnlock();
            if (thisGen !== micGen) {
              return;
            }
            ask(true);
          };
          document.addEventListener("pointerdown", micUnlock, true);
        });
      });
  };
  void permissionState().then((perm) => {
    if (thisGen !== micGen) {
      return;
    }
    if (perm === "denied") {
      denied();
      return;
    }
    ask(false);
  });
}
