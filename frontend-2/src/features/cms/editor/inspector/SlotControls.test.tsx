// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CmsSlot } from "../../api/cms";
import { SlotControl } from "./SlotControls";

afterEach(cleanup);

function listSlot(items: unknown[]): CmsSlot {
  return {
    key: "services",
    label: "Services",
    required: false,
    status: "draft",
    type: "list",
    value: { items },
  } as CmsSlot;
}

describe("SlotControl list editing", () => {
  it("edits object-shaped items field by field and preserves the shape", () => {
    const onChange = vi.fn();
    render(
      <SlotControl
        fieldId="slot-services"
        onChange={onChange}
        slot={listSlot([{ name: "Extensions", href: "/extensions" }])}
      />,
    );

    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "Extensions & Lofts" } });

    expect(onChange).toHaveBeenLastCalledWith({
      items: [{ href: "/extensions", name: "Extensions & Lofts" }],
    });
  });

  it("keeps numeric item fields numeric", () => {
    const onChange = vi.fn();
    render(
      <SlotControl
        fieldId="slot-reviews"
        onChange={onChange}
        slot={listSlot([{ author: "A. Bell", rating: 5 }])}
      />,
    );

    const ratingInput = screen.getByLabelText("Rating");
    fireEvent.change(ratingInput, { target: { value: "4" } });

    expect(onChange).toHaveBeenLastCalledWith({
      items: [{ author: "A. Bell", rating: 4 }],
    });
  });

  it("adds an empty object item to object-shaped lists", () => {
    const onChange = vi.fn();
    render(
      <SlotControl
        fieldId="slot-services"
        onChange={onChange}
        slot={listSlot([{ name: "Extensions" }])}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Services item" }));

    expect(onChange).toHaveBeenLastCalledWith({
      items: [{ name: "Extensions" }, {}],
    });
  });

  it("removes an item", () => {
    const onChange = vi.fn();
    render(
      <SlotControl
        fieldId="slot-services"
        onChange={onChange}
        slot={listSlot([{ name: "Extensions" }, { name: "Roofing" }])}
      />,
    );

    const removeButtons = screen.getAllByRole("button", {
      name: "Remove item",
    });
    fireEvent.click(removeButtons[1] as HTMLElement);

    expect(onChange).toHaveBeenLastCalledWith({ items: [{ name: "Extensions" }] });
  });

  it("edits string-shaped list items as plain text", () => {
    const onChange = vi.fn();
    render(
      <SlotControl
        fieldId="slot-tags"
        onChange={onChange}
        slot={listSlot(["roofing", "extensions"])}
      />,
    );

    const firstEntry = screen.getByLabelText("Services entry 1");
    fireEvent.change(firstEntry, { target: { value: "renovations" } });

    expect(onChange).toHaveBeenLastCalledWith({
      items: ["renovations", "extensions"],
    });
  });
});
