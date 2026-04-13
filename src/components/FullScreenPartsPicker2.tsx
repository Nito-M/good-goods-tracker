import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Search, Trash2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

export interface PartsPickerCartItem2 {
  id: string;
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

interface FullScreenPartsPicker2Props {
  open: boolean;
  onClose: (items: PartsPickerCartItem2[]) => void;
  parts: PartRow[];
  existingPartIds: string[];
}

let nextId = 1;
function tempId() {
  return `temp2-${Date.now()}-${nextId++}`;
}

export function FullScreenPartsPicker2({
  open,
  onClose,
  parts,
  existingPartIds,
}: FullScreenPartsPicker2Props) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<PartsPickerCartItem2[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setCart([]);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose([]);
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Only parts from Parts Library 2
  const filteredParts = useMemo(() => {
    const q = search.toLowerCase();
    return parts
      .filter(p => !existingPartIds.includes(p.id) && !cart.some(c => c.part_id === p.id))
      .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [parts, existingPartIds, cart, search]);

  const addToCart = (partId: string, name: string, sku: string, price: number) => {
    const existing = cart.find(c => c.part_id === partId);
    if (existing) {
      setCart(cart.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        id: tempId(),
        part_id: partId,
        inventory_item_id: null,
        part_name: name,
        part_sku: sku,
        quantity: 1,
        unitCost: price,
        notes: '',
      }]);
    }
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(cart.map(c => c.id === id ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between gap-4 bg-card">
        <div className="flex items-center gap-3 flex-1">
          <Wrench className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Add Parts from Library 2</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{cart.length} in cart</Badge>
          <Button variant="outline" size="sm" onClick={() => onClose([])}>Cancel</Button>
          <Button size="sm" onClick={() => onClose(cart)} disabled={cart.length === 0}>
            Add {cart.length} Part{cart.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Parts list */}
        <div className="flex-1 flex flex-col overflow-hidden border-r">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search parts by name or SKU..."
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-28">SKU</TableHead>
                  <TableHead className="w-24 text-right">Price</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {search ? 'No matching parts found' : 'No parts available'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => addToCart(p.id, p.name, p.sku, p.price)}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.sku || '—'}</TableCell>
                      <TableCell className="text-right">{p.price > 0 ? formatCurrency(p.price) : '—'}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Cart */}
        <div className="w-80 flex flex-col overflow-hidden bg-muted/30">
          <div className="p-3 border-b font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Cart ({cart.length})
          </div>
          <ScrollArea className="flex-1">
            {cart.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Click parts to add them
              </div>
            ) : (
              <div className="divide-y">
                {cart.map(item => (
                  <div key={item.id} className="p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.part_name}</p>
                      <p className="text-xs text-muted-foreground">{item.part_sku || '—'}</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateCartQty(item.id, Number(e.target.value))}
                      className="h-7 w-16 text-center text-sm px-1"
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
