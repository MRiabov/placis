export const demoWebsite = {
  prefix: "bellfield-roofing",
  title: "Bellfield Roofing",
};

export type LeadState = "new" | "contacted" | "closed";

export type LeadRow = {
  adId?: string;
  adTitle?: string;
  contactName: string;
  createdLabel: string;
  id: string;
  marketingEmail: string;
  marketingPhone: string;
  message: string;
  origin: "website" | "ad";
  status: LeadState;
  websitePrefix?: string;
  websiteTitle?: string;
};

export const leadRows: LeadRow[] = [
  {
    contactName: "Aoife Kelly",
    createdLabel: "Today",
    id: "aoife-kelly",
    marketingEmail: "aoife.kelly@example.com",
    marketingPhone: "087 441 2201",
    message: "Quote for a full roof replacement in Drumcondra.",
    origin: "website",
    status: "new",
    websitePrefix: demoWebsite.prefix,
    websiteTitle: demoWebsite.title,
  },
  {
    adId: "gutter-cleaning-summer",
    adTitle: "Gutter cleaning — summer",
    contactName: "John Murphy",
    createdLabel: "Yesterday",
    id: "john-murphy",
    marketingEmail: "john.murphy@example.com",
    marketingPhone: "087 123 4567",
    message: "Guttering look-over before the autumn rains.",
    origin: "ad",
    status: "new",
  },
  {
    contactName: "Niamh Walsh",
    createdLabel: "2 days ago",
    id: "niamh-walsh",
    marketingEmail: "niamh.walsh@example.com",
    marketingPhone: "086 555 0192",
    message: "Chimney flashing leaking after last week's storm.",
    origin: "website",
    status: "contacted",
    websitePrefix: demoWebsite.prefix,
    websiteTitle: demoWebsite.title,
  },
  {
    adId: "roofing-replacement-spring",
    adTitle: "Roofing replacement — spring push",
    contactName: "Anne Doyle",
    createdLabel: "3 days ago",
    id: "anne-doyle",
    marketingEmail: "anne.doyle@example.com",
    marketingPhone: "086 222 3344",
    message: "Interested in the spring roof replacement offer.",
    origin: "ad",
    status: "contacted",
  },
  {
    adId: "gutter-cleaning-summer",
    adTitle: "Gutter cleaning — summer",
    contactName: "Declan Byrne",
    createdLabel: "Last week",
    id: "declan-byrne",
    marketingEmail: "declan.byrne@example.com",
    marketingPhone: "085 999 8877",
    message: "Gutter cleaning for a two-storey in Lucan.",
    origin: "ad",
    status: "new",
  },
  {
    contactName: "Ciarán Flynn",
    createdLabel: "Last week",
    id: "ciaran-flynn",
    marketingEmail: "ciaran.flynn@example.com",
    marketingPhone: "083 770 4410",
    message: "Already booked elsewhere — thanks.",
    origin: "website",
    status: "closed",
    websitePrefix: demoWebsite.prefix,
    websiteTitle: demoWebsite.title,
  },
];

export function newAdLeads(adId: string): LeadRow[] {
  return leadRows.filter(
    (row) => row.origin === "ad" && row.adId === adId && row.status === "new",
  );
}

function newAdLeadCount(adId: string): number {
  return newAdLeads(adId).length;
}

export function newAdLeadLabel(adId: string): string {
  const count = newAdLeadCount(adId);
  if (count === 0) {
    return "No New ad leads";
  }
  if (count === 1) {
    return "1 New ad lead";
  }
  return `${count} New ad leads`;
}
