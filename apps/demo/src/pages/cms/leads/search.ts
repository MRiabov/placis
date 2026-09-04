export type LeadsSearch = {
  ad_id: string | undefined;
  dev: string | undefined;
  empty: string | undefined;
  shot: string | undefined;
  source: string | undefined;
  status: string | undefined;
  website_prefix: string | undefined;
};

export function leadsSearch(overrides: Partial<LeadsSearch> = {}): LeadsSearch {
  const params = new URLSearchParams(window.location.search);
  const read = (key: keyof LeadsSearch): string | undefined => {
    if (Object.hasOwn(overrides, key)) {
      return overrides[key];
    }
    return params.get(key) ?? undefined;
  };
  return {
    ad_id: read("ad_id"),
    dev: read("dev"),
    empty: read("empty"),
    shot: read("shot"),
    source: read("source"),
    status: read("status"),
    website_prefix: read("website_prefix"),
  };
}
