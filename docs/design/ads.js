/* Mock-only scene wiring for ads.html. Not product UI.
   Combobox and yellow strip: details-fields.js (loaded first). */

  // view switcher: list of existing ads vs the new/edit ad flow vs ad detail
  const viewList = document.getElementById("viewList");
  const viewFlow = document.getElementById("viewFlow");
  const viewDetail = document.getElementById("viewDetail");
  const vtabs = [...document.querySelectorAll(".viewtab")];
  const show = v => {
    const onFlow = v === "flow" || v === "review";
    vtabs.forEach(t => t.classList.toggle("on", t.dataset.v === v || (v === "detail" && t.dataset.v === "list")));
    viewList.classList.toggle("placeholder", v !== "list");
    viewFlow.classList.toggle("placeholder", !onFlow);
    viewDetail.classList.toggle("placeholder", v !== "detail");
    if (v === "review") {
      unlockReview();
      window.scrollTo({ top: 0 });
      f2.scrollIntoView({ block: "start" });
      return;
    }
    if (v === "flow") lockReview();
    window.scrollTo({ top: 0 });
  };
  vtabs.forEach(t => t.addEventListener("click", () => show(t.dataset.v)));
  const adcards = document.querySelector(".adcards");
  const compactBtn = document.getElementById("compactBtn");
  compactBtn.addEventListener("click", () => {
    const compact = adcards.classList.toggle("compact");
    compactBtn.textContent = compact ? "Show large" : "Show compact";
  });

  document.getElementById("newAdBtn").addEventListener("click", () => show("flow"));
  document.querySelectorAll(".adcard").forEach(r => r.addEventListener("click", () => show("detail")));
  document.getElementById("backBtn").addEventListener("click", () => show("list"));
  document.getElementById("editBtn").addEventListener("click", () => show("flow"));

  // silent edit: the name field is an invisible form that adaptively wraps the text
  const nameInput = document.querySelector(".inplace");
  const nameSizer = document.querySelector(".inplace-sizer");
  const fitName = () => { nameSizer.textContent = nameInput.value || " "; };
  nameInput.addEventListener("input", fitName);
  fitName();

  // gallery: one-image ads show the photo only — Edit is how you change it
  const galMain = document.getElementById("galMain");
  const galBase = "fixtures/bellfield/";
  galMain.style.backgroundImage = 'url("' + galBase + 'image1.jpeg")';

  // duration: remaining days in the run window; end date is the native picker
  const durStartISO = "2026-08-15";
  const durEnd = document.getElementById("durEnd");
  const durLeft = document.getElementById("durLeft");
  const durStart = document.getElementById("durStart");
  const durEndLabel = document.getElementById("durEndLabel");
  const parseISODate = iso => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const monthDay = iso => parseISODate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  durStart.textContent = monthDay(durStartISO);
  const updateDur = () => {
    if (!durEnd.value) return;
    durEndLabel.textContent = monthDay(durEnd.value);
    const days = Math.round((parseISODate(durEnd.value) - startOfDay(new Date())) / 86400000);
    durLeft.textContent = days > 1 ? days + " days left" : days === 1 ? "1 day left" : days === 0 ? "Last day" : "Ended";
  };
  durEnd.addEventListener("change", updateDur);
  updateDur();

  // drop-to-add anywhere on the page
  const dropper = document.getElementById("dropper");
  let dragDepth = 0;
  ["dragenter", "dragover"].forEach(ev => window.addEventListener(ev, e => {
    e.preventDefault();
    if (e.dataTransfer && [...e.dataTransfer.types].includes("Files")) { dragDepth++; dropper.classList.add("show"); }
  }));
  ["dragleave", "drop"].forEach(ev => window.addEventListener(ev, e => {
    e.preventDefault();
    if (ev === "dragleave") dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dropper.classList.remove("show");
  }));
  window.addEventListener("drop", e => { e.preventDefault(); dragDepth = 0; dropper.classList.remove("show"); });
  const f1 = document.getElementById("f1");
  const f2 = document.getElementById("f2");

  // '+ Add' opens the file picker (upload through the media flow)
  const addBtn = document.getElementById("addBtn");
  const fileAdd = document.getElementById("fileAdd");
  const cancelUploadHtml = '<span class="thumb-status"><span class="spin" aria-hidden="true"></span><span class="idle">Uploading…</span><button type="button" class="thumb-cancel" aria-label="Cancel upload"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 5l6 6M11 5l-6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button></span>';
  addBtn.addEventListener("click", () => fileAdd.click());
  fileAdd.addEventListener("change", () => {
    if (fileAdd.files.length) {
      const t = document.createElement("div");
      t.className = "thumb is-busy";
      t.setAttribute("aria-busy", "true");
      t.innerHTML = cancelUploadHtml;
      addBtn.insertAdjacentElement("beforebegin", t);
    }
    fileAdd.value = "";
  });

  // before/after sweep: clip a full-size layer — don't resize the image
  const sweep = document.getElementById("sweep");
  const setSplit = x => {
    const r = sweep.getBoundingClientRect();
    const pct = Math.max(4, Math.min(96, ((x - r.left) / r.width) * 100));
    sweep.style.setProperty("--split", pct + "%");
  };
  let sweeping = false;
  sweep.addEventListener("pointerdown", e => { sweeping = true; sweep.setPointerCapture(e.pointerId); setSplit(e.clientX); });
  sweep.addEventListener("pointermove", e => { if (sweeping) setSplit(e.clientX); });
  sweep.addEventListener("pointerup", () => { sweeping = false; });
  sweep.addEventListener("pointercancel", () => { sweeping = false; });

  // live character counters
  document.querySelectorAll("[data-limit]").forEach(field => {
    const counter = field.closest(".copyfield").querySelector(".count");
    const update = () => { counter.textContent = field.value.length + " / " + field.dataset.limit; };
    field.addEventListener("input", update);
  });

  const fmtNames = { feed_square: "Square feed", feed_portrait: "Portrait feed", carousel: "Carousel", story: "Story" };
  const copyHeadline = document.getElementById("copyHeadline");
  const copyText = document.getElementById("copyText");
  const copyShort = document.getElementById("copyShort");
  const copyCta = document.getElementById("copyCta");
  const copyUndo = [];
  function restoreCleanupCompare() {
    document.querySelector(".sweep-before").style.filter = "";
    sweep.style.setProperty("--split", "50%");
    document.querySelector(".cleanup-stage").hidden = false;
    document.querySelector(".cleanup-hints").hidden = false;
  }
  function pushCopyUndo(field) {
    copyUndo.push({ kind: "copy", field, value: field.value });
  }
  function syncPreviewCopy() {
    const hl = copyHeadline.value;
    const body = copyText.value;
    const short = copyShort.value;
    const cta = copyCta.value;
    document.querySelectorAll(".js-headline").forEach(el => { el.textContent = hl; });
    document.querySelectorAll(".js-primary").forEach(el => { el.textContent = body; });
    document.querySelectorAll(".js-short").forEach(el => { el.textContent = short; });
    document.querySelectorAll(".js-cta").forEach(el => { el.textContent = cta; });
  }
  [copyHeadline, copyText, copyShort, copyCta].forEach(el => el.addEventListener("input", syncPreviewCopy));
  copyCta.addEventListener("change", syncPreviewCopy);
  document.addEventListener("keydown", e => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
    if (!copyUndo.length) return;
    const last = copyUndo.pop();
    if (last.kind === "cleanup") restoreCleanupCompare();
    else {
      last.field.value = last.value;
      last.field.dispatchEvent(new Event("input"));
    }
    e.preventDefault();
  });

  function closeAiPrompts() {
    document.querySelectorAll(".ai-prompt.open").forEach(other => {
      other.classList.remove("open");
      other.style.top = "";
      other.style.left = "";
      other.style.right = "";
      other.style.bottom = "";
      other.style.transform = "";
      const otherOrb = document.querySelector('[aria-controls="' + other.id + '"]');
      if (otherOrb) otherOrb.setAttribute("aria-expanded", "false");
    });
  }
  document.querySelectorAll(".cms-ai-orb").forEach(orb => {
    const prompt = document.getElementById(orb.getAttribute("aria-controls"));
    const ta = prompt.querySelector("textarea");
    const go = prompt.querySelector(".button-primary");
    const syncGo = () => { go.disabled = !ta.value.trim(); };
    ta.addEventListener("input", syncGo);
    orb.addEventListener("click", () => {
      const open = !prompt.classList.contains("open");
      closeAiPrompts();
      if (!open) return;
      prompt.classList.add("open");
      orb.setAttribute("aria-expanded", "true");
      ta.focus();
    });
    go.addEventListener("click", () => {
      if (!ta.value.trim()) return;
      const fieldId = { "prompt-headline": copyHeadline, "prompt-text": copyText, "prompt-short": copyShort }[prompt.id];
      if (fieldId) pushCopyUndo(fieldId);
      if (prompt.id === "prompt-cleanup") restoreCleanupCompare();
      prompt.classList.remove("open");
      orb.setAttribute("aria-expanded", "false");
      ta.value = "";
      syncGo();
    });
  });
  [copyHeadline, copyText, copyShort].forEach(field => {
    field.addEventListener("mouseup", () => {
      const start = field.selectionStart;
      const end = field.selectionEnd;
      if (start === end) return;
      const orb = field.parentElement.querySelector(".cms-ai-orb");
      if (!orb) return;
      const prompt = document.getElementById(orb.getAttribute("aria-controls"));
      closeAiPrompts();
      prompt.classList.add("open");
      orb.setAttribute("aria-expanded", "true");
      prompt.querySelector("textarea").focus();
    });
  });

  const platToggle = document.getElementById("platToggle");
  platToggle.addEventListener("click", (event) => {
    const btn = event.target.closest(".plat");
    if (!btn) return;
    platToggle.querySelectorAll(".plat").forEach(other => other.classList.toggle("on", other === btn));
    applyPlatFilter();
  });
  window.matchMedia("(max-width: 720px)").addEventListener("change", applyPlatFilter);

  // approve first, then download becomes available (temporary manual ad-posting bridge)
  const apprBtn = document.getElementById("apprBtn");
  const dlBtn = document.getElementById("dlBtn");
  const dlWrap = document.getElementById("dlWrap");
  apprBtn.addEventListener("click", () => {
    dlBtn.disabled = false;
    dlWrap.dataset.tip = "Download the ad set (temporary, until ad posting ships)";
    apprBtn.disabled = true;
    apprBtn.textContent = "Approved";
  });

  const fpills = document.getElementById("fpills");
  const fmtErr = document.getElementById("fmtErr");
  const thumbs = document.getElementById("thumbs");
  const sweepRatio = { feed_square: [1, 1], feed_portrait: [4, 5], carousel: [1, 1], story: [9, 16] };
  function selectedFormat() {
    const on = fpills.querySelector(".fpill.on");
    return on ? on.dataset.format : "";
  }
  function setSweepImage(src) {
    document.querySelectorAll(".sweep-after, .sweep-before").forEach(el => {
      el.style.backgroundImage = 'url("' + src + '")';
    });
  }
  function syncReviewLayout() {
    const fmt = selectedFormat();
    const pair = sweepRatio[fmt] || [1, 1];
    const stage = sweep.closest(".cleanup-stage");
    stage.style.setProperty("--ar-w", pair[0]);
    stage.style.setProperty("--ar-h", pair[1]);
    const selectedImg = thumbs.querySelector(".thumb.on img");
    if (selectedImg) setSweepImage(selectedImg.getAttribute("src"));
  }
  function syncFormatPreviews() {
    const on = selectedFormat();
    const previews = document.getElementById("previews");
    previews.classList.remove("fmt-feed_square", "fmt-feed_portrait", "fmt-carousel", "fmt-story");
    previews.classList.add("fmt-" + on);
    const label = fmtNames[on] || "Square feed";
    document.querySelectorAll(".js-fmt-cap").forEach(el => { el.textContent = label; });
    fpills.querySelectorAll(".fpill").forEach(pill => {
      const selected = pill.classList.contains("on");
      pill.setAttribute("aria-checked", selected ? "true" : "false");
    });
    syncReviewLayout();
    syncPreviewCopy();
    applyPlatFilter();
  }
  function applyPlatFilter() {
    const narrow = window.matchMedia("(max-width: 720px)").matches;
    const on = platToggle.querySelector(".plat.on");
    document.querySelectorAll("#previews .meta-card").forEach(card => {
      card.classList.toggle("is-plat-off", narrow && card.dataset.plat !== on.dataset.plat);
    });
  }
  fpills.addEventListener("click", (event) => {
    const pill = event.target.closest(".fpill");
    if (!pill || fpills.classList.contains("is-locked")) return;
    fpills.querySelectorAll(".fpill").forEach(other => other.classList.toggle("on", other === pill));
    fmtErr.style.display = "none";
    syncFormatPreviews();
  });
  thumbs.addEventListener("click", (event) => {
    const thumb = event.target.closest(".thumb");
    if (!thumb || thumb.classList.contains("add")) return;
    if (thumb.classList.contains("is-busy")) {
      if (!event.target.closest(".thumb-cancel")) return;
      thumb.remove();
      return;
    }
    thumbs.querySelectorAll(".thumb.on").forEach(other => other.classList.remove("on"));
    thumb.classList.add("on");
    const img = thumb.querySelector("img");
    if (img) setSweepImage(img.getAttribute("src"));
  });
  document.getElementById("cleanupReject").addEventListener("click", () => {
    document.querySelector(".cleanup-stage").hidden = true;
    document.querySelector(".cleanup-hints").hidden = true;
  });
  document.getElementById("cleanupAccept").addEventListener("click", () => {
    copyUndo.push({ kind: "cleanup" });
    document.querySelector(".sweep-before").style.filter = "none";
    sweep.style.setProperty("--split", "100%");
  });
  syncFormatPreviews();

  // generate: loading, then form 1 done, form 2 unlocks and expands
  document.getElementById("generate").addEventListener("click", () => {
    const svc = document.querySelector("#f1 .cms-combo input");
    const svcErr = document.getElementById("svcErr");
    if (!svc.value.trim()) { svcErr.style.display = "flex"; svc.focus(); return; }
    svcErr.style.display = "none";
    if (!selectedFormat()) { fmtErr.style.display = "flex"; return; }
    fmtErr.style.display = "none";
    const ld = document.getElementById("loading");
    ld.classList.add("show");
    setTimeout(() => {
      ld.classList.remove("show");
      unlockReview();
      vtabs.forEach(t => t.classList.toggle("on", t.dataset.v === "review"));
      window.scrollTo({ top: f2.offsetTop - 80, behavior: "smooth" });
    }, 2500);
  });
  // once unlocked, form 2 can be collapsed; Revise reopens About the ad for edits
  f2.querySelector(".sech").addEventListener("click", () => {
    if (f2.classList.contains("locked")) return;
    f2.classList.toggle("open");
  });

  const cmsNotice = document.getElementById("cmsNotice");
  const reviseBtn = document.getElementById("reviseBtn");
  const generateBtn = document.getElementById("generate");
  const generateWrap = document.getElementById("generateWrap");
  let generatedOnce = false;
  function setAboutConfirmed(on) {
    f1.classList.toggle("is-confirmed", on);
    reviseBtn.hidden = !generatedOnce;
    generateWrap.hidden = false;
    fpills.classList.toggle("is-locked", on);
  }
  function lockReview() {
    generatedOnce = false;
    f2.classList.add("locked");
    f2.classList.remove("open");
    f2.querySelector(".state").textContent = "Complete step 1 to unlock";
    generateBtn.textContent = "Create ad and generate";
    setAboutConfirmed(false);
    cmsNotice.hidden = true;
  }
  function unlockReview() {
    generatedOnce = true;
    const svc = document.querySelector("#f1 .cms-combo input");
    if (svc && !svc.value.trim()) svc.value = "Roofing replacement";
    f2.classList.remove("locked");
    f2.classList.add("open");
    f2.querySelector(".state").textContent = "";
    generateBtn.textContent = "Generate again";
    setAboutConfirmed(true);
    cmsNotice.hidden = false;
    syncFormatPreviews();
  }
  reviseBtn.addEventListener("click", () => {
    setAboutConfirmed(false);
    generateBtn.textContent = "Generate again";
    f1.scrollIntoView({ block: "start" });
  });
  document.getElementById("noticeOk").addEventListener("click", () => { cmsNotice.hidden = true; });
  document.getElementById("noticeRevert").addEventListener("click", () => { cmsNotice.hidden = true; });
  const params = new URLSearchParams(location.search);
  const scene = params.get("scene") || (location.hash || "#list").slice(1) || "list";
  if (params.has("shot")) {
    const headlinePrompt = document.getElementById("prompt-headline");
    const headlineOrb = document.querySelector('[aria-controls="prompt-headline"]');
    if (headlinePrompt && headlineOrb) {
      headlinePrompt.classList.add("open");
      headlineOrb.setAttribute("aria-expanded", "true");
    }
    cmsNotice.hidden = true;
  }
  if (scene === "review") show("review");
  else if (scene === "flow") show("flow");
  if (scene === "detail") show("detail");
  if (scene === "compact") { show("list"); adcards.classList.add("compact"); compactBtn.textContent = "Show large"; }
  window.__SCREENSHOT_READY = true;
