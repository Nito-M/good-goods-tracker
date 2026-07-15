import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Upload, GripVertical, Package, X, FileText, Image as ImageIcon,
  AlertTriangle, Lightbulb, StickyNote, Wrench, Clock, ExternalLink, MapPin,
  ChevronRight, ChevronDown, ShoppingCart, Link as LinkIcon, Download, Printer,
} from 'lucide-react';
import { generateAssemblyPDF } from '@/lib/assemblyPdfGenerator';
import { generateSopPDF } from '@/lib/sopPdfGenerator';
import { SopPdfOptionsDialog } from '@/components/SopPdfOptionsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSopDetail, SopStep } from '@/hooks/useSopDetail';
import { useInventory } from '@/hooks/useInventory';
import { FullScreenItemPicker, PickerCartItem } from '@/components/FullScreenItemPicker';
import { formatCurrency } from '@/lib/utils';
import { SopOptionSelect } from '@/components/SopOptionSelect';
import { supabase } from '@/integrations/supabase/client';

export default function SopEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    sop, steps, stepFiles, stepItems, bom, attachments, locations, loading,
    updateSop, addStep, updateStep, deleteStep, reorderSteps,
    uploadStepFile, deleteStepFile,
    addStepItem, updateStepItem, removeStepItem,
    addBomItem, updateBomItem, removeBomItem,
    uploadAttachment, deleteAttachment, getSignedUrl,
    addLocation, updateLocation, removeLocation,
  } = useSopDetail(id ?? null);
  const { allItems } = useInventory();
  const itemsById = useMemo(() => new Map(allItems.map(i => [i.id, i])), [allItems]);

  const [pickerContext, setPickerContext] = useState<{ mode: 'step' | 'bom'; stepId?: string } | null>(null);
  const attachRef = useRef<HTMLInputElement>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    const typeId = (sop as any)?.type_id ?? null;
    if (!sop) return;
    (async () => {
      let q: any = supabase.from('sop_categories' as any).select('id,name,parent_id,type_id').order('sort_order').order('name');
      q = typeId ? q.eq('type_id', typeId) : q.is('type_id', null);
      const { data } = await q;
      const rows = (data as any[]) || [];
      const byId = new Map(rows.map(r => [r.id, r]));
      const pathOf = (r: any): string => {
        const parts = [r.name];
        let cur = r;
        while (cur.parent_id && byId.get(cur.parent_id)) {
          cur = byId.get(cur.parent_id);
          parts.unshift(cur.name);
        }
        return parts.join(' / ');
      };
      setCategoryOptions(rows.map(r => ({ id: r.id, label: pathOf(r) })).sort((a, b) => a.label.localeCompare(b.label)));
    })();
  }, [(sop as any)?.type_id, sop?.id]);


  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const hasInitializedExpanded = useRef(false);
  useEffect(() => {
    hasInitializedExpanded.current = false;
    setExpandedSteps(new Set());
  }, [id]);
  useEffect(() => {
    if (!loading && steps.length && !hasInitializedExpanded.current) {
      hasInitializedExpanded.current = true;
      setExpandedSteps(new Set());
    }
  }, [loading, steps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const all = [...stepFiles, ...attachments];
    all.forEach(async (f: any) => {
      if (signedUrls[f.id]) return;
      const url = await getSignedUrl(f.storage_path);
      if (url) setSignedUrls(prev => ({ ...prev, [f.id]: url }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepFiles, attachments]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = steps.findIndex(s => s.id === active.id);
    const newIdx = steps.findIndex(s => s.id === over.id);
    const newIds = arrayMove(steps, oldIdx, newIdx).map(s => s.id);
    reorderSteps(newIds);
  };

  const openStepPicker = (stepId: string) => setPickerContext({ mode: 'step', stepId });
  const openBomPicker = () => setPickerContext({ mode: 'bom' });

  const pickerCart: PickerCartItem[] = useMemo(() => {
    if (!pickerContext) return [];
    if (pickerContext.mode === 'step' && pickerContext.stepId) {
      return stepItems.filter(i => i.step_id === pickerContext.stepId).map(i => {
        const inv = itemsById.get(i.inventory_item_id);
        return { id: i.id, inventoryItemId: i.inventory_item_id, itemName: inv?.name || 'Item',
          sku: inv?.sku || '', quantity: i.quantity, quantityUnit: 'pcs' as const,
          unitPrice: 0, unitCost: 0, notes: i.notes || '' };
      });
    }
    return bom.map(b => {
      const inv = itemsById.get(b.inventory_item_id);
      return { id: b.id, inventoryItemId: b.inventory_item_id, itemName: inv?.name || 'Item',
        sku: inv?.sku || '', quantity: b.quantity, quantityUnit: 'pcs' as const,
        unitPrice: 0, unitCost: inv?.cost || 0, notes: b.notes || '' };
    });
  }, [pickerContext, stepItems, bom, itemsById]);

  const handlePickerAdd = async (inv: any) => {
    if (!pickerContext) return;
    if (pickerContext.mode === 'step' && pickerContext.stepId) {
      await addStepItem(pickerContext.stepId, inv.id, 1);
    } else if (pickerContext.mode === 'bom') {
      await addBomItem(inv.id, 1);
    }
  };
  const handlePickerRemove = (rowId: string) => {
    if (!pickerContext) return;
    if (pickerContext.mode === 'step') removeStepItem(rowId);
    else removeBomItem(rowId);
  };
  const handlePickerQty = (rowId: string, qty: number | null) => {
    if (!pickerContext || qty == null || qty <= 0) return;
    if (pickerContext.mode === 'step') updateStepItem(rowId, { quantity: qty });
    else updateBomItem(rowId, { quantity: qty });
  };
  const handlePickerUpdate = (rowId: string, u: Partial<PickerCartItem>) => {
    if (!pickerContext) return;
    if (pickerContext.mode === 'step') {
      const patch: any = {};
      if (u.notes !== undefined) patch.notes = u.notes;
      if (u.quantity != null && u.quantity > 0) patch.quantity = u.quantity;
      if (Object.keys(patch).length) updateStepItem(rowId, patch);
    } else {
      const patch: any = {};
      if (u.notes !== undefined) patch.notes = u.notes;
      if (u.quantity != null && u.quantity > 0) patch.quantity = u.quantity;
      if (Object.keys(patch).length) updateBomItem(rowId, patch);
    }
  };

  const handleAttach = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) await uploadAttachment(f);
    if (attachRef.current) attachRef.current.value = '';
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!sop) return <div className="p-6">SOP not found. <Link to="/knowledge-base" className="text-primary underline">Back</Link></div>;

  const bomTotal = bom.reduce((sum, b) => sum + b.quantity * (itemsById.get(b.inventory_item_id)?.cost || 0), 0);
  const backTo = (sop as any).type_id ? `/knowledge-base/type/${(sop as any).type_id}` : '/knowledge-base';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
          <Link to="/knowledge-base" className="hover:text-foreground hover:underline">Knowledge Base</Link>
          <span>›</span>
          <Link to={backTo} className="hover:text-foreground hover:underline">{(sop as any).type_id ? 'Type' : 'All'}</Link>
          <span>›</span>
          <span className="text-foreground font-medium truncate max-w-[300px]">{sop.title}</span>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPdfDialogOpen(true)}>
            <Download className="h-4 w-4 mr-1" /> Download / Print PDF
          </Button>
        </div>
      </div>

      <SopPdfOptionsDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        onConfirm={async (sections) => {
          const categoryLabel = categoryOptions.find(c => c.id === sop.category_id)?.label || null;
          await generateSopPDF({
            title: sop.title,
            sopNumber: sop.sop_number,
            department: sop.department,
            revisionNumber: sop.revision_number,
            category: categoryLabel,
            status: sop.status,
            effectiveDate: sop.effective_date,
            lastUpdatedDate: sop.last_updated_date,
            author: sop.author,
            approvedBy: sop.approved_by,
            steps: steps.map((s, i) => ({
              index: i,
              content: s.content,
              warnings: s.warnings,
              notes: s.notes,
              tips: s.tips,
              requiredTools: s.required_tools,
              estimatedMinutes: s.estimated_minutes,
              links: s.links,
              items: stepItems.filter(it => it.step_id === s.id).map(it => {
                const inv = itemsById.get(it.inventory_item_id);
                return { name: inv?.name || 'Unknown', sku: inv?.sku, quantity: it.quantity, notes: it.notes };
              }),
            })),
            bom: bom.map(b => {
              const inv = itemsById.get(b.inventory_item_id);
              return {
                name: inv?.name || 'Unknown',
                sku: inv?.sku,
                quantity: b.quantity,
                unitCost: inv?.cost || 0,
                isOptional: b.is_optional,
                notes: b.notes,
              };
            }),
            bomTotal,
            locations: locations.map(l => ({ name: l.name, url: l.url })),
            attachments: attachments.map(a => ({ fileName: a.file_name })),
          }, sections);
        }}
      />

      {/* Header / metadata */}
      <Card>
        <CardHeader><CardTitle>SOP Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Title</Label>
            <Input value={sop.title} onChange={e => updateSop({ title: e.target.value })} />
          </div>
          <div>
            <Label>SOP Number / Code</Label>
            <Input value={sop.sop_number || ''} onChange={e => updateSop({ sop_number: e.target.value })} placeholder="e.g. SOP-042" />
          </div>
          <div>
            <Label>Department</Label>
            <SopOptionSelect kind="department" value={sop.department || ''} onChange={v => updateSop({ department: v })} placeholder="Select department" />
          </div>
          <div>
            <Label>Revision #</Label>
            <SopOptionSelect kind="revision" value={sop.revision_number || ''} onChange={v => updateSop({ revision_number: v })} placeholder="Select revision" />

          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={sop.category_id ?? '__none__'}
              onValueChange={v => updateSop({ category_id: v === '__none__' ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="Uncategorized" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Uncategorized</SelectItem>
                {categoryOptions.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={sop.status} onValueChange={v => updateSop({ status: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="obsolete">Obsolete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Effective Date</Label>
            <Input type="date" value={sop.effective_date || ''} onChange={e => updateSop({ effective_date: e.target.value || null })} />
          </div>
          <div>
            <Label>Last Updated</Label>
            <Input type="date" value={sop.last_updated_date || ''} onChange={e => updateSop({ last_updated_date: e.target.value || null })} />
          </div>
          <div>
            <Label>Author</Label>
            <SopOptionSelect kind="author" value={sop.author || ''} onChange={v => updateSop({ author: v })} placeholder="Select author" />
          </div>
          <div>
            <Label>Approved By</Label>
            <SopOptionSelect kind="approver" value={sop.approved_by || ''} onChange={v => updateSop({ approved_by: v })} placeholder="Select approver" />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Procedure Steps</CardTitle>
          <Button size="sm" onClick={addStep}><Plus className="h-4 w-4 mr-1" /> Add Step</Button>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">No steps yet. Click "Add Step" to begin.</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {steps.map((step, idx) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    index={idx}
                    isExpanded={expandedSteps.has(step.id)}
                    onToggleExpand={() => toggleStep(step.id)}
                    files={stepFiles.filter(f => f.step_id === step.id)}
                    items={stepItems.filter(i => i.step_id === step.id)}
                    itemsById={itemsById}
                    signedUrls={signedUrls}
                    onUpdate={(u) => updateStep(step.id, u)}
                    onDelete={() => confirm('Delete this step?') && deleteStep(step.id)}
                    onUpload={(f) => uploadStepFile(step.id, f)}
                    onDeleteFile={deleteStepFile}
                    onOpenPicker={() => openStepPicker(step.id)}
                    onRemoveItem={removeStepItem}
                    onUpdateItem={updateStepItem}
                  />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* BOM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Bill of Materials</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Estimated total: <span className="font-semibold text-foreground">{formatCurrency(bomTotal)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={bom.length === 0}
              onClick={() => {
                const prefillItems = bom
                  .map(b => {
                    const inv = itemsById.get(b.inventory_item_id);
                    if (!inv) return null;
                    return {
                      inventory_item_id: inv.id,
                      name: inv.name,
                      sku: inv.sku || null,
                      quantity: b.quantity,
                      unit_cost: inv.cost || 0,
                      notes: b.notes || '',
                    };

                  })
                  .filter(Boolean);
                navigate('/purchase-orders/new', { state: { prefillItems } });
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-1" /> Create PO from BOM
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bom.length === 0}
              onClick={async () => {
                await generateAssemblyPDF({
                  name: `${sop?.title || 'SOP'} - Bill of Materials`,
                  description: null,
                  sellingPrice: 0,
                  status: '',
                  statusNotes: null,
                  totalCost: bomTotal,
                  items: bom.map(b => {
                    const inv = itemsById.get(b.inventory_item_id);
                    return {
                      itemName: inv?.name || 'Unknown',
                      sku: inv?.sku || '',
                      quantity: b.quantity,
                      unitCost: inv?.cost || 0,
                      notes: b.notes,
                    };
                  }),
                });
              }}
            >
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
            <Button size="sm" variant="outline" onClick={openBomPicker}><Package className="h-4 w-4 mr-1" /> Add Parts</Button>
          </div>
        </CardHeader>
        <CardContent>
          {bom.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No parts on the BOM yet.</div>
          ) : (
            <div className="space-y-2">
              {bom.map(b => {
                const inv = itemsById.get(b.inventory_item_id);
                const lineCost = b.quantity * (inv?.cost || 0);
                return (
                  <div key={b.id} className="flex flex-wrap items-center gap-2 border border-border rounded-md p-2">
                    <Link to={`/item/${b.inventory_item_id}`} className="font-medium hover:text-primary flex-1 min-w-[150px]">
                      {inv?.name || 'Missing item'}
                      {inv?.sku && <span className="text-xs text-muted-foreground ml-2">#{inv.sku}</span>}
                    </Link>
                    <Input type="number" step="0.01" value={b.quantity}
                      onChange={e => updateBomItem(b.id, { quantity: Number(e.target.value) })}
                      className="w-20 h-8" />
                    <label className="flex items-center gap-1 text-xs">
                      <Checkbox checked={b.is_optional} onCheckedChange={(v) => updateBomItem(b.id, { is_optional: !!v })} />
                      Optional
                    </label>
                    <Input value={b.notes || ''} onChange={e => updateBomItem(b.id, { notes: e.target.value })}
                      placeholder="Notes / substitute of..." className="flex-1 min-w-[140px] h-8" />
                    <span className="text-sm text-muted-foreground w-20 text-right">{formatCurrency(lineCost)}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeBomItem(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Locations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Locations</CardTitle>
          <Button size="sm" variant="outline" onClick={() => addLocation()}>
            <Plus className="h-4 w-4 mr-1" /> Add Location
          </Button>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No locations yet.</div>
          ) : (
            <div className="space-y-2">
              {locations.map(loc => (
                <div key={loc.id} className="flex flex-wrap items-center gap-2 border border-border rounded-md p-2">
                  <Input
                    value={loc.name}
                    onChange={e => updateLocation(loc.id, { name: e.target.value })}
                    placeholder="Location name (e.g. Shop A)"
                    className="flex-1 min-w-[160px] h-8"
                  />
                  <Input
                    value={loc.url || ''}
                    onChange={e => updateLocation(loc.id, { url: e.target.value })}
                    placeholder="https://... (Google Maps, etc.)"
                    className="flex-[2] min-w-[220px] h-8"
                  />
                  {loc.url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={loc.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                      </a>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeLocation(loc.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Attachments</CardTitle>
          <>
            <input ref={attachRef} type="file" multiple className="hidden" onChange={e => handleAttach(e.target.files)} />
            <Button size="sm" variant="outline" onClick={() => attachRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Upload
            </Button>
          </>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No attachments.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {attachments.map(a => {
                const url = signedUrls[a.id];
                const isImg = (a.mime_type || '').startsWith('image/');
                return (
                  <div key={a.id} className="border border-border rounded-md p-2 flex flex-col gap-1">
                    {isImg && url ? (
                      <a href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={a.file_name} className="h-24 w-full object-cover rounded" />
                      </a>
                    ) : (
                      <a href={url} target="_blank" rel="noreferrer" className="h-24 flex items-center justify-center bg-muted rounded">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </a>
                    )}
                    <div className="text-xs truncate flex items-center gap-1">
                      <span className="flex-1 truncate">{a.file_name}</span>
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => deleteAttachment(a.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {pickerContext && (
        <FullScreenItemPicker
          open={!!pickerContext}
          onClose={() => setPickerContext(null)}
          inventoryItems={allItems}
          cart={pickerCart}
          onAddItem={handlePickerAdd}
          onAddCustomItem={() => {}}
          onUpdateQuantity={handlePickerQty}
          onRemoveItem={handlePickerRemove}
          onUpdateItem={handlePickerUpdate}
          documentType="Part"
          formatPrice={formatCurrency}
        />
      )}
    </div>
  );
}

function TimeInput({ minutes, onChange }: { minutes: number | null; onChange: (m: number | null) => void }) {
  const [unit, setUnit] = useState<'min' | 'hr'>(() => (minutes != null && minutes % 60 === 0 && minutes >= 60 ? 'hr' : 'min'));
  const display = minutes == null ? '' : unit === 'hr' ? String(minutes / 60) : String(minutes);
  return (
    <div className="flex items-center gap-1">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Input
        type="number" min="0" step="0.01" placeholder="Time"
        value={display}
        onChange={e => {
          const v = e.target.value;
          if (v === '') { onChange(null); return; }
          const n = Number(v);
          onChange(unit === 'hr' ? Math.round(n * 60) : n);
        }}
        className="w-24 h-8"
      />
      <select
        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        value={unit}
        onChange={e => setUnit(e.target.value as 'min' | 'hr')}
      >
        <option value="min">minutes</option>
        <option value="hr">hours</option>
      </select>
    </div>
  );
}


function StepRow({
  step, index, isExpanded, onToggleExpand, files, items, itemsById, signedUrls,
  onUpdate, onDelete, onUpload, onDeleteFile, onOpenPicker, onRemoveItem, onUpdateItem,
}: {
  step: SopStep;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  files: any[];
  items: any[];
  itemsById: Map<string, any>;
  signedUrls: Record<string, string>;
  onUpdate: (u: Partial<SopStep>) => void;
  onDelete: () => void;
  onUpload: (f: File) => Promise<void>;
  onDeleteFile: (id: string) => void;
  onOpenPicker: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, u: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = (step.content || '').split('\n')[0].slice(0, 100) || 'No content';

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-lg p-3 bg-card">
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground mt-1" title="Drag to reorder">
          <GripVertical className="h-4 w-4" />
        </button>
        <button onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground mt-1" title={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <Badge variant="outline" className="mt-0.5 shrink-0">Step {index + 1}</Badge>
        {!isExpanded && (
          <span className="flex-1 text-sm text-muted-foreground truncate mt-0.5" title={step.content || ''}>
            {preview}
          </span>
        )}
        {isExpanded && (
          <div className="flex-1 space-y-2">
            <Textarea
              value={step.content || ''}
              onChange={e => onUpdate({ content: e.target.value })}
              placeholder="Describe what to do..."
              className="min-h-[80px]"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <FieldWithIcon icon={AlertTriangle} label="Warnings" color="text-red-500"
                value={step.warnings || ''} onChange={v => onUpdate({ warnings: v })} />
              <FieldWithIcon icon={StickyNote} label="Notes"
                value={step.notes || ''} onChange={v => onUpdate({ notes: v })} />
              <FieldWithIcon icon={Lightbulb} label="Tips" color="text-amber-500"
                value={step.tips || ''} onChange={v => onUpdate({ tips: v })} />
              <FieldWithIcon icon={Wrench} label="Required Tools"
                value={step.required_tools || ''} onChange={v => onUpdate({ required_tools: v })} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <TimeInput
                minutes={step.estimated_minutes ?? null}
                onChange={m => onUpdate({ estimated_minutes: m })}
              />
              <span className="text-xs text-muted-foreground">estimated</span>
            </div>


            {/* Linked items */}
            {items.length > 0 && (
              <div className="space-y-1 border-t border-border pt-2">
                <div className="text-xs font-semibold text-muted-foreground">Linked parts</div>
                {items.map(it => {
                  const inv = itemsById.get(it.inventory_item_id);
                  return (
                    <div key={it.id} className="flex items-center gap-2 flex-wrap text-sm">
                      <Input type="number" step="0.01" value={it.quantity}
                        onChange={e => onUpdateItem(it.id, { quantity: Number(e.target.value) })}
                        className="w-16 h-7" />
                      <span>×</span>
                      <Link to={`/item/${it.inventory_item_id}`} className="hover:text-primary font-medium">
                        {inv?.name || 'Missing item'}
                      </Link>
                      {inv?.sku && <span className="text-xs text-muted-foreground">#{inv.sku}</span>}
                      {inv && (
                        <span className="text-xs text-muted-foreground">
                          · stock {inv.quantity} · {formatCurrency(inv.cost || 0)}
                        </span>
                      )}
                      <Link to={`/item/${it.inventory_item_id}`} className="text-muted-foreground hover:text-primary" title="Open item">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive ml-auto"
                        onClick={() => onRemoveItem(it.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-2">
                {files.map(f => {
                  const url = signedUrls[f.id];
                  const isImg = (f.mime_type || '').startsWith('image/');
                  return (
                    <div key={f.id} className="relative group">
                      {isImg && url ? (
                        <a href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={f.file_name} className="h-16 w-16 object-cover rounded border border-border" />
                        </a>
                      ) : (
                        <a href={url} target="_blank" rel="noreferrer"
                          className="h-16 w-16 rounded border border-border bg-muted flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </a>
                      )}
                      <button onClick={() => onDeleteFile(f.id)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Links */}
            {(step.links && step.links.length > 0) ? (
              <div className="space-y-1 border-t border-border pt-2">
                <div className="text-xs font-semibold text-muted-foreground">Links</div>
                {step.links.map((lnk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={lnk.name || ''}
                      placeholder="Label"
                      onChange={e => {
                        const next = [...(step.links || [])];
                        next[i] = { ...next[i], name: e.target.value };
                        onUpdate({ links: next } as any);
                      }}
                      className="h-7 w-40 text-sm"
                    />
                    <Input
                      value={lnk.url}
                      placeholder="https://…"
                      onChange={e => {
                        const next = [...(step.links || [])];
                        next[i] = { ...next[i], url: e.target.value };
                        onUpdate({ links: next } as any);
                      }}
                      className="h-7 flex-1 text-sm"
                    />
                    {lnk.url && (
                      <a href={/^https?:\/\//i.test(lnk.url) ? lnk.url : `https://${lnk.url}`}
                        target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary" title="Open">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                      onClick={() => {
                        const next = (step.links || []).filter((_, j) => j !== i);
                        onUpdate({ links: next } as any);
                      }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2 pt-1 flex-wrap">
              <input ref={fileRef} type="file" multiple className="hidden"
                onChange={async e => {
                  if (!e.target.files) return;
                  for (const f of Array.from(e.target.files)) await onUpload(f);
                  if (fileRef.current) fileRef.current.value = '';
                }} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Add file/image
              </Button>
              <Button size="sm" variant="outline" onClick={onOpenPicker}>
                <Package className="h-3.5 w-3.5 mr-1" /> Link Inventory
              </Button>
              <Button size="sm" variant="outline"
                onClick={() => onUpdate({ links: [...(step.links || []), { name: '', url: '' }] } as any)}>
                <LinkIcon className="h-3.5 w-3.5 mr-1" /> Add Link
              </Button>
            </div>
          </div>
        )}
        <Button size="icon" variant="ghost" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FieldWithIcon({ icon: Icon, label, color, value, onChange }: {
  icon: any; label: string; color?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="flex items-center gap-1 text-xs">
        <Icon className={`h-3 w-3 ${color || 'text-muted-foreground'}`} /> {label}
      </Label>
      <Textarea value={value} onChange={e => onChange(e.target.value)} className="min-h-[50px] text-sm" />
    </div>
  );
}
