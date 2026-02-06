import { getColorClasses } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StudentColorDot({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  const colors = getColorClasses(color);
  return (
    <span
      className={cn("inline-block h-3 w-3 rounded-full", colors.dot, className)}
    />
  );
}
