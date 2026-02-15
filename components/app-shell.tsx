"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { SidebarAccountMenu } from "@/components/sidebar-account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const isPublicAuthRoute = pathname === "/sign-in";
  const isLandingRoute = pathname === "/";

  if (isPublicAuthRoute) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
        <div className="w-full">{children}</div>
      </div>
    );
  }

  if (isLandingRoute) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden lg:bg-muted/20">
      <div
        className={cn(
          "mx-auto h-full max-w-lg lg:grid lg:max-w-none lg:gap-0 lg:px-0 lg:py-0",
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
        <div className="flex h-full min-h-0 flex-col lg:pl-6">
          <header className="flex items-center justify-between px-4 pt-3 pb-1 lg:hidden">
            <span className="text-sm font-semibold tracking-tight text-muted-foreground">
              Homeschool Keeper
            </span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SidebarAccountMenu collapsed />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 pt-1 pb-24 lg:pl-2 lg:pr-6 lg:pt-4 lg:pb-4">
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
