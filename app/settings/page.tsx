export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AbsenceReasonForm } from "@/components/settings/absence-reason-form";
import { getOrCreateDefaultReasons } from "@/lib/queries/absence-reasons";

export default async function SettingsPage() {
  const reasons = await getOrCreateDefaultReasons();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Separator />

      <AbsenceReasonForm reasons={reasons} />
    </div>
  );
}
