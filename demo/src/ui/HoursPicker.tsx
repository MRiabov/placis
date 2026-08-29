import { type ReactNode, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { Select } from "@/ui/Field";

type HoursRow = {
  day: string;
  closed: boolean;
  opens: string;
  closes: string;
};

const defaults: HoursRow[] = [
  { day: "Monday", closed: false, opens: "06:30", closes: "18:00" },
  { day: "Tuesday", closed: false, opens: "06:30", closes: "18:00" },
  { day: "Wednesday", closed: false, opens: "06:30", closes: "18:00" },
  { day: "Thursday", closed: false, opens: "06:30", closes: "18:00" },
  { day: "Friday", closed: false, opens: "06:30", closes: "18:00" },
  { day: "Saturday", closed: false, opens: "08:00", closes: "13:00" },
  { day: "Sunday", closed: true, opens: "08:00", closes: "17:00" },
];

function timeLabel(value: string): string {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  if (!Number.isFinite(hour)) {
    return value;
  }
  const suffix = hour >= 12 ? "pm" : "am";
  return `${hour % 12 || 12}:${rawMinute}${suffix}`;
}

export function HoursPicker(): ReactNode {
  const times = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => {
        const hour = String(Math.floor(index / 2)).padStart(2, "0");
        const minute = index % 2 === 0 ? "00" : "30";
        return `${hour}:${minute}`;
      }),
    [],
  );
  const [rows, setRows] = useState(defaults);

  return (
    <div className="grid max-w-xl gap-0">
      {rows.map((row, index) => (
        <div
          className="grid grid-cols-[5.75rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 py-1.5"
          key={row.day}
        >
          <div className="pt-3 text-sm">{row.day}</div>
          <div>
            {row.closed ? (
              <p className="pt-3 text-sm text-muted-foreground">Closed</p>
            ) : (
              <div className="flex items-center gap-2">
                <TimeSelect
                  day={row.day}
                  label="Opens"
                  onChange={(opens) => {
                    setRows((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, opens } : item,
                      ),
                    );
                  }}
                  times={times}
                  value={row.opens}
                />
                <span aria-hidden="true">–</span>
                <TimeSelect
                  day={row.day}
                  label="Closes"
                  onChange={(closes) => {
                    setRows((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, closes } : item,
                      ),
                    );
                  }}
                  times={times}
                  value={row.closes}
                />
              </div>
            )}
          </div>
          <div className="flex gap-1 pt-1">
            <button
              aria-label={
                row.closed ? `Reopen ${row.day}` : `Mark ${row.day} closed`
              }
              className={cn(
                "grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-black/5",
                row.closed ? "bg-black/5 text-foreground" : "",
              )}
              onClick={() => {
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, closed: !item.closed }
                      : item,
                  ),
                );
              }}
              title="Closed"
              type="button"
            >
              ⌀
            </button>
            <button
              aria-label={`Copy ${row.day} opening hours to following days`}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-black/5"
              onClick={() => {
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex > index
                      ? {
                          ...item,
                          closed: row.closed,
                          opens: row.opens,
                          closes: row.closes,
                        }
                      : item,
                  ),
                );
              }}
              title="Copy to following days"
              type="button"
            >
              ⧉
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeSelect({
  day,
  label,
  value,
  times,
  onChange,
}: {
  day: string;
  label: string;
  value: string;
  times: string[];
  onChange: (value: string) => void;
}): ReactNode {
  return (
    <Select
      aria-label={`${day} ${label}`}
      className="w-28"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {times.map((time) => (
        <option key={time} value={time}>
          {timeLabel(time)}
        </option>
      ))}
    </Select>
  );
}
