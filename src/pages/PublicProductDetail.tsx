import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShopHeader } from '@/components/ShopHeader';
import { useCart } from '@/contexts/CartContext';

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

export function PublicProductDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [addQty, setAddQty] = useState(1);
  const { addToCart } = useCart();

  const shopBase = `/shop/${slug}`;

  useEffect(() => {
    if (!id || !slug) return;
    (async () => {
      setLoading(true);
      try {
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
      } catch (e) {
        console.error('Error loading product:', e);
      }
      setLoading(false);
    })();
  }, [id, slug]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

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
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Product Not Found</h2>
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

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader shopBasePath={shopBase} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4">
        <Link to={shopBase}>
          <Button variant="ghost" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Button>
        </Link>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="h-full w-full object-contain" />
              ) : (
                <Package className="h-24 w-24 text-muted-foreground/30" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.signed_url)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImage === img.signed_url ? 'border-primary' : 'border-border hover:border-primary/50'
                    }`}
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
              <h1 className="text-3xl font-bold text-card-foreground">{product.name}</h1>
              <p className="text-muted-foreground mt-1">SKU: {product.sku}</p>
            </div>

            <div className="text-3xl font-bold text-primary">{formatPrice(product.price)}</div>

            <Separator />

            {!outOfStock && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-card-foreground">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={addQty <= 1} onClick={() => setAddQty((q) => Math.max(1, q - 1))}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-10 text-center font-semibold">{addQty}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={addQty >= product.quantity} onClick={() => setAddQty((q) => Math.min(product.quantity, q + 1))}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">({product.quantity} available)</span>
                </div>
                <Button className="w-full gap-2" size="lg" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart — {formatPrice(product.price * addQty)}
                </Button>
              </div>
            )}

            {outOfStock && (
              <Button className="w-full" size="lg" disabled>Out of Stock</Button>
            )}

            <Separator />

            {product.description && (
              <div>
                <h3 className="font-semibold text-card-foreground mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Availability</span>
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
    </div>
  );
}
