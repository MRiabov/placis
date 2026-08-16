import type { SetupTextInterviewAccreditationCreate } from "../api/setup";
import type { TextInterviewFormValues } from "./textInterviewSchema";

type CertificationCategory =
  | "business_registry"
  | "grant_registration"
  | "industry_membership"
  | "industry_register"
  | "insurance"
  | "manufacturer_certification"
  | "quality_scheme"
  | "trade_registration";

export type CertificationOption = {
  category: CertificationCategory;
  country: string;
  description: string;
  id: string;
  name: string;
  shortLabel: string;
};

const certificationOptions: CertificationOption[] = [
  {
    category: "business_registry",
    country: "IE",
    description: "Registered Irish company or business name record.",
    id: "ie_cro_core",
    name: "Companies Registration Office",
    shortLabel: "CRO registered",
  },
  {
    category: "trade_registration",
    country: "IE",
    description: "Registered Electrical Contractor listing for regulated electrical work.",
    id: "ie_safe_electric",
    name: "Safe Electric Registered Electrical Contractor",
    shortLabel: "Safe Electric",
  },
  {
    category: "trade_registration",
    country: "IE",
    description: "Registered Gas Installer listing for domestic gas work in Ireland.",
    id: "ie_rgi",
    name: "Registered Gas Installer",
    shortLabel: "RGI",
  },
  {
    category: "grant_registration",
    country: "IE",
    description: "SEAI contractor registration for relevant energy upgrade grants.",
    id: "ie_seai",
    name: "SEAI Registered Contractor",
    shortLabel: "SEAI",
  },
  {
    category: "industry_register",
    country: "IE",
    description: "Construction Industry Register Ireland listing.",
    id: "ie_ciri",
    name: "Construction Industry Register Ireland",
    shortLabel: "CIRI",
  },
  {
    category: "business_registry",
    country: "GB",
    description: "UK company registration record.",
    id: "gb_companies_house",
    name: "Companies House",
    shortLabel: "Companies House",
  },
  {
    category: "trade_registration",
    country: "GB",
    description: "Gas Safe registered engineer or business listing.",
    id: "gb_gas_safe",
    name: "Gas Safe Register",
    shortLabel: "Gas Safe",
  },
  {
    category: "trade_registration",
    country: "GB",
    description: "NICEIC certification listing for electrical contractors.",
    id: "gb_niceic",
    name: "NICEIC Certified Business",
    shortLabel: "NICEIC",
  },
  {
    category: "trade_registration",
    country: "GB",
    description: "MCS certification for low-carbon products and installers.",
    id: "gb_mcs",
    name: "Microgeneration Certification Scheme",
    shortLabel: "MCS",
  },
  {
    category: "quality_scheme",
    country: "GB",
    description: "TrustMark government-endorsed quality scheme registration.",
    id: "gb_trustmark",
    name: "TrustMark Registered Business",
    shortLabel: "TrustMark",
  },
  {
    category: "trade_registration",
    country: "GB",
    description: "NAPIT competent person scheme or installer registration.",
    id: "gb_napit",
    name: "NAPIT Registered Installer",
    shortLabel: "NAPIT",
  },
  {
    category: "industry_membership",
    country: "GB",
    description: "Federation of Master Builders member listing.",
    id: "gb_fmb",
    name: "Federation of Master Builders",
    shortLabel: "FMB",
  },
  {
    category: "business_registry",
    country: "US",
    description: "State, county, or city contractor registration.",
    id: "us_contractor_license",
    name: "Contractor license",
    shortLabel: "Contractor license",
  },
  {
    category: "insurance",
    country: "US",
    description: "General liability insurance or certificate of insurance.",
    id: "us_general_liability",
    name: "General liability insurance",
    shortLabel: "General liability",
  },
  {
    category: "insurance",
    country: "US",
    description: "Workers' compensation insurance where required.",
    id: "us_workers_comp",
    name: "Workers' compensation insurance",
    shortLabel: "Workers' comp",
  },
  {
    category: "quality_scheme",
    country: "US",
    description: "Better Business Bureau profile or accreditation.",
    id: "us_bbb",
    name: "Better Business Bureau",
    shortLabel: "BBB",
  },
  {
    category: "manufacturer_certification",
    country: "US",
    description: "Manufacturer, installer, or product-system certification.",
    id: "us_manufacturer_certified",
    name: "Manufacturer certification",
    shortLabel: "Manufacturer certified",
  },
];

export function certificationOptionsForCountry(
  country: string,
): CertificationOption[] {
  const options = certificationOptions.filter(
    (option) => option.country === country,
  );
  if (options.length) {
    return options;
  }
  return [
    {
      category: "insurance",
      country,
      description: "Public liability, general liability, or equivalent cover.",
      id: `${country.toLowerCase()}_liability_insurance`,
      name: "Liability insurance",
      shortLabel: "Liability insurance",
    },
    {
      category: "business_registry",
      country,
      description: "Local business registration, trade license, or company record.",
      id: `${country.toLowerCase()}_business_registration`,
      name: "Business registration",
      shortLabel: "Business registration",
    },
    {
      category: "trade_registration",
      country,
      description: "Trade body, competent-person scheme, or professional membership.",
      id: `${country.toLowerCase()}_trade_membership`,
      name: "Trade registration",
      shortLabel: "Trade registration",
    },
  ];
}

export function accreditationValues(
  formValues: TextInterviewFormValues,
  country: string,
): SetupTextInterviewAccreditationCreate[] {
  const options = new Map(
    certificationOptionsForCountry(country).map((option) => [option.id, option]),
  );
  const selected = formValues.selectedAccreditationIds
    .map((id) => options.get(id))
    .filter((option): option is CertificationOption => Boolean(option))
    .map((option) => ({
      category: option.category,
      certification_id: option.id,
      country: option.country,
      evidence_status: "contractor_selected",
      label: option.shortLabel,
      name: option.name,
      source: "certification_catalog",
    }));
  const other = lines(formValues.otherAccreditationText).map((label) => ({
    category: "other",
    country,
    evidence_status: "contractor_entered",
    label,
    name: label,
    source: "contractor_answer",
  }));
  return [...selected, ...other];
}

export function lines(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}
