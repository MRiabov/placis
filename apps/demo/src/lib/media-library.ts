import { photo } from "@/lib/fixtures";

export type MediaRatio = "landscape" | "portrait" | "square";

export type MediaLibraryItem = {
  id: string;
  src: string;
  ratio: MediaRatio;
  by: "owner" | "research" | "ai";
  status: "approved" | "uploading" | "processing";
};

const seeds: Array<Omit<MediaLibraryItem, "id" | "src">> = [
  { by: "owner", status: "approved", ratio: "landscape" },
  { by: "owner", status: "uploading", ratio: "portrait" },
  { by: "owner", status: "approved", ratio: "landscape" },
  { by: "owner", status: "approved", ratio: "landscape" },
  { by: "research", status: "approved", ratio: "landscape" },
  { by: "owner", status: "approved", ratio: "portrait" },
  { by: "owner", status: "approved", ratio: "portrait" },
  { by: "ai", status: "approved", ratio: "portrait" },
  { by: "owner", status: "approved", ratio: "landscape" },
  { by: "research", status: "approved", ratio: "landscape" },
  { by: "owner", status: "approved", ratio: "portrait" },
  { by: "owner", status: "approved", ratio: "landscape" },
  { by: "owner", status: "approved", ratio: "portrait" },
  { by: "owner", status: "approved", ratio: "square" },
  { by: "research", status: "approved", ratio: "landscape" },
  { by: "owner", status: "approved", ratio: "landscape" },
  { by: "owner", status: "approved", ratio: "portrait" },
  { by: "ai", status: "approved", ratio: "square" },
  { by: "owner", status: "approved", ratio: "landscape" },
  { by: "owner", status: "approved", ratio: "portrait" },
  { by: "research", status: "approved", ratio: "portrait" },
  { by: "owner", status: "approved", ratio: "landscape" },
  { by: "owner", status: "approved", ratio: "square" },
  { by: "owner", status: "approved", ratio: "landscape" },
];

export const mediaLibraryItems: MediaLibraryItem[] = seeds.map(
  (item, index) => ({
    ...item,
    id: `photo-${index}`,
    src: `${photo(index)}?n=${index}`,
  }),
);
