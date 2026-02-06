import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Note, NoteColor, CreateNoteInput } from "@/types/note";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mapped: Note[] = (data || []).map((n) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        content: n.content,
        color: (n.color || 'default') as NoteColor,
        isPinned: n.is_pinned,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }));

      setNotes(mapped);
    } catch (error: any) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

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
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        content: data.content,
        color: (data.color || 'default') as NoteColor,
        isPinned: data.is_pinned,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (error: any) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
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

      const { error } = await supabase
        .from("notes")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, ...updates, updatedAt: new Date().toISOString() }
            : n
        ).sort((a, b) => {
          if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
      );

      return true;
    } catch (error: any) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);

      if (error) throw error;

      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast({
        title: "Success",
        description: "Note deleted",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
      return false;
    }
  };

  const togglePin = async (id: string): Promise<boolean> => {
    const note = notes.find((n) => n.id === id);
    if (!note) return false;
    return updateNote(id, { isPinned: !note.isPinned });
  };

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    refetch: fetchNotes,
  };
}
