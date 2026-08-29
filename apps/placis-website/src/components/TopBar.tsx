import { Menu, X as CloseIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { onboardingHref, signInHref } from "../lib/appOrigin";
import {
  RAISED_OUTLINE_CLASS,
  RAISED_PRIMARY_CLASS,
  SITE_FONT,
} from "../lib/marketingSite";

const NAV_LINKS = [
  { label: "News", href: "/#blog" },
  { label: "Pricing", href: "/pricing/" },
  { label: "Support", href: "/support/" },
];

export function TopBar() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const tryHref = onboardingHref();
  const loginHref = signInHref();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showGlass = scrolled || navOpen;
  const glassChrome =
    "border-black/5 border-b bg-[#ffffff]/72 backdrop-blur-md backdrop-saturate-150 dark:border-white/10 dark:bg-[#181818]/72";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300 ${
          showGlass ? glassChrome : "border-b border-transparent bg-background"
        }`}
        style={{
          fontFamily: SITE_FONT,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="mx-auto flex h-12 w-full max-w-[1200px] items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-7">
            <a className="font-semibold text-[16px] tracking-tight" href="/">
              Placis
            </a>
            <nav className="hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  className="font-medium text-[14px] text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <a
              className={`hidden h-9 shrink-0 items-center rounded-full px-3.5 font-medium text-[13px] md:inline-flex sm:px-4 sm:text-[14px] ${RAISED_PRIMARY_CLASS}`}
              href={tryHref}
            >
              Try now
            </a>
            <a
              className={`hidden h-9 shrink-0 items-center rounded-full px-3.5 font-medium text-[13px] md:inline-flex sm:px-4 sm:text-[14px] ${RAISED_OUTLINE_CLASS}`}
              href={loginHref}
            >
              Login
            </a>
            <button
              aria-expanded={navOpen}
              aria-label={navOpen ? "Close menu" : "Open menu"}
              className="relative z-10 grid size-11 touch-manipulation place-items-center rounded-full text-zinc-950 transition hover:bg-zinc-100 active:bg-zinc-100 md:hidden dark:text-zinc-50 dark:hover:bg-white/10 dark:active:bg-white/10"
              onClick={() => setNavOpen((open) => !open)}
              type="button"
            >
              {navOpen ? (
                <CloseIcon className="size-[18px]" />
              ) : (
                <Menu className="size-[18px]" />
              )}
            </button>
          </div>
        </div>

        {navOpen ? (
          <nav
            className="border-black/5 border-t px-4 py-4 md:hidden dark:border-white/10"
            style={{ fontFamily: SITE_FONT }}
          >
            <ul className="space-y-3">
              <li>
                <a
                  className={`inline-flex h-10 w-full items-center justify-center rounded-full px-4 font-medium text-[14px] ${RAISED_PRIMARY_CLASS}`}
                  href={tryHref}
                  onClick={() => setNavOpen(false)}
                >
                  Try now
                </a>
              </li>
              <li>
                <a
                  className={`inline-flex h-10 w-full items-center justify-center rounded-full px-4 font-medium text-[14px] ${RAISED_OUTLINE_CLASS}`}
                  href={loginHref}
                  onClick={() => setNavOpen(false)}
                >
                  Login
                </a>
              </li>
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    className="block font-medium text-[15px] text-zinc-800 dark:text-zinc-200"
                    href={link.href}
                    onClick={() => setNavOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
      />
    </>
  );
}
