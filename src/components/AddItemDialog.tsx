import { useState, useEffect } from 'react';
import { InventoryItem, Dimensions, QuantityUnit, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editItem?: InventoryItem | null;
  onUpdate?: (id: string, updates: Partial<InventoryItem>) => void;
  onDelete?: (id: string) => void;
  categories: string[];
}

const DEFAULT_DIMENSIONS: Dimensions = { length: 0, width: 0, height: 0, unit: 'in' };

export function AddItemDialog({ open, onOpenChange, onSave, editItem, onUpdate, onDelete, categories }: AddItemDialogProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || 'Other');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>('pcs');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [dimensions, setDimensions] = useState<Dimensions>(DEFAULT_DIMENSIONS);
  const [colors, setColors] = useState('');
  const [description, setDescription] = useState('');

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
      setMaxStock(String(editItem.maxStock || ''));
      setWeight(String(editItem.weight));
      setWeightUnit(editItem.weightUnit);
      setDimensions(editItem.dimensions);
      setColors(editItem.colors.join(', '));
      setDescription(editItem.description);
    } else {
      setName('');
      setSku('');
      setCategory(categories[0] || 'Other');
      setQuantity('');
      setQuantityUnit('pcs');
      setPrice('');
      setCost('');
      setMinStock('');
      setMaxStock('');
      setWeight('');
      setWeightUnit('lb');
      setDimensions(DEFAULT_DIMENSIONS);
      setColors('');
      setDescription('');
    }
  }, [editItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      name,
      sku,
      category,
      quantity: parseFloat(quantity) || 0,
      quantityUnit,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      minStock: parseFloat(minStock) || 0,
      weight: parseFloat(weight) || 0,
      weightUnit,
      dimensions,
      colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
      description,
      palletAmount: 0,
      boxAmount: 0,
      bundleAmount: 0,
      pieceLength: 0,
    };

    if (editItem && onUpdate) {
      onUpdate(editItem.id, itemData);
    } else {
      onSave(itemData);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <form id="item-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            
            <div className="grid grid-cols-3 gap-4">
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
                    <SelectTrigger className="w-24">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="colors">Colors (comma-separated)</Label>
              <Input
                id="colors"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="e.g. Black, White, Blue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description..."
                rows={3}
              />
            </div>
          </form>
        </ScrollArea>
        <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
          <div className="flex-1">
            {editItem && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(editItem.id);
                  onOpenChange(false);
                }}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Item
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="item-form">
              {editItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
