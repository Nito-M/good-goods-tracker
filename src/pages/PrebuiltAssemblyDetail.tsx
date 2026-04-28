import { useMemo } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Link as LinkIcon, Package } from 'lucide-react';
import {
  usePrebuiltAssemblies,
  useTrailerTypes,
  useAssemblyComponents,
  useTrailerLengths,
} from '@/hooks/useTrailerConfig';
import { useAssemblies } from '@/hooks/useAssemblies';

export function PrebuiltAssemblyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { assemblies, loading } = usePrebuiltAssemblies();
  const { types } = useTrailerTypes();
  const { components } = useAssemblyComponents();
  const { lengths } = useTrailerLengths();
  const { assemblies: allAssemblies } = useAssemblies();

  const prebuilt = useMemo(() => assemblies.find(a => a.id === id), [assemblies, id]);

  const trailerType = types.find(t => t.id === prebuilt?.trailer_type_id);
  const length = lengths.find(l => l.id === prebuilt?.trailer_length_id);
  const findComp = (cid: string | null | undefined) =>
    cid ? components.find(c => c.id === cid) : undefined;

  const linkedAssembly = useMemo(
    () => allAssemblies.find(a => a.id === (prebuilt as any)?.linked_assembly_id),
    [allAssemblies, prebuilt],
  );

  if (loading) {
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

  const pAny = prebuilt as any;

  const componentRows: { label: string; comp: ReturnType<typeof findComp> }[] = [
    { label: 'Front End', comp: findComp(prebuilt.front_end_id) },
    { label: 'Front End — Tier 2', comp: findComp(pAny.front_end_tier2_id) },
    { label: 'Back End', comp: findComp(prebuilt.back_end_id) },
    { label: 'Add Ons', comp: findComp(prebuilt.deck_type_id) },
    { label: 'Under Carriage', comp: findComp(pAny.under_carriage_id) },
    { label: 'Under Carriage — Tier 2', comp: findComp(pAny.under_carriage_tier2_id) },
    { label: 'Under Carriage — Tier 3', comp: findComp(pAny.under_carriage_tier3_id) },
  ].filter(r => !!r.comp);

  const componentSubtotal = componentRows.reduce(
    (sum, r) => sum + Number(r.comp?.price || 0),
    0,
  );

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
          <p className="text-muted-foreground text-sm">
            {length?.label ? `${length.label} • ` : ''}
            {pAny.under_carriage_axle_count ? `${pAny.under_carriage_axle_count} Axles` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">Total Price</p>
          <p className="text-3xl font-bold text-primary">
            ${Number(prebuilt.total_price).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Configuration Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Trailer Type" value={trailerType?.name || '—'} />
            <Row label="Length" value={length?.label || '—'} />
            <Row label="Axles" value={pAny.under_carriage_axle_count ? String(pAny.under_carriage_axle_count) : '—'} />
            <Separator />
            <Row label="Front End" value={findComp(prebuilt.front_end_id)?.name || '—'} />
            <Row label="FE Tier 2" value={findComp(pAny.front_end_tier2_id)?.name || '—'} />
            <Row label="Back End" value={findComp(prebuilt.back_end_id)?.name || '—'} />
            <Row label="Add Ons" value={findComp(prebuilt.deck_type_id)?.name || '—'} />
            <Row label="Under Carriage" value={findComp(pAny.under_carriage_id)?.name || '—'} />
            <Row label="UC Tier 2" value={findComp(pAny.under_carriage_tier2_id)?.name || '—'} />
            <Row label="UC Tier 3" value={findComp(pAny.under_carriage_tier3_id)?.name || '—'} />
            <Separator />
            <Row
              label="Linked Assembly"
              value={
                linkedAssembly ? (
                  <RouterLink
                    to={`/assemblies/${encodeURIComponent(linkedAssembly.type || '')}?id=${linkedAssembly.id}`}
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {linkedAssembly.name}
                  </RouterLink>
                ) : (
                  '—'
                )
              }
            />
          </CardContent>
        </Card>

        {/* Components Detail */}
        <Card className="lg:col-span-2">
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
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
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
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default PrebuiltAssemblyDetail;
