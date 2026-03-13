import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAssets, Asset } from '@/hooks/useAssets';
import { AddAssetDialog } from '@/components/AddAssetDialog';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/15 text-green-700 dark:text-green-400',
  'in service': 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  down: 'bg-red-500/15 text-red-700 dark:text-red-400',
  sold: 'bg-muted text-muted-foreground',
};

export function Assets() {
  const { assets, loading, addAsset, uploadAssetImage } = useAssets();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.asset_type.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-card-foreground">Assets</h1>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Asset
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">No assets found.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                className="border border-border rounded-lg bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <div className="flex gap-3">
                  {asset.image_url ? (
                    <img
                      src={asset.image_url}
                      alt={asset.name}
                      className="h-16 w-16 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Truck className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground truncate">{asset.name}</h3>
                    <p className="text-xs text-muted-foreground">{asset.asset_type} · {asset.brand} {asset.year || ''}</p>
                    <Badge variant="secondary" className={`mt-1 text-xs ${STATUS_COLORS[asset.status] || ''}`}>
                      {asset.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AddAssetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={async (data) => {
          await addAsset(data);
          setDialogOpen(false);
        }}
        uploadImage={uploadAssetImage}
      />
    </div>
  );
}
