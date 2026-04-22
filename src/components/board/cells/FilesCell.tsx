import { useRef } from 'react';
import { Plus, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoardCellFile } from '@/hooks/useBoardCellFiles';

interface FilesCellProps {
  files: BoardCellFile[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpen: (id: string) => Promise<string | null>;
}

export function FilesCell({ files, onUpload, onDelete, onOpen }: FilesCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fl: FileList | null) => {
    if (!fl) return;
    for (const f of Array.from(fl)) {
      await onUpload(f);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleOpen = async (id: string) => {
    const url = await onOpen(id);
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
      {files.map((f) => (
        <div
          key={f.id}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs max-w-[200px]"
        >
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
          <button
            onClick={() => handleOpen(f.id)}
            className="truncate hover:underline"
            title={f.file_name}
          >
            {f.file_name}
          </button>
          <button
            onClick={() => handleOpen(f.id)}
            className="text-muted-foreground hover:text-foreground"
            title="Open"
          >
            <Download className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(f.id)}
            className="text-muted-foreground hover:text-destructive"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => inputRef.current?.click()}
        title="Upload PDF"
      >
        <Plus className="h-3 w-3" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
