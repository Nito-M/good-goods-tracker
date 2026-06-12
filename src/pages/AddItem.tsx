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
import { ItemVendorPricing, VendorPriceEntry } from '@/components/ItemVendorPricing';
import { ItemTagSelector } from '@/components/ItemTagSelector';
import { MultiImageUploader, StagedImage } from '@/components/MultiImageUploader';
import { useVendors, Vendor } from '@/hooks/useVendors';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useItemVendorPrices, ItemVendorPrice } from '@/hooks/useItemVendorPrices';
import { useItemLocationQuantities } from '@/hooks/useItemLocationQuantities';
import { LocationQuantityEditor, LocationEntry } from '@/components/LocationQuantityEditor';
import { useItemImages } from '@/hooks/useItemImages';
import { useItemTags } from '@/hooks/useItemTags';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface AddItemPageProps {
  categories: string[];
  onSave: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  onUpdate?: (id: string, updates: Partial<InventoryItem>) => void;
  onDelete?: (id: string) => void;
  items: InventoryItem[];
  uploadItemImage?: (file: File) => Promise<string | null>;
  subcategoriesByCategory?: Map<string, { id: string; name: string }[]>;
}

const DEFAULT_DIMENSIONS: Dimensions = { length: 0, width: 0, height: 0, unit: 'in' };

export function AddItemPage({ categories, onSave, onUpdate, onDelete, items, uploadItemImage, subcategoriesByCategory }: AddItemPageProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const editItem = id ? items.find(item => item.id === id) : null;
  const isEditing = !!editItem;
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vendor and pricing hooks
  const { vendors } = useVendors();
  const { warehouses } = useWarehouses();
  const { prices: existingPrices, insertPrice, updatePriceById, deletePriceById, refetch: refetchVendorPrices } = useItemVendorPrices(editItem?.id);
  const { locations: existingLocations, saveLocations } = useItemLocationQuantities(editItem?.id);
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
  const [category, setCategory] = useState<string>(editItem?.category || categories[0] || 'Other');
  const [subcategory, setSubcategory] = useState<string>(editItem?.subcategory || '');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>('pcs');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [minStock, setMinStock] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [dimensions, setDimensions] = useState<Dimensions>(DEFAULT_DIMENSIONS);
  // Dedicated sheet size state for sqft items
  const [sheetLength, setSheetLength] = useState('');
  const [sheetWidth, setSheetWidth] = useState('');
  const [sheetUnit, setSheetUnit] = useState<'ft' | 'in'>('ft');
  const [colors, setColors] = useState('');
  const [description, setDescription] = useState('');
  const [locationEntries, setLocationEntries] = useState<LocationEntry[]>([]);
  const [vendorPrices, setVendorPrices] = useState<VendorPriceEntry[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isSavingVendors, setIsSavingVendors] = useState(false);
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([]);
  const [palletAmount, setPalletAmount] = useState('');
  const [boxAmount, setBoxAmount] = useState('');
  const [bundleAmount, setBundleAmount] = useState('');
  const [pieceLength, setPieceLength] = useState('');
  const [internalPartNumber, setInternalPartNumber] = useState('');
  const [storefrontPage, setStorefrontPage] = useState('');
  const [availableShopPages, setAvailableShopPages] = useState<string[]>([]);
  // Staged images for new item creation (before saving)
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  // Load available shop pages from storefront_categories
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);
      if (memberships && memberships.length > 0) {
        const orgId = memberships[0].organization_id;
        const { data: pages } = await supabase
          .from('storefront_categories')
          .select('category_name')
          .eq('organization_id', orgId)
          .order('display_order');
        if (pages) {
          setAvailableShopPages(pages.map(p => p.category_name));
        }
      }
    })();
  }, [user]);

  // Load storefront_page for editing
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select('storefront_page')
        .eq('id', id)
        .single();
      if (data) setStorefrontPage((data as any).storefront_page || '');
    })();
  }, [id]);

  const [formInitialized, setFormInitialized] = useState(false);
  useEffect(() => {
    if (editItem && !formInitialized) {
      setName(editItem.name);
      setSku(editItem.sku);
      setCategory(editItem.category);
      setSubcategory(editItem.subcategory || '');
      setQuantity(String(editItem.quantity));
      setQuantityUnit(editItem.quantityUnit || 'pcs');
      setPrice(String(editItem.price));
      setCost(String(editItem.cost));
      setMinStock(String(editItem.minStock));
      setWeight(String(editItem.weight));
      setWeightUnit(editItem.weightUnit);
      setDimensions(editItem.dimensions);
      if (editItem.quantityUnit === 'sqft') {
        const dimUnit = editItem.dimensions.unit as 'ft' | 'in';
        setSheetUnit(dimUnit === 'ft' || dimUnit === 'in' ? dimUnit : 'ft');
        setSheetLength(String(editItem.dimensions.length || ''));
        setSheetWidth(String(editItem.dimensions.width || ''));
      }
      setColors(editItem.colors.join(', '));
      setDescription(editItem.description);
      setPalletAmount(String(editItem.palletAmount || ''));
      setBoxAmount(String(editItem.boxAmount || ''));
      setBundleAmount(String(editItem.bundleAmount || ''));
      setPieceLength(String(editItem.pieceLength || ''));
      setInternalPartNumber(editItem.internalPartNumber || '');
      if (editItem.warehouseId) {
        setLocationEntries([{ warehouseId: editItem.warehouseId, quantity: String(editItem.quantity) }]);
      }
      if (editItem.imageUrl) {
        setImageUrl(editItem.imageUrl);
        setImagePreview(editItem.imageUrl);
      }
      setFormInitialized(true);
    }
  }, [editItem, formInitialized]);

  // Sync location entries from existing data
  useEffect(() => {
    if (isEditing && existingLocations.length > 0) {
      setLocationEntries(existingLocations.map(loc => ({
        warehouseId: loc.warehouse_id,
        quantity: String(loc.quantity),
      })));
    }
  }, [isEditing, existingLocations]);

  // Sync pending tags from loaded item tags (only on initial load)
  const [tagsInitialized, setTagsInitialized] = useState(false);
  useEffect(() => {
    if (isEditing && selectedTagIds.length > 0 && !tagsInitialized) {
      setPendingTagIds(selectedTagIds);
      setTagsInitialized(true);
    }
  }, [isEditing, selectedTagIds, tagsInitialized]);

  // Initialize vendor prices from existing data when editing
  useEffect(() => {
    if (isEditing && existingPrices.length > 0 && vendorPrices.length === 0) {
      setVendorPrices(
        existingPrices.map((p) => ({
          id: p.id,
          vendorId: p.vendor_id,
          price: String(p.price),
          link: p.link || '',
          vendorSku: p.vendor_sku || '',
          leadTimeDays: p.lead_time_days ? String(p.lead_time_days) : '',
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
    
    // For sqft items, merge sheet dimensions into the dimensions object
    const finalDimensions: Dimensions = quantityUnit === 'sqft'
      ? {
          length: parseFloat(sheetLength) || 0,
          width: parseFloat(sheetWidth) || 0,
          height: dimensions.height,
          unit: sheetUnit,
        }
      : dimensions;

    const itemData = {
      name,
      sku,
      category,
      subcategory: subcategory || null,
      quantity: parseFloat(quantity) || 0,
      quantityUnit,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      minStock: parseFloat(minStock) || 0,
      weight: parseFloat(weight) || 0,
      weightUnit,
      dimensions: finalDimensions,
      colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
      description,
      imageUrl: finalImageUrl,
      warehouseId: null,
      internalPartNumber: internalPartNumber.trim() || null,
      palletAmount: parseFloat(palletAmount) || 0,
      boxAmount: parseFloat(boxAmount) || 0,
      bundleAmount: parseFloat(bundleAmount) || 0,
      pieceLength: parseFloat(pieceLength) || 0,
    };

    const locationData = locationEntries
      .filter(e => e.warehouseId)
      .map(e => ({ warehouseId: e.warehouseId, quantity: parseFloat(e.quantity) || 0 }));

    if (editItem && onUpdate) {
      await onUpdate(editItem.id, itemData);
      
      // Save storefront_page
      await supabase
        .from('inventory_items')
        .update({ storefront_page: storefrontPage || null } as any)
        .eq('id', editItem.id);
      
      // Handle vendor price updates (row-based: same vendor can repeat)
      const currentRowIds = vendorPrices.filter((vp) => !vp.id.startsWith('new-')).map((vp) => vp.id);
      // Delete rows that were removed in the UI
      for (const p of existingPrices) {
        if (!currentRowIds.includes(p.id)) {
          await deletePriceById(p.id);
        }
      }
      // Insert new rows / update existing rows
      for (const vp of vendorPrices) {
        if (!vp.price) continue;
        const leadTime = vp.leadTimeDays ? parseInt(vp.leadTimeDays) : null;
        if (vp.id.startsWith('new-')) {
          await insertPrice(vp.vendorId, parseFloat(vp.price), vp.link, vp.vendorSku, leadTime);
        } else {
          await updatePriceById(vp.id, vp.vendorId, parseFloat(vp.price), vp.link, vp.vendorSku, leadTime);
        }
      }

      // Fix 1: Save tag changes in edit mode
      await setTagsForItem(pendingTagIds);
      // Save location quantities
      await saveLocations(editItem.id, locationData);
      
      navigate(`/item/${editItem.id}`);
    } else {
      // Creating a new item
      const newItemId = await onSave(itemData);
      
      if (newItemId) {
        // Save storefront_page for new item
        if (storefrontPage) {
          await supabase
            .from('inventory_items')
            .update({ storefront_page: storefrontPage } as any)
            .eq('id', newItemId);
        }
        // Upload staged images using the new item's ID directly
        for (const staged of stagedImages) {
          if (staged.file) {
            await uploadImageForItem(newItemId, staged.file, staged.is_primary);
          }
        }
        // Save vendor prices for new item (insert directly since hook has no itemId yet)
        if (vendorPrices.length > 0 && user) {
          for (const vp of vendorPrices) {
            if (vp.price) {
              const { error } = await supabase.from('item_vendor_prices').insert({
                item_id: newItemId,
                vendor_id: vp.vendorId,
                price: parseFloat(vp.price),
                link: vp.link || null,
                vendor_sku: vp.vendorSku || null,
                lead_time_days: vp.leadTimeDays ? parseInt(vp.leadTimeDays) : null,
                user_id: user.id,
              });
              if (error) {
                console.error('Error saving vendor price for new item:', error);
              }
            }
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
        // Save location quantities for new item
        await saveLocations(newItemId, locationData);
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
      const currentRowIds = vendorPrices.filter((vp) => !vp.id.startsWith('new-')).map((vp) => vp.id);
      for (const p of existingPrices) {
        if (!currentRowIds.includes(p.id)) {
          await deletePriceById(p.id);
        }
      }
      for (const vp of vendorPrices) {
        if (!vp.price) continue;
        const leadTime = vp.leadTimeDays ? parseInt(vp.leadTimeDays) : null;
        if (vp.id.startsWith('new-')) {
          await insertPrice(vp.vendorId, parseFloat(vp.price), vp.link, vp.vendorSku, leadTime);
        } else {
          await updatePriceById(vp.id, vp.vendorId, parseFloat(vp.price), vp.link, vp.vendorSku, leadTime);
        }
      }
      // Refetch from DB and rebuild local state with real ids so a subsequent
      // main "Save" doesn't re-insert the same rows as duplicates.
      await refetchVendorPrices();
      const { data: fresh } = await supabase
        .from('item_vendor_prices')
        .select('*')
        .eq('item_id', editItem.id)
        .order('created_at', { ascending: true });
      if (fresh) {
        setVendorPrices(
          fresh.map((p: any) => ({
            id: p.id,
            vendorId: p.vendor_id,
            price: String(p.price),
            link: p.link || '',
            vendorSku: p.vendor_sku || '',
            leadTimeDays: p.lead_time_days ? String(p.lead_time_days) : '',
            isNew: false,
          }))
        );
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
                  <Label htmlFor="internalPartNumber">Internal Part #</Label>
                  <Input
                    id="internalPartNumber"
                    value={internalPartNumber}
                    onChange={(e) => setInternalPartNumber(e.target.value)}
                    placeholder="e.g. IPN-0042"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(v) => { if (v !== category) { setCategory(v); setSubcategory(''); } }}>
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
                {/* Subcategory selector */}
                {(() => {
                  const subs = subcategoriesByCategory?.get(category) || [];
                  if (subs.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Select value={subcategory || '__none__'} onValueChange={(v) => setSubcategory(v === '__none__' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {subs.map((sub) => (
                            <SelectItem key={sub.id} value={sub.name}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}
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
                {quantityUnit === 'sqft' && (
                  <p className="text-xs text-muted-foreground">Total sq ft in stock. Optionally define sheet size below to calculate sheets.</p>
                )}
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

          {/* Packaging & Bundling */}
          <Card>
            <CardHeader>
              <CardTitle>Packaging & Bundling</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="palletAmount">Pallet Amount</Label>
                <Input
                  id="palletAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={palletAmount}
                  onChange={(e) => setPalletAmount(e.target.value)}
                  placeholder="Qty per pallet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boxAmount">Box Amount</Label>
                <Input
                  id="boxAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={boxAmount}
                  onChange={(e) => setBoxAmount(e.target.value)}
                  placeholder="Qty per box"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bundleAmount">Bundle Amount</Label>
                <Input
                  id="bundleAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bundleAmount}
                  onChange={(e) => setBundleAmount(e.target.value)}
                  placeholder="Qty per bundle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pieceLength">Length per Piece</Label>
                <Input
                  id="pieceLength"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pieceLength}
                  onChange={(e) => setPieceLength(e.target.value)}
                  placeholder="Length of 1 piece"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sheet Size Configuration — optional, only shown when Sq Ft is selected */}
          {quantityUnit === 'sqft' && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Sheet Size <span className="text-sm font-normal text-muted-foreground">(optional)</span></CardTitle>
                <p className="text-sm text-muted-foreground">
                  If your stock comes in standard sheets, enter the sheet dimensions to calculate how many sheets you have.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Unit toggle */}
                <div className="space-y-2">
                  <Label>Sheet Size Unit</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden w-fit">
                    <button
                      type="button"
                      onClick={() => setSheetUnit('ft')}
                      className={`px-5 py-2 text-sm font-medium transition-colors ${
                        sheetUnit === 'ft'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Feet (ft)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetUnit('in')}
                      className={`px-5 py-2 text-sm font-medium transition-colors ${
                        sheetUnit === 'in'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Inches (in)
                    </button>
                  </div>
                </div>

                {/* L × W inputs */}
                <div className="space-y-2">
                  <Label>Sheet Dimensions (Length × Width)</Label>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Length</p>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={sheetLength}
                          onChange={(e) => setSheetLength(e.target.value)}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">{sheetUnit}</span>
                      </div>
                    </div>
                    <span className="text-xl text-muted-foreground mt-4">×</span>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Width</p>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={sheetWidth}
                          onChange={(e) => setSheetWidth(e.target.value)}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">{sheetUnit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live calculation preview — qty is total sq ft, sheets = qty / sheetSqFt */}
                {(() => {
                  const l = parseFloat(sheetLength) || 0;
                  const w = parseFloat(sheetWidth) || 0;
                  const totalSqFt = parseFloat(quantity) || 0;
                  if (l <= 0 || w <= 0) return (
                    <p className="text-xs text-muted-foreground">Enter length and width above to see the sheet count.</p>
                  );
                  const sheetSqFt = sheetUnit === 'in' ? (l * w) / 144 : l * w;
                  const sheets = sheetSqFt > 0 ? totalSqFt / sheetSqFt : 0;
                  return (
                    <div className="rounded-lg bg-background border border-border p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sheet area</span>
                        <span className="font-semibold">
                          {l} × {w} {sheetUnit} = <span className="text-primary">{sheetSqFt.toLocaleString(undefined, { maximumFractionDigits: 4 })} sq ft/sheet</span>
                        </span>
                      </div>
                      {totalSqFt > 0 && (
                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-muted-foreground">Sheets in stock</span>
                          <span className="font-bold text-base">
                            {totalSqFt} sq ft ÷ {sheetSqFt.toLocaleString(undefined, { maximumFractionDigits: 4 })} = <span className="text-primary">{sheets.toLocaleString(undefined, { maximumFractionDigits: 2 })} sheets</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

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
                <Label>
                  {quantityUnit === 'sqft' ? 'Height' : 'Dimensions (L × W × H)'}
                </Label>
                {quantityUnit === 'sqft' ? (
                  // For sqft items, only show height (L×W is handled in Sheet Size card)
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="H"
                      value={dimensions.height || ''}
                      onChange={(e) => setDimensions({ ...dimensions, height: parseFloat(e.target.value) || 0 })}
                      className="w-24"
                    />
                    <Select value={dimensions.unit} onValueChange={(v) => setDimensions({ ...dimensions, unit: v as 'in' | 'cm' | 'ft' })}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">in</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </div>
                ) : (
                  // For non-sqft items, show full L × W × H
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
                    <Select value={dimensions.unit} onValueChange={(v) => setDimensions({ ...dimensions, unit: v as 'in' | 'cm' | 'ft' })}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">in</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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

          {/* Location Quantities */}
          <LocationQuantityEditor
            warehouses={warehouses}
            entries={locationEntries}
            onChange={setLocationEntries}
            totalQuantity={parseFloat(quantity) || 0}
          />

          {/* Shop Page Assignment */}
          {availableShopPages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Shop Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Assign to Shop Page</Label>
                  <Select value={storefrontPage || 'none'} onValueChange={(v) => setStorefrontPage(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shop page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Page</SelectItem>
                      {availableShopPages.map((page) => (
                        <SelectItem key={page} value={page}>{page}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose which shop page this item appears under in the storefront navigation</p>
                </div>
              </CardContent>
            </Card>
          )}

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
