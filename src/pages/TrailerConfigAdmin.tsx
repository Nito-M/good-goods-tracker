import { useState, useRef } from 'react';
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
import { useTrailerImageUpload } from '@/hooks/useTrailerImageUpload';
import { Plus, Trash2, Package, Upload, Loader2, Pencil, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  front_end: 'Front End',
  back_end: 'Back End',
  deck_type: 'Deck Type',
};

function ImageUploadField({ imageUrl, onImageChange, uploading }: { imageUrl: string; onImageChange: (url: string) => void; uploading: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload } = useTrailerImageUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    const url = await upload(file);
    if (url) onImageChange(url);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  return (
    <div className="space-y-1">
      <Label>Image</Label>
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-md border-2 border-dashed transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-transparent'
        )}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {imageUrl ? (
          <div className="h-12 w-12 rounded bg-muted overflow-hidden shrink-0">
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          {imageUrl ? 'Change' : 'Upload'}
        </Button>
        {!imageUrl && !uploading && (
          <span className="text-xs text-muted-foreground">or drag & drop</span>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>
    </div>
  );
}

function InlineImageUpload({ imageUrl, onImageChange }: { imageUrl: string | null; onImageChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useTrailerImageUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    const url = await upload(file);
    if (url) onImageChange(url);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  return (
    <div
      className={cn(
        'h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all',
        dragOver && 'ring-2 ring-primary ring-offset-1'
      )}
      onClick={() => fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {uploading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : imageUrl ? (
        <>
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload className="h-3 w-3 text-white" />
          </div>
        </>
      ) : (
        <Package className="h-4 w-4 text-muted-foreground group-hover:hidden" />
      )}
      {!uploading && !imageUrl && (
        <Upload className="h-4 w-4 text-muted-foreground hidden group-hover:block" />
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}

export function TrailerConfigAdmin() {
  const { types, loading: typesLoading, create: createType, update: updateType, remove: removeType } = useTrailerTypes();
  const { components, loading: compsLoading, create: createComp, update: updateComp, remove: removeComp } = useAssemblyComponents();
  const { assemblies, loading: assembliesLoading, save: saveAssembly, update: updateAssembly, remove: removeAssembly } = usePrebuiltAssemblies();

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
          <TrailerTypesTab types={types} loading={typesLoading} onCreate={createType} onUpdate={updateType} onRemove={removeType} />
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <ComponentsTab components={components} types={types} loading={compsLoading} onCreate={createComp} onUpdate={updateComp} onRemove={removeComp} />
        </TabsContent>

        <TabsContent value="prebuilt" className="mt-4">
          <PrebuiltTab assemblies={assemblies} types={types} components={components} loading={assembliesLoading} onSave={saveAssembly} onUpdate={updateAssembly} onRemove={removeAssembly} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Trailer Types Tab ---
function TrailerTypesTab({
  types, loading, onCreate, onUpdate, onRemove,
}: {
  types: ReturnType<typeof useTrailerTypes>['types'];
  loading: boolean;
  onCreate: (name: string, image_url?: string) => Promise<any>;
  onUpdate: (id: string, updates: { name?: string; image_url?: string | null }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { uploading } = useTrailerImageUpload();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onCreate(name.trim(), imageUrl || undefined);
    setName('');
    setImageUrl('');
  };

  const startEdit = (t: typeof types[0]) => {
    setEditingId(t.id);
    setEditName(t.name);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdate(id, { name: editName.trim() });
    setEditingId(null);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Trailer Types</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Flatbed, Enclosed" />
          </div>
          <ImageUploadField imageUrl={imageUrl} onImageChange={setImageUrl} uploading={uploading} />
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
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <InlineImageUpload imageUrl={t.image_url} onImageChange={(url) => onUpdate(t.id, { image_url: url })} />
                  </TableCell>
                  <TableCell>
                    {editingId === t.id ? (
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(t.id); if (e.key === 'Escape') setEditingId(null); }} autoFocus />
                    ) : (
                      <span className="font-medium">{t.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingId === t.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => saveEdit(t.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onRemove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </div>
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
  components, types, loading, onCreate, onUpdate, onRemove,
}: {
  components: ReturnType<typeof useAssemblyComponents>['components'];
  types: ReturnType<typeof useTrailerTypes>['types'];
  loading: boolean;
  onCreate: (comp: { name: string; category: string; image_url?: string; price?: number; compatible_trailer_type_ids?: string[] }) => Promise<any>;
  onUpdate: (id: string, updates: { name?: string; image_url?: string | null; price?: number; compatible_trailer_type_ids?: string[] }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('front_end');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [compatibleIds, setCompatibleIds] = useState<string[]>([]);
  const { uploading } = useTrailerImageUpload();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCompatibleIds, setEditCompatibleIds] = useState<string[]>([]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onCreate({
      name: name.trim(),
      category,
      image_url: imageUrl || undefined,
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

  const startEdit = (c: typeof components[0]) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditPrice(String(c.price));
    setEditCompatibleIds([...c.compatible_trailer_type_ids]);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdate(id, { name: editName.trim(), price: parseFloat(editPrice) || 0, compatible_trailer_type_ids: editCompatibleIds });
    setEditingId(null);
  };

  const toggleEditCompatible = (id: string) => {
    setEditCompatibleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Assembly Components</CardTitle></CardHeader>
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
          <ImageUploadField imageUrl={imageUrl} onImageChange={setImageUrl} uploading={uploading} />
        </div>

        {types.length > 0 && (
          <div className="space-y-2">
            <Label>Compatible Trailer Types</Label>
            <div className="flex flex-wrap gap-3">
              {types.map(t => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={compatibleIds.includes(t.id)} onCheckedChange={() => toggleCompatible(t.id)} />
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
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <InlineImageUpload imageUrl={c.image_url} onImageChange={(url) => onUpdate(c.id, { image_url: url })} />
                  </TableCell>
                  <TableCell>
                    {editingId === c.id ? (
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8" autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditingId(null); }} />
                    ) : (
                      <span className="font-medium">{c.name}</span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{CATEGORY_LABELS[c.category] || c.category}</Badge></TableCell>
                  <TableCell>
                    {editingId === c.id ? (
                      <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="h-8 w-24" />
                    ) : (
                      <span>${Number(c.price).toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === c.id ? (
                      <div className="flex flex-wrap gap-2">
                        {types.map(t => (
                          <label key={t.id} className="flex items-center gap-1 text-xs cursor-pointer">
                            <Checkbox checked={editCompatibleIds.includes(t.id)} onCheckedChange={() => toggleEditCompatible(t.id)} />
                            {t.name}
                          </label>
                        ))}
                      </div>
                    ) : c.compatible_trailer_type_ids.length === 0 ? (
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
                    <div className="flex gap-1">
                      {editingId === c.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => saveEdit(c.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onRemove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </div>
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
  assemblies, types, components, loading, onSave, onUpdate, onRemove,
}: {
  assemblies: ReturnType<typeof usePrebuiltAssemblies>['assemblies'];
  types: ReturnType<typeof useTrailerTypes>['types'];
  components: ReturnType<typeof useAssemblyComponents>['components'];
  loading: boolean;
  onSave: (config: any) => Promise<any>;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [trailerTypeId, setTrailerTypeId] = useState('');
  const [frontEndId, setFrontEndId] = useState('');
  const [backEndId, setBackEndId] = useState('');
  const [deckTypeId, setDeckTypeId] = useState('');
  const [totalPrice, setTotalPrice] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFrontEndId, setEditFrontEndId] = useState('');
  const [editBackEndId, setEditBackEndId] = useState('');
  const [editDeckTypeId, setEditDeckTypeId] = useState('');
  const [editTotalPrice, setEditTotalPrice] = useState('');

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

  const startEdit = (a: typeof assemblies[0]) => {
    setEditingId(a.id);
    setEditFrontEndId(a.front_end_id || 'none');
    setEditBackEndId(a.back_end_id || 'none');
    setEditDeckTypeId(a.deck_type_id || 'none');
    setEditTotalPrice(String(a.total_price));
  };

  const saveEdit = async (id: string) => {
    await onUpdate(id, {
      front_end_id: editFrontEndId && editFrontEndId !== 'none' ? editFrontEndId : null,
      back_end_id: editBackEndId && editBackEndId !== 'none' ? editBackEndId : null,
      deck_type_id: editDeckTypeId && editDeckTypeId !== 'none' ? editDeckTypeId : null,
      total_price: parseFloat(editTotalPrice) || 0,
    });
    setEditingId(null);
  };

  const getName = (id: string | null, list: { id: string; name: string }[]) => {
    if (!id) return '—';
    return list.find(x => x.id === id)?.name || 'Unknown';
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Prebuilt Assemblies</CardTitle></CardHeader>
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
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assemblies.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{getName(a.trailer_type_id, types)}</TableCell>
                  <TableCell>
                    {editingId === a.id ? (
                      <Select value={editFrontEndId} onValueChange={setEditFrontEndId}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {frontEnds.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : getName(a.front_end_id, components)}
                  </TableCell>
                  <TableCell>
                    {editingId === a.id ? (
                      <Select value={editBackEndId} onValueChange={setEditBackEndId}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {backEnds.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : getName(a.back_end_id, components)}
                  </TableCell>
                  <TableCell>
                    {editingId === a.id ? (
                      <Select value={editDeckTypeId} onValueChange={setEditDeckTypeId}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {deckTypes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : getName(a.deck_type_id, components)}
                  </TableCell>
                  <TableCell>
                    {editingId === a.id ? (
                      <Input type="number" value={editTotalPrice} onChange={e => setEditTotalPrice(e.target.value)} className="h-8 w-24" />
                    ) : (
                      <span>${Number(a.total_price).toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingId === a.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => saveEdit(a.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onRemove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </div>
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
