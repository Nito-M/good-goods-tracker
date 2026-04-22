import { useState, useRef, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Trash2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { RowNoteEntry } from '@/hooks/useBoardRowNoteEntries';
import { toast } from 'sonner';

interface RowNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowLabel: string;
  entries: RowNoteEntry[];
  onAdd: (content: string, imageFile: File | null) => Promise<RowNoteEntry | null>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefreshImageUrl: (id: string) => Promise<string | null>;
}

export function RowNoteDialog({
  open,
  onOpenChange,
  rowLabel,
  entries,
  onAdd,
  onUpdate,
  onDelete,
  onRefreshImageUrl,
}: RowNoteDialogProps) {
  const [draftText, setDraftText] = useState('');
  const [draftImage, setDraftImage] = useState<File | null>(null);
  const [draftImagePreview, setDraftImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSelectImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file');
      return;
    }
    setDraftImage(file);
    setDraftImagePreview(URL.createObjectURL(file));
  };

  const clearDraftImage = () => {
    setDraftImage(null);
    if (draftImagePreview) URL.revokeObjectURL(draftImagePreview);
    setDraftImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAdd = async () => {
    if (!draftText.trim() && !draftImage) {
      toast.error('Add some text or an image');
      return;
    }
    setSaving(true);
    const result = await onAdd(draftText.trim(), draftImage);
    setSaving(false);
    if (result) {
      setDraftText('');
      clearDraftImage();
    }
  };

  const handleStartEdit = (entry: RowNoteEntry) => {
    setEditingId(entry.id);
    setEditingText(entry.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await onUpdate(editingId, editingText);
    setEditingId(null);
    setEditingText('');
  };

  const handleImageClick = async (entry: RowNoteEntry) => {
    if (!entry.image_url) return;
    // Try original URL first; if it 403s due to expiry, refresh
    const fresh = await onRefreshImageUrl(entry.id);
    window.open(fresh || entry.image_url, '_blank');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          clearDraftImage();
          setDraftText('');
          setEditingId(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Notes — {rowLabel || 'Row'}</DialogTitle>
        </DialogHeader>

        {/* Existing notes list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1 min-h-[100px]">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No notes yet. Add the first one below.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
              >
                {entry.image_url && (
                  <button
                    type="button"
                    onClick={() => handleImageClick(entry)}
                    className="block w-full"
                    title="Open image"
                  >
                    <img
                      src={entry.image_url}
                      alt="Note attachment"
                      className="max-h-64 w-auto rounded-md object-contain mx-auto bg-background"
                      onError={async (e) => {
                        const fresh = await onRefreshImageUrl(entry.id);
                        if (fresh) (e.target as HTMLImageElement).src = fresh;
                      }}
                    />
                  </button>
                )}

                {editingId === entry.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditingText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  entry.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {entry.content}
                    </p>
                  )
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>{format(new Date(entry.created_at), 'MMM d, yyyy · h:mm a')}</span>
                  {editingId !== entry.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleStartEdit(entry)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(entry.id)}
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* New note composer */}
        <div className="border-t border-border pt-3 space-y-2">
          <Textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Write a new note…"
            className="min-h-[80px]"
          />

          {draftImagePreview && (
            <div className="relative inline-block">
              <img
                src={draftImagePreview}
                alt="Preview"
                className="max-h-32 rounded-md border border-border"
              />
              <button
                type="button"
                onClick={clearDraftImage}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelectImage}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              <ImageIcon className="h-4 w-4" />
              {draftImage ? 'Change image' : 'Add image'}
            </Button>
            <Button onClick={handleAdd} disabled={saving} size="sm">
              <Plus className="h-4 w-4" />
              {saving ? 'Adding…' : 'Add note'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
