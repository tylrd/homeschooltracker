"use client";

import { ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function OrgSelectClient({
  initialOrganizations,
  activeOrganizationId: initialActiveOrganizationId,
  defaultOrganizationId: initialDefaultOrganizationId,
}: {
  initialOrganizations: OrganizationOption[];
  activeOrganizationId: string | null;
  defaultOrganizationId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [activeOrganizationId, setActiveOrganizationId] = useState(
    initialActiveOrganizationId,
  );
  const [defaultOrganizationId, setDefaultOrganizationId] = useState(
    initialDefaultOrganizationId,
  );
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSwitchingId, setIsSwitchingId] = useState<string | null>(null);
  const [isSettingDefaultId, setIsSettingDefaultId] = useState<string | null>(
    null,
  );
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [managedOrganization, setManagedOrganization] =
    useState<OrganizationOption | null>(null);
  const [renameName, setRenameName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [deleteNameConfirmation, setDeleteNameConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const nextPath = useMemo(
    () => searchParams.get("next") ?? "/dashboard",
    [searchParams],
  );

  async function activateOrganization(organizationId: string) {
    setError(null);
    setIsSwitchingId(organizationId);

    const { error: setActiveError } = await authClient.organization.setActive({
      organizationId,
    });

    if (setActiveError) {
      setError(setActiveError.message ?? "Could not set active organization.");
      setIsSwitchingId(null);
      return;
    }

    setActiveOrganizationId(organizationId);
    router.push(nextPath);
    router.refresh();
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Organization name is required.");
      return;
    }

    const baseSlug = slugify(trimmedName) || "organization";
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    setIsCreating(true);
    const { data, error: createError } = await authClient.organization.create({
      name: trimmedName,
      slug,
    });

    if (createError) {
      setError(createError.message ?? "Could not create organization.");
      setIsCreating(false);
      return;
    }

    const createdOrganization = data?.id
      ? {
          id: data.id,
          name: data.name,
          slug: data.slug,
        }
      : null;

    if (createdOrganization) {
      setOrganizations((previous) => [createdOrganization, ...previous]);
      await fetch("/api/organization/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: createdOrganization.id }),
      });
      setDefaultOrganizationId(createdOrganization.id);
      await activateOrganization(createdOrganization.id);
      return;
    }

    setError(
      "Organization created but could not activate it. Refresh and try again.",
    );
    setIsCreating(false);
  }

  async function handleSignOut() {
    setError(null);
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  async function handleSetDefault(organizationId: string) {
    setError(null);
    setIsSettingDefaultId(organizationId);
    const response = await fetch("/api/organization/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    if (!response.ok) {
      setError("Could not set default organization.");
    } else {
      setDefaultOrganizationId(organizationId);
    }
    setIsSettingDefaultId(null);
  }

  function openManageDialog(organization: OrganizationOption) {
    setError(null);
    setManagedOrganization(organization);
    setRenameName(organization.name);
    setDeleteNameConfirmation("");
  }

  async function handleRenameOrganization(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!managedOrganization) return;

    const trimmedName = renameName.trim();
    if (!trimmedName) {
      setError("Organization name is required.");
      return;
    }

    setIsRenaming(true);
    setError(null);

    const response = await fetch(
      `/api/organization/${managedOrganization.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      },
    );

    const data = (await response.json().catch(() => null)) as {
      error?: string;
      organization?: OrganizationOption;
    } | null;

    if (!response.ok) {
      setError(data?.error ?? "Could not rename organization.");
      setIsRenaming(false);
      return;
    }

    const updated = data?.organization;
    if (updated) {
      setOrganizations((previous) =>
        previous.map((organization) =>
          organization.id === updated.id ? updated : organization,
        ),
      );
      setManagedOrganization(updated);
    }

    setIsRenaming(false);
  }

  async function handleDeleteOrganization() {
    if (!managedOrganization) return;

    setIsDeleting(true);
    setError(null);

    const response = await fetch(
      `/api/organization/${managedOrganization.id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: deleteNameConfirmation }),
      },
    );

    const data = (await response.json().catch(() => null)) as {
      error?: string;
      deletedOrganizationId?: string;
      nextActiveOrganizationId?: string | null;
    } | null;

    if (!response.ok) {
      setError(data?.error ?? "Could not delete organization.");
      setIsDeleting(false);
      return;
    }

    const deletedId = data?.deletedOrganizationId ?? managedOrganization.id;
    const nextActiveId = data?.nextActiveOrganizationId ?? null;

    setOrganizations((previous) =>
      previous.filter((organization) => organization.id !== deletedId),
    );
    if (defaultOrganizationId === deletedId) {
      setDefaultOrganizationId(null);
    }
    if (activeOrganizationId === deletedId) {
      setActiveOrganizationId(nextActiveId);
    }

    setManagedOrganization(null);
    setRenameName("");
    setDeleteNameConfirmation("");
    setIsDeleting(false);
    router.refresh();
  }

  const deleteNameMatches = Boolean(
    managedOrganization &&
      deleteNameConfirmation.trim() === managedOrganization.name,
  );
  const renameChanged = Boolean(
    managedOrganization && renameName.trim() !== managedOrganization.name,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No organizations yet. Create one to continue.
            </p>
          ) : (
            organizations.map((organization) => {
              const isActive = organization.id === activeOrganizationId;
              const isDefault = organization.id === defaultOrganizationId;

              return (
                <div
                  key={organization.id}
                  className="space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-lg font-semibold">
                        {organization.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {organization.slug}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isDefault ? (
                        <Badge variant="secondary">Default</Badge>
                      ) : null}
                      {isActive ? <Badge>Active</Badge> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={isActive ? "secondary" : "default"}
                      disabled={Boolean(isSwitchingId)}
                      onClick={() => activateOrganization(organization.id)}
                      className="h-8 w-8 p-0"
                      aria-label={
                        isActive
                          ? "Current active organization"
                          : `Switch to ${organization.name}`
                      }
                      title={
                        isActive ? "Active organization" : "Use organization"
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">
                        {isSwitchingId === organization.id
                          ? "Switching..."
                          : isActive
                            ? "Active"
                            : "Use"}
                      </span>
                    </Button>

                    {isDefault ? null : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(isSettingDefaultId)}
                        onClick={() => handleSetDefault(organization.id)}
                      >
                        {isSettingDefaultId === organization.id
                          ? "Saving..."
                          : "Set as default"}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openManageDialog(organization)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Separator />

        <form className="space-y-3" onSubmit={handleCreate}>
          <Label htmlFor="organization-name">Create organization</Label>
          <Input
            id="organization-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My Homeschool"
            required
          />
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create and continue"}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button variant="ghost" onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>

        <Dialog
          open={Boolean(managedOrganization)}
          onOpenChange={(open) => {
            if (!open) {
              setManagedOrganization(null);
              setRenameName("");
              setDeleteNameConfirmation("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage organization</DialogTitle>
              <DialogDescription>
                Update name or delete this organization.
              </DialogDescription>
            </DialogHeader>

            {managedOrganization && (
              <div className="space-y-6">
                <form className="space-y-3" onSubmit={handleRenameOrganization}>
                  <Label htmlFor="rename-organization-name">
                    Organization name
                  </Label>
                  <Input
                    id="rename-organization-name"
                    value={renameName}
                    onChange={(event) => setRenameName(event.target.value)}
                    required
                    maxLength={80}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={!renameChanged || isRenaming}
                    >
                      {isRenaming ? "Saving..." : "Save name"}
                    </Button>
                  </DialogFooter>
                </form>

                <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-destructive">
                      Delete organization
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Type{" "}
                      <span className="font-semibold text-foreground">
                        {managedOrganization.name}
                      </span>{" "}
                      to confirm permanent deletion.
                    </p>
                  </div>
                  <Input
                    value={deleteNameConfirmation}
                    onChange={(event) =>
                      setDeleteNameConfirmation(event.target.value)
                    }
                    placeholder={managedOrganization.name}
                    autoComplete="off"
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={!deleteNameMatches || isDeleting}
                      onClick={handleDeleteOrganization}
                    >
                      {isDeleting ? "Deleting..." : "Delete organization"}
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
