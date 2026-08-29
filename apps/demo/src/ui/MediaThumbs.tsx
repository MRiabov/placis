import { type ReactNode, useRef } from "react";

import { cn } from "@/lib/cn";
import type { MediaLibraryItem, MediaRatio } from "@/lib/media-library";

const ratioClass: Record<MediaRatio, string> = {
  landscape: "aspect-[3/2]",
  portrait: "aspect-[3/4]",
  square: "aspect-square",
};

type MediaThumbsProps = {
  items: MediaLibraryItem[];
  selectedId?: string | null;
  onPick: (item: MediaLibraryItem) => void;
  onUpload?: (file: File) => void;
};

export function MediaThumbs({
  items,
  selectedId,
  onPick,
  onUpload,
}: MediaThumbsProps): ReactNode {
  const fileRef = useRef<HTMLInputElement>(null);
  const dense = items.length > 10;

  function addFile(file: File | undefined): void {
    if (file && onUpload) {
      onUpload(file);
    }
  }

  return (
    <div
      className={cn(
        "gap-x-2 [column-fill:_balance]",
        dense
          ? "columns-2 min-[1101px]:columns-4"
          : "columns-2 min-[1101px]:columns-3",
      )}
    >
      {onUpload ? (
        <button
          className="mb-2 flex h-[72px] w-full break-inside-avoid items-center justify-center rounded-[10px] border border-dashed border-stone-300 text-sm text-muted-foreground"
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFile(event.dataTransfer.files[0]);
          }}
          type="button"
        >
          Upload
        </button>
      ) : null}
      {items.map((item) => (
        <button
          aria-label={item.caption}
          className={cn(
            "relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-[10px] bg-zinc-200",
            ratioClass[item.ratio],
            selectedId === item.id
              ? "shadow-[inset_0_0_0_2px_var(--color-primary)]"
              : "border border-transparent",
          )}
          key={item.id}
          onClick={() => onPick(item)}
          type="button"
        >
          <img alt="" className="size-full object-cover" src={item.src} />
          {item.status === "uploading" ? (
            <span className="absolute inset-0 grid place-items-center bg-white/80 text-[9px]">
              Uploading…
            </span>
          ) : null}
        </button>
      ))}
      {onUpload ? (
        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            addFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          ref={fileRef}
          type="file"
        />
      ) : null}
    </div>
  );
}
