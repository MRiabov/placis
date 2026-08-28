/* Mock-only prerecorded greeting playback + microphone level for HTML look
   exports. No build. Files: onboarding-guide-intro.mp3, cms-voice-greeting.mp3
   (xAI TTS, eve). Mic is for DustOrb bounce; it is not sent to Go.
   Greeting / intro plays on the first start. A later start more than 5s after
   that first play does not replay it (within 5s it may replay if they left
   mid-greeting). */

(function (global) {
  let audio = null;
  let gen = 0;
  let unlock = null;
  let raf = 0;
  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  const levelBuf = new Uint8Array(1024);

  let micGen = 0;
  let micRaf = 0;
  let micStream = null;
  let micSource = null;
  let micAnalyser = null;
  let micUnlock = null;
  const micBuf = new Uint8Array(1024);
  const GREETING_REPLAY_MS = 5000;
  let greetingAt = 0;

  function clearUnlock() {
    if (!unlock) return;
    document.removeEventListener("pointerdown", unlock, true);
    unlock = null;
  }

  function clearMicUnlock() {
    if (!micUnlock) return;
    document.removeEventListener("pointerdown", micUnlock, true);
    micUnlock = null;
  }

  function stopMeter() {
    if (!raf) return;
    window.cancelAnimationFrame(raf);
    raf = 0;
  }

  function ensureCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function rmsFrom(buf, node) {
    node.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  }

  function attachMeter(el, onLevel, thisGen) {
    const ctx = ensureCtx();
    if (!ctx || !el) return;
    try {
      if (sourceNode) sourceNode.disconnect();
      sourceNode = ctx.createMediaElementSource(el);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      sourceNode.connect(analyser);
      analyser.connect(ctx.destination);
    } catch {
      analyser = null;
      return;
    }
    const tick = () => {
      if (thisGen !== gen || !analyser) return;
      onLevel(rmsFrom(levelBuf, analyser));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
  }

  function stopPlayback() {
    gen += 1;
    clearUnlock();
    stopMeter();
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio = null;
  }

  function stopMic() {
    micGen += 1;
    clearMicUnlock();
    if (micRaf) window.cancelAnimationFrame(micRaf);
    micRaf = 0;
    if (micSource) {
      micSource.disconnect();
      micSource = null;
    }
    micAnalyser = null;
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
    }
  }

  function stop() {
    stopPlayback();
    stopMic();
  }

  function play(src, hooks) {
    if (greetingAt && Date.now() - greetingAt > GREETING_REPLAY_MS) return;
    if (!greetingAt) greetingAt = Date.now();
    stopPlayback();
    const thisGen = gen;
    const onEnd = () => {
      if (thisGen !== gen) return;
      clearUnlock();
      stopMeter();
      hooks?.onEnd?.();
    };
    audio = new Audio(src);
    audio.preload = "auto";
    let metered = false;
    audio.addEventListener("playing", () => {
      if (thisGen !== gen) return;
      hooks?.onStart?.();
      if (hooks?.onLevel && !metered) {
        metered = true;
        attachMeter(audio, hooks.onLevel, thisGen);
      }
    });
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onEnd);
    const started = audio.play();
    if (started && typeof started.catch === "function") {
      started.catch(() => {
        if (thisGen !== gen || !audio) return;
        unlock = () => {
          clearUnlock();
          if (thisGen !== gen) return;
          ensureCtx();
          audio.play().catch(onEnd);
        };
        document.addEventListener("pointerdown", unlock, true);
      });
    }
  }

  function startMicMeter(stream, hooks, thisGen) {
    const ctx = ensureCtx();
    if (!ctx) return;
    try {
      micSource = ctx.createMediaStreamSource(stream);
      micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 1024;
      micSource.connect(micAnalyser);
    } catch {
      return;
    }
    let talking = false;
    const tick = () => {
      if (thisGen !== micGen || !micAnalyser) return;
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

  function listen(hooks) {
    stopMic();
    if (!navigator.mediaDevices?.getUserMedia) {
      hooks?.onDenied?.();
      return;
    }
    const thisGen = micGen;
    const denied = () => {
      if (thisGen !== micGen) return;
      stopMic();
      hooks?.onDenied?.();
    };
    const permissionState = () => {
      if (!navigator.permissions?.query) return Promise.resolve("unknown");
      return navigator.permissions
        .query({ name: "microphone" })
        .then((status) => status.state)
        .catch(() => "unknown");
    };
    const ask = (afterGesture) => {
      if (thisGen !== micGen) return;
      ensureCtx();
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (thisGen !== micGen) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          micStream = stream;
          startMicMeter(stream, hooks, thisGen);
        })
        .catch(async () => {
          if (thisGen !== micGen) return;
          const perm = await permissionState();
          if (thisGen !== micGen) return;
          if (perm === "denied" || afterGesture) {
            denied();
            return;
          }
          micUnlock = () => {
            clearMicUnlock();
            if (thisGen !== micGen) return;
            ask(true);
          };
          document.addEventListener("pointerdown", micUnlock, true);
        });
    };
    permissionState().then((perm) => {
      if (thisGen !== micGen) return;
      if (perm === "denied") {
        denied();
        return;
      }
      ask(false);
    });
  }

  global.MockVoice = { play, listen, stop };
})(window);
