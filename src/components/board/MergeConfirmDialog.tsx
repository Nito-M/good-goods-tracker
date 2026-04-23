import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface MergeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cellCount: number;
  hasMultipleNonEmpty: boolean;
  /** Called with the user's choice for what to do with content */
  onConfirm: (mode: 'keep-top-left' | 'concatenate') => void;
}

export function MergeConfirmDialog({
  open,
  onOpenChange,
  cellCount,
  hasMultipleNonEmpty,
  onConfirm,
}: MergeConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Merge {cellCount} cells?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasMultipleNonEmpty ? (
              <>
                Several of the selected cells contain content. Choose how to handle it. Merging is
                display-only — your underlying data is preserved either way.
              </>
            ) : (
              <>The selected cells will be visually merged. This is display-only.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {hasMultipleNonEmpty && (
            <Button
              variant="outline"
              onClick={() => {
                onConfirm('concatenate');
                onOpenChange(false);
              }}
            >
              Show all values
            </Button>
          )}
          <AlertDialogAction
            onClick={() => {
              onConfirm('keep-top-left');
            }}
          >
            Show top-left only
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
