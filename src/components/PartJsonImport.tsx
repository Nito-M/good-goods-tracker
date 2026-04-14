import { useRef } from 'react';
import { FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { DragPartData } from '@/lib/partDragDrop';

interface Props {
  addPart: (part: { name: string; sku: string; description?: string; price?: number; folderId?: string | null }) => Promise<string | null>;
  currentFolderId: string | null;
  existingSkus?: string[];
}

export function PartJsonImport({ addPart, currentFolderId, existingSkus = [] }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let imported = 0;
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const data: DragPartData = JSON.parse(text);
        if (!data.name && !data.sku) {
          toast({ title: `Skipped ${file.name}`, description: 'Missing name and part number.', variant: 'destructive' });
          continue;
        }
        if (data.sku && existingSkus.some(s => s.toLowerCase() === data.sku.toLowerCase())) {
          toast({ title: 'Skipped', description: `Part # "${data.sku}" already exists.`, variant: 'destructive' });
          continue;
        }
        const id = await addPart({
          name: data.name || '',
          sku: data.sku || '',
          price: data.price ?? 0,
          description: data.description || undefined,
          folderId: currentFolderId,
        });
        if (id) imported++;
      } catch {
        toast({ title: `Failed to import ${file.name}`, description: 'Invalid JSON format.', variant: 'destructive' });
      }
    }

    if (imported > 0) {
      toast({ title: `${imported} part${imported !== 1 ? 's' : ''} imported` });
    }
    e.target.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".json" multiple className="hidden" onChange={handleFile} />
      <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => fileRef.current?.click()} title="Import JSON part file">
        <FileJson className="h-3.5 w-3.5" /> Import JSON
      </Button>
    </>
  );
}
