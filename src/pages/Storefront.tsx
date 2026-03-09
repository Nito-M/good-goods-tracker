import { useState, useMemo } from 'react';
import { Search, ShoppingBag, Filter, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem } from '@/types/inventory';
import { useItemThumbnails } from '@/hooks/useItemThumbnails';
import { formatCurrency } from '@/lib/utils';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

interface StorefrontProps {
  items: InventoryItem[];
  loading: boolean;
  categories: string[];
}

export function Storefront({ items, loading, categories }: StorefrontProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // Only show in-stock items
  const availableItems = useMemo(() => {
    return items.filter((i) => i.quantity > 0);
  }, [items]);

  const filtered = useMemo(() => {
    let result = availableItems;

    if (search) {
      const tokens = search.toLowerCase().split(/\s+/);
      result = result.filter((item) => {
        const hay = `${item.name} ${item.sku} ${item.category} ${item.description || ''}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }

    if (category !== 'all') {
      result = result.filter((i) => i.category === category);
    }

    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else result = [...result].sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [availableItems, search, category, sortBy]);

  const itemIds = useMemo(() => filtered.map((i) => i.id), [filtered]);
  const { thumbnailMap } = useItemThumbnails(itemIds);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Storefront</h1>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading products...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => {
              const thumb = thumbnailMap.get(item.id);
              return (
                <Card
                  key={item.id}
                  className="group overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  {/* Image */}
                  <div
                    className="relative aspect-square bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => thumb && setViewerImage(thumb)}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.name}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-muted-foreground/30" />
                    )}
                    {item.quantity <= item.minStock && (
                      <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                        Low Stock
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-card-foreground truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>

                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.quantity} {item.quantityUnit} available
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {viewerImage && (
        <ImageViewerDialog
          imageUrl={viewerImage}
          open={!!viewerImage}
          onClose={() => setViewerImage(null)}
        />
      )}
    </div>
  );
}
