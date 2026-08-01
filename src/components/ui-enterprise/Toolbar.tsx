import * as React from "react";
import { cn } from "@/lib/utils";

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "bordered";
}

export function Toolbar({
  className,
  children,
  variant = "default",
  ...props
}: ToolbarProps) {
  const variantClasses = {
    default: "bg-card border-b",
    elevated: "bg-card shadow-sm border-b",
    bordered: "bg-card border-b-2",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
