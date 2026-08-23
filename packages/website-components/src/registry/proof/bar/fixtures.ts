import type { PublicComponentFixture } from "../../types";
import type { ProofBarProps } from "./schema";

export const proofBarFixtures = [
  {
    name: "Reference project proof",
    props: {
      tone: "dark",
      items: [
        { value: "5th", label: "Generation Trade", reviewRequired: true },
        { value: "100+", label: "Projects Completed", reviewRequired: true },
        { value: "15", label: "Trade Specialists", reviewRequired: true },
        { value: "4", label: "Accreditations", reviewRequired: true },
      ],
    },
  },
] satisfies PublicComponentFixture<ProofBarProps>[];
