

# Fix Background Image Not Persisting on Reload

## Problem
When the page reloads, the background image briefly disappears (or changes) because `backgroundImageUrl` is initialized as `null` and only gets set after an async database fetch. All other appearance settings (color theme, background theme, light mode, text color) are cached in `localStorage` for instant restore -- but the background image URL is not.

## Solution
Cache the `backgroundImageUrl` in `localStorage` just like the other theme settings. This way, on page load the image URL is available immediately from localStorage, and the background stays consistent while the database fetch confirms/updates the value.

## Changes

### File: `src/hooks/useColorTheme.ts`

1. Add a new localStorage key constant: `BACKGROUND_IMAGE_URL_KEY`
2. Initialize `backgroundImageUrl` state from localStorage instead of `null`
3. Save to localStorage whenever the background image URL changes (in the database load, in `setCustomBackgroundImage`, and in the background effect)
4. Clear it from localStorage when set to `null`

This is a single-file change with no database or CSS modifications needed.

