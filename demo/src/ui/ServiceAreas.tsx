import { type ReactNode, useState } from "react";

import { placeOptions } from "@/lib/fixtures";
import { Combo, type ComboOption } from "@/ui/Combo";
import { card } from "@/ui/card";
import { Select } from "@/ui/Field";

type Territory = {
  name: string;
  radius: string;
};

const radii = ["15 km", "25 km", "40 km"] as const;

type ServiceAreasProps = {
  initial?: Territory[];
};

export function ServiceAreas({
  initial = [
    { name: "Dublin", radius: "25 km" },
    { name: "North County Dublin", radius: "40 km" },
  ],
}: ServiceAreasProps): ReactNode {
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState(initial);

  function pick(option: ComboOption): void {
    const place = placeOptions.find((item) => item.id === option.id);
    const radius = place?.radius ?? "25 km";
    setAreas((current) => {
      const existing = current.find((item) => item.name === option.title);
      if (existing) {
        return current.map((item) =>
          item.name === option.title ? { ...item, radius } : item,
        );
      }
      return [...current, { name: option.title, radius }];
    });
    setQuery("");
  }

  return (
    <div className="grid gap-2">
      <span className="text-[13px] tracking-tight text-zinc-600">
        Service areas
      </span>
      <Combo
        ariaLabel="Service areas"
        createKind="place"
        groupLabel="Places"
        onChange={(_value, option) => {
          if (option) {
            pick(option);
            return;
          }
          setQuery(_value);
        }}
        options={[...placeOptions]}
        placeholder="Search a Google Maps territory…"
        value={query}
      />
      <div className="mt-1 grid gap-2">
        {areas.map((area) => (
          <div
            className={card(
              "flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5",
            )}
            key={area.name}
          >
            <div className="grid min-w-32 flex-1 gap-0.5">
              <b className="text-sm font-semibold">{area.name}</b>
              <span className="text-xs text-muted-foreground">
                Google Maps territory
              </span>
            </div>
            <div className="grid min-w-28 gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Radius
              </span>
              <Select
                aria-label={`${area.name} radius`}
                onChange={(event) => {
                  setAreas((current) =>
                    current.map((item) =>
                      item.name === area.name
                        ? { ...item, radius: event.target.value }
                        : item,
                    ),
                  );
                }}
                value={area.radius}
              >
                {radii.map((radius) => (
                  <option key={radius}>{radius}</option>
                ))}
              </Select>
            </div>
            <button
              aria-label={`Remove ${area.name}`}
              className="grid size-8 place-items-center rounded-full text-lg text-muted-foreground hover:bg-black/5"
              onClick={() =>
                setAreas((current) =>
                  current.filter((item) => item.name !== area.name),
                )
              }
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs leading-snug text-muted-foreground">
        Search a place, then set how far you travel.
      </p>
    </div>
  );
}
