import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAILY_REWARD_MODIFIERS } from "@/lib/rewards/daily-modifiers";

function titleFromPattern(pattern: string) {
  return pattern
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ModifierLibrary({
  activeModifierId,
}: {
  activeModifierId: string;
}) {
  const grouped = new Map<
    string,
    {
      pattern: string;
      entries: (typeof DAILY_REWARD_MODIFIERS)[number][];
    }
  >();

  for (const modifier of DAILY_REWARD_MODIFIERS) {
    const group = grouped.get(modifier.pattern);
    if (group) {
      group.entries.push(modifier);
      continue;
    }
    grouped.set(modifier.pattern, {
      pattern: modifier.pattern,
      entries: [modifier],
    });
  }

  const groups = Array.from(grouped.values()).map((group) => ({
    ...group,
    entries: [...group.entries].sort((a, b) => a.tier - b.tier),
  }));

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {groups.map((group) => (
        <Card key={group.pattern} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {titleFromPattern(group.pattern)}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 space-y-2 overflow-y-auto">
            {group.entries.map((modifier) => {
              const isActive = modifier.id === activeModifierId;
              return (
                <div
                  key={modifier.id}
                  className={`rounded-md border px-3 py-2 ${
                    isActive ? "border-primary/40 bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{modifier.name}</p>
                    <Badge variant={isActive ? "default" : "outline"}>
                      {modifier.id}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {modifier.description}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
