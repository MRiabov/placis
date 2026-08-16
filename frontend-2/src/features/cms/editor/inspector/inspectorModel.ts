import { pick } from "@/shared/lib/pick";
import type {
  CmsDesignControl,
  CmsForm,
  CmsFormField,
  CmsPageProjection,
  CmsPageSummary,
  CmsSection,
  CmsSectionDesign,
  CmsSlot,
} from "../../api/cms";

export type SlotValue = Record<string, unknown>;

/** Form field type vocabulary (the schema's fixed set). */
export const formFieldTypes = [
  "text",
  "textarea",
  "email",
  "phone",
  "address",
  "select",
  "date",
  "checkbox",
] as const;

export { pick } from "@/shared/lib/pick";

export function sectionSlots(section: CmsSection): CmsSlot[] {
  return section.slots ?? [];
}

export function slotTextValue(slot: CmsSlot): string {
  const source = slot.value as SlotValue | null;
  if (!source || typeof source !== "object") {
    return "";
  }
  const text = pick(source, "value");
  return typeof text === "string" ? text : "";
}

export function formatFieldLabel(value: string): string {
  return value
    .replace(/^public\./, "")
    .replace(/[._]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function componentLabel(section: CmsSection): string {
  return formatFieldLabel(section.component_id);
}

export function updateSlot(
  current: CmsPageProjection,
  sectionId: string,
  slotKey: string,
  patch: Partial<CmsSlot>,
): CmsPageProjection {
  return {
    ...current,
    sections: (current.sections ?? []).map((section) =>
      section.id === sectionId
        ? {
            ...section,
            slots: (section.slots ?? []).map((slot) =>
              slot.key === slotKey ? { ...slot, ...patch } : slot,
            ),
          }
        : section,
    ),
  };
}

export function moveSection(
  current: CmsPageProjection,
  sectionId: string,
  direction: -1 | 1,
): CmsPageProjection {
  const sections = [...(current.sections ?? [])];
  const index = sections.findIndex((section) => section.id === sectionId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= sections.length) {
    return current;
  }
  const [moved] = sections.splice(index, 1);
  if (!moved) {
    return current;
  }
  sections.splice(target, 0, moved);
  return { ...current, sections };
}

export function removeSection(
  current: CmsPageProjection,
  sectionId: string,
): CmsPageProjection {
  return {
    ...current,
    sections: (current.sections ?? []).filter(
      (section) => section.id !== sectionId,
    ),
  };
}

export function sectionIndex(
  draft: CmsPageProjection,
  sectionId: string,
): number {
  return (draft.sections ?? []).findIndex((section) => section.id === sectionId);
}

export type SectionComponentOption = {
  id: string;
  label: string;
};

/** Curated addable section components (the full registry integration arrives
 *  with the component-contract batch). */
export const addableSectionComponents: SectionComponentOption[] = [
  { id: "public.hero.split", label: "Hero" },
  { id: "public.gallery.masonry", label: "Gallery" },
  { id: "public.features.grid", label: "Features" },
  { id: "public.reviews.quotes", label: "Reviews" },
  { id: "public.cta.banner", label: "Call to action" },
  { id: "public.footer.simple", label: "Footer" },
];

export function imageSlotPreviewUrl(value: unknown): string | null {
  const source = value as SlotValue | null;
  const assetId = pick(source ?? {}, "asset_id");
  if (typeof assetId !== "string") {
    const url = pick(source ?? {}, "url");
    return typeof url === "string" ? url : null;
  }
  return null;
}

export type ImageAssetRef = {
  alt_text?: string | null;
  id: string;
  public_url?: string | null;
};

export function imageSlotValueFromAsset(asset: ImageAssetRef): SlotValue {
  return {
    asset_id: asset.id,
    ...(asset.alt_text ? { alt: asset.alt_text } : {}),
    ...(asset.public_url ? { url: asset.public_url } : {}),
  };
}

export function updateSection(
  current: CmsPageProjection,
  sectionId: string,
  patch: Partial<CmsSection>,
): CmsPageProjection {
  return {
    ...current,
    sections: (current.sections ?? []).map((section) =>
      section.id === sectionId ? { ...section, ...patch } : section,
    ),
  };
}

/** Page-level draft helpers + mutations (design/seo/forms/history tabs). */
export function pageSeo(draft: CmsPageProjection): CmsSectionDesign {
  return draft.seo ?? {};
}

export function pageForms(draft: CmsPageProjection): CmsForm[] {
  return draft.forms ?? [];
}

export function formFields(form: CmsForm): CmsFormField[] {
  return form.fields ?? [];
}

/** The form-field string fields exposed by fieldString. */
export type CmsFormFieldStringKey = "id" | "label" | "type";

export function fieldString(
  field: CmsFormField,
  key: CmsFormFieldStringKey,
): string {
  return field[key] ?? "";
}

export function pageVersions(draft: CmsPageProjection): NonNullable<CmsPageProjection["versions"]> {
  return draft.versions ?? [];
}

export function sectionDesign(section: CmsSection): CmsSectionDesign {
  return section.design ?? {};
}

export function designControls(section: CmsSection): CmsDesignControl[] {
  return section.design_controls ?? [];
}

export function updatePage(
  current: CmsPageProjection,
  patch: Partial<CmsPageSummary>,
): CmsPageProjection {
  return { ...current, page: { ...current.page, ...patch } };
}

export function updateSeo(
  current: CmsPageProjection,
  patch: Record<string, unknown>,
): CmsPageProjection {
  return { ...current, seo: { ...(current.seo ?? {}), ...patch } };
}

export function updateForm(
  current: CmsPageProjection,
  formId: string,
  patch: Partial<CmsForm>,
): CmsPageProjection {
  return {
    ...current,
    forms: pageForms(current).map((form) =>
      form.form_id === formId ? { ...form, ...patch } : form,
    ),
  };
}

export function updateFormField(
  current: CmsPageProjection,
  formId: string,
  index: number,
  patch: Partial<CmsFormField>,
): CmsPageProjection {
  return {
    ...current,
    forms: pageForms(current).map((form) =>
      form.form_id === formId
        ? {
            ...form,
            fields: formFields(form).map((field, fieldIndex) =>
              fieldIndex === index ? { ...field, ...patch } : field,
            ),
          }
        : form,
    ),
  };
}

export function addFormField(
  current: CmsPageProjection,
  formId: string,
): CmsPageProjection {
  return {
    ...current,
    forms: pageForms(current).map((form) =>
      form.form_id === formId
        ? {
            ...form,
            fields: [
              ...formFields(form),
              {
                id: `field_${formFields(form).length + 1}`,
                label: "New field",
                required: false,
                type: formFieldTypes[0],
              },
            ],
          }
        : form,
    ),
  };
}
