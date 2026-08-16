import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import type {
  CmsMediaAsset,
  CmsPageProjection,
  CmsSection,
  CmsSectionDesign,
  CmsSlot,
} from "../../api/cms";
import { DesignInspector } from "./DesignInspector";
import { FormsInspector } from "./FormsInspector";
import { HistoryInspector } from "./HistoryInspector";
import { ImageSlotControl } from "./ImageSlotControl";
import {
  addableSectionComponents,
  componentLabel,
  formatFieldLabel,
  sectionIndex,
  sectionSlots,
} from "./inspectorModel";
import { SeoInspector } from "./SeoInspector";
import { SlotControl } from "./SlotControls";

type InspectorTab = "content" | "design" | "seo" | "forms" | "history";

export type InspectorProps = {
  draft: CmsPageProjection | null;
  error: string | null;
  mediaAssets: CmsMediaAsset[];
  onAddSection: (componentId: string) => void;
  onDesignChange: (sectionId: string, design: CmsSectionDesign) => void;
  onDraftChange: (draft: CmsPageProjection) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onPageUpdate: (patch: { title?: string; path?: string }) => void;
  onRemoveSection: (sectionId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onSeoChange: (patch: Record<string, unknown>) => void;
  onUpdate: (sectionId: string, slotKey: string, patch: Partial<CmsSlot>) => void;
  onUpdateSection: (sectionId: string, patch: Partial<CmsSection>) => void;
  selectedSectionId: string;
};

const inspectorTabs: InspectorTab[] = [
  "content",
  "design",
  "seo",
  "forms",
  "history",
];

/** The editor's right panel: section content editing (design/seo/forms/history
 *  tabs arrive with their batches). */
export function Inspector({
  draft,
  error,
  mediaAssets,
  onAddSection,
  onDesignChange,
  onDraftChange,
  onMoveSection,
  onPageUpdate,
  onRemoveSection,
  onSelectSection,
  onSeoChange,
  onUpdate,
  onUpdateSection,
  selectedSectionId,
}: InspectorProps): ReactNode {
  const [activeTab, setActiveTab] = useState<InspectorTab>("content");
  const sections = draft?.sections ?? [];
  const section = sections.find(
    (candidate) => candidate.id === selectedSectionId,
  ) ?? null;
  const index = section
    ? sectionIndex(draft as CmsPageProjection, section.id)
    : -1;
  const sectionCount = sections.length;

  return (
    <aside className="cms-inspector cms-workspace min-h-0 border-cms-border-subtle border-l bg-cms-raised text-cms-text">
      <div className="cms-inspector-tabs" role="tablist">
        {inspectorTabs.map((tab) => (
          <button
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "cms-inspector-tab is-active" : "cms-inspector-tab"}
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            type="button"
          >
            {tab === "content" ? "Content" : tab === "seo" ? "SEO" : tab === "history" ? "History" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div className="cms-inspector-panel min-h-0 overflow-y-auto">
        {error ? (
          <p className="cms-inspector-error">{error}</p>
        ) : (
          <InspectorTabContent
            activeTab={activeTab}
            draft={draft}
            index={index}
            mediaAssets={mediaAssets}
            onAddSection={onAddSection}
            onDesignChange={onDesignChange}
            onDraftChange={onDraftChange}
            onMoveSection={onMoveSection}
            onPageUpdate={onPageUpdate}
            onRemoveSection={onRemoveSection}
            onSelectSection={onSelectSection}
            onSeoChange={onSeoChange}
            onUpdate={onUpdate}
            onUpdateSection={onUpdateSection}
            section={section}
            sectionCount={sectionCount}
          />
        )}
      </div>
    </aside>
  );
}

function SectionContent({
  draft,
  index,
  mediaAssets,
  onAddSection,
  onMoveSection,
  onRemoveSection,
  onSelectSection,
  onUpdate,
  onUpdateSection,
  section,
  sectionCount,
}: {
  draft: CmsPageProjection;
  index: number;
  mediaAssets: CmsMediaAsset[];
  onAddSection: (componentId: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onRemoveSection: (sectionId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onUpdate: (sectionId: string, slotKey: string, patch: Partial<CmsSlot>) => void;
  onUpdateSection: (sectionId: string, patch: Partial<CmsSection>) => void;
  section: CmsSection;
  sectionCount: number;
}): ReactNode {
  const slots = sectionSlots(section);

  return (
    <div className="cms-inspector-content">
      <div className="cms-field">
        <label className="cms-field-label" htmlFor="cms-section-select">
          Section
        </label>
        <select
          className="cms-field-control"
          id="cms-section-select"
          onChange={(event) => onSelectSection(event.target.value)}
          value={section.id}
        >
          {draft.sections?.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {componentLabel(candidate)}
            </option>
          ))}
        </select>
      </div>

      <SectionHeaderActions
        index={index}
        onMoveSection={onMoveSection}
        onRemoveSection={onRemoveSection}
        section={section}
        sectionCount={sectionCount}
      />
      <SectionAddAndVisibility
        onAddSection={onAddSection}
        onUpdateSection={onUpdateSection}
        section={section}
      />

      <div className="cms-inspector-fields">
        {slots.map((slot) => (
          <div className="cms-field" key={slot.key}>
            <label
              className="cms-field-label"
              htmlFor={`cms-slot-${section.id}-${slot.key}`}
            >
              {formatFieldLabel(slot.key)}
            </label>
            {slot.type === "image" ? (
              <ImageSlotControl
                mediaAssets={mediaAssets}
                onChange={(value) => onUpdate(section.id, slot.key, { value })}
                slot={slot}
              />
            ) : (
              <SlotControl
                fieldId={`cms-slot-${section.id}-${slot.key}`}
                onChange={(value) => onUpdate(section.id, slot.key, { value })}
                slot={slot}
              />
            )}
          </div>
        ))}
      </div>

      <p className="cms-inspector-hint">{draft.validation?.status ?? ""}</p>
    </div>
  );
}

function SectionHeaderActions({
  index,
  onMoveSection,
  onRemoveSection,
  section,
  sectionCount,
}: {
  index: number;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onRemoveSection: (sectionId: string) => void;
  section: CmsSection;
  sectionCount: number;
}): ReactNode {
  return (
    <div className="cms-inspector-section-header">
      <div className="min-w-0">
        <p className="cms-inspector-section-label">{componentLabel(section)}</p>
        <p className="cms-inspector-section-position">
          Section {index + 1} of {sectionCount}
        </p>
      </div>
      <div className="cms-inspector-section-actions">
        <button
          aria-label="Move section up"
          className="cms-icon-button"
          disabled={index <= 0}
          onClick={() => onMoveSection(section.id, -1)}
          type="button"
        >
          <ArrowUp aria-hidden="true" />
        </button>
        <button
          aria-label="Move section down"
          className="cms-icon-button"
          disabled={index >= sectionCount - 1}
          onClick={() => onMoveSection(section.id, 1)}
          type="button"
        >
          <ArrowDown aria-hidden="true" />
        </button>
        <button
          aria-label="Remove section"
          className="cms-icon-button cms-icon-button-danger"
          onClick={() => onRemoveSection(section.id)}
          type="button"
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function SectionAddAndVisibility({
  onAddSection,
  onUpdateSection,
  section,
}: {
  onAddSection: (componentId: string) => void;
  onUpdateSection: (sectionId: string, patch: Partial<CmsSection>) => void;
  section: CmsSection;
}): ReactNode {
  return (
    <>
      <div className="cms-inspector-add-section">
        <select
          aria-label="Component to add"
          className="cms-field-control"
          defaultValue={addableSectionComponents[0]?.id ?? ""}
        >
          {addableSectionComponents.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          className="cms-small-button"
          onClick={() => onAddSection(addableSectionComponents[0]?.id ?? "")}
          type="button"
        >
          Add below
        </button>
      </div>
      <div className="cms-inspector-visibility">
        <span className="cms-inspector-visibility-label">Visible</span>
        <button
          aria-checked={section.visible}
          aria-label="Section visible"
          className={`cms-toggle ${section.visible ? "is-on" : ""}`}
          onClick={() =>
            onUpdateSection(section.id, { visible: !section.visible })
          }
          role="switch"
          type="button"
        >
          <span aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

function InspectorTabContent({
  activeTab,
  draft,
  index,
  mediaAssets,
  onAddSection,
  onDesignChange,
  onDraftChange,
  onMoveSection,
  onPageUpdate,
  onRemoveSection,
  onSelectSection,
  onSeoChange,
  onUpdate,
  onUpdateSection,
  section,
  sectionCount,
}: {
  activeTab: InspectorTab;
  draft: CmsPageProjection | null;
  index: number;
  mediaAssets: CmsMediaAsset[];
  onAddSection: (componentId: string) => void;
  onDesignChange: (sectionId: string, design: CmsSectionDesign) => void;
  onDraftChange: (draft: CmsPageProjection) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onPageUpdate: (patch: { title?: string; path?: string }) => void;
  onRemoveSection: (sectionId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onSeoChange: (patch: Record<string, unknown>) => void;
  onUpdate: (
    sectionId: string,
    slotKey: string,
    patch: Partial<CmsSlot>,
  ) => void;
  onUpdateSection: (sectionId: string, patch: Partial<CmsSection>) => void;
  section: CmsSection | null;
  sectionCount: number;
}): ReactNode {
  switch (activeTab) {
    case "seo":
      return draft ? (
        <SeoInspector
          draft={draft}
          onPageUpdate={onPageUpdate}
          onSeoChange={onSeoChange}
        />
      ) : (
        <p className="cms-inspector-empty">Select a page to edit its SEO.</p>
      );
    case "forms":
      return draft ? (
        <FormsInspector draft={draft} onDraftChange={onDraftChange} />
      ) : (
        <p className="cms-inspector-empty">Select a page to edit its forms.</p>
      );
    case "history":
      return draft ? (
        <HistoryInspector draft={draft} />
      ) : (
        <p className="cms-inspector-empty">Select a page to view history.</p>
      );
    case "design":
      return section ? (
        <DesignInspector
          onDesignChange={(design) => onDesignChange(section.id, design)}
          section={section}
        />
      ) : (
        <p className="cms-inspector-empty">
          Select a section on the canvas to edit its design.
        </p>
      );
    default:
      return section ? (
        <SectionContent
          draft={draft as CmsPageProjection}
          index={index}
          mediaAssets={mediaAssets}
          onAddSection={onAddSection}
          onMoveSection={onMoveSection}
          onRemoveSection={onRemoveSection}
          onSelectSection={onSelectSection}
          onUpdate={onUpdate}
          onUpdateSection={onUpdateSection}
          section={section}
          sectionCount={sectionCount}
        />
      ) : (
        <p className="cms-inspector-empty">
          Select a section on the canvas to edit its content.
        </p>
      );
  }
}
