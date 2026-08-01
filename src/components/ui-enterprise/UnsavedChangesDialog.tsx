import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Save } from "lucide-react";

interface UnsavedChangesDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: () => void;
  onDiscard?: () => void;
  onCancel?: () => void;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Save className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
              <AlertDialogDescription>
                Your changes will be lost if you leave this page. What would you like to do?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Stay</AlertDialogCancel>
          {onDiscard && (
            <AlertDialogAction
              onClick={onDiscard}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Discard
            </AlertDialogAction>
          )}
          {onSave && (
            <AlertDialogAction onClick={onSave}>
              Save Changes
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
