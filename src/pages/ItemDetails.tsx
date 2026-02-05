import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Edit2, Trash2, Store, TrendingDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InventoryItem, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { ItemPurchaseHistory } from '@/components/ItemPurchaseHistory';
import { useItemVendorPrices } from '@/hooks/useItemVendorPrices';
import { useVendors } from '@/hooks/useVendors';
import { useLastPurchase } from '@/hooks/useLastPurchase';

interface ItemDetailsProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
}

export function ItemDetails({ items, onDelete }: ItemDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const item = items.find((i) => i.id === id);
  
  // Fetch vendor prices and vendors for this item
  const { prices: vendorPrices } = useItemVendorPrices(item?.id);
  const { vendors } = useVendors();
  const { lastPurchase } = useLastPurchase(item?.sku);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const isLowStock = item.quantity <= item.minStock;
  const profitMargin = item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;

  const handleEdit = () => {
    navigate(`/items/edit/${item.id}`);
  };

  const handleDelete = () => {
    onDelete(item.id);
    navigate('/items');
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
              <Button variant="destructive" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
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
            </CardContent>
          </Card>

          {/* Physical Details Card */}
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
                    return (
                      <div
                        key={vp.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{getVendorName(vp.vendor_id)}</p>
                            {vendorLink && (
                              <a
                                href={vendorLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-4 w-4" />
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
                        <p className="text-lg font-semibold">{formatCurrency(vp.price)}</p>
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
