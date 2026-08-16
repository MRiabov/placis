import { useEffect } from "react";

import { autocompleteGooglePlaces, searchCompanyRegistry } from "../api/setup";
import type { SetupOnboardingAction } from "../model/onboarding";
import type { SourcesAction, SourcesState } from "./sourcesModel";

const COMPANY_REGISTRY_SEARCH_DEBOUNCE_MS = 300;
const COMPANY_REGISTRY_SEARCH_MIN_QUERY_LENGTH = 3;
const GOOGLE_MAPS_SEARCH_DEBOUNCE_MS = 300;

/** Debounced company registry search driven by the business name field. */
export function useRegistrySearchEffect(
  state: SourcesState,
  dispatch: (action: SourcesAction) => void,
  dispatchOnboarding: (action: SetupOnboardingAction) => void,
): void {
  useEffect(() => {
    const query = state.businessName.trim();
    if (query.length < COMPANY_REGISTRY_SEARCH_MIN_QUERY_LENGTH) {
      dispatch({ type: "registry_lookup_status_changed", status: "idle" });
      dispatch({ type: "registry_search_result_received", result: null });
      dispatch({ type: "registry_candidate_selected", candidate: null });
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      dispatch({ type: "registry_lookup_status_changed", status: "searching" });
      dispatchOnboarding({ type: "error_shown", message: null });
      dispatchOnboarding({ type: "notice_shown", message: null });
      searchCompanyRegistry(
        {
          country: state.country,
          limit: 8,
          query,
          service_area: state.serviceArea.trim() || null,
          trade: null,
        },
        { signal: controller.signal },
      )
        .then((lookupResult) => {
          if (controller.signal.aborted) {
            return;
          }
          dispatch({
            type: "registry_search_result_received",
            result: lookupResult,
          });
          dispatch({ type: "registry_candidate_selected", candidate: null });
          dispatch({
            type: "registry_lookup_status_changed",
            status: lookupResult.lookup_status,
          });
          if (lookupResult.lookup_status === "disabled") {
            dispatchOnboarding({
              type: "notice_shown",
              message: "Company lookup is not configured in this environment.",
            });
          } else if (lookupResult.lookup_status === "error") {
            dispatchOnboarding({
              type: "error_shown",
              message: lookupResult.errors?.[0] ?? "Company lookup failed.",
            });
          }
        })
        .catch(() => {
          if (controller.signal.aborted) {
            return;
          }
          dispatch({ type: "registry_search_result_received", result: null });
          dispatch({ type: "registry_lookup_status_changed", status: "error" });
          dispatchOnboarding({
            type: "error_shown",
            message: "Lookup failed.",
          });
        });
    }, COMPANY_REGISTRY_SEARCH_DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [
    dispatch,
    dispatchOnboarding,
    state.businessName,
    state.country,
    state.serviceArea,
  ]);
}

/** Debounced Google Maps autocomplete driven by the maps query field. */
export function useMapsSearchEffect(
  state: SourcesState,
  dispatch: (action: SourcesAction) => void,
  googleMapsSessionToken: string,
): void {
  useEffect(() => {
    const query = state.googleMapsQuery.trim();
    if (query.length < 2) {
      dispatch({ type: "google_maps_candidates_received", candidates: [] });
      dispatch({ type: "google_maps_lookup_status_changed", status: "idle" });
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      dispatch({
        type: "google_maps_lookup_status_changed",
        status: "searching",
      });
      autocompleteGooglePlaces({
        country_code: state.country,
        input: query,
        language_code: state.country === "IE" ? "en-IE" : "en",
        limit: 6,
        session_token: googleMapsSessionToken,
      })
        .then((lookupResult) => {
          if (controller.signal.aborted) {
            return;
          }
          dispatch({
            type: "google_maps_candidates_received",
            candidates: lookupResult.items ?? [],
          });
          dispatch({
            type: "google_maps_lookup_status_changed",
            status: "ready",
          });
        })
        .catch(() => {
          if (controller.signal.aborted) {
            return;
          }
          dispatch({ type: "google_maps_candidates_received", candidates: [] });
          dispatch({
            type: "google_maps_lookup_status_changed",
            status: "unavailable",
          });
        });
    }, GOOGLE_MAPS_SEARCH_DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [dispatch, googleMapsSessionToken, state.country, state.googleMapsQuery]);
}
