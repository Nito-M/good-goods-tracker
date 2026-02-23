
# Add Designer Background Themes

## Overview
Add new visually striking background theme options beyond the current solid-color choices. These will be full theme presets that combine a background color with matching accent/button colors for a cohesive look.

## New Theme Options

1. **Black & Gold** -- Deep black background with warm gold primary buttons and accents
2. **Midnight Blue & Silver** -- Very dark navy background with cool silver/steel blue buttons
3. **Dark Emerald & Copper** -- Deep forest green background with warm copper/bronze accents
4. **Charcoal & Rose** -- Dark charcoal grey with soft rose/pink accent buttons

## Changes Required

### 1. Update the BackgroundTheme type (`src/hooks/useColorTheme.ts`)
- Extend the `BackgroundTheme` type to include new values: `'black-gold' | 'midnight-silver' | 'dark-emerald' | 'charcoal-rose'`
- Add the new class names to the remove list in the useEffect that manages background classes

### 2. Add CSS theme definitions (`src/index.css`)
- Add light-mode versions for each new theme (these are inherently dark, so light and dark will be similar)
- Add dark-mode versions for each
- Each theme sets `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border`, `--input`, plus overrides for `--primary`, `--primary-foreground`, `--ring`, and sidebar variables to match the accent color

Example color palettes:
- **Black & Gold**: Background #0a0a0a, cards #141414, primary gold at HSL(43, 90%, 55%), borders dark grey
- **Midnight Silver**: Background HSL(220, 30%, 6%), primary steel HSL(210, 20%, 70%)
- **Dark Emerald & Copper**: Background HSL(160, 30%, 6%), primary copper HSL(25, 70%, 55%)
- **Charcoal & Rose**: Background HSL(0, 0%, 10%), primary rose HSL(340, 65%, 60%)

### 3. Update Settings page (`src/pages/Settings.tsx`)
- Add the 4 new options to `backgroundThemeOptions` array with descriptive labels and representative swatch colors
- The swatches will show a split-color circle or a gradient-like visual to hint at the dual-tone nature

### 4. Update database column (if needed)
- The `background_theme` column likely stores a text value -- the new string values will work without schema changes as long as it's a text/varchar column
