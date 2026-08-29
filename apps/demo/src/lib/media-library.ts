import { photo } from "@/lib/fixtures";

export type MediaRatio = "landscape" | "portrait" | "square";

export type MediaLibraryItem = {
  id: string;
  src: string;
  caption: string;
  ratio: MediaRatio;
  by: "owner" | "research" | "ai";
  status: "approved" | "uploading" | "processing";
};

const seeds: Array<Omit<MediaLibraryItem, "id" | "src">> = [
  {
    caption: "Rear slope after the storm",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Slate repair on a terrace",
    by: "owner",
    status: "uploading",
    ratio: "portrait",
  },
  {
    caption: "New roof on a semi",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Guttering on the front",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Valley flashing",
    by: "research",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Ridge line after wind",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Chimney flashing",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Battens before the covering",
    by: "ai",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Full re-roof on a semi",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Finished elevation",
    by: "research",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Sheets going on",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Front elevation after handover",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Scaffold on the gable",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Leadwork at the chimney",
    by: "owner",
    status: "approved",
    ratio: "square",
  },
  {
    caption: "Fascia after the rain",
    by: "research",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Emergency tarp on the ridge",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Velux flashing",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Slate stack in the yard",
    by: "ai",
    status: "approved",
    ratio: "square",
  },
  {
    caption: "Hip tiles before bedding",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Underfelt on the rafters",
    by: "owner",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Dormer cheeks",
    by: "research",
    status: "approved",
    ratio: "portrait",
  },
  {
    caption: "Eaves after the fascia",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
  {
    caption: "Valley boards",
    by: "owner",
    status: "approved",
    ratio: "square",
  },
  {
    caption: "Finished porch roof",
    by: "owner",
    status: "approved",
    ratio: "landscape",
  },
];

export const mediaLibraryItems: MediaLibraryItem[] = seeds.map(
  (item, index) => ({
    ...item,
    id: `photo-${index}`,
    src: `${photo(index)}?n=${index}`,
  }),
);
