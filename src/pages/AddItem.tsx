import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InventoryItem, Dimensions, QuantityUnit, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ItemVendorPricing } from '@/components/ItemVendorPricing';
import { ItemTagSelector } from '@/components/ItemTagSelector';
import { MultiImageUploader, StagedImage } from '@/components/MultiImageUploader';
import { useVendors, Vendor } from '@/hooks/useVendors';
import { useItemVendorPrices, ItemVendorPrice } from '@/hooks/useItemVendorPrices';
import { useItemImages } from '@/hooks/useItemImages';
import { useItemTags } from '@/hooks/useItemTags';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface VendorPriceEntry {
  vendorId: string;
  price: string;
  link?: string;
  vendorSku?: string;
  isNew?: boolean;
}

interface AddItemPageProps {
  categories: string[];
  onSave: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  onUpdate?: (id: string, updates: Partial<InventoryItem>) => void;
  onDelete?: (id: string) => void;
  items: InventoryItem[];
  uploadItemImage?: (file: File) => Promise<string | null>;
}

const DEFAULT_DIMENSIONS: Dimensions = { length: 0, width: 0, height: 0, unit: 'in' };

export function AddItemPage({ categories, onSave, onUpdate, onDelete, items, uploadItemImage }: AddItemPageProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const editItem = id ? items.find(item => item.id === id) : null;
  const isEditing = !!editItem;
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vendor and pricing hooks
  const { vendors } = useVendors();
  const { prices: existingPrices, upsertPrice, deletePrice } = useItemVendorPrices(editItem?.id);
  const { selectedTagIds, setTagsForItem } = useItemTags(editItem?.id);
  // Multi-image support for editing mode
  const { 
    images: itemImages, 
    uploadImage: uploadItemImageToGallery, 
    uploadImageForItem,
    deleteImage: deleteItemImage, 
    setPrimaryImage,
    reorderImages,
  } = useItemImages(editItem?.id);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || 'Other');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>('pcs');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [minStock, setMinStock] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [dimensions, setDimensions] = useState<Dimensions>(DEFAULT_DIMENSIONS);
  const [colors, setColors] = useState('');
  const [description, setDescription] = useState('');
  const [vendorPrices, setVendorPrices] = useState<VendorPriceEntry[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isSavingVendors, setIsSavingVendors] = useState(false);
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([]);
  // Staged images for new item creation (before saving)
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setSku(editItem.sku);
      setCategory(editItem.category);
      setQuantity(String(editItem.quantity));
      setQuantityUnit(editItem.quantityUnit || 'pcs');
      setPrice(String(editItem.price));
      setCost(String(editItem.cost));
      setMinStock(String(editItem.minStock));
      setWeight(String(editItem.weight));
      setWeightUnit(editItem.weightUnit);
      setDimensions(editItem.dimensions);
      setColors(editItem.colors.join(', '));
      setDescription(editItem.description);
      if (editItem.imageUrl) {
        setImageUrl(editItem.imageUrl);
        setImagePreview(editItem.imageUrl);
      }
    }
  }, [editItem]);

  // Sync pending tags from loaded item tags
  useEffect(() => {
    if (isEditing && selectedTagIds.length > 0) {
      setPendingTagIds(selectedTagIds);
    }
  }, [isEditing, selectedTagIds]);

  // Initialize vendor prices from existing data when editing
  useEffect(() => {
    if (isEditing && existingPrices.length > 0 && vendorPrices.length === 0) {
      setVendorPrices(
        existingPrices.map((p) => ({
          vendorId: p.vendor_id,
          price: String(p.price),
          link: p.link || '',
          vendorSku: p.vendor_sku || '',
          isNew: false,
        }))
      );
    }
  }, [isEditing, existingPrices, vendorPrices.length]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Staging mode handlers for new item creation
  const handleStageFiles = useCallback((files: File[]) => {
    setStagedImages(prev => {
      const newStaged = files.map((file, i) => ({
        id: crypto.randomUUID(),
        image_url: URL.createObjectURL(file),
        is_primary: prev.length === 0 && i === 0,
        file,
      }));
      return [...prev, ...newStaged];
    });
  }, []);

  const handleRemoveStaged = useCallback((id: string) => {
    setStagedImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // If we removed the primary, make the first one primary
      if (filtered.length > 0 && !filtered.some(img => img.is_primary)) {
        return filtered.map((img, i) => ({ ...img, is_primary: i === 0 }));
      }
      return filtered;
    });
  }, []);

  const handleSetStagedPrimary = useCallback((id: string) => {
    setStagedImages(prev => prev.map(img => ({ ...img, is_primary: img.id === id })));
  }, []);

  const handleReorderStaged = useCallback((reordered: StagedImage[]) => {
    setStagedImages(reordered);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalImageUrl = imageUrl;

    // Upload new image if selected
    if (imageFile && uploadItemImage) {
      setUploadingImage(true);
      const uploadedUrl = await uploadItemImage(imageFile);
      setUploadingImage(false);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }
    
    const itemData = {
      name,
      sku,
      category,
      quantity: parseFloat(quantity) || 0,
      quantityUnit,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      minStock: parseFloat(minStock) || 0,
      weight: parseFloat(weight) || 0,
      weightUnit,
      dimensions,
      colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
      description,
      imageUrl: finalImageUrl,
    };

    if (editItem && onUpdate) {
      onUpdate(editItem.id, itemData);
      navigate(`/item/${editItem.id}`);
      
      // Handle vendor price updates
      const currentVendorIds = vendorPrices.map((vp) => vp.vendorId);
      const existingVendorIds = existingPrices.map((p) => p.vendor_id);
      
      // Delete removed vendors
      for (const vendorId of existingVendorIds) {
        if (!currentVendorIds.includes(vendorId)) {
          await deletePrice(vendorId);
        }
      }
      
      // Upsert current vendor prices
      for (const vp of vendorPrices) {
        if (vp.price) {
          await upsertPrice(vp.vendorId, parseFloat(vp.price), vp.link, vp.vendorSku);
        }
      }

      // Fix 1: Save tag changes in edit mode
      await setTagsForItem(pendingTagIds);
    } else {
      // Creating a new item
      const newItemId = await onSave(itemData);
      
      if (newItemId) {
        // Upload staged images using the new item's ID directly
        for (const staged of stagedImages) {
          if (staged.file) {
            await uploadImageForItem(newItemId, staged.file, staged.is_primary);
          }
        }
        // Save vendor prices for new item
        for (const vp of vendorPrices) {
          if (vp.price) {
            await upsertPrice(vp.vendorId, parseFloat(vp.price), vp.link, vp.vendorSku);
          }
        }
        // Fix 2: Insert tags directly with newItemId (hook closure has undefined itemId for new items)
        if (pendingTagIds.length > 0 && user) {
          const { error } = await supabase.from('item_tags').insert(
            pendingTagIds.map((tagId) => ({
              item_id: newItemId,
              tag_id: tagId,
              user_id: user.id,
            }))
          );
          if (error) {
            console.error('Error saving tags for new item:', error);
          }
        }
        navigate('/items');
      }
    }
  };

  const handleDelete = () => {
    if (editItem && onDelete) {
      onDelete(editItem.id);
      navigate('/items');
    }
  };

  const handleSaveVendorPrices = async () => {
    if (!editItem) return;
    setIsSavingVendors(true);
    try {
      const currentVendorIds = vendorPrices.map((vp) => vp.vendorId);
      const existingVendorIds = existingPrices.map((p) => p.vendor_id);
      for (const vendorId of existingVendorIds) {
        if (!currentVendorIds.includes(vendorId)) {
          await deletePrice(vendorId);
        }
      }
      for (const vp of vendorPrices) {
        if (vp.price) {
          await upsertPrice(vp.vendorId, parseFloat(vp.price), vp.link, vp.vendorSku);
        }
      }
      toast({ title: 'Vendor prices saved successfully' });
    } catch {
      toast({ title: 'Error saving vendor prices', variant: 'destructive' });
    } finally {
      setIsSavingVendors(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
                {isEditing ? 'Edit Item' : 'Add New Item'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{editItem?.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button type="submit" form="item-form" className="gap-2">
                <Save className="h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form id="item-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. ELEC-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Product Images</Label>
                {isEditing ? (
                  /* Multi-image uploader for editing mode */
                  <MultiImageUploader
                    images={itemImages}
                    onUpload={uploadItemImageToGallery}
                    onDelete={deleteItemImage}
                    onSetPrimary={setPrimaryImage}
                    onReorder={reorderImages}
                  />
                ) : (
                  /* Staging mode for new items — previews shown, upload happens after save */
                  <MultiImageUploader
                    images={[]}
                    onUpload={async () => null}
                    onDelete={async () => {}}
                    onSetPrimary={async () => {}}
                    stagingMode
                    stagedImages={stagedImages}
                    onStageFiles={handleStageFiles}
                    onRemoveStaged={handleRemoveStaged}
                    onSetStagedPrimary={handleSetStagedPrimary}
                    onReorderStaged={handleReorderStaged}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex gap-2">
                   <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                    required
                  />
                  <Select value={quantityUnit} onValueChange={(v) => setQuantityUnit(v as QuantityUnit)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(QUANTITY_UNIT_LABELS) as QuantityUnit[]).map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {QUANTITY_UNIT_LABELS[unit]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.00001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.00001"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock Level</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Total Measurement Summary */}
          {(() => {
            const qty = parseFloat(quantity) || 0;
            const unit = quantityUnit;
            const l = dimensions.length || 0;
            const w = dimensions.width || 0;
            const dimUnit = dimensions.unit;

            // Compute total linear measurement
            const showLinear = (unit === 'ft' || unit === 'in' || unit === 'm' || unit === 'yd') && qty > 0;
            // Compute area from dimensions (L × W) × qty
            const area = l * w * qty;
            const showArea = (unit === 'sqft' || (unit === 'pcs' && l > 0 && w > 0)) && qty > 0;

            // Convert dimension area to sq ft if needed
            let areaLabel = '';
            let areaValue = 0;
            if (showArea || (l > 0 && w > 0 && qty > 0)) {
              if (dimUnit === 'in') {
                areaValue = (l * w / 144) * qty;
                areaLabel = `sq ft`;
              } else if (dimUnit === 'cm') {
                areaValue = (l * w / 929.03) * qty;
                areaLabel = `sq ft`;
              } else {
                areaValue = l * w * qty;
                areaLabel = `sq ${dimUnit}`;
              }
            }

            const hasContent =
              (showLinear && qty > 0) ||
              (areaValue > 0) ||
              (unit === 'sqft' && qty > 0);

            if (!hasContent) return null;

            return (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary">Measurement Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-6 text-sm">
                  {unit === 'sqft' && qty > 0 && (
                    <div>
                      <span className="text-muted-foreground">Total area: </span>
                      <span className="font-semibold">{qty.toLocaleString(undefined, { maximumFractionDigits: 4 })} sq ft</span>
                    </div>
                  )}
                  {showLinear && (
                    <div>
                      <span className="text-muted-foreground">Total length: </span>
                      <span className="font-semibold">{qty.toLocaleString(undefined, { maximumFractionDigits: 4 })} {QUANTITY_UNIT_LABELS[unit]?.toLowerCase()}</span>
                    </div>
                  )}
                  {areaValue > 0 && (
                    <div>
                      <span className="text-muted-foreground">Total area (L×W×qty): </span>
                      <span className="font-semibold">{areaValue.toLocaleString(undefined, { maximumFractionDigits: 4 })} {areaLabel}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Physical Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Physical Properties</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as 'lb' | 'kg')}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dimensions</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="L"
                    value={dimensions.length || ''}
                    onChange={(e) => setDimensions({ ...dimensions, length: parseFloat(e.target.value) || 0 })}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">×</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="W"
                    value={dimensions.width || ''}
                    onChange={(e) => setDimensions({ ...dimensions, width: parseFloat(e.target.value) || 0 })}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">×</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="H"
                    value={dimensions.height || ''}
                    onChange={(e) => setDimensions({ ...dimensions, height: parseFloat(e.target.value) || 0 })}
                    className="w-20"
                  />
                  <Select value={dimensions.unit} onValueChange={(v) => setDimensions({ ...dimensions, unit: v as 'in' | 'cm' })}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="cm">cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="colors">Colors (comma-separated)</Label>
                <Input
                  id="colors"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  placeholder="e.g. Black, White, Blue"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <ItemTagSelector
            selectedTagIds={pendingTagIds}
            onTagsChange={setPendingTagIds}
          />

          {/* Vendor Pricing */}
          <ItemVendorPricing
            vendors={vendors}
            existingPrices={existingPrices}
            vendorPrices={vendorPrices}
            onVendorPricesChange={setVendorPrices}
            isEditing={isEditing}
            onSave={isEditing ? handleSaveVendorPrices : undefined}
            isSaving={isSavingVendors}
          />
        </form>
      </main>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        imageUrl={imagePreview}
        alt={name || 'Product image'}
        open={showImageViewer}
        onOpenChange={setShowImageViewer}
      />
    </div>
  );
}
