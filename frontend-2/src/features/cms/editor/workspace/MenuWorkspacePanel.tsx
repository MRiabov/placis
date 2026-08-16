import type { ReactNode } from "react";

import type { CmsPageProjection, CmsSection, CmsSlot } from "../../api/cms";
import { pick } from "@/shared/lib/pick";
import { sectionSlots, updateSlot } from "../inspector/inspectorModel";

export type MenuWorkspacePanelProps = {
  draft: CmsPageProjection | null;
  onDraftChange: (draft: CmsPageProjection) => void;
};

/** Header navigation editing: the nav section's links + phone button. */
export function MenuWorkspacePanel({
  draft,
  onDraftChange,
}: MenuWorkspacePanelProps): ReactNode {
  const section = navigationSectionFromDraft(draft);
  const linksSlot = section
    ? sectionSlots(section).find((slot) => slot.key === "links")
    : null;
  const phoneSlot = section
    ? sectionSlots(section).find((slot) => slot.key === "phone")
    : null;

  if (!draft) {
    return (
      <div className="grid gap-4">
        <div className="text-sm font-semibold">Menu</div>
        <p className="text-sm text-cms-text-muted">
          Load a page to edit the header menu.
        </p>
      </div>
    );
  }

  if (!section || !linksSlot) {
    return (
      <div className="grid gap-4">
        <div className="text-sm font-semibold">Menu</div>
        <p className="text-sm text-cms-text-muted">
          This page does not have a header navigation section yet. Add a
          navigation block to the page, then return here to edit the menu
          links and phone button.
        </p>
      </div>
    );
  }

  function changeSlot(sectionId: string, slot: CmsSlot, value: unknown) {
    if (!draft) {
      return;
    }
    const patch = { value: value as CmsSlot["value"] };
    onDraftChange(
      updateSlot(draft, sectionId, slot.key, patch as Partial<CmsSlot>) as CmsPageProjection,
    );
  }

  return (
    <div className="grid gap-4">
      <div className="text-sm font-semibold">Header menu</div>
      <NavigationLinksControl
        slot={linksSlot}
        onChange={(value) => changeSlot(section.id, linksSlot, value)}
      />
      {phoneSlot ? (
        <div className="cms-field">
          <span className="cms-field-label">Header phone button</span>
          <input
            aria-label="Header phone button"
            className="cms-field-control"
            onChange={(event) =>
              changeSlot(section.id, phoneSlot, { value: event.target.value })
            }
            value={slotText(phoneSlot)}
          />
        </div>
      ) : null}
    </div>
  );
}

function navigationSectionFromDraft(
  draft: CmsPageProjection | null,
): CmsSection | null {
  if (!draft) {
    return null;
  }
  return (
    draft.sections?.find((section) => {
      const family =
        section.component_family ??
        section.component_id.replace("public.", "").split(".")[0];
      return family === "navigation";
    }) ?? null
  );
}

function slotText(slot: CmsSlot): string {
  const source = slot.value;
  if (typeof source === "string") {
    return source;
  }
  if (source && typeof source === "object") {
    const value = pick(source as Record<string, unknown>, "value");
    return typeof value === "string" ? value : "";
  }
  return "";
}

function NavigationLinksControl({
  slot,
  onChange,
}: {
  slot: CmsSlot;
  onChange: (value: unknown) => void;
}): ReactNode {
  const raw = Array.isArray(slot.value) ? slot.value : [];
  const links = raw.map((entry) => {
    if (!entry || typeof entry !== "object") {
      return { href: "", label: "" };
    }
    const entryObject = entry as Record<string, unknown>;
    const href = pick(entryObject, "href");
    const label = pick(entryObject, "label");
    return {
      href: typeof href === "string" ? href : "",
      label: typeof label === "string" ? label : "",
    };
  });

  function updateLink(index: number, patch: { href?: string; label?: string }) {
    onChange(
      links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...patch } : link,
      ),
    );
  }

  return (
    <div className="grid gap-2">
      {links.length ? (
        links.map((link, index) => (
          <div
            className="cms-inspector-section-card grid gap-2"
            key={`${link.label}-${link.href}`}
          >
            <input
              aria-label="Link label"
              className="cms-field-control"
              onChange={(event) => updateLink(index, { label: event.target.value })}
              placeholder="Label"
              value={link.label}
            />
            <input
              aria-label="Link href"
              className="cms-field-control"
              onChange={(event) => updateLink(index, { href: event.target.value })}
              placeholder="/services"
              value={link.href}
            />
          </div>
        ))
      ) : (
        <p className="text-sm text-cms-text-muted">No links in the header yet.</p>
      )}
    </div>
  );
}
