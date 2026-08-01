import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SplitLayoutProps {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
  leftWidth?: number;
  rightWidth?: number;
  leftCollapsed?: boolean;
  rightCollapsed?: boolean;
  onLeftCollapse?: (collapsed: boolean) => void;
  onRightCollapse?: (collapsed: boolean) => void;
  className?: string;
}

export function SplitLayout({
  left,
  center,
  right,
  leftWidth = 240,
  rightWidth = 320,
  leftCollapsed = false,
  rightCollapsed = false,
  onLeftCollapse,
  onRightCollapse,
  className,
}: SplitLayoutProps) {
  return (
    <div className={cn("flex h-full w-full", className)}>
      {left && (
        <>
          <div
            className={cn(
              "flex h-full flex-col border-r bg-card transition-all duration-300",
              leftCollapsed ? "w-12" : `${leftWidth}px`
            )}
          >
            {left}
          </div>
          {onLeftCollapse && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border"
              onClick={() => onLeftCollapse(!leftCollapsed)}
            >
              {leftCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
          )}
        </>
      )}

      <div className="flex-1 overflow-hidden">{center}</div>

      {right && (
        <>
          <div
            className={cn(
              "flex h-full flex-col border-l bg-card transition-all duration-300",
              rightCollapsed ? "w-12" : `${rightWidth}px`
            )}
          >
            {right}
          </div>
          {onRightCollapse && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1/2 right-0 -translate-y-1/2 z-10 h-6 w-6 rounded-full border"
              onClick={() => onRightCollapse(!rightCollapsed)}
            >
              {rightCollapsed ? (
                <ChevronLeft className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
