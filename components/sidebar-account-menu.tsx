"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function getInitials(value?: string | null) {
  if (!value) {
    return "U";
  }

  const parts = value.trim().split(/\s+/).slice(0, 2);
  const joined = parts.map((part) => part[0] ?? "").join("");
  return joined.toUpperCase() || "U";
}

export function SidebarAccountMenu({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: session } = authClient.useSession();
  const userName = session?.user?.name ?? "Unknown user";
  const userEmail = session?.user?.email ?? "";
  const initials = useMemo(() => getInitials(userName), [userName]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    setOpen(false);
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60",
            collapsed && "h-9 w-9 justify-center px-0 py-0",
          )}
          aria-label="Open account menu"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </span>
          <span className={cn("min-w-0", collapsed && "hidden")}>
            <span className="block truncate text-xs font-medium">
              {userName}
            </span>
            {userEmail && (
              <span className="block truncate text-[11px] text-muted-foreground">
                {userEmail}
              </span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2" sideOffset={8}>
        <div className="mb-2 border-b px-2 pb-2">
          <p className="truncate text-sm font-medium">{userName}</p>
          {userEmail && (
            <p className="truncate text-xs text-muted-foreground">
              {userEmail}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Button
            asChild
            variant="ghost"
            className="justify-start"
            onClick={() => setOpen(false)}
          >
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-destructive hover:text-destructive"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
