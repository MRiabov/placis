import type {
  CmsBusinessProfile,
  CmsBusinessProfilePatch,
} from "../api/cms";

type OpeningHourPatch = NonNullable<
  CmsBusinessProfilePatch["opening_hours"]
>[number];

export type OpeningHourDay = NonNullable<
  CmsBusinessProfile["opening_hours"]
>[number]["day"];

export type OpeningHourFormRow = {
  closesAt: string;
  day: OpeningHourDay;
  isClosed: boolean;
  note: string;
  opensAt: string;
};

export type DetailsFormState = {
  address: string;
  businessName: string;
  companyNumber: string;
  description: string;
  email: string;
  establishedYear: string;
  legalName: string;
  logoAssetId: string;
  logoAssetTouched: boolean;
  logoPreviewUrl: string;
  openingHours: OpeningHourFormRow[];
  phone: string;
  registeredOffice: string;
  serviceArea: string;
  services: string;
  trade: string;
  vatNumber: string;
  websiteUrl: string;
};

const openingHourDays: OpeningHourDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
export const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

export function emptyForm(): DetailsFormState {
  return {
    address: "",
    businessName: "",
    companyNumber: "",
    description: "",
    email: "",
    establishedYear: "",
    legalName: "",
    logoAssetId: "",
    logoAssetTouched: false,
    logoPreviewUrl: "",
    openingHours: emptyOpeningHours(),
    phone: "",
    registeredOffice: "",
    serviceArea: "",
    services: "",
    trade: "",
    vatNumber: "",
    websiteUrl: "",
  };
}

export function profileToForm(profile: CmsBusinessProfile): DetailsFormState {
  return {
    address: profile.business_location ?? "",
    businessName: profile.business_name,
    companyNumber: profile.company_number ?? "",
    description: profile.description ?? "",
    email: profile.email ?? "",
    establishedYear:
      typeof profile.established_year === "number"
        ? String(profile.established_year)
        : "",
    legalName: profile.legal_name ?? "",
    logoAssetId: profile.logo_asset_id ?? "",
    logoAssetTouched: false,
    logoPreviewUrl: profile.logo_url ?? "",
    openingHours: profileOpeningHoursToForm(profile.opening_hours ?? []),
    phone: profile.phone ?? "",
    registeredOffice: profile.registered_office ?? "",
    serviceArea: (profile.service_area ?? []).join("\n"),
    services: (profile.featured_services ?? []).join("\n"),
    trade: profile.trade ?? "",
    vatNumber: profile.vat_number ?? "",
    websiteUrl: profile.website_url ?? "",
  };
}

export function formToPatch(form: DetailsFormState): CmsBusinessProfilePatch {
  const patch: CmsBusinessProfilePatch = {
    business_location: optionalText(form.address),
    business_name: form.businessName.trim(),
    company_number: optionalText(form.companyNumber),
    description: optionalText(form.description),
    email: optionalText(form.email),
    established_year: optionalYear(form.establishedYear),
    featured_services: lines(form.services),
    legal_name: optionalText(form.legalName),
    opening_hours: openingHoursToPatch(form.openingHours),
    phone: optionalText(form.phone),
    registered_office: optionalText(form.registeredOffice),
    service_area: lines(form.serviceArea),
    trade: optionalText(form.trade),
    vat_number: optionalText(form.vatNumber),
    website_url: optionalText(form.websiteUrl),
  };
  if (form.logoAssetTouched || form.logoAssetId) {
    patch.logo_asset_id = optionalText(form.logoAssetId);
  }
  return patch;
}

export function openingHourDayLabel(day: OpeningHourDay): string {
  return `${day.slice(0, 1).toUpperCase()}${day.slice(1)}`;
}

function lines(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  );
}

function optionalText(value: string) {
  const text = value.trim();
  return text || null;
}

function optionalYear(value: string) {
  const text = value.trim();
  if (!text) {
    return null;
  }
  const asNumber = Number.parseInt(text, 10);
  if (Number.isNaN(asNumber)) {
    throw new Error("Established year must be a number");
  }
  return asNumber;
}

function emptyOpeningHours(): OpeningHourFormRow[] {
  return openingHourDays.map((day) => ({
    closesAt: "",
    day,
    isClosed: false,
    note: "",
    opensAt: "",
  }));
}

function profileOpeningHoursToForm(
  openingHours: NonNullable<CmsBusinessProfile["opening_hours"]>,
): OpeningHourFormRow[] {
  const byDay = new Map(openingHours.map((entry) => [entry.day, entry]));
  return openingHourDays.map((day) => {
    const entry = byDay.get(day);
    return {
      closesAt: entry?.closes_at ?? "",
      day,
      isClosed: entry?.is_closed ?? false,
      note: entry?.note ?? "",
      opensAt: entry?.opens_at ?? "",
    };
  });
}

function openingHoursToPatch(
  rows: OpeningHourFormRow[],
): NonNullable<CmsBusinessProfilePatch["opening_hours"]> {
  const openingHours: OpeningHourPatch[] = [];
  for (const row of rows) {
    const note = optionalText(row.note);
    if (row.isClosed) {
      openingHours.push({
        closes_at: null,
        day: row.day,
        is_closed: true,
        note,
        opens_at: null,
      });
      continue;
    }
    const opensAt = optionalText(row.opensAt);
    const closesAt = optionalText(row.closesAt);
    if (!opensAt && !closesAt && !note) {
      continue;
    }
    if ((opensAt && !closesAt) || (!opensAt && closesAt)) {
      throw new Error(
        `${openingHourDayLabel(row.day)} needs both opening and closing times`,
      );
    }
    openingHours.push({
      closes_at: closesAt,
      day: row.day,
      is_closed: false,
      note,
      opens_at: opensAt,
    });
  }
  return openingHours;
}
