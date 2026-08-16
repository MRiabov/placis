import { Ban, Copy, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  openingHourDaySchema,
  type openingHourRowSchema,
} from "./textInterviewSchema";
import type { z } from "zod";

export type OpeningHourRow = z.infer<typeof openingHourRowSchema>;
export type OpeningHourDay = (typeof openingHourDays)[number];

const openingHourDays = openingHourDaySchema.options;

export function defaultOpeningHours(): OpeningHourRow[] {
  return openingHourDays.map((day) => ({
    day,
    intervals: [defaultInterval(day)],
    isClosed: false,
  }));
}

function defaultInterval(day: OpeningHourDay) {
  return {
    endsAt: "21:00",
    id: `${day}-0`,
    startsAt: "06:30",
  };
}

export function openingHourDayLabel(day: OpeningHourDay): string {
  return `${day.slice(0, 1).toUpperCase()}${day.slice(1)}`;
}

function openingHourShortDayLabel(day: OpeningHourDay): string {
  return openingHourDayLabel(day).slice(0, 3);
}

export function formatTimeLabel(value: string): string {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  const minute = rawMinute ?? "00";
  if (!Number.isFinite(hour)) {
    return value;
  }
  const suffix = hour >= 12 ? "pm" : "am";
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${minute}${suffix}`;
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

export type AvailabilityPickerProps = {
  busy: boolean;
  onChange: (rows: OpeningHourRow[]) => void;
  rows: OpeningHourRow[];
};

export function AvailabilityPicker({
  busy,
  onChange,
  rows,
}: AvailabilityPickerProps): ReactNode {
  function updateRow(day: OpeningHourDay, patch: Partial<OpeningHourRow>) {
    onChange(
      rows.map((row) => (row.day === day ? { ...row, ...patch } : row)),
    );
  }

  function updateInterval(
    day: OpeningHourDay,
    intervalId: string,
    patch: { endsAt?: string; startsAt?: string },
  ) {
    onChange(
      rows.map((row) =>
        row.day === day
          ? {
              ...row,
              intervals: row.intervals.map((interval) =>
                interval.id === intervalId ? { ...interval, ...patch } : interval,
              ),
            }
          : row,
      ),
    );
  }

  function addInterval(day: OpeningHourDay) {
    const row = rows.find((entry) => entry.day === day);
    if (!row) {
      return;
    }
    updateRow(day, {
      intervals: [
        ...row.intervals,
        {
          endsAt: "17:00",
          id: `${day}-${row.intervals.length + 1}`,
          startsAt: "13:00",
        },
      ],
      isClosed: false,
    });
  }

  function removeInterval(day: OpeningHourDay, intervalId: string) {
    const row = rows.find((entry) => entry.day === day);
    if (!row) {
      return;
    }
    const nextIntervals = row.intervals.filter(
      (interval) => interval.id !== intervalId,
    );
    updateRow(day, {
      intervals: nextIntervals.length ? nextIntervals : [defaultInterval(day)],
    });
  }

  function toggleClosed(day: OpeningHourDay) {
    const row = rows.find((entry) => entry.day === day);
    if (!row) {
      return;
    }
    updateRow(day, {
      intervals: row.intervals.length ? row.intervals : [defaultInterval(day)],
      isClosed: !row.isClosed,
    });
  }

  function copyToFollowingDays(day: OpeningHourDay) {
    const sourceIndex = rows.findIndex((row) => row.day === day);
    const source = rows[sourceIndex];
    if (!source) {
      return;
    }
    onChange(
      rows.map((row, index) =>
        index <= sourceIndex
          ? row
          : {
              ...row,
              intervals: source.intervals.map((interval, intervalIndex) => ({
                ...interval,
                id: `${row.day}-${intervalIndex}`,
              })),
              isClosed: source.isClosed,
            },
      ),
    );
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-semibold">General availability</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Set regular appointment times for the website draft.
        </p>
      </div>

      <div className="grid gap-1.5 rounded-lg bg-muted p-2">
        {rows.map((row) => (
          <OpeningDayRow
            busy={busy}
            key={row.day}
            onAddInterval={addInterval}
            onCopyFollowing={copyToFollowingDays}
            onRemoveInterval={removeInterval}
            onToggleClosed={toggleClosed}
            onUpdateInterval={updateInterval}
            row={row}
          />
        ))}
      </div>
    </div>
  );
}

function OpeningDayRow({
  busy,
  onAddInterval,
  onCopyFollowing,
  onRemoveInterval,
  onToggleClosed,
  onUpdateInterval,
  row,
}: {
  busy: boolean;
  onAddInterval: (day: OpeningHourDay) => void;
  onCopyFollowing: (day: OpeningHourDay) => void;
  onRemoveInterval: (day: OpeningHourDay, intervalId: string) => void;
  onToggleClosed: (day: OpeningHourDay) => void;
  onUpdateInterval: (
    day: OpeningHourDay,
    intervalId: string,
    patch: { endsAt?: string; startsAt?: string },
  ) => void;
  row: OpeningHourRow;
}) {
  return (
    <div className="grid gap-2 rounded-md px-1 py-1.5 sm:grid-cols-[42px_minmax(0,1fr)_104px] sm:items-start">
      <div className="pt-2 text-sm font-medium text-foreground">
        {openingHourShortDayLabel(row.day)}
      </div>
      <div className="grid gap-1.5">
        {row.intervals.map((interval, index) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-2"
            key={interval.id}
          >
            <TimeSelect
              ariaLabel={`${openingHourDayLabel(row.day)} start time`}
              busy={busy}
              disabled={row.isClosed}
              onChange={(startsAt) =>
                onUpdateInterval(row.day, interval.id, { startsAt })
              }
              value={interval.startsAt}
            />
            <span className="text-center text-muted-foreground">-</span>
            <TimeSelect
              ariaLabel={`${openingHourDayLabel(row.day)} end time`}
              busy={busy}
              disabled={row.isClosed}
              onChange={(endsAt) =>
                onUpdateInterval(row.day, interval.id, { endsAt })
              }
              value={interval.endsAt}
            />
            {index > 0 ? (
              <button
                aria-label={`Remove ${openingHourDayLabel(row.day)} time block`}
                className="col-span-3 inline-flex h-8 w-fit items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:text-muted sm:hidden"
                disabled={busy}
                onClick={() => onRemoveInterval(row.day, interval.id)}
                type="button"
              >
                <Trash2 className="size-3.5" />
                Remove block
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 sm:justify-end sm:pt-1">
        <IconButton
          disabled={busy}
          label={
            row.isClosed
              ? `Reopen ${openingHourDayLabel(row.day)}`
              : `Mark ${openingHourDayLabel(row.day)} unavailable`
          }
          onClick={() => onToggleClosed(row.day)}
        >
          <Ban className="size-4" />
        </IconButton>
        <IconButton
          disabled={busy || row.isClosed}
          label={`Add ${openingHourDayLabel(row.day)} time block`}
          onClick={() => onAddInterval(row.day)}
        >
          <Plus className="size-4" />
        </IconButton>
        <IconButton
          disabled={busy}
          label={`Copy ${openingHourDayLabel(row.day)} availability to following days`}
          onClick={() => onCopyFollowing(row.day)}
        >
          <Copy className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

function TimeSelect({
  ariaLabel,
  busy,
  disabled,
  onChange,
  value,
}: {
  ariaLabel: string;
  busy: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-10 min-w-0 rounded-md border border-transparent bg-muted px-2 text-center text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/10 disabled:bg-muted disabled:text-muted-foreground"
      disabled={busy || disabled}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {timeOptions.map((time) => (
        <option key={time} value={time}>
          {formatTimeLabel(time)}
        </option>
      ))}
    </select>
  );
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:text-muted"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
