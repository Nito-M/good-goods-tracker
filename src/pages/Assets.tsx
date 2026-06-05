import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Truck, Users, Briefcase, Mail, Phone, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAssets } from '@/hooks/useAssets';
import { useWorkers, Worker } from '@/hooks/useWorkers';
import { AddAssetDialog } from '@/components/AddAssetDialog';
import { AddWorkerDialog } from '@/components/AddWorkerDialog';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/15 text-green-700 dark:text-green-400',
  'in service': 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  down: 'bg-red-500/15 text-red-700 dark:text-red-400',
  sold: 'bg-muted text-muted-foreground',
  inactive: 'bg-muted text-muted-foreground',
};

export function Assets() {
  const { assets, loading, addAsset, uploadAssetImage } = useAssets();
  const { workers, loading: workersLoading, addWorker, updateWorker, uploadWorkerPhoto } = useWorkers();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'assets' | 'workers'>('assets');
  const [assetDialog, setAssetDialog] = useState(false);
  const [workerDialog, setWorkerDialog] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [category, setCategory] = useState<string>('');
  const navigate = useNavigate();

  const assetTypes = useMemo(() => {
    const types = new Set(assets.map((a) => a.asset_type).filter(Boolean));
    return Array.from(types).sort();
  }, [assets]);

  const filteredAssets = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      a.asset_type.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q);
    const matchesCategory = category === 'all' || a.asset_type === category;
    return matchesSearch && matchesCategory && category !== '';
  });

  const filteredWorkers = workers.filter((w) => {
    const q = search.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      (w.email || '').toLowerCase().includes(q) ||
      (w.job_title || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-card-foreground">Business Info</h1>
            </div>
            {tab === 'assets' ? (
              <Button size="sm" onClick={() => setAssetDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Asset
              </Button>
            ) : (
              <Button size="sm" onClick={() => { setEditWorker(null); setWorkerDialog(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Worker
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'assets' | 'workers')}>
          <TabsList className="mb-4">
            <TabsTrigger value="assets"><Truck className="h-4 w-4 mr-1.5" />Assets</TabsTrigger>
            <TabsTrigger value="workers"><Users className="h-4 w-4 mr-1.5" />Staff Directory</TabsTrigger>
          </TabsList>

          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tab === 'assets' ? 'Search assets...' : 'Search workers...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="assets">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : assetTypes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No assets yet. Click "Add Asset" to add one.</p>
            ) : (
              <>
                {category === '' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Choose a category to view assets:</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <button
                        onClick={() => setCategory('all')}
                        className="flex items-center gap-3 border border-border rounded-lg bg-card p-4 cursor-pointer hover:shadow-md transition-shadow text-left"
                      >
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <LayoutGrid className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-foreground">All</h3>
                          <p className="text-xs text-muted-foreground">{assets.length} assets</p>
                        </div>
                      </button>
                      {assetTypes.map((t) => {
                        const count = assets.filter((a) => a.asset_type === t).length;
                        return (
                          <button
                            key={t}
                            onClick={() => setCategory(t)}
                            className="flex items-center gap-3 border border-border rounded-lg bg-card p-4 cursor-pointer hover:shadow-md transition-shadow text-left"
                          >
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-foreground">{t}</h3>
                              <p className="text-xs text-muted-foreground">{count} assets</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={category === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategory('all')}
                      >
                        All
                      </Button>
                      {assetTypes.map((t) => (
                        <Button
                          key={t}
                          variant={category === t ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCategory(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                    {filteredAssets.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No assets found.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredAssets.map((asset) => (
                          <div
                            key={asset.id}
                            className="border border-border rounded-lg bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/assets/${asset.id}`)}
                          >
                            <div className="flex gap-3">
                              {asset.display_image_url ? (
                                <img src={asset.display_image_url} alt={asset.name} className="h-16 w-16 rounded-md object-cover shrink-0" />
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
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="workers">
            {workersLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : filteredWorkers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No workers yet. Click "Add Worker" to add one.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="border border-border rounded-lg bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/workers/${worker.id}`)}
                  >
                    <div className="flex gap-3">
                      {worker.photo_url ? (
                        <img src={worker.photo_url} alt={worker.name} className="h-16 w-16 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-foreground truncate">{worker.name}</h3>
                        {worker.job_title && <p className="text-xs text-muted-foreground truncate">{worker.job_title}</p>}
                        {worker.email && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {worker.email}
                          </p>
                        )}
                        {worker.phone && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {worker.phone}
                          </p>
                        )}
                        <Badge variant="secondary" className={`mt-1 text-xs ${STATUS_COLORS[worker.status] || ''}`}>
                          {worker.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AddAssetDialog
        open={assetDialog}
        onOpenChange={setAssetDialog}
        onSave={async (data) => { await addAsset(data); setAssetDialog(false); }}
        uploadImage={uploadAssetImage}
      />

      <AddWorkerDialog
        open={workerDialog}
        onOpenChange={(o) => { setWorkerDialog(o); if (!o) setEditWorker(null); }}
        uploadPhoto={uploadWorkerPhoto}
        initial={editWorker}
        onSave={async (data) => {
          if (editWorker) {
            await updateWorker(editWorker.id, data);
            return editWorker;
          }
          return await addWorker(data);
        }}
      />
    </div>
  );
}
