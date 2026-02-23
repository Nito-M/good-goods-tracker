import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ColorTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red' | 'yellow' | 'white' | 'purple' | 'pink' | 'orange' | 'gold';
export type BackgroundTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red' | 'black' | 'black-gold' | 'midnight-silver' | 'dark-emerald' | 'charcoal-rose' | 'custom';

const COLOR_THEME_KEY = 'color-theme';
const BACKGROUND_THEME_KEY = 'background-theme';
const CUSTOM_BG_LIGHT_KEY = 'custom-bg-light';

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

  const [customBgLight, setCustomBgLightState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CUSTOM_BG_LIGHT_KEY) === 'true';
    }
    return false;
  });

  const [loaded, setLoaded] = useState(false);

  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);

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
          .select('color_theme, background_theme, background_image_url, custom_bg_light')
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
          if (data.background_image_url) {
            setBackgroundImageUrl(data.background_image_url);
          }
          const bgLight = data.custom_bg_light === true;
          setCustomBgLightState(bgLight);
          localStorage.setItem(CUSTOM_BG_LIGHT_KEY, String(bgLight));
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
    root.classList.remove('theme-normal', 'theme-green', 'theme-blue', 'theme-grey', 'theme-red', 'theme-yellow', 'theme-white', 'theme-purple', 'theme-pink', 'theme-orange', 'theme-gold');
    
    // Add the current color theme class
    root.classList.add(`theme-${colorTheme}`);
    
    // Save to localStorage
    localStorage.setItem(COLOR_THEME_KEY, colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all background theme classes
    root.classList.remove('bg-normal', 'bg-green', 'bg-blue', 'bg-grey', 'bg-red', 'bg-black', 'bg-black-gold', 'bg-midnight-silver', 'bg-dark-emerald', 'bg-charcoal-rose', 'bg-custom', 'bg-custom-light');
    
    // Add the current background theme class
    if (backgroundTheme === 'custom' && customBgLight) {
      root.classList.add('bg-custom-light');
    } else {
      root.classList.add(`bg-${backgroundTheme}`);
    }
    
    // Apply or remove background image
    if (backgroundTheme === 'custom' && backgroundImageUrl) {
      root.style.backgroundImage = `url(${backgroundImageUrl})`;
      root.style.backgroundSize = 'cover';
      root.style.backgroundPosition = 'center';
      root.style.backgroundAttachment = 'fixed';
      root.style.backgroundRepeat = 'no-repeat';
    } else {
      root.style.backgroundImage = '';
      root.style.backgroundSize = '';
      root.style.backgroundPosition = '';
      root.style.backgroundAttachment = '';
      root.style.backgroundRepeat = '';
    }
    
    // Save to localStorage
    localStorage.setItem(BACKGROUND_THEME_KEY, backgroundTheme);
  }, [backgroundTheme, backgroundImageUrl, customBgLight]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    saveToDatabase(theme, backgroundTheme);
  };

  const setBackgroundTheme = (theme: BackgroundTheme) => {
    setBackgroundThemeState(theme);
    saveToDatabase(colorTheme, theme);
  };

  const setCustomBgLight = async (value: boolean) => {
    setCustomBgLightState(value);
    localStorage.setItem(CUSTOM_BG_LIGHT_KEY, String(value));
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({ custom_bg_light: value })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving custom bg light:', error);
    }
  };

  const setCustomBackgroundImage = async (url: string | null) => {
    setBackgroundImageUrl(url);
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({ background_image_url: url })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving background image:', error);
    }
  };

  return { colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme, backgroundImageUrl, setCustomBackgroundImage, customBgLight, setCustomBgLight, loaded };
}
