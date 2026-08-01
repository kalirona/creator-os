import * as React from "react";
import { cn } from "@/lib/utils";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
}

export function AppCard({
  className,
  variant = "default",
  padding = "md",
  children,
  ...props
}: AppCardProps) {
  const variantClasses = {
    default: "bg-card border",
    elevated: "bg-card shadow-md border",
    bordered: "bg-card border-2",
  };

  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-xl transition-shadow",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
