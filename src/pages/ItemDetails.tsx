import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Edit2, Trash2, Store, TrendingDown, ExternalLink, MapPin, Minus, Globe, Undo2, Pencil, Check, X, MoreVertical, Plus, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DxfFileCard } from '@/components/DxfFileCard';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InventoryItem, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { ItemPurchaseHistory } from '@/components/ItemPurchaseHistory';
import { ItemImageGallery } from '@/components/ItemImageGallery';
import { useItemVendorPrices } from '@/hooks/useItemVendorPrices';
import { useVendors } from '@/hooks/useVendors';
import { useLastPurchase } from '@/hooks/useLastPurchase';
import { useItemImages } from '@/hooks/useItemImages';
import { useItemTags } from '@/hooks/useItemTags';
import { useTagCategories } from '@/hooks/useTagCategories';
import { useTags } from '@/hooks/useTags';
import { useItemLocationQuantities } from '@/hooks/useItemLocationQuantities';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useItemConsumptions } from '@/hooks/useItemConsumptions';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryPreferences } from '@/hooks/useInventoryPreferences';

interface ItemDetailsProps {
  items: InventoryItem[];
  onDelete: (id: string, forceDelete?: boolean) => Promise<{ success: boolean; error?: string; poNumbers?: string[]; warning?: boolean }>;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
}

function LocationQuantityRow({ warehouseName, quantity, quantityUnit, locationId, onSave }: {
  warehouseName: string;
  quantity: number;
  quantityUnit?: string;
  locationId?: string;
  onSave: (newQty: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(quantity));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!locationId) return;
    const newQty = parseFloat(editValue);
    if (isNaN(newQty) || newQty < 0) return;
    setSaving(true);
    await onSave(newQty);
    setSaving(false);
    setEditing(false);
  };

  const unitLabel = quantityUnit && quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[quantityUnit] : '';

  if (editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-card-foreground">{warehouseName}</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-24 h-7 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave} disabled={saving}>
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(false)}>
            <X className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <span className="text-sm font-medium text-card-foreground">{warehouseName}</span>
      <div className="flex items-center gap-1">
        <Badge variant={quantity > 0 ? 'secondary' : 'outline'}>
          {quantity} {unitLabel}
        </Badge>
        {locationId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => { setEditValue(String(quantity)); setEditing(true); }}
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ItemDetails({ items, onDelete, onUpdate }: ItemDetailsProps) {
  const [dxfUrl, setDxfUrl] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<{ message: string; poNumbers?: string[] } | null>(null);
  const [consumeDialogOpen, setConsumeDialogOpen] = useState(false);
  const [consumeQty, setConsumeQty] = useState('1');
  const [consumeDescription, setConsumeDescription] = useState('');
  const [consumeWarehouseId, setConsumeWarehouseId] = useState<string>('');
  const [isConsuming, setIsConsuming] = useState(false);
  const [showInStorefront, setShowInStorefront] = useState(false);
  const [addVendorDialogOpen, setAddVendorDialogOpen] = useState(false);
  const [newVendorId, setNewVendorId] = useState('');
  const [newVendorPrice, setNewVendorPrice] = useState('');
  const [newVendorSku, setNewVendorSku] = useState('');
  const [newVendorLink, setNewVendorLink] = useState('');
  const [newVendorLeadTime, setNewVendorLeadTime] = useState('');
  const [newVendorNotes, setNewVendorNotes] = useState('');
  const [savingVendor, setSavingVendor] = useState(false);
  
  const item = items.find((i) => i.id === id);

  // Fetch show_in_storefront value
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select('show_in_storefront')
        .eq('id', id)
        .single();
      if (data) setShowInStorefront(data.show_in_storefront ?? false);
    })();
  }, [id]);

  // Initialize DXF URL from item
  useEffect(() => {
    if (item?.dxfUrl !== undefined) {
      setDxfUrl(item.dxfUrl ?? null);
    }
  }, [item?.dxfUrl]);
  
  // Fetch vendor prices, vendors, images, and last purchase for this item
  const { prices: vendorPrices, insertPrice, refetch: refetchVendorPrices } = useItemVendorPrices(item?.id);
  const { vendors } = useVendors();
  const { lastPurchase } = useLastPurchase(item?.sku);
  const { images: itemImages } = useItemImages(item?.id);
  const { selectedTagIds } = useItemTags(item?.id);
  const { tagCategories } = useTagCategories();
  const { tags, getTagsByCategory } = useTags();
  const { locations: itemLocations, refetch: refetchLocations, updateSingleLocation } = useItemLocationQuantities(item?.id);
  const { consumptions, addConsumption } = useItemConsumptions(item?.id);
  const { warehouses } = useWarehouses();

  const getVendorName = (vendorId: string) => {
    return vendors.find((v) => v.id === vendorId)?.name || 'Unknown Vendor';
  };

  const getVendorLink = (vendorId: string) => {
    return vendors.find((v) => v.id === vendorId)?.link || null;
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Item Not Found</h2>
          <p className="text-muted-foreground mb-4">The item you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/items')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Items & Inventory
          </Button>
        </div>
      </div>
    );
  }

  const handleConsume = async () => {
    if (!item || !consumeWarehouseId) return;
    const amount = parseFloat(consumeQty) || 0;
    if (amount <= 0) return;
    const locationEntry = itemLocations.find(
      (loc) => loc.warehouse_id === consumeWarehouseId
    );
    if (!locationEntry || amount > locationEntry.quantity) {
      toast({ title: 'Not enough stock at this location', variant: 'destructive' });
      return;
    }
    setIsConsuming(true);
    try {
      const newQty = Math.max(0, item.quantity - amount);
      await onUpdate(item.id, { quantity: newQty });
      await addConsumption({
        itemId: item.id,
        quantity: amount,
        description: consumeDescription.trim() || undefined,
        warehouseId: consumeWarehouseId,
      });

      const newLocQty = Math.max(0, locationEntry.quantity - amount);
      await supabase
        .from('item_location_quantities')
        .update({ quantity: newLocQty, updated_at: new Date().toISOString() })
        .eq('id', locationEntry.id);

      await refetchLocations();
      toast({ title: `Consumed ${amount} — new quantity: ${newQty}` });
      setConsumeDialogOpen(false);
      setConsumeQty('1');
      setConsumeDescription('');
      setConsumeWarehouseId('');
    } catch {
      toast({ title: 'Error recording consumption', variant: 'destructive' });
    }
    setIsConsuming(false);
  };

  const handleUndoLastConsumption = async () => {
    if (!item || consumptions.length === 0) return;
    const last = consumptions[0]; // already sorted desc by created_at
    try {
      // Restore main quantity
      const restoredQty = item.quantity + last.quantity;
      await onUpdate(item.id, { quantity: restoredQty });

      // Restore location quantity if warehouse was specified
      if (last.warehouse_id) {
        const locationEntry = itemLocations.find(
          (loc) => loc.warehouse_id === last.warehouse_id
        );
        if (locationEntry) {
          await supabase
            .from('item_location_quantities')
            .update({ quantity: locationEntry.quantity + last.quantity, updated_at: new Date().toISOString() })
            .eq('id', locationEntry.id);
        }
      }

      // Delete the consumption record
      await supabase.from('item_consumptions').delete().eq('id', last.id);

      await refetchLocations();
      toast({ title: `Reverted consumption of ${last.quantity} — new quantity: ${restoredQty}` });
      window.location.reload();
    } catch {
      toast({ title: 'Error reverting consumption', variant: 'destructive' });
    }
  };

  const { markupPercent } = useInventoryPreferences();
  const displayPrice = markupPercent > 0 && item.cost > 0
    ? item.cost * (1 + markupPercent / 100)
    : item.price;
  const isLowStock = item.quantity <= item.minStock;
  const profitMargin = displayPrice > 0 ? ((displayPrice - item.cost) / displayPrice) * 100 : 0;

  const handleEdit = () => {
    navigate(`/items/edit/${item.id}`);
  };

  const handleDelete = async (forceDelete?: boolean) => {
    const result = await onDelete(item.id, forceDelete);
    if (result.success) {
      navigate('/items');
    } else if (result.warning) {
      // It's a warning about unreceived POs - ask user to confirm
      const confirmForce = confirm(
        `${result.error}\n\nAffected POs: ${result.poNumbers?.join(', ')}`
      );
      if (confirmForce) {
        await handleDelete(true);
      }
    } else if (result.error) {
      setDeleteError({ message: result.error, poNumbers: result.poNumbers });
      toast({
        title: 'Cannot delete item',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/items')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Items & Inventory
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setConsumeDialogOpen(true)}>
                  <Minus className="h-4 w-4 mr-2" />
                  Consume
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setAddVendorDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) setDeleteError(null);
            }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      {deleteError ? (
                        <>
                          <p className="text-destructive font-medium">
                            {deleteError.message}
                          </p>
                          {deleteError.poNumbers && deleteError.poNumbers.length > 0 && (
                            <div className="bg-destructive/10 rounded-md p-3 text-sm">
                              <p className="font-medium text-foreground mb-2">Blocking POs:</p>
                              <ul className="list-disc list-inside text-muted-foreground">
                                {deleteError.poNumbers.map((po) => (
                                  <li key={po}>{po}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Please receive or delete these POs first.
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            This will permanently remove <strong>{item.name}</strong> from your inventory.
                          </p>
                          <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                            <p className="font-medium text-foreground">What happens:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>Item won't appear in future PO/quote/invoice dropdowns</li>
                              <li>Historical invoices and quotes will keep the item info</li>
                              <li>Historical POs (received/paid) will keep the item info</li>
                              <li>Vendor pricing records will be preserved</li>
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  {!deleteError && (
                    <AlertDialogAction
                      onClick={() => handleDelete()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Anyway
                    </AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Two-column: Images left, Details right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: Product Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemImageGallery 
                images={itemImages} 
                itemName={item.name}
                fallbackImageUrl={item.imageUrl}
              />
            </CardContent>
          </Card>

          {/* Right: Item Details */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{item.category}</Badge>
                <Badge
                  className={
                    isLowStock
                      ? 'bg-warning/10 text-warning hover:bg-warning/20'
                      : 'bg-success/10 text-success hover:bg-success/20'
                  }
                >
                  {isLowStock ? 'Low Stock' : 'In Stock'}
                </Badge>
              </div>
              <CardTitle className="text-xl">{item.name}</CardTitle>
              <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
              {selectedTagIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tagCategories.map((tc) => {
                    const categoryTags = getTagsByCategory(tc.id).filter((t) => selectedTagIds.includes(t.id));
                    if (categoryTags.length === 0) return null;
                    return categoryTags.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ));
                  })}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Selling Price</p>
                  <p className="text-2xl font-bold text-card-foreground">{formatCurrency(displayPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p className="text-2xl font-bold text-card-foreground">{formatCurrency(item.cost)}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantity in Stock</p>
                  <p className="text-xl font-semibold text-card-foreground">
                    {item.quantity} {item.quantityUnit && item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Min Stock</p>
                  <p className="text-xl font-semibold text-card-foreground">
                    {item.minStock} {item.quantityUnit && item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : ''}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-card-foreground">Show in Storefront</p>
                    <p className="text-xs text-muted-foreground">Visible on public shop</p>
                  </div>
                </div>
                <Switch
                  checked={showInStorefront}
                  onCheckedChange={async (checked) => {
                    setShowInStorefront(checked);
                    const { error } = await supabase
                      .from('inventory_items')
                      .update({ show_in_storefront: checked } as any)
                      .eq('id', item.id);
                    if (error) {
                      setShowInStorefront(!checked);
                      toast({ title: 'Failed to update storefront visibility', variant: 'destructive' });
                    } else {
                      toast({ title: checked ? 'Product now visible in shop' : 'Product hidden from shop' });
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>


        {/* DXF Drawing */}
        <div className="mb-6">
          <DxfFileCard itemId={item.id} dxfUrl={dxfUrl} onDxfUrlChange={setDxfUrl} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pricing & Stock Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Selling Price</p>
                  <p className="text-2xl font-bold text-card-foreground">{formatCurrency(displayPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p className="text-2xl font-bold text-card-foreground">{formatCurrency(item.cost)}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className="text-xl font-semibold text-success">{profitMargin.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-xl font-semibold text-card-foreground">
                    {formatCurrency(item.quantity * displayPrice)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantity in Stock</p>
                  <p className="text-xl font-semibold text-card-foreground">
                    {item.quantity} {item.quantityUnit && item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Stock Level</p>
                  <p className="text-xl font-semibold text-card-foreground">
                    {item.minStock} {item.quantityUnit && item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : ''}
                  </p>
                </div>
              </div>
              {item.pieceLength > 0 && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price per Piece</p>
                      <p className="text-xl font-semibold text-card-foreground">
                        {formatCurrency(displayPrice * item.pieceLength)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(displayPrice)} × {item.pieceLength} {QUANTITY_UNIT_LABELS[item.quantityUnit] || item.quantityUnit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost per Piece</p>
                      <p className="text-xl font-semibold text-card-foreground">
                        {formatCurrency(item.cost * item.pieceLength)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.cost)} × {item.pieceLength} {QUANTITY_UNIT_LABELS[item.quantityUnit] || item.quantityUnit}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {/* Sheet count for sqft items — qty = total sq ft, sheets = qty / sheetSqFt */}
              {item.quantityUnit === 'sqft' && item.dimensions.length > 0 && item.dimensions.width > 0 && (() => {
                const l = item.dimensions.length;
                const w = item.dimensions.width;
                const dimUnit = item.dimensions.unit;
                let sheetSqFt = 0;
                if (dimUnit === 'in') sheetSqFt = (l * w) / 144;
                else if (dimUnit === 'cm') sheetSqFt = (l * w) / 929.03;
                else sheetSqFt = l * w; // ft → sq ft directly
                const sheets = sheetSqFt > 0 ? item.quantity / sheetSqFt : 0;
                return (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Sheet Size</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {l} × {w} {dimUnit}
                        </p>
                        <p className="text-xs text-muted-foreground">({sheetSqFt.toLocaleString(undefined, { maximumFractionDigits: 4 })} sq ft/sheet)</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sheets in Stock</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {sheets.toLocaleString(undefined, { maximumFractionDigits: 2 })} sheets
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price per Sheet</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(displayPrice * sheetSqFt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost per Sheet</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(item.cost * sheetSqFt)}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Stock by Location */}
          {warehouses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Stock by Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {warehouses.map((warehouse) => {
                  const loc = itemLocations.find(l => l.warehouse_id === warehouse.id);
                  const qty = loc ? loc.quantity : 0;
                  return (
                    <LocationQuantityRow
                      key={warehouse.id}
                      warehouseName={warehouse.name}
                      quantity={qty}
                      quantityUnit={item.quantityUnit}
                      locationId={loc?.id}
                      onSave={async (newQty) => {
                        if (loc) {
                          await updateSingleLocation(loc.id, newQty);
                        }
                      }}
                    />
                  );
                })}
                {(() => {
                  const assignedTotal = itemLocations.reduce((sum, loc) => sum + loc.quantity, 0);
                  const unassigned = item.quantity - assignedTotal;
                  if (unassigned > 0) {
                    return (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm">Unassigned</span>
                        <Badge variant="outline">
                          {unassigned} {item.quantityUnit && item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : ''}
                        </Badge>
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>
          )}


          {/* Packaging & Bundling */}
          {(item.palletAmount > 0 || item.boxAmount > 0 || item.bundleAmount > 0 || item.pieceLength > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Packaging & Bundling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {item.palletAmount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pallet Amount</p>
                      <p className="text-xl font-semibold text-card-foreground">{item.palletAmount}</p>
                    </div>
                  )}
                  {item.boxAmount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Box Amount</p>
                      <p className="text-xl font-semibold text-card-foreground">{item.boxAmount}</p>
                    </div>
                  )}
                  {item.bundleAmount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bundle Amount</p>
                      <p className="text-xl font-semibold text-card-foreground">{item.bundleAmount}</p>
                    </div>
                  )}
                  {item.pieceLength > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Length per Piece</p>
                      <p className="text-xl font-semibold text-card-foreground">{item.pieceLength} {QUANTITY_UNIT_LABELS[item.quantityUnit] || item.quantityUnit}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Physical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="text-xl font-semibold text-card-foreground">
                  {item.weight} {item.weightUnit}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Dimensions (L × W × H)</p>
                <p className="text-xl font-semibold text-card-foreground">
                  {item.dimensions.length} × {item.dimensions.width} × {item.dimensions.height} {item.dimensions.unit}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Colors</p>
                <div className="flex flex-wrap gap-2">
                  {item.colors.length > 0 ? (
                    item.colors.map((color) => (
                      <Badge key={color} variant="outline">
                        {color}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No colors specified</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-card-foreground leading-relaxed">
                {item.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {/* Last Purchase Card */}
          {lastPurchase && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Last Purchase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vendor</span>
                    <span className="font-medium">{lastPurchase.vendorName || 'Unknown'}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unit Cost</span>
                    <span className="text-lg font-semibold text-primary">{formatCurrency(lastPurchase.unitCost)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">PO Number</span>
                    <span className="font-medium">{lastPurchase.poNumber || 'N/A'}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm">
                      {lastPurchase.receivedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vendor Pricing Card */}
          {vendorPrices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Vendor Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                {vendorPrices.map((vp) => {
                    const vendorLink = getVendorLink(vp.vendor_id);
                    const itemVendorLink = vp.link;
                    return (
                      <div
                        key={vp.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{getVendorName(vp.vendor_id)}</p>
                            {vendorLink && (
                              <a
                                href={vendorLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="Vendor website"
                              >
                                <Store className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          {vp.vendor_sku && (
                            <p className="text-sm text-muted-foreground">
                              SKU: <span className="font-mono text-foreground">{vp.vendor_sku}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Last updated: {new Date(vp.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {vp.lead_time_days && ` • Lead time: ${vp.lead_time_days} day${vp.lead_time_days !== 1 ? 's' : ''}`}
                          </p>
                          {(vp as any).notes && (
                            <p className="mt-1.5 text-sm whitespace-pre-wrap text-foreground/90 bg-background/60 rounded p-2 border">
                              {(vp as any).notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-semibold">{formatCurrency(vp.price)}</p>
                          {itemVendorLink && (
                            <a
                              href={itemVendorLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="View item at vendor"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase & Sales History */}
          <ItemPurchaseHistory sku={item.sku} itemId={item.id} currentStock={item.quantity} />

          {/* Timestamps Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Record Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-card-foreground">
                    {item.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-card-foreground">
                    {item.updatedAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consumption History */}
        {consumptions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Consumption History</CardTitle>
                <Button variant="outline" size="sm" onClick={handleUndoLastConsumption} className="gap-1.5">
                  <Undo2 className="h-3.5 w-3.5" />
                  Undo Last
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {consumptions.map((c) => {
                  const wh = warehouses.find((w) => w.id === c.warehouse_id);
                  return (
                    <div key={c.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-card-foreground">
                          -{c.quantity} {item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : 'pcs'}
                        </p>
                        {c.description && (
                          <p className="text-sm text-muted-foreground">{c.description}</p>
                        )}
                        {wh && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {wh.name}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Vendor Dialog */}
      <Dialog open={addVendorDialogOpen} onOpenChange={(open) => {
        setAddVendorDialogOpen(open);
        if (!open) {
          setNewVendorId(''); setNewVendorPrice(''); setNewVendorSku('');
          setNewVendorLink(''); setNewVendorLeadTime(''); setNewVendorNotes('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select value={newVendorId} onValueChange={setNewVendorId}>
                <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" step="0.00001" placeholder="0.00" value={newVendorPrice} onChange={(e) => setNewVendorPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vendor SKU</Label>
                <Input value={newVendorSku} onChange={(e) => setNewVendorSku(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input type="url" placeholder="https://..." value={newVendorLink} onChange={(e) => setNewVendorLink(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Lead Time (days)</Label>
              <Input type="number" min="0" value={newVendorLeadTime} onChange={(e) => setNewVendorLeadTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={newVendorNotes} onChange={(e) => setNewVendorNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVendorDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!newVendorId || !newVendorPrice || savingVendor}
              onClick={async () => {
                setSavingVendor(true);
                const ok = await insertPrice(
                  newVendorId,
                  parseFloat(newVendorPrice),
                  newVendorLink || undefined,
                  newVendorSku || undefined,
                  newVendorLeadTime ? parseInt(newVendorLeadTime, 10) : null,
                  newVendorNotes || null,
                );
                setSavingVendor(false);
                if (ok) {
                  toast({ title: 'Vendor added' });
                  await refetchVendorPrices();
                  setAddVendorDialogOpen(false);
                  setNewVendorId(''); setNewVendorPrice(''); setNewVendorSku('');
                  setNewVendorLink(''); setNewVendorLeadTime(''); setNewVendorNotes('');
                }
              }}
            >
              {savingVendor ? 'Adding...' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consume Dialog */}
      <Dialog open={consumeDialogOpen} onOpenChange={setConsumeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Consumption</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Quantity {consumeWarehouseId && (() => {
                const loc = itemLocations.find(l => l.warehouse_id === consumeWarehouseId);
                return loc ? <span className="text-muted-foreground text-xs">(max: {loc.quantity})</span> : null;
              })()}</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                max={consumeWarehouseId ? (itemLocations.find(l => l.warehouse_id === consumeWarehouseId)?.quantity || 0) : undefined}
                value={consumeQty}
                onChange={(e) => setConsumeQty(e.target.value)}
                disabled={!consumeWarehouseId}
              />
            </div>
            <div className="space-y-2">
              <Label>Where was it consumed?</Label>
              <Textarea
                placeholder="e.g. Used for Job #123, customer order..."
                value={consumeDescription}
                onChange={(e) => setConsumeDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={consumeWarehouseId} onValueChange={(v) => { setConsumeWarehouseId(v); setConsumeQty('1'); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {itemLocations
                    .filter((loc) => loc.quantity > 0)
                    .map((loc) => {
                      const wh = warehouses.find((w) => w.id === loc.warehouse_id);
                      return (
                        <SelectItem key={loc.warehouse_id} value={loc.warehouse_id}>
                          {wh?.name || 'Unknown'} ({loc.quantity} available)
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {itemLocations.filter((loc) => loc.quantity > 0).length === 0 && (
                <p className="text-sm text-muted-foreground">No locations have stock to consume.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsumeDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isConsuming || !consumeWarehouseId || (parseFloat(consumeQty) || 0) <= 0 || (parseFloat(consumeQty) || 0) > (itemLocations.find(l => l.warehouse_id === consumeWarehouseId)?.quantity || 0)}
              onClick={handleConsume}
            >
              <Minus className="h-4 w-4 mr-1" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
