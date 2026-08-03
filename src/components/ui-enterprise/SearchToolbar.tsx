import * as React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchToolbarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

export function SearchToolbar({
  placeholder = "Search...",
  value,
  onChange,
  onSearch,
  className,
}: SearchToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch && value !== undefined) {
      onSearch(value);
    }
  };

  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-4"
      />
    </div>
  );
}
