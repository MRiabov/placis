import { type ReactNode, useState } from "react";

import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { Field, TextInput } from "@/ui/Field";

type ConnectModalProps = {
  onClose: () => void;
};

export function ConnectModal({ onClose }: ConnectModalProps): ReactNode {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(label: string, value: string): void {
    void navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div
      aria-labelledby="connect-title"
      aria-modal="true"
      className="fixed inset-0 z-[90] grid place-items-center bg-black/30 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
    >
      <div className={card("w-full max-w-lg p-5 shadow-card")}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold" id="connect-title">
            Connect website address
          </h2>
          <button onClick={onClose} type="button">
            ×
          </button>
        </div>
        <Field label="Website address">
          <TextInput defaultValue="www.acme.ie" />
        </Field>
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          waiting for DNS
        </p>
        <div className="mt-3 grid gap-2 text-sm">
          <p>
            Add these records at the DNS panel where acme.ie already lives —
            GoDaddy, Porkbun, or Squarespace. Do not move nameservers to Placis;
            that hijacks mail.
          </p>
          <ol className="list-decimal pl-5 text-sm">
            <li>
              Copy <strong>Host</strong> into the name / host field.
            </li>
            <li>
              Copy <strong>Value</strong> into the value / points to field.
            </li>
            <li>
              Reopen this from New URL or the waiting host until status is
              active.
            </li>
          </ol>
        </div>
        <DnsRow
          copied={copied === "txt"}
          host="_cf-custom-hostname.www"
          label="TXT"
          onCopy={() => copy("txt", "ca3-8f2a1c9e4b7d6035")}
          value="ca3-8f2a1c9e4b7d6035"
        />
        <DnsRow
          copied={copied === "cname"}
          host="www"
          label="CNAME"
          onCopy={() => copy("cname", "customers.placis.com")}
          value="customers.placis.com"
        />
      </div>
    </div>
  );
}

function DnsRow({
  label,
  host,
  value,
  copied,
  onCopy,
}: {
  label: string;
  host: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}): ReactNode {
  return (
    <div className="mt-3 grid gap-1 text-sm">
      <b>{label}</b>
      <label className="grid gap-1">
        <span className="text-xs text-muted-foreground">Host</span>
        <input
          className="rounded-lg border border-border bg-zinc-50 px-2 py-1"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          value={host}
        />
      </label>
      <label className="grid gap-1">
        <span className="text-xs text-muted-foreground">Value</span>
        <input
          className="rounded-lg border border-border bg-zinc-50 px-2 py-1"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          value={value}
        />
      </label>
      <Button className="justify-self-start" onClick={onCopy} variant="outline">
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
