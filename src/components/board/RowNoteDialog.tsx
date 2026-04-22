import { useState, useRef, ChangeEvent } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Trash2, Plus, X, Activity, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { RowNoteEntry } from '@/hooks/useBoardRowNoteEntries';
import { RowActivityEntry } from '@/hooks/useBoardRowActivity';
import { toast } from 'sonner';

interface RowNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowLabel: string;
  entries: RowNoteEntry[];
  activity: RowActivityEntry[];
  userNames: Record<string, string>;
  onAdd: (content: string, imageFile: File | null) => Promise<RowNoteEntry | null>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefreshImageUrl: (id: string) => Promise<string | null>;
}

function formatActivityValue(action: string, value: string | null): string {
  if (value === null || value === '') return '—';
  if (value === 'true') return '✓';
  if (value === 'false') return '✗';
  return value.length > 80 ? value.slice(0, 80) + '…' : value;
}

function activityLabel(entry: RowActivityEntry): string {
  switch (entry.action) {
    case 'cell_changed':
      return `Updated ${entry.column_name || 'column'}`;
    case 'note_added':
      return 'Added a note';
    case 'note_updated':
      return 'Edited a note';
    case 'note_deleted':
      return 'Deleted a note';
    case 'row_created':
      return 'Created the row';
    default:
      return entry.action;
  }
}

export function RowNoteDialog({
  open,
  onOpenChange,
  rowLabel,
  entries,
  activity,
  userNames,
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
    const fresh = await onRefreshImageUrl(entry.id);
    window.open(fresh || entry.image_url, '_blank');
  };

  return (
    <Sheet
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
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-3 border-b border-border">
          <SheetTitle className="truncate">{rowLabel || 'Row'}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="notes" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-3 self-start">
            <TabsTrigger value="notes" className="gap-1.5">
              <StickyNote className="h-3.5 w-3.5" />
              Notes
              {entries.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">({entries.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity
              {activity.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">({activity.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* NOTES TAB */}
          <TabsContent
            value="notes"
            className="flex-1 flex flex-col min-h-0 mt-3 data-[state=inactive]:hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 pb-3 space-y-3">
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
                        <p className="text-sm whitespace-pre-wrap break-words">{entry.content}</p>
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

            {/* Composer */}
            <div className="border-t border-border p-4 space-y-2 bg-card">
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
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent
            value="activity"
            className="flex-1 overflow-y-auto px-6 pb-6 mt-3 data-[state=inactive]:hidden"
          >
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No activity yet. Changes to this row will appear here.
              </p>
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-4 pt-1">
                {activity.map((entry) => {
                  const name = userNames[entry.user_id] || 'Unknown user';
                  const initials = name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || '?';
                  return (
                    <li key={entry.id} className="ml-4">
                      <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 shrink-0 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center"
                          title={name}
                        >
                          {initials}
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-foreground">{name}</span>
                          <span className="text-muted-foreground"> {activityLabel(entry).replace(/^Updated/, 'updated').replace(/^Added/, 'added').replace(/^Edited/, 'edited').replace(/^Deleted/, 'deleted').replace(/^Created/, 'created')}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 ml-8">
                        {format(new Date(entry.created_at), 'MMM d, yyyy · h:mm a')}
                      </div>
                      {entry.action === 'cell_changed' && (
                        <div className="mt-1 ml-8 text-xs flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {formatActivityValue(entry.action, entry.old_value)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-foreground">
                            {formatActivityValue(entry.action, entry.new_value)}
                          </span>
                        </div>
                      )}
                      {entry.action.startsWith('note_') && entry.new_value && (
                        <div className="mt-1 ml-8 text-xs text-muted-foreground italic break-words">
                          “{formatActivityValue(entry.action, entry.new_value)}”
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
