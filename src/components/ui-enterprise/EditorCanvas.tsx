import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Save, Send, Eye, History } from "lucide-react";

interface EditorCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function EditorCanvas({ children, className }: EditorCanvasProps) {
  return (
    <div
      className={cn(
        "relative flex-1 overflow-auto bg-background",
        className
      )}
    >
      <div className="mx-auto max-w-4xl p-8">{children}</div>
    </div>
  );
}

interface PublishToolbarProps {
  status?: "draft" | "published" | "saving" | "error";
  lastSaved?: Date;
  hasChanges?: boolean;
  onSave?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onHistory?: () => void;
  className?: string;
}

export function PublishToolbar({
  status = "draft",
  lastSaved,
  hasChanges = false,
  onSave,
  onPreview,
  onPublish,
  onUnpublish,
  onHistory,
  className,
}: PublishToolbarProps) {
  const statusText = {
    draft: "Draft",
    published: "Published",
    saving: "Saving...",
    error: "Error",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t bg-card px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            status === "published" && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
            status === "draft" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
            status === "saving" && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
            status === "error" && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
          )}
        >
          {statusText[status]}
        </span>
        {lastSaved && status !== "saving" && status !== "error" && (
          <span className="text-xs text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
        {hasChanges && status !== "saving" && (
          <span className="text-xs text-orange-600">• Unsaved changes</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onHistory && (
          <Button variant="ghost" size="sm" onClick={onHistory}>
            <History className="h-4 w-4" />
          </Button>
        )}
        {onPreview && (
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}
        {onSave && (
          <Button variant="outline" size="sm" onClick={onSave} disabled={status === "saving"}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        )}
        {status === "published" ? (
          onUnpublish && (
            <Button variant="outline" size="sm" onClick={onUnpublish}>
              Unpublish
            </Button>
          )
        ) : (
          onPublish && (
            <Button size="sm" onClick={onPublish}>
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )
        )}
      </div>
    </div>
  );
}
