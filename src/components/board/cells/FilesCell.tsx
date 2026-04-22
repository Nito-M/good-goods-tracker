import { useRef, useState, useEffect } from 'react';
import { Plus, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoardCellFile } from '@/hooks/useBoardCellFiles';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface FilesCellProps {
  files: BoardCellFile[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpen: (id: string) => Promise<string | null>;
}

const isImageFile = (f: BoardCellFile) => {
  const name = f.file_name.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/.test(name);
};

export function FilesCell({ files, onUpload, onDelete, onOpen }: FilesCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Resolve fresh signed URLs for image previews
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const imgs = files.filter(isImageFile);
      const missing = imgs.filter((f) => !thumbUrls[f.id]);
      if (!missing.length) return;
      const entries = await Promise.all(
        missing.map(async (f) => [f.id, await onOpen(f.id)] as const)
      );
      if (cancelled) return;
      setThumbUrls((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) if (url) next[id] = url;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.map((f) => f.id).join(',')]);

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

  const handleImageClick = async (f: BoardCellFile) => {
    const url = thumbUrls[f.id] || (await onOpen(f.id));
    if (url) setViewerUrl(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
      {files.map((f) => {
        if (isImageFile(f)) {
          const url = thumbUrls[f.id];
          return (
            <div key={f.id} className="relative group">
              {url ? (
                <img
                  src={url}
                  alt={f.file_name}
                  title={f.file_name}
                  onClick={() => handleImageClick(f)}
                  className="h-10 w-10 object-cover rounded-md border border-border cursor-pointer"
                />
              ) : (
                <div className="h-10 w-10 rounded-md border border-border bg-muted animate-pulse" />
              )}
              <button
                onClick={() => onDelete(f.id)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          );
        }
        return (
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
        );
      })}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => inputRef.current?.click()}
        title="Upload file or image"
      >
        <Plus className="h-3 w-3" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <ImageViewerDialog
        imageUrl={viewerUrl}
        alt="Preview"
        open={!!viewerUrl}
        onOpenChange={(open) => !open && setViewerUrl(null)}
      />
    </div>
  );
}
