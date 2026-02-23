import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ColorTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red';
export type BackgroundTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red' | 'black' | 'black-gold' | 'midnight-silver' | 'dark-emerald' | 'charcoal-rose';

const COLOR_THEME_KEY = 'color-theme';
const BACKGROUND_THEME_KEY = 'background-theme';

export function useColorTheme() {
  const { user } = useAuth();
  
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(COLOR_THEME_KEY) as ColorTheme) || 'normal';
    }
    return 'normal';
  });

  const [backgroundTheme, setBackgroundThemeState] = useState<BackgroundTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(BACKGROUND_THEME_KEY) as BackgroundTheme) || 'normal';
    }
    return 'normal';
  });

  const [loaded, setLoaded] = useState(false);

  // Load theme from database on mount
  useEffect(() => {
    const loadFromDatabase = async () => {
      if (!user) {
        setLoaded(true);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('color_theme, background_theme')
          .eq('user_id', user.id)
          .single();

        if (data) {
          if (data.color_theme) {
            setColorThemeState(data.color_theme as ColorTheme);
            localStorage.setItem(COLOR_THEME_KEY, data.color_theme);
          }
          if (data.background_theme) {
            setBackgroundThemeState(data.background_theme as BackgroundTheme);
            localStorage.setItem(BACKGROUND_THEME_KEY, data.background_theme);
          }
        }
      } catch (error) {
        console.error('Error loading theme from database:', error);
      } finally {
        setLoaded(true);
      }
    };

    loadFromDatabase();
  }, [user]);

  // Save to database
  const saveToDatabase = useCallback(async (colorT: ColorTheme, backgroundT: BackgroundTheme) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          color_theme: colorT,
          background_theme: backgroundT,
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving theme to database:', error);
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all color theme classes
    root.classList.remove('theme-normal', 'theme-green', 'theme-blue', 'theme-grey', 'theme-red');
    
    // Add the current color theme class
    root.classList.add(`theme-${colorTheme}`);
    
    // Save to localStorage
    localStorage.setItem(COLOR_THEME_KEY, colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all background theme classes
    root.classList.remove('bg-normal', 'bg-green', 'bg-blue', 'bg-grey', 'bg-red', 'bg-black', 'bg-black-gold', 'bg-midnight-silver', 'bg-dark-emerald', 'bg-charcoal-rose');
    
    // Add the current background theme class
    root.classList.add(`bg-${backgroundTheme}`);
    
    // Save to localStorage
    localStorage.setItem(BACKGROUND_THEME_KEY, backgroundTheme);
  }, [backgroundTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    saveToDatabase(theme, backgroundTheme);
  };

  const setBackgroundTheme = (theme: BackgroundTheme) => {
    setBackgroundThemeState(theme);
    saveToDatabase(colorTheme, theme);
  };

  return { colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme, loaded };
}
