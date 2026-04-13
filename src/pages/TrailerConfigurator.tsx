import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useTrailerTypes, useAssemblyComponents, usePrebuiltAssemblies, PrebuiltAssembly } from '@/hooks/useTrailerConfig';
import { ArrowLeft, ArrowRight, Check, Package, AlertCircle, Settings, Download, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';

interface SelectionCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  selected: boolean;
  onSelect: (id: string) => void;
  price?: number;
}

function SelectionCard({ id, name, imageUrl, selected, onSelect, price }: SelectionCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary bg-primary/5'
      )}
      onClick={() => onSelect(id)}
    >
      <CardContent className="p-4 flex flex-col items-center gap-3">
        <div className="w-full aspect-[4/3] rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">{name}</p>
          {price !== undefined && price > 0 && (
            <p className="text-xs text-muted-foreground">${price.toFixed(2)}</p>
          )}
        </div>
        {selected && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STEPS = [
  { key: 'trailer_type', label: 'Select Trailer Type' },
  { key: 'under_carriage', label: 'Select Under Carriage' },
  { key: 'front_end', label: 'Select Front End' },
  { key: 'back_end', label: 'Select Back End' },
  { key: 'deck_type', label: 'Select Deck Type (Optional)' },
  { key: 'summary', label: 'Configuration Summary' },
];

export function TrailerConfigurator() {
  const { types, loading: typesLoading } = useTrailerTypes();
  const { components, loading: compsLoading, getByCategory } = useAssemblyComponents();
  const { save, lookup } = usePrebuiltAssemblies();

  const [step, setStep] = useState(0);
  const [trailerTypeId, setTrailerTypeId] = useState<string | null>(null);
  const [frontEndId, setFrontEndId] = useState<string | null>(null);
  const [frontEndSubId, setFrontEndSubId] = useState<string | null>(null);
  const [backEndId, setBackEndId] = useState<string | null>(null);
  const [deckTypeId, setDeckTypeId] = useState<string | null>(null);
  const [underCarriageId, setUnderCarriageId] = useState<string | null>(null);
  const [underCarriageSubId, setUnderCarriageSubId] = useState<string | null>(null);
  const [underCarriageTier3Id, setUnderCarriageTier3Id] = useState<string | null>(null);
  const [axleCount, setAxleCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [matchedAssembly, setMatchedAssembly] = useState<PrebuiltAssembly | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [configNotes, setConfigNotes] = useState('');

  const frontEnds = useMemo(() => getByCategory('front_end', trailerTypeId || undefined, null), [components, trailerTypeId]);
  const frontEndSubs = useMemo(() => frontEndId ? getByCategory('front_end', trailerTypeId || undefined, frontEndId) : [], [components, trailerTypeId, frontEndId]);
  const backEnds = useMemo(() => getByCategory('back_end', trailerTypeId || undefined), [components, trailerTypeId]);
  const deckTypes = useMemo(() => getByCategory('deck_type', trailerTypeId || undefined), [components, trailerTypeId]);
  const underCarriages = useMemo(() => getByCategory('under_carriage', trailerTypeId || undefined, null), [components, trailerTypeId]);
  const underCarriageSubs = useMemo(() => underCarriageId ? getByCategory('under_carriage', trailerTypeId || undefined, underCarriageId) : [], [components, trailerTypeId, underCarriageId]);
  const underCarriageTier3s = useMemo(() => underCarriageSubId ? getByCategory('under_carriage', trailerTypeId || undefined, underCarriageSubId) : [], [components, trailerTypeId, underCarriageSubId]);

  const selectedTrailer = types.find(t => t.id === trailerTypeId);
  const selectedFront = components.find(c => c.id === frontEndId);
  const selectedFrontSub = components.find(c => c.id === frontEndSubId);
  const selectedBack = components.find(c => c.id === backEndId);
  const selectedDeck = components.find(c => c.id === deckTypeId);
  const selectedUnderCarriage = components.find(c => c.id === underCarriageId);
  const selectedUnderCarriageSub = components.find(c => c.id === underCarriageSubId);
  const selectedUnderCarriageTier3 = components.find(c => c.id === underCarriageTier3Id);

  const underCarriageTotal = (selectedUnderCarriage?.price || 0) + (selectedUnderCarriageSub?.price || 0) + (selectedUnderCarriageTier3?.price || 0);
  const totalPrice = (selectedFront?.price || 0) + (selectedFrontSub?.price || 0) + (selectedBack?.price || 0) + (selectedDeck?.price || 0) + underCarriageTotal;

  // Lookup prebuilt assembly when entering step 5
  useEffect(() => {
    if (step === 5 && trailerTypeId) {
      setLookupLoading(true);
      setLookupDone(false);
      lookup({
        trailer_type_id: trailerTypeId,
        front_end_id: frontEndId,
        back_end_id: backEndId,
        deck_type_id: deckTypeId,
        under_carriage_id: underCarriageId || null,
      }).then((result) => {
        setMatchedAssembly(result);
        setLookupLoading(false);
        setLookupDone(true);
      });
    }
  }, [step, trailerTypeId, frontEndId, backEndId, deckTypeId, underCarriageId]);

  const canNext = () => {
    if (step === 0) return !!trailerTypeId;
    if (step === 1) return !!underCarriageId; // under carriage is required
    if (step === 2) return !!frontEndId;
    if (step === 3) return !!backEndId;
    if (step === 4) return true; // deck is optional
    return false;
  };

  const handleSave = async () => {
    if (!trailerTypeId) return;
    setSaving(true);
    await save({
      trailer_type_id: trailerTypeId,
      front_end_id: frontEndId,
      back_end_id: backEndId,
      deck_type_id: deckTypeId,
      under_carriage_id: underCarriageId || null,
      total_price: matchedAssembly?.total_price ?? totalPrice,
    });
    setSaving(false);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(18);
    doc.text('Trailer Configuration', pw / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(11);
    const rows: { label: string; value: string; price?: number }[] = [
      { label: 'Trailer Type', value: selectedTrailer?.name || '—' },
    ];
    if (selectedUnderCarriage) {
      rows.push({ label: 'Under Carriage', value: selectedUnderCarriage.name, price: selectedUnderCarriage.price });
      if (selectedUnderCarriageSub) {
        rows.push({ label: 'Under Carriage Option', value: selectedUnderCarriageSub.name, price: selectedUnderCarriageSub.price });
      }
      if (selectedUnderCarriageTier3) {
        rows.push({ label: 'Under Carriage Detail', value: selectedUnderCarriageTier3.name, price: selectedUnderCarriageTier3.price });
      }
    } else {
      rows.push({ label: 'Under Carriage', value: 'None' });
    }
    if (selectedFront) {
      rows.push({ label: 'Front End', value: selectedFront.name, price: selectedFront.price });
      if (selectedFrontSub) {
        rows.push({ label: 'Front End Option', value: selectedFrontSub.name, price: selectedFrontSub.price });
      }
    } else {
      rows.push({ label: 'Front End', value: '—' });
    }
    rows.push({ label: 'Back End', value: selectedBack?.name || '—', price: selectedBack?.price });
    rows.push({ label: 'Deck Type', value: selectedDeck?.name || 'None', price: selectedDeck?.price });

    rows.forEach(r => {
      doc.setFont('helvetica', 'bold');
      doc.text(r.label + ':', 20, y);
      doc.setFont('helvetica', 'normal');
      const priceStr = r.price !== undefined && r.price > 0 ? `  ($${r.price.toFixed(2)})` : '';
      doc.text(r.value + priceStr, 70, y);
      y += 8;
    });

    y += 4;
    doc.setDrawColor(200);
    doc.line(20, y, pw - 20, y);
    y += 8;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    const finalPrice = matchedAssembly?.total_price ?? totalPrice;
    doc.text(`Total Price: $${finalPrice.toFixed(2)}`, 20, y);
    y += 12;

    if (configNotes.trim()) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(configNotes, pw - 40);
      doc.text(lines, 20, y);
    }

    const trailerName = selectedTrailer?.name?.replace(/\s+/g, '_') || 'config';
    doc.save(`Trailer_Config_${trailerName}.pdf`);
  };

  const loading = typesLoading || compsLoading;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/trailer-configurator/admin"><Settings className="h-4 w-4 mr-1" /> Admin</Link>
        </Button>
      </div>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                i < step && 'bg-primary text-primary-foreground',
                i === step && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                i > step && 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 w-8', i < step ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-6">{STEPS[step].label}</h2>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {/* Step 1: Trailer Type */}
          {step === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {types.map(t => (
                <div key={t.id} className="relative">
                  <SelectionCard
                    id={t.id}
                    name={t.name}
                    imageUrl={t.image_url}
                    selected={trailerTypeId === t.id}
                    onSelect={(id) => {
                      setTrailerTypeId(id);
                      setFrontEndId(null);
                      setFrontEndSubId(null);
                      setBackEndId(null);
                      setDeckTypeId(null);
                      setUnderCarriageId(null);
                      setUnderCarriageSubId(null);
                      setUnderCarriageTier3Id(null);
                      setAxleCount(null);
                    }}
                  />
                </div>
              ))}
              {types.length === 0 && (
                <p className="col-span-full text-muted-foreground text-center py-12">No trailer types configured yet. Add them in Settings.</p>
              )}
            </div>
          )}

          {/* Step 2: Under Carriage */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 1: Select Under Carriage Type</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {underCarriages.map(c => (
                    <div key={c.id} className="relative">
                      <SelectionCard
                        id={c.id}
                        name={c.name}
                        imageUrl={c.image_url}
                        selected={underCarriageId === c.id}
                        onSelect={(id) => {
                          setUnderCarriageId(underCarriageId === id ? null : id);
                          setUnderCarriageSubId(null);
                          setUnderCarriageTier3Id(null);
                          setAxleCount(null);
                        }}
                        price={c.price}
                      />
                    </div>
                  ))}
                  {underCarriages.length === 0 && (
                    <p className="col-span-full text-muted-foreground text-center py-12">No under carriage components available.</p>
                  )}
                </div>
              </div>

              {underCarriageId && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 2: How many Axles?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[2, 3].map(num => (
                      <Card
                        key={num}
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-md',
                          axleCount === num && 'ring-2 ring-primary bg-primary/5'
                        )}
                        onClick={() => {
                          setAxleCount(axleCount === num ? null : num);
                          setUnderCarriageSubId(null);
                          setUnderCarriageTier3Id(null);
                        }}
                      >
                        <CardContent className="p-6 flex flex-col items-center gap-2">
                          <span className="text-3xl font-bold">{num}</span>
                          <span className="text-sm text-muted-foreground">{num} Axle{num > 1 ? 's' : ''}</span>
                          {axleCount === num && (
                            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {underCarriageId && axleCount && underCarriageSubs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 3: Select Option for {selectedUnderCarriage?.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {underCarriageSubs.map(c => (
                      <div key={c.id} className="relative">
                        <SelectionCard
                          id={c.id}
                          name={c.name}
                          imageUrl={c.image_url}
                          selected={underCarriageSubId === c.id}
                        onSelect={(id) => {
                          setUnderCarriageSubId(underCarriageSubId === id ? null : id);
                          setUnderCarriageTier3Id(null);
                        }}
                          price={c.price}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {underCarriageSubId && underCarriageTier3s.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 3: Select Option for {selectedUnderCarriageSub?.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {underCarriageTier3s.map(c => (
                      <div key={c.id} className="relative">
                        <SelectionCard
                          id={c.id}
                          name={c.name}
                          imageUrl={c.image_url}
                          selected={underCarriageTier3Id === c.id}
                          onSelect={(id) => setUnderCarriageTier3Id(underCarriageTier3Id === id ? null : id)}
                          price={c.price}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Front End */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 1: Select Front End Type</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {frontEnds.map(c => (
                    <div key={c.id} className="relative">
                      <SelectionCard
                        id={c.id}
                        name={c.name}
                        imageUrl={c.image_url}
                        selected={frontEndId === c.id}
                        onSelect={(id) => {
                          setFrontEndId(frontEndId === id ? null : id);
                          setFrontEndSubId(null);
                        }}
                        price={c.price}
                      />
                    </div>
                  ))}
                  {frontEnds.length === 0 && (
                    <p className="col-span-full text-muted-foreground text-center py-12">No front end components available.</p>
                  )}
                </div>
              </div>

              {frontEndId && frontEndSubs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 2: Select Option for {selectedFront?.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {frontEndSubs.map(c => (
                      <div key={c.id} className="relative">
                        <SelectionCard
                          id={c.id}
                          name={c.name}
                          imageUrl={c.image_url}
                          selected={frontEndSubId === c.id}
                          onSelect={(id) => setFrontEndSubId(frontEndSubId === id ? null : id)}
                          price={c.price}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Back End */}
          {step === 3 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {backEnds.map(c => (
                <div key={c.id} className="relative">
                  <SelectionCard
                    id={c.id}
                    name={c.name}
                    imageUrl={c.image_url}
                    selected={backEndId === c.id}
                    onSelect={setBackEndId}
                    price={c.price}
                  />
                </div>
              ))}
              {backEnds.length === 0 && (
                <p className="col-span-full text-muted-foreground text-center py-12">No back end components available.</p>
              )}
            </div>
          )}

          {/* Step 5: Deck Type */}
          {step === 4 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {deckTypes.map(c => (
                <div key={c.id} className="relative">
                  <SelectionCard
                    id={c.id}
                    name={c.name}
                    imageUrl={c.image_url}
                    selected={deckTypeId === c.id}
                    onSelect={(id) => setDeckTypeId(deckTypeId === id ? null : id)}
                    price={c.price}
                  />
                </div>
              ))}
              {deckTypes.length === 0 && (
                <p className="col-span-full text-muted-foreground text-center py-12">No deck type components available.</p>
              )}
            </div>
          )}

          {/* Step 6: Summary */}
          {step === 5 && (
            <div className="space-y-6">
              {lookupLoading ? (
                <p className="text-muted-foreground text-center py-12">Looking up configuration...</p>
              ) : lookupDone && !matchedAssembly ? (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center gap-3 py-12">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-lg font-medium text-muted-foreground">No matching assembly found</p>
                    <p className="text-sm text-muted-foreground">This combination is not available as a prebuilt assembly.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SummaryRow label="Trailer Type" value={selectedTrailer?.name} imageUrl={selectedTrailer?.image_url} />
                        {selectedFront ? (
                          <>
                            <SummaryRow label="Front End" value={selectedFront.name} imageUrl={selectedFront.image_url} price={selectedFront.price} />
                            {selectedFrontSub && (
                              <SummaryRow label="Front End Option" value={selectedFrontSub.name} imageUrl={selectedFrontSub.image_url} price={selectedFrontSub.price} />
                            )}
                          </>
                        ) : (
                          <SummaryRow label="Front End" value="—" />
                        )}
                        <SummaryRow label="Back End" value={selectedBack?.name} imageUrl={selectedBack?.image_url} price={selectedBack?.price} />
                        <SummaryRow label="Deck Type" value={selectedDeck?.name || 'None'} imageUrl={selectedDeck?.image_url} price={selectedDeck?.price} />
                        {selectedUnderCarriage ? (
                          <>
                            <SummaryRow label="Under Carriage" value={selectedUnderCarriage.name} imageUrl={selectedUnderCarriage.image_url} price={selectedUnderCarriage.price} />
                            {selectedUnderCarriageSub && (
                              <SummaryRow label="Under Carriage Option" value={selectedUnderCarriageSub.name} imageUrl={selectedUnderCarriageSub.image_url} price={selectedUnderCarriageSub.price} />
                            )}
                            {selectedUnderCarriageTier3 && (
                              <SummaryRow label="Under Carriage Detail" value={selectedUnderCarriageTier3.name} imageUrl={selectedUnderCarriageTier3.image_url} price={selectedUnderCarriageTier3.price} />
                            )}
                          </>
                        ) : (
                          <SummaryRow label="Under Carriage" value="None" />
                        )}
                      </div>
                      <div className="border-t pt-4 flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Price</span>
                        <span className="text-2xl font-bold text-primary">
                          ${(matchedAssembly?.total_price ?? totalPrice).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <StickyNote className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Configuration Notes</span>
                      </div>
                      <Textarea
                        placeholder="Add any notes about this configuration..."
                        value={configNotes}
                        onChange={(e) => setConfigNotes(e.target.value)}
                        rows={3}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving} className="flex-1" size="lg">
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleDownloadPdf}>
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < 5 && (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
          >
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, imageUrl, price }: { label: string; value?: string; imageUrl?: string | null; price?: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={value} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm truncate">{value || '—'}</p>
      </div>
      {price !== undefined && price > 0 && (
        <span className="text-sm font-medium text-muted-foreground">${price.toFixed(2)}</span>
      )}
    </div>
  );
}
