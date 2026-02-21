"use client";

import { GripHorizontal, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type TouchEvent, useRef, useState } from "react";
import { NAV_ITEMS } from "@/components/navigation/nav-items";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const pinnedTabs = NAV_ITEMS.slice(0, 3);
  const overflowTabs = NAV_ITEMS.slice(3);

  function isActiveHref(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const startY = touchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartYRef.current = null;
    if (startY === null || endY === undefined) return;
    if (startY - endY > 28) {
      setOpen(true);
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <nav
        data-testid="bottom-nav"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "fixed right-0 bottom-0 left-0 z-50 border-t bg-background/95 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] backdrop-blur supports-[backdrop-filter]:bg-background/80",
          className,
        )}
      >
        <div className="mx-auto max-w-lg">
          <DrawerTrigger asChild>
            <button
              type="button"
              aria-label="Open more navigation"
              className="mx-auto mt-1 block rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <GripHorizontal className="h-4 w-4" />
            </button>
          </DrawerTrigger>

          <div className="flex pt-0.5">
            {pinnedTabs.map((tab) => {
              const isActive = isActiveHref(tab.href);
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

            <DrawerTrigger asChild>
              <button
                type="button"
                aria-label="More navigation"
                className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span>More</span>
              </button>
            </DrawerTrigger>
          </div>
        </div>
      </nav>

      <DrawerContent className="max-h-[55vh]">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle>More</DrawerTitle>
        </DrawerHeader>
        <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="grid grid-cols-3 gap-2">
            {overflowTabs.map((tab) => {
              const isActive = isActiveHref(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors",
                    isActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
