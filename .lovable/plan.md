

# Fix: Apply Theme on Every Page Load

## Root Cause
The `useColorTheme()` hook is only called inside `Settings.tsx`. This means the background image, color theme, background theme, text color, and light mode are only applied to the DOM when you're on the Settings page. On reload of any other page, none of these theme effects run, so the background reverts to default.

## Solution
Call `useColorTheme()` at the app root level so all appearance settings are applied on every page load, regardless of which route the user is on.

## Changes

### 1. `src/App.tsx`
- Import `useColorTheme` in the `AppContent` component (which is inside `AuthProvider`, so `useAuth` works)
- Call `useColorTheme()` at the top of `AppContent` -- this ensures all the `useEffect` hooks that apply CSS classes and background image styles run on every page load

### 2. `src/pages/Settings.tsx`
- No changes needed here -- it can continue calling `useColorTheme()` for the settings UI controls. The hook uses `useState` with localStorage initialization, so having two instances won't conflict.

## Technical Detail
The fix is a single line addition in `AppContent`:
```typescript
import { useColorTheme } from '@/hooks/useColorTheme';

function AppContent() {
  useColorTheme(); // Apply theme on every page
  // ... existing code
}
```

This ensures the `useEffect` hooks inside `useColorTheme` always run, applying:
- Color theme class (`theme-gold`, etc.)
- Background theme class (`bg-custom`, etc.)
- Background image inline styles
- Custom text color class
- Light mode class

