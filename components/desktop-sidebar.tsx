"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/navigation/nav-items";
import { SidebarAccountMenu } from "@/components/sidebar-account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DesktopSidebar({
  className,
  collapsed,
  onToggleCollapse,
}: {
  className?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      data-testid="desktop-sidebar"
      className={cn(
        "hidden h-screen flex-col border-r bg-card lg:flex",
        collapsed ? "w-[72px]" : "w-[240px]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-3">
        <p
          className={cn(
            "text-sm font-semibold tracking-tight",
            collapsed && "sr-only",
          )}
        >
          HomeschoolTracker
        </p>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", collapsed && "mx-auto")}
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className={cn("truncate", collapsed && "hidden")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t px-3 pt-3 pb-3">
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <SidebarAccountMenu collapsed={collapsed} />
          {!collapsed ? <ThemeToggle /> : null}
        </div>
      </div>
    </aside>
  );
}
