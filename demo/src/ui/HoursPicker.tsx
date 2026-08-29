import { type ReactNode, useMemo, useState } from "react";

import { cn } from "@/lib/cn";

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
          <div className="pt-3 text-sm tracking-tight">{row.day}</div>
          <div>
            {row.closed ? (
              <p className="flex min-h-11 items-center text-sm text-muted-foreground">
                Closed
              </p>
            ) : (
              <div className="grid grid-cols-[minmax(6.5rem,1fr)_20px_minmax(6.5rem,1fr)] items-center gap-2.5">
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
                <span
                  aria-hidden="true"
                  className="text-center text-sm text-muted-foreground"
                >
                  –
                </span>
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
          <div className="flex items-center gap-1">
            <button
              aria-label={
                row.closed ? `Reopen ${row.day}` : `Mark ${row.day} closed`
              }
              className={cn(
                "grid size-11 place-items-center rounded-full text-zinc-600 hover:bg-black/5 hover:text-foreground",
                row.closed
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "",
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
              <svg
                aria-hidden="true"
                className="size-[18px]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="m7.5 7.5 9 9" />
              </svg>
            </button>
            <button
              aria-label={`Copy ${row.day} opening hours to following days`}
              className="grid size-11 place-items-center rounded-full text-zinc-600 hover:bg-black/5 hover:text-foreground"
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
              <svg
                aria-hidden="true"
                className="size-[18px]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
                viewBox="0 0 24 24"
              >
                <rect height="10" rx="1.5" width="10" x="9" y="9" />
                <rect height="10" rx="1.5" width="10" x="5" y="5" />
              </svg>
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
    <select
      aria-label={`${day} ${label}`}
      className="h-11 w-full min-w-[6.5rem] appearance-none rounded-lg border-0 bg-secondary bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')] bg-[length:12px] bg-[position:right_10px_center] bg-no-repeat pr-7 pl-3 text-sm tracking-tight"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {times.map((time) => (
        <option key={time} value={time}>
          {timeLabel(time)}
        </option>
      ))}
    </select>
  );
}
