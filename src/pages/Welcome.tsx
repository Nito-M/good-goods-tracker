import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface WelcomeSettings {
  background_image_url: string | null;
  greeting_text: string;
  start_delay_ms: number;
  letter_stagger_ms: number;
  bg_animate_with_greeting: boolean;
  font_size_rem: number;
  position_x_pct: number;
  position_y_pct: number;
  text_align: 'left' | 'center' | 'right';
  bg_dim_pct: number;
}

const DEFAULTS: WelcomeSettings = {
  background_image_url: null,
  greeting_text: 'Welcome',
  start_delay_ms: 500,
  letter_stagger_ms: 50,
  bg_animate_with_greeting: false,
  font_size_rem: 8,
  position_x_pct: 50,
  position_y_pct: 50,
  text_align: 'center',
  bg_dim_pct: 40,
};

function AnimatedText({ text, baseDelay, stagger }: { text: string; baseDelay: number; stagger: number }) {
  return (
    <div className="flex whitespace-nowrap">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="welcome-mask-clip">
          <span
            className="welcome-animate-mask"
            style={{ animationDelay: `${baseDelay + i * stagger}ms` }}
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
  const [s, setS] = useState<WelcomeSettings>(DEFAULTS);
  const [bgAnimating, setBgAnimating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('app_welcome_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (cancelled || !data) return;
      setS({
        background_image_url: data.background_image_url,
        greeting_text: data.greeting_text || 'Welcome',
        start_delay_ms: data.start_delay_ms ?? 500,
        letter_stagger_ms: data.letter_stagger_ms ?? 50,
        bg_animate_with_greeting: data.bg_animate_with_greeting ?? false,
        font_size_rem: Number(data.font_size_rem ?? 8),
        position_x_pct: data.position_x_pct ?? 50,
        position_y_pct: data.position_y_pct ?? 50,
        text_align: (data.text_align ?? 'center') as 'left' | 'center' | 'right',
      });
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!s.bg_animate_with_greeting) {
      setBgAnimating(true);
      return;
    }
    setBgAnimating(false);
    const t = setTimeout(() => setBgAnimating(true), s.start_delay_ms);
    return () => clearTimeout(t);
  }, [s.bg_animate_with_greeting, s.start_delay_ms]);

  const name = profile?.displayName || '';
  const greetingDelay = s.start_delay_ms;
  const nameDelay = greetingDelay + s.greeting_text.length * s.letter_stagger_ms + 150;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
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

      {s.background_image_url && (
        <div
          className={`absolute inset-0 bg-cover bg-center ${bgAnimating ? 'welcome-bg-zoom' : ''}`}
          style={{ backgroundImage: `url(${s.background_image_url})` }}
        />
      )}

      <div className="absolute inset-0 bg-black/40" />

      <h1
        className="absolute z-10 font-black text-white uppercase tracking-tighter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] px-6"
        style={{
          left: `${s.position_x_pct}%`,
          top: `${s.position_y_pct}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: `clamp(2rem, ${s.font_size_rem}vw, ${s.font_size_rem}rem)`,
          textAlign: s.text_align,
          fontFamily: "'Inter', system-ui, sans-serif",
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 0.4em',
          justifyContent: s.text_align === 'left' ? 'flex-start' : s.text_align === 'right' ? 'flex-end' : 'center',
          maxWidth: '95vw',
        }}
      >
        <AnimatedText text={s.greeting_text} baseDelay={greetingDelay} stagger={s.letter_stagger_ms} />
        {name && <AnimatedText text={name} baseDelay={nameDelay} stagger={s.letter_stagger_ms} />}
      </h1>

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}
