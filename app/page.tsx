import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingScreenshot } from "@/components/landing/landing-screenshot";
import { LandingThemeToggle } from "@/components/landing/landing-theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionOrNull } from "@/lib/auth/session";

export default async function LandingPage() {
  const session = await getSessionOrNull();
  const activeOrganizationId =
    session?.session?.activeOrganizationId ??
    session?.session?.activeOrganization?.id ??
    session?.activeOrganizationId ??
    session?.activeOrganization?.id ??
    null;

  if (activeOrganizationId) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_var(--color-primary)_0%,_transparent_70%)] opacity-10" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Homeschool Keeper
          </p>
          <p className="text-xs text-muted-foreground">
            Plan in minutes, log in seconds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs">Docs</Link>
          </Button>
          <LandingThemeToggle />
          <Button asChild variant="outline">
            <Link href="/sign-in">Log in</Link>
          </Button>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl space-y-16 px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        <section className="rounded-2xl border bg-card/90 p-8 shadow-sm backdrop-blur-sm sm:p-12">
          <div className="mx-auto max-w-3xl space-y-5 text-center">
            <Badge
              variant="secondary"
              className="gap-1 border border-border/70 bg-muted text-foreground"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Beta
            </Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              A friendlier way to manage your homeschool day
            </h1>
            <p className="text-pretty text-base text-muted-foreground sm:text-lg">
              Homeschool Keeper helps you keep lessons, attendance, and planning
              in one place so you can spend less time organizing and more time
              teaching.
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              Beta notice: The project is currently in beta and features will
              continue to improve.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/sign-in?mode=sign-up">
                  Create a new account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/sign-in">I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              See how it works
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              A quick look at the Homeschool Keeper dashboard in the current
              beta.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-md">
            <LandingScreenshot />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Real app preview from the current beta.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
