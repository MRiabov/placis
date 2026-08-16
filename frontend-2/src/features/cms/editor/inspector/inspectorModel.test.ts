import { describe, expect, it } from "vitest";

import type { CmsPageProjection, CmsSection, CmsSlot } from "../../api/cms";
import {
  addableSectionComponents,
  imageSlotValueFromAsset,
  moveSection,
  removeSection,
  sectionSlots,
  updateSection,
  updateSlot,
} from "./inspectorModel";

function slotFixture(
  key: string,
  label: string,
  type: string,
  value?: unknown,
): CmsSlot {
  return { key, label, required: false, status: "draft", type, ...(value ? { value } : {}) } as CmsSlot;
}

function section(id: string, slots: CmsSlot[] = [], visible = true): CmsSection {
  return {
    component_id: "public.hero.split",
    id,
    slots,
    visible,
  } as CmsSection;
}

function draft(sections: CmsSection[] = []): CmsPageProjection {
  return { page: { id: "page-1" }, sections } as CmsPageProjection;
}

describe("inspector draft mutations", () => {
  it("updates a slot value in place and preserves the rest", () => {
    const slot = slotFixture("title", "Title", "text", { value: "Old" });
    const updated = updateSlot(draft([section("s1", [slot])]), "s1", "title", {
      value: { value: "New" },
    });
    const updatedSlot = updated.sections?.[0]?.slots?.[0];
    expect(updatedSlot?.value).toEqual({ value: "New" });
  });

  it("moves a section up and down, clamping at the edges", () => {
    const source = draft([section("a"), section("b"), section("c")]);
    expect(moveSection(source, "b", -1).sections?.map((s) => s.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(moveSection(source, "a", -1).sections?.map((s) => s.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(moveSection(source, "c", 1).sections?.map((s) => s.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("removes a section", () => {
    const updated = removeSection(draft([section("a"), section("b")]), "a");
    expect(updated.sections?.map((s) => s.id)).toEqual(["b"]);
  });

  it("patches a section (visibility) without touching slots", () => {
    const slot = slotFixture("title", "Title", "text", { value: "X" });
    const updated = updateSection(draft([section("s1", [slot])]), "s1", {
      visible: false,
    });
    expect(updated.sections?.[0]?.visible).toBe(false);
    expect(updated.sections?.[0]?.slots).toHaveLength(1);
  });

  it("exposes the section slots and a curated addable list", () => {
    const slot = slotFixture("title", "Title", "text");
    expect(sectionSlots(section("s1", [slot]))).toHaveLength(1);
    expect(addableSectionComponents.length).toBeGreaterThan(3);
    expect(addableSectionComponents[0]?.id).toMatch(/^public\./);
  });

  it("builds an image slot value from an asset", () => {
    expect(
      imageSlotValueFromAsset({
        id: "asset-1",
        alt_text: "Kitchen",
        public_url: "https://cdn.example/kitchen.jpg",
      }),
    ).toEqual({
      asset_id: "asset-1",
      alt: "Kitchen",
      url: "https://cdn.example/kitchen.jpg",
    });
  });
});
