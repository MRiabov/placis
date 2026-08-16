import { Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { pick } from "@/shared/lib/pick";
import type { CmsSlot } from "../../api/cms";
import {
  formatFieldLabel,
  slotTextValue,
  type SlotValue,
} from "./inspectorModel";

export type SlotControlProps = {
  fieldId: string;
  onChange: (value: SlotValue) => void;
  slot: CmsSlot;
};

/** Generic slot editor: text/textarea input, list editor, or a placeholder
 *  for the image/project/review/navigation controls (their batches). */
export function SlotControl({
  fieldId,
  onChange,
  slot,
}: SlotControlProps): ReactNode {
  if (slot.type === "list") {
    return <ListSlotEditor onChange={onChange} slot={slot} />;
  }
  if (slot.type === "textarea") {
    return (
      <textarea
        className="cms-field-control"
        id={fieldId}
        onChange={(event) => onChange({ value: event.target.value })}
        rows={3}
        value={slotTextValue(slot)}
      />
    );
  }
  return (
    <input
      className="cms-field-control"
      id={fieldId}
      onChange={(event) => onChange({ value: event.target.value })}
      value={slotTextValue(slot)}
    />
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrimitiveOrNull(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    ["string", "number", "boolean"].includes(typeof value)
  );
}

function listItems(value: unknown): unknown[] {
  const source = value as SlotValue | null;
  const items = pick(source ?? {}, "items");
  return Array.isArray(items) ? items : [];
}

function listItemKind(items: unknown[]): "object" | "string" {
  return items.some(isRecord) ? "object" : "string";
}

function coerceRepeaterValue(previousValue: unknown, nextValue: string): unknown {
  if (typeof previousValue === "number") {
    const parsed = Number(nextValue);
    return Number.isFinite(parsed) ? parsed : nextValue;
  }
  if (typeof previousValue === "boolean") {
    return nextValue === "true";
  }
  return nextValue;
}

function parseJsonLoose(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function ListSlotEditor({
  onChange,
  slot,
}: {
  onChange: (value: SlotValue) => void;
  slot: CmsSlot;
}): ReactNode {
  const items = listItems(slot.value);
  const [draftValue, setDraftValue] = useState("");
  const itemKind = listItemKind(items);

  function commit(nextItems: unknown[]): void {
    onChange({ items: nextItems });
  }

  function updateItem(index: number, nextEntry: unknown): void {
    commit(
      items.map((entry, entryIndex) =>
        entryIndex === index ? nextEntry : entry,
      ),
    );
  }

  function removeItem(index: number): void {
    commit(items.filter((_item, itemIndex) => itemIndex !== index));
  }

  function moveItem(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= items.length) {
      return;
    }
    const nextItems = [...items];
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    commit(nextItems);
  }

  function addItem(): void {
    commit([...items, itemKind === "object" ? {} : ""]);
  }

  function addDraftText(): void {
    const value = draftValue.trim();
    if (!value) {
      return;
    }
    commit([...items, value]);
    setDraftValue("");
  }

  return (
    <div className="cms-field-stack">
      {items.length ? (
        items.map((entry, index) => (
          <ListSlotItem
            entry={entry}
            index={index}
            // biome-ignore lint/suspicious/noArrayIndexKey: reorderable list items have no stable id
            key={`${slot.key}-${index}`}
            label={slot.label}
            onMoveDown={
              index < items.length - 1 ? () => moveItem(index, 1) : undefined
            }
            onMoveUp={index > 0 ? () => moveItem(index, -1) : undefined}
            onRemove={() => removeItem(index)}
            onUpdate={(nextEntry) => updateItem(index, nextEntry)}
          />
        ))
      ) : (
        <p className="cms-field-hint">No items yet.</p>
      )}
      {itemKind === "object" ? (
        <button
          aria-label={`Add ${slot.label} item`}
          className="cms-small-button"
          onClick={addItem}
          type="button"
        >
          Add item
        </button>
      ) : (
        <div className="cms-field-row">
          <input
            aria-label={`Add ${slot.label} entry`}
            className="cms-field-control"
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || !draftValue.trim()) {
                return;
              }
              event.preventDefault();
              addDraftText();
            }}
            placeholder={`Add ${slot.label.toLowerCase()}…`}
            value={draftValue}
          />
          <button
            aria-label={`Add ${slot.label} entry`}
            className="cms-icon-button"
            disabled={!draftValue.trim()}
            onClick={addDraftText}
            type="button"
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function ListSlotItem({
  entry,
  index,
  label,
  onMoveDown,
  onMoveUp,
  onRemove,
  onUpdate,
}: {
  entry: unknown;
  index: number;
  label: string;
  onMoveDown: (() => void) | undefined;
  onMoveUp: (() => void) | undefined;
  onRemove: () => void;
  onUpdate: (entry: unknown) => void;
}): ReactNode {
  if (!isRecord(entry)) {
    return (
      <div className="cms-repeater-item">
        <input
          aria-label={`${label} entry ${index + 1}`}
          className="cms-field-control"
          onChange={(event) =>
            onUpdate(coerceRepeaterValue(entry, event.target.value))
          }
          value={
            typeof entry === "string" ||
            typeof entry === "number" ||
            typeof entry === "boolean"
              ? String(entry)
              : ""
          }
        />
        <RepeaterActions
          onMoveDown={onMoveDown}
          onMoveUp={onMoveUp}
          onRemove={onRemove}
        />
      </div>
    );
  }

  const entries = Object.entries(entry);
  return (
    <div className="cms-repeater-card">
      <div className="cms-repeater-card-header">
        <strong className="cms-repeater-card-title">Item {index + 1}</strong>
        <RepeaterActions
          onMoveDown={onMoveDown}
          onMoveUp={onMoveUp}
          onRemove={onRemove}
        />
      </div>
      {entries.length ? (
        entries.map(([key, value]) => (
          <div className="cms-field" key={key}>
            <span className="cms-field-label">
              {formatFieldLabel(key)}
            </span>
            <ListItemFieldValue
              label={formatFieldLabel(key)}
              onChange={(nextValue) => onUpdate({ ...entry, [key]: nextValue })}
              value={value}
            />
          </div>
        ))
      ) : (
        <button
          className="cms-small-button"
          onClick={() => onUpdate({ title: "" })}
          type="button"
        >
          Add field
        </button>
      )}
    </div>
  );
}

function RepeaterActions({
  onMoveDown,
  onMoveUp,
  onRemove,
}: {
  onMoveDown: (() => void) | undefined;
  onMoveUp: (() => void) | undefined;
  onRemove: () => void;
}): ReactNode {
  return (
    <div className="cms-repeater-actions">
      <button
        aria-label="Move item up"
        className="cms-icon-button"
        disabled={!onMoveUp}
        onClick={onMoveUp}
        type="button"
      >
        ↑
      </button>
      <button
        aria-label="Move item down"
        className="cms-icon-button"
        disabled={!onMoveDown}
        onClick={onMoveDown}
        type="button"
      >
        ↓
      </button>
      <button
        aria-label="Remove item"
        className="cms-icon-button"
        onClick={onRemove}
        type="button"
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}

function ListItemFieldValue({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}): ReactNode {
  if (isPrimitiveOrNull(value)) {
    return (
      <input
        aria-label={label}
        className="cms-field-control"
        onChange={(event) =>
          onChange(coerceRepeaterValue(value, event.target.value))
        }
        value={value === null || value === undefined ? "" : String(value)}
      />
    );
  }
  if (Array.isArray(value) && value.every(isPrimitiveOrNull)) {
    return <PrimitiveListEditor primitiveValues={value} onChange={onChange} />;
  }
  if (isRecord(value)) {
    return (
      <KeyValueEditor
        addLabel="Add value"
        emptyLabel="No fields yet."
        onChange={onChange}
        value={value}
      />
    );
  }
  return (
    <textarea
      className="cms-field-control"
      onChange={(event) => onChange(parseJsonLoose(event.target.value))}
      rows={3}
      value={JSON.stringify(value ?? null, null, 2)}
    />
  );
}

function PrimitiveListEditor({
  primitiveValues,
  onChange,
}: {
  primitiveValues: unknown[];
  onChange: (nextValues: unknown[]) => void;
}): ReactNode {
  const [draftValue, setDraftValue] = useState("");

  function updateAt(index: number, nextValue: string): void {
    onChange(
      primitiveValues.map((entry, entryIndex) =>
        entryIndex === index ? coerceRepeaterValue(entry, nextValue) : entry,
      ),
    );
  }

  function removeAt(index: number): void {
    onChange(primitiveValues.filter((_entry, entryIndex) => entryIndex !== index));
  }

  function addDraft(): void {
    const value = draftValue.trim();
    if (!value) {
      return;
    }
    onChange([...primitiveValues, value]);
    setDraftValue("");
  }

  return (
    <div className="cms-field-stack">
      {primitiveValues.map((entry, index) => (
        <div
          className="cms-list-field-row"
          // biome-ignore lint/suspicious/noArrayIndexKey: reorderable values have no stable id
          key={`${index}-${String(entry)}`}
        >
          <input
            aria-label={`Value ${index + 1}`}
            className="cms-field-control"
            onChange={(event) => updateAt(index, event.target.value)}
            value={entry === null || entry === undefined ? "" : String(entry)}
          />
          <button
            aria-label={`Remove value ${index + 1}`}
            className="cms-icon-button"
            onClick={() => removeAt(index)}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      ))}
      <div className="cms-field-row">
        <input
          aria-label="Add value"
          className="cms-field-control"
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || !draftValue.trim()) {
              return;
            }
            event.preventDefault();
            addDraft();
          }}
          value={draftValue}
        />
        <button
          aria-label="Add value"
          className="cms-icon-button"
          disabled={!draftValue.trim()}
          onClick={addDraft}
          type="button"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Flat metadata bag editor (design overrides, media crop/provenance, and
 *  similar provider-shaped records) with one labeled field per key. */
function KeyValueEditor({
  addLabel = "Add field",
  emptyLabel,
  value,
  onChange,
}: {
  addLabel?: string;
  emptyLabel: string;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}): ReactNode {
  const [newKey, setNewKey] = useState("");
  const entries = Object.entries(value);

  function updateEntry(key: string, nextValue: unknown): void {
    onChange({ ...value, [key]: nextValue });
  }

  function removeEntry(key: string): void {
    const next = { ...value };
    delete next[key];
    onChange(next);
  }

  function addEntry(): void {
    const key = newKey.trim();
    if (!key || key in value) {
      return;
    }
    onChange({ ...value, [key]: "" });
    setNewKey("");
  }

  return (
    <div className="cms-field-stack">
      {entries.length ? (
        entries.map(([key, entryValue]) => (
          <div className="cms-list-field-row" key={key}>
            <input
              aria-label={`${key} field name`}
              className="cms-field-control cms-kv-key-input"
              disabled
              value={formatFieldLabel(key)}
            />
            <ListItemFieldValue
              label={key}
              onChange={(nextValue) => updateEntry(key, nextValue)}
              value={entryValue}
            />
            <button
              aria-label={`Remove ${formatFieldLabel(key)}`}
              className="cms-icon-button"
              onClick={() => removeEntry(key)}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        ))
      ) : (
        <p className="cms-field-hint">{emptyLabel}</p>
      )}
      <div className="cms-field-row">
        <input
          aria-label={addLabel}
          className="cms-field-control"
          onChange={(event) => setNewKey(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || !newKey.trim()) {
              return;
            }
            event.preventDefault();
            addEntry();
          }}
          placeholder={addLabel}
          value={newKey}
        />
        <button
          aria-label={addLabel}
          className="cms-icon-button"
          disabled={!newKey.trim()}
          onClick={addEntry}
          type="button"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
