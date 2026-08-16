import type { ReactNode } from "react";

interface UnsupportedPreviewModuleProps {
  module: string;
}

export function UnsupportedPreviewModule({
  module,
}: UnsupportedPreviewModuleProps): ReactNode {
  return (
    <main className="grid min-h-screen place-items-center bg-white p-6 text-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="font-semibold text-lg">Preview unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {module === "website"
            ? "This website preview uses an older manifest format and cannot be rendered by the current preview."
            : `The "${module}" preview module is not available.`}
        </p>
      </div>
    </main>
  );
}
