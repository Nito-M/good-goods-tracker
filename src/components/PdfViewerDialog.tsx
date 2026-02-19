import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerDialogProps {
  pdfUrl: string | null;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PdfViewerDialog({ pdfUrl, title, open, onOpenChange }: PdfViewerDialogProps) {
  if (!pdfUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
          <span className="text-sm font-medium truncate">{title || 'PDF Preview'}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <iframe
          src={pdfUrl}
          className="flex-1 w-full"
          title={title || 'PDF Preview'}
        />
      </DialogContent>
    </Dialog>
  );
}
