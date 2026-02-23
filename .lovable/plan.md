
# Add "Light Text Mode" Toggle for Custom Background

## Overview
When you have a custom background image, the app currently uses light/white text on a dark overlay. This plan adds a toggle in Settings (under the background theme section) that switches to **black text on white/light semi-transparent cards** -- making it easier to read over bright background photos.

## What Changes

### 1. New CSS class for light custom background mode
In `src/index.css`, add a new variant `.bg-custom-light` that uses:
- Dark/black text (`--foreground: 0 0% 10%`)
- White semi-transparent cards and sidebar
- Dark borders and input styling
- Essentially the inverse of the current `.bg-custom` dark overlay

### 2. New setting in the color theme hook (`src/hooks/useColorTheme.ts`)
- Add a `customBgLight` boolean state (persisted to localStorage + database)
- When `backgroundTheme === 'custom'` and `customBgLight` is true, apply `bg-custom-light` class to the root instead of `bg-custom`
- Expose `customBgLight` and `setCustomBgLight` from the hook

### 3. Database column for persistence
- Add `custom_bg_light boolean DEFAULT false` to the `profiles` table via migration

### 4. Settings UI update (`src/pages/Settings.tsx`)
- When the custom background is active, show a toggle/switch labeled **"Light mode (white background, black text)"** below the background theme selector
- Toggling it switches between the dark overlay and light overlay styles

## Technical Details

### Files to create/modify
- **Migration**: Add `custom_bg_light` column to `profiles`
- **`src/index.css`**: Add `.bg-custom-light` CSS variables (white/light card backgrounds, dark text)
- **`src/hooks/useColorTheme.ts`**: Add `customBgLight` state, load/save to DB, toggle CSS class
- **`src/pages/Settings.tsx`**: Add Switch component when custom background is selected
- **`src/hooks/useProfile.ts`**: Add `customBgLight` to Profile interface (for consistency)
