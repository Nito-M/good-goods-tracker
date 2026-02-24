import { useState } from 'react';
import { Plus, Trash2, Search, Layers, Pencil, Check, X, CheckCircle2, Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import { AssemblyCsvImport } from '@/components/AssemblyCsvImport';
import { QUANTITY_UNIT_LABELS, QuantityUnit } from '@/types/inventory';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssemblies, useAssemblyItems, useAssemblySummaries, AssemblySummary } from '@/hooks/useAssemblies';
import { useInventory } from '@/hooks/useInventory';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Assembly } from '@/hooks/useAssemblies';

function ItemSearchCombobox({
  inventoryItems,
  onSelect,
}: {
  inventoryItems: { id: string; name: string; sku: string; quantityUnit?: string }[];
  onSelect: (item: { id: string | null; name: string; sku: string; quantityUnit?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Search inventory items...
          <Search className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or SKU..." />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__custom__" onSelect={() => { onSelect({ id: null, name: '', sku: '', quantityUnit: 'pcs' }); setOpen(false); }}>
                <Plus className="mr-2 h-4 w-4" /> Add custom item...
              </CommandItem>
              {inventoryItems.map((item) => (
                <CommandItem key={item.id} value={`${item.name} ${item.sku}`} onSelect={() => { onSelect({ id: item.id, name: item.name, sku: item.sku, quantityUnit: item.quantityUnit }); setOpen(false); }}>
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.sku}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AddItemForm({
  inventoryItems, onAdd, onCancel,
}: {
  inventoryItems: { id: string; name: string; sku: string; quantityUnit?: string }[];
  onAdd: (item: { inventory_item_id?: string | null; item_name: string; sku: string; quantity: number; notes?: string }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelect = (item: { id: string | null; name: string; sku: string }) => {
    setSelectedInventoryId(item.id); setItemName(item.name); setSku(item.sku);
  };

  const handleSubmit = async () => {
    if (!itemName.trim()) return;
    setSaving(true);
    const ok = await onAdd({ inventory_item_id: selectedInventoryId, item_name: itemName.trim(), sku: sku.trim(), quantity, notes: notes.trim() || undefined });
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Select from inventory</Label>
        <ItemSearchCombobox inventoryItems={inventoryItems} onSelect={handleSelect} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Item Name *</Label>
          <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item name" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SKU</Label>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Quantity</Label>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!itemName.trim() || saving}>
          {saving ? 'Adding...' : 'Add Item'}
        </Button>
      </div>
    </div>
  );
}

function AssemblyDetail({
  assembly, inventoryItems, summary, onDelete, onUpdate, onItemsChanged,
}: {
  assembly: Assembly;
  inventoryItems: { id: string; name: string; sku: string; quantityUnit?: string }[];
  summary?: AssemblySummary;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { name?: string; description?: string | null; selling_price?: number; status?: string; status_notes?: string | null; type?: string }) => Promise<void>;
  onItemsChanged?: () => void;
}) {
  const { items, loading, addItem, updateItem, removeItem } = useAssemblyItems(assembly.id);
  const [showAddForm, setShowAddForm] = useState(false);
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

  const isFinished = assembly.status === 'finished';

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

  const startEditQty = (item: { id: string; quantity: number }) => { setEditingId(item.id); setEditQty(item.quantity); };
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
                {summary && summary.itemCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">{summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''} · Cost:</span>
                    <span className="font-semibold">{formatCurrency(summary.totalCost)}</span>
                    {summary.hasCustomItems && <span className="text-xs text-muted-foreground italic">(excl. custom)</span>}
                  </div>
                )}
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
                {summary && summary.totalCost > 0 && assembly.selling_price > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Margin: <span className={assembly.selling_price >= summary.totalCost ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                      {formatCurrency(assembly.selling_price - summary.totalCost)} ({(((assembly.selling_price - summary.totalCost) / assembly.selling_price) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
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
            <Textarea value={statusNotesInput} onChange={(e) => setStatusNotesInput(e.target.value)} placeholder="Why is this not finished? (e.g. waiting on parts, needs revision...)" rows={2} className="text-sm flex-1" autoFocus />
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
          {!showAddForm && <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1"><Plus className="h-4 w-4" /> Add Item</Button>}
        </div>
        {showAddForm && (
          <AddItemForm inventoryItems={inventoryItems} onAdd={async (item) => { const ok = await addItem(item); if (ok) onItemsChanged?.(); return ok; }} onCancel={() => setShowAddForm(false)} />
        )}
        {loading ? (
          <div className="text-muted-foreground text-sm text-center py-8">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No items yet. Add parts to this assembly.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Item</span><span className="w-20 text-center">SKU</span><span className="w-16 text-center">Qty</span><span className="w-8" />
            </div>
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-3 py-2.5 rounded-lg border bg-card">
                <div>
                  <p className="font-medium text-sm">{item.item_name}</p>
                  {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                </div>
                <span className="w-20 text-xs text-muted-foreground text-center font-mono">{item.sku || '—'}</span>
                {editingId === item.id ? (
                  <div className="flex items-center gap-1 w-24">
                    <Input type="number" min={1} value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="h-7 w-16 text-center text-sm px-1" />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveQty(item.id)}><Check className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <button className="w-16 text-center text-sm font-medium hover:underline cursor-pointer" onClick={() => startEditQty(item)}>
                    {item.quantity}
                    {(() => {
                      const linked = inventoryItems.find(inv => inv.id === item.inventory_item_id);
                      const unit = linked?.quantityUnit as QuantityUnit | undefined;
                      return unit && unit !== 'pcs' ? <span className="text-xs text-muted-foreground ml-1">{QUANTITY_UNIT_LABELS[unit]}</span> : null;
                    })()}
                  </button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteItemId(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the item from the assembly.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { removeItem(deleteItemId!); setDeleteItemId(null); onItemsChanged?.(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function Assemblies() {
  const { type: typeParam } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const activeType = typeParam ? decodeURIComponent(typeParam) : 'General';

  const { assemblies, loading, createAssembly, updateAssembly, deleteAssembly } = useAssemblies();
  const { allItems: inventoryItems } = useInventory();
  const { summaries, refetch: refetchSummaries } = useAssemblySummaries(assemblies.map((a) => a.id));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const typeAssemblies = assemblies.filter(a => (a.type || 'General') === activeType);
  const selectedAssembly = typeAssemblies.find((a) => a.id === selectedId) || null;
  const filtered = typeAssemblies.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const sortedInventory = [...inventoryItems].sort((a, b) => a.name.localeCompare(b.name)).map((i) => ({ id: i.id, name: i.name, sku: i.sku, quantityUnit: i.quantityUnit }));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const created = await createAssembly(newName.trim(), newDesc.trim() || undefined, activeType);
    setCreating(false);
    if (created) { setSelectedId(created.id); setCreateOpen(false); setNewName(''); setNewDesc(''); setTimeout(refetchSummaries, 300); }
  };

  const handleDelete = async (id: string) => {
    await deleteAssembly(id);
    if (selectedId === id) setSelectedId(null);
    setDeleteId(null);
  };

  return (
    <div className="flex h-full overflow-hidden flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card shrink-0">
        <button onClick={() => navigate('/assemblies')} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="h-3.5 w-3.5" /> All Types
        </button>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="font-semibold text-sm">{activeType}</span>
        <span className="text-xs text-muted-foreground">({typeAssemblies.length})</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 border-r flex flex-col bg-sidebar overflow-hidden">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-base flex items-center gap-2"><Layers className="h-4 w-4" /> {activeType}</h1>
              <div className="flex items-center gap-1">
                <AssemblyCsvImport onComplete={refetchSummaries} />
                <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 h-8"><Plus className="h-3 w-3" /> New</Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search assemblies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No assemblies yet</p>
              </div>
            ) : (
              filtered.map((a) => {
                const s = summaries.get(a.id);
                return (
                  <button key={a.id} onClick={() => setSelectedId(a.id)} className={cn('w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors', selectedId === a.id ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'hover:bg-muted/50 text-foreground')}>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium truncate flex-1">{a.name}</p>
                      {a.status === 'finished' ? <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> : <Clock className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                    {a.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>}
                    {!a.description && a.status === 'not_finished' && a.status_notes && <p className="text-xs text-muted-foreground truncate mt-0.5 italic">{a.status_notes}</p>}
                    {(s && s.itemCount > 0) || a.selling_price > 0 ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s && s.itemCount > 0 && <>{s.itemCount} item{s.itemCount !== 1 ? 's' : ''} · Cost: <span className="font-medium text-foreground">{formatCurrency(s.totalCost)}</span></>}
                        {a.selling_price > 0 && <>{s && s.itemCount > 0 ? ' · ' : ''}Sell: <span className="font-medium text-primary">{formatCurrency(a.selling_price)}</span></>}
                      </p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-hidden bg-background">
          {selectedAssembly ? (
            <AssemblyDetail key={selectedAssembly.id} assembly={selectedAssembly} inventoryItems={sortedInventory} summary={summaries.get(selectedAssembly.id)} onDelete={(id) => setDeleteId(id)} onUpdate={updateAssembly} onItemsChanged={refetchSummaries} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Layers className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-1">Select an assembly</p>
                <p className="text-sm">Choose from the left or create a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Assembly in "{activeType}"</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Name *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. 16ft Flatbed Trailer" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description..." rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>{creating ? 'Creating...' : 'Create Assembly'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assembly?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the assembly and all its items. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteId!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
