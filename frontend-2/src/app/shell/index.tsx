import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Pages own their background; no app-level wrapper chrome. */
export function AppShell(): ReactNode {
  return <Outlet />;
}
