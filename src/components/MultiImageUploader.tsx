import { useRef, useState } from 'react';
import { Plus, X, Star, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ItemImage } from '@/hooks/useItemImages';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface MultiImageUploaderProps {
  images: ItemImage[];
  onUpload: (file: File, isPrimary?: boolean) => Promise<string | null>;
  onDelete: (imageId: string) => Promise<void>;
  onSetPrimary: (imageId: string) => Promise<void>;
  disabled?: boolean;
}

export function MultiImageUploader({
  images,
  onUpload,
  onDelete,
  onSetPrimary,
  disabled = false,
}: MultiImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i], images.length === 0 && i === 0);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Existing Images */}
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              "relative w-24 h-24 rounded-lg overflow-hidden border-2 group",
              image.is_primary ? "border-primary ring-2 ring-primary/20" : "border-border"
            )}
          >
            <img
              src={image.image_url}
              alt="Product"
              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleImageClick(image.image_url)}
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
          PNG, JPG up to 5MB. First image or starred becomes primary.
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
