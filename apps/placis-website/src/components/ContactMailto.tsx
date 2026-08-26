import { type ChangeEvent, useState } from "react";

import {
  CONTACT_EMAIL,
  CONTROL_RADIUS_CLASS,
  RAISED_PRIMARY_CLASS,
} from "../lib/marketingSite";
import {
  type ContactValues,
  buildMailtoHref,
  contactValuesAreComplete,
  emailLooksValid,
} from "../lib/contactMailto";

const FIELD_CLASS = `h-11 w-full border border-zinc-200 bg-white px-3.5 text-[15px] text-zinc-950 outline-hidden transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/10 dark:bg-white dark:text-zinc-950 ${CONTROL_RADIUS_CLASS}`;

const TEXTAREA_CLASS = `min-h-36 w-full resize-y border border-zinc-200 bg-white px-3.5 py-3 text-[15px] text-zinc-950 leading-6 outline-hidden transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/10 dark:bg-white dark:text-zinc-950 ${CONTROL_RADIUS_CLASS}`;

const LABEL_CLASS = "font-medium text-[13px] text-zinc-700 dark:text-zinc-300";

const EMPTY: ContactValues = {
  company: "",
  email: "",
  message: "",
  name: "",
  topic: "",
};

const TOPICS = [
  { label: "General inquiry", value: "general" },
  { label: "Sales and partnerships", value: "sales" },
  { label: "Press and media", value: "press" },
  { label: "Careers", value: "careers" },
] as const;

export function ContactMailto({
  destinationEmail = CONTACT_EMAIL,
}: {
  destinationEmail?: string;
}) {
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update =
    (field: keyof ContactValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setError(null);
    };

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!contactValuesAreComplete(values)) {
      setError("Please complete all required fields.");
      return;
    }
    if (!emailLooksValid(values.email)) {
      setError("Enter a valid email address.");
      return;
    }
    window.location.href = buildMailtoHref(destinationEmail, values);
    setSubmitted(true);
    setValues(EMPTY);
  };

  if (submitted) {
    return (
      <div className="text-left">
        <p className="font-medium text-[15px] text-zinc-950 dark:text-zinc-50">
          Message ready to send
        </p>
        <p className="mt-2 text-[14px] text-zinc-500 leading-6 dark:text-zinc-400">
          Your email app should open with the message pre-filled. Send it to
          complete your request and we&apos;ll reply within one business day.
        </p>
        <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
          Didn&apos;t open? Write to{" "}
          <a
            className="text-zinc-950 underline underline-offset-2 dark:text-zinc-50"
            href={`mailto:${destinationEmail}`}
          >
            {destinationEmail}
          </a>
          .
        </p>
        <button
          className="mt-6 font-medium text-[14px] text-zinc-950 underline-offset-4 transition hover:underline dark:text-zinc-50"
          onClick={() => setSubmitted(false)}
          type="button"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className={LABEL_CLASS} htmlFor="contact-topic">
          What can we help with?
        </label>
        <select
          className={FIELD_CLASS}
          id="contact-topic"
          onChange={update("topic")}
          required
          value={values.topic}
        >
          <option disabled value="">
            Select a topic
          </option>
          {TOPICS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className={LABEL_CLASS} htmlFor="contact-name">
          Full name
        </label>
        <input
          autoComplete="name"
          className={FIELD_CLASS}
          id="contact-name"
          onChange={update("name")}
          placeholder="Jane Contractor"
          required
          type="text"
          value={values.name}
        />
      </div>
      <div className="space-y-2">
        <label className={LABEL_CLASS} htmlFor="contact-email">
          Work email
        </label>
        <input
          autoComplete="email"
          className={FIELD_CLASS}
          id="contact-email"
          onChange={update("email")}
          placeholder="you@yourbusiness.com"
          required
          type="email"
          value={values.email}
        />
      </div>
      <div className="space-y-2">
        <label className={LABEL_CLASS} htmlFor="contact-company">
          Company <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          autoComplete="organization"
          className={FIELD_CLASS}
          id="contact-company"
          onChange={update("company")}
          placeholder="Your business name"
          type="text"
          value={values.company}
        />
      </div>
      <div className="space-y-2">
        <label className={LABEL_CLASS} htmlFor="contact-message">
          Message
        </label>
        <textarea
          className={TEXTAREA_CLASS}
          id="contact-message"
          onChange={update("message")}
          placeholder="Tell us how we can help."
          required
          value={values.message}
        />
      </div>
      {error ? (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className={`inline-flex h-11 w-full items-center justify-center rounded-full px-6 font-medium text-[15px] ${RAISED_PRIMARY_CLASS}`}
        type="submit"
      >
        Send message
      </button>
      <p className="text-center text-[12px] text-zinc-400 leading-5">
        By submitting, you agree we may contact you about your request.
      </p>
    </form>
  );
}
