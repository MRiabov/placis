export type ContentBarProps = {
  tone?: "light" | "dark" | "brand";
  items: {
    value: string;
    label: string;
    sourceRef?: string;
    reviewRequired?: boolean;
  }[];
};
