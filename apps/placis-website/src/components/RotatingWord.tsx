import { useCallback, useEffect, useState } from "react";

const WORD_CYCLE_MS = 3800;
const WORD_TRANSITION_MS = 240;
const WORD_HOLD_MS = WORD_CYCLE_MS - WORD_TRANSITION_MS;

export const TRADE_WORDS = [
  "residential contractors",
  "new home builders",
  "renovation specialists",
  "roofing contractors",
  "electrical contractors",
  "solar installers",
];

export function RotatingWord({
  className,
  suffix = "",
  words,
}: {
  className?: string;
  suffix?: string;
  words: string[];
}) {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % words.length);
  }, [words.length]);

  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }

    let hold = 0;
    const scheduleCycle = () => {
      hold = window.setTimeout(() => {
        advance();
        scheduleCycle();
      }, WORD_HOLD_MS);
    };
    scheduleCycle();
    return () => window.clearTimeout(hold);
  }, [advance]);

  return (
    <span className={`heading-flip ${className ?? ""}`}>
      <span className="heading-flip__face" key={index}>
        {words[index]}
        {suffix}
      </span>
    </span>
  );
}
