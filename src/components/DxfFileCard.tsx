import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, Eye, Trash2, Loader2, FileCode2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DxfThreeViewer } from './DxfThreeViewer';

interface DxfFileCardProps {
  itemId: string;
  dxfUrl: string | null;
  onDxfUrlChange: (url: string | null) => void;
}

export function DxfFileCard({ itemId, dxfUrl, onDxfUrlChange }: DxfFileCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [dxfText, setDxfText] = useState<string | null>(null);
  const [loadingDxf, setLoadingDxf] = useState(false);

  const storagePath = dxfUrl && !dxfUrl.startsWith('http')
    ? dxfUrl
    : dxfUrl?.match(/dxf-files\/([^?]+)/)?.[1] || null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.name.toLowerCase().endsWith('.dxf')) {
      toast({ title: 'Invalid file', description: 'Please upload a .dxf file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      // Delete existing file if any
      if (storagePath) {
        await supabase.storage.from('dxf-files').remove([storagePath]);
      }

      const fileName = `${user.id}/${itemId}.dxf`;
      const { error: uploadError } = await supabase.storage
        .from('dxf-files')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save the storage path to inventory_items
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ dxf_url: fileName })
        .eq('id', itemId);

      if (updateError) throw updateError;

      onDxfUrlChange(fileName);
      toast({ title: 'DXF file uploaded' });
    } catch (err) {
      console.error('DXF upload error:', err);
      toast({ title: 'Upload failed', description: 'Could not upload DXF file.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!storagePath) return;
    try {
      await supabase.storage.from('dxf-files').remove([storagePath]);
      await supabase.from('inventory_items').update({ dxf_url: null }).eq('id', itemId);
      onDxfUrlChange(null);
      setDxfText(null);
      toast({ title: 'DXF file removed' });
    } catch (err) {
      console.error('DXF delete error:', err);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleView = async () => {
    if (!storagePath) return;
    setLoadingDxf(true);
    setViewerOpen(true);

    try {
      const { data: signedData, error: signError } = await supabase.storage
        .from('dxf-files')
        .createSignedUrl(storagePath, 60);

      if (signError || !signedData) throw signError;

      const response = await fetch(signedData.signedUrl);
      const text = await response.text();
      setDxfText(text);
    } catch (err) {
      console.error('DXF load error:', err);
      toast({ title: 'Could not load DXF', description: 'The file may be corrupted or inaccessible.', variant: 'destructive' });
      setViewerOpen(false);
    } finally {
      setLoadingDxf(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCode2 className="h-5 w-5" />
            DXF Drawing
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dxfUrl ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleView} className="gap-2">
                <Eye className="h-4 w-4" />
                View DXF
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                Replace
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">No DXF available.</span>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                Upload DXF File
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".dxf"
            className="hidden"
            onChange={handleUpload}
          />
        </CardContent>
      </Card>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden" aria-describedby={undefined}>
          <VisuallyHidden><DialogTitle>DXF Drawing Preview</DialogTitle></VisuallyHidden>
          {loadingDxf ? (
            <div className="flex items-center justify-center h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dxfText ? (
            <div className="w-full h-[85vh]">
              <DxfThreeViewer dxfText={dxfText} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
