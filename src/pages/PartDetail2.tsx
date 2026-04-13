import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Upload, X, Check, DollarSign, Download, Clock, Package, Plus, Minus } from 'lucide-react';
import { FullScreenItemPicker, PickerCartItem } from '@/components/FullScreenItemPicker';

const decimalToHM = (decimal: number): string => {
  if (!decimal || decimal <= 0) return '0:00';
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const hmToDecimal = (hm: string): number | null => {
  const trimmed = hm.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (m < 0 || m > 59) return null;
    return h + m / 60;
  }
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num >= 0) return num;
  return null;
};

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useParts2 } from '@/hooks/useParts2';
import { usePartInventoryItems2 } from '@/hooks/usePartInventoryItems2';
import { useInventory } from '@/hooks/useInventory';
import { useManufacturingSteps2 } from '@/hooks/useManufacturingSteps2';
import { DxfThreeViewer } from '@/components/DxfThreeViewer';
import { ManufacturingInstructions2 } from '@/components/ManufacturingInstructions2';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function PartDetail2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { parts, loading, deletePart, updatePart, uploadPartImage, uploadPartDxf, getSignedUrl } = useParts2();
  const { items: inventoryItems } = useInventory();
  const { items: partItems, addItem: addPartItem, addCustomItem, updateItem: updatePartItem, removeItem: removePartItem, totalCost: materialsCost } = usePartInventoryItems2(id);
  const { steps: manufacturingSteps } = useManufacturingSteps2(id);
  const manufacturingStepsCost = manufacturingSteps.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const { toast } = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCart, setPickerCart] = useState<PickerCartItem[]>([]);

  useEffect(() => {
    if (pickerOpen) {
      setPickerCart(partItems.map(pi => ({
        id: pi.id, inventoryItemId: pi.inventoryItemId, itemName: pi.itemName, sku: pi.itemSku,
        quantity: pi.quantity, quantityUnit: 'pcs' as const, unitPrice: pi.unitCost, unitCost: pi.unitCost, notes: pi.notes || '',
      })));
    }
  }, [pickerOpen, partItems]);

  const handlePickerAddItem = async (item: any) => {
    const alreadyInCart = pickerCart.some(c => c.inventoryItemId === item.id);
    if (alreadyInCart) return;
    const ok = await addPartItem(item.id);
    if (ok) {
      setPickerCart(prev => [...prev, {
        id: `temp-${Date.now()}`, inventoryItemId: item.id, itemName: item.name, sku: item.sku,
        quantity: 1, quantityUnit: 'pcs' as const, unitPrice: item.cost, unitCost: item.cost, notes: '',
      }]);
    }
  };

  const handlePickerAddCustomItem = () => {
    const name = prompt('Custom item name:');
    if (!name?.trim()) return;
    const costStr = prompt('Unit cost:', '0');
    const cost = parseFloat(costStr || '0') || 0;
    addCustomItem(name.trim(), cost).then(ok => {
      if (ok) {
        setPickerCart(prev => [...prev, {
          id: `temp-${Date.now()}`, inventoryItemId: null, itemName: name.trim(), sku: '',
          quantity: 1, quantityUnit: 'pcs' as const, unitPrice: cost, unitCost: cost, notes: '',
        }]);
      }
    });
  };

  const handlePickerUpdateQty = (itemId: string, qty: number | null) => {
    setPickerCart(prev => prev.map(c => c.id === itemId ? { ...c, quantity: qty } : c));
    const realItem = partItems.find(pi => pi.id === itemId);
    if (realItem && qty && qty > 0) updatePartItem(itemId, { quantity: qty });
  };

  const handlePickerRemoveItem = (itemId: string) => {
    setPickerCart(prev => prev.filter(c => c.id !== itemId));
    const realItem = partItems.find(pi => pi.id === itemId);
    if (realItem) removePartItem(itemId);
  };

  const handlePickerUpdateItem = (itemId: string, updates: Partial<PickerCartItem>) => {
    setPickerCart(prev => prev.map(c => c.id === itemId ? { ...c, ...updates } : c));
    const realItem = partItems.find(pi => pi.id === itemId);
    if (realItem) {
      const dbUpdates: Record<string, any> = {};
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (Object.keys(dbUpdates).length > 0) updatePartItem(itemId, dbUpdates);
    }
  };

  const part = parts.find(p => p.id === id);
  const totalPartCost = materialsCost
    + (part && part.hours > 0 && part.hourlyRate > 0 ? part.hours * part.hourlyRate : 0)
    + (part && part.paintingHours > 0 && part.paintingHourlyRate > 0 ? part.paintingHours * part.paintingHourlyRate : 0)
    + manufacturingStepsCost;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dxfText1, setDxfText1] = useState<string | null>(null);
  const [dxfText2, setDxfText2] = useState<string | null>(null);
  const [dxfSignedUrl1, setDxfSignedUrl1] = useState<string | null>(null);
  const [dxfSignedUrl2, setDxfSignedUrl2] = useState<string | null>(null);
  const [dragOverImage, setDragOverImage] = useState(false);
  const [dragOverDxf1, setDragOverDxf1] = useState(false);
  const [dragOverDxf2, setDragOverDxf2] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const preventNav = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    document.addEventListener('dragover', preventNav);
    document.addEventListener('drop', preventNav);
    return () => { document.removeEventListener('dragover', preventNav); document.removeEventListener('drop', preventNav); };
  }, [editing]);

  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newDxfFile1, setNewDxfFile1] = useState<File | null>(null);
  const [newDxfFile2, setNewDxfFile2] = useState<File | null>(null);
  const [editDxfLabel1, setEditDxfLabel1] = useState('');
  const [editDxfLabel2, setEditDxfLabel2] = useState('');
  const [saving, setSaving] = useState(false);
  const [editHours, setEditHours] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState('');
  const [editPaintingHours, setEditPaintingHours] = useState('');
  const [editPaintingHourlyRate, setEditPaintingHourlyRate] = useState('');
  const backToLibraryPath = `/parts/library2${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  useEffect(() => {
    if (!part) return;
    if (part.imageUrl) { getSignedUrl('part-images-2', part.imageUrl).then(setImageUrl); } else { setImageUrl(null); }
    if (part.dxfUrl1) {
      getSignedUrl('dxf-files', part.dxfUrl1).then(async url => { if (url) { setDxfSignedUrl1(url); const res = await fetch(url); setDxfText1(await res.text()); } });
    } else { setDxfText1(null); setDxfSignedUrl1(null); }
    if (part.dxfUrl2) {
      getSignedUrl('dxf-files', part.dxfUrl2).then(async url => { if (url) { setDxfSignedUrl2(url); const res = await fetch(url); setDxfText2(await res.text()); } });
    } else { setDxfText2(null); setDxfSignedUrl2(null); }
  }, [part]);

  const startEditing = () => {
    if (!part) return;
    setEditName(part.name); setEditSku(part.sku); setEditPrice(String(part.price ?? 0));
    setEditHours(decimalToHM(part.hours ?? 0)); setEditHourlyRate(String(part.hourlyRate ?? 0));
    setEditPaintingHours(decimalToHM(part.paintingHours ?? 0)); setEditPaintingHourlyRate(String(part.paintingHourlyRate ?? 0));
    setEditDescription(part.description || ''); setEditDxfLabel1(part.dxfLabel1); setEditDxfLabel2(part.dxfLabel2);
    setNewImageFile(null); setNewImagePreview(null); setNewDxfFile1(null); setNewDxfFile2(null); setEditing(true);
  };

  const cancelEditing = () => { setEditing(false); setNewImageFile(null); setNewImagePreview(null); setNewDxfFile1(null); setNewDxfFile2(null); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setNewImageFile(file); setNewImagePreview(URL.createObjectURL(file)); } };
  const handleImageDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOverImage(false); const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/')); if (file) { setNewImageFile(file); setNewImagePreview(URL.createObjectURL(file)); } };
  const handleDxfDrop = (e: React.DragEvent, slot: 1 | 2) => { e.preventDefault(); slot === 1 ? setDragOverDxf1(false) : setDragOverDxf2(false); const file = Array.from(e.dataTransfer.files).find(f => f.name.toLowerCase().endsWith('.dxf')); if (file) { slot === 1 ? setNewDxfFile1(file) : setNewDxfFile2(file); } };
  const preventAndHighlight = (e: React.DragEvent, setter: (v: boolean) => void) => { e.preventDefault(); setter(true); };

  const handleSave = async () => {
    if (!id || !editName.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const updates: Record<string, any> = {
      name: editName.trim(), sku: editSku.trim(), price: parseFloat(editPrice) || 0,
      hours: hmToDecimal(editHours) ?? 0, hourlyRate: parseFloat(editHourlyRate) || 0,
      paintingHours: hmToDecimal(editPaintingHours) ?? 0, paintingHourlyRate: parseFloat(editPaintingHourlyRate) || 0,
      description: editDescription.trim(), dxfLabel1: editDxfLabel1.trim() || 'Plasma DXF', dxfLabel2: editDxfLabel2.trim() || 'Laser DXF',
    };
    if (newImageFile) { const path = await uploadPartImage(newImageFile); if (path) updates.imageUrl = path; }
    if (newDxfFile1) { const path = await uploadPartDxf(newDxfFile1); if (path) updates.dxfUrl1 = path; }
    if (newDxfFile2) { const path = await uploadPartDxf(newDxfFile2); if (path) updates.dxfUrl2 = path; }
    const ok = await updatePart(id, updates);
    setSaving(false);
    if (ok) { toast({ title: 'Part updated' }); setEditing(false); }
  };

  const handleDelete = async () => { if (!id) return; const ok = await deletePart(id); if (ok) { toast({ title: 'Part deleted' }); navigate(backToLibraryPath); } };

  if (loading && !part) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Loading...</p></div>;
  if (!part) return <div className="flex flex-col items-center justify-center min-h-screen gap-4"><p className="text-muted-foreground">Part not found</p><Button onClick={() => navigate(backToLibraryPath)}>Back to Parts</Button></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(backToLibraryPath)}><ArrowLeft className="h-4 w-4" /></Button>
              <div><h1 className="text-2xl font-bold tracking-tight text-card-foreground">{part.name}</h1>{part.sku && <p className="text-sm text-muted-foreground">SKU: {part.sku}</p>}</div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <><Button variant="outline" size="sm" onClick={cancelEditing} className="gap-2"><X className="h-4 w-4" /> Cancel</Button><Button size="sm" onClick={handleSave} disabled={saving} className="gap-2"><Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</Button></>
              ) : (
                <><Button variant="outline" size="sm" onClick={startEditing} className="gap-2"><Pencil className="h-4 w-4" /> Edit</Button>
                  <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="gap-2"><Trash2 className="h-4 w-4" /> Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this part?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog></>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Image</CardTitle></CardHeader>
            <CardContent>
              <div className={`aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center transition-all ${editing && dragOverImage ? 'ring-2 ring-primary bg-primary/10' : ''}`}
                onDragOver={editing ? (e) => preventAndHighlight(e, setDragOverImage) : undefined} onDragLeave={editing ? () => setDragOverImage(false) : undefined} onDrop={editing ? handleImageDrop : undefined}>
                {editing && newImagePreview ? <img src={newImagePreview} alt="New preview" className="w-full h-full object-contain" />
                  : imageUrl ? <img src={imageUrl} alt={part.name} className="w-full h-full object-contain" />
                  : editing ? <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="h-8 w-8" /><span className="text-sm">Drop image here</span></div>
                  : <span className="text-muted-foreground">No image</span>}
              </div>
              {editing && (
                <div className="mt-3 flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm"><Upload className="h-4 w-4" />{newImageFile ? 'Change Image' : 'Upload New Image'}<input type="file" accept="image/*" className="hidden" onChange={handleImageChange} /></label>
                  {newImageFile && <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2"><Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</Button>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="space-y-2"><Label htmlFor="edit-name">Name *</Label><Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="edit-sku">SKU</Label><Input id="edit-sku" value={editSku} onChange={e => setEditSku(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="edit-price">Price</Label><Input id="edit-price" type="number" step="0.01" min="0" value={editPrice} onChange={e => setEditPrice(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="edit-desc">Description</Label><Textarea id="edit-desc" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} /></div>
                </>
              ) : (
                <>
                  <div><p className="text-sm font-medium text-muted-foreground">Name</p><p className="text-foreground">{part.name}</p></div>
                  <div><p className="text-sm font-medium text-muted-foreground">SKU</p><p className="text-foreground">{part.sku || '—'}</p></div>
                  <div><p className="text-sm font-medium text-muted-foreground">Price</p><p className="text-foreground font-semibold">{(part.price ?? 0) > 0 ? formatCurrency(part.price) : '—'}</p></div>
                  {part.description && <div><p className="text-sm font-medium text-muted-foreground">Description</p><p className="text-foreground">{part.description}</p></div>}
                  <div><p className="text-sm font-medium text-muted-foreground">Created</p><p className="text-foreground">{part.createdAt.toLocaleDateString()}</p></div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Materials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Materials / Inventory Items</CardTitle>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setPickerOpen(true)}><Plus className="h-4 w-4" /> Add Item</Button>
          </CardHeader>
          <CardContent>
            {partItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inventory items linked yet.</p>
            ) : (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Total Cost</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {partItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="text-muted-foreground">{item.itemSku}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.itemPrice)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => item.quantity > 1 && updatePartItem(item.id, { quantity: item.quantity - 1 })} disabled={item.quantity <= 1}><Minus className="h-3 w-3" /></Button>
                            <Input type="number" min={0} step="any" defaultValue={item.quantity} key={`${item.id}-${item.quantity}`}
                              onBlur={e => { const val = parseFloat(e.target.value); if (!isNaN(val) && val > 0) updatePartItem(item.id, { quantity: val }); else e.target.value = String(item.quantity); }}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                              className="w-16 h-7 text-center text-sm px-1" />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updatePartItem(item.id, { quantity: item.quantity + 1 })}><Plus className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.unitCost * item.quantity)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePartItem(item.id)}><X className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-3 pt-3 border-t border-border">
                  <div className="text-right"><p className="text-sm text-muted-foreground">Total Materials Cost</p><p className="text-lg font-semibold text-foreground">{formatCurrency(materialsCost)}</p></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Labor Hours */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Labor Hours</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Fabrication</p>
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2"><Label htmlFor="edit-hours">Hours (H:MM)</Label><Input id="edit-hours" type="text" placeholder="0:00" value={editHours} onChange={e => setEditHours(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="edit-hourly-rate">Hourly Rate ($)</Label><Input id="edit-hourly-rate" type="number" min={0} step="0.01" value={editHourlyRate} onChange={e => setEditHourlyRate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Total</Label><p className="h-10 flex items-center font-semibold text-foreground">{formatCurrency((hmToDecimal(editHours) ?? 0) * (parseFloat(editHourlyRate) || 0))}</p></div>
                </div>
              ) : part.hours > 0 || part.hourlyRate > 0 ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                    <div><p className="text-sm font-medium text-muted-foreground">Hours</p><p className="text-foreground">{part.hours > 0 ? decimalToHM(part.hours) : '—'}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Hourly Rate</p><p className="text-foreground">{part.hourlyRate > 0 ? formatCurrency(part.hourlyRate) : '—'}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Total</p><p className="text-foreground font-semibold">{part.hours > 0 && part.hourlyRate > 0 ? `${decimalToHM(part.hours)} × ${formatCurrency(part.hourlyRate)} = ${formatCurrency(part.hours * part.hourlyRate)}` : '—'}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={startEditing} className="shrink-0"><Pencil className="h-4 w-4" /></Button>
                </div>
              ) : <Button variant="outline" size="sm" onClick={startEditing} className="gap-2"><Plus className="h-4 w-4" /> Add Hours</Button>}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Painting</p>
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2"><Label htmlFor="edit-painting-hours">Hours (H:MM)</Label><Input id="edit-painting-hours" type="text" placeholder="0:00" value={editPaintingHours} onChange={e => setEditPaintingHours(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="edit-painting-rate">Hourly Rate ($)</Label><Input id="edit-painting-rate" type="number" min={0} step="0.01" value={editPaintingHourlyRate} onChange={e => setEditPaintingHourlyRate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Total</Label><p className="h-10 flex items-center font-semibold text-foreground">{formatCurrency((hmToDecimal(editPaintingHours) ?? 0) * (parseFloat(editPaintingHourlyRate) || 0))}</p></div>
                </div>
              ) : part.paintingHours > 0 || part.paintingHourlyRate > 0 ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                    <div><p className="text-sm font-medium text-muted-foreground">Hours</p><p className="text-foreground">{part.paintingHours > 0 ? decimalToHM(part.paintingHours) : '—'}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Hourly Rate</p><p className="text-foreground">{part.paintingHourlyRate > 0 ? formatCurrency(part.paintingHourlyRate) : '—'}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Total</p><p className="text-foreground font-semibold">{part.paintingHours > 0 && part.paintingHourlyRate > 0 ? `${decimalToHM(part.paintingHours)} × ${formatCurrency(part.paintingHourlyRate)} = ${formatCurrency(part.paintingHours * part.paintingHourlyRate)}` : '—'}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={startEditing} className="shrink-0"><Pencil className="h-4 w-4" /></Button>
                </div>
              ) : <Button variant="outline" size="sm" onClick={startEditing} className="gap-2"><Plus className="h-4 w-4" /> Add Hours</Button>}
            </div>
          </CardContent>
        </Card>

        {/* Grand totals */}
        {(materialsCost > 0 || (part.hours > 0 && part.hourlyRate > 0) || (part.paintingHours > 0 && part.paintingHourlyRate > 0) || manufacturingStepsCost > 0) && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              {materialsCost > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Materials</span><span className="font-medium">{formatCurrency(materialsCost)}</span></div>}
              {part.hours > 0 && part.hourlyRate > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fabrication Labor ({decimalToHM(part.hours)} × {formatCurrency(part.hourlyRate)}/h)</span><span className="font-medium">{formatCurrency(part.hours * part.hourlyRate)}</span></div>}
              {part.paintingHours > 0 && part.paintingHourlyRate > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Painting Labor ({decimalToHM(part.paintingHours)} × {formatCurrency(part.paintingHourlyRate)}/h)</span><span className="font-medium">{formatCurrency(part.paintingHours * part.paintingHourlyRate)}</span></div>}
              {manufacturingStepsCost > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Manufacturing Steps ({manufacturingSteps.length} step{manufacturingSteps.length !== 1 ? 's' : ''})</span><span className="font-medium">{formatCurrency(manufacturingStepsCost)}</span></div>}
              <div className="flex justify-between pt-2 border-t border-border"><span className="font-semibold">Total Part Cost</span><span className="text-lg font-bold text-foreground">{formatCurrency(totalPartCost)}</span></div>
            </CardContent>
          </Card>
        )}

        {id && <ManufacturingInstructions2 partId={id} />}

        {/* DXF Previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{editing ? <Input value={editDxfLabel1} onChange={e => setEditDxfLabel1(e.target.value)} placeholder="Plasma DXF" className="text-base font-semibold" /> : part.dxfLabel1}</CardTitle>
              {!editing && dxfSignedUrl1 && <Button variant="outline" size="sm" className="gap-1.5" asChild><a href={dxfSignedUrl1} download={`${part.name} - ${part.dxfLabel1}.dxf`}><Download className="h-3.5 w-3.5" /> Download</a></Button>}
            </CardHeader>
            <CardContent>
              <div className={`aspect-square bg-muted rounded-md overflow-hidden transition-all ${editing && dragOverDxf1 ? 'ring-2 ring-primary bg-primary/10' : ''}`}
                onDragOver={editing ? (e) => preventAndHighlight(e, setDragOverDxf1) : undefined} onDragLeave={editing ? () => setDragOverDxf1(false) : undefined} onDrop={editing ? (e) => handleDxfDrop(e, 1) : undefined}>
                {dxfText1 ? <DxfThreeViewer dxfText={dxfText1} /> : <div className="w-full h-full flex flex-col items-center justify-center gap-2">{editing ? <><Upload className="h-8 w-8 text-muted-foreground" /><span className="text-muted-foreground text-sm">{newDxfFile1 ? newDxfFile1.name : 'Drop DXF here'}</span></> : <span className="text-muted-foreground text-sm">{part.dxfUrl1 ? 'Loading DXF...' : 'No DXF file'}</span>}</div>}
              </div>
              {editing && <div className="mt-3 flex items-center gap-2"><label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm"><Upload className="h-4 w-4" />{newDxfFile1 ? newDxfFile1.name : 'Replace DXF 1'}<input type="file" accept=".dxf" className="hidden" onChange={e => setNewDxfFile1(e.target.files?.[0] || null)} /></label>{newDxfFile1 && <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2"><Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</Button>}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{editing ? <Input value={editDxfLabel2} onChange={e => setEditDxfLabel2(e.target.value)} placeholder="Laser DXF" className="text-base font-semibold" /> : part.dxfLabel2}</CardTitle>
              {!editing && dxfSignedUrl2 && <Button variant="outline" size="sm" className="gap-1.5" asChild><a href={dxfSignedUrl2} download={`${part.name} - ${part.dxfLabel2}.dxf`}><Download className="h-3.5 w-3.5" /> Download</a></Button>}
            </CardHeader>
            <CardContent>
              <div className={`aspect-square bg-muted rounded-md overflow-hidden transition-all ${editing && dragOverDxf2 ? 'ring-2 ring-primary bg-primary/10' : ''}`}
                onDragOver={editing ? (e) => preventAndHighlight(e, setDragOverDxf2) : undefined} onDragLeave={editing ? () => setDragOverDxf2(false) : undefined} onDrop={editing ? (e) => handleDxfDrop(e, 2) : undefined}>
                {dxfText2 ? <DxfThreeViewer dxfText={dxfText2} /> : <div className="w-full h-full flex flex-col items-center justify-center gap-2">{editing ? <><Upload className="h-8 w-8 text-muted-foreground" /><span className="text-muted-foreground text-sm">{newDxfFile2 ? newDxfFile2.name : 'Drop DXF here'}</span></> : <span className="text-muted-foreground text-sm">{part.dxfUrl2 ? 'Loading DXF...' : 'No DXF file'}</span>}</div>}
              </div>
              {editing && <div className="mt-3 flex items-center gap-2"><label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm"><Upload className="h-4 w-4" />{newDxfFile2 ? newDxfFile2.name : 'Replace DXF 2'}<input type="file" accept=".dxf" className="hidden" onChange={e => setNewDxfFile2(e.target.files?.[0] || null)} /></label>{newDxfFile2 && <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2"><Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</Button>}</div>}
            </CardContent>
          </Card>
        </div>
      </main>

      <FullScreenItemPicker open={pickerOpen} onClose={() => setPickerOpen(false)} inventoryItems={inventoryItems} cart={pickerCart}
        onAddItem={handlePickerAddItem} onAddCustomItem={handlePickerAddCustomItem} onUpdateQuantity={handlePickerUpdateQty}
        onRemoveItem={handlePickerRemoveItem} onUpdateItem={handlePickerUpdateItem} documentType="Part" formatPrice={formatCurrency} />
    </div>
  );
}
