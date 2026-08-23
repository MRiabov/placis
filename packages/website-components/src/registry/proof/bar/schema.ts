export type ProofBarProps = {
  tone?: "light" | "dark" | "brand";
  items: {
    value: string;
    label: string;
    sourceRef?: string;
    reviewRequired?: boolean;
  }[];
};
