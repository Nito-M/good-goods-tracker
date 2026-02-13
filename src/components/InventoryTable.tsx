import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { ImageIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import { useItemThumbnails } from '@/hooks/useItemThumbnails';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
}

export function InventoryTable({ items, onDelete }: InventoryTableProps) {
  const navigate = useNavigate();
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const thumbnailMap = useItemThumbnails(itemIds);
  const [viewerImage, setViewerImage] = useState<{ url: string; alt: string } | null>(null);

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                  <TableCell className="w-14 py-1">
                    {(thumbnailMap.get(item.id) || item.imageUrl) ? (
                      <img
                        src={thumbnailMap.get(item.id) || item.imageUrl!}
                        alt={item.name}
                        className="w-12 h-12 object-contain rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerImage({ url: thumbnailMap.get(item.id) || item.imageUrl!, alt: item.name });
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md border border-border bg-muted/50 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell
                    className="font-medium text-card-foreground cursor-pointer hover:underline"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    {item.name}
                  </TableCell>
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
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <ImageViewerDialog
        imageUrl={viewerImage?.url ?? null}
        alt={viewerImage?.alt ?? ''}
        open={!!viewerImage}
        onOpenChange={(open) => { if (!open) setViewerImage(null); }}
      />
    </div>
  );
}
