import * as React from "react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string | number;
  title: React.ReactNode;
  description?: React.ReactNode;
  time: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  status?: "primary" | "success" | "warning" | "danger" | "muted";
  action?: React.ReactNode;
}

interface ActivityTimelineProps {
  items: ActivityItem[];
  density?: "default" | "compact";
  className?: string;
}

const statusClasses = {
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  muted: "bg-muted-foreground/40",
};

const statusColors = {
  primary: "text-primary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-rose-500",
  muted: "text-muted-foreground",
};

export function ActivityTimeline({ items, density = "default", className }: ActivityTimelineProps) {
  return (
    <div className={cn("activity-timeline space-y-0", className)}>
      {items.map((item, index) => {
        const status = item.status ?? "muted";
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} className={cn("flex items-start gap-2.5", density === "compact" ? "py-1.5" : "py-2")}>
            <div className="relative flex flex-col items-center flex-shrink-0">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full ring-2 ring-background",
                  statusClasses[status]
                )}
              />
              {!isLast && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            <div className="flex-1 min-w-0">
              {item.icon && (
                <div className="mb-1 flex items-center gap-1.5">
                  <item.icon className={cn("h-4 w-4", statusColors[status])} />
                </div>
              )}
              <div className="space-y-0.5">
                <p className="font-medium leading-tight text-sm">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
            </div>
            {item.action && <div className="flex items-center flex-shrink-0">{item.action}</div>}
          </div>
        );
      })}
    </div>
  );
}
