import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, ExternalLink, Truck, Plus, Upload, X, FileText, Package, Camera, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { useAssets, useAssetParts, useAssetMaintenance, useAssetDocuments, useAssetNotes } from '@/hooks/useAssets';
import { useAssetAvailableParts, AssetAvailablePart } from '@/hooks/useAssetAvailableParts';
import { useAssetImages } from '@/hooks/useAssetImages';
import { useInventory } from '@/hooks/useInventory';
import { useItemThumbnails } from '@/hooks/useItemThumbnails';
import { useVendors } from '@/hooks/useVendors';
import { useWarehouses } from '@/hooks/useWarehouses';
import { AddAssetDialog } from '@/components/AddAssetDialog';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
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
  const { parts, addPart, removePart, updatePart } = useAssetParts(id);
  const { records, addRecord, deleteRecord } = useAssetMaintenance(id);
  const { images: assetImages, primaryImage: primaryAssetImage, addImage: addAssetImage, deleteImage: deleteAssetImage, setPrimaryImage: setPrimaryAssetImage } = useAssetImages(id);
  const { documents, uploadDocument, deleteDocument } = useAssetDocuments(id);
  const { notes: assetNotes, addNote, updateNote: updateAssetNote, deleteNote } = useAssetNotes(id);
  const { parts: availableParts, addPart: addAvailablePart, updatePart: updateAvailablePart, removePart: removeAvailablePart, uploadImage: uploadAvailablePartImage } = useAssetAvailableParts(id);

  // Available parts dialog state
  const [availPartOpen, setAvailPartOpen] = useState(false);
  const [editingAvailPart, setEditingAvailPart] = useState<AssetAvailablePart | null>(null);
  const [apName, setApName] = useState('');
  const [apSku, setApSku] = useState('');
  const [apPrice, setApPrice] = useState('');
  const [apLink, setApLink] = useState('');
  const [apImageUrl, setApImageUrl] = useState('');
  const [apVendor, setApVendor] = useState('');
  const [apVendorLocation, setApVendorLocation] = useState('');
  const [apNotes, setApNotes] = useState('');
  const [apUploading, setApUploading] = useState(false);

  const resetAvailPartForm = () => {
    setEditingAvailPart(null);
    setApName(''); setApSku(''); setApPrice(''); setApLink('');
    setApImageUrl(''); setApVendor(''); setApVendorLocation(''); setApNotes('');
  };

  const openEditAvailPart = (p: AssetAvailablePart) => {
    setEditingAvailPart(p);
    setApName(p.name);
    setApSku(p.sku || '');
    setApPrice(p.price?.toString() || '');
    setApLink(p.link || '');
    setApImageUrl(p.image_url || '');
    setApVendor(p.vendor || '');
    setApVendorLocation(p.vendor_location || '');
    setApNotes(p.notes || '');
    setAvailPartOpen(true);
  };

  const handleSaveAvailPart = async () => {
    if (!apName.trim()) return;
    const payload = {
      name: apName.trim(),
      sku: apSku.trim() || null,
      price: apPrice ? parseFloat(apPrice) : null,
      link: apLink.trim() || null,
      image_url: apImageUrl || null,
      vendor: apVendor.trim() || null,
      vendor_location: apVendorLocation.trim() || null,
      notes: apNotes.trim() || null,
    };
    if (editingAvailPart) {
      await updateAvailablePart(editingAvailPart.id, payload);
    } else {
      await addAvailablePart(payload);
    }
    setAvailPartOpen(false);
    resetAvailPartForm();
    toast({ title: editingAvailPart ? 'Part updated' : 'Part added' });
  };

  const handleAvailPartImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setApUploading(true);
    const url = await uploadAvailablePartImage(file);
    if (url) setApImageUrl(url);
    setApUploading(false);
  };
  const { allItems } = useInventory();
  const { vendors } = useVendors();
  const { warehouses } = useWarehouses();

  const asset = assets.find((a) => a.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Add part state
  const [partSearch, setPartSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partInstallDate, setPartInstallDate] = useState('');
  const [partInstalledBy, setPartInstalledBy] = useState('');
  const [partRemoveDate, setPartRemoveDate] = useState('');
  const [partNotes, setPartNotes] = useState('');
  const [partMode, setPartMode] = useState<'inventory' | 'custom'>('inventory');
  const [customItemName, setCustomItemName] = useState('');
  const [deductFromInventory, setDeductFromInventory] = useState(true);

  // Edit part state
  const [editPartOpen, setEditPartOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<typeof parts[0] | null>(null);
  const [editPartName, setEditPartName] = useState('');
  const [editPartQty, setEditPartQty] = useState('1');
  const [editPartInstallDate, setEditPartInstallDate] = useState('');
  const [editPartInstalledBy, setEditPartInstalledBy] = useState('');
  const [editPartRemoveDate, setEditPartRemoveDate] = useState('');
  const [editPartNotes, setEditPartNotes] = useState('');

  // Maintenance state
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10));
  const [mDesc, setMDesc] = useState('');
  const [mParts, setMParts] = useState('');
  const [mCost, setMCost] = useState('');
  const [mTech, setMTech] = useState('');

  // Build a map of inventory items for parts display
  const inventoryMap = useMemo(() => {
    const map = new Map<string, typeof allItems[0]>();
    allItems.forEach((i) => map.set(i.id, i));
    return map;
  }, [allItems]);

  // Get thumbnails for linked inventory items
  const linkedItemIds = useMemo(() => parts.filter(p => p.inventory_item_id).map(p => p.inventory_item_id!), [parts]);
  const thumbnailMap = useItemThumbnails(linkedItemIds);

  // Selected item details for preview
  const selectedItem = selectedItemId ? inventoryMap.get(selectedItemId) : null;

  if (loading) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!asset) return <p className="p-6 text-muted-foreground">Asset not found.</p>;

  const handleDelete = async () => {
    if (!confirm('Delete this asset?')) return;
    await deleteAsset(asset.id);
    navigate('/assets');
  };

  const filteredItems = allItems.filter((i) => {
    const q = partSearch.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || (i.internalPartNumber || '').toLowerCase().includes(q);
  }).slice(0, 10);

  const handleImageClick = (url: string) => {
    setViewerImage(url);
    setViewerOpen(true);
  };

  const resetPartForm = () => {
    setPartSearch('');
    setSelectedItemId(null);
    setSelectedItemName('');
    setCustomItemName('');
    setPartQty('1');
    setPartInstallDate('');
    setPartInstalledBy('');
    setPartRemoveDate('');
    setPartNotes('');
    setPartMode('inventory');
    setDeductFromInventory(true);
  };

  const handleAddPart = async () => {
    const name = partMode === 'inventory' ? selectedItemName : customItemName;
    if (!name) return;
    await addPart({
      inventory_item_id: partMode === 'inventory' ? selectedItemId : null,
      item_name: name,
      quantity: parseFloat(partQty) || 1,
      install_date: partInstallDate || null,
      installed_by: partInstalledBy || null,
      remove_date: partRemoveDate || null,
      notes: partNotes || null,
    }, partMode === 'inventory' && deductFromInventory);
    setAddPartOpen(false);
    resetPartForm();
    toast({ title: 'Part added' });
  };

  const openEditPart = (p: typeof parts[0]) => {
    setEditingPart(p);
    setEditPartName(p.item_name);
    setEditPartQty(p.quantity.toString());
    setEditPartInstallDate(p.install_date || '');
    setEditPartInstalledBy(p.installed_by || '');
    setEditPartRemoveDate(p.remove_date || '');
    setEditPartNotes(p.notes || '');
    setEditPartOpen(true);
  };

  const handleUpdatePart = async () => {
    if (!editingPart) return;
    await updatePart(editingPart.id, {
      item_name: editPartName,
      quantity: parseFloat(editPartQty) || 1,
      install_date: editPartInstallDate || null,
      installed_by: editPartInstalledBy || null,
      remove_date: editPartRemoveDate || null,
      notes: editPartNotes || null,
    });
    setEditPartOpen(false);
    setEditingPart(null);
    toast({ title: 'Part updated' });
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
            <TabsTrigger value="available">Available Parts</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  {/* Image Gallery */}
                  {assetImages.length > 0 || asset.image_url ? (
                    <div className="space-y-2 mb-4">
                      {/* Main image - show primary */}
                      <img 
                        src={primaryAssetImage ? primaryAssetImage.image_url : asset.image_url!} 
                        alt={asset.name} 
                        className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => handleImageClick(primaryAssetImage ? primaryAssetImage.image_url : asset.image_url!)}
                      />
                      {/* Thumbnail strip */}
                      {(assetImages.length > 1 || (assetImages.length > 0 && asset.image_url)) && (
                        <div className="flex gap-2 flex-wrap">
                          {assetImages.map((img) => (
                            <div key={img.id} className="relative group">
                              <img
                                src={img.image_url}
                                alt=""
                                className={`h-14 w-14 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 ${img.is_primary ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                                onClick={() => handleImageClick(img.image_url)}
                              />
                              {img.is_primary && (
                                <Star className="absolute top-0.5 left-0.5 h-3 w-3 text-primary fill-primary" />
                              )}
                              <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!img.is_primary && (
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-5 w-5 rounded-full"
                                    title="Set as main photo"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPrimaryAssetImage(img.id);
                                    }}
                                  >
                                    <Star className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-5 w-5 rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAssetImage(img.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Single image delete when only legacy image_url */}
                      {assetImages.length === 0 && asset.image_url && (
                        <div className="flex gap-2 flex-wrap">
                          <div className="relative group">
                            <img
                              src={asset.image_url}
                              alt=""
                              className="h-14 w-14 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity border border-border"
                              onClick={() => handleImageClick(asset.image_url!)}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await updateAsset(asset.id, { image_url: null });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center mb-4">
                      <Truck className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Add photo button */}
                  <label className="mb-4 block">
                    <Button size="sm" variant="outline" asChild className="cursor-pointer">
                      <span><Camera className="h-4 w-4 mr-1" /> Add Photo</span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files) return;
                        for (const file of Array.from(files)) {
                          await addAssetImage(file);
                        }
                        e.target.value = '';
                        toast({ title: 'Photo(s) added' });
                      }}
                    />
                  </label>
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
                    <InfoRow label="Year" value={asset.year?.toString()} />
                    <InfoRow label="Serial Number" value={asset.serial_number} />
                     <InfoRow label="VIN" value={asset.vin} />
                     <InfoRow label="Motor Type" value={asset.motor_type} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Location</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <InfoRow label="Current Location" value={asset.current_location} />
                    <InfoRow label="Assigned Shop" value={asset.assigned_shop} />
                    <InfoRow label="Assigned Employee" value={asset.assigned_employee} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Tracking</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <InfoRow label="Odometer" value={asset.odometer?.toLocaleString()} />
                    <InfoRow label="Engine Hours" value={asset.engine_hours?.toLocaleString()} />
                    <InfoRow label="Last Service" value={asset.last_service_date} />
                    <InfoRow label="Service Interval" value={asset.service_interval_days ? `${asset.service_interval_days} days` : undefined} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PARTS INSTALLED */}
          <TabsContent value="parts">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Parts Installed</h3>
              <Button size="sm" onClick={() => { resetPartForm(); setAddPartOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Part
              </Button>
            </div>
            {parts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No parts installed yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Photo</TableHead>
                    <TableHead>Part Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty Installed</TableHead>
                    <TableHead>Install Date</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Inventory Qty</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.map((p) => {
                    const inv = p.inventory_item_id ? inventoryMap.get(p.inventory_item_id) : null;
                    const thumb = p.inventory_item_id ? thumbnailMap.get(p.inventory_item_id) : null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          {thumb ? (
                            <img 
                              src={thumb} 
                              alt="" 
                              className="h-8 w-8 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={(e) => { e.stopPropagation(); handleImageClick(thumb); }}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.inventory_item_id ? (
                            <Link to={`/item/${p.inventory_item_id}`} className="text-primary hover:underline font-medium text-sm">
                              {p.item_name}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium">{p.item_name}</span>
                          )}
                          {p.installed_by && <p className="text-xs text-muted-foreground">By: {p.installed_by}</p>}
                          {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{inv?.sku || '—'}</TableCell>
                        <TableCell className="text-right text-sm">{p.quantity}</TableCell>
                        <TableCell className="text-sm">{p.install_date || '—'}</TableCell>
                        <TableCell className="text-right text-sm">{inv ? `$${inv.cost.toFixed(2)}` : '—'}</TableCell>
                        <TableCell className="text-right text-sm">{inv ? inv.quantity : '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPart(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePart(p.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* AVAILABLE PARTS (catalog of parts that could be installed) */}
          <TabsContent value="available">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Available Parts</h3>
                <p className="text-xs text-muted-foreground">Reference catalog of parts available for this asset (not yet installed).</p>
              </div>
              <Button size="sm" onClick={() => { resetAvailPartForm(); setAvailPartOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Available Part
              </Button>
            </div>
            {availableParts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available parts saved yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableParts.map((p) => (
                  <Card key={p.id} className="overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(p.image_url!)}
                      />
                    ) : (
                      <div className="w-full h-36 bg-muted flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="pt-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight">{p.name}</h4>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditAvailPart(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAvailablePart(p.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                      {p.price != null && <p className="text-sm font-medium">${Number(p.price).toFixed(2)}</p>}
                      {p.vendor && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">Vendor: </span>{p.vendor}
                          {p.vendor_location ? <span className="text-muted-foreground"> · {p.vendor_location}</span> : null}
                        </p>
                      )}
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> View link
                        </a>
                      )}
                      {p.notes && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{p.notes}</p>}
                    </CardContent>
                  </Card>
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

          {/* NOTES */}
          <TabsContent value="notes">
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                />
                <Button
                  size="sm"
                  disabled={!newNoteContent.trim()}
                  onClick={async () => {
                    await addNote(newNoteContent.trim());
                    setNewNoteContent('');
                    toast({ title: 'Note added' });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Note
                </Button>
              </div>
              {assetNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {assetNotes.map((n) => (
                    <div key={n.id} className="border border-border rounded-md p-3 bg-card space-y-2">
                      {editingNoteId === n.id ? (
                        <div className="space-y-2">
                          <Textarea value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} rows={3} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={async () => { await updateAssetNote(n.id, editingNoteContent); setEditingNoteId(null); toast({ title: 'Note updated' }); }}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingNoteId(n.id); setEditingNoteContent(n.content); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNote(n.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Part</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant={partMode === 'inventory' ? 'default' : 'outline'} size="sm" onClick={() => setPartMode('inventory')}>From Inventory</Button>
              <Button variant={partMode === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setPartMode('custom')}>Custom Item</Button>
            </div>

            {partMode === 'inventory' ? (
              <div className="space-y-3">
                <div>
                  <Label>Search Inventory</Label>
                  <Input value={partSearch} onChange={(e) => { setPartSearch(e.target.value); setSelectedItemId(null); setSelectedItemName(''); }} placeholder="Search by name, SKU, or part number..." />
                  {partSearch && !selectedItemId && (
                    <div className="border border-border rounded-md mt-1 max-h-48 overflow-y-auto bg-card">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center gap-2"
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setSelectedItemName(item.name);
                            setPartSearch(item.name);
                          }}
                        >
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground ml-2">({item.sku})</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        </div>
                      ))}
                      {filteredItems.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No items found</p>}
                    </div>
                  )}
                </div>

                {/* Selected item preview */}
                {selectedItem && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex gap-3">
                        {selectedItem.imageUrl ? (
                          <img src={selectedItem.imageUrl} alt="" className="h-16 w-16 rounded object-cover shrink-0" />
                        ) : (
                          <div className="h-16 w-16 rounded bg-muted flex items-center justify-center shrink-0">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="text-sm space-y-0.5 min-w-0">
                          <p className="font-semibold truncate">{selectedItem.name}</p>
                          <p className="text-muted-foreground">SKU: {selectedItem.sku}{selectedItem.internalPartNumber ? ` · P/N: ${selectedItem.internalPartNumber}` : ''}</p>
                          <p className="text-muted-foreground">Category: {selectedItem.category}</p>
                          <div className="flex gap-4 mt-1">
                            <span>Price: <strong>${selectedItem.price.toFixed(2)}</strong></span>
                            <span>In Stock: <strong>{selectedItem.quantity}</strong></span>
                          </div>
                          {selectedItem.warehouseId && (() => {
                            const wh = warehouses.find(w => w.id === selectedItem.warehouseId);
                            return wh ? <p className="text-muted-foreground">Location: {wh.name}</p> : null;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Deduct toggle */}
                {selectedItemId && (
                  <div className="flex items-center justify-between rounded-md border border-border p-3 bg-card">
                    <div>
                      <p className="text-sm font-medium">Deduct From Inventory</p>
                      <p className="text-xs text-muted-foreground">Automatically subtract installed quantity from stock</p>
                    </div>
                    <Switch checked={deductFromInventory} onCheckedChange={setDeductFromInventory} />
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
              <div><Label>Quantity Installed</Label><Input type="number" value={partQty} onChange={(e) => setPartQty(e.target.value)} min="1" /></div>
              <div><Label>Install Date</Label><Input type="date" value={partInstallDate} onChange={(e) => setPartInstallDate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Installed By</Label><Input value={partInstalledBy} onChange={(e) => setPartInstalledBy(e.target.value)} placeholder="Technician name..." /></div>
              <div><Label>Remove / Replace Date</Label><Input type="date" value={partRemoveDate} onChange={(e) => setPartRemoveDate(e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Input value={partNotes} onChange={(e) => setPartNotes(e.target.value)} placeholder="Installation notes..." /></div>
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

      {/* Edit Part Dialog */}
      <Dialog open={editPartOpen} onOpenChange={setEditPartOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Part</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!editingPart?.inventory_item_id && (
              <div><Label>Part Name</Label><Input value={editPartName} onChange={(e) => setEditPartName(e.target.value)} /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantity</Label><Input type="number" value={editPartQty} onChange={(e) => setEditPartQty(e.target.value)} /></div>
              <div><Label>Install Date</Label><Input type="date" value={editPartInstallDate} onChange={(e) => setEditPartInstallDate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Installed By</Label><Input value={editPartInstalledBy} onChange={(e) => setEditPartInstalledBy(e.target.value)} /></div>
              <div><Label>Remove Date</Label><Input type="date" value={editPartRemoveDate} onChange={(e) => setEditPartRemoveDate(e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={editPartNotes} onChange={(e) => setEditPartNotes(e.target.value)} placeholder="Add notes about this part..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPartOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePart}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageViewerDialog
        imageUrl={viewerImage}
        alt="Asset Image"
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
