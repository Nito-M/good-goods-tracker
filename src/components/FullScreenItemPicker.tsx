import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Search, Trash2, Minus, Layers, PackagePlus, Check, ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InventoryItem, QuantityUnit, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Generic cart item shape that both Quotes and Sales can use
export interface PickerCartItem {
  id: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number | null;
  quantityUnit: QuantityUnit;
  unitPrice: number;
  unitCost: number;
  notes: string;
}

interface Assembly {
  id: string;
  name: string;
  description: string | null;
  selling_price: number;
  type?: string;
}

interface FullScreenItemPickerProps {
  open: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  cart: PickerCartItem[];
  onAddItem: (item: InventoryItem) => void;
  onAddCustomItem: () => void;
  onAddAssembly?: (assembly: Assembly) => void;
  onUpdateQuantity: (itemId: string, quantity: number | null) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: Partial<PickerCartItem>) => void;
  assemblies?: Assembly[];
  documentType: 'Quote' | 'Invoice' | 'Part' | 'Purchase Order';
  formatPrice?: (value: number) => string;
  vendorItemIds?: string[] | null;
  vendorName?: string;
}

function CartItemRow({
  item: c,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateItem,
  formatPrice,
}: {
  item: PickerCartItem;
  onUpdateQuantity: (itemId: string, quantity: number | null) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: Partial<PickerCartItem>) => void;
  formatPrice: (value: number) => string;
}) {
  const [localQty, setLocalQty] = useState<string>(c.quantity != null ? String(c.quantity) : '');
  const committed = c.quantity;

  useEffect(() => {
    setLocalQty(c.quantity != null ? String(c.quantity) : '');
  }, [c.quantity]);

  const parsedLocal = localQty === '' ? null : parseFloat(localQty);
  const isDirty = parsedLocal !== committed;

  const commit = () => {
    if (isDirty) onUpdateQuantity(c.id, parsedLocal);
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-2 bg-background">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {!c.inventoryItemId && onUpdateItem ? (
            <Input
              value={c.itemName}
              onChange={(e) => onUpdateItem(c.id, { itemName: e.target.value })}
              placeholder="Item name..."
              className="h-7 text-sm font-medium"
            />
          ) : (
            <p className="font-medium text-sm truncate">{c.itemName}</p>
          )}
          <p className="text-xs text-muted-foreground">{c.sku || 'No SKU'}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive shrink-0"
          onClick={() => onRemoveItem(c.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            className="w-24 h-7 text-center text-sm"
            value={localQty}
            onChange={(e) => setLocalQty(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
            onBlur={commit}
            min={0}
            step={0.01}
          />
          {isDirty && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-primary shrink-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commit}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{formatPrice(c.unitPrice)} ea</p>
          <p className="text-sm font-semibold">{formatPrice((c.quantity || 0) * c.unitPrice)}</p>
        </div>
      </div>

      {!c.inventoryItemId && onUpdateItem && (
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">SKU</Label>
            <Input
              value={c.sku}
              onChange={(e) => onUpdateItem(c.id, { sku: e.target.value })}
              placeholder="SKU"
              className="h-7 text-xs"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Price</Label>
            <Input
              type="number"
              value={c.unitPrice}
              onChange={(e) => onUpdateItem(c.id, { unitPrice: parseFloat(e.target.value) || 0 })}
              className="h-7 text-xs"
              step="0.01"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function FullScreenItemPicker({
  open,
  onClose,
  inventoryItems,
  cart,
  onAddItem,
  onAddCustomItem,
  onAddAssembly,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateItem,
  assemblies = [],
  documentType,
  formatPrice = formatCurrency,
  vendorItemIds,
  vendorName,
}: FullScreenItemPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssemblies, setShowAssemblies] = useState(false);
  const [selectedAssemblyType, setSelectedAssemblyType] = useState<string | null>(null);
  const [vendorOnly, setVendorOnly] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);

  const handleCreateNewItemClick = () => {
    if (documentType === 'Purchase Order') {
      setConfirmCreateOpen(true);
    } else {
      navigate('/items/new');
    }
  };

  const handleConfirmCreateNewItem = () => {
    setConfirmCreateOpen(false);
    navigate('/items/new');
  };

  const assemblyTypes = useMemo(() => {
    const typeMap = new Map<string, number>();
    assemblies.forEach(a => {
      const t = a.type || 'General';
      typeMap.set(t, (typeMap.get(t) || 0) + 1);
    });
    return Array.from(typeMap.entries()).map(([name, count]) => ({ name, count }));
  }, [assemblies]);

  const closedByBackRef = useRef(false);
  const historyPushedRef = useRef(false);
  const closingFromActionRef = useRef(false);

  // Focus search on open + push history state
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      closedByBackRef.current = false;

      if (!historyPushedRef.current) {
        historyPushedRef.current = true;
        window.history.pushState({ picker: 'items' }, '');
      }

      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      historyPushedRef.current = false;
      closingFromActionRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePopState = () => {
      if (closingFromActionRef.current) {
        closingFromActionRef.current = false;
        return;
      }

      if (historyPushedRef.current) {
        historyPushedRef.current = false;
        closedByBackRef.current = true;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open, onClose]);

  const handleDone = () => {
    if (closedByBackRef.current) {
      onClose();
      return;
    }

    closingFromActionRef.current = true;
    onClose();

    if (historyPushedRef.current) {
      window.history.back();
    }
  };


  const filteredItems = useMemo(() => {
    let items = inventoryItems;
    if (vendorOnly && vendorItemIds) {
      const idSet = new Set(vendorItemIds);
      items = items.filter((item) => idSet.has(item.id));
    }
    if (!searchQuery.trim()) return items;
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      const haystack = `${item.name} ${item.sku} ${item.internalPartNumber || ''}`.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [inventoryItems, searchQuery, vendorOnly, vendorItemIds]);

  const filteredAssemblies = useMemo(() => {
    let list = assemblies;
    if (selectedAssemblyType) {
      list = list.filter(a => (a.type || 'General') === selectedAssemblyType);
    }
    if (!searchQuery.trim()) return list;
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return list.filter((a) => {
      const haystack = `${a.name} ${a.description || ''}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [assemblies, searchQuery, selectedAssemblyType]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = showAssemblies ? filteredAssemblies : filteredItems;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && items.length > 0) {
      e.preventDefault();
      if (showAssemblies) {
        const assembly = filteredAssemblies[selectedIndex];
        if (assembly && onAddAssembly) onAddAssembly(assembly);
      } else {
        const item = filteredItems[selectedIndex];
        if (item) onAddItem(item);
      }
    } else if (e.key === 'Escape') {
      handleDone();
    }
  }, [showAssemblies, filteredAssemblies, filteredItems, selectedIndex, onAddItem, onAddAssembly, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, showAssemblies]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, c) => sum + (c.quantity || 0) * c.unitPrice, 0),
    [cart]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-card-foreground">
            Add Items to {documentType}
          </h2>
          <Badge variant="secondary" className="text-sm">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAddCustomItem}>
            <Plus className="h-4 w-4 mr-1" />
            Custom Item
          </Button>
          {onAddAssembly && assemblies.length > 0 && (
            <Button
              variant={showAssemblies ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setShowAssemblies(!showAssemblies); setSelectedAssemblyType(null); }}
            >
              <Layers className="h-4 w-4 mr-1" />
              Assemblies
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNewItemClick}
          >
            <PackagePlus className="h-4 w-4 mr-1" />
            Create New Item
          </Button>
          <Button onClick={handleDone} size="lg" className="ml-2">
            Done — Return to {documentType}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Search + Results */}
        <div className="flex-1 flex flex-col border-r border-border min-w-0">
          {/* Search Bar */}
          <div className="p-4 border-b border-border shrink-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by item name, SKU, or barcode..."
                className="pl-12 h-12 text-base"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {vendorItemIds && vendorItemIds.length > 0 && !showAssemblies && (
              <Button
                variant={vendorOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVendorOnly(!vendorOnly)}
                className="gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                {vendorOnly ? `Showing ${vendorName || 'Vendor'} items only` : `Filter by ${vendorName || 'Vendor'}`}
              </Button>
            )}
          </div>

          {/* Results Table */}
          <ScrollArea className="flex-1">
            {showAssemblies ? (
              !selectedAssemblyType ? (
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {assemblyTypes.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => setSelectedAssemblyType(name)}
                      className="border border-border rounded-lg p-6 text-left hover:bg-accent transition-colors cursor-pointer"
                    >
                      <p className="font-semibold text-lg">{name}</p>
                      <p className="text-sm text-muted-foreground">{count} {count === 1 ? 'assembly' : 'assemblies'}</p>
                    </button>
                  ))}
                  {assemblyTypes.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-12">No assemblies available</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAssemblyType(null)}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <span className="font-medium">{selectedAssemblyType}</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assembly</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">MSRP</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssemblies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                            No assemblies found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAssemblies.map((assembly, index) => (
                          <TableRow
                            key={assembly.id}
                            className={`cursor-pointer ${index === selectedIndex ? 'bg-accent' : ''}`}
                            onClick={() => onAddAssembly?.(assembly)}
                          >
                            <TableCell className="font-medium">{assembly.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                              {assembly.description || '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {assembly.selling_price > 0 ? formatPrice(assembly.selling_price) : '—'}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAddAssembly?.(assembly); }}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                        {searchQuery ? 'No items match your search' : 'No inventory items'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={`cursor-pointer ${index === selectedIndex ? 'bg-accent' : ''}`}
                        onClick={() => onAddItem(item)}
                      >
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.sku}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={item.quantity <= item.minStock ? 'text-destructive font-medium' : ''}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(item.price)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); onAddItem(item); }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {/* Results footer */}
          <div className="border-t border-border px-4 py-2 text-sm text-muted-foreground shrink-0">
            {showAssemblies
              ? `${filteredAssemblies.length} assemblies`
              : `${filteredItems.length} items`
            }
            {searchQuery && ` matching "${searchQuery}"`}
            <span className="ml-4 text-xs">↑↓ Navigate · Enter to add · Esc to close</span>
          </div>
        </div>

        {/* Right: Live Cart Panel */}
        <div className="w-96 flex flex-col bg-card shrink-0">
          <div className="p-4 border-b border-border shrink-0">
            <h3 className="font-semibold text-card-foreground">
              {documentType} Items
            </h3>
            <p className="text-sm text-muted-foreground">
              {cart.length} {cart.length === 1 ? 'item' : 'items'} · {formatPrice(cartSubtotal)}
            </p>
          </div>

          <ScrollArea className="flex-1">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No items added yet.</p>
                <p className="text-xs mt-1">Click items on the left to add them.</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {cart.map((c) => (
                  <CartItemRow
                    key={c.id}
                    item={c}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                    onUpdateItem={onUpdateItem}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Cart footer */}
          <div className="border-t border-border p-4 space-y-3 shrink-0">
            <div className="flex justify-between font-bold text-lg">
              <span>Subtotal</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
            <Button onClick={handleDone} className="w-full" size="lg">
              Done — Return to {documentType}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
