import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { ItemImage } from '@/hooks/useItemImages';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Star } from 'lucide-react';

interface ItemImageGalleryProps {
  images: ItemImage[];
  itemName: string;
  fallbackImageUrl?: string | null;
}

export function ItemImageGallery({ images, itemName, fallbackImageUrl }: ItemImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const getUrl = (img: ItemImage) => img.signed_url || img.image_url;

  // Combine gallery images with fallback single image
  const allImages = images.length > 0 
    ? images 
    : fallbackImageUrl 
      ? [{ id: 'fallback', image_url: fallbackImageUrl, is_primary: true } as ItemImage]
      : [];

  const primaryImage = allImages.find(img => img.is_primary) || allImages[0];
  const thumbnailImages = allImages.slice(0, 6); // Show max 6 thumbnails

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setViewerOpen(true);
  };

  if (allImages.length === 0) {
    return (
      <div className="aspect-square w-full max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="aspect-square w-full max-w-md mx-auto bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
        onClick={() => primaryImage && handleImageClick(getUrl(primaryImage))}
      >
        <img
          src={primaryImage ? getUrl(primaryImage) : undefined}
          alt={itemName}
          className="w-full h-full object-contain"
        />
        {primaryImage?.is_primary && allImages.length > 1 && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 gap-1 bg-background/80 backdrop-blur-sm"
          >
            <Star className="h-3 w-3 fill-current" />
            Primary
          </Badge>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
            Click to enlarge
          </span>
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {thumbnailImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleImageClick(getUrl(image))}
              className={cn(
                "w-16 h-16 rounded-md overflow-hidden border-2 transition-all hover:opacity-80",
                image.is_primary 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <img
                src={getUrl(image)}
                alt={`${itemName} - Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {allImages.length > 6 && (
            <div 
              className="w-16 h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center bg-muted cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => primaryImage && handleImageClick(getUrl(primaryImage))}
            >
              <span className="text-xs font-medium text-muted-foreground">
                +{allImages.length - 6}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        imageUrl={selectedImage}
        alt={itemName}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}
