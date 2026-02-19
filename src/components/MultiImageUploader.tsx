import { useRef, useState } from 'react';
import { Plus, X, Star, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ItemImage } from '@/hooks/useItemImages';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface StagedImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  file: File;
}

interface MultiImageUploaderProps {
  images: ItemImage[];
  onUpload: (file: File, isPrimary?: boolean) => Promise<string | null>;
  onDelete: (imageId: string) => Promise<void>;
  onSetPrimary: (imageId: string) => Promise<void>;
  onReorder?: (reorderedImages: ItemImage[]) => Promise<void>;
  disabled?: boolean;
  // Staging mode: used on create form — files are held locally, not uploaded immediately
  stagingMode?: boolean;
  stagedImages?: StagedImage[];
  onStageFiles?: (files: File[]) => void;
  onRemoveStaged?: (id: string) => void;
  onSetStagedPrimary?: (id: string) => void;
  onReorderStaged?: (reordered: StagedImage[]) => void;
}

export type { StagedImage };

export function MultiImageUploader({
  images,
  onUpload,
  onDelete,
  onSetPrimary,
  onReorder,
  disabled = false,
  stagingMode = false,
  stagedImages = [],
  onStageFiles,
  onRemoveStaged,
  onSetStagedPrimary,
  onReorderStaged,
}: MultiImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (stagingMode && onStageFiles) {
      onStageFiles(Array.from(files));
    } else {
      setUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          await onUpload(files[i], images.length === 0 && i === 0);
        }
      } finally {
        setUploading(false);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setViewerOpen(true);
  };

  // --- Staged drag handlers ---
  const handleStagedDragStart = (id: string) => {
    dragIdRef.current = id;
  };

  const handleStagedDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleStagedDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId || !onReorderStaged) {
      setDragOverId(null);
      return;
    }
    const fromIdx = stagedImages.findIndex(img => img.id === sourceId);
    const toIdx = stagedImages.findIndex(img => img.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDragOverId(null); return; }
    const reordered = [...stagedImages];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onReorderStaged(reordered);
    dragIdRef.current = null;
    setDragOverId(null);
  };

  // --- Existing images drag handlers ---
  const handleExistingDragStart = (id: string) => {
    dragIdRef.current = id;
  };

  const handleExistingDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleExistingDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId || !onReorder) {
      setDragOverId(null);
      return;
    }
    const fromIdx = images.findIndex(img => img.id === sourceId);
    const toIdx = images.findIndex(img => img.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDragOverId(null); return; }
    const reordered = [...images];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onReorder(reordered);
    dragIdRef.current = null;
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    dragIdRef.current = null;
    setDragOverId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Staged Images (create mode) */}
        {stagingMode && stagedImages.map((image) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => handleStagedDragStart(image.id)}
            onDragOver={(e) => handleStagedDragOver(e, image.id)}
            onDrop={(e) => handleStagedDrop(e, image.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative w-24 h-24 rounded-lg overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all",
              image.is_primary ? "border-primary ring-2 ring-primary/20" : "border-border",
              dragOverId === image.id && dragIdRef.current !== image.id && "ring-2 ring-primary scale-105"
            )}
          >
            <img
              src={image.image_url}
              alt="Product"
              className="w-full h-full object-cover hover:opacity-80 transition-opacity"
              onClick={() => handleImageClick(image.image_url)}
              draggable={false}
            />
            {image.is_primary && (
              <div className="absolute top-1 left-1">
                <Star className="h-4 w-4 text-primary fill-primary drop-shadow-md" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {!image.is_primary && onSetStagedPrimary && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); onSetStagedPrimary(image.id); }}
                  title="Set as primary"
                >
                  <Star className="h-3 w-3" />
                </Button>
              )}
              {onRemoveStaged && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); onRemoveStaged(image.id); }}
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Existing Images (edit mode) */}
        {!stagingMode && images.map((image) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => handleExistingDragStart(image.id)}
            onDragOver={(e) => handleExistingDragOver(e, image.id)}
            onDrop={(e) => handleExistingDrop(e, image.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative w-24 h-24 rounded-lg overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all",
              image.is_primary ? "border-primary ring-2 ring-primary/20" : "border-border",
              dragOverId === image.id && dragIdRef.current !== image.id && "ring-2 ring-primary scale-105"
            )}
          >
            <img
              src={image.image_url}
              alt="Product"
              className="w-full h-full object-cover hover:opacity-80 transition-opacity"
              onClick={() => handleImageClick(image.image_url)}
              draggable={false}
            />
            
            {/* Primary Badge */}
            {image.is_primary && (
              <div className="absolute top-1 left-1">
                <Star className="h-4 w-4 text-primary fill-primary drop-shadow-md" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {!image.is_primary && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetPrimary(image.id);
                  }}
                  title="Set as primary"
                >
                  <Star className="h-3 w-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
                title="Delete image"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        {/* Upload Button */}
        <div
          className={cn(
            "w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <Plus className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Add Images
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPG up to 5MB. Drag to reorder. First image or starred becomes primary.
        </p>
      </div>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        imageUrl={selectedImage}
        alt="Product preview"
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}
