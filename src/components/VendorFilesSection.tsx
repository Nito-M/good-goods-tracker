import { useRef, useState, useEffect } from 'react';
import { Plus, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorFiles } from '@/hooks/useVendorFiles';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface Props { vendorId: string }

const isImage = (name: string) => /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i.test(name);

export function VendorFilesSection({ vendorId }: Props) {
  const { files, upload, remove, getSignedUrl } = useVendorFiles(vendorId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const imgs = files.filter((f) => isImage(f.file_name));
      const missing = imgs.filter((f) => !thumbs[f.id]);
      if (!missing.length) return;
      const entries = await Promise.all(
        missing.map(async (f) => [f.id, await getSignedUrl(f.id)] as const)
      );
      if (cancelled) return;
      setThumbs((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) if (url) next[id] = url;
        return next;
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.map((f) => f.id).join(',')]);

  const handleFiles = async (fl: FileList | null) => {
    if (!fl) return;
    setBusy(true);
    for (const f of Array.from(fl)) await upload(f);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openFile = async (id: string) => {
    const url = thumbs[id] || (await getSignedUrl(id));
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {files.map((f) => {
          if (isImage(f.file_name)) {
            const url = thumbs[f.id];
            return (
              <div key={f.id} className="relative group">
                {url ? (
                  <img
                    src={url}
                    alt={f.file_name}
                    title={f.file_name}
                    onClick={() => setViewerUrl(url)}
                    className="h-14 w-14 object-cover rounded-md border border-border cursor-pointer"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-md border border-border bg-muted animate-pulse" />
                )}
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          }
          return (
            <div key={f.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs max-w-[260px]">
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <button type="button" onClick={() => openFile(f.id)} className="truncate hover:underline" title={f.file_name}>
                {f.file_name}
              </button>
              <button type="button" onClick={() => openFile(f.id)} className="text-muted-foreground hover:text-foreground" title="Open">
                <Download className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive" title="Remove">
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Plus className="h-3.5 w-3.5" />
          {busy ? 'Uploading…' : 'Add files'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf,image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <ImageViewerDialog
        imageUrl={viewerUrl}
        alt="Preview"
        open={!!viewerUrl}
        onOpenChange={(open) => !open && setViewerUrl(null)}
      />
    </div>
  );
}
