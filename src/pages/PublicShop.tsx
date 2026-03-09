import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Package, Filter, ShoppingCart, ExternalLink, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  storefront_page: string | null;
}

interface StoreSettings {
  store_name: string;
  tagline: string;
  logo_url: string | null;
  logo_signed: string | null;
  announcement_text: string;
  header_banner_url: string | null;
  banner_signed: string | null;
  header_bg_color: string;
  header_text_color: string;
  header_nav_color: string;
  background_color: string;
  background_image_url: string | null;
  bg_image_signed: string | null;
  background_overlay_opacity: number;
  background_blur: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  button_color: string;
  text_color: string;
  product_card_spacing: string;
  product_image_shape: string;
  grid_columns: number;
  show_featured_section: boolean;
  welcome_message: string;
  product_card_bg_color: string;
  show_prices: boolean;
  enable_search: boolean;
  enable_categories: boolean;
  contact_button_text: string;
  contact_button_url: string;
  link_button_text: string;
  link_button_url: string;
}

function buildShopStyles(s: StoreSettings | null): React.CSSProperties {
  if (!s) return {};
  return {
    '--shop-primary': s.primary_color || '#000000',
    '--shop-secondary': s.secondary_color || '#6b7280',
    '--shop-accent': s.accent_color || '#3b82f6',
    '--shop-button': s.button_color || '#3b82f6',
    '--shop-text': s.text_color || '#000000',
    '--shop-card-bg': s.product_card_bg_color || '#ffffff',
    '--shop-bg': s.background_color || '#ffffff',
  } as React.CSSProperties;
}

function getGridCols(cols: number | undefined) {
  switch (cols) {
    case 2: return 'grid-cols-1 sm:grid-cols-2';
    case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    case 5: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
    case 6: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
    default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }
}

function getSpacingGap(spacing: string | undefined) {
  switch (spacing) {
    case 'compact': return 'gap-3';
    case 'loose': return 'gap-10';
    default: return 'gap-6';
  }
}

export function PublicShop() {
  const { slug, category: urlCategory } = useParams<{ slug: string; category?: string }>();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(urlCategory || 'all');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [categoryPages, setCategoryPages] = useState<string[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    if (urlCategory) {
      setCategory(decodeURIComponent(urlCategory));
    } else {
      setCategory('all');
    }
  }, [urlCategory]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-storefront?slug=${encodeURIComponent(slug)}`;
        const res = await fetch(url, {
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const result = await res.json();
        if (result.error) {
          setNotFound(true);
        } else {
          setProducts(result.products || []);
          setThumbnails(result.thumbnails || {});
          setSettings(result.settings || null);
          setCategoryPages(result.categories || []);
        }
      } catch (e) {
        console.error('Error loading shop:', e);
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [slug]);

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
    e.preventDefault();
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

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Store Not Found</h2>
          <p className="text-muted-foreground">This store doesn't exist or is not available.</p>
        </div>
      </div>
    );
  }

  const showSearch = settings?.enable_search !== false;
  const showCategories = settings?.enable_categories !== false;
  const showPrices = settings?.show_prices !== false;
  const imageShape = settings?.product_image_shape || 'square';

  const bgStyle: React.CSSProperties = {};
  if (settings?.background_color) bgStyle.backgroundColor = settings.background_color;

  return (
    <div
      className="min-h-screen relative"
      style={{ ...buildShopStyles(settings), ...bgStyle }}
    >
      {/* Background image overlay */}
      {settings?.bg_image_signed && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${settings.bg_image_signed})`,
            filter: settings.background_blur ? `blur(${settings.background_blur}px)` : undefined,
          }}
        >
          {(settings.background_overlay_opacity ?? 0) > 0 && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0,0,0,${(settings.background_overlay_opacity ?? 0) / 100})` }}
            />
          )}
        </div>
      )}

      <div className="relative z-[1]">
        <ShopHeader
          storeName={settings?.store_name}
          tagline={settings?.tagline}
          logoUrl={settings?.logo_signed}
          announcement={settings?.announcement_text}
          shopBasePath={`/shop/${slug}`}
          accentColor={settings?.accent_color}
          buttonColor={settings?.button_color}
          textColor={settings?.text_color}
          headerBgColor={settings?.header_bg_color}
          headerTextColor={settings?.header_text_color}
          headerNavColor={settings?.header_nav_color}
          categories={categoryPages}
        />

        {/* Banner */}
        {settings?.banner_signed && (
          <div className="w-full h-48 sm:h-64 overflow-hidden">
            <img
              src={settings.banner_signed}
              alt="Store banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Welcome message & action buttons */}
        {(settings?.welcome_message || settings?.contact_button_text || settings?.link_button_text) && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
            {settings?.welcome_message && (
              <p className="text-lg mb-4" style={{ color: settings?.text_color || undefined }}>
                {settings.welcome_message}
              </p>
            )}
            <div className="flex gap-3 flex-wrap">
              {settings?.contact_button_text && settings?.contact_button_url && (
                <a href={settings.contact_button_url} target="_blank" rel="noopener noreferrer">
                  <Button style={{ backgroundColor: settings?.button_color || undefined, color: '#fff' }} className="gap-2">
                    <Mail className="h-4 w-4" />
                    {settings.contact_button_text}
                  </Button>
                </a>
              )}
              {settings?.link_button_text && settings?.link_button_url && (
                <a href={settings.link_button_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2" style={{ borderColor: settings?.button_color || undefined, color: settings?.button_color || undefined }}>
                    <ExternalLink className="h-4 w-4" />
                    {settings.link_button_text}
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: settings?.secondary_color || undefined }}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {(showSearch || showCategories) && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              {showSearch && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: settings?.secondary_color || undefined }} />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              {showCategories && (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div style={{ color: settings?.secondary_color || undefined }}>Loading products...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Package className="h-12 w-12" style={{ color: settings?.secondary_color || undefined, opacity: 0.5 }} />
              <p style={{ color: settings?.secondary_color || undefined }}>No products found</p>
            </div>
          ) : (
            <div className={`grid ${getSpacingGap(settings?.product_card_spacing)} ${getGridCols(settings?.grid_columns)}`}>
              {filtered.map((product) => {
                const thumb = thumbnails[product.id];
                const outOfStock = product.quantity <= 0;
                return (
                  <Link to={`/shop/${slug}/${product.id}`} key={product.id} className="block">
                    <Card
                      className="group overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col"
                      style={{ backgroundColor: settings?.product_card_bg_color || undefined }}
                    >
                      <div className={`relative aspect-square bg-muted/30 flex items-center justify-center overflow-hidden ${imageShape === 'rounded' ? 'rounded-xl m-2' : ''}`}>
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={product.name}
                            className={`h-full w-full object-contain transition-transform group-hover:scale-105 ${imageShape === 'rounded' ? 'rounded-xl' : ''}`}
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-16 w-16" style={{ color: settings?.secondary_color || undefined, opacity: 0.3 }} />
                        )}
                        {outOfStock && (
                          <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-2 flex-1 flex flex-col">
                        <h3 className="font-semibold truncate" style={{ color: settings?.text_color || undefined }}>{product.name}</h3>
                        <Badge variant="outline" className="text-xs w-fit">{product.category}</Badge>
                        {product.description && (
                          <p className="text-sm line-clamp-2" style={{ color: settings?.secondary_color || undefined }}>{product.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                          {showPrices ? (
                            <span className="text-lg font-bold" style={{ color: settings?.accent_color || undefined }}>
                              {formatPrice(product.price)}
                            </span>
                          ) : (
                            <span />
                          )}
                          {!outOfStock ? (
                            <Button
                              size="sm"
                              className="gap-1.5 h-8"
                              style={{ backgroundColor: settings?.button_color || undefined, color: '#fff' }}
                              onClick={(e) => handleAddToCart(e, product)}
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Add
                            </Button>
                          ) : (
                            <span className="text-xs" style={{ color: settings?.secondary_color || undefined }}>Sold out</span>
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
    </div>
  );
}
