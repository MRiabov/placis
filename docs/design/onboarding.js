/* Mock-only scene wiring for onboarding.html. Not product UI. */

const params = new URLSearchParams(location.search);
const views = [...document.querySelectorAll("[data-view]")];
const steps = [...document.querySelectorAll("[data-step]")];
const order = ["find", "review", "interview", "preview"];

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
  views.forEach((view) => view.classList.toggle("is-hidden", view.dataset.view !== scene));
  steps.forEach((step, i) => {
    step.classList.toggle("is-current", step.dataset.step === scene);
    step.classList.toggle("is-done", i < index);
  });
  document.getElementById("backBtn")?.classList.toggle("is-hidden", scene === "find");
  if (scene !== "review" && scene !== "interview") waitNotice?.classList.add("is-hidden");
  if (scene !== "find") restoreNotice?.classList.add("is-hidden");
  syncStateGroups(scene);
  if (scene === "preview") startCarousel();
  else stopCarousel();
}

function currentScene() {
  return views.find((view) => !view.classList.contains("is-hidden"))?.dataset.view || "find";
}

document.querySelectorAll("[data-scene]").forEach((node) => {
  node.addEventListener("click", () => setScene(node.dataset.scene));
});
document.getElementById("backBtn")?.addEventListener("click", () => {
  const index = order.indexOf(currentScene());
  if (index > 0) setScene(order[index - 1]);
});
document.getElementById("continueInterview")?.addEventListener("click", () => setScene("interview"));
document.getElementById("interviewForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  setScene("preview");
});

const registryQuery = document.getElementById("registryQuery");
const registryList = document.getElementById("registryList");
const registryPicked = document.getElementById("registryPicked");
const mapsQuery = document.getElementById("mapsQuery");
const mapsList = document.getElementById("mapsList");
const mapsPicked = document.getElementById("mapsPicked");
const consent = document.getElementById("consent");
const lookupBtn = document.getElementById("lookupBtn");
const lookupLabel = document.getElementById("lookupLabel");
const findPanel = document.getElementById("findPanel");
const findRestore = document.getElementById("findRestore");
const restoreNotice = document.getElementById("restoreNotice");
const waitNotice = document.getElementById("waitNotice");

let registrySelected = false;
let mapsSelected = false;

function syncLookup() {
  const ready = consent.checked && (registrySelected || mapsSelected);
  lookupBtn.disabled = !ready;
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
lookupBtn?.addEventListener("click", () => {
  if (lookupBtn.disabled) return;
  lookupLabel.textContent = "Looking the business up…";
  lookupBtn.disabled = true;
  window.setTimeout(() => {
    lookupLabel.textContent = "Business lookup";
    setScene("review");
    setReviewState("ready");
  }, 700);
});

const country = document.getElementById("country");
const registryHint = document.getElementById("registryHint");
const registryName = document.getElementById("registryName");
country?.addEventListener("change", () => {
  const copy = {
    IE: ["Type the corporate name and pick the company registry record.", "(CRO)"],
    GB: ["Type the corporate name and pick the Companies House record.", "(Companies House)"],
    US: ["Type the corporate name and pick the state registry record.", "(state registry)"],
  }[country.value] || ["Type the corporate name and pick the company registry record.", ""];
  registryHint.textContent = copy[0];
  registryName.textContent = copy[1];
});

function setFindState(state) {
  findPanel.classList.toggle("is-hidden", state === "restoring");
  findRestore.classList.toggle("is-hidden", state !== "restoring");
  restoreNotice.classList.toggle("is-hidden", state !== "restoring");
  document.getElementById("registrySpin")?.classList.toggle("is-hidden", state !== "looking-up");
  document.getElementById("registrySearchIcon")?.classList.toggle("is-hidden", state === "looking-up");
  lookupLabel.textContent = state === "looking-up" ? "Looking the business up…" : "Business lookup";
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
  if (state === "looking-up") lookupBtn.disabled = true;
  else syncLookup();
  document.querySelectorAll('#viewtabs [data-state-for="find"] .viewtab').forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.state === state);
  });
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
  document.getElementById("missingQueue")?.classList.toggle("is-hidden", complete);
  document.getElementById("readyNote")?.classList.toggle("is-hidden", !complete);
  document.getElementById("foundCount").textContent = complete ? "12 details found" : "8 details found";
  document.getElementById("foundPct").textContent = complete ? "100%" : "62%";
  document.getElementById("foundBar").style.width = complete ? "100%" : "62%";
  document.getElementById("missingCopy").textContent = complete
    ? "We have enough to apply the website template after the client interview."
    : "5 topics left before the unpublished website can be trusted.";
  document.querySelectorAll('#viewtabs [data-state-for="review"] .viewtab').forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.state === state);
  });
}

function setInterviewState(state) {
  const voice = state === "voice";
  const fewPhotos = state === "few-photos";
  const noReviews = state === "no-reviews";
  document.getElementById("interviewForm")?.classList.toggle("is-hidden", voice);
  document.getElementById("voicePanel")?.classList.toggle("is-hidden", !voice);
  document.querySelectorAll("[data-channel]").forEach((button) => {
    button.classList.toggle("on", button.dataset.channel === (voice ? "voice" : "text"));
  });
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
}

document.querySelectorAll("[data-channel]").forEach((button) => {
  button.addEventListener("click", () => setInterviewState(button.dataset.channel === "voice" ? "voice" : "text"));
});
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
document.getElementById("hours")?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-hour]");
  if (!action) return;
  const row = action.closest(".hour-row");
  if (action.dataset.hour === "closed") row.classList.toggle("is-closed");
  if (action.dataset.hour === "add") row.querySelector(".extra-block")?.classList.remove("is-hidden");
});

const slides = [...document.querySelectorAll("[data-slide]")];
let carouselTimer = 0;
let slideIndex = 0;

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

document.querySelectorAll("#viewtabs .viewtab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const scene = tab.closest("[data-state-for]")?.dataset.stateFor;
    if (scene) setScene(scene);
    const state = tab.dataset.state;
    if (scene === "find") setFindState(state);
    if (scene === "review") setReviewState(state);
    if (scene === "interview") setInterviewState(state);
    if (scene === "preview") {
      stopCarousel();
      showSlide(state);
    }
  });
});

document.getElementById("viewtabsCollapse")?.addEventListener("click", () => setViewtabsCollapsed(true));
document.getElementById("viewtabsOpen")?.addEventListener("click", () => setViewtabsCollapsed(false));
setViewtabsCollapsed(preferViewtabsCollapsed());
if (params.has("shot")) document.body.classList.add("is-shot");

const scene = params.get("scene") || "find";
setScene(scene);
if (scene === "find") setFindState(params.get("state") || "empty");
if (scene === "review" || scene === "interview" || scene === "preview") setRegistrySelected(true);
if (scene === "review") setReviewState(params.get("state") || "ready");
if (scene === "interview") setInterviewState(params.get("state") || "text");
if (scene === "preview") showSlide(params.get("state") || "hero");

window.__SCREENSHOT_READY = true;
