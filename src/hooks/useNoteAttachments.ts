import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { NoteAttachment } from "@/types/note";

const BUCKET = "note-attachments";
const SIGNED_TTL = 60 * 60 * 24; // 1 day

export function useNoteAttachments(noteId: string | null) {
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAttachments = useCallback(async () => {
    if (!noteId) { setAttachments([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("note_attachments")
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const mapped: NoteAttachment[] = await Promise.all((data || []).map(async (a: any) => {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(a.storage_path, SIGNED_TTL);
        return {
          id: a.id, noteId: a.note_id, userId: a.user_id,
          storagePath: a.storage_path, fileName: a.file_name,
          mimeType: a.mime_type, sizeBytes: a.size_bytes,
          createdAt: a.created_at, signedUrl: signed?.signedUrl,
        };
      }));
      setAttachments(mapped);
    } catch (e) {
      console.error("fetchAttachments", e);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

  const uploadAttachment = async (file: File): Promise<NoteAttachment | null> => {
    if (!user || !noteId) return null;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 10MB per image", variant: "destructive" });
      return null;
    }
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/${noteId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("note_attachments").insert({
        note_id: noteId, user_id: user.id, storage_path: path,
        file_name: file.name, mime_type: file.type, size_bytes: file.size,
      }).select().single();
      if (error) throw error;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
      const att: NoteAttachment = {
        id: data.id, noteId: data.note_id, userId: data.user_id,
        storagePath: data.storage_path, fileName: data.file_name,
        mimeType: data.mime_type, sizeBytes: data.size_bytes,
        createdAt: data.created_at, signedUrl: signed?.signedUrl,
      };
      setAttachments((prev) => [...prev, att]);
      return att;
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
      return null;
    }
  };

  const deleteAttachment = async (id: string) => {
    const target = attachments.find((a) => a.id === id);
    if (!target) return;
    try {
      await supabase.storage.from(BUCKET).remove([target.storagePath]);
      const { error } = await supabase.from("note_attachments").delete().eq("id", id);
      if (error) throw error;
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to delete image", variant: "destructive" });
    }
  };

  return { attachments, loading, uploadAttachment, deleteAttachment };
}
