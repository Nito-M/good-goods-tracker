import { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical, Pencil, Check, X, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManufacturingSteps, ManufacturingStep, MACHINES, OPERATION_TYPES } from '@/hooks/useManufacturingSteps';

interface Props {
  partId: string;
}

function formatCurrencyValue(val: number) {
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 5 });
}

function StepSummary(step: ManufacturingStep) {
  const parts: string[] = [];
  if (step.operationType && step.operationType !== 'Custom') parts.push(step.operationType);
  if (step.length) parts.push(`to ${step.length}`);
  if (step.angle) parts.push(`${step.angle}°`);
  if (step.holeDiameter) parts.push(`(${step.quantity || 1}) ${step.holeDiameter}" holes`);
  else if (step.quantity && step.quantity > 1) parts.push(`× ${step.quantity}`);
  if (step.positionOffset) parts.push(step.positionOffset);
  if (step.price > 0) parts.push(formatCurrencyValue(step.price));
  return parts.join(', ') || step.operationType;
}

export function ManufacturingInstructions({ partId }: Props) {
  const { steps, loading, addStep, updateStep, deleteStep, reorderSteps } = useManufacturingSteps(partId);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [machine, setMachine] = useState('Saw');
  const [operationType, setOperationType] = useState('Cut');
  const [length, setLength] = useState('');
  const [angle, setAngle] = useState('');
  const [holeDiameter, setHoleDiameter] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [positionOffset, setPositionOffset] = useState('');
  const [notes, setNotes] = useState('');

  // Drag state
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const resetForm = () => {
    setMachine('Saw');
    setOperationType('Cut');
    setLength('');
    setAngle('');
    setHoleDiameter('');
    setQuantity('');
    setPrice('');
    setPositionOffset('');
    setNotes('');
  };

  const loadStep = (s: ManufacturingStep) => {
    setMachine(s.machine);
    setOperationType(s.operationType);
    setLength(s.length || '');
    setAngle(s.angle || '');
    setHoleDiameter(s.holeDiameter || '');
    setQuantity(s.quantity ? String(s.quantity) : '');
    setPrice(s.price ? String(s.price) : '');
    setPositionOffset(s.positionOffset || '');
    setNotes(s.notes || '');
  };

  const handleAdd = async () => {
    setSaving(true);
    await addStep({
      machine, operationType, length: length || null, angle: angle || null,
      holeDiameter: holeDiameter || null, quantity: quantity ? parseInt(quantity) : null,
      positionOffset: positionOffset || null, notes: notes || null,
      price: price ? parseFloat(price) : 0,
    });
    resetForm();
    setAdding(false);
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSaving(true);
    await updateStep(editingId, {
      machine, operationType, length: length || null, angle: angle || null,
      holeDiameter: holeDiameter || null, quantity: quantity ? parseInt(quantity) : null,
      positionOffset: positionOffset || null, notes: notes || null,
      price: price ? parseFloat(price) : 0,
    });
    resetForm();
    setEditingId(null);
    setSaving(false);
  };

  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); dragOverIdx.current = idx; };
  const handleDrop = () => {
    if (dragIdx.current === null || dragOverIdx.current === null || dragIdx.current === dragOverIdx.current) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(dragIdx.current, 1);
    reordered.splice(dragOverIdx.current, 0, moved);
    reorderSteps(reordered.map((s, i) => ({ ...s, stepOrder: i })));
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  const formFields = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Machine</Label>
          <Select value={machine} onValueChange={setMachine}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MACHINES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Operation Type</Label>
          <Select value={operationType} onValueChange={setOperationType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OPERATION_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="space-y-1.5">
          <Label>Length</Label>
          <Input value={length} onChange={e => setLength(e.target.value)} placeholder='e.g. 96"' />
        </div>
        <div className="space-y-1.5">
          <Label>Angle</Label>
          <Input value={angle} onChange={e => setAngle(e.target.value)} placeholder="e.g. 45°" />
        </div>
        <div className="space-y-1.5">
          <Label>Hole Diameter</Label>
          <Input value={holeDiameter} onChange={e => setHoleDiameter(e.target.value)} placeholder='e.g. 1/2"' />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity</Label>
          <Input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" />
        </div>
        <div className="space-y-1.5">
          <Label>Price ($)</Label>
          <Input type="number" min={0} step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Position / Offset</Label>
        <Input value={positionOffset} onChange={e => setPositionOffset(e.target.value)} placeholder='e.g. 3" from each end' />
      </div>
      <div className="space-y-1.5">
        <Label>Notes / Instructions</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Free text instructions" rows={2} />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" /> Manufacturing Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : steps.length === 0 && !adding ? (
          <p className="text-sm text-muted-foreground">No manufacturing steps defined yet.</p>
        ) : (
          <div className="space-y-1">
            {steps.map((step, idx) => (
              editingId === step.id ? (
                <div key={step.id} className="border border-border rounded-md p-3 space-y-3 bg-muted/30">
                  <p className="text-sm font-semibold text-muted-foreground">Step {idx + 1}</p>
                  {formFields}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdate} disabled={saving}>
                      <Check className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(null); resetForm(); }}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  className="flex items-start gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted/50 cursor-grab active:cursor-grabbing group"
                >
                  <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-semibold text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{step.machine}</span>
                    <span className="text-sm text-muted-foreground"> – {StepSummary(step)}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(step.id); loadStep(step); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteStep(step.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {adding && (
          <div className="border border-border rounded-md p-3 space-y-3 bg-muted/30">
            <p className="text-sm font-semibold text-muted-foreground">Step {steps.length + 1}</p>
            {formFields}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>
                <Check className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Add Step'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAdding(false); resetForm(); }}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {!adding && !editingId && (
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setAdding(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Machine / Operation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
