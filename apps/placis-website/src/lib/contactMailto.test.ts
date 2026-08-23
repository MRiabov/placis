import { describe, expect, it } from "vitest";

import {
  buildMailtoHref,
  contactValuesAreComplete,
  emailLooksValid,
} from "./contactMailto";

describe("buildMailtoHref", () => {
  it("encodes topic, name, and message", () => {
    const href = buildMailtoHref("help@placis.com", {
      company: "Acme",
      email: "jane@acme.ie",
      message: "Hello",
      name: "Jane",
      topic: "sales",
    });
    expect(href.startsWith("mailto:help@placis.com?")).toBe(true);
    expect(href).toContain(encodeURIComponent("[Placis Contact] Sales and partnerships"));
    expect(href).toContain(encodeURIComponent("Name: Jane"));
    expect(href).toContain(encodeURIComponent("Company: Acme"));
  });

  it("rejects incomplete values", () => {
    expect(
      contactValuesAreComplete({
        company: "",
        email: "",
        message: "",
        name: "",
        topic: "",
      }),
    ).toBe(false);
  });

  it("accepts a simple email", () => {
    expect(emailLooksValid("jane@acme.ie")).toBe(true);
    expect(emailLooksValid("not-an-email")).toBe(false);
  });
});
