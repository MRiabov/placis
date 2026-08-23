const setupPublicNavigation = () => {
  document.querySelectorAll("[data-public-nav]").forEach((root) => {
    if (
      !(root instanceof HTMLElement) ||
      root.dataset.publicNavReady === "true"
    ) {
      return;
    }
    root.dataset.publicNavReady = "true";
    const button = root.querySelector("[data-public-nav-toggle]");
    const menu = root.querySelector("[data-public-nav-menu]");
    if (
      !(button instanceof HTMLButtonElement) ||
      !(menu instanceof HTMLElement)
    ) {
      return;
    }
    const close = () => {
      root.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation");
    };
    const toggle = () => {
      const isOpen = root.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation",
      );
    };
    button.addEventListener("click", toggle);
    menu
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", close));
    document.addEventListener("click", (event) => {
      if (event.target instanceof Node && !root.contains(event.target)) {
        close();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
      }
    });
  });
};

const setupPublicCarousels = () => {
  document.querySelectorAll("[data-public-carousel]").forEach((root) => {
    if (
      !(root instanceof HTMLElement) ||
      root.dataset.publicCarouselReady === "true"
    ) {
      return;
    }
    root.dataset.publicCarouselReady = "true";
    const viewport = root.querySelector("[data-public-carousel-viewport]");
    const track = root.querySelector("[data-public-carousel-track]");
    const slides = Array.from(
      root.querySelectorAll("[data-public-carousel-slide]"),
    );
    const previous = root.querySelector("[data-public-carousel-prev]");
    const next = root.querySelector("[data-public-carousel-next]");
    const dots = Array.from(
      root.querySelectorAll("[data-public-carousel-dot]"),
    );
    if (
      !(viewport instanceof HTMLElement) ||
      !(track instanceof HTMLElement) ||
      slides.length === 0
    ) {
      return;
    }

    const desktopSlides = Math.max(
      1,
      Number(root.dataset.publicCarouselSlides || 3),
    );
    const mobileSlides = Math.max(
      1,
      Number(root.dataset.publicCarouselMobileSlides || 1),
    );
    const mobileQuery = window.matchMedia("(max-width: 900px)");
    let index = 0;

    const visibleSlides = () =>
      Math.min(
        slides.length,
        mobileQuery.matches ? mobileSlides : desktopSlides,
      );
    const maxIndex = () => Math.max(0, slides.length - visibleSlides());
    const applyState = (nextIndex: number) => {
      index = Math.max(0, Math.min(nextIndex, maxIndex()));
      viewport.style.setProperty("--public-carousel-index", String(index));
      viewport.style.setProperty(
        "--public-carousel-slides",
        String(visibleSlides()),
      );
      if (previous instanceof HTMLButtonElement) {
        previous.disabled = index === 0;
      }
      if (next instanceof HTMLButtonElement) {
        next.disabled = index === maxIndex();
      }
      dots.forEach((dot, dotIndex) => {
        if (dot instanceof HTMLButtonElement) {
          dot.setAttribute("aria-current", String(dotIndex === index));
        }
      });
    };
    const goTo = (nextIndex: number) => {
      applyState(nextIndex);
      const target = slides[index];
      if (target instanceof HTMLElement) {
        viewport.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
      }
    };
    const syncFromScroll = () => {
      const slideWidth =
        slides[0] instanceof HTMLElement ? slides[0].offsetWidth : 0;
      if (slideWidth <= 0) {
        return;
      }
      applyState(Math.round(viewport.scrollLeft / slideWidth));
    };

    if (previous instanceof HTMLButtonElement) {
      previous.addEventListener("click", () => goTo(index - 1));
    }
    if (next instanceof HTMLButtonElement) {
      next.addEventListener("click", () => goTo(index + 1));
    }
    dots.forEach((dot) => {
      if (dot instanceof HTMLButtonElement) {
        dot.addEventListener("click", () =>
          goTo(Number(dot.dataset.publicCarouselDot || 0)),
        );
      }
    });
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      }
    });
    viewport.addEventListener(
      "scroll",
      () => window.requestAnimationFrame(syncFromScroll),
      { passive: true },
    );
    mobileQuery.addEventListener("change", () => {
      applyState(index);
      const target = slides[index];
      viewport.scrollTo({
        left: target instanceof HTMLElement ? target.offsetLeft : 0,
      });
    });
    applyState(0);
  });
};

const setupPublicServiceTabs = () => {
  document.querySelectorAll("[data-public-service-tabs]").forEach((root) => {
    if (
      !(root instanceof HTMLElement) ||
      root.dataset.publicServiceTabsReady === "true"
    ) {
      return;
    }
    root.dataset.publicServiceTabsReady = "true";
    const tabs = Array.from(
      root.querySelectorAll("[data-public-service-tab]"),
    ).filter(
      (tab): tab is HTMLButtonElement => tab instanceof HTMLButtonElement,
    );
    const panels = Array.from(
      root.querySelectorAll("[data-public-service-panel]"),
    ).filter((panel): panel is HTMLElement => panel instanceof HTMLElement);
    if (tabs.length === 0 || panels.length === 0) {
      return;
    }

    const activate = (nextIndex: number, focus = false) => {
      const boundedIndex = Math.max(0, Math.min(nextIndex, tabs.length - 1));
      tabs.forEach((tab, index) => {
        const active = index === boundedIndex;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) {
          tab.focus();
        }
      });
      panels.forEach((panel, index) => {
        panel.hidden = index !== boundedIndex;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(index));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          activate(index - 1 < 0 ? tabs.length - 1 : index - 1, true);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          activate(index + 1 >= tabs.length ? 0 : index + 1, true);
        }
        if (event.key === "Home") {
          event.preventDefault();
          activate(0, true);
        }
        if (event.key === "End") {
          event.preventDefault();
          activate(tabs.length - 1, true);
        }
      });
    });

    const initiallySelected = tabs.findIndex(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    activate(initiallySelected >= 0 ? initiallySelected : 0);
  });
};

const setupPublicSystemCards = () => {
  document.querySelectorAll("[data-public-system-cards]").forEach((root) => {
    if (
      !(root instanceof HTMLElement) ||
      root.dataset.publicSystemCardsReady === "true"
    ) {
      return;
    }
    root.dataset.publicSystemCardsReady = "true";
    const links = Array.from(
      root.querySelectorAll("[data-public-system-card-link]"),
    ).filter(
      (link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement,
    );
    const panels = Array.from(
      root.querySelectorAll("[data-public-system-card-panel]"),
    ).filter((panel): panel is HTMLElement => panel instanceof HTMLElement);
    if (links.length === 0 || panels.length === 0) {
      return;
    }

    const activate = (id: string) => {
      links.forEach((link) => {
        const active = link.dataset.publicSystemCardLink === id;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };
    const update = () => {
      const targetY = window.innerHeight * 0.42;
      const closestPanel = panels
        .map((panel) => {
          const rect = panel.getBoundingClientRect();
          return {
            id: panel.dataset.publicSystemCardPanel || panel.id,
            score: Math.abs(rect.top - targetY),
            visible: rect.bottom > targetY && rect.top < window.innerHeight,
          };
        })
        .filter((panel) => panel.visible && panel.id)
        .sort((a, b) => a.score - b.score)[0];
      if (closestPanel?.id) {
        activate(closestPanel.id);
      }
    };
    const scheduleUpdate = () => window.requestAnimationFrame(update);

    links.forEach((link) => {
      link.addEventListener("click", () => {
        const id = link.dataset.publicSystemCardLink;
        if (id) {
          activate(id);
        }
      });
    });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    update();
  });
};

const setupPublicImageTiles = () => {
  document.querySelectorAll("[data-public-image-tiles]").forEach((root) => {
    if (
      !(root instanceof HTMLElement) ||
      root.dataset.publicImageTilesReady === "true"
    ) {
      return;
    }
    root.dataset.publicImageTilesReady = "true";
    const tabs = Array.from(
      root.querySelectorAll("[data-public-image-tile-tab]"),
    ).filter(
      (tab): tab is HTMLButtonElement => tab instanceof HTMLButtonElement,
    );
    const panels = Array.from(
      root.querySelectorAll("[data-public-image-tile-panel]"),
    ).filter((panel): panel is HTMLElement => panel instanceof HTMLElement);
    const images = Array.from(
      root.querySelectorAll("[data-public-image-tile-image]"),
    ).filter((image): image is HTMLElement => image instanceof HTMLElement);
    if (tabs.length === 0 || panels.length === 0) {
      return;
    }

    const activate = (nextIndex: number, focus = false) => {
      const boundedIndex = Math.max(0, Math.min(nextIndex, tabs.length - 1));
      tabs.forEach((tab, index) => {
        const active = index === boundedIndex;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) {
          tab.focus();
        }
      });
      panels.forEach((panel, index) => {
        panel.hidden = index !== boundedIndex;
      });
      images.forEach((image, index) => {
        image.hidden = index !== boundedIndex;
        image.classList.toggle("is-active", index === boundedIndex);
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(index));
      tab.addEventListener("mouseenter", () => activate(index));
      tab.addEventListener("focus", () => activate(index));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          event.preventDefault();
          activate(index - 1 < 0 ? tabs.length - 1 : index - 1, true);
        }
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          event.preventDefault();
          activate(index + 1 >= tabs.length ? 0 : index + 1, true);
        }
        if (event.key === "Home") {
          event.preventDefault();
          activate(0, true);
        }
        if (event.key === "End") {
          event.preventDefault();
          activate(tabs.length - 1, true);
        }
      });
    });
    activate(0);
  });
};

const setupPublicTabs = () => {
  document.querySelectorAll("[data-public-tabs]").forEach((root) => {
    if (
      !(root instanceof HTMLElement) ||
      root.dataset.publicTabsReady === "true"
    ) {
      return;
    }
    root.dataset.publicTabsReady = "true";
    const tabs = Array.from(
      root.querySelectorAll("[data-public-tab-trigger]"),
    ).filter(
      (tab): tab is HTMLButtonElement => tab instanceof HTMLButtonElement,
    );
    const panels = Array.from(
      root.querySelectorAll("[data-public-tab-panel]"),
    ).filter((panel): panel is HTMLElement => panel instanceof HTMLElement);
    if (tabs.length === 0 || panels.length === 0) {
      return;
    }

    const valueForTab = (tab: HTMLButtonElement, fallback: number) =>
      tab.dataset.publicTabTrigger || String(fallback);
    const tabValues = Array.from(
      new Set(tabs.map((tab, index) => valueForTab(tab, index))),
    );

    const activate = (nextValue: string, focus = false) => {
      const boundedValue = tabValues.includes(nextValue)
        ? nextValue
        : tabValues[0] || "0";
      tabs.forEach((tab, index) => {
        const active = valueForTab(tab, index) === boundedValue;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) {
          tab.focus();
        }
      });
      panels.forEach((panel) => {
        const active = (panel.dataset.publicTabPanel || "0") === boundedValue;
        panel.hidden = !active;
        panel.setAttribute("aria-hidden", String(!active));
        panel.classList.toggle("is-revealed", active);
      });
    };

    tabs.forEach((tab, index) => {
      const value = valueForTab(tab, index);
      tab.addEventListener("click", () => activate(value));
      tab.addEventListener("keydown", (event) => {
        const currentIndex = tabValues.indexOf(value);
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          activate(
            tabValues[currentIndex - 1] ??
              tabValues[tabValues.length - 1] ??
              value,
            true,
          );
        }
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          activate(tabValues[currentIndex + 1] ?? tabValues[0] ?? value, true);
        }
        if (event.key === "Home") {
          event.preventDefault();
          activate(tabValues[0] ?? value, true);
        }
        if (event.key === "End") {
          event.preventDefault();
          activate(tabValues[tabValues.length - 1] ?? value, true);
        }
      });
    });

    const initiallySelected = tabs.find(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    activate(
      initiallySelected
        ? valueForTab(initiallySelected, 0)
        : tabValues[0] || "0",
    );
  });
};

const setupFixedCtaNavigation = () => {
  document.querySelectorAll("[data-fixed-cta-nav]").forEach((root) => {
    if (
      !(root instanceof HTMLElement) ||
      root.dataset.fixedCtaNavReady === "true"
    ) {
      return;
    }
    root.dataset.fixedCtaNavReady = "true";
    const button = root.querySelector("[data-fixed-cta-nav-toggle]");
    const menu = root.querySelector("[data-fixed-cta-nav-menu]");
    if (
      !(button instanceof HTMLButtonElement) ||
      !(menu instanceof HTMLElement)
    ) {
      return;
    }
    const close = () => {
      menu.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    };
    button.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
    menu
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
      }
    });
  });
};

type PublicColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const parsePublicColor = (value: string): PublicColor | null => {
  const match = value.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d?(?:\.\d+)?))?\s*\)/i,
  );
  if (!match) {
    return null;
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
};

const blendPublicColor = (
  foreground: PublicColor,
  background: PublicColor,
): PublicColor => {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha <= 0) {
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  return {
    r:
      (foreground.r * foreground.a +
        background.r * background.a * (1 - foreground.a)) /
      alpha,
    g:
      (foreground.g * foreground.a +
        background.g * background.a * (1 - foreground.a)) /
      alpha,
    b:
      (foreground.b * foreground.a +
        background.b * background.a * (1 - foreground.a)) /
      alpha,
    a: alpha,
  };
};

const effectivePublicBackground = (element: Element): PublicColor => {
  const ownColor = parsePublicColor(
    window.getComputedStyle(element).backgroundColor,
  );
  if (ownColor && ownColor.a >= 1) {
    return ownColor;
  }
  const ancestry: Element[] = [];
  for (
    let current: Element | null = element;
    current;
    current = current.parentElement
  ) {
    ancestry.push(current);
  }
  let background: PublicColor = { r: 255, g: 255, b: 255, a: 1 };
  ancestry.reverse().forEach((ancestor) => {
    const color = parsePublicColor(
      window.getComputedStyle(ancestor).backgroundColor,
    );
    if (color && color.a > 0) {
      background = blendPublicColor(color, background);
    }
  });
  return background;
};

const publicLuminance = (color: PublicColor) => {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b)
  );
};

const publicContrastRatio = (
  foreground: PublicColor,
  background: PublicColor,
) => {
  const lighter = Math.max(
    publicLuminance(foreground),
    publicLuminance(background),
  );
  const darker = Math.min(
    publicLuminance(foreground),
    publicLuminance(background),
  );
  return (lighter + 0.05) / (darker + 0.05);
};

const isLargePublicText = (style: CSSStyleDeclaration) => {
  const size = Number.parseFloat(style.fontSize || "0");
  const weight = Number.parseInt(style.fontWeight || "400", 10);
  return size >= 24 || (size >= 18.66 && weight >= 700);
};

const setupDevContrastAuditStyles = () => {
  if (document.getElementById("public-dev-contrast-audit-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "public-dev-contrast-audit-style";
  style.textContent = `
    [data-public-contrast-warning="true"] {
      outline: 2px dashed #e11d48 !important;
      outline-offset: -4px;
      position: relative;
    }
    [data-public-contrast-warning="true"]::after {
      background: #e11d48;
      color: #fff;
      content: attr(data-public-contrast-label);
      font: 700 11px/1.2 ui-sans-serif, system-ui, sans-serif;
      inset: 6px auto auto 6px;
      letter-spacing: 0;
      max-width: min(360px, calc(100% - 12px));
      padding: 5px 7px;
      position: absolute;
      text-transform: none;
      z-index: 2147483000;
    }
  `;
  document.head.appendChild(style);
};

const setupDevContrastAudit = () => {
  if (
    !window.location.pathname.startsWith("/dev-blueprints/") &&
    !document.querySelector(".dev-blueprint-bar")
  ) {
    return;
  }
  setupDevContrastAuditStyles();
  const runContrastAudit = () => {
    const components = Array.from(
      document.querySelectorAll("[data-public-component-id]"),
    ).filter(
      (component): component is HTMLElement => component instanceof HTMLElement,
    );
    const textSelector =
      "h1,h2,h3,h4,h5,h6,p,a,button,span,li,dt,dd,label,strong,em,small";
    components.forEach((component) => {
      const warningTarget =
        component.firstElementChild instanceof HTMLElement
          ? component.firstElementChild
          : component;
      warningTarget.removeAttribute("data-public-contrast-warning");
      warningTarget.removeAttribute("data-public-contrast-label");
      warningTarget.removeAttribute("data-public-contrast-detail");
      const failing = Array.from(component.querySelectorAll(textSelector))
        .filter((item): item is HTMLElement => item instanceof HTMLElement)
        .map((item) => {
          const text = item.textContent?.replace(/\s+/g, " ").trim() ?? "";
          const rect = item.getBoundingClientRect();
          const style = window.getComputedStyle(item);
          if (
            text.length < 2 ||
            rect.width < 2 ||
            rect.height < 2 ||
            style.visibility === "hidden" ||
            style.display === "none"
          ) {
            return null;
          }
          const foreground = parsePublicColor(style.color);
          if (!foreground) {
            return null;
          }
          const background = effectivePublicBackground(item);
          const ratio = publicContrastRatio(foreground, background);
          const threshold = isLargePublicText(style) ? 3 : 4.5;
          return ratio < threshold
            ? { ratio, text, threshold, tagName: item.tagName.toLowerCase() }
            : null;
        })
        .filter(
          (
            issue,
          ): issue is {
            ratio: number;
            text: string;
            threshold: number;
            tagName: string;
          } => issue !== null,
        )
        .sort((a, b) => a.ratio - b.ratio)[0];
      if (!failing) {
        return;
      }
      const componentId = component.dataset.publicComponentId || "component";
      warningTarget.dataset.publicContrastWarning = "true";
      warningTarget.dataset.publicContrastLabel = `${componentId}: ${failing.ratio.toFixed(
        1,
      )}:1 contrast`;
      warningTarget.dataset.publicContrastDetail = failing.text.slice(0, 160);
      console.warn("[public contrast audit]", {
        component: componentId,
        ratio: failing.ratio,
        tag: failing.tagName,
        text: failing.text,
        threshold: failing.threshold,
      });
    });
  };
  window.setTimeout(runContrastAudit, 300);
  window.setTimeout(runContrastAudit, 1500);
};

type PublicFormSubmissionValue = string | string[];
type PublicFormSubmission = Record<string, PublicFormSubmissionValue>;

const addPublicFormValue = (
  submission: PublicFormSubmission,
  key: string,
  value: string,
) => {
  const existing = submission[key];
  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }
  submission[key] = typeof existing === "string" ? [existing, value] : value;
};

const formSubmissionFromForm = (form: HTMLFormElement) => {
  const data = new FormData(form);
  const submission: PublicFormSubmission = {};
  data.forEach((rawValue, key) => {
    if (!key || rawValue instanceof File) {
      return;
    }
    const value = String(rawValue).trim();
    if (value) {
      addPublicFormValue(submission, key, value);
    }
  });
  return submission;
};

const firstPublicFormValue = (
  submission: PublicFormSubmission,
  ...keys: string[]
) => {
  for (const key of keys) {
    const value = submission[key];
    if (Array.isArray(value) && value[0]) {
      return value[0];
    }
    if (typeof value === "string" && value) {
      return value;
    }
  }
  return "";
};

const setPublicFormSubmitting = (
  form: HTMLFormElement,
  isSubmitting: boolean,
) => {
  form
    .querySelectorAll('button[type="submit"], input[type="submit"]')
    .forEach((button) => {
      if (
        button instanceof HTMLButtonElement ||
        button instanceof HTMLInputElement
      ) {
        button.disabled = isSubmitting;
      }
    });
};

const setupPublicLeadForms = () => {
  document.querySelectorAll("[data-public-lead-form]").forEach((form) => {
    if (
      !(form instanceof HTMLFormElement) ||
      form.dataset.publicLeadFormReady === "true"
    ) {
      return;
    }
    form.dataset.publicLeadFormReady = "true";
    const status = form.querySelector("[data-public-lead-form-status]");
    const setStatus = (message: string) => {
      if (status instanceof HTMLElement) {
        status.textContent = message;
        status.setAttribute("role", "status");
      }
    };
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const action = form.getAttribute("action") || "";
      if (!action || action === "#") {
        setStatus("This form is not configured yet.");
        return;
      }
      const submission = formSubmissionFromForm(form);
      const name =
        firstPublicFormValue(submission, "name", "full_name") ||
        [
          firstPublicFormValue(submission, "first_name"),
          firstPublicFormValue(submission, "last_name"),
        ]
          .filter(Boolean)
          .join(" ") ||
        "Website visitor";
      const message = firstPublicFormValue(
        submission,
        "message",
        "description",
        "project_details",
        "notes",
      );
      const serviceType = firstPublicFormValue(
        submission,
        "service_type",
        "service",
        "inquiry_type",
        "subject",
      );
      const address = firstPublicFormValue(submission, "address");
      const payload = {
        customer: {
          address: address ? { raw: address } : {},
          email: firstPublicFormValue(submission, "email"),
          name,
          notes: message,
          phone: firstPublicFormValue(submission, "phone", "telephone"),
        },
        lead: {
          description: message || serviceType,
          form_submission: submission,
          service_type: serviceType,
          source: "website_form",
          urgency: firstPublicFormValue(submission, "urgency"),
        },
        source_page_path:
          form.dataset.sourcePagePath || window.location.pathname,
        tenant_slug: form.dataset.tenantSlug || "",
      };

      setPublicFormSubmitting(form, true);
      setStatus("Sending...");
      try {
        if (form.dataset.tenantSlug === "dev-blueprints") {
          (
            window as Window & {
              __placisLastPublicFormSubmission?: typeof payload;
            }
          ).__placisLastPublicFormSubmission = payload;
          form.reset();
          setStatus("Preview submission captured locally.");
          return;
        }
        const response = await fetch(action, {
          body: JSON.stringify(payload),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        if (!response.ok) {
          throw new Error(`Public form submit failed: ${response.status}`);
        }
        form.reset();
        setStatus("Thanks. Your request has been sent.");
      } catch {
        setStatus(
          "We could not send this form. Please check required fields and try again.",
        );
      } finally {
        setPublicFormSubmitting(form, false);
      }
    });
  });
};

const setupProjectPlanners = () => {
  document.querySelectorAll("[data-planner]").forEach((form) => {
    if (
      !(form instanceof HTMLFormElement) ||
      form.dataset.plannerReady === "true"
    ) {
      return;
    }
    form.dataset.plannerReady = "true";
    const rangeLabel = form.querySelector("[data-range-label]");
    const plannerResult = form.querySelector("[data-planner-result]");
    const timelineLabels: Record<string, string> = (() => {
      try {
        const parsed = JSON.parse(form.dataset.timelineLabels ?? "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    })();
    const timelineText = (value: string) => {
      if (typeof timelineLabels[value] === "string") {
        return timelineLabels[value];
      }
      return "Planning this season";
    };
    const updatePlanner = () => {
      if (!(plannerResult instanceof HTMLElement)) {
        return;
      }
      const data = new FormData(form);
      const type = String(data.get("type") || "a project");
      const priority = String(data.get("priority") || "your goals");
      const timeline = timelineText(String(data.get("timeline") || "2"));
      if (rangeLabel instanceof HTMLElement) {
        rangeLabel.textContent = timeline;
      }
      const prefix =
        form.dataset.resultPrefix || "Start with a scope conversation";
      plannerResult.textContent = `${prefix} for ${type}, focused on ${priority}, with ${timeline.toLowerCase()}.`;
      plannerResult.classList.remove("is-updating");
      void plannerResult.offsetWidth;
      plannerResult.classList.add("is-updating");
    };
    form.addEventListener("input", updatePlanner);
    updatePlanner();
  });
};

const setupPublicRuntime = () => {
  setupPublicNavigation();
  setupPublicCarousels();
  setupPublicServiceTabs();
  setupPublicSystemCards();
  setupPublicImageTiles();
  setupPublicTabs();
  setupFixedCtaNavigation();
  setupPublicLeadForms();
  setupDevContrastAudit();
  setupProjectPlanners();
};

setupPublicRuntime();
document.addEventListener("astro:page-load", setupPublicRuntime);
