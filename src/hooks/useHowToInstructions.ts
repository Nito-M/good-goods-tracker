import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface InstructionFile {
  id: string;
  instructionId: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  displayOrder: number;
  createdAt: string;
  signedUrl?: string;
}

export interface HowToInstruction {
  id: string;
  userId: string;
  title: string;
  type: string;
  link: string | null;
  authorName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  files: InstructionFile[];
}

export interface CreateInstructionInput {
  title: string;
  type: string;
  link?: string;
  authorName: string;
  notes?: string;
}

export function useHowToInstructions() {
  const [instructions, setInstructions] = useState<HowToInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const signUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("instruction-files")
      .createSignedUrl(path, 3600);
    return data?.signedUrl || "";
  };

  const fetchInstructions = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("how_to_instructions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const { data: filesData, error: filesError } = await (supabase as any)
        .from("instruction_files")
        .select("*")
        .order("display_order", { ascending: true });

      if (filesError) throw filesError;

      // Sign URLs for files
      const signedFiles: InstructionFile[] = await Promise.all(
        (filesData || []).map(async (f: any) => ({
          id: f.id,
          instructionId: f.instruction_id,
          userId: f.user_id,
          fileName: f.file_name,
          fileUrl: f.file_url,
          fileType: f.file_type,
          displayOrder: f.display_order,
          createdAt: f.created_at,
          signedUrl: await signUrl(f.file_url),
        }))
      );

      const mapped: HowToInstruction[] = (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        type: d.type,
        link: d.link,
        authorName: d.author_name,
        notes: d.notes,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        files: signedFiles.filter((f) => f.instructionId === d.id),
      }));

      setInstructions(mapped);
    } catch (error: any) {
      console.error("Error fetching instructions:", error);
      toast({ title: "Error", description: "Failed to fetch instructions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  const addInstruction = async (input: CreateInstructionInput) => {
    if (!user) return null;
    try {
      const { data, error } = await (supabase as any)
        .from("how_to_instructions")
        .insert({
          user_id: user.id,
          title: input.title,
          type: input.type,
          link: input.link || null,
          author_name: input.authorName,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchInstructions();
      return data.id as string;
    } catch (error: any) {
      console.error("Error creating instruction:", error);
      toast({ title: "Error", description: "Failed to create instruction", variant: "destructive" });
      return null;
    }
  };

  const updateInstruction = async (id: string, updates: Partial<CreateInstructionInput>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.link !== undefined) dbUpdates.link = updates.link || null;
      if (updates.authorName !== undefined) dbUpdates.author_name = updates.authorName;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

      const { error } = await (supabase as any)
        .from("how_to_instructions")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
      await fetchInstructions();
      return true;
    } catch (error: any) {
      console.error("Error updating instruction:", error);
      toast({ title: "Error", description: "Failed to update instruction", variant: "destructive" });
      return false;
    }
  };

  const deleteInstruction = async (id: string) => {
    try {
      // Delete files from storage first
      const instruction = instructions.find((i) => i.id === id);
      if (instruction) {
        for (const file of instruction.files) {
          await supabase.storage.from("instruction-files").remove([file.fileUrl]);
        }
      }

      const { error } = await (supabase as any)
        .from("how_to_instructions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setInstructions((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Deleted", description: "Instruction deleted" });
      return true;
    } catch (error: any) {
      console.error("Error deleting instruction:", error);
      toast({ title: "Error", description: "Failed to delete instruction", variant: "destructive" });
      return false;
    }
  };

  const uploadFile = async (instructionId: string, file: File) => {
    if (!user) return false;
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${instructionId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("instruction-files")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await (supabase as any)
        .from("instruction_files")
        .insert({
          instruction_id: instructionId,
          user_id: user.id,
          file_name: file.name,
          file_url: path,
          file_type: file.type,
        });

      if (dbError) throw dbError;
      await fetchInstructions();
      return true;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
      return false;
    }
  };

  const deleteFile = async (fileId: string, fileUrl: string) => {
    try {
      await supabase.storage.from("instruction-files").remove([fileUrl]);
      const { error } = await (supabase as any)
        .from("instruction_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;
      await fetchInstructions();
      toast({ title: "Deleted", description: "File removed" });
      return true;
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
      return false;
    }
  };

  return {
    instructions,
    loading,
    addInstruction,
    updateInstruction,
    deleteInstruction,
    uploadFile,
    deleteFile,
    refetch: fetchInstructions,
  };
}
