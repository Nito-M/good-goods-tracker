import { useState, useRef, useCallback } from 'react';
import { Camera, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import type { StepImage } from '@/hooks/useStepImages';

interface Props {
  stepId: string;
  images: StepImage[];
  onUpload: (stepId: string, file: File) => Promise<string | null>;
  onDelete: (imageId: string, imagePath: string) => Promise<void>;
}

export function StepImageUploader({ stepId, images, onUpload, onDelete }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      await onUpload(stepId, file);
    }
    setUploading(false);
  }, [stepId, onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  return (
    <div className="space-y-2">
      {/* Existing images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(img => (
            <div key={img.id} className="relative group">
              <img
                src={img.signedUrl || ''}
                alt="Step"
                className="h-16 w-16 object-cover rounded-md border border-border cursor-pointer"
                onClick={() => setViewerUrl(img.signedUrl)}
              />
              <button
                onClick={() => onDelete(img.id, img.imageUrl)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone + buttons */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`flex items-center gap-2 p-2 rounded-md border border-dashed transition-colors ${
          dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
        }`}
      >
        <span className="text-xs text-muted-foreground flex-1">
          {uploading ? 'Uploading...' : 'Drop images here or'}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={uploading}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="h-3 w-3" /> Photo
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>

      <ImageViewerDialog imageUrl={viewerUrl} alt="Step image" open={!!viewerUrl} onOpenChange={open => !open && setViewerUrl(null)} />
    </div>
  );
}
