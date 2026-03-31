import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CardFile {
  id: string;
  cardId: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  displayOrder: number;
  createdAt: string;
  signedUrl?: string;
}

export interface InstructionCard {
  id: string;
  instructionId: string;
  userId: string;
  name: string;
  description: string;
  link: string | null;
  notes: string;
  createdBy: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  files: CardFile[];
}

export function useInstructionCards(instructionId: string | null) {
  const [cards, setCards] = useState<InstructionCard[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCards = useCallback(async () => {
    if (!user || !instructionId) { setCards([]); return; }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("instruction_cards")
        .select("*")
        .eq("instruction_id", instructionId)
        .order("display_order", { ascending: true });
      if (error) throw error;

      const { data: filesData, error: filesErr } = await (supabase as any)
        .from("instruction_card_files")
        .select("*")
        .in("card_id", (data || []).map((c: any) => c.id))
        .order("display_order", { ascending: true });
      if (filesErr) throw filesErr;

      // Sign URLs
      const paths = (filesData || []).map((f: any) => f.file_url).filter(Boolean);
      const signedMap: Record<string, string> = {};
      if (paths.length > 0) {
        const { data: signed } = await supabase.storage
          .from("instruction-files")
          .createSignedUrls(paths, 3600);
        if (signed) {
          signed.forEach((s: any) => {
            if (s.signedUrl) signedMap[s.path] = s.signedUrl;
          });
        }
      }

      const mappedFiles: CardFile[] = (filesData || []).map((f: any) => ({
        id: f.id,
        cardId: f.card_id,
        userId: f.user_id,
        fileName: f.file_name,
        fileUrl: f.file_url,
        fileType: f.file_type,
        displayOrder: f.display_order,
        createdAt: f.created_at,
        signedUrl: signedMap[f.file_url] || undefined,
      }));

      const mapped: InstructionCard[] = (data || []).map((d: any) => ({
        id: d.id,
        instructionId: d.instruction_id,
        userId: d.user_id,
        name: d.name,
        description: d.description || "",
        link: d.link,
        displayOrder: d.display_order,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        files: mappedFiles.filter((f) => f.cardId === d.id),
      }));

      setCards(mapped);
    } catch (err: any) {
      console.error("Error fetching cards:", err);
    } finally {
      setLoading(false);
    }
  }, [user, instructionId]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const addCard = async (name: string) => {
    if (!user || !instructionId) return null;
    try {
      const { data, error } = await (supabase as any)
        .from("instruction_cards")
        .insert({
          instruction_id: instructionId,
          user_id: user.id,
          name,
          display_order: cards.length,
        })
        .select()
        .single();
      if (error) throw error;
      await fetchCards();
      return data.id as string;
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to create card", variant: "destructive" });
      return null;
    }
  };

  const updateCard = async (cardId: string, updates: { name?: string; description?: string; link?: string | null }) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.link !== undefined) dbUpdates.link = updates.link;

      const { error } = await (supabase as any)
        .from("instruction_cards")
        .update(dbUpdates)
        .eq("id", cardId);
      if (error) throw error;
      await fetchCards();
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to update card", variant: "destructive" });
      return false;
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      // Delete files from storage
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        const paths = card.files.map((f) => f.fileUrl);
        if (paths.length > 0) {
          await supabase.storage.from("instruction-files").remove(paths);
        }
      }
      const { error } = await (supabase as any)
        .from("instruction_cards")
        .delete()
        .eq("id", cardId);
      if (error) throw error;
      await fetchCards();
      toast({ title: "Deleted", description: "Card deleted" });
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to delete card", variant: "destructive" });
      return false;
    }
  };

  const uploadCardFile = async (cardId: string, file: File) => {
    if (!user) return false;
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/cards/${cardId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("instruction-files")
        .upload(path, file);
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await (supabase as any)
        .from("instruction_card_files")
        .insert({
          card_id: cardId,
          user_id: user.id,
          file_name: file.name,
          file_url: path,
          file_type: file.type,
        });
      if (dbErr) throw dbErr;
      await fetchCards();
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
      return false;
    }
  };

  const deleteCardFile = async (fileId: string, fileUrl: string) => {
    try {
      await supabase.storage.from("instruction-files").remove([fileUrl]);
      const { error } = await (supabase as any)
        .from("instruction_card_files")
        .delete()
        .eq("id", fileId);
      if (error) throw error;
      await fetchCards();
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
      return false;
    }
  };

  return { cards, loading, addCard, updateCard, deleteCard, uploadCardFile, deleteCardFile, refetch: fetchCards };
}
