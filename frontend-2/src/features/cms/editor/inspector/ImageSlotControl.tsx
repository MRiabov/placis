import { ImagePlus, X } from "lucide-react";
import type { ReactNode } from "react";

import type { CmsMediaAsset, CmsSlot } from "../../api/cms";
import {
  imageSlotPreviewUrl,
  imageSlotValueFromAsset,
  pick,
  type SlotValue,
} from "./inspectorModel";

export type ImageSlotControlProps = {
  mediaAssets: CmsMediaAsset[];
  onChange: (value: SlotValue) => void;
  slot: CmsSlot;
};

/** Image slot editor: asset picker + preview + clear (drag-and-drop and the
 *  upload flow arrive with the media batch). */
export function ImageSlotControl({
  mediaAssets,
  onChange,
  slot,
}: ImageSlotControlProps): ReactNode {
  const previewUrl = imageSlotPreviewUrl(slot.value);
  const valueRecord = slot.value as SlotValue | null;
  const linkedAssetId =
    typeof pick(valueRecord ?? {}, "asset_id") === "string"
      ? (pick(valueRecord ?? {}, "asset_id") as string)
      : null;

  return (
    <div className="grid gap-2">
      <span className="font-semibold text-cms-muted text-[11px] uppercase">
        {slot.label}
        {slot.required ? " *" : ""}
      </span>
      <fieldset
        aria-label={slot.label}
        className={`cms-image-slot ${previewUrl ? "has-image" : ""}`}
      >
        {previewUrl ? (
          <>
            <img alt={slot.label} src={previewUrl} />
            <button
              aria-label={`Remove ${slot.label}`}
              className="cms-image-slot-remove"
              onClick={() => onChange({})}
              type="button"
            >
              <X aria-hidden="true" size={14} />
            </button>
          </>
        ) : (
          <div className="cms-image-slot-empty">
            <ImagePlus aria-hidden="true" size={18} />
            <span>Choose a photo, or clear to leave the slot empty</span>
          </div>
        )}
      </fieldset>
      <select
        aria-label={`Choose ${slot.label} asset`}
        className="cms-field-control"
        onChange={(event) => {
          const asset = mediaAssets.find(
            (candidate) => candidate.id === event.target.value,
          );
          if (asset) {
            onChange(imageSlotValueFromAsset(asset));
          }
        }}
        value={linkedAssetId ?? ""}
      >
        <option value="">Choose an asset…</option>
        {mediaAssets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.alt_text || asset.id.slice(0, 8)}
          </option>
        ))}
      </select>
    </div>
  );
}
