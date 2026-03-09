import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingCart, Plus, Minus, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShopHeader } from '@/components/ShopHeader';
import { useCart } from '@/contexts/CartContext';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
interface ProductData {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string | null;
  quantity: number;
  quantity_unit: string;
  price: number;
  description: string | null;
  main_image_signed: string | null;
}

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  signed_url: string;
}

interface StoreSettings {
  store_name: string;
  tagline: string;
  logo_signed: string | null;
  announcement_text: string;
  header_bg_color: string;
  header_text_color: string;
  header_nav_color: string;
  background_color: string;
  bg_image_signed: string | null;
  background_overlay_opacity: number;
  background_blur: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  button_color: string;
  text_color: string;
  product_card_bg_color: string;
  show_prices: boolean;
}

export function PublicProductDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { addToCart } = useCart();

  const shopBase = `/shop/${slug}`;

  useEffect(() => {
    if (!id || !slug) return;
    (async () => {
      setLoading(true);
      try {
        // Fetch product data
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-storefront?slug=${encodeURIComponent(slug)}&id=${id}`;
        const res = await fetch(url, {
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product || null);
          setImages(data.images || []);
          const primary = (data.images || []).find((img: ProductImage) => img.is_primary);
          setSelectedImage(
            primary?.signed_url || data.images?.[0]?.signed_url || data.product?.main_image_signed || null
          );
        }

        // Fetch settings separately
        const settingsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-storefront?slug=${encodeURIComponent(slug)}&settings=true`;
        const settingsRes = await fetch(settingsUrl, {
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData.settings || null);
        }
      } catch (e) {
        console.error('Error loading product:', e);
      }
      setLoading(false);
    })();
  }, [id, slug]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const showPrices = settings?.show_prices !== false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">This product is no longer available.</p>
          <Link to={shopBase}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const outOfStock = product.quantity <= 0;

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        maxQuantity: product.quantity,
        imageUrl: selectedImage,
      },
      addQty
    );
    setAddQty(1);
  };

  const bgStyle: React.CSSProperties = {};
  if (settings?.background_color) bgStyle.backgroundColor = settings.background_color;

  return (
    <div className="min-h-screen relative" style={bgStyle}>
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
          shopBasePath={shopBase}
          accentColor={settings?.accent_color}
          buttonColor={settings?.button_color}
          textColor={settings?.text_color}
          headerBgColor={settings?.header_bg_color}
          headerTextColor={settings?.header_text_color}
          headerNavColor={settings?.header_nav_color}
        />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4">
          <Link to={shopBase}>
            <Button variant="ghost" className="gap-2 -ml-2" style={{ color: settings?.text_color || undefined }}>
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Button>
          </Link>
        </div>

        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div
                className="aspect-square rounded-lg overflow-hidden flex items-center justify-center relative group cursor-pointer"
                style={{ backgroundColor: settings?.product_card_bg_color || 'hsl(var(--muted)/0.3)' }}
                onClick={() => selectedImage && setViewerOpen(true)}
              >
                {selectedImage ? (
                  <>
                    <img src={selectedImage} alt={product.name} className="h-full w-full object-contain" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3">
                        <ZoomIn className="h-6 w-6" style={{ color: settings?.text_color || undefined }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <Package className="h-24 w-24" style={{ color: settings?.secondary_color || undefined, opacity: 0.3 }} />
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.signed_url)}
                      className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors"
                      style={{
                        borderColor: selectedImage === img.signed_url
                          ? (settings?.accent_color || 'hsl(var(--primary))')
                          : 'hsl(var(--border))',
                      }}
                    >
                      <img src={img.signed_url} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  {product.subcategory && <Badge variant="outline">{product.subcategory}</Badge>}
                  {outOfStock && <Badge variant="destructive">Out of Stock</Badge>}
                </div>
                <h1 className="text-3xl font-bold" style={{ color: settings?.text_color || undefined }}>{product.name}</h1>
                <p className="mt-1" style={{ color: settings?.secondary_color || undefined }}>SKU: {product.sku}</p>
              </div>

              {showPrices && (
                <div className="text-3xl font-bold" style={{ color: settings?.accent_color || undefined }}>
                  {formatPrice(product.price)}
                </div>
              )}

              <Separator />

              {!outOfStock && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: settings?.text_color || undefined }}>Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={addQty <= 1} onClick={() => setAddQty((q) => Math.max(1, q - 1))}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-10 text-center font-semibold" style={{ color: settings?.text_color || undefined }}>{addQty}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={addQty >= product.quantity} onClick={() => setAddQty((q) => Math.min(product.quantity, q + 1))}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <span className="text-xs" style={{ color: settings?.secondary_color || undefined }}>({product.quantity} available)</span>
                  </div>
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleAddToCart}
                    style={{ backgroundColor: settings?.button_color || undefined, color: '#fff' }}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart{showPrices ? ` — ${formatPrice(product.price * addQty)}` : ''}
                  </Button>
                </div>
              )}

              {outOfStock && (
                <Button className="w-full" size="lg" disabled>Out of Stock</Button>
              )}

              <Separator />

              {product.description && (
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: settings?.text_color || undefined }}>Description</h3>
                  <p className="whitespace-pre-line" style={{ color: settings?.secondary_color || undefined }}>{product.description}</p>
                </div>
              )}

              <Card style={{ backgroundColor: settings?.product_card_bg_color || undefined }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: settings?.secondary_color || undefined }}>Availability</span>
                    {outOfStock ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : (
                      <Badge className="bg-success/10 text-success hover:bg-success/20">
                        {product.quantity} {product.quantity_unit !== 'pcs' ? product.quantity_unit : ''} In Stock
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Image Viewer Dialog */}
        <ImageViewerDialog
          imageUrl={selectedImage}
          alt={product?.name || 'Product image'}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      </div>
    </div>
  );
}
