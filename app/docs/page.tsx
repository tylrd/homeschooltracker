import { Hammer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <section className="w-full space-y-6 rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Hammer className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Docs</h1>
            <p className="text-muted-foreground">
              Under construction. Documentation is on the way.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
