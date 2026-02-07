import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InventoryItem, Dimensions, QuantityUnit, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { ArrowLeft, Trash2, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
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
import { MultiImageUploader } from '@/components/MultiImageUploader';
import { useVendors, Vendor } from '@/hooks/useVendors';
import { useItemVendorPrices, ItemVendorPrice } from '@/hooks/useItemVendorPrices';
import { useItemImages } from '@/hooks/useItemImages';
import { useToast } from '@/hooks/use-toast';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface VendorPriceEntry {
  vendorId: string;
  price: string;
  link?: string;
  isNew?: boolean;
}

interface AddItemPageProps {
  categories: string[];
  onSave: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vendor and pricing hooks
  const { vendors } = useVendors();
  const { prices: existingPrices, upsertPrice, deletePrice } = useItemVendorPrices(editItem?.id);
  
  // Multi-image support for editing mode
  const { 
    images: itemImages, 
    uploadImage: uploadItemImageToGallery, 
    deleteImage: deleteItemImage, 
    setPrimaryImage 
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

  // Initialize vendor prices from existing data when editing
  useEffect(() => {
    if (isEditing && existingPrices.length > 0 && vendorPrices.length === 0) {
      setVendorPrices(
        existingPrices.map((p) => ({
          vendorId: p.vendor_id,
          price: String(p.price),
          link: p.link || '',
          isNew: false,
        }))
      );
    }
  }, [isEditing, existingPrices, vendorPrices.length]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
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
      quantity: parseInt(quantity) || 0,
      quantityUnit,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      minStock: parseInt(minStock) || 0,
      weight: parseFloat(weight) || 0,
      weightUnit,
      dimensions,
      colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
      description,
      imageUrl: finalImageUrl,
    };

    if (editItem && onUpdate) {
      onUpdate(editItem.id, itemData);
      
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
          await upsertPrice(vp.vendorId, parseFloat(vp.price), vp.link);
        }
      }
      
      toast({ title: 'Item updated successfully' });
    } else {
      onSave(itemData);
      // Note: For new items, vendor prices will be added after item is created
      // This would require returning the new item ID from onSave
    }
    
    navigate('/items');
  };

  const handleDelete = () => {
    if (editItem && onDelete) {
      onDelete(editItem.id);
      navigate('/items');
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
                  />
                ) : (
                  /* Single image upload for new items (will be converted to multi after save) */
                  <div className="flex items-start gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-24 h-24 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setShowImageViewer(true)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {imagePreview ? 'Change Image' : 'Upload Image'}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB. Add more images after saving.
                      </p>
                    </div>
                  </div>
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
                  step="0.01"
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
                  step="0.01"
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
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </CardContent>
          </Card>

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

          {/* Vendor Pricing */}
          <ItemVendorPricing
            vendors={vendors}
            existingPrices={existingPrices}
            vendorPrices={vendorPrices}
            onVendorPricesChange={setVendorPrices}
            isEditing={isEditing}
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
