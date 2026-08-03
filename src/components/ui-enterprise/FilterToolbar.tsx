import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";

interface FilterOption {
  key: string;
  label: string;
  active: boolean;
}

interface FilterToolbarProps {
  options: FilterOption[];
  onChange: (options: FilterOption[]) => void;
  className?: string;
}

export function FilterToolbar({
  options,
  onChange,
  className,
}: FilterToolbarProps) {
  const activeCount = options.filter((o) => o.active).length;

  const handleToggle = (key: string) => {
    onChange(
      options.map((o) =>
        o.key === key ? { ...o, active: !o.active } : o
      )
    );
  };

  const handleClear = () => {
    onChange(options.map((o) => ({ ...o, active: false })));
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-4 w-4 mr-1" />
            Filter
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-primary w-1.5 h-1.5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.key}
              checked={option.active}
              onCheckedChange={() => handleToggle(option.key)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 px-2"
        >
          <X className="h-3 w-3 mr-1" />
          Clear ({activeCount})
        </Button>
      )}
    </div>
  );
}
