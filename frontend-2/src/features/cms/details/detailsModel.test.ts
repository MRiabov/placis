import { describe, expect, it } from "vitest";

import type { CmsBusinessProfile } from "../api/cms";
import {
  emptyForm,
  formToPatch,
  openingHourDayLabel,
  profileToForm,
} from "./detailsModel";

function profileFixture(overrides: Partial<CmsBusinessProfile> = {}): CmsBusinessProfile {
  return {
    business_location: "Unit 4, Waterford Business Park",
    business_name: "Bellfield Construction",
    company_number: "123456",
    description: "Extensions and refurbishment across Waterford.",
    email: "hello@bellfield.example",
    established_year: 2016,
    featured_services: ["Extensions", "Renovations", "New builds"],
    id: "profile-bellfield",
    legal_name: "Bellfield Construction Ltd",
    logo_asset_id: "asset-logo",
    logo_url: "https://cdn.example/logo.png",
    opening_hours: [
      {
        closes_at: "17:30",
        day: "monday",
        is_closed: false,
        note: null,
        opens_at: "08:00",
      },
      {
        closes_at: null,
        day: "saturday",
        is_closed: false,
        note: "Surveys by appointment",
        opens_at: null,
      },
      {
        closes_at: null,
        day: "sunday",
        is_closed: true,
        note: null,
        opens_at: null,
      },
    ],
    phone: "+353 87 998 2864",
    registered_office: "Unit 4, Waterford Business Park",
    service_area: ["Waterford", "Kilkenny"],
    tenant_id: "tenant-bellfield",
    trade: "Construction",
    updated_at: "2026-07-05T12:00:00Z",
    vat_number: null,
    website_url: "https://bellfield.example",
    ...overrides,
  };
}

describe("profileToForm", () => {
  it("maps every profile field onto the form state", () => {
    const form = profileToForm(profileFixture());

    expect(form.businessName).toBe("Bellfield Construction");
    expect(form.legalName).toBe("Bellfield Construction Ltd");
    expect(form.trade).toBe("Construction");
    expect(form.establishedYear).toBe("2016");
    expect(form.phone).toBe("+353 87 998 2864");
    expect(form.email).toBe("hello@bellfield.example");
    expect(form.websiteUrl).toBe("https://bellfield.example");
    expect(form.address).toBe("Unit 4, Waterford Business Park");
    expect(form.companyNumber).toBe("123456");
    expect(form.vatNumber).toBe("");
    expect(form.registeredOffice).toBe("Unit 4, Waterford Business Park");
    expect(form.services).toBe("Extensions\nRenovations\nNew builds");
    expect(form.serviceArea).toBe("Waterford\nKilkenny");
    expect(form.logoAssetId).toBe("asset-logo");
    expect(form.logoPreviewUrl).toBe("https://cdn.example/logo.png");
    expect(form.logoAssetTouched).toBe(false);
  });

  it("maps opening hours onto all seven days", () => {
    const form = profileToForm(profileFixture());

    expect(form.openingHours).toHaveLength(7);
    const monday = form.openingHours.find((row) => row.day === "monday");
    expect(monday).toMatchObject({
      closesAt: "17:30",
      isClosed: false,
      opensAt: "08:00",
    });
    const saturday = form.openingHours.find((row) => row.day === "saturday");
    expect(saturday).toMatchObject({
      closesAt: "",
      isClosed: false,
      note: "Surveys by appointment",
      opensAt: "",
    });
    const sunday = form.openingHours.find((row) => row.day === "sunday");
    expect(sunday).toMatchObject({ isClosed: true });
  });

  it("falls back to empty strings for missing optional fields", () => {
    const profile = profileFixture({
      established_year: null,
      logo_asset_id: null,
      logo_url: null,
      vat_number: null,
    });
    delete profile.opening_hours;
    delete profile.service_area;
    const form = profileToForm(profile);

    expect(form.establishedYear).toBe("");
    expect(form.logoAssetId).toBe("");
    expect(form.logoPreviewUrl).toBe("");
    expect(form.openingHours.every((row) => !row.isClosed)).toBe(true);
    expect(form.serviceArea).toBe("");
    expect(form.vatNumber).toBe("");
  });
});

describe("formToPatch", () => {
  it("produces a patch that round-trips through profileToForm", () => {
    const form = profileToForm(profileFixture());
    const patch = formToPatch(form);

    expect(patch.business_name).toBe("Bellfield Construction");
    expect(patch.established_year).toBe(2016);
    expect(patch.featured_services).toEqual([
      "Extensions",
      "Renovations",
      "New builds",
    ]);
    expect(patch.service_area).toEqual(["Waterford", "Kilkenny"]);
    expect(patch.logo_asset_id).toBe("asset-logo");
    expect(patch.opening_hours).toEqual([
      {
        closes_at: "17:30",
        day: "monday",
        is_closed: false,
        note: null,
        opens_at: "08:00",
      },
      {
        closes_at: null,
        day: "saturday",
        is_closed: false,
        note: "Surveys by appointment",
        opens_at: null,
      },
      {
        closes_at: null,
        day: "sunday",
        is_closed: true,
        note: null,
        opens_at: null,
      },
    ]);
  });

  it("splits and dedupes line and comma separated lists", () => {
    const form = emptyForm();
    form.services = " Extensions,\nRenovations\nExtensions\nNew builds , ";
    form.serviceArea = "Waterford, Waterford\nKilkenny";

    const patch = formToPatch(form);

    expect(patch.featured_services).toEqual(["Extensions", "Renovations", "New builds"]);
    expect(patch.service_area).toEqual(["Waterford", "Kilkenny"]);
  });

  it("normalises optional text to null when blank", () => {
    const form = emptyForm();
    form.businessName = "  Bellfield  ";

    const patch = formToPatch(form);

    expect(patch.business_name).toBe("Bellfield");
    expect(patch.phone).toBeNull();
    expect(patch.email).toBeNull();
    expect(patch.website_url).toBeNull();
    expect(patch.vat_number).toBeNull();
  });

  it("parses the established year as a number and rejects garbage", () => {
    const valid = emptyForm();
    valid.establishedYear = "2016";
    expect(formToPatch(valid).established_year).toBe(2016);

    const blank = emptyForm();
    expect(formToPatch(blank).established_year).toBeNull();

    const invalid = emptyForm();
    invalid.establishedYear = "ninety";
    expect(() => formToPatch(invalid)).toThrow("Established year must be a number");
  });

  it("drops empty opening-hour rows and requires both times on partial rows", () => {
    const form = emptyForm();
    form.openingHours = form.openingHours.map((row, index) =>
      index === 0 ? { ...row, opensAt: "08:00" } : row,
    );

    expect(() => formToPatch(form)).toThrow("Monday needs both opening and closing times");

    form.openingHours = form.openingHours.map((row, index) => {
      if (index === 0) {
        return { ...row, closesAt: "17:00" };
      }
      if (index === 2) {
        return { ...row, isClosed: true, note: "Bank holidays" };
      }
      if (index === 3) {
        return { ...row, note: "By appointment" };
      }
      return row;
    });

    const patch = formToPatch(form);
    expect(patch.opening_hours).toEqual([
      {
        closes_at: "17:00",
        day: "monday",
        is_closed: false,
        note: null,
        opens_at: "08:00",
      },
      {
        closes_at: null,
        day: "wednesday",
        is_closed: true,
        note: "Bank holidays",
        opens_at: null,
      },
      {
        closes_at: null,
        day: "thursday",
        is_closed: false,
        note: "By appointment",
        opens_at: null,
      },
    ]);
  });

  it("only sends the logo when the user touched it or selected an asset", () => {
    const untouched = emptyForm();
    expect(formToPatch(untouched)).not.toHaveProperty("logo_asset_id");

    const touched = emptyForm();
    touched.logoAssetTouched = true;
    expect(formToPatch(touched).logo_asset_id).toBeNull();

    const selected = emptyForm();
    selected.logoAssetTouched = true;
    selected.logoAssetId = "asset-logo";
    expect(formToPatch(selected).logo_asset_id).toBe("asset-logo");
  });
});

describe("openingHourDayLabel", () => {
  it("capitalises the first letter of each day", () => {
    expect(openingHourDayLabel("monday")).toBe("Monday");
    expect(openingHourDayLabel("saturday")).toBe("Saturday");
    expect(openingHourDayLabel("sunday")).toBe("Sunday");
  });
});
