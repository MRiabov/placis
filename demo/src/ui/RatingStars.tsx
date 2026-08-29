import { Star } from "lucide-react";
import type { ReactNode } from "react";

type RatingStarsProps = {
  rating: number;
};

const slots = [0, 1, 2, 3, 4] as const;

export function RatingStars({ rating }: RatingStarsProps): ReactNode {
  const clamped = Math.min(5, Math.max(0, rating));
  return (
    <span aria-hidden="true" className="inline-flex items-center text-star">
      {slots.map((slot) => {
        const fill = Math.min(1, Math.max(0, clamped - slot));
        return (
          <span className="relative size-3" key={slot}>
            <Star className="absolute size-3 text-zinc-200" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="size-3 fill-current text-star" />
            </span>
          </span>
        );
      })}
    </span>
  );
}
