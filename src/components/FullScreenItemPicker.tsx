import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Search, Trash2, Minus, Layers, PackagePlus } from 'lucide-react';
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
  documentType: 'Quote' | 'Invoice' | 'Part';
  formatPrice?: (value: number) => string;
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
}: FullScreenItemPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssemblies, setShowAssemblies] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Focus search on open
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return inventoryItems;
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return inventoryItems.filter((item) => {
      const haystack = `${item.name} ${item.sku} ${item.internalPartNumber || ''}`.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [inventoryItems, searchQuery]);

  const filteredAssemblies = useMemo(() => {
    if (!searchQuery.trim()) return assemblies;
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return assemblies.filter((a) => {
      const haystack = `${a.name} ${a.description || ''}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [assemblies, searchQuery]);

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
      onClose();
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
              onClick={() => setShowAssemblies(!showAssemblies)}
            >
              <Layers className="h-4 w-4 mr-1" />
              Assemblies
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/add-item')}
          >
            <PackagePlus className="h-4 w-4 mr-1" />
            Create New Item
          </Button>
          <Button onClick={onClose} size="lg" className="ml-2">
            Done — Return to {documentType}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Search + Results */}
        <div className="flex-1 flex flex-col border-r border-border min-w-0">
          {/* Search Bar */}
          <div className="p-4 border-b border-border shrink-0">
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
          </div>

          {/* Results Table */}
          <ScrollArea className="flex-1">
            {showAssemblies ? (
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
                  <div key={c.id} className="border border-border rounded-lg p-3 space-y-2 bg-background">
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
                      <Input
                        type="number"
                        className="w-24 h-7 text-center text-sm"
                        value={c.quantity ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateQuantity(c.id, val === '' ? null : parseFloat(val));
                        }}
                        min={0}
                        step={0.01}
                      />
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatPrice(c.unitPrice)} ea</p>
                        <p className="text-sm font-semibold">{formatPrice((c.quantity || 0) * c.unitPrice)}</p>
                      </div>
                    </div>

                    {/* Editable price for custom items */}
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
            <Button onClick={onClose} className="w-full" size="lg">
              Done — Return to {documentType}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
