import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { NoteTag, NoteColor } from "@/types/note";

export function useNoteTags() {
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("note_tags").select("*").order("name");
      if (error) throw error;
      setTags((data || []).map((t: any) => ({
        id: t.id, userId: t.user_id, name: t.name, color: (t.color || 'default') as NoteColor, createdAt: t.created_at,
      })));
    } catch (e) {
      console.error("fetchTags", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const addTag = async (name: string, color: NoteColor = 'default'): Promise<NoteTag | null> => {
    if (!user || !name.trim()) return null;
    try {
      const { data, error } = await supabase.from("note_tags").insert({
        user_id: user.id, name: name.trim(), color,
      }).select().single();
      if (error) throw error;
      const t: NoteTag = { id: data.id, userId: data.user_id, name: data.name, color: data.color, createdAt: data.created_at };
      setTags((prev) => [...prev, t].sort((a, b) => a.name.localeCompare(b.name)));
      return t;
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to create tag", variant: "destructive" });
      return null;
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase.from("note_tags").delete().eq("id", id);
      if (error) throw error;
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast({ title: "Error", description: "Failed to delete tag", variant: "destructive" });
    }
  };

  return { tags, loading, addTag, deleteTag, refetch: fetchTags };
}
