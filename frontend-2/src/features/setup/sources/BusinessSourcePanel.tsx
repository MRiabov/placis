import { Building2, ChevronDown, Loader2, MapPin, Search } from "lucide-react";
import { type ReactNode, useId } from "react";

import { cn } from "@/shared/lib/cn";
import type {
  CompanyRegistryCandidate,
  CompanyRegistrySearchResult,
  GooglePlaceAutocompleteSuggestion,
} from "../api/setup";
import type { MapsLookupStatus, RegistryLookupStatus } from "./sourcesModel";

export type BusinessSourcePanelProps = {
  businessName: string;
  candidatesResult: CompanyRegistrySearchResult | null;
  controlsDisabled?: boolean;
  country: string;
  googleMapsCandidates: GooglePlaceAutocompleteSuggestion[];
  googleMapsLookupStatus: MapsLookupStatus;
  googleMapsQuery: string;
  googlePlaceId: string;
  onBusinessNameChange: (value: string) => void;
  onConfirm: () => void;
  onCountryChange: (value: string) => void;
  onGoogleMapsCandidateSelect: (
    candidate: GooglePlaceAutocompleteSuggestion | null,
  ) => void;
  onGoogleMapsQueryChange: (value: string) => void;
  onSelectedCandidateChange: (
    candidate: CompanyRegistryCandidate | null,
  ) => void;
  onTermsAcceptedChange: (value: boolean) => void;
  registryLookupStatus: RegistryLookupStatus;
  selectedCandidateId?: string;
  termsAccepted: boolean;
  title?: string;
};

export function BusinessSourcePanel({
  businessName,
  candidatesResult,
  controlsDisabled = false,
  country,
  googleMapsCandidates,
  googleMapsLookupStatus,
  googleMapsQuery,
  googlePlaceId,
  onBusinessNameChange,
  onConfirm,
  onCountryChange,
  onGoogleMapsCandidateSelect,
  onGoogleMapsQueryChange,
  onSelectedCandidateChange,
  onTermsAcceptedChange,
  registryLookupStatus,
  selectedCandidateId,
  termsAccepted,
  title = "Find your business",
}: BusinessSourcePanelProps): ReactNode {
  const candidates = candidatesResult?.candidates ?? [];
  const canConfirm =
    termsAccepted &&
    !controlsDisabled &&
    (Boolean(selectedCandidateId) || Boolean(googlePlaceId.trim()));

  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="grid gap-5">
        <div className="onboarding-source-header">
          <div>
            <p className="text-xl font-semibold text-foreground">{title}</p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Choose the country, then select the corporate registry record,
              Google Maps place, or both when they describe the same business.
            </p>
          </div>
        </div>

        <CountrySelector
        country={country}
        disabled={controlsDisabled}
        onCountryChange={onCountryChange}
      />

      <div className="grid gap-5">
        <CompanyRegistrySelector
          businessName={businessName}
          candidates={candidates}
          country={country}
          disabled={controlsDisabled}
          lookupStatus={registryLookupStatus}
          onBusinessNameChange={onBusinessNameChange}
          onSelectedCandidateChange={onSelectedCandidateChange}
          {...(selectedCandidateId ? { selectedCandidateId } : {})}
        />

        <div className="flex items-center gap-3 text-xs font-semibold uppercase">
          <span className="h-px flex-1 bg-border" />
          Optional Maps match
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleMapsSelector
          candidates={googleMapsCandidates}
          disabled={controlsDisabled}
          googlePlaceId={googlePlaceId}
          lookupStatus={googleMapsLookupStatus}
          onCandidateSelect={onGoogleMapsCandidateSelect}
          onQueryChange={onGoogleMapsQueryChange}
          query={googleMapsQuery}
        />
      </div>

      <label className="flex gap-3 rounded-lg border border-border p-3 text-sm">
        <input
          checked={termsAccepted}
          className="mt-1 size-4 rounded accent-foreground"
          disabled={controlsDisabled}
          onChange={(event) => onTermsAcceptedChange(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="block font-semibold text-foreground">
            I agree that Placis can collect public information about this
            business to prepare the website preview.
          </span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            We use this to check registry details, public listings, and basic
            marketing facts before the interview.
          </span>
        </span>
      </label>

      <button
        aria-busy={controlsDisabled}
        className="inline-flex w-fit items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canConfirm}
        onClick={onConfirm}
        type="button"
      >
        {controlsDisabled ? (
          <Loader2 className="size-4 animate-spin" />
        ) : selectedCandidateId ? (
          <Building2 className="size-4" />
        ) : (
          <MapPin className="size-4" />
        )}
        {controlsDisabled ? "Preparing review..." : "Confirm and review"}
      </button>
      </div>
    </section>
  );
}

function CountrySelector({
  country,
  disabled,
  onCountryChange,
}: {
  country: string;
  disabled: boolean;
  onCountryChange: (value: string) => void;
}): ReactNode {
  const selectId = useId();
  return (
    <div className="grid gap-1.5 text-sm">
      <label className="font-medium text-foreground" htmlFor={selectId}>
        Country
      </label>
      <div className="relative">
        <select
          className="h-11 w-full appearance-none rounded-md border border-border bg-background px-3 pr-10 text-foreground outline-none transition focus:border-foreground focus:ring-4 focus:ring-ring/10"
          disabled={disabled}
          id={selectId}
          onChange={(event) => onCountryChange(event.currentTarget.value)}
          value={country}
        >
          <option value="IE">🇮🇪 Ireland</option>
          <option value="GB">🇬🇧 United Kingdom</option>
          <option value="US">🇺🇸 United States</option>
        </select>
        <ChevronDown className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function CompanyRegistrySelector({
  businessName,
  candidates,
  country,
  disabled,
  lookupStatus,
  onBusinessNameChange,
  onSelectedCandidateChange,
  selectedCandidateId,
}: {
  businessName: string;
  candidates: CompanyRegistryCandidate[];
  country: string;
  disabled: boolean;
  lookupStatus: RegistryLookupStatus;
  onBusinessNameChange: (value: string) => void;
  onSelectedCandidateChange: (
    candidate: CompanyRegistryCandidate | null,
  ) => void;
  selectedCandidateId?: string;
}): ReactNode {
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    null;
  const registry = registryCopyForCountry(country);
  const inputId = useId();
  const listboxId = useId();
  const showCandidateDropdown = candidates.length > 0 && !selectedCandidate;

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">
          {registry.title}
        </p>
      </div>
      <div className="grid gap-1.5 text-sm">
        <label className="font-medium text-foreground" htmlFor={inputId}>
          Corporate name{" "}
          <span className="font-normal text-muted-foreground">
            ({registry.name})
          </span>
        </label>
        <div className="relative">
          <input
            aria-autocomplete="list"
            aria-controls={showCandidateDropdown ? listboxId : undefined}
            aria-expanded={showCandidateDropdown}
            className="h-11 w-full rounded-md border border-border bg-background px-3 pr-10 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground focus:ring-4 focus:ring-ring/10"
            disabled={disabled}
            id={inputId}
            onChange={(event) =>
              onBusinessNameChange(event.currentTarget.value)
            }
            role="combobox"
            placeholder={registry.placeholder}
            value={businessName}
          />
          {lookupStatus === "searching" ? (
            <span className="-translate-y-1/2 absolute top-1/2 right-3 flex size-4 items-center justify-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </span>
          ) : (
            <Search className="-translate-y-1/2 absolute top-1/2 right-3 size-4 text-muted-foreground" />
          )}
          {showCandidateDropdown ? (
            <div
              className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-background p-1 shadow-lg"
              id={listboxId}
              role="listbox"
            >
              {candidates.map((candidate) => (
                <button
                  aria-selected={false}
                  className="block w-full rounded px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted focus:bg-muted focus:outline-none"
                  key={candidate.id}
                  onClick={() => onSelectedCandidateChange(candidate)}
                  role="option"
                  type="button"
                >
                  <span className="block truncate font-semibold text-foreground">
                    {candidate.legal_name}
                  </span>
                  {candidate.registered_address ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {candidate.registered_address}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {!candidates.length && lookupStatus !== "idle" ? (
          <p className="text-xs leading-5 text-muted-foreground">
            {registryLookupLabel(lookupStatus)}
          </p>
        ) : null}
        {selectedCandidate ? (
          <div className="grid gap-1 rounded-md border border-border bg-muted p-3">
            <span className="text-xs text-muted-foreground">
              Selected match
            </span>
            <span className="text-sm font-semibold text-foreground">
              {selectedCandidate.legal_name}
            </span>
            {selectedCandidate.registered_address ? (
              <span className="text-xs text-muted-foreground">
                {selectedCandidate.registered_address}
              </span>
            ) : null}
            <button
              className="w-fit text-xs font-medium text-muted-foreground underline"
              disabled={disabled}
              onClick={() => onSelectedCandidateChange(null)}
              type="button"
            >
              Change
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GoogleMapsSelector({
  candidates,
  compact = false,
  disabled,
  googlePlaceId,
  label = "Find your place on Google Maps",
  lookupStatus,
  onCandidateSelect,
  onQueryChange,
  query,
}: {
  candidates: GooglePlaceAutocompleteSuggestion[];
  compact?: boolean;
  disabled: boolean;
  googlePlaceId: string;
  label?: string;
  lookupStatus: MapsLookupStatus;
  onCandidateSelect: (
    candidate: GooglePlaceAutocompleteSuggestion | null,
  ) => void;
  onQueryChange: (value: string) => void;
  query: string;
}): ReactNode {
  const inputId = useId();
  const listboxId = useId();
  const showCandidateDropdown = candidates.length > 0 && !googlePlaceId;

  return (
    <div className={cn("grid", compact ? "content-start gap-1.5" : "gap-3")}>
      {compact ? null : (
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Google Maps</p>
        </div>
      )}
      <div className="grid gap-1.5 text-sm">
        <label
          className={cn(
            compact
              ? "font-semibold text-foreground"
              : "font-medium text-foreground",
          )}
          htmlFor={inputId}
        >
          {label}
        </label>
        <div className="relative">
          <input
            aria-autocomplete="list"
            aria-controls={showCandidateDropdown ? listboxId : undefined}
            aria-expanded={showCandidateDropdown}
            className="h-11 w-full rounded-md border border-border bg-background px-3 pr-10 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground focus:ring-4 focus:ring-ring/10"
            disabled={disabled}
            id={inputId}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            role="combobox"
            placeholder="Roof Shield Dublin"
            value={query}
          />
          {lookupStatus === "searching" ? (
            <span className="-translate-y-1/2 absolute top-1/2 right-3 flex size-4 items-center justify-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </span>
          ) : (
            <Search className="-translate-y-1/2 absolute top-1/2 right-3 size-4 text-muted-foreground" />
          )}
          {showCandidateDropdown ? (
            <div
              className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-background p-1 shadow-lg"
              id={listboxId}
              role="listbox"
            >
              {candidates.map((candidate) => (
                <button
                  aria-selected={false}
                  className="block w-full rounded px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted focus:bg-muted focus:outline-none"
                  key={candidate.google_place_id}
                  onClick={() => onCandidateSelect(candidate)}
                  role="option"
                  type="button"
                >
                  <span className="block truncate font-semibold text-foreground">
                    {candidate.main_text ?? candidate.display_name}
                  </span>
                  {candidate.secondary_text ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {candidate.secondary_text}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {!candidates.length && lookupStatus !== "idle" ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {mapsLookupLabel(lookupStatus)}
        </p>
      ) : null}
      {googlePlaceId ? (
        <p className="text-xs font-medium text-foreground">
          Selected: {query || googlePlaceId}
        </p>
      ) : null}
    </div>
  );
}

function registryCopyForCountry(country: string): {
  name: string;
  placeholder: string;
  title: string;
} {
  switch (country) {
    case "GB":
      return {
        name: "Companies House",
        placeholder: "PrimeBuild Construction Limited",
        title: "Companies House",
      };
    case "US":
      return {
        name: "U.S. state registry",
        placeholder: "PrimeBuild Construction LLC",
        title: "State business registry",
      };
    default:
      return {
        name: "CRO / CORE",
        placeholder: "PrimeBuild Construction Limited",
        title: "Company registry",
      };
  }
}

function mapsLookupLabel(status: MapsLookupStatus): string {
  if (status === "searching") {
    return "Searching Maps listings";
  }
  if (status === "unavailable") {
    return "Maps lookup unavailable";
  }
  if (status === "error") {
    return "Maps lookup failed";
  }
  if (status === "ready") {
    return "No Maps listings returned yet";
  }
  return "";
}

function registryLookupLabel(status: RegistryLookupStatus): string {
  if (status === "searching") {
    return "Searching company registry";
  }
  if (status === "matched") {
    return "No registry matches returned yet";
  }
  if (status === "ambiguous") {
    return "Select a company match";
  }
  if (status === "not_found") {
    return "No matches found";
  }
  if (status === "disabled") {
    return "Registry lookup unavailable";
  }
  return "Lookup failed";
}
