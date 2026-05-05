import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Fetches a map of user_id -> display name for every profile the current
 * user can see (which, thanks to RLS, is themselves + everyone in their org).
 */
export function useOrgUserNames() {
  const { user } = useAuth();
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name");
      if (error || cancelled) return;
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => {
        map[p.user_id] = p.display_name || "Unknown";
      });
      setUserNames(map);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { userNames };
}
