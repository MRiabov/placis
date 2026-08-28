/* Mock-only scene wiring for cms.html. Not product UI.
   Combo, hours picker, featured services, and service-area territories:
   details-fields.js (loaded first). */

const params = new URLSearchParams(location.search);
const frame = document.getElementById("frame");
const profileChildren = document.getElementById("profileChildren");
const profileToggle = document.getElementById("profileToggle");
const accountPopover = document.getElementById("accountPopover");
const publicationPanel = document.getElementById("publicationPanel");
const canvasFrame = document.getElementById("canvasFrame");
const canvasStage = document.getElementById("canvasStage");
const canvasScale = document.getElementById("canvasScale");
const canvasNativeWidths = { desktop: 1080, tablet: 760, mobile: 390 };
const editorCanvas = document.getElementById("editorCanvas");
const connectModal = document.getElementById("connectModal");
const sectionLabel = document.getElementById("sectionLabel");
const views = [...document.querySelectorAll("[data-view]")];
const navItems = [...document.querySelectorAll("[data-nav]")];
const railButtons = [...document.querySelectorAll(".cms-workspace-rail [data-rail]")];
const railPanels = [...document.querySelectorAll("[data-rail-panel]")];
const contentPanel = document.getElementById("contentPanel");
const sectionBlocks = [...document.querySelectorAll(".canvas-block[data-section]")];
const contentLayouts = [...document.querySelectorAll("[data-content-layout]")];
const pageItems = [...document.querySelectorAll(".cms-page-item[data-page]")];
const profileScenes = new Set(["details", "projects", "certifications", "create-review", "media"]);
const seoByPage = {
  home: { title: "Bellfield Roofing | Dublin", path: "/", desc: "Dublin roofing repairs, re-roofs, and guttering." },
  services: { title: "Roof repairs | Bellfield Roofing", path: "/roof-repairs", desc: "Slate, tile, and flat roof repairs across Dublin." },
  contact: { title: "Contact | Bellfield Roofing", path: "/contact", desc: "Request a call back from Bellfield Roofing." },
  privacy: { title: "Privacy | Bellfield Roofing", path: "/privacy", desc: "How Bellfield Roofing uses the details you send." },
  terms: { title: "Terms | Bellfield Roofing", path: "/terms", desc: "Terms for using the Bellfield Roofing website." },
};
const contentBySection = {
  hero: "slots",
  services: "slots",
  reviews: "reviews",
  form: "form",
  "top-menu": "top-menu",
  footer: "footer",
};
const sectionNames = {
  hero: "Hero",
  services: "Services",
  reviews: "Reviews",
  form: "Website form",
  "top-menu": "Top menu",
  footer: "Footer",
};
const websitePages = [
  { id: "home", title: "Home" },
  { id: "services", title: "Roof repairs" },
  { id: "contact", title: "Contact" },
  { id: "privacy", title: "Privacy" },
  { id: "terms", title: "Terms" },
];
const menuUrls = [
  { label: "Emergency", href: "https://bellfield.ie/emergency" },
  { label: "Facebook", href: "https://www.facebook.com/bellfieldroofing" },
];

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function pageSelectHtml(selected) {
  return `<select class="cms-field-control cms-nav-page" aria-label="Website page">${websitePages.map((page) => `<option value="${page.id}"${page.id === selected ? " selected" : ""}>${esc(page.title)}</option>`).join("")}</select>`;
}

function urlComboHtml(href) {
  const current = href || "";
  const rows = menuUrls.map((item) => {
    const on = item.href === current;
    return `<button type="button" class="cms-combo-row${on ? " is-current" : ""}" data-href="${esc(item.href)}" data-label="${esc(item.label)}"><span class="cms-combo-check">${on ? "✓" : ""}</span><span class="cms-combo-txt"><b>${esc(item.label)}</b><span>${esc(item.href)}</span></span></button>`;
  }).join("");
  return `<div class="cms-combo cms-nav-url" data-create="URL"><input class="cms-field-control" value="${esc(current)}" placeholder="Select or type to create a new URL…" /><div class="cms-combo-pop"><div class="cms-combo-create"><button type="button" class="cms-combo-crow is-hint">Type to create a new URL…</button></div><div class="cms-combo-divider is-hidden"></div><p class="cms-combo-group">Existing URLs</p><div class="cms-combo-scroll">${rows}</div></div></div>`;
}

function navValueHtml(row) {
  const kind = row.dataset.kind || "page";
  if (kind === "text") return `<input class="cms-field-control cms-nav-text" value="${esc(row.dataset.text || "")}" aria-label="Text" />`;
  if (kind === "url") return urlComboHtml(row.dataset.urlHref);
  return pageSelectHtml(row.dataset.page || "home");
}

function hydrateNavRow(row) {
  const kind = row.dataset.kind || "page";
  row.innerHTML = `<select class="cms-field-control cms-nav-kind" aria-label="Kind"><option value="page"${kind === "page" ? " selected" : ""}>Website page</option><option value="text"${kind === "text" ? " selected" : ""}>Text</option><option value="url"${kind === "url" ? " selected" : ""}>URL</option></select><div class="cms-nav-value">${navValueHtml(row)}</div>`;
  row.querySelector(".cms-nav-kind").addEventListener("change", (event) => {
    row.dataset.kind = event.target.value;
    row.querySelector(".cms-nav-value").innerHTML = navValueHtml(row);
    const combo = row.querySelector(".cms-combo");
    if (combo) bindCombo(combo);
  });
  const combo = row.querySelector(".cms-combo");
  if (combo) bindCombo(combo);
}

function setBarCta(name, on) {
  document.querySelectorAll(`.cms-toggle[data-bar-cta="${name}"]`).forEach((toggle) => {
    toggle.setAttribute("aria-checked", String(on));
  });
  document.querySelectorAll(`[data-bar-cta-target="${name}"]`).forEach((node) => {
    node.classList.toggle("is-hidden", !on);
  });
}

function matchesStateFor(node, scene) {
  return (node.dataset.stateFor || "").split(/\s+/).filter(Boolean).includes(scene);
}

function syncStateGroups(scene) {
  document.querySelectorAll("[data-state-for]").forEach((node) => {
    node.classList.toggle("is-hidden", !matchesStateFor(node, scene));
  });
  document.querySelectorAll("#viewtabs .viewtab[data-scene]").forEach((tab) => {
    tab.classList.toggle("on", tab.dataset.scene === scene);
  });
}

function stripButton(state, extra = "") {
  return document.querySelector(`#viewtabs [data-state="${state}"]${extra}`);
}

function setCopyOut(on) {
  document.getElementById("copyOut")?.classList.toggle("is-hidden", !on);
  stripButton("copy-out")?.classList.toggle("on", on);
}

function setAskFirst(on) {
  document.getElementById("askPills")?.classList.toggle("is-hidden", !on);
  document.querySelector(".fake-hero")?.classList.toggle("is-pending", on);
  stripButton("ask-first")?.classList.toggle("on", on);
  requestAnimationFrame(syncCanvasScale);
}

function setPublication(open) {
  publicationPanel.classList.toggle("is-hidden", !open);
  document.getElementById("publicationToggle")?.setAttribute("aria-expanded", String(open));
  stripButton("publication")?.classList.toggle("on", open);
}

function publicationHostRow() {
  return document.querySelector(".cms-publication-hosts .cms-publication-row:not(.is-add):not(.is-waiting)");
}

function setConnect(open) {
  connectModal.classList.toggle("is-hidden", !open);
  stripButton("connect")?.classList.toggle("on", open);
  if (open) setPublication(false);
}

function canUseHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function bindHoverTap(button, panel, { onOpen } = {}) {
  if (!button || !panel) return { close() {}, isOpen: () => false };
  let hover = false;
  let tap = false;
  let closeTimer = 0;
  const open = () => hover || tap;
  const sync = () => {
    const shown = open();
    button.classList.toggle("is-open", shown);
    button.setAttribute("aria-expanded", String(shown));
    panel.classList.toggle("is-open", shown);
    panel.setAttribute("aria-hidden", String(!shown));
    if (shown) onOpen?.();
  };
  const cancel = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = 0;
    }
  };
  const close = () => {
    cancel();
    hover = false;
    tap = false;
    sync();
  };
  button.addEventListener("click", () => {
    if (canUseHover()) return;
    hover = false;
    tap = !tap;
    sync();
  });
  button.addEventListener("mouseenter", () => {
    if (!canUseHover()) return;
    cancel();
    hover = true;
    sync();
  });
  button.addEventListener("mouseleave", (event) => {
    if (!canUseHover()) return;
    if (panel.contains(event.relatedTarget)) return;
    cancel();
    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      hover = false;
      sync();
    }, 120);
  });
  panel.addEventListener("mouseenter", () => {
    if (!canUseHover()) return;
    cancel();
    hover = true;
    sync();
  });
  panel.addEventListener("mouseleave", () => {
    if (!canUseHover()) return;
    cancel();
    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      hover = false;
      sync();
    }, 120);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!open()) return;
    if (button.contains(event.target) || panel.contains(event.target)) return;
    close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  return { close, isOpen: open };
}

const homePromptWrap = document.querySelector('[data-view="home"]');
const homeConnectBtn = document.getElementById("homeConnect");
const homeVoiceBtn = document.getElementById("homeVoice");
const mcpConnectPanel = document.getElementById("mcpConnectPanel");
const homeVoicePanel = document.getElementById("homeVoicePanel");
const homeVoiceOverlay = document.getElementById("homeVoiceOverlay");
let closeHomeConnect = () => {};
let closeHomeVoicePanel = () => {};

function setMcpConnected(on) {
  homePromptWrap?.classList.toggle("is-mcp-connected", on);
  stripButton("mcp-connected")?.classList.toggle("on", on);
  if (on) closeHomeConnect();
}

function setHomeVoice(on) {
  homeVoiceOverlay?.classList.toggle("is-hidden", !on);
  homeVoiceOverlay?.setAttribute("aria-hidden", String(!on));
  stripButton("home-voice")?.classList.toggle("on", on);
  if (on) {
    closeHomeConnect();
    closeHomeVoicePanel();
  }
}

function setArchive(open) {
  document.getElementById("archiveList")?.classList.toggle("is-hidden", !open);
  document.getElementById("archiveSection")?.classList.toggle("is-collapsed", !open);
  document.getElementById("archiveHeading")?.setAttribute("aria-expanded", String(open));
  stripButton("archive")?.classList.toggle("on", open);
}

function isNarrow() {
  return window.matchMedia("(max-width: 1100px)").matches;
}

function labelsVisible() {
  return isNarrow() || !frame.classList.contains("is-collapsed") || frame.classList.contains("is-peeking");
}

function setNavOpen(open) {
  frame.classList.toggle("is-nav-open", open);
  const sidebar = document.querySelector(".cms-dashboard-sidebar");
  if (sidebar) {
    sidebar.toggleAttribute("inert", !open && isNarrow());
    sidebar.setAttribute("aria-hidden", String(!open && isNarrow()));
  }
  document.querySelectorAll(".cms-nav-open").forEach((button) => {
    button.setAttribute("aria-expanded", String(open));
  });
}

function setNotify(on) {
  document.getElementById("cmsNotification")?.classList.toggle("is-hidden", !on);
  stripButton("notify")?.classList.toggle("on", on);
}

function setPeeking(on) {
  if (isNarrow() || !frame.classList.contains("is-collapsed")) {
    frame.classList.remove("is-peeking");
    syncCollapsed();
    return;
  }
  frame.classList.toggle("is-peeking", on);
  syncCollapsed();
}

function setSidebarCollapsed(collapsed) {
  frame.classList.toggle("is-collapsed", collapsed);
  if (!collapsed) frame.classList.remove("is-peeking");
  syncCollapsed();
  const toggle = document.getElementById("sidebarToggle");
  if (toggle) toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  stripButton("sidebar")?.classList.toggle("on", !collapsed);
}

function setWorkspaceOpen(open) {
  document.getElementById("workspace")?.classList.toggle("is-rail-only", !open);
  stripButton("workspace")?.classList.toggle("on", open);
}

document.getElementById("workspace")?.addEventListener("click", (event) => {
  if (event.target.closest(".cms-icon-button, .cms-icon-row")) return;
  if (event.target.closest("[data-workspace=collapse]")) setWorkspaceOpen(false);
});

function showWorkspacePanel(name) {
  railPanels.forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.railPanel !== name));
}

function syncSeo(pageId) {
  const seo = seoByPage[pageId] || seoByPage.home;
  const title = document.getElementById("pageTitle");
  const path = document.getElementById("pagePath");
  const desc = document.getElementById("seoDesc");
  if (title) title.value = seo.title;
  if (path) path.value = seo.path;
  if (desc) desc.value = seo.desc;
}

function setRail(name, openWorkspace = true) {
  if (name === "content") return;
  contentPanel?.classList.remove("is-image-focus");
  railButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.rail === name));
  showWorkspacePanel(name);
  document.querySelectorAll('#viewtabs [data-state="rail"]').forEach((button) => {
    button.classList.toggle("on", button.dataset.rail === name);
  });
  if (openWorkspace) setWorkspaceOpen(true);
}

function showContent(imageFocus = false) {
  railButtons.forEach((button) => button.classList.remove("is-active"));
  showWorkspacePanel("content");
  contentPanel?.classList.toggle("is-image-focus", Boolean(imageFocus));
  document.querySelectorAll('#viewtabs [data-state="rail"]').forEach((button) => button.classList.remove("on"));
  setWorkspaceOpen(true);
}

function setPage(id, openPages = false) {
  pageItems.forEach((button) => button.classList.toggle("is-selected", button.dataset.page === id));
  document.querySelectorAll('#viewtabs [data-state="page"]').forEach((button) => {
    button.classList.toggle("on", button.dataset.page === id);
  });
  syncSeo(id);
  if (openPages) setRail("pages", true);
}

function show(scene) {
  const view = scene === "website" ? "website" : scene;
  views.forEach((node) => node.classList.toggle("is-hidden", node.dataset.view !== view));
  navItems.forEach((item) => {
    const active = item.dataset.nav === scene || (scene === "create-review" && item.dataset.nav === "certifications");
    item.classList.toggle("is-active", active);
  });
  const profileOpen = profileScenes.has(scene);
  profileToggle.classList.toggle("is-active", profileOpen);
  if (profileOpen) {
    profileToggle.setAttribute("aria-expanded", "true");
    if (!frame.classList.contains("is-collapsed") || isNarrow()) profileChildren.classList.remove("is-hidden");
  }
  setNavOpen(false);
  setPublication(false);
  setConnect(false);
  setHomeVoice(false);
  closeHomeConnect();
  closeHomeVoicePanel();
  accountPopover.classList.add("is-hidden");
  document.getElementById("accountToggle").setAttribute("aria-expanded", "false");
  if (scene === "website") {
    setWorkspaceOpen(false);
  }
  syncStateGroups(scene);
  if (!params.get("shot")) history.replaceState(null, "", "#" + scene);
  syncVoiceSurface();
}

function ensureToolIcons() {
  const icons = {
    write: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
    think: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>',
  };
  document.querySelectorAll(".cms-tool-call[data-icon]").forEach((node) => {
    if (node.querySelector("svg")) return;
    const svg = icons[node.dataset.icon];
    if (svg) node.insertAdjacentHTML("afterbegin", svg);
  });
}

function ensureHiddenMarks() {
  sectionBlocks.forEach((block) => {
    if (block.querySelector(".cms-hidden-mark")) return;
    const mark = document.createElement("div");
    mark.className = "cms-hidden-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg><span>Hidden</span>';
    block.append(mark);
  });
}

function selectedSectionId() {
  return document.querySelector(".canvas-block.is-selected")?.dataset.section;
}

function syncSectionVisibleButton(id) {
  const button = document.getElementById("sectionVisible");
  if (!button || !id) return;
  const hidden = document.querySelector(`.canvas-block[data-section="${id}"]`)?.classList.contains("is-section-hidden");
  button.setAttribute("aria-checked", hidden ? "false" : "true");
  const label = hidden ? "Show website section" : "Hide website section";
  button.setAttribute("aria-label", label);
  button.title = label;
}

function selectSection(id, openContent = true, imageFocus = false) {
  sectionBlocks.forEach((block) => block.classList.toggle("is-selected", block.dataset.section === id));
  document.querySelectorAll('#viewtabs [data-state="section"]').forEach((button) => {
    button.classList.toggle("on", button.dataset.section === id);
  });
  if (sectionLabel) sectionLabel.textContent = sectionNames[id] || id;
  const layout = contentBySection[id] || "slots";
  contentLayouts.forEach((node) => node.classList.toggle("is-hidden", node.dataset.contentLayout !== layout));
  syncSectionVisibleButton(id);
  if (openContent) showContent(imageFocus);
}

function syncCollapsed() {
  const collapsed = !labelsVisible();
  document.querySelectorAll(".js-expanded-only").forEach((node) => {
    if (node.id === "profileChildren" && collapsed) node.classList.add("is-hidden");
    else if (node.id !== "profileChildren") node.classList.toggle("is-hidden", collapsed);
  });
  document.querySelectorAll(".js-collapsed-only").forEach((node) => node.classList.toggle("is-hidden", !collapsed));
  if (!collapsed && profileToggle.getAttribute("aria-expanded") === "true") {
    profileChildren.classList.remove("is-hidden");
  }
}

function setViewtabsCollapsed(collapsed) {
  const tabs = document.getElementById("viewtabs");
  const open = document.getElementById("viewtabsOpen");
  tabs?.classList.toggle("is-hidden", collapsed);
  open?.classList.toggle("is-hidden", !collapsed);
}

function preferViewtabsCollapsed() {
  if (params.get("shot") === "1") return true;
  if (params.get("dev") === "1") return false;
  return true;
}

function preferAssistantExpanded() {
  const forced = params.get("assistant");
  if (forced === "collapsed") return false;
  if (forced === "expanded") return true;
  return false;
}

function setAssistantExpanded(open = true) {
  if (!editorCanvas) return;
  const expanded = open !== false;
  editorCanvas.classList.toggle("is-assistant-expanded", expanded);
  editorCanvas.classList.toggle("is-assistant-collapsed", !expanded);
  const collapse = document.getElementById("assistantCollapse");
  if (collapse) {
    const label = expanded ? "Reduce website assistant" : "Expand website assistant";
    collapse.setAttribute("aria-label", label);
    collapse.title = label;
  }
  stripButton("assistant")?.classList.toggle("on", !expanded);
  requestAnimationFrame(syncCanvasScale);
}

let chatbotSticky = params.get("voice") === "0";
const voiceOrbTokens = ["is-listening", "is-speaking", "is-tool"];
let voiceOrbTimer = 0;

function assistantComposerEl() {
  return document.getElementById("assistantComposer");
}

function composerEmpty() {
  return !assistantComposerEl()?.value.trim();
}

function websiteShowing() {
  const view = document.querySelector('[data-view="website"]');
  return Boolean(view && !view.classList.contains("is-hidden"));
}

function stopVoiceOrb() {
  if (voiceOrbTimer) {
    clearInterval(voiceOrbTimer);
    voiceOrbTimer = 0;
  }
  const orb = document.getElementById("voiceOrb");
  if (!orb) return;
  orb.classList.remove(...voiceOrbTokens);
  orb.classList.add("is-listening");
}

function startVoiceOrb() {
  const orb = document.getElementById("voiceOrb");
  if (!orb) return;
  stopVoiceOrb();
  let i = 0;
  const tick = () => {
    orb.classList.remove(...voiceOrbTokens);
    orb.classList.add(voiceOrbTokens[i % voiceOrbTokens.length]);
    i += 1;
  };
  tick();
  voiceOrbTimer = setInterval(tick, 1800);
}

function setVoiceAgent(on) {
  if (!editorCanvas) return;
  editorCanvas.classList.toggle("is-voice", on);
  stripButton("voice")?.classList.toggle("on", on);
  const overlay = document.getElementById("assistantOverlay");
  overlay?.toggleAttribute("inert", on);
  overlay?.setAttribute("aria-hidden", on ? "true" : "false");
  if (on) {
    if (!voiceOrbTimer) startVoiceOrb();
  } else {
    stopVoiceOrb();
  }
  requestAnimationFrame(syncCanvasScale);
}

function restoreChatbot() {
  chatbotSticky = true;
  syncVoiceSurface();
}

function turnVoiceOn() {
  chatbotSticky = false;
  const composer = assistantComposerEl();
  if (composer) composer.value = "";
  syncVoiceSurface();
}

function syncVoiceSurface() {
  const overlay = document.getElementById("assistantOverlay");
  overlay?.classList.toggle("is-composer-empty", composerEmpty());
  if (!websiteShowing()) {
    stopVoiceOrb();
    return;
  }
  setVoiceAgent(composerEmpty() && !chatbotSticky);
}

document.querySelectorAll("[data-scene]").forEach((node) => {
  node.addEventListener("click", () => show(node.dataset.scene));
});
document.querySelectorAll("#viewtabs [data-state]").forEach((button) => {
  button.addEventListener("click", () => {
    const state = button.dataset.state;
    switch (state) {
      case "sidebar":
        setSidebarCollapsed(!frame.classList.contains("is-collapsed"));
        break;
      case "workspace":
        setWorkspaceOpen(document.getElementById("workspace")?.classList.contains("is-rail-only"));
        break;
      case "copy-out":
        setCopyOut(document.getElementById("copyOut")?.classList.contains("is-hidden"));
        break;
      case "ask-first":
        setAskFirst(document.getElementById("askPills")?.classList.contains("is-hidden"));
        break;
      case "voice":
        if (editorCanvas.classList.contains("is-voice")) restoreChatbot();
        else turnVoiceOn();
        break;
      case "assistant":
        setAssistantExpanded(editorCanvas.classList.contains("is-assistant-collapsed"));
        break;
      case "publication":
        setPublication(publicationPanel.classList.contains("is-hidden"));
        break;
      case "connect":
        setConnect(connectModal.classList.contains("is-hidden"));
        break;
      case "mcp-connected":
        setMcpConnected(!homePromptWrap?.classList.contains("is-mcp-connected"));
        break;
      case "home-voice":
        setHomeVoice(homeVoiceOverlay?.classList.contains("is-hidden"));
        break;
      case "cleanup":
        setMediaCleanup(!document.getElementById("mediaView")?.classList.contains("is-compare"));
        break;
      case "notify":
        setNotify(document.getElementById("cmsNotification")?.classList.contains("is-hidden"));
        break;
      case "section":
        selectSection(button.dataset.section);
        break;
      case "rail": {
        const current = railButtons.find((item) => item.classList.contains("is-active"))?.dataset.rail;
        if (current === button.dataset.rail && !document.getElementById("workspace")?.classList.contains("is-rail-only")) {
          setWorkspaceOpen(false);
        } else {
          setRail(button.dataset.rail, true);
        }
        break;
      }
      case "page":
        setPage(button.dataset.page, true);
        break;
      case "archive":
        setArchive(document.getElementById("archiveList")?.classList.contains("is-hidden"));
        break;
    }
  });
});
profileToggle.addEventListener("click", () => {
  if (frame.classList.contains("is-collapsed") && !frame.classList.contains("is-peeking")) {
    show("details");
    return;
  }
  const open = profileToggle.getAttribute("aria-expanded") !== "true";
  profileToggle.setAttribute("aria-expanded", String(open));
  profileChildren.classList.toggle("is-hidden", !open);
});
document.getElementById("sidebarToggle").addEventListener("click", () => {
  if (isNarrow()) {
    setNavOpen(false);
    return;
  }
  setSidebarCollapsed(!frame.classList.contains("is-collapsed"));
});
document.querySelectorAll(".cms-nav-open").forEach((button) => {
  button.addEventListener("click", () => setNavOpen(true));
});
const sidebar = document.querySelector(".cms-dashboard-sidebar");
sidebar?.addEventListener("mouseenter", () => {
  if (!isNarrow() && frame.classList.contains("is-collapsed")) setPeeking(true);
});
sidebar?.addEventListener("mouseleave", () => setPeeking(false));
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "b" || !(event.metaKey || event.ctrlKey)) return;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']"))
  ) {
    return;
  }
  event.preventDefault();
  if (isNarrow()) setNavOpen(!frame.classList.contains("is-nav-open"));
  else setSidebarCollapsed(!frame.classList.contains("is-collapsed"));
});
document.getElementById("accountToggle").addEventListener("click", () => {
  const open = accountPopover.classList.toggle("is-hidden") === false;
  document.getElementById("accountToggle").setAttribute("aria-expanded", String(open));
});
railButtons.forEach((button) => button.addEventListener("click", () => {
  const already = button.classList.contains("is-active");
  const railOnly = document.getElementById("workspace")?.classList.contains("is-rail-only");
  if (already && !railOnly) setWorkspaceOpen(false);
  else setRail(button.dataset.rail, true);
}));
pageItems.forEach((button) => button.addEventListener("click", () => setPage(button.dataset.page, false)));
sectionBlocks.forEach((block) => block.addEventListener("click", () => {
  selectSection(block.dataset.section, true, Boolean(block.dataset.image));
}));
document.querySelectorAll("[data-image]").forEach((node) => {
  node.addEventListener("click", (event) => {
    event.stopPropagation();
    const section = node.closest("[data-section]")?.dataset.section || "hero";
    selectSection(section, true, true);
  });
});
document.querySelectorAll(".cms-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const on = toggle.getAttribute("aria-checked") !== "true";
    if (toggle.dataset.barCta) setBarCta(toggle.dataset.barCta, on);
    else toggle.setAttribute("aria-checked", String(on));
  });
});
document.getElementById("sectionVisible")?.addEventListener("click", () => {
  const id = selectedSectionId();
  if (!id) return;
  document.querySelector(`.canvas-block[data-section="${id}"]`)?.classList.toggle("is-section-hidden");
  syncSectionVisibleButton(id);
});
function canvasViewportMode() {
  if (canvasFrame?.classList.contains("is-tablet")) return "tablet";
  if (canvasFrame?.classList.contains("is-mobile")) return "mobile";
  return "desktop";
}

function syncCanvasScale() {
  if (!canvasStage || !canvasScale || !canvasFrame) return;
  const mode = canvasViewportMode();
  const native = canvasNativeWidths[mode];
  const stageStyle = getComputedStyle(canvasStage);
  const availW = canvasStage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight);
  const availH = canvasStage.clientHeight - parseFloat(stageStyle.paddingTop) - parseFloat(stageStyle.paddingBottom);
  if (availW < 1 || availH < 1) return;
  const layoutW = mode === "desktop" ? Math.max(native, availW) : native;
  const scale = Math.min(1, availW / layoutW);
  canvasFrame.style.width = `${layoutW}px`;
  canvasFrame.style.height = `${availH / scale}px`;
  canvasFrame.style.transform = `scale(${scale})`;
  canvasFrame.style.transformOrigin = "top left";
  canvasScale.style.width = `${layoutW * scale}px`;
  canvasScale.style.height = `${availH}px`;
  const site = canvasFrame.querySelector(".fake-site");
  if (site && editorCanvas) {
    const canvasRect = editorCanvas.getBoundingClientRect();
    let coverTop = canvasRect.bottom;
    const overlay = document.getElementById("assistantOverlay");
    if (overlay && !editorCanvas.classList.contains("is-voice")) {
      const overlayRect = overlay.getBoundingClientRect();
      if (overlayRect.height > 0) coverTop = Math.min(coverTop, overlayRect.top);
    }
    const actions = document.getElementById("canvasActions");
    if (actions) {
      const actionsRect = actions.getBoundingClientRect();
      if (actionsRect.height > 0) coverTop = Math.min(coverTop, actionsRect.top);
    }
    const visualCover = Math.max(0, canvasRect.bottom - coverTop) + 12;
    const pad = `${Math.ceil(visualCover / scale)}px`;
    site.style.setProperty("--cms-canvas-scroll-pad", pad);
    site.style.paddingBottom = pad;
  }
}

document.querySelectorAll("[data-viewport]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-viewport]").forEach((item) => item.classList.toggle("is-active", item === button));
    canvasFrame.classList.remove("is-desktop", "is-tablet", "is-mobile");
    canvasFrame.classList.add("is-" + button.dataset.viewport);
    syncCanvasScale();
  });
});

document.getElementById("publicationToggle").addEventListener("click", () => {
  setPublication(publicationPanel.classList.contains("is-hidden"));
});
publicationHostRow()?.addEventListener("click", () => {
  const blockers = document.querySelector(".cms-publication-blockers");
  if (blockers && !blockers.classList.contains("is-hidden")) return;
  const status = publicationHostRow()?.querySelector(".cms-publication-row-copy span");
  if (status) status.textContent = "Last published just now";
});
document.querySelectorAll("[data-blocker]").forEach((button) => {
  button.addEventListener("click", () => {
    setPublication(false);
    if (button.dataset.blocker === "slot") selectSection("hero", true, true);
    else show("media");
  });
});
function syncAssistantSubmit() {
  const planOn = document.getElementById("switchPlan")?.checked !== false;
  const submit = document.getElementById("assistantSubmit");
  if (!submit) return;
  submit.setAttribute("aria-label", planOn ? "Plan" : "Send");
}
document.getElementById("switchPlan")?.addEventListener("change", syncAssistantSubmit);
document.getElementById("assistantComposer")?.addEventListener("input", syncVoiceSurface);
document.getElementById("assistantVoice")?.addEventListener("click", turnVoiceOn);
document.getElementById("restoreChatbot")?.addEventListener("click", restoreChatbot);
document.getElementById("voiceClose")?.addEventListener("click", restoreChatbot);
document.getElementById("clearContext")?.addEventListener("click", () => {
  document.querySelector("#assistantThread .cms-assistant-thread-inner")?.replaceChildren();
  setAskFirst(false);
});
document.getElementById("assistantCollapse")?.addEventListener("click", () => {
  setAssistantExpanded(editorCanvas.classList.contains("is-assistant-collapsed"));
});
document.getElementById("assistantOverlay")?.addEventListener("pointerdown", (event) => {
  const overlay = event.currentTarget;
  if (event.target.closest("input, textarea, button, label, a")) return;
  overlay.focus({ preventScroll: true });
});
document.getElementById("askPills")?.addEventListener("click", (event) => {
  if (event.target.closest(".cms-ask-pill")) setAskFirst(false);
});
document.getElementById("archiveHeading")?.addEventListener("click", () => {
  setArchive(document.getElementById("archiveList")?.classList.contains("is-hidden"));
});
document.querySelectorAll("[data-connect-url]").forEach((button) => {
  button.addEventListener("click", () => setConnect(true));
});
document.getElementById("connectClose").addEventListener("click", () => setConnect(false));
connectModal.addEventListener("click", (event) => {
  if (event.target === connectModal) setConnect(false);
});
connectModal.querySelectorAll(".cms-dns-value").forEach((input) => {
  input.addEventListener("focus", () => input.select());
});
connectModal.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const input = button.closest(".cms-dns-copyrow")?.querySelector(".cms-dns-value");
    const value = input?.value;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      input.select();
      document.execCommand("copy");
    }
    const previous = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1200);
  });
});
const homeConnectTap = bindHoverTap(homeConnectBtn, mcpConnectPanel, {
  onOpen: () => closeHomeVoicePanel(),
});
const homeVoiceTap = bindHoverTap(homeVoiceBtn, homeVoicePanel, {
  onOpen: () => closeHomeConnect(),
});
closeHomeConnect = homeConnectTap.close;
closeHomeVoicePanel = homeVoiceTap.close;

document.getElementById("homeStartInterview")?.addEventListener("click", () => setHomeVoice(true));
document.getElementById("homeVoiceBack")?.addEventListener("click", () => setHomeVoice(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setHomeVoice(false);
});

const homePromptPh = document.getElementById("homePromptPh");
const homePromptField = document.querySelector(".cms-dashboard-prompt-field");
const homePromptText = document.querySelector("#homePrompt textarea");
const promptPlaceholders = [
  "Describe what you want Placis to build...",
  "Build a homepage that explains what my crew does.",
  "Launch ads that drive quote requests in my city.",
  "Add my service areas, hours, and phone number to a simple site.",
  "Create a contact form that emails me and the customer.",
];
let promptPlaceholderIndex = 0;
function syncPromptFilled() {
  homePromptField?.classList.toggle("is-filled", Boolean(homePromptText?.value.trim()));
}
homePromptText?.addEventListener("input", syncPromptFilled);
if (homePromptPh && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const label = homePromptPh.querySelector("span");
  window.setInterval(() => {
    if (homePromptField?.classList.contains("is-filled") || !label) return;
    homePromptPh.classList.add("is-swap");
    window.setTimeout(() => {
      promptPlaceholderIndex = (promptPlaceholderIndex + 1) % promptPlaceholders.length;
      label.textContent = promptPlaceholders[promptPlaceholderIndex];
      homePromptPh.classList.remove("is-swap");
    }, 480);
  }, 3600);
}

document.getElementById("homePrompt").addEventListener("submit", (event) => {
  event.preventDefault();
  show("website");
  setSidebarCollapsed(true);
  setAssistantExpanded(preferAssistantExpanded());
});
document.querySelectorAll(".cms-media-tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    tile.parentElement?.querySelectorAll(".cms-media-tile").forEach((item) => item.classList.remove("is-selected"));
    tile.classList.add("is-selected");
    const src = tile.dataset.src;
    if (!src) return;
    const current = document.getElementById("contentImageCurrent");
    if (current) current.style.backgroundImage = `url("${src}")`;
    document.querySelector(".fake-hero")?.style.setProperty("--hero-photo", `url("${src}")`);
  });
});

document.getElementById("cmsNotification")?.addEventListener("click", (event) => {
  if (event.target.closest("button")) setNotify(false);
});
document.getElementById("viewtabsCollapse")?.addEventListener("click", () => setViewtabsCollapsed(true));
document.getElementById("viewtabsOpen")?.addEventListener("click", () => setViewtabsCollapsed(false));

if (params.get("shot") === "1") {
  document.body.classList.add("is-shot");
}
setViewtabsCollapsed(preferViewtabsCollapsed());
ensureHiddenMarks();
ensureToolIcons();
document.querySelectorAll(".cms-nav-link-row[data-kind]").forEach(hydrateNavRow);
const initial = params.get("scene") || (location.hash || "#home").slice(1) || "home";
show(initial);
syncCollapsed();
const sectionParam = params.get("section");
selectSection(sectionParam || "hero", Boolean(sectionParam));
setPage(params.get("page") || "home", false);
setAssistantExpanded(preferAssistantExpanded());
setCopyOut(params.get("copyout") === "1");
setAskFirst(params.get("ask") !== "0");
syncVoiceSurface();
if (params.get("publication") === "1") setPublication(true);
if (params.get("from") === "activation") {
  const host = publicationHostRow();
  const title = host?.querySelector("b");
  const status = host?.querySelector(".cms-publication-row-copy span");
  const chrome = document.querySelector(".cms-browser-chrome-url");
  const prefix = "bellfield-roofing-dublin.preview.placis.com";
  if (title) title.textContent = prefix;
  if (status) status.textContent = "Not published yet";
  if (host) host.setAttribute("aria-label", `Publish to ${prefix}`);
  if (chrome) chrome.textContent = prefix;
  document.querySelector(".cms-publication-row.is-waiting")?.classList.add("is-hidden");
  document.querySelector(".cms-publication-blockers")?.classList.add("is-hidden");
  setPublication(true);
}
if (params.get("connect") === "1") setConnect(true);
if (params.get("connected") === "1") setMcpConnected(true);
if (params.get("homevoice") === "1") setHomeVoice(true);
if (params.get("archive") === "1") setArchive(true);
if (params.get("workspace") === "1") setWorkspaceOpen(true);
if (params.get("rail")) setRail(params.get("rail"), true);
if (params.get("sidebar") === "1") setSidebarCollapsed(false);
else setSidebarCollapsed(true);
if (isNarrow()) {
  const mobileBtn = document.querySelector('[data-viewport="mobile"]');
  if (mobileBtn) mobileBtn.click();
  setNavOpen(false);
}
if (canvasStage) new ResizeObserver(syncCanvasScale).observe(canvasStage);
const assistantOverlay = document.getElementById("assistantOverlay");
if (assistantOverlay) new ResizeObserver(syncCanvasScale).observe(assistantOverlay);
syncCanvasScale();
syncAssistantSubmit();
window.matchMedia("(max-width: 1100px)").addEventListener("change", (event) => {
  setNavOpen(false);
  setPeeking(false);
  if (event.matches) {
    const mobileBtn = document.querySelector('[data-viewport="mobile"]');
    if (mobileBtn) mobileBtn.click();
  } else {
    const desktopBtn = document.querySelector('[data-viewport="desktop"]');
    if (desktopBtn) desktopBtn.click();
  }
  syncCollapsed();
});

const mediaPhotos = ["media/hero-roof.jpg", "media/job-repair.jpg", "media/job-new-roof.jpg", "media/job-gutter.jpg"];
const mediaRatios = ["landscape", "portrait", "square"];
const mediaCaptions = [
  "Rear slope after the storm",
  "Slate repair on a terrace",
  "New roof on a semi",
  "Guttering on the front",
  "Ridge line after wind",
  "Valley flashing",
  "Logo on the van",
  "Fascia upgrade",
];
const mediaLibraryItems = Array.from({ length: 24 }, (_, index) => ({
  src: mediaPhotos[index % mediaPhotos.length],
  ratio: mediaRatios[index % mediaRatios.length],
  caption: mediaCaptions[index % mediaCaptions.length],
  by: index === 0 ? "owner" : index % 7 === 0 ? "research" : index % 11 === 0 ? "ai" : "owner",
  status: index === 1 ? "uploading" : "approved",
}));

function mediaSrcCss(src) {
  return `url('${src}')`;
}

function setMediaView(item) {
  const view = document.getElementById("mediaView");
  if (!view || !item) return;
  view.dataset.ratio = item.ratio;
  view.style.setProperty("--media-src", mediaSrcCss(item.src));
  const meta = document.getElementById("mediaViewMeta");
  if (meta) {
    const who = item.by === "ai" ? "AI" : item.by;
    meta.textContent = `${item.caption} · supplied by ${who} · ${item.status}`;
  }
}

function setMediaCleanup(on) {
  const view = document.getElementById("mediaView");
  const sweep = document.getElementById("mediaSweep");
  const actions = document.getElementById("mediaCleanupActions");
  view?.classList.toggle("is-compare", on);
  sweep?.classList.toggle("is-hidden", !on);
  actions?.classList.toggle("is-hidden", !on);
  document.getElementById("mediaFraming")?.classList.toggle("is-hidden", on);
  if (on) sweep?.style.setProperty("--split", "50%");
  stripButton("cleanup")?.classList.toggle("on", on);
}

function bindMediaLibrary() {
  const thumbs = document.getElementById("mediaThumbs");
  if (!thumbs || thumbs.dataset.ready === "1") return;
  thumbs.dataset.ready = "1";
  thumbs.classList.toggle("is-dense", mediaLibraryItems.length > 10);
  thumbs.innerHTML = mediaLibraryItems.map((item, index) => {
    const selected = index === 0 ? " is-selected" : "";
    const overlay = item.status === "uploading" ? `<span class="cms-upload-overlay">Uploading…</span>` : "";
    return `<button class="cms-media-thumb is-${item.ratio}${selected}" type="button" data-index="${index}" style="background-image:${mediaSrcCss(item.src)}" aria-label="${esc(item.caption)}">${overlay}</button>`;
  }).join("");
  setMediaView(mediaLibraryItems[0]);
  thumbs.addEventListener("click", (event) => {
    const thumb = event.target.closest(".cms-media-thumb");
    if (!thumb) return;
    thumbs.querySelectorAll(".cms-media-thumb").forEach((node) => node.classList.toggle("is-selected", node === thumb));
    setMediaView(mediaLibraryItems[Number(thumb.dataset.index)]);
    setMediaCleanup(false);
  });
  const sweep = document.getElementById("mediaSweep");
  const setSplit = (clientX) => {
    if (!sweep) return;
    const box = sweep.getBoundingClientRect();
    const pct = Math.max(4, Math.min(96, ((clientX - box.left) / box.width) * 100));
    sweep.style.setProperty("--split", `${pct}%`);
  };
  let sweeping = false;
  sweep?.addEventListener("pointerdown", (event) => {
    sweeping = true;
    sweep.setPointerCapture(event.pointerId);
    setSplit(event.clientX);
  });
  sweep?.addEventListener("pointermove", (event) => {
    if (sweeping) setSplit(event.clientX);
  });
  sweep?.addEventListener("pointerup", () => { sweeping = false; });
  sweep?.addEventListener("pointercancel", () => { sweeping = false; });
  const prompt = document.getElementById("mediaCleanupPrompt");
  const submit = document.getElementById("mediaCleanupSubmit");
  const syncPrompt = () => {
    if (submit) submit.disabled = !prompt?.value.trim();
  };
  prompt?.addEventListener("input", syncPrompt);
  syncPrompt();
  document.getElementById("mediaCleanupForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!prompt?.value.trim()) return;
    setMediaCleanup(true);
  });
  document.getElementById("mediaCleanupReject")?.addEventListener("click", () => setMediaCleanup(false));
  document.getElementById("mediaCleanupAccept")?.addEventListener("click", () => setMediaCleanup(false));
}

function bindMediaFraming() {
  const still = document.getElementById("mediaViewStill");
  const view = document.getElementById("mediaView");
  const rect = document.getElementById("mediaCropRect");
  const focal = document.getElementById("mediaFocal");
  const tools = document.getElementById("mediaFraming");
  if (!still || !view || !rect || !focal) return;

  const setMode = (next) => {
    view.dataset.crop = next;
    tools?.querySelectorAll("[data-crop]").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.crop === next);
    });
  };
  tools?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-crop]");
    if (button) setMode(button.dataset.crop);
  });

  const trackPointer = (startEvent, onMove) => {
    const box = still.getBoundingClientRect();
    const move = (event) => {
      const x = ((event.clientX - box.left) / box.width) * 100;
      const y = ((event.clientY - box.top) / box.height) * 100;
      onMove(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)), event);
    };
    startEvent.target.setPointerCapture?.(startEvent.pointerId);
    move(startEvent);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  focal.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    trackPointer(event, (x, y) => {
      focal.style.left = `${x}%`;
      focal.style.top = `${y}%`;
    });
  });

  rect.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-handle]")) return;
    event.preventDefault();
    const box = still.getBoundingClientRect();
    const start = rect.getBoundingClientRect();
    const originX = event.clientX;
    const originY = event.clientY;
    const left = ((start.left - box.left) / box.width) * 100;
    const top = ((start.top - box.top) / box.height) * 100;
    const width = (start.width / box.width) * 100;
    const height = (start.height / box.height) * 100;
    trackPointer(event, (_x, _y, moveEvent) => {
      const dx = ((moveEvent.clientX - originX) / box.width) * 100;
      const dy = ((moveEvent.clientY - originY) / box.height) * 100;
      rect.style.left = `${Math.max(0, Math.min(100 - width, left + dx))}%`;
      rect.style.top = `${Math.max(0, Math.min(100 - height, top + dy))}%`;
    });
  });

  rect.querySelector("[data-handle]")?.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const box = still.getBoundingClientRect();
    const start = rect.getBoundingClientRect();
    const left = ((start.left - box.left) / box.width) * 100;
    const top = ((start.top - box.top) / box.height) * 100;
    trackPointer(event, (x, y) => {
      rect.style.width = `${Math.max(12, Math.min(100 - left, x - left))}%`;
      rect.style.height = `${Math.max(12, Math.min(100 - top, y - top))}%`;
    });
  });
}

bindMediaLibrary();
bindMediaFraming();
if (params.get("cleanup") === "1") setMediaCleanup(true);

