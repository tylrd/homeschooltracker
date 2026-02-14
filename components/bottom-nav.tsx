"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/navigation/nav-items";
import { cn } from "@/lib/utils";

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      data-testid="bottom-nav"
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 border-t bg-background",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
