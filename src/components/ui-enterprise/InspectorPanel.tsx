import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface InspectorPanelProps {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  scrollable?: boolean;
}

export function InspectorPanel({
  title,
  children,
  actions,
  onClose,
  className,
  scrollable = true,
}: InspectorPanelProps) {
  return (
    <div className={cn("flex h-full flex-col bg-card", className)}>
      {(title || actions || onClose) && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          {title && <h3 className="text-lg font-medium text-foreground">{title}</h3>}
          <div className="flex items-center gap-2">
            {actions}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
      <div className={cn("flex-1 overflow-y-auto p-4", !scrollable && "overflow-hidden")}>
        {children}
      </div>
    </div>
  );
}
