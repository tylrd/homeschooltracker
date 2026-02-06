"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <header className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-sm font-semibold tracking-tight text-muted-foreground">
          HomeschoolTracker
        </span>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="px-4 pt-1 pb-20">
        <PullToRefresh>{children}</PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
