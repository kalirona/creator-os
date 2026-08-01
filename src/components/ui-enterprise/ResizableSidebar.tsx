import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: "left" | "right";
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
}

export function ResizableSidebar({
  children,
  defaultWidth = 240,
  minWidth = 200,
  maxWidth = 400,
  side = "left",
  collapsible = false,
  collapsed = false,
  onCollapse,
  className,
}: ResizableSidebarProps) {
  const [width, setWidth] = React.useState(defaultWidth);
  const [isResizing, setIsResizing] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!collapsible && !sidebarRef.current) return;
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarRef.current?.offsetWidth || defaultWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = side === "left" ? startWidth + (e.clientX - startX) : startWidth - (e.clientX - startX);
      setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (collapsed) {
    return (
      <div className={cn("flex h-full w-12 flex-col border bg-card", className)}>
        {children}
        {onCollapse && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border"
            onClick={() => onCollapse(false)}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      className={cn("flex h-full flex-col border bg-card transition-all", className)}
      style={{ width: `${width}px` }}
    >
      {children}
      {collapsible && onCollapse && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border"
          onClick={() => onCollapse(true)}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
      )}
      {!collapsible && (
        <div
          className="absolute top-0 bottom-0 -z-1 cursor-col-resize touch-none"
          style={{ [side === "left" ? "right": "left"]: 0 }}
          onMouseDown={handleMouseDown}
        />
      )}
      {isResizing && <div className="pointer-events-none fixed inset-0 z-50 bg-transparent" />}
    </div>
  );
}
