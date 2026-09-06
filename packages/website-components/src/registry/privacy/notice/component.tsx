import type { WebsiteComponentProps } from "../../../types";
import { text } from "../../../utils";

export default function PrivacyNotice({ props }: WebsiteComponentProps) {
  return (
    <section className="border-y border-(--public-border) bg-(--public-background) px-4 py-8 sm:px-6 lg:px-8">
      <div className="website-frame max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-(--public-muted)">
          Privacy
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          {text(props.title, "Privacy notice")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-(--public-muted)">
          {text(
            props.body,
            "Website visitor information is used to respond to enquiries, prepare quotes, and provide requested services.",
          )}
        </p>
        {props.contact_email ? (
          <p className="mt-3 text-sm font-semibold">
            Contact: {String(props.contact_email)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
