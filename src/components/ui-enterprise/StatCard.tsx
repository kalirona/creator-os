import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="text-xl opacity-70">{icon}</div>}
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
