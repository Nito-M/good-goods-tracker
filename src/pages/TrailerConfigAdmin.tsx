import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTrailerTypes, useAssemblyComponents, usePrebuiltAssemblies, useTrailerLengths, useTrailerSubtypes } from '@/hooks/useTrailerConfig';
import { useTrailerImageUpload } from '@/hooks/useTrailerImageUpload';
import { useAssemblies } from '@/hooks/useAssemblies';
import { useInventory } from '@/hooks/useInventory';
import { Plus, Trash2, Package, Upload, Loader2, Pencil, Check, X, ArrowLeft, Link, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const CATEGORY_LABELS: Record<string, string> = {
  front_end: 'Front End',
  back_end: 'Back End',
  deck_type: 'Add Ons',
  under_carriage: 'Under Carriage',
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
  const navigate = useNavigate();
  const { types, loading: typesLoading, create: createType, update: updateType, remove: removeType } = useTrailerTypes();
  const { lengths, loading: lengthsLoading, create: createLength, update: updateLength, remove: removeLength } = useTrailerLengths();
  const { subtypes, loading: subtypesLoading, create: createSubtype, update: updateSubtype, remove: removeSubtype } = useTrailerSubtypes();
  const { components, loading: compsLoading, create: createComp, update: updateComp, remove: removeComp } = useAssemblyComponents();
  const { assemblies: prebuiltAssemblies, loading: assembliesLoading, save: saveAssembly, update: updateAssembly, remove: removeAssembly } = usePrebuiltAssemblies();
  const { assemblies: allAssemblies } = useAssemblies();
  const { items: inventoryItems, getItemImageUrl } = useInventory();

  return (
    <div className="w-full mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trailer Configuration Admin</h1>
        <Button variant="outline" onClick={() => navigate('/trailer-configurator')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Configurator
        </Button>
      </div>

      <Tabs defaultValue="trailer_types">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trailer_types">Trailer Types</TabsTrigger>
          <TabsTrigger value="trailer_subtypes">Subtypes</TabsTrigger>
          <TabsTrigger value="trailer_lengths">Trailer Lengths</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="prebuilt">Prebuilt Assemblies</TabsTrigger>
        </TabsList>

        <TabsContent value="trailer_types" className="mt-4">
          <TrailerTypesTab types={types} loading={typesLoading} onCreate={createType} onUpdate={updateType} onRemove={removeType} />
        </TabsContent>

        <TabsContent value="trailer_subtypes" className="mt-4">
          <TrailerSubtypesTab subtypes={subtypes} types={types} loading={subtypesLoading} onCreate={createSubtype} onUpdate={updateSubtype} onRemove={removeSubtype} />
        </TabsContent>

        <TabsContent value="trailer_lengths" className="mt-4">
          <TrailerLengthsTab lengths={lengths} types={types} subtypes={subtypes} loading={lengthsLoading} onCreate={createLength} onUpdate={updateLength} onRemove={removeLength} />
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <ComponentsTab components={components} types={types} assemblies={allAssemblies} inventoryItems={inventoryItems} getItemImageUrl={getItemImageUrl} loading={compsLoading} onCreate={createComp} onUpdate={updateComp} onRemove={removeComp} />
        </TabsContent>

        <TabsContent value="prebuilt" className="mt-4">
          <PrebuiltTab assemblies={prebuiltAssemblies} types={types} components={components} lengths={lengths} allAssemblies={allAssemblies} loading={assembliesLoading} onSave={saveAssembly} onUpdate={updateAssembly} onRemove={removeAssembly} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Trailer Subtypes Tab ---
function TrailerSubtypesTab({
  subtypes, types, loading, onCreate, onUpdate, onRemove,
}: {
  subtypes: { id: string; name: string; image_url: string | null; trailer_type_id: string }[];
  types: { id: string; name: string }[];
  loading: boolean;
  onCreate: (name: string, trailer_type_id: string, image_url?: string) => Promise<any>;
  onUpdate: (id: string, updates: { name?: string; image_url?: string | null; trailer_type_id?: string }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { uploading } = useTrailerImageUpload();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTypeId, setEditTypeId] = useState('');

  const handleAdd = async () => {
    if (!name.trim() || !typeId) return;
    await onCreate(name.trim(), typeId, imageUrl || undefined);
    setName('');
    setTypeId('');
    setImageUrl('');
  };

  const startEdit = (s: typeof subtypes[0]) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditTypeId(s.trailer_type_id);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim() || !editTypeId) return;
    await onUpdate(id, { name: editName.trim(), trailer_type_id: editTypeId });
    setEditingId(null);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Trailer Subtypes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tilt, Fixed" />
          </div>
          <div className="min-w-[200px] space-y-1">
            <Label>Trailer Type</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ImageUploadField imageUrl={imageUrl} onImageChange={setImageUrl} uploading={uploading} />
          <Button onClick={handleAdd} disabled={!name.trim() || !typeId}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : subtypes.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No subtypes yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Trailer Type</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subtypes.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <InlineImageUpload imageUrl={s.image_url} onImageChange={(url) => onUpdate(s.id, { image_url: url })} />
                  </TableCell>
                  <TableCell>
                    {editingId === s.id ? (
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(s.id); if (e.key === 'Escape') setEditingId(null); }} autoFocus />
                    ) : (
                      <span className="font-medium">{s.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === s.id ? (
                      <Select value={editTypeId} onValueChange={setEditTypeId}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{types.find(t => t.id === s.trailer_type_id)?.name || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingId === s.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => saveEdit(s.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onRemove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

// --- Trailer Lengths Tab ---
const AXLE_OPTIONS = [2, 3, 4, 5, 6];

function TrailerLengthsTab({
  lengths, types, subtypes, loading, onCreate, onUpdate, onRemove,
}: {
  lengths: { id: string; label: string; compatible_trailer_type_ids: string[]; compatible_trailer_subtype_ids: string[]; allowed_axle_counts: number[] }[];
  types: { id: string; name: string }[];
  subtypes: { id: string; name: string; trailer_type_id: string }[];
  loading: boolean;
  onCreate: (label: string, compatible_trailer_type_ids?: string[], compatible_trailer_subtype_ids?: string[], allowed_axle_counts?: number[]) => Promise<any>;
  onUpdate: (id: string, updates: { label?: string; compatible_trailer_type_ids?: string[]; compatible_trailer_subtype_ids?: string[]; allowed_axle_counts?: number[] }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [label, setLabel] = useState('');
  const [compatibleIds, setCompatibleIds] = useState<string[]>([]);
  const [compatibleSubtypeIds, setCompatibleSubtypeIds] = useState<string[]>([]);
  const [axleCounts, setAxleCounts] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCompatibleIds, setEditCompatibleIds] = useState<string[]>([]);
  const [editCompatibleSubtypeIds, setEditCompatibleSubtypeIds] = useState<string[]>([]);
  const [editAxleCounts, setEditAxleCounts] = useState<number[]>([]);

  const relevantSubtypes = subtypes.filter(s => compatibleIds.length === 0 || compatibleIds.includes(s.trailer_type_id));
  const editRelevantSubtypes = subtypes.filter(s => editCompatibleIds.length === 0 || editCompatibleIds.includes(s.trailer_type_id));

  const handleAdd = async () => {
    if (!label.trim()) return;
    await onCreate(label.trim(), compatibleIds, compatibleSubtypeIds, axleCounts);
    setLabel('');
    setCompatibleIds([]);
    setCompatibleSubtypeIds([]);
    setAxleCounts([]);
  };

  const startEdit = (l: typeof lengths[0]) => {
    setEditingId(l.id);
    setEditLabel(l.label);
    setEditCompatibleIds([...l.compatible_trailer_type_ids]);
    setEditCompatibleSubtypeIds([...(l.compatible_trailer_subtype_ids || [])]);
    setEditAxleCounts([...(l.allowed_axle_counts || [])]);
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    await onUpdate(id, { label: editLabel.trim(), compatible_trailer_type_ids: editCompatibleIds, compatible_trailer_subtype_ids: editCompatibleSubtypeIds, allowed_axle_counts: editAxleCounts });
    setEditingId(null);
  };

  const toggleCompatible = (id: string) => {
    setCompatibleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleEditCompatible = (id: string) => {
    setEditCompatibleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSubtypeCompatible = (id: string) => {
    setCompatibleSubtypeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleEditSubtypeCompatible = (id: string) => {
    setEditCompatibleSubtypeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAxle = (n: number) => {
    setAxleCounts(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b));
  };

  const toggleEditAxle = (n: number) => {
    setEditAxleCounts(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b));
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Trailer Lengths</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-1">
            <Label>Length Label</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. 16ft, 20ft, 24ft" />
          </div>
          <div className="space-y-1">
            <Label>Compatible Trailer Types</Label>
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <label key={t.id} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={compatibleIds.includes(t.id)}
                    onCheckedChange={() => toggleCompatible(t.id)}
                  />
                  {t.name}
                </label>
              ))}
              {types.length === 0 && <span className="text-xs text-muted-foreground">Add trailer types first</span>}
            </div>
          </div>
          {relevantSubtypes.length > 0 && (
            <div className="space-y-1">
              <Label>Compatible Subtypes <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <div className="flex flex-wrap gap-2">
                {relevantSubtypes.map(s => (
                  <label key={s.id} className="flex items-center gap-1.5 text-sm">
                    <Checkbox
                      checked={compatibleSubtypeIds.includes(s.id)}
                      onCheckedChange={() => toggleSubtypeCompatible(s.id)}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label>Allowed Axles <span className="text-xs text-muted-foreground">(empty = all)</span></Label>
            <div className="flex flex-wrap gap-2">
              {AXLE_OPTIONS.map(n => (
                <label key={n} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={axleCounts.includes(n)} onCheckedChange={() => toggleAxle(n)} />
                  {n}
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!label.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : lengths.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No trailer lengths yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Compatible Types</TableHead>
                <TableHead>Compatible Subtypes</TableHead>
                <TableHead>Allowed Axles</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lengths.map(l => (
                <TableRow key={l.id}>
                  <TableCell>
                    {editingId === l.id ? (
                      <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(l.id); if (e.key === 'Escape') setEditingId(null); }} autoFocus />
                    ) : (
                      <span className="font-medium">{l.label}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === l.id ? (
                      <div className="flex flex-wrap gap-2">
                        {types.map(t => (
                          <label key={t.id} className="flex items-center gap-1.5 text-sm">
                            <Checkbox
                              checked={editCompatibleIds.includes(t.id)}
                              onCheckedChange={() => toggleEditCompatible(t.id)}
                            />
                            {t.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {l.compatible_trailer_type_ids.length === 0 ? (
                          <Badge variant="secondary">All Types</Badge>
                        ) : (
                          l.compatible_trailer_type_ids.map(tid => {
                            const t = types.find(x => x.id === tid);
                            return t ? <Badge key={tid} variant="outline">{t.name}</Badge> : null;
                          })
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === l.id ? (
                      <div className="flex flex-wrap gap-2">
                        {editRelevantSubtypes.map(s => (
                          <label key={s.id} className="flex items-center gap-1.5 text-sm">
                            <Checkbox
                              checked={editCompatibleSubtypeIds.includes(s.id)}
                              onCheckedChange={() => toggleEditSubtypeCompatible(s.id)}
                            />
                            {s.name}
                          </label>
                        ))}
                        {editRelevantSubtypes.length === 0 && <span className="text-xs text-muted-foreground">No subtypes</span>}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(l.compatible_trailer_subtype_ids || []).length === 0 ? (
                          <Badge variant="secondary">All</Badge>
                        ) : (
                          (l.compatible_trailer_subtype_ids || []).map(sid => {
                            const s = subtypes.find(x => x.id === sid);
                            return s ? <Badge key={sid} variant="outline">{s.name}</Badge> : null;
                          })
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === l.id ? (
                      <div className="flex flex-wrap gap-2">
                        {AXLE_OPTIONS.map(n => (
                          <label key={n} className="flex items-center gap-1.5 text-sm">
                            <Checkbox checked={editAxleCounts.includes(n)} onCheckedChange={() => toggleEditAxle(n)} />
                            {n}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(l.allowed_axle_counts || []).length === 0 ? (
                          <Badge variant="secondary">All</Badge>
                        ) : (
                          (l.allowed_axle_counts || []).map(n => (
                            <Badge key={n} variant="outline">{n}</Badge>
                          ))
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingId === l.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => saveEdit(l.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(l)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onRemove(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
  components, types, assemblies, inventoryItems, getItemImageUrl, loading, onCreate, onUpdate, onRemove,
}: {
  components: ReturnType<typeof useAssemblyComponents>['components'];
  types: ReturnType<typeof useTrailerTypes>['types'];
  assemblies: { id: string; name: string }[];
  inventoryItems: { id: string; name: string; imageUrl?: string | null; price: number; sku: string }[];
  getItemImageUrl: (imagePath: string | null | undefined) => Promise<string | null>;
  loading: boolean;
  onCreate: (comp: { name: string; category: string; image_url?: string; price?: number; compatible_trailer_type_ids?: string[]; assembly_id?: string; parent_component_id?: string }) => Promise<any>;
  onUpdate: (id: string, updates: { name?: string; image_url?: string | null; price?: number; compatible_trailer_type_ids?: string[]; assembly_id?: string | null; parent_component_id?: string | null }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('front_end');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [compatibleIds, setCompatibleIds] = useState<string[]>([]);
  const [assemblyId, setAssemblyId] = useState('');
  const [parentComponentId, setParentComponentId] = useState('');
  const [selectedStep, setSelectedStep] = useState('1');
  const [inventorySearch, setInventorySearch] = useState('');
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const { uploading } = useTrailerImageUpload();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCompatibleIds, setEditCompatibleIds] = useState<string[]>([]);
  const [editAssemblyId, setEditAssemblyId] = useState('');
  const [editParentComponentId, setEditParentComponentId] = useState('');
  const [editStep, setEditStep] = useState('1');
  // Helper: get components of a category at a specific tier
  const getComponentsByStep = (cat: string, stepNum: number) => {
    if (stepNum === 1) return components.filter(c => c.category === cat && !c.parent_component_id);
    if (stepNum === 2) {
      const roots = components.filter(c => c.category === cat && !c.parent_component_id);
      return components.filter(c => c.category === cat && c.parent_component_id && roots.some(r => r.id === c.parent_component_id));
    }
    return [];
  };

  // Possible parents based on selected step
  const possibleParents = useMemo(() => {
    if (selectedStep === '2') return getComponentsByStep(category, 1);
    if (selectedStep === '3') return getComponentsByStep(category, 2);
    return [];
  }, [components, category, selectedStep]);

  const editPossibleParents = useMemo(() => {
    if (!editingId) return [];
    const editComp = components.find(c => c.id === editingId);
    if (!editComp) return [];
    if (editStep === '2') return getComponentsByStep(editComp.category, 1);
    if (editStep === '3') return getComponentsByStep(editComp.category, 2);
    return [];
  }, [components, editingId, editStep]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onCreate({
      name: name.trim(),
      category,
      image_url: imageUrl || undefined,
      price: parseFloat(price) || 0,
      compatible_trailer_type_ids: compatibleIds,
      assembly_id: assemblyId && assemblyId !== 'none' ? assemblyId : undefined,
      parent_component_id: selectedStep !== '1' && parentComponentId && parentComponentId !== 'none' ? parentComponentId : undefined,
    });
    setName('');
    setImageUrl('');
    setPrice('');
    setCompatibleIds([]);
    setAssemblyId('');
    setParentComponentId('');
    setSelectedStep('1');
  };

  const toggleCompatible = (id: string) => {
    setCompatibleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const startEdit = (c: typeof components[0]) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditPrice(String(c.price));
    setEditCompatibleIds([...c.compatible_trailer_type_ids]);
    setEditAssemblyId((c as any).assembly_id || 'none');
    setEditParentComponentId(c.parent_component_id || 'none');
    // Determine step from parent chain
    if (!c.parent_component_id) {
      setEditStep('1');
    } else {
      const parent = components.find(p => p.id === c.parent_component_id);
      if (parent && !parent.parent_component_id) {
        setEditStep('2');
      } else {
        setEditStep('3');
      }
    }
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdate(id, {
      name: editName.trim(),
      price: parseFloat(editPrice) || 0,
      compatible_trailer_type_ids: editCompatibleIds,
      assembly_id: editAssemblyId && editAssemblyId !== 'none' ? editAssemblyId : null,
      parent_component_id: editParentComponentId && editParentComponentId !== 'none' ? editParentComponentId : null,
    });
    setEditingId(null);
  };

  const toggleEditCompatible = (id: string) => {
    setEditCompatibleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredInventory = useMemo(() => {
    if (!inventorySearch.trim()) return inventoryItems.slice(0, 20);
    const q = inventorySearch.toLowerCase();
    return inventoryItems.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)).slice(0, 20);
  }, [inventoryItems, inventorySearch]);

  const importFromInventory = async (item: typeof inventoryItems[0]) => {
    setName(item.name);
    setPrice(String(item.price));
    if (item.imageUrl) {
      const resolvedUrl = await getItemImageUrl(item.imageUrl);
      if (resolvedUrl) setImageUrl(resolvedUrl);
    }
    setShowInventoryPicker(false);
    setInventorySearch('');
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Assembly Components</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* Import from Inventory */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={showInventoryPicker ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowInventoryPicker(!showInventoryPicker)}
            >
              <Search className="h-4 w-4 mr-1" /> Import from Inventory
            </Button>
            {showInventoryPicker && (
              <span className="text-xs text-muted-foreground">Select an item to auto-fill name, image & price</span>
            )}
          </div>
          {showInventoryPicker && (
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <Input
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
                placeholder="Search by name or SKU..."
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredInventory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No items found</p>
                ) : (
                  filteredInventory.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => importFromInventory(item)}
                    >
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </div>
                      <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
                <SelectItem value="deck_type">Add Ons</SelectItem>
                <SelectItem value="under_carriage">Under Carriage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Price</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
          </div>
          <ImageUploadField imageUrl={imageUrl} onImageChange={setImageUrl} uploading={uploading} />
          <div className="space-y-1">
            <Label>Linked Assembly</Label>
            <Select value={assemblyId} onValueChange={setAssemblyId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {assemblies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Step / Tier</Label>
            <Select value={selectedStep} onValueChange={(v) => { setSelectedStep(v); setParentComponentId(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Step 1 (Root)</SelectItem>
                <SelectItem value="2">Step 2 (Sub-option)</SelectItem>
                <SelectItem value="3">Step 3 (Detail)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedStep !== '1' && possibleParents.length > 0 && (
            <div className="space-y-1">
              <Label>Parent Component ({selectedStep === '2' ? 'Step 1' : 'Step 2'})</Label>
              <Select value={parentComponentId} onValueChange={setParentComponentId}>
                <SelectTrigger><SelectValue placeholder="Select parent..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {possibleParents.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
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
                 <TableHead>Assembly</TableHead>
                 <TableHead>Step</TableHead>
                 <TableHead>Parent</TableHead>
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
                     {editingId === c.id ? (
                       <Select value={editAssemblyId} onValueChange={setEditAssemblyId}>
                         <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">None</SelectItem>
                           {assemblies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     ) : (c as any).assembly_id ? (
                       <div className="flex items-center gap-1">
                         <Link className="h-3 w-3 text-muted-foreground" />
                         <span className="text-sm">{assemblies.find(a => a.id === (c as any).assembly_id)?.name || 'Unknown'}</span>
                       </div>
                     ) : (
                       <span className="text-xs text-muted-foreground">—</span>
                     )}
                   </TableCell>
                   <TableCell>
                     {editingId === c.id ? (
                       <Select value={editStep} onValueChange={(v) => { setEditStep(v); setEditParentComponentId('none'); }}>
                         <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="1">1</SelectItem>
                           <SelectItem value="2">2</SelectItem>
                           <SelectItem value="3">3</SelectItem>
                         </SelectContent>
                       </Select>
                     ) : (
                       <Badge variant="outline" className="text-xs">
                         {!c.parent_component_id ? 'Step 1' : (() => {
                           const parent = components.find(p => p.id === c.parent_component_id);
                           return parent && !parent.parent_component_id ? 'Step 2' : 'Step 3';
                         })()}
                       </Badge>
                     )}
                   </TableCell>
                   <TableCell>
                     {editingId === c.id && editStep !== '1' ? (
                       <Select value={editParentComponentId} onValueChange={setEditParentComponentId}>
                         <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">None</SelectItem>
                           {editPossibleParents.filter(p => p.id !== c.id).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     ) : c.parent_component_id ? (
                       <Badge variant="outline" className="text-xs">{components.find(x => x.id === c.parent_component_id)?.name || 'Unknown'}</Badge>
                     ) : (
                       <span className="text-xs text-muted-foreground">—</span>
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
  assemblies, types, components, lengths, allAssemblies, loading, onSave, onUpdate, onRemove,
}: {
  assemblies: ReturnType<typeof usePrebuiltAssemblies>['assemblies'];
  types: ReturnType<typeof useTrailerTypes>['types'];
  components: ReturnType<typeof useAssemblyComponents>['components'];
  lengths: ReturnType<typeof useTrailerLengths>['lengths'];
  allAssemblies: ReturnType<typeof useAssemblies>['assemblies'];
  loading: boolean;
  onSave: (config: any) => Promise<any>;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [trailerTypeId, setTrailerTypeId] = useState('');
  const [trailerLengthId, setTrailerLengthId] = useState('');
  const [frontEndId, setFrontEndId] = useState('');
  const [frontEndTier2Id, setFrontEndTier2Id] = useState('');
  const [backEndId, setBackEndId] = useState('');
  const [deckTypeId, setDeckTypeId] = useState('');
  const [underCarriageId, setUnderCarriageId] = useState('');
  const [underCarriageTier2Id, setUnderCarriageTier2Id] = useState('');
  const [underCarriageTier3Id, setUnderCarriageTier3Id] = useState('');
  const [underCarriageAxleCount, setUnderCarriageAxleCount] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [linkedAssemblyId, setLinkedAssemblyId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTrailerLengthId, setEditTrailerLengthId] = useState('');
  const [editFrontEndId, setEditFrontEndId] = useState('');
  const [editFrontEndTier2Id, setEditFrontEndTier2Id] = useState('');
  const [editBackEndId, setEditBackEndId] = useState('');
  const [editDeckTypeId, setEditDeckTypeId] = useState('');
  const [editUnderCarriageId, setEditUnderCarriageId] = useState('');
  const [editUnderCarriageTier2Id, setEditUnderCarriageTier2Id] = useState('');
  const [editUnderCarriageTier3Id, setEditUnderCarriageTier3Id] = useState('');
  const [editUnderCarriageAxleCount, setEditUnderCarriageAxleCount] = useState('');
  const [editTotalPrice, setEditTotalPrice] = useState('');
  const [editLinkedAssemblyId, setEditLinkedAssemblyId] = useState('');

  const sortedAssemblies = useMemo(() => {
    return [...allAssemblies].sort((a, b) => {
      const t = (a.type || '').localeCompare(b.type || '');
      return t !== 0 ? t : a.name.localeCompare(b.name);
    });
  }, [allAssemblies]);

  // Helper to get components by category and tier
  const getByStep = (cat: string, step: number) => {
    if (step === 1) return components.filter(c => c.category === cat && !c.parent_component_id);
    if (step === 2) {
      const roots = components.filter(c => c.category === cat && !c.parent_component_id);
      return components.filter(c => c.category === cat && c.parent_component_id && roots.some(r => r.id === c.parent_component_id));
    }
    if (step === 3) {
      const roots = components.filter(c => c.category === cat && !c.parent_component_id);
      const tier2 = components.filter(c => c.category === cat && c.parent_component_id && roots.some(r => r.id === c.parent_component_id));
      return components.filter(c => c.category === cat && c.parent_component_id && tier2.some(t => t.id === c.parent_component_id));
    }
    return [];
  };

  const frontEndStep1 = getByStep('front_end', 1);
  const frontEndStep2 = useMemo(() => {
    const id = frontEndId && frontEndId !== 'none' ? frontEndId : null;
    return id ? getByStep('front_end', 2).filter(c => c.parent_component_id === id) : [];
  }, [components, frontEndId]);

  const ucStep1 = getByStep('under_carriage', 1);
  const ucStep2 = useMemo(() => {
    const id = underCarriageId && underCarriageId !== 'none' ? underCarriageId : null;
    return id ? getByStep('under_carriage', 2).filter(c => c.parent_component_id === id) : [];
  }, [components, underCarriageId]);
  const ucStep3 = useMemo(() => {
    const id = underCarriageTier2Id && underCarriageTier2Id !== 'none' ? underCarriageTier2Id : null;
    return id ? getByStep('under_carriage', 3).filter(c => c.parent_component_id === id) : [];
  }, [components, underCarriageTier2Id]);

  // Edit versions
  const editFrontEndStep2 = useMemo(() => {
    const id = editFrontEndId && editFrontEndId !== 'none' ? editFrontEndId : null;
    return id ? getByStep('front_end', 2).filter(c => c.parent_component_id === id) : [];
  }, [components, editFrontEndId]);

  const editUcStep2 = useMemo(() => {
    const id = editUnderCarriageId && editUnderCarriageId !== 'none' ? editUnderCarriageId : null;
    return id ? getByStep('under_carriage', 2).filter(c => c.parent_component_id === id) : [];
  }, [components, editUnderCarriageId]);
  const editUcStep3 = useMemo(() => {
    const id = editUnderCarriageTier2Id && editUnderCarriageTier2Id !== 'none' ? editUnderCarriageTier2Id : null;
    return id ? getByStep('under_carriage', 3).filter(c => c.parent_component_id === id) : [];
  }, [components, editUnderCarriageTier2Id]);

  const backEnds = components.filter(c => c.category === 'back_end');
  const deckTypes = components.filter(c => c.category === 'deck_type');

  const handleAdd = async () => {
    if (!trailerTypeId) { toast({ title: 'Required', description: 'Select a trailer type.', variant: 'destructive' }); return; }
    await onSave({
      trailer_type_id: trailerTypeId,
      trailer_length_id: trailerLengthId && trailerLengthId !== 'none' ? trailerLengthId : null,
      front_end_id: frontEndId && frontEndId !== 'none' ? frontEndId : null,
      front_end_tier2_id: frontEndTier2Id && frontEndTier2Id !== 'none' ? frontEndTier2Id : null,
      back_end_id: backEndId && backEndId !== 'none' ? backEndId : null,
      deck_type_id: deckTypeId && deckTypeId !== 'none' ? deckTypeId : null,
      under_carriage_id: underCarriageId && underCarriageId !== 'none' ? underCarriageId : null,
      under_carriage_tier2_id: underCarriageTier2Id && underCarriageTier2Id !== 'none' ? underCarriageTier2Id : null,
      under_carriage_tier3_id: underCarriageTier3Id && underCarriageTier3Id !== 'none' ? underCarriageTier3Id : null,
      under_carriage_axle_count: underCarriageAxleCount ? parseInt(underCarriageAxleCount) : null,
      total_price: parseFloat(totalPrice) || 0,
      linked_assembly_id: linkedAssemblyId && linkedAssemblyId !== 'none' ? linkedAssemblyId : null,
    });
    setTrailerTypeId(''); setTrailerLengthId(''); setFrontEndId(''); setFrontEndTier2Id(''); setBackEndId(''); setDeckTypeId('');
    setUnderCarriageId(''); setUnderCarriageTier2Id(''); setUnderCarriageTier3Id(''); setUnderCarriageAxleCount(''); setTotalPrice('');
    setLinkedAssemblyId('');
  };

  const startEdit = (a: typeof assemblies[0]) => {
    setEditingId(a.id);
    setEditTrailerLengthId(a.trailer_length_id || 'none');
    setEditFrontEndId(a.front_end_id || 'none');
    setEditFrontEndTier2Id((a as any).front_end_tier2_id || 'none');
    setEditBackEndId(a.back_end_id || 'none');
    setEditDeckTypeId(a.deck_type_id || 'none');
    setEditUnderCarriageId((a as any).under_carriage_id || 'none');
    setEditUnderCarriageTier2Id((a as any).under_carriage_tier2_id || 'none');
    setEditUnderCarriageTier3Id((a as any).under_carriage_tier3_id || 'none');
    setEditUnderCarriageAxleCount(String((a as any).under_carriage_axle_count || ''));
    setEditTotalPrice(String(a.total_price));
    setEditLinkedAssemblyId((a as any).linked_assembly_id || 'none');
  };

  const saveEdit = async (id: string) => {
    await onUpdate(id, {
      trailer_length_id: editTrailerLengthId && editTrailerLengthId !== 'none' ? editTrailerLengthId : null,
      front_end_id: editFrontEndId && editFrontEndId !== 'none' ? editFrontEndId : null,
      front_end_tier2_id: editFrontEndTier2Id && editFrontEndTier2Id !== 'none' ? editFrontEndTier2Id : null,
      back_end_id: editBackEndId && editBackEndId !== 'none' ? editBackEndId : null,
      deck_type_id: editDeckTypeId && editDeckTypeId !== 'none' ? editDeckTypeId : null,
      under_carriage_id: editUnderCarriageId && editUnderCarriageId !== 'none' ? editUnderCarriageId : null,
      under_carriage_tier2_id: editUnderCarriageTier2Id && editUnderCarriageTier2Id !== 'none' ? editUnderCarriageTier2Id : null,
      under_carriage_tier3_id: editUnderCarriageTier3Id && editUnderCarriageTier3Id !== 'none' ? editUnderCarriageTier3Id : null,
      under_carriage_axle_count: editUnderCarriageAxleCount ? parseInt(editUnderCarriageAxleCount) : null,
      total_price: parseFloat(editTotalPrice) || 0,
      linked_assembly_id: editLinkedAssemblyId && editLinkedAssemblyId !== 'none' ? editLinkedAssemblyId : null,
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
            <Label>Trailer Length</Label>
            <Select value={trailerLengthId} onValueChange={setTrailerLengthId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {lengths.filter(l => !trailerTypeId || l.compatible_trailer_type_ids.length === 0 || l.compatible_trailer_type_ids.includes(trailerTypeId)).map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Front End Tier 1 */}
          <div className="space-y-1">
            <Label>Front End (Step 1)</Label>
            <Select value={frontEndId} onValueChange={v => { setFrontEndId(v); setFrontEndTier2Id(''); }}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {frontEndStep1.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Front End Tier 2 */}
          {frontEndStep2.length > 0 && (
            <div className="space-y-1">
              <Label>Front End (Step 2)</Label>
              <Select value={frontEndTier2Id} onValueChange={setFrontEndTier2Id}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {frontEndStep2.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Label>Add Ons</Label>
            <Select value={deckTypeId} onValueChange={setDeckTypeId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {deckTypes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Under Carriage Tier 1 */}
          <div className="space-y-1">
            <Label>Under Carriage (Step 1)</Label>
            <Select value={underCarriageId} onValueChange={v => { setUnderCarriageId(v); setUnderCarriageTier2Id(''); setUnderCarriageTier3Id(''); setUnderCarriageAxleCount(''); }}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {ucStep1.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Axle Count */}
          {underCarriageId && underCarriageId !== 'none' && (
            <div className="space-y-1">
              <Label>Axle Count</Label>
              <Select value={underCarriageAxleCount} onValueChange={setUnderCarriageAxleCount}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Axles</SelectItem>
                  <SelectItem value="3">3 Axles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Under Carriage Tier 2 */}
          {ucStep2.length > 0 && (
            <div className="space-y-1">
              <Label>Under Carriage (Step 2)</Label>
              <Select value={underCarriageTier2Id} onValueChange={v => { setUnderCarriageTier2Id(v); setUnderCarriageTier3Id(''); }}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {ucStep2.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Under Carriage Tier 3 */}
          {ucStep3.length > 0 && (
            <div className="space-y-1">
              <Label>Under Carriage (Step 3)</Label>
              <Select value={underCarriageTier3Id} onValueChange={setUnderCarriageTier3Id}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {ucStep3.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Total Price</Label>
            <Input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} placeholder="0.00" />
          </div>

          <div className="space-y-1">
            <Label>Linked Assembly <span className="text-sky-400 text-xs">(optional)</span></Label>
            <Select value={linkedAssemblyId} onValueChange={setLinkedAssemblyId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none">None</SelectItem>
                {sortedAssemblies.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.type ? `[${a.type}] ` : ''}{a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trailer Type</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Front End</TableHead>
                  <TableHead>FE Tier 2</TableHead>
                  <TableHead>Back End</TableHead>
                  <TableHead>Add Ons</TableHead>
                  <TableHead>Under Carriage</TableHead>
                  <TableHead>Axles</TableHead>
                  <TableHead>UC Tier 2</TableHead>
                  <TableHead>UC Tier 3</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Linked Assembly</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assemblies.map(a => {
                  const aAny = a as any;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{getName(a.trailer_type_id, types)}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editTrailerLengthId} onValueChange={setEditTrailerLengthId}>
                          <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem>{lengths.filter(l => l.compatible_trailer_type_ids.length === 0 || l.compatible_trailer_type_ids.includes(a.trailer_type_id)).map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (lengths.find(l => l.id === a.trailer_length_id)?.label || '—')}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editFrontEndId} onValueChange={v => { setEditFrontEndId(v); setEditFrontEndTier2Id('none'); }}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem>{frontEndStep1.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : getName(a.front_end_id, components)}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editFrontEndTier2Id} onValueChange={setEditFrontEndTier2Id}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem>{editFrontEndStep2.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : getName(aAny.front_end_tier2_id, components)}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editBackEndId} onValueChange={setEditBackEndId}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem>{backEnds.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : getName(a.back_end_id, components)}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editDeckTypeId} onValueChange={setEditDeckTypeId}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem>{deckTypes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : getName(a.deck_type_id, components)}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editUnderCarriageId} onValueChange={v => { setEditUnderCarriageId(v); setEditUnderCarriageTier2Id('none'); setEditUnderCarriageTier3Id('none'); setEditUnderCarriageAxleCount(''); }}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem>{ucStep1.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : getName(aAny.under_carriage_id, components)}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editUnderCarriageAxleCount} onValueChange={setEditUnderCarriageAxleCount}>
                          <SelectTrigger className="h-8 w-20"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent>
                        </Select>
                      ) : (aAny.under_carriage_axle_count || '—')}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editUnderCarriageTier2Id} onValueChange={v => { setEditUnderCarriageTier2Id(v); setEditUnderCarriageTier3Id('none'); }}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem>{editUcStep2.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : getName(aAny.under_carriage_tier2_id, components)}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editUnderCarriageTier3Id} onValueChange={setEditUnderCarriageTier3Id}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem>{editUcStep3.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : getName(aAny.under_carriage_tier3_id, components)}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Input type="number" value={editTotalPrice} onChange={e => setEditTotalPrice(e.target.value)} className="h-8 w-24" />
                      ) : <span>${Number(a.total_price).toFixed(2)}</span>}</TableCell>
                      <TableCell>{editingId === a.id ? (
                        <Select value={editLinkedAssemblyId} onValueChange={setEditLinkedAssemblyId}>
                          <SelectTrigger className="h-8 w-44"><SelectValue placeholder="None" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            <SelectItem value="none">None</SelectItem>
                            {sortedAssemblies.map(la => (
                              <SelectItem key={la.id} value={la.id}>{la.type ? `[${la.type}] ` : ''}{la.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (() => {
                        const linked = sortedAssemblies.find(la => la.id === aAny.linked_assembly_id);
                        if (!linked) return <span className="text-muted-foreground">—</span>;
                        return (
                          <RouterLink
                            to={`/assemblies/${encodeURIComponent(linked.type || '')}?id=${linked.id}`}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <Link className="h-3 w-3" />
                            {linked.name}
                          </RouterLink>
                        );
                      })()}</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}