import * as React from "react";

interface AppPageProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

export function AppPage({ children, className, maxWidth = "7xl" }: AppPageProps) {
  return (
    <div className={`mx-auto w-full ${maxWidthClasses[maxWidth]} ${className || ""}`}>
      {children}
    </div>
  );
}
