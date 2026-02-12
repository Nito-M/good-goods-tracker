import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { Eye, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useItemThumbnails } from '@/hooks/useItemThumbnails';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
}

export function InventoryTable({ items, onDelete }: InventoryTableProps) {
  const navigate = useNavigate();
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const thumbnailMap = useItemThumbnails(itemIds);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold text-card-foreground w-12"></TableHead>
            <TableHead className="font-semibold text-card-foreground">Product Name</TableHead>
            <TableHead className="font-semibold text-card-foreground">Category</TableHead>
            <TableHead className="font-semibold text-card-foreground text-right">Quantity</TableHead>
            <TableHead className="font-semibold text-card-foreground text-right">Price</TableHead>
            <TableHead className="font-semibold text-card-foreground text-right">Total Value</TableHead>
            <TableHead className="font-semibold text-card-foreground">Status</TableHead>
            <TableHead className="font-semibold text-card-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const isLowStock = item.quantity <= item.minStock;
              return (
                <TableRow
                  key={item.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <TableCell className="w-12">
                    {(thumbnailMap.get(item.id) || item.imageUrl) ? (
                      <img
                        src={thumbnailMap.get(item.id) || item.imageUrl!}
                        alt={item.name}
                        className="w-10 h-10 object-contain rounded-md border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md border border-border bg-muted/50 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-card-foreground">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantity} {item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : ''}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(item.quantity * item.price)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'font-medium',
                        isLowStock
                          ? 'bg-warning/10 text-warning hover:bg-warning/20'
                          : 'bg-success/10 text-success hover:bg-success/20'
                      )}
                    >
                      {isLowStock ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="h-8 w-8 text-muted-foreground hover:text-card-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
