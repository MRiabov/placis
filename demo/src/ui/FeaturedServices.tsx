import { type ReactNode, useState } from "react";

import { Button } from "@/ui/Button";
import { TextInput } from "@/ui/Field";

function splitServiceNames(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((part) => part.replace(/^[\s•-]+/, "").trim())
    .filter(Boolean);
}

type ServiceRow = {
  id: string;
  name: string;
};

type FeaturedServicesProps = {
  initial?: string[];
};

let rowSeq = 0;

function nextRowId(): string {
  rowSeq += 1;
  return `service-${rowSeq}`;
}

export function FeaturedServices({
  initial = ["Roof repairs", "New roofs", "Guttering"],
}: FeaturedServicesProps): ReactNode {
  const [rows, setRows] = useState<ServiceRow[]>(() =>
    initial.map((name) => ({ id: nextRowId(), name })),
  );

  return (
    <div className="grid gap-2">
      <span className="text-[13px] tracking-tight text-zinc-600">
        Featured services
      </span>
      <ul className="m-0 grid list-none gap-2 p-0">
        {rows.map((row, index) => (
          <li className="flex items-center gap-2" key={row.id}>
            <TextInput
              aria-label="Featured service"
              defaultValue={row.name}
              onChange={(event) => {
                setRows((current) =>
                  current.map((item) =>
                    item.id === row.id
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                );
              }}
              onPaste={(event) => {
                const text = event.clipboardData.getData("text");
                const names = splitServiceNames(text);
                if (names.length < 2) {
                  return;
                }
                event.preventDefault();
                setRows((current) => [
                  ...current.map((item) =>
                    item.id === row.id ? { ...item, name: names[0] } : item,
                  ),
                  ...names.slice(1).map((name) => ({
                    id: nextRowId(),
                    name,
                  })),
                ]);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || index !== rows.length - 1) {
                  return;
                }
                event.preventDefault();
                setRows((current) => [
                  ...current,
                  { id: nextRowId(), name: "" },
                ]);
              }}
            />
            <button
              aria-label="Remove service"
              className="grid size-8 shrink-0 place-items-center rounded-full text-lg text-muted-foreground hover:bg-black/5 hover:text-foreground"
              onClick={() => {
                setRows((current) =>
                  current.length < 2
                    ? current
                    : current.filter((item) => item.id !== row.id),
                );
              }}
              type="button"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <Button
        className="justify-self-start"
        onClick={() =>
          setRows((current) => [...current, { id: nextRowId(), name: "" }])
        }
        variant="outline"
      >
        Add service
      </Button>
      <p className="text-xs leading-snug text-muted-foreground">
        We’ll turn each name into a service page. Paste a list and we’ll split
        it into rows.
      </p>
    </div>
  );
}
