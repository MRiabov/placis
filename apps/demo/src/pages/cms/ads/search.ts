export type AdsSearch = {
  archive: string | undefined;
  archived: string | undefined;
  compact: string | undefined;
  connected: string | undefined;
  dev: string | undefined;
  review: string | undefined;
  scene: string | undefined;
  shot: string | undefined;
  view: string | undefined;
};

export function adsSearch(overrides: Partial<AdsSearch> = {}): AdsSearch {
  const params = new URLSearchParams(window.location.search);
  const read = (key: keyof AdsSearch): string | undefined => {
    if (Object.hasOwn(overrides, key)) {
      return overrides[key];
    }
    return params.get(key) ?? undefined;
  };
  return {
    archive: read("archive"),
    archived: read("archived"),
    compact: read("compact"),
    connected: read("connected"),
    dev: read("dev"),
    review: read("review"),
    scene: read("scene"),
    shot: read("shot"),
    view: read("view"),
  };
}
