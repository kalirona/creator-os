import * as React from "react";
import { cn } from "@/lib/utils";

interface StatGridItem {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  color?: "primary" | "success" | "warning" | "danger" | "muted";
}

interface StatGridProps {
  items: StatGridItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const colorClasses = {
  primary: "text-primary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-rose-500",
  muted: "text-muted-foreground",
};

export function StatGrid({ items, columns = 4, className }: StatGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        const colorClass = colorClasses[item.color ?? "muted"];
        return (
          <div
            key={i}
            className="mini-stat flex items-center gap-2.5 rounded-xl border bg-card p-3.5 transition-colors hover:bg-accent/50"
          >
            {Icon && (
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase text-muted-foreground font-semibold">{item.label}</p>
              <p className="text-xl font-bold tabular-nums">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
