import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Filter, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ShopHeader } from '@/components/ShopHeader';
import { useCart } from '@/contexts/CartContext';

interface PublicProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string | null;
  quantity: number;
  quantity_unit: string;
  price: number;
  description: string | null;
}

interface StoreSettings {
  store_name: string;
  tagline: string;
  logo_url: string | null;
  logo_signed: string | null;
  announcement_text: string;
}

export function PublicShop() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('public-storefront');
        if (!error && data) {
          setProducts(data.products || []);
          setThumbnails(data.thumbnails || {});
          setSettings(data.settings || null);
        }
      } catch (e) {
        console.error('Error loading shop:', e);
      }
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;

    if (search) {
      const tokens = search.toLowerCase().split(/\s+/);
      result = result.filter((p) => {
        const hay = `${p.name} ${p.sku} ${p.category} ${p.description || ''}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }

    if (category !== 'all') {
      result = result.filter((p) => p.category === category);
    }

    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else result = [...result].sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, search, category, sortBy]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const handleAddToCart = (e: React.MouseEvent, product: PublicProduct) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    if (product.quantity <= 0) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      maxQuantity: product.quantity,
      imageUrl: thumbnails[product.id] || null,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader
        storeName={settings?.store_name}
        tagline={settings?.tagline}
        logoUrl={settings?.logo_signed}
        announcement={settings?.announcement_text}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Product count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
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
            {filtered.map((product) => {
              const thumb = thumbnails[product.id];
              const outOfStock = product.quantity <= 0;
              return (
                <Link to={`/shop/${product.id}`} key={product.id} className="block">
                  <Card className="group overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="h-full w-full object-contain transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-16 w-16 text-muted-foreground/30" />
                      )}
                      {outOfStock && (
                        <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-2 flex-1 flex flex-col">
                      <h3 className="font-semibold text-card-foreground truncate">{product.name}</h3>
                      <Badge variant="outline" className="text-xs w-fit">{product.category}</Badge>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        {!outOfStock ? (
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1.5 h-8"
                            onClick={(e) => handleAddToCart(e, product)}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Add
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sold out</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
