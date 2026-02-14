"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen lg:bg-muted/20">
      <div
        className={cn(
          "mx-auto min-h-screen max-w-lg lg:grid lg:max-w-none lg:gap-0 lg:px-0 lg:py-0",
          desktopSidebarCollapsed
            ? "lg:grid-cols-[72px_minmax(0,1fr)]"
            : "lg:grid-cols-[240px_minmax(0,1fr)]",
        )}
      >
        <DesktopSidebar
          collapsed={desktopSidebarCollapsed}
          onToggleCollapse={() =>
            setDesktopSidebarCollapsed((current) => !current)
          }
        />
        <div className="flex min-h-screen flex-col lg:min-h-0 lg:pl-6">
          <header className="flex items-center justify-between px-4 pt-3 pb-1 lg:hidden">
            <span className="text-sm font-semibold tracking-tight text-muted-foreground">
              HomeschoolTracker
            </span>
            <div className="flex items-center gap-1">
              <Link
                href="/settings"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 px-4 pt-1 pb-20 lg:pl-2 lg:pr-6 lg:pt-4 lg:pb-4">
            <div className="lg:hidden">
              <PullToRefresh>{children}</PullToRefresh>
            </div>
            <div className="hidden lg:block">{children}</div>
          </main>
          <BottomNav className="lg:hidden" />
        </div>
      </div>
    </div>
  );
}
