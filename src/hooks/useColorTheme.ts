import { useState, useEffect } from 'react';

export type ColorTheme = 'normal' | 'green' | 'blue' | 'grey' | 'red';

const COLOR_THEME_KEY = 'color-theme';

export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(COLOR_THEME_KEY) as ColorTheme) || 'normal';
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

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
  };

  return { colorTheme, setColorTheme };
}
