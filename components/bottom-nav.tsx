"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, BookOpen, Users, Calendar, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/shelf", label: "Shelf", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/students", label: "Students", icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
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
