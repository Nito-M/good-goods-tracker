import { useState, useMemo } from 'react';
import { Plus, Trash2, DollarSign, Store, ExternalLink, Link, Save, Loader2, Check, ChevronsUpDown, Hash, Clock, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vendor } from '@/hooks/useVendors';
import { ItemVendorPrice } from '@/hooks/useItemVendorPrices';

export interface VendorPriceEntry {
  id: string; // existing row id, or temp id like `new-<uuid>`
  vendorId: string;
  price: string;
  link?: string;
  vendorSku?: string;
  leadTimeDays?: string;
  notes?: string;
  isNew?: boolean;
}

interface ItemVendorPricingProps {
  vendors: Vendor[];
  existingPrices: ItemVendorPrice[];
  vendorPrices: VendorPriceEntry[];
  onVendorPricesChange: (prices: VendorPriceEntry[]) => void;
  isEditing: boolean;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

export function ItemVendorPricing({
  vendors,
  existingPrices,
  vendorPrices,
  onVendorPricesChange,
  isEditing,
  onSave,
  isSaving,
}: ItemVendorPricingProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendorOpen, setVendorOpen] = useState(false);

  // Track dirty state by comparing current entries against existing prices (matched by row id)
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing) return false;
    const existingIds = existingPrices.map(p => p.id).sort();
    const currentIds = vendorPrices.filter(vp => !vp.id.startsWith('new-')).map(vp => vp.id).sort();
    if (vendorPrices.some(vp => vp.id.startsWith('new-'))) return true;
    if (existingIds.length !== currentIds.length) return true;
    if (existingIds.some((id, i) => id !== currentIds[i])) return true;
    for (const vp of vendorPrices) {
      const existing = existingPrices.find(p => p.id === vp.id);
      if (!existing) return true;
      if (existing.vendor_id !== vp.vendorId) return true;
      if (String(existing.price) !== vp.price) return true;
      if ((existing.link || '') !== (vp.link || '')) return true;
      if ((existing.vendor_sku || '') !== (vp.vendorSku || '')) return true;
      if (String(existing.lead_time_days || '') !== (vp.leadTimeDays || '')) return true;
    }
    return false;
  }, [isEditing, existingPrices, vendorPrices]);

  const handleAddVendor = () => {
    if (!selectedVendor) return;

    onVendorPricesChange([
      ...vendorPrices,
      {
        id: `new-${crypto.randomUUID()}`,
        vendorId: selectedVendor,
        price: '',
        link: '',
        vendorSku: '',
        leadTimeDays: '',
        isNew: true,
      },
    ]);
    setSelectedVendor('');
  };

  const handlePriceChange = (rowId: string, price: string) => {
    onVendorPricesChange(
      vendorPrices.map((vp) => (vp.id === rowId ? { ...vp, price } : vp))
    );
  };

  const handleLinkChange = (rowId: string, link: string) => {
    onVendorPricesChange(
      vendorPrices.map((vp) => (vp.id === rowId ? { ...vp, link } : vp))
    );
  };

  const handleVendorSkuChange = (rowId: string, vendorSku: string) => {
    onVendorPricesChange(
      vendorPrices.map((vp) => (vp.id === rowId ? { ...vp, vendorSku } : vp))
    );
  };

  const handleLeadTimeChange = (rowId: string, leadTimeDays: string) => {
    onVendorPricesChange(
      vendorPrices.map((vp) => (vp.id === rowId ? { ...vp, leadTimeDays } : vp))
    );
  };

  const handleVendorChange = (rowId: string, vendorId: string) => {
    onVendorPricesChange(
      vendorPrices.map((vp) => (vp.id === rowId ? { ...vp, vendorId } : vp))
    );
  };

  const handleRemoveRow = (rowId: string) => {
    onVendorPricesChange(vendorPrices.filter((vp) => vp.id !== rowId));
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find((v) => v.id === vendorId)?.name || 'Unknown Vendor';
  };

  const getVendorLink = (vendorId: string) => {
    return vendors.find((v) => v.id === vendorId)?.link || null;
  };

  const getLastUpdated = (rowId: string) => {
    const existing = existingPrices.find((p) => p.id === rowId);
    if (!existing) return null;
    return new Date(existing.updated_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Vendor Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add vendor selector — same vendor can be added multiple times */}
        {vendors.length > 0 && (
          <div className="flex gap-2">
            <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={vendorOpen}
                  className="flex-1 justify-between"
                >
                  {selectedVendor
                    ? vendors.find((v) => v.id === selectedVendor)?.name
                    : 'Search vendors...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search vendors..." />
                  <CommandList>
                    <CommandEmpty>No vendor found.</CommandEmpty>
                    <CommandGroup>
                      {vendors.map((vendor) => (
                        <CommandItem
                          key={vendor.id}
                          value={vendor.name}
                          onSelect={() => {
                            setSelectedVendor(vendor.id);
                            setVendorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedVendor === vendor.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {vendor.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddVendor}
              disabled={!selectedVendor}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        )}

        {/* Vendor price list */}
        {vendorPrices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No vendors assigned to this item yet.</p>
            <p className="text-xs">Add vendors to track their pricing for this item.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendorPrices.map((vp) => {
              const lastUpdated = getLastUpdated(vp.id);
              const existingPrice = existingPrices.find((p) => p.id === vp.id);
              const vendorLink = getVendorLink(vp.vendorId);
              const sameVendorCount = vendorPrices.filter((x) => x.vendorId === vp.vendorId).length;

              return (
                <div
                  key={vp.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {getVendorName(vp.vendorId)}
                      </span>
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
                      {vp.isNew && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                      {sameVendorCount > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Multiple entries
                        </Badge>
                      )}
                    </div>
                    {lastUpdated && (
                      <p className="text-xs text-muted-foreground">
                        Last updated: {lastUpdated}
                        {existingPrice && ` • Previous: ${formatCurrency(existingPrice.price)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="relative w-28">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="0.00001"
                        placeholder="0.00"
                        value={vp.price}
                        onChange={(e) => handlePriceChange(vp.id, e.target.value)}
                        className="pl-7"
                      />
                    </div>
                    <div className="relative w-32">
                      <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Vendor SKU"
                        value={vp.vendorSku || ''}
                        onChange={(e) => handleVendorSkuChange(vp.id, e.target.value)}
                        className="pl-7"
                      />
                    </div>
                    <div className="relative flex-1 min-w-[140px]">
                      <Link className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={vp.link || ''}
                        onChange={(e) => handleLinkChange(vp.id, e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <div className="relative w-24">
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Days"
                        value={vp.leadTimeDays || ''}
                        onChange={(e) => handleLeadTimeChange(vp.id, e.target.value)}
                        className="pl-7"
                        title="Lead time in days"
                      />
                    </div>
                    {vp.link && (
                      <a
                        href={vp.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRow(vp.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {vendors.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No vendors available. Add vendors in the Vendors section first.
          </p>
        )}

        {/* Save button for vendor prices */}
        {onSave && hasUnsavedChanges && (
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Vendor Prices'}
          </Button>
        )}

        {!isEditing && vendorPrices.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Vendor prices will be saved after the item is created.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
