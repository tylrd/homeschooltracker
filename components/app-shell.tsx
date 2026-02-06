"use client";

import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <header className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-sm font-semibold tracking-tight text-muted-foreground">
          HomeschoolTracker
        </span>
        <ThemeToggle />
      </header>
      <main className="px-4 pt-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
