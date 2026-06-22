import { useState } from 'react';
import { FileText, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVendorNotes } from '@/hooks/useVendorNotes';
import { format } from 'date-fns';

interface VendorNotesListProps {
  vendorId: string;
  legacyNote?: string | null;
  onMigrateLegacy?: () => void;
}

export function VendorNotesList({ vendorId, legacyNote, onMigrateLegacy }: VendorNotesListProps) {
  const { notes, loading, addNote, updateNote, deleteNote } = useVendorNotes(vendorId);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    await addNote(newContent.trim());
    setNewContent('');
    setAdding(false);
  };

  const handleMigrate = async () => {
    if (!legacyNote) return;
    await addNote(legacyNote);
    onMigrateLegacy?.();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notes
        </CardTitle>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {legacyNote && (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 space-y-2">
            <div className="text-xs text-muted-foreground">Legacy note (single field)</div>
            <div className="text-sm whitespace-pre-wrap">{legacyNote}</div>
            {onMigrateLegacy && (
              <Button size="sm" variant="ghost" onClick={handleMigrate}>
                Convert to separate note
              </Button>
            )}
          </div>
        )}

        {adding && (
          <div className="space-y-2 rounded-md border border-border bg-card p-3">
            <Textarea
              autoFocus
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write a note..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewContent(''); }}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!newContent.trim()}>
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : notes.length === 0 && !adding && !legacyNote ? (
          <p className="text-sm text-muted-foreground italic">No notes yet. Click "Add Note" to create one.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-md border border-border bg-card p-3 space-y-2">
              {editingId === note.id ? (
                <>
                  <Textarea
                    autoFocus
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await updateNote(note.id, editContent);
                        setEditingId(null);
                      }}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm whitespace-pre-wrap text-foreground">{note.content}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(note.updatedAt, 'MMM d, yyyy · h:mm a')}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditContent(note.content);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
