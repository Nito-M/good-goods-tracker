import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useNotesAi() {
  const [loading, setLoading] = useState<null | "summarize" | "rewrite">(null);
  const { toast } = useToast();

  const run = async (action: "summarize" | "rewrite", title: string, content: string): Promise<string | null> => {
    if (!content.trim()) {
      toast({ title: "Nothing to process", description: "Note is empty", variant: "destructive" });
      return null;
    }
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("notes-ai", {
        body: { action, title, content },
      });
      if (error) {
        const msg = (error as any)?.context?.error || error.message || "AI request failed";
        toast({ title: "AI error", description: msg, variant: "destructive" });
        return null;
      }
      if ((data as any)?.error) {
        toast({ title: "AI error", description: (data as any).error, variant: "destructive" });
        return null;
      }
      return (data as any)?.result || null;
    } finally {
      setLoading(null);
    }
  };

  return { loading, summarize: (t: string, c: string) => run("summarize", t, c), rewrite: (t: string, c: string) => run("rewrite", t, c) };
}
