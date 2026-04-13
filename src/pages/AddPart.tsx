import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParts } from '@/hooks/useParts';
import { useToast } from '@/hooks/use-toast';

export function AddPart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folder') || null;
  const { addPart, uploadPartImage, uploadPartDxf } = useParts();
  const { toast } = useToast();
  const backToLibraryPath = `/parts/library${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dxfFile1, setDxfFile1] = useState<File | null>(null);
  const [dxfFile2, setDxfFile2] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    let imageUrl: string | undefined;
    let dxfUrl1: string | undefined;
    let dxfUrl2: string | undefined;

    if (imageFile) {
      const path = await uploadPartImage(imageFile);
      if (path) imageUrl = path;
    }
    if (dxfFile1) {
      const path = await uploadPartDxf(dxfFile1);
      if (path) dxfUrl1 = path;
    }
    if (dxfFile2) {
      const path = await uploadPartDxf(dxfFile2);
      if (path) dxfUrl2 = path;
    }

    const id = await addPart({ name: name.trim(), sku: sku.trim(), description: description.trim(), price: parseFloat(price) || 0, imageUrl, dxfUrl1, dxfUrl2, folderId });
    setSaving(false);

    if (id) {
      toast({ title: 'Part created' });
      navigate(backToLibraryPath);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(backToLibraryPath)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Add Part</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader><CardTitle>Part Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Part name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Image</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="w-24 h-24 rounded-md border border-border overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm">
                <Upload className="h-4 w-4" />
                {imageFile ? 'Change Image' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>DXF Files</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plasma DXF</Label>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm w-full justify-center">
                  <Upload className="h-4 w-4" />
                  {dxfFile1 ? dxfFile1.name : 'Upload DXF'}
                  <input type="file" accept=".dxf" className="hidden" onChange={e => setDxfFile1(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="space-y-2">
                <Label>Laser DXF</Label>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm w-full justify-center">
                  <Upload className="h-4 w-4" />
                  {dxfFile2 ? dxfFile2.name : 'Upload DXF'}
                  <input type="file" accept=".dxf" className="hidden" onChange={e => setDxfFile2(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(backToLibraryPath)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Part'}
          </Button>
        </div>
      </main>
    </div>
  );
}
