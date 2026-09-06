import type { PublicComponentFixture } from "../../types";
import type { ContentBarProps } from "./schema";

export const contentBarFixtures = [
  {
    name: "Reference project metrics",
    props: {
      tone: "dark",
      items: [
        { value: "5th", label: "Generation Trade", reviewRequired: true },
        { value: "100+", label: "Projects Completed", reviewRequired: true },
        { value: "15", label: "Trade Specialists", reviewRequired: true },
        { value: "4", label: "Certifications", reviewRequired: true },
      ],
    },
  },
] satisfies PublicComponentFixture<ContentBarProps>[];
