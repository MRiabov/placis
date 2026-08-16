import { ImagePlus, LinkIcon, Upload } from "lucide-react";
import {
  type DragEvent,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  CmsImageEditRequest,
  CmsMediaAsset,
  CmsMediaAssetCreate,
  CmsMediaAssetPatch,
} from "../../api/cms";
import {
  assetLabel,
  assetPreviewUrl,
  clampPercent,
  hasImageFileDrag,
  hasMediaAssetDrag,
  mediaAssetFromTransfer,
  mediaDragType,
  numberOrDefault,
  previewFixtureUrl,
} from "./mediaModel";

export type MediaWorkspacePanelProps = {
  assets: CmsMediaAsset[];
  selectedAssetId: string;
  onSelectAsset: (assetId: string) => void;
  onCreateMediaAsset: (asset: CmsMediaAssetCreate) => void;
  onCreateImageEdit: (assetId: string, request: CmsImageEditRequest) => void;
  onUploadMediaAsset: (file: File, altText: string) => Promise<unknown>;
  onUpdateMediaAsset: (assetId: string, patch: CmsMediaAssetPatch) => void;
};

export function MediaWorkspacePanel({
  assets,
  selectedAssetId,
  onSelectAsset,
  onCreateMediaAsset,
  onCreateImageEdit,
  onUploadMediaAsset,
  onUpdateMediaAsset,
}: MediaWorkspacePanelProps): ReactNode {
  const [uploadDropActive, setUploadDropActive] = useState(false);
  const {
    fileInputRef,
    setUploadAltText,
    uploadAltText,
    uploadError,
    uploading,
    uploadFiles,
  } = useMediaFileUploads(onUploadMediaAsset);
  const [urlFormOpen, setUrlFormOpen] = useState(false);
  const selectedAsset =
    assets.find((asset) => asset.id === selectedAssetId) ?? assets[0] ?? null;


  function handleUploadDragOver(event: DragEvent<HTMLDivElement>): void {
    if (!hasImageFileDrag(event) && !hasMediaAssetDrag(event)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = uploading ? "none" : "copy";
    if (!uploading) {
      setUploadDropActive(true);
    }
  }

  function handleUploadDrop(event: DragEvent<HTMLDivElement>): void {
    if (!hasImageFileDrag(event) && !hasMediaAssetDrag(event)) {
      return;
    }
    event.preventDefault();
    setUploadDropActive(false);
    if (uploading) {
      return;
    }
    const draggedAsset = mediaAssetFromTransfer(event.dataTransfer);
    if (draggedAsset) {
      onSelectAsset(draggedAsset.id);
      return;
    }
    void uploadFiles(event.dataTransfer.files);
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-sm font-semibold">Media</div>
        <p className="mt-1 text-xs leading-relaxed text-cms-text-muted">
          Drag photos onto images in the preview, or drop files here to
          upload.
        </p>
      </div>
      <UploadDropZone
        dropActive={uploadDropActive}
        fileInputRef={fileInputRef}
        onClearDropActive={() => setUploadDropActive(false)}
        onDragOver={handleUploadDragOver}
        onDrop={handleUploadDrop}
        onOpenUrlForm={() => setUrlFormOpen((current) => !current)}
        onPickFile={() => fileInputRef.current?.click()}
        onUploadAltTextChange={setUploadAltText}
        uploading={uploading}
        uploadAltText={uploadAltText}
      />
      {uploadError ? (
        <p className="cms-field-error" role="alert">
          {uploadError}
        </p>
      ) : null}
      {urlFormOpen ? (
        <UrlImportForm
          onCancel={() => setUrlFormOpen(false)}
          onCreate={(asset) => {
            onCreateMediaAsset(asset);
            setUrlFormOpen(false);
          }}
        />
      ) : null}
      <div className="cms-media-grid">
        {assets.length ? (
          assets.map((asset) => (
            <MediaAssetGridCard
              active={asset.id === selectedAsset?.id}
              asset={asset}
              key={asset.id}
              onSelect={() => onSelectAsset(asset.id)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-cms-border bg-cms-surface p-3 text-sm text-cms-text-muted">
            No CMS assets yet.
          </div>
        )}
      </div>
      {selectedAsset ? (
        <MediaAssetDetails
          asset={selectedAsset}
          key={selectedAsset.id}
          onCreateImageEdit={(request) =>
            onCreateImageEdit(selectedAsset.id, request)
          }
          onUpdate={(patch) => onUpdateMediaAsset(selectedAsset.id, patch)}
        />
      ) : null}
    </div>
  );
}

/** File-chooser + drag-drop upload state for the media workspace.
 *  The chooser rides a direct native change listener because the file
 *  input's React onChange does not fire reliably for file selections
 *  (the native change reaches the document, but the synthetic event is
 *  never dispatched to this input in the browser). */
function useMediaFileUploads(
  onUploadMediaAsset: (file: File, altText: string) => Promise<unknown>,
): {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setUploadAltText: (value: string) => void;
  uploadAltText: string;
  uploadError: string | null;
  uploading: boolean;
  uploadFiles: (fileList: FileList | File[]) => Promise<void>;
} {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]): Promise<void> => {
      const files = Array.from(fileList).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (!files.length) {
        return;
      }
      setUploading(true);
      setUploadError(null);
      try {
        for (const file of files) {
          await onUploadMediaAsset(file, uploadAltText);
        }
        setUploadAltText("");
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
        );
      } finally {
        setUploading(false);
      }
    },
    [onUploadMediaAsset, uploadAltText],
  );

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) {
      return;
    }
    const fileInput: HTMLInputElement = input;
    function handleNativeFileChange(): void {
      const files = fileInput.files;
      fileInput.value = "";
      if (files?.length) {
        void uploadFiles(files);
      }
    }
    fileInput.addEventListener("change", handleNativeFileChange);
    return () => fileInput.removeEventListener("change", handleNativeFileChange);
  }, [uploadFiles]);

  return {
    fileInputRef,
    setUploadAltText,
    uploadAltText,
    uploadError,
    uploading,
    uploadFiles,
  };
}

function UploadDropZone({
  dropActive,
  fileInputRef,
  onClearDropActive,
  onDragOver,
  onDrop,
  onOpenUrlForm,
  onPickFile,
  onUploadAltTextChange,
  uploading,
  uploadAltText,
}: {
  dropActive: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClearDropActive: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onOpenUrlForm: () => void;
  onPickFile: () => void;
  onUploadAltTextChange: (value: string) => void;
  uploading: boolean;
  uploadAltText: string;
}): ReactNode {
  return (
    <div
      className={dropActive ? "cms-media-upload-zone is-drop-active" : "cms-media-upload-zone"}
      data-cms-media-upload-dropzone
      onDragLeaveCapture={onClearDropActive}
      onDragOverCapture={onDragOver}
      onDropCapture={onDrop}
    >
      <div className="cms-media-upload-empty">
        <ImagePlus aria-hidden="true" size={18} />
        <span>Drop photos here</span>
      </div>
      <input
        accept="image/*"
        aria-label="Image file"
        className="sr-only"
        disabled={uploading}
        ref={fileInputRef}
        type="file"
      />
      <div className="grid gap-1.5">
        <span className="text-[11px] font-semibold uppercase text-cms-text-muted">
          New image alt text
        </span>
        <input
          aria-label="New image alt text"
          onChange={(event) => onUploadAltTextChange(event.target.value)}
          placeholder="Describe the image before upload"
          value={uploadAltText}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="button-primary"
          disabled={uploading}
          onClick={onPickFile}
          type="button"
        >
          <ImagePlus aria-hidden="true" size={16} />
          {uploading ? "Uploading" : "Add image"}
        </button>
        <button
          className="button-secondary"
          onClick={onOpenUrlForm}
          type="button"
        >
          <LinkIcon aria-hidden="true" size={16} />
          Add URL
        </button>
      </div>
    </div>
  );
}


function UrlImportForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (asset: CmsMediaAssetCreate) => void;
}): ReactNode {
  const [sourceUrl, setSourceUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [source, setSource] =
    useState<CmsMediaAssetCreate["source"]>("imported");
  const trimmedUrl = sourceUrl.trim();

  return (
    <div className="grid gap-2 rounded-lg border border-cms-border bg-cms-surface p-3">
      <Field label="Source">
        <select
          onChange={(event) =>
            setSource(event.target.value as CmsMediaAssetCreate["source"])
          }
          value={source}
        >
          <option value="imported">Imported</option>
          <option value="upload">Uploaded</option>
          <option value="generated">Generated</option>
          <option value="external">External reference</option>
        </select>
      </Field>
      <Field label="Preview or source URL">
        <input
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="/fixtures/project.jpg"
          value={sourceUrl}
        />
      </Field>
      <Field label="Alt text">
        <input
          onChange={(event) => setAltText(event.target.value)}
          placeholder="Describe the image"
          value={altText}
        />
      </Field>
      <button
        className="button-secondary"
        disabled={!trimmedUrl}
        onClick={() => {
          if (!trimmedUrl) {
            return;
          }
          onCreate({
            alt_text: altText.trim() || null,
            asset_type: source === "generated" ? "generated_image" : "image",
            metadata: { preview_url: trimmedUrl },
            provenance:
              source === "imported" || source === "external"
                ? { source_url: trimmedUrl }
                : {},
            review_status: "pending_review",
            source,
            source_url: trimmedUrl,
          });
          setSourceUrl("");
          setAltText("");
        }}
        type="button"
      >
        <Upload aria-hidden="true" size={16} />
        Create asset
      </button>
      <button className="text-xs text-cms-text-muted" onClick={onCancel} type="button">
        Cancel
      </button>
    </div>
  );
}

function MediaAssetGridCard({
  active,
  asset,
  onSelect,
}: {
  active: boolean;
  asset: CmsMediaAsset;
  onSelect: () => void;
}): ReactNode {
  const previewUrl = previewFixtureUrl(assetPreviewUrl(asset));
  return (
    <button
      className={active ? "cms-media-grid-card is-active" : "cms-media-grid-card"}
      draggable
      onClick={onSelect}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData(mediaDragType, JSON.stringify(asset));
      }}
      title={`${assetLabel(asset)} — drag onto an image in the canvas`}
      type="button"
    >
      <img alt={asset.alt_text ?? assetLabel(asset)} src={previewUrl} />
      <span className="cms-media-grid-label">{assetLabel(asset)}</span>
    </button>
  );
}

function MediaAssetDetails({
  asset,
  onCreateImageEdit,
  onUpdate,
}: {
  asset: CmsMediaAsset;
  onCreateImageEdit: (request: CmsImageEditRequest) => void;
  onUpdate: (patch: CmsMediaAssetPatch) => void;
}): ReactNode {
  const [altText, setAltText] = useState(asset.alt_text ?? "");
  const [focalX, setFocalX] = useState(
    String(numberOrDefault(asset.focal_point?.x, 50)),
  );
  const [focalY, setFocalY] = useState(
    String(numberOrDefault(asset.focal_point?.y, 50)),
  );
  const [reviewStatus, setReviewStatus] = useState(asset.review_status);

  return (
    <div className="grid gap-3 rounded-lg border border-cms-border bg-cms-surface p-3">
      <div>
        <div className="text-sm font-semibold">{assetLabel(asset)}</div>
        <div className="mt-1 text-xs text-cms-text-muted">
          {asset.asset_type} · {asset.source}
        </div>
      </div>
      <Field label="Alt text">
        <input
          onChange={(event) => setAltText(event.target.value)}
          value={altText}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Focal X">
          <input
            max="100"
            min="0"
            onChange={(event) => setFocalX(event.target.value)}
            type="number"
            value={focalX}
          />
        </Field>
        <Field label="Focal Y">
          <input
            max="100"
            min="0"
            onChange={(event) => setFocalY(event.target.value)}
            type="number"
            value={focalY}
          />
        </Field>
      </div>
      <Field label="Review">
        <select
          onChange={(event) =>
            setReviewStatus(
              event.target.value as CmsMediaAsset["review_status"],
            )
          }
          value={reviewStatus}
        >
          <option value="pending_review">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </Field>
      {["image", "logo", "generated_image"].includes(asset.asset_type) ? (
        <ImageEditControls
          altText={asset.alt_text ?? ""}
          onCreateImageEdit={onCreateImageEdit}
        />
      ) : null}
      <button
        className="button-secondary"
        onClick={() => {
          void onUpdate({
            alt_text: altText,
            focal_point: { x: clampPercent(focalX), y: clampPercent(focalY) },
            provenance: {},
            review_status: reviewStatus,
          });
        }}
        type="button"
      >
        Save asset details
      </button>
    </div>
  );
}

function ImageEditControls({
  altText,
  onCreateImageEdit,
}: {
  altText: string;
  onCreateImageEdit: (request: CmsImageEditRequest) => void;
}): ReactNode {
  const [editPreset, setEditPreset] =
    useState<CmsImageEditRequest["preset"]>("brighter_weather");
  const [editBrandName, setEditBrandName] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editAltText, setEditAltText] = useState("");

  return (
    <div className="grid gap-2 rounded-lg border border-cms-border bg-cms-raised p-3">
      <div>
        <div className="text-sm font-semibold">AI image edit</div>
        <div className="mt-1 text-xs text-cms-text-muted">
          Creates a new generated asset from this image.
        </div>
      </div>
      <Field label="Preset">
        <select
          onChange={(event) =>
            setEditPreset(
              event.target.value as CmsImageEditRequest["preset"],
            )
          }
          value={editPreset}
        >
          <option value="brighter_weather">Brighter weather</option>
          <option value="branded_workwear">Branded workwear</option>
          <option value="clean_background">Clean background</option>
          <option value="custom">Custom</option>
        </select>
      </Field>
      <Field label="Brand name">
        <input
          onChange={(event) => setEditBrandName(event.target.value)}
          placeholder="Used for branded clothing edits"
          value={editBrandName}
        />
      </Field>
      <Field label="Instruction">
        <textarea
          onChange={(event) => setEditPrompt(event.target.value)}
          placeholder="Make the job photo brighter while preserving the work shown"
          rows={4}
          value={editPrompt}
        />
      </Field>
      <Field label="New alt text">
        <input
          onChange={(event) => setEditAltText(event.target.value)}
          placeholder={altText || "Describe the edited image"}
          value={editAltText}
        />
      </Field>
      <button
        className="button-secondary"
        disabled={!editPrompt.trim()}
        onClick={() => {
          const prompt = editPrompt.trim();
          if (!prompt) {
            return;
          }
          onCreateImageEdit({
            brand_name: editBrandName.trim() || null,
            metadata: { requested_from: "cms_media_panel" },
            output_alt_text: editAltText.trim() || null,
            preset: editPreset,
            prompt,
          });
          setEditPrompt("");
          setEditAltText("");
        }}
        type="button"
      >
        <ImagePlus aria-hidden="true" size={16} />
        Create edited image
      </button>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }): ReactNode {
  const fieldId = useId();
  const control =
    isValidElement<{ id?: string }>(children)
      ? cloneElement(children, { id: fieldId })
      : children;
  return (
    <div className="grid gap-1.5">
      <label
        className="text-[11px] font-semibold uppercase text-cms-text-muted"
        htmlFor={fieldId}
      >
        {label}
      </label>
      {control}
    </div>
  );
}
