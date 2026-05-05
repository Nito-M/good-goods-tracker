import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Note, NoteColor, CreateNoteInput } from "@/types/note";

const mapNote = (n: any, tagIds: string[] = []): Note => ({
  id: n.id,
  userId: n.user_id,
  title: n.title,
  content: n.content,
  color: (n.color || 'default') as NoteColor,
  isPinned: n.is_pinned,
  archived: n.archived ?? false,
  deletedAt: n.deleted_at ?? null,
  reminderAt: n.reminder_at ?? null,
  isTemplate: n.is_template ?? false,
  isPrivate: n.is_private ?? false,
  createdAt: n.created_at,
  updatedAt: n.updated_at,
  tagIds,
});

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    try {
      const [{ data: notesData, error: notesErr }, { data: tagAssigns }] = await Promise.all([
        supabase.from("notes").select("*").order("is_pinned", { ascending: false }).order("updated_at", { ascending: false }),
        supabase.from("note_tag_assignments").select("note_id, tag_id"),
      ]);
      if (notesErr) throw notesErr;
      const tagsByNote = new Map<string, string[]>();
      (tagAssigns || []).forEach((a: any) => {
        const arr = tagsByNote.get(a.note_id) || [];
        arr.push(a.tag_id);
        tagsByNote.set(a.note_id, arr);
      });
      setNotes((notesData || []).map((n) => mapNote(n, tagsByNote.get(n.id) || [])));
    } catch (error: any) {
      console.error("Error fetching notes:", error);
      toast({ title: "Error", description: "Failed to fetch notes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async (input: CreateNoteInput): Promise<Note | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: input.title,
          content: input.content,
          color: input.color || 'default',
          is_pinned: input.isPinned || false,
          is_template: input.isTemplate || false,
          is_private: input.isPrivate || false,
          reminder_at: input.reminderAt || null,
        })
        .select()
        .single();
      if (error) throw error;
      const newNote = mapNote(data);
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (error: any) {
      console.error("Error creating note:", error);
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<CreateNoteInput>): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
      if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
      if (updates.deletedAt !== undefined) dbUpdates.deleted_at = updates.deletedAt;
      if (updates.reminderAt !== undefined) dbUpdates.reminder_at = updates.reminderAt;
      if (updates.isTemplate !== undefined) dbUpdates.is_template = updates.isTemplate;

      const { error } = await supabase.from("notes").update(dbUpdates).eq("id", id);
      if (error) throw error;

      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } as Note : n))
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          })
      );
      return true;
    } catch (error: any) {
      console.error("Error updating note:", error);
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
      return false;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
      return false;
    }
  };

  const togglePin = async (id: string): Promise<boolean> => {
    const note = notes.find((n) => n.id === id);
    if (!note) return false;
    return updateNote(id, { isPinned: !note.isPinned });
  };

  const moveToTrash = (id: string) => updateNote(id, { deletedAt: new Date().toISOString(), archived: false });
  const restoreFromTrash = (id: string) => updateNote(id, { deletedAt: null });
  const archive = (id: string) => updateNote(id, { archived: true });
  const unarchive = (id: string) => updateNote(id, { archived: false });

  const setNoteTags = async (noteId: string, tagIds: string[]): Promise<boolean> => {
    try {
      const { error: delErr } = await supabase.from("note_tag_assignments").delete().eq("note_id", noteId);
      if (delErr) throw delErr;
      if (tagIds.length > 0) {
        const rows = tagIds.map((tag_id) => ({ note_id: noteId, tag_id }));
        const { error: insErr } = await supabase.from("note_tag_assignments").insert(rows);
        if (insErr) throw insErr;
      }
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, tagIds } : n)));
      return true;
    } catch (e: any) {
      console.error("setNoteTags error", e);
      toast({ title: "Error", description: "Failed to update tags", variant: "destructive" });
      return false;
    }
  };

  // Bulk actions
  const bulkUpdate = async (ids: string[], updates: Partial<CreateNoteInput>): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
      if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
      if (updates.deletedAt !== undefined) dbUpdates.deleted_at = updates.deletedAt;

      const { error } = await supabase.from("notes").update(dbUpdates).in("id", ids);
      if (error) throw error;
      setNotes((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, ...updates } as Note : n)));
      return true;
    } catch (e: any) {
      toast({ title: "Error", description: "Bulk update failed", variant: "destructive" });
      return false;
    }
  };

  const bulkDelete = async (ids: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase.from("notes").delete().in("id", ids);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
      return true;
    } catch (e: any) {
      toast({ title: "Error", description: "Bulk delete failed", variant: "destructive" });
      return false;
    }
  };

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    moveToTrash,
    restoreFromTrash,
    archive,
    unarchive,
    setNoteTags,
    bulkUpdate,
    bulkDelete,
    refetch: fetchNotes,
  };
}
