import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const progressCardVariants = cva(
  "rounded-xl border bg-card p-4 transition-colors",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-sm hover:shadow-md",
        interactive: "hover:border-primary/40 cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ProgressItem {
  label: string;
  value: number | string;
  change?: string;
  changeType?: "increase" | "decrease";
  icon?: React.ComponentType<{ className?: string }>;
  color?: "primary" | "success" | "warning" | "danger" | "muted";
  accent?: boolean;
}

interface ProgressCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  items: ProgressItem[];
  showBars?: boolean;
  variant?: "default" | "elevated" | "interactive";
  className?: string;
}

const colorClasses = {
  primary: "text-primary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-rose-500",
  muted: "text-muted-foreground",
};

const barColors = {
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  muted: "bg-muted-foreground",
};

export function ProgressCard({
  title,
  description,
  items,
  showBars = true,
  variant = "default",
  className,
}: ProgressCardProps) {
  return (
    <div className={cn(progressCardVariants({ variant }), className)}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const Icon = item.icon;
          const colorClass = colorClasses[item.color ?? "muted"];
          const barColor = barColors[item.color ?? "muted"];
          const pct = typeof item.value === "number" ? Math.min(item.value, 100) : 0;
          const isNum = typeof item.value === "number";

          return (
            <div key={i}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {Icon && (
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-md bg-muted/40", colorClass)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.change && (
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        item.changeType === "increase" ? "text-emerald-500" : item.changeType === "decrease" ? "text-rose-500" : "text-muted-foreground"
                      )}
                    >
                      {item.change}
                    </span>
                  )}
                  <span className="text-xs font-bold tabular-nums text-right min-w-[3ch]">{item.value}{isNum && "%"}</span>
                </div>
              </div>
              {showBars && isNum && (
                <div className="mt-1.5 h-2 w-full min-w-[40px] rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", barColor, item.accent && "shadow")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
