import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface JobSidebarLink {
  id: string;
  label: string;
  jobId: string | null;
  displayOrder: number;
}

export function useJobSidebarLinks() {
  const [links, setLinks] = useState<JobSidebarLink[]>([]);
  const { user } = useAuth();

  const fetchLinks = useCallback(async () => {
    if (!user) { setLinks([]); return; }
    const { data } = await supabase
      .from('job_sidebar_links')
      .select('*')
      .order('display_order', { ascending: true });
    setLinks((data || []).map(d => ({
      id: d.id,
      label: d.label,
      jobId: d.job_id,
      displayOrder: d.display_order,
    })));
  }, [user]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (label: string, jobId?: string) => {
    if (!user) return false;
    const { error } = await supabase.from('job_sidebar_links').insert({
      user_id: user.id,
      label,
      job_id: jobId || null,
      display_order: links.length,
    });
    if (!error) await fetchLinks();
    return !error;
  };

  const removeLink = async (id: string) => {
    const { error } = await supabase.from('job_sidebar_links').delete().eq('id', id);
    if (!error) await fetchLinks();
    return !error;
  };

  const updateLink = async (id: string, label: string) => {
    const { error } = await supabase.from('job_sidebar_links').update({ label }).eq('id', id);
    if (!error) await fetchLinks();
    return !error;
  };

  return { links, addLink, removeLink, updateLink, refetch: fetchLinks };
}
