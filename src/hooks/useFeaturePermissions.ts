import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useFeaturePermissions() {
  const { user } = useAuth();
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setFeatures([]); setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('user_feature_permissions' as any)
        .select('feature_key')
        .eq('user_id', user.id);
      setFeatures((data as any[] || []).map((d: any) => d.feature_key));
      setLoading(false);
    })();
  }, [user]);

  const hasFeature = (key: string) => features.includes(key);

  return { features, loading, hasFeature };
}
