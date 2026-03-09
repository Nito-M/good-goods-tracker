import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { CartDrawer } from '@/components/CartDrawer';

interface ShopHeaderProps {
  storeName?: string;
  tagline?: string;
  logoUrl?: string | null;
  announcement?: string;
  shopBasePath?: string;
}

export function ShopHeader({ storeName = 'Shop', tagline, logoUrl, announcement, shopBasePath = '/shop' }: ShopHeaderProps) {
  return (
    <>
      {announcement && (
        <div className="bg-primary text-primary-foreground text-center text-sm py-2 px-4">
          {announcement}
        </div>
      )}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to={shopBasePath} className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-16 w-auto max-w-[200px] object-contain rounded" />
              ) : (
                <ShoppingBag className="h-8 w-8 text-primary" />
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight text-card-foreground leading-tight">
                  {storeName}
                </h1>
                {tagline && (
                  <p className="text-xs text-muted-foreground leading-tight">{tagline}</p>
                )}
              </div>
            </Link>
            <CartDrawer />
          </div>
        </div>
      </header>
    </>
  );
}
