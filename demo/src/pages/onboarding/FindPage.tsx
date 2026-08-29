import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";
import { Combo } from "@/ui/Combo";
import { Field, Select } from "@/ui/Field";

const registryOptions = [
  {
    id: "cro-1",
    title: "BELLFIELD ROOFING LIMITED",
    hint: "623184 · Normal · 14 Bellfield Park, Dublin 12",
  },
  {
    id: "cro-2",
    title: "BELLFIELD HOLDINGS LIMITED",
    hint: "441902 · Normal · 8 Harcourt Street, Dublin 2",
  },
];

const mapsOptions = [
  {
    id: "maps-1",
    title: "Bellfield Roofing",
    hint: "Roofing contractor · Dublin 12 · 4.9 (86)",
  },
];

const registryCopy: Record<string, { hint: string; suffix: string }> = {
  IE: {
    hint: "Type the company name and pick the matching record.",
    suffix: "(CRO)",
  },
  GB: {
    hint: "Type the company name and pick the Companies House record.",
    suffix: "(Companies House)",
  },
  US: {
    hint: "Type the company name and pick the state registry record.",
    suffix: "(state registry)",
  },
};

type FindState =
  | "empty"
  | "results"
  | "picked"
  | "maps"
  | "consent"
  | "lookup"
  | "resume";

export function FindPage(): ReactNode {
  const navigate = useNavigate();
  const { setExtraGroups } = useOnboardingDev();
  const [country, setCountry] = useState("IE");
  const [registryQuery, setRegistryQuery] = useState("");
  const [registryPicked, setRegistryPicked] = useState<string | null>(null);
  const [mapsQuery, setMapsQuery] = useState("");
  const [mapsPicked, setMapsPicked] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resume, setResume] = useState(false);
  const ready = consent && Boolean(registryPicked || mapsPicked);

  const applyState = useCallback((state: FindState): void => {
    setResume(state === "resume");
    setBusy(state === "lookup");
    setRegistryQuery(state === "results" || state === "empty" ? "Be" : "");
    if (state === "empty") {
      setRegistryPicked(null);
      setMapsPicked(null);
      setConsent(false);
      return;
    }
    if (state === "results") {
      setRegistryPicked(null);
      setMapsPicked(null);
      setConsent(false);
      return;
    }
    setRegistryPicked("BELLFIELD ROOFING LIMITED");
    setMapsPicked(
      state === "maps" || state === "consent" ? "Bellfield Roofing" : null,
    );
    setConsent(state === "consent" || state === "lookup" || state === "picked");
  }, []);

  useEffect(() => {
    setExtraGroups([
      {
        title: "Find",
        tabs: [
          { id: "empty", label: "Empty", onSelect: () => applyState("empty") },
          {
            id: "results",
            label: "Registry results",
            onSelect: () => applyState("results"),
          },
          {
            id: "picked",
            label: "Record picked",
            onSelect: () => applyState("picked"),
          },
          {
            id: "maps",
            label: "Maps listing",
            onSelect: () => applyState("maps"),
          },
          {
            id: "consent",
            label: "Consent on",
            onSelect: () => applyState("consent"),
          },
          {
            id: "lookup",
            label: "Business lookup",
            onSelect: () => applyState("lookup"),
          },
          {
            id: "resume",
            label: "Resume",
            onSelect: () => applyState("resume"),
          },
        ],
      },
    ]);
    return () => setExtraGroups([]);
  }, [applyState, setExtraGroups]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Find your business
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose the country, then pick the company on the registry, on Google
        Maps, or both when they are the same business.
      </p>
      {resume ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Restoring your previous onboarding…
        </p>
      ) : (
        <div className="mt-6 grid gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
          <Field label="Country">
            <Select
              onChange={(event) => setCountry(event.target.value)}
              value={country}
            >
              <option value="IE">Ireland</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
            </Select>
          </Field>
          <p className="text-sm">
            Companies Registration Office{" "}
            <span className="text-muted-foreground">
              {registryCopy[country]?.hint}
            </span>
          </p>
          {registryPicked ? (
            <Picked
              label="Selected company registry record"
              title={registryPicked}
              meta="623184 · Normal · 14 Bellfield Park, Dublin 12"
              onChange={() => setRegistryPicked(null)}
            />
          ) : (
            <Field
              label={`Company name ${registryCopy[country]?.suffix ?? ""}`.trim()}
            >
              <Combo
                createKind="company"
                forceOpen={registryQuery.trim().length >= 2}
                onChange={(value, option) => {
                  setRegistryQuery(value);
                  if (option) {
                    setRegistryPicked(option.title);
                  }
                }}
                options={
                  registryQuery.trim().length >= 2 ? registryOptions : []
                }
                placeholder="Bellfield Roofing"
                value={registryQuery}
              />
            </Field>
          )}
          <p className="text-center text-xs tracking-wide text-muted-foreground uppercase">
            Optional Maps match
          </p>
          <p className="text-sm">
            Google Maps listing{" "}
            <span className="text-muted-foreground">
              Optional. We’ll use this for the name, phone, photos, and reviews.
            </span>
          </p>
          {mapsPicked ? (
            <Picked
              label="Selected Google Maps listing"
              title={mapsPicked}
              meta="Roofing contractor · Dublin 12 · 01 555 0199"
              onChange={() => setMapsPicked(null)}
            />
          ) : (
            <Field label="Find your place on Google Maps">
              <Combo
                createKind="place"
                forceOpen={mapsQuery.trim().length >= 2}
                onChange={(value, option) => {
                  setMapsQuery(value);
                  if (option) {
                    setMapsPicked(option.title);
                  }
                }}
                options={mapsQuery.trim().length >= 2 ? mapsOptions : []}
                placeholder="Bellfield Roofing Dublin"
                value={mapsQuery}
              />
            </Field>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              type="checkbox"
            />
            <span>
              <b>
                I agree that Placis can collect public information about this
                business to prepare the website preview.
              </b>
              <span className="mt-1 block text-muted-foreground">
                We use this to check company details, public listings, and basic
                marketing facts before we ask you questions.
              </span>
            </span>
          </label>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              We’ll look up public details after you agree.
            </p>
            <Button
              disabled={!ready || busy}
              onClick={() => {
                setBusy(true);
                window.setTimeout(() => {
                  void navigate({ to: "/onboarding/review" });
                }, 700);
              }}
            >
              {busy ? "Looking the business up…" : "Business lookup"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Picked({
  label,
  title,
  meta,
  onChange,
}: {
  label: string;
  title: string;
  meta: string;
  onChange: () => void;
}): ReactNode {
  return (
    <div className="grid gap-1 rounded-xl border border-border bg-zinc-50 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <b className="text-sm">{title}</b>
      <span className="text-xs text-muted-foreground">{meta}</span>
      <button
        className="justify-self-start text-sm underline"
        onClick={onChange}
        type="button"
      >
        Change
      </button>
    </div>
  );
}
