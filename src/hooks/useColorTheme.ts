import { useState, useEffect } from 'react';

export type ColorTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red';
export type BackgroundTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red' | 'black';

const COLOR_THEME_KEY = 'color-theme';
const BACKGROUND_THEME_KEY = 'background-theme';

export function useColorTheme() {
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
    root.classList.remove('bg-normal', 'bg-green', 'bg-blue', 'bg-grey', 'bg-red', 'bg-black');
    
    // Add the current background theme class
    root.classList.add(`bg-${backgroundTheme}`);
    
    // Save to localStorage
    localStorage.setItem(BACKGROUND_THEME_KEY, backgroundTheme);
  }, [backgroundTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
  };

  const setBackgroundTheme = (theme: BackgroundTheme) => {
    setBackgroundThemeState(theme);
  };

  return { colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme };
}
