import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTrailerTypes, useAssemblyComponents, usePrebuiltAssemblies } from '@/hooks/useTrailerConfig';
import { Plus, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_LABELS: Record<string, string> = {
  front_end: 'Front End',
  back_end: 'Back End',
  deck_type: 'Deck Type',
};

export function TrailerConfigAdmin() {
  const { types, loading: typesLoading, create: createType, remove: removeType } = useTrailerTypes();
  const { components, loading: compsLoading, create: createComp, remove: removeComp } = useAssemblyComponents();
  const { assemblies, loading: assembliesLoading, save: saveAssembly, remove: removeAssembly } = usePrebuiltAssemblies();

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Trailer Configuration Admin</h1>

      <Tabs defaultValue="trailer_types">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trailer_types">Trailer Types</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="prebuilt">Prebuilt Assemblies</TabsTrigger>
        </TabsList>

        <TabsContent value="trailer_types" className="mt-4">
          <TrailerTypesTab
            types={types}
            loading={typesLoading}
            onCreate={createType}
            onRemove={removeType}
          />
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <ComponentsTab
            components={components}
            types={types}
            loading={compsLoading}
            onCreate={createComp}
            onRemove={removeComp}
          />
        </TabsContent>

        <TabsContent value="prebuilt" className="mt-4">
          <PrebuiltTab
            assemblies={assemblies}
            types={types}
            components={components}
            loading={assembliesLoading}
            onSave={saveAssembly}
            onRemove={removeAssembly}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Trailer Types Tab ---
function TrailerTypesTab({
  types,
  loading,
  onCreate,
  onRemove,
}: {
  types: ReturnType<typeof useTrailerTypes>['types'];
  loading: boolean;
  onCreate: (name: string, image_url?: string) => Promise<any>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onCreate(name.trim(), imageUrl.trim() || undefined);
    setName('');
    setImageUrl('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trailer Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Flatbed, Enclosed" />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Image URL (optional)</Label>
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button onClick={handleAdd} disabled={!name.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : types.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No trailer types yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {t.image_url ? <img src={t.image_url} alt={t.name} className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- Components Tab ---
function ComponentsTab({
  components,
  types,
  loading,
  onCreate,
  onRemove,
}: {
  components: ReturnType<typeof useAssemblyComponents>['components'];
  types: ReturnType<typeof useTrailerTypes>['types'];
  loading: boolean;
  onCreate: (comp: { name: string; category: string; image_url?: string; price?: number; compatible_trailer_type_ids?: string[] }) => Promise<any>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('front_end');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [compatibleIds, setCompatibleIds] = useState<string[]>([]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onCreate({
      name: name.trim(),
      category,
      image_url: imageUrl.trim() || undefined,
      price: parseFloat(price) || 0,
      compatible_trailer_type_ids: compatibleIds,
    });
    setName('');
    setImageUrl('');
    setPrice('');
    setCompatibleIds([]);
  };

  const toggleCompatible = (id: string) => {
    setCompatibleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assembly Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. V-Nose Front" />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="front_end">Front End</SelectItem>
                <SelectItem value="back_end">Back End</SelectItem>
                <SelectItem value="deck_type">Deck Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Price</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <Label>Image URL (optional)</Label>
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {types.length > 0 && (
          <div className="space-y-2">
            <Label>Compatible Trailer Types</Label>
            <div className="flex flex-wrap gap-3">
              {types.map(t => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={compatibleIds.includes(t.id)}
                    onCheckedChange={() => toggleCompatible(t.id)}
                  />
                  {t.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Leave empty = compatible with all types</p>
          </div>
        )}

        <Button onClick={handleAdd} disabled={!name.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add Component
        </Button>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : components.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No components yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Compatible With</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {c.image_url ? <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="secondary">{CATEGORY_LABELS[c.category] || c.category}</Badge></TableCell>
                  <TableCell>${Number(c.price).toFixed(2)}</TableCell>
                  <TableCell>
                    {c.compatible_trailer_type_ids.length === 0 ? (
                      <span className="text-xs text-muted-foreground">All</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.compatible_trailer_type_ids.map(tid => {
                          const t = types.find(x => x.id === tid);
                          return <Badge key={tid} variant="outline" className="text-xs">{t?.name || 'Unknown'}</Badge>;
                        })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- Prebuilt Assemblies Tab ---
function PrebuiltTab({
  assemblies,
  types,
  components,
  loading,
  onSave,
  onRemove,
}: {
  assemblies: ReturnType<typeof usePrebuiltAssemblies>['assemblies'];
  types: ReturnType<typeof useTrailerTypes>['types'];
  components: ReturnType<typeof useAssemblyComponents>['components'];
  loading: boolean;
  onSave: (config: any) => Promise<any>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [trailerTypeId, setTrailerTypeId] = useState('');
  const [frontEndId, setFrontEndId] = useState('');
  const [backEndId, setBackEndId] = useState('');
  const [deckTypeId, setDeckTypeId] = useState('');
  const [totalPrice, setTotalPrice] = useState('');

  const frontEnds = components.filter(c => c.category === 'front_end');
  const backEnds = components.filter(c => c.category === 'back_end');
  const deckTypes = components.filter(c => c.category === 'deck_type');

  const handleAdd = async () => {
    if (!trailerTypeId) { toast({ title: 'Required', description: 'Select a trailer type.', variant: 'destructive' }); return; }
    await onSave({
      trailer_type_id: trailerTypeId,
      front_end_id: frontEndId && frontEndId !== 'none' ? frontEndId : null,
      back_end_id: backEndId && backEndId !== 'none' ? backEndId : null,
      deck_type_id: deckTypeId && deckTypeId !== 'none' ? deckTypeId : null,
      total_price: parseFloat(totalPrice) || 0,
    });
    setTrailerTypeId('');
    setFrontEndId('');
    setBackEndId('');
    setDeckTypeId('');
    setTotalPrice('');
  };

  const getName = (id: string | null, list: { id: string; name: string }[]) => {
    if (!id) return '—';
    return list.find(x => x.id === id)?.name || 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Prebuilt Assemblies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Trailer Type *</Label>
            <Select value={trailerTypeId} onValueChange={setTrailerTypeId}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Front End</Label>
            <Select value={frontEndId} onValueChange={setFrontEndId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {frontEnds.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Back End</Label>
            <Select value={backEndId} onValueChange={setBackEndId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {backEnds.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Deck Type</Label>
            <Select value={deckTypeId} onValueChange={setDeckTypeId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {deckTypes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Total Price</Label>
            <Input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={!trailerTypeId}>
          <Plus className="h-4 w-4 mr-1" /> Add Prebuilt Assembly
        </Button>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : assemblies.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No prebuilt assemblies yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trailer Type</TableHead>
                <TableHead>Front End</TableHead>
                <TableHead>Back End</TableHead>
                <TableHead>Deck Type</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assemblies.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{getName(a.trailer_type_id, types)}</TableCell>
                  <TableCell>{getName(a.front_end_id, components)}</TableCell>
                  <TableCell>{getName(a.back_end_id, components)}</TableCell>
                  <TableCell>{getName(a.deck_type_id, components)}</TableCell>
                  <TableCell>${Number(a.total_price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
