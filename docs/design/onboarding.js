/* Mock-only scene wiring for onboarding.html. Not product UI.
   Combo, hours picker, featured services, and service-area territories:
   details-fields.js (loaded first). */

const params = new URLSearchParams(location.search);
const views = [...document.querySelectorAll("[data-view]")];
const steps = [...document.querySelectorAll("[data-step]")];
const order = ["find", "review", "interview", "preview", "generated"];
const WAIT_MS = 15000;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const WAIT_OPENING_MS = 2000;
let guideMode = params.get("guide") === "1" || params.get("assistant") === "1" ? "listening" : "cue";
const GUIDE_INTRO_SRC = "onboarding-guide-intro.mp3";
const GUIDE_INK = "9,9,11";
const CUE_TURN_ON = "Click to turn on voice";
const CUE_MIC_DENIED = "Allow microphone access in your browser";
let guideDust = null;
let guideBounce = null;
let guideIntroGen = 0;

function prefersReducedMotion() {
  return reduceMotion.matches;
}

const waitNotice = document.getElementById("waitNotice");
const restoreNotice = document.getElementById("restoreNotice");
const primaryAction = document.getElementById("primaryAction");
const primaryLabel = document.getElementById("primaryLabel");
const footHint = document.getElementById("footHint");
const waitProgress = document.getElementById("waitProgress");
const waitBar = document.getElementById("waitBar");
const waitCopy = document.getElementById("waitCopy");
const onbFoot = document.getElementById("onbFoot");

function preferViewtabsCollapsed() {
  if (params.has("dev")) return false;
  return true;
}

function setViewtabsCollapsed(collapsed) {
  document.getElementById("viewtabs")?.classList.toggle("is-hidden", collapsed);
  document.getElementById("viewtabsOpen")?.classList.toggle("is-hidden", !collapsed);
}

function matchesStateFor(node, scene) {
  return (node.dataset.stateFor || "").split(/\s+/).filter(Boolean).includes(scene);
}

function syncStateGroups(scene) {
  document.querySelectorAll("[data-state-for]").forEach((node) => {
    node.classList.toggle("is-hidden", !matchesStateFor(node, scene));
  });
}

function stripButton(state) {
  return document.querySelector(`#viewtabs .viewtab[data-state="${state}"]`);
}

function setScene(scene) {
  if (!order.includes(scene)) scene = "find";
  const index = order.indexOf(scene);
  const stepScene = scene === "generated" ? "preview" : scene;
  views.forEach((view) => view.classList.toggle("is-hidden", view.dataset.view !== scene));
  steps.forEach((step, i) => {
    step.classList.toggle("is-current", step.dataset.step === stepScene);
    step.classList.toggle("is-done", i < order.indexOf(stepScene) || scene === "generated");
  });
  document.body.classList.toggle("is-generated", scene === "generated");
  document.getElementById("backBtn")?.classList.toggle("is-hidden", scene === "find" || scene === "generated");
  if (scene !== "review" && scene !== "interview") waitNotice?.classList.add("is-hidden");
  if (scene !== "find") restoreNotice?.classList.add("is-hidden");
  syncStateGroups(scene);
  syncFooter(scene);
  if (scene === "preview") {
    startCarousel();
    startWait();
    setGuideSurface("hidden");
  } else if (scene === "generated") {
    stopCarousel();
    stopWait();
    setGuideSurface("hidden");
  } else {
    stopCarousel();
    stopWait();
    setGuideSurface(guideMode);
  }
}

function currentScene() {
  return views.find((view) => !view.classList.contains("is-hidden"))?.dataset.view || "find";
}

function syncFooter(scene) {
  const lookingUp = lookupLabelIsBusy();
  onbFoot.classList.toggle("is-hidden", scene === "generated");
  waitProgress.classList.toggle("is-hidden", scene !== "preview");
  primaryAction.classList.toggle("is-hidden", scene === "preview");
  if (scene === "find") {
    footHint.textContent = "We’ll look up public details after you agree.";
    primaryLabel.textContent = lookingUp ? "Looking the business up…" : "Business lookup";
    primaryAction.disabled = lookingUp || !lookupReady();
  } else if (scene === "review") {
    footHint.textContent = "";
    primaryLabel.textContent = "Continue";
    primaryAction.disabled = false;
  } else if (scene === "interview") {
    const voice = !document.getElementById("voicePanel")?.classList.contains("is-hidden");
    footHint.textContent = voice ? "Voice is coming later." : "Saved automatically as you type.";
    primaryLabel.textContent = "Continue";
    primaryAction.disabled = voice;
  } else if (scene === "preview") {
    footHint.textContent = "";
    primaryAction.disabled = true;
  }
}

function lookupReady() {
  return Boolean(consent?.checked && (registrySelected || mapsSelected));
}

function lookupLabelIsBusy() {
  return primaryLabel.textContent === "Looking the business up…";
}

document.querySelectorAll("[data-scene]").forEach((node) => {
  node.addEventListener("click", () => setScene(node.dataset.scene));
});
document.getElementById("backBtn")?.addEventListener("click", () => {
  const index = order.indexOf(currentScene());
  if (index > 0) setScene(order[index - 1]);
});
document.getElementById("skipGeneration")?.addEventListener("click", () => {
  setScene("generated");
  setGeneratedState("unsigned");
});
document.getElementById("interviewForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  setScene("preview");
});
primaryAction?.addEventListener("click", () => {
  const scene = currentScene();
  if (scene === "find") startLookup();
  else if (scene === "review") setScene("interview");
  else if (scene === "interview") {
    document.getElementById("interviewForm")?.requestSubmit();
  }
});

const registryQuery = document.getElementById("registryQuery");
const registryList = document.getElementById("registryList");
const registryPicked = document.getElementById("registryPicked");
const mapsQuery = document.getElementById("mapsQuery");
const mapsList = document.getElementById("mapsList");
const mapsPicked = document.getElementById("mapsPicked");
const consent = document.getElementById("consent");
const findPanel = document.getElementById("findPanel");
const findRestore = document.getElementById("findRestore");

let registrySelected = false;
let mapsSelected = false;

function syncLookup() {
  if (currentScene() === "find" && !lookupLabelIsBusy()) syncFooter("find");
}

function showRegistryResults(show) {
  registryList.classList.toggle("is-hidden", !show);
  registryQuery.setAttribute("aria-expanded", String(show));
  stripButton("results")?.classList.toggle("on", show && !registrySelected);
}

function showMapsResults(show) {
  mapsList.classList.toggle("is-hidden", !show);
  mapsQuery.setAttribute("aria-expanded", String(show));
}

function setRegistrySelected(on) {
  registrySelected = on;
  registryPicked.classList.toggle("is-hidden", !on);
  if (on) {
    registryQuery.value = "BELLFIELD ROOFING LIMITED";
    showRegistryResults(false);
  }
  syncLookup();
  syncCroLock();
}

function syncCroLock() {
  const cro = document.querySelector('[data-cert="cro"]');
  if (!cro) return;
  const locked = registrySelected;
  cro.classList.toggle("is-locked", locked);
  cro.setAttribute("aria-disabled", locked ? "true" : "false");
  if (locked) cro.classList.add("on");
  else cro.classList.remove("on");
}

function setMapsSelected(on) {
  mapsSelected = on;
  mapsPicked.classList.toggle("is-hidden", !on);
  if (on) {
    mapsQuery.value = "Bellfield Roofing";
    showMapsResults(false);
  }
  syncLookup();
}

registryQuery?.addEventListener("input", () => {
  const q = registryQuery.value.trim();
  if (registrySelected) setRegistrySelected(false);
  showRegistryResults(q.length >= 2);
});
registryQuery?.addEventListener("focus", () => {
  if (!registrySelected && registryQuery.value.trim().length >= 2) showRegistryResults(true);
});
mapsQuery?.addEventListener("input", () => {
  const q = mapsQuery.value.trim();
  if (mapsSelected) setMapsSelected(false);
  showMapsResults(q.length >= 2);
});
document.querySelectorAll("[data-pick='registry']").forEach((button) => {
  button.addEventListener("click", () => setRegistrySelected(true));
});
document.querySelectorAll("[data-pick='maps']").forEach((button) => {
  button.addEventListener("click", () => setMapsSelected(true));
});
document.getElementById("registryChange")?.addEventListener("click", () => {
  setRegistrySelected(false);
  registryQuery.value = "";
  registryQuery.focus();
});
document.getElementById("mapsChange")?.addEventListener("click", () => {
  setMapsSelected(false);
  mapsQuery.value = "";
  mapsQuery.focus();
});
consent?.addEventListener("change", syncLookup);

function startLookup() {
  if (!lookupReady()) return;
  primaryLabel.textContent = "Looking the business up…";
  primaryAction.disabled = true;
  window.setTimeout(() => {
    primaryLabel.textContent = "Business lookup";
    setScene("review");
    setReviewState("ready");
  }, 700);
}

const country = document.getElementById("country");
const registryHint = document.getElementById("registryHint");
const registryName = document.getElementById("registryName");
country?.addEventListener("change", () => {
  const copy = {
    IE: ["Type the company name and pick the matching record.", "(CRO)"],
    GB: ["Type the company name and pick the Companies House record.", "(Companies House)"],
    US: ["Type the company name and pick the state registry record.", "(state registry)"],
  }[country.value] || ["Type the company name and pick the matching record.", ""];
  registryHint.textContent = copy[0];
  registryName.textContent = copy[1];
});

document.querySelectorAll("[data-select-menu]").forEach((wrap) => {
  const select = wrap.querySelector("select");
  const trigger = wrap.querySelector(".select-trigger");
  const menu = wrap.querySelector(".select-menu");
  const label = wrap.querySelector("[data-select-label]");
  if (!select || !trigger || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle("is-hidden", !open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  };
  const pick = (value) => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    const option = [...menu.querySelectorAll("[data-value]")].find((node) => node.dataset.value === value);
    menu.querySelectorAll("[role='option']").forEach((node) => {
      node.setAttribute("aria-selected", node === option ? "true" : "false");
    });
    if (option && label) label.textContent = option.textContent;
    setOpen(false);
  };

  trigger.addEventListener("click", () => setOpen(menu.classList.contains("is-hidden")));
  menu.querySelectorAll("[data-value]").forEach((node) => {
    node.addEventListener("click", () => pick(node.dataset.value));
  });
  document.addEventListener("pointerdown", (event) => {
    if (!wrap.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
});

function setFindState(state) {
  findPanel.classList.toggle("is-hidden", state === "restoring");
  findRestore.classList.toggle("is-hidden", state !== "restoring");
  restoreNotice.classList.toggle("is-hidden", state !== "restoring");
  document.getElementById("registrySpin")?.classList.toggle("is-hidden", state !== "looking-up");
  document.getElementById("registrySearchIcon")?.classList.toggle("is-hidden", state === "looking-up");
  if (state === "empty") {
    setRegistrySelected(false);
    setMapsSelected(false);
    registryQuery.value = "";
    mapsQuery.value = "";
    consent.checked = false;
    showRegistryResults(false);
    showMapsResults(false);
  }
  if (state === "results") {
    setRegistrySelected(false);
    registryQuery.value = "Bellfield";
    showRegistryResults(true);
  }
  if (state === "selected" || state === "maps" || state === "ready" || state === "looking-up") {
    setRegistrySelected(true);
    showRegistryResults(false);
  }
  if (state === "maps" || state === "ready" || state === "looking-up") setMapsSelected(true);
  if (state === "selected") setMapsSelected(false);
  consent.checked = state === "ready" || state === "looking-up";
  primaryLabel.textContent = state === "looking-up" ? "Looking the business up…" : "Business lookup";
  if (state === "looking-up") primaryAction.disabled = true;
  else syncLookup();
  document.querySelectorAll('#viewtabs [data-state-for="find"] .viewtab').forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.state === state);
  });
  if (currentScene() === "find") syncFooter("find");
}

function setReviewState(state) {
  waitNotice.classList.toggle("is-hidden", state !== "wait");
  const filling = document.querySelector('[data-fact="email-filling"]');
  const conflict = document.querySelector('[data-fact="conflict"]');
  const display = document.querySelector('[data-fact="display"]');
  filling?.classList.toggle("is-hidden", state !== "filling");
  conflict?.classList.toggle("is-hidden", state !== "conflict");
  display?.classList.toggle("is-hidden", state === "conflict");
  const complete = state === "complete";
  document.getElementById("readyNote")?.classList.toggle("is-hidden", !complete);
  document.getElementById("foundCount").textContent = complete ? "12 details found" : "8 details found";
  document.getElementById("foundPct").textContent = complete ? "100%" : "62%";
  document.getElementById("foundBar").style.width = complete ? "100%" : "62%";
  document.querySelectorAll('#viewtabs [data-state-for="review"] .viewtab').forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.state === state);
  });
}

function setInterviewState(state) {
  if (state === "voice") state = "text";
  const fewPhotos = state === "few-photos";
  const noReviews = state === "no-reviews";
  document.querySelectorAll("[data-extra-photo]").forEach((tile) => {
    tile.classList.toggle("is-hidden", fewPhotos);
  });
  document.getElementById("photoFill")?.classList.toggle("is-hidden", !fewPhotos);
  document.getElementById("reviewGrid")?.classList.toggle("is-hidden", noReviews);
  document.getElementById("reviewLede")?.classList.toggle("is-hidden", noReviews);
  document.getElementById("noReviewsYet")?.classList.toggle("is-hidden", !noReviews);
  if (state === "filled") {
    document.getElementById("contactName").value = "Aoife Bell";
    document.getElementById("marketingEmail").value = "hello@bellfield.ie";
    document.getElementById("emergencyPhone").value = "087 555 0199";
    document.getElementById("existingSite").value = "https://bellfield.ie";
  }
  document.querySelectorAll('#viewtabs [data-state-for="interview"] .viewtab').forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.state === state);
  });
  if (currentScene() === "interview") syncFooter("interview");
}
document.querySelectorAll("[data-photo-fill]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-photo-fill]").forEach((item) => item.classList.toggle("on", item === button));
  });
});
document.querySelectorAll("[data-cert]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("is-locked") || button.getAttribute("aria-disabled") === "true") return;
    button.classList.toggle("on");
  });
});

const slides = [...document.querySelectorAll("[data-slide]")];
let carouselTimer = 0;
let slideIndex = 0;
let waitTimer = 0;
let waitStartedAt = 0;
let waitPinned = false;

function showSlide(name) {
  const index = slides.findIndex((slide) => slide.dataset.slide === name);
  slideIndex = index >= 0 ? index : 0;
  slides.forEach((slide, i) => slide.classList.toggle("on", i === slideIndex));
  document.querySelectorAll('#viewtabs [data-state-for="preview"] .viewtab').forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.state === slides[slideIndex]?.dataset.slide);
  });
}

function startCarousel() {
  stopCarousel();
  if (prefersReducedMotion()) return;
  carouselTimer = window.setInterval(() => {
    slideIndex = (slideIndex + 1) % slides.length;
    showSlide(slides[slideIndex].dataset.slide);
  }, 2000);
}

function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = 0;
  }
}

let waitSecondsShown = -1;

function setWaitFill(ratio) {
  waitBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
}

function setWaitPhase(opening) {
  const writing = document.querySelector('[data-wait-phase="writing"]');
  const openingRow = document.querySelector('[data-wait-phase="opening"]');
  writing?.classList.toggle("is-now", !opening);
  writing?.classList.toggle("is-done", opening);
  openingRow?.classList.toggle("is-now", opening);
}

function startWait() {
  stopWait();
  waitStartedAt = performance.now();
  waitSecondsShown = -1;
  setWaitPhase(false);
  const tick = (now) => {
    const elapsed = now - waitStartedAt;
    const left = Math.max(0, WAIT_MS - elapsed);
    const ratio = Math.min(1, elapsed / WAIT_MS);
    if (prefersReducedMotion()) {
      setWaitFill(left <= 0 ? 1 : Math.ceil(ratio * 15) / 15);
    } else {
      setWaitFill(ratio);
    }
    const seconds = Math.ceil(left / 1000);
    if (seconds !== waitSecondsShown) {
      waitSecondsShown = seconds;
      waitCopy.textContent = seconds > 0
        ? `Writing your website · ${seconds} second${seconds === 1 ? "" : "s"} left`
        : "Opening your website…";
    }
    setWaitPhase(left <= WAIT_OPENING_MS);
    if (left <= 0) {
      stopWait({ resetFill: false });
      setWaitFill(1);
      if (!params.has("shot") && !waitPinned) {
        setScene("generated");
        setGeneratedState("unsigned");
      }
      return;
    }
    waitTimer = window.requestAnimationFrame(tick);
  };
  waitTimer = window.requestAnimationFrame(tick);
}

function stopWait(opts = {}) {
  if (waitTimer) {
    cancelAnimationFrame(waitTimer);
    waitTimer = 0;
  }
  if (opts.resetFill !== false) setWaitFill(0);
}

const activateStrip = document.getElementById("activateStrip");
const activatePanel = document.getElementById("activatePanel");
const activateOpen = document.getElementById("activateOpen");
const activateClose = document.getElementById("activateClose");
let activateTimer = 0;
let activateStep = "unsigned";

function showActivateStep(step) {
  document.querySelectorAll("[data-activate]").forEach((node) => {
    node.classList.toggle("is-hidden", node.dataset.activate !== step);
  });
}

function setActivatePanelOpen(open) {
  if (!activatePanel) return;
  activatePanel.hidden = !open;
  activateClose?.classList.toggle("is-hidden", !open);
  activateOpen?.classList.toggle("is-hidden", open);
}

function openWebsiteEditor() {
  const next = new URL("cms.html", location.href);
  next.searchParams.set("scene", "website");
  next.searchParams.set("publication", "1");
  next.searchParams.set("from", "activation");
  if (params.get("shot") === "1") next.searchParams.set("shot", "1");
  location.assign(next.href);
}

function setGeneratedState(state) {
  if (activateTimer) {
    clearTimeout(activateTimer);
    activateTimer = 0;
  }
  const paid = state === "paid";
  activateStrip?.classList.toggle("is-hidden", paid);
  if (paid) {
    setActivatePanelOpen(false);
    activateStep = "paid";
    openWebsiteEditor();
  } else if (state === "signed-in") {
    activateStep = "signed-in";
    showActivateStep("signed-in");
    setActivatePanelOpen(true);
  } else {
    activateStep = "unsigned";
    showActivateStep("unsigned");
    setActivatePanelOpen(false);
  }
  document.querySelectorAll('#viewtabs [data-state-for="generated"] .viewtab').forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.state === state);
  });
}

function startMockCheckout() {
  showActivateStep("paying");
  setActivatePanelOpen(true);
  activateTimer = window.setTimeout(() => {
    showActivateStep("activating");
    activateTimer = window.setTimeout(() => setGeneratedState("paid"), 900);
  }, 900);
}

document.getElementById("activateOpen")?.addEventListener("click", () => {
  showActivateStep(activateStep === "signed-in" ? "signed-in" : "unsigned");
  setActivatePanelOpen(true);
});
document.getElementById("activateClose")?.addEventListener("click", () => setActivatePanelOpen(false));
document.getElementById("activateSignUp")?.addEventListener("click", () => {
  activateStep = "signed-in";
  showActivateStep("signed-in");
  document.querySelectorAll('#viewtabs [data-state-for="generated"] .viewtab').forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.state === "signed-in");
  });
});
document.getElementById("activatePay")?.addEventListener("click", startMockCheckout);

document.querySelectorAll("#viewtabs .viewtab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.id === "skipGeneration") return;
    const scene = tab.closest("[data-state-for]")?.dataset.stateFor;
    if (scene) setScene(scene);
    const state = tab.dataset.state;
    if (scene === "find") setFindState(state);
    if (scene === "review") setReviewState(state);
    if (scene === "interview") setInterviewState(state);
    if (scene === "preview") {
      waitPinned = true;
      stopCarousel();
      showSlide(state);
    }
    if (scene === "generated") setGeneratedState(state);
  });
});

document.getElementById("viewtabsCollapse")?.addEventListener("click", () => setViewtabsCollapsed(true));
document.getElementById("viewtabsOpen")?.addEventListener("click", () => setViewtabsCollapsed(false));
setViewtabsCollapsed(preferViewtabsCollapsed());
if (params.has("shot")) document.body.classList.add("is-shot");

const scene = params.get("scene") || "find";
setScene(scene);
if (scene === "find") setFindState(params.get("state") || "empty");
if (scene === "review" || scene === "interview" || scene === "preview" || scene === "generated") setRegistrySelected(true);
if (scene === "review") setReviewState(params.get("state") || "ready");
if (scene === "interview") setInterviewState(params.get("state") || "text");
if (scene === "preview") {
  waitPinned = params.has("state") || params.has("shot");
  showSlide(params.get("state") || "hero");
}
if (scene === "generated") setGeneratedState(params.get("state") || "unsigned");

window.__SCREENSHOT_READY = true;

function setGuideCueCopy(text) {
  const line = document.querySelector("#onboardingGuideCue p");
  if (line) line.textContent = text;
}

function setGuideSpeaking(on) {
  guideDust?.setSpeaking(on);
  guideBounce?.setSpeaking(on);
}

function setGuideLevel(rms) {
  guideDust?.setLevel(rms);
  guideBounce?.setLevel(rms);
}

function stopGuideIntro() {
  guideIntroGen += 1;
  window.MockVoice?.stop();
  setGuideSpeaking(false);
}

function playGuideIntro() {
  stopGuideIntro();
  if (params.has("shot") || !window.MockVoice) return;
  const gen = guideIntroGen;
  let introPlaying = false;
  window.MockVoice.play(GUIDE_INTRO_SRC, {
    onStart: () => {
      if (gen !== guideIntroGen) return;
      introPlaying = true;
      setGuideSpeaking(true);
    },
    onEnd: () => {
      if (gen !== guideIntroGen) return;
      introPlaying = false;
      setGuideSpeaking(false);
    },
  });
  window.MockVoice.listen({
    onLevel: (rms) => {
      if (gen !== guideIntroGen) return;
      setGuideLevel(rms);
    },
    onSpeaking: (on) => {
      if (gen !== guideIntroGen) return;
      if (on) setGuideSpeaking(true);
      else if (!introPlaying) setGuideSpeaking(false);
    },
    onDenied: () => {
      if (gen !== guideIntroGen) return;
      setGuideSurface("cue");
      setGuideCueCopy(CUE_MIC_DENIED);
    },
  });
}

function syncGuideOrb(listening) {
  const canvas = document.getElementById("onboardingGuideCanvas");
  const host = document.getElementById("onboardingGuideOrb");
  const wrap = document.getElementById("onboardingGuide");
  const visible = Boolean(wrap && !wrap.classList.contains("is-hidden"));
  if (!visible) {
    guideDust?.destroy();
    guideBounce?.destroy();
    guideDust = null;
    guideBounce = null;
    return;
  }
  if (!guideDust && canvas && window.DustOrb) {
    guideDust = window.DustOrb.mount(canvas, {
      state: listening ? "listening" : "idle",
      speaking: false,
      inkColor: GUIDE_INK,
    });
    guideBounce = window.DustOrb.bindBounce(host);
  }
  guideDust?.setState(listening ? "listening" : "idle");
  if (!listening) setGuideSpeaking(false);
}

function setGuideSurface(mode) {
  const wrap = document.getElementById("onboardingGuide");
  const orb = document.getElementById("onboardingGuideOrb");
  const cue = document.getElementById("onboardingGuideCue");
  const enable = document.getElementById("onboardingGuideEnable");
  if (currentScene() === "preview" || currentScene() === "generated") mode = "hidden";
  if (mode !== "hidden") guideMode = mode;
  const listening = mode === "listening";
  const cueOn = mode === "cue";
  const dismissed = mode === "dismissed";
  wrap?.classList.toggle("is-hidden", mode === "hidden" || dismissed);
  wrap?.setAttribute("aria-hidden", listening || cueOn ? "false" : "true");
  cue?.classList.toggle("is-hidden", !cueOn);
  enable?.classList.toggle("is-hidden", !dismissed);
  orb?.setAttribute("aria-pressed", listening ? "true" : "false");
  if (listening || dismissed) setGuideCueCopy(CUE_TURN_ON);
  if (!listening) stopGuideIntro();
  syncGuideOrb(listening);
}

document.getElementById("onboardingGuideOrb")?.addEventListener("click", () => {
  if (document.getElementById("onboardingGuideOrb")?.getAttribute("aria-pressed") === "true") return;
  setGuideSurface("listening");
  playGuideIntro();
});
document.getElementById("onboardingGuideCue")?.addEventListener("click", () => {
  setGuideSurface("listening");
  playGuideIntro();
});
document.getElementById("onboardingGuideClose")?.addEventListener("click", () => setGuideSurface("dismissed"));
document.getElementById("onboardingGuideEnable")?.addEventListener("click", () => {
  setGuideSurface("listening");
  playGuideIntro();
});
setGuideSurface(guideMode);
