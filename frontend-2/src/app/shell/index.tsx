import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Pages own their background; no extra wrapper around the page. */
export function AppShell(): ReactNode {
  return <Outlet />;
}
