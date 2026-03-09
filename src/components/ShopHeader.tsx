import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { CartDrawer } from '@/components/CartDrawer';

interface ShopHeaderProps {
  storeName?: string;
  tagline?: string;
  logoUrl?: string | null;
  announcement?: string;
  shopBasePath?: string;
  accentColor?: string;
  buttonColor?: string;
  textColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  headerNavColor?: string;
  categories?: string[];
}

export function ShopHeader({ 
  storeName = 'Shop', 
  tagline, 
  logoUrl, 
  announcement, 
  shopBasePath = '/shop', 
  accentColor, 
  buttonColor, 
  textColor,
  headerBgColor,
  headerTextColor,
  headerNavColor,
  categories = []
}: ShopHeaderProps) {
  const resolvedTextColor = headerTextColor || textColor;

  return (
    <>
      {announcement && (
        <div
          className="text-center text-sm py-2 px-4"
          style={{ backgroundColor: accentColor || undefined, color: '#fff' }}
        >
          {announcement}
        </div>
      )}
      <header
        className="border-b border-border sticky top-0 z-10"
        style={{ backgroundColor: headerBgColor || undefined }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link to={shopBasePath} className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-16 w-auto max-w-[200px] object-contain rounded" />
              ) : (
                <ShoppingBag className="h-8 w-8" style={{ color: accentColor || resolvedTextColor || undefined }} />
              )}
              <div>
                <h1
                  className="text-xl font-bold tracking-tight leading-tight"
                  style={{ color: resolvedTextColor || undefined }}
                >
                  {storeName}
                </h1>
                {tagline && (
                  <p className="text-xs leading-tight" style={{ color: resolvedTextColor ? `${resolvedTextColor}aa` : undefined }}>{tagline}</p>
                )}
              </div>
            </Link>
            <CartDrawer />
          </div>
          {categories.length > 0 && (
            <nav className="flex gap-1 border-t py-2 overflow-x-auto" style={{ borderColor: resolvedTextColor ? `${resolvedTextColor}22` : undefined }}>
              <Link 
                to={shopBasePath}
                className="px-3 py-1.5 text-sm font-medium rounded hover:opacity-80 transition-opacity whitespace-nowrap"
                style={{ color: headerNavColor || resolvedTextColor || undefined }}
              >
                All Products
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat}
                  to={`${shopBasePath}/category/${encodeURIComponent(cat)}`}
                  className="px-3 py-1.5 text-sm font-medium rounded hover:opacity-80 transition-opacity whitespace-nowrap"
                  style={{ color: headerNavColor || resolvedTextColor || undefined }}
                >
                  {cat}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
