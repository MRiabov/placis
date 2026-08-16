import { CheckCircle2, Image as ImageIcon, Pencil, Star } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { CompanyRegistryCandidate } from "../api/setup";
import { PlatformIcon } from "@/shared/ui/platformIcons";
import type { SetupProfileChecklistRow } from "../voice/types";
import { pick } from "../voice/valueParsers";

type JsonRecord = Record<string, unknown>;

type PhotoItem = {
  imageUrl?: string;
  label?: string;
  reference?: string;
  sourceUrl?: string;
};

type ReviewItem = {
  author?: string;
  quote: string;
  rating?: number;
};

type CompanySummaryProps = {
  company: CompanyRegistryCandidate;
};

export function CompanySummary({ company }: CompanySummaryProps): ReactNode {
  return (
    <section className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <p className="font-medium text-xs text-zinc-500">Selected company</p>
      <p className="mt-1 font-semibold text-base leading-6 text-zinc-950">
        {company.legal_name}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <SummaryBadge value={company.company_number} />
        <SummaryBadge value={company.status} />
      </div>
    </section>
  );
}

function SummaryBadge({
  value,
}: {
  value: string | null | undefined;
}): ReactNode {
  const badgeValue = value ?? null;
  if (!badgeValue?.trim()) {
    return null;
  }
  return (
    <span className="inline-flex min-h-7 items-center rounded-md bg-white px-2.5 font-medium text-zinc-700 text-xs">
      {badgeValue}
    </span>
  );
}

type FactTileProps = { row: SetupProfileChecklistRow };

export function FactTile({ row }: FactTileProps): ReactNode {
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-zinc-200 bg-white px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-sm leading-5">
          <p className="font-semibold text-zinc-950">{row.label}</p>
          <div className="mt-1 min-w-0 text-zinc-600">{factBody(row)}</div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 font-medium text-[11px] leading-none ${statusColor(row)}`}
        >
          {row.status === "filled_by_source" ||
          row.status === "filled_by_user" ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <Pencil className="size-3" />
          )}
          {statusLabel(row)}
        </span>
      </div>
    </div>
  );
}

function factBody(row: SetupProfileChecklistRow): ReactNode {
  if (row.id === "contact.google_profile") {
    return (
      <ProfileValue
        fallbackName="Google Business Profile"
        platform="google"
        row={row}
        urlKeys={["url", "google_maps_url", "source_url"]}
      />
    );
  }
  if (row.id === "contact.facebook_profile") {
    return (
      <ProfileValue
        fallbackName="Facebook business profile"
        platform="facebook"
        row={row}
        urlKeys={["url", "facebook_url", "source_url"]}
      />
    );
  }
  if (row.id === "trust.reviews") {
    return <ReviewValue row={row} />;
  }
  if (row.id === "assets.photos") {
    return <PhotoValue row={row} />;
  }
  return (
    <span className="block min-w-0 break-words">
      {displayValue(row) ?? actionLabel(row)}
    </span>
  );
}

type ProfileValueProps = {
  fallbackName: string;
  platform: "facebook" | "google";
  row: SetupProfileChecklistRow;
  urlKeys: string[];
};

function ProfileValue({
  fallbackName,
  platform,
  row,
  urlKeys,
}: ProfileValueProps): ReactNode {
  const valueRecord = asRecord(row.value);
  const rowDisplayValue = displayValue(row);
  const url =
    firstStringFromRecord(valueRecord, urlKeys) ?? firstUrl(rowDisplayValue);
  const rawName =
    firstStringFromRecord(valueRecord, [
      "display_value",
      "name",
      "title",
      "label",
      "page_name",
    ]) ?? rowDisplayValue;
  const name = rawName && !looksLikeUrl(rawName) ? rawName : fallbackName;

  const content = (
    <>
      <PlatformIcon platform={platform} />
      <span className="min-w-0 truncate font-medium text-zinc-800">{name}</span>
    </>
  );

  return url ? (
    <a
      aria-label={`Open ${name}`}
      className="inline-flex max-w-full items-center gap-2 rounded-md text-zinc-800 underline-offset-4 transition hover:text-zinc-950 hover:underline focus:outline-none focus:ring-4 focus:ring-zinc-950/10"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  ) : (
    <span className="inline-flex max-w-full items-center gap-2">{content}</span>
  );
}

type RowProps = { row: SetupProfileChecklistRow };

function ReviewValue({ row }: RowProps): ReactNode {
  const reviews = reviewItems(row.value).slice(0, 3);
  const aggregate = asRecord(row.value);
  const rating =
    firstNumberFromRecord(aggregate, ["rating", "aggregate_rating", "score"]) ??
    firstNumberFromRecord(aggregate, ["totalScore"]);
  const count = firstNumberFromRecord(aggregate, [
    "count",
    "reviews_count",
    "review_count",
    "sample_count",
  ]);
  const aggregateLabel = reviewAggregateLabel({ count, rating });

  if (!reviews.length) {
    return (
      <span className="block min-w-0 break-words">
        {aggregateLabel ?? displayValue(row) ?? actionLabel(row)}
      </span>
    );
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      {aggregateLabel ? (
        <p className="text-xs font-medium text-zinc-500">{aggregateLabel}</p>
      ) : null}
      <div className="grid gap-1.5 sm:grid-cols-3">
        {reviews.map((review) => (
          <div
            className="min-w-0 rounded-md bg-zinc-50 px-2 py-1.5"
            key={`${review.quote}-${review.author ?? ""}-${review.rating ?? ""}`}
          >
            <div className="flex items-center gap-1 text-amber-600">
              {review.rating ? (
                <>
                  <Star className="size-3 fill-current" />
                  <span className="font-semibold text-[11px]">
                    {review.rating}
                  </span>
                </>
              ) : null}
              {review.author ? (
                <span className="min-w-0 truncate text-[11px] text-zinc-500">
                  {review.author}
                </span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-700">
              {review.quote}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoValue({ row }: RowProps): ReactNode {
  const photos = photoItems(row.value, displayValue(row)).slice(0, 4);
  const imagePhotos = photos.filter((photo) => photo.imageUrl);
  const pendingPhotos = photos.filter((photo) => !photo.imageUrl);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const visibleImagePhotos = imagePhotos.filter(
    (photo) => photo.imageUrl && !failedImageUrls.has(photo.imageUrl),
  );

  if (!photos.length) {
    return (
      <span className="block min-w-0 break-words">
        {displayValue(row) ?? actionLabel(row)}
      </span>
    );
  }

  return (
    <div className="min-w-0">
      {visibleImagePhotos.length ? (
        <div className="flex min-w-0 gap-2 overflow-hidden">
          {visibleImagePhotos.map((photo) => (
            <a
              className="group relative size-14 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
              href={photo.sourceUrl ?? photo.imageUrl}
              key={photo.imageUrl ?? photo.sourceUrl ?? photo.reference ?? "photo"}
              rel="noreferrer"
              target="_blank"
            >
              <img
                alt={photo.label ?? "Source photo"}
                className="size-full object-cover transition group-hover:scale-105"
                loading="lazy"
                onError={() => {
                  if (photo.imageUrl) {
                    setFailedImageUrls((current) => {
                      const next = new Set(current);
                      next.add(photo.imageUrl as string);
                      return next;
                    });
                  }
                }}
                src={photo.imageUrl}
              />
            </a>
          ))}
        </div>
      ) : null}
      <p className="mt-1 inline-flex min-w-0 items-center gap-1 text-xs text-zinc-500">
        <ImageIcon className="size-3 shrink-0" />
        <span className="truncate">
          {visibleImagePhotos.length
            ? `${visibleImagePhotos.length} source photo${visibleImagePhotos.length === 1 ? "" : "s"}`
            : "Source photos found; previews pending"}
          {visibleImagePhotos.length && pendingPhotos.length
            ? `; ${pendingPhotos.length} pending`
            : ""}
        </span>
      </p>
    </div>
  );
}

function displayValue(row: SetupProfileChecklistRow): string | null {
  if (isSyntheticConfirmationDisplay(row)) {
    return null;
  }
  return row.display_value ?? null;
}

function isSyntheticConfirmationDisplay(
  row: SetupProfileChecklistRow,
): boolean {
  return (
    row.status === "needs_confirmation" &&
    row.display_value === "Needs confirmation" &&
    row.value?.kind === "null"
  );
}

function statusColor(row: SetupProfileChecklistRow): string {
  if (row.status === "filled_by_source" || row.status === "filled_by_user") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (row.status === "needs_confirmation" || row.status === "in_progress") {
    return "bg-amber-50 text-amber-700";
  }
  if (row.status === "conflict") {
    return "bg-red-50 text-red-700";
  }
  return "bg-zinc-100 text-zinc-600";
}

const statusLabels: Record<SetupProfileChecklistRow["status"], string> = {
  conflict: "Conflict",
  empty: "Ask",
  filled_by_source: "Found",
  filled_by_user: "Given",
  confirmed: "Confirmed",
  in_progress: "Working",
  needs_confirmation: "Confirm",
  not_applicable: "N/A",
  skipped: "Skipped",
};

function statusLabel(row: SetupProfileChecklistRow): string {
  return statusLabels[row.status];
}

const actionLabels: Record<SetupProfileChecklistRow["next_action"], string> = {
  ask_user: "Ask during the interview",
  confirm: "Confirm during the interview",
  generate_preview: "Generate website preview",
  none: "No value yet",
  run_lookup: "Lookup can help",
  skip: "Can be skipped",
  upload_asset: "Upload or source assets",
};

function actionLabel(row: SetupProfileChecklistRow): string {
  return actionLabels[row.next_action];
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function firstArrayFromRecord(
  factRecord: JsonRecord | null,
  keys: string[],
): unknown[] {
  if (!factRecord) {
    return [];
  }
  for (const key of keys) {
    const value = factRecord[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function firstStringFromRecord(
  factRecord: JsonRecord | null,
  keys: string[],
): string | null {
  if (!factRecord) {
    return null;
  }
  for (const key of keys) {
    const value = factRecord[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function firstNumberFromRecord(
  factRecord: JsonRecord | null,
  keys: string[],
): number | null {
  if (!factRecord) {
    return null;
  }
  for (const key of keys) {
    const value = factRecord[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function firstUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.match(/https?:\/\/[^\s,]+/i)?.[0]?.replace(/[).]+$/, "") ?? null;
}

function urlsFromText(value?: string | null): string[] {
  if (!value) {
    return [];
  }
  return [...value.matchAll(/https?:\/\/[^\s,]+/gi)]
    .map((match) => match[0].replace(/[).]+$/, ""))
    .filter((url) => url.length > 0);
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function reviewItems(value: unknown): ReviewItem[] {
  const source = asRecord(value);
  const rawItems = Array.isArray(value)
    ? value
    : firstArrayFromRecord(source, ["samples", "reviews"]);

  return rawItems
    .map((entry): ReviewItem | null => {
      if (typeof entry === "string") {
        return { quote: entry };
      }
      const entryRecord = asRecord(entry);
      if (!entryRecord) {
        return null;
      }
      const quote =
        firstStringFromRecord(entryRecord, ["quote", "review", "review_text"]) ??
        nestedText(pick(entryRecord, "text"));
      if (!quote) {
        return null;
      }
      const author = firstStringFromRecord(entryRecord, [
        "author",
        "author_name",
        "reviewer",
        "name",
      ]);
      const rating = firstNumberFromRecord(entryRecord, [
        "rating",
        "stars",
        "score",
      ]);
      return {
        ...(author ? { author } : {}),
        quote,
        ...(rating != null ? { rating } : {}),
      };
    })
    .filter((entry): entry is ReviewItem => Boolean(entry));
}

function nestedText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return firstStringFromRecord(asRecord(value), ["text", "value"]);
}

function reviewAggregateLabel({
  count,
  rating,
}: {
  count: number | null;
  rating: number | null;
}): string | null {
  if (count !== null && rating !== null) {
    return `${rating.toFixed(1).replace(/\.0$/, "")} rating from ${count} review${count === 1 ? "" : "s"}`;
  }
  if (count !== null) {
    return `${count} review${count === 1 ? "" : "s"}`;
  }
  if (rating !== null) {
    return `${rating.toFixed(1).replace(/\.0$/, "")} rating`;
  }
  return null;
}

function photoItems(
  value: unknown,
  displayValue: string | null,
): PhotoItem[] {
  const rawItems = Array.isArray(value) ? value : urlsFromText(displayValue);
  return rawItems
    .map((entry): PhotoItem | null => {
      if (typeof entry === "string") {
        return isDisplayableImageUrl(entry)
          ? { imageUrl: entry }
          : { sourceUrl: entry };
      }
      return photoItemFromRecord(entry);
    })
    .filter((entry): entry is PhotoItem => Boolean(entry));
}

function photoItemFromRecord(entry: unknown): PhotoItem | null {
  const entryRecord = asRecord(entry);
  if (!entryRecord) {
    return null;
  }
  const url = firstStringFromRecord(entryRecord, [
    "url",
    "image_url",
    "imageUrl",
    "src",
    "source_url",
  ]);
  const reference = firstStringFromRecord(entryRecord, [
    "photo_reference",
    "name",
  ]);
  const label = firstStringFromRecord(entryRecord, [
    "alt",
    "label",
    "source",
    "title",
  ]);
  const displayableUrl = url && isDisplayableImageUrl(url) ? url : null;
  const sourceUrl = url && !displayableUrl ? url : null;
  return {
    ...(displayableUrl ? { imageUrl: displayableUrl } : {}),
    ...(label ? { label } : {}),
    ...(reference ? { reference } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

function isDisplayableImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    if (
      host.includes("googleusercontent.com") ||
      host.includes("fbcdn.net") ||
      host.includes("scontent.")
    ) {
      return true;
    }
    return /\.(avif|gif|jpe?g|png|webp)$/i.test(path);
  } catch {
    return false;
  }
}
