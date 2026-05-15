import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export function Welcome() {
  const { profile } = useProfile();
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('app_welcome_settings')
        .select('background_image_url, greeting_text')
        .eq('id', 1)
        .maybeSingle();
      if (cancelled || !data) return;
      setBgUrl(data.background_image_url);
      setGreeting(data.greeting_text || 'Welcome');
    })();
    return () => { cancelled = true; };
  }, []);

  const name = profile?.displayName || '';

  return (
    <div
      className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-background"
      style={
        bgUrl
          ? {
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
          {greeting}{name ? ` ${name}` : ''}
        </h1>
      </div>
    </div>
  );
}
