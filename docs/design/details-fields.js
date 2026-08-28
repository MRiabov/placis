/* Shared Details widget wiring for cms.html, onboarding.html, and ads.html.
   Field controls, combobox, hours, service list, and the mock-only yellow strip. */

function detailsEsc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function bindCombo(combo) {
  if (!combo || combo.dataset.bound === "1") return;
  combo.dataset.bound = "1";
  const input = combo.querySelector("input");
  const pop = combo.querySelector(".cms-combo-pop");
  if (!input || !pop) return;
  const create = pop.querySelector(".cms-combo-crow");
  const divider = pop.querySelector(".cms-combo-divider");
  const rows = [...pop.querySelectorAll(".cms-combo-row")];
  const label = combo.dataset.create || "item";
  const mapsPlace = label === "place";
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
    const creating = Boolean(query) && !any && !mapsPlace;
    if (create) {
      create.classList.toggle("is-hint", !creating);
      create.classList.toggle("is-create", creating);
      create.innerHTML = creating
        ? `<span class="cms-combo-plus">+</span> Create new ${detailsEsc(label)} “${detailsEsc(input.value.trim())}”`
        : mapsPlace
          ? "Type to search a place…"
          : `Type to create a new ${detailsEsc(label)}…`;
    }
    divider?.classList.toggle("is-hidden", !creating);
  });
  rows.forEach((row) => row.addEventListener("mousedown", (event) => {
    event.preventDefault();
    rows.forEach((item) => {
      item.classList.toggle("is-current", item === row);
      const check = item.querySelector(".cms-combo-check");
      if (check) check.textContent = item === row ? "✓" : "";
    });
    if (!mapsPlace) input.value = row.dataset.href || "";
    close();
  }));
  create?.addEventListener("mousedown", (event) => event.preventDefault());
}

function territoryCardHtml(name, radius) {
  return `<div class="cms-territory-card" data-place="${detailsEsc(name)}">
    <div class="cms-territory-copy">
      <b>${detailsEsc(name)}</b>
      <span>Google Maps territory</span>
    </div>
    <label>
      <span>Radius</span>
      <select class="cms-field-control" aria-label="${detailsEsc(name)} radius">
        <option${radius === "15 km" ? " selected" : ""}>15 km</option>
        <option${radius === "25 km" ? " selected" : ""}>25 km</option>
        <option${radius === "40 km" ? " selected" : ""}>40 km</option>
      </select>
    </label>
    <button class="cms-item-remove" type="button" aria-label="Remove ${detailsEsc(name)}">×</button>
  </div>`;
}

function bindServiceAreas() {
  const combo = document.getElementById("serviceAreaCombo");
  const list = document.getElementById("serviceAreaList");
  if (!combo || !list) return;
  bindCombo(combo);
  const input = combo.querySelector("input");
  combo.querySelectorAll(".cms-combo-row").forEach((row) => {
    row.addEventListener("mousedown", () => {
      const name = row.dataset.label || row.dataset.href || "";
      const radius = row.dataset.radius || "25 km";
      if (!name) return;
      const existing = list.querySelector(`[data-place="${CSS.escape(name)}"]`);
      if (existing) {
        const select = existing.querySelector("select");
        if (select) select.value = radius;
      } else {
        list.insertAdjacentHTML("beforeend", territoryCardHtml(name, radius));
      }
      if (input) input.value = "";
    });
  });
  list.addEventListener("click", (event) => {
    const remove = event.target.closest(".cms-item-remove");
    if (!remove) return;
    remove.closest(".cms-territory-card")?.remove();
  });
}

function serviceRowHtml(value) {
  return `<li class="cms-item-row"><input class="cms-field-control" value="${detailsEsc(value)}" aria-label="Featured service" /><button class="cms-item-remove" type="button" aria-label="Remove service">×</button></li>`;
}

function splitServiceNames(text) {
  return text
    .split(/[\n,;]+/)
    .map((part) => part.replace(/^[\s•\-]+/, "").trim())
    .filter(Boolean);
}

function bindFeaturedServices() {
  const list = document.getElementById("featuredServices");
  if (!list) return;
  const addRow = (value = "") => {
    list.insertAdjacentHTML("beforeend", serviceRowHtml(value));
    const inputs = list.querySelectorAll("input");
    inputs[inputs.length - 1]?.focus();
  };
  list.addEventListener("click", (event) => {
    const remove = event.target.closest(".cms-item-remove");
    if (!remove) return;
    const row = remove.closest(".cms-item-row");
    if (list.querySelectorAll(".cms-item-row").length > 1) row?.remove();
  });
  list.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.target.tagName !== "INPUT") return;
    const inputs = [...list.querySelectorAll("input")];
    if (event.target !== inputs[inputs.length - 1]) return;
    event.preventDefault();
    addRow("");
  });
  list.addEventListener("paste", (event) => {
    const input = event.target.closest("input");
    if (!input) return;
    const text = event.clipboardData?.getData("text") || "";
    const names = splitServiceNames(text);
    if (names.length < 2) return;
    event.preventDefault();
    input.value = names[0];
    names.slice(1).forEach((name) => addRow(name));
  });
  document.getElementById("addFeaturedService")?.addEventListener("click", () => addRow(""));
}

const hoursDays = [
  { day: "Monday", closed: false, slots: [{ opens: "06:30", closes: "18:00" }] },
  { day: "Tuesday", closed: false, slots: [{ opens: "06:30", closes: "18:00" }] },
  { day: "Wednesday", closed: false, slots: [{ opens: "06:30", closes: "18:00" }] },
  { day: "Thursday", closed: false, slots: [{ opens: "06:30", closes: "18:00" }] },
  { day: "Friday", closed: false, slots: [{ opens: "06:30", closes: "18:00" }] },
  { day: "Saturday", closed: false, slots: [{ opens: "08:00", closes: "13:00" }] },
  { day: "Sunday", closed: true, slots: [{ opens: "08:00", closes: "17:00" }] },
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
      const slot = row.slots[0] || { opens: "08:00", closes: "17:00" };
      return `
        <div class="cms-hours-row${row.closed ? " is-closed" : ""}" data-index="${index}">
          <div class="cms-hours-day">${row.day}</div>
          <div class="cms-hours-slots">
            <div class="cms-hours-slot">
              ${hoursSelect(row.day, "opens", slot.opens)}
              <span aria-hidden="true">–</span>
              ${hoursSelect(row.day, "closes", slot.closes)}
            </div>
            <p class="cms-hours-closed-label">Closed</p>
          </div>
          <div class="cms-hours-actions">
            <button class="cms-hours-icon${row.closed ? " is-on" : ""}" type="button" data-hours="closed" aria-label="${row.closed ? `Reopen ${row.day}` : `Mark ${row.day} closed`}" title="Closed">${hoursIcon("closed")}</button>
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
    hoursDays[index].slots = next.slots.slice(0, 1);
  });
}

function bindHoursPicker() {
  const root = document.getElementById("hoursPicker");
  if (!root) return;
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hours]");
    if (!button || button.disabled) return;
    const rowNode = button.closest(".cms-hours-row");
    const index = Number(rowNode.dataset.index);
    writeHoursFromDom();
    const row = hoursDays[index];
    if (button.dataset.hours === "closed") row.closed = !row.closed;
    if (button.dataset.hours === "copy") {
      hoursDays.forEach((item, itemIndex) => {
        if (itemIndex > index) {
          const range = row.slots[0] || { opens: "08:00", closes: "17:00" };
          item.closed = row.closed;
          item.slots = [{ opens: range.opens, closes: range.closes }];
        }
      });
    }
    renderHoursPicker();
  });
  root.addEventListener("change", () => writeHoursFromDom());
  renderHoursPicker();
}

function preferViewtabsCollapsed() {
  const params = new URLSearchParams(location.search);
  if (params.has("shot")) return true;
  if (params.has("dev")) return false;
  return true;
}

function setViewtabsCollapsed(collapsed) {
  document.getElementById("viewtabs")?.classList.toggle("is-hidden", collapsed);
  document.getElementById("viewtabsOpen")?.classList.toggle("is-hidden", !collapsed);
}

function bindViewtabs() {
  const params = new URLSearchParams(location.search);
  if (params.has("shot")) document.body.classList.add("is-shot");
  document.getElementById("viewtabsCollapse")?.addEventListener("click", () => setViewtabsCollapsed(true));
  document.getElementById("viewtabsOpen")?.addEventListener("click", () => setViewtabsCollapsed(false));
  setViewtabsCollapsed(preferViewtabsCollapsed());
}

document.querySelectorAll(".cms-combo").forEach(bindCombo);
bindServiceAreas();
bindFeaturedServices();
bindHoursPicker();
bindViewtabs();
