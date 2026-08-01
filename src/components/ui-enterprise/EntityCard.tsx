import * as React from "react";
import { cn } from "@/lib/utils";

interface EntityCardProps {
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  status?: "draft" | "published" | "archived" | "error";
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  className?: string;
}

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  published: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export function EntityCard({
  id,
  title,
  description,
  icon,
  status,
  metadata,
  actions,
  selected,
  onSelect,
  onClick,
  className,
}: EntityCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md",
        selected && "ring-2 ring-primary",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-2xl opacity-70">{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground">{title}</h3>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {status && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    statusColors[status]
                  )}
                >
                  {status}
                </span>
              )}
              {actions && (
                <div
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions}
                </div>
              )}
            </div>
          </div>
          {metadata && <div className="mt-3">{metadata}</div>}
        </div>
      </div>
    </div>
  );
}
