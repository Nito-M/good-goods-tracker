import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Link as LinkIcon, Package, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  usePrebuiltAssemblies,
  useTrailerTypes,
  useAssemblyComponents,
  useTrailerLengths,
} from '@/hooks/useTrailerConfig';
import { useAssemblies } from '@/hooks/useAssemblies';

const NONE = 'none';
const toVal = (v: string | null | undefined) => v || NONE;
const fromVal = (v: string) => (v && v !== NONE ? v : null);

export function PrebuiltAssemblyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { assemblies, loading, update } = usePrebuiltAssemblies();
  const { types } = useTrailerTypes();
  const { components, getByCategory } = useAssemblyComponents();
  const { lengths } = useTrailerLengths();
  const { assemblies: allAssemblies } = useAssemblies();

  const prebuilt = useMemo(() => assemblies.find(a => a.id === id), [assemblies, id]);
  const trailerType = types.find(t => t.id === prebuilt?.trailer_type_id);

  // Local editable state — synced from prebuilt
  const [trailerLengthId, setTrailerLengthId] = useState<string>(NONE);
  const [frontEndId, setFrontEndId] = useState<string>(NONE);
  const [frontEndTier2Id, setFrontEndTier2Id] = useState<string>(NONE);
  const [backEndId, setBackEndId] = useState<string>(NONE);
  const [deckTypeId, setDeckTypeId] = useState<string>(NONE);
  const [underCarriageId, setUnderCarriageId] = useState<string>(NONE);
  const [underCarriageTier2Id, setUnderCarriageTier2Id] = useState<string>(NONE);
  const [underCarriageTier3Id, setUnderCarriageTier3Id] = useState<string>(NONE);
  const [underCarriageAxleCount, setUnderCarriageAxleCount] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [linkedAssemblyId, setLinkedAssemblyId] = useState<string>(NONE);
  const [notes, setNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!prebuilt || initialized) return;
    const p = prebuilt as any;
    setTrailerLengthId(toVal(p.trailer_length_id));
    setFrontEndId(toVal(p.front_end_id));
    setFrontEndTier2Id(toVal(p.front_end_tier2_id));
    setBackEndId(toVal(p.back_end_id));
    setDeckTypeId(toVal(p.deck_type_id));
    setUnderCarriageId(toVal(p.under_carriage_id));
    setUnderCarriageTier2Id(toVal(p.under_carriage_tier2_id));
    setUnderCarriageTier3Id(toVal(p.under_carriage_tier3_id));
    setUnderCarriageAxleCount(p.under_carriage_axle_count ? String(p.under_carriage_axle_count) : '');
    setTotalPrice(String(p.total_price ?? ''));
    setLinkedAssemblyId(toVal(p.linked_assembly_id));
    setNotes(p.notes || '');
    setInitialized(true);
  }, [prebuilt, initialized]);

  const trailerTypeId = prebuilt?.trailer_type_id || undefined;

  // Component lookups
  const findComp = (cid: string | null | undefined) =>
    cid ? components.find(c => c.id === cid) : undefined;

  // Mirror Trailer Configurator: filter by compatible_trailer_type_ids + parent tier
  const frontEndStep1 = useMemo(
    () => getByCategory('front_end', trailerTypeId, null),
    [components, trailerTypeId],
  );
  const frontEndStep2 = useMemo(() => {
    const fid = fromVal(frontEndId);
    return fid ? getByCategory('front_end', trailerTypeId, fid) : [];
  }, [components, trailerTypeId, frontEndId]);

  const ucStep1 = useMemo(
    () => getByCategory('under_carriage', trailerTypeId, null),
    [components, trailerTypeId],
  );
  const ucStep2 = useMemo(() => {
    const uid = fromVal(underCarriageId);
    return uid ? getByCategory('under_carriage', trailerTypeId, uid) : [];
  }, [components, trailerTypeId, underCarriageId]);
  const ucStep3 = useMemo(() => {
    const uid = fromVal(underCarriageTier2Id);
    return uid ? getByCategory('under_carriage', trailerTypeId, uid) : [];
  }, [components, trailerTypeId, underCarriageTier2Id]);

  const backEnds = useMemo(
    () => getByCategory('back_end', trailerTypeId),
    [components, trailerTypeId],
  );
  const deckTypes = useMemo(
    () => getByCategory('deck_type', trailerTypeId),
    [components, trailerTypeId],
  );

  const sortedAssemblies = useMemo(
    () => [...allAssemblies].sort((a, b) => {
      const t = (a.type || '').localeCompare(b.type || '');
      return t !== 0 ? t : a.name.localeCompare(b.name);
    }),
    [allAssemblies],
  );

  const linkedAssembly = sortedAssemblies.find(a => a.id === fromVal(linkedAssemblyId));

  // Auto-save helper for any partial update
  const saveField = async (updates: Record<string, any>, msg?: string) => {
    if (!id) return;
    await update(id, updates as any);
    if (msg) toast({ title: 'Saved', description: msg });
  };

  // Specialized handlers that also clear dependent tiers
  const handleFrontEnd = async (v: string) => {
    setFrontEndId(v);
    setFrontEndTier2Id(NONE);
    await saveField({ front_end_id: fromVal(v), front_end_tier2_id: null }, 'Front End updated');
  };
  const handleUnderCarriage = async (v: string) => {
    setUnderCarriageId(v);
    setUnderCarriageTier2Id(NONE);
    setUnderCarriageTier3Id(NONE);
    setUnderCarriageAxleCount('');
    await saveField({
      under_carriage_id: fromVal(v),
      under_carriage_tier2_id: null,
      under_carriage_tier3_id: null,
      under_carriage_axle_count: null,
    }, 'Under Carriage updated');
  };
  const handleUcTier2 = async (v: string) => {
    setUnderCarriageTier2Id(v);
    setUnderCarriageTier3Id(NONE);
    await saveField({ under_carriage_tier2_id: fromVal(v), under_carriage_tier3_id: null }, 'UC Tier 2 updated');
  };

  const saveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    try {
      await update(id, { notes } as any);
      toast({ title: 'Notes saved' });
    } finally {
      setSavingNotes(false);
    }
  };

  const saveTotalPrice = async () => {
    await saveField({ total_price: parseFloat(totalPrice) || 0 }, 'Total Price updated');
  };

  if (loading && !prebuilt) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!prebuilt) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate('/trailer-configurator/admin')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
        </Button>
        <p className="text-muted-foreground">Prebuilt assembly not found.</p>
      </div>
    );
  }

  // Display rows for "attached" components
  const componentRows: { label: string; comp: ReturnType<typeof findComp> }[] = [
    { label: 'Front End', comp: findComp(fromVal(frontEndId)) },
    { label: 'Front End — Tier 2', comp: findComp(fromVal(frontEndTier2Id)) },
    { label: 'Back End', comp: findComp(fromVal(backEndId)) },
    { label: 'Add Ons', comp: findComp(fromVal(deckTypeId)) },
    { label: 'Under Carriage', comp: findComp(fromVal(underCarriageId)) },
    { label: 'Under Carriage — Tier 2', comp: findComp(fromVal(underCarriageTier2Id)) },
    { label: 'Under Carriage — Tier 3', comp: findComp(fromVal(underCarriageTier3Id)) },
  ].filter(r => !!r.comp);

  const componentSubtotal = componentRows.reduce(
    (sum, r) => sum + Number(r.comp?.price || 0),
    0,
  );

  const compatibleLengths = lengths.filter(
    l => !prebuilt.trailer_type_id ||
      l.compatible_trailer_type_ids.length === 0 ||
      l.compatible_trailer_type_ids.includes(prebuilt.trailer_type_id),
  );

  // Mirror Trailer Configurator: axle options come from the selected length
  const selectedLength = lengths.find(l => l.id === fromVal(trailerLengthId));
  const allowedAxleCounts = (selectedLength?.allowed_axle_counts && selectedLength.allowed_axle_counts.length > 0)
    ? selectedLength.allowed_axle_counts
    : [2, 3];

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => navigate('/trailer-configurator/admin')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
        </Button>
        {linkedAssembly && (
          <RouterLink
            to={`/assemblies/${encodeURIComponent(linkedAssembly.type || '')}?id=${linkedAssembly.id}`}
          >
            <Button variant="default">
              <LinkIcon className="h-4 w-4 mr-1" /> Open Linked Assembly
            </Button>
          </RouterLink>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{trailerType?.name || 'Prebuilt Trailer'}</h1>
          <p className="text-muted-foreground text-sm">Edit any field — changes save automatically.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">Total Price</p>
          <p className="text-3xl font-bold text-primary">
            ${Number(prebuilt.total_price).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editable Configuration */}
        <Card className="lg:col-span-1 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldRow label="Trailer Type">
              <span className="font-medium">{trailerType?.name || '—'}</span>
            </FieldRow>

            <FieldRow label="Length">
              <Select value={trailerLengthId} onValueChange={async v => { setTrailerLengthId(v); await saveField({ trailer_length_id: fromVal(v) }, 'Length updated'); }}>
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {compatibleLengths.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Axles">
              <Select value={underCarriageAxleCount || NONE} onValueChange={async v => { const nv = v === NONE ? '' : v; setUnderCarriageAxleCount(nv); await saveField({ under_carriage_axle_count: nv ? parseInt(nv) : null }, 'Axles updated'); }}>
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {allowedAxleCounts.map(n => (
                    <SelectItem key={n} value={String(n)}>{n} Axles</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            <Separator />

            <FieldRow label="Front End">
              <Select value={frontEndId} onValueChange={handleFrontEnd}>
                <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {frontEndStep1.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>

            {frontEndStep2.length > 0 && (
              <FieldRow label="FE Tier 2">
                <Select value={frontEndTier2Id} onValueChange={async v => { setFrontEndTier2Id(v); await saveField({ front_end_tier2_id: fromVal(v) }, 'FE Tier 2 updated'); }}>
                  <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {frontEndStep2.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}

            <FieldRow label="Back End">
              <Select value={backEndId} onValueChange={async v => { setBackEndId(v); await saveField({ back_end_id: fromVal(v) }, 'Back End updated'); }}>
                <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {backEnds.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Add Ons">
              <Select value={deckTypeId} onValueChange={async v => { setDeckTypeId(v); await saveField({ deck_type_id: fromVal(v) }, 'Add Ons updated'); }}>
                <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {deckTypes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Under Carriage">
              <Select value={underCarriageId} onValueChange={handleUnderCarriage}>
                <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {ucStep1.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>

            {ucStep2.length > 0 && (
              <FieldRow label="UC Tier 2">
                <Select value={underCarriageTier2Id} onValueChange={handleUcTier2}>
                  <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {ucStep2.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}

            {ucStep3.length > 0 && (
              <FieldRow label="UC Tier 3">
                <Select value={underCarriageTier3Id} onValueChange={async v => { setUnderCarriageTier3Id(v); await saveField({ under_carriage_tier3_id: fromVal(v) }, 'UC Tier 3 updated'); }}>
                  <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {ucStep3.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}

            <Separator />

            <FieldRow label="Total Price">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  value={totalPrice}
                  onChange={e => setTotalPrice(e.target.value)}
                  onBlur={saveTotalPrice}
                  className="h-8 w-32"
                />
              </div>
            </FieldRow>

            <FieldRow label="Linked Assembly">
              <Select value={linkedAssemblyId} onValueChange={async v => { setLinkedAssemblyId(v); await saveField({ linked_assembly_id: fromVal(v) }, 'Linked Assembly updated'); }}>
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={NONE}>None</SelectItem>
                  {sortedAssemblies.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.type ? `[${a.type}] ` : ''}{a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            {linkedAssembly && (
              <RouterLink
                to={`/assemblies/${encodeURIComponent(linkedAssembly.type || '')}?id=${linkedAssembly.id}`}
                className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
              >
                <LinkIcon className="h-3 w-3" />
                Open: {linkedAssembly.name}
              </RouterLink>
            )}
          </CardContent>
        </Card>

        {/* Components + Notes */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" /> Attached Components
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {componentRows.length === 0 ? (
                <p className="text-muted-foreground text-sm">No components attached.</p>
              ) : (
                componentRows.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border"
                  >
                    {r.comp?.image_url ? (
                      <img
                        src={r.comp.image_url}
                        alt={r.comp.name}
                        className="h-16 w-16 object-cover rounded-md bg-background"
                      />
                    ) : (
                      <div className="h-16 w-16 flex items-center justify-center rounded-md bg-background border border-border">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="mb-1">{r.label}</Badge>
                      <p className="font-medium truncate">{r.comp?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${Number(r.comp?.price || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}

              {componentRows.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Component Subtotal</span>
                    <span className="font-medium">${componentSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Configured Total Price</span>
                    <span className="font-bold text-primary">
                      ${Number(prebuilt.total_price).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="prebuilt-notes" className="text-sm text-muted-foreground">
                Free-form notes for this prebuilt configuration
              </Label>
              <Textarea
                id="prebuilt-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Add specs, build instructions, reminders…"
                rows={6}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                  {savingNotes ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default PrebuiltAssemblyDetail;
