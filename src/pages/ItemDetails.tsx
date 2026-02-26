import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Edit2, Trash2, Store, TrendingDown, ExternalLink, MapPin } from 'lucide-react';
import { DxfFileCard } from '@/components/DxfFileCard';
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
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface ItemDetailsProps {
  items: InventoryItem[];
  onDelete: (id: string, forceDelete?: boolean) => Promise<{ success: boolean; error?: string; poNumbers?: string[]; warning?: boolean }>;
}

export function ItemDetails({ items, onDelete }: ItemDetailsProps) {
  const [dxfUrl, setDxfUrl] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<{ message: string; poNumbers?: string[] } | null>(null);
  
  const item = items.find((i) => i.id === id);

  // Initialize DXF URL from item
  useEffect(() => {
    if (item?.dxfUrl !== undefined) {
      setDxfUrl(item.dxfUrl ?? null);
    }
  }, [item?.dxfUrl]);
  
  // Fetch vendor prices, vendors, images, and last purchase for this item
  const { prices: vendorPrices } = useItemVendorPrices(item?.id);
  const { vendors } = useVendors();
  const { lastPurchase } = useLastPurchase(item?.sku);
  const { images: itemImages } = useItemImages(item?.id);
  const { selectedTagIds } = useItemTags(item?.id);
  const { tagCategories } = useTagCategories();
  const { tags, getTagsByCategory } = useTags();
  const { locations: itemLocations } = useItemLocationQuantities(item?.id);
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


  const isLowStock = item.quantity <= item.minStock;
  const profitMargin = item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;

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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEdit} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) setDeleteError(null);
              }}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
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
          <h1 className="text-3xl font-bold text-card-foreground">{item.name}</h1>
          <p className="text-muted-foreground mt-1">SKU: {item.sku}</p>
          {/* Tags */}
          {selectedTagIds.length > 0 && (
            <div className="mt-3 space-y-2">
              {tagCategories.map((tc) => {
                const categoryTags = getTagsByCategory(tc.id).filter((t) => selectedTagIds.includes(t.id));
                if (categoryTags.length === 0) return null;
                return (
                  <div key={tc.id} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">{tc.name}:</span>
                    {categoryTags.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Images Gallery */}
        <Card className="mb-6">
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
                  <p className="text-2xl font-bold text-card-foreground">{formatCurrency(item.price)}</p>
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
                    {formatCurrency(item.quantity * item.price)}
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
                          {formatCurrency(item.price * sheetSqFt)}
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
                    <div key={warehouse.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-card-foreground">
                        {warehouse.name}
                      </span>
                      <Badge variant={qty > 0 ? 'secondary' : 'outline'}>
                        {qty} {item.quantityUnit && item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : ''}
                      </Badge>
                    </div>
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
                      <p className="text-xl font-semibold text-card-foreground">{item.pieceLength}</p>
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
                          <p className="text-xs text-muted-foreground">
                            Last updated: {new Date(vp.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
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
          <ItemPurchaseHistory sku={item.sku} currentStock={item.quantity} />

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
      </main>
    </div>
  );
}
