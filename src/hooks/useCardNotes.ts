import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CardNote {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useCardNotes(cardId: string | null) {
  const [notes, setNotes] = useState<CardNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    if (!user || !cardId) { setNotes([]); return; }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("instruction_card_notes")
        .select("*")
        .eq("card_id", cardId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setNotes(
        (data || []).map((d: any) => ({
          id: d.id,
          cardId: d.card_id,
          userId: d.user_id,
          content: d.content,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }))
      );
    } catch (err) {
      console.error("Error fetching card notes:", err);
    } finally {
      setLoading(false);
    }
  }, [user, cardId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async (content: string) => {
    if (!user || !cardId) return null;
    try {
      const { data, error } = await (supabase as any)
        .from("instruction_card_notes")
        .insert({ card_id: cardId, user_id: user.id, content })
        .select()
        .single();
      if (error) throw error;
      await fetchNotes();
      return data.id as string;
    } catch {
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
      return null;
    }
  };

  const updateNote = async (noteId: string, content: string) => {
    try {
      const { error } = await (supabase as any)
        .from("instruction_card_notes")
        .update({ content })
        .eq("id", noteId);
      if (error) throw error;
      await fetchNotes();
      return true;
    } catch {
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
      return false;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("instruction_card_notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
      await fetchNotes();
      return true;
    } catch {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
      return false;
    }
  };

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes };
}
