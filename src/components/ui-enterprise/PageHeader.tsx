import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("page-header mb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="breadcrumb" className="mb-2 flex items-center gap-1">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
              {b.href ? (
                <a href={b.href} className="text-xs text-muted-foreground hover:text-foreground transition">
                  {b.label}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      {eyebrow && <p className="eyebrow mb-1 text-xs font-semibold uppercase text-primary tracking-wider">{eyebrow}</p>}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
