import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Layers, Pencil, Check, X, CheckCircle2, Clock, MessageSquare, ArrowLeft, Download, Package, Settings, Upload } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePartsAssemblies2, usePartsAssemblyItems2, PartsAssembly2, PartsAssemblyItem2 } from '@/hooks/usePartsAssemblies2';
import { useParts2 } from '@/hooks/useParts2';
import { supabase } from '@/integrations/supabase/client';
import { FullScreenPartsPicker2 } from '@/components/FullScreenPartsPicker2';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { generatePartsAssemblyPDF, getAssemblyPdfVisibility } from '@/lib/partsAssemblyPdfGenerator';
import { AssemblyPdfSettingsDialog } from '@/components/AssemblyPdfSettingsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';


function AssemblyDetail2({
  assembly, parts, allParts, onDelete, onUpdate,
}: {
  assembly: PartsAssembly2;
  parts: { id: string; name: string; sku: string; price: number }[];
  allParts: { id: string; price: number }[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { name?: string; description?: string | null; selling_price?: number; status?: string; status_notes?: string | null }) => Promise<void>;
}) {
  const navigate = useNavigate();
  const { items, loading, addItem, addItems, updateItem, removeItem } = usePartsAssemblyItems2(assembly.id);
  const [showPicker, setShowPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(1);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(assembly.name);
  const [descValue, setDescValue] = useState(assembly.description || '');
  const [sellingPriceValue, setSellingPriceValue] = useState(String(assembly.selling_price ?? 0));
  const [savingMeta, setSavingMeta] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(assembly.selling_price ?? 0));
  const [savingPrice, setSavingPrice] = useState(false);
  const [editingStatusNotes, setEditingStatusNotes] = useState(false);
  const [statusNotesInput, setStatusNotesInput] = useState(assembly.status_notes || '');
  const [savingStatus, setSavingStatus] = useState(false);
  const [pdfSettingsOpen, setPdfSettingsOpen] = useState(false);
  const isFinished = assembly.status === 'finished';

  const getItemCost = (item: PartsAssemblyItem2): number => {
    if (item.part_id) {
      const p = allParts.find(x => x.id === item.part_id);
      return p?.price ?? 0;
    }
    return 0;
  };

  const totalCost = items.reduce((sum, item) => sum + getItemCost(item) * item.quantity, 0);

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    await onUpdate(assembly.id, { name: nameValue.trim() || assembly.name, description: descValue.trim() || null, selling_price: parseFloat(sellingPriceValue) || 0 });
    setSavingMeta(false);
    setEditingName(false);
  };

  const handleSavePrice = async () => {
    setSavingPrice(true);
    await onUpdate(assembly.id, { selling_price: parseFloat(priceInput) || 0 });
    setSavingPrice(false);
    setEditingPrice(false);
  };

  const handleToggleStatus = async () => {
    setSavingStatus(true);
    const newStatus = isFinished ? 'not_finished' : 'finished';
    await onUpdate(assembly.id, { status: newStatus, status_notes: newStatus === 'finished' ? null : assembly.status_notes });
    setSavingStatus(false);
    setEditingStatusNotes(false);
  };

  const handleSaveStatusNotes = async () => {
    setSavingStatus(true);
    await onUpdate(assembly.id, { status_notes: statusNotesInput.trim() || null });
    setSavingStatus(false);
    setEditingStatusNotes(false);
  };

  const startEditQty = (item: PartsAssemblyItem2) => { setEditingId(item.id); setEditQty(item.quantity); };
  const handleSaveQty = async (id: string) => { await updateItem(id, { quantity: editQty }); setEditingId(null); };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        {editingName ? (
          <div className="space-y-3">
            <div className="space-y-1"><Label>Assembly Name</Label><Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={descValue} onChange={(e) => setDescValue(e.target.value)} placeholder="Optional description..." rows={2} /></div>
            <div className="space-y-1"><Label>Selling Price ($)</Label><Input type="number" min={0} step="0.01" value={sellingPriceValue} onChange={(e) => setSellingPriceValue(e.target.value)} placeholder="0.00" /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveMeta} disabled={savingMeta}><Check className="h-3 w-3 mr-1" /> Save</Button>
              <Button size="sm" variant="outline" onClick={() => { setEditingName(false); setNameValue(assembly.name); setDescValue(assembly.description || ''); setSellingPriceValue(String(assembly.selling_price ?? 0)); }}><X className="h-3 w-3 mr-1" /> Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold">{assembly.name}</h2>
              {assembly.description && <p className="text-sm text-muted-foreground mt-1">{assembly.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">{items.length} part{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">Sell:</span>
                  {editingPrice ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input type="number" min={0} step="0.01" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="h-7 w-28 text-sm px-2" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSavePrice(); if (e.key === 'Escape') { setEditingPrice(false); setPriceInput(String(assembly.selling_price ?? 0)); } }} />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSavePrice} disabled={savingPrice}><Check className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingPrice(false); setPriceInput(String(assembly.selling_price ?? 0)); }}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <button className="text-sm font-semibold text-primary hover:underline cursor-pointer" onClick={() => { setEditingPrice(true); setPriceInput(String(assembly.selling_price ?? 0)); }}>
                      {assembly.selling_price > 0 ? formatCurrency(assembly.selling_price) : <span className="text-muted-foreground font-normal">Set price…</span>}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-semibold">{totalCost > 0 ? formatCurrency(totalCost) : '—'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setPdfSettingsOpen(true)}>
                <Settings className="h-3 w-3 mr-1" /> PDF Settings
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                generatePartsAssemblyPDF({
                  name: assembly.name,
                  description: assembly.description,
                  sellingPrice: assembly.selling_price,
                  status: assembly.status,
                  statusNotes: assembly.status_notes,
                  visibility: getAssemblyPdfVisibility(),
                  items: items.map(i => ({ partName: i.part_name, partSku: i.part_sku, quantity: i.quantity, notes: i.notes })),
                });
              }}>
                <Download className="h-3 w-3 mr-1" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEditingName(true); setNameValue(assembly.name); setDescValue(assembly.description || ''); setSellingPriceValue(String(assembly.selling_price ?? 0)); }}>
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => onDelete(assembly.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={`px-6 py-3 border-b flex flex-col gap-2 ${isFinished ? 'bg-primary/10' : 'bg-muted/60'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isFinished ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
            <span className={`text-sm font-medium ${isFinished ? 'text-primary' : 'text-foreground'}`}>
              {isFinished ? 'Finished' : 'Not Finished'}
            </span>
            {!isFinished && assembly.status_notes && !editingStatusNotes && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{assembly.status_notes}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isFinished && !editingStatusNotes && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => { setStatusNotesInput(assembly.status_notes || ''); setEditingStatusNotes(true); }}>
                <MessageSquare className="h-3 w-3" />
                {assembly.status_notes ? 'Edit note' : 'Add note'}
              </Button>
            )}
            <Button size="sm" variant={isFinished ? 'outline' : 'default'} className="h-7 text-xs gap-1" disabled={savingStatus} onClick={handleToggleStatus}>
              {isFinished ? <><Clock className="h-3 w-3" />Mark Not Finished</> : <><CheckCircle2 className="h-3 w-3" />Mark Finished</>}
            </Button>
          </div>
        </div>
        {editingStatusNotes && (
          <div className="flex gap-2 items-start">
            <Textarea value={statusNotesInput} onChange={(e) => setStatusNotesInput(e.target.value)} placeholder="Why is this not finished?" rows={2} className="text-sm flex-1" autoFocus />
            <div className="flex flex-col gap-1">
              <Button size="sm" className="h-7" onClick={handleSaveStatusNotes} disabled={savingStatus}><Check className="h-3 w-3" /></Button>
              <Button size="sm" variant="outline" className="h-7" onClick={() => setEditingStatusNotes(false)}><X className="h-3 w-3" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Parts List ({items.length})</h3>
          <Button size="sm" onClick={() => setShowPicker(true)} className="gap-1"><Plus className="h-4 w-4" /> Add Parts</Button>
        </div>
        {loading ? (
          <div className="text-muted-foreground text-sm text-center py-8">Loading parts...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No parts yet. Add parts from Parts Library 2.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Part</span><span className="w-20 text-center">SKU</span><span className="w-16 text-center">Qty</span><span className="w-20 text-right">Unit Cost</span><span className="w-20 text-right">Total</span><span className="w-8" />
            </div>
            {items.map((item) => {
              const unitCost = getItemCost(item);
              const lineTotal = unitCost * item.quantity;
              return (
                <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 items-center px-3 py-2.5 rounded-lg border bg-card">
                  <div>
                    {item.part_id ? (
                      <button className="font-medium text-sm text-primary hover:underline cursor-pointer text-left" onClick={() => navigate(`/parts/library2/${item.part_id}`)}>
                        {item.part_name}
                      </button>
                    ) : (
                      <p className="font-medium text-sm">{item.part_name}</p>
                    )}
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </div>
                  <span className="w-20 text-xs text-muted-foreground text-center font-mono">{item.part_sku || '—'}</span>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1 w-24">
                      <Input type="number" min={1} value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="h-7 w-16 text-center text-sm px-1" />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveQty(item.id)}><Check className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <button className="w-16 text-center text-sm font-medium hover:text-primary cursor-pointer" onClick={() => startEditQty(item)}>
                      {item.quantity}
                    </button>
                  )}
                  <span className="w-20 text-right text-sm text-muted-foreground">{unitCost > 0 ? formatCurrency(unitCost) : '—'}</span>
                  <span className="w-20 text-right text-sm font-medium">{lineTotal > 0 ? formatCurrency(lineTotal) : '—'}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteItemId(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this part?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the part from this assembly.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteItemId) removeItem(deleteItemId); setDeleteItemId(null); }}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssemblyPdfSettingsDialog open={pdfSettingsOpen} onOpenChange={setPdfSettingsOpen} />

      <FullScreenPartsPicker2
        open={showPicker}
        onClose={async (cartItems) => {
          setShowPicker(false);
          if (cartItems.length > 0) {
            await addItems(cartItems.map(c => ({
              part_id: c.part_id,
              inventory_item_id: c.inventory_item_id,
              part_name: c.part_name,
              part_sku: c.part_sku,
              quantity: c.quantity,
              notes: c.notes || undefined,
            })));
          }
        }}
        parts={parts}
        existingPartIds={items.filter(i => i.part_id).map(i => i.part_id!)}
      />
    </div>
  );
}

export function PartsAssembliesDetail2() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const decodedType = decodeURIComponent(type || 'General');
  const { assemblies, loading, createAssembly, updateAssembly, deleteAssembly, refetch } = usePartsAssemblies2();
  const { parts } = useParts2();

  const filtered = assemblies.filter(a => (a.type || 'General') === decodedType);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get('id');
  const [selectedId, setSelectedId] = useState<string | null>(idFromUrl);

  useEffect(() => {
    if (idFromUrl) setSelectedId(idFromUrl);
  }, [idFromUrl]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [editingType, setEditingType] = useState(false);
  const [editTypeName, setEditTypeName] = useState(decodedType);
  const [savingType, setSavingType] = useState(false);
  const [deleteTypeOpen, setDeleteTypeOpen] = useState(false);
  const [deletingType, setDeletingType] = useState(false);

  const selected = filtered.find(a => a.id === selectedId) || null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const result = await createAssembly(newName.trim(), newDesc.trim() || undefined, decodedType);
    setCreating(false);
    if (result) {
      setSelectedId(result.id);
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteAssembly(deleteId);
    if (selectedId === deleteId) setSelectedId(null);
    setDeleteId(null);
  };

  const handleRenameType = async () => {
    const newName2 = editTypeName.trim();
    if (!newName2 || newName2 === decodedType) { setEditingType(false); return; }
    setSavingType(true);
    const { error } = await (supabase as any)
      .from('parts_assemblies_2')
      .update({ type: newName2 })
      .eq('type', decodedType);
    if (error) {
      toast({ title: 'Error renaming type', variant: 'destructive' });
    } else {
      await refetch();
      toast({ title: 'Type renamed' });
      navigate(`/parts/assemblies2/${encodeURIComponent(newName2)}`, { replace: true });
    }
    setSavingType(false);
    setEditingType(false);
  };

  const handleDeleteType = async () => {
    setDeletingType(true);
    const { error } = await (supabase as any)
      .from('parts_assemblies_2')
      .update({ type: 'General' })
      .eq('type', decodedType);
    if (error) {
      toast({ title: 'Error deleting type', variant: 'destructive' });
    } else {
      await refetch();
      toast({ title: 'Type deleted', description: 'Assemblies moved to General' });
      navigate('/parts/assemblies2', { replace: true });
    }
    setDeletingType(false);
    setDeleteTypeOpen(false);
  };

  const partsList = parts.map(p => ({ id: p.id, name: p.name, sku: p.sku, price: p.price }));

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/parts/assemblies2')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {editingType ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTypeName}
                    onChange={e => setEditTypeName(e.target.value)}
                    className="h-8 w-48 text-sm"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameType(); if (e.key === 'Escape') { setEditingType(false); setEditTypeName(decodedType); } }}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleRenameType} disabled={savingType}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingType(false); setEditTypeName(decodedType); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-card-foreground">{decodedType}</h1>
                  <p className="text-xs text-muted-foreground">{filtered.length} assembly{filtered.length !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!editingType && (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setEditingType(true); setEditTypeName(decodedType); }}>
                    <Pencil className="h-3 w-3 mr-1" /> Rename
                  </Button>
                  {decodedType !== 'General' && (
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTypeOpen(true)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete Type
                    </Button>
                  )}
                </>
              )}
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> New Assembly
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl flex h-[calc(100vh-8rem)]">
        {/* Sidebar list */}
        <aside className="w-72 shrink-0 border-r overflow-auto">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <p>No assemblies yet.</p>
              <Button size="sm" className="mt-3 gap-1" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create</Button>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(a => (
                <button key={a.id} className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors ${selectedId === a.id ? 'bg-accent' : ''}`} onClick={() => setSelectedId(a.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{a.name}</span>
                    {a.status === 'finished' ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Detail panel */}
        <main className="flex-1 overflow-auto">
          {selected ? (
            <AssemblyDetail2
              assembly={selected}
              parts={partsList}
              allParts={parts.map(p => ({ id: p.id, price: p.price }))}
              onDelete={handleDelete}
              onUpdate={updateAssembly}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Layers className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select an assembly or create a new one</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Parts Assembly</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Assembly name" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional..." rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>{creating ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assembly?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the assembly and all its parts.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTypeOpen} onOpenChange={setDeleteTypeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete type "{decodedType}"?</AlertDialogTitle>
            <AlertDialogDescription>All assemblies in this type will be moved to "General".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteType} disabled={deletingType} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingType ? 'Deleting...' : 'Delete Type'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
