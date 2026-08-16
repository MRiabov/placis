import { describe, expect, it } from "vitest";

import { initialSourcesState, sourcesReducer } from "./sourcesModel";

const candidate = {
  company_number: "IE123456",
  confidence: "high",
  country: "IE",
  id: "candidate-1",
  legal_name: "Bellfield Construction Ltd",
  match_reason: "name",
  provider: "cro",
  registry_id: "registry-1",
  registry_name: "CRO",
} as const;

const mapsCandidate = {
  display_name: "Bellfield Construction",
  google_maps_url: "https://maps.google.com/?cid=1",
  google_place_id: "google-place-1",
  main_text: "Bellfield Construction",
  secondary_text: "Dublin",
  source_provider: "google_places_autocomplete",
} as const;

describe("sourcesReducer", () => {
  it("tracks business name and registry search results", () => {
    let state = initialSourcesState();
    state = sourcesReducer(state, {
      type: "business_name_changed",
      value: "Bellfield",
    });
    state = sourcesReducer(state, {
      type: "registry_search_result_received",
      result: {
        candidates: [candidate],
        country: "IE",
        lookup_status: "matched",
        provider: "cro",
        query: "Bellfield",
      },
    });
    state = sourcesReducer(state, {
      type: "registry_candidate_selected",
      candidate,
    });
    expect(state.businessName).toBe("Bellfield");
    expect(state.selectedRegistryCandidate?.id).toBe("candidate-1");
    expect(state.searchResult?.lookup_status).toBe("matched");
  });

  it("selects a google maps candidate and resets the selection on clear", () => {
    let state = initialSourcesState();
    state = sourcesReducer(state, {
      type: "google_maps_candidate_selected",
      candidate: mapsCandidate,
    });
    expect(state.googlePlaceId).toBe("google-place-1");
    expect(state.googleMapsUrl).toContain("maps.google.com");
    expect(state.googleMapsQuery).toBe("Bellfield Construction");

    state = sourcesReducer(state, {
      type: "google_maps_candidate_selected",
      candidate: null,
    });
    expect(state.googlePlaceId).toBe("");
    expect(state.googleMapsUrl).toBe("");
  });

  it("keeps the business name but clears search state when the country changes", () => {
    let state = sourcesReducer(initialSourcesState(), {
      type: "business_name_changed",
      value: "Bellfield",
    });
    state = sourcesReducer(state, {
      type: "terms_accepted_changed",
      accepted: true,
    });
    state = sourcesReducer(state, {
      type: "google_maps_candidate_selected",
      candidate: mapsCandidate,
    });
    state = sourcesReducer(state, { type: "country_changed", value: "GB" });
    expect(state.country).toBe("GB");
    expect(state.businessName).toBe("Bellfield");
    expect(state.termsAccepted).toBe(true);
    expect(state.googlePlaceId).toBe("");
    expect(state.searchResult).toBeNull();
    expect(state.registryLookupStatus).toBe("idle");
  });

  it("tracks terms acceptance, service area and website url", () => {
    let state = initialSourcesState();
    state = sourcesReducer(state, {
      type: "terms_accepted_changed",
      accepted: true,
    });
    state = sourcesReducer(state, {
      type: "service_area_changed",
      value: "Dublin",
    });
    state = sourcesReducer(state, {
      type: "website_url_changed",
      value: "https://bellfield.ie",
    });
    expect(state.termsAccepted).toBe(true);
    expect(state.serviceArea).toBe("Dublin");
    expect(state.websiteUrl).toBe("https://bellfield.ie");
  });

  it("resets to the initial state", () => {
    let state = sourcesReducer(initialSourcesState(), {
      type: "google_maps_lookup_status_changed",
      status: "searching",
    });
    state = sourcesReducer(state, { type: "sources_reset" });
    expect(state).toEqual(initialSourcesState());
  });
});
