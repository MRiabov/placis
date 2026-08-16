/**
 * Value parsers for the Realtime API wire payloads (schema-validated JSON).
 * Named per the naming audit: `asString`/`asNumber`/... replace the old
 * `stringValue`/`numberValue`/`record`/`array` helpers.
 */
export function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

/** Index-signature read that satisfies both TS4111 and biome useLiteralKeys. */
export function pick(
  value: Record<string, unknown> | null | undefined,
  key: string,
): unknown {
  return value?.[key];
}
