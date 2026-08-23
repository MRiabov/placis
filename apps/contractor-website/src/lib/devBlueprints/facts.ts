import type { JsonObject } from "@placis/website-components";

import {
  arrayValue,
  clone,
  directImageForVariable,
  hasMeaningfulValue,
  imageUrlFromRecord,
  isJsonObject,
  jsonObject,
  profileServices,
  textFromValue,
  textItems,
  titleCase,
} from "./json";

export function publicationFactsFromEvalFixture(
  fixture: JsonObject,
): JsonObject {
  const research = jsonObject(fixture.business_research);
  const profile = {
    ...clone(jsonObject(research.extracted_fields)),
    ...clone(jsonObject(fixture.business_profile)),
  };
  for (const key of [
    "business_name",
    "trade",
    "service_area",
    "business_size",
  ]) {
    if (!hasMeaningfulValue(profile[key]) && hasMeaningfulValue(fixture[key])) {
      profile[key] = clone(fixture[key]);
    }
  }
  const photos = arrayValue(research.photos);
  if (photos.length > 0) {
    profile.photos = clone(photos);
    if (!hasMeaningfulValue(profile.images)) {
      profile.images = imageFactsFromResearchPhotos(photos);
    }
  }
  const googlePlace = jsonObject(research.google_place);
  const googleMappings: [string, string][] = [
    ["title", "business_name"],
    ["phone", "phone"],
    ["website", "website_url"],
    ["address", "address"],
    ["opening_hours", "opening_hours"],
    ["google_maps_url", "google_maps_url"],
    ["rating", "google_rating"],
    ["reviews_count", "google_reviews_count"],
  ];
  for (const [sourceKey, targetKey] of googleMappings) {
    if (
      !hasMeaningfulValue(profile[targetKey]) &&
      hasMeaningfulValue(googlePlace[sourceKey])
    ) {
      profile[targetKey] = clone(googlePlace[sourceKey]);
    }
  }
  const founder = jsonObject(profile.founder_profile || profile.owner_profile);
  if (hasMeaningfulValue(founder.name) && !isJsonObject(profile.people)) {
    profile.people = {
      founder: {
        name: founder.name,
        role:
          textFromValue(founder.role) ||
          textFromValue(founder.title) ||
          "Owner",
        ...(hasMeaningfulValue(founder.bio || founder.evidence)
          ? { bio: founder.bio || founder.evidence }
          : {}),
      },
    };
  }
  const images = isJsonObject(profile.images) ? clone(profile.images) : {};
  const services = serviceFactsFromProfile(profile);
  const projects = normalizeProjectFacts(
    isJsonObject(profile.projects)
      ? clone(profile.projects)
      : projectFactsFromProfile(profile),
  );
  const proof = isJsonObject(profile.proof)
    ? clone(profile.proof)
    : proofFactsFromProfile(profile);
  const businessName =
    textFromValue(profile.business_name) || textFromValue(fixture.id);
  const trade =
    textFromValue(profile.trade) ||
    textFromValue(fixture.trade) ||
    "contractor";
  const serviceArea = hasMeaningfulValue(profile.service_area)
    ? clone(profile.service_area)
    : textFromValue(fixture.geography);
  const serviceRegion = serviceRegionFromFacts(profile, fixture, serviceArea);
  const logoUrl = imageUrlFromRecord(images.logo);
  return {
    business_name: businessName,
    trade,
    description: profile.description,
    phone: profile.phone,
    email: profile.email,
    address: profile.address,
    website_url: profile.website_url,
    service_area: serviceArea,
    service_region: serviceRegion,
    opening_hours: profile.opening_hours,
    company_registration_number: profile.company_registration_number,
    vat_number: profile.vat_number,
    registered_office: profile.registered_office,
    google_maps_url: profile.google_maps_url,
    google_rating: profile.google_rating,
    google_reviews_count: profile.google_reviews_count,
    logo_url: logoUrl,
    images,
    people: isJsonObject(profile.people) ? clone(profile.people) : {},
    services,
    projects,
    proof,
    branding: isJsonObject(profile.branding)
      ? clone(profile.branding)
      : logoUrl
        ? {
            logo_url: logoUrl,
            source: "static_website_generation_eval.fixture_research",
          }
        : {},
  };
}

const COUNTRY_NAMES = new Set([
  "england",
  "ireland",
  "northern ireland",
  "scotland",
  "united kingdom",
  "uk",
  "wales",
]);

function serviceRegionFromFacts(
  profile: JsonObject,
  fixture: JsonObject,
  serviceArea: unknown,
): string {
  const explicit = firstText(
    profile.service_region,
    profile.short_region,
    profile.primary_region,
    profile.county,
    valueFromObject(profile.service_area, "region"),
    valueFromObject(profile.service_area, "county"),
    valueFromObject(profile.service_area, "primary_region"),
    valueFromObject(fixture.geography, "region"),
    valueFromObject(fixture.geography, "county"),
  );
  if (explicit) {
    return explicit;
  }

  const geographyRegion = regionFromCommaText(textFromValue(fixture.geography));
  if (geographyRegion) {
    return geographyRegion;
  }

  const addressRegion = regionFromCommaText(textFromValue(profile.address));
  if (addressRegion) {
    return addressRegion;
  }

  const areaItems = textItems(serviceArea);
  const itemRegion = firstText(...areaItems.map(regionFromCommaText));
  if (itemRegion) {
    return itemRegion;
  }

  return conciseAreaLabel(areaItems) || textFromValue(serviceArea);
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = textFromValue(value);
    if (text) {
      return text;
    }
  }
  return "";
}

function valueFromObject(value: unknown, key: string): unknown {
  return isJsonObject(value) ? value[key] : undefined;
}

function regionFromCommaText(value: string): string {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) {
    return "";
  }
  const candidates = parts.slice(1).filter((part) => !isCountryName(part));
  return candidates[0] ?? "";
}

function isCountryName(value: string): boolean {
  return COUNTRY_NAMES.has(value.toLowerCase());
}

function conciseAreaLabel(items: string[]): string {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  const first = items[0] ?? "";
  return first ? `${first} area` : "";
}

function imageFactsFromResearchPhotos(photos: unknown[]): JsonObject {
  const imageFacts: JsonObject = {};
  photos.forEach((rawPhoto, index) => {
    if (!isJsonObject(rawPhoto)) {
      return;
    }
    const url = imageUrlFromRecord(rawPhoto);
    if (!url) {
      return;
    }
    const canonicalName =
      textFromValue(rawPhoto.canonical_name) || `research_photo_${index + 1}`;
    const alt =
      textFromValue(rawPhoto.alt) ||
      textFromValue(rawPhoto.alt_text) ||
      textFromValue(rawPhoto.caption);
    const imageFact: JsonObject = {
      url,
      image_url: url,
      canonical_name: canonicalName,
      source: rawPhoto.source || "business_research",
      review_status:
        rawPhoto.review_status || rawPhoto.status || "source_verified",
      provenance: {
        source_url: rawPhoto.source_url,
        evidence: rawPhoto.evidence,
      },
    };
    if (alt) {
      imageFact.alt = alt;
      imageFact.alt_text = alt;
    }
    imageFacts[canonicalName] = imageFact;
    if (rawPhoto.asset_type === "logo" || canonicalName === "logo") {
      imageFacts.logo = imageFact;
    }
  });
  return imageFacts;
}

function serviceFactsFromProfile(profile: JsonObject): JsonObject {
  const records = profileServices(profile).map((service) => ({
    name: service,
    title: titleCase(service),
    description: `Planned, quoted and delivered ${service} for local customers.`,
    href: "#lead",
    image_url:
      directImageForVariable(profile, `${service}_service_image`) || "",
  }));
  const names = records.map((record) => record.name);
  return {
    featured: records,
    marquee: names,
    footer_links: names.map((name) => ({
      label: titleCase(name),
      href: "#lead",
    })),
    project_types: names.map((name) => ({
      label: titleCase(name),
      value: name,
    })),
  };
}

function projectFactsFromProfile(profile: JsonObject): JsonObject {
  const services = profileServices(profile);
  const areas = textItems(profile.service_area);
  const recent = services.slice(0, 4).map((service, index) => ({
    title: `${titleCase(service)} in ${areas[index % Math.max(areas.length, 1)] || "the local area"}`,
    location: areas[index % Math.max(areas.length, 1)] || "the local area",
    summary: `A representative ${service} project completed by the team.`,
    image_url:
      directImageForVariable(
        profile,
        `${service}_project_image_${index + 1}`,
      ) || "",
  }));
  return { recent };
}

function normalizeProjectFacts(projects: JsonObject): JsonObject {
  const normalized = clone(projects);
  for (const key of ["recent", "featured", "home_gallery", "projects_page"]) {
    if (Array.isArray(normalized[key])) {
      normalized[key] = normalizeProjectRecords(normalized[key]);
    }
  }
  const recent = arrayValue(normalized.recent);
  if (recent.length > 0) {
    if (!hasMeaningfulValue(normalized.featured)) {
      normalized.featured = normalizeProjectRecords(recent);
    }
    if (!hasMeaningfulValue(normalized.home_gallery)) {
      normalized.home_gallery = normalizeProjectRecords(recent);
    }
    if (!hasMeaningfulValue(normalized.projects_page)) {
      normalized.projects_page = normalizeProjectRecords(recent);
    }
  }
  return normalized;
}

function normalizeProjectRecords(records: unknown[]): JsonObject[] {
  return records.filter(isJsonObject).map((project) => {
    const normalized = clone(project);
    if (
      !hasMeaningfulValue(normalized.description) &&
      hasMeaningfulValue(project.summary)
    ) {
      normalized.description = project.summary;
    }
    if (
      !hasMeaningfulValue(normalized.image) &&
      hasMeaningfulValue(project.image_url)
    ) {
      normalized.image = project.image_url;
    }
    return normalized;
  });
}

function proofFactsFromProfile(profile: JsonObject): JsonObject {
  const proofPoints = textItems(profile.proof_points);
  return {
    accreditations: proofPoints.map((point) => ({
      name: point,
      image_url: "",
    })),
    hero_stats: [
      ...(textFromValue(profile.service_area)
        ? [
            {
              label: "Service area",
              value: textFromValue(profile.service_area),
            },
          ]
        : []),
      ...(profileServices(profile).length > 0
        ? [
            {
              label: "Core services",
              value: String(profileServices(profile).length),
            },
          ]
        : []),
    ],
  };
}
