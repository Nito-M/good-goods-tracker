import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, ExternalLink, Truck, Plus, Upload, X, FileText, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAssets, useAssetParts, useAssetMaintenance, useAssetDocuments, useAssetNotes } from '@/hooks/useAssets';
import { useInventory } from '@/hooks/useInventory';
import { AddAssetDialog } from '@/components/AddAssetDialog';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/15 text-green-700 dark:text-green-400',
  'in service': 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  down: 'bg-red-500/15 text-red-700 dark:text-red-400',
  sold: 'bg-muted text-muted-foreground',
};

export function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { assets, loading, updateAsset, deleteAsset, uploadAssetImage } = useAssets();
  const { parts, addPart, removePart } = useAssetParts(id);
  const { records, addRecord, deleteRecord } = useAssetMaintenance(id);
  const { documents, uploadDocument, deleteDocument } = useAssetDocuments(id);
  const { notes: assetNotes, addNote, updateNote: updateAssetNote, deleteNote } = useAssetNotes(id);
  const { allItems } = useInventory();

  const asset = assets.find((a) => a.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Add part state
  const [partSearch, setPartSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partInstallDate, setPartInstallDate] = useState('');
  const [partNotes, setPartNotes] = useState('');
  const [partMode, setPartMode] = useState<'inventory' | 'custom'>('inventory');
  const [customItemName, setCustomItemName] = useState('');

  // Add maintenance state
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10));
  const [mDesc, setMDesc] = useState('');
  const [mParts, setMParts] = useState('');
  const [mCost, setMCost] = useState('');
  const [mTech, setMTech] = useState('');

  if (loading) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!asset) return <p className="p-6 text-muted-foreground">Asset not found.</p>;

  const handleDelete = async () => {
    if (!confirm('Delete this asset?')) return;
    await deleteAsset(asset.id);
    navigate('/assets');
  };

  const filteredItems = allItems.filter((i) => {
    const q = partSearch.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q);
  }).slice(0, 8);

  const handleAddPart = async () => {
    const name = partMode === 'inventory' ? selectedItemName : customItemName;
    if (!name) return;
    await addPart({
      inventory_item_id: partMode === 'inventory' ? selectedItemId : null,
      item_name: name,
      quantity: parseFloat(partQty) || 1,
      install_date: partInstallDate || null,
      notes: partNotes || null,
    });
    setAddPartOpen(false);
    setPartSearch('');
    setSelectedItemId(null);
    setSelectedItemName('');
    setCustomItemName('');
    setPartQty('1');
    setPartInstallDate('');
    setPartNotes('');
    setPartMode('inventory');
    toast({ title: 'Part added' });
  };

  const handleAddMaintenance = async () => {
    if (!mDesc.trim()) return;
    await addRecord({
      service_date: mDate,
      description: mDesc,
      parts_used: mParts || null,
      cost: parseFloat(mCost) || 0,
      technician: mTech,
    });
    setAddMaintenanceOpen(false);
    setMDesc('');
    setMParts('');
    setMCost('');
    setMTech('');
    toast({ title: 'Maintenance record added' });
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadDocument(file);
    toast({ title: 'Document uploaded' });
  };

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-bold text-card-foreground truncate">{asset.name}</h1>
              <Badge className={STATUS_COLORS[asset.status] || ''}>{asset.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parts">Parts Installed</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  {asset.image_url ? (
                    <img src={asset.image_url} alt={asset.name} className="w-full h-48 object-cover rounded-md mb-4" />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center mb-4">
                      <Truck className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">{asset.name}</h3>
                  <p className="text-sm text-muted-foreground">{asset.asset_type} · {asset.brand} {asset.model}</p>
                  {asset.external_link && (
                    <a href={asset.external_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" /> Manual / Spec
                    </a>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <Row label="Year" value={asset.year?.toString()} />
                    <Row label="Serial Number" value={asset.serial_number} />
                    <Row label="VIN" value={asset.vin} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Location</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <Row label="Current Location" value={asset.current_location} />
                    <Row label="Assigned Shop" value={asset.assigned_shop} />
                    <Row label="Assigned Employee" value={asset.assigned_employee} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Tracking</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <Row label="Odometer" value={asset.odometer?.toLocaleString()} />
                    <Row label="Engine Hours" value={asset.engine_hours?.toLocaleString()} />
                    <Row label="Last Service" value={asset.last_service_date} />
                    <Row label="Service Interval" value={asset.service_interval_days ? `${asset.service_interval_days} days` : undefined} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PARTS INSTALLED */}
          <TabsContent value="parts">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Parts Installed</h3>
              <Button size="sm" onClick={() => setAddPartOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Part
              </Button>
            </div>
            {parts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No parts installed yet.</p>
            ) : (
              <div className="space-y-2">
                {parts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border border-border rounded-md p-3 bg-card">
                    <div>
                      <p className="text-sm font-medium">{p.item_name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {p.quantity}{p.install_date ? ` · Installed: ${p.install_date}` : ''}{p.notes ? ` · ${p.notes}` : ''}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePart(p.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* MAINTENANCE */}
          <TabsContent value="maintenance">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Maintenance History</h3>
              <Button size="sm" onClick={() => setAddMaintenanceOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Log Service
              </Button>
            </div>
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance records.</p>
            ) : (
              <div className="space-y-2">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-border rounded-md p-3 bg-card">
                    <div>
                      <p className="text-sm font-medium">{r.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.service_date}{r.technician ? ` · ${r.technician}` : ''}{r.cost ? ` · $${Number(r.cost).toFixed(2)}` : ''}
                        {r.parts_used ? ` · Parts: ${r.parts_used}` : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRecord(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Documents</h3>
              <label>
                <Button size="sm" asChild>
                  <span><Upload className="h-4 w-4 mr-1" /> Upload</span>
                </Button>
                <input type="file" className="hidden" onChange={handleDocUpload} />
              </label>
            </div>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between border border-border rounded-md p-3 bg-card">
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <FileText className="h-4 w-4" /> {d.file_name}
                    </a>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDocument(d.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <AddAssetDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={asset}
        onSave={async (data) => {
          await updateAsset(asset.id, data);
          setEditOpen(false);
        }}
        uploadImage={uploadAssetImage}
      />

      {/* Add Part Dialog */}
      <Dialog open={addPartOpen} onOpenChange={setAddPartOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Part</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant={partMode === 'inventory' ? 'default' : 'outline'} size="sm" onClick={() => setPartMode('inventory')}>From Inventory</Button>
              <Button variant={partMode === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setPartMode('custom')}>Custom Item</Button>
            </div>
            {partMode === 'inventory' ? (
              <div>
                <Label>Search Inventory</Label>
                <Input value={partSearch} onChange={(e) => { setPartSearch(e.target.value); setSelectedItemId(null); setSelectedItemName(''); }} placeholder="Search by name or SKU..." />
                {partSearch && !selectedItemId && (
                  <div className="border border-border rounded-md mt-1 max-h-40 overflow-y-auto bg-card">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setSelectedItemName(item.name);
                          setPartSearch(item.name);
                        }}
                      >
                        {item.name} <span className="text-muted-foreground">({item.sku})</span>
                      </div>
                    ))}
                    {filteredItems.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No items found</p>}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label>Item Name</Label>
                <Input value={customItemName} onChange={(e) => setCustomItemName(e.target.value)} placeholder="Enter custom part name..." />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantity</Label><Input type="number" value={partQty} onChange={(e) => setPartQty(e.target.value)} min="1" /></div>
              <div><Label>Install Date</Label><Input type="date" value={partInstallDate} onChange={(e) => setPartInstallDate(e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Input value={partNotes} onChange={(e) => setPartNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPartOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPart} disabled={partMode === 'inventory' ? !selectedItemName : !customItemName.trim()}>Add Part</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Dialog */}
      <Dialog open={addMaintenanceOpen} onOpenChange={setAddMaintenanceOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Service Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date</Label><Input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} /></div>
            <div><Label>Description *</Label><Input value={mDesc} onChange={(e) => setMDesc(e.target.value)} placeholder="Oil change, tire rotation..." /></div>
            <div><Label>Parts Used</Label><Input value={mParts} onChange={(e) => setMParts(e.target.value)} placeholder="Oil filter, 5W-30 oil..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cost</Label><Input type="number" value={mCost} onChange={(e) => setMCost(e.target.value)} /></div>
              <div><Label>Technician</Label><Input value={mTech} onChange={(e) => setMTech(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMaintenanceOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMaintenance} disabled={!mDesc.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
