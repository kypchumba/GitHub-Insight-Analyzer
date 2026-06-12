import { LucideIcon } from "lucide-react";
import { useCounter } from "../hooks/useCounter";
import { compactNumber } from "../lib/utils";
import { Card, CardContent } from "./ui/card";

interface MetricCardProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
  detail?: string;
}

export function MetricCard({ label, value, icon: Icon, detail }: MetricCardProps) {
  const animated = useCounter(value ?? 0);

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold tracking-normal">{value === null ? "N/A" : compactNumber(animated)}</p>
          {detail ? <p className="truncate text-xs text-muted-foreground">{detail}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

