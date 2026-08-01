import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
  className,
}: MetricCardProps) {
  const changeColor = {
    increase: "text-green-600",
    decrease: "text-red-600",
    neutral: "text-muted-foreground",
  };

  const ChangeIcon = changeType === "increase" ? TrendingUp : changeType === "decrease" ? TrendingDown : null;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <div className={cn("flex items-center gap-1 text-sm", changeColor[changeType])}>
              {ChangeIcon && <ChangeIcon className="h-4 w-4" />}
              <span>{change}</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {icon && <div className="text-2xl opacity-60">{icon}</div>}
      </div>
    </div>
  );
}
