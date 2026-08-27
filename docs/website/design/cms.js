/* Mock-only scene wiring for cms.html. Not product UI. */

const params = new URLSearchParams(location.search);
const frame = document.getElementById("frame");
const profileChildren = document.getElementById("profileChildren");
const profileToggle = document.getElementById("profileToggle");
const accountPopover = document.getElementById("accountPopover");
const publicationPanel = document.getElementById("publicationPanel");
const canvasFrame = document.getElementById("canvasFrame");
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

function bindCombo(combo) {
  const input = combo.querySelector("input");
  const pop = combo.querySelector(".cms-combo-pop");
  const create = pop.querySelector(".cms-combo-crow");
  const divider = pop.querySelector(".cms-combo-divider");
  const rows = [...pop.querySelectorAll(".cms-combo-row")];
  const label = combo.dataset.create || "item";
  const close = () => combo.classList.remove("is-open");
  input.addEventListener("focus", () => combo.classList.add("is-open"));
  input.addEventListener("blur", () => setTimeout(close, 120));
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    let any = false;
    rows.forEach((row) => {
      const hit = row.textContent.toLowerCase().includes(query);
      row.classList.toggle("is-hidden", Boolean(query) && !hit);
      if (hit || !query) any = true;
    });
    const creating = Boolean(query) && !any;
    create.classList.toggle("is-hint", !creating);
    create.classList.toggle("is-create", creating);
    create.innerHTML = creating
      ? `<span class="cms-combo-plus">+</span> Create new ${esc(label)} “${esc(input.value.trim())}”`
      : `Type to create a new ${esc(label)}…`;
    divider.classList.toggle("is-hidden", !creating);
  });
  rows.forEach((row) => row.addEventListener("mousedown", (event) => {
    event.preventDefault();
    rows.forEach((item) => {
      item.classList.toggle("is-current", item === row);
      const check = item.querySelector(".cms-combo-check");
      if (check) check.textContent = item === row ? "✓" : "";
    });
    input.value = row.dataset.href || "";
    close();
  }));
  create.addEventListener("mousedown", (event) => {
    event.preventDefault();
    close();
  });
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
  const hero = document.querySelector(".fake-hero");
  hero?.classList.toggle("is-pending", on);
  let badge = document.querySelector(".cms-pending-badge");
  if (on && !badge && hero) {
    badge = document.createElement("span");
    badge.className = "cms-pending-badge";
    badge.textContent = "Not applied";
    hero.prepend(badge);
  }
  badge?.classList.toggle("is-hidden", !on);
  stripButton("ask-first")?.classList.toggle("on", on);
}

function setPublication(open) {
  publicationPanel.classList.toggle("is-hidden", !open);
  document.getElementById("publicationToggle")?.setAttribute("aria-expanded", String(open));
  stripButton("publication")?.classList.toggle("on", open);
}

function setConnect(open) {
  connectModal.classList.toggle("is-hidden", !open);
  stripButton("connect")?.classList.toggle("on", open);
  if (open) setPublication(false);
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
  accountPopover.classList.add("is-hidden");
  document.getElementById("accountToggle").setAttribute("aria-expanded", "false");
  if (scene === "website") {
    setWorkspaceOpen(false);
  }
  syncStateGroups(scene);
  if (!params.get("shot")) history.replaceState(null, "", "#" + scene);
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
  if (params.get("dev") === "0") return true;
  if (params.get("dev") === "1") return false;
  return window.matchMedia("(max-width: 1100px)").matches;
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
      case "assistant":
        setAssistantExpanded(editorCanvas.classList.contains("is-assistant-collapsed"));
        break;
      case "publication":
        setPublication(publicationPanel.classList.contains("is-hidden"));
        break;
      case "connect":
        setConnect(connectModal.classList.contains("is-hidden"));
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
document.querySelectorAll("[data-viewport]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-viewport]").forEach((item) => item.classList.toggle("is-active", item === button));
    canvasFrame.classList.remove("is-desktop", "is-tablet", "is-mobile");
    canvasFrame.classList.add("is-" + button.dataset.viewport);
  });
});

document.getElementById("publicationToggle").addEventListener("click", () => {
  setPublication(publicationPanel.classList.contains("is-hidden"));
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
document.getElementById("connectUrl").addEventListener("click", () => setConnect(true));
document.getElementById("connectClose").addEventListener("click", () => setConnect(false));
connectModal.addEventListener("click", (event) => {
  if (event.target === connectModal) setConnect(false);
});
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
if (params.get("publication") === "1") setPublication(true);
if (params.get("connect") === "1") setConnect(true);
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
syncAssistantSubmit();
window.matchMedia("(max-width: 1100px)").addEventListener("change", (event) => {
  setNavOpen(false);
  setPeeking(false);
  if (event.matches) {
    const mobileBtn = document.querySelector('[data-viewport="mobile"]');
    if (mobileBtn) mobileBtn.click();
  }
  syncCollapsed();
});

const hoursDays = [
  { day: "Monday", short: "Mon", closed: false, slots: [{ opens: "08:00", closes: "17:00" }] },
  { day: "Tuesday", short: "Tue", closed: false, slots: [{ opens: "08:00", closes: "17:00" }] },
  { day: "Wednesday", short: "Wed", closed: false, slots: [{ opens: "08:00", closes: "17:00" }] },
  { day: "Thursday", short: "Thu", closed: false, slots: [{ opens: "08:00", closes: "17:00" }] },
  { day: "Friday", short: "Fri", closed: false, slots: [{ opens: "08:00", closes: "16:00" }] },
  { day: "Saturday", short: "Sat", closed: true, slots: [{ opens: "08:00", closes: "17:00" }] },
  { day: "Sunday", short: "Sun", closed: true, slots: [{ opens: "08:00", closes: "17:00" }] },
];
const hoursTimeValues = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});
function hoursTimeLabel(value) {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? "pm" : "am";
  return `${hour % 12 || 12}:${rawMinute}${suffix}`;
}
function hoursIcon(kind) {
  if (kind === "closed") return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m7.5 7.5 9 9"/></svg>';
  if (kind === "add") return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>';
  if (kind === "remove") return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>';
  return '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>';
}
function hoursSelect(day, bound, value) {
  const options = hoursTimeValues
    .map((time) => `<option value="${time}" ${time === value ? "selected" : ""}>${hoursTimeLabel(time)}</option>`)
    .join("");
  return `<select class="cms-hours-time" data-bound="${bound}" aria-label="${day} ${bound === "opens" ? "Opens" : "Closes"}">${options}</select>`;
}
function renderHoursPicker() {
  const root = document.getElementById("hoursPicker");
  if (!root) return;
  root.innerHTML = hoursDays
    .map((row, index) => {
      const slots = row.slots
        .map(
          (slot, slotIndex) => `
            <div class="cms-hours-slot">
              ${hoursSelect(row.day, "opens", slot.opens)}
              <span aria-hidden="true">–</span>
              ${hoursSelect(row.day, "closes", slot.closes)}
              <button class="cms-hours-remove" type="button" data-hours="remove" data-slot="${slotIndex}" aria-label="Remove ${row.day} time block">${hoursIcon("remove")}</button>
            </div>`,
        )
        .join("");
      return `
        <div class="cms-hours-row${row.closed ? " is-closed" : ""}" data-index="${index}">
          <div class="cms-hours-day">${row.short}</div>
          <div class="cms-hours-slots">
            ${slots}
            <p class="cms-hours-closed-label">Closed</p>
          </div>
          <div class="cms-hours-actions">
            <button class="cms-hours-icon${row.closed ? " is-on" : ""}" type="button" data-hours="closed" aria-label="${row.closed ? `Reopen ${row.day}` : `Mark ${row.day} closed`}" title="Closed">${hoursIcon("closed")}</button>
            <button class="cms-hours-icon" type="button" data-hours="add" aria-label="Add ${row.day} time block" title="Add a time block" ${row.closed ? "disabled" : ""}>${hoursIcon("add")}</button>
            <button class="cms-hours-icon" type="button" data-hours="copy" aria-label="Copy ${row.day} opening hours to following days" title="Copy to following days">${hoursIcon("copy")}</button>
          </div>
        </div>`;
    })
    .join("");
}
function readHoursRow(rowNode) {
  return {
    closed: rowNode.classList.contains("is-closed"),
    slots: [...rowNode.querySelectorAll(".cms-hours-slot")].map((slot) => ({
      opens: slot.querySelector('[data-bound="opens"]').value,
      closes: slot.querySelector('[data-bound="closes"]').value,
    })),
  };
}
function writeHoursFromDom() {
  document.querySelectorAll(".cms-hours-row").forEach((rowNode, index) => {
    const next = readHoursRow(rowNode);
    hoursDays[index].closed = next.closed;
    hoursDays[index].slots = next.slots;
  });
}
document.getElementById("hoursPicker")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-hours]");
  if (!button || button.disabled) return;
  const rowNode = button.closest(".cms-hours-row");
  const index = Number(rowNode.dataset.index);
  writeHoursFromDom();
  const row = hoursDays[index];
  switch (button.dataset.hours) {
    case "closed":
      row.closed = !row.closed;
      break;
    case "add":
      row.closed = false;
      row.slots.push({ opens: "13:00", closes: "17:00" });
      break;
    case "remove":
      if (row.slots.length > 1) row.slots.splice(Number(button.dataset.slot), 1);
      break;
    case "copy":
      hoursDays.forEach((item, itemIndex) => {
        if (itemIndex > index) {
          item.closed = row.closed;
          item.slots = row.slots.map((slot) => ({ ...slot }));
        }
      });
      break;
  }
  renderHoursPicker();
});
document.getElementById("hoursPicker")?.addEventListener("change", () => writeHoursFromDom());
renderHoursPicker();

