import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Search, Trash2, Wrench, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

export interface PartsPickerCartItem {
  id: string; // temp id for cart
  part_id: string | null;
  inventory_item_id: string | null;
  part_name: string;
  part_sku: string;
  quantity: number;
  unitCost: number;
  notes: string;
}

interface PartRow {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface InventoryRow {
  id: string;
  name: string;
  sku: string;
  cost: number;
}

interface FullScreenPartsPickerProps {
  open: boolean;
  onClose: (items: PartsPickerCartItem[]) => void;
  parts: PartRow[];
  inventoryItems: InventoryRow[];
  existingPartIds: string[];
  existingInventoryItemIds: string[];
}

let nextId = 1;
function tempId() {
  return `temp-${Date.now()}-${nextId++}`;
}

export function FullScreenPartsPicker({
  open,
  onClose,
  parts,
  inventoryItems,
  existingPartIds,
  existingInventoryItemIds,
}: FullScreenPartsPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState<'parts' | 'inventory'>('parts');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cart, setCart] = useState<PartsPickerCartItem[]>([]);

  const closedByBackRef = useRef(false);

  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setCart([]);
      setSource('parts');
      closedByBackRef.current = false;
      window.history.pushState({ picker: 'parts' }, '');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePopState = () => {
      closedByBackRef.current = true;
      onClose(cart);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open, cart, onClose]);

  const handleDone = () => {
    if (!closedByBackRef.current) {
      window.history.back();
    }
  };

  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return parts;
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return parts.filter((p) => {
      const hay = `${p.name} ${p.sku}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [parts, searchQuery]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventoryItems;
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return inventoryItems.filter((i) => {
      const hay = `${i.name} ${i.sku}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [inventoryItems, searchQuery]);

  const currentList = source === 'parts' ? filteredParts : filteredInventory;

  const isAlreadyAdded = useCallback((type: 'parts' | 'inventory', id: string) => {
    if (type === 'parts') {
      return existingPartIds.includes(id) || cart.some((c) => c.part_id === id);
    }
    return existingInventoryItemIds.includes(id) || cart.some((c) => c.inventory_item_id === id);
  }, [existingPartIds, existingInventoryItemIds, cart]);

  const addPartToCart = (p: PartRow) => {
    if (isAlreadyAdded('parts', p.id)) return;
    setCart((prev) => [...prev, {
      id: tempId(),
      part_id: p.id,
      inventory_item_id: null,
      part_name: p.name,
      part_sku: p.sku,
      quantity: 1,
      unitCost: p.price,
      notes: '',
    }]);
  };

  const addInventoryToCart = (i: InventoryRow) => {
    if (isAlreadyAdded('inventory', i.id)) return;
    setCart((prev) => [...prev, {
      id: tempId(),
      part_id: null,
      inventory_item_id: i.id,
      part_name: i.name,
      part_sku: i.sku,
      quantity: 1,
      unitCost: i.cost,
      notes: '',
    }]);
  };

  const handleAddFromList = (index: number) => {
    if (source === 'parts') {
      const p = filteredParts[index];
      if (p) addPartToCart(p);
    } else {
      const i = filteredInventory[index];
      if (i) addInventoryToCart(i);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, currentList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && currentList.length > 0) {
      e.preventDefault();
      handleAddFromList(selectedIndex);
    } else if (e.key === 'Escape') {
      handleDone();
    }
  }, [currentList, selectedIndex, cart]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, source]);

  const updateCartQty = (id: string, qty: number | null) => {
    setCart((prev) => prev.map((c) => c.id === id ? { ...c, quantity: qty ?? 1 } : c));
  };

  const updateCartNotes = (id: string, notes: string) => {
    setCart((prev) => prev.map((c) => c.id === id ? { ...c, notes } : c));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity * c.unitCost, 0),
    [cart]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-card-foreground">Add Parts to Assembly</h2>
          <Badge variant="secondary" className="text-sm">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={source === 'parts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSource('parts')}
          >
            <Wrench className="h-4 w-4 mr-1" />
            Parts Library
          </Button>
          <Button
            variant={source === 'inventory' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSource('inventory')}
          >
            <Package className="h-4 w-4 mr-1" />
            Inventory
          </Button>
          <Button onClick={handleDone} size="lg" className="ml-2">
            Done — Return to Assembly
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Search + Results */}
        <div className="flex-1 flex flex-col border-r border-border min-w-0">
          <div className="p-4 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={source === 'parts' ? 'Search parts by name or SKU...' : 'Search inventory by name or SKU...'}
                className="pl-12 h-12 text-base"
                autoFocus
              />
              {searchQuery && (
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">{source === 'parts' ? 'Price' : 'Cost'}</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                      {searchQuery ? 'No items match your search' : `No ${source === 'parts' ? 'parts' : 'inventory items'}`}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentList.map((item, index) => {
                    const added = isAlreadyAdded(source, item.id);
                    const cost = source === 'parts' ? (item as PartRow).price : (item as InventoryRow).cost;
                    return (
                      <TableRow
                        key={item.id}
                        className={`cursor-pointer ${index === selectedIndex ? 'bg-accent' : ''} ${added ? 'opacity-50' : ''}`}
                        onClick={() => !added && handleAddFromList(index)}
                      >
                        <TableCell className="font-medium">
                          {item.name}
                          {added && <Badge variant="outline" className="ml-2 text-xs">Added</Badge>}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{item.sku}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(cost)}</TableCell>
                        <TableCell>
                          {!added && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAddFromList(index); }}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="border-t border-border px-4 py-2 text-sm text-muted-foreground shrink-0">
            {currentList.length} {source === 'parts' ? 'parts' : 'items'}
            {searchQuery && ` matching "${searchQuery}"`}
            <span className="ml-4 text-xs">↑↓ Navigate · Enter to add · Esc to close</span>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-96 flex flex-col bg-card shrink-0">
          <div className="p-4 border-b border-border shrink-0">
            <h3 className="font-semibold text-card-foreground">Assembly Parts</h3>
            <p className="text-sm text-muted-foreground">
              {cart.length} {cart.length === 1 ? 'item' : 'items'} · {formatCurrency(cartTotal)}
            </p>
          </div>

          <ScrollArea className="flex-1">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No parts added yet.</p>
                <p className="text-xs mt-1">Click items on the left to add them.</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {cart.map((c) => (
                  <div key={c.id} className="border border-border rounded-lg p-3 space-y-2 bg-background">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          {c.inventory_item_id && <Package className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <p className="font-medium text-sm truncate">{c.part_name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.part_sku || 'No SKU'}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => removeFromCart(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        type="number"
                        className="w-24 h-7 text-center text-sm"
                        value={c.quantity}
                        onChange={(e) => updateCartQty(c.id, e.target.value === '' ? null : parseInt(e.target.value))}
                        min={1}
                      />
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatCurrency(c.unitCost)} ea</p>
                        <p className="text-sm font-semibold">{formatCurrency(c.quantity * c.unitCost)}</p>
                      </div>
                    </div>
                    <Input
                      value={c.notes}
                      onChange={(e) => updateCartNotes(c.id, e.target.value)}
                      placeholder="Add note..."
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-border p-4 space-y-3 shrink-0">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Cost</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <Button onClick={() => onClose(cart)} className="w-full" size="lg">
              Done — Return to Assembly
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
