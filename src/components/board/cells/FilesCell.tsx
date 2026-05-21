import { useRef, useState, useEffect, useCallback } from 'react';
import { Plus, X, FileText, Download, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BoardCellFile } from '@/hooks/useBoardCellFiles';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PendingUpload {
  id: string;
  name: string;
  progress: number;
}

interface FilesCellProps {
  files: BoardCellFile[];
  pendingUploads?: PendingUpload[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpen: (id: string) => Promise<string | null>;
  onUpdateCaption?: (id: string, caption: string) => Promise<void>;
  onReorder?: (orderedIds: string[]) => Promise<void>;
  readOnly?: boolean;
}

const isImageFile = (f: BoardCellFile) => {
  const name = f.file_name.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/.test(name);
};

function SortableThumb({
  file,
  url,
  onClick,
  onDelete,
  readOnly,
}: {
  file: BoardCellFile;
  url: string | undefined;
  onClick: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group rounded-lg overflow-hidden border border-border bg-muted',
        'transition-shadow hover:shadow-md hover:border-primary/40'
      )}
      {...attributes}
      {...listeners}
    >
      {url ? (
        <img
          src={url}
          alt={file.file_name}
          title={file.caption || file.file_name}
          loading="lazy"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="h-16 w-16 object-cover cursor-pointer block"
          draggable={false}
        />
      ) : (
        <div className="h-16 w-16 animate-pulse bg-muted" />
      )}
      {!readOnly && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
          title="Remove"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

export function FilesCell({
  files,
  pendingUploads = [],
  onUpload,
  onDelete,
  onOpen,
  onUpdateCaption,
  onReorder,
  readOnly,
}: FilesCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Sort by display_order locally so reorders feel instant
  const sortedFiles = [...files].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  const images = sortedFiles.filter(isImageFile);
  const docs = sortedFiles.filter((f) => !isImageFile(f));

  // Resolve fresh signed URLs for image previews
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = images.filter((f) => !thumbUrls[f.id]);
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
  }, [images.map((f) => f.id).join(',')]);

  const handleFiles = useCallback(
    async (fl: FileList | File[] | null) => {
      if (!fl) return;
      for (const f of Array.from(fl)) {
        await onUpload(f);
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [onUpload]
  );

  // Clipboard paste support: when this cell is focused/hovered, intercept paste
  useEffect(() => {
    if (readOnly) return;
    const el = rootRef.current;
    if (!el) return;
    const handler = (e: ClipboardEvent) => {
      if (!el.matches(':hover') && !el.contains(document.activeElement)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) pasted.push(f);
        }
      }
      if (pasted.length) {
        e.preventDefault();
        handleFiles(pasted);
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [handleFiles, readOnly]);

  const handleOpen = async (id: string) => {
    const url = await onOpen(id);
    if (url) window.open(url, '_blank');
  };

  const openViewer = async (file: BoardCellFile) => {
    const idx = images.findIndex((f) => f.id === file.id);
    if (idx >= 0) setViewerIdx(idx);
    if (!thumbUrls[file.id]) {
      const url = await onOpen(file.id);
      if (url) setThumbUrls((p) => ({ ...p, [file.id]: url }));
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (!onReorder || !e.over || e.active.id === e.over.id) return;
    const oldIdx = images.findIndex((f) => f.id === e.active.id);
    const newIdx = images.findIndex((f) => f.id === e.over!.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(images, oldIdx, newIdx);
    // Persist as: reordered images + existing docs (docs stay after images)
    onReorder([...reordered.map((f) => f.id), ...docs.map((f) => f.id)]);
  };

  const onDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  const currentImage = viewerIdx !== null ? images[viewerIdx] : null;
  const currentUrl = currentImage ? thumbUrls[currentImage.id] : undefined;

  // Swipe support on viewer
  const swipeStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    swipeStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipeStart.current === null || viewerIdx === null) return;
    const dx = e.changedTouches[0].clientX - swipeStart.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && viewerIdx < images.length - 1) setViewerIdx(viewerIdx + 1);
      if (dx > 0 && viewerIdx > 0) setViewerIdx(viewerIdx - 1);
    }
    swipeStart.current = null;
  };

  // Keyboard arrows in viewer
  useEffect(() => {
    if (viewerIdx === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && viewerIdx < images.length - 1) setViewerIdx(viewerIdx + 1);
      if (e.key === 'ArrowLeft' && viewerIdx > 0) setViewerIdx(viewerIdx - 1);
      if (e.key === 'Escape') setViewerIdx(null);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [viewerIdx, images.length]);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onDragOver={(e) => {
        if (readOnly) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDropZone}
      className={cn(
        'flex flex-wrap items-start gap-2 px-2 py-1.5 rounded-md transition-colors',
        dragOver && 'bg-primary/5 ring-1 ring-primary/40'
      )}
    >
      {/* Image gallery — sortable */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={images.map((f) => f.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-1.5">
              {images.map((f) => (
                <SortableThumb
                  key={f.id}
                  file={f}
                  url={thumbUrls[f.id]}
                  onClick={() => openViewer(f)}
                  onDelete={() => onDelete(f.id)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Document chips */}
      {docs.map((f) => (
        <div
          key={f.id}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs max-w-[200px]"
        >
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
          <button onClick={() => handleOpen(f.id)} className="truncate hover:underline" title={f.file_name}>
            {f.file_name}
          </button>
          <button onClick={() => handleOpen(f.id)} className="text-muted-foreground hover:text-foreground" title="Open">
            <Download className="h-3 w-3" />
          </button>
          {!readOnly && (
            <button onClick={() => onDelete(f.id)} className="text-muted-foreground hover:text-destructive" title="Remove">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* In-flight uploads */}
      {pendingUploads.map((u) => (
        <div
          key={u.id}
          className="h-16 w-16 rounded-lg border border-dashed border-primary/40 bg-muted/60 flex flex-col items-center justify-center gap-1 px-1"
        >
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Progress value={u.progress} className="h-1 w-12" />
        </div>
      ))}

      {!readOnly && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg border border-dashed border-border hover:border-primary/40"
            onClick={() => inputRef.current?.click()}
            title="Upload image or file (drag, drop, or paste also works)"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf,image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}
      {readOnly && sortedFiles.length === 0 && (
        <span className="text-xs text-muted-foreground px-1">—</span>
      )}

      {/* Fullscreen viewer */}
      <Dialog open={viewerIdx !== null} onOpenChange={(o) => !o && setViewerIdx(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background">
          {currentImage && (
            <div
              className="relative flex flex-col bg-background"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="relative flex items-center justify-center bg-black/95 min-h-[60vh] max-h-[80vh]">
                {currentUrl ? (
                  <img
                    src={currentUrl}
                    alt={currentImage.file_name}
                    className="max-h-[80vh] max-w-full object-contain"
                  />
                ) : (
                  <div className="h-64 w-64 animate-pulse bg-muted rounded" />
                )}
                {images.length > 1 && viewerIdx! > 0 && (
                  <button
                    onClick={() => setViewerIdx(viewerIdx! - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {images.length > 1 && viewerIdx! < images.length - 1 && (
                  <button
                    onClick={() => setViewerIdx(viewerIdx! + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="p-3 space-y-2 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{currentImage.file_name}</span>
                  <span>
                    {viewerIdx! + 1} / {images.length}
                  </span>
                </div>
                {onUpdateCaption && !readOnly && (
                  <Input
                    placeholder="Add a caption (optional)"
                    defaultValue={currentImage.caption || ''}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (currentImage.caption || '')) {
                        onUpdateCaption(currentImage.id, v);
                      }
                    }}
                    className="h-8 text-sm"
                  />
                )}
                {readOnly && currentImage.caption && (
                  <p className="text-sm text-foreground">{currentImage.caption}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
