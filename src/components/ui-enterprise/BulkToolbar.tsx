import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

interface BulkToolbarProps {
  selectedCount: number;
  totalCount?: number;
  onSelectAll?: () => void;
  onSelectNone?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function BulkToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onSelectNone,
  actions,
  className,
}: BulkToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {selectedCount} selected
          {totalCount && ` of ${totalCount}`}
        </span>
        {onSelectNone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectNone}
            className="h-6 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
