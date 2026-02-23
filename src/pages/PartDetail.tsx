import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const { parts, loading, deletePart, getSignedUrl } = useParts();
  const { toast } = useToast();

  const part = parts.find(p => p.id === id);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dxfText1, setDxfText1] = useState<string | null>(null);
  const [dxfText2, setDxfText2] = useState<string | null>(null);

  useEffect(() => {
    if (!part) return;
    if (part.imageUrl) {
      getSignedUrl('part-images', part.imageUrl).then(setImageUrl);
    }
    if (part.dxfUrl1) {
      getSignedUrl('dxf-files', part.dxfUrl1).then(async url => {
        if (url) {
          const res = await fetch(url);
          setDxfText1(await res.text());
        }
      });
    }
    if (part.dxfUrl2) {
      getSignedUrl('dxf-files', part.dxfUrl2).then(async url => {
        if (url) {
          const res = await fetch(url);
          setDxfText2(await res.text());
        }
      });
    }
  }, [part]);

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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
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
                {imageUrl ? (
                  <img src={imageUrl} alt={part.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-muted-foreground">No image</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
