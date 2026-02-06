"use client";

import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <main className="px-4 pt-4 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
