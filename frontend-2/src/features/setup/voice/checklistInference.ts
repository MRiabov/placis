import type { SetupChecklistRow } from "../api/setup";
import type { SetupVoiceAgentEventCreate } from "./types";

export function hasAnswerValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

export type InferredVoiceChecklistFact = {
  confidence: Extract<
    SetupVoiceAgentEventCreate,
    { event_type: "obtained_information" }
  >["confidence"];
  needsConfirmation: boolean;
  row: SetupChecklistRow;
  value: string | string[];
};

const spokenTradePatterns: Array<[RegExp, string]> = [
  [
    /\b(roofer|roofers|roofing contractor|roofing contractors|roofing)\b/i,
    "Roofer",
  ],
  [
    /\b(builder|builders|building contractor|building contractors)\b/i,
    "Builder",
  ],
  [
    /\b(electrician|electricians|electrical contractor|electrical contractors)\b/i,
    "Electrician",
  ],
  [
    /\b(plumber|plumbers|plumbing contractor|plumbing contractors)\b/i,
    "Plumber",
  ],
  [/\b(carpenter|carpenters|joiner|joiners)\b/i, "Carpenter"],
  [/\b(painter|painters|decorator|decorators)\b/i, "Painter and decorator"],
  [/\b(landscaper|landscapers|landscaping)\b/i, "Landscaper"],
  [/\b(plasterer|plasterers|plastering)\b/i, "Plasterer"],
  [/\b(tiler|tilers|tiling)\b/i, "Tiler"],
  [/\b(locksmith|locksmiths)\b/i, "Locksmith"],
  [/\b(glazier|glaziers|glazing)\b/i, "Glazier"],
  [/\b(cleaner|cleaners|cleaning company|cleaning contractor)\b/i, "Cleaner"],
  [/\b(pest control|pest controller|pest controllers)\b/i, "Pest control"],
  [
    /\b(heating engineer|heating engineers|hvac|gas engineer|gas engineers)\b/i,
    "Heating engineer",
  ],
];

export function inferVoiceChecklistFacts(
  text: string,
  rows: SetupChecklistRow[],
): InferredVoiceChecklistFact[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }
  const facts: InferredVoiceChecklistFact[] = [];
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const addFact = (
    fieldPath: string,
    value: string | string[],
    options: { confidence?: InferredVoiceChecklistFact["confidence"] } = {},
  ): void => {
    const row = rowById.get(fieldPath);
    if (!row || !hasAnswerValue(value)) {
      return;
    }
    if (facts.some((fact) => fact.row.id === row.id)) {
      return;
    }
    facts.push({
      confidence: options.confidence ?? "high",
      needsConfirmation: false,
      row,
      value,
    });
  };

  const trade = inferSpokenTrade(trimmed);
  if (trade) {
    addFact("services.primary_trade", trade);
  }

  const email = inferSpokenEmail(trimmed);
  if (email) {
    addFact("contact.email", email);
  }

  const phone = inferSpokenPhone(trimmed);
  if (phone) {
    addFact("contact.phone", phone);
  }

  const serviceArea = inferSpokenServiceArea(trimmed);
  if (serviceArea) {
    addFact("service_area.primary", serviceArea);
  }

  const services = inferSpokenListAnswer(trimmed, [
    "we do",
    "we mainly do",
    "our main services are",
    "services are",
    "specialise in",
    "specialize in",
  ]);
  if (services.length) {
    addFact("services.main_services", services);
  }

  const accreditations = inferSpokenListAnswer(trimmed, [
    "we are accredited by",
    "we are certified by",
    "we are registered with",
    "accreditations are",
    "certifications are",
  ]);
  if (accreditations.length) {
    addFact("trust.accreditations", accreditations);
  }

  return facts;
}

function inferSpokenTrade(text: string): string | null {
  for (const [pattern, trade] of spokenTradePatterns) {
    if (pattern.test(text)) {
      return trade;
    }
  }
  return null;
}

function inferSpokenEmail(text: string): string | null {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? null;
}

function inferSpokenPhone(text: string): string | null {
  const match = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
}

function inferSpokenServiceArea(text: string): string | null {
  const match = text.match(
    /\b(?:we cover|we serve|service area is|areas are|best areas are|based in)\s+([^.!?]+)/i,
  );
  return match?.[1]?.trim().replace(/\s+and\s+/gi, ", ") ?? null;
}

function inferSpokenListAnswer(text: string, prefixes: string[]): string[] {
  const normalized = text.trim();
  const prefixPattern = prefixes
    .map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const match = normalized.match(
    new RegExp(`\\b(?:${prefixPattern})\\s+([^.!?]+)`, "i"),
  );
  const value = match?.[1]?.trim();
  if (!value) {
    return [];
  }
  return value
    .split(/,|\band\b/i)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 8);
}


export type LookupType = Extract<
  SetupVoiceAgentEventCreate,
  { event_type: "request_lookup" }
>["lookup_type"];

export function lookupTypeForChecklistRow(
  row: SetupChecklistRow,
): LookupType {
  if (
    row.id === "business_identity.legal_name" ||
    row.id === "legal_disclosure.company_number" ||
    row.id === "legal_disclosure.registered_office"
  ) {
    return "company_registry_search";
  }
  if (row.id === "contact.google_profile") {
    return "google_profile_search";
  }
  if (row.id === "contact.facebook_profile") {
    return "facebook_profile_search";
  }
  if (row.id === "trust.founder_profile") {
    return "founder_profile_search";
  }
  if (row.id === "trust.accreditations") {
    return "accreditation_search";
  }
  return row.next_action === "run_lookup" ? "fast_preresearch" : "custom";
}

export function normalizeChecklistAnswer(
  row: SetupChecklistRow,
  answer: string,
): string | string[] {
  const trimmed = answer.trim();
  if (
    row.id === "services.main_services" ||
    row.id === "trust.accreditations" ||
    row.id === "assets.photos"
  ) {
    return trimmed
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return trimmed;
}
