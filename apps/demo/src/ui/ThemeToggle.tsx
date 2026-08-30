import { type ReactNode, useEffect, useState } from "react";

const THEME_KEY = "placis-theme";

function preferredTheme(): "light" | "dark" {
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeControls(): ReactNode {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(preferredTheme());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
        Theme
      </span>
      {(["light", "dark"] as const).map((mode) => (
        <button
          className={
            theme === mode
              ? "rounded-full border border-primary bg-white px-2.5 py-1 text-xs text-foreground"
              : "rounded-full border border-transparent px-2.5 py-1 text-xs text-zinc-600 hover:bg-white/70"
          }
          key={mode}
          onClick={() => {
            window.localStorage.setItem(THEME_KEY, mode);
            setTheme(mode);
          }}
          type="button"
        >
          {mode === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </span>
  );
}
