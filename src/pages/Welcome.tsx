import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

function AnimatedText({ text, baseDelay }: { text: string; baseDelay: number }) {
  return (
    <div className="flex whitespace-nowrap">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="welcome-mask-clip">
          <span
            className="welcome-animate-mask"
            style={{ animationDelay: `${baseDelay + i * 50}ms` }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        </span>
      ))}
    </div>
  );
}

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
  const greetingDelay = 500;
  const nameDelay = greetingDelay + greeting.length * 50 + 150;

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
      <style>{`
        @keyframes welcomeMaskSlideUp {
          from { transform: translateY(110%); }
          to { transform: translateY(0); }
        }
        @keyframes welcomeSlowZoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        .welcome-mask-clip {
          overflow: hidden;
          display: inline-block;
          vertical-align: bottom;
          line-height: 1.1;
        }
        .welcome-animate-mask {
          display: inline-block;
          transform: translateY(110%);
          animation: welcomeMaskSlideUp 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .welcome-bg-zoom {
          animation: welcomeSlowZoom 20s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Background image with slow zoom */}
      {bgUrl && (
        <div
          className="absolute inset-0 welcome-bg-zoom bg-cover bg-center"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Animated headline */}
      <h1
        className="relative z-10 flex flex-wrap justify-center items-center gap-x-[0.4em] text-6xl md:text-9xl font-black text-white uppercase tracking-tighter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] px-6 text-center"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <AnimatedText text={greeting} baseDelay={greetingDelay} />
        {name && <AnimatedText text={name} baseDelay={nameDelay} />}
      </h1>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}
