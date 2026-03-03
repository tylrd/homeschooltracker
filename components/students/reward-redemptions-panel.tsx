"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cancelRedemption,
  fulfillRedemption,
  redeemRewardTemplate,
} from "@/lib/actions/rewards";
import type { RewardTemplate } from "@/lib/rewards/templates";

type RedemptionRow = {
  id: string;
  rewardTemplateId: string;
  rewardNameSnapshot: string;
  xpCostSnapshot: number;
  descriptionSnapshot: string | null;
  status: "pending" | "approved" | "cancelled" | "fulfilled";
  requestedAt: string | Date;
  fulfilledAt: string | Date | null;
  cancelledAt: string | Date | null;
  notes: string | null;
};

type RewardRedemptionsPanelProps = {
  studentId: string;
  xpBalance: number;
  templates: RewardTemplate[];
  redemptions: RedemptionRow[];
};

function formatDate(value: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function RewardRedemptionsPanel({
  studentId,
  xpBalance,
  templates,
  redemptions,
}: RewardRedemptionsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleRedeem(templateId: string) {
    setActiveId(templateId);
    startTransition(async () => {
      try {
        await redeemRewardTemplate({ studentId, templateId });
        toast.success("Reward redeemed");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to redeem reward";
        toast.error(message);
      } finally {
        setActiveId(null);
      }
    });
  }

  function handleFulfill(redemptionId: string) {
    setActiveId(redemptionId);
    startTransition(async () => {
      try {
        await fulfillRedemption(redemptionId);
        toast.success("Redemption fulfilled");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fulfill redemption";
        toast.error(message);
      } finally {
        setActiveId(null);
      }
    });
  }

  function handleCancel(redemptionId: string) {
    setActiveId(redemptionId);
    startTransition(async () => {
      try {
        await cancelRedemption(redemptionId);
        toast.success("Redemption cancelled and XP refunded");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to cancel redemption";
        toast.error(message);
      } finally {
        setActiveId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Available Rewards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reward templates configured.
            </p>
          ) : (
            templates.map((template) => {
              const affordable = xpBalance >= template.xpCost;
              return (
                <div
                  key={template.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.xpCost} XP
                      {template.description ? ` • ${template.description}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={isPending || !affordable}
                    onClick={() => handleRedeem(template.id)}
                  >
                    {activeId === template.id && isPending
                      ? "Redeeming..."
                      : "Redeem"}
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Redemption History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {redemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No redemptions yet.</p>
          ) : (
            redemptions.map((redemption) => {
              const requestedAt = formatDate(redemption.requestedAt);
              const fulfilledAt = formatDate(redemption.fulfilledAt);
              const cancelledAt = formatDate(redemption.cancelledAt);
              const canFulfill =
                redemption.status === "pending" ||
                redemption.status === "approved";
              const canCancel =
                redemption.status === "pending" ||
                redemption.status === "approved";

              return (
                <div
                  key={redemption.id}
                  className="rounded-md border px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {redemption.rewardNameSnapshot}
                    </p>
                    <Badge variant="outline">
                      {redemption.xpCostSnapshot} XP
                    </Badge>
                    <Badge
                      variant={
                        redemption.status === "fulfilled"
                          ? "default"
                          : redemption.status === "cancelled"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {redemption.status}
                    </Badge>
                  </div>
                  {redemption.descriptionSnapshot && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {redemption.descriptionSnapshot}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested: {requestedAt ?? "Unknown"}
                    {fulfilledAt ? ` • Fulfilled: ${fulfilledAt}` : ""}
                    {cancelledAt ? ` • Cancelled: ${cancelledAt}` : ""}
                  </p>
                  {redemption.notes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Notes: {redemption.notes}
                    </p>
                  )}
                  {(canFulfill || canCancel) && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isPending || !canFulfill}
                        onClick={() => handleFulfill(redemption.id)}
                      >
                        {activeId === redemption.id && isPending
                          ? "Saving..."
                          : "Fulfill"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending || !canCancel}
                        onClick={() => handleCancel(redemption.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
