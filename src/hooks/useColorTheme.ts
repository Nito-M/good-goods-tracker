import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ColorTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red' | 'yellow' | 'white' | 'purple' | 'pink' | 'orange' | 'gold';
export type BackgroundTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red' | 'black' | 'black-gold' | 'midnight-silver' | 'dark-emerald' | 'charcoal-rose' | 'custom';
export type CustomTextColor = 'default' | 'black' | 'white' | 'gold' | 'red' | 'blue' | 'grey' | 'green' | 'orange' | 'purple' | 'pink';
export type BorderColor = 'default' | 'normal' | 'green' | 'blue' | 'grey' | 'red' | 'yellow' | 'white' | 'purple' | 'pink' | 'orange' | 'gold';

export type CardOpacity = 0 | 25 | 50 | 75 | 100;

const COLOR_THEME_KEY = 'color-theme';
const BACKGROUND_THEME_KEY = 'background-theme';
const CUSTOM_BG_LIGHT_KEY = 'custom-bg-light';
const CUSTOM_TEXT_COLOR_KEY = 'custom-text-color';
const BACKGROUND_IMAGE_URL_KEY = 'background-image-url';
const CARD_OPACITY_KEY = 'card-opacity';
const BORDER_COLOR_KEY = 'border-color';

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

  const [customTextColor, setCustomTextColorState] = useState<CustomTextColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(CUSTOM_TEXT_COLOR_KEY) as CustomTextColor) || 'default';
    }
    return 'default';
  });

  const [cardOpacity, setCardOpacityState] = useState<CardOpacity>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CARD_OPACITY_KEY);
      return stored !== null ? (Number(stored) as CardOpacity) : 100;
    }
    return 100;
  });

  const [borderColor, setBorderColorState] = useState<BorderColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(BORDER_COLOR_KEY) as BorderColor) || 'default';
    }
    return 'default';
  });

  const [loaded, setLoaded] = useState(false);

  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(BACKGROUND_IMAGE_URL_KEY);
    }
    return null;
  });

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
          .select('color_theme, background_theme, background_image_url, custom_bg_light, custom_text_color, card_opacity, border_color')
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
            localStorage.setItem(BACKGROUND_IMAGE_URL_KEY, data.background_image_url);
          } else {
            setBackgroundImageUrl(null);
            localStorage.removeItem(BACKGROUND_IMAGE_URL_KEY);
          }
          const bgLight = data.custom_bg_light === true;
          setCustomBgLightState(bgLight);
          localStorage.setItem(CUSTOM_BG_LIGHT_KEY, String(bgLight));
          if (data.custom_text_color) {
            setCustomTextColorState(data.custom_text_color as CustomTextColor);
            localStorage.setItem(CUSTOM_TEXT_COLOR_KEY, data.custom_text_color);
          }
          const opacity = (data.card_opacity ?? 100) as CardOpacity;
          setCardOpacityState(opacity);
          localStorage.setItem(CARD_OPACITY_KEY, String(opacity));
          if (data.border_color) {
            setBorderColorState(data.border_color as BorderColor);
            localStorage.setItem(BORDER_COLOR_KEY, data.border_color);
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

  // Apply custom text color
  useEffect(() => {
    const root = document.documentElement;
    const textColorClasses = ['text-color-black', 'text-color-white', 'text-color-gold', 'text-color-red', 'text-color-blue', 'text-color-grey', 'text-color-green', 'text-color-orange', 'text-color-purple', 'text-color-pink'];
    root.classList.remove(...textColorClasses);
    
    if (backgroundTheme === 'custom' && customTextColor && customTextColor !== 'default') {
      root.classList.add(`text-color-${customTextColor}`);
    }
    localStorage.setItem(CUSTOM_TEXT_COLOR_KEY, customTextColor);
  }, [customTextColor, backgroundTheme]);

  // Apply card opacity
  useEffect(() => {
    const root = document.documentElement;
    if (backgroundTheme === 'custom') {
      root.style.setProperty('--card-opacity', String(cardOpacity / 100));
    } else {
      root.style.removeProperty('--card-opacity');
    }
  }, [cardOpacity, backgroundTheme]);

  // Apply border color
  useEffect(() => {
    const root = document.documentElement;
    const borderColorClasses = ['border-color-normal', 'border-color-green', 'border-color-blue', 'border-color-grey', 'border-color-red', 'border-color-yellow', 'border-color-white', 'border-color-purple', 'border-color-pink', 'border-color-orange', 'border-color-gold'];
    root.classList.remove(...borderColorClasses);
    
    if (borderColor && borderColor !== 'default') {
      root.classList.add(`border-color-${borderColor}`);
    }
    localStorage.setItem(BORDER_COLOR_KEY, borderColor);
  }, [borderColor]);

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

  const setCustomTextColor = async (color: CustomTextColor) => {
    setCustomTextColorState(color);
    localStorage.setItem(CUSTOM_TEXT_COLOR_KEY, color);
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({ custom_text_color: color === 'default' ? null : color })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving custom text color:', error);
    }
  };

  const setCustomBackgroundImage = async (url: string | null) => {
    setBackgroundImageUrl(url);
    if (url) {
      localStorage.setItem(BACKGROUND_IMAGE_URL_KEY, url);
    } else {
      localStorage.removeItem(BACKGROUND_IMAGE_URL_KEY);
    }
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

  const setCardOpacity = async (value: CardOpacity) => {
    setCardOpacityState(value);
    localStorage.setItem(CARD_OPACITY_KEY, String(value));
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({ card_opacity: value })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving card opacity:', error);
    }
  };

  const setBorderColor = async (color: BorderColor) => {
    setBorderColorState(color);
    localStorage.setItem(BORDER_COLOR_KEY, color);
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({ border_color: color === 'default' ? null : color })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving border color:', error);
    }
  };

  return { colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme, backgroundImageUrl, setCustomBackgroundImage, customBgLight, setCustomBgLight, customTextColor, setCustomTextColor, cardOpacity, setCardOpacity, borderColor, setBorderColor, loaded };
}
