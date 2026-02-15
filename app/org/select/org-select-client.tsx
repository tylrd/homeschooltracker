"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  activeOrganizationId,
  defaultOrganizationId: initialDefaultOrganizationId,
}: {
  initialOrganizations: OrganizationOption[];
  activeOrganizationId: string | null;
  defaultOrganizationId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [organizations, setOrganizations] = useState(initialOrganizations);
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

  const nextPath = useMemo(
    () => searchParams.get("next") ?? "/",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No organizations yet. Create one to continue.
            </p>
          ) : (
            organizations.map((organization) => (
              <div
                key={organization.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{organization.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {organization.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={Boolean(isSettingDefaultId)}
                    onClick={() => handleSetDefault(organization.id)}
                  >
                    {isSettingDefaultId === organization.id
                      ? "Saving..."
                      : organization.id === defaultOrganizationId
                        ? "Default"
                        : "Set default"}
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      organization.id === activeOrganizationId
                        ? "secondary"
                        : "default"
                    }
                    disabled={Boolean(isSwitchingId)}
                    onClick={() => activateOrganization(organization.id)}
                  >
                    {isSwitchingId === organization.id
                      ? "Switching..."
                      : organization.id === activeOrganizationId
                        ? "Active"
                        : "Use"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

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
      </CardContent>
    </Card>
  );
}
