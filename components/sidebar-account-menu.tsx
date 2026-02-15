"use client";

import { Check, LogOut, Settings, Star, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

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
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);
  const [settingDefaultOrgId, setSettingDefaultOrgId] = useState<string | null>(
    null,
  );
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [defaultOrganizationId, setDefaultOrganizationId] = useState<
    string | null
  >(null);
  const [activeOrganizationId, setActiveOrganizationId] = useState<
    string | null
  >(null);

  const { data: session } = authClient.useSession();
  const activeOrgQuery = authClient.useActiveOrganization();
  const listOrganizationsQuery = authClient.useListOrganizations();

  const sessionActiveOrganizationId =
    session?.session?.activeOrganizationId ?? null;
  const effectiveActiveOrganizationId =
    activeOrgQuery.data?.id ??
    activeOrganizationId ??
    sessionActiveOrganizationId;
  const effectiveOrganizations =
    listOrganizationsQuery.data && listOrganizationsQuery.data.length > 0
      ? listOrganizationsQuery.data.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
        }))
      : organizations;

  const userName = session?.user?.name ?? "Unknown user";
  const userEmail = session?.user?.email ?? "";
  const organizationName =
    activeOrgQuery.data?.name ??
    effectiveOrganizations.find(
      (org) => org.id === effectiveActiveOrganizationId,
    )?.name ??
    "No active organization";

  const initials = useMemo(() => getInitials(userName), [userName]);

  const loadPreferences = useCallback(async () => {
    const response = await fetch("/api/organization/preferences", {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as {
      organizations: OrganizationOption[];
      defaultOrganizationId: string | null;
      activeOrganizationId: string | null;
    };

    setOrganizations(data.organizations);
    setDefaultOrganizationId(data.defaultOrganizationId);
    setActiveOrganizationId(data.activeOrganizationId);
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void loadPreferences();
  }, [open, loadPreferences]);

  async function setDefaultOrganization(organizationId: string | null) {
    setSettingDefaultOrgId(organizationId);

    const response = await fetch("/api/organization/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });

    if (response.ok) {
      setDefaultOrganizationId(organizationId);
    }

    setSettingDefaultOrgId(null);
  }

  async function switchOrganization(organizationId: string) {
    setSwitchingOrgId(organizationId);

    const { error } = await authClient.organization.setActive({
      organizationId,
    });

    setSwitchingOrgId(null);

    if (error) {
      return;
    }

    setActiveOrganizationId(organizationId);
    setOpen(false);
    router.refresh();
  }

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
            <span className="block truncate text-[11px] text-muted-foreground">
              {organizationName}
            </span>
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
          <p className="truncate text-xs text-muted-foreground">
            {organizationName}
          </p>
        </div>

        <div className="mb-2 space-y-1 border-b px-1 pb-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Organizations
          </p>
          {effectiveOrganizations.map((organization) => {
            const isActive = organization.id === effectiveActiveOrganizationId;
            const isDefault = defaultOrganizationId
              ? organization.id === defaultOrganizationId
              : effectiveOrganizations.length === 1;

            return (
              <div
                key={organization.id}
                className="flex items-center justify-between gap-2 rounded-md px-1 py-1"
              >
                <button
                  type="button"
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent",
                    isActive && "bg-accent",
                  )}
                  onClick={() => switchOrganization(organization.id)}
                  disabled={switchingOrgId !== null}
                >
                  {isActive ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{organization.name}</span>
                </button>
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
                    isDefault && "text-amber-500",
                  )}
                  onClick={() => setDefaultOrganization(organization.id)}
                  disabled={settingDefaultOrgId !== null}
                  title={isDefault ? "Default organization" : "Set as default"}
                >
                  <Star
                    className="h-4 w-4"
                    fill={isDefault ? "currentColor" : "none"}
                  />
                </button>
              </div>
            );
          })}
          {effectiveOrganizations.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              No organizations found for this user.
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
            <Link href="/org/select">
              <Users className="mr-2 h-4 w-4" />
              Manage organizations
            </Link>
          </Button>
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
