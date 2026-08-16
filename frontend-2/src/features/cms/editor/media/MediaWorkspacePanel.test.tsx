// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaWorkspacePanel } from "./MediaWorkspacePanel";

afterEach(cleanup);

function renderPanel() {
  const onUpload = vi.fn().mockResolvedValue({ id: "asset-1" });
  render(
    <MediaWorkspacePanel
      assets={[]}
      onCreateImageEdit={vi.fn()}
      onCreateMediaAsset={vi.fn()}
      onSelectAsset={vi.fn()}
      onUpdateMediaAsset={vi.fn()}
      onUploadMediaAsset={onUpload}
      selectedAssetId=""
    />,
  );
  return { onUpload };
}

describe("MediaWorkspacePanel file chooser", () => {
  it("uploads from the file input change", () => {
    const { onUpload } = renderPanel();
    const input = screen.getByLabelText("Image file") as HTMLInputElement;
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);
    expect(onUpload).toHaveBeenCalledWith(file, "");
  });
});
