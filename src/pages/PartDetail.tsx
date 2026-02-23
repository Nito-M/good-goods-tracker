import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParts } from '@/hooks/useParts';
import { DxfThreeViewer } from '@/components/DxfThreeViewer';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function PartDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { parts, loading, deletePart, updatePart, uploadPartImage, uploadPartDxf, getSignedUrl } = useParts();
  const { toast } = useToast();

  const part = parts.find(p => p.id === id);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dxfText1, setDxfText1] = useState<string | null>(null);
  const [dxfText2, setDxfText2] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newDxfFile1, setNewDxfFile1] = useState<File | null>(null);
  const [newDxfFile2, setNewDxfFile2] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!part) return;
    if (part.imageUrl) {
      getSignedUrl('part-images', part.imageUrl).then(setImageUrl);
    } else {
      setImageUrl(null);
    }
    if (part.dxfUrl1) {
      getSignedUrl('dxf-files', part.dxfUrl1).then(async url => {
        if (url) {
          const res = await fetch(url);
          setDxfText1(await res.text());
        }
      });
    } else {
      setDxfText1(null);
    }
    if (part.dxfUrl2) {
      getSignedUrl('dxf-files', part.dxfUrl2).then(async url => {
        if (url) {
          const res = await fetch(url);
          setDxfText2(await res.text());
        }
      });
    } else {
      setDxfText2(null);
    }
  }, [part]);

  const startEditing = () => {
    if (!part) return;
    setEditName(part.name);
    setEditSku(part.sku);
    setEditDescription(part.description || '');
    setNewImageFile(null);
    setNewImagePreview(null);
    setNewDxfFile1(null);
    setNewDxfFile2(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setNewImageFile(null);
    setNewImagePreview(null);
    setNewDxfFile1(null);
    setNewDxfFile2(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!id || !editName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const updates: Record<string, string> = {
      name: editName.trim(),
      sku: editSku.trim(),
      description: editDescription.trim(),
    };

    if (newImageFile) {
      const path = await uploadPartImage(newImageFile);
      if (path) updates.imageUrl = path;
    }
    if (newDxfFile1) {
      const path = await uploadPartDxf(newDxfFile1);
      if (path) updates.dxfUrl1 = path;
    }
    if (newDxfFile2) {
      const path = await uploadPartDxf(newDxfFile2);
      if (path) updates.dxfUrl2 = path;
    }

    const ok = await updatePart(id, updates);
    setSaving(false);

    if (ok) {
      toast({ title: 'Part updated' });
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const ok = await deletePart(id);
    if (ok) {
      toast({ title: 'Part deleted' });
      navigate('/parts');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Part not found</p>
        <Button onClick={() => navigate('/parts')}>Back to Parts</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/parts')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground">{part.name}</h1>
                {part.sku && <p className="text-sm text-muted-foreground">SKU: {part.sku}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-2">
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                    <Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={startEditing} className="gap-2">
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this part?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Image & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Image</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                {editing && newImagePreview ? (
                  <img src={newImagePreview} alt="New preview" className="w-full h-full object-contain" />
                ) : imageUrl ? (
                  <img src={imageUrl} alt={part.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-muted-foreground">No image</span>
                )}
              </div>
              {editing && (
                <label className="mt-3 cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm">
                  <Upload className="h-4 w-4" />
                  {newImageFile ? 'Change Image' : 'Upload New Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sku">SKU</Label>
                    <Input id="edit-sku" value={editSku} onChange={e => setEditSku(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-desc">Description</Label>
                    <Textarea id="edit-desc" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-foreground">{part.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SKU</p>
                    <p className="text-foreground">{part.sku || '—'}</p>
                  </div>
                  {part.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-foreground">{part.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-foreground">{part.createdAt.toLocaleDateString()}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* DXF Previews - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>DXF Drawing 1</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-md overflow-hidden">
                {dxfText1 ? (
                  <DxfThreeViewer dxfText={dxfText1} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">
                      {part.dxfUrl1 ? 'Loading DXF...' : 'No DXF file'}
                    </span>
                  </div>
                )}
              </div>
              {editing && (
                <label className="mt-3 cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm">
                  <Upload className="h-4 w-4" />
                  {newDxfFile1 ? newDxfFile1.name : 'Replace DXF 1'}
                  <input type="file" accept=".dxf" className="hidden" onChange={e => setNewDxfFile1(e.target.files?.[0] || null)} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>DXF Drawing 2</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-md overflow-hidden">
                {dxfText2 ? (
                  <DxfThreeViewer dxfText={dxfText2} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">
                      {part.dxfUrl2 ? 'Loading DXF...' : 'No DXF file'}
                    </span>
                  </div>
                )}
              </div>
              {editing && (
                <label className="mt-3 cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm">
                  <Upload className="h-4 w-4" />
                  {newDxfFile2 ? newDxfFile2.name : 'Replace DXF 2'}
                  <input type="file" accept=".dxf" className="hidden" onChange={e => setNewDxfFile2(e.target.files?.[0] || null)} />
                </label>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
