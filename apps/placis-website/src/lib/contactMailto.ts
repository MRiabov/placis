export type ContactValues = {
  company: string;
  email: string;
  message: string;
  name: string;
  topic: string;
};

const TOPIC_LABELS: Record<string, string> = {
  general: "General inquiry",
  sales: "Sales and partnerships",
  press: "Press and media",
  careers: "Careers",
};

export function contactValuesAreComplete(values: ContactValues): boolean {
  return (
    values.topic.length > 0 &&
    values.name.trim().length > 0 &&
    values.email.trim().length > 0 &&
    values.message.trim().length > 0
  );
}

export function emailLooksValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function buildMailtoHref(
  destinationEmail: string,
  values: ContactValues,
): string {
  const topicLabel = TOPIC_LABELS[values.topic] ?? values.topic;
  const subject = `[Placis Contact] ${topicLabel}`;
  const body = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    values.company ? `Company: ${values.company}` : null,
    `Topic: ${topicLabel}`,
    "",
    values.message,
  ]
    .filter(Boolean)
    .join("\n");
  return `mailto:${destinationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
