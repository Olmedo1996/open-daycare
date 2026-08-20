import type { ReactNode } from "react";
import { MobileHeader } from "./MobileHeader";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  activePath: string;
  maxWidth: number;
  children: ReactNode;
};

export function AppShell({ activePath, maxWidth, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
      <Sidebar activePath={activePath} />
      <MobileHeader activePath={activePath} />
      <main className="min-w-0 flex-1">
        <div
          className="mx-auto w-full px-5 pb-20 pt-[34px] lg:px-10"
          style={{ maxWidth }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}